import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

/**
 * Vite plugin that serves mfe.config.json as /api/mfes endpoint.
 * In dev mode, reads from the file system on each request (hot reload).
 * In preview/prod, serves a static snapshot from build time.
 */
export const mfeConfigApiPlugin = (configPath?: string): Plugin => {
  const resolvedPath = configPath ?? path.resolve(process.cwd(), 'mfe.config.json');

  const handleRequest = (
    request: { url?: string },
    response: { setHeader: (k: string, v: string) => void; end: (data: string) => void; statusCode: number },
    next: () => void,
  ) => {
    if (request.url === '/api/mfes') {
      try {
        const config = readFileSync(resolvedPath, 'utf8');
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-cache');
        response.end(config);
      } catch {
        response.statusCode = 500;
        response.end(JSON.stringify({ error: 'Failed to read mfe.config.json' }));
      }
      return;
    }
    next();
  };

  return {
    name: 'vite-plugin-mfe-config-api',

    configureServer: (server: ViteDevServer) => {
      server.middlewares.use(handleRequest);
    },

    configurePreviewServer: server => {
      server.middlewares.use(handleRequest);
    },
  };
};
