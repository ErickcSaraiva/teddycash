-- Additive enum values for the auditable 500 TeddyCoins -> 1 play credit redemption.
-- No rows, balances or existing enum values are changed.

ALTER TYPE "CreditTransactionType" ADD VALUE IF NOT EXISTS 'TEDDYCOIN_CREDIT_REDEMPTION';
ALTER TYPE "CreditTransactionSource" ADD VALUE IF NOT EXISTS 'REWARD_REDEMPTION';
ALTER TYPE "TeddyCoinTransactionSource" ADD VALUE IF NOT EXISTS 'REWARD_REDEMPTION';
