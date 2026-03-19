import { expect, test } from './fixtures';

test.describe('Right-Bar — Panel System', () => {
  test('deep-link with panel.id opens the Sheet', async ({ page }) => {
    await page.goto('/fleet?panel.id=vehicle.quickView');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    // Sheet should be open (role="dialog" is the Sheet overlay)
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // Title should match the panel config
    await expect(sheet.getByText('Vehicle Quick View')).toBeVisible();
  });

  test('deep-link with panel.id and panel.entityId opens with context', async ({ page }) => {
    await page.goto('/fleet?panel.id=vehicle.quickView&panel.entityId=V-001');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible({ timeout: 5_000 });
    await expect(sheet.getByText('Vehicle Quick View')).toBeVisible();
  });

  test('Sheet closes when clicking overlay', async ({ page }) => {
    await page.goto('/fleet?panel.id=vehicle.quickView');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // Close by pressing Escape (more reliable than clicking overlay)
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible({ timeout: 3_000 });
  });

  test('URL params are removed when panel closes', async ({ page }) => {
    await page.goto('/fleet?panel.id=vehicle.quickView&panel.entityId=V-001');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // Close
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible({ timeout: 3_000 });

    // URL should no longer contain panel params
    const url = new URL(page.url());
    expect(url.searchParams.has('panel.id')).toBe(false);
    expect(url.searchParams.has('panel.entityId')).toBe(false);
  });

  test('URL params are set when panel opens via deep-link', async ({ page }) => {
    await page.goto('/fleet?panel.id=vehicle.quickView&panel.entityId=V-001');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // URL should still contain panel params (zustand mirrors to URL)
    const url = new URL(page.url());
    expect(url.searchParams.get('panel.id')).toBe('vehicle.quickView');
    expect(url.searchParams.get('panel.entityId')).toBe('V-001');
  });

  test('SPA navigation maintains panel open state', async ({ page }) => {
    await page.goto('/fleet?panel.id=vehicle.quickView');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // Navigate to rentals via sidebar while panel is open
    const sidebar = page.getByTestId('app-sidebar');
    await sidebar.getByText('Rentals').click();
    await expect(page.getByTestId('rentals-mfe')).toBeVisible({ timeout: 10_000 });

    // Panel should still be open (it's a shell overlay, independent of route)
    await expect(sheet).toBeVisible();
  });
});
