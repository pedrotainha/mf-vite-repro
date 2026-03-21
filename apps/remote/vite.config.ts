import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __cwd = dirname(fileURLToPath(import.meta.url));

/**
 * FIX: use a new `path` property in the shared config to provide the real
 * path for @repro/pkg-b (transitive dep, not in remote/node_modules/).
 *
 * The patched plugin reads `path` as a resolution hint in writeLoadShareModule,
 * customResolver, and localSharedImportMap.
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
          // New property: real path to the transitive dep's entry file
          path: resolve(__cwd, '../../packages/pkg-b/dist/index.js'),
        },
      },
    }),
  ],
  server: { port: 4174 },
  build: {
    target: ['chrome80', 'safari14', 'edge80', 'firefox80'],
  },
});
