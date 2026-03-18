import { expect, test } from '@playwright/test';

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

  test('browser console has no critical errors on home', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    const criticalErrors = errors.filter(error => !error.includes('favicon') && !error.includes('404') && !error.includes('net::ERR'));
    expect(criticalErrors).toEqual([]);
  });
});
