import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { AdminOrdersService } from "./admin-orders.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { NotFoundException } from "@nestjs/common";

describe("AdminOrdersService", () => {
  let service: AdminOrdersService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminOrdersService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: AuditLogsService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyUser: jest.fn().mockResolvedValue(undefined),
            notifyRoles: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<AdminOrdersService>(AdminOrdersService);
  });

  describe("findAll", () => {
    it("should return orders with status filter", async () => {
      prismaMock.order.findMany.mockResolvedValue([
        { id: 1, status: "PENDING" },
      ] as any);

      const res = await service.findAll("PENDING");
      expect(res.length).toBe(1);
    });
  });

  describe("updateStatus", () => {
    it("should update order status", async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.order.update.mockResolvedValue({
        id: 1,
        status: "CONFIRMED",
      } as any);

      const res = await service.updateStatus(1, "CONFIRMED");
      expect(res.status).toBe("CONFIRMED");
    });

    it("should throw NotFoundException on update if order missing", async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(999, "SHIPPED")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
