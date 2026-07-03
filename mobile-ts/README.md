# Teddycash Mobile (React Native + TypeScript)

App móvel em Expo + TypeScript para Teddycash.

## Estrutura

- `App.tsx` - ponto de entrada e navegação por abas.
- `src/screens/Inicio.tsx` - tela inicial.
- `src/screens/Balance.tsx` - tela de saldo e seleção de valores.
- `src/screens/Transfer.tsx` - fluxo de transferência de moedas.
- `src/screens/Games.tsx` - galeria de jogos.
- `src/screens/Profile.tsx` - perfil e opções do usuário.
- `src/services/api.ts` - cliente HTTP para consumir o backend.
- `assets/` - imagens, fontes e recursos estáticos.

## Dependências principais

- `expo`
- `react`
- `react-native`
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`
- `react-native-gesture-handler`
- `react-native-safe-area-context`
- `react-native-screens`
- `@expo/vector-icons`

## Como rodar

```bash
cd mobile-ts
npm install
npx expo start
```

Abra o app em um emulador ou dispositivo via Expo Go.

## Configuração do backend

O app consome o backend TypeScript em `backend-ts`.

### Ajustar a URL base

A URL base está definida em `src/services/api.ts`:

```ts
this.baseUrl = baseUrl ?? process.env.API_BASE ?? 'http://localhost:8000';
```

Ajuste `localhost` para o IP da sua máquina se estiver testando em dispositivo físico.

### Endpoints usados

- `GET /health`
- `POST /auth/login`
- `GET /balance/:userId`
- `POST /transfer`
- `GET /transactions/:userId`

## Fluxo principal

1. O app abre em `início`.
2. `saldo` mostra o saldo atual, opções de máquinas e valores para enviar.
3. `transferência` processa a transferência selecionada e atualiza o saldo.
4. O histórico de transações é carregado a partir do backend.

## Teste rápido

1. Inicie o backend TypeScript:

```bash
cd backend-ts
npm run dev
```

2. Inicie o app Expo:

```bash
cd mobile-ts
npx expo start
```

3. Abra o app em um emulador ou Expo Go.
4. Verifique as abas `início`, `saldo` e `transferência`.
5. Execute uma transferência e confirme o saldo atualizado.

## Observações

- O app é um scaffold inicial e não inclui todas as telas do Flutter original.
- Ajuste `src/services/api.ts` para sincronizar a base URL com seu ambiente local.
- Para produção, adicione tratamento de erro mais robusto, autenticação real e testes.

## Assets

Imagens e fontes estão organizadas em `assets/`. Veja [assets/README.md](assets/README.md) para instruções sobre como usar e adicionar novos assets.

### Integrar imagens do Flutter

As imagens originais do app Flutter estão em `app-mobile/assets/images/`. Para migrar:

1. Copie as imagens necessárias para `mobile-ts/assets/images/`
2. Importe usando `require()` ou `Image` do React Native
3. Otimize para mobile se necessário

### Fontes customizadas

Para usar fontes personalizadas:

1. Coloque os arquivos `.ttf` em `assets/fonts/`
2. Configure com `expo-font` no `app.json`
3. Use `Font.loadAsync()` em um efeito
