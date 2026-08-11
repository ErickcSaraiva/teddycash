const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE?.trim().replace(/\/+$/, '') ?? '';
const isValidBaseUrl =
  /^https?:\/\/[^/\s]+(?::\d+)?$/.test(configuredBaseUrl) &&
  !configuredBaseUrl.includes('IP_ATUAL_DO_COMPUTADOR');

export const API_BASE_URL = isValidBaseUrl ? configuredBaseUrl : '';
export const API_CONFIG_ERROR =
  'Configure EXPO_PUBLIC_API_BASE com o endereço do backend, por exemplo http://IP_DO_COMPUTADOR:8000.';

export const API_UNAVAILABLE_MESSAGE = 'Não foi possível conectar ao servidor.';
