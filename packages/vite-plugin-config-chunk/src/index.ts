import type { Plugin } from 'vite';

/**
 * Converts static `import { config } from "./config"` into a dynamic import
 * during build so Rollup keeps config.ts as a separate chunk with placeholders
 * intact. In dev mode this plugin is inactive — the static import works as-is.
 */
export const configChunkPlugin = (): Plugin => ({
  name: 'config-chunk',
  apply: 'build',
  transform: (code: string) => {
    if (!code.includes('from "./config"')) return;
    return code.replaceAll(/import\s*\{([^}]+)\}\s*from\s*"\.\/config";?/g, 'const {$1} = await import("./config");');
  },
});
