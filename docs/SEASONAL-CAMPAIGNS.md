# Campanhas e temas sazonais

O catálogo visual fica em `app-mobile/src/theme/seasonalCampaigns.ts`. A seleção é impessoal: considera somente data, status e prioridade, sempre em `America/Manaus`. Nenhum perfil ou dado sensível é consultado.

## Cadastrar uma campanha

Adicione um item tipado a `SEASONAL_CAMPAIGNS` com `id`, `name`, `active`, `version`, `priority`, `schedule`, cores complementares com contraste revisado, emoji original, título e subtítulo. CTA e promoção são opcionais.

Agendamentos disponíveis: data fixa, mês completo, enésimo dia da semana, deslocamento relativo à Páscoa e intervalo absoluto. Em conflito, vence a maior prioridade; empate é resolvido pelo `id` em ordem alfabética para produzir resultado determinístico.

Uma promoção visual pode declarar apenas `backendRuleId`, mensagem e `authority: 'backend'`. A regra correspondente precisa existir e ser validada no backend antes de ativar a campanha. O aplicativo nunca calcula ou concede recompensa.

## Simulação local segura

Defina uma data em `app-mobile/.env.local`, reinicie o Expo limpando o cache e abra a Home:

```dotenv
EXPO_PUBLIC_CAMPAIGN_PREVIEW_DATE=2026-06-15
```

- Festa Junina: `2026-06-15`
- Halloween: `2026-10-31`
- Natal: `2026-12-25`

A simulação só é lida quando `__DEV__` é verdadeiro, mostra a indicação “simulação” e afeta apenas o banner. Remova a variável para retornar ao relógio real.

## Acessibilidade

O banner usa texto legível, rótulo semântico e CTA com alvo mínimo de 44 pontos. Não há partículas, movimento contínuo ou conteúdo piscante. A preferência de redução de movimento do sistema é observada pelo contexto.
