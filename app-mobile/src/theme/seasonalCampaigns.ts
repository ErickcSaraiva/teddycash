export const CAMPAIGN_TIME_ZONE = 'America/Manaus' as const;

export type LocalDate = { year: number; month: number; day: number };

export type CampaignSchedule =
  | { kind: 'fixed-date'; month: number; day: number; durationDays?: number }
  | { kind: 'month'; month: number }
  | { kind: 'nth-weekday'; month: number; weekday: number; occurrence: number }
  | { kind: 'easter-offset'; startOffsetDays: number; durationDays?: number }
  | { kind: 'range'; startsOn: string; endsOn: string };

export type CampaignColors = {
  background: string;
  border: string;
  accent: string;
  text: string;
};

export type SeasonalCampaign = {
  id: string;
  name: string;
  active: boolean;
  version: number;
  priority: number;
  schedule: CampaignSchedule;
  colors: CampaignColors;
  artwork: { kind: 'emoji'; value: string; accessibilityLabel: string };
  title: string;
  subtitle: string;
  callToAction?: { label: string; route: '/games' | '/rewards' | '/add-credits' };
  promotion?: { backendRuleId: string; message: string; authority: 'backend' };
};

export type ResolvedSeasonalTheme = Omit<SeasonalCampaign, 'schedule' | 'active'> & {
  isDefault: boolean;
  period: { startsOn: string; endsOn: string } | null;
};

const DEFAULT_COLORS: CampaignColors = {
  background: '#202024', border: '#323238', accent: '#FFB800', text: '#FFFFFF',
};

export const DEFAULT_SEASONAL_THEME: ResolvedSeasonalTheme = {
  id: 'default', name: 'TeddyCash', version: 1, priority: 0, isDefault: true,
  colors: DEFAULT_COLORS,
  artwork: { kind: 'emoji', value: '🧸', accessibilityLabel: 'Ursinho TeddyCash' },
  title: 'TeddyCash', subtitle: 'Diversão e recompensas do seu jeito.', period: null,
};

const prepared = (
  campaign: Omit<SeasonalCampaign, 'active' | 'version' | 'priority' | 'colors'>,
): SeasonalCampaign => ({
  ...campaign, active: false, version: 1, priority: 10, colors: DEFAULT_COLORS,
});

export const SEASONAL_CAMPAIGNS: readonly SeasonalCampaign[] = [
  prepared({ id: 'new-year', name: 'Ano-Novo', schedule: { kind: 'fixed-date', month: 1, day: 1 }, artwork: { kind: 'emoji', value: '✨', accessibilityLabel: 'Brilhos de Ano-Novo' }, title: 'Um novo ano começou', subtitle: 'Que ele venha cheio de bons momentos.' }),
  prepared({ id: 'carnival', name: 'Carnaval', schedule: { kind: 'easter-offset', startOffsetDays: -50, durationDays: 4 }, artwork: { kind: 'emoji', value: '🎊', accessibilityLabel: 'Confetes coloridos' }, title: 'Carnaval no TeddyCash', subtitle: 'Cores e alegria para acompanhar a brincadeira.' }),
  prepared({ id: 'womens-day', name: 'Dia Internacional da Mulher', schedule: { kind: 'fixed-date', month: 3, day: 8 }, artwork: { kind: 'emoji', value: '💜', accessibilityLabel: 'Coração roxo' }, title: 'Dia Internacional da Mulher', subtitle: 'Respeito, reconhecimento e igualdade todos os dias.' }),
  prepared({ id: 'childrens-book-day', name: 'Dia Internacional do Livro Infantil', schedule: { kind: 'fixed-date', month: 4, day: 2 }, artwork: { kind: 'emoji', value: '📚', accessibilityLabel: 'Livros infantis coloridos' }, title: 'Histórias que fazem imaginar', subtitle: 'Uma homenagem à leitura e à criatividade.' }),
  prepared({ id: 'mothers-day', name: 'Dia das Mães', schedule: { kind: 'nth-weekday', month: 5, weekday: 0, occurrence: 2 }, artwork: { kind: 'emoji', value: '🌷', accessibilityLabel: 'Tulipa' }, title: 'Dia das Mães', subtitle: 'Um carinho para todas as formas de cuidar.' }),
  {
    id: 'festa-junina', name: 'Festa Junina', active: true, version: 1, priority: 20,
    schedule: { kind: 'month', month: 6 },
    colors: { background: '#3A220F', border: '#F2B84B', accent: '#FFD166', text: '#FFF8E7' },
    artwork: { kind: 'emoji', value: '🌽', accessibilityLabel: 'Milho de Festa Junina' },
    title: 'Arraiá do TeddyCash', subtitle: 'Bandeirinhas, brincadeiras e muita diversão.',
    callToAction: { label: 'Ver minijogos', route: '/games' },
  },
  prepared({ id: 'valentines-day', name: 'Dia dos Namorados', schedule: { kind: 'fixed-date', month: 6, day: 12 }, artwork: { kind: 'emoji', value: '💞', accessibilityLabel: 'Dois corações' }, title: 'Dia dos Namorados', subtitle: 'Uma data para celebrar carinho e parceria.' }),
  prepared({ id: 'corpus-christi', name: 'Corpus Christi', schedule: { kind: 'easter-offset', startOffsetDays: 60 }, artwork: { kind: 'emoji', value: '🌼', accessibilityLabel: 'Flor decorativa' }, title: 'Corpus Christi', subtitle: 'Tema comemorativo preparado para ativação.' }),
  prepared({ id: 'friend-day', name: 'Dia do Amigo', schedule: { kind: 'fixed-date', month: 7, day: 20 }, artwork: { kind: 'emoji', value: '🤝', accessibilityLabel: 'Mãos em amizade' }, title: 'Dia do Amigo', subtitle: 'Bons momentos ficam melhores em boa companhia.' }),
  prepared({ id: 'fathers-day', name: 'Dia dos Pais', schedule: { kind: 'nth-weekday', month: 8, weekday: 0, occurrence: 2 }, artwork: { kind: 'emoji', value: '🧸', accessibilityLabel: 'Ursinho TeddyCash' }, title: 'Dia dos Pais', subtitle: 'Um carinho para todas as formas de estar presente.' }),
  {
    id: 'halloween', name: 'Halloween', active: true, version: 1, priority: 30,
    schedule: { kind: 'fixed-date', month: 10, day: 31 },
    colors: { background: '#241035', border: '#B56AFF', accent: '#FF9F1C', text: '#FFF7FF' },
    artwork: { kind: 'emoji', value: '🎃', accessibilityLabel: 'Abóbora sorridente original do tema Halloween' },
    title: 'Halloween fofinho', subtitle: 'Uma visita divertida, colorida e sem sustos.',
    callToAction: { label: 'Ver minijogos', route: '/games' },
  },
  prepared({ id: 'republic-day', name: 'Proclamação da República', schedule: { kind: 'fixed-date', month: 11, day: 15 }, artwork: { kind: 'emoji', value: '🇧🇷', accessibilityLabel: 'Bandeira do Brasil' }, title: '15 de novembro', subtitle: 'Proclamação da República do Brasil.' }),
  prepared({ id: 'thanksgiving', name: 'Thanksgiving', schedule: { kind: 'nth-weekday', month: 11, weekday: 4, occurrence: 4 }, artwork: { kind: 'emoji', value: '🍂', accessibilityLabel: 'Folhas de outono' }, title: 'Tempo de agradecer', subtitle: 'Uma mensagem de gratidão pelos bons encontros.' }),
  {
    id: 'christmas', name: 'Natal', active: true, version: 1, priority: 40,
    schedule: { kind: 'fixed-date', month: 12, day: 25 },
    colors: { background: '#2A1014', border: '#E05252', accent: '#78D381', text: '#FFF8F5' },
    artwork: { kind: 'emoji', value: '🎄', accessibilityLabel: 'Árvore de Natal decorada' },
    title: 'Natal no TeddyCash', subtitle: 'Um dia de carinho, encontro e boas lembranças.',
    callToAction: { label: 'Ver recompensas', route: '/rewards' },
  },
] as const;

export function getManausDate(date: Date): LocalDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMPAIGN_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day') };
}

function addDays(date: LocalDate, days: number): LocalDate {
  const result = new Date(Date.UTC(date.year, date.month - 1, date.day + days, 12));
  return { year: result.getUTCFullYear(), month: result.getUTCMonth() + 1, day: result.getUTCDate() };
}

function localDateKey(date: LocalDate) {
  return date.year * 10_000 + date.month * 100 + date.day;
}

function formatLocalDate(date: LocalDate) {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function parseLocalDate(value: string): LocalDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid campaign date: ${value}`);
  const parsed = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const normalized = addDays({ year: parsed.year, month: parsed.month, day: 1 }, parsed.day - 1);
  if (formatLocalDate(normalized) !== value) throw new Error(`Invalid campaign date: ${value}`);
  return parsed;
}

export function getGregorianEaster(year: number): LocalDate {
  const a = year % 19; const b = Math.floor(year / 100); const c = year % 100;
  const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  return { year, month, day: ((h + l - 7 * m + 114) % 31) + 1 };
}

export function getNthWeekday(year: number, month: number, weekday: number, occurrence: number): LocalDate {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay();
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (occurrence - 1) * 7;
  return { year, month, day };
}

export function resolveCampaignPeriod(schedule: CampaignSchedule, year: number) {
  let startsOn: LocalDate;
  let endsOn: LocalDate;
  if (schedule.kind === 'fixed-date') {
    startsOn = { year, month: schedule.month, day: schedule.day };
    endsOn = addDays(startsOn, (schedule.durationDays ?? 1) - 1);
  } else if (schedule.kind === 'month') {
    startsOn = { year, month: schedule.month, day: 1 };
    endsOn = addDays({ year, month: schedule.month + 1, day: 1 }, -1);
  } else if (schedule.kind === 'nth-weekday') {
    startsOn = getNthWeekday(year, schedule.month, schedule.weekday, schedule.occurrence);
    endsOn = startsOn;
  } else if (schedule.kind === 'easter-offset') {
    startsOn = addDays(getGregorianEaster(year), schedule.startOffsetDays);
    endsOn = addDays(startsOn, (schedule.durationDays ?? 1) - 1);
  } else {
    startsOn = parseLocalDate(schedule.startsOn);
    endsOn = parseLocalDate(schedule.endsOn);
  }
  return { startsOn, endsOn };
}

export function selectSeasonalCampaign(
  now = new Date(), campaigns: readonly SeasonalCampaign[] = SEASONAL_CAMPAIGNS,
): ResolvedSeasonalTheme {
  const localNow = getManausDate(now);
  const currentKey = localDateKey(localNow);
  const matches = campaigns.flatMap((campaign) => {
    if (!campaign.active) return [];
    const period = resolveCampaignPeriod(campaign.schedule, localNow.year);
    if (currentKey < localDateKey(period.startsOn) || currentKey > localDateKey(period.endsOn)) return [];
    return [{ campaign, period }];
  }).sort((left, right) => right.campaign.priority - left.campaign.priority || left.campaign.id.localeCompare(right.campaign.id));

  const selected = matches[0];
  if (!selected) return DEFAULT_SEASONAL_THEME;
  const { schedule: _schedule, active: _active, ...campaign } = selected.campaign;
  return {
    ...campaign, isDefault: false,
    period: { startsOn: formatLocalDate(selected.period.startsOn), endsOn: formatLocalDate(selected.period.endsOn) },
  };
}

export function resolveCampaignDate(previewDate: string | undefined, fallback = new Date()) {
  if (!previewDate) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(previewDate)) {
    const local = parseLocalDate(previewDate);
    return new Date(`${formatLocalDate(local)}T12:00:00-04:00`);
  }
  const parsed = new Date(previewDate);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid color: ${hex}`);
    const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
    const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const first = luminance(foreground); const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
