import { expect, test } from '@playwright/test';

test('preview build renders React app', async ({ page }) => {
  const logs: string[] = [];

  page.on('console', message => {
    logs.push(`[${message.type()}] ${message.text()}`);
  });

  page.on('pageerror', error => {
    logs.push(`PAGE_ERROR: ${error.message} | stack: ${error.stack?.slice(0, 1000) ?? 'none'}`);
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  try {
    await page.waitForSelector('[data-variant]', { timeout: 15000 });
  } catch {
    const rootHtml = await page.locator('#root').innerHTML();
    console.error('Root HTML:', rootHtml.slice(0, 500) || '(empty)');
    console.error('Browser logs:', logs.join('\n'));
    expect(rootHtml.length, 'React should mount').toBeGreaterThan(0);
  }
});
