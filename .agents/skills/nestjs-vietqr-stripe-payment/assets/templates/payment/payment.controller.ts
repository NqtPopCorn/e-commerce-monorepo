import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

// TODO(project): put the project's auth guard on this controller and read the user id from
// whatever it attaches to the request (JWT payload, session, ...). Do NOT accept userId from the body.
interface AuthedRequest {
  user: { id: string };
}

@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  /** Create (or resume) a payment for an order. Returns Stripe redirect url or VietQR data. */
  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreatePaymentDto) {
    return this.payments.createPayment(req.user.id, dto);
  }

  /** Poll this from the client while the QR is on screen (every 2-3 s) until status != pending. */
  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.payments.getForUser(id, req.user.id);
  }
}
