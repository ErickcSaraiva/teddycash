// app-mobile/src/services/authApi.ts
import * as SecureStore from 'expo-secure-store';

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? 'http://192.168.101.13:8000';
const KEY_TOKEN = 'teddycash_token';
const KEY_USER_ID = 'teddycash_user_id';

// ── Tipos de resposta ─────────────────────────────────────────────────────────

export interface LoginResponse {
  token?: string;
  userId?: string;
  access_token?: string;
  user_id?: string;
  username?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId: string;
}

export interface ProfileResponse {
  user_id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
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
    throw new Error(detail?.detail || detail?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function get<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail || detail?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function patch<T>(path: string, body?: object, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail || detail?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── API pública ─────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /auth/register
   */
  register: (username: string, email: string, password: string): Promise<RegisterResponse> =>
    post<RegisterResponse>('/auth/register', { username, email, password }),

  /**
   * POST /auth/login
   * Salva automaticamente o token e o userId no SecureStore.
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await post<LoginResponse>('/auth/login', { email, password });

    const token = data.token ?? data.access_token;
    const userId = data.userId ?? data.user_id;

    if (!token || !userId) {
      throw new Error('Resposta inválida do backend no login.');
    }

    await SecureStore.setItemAsync(KEY_TOKEN, token);
    await SecureStore.setItemAsync(KEY_USER_ID, userId);

    return { ...data, token, userId };
  },

  getProfile: (userId: string, token: string): Promise<ProfileResponse> =>
    get<ProfileResponse>(`/profile/${userId}`, token),

  updateProfile: (
    userId: string,
    body: { username?: string; email?: string; avatarUrl?: string | null },
    token: string,
  ): Promise<ProfileResponse> => patch<ProfileResponse>(`/profile/${userId}`, body, token),

  /**
   * GET token salvo localmente
   */
  getToken: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(KEY_TOKEN);
  },

  /**
   * Remove o token para deslogar
   */
  logout: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(KEY_TOKEN);
    await SecureStore.deleteItemAsync(KEY_USER_ID);
  },

  /**
   * GET /balance/:userId
   */
  getBalance: (userId: string, token: string): Promise<BalanceResponse> =>
    get<BalanceResponse>(`/balance/${userId}`, token),
};