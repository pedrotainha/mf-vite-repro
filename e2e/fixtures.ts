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
          // Intentional in error-handling tests (broken remote on purpose)
          !error.includes('localhost:9999') &&
          // Browser-level resource failure (companion to the localhost:9999 filter above)
          !error.includes('Failed to load resource') &&
          // React dev-mode info message, not a real error
          !error.includes('Download the React DevTools') &&
          // Panel module does not exist yet (VehicleQuickView stub — TODO: remove when fleet exposes the module)
          !error.includes('does not exist in container') &&
          // MfeErrorBoundary log for missing panel modules (companion to the container error above)
          !error.includes('failed to load:') &&
          // React error boundary re-render message (companion to the container error above)
          !error.includes('recreate this component tree from scratch'),
      );

      expect(critical, 'Browser console should have no critical errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
