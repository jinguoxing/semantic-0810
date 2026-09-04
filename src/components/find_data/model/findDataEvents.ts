import {
  FindDataTaskState,
  FindDataResource,
  ResourceId,
  RequirementHypothesis,
  DataSolutionItem,
  SolutionGap,
  SurfaceState,
  ConversationTurn,
  ConversationBlock,
  AskPlan,
  AvailabilityByAction,
  AskRunResult,
  PermissionRequestRef,
  ResourceCandidate,
  ResourceComparisonModel,
  CandidateDelta,
  DataSolutionPatch,
  TaskStatus
} from './FindDataTask';

export type FindDataEvent =
  | {
      type: 'TASK_CREATED';
      payload: {
        task: FindDataTaskState;
      };
    }
  | {
      type: 'USER_TURN_SUBMITTED';
      payload: {
        text: string;
        turnId: string;
      };
    }
  | {
      type: 'ASSISTANT_TURN_RECEIVED';
      payload: {
        turnId: string;
        blocks: ConversationBlock[];
        nextStatus?: TaskStatus;
      };
    }
  | {
      type: 'SCENARIO_CLASSIFIED';
      payload: {
        scenarioKey: string;
      };
    }
  | {
      type: 'COMPARISON_MODEL_SET';
      payload: {
        comparisonModel?: ResourceComparisonModel;
      };
    }
  | {
      type: 'TASK_TITLE_UPDATED';
      payload: {
        title: string;
        goal?: string;
      };
    }
  | {
      type: 'REQUIREMENT_UPDATED';
      payload: {
        hypothesis: Partial<RequirementHypothesis>;
        bumpRevision?: boolean;
      };
    }
  | {
      type: 'SEARCH_STARTED';
      payload: {
        scope?: {
          domains?: string[];
          expandedDomains?: string[];
        };
        searchRevision: number;
        statusMessage?: string;
      };
    }
  | {
      type: 'SEARCH_RESULTS_RECEIVED';
      payload: {
        taskId: string;
        requirementRevision: number;
        searchRevision: number;
        query?: string;
        totalMatches?: number;
        candidateSnapshot?: ResourceCandidate[];
        resourceUpserts?: FindDataResource[];
        candidateDelta: CandidateDelta;
        solutionPatch: DataSolutionPatch;
      };
    }
  | {
      type: 'CLARIFICATION_RESOLVED';
      payload: {
        questionId: string;
        selectedOptionIds: string[];
        selectedOptionLabels: string[];
        requirementRevision: number;
        resolvedAt: string;
      };
    }
  | {
      type: 'RESOURCE_SELECTED';
      payload: {
        resourceId: ResourceId;
      };
    }
  | {
      type: 'SOLUTION_ITEM_UPSERTED';
      payload: {
        item: DataSolutionItem;
      };
    }
  | {
      type: 'SOLUTION_GAP_UPSERTED';
      payload: {
        gap: SolutionGap;
      };
    }
  | {
      type: 'PERMISSION_REQUEST_CREATED';
      payload: {
        request: PermissionRequestRef;
      };
    }
  | {
      type: 'SURFACE_OPENED';
      payload: SurfaceState;
    }
  | {
      type: 'SURFACE_CLOSED';
    }
  | {
      type: 'PERMISSION_RECHECK_STARTED';
      payload: {
        resourceIds: ResourceId[];
      };
    }
  | {
      type: 'PERMISSION_RECHECK_COMPLETED';
      payload: {
        decision: 'ALLOWED' | 'BLOCKED' | 'CHANGED';
        updatedPermissions: Record<ResourceId, AvailabilityByAction>;
      };
    }
  | {
      type: 'ASK_PLAN_PREPARED';
      payload: {
        askPlan: AskPlan;
      };
    }
  | {
      type: 'ASK_RUN_STARTED';
    }
  | {
      type: 'ASK_RUN_COMPLETED';
      payload: {
        result: AskRunResult;
      };
    }
  | {
      type: 'ASK_RUN_FAILED';
      payload: {
        error: string;
      };
    }
  | {
      type: 'TASK_HYDRATED';
      payload: {
        task: FindDataTaskState;
      };
    };
