import api from './api';
import { sessionStorage } from './sessionStorage';

const TOKEN_KEY = 'teddycash_token';
const USER_ID_KEY = 'teddycash_user_id';

export interface LoginResponse {
  token?: string;
  access_token?: string;
  userId?: string;
  user_id?: string;
  username?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id: string;
  username: string;
}

export interface ProfileResponse { user_id: string; username: string; email: string; avatarUrl?: string | null }
export interface BalanceResponse { user_id: string; balance: number }

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', { email: email.trim().toLowerCase(), password });

    const token = response.data.token ?? response.data.access_token;
    const userId = response.data.userId ?? response.data.user_id;

    if (!token || !userId) {
      throw new Error('Resposta inválida do backend no login.');
    }

    return { ...response.data, token, userId };
  },

  async register(username: string, email: string, password: string): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', {
      username: username.trim(), email: email.trim().toLowerCase(), password,
    });
    return response.data;
  },

  async persistSession(token: string, userId: string): Promise<void> {
    try {
      await sessionStorage.setItem(TOKEN_KEY, token);
      await sessionStorage.setItem(USER_ID_KEY, userId);
    } catch (error) {
      await Promise.allSettled([sessionStorage.removeItem(TOKEN_KEY), sessionStorage.removeItem(USER_ID_KEY)]);
      throw error;
    }
  },

  getProfile: async (userId: string, token?: string): Promise<ProfileResponse> =>
    (await api.get<ProfileResponse>(`/profile/${userId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)).data,

  updateProfile: async (userId: string, body: { username?: string; email?: string; avatarUrl?: string | null }): Promise<ProfileResponse> =>
    (await api.patch<ProfileResponse>(`/profile/${userId}`, body)).data,

  getBalance: async (userId: string): Promise<BalanceResponse> =>
    (await api.get<BalanceResponse>(`/balance/${userId}`)).data,

  async logout(): Promise<void> {
    await sessionStorage.removeItem(TOKEN_KEY);
    await sessionStorage.removeItem(USER_ID_KEY);
  },

  async getStoredToken(): Promise<string | null> {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  async getStoredUserId(): Promise<string | null> {
    return sessionStorage.getItem(USER_ID_KEY);
  },
};
