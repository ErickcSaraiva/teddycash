export const PROMOTIONAL_TIME_ZONE = 'America/Manaus' as const;

export const PROMOTIONAL_RULES = {
  dailyCheckin: {
    active: true,
    reward: 10,
    dailyLimit: 1,
  },
  purchaseBonus: {
    active: true,
    teddyCoinsPerCredit: 10,
  },
  games: {
    'coin-collector': {
      active: true,
      dailySessionLimit: 5,
      coinsPerScore: 1,
      maximumReward: 50,
    },
  },
  campaigns: [] as readonly {
    id: string;
    active: boolean;
    startsAt: string;
    endsAt: string;
    dailyLimit?: number;
    reward?: number;
  }[],
} as const;

export function purchaseBonusForCredits(credits: number) {
  if (!PROMOTIONAL_RULES.purchaseBonus.active) return 0;
  if (!Number.isSafeInteger(credits) || credits < 0) throw new Error('Credits must be a non-negative integer.');
  return credits * PROMOTIONAL_RULES.purchaseBonus.teddyCoinsPerCredit;
}
