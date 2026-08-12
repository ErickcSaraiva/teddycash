import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config/auth';
import { getGameCatalog, GameDomainError, validateGameResult, type GameEvent } from './services/gameService';
import { verifyToken, type AuthRequest } from './middlewares/authMiddleware';

function events(count: number): GameEvent[] {
  return Array.from({ length: count }, (_, index) => ({ sequence: index + 1, type: 'COIN_TAP', occurred_at_ms: 100 + index * 100 }));
}

function validInput() {
  return { sessionId: 'session-id', sessionToken: 'x'.repeat(43), durationMs: 30_000, score: 10, events: events(10) };
}

test('catálogo de jogos é tipado, gratuito e possui limites do servidor', () => {
  assert.deepEqual(getGameCatalog(), [{
    id: 'coin-collector', name: 'Caça às TeddyCoins', duration_ms: 30_000,
    daily_limit: 5, maximum_score: 100, maximum_reward: 50, entry_cost: 0,
  }]);
});

test('resultado válido calcula recompensa exclusivamente no backend', () => {
  const result = validateGameResult('coin-collector', validInput());
  assert.equal(result.calculatedScore, 10);
  assert.equal(result.reward, 10);
});

test('pontuação impossível é rejeitada', () => {
  assert.throws(() => validateGameResult('coin-collector', { ...validInput(), score: 101 }), (error: unknown) => error instanceof GameDomainError && error.code === 'IMPOSSIBLE_SCORE');
});

test('payload alterado com score diferente dos eventos é rejeitado', () => {
  assert.throws(() => validateGameResult('coin-collector', { ...validInput(), score: 9 }), (error: unknown) => error instanceof GameDomainError && error.code === 'SCORE_MISMATCH');
});

test('eventos rápidos demais são rejeitados', () => {
  const impossible = events(2);
  impossible[1].occurred_at_ms = impossible[0].occurred_at_ms + 10;
  assert.throws(() => validateGameResult('coin-collector', { ...validInput(), score: 2, events: impossible }), (error: unknown) => error instanceof GameDomainError && error.code === 'IMPOSSIBLE_EVENT_RATE');
});

test('rota protegida rejeita usuário sem token', () => {
  const req = { headers: {} } as AuthRequest;
  let status = 0;
  const res = { status(code: number) { status = code; return this; }, json() { return this; } } as never;
  verifyToken(req, res, () => assert.fail('não deveria autenticar'));
  assert.equal(status, 401);
});

test('identidade autenticada é obtida exclusivamente do JWT', () => {
  const token = jwt.sign({ userId: 'jwt-user' }, JWT_SECRET, { expiresIn: '1m' });
  const req = { headers: { authorization: `Bearer ${token}` }, body: { userId: 'attacker' } } as AuthRequest;
  let called = false;
  const res = {} as never;
  verifyToken(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.userId, 'jwt-user');
});
