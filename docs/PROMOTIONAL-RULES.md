# Regras promocionais

A fonte oficial fica em `backend-ts/src/config/promotionalRules.ts`. O mobile apenas exibe valores recebidos pela API.

## Regras atuais

- Check-in diário: 10 TeddyCoins, uma vez por dia em `America/Manaus`.
- Bônus de compra: 10 TeddyCoins por crédito confirmado.
- Resgate: 500 TeddyCoins por 1 crédito de jogada.
- Caça às TeddyCoins: limites e recompensa definidos na seção `games`.
- Campanhas futuras: estrutura preparada em `campaigns`, inicialmente vazia.

Preços e quantidades de créditos permanecem em `creditPackages.ts`. O bônus é derivado da quantidade de créditos e não deve ser duplicado em controllers ou telas.

## Alteração segura

1. Altere somente `promotionalRules.ts`.
2. Atualize ou adicione testes de snapshot da regra.
3. Não altere snapshots já gravados em `PaymentOrder`: pedidos existentes preservam o bônus exibido quando foram criados.
4. Execute TypeScript, testes e Prisma validate.
5. Revise impacto econômico antes da publicação.

Toda movimentação nova de TeddyCoins exige `source` e `referenceId`. Check-in, pagamento, jogo e resgate usam respectivamente `CHECK_IN`, `PAYMENT_ORDER`, `GAME_SESSION` e `REWARD_REDEMPTION`.
