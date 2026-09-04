import { ResourceId } from '../model/FindDataTask';

export interface MinhangBedDefinitionVariant {
  key: 'AVAILABLE' | 'APPROVED';
  resourceId: ResourceId;
  hypothesisValue: string;
  metricName: string;
  formula: string;
  formulaExplanation: string;
  numerator: string;
  strictConclusionBoundary: string;
  switchLabel: string;
  resultDefinitionLabel: string;
}

export const MINHANG_BED_DEFINITION_VARIANTS: Record<MinhangBedDefinitionVariant['key'], MinhangBedDefinitionVariant> = {
  AVAILABLE: {
    key: 'AVAILABLE',
    resourceId: 'r04',
    hypothesisValue: '民政核定且在营可用养老床位数',
    metricName: '每千名 60 岁以上常住人口在营可用养老床位数',
    formula: '( 在营可用养老床位数 ÷ 60 岁以上常住人口数 ) × 1000',
    formulaExplanation: '分子为各街镇在营可用养老床位总数；分母为各街镇 60 岁及以上常住人口总数；乘以 1000 换算为千人床位数。',
    numerator: '在营可用养老床位数（正式指标）',
    strictConclusionBoundary: '分析结论仅表达“床位供给水平相对全区加权平均偏低，建议进一步核查”；严禁直接表达为“供需不足”或“缺少养老资源”，亦不能替代全面养老服务需求调查。',
    switchLabel: '切换为在营可用口径',
    resultDefinitionLabel: '在营可用床位口径'
  },
  APPROVED: {
    key: 'APPROVED',
    resourceId: 'r05',
    hypothesisValue: '养老床位核定数',
    metricName: '每千名 60 岁以上常住人口核定养老床位数',
    formula: '( 养老床位核定数 ÷ 60 岁以上常住人口数 ) × 1000',
    formulaExplanation: '分子为审批核定或设计床位总数；分母为 60 岁及以上常住人口总数；该结果反映核定容量，不代表实际在营可用容量。',
    numerator: '养老床位核定数（正式指标）',
    strictConclusionBoundary: '核定床位数反映审批或设计容量，包含可能尚未投用、停用或不具备即时接收能力的床位；分析结果不得直接表述为实际可用养老资源供给水平。',
    switchLabel: '切换为核定床位口径',
    resultDefinitionLabel: '核定床位口径'
  }
};

export function getMinhangBedDefinitionForHypothesis(bedDefinition?: string): MinhangBedDefinitionVariant {
  return /核定/.test(bedDefinition ?? '') && !/(在营|可用)/.test(bedDefinition ?? '')
    ? MINHANG_BED_DEFINITION_VARIANTS.APPROVED
    : MINHANG_BED_DEFINITION_VARIANTS.AVAILABLE;
}

export function getMinhangBedDefinitionForResource(resourceId?: ResourceId): MinhangBedDefinitionVariant | undefined {
  return Object.values(MINHANG_BED_DEFINITION_VARIANTS).find((variant) => variant.resourceId === resourceId);
}

export function getMinhangBedDefinitionForCoreResources(resourceIds: ResourceId[]): MinhangBedDefinitionVariant {
  return resourceIds.includes(MINHANG_BED_DEFINITION_VARIANTS.APPROVED.resourceId)
    ? MINHANG_BED_DEFINITION_VARIANTS.APPROVED
    : MINHANG_BED_DEFINITION_VARIANTS.AVAILABLE;
}

export function getMinhangBedDefinitionForNumerator(numerator: string): MinhangBedDefinitionVariant {
  return /核定/.test(numerator)
    ? MINHANG_BED_DEFINITION_VARIANTS.APPROVED
    : MINHANG_BED_DEFINITION_VARIANTS.AVAILABLE;
}
