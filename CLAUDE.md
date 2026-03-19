# Instruções

- Neste repositório quero que a cada iteração que faças alterações faças commit com descrição, valida se o git já existe, se não existir, inicia, com dev e master, cria uma branch chamada foundation a partir de dev para estes commits. Cria commit inclusive cada vez que as permissões ou algum ficheiro de claude muda.

- Usa playwright caso faça sentido para interagires com a app ou apps por forma a teres acesso ao browser, aos erros da consola afim de conseguires validar que as tuas alterações mais de fundo não partiram nada.

- Não quero update do types/node para 25 porque estou a usar o node 24.
- Qualquer sugestão de projeto novo é com node 24 e pnpm 10, bibliotecas sempre que possível as últimas versões, caso não seja alertar antes de continuar.
- Quando for para consumir pacotes fora deste repo temos de instalar via pnpm i _PATH_.
- Após instalar/update ou remover packages valida pnpm audit.
- Após finalizar uma iteração, verifica se é uma feature deste POC para poder registar.

- Uma nota muito importante sobre os testes, deves me pedir autorização sempre para alterar um teste ou unit test quando este antes já dava ok, portanto se já existia o teste então estava bem, se falhou com alguma iteração é importante ter certeza do meu lado que é intencional mudar o teste.

- Das bibliotecas internas @-label-/* que este projeto importa é importante referir que se algo não estiver de acordo com os requisitos que se tem aqui, deves sugerir investigação na biblioteca para sugerir alterações na biblioteca, através de confirmação minha.

- As alterações/edits que necessitares de fazer estão contidos no scope deste repositório apenas, a não ser que numa iteração eu te peça para fazer algo ao lado.

- Nunca apagues commits, nem este repositório. Histórico do código deve ser sempre mantido caso te desvies do objetivo.

## Checklist de fecho de TODO (OBRIGATÓRIO)

Antes de declarar qualquer TODO como completo, o agente DEVE executar automaticamente estes passos (sem o user pedir):

1. **Gotchas** — gravar no CLAUDE.md (secção Gotchas do TODO-XX) qualquer gotcha descoberto
2. **ADRs** — criar/atualizar os ADRs previstos no TODO (ver MIGRATION_PLAN_MF_VITE.md)
3. **FEATURES.md** — actualizar com as features implementadas neste TODO
4. **ARCHITECTURE.md** — actualizar se houve mudanças arquitecturais
5. **README.md** — actualizar se stack/scripts/estrutura mudou
6. **Commit documentação** — commitar tudo junto ou em commit separado de docs
7. **Skills** — correr sempre no final  `/r_pipeline-react`
8. **Resumo final** — informar o user: o que foi feito, gotchas, o que falta para o próximo TODO

Não é aceitável que o user tenha de perguntar "a documentação está atualizada?" — isso deve ser automático.

## Skills recomendadas por contexto

- Sempre que iniciar um novo TODO é importante carregar contexto do react `/c_react`
- Ao iniciar repositório usar `/c_react` apenas para dar contexto ee depois  `/r_init-repo`
- Ao criar/modificar package.json → usar `/r_package-json` para validação
- Ao terminar um TODO executar `/r_pipeline-react`

## Plano de Migração

Este repositório segue o plano documentado em `../POC_MFE_csr/docs/MIGRATION_PLAN_MF_VITE.md`.

O objetivo é replicar o POC_MFE_csr usando `@module-federation/vite` + Federation Runtime para carregamento dinâmico de MFEs via endpoint, em vez de `@originjs/vite-plugin-federation`.

Ficheiros de contexto disponíveis em `../POC_MFE_csr/docs/`:
- `ANALYSIS_CURRENT_POC.md` — análise completa do POC actual (features, patterns, stack)
- `ANALYSIS_FEDERATION_SPEC.md` — especificação técnica da arquitectura de federation actual
- `ANALYSIS_DEV_PATTERNS.md` — dev patterns a replicar (lint, prettier, hooks, changesets)
- `MIGRATION_PLAN_MF_VITE.md` — plano com 17 TODOs + tabela de rastreabilidade

## Gotchas (descobertos no TODO-01)

- **@-label-/lint-config exports:** usar `fullReactConfigs` para apps React, `defaultConfigs` para packages sem React. NÃO existe `fullConfigs`.
- **Arrow functions obrigatórias:** lint rule `prefer-arrow-functions` — usar sempre `export const foo = () => ...`, nunca `export function foo() { ... }`.
- **tsconfig.json obrigatório na root:** lint-config precisa de `tsconfig.json` (não apenas `tsconfig.base.json`) para import resolution.
- **Markdown code blocks:** todos os fenced blocks precisam de language specifier (```text, ```bash, etc.), nunca bare ```.

## Gotchas (descobertos no TODO-02)

- **@types/* no shared:** packages `@types/*` devem ser filtrados do `generateShared` — são type-only e o rolldown não consegue resolver os exports sob condições browser/module.
- **Federation infrastructure no ignore:** `@module-federation/runtime` e `@module-federation/vite` devem estar no `ignore` do `generateShared` — são infraestrutura de federation e não podem ser tratados como shared deps (causa conflitos de inicialização).
- **@-label-/mfe-loader no ignore:** este pacote wrappa `@module-federation/runtime` — se for shared, o plugin cria um wrapper virtual `loadShare` que perde os exports.
- **DTS plugin desactivado (`dts: false`):** o plugin DTS foi desactivado em todas as apps — ver [ADR-006](docs/adr/ADR-006-disable-dts-plugin.md). Os imports de MFEs são dinâmicos e os tipos partilham-se via `@-label-/contracts`.
- **@tailwindcss/vite peerDeps:** versão 4.2.1 não lista Vite 8 nos peerDeps — apenas warning, funciona normalmente.
- **`.__mf__temp` directories:** gerados pelo plugin MF no build, devem estar no `.gitignore` e `.prettierignore`.

## E2E: Shared Console Error Fixture

Todos os testes e2e DEVEM importar `test` e `expect` de `./fixtures` em vez de `@playwright/test`:

```typescript
import { expect, test } from './fixtures';
```

O fixture `consoleErrors` é `auto: true` — corre automaticamente no fim de cada teste e valida que não existem erros críticos na consola do browser. Os filtros actuais estão documentados em `docs/TODO_CONSOLE_ERRORS.md` — o objetivo é resolver cada root cause e remover o filtro.

Nunca adicionar novos filtros sem documentar no TODO e sem justificação clara.

## Versionamento & Publish

Segue o workflow de changesets. Comando de publish: `pnpm publish:packages`.
