import axios from 'axios';
import { API_BASE_URL, API_UNAVAILABLE_MESSAGE } from '../config/api';
import { sessionStorage } from './sessionStorage';

const TOKEN_KEY = 'teddycash_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(undefined, (error) => {
  if (!error.response) error.message = API_UNAVAILABLE_MESSAGE;
  return Promise.reject(error);
});

export default api;
