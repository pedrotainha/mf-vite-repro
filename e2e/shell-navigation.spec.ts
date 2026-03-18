import { expect, test } from './fixtures';

test.describe('Shell — Sidebar & Navigation', () => {
  test('sidebar displays navigation items from config', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByTestId('app-sidebar');
    await expect(sidebar).toBeVisible();

    // Home link
    await expect(sidebar.getByText('Home')).toBeVisible();
    // Operations submenu
    await expect(sidebar.getByText('Operations')).toBeVisible();
    // Rentals direct link
    await expect(sidebar.getByText('Rentals')).toBeVisible();
    // Documentation external link
    await expect(sidebar.getByText('Documentation')).toBeVisible();
  });

  test('SPA navigation to fleet without page reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    // Navigate to fleet via sidebar
    const sidebar = page.getByTestId('app-sidebar');
    // Fleet is inside Operations submenu — click Operations first to expand
    await sidebar.getByText('Operations').click();
    await sidebar.getByText('Fleet').click();

    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain('/fleet');
  });

  test('SPA navigation to rentals', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByTestId('app-sidebar');
    await sidebar.getByText('Rentals').click();

    await expect(page.getByTestId('rentals-mfe')).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain('/rentals');
  });

  test('SPA navigation to maintenance', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByTestId('app-sidebar');
    await sidebar.getByText('Operations').click();
    await sidebar.getByText('Maintenance').click();

    await expect(page.getByTestId('maintenance-mfe')).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain('/maintenance');
  });

  test('breadcrumbs update on navigation', async ({ page }) => {
    await page.goto('/fleet');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    const header = page.getByTestId('app-header');
    await expect(header.getByText('MFE POC')).toBeVisible();
    await expect(header.getByText('Fleet')).toBeVisible();
  });

  test('home breadcrumb shows on root path', async ({ page }) => {
    await page.goto('/');
    const header = page.getByTestId('app-header');
    await expect(header.getByText('Home')).toBeVisible();
  });
});
