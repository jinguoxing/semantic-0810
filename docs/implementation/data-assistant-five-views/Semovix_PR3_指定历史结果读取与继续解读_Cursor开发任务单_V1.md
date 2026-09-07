# Semovix 数据助手｜PR-3 指定历史结果读取与继续解读｜Cursor 开发任务单 V1

**性质：** PR-2 Freeze 之后的下一笔增量开发。  
**前置条件：** 只有在 PR-2 Final Closeout Patch 完成、评审通过并形成最终 SHA 后才允许实施。  
**基线规则：** PR-3 必须基于实际 PR-2 Freeze SHA，不得从旧 `56ca49c` 或 `origin/v2026.9.4` 重新起分支覆盖现有成果。

## 1. 一句话目标

让数据助手能够把某一次已经产生的结果作为独立、只读、可引用的任务对象：用户可以查看指定历史结果、打开它当时的完整结果与依据，并继续针对这份结果提问；查看/解释历史结果不会切换当前计划、不会恢复旧计划、不会重新执行旧查询，也不会拿最新结果替代。

PR-3 对应五图中的 **05｜指定结果继续追问**，同时补齐 04 结果对象在历史状态下的读取能力。

## 2. 核心产品规则

1. 结果是可引用对象，不是“当前 AskPlan 的附属 UI”。
2. 查看结果 ≠ 选用结果 ≠ 恢复计划 ≠ 重新执行。
3. 历史结果 A 与当前结果 B 可以同时存在；查看 A 不改变 B。
4. 用户明确说 A，就只使用 A；不能默认 `latest`。
5. “这个结果”存在歧义时，只澄清是哪一份结果，不重复问时间、地区、口径。
6. 历史结果的定义/依据只能来自该结果当时携带的快照或实际服务；没有就明确未提供。
7. 生产环境读取历史结果必须重新满足当前读取授权；浏览器缓存不是授权。
8. 解释结果只做证据支持的描述、比较与限制说明；没有因果证据就不能补原因。
9. 只有用户明确要求重算，才进入新的有效计算链；不能恢复旧 plan 直接 Run。

## 3. 不做范围

不建设 Result Registry / Version Center、Dashboard、报告分享、Query Replay、通用分析工作台、通用因果/预测/优化引擎、新任务系统、新权限系统、新右侧栏或新的执行页。

## 4. 当前基础与真正缺口

已有：`ASK_RESULT`、`AskResultSnapshot`、`AskResultArtifact`、`AskResultContent compact/full`、`AskPlanBinding`、`DirectMetricResultBinding`、`resultRef?`、`citations?`、`actualScope`、当前结果打开保护、迟到结果保护、HTTP/Mock/Disconnected/Design Demo 隔离。

PR-3 需要补：
- 从历史对话中定位某个结果；
- 结果只读打开不依赖当前 AskPlan；
- 明确结果目标传给后续追问；
- 结果引用不明确时只做对象澄清；
- 历史定义/依据跟随原结果；
- 生产历史读取与当前权限边界；
- 解释历史结果时不改变当前计划。

## 5. 最小结果定位模型

优先复用现有 `AskResultSnapshot`、`AskResultReference`、`AskPlanBinding`、`DirectMetricResultBinding`。建议增加轻量定位对象：

```ts
export interface ResultTargetRef {
  taskId: string;
  turnId?: string;
  blockId?: string;
  resultRef?: AskResultReference;
  binding: AskPlanBinding | DirectMetricResultBinding;
  executedAt: string;
  label?: string;
}
```

硬规则：`ResultTargetRef` 只表达“我要查看/解释哪份结果”，不是重新执行凭证。它不得直接转成 `AskPlanRunRequest`，不得恢复旧 `askPlan`，不得回退 `requirementRevision/searchRevision`。

服务端有稳定 `resultRef` 时优先使用；仅本地演示时可使用 `taskId + turnId + blockId` 定位，但不能冒充生产 resultId。

## 6. Selector 与历史结果派生

建议新增纯派生 Selector，不复制 History Store：

```ts
selectResultSnapshots(task)
selectResultTargetByRef(task, target)
selectCurrentViewedResult(task)
```

`selectResultSnapshots` 从 `task.turns -> ASK_RESULT` 派生全部可见结果，返回 target、snapshot、turnId、blockId、isCurrent、displayLabel。

展示名优先使用：`metricName + actualScope + 口径/定义名称`，例如：
- 在营可用床位比较 · 2026 年 8 月
- 核定床位比较 · 2026 年 8 月

## 7. 右侧工作区

历史结果必须成为与当前可执行计划解耦的只读“结果对象视图”。推荐：

```text
SurfaceType = RESULT_DETAIL
RightWorkspaceResultDetail
```

它仍由现有右侧宿主承载，不是新的右栏或工作台。主体继续复用：

```tsx
<AskResultContent snapshot={snapshot} mode="full" />
```

最小内容：结果身份、执行时间、实际范围、来源、原口径、图表/数据、已有依据。历史结果默认只读，可有“查看本次依据”“解读这份结果”，禁止出现“恢复计划”“重新执行旧计划”。

如果现有 Surface 能安全承接，可以不新增枚举；但禁止为了省枚举重新把历史结果绑回当前 AskPlan。

## 8. Conversation 动作

每个 `ASK_RESULT` compact block 保留“查看完整结果”“查看指标口径/查看本次计算依据”，并增加：

```text
解读这份结果
```

该动作必须携带精确 `ResultTargetRef`，不能只传 label，也不能只发“解释一下”。

## 9. Turn 必须携带结果目标

生产服务不能只看到 UI 高亮 A、后台却按 latest B 回答。建议兼容扩展 Turn：

```ts
export interface TurnTargetContext {
  resultTarget?: {
    resultRef?: AskResultReference;
    binding: AskPlanBinding | DirectMetricResultBinding;
    executedAt: string;
  };
}
```

`submitTurn(task, text, operationId?, context?)`。

客户端只提交结果身份，不提交浏览器拼出的结果事实、SQL、旧 plan 或权限决定。生产服务必须重新核验 result 是否属于该 task、当前是否可读、是否仍存在。

## 10. 结果指代规则

优先级：
1. 点击“解读这份结果” → 精确 target；
2. 当前明确打开某个结果 → viewed target；
3. 文本明确说出唯一结果名称/口径 → 唯一匹配；
4. 当前任务只有一份结果 → 可直接引用；
5. 多份都可能匹配 → 澄清。

禁止默认 latest。

## 11. 歧义时复用 ClarificationBlock

若同时有：
- A｜在营可用床位比较 · 2026 年 8 月
- B｜核定床位比较 · 2026 年 8 月

用户说“解释这个结果”，且当前没有明确 viewed target，则只问：

> 你希望解读哪一份结果？

提交文案：`解读此结果`。选择不查询；提交后绑定 target 并发起解释 Turn。

## 12. 冻结业务场景

Result A：
- 浦锦街道 15.0 张/千人
- 七宝镇 20.0 张/千人
- 差异 5.0 张/千人

Result B：
- 浦锦街道 22.5 张/千人
- 七宝镇 25.0 张/千人
- 差异 2.5 张/千人

用户：

> 回到在营可用床位那份结果，解释浦锦街道为什么比七宝镇低。

系统必须绑定 A。回答可以确认 A 的差异，但必须说明：当前结果没有返回机构规模、投入、床位利用、建设节奏等原因证据，因此不能据此判断差异原因。禁止补造“建设不足”“投入更多”“应新增 X 张床位”“政策目标”等结论。

## 13. 分析边界

PR-3 只允许：
- 描述：谁高谁低、相差多少、时间/地区/口径；
- 已有结果分解：只有 result 自身返回了分组/构成/因子才可继续；
- 限制：明确哪些问题当前结果不能回答。

不做原因推断、预测、策略推荐、建设规模建议，除非服务已经返回明确方法与证据。

## 14. 历史查看与当前任务必须隔离

若 `current askPlan = B`、`viewing result = A`，打开 A 后必须保持：

```text
task.askPlan = B
requirementRevision = current
searchRevision = current
current directMetricQuery = current
```

只改变 viewed result / activeSurface。绝对禁止 `TASK_HYDRATED(old task)`、恢复 A 的旧 askPlan 或回退 revision。

## 15. 重算边界

查看 A / 解释 A → 不执行。

只有用户明确说“把 A 改成 2026 年 9 月重新算”才进入新请求/新计划；即使这样，也不能恢复 A 旧 AskPlan 直接执行，必须重新走当前权限与版本校验。

## 16. 权限与缓存边界

Local / Mock / Design Demo 可读取当前 Task 中保存的 snapshot 验证交互。

HTTP / Production：浏览器存在旧 snapshot 不等于今天仍然有权看。真实服务能授权返回历史结果则消费；不能时补最小合同。生产读取被拒绝时显示“这份历史结果当前不可读取”，不得 fallback 到缓存、latest 或 design-demo。

## 17. 迟到响应保护

解释 A 等待时用户切到 B / 关闭右侧 / 切换任务，A 返回后可以进入原任务历史，但不得抢回 A 工作区、覆盖 B 或跨任务显示。继续复用 operationId、task identity、surface navigation sequence、binding identity，不新建第二套异步状态机。

## 18. 建议修改文件

| 文件 | PR-3 职责 |
|---|---|
| `FindDataTask.ts` | 最小 ResultTarget / Turn target / Surface target 类型 |
| `findDataSelectors.ts` | 派生历史结果、按 target 精确定位 |
| `surfacePolicy.ts` | 历史结果只读打开，不依赖当前 AskPlan readiness |
| `DataAssistantFindDataWorkspace.tsx` | viewed result、打开/关闭、后续 Turn 携带 target |
| `AskResultContent.tsx` | “解读这份结果”精确动作 |
| `RightWorkspaceAskPlan.tsx` | 不再承担任意历史结果恢复 |
| `RightWorkspaceMetricResult.tsx` | 如可复用则抽共用结果正文 |
| 可新增 `RightWorkspaceResultDetail.tsx` | 轻量历史结果对象视图 |
| `FindDataService.ts` | submitTurn 兼容 result target context |
| `HttpFindDataService.ts` | 发送 target identity，不发送客户端结果事实 |
| Mock / Design Demo | A/B 历史结果与歧义演示 |
| Disconnected | 明确历史读取/解释不可用 |
| tests | PR-3 回归 |

## 19. 必测场景

- PR3-01：A/B 两份结果同时存在；
- PR3-02：current plan=B，open A 后 current plan 仍是 B；
- PR3-03：open A 不调用 `runAskPlan` / `RUN_METRIC_QUERY`；
- PR3-04：“解读这份结果”向服务发送 A 的 target；
- PR3-05：解释 A 不能使用 B 数值；
- PR3-06：“回到在营可用床位那份结果”唯一解析 A，不澄清；
- PR3-07：“解释这个结果”且无 viewed result、A/B 并存 → 只澄清结果对象；
- PR3-08：已打开 A 后输入“为什么这里更低？” → target=A；
- PR3-09：A 引用 v1、当前 registry=v2 → 仍显示 v1；
- PR3-10：A 无 citation → 显示未提供，不取 current registry；
- PR3-11：生产历史 resultRef 当前不可读 → blocked，不显示缓存；
- PR3-12：解释 A 等待时用户打开 B → A 返回不抢回；
- PR3-13：关闭右栏不取消解释 Turn，返回后不自动 reopen；
- PR3-14：查看 A 不出现执行旧计划；明确重算才走新请求；
- PR3-15：PR-1 / PR-2 / Find 主路径无回退。

## 20. Freeze 验收

| 编号 | 必须满足 |
|---|---|
| AC-P3-01 | 历史结果可从 Task 对话稳定定位 |
| AC-P3-02 | 查看历史结果不要求它仍是当前 AskPlan |
| AC-P3-03 | 查看 A 不改变当前 B 的计划、需求、资源选择 |
| AC-P3-04 | 查看历史结果不触发重新查询 |
| AC-P3-05 | “解读这份结果”携带精确 ResultTarget |
| AC-P3-06 | HTTP 后续 Turn 能携带服务器可验证的 result identity |
| AC-P3-07 | 明确指向 A 时不得使用 latest B |
| AC-P3-08 | 指代不清时只澄清结果对象 |
| AC-P3-09 | 历史结果读取原 citation，不以最新定义替代 |
| AC-P3-10 | 缺少历史依据时如实说明 |
| AC-P3-11 | 无当前读取权限时不得展示缓存结果 |
| AC-P3-12 | 解释结果不自动恢复旧 plan |
| AC-P3-13 | 无因果证据时不生成原因、预测或建设规模建议 |
| AC-P3-14 | 迟到解释不抢用户当前工作区 |
| AC-P3-15 | PR-1 / PR-2 / Find Data 原主路径无回退 |

## 21. 设计演示数据边界

若需要复现图 05，只使用批准样例：
- 浦锦街道：20,000 老人；300 在营可用；450 核定；15.0 / 22.5 张每千人；
- 七宝镇：40,000 老人；800 在营可用；1,000 核定；20.0 / 25.0 张每千人；
- 时间：2026 年 8 月末。

不得补全区平均、其他街镇、政策目标、其他月份、原因数据、来源页码、认证日期。继续标注“设计演示数据，非真实业务统计”。生产 HTTP 不得 fallback 到该数据。

## 22. Cursor 第一轮：只做 PR-3 Plan

```text
请基于当前已经冻结的 PR-2 最终提交，准备 PR-3：
“指定历史结果读取与继续解读”。

本轮先计划，不修改业务代码，不提交、不推送。

先核对：
1. 实际 HEAD 与 PR-2 Freeze SHA；
2. ASK_RESULT / AskResultSnapshot / resultRef / binding 当前实现；
3. 当前 AskPlan / Direct Metric 结果打开逻辑；
4. 历史结果是否只存在 Conversation Snapshot；
5. HTTP Task 是否已经返回历史结果和 current read permission。

目标：
- 历史结果成为同一数据助手内的只读结果对象；
- 查看 A 不影响当前计划 B；
- 查看不执行；
- 后续解释携带精确 result target；
- A/B 不明确时只澄清哪份结果；
- 原定义/依据跟随历史 snapshot；
- 无证据不补原因；
- 生产读取不能用浏览器缓存绕过权限。

优先复用现有 AskResultSnapshot、AskResultContent、AskResultReference、
AskPlanBinding、DirectMetricResultBinding、ClarificationBlock、operationId、
surface navigation protection、HTTP/Mock/Disconnected/Design Demo 模式。

不要建设 Result Registry、版本中心、报告、分享、Replay 或新分析引擎。

输出：
docs/implementation/data-assistant-five-views/PR3_PLAN.md

必须包含：当前代码事实、最小 ResultTarget 设计、历史结果 Selector、
Surface 实现方案、Turn target contract、HTTP 依赖、变更文件、测试、停止条件。
完成后等待确认，不开始实现。
```

## 23. Cursor 第二轮：实施 PR-3

```text
我确认 PR3_PLAN.md。

现在实际实施 PR-3：指定历史结果读取与继续解读。
严格按批准计划修改代码，不自动进入后续功能。

必须做到：
1. 从当前 Task 的历史 ASK_RESULT 中精确定位结果；
2. 历史结果完整查看不再依赖当前 AskPlan readiness；
3. 打开历史结果只更新 viewed result / surface，不改 askPlan、需求版本、搜索版本或当前 Direct Metric 请求；
4. compact result 的“查看完整结果 / 解读这份结果”携带精确 ResultTarget；
5. 用户后续追问时，把服务可验证的 result identity 传入 Turn；
6. 明确说 A 就解释 A，不能 fallback 到 latest；
7. 多份结果指代不清时复用 ClarificationBlock，只澄清结果对象；
8. 历史定义和依据只从该 snapshot / 服务读取，缺失时明确未提供；
9. 无因果证据时只能描述差异与限制，不生成原因或建设建议；
10. 生产读取服从当前授权，缓存 snapshot 不得绕过权限；
11. 解释返回较晚时不能抢回用户已经切换/关闭的右侧工作区；
12. 查看结果不得调用 runAskPlan 或 RUN_METRIC_QUERY。

Design Demo 可使用批准的 A/B 两份床位样例；
HTTP/Disconnected 不能 fallback 到演示成功。

完成后实际运行当前仓库已有 lint、test、所有现行多模式 build、test:smoke、git diff --check。

输出：
docs/implementation/data-assistant-five-views/PR3_REPORT.md

报告必须写：实际 PR3_START_SHA、改动文件、A/B 历史结果路径、HTTP 真正接通/未接通部分、Design Demo 部分、测试真实结果、图 05 的实际实现截图、最终 Commit SHA 或未提交。

完成后停止，不继续扩展产品。
```

## 24. Cursor 第三轮：只读评审

```text
请对 PR-3 做只读评审，不修改代码，不提交，不推送。

以 PR3_REPORT.md 记录的 PR3_START_SHA 为起点，只审本轮实际 diff。

重点检查：
1. 查看历史结果是否偷偷修改当前 askPlan；
2. 是否通过 TASK_HYDRATED(old task) 恢复旧计划；
3. 是否存在 open result → runAskPlan / RUN_METRIC_QUERY；
4. 是否出现 latest fallback；
5. A/B 指代是否会串结果；
6. HTTP 是否只传 result identity，而不是客户端结果事实；
7. 缓存 snapshot 是否可能绕过当前权限；
8. 历史定义是否错误读取 current registry；
9. “解释为什么”是否生成无证据因果；
10. 迟到解释是否抢回用户当前 Surface；
11. PR-1 / PR-2 主路径是否回退。

每个问题按 BLOCKER / MUST_FIX / NON_BLOCKING / FOLLOW_UP 分类。
不要把报告、分享、周期任务、通用因果分析等未排期能力列为 PR-3 缺陷。
```

## 25. 最终冻结条件

PR-3 Freeze 必须证明：A/B 两份结果同时存在；用户明确查看 A；右侧打开 A；当前 Plan B 不变化；继续解释 A 时服务收到 A 的 ResultTarget；回答只使用 A 的事实与依据；无原因证据则明确不能判断原因；不重跑 A；不恢复 A 的旧计划；用户切换/关闭后迟到响应不抢工作区。

真实 HTTP 历史读取若尚无服务合同，必须明确标记“生产依赖未接通”；这不会阻止已批准的本地交互组件冻结，但不能宣称生产历史结果能力已全部上线。
