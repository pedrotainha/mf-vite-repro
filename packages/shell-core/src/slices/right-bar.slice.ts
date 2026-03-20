import type { SliceFactory } from '../types';

import type { RightBarRequest, RightBarStackItem, RightBarState } from '@-label-/contracts';

export interface RightBarSliceState {
  rightBar: RightBarState;
  openPanel: (request: RightBarRequest) => void;
  closePanel: () => void;
  updatePanelPayload: (payload: Record<string, unknown>) => void;
}

export const rightBarSlice: SliceFactory<RightBarSliceState> = set => ({
  rightBar: { isOpen: false, stack: [] },
  openPanel: (request: RightBarRequest) =>
    set((state: RightBarSliceState) => ({
      rightBar: {
        isOpen: true,
        stack: [...state.rightBar.stack, { panelId: request.panelId, payload: request.payload ?? {} } satisfies RightBarStackItem],
      },
    })),
  closePanel: () =>
    set((state: RightBarSliceState) => {
      const newStack = state.rightBar.stack.slice(0, -1);
      return {
        rightBar: {
          isOpen: newStack.length > 0,
          stack: newStack,
        },
      };
    }),
  updatePanelPayload: (payload: Record<string, unknown>) =>
    set((state: RightBarSliceState) => {
      const stack = [...state.rightBar.stack];
      const top = stack.at(-1);
      if (!top) return {};
      stack[stack.length - 1] = { panelId: top.panelId, payload: { ...top.payload, ...payload } };
      return { rightBar: { ...state.rightBar, stack } };
    }),
});
