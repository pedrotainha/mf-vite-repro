import { buildMfeConfig } from './helpers/mfe-config';
import { expect, test } from './fixtures';

/**
 * Smoke test — full site navigation via sidebar clicks.
 *
 * Designed to run against any host+remote port combination.
 * The route intercept on /api/mfes ensures the browser fetches
 * remoteEntry.js from whatever ports are configured via env vars.
 *
 * Supported combinations (controlled by env vars + which servers are running):
 *   1. Host(dev)     + Remotes(dev)      — E2E_HOST_URL=4173, default remote ports
 *   2. Host(dev)     + Remotes(preview)  — E2E_HOST_URL=4173, E2E_*_ENTRY=517x
 *   3. Host(preview) + Remotes(preview)  — E2E_HOST_URL=5173, E2E_*_ENTRY=517x
 *
 * Note: Host(preview) + Remotes(dev) is NOT supported — the Vite dev server
 * injects HMR preamble code (@vitejs/plugin-react) that a preview host cannot
 * process, causing "can't detect preamble" errors in the remotes.
 */

test.describe('Smoke — Full Site Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/mfes', route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(buildMfeConfig()),
      }),
    );
  });

  test('navigate all MFE pages via sidebar clicks', async ({ page }) => {
    // 1. Home page
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    const sidebar = page.getByTestId('app-sidebar');
    await expect(sidebar).toBeVisible();

    // 2. Fleet — inside Operations submenu
    await sidebar.getByText('Operations').click();
    await sidebar.getByText('Fleet').click();
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 15_000 });
    expect(page.url()).toContain('/fleet');

    // 3. Maintenance — also inside Operations submenu (already expanded)
    await sidebar.getByText('Maintenance').click();
    await expect(page.getByTestId('maintenance-mfe')).toBeVisible({ timeout: 15_000 });
    expect(page.url()).toContain('/maintenance');

    // 4. Rentals — top-level link
    await sidebar.getByText('Rentals').click();
    await expect(page.getByTestId('rentals-mfe')).toBeVisible({ timeout: 15_000 });
    expect(page.url()).toContain('/rentals');

    // 5. Back to Home via sidebar
    await sidebar.getByText('Home').click();
    await expect(page.getByTestId('home-page')).toBeVisible();
  });

  test('sidebar collapse and expand preserves navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // Collapse sidebar — SidebarTrigger is a button inside the header
    const header = page.getByTestId('app-header');
    const trigger = header.getByRole('button').first();
    await trigger.click();

    // Sidebar should still exist (icon-only mode)
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // Expand sidebar
    await trigger.click();

    // Navigate after expand — should still work
    const sidebar = page.getByTestId('app-sidebar');
    await sidebar.getByText('Rentals').click();
    await expect(page.getByTestId('rentals-mfe')).toBeVisible({ timeout: 15_000 });
  });

  test('breadcrumbs reflect current route', async ({ page }) => {
    await page.goto('/');

    // Home breadcrumb
    const header = page.getByTestId('app-header');
    await expect(header.getByText('Home')).toBeVisible();

    // Navigate to fleet and check breadcrumb
    const sidebar = page.getByTestId('app-sidebar');
    await sidebar.getByText('Operations').click();
    await sidebar.getByText('Fleet').click();
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 15_000 });
    await expect(header.getByText('Fleet')).toBeVisible();
  });

  test('404 page for invalid route and recover via home link', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByTestId('not-found-page')).toBeVisible();

    // Recover by clicking the "Go back home" link (specific to avoid sidebar Home link)
    await page.getByRole('link', { name: /go back home/i }).click();
    await expect(page.getByTestId('home-page')).toBeVisible();
  });
});
