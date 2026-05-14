# stompjs — Code-quality audit

Suggestions to make stompjs more robust and maintainable. References are `file:line` against the `code-quality` branch.

## Architecture (biggest leverage)

1. **Break the `Client` ↔ `StompHandler` circular dependency.** `stomp-handler.ts:100` holds a back-reference to `Client` purely to read `heartbeatStrategy` (and `client.ts:293` reaches into `_stompHandler._webSocket`). Pass `heartbeatStrategy` through `IStomptHandlerConfig` and remove `_client` — both classes become testable in isolation and you remove a real import cycle.

2. **Replace the 12 `@ts-ignore` lines in `client.ts`** (1015, 1021, 1106, 1141, 1180, 1206, 1229, 1250, 1271, 1300, 1331) with a single private helper `_requireHandler(): StompHandler` that throws a typed error when the handler is null. One chokepoint for "called while disconnected," and you can re-enable `@typescript-eslint/ban-ts-comment` afterward.

3. **`client.ts` is 1334 lines and acts as a god object.** Extract three cohesive units: a `ReconnectScheduler` (linear/exponential backoff, jitter, `maxReconnectDelay`), a `LifecycleStateMachine` (current state mutations are scattered across `activate`/`deactivate`/`forceDisconnect`/`onclose`), and a thin passthrough STOMP API. The state machine in particular has a real bug surface (see #6).

## Concurrency & lifecycle

4. **`configure()` blindly copies user input** (`client.ts:738`: `(Object as any).assign(this, conf)`). A typo in user config silently does nothing, and under `exactOptionalPropertyTypes`, passing `{ heartbeatIncoming: undefined }` overwrites the default with `undefined`. Iterate keys explicitly, skip `undefined`, warn on unknown keys. The same `(Object as any).assign` anti-pattern repeats at `stomp-handler.ts:197, 437, 480, 499, 519, 569, 585` and `frame-impl.ts:75` — all should be `{ ...x }`.

5. **Parser swallows handler exceptions to `console.log`** (`parser.ts:227-232`). This hides bugs in user `onMessage`/`onConnect` callbacks and bypasses `debug`. Route through the debug callback or `console.error` at minimum.

6. **Reconnect race in `deactivate()`.** Lifecycle state is mutated from `activate`, `deactivate`, the WS `onclose` handler, and the connection watcher independently. If `activate()` is called during `DEACTIVATING` and then `deactivate()` again, intermediate intent can be lost. A single `transition(state, intent, event)` method removes the surface.

7. **`beforeConnect` is not cancellable** (`client.ts:794`). A slow token fetch will continue and create a `StompHandler` even after `deactivate()`. Carry an `AbortSignal` or add an `_inFlightConnect` guard.

8. **Connection watcher leak.** `_connectionWatcher` is only cleared on successful `CONNECTED`; if `deactivate()` runs in between, the timer fires later on a closed socket. Clear it in `deactivate()` and `onWebSocketClose` too.

9. **`dispose()` swallows transmit failures** (`stomp-handler.ts:451`). If the DISCONNECT frame fails to send, the receipt watcher registered just above never fires and `_closeWebsocket` is only reached via WS close. Fall through to `_closeWebsocket()` / `_cleanUp()` in the catch.

## Type safety

10. **Eliminate `any` on timer handles.** `_ponger: any` (`stomp-handler.ts:96`) and similar elsewhere should be `ReturnType<typeof setInterval>` (or `number | NodeJS.Timeout`).

11. **`closeEventCallbackType<T = any>` / `wsErrorCallbackType<T = any>`** (`types.ts:40, 48`) — defaulting to `any` defeats the generic. Define minimal `IStompCloseEvent { code; reason; wasClean }` and `IStompErrorEvent {}` and use them directly.

12. **`webSocketFactory?: () => any`** in `stomp-config.ts:37` but `() => IStompSocket` on `Client`. Use the strict type everywhere.

13. **Rename `IStomptHandlerConfig`** (`types.ts:186`) — typo "Stompt", and rename `heartbeatGracePeriods` → `heartbeatToleranceMultiplier` so the config field matches the handler field it's assigned to (`stomp-handler.ts:122`).

14. **Use definite-assignment `!` instead of `// @ts-ignore`** in `parser.ts:67, 74`.

## Error handling / API

15. **`_checkConnection()` throws `TypeError`** (`client.ts:1112`). Wrong category — it's an invalid-state error. Define `StompNotConnectedError extends Error` for callers to discriminate.

16. **No backpressure signal on `publish`.** Surface `WebSocket.bufferedAmount` or document the lack of flow control prominently. Today an unhealthy network can balloon memory silently.

17. **Drop deprecated public surface for v8.** `src/compatibility/` is re-exported from `index.ts:14-15`; `publishParams` lowercase alias (`types.ts:83`); `Client.over()`/`Client.client()` static factories. Saves ~400 lines, removes the largest cluster of legitimate `any` usage, and is the right window to do it before publishing 7.4.0.

## Tooling

18. **ESLint config disables real-bug-catchers** (`eslint.config.mjs:14-17`). Turn back on:
    - `@typescript-eslint/ban-ts-comment` — would have caught all 12 `@ts-ignore` lines.
    - `@typescript-eslint/no-floating-promises` — needs typed linting; high value for an async-heavy library.
    - `@typescript-eslint/no-explicit-any` — at least as `warn`.

    Also add `tseslint.configs.recommendedTypeChecked` (or `strictTypeChecked`) and `eslint-plugin-import` with `import/no-cycle` — the latter would have flagged the Client↔StompHandler cycle.

19. **Tighten `tsconfig`.** Turn on `declarationMap` (commented at line 11) for consumer IDE navigation, plus `noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables`, `verbatimModuleSyntax`, `forceConsistentCasingInFileNames`.

20. **Enforce coverage thresholds.** `c8` block in `package.json:70` reports but doesn't gate. Add `c8 check-coverage --lines 90 --functions 90 --branches 80` to CI.

21. **Tests only run `--project=node`** (`package.json:9`). The Playwright config defines chromium/firefox/webkit projects that only run at `prepublishOnly` — i.e. publish-time is the first signal of browser regressions. Either run them in CI or delete them.

22. **Audit CI workflows** in `.github/workflows/` — `linux.yml`, `osx.yml`, `node-js.yml` likely duplicate work. Consolidate into a matrix.

## Docs

23. **Modernize JSDoc links.** All `client.ts` doc-comments use `[Foo#bar]{@link Foo#bar}`. TypeDoc handles `{@link Client.bar}` natively, with cleaner output.

24. **Document `noUncheckedIndexedAccess` impact on `IFrame.headers`.** Consumers reading `frame.headers['x-foo']` now get `string | undefined`. This is the kind of subtle migration note that belongs in the changelog and README, not in code comments.

---

## Suggested order of implementation

Highest leverage / lowest risk first:

1. **#2** (replace `@ts-ignore` with `_requireHandler`) — small diff, eliminates a category of latent bugs, unblocks #18.
2. **#18** (re-enable ESLint bug-catchers) — surfaces real issues the type system can't catch (floating promises, etc.).
3. **#1** (break Client↔StompHandler cycle) — small refactor, removes the only legitimate reason for the back-reference.
4. **#4** (rewrite `configure()` + replace remaining `(Object as any).assign` patterns) — fixes a real `exactOptionalPropertyTypes` bug, removes ~10 `any` warnings.
5. **#14, #10, #11, #12, #13** (type-safety cleanups) — incremental.
6. **#5, #6, #7, #8, #9** (concurrency/lifecycle) — needs careful test coverage; consider #3 (extract `LifecycleStateMachine`) at the same time.
7. **#17** (v8 cleanup) — schedule for the v8 cut.
