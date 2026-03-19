import { createContext, use, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { createShellApi, useShellStore } from '../shell-store/shell-store';

import type { ShellApi } from '@-label-/contracts';

const ShellApiContext = createContext<ShellApi | null>(null);

export const ShellApiProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const navigate = useNavigate();
  const setNavigate = useShellStore(s => s.setNavigate);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  const shellApi = useMemo(() => createShellApi(), []);

  return <ShellApiContext value={shellApi}>{children}</ShellApiContext>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider intentionally
export const useShellApi = (): ShellApi => {
  const api = use(ShellApiContext);
  if (!api) throw new Error('useShellApi must be used within ShellApiProvider');
  return api;
};
