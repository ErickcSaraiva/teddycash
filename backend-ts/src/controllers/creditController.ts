// backend-ts/src/controllers/creditController.ts
import type { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware'; // Importamos o nosso segurança

export const processCreditPurchase = async (req: AuthRequest, res: Response) => {
  // 1. Pegamos o userId de forma 100% segura pelo Token (req.userId)
  const userId = req.userId;
  
  // 2. Do body, pegamos APENAS o valor que ele quer adicionar
  const { amount } = req.body;
  const cashbackRate = 0.10; // 10%

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'É necessário informar um amount inteiro e positivo.'
    });
  }

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      
      // Atualiza o saldo e cashback
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: amount },
          cashback: { increment: amount * cashbackRate } // O seu schema precisará ter o campo 'cashback'
        }
      });

      // Regista a transação
      await tx.transaction.create({
        data: {
          userId,
          amount,
          type: 'CREDIT_PURCHASE'
        }
      });

      return user;
    });

    return res.status(200).json({ 
      success: true, 
      newBalance: updatedUser.balance,
      newCashback: updatedUser.cashback 
    });

  } catch (error) {
    console.error("Erro na transação:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro na transação financeira.' 
    });
  }
};
