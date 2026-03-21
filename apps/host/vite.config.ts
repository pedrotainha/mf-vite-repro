import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {},
      dts: false,
      shared: {
        react: { singleton: true, requiredVersion: '*' },
        'react-dom': { singleton: true, requiredVersion: '*' },
        '@repro/pkg-a': { requiredVersion: '^1.0.0' },
        '@repro/pkg-b': { requiredVersion: '^1.0.0' },
      },
    }),
  ],
  server: { port: 4173 },
  build: {
    target: ['chrome80', 'safari14', 'edge80', 'firefox80'],
  },
});
