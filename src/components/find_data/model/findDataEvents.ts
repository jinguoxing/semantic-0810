import {
  FindDataTaskState,
  ResourceId,
  RequirementHypothesis,
  DataSolutionItem,
  SolutionGap,
  SurfaceState,
  ConversationTurn,
  ConversationBlock,
  AskPlan,
  AvailabilityByAction,
  AskRunResult
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
        requirementRevision: number;
        searchRevision: number;
        discoveredResourceIds: ResourceId[];
        solutionItems: DataSolutionItem[];
        gaps?: SolutionGap[];
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
