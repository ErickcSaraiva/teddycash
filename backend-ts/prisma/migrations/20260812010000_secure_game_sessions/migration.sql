-- Phase 3: secure, expiring and idempotent game sessions.
-- Existing rows are preserved. Legacy open sessions cannot be completed safely
-- because they were created without a secret token, so they become EXPIRED.

ALTER TYPE "GameSessionStatus" RENAME TO "GameSessionStatus_legacy";
CREATE TYPE "GameSessionStatus" AS ENUM ('STARTED', 'COMPLETED', 'EXPIRED', 'REJECTED');
ALTER TABLE "GameSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "GameSession" ALTER COLUMN "status" TYPE "GameSessionStatus" USING (
  CASE "status"::TEXT
    WHEN 'FINISHED' THEN 'COMPLETED'
    ELSE "status"::TEXT
  END::"GameSessionStatus"
);
ALTER TABLE "GameSession" ALTER COLUMN "status" SET DEFAULT 'STARTED';
DROP TYPE "GameSessionStatus_legacy";

ALTER TABLE "GameSession"
  ADD COLUMN "tokenHash" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "score" INTEGER,
  ADD COLUMN "eventCount" INTEGER,
  ADD COLUMN "resultHash" TEXT,
  ADD COLUMN "rejectedReason" TEXT;

UPDATE "GameSession"
SET "status" = 'EXPIRED', "expiresAt" = "startedAt", "finishedAt" = COALESCE("finishedAt", CURRENT_TIMESTAMP)
WHERE "status" = 'STARTED';

CREATE UNIQUE INDEX "GameSession_tokenHash_key" ON "GameSession"("tokenHash");
CREATE INDEX "GameSession_userId_gameId_startedAt_idx" ON "GameSession"("userId", "gameId", "startedAt");
CREATE INDEX "GameSession_status_expiresAt_idx" ON "GameSession"("status", "expiresAt");
