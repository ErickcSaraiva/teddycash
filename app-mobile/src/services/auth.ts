import * as SecureStore from 'expo-secure-store';
import api from './api';

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
  userId: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });

    const token = response.data.token ?? response.data.access_token;
    const userId = response.data.userId ?? response.data.user_id;

    if (!token || !userId) {
      throw new Error('Resposta inválida do backend no login.');
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_ID_KEY, userId);

    return { ...response.data, token, userId };
  },

  async register(username: string, email: string, password: string): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', { username, email, password });
    return response.data;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
  },

  async getStoredToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async getStoredUserId(): Promise<string | null> {
    return SecureStore.getItemAsync(USER_ID_KEY);
  },
};
