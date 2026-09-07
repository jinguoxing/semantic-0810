# PR-2 计划：明确指标查询与口径澄清

> 本文件只记录计划；未修改业务代码、未提交、未推送，也不进入 PR-3。

## 实际基线与 PR-1 承接

| 项目 | 已核对事实 |
| --- | --- |
| 当前分支 / HEAD | `codex/data-assistant-object-views` / `0a81e44b33483c31ed5de3aba25741cef58dd965` |
| 远端核对 | `origin/codex/data-assistant-object-views` 同为 `0a81e44`；`origin/v2026.9.4` 为 `31f9c6c0ff13fd964c4b1f94623f81534d249010` |
| PR-1 关系 | `31f9c6c` 是当前 HEAD 的祖先；承接提交为 `493e7d1 feat(find-data): add shared structured result views`、`0a81e44 fix(find-data): protect result view transitions`。 |
| PR-1 代码证据 | 已有结构化 `AskResultArtifact`、`AskResultContent` 紧凑/完整视图、右侧图表/数据切换、视图切换不运行查询、HTTP 仅接受 `LIVE_QUERY`、迟到结果不抢占当前面板的实现及测试。 |
| 计划/报告/评审记录 | `PR1_PLAN.md`、`PR1_REPORT.md` 和 `03_review_pr1.md` 可读但尚在未跟踪的 `docs/implementation/` 中；没有单独落盘的评审结论。报告末尾仍称评审修复“未提交”，与实际已提交并推送的 `0a81e44` 不一致，故不以该句作为状态依据。 |
| 当前工作树（写入本计划前） | 无已修改、暂存或新增的业务代码；已有未跟踪目录：`.playwright-cli/`、`artifacts/`、`docs/implementation/`、`test-results/`。保留不覆盖。 |

结论：PR-1 的可定位代码与远端提交已在本基线中，足以作为**PR-2 计划**前置；其报告末尾状态需后续勘误。实施 PR-2 时，以用户确认时仍有效的 HEAD 记录 `PR2_START_SHA`，不从 `origin/v2026.9.4` 重建分支，也不 merge/rebase。

## 已知落点与拟改文件

| 文件 | PR-2 最小职责 |
| --- | --- |
| `src/App.tsx` | 统一指标/资源详情进入现有数据助手；当前回调只传名称且只提示 Toast，改为传递真实入口上下文，并同时更新实际生效的导航状态。 |
| `src/components/MetricDetailWorkspace.tsx` | 将当前指标的精确 ID、可取得的版本/定义引用及用户动作传给 App；移除对“展示名即可查询”的依赖。`res-03` 与 `met_*` 的兼容回退不作为正式关联。 |
| `src/components/DataAssetDetailWorkspace.tsx` | 传递真实资源 ID 与已知条件。没有经服务确认的“资源→指标”关系时，只进入对象上下文，不冒充正式指标查询。 |
| `src/components/DataAssistantFindDataWorkspace.tsx` | 消费一次性入口上下文、保留“当前任务继续”语义，复用 Task/Event、运行回调和现有迟到响应保护；重挂载/重复点击不得重复建 Task 或执行查询。 |
| `src/components/find_data/model/FindDataTask.ts` | 新增可选、可版本化的入口对象引用与正式指标请求/定义/结果绑定类型；保留旧 `initialQuery`、旧组合 `AskPlan` 和 PR-1 结果字段。 |
| `src/components/find_data/model/findDataEvents.ts`、`findDataReducer.ts` | 仅在需要持久化入口、决策或失效关系时补充兼容事件；不重建状态机。 |
| `src/components/find_data/model/findDataSelectors.ts` | 增设“正式指标查询”就绪校验，按服务返回的定义、依赖、范围、版本和权限判断；原 `selectAskHandoffReadiness` 与组合计算的 Core/关系/粒度门禁保持不变。 |
| `src/components/find_data/services/FindDataService.ts`、`HttpFindDataService.ts` | 在既有 Task/Turn/Action 合同内承接对象引用、口径提交、定义读取和正式查询；先确认服务合同，不能杜撰新 URL 或浏览器执行能力。 |
| `src/components/find_data/services/MockFindDataService.ts`、`DisconnectedFindDataService.ts` | 仅按明确模式处理：原闵行组合 Mock 不变；如必须做视觉取证，另设显式、标注 `MOCK_FIXTURE` 的隔离测试/演示适配器。Disconnected 与 HTTP 失败绝不返回演示成功。 |
| `src/components/find_data/blocks/ClarificationBlock.tsx` | 复用现有未选中、显式提交、提交中、失败保留、已确认/失效收拢生命周期；按需兼容提交文案，口径选项不得带默认或 `recommended`。 |
| `src/components/find_data/blocks/AskResultContent.tsx`、`presenters/conversationPresenters.ts`、`RightWorkspaceAskPlan.tsx`、`policy/surfacePolicy.ts` | 复用 PR-1 标量与引用展示、右侧宿主和不运行查询的切换。正式指标结果不得伪造 `AskPlanBinding`：如服务合同需要，增加最小的只读结果快照联合类型/右侧定义 Surface，使“完整结果”和“查看本次定义”定位到同一不可变结果引用。 |
| 相应 `src/components/find_data/__tests__/...`、`e2e/find-data-rc1.spec.ts` | 为以下验证补测试；仅在真实改动涉及的测试文件中修改。 |

不把 `runtimeMetricResolver.ts` 的本地关键词回退、默认指标/时间或 SQL 计划接入正式查询；它不是可核验的数值服务。`metricRegistryData.ts` 可作为当前详情的展示来源，但不充当 HTTP 正式查询、定义授权或版本裁决来源。

## 兼容与执行边界

- 入口上下文为可选字段：旧入口继续使用 `initialQuery`；同一 `entryId` 只消费一次。任务恢复、任务切换和右侧展开均不得重新消费入口或重新运行。
- 三类语义分开处理：定义阅读只读；明确指标值只补实质缺项后按原服务策略运行；口径有歧义才生成真实可见选项。定义可见不等于数值可查。
- 原人口＋床位组合仍走原 Core、关系、时间、粒度、权限、幂等、版本和失效校验。直查分支不伪造搜索事件、Core 资源或 `READY` 状态来通过该门禁。
- `ClarificationBlock` 的提交只确认决定；查询成功、失败、超时和未知接受状态沿既有 operationId/回调分别反馈。请求变化后旧决定只读失效，迟到结果不得覆盖新请求。
- 标量答案仅展示服务返回的数值、单位、实际期间/地域/人群、采用定义版本和必要边界；没有值不能填图 01 的 `20,000`、不能用 `0` 代替缺失。图表/数据切换及定义查看仅切换已取得的快照。

## 必须先确认的服务依赖

当前 `FindDataService` 只有通用 Task、Turn、Action、权限重检与 `runAskPlan`；HTTP 适配器未提供可核验的正式指标直查或定义读取合同。因此实施前需确认服务能在既有接口中提供，或明确扩展：

1. 入口对象的权威身份、可用定义版本和已知条件；服务必须重新核验归属、版本、时间/维度、人群与权限。
2. 口径澄清题及选项的真实来源、提交幂等键、已接受但响应超时后的状态查询规则。
3. 正式指标运行的请求判别、异步 operationId、错误/无记录/无权/超时语义，以及不依赖组合 `AskPlan` 的校验依据。
4. 不可变的 `resultRef`、`METRIC_DEFINITION` 引用、实际查询范围、结构化标量/表格和 `LIVE_QUERY` 来源标识。

缺少上述任一生产合同时，HTTP 路径停止在明确错误/等待依赖状态；不得新增看似生产的本地成功回退。隔离演示如获准，只服务于截图与测试，显式显示演示来源，不混入原业务 Mock。

## 验证与图 01/02 取证计划

- 入口：指标详情精确 ID 与资源详情精确 ID 均能进入同一 Workspace；无可靠映射的资源不变成指标；重复点击、重挂载、任务恢复不重复建 Task/发请求。
- 校验：正式指标按服务依赖/版本/权限/实际范围运行；原组合分析仍拒绝空 Core、关系不明、旧计划和权限不足。
- 澄清：初始两项均未选、选择不运行、显式提交一次、确认与运行结果分离；提交失败保留选择；失效与迟到响应不改变新任务。
- 展示：标量、单位、范围、引用和“查看本次定义”来自同一响应；图表/数据/定义切换不新增运行调用；HTTP/Disconnected 失败不显示 Mock 成功。
- 回归：运行本次针对性单测、完整 `bun run test`、`bun run lint`，并按实际变更补充 Mock/Disconnected/HTTP 构建与烟测。所有未执行项在 PR-2 报告中如实列出。
- 图 01：以合同兼容的实际服务或显式隔离的 `MOCK_FIXTURE` 演示，截取同一助手内的标量答案、单位、实际范围、定义引用与来源标识。
- 图 02：截取同一任务内口径未选择、按钮禁用的状态；再单独取证已提交后才进入查询。截图不使用“人口＋床位”伪造路径，也不宣称演示数值是真实结果。

## 停止条件

本轮到此停止并等待用户确认。确认前不改业务代码、不创建服务接口、不制作成功回退、不提交/推送，也不开始 PR-3。实施中若 PR-1 基线变化、服务合同无法证明上述身份/权限/结果字段，或只能依赖本地默认指标/数值，立即停止该路径并记录缺口。
