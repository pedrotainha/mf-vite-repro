# Features de Tooling — POC MFE CSR (@module-federation/vite)

Stack de tooling, configurações e boas práticas adoptadas neste POC.

## Dev Patterns (TODO-01)

- ESLint + oxlint + Prettier + lint-staged + simple-git-hooks + commit-lint
- Changesets para versionamento

## Changesets — Versionamento em Monorepo

O projecto usa [Changesets](https://github.com/changesets/changesets) para gerir versões e changelogs dos packages publicáveis.

### Workflow

1. **Criar changeset** — `pnpm changeset` (interactivo) ou criar ficheiro `.changeset/<nome>.md` manualmente
2. **Versionar** — `pnpm version:packages` (aplica bumps e gera changelogs)
3. **Publicar** — `pnpm publish:packages` (publica para o registry privado)

### Quando usar `changeset add --empty`

Usar empty changeset quando há alterações no repo que **não afectam packages publicáveis**:

- Alterações de config (`.gitignore`, `.prettierignore`, `eslint.config.js`)
- Alterações de CI/CD, docs, ADRs
- Alterações apenas no root `package.json` (scripts, devDependencies da root)
- Bump de devDependencies que não afecta o output dos packages

**Não usar empty** quando há alterações em `packages/*/src/` ou `apps/*/src/` — nesse caso, criar changeset com bump explícito.

### Config (`.changeset/config.json`)

| Opção | Valor | Impacto |
|-------|-------|---------|
| `baseBranch` | `"dev"` | Branch de referência para detectar packages alterados. O `changeset status` compara contra `dev`. |
| `commit` | `true` | O `changeset version` faz commit automático com as alterações de versão e changelogs. |
| `access` | `"restricted"` | Packages publicados como privados no registry. Necessário para registry privado — impede publish acidental para npm público. |
| `updateInternalDependencies` | `"patch"` | Quando um package interno sofre bump, todos os packages que dependem dele recebem bump de patch automático. Garante que o lockfile reflecte a versão correcta. |
| `bumpVersionsWithWorkspaceProtocolOnly` | `true` | Só faz bump de packages que usam `workspace:*` protocol no `package.json`. Packages com versões fixas não são afectados — evita bumps desnecessários em packages que não participam no workspace linking. |
| `changelog` | `"@changesets/cli/changelog"` | Formato de changelog built-in. Gera entradas com tipo de bump e descrição do changeset. |

### Boas Práticas Monorepo

- **Um changeset por feature/fix** — não por package. O changeset lista os packages afectados e o tipo de bump para cada um.
- **Granularidade do bump**: `patch` para fixes e refactoring, `minor` para features, `major` para breaking changes.
- **Não misturar changeset com versões manuais** — nunca editar `version` nos `package.json` directamente. Deixar o `changeset version` tratar disso.
- **Pre-release**: não está configurado neste POC. Se necessário, usar `changeset pre enter <tag>` (e.g., `beta`).
- **`.changeset/*.md` no `.gitignore`**: neste projecto, os ficheiros de changeset `.md` estão ignorados (apenas `config.json` é tracked). Isto é intencional — o workflow de publish é local, não via CI.

## Lint & Formatting

- **ESLint 9** (flat config) + **oxlint** (fast native linter) — correm em paralelo via `pnpm run '/^(eslint|oxlint)$/'`
- **Prettier 3.8** com `.prettierignore` por app (dist, .__mf__temp, coverage)
- **lint-staged** + **simple-git-hooks**: pre-commit valida apenas ficheiros staged
- **commit-lint**: valida conventional commits no commit-msg hook

## Package Majors Pinadas

| Package | Major Pinada | Razão |
|---------|-------------|-------|
| `@types/node` | 24 | Usamos Node 24 — v25 é para Node 25 |
| `eslint` | 9 | Flat config estável; v10 é breaking |

Ao correr `pnpm outdated`, ignorar sugestões para a próxima major destes packages.

## Vite Plugins Internos

### vite-plugin-config-chunk

Isola `import { config } from "./config"` num chunk separado durante o build. O Vite inline as `VITE_*` vars em múltiplos chunks — este plugin converte o import estático em dynamic import para que o Rollup gere um `config-XXXX.js` isolado. Em CI/CD, basta fazer find-and-replace nesse chunk por ambiente (staging, prod) sem rebuildar. Inactivo em dev mode (`apply: 'build'`).

### vite-plugin-env-fail

Fail-fast se `.env` não existe ao arrancar o Vite. Corre no hook `configResolved` (antes do server start) e mostra uma mensagem clara com o comando `cp .env.example .env`. Evita que um dev perca tempo a debugar `VITE_*` vars `undefined` em runtime.

Integrado em todas as apps (host, fleet, rentals, maintenance) como primeiro plugin no array.

### runtime-scripts + React Scan

Package `@-label-/runtime-scripts` com duas funções:

1. **`loadScript(source)`** — utility genérica que injecta um `<script>` no `<head>` e retorna uma Promise
2. **React Scan IIFE** — entry point que bundla `react-scan/dist/auto.global.js` via Vite lib mode (IIFE, 330KB). Servido em `localhost:5179` via `vite preview`

Integrado no host bootstrap (`main.tsx`): se `VITE_REACT_SCAN=true`, carrega o script via `loadScript(VITE_REACT_SCAN_URL)` **antes** do React mount — necessário porque o React Scan faz monkey-patch ao React internals.

## PR Guardian

Configuração em `.pr-guardian.config.mjs` com custom rules:

- **`css-source-directive-for-ui-packages`** — valida que apps com deps `@-label-/ui-internal-*` têm os `@source` correspondentes no CSS
- **`federation-singleton-prefixes`** — detecta remoção de `@-label-/ui-` dos singletonPrefixes (previne duplicação de UI packages em federation)
- **`browserslistrc-required-for-apps`** — valida que apps têm `.browserslistrc` para browser targets do CSS
