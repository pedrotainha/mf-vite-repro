# TODO: Resolve Console Errors in E2E Tests

The shared Playwright fixture (`e2e/fixtures.ts`) currently filters known console errors.
Each filter is a workaround — the goal is to fix the root cause and remove the filter.

## Resolved

### 1. `<li> cannot be a descendant of <li>` (shadcn Breadcrumb) — RESOLVED

- **Root cause:** `BreadcrumbSeparator` (renders `<li>`) was placed inside `BreadcrumbItem` (also `<li>`) in `Layout.tsx`.
- **Fix:** Moved `BreadcrumbSeparator` outside `BreadcrumbItem`, wrapped with `Fragment` for keying.
- **Filter removed from fixture.**

### 2. `dynamic-remote-type-hints-plugin` fetch errors — RESOLVED

- **Root cause:** `@module-federation/dts-plugin` tried to fetch type hints from remotes via WebSocket/HTTP in dev mode.
- **Fix:** Disabled DTS plugin with `dts: false` in all federation configs. See [ADR-006](adr/ADR-006-disable-dts-plugin.md).
- **Filter removed from fixture.**

### 3. `net::ERR_CONNECTION_REFUSED` + `WebSocket is already in CLOSING or CLOSED state` — RESOLVED

- **Root cause:** Related to #2 — the DTS plugin opened WebSocket connections that couldn't connect or were closing during navigation.
- **Fix:** Same as #2 (`dts: false`).
- **Filter removed from fixture.**

### 4. `favicon` 404 — RESOLVED

- **Root cause:** No favicon in the host's public directory.
- **Fix:** Added `apps/host/public/favicon.svg` and `<link rel="icon">` in `index.html`.
- **Filter removed from fixture.**

### 5. A11Y `landmark-no-duplicate-main` — RESOLVED (in library)

- **Root cause:** `SidebarInset` from `@-label-/ui-internal-core` was rendering `<main>`, duplicating the explicit `<main>` in `Layout.tsx`.
- **Fix:** Already resolved in `@-label-/ui-internal-core@0.3.33` — `SidebarInset` now renders `<div>`.
- **No filter was needed in fixture.**

## Remaining Intentional Filters

These are not bugs — they are expected behaviour and should remain filtered:

| Filter | Reason |
|--------|--------|
| `localhost:9999` | Intentional broken remote for error-handling tests |
| `Failed to load resource` | Browser-level companion to the `localhost:9999` filter (browser logs resource failures separately from the URL) |
| `Download the React DevTools` | React dev-mode info message, not a real error |
