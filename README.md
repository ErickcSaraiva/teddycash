# TeddyCash

Plataforma TypeScript formada por API Express/Prisma/PostgreSQL e aplicativo Expo/React Native. O produto mantém duas economias independentes:

- `creditBalance`: créditos financeiros, adicionados apenas por pagamento confirmado e usados nas máquinas;
- `teddyCoins`: pontos promocionais de check-in, compras e minijogos, sem conversão em créditos.

O backend é a fonte oficial de autenticação, saldos, recompensas e históricos. O aplicativo nunca informa `userId` como identidade nem calcula recompensas.

## Componentes

- `backend-ts/`: API, regras econômicas, sessões de jogo, privacidade e schema Prisma.
- `app-mobile/`: Expo Router para Android e Web.
- `docs/`: arquitetura, economia, campanhas, privacidade, segurança e roteiros de teste.
- `mobile-ts/`: código histórico, fora da aplicação Expo ativa.

Consulte [Arquitetura](docs/ARCHITECTURE.md), [Economia](docs/ECONOMY.md), [APIs](backend-ts/README.md), [Expo](app-mobile/README.md) e [Migrations](docs/MIGRATIONS.md).

## Ambiente local

Requisitos: Node.js compatível com os lockfiles e PostgreSQL. Não reutilize banco de produção.

```bash
cd backend-ts
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Em outro terminal:

```bash
cd app-mobile
npm install
npx expo start --clear
```

Configure os nomes listados em `backend-ts/.env.example` e `app-mobile/.env.example`; nunca versione valores reais. No Android físico, `EXPO_PUBLIC_API_BASE` deve usar o IP alcançável do computador, não `localhost`.

## Verificação

```bash
cd backend-ts
npx tsc --noEmit
npm test
npx prisma validate

cd ../app-mobile
npm run typecheck
npm run lint
npm test
CI=1 npm run build:web
```

Testes que mutam dados exigem `RUN_DB_TESTS=1` e uma `DATABASE_URL` exclusiva de testes. Não use `prisma migrate reset`, `db push` ou seed em produção.

## Estado e limites

Caça às TeddyCoins, check-in, temas sazonais e área de privacidade estão implementados. Aprovação/processamento de exclusão, base legal, retenção e estratégia etária ainda exigem decisões operacionais e revisão jurídica. NFC no app representa o canal de autorização por identificador; leitura NFC nativa de hardware não está implementada. Consulte [Validação final](docs/FINAL-VALIDATION.md).
