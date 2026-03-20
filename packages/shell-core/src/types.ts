import type { SliceDescriptor } from '@-label-/contracts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic store state for slice factories
export type SliceFactory<T = Record<string, unknown>> = (set: (function_: (state: any) => any) => void, get: () => any) => T;

export interface DynamicSlicesState {
  dynamicSlices: Record<string, unknown>;
  sliceRefs: Record<string, { refCount: number }>;
  registerSlice: <T>(descriptor: SliceDescriptor<T>) => void;
  unregisterSlice: (name: string) => void;
  getSliceState: <T>(name: string) => T | undefined;
  setSliceState: <T>(name: string, partial: Partial<T>) => void;
}

export { type SliceDescriptor } from '@-label-/contracts';
