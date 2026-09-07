# PR-3 计划：指定历史结果读取与继续解读

## 基线与前置核对

- 当前分支：`codex/data-assistant-object-views`。
- 实际 HEAD / PR-2 Freeze：`4bb7b95a5c11a1ef544f10d7841602eb2364904c`；其 PR-2 实施提交为 `56ca49cf9082aeff9fff866645d14dbbdee18b3c`。未从旧基线或 `origin/v2026.9.4` 重起。
- 交接证据：`PR2_REPORT.md` 记录 PR-1/PR-2 的结果快照、直查 identity、模式隔离与真实测试；`PR2_CLOSEOUT_REVIEW.md` 记录 FC-01～FC-15 已通过及生产直查服务依赖。
- 本次开始时没有暂存或未暂存的代码改动；工作区有此前保留的未跟踪材料（含本目录的输入、证据与截图），一律不覆盖、不纳入本轮提交。未发现适用的 `AGENTS.md`、贡献或编码规则文件。

## 当前代码事实与缺口

- 每个 `ASK_RESULT` 已在 `task.turns` 内保存不可变 `AskResultSnapshot`；其中可带 `resultRef`、`citations`、结构化数值、实际范围、`AskPlanBinding` 或 `DirectMetricResultBinding`。这正是唯一的本地历史来源，不新建 History Store / Result Registry。
- `AskResultContent` 已复用紧凑/完整正文、图表/数据切换和快照引用。当前完整打开却仅允许“当前” AskPlan 的同次 `lastRunResult`，或“当前”直查 `directMetricResult`；历史 A 在当前 Plan B 时会被拒绝。
- `findDataSelectors` 只有历史适用性提示和旧执行证据，没有“全部结果 / 精确定位 / 当前查看结果”纯 Selector。`SurfacePolicy` 只有 `ASK_PLAN`、`METRIC_RESULT`，均以当前状态作门禁。
- 现有本地 Surface 动作不调用服务；`operationId`、task identity 与 `surfaceNavigationSequence` 已可阻止迟到响应覆盖当前任务/展示。`submitTurn` 目前只有 text 与 operationId；HTTP 仅向既有 `/tasks/:id/turns` 发送这两项。
- HTTP `getTask` / Task 类型尚没有“某份历史 resultRef 在当前访问者仍可读取”的可验证合同。因此浏览器里已有 snapshot 不能作为生产历史读取授权依据。

## 最小设计与兼容方式

1. 在 `FindDataTask.ts` 增加轻量 `ResultTargetRef`：`taskId`、本地 `turnId`/`blockId`、可选服务 `resultRef`、原 binding、`executedAt` 和显示 label；增加仅含可验证身份的 `TurnTargetContext`。它不是运行凭证，不能转换为 `AskPlanRunRequest`，不能恢复旧 plan、revision 或权限。
2. 在 `findDataSelectors.ts` 从 `turns -> ASK_RESULT` 纯派生 `selectResultSnapshots`、`selectResultTargetByRef`、`selectCurrentViewedResult`。服务提供稳定 `resultRef` 时优先它；仅 local/mock/design-demo 可用 `taskId + turnId + blockId`。匹配必须同时核对 binding 和执行时间，不得取 latest。
3. 扩展现有 `SurfaceState` / `SurfaceCommand`，以精确 ResultTarget 打开同一右侧宿主的只读 `RESULT_DETAIL`（或等价最小枚举）。打开只写 viewed target 与 Surface；不得 `TASK_HYDRATED(old task)`，不得改 `askPlan`、需求/搜索版本、资源选择或当前直查请求。关闭只关闭 Surface。
4. 新增轻量 `RightWorkspaceResultDetail.tsx`，复用 `AskResultContent mode="full"`、原图表/数据切换及快照 citations。原定义、计算依据与来源只从该 snapshot / 服务返回引用展示；缺失明确“本次未提供”，绝不以当前 registry 或当前 Plan 替换。`RightWorkspaceAskPlan` 不再用于恢复任意历史结果；可抽取而不复制已有 Metric 结果的只读正文。
5. `AskResultContent` 的“查看完整结果 / 本次依据 / 解读这份结果”统一传递完整 ResultTarget，而非 label。查看是纯 Surface 操作；“解读”捕获 target 后才创建普通 TURN，永不触发 `runAskPlan` 或 `RUN_METRIC_QUERY`。
6. 结果指代按：点击精确 target → 当前明确打开的 target → 文本唯一命中名称/口径 → 任务内仅一份结果 → 仅澄清结果对象。A/B 并存且不明确时复用 `ClarificationBlock`，问题只问“解读哪一份结果”，选项也只来自派生结果；选择本身不查询。明确 A 绝不 fallback 到 B/latest。
7. `FindDataService.submitTurn` 兼容扩展第四参数 `context?: TurnTargetContext`。HTTP 仍使用既有 `/tasks/:id/turns`，仅在请求体增加 result identity（`resultRef`、binding、`executedAt`），不发送数值、SQL、旧 plan、citation 内容或客户端权限判断。Mock 保持原 Find Data 业务 fixture；五图 A/B 仅放在显式 `design-demo` 适配器；Disconnected 继续明确失败，HTTP 不得回退到任一演示结果。
8. 解释回复按发起时的 taskId、operationId、精确 target 与 surface navigation sequence 落入原任务历史。用户已打开 B、关闭右侧或切换任务时，A 的迟到回复可留在 A 所属对话，却不得重新打开 A、覆盖 B 或跨任务显示。没有服务给出的因果证据时，演示/本地回答只陈述 A 的差异、范围和限制，不编造原因、预测或建议。

## 生产服务依赖

生产历史打开和继续解读须由服务端核验：result 属于 task、当前调用者仍有 read 权限、结果仍存在，且返回的定义/依据为该历史结果的原始引用。当前仓库没有该 read-authorization / 不可变历史结果合同。

实施时不新增臆造 URL：由现有 `GET /tasks/:id` 返回已按当前授权过滤的历史 snapshot，或由已有 `/tasks/:id/actions` / `/turns` 合同提供同等服务端核验，二者择其已有服务能力。没有合同或服务拒绝时，HTTP 显示“这份历史结果当前不可读取”，不得以 local cache、latest、Mock 或 Design Demo 补齐。该依赖未接通时，本地交互可冻结，但不得宣称生产历史读取上线。

## 拟改文件

| 文件 | 最小职责 |
| --- | --- |
| `src/components/find_data/model/FindDataTask.ts` | ResultTarget、查看目标、Turn context 与最小 Surface 类型。 |
| `src/components/find_data/model/findDataSelectors.ts` | 历史结果纯派生、精确 target 定位、当前 viewed result。 |
| `src/components/find_data/model/findDataEvents.ts`、`findDataReducer.ts` | 仅记录/清理查看目标及 target 关联的对话状态，保留原 revision、binding 和迟到门禁。 |
| `src/components/find_data/policy/surfacePolicy.ts` | 精确历史结果只读打开策略；不再以 current AskPlan readiness 判断历史快照。 |
| `src/components/DataAssistantFindDataWorkspace.tsx` | 紧凑操作、Clarification 结果选择、Turn target 传递、右侧渲染与迟到保护。 |
| `src/components/find_data/blocks/AskResultContent.tsx` | 统一的完整 target payload 与“解读这份结果”入口。 |
| `src/components/find_data/RightWorkspaceResultDetail.tsx`（新增） | 同一右侧宿主中的历史结果 / 依据只读视图；按需复用 `RightWorkspaceMetricResult.tsx` 的定义正文。 |
| `src/components/find_data/{RightWorkspaceAskPlan.tsx,RightWorkspaceMetricResult.tsx}` | 只做必要的职责收口与共享正文，保留当前结果路径。 |
| `src/components/find_data/services/{FindDataService,HttpFindDataService,MockFindDataService,MetricQueryDesignDemoService,DisconnectedFindDataService}.ts` | 兼容 Turn context、HTTP identity 传递/拒绝、隔离 A/B 演示与未连接失败。 |
| `src/components/find_data/__tests__/*` | 增加下列回归；不引入新的产品服务或路由。 |

## 验证计划

- Selector / reducer：A/B 同时从 Conversation Snapshot 派生；精确 target 不匹配、latest fallback 和 `TASK_HYDRATED(old)` 均被拒绝；打开 A 后 current Plan B、revision、搜索版本与直查请求不变。
- Surface / UI：A 的完整结果、原 citation/definition、图表/数据可读；无 citation 显示未提供；打开、关闭、切换视图均不调用 `runAskPlan` 或 `RUN_METRIC_QUERY`。
- 对话：点击“解读这份结果”及唯一文字 A 向服务传 A；A/B 不明确只产生结果对象 Clarification；已打开 A 的代词继续绑定 A；解释 A 不能使用 B 数值或无证据因果。
- 异步：解释 A 等待时打开 B、关闭右栏、切换任务，A 的回复不抢 Surface；原 PR-1/PR-2 结果与直查 identity 回归。
- 模式 / HTTP：断言 HTTP body 只含 target identity，并在无授权/服务拒绝时 blocked；Mock 不混入五图 A/B；Design Demo 的批准床位样例仅以“设计演示数据”呈现；Disconnected 明确不可用。实际实现后运行 `bun run lint`、定向 Vitest、`bun run test`、mock/disconnected/http/design-demo 四种 build、`bun run test:smoke`、`git diff --check`。图 05 截图仅在 `design-demo`：A/B 并存、打开 A、Plan B 保持、继续解释 A 与无因果证据边界。

## 停止条件

仅当 AC-P3-01～AC-P3-15 均有实际测试或明确的生产依赖结论时，才进入 PR-3 Freeze：A 可独立只读打开、B 不变、查看不执行、解释携带 A 的精确 identity、歧义只澄清结果、引用保持历史、无权限不读缓存、无因果不补结论、迟到结果不抢工作区。此计划确认前不修改业务代码、不提交、不推送，也不进入任何后续 PR。
