import { createHash } from 'crypto';

export function pseudonymize(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[invalid-email]';
  return `${local.slice(0, 1)}***@${domain}`;
}

export function ownsResource(authenticatedUserId: string | undefined, ownerId: string) {
  return Boolean(authenticatedUserId && authenticatedUserId === ownerId);
}

export function containsSensitiveKeys(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) =>
    /password|token|secret|authorization|api[_-]?key|providerId/i.test(key) || containsSensitiveKeys(nested));
}
