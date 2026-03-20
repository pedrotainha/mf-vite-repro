# ADR-011: Smoke Tests com Playwright Route Interception

## Status

Accepted

## Context

Num projecto de micro-frontends, o host e os remotes podem correr em ambientes diferentes:

- **Monorepo local:** host e remotes na mesma máquina, ports `4xxx` (dev) ou `5xxx` (preview)
- **Multi-repo local:** host num repo, remotes noutros repos, cada um com ports diferentes
- **CI/CD integration:** host num pipeline, remotes deployed num staging environment com URLs reais
- **CDN-based:** remotes servidos por CDN com paths versionados

Para validar que a integração funciona ponta a ponta, precisamos de testes de smoke que naveguem o site todo — e que funcionem em **qualquer combinação** de host e remotes, sem depender de como ou onde estão deployed.

### Questões

1. Como é que o playwright sabe para onde apontar o host?
2. Como é que o playwright sabe onde estão os remotes, se as entry URLs são servidas por um endpoint (`/api/mfes`) que pode não existir em todos os ambientes?
3. Como é que o mesmo teste funciona em monorepo local, multi-repo, e CI sem alterações de código?

## Decision

**O Playwright intercepta o endpoint `/api/mfes` via `page.route()` e responde com o config correcto, construído a partir de env vars.**

### Como funciona

1. **`E2E_HOST_URL`** — URL completo do host (ex: `http://localhost:4173`, `https://host.staging.example.com`)
2. **`E2E_{REMOTE}_ENTRY`** — URL completo do `remoteEntry.js` de cada remote (ex: `http://localhost:5174/remoteEntry.js`, `https://cdn.example.com/fleet/v1.0.0/remoteEntry.js`)
3. O helper `e2e/helpers/mfe-config.ts` constrói o array `MfeConfigEntry[]` a partir dessas env vars
4. No `beforeEach`, o teste regista `page.route('**/api/mfes', ...)` que responde com esse config
5. O browser faz `fetch('/api/mfes')` — o Playwright intercepta e devolve o JSON com as URLs correctas
6. O host regista os remotes e carrega os `remoteEntry.js` dos URLs indicados

### As 4 combinações locais

| # | Host | Remotes | E2E_HOST_URL | E2E_*_ENTRY |
|---|------|---------|-------------|-------------|
| 1 | dev | dev | `http://localhost:4173` | `http://localhost:4174/remoteEntry.js` |
| 2 | dev | preview | `http://localhost:4173` | `http://localhost:5174/remoteEntry.js` |
| 3 | preview | dev | `http://localhost:5173` | `http://localhost:4174/remoteEntry.js` |
| 4 | preview | preview | `http://localhost:5173` | `http://localhost:5174/remoteEntry.js` |

### Cenário multi-repo / CI

```bash
E2E_HOST_URL=https://host.staging.example.com \
E2E_FLEET_ENTRY=https://fleet.staging.example.com/remoteEntry.js \
E2E_RENTALS_ENTRY=https://rentals.staging.example.com/remoteEntry.js \
E2E_MAINTENANCE_ENTRY=https://maintenance.staging.example.com/remoteEntry.js \
pnpm run test:e2e:smoke
```

Os testes não sabem nem precisam de saber se os remotes estão no mesmo monorepo, noutro repo, ou num CDN.

### Separação de responsabilidades

- **Scripts** são responsáveis por levantar os servidores na combinação certa (dev, preview, build)
- **Playwright** é responsável por interceptar o config e navegar — não gere webServers
- **Env vars** são a interface entre os dois

## Alternatives Considered

### A — Vite plugin reescreve ports via env var

O `vite-plugin-mfe-config-api` leria uma env var para trocar ports antes de servir o JSON.

**Rejeitado:** acopla lógica de testing ao código de produção. Em produção, o config vem de um endpoint externo — o plugin de dev não é envolvido.

### B — Dois ficheiros mfe.config.json (dev + preview)

Script copia o ficheiro certo antes de arrancar o servidor.

**Rejeitado:** frágil (ficheiro tem de ser reposto), não escala para multi-repo, e duplica dados.

### C — Playwright webServer para cada combinação

Cada config de playwright define webServers diferentes.

**Rejeitado:** 4 configs diferentes, complexo de manter, e impossível para cenários onde os servidores já estão de pé (CI, staging).

## Consequences

### Positivos

- Zero alterações ao código de produção
- Funciona em qualquer cenário (monorepo, multi-repo, CI, staging, CDN)
- Um único spec reutilizado pelas 4 combinações
- Env vars como interface — simples de configurar em qualquer CI

### Negativos

- O teste não valida o endpoint `/api/mfes` real — intercepta-o. Para validar o endpoint em si, usar os testes de federation existentes
- Se a estrutura do `MfeConfigEntry` mudar, o helper tem de ser actualizado manualmente

### Port Convention

- `4xxx` — dev mode (`vite dev`)
- `5xxx` — preview/prod mode (`vite preview` após build)
- O offset identifica a app: host=x173, fleet=x174, rentals=x175, maintenance=x176
