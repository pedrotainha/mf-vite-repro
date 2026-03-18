// oxlint-disable-next-line import/no-named-as-default -- AxeBuilder is the official default export
import AxeBuilder from '@axe-core/playwright';

import { expect, test } from './fixtures';

test.describe('Accessibility', () => {
  test('home page has no critical a11y violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .disableRules([
        // MFE architecture doesn't have landmarks in each fragment
        'region',
        'landmark-one-main',
        'landmark-unique',
      ])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('fleet page has no critical a11y violations', async ({ page }) => {
    await page.goto('/fleet');
    await expect(page.getByTestId('fleet-mfe')).toBeVisible({ timeout: 10_000 });

    const results = await new AxeBuilder({ page }).disableRules(['region', 'landmark-one-main', 'landmark-unique']).analyze();

    expect(results.violations).toEqual([]);
  });
});
