-- CreateIndex
CREATE INDEX "orders_payment_status_idx" ON "orders"("payment_status");

-- CreateIndex
CREATE INDEX "payment_transactions_order_id_status_idx" ON "payment_transactions"("order_id", "status");
