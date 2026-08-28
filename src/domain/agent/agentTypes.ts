/**
 * Semovix Agent Domain Model - Core Types
 * Defines the official enterprise domain entities:
 * AgentDefinition, AgentDraft, AgentVersion, AgentRuntimeBinding, ManagedAgentPreset
 */

export type AgentKind = 'SYSTEM' | 'MANAGED';

export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'DISABLED';

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
  agentKind: AgentKind;
  owner: string;
  sourcePresetId?: string;
  supportedTaskTemplates: TaskTemplateBinding[];
  allowedContextSources: AgentContextSource[];
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
  supportedTaskTemplates: TaskTemplateBinding[];
  allowedContextSources: AgentContextSource[];
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

export interface AgentVersion {
  versionId: string;
  versionNumber: string; // e.g. "v1.0", "v1.4"
  agentId: string;
  snapshot: AgentDefinition;
  publishedAt: string;
  publishedBy: string;
  releaseNotes?: string;
  runtimeRevision: string;
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
  defaultOwner: string;
  runtimeTarget: RuntimeTarget;
  runtimeEngineLabel: string;
  supportedTaskTemplates: TaskTemplateBinding[];
  extraTasksCount?: number;
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
  BUSINESS_OBJECT_V1: {
    taskTemplateId: 'BUSINESS_OBJECT_V1',
    name: '业务对象',
    desc: '发现潜在实体概念，辅助业务对象关系拓扑建模'
  },
  STANDARD_GOVERNANCE_V1: {
    taskTemplateId: 'STANDARD_GOVERNANCE_V1',
    name: '标准治理',
    desc: '国家/行业标准对齐、字段映射冲突审阅与值域校验'
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
