import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { randomBytes } from 'crypto';
import type { AuthRequest } from '../middlewares/authMiddleware';

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

export const getBalance = async (req: AuthRequest, res: Response) => {
  const userId = getParamValue(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  if (!req.userId || req.userId !== userId) {
    return res.status(403).json({ error: 'Access denied. You can only view your own balance.' });
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

export const transfer = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const machineId = req.body.machine_id ?? req.body.machineId;
  const amount = Number(req.body.amount);
  const channel = String(req.body.channel ?? '').toUpperCase();

  if (!userId || !machineId || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'machine_id and a positive amount are required.' });
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

export const getTransactions = async (req: AuthRequest, res: Response) => {
  const userId = getParamValue(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  if (!req.userId || req.userId !== userId) {
    return res.status(403).json({ error: 'Access denied. You can only view your own transactions.' });
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
const AUTHORIZATION_TTL_MS = 2 * 60 * 1000;

class InsufficientBalanceError extends Error {}

export const createMachineAuthorization = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const machineId = req.body.machine_id ?? req.body.machineId;
  const amount = Number(req.body.amount);
  const channel = String(req.body.channel ?? '').toUpperCase();

  if (
    !userId ||
    !machineId ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !['QR', 'NFC'].includes(channel)
  ) {
    return res.status(400).json({
      error: 'user_id, machine_id, amount positivo e channel (QR ou NFC) são obrigatórios.',
    });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (user.balance < amount) {
    return res.status(409).json({
      error: 'Insufficient balance.',
      balance: user.balance,
    });
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + AUTHORIZATION_TTL_MS);

  const authorization = await prisma.machineAuthorization.create({
    data: {
      token,
      userId,
      machineId,
      amount,
      channel,
      expiresAt,
    },
  });

  return res.status(201).json({
    status: 'pending',
    authorization_id: authorization.id,
    authorization_token: authorization.token,
    machine_id: authorization.machineId,
    amount: authorization.amount,
    channel: authorization.channel,
    expires_at: authorization.expiresAt,

    // Este texto será codificado no QR Code ou gravado no NFC.
    machine_payload: JSON.stringify({
      version: 1,
      token: authorization.token,
    }),
  });
};

export const redeemMachineAuthorization = async (req: Request, res: Response) => {
  const token = req.body.authorization_token ?? req.body.token;
  const machineId = req.body.machine_id ?? req.body.machineId;

  if (!token || !machineId) {
    return res.status(400).json({
      error: 'authorization_token e machine_id são obrigatórios.',
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // "Reserva" o token. Só uma leitura QR/NFC conseguirá prosseguir.
      const claim = await tx.machineAuthorization.updateMany({
        where: {
          token,
          machineId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
        data: { status: 'PROCESSING' },
      });

      if (claim.count === 0) {
        return { status: 'unavailable' as const };
      }

      const authorization = await tx.machineAuthorization.findUniqueOrThrow({
        where: { token },
      });

      // Débito condicional: impede saldo negativo mesmo com requisições simultâneas.
      const debit = await tx.user.updateMany({
        where: {
          id: authorization.userId,
          balance: { gte: authorization.amount },
        },
        data: {
          balance: { decrement: authorization.amount },
        },
      });

      if (debit.count === 0) {
        throw new InsufficientBalanceError();
      }

      const transactionType = channel === 'NFC' ? 'MACHINE_UNLOCK_NFC' : channel === 'QR' ? 'MACHINE_UNLOCK_QR' : 'MACHINE_UNLOCK';
      const transaction = await tx.transaction.create({
        data: {
          userId: authorization.userId,
          amount: -authorization.amount,
          machineId: authorization.machineId,
          type: transactionType,
        },
      });

      const consumed = await tx.machineAuthorization.update({
        where: { token },
        data: {
          status: 'CONSUMED',
          usedAt: new Date(),
        },
      });

      return {
        status: 'approved' as const,
        authorization: consumed,
        transaction,
      };
    });

    if (result.status === 'unavailable') {
      return res.status(409).json({
        error: 'Authorization inválida, expirada ou já utilizada.',
      });
    }

    return res.json({
      status: 'approved',
      machine_id: result.authorization.machineId,
      credits: result.authorization.amount,
      transaction_id: result.transaction.id,
      message: 'Libere a quantidade autorizada de jogadas.',
    });
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return res.status(409).json({ error: 'Insufficient balance.' });
    }

    console.error('Error redeeming machine authorization:', error);
    return res.status(500).json({
      error: 'Internal error while redeeming authorization.',
    });
  }
};