# ADR-008: Right-Bar Panel System + URL Sync Strategy

## Status

Aceite

## Contexto

O shell precisa de um sistema de panels (right-bar/side panel) para mostrar conteúdo contextual (ex: quick view de um veículo). Os panels devem:

1. Suportar deep-linking (partilhar URL com panel aberto)
2. Manter estado durante navegação SPA
3. Carregar componentes remotos via Module Federation
4. Evitar sync loops entre URL e estado da aplicação

## Decisão

### URL Sync: Zustand é master, URL é espelho

```text
┌─────────────────────────────────────────────┐
│                 MOUNT                       │
│                                             │
│  URL ──(one-shot read)──▶ Zustand Store     │
│  ?panel.id=vehicle.quickView                │
│  &panel.entityId=V-001                      │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              RUNTIME                        │
│                                             │
│  Zustand Store ──(mirror)──▶ URL            │
│  openPanel()  ──▶  ?panel.id=...            │
│  closePanel() ──▶  (remove panel.*)         │
│                                             │
│  URL nunca manda no Zustand após mount      │
│                                             │
└─────────────────────────────────────────────┘
```

**Fluxo no mount:**
1. Componente lê `panel.id` e `panel.entityId` da URL (one-shot via `mountedRef`)
2. Se existem, chama `shellApi.openPanel({ panelId, payload: { id: entityId } })`
3. Zustand actualiza → useEffect mirror actualiza URL (noop se já está correcto)

**Fluxo em runtime:**
1. Código chama `shellApi.openPanel(...)` ou `shellApi.closePanel()`
2. Zustand actualiza o state
3. useEffect detecta mudança → `setSearchParams(prev => ...)` actualiza URL

### Namespace `panel.*`

Os query params do panel system usam o prefixo `panel.`:

- `panel.id` — ID do panel (ex: `vehicle.quickView`)
- `panel.entityId` — ID da entidade contextual (ex: `V-001`)

Isto evita colisão com query params de negócio dos MFEs (ex: `?page=2&sort=name`).

### Panel Registry

```text
mfe.config.json
  └─ panels: [{ panelId, module, title, size }]
       │
       ▼
buildPanelRegistry(configs)
  └─ Map<panelId, PanelRegistryEntry>
       │
       ▼
getOrCreatePanelComponent(entry)
  └─ lazyRemoteComponent({ remoteName, moduleName })
       │
       ▼
<PanelContent component={...} entry={...} />
  └─ <Suspense> + <MfeErrorBoundary>
```

### Panel Sizes

| Size | Max Width | Use Case |
|------|-----------|----------|
| sm | 320px | Compact info panels |
| md | 480px | Standard detail views (default) |
| lg | 640px | Forms, rich content |

## Consequências

### Positivas

- **Deep-linking funciona** — copiar URL com `?panel.id=...` abre o panel correcto
- **Sem sync loops** — direcção clara (Zustand → URL), sem bidirectional sync
- **Panels sobrevivem a navegação SPA** — o state está no Zustand, não no router
- **Extensível** — adicionar `panel.*` params é trivial (ex: `panel.tab`, `panel.scroll`)

### Negativas

- **URL não é o source of truth** — se alguém modificar a URL manualmente após mount, não tem efeito (o Zustand sobre-escreve no próximo re-render)
- **`setSearchParams` destructivo** — usar `setSearchParams(prev => ...)` (callback com merge) é obrigatório; `setSearchParams({ key: value })` (objecto) apaga todos os outros params

### TODOs

- [ ] Regra ESLint para detectar `setSearchParams()` destrutivo (sem callback/prev) — ver backlog
- [ ] Quando houver mais `panel.*` params, considerar serialização/deserialização centralizada
