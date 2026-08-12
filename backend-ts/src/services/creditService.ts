import { CreditTransactionSource, CreditTransactionType, Prisma } from '@prisma/client';

type CreditMovementInput = {
  userId: string;
  amount: number;
  type: CreditTransactionType;
  source: CreditTransactionSource;
  referenceId: string;
  machineId?: string;
  channel?: 'QR' | 'NFC';
};

export class InsufficientCreditsError extends Error {}

function validateMovement(input: CreditMovementInput) {
  if (!Number.isSafeInteger(input.amount) || input.amount === 0) throw new Error('Credit amount must be a non-zero integer.');
  if (!input.referenceId.trim()) throw new Error('Credit referenceId is required.');
}

export async function recordCreditMovement(tx: Prisma.TransactionClient, input: CreditMovementInput) {
  validateMovement(input);
  const existing = await tx.transaction.findUnique({
    where: { userId_type_referenceId: { userId: input.userId, type: input.type, referenceId: input.referenceId } },
  });
  if (existing) return existing;

  if (input.amount < 0) {
    const debit = await tx.user.updateMany({
      where: { id: input.userId, creditBalance: { gte: -input.amount } },
      data: { creditBalance: { increment: input.amount } },
    });
    if (debit.count === 0) throw new InsufficientCreditsError('Insufficient paid credits.');
  } else {
    await tx.user.update({
      where: { id: input.userId },
      data: { creditBalance: { increment: input.amount } },
    });
  }

  const user = await tx.user.findUniqueOrThrow({ where: { id: input.userId }, select: { creditBalance: true } });
  return tx.transaction.create({
    data: {
      userId: input.userId,
      amount: input.amount,
      type: input.type,
      source: input.source,
      referenceId: input.referenceId,
      balanceAfter: user.creditBalance,
      machineId: input.machineId,
      channel: input.channel,
    },
  });
}
