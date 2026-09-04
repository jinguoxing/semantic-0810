import { FindDataTaskState, ResourceId, SurfaceState, SurfaceType, TaskActionCode } from '../model/FindDataTask';

export type InteractionIntent =
  | 'QUESTION'
  | 'OPEN_SURFACE'
  | 'TASK_ACTION'
  | 'RESOURCE_BROWSE'
  | 'ANALYZE'
  | 'CLARIFICATION_RESPONSE';

export interface SurfaceCommand {
  action: 'NO_CHANGE' | 'OPEN' | 'REPLACE' | 'CLOSE';
  surface?: SurfaceType;
  mode?: 'QUICK_PREVIEW' | 'WORKBENCH';
  resourceIds?: ResourceId[];
  openedBy?: 'USER_EXPLICIT' | 'ACTION_CLICK' | 'TASK_REQUIRED';
  blockedReason?: string;
}

const surfaceActionCodes: ReadonlySet<TaskActionCode> = new Set([
  'OPEN_COMPARE',
  'OPEN_FIELDS',
  'OPEN_SOLUTION',
  'OPEN_ACCESS',
  'OPEN_RELATED_RESOURCES',
  'OPEN_ASK_PLAN',
  'CLOSE_SURFACE'
]);

export function isSurfaceActionCode(actionCode: TaskActionCode): boolean {
  return surfaceActionCodes.has(actionCode);
}

export function determineInteractionIntent(text: string): InteractionIntent {
  const normalized = text.trim();
  return /^(打开|展开|进入|切到|切换到|显示|跳到|查看完整|查看全部)/.test(normalized)
    ? 'OPEN_SURFACE'
    : 'QUESTION';
}

function openSurface(
  currentSurface: SurfaceState | undefined,
  surface: SurfaceType,
  openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK',
  resourceIds?: ResourceId[]
): SurfaceCommand {
  return {
    action: !currentSurface || currentSurface.type === 'CLOSED' ? 'OPEN' : 'REPLACE',
    surface,
    mode: surface === 'COMPARE' ? 'QUICK_PREVIEW' : 'WORKBENCH',
    openedBy,
    resourceIds
  };
}

function fieldsCommand(
  task: FindDataTaskState | undefined,
  currentSurface: SurfaceState | undefined,
  openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK',
  resourceId?: ResourceId
): SurfaceCommand {
  const targetId = resourceId ?? task?.activeResourceId;
  if (!targetId || task?.resources[targetId]?.availabilityByAction.discover !== 'ALLOWED') {
    return { action: 'NO_CHANGE', blockedReason: '当前还没有选定资源，请先从候选结果中选择一个资源。' };
  }
  return openSurface(currentSurface, 'FIELDS', openedBy, [targetId]);
}

function compareCommand(
  task: FindDataTaskState | undefined,
  currentSurface: SurfaceState | undefined,
  openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK',
  resourceIds?: ResourceId[]
): SurfaceCommand {
  const ids = resourceIds ?? task?.comparisonModel?.resourceIds ?? [];
  const validIds = ids.filter((id) => task?.resources[id]?.availabilityByAction.discover === 'ALLOWED');
  if (validIds.length < 2) {
    return { action: 'NO_CHANGE', blockedReason: '当前至少需要 2 项已明确选定的可比资源才能展开对比。' };
  }
  return openSurface(currentSurface, 'COMPARE', openedBy, validIds);
}

function solutionCommand(task: FindDataTaskState | undefined, currentSurface: SurfaceState | undefined, openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK') {
  if (!task || (task.dataSolution.items.length === 0 && task.dataSolution.gaps.length === 0)) {
    return { action: 'NO_CHANGE', blockedReason: '当前任务尚未生成有效的数据方案。' } satisfies SurfaceCommand;
  }
  return openSurface(currentSurface, 'SOLUTION', openedBy);
}

function askPlanCommand(task: FindDataTaskState | undefined, currentSurface: SurfaceState | undefined, openedBy: 'USER_EXPLICIT' | 'ACTION_CLICK') {
  if (!task?.askPlan) return { action: 'NO_CHANGE', blockedReason: '当前尚未形成可执行的分析计划。' } satisfies SurfaceCommand;
  return openSurface(currentSurface, 'ASK_PLAN', openedBy);
}

export function evaluateSurfacePolicy(
  intent: InteractionIntent,
  actionCode?: TaskActionCode,
  currentSurface?: SurfaceState,
  task?: FindDataTaskState,
  text?: string,
  actionPayload?: Record<string, unknown>
): SurfaceCommand {
  if (actionCode) {
    switch (actionCode) {
      case 'OPEN_FIELDS':
        return fieldsCommand(task, currentSurface, 'ACTION_CLICK', actionPayload?.resourceId as ResourceId | undefined);
      case 'OPEN_COMPARE':
        return compareCommand(task, currentSurface, 'ACTION_CLICK', actionPayload?.resourceIds as ResourceId[] | undefined);
      case 'OPEN_SOLUTION':
        return solutionCommand(task, currentSurface, 'ACTION_CLICK');
      case 'OPEN_ASK_PLAN':
        return askPlanCommand(task, currentSurface, 'ACTION_CLICK');
      case 'OPEN_ACCESS':
        return openSurface(currentSurface, 'ACCESS', 'ACTION_CLICK');
      case 'OPEN_RELATED_RESOURCES':
        return openSurface(currentSurface, 'RELATED_RESOURCES', 'ACTION_CLICK');
      case 'CLOSE_SURFACE':
        return { action: 'CLOSE', surface: 'CLOSED' };
      default:
        return { action: 'NO_CHANGE' };
    }
  }

  if (intent !== 'OPEN_SURFACE' || !text) return { action: 'NO_CHANGE' };
  const normalized = text.toLowerCase();
  if (normalized.includes('字段')) return fieldsCommand(task, currentSurface, 'USER_EXPLICIT');
  if (normalized.includes('比较') || normalized.includes('对比')) return compareCommand(task, currentSurface, 'USER_EXPLICIT');
  if (normalized.includes('方案')) return solutionCommand(task, currentSurface, 'USER_EXPLICIT');
  if (normalized.includes('权限')) return openSurface(currentSurface, 'ACCESS', 'USER_EXPLICIT');
  if (normalized.includes('相关资源') || normalized.includes('目录')) return openSurface(currentSurface, 'RELATED_RESOURCES', 'USER_EXPLICIT');
  if (normalized.includes('计划') || normalized.includes('完整结果')) return askPlanCommand(task, currentSurface, 'USER_EXPLICIT');
  return { action: 'NO_CHANGE' };
}
