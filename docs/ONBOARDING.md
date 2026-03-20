# Onboarding

Guia para quem chega ao projecto pela primeira vez. O objectivo é conseguires arrancar, explorar e perceber a arquitectura antes de contribuir.

## Pre-requisitos

| Ferramenta | Versão mínima | Verificar |
|-----------|---------------|-----------|
| Node.js | 24 | `node -v` |
| pnpm | 10 | `pnpm -v` |
| Git | — | `git -v` |

> **Nota:** não usar Node 25 — o projecto está pinado ao 24.

## Arrancar o projecto

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Escolher o modo de arranque

Existem dois modos para correr o projecto completo:

| Modo | Comando | O que faz |
|------|---------|-----------|
| **Dev** | `pnpm dev` | Arranca todas as apps com Vite dev server (HMR, fast refresh). Federation activa entre apps. |
| **Build + Preview** | `pnpm serve` | Faz build de produção de todas as apps e serve-as em modo preview. Simula o ambiente mais próximo de produção. |

Depois de arrancar, abre o browser em:

| App | Dev | Preview |
|-----|-----|---------|
| **Host (shell)** | `http://localhost:4173` | `http://localhost:5173` |
| Fleet | `http://localhost:4174` | `http://localhost:5174` |
| Rentals | `http://localhost:4175` | `http://localhost:5175` |
| Maintenance | `http://localhost:4176` | `http://localhost:5176` |

> **Convenção de portas:** `4xxx` = dev, `5xxx` = preview. O offset identifica a app (173=host, 174=fleet, etc.).

## O que explorar no browser

### Host (shell completo)

Abre `http://localhost:4173` (ou 5173 em preview). Vais ver:

1. **Sidebar** — menu dinâmico gerado a partir do `mfe.config.json`. Cada entrada corresponde a um MFE registado. Experimenta navegar entre Fleet, Rentals e Maintenance.
2. **Breadcrumbs** — gerados automaticamente a partir do URL.
3. **MFE Fleet** — a única app com funcionalidade real neste momento. Tem listagem de veículos e painéis laterais (right-bar). Experimenta clicar num veículo para abrir o painel.
4. **Right-bar (painéis)** — ao abrir um painel, nota que o URL actualiza com `?panel.id=...&panel.entityId=...`. Isto permite partilhar links directos para um painel aberto.
5. **Error handling** — tenta navegar para uma rota que não existe (ex: `/nao-existe`) para ver a página 404.

### MFE standalone

Cada MFE pode correr sozinho, sem o host. Abre directamente o URL de um remote (ex: `http://localhost:4174` para fleet). Neste modo:

- O MFE carrega os seus próprios providers (React, router, etc.) — não depende do host.
- Não há sidebar nem shell — apenas o conteúdo do MFE.
- Útil para desenvolvimento focado num único MFE sem arrancar tudo.

Para arrancar apenas os remotes sem o host:

```bash
pnpm dev:remotes
```

## Estrutura do projecto

```text
├── apps/
│   ├── host/           Shell — carrega os remotes, sidebar, routing, estado global
│   ├── fleet/          MFE Fleet — gestão de frota (o mais completo)
│   ├── rentals/        MFE Rentals — stub
│   └── maintenance/    MFE Maintenance — stub
├── packages/
│   ├── contracts/      Tipos partilhados (TypeScript only, sem runtime)
│   ├── federation-config/  Helper para gerar shared deps do Module Federation
│   ├── mfe-loader/     Wrapper do @module-federation/runtime (init, register, lazy load)
│   ├── utils/          Utilitários gerais
│   └── vite-plugin-mfe-config-api/  Plugin Vite que serve GET /api/mfes
├── e2e/                Testes E2E com Playwright
└── docs/               Arquitectura, ADRs, features, backlog
```

## Conceitos-chave para perceber o projecto

### Module Federation

O host não conhece os remotes em build time. Em vez disso:

1. O host faz `fetch('/api/mfes')` ao arrancar — recebe a lista de MFEs e os URLs dos bundles.
2. Regista os remotes dinamicamente via `@module-federation/runtime`.
3. Carrega cada MFE com `React.lazy(loadRemote('fleet/FleetMfe'))`.

Isto significa que se pode adicionar um MFE novo sem recompilar o host — basta registá-lo no `mfe.config.json`.

### Shell API

O host passa uma `ShellApi` como prop a cada MFE. Esta API permite aos remotes:

- **`navigate(path)`** — navegar sem conhecer o router do host
- **`openPanel(config)`** — abrir painéis na right-bar
- **`closePanel()`** — fechar o painel activo

Os MFEs nunca acedem directamente ao estado do host — toda a comunicação passa pela ShellApi.

### Shared dependencies

React, react-dom e zustand são partilhados como singletons entre host e remotes. Isto garante que há uma única instância de React em toda a aplicação, evitando problemas de hooks e contextos duplicados.

## Comandos úteis do dia-a-dia

```bash
# Arrancar tudo em dev
pnpm dev

# Arrancar apenas host
pnpm dev:host

# Arrancar apenas remotes
pnpm dev:remotes

# Build completo + preview
pnpm serve

# Correr testes E2E
pnpm test:e2e

# Correr apenas smoke tests
pnpm test:e2e:smoke

# Lint
pnpm lint:all

# Type-check
pnpm typecheck

# Verificar formatação
pnpm prettier:check
```

## Documentação para aprofundar

| Documento | O que encontras |
|-----------|----------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Visão técnica completa — layout do shell, state management, federation, file organization |
| [FEATURES.md](FEATURES.md) | Index das features implementadas (funcional, técnico, tooling) |
| [ADRs](adr/) | Decisões arquitecturais com contexto e alternativas consideradas |
| [BACKLOG.md](BACKLOG.md) | Items pendentes para futuros TODOs |
