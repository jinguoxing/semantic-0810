# PR-2 实施报告：明确指标查询与口径澄清

## 起点与范围

- 分支：`codex/data-assistant-object-views`
- `PR2_START_SHA`：`0a81e44b33483c31ed5de3aba25741cef58dd965`
- 继承 PR-1：`493e7d1`（结构化结果与共用视图）和 `0a81e44`（结果视图切换保护）。`origin/v2026.9.4` 仍为 `31f9c6c0ff13fd964c4b1f94623f81534d249010`，未回退或合并。
- 本轮未提交、未推送、未合并；未覆盖既有未跟踪目录。

## 已完成改动

- 入口：`App.tsx`、`MetricDetailWorkspace.tsx`、`DataAssetDetailWorkspace.tsx` 以可选 `FindDataEntryContext` 传递真实对象 ID、版本、意图和已有条件；指标与资源不再按名称或假映射互换。详情进入会同时切换到原有数据助手页。
- 去重：`DataAssistantFindDataWorkspace.tsx` 按 `entryId` 一次性消费入口；重渲染/恢复不重复创建 Task 或重复发送查询。
- 状态与兼容：`FindDataTask.ts`、events、reducer、selector、store 扩展 `DIRECT_METRIC` 请求/结果绑定；原 `AskPlan`、Core/关系/权限/版本/失效门禁仍走原路径。迟到或版本不匹配的直查结果被 reducer 丢弃。
- 查询与模式：`FindDataService.ts`、HTTP、Disconnected、服务工厂及 `MetricQueryDesignDemoService.ts` 支持入口合同与独立直查动作。HTTP 传递入口并拒绝 `MOCK_FIXTURE` 直查结果；Disconnected 明确失败而不产生结果；原 Mock fixture 未混入五图数值。`design-demo` 是显式隔离模式，所有数值标注为设计演示数据。
- 交互：复用 `ClarificationBlock`，无默认选择；确认口径与执行查询为两个动作。复用 `AskResultContent`，新增同一右侧宿主的 `RightWorkspaceMetricResult.tsx`，可查看同次结果或同次定义，均不重新执行查询。
- 定义：设计演示中的“只看定义”不发起数值查询；结果中的“查看指标口径”仅使用该快照携带的 `METRIC_DEFINITION` 引用，缺失时不以最新定义替代。

实际修改的实现文件：

`src/App.tsx`、`src/components/MetricDetailWorkspace.tsx`、`src/components/DataAssetDetailWorkspace.tsx`、`src/components/DataAssistantFindDataWorkspace.tsx`、`src/components/find_data/model/{FindDataTask,createFindDataTask,findDataEvents,findDataReducer,findDataSelectors,findDataStore}.ts`、`src/components/find_data/{blocks/AskResultContent.tsx,blocks/ClarificationBlock.tsx,policy/surfacePolicy.ts,RightWorkspaceMetricResult.tsx}`、`src/components/find_data/services/{FindDataService,HttpFindDataService,MockFindDataService,DisconnectedFindDataService,createFindDataService,MetricQueryDesignDemoService}.ts`。

测试新增/更新：`detailEntryCallbacks`、`disconnectedFindDataService`、`httpFindDataService`、`metricQueryDesignDemoService`、`metricResultViews`、`surfacePolicy`、`workspacePipeline`。

## 路径状态与服务依赖

| 路径 | 状态 |
| --- | --- |
| 指标详情 → 同一执行页 → 已知条件直查 | 客户端接线与隔离设计演示已验证。 |
| 资源详情 → 同一执行页 | 客户端接线已验证；资源仍保留其真实 ASSET 身份，不承诺可查指标值。 |
| 图 01 标量、引用、同次定义 | 隔离设计演示已验证；不代表真实统计数据。 |
| 图 02 未选择 → 显式确认 → 单独查询 | 隔离设计演示已验证；选项无默认值。 |
| HTTP 正式指标查询/定义授权/幂等 | 客户端请求合同与拒绝 Mock 已验证；服务端尚未提供可验证的直查、定义、权限及超时恢复合同，故此生产路径待依赖。 |
| Disconnected | 已验证明确失败，不回退演示成功。 |

## 实际验证

| 命令 | 结果 |
| --- | --- |
| `bun run lint` | 通过（`tsc --noEmit`）。 |
| 定向 Vitest：PR-2/PR-1 相关 8 文件 | 通过，52 项。 |
| `bun run test` | 通过，15 文件、187 项。 |
| `VITE_FIND_DATA_MODE=mock bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=disconnected bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=http VITE_FIND_DATA_API_BASE=/api/find-data bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=design-demo bun run build` | 通过。 |
| `bun run test:smoke` | 通过：Mock 2 项、HTTP 1 项。 |
| `git diff --check` | 通过，无空白错误。 |

构建仅产生既有的单 chunk 超过 500 kB 警告，未失败。没有未运行的计划内测试。

## 图 01 / 图 02 实现取证

| 图 | 模式与操作 | 截图 |
| --- | --- | --- |
| 01 | `design-demo`；输入“查询指标：2026 年 8 月浦锦街道 60 岁及以上常住人口数”。显示 20,000 人、范围、版本引用和演示数据边界。 | `output/playwright/pr2-01-metric-answer_design-demo.png` |
| 02 | `design-demo`；输入“查询 2026 年 8 月七宝镇养老床位数”。两种口径均未选，提交按钮禁用。 | `output/playwright/pr2-02-metric-clarification_design-demo.png` |

另行在同一浏览器验证：选择“在营可用养老床位数”后才得到 800 张；“查看指标口径”打开同次引用的只读右侧面板，未触发新查询。

## 停止条件

PR-2 到此停止，等待只读评审。未开始 PR-3，也未新增指标治理、历史结果服务、分享、周期任务或分析引擎。
