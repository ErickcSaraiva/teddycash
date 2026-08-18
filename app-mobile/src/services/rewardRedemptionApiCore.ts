export type CreditRedemptionReward = {
  id: 'credit-redemption';
  active: boolean;
  teddy_coin_cost: number;
  credit_reward: number;
};

export type RewardCatalogResponse = { rewards: CreditRedemptionReward[] };
export type CreditRedemptionResponse = {
  success: true;
  idempotent: boolean;
  teddy_coins_spent: number;
  credits_received: number;
  credits: number;
  teddy_coins: number;
  transaction_id: string;
};

export function missingTeddyCoins(balance: number | null, cost: number) {
  return balance === null ? null : Math.max(0, cost - balance);
}

export function canRedeemCredit(balance: number | null, reward: CreditRedemptionReward | null, loading: boolean) {
  return Boolean(reward?.active && balance !== null && balance >= reward.teddy_coin_cost && !loading);
}

type Transport = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: undefined, options: { headers: { 'Idempotency-Key': string } }): Promise<T>;
};

export function createRewardRedemptionApi(transport: Transport) {
  return {
    getCatalog: () => transport.get<RewardCatalogResponse>('/rewards/catalog'),
    redeemCredit: (idempotencyKey: string) => transport.post<CreditRedemptionResponse>(
      '/rewards/redeem-credit',
      undefined,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    ),
  };
}
