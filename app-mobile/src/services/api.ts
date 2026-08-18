import { create, isAxiosError } from 'axios';
import { API_BASE_URL, API_CONFIG_ERROR, API_UNAVAILABLE_MESSAGE } from '../config/api';
import { sessionStorage } from './sessionStorage';

const TOKEN_KEY = 'teddycash_token';

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number, public readonly code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const api = create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  if (!API_BASE_URL) throw new Error(API_CONFIG_ERROR);
  const token = await sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (__DEV__) console.log(`[API] ${config.method?.toUpperCase() ?? 'GET'} ${config.url ?? ''}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (__DEV__) console.log(`[API] ${response.config.method?.toUpperCase() ?? 'GET'} ${response.config.url ?? ''} -> ${response.status}`);
    return response;
  },
  (error) => {
    const message = getApiErrorMessage(error);
    if (__DEV__) {
      const method = error?.config?.method?.toUpperCase() ?? 'REQUEST';
      const path = error?.config?.url ?? '';
      console.log(`[API] ${method} ${path} -> ${error?.response?.status ?? 'NETWORK'}: ${message}`);
    }
    const responseError = error?.response?.data?.error;
    const code = typeof responseError === 'object' ? responseError?.code : undefined;
    return Promise.reject(new ApiError(message, error?.response?.status, code));
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === API_CONFIG_ERROR) return API_CONFIG_ERROR;
  if (!isAxiosError(error)) return error instanceof Error ? error.message : 'Não foi possível concluir a solicitação.';
  if (!error.response) return API_UNAVAILABLE_MESSAGE;
  const status = error.response.status;
  const data = error.response.data as { error?: string | { message?: string }; message?: string } | undefined;
  const backendMessage = typeof data?.error === 'string' ? data.error : data?.error?.message ?? data?.message;
  if (status === 400) return backendMessage ?? 'Verifique os dados informados.';
  if (status === 401) return 'E-mail ou senha incorretos.';
  if (status === 409) return backendMessage ?? 'A operação não pôde ser concluída por conflito de estado.';
  if (status >= 500) return 'O servidor encontrou um erro. Verifique o backend.';
  return backendMessage ?? `Não foi possível concluir a solicitação (HTTP ${status}).`;
}

export default api;
