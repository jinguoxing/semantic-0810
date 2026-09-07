# PR-1 实施报告

## 范围与基线

- 工作分支：`codex/data-assistant-object-views`
- `PR1_START_SHA`：`31f9c6c0ff13fd964c4b1f94623f81534d249010`（`origin/v2026.9.4`）
- 未提交、未推送、未合并；未进入 PR-2 / PR-3。
- 开始时已有的未跟踪内容保持原样；本次在 `docs/implementation/data-assistant-five-views/` 新增本报告和界面取证。

## 已完成

1. 兼容扩展 `AskResultContent` 的结果模型：保留原有可选字段与旧展示回退，新增可选的结构化标量/表格、数值状态、结果引用和引用来源。数值使用类型化 `number`，不从旧文本解析。
2. 复用现有任务、事件、运行回调、`AskResultSnapshot` 和 `AskResultContent`。结果完成后，对话区保持紧凑摘要，右侧复用现有工作区显示完整结果；没有新建执行页或复制页面。
3. 右侧计划按当前主题显示“本次计算”、结果或计算依据。已完成结果提供互斥的“图表 / 数据”切换；展开结果、切换标签和查看依据均不触发重新计算。
4. Mock 结果只使用服务返回的显式事实值（浦锦街道 `14.2`、七宝镇 `16.5`），不从人口或床位推算数值；五图示例没有进入业务路径。
5. 保留既有权限重检、版本/关系、幂等与失效计划保护；没有增加指标入口、历史结果服务或新的分析引擎。
6. 评审修复：HTTP 模式只接受 `LIVE_QUERY`，拒绝服务端错误返回的 `MOCK_FIXTURE`；所有可绘制值均为 `0` 时仍显示图表并明确零值；执行期间的工作区切换立即复用现有表面策略和 Task 事件完成，迟到结果不会改写用户之后选择的面板。

## 实际修改文件

- 模型与状态：
  - `src/components/find_data/model/FindDataTask.ts`
  - `src/components/find_data/policy/surfacePolicy.ts`
  - `src/components/DataAssistantFindDataWorkspace.tsx`
- 展示与运行入口复用：
  - `src/components/find_data/blocks/AskResultContent.tsx`
  - `src/components/find_data/blocks/InlineAskReady.tsx`
  - `src/components/find_data/RightWorkspaceAskPlan.tsx`
  - `src/components/find_data/presenters/conversationPresenters.ts`
  - `src/components/find_data/services/MockFindDataService.ts`
- 自动化验证：
  - `src/components/find_data/__tests__/componentAndStore.test.tsx`
  - `src/components/find_data/__tests__/conversationPresenters.test.ts`
  - `src/components/find_data/__tests__/findDataService.test.ts`
  - `src/components/find_data/__tests__/httpFindDataService.test.ts`
  - `src/components/find_data/__tests__/workspacePipeline.test.tsx`
  - `e2e/find-data-rc1.spec.ts`

## 路径状态

| 路径 | 状态 | 说明 |
| --- | --- | --- |
| 当前执行计划 → 权限重检 → 运行回调 → 对话紧凑结果 → 右侧完整结果 | 已完成 | 沿用现有 `Task/Event` 和运行回调。 |
| 右侧结果的图表 / 数据切换、查看计算方案 / 依据 | 已完成 | 只切换当前 `AskResultSnapshot` 的展示状态，不执行查询。 |
| Mock 截图中的 14.2 / 16.5 和“演示数据” | 仅演示 | 由 `MockFindDataService` 隔离提供，未混入 HTTP 或断连模式。 |
| 真实服务返回结构化结果、真实引用 | 等待服务依赖 | 既有 HTTP 接口可选返回 `resultArtifact`；服务需提供 `resultRef`、类型化内容、实际范围和引用，前端才显示真实结果。 |
| 历史结果服务、指标入口、分析引擎 | 不在 PR-1 | 留给后续 PR，不在此分支新增。 |

## 服务依赖与兼容

- 不新增 HTTP 端点。`AskRunResult.resultArtifact` 为可选兼容字段；旧结果字段仍可展示。
- HTTP / Disconnected 不会回退为 Mock 成功结果；Mock 服务仅在显式 Mock 模式使用。
- 真实图表只消费服务返回的结构化表格与图表配置；缺少图表配置时只显示数据，绝不补算或臆造数值。

## 验证记录

| 命令 | 实际结果 |
| --- | --- |
| `bun run lint` | 通过（`tsc --noEmit`）。 |
| `bun run test` | 通过：11 个文件，175 个测试（含评审修复覆盖）。 |
| `bun run test:smoke` | 通过：Mock 2/2，HTTP 1/1。首次执行发现旧断言仍查找已移除的“Ask Data 分析计划”标题；仅更新为 PR-1 的结果工作区与标签断言后复跑通过。 |
| `VITE_FIND_DATA_MODE=mock bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=disconnected bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=http VITE_FIND_DATA_API_BASE=/api/find-data bun run build` | 通过。 |
| `git diff --check` | 通过。 |

构建均保留现有的 Vite 大包提示（压缩后主 JS 超过 500 kB），不是本次失败项。Mock 人工流程完成后，浏览器仅记录开发服务器 `favicon.ico` 404；不影响本次路径。

## 界面取证（Mock，演示数据）

- 图 03：`evidence/pr1/03_calculation-plan_mock.png` — 同一右侧工作区中的“本次计算”与唯一执行入口。
- 图 04（图表）：`evidence/pr1/04_result-workspace_chart_mock.png` — 完整结果与从零起点的结构化数值图表。
- 图 04（数据切换取证）：`evidence/pr1/04_result-workspace_data_mock.png` — 切换后显示同一快照的数据表，无运行按钮。

## 停止条件

初始 PR-1 实现已按确认后提交为 `493e7d1`；本次评审修复仍留在工作树，未提交、未推送、未合并，也未进入 PR-2 / PR-3。等待复审确认后再继续。
