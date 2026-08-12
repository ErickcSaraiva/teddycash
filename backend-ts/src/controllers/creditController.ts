// backend-ts/src/controllers/creditController.ts
import type { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware'; // Importamos o nosso segurança

export const processCreditPurchase = async (_req: AuthRequest, res: Response) => {
  return res.status(410).json({
    error: { code: 'LEGACY_CREDIT_ENDPOINT_DISABLED', message: 'Use pedidos de pagamento confirmados de forma idempotente.' },
  });
};
