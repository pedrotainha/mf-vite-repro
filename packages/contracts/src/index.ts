/**
 * @-label-/contracts
 * Shared types for the MFE architecture.
 * Types will be added as the project evolves.
 */

export interface MfeConfigEntry {
  name: string;
  path: string;
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
  tab?: string;
}

export interface MfePanelConfig {
  id: string;
  module: string;
  size?: 'sm' | 'md' | 'lg';
}
