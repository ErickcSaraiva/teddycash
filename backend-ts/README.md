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
PORT=8000
```

## Endpoints

- `GET /health`
- `POST /auth/login`
- `GET /balance/:userId`
- `POST /transfer`
- `GET /transactions/:userId`
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
curl -X POST http://localhost:8000/transfer \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user1","amount":100,"machine_id":"machine-1"}'
```

```bash
curl -X POST http://localhost:8000/users/credit \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","amount":100}'
```

## Observacoes de QA

- O TypeScript compila para `dist`, mantendo `src` sem arquivos gerados.
- O backend depende de PostgreSQL acessivel pela `DATABASE_URL`.
- `POST /auth/login` cria/garante o usuario demo `user1` para facilitar testes locais do app mobile.
