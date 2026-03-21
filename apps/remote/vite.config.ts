import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __cwd = dirname(fileURLToPath(import.meta.url));

/**
 * FIX: use the `import` field in the shared config to provide the real path
 * for @repro/pkg-b (transitive dep, not in remote/node_modules/).
 *
 * The patched plugin now reads `import` as a path string in writeLoadShareModule
 * and customResolver, using it instead of getPreBuildLibImportId(pkg).
 */
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'remote',
      filename: 'remoteEntry.js',
      dts: false,
      exposes: {
        './RemoteComponent': './src/RemoteComponent.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '*' },
        'react-dom': { singleton: true, requiredVersion: '*' },
        '@repro/pkg-a': { requiredVersion: '^1.0.0' },
        '@repro/pkg-b': {
          requiredVersion: '^1.0.0',
          // Real path to the transitive dep's entry file
          import: resolve(__cwd, '../../packages/pkg-b/dist/index.js'),
        },
      },
    }),
  ],
  server: { port: 4174 },
  build: {
    target: ['chrome80', 'safari14', 'edge80', 'firefox80'],
  },
});
