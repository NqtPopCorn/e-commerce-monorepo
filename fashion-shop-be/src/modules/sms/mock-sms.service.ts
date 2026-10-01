import { Injectable, Logger } from "@nestjs/common";
import { ISmsService, SendSmsResult } from "./sms.interface";

export interface MockSmsLog {
  id: string;
  to: string;
  message: string;
  type: "OTP" | "ORDER_THANK_YOU" | "ORDER_STATUS" | "RAW";
  createdAt: Date;
}

@Injectable()
export class MockSmsService implements ISmsService {
  private readonly logger = new Logger(MockSmsService.name);
  private recentMessages: MockSmsLog[] = [];

  async sendSms(
    to: string,
    message: string,
    type: MockSmsLog["type"] = "RAW",
  ): Promise<SendSmsResult> {
    const id = `mock_sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logItem: MockSmsLog = {
      id,
      to,
      message,
      type,
      createdAt: new Date(),
    };

    this.recentMessages.unshift(logItem);
    if (this.recentMessages.length > 50) {
      this.recentMessages.pop();
    }

    const separator = "═".repeat(64);
    this.logger.log(
      `\n╔${separator}╗\n` +
        `║ [MOCK SMS SENT] (${type})\n` +
        `║ ĐẾN:      ${to}\n` +
        `║ NỘI DUNG: ${message}\n` +
        `║ ID:       ${id}\n` +
        `║ THỜI GIAN:${logItem.createdAt.toISOString()}\n` +
        `╚${separator}╝`,
    );

    return {
      success: true,
      messageId: id,
    };
  }

  async sendOtpSms(
    phone: string,
    otp: string,
    purpose = "xác thực tài khoản",
  ): Promise<SendSmsResult> {
    const message = `[Fashion Shop] Ma OTP ${purpose} cua ban la: ${otp}. Hieu luc trong 5 phut. Tuyet doi khong chia se ma nay cho bat ky ai.`;
    return this.sendSms(phone, message, "OTP");
  }

  async sendOrderThankYouSms(
    phone: string,
    order: { id: number; total: number | string | any; recipientName?: string },
  ): Promise<SendSmsResult> {
    const name = order.recipientName ? ` ${order.recipientName}` : "";
    const totalFormatted = Number(order.total).toLocaleString("vi-VN") + "đ";
    const message = `[Fashion Shop] Cam on quy khach${name}! Don hang #${order.id} (Tong tien: ${totalFormatted}) da duoc tao thanh cong. Chung toi se som lien he va giao hang. Hotline: 1900 6868.`;
    return this.sendSms(phone, message, "ORDER_THANK_YOU");
  }

  async sendOrderStatusSms(
    phone: string,
    order: { id: number; status: string; recipientName?: string },
  ): Promise<SendSmsResult> {
    let statusDesc = `chuyen sang trang thai ${order.status}`;
    if (order.status === "CONFIRMED") {
      statusDesc = "da duoc XAC NHAN va dang chuan bi dong goi";
    } else if (order.status === "SHIPPING") {
      statusDesc = "dang tren duong GIAO den ban";
    } else if (order.status === "COMPLETED") {
      statusDesc = "da GIAO THANH CONG. Cam on ban da tin tuong mua sam";
    } else if (order.status === "CANCELLED") {
      statusDesc = "da BI HUY";
    }

    const message = `[Fashion Shop] Don hang #${order.id} ${statusDesc}. Chi tiet theo doi tai: http://localhost:5000/orders`;
    return this.sendSms(phone, message, "ORDER_STATUS");
  }

  getRecentMessages(): MockSmsLog[] {
    return [...this.recentMessages];
  }

  getLastMessage(phone?: string): MockSmsLog | undefined {
    if (!phone) return this.recentMessages[0];
    return this.recentMessages.find((m) => m.to === phone);
  }

  clear(): void {
    this.recentMessages = [];
  }
}
