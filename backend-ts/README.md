# Teddycash Backend TS

Backend em Node.js, TypeScript, Express e Prisma para o projeto Teddycash.

## Estrutura

- `src/server.ts` - entrada do servidor Express.
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
GAME_SECRET="troque-este-segredo"
JWT_SECRET="troque-este-segredo"
DEMO_PASSWORD="senha-local-opcional"
DEMO_MACHINE_API_KEY="chave-local-opcional"
PORT=8000
```

## Endpoints

- `GET /health`
- `POST /auth/login`
- `GET /balance/:userId`
- `GET /transactions/:userId`
- `POST /machine-authorizations`
- `POST /machine-authorizations/redeem`
- `POST /users/credit`
- `POST /games/start`
- `POST /games/reward`

## Exemplos

```bash
curl http://localhost:8000/health
```

```bash
curl -X POST http://localhost:8000/auth/login
```

```bash
curl http://localhost:8000/balance/user1
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

```bash
curl -X POST http://localhost:8000/users/credit \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","amount":100}'
```

## Observacoes de QA

- O TypeScript compila para `dist`, mantendo `src` sem arquivos gerados.
- O backend depende de PostgreSQL acessivel pela `DATABASE_URL`.
- Execute `npm exec prisma db seed` explicitamente para criar o usuario e a maquina demo fora de producao.
- Armazene somente o SHA-256 da chave de cada maquina em `Machine.apiKeyHash`; a chave em texto puro fica no dispositivo.
