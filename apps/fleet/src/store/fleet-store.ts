import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { FleetFilters } from './fleet-filter-schema';
import { FLEET_FILTER_DEFAULTS } from './fleet-filter-schema';

interface FleetStoreState extends FleetFilters {
  setStatusFilter: (status: FleetFilters['status']) => void;
  setTypeFilter: (type: FleetFilters['type']) => void;
  setSearch: (search: string) => void;
  clearFilters: () => void;
  setFilters: (filters: FleetFilters) => void;
}

export const useFleetStore = create<FleetStoreState>()(
  devtools(
    set => ({
      ...FLEET_FILTER_DEFAULTS,

      setStatusFilter: status => set({ status }, false, 'fleet/setStatusFilter'),

      setTypeFilter: type => set({ type }, false, 'fleet/setTypeFilter'),

      setSearch: search => set({ search }, false, 'fleet/setSearch'),

      clearFilters: () => set(FLEET_FILTER_DEFAULTS, false, 'fleet/clearFilters'),

      setFilters: filters => set(filters, false, 'fleet/setFilters'),
    }),
    { name: 'fleet-store' },
  ),
);
