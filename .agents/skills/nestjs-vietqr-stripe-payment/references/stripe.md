# Stripe reference

## Contents
- Account eligibility
- Checkout Session vs PaymentIntent
- Events handled and why
- Amounts and currencies
- Delayed payment methods
- Refunds
- API versions and SDK
- Going further (subscriptions, Customers, SCA)

## Account eligibility

Stripe does not onboard Vietnam-registered businesses directly, so the merchant account usually belongs to a supported foreign entity. Confirm at stripe.com/global before building. Customers can still be located anywhere, including Vietnam, provided the merchant account's country supports it.

## Checkout Session vs PaymentIntent

The template uses **Stripe Checkout (hosted)**: Stripe renders the payment page, handles card validation, 3-D Secure/SCA, wallets and localisation, and your server never sees card data (PCI scope stays minimal). Use it unless the user needs a fully custom in-page form.

Switch to **PaymentIntent + Elements** only when a custom UI is required:
- Server: `stripe.paymentIntents.create({ amount, currency, metadata: { paymentId } }, { idempotencyKey })`, return `client_secret` in a new `CheckoutInstructions` variant (`{ type: 'client_secret', clientSecret }`).
- Client confirms with Stripe.js. Fulfilment still happens from `payment_intent.succeeded` / `payment_intent.payment_failed` webhooks, mapped by `metadata.paymentId`. The rest of the module (state machine, repository, events) is unchanged.

## Events handled and why

| Event | Action |
|---|---|
| `checkout.session.completed` | If `payment_status === 'paid'` mark succeeded. If `unpaid` (delayed method) wait. |
| `checkout.session.async_payment_succeeded` | Mark succeeded. |
| `checkout.session.async_payment_failed` | Mark failed. |
| `checkout.session.expired` | Mark expired (session TTL elapsed). |
| `charge.refunded` | `succeeded -> refunded` (full refunds only in the template). |

Register exactly these on the webhook endpoint in the Dashboard (plus any you add). Unknown events are acknowledged with 200 so Stripe does not retry them.

Stripe retries failed deliveries with backoff for days and delivers events **at least once and not necessarily in order**. The guarded `transition()` makes this harmless: a `completed` after a `refunded`, for example, finds the row in a state it may not leave and does nothing.

## Amounts and currencies

Amounts are integers in the currency's smallest unit **as defined by Stripe**. Zero-decimal currencies (including VND and JPY) are passed as whole units: 150,000 VND is `unit_amount: 150000`. Two-decimal currencies (USD, EUR, SGD) use cents: $19.99 is `1999`. The module stores amounts in exactly this form, so there is no conversion layer to get wrong. If the product uses decimal prices internally, convert once at the order boundary.

Check Stripe's minimum charge amount for the chosen currency; a very small VND total may be rejected by Stripe with an `amount_too_small` error, which surfaces as a failed `initiate()` and a payment marked `failed`.

If the shop prices in VND but the merchant account settles in another currency, Stripe converts at its rate and fees apply; mention this to the user because it affects margins.

## Delayed payment methods

Bank debits and some local methods confirm hours or days later. `checkout.session.completed` fires with `payment_status: 'unpaid'` first; the `async_payment_*` events finish the story. Never fulfil on `completed` alone for these; the template checks `payment_status`.

## Refunds

`PaymentService.refundStripe(paymentId)` creates a full refund on the PaymentIntent with an idempotency key. The status flips to `refunded` only when `charge.refunded` arrives, so the database reflects what Stripe confirmed. For partial refunds, add a `refundedAmount` column, accept an amount parameter, and switch on `charge.refunded` using `charge.amount_refunded`.

## API versions and SDK

stripe-node pins the API version it was built against, so upgrading the package can change object shapes. Pin the `stripe` dependency to an exact version in production, upgrade deliberately, and test webhooks against the same API version your endpoint receives (set in Dashboard > Developers > Webhooks). Passing `apiVersion` explicitly in `new Stripe()` is possible but must match the SDK's expected literal type.

## Going further

- **Subscriptions**: use `mode: 'subscription'` with Prices and handle `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated/deleted`. Store `stripeCustomerId` per user. This is a different aggregate from one-off payments; add it as a sibling service instead of overloading `payments`.
- **Customer portal / saved cards**: create a Customer, pass `customer`, and use Stripe's billing portal.
- **Tax / invoices**: Stripe Tax and Invoicing exist but have country limits; check availability for the merchant's country.
- **Disputes**: subscribe to `charge.dispute.created` and alert a human; evidence submission is a Dashboard task.
