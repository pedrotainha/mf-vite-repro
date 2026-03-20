import type { SliceDescriptor } from '../shell-api.types';

export interface RentalsSlice {
  activeBooking: null;
}

export const RENTALS_SLICE = {
  name: 'rentals',
  initialState: { activeBooking: null },
} as const satisfies SliceDescriptor<RentalsSlice>;
