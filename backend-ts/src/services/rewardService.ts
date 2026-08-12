import { prisma } from '../config/prisma';
import { creditTeddyCoinsInTransaction } from './teddyCoinService';

export const DAILY_CHECKIN_REWARD = 10;
export const REWARDS_TIME_ZONE = process.env.REWARDS_TIME_ZONE ?? 'America/Manaus';

export class CheckinAlreadyClaimedError extends Error {
  constructor(public readonly nextCheckinAt: Date) { super('Daily check-in already claimed.'); }
}

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

// America/Manaus is UTC-4 and has no daylight saving time. Keeping the timezone
// configurable is useful, but deployments changing it must also review this boundary.
export function getNextCheckinAt(date = new Date()) {
  const { year, month, day } = zonedParts(date);
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + 1, 4, 0, 0));
}

export async function claimDailyCheckin(userId: string, now = new Date()) {
  const referenceId = `daily-checkin:${getCheckinDayKey(now)}`;
  try {
    return await prisma.$transaction(async (tx) => {
    const existing = await tx.teddyCoinTransaction.findUnique({
      where: { userId_type_referenceId: { userId, type: 'DAILY_CHECKIN', referenceId } },
    });
    if (existing) throw new CheckinAlreadyClaimedError(getNextCheckinAt(now));
    const movement = await creditTeddyCoinsInTransaction(tx, {
      userId, amount: DAILY_CHECKIN_REWARD, type: 'DAILY_CHECKIN', referenceId, description: 'Check-in diário',
    });
    return { movement, checkedInAt: now, nextCheckinAt: getNextCheckinAt(now) };
    });
  } catch (error) {
    if (error instanceof CheckinAlreadyClaimedError) throw error;
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new CheckinAlreadyClaimedError(getNextCheckinAt(now));
    }
    throw error;
  }
}
