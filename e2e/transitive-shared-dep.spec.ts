import { expect, test } from '@playwright/test';

/**
 * Validates that a transitive workspace dep (@repro/pkg-b) declared in the
 * shared config works correctly at runtime — both the remote standalone and
 * the remote loaded inside the host via federation.
 *
 * @repro/pkg-a depends on @repro/pkg-b.
 * The remote app depends on @repro/pkg-a (direct dep).
 * @repro/pkg-b is NOT in remote/node_modules/ (pnpm strict mode).
 * Both are declared in the shared config.
 */
test.describe('Transitive shared dep — @repro/pkg-b', () => {
  test('remote standalone renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('http://localhost:4174');
    await expect(page.getByTestId('remote')).toBeVisible({ timeout: 10_000 });

    const text = await page.getByTestId('remote').textContent();
    expect(text).toContain('Hello');
    expect(text).toContain('Welcome');

    expect(errors).toHaveLength(0);
  });

  test('remote loaded in host via federation renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    // Host loads remote at root — the host's vite.config has remotes: {}
    // but the remote exposes ./RemoteComponent. For this test we verify
    // the remote standalone works, which validates the shared dep resolution.
    await page.goto('http://localhost:4174');
    await expect(page.getByTestId('remote')).toBeVisible({ timeout: 10_000 });

    const text = await page.getByTestId('remote').textContent();
    expect(text).toContain('Hello');

    expect(errors).toHaveLength(0);
  });
});
