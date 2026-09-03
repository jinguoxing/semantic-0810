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

export class HttpFindDataService implements FindDataService {
  private apiBase: string;

  constructor(apiBase: string) {
    this.apiBase = apiBase.replace(/\/$/, '');
  }

  async createTask(input?: { initialQuery?: string }): Promise<FindDataTaskState> {
    try {
      const resp = await fetch(`${this.apiBase}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {})
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      return await resp.json();
    } catch (e: any) {
      throw new Error(`无法连接找数据后端服务: ${e.message}`);
    }
  }

  async submitTurn(
    task: FindDataTaskState,
    text: string
  ): Promise<FindDataEngineResult> {
    const resp = await fetch(`${this.apiBase}/tasks/${task.taskId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    return await resp.json();
  }

  async executeAction(
    task: FindDataTaskState,
    action: TaskAction
  ): Promise<FindDataEngineResult> {
    const resp = await fetch(`${this.apiBase}/tasks/${task.taskId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    return await resp.json();
  }

  async recheckPermissions(
    task: FindDataTaskState,
    resourceIds: ResourceId[],
    action: 'query' | 'preview' | 'export'
  ): Promise<PermissionRecheckResult> {
    const resp = await fetch(`${this.apiBase}/tasks/${task.taskId}/permissions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceIds, action })
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    return await resp.json();
  }

  async runAskPlan(
    task: FindDataTaskState,
    askPlan: AskPlan
  ): Promise<AskRunResult> {
    const resp = await fetch(`${this.apiBase}/tasks/${task.taskId}/ask-plan/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ askPlan })
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    const result = await resp.json();
    return {
      ...result,
      dataOrigin: 'LIVE_QUERY'
    };
  }
}
