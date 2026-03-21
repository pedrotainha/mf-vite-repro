/// <reference types="vite/client" />

import type { SetupWorker } from 'msw/browser';

// eslint-disable-next-line unicorn/prevent-abbreviations -- Vite convention requires this exact name
interface ImportMetaEnv {
  readonly VITE_USE_MOCKS?: string;
  readonly VITE_ENABLE_DEVTOOLS?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- MSW convention: dunder prefix for global seam
    __mswWorker?: SetupWorker;
  }
}
