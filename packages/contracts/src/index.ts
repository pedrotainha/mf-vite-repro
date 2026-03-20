/**
 * @-label-/contracts
 * Shared types for the MFE architecture.
 */

export type { RentalStatus, VehicleRef, VehicleStatus, VehicleType, WorkOrderStatus, WorkOrderType } from './domain.types';
export type { RightBarRequest, RightBarStackItem, RightBarState, SelectionsState, ShellApi, SliceDescriptor } from './shell-api.types';

// ── Domain contracts ────────────────────────────────────────────
export type { FleetSlice, MaintenanceSlice, RentalsSlice } from './domains';
export { FLEET_SLICE, MAINTENANCE_SLICE, RENTALS_SLICE } from './domains';

// ── MFE Config types ─────────────────────────────────────────

export interface MfeConfigEntry {
  name: string;
  path?: string;
  entry: string;
  module: string;
  label?: string;
  icon?: string;
  children?: MfeChildRoute[];
  panels?: MfePanelConfig[];
  submenu?: MfeConfigEntry[];
  externalUrl?: string;
}

export interface MfeChildRoute {
  path: string;
  module: string;
  tab?: {
    label: string;
    icon?: string;
  };
}

export interface MfePanelConfig {
  panelId: string;
  module: string;
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface RemoteDefinition {
  remoteName: string;
  moduleName: string;
}
