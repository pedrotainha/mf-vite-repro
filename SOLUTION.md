# Fix: add new `path` property to shared config

## Approach

This fix adds a **new property** `path` to the shared config, dedicated to providing
the real filesystem path for shared deps that are not directly resolvable from the
app's `node_modules/` (e.g. transitive workspace deps under pnpm strict mode).

This separates concerns from the existing `import` field:
- `import: false` — "don't load locally, host must provide" (existing, unchanged)
- `path: "/abs/path/to/dist/index.js"` — "resolve from this path" (new)

## Changes to the plugin (patch)

### `writeLoadShareModule` function

When `shareItem.shareConfig.path` is a string:
- Use it as `providerImportId` instead of `getLocalProviderImportPath(pkg) || getPreBuildLibImportId(pkg)`
- Pass it to `getPackageNamedExports()` so the plugin can extract named exports from the real entry file
- Use it in the generated virtual module's import statement

### `localSharedImportMap` (remoteEntry)

When `shareItem.shareConfig.path` is a string:
- Use it as the import path in the generated `importMap` instead of `getPreBuildLibImportId(pkg)`

### `customResolver` (dev mode)

When `shareItem.shareConfig.path` is a string:
- Resolve from the provided path instead of the package name
- Add null check for `this.resolve()` result to prevent crash

## Usage

```ts
shared: {
  '@repro/pkg-b': {
    requiredVersion: '^1.0.0',
    path: resolve(__dirname, '../../packages/pkg-b/dist/index.js'),
  },
}
```

## Trade-offs

**Pros:**
- Clean separation: `import` controls loading behaviour, `path` controls resolution
- No overloading of existing field semantics
- Clear intent — `path` is a resolution hint, not a behavioural flag

**Cons:**
- New API surface on the shared config
- Requires TypeScript type extension (or `as any` cast until upstream adopts)
- Absolute paths are environment-dependent
