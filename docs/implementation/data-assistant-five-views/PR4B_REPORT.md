# PR-4B Report｜Find → Direct Query & Clarification Continuity

## Baseline

- Branch: `codex/data-assistant-object-views`
- PR4B_START_SHA: `f5f7bbdbf32e3a75d85e5bdee60ad300f70def32`
- PR-4A implementation: `ef0a4a7fce15e04c18b23dcc64748fdef7b48036`
- PR-4A Final Guard: `d6e5b0e99767bf916b48356b60c0ee1f19996ab1`
- PR4B_IMPLEMENTATION_SHA: `c3b4e991e47456fd0fa7f813f37730bf9c49ca87`
- Frozen plan: `docs/implementation/data-assistant-five-views/PR4_PLAN.md`

PR-4B implements only Find → Direct Metric Query and Find → Metric Definition Clarification continuity. It does not implement AskPlan/Calculation, result comparison, new historical-result logic, endpoints, a second context store, or formal bed metric registry entries.

## Implemented Contract

The design-demo canonical goal now creates one task titled `浦锦、七宝养老服务供给比较`. Its READY Data Solution contains:

- `r01`: `CORE / SELECTED`
- `r04`: `CORE / SELECTED / bed_definition_alternative`
- `r05`: `CORE / NOT_INCLUDED / bed_definition_alternative`

Only `r01 + r04` are the current execution core. The full `bed_definition_alternative` membership is retained in the same Data Solution for clarification; it is not a Search Candidate comparison or a second alternatives store.

`r01` is prepared only through its exact production-shaped execution reference: `METRIC / met_elderly_population / v1.1.0`, validated through the canonical registry lookup. `r04` and `r05` still have no production `executionRef`. Design-demo bed execution remains a private `MetricQueryDesignDemoService` mapping using `USER_EXPLICIT` after a Solution-derived clarification; it does not write a demo identity to `FindDataResource`.

## B4 Acceptance Evidence

| ID | Evidence |
| --- | --- |
| B4-01 | Design-demo goal emits requirement/search lifecycle events and a READY Solution. |
| B4-02 | Goal, population query, clarification, and both metric results preserve one `taskId`. |
| B4-03 | Exactly one initial `TASK_TITLE_UPDATED` sets `浦锦、七宝养老服务供给比较`; follow-ups emit none. |
| B4-04 | Composer and fixture materialize r01/r04/r05 with the required inclusion states. |
| B4-05 | Composer selects one bed alternative and marks the other `NOT_INCLUDED`; execution selectors continue excluding it. |
| B4-06 | Population preparation reads `selectEffectiveDataSolution`, selects r01 by resource identity, and validates its canonical execution ref. |
| B4-07 | Population-query events contain no `SEARCH_STARTED` or `SEARCH_RESULTS_RECEIVED`; revisions and Solution are retained. |
| B4-08 | Prepared r01 query uses `DATA_SOLUTION` with r01 plus current requirement/search revisions. |
| B4-09 | The scoped resolver takes explicit region/time first and inherits 2026-08 when time is absent. |
| B4-10 | `那浦锦 7 月是多少？` creates only 2026-07 `requestedConditions`; it does not revise the task or search. |
| B4-11 | Direct-query result reduction leaves the Data Solution intact. |
| B4-12 | Direct preparation returns a CLOSE surface command; it never clears Solution resources or requirements. |
| B4-13 | Private design-demo mapping returns 浦锦 60+ population `20,000 人` for 2026-08. |
| B4-14 | Bed ambiguity reads `selectEffectiveDataSolutionItemsBySelectionGroup`; a cleared candidate snapshot still yields r04/r05 clarification. |
| B4-15 | The clarification path emits no search or comparison events. |
| B4-16 | `ClarificationBlock` selection is local; the workspace test observes zero `executeAction` calls before submit. |
| B4-17 | Submit resolves the definition then runs the existing guarded metric runner; private demo values are r04/七宝 `800 张` and r05/七宝 `1,000 张`. |
| B4-18 | Full regression suite passes. Default Mock values and its Ask flow remain unchanged; design-demo is selected only by its explicit service mode; HTTP remains isolated. |

## Interaction Acceptance Evidence

| ID | Evidence |
| --- | --- |
| IB4-01 | Goal completion emits `SURFACE_OPENED` for the existing `SOLUTION` host. |
| IB4-02 | Current-Solution direct query emits `surfaceCommand: CLOSE`; the workspace integration test confirms the Solution panel closes. |
| IB4-03 | Direct answer remains a compact conversation result; no metric-result workspace is opened automatically. |
| IB4-04 | Solution-derived bed clarification also returns CLOSE and renders in the conversation. |
| IB4-05 | r04/r05 clarification starts with `selectedOptionIds: []`, no recommendation flag. |
| IB4-06 | Selecting a radio changes only ClarificationBlock local state. |
| IB4-07 | Submit is the first `executeAction`, followed by the pre-existing `RUN_METRIC_QUERY` runner. |
| IB4-08 | `CLARIFICATION_RESOLVED` collapses the submitted clarification into its confirmed summary. |
| IB4-09 | The existing failed-query lifecycle remains intact: `DIRECT_METRIC_QUERY_FAILED` does not modify a resolved clarification and provides retry. |
| IB4-10 | No flow calls `createTask`; same-task assertions cover Goal → Query → Clarification → Result. |

## Regression and Isolation

- PR-4A: strict effective-solution equality, canonical execution lookup, r04/r05 missing production execution identity, source freshness, entry authority, hydration fail-closed behavior, delayed-result rejection, and immutable result history are retained by the full suite.
- PR-2: entry-context Direct Metric behavior remains service-driven and the full suite passes its direct-metric view/lifecycle tests.
- PR-3: ResultTarget exact identity, permission checks, and no-latest-fallback remain unchanged; historical-result tests pass without component or service refactoring.
- Default Mock remains the original fixture (`14.2 / 16.5` available and `32.0 / 36.5` approved bed ratios). PR-4B does not alter `MockFindDataService` values.
- Design-demo holds its 20,000/40,000 population and 300/800/450/1,000 bed values only in `MetricQueryDesignDemoService` private execution logic.
- HTTP still has no Mock, design-demo, cached-result, or browser-result fallback.

## Verification

- PR-4B targeted tests: passed, including design-demo service, workspace lifecycle, Scenario/selector/composer, PR-4A contract, and final-freeze suites.
- Full test suite: `17` files, `231` tests passed.
- `VITE_FIND_DATA_MODE=mock npm run build`: passed.
- `VITE_FIND_DATA_MODE=disconnected npm run build`: passed.
- `VITE_FIND_DATA_MODE=http npm run build`: passed.
- `VITE_FIND_DATA_MODE=design-demo npm run build`: passed.
- `git diff --check`: passed.

The repository has a GitHub Actions workflow, but its push trigger is limited to `main` and `v2026.*`. A direct push to this `codex/*` branch does not make CI run. This report therefore records local tests/builds as PASS and does not claim CI green.

## Production Dependency

Client/interaction Level A is complete for PR-4B. Production direct bed queries are not ready: the backend must provide authoritative Resource → Execution Identity for r04/r05 and formal bed metric execution. Production readiness also still requires server-owned continuity, formal metric execution, permission validation, and immutable result references. No endpoint was invented or added here.

## PR-4C Readiness

Yes, PR-4C may begin after review at the client/interaction level. It must retain this Solution membership and identity contract, use selected CORE items rather than conversation values for calculation input, and does not change the production-dependency conclusion above.
