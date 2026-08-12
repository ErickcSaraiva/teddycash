import assert from 'node:assert/strict';
import test from 'node:test';
import { CREDIT_PACKAGES } from './constants/creditPackages';
import { getCheckinDayKey, getNextCheckinAt } from './services/rewardService';
import { GAME_ENTRY_COST } from './services/gameService';
import { PROMOTIONAL_RULES, PROMOTIONAL_TIME_ZONE, purchaseBonusForCredits } from './config/promotionalRules';

test('catálogo oficial possui os quatro snapshots corretos', () => {
  assert.deepEqual(CREDIT_PACKAGES, [
    { code: 'BASIC', name: 'Básico', amountCents: 500, credits: 1, teddyCoins: 10 },
    { code: 'POPULAR', name: 'Popular', amountCents: 1200, credits: 3, teddyCoins: 30 },
    { code: 'ADVANTAGE', name: 'Vantagem', amountCents: 1500, credits: 5, teddyCoins: 50 },
    { code: 'PREMIUM', name: 'Premium', amountCents: 2500, credits: 10, teddyCoins: 100 },
  ]);
});

test('regras promocionais ficam centralizadas e calculam 10 TeddyCoins por crédito', () => {
  assert.equal(PROMOTIONAL_TIME_ZONE, 'America/Manaus');
  assert.equal(PROMOTIONAL_RULES.dailyCheckin.reward, 10);
  assert.equal(purchaseBonusForCredits(1), 10);
  assert.equal(purchaseBonusForCredits(10), 100);
});

test('dia de check-in usa America/Manaus e próxima fronteira local', () => {
  const beforeMidnight = new Date('2026-08-03T03:59:59.000Z');
  assert.equal(getCheckinDayKey(beforeMidnight), '2026-08-02');
  assert.equal(getNextCheckinAt(beforeMidnight).toISOString(), '2026-08-03T04:00:00.000Z');
  assert.equal(getCheckinDayKey(new Date('2026-08-03T04:00:00.000Z')), '2026-08-03');
  assert.equal(getCheckinDayKey(new Date('2026-08-03T03:59:59.999Z')), '2026-08-02');
  assert.equal(getCheckinDayKey(new Date('2026-08-03T04:00:00.001Z')), '2026-08-03');
});

test('minijogos não cobram créditos nem TeddyCoins para iniciar', () => {
  assert.equal(GAME_ENTRY_COST, 0);
});
