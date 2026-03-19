# TODO Backlog

Items descobertos durante implementação que ficam para futuros TODOs.

## Tooling

- [ ] Regra ESLint para detectar `setSearchParams()` destrutivo (sem callback/prev) — ver ADR-008
- [ ] `VITE_ENABLE_STORE_DEVTOOLS` — no futuro poderia controlar também React Query DevTools

## Packages

- [ ] Package `packages/shell-hooks` com hooks partilhados para cross-MFE (ex: `useVehicleSelection()`) — TODO-05
- [ ] Extrair `@-label-/shell-core` — shell store com dynamic slice registry (vanilla JS, framework-agnostic) — ver ADR-010
- [ ] Contracts por MFE (`@-label-/fleet-contracts`, `@-label-/rentals-contracts`, etc.) em repos separados — ver ADR-010. Para já, tipos de domínio vivem em `@-label-/contracts/domains/`

## Features

- [ ] Auth/RBAC/RoleSwitcher — quando houver requisitos detalhados
- [ ] Telemetry/trackEvent — quando decidir APM RUM

## Console Errors (E2E Fixture Filters)

Filtros temporários adicionados ao `e2e/fixtures.ts` que devem ser resolvidos:

- [ ] `does not exist in container` + `failed to load:` + `recreate this component tree` — VehicleQuickView module não existe no fleet. Resolver quando fleet expuser o módulo.
