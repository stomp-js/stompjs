---
name: Playwright migration
description: Migrated test suite from Jasmine/Karma to Playwright with TypeScript
type: project
---

Test framework migrated from Jasmine (Node) + Karma (browser) to `@playwright/test` running on Node only.

**Why:** User requested Playwright for tests, TypeScript test files, Node-only testing, single worker.

**How to apply:** `npm test` runs `playwright test`. Config is at `playwright.config.ts` (1 worker, 30s timeout, testDir `./spec/unit`).

Key decisions:

- Helper files live in `spec/helpers/` (TypeScript), all exported from `spec/helpers/setup.ts`
- Custom spy implementation in `spec/helpers/spy.ts` with Jasmine-compatible API (`calls.count()`, `calls.first()`, `calls.mostRecent()`, `calls.allArgs()`, `.and.callFake()`, `.and.callThrough()`)
- Custom Playwright `expect` extensions in `spec/helpers/expect-extensions.ts` for `toHaveBeenCalled`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith`
- Tests import `StompJs` from `../../esm6/index.js` (requires `npm run build` first)
- `global.WebSocket` is set via `ws` package in `spec/helpers/test-config.ts`
- `done` callbacks converted to `await new Promise<void>(resolve => { ... })`
- 123 tests total across 20 files
