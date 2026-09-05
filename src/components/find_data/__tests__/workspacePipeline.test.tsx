import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataAssistantFindDataWorkspace } from '../../DataAssistantFindDataWorkspace';
import { FindDataTaskStore } from '../model/findDataStore';
import {
  FindDataEngineResult,
  FindDataService,
  PermissionRecheckResult
} from '../services/FindDataService';
import { createEmptyTask, createMinhangTask } from './testUtils/findDataFactories';

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn()
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

class MemoryTaskStore implements FindDataTaskStore {
  currentTaskId: string | null = null;
  tasks = new Map<string, ReturnType<typeof createEmptyTask>>();

  load(taskId: string) { return this.tasks.get(taskId) ?? null; }
  save(task: ReturnType<typeof createEmptyTask>) { this.tasks.set(task.taskId, task); }
  remove(taskId: string) { this.tasks.delete(taskId); }
  list() { return Array.from(this.tasks.values()); }
  getCurrentTaskId() { return this.currentTaskId; }
  setCurrentTaskId(taskId: string | null) { this.currentTaskId = taskId; }
}

function createService(overrides: Partial<FindDataService> = {}): FindDataService {
  const createTask = vi.fn(async () => createEmptyTask({ taskId: 'created_task' }));
  const submitTurn = vi.fn(async (task: ReturnType<typeof createEmptyTask>, _text: string, operationId?: string): Promise<FindDataEngineResult> => ({
    taskId: task.taskId,
    operationId: operationId ?? 'operation_submit',
    events: [{ type: 'ASSISTANT_TURN_RECEIVED', payload: {
      turnId: 'assistant', nextStatus: 'READY', blocks: [{ type: 'TEXT', id: 'answer', content: '已处理' }]
    } }],
    assistantBlocks: [],
    surfaceCommand: { action: 'NO_CHANGE' }
  }));
  const executeAction = vi.fn(async (task: ReturnType<typeof createEmptyTask>, _action, operationId?: string): Promise<FindDataEngineResult> => ({
    taskId: task.taskId, operationId: operationId ?? 'operation_action', events: [], assistantBlocks: [], surfaceCommand: { action: 'NO_CHANGE' }
  }));
  const recheckPermissions = vi.fn(async (_task, _resourceIds, _action, operationId?: string): Promise<PermissionRecheckResult> => ({ operationId, decision: 'BLOCKED', updatedPermissions: {} }));
  return {
    createTask,
    listTasks: vi.fn(async () => []),
    getTask: vi.fn(async () => { throw new Error('未找到任务'); }),
    deleteTask: vi.fn(async () => {}),
    submitTurn,
    executeAction,
    recheckPermissions,
    runAskPlan: vi.fn(async (_task, _plan, operationId?: string) => ({ operationId, success: false, executedAt: '', permissionSnapshot: {}, error: '未连接' })),
    ...overrides
  };
}

describe('workspace tracked task pipeline', () => {
  it('submits the first turn with USER_TURN_SUBMITTED already applied', async () => {
    const service = createService();
    render(
      <DataAssistantFindDataWorkspace
        initialQuery="首次找数据"
        serviceOverride={service}
        taskStoreOverride={new MemoryTaskStore()}
      />
    );
    await waitFor(() => expect(service.submitTurn).toHaveBeenCalledOnce());
    const submittedTask = vi.mocked(service.submitTurn).mock.calls[0][0];
    expect(submittedTask.turns).toHaveLength(1);
    expect(submittedTask.turns[0]).toMatchObject({ sender: 'USER', blocks: [{ content: '首次找数据' }] });
    expect(await screen.findByText('已处理')).toBeInTheDocument();
  });

  it('drops an old request result after the user switches tasks', async () => {
    let resolveSubmit: ((value: Awaited<ReturnType<FindDataService['submitTurn']>>) => void) | undefined;
    const submitTurn = vi.fn((task: ReturnType<typeof createEmptyTask>) => new Promise<Awaited<ReturnType<FindDataService['submitTurn']>>>((resolve) => {
      resolveSubmit = resolve;
    }));
    const service = createService({ submitTurn });
    const store = new MemoryTaskStore();
    const other = createEmptyTask({ taskId: 'other_task', title: '历史任务' });
    store.save(other);
    render(<DataAssistantFindDataWorkspace serviceOverride={service} taskStoreOverride={store} />);

    const input = await screen.findByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');
    fireEvent.change(input, { target: { value: '开始慢请求' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(submitTurn).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByText('历史任务'));
    expect(store.load('created_task')?.turns[0]).toMatchObject({ sender: 'USER' });

    await act(async () => {
      resolveSubmit?.({
        taskId: 'created_task', operationId: 'old_operation',
        events: [{ type: 'ASSISTANT_TURN_RECEIVED', payload: {
          turnId: 'stale', nextStatus: 'READY', blocks: [{ type: 'TEXT', id: 'stale_text', content: '旧请求结果' }]
        } }],
        assistantBlocks: [], surfaceCommand: { action: 'NO_CHANGE' }
      });
    });
    expect(screen.queryByText('旧请求结果')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '历史任务' })).toBeInTheDocument();
  });

  it('restores the current versioned task when initialQuery is absent', async () => {
    const restored = createEmptyTask({
      taskId: 'restored', title: '已恢复任务',
      turns: [{ turnId: 'saved_turn', sender: 'ASSISTANT', createdAt: '', blocks: [{ type: 'TEXT', id: 'saved', content: '已恢复对话' }] }]
    });
    const store = new MemoryTaskStore();
    store.save(restored);
    store.currentTaskId = restored.taskId;
    const service = createService();
    render(<DataAssistantFindDataWorkspace serviceOverride={service} taskStoreOverride={store} />);
    expect(await screen.findByText('已恢复对话')).toBeInTheDocument();
    expect(service.createTask).not.toHaveBeenCalled();
  });

  it('creates a new task instead of restoring when initialQuery is present', async () => {
    const store = new MemoryTaskStore();
    const old = createEmptyTask({ taskId: 'old', title: '不应恢复' });
    store.save(old);
    store.currentTaskId = old.taskId;
    const service = createService();
    render(<DataAssistantFindDataWorkspace initialQuery="新目标" serviceOverride={service} taskStoreOverride={store} />);
    await waitFor(() => expect(service.submitTurn).toHaveBeenCalledOnce());
    expect(screen.getByRole('heading', { name: '新目标' })).toBeInTheDocument();
    expect(vi.mocked(service.submitTurn).mock.calls[0][0].taskId).toBe('created_task');
  });

  it('returns a failed turn to an interactive state with a recoverable business message', async () => {
    const service = createService({ submitTurn: vi.fn(async () => { throw new Error('服务暂时不可用'); }) });
    render(<DataAssistantFindDataWorkspace initialQuery="失败请求" serviceOverride={service} taskStoreOverride={new MemoryTaskStore()} />);
    expect(await screen.findByText('本次检索未完成，当前还没有形成新的有效方案。可以补充条件后重试。')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…')).not.toBeDisabled();
  });

  it('shows an interactive failed task with a safe business message when initial creation rejects', async () => {
    const service = createService({ createTask: vi.fn(async () => { throw new Error('建任务失败'); }) });
    render(<DataAssistantFindDataWorkspace serviceOverride={service} taskStoreOverride={new MemoryTaskStore()} />);
    expect(await screen.findByText('本次操作未完成，当前已形成的任务内容保持不变。请根据当前方案继续操作或稍后重试。')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…')).not.toBeDisabled();
  });

  it('surfaces action failures without exposing the service error and does not leave the workspace busy', async () => {
    const store = new MemoryTaskStore();
    const task = createMinhangTask({ taskId: 'action_task' });
    store.save(task);
    store.currentTaskId = task.taskId;
    const service = createService({ executeAction: vi.fn(async () => { throw new Error('操作服务失败'); }) });
    render(<DataAssistantFindDataWorkspace serviceOverride={service} taskStoreOverride={store} />);
    fireEvent.click(await screen.findByRole('button', { name: '方案 · 2 项核心资源' }));
    expect(await screen.findByText('本次操作未完成，当前已形成的任务内容保持不变。请根据当前方案继续操作或稍后重试。')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…')).not.toBeDisabled();
  });

  it('restores an HTTP task from the URL without persisting business state locally', async () => {
    window.history.replaceState({}, '', '/?findTaskId=http_task');
    const restored = createEmptyTask({
      taskId: 'http_task', title: 'HTTP 恢复任务',
      turns: [{ turnId: 'a_http', sender: 'ASSISTANT', createdAt: '', blocks: [{ type: 'TEXT', id: 'http_text', content: '来自服务端的任务状态' }] }]
    });
    const store = new MemoryTaskStore();
    const save = vi.spyOn(store, 'save');
    const service = createService({
      listTasks: vi.fn(async () => [{ taskId: 'http_task', title: 'HTTP 恢复任务', status: 'READY' as const, updatedAt: '', scenarioKey: 'generic' }]),
      getTask: vi.fn(async () => restored)
    });
    render(<DataAssistantFindDataWorkspace serviceOverride={service} taskStoreOverride={store} serviceModeOverride="http" />);
    expect(await screen.findByText('来自服务端的任务状态')).toBeInTheDocument();
    expect(service.getTask).toHaveBeenCalledWith('http_task');
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    expect(save).not.toHaveBeenCalled();
  });

  it('reads back a saved HTTP requirement change without pretending a stale solution is ready', async () => {
    window.history.replaceState({}, '', '/?findTaskId=http_recheck');
    const before = createMinhangTask({ taskId: 'http_recheck', title: 'HTTP 修改任务' });
    const afterSave = {
      ...before,
      requirementRevision: 2,
      status: 'WAITING_USER' as const,
      requirementHypothesis: { ...before.requirementHypothesis, bedDefinition: '养老床位核定数' },
      dataSolution: { ...before.dataSolution, state: 'STALE' as const }
    };
    const getTask = vi.fn()
      .mockResolvedValueOnce(before)
      .mockResolvedValueOnce(afterSave);
    const service = createService({
      getTask,
      executeAction: vi.fn(async () => { throw new Error('写入结果超时'); })
    });
    render(<DataAssistantFindDataWorkspace serviceOverride={service} serviceModeOverride="http" taskStoreOverride={new MemoryTaskStore()} />);
    await screen.findByRole('heading', { name: 'HTTP 修改任务' });
    fireEvent.click(screen.getByRole('button', { name: '查看口径上下文' }));
    fireEvent.change(screen.getByDisplayValue('在营可用养老床位'), { target: { value: '养老床位核定数' } });
    fireEvent.click(screen.getByRole('button', { name: '保存并更新口径' }));
    expect(await screen.findByText('新需求已保存，但重新检索尚未形成新方案。旧方案仅供历史参考；可以稍后重试。')).toBeInTheDocument();
    expect(getTask).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: '正在重新评估' })).toBeInTheDocument();
  });
});
