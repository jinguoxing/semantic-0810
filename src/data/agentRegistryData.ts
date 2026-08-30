import { agentService, AgentCapabilityTemplateNotFoundError } from '../domain/agent/agentService';
import { getPresetById } from '../domain/agent/agentPresets';
import {
  AgentContextSource as AgentContextSourceType,
  AgentContextBinding,
  AGENT_CONTEXT_SOURCE_VIEWS,
  getTaskTemplateView,
  RuntimeSyncStatus,
  RuntimeHealthStatus
} from '../domain/agent/agentTypes';
import { describeScopeBinding } from './agentScopeOptions';

/**
 * A01 Registry ViewModel（Implementation Freeze §4）：
 * 业务事实（name / responsibility / owner / 支持任务 / formalVersion / hasDraft /
 * 草稿摘要 / 产品状态）统一由 Agent Domain selector 投影覆盖，
 * Fixture 仅承载纯视觉信息（avatarType 等）与 Domain 缺失时的兜底展示，
 * 不再作为这些字段的第二套 SoT；也不再携带演示用的 Skill / Tool 数量。
 */
export interface AgentItem {
  id: string;
  name: string;
  responsibility: string;
  /** 用户可见分类：内置 vs 组织自定义（与域模型 AgentOrigin 一致） */
  origin: 'BUILT_IN' | 'CUSTOM';
  tasks: string[];
  allTasks: string[];
  /**
   * Runtime Provider 仅作内部投影数据保留（A04 发布工作区回退读取），
   * A01 Registry 主 UI 不再展示 / 筛选；技术诊断后续进入 Advanced Runtime Diagnostics。
   */
  runtimeEngine: 'Semovix' | 'Semovix Native' | 'WeKnora';
  formalVersion: string | null;
  releaseTime: string;
  status: 'ACTIVE' | 'DRAFT' | 'DISABLED';
  owner: string;
  hasDraft: boolean;
  description: string;
  avatarType: 'data' | 'governance' | 'knowledge';
  runtimeBinding?: 'ACTIVE' | 'NOT_BOUND' | null;
  runtimeRevision?: string | null;
  templateId?: string;
}

/* ─────────────────────────────────────────────────────────────
   A01 产品状态投影 (V1.1 §7.4)：用户只看到产品状态，
   Runtime / Sync 底层状态映射收敛，不把 SYNCED / MOCK_RUNTIME /
   READY / WeKnora 作为 Registry 状态展示。
   ───────────────────────────────────────────────────────────── */
export type AgentProductStatusKey =
  | 'NORMAL'
  | 'UNPUBLISHED'
  | 'PENDING_CHANGES'
  | 'NEEDS_ATTENTION'
  | 'DISABLED';

export interface AgentProductStatusView {
  key: AgentProductStatusKey;
  label: string;
}

/**
 * 来自 Domain Active Binding 的运行信号（Commit 08 TASK 21）：
 * 只用于产品状态推导，不在普通 UI 展示原始 enum。
 */
export interface AgentRuntimeSignals {
  activeBindingVersion: string | null;
  syncStatus: RuntimeSyncStatus | null;
  healthStatus: RuntimeHealthStatus | null;
}

/**
 * 轻量 View Projection：由 Registry ViewModel + Domain Active Binding 信号推导用户可见状态。
 * 优先级（Commit 08 TASK 21）：
 * - 已停用：DISABLED
 * - 未发布：formalVersion = null（无 Binding 不算需关注）
 * - 需关注：已发布但 Active Binding 缺失 / agentVersion 与 currentPublishedVersion 错配 /
 *   syncStatus FAILED / OUT_OF_SYNC / healthStatus UNAVAILABLE。
 *   integrationMode = MOCK_RUNTIME 本身不触发需关注（原型即 Mock Integration）
 * - 有未发布修改：已发布且存在草稿
 * - 正常：其余
 */
export function getAgentProductStatus(
  agent: AgentItem,
  runtimeSignals?: AgentRuntimeSignals | null
): AgentProductStatusView {
  if (agent.status === 'DISABLED') {
    return { key: 'DISABLED', label: '已停用' };
  }
  if (agent.formalVersion === null) {
    return { key: 'UNPUBLISHED', label: '未发布' };
  }
  if (
    runtimeSignals &&
    (runtimeSignals.activeBindingVersion === null ||
      runtimeSignals.activeBindingVersion !== agent.formalVersion ||
      runtimeSignals.syncStatus === 'FAILED' ||
      runtimeSignals.syncStatus === 'OUT_OF_SYNC' ||
      runtimeSignals.healthStatus === 'UNAVAILABLE')
  ) {
    return { key: 'NEEDS_ATTENTION', label: '需关注' };
  }
  if (agent.hasDraft) {
    return { key: 'PENDING_CHANGES', label: '有未发布修改' };
  }
  return { key: 'NORMAL', label: '正常' };
}

/** 类型弱展示标签：内置 / 自定义 */
export function getAgentOriginLabel(origin: 'BUILT_IN' | 'CUSTOM'): string {
  return origin === 'BUILT_IN' ? '内置' : '自定义';
}

export const INITIAL_AGENTS: AgentItem[] = [
  {
    id: 'data_intelligence',
    name: '数据智能伙伴',
    responsibility: '面向业务目标完成找数、问数与数据分析',
    origin: 'BUILT_IN',
    tasks: ['找数据', '问数据'],
    allTasks: ['找数据', '问数据', '数据分析'],
    runtimeEngine: 'Semovix Native',
    formalVersion: 'v1.3',
    releaseTime: '昨天发布',
    status: 'ACTIVE',
    owner: '数据智能团队',
    hasDraft: false,
    description: '专注于业务数据消费场景，结合指标语义、数据目录与分析模型，自动执行跨库探查、计算与归因下钻。',
    avatarType: 'data',
  },
  {
    id: 'semantic_governance',
    name: '语义治理伙伴',
    responsibility: '辅助企业完成语义理解、业务对象与治理任务',
    origin: 'BUILT_IN',
    tasks: ['语义理解', '业务对象发现'],
    allTasks: ['语义理解', '业务对象发现', '业务对象合并', '标准匹配', '指标治理', '数据资源网络构建', '领域知识网络构建'],
    runtimeEngine: 'Semovix Native',
    formalVersion: 'v1.2',
    releaseTime: '3 天前发布',
    status: 'ACTIVE',
    owner: '语义治理团队',
    hasDraft: false,
    description: '面向数据治理与语义建模专家，提供表/字段语义推理、实体发现、标准映射与口径冲突仲裁能力。',
    avatarType: 'governance',
  },
  {
    id: 'enterprise_knowledge',
    name: '企业知识伙伴',
    responsibility: '基于企业正式知识回答问题并开展跨文档研究',
    origin: 'BUILT_IN',
    tasks: ['企业知识问答', '文档研究'],
    allTasks: ['企业知识问答', '文档研究', 'Wiki 研究'],
    runtimeEngine: 'WeKnora',
    formalVersion: 'v1.4',
    releaseTime: '今天 09:42 发布',
    status: 'ACTIVE',
    owner: '企业知识治理组',
    hasDraft: true,
    description: '依托企业级 WeKnora 知识引擎，对结构化与非结构化制度、规范、业务字典进行多跳推理与准确回答。',
    avatarType: 'knowledge',
  },
];

/**
 * 支持任务 ViewModel：真实数据为 taskTemplateId / version / enabled，
 * name / desc 仅为展示投影 (任务定义由 Task Engine 统一管理)。
 */
export interface AgentTaskItem {
  taskTemplateId: string;
  version: string;
  enabled: boolean;
  name: string;
  desc: string;
  status: 'ACTIVE' | 'DRAFT_NEW' | 'DISABLED';
}

/**
 * 上下文来源 ViewModel：真实数据为 sourceType 枚举，
 * 实际运行上下文 = 智能体允许范围 ∩ 当前用户权限 ∩ 当前任务范围。
 */
export interface AgentContextSource {
  sourceType: AgentContextSourceType;
  label: string;
  desc: string;
  type: 'BASE' | 'DRAFT_NEW';
}

export interface AgentDiffItem {
  field: string;
  changeText: string;
  tag: string;
  isNew?: boolean;
}

export interface AgentDefinitionDetail {
  agentId: string;
  name: string;
  responsibility: string;
  /** Runtime 角色行为说明（Commit 06「高级角色说明」编辑的数据桥接，本 Commit 不新增 UI） */
  roleInstruction?: string;
  owner: string;
  agentType: '系统智能体' | '受管智能体';
  category: 'SYSTEM' | 'MANAGED';
  /** 用户可见分类：内置 vs 组织自定义（与域模型 AgentOrigin 一致） */
  origin: 'BUILT_IN' | 'CUSTOM';
  formalVersion: string | null; // null if unreleased (首次创建状态)
  status: 'ACTIVE' | 'DRAFT';
  runtimeEngine: 'Semovix' | 'Semovix Native' | 'WeKnora';
  runtimeBinding: 'ACTIVE' | 'NOT_BOUND' | null; // null or NOT_BOUND indicates 正式运行配置：尚未建立
  runtimeRevision: string | null;
  lastReleaseTime: string | null;
  lastSyncTime: string | null;
  tasks: AgentTaskItem[];
  contextSources: AgentContextSource[];
  capabilityMode: string;
  capabilityDesc: string;
  baseCapabilityMode?: string;
  isCapabilityUpgraded?: boolean;
  modelStrategy: string;
  modelStrategyDesc: string;
  maxAutonomy: string;
  maxAutonomyDesc: string;
  draftChanges: AgentDiffItem[];
  testSandbox: {
    welcomeMessage: string;
    suggestedQueries: string[];
    sampleResponses: Array<{
      trigger: string;
      reply: string;
      sources?: string[];
    }>;
    defaultResponse: {
      reply: string;
      sources?: string[];
    };
  };
}

export const INITIAL_AGENT_DEFINITIONS: Record<string, AgentDefinitionDetail> = {
  enterprise_knowledge: {
    agentId: 'agt_ent_knowledge_01',
    name: '企业知识伙伴',
    responsibility: '企业知识伙伴负责基于当前用户有权访问的企业正式知识回答问题，并支持跨文档、Wiki 与知识空间开展深入研究。回答应优先采用当前有效的正式知识来源；当证据不足、来源冲突或无法确认企业事实时，应明确说明，不得将推测表达为正式结论。',
    owner: '企业知识治理组',
    agentType: '受管智能体',
    category: 'MANAGED',
    origin: 'BUILT_IN',
    formalVersion: 'v1.4',
    status: 'ACTIVE',
    runtimeEngine: 'WeKnora',
    runtimeBinding: 'ACTIVE',
    // 二十四: WeKnora 真实 API 未接入，如实标注 MOCK_RUNTIME，不再伪装 r37 / 实时同步
    runtimeRevision: 'MOCK_RUNTIME',
    lastReleaseTime: '2026-08-25 16:40',
    lastSyncTime: '未接入 (MOCK_RUNTIME)',
    tasks: [
      { taskTemplateId: 'KNOWLEDGE_QA_V1', version: 'V1', enabled: true, name: '企业知识问答', desc: '基于企业标准制度与规范进行精准事实提取', status: 'ACTIVE' },
      { taskTemplateId: 'DOCUMENT_RESEARCH_V1', version: 'V1', enabled: true, name: '文档研究', desc: '跨长篇白皮书与政策文档进行多章节归纳对比', status: 'ACTIVE' },
      { taskTemplateId: 'WIKI_RESEARCH_V1', version: 'V1', enabled: true, name: 'Wiki 研究', desc: '企业内部 Wiki 拓扑词条与领域专有名词协同检索', status: 'DRAFT_NEW' },
    ],
    contextSources: [
      { sourceType: 'KNOWLEDGE_SPACE', label: '知识空间', desc: '正式基线已有 · 企业制度 / 产品知识（草稿新增：数据治理规范空间）', type: 'BASE' },
      { sourceType: 'DOCUMENT', label: '企业文档', desc: '正式基线已有 · 涵盖产品白皮书、架构规范', type: 'BASE' },
      { sourceType: 'WIKI', label: '企业 Wiki', desc: '草稿新增 · Wiki 拓扑词条检索来源', type: 'DRAFT_NEW' },
    ],
    capabilityMode: 'Wiki + RAG 混合',
    capabilityDesc: '多跳语义拓扑检索与混合召回',
    baseCapabilityMode: '精准知识问答',
    isCapabilityUpgraded: true,
    modelStrategy: '质量优先',
    modelStrategyDesc: '严禁无依据推测，优先高确定性知识依据',
    maxAutonomy: '建议',
    maxAutonomyDesc: '以提供方案与可追溯依据为主',
    draftChanges: [
      { field: '知识范围', changeText: '+ 新增：数据治理规范', tag: 'CONTEXT ADDED' },
      { field: '能力模式', changeText: '精准知识问答 → Wiki + RAG 混合研究', tag: 'MODE UPGRADE' },
    ],
    testSandbox: {
      welcomeMessage: '您好，我是「企业知识伙伴 (草稿环境 · v1.4+Draft)」。当前已挂载 3 个知识空间（含草稿新增的《数据治理规范》）及 Wiki + RAG 混合检索。请输入您想验证的知识查询。',
      suggestedQueries: [
        '数据治理规范对字段映射冲突有什么审核要求？',
        '员工报销与差旅审批的流程规范是什么？'
      ],
      sampleResponses: [
        {
          trigger: '治理',
          reply: '根据草稿新增的《数据治理规范 V2.4》及企业数据资产管理办法：\n1. 企业所有核心数据元素与值域标准需由领域数据负责人进行三审发布；\n2. 字段映射冲突需在 3 个工作日内由数据质量组完成仲裁。\n该依据来自草稿新增的「数据治理规范」知识空间。',
          sources: ['《数据治理规范 V2.4》第 4.2 节', '《数据资产目录管理办法》']
        },
        {
          trigger: '报销',
          reply: '已检索《企业员工手册 2026版》财务规范章节：\n1. 国内差旅标准需在行前由直属部门总监审批；\n2. 机票、高铁与住宿发票应在出差结束后 5 个工作日内完成报销提报。\n本依据来自企业正式制度空间。',
          sources: ['《企业员工手册 2026版》财务报销细则']
        }
      ],
      defaultResponse: {
        reply: '已通过 Wiki + RAG 混合研究在「企业制度」与「产品知识」空间完成多跳检索。已确认相关正式文件条款并生成结构化答复。',
        sources: ['《企业员工手册 2026版》', '《Semovix 产品白皮书》']
      }
    }
  },

  data_intelligence: {
    agentId: 'agt_data_intel_02',
    name: '数据智能伙伴',
    responsibility: '数据智能伙伴面向企业业务目标完成找数、问数与多维数据分析，自动解析业务口径与指标语义，执行跨库取数、计算探查与异常下钻。回答应以企业正式指标与宽表数据为依据，提供可解释的分析逻辑与计算口径。',
    owner: '数据智能团队',
    agentType: '受管智能体',
    category: 'MANAGED',
    origin: 'BUILT_IN',
    formalVersion: 'v1.3',
    status: 'ACTIVE',
    runtimeEngine: 'Semovix Native',
    runtimeBinding: 'ACTIVE',
    runtimeRevision: 'r24',
    lastReleaseTime: '昨天 14:20',
    lastSyncTime: '今天 08:30',
    tasks: [
      { taskTemplateId: 'FIND_DATA_V1', version: 'V1', enabled: true, name: '找数据', desc: '智能检索企业数据目录、元数据与明细宽表资产', status: 'ACTIVE' },
      { taskTemplateId: 'QUERY_DATA_V1', version: 'V1', enabled: true, name: '问数据', desc: '解析业务自然语言意图并生成指标取数与聚合探查逻辑', status: 'ACTIVE' },
      { taskTemplateId: 'ANALYZE_DATA_V1', version: 'V1', enabled: true, name: '数据分析', desc: '多维指标交叉比对、同环比异常波动归因下钻', status: 'ACTIVE' },
    ],
    contextSources: [
      { sourceType: 'METRIC', label: '指标注册表', desc: '正式基线已有 · 涵盖已发布核心指标与派生维度', type: 'BASE' },
      { sourceType: 'MARKETPLACE', label: '数据服务超市', desc: '正式基线已有 · 挂载 180+ 数据表与逻辑视图元数据', type: 'BASE' },
      { sourceType: 'DATA_SEMANTICS', label: '数据语义层', desc: '正式基线已有 · 覆盖街镇老龄化照护与热线诉求记录', type: 'BASE' },
    ],
    capabilityMode: '指标计算与多维归因',
    capabilityDesc: '语义模型与指标下钻计算 (Text-to-SQL + Metric Execution)',
    modelStrategy: '代码与逻辑优先',
    modelStrategyDesc: '精准解析 SQL 计算逻辑与多维聚合，确保口径一致性',
    maxAutonomy: '建议',
    maxAutonomyDesc: '以提供取数结果、方案与下钻归因为主',
    draftChanges: [],
    testSandbox: {
      welcomeMessage: '您好，我是「数据智能伙伴 (正式环境 · v1.3)」。已挂载企业指标注册表与数据服务超市。请输入您想探查的数据分析或找数问题。',
      suggestedQueries: [
        '分析上月各街镇老龄化照护支出趋势与高支出异常归因',
        '查询 pop_service_hotline 热线工单平均响应时长'
      ],
      sampleResponses: [
        {
          trigger: '老龄化',
          reply: '基于指标「老龄化照护月度支出」及「民生服务主题宽表」下钻分析：\n1. 上月各街镇总照护支出 1,482 万元，环比增长 6.8%；\n2. 枫林街道与斜土街道因新增「居家助餐适老化改造」项目，环比增幅达 18.2%，为主要拉动因子；\n3. 已自动生成对应多维透视表与 SQL 查询语句。',
          sources: ['指标: met_elderly_care_expense', '表: dwd_pop_elderly_service_detail']
        },
        {
          trigger: '工单',
          reply: '已查询 pop_service_hotline 表元数据与实时聚合指标：\n1. 本季度热线工单平均响应时长为 18.4 分钟，达标率 94.2%；\n2. 积压工单主要集中在「雨季房屋渗漏修缮」类目。',
          sources: ['表: pop_service_hotline', '指标: met_hotline_resp_time']
        }
      ],
      defaultResponse: {
        reply: '已解析您的找数需求，已在指标注册表中完成口径对齐，并生成对应维度聚合查询。',
        sources: ['Semovix Native Semantic Layer', '企业指标注册表']
      }
    }
  },

  semantic_governance: {
    agentId: 'agt_sem_gov_03',
    name: '语义治理伙伴',
    responsibility: '语义治理伙伴辅助企业完成语义理解、业务对象、标准校验、字段对齐与知识网络治理任务。基于国家标准与企业业务术语字典，自动扫描治理资产，识别命名冲突与标准偏差，生成结构化治理提案。',
    owner: '语义治理团队',
    agentType: '受管智能体',
    category: 'MANAGED',
    origin: 'BUILT_IN',
    formalVersion: 'v1.2',
    status: 'ACTIVE',
    runtimeEngine: 'Semovix Native',
    runtimeBinding: 'ACTIVE',
    runtimeRevision: 'r19',
    lastReleaseTime: '3 天前发布',
    lastSyncTime: '今天 09:15',
    tasks: [
      { taskTemplateId: 'SEMANTIC_UNDERSTANDING_V1', version: 'V1', enabled: true, name: '语义理解', desc: '解析表结构与字段名业务含义，自动生成注释与标准建议', status: 'ACTIVE' },
      { taskTemplateId: 'BUSINESS_OBJECT_DISCOVERY_V1', version: 'V1', enabled: true, name: '业务对象发现', desc: '发现潜在实体概念，辅助业务对象关系拓扑建模', status: 'ACTIVE' },
      { taskTemplateId: 'OBJECT_MERGE_V1', version: 'V1', enabled: true, name: '业务对象合并', desc: '识别同一业务实体的重复对象并生成合并提案', status: 'ACTIVE' },
      { taskTemplateId: 'STANDARD_MATCHING_V1', version: 'V1', enabled: true, name: '标准匹配', desc: '国家/行业标准对齐、数据元素标准匹配与值域校验', status: 'ACTIVE' },
      { taskTemplateId: 'METRIC_GOVERNANCE_V1', version: 'V1', enabled: true, name: '指标治理', desc: '指标口径审查、命名规范检查与重复口径识别', status: 'ACTIVE' },
      { taskTemplateId: 'DRKN_BUILD_V1', version: 'V1', enabled: true, name: '数据资源网络构建', desc: '构建数据资源之间的关联网络拓扑', status: 'ACTIVE' },
      { taskTemplateId: 'DKN_BUILD_V1', version: 'V1', enabled: true, name: '领域知识网络构建', desc: '构建领域知识词条与语义关系网络', status: 'ACTIVE' },
    ],
    contextSources: [
      { sourceType: 'BUSINESS_TERM', label: '业务术语', desc: '正式基线已有 · 包含 GB/T 与行业规范标准元素', type: 'BASE' },
      { sourceType: 'BUSINESS_OBJECT', label: '业务对象', desc: '正式基线已有 · 涵盖自然人、组织机构、服务事件', type: 'BASE' },
      { sourceType: 'DATA_SEMANTICS', label: '数据语义层', desc: '正式基线已有 · 记录历史人工确认的映射规则', type: 'BASE' },
    ],
    capabilityMode: '语义合规审查与标准对齐',
    capabilityDesc: '数据标准比对与对象映射 (Schema Semantic Alignment)',
    modelStrategy: '严谨与一致性优先',
    modelStrategyDesc: '以标准规范与事实映射为第一准则，严控模糊映射',
    maxAutonomy: '提议',
    maxAutonomyDesc: '生成待裁决治理变更提案供专家确认',
    draftChanges: [],
    testSandbox: {
      welcomeMessage: '您好，我是「语义治理伙伴 (正式环境 · v1.2)」。当前已连接 Semovix Native 治理引擎与数据标准库。请输入需要治理审阅的表或字段名称。',
      suggestedQueries: [
        '检测 pop_service_hotline 表的字段命名与标准对齐情况',
        '为 phone_num 字段匹配国家通用数据元素标准'
      ],
      sampleResponses: [
        {
          trigger: 'hotline',
          reply: '已审阅表 pop_service_hotline 语义定义：\n1. 检测到 4 个字段已完成标准映射（如 citizen_id 映射至「公民身份号码」）；\n2. 发现 1 处潜在冲突：resident_contact_phone 与标准元素「联系电话」命名存在前缀偏差，已提议自动对齐建议。',
          sources: ['表: pop_service_hotline', '数据标准: GB/T 2260-2007']
        },
        {
          trigger: 'phone',
          reply: '为字段 phone_num 匹配到推荐标准「DE00293 联系电话」：\n推荐数据类型：VARCHAR(20)，符合 E.164 国际与国内号段校验规则。置信度：98.4%。',
          sources: ['国家通用数据元素标准 DE00293']
        }
      ],
      defaultResponse: {
        reply: '已完成语义分析，未发现阻断性口径冲突。可生成对应治理建议工单。',
        sources: ['Semovix Native Governance Engine']
      }
    }
  }
};

/**
 * Helper to generate a REAL new agent draft from a template
 * Ensures:
 * - formalVersion = null (正式版本：暂无)
 * - status = 'DRAFT' (未发布草稿)
 * - runtimeBinding = null (正式运行配置：尚未建立)
 * - runtimeEngine based on template ('Semovix Native' or 'WeKnora')
 */
export function createAgentDraft(agentData: {
  name: string;
  responsibility: string;
  owner: string;
  templateId: string;
  runtimeTarget: string;
  /** V1.1 工作范围：A02 创建路径显式传入的 UI Binding */
  contextBindings?: AgentContextBinding[];
}): { agentItem: AgentItem; definition: AgentDefinitionDetail } {
  // V1.1 Fix：严格解析 capability preset。禁止 unknown templateId 静默 fallback 成治理模板，
  // 完整 Create Path 与 agentService.createDraftFromPreset 的 Unknown Preset Error 语义一致。
  const resolvedPreset = getPresetById(agentData.templateId);
  if (!resolvedPreset) {
    throw new AgentCapabilityTemplateNotFoundError(agentData.templateId);
  }

  const isData = resolvedPreset.presetId === 'DATA_INTELLIGENCE';
  const isKnowledge = resolvedPreset.presetId === 'ENTERPRISE_KNOWLEDGE';
  const isGovernance = resolvedPreset.presetId === 'SEMANTIC_GOVERNANCE';

  // Seed the formal domain model via agentService
  const domainResult = agentService.createDraftFromPreset({
    presetId: resolvedPreset.presetId,
    name: agentData.name,
    responsibility: agentData.responsibility,
    owner: agentData.owner,
    contextBindings: agentData.contextBindings
  });

  const newId = domainResult.definition.agentId;

  // runtime / avatar 投影从 resolvedPreset 推导，不再按 else-governance 兜底
  const runtimeEngine: 'Semovix Native' | 'WeKnora' =
    resolvedPreset.runtimeTarget === 'WEKNORA' ? 'WeKnora' : 'Semovix Native';
  const avatarType: 'data' | 'governance' | 'knowledge' = resolvedPreset.symbolType;

  // 真实数据：从域模型的任务模板绑定与上下文来源枚举推导 (首次创建全部为草稿配置)
  const tasks: AgentTaskItem[] = domainResult.definition.supportedTaskTemplates.map((binding) => {
    const view = getTaskTemplateView(binding.taskTemplateId);
    return {
      taskTemplateId: binding.taskTemplateId,
      version: binding.version,
      enabled: binding.enabled,
      name: view.name,
      desc: view.desc,
      status: 'DRAFT_NEW' as const
    };
  });
  // 主工作范围 Binding（A02 创建路径只落一个主范围 Binding）
  const primaryBinding = domainResult.draft.contextBindings[0];
  const scopeDesc = primaryBinding ? describeScopeBinding(primaryBinding) : '';
  const contextSources: AgentContextSource[] = domainResult.definition.allowedContextSources.map(
    (sourceType) => ({
      sourceType,
      label: AGENT_CONTEXT_SOURCE_VIEWS[sourceType].label,
      // 主范围来源的描述反映本次选择的工作范围（AC-15：A03 能表达刚选择的范围）
      desc:
        primaryBinding && primaryBinding.sourceType === sourceType && scopeDesc
          ? scopeDesc
          : `草稿配置 · 拟允许访问${AGENT_CONTEXT_SOURCE_VIEWS[sourceType].label}`,
      type: 'DRAFT_NEW' as const
    })
  );

  // 展示配置基于原型类别
  let capabilityMode = '';
  let capabilityDesc = '';
  let modelStrategy = '';
  let modelStrategyDesc = '';
  let maxAutonomy = '建议';
  let maxAutonomyDesc = '';
  let suggestedQueries: string[] = [];

  if (isData) {
    capabilityMode = '指标计算与多维归因';
    capabilityDesc = '语义模型与指标下钻计算 (Text-to-SQL + Metric Execution)';
    modelStrategy = '代码与逻辑优先';
    modelStrategyDesc = '精准解析 SQL 计算逻辑与多维聚合，确保口径一致性';
    maxAutonomy = '建议';
    maxAutonomyDesc = '以提供取数方案与下钻归因为主';
    suggestedQueries = [
      '测试向草稿智能体发起指标探查问题',
      '验证数据源关联与 SQL 计算逻辑'
    ];
  } else if (isGovernance) {
    capabilityMode = '语义合规审查与标准对齐';
    capabilityDesc = '数据标准比对与对象映射 (Schema Semantic Alignment)';
    modelStrategy = '严谨与一致性优先';
    modelStrategyDesc = '以标准规范与事实映射为第一准则，严控模糊映射';
    maxAutonomy = '提议';
    maxAutonomyDesc = '生成待裁决治理变更提案供专家确认';
    suggestedQueries = [
      '测试数据标准对齐规则校验',
      '验证字段命名冲突审阅能力'
    ];
  } else {
    capabilityMode = '精准知识问答';
    capabilityDesc = '企业知识与制度检索增强 (WeKnora Bridge)';
    modelStrategy = '质量优先';
    modelStrategyDesc = '严禁无依据推测，优先高确定性知识依据';
    maxAutonomy = '建议';
    maxAutonomyDesc = '以提供可溯源依据与方案为主';
    suggestedQueries = [
      '向新创建的知识伙伴提问测试用例',
      '验证知识库检索与溯源标注'
    ];
  }

  const allTaskNames = tasks.map(t => t.name);

  const agentItem: AgentItem = {
    id: newId,
    name: agentData.name,
    responsibility: agentData.responsibility,
    origin: domainResult.definition.origin, // 用户创建 → CUSTOM
    tasks: allTaskNames.slice(0, 2),
    allTasks: allTaskNames,
    runtimeEngine,
    formalVersion: null, // 正式版本：暂无
    releaseTime: '尚未发布',
    status: 'DRAFT',
    owner: agentData.owner,
    hasDraft: true,
    description: agentData.responsibility,
    avatarType,
    runtimeBinding: null, // 正式运行配置：尚未建立
    runtimeRevision: null,
    templateId: agentData.templateId
  };

  const definition: AgentDefinitionDetail = {
    agentId: `agt_${newId}`,
    name: agentData.name,
    responsibility: agentData.responsibility,
    roleInstruction: domainResult.definition.roleInstruction,
    owner: agentData.owner,
    agentType: '受管智能体',
    category: 'MANAGED',
    origin: domainResult.definition.origin, // 用户创建 → CUSTOM
    formalVersion: null, // 首次创建状态：无正式版本
    status: 'DRAFT',
    runtimeEngine,
    runtimeBinding: null, // 正式运行配置：尚未建立
    runtimeRevision: null,
    lastReleaseTime: null,
    lastSyncTime: null,
    tasks,
    contextSources,
    capabilityMode,
    capabilityDesc,
    modelStrategy,
    modelStrategyDesc,
    maxAutonomy,
    maxAutonomyDesc,
    draftChanges: [
      { field: '初始草稿', changeText: `基于能力模板「${isData ? '数据查找与分析' : isGovernance ? '语义治理与审查' : '企业知识问答与研究'}」生成未发布草稿`, tag: 'NEW DRAFT', isNew: true },
      { field: '工作范围', changeText: scopeDesc, tag: 'SCOPE', isNew: true }
    ],
    // §04/§05：testSandbox 仅保留结构占位，不再伪造「沙盒执行通过」类测试结论；
    // 真实发布结论以 A04 发布验证（Domain Release Validation）为准
    testSandbox: {
      welcomeMessage: `您好，我是新创建的草稿智能体「${agentData.name} (未发布草稿)」。工作范围：${scopeDesc}。当前尚未建立正式运行配置，需通过发布验证并正式发布后才会生成首个正式版本。`,
      suggestedQueries,
      sampleResponses: [
        {
          trigger: '测试',
          reply: `已收到对「${agentData.name}」的查看请求。\n当前草稿配置：\n- 目标运行引擎：${runtimeEngine}\n- 支持任务：${allTaskNames.join('、')}\n- 能力模式：${capabilityMode}\n- 正式版本：尚未发布\n当前版本尚未执行真实业务测试，需进入发布验证完成基础运行检查与发布质量基线检查。`,
          sources: ['当前草稿配置（未执行真实测试）']
        }
      ],
      defaultResponse: {
        reply: `已接收指令。智能体「${agentData.name}」基于模板初始配置解析成功，待通过发布验证并发布正式版本后建立线上运行。`,
        sources: ['当前草稿配置（未执行真实测试）']
      }
    }
  };

  return { agentItem, definition };
}
