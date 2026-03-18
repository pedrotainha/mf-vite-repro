import { expect, test } from './fixtures';

test.describe('Error Handling', () => {
  test('invalid route shows 404 page', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByTestId('not-found-page')).toBeVisible();
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('404 page has link back to home', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByTestId('not-found-page')).toBeVisible();

    await page.getByText('Go back home').click();
    await expect(page.getByTestId('home-page')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('broken remote shows error boundary', async ({ page }) => {
    await page.goto('/broken');
    await expect(page.getByTestId('mfe-error-boundary')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Failed to load')).toBeVisible();
  });
});
