import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { generateShared } from '@-label-/federation-config';
import { mfTlaFixPlugin } from '@-label-/vite-plugin-mf-tla-fix';
import { mfeConfigApiPlugin } from '@-label-/vite-plugin-mfe-config-api';

const __cwd = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    conditions: ['style'],
  },
  plugins: [
    tailwindcss(),
    react(),
    mfeConfigApiPlugin(),
    mfTlaFixPlugin(),
    federation({
      name: 'host',
      remotes: {},
      shared: generateShared({
        cwd: __cwd,
        ignore: ['@-label-/mfe-loader', '@-label-/ui-internal-core', '@module-federation/runtime', '@module-federation/vite'],
      }),
    }),
  ],
  server: {
    port: 4173,
    origin: 'http://localhost:4173',
  },
  preview: {
    port: 5173,
    cors: true,
  },
  build: {
    target: 'chrome89',
  },
});
