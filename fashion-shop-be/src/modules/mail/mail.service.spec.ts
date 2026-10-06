import { ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service";

describe("MailService", () => {
  let service: MailService;
  let mockTransporter: any;

  beforeEach(() => {
    const config = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === "SMTP_HOST") return "localhost";
        if (key === "SMTP_PORT") return 1025;
        if (key === "SMTP_FROM")
          return "Fashion Shop <no-reply@fashionshop.com>";
        return defaultValue;
      }),
    } as unknown as ConfigService;

    service = new MailService(config);

    mockTransporter = {
      sendMail: jest
        .fn()
        .mockResolvedValue({ messageId: "mock-message-id-123" }),
    };

    service.setTransporter(mockTransporter);
  });

  it("should send email via transporter successfully", async () => {
    const result = await service.sendMail({
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("mock-message-id-123");
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      }),
    );
  });

  it("should handle error gracefully without throwing", async () => {
    mockTransporter.sendMail.mockRejectedValueOnce(
      new Error("SMTP Connection Refused"),
    );

    const result = await service.sendMail({
      to: "error@example.com",
      subject: "Fail Subject",
      html: "<p>Fail</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("SMTP Connection Refused");
  });

  it("should send OTP email with correct subject and template", async () => {
    const result = await service.sendOtpEmail(
      "user@example.com",
      "654321",
      "Quên mật khẩu",
    );
    expect(result.success).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: expect.stringContaining("654321"),
        html: expect.stringContaining("654321"),
      }),
    );
  });

  it("should send order thank you email with order details", async () => {
    const order = {
      id: 55,
      total: 350000,
      subtotal: 400000,
      voucherDiscount: 50000,
      recipientName: "Trần Thị B",
      recipientPhone: "0901234567",
      shippingAddress: "123 Lê Lợi, Q.1",
      paymentMethod: "COD",
      items: [
        {
          quantity: 2,
          finalUnitPrice: 175000,
          variant: {
            sku: "TSHIRT-M-WHITE",
            size: "M",
            color: "Trắng",
            product: { name: "Áo Thun Basic" },
          },
        },
      ],
    };

    const result = await service.sendOrderThankYouEmail(
      "customer@example.com",
      order,
    );
    expect(result.success).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "customer@example.com",
        subject: expect.stringContaining("#55"),
        html: expect.stringContaining("Áo Thun Basic"),
      }),
    );
  });

  it("should send order status email for confirmed status", async () => {
    const order = {
      id: 77,
      total: 200000,
      recipientName: "Lê Văn C",
    };

    const result = await service.sendOrderStatusEmail(
      "c@example.com",
      order,
      "PENDING",
      "CONFIRMED",
    );

    expect(result.success).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "c@example.com",
        subject: expect.stringContaining("ĐÃ XÁC NHẬN"),
      }),
    );
  });
});
