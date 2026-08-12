# Checklist LGPD e transparência

## Controles técnicos implementados

- identidade das rotas de privacidade obtida exclusivamente do JWT;
- versão de sessão verificada no banco e revogável;
- reautenticação para exportação, e-mail, consentimento e exclusão;
- exportação sem hashes de senha, tokens, segredos ou IDs internos de provedores;
- solicitação de exclusão com confirmação separada e revisão humana obrigatória;
- processamento irreversível sem rota pública;
- consentimento específico e opcional para avatar, desativado por padrão e revogável;
- auditoria com identificadores pseudonimizados;
- rate limit em login, cadastro e operações de privacidade;
- CORS por allowlist, limite de JSON, headers defensivos e mensagens de erro genéricas;
- histórico/versionamento do aviso de privacidade;
- ausência de personalização por dados sensíveis ou comportamento.

## Configurações pendentes

- configurar contatos do controlador e encarregado;
- definir operador de e-mail/entrega segura para exportações;
- configurar armazenamento distribuído para rate limiting em produção serverless;
- configurar exclusão de avatares no provedor, retenção/expurgo de logs e alertas de incidentes;
- revisar allowlist CORS e segredos em cada ambiente;
- migrar tokens de autorização de máquina para armazenamento com hash;
- criar painel administrativo com segregação de funções para aprovação, rejeição e retenção.

## Decisões comerciais pendentes

- países, provedores e compartilhamentos reais;
- disponibilidade por faixa etária;
- canais e SLA de atendimento;
- prazos de retenção por categoria;
- manutenção ou remoção dos campos legados `cashback` e `ThemeSettings`.

## Validação jurídica necessária

- hipótese legal por finalidade;
- política de retenção e exceções do art. 16;
- texto final do aviso e contratos com operadores;
- fluxo de menores e eventual consentimento verificável do responsável;
- critérios para aprovação/rejeição de exclusão e portabilidade;
- transferências internacionais e obrigações consumeristas/fiscais.

Este checklist não autoriza declarar o TeddyCash “100% em conformidade”.
