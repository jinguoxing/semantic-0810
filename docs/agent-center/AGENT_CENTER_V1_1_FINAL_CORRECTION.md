# AGENT_CENTER_V1_1_FINAL_CORRECTION

> **Document Type**: Final Product Model Correction & Implementation Contract  
> **Product**: Semovix Agent Center  
> **Target Version**: V1.1  
> **Status**: Final Freeze Candidate Contract  
> **Repository Baseline**: `jinguoxing/semantic-0810`  
> **Baseline Branch**: `v2026.8.18`  
> **Baseline Commit**: `4d1a1f9c1b1ea0772a32bf9a05026d435ae0cd52`  
> **Recommended Working Branch**: `agent-v1.1-final-correction`  
> **Primary Goal**: 在现有实现上完成最后一轮产品模型修正与受控重构，使 Agent Center 达到 `Semovix Agent Center V1.1 Final Freeze` 条件。  
> **Important**: 本合同是本轮 Agent Center 改造的唯一产品与实现依据。除本合同明确要求外，不得自行扩展 Agent Center 功能、页面或技术概念。

---

# 1. Contract Purpose

本合同用于解决 `v2026.8.18` 当前 Agent Center 在接近冻结阶段仍存在的产品心智、创建流程、领域模型和运行边界问题。

当前分支已经具备以下正确基础，**必须保留，不得推倒重写**：

- A01 Agent Registry
- A02 Create Agent Drawer
- A03 Agent Definition Workspace
- A04 Agent Test & Publish
- `AgentDefinition`
- `AgentDraft`
- `AgentVersion`
- `AgentRuntimeBinding`
- `ManagedAgentPreset`
- `TaskTemplateBinding`
- `AgentRepository`
- `AgentService`
- `AgentRuntimeAdapter`
- `KnowledgeAgentCompiler`
- Release Gate
- Draft → Version → Runtime 的基本发布链路

本轮不是 Rewrite。

本轮定义为：

> **Product Model Correction + Controlled Refactor + Final Freeze Preparation**

最终目标不是建设通用 Agent Builder，而是让 Semovix V1.1 的受管智能体体系做到：

> **用户可理解、产品边界清晰、领域模型一致、状态闭环可信、后续 Runtime 可接入。**

---

# 2. Final Product Thesis

## 2.1 Xino 不属于 Agent Center

最终产品模型：

```text
Xino / Harness / Orchestrator
平台内部智能协调能力
负责：
- 理解用户目标
- 意图识别
- Task 路由
- 多智能体协调
- 上下文连续性
- 工作流入口协调

不属于用户可管理 Agent
不进入 Agent Center
              │
              ▼
────────────────────────────
Agent Center
────────────────────────────
内置智能体
├─ 数据智能伙伴
├─ 语义治理伙伴
└─ 企业知识伙伴

自定义智能体
├─ HR 制度知识助手
├─ 销售经营分析助手
├─ 客服政策知识助手
└─ ...
```

**禁止继续把 Xino 作为“第四个 Agent”展示。**

Xino 可继续存在于 AI Workbench、Harness、Intent / Orchestration 内部实现中，但：

- 不进入 Agent Registry
- 不进入 Agent Draft 生命周期
- 不进入 Agent Version 列表
- 不作为 Agent Center 的可编辑对象
- 不允许从 Agent Center 创建、修改、发布

---

# 3. User-facing Agent Classification

## 3.1 用户只理解两种类型

```text
BUILT_IN  → 内置智能体
CUSTOM    → 自定义智能体
```

新增：

```ts
export type AgentOrigin =
  | 'BUILT_IN'
  | 'CUSTOM';
```

`AgentDefinition` 增加：

```ts
origin: AgentOrigin;
```

## 3.2 禁止继续作为主用户概念展示

以下概念不得作为 Agent Registry 的主分类：

```text
SYSTEM
MANAGED
系统智能体
受管智能体
```

如果底层为兼容历史代码暂时保留 `agentKind`，允许内部继续使用，但 UI 不暴露。

---

# 4. Built-in vs Custom Governance Rules

## 4.1 内置智能体

V1.1 固定三个：

```text
数据智能伙伴
语义治理伙伴
企业知识伙伴
```

Domain：

```text
origin = BUILT_IN
```

治理规则：

| 配置项 | 内置智能体 |
|---|---|
| 名称 | 锁定 |
| 核心职责 | 平台维护，默认只读 |
| 核心 Task Family | 平台维护，不允许删除 |
| Owner | 可配置 |
| 工作范围 | 可配置 |
| Context Binding | 可配置 |
| Capability Preset | 可在平台允许集合内调整 |
| Model Policy | 可在平台策略范围内调整 |
| Max Autonomy | 可在平台上限内调整 |
| 删除 | 不允许 |
| 停用 | 允许 |
| 版本发布 | 允许受控发布 |

## 4.2 自定义智能体

Domain：

```text
origin = CUSTOM
```

治理规则：

| 配置项 | 自定义智能体 |
|---|---|
| 名称 | 可编辑 |
| 职责 | 可编辑 |
| Role Instruction | 可编辑 |
| Task Binding | 可在能力模板允许集合内调整 |
| Context Binding | 可配置 |
| Capability Preset | 可配置 |
| Model Policy | 可配置 |
| Max Autonomy | 可配置 |
| Owner | 可配置 |
| 未发布 Draft 删除 | 允许 |
| 已发布 Agent 物理删除 | 不允许，使用 Disable |
| 版本发布 | Release Gate 后允许 |

---

# 5. Runtime Product Boundary

## 5.1 Domain 必须保留 Runtime

以下技术对象继续保留：

```text
runtimeTarget
AgentRuntimeBinding
AgentRuntimeAdapter
RuntimeProjection
KnowledgeAgentCompiler
```

它们是平台执行边界，不应删除。

## 5.2 Runtime 不属于普通用户核心心智

普通 Agent Owner 不需要理解：

```text
WeKnora
Semovix Native
Runtime Revision
Runtime Projection
Runtime Agent ID
Sync Revision
```

用户真正关心：

```text
这个智能体能做什么
使用什么数据/知识
是否正常
是否有未发布修改
是否可以发布
```

## 5.3 Runtime UI 可见性

### 普通 Agent Owner

仅展示：

```text
运行状态：
正常 / 需关注 / 未发布 / 已停用
```

### Agent Admin

允许查看：

```text
发布准备
运行准备
运行依赖
```

### Platform / Technical Admin

高级信息中可查看：

```text
Runtime Provider
Runtime Agent ID
Revision
Sync Status
Health
Integration Mode
```

如果当前仓库没有角色体系，本轮不要建设完整权限系统。

允许通过：

```ts
showRuntimeDiagnostics?: boolean
```

实现最小可见性控制，默认：

```ts
false
```

---

# 6. Final Page IA

不得新增新的一级 Agent 页面。

最终只保留：

| ID | 页面 | 责任 |
|---|---|---|
| A01 | Agent Registry | 查看、进入、管理内置与自定义智能体 |
| A02 | Create Custom Agent | 基于能力模板创建自定义智能体 Draft |
| A03 | Agent Definition Workspace | 定义职责、工作范围和行为边界 |
| A04 | Agent Test & Publish | 测试、质量验证、发布和版本记录 |

最终主流程：

```text
A01 Agent Registry
        ↓
创建智能体
        ↓
A02 Create Custom Agent
        ↓
选择能力模板
        ↓
定义用途与工作范围
        ↓
Create Custom Agent Draft
        ↓
A03 Definition Workspace
        ↓
测试草稿
        ↓
自动保存 Draft
        ↓
A04 Test & Publish
        ↓
Release Gate
        ↓
AgentVersion
        ↓
AgentRuntimeBinding
        ↓
A01 Registry
```

---

# 7. A01 — Agent Registry Final Contract

## 7.1 页面定位

回答：

> 当前组织有哪些可管理智能体，它们属于平台内置还是组织自定义，能做什么，当前正式状态如何。

不是：

- Agent Dashboard
- Runtime Console
- Agent Marketplace
- KPI Center

## 7.2 最终列

```text
智能体
类型
支持任务
正式版本
状态
Owner
操作
```

删除：

```text
运行引擎
```

## 7.3 默认内置数据

```text
数据智能伙伴     内置
语义治理伙伴     内置
企业知识伙伴     内置
```

不得出现：

```text
Xino｜犀诺
```

## 7.4 状态

用户状态收敛为：

```text
正常
未发布
有未发布修改
需关注
已停用
```

Runtime / Sync 的底层状态映射成以上产品状态。

## 7.5 草稿入口

`查看草稿`：

```text
A01
↓
A03 Definition Workspace
```

或：

```text
A01 Draft Drawer
↓
进入定义工作区
↓
A03
```

A01 不允许直接 Publish。

---

# 8. A02 — Create Custom Agent Final Contract

## 8.1 页面名称

A01 按钮：

```text
创建智能体
```

Drawer：

```text
创建自定义智能体
```

不要继续以：

```text
从模板创建
```

作为主要用户动作。

## 8.2 创建的是什么

用户创建：

```text
CUSTOM Agent
```

不是复制一个内置 Agent。

因此能力模板名称不得与内置 Agent 名称重复。

## 8.3 两阶段流程

最终：

```text
选择能力模板
      →
定义用途与工作范围
```

禁止：

```text
选择模板 → 基本定义
```

作为最终产品文案。

---

# 9. Capability Templates

V1.1 只提供三个。

## 9.1 数据查找与分析

用户名称：

```text
数据查找与分析
```

说明：

> 适合业务找数、问数、指标查询和多维数据分析。

真实 TaskTemplate：

```text
FIND_DATA_V1
QUERY_DATA_V1
ANALYZE_DATA_V1
```

默认 Runtime：

```text
SEMOVIX_NATIVE
```

Runtime 不在创建 UI 中展示。

## 9.2 企业知识问答与研究

用户名称：

```text
企业知识问答与研究
```

说明：

> 适合企业制度问答、知识检索、跨文档研究与 Wiki 研究。

真实 TaskTemplate：

```text
KNOWLEDGE_QA_V1
DOCUMENT_RESEARCH_V1
WIKI_RESEARCH_V1
```

默认 Runtime：

```text
WEKNORA
```

默认 Context Source 至少：

```text
KNOWLEDGE_SPACE
DOCUMENT
WIKI
TEMPORARY_ATTACHMENT
```

Web 默认关闭。

## 9.3 语义治理与审查

用户名称：

```text
语义治理与审查
```

说明：

> 适合数据语义理解、业务对象、标准、指标及知识网络治理。

真实 TaskTemplate 必须是完整 7 个：

```text
SEMANTIC_UNDERSTANDING_V1
BUSINESS_OBJECT_DISCOVERY_V1
OBJECT_MERGE_V1
STANDARD_MATCHING_V1
METRIC_GOVERNANCE_V1
DRKN_BUILD_V1
DKN_BUILD_V1
```

UI 可以：

```text
语义理解
业务对象
标准治理
+4
```

但：

> `+4` 只是 View Projection，Domain 必须真实存在 7 个 TaskTemplateBinding。

---

# 10. Capability Template Domain

建议将当前 `ManagedAgentPreset` 收敛为能力模板语义。

允许保留现有代码名，但建议 Domain 最终语义为：

```ts
export interface AgentCapabilityTemplate {
  templateId: string;

  name: string;
  description: string;

  defaultTaskBindings: TaskTemplateBinding[];

  allowedContextSources: AgentContextSource[];

  defaultContextPolicy: AgentContextPolicy;

  capabilityPresetId: string;

  modelPolicyId: string;

  defaultMaxAutonomy: MaxAutonomy;

  runtimeTarget: RuntimeTarget;
}
```

Runtime 保留在 Domain，但创建 UI 不显示。

---

# 11. A02 Stage 1 — Capability Selection

页面首先回答：

> 这个智能体主要帮助用户完成什么工作？

每个 Selection Row 只展示：

```text
能力模板名称
适用场景
支持任务
默认行为方式
```

禁止展示：

```text
WeKnora
Semovix Native
Runtime Target
Runtime Profile
```

### Example

```text
企业知识问答与研究

适合：
企业制度问答、知识检索、跨文档与 Wiki 研究

支持：
知识问答 · 文档研究 · Wiki研究

默认行为：
提供可信答案与可追溯依据
```

## 11.1 Optional AI Recommendation

可选，不作为 V1.1 Freeze Blocker：

```text
不知道选哪个？
描述你希望这个智能体完成什么
```

返回单一能力模板建议。

不做 Chat UI。

---

# 12. A02 Stage 2 — Purpose & Work Scope

最终标题：

```text
定义用途与工作范围
```

页面结构：

```text
基本信息
+
工作范围
+
右侧创建摘要
```

## 12.1 基本信息

仅：

```text
智能体名称 *
主要职责 *
Owner *
```

## 12.2 工作范围

必须根据 Capability Template 动态变化。

---

# 13. Data Agent Work Scope

标题：

```text
数据工作范围
```

模式：

```text
ALL_ALLOWED
→ 使用当前用户有权访问的适用数据

SELECTED
→ 指定业务范围
```

指定范围优先按：

```text
业务域
业务对象
```

不要在创建流程直接暴露：

```text
Database
Schema
Table
```

---

# 14. Knowledge Agent Work Scope

标题：

```text
知识范围
```

模式：

```text
ALL_ALLOWED
→ 按用户权限动态使用适用企业知识

SELECTED
→ 指定知识范围
```

例如：

```text
☑ 企业制度
☑ 产品知识
☐ HR 制度
```

必须保存真实：

```text
Knowledge Space ID
Knowledge Base ID
```

不能只保存显示名称。

---

# 15. Governance Agent Work Scope

标题：

```text
治理范围
```

模式：

```text
ALL_ALLOWED
→ 按当前任务范围动态确定

SELECTED
→ 指定业务域
```

例如：

```text
人口主题域
公共服务域
```

---

# 16. Context Binding Domain Contract

当前 `AgentContextSource` 回答：

> Agent 最大允许访问什么类型。

还必须增加：

```ts
export type ContextSelectionMode =
  | 'ALL_ALLOWED'
  | 'SELECTED';

export interface AgentContextBinding {
  sourceType: AgentContextSource;

  selectionMode: ContextSelectionMode;

  resourceIds?: string[];
}
```

`AgentDefinition` 增加：

```ts
contextBindings: AgentContextBinding[];
```

`AgentDraft` 同样增加：

```ts
contextBindings: AgentContextBinding[];
```

运行时公式最终冻结：

```text
Effective Context
=
Agent Context Binding
∩
User Permission
∩
Task Scope
```

Agent Center 不复制 Permission Matrix。

---

# 17. A02 Right Summary

删除：

```text
目标运行引擎
WeKnora
```

改为：

```text
创建后将获得
```

Example:

```text
能力模板
企业知识问答与研究

主要任务
知识问答 · 文档研究 · Wiki研究

工作范围
HR 制度 · 员工手册

行为方式
提供答案与建议，不自动执行业务变更

Owner
人力资源运营中心
```

---

# 18. Autonomy Product Language

Domain：

```text
SUGGEST
PROPOSE
EXECUTE_WITHIN_POLICY
```

用户展示：

```text
SUGGEST
→ 提供答案与建议

PROPOSE
→ 可生成待确认方案

EXECUTE_WITHIN_POLICY
→ 可在授权范围内执行
```

创建阶段只展示行为结果，不要求普通用户选择底层 enum。

---

# 19. Create CTA

最终：

```text
创建草稿并继续配置
```

不要：

```text
创建并继续配置
```

点击后必须：

```text
Create AgentDefinition
origin = CUSTOM
status = DRAFT

Create AgentDraft

currentPublishedVersion = undefined

NO AgentVersion

NO Active RuntimeBinding
```

进入 A03。

---

# 20. A03 — Definition Workspace Final Contract

## 20.1 页面定位

回答：

> 这个智能体负责什么、允许做什么、可以使用哪些业务范围，以及以什么行为边界工作。

不是：

- Runtime Console
- Workflow Builder
- Prompt Playground
- Permission Matrix
- Generic Agent Builder

## 20.2 普通用户导航

最终：

```text
概览
基本信息
支持任务
工作范围
能力
模型与自主程度
```

删除普通用户一级：

```text
运行引擎
```

Runtime 放入：

```text
高级信息 / 运行与诊断
```

默认不展示。

---

# 21. A03 — Basic Information

## Custom Agent

允许：

```text
名称
主要职责
Role Instruction
Owner
```

## Built-in Agent

```text
名称 → Locked
核心职责 → Locked / Platform-managed
Owner → Editable
```

---

# 22. Role Instruction

必须独立于：

```text
responsibilitySummary
```

新增：

```ts
roleInstruction: string;
```

定义：

```text
responsibilitySummary
= 用户看到的一句话业务职责

roleInstruction
= Runtime 使用的专业角色行为规则
```

Prompt Layer：

```text
P0 Platform Policy
P1 Agent Role Instruction
P2 Task Instruction
P3 Runtime Context
P4 User Input
```

UI 名称：

```text
高级角色说明
```

默认可折叠。

禁止叫：

```text
System Prompt
```

辅助说明：

> 定义智能体如何履行职责。平台安全、权限与执行协议不可在此覆盖。

---

# 23. A03 — Supported Tasks

真实模型：

```text
TaskTemplateBinding[]
```

Custom Agent：

- 可以启用 / 停用模板允许的 TaskTemplate
- 可以添加能力模板允许范围内的 TaskTemplate
- 不允许编辑 Workflow
- 不允许编辑 Step
- 不允许编辑 Task Contract

Built-in Agent：

- 核心 Task 锁定
- 显示“平台内置任务”
- 不允许移除

继续保留：

```text
查看任务定义
```

Task Definition 归 Task Engine 管理。

---

# 24. A03 — Work Scope

将当前：

```text
上下文来源
```

用户名称调整为：

```text
工作范围
```

内部仍使用：

```text
Context
```

页面展示：

```text
允许使用的来源
具体业务范围
权限说明
```

必须支持：

```text
AgentContextBinding
```

---

# 25. A03 — Capability

Custom Agent：

允许选择受控 Capability Preset。

Knowledge 示例：

```text
精准知识问答
Wiki + RAG 混合研究
深度知识研究
```

禁止暴露：

```text
BM25 Weight
Dense Weight
TopK
Rerank Threshold
Chunk Merge
```

---

# 26. A03 — Model Policy

只允许选择受控策略，例如：

```text
均衡
质量优先
逻辑与计算优先
严谨一致性优先
```

禁止普通 UI 暴露：

```text
Temperature
Top-P
Raw Model ID
Provider-specific tuning
```

---

# 27. A03 — Autonomy

用户选项：

```text
提供答案与建议
生成待确认方案
授权范围内执行
```

Domain 映射：

```text
SUGGEST
PROPOSE
EXECUTE_WITHIN_POLICY
```

Agent 的 Autonomy 永远不能提升 User Permission。

---

# 28. Draft Update Contract

当前 Draft 保存必须统一为：

```ts
export interface UpdateAgentDraftPatch {
  name?: string;

  responsibilitySummary?: string;

  roleInstruction?: string;

  owner?: string;

  supportedTaskTemplates?: TaskTemplateBinding[];

  allowedContextSources?: AgentContextSource[];

  contextBindings?: AgentContextBinding[];

  capabilityPresetId?: string;

  modelPolicyId?: string;

  maxAutonomy?: MaxAutonomy;
}
```

Service：

```ts
updateAgentDraft(
  agentId,
  patch
)
```

所有 A03 Section 都写入同一个 AgentDraft。

禁止出现：

```text
UI 显示已保存
但 Domain Draft 未更新
```

---

# 29. New Draft Guidance

Custom Agent 创建后进入 A03。

顶部显示轻量提示：

```text
智能体草稿已创建

基础定义    已完成
工作范围    已配置 / 待完善
发布验证    待完成
```

辅助文案：

> 完善定义后测试草稿，通过发布验证后才会正式生效。

禁止：

- 大型 Stepper
- KPI
- 大进度条
- Wizard 重新套一层

---

# 30. AgentDefinition Final Contract

建议最终：

```ts
export interface AgentDefinition {
  agentId: string;

  origin: AgentOrigin;

  name: string;

  description: string;

  responsibilitySummary: string;

  roleInstruction: string;

  owner: string;

  supportedTaskTemplates: TaskTemplateBinding[];

  allowedContextSources: AgentContextSource[];

  contextBindings: AgentContextBinding[];

  capabilityPresetId: string;

  modelPolicyId: string;

  maxAutonomy: MaxAutonomy;

  runtimeTarget: RuntimeTarget;

  status: AgentStatus;

  currentPublishedVersion?: string;

  currentDraftId?: string;

  createdAt: string;

  createdBy: string;

  updatedAt: string;
}
```

---

# 31. AgentDefinitionSnapshot

不得继续：

```ts
AgentVersion.snapshot: AgentDefinition
```

新增：

```ts
export interface AgentDefinitionSnapshot {
  origin: AgentOrigin;

  name: string;

  description: string;

  responsibilitySummary: string;

  roleInstruction: string;

  owner: string;

  supportedTaskTemplates: TaskTemplateBinding[];

  allowedContextSources: AgentContextSource[];

  contextBindings: AgentContextBinding[];

  capabilityPresetId: string;

  modelPolicyId: string;

  maxAutonomy: MaxAutonomy;

  runtimeTarget: RuntimeTarget;
}
```

`AgentVersion`：

```ts
snapshot: AgentDefinitionSnapshot;
```

Snapshot 禁止包含：

```text
currentDraftId
currentPublishedVersion
updatedAt
mutable lifecycle status
```

---

# 32. A04 — Test & Publish Final Contract

页面结构保持：

```text
发布概览
配置检查
测试运行
质量评估
发布记录
```

用户主语言产品化。

## 32.1 Runtime 技术词收敛

普通用户：

```text
Runtime Compile
→ 运行准备

Runtime Dependencies
→ 运行依赖检查
```

技术详情里才显示：

```text
Runtime Provider
Projection
Revision
Integration Mode
```

---

# 33. Release Gate

五道 Gate：

```text
配置检查
运行准备
运行依赖
测试运行
质量评估
```

全部：

```text
PASSED
```

才能 Publish。

---

# 34. Release Gate 必须是 Domain Invariant

禁止只靠：

```text
Publish button disabled
```

保护发布。

`agentService.publishDraft()` 自身必须：

```ts
const validation =
  await evaluateReleaseValidation(agentId);

if (!isReleaseGatePassed(validation)) {
  throw new ReleaseGateNotPassedError(...);
}
```

之后才能：

```text
Runtime Validation
↓
Runtime Activation
↓
Switch Published Version
```

UI Guard ≠ Domain Invariant。

---

# 35. Publish Ordering

正式顺序：

```text
Read Draft
↓
Release Gate
↓
Create Candidate Version Snapshot
↓
Compile Runtime Projection
↓
Validate Runtime Dependencies
↓
Activate Runtime
↓
Create AgentVersion
↓
Create / Switch AgentRuntimeBinding
↓
Update AgentDefinition.currentPublishedVersion
↓
Remove Current Draft
```

失败：

```text
旧 Published Version 保持 ACTIVE
Draft 保留
RuntimeBinding 不切换
Registry 不假更新
```

---

# 36. First Publish

无正式版本：

```text
→ v1.0
```

之后：

```text
v1.0 → v1.1
v1.4 → v1.5
```

不能写死版本号。

---

# 37. RuntimeProjection vs RuntimeBinding

必须拆开。

## Draft / Test

```text
AgentDraft
↓
RuntimeProjection
```

仅用于测试与验证。

## Publish Success

```text
AgentVersion
↓
AgentRuntimeBinding
```

Draft 不创建正式 RuntimeBinding。

---

# 38. RuntimeProjection Contract

```ts
export interface RuntimeProjection {
  projectionId: string;

  agentId: string;

  draftId: string;

  runtimeTarget: RuntimeTarget;

  integrationMode:
    | 'MOCK_RUNTIME'
    | 'PRODUCTION';

  payload: unknown;

  compiledAt: string;
}
```

---

# 39. AgentRuntimeBinding Final Contract

```ts
export interface AgentRuntimeBinding {
  bindingId: string;

  agentId: string;

  agentVersion: string;

  runtimeType:
    | 'SEMOVIX_NATIVE'
    | 'WEKNORA';

  runtimeAgentId?: string;

  integrationMode:
    | 'MOCK_RUNTIME'
    | 'PRODUCTION';

  syncStatus:
    | 'PENDING'
    | 'SYNCING'
    | 'SYNCED'
    | 'FAILED'
    | 'OUT_OF_SYNC';

  healthStatus:
    | 'HEALTHY'
    | 'DEGRADED'
    | 'UNAVAILABLE';

  runtimeConfigRevision?: string;

  active: boolean;

  lastSyncedAt?: string;

  lastCheckedAt?: string;

  syncError?: string;
}
```

禁止再把：

```text
MOCK_RUNTIME
SYNCED
READY
DRAFT_PROJECTION
```

放在一个 status enum 中。

---

# 40. Knowledge Compiler Final Contract

## 40.1 Capability → Runtime Profile

禁止：

```text
MANAGED → WeKnora AgentType
```

必须：

```text
Semovix Capability Preset
↓
Runtime Profile Mapping
↓
WeKnora Agent Type
```

例如：

```text
KNOWLEDGE_PRECISE_QA
→ rag-qa

KNOWLEDGE_WIKI_RAG
→ hybrid-rag-wiki

KNOWLEDGE_WIKI_ONLY
→ wiki-qa
```

如果当前 Capability 使用中文 string，本轮引入稳定 ID。

---

# 41. Knowledge Scope Projection

如果 Context Binding 是：

```text
SELECTED
```

Knowledge Compiler 应输出实际：

```text
knowledgeSpaceIds
knowledgeBaseIds
```

或 WeKnora Adapter 所需等价结构。

不能只有：

```text
KNOWLEDGE_SPACE
DOCUMENT
WIKI
```

枚举类型。

---

# 42. WeKnora Integration Honesty

当前真实 API 未接入。

继续保留：

```text
WeKnoraRuntimeAdapterMock
MOCK_RUNTIME
```

不得声称：

```text
Production Connected
实时健康
已真正同步
```

真实 WeKnora Integration 属于后续 Implementation / Integration，不反向改变本合同产品模型。

---

# 43. Evaluation Honesty

当前 Test Run / Quality Evaluation 仍可能是 Prototype Validation。

页面必须诚实标注：

```text
原型评测
模拟验证
评测后端待接入
```

不得把硬编码指标声明为生产评测结果。

---

# 44. Non-goals

本轮禁止建设：

```text
Agent Marketplace
Template Marketplace
Blank Agent Builder
Generic Agent Builder
Multi-Agent Team Builder
Workflow Builder
Prompt Playground
Runtime Center
Evaluation Center
Agent Analytics Dashboard
Agent KPI Center
```

禁止为了“功能完整”增加 A05 / A06。

---

# 45. Scope Control

不得无关修改：

```text
Marketplace
Metric
Data Semantics
Data Standards
Access Review
Business Object
Data Asset
Xino Workbench UI
```

唯一例外：

> 为了将 Xino 从 Agent Center 解耦而必须做的最小兼容修改。

---

# 46. Recommended Commit Plan

必须分批实施，不要一次大改。

## Commit 01

```text
refactor(agent): separate xino from agent center and add agent origin
```

内容：

- Xino 移出 Agent Center
- `AgentOrigin`
- BUILT_IN / CUSTOM
- Built-in governance baseline

## Commit 02

```text
refactor(agent-ui): simplify registry for built-in and custom agents
```

内容：

- A01 删除 Xino
- 删除 Runtime 列
- 增加 Type 列
- 状态产品化

## Commit 03

```text
refactor(agent-create): introduce capability templates
```

内容：

- 能力模板命名
- 三个模板最终 Task Binding
- Governance 真实 7 Tasks
- Knowledge Context 修正

## Commit 04

```text
refactor(agent-create): create custom agent around purpose and work scope
```

内容：

- A02 新流程
- Context Binding
- 创建 Custom Draft
- 右侧摘要用户化

## Commit 05

```text
refactor(agent-domain): finalize definition draft and snapshot contracts
```

内容：

- `roleInstruction`
- `AgentDefinitionSnapshot`
- `AgentContextBinding`
- Draft Update Contract

## Commit 06

```text
feat(agent-definition): enable controlled editing of agent boundaries
```

内容：

- Built-in locks
- Custom editable fields
- Task Binding
- Work Scope
- Capability
- Model
- Autonomy
- Runtime Diagnostics 隐藏

## Commit 07

```text
refactor(agent-release): enforce release gate as domain invariant
```

内容：

- Publish Domain Guard
- A04 文案产品化
- Publish failure safety

## Commit 08

```text
refactor(agent-runtime): separate runtime projection binding sync and health
```

内容：

- RuntimeProjection
- RuntimeBinding final contract
- Draft 不创建 Active Binding

## Commit 09

```text
fix(agent-runtime): map semantic capability profiles to runtime providers
```

内容：

- Capability ID
- WeKnora Agent Type mapping
- Context resource IDs projection

## Commit 10

```text
chore(agent): cleanup legacy code and validate final freeze candidate
```

内容：

- Dead code
- Legacy `SYSTEM` Agent Center logic
- Obsolete template code
- lint / build / acceptance tests

---

# 47. Acceptance Contract

以下全部通过，才能宣布：

> `Semovix Agent Center V1.1 Final Freeze Candidate Ready`

## AC-01 Xino

Agent Center 不显示 Xino。

AI Workbench 中 Xino 仍正常工作。

## AC-02 Registry

A01 只看到：

```text
数据智能伙伴     内置
语义治理伙伴     内置
企业知识伙伴     内置
自定义智能体...
```

没有 Runtime 主列。

## AC-03 Create Knowledge Agent

创建：

```text
HR 制度知识助手
```

选择：

```text
企业知识问答与研究
```

范围：

```text
HR 制度
员工手册
```

Domain：

```text
origin = CUSTOM
status = DRAFT
currentPublishedVersion = undefined
contextBindings = SELECTED + resourceIds
runtimeTarget = WEKNORA
```

UI 不突出 WeKnora。

## AC-04 New Draft A03

显示：

```text
自定义智能体
未发布草稿
正式版本：暂无
工作范围：HR 制度 / 员工手册
```

不得显示：

```text
已同步
r37
WeKnora · 正常
```

## AC-05 Data Agent

创建：

```text
人口分析助手
```

模板：

```text
数据查找与分析
```

任务：

```text
找数据
问数据
数据分析
```

## AC-06 Built-in Lock

打开：

```text
数据智能伙伴
```

必须：

```text
类型 = 内置
名称不可编辑
核心任务不可移除
```

但 Owner / Scope / Allowed Model / Autonomy 根据治理规则可配置。

## AC-07 Governance Tasks

Domain 中必须真实存在 7 个 TaskTemplateBinding。

不能用：

```text
3 tasks + extraTasksCount 4
```

代替真实绑定。

## AC-08 Knowledge Context

企业知识能力模板至少允许：

```text
KNOWLEDGE_SPACE
DOCUMENT
WIKI
TEMPORARY_ATTACHMENT
```

## AC-09 Draft Persistence

修改：

```text
Owner
Role Instruction
Task Binding
Work Scope
Capability
Model Policy
Autonomy
```

保存后重新进入 A03，全部保持。

## AC-10 Single Test Entry

A03：

```text
测试草稿
↓
自动保存
↓
A04
```

不存在第二套独立 Test Playground。

## AC-11 Release Gate

五项未全部通过：

- UI Publish disabled
- 直接调用 `publishDraft()` 也失败

## AC-12 First Publish

Custom 新 Agent：

```text
no published version
→ v1.0
```

A01 更新为：

```text
自定义
v1.0
正常
```

## AC-13 Second Publish

```text
v1.0
→ Draft
→ Publish
→ v1.1
```

v1.0 保留历史。

## AC-14 Publish Failure

Runtime Activation Failed：

```text
旧正式版本保持 ACTIVE
Draft 保留
Binding 不切换
Registry 不假更新
```

## AC-15 Snapshot

`AgentVersion.snapshot` 不包含：

```text
currentDraftId
currentPublishedVersion
mutable lifecycle status
updatedAt
```

## AC-16 Runtime

普通用户主界面不出现：

```text
Runtime Revision
Projection ID
BM25
Dense
Rerank
TopK
```

## AC-17 WeKnora

真实 API 未接入时必须标记：

```text
MOCK_RUNTIME
```

不得伪装生产连接。

---

# 48. Domain Assertions

至少验证：

```text
Xino is absent from AgentRepository

BUILT_IN agent cannot be physically deleted

CUSTOM first publish = v1.0

v1.4 next publish = v1.5

failed publish preserves active version

release gate cannot be bypassed

draft does not create active runtime binding

AgentVersion snapshot contains no mutable lifecycle state

context binding survives draft save

semantic governance contains exactly 7 real task bindings

knowledge capability supports Wiki context

custom agent origin persists through publish
```

---

# 49. Build Quality

完成后执行：

```bash
npm install
npm run lint
npm run build
```

要求：

```text
0 TypeScript errors
0 build errors
```

禁止通过：

```text
@ts-ignore
@ts-expect-error
大量 any
```

规避类型问题。

---

# 50. Required Final Report

完成后必须输出：

1. 修改文件列表
2. Xino 从 Agent Center 移除方式
3. `AgentOrigin` 最终定义
4. 内置智能体最终列表
5. 自定义智能体最终创建流程
6. 三个能力模板最终配置
7. `AgentContextBinding` 最终模型
8. A03 Built-in / Custom 编辑规则
9. `roleInstruction` 与 Prompt Layer
10. `AgentDefinitionSnapshot` Contract
11. Release Gate Domain Invariant
12. RuntimeProjection / RuntimeBinding 区分
13. 普通 UI 隐藏了哪些 Runtime 信息
14. WeKnora 仍为 Mock 的部分
15. lint 结果
16. build 结果
17. Acceptance Contract 逐项结果
18. 尚未完成的真实后端 / Runtime Integration

不得只输出：

> 已完成。

---

# 51. Definition of Done

只有同时满足：

```text
Xino 不属于 Agent Center

用户分类只剩：
内置 / 自定义

A01 不暴露 Runtime Provider

A02 创建的是 Custom Agent

能力模板不与内置 Agent 重名

创建流程清楚回答：
它做什么
它在哪里工作

Context Binding 有真实 resourceIds

新 Agent 正确成为 Draft

A03 可以真正配置受控字段

内置 Agent 有明确锁定边界

Release Gate 不能绕过

AgentVersion Snapshot 干净不可变

Draft Projection 与 RuntimeBinding 分离

WeKnora 未接入时诚实使用 MOCK_RUNTIME

Create → Define → Test → Publish → Registry
完整闭环成立
```

才可以声明：

> **Semovix Agent Center V1.1 Final Freeze Candidate Ready**

---

# 52. Final Execution Constraint

> 不要继续扩展 Agent Center 的功能。当前目标不是做一个通用 Agent Builder，而是把 Semovix V1.1 已确定的 Agent 生命周期做到用户可理解、领域模型一致、状态可验证。优先做减法、边界和一致性，不要创造新的页面、新的 Agent 类型、新的配置中心。

> 当前 A01 / A02 / A03 / A04 页面骨架已经基本成立。除本合同明确要求外，不允许重新设计整体 IA。

> 建议每完成一个 Commit 后停止继续实施，输出变更、验证结果以及与本合同的对应关系，等待人工确认后再进入下一个 Commit。
