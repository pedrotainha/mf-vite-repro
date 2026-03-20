/**
 * Builds the MFE config array with remote entry URLs sourced from environment variables.
 *
 * This allows Playwright tests to intercept GET /api/mfes and respond with
 * whatever remote URLs are needed — local dev, local preview, staging, or production.
 *
 * Env vars (all optional — defaults to dev URLs on localhost:4xxx):
 *   E2E_FLEET_ENTRY       — full URL to fleet remoteEntry.js
 *   E2E_RENTALS_ENTRY     — full URL to rentals remoteEntry.js
 *   E2E_MAINTENANCE_ENTRY — full URL to maintenance remoteEntry.js
 *
 * See ADR-011 for usage examples (monorepo, multi-repo, CI, CDN).
 */

interface MfePanel {
  panelId: string;
  module: string;
  title: string;
  size: string;
}

interface MfeConfigEntry {
  name: string;
  label: string;
  icon: string;
  entry: string;
  module: string;
  path?: string;
  externalUrl?: string;
  panels?: MfePanel[];
  submenu?: MfeConfigEntry[];
}

const FLEET_ENTRY = process.env.E2E_FLEET_ENTRY ?? 'http://localhost:4174/remoteEntry.js';
const RENTALS_ENTRY = process.env.E2E_RENTALS_ENTRY ?? 'http://localhost:4175/remoteEntry.js';
const MAINTENANCE_ENTRY = process.env.E2E_MAINTENANCE_ENTRY ?? 'http://localhost:4176/remoteEntry.js';

export const buildMfeConfig = (): MfeConfigEntry[] => [
  {
    name: 'operations',
    label: 'Operations',
    icon: 'FolderOpen',
    entry: '',
    module: '',
    submenu: [
      {
        name: 'fleet',
        label: 'Fleet',
        icon: 'Car',
        path: '/fleet',
        entry: FLEET_ENTRY,
        module: './FleetMfe',
        panels: [
          {
            panelId: 'vehicle.quickView',
            module: './VehicleQuickView',
            title: 'Vehicle Quick View',
            size: 'md',
          },
        ],
      },
      {
        name: 'maintenance',
        label: 'Maintenance',
        icon: 'Wrench',
        path: '/maintenance',
        entry: MAINTENANCE_ENTRY,
        module: './MaintenanceMfe',
      },
    ],
  },
  {
    name: 'rentals',
    label: 'Rentals',
    icon: 'CalendarDays',
    path: '/rentals',
    entry: RENTALS_ENTRY,
    module: './RentalsMfe',
  },
  {
    name: 'docs',
    label: 'Documentation',
    icon: 'ExternalLink',
    externalUrl: 'https://docs.example.com',
    entry: '',
    module: '',
  },
  {
    name: 'broken',
    label: 'Broken',
    icon: 'AlertTriangle',
    path: '/broken',
    entry: 'http://localhost:9999/remoteEntry.js',
    module: './BrokenMfe',
  },
];
