import type { Response } from 'express';
import { prisma } from '../config/prisma';
import type { AuthRequest } from '../middlewares/authMiddleware';

// Definimos uma taxa de Cashback de 10% (0.10)
const CASHBACK_RATE = 0.10;

export const addCredit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { amount } = req.body;

    if (!userId || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Payload inválido. Envie um 'amount' inteiro positivo."
      });
    }

    // 2. Verificar se o utilizador realmente existe no PostgreSQL
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      return res.status(404).json({ error: "Utilizador não encontrado na base de dados." });
    }

    const cashbackEarned = Number((amount * CASHBACK_RATE).toFixed(2));

    // 3. Transação Atómica: Executa todas as operações em bloco seguro
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Atualiza o saldo principal e adiciona o cashback na carteira do utilizador
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: amount },
          cashback: { increment: cashbackEarned }
        }
      });

      // Cria o registo de extrato para a compra de créditos via Pix
      await tx.transaction.create({
        data: {
          userId,
          amount,
          type: "PIX_CREDIT"
        }
      });

      return user;
    });

    // 4. Retorno de sucesso com os saldos atualizados
    return res.status(200).json({
      success: true,
      message: "Créditos e cashback processados com sucesso!",
      data: {
        userId: updatedUser.id,
        newBalance: updatedUser.balance,
        newCashback: updatedUser.cashback,
        addedCredit: amount,
        earnedCashback: cashbackEarned
      }
    });

  } catch (error) {
    console.error("Erro ao processar transação de crédito:", error);
    return res.status(500).json({ error: "Erro interno do servidor ao processar pagamento." });
  }
};
