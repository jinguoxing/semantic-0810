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
  // e.g. "打开完整字段列表", "查看全部字段", "打开资源比较", "展开这两张表比较", "打开当前数据方案", "查看权限差异", "进入民政数据目录", "打开分析计划"
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
  // e.g. "这个表有哪些字段？", "这个资源适合当前分析吗？", "为什么推荐它？", "当前缺什么？", "它能覆盖过去 12 个月吗？"
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

  // Default to general question
  return 'QUESTION';
}

/**
 * Central Surface Policy Engine:
 * Dictates whether and which surface should be opened, preserved, or closed.
 */
export function evaluateSurfacePolicy(
  intent: InteractionIntent,
  actionCode?: string,
  currentSurface?: SurfaceState,
  task?: FindDataTaskState,
  text?: string
): SurfaceCommand {
  const activeSurfaceType = currentSurface?.type || 'CLOSED';

  // 1. Handle Typed Action Codes (from button clicks)
  if (actionCode) {
    switch (actionCode) {
      case 'OPEN_COMPARE':
        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'COMPARE',
          openedBy: 'ACTION_CLICK',
          resourceIds: ['r02', 'r03']
        };

      case 'OPEN_FIELDS': {
        const targetResId = task?.activeResourceId || 'r03';
        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'FIELDS',
          openedBy: 'ACTION_CLICK',
          resourceIds: [targetResId]
        };
      }

      case 'OPEN_SOLUTION':
        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'SOLUTION',
          openedBy: 'ACTION_CLICK'
        };

      case 'OPEN_ACCESS':
        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'ACCESS',
          openedBy: 'ACTION_CLICK'
        };

      case 'OPEN_CATALOG':
        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'CATALOG',
          openedBy: 'ACTION_CLICK'
        };

      case 'PREPARE_ASK_PLAN':
      case 'OPEN_ASK_PLAN':
        return {
          action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
          surface: 'ASK_PLAN',
          openedBy: 'ACTION_CLICK'
        };

      case 'KEEP_AS_GAP':
        // Rule: KEEP_AS_GAP only updates DataSolution.gaps.
        // It MUST NOT automatically open SOLUTION surface!
        return {
          action: 'NO_CHANGE'
        };

      case 'SELECT_RESOURCE':
      case 'EXPAND_SCOPE':
      case 'KEEP_MINIMAL_PLAN':
        // Functional state changes that don't forcefully open new surfaces unless requested
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
      const targetResId = task?.activeResourceId || 'r03';
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'FIELDS',
        openedBy: 'USER_EXPLICIT',
        resourceIds: [targetResId]
      };
    }

    if (norm.includes('比较') || norm.includes('对比')) {
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'COMPARE',
        openedBy: 'USER_EXPLICIT',
        resourceIds: ['r02', 'r03']
      };
    }

    if (norm.includes('方案')) {
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'SOLUTION',
        openedBy: 'USER_EXPLICIT'
      };
    }

    if (norm.includes('权限')) {
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'ACCESS',
        openedBy: 'USER_EXPLICIT'
      };
    }

    if (norm.includes('目录') || norm.includes('民政')) {
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'CATALOG',
        openedBy: 'USER_EXPLICIT'
      };
    }

    if (norm.includes('计划') || norm.includes('计算') || norm.includes('分析')) {
      return {
        action: activeSurfaceType === 'CLOSED' ? 'OPEN' : 'REPLACE',
        surface: 'ASK_PLAN',
        openedBy: 'USER_EXPLICIT'
      };
    }
  }

  return {
    action: 'NO_CHANGE'
  };
}
