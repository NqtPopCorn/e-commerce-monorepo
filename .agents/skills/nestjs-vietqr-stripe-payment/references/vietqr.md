# VietQR reference

## Contents
- How a VietQR payment works end to end
- Generating the QR (three options)
- Payload anatomy
- Bank BINs
- Memo (transfer content) and matching
- Confirming payment: bank-notification services
- Static vs dynamic QR
- Pitfalls

## How a VietQR payment works end to end

VietQR is only a **way to encode "pay X to account Y with memo Z"** so a banking app can pre-fill a NAPAS 247 transfer. It has no callback. Nothing tells your server that money arrived unless something watches the receiving account. So a complete integration is always two halves:

1. **Show a QR** carrying amount + a unique memo (this skill generates it locally).
2. **Learn that the transfer happened** from an aggregator that watches the account and calls your webhook (SePay, Casso, payOS, or a bank's own notification API), then match the memo to the payment row.

## Generating the QR (three options)

| Option | When to use | Notes |
|---|---|---|
| **Local EMVCo build** (`utils/vietqr-emv.ts`, default) | Always a good default | Zero dependencies and no network call at checkout, so it cannot fail because a third party is down. Render the string with the `qrcode` package. |
| **Hosted image** `https://img.vietqr.io/image/<BIN>-<ACCOUNT>-<TEMPLATE>.png?amount=..&addInfo=..&accountName=..` | Quick frontend `<img>`, emails | Templates seen: `compact`, `compact2`, `qr_only`, `print`. The provider already returns it as `quickLinkUrl`. It depends on a third-party host. |
| **VietQR API** `POST https://api.vietqr.io/v2/generate` | You want their branded image / bank list | Needs a client id + API key in headers (`x-client-id`, `x-api-key`); body has `accountNo`, `accountName`, `acqId` (BIN), `amount`, `addInfo`, `template`. Check the current docs at vietqr.io before relying on field names. |

Prefer the local build for the payment path and use the hosted link only as a convenience.

## Payload anatomy

Fields are `ID(2) + LENGTH(2) + VALUE`, ids in ascending order:

```
00 02 01                         payload format
01 02 12                         12 = dynamic (amount present), 11 = static
38 .. 0010A000000727             NAPAS GUID
      01 .. 0006<BIN>01<len><acc>    beneficiary: bank BIN + account number
      02 08 QRIBFTTA             to account  (QRIBFTTC = to card)
53 03 704                        VND
54 .. <amount>                   integer dong, no separators
58 02 VN
62 .. 08 <len> <memo>            additional data: purpose of transaction
63 04 <CRC>                      CRC-16/CCITT-FALSE over the whole string including "6304"
```

A wrong CRC makes banking apps say "invalid QR", which is the usual symptom of a bug here. `isValidVietQrPayload()` re-checks it in tests. Memo characters must be ASCII without diacritics; `sanitizeTransferContent` strips them and caps at 25 characters.

## Bank BINs

Set `VIETQR_BANK_BIN` to the 6-digit acquirer BIN of the **receiving** bank. Commonly used (verify against the live list, `GET https://api.vietqr.io/v2/banks`, because banks merge and rebrand):

| Bank | BIN | Bank | BIN |
|---|---|---|---|
| Vietcombank | 970436 | VietinBank | 970415 |
| BIDV | 970418 | Agribank | 970405 |
| MB Bank | 970422 | Techcombank | 970407 |
| VPBank | 970432 | TPBank | 970423 |
| ACB | 970416 | Sacombank | 970403 |
| HDBank | 970437 | VIB | 970441 |
| MSB | 970426 | OCB | 970448 |
| SHB | 970443 | SeABank | 970440 |
| Eximbank | 970431 | | |

## Memo (transfer content) and matching

The memo is the join key between a bank statement line and your payment row.

- Format: `<PREFIX><10 random chars>` e.g. `PAYK3M9X2QT7A`. The alphabet omits I, O, 0, 1 so people can retype it.
- Banks uppercase memos, strip punctuation and may prepend their own reference (`MBVCB.123456.PAYK3M9...CT tu 0123...`). Hence `extractTransferCode()` removes all non-alphanumerics from the memo and regex-searches for `PREFIX + 10 chars`.
- Aggregators like SePay can pre-extract a "payment code" into the `code` field if you configure the same prefix in their dashboard. The service uses `code` when present and falls back to parsing the memo, so both work.
- Payers sometimes edit the memo anyway. Those transfers arrive **unmatched**: they are logged at WARN with the transaction id so support can reconcile by hand. Consider an admin endpoint that attaches an unmatched transaction to a payment.
- Make the code unique per payment (DB unique index), not per order, so re-trying a payment gets a fresh code.

## Confirming payment: bank-notification services

All of them reduce to: authenticated HTTP POST per incoming transaction containing id, account, amount, memo, direction, timestamp. Normalise into `BankTransferEvent` (see `payment.types.ts`) and call `PaymentService.handleBankTransfer()`.

**SePay** (implemented in `sepay-webhook.controller.ts`):
- Webhook payload fields used: `id`, `gateway`, `transactionDate` (VN local time, `YYYY-MM-DD HH:mm:ss`), `accountNumber`, `code`, `content`, `transferType` (`in`/`out`), `transferAmount`, `referenceCode`.
- Auth modes: none, API key (`Authorization: Apikey <key>`), OAuth 2.0, HMAC-SHA256 (`X-SePay-Signature: sha256=<hex>` plus `X-SePay-Timestamp`, signed over the raw body). The template implements API key. If the user wants HMAC, read the current SePay docs for the exact string that is signed and use `rawBody` as for Stripe.
- Success response: HTTP 200 or 201 with `{ "success": true }`. Anything else counts as failed and is retried. Timeouts are short (connect 5 s, response about 8 s), so acknowledge fast and do heavy fulfilment asynchronously via the event emitter.
- Their docs recommend de-duplicating on `id`, optionally combined with `referenceCode`, `transferType`, `transferAmount`.
- Has a Test mode with a transaction simulator and a "replay webhook" button, useful for the checklist in `testing-and-go-live.md`.

**Casso / payOS / bank APIs**: same pattern, different header names and field names. Write a small controller that authenticates per their docs, maps fields to `BankTransferEvent`, and calls the same service method. Do not copy field names from another provider; read the provider's current webhook docs.

## Static vs dynamic QR

A static QR (no amount, field `01` = `11`) lets the payer type any amount; use it for donations or a printed counter QR. For orders always use dynamic (amount + unique memo): the bank app locks the amount, which removes most underpayment support tickets.

## Pitfalls

- Using a **personal** account for production volume: aggregators and banks may restrict or require business accounts; check the aggregator's supported banks first.
- Forgetting that **QR never expires**: someone can scan an old QR days later. Handle late money deliberately (default: accept, because the cash is already in your account).
- Amount with decimals or thousands separators in field 54: must be a plain integer string.
- Sending amount in a non-VND currency: VietQR is VND only; `VietQrProvider.supportsCurrency()` rejects anything else.
- Trusting `transferType` blindly: always ignore `out` transactions, and check `accountNumber` equals your account (multi-account aggregator setups send everything to one webhook).
