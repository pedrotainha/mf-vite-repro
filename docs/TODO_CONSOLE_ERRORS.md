# TODO: Resolve Console Errors in E2E Tests

The shared Playwright fixture (`e2e/fixtures.ts`) currently filters known console errors.
Each filter is a workaround — the goal is to fix the root cause and remove the filter.

## Errors to Investigate

### 1. `<li> cannot be a descendant of <li>` (shadcn Breadcrumb)

- **Source:** `BreadcrumbSeparator` renders a `<li>` inside `BreadcrumbItem` which is also a `<li>`.
- **Fix:** Override `BreadcrumbSeparator` to use `<span role="presentation">` instead of `<li>`, or update the shadcn Breadcrumb component in `@-label-/ui-internal-core`.
- **Impact:** HTML validation warning, a11y concern.

### 2. `dynamic-remote-type-hints-plugin` fetch errors

- **Source:** `@module-federation/dts-plugin` tries to fetch type hints from remotes via WebSocket/HTTP in dev mode and fails when the remote's DTS server isn't running.
- **Fix:** Either configure `dts: false` in federation plugin config (if types aren't needed at runtime), or configure the DTS plugin WebSocket port correctly.
- **Impact:** Non-blocking — types are dev-time only, app works fine.

### 3. `net::ERR_CONNECTION_REFUSED` (WebSocket)

- **Source:** Related to #2 — the DTS plugin opens a WebSocket that can't connect.
- **Fix:** Same as #2.

### 4. `favicon` 404

- **Source:** No favicon.ico in the host's public directory.
- **Fix:** Add a favicon to `apps/host/public/favicon.ico`.
- **Impact:** Cosmetic.

### 5. A11Y test failures (`landmark-no-duplicate-main`)

- **Source:** `SidebarInset` renders a `<main>` and the MFE content area may also contain `<main>`.
- **Fix:** Ensure only one `<main>` landmark exists in the DOM — either remove `<main>` from `SidebarInset` or from the MFE wrapper. Also add `landmark-no-duplicate-main` to the axe `disableRules` list as a temporary workaround.
- **Impact:** A11y violation (moderate).
