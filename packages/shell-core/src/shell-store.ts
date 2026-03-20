import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

import type { DynamicSlicesState, SliceFactory } from './types';

import type { SliceDescriptor } from '@-label-/contracts';

export interface CreateShellStoreOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accepts any slice factory regardless of state shape
  slices?: Record<string, SliceFactory<any>>;
  devtools?: { enabled: boolean; name: string };
}

export type ShellStore = ReturnType<typeof createShellStore>;

export const createShellStore = (options: CreateShellStoreOptions = {}) => {
  const { slices: sliceFactories = {}, devtools: devtoolsOptions } = options;

  return createStore<DynamicSlicesState & Record<string, unknown>>()(
    devtools(
      subscribeWithSelector((set, get) => {
        // Build host slices from factories
        const hostSliceState: Record<string, unknown> = {};
        for (const factory of Object.values(sliceFactories)) {
          Object.assign(hostSliceState, factory(set, get));
        }

        return {
          // Dynamic slice registry
          dynamicSlices: {} as Record<string, unknown>,
          sliceRefs: {} as Record<string, { refCount: number }>,

          registerSlice: <T>(descriptor: SliceDescriptor<T>) => {
            set(
              (state: DynamicSlicesState) => {
                const existing = state.sliceRefs[descriptor.name];
                if (existing) {
                  return {
                    sliceRefs: {
                      ...state.sliceRefs,
                      [descriptor.name]: { refCount: existing.refCount + 1 },
                    },
                  };
                }
                return {
                  dynamicSlices: {
                    ...state.dynamicSlices,
                    [descriptor.name]: descriptor.initialState,
                  },
                  sliceRefs: {
                    ...state.sliceRefs,
                    [descriptor.name]: { refCount: 1 },
                  },
                };
              },
              undefined,
              `slices/register:${descriptor.name}`,
            );
          },

          unregisterSlice: (name: string) => {
            set(
              (state: DynamicSlicesState) => {
                const existing = state.sliceRefs[name];
                if (!existing) return {};
                if (existing.refCount > 1) {
                  return {
                    sliceRefs: {
                      ...state.sliceRefs,
                      [name]: { refCount: existing.refCount - 1 },
                    },
                  };
                }
                const { [name]: removedSlice, ...remainingSlices } = state.dynamicSlices;
                const { [name]: removedReference, ...remainingReferences } = state.sliceRefs;
                void removedSlice;
                void removedReference;
                return {
                  dynamicSlices: remainingSlices,
                  sliceRefs: remainingReferences,
                };
              },
              undefined,
              `slices/unregister:${name}`,
            );
          },

          getSliceState: <T>(name: string): T | undefined => {
            return get().dynamicSlices[name] as T | undefined;
          },

          setSliceState: <T>(name: string, partial: Partial<T>) => {
            set(
              (state: DynamicSlicesState) => {
                const current = state.dynamicSlices[name];
                if (current === undefined) return {};
                return {
                  dynamicSlices: {
                    ...state.dynamicSlices,
                    [name]: { ...(current as Record<string, unknown>), ...partial },
                  },
                };
              },
              undefined,
              `slices/setState:${name}`,
            );
          },

          // Host slices
          ...hostSliceState,
        };
      }),
      {
        name: devtoolsOptions?.name ?? 'shell-store',
        enabled: devtoolsOptions?.enabled ?? false,
      },
    ),
  );
};

/**
 * Subscribe to changes in a specific dynamic slice.
 * Returns an unsubscribe function.
 * Uses Zustand's subscribeWithSelector under the hood.
 */
export const onSliceChange = <T>(store: ShellStore, name: string, listener: (state: T) => void): (() => void) => {
  return store.subscribe((state: DynamicSlicesState) => state.dynamicSlices[name] as T, listener);
};
