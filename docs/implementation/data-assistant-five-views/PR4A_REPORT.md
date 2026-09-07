# PR-4A Report｜Continuity Contract & Identity

## Baseline

- `PR4A_START_SHA`: `0cc4da8aeeb0b9eb660bf5d4cec823f294ff35fe`
- Frozen plan: `docs/implementation/data-assistant-five-views/PR4_PLAN.md`
- `PR4_PLAN_V1_1_SHA`: `9f1368b93fa127206834db4183c8afa374437175`
- `PR4A_IMPLEMENTATION_SHA`: `ef0a4a7fce15e04c18b23dcc64748fdef7b48036`
- `PR4A_FINAL_GUARD_SHA`: `d6e5b0e99767bf916b48356b60c0ee1f19996ab1`

## Scope completed

PR-4A implements only the continuity identity and freshness contract. It does not add Find → Direct routing, bed-definition clarification reuse, alternative materialization, title behavior, operation-local NLP routing, page patches, calculation, A/B result E2E, full design-demo chain, or HTTP endpoint.

## Modified files

| File | Change |
| --- | --- |
| `src/components/find_data/model/FindDataTask.ts` | Added production-only `ExecutionRef`, direct-query `source`, `requestedConditions`, and `STALE` status. |
| `src/components/find_data/model/findDataSelectors.ts` | Added strict effective-solution selector, exact canonical execution-ref validation, and Data Solution source-current guard. |
| `src/components/find_data/model/findDataReducer.ts` | Centralized direct-query invalidation on requirement/search revision changes and rejects stale prepare/start/result/failure events. |
| `src/components/find_data/fixtures/minhangBedSupplyFixture.ts` | Added the explicit r01 canonical mapping only. |
| `src/components/find_data/services/MetricQueryDesignDemoService.ts` | Supplies `ENTRY_CONTEXT` or `USER_EXPLICIT` source and known conditions for existing direct-query compatibility. |
| `src/components/find_data/__tests__/pr4aContinuityContract.test.ts` | Added PR-4A selector, identity, freshness, delayed-result, history, and PR-2 entry-path coverage. |
| Existing direct-query tests | Added required source fields without changing PR-2 / PR-3 behavior. |

`findDataEvents.ts` and `FindDataService.ts` require no structural change: existing prepared-event and service contracts already carry the full `DirectMetricQueryState`, including the new fields.

## A4 evidence

| ID | Evidence |
| --- | --- |
| A4-01 | `selectEffectiveDataSolution` requires `READY` and exact requirement/search revision equality. |
| A4-02 | `EMPTY`、`EVALUATING`、`STALE` all return no effective solution. |
| A4-03 | `FindDataResource.id` and optional `executionRef.id` are separate fields; test asserts r01 and canonical id differ. |
| A4-04 | r01 declares `METRIC / met_elderly_population / v1.1.0`; selector validates with `getMetricByCanonicalId`. |
| A4-05 | Validation invokes only canonical-id lookup and compares returned exact id/version; wrong and name-only refs are blocked in tests. |
| A4-06 | r04/r05 retain `executionRef === undefined`; no bed metric ID was introduced. |
| A4-07 | `ExecutionRef` contains only `kind`、`id`、optional `version`; no demo/mock/fixture authority field or enum was added. |
| A4-08 | `DirectMetricQueryState.source` supports `ENTRY_CONTEXT`、`DATA_SOLUTION`、`USER_EXPLICIT`; Data Solution source binds resource and both revisions; `requestedConditions` is typed. |
| A4-09 | Readiness and reducer prepare/start guards reject a Data Solution query when solution/resource identity or either revision is no longer current. |
| A4-10 | Result receipt validates task, request, metric, requirement revision, query status, and current Data Solution source; delayed stale results leave state unchanged. |
| A4-11 | `REQUIREMENT_UPDATED` and changed `SEARCH_STARTED` set mutable direct query to `STALE` and clear only `directMetricResult`; conversation `ASK_RESULT` blocks remain selectable immutable history. |
| A4-12 | No `AskContext`、`ContinuityContext`、`HandoffContextStore`, or additional Task store was added; state remains derived from the existing task. |

## Final Guard evidence｜FG4A-01～FG4A-07

| ID | Evidence |
| --- | --- |
| FG4A-01 | A task with EntryContext Metric A rejects a `USER_EXPLICIT` Metric B query in both readiness and reducer preparation. |
| FG4A-02 | A task with a non-Metric EntryContext rejects a `USER_EXPLICIT` direct metric query. |
| FG4A-03 | `ENTRY_CONTEXT` source requires an exact `source.entryId === task.entryContext.entryId`. |
| FG4A-04 | `TASK_HYDRATED` treats a serialized direct query without `source` as `STALE`, clears only its mutable current-result pointer, does not throw, and preserves `ASK_RESULT` history / ResultTarget derivation. |
| FG4A-05 | A changed search revision stales only a `DATA_SOLUTION` query and rejects its delayed result. |
| FG4A-06 | A changed search revision does not stale an `ENTRY_CONTEXT` query. |
| FG4A-07 | A changed search revision does not stale a `USER_EXPLICIT` query. |

## Regression status

- PR-2: existing entry-context direct query remains runnable; Design Demo now supplies the explicit `ENTRY_CONTEXT` source.
- PR-3: result snapshots remain derived only from immutable `ASK_RESULT` blocks. Existing exact `ResultTarget`, authorization, and no-latest-fallback tests pass unchanged.

## Verification

| Check | Result |
| --- | --- |
| Final Guard targeted tests | 7 files, 71 tests passed. |
| Full test suite | 17 files, 225 tests passed. |
| Mock build | Passed. |
| Disconnected build | Passed. |
| HTTP build | Passed. |
| Design-demo build | Passed. |
| `git diff --check` | Passed for PR-4A changes. |
| GitHub CI | `.github/workflows/ci.yml` exists. It runs on PRs and on pushes to `main` / `v2026.*`; no CI-green claim is made for this direct `codex/*` branch push. |

All builds retain the pre-existing Vite chunk-size warning only; no build failed.

## Production dependency

r04/r05 still have no server-authoritative production execution identity. This implementation intentionally blocks them from acquiring a fabricated canonical Metric ID. Formal direct execution, server-owned continuity, real AskPlan execution, permission validation, and immutable server `resultRef` remain Level B production dependencies.

## PR-4B readiness

PR-4A may take a **conditional Final Freeze** for the Level A client scope: all local Final Guard tests and builds pass, and the entry/hydration/search-freshness guards are fail-closed. This does not authorize a Production Ready claim or a fabricated r04/r05 execution identity. PR-4B may begin only after review; no PR-4B work was started in this change.
