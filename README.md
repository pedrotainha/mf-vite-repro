# POC MFE CSR — @module-federation/vite

POC de Micro-Frontends CSR usando `@module-federation/vite` + Federation Runtime para carregamento dinâmico de MFEs via endpoint.

## Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 8 + @module-federation/vite |
| Framework | React 19 + TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn v3 |
| State | Zustand (shell) + TanStack React Query (server) |
| Forms | React Hook Form + Zod |
| Routing | React Router 7 |
| Testing | Playwright + axe-core |
| Mocks | MSW 2 |

## Quick Start

```bash
# Instalar dependências
pnpm install

# Dev mode (standalone)
pnpm dev

# Build + preview (federation active)
pnpm serve

# Testes E2E
pnpm test:e2e

# Lint + format
pnpm lint
pnpm prettier:check
```

## Estrutura

```text
├── apps/           MFE applications (host + remotes)
├── packages/       Internal shared packages
├── clients/        Orval-generated API clients
├── openapi/        OpenAPI specs
├── e2e/            Playwright E2E tests
└── docs/           Architecture docs + ADRs
```

## Plano

Este repositório segue o plano de migração documentado em `../POC_MFE_csr/docs/MIGRATION_PLAN_MF_VITE.md`.

## Documentação

- [Architecture](docs/ARCHITECTURE.md)
- [Features](docs/FEATURES.md)
- [ADRs](docs/adr/)
