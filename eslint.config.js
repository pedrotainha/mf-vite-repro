import { defineConfig } from 'eslint/config';
import { fullReactConfigs } from '@-label-/lint-config';

export default defineConfig([
  ...fullReactConfigs,
  {
    ignores: ['packages/', 'apps/', 'clients/', '**/coverage/', '**/dist/', 'e2e/debug.spec.ts'],
  },
]);
