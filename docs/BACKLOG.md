# Backlog

Items descobertos durante implementação que ficam para futuros TODOs.

## Tooling

- [ ] **Playwright env files** — substituir as variáveis de ambiente inline nos scripts `test:e2e:smoke:*` por ficheiros `.env.dev-dev.playwright`, `.env.dev-preview.playwright`, `.env.preview-preview.playwright` que contenham as `E2E_*` vars. O script do `package.json` passaria apenas o ficheiro (ex: `dotenv -e .env.dev-dev.playwright pnpm run test:e2e:smoke`). Mais legível, mais fácil de manter, e evita linhas enormes nos scripts
- [ ] Regra ESLint para detectar `setSearchParams()` destrutivo (sem callback/prev) — ver ADR-008
- [ ] `VITE_ENABLE_STORE_DEVTOOLS` — no futuro poderia controlar também React Query DevTools
- [ ] **Browser targets** — definir `browserslist` (ou equivalente em `build.target` do Vite) em todos os projectos para garantir que o output de build está alinhado com os browsers suportados. Sem target explícito, o Vite usa defaults que podem incluir syntax demasiado moderna ou gerar polyfills desnecessários
- [ ] **VSCode workspace launcher plugin** — extensão visual para o VSCode que lista os projectos do pnpm workspace e permite arrancar dev servers, builds e testes por app com um clique. Em vez de memorizar filtros (`pnpm --filter @-label-/fleet dev`), o painel mostraria as apps com botões de start/stop. Investigar se existe extensão existente (ex: "pnpm Workspace Tools") ou se vale a pena criar uma custom com a API de tasks do VSCode (`tasks.json` dinâmico gerado a partir do `pnpm-workspace.yaml`)

## Packages

- [ ] Package `packages/shell-hooks` com hooks partilhados para cross-MFE (ex: `useVehicleSelection()`) — TODO-05
- [x] ~~Extrair `@-label-/shell-core` — shell store com dynamic slice registry (vanilla JS, framework-agnostic) — ver ADR-010~~ (implementado)
- [ ] Contracts por MFE (`@-label-/fleet-contracts`, `@-label-/rentals-contracts`, etc.) em repos separados — ver ADR-010. Para já, tipos de domínio vivem em `@-label-/contracts/domains/`

## Features

- [ ] Auth/RBAC/RoleSwitcher — quando houver requisitos detalhados
- [ ] Telemetry/trackEvent — quando decidir APM RUM
- [ ] **MSW passthrough selectivo** — investigar como usar MSW com vários endpoints mockados mas permitir que endpoints específicos mantenham a lógica real (passthrough). Útil para cenários onde se quer mockar a maioria dos endpoints mas manter um ou dois com chamadas reais (ex: `passthrough()` handler ou ordem de handlers)
- [ ] **URL params → form filters (serializer/deserializer)** — implementar sistema de serialização/deserialização de URL search params para preencher formulários de filtro automaticamente. Dois tipos de formulários a considerar: (1) **formulários de filtro** — usados para pesquisa/listagem, estado reflectido na URL para partilha/bookmarking; (2) **formulários de entidade** — criação/edição de recursos, estado não na URL. Investigar se Zod pode servir como schema source para o serialize/deserialize (ex: `z.string().default('')` → param string, `z.coerce.number()` → param numérico). O serializer deve converter o state do form para `URLSearchParams` e vice-versa, com suporte a valores default, arrays, e limpeza de params vazios

## Documentação

- [ ] Rever ADRs — remover referências a TODOs de implementação e focar no racional da decisão. Quem lê os ADRs precisa de perceber as questões que se colocaram e porquê se tomou determinada decisão, não os detalhes de implementação por iteração. As secções de contexto, questões e alternativas consideradas são o valor — manter e reforçar.
- [ ] **Diagrama shell/host vs MFE standalone** — criar diagrama (Mermaid) que explique: (1) o que o host/shell carrega (providers, router, shared deps, layout) e o que os MFEs **não** precisam de carregar quando correm dentro do host; (2) quando um MFE arranca em modo standalone, o que carrega por si próprio; (3) dois modos de standalone — `dev` (Vite dev server) vs `build + preview` (bundle estático servido localmente). O objetivo é que qualquer developer consiga perceber a diferença de responsabilidades entre host e remote em cada cenário

## E2E / Testing

- [ ] **Visual regression: Host vs Standalone** — usar Playwright screenshots parciais (`locator.screenshot()`) para capturar a zona `<main>` de um remote **dentro do host** e o mesmo remote **standalone**, e comparar pixel-a-pixel com `pixelmatch`. Objetivo: garantir que o remote renderiza de forma idêntica nos dois contextos. Requer viewport igual, `networkidle` antes do screenshot, e atenção a wrappers/padding do slot no host.

## POC / Investigação

- [ ] **Tailwind v3 compatibility** — POC para avaliar o impacto de suportar Tailwind v3 no ecossistema actual. Pontos a investigar: (1) diferenças de configuração entre v3 (`tailwind.config.js` + PostCSS) e v4 (`@theme`, `@source`, CSS-first); (2) impacto nos packages `@-label-/ui-internal-*` que actualmente usam v4 — seria necessário manter dual build ou versões separadas?; (3) `@source` directives (v4-only) vs `content` paths (v3) e como isso afecta o federation CSS pipeline; (4) singleton sharing de Tailwind runtime/preflight entre host e remotes quando as versões diferem; (5) impacto nos tokens/theme — v4 usa CSS custom properties nativas, v3 usa `theme()` resolve-time; (6) avaliar se MFEs legacy em v3 podem correr dentro de um host v4 sem conflitos de classes/reset

## Segurança

- [ ] **Recomendações de segurança** — implementar e documentar boas práticas de segurança para o ecossistema MFE. Pontos a investigar: (1) CSP (Content Security Policy) — headers adequados para federation com dynamic imports e múltiplas origens; (2) sanitização de dados entre host e remotes (shared state, events, query params); (3) validação de integridade dos remotes carregados (SRI / subresource integrity para chunks federados); (4) CORS — configuração correcta para endpoints de manifest/remoteEntry entre domínios; (5) secrets/env vars — garantir que variáveis sensíveis não são expostas no bundle do browser; (6) dependências — política de audit contínuo e response a CVEs; (7) autenticação/autorização — token handling seguro em contexto MFE (storage, refresh, propagação entre remotes)

## Console Errors (E2E Fixture Filters)

Filtros temporários adicionados ao `e2e/fixtures.ts` que devem ser resolvidos:

- [ ] `does not exist in container` + `failed to load:` + `recreate this component tree` — VehicleQuickView module não existe no fleet. Resolver quando fleet expuser o módulo.
