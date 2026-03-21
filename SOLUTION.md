# Fix: use existing `import` field as resolution path

## Approach

This fix reuses the existing `import` field in the shared config (already part of the
TypeScript type) to provide the real path for shared deps that are not directly resolvable
from the app's `node_modules/`.

The `import` field already supports `false` (meaning "host must provide"). This fix extends
it to also support a string path, which tells the plugin where to find the module's entry file.

## Changes to the plugin (patch)

### `writeLoadShareModule` function

When `shareItem.shareConfig.import` is a string path:
- Use it as `providerImportId` instead of `getLocalProviderImportPath(pkg) || getPreBuildLibImportId(pkg)`
- Pass it to `getPackageNamedExports()` so the plugin can extract named exports from the real entry file
- Use it in the generated virtual module's import statement

### `customResolver` (dev mode)

When `shareItem.shareConfig.import` is a string path:
- Resolve from the provided path instead of the package name
- Add null check for `this.resolve()` result to prevent crash

## Usage

```ts
shared: {
  '@repro/pkg-b': {
    requiredVersion: '^1.0.0',
    import: resolve(__dirname, '../../packages/pkg-b/dist/index.js'),
  },
}
```

## Trade-offs

**Pros:**
- No new API surface — reuses existing `import` field
- Consistent with webpack MF where `import` accepts a module path
- Backwards compatible — only activates when `import` is a non-false string

**Cons:**
- Overloads `import` semantics: `false` means "don't load locally" while a string means "load from this path"
- Requires absolute paths which are environment-dependent
