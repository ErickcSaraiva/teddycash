import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { prisma } from '../config/prisma';
import type { AuthRequest } from '../middlewares/authMiddleware';
import type { MachineRequest } from '../middlewares/machineAuthMiddleware';

const AUTHORIZATION_TTL_MS = 2 * 60 * 1000;
const MAX_CREDITS_PER_AUTHORIZATION = 10;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

class InsufficientBalanceError extends Error {}

function apiError(res: Response, status: number, code: string, message: string, details = {}) {
  return res.status(status).json({ error: { code, message }, ...details });
}

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const getBalance = async (req: AuthRequest, res: Response) => {
  const userId = getParamValue(req.params.userId);
  if (!userId) return apiError(res, 400, 'USER_ID_REQUIRED', 'userId e obrigatorio.');
  if (!req.userId || req.userId !== userId) {
    return apiError(res, 403, 'ACCESS_DENIED', 'Voce so pode consultar o proprio saldo.');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return apiError(res, 404, 'USER_NOT_FOUND', 'Usuario nao encontrado.');

  return res.json({ user_id: user.id, balance: user.balance, cashback: user.cashback });
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  const userId = getParamValue(req.params.userId);
  if (!userId) return apiError(res, 400, 'USER_ID_REQUIRED', 'userId e obrigatorio.');
  if (!req.userId || req.userId !== userId) {
    return apiError(res, 403, 'ACCESS_DENIED', 'Voce so pode consultar as proprias transacoes.');
  }

  const page = positiveInteger(req.query.page) ?? 1;
  const limit = Math.min(positiveInteger(req.query.limit) ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const where = { userId };
  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return res.json({
    items: transactions.map((transaction) => ({
      id: transaction.id,
      user_id: transaction.userId,
      amount: transaction.amount,
      absolute_amount: Math.abs(transaction.amount),
      direction: transaction.amount >= 0 ? 'CREDIT' : 'DEBIT',
      machine_id: transaction.machineId,
      channel: transaction.channel,
      type: transaction.type,
      created_at: transaction.createdAt,
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  });
};

export const createMachineAuthorization = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const machineId = String(req.body.machine_id ?? req.body.machineId ?? '').trim();
  const amount = positiveInteger(req.body.amount);
  const channel = String(req.body.channel ?? '').toUpperCase();

  if (!userId || !machineId || amount === null || !['QR', 'NFC'].includes(channel)) {
    return apiError(
      res,
      400,
      'INVALID_AUTHORIZATION_REQUEST',
      'machine_id, amount inteiro positivo e channel (QR ou NFC) sao obrigatorios.',
    );
  }
  if (amount > MAX_CREDITS_PER_AUTHORIZATION) {
    return apiError(
      res,
      400,
      'AUTHORIZATION_LIMIT_EXCEEDED',
      `O maximo permitido e ${MAX_CREDITS_PER_AUTHORIZATION} creditos.`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Serializa criacoes do mesmo usuario, garantindo no maximo uma PENDING.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const [user, machine] = await Promise.all([
      tx.user.findUnique({ where: { id: userId } }),
      tx.machine.findUnique({ where: { id: machineId } }),
    ]);

    if (!user) return { status: 'user_not_found' as const };
    if (!machine?.active) return { status: 'machine_unavailable' as const };
    if ((channel === 'QR' && !machine.qrEnabled) || (channel === 'NFC' && !machine.nfcEnabled)) {
      return { status: 'channel_unavailable' as const };
    }
    if (user.balance < amount) return { status: 'insufficient' as const, balance: user.balance };

    await tx.machineAuthorization.updateMany({
      where: { userId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    const authorization = await tx.machineAuthorization.create({
      data: {
        token: randomBytes(32).toString('hex'),
        userId,
        machineId,
        amount,
        channel: channel as 'QR' | 'NFC',
        expiresAt: new Date(Date.now() + AUTHORIZATION_TTL_MS),
      },
    });
    return { status: 'created' as const, authorization };
  });

  if (result.status === 'user_not_found') {
    return apiError(res, 404, 'USER_NOT_FOUND', 'Usuario nao encontrado.');
  }
  if (result.status === 'machine_unavailable') {
    return apiError(res, 404, 'MACHINE_UNAVAILABLE', 'Maquina inexistente ou inativa.');
  }
  if (result.status === 'channel_unavailable') {
    return apiError(res, 409, 'CHANNEL_UNAVAILABLE', 'A maquina nao aceita o canal solicitado.');
  }
  if (result.status === 'insufficient') {
    return apiError(res, 409, 'INSUFFICIENT_BALANCE', 'Saldo insuficiente.', { balance: result.balance });
  }

  const { authorization } = result;
  return res.status(201).json({
    status: 'pending',
    authorization_id: authorization.id,
    authorization_token: authorization.token,
    machine_id: authorization.machineId,
    amount: authorization.amount,
    channel: authorization.channel,
    expires_at: authorization.expiresAt,
    machine_payload: JSON.stringify({ version: 1, token: authorization.token }),
  });
};

export const getMachineAuthorization = async (req: AuthRequest, res: Response) => {
  const authorizationId = getParamValue(req.params.authorizationId);
  if (!authorizationId || !req.userId) {
    return apiError(res, 400, 'AUTHORIZATION_ID_REQUIRED', 'authorizationId e obrigatorio.');
  }

  const authorization = await prisma.machineAuthorization.findFirst({
    where: { id: authorizationId, userId: req.userId },
  });
  if (!authorization) {
    return apiError(res, 404, 'AUTHORIZATION_NOT_FOUND', 'Autorizacao nao encontrada.');
  }

  const status = authorization.status === 'PENDING' && authorization.expiresAt <= new Date()
    ? 'EXPIRED'
    : authorization.status;
  return res.json({
    authorization_id: authorization.id,
    status: status.toLowerCase(),
    machine_id: authorization.machineId,
    amount: authorization.amount,
    channel: authorization.channel,
    expires_at: authorization.expiresAt,
    consumed_at: authorization.usedAt,
  });
};

export const redeemMachineAuthorization = async (req: MachineRequest, res: Response) => {
  const token = String(req.body.authorization_token ?? req.body.token ?? '').trim();
  const machineId = req.authenticatedMachineId;
  if (!token || !machineId) {
    return apiError(res, 400, 'AUTHORIZATION_TOKEN_REQUIRED', 'authorization_token e obrigatorio.');
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.machineAuthorization.updateMany({
        where: { token, machineId, status: 'PENDING', expiresAt: { gt: new Date() } },
        data: { status: 'PROCESSING' },
      });
      if (claim.count === 0) return { status: 'unavailable' as const };

      const authorization = await tx.machineAuthorization.findUniqueOrThrow({ where: { token } });
      const debit = await tx.user.updateMany({
        where: { id: authorization.userId, balance: { gte: authorization.amount } },
        data: { balance: { decrement: authorization.amount } },
      });
      if (debit.count === 0) throw new InsufficientBalanceError();

      const transaction = await tx.transaction.create({
        data: {
          userId: authorization.userId,
          amount: -authorization.amount,
          machineId: authorization.machineId,
          channel: authorization.channel,
          type: 'MACHINE_UNLOCK',
        },
      });
      const consumed = await tx.machineAuthorization.update({
        where: { token },
        data: { status: 'CONSUMED', usedAt: new Date() },
      });
      return { status: 'approved' as const, authorization: consumed, transaction };
    });

    if (result.status === 'unavailable') {
      return apiError(res, 409, 'AUTHORIZATION_UNAVAILABLE', 'Autorizacao invalida, expirada ou ja utilizada.');
    }

    return res.json({
      status: 'approved',
      authorization_id: result.authorization.id,
      machine_id: result.authorization.machineId,
      credits: result.authorization.amount,
      channel: result.authorization.channel,
      transaction_id: result.transaction.id,
      consumed_at: result.authorization.usedAt,
      message: 'Libere a quantidade autorizada de jogadas.',
    });
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return apiError(res, 409, 'INSUFFICIENT_BALANCE', 'Saldo insuficiente.');
    }
    throw error;
  }
};
