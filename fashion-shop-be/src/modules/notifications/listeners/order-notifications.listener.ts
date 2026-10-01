import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../notifications.service";
import { MailService } from "../../mail/mail.service";
import { ISmsService, SMS_SERVICE } from "../../sms/sms.interface";
import {
  OrderCancelledEvent,
  OrderCreatedEvent,
  OrderStatusUpdatedEvent,
} from "../events/order.events";

@Injectable()
export class OrderNotificationsListener {
  private readonly logger = new Logger(OrderNotificationsListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    @Inject(SMS_SERVICE) private readonly smsService: ISmsService,
  ) {}

  /**
   * Xử lý thông báo bất đồng bộ khi đơn hàng mới được tạo (không block luồng tạo đơn)
   */
  @OnEvent("order.created", { async: true })
  async handleOrderCreated(event: OrderCreatedEvent) {
    const { order, userId, rawItems } = event;

    try {
      // 1. Gửi in-app notification cho khách hàng
      await this.notificationsService.notifyUser(userId, {
        title: "Đặt hàng thành công",
        message: `Đơn hàng #${order.id} đã được tạo thành công và đang chờ xác nhận.`,
        type: "ORDER",
        level: "SUCCESS",
        link: "/orders",
        data: { orderId: order.id },
      });

      // 2. Gửi in-app notification cho Quản trị viên và Nhân viên
      const customerName =
        [order.user?.firstName, order.user?.lastName]
          .filter(Boolean)
          .join(" ") ||
        order.recipientName ||
        "Khách hàng";
      const totalAmount = Number(order.total).toLocaleString("vi-VN") + "₫";

      await this.notificationsService.notifyRoles(["ADMIN", "STAFF"], {
        title: "Đơn hàng mới",
        message: `Đơn hàng #${order.id} vừa được đặt bởi ${customerName} (${totalAmount}).`,
        type: "ORDER",
        level: "INFO",
        link: "/admin/orders",
        data: { orderId: order.id },
      });

      // 3. Kiểm tra cảnh báo tồn kho thấp (nếu tồn kho <= 5)
      if (rawItems && rawItems.length > 0) {
        for (const item of rawItems) {
          const variant = await this.prisma.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });
          if (variant && variant.stock <= 5) {
            const prodName = variant.product?.name || variant.sku;
            const spec = [variant.size, variant.color]
              .filter(Boolean)
              .join(" - ");
            const specStr = spec ? ` (${spec})` : "";
            await this.notificationsService.notifyRoles(["ADMIN", "STAFF"], {
              title: "Cảnh báo tồn kho thấp",
              message: `Sản phẩm "${prodName}"${specStr} chỉ còn ${variant.stock} chiếc.`,
              type: "INVENTORY",
              level: "WARNING",
              link: "/admin/products",
              data: { variantId: variant.id, stock: variant.stock },
            });
          }
        }
      }

      // 4. Gửi Email cảm ơn & xác nhận đơn hàng
      const customerEmail = order.user?.email;
      if (customerEmail) {
        await this.mailService.sendOrderThankYouEmail(customerEmail, order);
      }

      // 5. Gửi SMS cảm ơn khách hàng
      const phone = order.recipientPhone || order.user?.phone;
      if (phone) {
        await this.smsService.sendOrderThankYouSms(phone, {
          id: order.id,
          total: Number(order.total),
          recipientName:
            order.recipientName || order.user?.firstName || undefined,
        });
      }

      this.logger.log(
        `[EVENT HANDLED] Đã gửi toàn bộ thông báo cho đơn hàng #${order.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi xử lý thông báo đơn hàng mới #${order?.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Xử lý thông báo bất đồng bộ khi trạng thái đơn hàng thay đổi
   */
  @OnEvent("order.status_updated", { async: true })
  async handleOrderStatusUpdated(event: OrderStatusUpdatedEvent) {
    const { order, oldStatus, newStatus } = event;

    try {
      let title = "Cập nhật đơn hàng";
      let message = `Đơn hàng #${order.id} đã chuyển sang trạng thái: ${newStatus}.`;
      let level: "INFO" | "SUCCESS" | "WARNING" | "ERROR" = "INFO";

      if (newStatus === "CONFIRMED") {
        title = "Đơn hàng đã được xác nhận";
        message = `Đơn hàng #${order.id} đã được xác nhận và đang đóng gói sản phẩm.`;
        level = "INFO";
      } else if (newStatus === "SHIPPING") {
        title = "Đơn hàng đang được giao";
        message = `Đơn hàng #${order.id} đang trên đường vận chuyển đến bạn.`;
        level = "INFO";
      } else if (newStatus === "COMPLETED") {
        title = "Đơn hàng đã hoàn tất";
        message = `Đơn hàng #${order.id} đã giao thành công. Cảm ơn bạn đã tin tưởng mua sắm!`;
        level = "SUCCESS";
      } else if (newStatus === "CANCELLED") {
        title = "Đơn hàng đã bị hủy";
        message = `Đơn hàng #${order.id} đã bị hủy bởi hệ thống/quản trị viên.`;
        level = "WARNING";
      }

      // 1. Gửi in-app notification
      await this.notificationsService.notifyUser(order.userId, {
        title,
        message,
        type: "ORDER",
        level,
        link: "/orders",
        data: { orderId: order.id, status: newStatus },
      });

      // 2. Gửi Email thông báo thay đổi trạng thái
      if (order.user?.email) {
        await this.mailService.sendOrderStatusEmail(
          order.user.email,
          order,
          oldStatus,
          newStatus,
        );
      }

      // 3. Gửi SMS thông báo thay đổi trạng thái
      const phone = order.recipientPhone || order.user?.phone;
      if (phone) {
        await this.smsService.sendOrderStatusSms(phone, {
          id: order.id,
          status: newStatus,
          recipientName:
            order.recipientName || order.user?.firstName || undefined,
        });
      }

      this.logger.log(
        `[EVENT HANDLED] Đã gửi thông báo đổi trạng thái đơn #${order.id} [${oldStatus} -> ${newStatus}]`,
      );
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi xử lý thông báo đổi trạng thái đơn #${order?.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Xử lý thông báo bất đồng bộ khi khách hàng hủy đơn hàng
   */
  @OnEvent("order.cancelled", { async: true })
  async handleOrderCancelled(event: OrderCancelledEvent) {
    const { order } = event;

    try {
      // 1. Thông báo cho Admin/Staff
      await this.notificationsService.notifyRoles(["ADMIN", "STAFF"], {
        title: "Đơn hàng đã bị hủy",
        message: `Khách hàng đã hủy đơn hàng #${order.id}.`,
        type: "ORDER",
        level: "WARNING",
        link: "/admin/orders",
        data: { orderId: order.id },
      });

      // 2. Gửi Email & SMS thông báo cho khách hàng
      const customerEmail = order.user?.email;
      if (customerEmail) {
        await this.mailService.sendOrderStatusEmail(
          customerEmail,
          order,
          "PENDING",
          "CANCELLED",
        );
      }
      const customerPhone = order.recipientPhone || order.user?.phone;
      if (customerPhone) {
        await this.smsService.sendOrderStatusSms(customerPhone, {
          id: order.id,
          status: "CANCELLED",
          recipientName:
            order.recipientName || order.user?.firstName || undefined,
        });
      }

      this.logger.log(`[EVENT HANDLED] Đã gửi thông báo hủy đơn #${order.id}`);
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi xử lý thông báo hủy đơn #${order?.id}: ${error.message}`,
        error.stack,
      );
    }
  }
}
