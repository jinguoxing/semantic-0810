# PR-1 计划：结果合同与共用视图

## 基线与工作区

- 已刷新 `origin`。当前分支：`v2026.9.4`；`HEAD` 与 `origin/v2026.9.4` 均为 `31f9c6c0ff13fd964c4b1f94623f81534d249010`，共同祖先相同。本轮不回退该提交。
- 拟建（尚未创建）工作分支：`codex/data-assistant-object-views`。开始业务实现前记录 `PR1_START_SHA=31f9c6c0ff13fd964c4b1f94623f81534d249010`。
- 无已跟踪文件改动；既有未跟踪目录为 `.playwright-cli/`、`artifacts/`、`test-results/` 与 `docs/implementation/`。其中五图材料在本计划前已存在，均保留、不整理。本文件是本轮唯一新增文档。
- 未发现仓库内或上级目录适用于本仓库的 `AGENTS.md`、`CLAUDE.md` 或 `.cursor` 规则；依照本目录 README、输入说明及用户范围执行。

## 已有能力与缺项

- `DataAssistantFindDataWorkspace` 已复用同一壳层和 `ASK_PLAN` 右侧工作区；运行完成会保存 `askPlan.lastRunResult`、生成不可变 `ASK_RESULT` 会话快照，并以绑定、任务、操作 ID 和迟到响应检查保护当前界面。
- `AskResultContent` 已被对话紧凑态和右侧完整态共用，但只消费必填的 `townResults` 字符串、基准与汇总；没有规范化数值单元、结果引用、列/行合同或图表/数据切换。
- `RightWorkspaceAskPlan` 现在通过 `focusSection` 在同一长页滚动，计划、权限、结果同时出现；内嵌 `InlineAskReady` 与右侧都有校验/执行入口，已完成计划右侧还显示“重新运行”。
- `HttpFindDataService` 仅透传 `/tasks/:taskId/ask-plan/run` 的 JSON（并校验 `dataOrigin`）；仓库没有该 HTTP 端点的服务端实现。`MockFindDataService` 只有 14.2/16.5（或核定口径）字符串结果，不能从中反解析出图表数值或行级人口、床位。

## 拟改文件（实现获批后）

1. `src/components/find_data/model/FindDataTask.ts`：对 `AskRunResult.resultArtifact` 作**可选、向后兼容**扩展：稳定结果引用、实际定义/来源引用，以及有判别类型的标量/表格数值载荷（列、单位、数值单元、缺失/不可计算语义）。旧基准、摘要、`townResults` 保留为 legacy 路径；不再要求标量结果伪造街镇数组。
2. `src/components/find_data/presenters/conversationPresenters.ts`：将新载荷和引用原样带入 `AskResultSnapshot`，只派生显示文案、范围和格式；不从 `"14.2 张 / 千人"` 等 legacy 字符串解析数值。
3. `src/components/find_data/blocks/AskResultContent.tsx`：继续作为唯一结果内容组件。紧凑态只呈现答案所需的一个小表或小图；完整态从同一快照提供“图表 / 数据”互斥视图。仅在结构化数值存在时绘图；`0`、无数据、NULL/抑制和不可计算分别呈现。无行级字段时只显示服务实际给出的列。
4. `src/components/find_data/RightWorkspaceAskPlan.tsx`：保留右侧宿主，将 `PLAN`、`RESULT`、`CALCULATION` 变为当前对象主体，而不是同页堆叠和滚动定位。结果对象内保存 UI 级 `CHART | DATA` 选择，查看依据返回原结果及原 Tab；不新增第二栏或结果页面。
5. `src/components/DataAssistantFindDataWorkspace.tsx`、`src/components/find_data/policy/surfacePolicy.ts`：沿用 `OPEN_ASK_PLAN`、现有绑定和 `SurfaceState`，把对象/Tab 切换作为 UI 状态；点击时继续校验当前计划和精确执行时间，切换不得调用 `runAskPlan`、搜索或改版本。
6. `src/components/find_data/blocks/InlineAskReady.tsx`：右侧未打开当前计划时，内嵌块承载校验/执行；打开同一计划后仅保留摘要/查看入口，由右侧承载主要动作。已完成或失效/历史绑定只读，不显示重新执行。
7. `src/components/find_data/services/MockFindDataService.ts`：在原 fixture 的事实来源处按原值补可直接消费的结构化数值；不改写 14.2/16.5 等既有回归样例，也不由比率推导街镇人口或床位。若需要四列设计验收，另设清晰标记的隔离测试/演示适配，绝不混入生产或 HTTP 默认返回。
8. `src/components/find_data/services/HttpFindDataService.ts`（仅在服务端字段需要局部适配时）及相邻测试：消费服务端同一合同；HTTP 缺新载荷时退回 legacy 文本/数据视图，绝不退回 Mock 或补造引用。

`findDataEvents.ts` / `findDataReducer.ts` 预计不新建事件体系：类型扩展随既有 `ASK_RUN_COMPLETED` 保存。只有本地任务恢复的 schema 校验确有需要时才做最小兼容改动。

## 兼容、身份与动作规则

- 新结果优先使用服务稳定 `resultRef`；仅旧会话展示可用 `taskId + turnId + blockId` 精确定位，不能冒充服务端 `resultId`。PR-1 只展开当前 `lastRunResult`；旧快照无法读取时维持对话内容并明确不能恢复详情，不实现 PR-3 的历史读取服务。
- 新数值来自有类型的结果载荷，保留单位、精度、实际范围和引用；legacy `townResults` 仅兼容展示。数据不足时禁用/隐藏图表并给真实说明，绝不以空或零补齐。
- 对话紧凑态、右侧完整态和计算依据均消费同一不可变快照。图表/数据切换只改工作区 UI 状态；不重算、不覆盖历史消息、不抢回用户已切换的面板。
- 执行按钮只在一个主要位置出现：工作区关闭时在 `InlineAskReady`，打开当前计划时在右侧。权限、修订、关系和幂等门禁仍由既有运行链和服务端复核；完成后只读。

## 服务依赖与验证

- 可在 Mock 模式验证：结构化结果、legacy 回退、紧凑→完整同结果、图表/数据切换和单一执行入口。
- HTTP/生产可用的前提：`ask-plan/run` 返回稳定结果引用、实际范围、类型化数值/列行、定义或来源引用及既有 `dataOrigin`。当前仓库仅有客户端适配器；未提供的后端字段列为依赖，不在前端造数据。
- 计划补充/扩展的就近测试：`conversationPresenters.test.ts`、`componentAndStore.test.tsx`、`workspacePipeline.test.tsx`、`findDataService.test.ts`、`httpFindDataService.test.ts`，必要时 `findDataReducer.test.ts`。覆盖旧合同、数值 0/空/不可计算、精确绑定、Tab 不运行、关闭/切任务后的迟到结果，以及完成计划无重复运行入口。
- 获批实施后运行：`bun run lint`、`bun run test`、三种 `VITE_FIND_DATA_MODE` 的 `bun run build`，并执行 `bun run test:smoke`；图 03/04 在 1920×1080 截图核对。计划阶段未运行测试。

## 停止条件

- 本 PR 在同一工作区完成“当前有效计划 → 原门禁执行 → 同一结果紧凑/完整 → 图表或数据 → 同一结果依据”的闭环，并有上述测试和截图证据后停止。
- 不实现指标入口/口径澄清（PR-2）、指定历史结果读取与解读（PR-3）、新分析引擎、历史结果服务、指标管理入口或五套页面。
- 如 HTTP 合同、稳定结果引用、真实行级数值或可读来源缺失，仅交付可验证的已有数据路径和明确空态/依赖；不扩展后端、不放宽权限、不伪造数据，并等待确认后再开始实现。
