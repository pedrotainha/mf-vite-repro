# Shared deps with `import: "path"` are ignored — transitive workspace deps fail under pnpm strict mode

## Description

When a shared dependency is **not directly resolvable** from the consuming app's `node_modules/` (e.g. a transitive workspace dep under pnpm strict mode), both build and dev modes fail because the plugin cannot locate the package.

The `shared` config accepts an `import` field (typed as `SharedConfig['import']`), which in webpack's Module Federation allows specifying the path to the module entry. However, `@module-federation/vite` only checks `import: false` (to throw "must be provided by host"). When `import` is a string path, it is **stored in the normalized config but never consumed** — the plugin always falls back to `getPreBuildLibImportId(pkg)` which cannot resolve the package.

## Reproduction

Minimal repro: https://github.com/<!-- REPO URL HERE -->

```bash
git clone <repro-url>
cd mf-vite-repro
pnpm install
pnpm run build:packages
pnpm run build:remote    # fails
cd apps/remote && npx vite  # also fails
```

### Monorepo structure

```text
packages/
  pkg-b/    → workspace package, no deps, has dist/ (tsup build)
  pkg-a/    → workspace package, depends on @repro/pkg-b
apps/
  remote/   → depends on @repro/pkg-a (direct dep)
              does NOT have @repro/pkg-b in its own node_modules (pnpm strict)
  host/     → depends on both pkg-a and pkg-b
```

### Shared config in remote's vite.config.ts

```ts
shared: {
  react: { singleton: true, requiredVersion: '*' },
  'react-dom': { singleton: true, requiredVersion: '*' },
  '@repro/pkg-a': { requiredVersion: '^1.0.0' },
  '@repro/pkg-b': { requiredVersion: '^1.0.0' },  // transitive — not in remote/node_modules/
}
```

### Build mode error

```text
[UNLOADABLE_DEPENDENCY] Error: Could not load @repro/pkg-b
  No such file or directory (os error 2)
```

The `writeLoadShareModule` function generates a virtual `.mjs` file that does `import * as __mf_prebuild_ns__ from "__mf__virtual/remote__prebuild__...pkg_b..."`. Rolldown tries to resolve `@repro/pkg-b` but it's not in `remote/node_modules/`.

### Dev mode error

```text
TypeError: Cannot read properties of null (reading 'id')
    at .../node_modules/@module-federation/vite/lib/index.mjs:1975:80
    at async ResolveIdContext.customResolver (...)
```

The dev server crashes on startup when the `customResolver` tries to resolve the shared dep and `this.resolve()` returns `null`.

## Expected behaviour

The `import` field in the shared config should accept a string path and use it as the resolution target:

```ts
shared: {
  '@repro/pkg-b': {
    requiredVersion: '^1.0.0',
    import: '/absolute/path/to/packages/pkg-b/dist/index.js',
  },
}
```

When `import` is a path, the plugin should:
1. Use it in `writeLoadShareModule` instead of `getPreBuildLibImportId(pkg)`
2. Use it in the dev server's `customResolver` to resolve the module
3. Use it in the remoteEntry `importMap` instead of `getPreBuildLibImportId(pkg)`

This would allow tools like `generateShared` helpers to collect transitive deps and provide their real paths, making pnpm strict mode fully compatible with Module Federation shared deps.

## Current behaviour of `import` field

| Location in plugin | `import: false` | `import: "path"` |
|---|:---:|:---:|
| `normalizeShareItem` (~line 698) | stored | stored |
| remoteEntry `importMap` (~line 1225) | throws "must be provided by host" | **ignored** — uses `getPreBuildLibImportId` |
| remoteEntry `usedShared.get` (~line 1244) | throws error | **ignored** |
| `writeLoadShareModule` (~line 1123) | **not checked** | **not checked** |
| dev `customResolver` (~line 1975) | **not checked** | **not checked** |

## Workarounds

- **Add the transitive dep as a direct dependency** of the remote app — works but defeats the purpose of automatic transitive dep collection and is error-prone at scale.
- **Use `resolve.alias`** in Vite config — the plugin detects the alias conflict with the shared module and crashes with a different error.
- **Use `import: false`** — works but requires the host to always provide the dep. If the host doesn't have it, the error is only visible at runtime.

## Environment

- `@module-federation/vite`: 1.13.1
- `vite`: 8.0.1
- `rolldown`: 1.0.0-rc.10
- `pnpm`: 10.12.1
- `node`: 24.14.0
