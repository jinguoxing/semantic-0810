import { FindDataTaskState, ResourceId, SurfaceState, SurfaceType, TaskActionCode } from '../model/FindDataTask';
import { selectAskHandoffReadiness } from '../model/findDataSelectors';

export interface InteractionIntentResult {
  kind: 'QUESTION' | 'OPEN_SURFACE' | 'TASK_ACTION' | 'RESOURCE_BROWSE' | 'ANALYZE' | 'CLARIFICATION_RESPONSE';
  surface?: SurfaceType;
  explicit: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedRule?: string;
}

export type InteractionIntent = InteractionIntentResult;

export interface SurfaceCommand {
  action: 'NO_CHANGE' | 'OPEN' | 'REPLACE' | 'CLOSE';
  surface?: SurfaceType;
  mode?: 'QUICK_PREVIEW' | 'WORKBENCH';
  resourceIds?: ResourceId[];
  openedBy?: 'USER_EXPLICIT' | 'ACTION_CLICK' | 'TASK_REQUIRED';
  blockedReason?: string;
}

const surfaceActionCodes: ReadonlySet<TaskActionCode> = new Set([
  'OPEN_COMPARE', 'OPEN_FIELDS', 'OPEN_SOLUTION', 'OPEN_ACCESS',
  'OPEN_RELATED_RESOURCES', 'OPEN_ASK_PLAN', 'CLOSE_SURFACE'
]);

export function isSurfaceActionCode(actionCode: TaskActionCode): boolean {
  return surfaceActionCodes.has(actionCode);
}

function result(
  kind: InteractionIntentResult['kind'],
  explicit: boolean,
  confidence: InteractionIntentResult['confidence'],
  matchedRule?: string,
  surface?: SurfaceType
): InteractionIntentResult {
  return { kind, explicit, confidence, matchedRule, surface };
}

export function resolveInteractionIntent(text: string, _task: FindDataTaskState): InteractionIntentResult {
  const normalized = text.trim();
  if (/(这两个资源有什么不同|这两张表有什么区别)/.test(normalized)) {
    return result('QUESTION', false, 'HIGH', 'compare-summary-question');
  }
  if (/(比较这两张表|对比这两个资源|看看这两个候选有什么区别|展开两个资源比较|帮我比较一下它们)/.test(normalized)) {
    return result('OPEN_SURFACE', true, 'HIGH', 'open-compare', 'COMPARE');
  }
  if (/(我先看看民政相关资源|看看还有哪些相关数据|浏览与当前目标相关的数据|民政下面还有哪些表|打开相关资源|浏览民政数据|还有哪些养老资源|查看养老相关数据)/.test(normalized)) {
    return result('RESOURCE_BROWSE', true, 'HIGH', 'browse-related-resources', 'RELATED_RESOURCES');
  }
  if (/(计算各街镇每千名老人养老床位数|按当前方案分析|找出供给水平相对偏低的街镇|根据当前数据做分析|生成养老床位供给比较结果)/.test(normalized)) {
    return result('ANALYZE', true, 'HIGH', 'analyze-current-solution');
  }
  if (/(打开完整字段列表|查看全部字段|展开字段详情|在右侧打开这张表的字段)/.test(normalized)) {
    return result('OPEN_SURFACE', true, 'HIGH', 'open-fields', 'FIELDS');
  }
  if (/(这个表有哪些字段|它有多少字段|为什么推荐它|它适合当前分析吗|当前还缺什么)/.test(normalized)) {
    return result('QUESTION', false, 'HIGH', 'state-derived-question');
  }
  return result('QUESTION', false, 'LOW', 'default-question');
}

function openSurface(currentSurface: SurfaceState | undefined, surface: SurfaceType, openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK', resourceIds?: ResourceId[]): SurfaceCommand {
  return {
    action: !currentSurface || currentSurface.type === 'CLOSED' ? 'OPEN' : 'REPLACE',
    surface,
    mode: surface === 'COMPARE' ? 'QUICK_PREVIEW' : 'WORKBENCH',
    openedBy,
    resourceIds
  };
}

function fieldsCommand(task: FindDataTaskState | undefined, currentSurface: SurfaceState | undefined, openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK', resourceId?: ResourceId): SurfaceCommand {
  const targetId = resourceId ?? task?.activeResourceId;
  const resource = targetId ? task?.resources[targetId] : undefined;
  if (!targetId || resource?.availabilityByAction.discover !== 'ALLOWED') {
    return { action: 'NO_CHANGE', blockedReason: '当前还没有选定资源，请先从候选结果中选择一个资源。' };
  }
  if (resource.availabilityByAction.viewMetadata !== 'ALLOWED') {
    const message = resource.availabilityByAction.viewMetadata === 'REQUESTABLE'
      ? '当前资源的字段元数据需要申请查看权限。'
      : resource.availabilityByAction.viewMetadata === 'DENIED'
      ? '当前没有权限查看该资源的字段元数据。'
      : '当前资源的元数据权限状态尚未确认。';
    return { action: 'NO_CHANGE', blockedReason: message };
  }
  return openSurface(currentSurface, 'FIELDS', openedBy, [targetId]);
}

function compareCommand(task: FindDataTaskState | undefined, currentSurface: SurfaceState | undefined, openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK', resourceIds?: ResourceId[]): SurfaceCommand {
  const ids = resourceIds ?? task?.comparisonModel?.resourceIds ?? [];
  const validIds = ids.filter((id) => task?.resources[id]?.availabilityByAction.discover === 'ALLOWED');
  if (validIds.length < 2) {
    return { action: 'NO_CHANGE', blockedReason: '当前还没有形成明确的可比候选组。' };
  }
  return openSurface(currentSurface, 'COMPARE', openedBy, validIds);
}

function solutionCommand(task: FindDataTaskState | undefined, currentSurface: SurfaceState | undefined, openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK'): SurfaceCommand {
  if (!task || (task.dataSolution.items.length === 0 && task.dataSolution.gaps.length === 0)) {
    return { action: 'NO_CHANGE', blockedReason: '当前任务尚未生成有效的数据方案。' };
  }
  return openSurface(currentSurface, 'SOLUTION', openedBy);
}

function askPlanCommand(task: FindDataTaskState | undefined, currentSurface: SurfaceState | undefined, openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK'): SurfaceCommand {
  if (!task?.askPlan) return { action: 'NO_CHANGE', blockedReason: '当前尚未形成可执行的分析计划。' };
  const readiness = selectAskHandoffReadiness(task);
  if (!readiness.ready) return { action: 'NO_CHANGE', blockedReason: readiness.message };
  return openSurface(currentSurface, 'ASK_PLAN', openedBy);
}

export function evaluateSurfacePolicy(intent: InteractionIntentResult, actionCode?: TaskActionCode, currentSurface?: SurfaceState, task?: FindDataTaskState, actionPayload?: Record<string, unknown>): SurfaceCommand {
  if (actionCode) {
    switch (actionCode) {
      case 'OPEN_FIELDS': return fieldsCommand(task, currentSurface, 'ACTION_CLICK', actionPayload?.resourceId as ResourceId | undefined);
      case 'OPEN_COMPARE': return compareCommand(task, currentSurface, 'ACTION_CLICK', actionPayload?.resourceIds as ResourceId[] | undefined);
      case 'OPEN_SOLUTION': return solutionCommand(task, currentSurface, 'ACTION_CLICK');
      case 'OPEN_ASK_PLAN': return askPlanCommand(task, currentSurface, 'ACTION_CLICK');
      case 'OPEN_ACCESS': return openSurface(currentSurface, 'ACCESS', 'ACTION_CLICK');
      case 'OPEN_RELATED_RESOURCES': return openSurface(currentSurface, 'RELATED_RESOURCES', 'ACTION_CLICK');
      case 'CLOSE_SURFACE': return { action: 'CLOSE', surface: 'CLOSED' };
      default: return { action: 'NO_CHANGE' };
    }
  }
  if (intent.kind === 'RESOURCE_BROWSE') return openSurface(currentSurface, 'RELATED_RESOURCES', 'USER_EXPLICIT');
  if (intent.kind !== 'OPEN_SURFACE' || !intent.surface) return { action: 'NO_CHANGE' };
  if (intent.surface === 'FIELDS') return fieldsCommand(task, currentSurface, 'USER_EXPLICIT');
  if (intent.surface === 'COMPARE') return compareCommand(task, currentSurface, 'USER_EXPLICIT');
  if (intent.surface === 'SOLUTION') return solutionCommand(task, currentSurface, 'USER_EXPLICIT');
  if (intent.surface === 'ASK_PLAN') return askPlanCommand(task, currentSurface, 'USER_EXPLICIT');
  return openSurface(currentSurface, intent.surface, 'USER_EXPLICIT');
}
