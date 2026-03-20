import { expect, test } from './fixtures';

/**
 * Dynamic Slice Registry — E2E Tests
 *
 * IMPORTANT: These tests rely on `window.__shellStore__` which is exposed
 * by ShellApiProvider ONLY in dev mode (`import.meta.env.DEV`).
 * Vite tree-shakes the assignment in production builds, so these tests
 * cannot run against preview/production servers.
 *
 * This is intentional — the `__shellStore__` global exists solely as an
 * E2E testing seam. In production, the store is private to the host app
 * and only accessible via the ShellApi prop passed to remotes.
 *
 * Test runner: `pnpm test:e2e` (uses playwright.config.ts which starts dev servers).
 * Smoke tests (`playwright.smoke.config.ts`) do NOT include this file.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- E2E bridge to browser context
const getStoreState = (page: any) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page.evaluate(() => (window as any).__shellStore__?.getState());

test.describe('Dynamic Slice Registry', () => {
  test('Fleet MFE registers its slice on mount', async ({ page }) => {
    await page.goto('/fleet');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    const state = await getStoreState(page);
    expect(state.dynamicSlices).toHaveProperty('fleet');
    expect(state.dynamicSlices.fleet).toEqual({ selectedVehicle: null, filters: {} });
    expect(state.sliceRefs.fleet.refCount).toBe(1);
  });

  test('Fleet slice is removed when navigating away', async ({ page }) => {
    // Mount Fleet
    await page.goto('/fleet');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    // Navigate to Rentals (Fleet unmounts)
    await page.goto('/rentals');
    await expect(page.getByTestId('rentals-mfe')).toBeVisible({ timeout: 10_000 });

    const state = await getStoreState(page);
    expect(state.dynamicSlices).not.toHaveProperty('fleet');
    expect(state.sliceRefs).not.toHaveProperty('fleet');
  });

  test('Rentals MFE registers its slice on mount', async ({ page }) => {
    await page.goto('/rentals');
    await expect(page.getByTestId('rentals-mfe')).toBeVisible({ timeout: 10_000 });

    const state = await getStoreState(page);
    expect(state.dynamicSlices).toHaveProperty('rentals');
    expect(state.dynamicSlices.rentals).toEqual({ activeBooking: null });
    expect(state.sliceRefs.rentals.refCount).toBe(1);
  });

  test('Maintenance MFE registers its slice on mount', async ({ page }) => {
    await page.goto('/maintenance');
    await expect(page.getByTestId('maintenance-mfe')).toBeVisible({ timeout: 10_000 });

    const state = await getStoreState(page);
    expect(state.dynamicSlices).toHaveProperty('maintenance');
    expect(state.dynamicSlices.maintenance).toEqual({ activeWorkOrder: null });
    expect(state.sliceRefs.maintenance.refCount).toBe(1);
  });

  test('cross-MFE subscription: Rentals subscribes to Fleet slice changes', async ({ page }) => {
    // Start at Rentals — subscribes to fleet slice (fleet not mounted yet → undefined)
    await page.goto('/rentals');
    await expect(page.getByTestId('rentals-mfe')).toBeVisible({ timeout: 10_000 });

    // Verify fleet slice does not exist yet
    const stateBefore = await getStoreState(page);
    expect(stateBefore.dynamicSlices).not.toHaveProperty('fleet');

    // Programmatically register fleet slice via store to simulate Fleet mounting
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (window as any).__shellStore__;
      store.getState().registerSlice({
        name: 'fleet',
        initialState: { selectedVehicle: null, filters: {} },
      });
    });

    const stateAfter = await getStoreState(page);
    expect(stateAfter.dynamicSlices).toHaveProperty('fleet');
    expect(stateAfter.sliceRefs.fleet.refCount).toBe(1);
  });

  test('host slices (rightBar, selections, navigation) remain functional', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    const state = await getStoreState(page);
    // Host slices should be initialized
    expect(state.rightBar).toEqual({ isOpen: false, stack: [] });
    expect(state.selections).toEqual({ vehicleSelection: null });
    // navigateCallback is a function — not serializable via page.evaluate,
    // so we check its type in the browser context directly
    const hasNavigate = await page.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => typeof (window as any).__shellStore__?.getState().navigateCallback === 'function',
    );
    expect(hasNavigate).toBe(true);

    // Dynamic slice registry should be empty at home
    expect(state.dynamicSlices).toEqual({});
    expect(state.sliceRefs).toEqual({});
  });
});
