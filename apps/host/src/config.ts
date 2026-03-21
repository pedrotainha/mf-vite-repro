export const config = {
  ENABLE_STORE_DEVTOOLS: import.meta.env.VITE_ENABLE_STORE_DEVTOOLS === 'true',
  USE_MOCKS: import.meta.env.VITE_USE_MOCKS === 'true',
} as const;
