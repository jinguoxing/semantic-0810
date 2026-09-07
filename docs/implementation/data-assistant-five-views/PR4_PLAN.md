# PR-4 Plan｜Find → Ask Task Continuity

> 状态：**PLAN ONLY**。本文件基于实际工作树和代码读取形成；未修改业务代码、未创建 commit、未 push，也不开始 PR-4A / PR-4B / PR-4C。

## 1. Baseline

- Branch：`codex/data-assistant-object-views`。
- `START_SHA`（实际 `HEAD`）：`5bdf8764b75717bd1af05be1e5586eb9fc1b983c`。
- `PR3_FINAL_FREEZE_SHA`：`789cd68cfbff3048835832528e0e1f111d33470b`。它是当前 HEAD 的祖先；`5bdf876` 仅在 `docs/implementation/data-assistant-five-views/PR3_REPORT.md` 记录 Final Freeze，不改变业务代码。
- 因而本计划从当前实际 HEAD 出发，不回退到 `789cd68`，也不从 `v2026.9.4` 重建。
- 开始时已有未跟踪的 `.playwright-cli/`、`artifacts/`、`test-results/` 及既有 `docs/implementation/data-assistant-five-views/` 材料；它们不是本 PR 的输入或输出，保持不覆盖。本轮唯一新增文件是本计划。
- 未发现适用的 `AGENTS.md`。

PR-4 的产品边界保持为一个“数据助手”业务 Task。Find、正式指标直查、口径澄清、计算方案、Result A / B 和指定历史结果解读均是同一 Task 内的 turn / operation / clarification / plan / result，不是独立的 Find、Ask 或 Analysis Task。

## 2. Current Code Facts

下表逐项记录已读取的实现事实。"支持"只表示当前代码已经具备的部分；不能据此推定 PR-4 已实现。

| 文件 / 符号 | 代码事实 | 现状是否已经支持 | 缺口 | 最小修改建议 |
| --- | --- | --- | --- | --- |
| `model/FindDataTask.ts`：`RequirementHypothesis`、`DataSolution`、`DataSolutionItem` | `RequirementHypothesis` 已保存 `region`、`timeRange`、人口/床位定义；`DataSolution` 已带 `state`、`basedOnRequirementRevision`、`basedOnSearchRevision`，item 只指向 `resourceId`。 | 有 revision 锚点，可在同一 task 派生连续上下文。 | item/resource 没有 Resource → Execution Identity；没有“有效方案”这一派生契约。 | 在 `FindDataResource` 增加可选、显式且可验证的 execution reference；新增纯 selector，不增加 Context Store。 |
| 同文件：`AskPlan`、`AskPlanRunRequest`、`DirectMetricQueryState`、`DirectMetricResult` | `AskPlan` 已绑定 requirement/search revision、`coreResourceIds`、权限和运行请求；`DirectMetricQueryState` 只有 `requestId`、`metricId`、`definitionRef`、状态和时间。`AskResultSnapshot` 已是不变结果快照。 | AskPlan 的 revision / idempotency 基础与 Direct Metric 的轻量 runtime state 已存在。 | Direct query 不记录来自 Entry / Solution / User 的来源、resource、solution revisions 或已解析条件；direct result binding 也不能证明 Solution source。 | 只扩展既有 DirectMetricQueryState 的 source/scope binding，并用 reducer/selector 校验；不建第二份 Ask/Continuity context。 |
| 同文件：`ResultTargetRef`、`SurfaceState` | PR-3 的 `ResultTargetRef` 精确含 task、binding、executedAt、可选 resultRef；`SurfaceState` 已有唯一 active surface、`RESULT_DETAIL`、`resultView`。 | 支持历史 A/B 精确目标和单一右侧宿主。 | 逻辑状态名仍是 `SOLUTION`、`ASK_PLAN`、`METRIC_RESULT`、`RESULT_DETAIL`，不是 PR-4 文案中的 `DATA_SOLUTION` / `CALCULATION` / `RESULT`。 | 保留现有枚举以保护 PR-1/2/3；在 policy 中把 `SOLUTION` 映射为 F1，`ASK_PLAN + CALCULATION` 映射为 A3，`ASK_PLAN + RESULT` / `RESULT_DETAIL` 映射为 A4/A5。 |
| `model/findDataSelectors.ts`：`selectAskHandoffReadiness`、`getDataSolutionDisplayState` | handoff 只检查 `dataSolution.state === 'READY'`、核心 item 和关系；display 可显示 `STALE`。 | 已可拒绝未 READY、缺少核心资源和关系冲突。 | 没有 `selectEffectiveDataSolution`，handeoff 未比较 data solution 的两份 revision 与 Task 当前 revision。 | 新增有效方案 selector；handeoff、Direct routing、plan build 共同使用它。 |
| 同文件：result selectors | `selectResultSnapshots` 从 `turns -> ASK_RESULT` 派生；精确 target 匹配、HTTP 历史 `currentReadAccess` 和 no-latest-fallback 已实现。 | PR-3 A/B 历史结果、权限与只读 identity 已具备。 | requirement 变化后 `directMetricResult` 仍可留在 current state；Direct query 没有 Solution source revision 校验。 | requirement/search 失效时把 direct current 指针降为历史，并让 query readiness 使用 source binding；不删除 conversation snapshot。 |
| `model/findDataReducer.ts` / `findDataEvents.ts` | `REQUIREMENT_UPDATED` 会把非空 READY solution 标为 `STALE`；Search Result 同时核对 task/requirement/search revision；AskPlan 可被 `ASK_PLAN_INVALIDATED` 移除；direct result 收到时核对 task、request、metric、requirement revision。 | 有可靠的 Search 异步拒绝和 AskPlan 的大部分 stale 防线。 | `REQUIREMENT_UPDATED` 不失效 pending DirectMetricQuery，也不清除 direct current pointer；direct result 收到不核对 source search revision。scenario 层才会发 AskPlan invalidation，非中央保证。 | 加最小 direct-query invalidation/guard；将 current result 降为 `turns` 内历史。保持旧 `ASK_RESULT`，不改变 PR-3 target 匹配。 |
| `DataAssistantFindDataWorkspace.tsx`：初始化 / submit routing / operation guards | 只在初始化、用户点“新建任务”时调用 `createTask`；常规 `handleSendMessage` 对当前 `taskRef.current` 调 `submitTurn`。`operationId`、pending guard、taskId、surface navigation sequence 已防止迟到响应覆盖。 | 同 Task 的 UI 操作、服务异常保留 Task、历史解释 `suppressSurface` 均已实现。 | 没有从 Current Effective Solution 派生 Direct Query 的路由；发送问题不会在进入直查前关闭 Solution；没用 source binding 验证后再 run。 | 在同一 submit pipeline 接收服务的 route/result，不调用 `createTask`；T01/T02 用现有 operation guard 和 surface command。 |
| 同文件：`handleRunDirectMetricQuery` / `handleClarificationSubmit` | Direct Query 是 `METRIC_QUERY` operation；失败保留 confirmation 并提供重试。Clarification 选择通过 `SUBMIT_CLARIFICATION`，选择后若 state 为 READY 才触发 run。 | "选择 != 查询" 和失败不清空已确认口径已具备基础。 | 自动 run 只识别现有 `directMetricQuery.status`，没有确认 query 的 data-solution revision/source 仍当前；当前 Design Demo 的澄清也不是从 Solution 重用。 | run 前使用新的 source-current selector；服务准备 query 后才可自动 run，过期时显示 stale 而不执行。 |
| 同文件：`handleRunAskPlan` / right workspace | AskPlan run 保持 active `ASK_PLAN` surface，成功后用 `SURFACE_OPENED` 把 focus 改为 `RESULT`，而非 close；`RightWorkspaceAskPlan` 已支持 `PLAN` / `CALCULATION` / `RESULT` 与 Chart/Data。 | 同一个 aside host 已可在计算与结果内原位切换；Chart/Data 纯 UI。 | 成功路径直接 reducer 写入，不表达为 policy `REPLACE`，也不会在“先确认方案”时自动打开 `CALCULATION`。 | 保持同一 host，显式执行 logical `REPLACE(ASK_PLAN, RESULT)`；生成/复用当前 plan 时发 `OPEN(ASK_PLAN, CALCULATION)`。 |
| `RightWorkspaceSolution.tsx` | 数据方案可打开/关闭；有 READY / STALE 显示、核心资源、切换床位口径动作。footer 在已有 plan 时显示“转入分析计划”；stale 文案称“不能进入 Ask Data”。 | F1 的方案信息和解决方案对象已经存在。 | “转入分析计划 / Ask Data” 是冻结产品合同中不应强调的旧语义；没有“数据方案已就绪，可继续自然语言提问”的轻量说明。 | 只改 F1 文案与 footer：保留方案，显示“数据方案已就绪”“当前数据方案 · N 个核心数据”，不把 composer 绑定到单 asset，不把方案作为固定阶段入口。 |
| `scenarios/MinhangBedSupplyScenario.ts` / `minhangSolutionComposer.ts` | Find 由 `SEARCH_STARTED` / `SEARCH_RESULTS_RECEIVED` 形成 solution；composer 以 r01 + r04 或 r05 建计划；`buildAskPlan` 取 `dataSolution.basedOn*Revision`。需求修改会发 requirement update、plan invalidation、search。 | Find→Solution、r04/r05 计算公式切换、AskPlan revision 绑定已存在。 | scenario 不处理 Current Solution → Direct Metric / definition clarification；`buildAskPlan` 未先证明 solution 的 revisions 当前。`matchesInitialTurn` 只认“闵行”，浦锦/七宝业务目标会落到 generic。 | 将 PR-4 continuity routing 保持在本 scenario / Design Demo adapter，而不是新通用 Intent Router；build plan 先要求 effective solution；给 `design-demo` 专用的浦锦/七宝 Find 主链，默认 Mock 的既有语义不改。 |
| `fixtures/minhangBedSupplyFixture.ts` | r01/r04/r05 都是 `FindDataResource`，但仅有展示 metadata；`MINHANG_DATA_SOLUTION` READY = revision 1/1；Mock 的实际范围为闵行 `2026-08`。 | r01、r04、r05 resource identities 和默认 Mock fixture 已集中。 | r01 没显式指向 registry `met_elderly_population`；r04/r05 没有 canonical execution identity。默认 Mock 结果为 14.2/16.5、32.0/36.5，不能被 PR-4 demo 数替换。 | r01 加入可验证 canonical ref；r04/r05 不臆造 canonical id。另置 design-demo 专用原始输入/identity，不触碰此默认 Mock 数值。 |
| `data/metricRegistryData.ts` | `CANONICAL_DOMAIN_METRICS` 中正式存在 `met_elderly_population`（`老年人口数`，v1.1.0）；`getMetricByCanonicalId` 是 exact lookup。`findMetricByQuery` 是宽泛 NLP matcher。无 `met_bed_available`、`met_bed_approved` 或等价养老床位指标。 | r01 有可用的真实 canonical target。 | r01 与 resource r01 之间目前没有正式 mapping；床位未登记。`findMetricByQuery` 不能作为 Find resource execution mapping。 | 只使用 exact canonical lookup 验证显式 r01 ref；不改 Registry 以添加虚构床位 id。r04/r05 进入 backend dependency / design-only 分类。 |
| `MetricQueryDesignDemoService.ts` | 仅在 `design-demo` 构造 20,000 / 40,000 人、床位 800 / 1,000（单值路径）及 A/B 15/20、22.5/25。通过文本 regex/entryContext 识别 Direct Metric；未知 turn 委托 Mock；`runAskPlan` 也委托 Mock。 | 已隔离 PR-2/3 的直查、口径澄清、A/B 结果和精确历史解读。 | 未从 READY Solution 路由；r04/r05 共用 `design_elderly_bed_capacity` + definition，且没有资源→identity；无完整 Goal→Find→Query→Calculation E2E；单值路径没有浦锦 300 / 核定 450。 | 扩展此显式 adapter 和 design-only fixture，按 resourceId 明确映射，不修改 Default Mock；实现完整 Demo 仅在此 mode。 |
| `MockFindDataService.ts` | Mock 根据 scenario 实现 Find / AskPlan，`buildMockAskArtifact` 返回 14.2/16.5 或 32.0/36.5；run AskPlan 使用 resource IDs、权限和 alignment；不会从浏览器聊天数值取数。 | 默认 Mock 与 calculation 输入/结果分离已有良好基础。 | 它不是正式 Direct Metric execution service，也不含 PR-4 设计数；不能被当作 HTTP fallback。 | 维持数值和 fixture 不变；仅按新 types 补全安全 guard/测试所需最小兼容，不迁入 design values。 |
| `HttpFindDataService.ts` / `FindDataService.ts` | 已有 task create/get/list/delete、`/turns`、`/actions`、permission check、ask-plan run；保留 operationId；HTTP 直接结果/AskPlan 仅接受 `LIVE_QUERY`，不 fallback；PR-3 仅传 exact historical identity。仓库中没有相应 backend 实现。 | HTTP 无 Mock/Design Demo/cache fallback 和 PR-3 历史授权边界均正确。 | 无法从客户端证明 server 有 solution-to-execution mapping、正式床位 Metric、continuity/stale 处理、真实 AskPlan 或历史授权实现。 | 不编造 URL。为已有 response/event contract 增加 source/identity validation；把未提供能力列为 production dependency，HTTP 必须阻断而非模拟成功。 |
| `policy/surfacePolicy.ts` / `RightWorkspaceAskPlan.tsx` | `openSurface` 在已有 surface 返回 `REPLACE`；一个 `<aside>` 按 `activeSurface.type` 渲染；`RESULT_DETAIL` 已精确 history replace。 | 一个 Host、T07 本地 Chart/Data、T08 exact ResultTarget 的技术基础均存在。 | T01 无 route-close；T05/T06 没有 PR-4 的显式 calculation/result transition contract。 | 在现有 policy 中补 source-continuity commands，不新增 Continuity 页面或第二个 host。 |

## 3. Current Gaps

以下均是代码已证实的真实缺口，而非新增产品讨论。

1. **没有 Effective Data Solution selector。** `READY` 被单独判断，未同时验证 requirement/search revision；因此 handcrafted/恢复状态及后续 search change 都可能把过期方案看作可 handoff。
2. **没有显式执行 identity。** r01/r04/r05 都是 Find resource ID；Registry 只登记 `met_elderly_population`，且没有 r01 mapping；r04/r05 没有正式 canonical ID。
3. **DirectMetricQueryState 不能证明来源。** 当前只有 `metricId` / `definitionRef`，不能表明来自哪个 solution item、基于何时的 solution，也不保存按优先级解析后的范围。
4. **不存在 Find→Direct Query / Clarification route。** 现有 Direct Metric 只在 Design Demo 的 entry/text regex 中生成；Current Solution 被问到“浦锦老年人口”时不会复用 r01，也没有 T01 close。
5. **床位 Clarification 不是 Solution reuse。** 设计演示从任意任务的“养老床位”文本创建 question；Minhang Find 默认只把一个床位口径纳入 solution，r05 在浏览时还是 candidate。没有“当前 solution 内已有 r04/r05 则直接澄清”的 selector。
6. **stale protection 不完整。** scenario 会 invalidated AskPlan，但 reducer 不会 centralize DirectMetricQuery invalidation；search revision 对 delayed Direct result 也没有 source guard。旧 result 虽在 `turns` 内，旧 direct current pointer 仍可能被视为 current。
7. **Surface contract 只有一半。** single host 与 no-close calculation update 实际存在，但 F1 的旧“转入分析计划”语义、A3 自动打开、T01 close、T06 explicit replace 尚未实现。
8. **Design Demo 不完整。** 现有数字只覆盖 PR-2/3 的局部路径；浦锦/七宝业务目标不触发 `MinhangBedSupplyScenario`，Design Demo 又把未知 turn 委托给 Mock，无法得到 READY Solution。
9. **HTTP production capability 未在仓库中实现。** 这里只有前端 adapter 和测试拦截；不能把 local Registry 或 Design Demo 误报为 production service。

## 4. Single Task Continuity Contract

`taskId` 是整个业务过程的唯一身份。计划中的 canonical journey 为：

`Business Goal → Find Data → Data Solution → Direct Metric Query → Metric Clarification → Calculation Plan → Result A → Result B → Historical Result Interpretation`

它是允许的连续路径，不是强制阶段机：已有正式指标可直查；已有有效方案可直问或计算；只有业务目标先 Find；已有 Result 可继续该 Result；只有新的条件确实需要新资源时才重新 Find。

具体合同：

- Task 的创建仅保留在现有初始化、显式“新建任务”与 detail-page entry；PR-4 routing 绝不调用 `createTask`。
- 所有 Direct Query、Clarification、AskPlan、run、A/B 浏览与历史解读均调用当前 `taskRef.current.taskId`。
- `entryContext` 继续只表示 detail page → Data Assistant 的一次性对象入口。它不得被伪造成 Current Solution 的承载物，也不覆盖 solution-derived source。
- 旧 result 是 `turns` 内的 immutable `ASK_RESULT`；修订后可变的 current query / AskPlan 可以 stale 或移除，但 result 不删除、不“恢复旧 plan”。
- 不新增 `AskContext`、`ContinuityContext`、Result Registry 或额外持久 store。连续性只由现有 Task、DataSolution、AskPlan、DirectMetricQuery、turns/result target 和纯 selector 派生。

## 5. Effective Data Solution

新增纯函数 `selectEffectiveDataSolution(task)`，返回 `DataSolution | undefined`（或包含 `{ solution, coreItems }` 的只读派生值），以现有 reducer 的事实为准：

```ts
task.dataSolution.state === 'READY' &&
task.dataSolution.basedOnRequirementRevision === task.requirementRevision &&
task.dataSolution.basedOnSearchRevision === task.searchRevision
```

这里必须使用**完全相等**，不能用 `<=`：`SEARCH_STARTED` 会写入一个新的 `searchRevision` 并将 solution 置为 `EVALUATING`，`SEARCH_RESULTS_RECEIVED` 才以当前两个 revision 写回 READY；`REQUIREMENT_UPDATED` 会置 STALE。旧 revision 即使数字更小也不是当前有效方案。

补充规则：

- `EMPTY`、`EVALUATING`、`STALE` 均返回 `undefined`；不借 `updatedAt`、聊天文本或候选池推测有效性。
- selector 本身不承诺存在可执行 resource。Direct Query 还需唯一、discoverable、可 query 的 item 和有效 execution ref；Calculation 还需现有 relationship/permission checks。
- 将 `selectAskHandoffReadiness` 改为先消费该 selector，再做其已有 core / partial / relationship 判断。`buildAskPlan` 同样必须在 selector 成功后使用该对象的 items 与 revisions。
- 该 selector 是 P4A 的唯一“Current Effective Data Solution”判定，不复制 `DataSolution`，不写 reducer event。

## 6. Resource → Execution Identity

### Contract

`resourceId` 只标识 Find catalog resource，永远不等于 canonical execution id。为 `FindDataResource` 引入最小、可选的显式 ref，例如：

```ts
type ExecutionRef = {
  kind: 'METRIC' | 'ASSET' | 'API';
  id: string;
  version?: string;
  authority: 'CANONICAL' | 'DESIGN_DEMO';
};
```

生产 resource 只能使用 `authority: 'CANONICAL'`；`id` 必须经 `metricRegistryService.getMetricByCanonicalId` 或服务器权威目录的 exact-id lookup 验证。禁止调用 `getMetricById` 的 name 分支或 `findMetricByQuery` 作为 mapping；尤其禁止从“60 岁以上常住人口数”猜测 Metric ID。

### 已核对的 r01 / r04 / r05 结论

| Find Resource | 当前事实 | PR-4 execution identity 结论 |
| --- | --- | --- |
| `r01`，60 岁以上常住人口数 | Registry 有正式 `met_elderly_population`（老年人口数、v1.1.0），但 fixture/resource 未显式连接。 | 可在 P4A 把 `r01.executionRef` 显式设为 canonical `METRIC / met_elderly_population / v1.1.0`，并用 exact registry lookup 测试。该 ref 是正式 mapping，不能由名称产生。 |
| `r04`，在营可用养老床位数 | Registry 没有对应 canonical metric。 | **没有 production canonical identity。** 不得创建 `met_bed_available` 等假 ID。仅可在 `design-demo` 私有 fixture 使用 `authority: DESIGN_DEMO` 的明确 resource mapping；HTTP/production direct execute 必须依赖 backend 返回/验证的正式 identity。 |
| `r05`，养老床位核定数 | Registry 同样没有对应 canonical metric。 | **没有 production canonical identity。** 不得创建 `met_bed_approved` 等假 ID；处理方式与 r04 相同。 |

为避免污染：r04/r05 的 `DESIGN_DEMO` mapping 放在 design-demo 专用 fixture/adapter，不写入默认 Mock 的 production-shaped `MINHANG_RESOURCES`。Default Mock 仍能作为离线 fixture 运行其既有 AskPlan，但不因此获得正式 Metric 身份。

## 7. Scope / Condition Precedence

为 Direct Query preparation 定义一个小型纯 resolver，解析后的范围写入**既有** `DirectMetricQueryState`，不是新 context：

1. Current Turn Explicit Conditions；
2. Current Requirement；
3. Current Effective Data Solution（可用资源、已确认 definition / coverage）；
4. Object Default Semantics（execution ref/Registry 的正式默认语义）。

“浦锦、七宝养老服务供给比较”已有 `region: 浦锦街道、七宝镇`、`time: 2026-08` 时，用户说“先查浦锦街道老年人口”：选择 r01 的显式 canonical ref，region 用浦锦街道，time 继承 2026-08；不会反问时间或地区。若用户显式说“2026 年 7 月”或“核定床位”，它覆盖 requirement；只有覆盖导致当前有效方案不能提供所需 resource/definition 时，才走 requirement update + Find。

范围解析不读取已显示的 20,000、800、任何 result table/summary 或历史聊天文本作为执行数据。范围是请求条件，执行值仅由 execution service 返回。

## 8. Direct Metric Source Binding

扩展既有 `DirectMetricQueryState`，保持其“轻量 runtime state”职责：

```ts
source:
  | { kind: 'ENTRY_CONTEXT'; entryId: string }
  | { kind: 'DATA_SOLUTION'; resourceId: string;
      requirementRevision: number; searchRevision: number }
  | { kind: 'USER_EXPLICIT' };
requestedConditions: Pick<RequirementHypothesis,
  'region' | 'timeRange' | 'populationDefinition' | 'bedDefinition'>;
```

`metricId` 仍是实际 execution id，不用 resource name 代替。`DATA_SOLUTION` 必须满足：effective selector 成功、resourceId 属于该 solution、resource 有精确且适用于当前模式的 execution ref，source revisions 与 task/current solution 完全一致。`ENTRY_CONTEXT` 仍校验 target exact id/version；`USER_EXPLICIT` 只允许服务已经给出 exact canonical metric identity 的情形。

run/reducer 的守卫：开始和接收结果都检查 taskId、requestId、metricId、requirement revision，以及 Data Solution source 的 requirement/search revisions 仍当前。失败只把本 query 标为失败，保留 requirement、solution 和已确认 clarification；不把失败重解释为 Search。

## 9. No Re-Find Routing

在当前 Task 的服务/scenario route 中先判定 effective solution，再判定是否需要 Search：

- Solution 内只有一个匹配当前问法且有 execution ref 的正式 Metric（如 r01）时，直接产生 `DIRECT_METRIC_QUERY_PREPARED`；不发 `SEARCH_STARTED`、不改 `searchRevision`、不执行 marketplace retrieval/reranking、不 replace `DataSolution`。
- 同一 solution 内有同一语义的多个床位 definition（r04/r05）时，转入 Clarification；仍不 Search。
- 当前 turn 条件真实引入 solution 不具备的 metric / definition / resource，才先走 requirement revision、令当前 solution stale，并重新 Find。
- T01 在 preparation 的 surface command 中关闭 `SOLUTION`，但 reducer 不删 `dataSolution`。Direct Answer 在同一 conversation 原位出现，右侧保持 CLOSED。

对“不得重新 Find”的验证不能只看文案：测试应检查事件序列没有 `SEARCH_STARTED`、`SEARCH_RESULTS_RECEIVED`，task 的 `searchRevision` 未变，`dataSolution` object/resource IDs 未被 replace，`taskId` 未变。

## 10. Metric Clarification Reuse

在 Minhang / PR-4 design scenario 内实现**狭义**的 r04/r05 definition selector：只读取 Current Effective Data Solution 的 items（不是 `searchResult.candidateSnapshot`），以已有 `bed_definition_alternative` / 明确 resource identity 识别可复用 definition。

- Current Solution 含 r04 与 r05，用户问“查询七宝镇养老床位数”时，创建 Metric Definition Clarification，选项直接引用 r04/r05 的资源/definition ref；不是 candidate compare，也不打开 Compare workspace。
- selection 只更新 `ClarificationResolution` 和准备好的 direct query。UI 的 `ClarificationBlock` 已有 submitting/locked/resolved 基础；selection 本身绝不查询。
- Submit 后利用既有 `handleClarificationSubmit` 才 run；成功 collapse 为已确认，失败保留 resolved definition 和 retry action。
- 当前 calculation baseline 仍是 r04 时，单次 Direct Query 选择 r05 不自动改写业务 requirement；用户明确说“改成核定床位”才按已有 requirement-revision/recomposition 路径失效 plan 并重新评估。

这保持 Clarification 与 Find Candidate Comparison 的边界，也避免建设通用 intent router。

## 11. Calculation Continuity

当用户说“用当前已经选定的人口和在营可用床位数据……先让我确认计算方案”时：

1. 只从 `selectEffectiveDataSolution(task)` 的 selected core resources 生成/复用 AskPlan；`buildAskPlan` 把该 effective solution 的 requirement/search revisions 写入已有字段。
2. plan 的 input 展示继续从 `coreResourceIds -> task.resources` 和 execution ref 派生；它不从 conversation result scalar、文本中的 20,000/800 或历史 Result snapshot 取值。
3. `AskPlanRunRequest` 继续只传 plan ID、expected revisions、idempotency key；执行端按 server-owned plan/resource identity 取原始数据。浏览器不传公式可变副本、聊天数值或 pseudo SQL。
4. 生成/复用 plan 后自动将唯一 right host 打开为 `ASK_PLAN + focusSection: CALCULATION`（A3）。对话仅输出轻量确认摘要；完整 Calculation Object 留在 GUI。
5. 若 r04/r05 尚无 production execution identity，HTTP 计划不能报告可生产执行；design-demo 可以用 isolated raw source 表完成数字演示，Default Mock 保持原有 fixture contract。

## 12. Stale / Revision Rules

| 变化 | 可变当前状态 | 历史结果 |
| --- | --- | --- |
| Requirement 修改（例如“改成核定床位”） | requirement revision +1；solution 立即不再 effective / STALE；pending Data-Solution Direct Query 变 `STALE` 且不可 run；current Direct result pointer 取消；AskPlan invalidated。 | `turns` 内旧 `ASK_RESULT`、binding、resultRef、executedAt 一律保留，可按 PR-3 ResultTarget 只读查看。 |
| Search revision 修改 | source 的旧 search revision 不再 current，old Direct Query / AskPlan 不能 run；新的 Search Result 才形成新的 effective solution。 | 已完成 result 不删除，不修改其值、revision、executedAt 或 citation。 |
| delayed response | reducer/workspace 按 operationId、taskId、requestId、source revision 检查，不满足即丢弃，不覆盖 Task state/surface。 | 不创建伪历史、不 fallback 到 latest。 |

实现优先在 reducer/selector 中集中判断，而非只依赖 scenario 的正常事件序列。可保留 `ASK_PLAN_INVALIDATED` 的现有行为；为 direct query 增加最小 invalidation（可为新的 `STALE` status 或等价不可运行标记），并使 `selectDirectMetricQueryReadiness` 拒绝任何 stale source。PR-3 的 ResultTarget、authorization 和 no-latest-fallback 不作弱化。

## 13. Result / Historical Continuity

- A4 当前 Result 仍在同一 Task 的 conversation 产生 immutable snapshot；Result Chart/Data 是同一 `resultTarget` / `executedAt` 的 presentation-only state，不查询、不加 turn、不改 revision。
- Result A 和 B 可来自不同 requirement/search/plan/direct bindings，但属于同一 taskId；切换只替换 right workspace display target，不恢复 A 的 plan，不改 B 的 plan。
- A5 必须继续 PR-3：`selectResultTargetByRef` 精确 target、HTTP historical read authorization、无 latest fallback、`INTERPRET_RESULT` 只带 A 的 `TurnTargetContext`。历史 interpretation 的 `suppressSurface` 保持右侧 A，不重新执行。
- requirement 变化后，当前结果可变指针降级为历史，但 old result snapshot 仍完整可读（HTTP 前提是该 snapshot 获授权）。

## 14. Surface Transition Mapping

现有技术名与冻结页面语义的映射：F1 = `SOLUTION`，A1 = `CLOSED`（Direct Answer 的完整/definition actions 仍可按 PR-2 自主打开 `METRIC_RESULT`），A2 = `CLOSED`，A3 = `ASK_PLAN + CALCULATION`，A4 = `ASK_PLAN + RESULT`，A5 = `RESULT_DETAIL`。这使用一个 `<aside>` host，不新增 Continuity 页面。

| Transition | 起点 → 终点 | 计划中的 command / guard | 不变量 |
| --- | --- | --- | --- |
| T01 Data Solution → Direct Query | `SOLUTION OPEN → CLOSED` | Solution-derived query preparation 发 `CLOSE`；只是关闭 Surface。 | solution、resources、taskId 保留；无 Search、无新 Task。 |
| T02 Direct Query → Direct Answer | `CLOSED → CLOSED` | `METRIC_QUERY` operation 的轻量 runtime；成功插入 Direct Answer，失败只标记该 query。 | requirement / effective solution 保留；迟到结果受 operation/source guard。 |
| T03 Ask → Clarification | `CLOSED → CLOSED` | effective solution 已含 r04/r05 时直接发 definition clarification。 | 不 Search、不 Compare、不新 Task。 |
| T04 Clarification → Metric Result | `CLOSED → CLOSED` | selection 不执行；Submit lock 防重复；确认后准备并运行 source-current query。 | 成功 collapse；失败保留 confirmed definition。 |
| T05 Current Solution → Calculation | `CLOSED → ASK_PLAN/CALCULATION OPEN` | valid effective solution 生成/复用 plan 后 `OPEN`（已有 host 时 `REPLACE`）。 | GUI 承担完整 calculation；聊天只有摘要；输入不是 conversation values。 |
| T06 Calculation → Result | `ASK_PLAN/CALCULATION → ASK_PLAN/RESULT` | Ask run 期间 host 不关闭；成功通过 `REPLACE` 更新同一 host。 | 不能 dispatch close 再 open；失败留在 Calculation/plan 可重试。 |
| T07 Result Chart ↔ Data | `ASK_PLAN/RESULT ↔ ASK_PLAN/RESULT` | 只改 `resultView` / focus 的 local surface command。 | 不 query、不 new turn、不改 ResultRef/executedAt/revision。 |
| T08 Current Result ↔ Historical Result | `OPEN → RESULT_DETAIL REPLACE` | 以 PR-3 exact ResultTarget `REPLACE`；interpret response suppresses surface command。 | 不重跑、不改 Current Plan；历史明确只读；解读 A 时右侧继续 A。 |

## 15. Design Demo Fixture Isolation

完整 PR-4 E2E 只在 `VITE_FIND_DATA_MODE=design-demo` 使用下列冻结 raw input，而不是从已展示的 Direct Result 读回：

| resource / scope | 浦锦街道，2026-08 | 七宝镇，2026-08 |
| --- | ---: | ---: |
| r01：60+ 常住人口 | 20,000 | 40,000 |
| r04：在营可用养老床位 | 300 | 800 |
| r05：核定养老床位 | 450 | 1,000 |
| r04 ÷ r01 × 1000 | 15.0 | 20.0 |
| r05 ÷ r01 × 1000 | 22.5 | 25.0 |

实施时把 raw values、design-only execution refs 和 result builders 放到新的 design-demo fixture（或 `MetricQueryDesignDemoService` 的私有常量）中，按 `resourceId + region + month` exact lookup。它应支持 Goal → READY Solution（含可供 calculation 的 r01/r04，及供 definition reuse 的 r05）→ Direct Query / Clarification → Calculation → A/B → A interpretation。

不得改动 `MockFindDataService.buildMockAskArtifact` 的 14.2/16.5、32.0/36.5，或 `MINHANG_MOCK_RESULT_SCOPE`。`createFindDataService` 已将 design-demo 与 mock/http/disconnected 分开；新增回归要保证 HTTP 的错误路径不转向 Mock、Design Demo 或 browser cached result。

## 16. HTTP Production Dependencies

| 能力 | 前端可完成 | 现有 HTTP contract 可完成 | 生产 Backend 尚未提供 / 无法在仓库证明 |
| --- | --- | --- | --- |
| Effective Solution / stale / UI single Task | 是，纯 selector/reducer/workspace。 | HTTP 可返回 Task/events 供前端应用。 | server 是否以同一 revision 做权威判定未知。 |
| r01 resource → canonical metric | 前端可 exact-validate declared `met_elderly_population`。 | 可在 task/event payload 承载 authoritative ref。 | backend 是否拥有相同 mapping/version validation未知。 |
| r04/r05 正式床位 execution identity | 否；只能阻断或使用 design-demo-only ref。 | 当前 adapter 没有要求字段。 | **未提供 canonical registry identity 与可执行服务。** |
| Formal Direct Metric Query | UI、source binding、LIVE_QUERY rejection 可完成。 | 既有 `/tasks/:id/turns`、`/actions` 可承载既有事件/operationId，不须新 URL。 | server 是否能用 source resource、resolved scope、权限、revision 生成并执行 query 未知。 |
| AskPlan real execution | plan UI、idempotency、current revision guard 可完成。 | 既有 `/tasks/:id/ask-plan/run` 已传 plan ID/revisions/idempotency。 | server 是否按 immutable plan/resource execution refs 执行真实计算未知。 |
| Server-owned task continuity | 前端不会创建子 task，可按 current task 调用。 | 已有 `/tasks/:id` 表面上支持持久 Task。 | 后端是否保存 Solution、query source、clarification、plan、revisions 并原子验证未知。 |
| Historical result authorization | PR-3 client already requires `currentReadAccess === 'AUTHORIZED'` for HTTP history. | GET task / turns 可返回明确 marker；不需要臆造 endpoint。 | 精确 resultRef 的当前授权、不可变引用和解释授权仍是 PR-3 已知 production dependency。 |

生产结论：前端不得为了 P4 Demo 伪造 r04/r05 formal metrics、HTTP successful results 或后台 Task continuity。缺少上述服务字段/行为时，HTTP 应保留阻断和失败信息，不 fallback。

## 17. Proposed File Changes

| 文件 | why | minimal change | risk |
| --- | --- | --- | --- |
| `model/FindDataTask.ts` | 表达 execution ref、direct source 和 resolved conditions。 | 扩展现有 resource/query types；不新建 context store；保持 ResultTarget/AskPlan binding 兼容。 | 类型扩展会影响 fixtures/tests，须保护 legacy snapshots。 |
| `model/findDataSelectors.ts` | 建立唯一有效方案与 source-current guard。 | 新增 `selectEffectiveDataSolution`、solution direct eligibility、definition-reuse 和 direct readiness helper；handeoff 改调用它。 | 不可把现有 READY partial/gap 错当 executable。 |
| `model/findDataEvents.ts`、`findDataReducer.ts` | central stale protection。 | 仅增加 DirectMetricQuery invalidation/STALE event 或等价 reducer 分支；requirement/search 变化拒绝 old source；保留 `turns` results。 | 不得删除 PR-3 historical result 或打断 entry-based PR-2 direct query。 |
| `policy/surfacePolicy.ts` | 明确 T01/T05/T06 的现有 Host command。 | 增加 close/replace helpers，沿用 `SOLUTION`、`ASK_PLAN`、`RESULT_DETAIL`。 | 不要新增第二 host 或以 CLOSE+OPEN 取代 replace。 |
| `DataAssistantFindDataWorkspace.tsx` | 同 task routing、run guard、surface应用。 | 使用 service result/source guard；T01 close；A3 auto-open；T06 policy replace；保留 operationId/late-response rules。 | 不能在任何 Direct/Clarification/Calculation 调 `createTask`。 |
| `RightWorkspaceSolution.tsx` | F1 冻结文案。 | 去除“转入分析计划 / 进入 Ask Data”强调，显示 solution ready / N core；保持自然语言 composer。 | 不能将 composer 锁到 resource 或隐藏 solution。 |
| `RightWorkspaceAskPlan.tsx` | A3/A4 同 host展示。 | 复用现有 `CALCULATION` / `RESULT` focus，按需微调 labels。 | 不复制新的 Calculation/Result 页面。 |
| `scenarios/MinhangBedSupplyScenario.ts`、`minhangSolutionComposer.ts` | Current Solution direct/clarification/calculation continuity。 | scenario-scoped resolver，plan build只取 effective solution，r04/r05 clarification reuse。 | 避免成为通用 intent router；不改已冻结 Minhang initial Find semantics。 |
| `fixtures/minhangBedSupplyFixture.ts` | r01 canonical ref和默认 fixture边界。 | 仅加 r01 exact mapping metadata/测试辅助；保留 Mock data。 | r04/r05 不得添加虚构 canonical IDs。 |
| `data/metricRegistryData.ts` | canonical reality需保持可检验。 | 预计不改 production registry；仅用 exact lookup test 验证 r01。 | 禁止为了通过 Demo 写入床位 metric。 |
| `services/MetricQueryDesignDemoService.ts` 与新增 design-only fixture | 完整、隔离的 PR-4 E2E。 | exact resource identity/raw values、Pujin/Qibao Find mainline、A/B calculations。 | Design logic不可泄漏到 Mock/HTTP，不能用文本名称猜 production id。 |
| `services/MockFindDataService.ts` | 兼容新 type/guard并保护 fixture。 | 只作必要 compatibility；数值不改。 | 不应成为 HTTP fallback或生产证明。 |
| `services/FindDataService.ts`、`HttpFindDataService.ts` | 维持 service type/production boundary。 | 只接受/验证已有 event payload中新字段；不新增 URL。 | 不得把 client registry、Mock或cached data传为 authority。 |
| `__tests__/{findDataSelectors,findDataReducer,findDataService,metricQueryDesignDemoService,surfacePolicy,workspacePipeline,historicalResultViews,httpFindDataService}.test*` | 覆盖下面 matrix和 PR-1/2/3 freeze。 | 加明确 events、taskId、identity、revision、no-search、host assertions。 | 漏测时最易回归 PR-3 authorization/no-latest fallback。 |

## 18. Regression Test Matrix

| Group | 场景 | 关键断言 |
| --- | --- | --- |
| A — Single Task Continuity | Goal → Find → Query → Clarification → Calculation → Result A → Result B → History A。 | 每个 event/service call 的 `taskId` 相同；无 `createTask`；A interpretation target 是 A。 |
| B — No Re-Find | READY effective solution + “查浦锦老年人口”。 | 没有 `SEARCH_STARTED` / `SEARCH_RESULTS_RECEIVED`；searchRevision 未增；solution 未 replace；仅 Direct query events。 |
| C — Identity | r01 显式 ref → exact canonical `met_elderly_population`；wrong/missing ref。 | exact id 返回正确 metric；missing/wrong ref blocked；spy 证明不调用 name/NLP fallback。 |
| D — Clarification | effective solution 含 r04/r05 + “养老床位数”。 | 出现 definition clarification；无 Search、无 candidate comparison；selection 无 execution，Submit 后才 query。 |
| E — Stale | old solution/query/plan → requirement 或 search revision 修改。 | old pending direct query/plan 不可执行；delayed result被拒绝；old ASK_RESULT / ResultTarget 仍可读。 |
| F — Surface | Solution OPEN → Direct CLOSED → Calculation OPEN → Result REPLACE → Historical REPLACE。 | one host；没有 Calculation→Result `SURFACE_CLOSED`；Chart/Data 与 A/B switching 不调用 execution。 |
| G — Fixture Isolation | design-demo 与 mock/http。 | Demo 得 15/20、22.5/25，raw values正确；Mock仍14.2/16.5、32/36.5；HTTP错误/缺契约不fallback。 |

还要保留并扩展 PR-2 Direct Metric tests（entry target identity、selection/submit/query lifecycle、definition display）和 PR-3 historical tests（authorization、exact A/B、no latest fallback、interpretation keeps workspace）。

## 19. P4-01～P4-18

| ID | Acceptance | 验收证据 |
| --- | --- | --- |
| P4-01 | Business Goal 形成 READY Data Solution。 | design-demo 的浦锦/七宝主链事件和 effective selector 为真。 |
| P4-02 | 完整主链 taskId 不变。 | Group A event/service spy。 |
| P4-03 | Find Resource 与 Execution Identity 显式分离。 | r01 ref 与 `resourceId: r01` 不同字段/值。 |
| P4-04 | 禁止名称映射 canonical Metric。 | Group C 禁用 `findMetricByQuery` / name lookup 的测试。 |
| P4-05 | Current Solution Query 不重新 Find。 | Group B event 和 revision assertion。 |
| P4-06 | Current Turn 明确条件覆盖 inherited conditions。 | 浦锦覆盖 region，requirement 的 2026-08 保留。 |
| P4-07 | 未明确条件继承 Current Requirement。 | query requestedConditions 获得 task time/definition。 |
| P4-08 | 床位口径复用 Current Solution 做 Clarification。 | Group D，无 Search/Compare。 |
| P4-09 | Clarification selection 不执行。 | 选择前没有 query start/result；Submit 后才有。 |
| P4-10 | Direct Metric 后 Data Solution 仍存在。 | T01/T02 断言 solution和resource IDs不变。 |
| P4-11 | Calculation 使用 Current Effective Data Solution。 | plan core/resources/revisions 与 selector output 精确相同。 |
| P4-12 | Calculation 不使用 Conversation result values。 | service request 无 result values；design calculation只从 raw table。 |
| P4-13 | requirement变化后 old pending query/plan不可执行。 | Group E direct/plan guards。 |
| P4-14 | Old Result 仍可经 PR-3 ResultTarget 查看。 | revision后精确 A target/history test。 |
| P4-15 | Design Demo 数值统一。 | Group G 全部 six input / four ratio assertions。 |
| P4-16 | Default Mock 数值不受影响。 | Mock artifact existing values assertions。 |
| P4-17 | HTTP 不 fallback Mock/Design Demo。 | HTTP tests的 LIVE_QUERY/failed response assertions。 |
| P4-18 | Right Workspace 符合冻结合同。 | Group F + component tests。 |

## 20. IA-01～IA-16

| ID | Interaction acceptance | 验收证据 |
| --- | --- | --- |
| IA-01 | Find → Ask 不页面跳转。 | 同一 component/task/aside；只变 activeSurface。 |
| IA-02 | Right Workspace 只有一个 Host。 | 一次仅一个 activeSurface type；DOM 只有一个 aside host。 |
| IA-03 | Direct Query 时 Solution 只关闭不删除。 | T01 state assertion。 |
| IA-04 | Direct Query 使用轻量 runtime state。 | 只扩展 DirectMetricQueryState；无第二 context。 |
| IA-05 | Clarification 选择不执行。 | Group D。 |
| IA-06 | Clarification submit 成功后 collapse。 | `resolution.status === RESOLVED` UI/selector assertion。 |
| IA-07 | Query failure 保留已确认 definition。 | failure后的 resolved question、retry query assertion。 |
| IA-08 | Calculation 自动打开 GUI。 | AskPlan prepared 后 A3 `ASK_PLAN/CALCULATION`。 |
| IA-09 | Calculation run 时 Workspace 保持。 | running期间无 close event。 |
| IA-10 | Calculation → Result 使用 REPLACE。 | command/event order：REPLACE，无 close。 |
| IA-11 | Chart/Data 切换不执行。 | no service execute/turn and same result target/executedAt。 |
| IA-12 | Result A/B 切换不执行。 | no run/query and exact targets remain。 |
| IA-13 | Historical Result 明确只读身份。 | `RESULT_DETAIL + ResultTarget`、read authorization UI。 |
| IA-14 | Interpret historical result 时 Workspace 保持。 | PR-3 suppress-surface test，A remains open。 |
| IA-15 | Operation failure 不销毁 Task State。 | service-failure direct/plan/clarification preservation tests。 |
| IA-16 | 所有 Transition 不创建新业务 Task。 | Group A createTask spy / taskId invariants。 |

## 21. PR-4A / 4B / 4C Split

推荐保持三段拆分；当前结构支持该边界，且每段都可以独立审查而不让 Demo 掩盖生产 identity 缺口。

### PR-4A｜Continuity Contract & Identity

- `selectEffectiveDataSolution` 和 handoff/current guards；
- explicit Resource → ExecutionRef，r01 exact mapping；
- DirectMetricQuery source binding、resolved scope precedence、central stale protection；
- r04/r05 的 production-missing vs design-only 分类与 HTTP stop behavior；
- identity / stale / no-new-context 单元回归。

**必须评审后再进入 4B。** 特别是 r04/r05 production identity 的 backend 决策未确认时，4A 只能完成 safe block 与 Demo boundary，不能声称 production query。

### PR-4B｜Find → Direct Query / Clarification

- Current Effective Solution → Direct Metric route；
- T01/T02、no re-Find、scope inheritance；
- r04/r05 solution reuse clarification，T03/T04；
- F1/A1/A2 文案与 closed-surface行为；
- design-demo 的 Goal → Find → Direct / Clarification 路径和 fixture isolation tests。

### PR-4C｜Solution → Calculation → Result → History

- Current Effective Solution → AskPlan；
- A3 auto-open、T05/T06 same host replace；
- design-demo raw calculation得到 Result A/B；
- A4 Chart/Data 与 PR-3 A5 historical continuity，完整 E2E；
- HTTP AskPlan/backend dependency assertions和所有回归。

## 22. Risks & Blockers

### P0 blockers

1. **r04/r05 没有正式 canonical execution identity。** Registry 当前未登记这两个床位指标。没有 backend 输出/验证的正式 identity 时，HTTP/production 的直查和计算必须 blocked；仅 design-demo 能用明确的 private identities。
2. **生产 backend 实现不在仓库。** 现有 HTTP adapter 不足以证明 server-owned continuity、formal metric execution、AskPlan actual execution 或历史授权；不可由前端填补。
3. **当前 Design Demo 无完整 Find mainline。** 浦锦/七宝 goal 不匹配当前仅认“闵行”的 scenario，且 Demo fallback 到 Mock；P4 demo acceptance 需要专用、隔离的补齐。

### 必查风险（R1～R8）

| Risk | 防线 |
| --- | --- |
| R1 通过名字映射 Find Resource → Metric。 | executionRef exact-id + Registry exact lookup test；禁用 NLP/name fallback。 |
| R2 Data Solution 已 stale 还继续使用。 | effective selector 的两项 strict equality；run/result reducer source guards。 |
| R3 Direct Metric Query 创建新 Task。 | current task pipeline + createTask spy / Group A。 |
| R4 Ask 内部偷偷重新 Search。 | Group B/D event assertions、searchRevision不变。 |
| R5 Clarification 被做成 Resource Candidate Compare。 | selector只读 solution items；无 candidate events/COMPARE surface。 |
| R6 Calculation 从 Conversation 数值计算。 | plan/resource execution contract；service request/fixture raw-source tests。 |
| R7 Calculation → Result CLOSE + OPEN 导致跳动。 | T06 explicit replace/no-close test。 |
| R8 为 Continuity 新建第二份 Context Store。 | design review：只允许 Task的query source字段和selector派生，无新 store/type root。 |

### 当前产品合同与代码的直接冲突

- F1 当前仍显示“推荐就绪”，footer 仍显示“转入分析计划”，stale 文案仍说“不能进入 Ask Data”；这与“数据方案已就绪、可继续自然语言提问、不强调进入 Ask Data”的冻结 patch 直接冲突。
- 冻结主链要求浦锦/七宝 business goal 先形成 Solution，当前 scenario classifier 必须包含“闵行”，因此现在会走 generic clarification；与 P4-01 直接冲突。
- T01/T05/T06 的指定 surface commands 尚未实现；当前的同 host 技术能力存在，但不是完整的 PR-4 interaction contract。

## 23. Stop Conditions

在下列任一情况出现时，PR-4 实施必须停在相应 PR 的评审点，而不是用 Demo 伪装完成：

1. 不能为 r01 提供并 exact-validate 显式 canonical ref；
2. r04/r05 仍无 backend 权威 identity，却有人要求把 design id 当 production metric；
3. HTTP service 不能原子验证 task、source resource、revisions、scope、permission/plan 或返回 `LIVE_QUERY`；
4. 任何实现需要从聊天展示值、latest result、local cache、Mock 或 Design Demo 向 HTTP 回填数据；
5. 任一 transition 需要创建新 Task、第二 context store、第二 workspace host、或关闭再打开来替代 T06 replace；
6. PR-1/PR-2 Direct Metric lifecycle、PR-3 ResultTarget/authorization/no-latest-fallback 任一回归失败；
7. P4-01～P4-18、IA-01～IA-16 未得到真实 automated evidence或明确生产依赖结论。

满足上述安全条件之前，停留在计划/评审；不新增 endpoint、不提交、不推送，也不自动启动后续 PR。
