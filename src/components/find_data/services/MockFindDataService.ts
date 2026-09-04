import {
  AskPlan,
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
import { determineInteractionIntent, evaluateSurfacePolicy, isSurfaceActionCode } from '../policy/surfacePolicy';
import { scenarioRegistry } from '../scenarios/scenarioRegistry';
import { createScenarioId, emptyScenarioResult } from '../scenarios/FindDataScenario';
import { FindDataEngineResult, FindDataService, PermissionRecheckResult } from './FindDataService';

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
  if (askPlan.calculationSpec.benchmarkRule === 'RANK_ONLY') {
    return {
      benchmarkLabel: '街镇指标排名',
      summary: '离线样例已按每千名老人床位数从高到低排序，当前返回 2 个街镇结果。',
      townResults: [
        { townName: '七宝镇', supplyRatio: '16.5 张 / 千人', comparisonNote: '样例排名第 1' },
        { townName: '浦锦街道', supplyRatio: '14.2 张 / 千人', comparisonNote: '样例排名第 2' }
      ],
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
        ? [
            { townName: '浦锦街道', supplyRatio: '14.2 张 / 千人', comparisonNote: '低于演示目标 -52.7%' },
            { townName: '七宝镇', supplyRatio: '16.5 张 / 千人', comparisonNote: '低于演示目标 -45.0%' }
          ]
        : [],
      boundaryNotice
    };
  }
  return {
    benchmarkLabel: '全区加权平均供给水平',
    benchmarkValue: '24.8 张 / 千人',
    summary: '全区加权平均供给水平为 24.8 张 / 千人。',
    totalPopulation: '41.2 万人',
    totalBeds: '10,218 张',
    townResults: [
      { townName: '浦锦街道', supplyRatio: '14.2 张 / 千人', comparisonNote: '低于全区 -42.7%' },
      { townName: '七宝镇', supplyRatio: '16.5 张 / 千人', comparisonNote: '低于全区 -33.5%' }
    ],
    boundaryNotice
  };
}

export class MockFindDataService implements FindDataService {
  async createTask(input?: { initialQuery?: string }): Promise<FindDataTaskState> {
    return createFindDataTask({ taskId: createScenarioId('task'), initialQuery: input?.initialQuery });
  }

  async submitTurn(task: FindDataTaskState, text: string): Promise<FindDataEngineResult> {
    const intent = determineInteractionIntent(text);
    const surfaceCommand = evaluateSurfacePolicy(intent, undefined, task.activeSurface, task, text);
    const scenario = task.scenarioKey ? scenarioRegistry.get(task.scenarioKey) : scenarioRegistry.classify(text);
    const result = await scenario.handleTurn(task, text, intent);
    const events: FindDataEvent[] = [];
    if (!task.scenarioKey) {
      events.push({ type: 'SCENARIO_CLASSIFIED', payload: { scenarioKey: scenario.key } });
    }
    events.push(...result.events);
    return { ...result, taskId: task.taskId, events, surfaceCommand };
  }

  async executeAction(task: FindDataTaskState, action: TaskAction): Promise<FindDataEngineResult> {
    const surfaceCommand = evaluateSurfacePolicy(
      'TASK_ACTION', action.actionCode, task.activeSurface, task, undefined, action.payload
    );

    if (isSurfaceActionCode(action.actionCode)) {
      return { ...emptyScenarioResult(task.taskId), surfaceCommand };
    }

    if (action.actionCode === 'SELECT_RESOURCE') {
      const resourceId = action.payload?.resourceId as string;
      if (!requireDiscoverableTaskResource(task, resourceId)) {
        return assistantNotice(task, '当前资源不属于本任务可发现范围，无法执行该操作。', 'warning');
      }
      return {
        ...emptyScenarioResult(task.taskId),
        events: [{ type: 'RESOURCE_SELECTED', payload: { resourceId } }],
        surfaceCommand: task.activeSurface.type === 'COMPARE' ? { action: 'CLOSE', surface: 'CLOSED' } : surfaceCommand
      };
    }

    if (action.actionCode === 'EVALUATE_AND_ADD') {
      const resourceId = action.payload?.resourceId as string;
      const resource = requireDiscoverableTaskResource(task, resourceId);
      if (!resource) {
        return assistantNotice(task, '当前资源不属于本任务可发现范围，无法执行该操作。', 'warning');
      }
      const item: DataSolutionItem = {
        resourceId,
        role: resourceId === 'r07' ? 'PARTIAL_MATCH' : 'OPTIONAL_DRILLDOWN',
        inclusionState: resourceId === 'r07' ? 'NOT_INCLUDED' : 'RECOMMENDED',
        coverage: [resource.desc],
        limitations: [resource.roleNote ?? '需进一步确认分析口径'],
        evidenceRefs: ['用户在相关资源中主动关联']
      };
      const block: ConversationBlock = {
        type: 'TEXT', id: createScenarioId('text'), content: `已将「${resource.name}」加入当前数据方案。`
      };
      return {
        ...emptyScenarioResult(task.taskId),
        events: [
          { type: 'SOLUTION_ITEM_UPSERTED', payload: { item } },
          { type: 'ASSISTANT_TURN_RECEIVED', payload: { turnId: createScenarioId('assistant'), blocks: [block], nextStatus: 'READY' } }
        ],
        assistantBlocks: [block],
        surfaceCommand
      };
    }

    if (action.actionCode === 'CREATE_PERMISSION_REQUEST') {
      const requestedIds = (action.payload?.resourceIds as string[] ?? []).filter((id) => !!requireDiscoverableTaskResource(task, id));
      if (requestedIds.length === 0) return assistantNotice(task, '当前没有可提交申请的任务资源。', 'warning');
      const request: PermissionRequestRef = {
        requestId: createScenarioId('request'),
        resourceIds: requestedIds,
        actionType: (action.payload?.actionType as PermissionRequestRef['actionType']) ?? 'query',
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString()
      };
      return { ...emptyScenarioResult(task.taskId), events: [{ type: 'PERMISSION_REQUEST_CREATED', payload: { request } }], surfaceCommand };
    }

    if (action.actionCode === 'KEEP_AS_GAP') {
      return {
        ...emptyScenarioResult(task.taskId),
        events: [{ type: 'SOLUTION_GAP_UPSERTED', payload: { gap: {
          id: createScenarioId('gap'), title: '已保留的当前检索缺口', description: '当前资源覆盖不足，本轮不强行纳入分析。',
          impactLevel: 'LOW', mitigation: '在分析边界中明确披露。', status: 'ACKNOWLEDGED'
        } } }],
        surfaceCommand
      };
    }

    const scenario = scenarioRegistry.get(task.scenarioKey ?? 'generic');
    const result = await scenario.handleAction(task, action);
    return { ...result, taskId: task.taskId, surfaceCommand };
  }

  async recheckPermissions(
    task: FindDataTaskState,
    resourceIds: ResourceId[],
    action: 'query' | 'preview' | 'export'
  ): Promise<PermissionRecheckResult> {
    const updatedPermissions: Record<ResourceId, AvailabilityByAction> = {};
    for (const id of resourceIds) {
      const resource = requireDiscoverableTaskResource(task, id);
      if (!resource) {
        return { decision: 'BLOCKED', updatedPermissions, details: '核心资源不存在或不在任务可发现范围。' };
      }
      updatedPermissions[id] = { ...resource.availabilityByAction };
    }

    const baseline = task.askPlan?.permissionBaseline;
    const changed = resourceIds.some((id) => baseline?.[id] !== undefined && baseline[id] !== updatedPermissions[id][action]);
    if (changed) {
      return {
        decision: 'CHANGED', updatedPermissions,
        details: '部分核心资源的查询权限自分析计划生成后发生变化，请先确认新的可执行范围。'
      };
    }
    const blocked = resourceIds.some((id) => updatedPermissions[id][action] !== 'ALLOWED');
    return {
      decision: blocked ? 'BLOCKED' : 'ALLOWED',
      updatedPermissions,
      details: blocked ? '至少一项核心资源不允许执行当前操作。' : '所有核心资源权限重检通过。'
    };
  }

  async runAskPlan(task: FindDataTaskState, askPlan: AskPlan): Promise<AskRunResult> {
    const fail = (error: string, permissionSnapshot: Record<ResourceId, AvailabilityByAction> = {}): AskRunResult => ({
      success: false, executedAt: new Date().toISOString(), permissionSnapshot, error
    });
    if (!task.askPlan || task.askPlan.id !== askPlan.id) return fail('分析计划不存在。');
    if (!['READY_TO_RUN', 'COMPLETED', 'FAILED'].includes(askPlan.status)) return fail('分析计划当前状态不允许执行。');
    if (askPlan.permissionCheckState !== 'ALLOWED') return fail('分析计划尚未通过权限校验。');
    if (askPlan.requirementRevision !== task.requirementRevision) return fail('需求已变更，请重新生成分析计划。');
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

    return {
      success: true,
      executedAt: new Date().toISOString(),
      dataOrigin: 'MOCK_FIXTURE',
      permissionSnapshot: authoritativeCheck.updatedPermissions,
      resultArtifact: buildMockAskArtifact(askPlan)
    };
  }
}

export const defaultFindDataService = new MockFindDataService();
