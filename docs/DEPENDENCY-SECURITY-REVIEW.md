# Revisão de dependências — 2026-08-12

Comandos executados: `npm audit` em `backend-ts` e `app-mobile`. Nenhum `npm audit fix` foi executado.

## Backend

O relatório final apontou 7 achados: 2 altos e 5 moderados. `brace-expansion`, `fast-uri`, Hono, Valibot e a cadeia `@prisma/dev` são transitivos do conjunto de ferramentas instalado. A dependência direta `uuid`, anteriormente sem uso, foi removida. Deve-se atualizar Prisma e lockfile em branch própria, analisar se cada correção é compatível, validar migrations/client e repetir toda a suíte antes de produção.

O npm também informou que `@prisma/streams-local` declara Node >=22 enquanto o ambiente atual usa Node 20.20.2. Embora o build passe, a versão de Node suportada para build/deploy precisa ser alinhada e registrada.

## Aplicativo

O relatório apontou 25 pacotes: 15 altos e 10 moderados, principalmente ferramentas de build Expo/Metro e transitivos como `postcss`, `image-size`, `brace-expansion`, `js-yaml` e `nanoid`. A correção automática proposta migra para Expo 57/React Native incompatível com o SDK 54 atual.

Não aplicar `--force`. Planejar atualização coordenada do Expo, revisar a documentação de migração, executar `npx expo install --fix`, build Android/Web e testes manuais em aparelho físico. Até lá, não expor Metro/dev server à internet nem processar arquivos de build não confiáveis.

Este relatório é temporal e deve ser regenerado em CI e antes de cada release.
