import { useShellStore } from './use-shell-store';

import type { DynamicSlicesState } from '@-label-/shell-core';

export const useSlice = <T>(descriptor: { name: string }): T | undefined => {
  return useShellStore((s: DynamicSlicesState) => s.dynamicSlices[descriptor.name] as T | undefined);
};
