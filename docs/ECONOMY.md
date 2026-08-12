# Economia do TeddyCash

## Saldos oficiais

- `creditBalance`: créditos comprados com dinheiro. Somente esse saldo pode ser debitado por uma autorização de máquina.
- `teddyCoins`: moedas promocionais concedidas por compras, check-in, jogos e campanhas. Não podem ser convertidas em créditos nem enviadas a máquinas.

O backend é a fonte oficial dos dois saldos. O mobile pode manter o último valor confirmado apenas para melhorar a experiência durante carregamentos.

## Ledgers

`Transaction` registra exclusivamente créditos financeiros. Toda nova mutação exige usuário, tipo, origem, valor inteiro, data, referência idempotente e saldo resultante. Registros anteriores à migration da Fase 2 podem ter `referenceId` e `balanceAfter` nulos porque esses dados não podem ser reconstruídos com segurança.

`TeddyCoinTransaction` registra exclusivamente movimentos promocionais e usa uma referência idempotente por usuário e tipo.

## Operações

- Pedido `PENDING`: não altera saldos.
- Confirmação idempotente de pagamento: credita os créditos do snapshot do pacote e seu bônus de TeddyCoins na mesma transação Prisma.
- Check-in e jogo: podem alterar somente TeddyCoins.
- Início de jogo: gratuito; não debita nenhum dos saldos.
- Resgate da máquina: debita somente `creditBalance`, junto com o ledger e o consumo da autorização.
- Conversão de TeddyCoins em créditos: proibida e removida da API ativa.

## Migration da Fase 2

O SQL renomeia `User.balance` para `User.creditBalance`, preservando os valores no lugar. Nenhuma tabela ou linha é removida. Tipos antigos do ledger são mapeados para valores legados explícitos; metadados desconhecidos permanecem nulos.

Antes de aplicar em qualquer ambiente, faça backup, revise os preflights do arquivo SQL e execute primeiro em uma cópia não produtiva. Não use `migrate reset` ou `db push`. A aplicação em produção não faz parte desta fase.
