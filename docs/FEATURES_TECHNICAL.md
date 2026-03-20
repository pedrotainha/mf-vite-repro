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

## TODO-04: Zustand Shell API + Right-Bar Panel System

- **Zustand shell store** — 2 slices (RightBar LIFO stack + Selections mailbox) com `devtools` + `subscribeWithSelector` middleware
- **ShellApiProvider** — React 19 `use()` + `createShellApi()` factory com referência estável via `useMemo`
- **shellApi como prop** — `shellApi?: ShellApi` passada a todos os remotes (props over Context em federation)
- **RightBar** — Sheet UI (shadcn) com panel registry recursivo, lazy loading via `lazyRemoteComponent`, tamanhos sm/md/lg
- **Panel URL sync** — Zustand master, URL espelho. One-shot read no mount, mirror contínuo em runtime. Namespace `panel.*`
- **`lazyRemoteComponent<P>` genérico** — suporte a typed props no mfe-loader para componentes lazy de federation
- **DevTools toggle** — `VITE_ENABLE_STORE_DEVTOOLS` env var para Zustand DevTools
- **Domain types** — `VehicleRef`, `VehicleStatus`, `VehicleType`, `RentalStatus`, `WorkOrderStatus`, `WorkOrderType` em `@-label-/contracts`
- **E2E tests** (9 novos, 25 total):
  - Shell API: store init, shellApi prop, cross-remote validation (3)
  - Right-Bar: deep-link, entityId, close via Escape, URL sync, SPA nav (6)
- **ADR-007**: Zustand Shell API — props over Context em federation
- **ADR-008**: Right-bar panel URL sync — Zustand master, URL espelho, namespace `panel.*`
- **ADR-009**: Cross-MFE selections — mailbox pattern para comunicação entre remotes

## ADR-010: Dynamic Slice Registry + MFE Contracts

- **`@-label-/shell-core`** — package `zustand/vanilla` (zero React) com store factory, dynamic slice registry (ref-counting), pluggable host slice factories (rightBar, selections, navigation), `createShellApi()` factory, `onSliceChange()` subscription
- **`@-label-/shell-hooks`** — React bindings: `useShellStore`, `ShellApiProvider` (aceita store como prop), `useShellApi`, `useSlice`
- **Domain contracts** — `FleetSlice`/`FLEET_SLICE`, `RentalsSlice`/`RENTALS_SLICE`, `MaintenanceSlice`/`MAINTENANCE_SLICE` em `@-label-/contracts/domains`
- **`SliceDescriptor<T>`** — constantes tipadas (`as const satisfies`) para type-safety nos nomes de slices
- **Dynamic ShellApi** — `registerSlice`, `unregisterSlice`, `getSliceState`, `setSliceState`, `onSliceChange` adicionados ao `ShellApi`
- **MFE lifecycle** — Fleet, Rentals e Maintenance registam slices no mount e limpam no unmount
- **Cross-MFE subscription** — Rentals subscreve mudanças no slice do Fleet (demonstração do mailbox pattern com dynamic slices)
- **`@-label-/contracts` no federation ignore** — contracts agora tem runtime exports (slice descriptors), deve ser bundled por app e não partilhado via federation
- **`window.__shellStore__`** — exposto em dev mode apenas para E2E testing seam (tree-shaken em prod)
- **E2E tests** (6 novos, 34 total):
  - Slice registration: Fleet, Rentals, Maintenance registam slices ao montar (3)
  - Slice cleanup: Fleet slice removido ao navegar para outro MFE (1)
  - Cross-MFE: Rentals subscreve slice do Fleet antes do Fleet montar (1)
  - Host slices: rightBar, selections, navigation mantêm-se funcionais (1)
- **ADR-010**: Dynamic Slice Registry + MFE Contracts por Domínio
