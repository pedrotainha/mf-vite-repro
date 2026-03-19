# Features Técnicas — POC MFE CSR (@module-federation/vite)

Decisões técnicas, arquitectura e patterns implementados neste POC.

## TODO-01: Scaffolding

- tsconfig.base.json com strict mode + path aliases

## TODO-02: Federation Host + Fleet Remote

- **@module-federation/vite** configurado no host (port 5173) e fleet remote (port 5174)
- **Federation Runtime** (`@module-federation/runtime`): `init()`, `registerRemotes()`, `loadRemote()`
- **`@-label-/mfe-loader`**: abstração sobre o runtime com `initFederation`, `registerMfeRemotes`, `lazyRemoteComponent` (com cache)
- **`@-label-/vite-plugin-mfe-config-api`**: Vite plugin que serve `mfe.config.json` como `/api/mfes` (dev + preview)
- **`@-label-/federation-config`**: `generateShared()` com traversal depth-first de node_modules (maxDepth=3), symlink-aware, singleton prefixes
- **Shared deps**: react + react-dom como singletons, `@-label-/ui-*` prefix singleton, `@module-federation/runtime` + `@-label-/mfe-loader` no ignore
- **E2E Playwright** (5 testes): host loads, fleet MFE renders, no console errors, /api/mfes endpoint, React singleton validation
- **ADR-001**: escolha de `@module-federation/vite` sobre `@originjs`
- **ADR-002**: Federation Runtime para carregamento dinâmico
- **ADR-003**: endpoint `/api/mfes` como single source of truth

## TODO-03: Shell UI — Sidebar, Header, Layout + Routing

- **CSS architecture**: Tailwind v4 com globals centralizados em `@-label-/ui-internal-core`, `@source` por app
- **File organization**: folder + explicit name, sem barrel exports
- **`@-label-/ui-internal-core` 0.3.33**: SidebarInset patch (`<div>` em vez de `<main>` para evitar duplicate landmark)
- **`hostInitInjectLocation: 'entry'`**: fix para TLA deadlock — inject no entry point em vez de `<script>` separado
- **E2E fixture partilhado** (`e2e/fixtures.ts`): auto-use `consoleErrors` — valida ausência de erros críticos na consola em cada teste
- **E2E tests** (14 testes):
  - Shell navigation: sidebar items, SPA nav fleet/rentals/maintenance, breadcrumbs (6)
  - Federation: host load, /api/mfes, React singleton (3)
  - Error handling: 404, 404→home, broken remote error boundary (3)
  - Accessibility: home + fleet axe a11y check (2)
- **ADR-004**: CSS architecture para Module Federation (Tailwind v4 + @source)
- **ADR-005**: File organization — folder + explicit name, sem barrel exports
- **ADR-006**: Disable DTS plugin (`dts: false`) — tipos via `@-label-/contracts`, sem valor com imports dinâmicos
