export const config = {
  USE_MOCKS: import.meta.env.VITE_USE_MOCKS === 'true',
  ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '/api',
} as const;
