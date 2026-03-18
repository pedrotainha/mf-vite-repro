import { expect, test as base } from '@playwright/test';

/**
 * Custom test fixture that automatically collects browser console errors
 * and asserts no critical errors at the end of every test.
 *
 * Usage: import { test, expect } from './fixtures' instead of '@playwright/test'
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    // oxlint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture, not a React hook
    async ({ page }, use) => {
      const errors: string[] = [];

      page.on('console', message => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });

      await use(errors);

      // After each test: assert no critical console errors
      // TODO: investigate and fix each of these root causes, then remove the filter.
      // See docs/TODO_CONSOLE_ERRORS.md for tracking.
      const critical = errors.filter(
        error =>
          !error.includes('favicon') &&
          !error.includes('404') &&
          !error.includes('net::ERR') &&
          // Intentional in error-handling tests (broken remote on purpose)
          !error.includes('localhost:9999') &&
          // React dev-mode info message, not a real error
          !error.includes('Download the React DevTools') &&
          // BUG: shadcn Breadcrumb renders <li> inside <li> — fix in component
          !error.includes('cannot be a descendant') &&
          !error.includes('cannot contain a nested') &&
          // BUG: MF DTS plugin fails to fetch type hints in dev — configure or disable
          !error.includes('dynamic-remote-type-hints-plugin'),
      );

      expect(critical, 'Browser console should have no critical errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
