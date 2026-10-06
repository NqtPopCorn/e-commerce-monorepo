import { OrderNotificationsListener } from "./order-notifications.listener";
import {
  OrderCancelledEvent,
  OrderCreatedEvent,
  OrderStatusUpdatedEvent,
} from "../events/order.events";

describe("OrderNotificationsListener", () => {
  let listener: OrderNotificationsListener;
  let mockPrisma: any;
  let mockNotificationsService: any;
  let mockMailService: any;
  let mockSmsService: any;

  beforeEach(() => {
    mockPrisma = {
      productVariant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          sku: "SHIRT-M",
          stock: 3,
          product: { name: "Áo sơ mi" },
        }),
      },
    };

    mockNotificationsService = {
      notifyUser: jest.fn().mockResolvedValue({ id: 1 }),
      notifyRoles: jest.fn().mockResolvedValue([]),
    };

    mockMailService = {
      sendOrderThankYouEmail: jest.fn().mockResolvedValue({ success: true }),
      sendOrderStatusEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    mockSmsService = {
      sendOrderThankYouSms: jest.fn().mockResolvedValue({ success: true }),
      sendOrderStatusSms: jest.fn().mockResolvedValue({ success: true }),
    };

    listener = new OrderNotificationsListener(
      mockPrisma,
      mockNotificationsService,
      mockMailService,
      mockSmsService,
    );
  });

  describe("handleOrderCreated", () => {
    it("should notify user, notify roles, check low stock, send thank you email and sms", async () => {
      const order = {
        id: 10,
        total: 250000,
        recipientName: "Nguyễn Văn A",
        recipientPhone: "0901112222",
        user: { email: "customer@example.com", firstName: "A" },
      };

      await listener.handleOrderCreated(
        new OrderCreatedEvent(order, 5, [{ variantId: 1, quantity: 2 }]),
      );

      expect(mockNotificationsService.notifyUser).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ type: "ORDER", level: "SUCCESS" }),
      );
      expect(mockNotificationsService.notifyRoles).toHaveBeenCalledWith(
        ["ADMIN", "STAFF"],
        expect.objectContaining({ title: "Đơn hàng mới" }),
      );
      expect(mockNotificationsService.notifyRoles).toHaveBeenCalledWith(
        ["ADMIN", "STAFF"],
        expect.objectContaining({ title: "Cảnh báo tồn kho thấp" }),
      );
      expect(mockMailService.sendOrderThankYouEmail).toHaveBeenCalledWith(
        "customer@example.com",
        order,
      );
      expect(mockSmsService.sendOrderThankYouSms).toHaveBeenCalledWith(
        "0901112222",
        expect.objectContaining({ id: 10, total: 250000 }),
      );
    });
  });

  describe("handleOrderStatusUpdated", () => {
    it("should notify user, send status email and sms", async () => {
      const order = {
        id: 20,
        userId: 7,
        recipientPhone: "0903334444",
        user: { email: "user7@example.com" },
      };

      await listener.handleOrderStatusUpdated(
        new OrderStatusUpdatedEvent(order, "PENDING", "CONFIRMED"),
      );

      expect(mockNotificationsService.notifyUser).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ title: "Đơn hàng đã được xác nhận" }),
      );
      expect(mockMailService.sendOrderStatusEmail).toHaveBeenCalledWith(
        "user7@example.com",
        order,
        "PENDING",
        "CONFIRMED",
      );
      expect(mockSmsService.sendOrderStatusSms).toHaveBeenCalledWith(
        "0903334444",
        expect.objectContaining({ id: 20, status: "CONFIRMED" }),
      );
    });
  });

  describe("handleOrderCancelled", () => {
    it("should notify roles, send cancellation email and sms", async () => {
      const order = {
        id: 30,
        userId: 8,
        recipientPhone: "0905556666",
        user: { email: "user8@example.com" },
      };

      await listener.handleOrderCancelled(new OrderCancelledEvent(order, 8));

      expect(mockNotificationsService.notifyRoles).toHaveBeenCalledWith(
        ["ADMIN", "STAFF"],
        expect.objectContaining({ title: "Đơn hàng đã bị hủy" }),
      );
      expect(mockMailService.sendOrderStatusEmail).toHaveBeenCalledWith(
        "user8@example.com",
        order,
        "PENDING",
        "CANCELLED",
      );
      expect(mockSmsService.sendOrderStatusSms).toHaveBeenCalledWith(
        "0905556666",
        expect.objectContaining({ id: 30, status: "CANCELLED" }),
      );
    });
  });
});
