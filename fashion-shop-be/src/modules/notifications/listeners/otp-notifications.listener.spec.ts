import { OtpNotificationsListener } from "./otp-notifications.listener";
import { OtpGeneratedEvent } from "../events/otp.events";

describe("OtpNotificationsListener", () => {
  let listener: OtpNotificationsListener;
  let mockMailService: any;
  let mockSmsService: any;

  beforeEach(() => {
    mockMailService = {
      sendOtpEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    mockSmsService = {
      sendOtpSms: jest.fn().mockResolvedValue({ success: true }),
    };

    listener = new OtpNotificationsListener(mockMailService, mockSmsService);
  });

  it("should send email when channel is EMAIL", async () => {
    await listener.handleOtpGenerated(
      new OtpGeneratedEvent(
        "test@example.com",
        "123456",
        "EMAIL",
        "quên mật khẩu",
      ),
    );

    expect(mockMailService.sendOtpEmail).toHaveBeenCalledWith(
      "test@example.com",
      "123456",
      "quên mật khẩu",
    );
    expect(mockSmsService.sendOtpSms).not.toHaveBeenCalled();
  });

  it("should send SMS when channel is SMS", async () => {
    await listener.handleOtpGenerated(
      new OtpGeneratedEvent("0912345678", "654321", "SMS", "xác thực"),
    );

    expect(mockSmsService.sendOtpSms).toHaveBeenCalledWith(
      "0912345678",
      "654321",
      "xác thực",
    );
    expect(mockMailService.sendOtpEmail).not.toHaveBeenCalled();
  });
});
