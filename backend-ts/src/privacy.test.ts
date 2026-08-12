import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSENT_PURPOSES, PRIVACY_NOTICE } from './config/privacyNotice';
import { privacyRequestStatuses } from './services/privacyService';
import { containsSensitiveKeys, maskEmail, ownsResource, pseudonymize } from './utils/privacySecurity';

test('aviso possui versão e histórico explícitos', () => {
  assert.equal(PRIVACY_NOTICE.currentVersion, '2026-08-12');
  assert.ok(PRIVACY_NOTICE.history.some((item) => item.version === PRIVACY_NOTICE.currentVersion));
});

test('consentimento cadastrado é específico, opcional e revogável', () => {
  assert.deepEqual(Object.keys(CONSENT_PURPOSES), ['PUBLIC_AVATAR_HOSTING']);
  assert.equal(CONSENT_PURPOSES.PUBLIC_AVATAR_HOSTING.required, false);
});

test('autorização impede acesso a recurso de outro usuário', () => {
  assert.equal(ownsResource('owner', 'owner'), true);
  assert.equal(ownsResource('attacker', 'owner'), false);
  assert.equal(ownsResource(undefined, 'owner'), false);
});

test('auditoria mascara identificadores e logs podem mascarar e-mail', () => {
  assert.match(pseudonymize('user-id'), /^[a-f0-9]{16}$/);
  assert.notEqual(pseudonymize('user-id'), 'user-id');
  assert.equal(maskEmail('person@example.com'), 'p***@example.com');
});

test('detector identifica chaves sensíveis antes de serializar respostas', () => {
  assert.equal(containsSensitiveKeys({ account: { username: 'teddy' } }), false);
  assert.equal(containsSensitiveKeys({ account: { password: 'never' } }), true);
  assert.equal(containsSensitiveKeys({ access_token: 'never' }), true);
});

test('fluxo de exclusão exige aprovação separada do processamento', () => {
  assert.deepEqual(privacyRequestStatuses, ['AWAITING_CONFIRMATION', 'PENDING_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED']);
});
