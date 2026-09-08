import {
  AskPlan,
  AskPlanRunRequest,
  AskRunResult,
  AskResultCitation,
  AskResultSnapshot,
  ClarificationQuestion,
  DirectMetricQueryState,
  FindDataTaskState,
  RequirementHypothesis,
  ResourceId,
  TaskAction,
  TurnTargetContext
} from '../model/FindDataTask';
import { FindDataEvent } from '../model/findDataEvents';
import { findDataReducer } from '../model/findDataReducer';
import {
  selectCanonicalMetricExecutionRef,
  selectEffectiveDataSolution,
  selectEffectiveDataSolutionItemsBySelectionGroup,
  selectResultTargetByRef,
  validateAnalyticalAlignment
} from '../model/findDataSelectors';
import { MINHANG_RESOURCES } from '../fixtures/minhangBedSupplyFixture';
import { composeMinhangSolution } from '../scenarios/minhangSolutionComposer';
import { createScenarioId } from '../scenarios/FindDataScenario';
import {
  CreateFindDataTaskInput,
  FindDataEngineResult,
  FindDataService,
  FindDataTaskSummary,
  PermissionRecheckResult
} from './FindDataService';
import { MockFindDataService } from './MockFindDataService';

const DESIGN_CONTINUITY_SCENARIO_KEY = 'design_demo_pujin_qibao_bed_supply';
const DESIGN_CONTINUITY_TITLE = '浦锦、七宝养老服务供给比较';
const BED_DEFINITION_SELECTION_GROUP = 'bed_definition_alternative';
const DESIGN_SOLUTION_BED_DEFINITION_PREFIX = 'design_solution_bed_definition';
/** Find → Ask handoff: reference to the current solution plus an ask-data intent. */
const FIND_TO_ASK_BRIDGE_SOLUTION_PATTERN = /(当前|现有).{0,6}方案|方案.{0,8}(继续|问数)/;
const FIND_TO_ASK_BRIDGE_INTENT_PATTERN = /(问数|每千名|继续问|比较)/;
/** Fresh-task figure branches require an explicit metric intent; find goals keep flowing to the find pipeline. */
const METRIC_INTENT_PATTERN = /(查询|查一下|是多少|多少|定义|口径|解释|解读)/;

/** Design-demo execution input only. It is never written to FindDataResource. */
const DESIGN_CONTINUITY_RAW_FIXTURE: Partial<Record<ResourceId, Record<string, Record<string, number>>>> = {
  r01: {
    '浦锦街道': { '2026-08': 20000 },
    '七宝镇': { '2026-08': 40000 }
  },
  r04: {
    '浦锦街道': { '2026-08': 300 },
    '七宝镇': { '2026-08': 800 }
  },
  r05: {
    '浦锦街道': { '2026-08': 450 },
    '七宝镇': { '2026-08': 1000 }
  }
};

function isSolutionBedDefinitionQuestionId(questionId: string | undefined): boolean {
  return Boolean(questionId?.startsWith(DESIGN_SOLUTION_BED_DEFINITION_PREFIX));
}

const DESIGN_BED_CLARIFICATION_DESCRIPTIONS: Record<ResourceId, string> = {
  r04: '用于了解本口径下的在营可用容量。',
  r05: '用于了解核定容量，不等于实际可用容量。'
};

/**
 * Isolated visual-contract adapter for figures 01 and 02. It is intentionally
 * not the default Mock service and never participates in HTTP or disconnected
 * execution. The values below are the approved design sample, not production
 * statistics.
 */
export class MetricQueryDesignDemoService implements FindDataService {
  private readonly fallback = new MockFindDataService();
  private readonly tasks = new Map<string, FindDataTaskState>();

  async createTask(input?: CreateFindDataTaskInput): Promise<FindDataTaskState> {
    return this.fallback.createTask(input);
  }

  async listTasks(): Promise<FindDataTaskSummary[]> {
    const fallback = await this.fallback.listTasks();
    const own = Array.from(this.tasks.values()).map(({ taskId, title, status, updatedAt, scenarioKey }) => ({ taskId, title, status, updatedAt, scenarioKey }));
    return [...own, ...fallback.filter((item) => !this.tasks.has(item.taskId))]
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }

  async getTask(taskId: string): Promise<FindDataTaskState> {
    return this.tasks.get(taskId) ?? this.fallback.getTask(taskId);
  }

  async deleteTask(taskId: string): Promise<void> {
    if (this.tasks.delete(taskId)) return;
    await this.fallback.deleteTask(taskId);
  }

  async submitTurn(task: FindDataTaskState, text: string, operationId = createScenarioId('operation'), context?: TurnTargetContext): Promise<FindDataEngineResult> {
    if (context?.resultTarget) {
      this.tasks.set(task.taskId, task);
      return this.persist(task, this.interpretResult(task, context, operationId));
    }
    if (/(生成.*床位.*比较|查看.*两份.*床位|在营可用.*核定.*比较)/.test(text)) {
      this.tasks.set(task.taskId, task);
      return this.persist(task, this.historyComparison(task, operationId));
    }
    if (this.isContinuityGoal(task, text)) {
      this.tasks.set(task.taskId, task);
      return this.persist(task, this.beginContinuityGoal(task, text, operationId));
    }
    if (this.isFindToAskBridgeRequest(task, text)) {
      this.tasks.set(task.taskId, task);
      return this.persist(task, this.beginFindToAskContinuation(task, text, operationId));
    }
    // A task already owned by a find-data scenario keeps its whole conversation
    // with the find pipeline; the bridge phrase above is the only handoff into
    // the ask-data figures.
    if (task.scenarioKey && task.scenarioKey !== DESIGN_CONTINUITY_SCENARIO_KEY && !this.isDesignTask(task)) {
      return this.fallback.submitTurn(task, text, operationId, context);
    }
    if (this.isContinuityTask(task)) {
      this.tasks.set(task.taskId, task);
      const continuityResult = this.handleContinuityTurn(task, text, operationId);
      if (continuityResult) return this.persist(task, continuityResult);
    }
    const designKind = this.resolveDesignKind(task, text);
    if (!designKind) return this.fallback.submitTurn(task, text, operationId, context);
    this.tasks.set(task.taskId, task);
    const result = designKind === 'ELDERLY'
      ? this.handleElderlyTurn(task, text, operationId)
      : designKind === 'DEFINITION'
      ? this.handleDefinitionTurn(task, operationId)
      : this.handleBedTurn(task, text, operationId);
    return this.persist(task, result);
  }

  async executeAction(task: FindDataTaskState, action: TaskAction, operationId = createScenarioId('operation')): Promise<FindDataEngineResult> {
    if (!this.isDesignTask(task)) return this.fallback.executeAction(task, action, operationId);
    this.tasks.set(task.taskId, task);
    const result = action.actionCode === 'SUBMIT_CLARIFICATION'
      ? this.submitClarification(task, action, operationId)
      : action.actionCode === 'RUN_METRIC_QUERY'
      ? this.runMetricQuery(task, action, operationId)
      : this.notice(task, operationId, '当前设计演示仅支持提交口径或继续本次指标查询。', 'warning');
    return this.persist(task, result);
  }

  async recheckPermissions(task: FindDataTaskState, resourceIds: string[], action: 'query' | 'preview' | 'export', operationId?: string): Promise<PermissionRecheckResult> {
    return this.fallback.recheckPermissions(task, resourceIds, action, operationId);
  }

  async runAskPlan(task: FindDataTaskState, request: AskPlanRunRequest, operationId?: string): Promise<AskRunResult> {
    if (this.isContinuityTask(task)) return this.runContinuityAskPlan(task, request, operationId);
    return this.fallback.runAskPlan(task, request, operationId);
  }

  private persist(task: FindDataTaskState, result: FindDataEngineResult): FindDataEngineResult {
    this.tasks.set(task.taskId, result.events.reduce(findDataReducer, task));
    return result;
  }

  private isDesignTask(task: FindDataTaskState): boolean {
    return this.isContinuityTask(task) || task.entryContext?.target.id === 'met_elderly_population' || task.directMetricQuery?.metricId.startsWith('design_') === true ||
      task.turns.some((turn) => turn.blocks.some((block) => block.type === 'CLARIFICATION' && block.question.id.startsWith('design_')));
  }

  private isContinuityTask(task: FindDataTaskState): boolean {
    return task.scenarioKey === DESIGN_CONTINUITY_SCENARIO_KEY;
  }

  private isContinuityGoal(task: FindDataTaskState, text: string): boolean {
    return !task.scenarioKey &&
      /浦锦/.test(text) && /七宝/.test(text) &&
      /(养老服务供给|养老床位|养老服务)/.test(text) &&
      /2026\s*年?\s*8\s*月/.test(text);
  }

  /**
   * Find → Ask handoff. The find pipeline must already have composed a usable
   * core solution (population metric included); the user references that
   * solution and states an ask-data intent. Plain analysis requests such as
   * 「按当前方案分析」 stay with the find pipeline.
   */
  private isFindToAskBridgeRequest(task: FindDataTaskState, text: string): boolean {
    if (task.scenarioKey !== 'minhang_bed_supply') return false;
    if (!FIND_TO_ASK_BRIDGE_SOLUTION_PATTERN.test(text)) return false;
    if (!FIND_TO_ASK_BRIDGE_INTENT_PATTERN.test(text)) return false;
    const solution = selectEffectiveDataSolution(task);
    return Boolean(solution?.items.some((item) =>
      item.resourceId === 'r01' && item.role === 'CORE' && item.inclusionState !== 'NOT_INCLUDED'
    ));
  }

  /**
   * Reclassifies a find-data task into the ask-data continuity scenario. The
   * solution is recomposed at the narrowed ask-data scope so it stays the
   * effective execution basis; the previous find-data analysis plan stops
   * being executable while its results remain read-only history in the
   * conversation.
   */
  private beginFindToAskContinuation(task: FindDataTaskState, text: string, operationId: string): FindDataEngineResult {
    const hypothesis: RequirementHypothesis = {
      region: '浦锦街道、七宝镇',
      timeRange: { start: '2026-08', end: '2026-08' },
      populationDefinition: task.requirementHypothesis.populationDefinition ?? '60 岁及以上常住人口',
      bedDefinition: task.requirementHypothesis.bedDefinition ?? '民政核定且在营可用养老床位数',
      dimensions: ['时间（月度）', '空间（街镇）'],
      analysisFocus: ['老年人口规模与分布', '养老床位供给'],
      assumptions: [],
      unresolvedQuestions: []
    };
    const composition = composeMinhangSolution(hypothesis, MINHANG_RESOURCES);
    const requirementRevision = task.requirementRevision + 1;
    const searchRevision = task.searchRevision + 1;
    const resourceIds = composition.resourceIds;
    const candidateSnapshot = resourceIds.map((resourceId) => ({
      resourceId,
      title: MINHANG_RESOURCES[resourceId]!.name,
      reason: '承接当前数据方案中的正式组成资源。',
      matchType: 'DIRECT' as const,
      proposedRole: 'CORE' as const,
      sourceSearchRevision: searchRevision
    }));
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [{
      type: 'TEXT',
      id: createScenarioId('find_to_ask_continuation'),
      content: '已承接当前数据方案继续问数。本次承接范围为浦锦街道、七宝镇 2026 年 8 月；方案中的正式指标与床位口径组保持可用。此前的找数分析计划已失效，其结果保留为只读历史，不会被新结果替代。现在可以继续查询人口或床位指标，或让我准备每千名老人床位数的比较方案。'
    }];
    return {
      taskId: task.taskId,
      operationId,
      events: [
        {
          type: 'SCENARIO_RECLASSIFIED',
          payload: {
            fromScenarioKey: task.scenarioKey ?? '',
            toScenarioKey: DESIGN_CONTINUITY_SCENARIO_KEY,
            reason: '用户要求基于当前数据方案继续问数，任务转入问数承接。'
          }
        },
        { type: 'ASK_PLAN_INVALIDATED', payload: { reason: '任务转入问数承接，原找数分析计划不再作为当前执行依据。' } },
        { type: 'REQUIREMENT_UPDATED', payload: { hypothesis, bumpRevision: true } },
        {
          type: 'SEARCH_STARTED',
          payload: { searchRevision, statusMessage: '正在按问数承接范围重组织当前数据方案…' }
        },
        {
          type: 'SEARCH_RESULTS_RECEIVED',
          payload: {
            taskId: task.taskId,
            requirementRevision,
            searchRevision,
            query: text,
            totalMatches: resourceIds.length,
            candidateSnapshot,
            resourceUpserts: resourceIds.map((resourceId) => MINHANG_RESOURCES[resourceId]!),
            candidateDelta: {
              retainedIds: [],
              addedIds: resourceIds,
              removedIds: [],
              allCandidateIds: resourceIds
            },
            solutionPatch: {
              mode: 'REPLACE',
              upsertItems: composition.items,
              gaps: composition.gaps,
              relationshipEvidence: composition.relationshipEvidence,
              coverageSummary: composition.coverageSummary,
              limitationSummary: composition.limitationSummary
            }
          }
        },
        { type: 'SURFACE_OPENED', payload: { type: 'SOLUTION', mode: 'WORKBENCH', resourceIds, openedBy: 'TASK_REQUIRED' } },
        this.assistantEvent(blocks, 'READY', {
          kind: 'SOLUTION', requirementRevision, searchRevision
        })
      ],
      assistantBlocks: blocks
    };
  }

  private beginContinuityGoal(task: FindDataTaskState, text: string, operationId: string): FindDataEngineResult {
    const hypothesis: RequirementHypothesis = {
      region: '浦锦街道、七宝镇',
      timeRange: { start: '2026-08', end: '2026-08' },
      populationDefinition: '60 岁及以上常住人口',
      bedDefinition: '民政核定且在营可用养老床位数',
      dimensions: ['时间（月度）', '空间（街镇）'],
      analysisFocus: ['老年人口规模与分布', '养老床位供给'],
      assumptions: [],
      unresolvedQuestions: []
    };
    const composition = composeMinhangSolution(hypothesis, MINHANG_RESOURCES);
    const requirementRevision = task.requirementRevision + 1;
    const searchRevision = task.searchRevision + 1;
    const resourceIds = composition.resourceIds;
    const candidateSnapshot = resourceIds.map((resourceId) => ({
      resourceId,
      title: MINHANG_RESOURCES[resourceId]!.name,
      reason: '当前数据方案的正式组成资源。',
      matchType: 'DIRECT' as const,
      proposedRole: 'CORE' as const,
      sourceSearchRevision: searchRevision
    }));
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [{
      type: 'TEXT',
      id: createScenarioId('solution_ready'),
      content: '数据方案已就绪。当前数据方案已经能够支持浦锦街道、七宝镇 2026 年 8 月的人口规模与养老床位容量比较，可以继续查询具体数据。'
    }];
    return {
      taskId: task.taskId,
      operationId,
      events: [
        { type: 'SCENARIO_CLASSIFIED', payload: { scenarioKey: DESIGN_CONTINUITY_SCENARIO_KEY } },
        { type: 'TASK_TITLE_UPDATED', payload: { title: DESIGN_CONTINUITY_TITLE, goal: text } },
        { type: 'REQUIREMENT_UPDATED', payload: { hypothesis, bumpRevision: true } },
        {
          type: 'SEARCH_STARTED',
          payload: {
            searchRevision,
            statusMessage: '正在形成当前数据方案…'
          }
        },
        {
          type: 'SEARCH_RESULTS_RECEIVED',
          payload: {
            taskId: task.taskId,
            requirementRevision,
            searchRevision,
            query: text,
            totalMatches: resourceIds.length,
            candidateSnapshot,
            resourceUpserts: resourceIds.map((resourceId) => MINHANG_RESOURCES[resourceId]!),
            candidateDelta: {
              retainedIds: [],
              addedIds: resourceIds,
              removedIds: [],
              allCandidateIds: resourceIds
            },
            solutionPatch: {
              mode: 'REPLACE',
              upsertItems: composition.items,
              gaps: composition.gaps,
              relationshipEvidence: composition.relationshipEvidence,
              coverageSummary: composition.coverageSummary,
              limitationSummary: composition.limitationSummary
            }
          }
        },
        {
          type: 'SURFACE_OPENED',
          payload: { type: 'SOLUTION', mode: 'WORKBENCH', resourceIds, openedBy: 'TASK_REQUIRED' }
        },
        this.assistantEvent(blocks, 'READY', {
          kind: 'SOLUTION', requirementRevision, searchRevision
        })
      ],
      assistantBlocks: blocks
    };
  }

  private handleContinuityTurn(task: FindDataTaskState, text: string, operationId: string): FindDataEngineResult | undefined {
    const requirementChange = this.resolveContinuityRequirementChange(text);
    if (requirementChange) return this.updateContinuityRequirement(task, requirementChange, operationId);
    if (this.isContinuityCalculationRequest(text)) return this.prepareContinuityAskPlan(task, text, operationId);
    if (/(老年人口|60\s*岁及以上常住人口)/.test(text) || this.isSingleMetricSolutionFollowUp(task, text)) {
      return this.prepareSolutionPopulationQuery(task, text, operationId);
    }
    if (/养老床位/.test(text)) return this.prepareSolutionBedClarification(task, operationId);
    return undefined;
  }

  private isContinuityCalculationRequest(text: string): boolean {
    return /(?:每千名.*老人.*床位|每千名老人床位|按同样方式计算|床位.*比较.*计算|比较.*床位.*每千)/.test(text);
  }

  private prepareContinuityAskPlan(task: FindDataTaskState, text: string, operationId: string): FindDataEngineResult {
    const solution = selectEffectiveDataSolution(task);
    const bedResourceId: ResourceId = /核定床位/.test(text) ? 'r05' : 'r04';
    const populationItem = solution?.items.find((item) => item.resourceId === 'r01' && item.role === 'CORE' && item.inclusionState !== 'NOT_INCLUDED');
    const bedItem = solution?.items.find((item) =>
      item.resourceId === bedResourceId && item.role === 'CORE' && item.selectionGroupId === BED_DEFINITION_SELECTION_GROUP
    );
    if (!solution || !populationItem || !bedItem || !task.resources[bedResourceId]) {
      return this.notice(task, operationId, '当前有效数据方案未提供本次计算所需的人口指标和床位口径，请先形成新的有效数据方案。', 'warning');
    }
    if (bedResourceId !== 'r04' && bedResourceId !== 'r05') {
      return this.notice(task, operationId, '当前数据方案未提供可用于本次计算的床位口径。', 'warning');
    }
    const askPlan = this.buildContinuityAskPlan(task, bedResourceId);
    const alignment = validateAnalyticalAlignment(task, askPlan);
    if (!alignment.allowed) {
      return this.notice(task, operationId, '当前数据方案缺少本次计算所需的分析关系或时间粒度证据，尚不能生成计算方案。', 'warning');
    }
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [{
      type: 'TEXT',
      id: createScenarioId('calculation_plan_ready'),
      content: `已沿用当前任务中的老年人口和${task.resources[bedResourceId].name}数据，准备了本次比较方案。`
    }];
    return {
      taskId: task.taskId,
      operationId,
      events: [
        { type: 'ASK_PLAN_PREPARED', payload: { askPlan } },
        this.assistantEvent(blocks, 'WAITING_USER', {
          kind: 'ASK_PLAN',
          requirementRevision: task.requirementRevision,
          searchRevision: task.searchRevision,
          askPlanId: askPlan.id
        })
      ],
      assistantBlocks: blocks,
      surfaceCommand: {
        action: task.activeSurface.type === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'ASK_PLAN',
        mode: 'WORKBENCH',
        openedBy: 'TASK_REQUIRED',
        focusSection: 'PLAN'
      }
    };
  }

  private buildContinuityAskPlan(task: FindDataTaskState, bedResourceId: 'r04' | 'r05'): AskPlan {
    const available = bedResourceId === 'r04';
    const numerator = available ? '在营可用养老床位数' : '养老床位核定数';
    const coreResourceIds: ResourceId[] = ['r01', bedResourceId];
    return {
      id: createScenarioId('plan'),
      title: `浦锦、七宝${numerator}比较方案`,
      status: 'READY_TO_RUN',
      coreResourceIds,
      conditionalResourceIds: [],
      // The isolated runner rechecks this exact baseline before execution.
      permissionCheckState: 'ALLOWED',
      permissionBaseline: Object.fromEntries(coreResourceIds.map((resourceId) => [
        resourceId,
        task.resources[resourceId]?.availabilityByAction.query ?? 'UNKNOWN'
      ])),
      requirementRevision: task.requirementRevision,
      basedOnSearchRevision: task.searchRevision,
      timeRange: task.requirementHypothesis.timeRange,
      alignmentRequirement: {
        requiredDimensions: ['street_town', 'month'],
        requiredTimeGrain: 'MONTH',
        requiredRelationshipResourcePairs: [{ sourceResourceId: bedResourceId, targetResourceId: 'r01' }]
      },
      calculationSpec: {
        metricName: available ? '每千名老人在营可用养老床位数' : '每千名老人核定养老床位数',
        isOfficialMetric: false,
        formula: `${numerator} ÷ 同期 60 岁及以上常住人口数 × 1000`,
        formulaExplanation: `分子为街镇${numerator}，分母为同期 60 岁及以上常住人口数；乘以 1000 得到每千名老人的床位数。`,
        numerator,
        denominator: '60 岁及以上常住人口数',
        multiplier: 1000,
        benchmarkRule: 'RANK_ONLY',
        strictConclusionBoundary: '仅比较当前口径下的相对水平，不判断是否充足、不代表真实需求，也不生成政策目标或建设建议。'
      }
    };
  }

  private isSingleMetricSolutionFollowUp(task: FindDataTaskState, text: string): boolean {
    if (!/(浦锦|七宝).{0,12}\d{1,2}\s*月.*多少/.test(text)) return false;
    const solution = selectEffectiveDataSolution(task);
    const executableMetricItems = solution?.items.filter((item) =>
      item.inclusionState !== 'NOT_INCLUDED' && Boolean(selectCanonicalMetricExecutionRef(task.resources[item.resourceId]))
    ) ?? [];
    return executableMetricItems.length === 1 && executableMetricItems[0].resourceId === 'r01';
  }

  private resolveContinuityRequirementChange(text: string): Partial<RequirementHypothesis> | undefined {
    if (/(后续|以后|接下来).{0,8}核定床位|后面都按核定床位/.test(text)) {
      return { bedDefinition: '养老床位核定数' };
    }
    if (/(把当前任务改成|后面都按|不要再看).{0,12}7\s*月/.test(text)) {
      return { timeRange: { start: '2026-07', end: '2026-07' } };
    }
    return undefined;
  }

  private updateContinuityRequirement(
    task: FindDataTaskState,
    hypothesis: Partial<RequirementHypothesis>,
    operationId: string
  ): FindDataEngineResult {
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [{
      type: 'TEXT',
      id: createScenarioId('requirement_updated'),
      content: '已更新当前任务条件。现有数据方案将不再作为当前执行依据；历史结果仍保留为只读记录。'
    }];
    const staleClarifications = this.staleOpenSolutionBedClarifications(task);
    return {
      taskId: task.taskId,
      operationId,
      events: [
        { type: 'REQUIREMENT_UPDATED', payload: { hypothesis, bumpRevision: true } },
        ...staleClarifications,
        this.assistantEvent(blocks, 'WAITING_USER', { kind: 'SOLUTION', requirementRevision: task.requirementRevision + 1 })
      ],
      assistantBlocks: blocks,
      surfaceCommand: { action: 'NO_CHANGE' }
    };
  }

  private prepareSolutionPopulationQuery(task: FindDataTaskState, text: string, operationId: string): FindDataEngineResult {
    const solution = selectEffectiveDataSolution(task);
    const item = solution?.items.find((candidate) => candidate.resourceId === 'r01' && candidate.inclusionState !== 'NOT_INCLUDED');
    const resource = item ? task.resources[item.resourceId] : undefined;
    const executionRef = selectCanonicalMetricExecutionRef(resource);
    if (!solution || !item || !executionRef) {
      return this.notice(task, operationId, '当前数据方案未提供可直接执行的正式老年人口指标，请先形成新的有效数据方案。', 'warning');
    }
    const requestedConditions = this.resolveContinuityRequestedConditions(task, text, 'POPULATION');
    if (!requestedConditions) {
      return this.notice(task, operationId, '请明确本次要查询的浦锦街道或七宝镇。', 'warning');
    }
    const query: DirectMetricQueryState = {
      requestId: createScenarioId('metric_request'),
      metricId: executionRef.id,
      source: {
        kind: 'DATA_SOLUTION',
        resourceId: item.resourceId,
        requirementRevision: task.requirementRevision,
        searchRevision: task.searchRevision
      },
      requestedConditions,
      definitionRef: { id: 'met_elderly_population', label: '老年人口数', version: executionRef.version },
      status: 'READY',
      preparedAt: new Date().toISOString()
    };
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [{
      type: 'TEXT',
      id: createScenarioId('direct_metric_prepared'),
      content: '已复用当前数据方案中的正式人口指标，正在查询本次指定范围。'
    }];
    return {
      taskId: task.taskId,
      operationId,
      events: [
        { type: 'DIRECT_METRIC_QUERY_PREPARED', payload: { query } },
        this.assistantEvent(blocks, 'WAITING_USER', {
          kind: 'SOLUTION', requirementRevision: task.requirementRevision, searchRevision: task.searchRevision
        })
      ],
      assistantBlocks: blocks,
      surfaceCommand: { action: 'CLOSE', surface: 'CLOSED' }
    };
  }

  private prepareSolutionBedClarification(task: FindDataTaskState, operationId: string): FindDataEngineResult {
    const alternatives = selectEffectiveDataSolutionItemsBySelectionGroup(task, BED_DEFINITION_SELECTION_GROUP)
      .flatMap((item) => {
        const resource = task.resources[item.resourceId];
        return resource && DESIGN_BED_CLARIFICATION_DESCRIPTIONS[item.resourceId]
          ? [{ item, resource }]
          : [];
      });
    if (alternatives.length !== 2) {
      return this.notice(task, operationId, '当前数据方案中没有可复用的完整床位口径组，请先形成新的有效数据方案。', 'warning');
    }
    const question: ClarificationQuestion = {
      id: this.createSolutionBedDefinitionQuestionId(task),
      question: '当前数据方案中已有两个可用床位口径。你要看在营可用床位，还是核定床位？两种口径的数值和含义不同。',
      type: 'SINGLE',
      options: alternatives.map(({ item, resource }) => ({
        id: item.resourceId,
        label: resource.name,
        description: DESIGN_BED_CLARIFICATION_DESCRIPTIONS[item.resourceId]
      })),
      submitLabel: '使用此口径继续查询',
      resolution: { status: 'OPEN', selectedOptionIds: [] }
    };
    const block = this.clarification(question);
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent([block], 'NEEDS_CLARIFICATION', {
        kind: 'SOLUTION', requirementRevision: task.requirementRevision, searchRevision: task.searchRevision
      })],
      assistantBlocks: [block],
      surfaceCommand: { action: 'CLOSE', surface: 'CLOSED' }
    };
  }

  private resolveDesignKind(task: FindDataTaskState, text: string): 'ELDERLY' | 'BED' | 'DEFINITION' | undefined {
    const asksDefinition = /(指标定义|查看.*定义|定义是什么|口径是什么|查看.*口径)/.test(text);
    if (task.entryContext?.target.kind === 'METRIC' && task.entryContext.target.id === 'met_elderly_population' &&
      (task.entryContext.intent === 'VIEW_DEFINITION' || asksDefinition)) return 'DEFINITION';
    if (task.entryContext?.target.kind === 'METRIC' && task.entryContext.target.id === 'met_elderly_population') return 'ELDERLY';
    if (!this.allowsPlainTextDesignKind(task, text)) return undefined;
    if (asksDefinition && /(老年人口|60\s*岁及以上常住人口)/.test(text)) return 'DEFINITION';
    if (/(老年人口|60\s*岁及以上常住人口)/.test(text)) return 'ELDERLY';
    if (/养老床位/.test(text)) return 'BED';
    return undefined;
  }

  /**
   * Free-text figure branches stay open for tasks already inside the design
   * demo. On a fresh task they require an explicit metric intent, so find-data
   * goal statements (「我想分析闵行区养老床位供给情况…」) keep flowing to the
   * find pipeline instead of being captured as figure-01/02 queries.
   */
  private allowsPlainTextDesignKind(task: FindDataTaskState, text: string): boolean {
    if (this.isDesignTask(task)) return true;
    return METRIC_INTENT_PATTERN.test(text);
  }

  private assistantEvent(blocks: FindDataTaskState['turns'][number]['blocks'], nextStatus: FindDataTaskState['status'], source?: FindDataTaskState['turns'][number]['source']): FindDataEvent {
    return {
      type: 'ASSISTANT_TURN_RECEIVED',
      payload: { turnId: createScenarioId('assistant'), blocks, nextStatus, source }
    };
  }

  private notice(task: FindDataTaskState, operationId: string, message: string, level: 'info' | 'warning' | 'error' = 'info'): FindDataEngineResult {
    const block = { type: 'SYSTEM_NOTICE' as const, id: createScenarioId('notice'), level, message };
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent([block], task.status)],
      assistantBlocks: [block]
    };
  }

  private clarification(question: ClarificationQuestion) {
    return { type: 'CLARIFICATION' as const, id: createScenarioId('clarification'), question };
  }

  private handleElderlyTurn(task: FindDataTaskState, text: string, operationId: string): FindDataEngineResult {
    const scope = this.scopeFrom(text, task);
    if (!scope) {
      const question: ClarificationQuestion = {
        id: 'design_elderly_scope',
        question: '请补充需要查询的地区和统计时间。',
        type: 'SINGLE',
        options: [
          { id: 'pujin_2026_08', label: '浦锦街道 · 2026 年 8 月末' },
          { id: 'qibao_2026_08', label: '七宝镇 · 2026 年 8 月末' }
        ],
        submitLabel: '按此范围继续查询'
      };
      const block = this.clarification(question);
      return {
        taskId: task.taskId,
        operationId,
        events: [this.assistantEvent([{ type: 'TEXT', id: createScenarioId('text'), content: '已识别到正式指标「老年人口数」，但还缺少查询地区和统计时间。' }, block], 'NEEDS_CLARIFICATION')],
        assistantBlocks: [block]
      };
    }
    const query = this.queryState(task, 'met_elderly_population', this.elderlyDefinition());
    const snapshot = this.snapshotFor(task, query, scope, undefined, operationId);
    return this.completedResult(task, query, snapshot, operationId);
  }

  private handleDefinitionTurn(task: FindDataTaskState, operationId: string): FindDataEngineResult {
    const definition = this.elderlyDefinition();
    const detail = definition.definition;
    const content = [
      `指标「${definition.label}」当前引用版本为 ${definition.version ?? '未返回版本'}。`,
      detail?.meaning,
      detail ? `单位：${detail.unit}；范围：${detail.scope}；时间语义：${detail.timeSemantics}。` : undefined
    ].filter(Boolean).join(' ');
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent([{ type: 'TEXT', id: createScenarioId('definition'), content }], 'READY')],
      assistantBlocks: [{ type: 'TEXT', id: createScenarioId('definition'), content }]
    };
  }

  private handleBedTurn(task: FindDataTaskState, _text: string, operationId: string): FindDataEngineResult {
    const question: ClarificationQuestion = {
      id: 'design_bed_definition',
      question: '“养老床位数”有多种可见口径，请选择本次查询使用的口径。',
      type: 'SINGLE',
      options: [
        { id: 'available', label: '在营可用养老床位数' },
        { id: 'approved', label: '养老床位核定数' }
      ],
      submitLabel: '使用此口径继续查询'
    };
    const block = this.clarification(question);
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent([{ type: 'TEXT', id: createScenarioId('text'), content: '设计演示中已保留你提出的地区和时间；数值查询前需要明确床位统计口径。' }, block], 'NEEDS_CLARIFICATION')],
      assistantBlocks: [block]
    };
  }

  private submitClarification(task: FindDataTaskState, action: TaskAction, operationId: string): FindDataEngineResult {
    const questionId = action.payload?.questionId as string | undefined;
    const selected = Array.from(new Set((action.payload?.selectedOptionIds as string[] | undefined) ?? []));
    const question = task.turns.flatMap((turn) => turn.blocks).reverse().find((block): block is { type: 'CLARIFICATION'; id: string; question: ClarificationQuestion } => block.type === 'CLARIFICATION' && block.question.id === questionId);
    if (!question) {
      return this.notice(task, operationId, '请选择一个有效口径后再继续。', 'warning');
    }
    if (question.question.resolution?.status === 'STALE') {
      return this.notice(task, operationId, '当前任务条件已变化，请基于最新数据方案重新发起床位查询。', 'warning');
    }
    if (question.question.resolution?.status === 'RESOLVED' || selected.length !== 1 || !question.question.options.some((option) => option.id === selected[0])) {
      return this.notice(task, operationId, '请选择一个有效口径后再继续。', 'warning');
    }
    const isSolutionBedClarification = isSolutionBedDefinitionQuestionId(question.question.id);
    const metricId = questionId === 'design_elderly_scope' ? 'met_elderly_population' : 'design_elderly_bed_capacity';
    const definition = metricId === 'met_elderly_population'
      ? this.elderlyDefinition()
      : this.bedDefinition(selected[0] === 'r05' ? 'approved' : selected[0]);
    const requestedConditions = isSolutionBedClarification
      ? this.resolveContinuityRequestedConditions(task, this.originUserTurnTextForClarification(task, question.question.id), 'BED')
      : undefined;
    if (isSolutionBedClarification && !requestedConditions) {
      return this.notice(task, operationId, '请先明确本次要查询的浦锦街道或七宝镇。', 'warning');
    }
    const query = this.queryState(task, metricId, definition, {
      source: isSolutionBedClarification ? { kind: 'USER_EXPLICIT' } : undefined,
      requestedConditions: isSolutionBedClarification && requestedConditions
        ? { ...requestedConditions, bedDefinition: definition.label }
        : requestedConditions
    });
    const label = question.question.options.find((option) => option.id === selected[0])!.label;
    return {
      taskId: task.taskId,
      operationId,
      events: [
        {
          type: 'CLARIFICATION_RESOLVED',
          payload: {
            questionId,
            selectedOptionIds: selected,
            selectedOptionLabels: [label],
            requirementRevision: task.requirementRevision,
            resolvedAt: new Date().toISOString()
          }
        },
        { type: 'DIRECT_METRIC_QUERY_PREPARED', payload: { query } },
        this.assistantEvent([{ type: 'TEXT', id: createScenarioId('text'), content: '口径已确认；现在将按本次选择继续查询。' }], 'WAITING_USER')
      ],
      assistantBlocks: []
    };
  }

  private runMetricQuery(task: FindDataTaskState, action: TaskAction, operationId: string): FindDataEngineResult {
    const requestId = action.payload?.requestId as string | undefined;
    const query = task.directMetricQuery;
    if (!query || query.requestId !== requestId || !['READY', 'RUNNING'].includes(query.status)) {
      return this.notice(task, operationId, '当前指标请求已变化或尚未就绪，请以最新状态为准。', 'warning');
    }
    const definition = query.metricId === 'met_elderly_population' ? this.elderlyDefinition() : this.bedDefinition(query.definitionRef?.id === 'definition_design_bed_approved' ? 'approved' : 'available');
    const requestedScope = this.scopeFromRequestedConditions(query, definition);
    if (query.requestedConditions?.timeRange && !requestedScope) return this.uncoveredQuery(task, query, operationId);
    const scope = query.metricId === 'met_elderly_population'
      ? requestedScope ?? this.scopeFromSelection(task) ?? { region: '浦锦街道', time: '2026-08', value: 20000 }
      : requestedScope ?? { region: '七宝镇', time: '2026-08', value: definition.id === 'definition_design_bed_approved' ? 1000 : 800 };
    const snapshot = this.snapshotFor(task, query, scope, definition, operationId);
    return this.completedResult(task, query, snapshot, operationId);
  }

  private async runContinuityAskPlan(task: FindDataTaskState, request: AskPlanRunRequest, operationId?: string): Promise<AskRunResult> {
    const fail = (error: string): AskRunResult => ({
      operationId,
      success: false,
      executedAt: new Date().toISOString(),
      permissionSnapshot: {},
      error
    });
    const askPlan = task.askPlan;
    if (!askPlan || askPlan.id !== request.askPlanId) return fail('分析计划不存在或已变化。');
    if (!['READY_TO_RUN', 'FAILED'].includes(askPlan.status)) return fail('分析计划当前状态不允许执行。');
    if (askPlan.requirementRevision !== task.requirementRevision || request.expectedRequirementRevision !== task.requirementRevision ||
      askPlan.basedOnSearchRevision !== task.searchRevision || request.expectedSearchRevision !== task.searchRevision) {
      return fail('任务条件或数据方案版本已变化，请重新生成计算方案。');
    }
    if (!this.isCurrentContinuityPlan(task, askPlan)) return fail('计算方案输入与当前有效数据方案不一致。');
    const permission = await this.recheckPermissions(task, askPlan.coreResourceIds, 'query', operationId);
    if (permission.decision !== 'ALLOWED') {
      return { ...fail('执行时权限重检未通过，未启动计算。'), permissionSnapshot: permission.updatedPermissions };
    }
    const alignment = validateAnalyticalAlignment(task, askPlan);
    if (!alignment.allowed) {
      return {
        ...fail('分析维度、时间粒度或关系校验未通过。'),
        permissionSnapshot: permission.updatedPermissions,
        alignmentValidation: { status: alignment.status, details: alignment.details }
      };
    }
    const month = askPlan.timeRange?.start;
    if (month !== '2026-08' || askPlan.timeRange?.end !== '2026-08') return fail('设计演示数据未覆盖本次计划的时间范围。');
    const bedResourceId = askPlan.coreResourceIds.find((resourceId) => resourceId !== 'r01');
    if (bedResourceId !== 'r04' && bedResourceId !== 'r05') return fail('当前计算方案未绑定可执行的设计演示床位口径。');
    const rows = ['浦锦街道', '七宝镇'].flatMap((region) => {
      const population = this.continuityRawValue('r01', region, month);
      const beds = this.continuityRawValue(bedResourceId, region, month);
      return population !== undefined && beds !== undefined ? [{ region, population, beds, ratio: beds / population * 1000 }] : [];
    });
    if (rows.length !== 2) return fail('设计演示原始数据不完整，未生成结果。');
    const difference = rows[1].ratio - rows[0].ratio;
    const bedLabel = task.resources[bedResourceId]?.name ?? askPlan.calculationSpec.numerator;
    const resultRefId = operationId ?? createScenarioId('result');
    return {
      operationId,
      success: true,
      executedAt: new Date().toISOString(),
      dataOrigin: 'MOCK_FIXTURE',
      permissionSnapshot: permission.updatedPermissions,
      alignmentValidation: { status: 'VALIDATED', scope: 'CURRENT_ANALYSIS_ONLY', details: alignment.details },
      resultArtifact: {
        resultRef: { kind: 'RUN_RESULT', id: resultRefId },
        citations: [
          { kind: 'CALCULATION_PLAN', id: askPlan.id, label: askPlan.title },
          { kind: 'DATA_SOURCE', id: 'r01', label: task.resources.r01?.name ?? '60 岁及以上常住人口数', version: 'v1.1.0' },
          { kind: 'DATA_SOURCE', id: bedResourceId, label: bedLabel }
        ],
        content: {
          kind: 'TABLE',
          columns: [
            { id: 'region', label: '街镇', kind: 'TEXT' },
            { id: 'population', label: '60+ 常住人口', kind: 'NUMBER', unit: '人' },
            { id: 'beds', label: bedLabel, kind: 'NUMBER', unit: '张' },
            { id: 'ratio', label: '每千名老人床位数', kind: 'NUMBER', unit: '张 / 千人' }
          ],
          rows: rows.map((row) => ({
            id: row.region,
            cells: {
              region: { kind: 'TEXT', state: 'VALUE', value: row.region },
              population: { kind: 'NUMBER', state: 'VALUE', value: row.population, unit: '人', precision: 0 },
              beds: { kind: 'NUMBER', state: 'VALUE', value: row.beds, unit: '张', precision: 0 },
              ratio: { kind: 'NUMBER', state: 'VALUE', value: row.ratio, unit: '张 / 千人', precision: 1 }
            }
          })),
          chart: { kind: 'BAR', categoryColumnId: 'region', valueColumnId: 'ratio', title: askPlan.calculationSpec.metricName }
        },
        actualScope: { region: '浦锦街道、七宝镇', timeRange: { start: month, end: month }, grain: 'MONTH' },
        summary: `在当前口径下，七宝镇高于浦锦街道 ${difference.toFixed(1)} 张 / 千人。`,
        boundaryNotice: '当前结果没有机构规模、投入、利用率、建设进度或需求侧等原因证据；不能据此判断差异原因、生成预测或建设建议。'
      }
    };
  }

  private isCurrentContinuityPlan(task: FindDataTaskState, askPlan: AskPlan): boolean {
    const solution = selectEffectiveDataSolution(task);
    const [populationResourceId, bedResourceId] = askPlan.coreResourceIds;
    return Boolean(
      solution &&
      askPlan.coreResourceIds.length === 2 &&
      populationResourceId === 'r01' &&
      (bedResourceId === 'r04' || bedResourceId === 'r05') &&
      solution.items.some((item) => item.resourceId === populationResourceId && item.role === 'CORE' && item.inclusionState !== 'NOT_INCLUDED') &&
      solution.items.some((item) => item.resourceId === bedResourceId && item.role === 'CORE' && item.selectionGroupId === BED_DEFINITION_SELECTION_GROUP)
    );
  }

  private continuityRawValue(resourceId: ResourceId, region: string, month: string): number | undefined {
    return DESIGN_CONTINUITY_RAW_FIXTURE[resourceId]?.[region]?.[month];
  }

  private uncoveredQuery(task: FindDataTaskState, query: DirectMetricQueryState, operationId: string): FindDataEngineResult {
    const message = '演示数据未覆盖该月份；未重新找数，也没有编造查询结果。';
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [
      { type: 'SYSTEM_NOTICE', id: createScenarioId('notice'), level: 'warning', message },
      { type: 'ACTION_GROUP', id: createScenarioId('retry'), actions: [{ id: createScenarioId('retry_query'), label: '重试查询', actionCode: 'RUN_METRIC_QUERY', variant: 'primary' }] }
    ];
    return {
      taskId: task.taskId,
      operationId,
      events: [
        { type: 'DIRECT_METRIC_QUERY_FAILED', payload: { requestId: query.requestId, error: message } },
        this.assistantEvent(blocks, 'WAITING_USER', {
          kind: 'DIRECT_METRIC_RESULT', requirementRevision: task.requirementRevision
        })
      ],
      assistantBlocks: blocks
    };
  }

  private completedResult(task: FindDataTaskState, query: DirectMetricQueryState, snapshot: AskResultSnapshot, operationId: string): FindDataEngineResult {
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [
      { type: 'TEXT', id: createScenarioId('text'), content: '查询已完成，关键结果如下。' },
      { type: 'ASK_RESULT', id: createScenarioId('metric_result'), snapshot }
    ];
    return {
      taskId: task.taskId,
      operationId,
      events: [
        { type: 'DIRECT_METRIC_QUERY_PREPARED', payload: { query } },
        { type: 'DIRECT_METRIC_QUERY_STARTED', payload: { requestId: query.requestId } },
        { type: 'DIRECT_METRIC_RESULT_RECEIVED', payload: { snapshot } },
        this.assistantEvent(blocks, 'READY', {
          kind: 'DIRECT_METRIC_RESULT',
          requirementRevision: task.requirementRevision,
          resultExecutedAt: snapshot.executedAt
        })
      ],
      assistantBlocks: blocks
    };
  }

  /** Approved figure-05 fixture, isolated from the default Mock service. */
  private historyComparison(task: FindDataTaskState, operationId: string): FindDataEngineResult {
    const available = this.historyComparisonSnapshot(task, 'available', operationId);
    const approved = this.historyComparisonSnapshot(task, 'approved', operationId);
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [
      { type: 'TEXT', id: createScenarioId('history_text'), content: '设计演示中已保留两份独立结果。请选择其中一份查看或继续解读；这不会恢复或重新执行任何计划。' },
      { type: 'ASK_RESULT', id: 'design_history_available', snapshot: available },
      { type: 'ASK_RESULT', id: 'design_history_approved', snapshot: approved }
    ];
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent(blocks, 'READY', { kind: 'ASK_RESULT', requirementRevision: task.requirementRevision })],
      assistantBlocks: blocks,
      surfaceCommand: { action: 'NO_CHANGE' }
    };
  }

  private historyComparisonSnapshot(task: FindDataTaskState, kind: 'available' | 'approved', operationId: string): AskResultSnapshot {
    const definition = this.bedDefinition(kind);
    const rows = kind === 'available'
      ? [{ name: '浦锦街道', value: 15.0 }, { name: '七宝镇', value: 20.0 }]
      : [{ name: '浦锦街道', value: 22.5 }, { name: '七宝镇', value: 25.0 }];
    const difference = Math.abs(rows[0].value - rows[1].value);
    const label = kind === 'available' ? '在营可用床位比较' : '核定床位比较';
    return {
      binding: {
        kind: 'DIRECT_METRIC', taskId: task.taskId,
        requestId: `design_history_${kind}`,
        metricId: kind === 'available' ? 'design_bed_supply_available_compare' : 'design_bed_supply_approved_compare',
        requirementRevision: task.requirementRevision
      },
      operationId,
      executedAt: '2026-08-31T23:59:59.000Z',
      metricName: '养老床位供给比较',
      numeratorLabel: definition.label,
      formulaExplanation: '每千名老人对应床位数；仅展示这两份设计演示快照返回的比较值。',
      dataOrigin: 'MOCK_FIXTURE',
      resultArtifact: {
        resultRef: { kind: 'SERVICE_RESULT', id: `design-history-${kind}` },
        citations: [definition],
        content: {
          kind: 'TABLE',
          columns: [
            { id: 'town', label: '街镇', kind: 'TEXT' },
            { id: 'ratio', label: '每千名老人床位数', kind: 'NUMBER', unit: '张 / 千人' }
          ],
          rows: rows.map((row) => ({
            id: row.name,
            cells: {
              town: { kind: 'TEXT', state: 'VALUE', value: row.name },
              ratio: { kind: 'NUMBER', state: 'VALUE', value: row.value, unit: '张 / 千人', precision: 1 }
            }
          })),
          chart: { kind: 'BAR', categoryColumnId: 'town', valueColumnId: 'ratio', title: label }
        },
        actualScope: { region: '浦锦街道、七宝镇', timeRange: { start: '2026-08', end: '2026-08' }, grain: 'MONTH' },
        summary: `${label}：浦锦街道与七宝镇相差 ${difference.toFixed(1)} 张 / 千人。`,
        boundaryNotice: '设计演示数据，非真实业务统计。当前结果未提供机构规模、投入、床位利用或建设节奏等原因证据。'
      }
    };
  }

  private interpretResult(task: FindDataTaskState, context: TurnTargetContext, operationId: string): FindDataEngineResult {
    const selected = selectResultTargetByRef(task, { taskId: task.taskId, ...context.resultTarget! });
    if (!selected) return this.notice(task, operationId, '这份结果已无法精确定位，未使用最新结果替代。', 'warning');
    const table = selected.snapshot.resultArtifact.content?.kind === 'TABLE' ? selected.snapshot.resultArtifact.content : undefined;
    const numberColumn = table?.chart
      ? table.columns.find((column) => column.id === table.chart?.valueColumnId && column.kind === 'NUMBER')
      : table?.columns.find((column) => column.kind === 'NUMBER');
    const values = table && numberColumn ? table.rows.flatMap((row) => {
      const label = table.columns.find((column) => column.kind === 'TEXT');
      const text = label ? row.cells[label.id] : undefined;
      const value = row.cells[numberColumn.id];
      return text?.kind === 'TEXT' && text.state === 'VALUE' && value?.kind === 'NUMBER' && value.state === 'VALUE' && typeof value.value === 'number'
        ? [{ label: text.value ?? '未提供', value: value.value, unit: value.unit ?? numberColumn.unit }]
        : [];
    }) : [];
    const comparison = values.length >= 2
      ? (() => {
          const [higher, lower] = [...values].sort((left, right) => right.value - left.value);
          return `${higher.label}为 ${higher.value.toFixed(1)} ${higher.unit ?? ''}，${lower.label}为 ${lower.value.toFixed(1)} ${lower.unit ?? ''}，相差 ${Math.abs(higher.value - lower.value).toFixed(1)} ${higher.unit ?? ''}。`;
        })()
      : '这份结果未提供可用于比较的两项数值。';
    const block: FindDataTaskState['turns'][number]['blocks'][number] = {
      type: 'TEXT', id: createScenarioId('history_interpretation'),
      content: `我只解读「${selected.displayLabel}」。${comparison} 当前结果没有返回机构规模、投入、床位利用或建设节奏等原因证据，因此不能据此判断差异原因，也不能生成预测或建设建议。`
    };
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent([block], 'READY', {
        kind: 'ASK_RESULT',
        requirementRevision: selected.target.binding.requirementRevision,
        resultExecutedAt: selected.target.executedAt,
        resultTarget: selected.target
      })],
      assistantBlocks: [block],
      surfaceCommand: { action: 'NO_CHANGE' }
    };
  }

  private queryState(
    task: FindDataTaskState,
    metricId: string,
    definition: AskResultCitation,
    options?: {
      source?: DirectMetricQueryState['source'];
      requestedConditions?: DirectMetricQueryState['requestedConditions'];
    }
  ): DirectMetricQueryState {
    return {
      requestId: createScenarioId('metric_request'),
      metricId,
      source: options?.source ?? (task.entryContext
        ? { kind: 'ENTRY_CONTEXT', entryId: task.entryContext.entryId }
        : { kind: 'USER_EXPLICIT' }),
      requestedConditions: options?.requestedConditions ?? task.entryContext?.knownConditions,
      definitionRef: { id: definition.id, label: definition.label, version: definition.version },
      status: 'READY',
      preparedAt: new Date().toISOString()
    };
  }

  private createSolutionBedDefinitionQuestionId(task: FindDataTaskState): string {
    const sequence = task.turns
      .flatMap((turn) => turn.blocks)
      .filter((block) => block.type === 'CLARIFICATION' && isSolutionBedDefinitionQuestionId(block.question.id))
      .length + 1;
    return `${DESIGN_SOLUTION_BED_DEFINITION_PREFIX}_${task.requirementRevision}_${sequence}`;
  }

  private staleOpenSolutionBedClarifications(task: FindDataTaskState): FindDataEvent[] {
    const questionIds = task.turns
      .flatMap((turn) => turn.blocks)
      .filter((block): block is Extract<typeof block, { type: 'CLARIFICATION' }> =>
        block.type === 'CLARIFICATION' &&
        isSolutionBedDefinitionQuestionId(block.question.id) &&
        (block.question.resolution?.status ?? 'OPEN') === 'OPEN'
      )
      .map((block) => block.question.id);
    return questionIds.length === 0 ? [] : [{
      type: 'CLARIFICATION_STALE',
      payload: {
        questionIds,
        staleAt: new Date().toISOString(),
        reason: '当前任务需求已变化，请基于最新数据方案重新确认床位口径。'
      }
    }];
  }

  private originUserTurnTextForClarification(task: FindDataTaskState, questionId: string): string {
    const clarificationTurnIndex = task.turns.findIndex((turn) =>
      turn.sender === 'ASSISTANT' && turn.blocks.some((block) =>
        block.type === 'CLARIFICATION' && block.question.id === questionId
      )
    );
    for (let index = clarificationTurnIndex - 1; index >= 0; index -= 1) {
      const userText = task.turns[index].sender === 'USER'
        ? task.turns[index].blocks.find((block) => block.type === 'TEXT')
        : undefined;
      if (userText?.type === 'TEXT') return userText.content;
    }
    return '';
  }

  /**
   * Minimal, scenario-scoped condition resolver. It creates operation-local
   * conditions only and never mutates the task requirement or solution.
   */
  private resolveContinuityRequestedConditions(
    task: FindDataTaskState,
    text: string,
    kind: 'POPULATION' | 'BED'
  ): DirectMetricQueryState['requestedConditions'] | undefined {
    const region = text.includes('浦锦') ? '浦锦街道' : text.includes('七宝') ? '七宝镇' : undefined;
    if (!region) return undefined;
    const inheritedRange = task.requirementHypothesis.timeRange;
    const explicitMonth = text.match(/(20\d{2})\s*年?\s*(\d{1,2})\s*月/);
    const monthOnly = explicitMonth ? undefined : text.match(/(?:^|[^\d])(\d{1,2})\s*月/);
    const inheritedYear = inheritedRange?.start.match(/^(20\d{2})-/)?.[1];
    const timeRange = explicitMonth
      ? { start: `${explicitMonth[1]}-${explicitMonth[2].padStart(2, '0')}`, end: `${explicitMonth[1]}-${explicitMonth[2].padStart(2, '0')}` }
      : monthOnly && inheritedYear
      ? { start: `${inheritedYear}-${monthOnly[1].padStart(2, '0')}`, end: `${inheritedYear}-${monthOnly[1].padStart(2, '0')}` }
      : inheritedRange;
    if (!timeRange) return undefined;
    return kind === 'POPULATION'
      ? { region, timeRange, populationDefinition: task.requirementHypothesis.populationDefinition ?? '60 岁及以上常住人口' }
      : { region, timeRange, bedDefinition: task.requirementHypothesis.bedDefinition };
  }

  private scopeFromRequestedConditions(
    query: DirectMetricQueryState,
    definition?: AskResultCitation
  ): { region: string; time: string; value: number } | undefined {
    const region = query.requestedConditions?.region;
    const time = query.requestedConditions?.timeRange?.start;
    if (!region || time !== '2026-08') return undefined;
    if (query.metricId === 'met_elderly_population') {
      if (region === '浦锦街道') return { region, time, value: 20000 };
      if (region === '七宝镇') return { region, time, value: 40000 };
      return undefined;
    }
    const approved = definition?.id === 'definition_design_bed_approved';
    if (region === '浦锦街道') return { region, time, value: approved ? 450 : 300 };
    if (region === '七宝镇') return { region, time, value: approved ? 1000 : 800 };
    return undefined;
  }

  private scopeFrom(text: string, task: FindDataTaskState): { region: string; time: string; value: number } | undefined {
    const region = task.entryContext?.knownConditions?.region ?? (text.includes('浦锦') ? '浦锦街道' : text.includes('七宝') ? '七宝镇' : undefined);
    const time = task.entryContext?.knownConditions?.timeRange?.start ?? (/2026\s*年?\s*8\s*月/.test(text) ? '2026-08' : undefined);
    if (!region || time !== '2026-08') return undefined;
    if (region === '浦锦街道') return { region, time, value: 20000 };
    if (region === '七宝镇') return { region, time, value: 40000 };
    return undefined;
  }

  private scopeFromSelection(task: FindDataTaskState): { region: string; time: string; value: number } | undefined {
    const question = task.turns.flatMap((turn) => turn.blocks).find((block) => block.type === 'CLARIFICATION' && block.question.id === 'design_elderly_scope');
    const selected = question?.type === 'CLARIFICATION' ? question.question.resolution?.selectedOptionIds[0] : undefined;
    if (selected === 'qibao_2026_08') return { region: '七宝镇', time: '2026-08', value: 40000 };
    if (selected === 'pujin_2026_08') return { region: '浦锦街道', time: '2026-08', value: 20000 };
    return undefined;
  }

  private elderlyDefinition(): AskResultCitation {
    return {
      kind: 'METRIC_DEFINITION', id: 'met_elderly_population', label: '老年人口数', version: 'v1.1.0',
      definition: {
        meaning: '统计周期内在辖区内居住满半年且年龄达到或超过 60 周岁的常住人口总数。',
        unit: '人', scope: '常住人口 60 岁及以上群体', timeSemantics: '统计日期 · 月度快照', source: '设计演示定义快照'
      }
    };
  }

  private bedDefinition(option: string | undefined): AskResultCitation {
    const approved = option === 'approved';
    return {
      kind: 'METRIC_DEFINITION',
      id: approved ? 'definition_design_bed_approved' : 'definition_design_bed_available',
      label: approved ? '养老床位核定数' : '在营可用养老床位数',
      version: 'design-v1',
      definition: {
        meaning: approved ? '已核定的养老床位容量。' : '民政核定且当前在营、可实际提供服务的养老床位数。',
        unit: '张', scope: '养老服务机构床位', timeSemantics: '月末存量 · 月度快照', source: '设计演示定义快照'
      }
    };
  }

  private snapshotFor(
    task: FindDataTaskState,
    query: DirectMetricQueryState,
    scope: { region: string; time: string; value: number },
    explicitDefinition: AskResultCitation | undefined,
    operationId: string
  ): AskResultSnapshot {
    const definition = explicitDefinition ?? this.elderlyDefinition();
    const isBed = query.metricId.startsWith('design_');
    const metricName = isBed ? definition.label : '老年人口数';
    return {
      binding: { kind: 'DIRECT_METRIC', taskId: task.taskId, requestId: query.requestId, metricId: query.metricId, requirementRevision: task.requirementRevision },
      operationId,
      executedAt: new Date().toISOString(),
      metricName,
      numeratorLabel: isBed ? definition.label : '60 岁及以上常住人口',
      dataOrigin: 'MOCK_FIXTURE',
      resultArtifact: {
        resultRef: { kind: 'SERVICE_RESULT', id: `design-result-${query.requestId}` },
        citations: [definition],
        content: {
          kind: 'SCALAR',
          label: `${scope.time.replace('-', ' 年 ')} 月，${scope.region}${isBed ? definition.label : '60 岁及以上常住人口'}`,
          value: { kind: 'NUMBER', state: 'VALUE', value: scope.value, unit: isBed ? '张' : '人', precision: 0 }
        },
        actualScope: { region: scope.region, timeRange: { start: scope.time, end: scope.time }, grain: 'MONTH' },
        boundaryNotice: '设计演示数据，非真实业务统计；仅用于验证指标查询与口径澄清交互。'
      }
    };
  }
}
