import type { VehicleRef } from '../domain.types';
import type { SliceDescriptor } from '../shell-api.types';

export interface FleetSlice {
  selectedVehicle: VehicleRef | null;
  filters: Record<string, string>;
}

export const FLEET_SLICE = {
  name: 'fleet',
  initialState: { selectedVehicle: null, filters: {} },
} as const satisfies SliceDescriptor<FleetSlice>;
