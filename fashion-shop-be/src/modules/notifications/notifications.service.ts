import { Injectable, NotFoundException } from "@nestjs/common";
import { MessageEvent } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationQueryDto } from "./dto/notification-query.dto";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { Role } from "@prisma/client";
import { filter, interval, map, merge, Observable, Subject } from "rxjs";

export interface RealtimeNotificationEvent {
  targetUserId: number;
  notification: any;
}

@Injectable()
export class NotificationsService {
  private readonly notificationSubject =
    new Subject<RealtimeNotificationEvent>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * SSE Stream cho 1 user cụ thể kèm heartbeat ping để duy trì kết nối
   */
  getStream(userId: number): Observable<MessageEvent> {
    const userEvents$ = this.notificationSubject.asObservable().pipe(
      filter((event) => event.targetUserId === userId),
      map(
        (event) =>
          ({
            type: "notification",
            data: event.notification,
          }) as MessageEvent,
      ),
    );

    const heartbeat$ = interval(25000).pipe(
      map(
        () =>
          ({
            type: "ping",
            data: { timestamp: Date.now() },
          }) as MessageEvent,
      ),
    );

    return merge(userEvents$, heartbeat$);
  }

  /**
   * Lấy danh sách thông báo phân trang của user
   */
  async getUserNotifications(userId: number, query: NotificationQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.unreadOnly) {
      where.isRead = false;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Đếm số lượng thông báo chưa đọc
   */
  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  async markAsRead(userId: number, id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException("Thông báo không tồn tại");
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Đánh dấu toàn bộ thông báo của user là đã đọc
   */
  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  /**
   * Xóa 1 thông báo
   */
  async deleteNotification(userId: number, id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException("Thông báo không tồn tại");
    }

    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Gửi thông báo đến 1 người dùng cụ thể và push real-time qua SSE
   */
  async notifyUser(userId: number, dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || "SYSTEM",
        level: dto.level || "INFO",
        link: dto.link,
        data: dto.data || undefined,
      },
    });

    // Phát real-time SSE event
    this.notificationSubject.next({
      targetUserId: userId,
      notification,
    });

    return notification;
  }

  /**
   * Gửi thông báo đến tất cả người dùng thuộc các role chỉ định (vd: ADMIN, STAFF)
   */
  async notifyRoles(roles: Role[], dto: CreateNotificationDto) {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: roles },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (users.length === 0) return [];

    const createdNotifications = await Promise.all(
      users.map(async (u) => {
        const notif = await this.prisma.notification.create({
          data: {
            userId: u.id,
            title: dto.title,
            message: dto.message,
            type: dto.type || "SYSTEM",
            level: dto.level || "INFO",
            link: dto.link,
            data: dto.data || undefined,
          },
        });

        this.notificationSubject.next({
          targetUserId: u.id,
          notification: notif,
        });

        return notif;
      }),
    );

    return createdNotifications;
  }
}
