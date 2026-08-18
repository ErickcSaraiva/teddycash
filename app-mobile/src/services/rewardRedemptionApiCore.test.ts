import assert from 'node:assert/strict';
import test from 'node:test';
import { canRedeemCredit, createRewardRedemptionApi, missingTeddyCoins, type CreditRedemptionReward } from './rewardRedemptionApiCore';

const reward: CreditRedemptionReward = { id: 'credit-redemption', active: true, teddy_coin_cost: 500, credit_reward: 1 };

test('499 TeddyCoins desabilitam o resgate e informam uma moeda faltante', () => {
  assert.equal(canRedeemCredit(499, reward, false), false);
  assert.equal(missingTeddyCoins(499, reward.teddy_coin_cost), 1);
  assert.equal(canRedeemCredit(500, reward, false), true);
  assert.equal(canRedeemCredit(null, reward, false), false);
});

test('catálogo e resgate usam rotas oficiais sem preço ou userId no payload', async () => {
  const calls: unknown[][] = [];
  const api = createRewardRedemptionApi({
    async get<T>(path: string) { calls.push(['GET', path]); return { rewards: [] } as T; },
    async post<T>(path: string, body: undefined, options: { headers: { 'Idempotency-Key': string } }) {
      calls.push(['POST', path, body, options]);
      return { success: true, idempotent: false, teddy_coins_spent: 500, credits_received: 1, credits: 1, teddy_coins: 0, transaction_id: 'tx' } as T;
    },
  });
  await api.getCatalog();
  await api.redeemCredit('request-12345678');
  assert.deepEqual(calls, [
    ['GET', '/rewards/catalog'],
    ['POST', '/rewards/redeem-credit', undefined, { headers: { 'Idempotency-Key': 'request-12345678' } }],
  ]);
});
