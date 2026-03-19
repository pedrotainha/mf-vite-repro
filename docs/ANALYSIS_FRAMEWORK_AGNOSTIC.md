# Análise: Framework-Agnostic MFEs — Dependências, Riscos e Soluções

## Contexto

Este POC usa React em toda a stack (host + remotes + Design System). A questão é: **se um MFE precisar de ser noutra framework (Vue, Svelte, Vanilla), o que quebra e como se resolve?**

Esta análise mapeia as dependências que prendem ao React, o impacto de ter MFEs não-React, e as soluções para manter todas as features do shell a funcionar independentemente do framework.

---

## Dependências que prendem ao React

| Dependência | Onde | Porquê prende |
|---|---|---|
| **Design System** (`@-label-/ui-internal-core`) | Host + remotes | Componentes React — MFE não-React não pode importar. Só pode usar tokens CSS / utility classes |
| **React Router (Outlet)** | Host | MFEs são renderizados via `<Outlet>`. Um MFE não-React não pode ser filho de uma rota React |
| **shell-hooks** (`@-label-/shell-hooks`) | Remotes | `useState`, `useEffect` — são React hooks. MFE não-React não pode usar |
| **Module Federation shared React** | Runtime | MFE não-React não partilha React — carrega o seu próprio framework. Bundle cresce |

---

## Problemas concretos com MFE não-React

### 1. Mount / Rendering

**Hoje:** O host usa `<RemoteSlot>` com `<Suspense>` + `<Outlet>` do React Router. O MFE exporta um componente React default.

**Problema:** Um MFE Vue exporta uma app Vue, não um componente React. O `<Outlet>` não sabe montá-lo.

**Solução:** Definir um contrato alternativo de mount. MFEs não-React exportam `{ mount, unmount }` em vez de um React component:

```typescript
// Contrato para MFE não-React
interface MfeMountContract {
  mount(element: HTMLElement, props: { shellApi?: ShellApi }): void;
  unmount(element: HTMLElement): void;
}
```

O `RemoteSlot` do host detecta o tipo de export e adapta:
- **React MFE** → renderiza como componente normal (pattern actual)
- **Não-React MFE** → cria `<div ref>`, chama `mount(ref, { shellApi })`, cleanup via `unmount()`

O `mfe.config.json` pode indicar o framework:

```json
{ "name": "reports", "framework": "vue", "module": "./ReportsMfe", ... }
```

Valor default: `"react"` (compatível com tudo o que existe).

### 2. Sub-rotas internas

**Hoje:** O Fleet tem sub-rotas via React Router (ex: `/fleet/vehicles/:id`). O host conhece estas rotas porque estão declaradas no `mfe.config.json` como `children` e são renderizadas via `<Route>` + `<Outlet>`.

**Problema:** Um MFE Vue geraria as sub-rotas com Vue Router internamente. O React Router do host não sabe que o Vue Router mudou de rota. Perde-se:
- Breadcrumbs automáticos
- Highlight do item activo na sidebar
- Sincronização da URL do browser com a rota interna

**Solução:** Adicionar métodos ao `ShellApi` para o MFE comunicar as suas mudanças de rota ao host:

```typescript
interface ShellApi {
  // MFE notifica o host da sua rota activa
  setActiveRoute(path: string): void;

  // MFE define os breadcrumbs (substitui os automáticos)
  setBreadcrumbs(segments: { label: string; path: string }[]): void;

  // MFE subscreve a mudanças de location do host
  onLocationChange(listener: (path: string) => void): () => void;
}
```

**Fluxo:**

```text
1. Host navega para /fleet (React Router)
2. Host monta FleetMfe (Vue) num <div>
3. Vue Router inicializa, lê /fleet/vehicles da URL
4. Fleet chama shellApi.setActiveRoute('/fleet/vehicles')
5. Fleet chama shellApi.setBreadcrumbs([
     { label: 'Fleet', path: '/fleet' },
     { label: 'Vehicles', path: '/fleet/vehicles' }
   ])
6. Host actualiza sidebar highlight e breadcrumbs
7. Utilizador navega dentro do Fleet (Vue Router muda rota)
8. Fleet chama setActiveRoute + setBreadcrumbs novamente
```

O host dá ownership do prefixo `/fleet/*` ao MFE — qualquer mudança de URL dentro desse prefixo é gerida pelo MFE. O host só precisa de saber a rota activa para UI (breadcrumbs, sidebar).

### 3. Breadcrumbs

**Hoje:** Gerados automaticamente a partir de `useLocation().pathname` no host. Cada segmento do URL é capitalizado e linkável.

**Problema:** Com MFE não-React, o host não sabe o significado dos segmentos internos (ex: `/fleet/vehicles/V-001` — o host não sabe que `V-001` é um veículo com placa `AA-00-BB`).

**Solução:** `shellApi.setBreadcrumbs()` (descrito acima). O MFE é dono dos seus breadcrumbs — pode incluir labels significativos em vez de slugs do URL.

Para MFEs React que usam o routing do host (pattern actual), os breadcrumbs automáticos continuam a funcionar. O `setBreadcrumbs` é opt-in — só necessário quando o MFE quer overridar os breadcrumbs gerados.

### 4. Prefetch / Preload de rotas

**Hoje:** Não há prefetch activo. O `lazyRemoteComponent` carrega on-demand.

**Problema:** React Router pode prefetcher rotas React (via `lazy` + `loader`), mas não sabe das rotas de um MFE Vue.

**Solução:** Os MFEs declaram as suas rotas no `mfe.config.json` (campo `children` já existe). O host pode usar essa informação para:
- `<link rel="prefetch" href="remoteEntry.js">` — prefetch do entry point do MFE
- Prefetch por hover na sidebar (user intent)

O prefetch do código interno do MFE (chunks Vue, etc.) fica a cargo do MFE — o host só garante que o `remoteEntry.js` está cached.

### 5. Shell Hooks vs ShellApi directo

**Hoje:** `shellApi` é passado como prop. Planeado: `@-label-/shell-hooks` com hooks React (ex: `useVehicleSelection()`).

**Problema:** MFE não-React não pode usar React hooks.

**Solução:** Separação clara em camadas:

```text
┌─────────────────────────────────────────────┐
│  @-label-/shell-hooks        (React)        │  ← Conveniência para MFEs React
│  useVehicleSelection(shellApi)              │
│  useBreadcrumbs(shellApi)                   │
├─────────────────────────────────────────────┤
│  @-label-/contracts          (JS puro)      │  ← Contrato framework-agnostic
│  ShellApi interface                         │
│  shellApi.onVehicleSelectionChange()        │
│  shellApi.setBreadcrumbs()                  │
├─────────────────────────────────────────────┤
│  Zustand Store               (Host)         │  ← Implementação no host
│  RightBarSlice, SelectionsSlice, etc.       │
└─────────────────────────────────────────────┘
```

- **MFE React** → importa `@-label-/shell-hooks`, usa hooks
- **MFE não-React** → usa `shellApi` prop directamente (imperative API)
- **Contrato** → é sempre o `ShellApi` de `@-label-/contracts` (framework-agnostic)

Se no futuro existirem MFEs Vue, cria-se `@-label-/shell-composables` seguindo o mesmo padrão.

### 6. Design System

**Hoje:** `@-label-/ui-internal-core` exporta componentes React (Button, Sheet, Sidebar, etc.) + globals CSS (tokens, reset, utilities).

**Problema:** MFE não-React não pode importar componentes React do DS.

**Solução parcial:**
- MFE não-React importa **apenas o CSS** do DS: tokens, variáveis, utility classes
- Componentes UI têm de ser reimplementados no framework do MFE (ou usar Web Components se o DS migrar para isso)
- Esta é a limitação mais forte — não há solução zero-cost

**Nota:** Esta limitação existe independentemente da arquitectura MFE. Qualquer sistema com DS em React tem este problema.

---

## Resumo de soluções

| Feature | Solução | Framework-agnostic? |
|---|---|---|
| Mount de MFE | `{ mount, unmount }` contract + wrapper no RemoteSlot | Sim |
| Sub-rotas | `shellApi.setActiveRoute()` + ownership de prefixo URL | Sim |
| Breadcrumbs | `shellApi.setBreadcrumbs()` — MFE é dono dos seus breadcrumbs | Sim |
| Navegação coordenada | `shellApi.onLocationChange()` + `setActiveRoute()` | Sim |
| Prefetch | `mfe.config.json` children + `<link rel="prefetch">` | Sim |
| Shell hooks | `@-label-/shell-hooks` (React) sobre `ShellApi` (agnostic) | Camadas separadas |
| Design System | CSS tokens sim, componentes React não | Parcial |

---

## Decisão

O `ShellApi` (em `@-label-/contracts`) é o contrato **framework-agnostic**. Tudo o que é cross-MFE passa por ele. Os hooks React (`@-label-/shell-hooks`) são uma camada de conveniência sobre esse contrato.

A arquitectura não precisa de mudar para suportar MFEs não-React — precisa de:
1. Contrato `{ mount, unmount }` para MFEs não-React
2. Métodos adicionais no `ShellApi` (`setBreadcrumbs`, `setActiveRoute`, `onLocationChange`)
3. Adaptação do `RemoteSlot` para detectar e montar MFEs não-React

Estas extensões são retrocompatíveis — MFEs React existentes continuam a funcionar sem alteração.

---

## Impacto nos TODOs

- **`@-label-/shell-hooks`** — avançar com a criação. É a camada React sobre o `ShellApi`. Não impede MFEs não-React (usam `shellApi` directo).
- **`ShellApi` extensões** (setBreadcrumbs, setActiveRoute, onLocationChange) — adicionar quando houver necessidade concreta, não agora. O contrato é extensível.
- **`{ mount, unmount }` contract** — definir em `@-label-/contracts` quando surgir o primeiro MFE não-React.
