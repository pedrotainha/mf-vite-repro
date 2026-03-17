import type { SharedConfig } from '@module-federation/vite';
import { readFileSync } from 'node:fs';

interface GenerateSharedOptions {
  packageJsonPath: string;
  singletonPrefixes?: string[];
  ignore?: string[];
}

const DEFAULT_SINGLETONS = new Set(['react', 'react-dom', 'zustand']);

/**
 * Generate shared dependency configuration for @module-federation/vite.
 * Reads package.json dependencies and marks singletons appropriately.
 */
export const generateShared = (options: GenerateSharedOptions): SharedConfig => {
  const { packageJsonPath, singletonPrefixes = [], ignore = [] } = options;

  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent) as {
    dependencies?: Record<string, string>;
  };

  const deps = packageJson.dependencies ?? {};
  const shared: SharedConfig = {};

  const ignoredPackages = new Set(['@module-federation/vite', '@module-federation/runtime', ...ignore]);

  for (const [name, version] of Object.entries(deps)) {
    if (ignoredPackages.has(name)) {
      continue;
    }

    if (name.startsWith('@types/')) {
      continue;
    }

    // Skip workspace packages — they should be bundled, not shared
    if (version === 'workspace:*' || version.startsWith('workspace:')) {
      continue;
    }

    const isSingleton = DEFAULT_SINGLETONS.has(name) || singletonPrefixes.some(prefix => name.startsWith(prefix));

    shared[name] = {
      singleton: isSingleton,
      requiredVersion: isSingleton ? false : version,
    };
  }

  return shared;
};
