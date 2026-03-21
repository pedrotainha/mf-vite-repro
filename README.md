# Bug Repro: @module-federation/vite fails with transitive workspace deps (pnpm strict mode)

## Problem

When using `@module-federation/vite` in a **pnpm monorepo**, a remote app that declares a transitive workspace dependency in the `shared` config fails in **both build and dev mode** because the federation plugin cannot resolve the package.

**pnpm strict mode** does not make transitive dependencies available in the consuming app's `node_modules/`. The federation plugin tries to resolve the transitive dep (to generate a `loadShare` wrapper) and fails.

## Structure

```text
packages/
  pkg-b/          # workspace package, no deps
  pkg-a/          # workspace package, depends on pkg-b
apps/
  remote/         # depends on pkg-a (direct), NOT pkg-b
  host/           # depends on both pkg-a and pkg-b
```

The `remote` app has `@repro/pkg-a` in its dependencies. `pkg-a` depends on `@repro/pkg-b`. The `shared` config for the remote includes both `@repro/pkg-a` and `@repro/pkg-b`.

Under pnpm strict mode, `@repro/pkg-b` is NOT in `remote/node_modules/` — it's only in `pkg-a/node_modules/`. The federation plugin's `loadShare` wrapper generation fails because it cannot resolve `@repro/pkg-b` from the remote app's context.

## Reproduce

```bash
pnpm install
pnpm run build:packages
pnpm run build:remote   # <-- fails
```

### Build mode error

```text
[UNLOADABLE_DEPENDENCY] Error: Could not load @repro/pkg-b
  No such file or directory (os error 2)
```

The `writeLoadShareModule` function generates a virtual module that tries to import `@repro/pkg-b`, but rolldown cannot resolve it because it's not in `remote/node_modules/`.

### Dev mode error

```bash
cd apps/remote && npx vite   # <-- crashes
```

```text
TypeError: Cannot read properties of null (reading 'id')
    at .../node_modules/@module-federation/vite/lib/index.mjs:1975:80
    at async ResolveIdContext.customResolver (...)
```

The dev server crashes during startup when the plugin's `customResolver` tries to resolve the transitive dep and gets `null`.

## Expected

The `shared` config's `import` field should allow specifying the path to the package entry, so the plugin can resolve it regardless of pnpm's strict node_modules structure.

```js
shared: {
  '@repro/pkg-b': {
    requiredVersion: '^1.0.0',
    import: '/absolute/path/to/pkg-b/dist/index.js',
  },
}
```

Currently, `import: false` (host-must-provide) is the only value that is actually checked. `import: "path"` is accepted in the TypeScript type but never consumed by the `writeLoadShareModule` function or the dev server's `customResolver`.

### Where `import` is used vs ignored

| Location | `import: false` | `import: "path"` |
|----------|:-:|:-:|
| `normalizeShareItem` (line ~698) | stored | stored |
| remoteEntry `importMap` (line ~1225) | throws error | **ignored** (uses `getPreBuildLibImportId`) |
| remoteEntry `usedShared.get` (line ~1244) | throws error | **ignored** |
| `writeLoadShareModule` (line ~1123) | **not checked** | **not checked** |
| dev server `customResolver` (line ~1975) | **not checked** | **not checked** |

## Environment

- Node: 24
- pnpm: 10
- Vite: 8.0.1
- @module-federation/vite: 1.13.1
- rolldown: 1.0.0-rc.10
