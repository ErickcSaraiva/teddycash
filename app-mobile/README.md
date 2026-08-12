# Teddycash Mobile

Aplicativo Expo SDK 54. O leitor usa `CameraView`, `useCameraPermissions`,
`barcodeScannerSettings={{ barcodeTypes: ['qr'] }}` e `onBarcodeScanned`, conforme a
[documentação oficial do expo-camera para SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/camera/).
O módulo faz parte do Expo Go nessa versão.

## Preparação

```bash
cd app-mobile
npm install
```

Crie `.env.local` (use o IP da máquina de desenvolvimento ao testar em celular):

```bash
EXPO_PUBLIC_API_BASE=http://SEU_IP_LOCAL:8000
```

Inicie com `npx expo start` e leia o QR do terminal pelo Expo Go. O QR da máquina
pode conter apenas `machine-1` ou JSON no formato `{"machine_id":"machine-1"}`.

## Fluxos funcionais

- Home mantém créditos e TeddyCoins visualmente separados e oferece o check-in diário.
- Jogos inicia uma sessão autenticada; Caça às TeddyCoins envia apenas eventos, pontuação e token temporário para validação do backend.
- Perfil > Privacidade e dados permite consultar/corrigir dados, exportar, solicitar exclusão, acompanhar status e gerenciar consentimento específico.
- O banner sazonal é escolhido pelo catálogo tipado em `src/theme/seasonalCampaigns.ts`, no fuso de Manaus.

## Roteiro de teste da autorização

1. Inicie o PostgreSQL e o backend, aplique as migrations e execute o seed de demonstração.
2. Entre no app e abra **Transferir para máquina**.
3. Selecione **QR Code**, toque em **Ler QR Code da máquina**, conceda acesso à câmera e leia o QR. Para NFC, selecione **NFC** e informe o identificador.
4. Informe de 1 a 10 créditos e crie a autorização. Confirme que o saldo ainda não mudou e que a validade exibida é de dois minutos.
5. Simule a máquina fora do app com o `curl` do README do backend e uma chave exclusiva do dispositivo de teste. Chaves de máquina nunca devem entrar em variáveis `EXPO_PUBLIC_*`.
6. Confirme a mensagem de sucesso, o novo saldo na Home e o débito `MACHINE_UNLOCK` no histórico.
7. Tente resgatar o mesmo token novamente; a API deve responder `409 AUTHORIZATION_UNAVAILABLE`.
8. Crie outra autorização e aguarde mais de dois minutos; o resgate deve falhar sem débito.
9. Saia da conta, encerre o app e abra-o novamente; token, usuário e saldos em cache não devem reaparecer.

## Validações

```bash
npx tsc --noEmit
npm run lint
npm test
npx expo config --type public
```

## Web e Vercel

O export estático é gerado em `dist`:

```bash
npm run typecheck
CI=1 npm run build:web
```

Na Vercel, crie um projeto com **Root Directory** `app-mobile`, cadastre
`EXPO_PUBLIC_API_BASE` com a URL HTTPS do backend e publique primeiro como Preview.
O token e os dados de sessão usam `SecureStore` no Android/iOS e `localStorage` na web.
NFC não está disponível no navegador; o fluxo QR continua acessível.

## Campanhas e privacidade

Para simular somente o banner em desenvolvimento, defina `EXPO_PUBLIC_CAMPAIGN_PREVIEW_DATE=2026-06-15` (Festa Junina), `2026-10-31` (Halloween) ou `2026-12-25` (Natal), reinicie com `npx expo start --clear` e remova a variável ao terminar. Isso não muda recompensa nem relógio do backend.

Para testar privacidade, abra Perfil > Privacidade e dados. Exportação, exclusão e consentimento pedem novamente a senha. Em testes de exclusão, confirme e depois cancele a solicitação; não há aprovação/processamento público e nenhum dado é apagado por esse fluxo.

## Limitações manuais

O export Web não valida câmera, redução de movimento do sistema nem Android físico. O canal NFC atual recebe o identificador da máquina; leitura NFC nativa não está implementada. Pix não fica disponível sem integração legítima do provedor no backend.
