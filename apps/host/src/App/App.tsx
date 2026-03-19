import { type JSX, Suspense, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router';

import Layout from '../Layout/Layout';
import { MfeErrorBoundary } from '../MfeErrorBoundary/MfeErrorBoundary';
import Home from '../pages/Home/Home';
import NotFound from '../pages/NotFound/NotFound';
import { ShellApiProvider, useShellApi } from '../shell/ShellApiProvider/ShellApiProvider';

import type { MfeConfigEntry, ShellApi } from '@-label-/contracts';
import { initFederation, lazyRemoteComponent, registerMfeRemotes } from '@-label-/mfe-loader';

initFederation({ name: 'host' });

/**
 * Recursively flattens submenu entries into routable configs.
 * Only entries with a `path` and `entry` (real MFE) are included.
 */
const flattenRoutableConfigs = (configs: MfeConfigEntry[]): MfeConfigEntry[] => {
  const result: MfeConfigEntry[] = [];
  for (const config of configs) {
    if (config.path && config.entry) {
      result.push(config);
    }
    if (config.submenu) {
      result.push(...flattenRoutableConfigs(config.submenu));
    }
  }
  return result;
};

/**
 * Pre-created lazy component cache, keyed by "remoteName::moduleName".
 * Components are created once when routes are built, not during render.
 */
interface MfeProps {
  shellApi?: ShellApi;
}

const lazyComponentCache = new Map<string, React.LazyExoticComponent<React.ComponentType<MfeProps>>>();

const getOrCreateLazy = (remoteName: string, moduleName: string): React.LazyExoticComponent<React.ComponentType<MfeProps>> => {
  const key = `${remoteName}::${moduleName}`;
  const cached = lazyComponentCache.get(key);
  if (cached) return cached;
  const component = lazyRemoteComponent<MfeProps>({ moduleName, remoteName });
  lazyComponentCache.set(key, component);
  return component;
};

const RemoteSlot = ({
  component,
  displayName,
}: {
  component: React.LazyExoticComponent<React.ComponentType<MfeProps>>;
  displayName: string;
}): JSX.Element => {
  const shellApi = useShellApi();
  const Component = component;
  return (
    <MfeErrorBoundary name={displayName}>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading {displayName}...</p>}>
        <Component shellApi={shellApi} />
      </Suspense>
    </MfeErrorBoundary>
  );
};

const buildChildRoutes = (config: MfeConfigEntry): JSX.Element[] => {
  if (!config.children) return [];

  return config.children.map(child => {
    const Lazy = getOrCreateLazy(config.name, child.module);
    const name = config.label ?? config.name;
    return <Route element={<RemoteSlot component={Lazy} displayName={name} />} key={child.path} path={child.path} />;
  });
};

const App = (): JSX.Element => {
  const [mfes, setMfes] = useState<MfeConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMfes = async () => {
      try {
        const response = await fetch('/api/mfes');
        const config: MfeConfigEntry[] = await response.json();

        const remoteConfigs = flattenRoutableConfigs(config).filter(c => c.entry);
        registerMfeRemotes(remoteConfigs);

        setMfes(config);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to load MFE config');
      } finally {
        setLoading(false);
      }
    };

    void loadMfes();
  }, []);

  if (loading) {
    return <div data-testid="host-loading">Loading MFE configuration...</div>;
  }

  if (error) {
    return <div data-testid="host-error">Error: {error}</div>;
  }

  const routableConfigs = flattenRoutableConfigs(mfes);

  return (
    <ShellApiProvider>
      <Routes>
        <Route element={<Layout mfes={mfes} />}>
          <Route element={<Home />} index />
          {routableConfigs.map(config => {
            const hasChildren = config.children && config.children.length > 0;
            const Lazy = getOrCreateLazy(config.name, config.module);
            const name = config.label ?? config.name.charAt(0).toUpperCase() + config.name.slice(1);
            return (
              <Route key={config.path} path={config.path ? config.path.slice(1) + '/*' : undefined}>
                <Route element={<RemoteSlot component={Lazy} displayName={name} />} index />
                {hasChildren ? buildChildRoutes(config) : null}
              </Route>
            );
          })}
          <Route element={<NotFound />} path="*" />
        </Route>
      </Routes>
    </ShellApiProvider>
  );
};

export default App;
