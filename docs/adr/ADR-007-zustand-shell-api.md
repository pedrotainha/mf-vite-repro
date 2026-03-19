# ADR-007: Zustand Shell API — Props over Context em Federation

## Status

Aceite

## Contexto

Numa arquitectura de micro-frontends com Module Federation, os remotes são carregados dinamicamente em runtime. O host precisa de fornecer uma API de shell (navegação, panels, selections) aos remotes para comunicação cross-MFE.

Existiam duas abordagens possíveis:

1. **React Context** — `ShellApiContext.Provider` no host, `useContext(ShellApiContext)` nos remotes
2. **Props** — `shellApi?: ShellApi` como prop passada a cada remote

### Problemas com Context em Federation

- Remotes carregados via `loadRemote()` podem ter a sua própria instância de React (mesmo com shared deps). Se o React não for resolvido como singleton exacto, `useContext()` retorna `undefined` porque o remote está num contexto React diferente.
- Em standalone development (remote a correr sozinho sem host), não existe `ShellApiProvider` — os hooks de contexto falham com erro.
- O Context é invisível na assinatura do componente — não é claro quais dependências o remote precisa do host.

## Decisão

Usar **props** para passar a Shell API aos remotes:

```typescript
interface Props {
  shellApi?: ShellApi;
}
```

A prop é **opcional** (`shellApi?`) para permitir:
- Standalone dev do remote sem host
- Testes unitários do remote sem mock do provider
- Migração gradual (remotes podem ignorar a prop inicialmente)

## Implementação

### Shell Store (Zustand)

O store é criado no host com 2 slices:

- **RightBarSlice** — stack LIFO de panels (openPanel, closePanel, updatePanelPayload)
- **SelectionsSlice** — mailbox pattern para comunicação cross-MFE (vehicleSelection)

Middleware: `devtools` (toggle via `VITE_ENABLE_STORE_DEVTOOLS`) + `subscribeWithSelector`.

### createShellApi()

Factory que cria uma referência estável da `ShellApi` usando `useShellStore.getState()`:

```typescript
const createShellApi = (): ShellApi => ({
  openPanel: (request) => useShellStore.getState().openPanel(request),
  closePanel: () => useShellStore.getState().closePanel(),
  navigate: (path) => { /* uses stored navigate callback */ },
  // ... etc
});
```

### ShellApiProvider

Cria a referência estável via `useMemo(() => createShellApi(), [])` e injeta `useNavigate()` do react-router no store.

Os componentes do **host** (ex: `RightBar`) podem usar `useShellApi()` hook via Context interno. Os **remotes** recebem a Shell API como prop.

## Consequências

### Positivas

- **Funciona com qualquer configuração de shared deps** — não depende de React singleton exacto
- **Standalone dev** — remotes podem correr sem host, a prop é simplesmente `undefined`
- **Explícito** — a assinatura do componente documenta as dependências do host
- **Testável** — easy mock em testes unitários via props

### Negativas

- **Prop drilling** — se o remote tiver sub-componentes que precisam da API, tem de passar como prop ou criar o seu próprio Context interno
- **Referência** — cada remote precisa do tipo `ShellApi` de `@-label-/contracts`

## Alternativas consideradas

- **React Context puro** — rejeitado por fragilidade com shared deps e standalone dev
- **Window globals** (`window.__shellApi__`) — rejeitado por falta de type safety e coupling
- **Custom Events** — rejeitado por complexidade de API e falta de type safety
