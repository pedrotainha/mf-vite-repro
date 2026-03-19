import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { generateShared } from '@-label-/federation-config';

const __cwd = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    federation({
      name: 'maintenance',
      filename: 'remoteEntry.js',
      dts: false,
      hostInitInjectLocation: 'entry',
      exposes: {
        './MaintenanceMfe': './src/MaintenanceMfe/MaintenanceMfe.tsx',
      },
      shared: generateShared({
        cwd: __cwd,
        ignore: ['@-label-/mfe-loader', '@module-federation/runtime', '@module-federation/vite'],
      }),
    }),
  ],
  server: {
    port: 4176,
    origin: 'http://localhost:4176',
  },
  preview: {
    port: 5176,
    cors: true,
  },
  build: {
    target: 'chrome89',
  },
});
