import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataAssistantFindDataWorkspace } from '../../DataAssistantFindDataWorkspace';
import { FindDataTaskStore } from '../model/findDataStore';
import {
  FindDataEngineResult,
  FindDataService,
  PermissionRecheckResult
} from '../services/FindDataService';
import { createAskPlan, createEmptyTask, createMinhangTask } from './testUtils/findDataFactories';
import { MINHANG_RESOURCES } from '../fixtures/minhangBedSupplyFixture';
import { MockFindDataService } from '../services/MockFindDataService';
import { MetricQueryDesignDemoService } from '../services/MetricQueryDesignDemoService';

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn()
});

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
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
  it('closes the Solution surface and reuses the guarded runner for a current-solution direct query', async () => {
    const service = new MetricQueryDesignDemoService();
    render(
      <DataAssistantFindDataWorkspace
        initialQuery="我想比较浦锦街道和七宝镇 2026 年 8 月的养老服务供给情况，先帮我看看需要哪些数据。"
        serviceOverride={service}
        taskStoreOverride={new MemoryTaskStore()}
      />
    );

    await screen.findByRole('heading', { name: '数据方案已就绪' });
    expect(screen.getByRole('heading', { name: '浦锦、七宝养老服务供给比较' })).toBeInTheDocument();
    const input = screen.getByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');
    fireEvent.change(input, { target: { value: '先查询 2026 年 8 月浦锦街道的 60 岁及以上常住人口数。' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('20,000 人')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '数据方案已就绪' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看完整结果' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看指标口径' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '解读这份结果' })).toBeInTheDocument();
  });

  it('keeps selection local until a Solution-derived bed definition is submitted', async () => {
    const service = new MetricQueryDesignDemoService();
    const executeAction = vi.spyOn(service, 'executeAction');
    render(
      <DataAssistantFindDataWorkspace
        initialQuery="我想比较浦锦街道和七宝镇 2026 年 8 月的养老服务供给情况，先帮我看看需要哪些数据。"
        serviceOverride={service}
        taskStoreOverride={new MemoryTaskStore()}
      />
    );

    await screen.findByRole('heading', { name: '数据方案已就绪' });
    const input = screen.getByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');
    fireEvent.change(input, { target: { value: '查询 2026 年 8 月七宝镇的养老床位数。' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const available = await screen.findByRole('radio', { name: '在营可用养老床位数' });
    const submitButton = screen.getByRole('button', { name: '使用此口径继续查询' });
    expect(submitButton).toBeDisabled();
    expect(executeAction).not.toHaveBeenCalled();
    fireEvent.click(available);
    expect(executeAction).not.toHaveBeenCalled();
    fireEvent.click(submitButton);

    expect(await screen.findByText('800 张')).toBeInTheDocument();
    expect(executeAction.mock.calls.map((call) => call[1].actionCode)).toEqual(['SUBMIT_CLARIFICATION', 'RUN_METRIC_QUERY']);
    expect(screen.queryByRole('heading', { name: '数据方案已就绪' })).not.toBeInTheDocument();
  });

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

  it('consumes one detail entry only once when the same action is rendered again', async () => {
    const service = createService();
    const entry = {
      entryId: 'metric:met_elderly_population:query-value',
      source: 'METRIC_DETAIL' as const,
      target: { kind: 'METRIC' as const, id: 'met_elderly_population', label: '老年人口数', version: 'v1.1.0' },
      intent: 'QUERY_VALUE' as const,
      initialText: '查询指标「老年人口数」'
    };
    const view = render(<DataAssistantFindDataWorkspace entryContext={entry} serviceOverride={service} taskStoreOverride={new MemoryTaskStore()} />);

    await waitFor(() => expect(service.createTask).toHaveBeenCalledOnce());
    expect(service.createTask).toHaveBeenCalledWith(expect.objectContaining({ entryContext: entry }));
    await waitFor(() => expect(service.submitTurn).toHaveBeenCalledOnce());

    view.rerender(<DataAssistantFindDataWorkspace entryContext={{ ...entry }} serviceOverride={service} taskStoreOverride={new MemoryTaskStore()} />);
    await new Promise((resolve) => window.setTimeout(resolve, 20));
    expect(service.createTask).toHaveBeenCalledOnce();
    expect(service.submitTurn).toHaveBeenCalledOnce();
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

  it('opens a display-only workspace locally without leaving the task busy', async () => {
    const store = new MemoryTaskStore();
    const task = createMinhangTask({ taskId: 'action_task' });
    store.save(task);
    store.currentTaskId = task.taskId;
    const service = createService({ executeAction: vi.fn(async () => { throw new Error('操作服务失败'); }) });
    render(<DataAssistantFindDataWorkspace serviceOverride={service} taskStoreOverride={store} />);
    fireEvent.click(await screen.findByRole('button', { name: '当前数据方案 · 2 项核心资源' }));
    expect(await screen.findByRole('heading', { name: /数据方案/ })).toBeInTheDocument();
    expect(service.executeAction).not.toHaveBeenCalled();
    expect(screen.queryByText('本次操作未完成，当前已形成的任务内容保持不变。请根据当前方案继续操作或稍后重试。')).not.toBeInTheDocument();
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

  it('returns from fields to the live comparison without confirming a draft selection', async () => {
    const store = new MemoryTaskStore();
    const task = createMinhangTask({
      taskId: 'compare_return',
      resources: { ...createMinhangTask().resources, r02: MINHANG_RESOURCES.r02, r03: MINHANG_RESOURCES.r03 },
      searchResult: {
        query: '人口明细', totalMatches: 2, returnedCount: 2, candidateIds: ['r02', 'r03'],
        candidateSnapshot: [
          { resourceId: 'r02', title: MINHANG_RESOURCES.r02.name, reason: '候选', matchType: 'RELATED', sourceSearchRevision: 1 },
          { resourceId: 'r03', title: MINHANG_RESOURCES.r03.name, reason: '候选', matchType: 'RELATED', sourceSearchRevision: 1 }
        ]
      },
      comparisonModel: { resourceIds: ['r02', 'r03'], recommendedResourceId: 'r03', rows: [] },
      activeSurface: { type: 'COMPARE', resourceIds: ['r02', 'r03'], mode: 'QUICK_PREVIEW' }
    });
    store.save(task);
    store.currentTaskId = task.taskId;
    const service = createService();
    render(<DataAssistantFindDataWorkspace serviceOverride={service} taskStoreOverride={store} />);
    await screen.findByRole('heading', { name: '资源选型对比' });
    fireEvent.click(screen.getByRole('button', { name: `查看${MINHANG_RESOURCES.r03.name}字段` }));
    await screen.findByRole('heading', { name: new RegExp(`字段检视 · ${MINHANG_RESOURCES.r03.name}`) });
    fireEvent.click(screen.getByRole('button', { name: '返回资源比较' }));
    expect(screen.getByRole('heading', { name: '资源选型对比' })).toBeInTheDocument();
    expect(service.executeAction).not.toHaveBeenCalled();
  });

  it('checks and runs a bound analysis plan from the conversation without opening the workspace', async () => {
    const store = new MemoryTaskStore();
    const plan = createAskPlan({ id: 'inline_plan', requirementRevision: 1, basedOnSearchRevision: 1 });
    const base = createMinhangTask({ taskId: 'inline_ask_task', askPlan: plan });
    const task = {
      ...base,
      turns: [{
        turnId: 'ask_ready_turn', sender: 'ASSISTANT' as const, createdAt: '',
        blocks: [{
          type: 'RESULT_BRIEF' as const,
          id: 'ask_ready',
          briefKind: 'ASK_READY' as const,
          title: '本次计算确认',
          askReady: {
            binding: { taskId: base.taskId, askPlanId: plan.id, requirementRevision: 1, searchRevision: 1 },
            metricName: plan.calculationSpec.metricName,
            region: '上海市闵行区',
            requestedTimeRange: plan.timeRange,
            benchmarkLabel: '与全区加权平均比较',
            scopeDisclosure: '本次计划请求范围为 2025.09 至 2026.08。当前演示仅返回单月样例。'
          }
        }]
      }]
    };
    store.save(task);
    store.currentTaskId = task.taskId;
    const recheckPermissions = vi.fn(async (_task, _ids, _action, operationId?: string): Promise<PermissionRecheckResult> => ({
      operationId,
      decision: 'ALLOWED',
      updatedPermissions: { r01: task.resources.r01.availabilityByAction, r04: task.resources.r04.availabilityByAction }
    }));
    const runAskPlan = vi.fn(async (_task, _request, operationId?: string) => ({
      operationId,
      success: true,
      executedAt: '2026-09-06T10:00:00.000Z',
      dataOrigin: 'MOCK_FIXTURE' as const,
      permissionSnapshot: { r01: task.resources.r01.availabilityByAction, r04: task.resources.r04.availabilityByAction },
      resultArtifact: {
        benchmarkLabel: '全区加权平均供给水平',
        benchmarkValue: '24.8 张 / 千人',
        summary: '浦锦街道低于本次比较基准。',
        townResults: [{ townName: '浦锦街道', supplyRatio: '14.2 张 / 千人', comparisonNote: '低于全区' }],
        boundaryNotice: '仅用于演示。'
      }
    }));
    render(<DataAssistantFindDataWorkspace serviceOverride={createService({ recheckPermissions, runAskPlan })} taskStoreOverride={store} />);

    fireEvent.click(await screen.findByRole('button', { name: '校验执行权限' }));
    expect(await screen.findByRole('button', { name: '确认并开始计算' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '确认并开始计算' }));
    expect(await screen.findByText('浦锦街道')).toBeInTheDocument();
    expect(screen.getByText('演示数据')).toBeInTheDocument();
    expect(runAskPlan).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: 'Ask Data 分析计划' })).not.toBeInTheDocument();
    const completedConfirmation = screen.getByLabelText('已完成的本次计算确认');
    expect(within(completedConfirmation).queryByRole('button', { name: /校验执行权限|确认并开始计算/ })).not.toBeInTheDocument();
    fireEvent.click(within(completedConfirmation).getByText('查看当时确认内容'));
    expect(within(completedConfirmation).getByText('本次计划请求范围为 2025.09 至 2026.08。当前演示仅返回单月样例。')).toBeInTheDocument();
    expect(runAskPlan).toHaveBeenCalledOnce();
  });

  it('places the current plan run action only in the open right workspace', async () => {
    const store = new MemoryTaskStore();
    const plan = createAskPlan({ id: 'shared_run_plan', requirementRevision: 1, basedOnSearchRevision: 1, permissionCheckState: 'ALLOWED' });
    const base = createMinhangTask({ taskId: 'shared_run_task', askPlan: plan, activeSurface: { type: 'ASK_PLAN', mode: 'WORKBENCH' } });
    const task = {
      ...base,
      turns: [{
        turnId: 'ask_ready_turn', sender: 'ASSISTANT' as const, createdAt: '',
        blocks: [{
          type: 'RESULT_BRIEF' as const, id: 'ask_ready', briefKind: 'ASK_READY' as const, title: '本次计算确认',
          askReady: {
            binding: { taskId: base.taskId, askPlanId: plan.id, requirementRevision: 1, searchRevision: 1 },
            metricName: plan.calculationSpec.metricName, region: '上海市闵行区', requestedTimeRange: plan.timeRange,
            benchmarkLabel: '与全区加权平均比较', scopeDisclosure: '当前演示仅返回单月样例。'
          }
        }]
      }]
    };
    store.save(task);
    store.currentTaskId = task.taskId;
    let resolveRun: ((result: Awaited<ReturnType<FindDataService['runAskPlan']>>) => void) | undefined;
    const runAskPlan = vi.fn(() => new Promise<Awaited<ReturnType<FindDataService['runAskPlan']>>>((resolve) => { resolveRun = resolve; }));
    render(<DataAssistantFindDataWorkspace serviceOverride={createService({ runAskPlan })} taskStoreOverride={store} />);

    const runButtons = await screen.findAllByRole('button', { name: '按此方案计算' });
    expect(runButtons).toHaveLength(1);
    fireEvent.click(runButtons[0]);
    expect(runAskPlan).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: '当前数据方案 · 2 项核心资源' }));
    expect(await screen.findByRole('heading', { name: /数据方案/ })).toBeInTheDocument();
    expect(runAskPlan).toHaveBeenCalledOnce();
    await act(async () => {
      resolveRun?.({
        success: true, executedAt: '2026-09-06T10:00:00.000Z', dataOrigin: 'MOCK_FIXTURE', permissionSnapshot: {},
        resultArtifact: { benchmarkLabel: '基准', summary: '完成', townResults: [], boundaryNotice: '边界' }
      });
    });
    expect(await screen.findByText('分析已完成，关键结果如下。')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /数据方案/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '分析结果' })).not.toBeInTheDocument();
    expect(runAskPlan).toHaveBeenCalledOnce();
  });

  it('keeps an inline candidate draft while viewing the other candidate fields and confirms only that draft', async () => {
    const store = new MemoryTaskStore();
    const base = createMinhangTask({ taskId: 'inline_candidate_task' });
    const task = {
      ...base,
      resources: { ...base.resources, r02: MINHANG_RESOURCES.r02, r03: MINHANG_RESOURCES.r03 },
      searchResult: {
        query: '人口明细', totalMatches: 2, returnedCount: 2, candidateIds: ['r01', 'r04', 'r02', 'r03'],
        candidateSnapshot: [
          ...base.searchResult!.candidateSnapshot,
          { resourceId: 'r02', title: MINHANG_RESOURCES.r02.name, reason: '当前最新状态，不保留历史月度快照。', matchType: 'RELATED' as const, proposedRole: 'OPTIONAL_DRILLDOWN' as const, sourceSearchRevision: 1 },
          { resourceId: 'r03', title: MINHANG_RESOURCES.r03.name, reason: '按月固化，可用于对应月份的明细下钻。', matchType: 'RELATED' as const, proposedRole: 'OPTIONAL_DRILLDOWN' as const, sourceSearchRevision: 1 }
        ]
      },
      comparisonModel: { resourceIds: ['r02', 'r03'], recommendedResourceId: 'r03', rows: [] },
      turns: [{
        turnId: 'candidate_turn', sender: 'ASSISTANT' as const, createdAt: '',
        blocks: [{
          type: 'RESULT_BRIEF' as const, id: 'candidate_brief', briefKind: 'CANDIDATE_SUMMARY' as const,
          title: '人口明细候选',
          candidateSelection: { resourceIds: ['r02', 'r03'], recommendedResourceId: 'r03', selectionGroupId: 'population_detail_alternative' }
        }]
      }]
    };
    store.save(task);
    store.currentTaskId = task.taskId;
    const executeAction = vi.fn(async (currentTask, action, operationId) => ({
      taskId: currentTask.taskId,
      operationId: operationId ?? 'surface',
      events: [],
      assistantBlocks: [],
      surfaceCommand: action.actionCode === 'OPEN_FIELDS'
        ? { action: 'REPLACE' as const, surface: 'FIELDS' as const, resourceIds: [action.payload?.resourceId as string] }
        : { action: 'NO_CHANGE' as const }
    }));
    render(<DataAssistantFindDataWorkspace serviceOverride={createService({ executeAction })} taskStoreOverride={store} />);

    const r02Radio = await screen.findByRole('radio', { name: MINHANG_RESOURCES.r02.name });
    const r03Radio = screen.getByRole('radio', { name: MINHANG_RESOURCES.r03.name });
    expect(r03Radio).toBeChecked();
    fireEvent.click(r02Radio);
    expect(screen.getByRole('radio', { name: MINHANG_RESOURCES.r02.name })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: `查看${MINHANG_RESOURCES.r03.name}字段` }));
    expect(await screen.findByRole('heading', { name: new RegExp(`字段检视 · ${MINHANG_RESOURCES.r03.name}`) })).toBeInTheDocument();
    expect(executeAction).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: MINHANG_RESOURCES.r02.name })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: '将所选资源加入方案' }));
    await waitFor(() => expect(executeAction).toHaveBeenLastCalledWith(expect.anything(), {
      actionCode: 'SELECT_RESOURCE', payload: { resourceId: 'r02' }
    }, expect.any(String)));
  });

  it('keeps the formal non-default selection in both conversation and comparison after a right-side confirmation', async () => {
    const store = new MemoryTaskStore();
    const base = createMinhangTask({ taskId: 'right_confirm_candidate_task' });
    const task = {
      ...base,
      resources: { ...base.resources, r02: MINHANG_RESOURCES.r02, r03: MINHANG_RESOURCES.r03 },
      searchResult: {
        query: '人口明细', totalMatches: 2, returnedCount: 2, candidateIds: ['r01', 'r04', 'r02', 'r03'],
        candidateSnapshot: [
          ...base.searchResult!.candidateSnapshot,
          { resourceId: 'r02', title: MINHANG_RESOURCES.r02.name, reason: '当前最新状态，不保留历史月度快照。', matchType: 'RELATED' as const, proposedRole: 'OPTIONAL_DRILLDOWN' as const, sourceSearchRevision: 1 },
          { resourceId: 'r03', title: MINHANG_RESOURCES.r03.name, reason: '按月固化，可用于对应月份的明细下钻。', matchType: 'RELATED' as const, proposedRole: 'OPTIONAL_DRILLDOWN' as const, sourceSearchRevision: 1 }
        ]
      },
      comparisonModel: { resourceIds: ['r02', 'r03'], recommendedResourceId: 'r03', selectionGroupId: 'population_detail_alternative', rows: [] },
      turns: [{
        turnId: 'candidate_turn', sender: 'ASSISTANT' as const, createdAt: '',
        blocks: [{
          type: 'RESULT_BRIEF' as const, id: 'candidate_brief', briefKind: 'CANDIDATE_SUMMARY' as const,
          title: '人口明细候选',
          candidateSelection: { resourceIds: ['r02', 'r03'], recommendedResourceId: 'r03', selectionGroupId: 'population_detail_alternative' }
        }]
      }]
    };
    store.save(task);
    store.currentTaskId = task.taskId;
    render(<DataAssistantFindDataWorkspace serviceOverride={new MockFindDataService()} taskStoreOverride={store} />);

    await screen.findByRole('radio', { name: MINHANG_RESOURCES.r02.name });
    fireEvent.click(screen.getByRole('radio', { name: MINHANG_RESOURCES.r02.name }));
    fireEvent.click(screen.getByRole('button', { name: '详细比较' }));
    await screen.findByRole('heading', { name: '资源选型对比' });
    expect(screen.getByRole('radio', { name: `选择 ${MINHANG_RESOURCES.r02.name}` })).toBeChecked();
    fireEvent.click(screen.getAllByRole('button', { name: '将所选资源加入方案' }).at(-1)!);

    await waitFor(() => expect(screen.getByRole('button', { name: '已加入方案' })).toBeInTheDocument());
    expect(screen.getByRole('radio', { name: MINHANG_RESOURCES.r02.name })).toBeChecked();
    expect(screen.getByRole('radio', { name: MINHANG_RESOURCES.r03.name })).not.toBeChecked();
    expect(screen.queryByRole('heading', { name: '资源选型对比' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '详细比较' }));
    expect(await screen.findByRole('radio', { name: `选择 ${MINHANG_RESOURCES.r02.name}` })).toBeChecked();
  });

  it.each(['business rejection', 'request failure'])('keeps a non-default candidate draft after %s', async (outcome) => {
    const store = new MemoryTaskStore();
    const base = createMinhangTask({ taskId: `candidate_${outcome.replace(' ', '_')}` });
    const task = {
      ...base,
      resources: { ...base.resources, r02: MINHANG_RESOURCES.r02, r03: MINHANG_RESOURCES.r03 },
      searchResult: {
        query: '人口明细', totalMatches: 2, returnedCount: 2, candidateIds: ['r01', 'r04', 'r02', 'r03'],
        candidateSnapshot: [
          ...base.searchResult!.candidateSnapshot,
          { resourceId: 'r02', title: MINHANG_RESOURCES.r02.name, reason: '当前最新状态。', matchType: 'RELATED' as const, sourceSearchRevision: 1 },
          { resourceId: 'r03', title: MINHANG_RESOURCES.r03.name, reason: '按月固化。', matchType: 'RELATED' as const, sourceSearchRevision: 1 }
        ]
      },
      comparisonModel: { resourceIds: ['r02', 'r03'], recommendedResourceId: 'r03', selectionGroupId: 'population_detail_alternative', rows: [] },
      turns: [{ turnId: 'candidate_turn', sender: 'ASSISTANT' as const, createdAt: '', blocks: [{
        type: 'RESULT_BRIEF' as const, id: 'candidate_brief', briefKind: 'CANDIDATE_SUMMARY' as const, title: '人口明细候选',
        candidateSelection: { resourceIds: ['r02', 'r03'], recommendedResourceId: 'r03', selectionGroupId: 'population_detail_alternative' }
      }] }]
    };
    store.save(task);
    store.currentTaskId = task.taskId;
    const executeAction = vi.fn(async (currentTask, action, operationId) => {
      if (action.actionCode === 'SELECT_RESOURCE' && outcome === 'request failure') throw new Error('选择服务暂时不可用');
      return {
        taskId: currentTask.taskId,
        operationId: operationId ?? 'surface',
        events: action.actionCode === 'SELECT_RESOURCE' ? [{
          type: 'ASSISTANT_TURN_RECEIVED' as const,
          payload: { turnId: 'rejected', nextStatus: 'READY' as const, blocks: [{ type: 'SYSTEM_NOTICE' as const, id: 'notice', level: 'warning' as const, message: '当前选择暂未获业务确认。' }] }
        }] : [],
        assistantBlocks: [],
        surfaceCommand: { action: 'NO_CHANGE' as const }
      };
    });
    render(<DataAssistantFindDataWorkspace serviceOverride={createService({ executeAction })} taskStoreOverride={store} />);

    fireEvent.click(await screen.findByRole('radio', { name: MINHANG_RESOURCES.r02.name }));
    fireEvent.click(screen.getByRole('button', { name: '将所选资源加入方案' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: MINHANG_RESOURCES.r02.name })).toBeChecked());
    expect(screen.getByRole('button', { name: '将所选资源加入方案' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '已加入方案' })).not.toBeInTheDocument();
  });

  it('keeps an unexecuted historical confirmation read-only after the plan changes', async () => {
    const store = new MemoryTaskStore();
    const currentPlan = createAskPlan({ id: 'new_plan', requirementRevision: 2, basedOnSearchRevision: 2 });
    const base = createMinhangTask({ taskId: 'historic_confirmation_task', requirementRevision: 2, searchRevision: 2, askPlan: currentPlan });
    const task = {
      ...base,
      turns: [{
        turnId: 'old_confirmation', sender: 'ASSISTANT' as const, createdAt: '',
        blocks: [{
          type: 'RESULT_BRIEF' as const, id: 'old_ready', briefKind: 'ASK_READY' as const, title: '本次计算确认',
          askReady: {
            binding: { taskId: base.taskId, askPlanId: 'old_plan', requirementRevision: 1, searchRevision: 1 },
            metricName: '旧口径每千名老人养老床位数', region: '上海市闵行区',
            requestedTimeRange: { start: '2025.09', end: '2026.08' }, benchmarkLabel: '与全区加权平均比较', scopeDisclosure: '旧计划仅用于历史确认。'
          }
        }]
      }]
    };
    store.save(task);
    store.currentTaskId = task.taskId;
    const runAskPlan = vi.fn();
    render(<DataAssistantFindDataWorkspace serviceOverride={createService({ runAskPlan })} taskStoreOverride={store} />);
    const historical = await screen.findByLabelText('历史计算确认');
    expect(within(historical).queryByRole('button', { name: /校验执行权限|确认并开始计算/ })).not.toBeInTheDocument();
    fireEvent.click(within(historical).getByText('查看当时确认内容'));
    expect(within(historical).getByText('旧计划仅用于历史确认。')).toBeInTheDocument();
    expect(runAskPlan).not.toHaveBeenCalled();
  });

  it('collapses a completed historical confirmation without pointing it at the replacement plan', async () => {
    const store = new MemoryTaskStore();
    const currentPlan = createAskPlan({ id: 'replacement_plan', requirementRevision: 2, basedOnSearchRevision: 2 });
    const base = createMinhangTask({ taskId: 'historic_completed_task', requirementRevision: 2, searchRevision: 2, askPlan: currentPlan });
    const oldBinding = { taskId: base.taskId, askPlanId: 'completed_old_plan', requirementRevision: 1, searchRevision: 1 };
    const task = {
      ...base,
      turns: [{
        turnId: 'old_confirmation', sender: 'ASSISTANT' as const, createdAt: '',
        blocks: [
          {
            type: 'RESULT_BRIEF' as const, id: 'old_ready', briefKind: 'ASK_READY' as const, title: '本次计算确认',
            askReady: {
              binding: oldBinding, metricName: '旧口径每千名老人养老床位数', region: '上海市闵行区',
              requestedTimeRange: { start: '2025.09', end: '2026.08' }, benchmarkLabel: '与全区加权平均比较', scopeDisclosure: '旧计划范围限制。'
            }
          },
          {
            type: 'ASK_RESULT' as const, id: 'old_result', snapshot: {
              binding: oldBinding, executedAt: '2026-09-06T00:00:00.000Z', metricName: '旧口径每千名老人养老床位数', numeratorLabel: '在营可用养老床位数',
              resultArtifact: { benchmarkLabel: '旧基准', summary: '旧摘要', townResults: [], boundaryNotice: '旧边界' }
            }
          }
        ]
      }]
    };
    store.save(task);
    store.currentTaskId = task.taskId;
    render(<DataAssistantFindDataWorkspace serviceOverride={createService()} taskStoreOverride={store} />);
    const historical = await screen.findByLabelText('已完成的本次计算确认');
    expect(within(historical).getByText('该计划曾执行，当前需求或计划已更新。')).toBeInTheDocument();
    expect(within(historical).queryByRole('button', { name: /校验执行权限|确认并开始计算|查看完整计划/ })).not.toBeInTheDocument();
    fireEvent.click(within(historical).getByText('查看当时确认内容'));
    expect(within(historical).getByText('旧计划范围限制。')).toBeInTheDocument();
  });
});
