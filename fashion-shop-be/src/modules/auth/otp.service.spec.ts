import { BadRequestException, NotFoundException } from "@nestjs/common";
import { OtpType } from "@prisma/client";
import { OtpService } from "./otp.service";

describe("OtpService", () => {
  let service: OtpService;
  let mockPrisma: any;
  let mockEventEmitter: any;
  let mockAuditLogs: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      otpVerification: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 1, ...data }),
          ),
        findFirst: jest.fn(),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 1, ...data }),
          ),
      },
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockAuditLogs = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    service = new OtpService(mockPrisma, mockAuditLogs, mockEventEmitter);
  });

  describe("sendOtp", () => {
    it("should throw NotFoundException for forgot-password if user does not exist", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.sendOtp({
          target: "notfound@example.com",
          type: OtpType.FORGOT_PASSWORD,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should emit otp.generated with EMAIL channel when target is an email address", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: "user@example.com",
      });

      const res = await service.sendOtp({
        target: "user@example.com",
        type: OtpType.FORGOT_PASSWORD,
      });

      expect(res.success).toBe(true);
      expect(res.channel).toBe("EMAIL");
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "otp.generated",
        expect.objectContaining({
          target: "user@example.com",
          channel: "EMAIL",
          code: expect.any(String),
        }),
      );
    });

    it("should emit otp.generated with SMS channel when target is a phone number", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 2,
        phone: "0912345678",
      });

      const res = await service.sendOtp({
        target: "0912345678",
        type: OtpType.FORGOT_PASSWORD,
      });

      expect(res.success).toBe(true);
      expect(res.channel).toBe("SMS");
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "otp.generated",
        expect.objectContaining({
          target: "0912345678",
          channel: "SMS",
          code: expect.any(String),
        }),
      );
    });
  });

  describe("verifyOtp", () => {
    it("should throw BadRequestException if OTP record is not found", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ target: "user@example.com", code: "123456" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if OTP has expired", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue({
        id: 1,
        code: "123456",
        expiresAt: new Date(Date.now() - 1000), // expired
        attempts: 0,
      });

      await expect(
        service.verifyOtp({ target: "user@example.com", code: "123456" }),
      ).rejects.toThrow("Mã OTP đã hết hạn");
    });

    it("should throw BadRequestException and increment attempts if code does not match", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue({
        id: 1,
        code: "123456",
        expiresAt: new Date(Date.now() + 60000),
        attempts: 0,
      });

      await expect(
        service.verifyOtp({ target: "user@example.com", code: "999999" }),
      ).rejects.toThrow("Mã OTP không chính xác");

      expect(mockPrisma.otpVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { attempts: { increment: 1 } },
        }),
      );
    });

    it("should mark OTP as used if code matches", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue({
        id: 1,
        code: "123456",
        expiresAt: new Date(Date.now() + 60000),
        attempts: 0,
      });

      const res = await service.verifyOtp({
        target: "user@example.com",
        code: "123456",
      });
      expect(res.success).toBe(true);

      expect(mockPrisma.otpVerification.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { used: true },
      });
    });
  });

  describe("resetPasswordWithOtp", () => {
    it("should verify OTP, update user password and create audit log", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue({
        id: 1,
        code: "123456",
        expiresAt: new Date(Date.now() + 60000),
        attempts: 0,
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 10,
        email: "user@example.com",
        role: "CUSTOMER",
      });

      const res = await service.resetPasswordWithOtp({
        target: "user@example.com",
        code: "123456",
        newPassword: "NewSecretPassword123",
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: expect.objectContaining({ password: expect.any(String) }),
        }),
      );
      expect(mockAuditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "RESET_PASSWORD_OTP",
          userId: 10,
        }),
      );
    });
  });
});
