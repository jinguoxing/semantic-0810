import {
  AskPlan,
  DataSolutionItem,
  FindDataResource,
  FindDataTaskState,
  PermissionDecision
} from '../../model/FindDataTask';

const allowedPermissions = {
  discover: 'ALLOWED' as const,
  viewMetadata: 'ALLOWED' as const,
  preview: 'ALLOWED' as const,
  query: 'ALLOWED' as const,
  export: 'ALLOWED' as const
};

const fixedNow = '2026-09-04T00:00:00.000Z';

export function createResource(
  overrides: Partial<FindDataResource> & Pick<FindDataResource, 'id'>
): FindDataResource {
  return {
    name: `资源 ${overrides.id}`,
    type: '数据资产',
    granularity: '记录级',
    timeCoverage: '时间未登记',
    desc: '测试资源',
    availabilityByAction: allowedPermissions,
    ...overrides
  };
}

export function createSolutionItem(
  overrides: Partial<DataSolutionItem> & Pick<DataSolutionItem, 'resourceId'>
): DataSolutionItem {
  return {
    role: 'CORE',
    inclusionState: 'SELECTED',
    coverage: [],
    limitations: [],
    evidenceRefs: [],
    ...overrides
  };
}

export function createAskPlan(overrides: Partial<AskPlan> = {}): AskPlan {
  return {
    id: 'plan_test',
    title: '测试分析计划',
    status: 'READY_TO_RUN',
    coreResourceIds: ['r01', 'r04'],
    conditionalResourceIds: [],
    permissionCheckState: 'NOT_CHECKED',
    permissionBaseline: { r01: 'ALLOWED', r04: 'ALLOWED' },
    requirementRevision: 1,
    basedOnSearchRevision: 1,
    calculationSpec: {
      metricName: '测试指标',
      isOfficialMetric: false,
      formula: 'a / b',
      formulaExplanation: '测试公式',
      numerator: 'a',
      denominator: 'b',
      multiplier: 1,
      benchmarkRule: 'WEIGHTED_DISTRICT_AVERAGE',
      strictConclusionBoundary: '仅用于测试'
    },
    ...overrides
  };
}

export function createEmptyTask(overrides: Partial<FindDataTaskState> = {}): FindDataTaskState {
  return {
    taskId: 'task_test',
    title: '新建找数据任务',
    status: 'IDLE',
    scenarioKey: undefined,
    goal: '',
    requirementHypothesis: { dimensions: [], analysisFocus: [], assumptions: [], unresolvedQuestions: [] },
    searchScope: { domains: [], includeCrossDepartment: true },
    turns: [],
    resources: {},
    dataSolution: {
      state: 'EMPTY',
      basedOnRequirementRevision: 0,
      basedOnSearchRevision: 0,
      items: [], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: fixedNow
    },
    searchResult: { query: '', totalMatches: 0, candidateIds: [], candidateSnapshot: [], returnedCount: 0 },
    permissionRequests: {},
    activeResourceId: undefined,
    activeSurface: { type: 'CLOSED', mode: 'QUICK_PREVIEW' },
    requirementRevision: 0,
    searchRevision: 0,
    runtimeStatus: { active: false, message: '' },
    askPlan: undefined,
    createdAt: fixedNow,
    updatedAt: fixedNow,
    ...overrides
  };
}

export function createMinhangTask(overrides: Partial<FindDataTaskState> = {}): FindDataTaskState {
  const resources = {
    r01: createResource({ id: 'r01', name: '60 岁以上常住人口数', type: '正式指标', availabilityPeriod: { start: '2023-01', end: '2026-08' }, analysisDimensions: ['street_town', 'month'], timeGrain: 'MONTH' }),
    r04: createResource({ id: 'r04', name: '在营可用养老床位数', type: '正式指标', availabilityPeriod: { start: '2024-01', end: '2026-08' }, analysisDimensions: ['street_town', 'month'], timeGrain: 'MONTH' })
  };
  return createEmptyTask({
    status: 'READY',
    scenarioKey: 'minhang_bed_supply',
    requirementRevision: 1,
    searchRevision: 1,
    requirementHypothesis: {
      region: '上海市闵行区',
      timeRange: { start: '2025.09', end: '2026.08' },
      populationDefinition: '60 岁及以上常住人口',
      bedDefinition: '在营可用养老床位',
      dimensions: ['街镇', '月份'],
      analysisFocus: ['老年人口规模与分布', '养老床位供给'],
      assumptions: [], unresolvedQuestions: []
    },
    resources,
    dataSolution: {
      state: 'READY',
      basedOnRequirementRevision: 1,
      basedOnSearchRevision: 1,
      items: [createSolutionItem({ resourceId: 'r01' }), createSolutionItem({ resourceId: 'r04' })],
      gaps: [], relationshipEvidence: [{ sourceResourceId: 'r04', targetResourceId: 'r01', relationType: 'ANALYTICAL_COMPATIBILITY', verificationStatus: 'SEMANTIC_ONLY', evidenceLevel: 'MEDIUM', description: '测试语义关联', joinKeys: ['street_town', 'month'], evidenceRefs: ['test'] }], coverageSummary: [], limitationSummary: [], updatedAt: fixedNow
    },
    searchResult: {
      query: '闵行养老床位供给', totalMatches: 2, candidateIds: ['r01', 'r04'], returnedCount: 2,
      candidateSnapshot: [
        { resourceId: 'r01', title: '60 岁以上常住人口数', reason: '核心指标', matchType: 'DIRECT', proposedRole: 'CORE', sourceSearchRevision: 1 },
        { resourceId: 'r04', title: '在营可用养老床位数', reason: '核心指标', matchType: 'DIRECT', proposedRole: 'CORE', sourceSearchRevision: 1 }
      ]
    },
    ...overrides
  });
}

export function permissionsWithQuery(query: PermissionDecision) {
  return { ...allowedPermissions, query };
}
