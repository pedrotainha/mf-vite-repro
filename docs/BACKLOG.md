# Backlog

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
- [ ] **MSW passthrough selectivo** — investigar como usar MSW com vários endpoints mockados mas permitir que endpoints específicos mantenham a lógica real (passthrough). Útil para cenários onde se quer mockar a maioria dos endpoints mas manter um ou dois com chamadas reais (ex: `passthrough()` handler ou ordem de handlers)

## Documentação

- [ ] Rever ADRs — remover referências a TODOs de implementação e focar no racional da decisão. Quem lê os ADRs precisa de perceber as questões que se colocaram e porquê se tomou determinada decisão, não os detalhes de implementação por iteração. As secções de contexto, questões e alternativas consideradas são o valor — manter e reforçar.

## Preview Mode

- [ ] **Preview mode não renderiza o app** — `vite preview` serve o HTML mas o React não monta. Provável causa: `/api/mfes` devolve index.html (SPA fallback) em vez de JSON, e o `hostInit` script do MF ou o federation runtime falha silenciosamente. Bloqueia os smoke tests das combinações 2, 3 e 4. Investigar root cause.

## Console Errors (E2E Fixture Filters)

Filtros temporários adicionados ao `e2e/fixtures.ts` que devem ser resolvidos:

- [ ] `does not exist in container` + `failed to load:` + `recreate this component tree` — VehicleQuickView module não existe no fleet. Resolver quando fleet expuser o módulo.
