import { createHash } from 'crypto';

type GameAuditEvent = 'GAME_STARTED' | 'GAME_COMPLETED' | 'GAME_REJECTED' | 'GAME_RATE_LIMITED';

export function auditGameEvent(event: GameAuditEvent, data: { userId: string; gameId?: string; sessionId?: string; reason?: string }) {
  const actor = createHash('sha256').update(data.userId).digest('hex').slice(0, 16);
  console.info(JSON.stringify({
    category: 'GAME_AUDIT',
    event,
    actor,
    game_id: data.gameId,
    session_id: data.sessionId,
    reason: data.reason,
    occurred_at: new Date().toISOString(),
  }));
}
