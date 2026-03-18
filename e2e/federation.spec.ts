import { expect, test } from './fixtures';

test.describe('Module Federation — Host + Remotes', () => {
  test('host loads with sidebar and header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('app-sidebar')).toBeVisible();
    await expect(page.getByTestId('app-header')).toBeVisible();
    await expect(page.getByTestId('home-page')).toBeVisible();
  });

  test('/api/mfes endpoint returns config with all remotes', async ({ page }) => {
    const response = await page.request.get('/api/mfes');
    expect(response.ok()).toBe(true);

    const config = await response.json();
    // Fleet and maintenance are inside operations submenu
    const flat = config.flatMap((entry: { submenu?: unknown[] }) => [entry, ...(entry.submenu ?? [])]);
    expect(flat).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'fleet' }),
        expect.objectContaining({ name: 'rentals' }),
        expect.objectContaining({ name: 'maintenance' }),
      ]),
    );
  });

  test('shared React is singleton (remotes render with hooks)', async ({ page }) => {
    await page.goto('/fleet');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });
    const content = await page.getByTestId('fleet-mfe').textContent();
    expect(content).toContain('Fleet');
  });
});
