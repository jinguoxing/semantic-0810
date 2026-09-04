import { FindDataEngineResult } from '../services/FindDataService';
import { FindDataTaskState, TaskAction } from '../model/FindDataTask';
import { InteractionIntent } from '../policy/surfacePolicy';

export interface FindDataScenario {
  key: string;
  matchesInitialTurn(text: string): boolean;
  handleTurn(
    task: FindDataTaskState,
    text: string,
    intent: InteractionIntent
  ): Promise<FindDataEngineResult>;
  handleAction(task: FindDataTaskState, action: TaskAction): Promise<FindDataEngineResult>;
}

let sequence = 0;

export function createScenarioId(prefix: string): string {
  sequence += 1;
  return `${prefix}_${Date.now().toString(36)}_${sequence.toString(36)}`;
}

export function emptyScenarioResult(taskId: string): FindDataEngineResult {
  return {
    taskId,
    operationId: createScenarioId('operation'),
    events: [],
    assistantBlocks: [],
    surfaceCommand: { action: 'NO_CHANGE' }
  };
}
