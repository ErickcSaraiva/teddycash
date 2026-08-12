import assert from 'node:assert/strict';
import test from 'node:test';
import { createGamesApi, GameApiError, type CompleteGamePayload, type GameTransport } from './gamesApiCore';

test('integração inicia e conclui usando as rotas seguras sem userId', async () => {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  const transport: GameTransport = {
    async get<T>(path: string) { calls.push({ method: 'GET', path }); return { success: true, games: [] } as T; },
    async post<T>(path: string, body?: unknown) {
      calls.push({ method: 'POST', path, body });
      if (path.endsWith('/start')) return { success: true, session: { id: 's1', token: 'temporary', game_id: 'coin-collector', started_at: '', expires_at: '', status: 'STARTED' }, entry_cost: 0, daily_remaining: 4, teddy_coins: 20 } as T;
      return { success: true, session: { id: 's1', game_id: 'coin-collector', status: 'COMPLETED', score: 1 }, reward: 1, teddy_coins: 21, idempotent: false } as T;
    },
  };
  const client = createGamesApi(transport);
  await client.start('coin-collector');
  const payload: CompleteGamePayload = { session_id: 's1', session_token: 'temporary', duration_ms: 30_000, score: 1, events: [{ sequence: 1, type: 'COIN_TAP', occurred_at_ms: 100 }] };
  const completed = await client.complete('coin-collector', payload);
  assert.equal(completed.reward, 1);
  assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: 'POST', path: '/games/coin-collector/start' },
    { method: 'POST', path: '/games/coin-collector/complete' },
  ]);
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'userId'), false);
});

test('resposta idempotente do servidor é preservada', async () => {
  const transport: GameTransport = {
    async get<T>() { return {} as T; },
    async post<T>() { return { success: true, session: { id: 's1', game_id: 'coin-collector', status: 'COMPLETED', score: 2 }, reward: 2, teddy_coins: 22, idempotent: true } as T; },
  };
  const result = await createGamesApi(transport).complete('coin-collector', { session_id: 's1', session_token: 'token', duration_ms: 30_000, score: 2, events: [] });
  assert.equal(result.idempotent, true);
});

test('erros de conexão são normalizados para a interface', async () => {
  const transport: GameTransport = {
    async get() { throw new Error('network'); },
    async post() { throw new Error('network'); },
  };
  await assert.rejects(() => createGamesApi(transport).start('coin-collector'), (error: unknown) => error instanceof GameApiError && error.code === 'OFFLINE');
});
