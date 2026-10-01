export class OtpGeneratedEvent {
  constructor(
    public readonly target: string,
    public readonly code: string,
    public readonly channel: "EMAIL" | "SMS",
    public readonly purpose: string,
  ) {}
}
