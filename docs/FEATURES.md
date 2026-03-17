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
