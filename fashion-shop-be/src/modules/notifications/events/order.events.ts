export class OrderCreatedEvent {
  constructor(
    public readonly order: any,
    public readonly userId: number,
    public readonly rawItems: Array<{ variantId: number; quantity: number }>,
  ) {}
}

export class OrderStatusUpdatedEvent {
  constructor(
    public readonly order: any,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

export class OrderCancelledEvent {
  constructor(
    public readonly order: any,
    public readonly userId: number,
  ) {}
}
