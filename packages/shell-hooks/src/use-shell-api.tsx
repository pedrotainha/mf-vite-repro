import { createContext, use, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { setShellStoreInstance, useShellStore } from './use-shell-store';

import type { ShellApi } from '@-label-/contracts';
import type { ShellStore } from '@-label-/shell-core';
import { createShellApi } from '@-label-/shell-core';

const ShellApiContext = createContext<ShellApi | null>(null);

interface NavigationSliceState {
  setNavigate: (navigateFunction: (path: string) => void) => void;
}

export const ShellApiProvider = ({ children, store }: { children: React.ReactNode; store: ShellStore }): React.JSX.Element => {
  // Set the module-level store reference so useShellStore works
  useMemo(() => setShellStoreInstance(store), [store]);

  const navigate = useNavigate();
  const setNavigate = useShellStore(s => (s as unknown as NavigationSliceState).setNavigate);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  const shellApi = useMemo(() => createShellApi(store), [store]);

  return <ShellApiContext value={shellApi}>{children}</ShellApiContext>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider intentionally
export const useShellApi = (): ShellApi => {
  const api = use(ShellApiContext);
  if (!api) throw new Error('useShellApi must be used within ShellApiProvider');
  return api;
};
