// A rota estática usa query string para funcionar no export web. A rota dinâmica
// antiga permanece disponível no app nativo para preservar links já existentes.
export { default } from './payment-order/[id]';
