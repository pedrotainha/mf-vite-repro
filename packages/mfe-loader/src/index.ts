import { type ComponentType, lazy } from 'react';
import { init, loadRemote, registerRemotes } from '@module-federation/runtime';

import type { MfeConfigEntry } from '@-label-/contracts';

/**
 * Initialize the Module Federation runtime.
 * Must be called once before any loadRemote calls.
 */
export const initFederation = (options: { name: string }) => {
  init({
    name: options.name,
    remotes: [],
  });
};

/**
 * Register remotes from MFE config entries.
 * Converts MfeConfigEntry[] to the format expected by @module-federation/runtime.
 */
export const registerMfeRemotes = (configs: MfeConfigEntry[]) => {
  const remotes = configs.map(config => ({
    entry: config.entry,
    name: config.name,
    type: 'module' as const,
  }));

  registerRemotes(remotes);
};

/**
 * Lazy load a remote component for use with React.Suspense.
 * Caches by remoteName::moduleName to prevent duplicate fetches.
 */
const componentCache = new Map<string, React.LazyExoticComponent<ComponentType>>();

export const lazyRemoteComponent = (options: { remoteName: string; moduleName: string }): React.LazyExoticComponent<ComponentType> => {
  const cacheKey = `${options.remoteName}::${options.moduleName}`;

  const cached = componentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const LazyComponent = lazy(async () => {
    const module = await loadRemote<{ default: ComponentType }>(`${options.remoteName}/${options.moduleName.replace('./', '')}`);

    if (!module) {
      throw new Error(`Failed to load remote module: ${options.remoteName}/${options.moduleName}`);
    }

    return { default: module.default };
  });

  componentCache.set(cacheKey, LazyComponent);
  return LazyComponent;
};
