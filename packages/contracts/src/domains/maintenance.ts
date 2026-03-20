import type { SliceDescriptor } from '../shell-api.types';

export interface MaintenanceSlice {
  activeWorkOrder: null;
}

export const MAINTENANCE_SLICE = {
  name: 'maintenance',
  initialState: { activeWorkOrder: null },
} as const satisfies SliceDescriptor<MaintenanceSlice>;
