# PR-4 End-to-End Final Freeze Report

## Baseline

- `PR4_E2E_START_SHA`: `2efcf2a03a774647c0dfc1eff237bd89f2f16dc3`
- Branch: `codex/data-assistant-object-views`
- Mode: `VITE_FIND_DATA_MODE=design-demo`
- E2E test: `e2e/find-data-pr4-continuity.spec.ts`
- Status: **BLOCKED — Full Journey did not pass**

## Resolved validation blocker — visible task identity

The initial browser run exposed a real F1 layout issue at Playwright's supported
1280 × 720 desktop viewport: the fixed left rail plus an open fixed-width right
workspace collapsed the central header, making the canonical task title invisible.

The responsive layout now caps the right workspace by available viewport width,
preserves a readable central header, and hides only non-essential header controls
at this width. The rerun confirms that the user-visible title
`浦锦、七宝养老服务供给比较` remains visible with the Data Solution workspace
open. This is a product-layout fix, not an assertion relaxation.

## Full Journey failure

### Step 07 — Historical Result A interpretation

Expected user-visible state after:

> 回到在营可用床位的比较结果，解释一下这个差异。

- The right workspace replaces Result B with the read-only `历史结果` view for
  Calculation Result A.
- That surface presents the A values: `15.0` / `20.0` / `5.0 张 / 千人`.
- The interpretation remains bound to A rather than the earlier `800 张` Direct
  Metric Result or Result B.

Actual browser state:

- The conversation correctly resolves and interprets Calculation Result A. It
  says: `七宝镇为 20.0 张 / 千人，浦锦街道为 15.0 张 / 千人，相差 5.0 张 / 千人。`
- The causality guard also remains correct: the response says that it cannot
  determine the reason for the difference or create a prediction or construction
  recommendation.
- The right workspace remains on Result B (`每千名老人核定养老床位数`,
  `22.5` / `25.0` / `2.5 张 / 千人`) and does not show `历史结果`.

This fails the PR-4C historical-result surface contract. It is not a selector or
fixture issue.

## Root-cause candidate and classification

- `submitTurnWithResultTarget` in
  `src/components/DataAssistantFindDataWorkspace.tsx` deliberately calls
  `applyEngineResult` with `suppressSurface: true` for every result-targeted
  continuation.
- `MetricQueryDesignDemoService.interpretResult` returns
  `surfaceCommand: { action: 'NO_CHANGE' }`.
- Together these preserve the currently viewed Result B instead of opening the
  explicitly targeted historical Result A. The target is accurate in the
  conversation, but the T08 surface transition does not occur.
- Classification: **PR-4C historical Result / T08 surface-continuity product
  blocker**. It is not a PR-4A identity guard, PR-4B Find-to-Ask routing, or a
  pure E2E selector problem.

## Evidence retained locally

- Command: `VITE_FIND_DATA_MODE=design-demo bunx playwright test e2e/find-data-pr4-continuity.spec.ts`
- Failure: `07 · resolve and interpret historical Result A exactly`
- Assertion: visible `历史结果` heading
- Screenshot: `test-results/find-data-pr4-continuity-P-8aeb3-through-historical-Result-A/test-failed-1.png`
- Trace: `test-results/find-data-pr4-continuity-P-8aeb3-through-historical-Result-A/trace.zip`
- Error context: `test-results/find-data-pr4-continuity-P-8aeb3-through-historical-Result-A/error-context.md`

The existing Playwright failure mechanism retained these local artifacts. They
are intentionally not committed.

## Validation status

- E2E Steps 01–06: passed in the final browser run:
  - same URL `findTaskId`, canonical title, and ready Data Solution;
  - population Direct Metric Result (`20,000 人`) without reopening Find;
  - Solution-derived bed clarification and confirmed `800 张` result;
  - Calculation Plan A and Result A (`15.0` / `20.0` / `5.0`);
  - Chart/Data presentation switching;
  - Calculation Plan B and Result B (`22.5` / `25.0` / `2.5`) while retaining A
    in conversation history.
- E2E Step 07: **FAIL** as described above.
- Steps 08 (explicit Result A/B aliases), Vitest, lint, and the four build modes
  were not accepted as Final Freeze evidence after this product blocker, in line
  with the stop rule.
- GitHub CI was not evaluated. The repository workflow does not run this
  `codex/*` branch as a pull-request CI signal; this report must not claim CI
  green.

## Production dependency

This browser run remains Design Demo only. Production Level B still requires
server-authoritative execution identities for bed metrics, formal metric and
AskPlan execution, server-owned task continuity, permission validation, and
immutable result references. No production endpoint, fallback, or context store
was added in this validation work.

## Stop condition

No change has been made to the historical-result product path. Review must decide
whether to reopen the scoped PR-4C T08 behavior so an explicit historical target
opens Result Detail A without restoring Plan A or weakening PR-3 exact-target and
no-substitution guards. Until then, PR-4 End-to-End Final Freeze cannot be
declared PASS.
