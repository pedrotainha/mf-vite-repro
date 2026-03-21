import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { generateShared } from '@-label-/federation-config';
import { environmentFailPlugin } from '@-label-/vite-plugin-env-fail';
import { mfeConfigApiPlugin } from '@-label-/vite-plugin-mfe-config-api';

const __cwd = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    conditions: ['style'],
  },
  plugins: [
    environmentFailPlugin({ root: __cwd }),
    tailwindcss(),
    react(),
    mfeConfigApiPlugin(),
    federation({
      name: 'host',
      remotes: {},
      dts: false,
      hostInitInjectLocation: 'entry',
      shared: generateShared({
        cwd: __cwd,
        ignore: ['@-label-/contracts', '@module-federation/runtime', '@module-federation/vite', 'msw'],
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
    target: ['chrome80', 'safari14', 'edge80', 'firefox80'],
  },
});
