import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Minimal shared config that includes a transitive workspace dep.
 *
 * - @repro/pkg-a: direct dep of remote (in remote/node_modules/)
 * - @repro/pkg-b: transitive dep (pkg-a depends on pkg-b)
 *                  NOT in remote/node_modules/ (pnpm strict mode)
 *
 * BUG: the federation plugin generates a loadShare wrapper for @repro/pkg-b
 * but cannot resolve it because it's not in remote's node_modules.
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
        // This is the transitive dep that causes the build to fail.
        // It's collected by our generateShared helper, but it's not in
        // remote/node_modules/ because pnpm strict mode doesn't hoist it.
        '@repro/pkg-b': { requiredVersion: '^1.0.0' },
      },
    }),
  ],
  server: { port: 4174 },
  build: {
    target: ['chrome80', 'safari14', 'edge80', 'firefox80'],
  },
});
