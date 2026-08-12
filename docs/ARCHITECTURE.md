# Arquitetura atual

## Fluxo e fronteiras de confiança

```text
Expo Router ── JWT ──> Express ── Prisma transaction ──> PostgreSQL
                              ├── regras promocionais
                              ├── sessões de jogo
                              └── privacidade/auditoria
Máquina ── chave própria + id ─────────────────────────> resgate QR/NFC
Provedor Pix ── confirmação idempotente ───────────────> pedido pago
```

O JWT fornece a identidade do usuário. Parâmetros `:userId` legados são aceitos apenas quando coincidem com o JWT; jogos, carteira, pagamentos e privacidade não confiam em identidade enviada pelo cliente. A máquina possui autenticação separada.

## Backend

- `src/app.ts`: headers, CORS, limite JSON, rotas e resposta de erro genérica.
- `src/controllers/` e `src/routes/`: adaptação HTTP e autenticação/rate limiting.
- `src/services/`: transações atômicas de jogo, promoções, pagamento e privacidade.
- `src/config/promotionalRules.ts`: fonte única de valores promocionais e fuso `America/Manaus`.
- `prisma/schema.prisma`: usuários, dois ledgers, pedidos, máquinas, jogos e direitos de privacidade.

Conclusão de jogo, movimento promocional e incremento de TeddyCoins ocorrem na mesma transação. Check-in e bônus de compra usam referência idempotente. Pagamento pendente não credita nada; resgate da máquina debita apenas créditos.

## Aplicativo

- `app/`: rotas Expo Router e telas ativas.
- `src/contexts/AuthContext.tsx`: sessão persistida com SecureStore (nativo) ou armazenamento Web.
- `src/services/`: cliente HTTP autenticado; o token nunca entra nos logs.
- `src/theme/seasonalCampaigns.ts`: catálogo e seleção determinística de campanha.
- `src/games/`: lógica pura e testável do Caça às TeddyCoins.

Durante loading, telas preservam o último saldo confirmado ou exibem marcador de indisponibilidade; zero só é mostrado quando confirmado pelo backend.

## Datas e acessibilidade

Promoções e campanhas calculam datas no fuso `America/Manaus`. Preview de campanha existe apenas em desenvolvimento. O jogo respeita redução de movimento, usa alvos de toque adequados e não contém aposta, loot box ou recompensa financeira aleatória.
