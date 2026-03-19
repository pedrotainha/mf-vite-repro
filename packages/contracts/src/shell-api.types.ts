import type { VehicleRef } from './domain.types';

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
}
