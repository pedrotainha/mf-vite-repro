import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import { config } from '../../config';

import type { RightBarRequest, RightBarStackItem, SelectionsState, ShellApi, VehicleRef } from '@-label-/contracts';

// ── RightBar Slice ──────────────────────────────────────────

interface RightBarSlice {
  rightBar: {
    isOpen: boolean;
    stack: RightBarStackItem[];
  };
  openPanel: (request: RightBarRequest) => void;
  closePanel: () => void;
  updatePanelPayload: (payload: Record<string, unknown>) => void;
}

// ── Selections Slice ────────────────────────────────────────

interface SelectionsSlice {
  selections: SelectionsState;
  completeVehicleSelection: (vehicle: VehicleRef) => void;
  clearVehicleSelection: () => void;
}

// ── Combined Store ──────────────────────────────────────────

interface ShellStore extends RightBarSlice, SelectionsSlice {
  /** Navigate callback — set by ShellApiProvider when router is available */
  navigateCallback: ((path: string) => void) | null;
  setNavigate: (navigateFunction: (path: string) => void) => void;
}

export const useShellStore = create<ShellStore>()(
  devtools(
    subscribeWithSelector(set => ({
      // RightBar
      rightBar: { isOpen: false, stack: [] },
      openPanel: request =>
        set(
          state => ({
            rightBar: {
              isOpen: true,
              stack: [...state.rightBar.stack, { panelId: request.panelId, payload: request.payload ?? {} }],
            },
          }),
          undefined,
          'shell/openPanel',
        ),
      closePanel: () =>
        set(
          state => {
            const newStack = state.rightBar.stack.slice(0, -1);
            return {
              rightBar: {
                isOpen: newStack.length > 0,
                stack: newStack,
              },
            };
          },
          undefined,
          'shell/closePanel',
        ),
      updatePanelPayload: payload =>
        set(
          state => {
            const stack = [...state.rightBar.stack];
            const top = stack.at(-1);
            if (!top) return state;
            stack[stack.length - 1] = { panelId: top.panelId, payload: { ...top.payload, ...payload } };
            return { rightBar: { ...state.rightBar, stack } };
          },
          undefined,
          'shell/updatePanelPayload',
        ),

      // Selections
      selections: { vehicleSelection: null },
      completeVehicleSelection: vehicle => set({ selections: { vehicleSelection: vehicle } }, undefined, 'shell/completeVehicleSelection'),
      clearVehicleSelection: () => set({ selections: { vehicleSelection: null } }, undefined, 'shell/clearVehicleSelection'),

      // Navigation
      navigateCallback: null,
      setNavigate: navigateFunction => set({ navigateCallback: navigateFunction }, undefined, 'shell/setNavigate'),
    })),
    { name: 'shell-store', enabled: config.ENABLE_STORE_DEVTOOLS === 'true' },
  ),
);

// ── ShellApi factory ────────────────────────────────────────

export const createShellApi = (): ShellApi => ({
  openPanel: request => useShellStore.getState().openPanel(request),
  closePanel: () => useShellStore.getState().closePanel(),
  updatePanelPayload: payload => useShellStore.getState().updatePanelPayload(payload),
  completeVehicleSelection: vehicle => useShellStore.getState().completeVehicleSelection(vehicle),
  clearVehicleSelection: () => useShellStore.getState().clearVehicleSelection(),
  getVehicleSelection: () => useShellStore.getState().selections.vehicleSelection,
  onVehicleSelectionChange: listener => useShellStore.subscribe(state => state.selections.vehicleSelection, listener),
  navigate: path => {
    const nav = useShellStore.getState().navigateCallback;
    if (nav) nav(path);
  },
});
