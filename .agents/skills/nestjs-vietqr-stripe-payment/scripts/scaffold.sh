#!/usr/bin/env bash
# Copy the payment module templates into a NestJS project.
# Usage: scaffold.sh <project-root> [--no-overwrite]
# Never overwrites existing files unless you delete them first.
set -euo pipefail

PROJECT="${1:-}"
if [[ -z "$PROJECT" || ! -f "$PROJECT/package.json" ]]; then
  echo "usage: $0 <nestjs-project-root>   (directory containing package.json)" >&2
  exit 1
fi

SRC_DIR="$(cd "$(dirname "$0")/../assets/templates/payment" && pwd)"
DEST="$PROJECT/src/payment"
mkdir -p "$DEST"

copied=0; skipped=0
while IFS= read -r -d '' f; do
  rel="${f#"$SRC_DIR"/}"
  out="$DEST/$rel"
  mkdir -p "$(dirname "$out")"
  if [[ -e "$out" ]]; then
    echo "skip   (exists) src/payment/$rel"; skipped=$((skipped+1))
  else
    cp "$f" "$out"; echo "create src/payment/$rel"; copied=$((copied+1))
  fi
done < <(find "$SRC_DIR" -type f -print0)

echo
echo "Done: $copied created, $skipped skipped."
echo
echo "Next steps:"
echo "  1. npm i stripe qrcode @nestjs/config @nestjs/event-emitter @nestjs/schedule class-validator class-transformer"
echo "     npm i -D @types/qrcode"
echo "  2. Merge src/payment/.env.example into your .env, then delete the example files you no longer need"
echo "     (.env.example, main.ts.snippet, order-port.example.ts)."
echo "  3. main.ts: NestFactory.create(AppModule, { rawBody: true })   (see main.ts.snippet)"
echo "  4. AppModule: import PaymentModule, EventEmitterModule.forRoot(), ScheduleModule.forRoot()"
echo "  5. Provide PAYABLE_ORDER_PORT from your order service (see order-port.example.ts)."
echo "  6. Add auth guards to PaymentController; keep the two webhook routes public."
echo "  7. Generate and run a DB migration for payments + payment_events."
