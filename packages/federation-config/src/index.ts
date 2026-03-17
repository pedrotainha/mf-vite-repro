import fs from 'node:fs';
import path from 'node:path';

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface SharedConfigEntry {
  requiredVersion: string;
  singleton: boolean;
}

export type SharedConfig = Record<string, SharedConfigEntry>;

export interface GenerateSharedOptions {
  cwd: string;
  maxDepth?: number;
  includePeerDependencies?: boolean;
  singletonDependencies?: readonly string[];
  /**
   * Prefixes that force singleton behaviour.
   * Any dependency whose name starts with one of these prefixes is treated as a
   * singleton: at runtime the remote always accepts whatever version the host
   * provides, avoiding duplicate module instances.
   *
   * To enforce true singleton behaviour we set `requiredVersion: "*"` for these
   * packages, which makes the runtime's semver check always pass — the remote
   * will use the host's instance regardless of version drift.
   *
   * @default `["@-label-/ui-"]` — all `@-label-/ui-internal-*` packages are singletons
   * so that design-system state (theme, toasts, dialogs) is shared across host and remotes.
   */
  singletonPrefixes?: readonly string[];
  ignore?: readonly string[];
}

const DEFAULT_MAX_DEPTH = 3;

const DEFAULT_SINGLETONS = new Set(['react', 'react-dom', 'zustand']);

const DEFAULT_SINGLETON_PREFIXES = ['@-label-/ui-'];

const readJsonFile = (filePath: string): PackageJson => {
  const contents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(contents) as PackageJson;
};

/**
 * Walks up the directory tree from `startDirectory` to find the nearest
 * installed `node_modules/<depName>/package.json`.
 */
const findInstalledPackageJson = (startDirectory: string, depName: string): string | null => {
  const fsRoot = path.parse(startDirectory).root;
  let currentDirectory = path.resolve(startDirectory);

  while (currentDirectory !== fsRoot) {
    const candidate = path.join(currentDirectory, 'node_modules', depName, 'package.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    currentDirectory = path.dirname(currentDirectory);
  }

  return null;
};

const checkIsSingleton = (depName: string, singletons: Set<string>, prefixes: readonly string[]): boolean =>
  singletons.has(depName) || prefixes.some(p => depName.startsWith(p));

const collectDeps = (
  packageJsonPath: string,
  originalCwd: string,
  shared: SharedConfig,
  seen: Set<string>,
  options: {
    depth: number;
    maxDepth: number;
    includePeerDependencies: boolean;
    singletons: Set<string>;
    singletonPrefixes: readonly string[];
    ignore: Set<string>;
  },
): void => {
  const packageData = readJsonFile(packageJsonPath);

  const deps: Record<string, string> = {
    ...packageData.dependencies,
    ...(options.includePeerDependencies ? packageData.peerDependencies : {}),
  };

  for (const depName of Object.keys(deps)) {
    if (seen.has(depName) || options.ignore.has(depName)) {
      continue;
    }

    // Skip @types/* packages — they are type-only and have no runtime exports.
    // Sharing them causes build errors with @module-federation/vite (rolldown
    // cannot resolve their package exports under browser/module conditions).
    if (depName.startsWith('@types/')) {
      continue;
    }

    seen.add(depName);

    // Try resolving from the parent package's directory first (handles file-linked
    // packages whose transitive deps live in the pnpm store alongside them), then
    // fall back to the original app directory for direct/hoisted deps.
    const parentDirectory = path.dirname(packageJsonPath);
    const resolvedPath = findInstalledPackageJson(parentDirectory, depName) ?? findInstalledPackageJson(originalCwd, depName);
    if (!resolvedPath) {
      continue;
    }

    const resolvedPackage = readJsonFile(resolvedPath);
    if (!resolvedPackage.version) {
      continue;
    }

    const forceSingleton = checkIsSingleton(depName, options.singletons, options.singletonPrefixes);

    shared[depName] = {
      // Singletons use "*" so the remote always accepts the host's version,
      // avoiding duplicate module instances when versions drift between builds.
      requiredVersion: forceSingleton ? '*' : `^${resolvedPackage.version}`,
      singleton: forceSingleton,
    };

    if (options.depth < options.maxDepth) {
      collectDeps(resolvedPath, originalCwd, shared, seen, {
        ...options,
        depth: options.depth + 1,
      });
    }
  }
};

export const generateShared = (options: GenerateSharedOptions): SharedConfig => {
  const shared: SharedConfig = {};
  const packageJsonPath = path.join(options.cwd, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return shared;
  }

  collectDeps(packageJsonPath, options.cwd, shared, new Set<string>(), {
    depth: 0,
    maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
    includePeerDependencies: options.includePeerDependencies ?? true,
    singletons: new Set(options.singletonDependencies ?? DEFAULT_SINGLETONS),
    singletonPrefixes: options.singletonPrefixes ?? DEFAULT_SINGLETON_PREFIXES,
    ignore: new Set(options.ignore),
  });

  return shared;
};
