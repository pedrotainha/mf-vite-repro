# Instruções

- Neste repositório quero que a cada iteração que faças alterações faças commit com descrição, valida se o git já existe, se não existir, inicia, com dev e master, cria uma branch chamada foundation a partir de dev para estes commits. Cria commit inclusive cada vez que as permissões ou algum ficheiro de claude muda.

- Usa playwright caso faça sentido para interagires com a app ou apps por forma a teres acesso ao browser, aos erros da consola afim de conseguires validar que as tuas alterações mais de fundo não partiram nada.

- Não quero update do types/node para 25 porque estou a usar o node 24.
- Qualquer sugestão de projeto novo é com node 24 e pnpm 10, bibliotecas sempre que possível as últimas versões, caso não seja alertar antes de continuar.
- Quando for para consumir pacotes fora deste repo temos de instalar via pnpm i _PATH_.
- Após instalar/update ou remover packages valida pnpm audit.
- Após finalizar uma iteração, verifica se é uma feature deste POC para poder registar nos ficheiros de features adequados.

- Uma nota muito importante sobre os testes, deves me pedir autorização sempre para alterar um teste ou unit test quando este antes já dava ok, portanto se já existia o teste então estava bem, se falhou com alguma iteração é importante ter certeza do meu lado que é intencional mudar o teste.

- Das bibliotecas internas @-label-/* que este projeto importa é importante referir que se algo não estiver de acordo com os requisitos que se tem aqui, deves sugerir investigação na biblioteca para sugerir alterações na biblioteca, através de confirmação minha.

- As alterações/edits que necessitares de fazer estão contidos no scope deste repositório apenas, a não ser que numa iteração eu te peça para fazer algo ao lado.

- Nunca apagues commits, nem este repositório. Histórico do código deve ser sempre mantido caso te desvies do objetivo.

## Checklist de fecho de TODO (OBRIGATÓRIO)

Antes de declarar qualquer TODO como completo, o agente DEVE executar automaticamente estes passos (sem o user pedir):

1. **Gotchas** — gravar no CLAUDE.md (secção Gotchas do TODO-XX) qualquer gotcha descoberto
2. **ADRs** — criar/atualizar os ADRs previstos no TODO (ver MIGRATION_PLAN_MF_VITE.md)
3. **Features** — actualizar o ficheiro adequado conforme o tipo de feature:
   - `docs/FEATURES_FUNCTIONAL.md` — features orientadas ao utilizador/produto (UI, navegação, MFEs)
   - `docs/FEATURES_TECHNICAL.md` — decisões técnicas, arquitectura, patterns e ADRs
   - `docs/FEATURES_TOOLING.md` — stack de tooling, changesets, lint, formatting, majors pinadas
   - `docs/FEATURES.md` — index que aponta para os 3 ficheiros acima (não colocar conteúdo aqui)
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

## Gotchas (descobertos no TODO-04)

- **`react-hooks/static-components`:** componentes lazy de federation criados via `getOrCreatePanelComponent()` são detectados como "created during render". Solução: passar o componente como **prop** ao child component (mesmo pattern do `RemoteSlot` no App.tsx), em vez de resolver dentro do render.
- **oxlint `exhaustive-deps`:** oxlint não honora `// eslint-disable` comments. Para one-shot effects, adicionar as deps ao array e usar `useRef` guard em vez de `[]` vazio.
- **`setSearchParams` destrutivo:** `setSearchParams({ key: value })` apaga todos os outros query params. Usar **sempre** `setSearchParams(prev => { prev.set(...); return prev; })` com callback/merge pattern.
- **Sheet overlay bloqueia clicks:** quando um `Sheet` (shadcn) está aberto, o overlay `data-state="open"` intercepts pointer events. Em E2E tests, usar `page.keyboard.press('Escape')` em vez de clicar no overlay, ou usar programmatic navigation.
- **`getByText` strict mode com Sheet:** o `SheetTitle` e `SheetDescription` (sr-only) ambos contêm o mesmo texto. Usar `getByRole('heading', { name: '...' }).first()` para selectores mais específicos.

## E2E: Shared Console Error Fixture

Todos os testes e2e DEVEM importar `test` e `expect` de `./fixtures` em vez de `@playwright/test`:

```typescript
import { expect, test } from './fixtures';
```

O fixture `consoleErrors` é `auto: true` — corre automaticamente no fim de cada teste e valida que não existem erros críticos na consola do browser.

### Filtros intencionais (não são bugs)

| Filter | Reason |
|--------|--------|
| `localhost:9999` | Remote intencionalmente partido para testes de error-handling |
| `Failed to load resource` | Companion browser-level do filtro `localhost:9999` |
| `Download the React DevTools` | Mensagem info do React em dev mode, não é erro real |
| `does not exist in container` | Panel module VehicleQuickView não existe no fleet (placeholder — TODO: expor módulo) |
| `failed to load:` | MfeErrorBoundary log companion do erro de container acima |
| `recreate this component tree` | React error boundary re-render message companion |

### Regra: nunca adicionar filtros sem justificação

- Cada filtro novo DEVE ter justificação clara e documentada.
- O objetivo é sempre resolver o root cause em vez de filtrar.
- Se um erro de consola aparecer nos testes, investigar a causa antes de adicionar filtro.

## Versionamento & Publish

Segue o workflow de changesets. Comando de publish: `pnpm publish:packages`.
