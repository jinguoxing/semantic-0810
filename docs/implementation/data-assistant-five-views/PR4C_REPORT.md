# PR-4C Report｜Solution → Calculation → Result → Historical Result Continuity

## Baseline and implementation

- `PR4C_START_SHA`: `28c50383f9a71a444d3df92c83ba8288d0a0f661`
- `PR4C_IMPLEMENTATION_SHA`: `d10a585d1fce3fde573b7e3b962704ed5af19087`
- `PR4C_FINAL_GUARD_SHA`: `70d5f11e03919a717651d3dc75cd631294150460`
- Branch: `codex/data-assistant-object-views`
- Scope: PR-4C only. No PR-4A/PR-4B behavioral rework, no new HTTP endpoint, no second context/store, and no Analysis V1 work.

## Implementation summary

The Design Demo continuity task now keeps one task and the stable title `浦锦、七宝养老服务供给比较` while it creates two independently identified calculation plans:

- Plan A uses `r01 + r04` and returns 15.0 / 20.0 / 5.0 张 / 千人.
- Plan B uses `r01 + r05` and returns 22.5 / 25.0 / 2.5 张 / 千人.

Both plans are derived from the strict Current Effective Data Solution. Plan B treats `r05` as the already-materialized formal bed-definition alternative; it neither re-searches nor changes the task requirement/search revision. `r05.executionRef` remains undefined.

The Design Demo runner reads only its private raw fixture keyed by `resourceId + region + month`. It does not read conversation result values and does not affect Default Mock or HTTP execution.

## Calculation and result state mapping

- Conceptual transition: Calculation Plan → Result.
- Internal transition: `ASK_PLAN / PLAN` → `ASK_PLAN / RESULT` in the same right-workspace host.
- `ASK_PLAN / CALCULATION` is not the pre-run execution state. It is the post-result “本次计算依据” view.

`prepareContinuityAskPlan` deliberately keeps `focusSection: 'PLAN'`; the Final Guard does not rename or repurpose that state.

## C4 acceptance evidence

| ID | Evidence |
| --- | --- |
| C4-01 | `prepareContinuityAskPlan` starts with `selectEffectiveDataSolution`; targeted test asserts no `SEARCH_STARTED` or `SEARCH_RESULTS_RECEIVED`. |
| C4-02 | Plan A uses `coreResourceIds: ['r01', 'r04']`. |
| C4-03 | Every plan uses `createScenarioId('plan')`; Plan A and B IDs are asserted different. |
| C4-04 | Permission baseline, relationship pair, and alignment validation derive only from each plan's `coreResourceIds`. |
| C4-05 | Plan preparation opens the existing `ASK_PLAN` workspace with `focusSection: 'PLAN'`. |
| C4-06 | The existing right-workspace host stays `ASK_PLAN / PLAN` while `ASK_RUN_STARTED` marks the plan running. |
| C4-07 | Conceptually Calculation Plan → Result; internally `ASK_PLAN / PLAN` updates in place to `ASK_PLAN / RESULT`, with no `SURFACE_CLOSED` event. |
| C4-08 | `DESIGN_CONTINUITY_RAW_FIXTURE` is private to `MetricQueryDesignDemoService`; a test corrupts all conversation results to `999999` and still receives the frozen ratios. |
| C4-09 | Plan A result rows are 15.0 (浦锦), 20.0 (七宝), with 5.0 张 / 千人 difference. |
| C4-10 | Existing Result Chart/Data controls update presentation state only; component regression asserts no rerun. |
| C4-11 | Plan B selects formal alternative `r05` from the same effective solution and performs no search. |
| C4-12 | Plan B leaves `requirementRevision` and `searchRevision` unchanged. |
| C4-13 | Plan B receives a new `askPlanId`, different from Plan A even at the same task/revisions. |
| C4-14 | Plan B result rows are 22.5 (浦锦), 25.0 (七宝), with 2.5 张 / 千人 difference. |
| C4-15 | Plan B execution leaves Plan A's immutable `ASK_RESULT`, resultRef, binding, and content unchanged. |
| C4-16 | With population Direct Result, bed Direct Result, Result A and Result B all present, the text resolver filters Direct Results for a specified comparison result and targets Result A exactly. |
| C4-17 | Opening A uses `RESULT_DETAIL` with a `历史结果` identity and does not restore current Plan B. |
| C4-18 | Historical interpretation carries A's exact ResultTarget and returns `NO_CHANGE`; current Plan B remains current while the right workspace stays on A. |
| C4-19 | Result and interpretation boundaries explicitly reject causal explanation, sufficiency/target claims, prediction, and construction recommendations without evidence. |
| C4-20 | Full local regression, all four builds, and Mock/Demo/HTTP isolation checks pass; HTTP has no fallback to Demo or Mock. |

## Interaction acceptance evidence

| ID | Evidence |
| --- | --- |
| IC4-01 | The conversation receives only the short “已沿用当前任务…” plan-ready summary. |
| IC4-02 | `RightWorkspaceAskPlan` renders the complete calculation object and labels inputs as from the current data solution. |
| IC4-03 | `ASK_RUN_STARTED` retains the existing `ASK_PLAN / PLAN` surface. |
| IC4-04 | Successful execution changes the existing host focus from `PLAN` to `RESULT`, without close/open churn. |
| IC4-05 | Chart/Data tabs invoke presentation focus handling and do not call the runner. |
| IC4-06 | Result A and B have separate askPlan IDs, operation/result refs, executedAt values, and immutable snapshots. |
| IC4-07 | `RightWorkspaceResultDetail` renders `历史结果` for a non-current selected artifact. |
| IC4-08 | A historical interpretation is target-bound and has a `NO_CHANGE` surface command, preserving the displayed A artifact. |
| IC4-09 | All continuity events operate on the existing `taskId`; no calculation/result path calls `createTask`. |
| IC4-10 | The Design Demo goal performs the one existing title convergence, and subsequent plan/result turns do not update it. |

## Regression protection

- PR-4A: strict effective-solution freshness, production-only execution identity, r01 exact lookup, absent r04/r05 production execution refs, source binding, stale guards, hydration safety, and delayed-result rejection remain covered by the full suite.
- PR-4B: same task/title, formal alternative membership, no re-Find direct query/clarification, source-derived clarification provenance, and Default Mock/Demo/HTTP separation remain covered by the full suite.
- PR-2: Direct Metric result and definition surfaces remain covered by `historicalResultViews` and workspace pipeline regressions.
- PR-3: exact ResultTarget, authorization/readability handling, no-latest fallback, and historical read-only behavior remain covered by `historicalResultViews`.

## Fixture and production boundary

- Default Mock values remain unchanged: 14.2 / 16.5 and 32.0 / 36.5.
- Design Demo alone uses the frozen raw inputs: population 20,000 / 40,000, available beds 300 / 800, approved beds 450 / 1,000.
- HTTP builds use the HTTP service only; there is no Mock, Design Demo, or browser-cache fallback.
- Production Level B is still blocked on backend-owned canonical execution identity for r04/r05, formal metric execution, server-owned task continuity, real AskPlan execution, permission validation, and immutable result references. PR-4C demonstrates the client/Design Demo contract only and does not claim Production Ready.

## Verification

- Original targeted continuity/regression tests: 89 passed.
- Final Guard targeted tests: 35 passed.
- Full local suite after Final Guard: 18 files, 244 tests passed.
- Type check: `npm run lint` passed (`tsc --noEmit`).
- Builds passed: `mock`, `disconnected`, `http`, and `design-demo`.
- `git diff --check` passed before commit.
- GitHub CI was not triggered for this direct `codex/*` branch: the repository workflow runs push jobs only for `main` and `v2026.*`; this report therefore records local PASS only, not CI green.

## PR-4C Final Guard

The Final Guard commit is `70d5f11e03919a717651d3dc75cd631294150460`.

| ID | Evidence |
| --- | --- |
| FG4C-01 | With exactly Calculation Result A/B, `解释结果 A` resolves to Result A's exact ResultTarget. |
| FG4C-02 | With exactly Calculation Result A/B, `解释结果 B` resolves to Result B's exact ResultTarget. |
| FG4C-03 | With population/bed Direct Results ahead of two calculation results, `解释结果 A` still resolves to Calculation Result A. |
| FG4C-04 | With the same mixed history, `解释结果 B` still resolves to Calculation Result B. |
| FG4C-05 | An explicit Result A alias wins over an open `RESULT_DETAIL` displaying Result B. |
| FG4C-06 | In HTTP mode, an unreadable Calculation Result A is blocked; readable Result B is never substituted and `submitTurn` remains zero. |
| FG4C-07 | If there are not exactly two calculation results, Result A/B aliases are safely blocked rather than guessed by ordinal. |

Alias precedence is now: explicit semantic/name match, explicit calculation Result A/B alias, explicitly viewed readable result, exactly one readable result, then clarification. Only `AskPlanBinding` results participate in A/B alias order; Direct Metric Results never do. Semantic matching for available-bed and approved-bed comparison results remains exact and continues to exclude Direct Metric Results.

## Suggested next state

PR-4C is ready for review as a client/interaction freeze candidate. Production readiness remains dependent on the backend capabilities listed above. No follow-on Analysis V1 work was started.
