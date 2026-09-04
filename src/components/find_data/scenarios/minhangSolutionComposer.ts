import {
  DataSolutionItem,
  FindDataResource,
  RelationshipEvidence,
  RequirementHypothesis,
  ResourceId,
  SolutionGap
} from '../model/FindDataTask';

export interface MinhangSolutionComposition {
  resourceIds: ResourceId[];
  items: DataSolutionItem[];
  gaps: SolutionGap[];
  relationshipEvidence: RelationshipEvidence[];
  coverageSummary: string[];
  limitationSummary: string[];
  readiness: 'COMPLETE' | 'PARTIAL' | 'GAP_ONLY';
}

const openGap = (id: string, title: string, description: string): SolutionGap => ({
  id, title, description, impactLevel: 'HIGH', mitigation: '补充正式资源或调整当前分析口径后重新评估。', status: 'OPEN'
});

const coreItem = (resourceId: ResourceId): DataSolutionItem => ({
  resourceId, role: 'CORE', inclusionState: 'SELECTED', coverage: ['街镇与月度分析核心指标'], limitations: [], evidenceRefs: ['闵行养老供给确定性组合']
});

function includesAny(values: string[], expressions: RegExp[]): boolean {
  return expressions.some((expression) => values.some((value) => expression.test(value)));
}

export function composeMinhangSolution(
  hypothesis: RequirementHypothesis,
  resources: Record<ResourceId, FindDataResource>
): MinhangSolutionComposition {
  const focus = hypothesis.analysisFocus;
  const bedDefinition = hypothesis.bedDefinition ?? '';
  const populationDefinition = hypothesis.populationDefinition ?? '';
  const serviceUse = includesAny(focus, [/实际服务使用/, /养老服务使用/, /服务.*实际使用/]);
  const publicService = includesAny(focus, [/公共服务诉求/]);
  const unsupportedPopulation = /(失能老人|高龄独居老人|户籍老年人口)/.test(populationDefinition);

  if (serviceUse) {
    return {
      resourceIds: resources.r07 ? ['r07'] : [],
      items: resources.r07 ? [{ resourceId: 'r07', role: 'PARTIAL_MATCH', inclusionState: 'NOT_INCLUDED', coverage: ['仅居家养老服务订单'], limitations: ['不代表完整养老服务使用'], evidenceRefs: ['部分匹配'] }] : [],
      gaps: [openGap('gap_homecare_partial', '实际服务使用覆盖缺口', '当前资源仅覆盖居家上门服务订单，不代表完整养老服务使用。')],
      relationshipEvidence: [], coverageSummary: [], limitationSummary: ['仅部分覆盖实际服务使用。'], readiness: 'PARTIAL'
    };
  }
  if (publicService) {
    return { resourceIds: [], items: [], gaps: [openGap('gap_public_service', '老年人公共服务诉求资源缺口', '当前检索范围内尚未配置可用于该目标的正式资源。')], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], readiness: 'GAP_ONLY' };
  }
  if (unsupportedPopulation) {
    return { resourceIds: [], items: [], gaps: [openGap('gap_population_definition', '老年人口统计口径未覆盖', '当前已登记资源尚未覆盖新的老年人口统计口径。')], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], readiness: 'GAP_ONLY' };
  }

  const bedResourceId = /核定/.test(bedDefinition) && !/(在营|可用)/.test(bedDefinition) ? 'r05' : 'r04';
  if (!resources.r01 || !resources[bedResourceId]) {
    return { resourceIds: [], items: [], gaps: [openGap('gap_core_resource', '核心资源未登记', '当前方案尚未同时覆盖老年人口规模和养老床位口径。')], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], readiness: 'GAP_ONLY' };
  }
  return {
    resourceIds: ['r01', bedResourceId], items: [coreItem('r01'), coreItem(bedResourceId)], gaps: [],
    relationshipEvidence: [{
      sourceResourceId: bedResourceId, targetResourceId: 'r01', relationType: 'ANALYTICAL_COMPATIBILITY', verificationStatus: 'SEMANTIC_ONLY', evidenceLevel: 'MEDIUM',
      description: '两项指标均围绕街镇与月份组织分析，具体维度与时间对齐将在分析阶段验证。', joinKeys: ['street_town', 'month'], evidenceRefs: ['已登记资源粒度与指标口径']
    }],
    coverageSummary: [`核心资源：${resources.r01.name}、${resources[bedResourceId].name}`, '核心维度：街镇、统计月份'],
    limitationSummary: ['技术连接未被长期确认，将在本次分析执行前验证维度、粒度与时间对齐。'], readiness: 'COMPLETE'
  };
}
