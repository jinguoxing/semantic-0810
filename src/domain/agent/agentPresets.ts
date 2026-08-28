/**
 * Semovix Agent Domain Model - Official Presets
 * Replaces the legacy template system with 3 official Managed Agent Presets:
 * 1. DATA_INTELLIGENCE: 数据智能伙伴 (Semovix Native)
 * 2. SEMANTIC_GOVERNANCE: 语义治理伙伴 (Semovix Native)
 * 3. ENTERPRISE_KNOWLEDGE: 企业知识伙伴 (WeKnora)
 */

import { ManagedAgentPreset } from './agentTypes';

export const MANAGED_AGENT_PRESETS: Record<string, ManagedAgentPreset> = {
  DATA_INTELLIGENCE: {
    presetId: 'DATA_INTELLIGENCE',
    presetName: '数据智能伙伴',
    categoryTag: '数据智能',
    description: '面向业务目标完成找数、问数与数据分析。结合指标语义、数据资产目录与分析模型，自动执行跨库探查、计算与归因下钻。',
    selectionSummary: '将以业务找数、问数与多维数据分析为主要职责，并以 Semovix Native 作为目标数据分析运行引擎。',
    defaultName: '数据智能伙伴',
    defaultResponsibility: '解析业务口径与指标语义，面向业务目标完成找数、问数与多维下钻分析。回答以企业指标与宽表数据为依据，提供可解释的分析逻辑。',
    defaultOwner: '数据智能团队',
    runtimeTarget: 'SEMOVIX_NATIVE',
    runtimeEngineLabel: 'Semovix Native',
    supportedTaskTemplateIds: ['task_find_data', 'task_query_data', 'task_analyze_data'],
    supportedTaskNames: ['找数据', '问数据', '数据分析'],
    capabilityPreset: '指标计算与多维归因',
    capabilityPresetDesc: '语义模型与指标下钻计算 (Text-to-SQL + Metric Execution)',
    modelPolicyId: 'POLICY_LOGIC_FIRST',
    modelPolicyName: '代码与逻辑优先',
    defaultMaxAutonomy: 'SUGGEST',
    autonomyDesc: '以提供取数结果、方案与下钻归因为主',
    allowedContextSources: [
      { id: 'ctx_metrics', name: '企业指标注册表', desc: '涵盖已发布核心指标与派生维度', type: 'BASE' },
      { id: 'ctx_catalog', name: '数据资产目录', desc: '挂载 180+ 数据表与逻辑视图元数据', type: 'BASE' },
      { id: 'ctx_dw_pop', name: '民生服务主题宽表', desc: '覆盖街镇老龄化照护与热线诉求记录', type: 'BASE' },
    ],
    symbolType: 'data'
  },

  SEMANTIC_GOVERNANCE: {
    presetId: 'SEMANTIC_GOVERNANCE',
    presetName: '语义治理伙伴',
    categoryTag: '语义治理',
    description: '辅助企业完成语义理解、业务对象、标准校验、字段对齐与知识网络治理任务。基于国家标准与企业业务术语字典生成结构化治理提案。',
    selectionSummary: '将以语义理解、业务对象、标准与指标网络治理为主要职责，并以 Semovix Native 作为目标治理运行引擎。',
    defaultName: '语义治理伙伴',
    defaultResponsibility: '扫描治理资产与业务对象，识别标准冲突与命名歧义，生成结构化治理提案。以标准规范与事实映射为第一准则，严控模糊映射。',
    defaultOwner: '语义治理团队',
    runtimeTarget: 'SEMOVIX_NATIVE',
    runtimeEngineLabel: 'Semovix Native',
    supportedTaskTemplateIds: ['task_semantic_understand', 'task_business_object', 'task_standard_governance'],
    supportedTaskNames: ['语义理解', '业务对象', '标准治理'],
    extraTasksCount: 4,
    capabilityPreset: '语义合规审查与标准对齐',
    capabilityPresetDesc: '数据标准比对与对象映射 (Schema Semantic Alignment)',
    modelPolicyId: 'POLICY_STRICT_CONSISTENCY',
    modelPolicyName: '严谨与一致性优先',
    defaultMaxAutonomy: 'PROPOSE',
    autonomyDesc: '生成待裁决治理变更提案供专家确认',
    allowedContextSources: [
      { id: 'ctx_gov_standards', name: '行业数据标准库', desc: '包含 GB/T 与行业规范标准元素', type: 'BASE' },
      { id: 'ctx_gov_objects', name: '核心业务对象拓扑', desc: '涵盖自然人、组织机构、服务事件', type: 'BASE' },
      { id: 'ctx_gov_mapping', name: '字段语义理解知识库', desc: '记录历史人工确认的映射规则', type: 'BASE' },
    ],
    symbolType: 'governance'
  },

  ENTERPRISE_KNOWLEDGE: {
    presetId: 'ENTERPRISE_KNOWLEDGE',
    presetName: '企业知识伙伴',
    categoryTag: '企业知识',
    description: '基于企业正式知识开展可信问答、跨文档研究与 Wiki 研究。优先采用当前有效的正式知识来源；当证据不足或来源冲突时严禁推测。',
    selectionSummary: '将以企业知识问答与研究为主要职责，并以 WeKnora 作为目标知识运行引擎。',
    defaultName: '企业知识伙伴',
    defaultResponsibility: '基于企业正式知识回答问题、开展跨文档与 Wiki 研究，并提供可追溯的知识依据。严禁无依据推测，优先高确定性知识依据。',
    defaultOwner: '企业知识治理组',
    runtimeTarget: 'WEKNORA',
    runtimeEngineLabel: 'WeKnora',
    supportedTaskTemplateIds: ['task_qa', 'task_doc_research', 'task_wiki_research'],
    supportedTaskNames: ['知识问答', '文档研究', 'Wiki 研究'],
    capabilityPreset: '精准知识问答',
    capabilityPresetDesc: '企业知识与制度检索增强 (WeKnora Bridge)',
    modelPolicyId: 'POLICY_QUALITY_FIRST',
    modelPolicyName: '质量优先',
    defaultMaxAutonomy: 'SUGGEST',
    autonomyDesc: '以提供方案与可追溯依据为主',
    allowedContextSources: [
      { id: 'ctx_rules', name: '企业制度', desc: '涵盖行政、合规、财务规范', type: 'BASE' },
      { id: 'ctx_product', name: '产品知识', desc: '涵盖产品白皮书、架构规范', type: 'BASE' },
    ],
    symbolType: 'knowledge'
  }
};

export const PRESET_LIST: ManagedAgentPreset[] = Object.values(MANAGED_AGENT_PRESETS);

export function getPresetById(presetId: string): ManagedAgentPreset | undefined {
  const normalized = presetId.toUpperCase().replace(/^TPL_/, '');
  if (MANAGED_AGENT_PRESETS[normalized]) {
    return MANAGED_AGENT_PRESETS[normalized];
  }
  // Fallbacks for lower_case matching
  const match = PRESET_LIST.find(
    (p) => p.presetId.toLowerCase() === presetId.toLowerCase() ||
           p.presetName === presetId ||
           p.symbolType === presetId
  );
  return match;
}
