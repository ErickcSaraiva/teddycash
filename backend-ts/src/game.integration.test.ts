import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { prisma } from './config/prisma';
import { completeGameSession, GameDomainError, startGameSession, type GameEvent } from './services/gameService';

const runDatabaseTests = process.env.RUN_DB_TESTS === '1';
const GAME = 'coin-collector';

function events(count: number, offset = 0): GameEvent[] {
  return Array.from({ length: count }, (_, index) => ({ sequence: index + 1, type: 'COIN_TAP', occurred_at_ms: 100 + offset + index * 100 }));
}

test('sessões de jogo são isoladas, idempotentes e não alteram créditos', { skip: !runDatabaseTests }, async () => {
  const suffix = crypto.randomUUID();
  const [owner, other] = await Promise.all([
    prisma.user.create({ data: { username: `game-${suffix}`, email: `game-${suffix}@test.local`, password: 'test', creditBalance: 7 } }),
    prisma.user.create({ data: { username: `other-${suffix}`, email: `other-${suffix}@test.local`, password: 'test' } }),
  ]);
  try {
    const started = await startGameSession(owner.id, GAME, new Date('2026-08-12T12:00:00Z'));
    assert.equal(started.teddyCoins, 0);
    await assert.rejects(
      () => completeGameSession(other.id, GAME, { sessionId: started.session.id, sessionToken: started.token, durationMs: 30_000, score: 10, events: events(10) }),
      (error: unknown) => error instanceof GameDomainError && error.code === 'SESSION_FORBIDDEN',
    );

    const input = { sessionId: started.session.id, sessionToken: started.token, durationMs: 30_000, score: 10, events: events(10) };
    const first = await completeGameSession(owner.id, GAME, input, new Date('2026-08-12T12:00:30Z'));
    const duplicate = await completeGameSession(owner.id, GAME, input, new Date('2026-08-12T12:00:31Z'));
    assert.equal(first.reward, 10);
    assert.equal(duplicate.idempotent, true);
    assert.equal(duplicate.reward, 10);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });
    assert.equal(user.teddyCoins, 10, 'recompensa creditada uma vez');
    assert.equal(user.creditBalance, 7, 'créditos financeiros inalterados');
    assert.equal(await prisma.teddyCoinTransaction.count({ where: { userId: owner.id, type: 'GAME_REWARD', referenceId: started.session.id } }), 1);

    await assert.rejects(
      () => completeGameSession(owner.id, GAME, { ...input, events: events(10, 100) }, new Date('2026-08-12T12:00:32Z')),
      (error: unknown) => error instanceof GameDomainError && error.code === 'COMPLETION_PAYLOAD_CONFLICT',
    );

    const expired = await startGameSession(owner.id, GAME, new Date('2026-08-12T13:00:00Z'));
    await assert.rejects(
      () => completeGameSession(owner.id, GAME, { ...input, sessionId: expired.session.id, sessionToken: expired.token }, new Date('2026-08-12T13:03:00Z')),
      (error: unknown) => error instanceof GameDomainError && error.code === 'SESSION_EXPIRED',
    );
    assert.equal((await prisma.gameSession.findUniqueOrThrow({ where: { id: expired.session.id } })).status, 'EXPIRED');

    for (let index = 0; index < 3; index += 1) await startGameSession(owner.id, GAME, new Date(`2026-08-12T14:0${index}:00Z`));
    await assert.rejects(
      () => startGameSession(owner.id, GAME, new Date('2026-08-12T15:00:00Z')),
      (error: unknown) => error instanceof GameDomainError && error.code === 'DAILY_LIMIT_REACHED',
    );
  } finally {
    await prisma.teddyCoinTransaction.deleteMany({ where: { userId: { in: [owner.id, other.id] } } });
    await prisma.gameSession.deleteMany({ where: { userId: { in: [owner.id, other.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, other.id] } } });
  }
});
