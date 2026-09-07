import {
  FindDataService,
  FindDataEngineResult,
  FindDataTaskSummary,
  PermissionRecheckResult,
  CreateFindDataTaskInput
} from './FindDataService';
import {
  FindDataTaskState,
  ResourceId,
  TaskAction,
  AskPlanRunRequest,
  AskRunResult,
  TurnTargetContext
} from '../model/FindDataTask';
import { createFindDataTask } from '../model/createFindDataTask';

export class DisconnectedFindDataService implements FindDataService {
  async createTask(input?: CreateFindDataTaskInput): Promise<FindDataTaskState> {
    return createFindDataTask({
      taskId: `task_${Date.now()}`,
      initialQuery: input?.initialQuery,
      entryContext: input?.entryContext,
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
    operationId?: string,
    _context?: TurnTargetContext
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
    const id = operationId ?? `operation_${Date.now()}`;
    const block = {
      type: 'SYSTEM_NOTICE' as const,
      id: `sn_${Date.now()}`,
      level: 'error' as const,
      title: '服务未连接',
      message: '找数据服务尚未连接，无法确认口径或执行指标查询。'
    };
    return {
      taskId: task.taskId,
      operationId: id,
      events: [
        ...(_action.actionCode === 'RUN_METRIC_QUERY' && task.directMetricQuery
          ? [{ type: 'DIRECT_METRIC_QUERY_FAILED' as const, payload: { requestId: task.directMetricQuery.requestId, error: '指标查询服务尚未连接。' } }]
          : []),
        {
          type: 'ASSISTANT_TURN_RECEIVED',
          payload: { turnId: `turn_${Date.now()}_assistant`, nextStatus: 'FAILED' as const, blocks: [block] }
        }
      ],
      assistantBlocks: [block],
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
