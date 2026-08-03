/*
  Warnings:

  - Added the required column `gameId` to the `GameSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GameSessionStatus" AS ENUM ('STARTED', 'FINISHED');

-- CreateEnum
CREATE TYPE "TeddyCoinTransactionType" AS ENUM ('CREDIT_PURCHASE_REWARD', 'DAILY_CHECKIN', 'GAME_ENTRY', 'GAME_REWARD', 'CREDIT_REDEMPTION', 'ADMIN_ADJUSTMENT');

-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "gameId" TEXT NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "GameSessionStatus" NOT NULL DEFAULT 'STARTED',
ADD COLUMN     "won" BOOLEAN,
ALTER COLUMN "coinsEarned" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PaymentOrder" ADD COLUMN     "teddyCoins" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "teddyCoins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TeddyCoinTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TeddyCoinTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeddyCoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeddyCoinTransaction_userId_createdAt_idx" ON "TeddyCoinTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TeddyCoinTransaction_referenceId_idx" ON "TeddyCoinTransaction"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "TeddyCoinTransaction_userId_type_referenceId_key" ON "TeddyCoinTransaction"("userId", "type", "referenceId");

-- AddForeignKey
ALTER TABLE "TeddyCoinTransaction" ADD CONSTRAINT "TeddyCoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
