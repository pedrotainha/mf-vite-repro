# ADR-009: Cross-MFE Selections — Mailbox Pattern

## Status

Aceite

## Contexto

Os MFEs precisam de comunicar entre si sem coupling directo. O caso de uso principal é o fluxo de selecção de veículo:

1. **Rentals** precisa que o utilizador seleccione um veículo
2. **Fleet** tem a UI de selecção de veículos
3. Após selecção, **Rentals** recebe o veículo seleccionado

Não existe comunicação directa entre remotes — toda a coordenação passa pelo host.

## Decisão

Usar o **Mailbox Pattern** no Zustand store do host:

```text
┌──────────┐     openPanel()     ┌──────────┐    completeVehicleSelection()    ┌──────────┐
│ Rentals  │ ──────────────────▶ │   Host   │ ◀──────────────────────────────── │  Fleet   │
│          │                     │  (store) │                                   │  (panel) │
│          │ ◀───────────────── │          │                                   │          │
└──────────┘  onVehicleSelection └──────────┘                                   └──────────┘
              Change() callback
```

### Fluxo detalhado

```text
1. Rentals chama shellApi.openPanel({
     panelId: 'vehicle.quickView',
     payload: { context: 'rental-assignment' }
   })

2. Host abre o panel com Fleet's VehicleQuickView component

3. Utilizador selecciona veículo no Fleet panel

4. Fleet chama shellApi.completeVehicleSelection({
     id: 'V-001',
     plate: 'AA-00-BB',
     status: 'available',
     type: 'van'
   })

5. Host store actualiza selections.vehicleSelection = VehicleRef

6. Rentals recebe callback via shellApi.onVehicleSelectionChange(vehicle => {
     // vehicle = { id: 'V-001', plate: 'AA-00-BB', ... }
     // Rentals processa a selecção
   })

7. Rentals chama shellApi.clearVehicleSelection() após processar
```

### API no ShellApi

```typescript
interface ShellApi {
  // Write (Fleet side)
  completeVehicleSelection(vehicle: VehicleRef): void;

  // Read (Rentals side)
  getVehicleSelection(): VehicleRef | null;
  clearVehicleSelection(): void;

  // Subscribe (reactive)
  onVehicleSelectionChange(
    listener: (vehicle: VehicleRef | null) => void
  ): () => void;  // returns unsubscribe
}
```

### Porque "Mailbox"

- **Write once, read once** — o producer (Fleet) escreve, o consumer (Rentals) lê e limpa
- **Sem acoplamento** — Fleet não sabe quem vai ler; Rentals não sabe quem escreveu
- **Sem pub/sub global** — a selecção fica no store até ser consumida ou limpa
- **Idempotente** — chamar `clearVehicleSelection()` quando já está `null` é noop

## Consequências

### Positivas

- **Zero coupling** entre remotes — comunicação via ShellApi props
- **Type safe** — `VehicleRef` é um tipo partilhado via `@-label-/contracts`
- **Testável** — mock simples do ShellApi em testes unitários
- **Reactivo** — `onVehicleSelectionChange` usa `zustand.subscribe()` com selector

### Negativas

- **Um slot por tipo** — se houver necessidade de múltiplas selecções simultâneas, o pattern precisa de ser estendido (ex: `Map<contextId, VehicleRef>`)
- **Sem persistência** — se a página for recarregada, a selecção perde-se (design intencional — selecções são transient)

### TODOs

- [ ] Package `packages/shell-hooks` com hooks partilhados (ex: `useVehicleSelection()`) — TODO-05
- [ ] Avaliar necessidade de múltiplos slots de selecção quando surgirem mais use cases
