import api from './api';
import { createPrivacyApi } from './privacyApiCore';
export type { PrivacyOverview, PrivacyRequest } from './privacyApiCore';

export const privacyApi = createPrivacyApi({
  async get<T>(path: string) { return (await api.get<T>(path)).data; },
  async post<T>(path: string, body: unknown) { return (await api.post<T>(path, body)).data; },
  async put<T>(path: string, body: unknown) { return (await api.put<T>(path, body)).data; },
});
