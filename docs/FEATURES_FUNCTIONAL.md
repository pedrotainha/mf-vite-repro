# Features Funcionais — POC MFE CSR (@module-federation/vite)

Features orientadas ao utilizador/produto implementadas neste POC.

## TODO-01: Scaffolding

- Monorepo pnpm workspaces (apps/ + packages/ + clients/ + openapi/)
- Node 24, pnpm 10, TypeScript 5.9

## TODO-02: Federation Host + Fleet Remote

- **Carregamento dinâmico** via `fetch('/api/mfes')` → `registerRemotes({ type: 'module' })` → `loadRemote()`
- **Fleet expõe `./FleetMfe`** — componente simples com `data-testid="fleet-mfe"`

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

## TODO-04: Zustand Shell API + Right-Bar Panel System

- **Right-Bar panel system** — Sheet overlay (lado direito) com suporte a tamanhos sm/md/lg
- **Panel deep-linking** — URL `?panel.id=vehicle.quickView&panel.entityId=V-001` abre o panel correcto
- **Panel registry** — painéis definidos em `mfe.config.json` com `panels: [{ panelId, module, title, size }]`
- **Cross-MFE vehicle selection** — mailbox pattern: Fleet escreve selecção, Rentals lê e limpa
- **Shell API passada como prop** — `shellApi?: ShellApi` em todos os remotes (navigate, openPanel, closePanel, selections)
