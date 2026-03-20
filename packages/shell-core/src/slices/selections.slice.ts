import type { SliceFactory } from '../types';

import type { SelectionsState, VehicleRef } from '@-label-/contracts';

export interface SelectionsSliceState {
  selections: SelectionsState;
  completeVehicleSelection: (vehicle: VehicleRef) => void;
  clearVehicleSelection: () => void;
}

export const selectionsSlice: SliceFactory<SelectionsSliceState> = set => ({
  selections: { vehicleSelection: null },
  completeVehicleSelection: (vehicle: VehicleRef) => set(() => ({ selections: { vehicleSelection: vehicle } })),
  clearVehicleSelection: () => set(() => ({ selections: { vehicleSelection: null } })),
});
