import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';

const DEMO_USER = {
  id: 'user1',
  username: 'demo_user',
  email: 'demo@catchup.local',
};

async function ensureDemoUser() {
  return prisma.user.upsert({
    where: { id: DEMO_USER.id },
    update: {},
    create: {
      ...DEMO_USER,
      password: 'demo-password',
      balance: 1250,
      cashback: 0,
    },
  });
}

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const login = async (_req: Request, res: Response) => {
  const user = await ensureDemoUser();

  return res.json({
    access_token: 'mock-token',
    user_id: user.id,
  });
};

export const getBalance = async (req: Request, res: Response) => {
  const userId = getParamValue(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  const user = userId === DEMO_USER.id ? await ensureDemoUser() : await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({
    user_id: user.id,
    balance: user.balance,
    cashback: user.cashback,
  });
};

export const transfer = async (req: Request, res: Response) => {
  const userId = req.body.user_id ?? req.body.userId;
  const machineId = req.body.machine_id ?? req.body.machineId;
  const amount = Number(req.body.amount);

  if (!userId || !machineId || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'user_id, machine_id and a positive amount are required.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (!user) {
        return { status: 404 as const };
      }

      if (user.balance < amount) {
        return { status: 409 as const, balance: user.balance };
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });

      const txRecord = await tx.transaction.create({
        data: {
          userId,
          amount: -amount,
          machineId,
          type: 'MACHINE_UNLOCK',
        },
      });

      return { status: 200 as const, user: updatedUser, txRecord };
    });

    if (result.status === 404) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (result.status === 409) {
      return res.status(409).json({ error: 'Insufficient balance.', balance: result.balance });
    }

    return res.json({
      status: 'ok',
      tx: {
        id: result.txRecord.id,
        user_id: result.txRecord.userId,
        amount: Math.abs(result.txRecord.amount),
        machine_id: result.txRecord.machineId,
        type: result.txRecord.type,
        created_at: result.txRecord.createdAt,
      },
      balance: result.user.balance,
    });
  } catch (error) {
    console.error('Error processing transfer:', error);
    return res.status(500).json({ error: 'Internal error while processing transfer.' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  const userId = getParamValue(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(
    transactions.map((transaction) => ({
      id: transaction.id,
      user_id: transaction.userId,
      amount: Math.abs(transaction.amount),
      machine_id: transaction.machineId,
      type: transaction.type,
      created_at: transaction.createdAt,
    })),
  );
};
