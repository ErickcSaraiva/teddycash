// app-mobile/src/services/authApi.ts

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? 'http://192.168.101.13:8000';

// ── Tipos de resposta ─────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  user_id: string;
}

export interface BalanceResponse {
  user_id: string;
  balance: number;
}

// ── Helpers internos ──────────────────────────────────────────────────────────

async function post<T>(path: string, body?: object, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function get<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── API pública ───────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /auth/login
   * O backend atual ignora email/senha e retorna sempre { access_token, user_id: "user1" }.
   * Quando a autenticação real for implementada, só este arquivo muda.
   */
  login: (email: string, password: string): Promise<LoginResponse> =>
    post<LoginResponse>('/auth/login', { email, password }),

  /**
   * GET /balance/:userId
   */
  getBalance: (userId: string, token: string): Promise<BalanceResponse> =>
    get<BalanceResponse>(`/balance/${userId}`, token),
};