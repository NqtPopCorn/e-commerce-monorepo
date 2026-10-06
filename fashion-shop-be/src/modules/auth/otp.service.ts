import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { OtpType } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { OtpGeneratedEvent } from "../notifications/events/otp.events";
import { SendOtpDto } from "./dto/send-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { ResetPasswordOtpDto } from "./dto/reset-password-otp.dto";

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Tạo và gửi mã OTP qua Email hoặc SMS
   */
  async sendOtp(dto: SendOtpDto) {
    const target = dto.target.trim().toLowerCase();
    const type = dto.type || OtpType.FORGOT_PASSWORD;

    // Kiểm tra tài khoản tồn tại nếu là quên mật khẩu
    if (type === OtpType.FORGOT_PASSWORD) {
      const isEmail = target.includes("@");
      const user = await this.prisma.user.findFirst({
        where: isEmail ? { email: target } : { phone: target },
      });

      if (!user) {
        throw new NotFoundException(
          "Không tìm thấy tài khoản với thông tin này",
        );
      }
    }

    // Tự động nhận diện kênh gửi
    const isEmail = target.includes("@");
    const channel: "EMAIL" | "SMS" = dto.channel || (isEmail ? "EMAIL" : "SMS");

    // Sinh mã ngẫu nhiên 6 chữ số
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // Vô hiệu hóa các mã OTP cũ chưa dùng của target này
    await this.prisma.otpVerification.updateMany({
      where: {
        target,
        type,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Lưu mã mới
    await this.prisma.otpVerification.create({
      data: {
        target,
        code,
        type,
        expiresAt,
        used: false,
        attempts: 0,
      },
    });

    let purposeText = "xác thực tài khoản";
    if (type === OtpType.FORGOT_PASSWORD) {
      purposeText = "đặt lại mật khẩu";
    } else if (type === OtpType.PHONE_VERIFICATION) {
      purposeText = "xác minh số điện thoại";
    }

    // Phát sinh sự kiện bất đồng bộ - không block phản hồi HTTP
    this.eventEmitter.emit(
      "otp.generated",
      new OtpGeneratedEvent(target, code, channel, purposeText),
    );

    this.logger.log(
      `Đã phát sinh OTP [${code}] tới ${channel}: ${target} (Hết hạn: ${expiresAt.toLocaleTimeString()})`,
    );

    return {
      success: true,
      message: `Mã OTP đã được gửi tới ${channel === "EMAIL" ? "email" : "số điện thoại"} của bạn`,
      channel,
      target,
      expiresInSeconds: 300,
    };
  }

  /**
   * Xác thực mã OTP
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const target = dto.target.trim().toLowerCase();
    const type = dto.type || OtpType.FORGOT_PASSWORD;

    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        target,
        type,
        used: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      throw new BadRequestException(
        "Mã OTP không tồn tại hoặc đã được sử dụng",
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException(
        "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới",
      );
    }

    if (otpRecord.attempts >= 5) {
      throw new BadRequestException(
        "Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng gửi lại yêu cầu mã mới",
      );
    }

    if (otpRecord.code !== dto.code.trim()) {
      await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("Mã OTP không chính xác");
    }

    // Đánh dấu mã đã sử dụng
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    return {
      success: true,
      message: "Xác thực mã OTP thành công",
    };
  }

  /**
   * Đặt lại mật khẩu sử dụng mã OTP
   */
  async resetPasswordWithOtp(dto: ResetPasswordOtpDto, req?: any) {
    // 1. Xác thực OTP
    await this.verifyOtp({
      target: dto.target,
      code: dto.code,
      type: OtpType.FORGOT_PASSWORD,
    });

    const target = dto.target.trim().toLowerCase();
    const isEmail = target.includes("@");

    // 2. Tìm người dùng
    const user = await this.prisma.user.findFirst({
      where: isEmail ? { email: target } : { phone: target },
    });

    if (!user) {
      throw new NotFoundException("Người dùng không tồn tại");
    }

    // 3. Cập nhật mật khẩu mới
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 4. Ghi audit log
    await this.auditLogsService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: "RESET_PASSWORD_OTP",
      entityType: "AUTH",
      entityId: String(user.id),
      description: `Đặt lại mật khẩu thành công qua OTP (${dto.target})`,
      status: "SUCCESS",
    });

    return {
      success: true,
      message:
        "Đặt lại mật khẩu thành công. Quý khách có thể đăng nhập ngay với mật khẩu mới.",
    };
  }
}
