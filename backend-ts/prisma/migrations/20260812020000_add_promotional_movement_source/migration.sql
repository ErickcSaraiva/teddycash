-- Phase 5: explicit origin for every TeddyCoin ledger movement.
-- Existing rows and balances are preserved and identified as legacy.

CREATE TYPE "TeddyCoinTransactionSource" AS ENUM (
  'CHECK_IN',
  'PAYMENT_ORDER',
  'GAME_SESSION',
  'CAMPAIGN',
  'ADMIN',
  'LEGACY'
);

ALTER TABLE "TeddyCoinTransaction"
  ADD COLUMN "source" "TeddyCoinTransactionSource" NOT NULL DEFAULT 'LEGACY';
