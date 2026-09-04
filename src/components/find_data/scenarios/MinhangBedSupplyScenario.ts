import {
  AskPlan,
  AskPlanCalculationSpec,
  ConversationBlock,
  DataSolutionItem,
  FindDataResource,
  FindDataTaskState,
  RequirementHypothesis,
  ResourceId,
  SolutionGap,
  TaskAction
} from '../model/FindDataTask';
import { FindDataEvent } from '../model/findDataEvents';
import {
  MINHANG_ASK_PLAN,
  MINHANG_COMPARISON_MODEL,
  MINHANG_DATA_SOLUTION,
  MINHANG_RESOURCES
} from '../fixtures/minhangBedSupplyFixture';
import {
  buildFieldSummary,
  buildGapSummary,
  buildRecommendationExplanation
} from '../presenters/conversationPresenters';
import { InteractionIntent } from '../policy/surfacePolicy';
import { FindDataEngineResult } from '../services/FindDataService';
import { FindDataScenario, createScenarioId, emptyScenarioResult } from './FindDataScenario';
import { composeMinhangSolution } from './minhangSolutionComposer';
import { deriveMinhangInitialHypothesis, minhangBedDefinitionQuestion } from './deriveMinhangInitialHypothesis';
import { getMinhangBedDefinitionForCoreResources } from './minhangBedDefinition';
import { selectAskHandoffReadiness } from '../model/findDataSelectors';
import { resourceCoversRange, validateMonthRange } from '../model/timeRangeUtils';

const focusQuestion = {
  id: 'q_minhang_focus',
  question: '你这次主要想先看养老资源供给，还是实际服务使用？',
  type: 'SINGLE' as const,
  options: [
    { id: 'opt_pop_bed', label: '人口规模与养老床位供给', recommended: true },
    { id: 'opt_service', label: '养老服务实际使用' },
    { id: 'opt_public_service', label: '老年人公共服务诉求' }
  ],
  resolution: { status: 'OPEN' as const, selectedOptionIds: [] }
};

const benchmarkQuestionTemplate = {
  id: 'q_minhang_benchmark',
  question: '请确认本次分析使用的比较基准：',
  type: 'SINGLE' as const,
  options: [
    { id: 'benchmark_rank', label: '只展示街镇排名' },
    { id: 'benchmark_weighted', label: '与全区加权平均比较', recommended: true },
    { id: 'benchmark_policy', label: '使用正式政策目标' }
  ],
  resolution: { status: 'OPEN' as const, selectedOptionIds: [] }
};

const benchmarkQuestionIdPrefix = 'q_minhang_benchmark';

function isBenchmarkQuestionId(questionId: string): boolean {
  return questionId === benchmarkQuestionIdPrefix || questionId.startsWith(`${benchmarkQuestionIdPrefix}_`);
}

function createBenchmarkQuestion(task: FindDataTaskState) {
  const previousBenchmarkCount = task.turns
    .flatMap((turn) => turn.blocks)
    .filter((block) => block.type === 'CLARIFICATION' && isBenchmarkQuestionId(block.question.id))
    .length;
  const id = previousBenchmarkCount === 0
    ? benchmarkQuestionIdPrefix
    : `${benchmarkQuestionIdPrefix}_${task.requirementRevision}_${previousBenchmarkCount}`;
  return {
    ...benchmarkQuestionTemplate,
    id,
    options: benchmarkQuestionTemplate.options.map((option) => ({ ...option })),
    resolution: { status: 'OPEN' as const, selectedOptionIds: [] }
  };
}

function findOpenBenchmarkQuestion(task: FindDataTaskState) {
  return task.turns
    .flatMap((turn) => turn.blocks)
    .find((block) => block.type === 'CLARIFICATION' &&
      isBenchmarkQuestionId(block.question.id) && block.question.resolution?.status === 'OPEN');
}

type ServiceUseChangeMode = 'EXTEND' | 'REPLACE';

function hasCompleteMinhangCore(task: FindDataTaskState): boolean {
  const coreIds = task.dataSolution.items
    .filter((item) => item.role === 'CORE' && item.inclusionState !== 'NOT_INCLUDED')
    .map((item) => item.resourceId);
  return coreIds.includes('r01') && (coreIds.includes('r04') || coreIds.includes('r05'));
}

function resolveServiceUseChangeMode(text: string, task: FindDataTaskState): ServiceUseChangeMode {
  if (/(改为只看(?:养老)?服务实际使用|改为只看实际服务使用|只分析(?:养老)?服务实际使用|只分析实际服务使用|不看床位[，,、 ]*只看服务使用|仅关注养老服务实际使用)/.test(text)) {
    return 'REPLACE';
  }
  if (/(再加入实际服务使用|再加入养老服务实际使用|还要看实际服务使用|同时看看服务使用|补充养老服务使用|另外看看实际服务使用|也想看服务使用)/.test(text)) {
    return 'EXTEND';
  }
  return hasCompleteMinhangCore(task) ? 'EXTEND' : 'REPLACE';
}

function isServiceUseQuestion(text: string): boolean {
  return /(实际服务使用字段有哪些|为什么实际服务使用只有部分匹配|查看实际服务使用缺口)/.test(text);
}

const broadHypothesis: RequirementHypothesis = {
  region: '上海市闵行区',
  dimensions: [],
  analysisFocus: [],
  assumptions: [],
  unresolvedQuestions: [focusQuestion]
};

function isSufficientInitialGoal(text: string): boolean {
  return /(街镇|街道|镇)/.test(text) &&
    /(60\s*岁以上|60\s*岁及以上|老年人口)/.test(text) &&
    /(养老床位|养老资源|养老供给)/.test(text);
}

function textBlock(content: string): ConversationBlock {
  return { type: 'TEXT', id: createScenarioId('text'), content };
}

function assistantEvent(blocks: ConversationBlock[], nextStatus: FindDataTaskState['status']): FindDataEvent {
  return {
    type: 'ASSISTANT_TURN_RECEIVED',
    payload: { turnId: createScenarioId('assistant'), blocks, nextStatus }
  };
}

function searchEvents(
  task: FindDataTaskState,
  options: {
    requirementRevision: number;
    resourceIds: ResourceId[];
    items: DataSolutionItem[];
    gaps?: SolutionGap[];
    mode?: 'REPLACE' | 'MERGE';
    query?: string;
    coverageSummary?: string[];
    relationshipEvidence?: FindDataTaskState['dataSolution']['relationshipEvidence'];
    limitationSummary?: string[];
    relatedCandidateIds?: ResourceId[];
  }
): FindDataEvent[] {
  const searchRevision = task.searchRevision + 1;
  const mode = options.mode ?? 'REPLACE';
  const previousIds = task.searchResult?.candidateIds ?? [];
  const allCandidateIds = mode === 'MERGE'
    ? Array.from(new Set([...previousIds, ...options.resourceIds]))
    : options.resourceIds;
  const removedIds = mode === 'REPLACE' ? previousIds.filter((id) => !allCandidateIds.includes(id)) : [];
  const priorCandidates = mode === 'MERGE'
    ? (task.searchResult?.candidateSnapshot ?? []).filter((candidate) => allCandidateIds.includes(candidate.resourceId))
    : [];
  const candidateFor = (resourceId: ResourceId) => {
    const resource = MINHANG_RESOURCES[resourceId];
    const isCore = (resourceId === 'r01' || resourceId === 'r04' || resourceId === 'r05') && !options.relatedCandidateIds?.includes(resourceId);
    return {
      resourceId,
      title: resource?.name ?? '相关资源',
      reason: isCore ? '直接满足当前供给分析的核心指标需要。' : resourceId === 'r07' ? '仅覆盖居家养老服务订单，属于部分匹配。' : '与当前目标相关，可进一步评估。',
      matchType: isCore ? 'DIRECT' as const : resourceId === 'r07' ? 'PARTIAL' as const : 'RELATED' as const,
      proposedRole: isCore ? 'CORE' as const : resourceId === 'r07' ? 'PARTIAL_MATCH' as const : 'OPTIONAL_DRILLDOWN' as const,
      sourceSearchRevision: searchRevision
    };
  };
  const candidates = new Map(priorCandidates.map((candidate) => [candidate.resourceId, candidate]));
  for (const resourceId of options.resourceIds) candidates.set(resourceId, candidateFor(resourceId));
  return [
    {
      type: 'SEARCH_STARTED',
      payload: {
        searchRevision,
        scope: { domains: ['人口与统计', '民政与社会保障'] },
        statusMessage: '正在检索匹配的数据资产与指标…'
      }
    },
    {
      type: 'SEARCH_RESULTS_RECEIVED',
      payload: {
        taskId: task.taskId,
        requirementRevision: options.requirementRevision,
        searchRevision,
        query: options.query,
        totalMatches: allCandidateIds.length,
        candidateSnapshot: allCandidateIds.flatMap((resourceId) => {
          const candidate = candidates.get(resourceId);
          return candidate ? [candidate] : [];
        }),
        resourceUpserts: options.resourceIds.map((id) => MINHANG_RESOURCES[id]).filter((resource): resource is FindDataResource => !!resource),
        candidateDelta: {
          retainedIds: previousIds.filter((id) => allCandidateIds.includes(id)),
          addedIds: options.resourceIds.filter((id) => !previousIds.includes(id)),
          removedIds,
          allCandidateIds
        },
        solutionPatch: {
          mode,
          upsertItems: options.items,
          removeResourceIds: removedIds,
          gaps: options.gaps ?? (mode === 'REPLACE' ? [] : task.dataSolution.gaps),
          ...(options.relationshipEvidence
            ? {
                relationshipEvidence: options.relationshipEvidence,
                coverageSummary: options.coverageSummary ?? MINHANG_DATA_SOLUTION.coverageSummary,
                limitationSummary: options.limitationSummary ?? MINHANG_DATA_SOLUTION.limitationSummary
              }
            : mode === 'REPLACE'
            ? { relationshipEvidence: [], coverageSummary: [], limitationSummary: [] }
            : {})
        }
      }
    }
  ];
}

function findClarification(task: FindDataTaskState, questionId: string) {
  return task.turns.flatMap((turn) => turn.blocks).find(
    (block) => block.type === 'CLARIFICATION' && block.question.id === questionId
  );
}

function selectedLabels(
  clarification: Extract<ConversationBlock, { type: 'CLARIFICATION' }>,
  ids: string[]
): string[] {
  return ids
    .map((id) => clarification.question.options.find((option) => option.id === id)?.label)
    .filter((label): label is string => !!label);
}

const benchmarkRules: Record<string, {
  rule: AskPlanCalculationSpec['benchmarkRule'];
  value?: string;
  reference?: string;
}> = {
  benchmark_rank: {
    rule: 'RANK_ONLY'
  },
  benchmark_weighted: {
    rule: 'WEIGHTED_DISTRICT_AVERAGE'
  },
  benchmark_policy: {
    rule: 'POLICY_TARGET',
    value: '30 张 / 千人',
    reference: '离线演示政策目标（Mock Fixture，并非正式政策依据）'
  }
};

export function buildMinhangCalculationSpec(
  coreResourceIds: ResourceId[],
  benchmarkOptionId?: string,
  priorPlan?: AskPlan
): AskPlanCalculationSpec {
  const bedDefinition = getMinhangBedDefinitionForCoreResources(coreResourceIds);
  const benchmark = benchmarkOptionId
    ? benchmarkRules[benchmarkOptionId]
    : undefined;
  const metric = bedDefinition;
  return {
    ...MINHANG_ASK_PLAN.calculationSpec,
    metricName: metric.metricName,
    formula: metric.formula,
    formulaExplanation: metric.formulaExplanation,
    numerator: metric.numerator,
    denominator: '60 岁以上常住人口数（正式指标）',
    benchmarkRule: benchmark?.rule ?? priorPlan?.calculationSpec.benchmarkRule ?? MINHANG_ASK_PLAN.calculationSpec.benchmarkRule,
    benchmarkValue: benchmark?.value ?? priorPlan?.calculationSpec.benchmarkValue,
    benchmarkReference: benchmark?.reference ?? priorPlan?.calculationSpec.benchmarkReference,
    strictConclusionBoundary: metric.strictConclusionBoundary
  };
}

function buildAskPlan(task: FindDataTaskState, benchmarkOptionId?: string): AskPlan {
  const coreItems = task.dataSolution.items.filter((item) => item.role === 'CORE' && item.inclusionState !== 'NOT_INCLUDED');
  const coreResourceIds = coreItems.map((item) => item.resourceId);
  return {
    ...MINHANG_ASK_PLAN,
    calculationSpec: buildMinhangCalculationSpec(coreResourceIds, benchmarkOptionId, task.askPlan),
    permissionCheckState: 'NOT_CHECKED',
    coreResourceIds,
    conditionalResourceIds: task.dataSolution.items
      .filter((item) => item.role !== 'CORE' && item.role !== 'PARTIAL_MATCH' && item.inclusionState !== 'NOT_INCLUDED')
      .map((item) => item.resourceId),
    permissionBaseline: Object.fromEntries(
      coreResourceIds.map((resourceId) => [resourceId, task.resources[resourceId]?.availabilityByAction.query ?? 'UNKNOWN'])
    ),
    requirementRevision: task.dataSolution.basedOnRequirementRevision,
    basedOnSearchRevision: task.dataSolution.basedOnSearchRevision,
    timeRange: task.requirementHypothesis.timeRange,
    alignmentRequirement: {
      requiredDimensions: ['street_town', 'month'], requiredTimeGrain: 'MONTH',
      requiredRelationshipResourcePairs: task.dataSolution.items.filter((item) => item.role === 'CORE' && item.resourceId !== 'r01').map((item) => ({ sourceResourceId: item.resourceId, targetResourceId: 'r01' }))
    }
  };
}

function buildInitialCompositionResult(task: FindDataTaskState, hypothesis: RequirementHypothesis): FindDataEngineResult {
  const requirementRevision = task.requirementRevision + 1;
  const composition = composeMinhangSolution(hypothesis, MINHANG_RESOURCES);
  const blocks: ConversationBlock[] = [
    textBlock('已按当前已登记的指标定义完成初次检索，形成最小数据方案。'),
    {
      type: 'RESULT_BRIEF', id: createScenarioId('result'), briefKind: 'SOLUTION_SUMMARY',
      title: `已形成 ${composition.items.length} 项核心资源的最小数据方案`,
      candidates: composition.items.map((item) => {
        const resource = MINHANG_RESOURCES[item.resourceId];
        return { resourceId: resource.id, title: resource.name, typeBadge: resource.type, statusBadge: '可用于问数', description: resource.desc, granularity: resource.granularity };
      }),
      primaryAction: { label: '查看当前方案', actionCode: 'OPEN_SOLUTION' }
    }
  ];
  return {
    ...emptyScenarioResult(task.taskId),
    events: [
      { type: 'REQUIREMENT_UPDATED', payload: { hypothesis, bumpRevision: true } },
      ...buildCompositionSearchEvents(task, hypothesis, requirementRevision, task.goal),
      assistantEvent(blocks, 'READY')
    ],
    assistantBlocks: blocks
  };
}

const serviceUseGap: SolutionGap = {
  id: 'gap_homecare_partial',
  title: '实际服务使用覆盖缺口',
  description: '当前资源仅覆盖居家上门服务订单，不代表完整养老服务使用。',
  impactLevel: 'HIGH',
  mitigation: '保持部分匹配标识，待补充机构养老和其他服务数据。',
  status: 'OPEN'
};

function buildServiceUseResult(
  task: FindDataTaskState,
  requirementRevision: number,
  prerequisiteEvents: FindDataEvent[],
  mode: 'REPLACE' | 'MERGE',
  query: string | undefined,
  message: string
): FindDataEngineResult {
  const item = MINHANG_DATA_SOLUTION.items.find((entry) => entry.resourceId === 'r07')!;
  const gaps = mode === 'MERGE'
    ? [...task.dataSolution.gaps.filter((gap) => gap.id !== serviceUseGap.id), serviceUseGap]
    : [serviceUseGap];
  const blocks: ConversationBlock[] = [
    textBlock(message)
  ];
  return {
    ...emptyScenarioResult(task.taskId),
    events: [
      ...prerequisiteEvents,
      ...searchEvents(task, { requirementRevision, resourceIds: ['r07'], items: [item], gaps, mode, query }),
      assistantEvent(blocks, 'READY')
    ],
    assistantBlocks: blocks
  };
}

function buildServiceUseGoalResult(
  task: FindDataTaskState,
  text: string,
  changeMode: ServiceUseChangeMode
): FindDataEngineResult {
  const requirementRevision = task.requirementRevision + 1;
  const extend = changeMode === 'EXTEND';
  const analysisFocus = extend
    ? Array.from(new Set([...task.requirementHypothesis.analysisFocus, '养老服务实际使用']))
    : ['养老服务实际使用'];
  const prerequisiteEvents: FindDataEvent[] = [
    { type: 'REQUIREMENT_UPDATED', payload: { hypothesis: { analysisFocus }, bumpRevision: true } },
    { type: 'ASK_PLAN_INVALIDATED', payload: { reason: '需求或口径已修改，原分析计划不再有效。' } },
    { type: 'COMPARISON_MODEL_CLEARED' },
    { type: 'SOLUTION_EVALUATION_STARTED', payload: { requirementRevision } }
  ];
  return buildServiceUseResult(
    task,
    requirementRevision,
    prerequisiteEvents,
    extend ? 'MERGE' : 'REPLACE',
    text,
    extend
      ? '已将养老服务实际使用补充到当前目标。现有老年人口与养老床位核心方案保持不变；目前仅发现居家养老服务订单，已记录为部分匹配，完整服务使用仍是当前方案缺口。'
      : '已将当前目标切换为养老服务实际使用。当前只发现居家养老服务订单，尚不能代表完整养老服务使用。'
  );
}

function settledTaskStatus(task: FindDataTaskState): FindDataTaskState['status'] {
  if (task.askPlan) return 'WAITING_USER';
  if (task.dataSolution.items.length > 0) return 'READY';
  return 'WAITING_USER';
}

function buildCompositionSearchEvents(task: FindDataTaskState, hypothesis: RequirementHypothesis, requirementRevision: number, query?: string): FindDataEvent[] {
  const composition = composeMinhangSolution(hypothesis, MINHANG_RESOURCES);
  const rangeValidation = validateMonthRange(hypothesis.timeRange);
  const coreResources = composition.items
    .filter((item) => item.role === 'CORE')
    .map((item) => MINHANG_RESOURCES[item.resourceId])
    .filter((resource): resource is FindDataResource => !!resource);
  const uncovered = hypothesis.timeRange ? coreResources.filter((resource) => !resourceCoversRange(resource, hypothesis.timeRange)) : [];
  const timeGap: SolutionGap | undefined = !rangeValidation.valid
    ? { id: 'gap_time_range', title: '时间范围无效', description: rangeValidation.reason!, impactLevel: 'HIGH', mitigation: '修正时间范围后重新评估。', status: 'OPEN' }
    : uncovered.length > 0
    ? { id: 'gap_time_coverage', title: '时间覆盖不足', description: `${uncovered.map((resource) => `${resource.name}仅覆盖到 ${resource.availabilityPeriod?.end}`).join('、')}，不能满足当前截止时间。`, impactLevel: 'HIGH', mitigation: '缩小时间范围或接入覆盖该期间的正式指标。', status: 'OPEN' }
    : undefined;
  const effective = timeGap
    ? { ...composition, resourceIds: [], items: [], relationshipEvidence: [], gaps: [...composition.gaps, timeGap], readiness: 'GAP_ONLY' as const }
    : composition;
  return searchEvents(task, {
    requirementRevision, resourceIds: effective.resourceIds, items: effective.items, gaps: effective.gaps, mode: 'REPLACE', query,
    relationshipEvidence: effective.relationshipEvidence, coverageSummary: effective.coverageSummary, limitationSummary: effective.limitationSummary
  });
}

function buildRequirementReevaluationResult(
  task: FindDataTaskState,
  patch: Partial<RequirementHypothesis>
): FindDataEngineResult {
  const requirementRevision = task.requirementRevision + 1;
  const nextHypothesis = { ...task.requirementHypothesis, ...patch };
  const prerequisite: FindDataEvent[] = [
    { type: 'REQUIREMENT_UPDATED', payload: { hypothesis: patch, bumpRevision: true } },
    { type: 'ASK_PLAN_INVALIDATED', payload: { reason: '需求或口径已修改，原分析计划不再有效。' } },
    { type: 'COMPARISON_MODEL_CLEARED' },
    { type: 'SOLUTION_EVALUATION_STARTED', payload: { requirementRevision } }
  ];

  if (nextHypothesis.region && !/闵行/.test(nextHypothesis.region)) {
    const gap: SolutionGap = {
      id: 'gap_region_not_configured',
      title: '区域资源检索场景尚未配置',
      description: '当前演示服务尚未配置该区域的数据资源检索场景。',
      impactLevel: 'HIGH',
      mitigation: '接入该区域的正式资源目录与检索场景后重新评估。',
      status: 'OPEN'
    };
    const blocks = [textBlock('已按新的区域重新评估；当前演示服务尚未配置该区域的数据资源检索场景。')];
    return {
      ...emptyScenarioResult(task.taskId),
      events: [
        ...prerequisite,
        { type: 'SCENARIO_RECLASSIFIED', payload: { fromScenarioKey: 'minhang_bed_supply', toScenarioKey: 'generic', reason: '区域已变更为非闵行区。' } },
        ...searchEvents(task, { requirementRevision, resourceIds: [], items: [], gaps: [gap], mode: 'REPLACE', query: '需求修改后重新检索' }),
        assistantEvent(blocks, 'READY')
      ],
      assistantBlocks: blocks
    };
  }

  const blocks = [textBlock('正在按新口径重新评估；已更新候选资源、覆盖范围和关系证据。')];
  return {
    ...emptyScenarioResult(task.taskId),
    events: [
      ...prerequisite,
      ...buildCompositionSearchEvents(task, nextHypothesis, requirementRevision, '需求修改后重新检索'),
      assistantEvent(blocks, 'READY')
    ],
    assistantBlocks: blocks
  };
}

export function isMinhangBedSupplyInitialGoal(text: string): boolean {
  const hasRegion = /闵行/.test(text);
  const hasPopulation = /(老人|老年人口|60\s*岁以上|60\s*岁及以上|老龄)/.test(text);
  const hasTopic = /(养老床位|养老资源|养老供给|养老服务|老人养老)/.test(text);
  return hasRegion && hasPopulation && hasTopic;
}

export class MinhangBedSupplyScenario implements FindDataScenario {
  key = 'minhang_bed_supply';

  matchesInitialTurn(text: string): boolean {
    return isMinhangBedSupplyInitialGoal(text);
  }

  async handleTurn(task: FindDataTaskState, text: string, intent: InteractionIntent): Promise<FindDataEngineResult> {
    const result = emptyScenarioResult(task.taskId);

    if (task.scenarioKey) {
      if (text.includes('字段')) {
        const blocks = [textBlock(buildFieldSummary(task))];
        return { ...result, events: [assistantEvent(blocks, settledTaskStatus(task))], assistantBlocks: blocks };
      }
      if (text.includes('为什么推荐') || text.includes('适合')) {
        const blocks = [textBlock(buildRecommendationExplanation(task, task.activeResourceId))];
        return { ...result, events: [assistantEvent(blocks, settledTaskStatus(task))], assistantBlocks: blocks };
      }
      if (text.includes('缺什么') || text.includes('局限') || text.includes('不足')) {
        const blocks = [textBlock(buildGapSummary(task))];
        return { ...result, events: [assistantEvent(blocks, settledTaskStatus(task))], assistantBlocks: blocks };
      }
      if (isServiceUseQuestion(text)) {
        const message = text.includes('为什么')
          ? '当前仅找到居家养老服务订单，它只覆盖居家服务，不能代表机构养老和其他服务使用，因此记录为部分匹配并保留为方案缺口。'
          : buildGapSummary(task);
        const blocks = [textBlock(message)];
        return { ...result, events: [assistantEvent(blocks, settledTaskStatus(task))], assistantBlocks: blocks };
      }
      if (intent.matchedRule === 'compare-summary-question') {
        const blocks: ConversationBlock[] = [
          textBlock('这两项资源可以从粒度、时间形态和查询权限三个维度比较。'),
          { type: 'ACTION_GROUP', id: createScenarioId('actions'), actions: [{ id: createScenarioId('compare'), label: '比较 2 项资源', actionCode: 'OPEN_COMPARE', variant: 'weak' }] }
        ];
        return { ...result, events: [assistantEvent(blocks, settledTaskStatus(task))], assistantBlocks: blocks };
      }
      if (intent.kind === 'ANALYZE' && !task.askPlan) {
        if (findOpenBenchmarkQuestion(task)) {
          const blocks = [textBlock('当前比较基准尚未确认，请先完成上方选择。')];
          return { ...result, events: [assistantEvent(blocks, 'WAITING_USER')], assistantBlocks: blocks };
        }
        const readiness = selectAskHandoffReadiness(task);
        if (!readiness.ready) {
          const blocks: ConversationBlock[] = [
            textBlock(readiness.message),
            { type: 'ACTION_GROUP', id: createScenarioId('actions'), actions: [{ id: createScenarioId('solution'), label: '查看当前方案', actionCode: 'OPEN_SOLUTION', variant: 'weak' }] }
          ];
          return { ...result, events: [assistantEvent(blocks, settledTaskStatus(task))], assistantBlocks: blocks };
        }
        const blocks: ConversationBlock[] = [{ type: 'CLARIFICATION', id: createScenarioId('clarification'), question: createBenchmarkQuestion(task) }];
        return {
          ...result,
          events: [assistantEvent(blocks, 'WAITING_USER')],
          assistantBlocks: blocks
        };
      }
      if (/(实际服务使用|养老服务实际使用|服务实际使用|养老服务使用|服务使用)/.test(text)) {
        return buildServiceUseGoalResult(task, text, resolveServiceUseChangeMode(text, task));
      }
      if (intent.kind === 'RESOURCE_BROWSE' || /(查看明细|解释机构|解释床位.*机构|查看养老机构|浏览相关资源|人口明细|民政相关资源|养老相关数据|查看养老相关数据|养老资源|浏览民政数据)/.test(text)) {
        const isInstitution = /(解释机构|解释床位.*机构|查看养老机构|养老机构|床位来源机构)/.test(text);
        const isCivilAffairs = /(民政相关资源|养老相关数据|查看养老相关数据|还有哪些养老资源|浏览民政数据)/.test(text);
        const ids = isInstitution ? ['r06'] : isCivilAffairs ? ['r05', 'r06', 'r07'] : ['r02', 'r03'];
        const blocks: ConversationBlock[] = [
          textBlock(isCivilAffairs
            ? '当前发现 3 项民政相关候选资源，分别用于床位口径替代、机构下钻和服务使用补充，尚未自动纳入当前方案。'
            : isInstitution
            ? '当前找到「养老机构基本信息」，可用于解释各街镇床位主要由哪些机构提供。它属于结果下钻资源，不参与每千名老人床位数的核心计算。'
            : `当前发现 ${ids.length} 项可选明细资源。基于过去 12 个月的目标，月度快照更适合。`),
          { type: 'ACTION_GROUP', id: createScenarioId('actions'), actions: isCivilAffairs
            ? []
            : ids.length >= 2
            ? [{ id: createScenarioId('compare'), label: '比较 2 项资源', actionCode: 'OPEN_COMPARE', variant: 'weak' }, ...(ids.includes('r03') ? [{ id: createScenarioId('select'), label: '使用月度快照', actionCode: 'SELECT_RESOURCE' as const, payload: { resourceId: 'r03' }, variant: 'primary' as const }] : [])]
            : [{ id: createScenarioId('fields'), label: '查看机构元数据', actionCode: 'OPEN_FIELDS', payload: { resourceId: 'r06' }, variant: 'weak' }] }
        ];
        const comparisonEvents = isCivilAffairs
          ? [{ type: 'COMPARISON_MODEL_CLEARED' as const }]
          : ids.length >= 2
          ? [{ type: 'COMPARISON_MODEL_SET' as const, payload: { comparisonModel: { resourceIds: ids, recommendedResourceId: 'r03', rows: [] } } }]
          : [];
        return {
          ...result,
          events: [
            ...comparisonEvents,
            ...searchEvents(task, { requirementRevision: task.requirementRevision, resourceIds: ids, items: [], mode: 'MERGE', query: text, relatedCandidateIds: isCivilAffairs ? ['r05', 'r06', 'r07'] : undefined }),
            assistantEvent(blocks, 'READY')
          ],
          assistantBlocks: blocks
        };
      }
      const blocks = [textBlock('已在当前闵行养老供给任务中记录这个追问，不会重新初始化场景。')];
      return { ...result, events: [assistantEvent(blocks, settledTaskStatus(task))], assistantBlocks: blocks };
    }

    if (!isSufficientInitialGoal(text)) {
      const blocks: ConversationBlock[] = [{ type: 'CLARIFICATION', id: createScenarioId('clarification'), question: focusQuestion }];
      return {
        ...result,
        events: [
          { type: 'REQUIREMENT_UPDATED', payload: { hypothesis: broadHypothesis, bumpRevision: true } },
          assistantEvent(blocks, 'NEEDS_CLARIFICATION')
        ],
        assistantBlocks: blocks
      };
    }

    const initialResolution = deriveMinhangInitialHypothesis(text);
    if (initialResolution.status === 'NEEDS_CLARIFICATION') {
      const blocks: ConversationBlock[] = [{ type: 'CLARIFICATION', id: createScenarioId('clarification'), question: initialResolution.question }];
      return {
        ...result,
        events: [
          { type: 'REQUIREMENT_UPDATED', payload: { hypothesis: initialResolution.partialHypothesis, bumpRevision: true } },
          assistantEvent(blocks, 'NEEDS_CLARIFICATION')
        ],
        assistantBlocks: blocks
      };
    }
    return buildInitialCompositionResult(task, initialResolution.hypothesis);
  }

  async handleAction(task: FindDataTaskState, action: TaskAction): Promise<FindDataEngineResult> {
    const result = emptyScenarioResult(task.taskId);
    if (action.actionCode === 'REGENERATE_ASK_PLAN') {
      const readiness = selectAskHandoffReadiness(task);
      if (!readiness.ready) return { ...result, events: [assistantEvent([textBlock(readiness.message)], settledTaskStatus(task))], assistantBlocks: [textBlock(readiness.message)] };
      const askPlan = buildAskPlan(task);
      const blocks: ConversationBlock[] = [textBlock('已按当前需求与权限基线重新生成分析计划。')];
      return {
        ...result,
        events: [{ type: 'ASK_PLAN_PREPARED', payload: { askPlan } }, assistantEvent(blocks, 'WAITING_USER')],
        assistantBlocks: blocks
      };
    }
    if (action.actionCode === 'REVISE_REQUIREMENT') {
      const patch = (action.payload?.hypothesisPatch ?? {}) as Partial<RequirementHypothesis>;
      return buildRequirementReevaluationResult(task, patch);
    }
    if (action.actionCode !== 'SUBMIT_CLARIFICATION') return result;
    const questionId = action.payload?.questionId as string;
    const selectedOptionIds = (action.payload?.selectedOptionIds as string[]) ?? [];
    const existing = findClarification(task, questionId);
    if (existing?.type === 'CLARIFICATION' && existing.question.resolution?.status === 'RESOLVED') {
      const blocks: ConversationBlock[] = [textBlock('该澄清决定已经提交，无需重复处理。')];
      return { ...result, events: [assistantEvent(blocks, settledTaskStatus(task))], assistantBlocks: blocks };
    }
    const uniqueOptionIds = Array.from(new Set(selectedOptionIds));
    const hasValidCardinality = existing?.type === 'CLARIFICATION' && (
      existing.question.type === 'SINGLE'
        ? uniqueOptionIds.length === 1
        : uniqueOptionIds.length > 0 && uniqueOptionIds.length <= (existing.question.maxSelections ?? existing.question.options.length)
    );
    const labels = existing?.type === 'CLARIFICATION' ? selectedLabels(existing, uniqueOptionIds) : [];
    if (
      !questionId ||
      existing?.type !== 'CLARIFICATION' ||
      existing.question.resolution?.status !== 'OPEN' ||
      !hasValidCardinality ||
      labels.length !== uniqueOptionIds.length
    ) {
      const blocks: ConversationBlock[] = [textBlock('请选择有效的澄清选项后再继续。')];
      const nextStatus = existing?.type === 'CLARIFICATION' && existing.question.resolution?.status === 'OPEN'
        ? 'NEEDS_CLARIFICATION'
        : settledTaskStatus(task);
      return { ...result, events: [assistantEvent(blocks, nextStatus)], assistantBlocks: blocks };
    }

    if (isBenchmarkQuestionId(questionId)) {
      const readiness = selectAskHandoffReadiness(task);
      if (!readiness.ready) return { ...result, events: [assistantEvent([textBlock(readiness.message)], settledTaskStatus(task))], assistantBlocks: [textBlock(readiness.message)] };
      const askPlan = buildAskPlan(task, uniqueOptionIds[0]);
      const blocks: ConversationBlock[] = [textBlock('比较基准已确认，分析计划已准备完成，请先执行权限重检。')];
      return {
        ...result,
        events: [{ type: 'CLARIFICATION_RESOLVED', payload: { questionId, selectedOptionIds: uniqueOptionIds, selectedOptionLabels: labels, requirementRevision: task.requirementRevision, resolvedAt: new Date().toISOString() } }, { type: 'ASK_PLAN_PREPARED', payload: { askPlan } }, assistantEvent(blocks, 'WAITING_USER')],
        assistantBlocks: blocks
      };
    }

    if (questionId === minhangBedDefinitionQuestion.id) {
      const bedDefinition = uniqueOptionIds[0] === 'bed_approved'
        ? '养老床位核定数'
        : '民政核定且在营可用养老床位数';
      const hypothesis: RequirementHypothesis = {
        ...task.requirementHypothesis,
        bedDefinition,
        unresolvedQuestions: []
      };
      const prepared = buildInitialCompositionResult(task, hypothesis);
      return {
        ...prepared,
        events: [
          { type: 'CLARIFICATION_RESOLVED', payload: { questionId, selectedOptionIds: uniqueOptionIds, selectedOptionLabels: labels, requirementRevision: task.requirementRevision + 1, resolvedAt: new Date().toISOString() } },
          ...prepared.events
        ]
      };
    }

    const shouldApplyBroadGoalDefaults = questionId === focusQuestion.id &&
      labels.includes('人口规模与养老床位供给') &&
      !task.requirementHypothesis.populationDefinition &&
      !task.requirementHypothesis.bedDefinition;
    const defaultAssumptions = shouldApplyBroadGoalDefaults
      ? Array.from(new Set([
          ...task.requirementHypothesis.assumptions,
          '当前按 60 岁及以上常住人口理解，可在任务上下文中修改。',
          '当前按在营可用养老床位理解，可在任务上下文中修改。'
        ]))
      : task.requirementHypothesis.assumptions;
    const recomposed = buildRequirementReevaluationResult(task, {
      analysisFocus: labels,
      ...(shouldApplyBroadGoalDefaults
        ? {
            populationDefinition: '60 岁及以上常住人口',
            bedDefinition: '民政核定且在营可用养老床位数',
            assumptions: defaultAssumptions
          }
        : {})
    });
    return {
      ...recomposed,
      events: [
        { type: 'CLARIFICATION_RESOLVED', payload: { questionId, selectedOptionIds: uniqueOptionIds, selectedOptionLabels: labels, requirementRevision: task.requirementRevision + 1, resolvedAt: new Date().toISOString() } },
        ...recomposed.events
      ]
    };
  }
}

export function createMinhangComparisonEvents(): FindDataEvent[] {
  return [{ type: 'COMPARISON_MODEL_SET', payload: { comparisonModel: MINHANG_COMPARISON_MODEL } }];
}
