import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { generateShared } from '@-label-/federation-config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    federation({
      name: 'fleet',
      filename: 'remoteEntry.js',
      exposes: {
        './FleetMfe': './src/FleetMfe/FleetMfe.tsx',
      },
      shared: generateShared({
        packageJsonPath: resolve(__dirname, 'package.json'),
      }),
    }),
  ],
  server: {
    port: 4174,
    origin: 'http://localhost:4174',
  },
  preview: {
    port: 5174,
    cors: true,
  },
  build: {
    target: 'chrome89',
  },
});
