# PR-4 End-to-End Final Freeze Report

## Baseline and closeout

- `PR4_E2E_START_SHA`: `2efcf2a03a774647c0dfc1eff237bd89f2f16dc3`
- T08 Guard start: `6f8ac2ca5460a128bdb945317a04a91a6ac3297e`
- `PR4_T08_SURFACE_GUARD_SHA`: `233d3ae6618ef673574a192d79591b508887a9fb`
- Branch: `codex/data-assistant-object-views`
- Mode: `VITE_FIND_DATA_MODE=design-demo`
- E2E test: `e2e/find-data-pr4-continuity.spec.ts`
- Status: **PR-4 E2E Final Freeze — PASS (local validation)**

## Resolved blockers

### F1 — visible task identity

The original browser run at the supported 1280 × 720 viewport showed that the
fixed left rail plus the open fixed-width right workspace could collapse the
central header. The responsive layout now caps the right workspace by available
viewport width, keeps the canonical title visible, and hides only non-essential
header controls at that width.

### T08 — Historical Result Surface Continuity

The original Step 07 browser run resolved and interpreted Calculation Result A
correctly in conversation, but kept Result B in the right workspace. The cause
was intentionally conservative delayed-response handling:

- `submitTurnWithResultTarget` applies continuations with `suppressSurface: true`.
- `MetricQueryDesignDemoService.interpretResult` returns `NO_CHANGE`.

The guard preserves both rules. It adds only a synchronous local transition for
an explicit result-navigation request (`回到`, `打开`, `查看`, `切到`, or
`切换到`) paired with an exact result reference. The client:

1. resolves the exact target;
2. validates current readability and authorization;
3. locally opens or replaces `RESULT_DETAIL` with that exact target; then
4. submits the interpretation with the same `ResultTarget` while the delayed
   service response remains conversation-only.

`解释结果 A` remains interpretation-only and does not force a surface change.
The minimal recognizer also accepts `Result A` / `Result B` aliases without a
generic intent router.

## Full Journey evidence

The Playwright test starts at `/` and passes all eight steps in one task:

1. Forms the ready Data Solution, shows the canonical task title
   `浦锦、七宝养老服务供给比较`, and records one stable URL `findTaskId`.
2. Reuses the solution for the population Direct Metric Result (`20,000 人`) with
   the solution workspace closed and no Find candidate surface.
3. Reuses Solution alternatives for bed-definition clarification; selection is
   non-executing and confirmed available beds return `800 张`.
4. Opens Plan A and runs the `r01 + r04` comparison without a sufficiency claim.
5. Switches Chart/Data/Chart without a new run or result.
6. Opens and runs Plan B from the approved-bed alternative while retaining
   Result A in conversation.
7. Explicitly returns from Result B to the read-only historical Result A:
   `15.0` / `20.0` / `5.0 张 / 千人`. The test rejects the Direct Metric Result
   workspace (`指标查询结果`) rather than treating the legitimate `800 张` input
   cell inside Result A's table as a false failure.
8. Verifies exact Result B and Result A aliases in the same task; explicit A
   resolves A even after B is viewed.

The stable URL `findTaskId` and canonical task title are asserted at every key
transition. No Find candidate comparison, fixed Find→Ask→Analysis stepper,
automatic bed-definition recommendation, sufficiency claim, or causal claim is
rendered during the journey.

## Result and interpretation evidence

- Result A: 浦锦街道 `15.0`、七宝镇 `20.0`、差异 `5.0 张 / 千人`.
- Result B: 浦锦街道 `22.5`、七宝镇 `25.0`、差异 `2.5 张 / 千人`.
- Historical interpretation is bound to Result A and states the two A values and
  their `5.0` difference.
- The interpretation explicitly says the result lacks cause evidence and cannot
  determine the reason, predict, or make a construction recommendation. It does
  not fabricate investment, construction, or policy conclusions.

## T08 Guard evidence

`src/components/find_data/__tests__/historicalResultViews.test.tsx` adds:

- **T08-G1:** Result B → explicit available-bed Result A navigation replaces the
  right workspace with historical A; the continuation carries A while current
  Plan B remains current.
- **T08-G2:** after the A request, a user can return to Result B; even a delayed
  response carrying a hostile `REPLACE RESULT_DETAIL A` command cannot reclaim
  the surface.
- **T08-G3:** `解释结果 A` binds the conversation to A without changing the
  currently viewed Result B surface.
- **T08-G4:** `回到 Result A` opens exact historical A without running or
  restoring Plan A.
- **T08-G5:** in HTTP mode, unreadable A blocks before local navigation or
  submission and never substitutes readable B.

This retains PR-3 exact `ResultTarget`, authorization, no-latest-fallback, and
no-unreadable-substitution behavior. The service remains unable to navigate the
GUI, and `suppressSurface: true` remains in effect for all delayed
interpretation responses.

## Local validation

- Targeted historical-result guard: **PASS** — 26 tests.
- Playwright full journey: **PASS** —
  `VITE_FIND_DATA_MODE=design-demo bunx playwright test e2e/find-data-pr4-continuity.spec.ts`
  (1 test, Steps 01–08).
- Vitest: **PASS** — 18 files, 249 tests.
- TypeScript lint: **PASS** — `bun run lint`.
- Production builds: **PASS** — `mock`, `disconnected`, `http`, and
  `design-demo` modes. Vite emitted only its existing large-chunk advisory.
- `git diff --check`: **PASS** before the T08 Guard commit.

GitHub CI is not claimed green: this `codex/*` branch does not provide a
GitHub-CI success signal for this validation. The results above are local.

## Production dependency

This freeze validates the Design Demo journey. Production Level B still needs
server-authoritative execution identities for bed metrics, formal metric and
AskPlan execution, server-owned task continuity, permission validation, and
immutable result references. No endpoint, fallback, production identity, or
second context store was added for this guard.

## Final scope

PR-4A, PR-4B, PR-4C, and the PR-4 end-to-end continuity journey are frozen at
the client/interactions level. No Analysis V1 work has started.
