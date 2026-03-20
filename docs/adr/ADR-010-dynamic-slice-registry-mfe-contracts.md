# ADR-010: Dynamic Slice Registry + MFE Contracts por Domínio

## Status

Aceite (implementado — infra no POC, contracts por repo quando houver multi-repo)

## Contexto

O TODO-04 criou a Shell Store no host com 2 slices estáticos (RightBar, Selections) e uma `ShellApi` passada como prop aos remotes. Funciona, mas levanta questões de extensibilidade:

1. **A store vive no host** — se existir outro host, tem de duplicar a implementação
2. **Slices são estáticos** — definidos no boot do host. MFEs não podem registar estado próprio
3. **Tipos de domínio vivem em `@-label-/contracts`** — mistura infra (ShellApi) com domínio (VehicleRef)
4. **Dependência entre MFEs** — se Rentals quer ler estado do Fleet, como importa os tipos? Os remotes não são packages no build time

Este ADR documenta a arquitectura decidida para resolver estes problemas: **dynamic slice registry** com **contracts por domínio**.

---

## Perguntas e Decisões

### Porquê não deixar a store no host?

A store no host funciona enquanto existe **um** host. Quando surgir um segundo host (ex: backoffice vs operações), teria de duplicar:
- Slices (RightBar, Selections, Navigation)
- `createShellApi()` factory
- Middleware (devtools, subscribeWithSelector)

O contrato (`ShellApi` em `@-label-/contracts`) já é partilhado — os MFEs dependem dele. Mas a **implementação** está presa ao host. Extrair para `@-label-/shell-core` dá reutilização real.

### E se um host não precisa de right-bar?

Se o core vier com slices fixos (ex: `rightBarSlice` sempre activo), obriga hosts que não têm right-bar a carregar código desnecessário. Um host pode ter left-bar mas não right-bar, ou ter panels mas não ter selections.

**Decisão:** O core **não tem slices de fábrica**. O core é infra pura — criar store, registar slices, gerar ShellApi. As slices são todas pluggáveis:

```typescript
// Host A — tem right-bar + selections
const store = createShellStore({
  rightBar: rightBarSlice,
  selections: selectionsSlice,
  navigation: navigationSlice,
});

// Host B — tem left-bar, sem right-bar
const store = createShellStore({
  leftBar: leftBarSlice,
  navigation: navigationSlice,
});
```

O package `@-label-/shell-core` exporta slice factories como building blocks. O host importa os que precisa.

### Como é que um MFE regista estado na store?

MFEs são carregados dinamicamente em runtime. A store tem de suportar **registo dinâmico** de slices — quando o MFE monta, regista; quando desmonta, limpa.

**API imperativa (framework-agnostic):**

```typescript
// Fleet MFE — ao montar
shellApi.registerSlice({
  name: 'fleet',
  initialState: { selectedVehicle: null, filters: {} },
});

// Fleet escreve estado
shellApi.setSliceState('fleet', { selectedVehicle: vehicle });

// Cleanup no unmount
shellApi.unregisterSlice('fleet');
```

**Implementação no store (Zustand vanilla):**

```typescript
// _slices: Record<string, unknown> — estado dinâmico
// registerSlice → set _slices[name] = initialState
// setSliceState → merge parcial em _slices[name]
// unregisterSlice → delete _slices[name]
```

### E se o MFE que emite não está montado?

Se Rentals subscreve o slice `'fleet'` mas Fleet ainda não montou:

- `getSliceState('fleet')` → retorna `undefined`
- `onSliceChange('fleet', listener)` → o listener fica registado, é chamado quando Fleet montar e registar o slice

É o **mailbox pattern** que já existe no `vehicleSelection` — o produtor deposita quando quer, o consumidor lê quando pode. O `subscribeWithSelector` do Zustand trata disto nativamente: observa `_slices['fleet']`, que muda de `undefined` para o `initialState` quando Fleet chama `registerSlice`.

O MFE consumidor programa defensivamente:

```typescript
// React
const fleet = useSlice(FLEET_SLICE);
if (!fleet) return <p>Fleet não disponível</p>;
```

### E se dois MFEs registam o mesmo slice?

Dois cenários possíveis:

**A) Mesmo domínio, duas instâncias** (ex: dois ecrãs de Fleet abertos):

Partilham o mesmo slice. O store usa **reference counting**:

```typescript
registerSlice: (descriptor) => {
  const existing = get()._sliceRefs[descriptor.name];
  if (existing) {
    // Já registado — incrementa refCount, mantém estado actual
    set({ _sliceRefs: { ...refs, [name]: { refCount: existing.refCount + 1 } } });
    return;
  }
  // Primeiro registo — cria com initialState
  set({
    _slices: { ...slices, [name]: descriptor.initialState },
    _sliceRefs: { ...refs, [name]: { refCount: 1 } },
  });
};

unregisterSlice: (name) => {
  const existing = get()._sliceRefs[name];
  if (existing.refCount > 1) {
    // Ainda há consumidores — decrementa
    set({ _sliceRefs: { ...refs, [name]: { refCount: existing.refCount - 1 } } });
    return;
  }
  // Último consumidor — limpa tudo
  // delete _slices[name] + delete _sliceRefs[name]
};
```

**B) Domínios diferentes com colisão de nome:**

Não deve acontecer — os nomes vêm de constantes tipadas em contracts (ver secção seguinte). O contrato é o ponto de coordenação.

### Como evitar typos nos nomes dos slices?

Strings soltas (`'fleet'`, `'feeet'`) são receita para bugs silenciosos. O MFE escreve `'fleet'`, o consumidor subscreve `'feeet'` — zero erros, zero dados.

**Decisão:** Slice descriptors como **constantes tipadas** exportadas dos contracts:

```typescript
// @-label-/fleet-contracts (ou @-label-/contracts/domains/fleet.ts)
export interface FleetSlice {
  selectedVehicle: VehicleRef | null;
  filters: Record<string, string>;
}

export const FLEET_SLICE = {
  name: 'fleet',
  initialState: { selectedVehicle: null, filters: {} },
} as const satisfies SliceDescriptor<FleetSlice>;
```

Produtor e consumidor importam a **mesma constante**:

```typescript
// Fleet (produtor)
import { FLEET_SLICE } from '@-label-/fleet-contracts';
shellApi.registerSlice(FLEET_SLICE);
shellApi.setSliceState(FLEET_SLICE.name, { selectedVehicle: v });

// Rentals (consumidor)
import { FLEET_SLICE } from '@-label-/fleet-contracts';
shellApi.onSliceChange(FLEET_SLICE.name, (state: FleetSlice) => { ... });
```

Zero strings soltas. TypeScript falha no build se o import não existir.

### Porquê contracts por MFE e não tudo em `@-label-/contracts`?

Os tipos de domínio são do MFE, não da infra. Meter `FleetSlice`, `RentalsSlice`, `MaintenanceSlice` tudo em `@-label-/contracts` mistura responsabilidades:

- Contracts muda sempre que qualquer MFE muda o seu slice
- Todos os MFEs dependem de todos os outros via contracts
- Num cenário multi-repo, contracts seria o bottleneck

**Decisão:** Contracts por domínio, co-localizados com o MFE:

```text
repo-fleet/
├── apps/fleet/           ← MFE
└── packages/
    └── fleet-contracts/  ← @-label-/fleet-contracts
        └── src/
            ├── fleet-slice.ts    ← FleetSlice, FLEET_SLICE
            └── vehicle.types.ts  ← VehicleRef, VehicleStatus
```

Quem precisa dos tipos do Fleet, adiciona `@-label-/fleet-contracts` como dependência. É um package de **tipos puros** (zero runtime), publicado no registry privado.

**Para já (monorepo):** os tipos vivem em `@-label-/contracts/domains/fleet.ts` — extracção para packages separados quando surgir multi-repo.

### Porquê não o MFE exportar os seus tipos directamente?

O Fleet poderia expor `./FleetSlice` via Module Federation e os consumidores importariam directamente. Mas:

1. **Build time vs runtime** — Module Federation resolve remotes em runtime. O `import { FLEET_SLICE } from '@-label-/fleet'` não resolve no build time porque Fleet não é uma dependência no `package.json` de Rentals
2. **DTS plugin desactivado** — o plugin DTS do `@module-federation/vite` geraria tipos entre remotes, mas está desactivado (ADR-006) por instabilidade com build order e hot reload
3. **CI paralelo** — cada remote builda independentemente. Os tipos dos outros remotes não existem durante o build
4. **Standalone dev** — quando o remote corre sozinho sem host nem outros remotes, os tipos dos outros remotes não estão disponíveis

O package de contracts resolve tudo: é publicado no registry, disponível no build time, independente do runtime de federation.

### É framework-agnostic?

Sim. Toda a stack:

- **`@-label-/contracts`** — interfaces TypeScript puras (zero runtime)
- **`@-label-/shell-core`** — `zustand/vanilla` (JS puro, sem React)
  - `createStore()` em vez de `create()` — não gera hooks React
  - `store.getState()`, `store.subscribe()` — API imperativa
- **`@-label-/shell-hooks`** — React bindings (`useShellApi()`, `useSlice()`)
  - Camada de conveniência, MFEs React importam
- **MFE não-React** — usa `shellApi` prop directamente (ver ANALYSIS_FRAMEWORK_AGNOSTIC.md)

```text
┌─────────────────────────────────────────────────┐
│  @-label-/shell-hooks          (React)          │  ← useShellApi(), useSlice()
├─────────────────────────────────────────────────┤
│  @-label-/shell-core           (vanilla JS)     │  ← createShellStore(), slices
│  createDynamicStore() + slice registry          │
│  createShellApi() factory                       │
├─────────────────────────────────────────────────┤
│  @-label-/contracts            (tipos puros)    │  ← ShellApi, SliceDescriptor
│  @-label-/*-contracts          (tipos domínio)  │  ← FleetSlice, FLEET_SLICE
└─────────────────────────────────────────────────┘
```

Um MFE Vue chamaria:
```typescript
shellApi.registerSlice(FLEET_SLICE);
shellApi.setSliceState(FLEET_SLICE.name, { selectedVehicle: v });
shellApi.onSliceChange(RENTALS_SLICE.name, listener);
```

Sem imports de React, sem hooks, sem Context.

---

## Decisão

### Arquitectura de slices

1. **`@-label-/shell-core`** (package, `zustand/vanilla`) — infra de store com dynamic slice registry
2. **Zero slices de fábrica** — o host compõe os slices que precisa
3. **MFEs registam slices em runtime** via `shellApi.registerSlice()` / `unregisterSlice()`
4. **Reference counting** para slices duplicados — partilham estado, último unmount limpa
5. **Mailbox pattern** — consumidores podem subscrever slices que ainda não existem

### Contracts por domínio

1. **Infra** em `@-label-/contracts` — `ShellApi`, `SliceDescriptor`, `registerSlice`
2. **Domínio** em `@-label-/*-contracts` — tipos e descriptors de cada MFE, co-localizados com o repo do MFE

### Type-safety

1. **Slice descriptors** são constantes tipadas (`as const satisfies SliceDescriptor<T>`)
2. **Nomes de slices** vêm de constantes importadas, nunca de strings soltas
3. **Genéricos** na API: `getSliceState<FleetSlice>(FLEET_SLICE.name)`

---

## Consequências

### Positivas

- **Extensível** — hosts compõem slices, MFEs registam estado sem fork da store
- **Framework-agnostic** — `zustand/vanilla` + API imperativa
- **Type-safe** — constantes tipadas eliminam typos em nomes de slices
- **Resiliente** — mailbox pattern para dependências entre MFEs que podem não estar montados
- **Um padrão** — equipas seguem o mesmo pattern para cross-MFE state, sem variantes

### Negativas

- **Mais packages** — `shell-core`, `shell-hooks`, contracts por domínio
- **Indirections** — MFE → contracts → store, em vez de acesso directo
- **Reference counting** — complexidade adicional para slices partilhados
- **Tipo `unknown`** — `getSliceState` retorna `unknown` sem genérico explícito

### Riscos mitigados

| Risco | Mitigação |
|-------|-----------|
| Typo em nome de slice | Constantes tipadas em contracts — TypeScript falha no build |
| Slice não registado | `undefined` + mailbox — consumidor programa defensivamente |
| Dois MFEs registam mesmo slice | Reference counting — partilham, último limpa |
| Host sem right-bar forçado a ter slice | Zero slices de fábrica — host compõe |
| MFE não-React precisa de state | API imperativa via `shellApi` prop |

---

## Referências

- [ADR-007](ADR-007-zustand-shell-api.md) — Zustand Shell API, props over Context
- [ADR-009](ADR-009-cross-mfe-selections-mailbox.md) — Mailbox pattern para selections
- [ANALYSIS_FRAMEWORK_AGNOSTIC.md](../ANALYSIS_FRAMEWORK_AGNOSTIC.md) — Análise de MFEs não-React
- [Zustand vanilla API](https://zustand.docs.pmnd.rs/guides/how-to-use-zustand-vanilla) — `createStore` sem React
