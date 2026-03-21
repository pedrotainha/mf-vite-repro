/**
 * MSW handler registration (side-effect).
 *
 * Registers fleet API mock handlers if a MSW worker is available.
 * In federation mode the host creates the worker; in standalone mode
 * the fleet main.tsx creates it. This module does NOT check env vars —
 * it only checks whether the worker exists.
 */
const initFleetMocks = async (): Promise<void> => {
  if (!window.__mswWorker) return;

  const { getFleetAPIMock } = await import('@-label-/client-fleet/mocks');
  window.__mswWorker.use(...getFleetAPIMock());
};

void initFleetMocks();
