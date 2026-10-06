import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { NotFoundException } from "@nestjs/common";

describe("NotificationsService", () => {
  let service: NotificationsService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe("getUserNotifications", () => {
    it("should return paginated notifications and unread count", async () => {
      const mockItems = [
        {
          id: 1,
          userId: 10,
          title: "Đơn hàng mới",
          message: "Chi tiết",
          isRead: false,
          type: "ORDER",
        },
      ];
      prismaMock.notification.findMany.mockResolvedValue(mockItems as any);
      prismaMock.notification.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const result = await service.getUserNotifications(10, {
        page: 1,
        limit: 10,
      });
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.unreadCount).toBe(1);
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread count", async () => {
      prismaMock.notification.count.mockResolvedValue(3);
      const res = await service.getUnreadCount(5);
      expect(res.count).toBe(3);
    });
  });

  describe("markAsRead", () => {
    it("should update notification to read", async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: 10,
      } as any);
      prismaMock.notification.update.mockResolvedValue({
        id: 1,
        isRead: true,
      } as any);

      const res = await service.markAsRead(10, 1);
      expect(res.isRead).toBe(true);
    });

    it("should throw NotFoundException if notification does not belong to user", async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: 99,
      } as any);

      await expect(service.markAsRead(10, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all unread notifications as read", async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 5 } as any);
      const res = await service.markAllAsRead(10);
      expect(res.success).toBe(true);
    });
  });

  describe("notifyUser", () => {
    it("should create notification in DB", async () => {
      const mockCreated = {
        id: 1,
        userId: 10,
        title: "Test",
        message: "Message",
        type: "SYSTEM",
        level: "INFO",
      };
      prismaMock.notification.create.mockResolvedValue(mockCreated as any);

      const res = await service.notifyUser(10, {
        title: "Test",
        message: "Message",
      });
      expect(res.id).toBe(1);
      expect(res.userId).toBe(10);
    });
  });

  describe("notifyRoles", () => {
    it("should find users with roles and create notifications", async () => {
      prismaMock.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      prismaMock.notification.create
        .mockResolvedValueOnce({ id: 101, userId: 1 } as any)
        .mockResolvedValueOnce({ id: 102, userId: 2 } as any);

      const res = await service.notifyRoles(["ADMIN", "STAFF"], {
        title: "Cảnh báo",
        message: "Tồn kho thấp",
        type: "INVENTORY",
        level: "WARNING",
      });

      expect(res.length).toBe(2);
      expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);
    });
  });
});
