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
- **Ignore:** `@module-federation/runtime`, `@module-federation/vite`, `@-label-/mfe-loader`, `@-label-/contracts`, `@-label-/shell-core`, `@-label-/shell-hooks`, `@types/*`
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

## Shell (Host Layout)

### Layout Structure

```text
SidebarProvider
├── AppSidebar (collapsible, icon-only when collapsed)
│   ├── SidebarBrand — logo + app title
│   └── SidebarNavigation — dynamic menu from mfe.config.json
│       ├── RegularLinkItem (React Router NavLink)
│       ├── SubmenuItem (Collapsible group with children)
│       └── ExternalLinkItem (target="_blank")
└── SidebarInset (<div>, patched from shadcn <main>)
    ├── Header — SidebarTrigger + Separator + PageBreadcrumb
    └── <main> — React Router <Outlet />
```

### Sidebar

Gerada dinamicamente a partir de `mfe.config.json`. Cada `MfeConfigEntry` pode ser:

- **Link directo** — navega via React Router (`path` presente, sem `submenu`)
- **Submenu** — grupo colapsável com `submenu: MfeConfigEntry[]`
- **Link externo** — `external: true`, abre em nova janela

Ícones mapeados de `lucide-react` via string name no config (ex: `"icon": "car"` → `<Car />`).

### Breadcrumbs

Gerados automaticamente a partir de `useLocation().pathname`. Cada segmento do URL é capitalizado e linkável. A home page mostra apenas "Home".

### Error Handling

- **`MfeErrorBoundary`** — class component React que envolve cada `<RemoteSlot>`. Captura erros de carregamento/rendering de remotes e mostra fallback com `Alert` UI.
- **404 page** — rota catch-all (`*`) renderiza `NotFound` com link para home.
- **Console error fixture** — `e2e/fixtures.ts` com auto-use fixture que valida ausência de erros críticos na consola do browser em cada teste.

### CSS Architecture

- **Host:** importa `@-label-/ui-internal-core/globals.css` (tokens + reset) + `@source` para scan de componentes partilhados
- **Remotes:** importam `tailwindcss` — herdam globals do host quando carregados via MF
- **Zero CSS-in-JS** — tudo resolvido em build time via Tailwind v4 utility classes
- Detalhes em [ADR-004](adr/ADR-004-css-architecture-module-federation.md)

### File Organization

Convenção **folder + explicit name** sem barrel exports:

```text
src/
  Layout/Layout.tsx
  pages/Home/Home.tsx
  pages/NotFound/NotFound.tsx
  MfeErrorBoundary/MfeErrorBoundary.tsx
```

Detalhes em [ADR-005](adr/ADR-005-file-organization-convention.md)

## State Management

### Package Architecture

A store está dividida em 3 packages:

- **`@-label-/shell-core`** (`zustand/vanilla`) — store factory, dynamic slice registry, host slice factories, createShellApi. Zero React.
- **`@-label-/shell-hooks`** (React) — `useShellStore`, `ShellApiProvider`, `useShellApi`, `useSlice`. React bindings sobre o vanilla store.
- **`@-label-/contracts`** — tipos puros (`ShellApi`, `SliceDescriptor`) + domain contracts por MFE (`FleetSlice`, `FLEET_SLICE`, etc.)

### Zustand Shell Store

O host cria a store via `createShellStore()` com slices pluggáveis:

```typescript
const shellStore = createShellStore({
  slices: { rightBar: rightBarSlice, selections: selectionsSlice, navigation: navigationSlice },
  devtools: { enabled: config.ENABLE_STORE_DEVTOOLS === 'true', name: 'shell-store' },
});
```

**Host slices** (criados no boot):
- **rightBarSlice** — stack LIFO de panels (`openPanel` push, `closePanel` pop, `updatePanelPayload`)
- **selectionsSlice** — mailbox pattern para comunicação cross-MFE (`vehicleSelection`)
- **navigationSlice** — callback para `react-router` `navigate()`

**Dynamic slice registry** (runtime):
- MFEs registam slices via `shellApi.registerSlice(descriptor)` ao montar
- Reference counting para slices partilhados
- `shellApi.unregisterSlice(name)` no cleanup (unmount)
- `shellApi.onSliceChange(name, listener)` para subscrição cross-MFE (mailbox pattern)

Middleware: `devtools` (toggle via `VITE_ENABLE_STORE_DEVTOOLS`) + `subscribeWithSelector`.

### ShellApi

Interface estável passada como prop `shellApi?: ShellApi` a cada remote:

```typescript
interface ShellApi {
  // Right-bar
  openPanel(request: RightBarRequest): void;
  closePanel(): void;
  updatePanelPayload(payload: Record<string, unknown>): void;
  // Selections
  completeVehicleSelection(vehicle: VehicleRef): void;
  clearVehicleSelection(): void;
  getVehicleSelection(): VehicleRef | null;
  onVehicleSelectionChange(listener: (vehicle: VehicleRef | null) => void): () => void;
  // Navigation
  navigate(path: string): void;
  // Dynamic slice registry
  registerSlice<T>(descriptor: SliceDescriptor<T>): void;
  unregisterSlice(name: string): void;
  getSliceState<T>(name: string): T | undefined;
  setSliceState<T>(name: string, partial: Partial<T>): void;
  onSliceChange<T>(name: string, listener: (state: T) => void): () => void;
}
```

Criada via `createShellApi(store)` factory sobre o vanilla store.

Detalhes em [ADR-007](adr/ADR-007-zustand-shell-api.md) e [ADR-010](adr/ADR-010-dynamic-slice-registry-mfe-contracts.md).

## Right-Bar Panel System

### Panel Registry

O `buildPanelRegistry()` recursivamente constrói um `Map<panelId, PanelRegistryEntry>` a partir das `panels` definidas em `mfe.config.json`. Cada panel é carregado via `lazyRemoteComponent` com cache.

### URL Sync

Zustand é master, URL é espelho. No mount: one-shot read de `panel.id` e `panel.entityId` da URL. Em runtime: Zustand → URL mirror via `setSearchParams(prev => ...)`.

Namespace `panel.*` para evitar colisão com params de negócio dos MFEs.

Detalhes em [ADR-008](adr/ADR-008-right-bar-panel-url-sync.md).

### Cross-MFE Communication

Mailbox pattern para selecções (ex: veículo). Producer escreve, consumer lê e limpa. `onVehicleSelectionChange` para reactividade via `zustand.subscribe()`.

Detalhes em [ADR-009](adr/ADR-009-cross-mfe-selections-mailbox.md).

## Apps

### Port Convention

- **`4xxx`** — dev mode (`vite dev`)
- **`5xxx`** — preview/prod mode (`vite preview` após build)

O primeiro dígito distingue o ambiente. O offset identifica a app (173 = host, 174 = fleet, etc.). Esta convenção é obrigatória para todas as apps — incluindo futuras.

| App | Role | Dev Port | Preview Port | Status |
|-----|------|----------|-------------|--------|
| host | Shell/consumer | 4173 | 5173 | TODO-03 |
| fleet | Remote | 4174 | 5174 | TODO-03 (stub) |
| rentals | Remote | 4175 | 5175 | TODO-03 (stub) |
| maintenance | Remote | 4176 | 5176 | TODO-03 (stub) |
| reports | Remote | 4177 | 5177 | Planned (TODO-12) |
| inventory | Remote | 4178 | 5178 | Planned (TODO-13) |

## Internal Packages

| Package | Purpose | Status |
|---------|---------|--------|
| @-label-/contracts | Tipos partilhados (ShellApi, SliceDescriptor, domain contracts) | TODO-02 + ADR-010 |
| @-label-/federation-config | generateShared helper | TODO-02 |
| @-label-/mfe-loader | initFederation, registerMfeRemotes, lazyRemoteComponent | TODO-02 |
| @-label-/shell-core | Shell store factory (zustand/vanilla), dynamic slice registry, slice factories | ADR-010 |
| @-label-/shell-hooks | React bindings — useShellStore, ShellApiProvider, useShellApi, useSlice | ADR-010 |
| @-label-/vite-plugin-mfe-config-api | Serve mfe.config.json como /api/mfes | TODO-02 |
| @-label-/utils | Utilitários partilhados | TODO-01 |

## Testing

- **Framework:** Playwright (headless Chromium)
- **Fixture partilhado:** `e2e/fixtures.ts` — auto-use `consoleErrors` fixture que valida ausência de erros críticos na consola do browser
- **E2E specs:**
  - `federation.spec.ts` — 3 testes (host load, /api/mfes, React singleton)
  - `shell-navigation.spec.ts` — 6 testes (sidebar items, SPA nav fleet/rentals/maintenance, breadcrumbs)
  - `error-handling.spec.ts` — 3 testes (404 page, 404→home, broken remote error boundary)
  - `a11y.spec.ts` — 2 testes (home + fleet axe a11y check)
  - `shell-api.spec.ts` — 3 testes (store init, shellApi prop, cross-remote)
  - `right-bar.spec.ts` — 6 testes (deep-link, entityId, close, URL sync, SPA nav)
- **Script:** `pnpm test:e2e`

## ADRs

| # | Título | Resumo |
|---|--------|--------|
| [001](adr/ADR-001-module-federation-vite-plugin.md) | Plugin choice | @module-federation/vite over @originjs |
| [002](adr/ADR-002-federation-runtime.md) | Federation Runtime | init + registerRemotes + loadRemote |
| [003](adr/ADR-003-endpoint-api-mfes.md) | /api/mfes endpoint | Single source of truth para remotes |
| [004](adr/ADR-004-css-architecture-module-federation.md) | CSS Architecture | Tailwind v4 globals + @source por MFE |
| [005](adr/ADR-005-file-organization-convention.md) | File Organization | Folder + explicit name, sem barrel exports |
| [006](adr/ADR-006-disable-dts-plugin.md) | Disable DTS Plugin | dts: false — tipos via @-label-/contracts |
| [007](adr/ADR-007-zustand-shell-api.md) | Zustand Shell API | Props over Context em federation |
| [008](adr/ADR-008-right-bar-panel-url-sync.md) | Right-Bar URL Sync | Zustand master, URL espelho, namespace panel.* |
| [009](adr/ADR-009-cross-mfe-selections-mailbox.md) | Cross-MFE Selections | Mailbox pattern para comunicação cross-MFE |
| [010](adr/ADR-010-dynamic-slice-registry-mfe-contracts.md) | Dynamic Slice Registry | Registry dinâmico de slices + contracts por domínio MFE |
| [011](adr/ADR-011-smoke-tests-route-interception.md) | Smoke Tests Route Interception | Playwright intercepta /api/mfes via env vars — monorepo, multi-repo e CI |
