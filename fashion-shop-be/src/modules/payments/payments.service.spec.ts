import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PaymentsService } from "./payments.service";
import { VietQRService } from "./providers/vietqr.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let prisma: any;
  let auditLogsService: any;
  let eventEmitter: any;

  beforeEach(async () => {
    prisma = {
      paymentEvent: {
        create: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      paymentTransaction: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    auditLogsService = {
      log: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        VietQRService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogsService, useValue: auditLogsService },
        { provide: EventEmitter2, useValue: eventEmitter },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "VIETQR_WEBHOOK_API_KEY") return "test-api-key";
              if (key === "VIETQR_ACCOUNT_NO") return "0987654321";
              if (key === "VIETQR_BANK_BIN") return "970422";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("recordEvent (Idempotency Ledger)", () => {
    it("should return true for a new event", async () => {
      prisma.paymentEvent.create.mockResolvedValueOnce({ id: 1 });
      const result = await service.recordEvent("sepay", "evt_123");
      expect(result).toBe(true);
      expect(prisma.paymentEvent.create).toHaveBeenCalledWith({
        data: { source: "sepay", eventId: "evt_123" },
      });
    });

    it("should return false for duplicate event (Prisma P2002 error)", async () => {
      prisma.paymentEvent.create.mockRejectedValueOnce({ code: "P2002" });
      const result = await service.recordEvent("sepay", "evt_123");
      expect(result).toBe(false);
    });
  });

  describe("handleVietQRWebhook", () => {
    it("should reject webhook with invalid API key", async () => {
      await expect(
        service.handleVietQRWebhook(
          { id: 1, content: "DH101", transferAmount: 100000 },
          "Apikey wrong-key",
        ),
      ).rejects.toThrow("Invalid Webhook API Key");
    });

    it("should ignore duplicate webhook event based on idempotency ledger", async () => {
      prisma.paymentEvent.create.mockRejectedValueOnce({ code: "P2002" });
      const res = await service.handleVietQRWebhook(
        {
          id: 999,
          content: "DH101",
          transferAmount: 100000,
          transferType: "in",
        },
        "Apikey test-api-key",
      );
      expect(res.success).toBe(true);
      expect(res.message).toBe("Duplicate transaction ignored");
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it("should record partial payment transaction and keep order PENDING when underpaid", async () => {
      prisma.paymentEvent.create.mockResolvedValueOnce({ id: 1 });
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 101,
        total: 500000,
        paymentStatus: "UNPAID",
        status: "PENDING",
        userId: 1,
      });
      prisma.paymentTransaction.findMany.mockResolvedValueOnce([]);

      const res = await service.handleVietQRWebhook(
        {
          id: 1001,
          content: "DH101",
          transferAmount: 400000, // Underpaid: 400k < 500k
          transferType: "in",
        },
        "Apikey test-api-key",
      );

      expect(res.success).toBe(true);
      expect(res.message).toContain("Đã ghi nhận thanh toán một phần");
      // Since order was UNPAID, it updates order paymentStatus to PENDING (not PAID, not CONFIRMED)
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { paymentStatus: "PENDING" },
      });
      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "SUCCESS",
            amount: 400000,
            metadata: expect.objectContaining({
              isPartial: true,
              accumulatedPaid: 400000,
              remainingAmount: 100000,
            }),
          }),
        }),
      );
    });

    it("should mark order PAID and CONFIRMED when amount is sufficient", async () => {
      prisma.paymentEvent.create.mockResolvedValueOnce({ id: 1 });
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 102,
        total: 500000,
        paymentStatus: "UNPAID",
        status: "PENDING",
        userId: 1,
        user: { id: 1, email: "customer@example.com" },
      });
      prisma.paymentTransaction.findMany.mockResolvedValueOnce([]);

      const res = await service.handleVietQRWebhook(
        {
          id: 1002,
          content: "Thanh toan don hang DH102",
          transferAmount: 500000,
          transferType: "in",
        },
        "Apikey test-api-key",
      );

      expect(res.success).toBe(true);
      expect(res.orderId).toBe(102);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 102 },
          data: { paymentStatus: "PAID", status: "CONFIRMED" },
        }),
      );
      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "SUCCESS",
            amount: 500000,
            metadata: expect.objectContaining({
              isPartial: false,
              accumulatedPaid: 500000,
              remainingAmount: 0,
            }),
          }),
        }),
      );
      expect(auditLogsService.log).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "order.status_updated",
        expect.anything(),
      );
    });

    it("should complete order payment when accumulated partial payments reach total", async () => {
      prisma.paymentEvent.create.mockResolvedValueOnce({ id: 2 });
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 103,
        total: 500000,
        paymentStatus: "PENDING",
        status: "PENDING",
        userId: 1,
        user: { id: 1, email: "customer@example.com" },
      });
      // Already paid 200,000 previously
      prisma.paymentTransaction.findMany.mockResolvedValueOnce([
        { id: 1, amount: 200000, status: "SUCCESS" },
      ]);

      const res = await service.handleVietQRWebhook(
        {
          id: 1003,
          content: "DH103 bo sung",
          transferAmount: 300000, // 200k + 300k = 500k
          transferType: "in",
        },
        "Apikey test-api-key",
      );

      expect(res.success).toBe(true);
      expect(res.orderId).toBe(103);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 103 },
          data: { paymentStatus: "PAID", status: "CONFIRMED" },
        }),
      );
    });
  });

  describe("confirmVietQRManually", () => {
    it("should be idempotent and update order to PAID and CONFIRMED", async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 200,
        total: 350000,
        paymentStatus: "UNPAID",
        status: "PENDING",
      });
      prisma.order.update.mockResolvedValueOnce({
        id: 200,
        paymentStatus: "PAID",
        status: "CONFIRMED",
      });

      const res = await service.confirmVietQRManually(200, {
        id: 99,
        email: "admin@fashionshop.com",
        role: "ADMIN",
      });

      expect(res.paymentStatus).toBe("PAID");
      expect(res.status).toBe("CONFIRMED");
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "ORDER_PAYMENT_CONFIRMED_MANUAL",
          entityId: "200",
        }),
      );
    });
  });
});
