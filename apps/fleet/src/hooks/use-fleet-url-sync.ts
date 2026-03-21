import { useEffect } from 'react';
import { useSearchParams } from 'react-router';

import type { FleetFilters } from '../store/fleet-filter-schema';
import { fleetFilterSchema } from '../store/fleet-filter-schema';
import { useFleetStore } from '../store/fleet-store';

const PREFIX = 'fleet';

const readFiltersFromUrl = (searchParams: URLSearchParams): FleetFilters => {
  const raw = {
    status: searchParams.get(`${PREFIX}.status`) ?? undefined,
    type: searchParams.get(`${PREFIX}.type`) ?? undefined,
    search: searchParams.get(`${PREFIX}.search`) ?? undefined,
  };

  const result = fleetFilterSchema.safeParse(raw);
  return result.success ? result.data : fleetFilterSchema.parse({});
};

const writeFiltersToUrl = (filters: FleetFilters, setSearchParams: ReturnType<typeof useSearchParams>[1]) => {
  setSearchParams(
    previous => {
      const next = new URLSearchParams(previous);

      for (const key of ['status', 'type', 'search'] as const) {
        const prefixedKey = `${PREFIX}.${key}`;
        if (filters[key]) {
          next.set(prefixedKey, filters[key]);
        } else {
          next.delete(prefixedKey);
        }
      }

      return next;
    },
    { replace: false },
  );
};

/**
 * Syncs fleet filters between URL (source of truth) and Zustand store (mirror).
 *
 * - URL → store on every URL change (back button, deep link, user interaction)
 * - Store actions write to URL via push (creates history entries)
 * - Zod validates URL params before applying to store
 */
export const useFleetUrlSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const setFilters = useFleetStore(s => s.setFilters);

  // URL → store: sync on every searchParams change
  useEffect(() => {
    const filters = readFiltersFromUrl(searchParams);
    setFilters(filters);
  }, [searchParams, setFilters]);

  return {
    setStatusFilter: (status: FleetFilters['status']) => {
      const current = readFiltersFromUrl(searchParams);
      writeFiltersToUrl({ ...current, status }, setSearchParams);
    },
    setTypeFilter: (type: FleetFilters['type']) => {
      const current = readFiltersFromUrl(searchParams);
      writeFiltersToUrl({ ...current, type }, setSearchParams);
    },
    setSearch: (search: string) => {
      const current = readFiltersFromUrl(searchParams);
      writeFiltersToUrl({ ...current, search }, setSearchParams);
    },
    clearFilters: () => {
      setSearchParams(
        previous => {
          const next = new URLSearchParams(previous);
          next.delete(`${PREFIX}.status`);
          next.delete(`${PREFIX}.type`);
          next.delete(`${PREFIX}.search`);
          return next;
        },
        { replace: false },
      );
    },
  };
};
