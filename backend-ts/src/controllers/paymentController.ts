import type { Response } from 'express';
import { prisma } from '../config/prisma';
import type { AuthRequest } from '../middlewares/authMiddleware';
import { CREDIT_PACKAGES } from '../constants/creditPackages';
import { getCreditPackageByCode } from '../services/paymentOrderService';

function formatPackageResponse(pkg: { code: string; name: string; credits: number; amountCents: number; teddyCoins: number }) {
  return {
    code: pkg.code,
    name: pkg.name,
    credits: pkg.credits,
    amount_cents: pkg.amountCents,
    teddy_coins: pkg.teddyCoins,
  };
}

export const getCreditPackages = async (_req: AuthRequest, res: Response) => {
  return res.json({ packages: CREDIT_PACKAGES.map(formatPackageResponse) });
};

export const createPixPaymentOrder = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const packageCode = typeof req.body.package_code === 'string' ? req.body.package_code : undefined;

  if (!userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  if (!packageCode) {
    return res.status(400).json({ error: 'package_code é obrigatório.' });
  }

  const creditPackage = getCreditPackageByCode(packageCode);

  if (!creditPackage) {
    return res.status(400).json({ error: 'Pacote de créditos não encontrado.' });
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  try {
    const order = await prisma.paymentOrder.create({
      data: {
        userId,
        packageCode: creditPackage.code,
        amountCents: creditPackage.amountCents,
        credits: creditPackage.credits,
        teddyCoins: creditPackage.teddyCoins,
        expiresAt,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      order: {
        id: order.id,
        package_code: order.packageCode,
        amount_cents: order.amountCents,
        credits: order.credits,
        teddy_coins: order.teddyCoins,
        status: order.status,
        expires_at: order.expiresAt,
      },
      payment: {
        method: 'PIX',
        available: false,
        message: 'A integração com o provedor Pix ainda não foi configurada.',
      },
    });
  } catch (error) {
    console.error('Payment order creation failed:', error instanceof Error ? error.name : 'UnknownError');
    return res.status(500).json({ error: 'Erro interno ao criar pedido de pagamento.' });
  }
};

export const getPaymentOrder = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const param = req.params.orderId;
  const orderId = Array.isArray(param) ? param[0] : param;

  if (!userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const order = await prisma.paymentOrder.findUnique({ where: { id: orderId } });

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  if (order.userId !== userId) {
    return res.status(403).json({ error: 'Acesso negado ao pedido.' });
  }

  return res.json({
    id: order.id,
    package_code: order.packageCode,
    amount_cents: order.amountCents,
    credits: order.credits,
    teddy_coins: order.teddyCoins,
    status: order.status,
    expires_at: order.expiresAt,
    created_at: order.createdAt,
  });
};

export const listPaymentOrders = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const orders = await prisma.paymentOrder.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(
    orders.map((order) => ({
      id: order.id,
      package_code: order.packageCode,
      amount_cents: order.amountCents,
      credits: order.credits,
      teddy_coins: order.teddyCoins,
      status: order.status,
      expires_at: order.expiresAt,
      created_at: order.createdAt,
    })),
  );
};
