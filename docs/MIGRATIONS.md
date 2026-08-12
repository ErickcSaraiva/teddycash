# Migrations

## Procedimento seguro

1. Faça backup e restaure uma cópia isolada.
2. Execute `npx prisma validate`, `npx prisma generate` e `npx prisma migrate status`.
3. Revise cada SQL ainda pendente.
4. Aplique em staging com `npx prisma migrate deploy` e execute os testes integrados.
5. Planeje janela e rollback antes de produção.

Nunca use `prisma migrate reset` ou `db push` em produção.

## Cadeia atual

- `20260621141656_init_users_and_balances`
- `20260622235810_criar_tabela_settings`
- `20260630140754_init`
- `20260802024726_add_password_and_machine_authorizations`
- `20260803002102_criando_tabelas_iniciais`
- `20260803030550_add_economia_dupla`
- `20260805000000_harden_machine_authorizations`
- `20260812000000_separate_credit_balance_and_ledger`
- `20260812010000_secure_game_sessions`
- `20260812020000_add_promotional_movement_source`
- `20260812030000_add_privacy_rights`

As quatro migrations de `20260812` são aditivas ou preservam dados: renomeiam o saldo financeiro, separam o ledger promocional, adicionam sessões/referências e estruturas de privacidade. A migration histórica `20260630140754_init` contém remoção de `settings`; ela antecede estas fases e não deve ser editada depois de aplicada. Em instalações existentes, confirme o histórico real antes de qualquer deploy.

Na validação da Fase 8, todas as 11 migrations foram aplicadas com sucesso em PostgreSQL temporário vazio. O banco remoto configurado apresentou as quatro migrations `20260812...` como pendentes; nenhuma foi aplicada pela validação.
