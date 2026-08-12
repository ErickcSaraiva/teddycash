# Sessões seguras de jogos

Todas as rotas exigem JWT. O usuário é obtido exclusivamente do token e nunca do payload.

## Fluxo

1. Consulte `GET /games`.
2. Inicie com `POST /games/coin-collector/start`.
3. Guarde em memória o `session.id` e o `session.token`. O backend armazena somente SHA-256 do token.
4. Ao final, envie para `POST /games/coin-collector/complete` o ID, token, duração, score alegado e eventos ordenados.
5. O backend recalcula o score, limita duração/frequência/quantidade, calcula a recompensa e credita somente TeddyCoins.

A conclusão, o incremento do saldo e `TeddyCoinTransaction` ocorrem na mesma transação Prisma. Repetir exatamente a conclusão retorna `idempotent: true`; alterar o payload retorna conflito e não gera outra recompensa.

## Exemplo de conclusão

```json
{
  "session_id": "UUID",
  "session_token": "TOKEN_RECEBIDO_NO_START",
  "duration_ms": 30000,
  "score": 2,
  "events": [
    { "sequence": 1, "type": "COIN_TAP", "occurred_at_ms": 100 },
    { "sequence": 2, "type": "COIN_TAP", "occurred_at_ms": 300 }
  ]
}
```

O rate limit em memória reduz abuso por instância. O limite diário persistente usa o PostgreSQL e `America/Manaus`. Em implantação serverless com múltiplas instâncias, recomenda-se substituir o rate limiter em memória por armazenamento distribuído.
