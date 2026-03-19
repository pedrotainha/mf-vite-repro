# Features — POC MFE CSR (@module-federation/vite)

Registo de features implementadas neste POC, por TODO do plano de migração.

## TODO-01: Scaffolding

- Monorepo pnpm workspaces (apps/ + packages/ + clients/ + openapi/)
- Dev patterns: ESLint + oxlint + Prettier + lint-staged + simple-git-hooks + commit-lint
- Changesets para versionamento
- tsconfig.base.json com strict mode + path aliases
- Node 24, pnpm 10, TypeScript 5.9

## TODO-02: Federation Host + Fleet Remote

- **@module-federation/vite** configurado no host (port 5173) e fleet remote (port 5174)
- **Federation Runtime** (`@module-federation/runtime`): `init()`, `registerRemotes()`, `loadRemote()`
- **Carregamento dinâmico** via `fetch('/api/mfes')` → `registerRemotes({ type: 'module' })` → `loadRemote()`
- **`@-label-/mfe-loader`**: abstração sobre o runtime com `initFederation`, `registerMfeRemotes`, `lazyRemoteComponent` (com cache)
- **`@-label-/vite-plugin-mfe-config-api`**: Vite plugin que serve `mfe.config.json` como `/api/mfes` (dev + preview)
- **`@-label-/federation-config`**: `generateShared()` com traversal depth-first de node_modules (maxDepth=3), symlink-aware, singleton prefixes
- **Fleet expõe `./FleetMfe`** — componente simples com `data-testid="fleet-mfe"`
- **E2E Playwright** (5 testes): host loads, fleet MFE renders, no console errors, /api/mfes endpoint, React singleton validation
- **Shared deps**: react + react-dom como singletons, `@-label-/ui-*` prefix singleton, `@module-federation/runtime` + `@-label-/mfe-loader` no ignore
- **ADR-001**: escolha de `@module-federation/vite` sobre `@originjs`
- **ADR-002**: Federation Runtime para carregamento dinâmico
- **ADR-003**: endpoint `/api/mfes` como single source of truth

## TODO-03: Shell UI — Sidebar, Header, Layout + Routing

- **Layout completo**: SidebarProvider + AppSidebar + SidebarInset + Header + main content area
- **Sidebar dinâmica** gerada a partir de `mfe.config.json` — links, submenus colapsáveis, links externos, ícones lucide-react
- **Breadcrumbs** automáticos gerados a partir do URL path
- **React Router 7** com rotas dinâmicas criadas a partir do config de MFEs
- **`<RemoteSlot>`**: wrapper com `Suspense` + `MfeErrorBoundary` + `lazyRemoteComponent`
- **`MfeErrorBoundary`**: class component isolando falhas de remotes com fallback Alert UI
- **404 page**: rota catch-all com link para home
- **Rentals stub** (`apps/rentals/`) — remote com `./RentalsMfe` exposto (port 4175)
- **Maintenance stub** (`apps/maintenance/`) — remote com `./MaintenanceMfe` exposto (port 4176)
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

---

## Tooling

### Changesets — Versionamento em Monorepo

O projecto usa [Changesets](https://github.com/changesets/changesets) para gerir versões e changelogs dos packages publicáveis.

#### Workflow

1. **Criar changeset** — `pnpm changeset` (interactivo) ou criar ficheiro `.changeset/<nome>.md` manualmente
2. **Versionar** — `pnpm version:packages` (aplica bumps e gera changelogs)
3. **Publicar** — `pnpm publish:packages` (publica para o registry privado)

#### Quando usar `changeset add --empty`

Usar empty changeset quando há alterações no repo que **não afectam packages publicáveis**:

- Alterações de config (`.gitignore`, `.prettierignore`, `eslint.config.js`)
- Alterações de CI/CD, docs, ADRs
- Alterações apenas no root `package.json` (scripts, devDependencies da root)
- Bump de devDependencies que não afecta o output dos packages

**Não usar empty** quando há alterações em `packages/*/src/` ou `apps/*/src/` — nesse caso, criar changeset com bump explícito.

#### Config (`.changeset/config.json`)

| Opção | Valor | Impacto |
|-------|-------|---------|
| `baseBranch` | `"dev"` | Branch de referência para detectar packages alterados. O `changeset status` compara contra `dev`. |
| `commit` | `true` | O `changeset version` faz commit automático com as alterações de versão e changelogs. |
| `access` | `"restricted"` | Packages publicados como privados no registry. Necessário para registry privado — impede publish acidental para npm público. |
| `updateInternalDependencies` | `"patch"` | Quando um package interno sofre bump, todos os packages que dependem dele recebem bump de patch automático. Garante que o lockfile reflecte a versão correcta. |
| `bumpVersionsWithWorkspaceProtocolOnly` | `true` | Só faz bump de packages que usam `workspace:*` protocol no `package.json`. Packages com versões fixas não são afectados — evita bumps desnecessários em packages que não participam no workspace linking. |
| `changelog` | `"@changesets/cli/changelog"` | Formato de changelog built-in. Gera entradas com tipo de bump e descrição do changeset. |

#### Boas Práticas Monorepo

- **Um changeset por feature/fix** — não por package. O changeset lista os packages afectados e o tipo de bump para cada um.
- **Granularidade do bump**: `patch` para fixes e refactoring, `minor` para features, `major` para breaking changes.
- **Não misturar changeset com versões manuais** — nunca editar `version` nos `package.json` directamente. Deixar o `changeset version` tratar disso.
- **Pre-release**: não está configurado neste POC. Se necessário, usar `changeset pre enter <tag>` (e.g., `beta`).
- **`.changeset/*.md` no `.gitignore`**: neste projecto, os ficheiros de changeset `.md` estão ignorados (apenas `config.json` é tracked). Isto é intencional — o workflow de publish é local, não via CI.

### Lint & Formatting

- **ESLint 9** (flat config) + **oxlint** (fast native linter) — correm em paralelo via `pnpm run '/^(eslint|oxlint)$/'`
- **Prettier 3.8** com `.prettierignore` por app (dist, .__mf__temp, coverage)
- **lint-staged** + **simple-git-hooks**: pre-commit valida apenas ficheiros staged
- **commit-lint**: valida conventional commits no commit-msg hook

### Package Majors Pinadas

| Package | Major Pinada | Razão |
|---------|-------------|-------|
| `@types/node` | 24 | Usamos Node 24 — v25 é para Node 25 |
| `eslint` | 9 | Flat config estável; v10 é breaking |

Ao correr `pnpm outdated`, ignorar sugestões para a próxima major destes packages.
