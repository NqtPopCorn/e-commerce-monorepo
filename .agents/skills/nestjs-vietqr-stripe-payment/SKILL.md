---
name: nestjs-vietqr-stripe-payment
description: Build or extend a payment module in a NestJS backend that accepts Stripe (card, Checkout Session, webhooks, refunds) and VietQR bank-transfer QR payments (NAPAS 247 QR generation, SePay/Casso-style bank webhook reconciliation, expiry). Use this skill whenever the user mentions thanh toán, tích hợp thanh toán, VietQR, QR chuyển khoản, QR ngân hàng, SePay, Casso, payOS, Stripe, Stripe webhook, checkout, payment gateway, or wants order payment, top-up, wallet deposit or subscription billing in NestJS/Node, even if they only name one of the two providers or do not say "skill" or "module".
---

# NestJS payments: Stripe + VietQR

This skill scaffolds and explains a provider-agnostic `payment` module for NestJS with two strategies:

- **Stripe**: hosted Checkout Session, signed webhooks, refunds. For cards and international customers.
- **VietQR**: a NAPAS 247 QR generated locally (no gateway fee, no API key), confirmed by a bank-transfer webhook from an aggregator (SePay in the templates; Casso/payOS plug into the same `BankTransferEvent`).

The two flows look different on the surface but share one rule that drives the whole design: **the browser is never the source of truth.** An order is paid only when a verified webhook says so, and the transition `pending -> succeeded` must happen exactly once even if the webhook is delivered five times.

Reply to the user in the language they write in (often Vietnamese). Code, identifiers and comments stay in English.

## Workflow

1. **Inspect the target project before writing anything.** Read `package.json`, `src/main.ts`, `src/app.module.ts`, and find the Order/Invoice domain. Establish:
   - NestJS version (>= 10 is needed for `rawBody: true`), Express vs Fastify.
   - ORM: TypeORM (templates ship with it), Prisma or Mongoose (adapt the repository; see `references/data-model.md`).
   - What is being paid for (order, wallet top-up, subscription) and where the amount comes from.
   - Auth mechanism (guard + how the user id reaches the request).
   - Whether the user needs one provider or both. Drop the unused provider rather than shipping dead code.
2. **Ask only what you cannot infer.** Typically: receiving bank (BIN + account number + holder name), which bank-notification service they use or will use (SePay is the default assumption), and the currencies. If the user just wants to get going, state your assumptions in one line and proceed.
3. **Scaffold** with `scripts/scaffold.sh <path-to-project> ` or copy `assets/templates/payment/` to `src/payment/` by hand. Then install dependencies (below).
4. **Wire the project in** (these are the parts templates cannot guess):
   - `main.ts`: `NestFactory.create(AppModule, { rawBody: true })` (see `main.ts.snippet`).
   - `AppModule`: import `PaymentModule`, `EventEmitterModule.forRoot()`, `ScheduleModule.forRoot()` (if VietQR), `ConfigModule` loading `.env`.
   - Implement `PayableOrderPort` over the real order service (`order-port.example.ts`) and provide it as `PAYABLE_ORDER_PORT`.
   - Add a listener on `payment.succeeded` that marks the order paid / credits the wallet / grants access.
   - Replace the auth TODOs in the controllers; make the two webhook routes public (no auth guard, no CSRF, no throttler, no response-transform interceptor that changes the `{ success: true }` shape).
   - Generate a migration for `payments` and `payment_events`. Never rely on `synchronize: true` in production.
5. **Configure** env vars from `.env.example`, then follow `references/testing-and-go-live.md` to verify with Stripe CLI and the SePay simulator.
6. **Tell the user what is left for them**: dashboard setup (Stripe webhook endpoint, SePay webhook with API Key auth and payment-code prefix), production secrets, and the policy decisions listed under "Policies to confirm".

## Check Stripe eligibility first (Vietnam-based sellers)

Stripe does not onboard businesses registered in Vietnam directly; several sources point to a foreign entity (for example a US LLC via Stripe Atlas) or another gateway as the usual routes. Before investing in the Stripe half, ask whether the user already has a Stripe account that can accept payments, and point them to stripe.com/global to confirm current availability. If they do not, the VietQR half works on its own, and the strategy interface makes it easy to add a Vietnam-licensed card gateway (VNPay, MoMo, payOS, OnePay) later. This does not affect customers paying from Vietnam; it concerns where the *merchant* is registered.

## Dependencies

```bash
npm i stripe qrcode @nestjs/config @nestjs/event-emitter @nestjs/schedule class-validator class-transformer
npm i -D @types/qrcode
# TypeORM projects: @nestjs/typeorm typeorm  (already present in most)
```

## Architecture

```
src/payment/
  payment.module.ts                 wiring; exports PaymentService
  payment.controller.ts             POST /payments, GET /payments/:id (auth required)
  payment.service.ts                orchestration + state machine + webhook handling
  payment.repository.ts             port (interface) -> payment.repository.typeorm.ts
  payment.entity.ts                 payments + payment_events (idempotency ledger)
  payment.types.ts / .constants.ts  records, enums, DI tokens, domain events
  payment.config.ts                 env -> typed config, fail-fast helper
  payment-expiry.task.ts            cron: expire stale VietQR rows
  providers/
    payment-provider.interface.ts   strategy contract + CheckoutInstructions union
    stripe.provider.ts              Checkout Session, refund
    vietqr.provider.ts              local QR generation
  webhooks/
    stripe-webhook.controller.ts    signature check on raw body
    sepay-webhook.controller.ts     API-key auth, payload -> BankTransferEvent
  utils/
    vietqr-emv.ts                   EMVCo/NAPAS payload + CRC16 (pure, unit-testable)
    transfer-code.ts                memo code generator / extractor
```

Adding another gateway later (MoMo, VNPay, payOS checkout) means adding one class that implements `PaymentProviderStrategy` plus one webhook controller. `PaymentService` does not change shape.

### State machine

```
            +--> succeeded --> refunded
pending ----+--> failed
            +--> expired --(late bank transfer)--> succeeded
            +--> canceled
```

Every transition goes through `repo.transition(id, allowedFrom, patch)`, a single conditional `UPDATE ... WHERE status IN (...)`. If it returns `null`, someone else already handled the event: do nothing and emit nothing. This one primitive makes duplicate webhooks, concurrent replicas and retries safe, so keep it atomic when porting to another ORM.

## Rules that prevent real incidents

Understand the reason behind each; they are the difference between a demo and something that can take money.

- **Amount and currency come from the server.** `CreatePaymentDto` has no amount field on purpose. A client-supplied amount lets someone pay 1 VND for a 1,000,000 VND order.
- **Integers only, in Stripe's smallest unit.** VND is zero-decimal on Stripe, so 50,000 VND is `unit_amount: 50000`, not 5000000. USD is cents. Never store floats.
- **Stripe signature verification needs the raw bytes.** `constructEvent(req.rawBody, ...)`. If the body was parsed and re-serialised, verification fails in confusing ways. The signing secret differs per endpoint and between `stripe listen` and the Dashboard.
- **Redirect pages are cosmetic.** `success_url` only shows a "thanks" page; fulfil from the webhook event. Customers close tabs, and delayed payment methods complete later.
- **Verify what the event says, not just that it is signed.** Compare `amount_total`/currency with the stored payment (done in `stripeSessionPaid`), and for bank transfers compare the account number, direction (`in`), and amount.
- **Bank webhooks have no signature standard.** Authenticate with the aggregator's mechanism (SePay: `Authorization: Apikey <key>`, compared with `timingSafeEqual`; SePay also offers HMAC-SHA256, prefer it if available to the user's plan and check current docs for the exact signing string). Keep the endpoint URL unguessable as a secondary measure, not the primary one.
- **De-duplicate bank transactions by the aggregator's transaction id** (`payment_events` unique `(source, eventId)`). Aggregators retry, and a double credit is real money.
- **Return 200 for events that cannot be matched.** Retrying an unmatched transfer never helps and floods the logs. Log it loudly (`Unmatched transfer ...`) and reconcile manually. Return 5xx only for transient failures where a retry could succeed. The service removes the dedupe record in that case so the retry is actually processed.
- **VietQR memo = payment code.** The code must be alphanumeric only (banks strip punctuation, uppercase everything, sometimes split with spaces). `extractTransferCode` squashes the memo before matching. Keep the code short (prefix + 10 chars); banks truncate memos around 25 chars.
- **A VietQR payment never expires on the bank side.** The QR keeps working forever, so expiry is application state (cron) and late money must be handled deliberately (see policies).
- **Idempotency keys on every Stripe write** (`checkout-session:<paymentId>`, `refund:<paymentId>`), so network retries cannot create two sessions or two refunds.
- **Do not log full webhook bodies or secrets.** Log ids and amounts.

## Policies to confirm with the user

The templates pick a safe default for each; mention them and let the user change them.

| Situation | Default in template | Alternative |
|---|---|---|
| Underpaid bank transfer | Stays `pending`, warning logged | Accumulate partial payments |
| Overpaid bank transfer | Succeeds, warning to refund the difference manually | Reject, or credit the surplus to a wallet |
| Transfer arrives after VietQR expiry | Accepted (`expired -> succeeded`) | Mark for manual refund |
| Stripe amount differs from stored amount | `failed` with reason `amount_mismatch` | Alert + manual review |
| Partial Stripe refund | Ignored (only full `charge.refunded` -> `refunded`) | Track `refundedAmount` |
| Refund of a VietQR payment | Not automated (bank transfers cannot be reversed by API) | Pay out through the bank's disbursement API |

## Client contract (what the frontend does)

- `POST /payments { orderId, provider }` returns `{ payment, instructions }`.
  - `instructions.type === 'redirect'`: `window.location = instructions.url` (Stripe Checkout).
  - `instructions.type === 'bank_qr'`: show `qrDataUrl` (or `quickLinkUrl`), plus bank account, amount and **content**, with a countdown to `expiresAt`. Tell the payer not to edit the content.
- While the QR is displayed, poll `GET /payments/:id` every 2 to 3 seconds until `payment.status !== 'pending'`. (SSE/WebSocket is a fine upgrade; the polling endpoint stays as the fallback.)
- After a Stripe redirect back, read the payment status the same way. It may still be `pending` for a moment while the webhook arrives.

## Reference files

Read only what the task needs:

- `references/vietqr.md`: how the QR payload is built, bank BINs, the hosted quick-link and API alternatives, memo-matching details, adapting Casso/payOS, static vs dynamic QR.
- `references/stripe.md`: Checkout vs PaymentIntent, event list, zero-decimal currencies, delayed payment methods, refunds, API version pinning, subscriptions pointers.
- `references/data-model.md`: SQL columns and constraints, Prisma schema and the `transition()` equivalent, Mongoose notes, migration advice.
- `references/testing-and-go-live.md`: local testing with Stripe CLI and the SePay simulator, unit tests worth writing, production checklist.

## Verified behaviour

`utils/vietqr-emv.ts` and `utils/transfer-code.ts` were exercised in isolation (CRC-16/CCITT-FALSE against the standard check value `123456789 -> 29B1`, payload structure, tamper detection, memo extraction with spacing/case noise). `PaymentService` was run against an in-memory repository covering duplicate deliveries, underpay, late payment after expiry, retry after a failed transition, Stripe amount mismatch and refunds. The NestJS wiring files (module, controllers, TypeORM repository) were written against the documented APIs but not compiled in a live project here: run `npm run build` and the e2e checks after scaffolding, and fix any version-specific type differences (notably `stripe` types and `RawBodyRequest`).
