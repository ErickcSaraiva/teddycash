import assert from 'node:assert/strict';
import test from 'node:test';
import { createTarget, MAXIMUM_EVENTS, registerTap, remainingSeconds, TARGET_SIZE, type GameEvent, type Target } from './coinCollectorLogic';

test('alvo sempre fica dentro da área jogável', () => {
  const target = createTarget(() => 0.999, 320, 420, 1);
  assert.ok(target.x >= 0 && target.x <= 320 - TARGET_SIZE);
  assert.ok(target.y >= 0 && target.y <= 420 - TARGET_SIZE);
});

test('alvo correto soma ponto e cria evento ordenado', () => {
  const target: Target = { id: 1, kind: 'REWARD', emoji: '🪙', x: 0, y: 0 };
  const result = registerTap(0, [], target, 100);
  assert.equal(result.score, 1);
  assert.deepEqual(result.events, [{ sequence: 1, type: 'COIN_TAP', occurred_at_ms: 100 }]);
});

test('obstáculo reduz apenas o placar e nunca fica negativo', () => {
  const target: Target = { id: 1, kind: 'OBSTACLE', emoji: '🐝', x: 0, y: 0 };
  assert.equal(registerTap(0, [], target, 100).score, 0);
  assert.equal(registerTap(2, [], target, 100).score, 1);
});

test('toques rápidos demais não são enviados ao backend', () => {
  const target: Target = { id: 1, kind: 'REWARD', emoji: '🧸', x: 0, y: 0 };
  const first = registerTap(0, [], target, 100);
  const second = registerTap(first.score, first.events, target, 150);
  assert.equal(second.accepted, false);
  assert.equal(second.events.length, 1);
});

test('cronômetro termina em zero e nunca fica negativo', () => {
  assert.equal(remainingSeconds(1_000, 1_000), 30);
  assert.equal(remainingSeconds(1_000, 30_001), 1);
  assert.equal(remainingSeconds(1_000, 31_001), 0);
});

test('cliente não produz mais eventos que o contrato do servidor', () => {
  const target: Target = { id: 1, kind: 'REWARD', emoji: '🪙', x: 0, y: 0 };
  const full = Array.from({ length: MAXIMUM_EVENTS }, (_, index): GameEvent => ({ sequence: index + 1, type: 'COIN_TAP', occurred_at_ms: index * 100 }));
  assert.equal(registerTap(50, full, target, 20_000).accepted, false);
});
