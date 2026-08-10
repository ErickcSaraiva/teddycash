const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || 'http://localhost:8000').replace(/\/$/, '');

export const API_UNAVAILABLE_MESSAGE =
  'Não foi possível conectar ao TeddyCash. Verifique sua internet e tente novamente.';

