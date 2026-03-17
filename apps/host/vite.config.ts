import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { generateShared } from '@-label-/federation-config';
import { mfeConfigApiPlugin } from '@-label-/vite-plugin-mfe-config-api';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    mfeConfigApiPlugin(),
    federation({
      name: 'host',
      remotes: {},
      shared: generateShared({
        packageJsonPath: resolve(__dirname, 'package.json'),
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
