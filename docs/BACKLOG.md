# Backlog

Items descobertos durante implementação que ficam para futuros TODOs.

## Tooling

- [ ] **Playwright env files** — substituir as variáveis de ambiente inline nos scripts `test:e2e:smoke:*` por ficheiros `.env.dev-dev.playwright`, `.env.dev-preview.playwright`, `.env.preview-preview.playwright` que contenham as `E2E_*` vars. O script do `package.json` passaria apenas o ficheiro (ex: `dotenv -e .env.dev-dev.playwright pnpm run test:e2e:smoke`). Mais legível, mais fácil de manter, e evita linhas enormes nos scripts
- [ ] Regra ESLint para detectar `setSearchParams()` destrutivo (sem callback/prev) — ver ADR-008
- [ ] `VITE_ENABLE_STORE_DEVTOOLS` — no futuro poderia controlar também React Query DevTools
- [ ] **Browser targets** — definir `browserslist` (ou equivalente em `build.target` do Vite) em todos os projectos para garantir que o output de build está alinhado com os browsers suportados. Sem target explícito, o Vite usa defaults que podem incluir syntax demasiado moderna ou gerar polyfills desnecessários

## Packages

- [ ] Package `packages/shell-hooks` com hooks partilhados para cross-MFE (ex: `useVehicleSelection()`) — TODO-05
- [ ] Extrair `@-label-/shell-core` — shell store com dynamic slice registry (vanilla JS, framework-agnostic) — ver ADR-010
- [ ] Contracts por MFE (`@-label-/fleet-contracts`, `@-label-/rentals-contracts`, etc.) em repos separados — ver ADR-010. Para já, tipos de domínio vivem em `@-label-/contracts/domains/`

## Features

- [ ] Auth/RBAC/RoleSwitcher — quando houver requisitos detalhados
- [ ] Telemetry/trackEvent — quando decidir APM RUM
- [ ] **MSW passthrough selectivo** — investigar como usar MSW com vários endpoints mockados mas permitir que endpoints específicos mantenham a lógica real (passthrough). Útil para cenários onde se quer mockar a maioria dos endpoints mas manter um ou dois com chamadas reais (ex: `passthrough()` handler ou ordem de handlers)

## Documentação

- [ ] Rever ADRs — remover referências a TODOs de implementação e focar no racional da decisão. Quem lê os ADRs precisa de perceber as questões que se colocaram e porquê se tomou determinada decisão, não os detalhes de implementação por iteração. As secções de contexto, questões e alternativas consideradas são o valor — manter e reforçar.
- [ ] **Diagrama shell/host vs MFE standalone** — criar diagrama (Mermaid) que explique: (1) o que o host/shell carrega (providers, router, shared deps, layout) e o que os MFEs **não** precisam de carregar quando correm dentro do host; (2) quando um MFE arranca em modo standalone, o que carrega por si próprio; (3) dois modos de standalone — `dev` (Vite dev server) vs `build + preview` (bundle estático servido localmente). O objetivo é que qualquer developer consiga perceber a diferença de responsabilidades entre host e remote em cada cenário

## E2E / Testing

- [ ] **Visual regression: Host vs Standalone** — usar Playwright screenshots parciais (`locator.screenshot()`) para capturar a zona `<main>` de um remote **dentro do host** e o mesmo remote **standalone**, e comparar pixel-a-pixel com `pixelmatch`. Objetivo: garantir que o remote renderiza de forma idêntica nos dois contextos. Requer viewport igual, `networkidle` antes do screenshot, e atenção a wrappers/padding do slot no host.

## Console Errors (E2E Fixture Filters)

Filtros temporários adicionados ao `e2e/fixtures.ts` que devem ser resolvidos:

- [ ] `does not exist in container` + `failed to load:` + `recreate this component tree` — VehicleQuickView module não existe no fleet. Resolver quando fleet expuser o módulo.
