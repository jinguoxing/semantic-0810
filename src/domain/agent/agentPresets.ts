/**
 * Semovix Agent Domain Model - Capability Templates (V1.1)
 * 三个能力模板（内部沿用稳定 presetId，用户语义为"能力"而非复制内置智能体）：
 * 1. DATA_INTELLIGENCE:     数据查找与分析 (Semovix Native)
 * 2. ENTERPRISE_KNOWLEDGE:  企业知识问答与研究 (WeKnora)
 * 3. SEMANTIC_GOVERNANCE:   语义治理与审查 (Semovix Native)
 *
 * 能力模板名称不得与内置智能体（数据智能伙伴 / 语义治理伙伴 / 企业知识伙伴）重名。
 * Runtime Target 保留在 Domain，但不在创建 UI 中作为用户选择理由展示。
 */

import { ManagedAgentPreset } from './agentTypes';

export const MANAGED_AGENT_PRESETS: Record<string, ManagedAgentPreset> = {
  DATA_INTELLIGENCE: {
    presetId: 'DATA_INTELLIGENCE',
    presetName: '数据查找与分析',
    categoryTag: '数据智能',
    description: '适合业务找数、问数、指标查询和多维数据分析。',
    selectionSummary: '将以业务找数、问数与多维数据分析为主要职责，提供可解释的取数方案与归因分析。',
    defaultName: '数据分析助手',
    defaultResponsibility: '解析业务口径与指标语义，面向业务目标完成找数、问数与多维下钻分析。回答以企业指标与宽表数据为依据，提供可解释的分析逻辑。',
    defaultRoleInstruction:
      '作为企业数据分析智能体，围绕当前任务目标使用有权的数据、指标和业务语义，完成数据发现、问数和分析；优先采用正式指标与已发布语义；证据不足时明确说明；不得绕过权限或自行扩大数据访问范围。',
    defaultOwner: '数据智能团队',
    runtimeTarget: 'SEMOVIX_NATIVE',
    runtimeEngineLabel: 'Semovix Native',
    supportedTaskTemplates: [
      { taskTemplateId: 'FIND_DATA_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'QUERY_DATA_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'ANALYZE_DATA_V1', version: 'V1', enabled: true }
    ],
    capabilityPreset: '指标计算与多维归因',
    capabilityPresetDesc: '语义模型与指标下钻计算 (Text-to-SQL + Metric Execution)',
    modelPolicyId: 'POLICY_LOGIC_FIRST',
    modelPolicyName: '代码与逻辑优先',
    defaultMaxAutonomy: 'SUGGEST',
    autonomyDesc: '以提供取数结果、方案与下钻归因为主',
    // V1.1：数据工作范围按业务域表达，Create UI 只暴露主范围（业务域），不暴露库/表级来源
    allowedContextSources: ['BUSINESS_DOMAIN', 'METRIC', 'MARKETPLACE', 'DATA_SEMANTICS'],
    symbolType: 'data'
  },

  ENTERPRISE_KNOWLEDGE: {
    presetId: 'ENTERPRISE_KNOWLEDGE',
    presetName: '企业知识问答与研究',
    categoryTag: '企业知识',
    description: '适合企业制度问答、知识检索、跨文档研究与 Wiki 研究。',
    selectionSummary: '将以企业知识问答与跨文档研究为主要职责，提供可信答案与可追溯依据。',
    defaultName: '企业知识助手',
    defaultResponsibility: '基于企业正式知识回答问题、开展跨文档与 Wiki 研究，并提供可追溯的知识依据。严禁无依据推测，优先高确定性知识依据。',
    defaultRoleInstruction:
      '作为企业知识智能体，只依据当前用户有权访问的企业正式知识回答和研究；回答优先提供可追溯依据；知识冲突、缺失或无法确认时必须说明；不得把推测表达为企业正式事实。',
    defaultOwner: '企业知识治理组',
    runtimeTarget: 'WEKNORA',
    runtimeEngineLabel: 'WeKnora',
    supportedTaskTemplates: [
      { taskTemplateId: 'KNOWLEDGE_QA_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'DOCUMENT_RESEARCH_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'WIKI_RESEARCH_V1', version: 'V1', enabled: true }
    ],
    capabilityPreset: '精准知识问答',
    capabilityPresetDesc: '企业知识与制度检索增强 (WeKnora Bridge)',
    modelPolicyId: 'POLICY_QUALITY_FIRST',
    modelPolicyName: '质量优先',
    defaultMaxAutonomy: 'SUGGEST',
    autonomyDesc: '以提供方案与可追溯依据为主',
    // V1.1：支持 Wiki 研究任务则必须允许 WIKI 来源；临时附件为知识问答默认来源；WEB 默认不加入
    allowedContextSources: ['KNOWLEDGE_SPACE', 'DOCUMENT', 'WIKI', 'TEMPORARY_ATTACHMENT'],
    symbolType: 'knowledge'
  },

  SEMANTIC_GOVERNANCE: {
    presetId: 'SEMANTIC_GOVERNANCE',
    presetName: '语义治理与审查',
    categoryTag: '语义治理',
    description: '适合数据语义理解、业务对象、标准、指标及知识网络治理。',
    selectionSummary: '将以语义理解、业务对象、标准、指标与知识网络治理为主要职责，生成结构化治理提案。',
    defaultName: '语义治理助手',
    defaultResponsibility: '扫描治理资产与业务对象，识别标准冲突与命名歧义，生成结构化治理提案。以标准规范与事实映射为第一准则，严控模糊映射。',
    defaultRoleInstruction:
      '作为企业语义治理智能体，基于数据事实、业务语义和治理规范生成治理判断与候选方案；冲突或低确定性事项形成待确认提案；不得绕过治理流程直接发布正式语义或治理变更。',
    defaultOwner: '语义治理团队',
    runtimeTarget: 'SEMOVIX_NATIVE',
    runtimeEngineLabel: 'Semovix Native',
    // V1.1：真实 7 个 TaskTemplateBinding，不再以 extraTasksCount 伪造任务
    supportedTaskTemplates: [
      { taskTemplateId: 'SEMANTIC_UNDERSTANDING_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'BUSINESS_OBJECT_DISCOVERY_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'OBJECT_MERGE_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'STANDARD_MATCHING_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'METRIC_GOVERNANCE_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'DRKN_BUILD_V1', version: 'V1', enabled: true },
      { taskTemplateId: 'DKN_BUILD_V1', version: 'V1', enabled: true }
    ],
    capabilityPreset: '语义合规审查与标准对齐',
    capabilityPresetDesc: '数据标准比对与对象映射 (Schema Semantic Alignment)',
    modelPolicyId: 'POLICY_STRICT_CONSISTENCY',
    modelPolicyName: '严谨与一致性优先',
    defaultMaxAutonomy: 'PROPOSE',
    autonomyDesc: '生成待裁决治理变更提案供专家确认',
    // V1.1：治理范围按业务域表达
    allowedContextSources: ['BUSINESS_DOMAIN', 'BUSINESS_TERM', 'BUSINESS_OBJECT', 'DATA_SEMANTICS'],
    symbolType: 'governance'
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
