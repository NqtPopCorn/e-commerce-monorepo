import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { OtpService } from "./otp.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { SendOtpDto } from "./dto/send-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { ResetPasswordOtpDto } from "./dto/reset-password-otp.dto";
import { JwtAuthGuard } from "./jwt.guard";
import { OtpType } from "@prisma/client";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post("register")
  register(@Body() dto: RegisterDto, @Request() req: any) {
    return this.authService.register(dto, req);
  }

  @Post("login")
  login(@Body() dto: LoginDto, @Request() req: any) {
    return this.authService.login(dto, req);
  }

  @ApiOperation({ summary: "Gửi mã OTP qua Email hoặc SMS" })
  @Post("otp/send")
  sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto);
  }

  @ApiOperation({ summary: "Xác thực mã OTP" })
  @Post("otp/verify")
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto);
  }

  @ApiOperation({ summary: "Đặt lại mật khẩu sử dụng mã OTP" })
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordOtpDto, @Request() req: any) {
    return this.otpService.resetPasswordWithOtp(dto, req);
  }

  @ApiOperation({ summary: "Gửi yêu cầu quên mật khẩu (tương thích ngược)" })
  @Post("forgot-password")
  forgotPassword(@Body() body: { email: string }) {
    return this.otpService.sendOtp({
      target: body.email,
      type: OtpType.FORGOT_PASSWORD,
      channel: "EMAIL",
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Request() req: any) {
    return req.user;
  }
}
