import assert from 'node:assert/strict';
import test from 'node:test';
import { CREDIT_PACKAGES } from './constants/creditPackages';
import { getCheckinDayKey, getNextCheckinAt } from './services/rewardService';

test('catálogo oficial possui os quatro snapshots corretos', () => {
  assert.deepEqual(CREDIT_PACKAGES, [
    { code: 'BASIC', name: 'Básico', amountCents: 500, credits: 1, teddyCoins: 10 },
    { code: 'POPULAR', name: 'Popular', amountCents: 1200, credits: 3, teddyCoins: 40 },
    { code: 'ADVANTAGE', name: 'Vantagem', amountCents: 1500, credits: 5, teddyCoins: 80 },
    { code: 'PREMIUM', name: 'Premium', amountCents: 2500, credits: 10, teddyCoins: 180 },
  ]);
});

test('dia de check-in usa America/Manaus e próxima fronteira local', () => {
  const beforeMidnight = new Date('2026-08-03T03:59:59.000Z');
  assert.equal(getCheckinDayKey(beforeMidnight), '2026-08-02');
  assert.equal(getNextCheckinAt(beforeMidnight).toISOString(), '2026-08-03T04:00:00.000Z');
  assert.equal(getCheckinDayKey(new Date('2026-08-03T04:00:00.000Z')), '2026-08-03');
});
