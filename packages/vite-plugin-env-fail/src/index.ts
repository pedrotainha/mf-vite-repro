import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

interface EnvironmentFailOptions {
  /** Absolute path to the directory containing .env and .env.example. */
  root: string;
}

/** Fails fast if .env is missing — guides the developer to create it from .env.example. */
export const environmentFailPlugin = (options: EnvironmentFailOptions): Plugin => ({
  name: 'env-fail',
  configResolved: () => {
    const environmentPath = path.resolve(options.root, '.env');
    if (!fs.existsSync(environmentPath)) {
      const relative = path.relative(process.cwd(), options.root);
      throw new Error(
        `Missing .env file at ${environmentPath}\nCopy .env.example to .env:\n  cp ${relative}/.env.example ${relative}/.env`,
      );
    }
  },
});
