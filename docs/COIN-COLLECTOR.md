# Caça às TeddyCoins

Minijogo original construído somente com componentes React Native e emojis Unicode. Nenhuma biblioteca de jogo, arte comercial, som ou dependência adicional foi utilizada.

## Teste manual no Expo

Pré-requisito: usar um banco isolado com todas as migrations aplicadas. Não aponte um backend com código novo para um schema antigo.

1. Inicie o backend com `cd backend-ts && npm run dev`.
2. Configure `app-mobile/.env.local` com `EXPO_PUBLIC_API_BASE=http://IP_DO_COMPUTADOR:8000`.
3. Execute `cd app-mobile && npx expo start --clear`.
4. No Android físico, abra o QR pelo Expo Go; para Web, pressione `w`.
5. Faça login e confirme que Home mostra créditos e TeddyCoins separadamente.
6. Abra Jogos e confirme catálogo, saldo promocional, limite e recompensa máxima.
7. Abra Caça às TeddyCoins, leia as regras e inicie.
8. Toque em moedas/ursinhos e em pelo menos um obstáculo. Confirme cronômetro, placar e piso zero.
9. Aguarde 30 segundos. Confirme que a tela mostra apenas score e recompensa retornados pelo servidor e que a carteira atualiza.
10. Desligue a rede antes de terminar, aguarde o erro e religue. Use “Reenviar o mesmo resultado”.
11. Repita até alcançar o limite diário e confirme a mensagem correspondente.
12. Ative “Remover animações”/“Reduzir movimento” no sistema e confirme que o jogo permanece utilizável sem animações adicionais.
13. Durante uma partida, use Sair e confirme a caixa de abandono.
14. Revalide login, cadastro, compra Pix e transferência QR/NFC.

## Limitações atuais

- A sessão em andamento permanece somente em memória; encerrar o aplicativo abandona a partida.
- Não há som nem animações complexas.
- O rate limit distribuído do backend ainda é pendência para múltiplas instâncias serverless.
- O equilíbrio de score e recompensa precisa ser validado em dispositivos reais antes da produção.
