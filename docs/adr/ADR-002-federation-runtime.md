# ADR-002: Federation Runtime para Carregamento Dinamico

## Status

Accepted

## Context

O POC anterior usava `@originjs/vite-plugin-federation` com a internal API `__federation_method_setRemote`/`__federation_method_getRemote` para carregamento dinamico de remotes. Esta API nao e documentada nem estavel.

O `@module-federation/vite` oferece um runtime oficial (`@module-federation/runtime`) com API publica: `init()`, `registerRemotes()`, `loadRemote()`.

## Decision

Usar `@module-federation/runtime` para todo o carregamento dinamico de remotes:

1. **`init()`** — inicializa o runtime com o nome do host, chamado uma vez no bootstrap
2. **`registerRemotes()`** — regista remotes dinamicamente a partir do config obtido via `/api/mfes`
3. **`loadRemote()`** — carrega um modulo exposto de um remote registado

Estes wrappers estao encapsulados em `@-label-/mfe-loader`:
- `initFederation()` — wrapper para `init()`
- `registerMfeRemotes()` — converte `MfeConfigEntry[]` para o formato do runtime, com `type: 'module'` (ESM)
- `lazyRemoteComponent()` — wrapper para `React.lazy()` + `loadRemote()` com cache por `remoteName::moduleName`

## Consequences

- **Sem dummy remote** — `@module-federation/vite` nao precisa do workaround de placeholder que o `@originjs` exigia
- **Type-safe** — API publica com tipos TS, ao contrario dos metodos internos `__federation_*`
- **ESM nativo** — `type: 'module'` obrigatorio no registo de remotes, alinhado com Vite 8 ESM-first
- **Cache de componentes** — `lazyRemoteComponent()` previne duplicate fetches via Map cache
- **Workspace packages partilhados** — packages `workspace:*` sao partilhados normalmente via federation. Apenas `@-label-/mfe-loader` (que wrappa `@module-federation/runtime`) e a propria infraestrutura de federation (`@module-federation/runtime`, `@module-federation/vite`) devem estar no `ignore` do `generateShared`
