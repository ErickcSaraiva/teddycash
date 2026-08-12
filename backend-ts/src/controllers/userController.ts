import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';

export const addCredit = async (_req: AuthRequest, res: Response) => {
  return res.status(410).json({
    error: { code: 'LEGACY_CREDIT_ENDPOINT_DISABLED', message: 'Crédito direto foi desativado; use um pedido de pagamento confirmado.' },
  });
};
