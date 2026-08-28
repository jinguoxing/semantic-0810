/**
 * Semovix Agent Domain Model - Core Types
 * Defines the official enterprise domain entities:
 * AgentDefinition, AgentDraft, AgentVersion, AgentRuntimeBinding, ManagedAgentPreset
 */

export type AgentKind = 'SYSTEM' | 'MANAGED';

export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'DISABLED';

/**
 * 智能体来源 (V1.1)：
 * - BUILT_IN: 平台内置智能体（数据智能伙伴 / 语义治理伙伴 / 企业知识伙伴）
 * - CUSTOM: 组织用户通过能力模板自定义创建的智能体
 *
 * origin 只表达"内置 vs 组织自定义"，不替代 runtimeTarget / status / version；
 * 用户可见分类一律以 origin 为准，agentKind 仅作为内部兼容字段保留。
 */
export type AgentOrigin = 'BUILT_IN' | 'CUSTOM';

export type MaxAutonomy =
  | 'SUGGEST'
  | 'PROPOSE'
  | 'EXECUTE_WITHIN_POLICY';

export type RuntimeTarget =
  | 'SEMOVIX_NATIVE'
  | 'WEKNORA';

/**
 * Agent 允许的上下文来源类型 (业务真实模型)。
 * 实际运行上下文 = 智能体允许范围 ∩ 当前用户权限 ∩ 当前任务范围；
 * 用户权限由 Permission Matrix 统一裁决，Agent Center 不复制权限矩阵。
 */
export type AgentContextSource =
  | 'BUSINESS_DOMAIN'
  | 'BUSINESS_OBJECT'
  | 'BUSINESS_TERM'
  | 'METRIC'
  | 'MARKETPLACE'
  | 'DATA_SEMANTICS'
  | 'QUALITY_SUMMARY'
  | 'LINEAGE'
  | 'KNOWLEDGE_SPACE'
  | 'WIKI'
  | 'DOCUMENT'
  | 'TEMPORARY_ATTACHMENT'
  | 'WEB';

/**
 * 工作范围选择模式 (V1.1 Context Binding)：
 * - ALL_ALLOWED: 按用户权限动态使用该来源类型的全部适用资源
 * - SELECTED: 仅使用 resourceIds 指定的资源（必须至少一个）
 */
export type ContextSelectionMode = 'ALL_ALLOWED' | 'SELECTED';

/**
 * Agent 实际配置的业务工作范围。
 * 语义边界（V1.1 §16）：
 * - allowedContextSources 回答"最大允许使用哪些来源类型"
 * - contextBindings 回答"当前实际配置了什么业务范围"
 * 运行公式：Effective Context = Agent Context Binding ∩ User Permission ∩ Task Scope；
 * Agent Center 不复制 Permission Matrix，Context Binding 永远不能扩大用户权限。
 */
export interface AgentContextBinding {
  sourceType: AgentContextSource;
  selectionMode: ContextSelectionMode;
  resourceIds?: string[];
}

/**
 * Agent 与任务模板的绑定 (业务真实模型)。
 * 任务定义 (Workflow / 步骤 / 输入输出契约) 由 Task Engine 统一管理，
 * Agent 侧只保存绑定关系与启用状态，不编辑任务内容。
 */
export interface TaskTemplateBinding {
  taskTemplateId: string;
  version: string;
  enabled: boolean;
}

export interface AgentBusinessDiff {
  field: string;
  changeText: string;
  tag: string;
  isNew?: boolean;
}

export interface AgentDefinition {
  agentId: string;
  name: string;
  description: string;
  responsibilitySummary: string;
  /**
   * Runtime 使用的专业角色行为说明（≠ responsibilitySummary 面向用户的一句话业务职责摘要）。
   *
   * Prompt Layer Contract（冻结）：
   *   P0 Platform Policy → P1 Agent Role Instruction → P2 Task Instruction
   *   → P3 Runtime Context → P4 User Input
   * P1 不能：覆盖 Platform Policy、绕过 Permission、修改 Task Contract、提升 Max Autonomy。
   */
  roleInstruction: string;
  agentKind: AgentKind;
  /** 内置 vs 组织自定义（用户可见分类字段） */
  origin: AgentOrigin;
  owner: string;
  sourcePresetId?: string;
  supportedTaskTemplates: TaskTemplateBinding[];
  allowedContextSources: AgentContextSource[];
  /** 当前实际配置的工作范围（与 allowedContextSources 的"最大允许"语义区分） */
  contextBindings: AgentContextBinding[];
  capabilityPreset: string;
  capabilityDesc?: string;
  modelPolicyId: string;
  modelPolicyName?: string;
  maxAutonomy: MaxAutonomy;
  maxAutonomyDesc?: string;
  runtimeTarget: RuntimeTarget;
  status: AgentStatus;
  currentPublishedVersion?: string; // e.g. "v1.4", undefined if unreleased
  currentDraftId?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface AgentDraft {
  draftId: string;
  agentId: string;
  baseVersion?: string;
  name: string;
  description: string;
  responsibilitySummary: string;
  /** 与所属 AgentDefinition 的 origin 保持一致（草稿继承，不改变来源） */
  origin: AgentOrigin;
  /**
   * Runtime 使用的专业角色行为说明（AgentDraft 是完整可编辑配置，含 roleInstruction）。
   * 语义与 Prompt Layer 约束同 AgentDefinition.roleInstruction。
   */
  roleInstruction: string;
  /** 草稿编辑期间持有的 Owner（Agent 配置的一部分，≠ updatedBy 编辑人） */
  owner: string;
  supportedTaskTemplates: TaskTemplateBinding[];
  allowedContextSources: AgentContextSource[];
  /** 当前实际配置的工作范围（草稿编辑对象，发布时并入 AgentVersion 快照） */
  contextBindings: AgentContextBinding[];
  capabilityPreset: string;
  capabilityDesc?: string;
  modelPolicyId: string;
  modelPolicyName?: string;
  maxAutonomy: MaxAutonomy;
  maxAutonomyDesc?: string;
  runtimeTarget: RuntimeTarget;
  businessDiffs: AgentBusinessDiff[];
  updatedAt: string;
  updatedBy: string;
}

/**
 * 发布版本快照（V1.1 §31）：只包含 Runtime Config 字段。
 * 严禁包含生命周期状态：agentId / agentKind / status / currentPublishedVersion /
 * currentDraftId / createdAt / createdBy / updatedAt / sourcePresetId ——
 * AgentVersion 自身已有 agentId / versionNumber / publishedAt / publishedBy，不重复。
 */
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
  capabilityPreset: string;
  capabilityDesc?: string;
  modelPolicyId: string;
  modelPolicyName?: string;
  maxAutonomy: MaxAutonomy;
  maxAutonomyDesc?: string;
  runtimeTarget: RuntimeTarget;
}

/**
 * 唯一 canonical Snapshot Builder：显式逐字段选择允许进入 Snapshot 的内容
 * （禁止 snapshot: { ...definition }，那会把生命周期字段再次带进去），
 * 嵌套数组全部深拷贝。AgentDefinition 结构上包含全部 Snapshot 字段，可直接传入；
 * 传入已有 Snapshot 则等价于不可变克隆。
 */
export function buildAgentDefinitionSnapshot(source: AgentDefinitionSnapshot): AgentDefinitionSnapshot {
  return {
    origin: source.origin,
    name: source.name,
    description: source.description,
    responsibilitySummary: source.responsibilitySummary,
    roleInstruction: source.roleInstruction,
    owner: source.owner,
    supportedTaskTemplates: source.supportedTaskTemplates.map((binding) => ({ ...binding })),
    allowedContextSources: [...source.allowedContextSources],
    contextBindings: source.contextBindings.map((binding) => ({
      sourceType: binding.sourceType,
      selectionMode: binding.selectionMode,
      resourceIds: binding.resourceIds ? [...binding.resourceIds] : undefined
    })),
    capabilityPreset: source.capabilityPreset,
    capabilityDesc: source.capabilityDesc,
    modelPolicyId: source.modelPolicyId,
    modelPolicyName: source.modelPolicyName,
    maxAutonomy: source.maxAutonomy,
    maxAutonomyDesc: source.maxAutonomyDesc,
    runtimeTarget: source.runtimeTarget
  };
}

export interface AgentVersion {
  versionId: string;
  versionNumber: string; // e.g. "v1.0", "v1.4"
  agentId: string;
  snapshot: AgentDefinitionSnapshot;
  publishedAt: string;
  publishedBy: string;
  releaseNotes?: string;
  runtimeRevision: string;
}

/**
 * 统一 Draft 更新补丁（V1.1 §28 Draft Update Contract）：
 * 所有 A03 Section 写入同一个 AgentDraft，不允许第二套保存逻辑。
 *
 * 严禁提供：origin / agentKind / runtimeTarget / status / currentPublishedVersion /
 * currentDraftId / baseVersion / agentId / draftId —— 它们不是普通 Draft Edit 可修改的字段。
 * （runtimeTarget 由 Capability Template / Platform 决定，不是 Agent Owner 可编辑项。）
 */
export interface UpdateAgentDraftPatch {
  name?: string;
  /** 普通 A03「主要职责」同时映射 description + responsibilitySummary，不新增 UI 字段 */
  description?: string;
  responsibilitySummary?: string;
  roleInstruction?: string;
  owner?: string;
  supportedTaskTemplates?: TaskTemplateBinding[];
  allowedContextSources?: AgentContextSource[];
  contextBindings?: AgentContextBinding[];
  capabilityPreset?: string;
  capabilityDesc?: string;
  modelPolicyId?: string;
  modelPolicyName?: string;
  maxAutonomy?: MaxAutonomy;
  maxAutonomyDesc?: string;
}

export interface AgentRuntimeBinding {
  bindingId: string;
  agentId: string;
  runtimeTarget: RuntimeTarget;
  runtimeInstanceId?: string;
  /**
   * MOCK_RUNTIME = 原型内存绑定（真实 Runtime API 未接入时的诚实标注），
   * 不得与 SYNCED / READY（真实连接）混用。
   */
  runtimeStatus: 'READY' | 'DRAFT_PROJECTION' | 'SYNCED' | 'MOCK_RUNTIME' | 'UNBOUND' | 'ERROR';
  integrationMode?: 'MOCK_RUNTIME' | 'PRODUCTION';
  syncRevision?: string;
  lastSyncedAt?: string;
}

/**
 * 发布验证模型：五道 Release Gate。
 * canPublish = 五项全部 PASSED；任何一项 PENDING / FAILED 都禁止发布。
 */
export type ReleaseCheckStatus = 'PENDING' | 'PASSED' | 'FAILED';

export interface AgentReleaseValidation {
  agentId: string;
  draftId: string;
  configCheck: ReleaseCheckStatus;
  runtimeCompile: ReleaseCheckStatus;
  runtimeDependencies: ReleaseCheckStatus;
  testRun: ReleaseCheckStatus;
  qualityEvaluation: ReleaseCheckStatus;
}

/** Release Gate：五项检查全部通过才允许发布新版本 */
export function isReleaseGatePassed(validation: AgentReleaseValidation): boolean {
  return (
    validation.configCheck === 'PASSED' &&
    validation.runtimeCompile === 'PASSED' &&
    validation.runtimeDependencies === 'PASSED' &&
    validation.testRun === 'PASSED' &&
    validation.qualityEvaluation === 'PASSED'
  );
}

export interface ManagedAgentPreset {
  presetId: string;
  presetName: string;
  categoryTag: string;
  description: string;
  selectionSummary: string;
  defaultName: string;
  defaultResponsibility: string;
  /** Runtime 角色行为说明默认值（≠ defaultResponsibility 业务职责摘要，表达角色行为边界） */
  defaultRoleInstruction: string;
  defaultOwner: string;
  runtimeTarget: RuntimeTarget;
  runtimeEngineLabel: string;
  supportedTaskTemplates: TaskTemplateBinding[];
  capabilityPreset: string;
  capabilityPresetDesc: string;
  modelPolicyId: string;
  modelPolicyName: string;
  defaultMaxAutonomy: MaxAutonomy;
  autonomyDesc: string;
  allowedContextSources: AgentContextSource[];
  symbolType: 'data' | 'governance' | 'knowledge';
}

/* ─────────────────────────────────────────────────────────────
   ViewModel Catalogs (仅用于展示投影，非业务真实模型)
   真实数据始终是 taskTemplateId / AgentContextSource 枚举值
   ───────────────────────────────────────────────────────────── */

export interface TaskTemplateView {
  taskTemplateId: string;
  name: string;
  desc: string;
}

/** 任务模板展示目录：任务定义由 Task Engine 统一管理 */
export const TASK_TEMPLATE_CATALOG: Record<string, TaskTemplateView> = {
  KNOWLEDGE_QA_V1: {
    taskTemplateId: 'KNOWLEDGE_QA_V1',
    name: '企业知识问答',
    desc: '基于企业标准制度与规范进行精准事实提取'
  },
  DOCUMENT_RESEARCH_V1: {
    taskTemplateId: 'DOCUMENT_RESEARCH_V1',
    name: '文档研究',
    desc: '跨长篇白皮书与政策文档进行多章节归纳对比'
  },
  WIKI_RESEARCH_V1: {
    taskTemplateId: 'WIKI_RESEARCH_V1',
    name: 'Wiki 研究',
    desc: '企业内部 Wiki 拓扑词条与领域专有名词协同检索'
  },
  FIND_DATA_V1: {
    taskTemplateId: 'FIND_DATA_V1',
    name: '找数据',
    desc: '智能检索企业数据目录、元数据与明细宽表资产'
  },
  QUERY_DATA_V1: {
    taskTemplateId: 'QUERY_DATA_V1',
    name: '问数据',
    desc: '解析业务自然语言意图并生成指标取数与聚合探查逻辑'
  },
  ANALYZE_DATA_V1: {
    taskTemplateId: 'ANALYZE_DATA_V1',
    name: '数据分析',
    desc: '多维指标交叉比对、同环比异常波动归因下钻'
  },
  SEMANTIC_UNDERSTANDING_V1: {
    taskTemplateId: 'SEMANTIC_UNDERSTANDING_V1',
    name: '语义理解',
    desc: '解析表结构与字段名业务含义，自动生成注释与标准建议'
  },
  // V1.1 语义治理与审查能力模板的正式任务（7 个真实 TaskTemplateBinding）
  BUSINESS_OBJECT_DISCOVERY_V1: {
    taskTemplateId: 'BUSINESS_OBJECT_DISCOVERY_V1',
    name: '业务对象发现',
    desc: '发现潜在实体概念，辅助业务对象关系拓扑建模'
  },
  OBJECT_MERGE_V1: {
    taskTemplateId: 'OBJECT_MERGE_V1',
    name: '业务对象合并',
    desc: '识别同一业务实体的重复对象并生成合并提案'
  },
  STANDARD_MATCHING_V1: {
    taskTemplateId: 'STANDARD_MATCHING_V1',
    name: '标准匹配',
    desc: '国家/行业标准对齐、数据元素标准匹配与值域校验'
  },
  METRIC_GOVERNANCE_V1: {
    taskTemplateId: 'METRIC_GOVERNANCE_V1',
    name: '指标治理',
    desc: '指标口径审查、命名规范检查与重复口径识别'
  },
  DRKN_BUILD_V1: {
    taskTemplateId: 'DRKN_BUILD_V1',
    name: '数据资源网络构建',
    desc: '构建数据资源之间的关联网络拓扑'
  },
  DKN_BUILD_V1: {
    taskTemplateId: 'DKN_BUILD_V1',
    name: '领域知识网络构建',
    desc: '构建领域知识词条与语义关系网络'
  },
  INTENT_UNDERSTANDING_V1: {
    taskTemplateId: 'INTENT_UNDERSTANDING_V1',
    name: '意图理解',
    desc: '平台级复杂自然语言意图理解与上下文消歧'
  },
  TASK_ROUTING_V1: {
    taskTemplateId: 'TASK_ROUTING_V1',
    name: '任务路由',
    desc: '智能调度受管智能体与平台治理工作流'
  },
  GLOBAL_COLLAB_V1: {
    taskTemplateId: 'GLOBAL_COLLAB_V1',
    name: '全局协同',
    desc: '串联数据服务超市、指标注册表与治理队列'
  }
};

export function getTaskTemplateView(taskTemplateId: string): TaskTemplateView {
  return (
    TASK_TEMPLATE_CATALOG[taskTemplateId] || {
      taskTemplateId,
      name: taskTemplateId,
      desc: '任务定义由 Task Engine 管理'
    }
  );
}

/** 按展示名反查任务模板 ID (仅用于 ViewModel 投影) */
export function findTaskTemplateIdByName(name: string): string | undefined {
  const match = Object.values(TASK_TEMPLATE_CATALOG).find((view) => view.name === name);
  return match?.taskTemplateId;
}

/** 上下文来源展示标签：权限裁决统一由 Permission Matrix 完成 */
export const AGENT_CONTEXT_SOURCE_VIEWS: Record<AgentContextSource, { label: string; desc: string }> = {
  BUSINESS_DOMAIN: { label: '业务域', desc: '业务域划分与域内资产元数据' },
  BUSINESS_OBJECT: { label: '业务对象', desc: '核心业务对象拓扑与实体关系' },
  BUSINESS_TERM: { label: '业务术语', desc: '企业业务术语字典与口径定义' },
  METRIC: { label: '指标注册表', desc: '已发布核心指标与派生维度' },
  MARKETPLACE: { label: '数据服务超市', desc: '已上架数据服务与 API 资产' },
  DATA_SEMANTICS: { label: '数据语义层', desc: '表/字段语义模型与主题宽表' },
  QUALITY_SUMMARY: { label: '质量摘要', desc: '数据质量评估结果与规则摘要' },
  LINEAGE: { label: '血缘关系', desc: '表级/字段级血缘与影响分析' },
  KNOWLEDGE_SPACE: { label: '知识空间', desc: '企业正式知识空间（制度/规范）' },
  WIKI: { label: '企业 Wiki', desc: '企业内部 Wiki 拓扑词条' },
  DOCUMENT: { label: '企业文档', desc: '白皮书、政策与产品文档' },
  TEMPORARY_ATTACHMENT: { label: '临时附件', desc: '会话内临时上传的附件材料' },
  WEB: { label: '公开网络', desc: '经安全策略放行的公开网络来源' }
};
