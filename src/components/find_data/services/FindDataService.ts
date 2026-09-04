import {
  FindDataTaskState,
  ResourceId,
  ConversationBlock,
  TaskAction,
  AskPlanRunRequest,
  AskRunResult,
  AvailabilityByAction,
  TaskStatus
} from '../model/FindDataTask';
import { FindDataEvent } from '../model/findDataEvents';
import { SurfaceCommand } from '../policy/surfacePolicy';

export interface FindDataEngineResult {
  taskId: string;
  operationId: string;
  events: FindDataEvent[];
  assistantBlocks: ConversationBlock[];
  surfaceCommand?: SurfaceCommand;
}

export interface PermissionRecheckResult {
  operationId?: string;
  decision: 'ALLOWED' | 'BLOCKED' | 'CHANGED';
  updatedPermissions: Record<ResourceId, AvailabilityByAction>;
  details?: string;
}

export interface FindDataTaskSummary {
  taskId: string;
  title: string;
  status: TaskStatus;
  updatedAt: string;
  scenarioKey?: string;
}

export interface FindDataService {
  createTask(input?: {
    initialQuery?: string;
  }): Promise<FindDataTaskState>;

  listTasks(): Promise<FindDataTaskSummary[]>;

  getTask(taskId: string): Promise<FindDataTaskState>;

  deleteTask(taskId: string): Promise<void>;

  submitTurn(
    task: FindDataTaskState,
    text: string,
    operationId?: string
  ): Promise<FindDataEngineResult>;

  executeAction(
    task: FindDataTaskState,
    action: TaskAction,
    operationId?: string
  ): Promise<FindDataEngineResult>;

  recheckPermissions(
    task: FindDataTaskState,
    resourceIds: ResourceId[],
    action: 'query' | 'preview' | 'export',
    operationId?: string
  ): Promise<PermissionRecheckResult>;

  runAskPlan(
    task: FindDataTaskState,
    request: AskPlanRunRequest,
    operationId?: string
  ): Promise<AskRunResult>;
}
