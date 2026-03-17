# ADR-003: Endpoint /api/mfes como Fonte de Verdade para Remotes

## Status

Accepted

## Context

Num sistema de micro-frontends, o host precisa de saber que remotes existem, onde estao, e que modulos expoem. Hardcoding esta informacao no vite.config.ts impede carregamento dinamico e obriga rebuild do host para adicionar/remover remotes.

## Decision

Servir a configuracao de remotes via endpoint HTTP `GET /api/mfes`, implementado como Vite plugin (`@-label-/vite-plugin-mfe-config-api`):

1. **Dev mode** — le `mfe.config.json` do filesystem a cada request (hot reload do config)
2. **Preview mode** — mesmo comportamento (le do filesystem)
3. **Producao** — em ambiente real, este endpoint seria servido por um API gateway ou config service

O ficheiro `mfe.config.json` fica na root do host app e segue o schema `MfeConfigEntry[]` definido em `@-label-/contracts`.

## Flow

```text
Host bootstrap → fetch('/api/mfes') → MfeConfigEntry[] → registerRemotes() → loadRemote()
```

## Consequences

- **Desacoplamento** — host nao precisa de rebuild para adicionar remotes (basta editar o JSON)
- **Centralizado** — unica fonte de verdade para routes, modules, panels, labels, icons
- **Extensivel** — o mesmo config alimenta sidebar, routing, panel registry (em TODOs futuros)
- **Testavel** — teste E2E valida o endpoint directamente (`GET /api/mfes` retorna config correcto)
- **Sem CORS issues** — servido como middleware do mesmo Vite server (same origin)
