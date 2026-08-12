# Minijogos — arquitetura adotada

O primeiro minijogo usa React Native e APIs já presentes no Expo SDK 54. Não foram adicionados engines, WebViews, bibliotecas de física, personagens, imagens ou sons externos.

## Componentes

- `app-mobile/src/games/coinCollectorLogic.ts`: lógica pura e testável de posição, pontuação, obstáculos, eventos e cronômetro.
- `app-mobile/app/coin-collector.tsx`: interface acessível da partida e integração com as sessões.
- `app-mobile/src/services/gamesApiCore.ts`: contrato de rede sem `userId` e sem recompensa definida pelo cliente.
- `backend-ts/src/constants/gameCatalog.ts`: catálogo e limites oficiais.
- `backend-ts/src/services/gameService.ts`: sessão, validação, idempotência e recompensa calculada pelo servidor.

## Segurança e economia

O usuário vem exclusivamente do JWT. O cliente envia sessão, token temporário, duração, placar alegado e eventos; o backend recalcula e valida o resultado. Conclusão, ledger e incremento de `teddyCoins` acontecem na mesma transação Prisma. Créditos financeiros não são cobrados nem recompensados pelo jogo.

Não há apostas, loot boxes, roletas, prêmios financeiros aleatórios, compra de vantagem ou perfilamento comercial por comportamento de jogo.

## Dependências e licença

O jogo não adicionou dependências. Ele usa React Native 0.81.5, Expo 54.0.36 e Expo Router 6.0.24, todos sob licença MIT. Emojis Unicode e componentes próprios formam os elementos visuais.

## Limitações

- A partida fica apenas em memória e é abandonada se o aplicativo for encerrado.
- Android físico requer teste manual de toque, desempenho e redução de movimento.
- O rate limiter em memória deve ser substituído por armazenamento distribuído em implantação com múltiplas instâncias.
