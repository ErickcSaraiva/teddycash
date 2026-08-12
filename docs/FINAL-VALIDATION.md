# Validação final da Fase 8

## Cobertura automatizada

O teste integrado `backend-ts/src/system.integration.test.ts`, habilitado somente com `RUN_DB_TESTS=1`, cria dados sintéticos e valida cadastro, login, restauração de sessão, saldos, check-in, jogo, conclusão idempotente, limite diário, históricos, exportação, solicitação/confirmacão/cancelamento de exclusão, pedido Pix e resgates QR/NFC. Ele confirma que jogos e check-in não alteram créditos e que a máquina não altera TeddyCoins.

Use apenas banco isolado:

```bash
cd backend-ts
DATABASE_URL="postgresql://.../teddycash_test" RUN_DB_TESTS=1 npm test
```

Datas sazonais são cobertas por testes unitários. Para inspeção visual, consulte `SEASONAL-CAMPAIGNS.md`. Interações de câmera, comportamento offline real, redução de movimento, NFC/QR com hardware e Android físico exigem teste manual.

## Critérios antes de produção

- aplicar e validar migrations pendentes primeiro em staging;
- configurar CORS, segredos, banco e provedor Pix reais;
- substituir rate limiting em memória por armazenamento compartilhado em múltiplas instâncias;
- concluir revisão de dependências e os itens jurídicos documentados;
- executar matriz manual em Android físico e navegadores suportados;
- não executar o processador interno de anonimização sem aprovação jurídica/operacional.

## Resultado em 12 de agosto de 2026

- Backend: Prisma generate/validate, TypeScript e build aprovados; 21/21 testes passaram com PostgreSQL temporário.
- Mobile: TypeScript, lint, 24/24 testes e export estático das 21 rotas Web aprovados.
- Migrations: 11/11 aplicadas e schema atualizado no banco temporário; quatro migrations de `20260812` continuam pendentes no banco remoto configurado e não foram aplicadas.
- Dependências: `npm audit` encontrou 7 achados no backend (2 altos, 5 moderados) e 25 no app (15 altos, 10 moderados). Nenhuma atualização automática foi aplicada.
- Não executados: Android físico, câmera/QR real, NFC nativo, provedor Pix real, processamento irreversível de exclusão e deploy.
