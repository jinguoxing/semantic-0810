import { ConversationTurn, DataSolutionItem, FindDataTaskState } from './FindDataTask';
import { createFindDataTask } from './createFindDataTask';
import { FindDataEvent } from './findDataEvents';

const nowIso = () => new Date().toISOString();

export const initialFindDataTaskState: FindDataTaskState = createFindDataTask({ taskId: '' });

function upsertItems(existing: DataSolutionItem[], incoming: DataSolutionItem[]) {
  const items = new Map(existing.map((item) => [item.resourceId, item]));
  for (const item of incoming) items.set(item.resourceId, item);
  return Array.from(items.values());
}

export function findDataReducer(state: FindDataTaskState, action: FindDataEvent): FindDataTaskState {
  const now = nowIso();

  switch (action.type) {
    case 'TASK_CREATED':
    case 'TASK_HYDRATED':
      return { ...action.payload.task, updatedAt: now };

    case 'TASK_TITLE_UPDATED':
      return { ...state, title: action.payload.title, goal: action.payload.goal ?? state.goal, updatedAt: now };

    case 'SCENARIO_CLASSIFIED':
      return { ...state, scenarioKey: action.payload.scenarioKey, updatedAt: now };

    case 'COMPARISON_MODEL_SET':
      return { ...state, comparisonModel: action.payload.comparisonModel, updatedAt: now };

    case 'USER_TURN_SUBMITTED': {
      const turn: ConversationTurn = {
        turnId: action.payload.turnId,
        sender: 'USER',
        createdAt: now,
        blocks: [{ type: 'TEXT', id: `text_${action.payload.turnId}`, content: action.payload.text }]
      };
      return {
        ...state,
        title: state.turns.length === 0 && state.title === '新建找数据任务'
          ? (action.payload.text.length > 24 ? `${action.payload.text.slice(0, 24)}...` : action.payload.text)
          : state.title,
        goal: state.turns.length === 0 && !state.goal ? action.payload.text : state.goal,
        status: 'UNDERSTANDING',
        runtimeStatus: { active: true, message: '正在理解当前问题…' },
        turns: [...state.turns, turn],
        updatedAt: now
      };
    }

    case 'ASSISTANT_TURN_RECEIVED': {
      const turn: ConversationTurn = {
        turnId: action.payload.turnId,
        sender: 'ASSISTANT',
        createdAt: now,
        blocks: action.payload.blocks
      };
      return {
        ...state,
        status: action.payload.nextStatus ?? state.status,
        runtimeStatus: undefined,
        turns: [...state.turns, turn],
        updatedAt: now
      };
    }

    case 'REQUIREMENT_UPDATED': {
      const requirementRevision = action.payload.bumpRevision === false
        ? state.requirementRevision
        : state.requirementRevision + 1;
      return {
        ...state,
        requirementHypothesis: { ...state.requirementHypothesis, ...action.payload.hypothesis },
        requirementRevision,
        status: 'UNDERSTANDING',
        updatedAt: now
      };
    }

    case 'CLARIFICATION_RESOLVED': {
      const resolveQuestion = (question: FindDataTaskState['requirementHypothesis']['unresolvedQuestions'][number]) =>
        question.id !== action.payload.questionId ? question : {
          ...question,
          resolution: {
            status: 'RESOLVED' as const,
            selectedOptionIds: action.payload.selectedOptionIds,
            resolvedAt: action.payload.resolvedAt,
            resolvedAtRequirementRevision: action.payload.requirementRevision
          }
        };
      return {
        ...state,
        turns: state.turns.map((turn) => ({
          ...turn,
          blocks: turn.blocks.map((block) => block.type === 'CLARIFICATION'
            ? { ...block, question: resolveQuestion(block.question) }
            : block)
        })),
        requirementHypothesis: {
          ...state.requirementHypothesis,
          unresolvedQuestions: state.requirementHypothesis.unresolvedQuestions.map(resolveQuestion)
        },
        updatedAt: now
      };
    }

    case 'SEARCH_STARTED':
      return {
        ...state,
        status: 'SEARCHING',
        searchRevision: action.payload.searchRevision,
        searchScope: {
          ...state.searchScope,
          domains: action.payload.scope?.domains ?? state.searchScope.domains,
          expandedDomains: action.payload.scope?.expandedDomains ?? state.searchScope.expandedDomains
        },
        runtimeStatus: { active: true, message: action.payload.statusMessage ?? '正在检索匹配的数据资产与指标…' },
        updatedAt: now
      };

    case 'SEARCH_RESULTS_RECEIVED': {
      const payload = action.payload;
      if (
        payload.taskId !== state.taskId ||
        payload.requirementRevision !== state.requirementRevision ||
        payload.searchRevision !== state.searchRevision
      ) return state;

      const removed = new Set([
        ...payload.candidateDelta.removedIds,
        ...(payload.solutionPatch.removeResourceIds ?? [])
      ]);
      const resources = { ...state.resources };
      for (const id of removed) delete resources[id];
      for (const resource of payload.resourceUpserts ?? []) {
        if (resource.availabilityByAction.discover === 'ALLOWED') resources[resource.id] = resource;
      }

      const baseItems = payload.solutionPatch.mode === 'REPLACE' ? [] : state.dataSolution.items;
      const items = upsertItems(
        baseItems.filter((item) => !removed.has(item.resourceId)),
        payload.solutionPatch.upsertItems.filter((item) => resources[item.resourceId]?.availabilityByAction.discover === 'ALLOWED')
      );
      const activeResourceRemoved = !!state.activeResourceId && removed.has(state.activeResourceId);
      const surfaceResourceRemoved = (state.activeSurface.resourceIds ?? []).some((id) => removed.has(id));

      return {
        ...state,
        status: 'READY',
        runtimeStatus: undefined,
        resources,
        searchResult: {
          query: payload.query ?? state.searchResult?.query ?? '',
          totalMatches: payload.totalMatches ?? payload.candidateDelta.allCandidateIds.length,
          candidateIds: payload.candidateDelta.allCandidateIds,
          candidateSnapshot: payload.candidateSnapshot,
          returnedCount: payload.candidateDelta.allCandidateIds.length
        },
        dataSolution: {
          items,
          gaps: payload.solutionPatch.gaps ?? (payload.solutionPatch.mode === 'REPLACE' ? [] : state.dataSolution.gaps),
          relationshipEvidence: payload.solutionPatch.relationshipEvidence ?? (payload.solutionPatch.mode === 'REPLACE' ? [] : state.dataSolution.relationshipEvidence),
          coverageSummary: payload.solutionPatch.coverageSummary ?? (payload.solutionPatch.mode === 'REPLACE' ? [] : state.dataSolution.coverageSummary),
          limitationSummary: payload.solutionPatch.limitationSummary ?? (payload.solutionPatch.mode === 'REPLACE' ? [] : state.dataSolution.limitationSummary),
          updatedAt: now
        },
        activeResourceId: activeResourceRemoved ? undefined : state.activeResourceId,
        activeSurface: surfaceResourceRemoved ? { type: 'CLOSED' } : state.activeSurface,
        updatedAt: now
      };
    }

    case 'RESOURCE_SELECTED': {
      const selectedItem = state.dataSolution.items.find((item) => item.resourceId === action.payload.resourceId);
      const group = selectedItem?.selectionGroupId;
      const items = state.dataSolution.items.map((item) => {
        if (item.resourceId === action.payload.resourceId) return { ...item, inclusionState: 'SELECTED' as const };
        if (group && item.selectionGroupId === group) return { ...item, inclusionState: 'NOT_INCLUDED' as const };
        return item;
      });
      return {
        ...state,
        activeResourceId: action.payload.resourceId,
        dataSolution: { ...state.dataSolution, items, updatedAt: now },
        updatedAt: now
      };
    }

    case 'SOLUTION_ITEM_UPSERTED':
      return {
        ...state,
        dataSolution: { ...state.dataSolution, items: upsertItems(state.dataSolution.items, [action.payload.item]), updatedAt: now },
        updatedAt: now
      };

    case 'SOLUTION_GAP_UPSERTED': {
      const gaps = [...state.dataSolution.gaps];
      const index = gaps.findIndex((gap) => gap.id === action.payload.gap.id);
      if (index >= 0) gaps[index] = action.payload.gap;
      else gaps.push(action.payload.gap);
      return { ...state, dataSolution: { ...state.dataSolution, gaps, updatedAt: now }, updatedAt: now };
    }

    case 'PERMISSION_REQUEST_CREATED':
      return {
        ...state,
        permissionRequests: { ...state.permissionRequests, [action.payload.request.requestId]: action.payload.request },
        updatedAt: now
      };

    case 'SURFACE_OPENED':
      return { ...state, activeSurface: action.payload, updatedAt: now };

    case 'SURFACE_CLOSED':
      return { ...state, activeSurface: { type: 'CLOSED' }, updatedAt: now };

    case 'PERMISSION_RECHECK_STARTED':
      return !state.askPlan ? state : {
        ...state,
        askPlan: { ...state.askPlan, permissionCheckState: 'CHECKING' },
        updatedAt: now
      };

    case 'PERMISSION_RECHECK_COMPLETED': {
      if (!state.askPlan) return state;
      const resources = { ...state.resources };
      for (const [resourceId, availability] of Object.entries(action.payload.updatedPermissions)) {
        if (resources[resourceId]) resources[resourceId] = { ...resources[resourceId], availabilityByAction: availability };
      }
      return {
        ...state,
        resources,
        askPlan: {
          ...state.askPlan,
          permissionCheckState: action.payload.decision,
          permissionCheckedAt: now,
          permissionRevision: (state.askPlan.permissionRevision ?? 0) + 1
        },
        updatedAt: now
      };
    }

    case 'ASK_PLAN_PREPARED': {
      const permissionBaseline = action.payload.askPlan.permissionBaseline ?? Object.fromEntries(
        action.payload.askPlan.coreResourceIds.map((id) => [id, state.resources[id]?.availabilityByAction.query ?? 'UNKNOWN'])
      );
      return {
        ...state,
        status: 'WAITING_USER',
        askPlan: {
          ...action.payload.askPlan,
          status: 'READY_TO_RUN',
          permissionBaseline,
          requirementRevision: action.payload.askPlan.requirementRevision ?? state.requirementRevision,
          timeRange: action.payload.askPlan.timeRange ?? state.requirementHypothesis.timeRange
        },
        updatedAt: now
      };
    }

    case 'ASK_RUN_STARTED':
      return !state.askPlan ? state : {
        ...state,
        askPlan: { ...state.askPlan, status: 'RUNNING' },
        runtimeStatus: { active: true, message: '正在执行 Ask Data 分析计划…' },
        updatedAt: now
      };

    case 'ASK_RUN_COMPLETED':
      return !state.askPlan ? state : {
        ...state,
        status: 'READY',
        runtimeStatus: undefined,
        askPlan: { ...state.askPlan, status: 'COMPLETED', lastRunResult: action.payload.result },
        updatedAt: now
      };

    case 'ASK_RUN_FAILED':
      return !state.askPlan ? state : {
        ...state,
        status: 'WAITING_USER',
        runtimeStatus: undefined,
        askPlan: {
          ...state.askPlan,
          status: 'FAILED',
          lastRunResult: { success: false, executedAt: now, permissionSnapshot: {}, error: action.payload.error }
        },
        updatedAt: now
      };

    default:
      return state;
  }
}
