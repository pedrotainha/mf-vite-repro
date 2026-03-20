import { config } from '../../config';

import { createShellStore, navigationSlice, rightBarSlice, selectionsSlice } from '@-label-/shell-core';

export const shellStore = createShellStore({
  slices: { rightBar: rightBarSlice, selections: selectionsSlice, navigation: navigationSlice },
  devtools: { enabled: config.ENABLE_STORE_DEVTOOLS === 'true', name: 'shell-store' },
});
