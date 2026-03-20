# @-label-/shell-core

## 0.2.0

### Minor Changes

- ADR-010: Dynamic Slice Registry + MFE Contracts
  - @-label-/shell-core: new package — zustand/vanilla store factory with dynamic slice registry, ref-counting, pluggable host slices, createShellApi
  - @-label-/shell-hooks: new package — React bindings (useShellStore, ShellApiProvider, useShellApi, useSlice)
  - @-label-/contracts: added SliceDescriptor type, dynamic ShellApi methods, domain contracts (FleetSlice, RentalsSlice, MaintenanceSlice)
