import { shellStore } from '../shell-store/shell-store';

import { ShellApiProvider as Provider } from '@-label-/shell-hooks';

// Expose shell store on window for E2E testing (dev only — tree-shaken in prod by vite)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__shellStore__ = shellStore;
}

export const ShellApiProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  return <Provider store={shellStore}>{children}</Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- re-export hook co-located with provider
export { useShellApi } from '@-label-/shell-hooks';
