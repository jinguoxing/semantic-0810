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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`无法连接找数据后端服务: ${message}`);
    }
  }

  async listTasks(): Promise<FindDataTaskSummary[]> {
    const resp = await fetch(`${this.apiBase}/tasks`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    return await resp.json();
  }

  async getTask(taskId: string): Promise<FindDataTaskState> {
    const resp = await fetch(`${this.apiBase}/tasks/${taskId}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    return await resp.json();
  }

  async deleteTask(taskId: string): Promise<void> {
    const resp = await fetch(`${this.apiBase}/tasks/${taskId}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }

  async submitTurn(
    task: FindDataTaskState,
    text: string,
    operationId?: string
  ): Promise<FindDataEngineResult> {
    const resp = await fetch(`${this.apiBase}/tasks/${task.taskId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, operationId })
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    return { ...await resp.json(), operationId: operationId ?? `http_turn_${Date.now()}` };
  }

  async executeAction(
    task: FindDataTaskState,
    action: TaskAction,
    operationId?: string
  ): Promise<FindDataEngineResult> {
    const resp = await fetch(`${this.apiBase}/tasks/${task.taskId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...action, operationId })
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    return { ...await resp.json(), operationId: operationId ?? `http_action_${Date.now()}` };
  }

  async recheckPermissions(
    task: FindDataTaskState,
    resourceIds: ResourceId[],
    action: 'query' | 'preview' | 'export',
    operationId?: string
  ): Promise<PermissionRecheckResult> {
    const resp = await fetch(`${this.apiBase}/tasks/${task.taskId}/permissions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceIds, action, operationId })
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    return { ...await resp.json(), operationId };
  }

  async runAskPlan(
    task: FindDataTaskState,
    request: AskPlanRunRequest,
    operationId?: string
  ): Promise<AskRunResult> {
    // Server authority contract: resolve askPlanId server-side, then validate task
    // ownership, revisions, permissions, relationship/dimension/time alignment and
    // execute. The browser must never transmit a mutable formula or resource plan.
    const resp = await fetch(`${this.apiBase}/tasks/${task.taskId}/ask-plan/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, operationId })
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    const result = await resp.json();
    if (result?.dataOrigin !== 'LIVE_QUERY' && result?.dataOrigin !== 'MOCK_FIXTURE') {
      throw new Error('找数据后端返回了无效的数据来源合同。');
    }
    return { ...result, operationId };
  }
}
