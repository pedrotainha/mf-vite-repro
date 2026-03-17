/**
 * @-label-/contracts
 * Shared types for the MFE architecture.
 */

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
