import type { VehicleRef } from './domain.types';

// ── Slice Descriptor ─────────────────────────────────────────

export interface SliceDescriptor<T = Record<string, unknown>> {
  name: string;
  initialState: T;
}

// ── Right-bar ────────────────────────────────────────────────

export interface RightBarRequest {
  panelId: string;
  payload?: Record<string, unknown>;
}

export interface RightBarStackItem {
  panelId: string;
  payload: Record<string, unknown>;
}

export interface RightBarState {
  isOpen: boolean;
  /** Panel stack. Last item is the visible panel. */
  stack: RightBarStackItem[];
}

// ── Selections (cross-MFE "mailbox") ────────────────────────

export interface SelectionsState {
  /** Written by fleet, consumed by rentals (assign vehicle flow) */
  vehicleSelection: VehicleRef | null;
}

// ── ShellApi (exposed to remotes via props) ──────────────────

export interface ShellApi {
  // Right-bar
  openPanel(request: RightBarRequest): void;
  closePanel(): void;
  updatePanelPayload(payload: Record<string, unknown>): void;

  // Selections (cross-MFE reactive mailbox)
  completeVehicleSelection(vehicle: VehicleRef): void;
  clearVehicleSelection(): void;
  getVehicleSelection(): VehicleRef | null;
  /** Subscribe to vehicle selection changes. Returns unsubscribe function. */
  onVehicleSelectionChange(listener: (vehicle: VehicleRef | null) => void): () => void;

  // Navigation
  navigate(path: string): void;

  // Dynamic slice registry
  registerSlice<T>(descriptor: SliceDescriptor<T>): void;
  unregisterSlice(name: string): void;
  getSliceState<T>(name: string): T | undefined;
  setSliceState<T>(name: string, partial: Partial<T>): void;
  onSliceChange<T>(name: string, listener: (state: T) => void): () => void;
}
