export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ISmsService {
  sendSms(to: string, message: string): Promise<SendSmsResult>;
  sendOtpSms(
    phone: string,
    otp: string,
    purpose?: string,
  ): Promise<SendSmsResult>;
  sendOrderThankYouSms(
    phone: string,
    order: { id: number; total: number | string | any; recipientName?: string },
  ): Promise<SendSmsResult>;
  sendOrderStatusSms(
    phone: string,
    order: { id: number; status: string; recipientName?: string },
  ): Promise<SendSmsResult>;
}

export const SMS_SERVICE = Symbol("SMS_SERVICE");
