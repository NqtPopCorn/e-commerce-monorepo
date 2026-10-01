// Example adapter: wire the payment module to YOUR order domain.
// Provide it in PaymentModule:  { provide: PAYABLE_ORDER_PORT, useExisting: OrdersPaymentAdapter }
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PayableOrder, PayableOrderPort } from './payment.types';

@Injectable()
export class OrdersPaymentAdapter implements PayableOrderPort {
  // constructor(private readonly orders: OrdersService) {}

  async getPayableOrder(orderId: string, userId: string): Promise<PayableOrder> {
    const order = await Promise.resolve<any>(null); // this.orders.findOne(orderId)
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException();
    if (order.status !== 'awaiting_payment') throw new ConflictException('Order is not payable');
    return {
      id: order.id,
      userId: order.userId,
      amount: order.totalAmount, // integer, smallest unit (VND: dong)
      currency: order.currency, // 'VND' | 'USD' ...
      description: `Order #${order.code}`,
      customerEmail: order.email,
    };
  }
}

// Fulfilment: react to the payment event, never to the browser redirect.
//
// @Injectable()
// export class OrderPaidListener {
//   @OnEvent(PAYMENT_SUCCEEDED_EVENT)
//   async onPaid(e: PaymentSucceededEvent) { await this.orders.markPaid(e.orderId, e.paymentId); }
// }
