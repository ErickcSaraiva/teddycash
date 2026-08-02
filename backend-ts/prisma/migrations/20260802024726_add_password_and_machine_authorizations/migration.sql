/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MachineAuthorizationStatus" AS ENUM ('PENDING', 'PROCESSING', 'CONSUMED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MachineAuthorization" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "channel" TEXT NOT NULL,
    "status" "MachineAuthorizationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MachineAuthorization_token_key" ON "MachineAuthorization"("token");

-- CreateIndex
CREATE INDEX "MachineAuthorization_machineId_status_idx" ON "MachineAuthorization"("machineId", "status");

-- CreateIndex
CREATE INDEX "MachineAuthorization_expiresAt_idx" ON "MachineAuthorization"("expiresAt");

-- CreateIndex
CREATE INDEX "MachineAuthorization_userId_createdAt_idx" ON "MachineAuthorization"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GameSession_userId_createdAt_idx" ON "GameSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_machineId_createdAt_idx" ON "Transaction"("machineId", "createdAt");

-- AddForeignKey
ALTER TABLE "MachineAuthorization" ADD CONSTRAINT "MachineAuthorization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
