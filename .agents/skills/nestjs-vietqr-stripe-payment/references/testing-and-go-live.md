# Testing and go-live

## Contents
- Local setup
- Testing Stripe
- Testing VietQR / SePay
- Automated tests worth writing
- Production checklist
- Troubleshooting

## Local setup

1. Copy `.env.example` values into `.env`. Use Stripe **test** keys.
2. Run the migration for `payments` and `payment_events`.
3. Start the API and expose it for webhooks only if the provider cannot reach localhost (SePay can; use a tunnel such as cloudflared or ngrok).

## Testing Stripe

```bash
stripe login
stripe listen --forward-to localhost:3000/payments/webhooks/stripe
# prints a signing secret (whsec_...): put it in STRIPE_WEBHOOK_SECRET and restart
```

1. `POST /payments { orderId, provider: "stripe" }` and open the returned URL.
2. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC. Expect `checkout.session.completed` in the listener, the payment row `succeeded`, and one `payment.succeeded` event.
3. Replay the event (`stripe events resend evt_...`): nothing should change and no second event is emitted.
4. 3-D Secure test card `4000 0025 0000 3155`; declined card `4000 0000 0000 9995`.
5. Refund from the Dashboard (or call `refundStripe`) and check `charge.refunded` moves the row to `refunded`.

`stripe trigger checkout.session.completed` creates fixture data with no `paymentId`, so it exercises signature verification but ends in "no matching payment"; that is expected.

## Testing VietQR / SePay

1. Create a payment with `provider: "vietqr"`. Scan the QR with a banking app (or paste `qrPayload` into any QR decoder) and check bank, account, amount and memo are right. A bank app rejecting the QR almost always means a CRC or field-length bug.
2. In SePay, switch to **Test mode**, configure the webhook (API Key auth, same key as `SEPAY_WEBHOOK_API_KEY`, payment-code prefix equal to `VIETQR_CODE_PREFIX`), and use the transaction simulator to send an incoming transfer with your memo and amount. Use the replay button to confirm duplicate deliveries do nothing.
3. Without SePay, simulate by hand:

```bash
curl -X POST localhost:3000/payments/webhooks/sepay \
  -H "Authorization: Apikey $SEPAY_WEBHOOK_API_KEY" -H "Content-Type: application/json" \
  -d '{"id":92704,"gateway":"Vietcombank","transactionDate":"2026-01-01 10:00:00",
       "accountNumber":"<VIETQR_ACCOUNT_NO>","content":"<transferCode> chuyen khoan",
       "transferType":"in","transferAmount":150000,"referenceCode":"FT123"}'
# expect {"success":true}; repeat it: still {"success":true}, payment unchanged
```

4. Try: wrong API key (401), wrong account number (ignored), amount lower than expected (stays pending), memo without code (logged as unmatched), transfer after `expiresAt` (accepted, warning).

## Automated tests worth writing

- **Unit, pure**: `crc16('123456789') === '29B1'`; `buildVietQrPayload` produces a string where `isValidVietQrPayload` is true and changing any digit makes it false; `extractTransferCode` handles lowercase, inserted spaces and bank prefixes.
- **Service with an in-memory or test-DB repository**: duplicate bank transaction credits once; two concurrent `handleBankTransfer` calls with the same id credit once; failure inside processing removes the dedupe row; Stripe `completed` then `refunded` then late `completed` ends as `refunded`; amount mismatch lands in `failed`.
- **Webhook controllers (supertest)**: bad Stripe signature gives 400; missing/incorrect SePay key gives 401; valid calls give 200 and the expected body. For Stripe, sign a payload with `stripe.webhooks.generateTestHeaderString({ payload, secret })`.
- Run the concurrency test against the real database (Testcontainers) because it is the only way to prove the guarded UPDATE and unique constraint behave.

## Production checklist

- [ ] Live Stripe keys; a **separate** webhook endpoint created in the live Dashboard with its own `whsec_`; subscribed to the events in `references/stripe.md`.
- [ ] HTTPS everywhere; webhook routes reachable from the internet and excluded from auth, CSRF and rate limiting.
- [ ] `rawBody: true` set, and no middleware before it that consumes or re-parses the body for the Stripe route.
- [ ] SePay webhook on the live account, authentication enabled (API key or HMAC), code prefix configured, correct receiving account linked.
- [ ] Secrets in a secret manager, not in the repo; webhook key at least 32 random characters.
- [ ] Migrations applied; unique indexes present (`transfer_code`, `(source, event_id)`).
- [ ] Alerting on log lines `Unmatched transfer`, `Underpaid`, `Overpaid`, `amount mismatch`, and on webhook 5xx rate.
- [ ] A reconciliation routine (daily): compare SePay/bank transactions and Stripe payments with `payments` rows.
- [ ] Order fulfilment listener is idempotent too (it may see the same event twice after a crash).
- [ ] Decided policies for under/over/late payments and communicated to support (see table in SKILL.md).
- [ ] Load: webhook handler responds within seconds; heavy work (emails, invoices) is queued from the `payment.succeeded` listener.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Stripe: `No signatures found matching the expected signature` | Body was parsed/modified (missing `rawBody: true`, or another body parser first), or wrong `whsec_` (CLI secret vs Dashboard secret vs another endpoint's) |
| `req.rawBody` is undefined | Nest < 10, Fastify without raw body config, or `bodyParser: false` set in `NestFactory.create` |
| Stripe: amount 100x too large/small | Converting VND as if it had cents; VND is zero-decimal |
| Bank app says QR is invalid | CRC wrong, a TLV length wrong, non-integer amount, or memo with diacritics/special characters |
| Transfer received but payment stays pending | Account number mismatch with config, memo edited by payer, prefix differs between config and aggregator, or webhook not authenticated (401 in aggregator logs) |
| Money credited twice | Dedupe missing or not unique at DB level; fulfilment listener not idempotent |
| SePay keeps retrying | Response is not HTTP 200/201 with `{"success": true}` (a response interceptor wrapped it, or an exception filter changed it) |
