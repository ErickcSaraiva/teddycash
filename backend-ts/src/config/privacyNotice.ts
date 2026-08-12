export const PRIVACY_NOTICE = {
  currentVersion: '2026-08-12',
  effectiveDate: '2026-08-12',
  title: 'Aviso de Privacidade do TeddyCash',
  history: [
    { version: '2026-08-12', effectiveDate: '2026-08-12', summary: 'Versão inicial do fluxo de direitos, consentimentos específicos e proteção de menores.' },
  ],
} as const;

export const CONSENT_PURPOSES = {
  PUBLIC_AVATAR_HOSTING: {
    version: '1.0',
    title: 'Hospedagem pública do avatar',
    description: 'Autoriza o envio opcional da imagem escolhida a um provedor externo de hospedagem. A conta funciona sem avatar.',
    required: false,
  },
} as const;

export type ConsentPurpose = keyof typeof CONSENT_PURPOSES;
