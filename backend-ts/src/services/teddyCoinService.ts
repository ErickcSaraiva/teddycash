import { Prisma, TeddyCoinTransactionType } from '@prisma/client';
import { prisma } from '../config/prisma';

export class InsufficientTeddyCoinsError extends Error {
  constructor(public readonly required: number, public readonly available: number) {
    super('Insufficient TeddyCoins.');
  }
}

type MovementInput = {
  userId: string;
  amount: number;
  type: TeddyCoinTransactionType;
  referenceId?: string;
  description?: string;
};

function validateAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Amount must be a positive integer.');
}

export async function creditTeddyCoinsInTransaction(tx: Prisma.TransactionClient, input: MovementInput) {
  validateAmount(input.amount);
  if (input.referenceId) {
    const existing = await tx.teddyCoinTransaction.findUnique({
      where: { userId_type_referenceId: { userId: input.userId, type: input.type, referenceId: input.referenceId } },
    });
    if (existing) return existing;
  }

  const user = await tx.user.update({
    where: { id: input.userId },
    data: { teddyCoins: { increment: input.amount } },
    select: { teddyCoins: true },
  });
  return tx.teddyCoinTransaction.create({
    data: { ...input, balanceAfter: user.teddyCoins },
  });
}

export async function debitTeddyCoinsInTransaction(tx: Prisma.TransactionClient, input: MovementInput) {
  validateAmount(input.amount);
  if (input.referenceId) {
    const existing = await tx.teddyCoinTransaction.findUnique({
      where: { userId_type_referenceId: { userId: input.userId, type: input.type, referenceId: input.referenceId } },
    });
    if (existing) return existing;
  }

  const debit = await tx.user.updateMany({
    where: { id: input.userId, teddyCoins: { gte: input.amount } },
    data: { teddyCoins: { decrement: input.amount } },
  });
  if (debit.count === 0) {
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { teddyCoins: true } });
    if (!user) throw new Error('User not found.');
    throw new InsufficientTeddyCoinsError(input.amount, user.teddyCoins);
  }
  const user = await tx.user.findUniqueOrThrow({ where: { id: input.userId }, select: { teddyCoins: true } });
  return tx.teddyCoinTransaction.create({
    data: { ...input, amount: -input.amount, balanceAfter: user.teddyCoins },
  });
}

export function creditTeddyCoins(input: MovementInput) {
  return prisma.$transaction((tx) => creditTeddyCoinsInTransaction(tx, input));
}

export function debitTeddyCoins(input: MovementInput) {
  return prisma.$transaction((tx) => debitTeddyCoinsInTransaction(tx, input));
}

export async function getTeddyCoinBalance(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { teddyCoins: true } });
  if (!user) throw new Error('User not found.');
  return user.teddyCoins;
}

export async function getTeddyCoinHistory(userId: string, page: number, limit: number) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const [items, total] = await prisma.$transaction([
    prisma.teddyCoinTransaction.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, skip: (safePage - 1) * safeLimit, take: safeLimit,
    }),
    prisma.teddyCoinTransaction.count({ where: { userId } }),
  ]);
  return { items, page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) };
}
