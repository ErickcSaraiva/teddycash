-- Phase 2: make paid credits explicit and add idempotency metadata to their ledger.
-- This migration preserves every existing balance and transaction row.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "User" WHERE "balance" < 0) THEN
    RAISE EXCEPTION 'Negative credit balances must be reviewed before this migration';
  END IF;
  IF EXISTS (SELECT 1 FROM "User" WHERE "teddyCoins" < 0) THEN
    RAISE EXCEPTION 'Negative TeddyCoin balances must be reviewed before this migration';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "Transaction"
    WHERE "type" NOT IN ('CREDIT_PURCHASE', 'MACHINE_UNLOCK', 'PIX_CREDIT', 'TEDDY_COIN_CREDIT_REDEMPTION')
  ) THEN
    RAISE EXCEPTION 'Unknown legacy credit transaction types must be mapped before this migration';
  END IF;
END $$;

ALTER TABLE "User" RENAME COLUMN "balance" TO "creditBalance";

CREATE TYPE "CreditTransactionType" AS ENUM (
  'CREDIT_PURCHASE',
  'MACHINE_UNLOCK',
  'ADMIN_ADJUSTMENT',
  'LEGACY_PIX_CREDIT',
  'LEGACY_TEDDY_COIN_REDEMPTION'
);
CREATE TYPE "CreditTransactionSource" AS ENUM (
  'PAYMENT_ORDER',
  'MACHINE_AUTHORIZATION',
  'ADMIN',
  'LEGACY'
);

ALTER TABLE "Transaction"
  ADD COLUMN "source" "CreditTransactionSource" NOT NULL DEFAULT 'LEGACY',
  ADD COLUMN "referenceId" TEXT,
  ADD COLUMN "balanceAfter" INTEGER;

ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "CreditTransactionType" USING (
  CASE "type"
    WHEN 'CREDIT_PURCHASE' THEN 'CREDIT_PURCHASE'
    WHEN 'MACHINE_UNLOCK' THEN 'MACHINE_UNLOCK'
    WHEN 'PIX_CREDIT' THEN 'LEGACY_PIX_CREDIT'
    WHEN 'TEDDY_COIN_CREDIT_REDEMPTION' THEN 'LEGACY_TEDDY_COIN_REDEMPTION'
  END::"CreditTransactionType"
);

CREATE INDEX "Transaction_referenceId_idx" ON "Transaction"("referenceId");
CREATE UNIQUE INDEX "Transaction_userId_type_referenceId_key"
  ON "Transaction"("userId", "type", "referenceId");

ALTER TABLE "User" ADD CONSTRAINT "User_creditBalance_nonnegative" CHECK ("creditBalance" >= 0);
ALTER TABLE "User" ADD CONSTRAINT "User_teddyCoins_nonnegative" CHECK ("teddyCoins" >= 0);
