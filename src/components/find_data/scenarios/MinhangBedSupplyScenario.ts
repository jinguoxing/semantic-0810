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

const benchmarkQuestion = {
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

const broadHypothesis: RequirementHypothesis = {
  region: '上海市闵行区',
  dimensions: [],
  analysisFocus: [],
  assumptions: [],
  unresolvedQuestions: [focusQuestion]
};

const sufficientHypothesis: RequirementHypothesis = {
  region: '上海市闵行区',
  timeRange: { start: '2025.09', end: '2026.08' },
  populationDefinition: '60 岁及以上常住人口',
  bedDefinition: '民政核定且在营可用养老床位数',
  dimensions: ['时间（月度）', '空间（街镇）'],
  analysisFocus: ['老年人口规模与分布', '养老床位供给'],
  assumptions: [],
  unresolvedQuestions: []
};

const coreItems = MINHANG_DATA_SOLUTION.items.filter((item) => ['r01', 'r04'].includes(item.resourceId));
const relationshipEvidence = MINHANG_DATA_SOLUTION.relationshipEvidence;

function isSufficientInitialGoal(text: string): boolean {
  return /(过去\s*12\s*个月|过去一年|202\d|\d{4}[.\/-]\d{1,2})/.test(text) &&
    /(街镇|街道|镇)/.test(text) &&
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
    const isCore = resourceId === 'r01' || resourceId === 'r04';
    return {
      resourceId,
      title: resource?.name ?? '相关资源',
      reason: isCore ? '直接满足当前供给分析的核心指标需要。' : resourceId === 'r07' ? '仅覆盖居家养老服务订单，属于部分匹配。' : '与当前目标相关，可进一步评估。',
      matchType: isCore ? 'DIRECT' as const : resourceId === 'r07' ? 'PARTIAL' as const : 'RELATED' as const,
      proposedRole: isCore ? 'CORE' as const : resourceId === 'r07' ? 'PARTIAL_MATCH' as const : resourceId === 'r06' ? 'CONDITIONAL_SUPPORT' as const : 'OPTIONAL_DRILLDOWN' as const,
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
          ...(options.items.some((item) => item.resourceId === 'r01')
            ? {
                relationshipEvidence,
                coverageSummary: options.coverageSummary ?? MINHANG_DATA_SOLUTION.coverageSummary,
                limitationSummary: MINHANG_DATA_SOLUTION.limitationSummary
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
  boundary: string;
  value?: string;
  reference?: string;
}> = {
  benchmark_rank: {
    rule: 'RANK_ONLY',
    boundary: '分析结果仅按每千名老人床位数展示街镇排名，不据此判定供给不足或缺少养老资源。'
  },
  benchmark_weighted: {
    rule: 'WEIGHTED_DISTRICT_AVERAGE',
    boundary: MINHANG_ASK_PLAN.calculationSpec.strictConclusionBoundary
  },
  benchmark_policy: {
    rule: 'POLICY_TARGET',
    value: '30 张 / 千人',
    reference: '离线演示政策目标（Mock Fixture，并非正式政策依据）',
    boundary: '当前政策目标仅为离线演示值，不得据此声称真实政策达标或不达标；真实执行必须由后端提供已登记且可追溯的正式政策依据。'
  }
};

function buildAskPlan(task: FindDataTaskState, requirementRevision: number, benchmarkOptionId?: string): AskPlan {
  const benchmark = benchmarkOptionId
    ? benchmarkRules[benchmarkOptionId]
    : undefined;
  return {
    ...MINHANG_ASK_PLAN,
    calculationSpec: {
      ...MINHANG_ASK_PLAN.calculationSpec,
      benchmarkRule: benchmark?.rule ?? task.askPlan?.calculationSpec.benchmarkRule ?? MINHANG_ASK_PLAN.calculationSpec.benchmarkRule,
      benchmarkValue: benchmark?.value ?? task.askPlan?.calculationSpec.benchmarkValue,
      benchmarkReference: benchmark?.reference ?? task.askPlan?.calculationSpec.benchmarkReference,
      strictConclusionBoundary: benchmark?.boundary ?? task.askPlan?.calculationSpec.strictConclusionBoundary ?? MINHANG_ASK_PLAN.calculationSpec.strictConclusionBoundary
    },
    permissionCheckState: 'NOT_CHECKED',
    permissionBaseline: Object.fromEntries(
      MINHANG_ASK_PLAN.coreResourceIds.map((id) => [id, task.resources[id]?.availabilityByAction.query ?? 'UNKNOWN'])
    ),
    requirementRevision,
    timeRange: task.requirementHypothesis.timeRange
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
  query?: string
): FindDataEngineResult {
  const item = MINHANG_DATA_SOLUTION.items.find((entry) => entry.resourceId === 'r07')!;
  const gaps = mode === 'MERGE'
    ? [...task.dataSolution.gaps.filter((gap) => gap.id !== serviceUseGap.id), serviceUseGap]
    : [serviceUseGap];
  const blocks: ConversationBlock[] = [
    textBlock('当前仅检索到「居家养老服务订单」，已作为部分匹配并登记覆盖缺口。')
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

function settledTaskStatus(task: FindDataTaskState): FindDataTaskState['status'] {
  if (task.askPlan) return 'WAITING_USER';
  if (task.dataSolution.items.length > 0) return 'READY';
  return 'WAITING_USER';
}

function isCoverageSupported(timeRange: RequirementHypothesis['timeRange']): boolean {
  if (!timeRange) return true;
  const normalize = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 6);
  const start = normalize(timeRange.start);
  const end = normalize(timeRange.end);
  return start >= '202509' && end <= '202608';
}

function coverageForTimeRange(timeRange: RequirementHypothesis['timeRange']): string[] {
  const coverage = MINHANG_DATA_SOLUTION.coverageSummary.filter((line) => !line.startsWith('时间覆盖：'));
  if (!timeRange) return coverage;
  return [
    ...coverage,
    `时间覆盖：已按 ${timeRange.start} — ${timeRange.end} 重新验证当前核心资源的月度覆盖。`
  ];
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

  if (!isCoverageSupported(nextHypothesis.timeRange)) {
    const gap: SolutionGap = {
      id: 'gap_time_coverage',
      title: '时间覆盖不足',
      description: '当前已登记资源的时间覆盖不能满足新的时间范围。',
      impactLevel: 'HIGH',
      mitigation: '缩小时间范围或接入覆盖该期间的正式指标。',
      status: 'OPEN'
    };
    const blocks = [textBlock('已按新时间范围重新验证，当前已登记资源的时间覆盖不能满足新的时间范围。')];
    return {
      ...emptyScenarioResult(task.taskId),
      events: [
        ...prerequisite,
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
      ...searchEvents(task, {
        requirementRevision,
        resourceIds: ['r01', 'r04'],
        items: coreItems,
        mode: 'REPLACE',
        query: '需求修改后重新检索',
        coverageSummary: coverageForTimeRange(nextHypothesis.timeRange)
      }),
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
      if (intent.matchedRule === 'compare-summary-question') {
        const blocks: ConversationBlock[] = [
          textBlock('这两项资源可以从粒度、时间形态和查询权限三个维度比较。'),
          { type: 'ACTION_GROUP', id: createScenarioId('actions'), actions: [{ id: createScenarioId('compare'), label: '比较 2 项资源', actionCode: 'OPEN_COMPARE', variant: 'weak' }] }
        ];
        return { ...result, events: [assistantEvent(blocks, settledTaskStatus(task))], assistantBlocks: blocks };
      }
      if (intent.kind === 'ANALYZE' && task.dataSolution.state === 'READY' && task.dataSolution.items.length > 0 && !task.askPlan) {
        const blocks: ConversationBlock[] = [{ type: 'CLARIFICATION', id: createScenarioId('clarification'), question: benchmarkQuestion }];
        const hypothesis = {
          ...task.requirementHypothesis,
          unresolvedQuestions: [...task.requirementHypothesis.unresolvedQuestions, benchmarkQuestion]
        };
        return {
          ...result,
          events: [
            { type: 'REQUIREMENT_UPDATED', payload: { hypothesis, bumpRevision: false } },
            assistantEvent(blocks, 'WAITING_USER')
          ],
          assistantBlocks: blocks
        };
      }
      if (text.includes('实际服务使用')) {
        const requirementRevision = task.requirementRevision + 1;
        return buildServiceUseResult(task, requirementRevision, [{
          type: 'REQUIREMENT_UPDATED',
          payload: {
            hypothesis: {
              analysisFocus: Array.from(new Set([...task.requirementHypothesis.analysisFocus, '养老服务实际使用']))
            },
            bumpRevision: true
          }
        }], 'MERGE', text);
      }
      if (intent.kind === 'RESOURCE_BROWSE' || /(查看明细|解释机构|浏览相关资源|人口明细)/.test(text)) {
        const ids = text.includes('解释机构') ? ['r06'] : ['r02', 'r03'];
        const blocks: ConversationBlock[] = [
          textBlock(`当前发现 ${ids.length} 项可选明细资源。基于过去 12 个月的目标，月度快照更适合。`),
          { type: 'ACTION_GROUP', id: createScenarioId('actions'), actions: [
            { id: createScenarioId('compare'), label: '比较 2 项资源', actionCode: 'OPEN_COMPARE', variant: 'weak' },
            { id: createScenarioId('select'), label: '使用月度快照', actionCode: 'SELECT_RESOURCE', payload: { resourceId: 'r03' }, variant: 'primary' }
          ] }
        ];
        const comparisonEvents = ids.includes('r02') && ids.includes('r03') ? createMinhangComparisonEvents() : [];
        return {
          ...result,
          events: [
            ...comparisonEvents,
            ...searchEvents(task, { requirementRevision: task.requirementRevision, resourceIds: ids, items: [], mode: 'MERGE', query: text }),
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

    const requirementRevision = task.requirementRevision + 1;
    const blocks: ConversationBlock[] = [
      textBlock('已按当前已登记的指标定义完成初次检索，形成包含老年人口与在营可用养老床位的最小数据方案。'),
      {
        type: 'RESULT_BRIEF', id: createScenarioId('result'), briefKind: 'SOLUTION_SUMMARY',
        title: '已形成 2 项核心资源的最小数据方案',
        candidates: coreItems.map((item) => {
          const resource = MINHANG_RESOURCES[item.resourceId];
          return { resourceId: resource.id, title: resource.name, typeBadge: resource.type, statusBadge: '可用于问数', description: resource.desc, granularity: resource.granularity };
        }),
        primaryAction: { label: '查看当前方案', actionCode: 'OPEN_SOLUTION' }
      }
    ];
    return {
      ...result,
      events: [
        { type: 'REQUIREMENT_UPDATED', payload: { hypothesis: sufficientHypothesis, bumpRevision: true } },
        ...searchEvents(task, { requirementRevision, resourceIds: ['r01', 'r04'], items: coreItems, query: text }),
        assistantEvent(blocks, 'READY')
      ],
      assistantBlocks: blocks
    };
  }

  async handleAction(task: FindDataTaskState, action: TaskAction): Promise<FindDataEngineResult> {
    const result = emptyScenarioResult(task.taskId);
    if (action.actionCode === 'REGENERATE_ASK_PLAN') {
      const askPlan = buildAskPlan(task, task.requirementRevision);
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

    const requirementRevision = task.requirementRevision + 1;
    const nextAnalysisFocus = questionId === benchmarkQuestion.id
      ? Array.from(new Set([...task.requirementHypothesis.analysisFocus, ...labels]))
      : labels;
    const baseEvents: FindDataEvent[] = [
      { type: 'CLARIFICATION_RESOLVED', payload: { questionId, selectedOptionIds: uniqueOptionIds, selectedOptionLabels: labels, requirementRevision, resolvedAt: new Date().toISOString() } },
      { type: 'REQUIREMENT_UPDATED', payload: { hypothesis: { analysisFocus: nextAnalysisFocus }, bumpRevision: true } }
    ];

    if (questionId === benchmarkQuestion.id) {
      const askPlan = buildAskPlan(task, requirementRevision, uniqueOptionIds[0]);
      const blocks: ConversationBlock[] = [textBlock('比较基准已确认，分析计划已准备完成，请先执行权限重检。')];
      return {
        ...result,
        events: [...baseEvents, { type: 'ASK_PLAN_PREPARED', payload: { askPlan } }, assistantEvent(blocks, 'WAITING_USER')],
        assistantBlocks: blocks
      };
    }

    if (uniqueOptionIds.includes('opt_service')) {
      return buildServiceUseResult(task, requirementRevision, baseEvents, 'REPLACE');
    }

    if (uniqueOptionIds.includes('opt_public_service')) {
      const gap: SolutionGap = {
        id: 'gap_public_service', title: '老年人公共服务诉求资源缺口',
        description: '当前检索范围内尚未配置可用于该目标的正式资源。',
        impactLevel: 'HIGH', mitigation: '扩展公共服务工单与热线诉求数据域。', status: 'OPEN'
      };
      const blocks: ConversationBlock[] = [textBlock('当前未检索到可用的老年人公共服务诉求资源，已登记为当前检索缺口。')];
      return {
        ...result,
        events: [...baseEvents, ...searchEvents(task, { requirementRevision, resourceIds: [], items: [], gaps: [gap] }), assistantEvent(blocks, 'READY')],
        assistantBlocks: blocks
      };
    }

    const blocks: ConversationBlock[] = [textBlock('已按「人口规模与养老床位供给」形成最小数据方案，暂不生成分析计划。')];
    return {
      ...result,
      events: [...baseEvents, ...searchEvents(task, { requirementRevision, resourceIds: ['r01', 'r04'], items: coreItems }), assistantEvent(blocks, 'READY')],
      assistantBlocks: blocks
    };
  }
}

export function createMinhangComparisonEvents(): FindDataEvent[] {
  return [{ type: 'COMPARISON_MODEL_SET', payload: { comparisonModel: MINHANG_COMPARISON_MODEL } }];
}
