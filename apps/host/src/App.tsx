import { Suspense, useEffect, useState } from 'react';

import type { MfeConfigEntry } from '@-label-/contracts';
import { initFederation, lazyRemoteComponent, registerMfeRemotes } from '@-label-/mfe-loader';

initFederation({ name: 'host' });

const App = () => {
  const [mfes, setMfes] = useState<MfeConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMfes = async () => {
      try {
        const response = await fetch('/api/mfes');
        const config: MfeConfigEntry[] = await response.json();
        registerMfeRemotes(config);
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

  return (
    <div data-testid="host-app">
      <header>
        <h1>Host Application</h1>
      </header>
      <main>
        {mfes.map(mfe => {
          const RemoteComponent = lazyRemoteComponent({
            moduleName: mfe.module,
            remoteName: mfe.name,
          });

          return (
            <Suspense fallback={<div>Loading {mfe.label ?? mfe.name}...</div>} key={mfe.name}>
              <RemoteComponent />
            </Suspense>
          );
        })}
      </main>
    </div>
  );
};

export default App;
