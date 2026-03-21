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

const { shared, aliases } = generateShared({
  cwd: __cwd,
  ignore: ['@-label-/contracts', '@module-federation/runtime', '@module-federation/vite', 'msw'],
});

export default defineConfig({
  resolve: {
    alias: aliases,
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
      shared,
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
