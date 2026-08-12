import { prisma } from '../config/prisma';
import { CREDIT_PACKAGES } from '../constants/creditPackages';
import { creditTeddyCoinsInTransaction } from './teddyCoinService';
import { recordCreditMovement } from './creditService';

export function getCreditPackageByCode(packageCode: string) {
  return CREDIT_PACKAGES.find((item) => item.code === packageCode);
}

export async function confirmPaidOrder(orderId: string, providerId: string) {
  if (!providerId) {
    throw new Error('providerId is required.');
  }

  return await prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new Error('Payment order not found.');
    }

    if (order.status === 'PAID') {
      if (order.providerId === providerId) {
        const user = await tx.user.findUnique({ where: { id: order.userId } });
        if (!user) {
          throw new Error('User not found.');
        }
        return { balance: user.creditBalance, teddyCoins: user.teddyCoins };
      }
      throw new Error('Order already paid.');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Only pending orders can be confirmed.');
    }

    const claimed = await tx.paymentOrder.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: 'PAID', paidAt: new Date(), provider: 'PIX', providerId },
    });
    if (claimed.count === 0) {
      const processedOrder = await tx.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
      if (processedOrder.status === 'PAID' && processedOrder.providerId === providerId) {
        const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId } });
        return { balance: user.creditBalance, teddyCoins: user.teddyCoins };
      }
      throw new Error('Order was processed concurrently.');
    }

    const creditMovement = await recordCreditMovement(tx, {
      userId: order.userId,
      amount: order.credits,
      type: 'CREDIT_PURCHASE',
      source: 'PAYMENT_ORDER',
      referenceId: order.id,
    });

    const pkg = getCreditPackageByCode(order.packageCode);
    const teddyMovement = order.teddyCoins > 0
      ? await creditTeddyCoinsInTransaction(tx, {
          userId: order.userId, amount: order.teddyCoins, type: 'CREDIT_PURCHASE_REWARD', referenceId: order.id,
          description: `Bônus da compra ${pkg?.name ?? order.packageCode}`,
        })
      : null;

    return {
      balance: creditMovement.balanceAfter!,
      teddyCoins: teddyMovement?.balanceAfter ?? (await tx.user.findUniqueOrThrow({ where: { id: order.userId } })).teddyCoins,
    };
  });
}
