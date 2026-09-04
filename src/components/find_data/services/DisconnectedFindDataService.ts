import {
  FindDataService,
  FindDataEngineResult,
  FindDataTaskSummary,
  PermissionRecheckResult
} from './FindDataService';
import {
  FindDataTaskState,
  ResourceId,
  TaskAction,
  AskPlanRunRequest,
  AskRunResult
} from '../model/FindDataTask';
import { createFindDataTask } from '../model/createFindDataTask';

export class DisconnectedFindDataService implements FindDataService {
  async createTask(input?: { initialQuery?: string }): Promise<FindDataTaskState> {
    return createFindDataTask({
      taskId: `task_${Date.now()}`,
      initialQuery: input?.initialQuery,
      scenarioKey: 'disconnected'
    });
  }

  async listTasks(): Promise<FindDataTaskSummary[]> {
    return [];
  }

  async getTask(_taskId: string): Promise<FindDataTaskState> {
    throw new Error('找数据服务尚未连接，无法恢复任务。');
  }

  async deleteTask(_taskId: string): Promise<void> {}

  async submitTurn(
    task: FindDataTaskState,
    _text: string,
    operationId?: string
  ): Promise<FindDataEngineResult> {
    const turnId = `turn_${Date.now()}_assistant`;
    return {
      taskId: task.taskId,
      operationId: operationId ?? `operation_${Date.now()}`,
      events: [
        {
          type: 'ASSISTANT_TURN_RECEIVED',
          payload: {
            turnId,
            nextStatus: 'FAILED',
            blocks: [
              {
                type: 'SYSTEM_NOTICE',
                id: `sn_${Date.now()}`,
                level: 'error',
                title: '服务未连接',
                message: '找数据服务尚未连接，请联系平台管理员完成服务配置。'
              }
            ]
          }
        }
      ],
      assistantBlocks: [
        {
          type: 'SYSTEM_NOTICE',
          id: `sn_${Date.now()}`,
          level: 'error',
          title: '服务未连接',
          message: '找数据服务尚未连接，请联系平台管理员完成服务配置。'
        }
      ],
      surfaceCommand: { action: 'NO_CHANGE' }
    };
  }

  async executeAction(
    task: FindDataTaskState,
    _action: TaskAction,
    operationId?: string
  ): Promise<FindDataEngineResult> {
    return {
      taskId: task.taskId,
      operationId: operationId ?? `operation_${Date.now()}`,
      events: [],
      assistantBlocks: [],
      surfaceCommand: { action: 'NO_CHANGE' }
    };
  }

  async recheckPermissions(
    _task: FindDataTaskState,
    _resourceIds: ResourceId[],
    _action: 'query' | 'preview' | 'export',
    operationId?: string
  ): Promise<PermissionRecheckResult> {
    return {
      operationId,
      decision: 'BLOCKED',
      updatedPermissions: {},
      details: '服务未连接，无法完成权限校验。'
    };
  }

  async runAskPlan(
    _task: FindDataTaskState,
    _request: AskPlanRunRequest,
    operationId?: string
  ): Promise<AskRunResult> {
    return {
      operationId,
      success: false,
      executedAt: new Date().toISOString(),
      permissionSnapshot: {},
      error: '分析执行服务尚未连接。'
    };
  }
}
