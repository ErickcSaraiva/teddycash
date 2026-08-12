-- Phase 7: privacy requests, specific consent history, audit trail and session revocation.
-- Additive only. No account is deleted or anonymized by this migration.

CREATE TYPE "UserPrivacyStatus" AS ENUM ('ACTIVE', 'DELETION_PENDING', 'ANONYMIZED');
CREATE TYPE "PrivacyRequestType" AS ENUM ('EXPORT', 'DELETION');
CREATE TYPE "PrivacyRequestStatus" AS ENUM (
  'AWAITING_CONFIRMATION', 'PENDING_REVIEW', 'APPROVED', 'PROCESSING',
  'COMPLETED', 'REJECTED', 'CANCELLED'
);

ALTER TABLE "User"
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "privacyStatus" "UserPrivacyStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE "PrivacyRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "PrivacyRequestType" NOT NULL,
  "status" "PrivacyRequestStatus" NOT NULL,
  "noticeVersion" TEXT NOT NULL,
  "decisionReasonCode" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PrivacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PrivacyConsent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "noticeVersion" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "PrivacyConsent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PrivacyConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PrivacyAuditLog" (
  "id" TEXT NOT NULL,
  "actorHash" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetHash" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrivacyAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PrivacyRequest_userId_requestedAt_idx" ON "PrivacyRequest"("userId", "requestedAt");
CREATE INDEX "PrivacyRequest_status_requestedAt_idx" ON "PrivacyRequest"("status", "requestedAt");
CREATE INDEX "PrivacyConsent_userId_purpose_grantedAt_idx" ON "PrivacyConsent"("userId", "purpose", "grantedAt");
CREATE INDEX "PrivacyAuditLog_actorHash_occurredAt_idx" ON "PrivacyAuditLog"("actorHash", "occurredAt");
CREATE INDEX "PrivacyAuditLog_action_occurredAt_idx" ON "PrivacyAuditLog"("action", "occurredAt");
