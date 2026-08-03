import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';
import { getTeddyCoinHistory } from '../services/teddyCoinService';

export async function listTeddyCoinTransactions(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: 'Usuário não autenticado.' });
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) return res.status(400).json({ error: 'Paginação inválida.' });
  const history = await getTeddyCoinHistory(req.userId, page, limit);
  return res.json({ ...history, items: history.items.map((item) => ({ id: item.id, type: item.type, amount: item.amount, balance_after: item.balanceAfter, reference_id: item.referenceId, description: item.description, created_at: item.createdAt })) });
}
