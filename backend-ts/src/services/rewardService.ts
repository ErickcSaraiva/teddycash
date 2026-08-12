import { prisma } from '../config/prisma';
import { PROMOTIONAL_RULES, PROMOTIONAL_TIME_ZONE } from '../config/promotionalRules';
import { creditTeddyCoinsInTransaction } from './teddyCoinService';

export const DAILY_CHECKIN_REWARD = PROMOTIONAL_RULES.dailyCheckin.reward;
export const REWARDS_TIME_ZONE = PROMOTIONAL_TIME_ZONE;

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REWARDS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return { year: get('year'), month: get('month'), day: get('day') };
}

export function getCheckinDayKey(date = new Date()) {
  const { year, month, day } = zonedParts(date);
  return `${year}-${month}-${day}`;
}

export function getNextCheckinAt(date = new Date()) {
  const { year, month, day } = zonedParts(date);
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + 1, 4, 0, 0));
}

function checkinReference(date: Date) {
  return `daily-checkin:${getCheckinDayKey(date)}`;
}

export async function getDailyCheckinStatus(userId: string, now = new Date()) {
  const referenceId = checkinReference(now);
  const [movement, user] = await prisma.$transaction([
    prisma.teddyCoinTransaction.findUnique({
      where: { userId_type_referenceId: { userId, type: 'DAILY_CHECKIN', referenceId } },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { teddyCoins: true } }),
  ]);
  return {
    claimed: Boolean(movement), reward: DAILY_CHECKIN_REWARD, teddyCoins: user.teddyCoins,
    checkedInAt: movement?.createdAt ?? null, nextCheckinAt: getNextCheckinAt(now), serverTime: now,
  };
}

export async function claimDailyCheckin(userId: string, now = new Date()) {
  if (!PROMOTIONAL_RULES.dailyCheckin.active) throw new Error('Daily check-in is disabled.');
  const referenceId = checkinReference(now);
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${userId}:${referenceId}`}))`;
    const existing = await tx.teddyCoinTransaction.findUnique({
      where: { userId_type_referenceId: { userId, type: 'DAILY_CHECKIN', referenceId } },
    });
    if (existing) return {
      movement: existing, claimed: true, idempotent: true,
      checkedInAt: existing.createdAt, nextCheckinAt: getNextCheckinAt(now), serverTime: now,
    };
    const movement = await creditTeddyCoinsInTransaction(tx, {
      userId, amount: DAILY_CHECKIN_REWARD, type: 'DAILY_CHECKIN', source: 'CHECK_IN', referenceId,
      description: 'Check-in diário',
    });
    return {
      movement, claimed: true, idempotent: false,
      checkedInAt: movement.createdAt, nextCheckinAt: getNextCheckinAt(now), serverTime: now,
    };
  });
}
