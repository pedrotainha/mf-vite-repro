import type { ShellStore } from './shell-store';
import { onSliceChange } from './shell-store';

import type { ShellApi, SliceDescriptor, VehicleRef } from '@-label-/contracts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic store state requires flexible access
const state = (store: ShellStore): any => store.getState();

export const createShellApi = (store: ShellStore): ShellApi => ({
  // Right-bar
  openPanel: request => state(store).openPanel(request),
  closePanel: () => state(store).closePanel(),
  updatePanelPayload: payload => state(store).updatePanelPayload(payload),

  // Selections
  completeVehicleSelection: vehicle => state(store).completeVehicleSelection(vehicle),
  clearVehicleSelection: () => state(store).clearVehicleSelection(),
  getVehicleSelection: (): VehicleRef | null => state(store).selections.vehicleSelection,
  onVehicleSelectionChange: listener =>
    store.subscribe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accessing host slice state dynamically
      (s: any) => s.selections.vehicleSelection as VehicleRef | null,
      listener,
    ),

  // Navigation
  navigate: path => {
    const nav = state(store).navigateCallback;
    if (nav) nav(path);
  },

  // Dynamic slice registry
  registerSlice: <T>(descriptor: SliceDescriptor<T>) => store.getState().registerSlice(descriptor),
  unregisterSlice: (name: string) => store.getState().unregisterSlice(name),
  getSliceState: <T>(name: string) => store.getState().getSliceState<T>(name),
  setSliceState: <T>(name: string, partial: Partial<T>) => store.getState().setSliceState<T>(name, partial),
  onSliceChange: <T>(name: string, listener: (state: T) => void) => onSliceChange<T>(store, name, listener),
});
