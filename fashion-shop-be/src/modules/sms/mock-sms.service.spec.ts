import { MockSmsService } from "./mock-sms.service";

describe("MockSmsService", () => {
  let service: MockSmsService;

  beforeEach(() => {
    service = new MockSmsService();
  });

  it("should send raw sms and store in recent messages", async () => {
    const res = await service.sendSms("0912345678", "Xin chao Fashion Shop");
    expect(res.success).toBe(true);
    expect(res.messageId).toBeDefined();

    const recent = service.getRecentMessages();
    expect(recent.length).toBe(1);
    expect(recent[0].to).toBe("0912345678");
    expect(recent[0].message).toBe("Xin chao Fashion Shop");
  });

  it("should send OTP sms with proper formatting", async () => {
    const res = await service.sendOtpSms(
      "0988888888",
      "123456",
      "quen mat khau",
    );
    expect(res.success).toBe(true);

    const last = service.getLastMessage("0988888888");
    expect(last).toBeDefined();
    expect(last?.message).toContain("123456");
    expect(last?.message).toContain("quen mat khau");
    expect(last?.type).toBe("OTP");
  });

  it("should send order thank you sms with total and order ID", async () => {
    const res = await service.sendOrderThankYouSms("0977777777", {
      id: 99,
      total: 500000,
      recipientName: "Nguyễn Văn A",
    });
    expect(res.success).toBe(true);

    const last = service.getLastMessage("0977777777");
    expect(last).toBeDefined();
    expect(last?.message).toContain("#99");
    expect(last?.message).toContain("500.000");
    expect(last?.message).toContain("Nguyễn Văn A");
  });

  it("should send order status sms for different statuses", async () => {
    await service.sendOrderStatusSms("0966666666", {
      id: 101,
      status: "CONFIRMED",
    });
    let last = service.getLastMessage("0966666666");
    expect(last?.message).toContain("XAC NHAN");

    await service.sendOrderStatusSms("0966666666", {
      id: 101,
      status: "SHIPPING",
    });
    last = service.getLastMessage("0966666666");
    expect(last?.message).toContain("GIAO");

    await service.sendOrderStatusSms("0966666666", {
      id: 101,
      status: "COMPLETED",
    });
    last = service.getLastMessage("0966666666");
    expect(last?.message).toContain("GIAO THANH CONG");

    await service.sendOrderStatusSms("0966666666", {
      id: 101,
      status: "CANCELLED",
    });
    last = service.getLastMessage("0966666666");
    expect(last?.message).toContain("BI HUY");
  });
});
