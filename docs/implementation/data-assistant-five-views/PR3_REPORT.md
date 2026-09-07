# PR-3 实施报告：指定历史结果读取与继续解读

## 起点与范围

- 分支：`codex/data-assistant-object-views`
- `PR3_START_SHA`：`4bb7b95a5c11a1ef544f10d7841602eb2364904c`（PR-2 Freeze）
- 最终 Commit SHA：**未提交**（按本轮要求未 commit / push / merge）。
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
| PR-3 / PR-1 / PR-2 定向 Vitest（7 文件） | 通过，74 项。 |
| `bun run test` | 通过，16 文件、202 项。 |
| `VITE_FIND_DATA_MODE=mock bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=disconnected bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=http VITE_FIND_DATA_API_BASE=/api/find-data bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=design-demo bun run build` | 通过。 |
| `bun run test:smoke` | 通过：Mock 2 项、HTTP 1 项。 |
| `VITE_FIND_DATA_MODE=http VITE_FIND_DATA_API_BASE=/api/find-data bunx playwright test e2e/find-data-rc1-http.spec.ts` | 通过，1 项。 |
| `git diff --check` | 通过，无空白错误。 |

四种构建均仅产生既有的单 chunk 大小警告，没有失败。烟雾测试在受限环境的首次尝试因本地端口绑定被阻止；提升本地测试端口权限后实际通过。没有以“应该通过”替代未运行测试。

## 停止条件

本轮停止于 PR-3 实施与取证完成。未进入评审、Freeze、PR-4 或任何范围外功能；等待评审/后续指示。
