import { purchaseBonusForCredits } from '../config/promotionalRules';

const packageDefinitions = [
  {
    code: 'BASIC', name: 'Básico', amountCents: 500, credits: 1,
  },
  {
    code: 'POPULAR', name: 'Popular', amountCents: 1200, credits: 3,
  },
  {
    code: 'ADVANTAGE', name: 'Vantagem', amountCents: 1500, credits: 5,
  },
  {
    code: 'PREMIUM', name: 'Premium', amountCents: 2500, credits: 10,
  },
] as const;

export const CREDIT_PACKAGES = packageDefinitions.map((item) => ({
  ...item,
  teddyCoins: purchaseBonusForCredits(item.credits),
}));

export type CreditPackage = (typeof CREDIT_PACKAGES)[number];
export type CreditPackageCode = CreditPackage['code'];
