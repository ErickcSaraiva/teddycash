import assert from 'node:assert/strict';
import test from 'node:test';
import { createPrivacyApi, type PrivacyTransport } from './privacyApiCore';

test('rotas de privacidade usam somente a identidade do JWT', async () => {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  const transport: PrivacyTransport = {
    async get<T>(path: string) { calls.push({ method: 'GET', path }); return {} as T; },
    async post<T>(path: string, body: unknown) { calls.push({ method: 'POST', path, body }); return {} as T; },
    async put<T>(path: string, body: unknown) { calls.push({ method: 'PUT', path, body }); return {} as T; },
  };
  const api = createPrivacyApi(transport);
  await api.overview(); await api.requestExport('test-password'); await api.requestDeletion('test-password');
  await api.confirmDeletion('request 1', 'test-password'); await api.cancelDeletion('request 1', 'test-password');
  await api.setConsent('PUBLIC_AVATAR_HOSTING', false, 'test-password');
  assert.ok(calls.every((call) => !call.path.includes('user')));
  assert.ok(calls.every((call) => !call.body || !('userId' in (call.body as object))));
  assert.equal(calls[3].path, '/privacy/requests/request%201/confirm');
});

test('consentimento não é previamente concedido pelo cliente', async () => {
  let body: unknown;
  const transport: PrivacyTransport = { async get<T>() { return {} as T; }, async post<T>() { return {} as T; }, async put<T>(_path: string, value: unknown) { body = value; return {} as T; } };
  await createPrivacyApi(transport).setConsent('PUBLIC_AVATAR_HOSTING', false, 'password');
  assert.deepEqual(body, { purpose: 'PUBLIC_AVATAR_HOSTING', granted: false, password: 'password' });
});
