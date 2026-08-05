import { prisma } from '../config/prisma';
import { creditTeddyCoinsInTransaction, debitTeddyCoinsInTransaction } from './teddyCoinService';

export const GAME_ENTRY_COST = 5;
export const GAME_WIN_REWARD = 25;
export const ALLOWED_GAMES = ['coin-collector', 'quick-tap', 'puzzle'] as const;

export class InvalidGameError extends Error {}
export class GameSessionUnavailableError extends Error {}

export async function startGameSession(userId: string, gameId: string) {
  if (!(ALLOWED_GAMES as readonly string[]).includes(gameId)) throw new InvalidGameError('Invalid game.');
  return prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.create({ data: { userId, gameId } });
    const movement = await debitTeddyCoinsInTransaction(tx, {
      userId, amount: GAME_ENTRY_COST, type: 'GAME_ENTRY', referenceId: session.id,
      description: `Entrada no minijogo ${gameId}`,
    });
    return { session, teddyCoins: movement.balanceAfter };
  });
}

// Deliberately internal: serverValidatedWin must come from authoritative game
// telemetry. No public endpoint accepts a free-form victory claim from mobile.
export async function finishGameSession(userId: string, sessionId: string, serverValidatedWin: boolean) {
  return prisma.$transaction(async (tx) => {
    const claim = await tx.gameSession.updateMany({
      where: { id: sessionId, userId, status: 'STARTED' },
      data: { status: 'FINISHED', finishedAt: new Date(), won: serverValidatedWin, coinsEarned: serverValidatedWin ? GAME_WIN_REWARD : 0 },
    });
    if (claim.count === 0) throw new GameSessionUnavailableError('Session missing, foreign, or already finished.');
    if (!serverValidatedWin) {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { teddyCoins: true } });
      return { rewarded: false, teddyCoins: user.teddyCoins };
    }
    const movement = await creditTeddyCoinsInTransaction(tx, {
      userId, amount: GAME_WIN_REWARD, type: 'GAME_REWARD', referenceId: sessionId,
      description: 'Recompensa por vitória',
    });
    return { rewarded: true, teddyCoins: movement.balanceAfter };
  });
}
