# Teddycash Backend TS

Backend em Node.js, TypeScript, Express e Prisma para o projeto Teddycash.

## Estrutura

- `src/app.ts` - criação e exportação do aplicativo Express.
- `src/server.ts` - servidor HTTP usado apenas no desenvolvimento/local.
- `api/index.ts` - entrada serverless da Vercel.
- `src/config/prisma.ts` - cliente Prisma unico usado pela API.
- `src/controllers/` - regras dos endpoints.
- `src/routes/` - roteadores Express.
- `prisma/schema.prisma` - modelos do banco PostgreSQL.
- `prisma/migrations/` - historico de migrations.
- `dist/` - saida gerada por `npm run build`.

## Scripts

```bash
npm install
npm exec prisma generate
npm run build
npm run dev
```

Use `npm exec prisma validate` para validar o schema.

## Variaveis de ambiente

Crie ou mantenha `backend-ts/.env` com:

```bash
DATABASE_URL="postgresql://usuario:senha@localhost:5432/catchup"
JWT_SECRET="troque-este-segredo"
DEMO_PASSWORD="senha-local-opcional"
DEMO_MACHINE_API_KEY="chave-local-opcional"
FRONTEND_URL="http://localhost:8081"
PORT=8000
```

## Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /profile`
- `PATCH /profile`
- `GET /balance/:userId`
- `GET /transactions/:userId`
- `POST /machine-authorizations`
- `GET /machine-authorizations/:authorizationId`
- `POST /machine-authorizations/redeem`
- `GET /wallet`
- `GET /credit-packages`
- `POST /payment-orders/pix`
- `GET /payment-orders`
- `GET /payment-orders/:orderId`
- `GET /rewards/daily-checkin`
- `POST /rewards/daily-checkin`
- `GET /games`
- `GET /games/history`
- `POST /games/:gameId/start`
- `POST /games/:gameId/complete`

## Exemplos

```bash
curl http://localhost:8000/health
```

```bash
curl -X POST http://localhost:8000/auth/login
```

```bash
curl http://localhost:8000/wallet \
  -H "Authorization: Bearer TOKEN_DO_USUARIO"
```

```bash
curl -X POST http://localhost:8000/machine-authorizations \
  -H "Authorization: Bearer TOKEN_DO_USUARIO" \
  -H "Content-Type: application/json" \
  -d '{"amount":2,"machine_id":"machine-1","channel":"QR"}'
```

O resgate e autenticado pela propria maquina. O ID vem do cabecalho e nao do corpo:

```bash
curl -X POST http://localhost:8000/machine-authorizations/redeem \
  -H "Authorization: Bearer CHAVE_DA_MAQUINA" \
  -H "X-Machine-Id: machine-1" \
  -H "Content-Type: application/json" \
  -d '{"authorization_token":"TOKEN_DA_AUTORIZACAO"}'
```

A autorizacao expira em dois minutos. Criar uma nova cancela a anterior do mesmo usuario;
o resgate usa uma transacao atomica e cada token so pode ser consumido uma vez. Nenhum
credito e debitado na criacao: saldo e historico mudam apenas quando a maquina confirma.

Créditos só podem ser adicionados após a confirmação idempotente de um pedido de pagamento. TeddyCoins são promocionais e não podem ser convertidas em créditos ou transferidas para máquinas. Consulte `../docs/ECONOMY.md`.

## Observacoes de QA

- O TypeScript compila para `dist`, mantendo `src` sem arquivos gerados.
- O backend depende de PostgreSQL acessivel pela `DATABASE_URL`.
- Execute `npm exec prisma db seed` explicitamente para criar o usuario e a maquina demo fora de producao.
- Armazene somente o SHA-256 da chave de cada maquina em `Machine.apiKeyHash`; a chave em texto puro fica no dispositivo.

## PostgreSQL e Vercel

Crie um PostgreSQL gerenciado (Neon, Supabase ou equivalente), copie a connection
string SSL para `DATABASE_URL` e, após revisar o status das migrations, execute uma vez:

```bash
npx prisma migrate status
npm run db:deploy
```

Não use `migrate dev`, `db push` ou `migrate reset` em produção. Na Vercel, crie o
projeto com **Root Directory** `backend-ts` e cadastre `DATABASE_URL`, `JWT_SECRET`,
`FRONTEND_URL` e, se necessário, `ALLOWED_ORIGINS`, `GAME_SESSION_TTL_MS` e
`GAME_DAILY_SESSION_LIMIT`. O fuso das promoções é centralizado em
`src/config/promotionalRules.ts`. `ALLOWED_ORIGINS` aceita URLs separadas por vírgula. Faça um
Preview, valide `/health`, login e rotas autenticadas, e só então promova.

`confirmPaidOrder` é atualmente um serviço interno testado de forma idempotente; a integração autenticada com webhook de um provedor Pix real permanece pendente. Nunca aceite confirmação de pagamento enviada pelo aplicativo.
