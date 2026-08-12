# Inventário de dados e ciclo de vida

Documento técnico preliminar, versão 2026-08-12. Não constitui parecer jurídico nem declaração de conformidade integral.

| Dados | Finalidade técnica | Armazenamento/acesso | Compartilhamento | Retenção proposta | Hipótese legal a confirmar | Exclusão/anonimização |
|---|---|---|---|---|---|---|
| UUID, usuário, e-mail, hash de senha | Conta, autenticação e contato operacional | PostgreSQL; backend autorizado | Infraestrutura contratada | Vida da conta + prazo validado | Execução de contrato/legítimo interesse a validar | Identificadores substituídos após aprovação |
| Avatar opcional | Personalização | URL no PostgreSQL; imagem no Cloudinary se configurado | Cloudinary | Até revogação/encerramento; remoção externa pendente | Consentimento específico sugerido | URL removida imediatamente; exclusão externa operacional |
| Créditos, TeddyCoins e ledgers | Carteira, máquinas, pagamentos, antifraude e prestação de contas | PostgreSQL; titular e operação restrita | Provedor Pix/infra quando aplicável | Prazo fiscal/consumerista a definir | Contrato/obrigação legal a confirmar | Preservar somente registros obrigatórios, preferencialmente anonimizados |
| Pedido Pix e ID do provedor | Confirmar pagamento idempotente | PostgreSQL | Provedor Pix ainda não definido | Prazo financeiro a definir | Contrato/obrigação legal a confirmar | Minimizar e desvincular quando possível |
| Autorização de máquina e token temporário | Liberar jogada paga | PostgreSQL | Máquina autenticada | Curto prazo operacional + auditoria a definir | Execução de contrato/segurança a confirmar | Remover ou hash após expiração; migração pendente |
| Sessão, pontuação e resultado de jogo | Validar recompensa e prevenir fraude | PostgreSQL | Sem compartilhamento comercial previsto | Prazo antifraude mínimo a definir | Legítimo interesse/contrato a confirmar | Anonimizar conforme política aprovada |
| Consentimentos e solicitações | Provar escolhas e atender direitos | PostgreSQL | Operação de privacidade | Prazo probatório a definir | Obrigação legal/exercício de direitos a confirmar | Reter registro mínimo justificado |
| Audit logs pseudonimizados | Segurança e responsabilização | Banco/logs operacionais | Operadores de observabilidade a definir | 90 dias propostos; incidentes ao menos 5 anos | Legítimo interesse/obrigação regulatória a confirmar | Expurgo programado; sem payload pessoal |

Não são coletados atualmente: CPF, telefone, endereço, localização, contatos, gênero, religião, biometria, dados de saúde ou data de nascimento. Dados de jogo não podem ser usados para publicidade comportamental ou perfilamento comercial.

Papéis, controlador, encarregado, operadores, países de armazenamento, contatos e contratos precisam ser preenchidos antes da publicação.
