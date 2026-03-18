# Features — POC MFE CSR (@module-federation/vite)

Registo de features implementadas neste POC, por TODO do plano de migração.

## TODO-01: Scaffolding

- Monorepo pnpm workspaces (apps/ + packages/ + clients/ + openapi/)
- Dev patterns: ESLint + oxlint + Prettier + lint-staged + simple-git-hooks + commit-lint
- Changesets para versionamento
- tsconfig.base.json com strict mode + path aliases
- Node 24, pnpm 10, TypeScript 5.9

## TODO-02: Federation Host + Fleet Remote

- **@module-federation/vite** configurado no host (port 5173) e fleet remote (port 5174)
- **Federation Runtime** (`@module-federation/runtime`): `init()`, `registerRemotes()`, `loadRemote()`
- **Carregamento dinâmico** via `fetch('/api/mfes')` → `registerRemotes({ type: 'module' })` → `loadRemote()`
- **`@-label-/mfe-loader`**: abstração sobre o runtime com `initFederation`, `registerMfeRemotes`, `lazyRemoteComponent` (com cache)
- **`@-label-/vite-plugin-mfe-config-api`**: Vite plugin que serve `mfe.config.json` como `/api/mfes` (dev + preview)
- **`@-label-/federation-config`**: `generateShared()` com traversal depth-first de node_modules (maxDepth=3), symlink-aware, singleton prefixes
- **Fleet expõe `./FleetMfe`** — componente simples com `data-testid="fleet-mfe"`
- **E2E Playwright** (5 testes): host loads, fleet MFE renders, no console errors, /api/mfes endpoint, React singleton validation
- **Shared deps**: react + react-dom como singletons, `@-label-/ui-*` prefix singleton, `@module-federation/runtime` + `@-label-/mfe-loader` no ignore
- **ADR-001**: escolha de `@module-federation/vite` sobre `@originjs`
- **ADR-002**: Federation Runtime para carregamento dinâmico
- **ADR-003**: endpoint `/api/mfes` como single source of truth

## TODO-03: Shell UI — Sidebar, Header, Layout + Routing

- **Layout completo**: SidebarProvider + AppSidebar + SidebarInset + Header + main content area
- **Sidebar dinâmica** gerada a partir de `mfe.config.json` — links, submenus colapsáveis, links externos, ícones lucide-react
- **Breadcrumbs** automáticos gerados a partir do URL path
- **React Router 7** com rotas dinâmicas criadas a partir do config de MFEs
- **`<RemoteSlot>`**: wrapper com `Suspense` + `MfeErrorBoundary` + `lazyRemoteComponent`
- **`MfeErrorBoundary`**: class component isolando falhas de remotes com fallback Alert UI
- **404 page**: rota catch-all com link para home
- **Rentals stub** (`apps/rentals/`) — remote com `./RentalsMfe` exposto (port 4175)
- **Maintenance stub** (`apps/maintenance/`) — remote com `./MaintenanceMfe` exposto (port 4176)
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
