import type { VehicleRef } from '../domain.types';
import type { SliceDescriptor } from '../shell-api.types';

export interface FleetSlice {
  selectedVehicle: VehicleRef | null;
}

export const FLEET_SLICE = {
  name: 'fleet',
  initialState: { selectedVehicle: null },
} as const satisfies SliceDescriptor<FleetSlice>;
