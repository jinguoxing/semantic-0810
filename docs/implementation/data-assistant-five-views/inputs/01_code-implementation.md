# Semovix 数据助手｜五图功能接入代码实施说明 V1

**性质：**《五图实施映射与验收清单 V1》的代码落点附录，不新增产品主方案。  
**核验日期：**2026-09-06。  
**仓库：**`jinguoxing/semantic-0810`。  
**远端分支：**`v2026.9.4`（本地远端跟踪引用为 `origin/v2026.9.4`）。  
**本次读取提交：**`31f9c6c0ff13fd964c4b1f94623f81534d249010`。  
**提交说明：**`fix(find-data): sync inline selections and collapse completed confirmations`。  
**核验方式：**固定提交的相关源码与调用链阅读；没有修改仓库、执行测试或验证生产后端。下文明确区分“已读到的实现”与“建议增量”。

> 保留现有统一执行页、Task/Event、动作和运行门禁。在此基础上完善结果数据、指标入口、对象视图和历史读取。不是把五张图写成五套页面，也不是全部从头构建。

---

## 01｜最新代码已经具备什么

| 已有实现 | 当前源码事实 | 本轮处理 |
| --- | --- | --- |
| 统一执行页 | `DataAssistantFindDataWorkspace.tsx` 管理任务、对话、操作、右侧及模式选择。 | 继续作为唯一入口，不复制另一套 Workspace。 |
| 内嵌候选选择 | `ResultBriefBlock` 分发到 `InlineCandidateSelection`；对话与右侧比较共享选择草稿。 | 保留，不用新五图覆盖找数的已有效行为。 |
| 内嵌计算确认 | `InlineAskReady` 绑定明确计划，使用真实任务状态决定核验、运行及收拢。 | 保留逻辑，调整与右侧展开态的操作分配。 |
| 决策收拢 | `ClarificationBlock` 支持 OPEN/RESOLVED/STALE、显式提交、错误保留及只读历史。 | 复用为指标消歧的组件，不重建。 |
| 对话内结果 | 已有 `ConversationBlock.type = ASK_RESULT`，由 `AskResultContent` 呈现。 | 不再把“聊天只能显示文字”当现状。 |
| 紧凑/完整结果复用 | `AskResultContent` 已提供 `mode: compact | full`，右侧计划页也使用它。 | 扩展现有组件，不创建相互独立的 ChatResult 和 PanelResult 数据源。 |
| 结果快照 | `AskResultSnapshot` 包含计划绑定、运行时间、结果正文、名称及来源等。 | 保留原结果，不再说所有历史信息都只存在 lastRunResult。 |
| 动作与运行边界 | 已有门禁、运行标识、版本、失败处理及 HTTP/Mock/Disconnected 分界。 | 复用并做必要的类型分支，不全局放宽。 |

当前仍有明确限制：结果结构聚焦养老床位比较；右侧主要绑定当前 AskPlan；指标详情的问数/分析入口仍是 Toast；没有在当前数据助手服务合同中看到指定历史结果和指标定义的专门读取方法。这些是下文的接入点，不是要求重建平台。

源码依据：S01—S09、S11。

---

## 02｜本轮不能继续当作“仅改 CSS”

五图能落地，需要补齐三类承接：

1. **入口承接：**从指标、资源或已有方案进入时，携带明确对象，而不只是一个名称或提示 Toast。
2. **结果承接：**一个结果能在对话、右侧和历史追问中被正确引用，且数值与口径一致。
3. **服务承接：**定义、执行结果和授权来自实际合同；没有服务时只在隔离演示中验证交互。

允许在现有类型上做必要的增量；“不重构 Task”不应被解释为“缺少结果字段也不能补”。反过来，也不应为这些增量重做整个任务、会话、数据库和权限架构。

---

## 03｜五图与当前实现的差距

| 图 | 现有基础 | 需要的增量 |
| --- | --- | --- |
| 01 正式指标直接回答 | TEXT、RESULT_BRIEF、指标登记数据、统一执行页。 | 明确指标入口与请求、数值结果结构、轻量标量展示、本次定义读取。`DIRECT_METRIC` 只是已有 briefKind 名称，不代表整条查询已接通。 |
| 02 指标口径澄清 | 通用 Clarification、提交与失效规则。 | 把真实可见指标定义候选绑定到问题；提交后继续原指标请求；不使用候选资源自动推荐规则替用户选择口径。 |
| 03 本次计算方案 | AskPlan、InlineAskReady、RightWorkspaceAskPlan 和受控运行。 | 整理对象视图；区分内嵌确认与完整方案；保持一次主要执行操作；不强制每次查询先看方案。 |
| 04 完整结果/依据 | ASK_RESULT、snapshot、compact/full 复用。 | 数值化标量/表格结果、轻量图表、同结果的图表/数据切换、本次实际依据查看。 |
| 05 指定结果追问 | 历史 ASK_RESULT 中已有部分完整展示快照。 | 从指定历史快照/服务引用读取，而不是仅当前计划；历史依据绑定；解读请求携带结果目标；当前访问授权。 |

这五项不以五个菜单或路由实施。必要的内部展示类型属于原工作区的内容选择，不是新增工作台。

---

## 04｜修改点一：统一壳层与执行操作的显示位置

### 4.1 文件

- `src/components/DataAssistantFindDataWorkspace.tsx`
- `src/components/find_data/blocks/ResultBriefBlock.tsx`
- `src/components/find_data/blocks/InlineAskReady.tsx`
- `src/components/find_data/RightWorkspaceAskPlan.tsx`

### 4.2 当前事实

执行页标题仍使用“数据助手 · 找数据”，空态偏向“请输入找数据意图”。同一个计划可以同时通过 InlineAskReady 与右侧工作区显示执行操作。已有状态和回调应保留，不新写第二套执行逻辑。

### 4.3 建议实施

页面身份统一为“数据助手”，任务标题继续显示当前任务；不为此重命名所有文件/目录。保留 BrandLogo、XinoAvatar、导航和任务历史的来源，样式按统一母版进行有限调整。

| 展示状态 | 操作位置 |
| --- | --- |
| 右侧关闭、当前计划适合轻量确认 | InlineAskReady 承载原核验和运行操作。 |
| 用户打开同一份完整计算方案 | 对话留下摘要/状态，右侧承载主要确认和执行操作。 |
| 已完成或历史计划 | 只读确认摘要；不显示重新执行旧计划按钮。 |
| 用户查看另一对象 | 不把另一对象的操作伪装为当前计划动作。 |

显示方式的变化不修改历史业务决策，不删除历史回答。右侧打开不自动发起运行；关闭不代表取消运行。

---

## 05｜修改点二：在现有结果合同中补数值与定义引用

### 5.1 已读到的限制

`AskRunResult.resultArtifact` 当前要求 `benchmarkLabel`、`summary`、`townResults`、`boundaryNotice` 等养老比较字段。`townResults.supplyRatio` 为带单位的字符串；人口、床位主要是汇总显示字符串，没有设计图要求的每行人口和床位原始数值。

因此不能只给 AskResultContent 装一个图表组件，再从文字反向猜单位、数据或汇总含义。

### 5.2 最小扩展要求（建议，不是现有字段声明）

在既有 `AskRunResult` / `AskResultSnapshot` 中明确以下含义，优先复用已有字段：

| 含义 | 要求 |
| --- | --- |
| 精确结果身份 | 优先使用服务稳定结果引用。旧演示块可由 taskId + turnId + blockId 在当前任务中唯一定位，不冒充正式服务 resultId。 |
| 结果形态 | 区分标量和表格；指标查询不被迫填写街镇数组和比较基准。 |
| 标量值 | 数值、单位、显示精度、空值/不可计算含义分别表达。 |
| 表格值 | 列标识/类型/单位及行值；图表的数据由此产生。数值或十进制编码按实际服务合同，不自行丢失精度。 |
| 实际范围 | 统计时间、地区、人群和粒度来自结果；请求范围不得替代实际覆盖。 |
| 原口径引用 | 指标 ID 和实际使用版本，或本次计算定义/计划引用。 |
| 来源与限制 | 延续 dataOrigin、boundaryNotice 等；缺失即明确未提供。 |

建议做兼容增量：新增有判别信息的数据内容，旧 `townResults` 路径保留兼容显示。新内容存在时，明确它是数值视图的来源；旧文本只是兼容显示，不保留两份可独立修改的业务数据。

只有旧格式且无法确认数值语义时，继续显示旧表或说明暂不支持图表，不调用 `parseFloat` 等方式从 `"14.2 张 / 千人"`、`"41.2 万人"` 推导统一业务数据。

### 5.3 文件落点

- `model/FindDataTask.ts`：兼容扩展结果与必要引用。
- `model/findDataEvents.ts`、`model/findDataReducer.ts`：只对新字段的接收、结果保存和失效规则作必要兼容；不替换原任务事件体系。
- `presenters/conversationPresenters.ts`：扩展结果快照与展示派生，不编造业务发现。
- `services/FindDataService.ts` 与适配器：消费确定的数据合同。

### 5.4 图表不是新的计算引擎

比率、指标聚合及业务结论应由相应查询/计算逻辑产生。展示层只负责选列、格式化和画图，不从结果行数推出偏低数量，不将可见预览当全区全集。原 benchmark 与床位口径规则保持。

---

## 06｜修改点三：扩展 AskResultContent，不创建两套结果页面

### 6.1 文件

- `src/components/find_data/blocks/AskResultContent.tsx`
- `src/components/find_data/RightWorkspaceAskPlan.tsx`
- `src/components/DataAssistantFindDataWorkspace.tsx`
- 如单文件过大，可抽一个纯展示的小图/表子组件；命名按项目约定。

### 6.2 展示规则

| 内容与操作 | 对话区 | 右侧原工作区 |
| --- | --- | --- |
| 单个指标 | 名称、数值、单位、时间、人群及必要口径入口。 | 默认关闭；明确看定义时打开。 |
| 简单比较 | 简短答案 + 小表或单一小图，不同时堆完整图表/表格。 | 按需展开。 |
| 用户已展开完整结果 | 保留答案及必要限定；不要默认再复制完整数据。 | 图表/数据两种视图，一次呈现当前视图。 |
| 先看内嵌结果再展开 | 原消息保留。 | 同一结果展开，不再次运行。 |
| 依据查看 | 必要时一句解释。 | 用同一工作区查看定义/公式/实际来源，返回原结果与视图。 |

结果结构暂不支持图表时，显示数据而不是错误图；无数据、不可计算和数值 0 必须区分。

实现图表时先使用仓库实际已有组件和能力。当前 package.json 没有 Recharts，不可直接照搬参考仓库 import 后声称可运行。简单双柱图可以使用适合当前项目的轻量实现；是否新增依赖属于实现选择，不是本次要求引入完整可视化框架。

### 6.3 本次计算方案内容整理

右侧分清当前要看的对象主体：计划、结果或依据。`focusSection` 目前主要用于滚到同一长页的某处，不能仅滚动定位就宣称已经完成对象视图切换。

可从当前 RightWorkspaceAskPlan 抽出计划正文和结果正文，由同一个右侧宿主选择内容。查看结果时不必永远在其上方摆完整计划和权限卡；查看计划时不能提前出现结果。

---

## 07｜修改点四：接通明确指标入口与口径澄清

### 7.1 入口事实

`App.tsx` 的 MetricDetailWorkspace / DataAssetDetailWorkspace 的 `onEnterChatQuery`、`onEnterAnalysis` 当前是 Toast。主执行页主要接收 `initialQuery`，`FindDataService.createTask` 也只有初始文本参数。

`src/data/metricRegistryData.ts` 已登记指标定义和引用，例如 `met_elderly_population`；这是仓库内已有数据定义，不等于真实查询服务已经接通。

### 7.2 接入方式

统一一个进入数据助手的内部处理函数，复用现有导航。携带业务所需的最小上下文：入口来源、对象引用、已有明确条件和原问题。建议新名字可用 `entryContext`，它是实现提案，不是当前已有字段。

不同入口分别处理：

- 指标详情：传指标身份和定义引用，不只传展示名称。
- 资源详情：传真实资源身份，不自动补齐不存在的业务关系。
- 当前数据方案：在当前任务内承接，不新建任务导致资源与口径丢失。
- 历史结果动作：传明确结果引用，按下节处理。

App 当前前置分支按 `currentNav === metric_detail/asset_detail` 判断。入口接线不能只 `setViewTab('data_assistant')`，否则原详情分支仍可能优先命中；需将 currentNav/viewTab 按现有工作台入口一起切到正确状态。不为此重写全局路由。

初始化必须防止同一个入口上下文因重渲染重复创建任务或自动重跑查询。显式进入新的任务与恢复旧任务分开；不是看到 initialQuery 非空就重复消费。

### 7.3 统一 ID，不能靠名字猜绑定

仓库存在 `met_*` 指标登记引用、`res-*` 资源引用及找数演示 `r01/r04/r05`。不要假定它们天然是同一个 ID 空间。

使用真实来源提供的关联；若本地演示需要映射，放在显式演示适配中，校对定义/版本后绑定。不能把 `r01` 无条件当成任意名为“老年人口”的指标。

### 7.4 直接查询不能套进床位比较门禁

当前 `selectAskHandoffReadiness` 对 minhang_bed_supply 要求人口和床位 Core；`validateAnalyticalAlignment` 按组合分析检查关系和默认维度。直接查人口指标不能为了通过这条门禁，创建一份假的人口+床位方案。

在现有查询/计划合同内明确“正式指标查询”与“本次组合计算”的输入区别。可采用最小判别分支，旧计划按原语义兼容，不要求重写整个方案模型。

- 正式指标查询：检查该指标实际依赖、适用版本、必要条件、可用维度、数据覆盖和权限。
- 组合计算：继续现有资源角色、关系、时间、粒度与执行校验。
- 指标自身若也依赖多源/多指标，仍检查真实执行依赖，不能以“正式指标”为由跳过关联和授权。
- 不删除原门禁，不用空 Core 或 `return true` 让所有指标直接通过。

`expectedSearchRevision` 等旧字段怎样用于未发生找数的任务，应按既有版本合同兼容；不伪造一次搜索事件只为了凑齐状态。

### 7.5 澄清组件复用

第 02 张使用 `ClarificationBlock`。选项来自实际可见定义，初始无选择；不要复用候选资源中的“推荐/第一个候选”自动兜底作为口径决定。

提交绑定当前 question 和选择值；成功更新决策，随后沿原请求继续。两项定义的查询权限分别处理，不因一项权限更多就替用户改口径。定义问答不跑数据查询。

---

## 08｜修改点五：分离历史读取与当前计划运行

### 8.1 当前保护必须保留

`canOpenAskResultDetails()` 要求快照与当前计划绑定匹配，并与 `lastRunResult` 的时间/运行一致；`surfacePolicy.askPlanCommand()` 打开结果还使用当前 AskPlan 和 `selectAskHandoffReadiness()`。

这种限制解释了当前为什么能看历史对话快照，却无法把任意历史结果作为右侧完整对象打开。它不能通过简单删除校验来解决。

### 8.2 最小增量

在现有工作区增加明确的“查看目标”。可以是少量对象视图状态或 typed action，具体命名不强制；它不是新菜单、新工作区或新版本中心。

| 路径 | 根据什么判断 | 必须保持 |
| --- | --- | --- |
| 当前计划运行 | 有效 task/plan/revision、原授权与关系等门禁。 | 继续使用 isCurrentAskPlanBinding 及现有运行合同。 |
| 历史结果读取 | 指定结果是否存在、所属任务及当前读取授权、所含原口径。 | 不要求当前方案重新可执行，不改写 task.askPlan。 |
| 结果解读 | 指定且当前可读取的结果及实际依据。 | 只解释不重跑，目标不明只澄清对象。 |

Mock/设计演示可从当前任务中精确定位旧 ASK_RESULT 块，复用其快照；HTTP 模式只有在服务明确授权返回历史结果时才消费其内容，否则补充现有服务的结果读取合同。不能因为浏览器还存有快照，就绕过撤销后的访问控制。

严禁通过 `TASK_HYDRATED(旧任务)`、恢复旧 askPlan 或改掉当前需求来打开历史结果；历史展示引用不成为执行授权。

### 8.3 历史依据不能从当前计划拼

现有快照并不包含页面合同所需的全部原定义、原输入和可定位来源。需要从本次运行产物保留相应快照/引用，或向实际服务读取。

旧结果没带这些内容，就说明“本次依据未提供/暂不可取得”；不能取最新 metricRegistry 对象或当前 plan 填补为历史事实。

### 8.4 指定结果追问

用户从“解读此结果”发起时，动作/Turn 必须携带目标。自然语言明确提到旧结果时，由当前适配器解析到同一结果引用；多个结果都可能被指代时复用澄清组件。

HTTP 的 `submitTurn` 当前只发 `{text, operationId}`。如目标必须由前端明确传入，可兼容增加目标引用；生产服务自行校验对象与权限。新字段不得只在 UI 存一份而服务完全不知道。

只实现描述、比较及当前确有方法支撑的解读。不能写死“原因是资源建设不足”，也不能靠多加一句限制来掩盖与结果无关的结论。

---

## 09｜定义与依据沿用原来源，不内嵌整个指标管理页

指标登记数据和详情页已存在。数据助手需要的是面向当前问题的只读定义片段，不是把 MetricDetailWorkspace 的创建、变更、发布等操作复制到右侧。

实现时复用可用定义数据及安全的只读内容；如需抽一个小组件，只抽展示职责。

`FindDataService` 目前没有专用 `getResult` / `getMetricDefinition` 等方法。名称只是需求语义，不强制新增同名 URL。先确认现有 Task 返回能否提供有权数据、是否已有指标服务，再决定最小适配方法。实际历史和来源合同缺失时只暂停相关部分，不要求建设通用证据库。

---

## 10｜推荐拆成三个增量 PR

以下是本轮五图工作的三个 PR，不是重新定义 V1.3 的 A/B/C 批次。

| PR | 目标 | 主要文件 | 验收范围 |
| --- | --- | --- | --- |
| PR-1 结果合同与共用视图 | 保留现有快照，补兼容数值载荷/引用；扩展 compact/full；清理计划/结果重复展示。 | FindDataTask、必要的 event/reducer、conversationPresenters、AskResultContent、RightWorkspaceAskPlan、执行页接线。 | 已有方案 → 原规则计算 → 对话结果 → 同结果展开 → 图表/数据切换。无新指标入口和通用分析要求。 |
| PR-2 明确指标入口与澄清 | App 真实承接 ID/定义与条件；正式指标查询分支；复用口径澄清和只读定义。 | App、必要的详情回调、服务及适配器、readiness 的最小分支、Clarification 接线。 | 图 01/02 的明确查值与口径选择；只缺时间就只问时间；不造人口+床位假方案。 |
| PR-3 指定历史结果与解读 | 结果阅读不再依赖当前可运行计划；原口径/依据读取；明确目标追问。 | SurfaceState/Policy、selectors、执行页查看目标、结果/依据视图、Turn/Action 目标传递。 | A/B 两份结果不串台；查看/解读 A 不改 B 的计划、不重跑；无权/失效不换最新。 |

PR-1 的数据引用应为后续历史读取保留正确身份，但不要求它一次完成所有生产历史服务。后续依赖不足时列明，只阻止该路径生产开放。

A 批次照原清单独立处理：当前提交中仍能看到无条件 scrollIntoView；不要把它重复拆进上述三个 PR。已有决策和确认收拢需要回归，但不重新开发。

### 10.1 开工的安全步骤

```bash
# 在已确认的仓库目录执行。存在未提交变更时先处理，不覆盖、不强制 reset。
git status --short
git remote -v
git fetch origin
git rev-parse origin/v2026.9.4
# 新提交若出现，只核对本次相关差异，不回退到旧 SHA。
git switch -c feat/data-assistant-object-views origin/v2026.9.4
```

这里只提供操作建议，本轮没有执行上述仓库命令。推送/合并沿团队原流程；不强制推送、不改远端冻结基线。

---

## 11｜数据样例与模式隔离

当前 `MockFindDataService` 的床位比较样例包括在营口径 14.2 / 16.5、核定口径 32.0 / 36.5；五图合同的设计样例则是 15.0 / 20.0、22.5 / 25.0。

两者是不同样例，不允许为了贴图直接把原回归 Fixture 替换掉。

| 模式 | 处理 |
| --- | --- |
| 原 Mock 业务回归 | 保持原样例及原预期，若加数值字段在同一事实来源中补充并核对；不编造原本没有的行级人口/床位。 |
| 五图设计验证 | 用明确隔离、标记设计演示的最小组件/适配器样例；复用同组组件，不另建五页脚本。 |
| HTTP | 消费后端实际对象与结果；失败不转本地 Mock；数据来源原样说明。 |
| Disconnected | 展示不可连接/能力未接入，不提供设计样例冒充业务结果。 |

图 04 的四列明细必须有实际行级数据支持。服务只返回比率时，不从汇总或比率倒推出人口和床位；允许按实际字段呈现并说明缺少内容。

---

## 12｜最小验收与已有测试落点

本附录沿用五图清单的验收含义，不增加新的产品功能。

| 验证 | 通过要求 | 可落点 |
| --- | --- | --- |
| 统一执行页 | 入口均进入当前 Workspace，无五套路由；新旧组件同壳层。 | workspacePipeline.test.tsx + 页面截图。 |
| 指标真实承接 | 对象 ID/版本传到实际服务；同名不同对象不串；不只是 Toast。 | 入口组件测试 + httpFindDataService.test.ts。 |
| 单指标与组合分流 | 单指标不被人口床位配对门禁卡住；组合门禁不放宽。 | findDataSelectors.test.ts / findDataService.test.ts。 |
| 口径澄清 | 未选择不可提交，选择不自动执行，成功收拢，失败保留，旧问题只读。 | clarificationBlock.test.tsx + workspacePipeline.test.tsx。 |
| 结果合同 | 标量/表格/旧格式兼容；缺字段不编数；0、空、不可计算分开。 | 新结果的就近测试 + conversationPresenters.test.ts。 |
| 紧凑/展开一致 | 两处单位、数值、范围相同；查看/切 Tab 不调用 runAskPlan。 | componentAndStore.test.tsx / workspacePipeline.test.tsx。 |
| 原运行保护 | 重复提交受控；旧计划仍拒绝；运行版本和授权保持。 | 现有 service、reducer 与 finalFreeze 回归。 |
| 历史查看 | A 的原数据/定义绑定正确，不改变 B 当前计划；不能恢复旧运行。 | selectors / surfacePolicy / workspacePipeline。 |
| 指定结果解读 | 只解读不重新查询；A/B 不明确只澄清；无依据不补原因。 | service/请求绑定测试。 |
| 迟到及失败 | 关闭/切换后不抢工作区；无权/失效/失败不回退最新或 Mock。 | workspacePipeline.test.tsx + HTTP 边界测试。 |

当前仓库已有上述测试文件，但本轮没有运行它们，也没有报告测试数量或 CI 成功状态。

沿用原脚本（该提交含 bun.lock）：

```bash
bun install --frozen-lockfile
bun run lint
bun run test
VITE_FIND_DATA_MODE=mock bun run build
VITE_FIND_DATA_MODE=disconnected bun run build
VITE_FIND_DATA_MODE=http VITE_FIND_DATA_API_BASE=/api/find-data bun run build
bun run test:smoke
```

`lint` 当前为 `tsc --noEmit`，不另装 ESLint；依赖与运行环境不满足时如实报告未运行部分。新增字段需要兼容旧任务恢复，不重置用户历史来通过测试。

交付说明必须分列：实现文件、实际完成的路径、演示路径、未接的服务、真实测试结果、独立实际页面截图。静态设计图不能作为实现截图。

---

## 13｜可直接交给编码模型的本轮执行摘要

```text
仓库：jinguoxing/semantic-0810
目标基线：origin/v2026.9.4
本说明读取提交：31f9c6c0ff13fd964c4b1f94623f81534d249010

先 fetch 并记录当前 SHA；如果更新，只检查本轮相关文件差异，不覆盖新提交。
依据现有五图实施清单及本附录，按 PR-1 → PR-2 → PR-3 推进。
本次先执行 PR-1，完成后提交改动与真实测试结果，再进入下一 PR。

保留 DataAssistantFindDataWorkspace、Task/Event、候选/方案区分、
InlineCandidateSelection、InlineAskReady、ClarificationBlock、
ASK_RESULT、AskResultSnapshot、AskResultContent compact/full、
原权限/版本/关系门禁及 HTTP/Mock/Disconnected 边界。

不得重新写五个页面；不得将找数、问数、指标、分析做成四套助手。
不得替换原业务 Fixture 来贴合设计数字。
不得仅凭截图取消权限核验，或向 HTTP 执行端提交浏览器拼出的公式/SQL。

PR-1：在既有结果合同内兼容补足数值/形态/引用；完善现有紧凑与完整视图。
没有可信数值字段时保留旧文本/数据视图，不解析展示字符串猜数值。
对话允许标量、小表、小图，右侧按需展开；计划/结果/依据只在原宿主内切换。
同一计划完整打开时避免双重主要执行按钮；原回调和门禁不变。

后续 PR-2：用明确对象引用接通指标入口，复用澄清，按正式指标实际依赖检查，
不创建假的人口+床位方案，不把元数据可见当数值可查。
后续 PR-3：将历史读取和当前执行分开；旧 ASK_RESULT 快照可在演示中精确定位，
生产读取仍需实际服务授权；查看 A 不恢复 A 旧计划，不拿 B 替代。

如需要最小新增类型/服务字段，明确兼容方式；不要因“不重构”而伪装已有能力，
也不要扩展成新引擎、新权限中心、证据库或结果版本平台。
只暂停缺少实际合同的相关路径，其他可完成部分继续。

输出：基线/改动文件/完成路径/数据依赖/演示与真实模式/测试及未运行项。
不得宣称本次已完成全量生产找数、问数和分析。
```

---

## 14｜固定源码索引

以下是本次实际读取的关键源码，不代表后来移动分支永远保持该提交。

- [S01 执行页](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/DataAssistantFindDataWorkspace.tsx)
- [S02 Task、Plan、Result 与快照类型](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/model/FindDataTask.ts)
- [S03 共用结果内容](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/blocks/AskResultContent.tsx)
- [S04 ResultBrief 分发](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/blocks/ResultBriefBlock.tsx)
- [S05 内嵌计算确认](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/blocks/InlineAskReady.tsx)
- [S06 口径等澄清组件](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/blocks/ClarificationBlock.tsx)
- [S07 当前右侧计划/结果工作区](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/RightWorkspaceAskPlan.tsx)
- [S08 Surface Policy](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/policy/surfacePolicy.ts)
- [S09 选择与执行就绪](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/model/findDataSelectors.ts)
- [S10 页面入口接线](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/App.tsx)
- [S11 数据助手服务合同](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/services/FindDataService.ts)
- [S12 HTTP 适配器](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/services/HttpFindDataService.ts)
- [S13 原 Mock 适配器及数值](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/services/MockFindDataService.ts)
- [S14 仓库指标登记数据](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/data/metricRegistryData.ts)
- [S15 闵行场景请求处理](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/src/components/find_data/scenarios/MinhangBedSupplyScenario.ts)
- [S16 构建与测试脚本](https://github.com/jinguoxing/semantic-0810/blob/31f9c6c0ff13fd964c4b1f94623f81534d249010/package.json)

相关源码中存在的能力、字段和入口以该固定提交为准；本文“建议”“最小扩展”等段落为面向五图目标提出的实施方案，不作为已经实现或已经测试通过的声明。
