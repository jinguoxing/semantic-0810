# PR-3 实施与 Final Closeout 报告：指定历史结果读取与继续解读

## 起点与范围

- 分支：`codex/data-assistant-object-views`
- `PR3_START_SHA`：`4bb7b95a5c11a1ef544f10d7841602eb2364904c`（PR-2 Freeze）
- `PR3_IMPLEMENTATION_SHA`：`01b946f1ce3a6e39f1ca9cf9715ae2ee2d0bb28c`（已提交并已推送）。
- `PR3_CLOSEOUT_SHA`：`1bb9e861a3a3b58f221b3b43eb0411691ec85374`（Previous Freeze Candidate / PR-3 Final Closeout Patch）。
- `GUARD_START_SHA`：`4c65904438dfc134b952da3c926b294c7cb5cc00`（Freeze Report Commit）。
- `PR3_FINAL_FREEZE_SHA`：`789cd68cfbff3048835832528e0e1f111d33470b`（PR-3 Final Freeze Guard Patch）。
- 仅实施同一数据助手内的历史结果只读打开与精确继续解读；未建设 Result Registry、版本中心、Replay、Dashboard、报告分享、通用分析或新执行页面。
- 开始前已有的未跟踪材料均保留且未纳入本轮代码范围。

## 实际修改文件

### 实现

- `src/components/find_data/model/FindDataTask.ts`
- `src/components/find_data/model/findDataSelectors.ts`
- `src/components/find_data/policy/surfacePolicy.ts`
- `src/components/DataAssistantFindDataWorkspace.tsx`
- `src/components/find_data/blocks/AskResultContent.tsx`
- `src/components/find_data/RightWorkspaceResultDetail.tsx`（新增）
- `src/components/find_data/services/FindDataService.ts`
- `src/components/find_data/services/HttpFindDataService.ts`
- `src/components/find_data/services/MockFindDataService.ts`
- `src/components/find_data/services/MetricQueryDesignDemoService.ts`
- `src/components/find_data/services/DisconnectedFindDataService.ts`

### 回归

- `src/components/find_data/__tests__/historicalResultViews.test.tsx`（新增）
- `src/components/find_data/__tests__/httpFindDataService.test.ts`
- `src/components/find_data/__tests__/metricQueryDesignDemoService.test.ts`

### Final Closeout Patch

- `src/components/find_data/model/findDataSelectors.ts`
- `src/components/DataAssistantFindDataWorkspace.tsx`
- `src/components/find_data/blocks/AskResultContent.tsx`
- `src/components/find_data/RightWorkspaceResultDetail.tsx`
- `src/components/find_data/__tests__/historicalResultViews.test.tsx`
- `src/components/find_data/__tests__/metricResultViews.test.tsx`
- `e2e/find-data-rc1.spec.ts`

## PR-3 结果

| 目标 | 实际结果 |
| --- | --- |
| 独立历史结果 | `selectResultSnapshots` 从当前 Task 的 `turns -> ASK_RESULT` 派生，按 task、turn/block 或服务 `resultRef`、binding、执行时间精确定位；没有 latest fallback。 |
| A 与当前 B 隔离 | 新 `RESULT_DETAIL` 仅写 `activeSurface.resultTarget`。不 hydrate 旧 Task，不恢复旧 AskPlan，不改当前 Plan、需求/搜索 revision 或当前 Direct Metric 请求。 |
| 查看不执行 | 紧凑块的完整结果/依据为本地 Surface 动作；测试断言不调用 `runAskPlan` 或 `RUN_METRIC_QUERY`。右侧仍复用现有宿主与 `AskResultContent` 的图表/数据切换。 |
| 精确解读 | “解读这份结果”、明确结果名称/口径及已打开结果均向 `submitTurn` 传递精确 `TurnTargetContext.resultTarget`。HTTP 请求只含 `resultRef`、binding、`executedAt`，不发送缓存数值、SQL、旧计划、citation 内容或权限判断。 |
| A/B 歧义 | A/B 并存且无唯一指代时复用 `ClarificationBlock`，只问“解读哪一份结果”；选择本身不查询。 |
| 依据与因果边界 | `RightWorkspaceResultDetail` 只展示原 snapshot 的引用和定义；缺失时明确未提供，不读 current registry。Mock / Design Demo 解读只陈述本次差异、范围和限制；无原因证据时明确不能判断原因，不给预测或建设建议。 |
| 迟到保护 | target continuation 的服务响应只写回原 Task 对话，强制忽略 Surface command；用户打开 B、关闭右栏或切换任务后，A 的迟到回答不能重开/覆盖工作区。 |
| 模式隔离 | A/B 床位样例只在显式 `design-demo`；默认 Mock 没有混入五图样例；Disconnected 保持明确失败；HTTP 拒绝 Mock direct result。 |

## PR-3 Final Closeout Patch

| 项目 | Freeze 前修复结果 |
| --- | --- |
| P0-1 历史读取授权 | HTTP 仅允许当前结果或该 snapshot 的 `currentReadAccess === 'AUTHORIZED'` 展示 `AskResultContent`。未授权历史块和遗留的右侧详情只显示“这份历史结果当前不可读取”，不会渲染数值、表格、图表、citation 或缓存内容；其 target 也从文本解析、澄清候选、查看、继续解读中排除。明确提及不可读 A 时明确拒绝，绝不替换为当前 B。 |
| P0-2 解读意图 | 移除了“为什么 / 原因 / 差异”这一类宽泛入口。只有精确按钮 target、明确结果对象、已打开可读结果的限定追问，或单一可读结果且文字明确称“结果”时，才会送 `TurnTargetContext`。资源推荐、资源不可用和资源差异仍走原 Find Data turn。 |
| P0-3 Direct Metric | 当前 Direct Metric 以 `isDirectMetricResultBinding + resultSelection.isCurrent` 决定动作，不再用 `resultTarget` 是否存在判断。它保留 `OPEN_METRIC_RESULT`、`OPEN_METRIC_DEFINITION` 和携带精确 `ResultTarget` 的解读动作；查看口径只切换本地 Surface，不执行 `RUN_METRIC_QUERY` 或 `runAskPlan`。 |
| P1-1 无障碍文案 | `RightWorkspaceResultDetail` 的关闭按钮及 title 均为“关闭结果详情”；现有浏览器 smoke 同步更新。 |
| P1-2 服务与模式边界 | 没有新增 HTTP URL、权限系统或历史服务。HTTP 继续拒绝 Mock direct metric result；Mock、Disconnected、Design Demo 的已有隔离不变。 |

## PR-3 Final Freeze Guard Patch

| 项目 | 最终 Guard 结果 |
| --- | --- |
| 已知结果与可读结果分离 | 继续复用 `selectResultSnapshots` 取得 Task 中的已知结果，并以 `selectReadableResultSnapshots` 判断当前可读集；零个可读结果不再被当成“没有结果对象”。 |
| 显式不可读引用 | 对“解释这份结果”“解释结果 A”等已知结果的明确引用，即使所有历史结果都不可读，也先进入结果定位；定位后显示“这份历史结果当前不可读取，不能使用其他结果替代。”，不调用 `submitTurn`、`runAskPlan` 或 `RUN_METRIC_QUERY`。 |
| 不替代与不泄露 | 明确 A 在 A 不可读、B 可读时仍拒绝 A，绝不改解读 B；澄清候选仍只取可读结果，不会暴露不可读结果。 |
| Intent 收窄保持 | 仅在已有结果对象且出现既有的明确结果引用、可读的 viewed result 限定追问，或单一可读结果的“结果”表达时进入解释。没有结果对象时，以及“为什么推荐这个表？”这类资源问题，仍是原 Find Data turn，`context` 为 `undefined`。 |

本 Patch 未修改 `ResultTargetRef`、`TurnTargetContext`、`RESULT_DETAIL`、Direct Metric、AskPlan、HTTP endpoint、Find Data Gate 或任何 Design Demo 数值；也未新增权限服务、Result Registry 或后续 PR 能力。

## HTTP 生产依赖

客户端已传递服务可验证的历史结果 identity，并对 HTTP 历史快照要求 `currentReadAccess: 'AUTHORIZED'`；否则显示“这份历史结果当前不可读取”，不会用浏览器 snapshot、latest、Mock 或 Design Demo 兜底。

正式服务尚未提供可验证的历史 `resultRef` 当前读取授权与不可变引用合同（可由既有 `GET /tasks/:id` 返回经过当前授权过滤的 snapshot，或由既有 `/actions` / `/turns` 合同完成服务端核验）。因此：**本地组件路径已完成，生产历史读取/解释授权依赖未接通，不宣称已上线。**

## 图 05 实现取证

均为 `design-demo` 隔离数据，标注“设计演示数据，非真实业务统计”：

- A/B 同时存在：[pr3-05-history-ab_design-demo.png](/Users/kingnet/workspace/DataAI-workspace/semantic-0810/output/playwright/pr3-05-history-ab_design-demo.png)
- 右侧完整打开 A，保留 A 的 15.0 / 20.0 与图表：[pr3-05-open-a_design-demo.png](/Users/kingnet/workspace/DataAI-workspace/semantic-0810/output/playwright/pr3-05-open-a_design-demo.png)
- 继续解读 A，只说明 5.0 差异与无原因证据边界：[pr3-05-interpret-a_design-demo.png](/Users/kingnet/workspace/DataAI-workspace/semantic-0810/output/playwright/pr3-05-interpret-a_design-demo.png)

## 实际验证

| 命令 | 结果 |
| --- | --- |
| `bun run lint` | 通过（`tsc --noEmit`）。 |
| Final Guard 定向 Vitest（历史/Direct Metric/Surface/HTTP，4 文件） | 通过，43 项。含：零个可读历史结果时的“解释这份结果”“解释结果 A”明确阻断，以及“为什么推荐这个表？”仍走无 context 的原 Find Data turn。 |
| `bun run test` | 通过，16 文件、211 项。 |
| `VITE_FIND_DATA_MODE=mock bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=disconnected bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=http VITE_FIND_DATA_API_BASE=/api/find-data bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=design-demo bun run build` | 通过。 |
| `bun run test:smoke`（Mock + HTTP Playwright） | 通过：Mock 2 项、HTTP 1 项。 |
| `git diff --check` | 通过，无空白错误。 |

四种构建均仅产生既有的单 chunk 大小警告，没有失败。烟雾测试在受限环境的首次尝试因本地端口绑定被阻止；提升本地测试端口权限后实际通过。没有以“应该通过”替代未运行测试。

## 停止条件

FC3-01 ～ FC3-22 及 Final Freeze Guard 的三种零可读历史结果场景均已在现有客户端合同和明确的生产服务依赖边界内完成验证，PR-3 已 Final Freeze。正式历史 `resultRef` 当前读取授权与不可变引用的服务合同仍是外部生产依赖，未被客户端 Mock 或缓存替代。

已形成 Final Freeze 提交；本轮不开始 PR-4。
