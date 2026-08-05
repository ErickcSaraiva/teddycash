-- Credits represent whole machine plays. Abort instead of silently rounding legacy data.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "User" WHERE "balance" <> trunc("balance"))
     OR EXISTS (SELECT 1 FROM "Transaction" WHERE "amount" <> trunc("amount"))
     OR EXISTS (SELECT 1 FROM "MachineAuthorization" WHERE "amount" <> trunc("amount")) THEN
    RAISE EXCEPTION 'Fractional credits must be corrected before applying this migration';
  END IF;
END $$;

ALTER TYPE "MachineAuthorizationStatus" ADD VALUE 'CANCELLED';
CREATE TYPE "MachineChannel" AS ENUM ('QR', 'NFC');

ALTER TABLE "User" ALTER COLUMN "balance" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "balance" TYPE INTEGER USING "balance"::INTEGER;
ALTER TABLE "User" ALTER COLUMN "balance" SET DEFAULT 0;
ALTER TABLE "Transaction" ALTER COLUMN "amount" TYPE INTEGER USING "amount"::INTEGER;
ALTER TABLE "MachineAuthorization" ALTER COLUMN "amount" TYPE INTEGER USING "amount"::INTEGER;
ALTER TABLE "MachineAuthorization" ALTER COLUMN "channel" TYPE "MachineChannel" USING "channel"::"MachineChannel";
ALTER TABLE "Transaction" ADD COLUMN "channel" "MachineChannel";

CREATE TABLE "Machine" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "qrEnabled" BOOLEAN NOT NULL DEFAULT true,
  "nfcEnabled" BOOLEAN NOT NULL DEFAULT false,
  "apiKeyHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);
