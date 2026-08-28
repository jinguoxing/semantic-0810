/**
 * A02 创建抽屉的工作范围可选资源 Fixture（原型数据源）。
 *
 * 边界声明：这只是 Create UI 的可选资源投影，不是新的 Domain SoT——
 * 真实 Business Domain / Knowledge Space Query API 接入后可直接替换本文件，
 * 无需改变 AgentContextBinding Contract。
 *
 * 规则：Domain 中保存稳定 resourceId；UI 中展示 name；
 * 严禁把中文显示名当作 resourceIds 保存。
 */
import { AgentContextBinding, AgentContextSource, ContextSelectionMode } from '../domain/agent';

export interface AgentScopeOption {
  resourceId: string;
  name: string;
}

/** 业务域选项（数据查找与分析 / 语义治理与审查共用） */
export const BUSINESS_DOMAIN_OPTIONS: AgentScopeOption[] = [
  { resourceId: 'domain_population', name: '人口主题域' },
  { resourceId: 'domain_public_service', name: '公共服务域' },
  { resourceId: 'domain_data_governance', name: '数据治理域' }
];

/** 知识空间选项（企业知识问答与研究） */
export const KNOWLEDGE_SPACE_OPTIONS: AgentScopeOption[] = [
  { resourceId: 'ks_enterprise_policy', name: '企业制度' },
  { resourceId: 'ks_product_knowledge', name: '产品知识' },
  { resourceId: 'ks_hr_policy', name: 'HR 制度' },
  { resourceId: 'ks_employee_handbook', name: '员工手册' }
];

/**
 * 各能力模板 Stage 2 工作范围区块的 UI 配置。
 * Create 阶段只让用户配置主业务范围，不暴露全部底层 Context Source 枚举。
 */
export interface TemplateScopeConfig {
  /** 主范围来源类型（contextBindings 落库的 sourceType） */
  sourceType: AgentContextSource;
  /** 区块标题：数据工作范围 / 知识范围 / 治理范围 */
  sectionTitle: string;
  /** ALL_ALLOWED 单选项文案 */
  allAllowedLabel: string;
  /** SELECTED 单选项文案 */
  selectedLabel: string;
  /** SELECTED 后的多选列表标题：业务域 / 知识空间 */
  optionsTitle: string;
  options: AgentScopeOption[];
}

export const TEMPLATE_SCOPE_CONFIGS: Record<string, TemplateScopeConfig> = {
  DATA_INTELLIGENCE: {
    sourceType: 'BUSINESS_DOMAIN',
    sectionTitle: '数据工作范围',
    allAllowedLabel: '使用当前用户有权访问的适用数据',
    selectedLabel: '指定业务范围',
    optionsTitle: '业务域',
    options: BUSINESS_DOMAIN_OPTIONS
  },
  ENTERPRISE_KNOWLEDGE: {
    sourceType: 'KNOWLEDGE_SPACE',
    sectionTitle: '知识范围',
    allAllowedLabel: '按用户权限动态使用适用企业知识',
    selectedLabel: '指定知识范围',
    optionsTitle: '知识空间',
    options: KNOWLEDGE_SPACE_OPTIONS
  },
  SEMANTIC_GOVERNANCE: {
    sourceType: 'BUSINESS_DOMAIN',
    sectionTitle: '治理范围',
    allAllowedLabel: '按当前任务范围动态确定',
    selectedLabel: '指定业务域',
    optionsTitle: '业务域',
    options: BUSINESS_DOMAIN_OPTIONS
  }
};

export function getTemplateScopeConfig(presetId: string): TemplateScopeConfig {
  return TEMPLATE_SCOPE_CONFIGS[presetId] ?? TEMPLATE_SCOPE_CONFIGS.DATA_INTELLIGENCE;
}

/** 由 UI 状态构造主范围 Context Binding（A02 创建路径的唯一 Binding） */
export function buildScopeContextBinding(
  config: TemplateScopeConfig,
  selectionMode: ContextSelectionMode,
  resourceIds: string[]
): AgentContextBinding {
  return {
    sourceType: config.sourceType,
    selectionMode,
    resourceIds: selectionMode === 'SELECTED' ? [...resourceIds] : undefined
  };
}

/** 工作范围摘要：右栏与 A03 投影共用 */
export function describeScopeBinding(binding: AgentContextBinding): string {
  if (binding.selectionMode === 'ALL_ALLOWED') {
    const config = Object.values(TEMPLATE_SCOPE_CONFIGS).find((c) => c.sourceType === binding.sourceType);
    return config?.allAllowedLabel ?? '按用户权限动态使用适用资源';
  }
  const names = (binding.resourceIds ?? []).map(
    (id) =>
      [...BUSINESS_DOMAIN_OPTIONS, ...KNOWLEDGE_SPACE_OPTIONS].find((o) => o.resourceId === id)?.name ?? id
  );
  return names.join(' · ');
}
