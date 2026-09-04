import {
  FindDataTaskState,
  ResourceId,
  ConversationBlock,
  TaskAction,
  AskPlan,
  AskRunResult,
  AvailabilityByAction
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
  decision: 'ALLOWED' | 'BLOCKED' | 'CHANGED';
  updatedPermissions: Record<ResourceId, AvailabilityByAction>;
  details?: string;
}

export interface FindDataService {
  createTask(input?: {
    initialQuery?: string;
  }): Promise<FindDataTaskState>;

  submitTurn(
    task: FindDataTaskState,
    text: string
  ): Promise<FindDataEngineResult>;

  executeAction(
    task: FindDataTaskState,
    action: TaskAction
  ): Promise<FindDataEngineResult>;

  recheckPermissions(
    task: FindDataTaskState,
    resourceIds: ResourceId[],
    action: 'query' | 'preview' | 'export'
  ): Promise<PermissionRecheckResult>;

  runAskPlan(
    task: FindDataTaskState,
    askPlan: AskPlan
  ): Promise<AskRunResult>;
}
