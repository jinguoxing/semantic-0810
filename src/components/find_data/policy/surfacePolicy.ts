import { SurfaceState, SurfaceType, FindDataTaskState, ResourceId } from '../model/FindDataTask';

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

/**
 * Distinguishes whether the user is asking an informational question
 * vs. explicitly demanding to open/operate a surface view.
 */
export function determineInteractionIntent(
  text: string,
  _currentSurface?: SurfaceState,
  _task?: FindDataTaskState
): InteractionIntent {
  const normalized = text.trim();

  // Explicit surface opening directives:
  const isOpenExplicitDirective =
    /^(打开|展开|进入|切到|切换到|显示|跳到)/.test(normalized) ||
    normalized.includes('打开完整字段列表') ||
    normalized.includes('查看全部字段') ||
    normalized.includes('展开这两张表比较') ||
    normalized.includes('展开比较') ||
    normalized.includes('打开当前数据方案') ||
    normalized.includes('查看权限差异') ||
    normalized.includes('进入民政数据目录') ||
    normalized.includes('打开分析计划');

  if (isOpenExplicitDirective) {
    return 'OPEN_SURFACE';
  }

  // Pure informational questions:
  const isQuestion =
    /\?|？$/.test(normalized) ||
    normalized.includes('有哪些') ||
    normalized.includes('有什么') ||
    normalized.includes('为什么') ||
    normalized.includes('适合') ||
    normalized.includes('缺什么') ||
    normalized.includes('能不能') ||
    normalized.includes('是否') ||
    normalized.includes('覆盖过去');

  if (isQuestion) {
    return 'QUESTION';
  }

  return 'QUESTION';
}

/**
 * Central Surface Policy Engine:
 * P0-05: Enforces strict credibility checks without blind fallbacks.
 */
export function evaluateSurfacePolicy(
  intent: InteractionIntent,
  actionCode?: string,
  currentSurface?: SurfaceState,
  task?: FindDataTaskState,
  text?: string,
  actionPayload?: Record<string, unknown>
): SurfaceCommand {
  const activeSurfaceType = currentSurface?.type || 'CLOSED';

  // 1. Handle Typed Action Codes (from button clicks)
  if (actionCode) {
    switch (actionCode) {
      case 'OPEN_COMPARE': {
        const candidateIds =
          (actionPayload?.resourceIds as ResourceId[]) ||
          task?.comparisonModel?.resourceIds ||
          (task?.activeSurface?.type === 'COMPARE' ? task?.activeSurface?.resourceIds : undefined) ||
          [];

        if (candidateIds.length < 2) {
          // If task has at least 2 discoverable resources, we can compare them
          const discoverableIds = Object.keys(task?.resources || {}).filter(
            (id) => task?.resources[id]?.availabilityByAction.discover !== 'DENIED'
          );
          if (discoverableIds.length < 2) {
            return {
              action: 'NO_CHANGE',
              blockedReason: '当前至少需要 2 项可比数据资源才能展开对比视图。'
            };
          }
        }

        const idsToCompare = candidateIds.length >= 2 ? candidateIds : Object.keys(task?.resources || {}).slice(0, 2);

        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'COMPARE',
          mode: 'QUICK_PREVIEW',
          openedBy: 'ACTION_CLICK',
          resourceIds: idsToCompare
        };
      }

      case 'OPEN_FIELDS': {
        const targetResId =
          (actionPayload?.resourceId as ResourceId) ||
          task?.activeResourceId ||
          (task && Object.keys(task.resources).length > 0 ? Object.keys(task.resources)[0] : undefined);

        if (!targetResId || !task?.resources[targetResId]) {
          return {
            action: 'NO_CHANGE',
            blockedReason: '请先从当前结果中选择一个资源。'
          };
        }

        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'FIELDS',
          mode: 'WORKBENCH',
          openedBy: 'ACTION_CLICK',
          resourceIds: [targetResId]
        };
      }

      case 'OPEN_SOLUTION': {
        const hasItems = (task?.dataSolution.items.length || 0) > 0;
        const hasGaps = (task?.dataSolution.gaps.length || 0) > 0;
        if (!hasItems && !hasGaps) {
          return {
            action: 'NO_CHANGE',
            blockedReason: '当前任务尚未生成有效的数据方案。'
          };
        }

        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'SOLUTION',
          mode: 'WORKBENCH',
          openedBy: 'ACTION_CLICK'
        };
      }

      case 'OPEN_ACCESS':
        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'ACCESS',
          mode: 'WORKBENCH',
          openedBy: 'ACTION_CLICK'
        };

      case 'OPEN_CATALOG':
        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'CATALOG',
          mode: 'WORKBENCH',
          openedBy: 'ACTION_CLICK'
        };

      case 'PREPARE_ASK_PLAN':
      case 'OPEN_ASK_PLAN': {
        if (!task?.askPlan) {
          return {
            action: 'NO_CHANGE',
            blockedReason: '当前尚未形成可执行的分析计划。'
          };
        }
        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'ASK_PLAN',
          mode: 'WORKBENCH',
          openedBy: 'ACTION_CLICK'
        };
      }

      case 'KEEP_AS_GAP':
        return {
          action: 'NO_CHANGE'
        };

      case 'SELECT_RESOURCE':
      case 'EXPAND_SCOPE':
      case 'KEEP_MINIMAL_PLAN':
      case 'EVALUATE_AND_ADD':
      case 'SUBMIT_CLARIFICATION':
      case 'CREATE_PERMISSION_REQUEST':
        return {
          action: 'NO_CHANGE'
        };

      case 'CLOSE_SURFACE':
        return {
          action: 'CLOSE',
          surface: 'CLOSED'
        };

      default:
        return {
          action: 'NO_CHANGE'
        };
    }
  }

  // 2. Questions: do NOT change current surface
  if (intent === 'QUESTION') {
    return {
      action: 'NO_CHANGE'
    };
  }

  // 3. User Explicit Directives (OPEN_SURFACE)
  if (intent === 'OPEN_SURFACE' && text) {
    const norm = text.toLowerCase();

    if (norm.includes('字段')) {
      const targetResId =
        task?.activeResourceId ||
        (task && Object.keys(task.resources).length > 0 ? Object.keys(task.resources)[0] : undefined);
      if (!targetResId || !task?.resources[targetResId]) {
        return {
          action: 'NO_CHANGE',
          blockedReason: '请先从当前结果中选择一个资源。'
        };
      }
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'FIELDS',
        mode: 'WORKBENCH',
        openedBy: 'USER_EXPLICIT',
        resourceIds: [targetResId]
      };
    }

    if (norm.includes('比较') || norm.includes('对比')) {
      const candidateIds =
        task?.comparisonModel?.resourceIds ||
        Object.keys(task?.resources || {}).slice(0, 2);
      if (candidateIds.length < 2) {
        return {
          action: 'NO_CHANGE',
          blockedReason: '当前至少需要 2 项可比数据资源才能展开对比视图。'
        };
      }
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'COMPARE',
        mode: 'QUICK_PREVIEW',
        openedBy: 'USER_EXPLICIT',
        resourceIds: candidateIds
      };
    }

    if (norm.includes('方案')) {
      const hasItems = (task?.dataSolution.items.length || 0) > 0;
      const hasGaps = (task?.dataSolution.gaps.length || 0) > 0;
      if (!hasItems && !hasGaps) {
        return {
          action: 'NO_CHANGE',
          blockedReason: '当前任务尚未生成有效的数据方案。'
        };
      }
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'SOLUTION',
        mode: 'WORKBENCH',
        openedBy: 'USER_EXPLICIT'
      };
    }

    if (norm.includes('权限')) {
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'ACCESS',
        mode: 'WORKBENCH',
        openedBy: 'USER_EXPLICIT'
      };
    }

    if (norm.includes('目录') || norm.includes('民政')) {
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'CATALOG',
        mode: 'WORKBENCH',
        openedBy: 'USER_EXPLICIT'
      };
    }

    if (norm.includes('计划') || norm.includes('计算') || norm.includes('分析')) {
      if (!task?.askPlan) {
        return {
          action: 'NO_CHANGE',
          blockedReason: '当前尚未形成可执行的分析计划。'
        };
      }
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'ASK_PLAN',
        mode: 'WORKBENCH',
        openedBy: 'USER_EXPLICIT'
      };
    }
  }

  return {
    action: 'NO_CHANGE'
  };
}
