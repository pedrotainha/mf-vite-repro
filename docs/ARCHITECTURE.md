# Architecture — POC MFE CSR (@module-federation/vite)

## Overview

Monorepo de micro-frontends CSR com Vite 8 + `@module-federation/vite` + Federation Runtime. O host carrega remotes dinamicamente via endpoint `/api/mfes`.

## Module Federation

### Plugin & Runtime

- **Build:** `@module-federation/vite` — configura shared deps e exposes em cada app
- **Runtime:** `@module-federation/runtime` — `init()`, `registerRemotes()`, `loadRemote()`
- **Loader:** `@-label-/mfe-loader` — abstração que encapsula o runtime com cache de componentes

### Dynamic Loading Flow

```text
Host bootstrap
  → fetch('/api/mfes')
  → MfeConfigEntry[]
  → registerRemotes({ name, entry, type: 'module' })
  → React.lazy(() => loadRemote('remoteName/Module'))
  → Render via <Suspense>
```

### Shared Dependencies

Geridas por `@-label-/federation-config` (`generateShared`):

- **Singletons:** react, react-dom, zustand (sempre partilhados, uma instância)
- **Singleton prefixes:** `@-label-/ui-*` (requiredVersion: "*" — remote aceita sempre a versão do host)
- **Ignore:** `@module-federation/runtime`, `@module-federation/vite`, `@-label-/mfe-loader`, `@types/*`
- **Traversal:** depth-first em node_modules (maxDepth configurable), symlink-aware para pnpm

### MFE Config

Servido via `@-label-/vite-plugin-mfe-config-api` como `GET /api/mfes`.
Ficheiro fonte: `apps/host/mfe.config.json` (schema: `MfeConfigEntry[]` de `@-label-/contracts`).

```typescript
interface MfeConfigEntry {
  name: string;      // federation remote name
  path: string;      // router path ("/fleet")
  entry: string;     // URL to remoteEntry.js
  module: string;    // exposed module ("./FleetMfe")
  label?: string;    // sidebar label
  icon?: string;     // lucide icon name
  children?: MfeChildRoute[];
  panels?: MfePanelConfig[];
  submenu?: MfeConfigEntry[];
}
```

## Apps

| App | Role | Dev Port | Preview Port | Status |
|-----|------|----------|-------------|--------|
| host | Shell/consumer | 4173 | 5173 | TODO-02 |
| fleet | Remote | 4174 | 5174 | TODO-02 (stub) |
| rentals | Remote | 4175 | 5175 | Planned (TODO-06) |
| maintenance | Remote | 4176 | 5176 | Planned (TODO-07) |
| reports | Remote | 4177 | 5177 | Planned (TODO-12) |
| inventory | Remote | 4178 | 5178 | Planned (TODO-13) |

## Internal Packages

| Package | Purpose | Status |
|---------|---------|--------|
| @-label-/contracts | Tipos partilhados (MfeConfigEntry, ShellApi) | TODO-02 |
| @-label-/federation-config | generateShared helper | TODO-02 |
| @-label-/mfe-loader | initFederation, registerMfeRemotes, lazyRemoteComponent | TODO-02 |
| @-label-/vite-plugin-mfe-config-api | Serve mfe.config.json como /api/mfes | TODO-02 |
| @-label-/utils | Utilitários partilhados | TODO-01 |

## Testing

- **Framework:** Playwright (headless Chromium)
- **E2E:** `e2e/federation.spec.ts` — 5 testes (host load, MFE load, console errors, /api/mfes, React singleton)
- **Script:** `pnpm test:e2e`

## ADRs

| # | Título | Resumo |
|---|--------|--------|
| [001](adr/ADR-001-module-federation-vite-plugin.md) | Plugin choice | @module-federation/vite over @originjs |
| [002](adr/ADR-002-federation-runtime.md) | Federation Runtime | init + registerRemotes + loadRemote |
| [003](adr/ADR-003-endpoint-api-mfes.md) | /api/mfes endpoint | Single source of truth para remotes |
