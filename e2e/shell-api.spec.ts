import { expect, test } from './fixtures';

test.describe('Shell API — Zustand Store', () => {
  test('shell store initializes with default state', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    // The shell store initializes internally — the absence of console errors
    // validates that zustand + ShellApiProvider bootstrap correctly.
    // The consoleErrors fixture (auto: true) asserts no critical errors.
  });

  test('shellApi is passed to remote MFEs without errors', async ({ page }) => {
    await page.goto('/fleet');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    // If shellApi integration caused errors, the consoleErrors fixture would catch them
    // The MFE rendering successfully means shellApi prop was accepted
  });

  test('shellApi works across all remotes', async ({ page }) => {
    // Fleet
    await page.goto('/fleet');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    // Rentals
    await page.goto('/rentals');
    await expect(page.getByTestId('rentals-mfe')).toBeVisible({ timeout: 10_000 });

    // Maintenance
    await page.goto('/maintenance');
    await expect(page.getByTestId('maintenance-mfe')).toBeVisible({ timeout: 10_000 });
  });
});
