export type CheckinState = {
  success: true;
  claimed: boolean;
  idempotent: boolean;
  reward: number;
  teddy_coins: number;
  checked_in_at: string | null;
  next_checkin_at: string;
  server_time: string;
  time_zone: 'America/Manaus';
};

export type CheckinTransport = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string): Promise<T>;
};

export function formatNextCheckin(state: CheckinState) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: state.time_zone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(state.next_checkin_at));
}

export function createCheckinApi(transport: CheckinTransport) {
  return {
    getStatus: () => transport.get<CheckinState>('/rewards/daily-checkin'),
    claim: () => transport.post<CheckinState>('/rewards/daily-checkin'),
  };
}
