import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { SePayWebhookDto } from "./dto/sepay-webhook.dto";
import { SimulatePaymentDto } from "./dto/simulate-payment.dto";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Get VietQR payment details for a specific order.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("vietqr/info/:orderId")
  async getVietQRInfo(
    @Param("orderId", ParseIntPipe) orderId: number,
    @Req() req: any,
  ) {
    return this.paymentsService.getVietQRInfo(req.user.id, orderId);
  }

  /**
   * Webhook endpoint to receive bank transfer notifications from SePay/aggregators.
   */
  @Post("vietqr/webhook")
  async handleVietQRWebhook(
    @Body() dto: SePayWebhookDto,
    @Headers("authorization") authHeader?: string,
  ) {
    return this.paymentsService.handleVietQRWebhook(dto, authHeader);
  }

  /**
   * Sandbox Simulator endpoint to test incoming bank transfers without external tunnel.
   */
  @Post("vietqr/simulate")
  async simulateVietQRPayment(@Body() dto: SimulatePaymentDto) {
    return this.paymentsService.simulatePayment(dto);
  }

  /**
   * Check payment status for polling from frontend.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("orders/:orderId/status")
  async getOrderStatus(
    @Param("orderId", ParseIntPipe) orderId: number,
    @Req() req: any,
  ) {
    return this.paymentsService.getOrderPaymentStatus(orderId, req.user?.id);
  }

  /**
   * Admin manual confirmation of VietQR payment.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post("orders/:orderId/confirm-vietqr")
  async confirmVietQR(
    @Param("orderId", ParseIntPipe) orderId: number,
    @Req() req: any,
  ) {
    return this.paymentsService.confirmVietQRManually(orderId, req.user, req);
  }
}
