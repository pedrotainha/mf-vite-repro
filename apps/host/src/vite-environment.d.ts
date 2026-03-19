/// <reference types="vite/client" />

// eslint-disable-next-line unicorn/prevent-abbreviations -- Vite convention requires this exact name
interface ImportMetaEnv {
  readonly VITE_ENABLE_STORE_DEVTOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
