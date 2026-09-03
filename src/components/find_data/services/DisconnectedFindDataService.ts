import {
  FindDataService,
  FindDataEngineResult,
  PermissionRecheckResult
} from './FindDataService';
import {
  FindDataTaskState,
  ResourceId,
  TaskAction,
  AskPlan,
  AskRunResult
} from '../model/FindDataTask';

export class DisconnectedFindDataService implements FindDataService {
  async createTask(input?: { initialQuery?: string }): Promise<FindDataTaskState> {
    const taskId = `task_${Date.now()}`;
    const initialQuery = input?.initialQuery?.trim() || '';
    const now = new Date().toISOString();

    return {
      taskId,
      title: initialQuery || '新建找数据任务',
      status: 'FAILED',
      scenarioKey: 'disconnected',
      goal: initialQuery,
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
      turns: [
        {
          turnId: `turn_${Date.now()}`,
          sender: 'ASSISTANT',
          createdAt: now,
          blocks: [
            {
              type: 'SYSTEM_NOTICE',
              id: `sn_${Date.now()}`,
              level: 'error',
              title: '找数据服务未连接',
              message: '找数据服务尚未连接，请联系平台管理员完成服务配置。'
            }
          ]
        }
      ],
      resources: {},
      searchResult: {
        totalMatches: 0,
        candidateIds: [],
        returnedCount: 0,
        query: ''
      },
      dataSolution: {
        items: [],
        gaps: [],
        relationshipEvidence: [],
        coverageSummary: [],
        limitationSummary: [],
        updatedAt: now
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
        message: '服务未连接'
      },
      askPlan: undefined,
      createdAt: now,
      updatedAt: now
    };
  }

  async submitTurn(
    _task: FindDataTaskState,
    _text: string
  ): Promise<FindDataEngineResult> {
    const turnId = `turn_${Date.now()}_assistant`;
    return {
      events: [
        {
          type: 'ASSISTANT_TURN_RECEIVED',
          payload: {
            turnId,
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
    _task: FindDataTaskState,
    _action: TaskAction
  ): Promise<FindDataEngineResult> {
    return {
      events: [],
      assistantBlocks: [],
      surfaceCommand: { action: 'NO_CHANGE' }
    };
  }

  async recheckPermissions(
    _task: FindDataTaskState,
    _resourceIds: ResourceId[],
    _action: 'query' | 'preview' | 'export'
  ): Promise<PermissionRecheckResult> {
    return {
      decision: 'BLOCKED',
      updatedPermissions: {},
      details: '服务未连接，无法完成权限校验。'
    };
  }

  async runAskPlan(
    _task: FindDataTaskState,
    _askPlan: AskPlan
  ): Promise<AskRunResult> {
    return {
      success: false,
      executedAt: new Date().toISOString(),
      permissionSnapshot: {},
      error: '分析执行服务尚未连接。'
    };
  }
}
