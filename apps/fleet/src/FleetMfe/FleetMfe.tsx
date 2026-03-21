import { useEffect, useMemo } from 'react';

import { createVehicleColumns } from '../components/vehicle-columns/vehicle-columns';
import { VehicleFilters } from '../components/VehicleFilters/VehicleFilters';
import { VehicleTable } from '../components/VehicleTable/VehicleTable';
import { config } from '../config';
import { useFleetUrlSync } from '../hooks/use-fleet-url-sync';
import { useFleetStore } from '../store/fleet-store';

import '../msw-init';
import type { ListVehiclesParams } from '@-label-/client-fleet';
import { configureClient, useListVehicles } from '@-label-/client-fleet';
import type { ShellApi } from '@-label-/contracts';
import { FLEET_SLICE } from '@-label-/contracts';

configureClient({ baseURL: config.API_BASE_URL });

interface Props {
  shellApi?: ShellApi;
}

const FleetMfe = ({ shellApi }: Props) => {
  useEffect(() => {
    shellApi?.registerSlice(FLEET_SLICE);
    return () => shellApi?.unregisterSlice(FLEET_SLICE.name);
  }, [shellApi]);

  const { setStatusFilter, setTypeFilter, setSearch, clearFilters } = useFleetUrlSync();
  const filters = useFleetStore(s => ({ status: s.status, type: s.type, search: s.search }));

  const queryParams: ListVehiclesParams = useMemo(() => {
    const parameters: ListVehiclesParams = {};
    if (filters.status) parameters.status = filters.status;
    if (filters.type) parameters.type = filters.type;
    if (filters.search) parameters.search = filters.search;
    return parameters;
  }, [filters.status, filters.type, filters.search]);

  const { data: vehicles, isLoading, isError } = useListVehicles(queryParams);

  const columns = useMemo(() => createVehicleColumns(shellApi), [shellApi]);

  if (isError) {
    return (
      <div data-testid="fleet-mfe">
        <p className="text-destructive">Failed to load vehicles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="fleet-mfe">
      <VehicleFilters
        filters={filters}
        onClear={clearFilters}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
      />
      {isLoading ? <p>Loading vehicles...</p> : <VehicleTable columns={columns} data={vehicles ?? []} />}
    </div>
  );
};

export default FleetMfe;
