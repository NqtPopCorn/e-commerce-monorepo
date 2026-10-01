import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private readonly defaultFrom: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST", "localhost");
    const port = Number(this.config.get<number>("SMTP_PORT", 1025));
    const secure = this.config.get<string>("SMTP_SECURE", "false") === "true";
    const user = this.config.get<string>("SMTP_USER", "");
    const pass = this.config.get<string>("SMTP_PASS", "");

    this.defaultFrom = this.config.get<string>(
      "SMTP_FROM",
      "Fashion Shop <no-reply@fashionshop.com>",
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      ignoreTLS: true, // Thích hợp cho môi trường dev với Mailpit
    });
  }

  /**
   * Cho phép mock hoặc ghi đè transporter trong unit test
   */
  setTransporter(transporter: Transporter) {
    this.transporter = transporter;
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<SendMailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(
        `[EMAIL SENT] Đã gửi thư tới "${options.to}" | Tiêu đề: "${options.subject}" | MessageId: ${info.messageId}`,
      );

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      this.logger.warn(
        `[EMAIL ERROR] Không thể gửi email tới "${options.to}": ${error.message}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 1. Gửi email mã OTP
   */
  async sendOtpEmail(
    email: string,
    otp: string,
    purpose = "Xác thực tài khoản",
  ): Promise<SendMailResult> {
    const subject = `[Fashion Shop] Mã xác thực OTP: ${otp}`;
    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }
          .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
          .header p { margin: 6px 0 0; color: #94a3b8; font-size: 14px; }
          .body { padding: 32px 24px; color: #334155; line-height: 1.6; }
          .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; }
          .note { font-size: 13px; color: #64748b; margin-top: 8px; }
          .alert { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px; font-size: 13px; color: #9a3412; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>FASHION SHOP</h1>
            <p>Mã xác thực bảo mật tài khoản</p>
          </div>
          <div class="body">
            <p>Xin chào quý khách,</p>
            <p>Quý khách vừa yêu cầu <strong>${purpose}</strong> tại Fashion Shop. Vui lòng sử dụng mã OTP dưới đây để hoàn tất thao tác:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="note">Mã xác thực có hiệu lực trong vòng <strong>5 phút</strong>.</div>
            </div>

            <div class="alert">
              ⚠️ <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã xác thực này cho bất kỳ ai, kể cả nhân viên Fashion Shop.
            </div>

            <p style="margin-top: 24px;">Nếu quý khách không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ ngay hotline chăm sóc khách hàng.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Fashion Shop. Hotline: 1900 6868 | contact@fashionshop.com
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: email,
      subject,
      html,
      text: `Mã OTP ${purpose} của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho ai.`,
    });
  }

  /**
   * 2. Gửi email cảm ơn và tóm tắt đơn hàng khi khách đặt hàng thành công
   */
  async sendOrderThankYouEmail(
    email: string,
    order: any,
  ): Promise<SendMailResult> {
    const customerName =
      [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
      order.recipientName ||
      "Quý khách";

    const totalFormatted = Number(order.total).toLocaleString("vi-VN") + "₫";
    const subtotalFormatted =
      Number(order.subtotal || order.total).toLocaleString("vi-VN") + "₫";
    const discountFormatted =
      Number(
        (order.productDiscount || 0) +
          (order.orderDiscount || 0) +
          (order.voucherDiscount || 0),
      ).toLocaleString("vi-VN") + "₫";

    const itemsHtml = (order.items || [])
      .map((item: any) => {
        const prod = item.variant?.product;
        const name = prod?.name || item.variant?.sku || "Sản phẩm";
        const spec = [item.variant?.size, item.variant?.color]
          .filter(Boolean)
          .join(" - ");
        const price =
          Number(item.finalUnitPrice || item.unitPrice || 0).toLocaleString(
            "vi-VN",
          ) + "₫";
        const lineTotal =
          Number(
            (item.finalUnitPrice || item.unitPrice || 0) * item.quantity,
          ).toLocaleString("vi-VN") + "₫";

        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">
              <div style="font-weight: 600; color: #1e293b;">${name}</div>
              ${spec ? `<div style="font-size: 12px; color: #64748b;">Phân loại: ${spec}</div>` : ""}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569;">x${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a;">${lineTotal}</td>
          </tr>
        `;
      })
      .join("");

    const subject = `[Fashion Shop] Cảm ơn quý khách! Đơn hàng #${order.id} đã được tạo thành công`;
    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #059669, #047857); color: #ffffff; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; }
          .header p { margin: 8px 0 0; color: #a7f3d0; font-size: 14px; }
          .body { padding: 32px 24px; color: #334155; line-height: 1.6; }
          .order-info { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
          .table th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
          .summary { margin-top: 20px; border-top: 2px dashed #cbd5e1; padding-top: 16px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>ĐẶT HÀNG THÀNH CÔNG!</h1>
            <p>Cảm ơn quý khách đã tin tưởng mua sắm cùng Fashion Shop</p>
          </div>
          <div class="body">
            <p>Chào <strong>${customerName}</strong>,</p>
            <p>Chúng tôi xin trân trọng thông báo đơn hàng <strong>#${order.id}</strong> của quý khách đã được tiếp nhận thành công và đang được chuẩn bị để đóng gói chuyển đi.</p>

            <div class="order-info">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Thông tin nhận hàng:</div>
              <div style="font-size: 13px; color: #475569;">
                <div><strong>Người nhận:</strong> ${order.recipientName || customerName} (${order.recipientPhone || "Chưa cung cấp"})</div>
                <div><strong>Địa chỉ:</strong> ${order.shippingAddress || "Tại cửa hàng"}</div>
                <div><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản"}</div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th style="text-align: center;">SL</th>
                  <th style="text-align: right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table style="width: 100%; margin-top: 16px; font-size: 14px;">
              <tr>
                <td style="color: #64748b;">Tạm tính:</td>
                <td style="text-align: right; font-weight: 600;">${subtotalFormatted}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Giảm giá:</td>
                <td style="text-align: right; color: #16a34a; font-weight: 600;">-${discountFormatted}</td>
              </tr>
              <tr>
                <td style="font-size: 16px; font-weight: bold; color: #0f172a; padding-top: 12px; border-top: 1px solid #e2e8f0;">Tổng thanh toán:</td>
                <td style="font-size: 18px; font-weight: bold; color: #059669; text-align: right; padding-top: 12px; border-top: 1px solid #e2e8f0;">${totalFormatted}</td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 28px;">
              <a href="http://localhost:5000/orders" class="btn">Theo Dõi Đơn Hàng Của Bạn</a>
            </div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Fashion Shop. Hotline giải đáp: 1900 6868
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: email,
      subject,
      html,
      text: `Cảm ơn bạn đã đặt hàng #${order.id} tại Fashion Shop! Tổng tiền: ${totalFormatted}. Chúng tôi đang tiến hành đóng gói và giao hàng.`,
    });
  }

  /**
   * 3. Gửi email cập nhật trạng thái đơn hàng (CONFIRMED, SHIPPING, COMPLETED, CANCELLED)
   */
  async sendOrderStatusEmail(
    email: string,
    order: any,
    oldStatus: string,
    newStatus: string,
  ): Promise<SendMailResult> {
    const customerName =
      [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
      order.recipientName ||
      "Quý khách";

    const totalFormatted = Number(order.total).toLocaleString("vi-VN") + "₫";

    let title = "Cập nhật đơn hàng";
    let statusText = newStatus;
    let badgeColor = "#2563eb";
    let desc = `Đơn hàng #${order.id} đã chuyển trạng thái sang: ${newStatus}.`;

    if (newStatus === "CONFIRMED") {
      title = "Đơn hàng đã được xác nhận";
      statusText = "ĐÃ XÁC NHẬN";
      badgeColor = "#2563eb";
      desc = `Đơn hàng #${order.id} của quý khách đã được xác nhận thành công và nhân viên đang tiến hành chuẩn bị sản phẩm.`;
    } else if (newStatus === "SHIPPING") {
      title = "Đơn hàng đang trên đường giao";
      statusText = "ĐANG GIAO HÀNG";
      badgeColor = "#7c3aed";
      desc = `Đơn hàng #${order.id} đã được bàn giao cho đối tác vận chuyển và đang trên đường đến địa chỉ của quý khách.`;
    } else if (newStatus === "COMPLETED") {
      title = "Đơn hàng đã giao thành công";
      statusText = "HOÀN TẤT";
      badgeColor = "#16a34a";
      desc = `Đơn hàng #${order.id} đã được giao thành công. Fashion Shop chân thành cảm ơn quý khách đã tin tưởng và đồng hành!`;
    } else if (newStatus === "CANCELLED") {
      title = "Đơn hàng đã bị hủy";
      statusText = "ĐÃ HỦY";
      badgeColor = "#dc2626";
      desc = `Đơn hàng #${order.id} đã bị hủy. Nếu có bất kỳ thắc mắc hoặc cần hoàn tiền, quý khách vui lòng liên hệ ngay với đội ngũ chăm sóc khách hàng.`;
    }

    const subject = `[Fashion Shop] ${title} #${order.id} (${statusText})`;
    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }
          .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { background: #1e293b; color: #ffffff; padding: 26px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; }
          .body { padding: 32px 24px; color: #334155; line-height: 1.6; }
          .badge-box { text-align: center; margin: 20px 0; }
          .badge { display: inline-block; background-color: ${badgeColor}; color: #ffffff; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 14px; letter-spacing: 1px; }
          .info-box { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; border: 1px solid #e2e8f0; }
          .btn { display: inline-block; background: #1e293b; color: #ffffff !important; text-decoration: none; padding: 12px 26px; border-radius: 6px; font-weight: 600; margin-top: 16px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>FASHION SHOP</h1>
          </div>
          <div class="body">
            <p>Chào <strong>${customerName}</strong>,</p>
            
            <div class="badge-box">
              <span class="badge">${statusText}</span>
            </div>

            <p style="font-size: 15px; color: #1e293b; text-align: center; margin: 16px 0;">${desc}</p>

            <div class="info-box">
              <div><strong>Mã đơn hàng:</strong> #${order.id}</div>
              <div><strong>Tổng tiền:</strong> ${totalFormatted}</div>
              <div><strong>Địa chỉ nhận:</strong> ${order.shippingAddress || "Tại cửa hàng"}</div>
              <div><strong>Thời gian cập nhật:</strong> ${new Date().toLocaleString("vi-VN")}</div>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="http://localhost:5000/orders" class="btn">Kiểm Tra Chi Tiết Đơn Hàng</a>
            </div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Fashion Shop. Hotline: 1900 6868
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: email,
      subject,
      html,
      text: `${title} #${order.id}: ${desc}. Tổng tiền: ${totalFormatted}.`,
    });
  }
}
