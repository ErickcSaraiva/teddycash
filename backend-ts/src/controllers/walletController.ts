import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../config/prisma';

export async function getWallet(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: 'Usuário não autenticado.' });
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { balance: true, teddyCoins: true } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  return res.json({ credits: user.balance, teddy_coins: user.teddyCoins });
}
