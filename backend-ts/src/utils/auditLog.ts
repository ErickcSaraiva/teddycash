import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { pseudonymize } from './privacySecurity';

type GameAuditEvent = 'GAME_STARTED' | 'GAME_COMPLETED' | 'GAME_REJECTED' | 'GAME_RATE_LIMITED';

export function auditGameEvent(event: GameAuditEvent, data: { userId: string; gameId?: string; sessionId?: string; reason?: string }) {
  console.info(JSON.stringify({
    category: 'GAME_AUDIT', event, actor: pseudonymize(data.userId), game_id: data.gameId,
    session_id: data.sessionId ? pseudonymize(data.sessionId) : undefined, reason: data.reason,
    occurred_at: new Date().toISOString(),
  }));
}

export async function recordPrivacyAudit(
  action: string, actorId: string, targetType: string, targetId?: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return tx.privacyAuditLog.create({ data: {
    action, actorHash: pseudonymize(actorId), targetType,
    targetHash: targetId ? pseudonymize(targetId) : null,
  } });
}
