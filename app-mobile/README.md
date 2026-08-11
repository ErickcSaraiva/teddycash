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

## Roteiro de teste da autorização

1. Inicie o PostgreSQL e o backend, aplique as migrations e execute o seed de demonstração.
2. Entre no app e abra **Transferir para máquina**.
3. Selecione **QR Code**, toque em **Ler QR Code da máquina**, conceda acesso à câmera e leia o QR. Para NFC, selecione **NFC** e informe o identificador.
4. Informe de 1 a 10 créditos e crie a autorização. Confirme que o saldo ainda não mudou e que a validade exibida é de dois minutos.
5. Em desenvolvimento, toque em **Simular confirmação do ESP32 (dev)**. Esse controle é protegido por `__DEV__` e não entra na interface de produção.
6. Confirme a mensagem de sucesso, o novo saldo na Home e o débito `MACHINE_UNLOCK` no histórico.
7. Tente resgatar o mesmo token novamente com o `curl` do README do backend; a API deve responder `409 AUTHORIZATION_UNAVAILABLE`.
8. Crie outra autorização e aguarde mais de dois minutos; o resgate deve falhar sem débito.
9. Saia da conta, encerre o app e abra-o novamente; token, usuário e saldos em cache não devem reaparecer.

## Validações

```bash
npx tsc --noEmit
npm run lint
npx expo config --type public
```

## Web e Vercel

O export estático é gerado em `dist`:

```bash
npm run typecheck
npm run build:web
```

Na Vercel, crie um projeto com **Root Directory** `app-mobile`, cadastre
`EXPO_PUBLIC_API_BASE` com a URL HTTPS do backend e publique primeiro como Preview.
O token e os dados de sessão usam `SecureStore` no Android/iOS e `localStorage` na web.
NFC não está disponível no navegador; o fluxo QR continua acessível.
