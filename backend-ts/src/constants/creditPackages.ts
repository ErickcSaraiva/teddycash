export const CREDIT_PACKAGES = [
  {
    code: 'BASIC', name: 'Básico', amountCents: 500, credits: 1, teddyCoins: 10,
  },
  {
    code: 'POPULAR', name: 'Popular', amountCents: 1200, credits: 3, teddyCoins: 40,
  },
  {
    code: 'ADVANTAGE', name: 'Vantagem', amountCents: 1500, credits: 5, teddyCoins: 80,
  },
  {
    code: 'PREMIUM', name: 'Premium', amountCents: 2500, credits: 10, teddyCoins: 180,
  },
] as const;

export type CreditPackage = (typeof CREDIT_PACKAGES)[number];
export type CreditPackageCode = CreditPackage['code'];
