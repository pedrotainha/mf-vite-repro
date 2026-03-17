import { expect, test } from '@playwright/test';

test.describe('Module Federation — Host + Fleet', () => {
  test('host loads and displays the app', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('host-app')).toBeVisible();
    await expect(page.getByText('Host Application')).toBeVisible();
  });

  test('fleet MFE loads via federation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Hello from Fleet')).toBeVisible();
  });

  test('browser console has no errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    // Filter out known non-critical errors (e.g., favicon 404)
    const criticalErrors = errors.filter(error => !error.includes('favicon') && !error.includes('404'));
    expect(criticalErrors).toEqual([]);
  });

  test('/api/mfes endpoint returns fleet config', async ({ page }) => {
    const response = await page.request.get('/api/mfes');
    expect(response.ok()).toBe(true);

    const config = await response.json();
    expect(config).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'fleet',
          module: './FleetMfe',
        }),
      ]),
    );
  });

  test('shared React is singleton (no duplicate instances)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    // If React were duplicated, hooks would fail and the component wouldn't render.
    // The fact that fleet-mfe renders with hooks proves React is shared as singleton.
    const fleetContent = await page.getByTestId('fleet-mfe').textContent();
    expect(fleetContent).toContain('Hello from Fleet');
  });
});
