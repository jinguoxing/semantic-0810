import {
  AskPlan,
  AskPlanRunRequest,
  AskRunResult,
  AvailabilityByAction,
  ConversationBlock,
  DataSolutionItem,
  FindDataResource,
  FindDataTaskState,
  PermissionRequestRef,
  ResourceId,
  TaskAction
} from '../model/FindDataTask';
import { FindDataEvent } from '../model/findDataEvents';
import { createFindDataTask } from '../model/createFindDataTask';
import { evaluateSurfacePolicy, isSurfaceActionCode, resolveInteractionIntent } from '../policy/surfacePolicy';
import { buildScenarioClassificationContext, canUpgradeGenericScenario, scenarioRegistry } from '../scenarios/scenarioRegistry';
import { createScenarioId, emptyScenarioResult } from '../scenarios/FindDataScenario';
import { selectCandidateById } from '../model/findDataSelectors';
import { selectAskHandoffReadiness, validateAnalyticalAlignment } from '../model/findDataSelectors';
import { findDataReducer } from '../model/findDataReducer';
import { getMinhangBedDefinitionForCoreResources, getMinhangBedDefinitionForResource } from '../scenarios/minhangBedDefinition';
import { FindDataEngineResult, FindDataService, FindDataTaskSummary, PermissionRecheckResult } from './FindDataService';
import { getPermissionActionLabel } from '../model/permissionActionLabels';
import { buildPermissionRequestSubmittedSummary, buildSelectionSuccessSummary } from '../presenters/conversationPresenters';
import { MINHANG_MOCK_RESULT_SCOPE } from '../fixtures/minhangBedSupplyFixture';

function assistantNotice(task: FindDataTaskState, message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info'): FindDataEngineResult {
  const block: ConversationBlock = { type: 'SYSTEM_NOTICE', id: createScenarioId('notice'), level, message };
  return {
    ...emptyScenarioResult(task.taskId),
    events: [{ type: 'ASSISTANT_TURN_RECEIVED', payload: { turnId: createScenarioId('assistant'), blocks: [block], nextStatus: task.status } }],
    assistantBlocks: [block]
  };
}

export function requireDiscoverableTaskResource(
  task: FindDataTaskState,
  resourceId: ResourceId
): FindDataResource | undefined {
  const resource = task.resources[resourceId];
  return resource?.availabilityByAction.discover === 'ALLOWED' ? resource : undefined;
}

function buildMockAskArtifact(askPlan: AskPlan): NonNullable<AskRunResult['resultArtifact']> {
  const boundaryNotice = askPlan.calculationSpec.strictConclusionBoundary;
  const bedDefinition = getMinhangBedDefinitionForCoreResources(askPlan.coreResourceIds);
  const fixture = bedDefinition.key === 'APPROVED'
    ? {
        benchmarkLabel: '全区加权平均核定床位容量',
        benchmarkValue: '31.4 张 / 千人',
        summary: '全区加权平均核定床位容量为 31.4 张 / 千人；该结果仅反映审批或设计容量。',
        totalPopulation: '41.2 万人',
        totalBeds: '12,936 张',
        belowBenchmarkCount: 0,
        townResults: [
          { townName: '浦锦街道', supplyRatio: '32.0 张 / 千人', comparisonNote: '高于全区 +1.9%' },
          { townName: '七宝镇', supplyRatio: '36.5 张 / 千人', comparisonNote: '高于全区 +16.2%' }
        ]
      }
    : {
        benchmarkLabel: '全区加权平均供给水平',
        benchmarkValue: '24.8 张 / 千人',
        summary: '全区加权平均供给水平为 24.8 张 / 千人。',
        totalPopulation: '41.2 万人',
        totalBeds: '10,218 张',
        belowBenchmarkCount: 2,
        townResults: [
          { townName: '浦锦街道', supplyRatio: '14.2 张 / 千人', comparisonNote: '低于全区 -42.7%' },
          { townName: '七宝镇', supplyRatio: '16.5 张 / 千人', comparisonNote: '低于全区 -33.5%' }
        ]
      };
  if (askPlan.calculationSpec.benchmarkRule === 'RANK_ONLY') {
    return {
      benchmarkLabel: '街镇指标排名',
      summary: bedDefinition.key === 'APPROVED' ? '离线样例已按每千名老人核定床位数从高到低排序，当前返回 2 个街镇结果。' : '离线样例已按每千名老人床位数从高到低排序，当前返回 2 个街镇结果。',
      townResults: bedDefinition.key === 'APPROVED'
        ? [{ townName: '七宝镇', supplyRatio: '36.5 张 / 千人', comparisonNote: '样例排名第 1' }, { townName: '浦锦街道', supplyRatio: '32.0 张 / 千人', comparisonNote: '样例排名第 2' }]
        : [{ townName: '七宝镇', supplyRatio: '16.5 张 / 千人', comparisonNote: '样例排名第 1' }, { townName: '浦锦街道', supplyRatio: '14.2 张 / 千人', comparisonNote: '样例排名第 2' }],
      actualScope: MINHANG_MOCK_RESULT_SCOPE,
      boundaryNotice
    };
  }
  if (askPlan.calculationSpec.benchmarkRule === 'POLICY_TARGET') {
    const benchmarkValue = askPlan.calculationSpec.benchmarkValue;
    return {
      benchmarkLabel: '政策目标比较（离线演示）',
      benchmarkValue,
      benchmarkReference: askPlan.calculationSpec.benchmarkReference,
      summary: benchmarkValue
        ? `使用分析计划中登记的离线演示政策目标 ${benchmarkValue} 完成比较。`
        : '分析计划未登记可用政策目标值，因此没有生成达标判断。',
      townResults: benchmarkValue
        ? bedDefinition.key === 'APPROVED'
          ? [{ townName: '浦锦街道', supplyRatio: '32.0 张 / 千人', comparisonNote: '高于演示目标 +6.7%' }, { townName: '七宝镇', supplyRatio: '36.5 张 / 千人', comparisonNote: '高于演示目标 +21.7%' }]
          : [{ townName: '浦锦街道', supplyRatio: '14.2 张 / 千人', comparisonNote: '低于演示目标 -52.7%' }, { townName: '七宝镇', supplyRatio: '16.5 张 / 千人', comparisonNote: '低于演示目标 -45.0%' }]
        : [],
      actualScope: MINHANG_MOCK_RESULT_SCOPE,
      boundaryNotice
    };
  }
  return {
    ...fixture,
    actualScope: MINHANG_MOCK_RESULT_SCOPE,
    boundaryNotice
  };
}

export class MockFindDataService implements FindDataService {
  private tasks = new Map<string, FindDataTaskState>();

  private persistResult(task: FindDataTaskState, result: FindDataEngineResult): FindDataEngineResult {
    this.tasks.set(task.taskId, result.events.reduce(findDataReducer, task));
    return result;
  }

  async createTask(input?: { initialQuery?: string }): Promise<FindDataTaskState> {
    const task = createFindDataTask({ taskId: createScenarioId('task'), initialQuery: input?.initialQuery });
    this.tasks.set(task.taskId, task);
    return task;
  }

  async listTasks(): Promise<FindDataTaskSummary[]> {
    return Array.from(this.tasks.values())
      .map(({ taskId, title, status, updatedAt, scenarioKey }) => ({ taskId, title, status, updatedAt, scenarioKey }))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  async getTask(taskId: string): Promise<FindDataTaskState> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('未找到该找数据任务。');
    return task;
  }

  async deleteTask(taskId: string): Promise<void> {
    this.tasks.delete(taskId);
  }

  async submitTurn(task: FindDataTaskState, text: string, operationId = createScenarioId('operation')): Promise<FindDataEngineResult> {
    this.tasks.set(task.taskId, task);
    const intent = resolveInteractionIntent(text, task);
    const surfaceCommand = evaluateSurfacePolicy(intent, undefined, task.activeSurface, task);
    const canUpgrade = canUpgradeGenericScenario(task);
    const upgradedScenario = canUpgrade
      ? scenarioRegistry.classify(buildScenarioClassificationContext(task, text))
      : undefined;
    const isUpgrade = task.scenarioKey === 'generic' && upgradedScenario !== undefined && upgradedScenario.key !== 'generic';
    const scenario = isUpgrade
      ? upgradedScenario!
      : task.scenarioKey
      ? scenarioRegistry.get(task.scenarioKey)
      : scenarioRegistry.classify(text);
    const scenarioTask = isUpgrade ? { ...task, scenarioKey: undefined } : task;
    const result = await scenario.handleTurn(scenarioTask, text, intent);
    const events: FindDataEvent[] = [];
    if (isUpgrade) {
      events.push({
        type: 'SCENARIO_RECLASSIFIED',
        payload: { fromScenarioKey: 'generic', toScenarioKey: scenario.key, reason: '补充信息已满足场景识别条件。' }
      });
    } else if (!task.scenarioKey) {
      events.push({ type: 'SCENARIO_CLASSIFIED', payload: { scenarioKey: scenario.key } });
    }
    events.push(...result.events);
    return this.persistResult(task, { ...result, taskId: task.taskId, operationId, events, surfaceCommand });
  }

  async executeAction(task: FindDataTaskState, action: TaskAction, operationId = createScenarioId('operation')): Promise<FindDataEngineResult> {
    this.tasks.set(task.taskId, task);
    const surfaceCommand = evaluateSurfacePolicy(
      resolveInteractionIntent('', task), action.actionCode, task.activeSurface, task, action.payload
    );

    if (isSurfaceActionCode(action.actionCode)) {
      return this.persistResult(task, { ...emptyScenarioResult(task.taskId), operationId, surfaceCommand });
    }

    if (action.actionCode === 'SELECT_RESOURCE') {
      const resourceId = action.payload?.resourceId as string;
      const candidate = selectCandidateById(task, resourceId);
      if (!requireDiscoverableTaskResource(task, resourceId) || !candidate) {
        return this.persistResult(task, { ...assistantNotice(task, '当前资源不属于本任务可发现范围，无法执行该操作。', 'warning'), operationId });
      }
      const existing = task.dataSolution.items.find((item) => item.resourceId === resourceId);
      const item: DataSolutionItem = existing ?? {
        resourceId,
        role: candidate.proposedRole ?? 'OPTIONAL_DRILLDOWN',
        inclusionState: 'SELECTED',
        coverage: [candidate.reason],
        limitations: [],
        evidenceRefs: ['用户确认纳入当前方案'],
        selectionGroupId: ['r02', 'r03'].includes(resourceId) ? 'population_detail_alternative' : undefined
      };
      const stateEvents: FindDataEvent[] = [
        ...(existing ? [] : [{ type: 'SOLUTION_ITEM_UPSERTED' as const, payload: { item } }]),
        { type: 'RESOURCE_SELECTED', payload: { resourceId } }
      ];
      const nextTask = stateEvents.reduce(findDataReducer, task);
      const block: ConversationBlock = {
        type: 'TEXT',
        id: createScenarioId('text'),
        content: buildSelectionSuccessSummary(nextTask, resourceId)
      };
      return this.persistResult(task, {
        ...emptyScenarioResult(task.taskId),
        operationId,
        events: [
          ...stateEvents,
          { type: 'ASSISTANT_TURN_RECEIVED', payload: { turnId: createScenarioId('assistant'), blocks: [block], nextStatus: 'READY', source: {
            kind: 'SOLUTION', requirementRevision: nextTask.requirementRevision, searchRevision: nextTask.searchRevision
          } } }
        ],
        assistantBlocks: [block],
        surfaceCommand: task.activeSurface.type === 'COMPARE' ? { action: 'CLOSE', surface: 'CLOSED' } : surfaceCommand
      });
    }

    if (action.actionCode === 'EVALUATE_AND_ADD') {
      const resourceId = action.payload?.resourceId as string;
      const resource = requireDiscoverableTaskResource(task, resourceId);
      const candidate = selectCandidateById(task, resourceId);
      if (!resource || !candidate) {
        return this.persistResult(task, { ...assistantNotice(task, '当前资源不属于本任务可发现范围，无法执行该操作。', 'warning'), operationId });
      }
      const requestedBedDefinition = getMinhangBedDefinitionForResource(resourceId);
      const currentBedDefinition = task.dataSolution.items
        .filter((item) => item.role === 'CORE' && item.inclusionState !== 'NOT_INCLUDED')
        .map((item) => getMinhangBedDefinitionForResource(item.resourceId))
        .find((definition) => definition !== undefined);
      const shouldRecomposeBedDefinition = requestedBedDefinition !== undefined && currentBedDefinition !== undefined &&
        requestedBedDefinition.key !== currentBedDefinition.key && task.scenarioKey === 'minhang_bed_supply';
      if (shouldRecomposeBedDefinition) {
        const scenario = scenarioRegistry.get('minhang_bed_supply');
        const recomposed = await scenario.handleAction(task, {
          actionCode: 'REVISE_REQUIREMENT',
          payload: { hypothesisPatch: { bedDefinition: requestedBedDefinition.hypothesisValue } }
        });
        return this.persistResult(task, { ...recomposed, taskId: task.taskId, operationId, surfaceCommand });
      }
      const item: DataSolutionItem = {
        resourceId,
        role: candidate.proposedRole ?? (resourceId === 'r07' ? 'PARTIAL_MATCH' : 'OPTIONAL_DRILLDOWN'),
        inclusionState: resourceId === 'r07' ? 'NOT_INCLUDED' : 'RECOMMENDED',
        coverage: [resource.desc],
        limitations: [resource.roleNote ?? '需进一步确认分析口径'],
        evidenceRefs: ['用户在相关资源中主动关联']
      };
      const stateEvents: FindDataEvent[] = [{ type: 'SOLUTION_ITEM_UPSERTED', payload: { item } }];
      const nextTask = stateEvents.reduce(findDataReducer, task);
      const block: ConversationBlock = {
        type: 'TEXT', id: createScenarioId('text'), content: buildSelectionSuccessSummary(nextTask, resourceId)
      };
      return this.persistResult(task, {
        ...emptyScenarioResult(task.taskId),
        operationId,
        events: [
          ...stateEvents,
          { type: 'ASSISTANT_TURN_RECEIVED', payload: { turnId: createScenarioId('assistant'), blocks: [block], nextStatus: 'READY', source: {
            kind: 'SOLUTION', requirementRevision: nextTask.requirementRevision, searchRevision: nextTask.searchRevision
          } } }
        ],
        assistantBlocks: [block],
        surfaceCommand
      });
    }

    if (action.actionCode === 'CREATE_PERMISSION_REQUEST') {
      const rawIds = action.payload?.resourceIds;
      const requestedIds = Array.isArray(rawIds) ? Array.from(new Set(rawIds.filter((id): id is string => typeof id === 'string'))) : [];
      const rawActionType = action.payload?.actionType;
      if (rawActionType !== undefined && !['query', 'preview', 'export', 'viewMetadata'].includes(String(rawActionType))) {
        return this.persistResult(task, { ...assistantNotice(task, '当前权限动作不受支持。', 'warning'), operationId });
      }
      const actionType = (rawActionType as PermissionRequestRef['actionType'] | undefined) ?? 'query';
      const actionLabel = getPermissionActionLabel(actionType);
      if (requestedIds.length === 0) return this.persistResult(task, { ...assistantNotice(task, '当前资源不属于本任务可申请范围。', 'warning'), operationId });
      const invalid = requestedIds.some((id) => {
        const resource = requireDiscoverableTaskResource(task, id);
        const belongsToTask = !!selectCandidateById(task, id) || task.dataSolution.items.some((item) => item.resourceId === id);
        return !resource || !belongsToTask;
      });
      if (invalid) return this.persistResult(task, { ...assistantNotice(task, '当前资源不属于本任务可申请范围。', 'warning'), operationId });
      const decisions = requestedIds.map((id) => task.resources[id].availabilityByAction[actionType]);
      if (decisions.some((decision) => decision === 'ALLOWED')) {
        return this.persistResult(task, { ...assistantNotice(task, `该资源当前已经具备${actionLabel}，无需重复申请。`, 'info'), operationId });
      }
      if (decisions.some((decision) => decision === 'DENIED')) {
        return this.persistResult(task, { ...assistantNotice(task, `当前策略不支持申请该项${actionLabel}。`, 'warning'), operationId });
      }
      if (decisions.some((decision) => decision === 'UNKNOWN')) {
        return this.persistResult(task, { ...assistantNotice(task, `当前${actionLabel}状态尚未确认，请稍后重试或联系管理员。`, 'warning'), operationId });
      }
      const overlappingIds = requestedIds.filter((id) => Object.values(task.permissionRequests).some((request) =>
        request.status === 'SUBMITTED' && request.actionType === actionType && request.resourceIds.includes(id)
      ));
      if (overlappingIds.length > 0) {
        const names = overlappingIds.map((id) => task.resources[id]?.name).filter((name): name is string => !!name);
        const resourceNames = names.length > 0 ? names.join('、') : '当前资源';
        const notice: ConversationBlock = {
          type: 'SYSTEM_NOTICE', id: createScenarioId('notice'), level: 'warning', message: `${resourceNames}已有进行中的${actionLabel}申请，本次包含的其他资源尚未提交。请移除重复项后重试。`
        };
        return this.persistResult(task, {
          ...emptyScenarioResult(task.taskId),
          operationId,
          events: [
            { type: 'ASSISTANT_TURN_RECEIVED', payload: { turnId: createScenarioId('assistant'), blocks: [notice], nextStatus: task.status } }
          ],
          assistantBlocks: [notice],
          surfaceCommand
        });
      }
      const request: PermissionRequestRef = {
        requestId: createScenarioId('request'),
        resourceIds: requestedIds,
        actionType,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString()
      };
      const nextTask = [{ type: 'PERMISSION_REQUEST_CREATED' as const, payload: { request } }].reduce(findDataReducer, task);
      const notice: ConversationBlock = {
        type: 'TEXT', id: createScenarioId('notice'), content: buildPermissionRequestSubmittedSummary(nextTask, request)
      };
      return this.persistResult(task, {
        ...emptyScenarioResult(task.taskId),
        operationId,
        events: [
          { type: 'PERMISSION_REQUEST_CREATED', payload: { request } },
          { type: 'ASSISTANT_TURN_RECEIVED', payload: { turnId: createScenarioId('assistant'), blocks: [notice], nextStatus: task.status, source: {
            kind: 'PERMISSION', requirementRevision: nextTask.requirementRevision, searchRevision: nextTask.searchRevision
          } } }
        ],
        assistantBlocks: [notice],
        surfaceCommand
      });
    }

    if (action.actionCode === 'KEEP_AS_GAP') {
      return this.persistResult(task, {
        ...emptyScenarioResult(task.taskId),
        operationId,
        events: [{ type: 'SOLUTION_GAP_UPSERTED', payload: { gap: {
          id: createScenarioId('gap'), title: '已保留的当前检索缺口', description: '当前资源覆盖不足，本轮不强行纳入分析。',
          impactLevel: 'LOW', mitigation: '在分析边界中明确披露。', status: 'ACKNOWLEDGED'
        } } }],
        surfaceCommand
      });
    }

    const scenario = scenarioRegistry.get(task.scenarioKey ?? 'generic');
    const result = await scenario.handleAction(task, action);
    return this.persistResult(task, { ...result, taskId: task.taskId, operationId, surfaceCommand });
  }

  async recheckPermissions(
    task: FindDataTaskState,
    resourceIds: ResourceId[],
    action: 'query' | 'preview' | 'export',
    operationId?: string
  ): Promise<PermissionRecheckResult> {
    if (resourceIds.length === 0) {
      return { operationId, decision: 'BLOCKED', updatedPermissions: {}, details: '当前方案尚未形成可执行核心资源。' };
    }
    const updatedPermissions: Record<ResourceId, AvailabilityByAction> = {};
    for (const id of resourceIds) {
      const resource = requireDiscoverableTaskResource(task, id);
      if (!resource) {
        return { operationId, decision: 'BLOCKED', updatedPermissions, details: '核心资源不存在或不在任务可发现范围。' };
      }
      updatedPermissions[id] = { ...resource.availabilityByAction };
    }

    const baseline = task.askPlan?.permissionBaseline;
    const changed = resourceIds.some((id) => baseline?.[id] !== undefined && baseline[id] !== updatedPermissions[id][action]);
    if (changed) {
      return {
        operationId, decision: 'CHANGED', updatedPermissions,
        details: '部分核心资源的查询权限自分析计划生成后发生变化，请先确认新的可执行范围。'
      };
    }
    const blocked = resourceIds.some((id) => updatedPermissions[id][action] !== 'ALLOWED');
    return {
      operationId, decision: blocked ? 'BLOCKED' : 'ALLOWED',
      updatedPermissions,
      details: blocked ? '至少一项核心资源不允许执行当前操作。' : '所有核心资源权限重检通过。'
    };
  }

  async runAskPlan(task: FindDataTaskState, request: AskPlanRunRequest, operationId?: string): Promise<AskRunResult> {
    const fail = (error: string, permissionSnapshot: Record<ResourceId, AvailabilityByAction> = {}): AskRunResult => ({
      operationId, success: false, executedAt: new Date().toISOString(), permissionSnapshot, error
    });
    const askPlan = task.askPlan;
    if (!askPlan || askPlan.id !== request.askPlanId) return fail('分析计划不存在。');
    if (!['READY_TO_RUN', 'COMPLETED', 'FAILED'].includes(askPlan.status)) return fail('分析计划当前状态不允许执行。');
    if (askPlan.permissionCheckState !== 'ALLOWED') return fail('分析计划尚未通过权限校验。');
    if (askPlan.requirementRevision !== task.requirementRevision || request.expectedRequirementRevision !== task.requirementRevision) return fail('需求已变更，请重新生成分析计划。');
    if (askPlan.basedOnSearchRevision !== task.searchRevision || request.expectedSearchRevision !== task.searchRevision) return fail('检索结果已变更，请重新生成分析计划。');
    const readiness = selectAskHandoffReadiness(task);
    if (!readiness.ready) return fail(readiness.message);
    if (
      askPlan.calculationSpec.benchmarkRule === 'POLICY_TARGET' &&
      (!askPlan.calculationSpec.benchmarkValue || !askPlan.calculationSpec.benchmarkReference)
    ) {
      return fail('政策目标模式缺少已登记的目标值或来源，未启动分析。');
    }

    const authoritativeCheck = await this.recheckPermissions(task, askPlan.coreResourceIds, 'query');
    if (authoritativeCheck.decision !== 'ALLOWED') {
      return fail('执行时权限重检未通过，未启动分析。', authoritativeCheck.updatedPermissions);
    }
    const alignment = validateAnalyticalAlignment(task, askPlan);
    if (!alignment.allowed) return { ...fail('分析维度、时间粒度或关系校验未通过。', authoritativeCheck.updatedPermissions), alignmentValidation: { status: alignment.status, details: alignment.details } };

    return {
      success: true,
      executedAt: new Date().toISOString(),
      operationId,
      dataOrigin: 'MOCK_FIXTURE',
      permissionSnapshot: authoritativeCheck.updatedPermissions,
      resultArtifact: buildMockAskArtifact(askPlan),
      alignmentValidation: { status: 'VALIDATED', scope: 'CURRENT_ANALYSIS_ONLY', details: alignment.details }
    };
  }
}

export const defaultFindDataService = new MockFindDataService();
