import assert from 'node:assert/strict';
import test from 'node:test';
import { createCheckinApi, formatNextCheckin, type CheckinState, type CheckinTransport } from './checkinApiCore';

const state: CheckinState = {
  success: true, claimed: true, idempotent: false, reward: 10, teddy_coins: 30,
  checked_in_at: '2026-08-12T12:00:00.000Z', next_checkin_at: '2026-08-13T04:00:00.000Z',
  server_time: '2026-08-12T12:00:00.000Z', time_zone: 'America/Manaus',
};

test('estado e coleta usam a mesma rota oficial sem horário ou recompensa do cliente', async () => {
  const calls: { method: string; path: string }[] = [];
  const transport: CheckinTransport = {
    async get<T>(path: string) { calls.push({ method: 'GET', path }); return state as T; },
    async post<T>(path: string) { calls.push({ method: 'POST', path }); return state as T; },
  };
  const client = createCheckinApi(transport);
  assert.equal((await client.getStatus()).reward, 10);
  assert.equal((await client.claim()).teddy_coins, 30);
  assert.deepEqual(calls, [
    { method: 'GET', path: '/rewards/daily-checkin' },
    { method: 'POST', path: '/rewards/daily-checkin' },
  ]);
});

test('resposta idempotente é preservada para a interface', async () => {
  const transport: CheckinTransport = {
    async get<T>() { return { ...state, idempotent: true } as T; },
    async post<T>() { return { ...state, idempotent: true } as T; },
  };
  assert.equal((await createCheckinApi(transport).claim()).idempotent, true);
});

test('próxima disponibilidade é exibida no fuso oficial, não no fuso do celular', () => {
  const formatted = formatNextCheckin(state);
  assert.match(formatted, /13\/08\/2026/);
  assert.match(formatted, /00:00/);
});
