import { FindDataTaskState, ConversationTurn } from './FindDataTask';
import { FindDataEvent } from './findDataEvents';

export const initialFindDataTaskState: FindDataTaskState = {
  taskId: '',
  title: '新建找数据任务',
  status: 'IDLE',
  scenarioKey: 'generic',
  requirementHypothesis: {
    dimensions: [],
    analysisFocus: [],
    assumptions: [],
    unresolvedQuestions: []
  },
  searchScope: {
    domains: [],
    includeCrossDepartment: true
  },
  turns: [],
  resources: {},
  dataSolution: {
    items: [],
    gaps: [],
    relationshipEvidence: [],
    coverageSummary: [],
    limitationSummary: [],
    updatedAt: new Date().toISOString()
  },
  searchResult: {
    totalMatches: 0,
    candidateIds: [],
    returnedCount: 0,
    query: ''
  },
  permissionRequests: {},
  activeResourceId: undefined,
  activeSurface: {
    type: 'CLOSED',
    mode: 'QUICK_PREVIEW'
  },
  requirementRevision: 0,
  searchRevision: 0,
  runtimeStatus: {
    active: false,
    message: ''
  },
  askPlan: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export function findDataReducer(
  state: FindDataTaskState,
  action: FindDataEvent
): FindDataTaskState {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'TASK_CREATED':
    case 'TASK_HYDRATED': {
      return {
        ...action.payload.task,
        updatedAt: now
      };
    }

    case 'USER_TURN_SUBMITTED': {
      const userTurn: ConversationTurn = {
        turnId: action.payload.turnId,
        sender: 'USER',
        createdAt: now,
        blocks: [
          {
            type: 'TEXT',
            id: `text_${action.payload.turnId}`,
            content: action.payload.text
          }
        ]
      };

      return {
        ...state,
        status: 'UNDERSTANDING',
        runtimeStatus: {
          active: true,
          message: '正在理解当前问题…'
        },
        turns: [...state.turns, userTurn],
        updatedAt: now
      };
    }

    case 'ASSISTANT_TURN_RECEIVED': {
      const assistantTurn: ConversationTurn = {
        turnId: action.payload.turnId,
        sender: 'ASSISTANT',
        createdAt: now,
        blocks: action.payload.blocks
      };

      // Turn off runtime status when assistant responds
      return {
        ...state,
        status: 'READY',
        runtimeStatus: undefined,
        turns: [...state.turns, assistantTurn],
        updatedAt: now
      };
    }

    case 'REQUIREMENT_UPDATED': {
      const newRequirementRevision =
        action.payload.bumpRevision !== false
          ? state.requirementRevision + 1
          : state.requirementRevision;

      return {
        ...state,
        requirementHypothesis: {
          ...state.requirementHypothesis,
          ...action.payload.hypothesis
        },
        requirementRevision: newRequirementRevision,
        // When requirement updates, old search results might need re-evaluation
        status: 'UNDERSTANDING',
        updatedAt: now
      };
    }

    case 'SEARCH_STARTED': {
      return {
        ...state,
        status: 'SEARCHING',
        searchRevision: action.payload.searchRevision,
        searchScope: {
          ...state.searchScope,
          domains: action.payload.scope?.domains || state.searchScope.domains,
          expandedDomains: action.payload.scope?.expandedDomains || state.searchScope.expandedDomains
        },
        runtimeStatus: {
          active: true,
          message: action.payload.statusMessage || '正在检索匹配的数据资产与指标…'
        },
        updatedAt: now
      };
    }

    case 'SEARCH_RESULTS_RECEIVED': {
      // Revision guard: do NOT overwrite if older revision arrives late!
      if (
        action.payload.requirementRevision !== state.requirementRevision ||
        action.payload.searchRevision !== state.searchRevision
      ) {
        // Ignored due to revision mismatch
        return state;
      }

      // Upsert resources if provided (discover !== 'DENIED')
      const updatedResources = { ...state.resources };
      if (action.payload.resourceUpserts) {
        for (const res of action.payload.resourceUpserts) {
          if (res.availabilityByAction?.discover !== 'DENIED') {
            updatedResources[res.id] = res;
          }
        }
      }

      // Merge solution items
      const existingItemsMap = new Map(state.dataSolution.items.map((i) => [i.resourceId, i]));
      for (const newItem of action.payload.solutionItems) {
        existingItemsMap.set(newItem.resourceId, newItem);
      }

      const mergedGaps = action.payload.gaps
        ? [...state.dataSolution.gaps.filter((g) => !action.payload.gaps?.some((ng) => ng.id === g.id)), ...action.payload.gaps]
        : state.dataSolution.gaps;

      return {
        ...state,
        status: 'READY',
        runtimeStatus: undefined,
        resources: updatedResources,
        searchResult: {
          query: action.payload.query ?? state.searchResult?.query ?? '',
          totalMatches: action.payload.totalMatches ?? action.payload.discoveredResourceIds.length,
          candidateIds: action.payload.discoveredResourceIds,
          candidateSnapshot: action.payload.candidateSnapshot,
          returnedCount: action.payload.discoveredResourceIds.length
        },
        dataSolution: {
          ...state.dataSolution,
          items: Array.from(existingItemsMap.values()),
          gaps: mergedGaps,
          updatedAt: now
        },
        updatedAt: now
      };
    }

    case 'PERMISSION_REQUEST_CREATED': {
      const { request } = action.payload;
      return {
        ...state,
        permissionRequests: {
          ...state.permissionRequests,
          [request.requestId]: request
        },
        updatedAt: now
      };
    }

    case 'RESOURCE_SELECTED': {
      const selectedId = action.payload.resourceId;
      // Update inclusionState for this item if present
      const updatedItems = state.dataSolution.items.map((item) => {
        if (item.resourceId === selectedId) {
          return {
            ...item,
            inclusionState: 'SELECTED' as const
          };
        }
        return item;
      });

      return {
        ...state,
        activeResourceId: selectedId,
        dataSolution: {
          ...state.dataSolution,
          items: updatedItems,
          updatedAt: now
        },
        updatedAt: now
      };
    }

    case 'SOLUTION_ITEM_UPSERTED': {
      const { item } = action.payload;
      const index = state.dataSolution.items.findIndex((i) => i.resourceId === item.resourceId);
      const newItems = [...state.dataSolution.items];
      if (index >= 0) {
        newItems[index] = item;
      } else {
        newItems.push(item);
      }

      return {
        ...state,
        dataSolution: {
          ...state.dataSolution,
          items: newItems,
          updatedAt: now
        },
        updatedAt: now
      };
    }

    case 'SOLUTION_GAP_UPSERTED': {
      const { gap } = action.payload;
      const index = state.dataSolution.gaps.findIndex((g) => g.id === gap.id);
      const newGaps = [...state.dataSolution.gaps];
      if (index >= 0) {
        newGaps[index] = gap;
      } else {
        newGaps.push(gap);
      }

      return {
        ...state,
        dataSolution: {
          ...state.dataSolution,
          gaps: newGaps,
          updatedAt: now
        },
        updatedAt: now
      };
    }

    case 'SURFACE_OPENED': {
      return {
        ...state,
        activeSurface: action.payload,
        updatedAt: now
      };
    }

    case 'SURFACE_CLOSED': {
      return {
        ...state,
        activeSurface: {
          type: 'CLOSED'
        },
        updatedAt: now
      };
    }

    case 'PERMISSION_RECHECK_STARTED': {
      if (!state.askPlan) return state;
      return {
        ...state,
        askPlan: {
          ...state.askPlan,
          permissionCheckState: 'CHECKING'
        },
        updatedAt: now
      };
    }

    case 'PERMISSION_RECHECK_COMPLETED': {
      if (!state.askPlan) return state;

      // Update resources permissions if changed
      const updatedResources = { ...state.resources };
      for (const [resId, perms] of Object.entries(action.payload.updatedPermissions)) {
        if (updatedResources[resId]) {
          updatedResources[resId] = {
            ...updatedResources[resId],
            availabilityByAction: perms
          };
        }
      }

      return {
        ...state,
        resources: updatedResources,
        askPlan: {
          ...state.askPlan,
          permissionCheckState: action.payload.decision
        },
        updatedAt: now
      };
    }

    case 'ASK_PLAN_PREPARED': {
      return {
        ...state,
        status: 'PREPARING_ASK',
        askPlan: action.payload.askPlan,
        updatedAt: now
      };
    }

    case 'ASK_RUN_STARTED': {
      if (!state.askPlan) return state;
      return {
        ...state,
        askPlan: {
          ...state.askPlan,
          status: 'RUNNING'
        },
        runtimeStatus: {
          active: true,
          message: '正在执行 Ask Data 分析计划…'
        },
        updatedAt: now
      };
    }

    case 'ASK_RUN_COMPLETED': {
      if (!state.askPlan) return state;
      return {
        ...state,
        runtimeStatus: undefined,
        askPlan: {
          ...state.askPlan,
          status: 'COMPLETED',
          lastRunResult: action.payload.result
        },
        updatedAt: now
      };
    }

    case 'ASK_RUN_FAILED': {
      if (!state.askPlan) return state;
      return {
        ...state,
        runtimeStatus: undefined,
        askPlan: {
          ...state.askPlan,
          status: 'FAILED',
          lastRunResult: {
            success: false,
            executedAt: now,
            permissionSnapshot: {},
            error: action.payload.error
          }
        },
        updatedAt: now
      };
    }

    default:
      return state;
  }
}
