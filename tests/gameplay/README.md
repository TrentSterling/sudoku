# Placement correctness checks

Run `node --test tests/gameplay/placement.cjs` for deterministic callback-order regressions. They extract the real GameScene methods and use a small graphics/tween stub, allowing deliberately replayed callbacks after reset and redraw. This does not replace engine tests.

Run `node tests/gameplay/browser.cjs` with Playwright 1.62.0 and its Chrome channel for the real Phaser 3.80.1 scene. The unchanged About browser gate installs these dependencies in CI. The new gameplay steps are additive; no existing About assertions or browser cases are removed.

The browser suite runs desktop, portrait and landscape sizes. It covers rapid palette changes, same-cell duplicates, parallel cells, incorrect feedback and retries, stopped animations, New Game during entrance/fade, pause/resume, About interruption, resizing with pending work, completing a full board, completed-board resize and reset during celebration. Repeated redraw checks ensure one ambient timer and stable scene object counts. The timer assertion reads the pinned engine's private Clock `_active` list only in tests.

Browser actions invoke existing DOM controls and scene methods directly in a fresh muted headless browser. They do not inject pointer/keyboard events, focus windows, request pointer lock, or exercise audio. Native touch and keyboard gestures are not qualified by this suite. The existing remote About suite retains its original interaction coverage.

Set `SUDOKU_LIVE_URL=https://tront.xyz/sudoku/` to repeat against the deployed page. Results go to `.gameplay-evidence/results.json`.

There is no game save or persisted puzzle format in this source. This change adds none. Existing About discovery storage remains untouched. Rotation preserves the current in-memory puzzle, accepted values and completion state; an unfinished placement is canceled and becomes available again. New Game explicitly generates a fresh puzzle.
