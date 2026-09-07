import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataAssistantFindDataWorkspace } from '../../DataAssistantFindDataWorkspace';
import { AskResultSnapshot, FindDataTaskState } from '../model/FindDataTask';
import { findDataReducer } from '../model/findDataReducer';
import { FindDataTaskStore } from '../model/findDataStore';
import { selectCurrentViewedResult, selectResultSnapshots, selectResultTargetByRef } from '../model/findDataSelectors';
import { evaluateSurfacePolicy, resolveInteractionIntent } from '../policy/surfacePolicy';
import { FindDataEngineResult, FindDataService, PermissionRecheckResult } from '../services/FindDataService';
import { createAskPlan, createEmptyTask, createMinhangTask } from './testUtils/findDataFactories';

Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

class MemoryTaskStore implements FindDataTaskStore {
  currentTaskId: string | null = null;
  tasks = new Map<string, FindDataTaskState>();
  load(taskId: string) { return this.tasks.get(taskId) ?? null; }
  save(task: FindDataTaskState) { this.tasks.set(task.taskId, task); }
  remove(taskId: string) { this.tasks.delete(taskId); }
  list() { return Array.from(this.tasks.values()); }
  getCurrentTaskId() { return this.currentTaskId; }
  setCurrentTaskId(taskId: string | null) { this.currentTaskId = taskId; }
}

function resultSnapshot(taskId: string, kind: 'A' | 'B'): AskResultSnapshot {
  const available = kind === 'A';
  const values = available ? [15, 20] : [22.5, 25];
  const binding = available
    ? { taskId, askPlanId: 'plan_a', requirementRevision: 1, searchRevision: 1 }
    : { taskId, askPlanId: 'plan_b', requirementRevision: 2, searchRevision: 2 };
  return {
    binding,
    operationId: `operation_${kind.toLowerCase()}`,
    executedAt: available ? '2026-08-31T10:00:00.000Z' : '2026-08-31T11:00:00.000Z',
    metricName: '养老床位供给比较',
    numeratorLabel: available ? '在营可用养老床位数' : '养老床位核定数',
    formulaExplanation: '每千名老人对应床位数。',
    resultArtifact: {
      resultRef: { kind: 'SERVICE_RESULT', id: `result_${kind.toLowerCase()}` },
      citations: [{
        kind: 'METRIC_DEFINITION', id: `definition_${kind.toLowerCase()}`,
        label: available ? '在营可用养老床位数' : '养老床位核定数', version: 'v1',
        definition: { meaning: available ? '在营可用床位。' : '核定床位。' }
      }],
      content: {
        kind: 'TABLE',
        columns: [{ id: 'town', label: '街镇', kind: 'TEXT' }, { id: 'ratio', label: '每千名老人床位数', kind: 'NUMBER', unit: '张 / 千人' }],
        rows: [
          { id: 'pujin', cells: { town: { kind: 'TEXT', state: 'VALUE', value: '浦锦街道' }, ratio: { kind: 'NUMBER', state: 'VALUE', value: values[0], unit: '张 / 千人', precision: 1 } } },
          { id: 'qibao', cells: { town: { kind: 'TEXT', state: 'VALUE', value: '七宝镇' }, ratio: { kind: 'NUMBER', state: 'VALUE', value: values[1], unit: '张 / 千人', precision: 1 } } }
        ],
        chart: { kind: 'BAR', categoryColumnId: 'town', valueColumnId: 'ratio' }
      },
      actualScope: { region: '浦锦街道、七宝镇', timeRange: { start: '2026-08', end: '2026-08' }, grain: 'MONTH' },
      boundaryNotice: '未提供差异原因证据。'
    }
  };
}

function taskWithResults(): FindDataTaskState {
  const taskId = 'history_task';
  const a = resultSnapshot(taskId, 'A');
  const b = resultSnapshot(taskId, 'B');
  return createMinhangTask({
    taskId,
    requirementRevision: 2,
    searchRevision: 2,
    askPlan: createAskPlan({
      id: 'plan_b', requirementRevision: 2, basedOnSearchRevision: 2, status: 'COMPLETED',
      lastRunResult: { success: true, executedAt: b.executedAt, permissionSnapshot: {} }
    }),
    turns: [
      { turnId: 'turn_a', sender: 'ASSISTANT', createdAt: '', blocks: [{ type: 'ASK_RESULT', id: 'block_a', snapshot: a }] },
      { turnId: 'turn_b', sender: 'ASSISTANT', createdAt: '', blocks: [{ type: 'ASK_RESULT', id: 'block_b', snapshot: b }] }
    ]
  });
}

function taskWithUnreadableOnlyHistory(): FindDataTaskState {
  const taskId = 'unreadable_history_task';
  const snapshot = resultSnapshot(taskId, 'A');
  snapshot.currentReadAccess = 'DENIED';
  return createEmptyTask({
    taskId,
    turns: [{
      turnId: 'unreadable_history_turn',
      sender: 'ASSISTANT',
      createdAt: '',
      blocks: [{ type: 'ASK_RESULT', id: 'unreadable_history_block', snapshot }]
    }]
  });
}

function taskWithCurrentDirectMetricResult(): FindDataTaskState {
  const taskId = 'direct_metric_task';
  const snapshot: AskResultSnapshot = {
    binding: { kind: 'DIRECT_METRIC', taskId, requestId: 'direct_request', metricId: 'met_elderly_population', requirementRevision: 1 },
    operationId: 'direct_operation',
    executedAt: '2026-09-07T00:00:00.000Z',
    metricName: '老年人口数',
    numeratorLabel: '60 岁及以上常住人口',
    resultArtifact: {
      resultRef: { kind: 'SERVICE_RESULT', id: 'direct_result' },
      citations: [{ kind: 'METRIC_DEFINITION', id: 'met_elderly_population', label: '老年人口数', version: 'v1', definition: { meaning: '60 岁及以上常住人口总数。' } }],
      content: { kind: 'SCALAR', label: '浦锦街道老年人口数', value: { kind: 'NUMBER', state: 'VALUE', value: 20000, unit: '人', precision: 0 } },
      actualScope: { region: '浦锦街道', timeRange: { start: '2026-08', end: '2026-08' }, grain: 'MONTH' }
    }
  };
  return createEmptyTask({
    taskId,
    requirementRevision: 1,
    directMetricQuery: { requestId: 'direct_request', metricId: 'met_elderly_population', status: 'COMPLETED', preparedAt: '2026-09-07T00:00:00.000Z' },
    directMetricResult: snapshot,
    turns: [{ turnId: 'direct_turn', sender: 'ASSISTANT', createdAt: '', blocks: [{ type: 'ASK_RESULT', id: 'direct_block', snapshot }] }]
  });
}

function service(overrides: Partial<FindDataService> = {}): FindDataService {
  const submitTurn = vi.fn(async (task: FindDataTaskState, _text: string, operationId?: string): Promise<FindDataEngineResult> => ({
    taskId: task.taskId, operationId: operationId ?? 'operation_turn', events: [{ type: 'ASSISTANT_TURN_RECEIVED', payload: {
      turnId: 'interpretation', nextStatus: 'READY', blocks: [{ type: 'TEXT', id: 'interpretation_text', content: '仅基于指定结果解读。' }]
    } }], assistantBlocks: [], surfaceCommand: { action: 'NO_CHANGE' }
  }));
  return {
    createTask: vi.fn(async () => taskWithResults()), listTasks: vi.fn(async () => []), getTask: vi.fn(async () => taskWithResults()), deleteTask: vi.fn(async () => {}),
    submitTurn, executeAction: vi.fn(async (task, _action, operationId): Promise<FindDataEngineResult> => ({ taskId: task.taskId, operationId: operationId ?? 'operation_action', events: [], assistantBlocks: [], surfaceCommand: { action: 'NO_CHANGE' } })),
    recheckPermissions: vi.fn(async (_task, _ids, _action, operationId?: string): Promise<PermissionRecheckResult> => ({ operationId, decision: 'BLOCKED', updatedPermissions: {} })),
    runAskPlan: vi.fn(), ...overrides
  };
}

describe('historical result targets', () => {
  it('derives A and B only from ASK_RESULT blocks and never falls back to latest', () => {
    const task = taskWithResults();
    const [a, b] = selectResultSnapshots(task);
    expect(a.target.resultRef?.id).toBe('result_a');
    expect(b.target.resultRef?.id).toBe('result_b');
    expect(selectResultTargetByRef(task, { ...a.target, resultRef: { kind: 'SERVICE_RESULT', id: 'missing' } })).toBeUndefined();
    expect(selectCurrentViewedResult(task)).toBeUndefined();

    const opened = findDataReducer(task, { type: 'SURFACE_OPENED', payload: { type: 'RESULT_DETAIL', resultTarget: a.target, resultDetailFocus: 'RESULT' } });
    expect(selectCurrentViewedResult(opened)?.target.resultRef?.id).toBe('result_a');
    expect(opened.askPlan?.id).toBe('plan_b');
    expect(opened.requirementRevision).toBe(2);
    expect(opened.searchRevision).toBe(2);
  });

  it('opens historical A as a read-only result even though current plan B is different', () => {
    const task = taskWithResults();
    const a = selectResultSnapshots(task)[0];
    const command = evaluateSurfacePolicy(resolveInteractionIntent('', task), 'OPEN_RESULT_DETAIL', task.activeSurface, task, { resultTarget: a.target });
    expect(command).toMatchObject({ action: 'OPEN', surface: 'RESULT_DETAIL', resultTarget: a.target });
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', task), 'OPEN_RESULT_DETAIL', task.activeSurface, task, {
      resultTarget: { ...a.target, executedAt: '2026-01-01T00:00:00.000Z' }
    })).toMatchObject({ action: 'NO_CHANGE', blockedReason: expect.stringContaining('未找到') });
  });

  it('opens A without running B and sends A identity when the compact action is used', async () => {
    const task = taskWithResults();
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service({ createTask: vi.fn(async () => task), getTask: vi.fn(async () => task) });
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} taskStoreOverride={store} />);

    const cards = await screen.findAllByLabelText('分析结果');
    fireEvent.click(within(cards[0]).getByRole('button', { name: '查看完整结果' }));
    expect(await screen.findByRole('heading', { name: '分析结果' })).toBeInTheDocument();
    expect(screen.getAllByText(/在营可用养老床位数/).length).toBeGreaterThan(0);
    expect(findData.runAskPlan).not.toHaveBeenCalled();

    fireEvent.click(within(cards[0]).getByRole('button', { name: '解读这份结果' }));
    await waitFor(() => expect(findData.submitTurn).toHaveBeenCalledOnce());
    const context = vi.mocked(findData.submitTurn).mock.calls[0][3];
    expect(context).toEqual(expect.objectContaining({ resultTarget: expect.objectContaining({ resultRef: { kind: 'SERVICE_RESULT', id: 'result_a' }, executedAt: '2026-08-31T10:00:00.000Z' }) }));
    expect(findData.runAskPlan).not.toHaveBeenCalled();
  });

  it('redacts an unauthorized HTTP historical snapshot and never substitutes the current result', async () => {
    const task = taskWithResults();
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service({ createTask: vi.fn(async () => task), getTask: vi.fn(async () => task) });
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} serviceModeOverride="http" taskStoreOverride={store} />);
    const cards = await screen.findAllByLabelText('分析结果');
    expect(cards).toHaveLength(1);
    expect(screen.getByLabelText('历史结果不可读取')).toHaveTextContent('这份历史结果当前不可读取');
    expect(screen.queryByText('15.0 张 / 千人')).not.toBeInTheDocument();
    expect(screen.queryByText('在营可用养老床位数')).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');
    fireEvent.change(input, { target: { value: '回到在营可用床位那份结果，解释浦锦街道为什么更低。' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(findData.submitTurn).not.toHaveBeenCalled();
    expect(screen.getAllByText('这份历史结果当前不可读取').length).toBeGreaterThan(0);
  });

  it('blocks an explicit this-result interpretation when all known HTTP history is unreadable', async () => {
    const task = taskWithUnreadableOnlyHistory();
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service({ createTask: vi.fn(async () => task), getTask: vi.fn(async () => task) });
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} serviceModeOverride="http" taskStoreOverride={store} />);

    const input = await screen.findByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');
    fireEvent.change(input, { target: { value: '解释这份结果' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(findData.submitTurn).not.toHaveBeenCalled();
    expect(findData.runAskPlan).not.toHaveBeenCalled();
    expect(findData.executeAction).not.toHaveBeenCalled();
    expect(await screen.findByText('这份历史结果当前不可读取，不能使用其他结果替代。')).toBeInTheDocument();
  });

  it('blocks an explicit Result A interpretation when all known HTTP history is unreadable', async () => {
    const task = taskWithUnreadableOnlyHistory();
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service({ createTask: vi.fn(async () => task), getTask: vi.fn(async () => task) });
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} serviceModeOverride="http" taskStoreOverride={store} />);

    const input = await screen.findByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');
    fireEvent.change(input, { target: { value: '解释结果 A' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(findData.submitTurn).not.toHaveBeenCalled();
    expect(findData.runAskPlan).not.toHaveBeenCalled();
    expect(findData.executeAction).not.toHaveBeenCalled();
    expect(await screen.findByText('这份历史结果当前不可读取，不能使用其他结果替代。')).toBeInTheDocument();
  });

  it('keeps a normal Find Data why question context-free when all HTTP history is unreadable', async () => {
    const task = taskWithUnreadableOnlyHistory();
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service({ createTask: vi.fn(async () => task), getTask: vi.fn(async () => task) });
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} serviceModeOverride="http" taskStoreOverride={store} />);

    const input = await screen.findByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');
    fireEvent.change(input, { target: { value: '为什么推荐这个表？' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(findData.submitTurn).toHaveBeenCalledOnce());
    expect(vi.mocked(findData.submitTurn).mock.calls[0][3]).toBeUndefined();
    expect(screen.queryByText('这份历史结果当前不可读取，不能使用其他结果替代。')).not.toBeInTheDocument();
  });

  it('redacts a cached unauthorized historical detail surface instead of rendering its snapshot', async () => {
    const task = taskWithResults();
    const target = selectResultSnapshots(task)[0].target;
    task.activeSurface = { type: 'RESULT_DETAIL', resultTarget: target, resultDetailFocus: 'RESULT' };
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    render(<DataAssistantFindDataWorkspace serviceOverride={service({ createTask: vi.fn(async () => task), getTask: vi.fn(async () => task) })} serviceModeOverride="http" taskStoreOverride={store} />);

    const unavailableSurfaces = await screen.findAllByLabelText('历史结果不可读取');
    expect(unavailableSurfaces.at(-1)).toHaveTextContent('不会展示浏览器缓存的结果内容或依据');
    expect(screen.queryByText('15.0 张 / 千人')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '分析结果' })).not.toBeInTheDocument();
  });

  it('excludes an unauthorized HTTP result from result-target clarification while authorized history remains usable', async () => {
    const task = taskWithResults();
    const available = task.turns[0].blocks[0];
    if (available.type === 'ASK_RESULT') available.snapshot.currentReadAccess = 'DENIED';
    const authorized = resultSnapshot(task.taskId, 'A');
    authorized.binding = { taskId: task.taskId, askPlanId: 'plan_c', requirementRevision: 1, searchRevision: 1 };
    authorized.executedAt = '2026-08-31T12:00:00.000Z';
    authorized.numeratorLabel = '可读取的历史结果';
    authorized.resultArtifact.resultRef = { kind: 'SERVICE_RESULT', id: 'result_c' };
    authorized.currentReadAccess = 'AUTHORIZED';
    task.turns.push({ turnId: 'turn_c', sender: 'ASSISTANT', createdAt: '', blocks: [{ type: 'ASK_RESULT', id: 'block_c', snapshot: authorized }] });
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service({ createTask: vi.fn(async () => task), getTask: vi.fn(async () => task) });
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} serviceModeOverride="http" taskStoreOverride={store} />);

    const input = await screen.findByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');
    fireEvent.change(input, { target: { value: '解释这个结果' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('你希望解读哪一份结果？')).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /在营可用养老床位数/ })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /可读取的历史结果/ })).toBeInTheDocument();
    expect(findData.submitTurn).not.toHaveBeenCalled();
  });

  it('opens a freshly authorized HTTP historical result without exposing an unauthorized sibling', async () => {
    const task = taskWithResults();
    const available = task.turns[0].blocks[0];
    if (available.type === 'ASK_RESULT') available.snapshot.currentReadAccess = 'AUTHORIZED';
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    render(<DataAssistantFindDataWorkspace serviceOverride={service({ createTask: vi.fn(async () => task), getTask: vi.fn(async () => task) })} serviceModeOverride="http" taskStoreOverride={store} />);
    const cards = await screen.findAllByLabelText('分析结果');
    expect(cards).toHaveLength(2);
    fireEvent.click(within(cards[0]).getByRole('button', { name: '查看完整结果' }));
    expect(await screen.findByRole('heading', { name: '分析结果' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭结果详情' })).toHaveAttribute('title', '关闭结果详情');
  });

  it('binds an explicit A text reference to A and asks only for a result object when A/B is ambiguous', async () => {
    const task = taskWithResults();
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service();
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} taskStoreOverride={store} />);
    const input = await screen.findByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');

    fireEvent.change(input, { target: { value: '回到在营可用床位那份结果，解释浦锦街道为什么更低。' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(findData.submitTurn).toHaveBeenCalledOnce());
    expect(vi.mocked(findData.submitTurn).mock.calls[0][3]?.resultTarget?.resultRef?.id).toBe('result_a');

    fireEvent.change(input, { target: { value: '解释这个结果' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('你希望解读哪一份结果？')).toBeInTheDocument();
    expect(findData.submitTurn).toHaveBeenCalledOnce();
    const option = screen.getAllByRole('radio')[0];
    fireEvent.click(option);
    fireEvent.click(screen.getByRole('button', { name: '解读此结果' }));
    await waitFor(() => expect(findData.submitTurn).toHaveBeenCalledTimes(2));
    expect(vi.mocked(findData.submitTurn).mock.calls[1][3]?.resultTarget?.resultRef?.id).toBe('result_a');
  });

  it('keeps resource and permission questions in the original Find Data turn path', async () => {
    const task = taskWithResults();
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service();
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} taskStoreOverride={store} />);
    const input = await screen.findByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');

    const questions = ['为什么推荐这个表？', '为什么这个资源不能用？', '这两个资源有什么差异？'];
    for (const [index, text] of questions.entries()) {
      fireEvent.change(input, { target: { value: text } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(findData.submitTurn).toHaveBeenCalledTimes(index + 1));
    }

    for (const call of vi.mocked(findData.submitTurn).mock.calls) {
      expect(call[3]).toBeUndefined();
    }
  });

  it('continues the explicitly viewed readable result for a focused result follow-up', async () => {
    const task = taskWithResults();
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service();
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} taskStoreOverride={store} />);
    const cards = await screen.findAllByLabelText('分析结果');
    fireEvent.click(within(cards[0]).getByRole('button', { name: '查看完整结果' }));
    const input = screen.getByPlaceholderText('发送找数据意图、提出追问或输入口径调整要求…');
    fireEvent.change(input, { target: { value: '为什么这里更低？' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(findData.submitTurn).toHaveBeenCalledOnce());
    expect(vi.mocked(findData.submitTurn).mock.calls[0][3]?.resultTarget?.resultRef?.id).toBe('result_a');
  });

  it('keeps the current direct metric result in its PR-2 result and definition surfaces while interpretation carries ResultTarget', async () => {
    const task = taskWithCurrentDirectMetricResult();
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service();
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} taskStoreOverride={store} />);
    const result = await screen.findByLabelText('分析结果');

    expect(within(result).getByRole('button', { name: '查看完整结果' })).toBeEnabled();
    expect(within(result).getByRole('button', { name: '查看指标口径' })).toBeEnabled();
    expect(within(result).getByRole('button', { name: '解读这份结果' })).toBeEnabled();
    fireEvent.click(within(result).getByRole('button', { name: '查看完整结果' }));
    expect(await screen.findByRole('heading', { name: '指标查询结果' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '关闭指标查询结果' }));
    fireEvent.click(within(result).getByRole('button', { name: '查看指标口径' }));
    expect(await screen.findByRole('heading', { name: '本次指标口径' })).toBeInTheDocument();
    expect(findData.executeAction).not.toHaveBeenCalled();
    expect(findData.runAskPlan).not.toHaveBeenCalled();

    fireEvent.click(within(result).getByRole('button', { name: '解读这份结果' }));
    await waitFor(() => expect(findData.submitTurn).toHaveBeenCalledOnce());
    expect(vi.mocked(findData.submitTurn).mock.calls[0][3]?.resultTarget).toMatchObject({
      resultRef: { kind: 'SERVICE_RESULT', id: 'direct_result' },
      binding: { kind: 'DIRECT_METRIC', requestId: 'direct_request', metricId: 'met_elderly_population' }
    });
    expect(findData.runAskPlan).not.toHaveBeenCalled();
  });

  it('does not let a late A interpretation replace a result detail the user changed to B', async () => {
    const task = taskWithResults();
    const targets = selectResultSnapshots(task);
    let resolveTurn: ((result: FindDataEngineResult) => void) | undefined;
    const submitTurn = vi.fn(() => new Promise<FindDataEngineResult>((resolve) => { resolveTurn = resolve; }));
    const store = new MemoryTaskStore();
    store.save(task);
    store.currentTaskId = task.taskId;
    const findData = service({ submitTurn });
    render(<DataAssistantFindDataWorkspace serviceOverride={findData} taskStoreOverride={store} />);

    const cards = await screen.findAllByLabelText('分析结果');
    fireEvent.click(within(cards[0]).getByRole('button', { name: '查看完整结果' }));
    fireEvent.click(within(cards[0]).getByRole('button', { name: '解读这份结果' }));
    await waitFor(() => expect(submitTurn).toHaveBeenCalledOnce());
    fireEvent.click(within(cards[1]).getByRole('button', { name: '查看完整结果' }));
    expect(screen.getAllByText(/养老床位核定数/).length).toBeGreaterThan(0);

    await act(async () => {
      resolveTurn?.({
        taskId: task.taskId,
        operationId: (submitTurn.mock.calls as unknown as Array<[FindDataTaskState, string, string]>)[0][2],
        events: [{ type: 'ASSISTANT_TURN_RECEIVED', payload: { turnId: 'late_a', nextStatus: 'READY', blocks: [{ type: 'TEXT', id: 'late_text', content: 'A 的迟到解读' }] } }],
        assistantBlocks: [],
        surfaceCommand: { action: 'REPLACE', surface: 'RESULT_DETAIL', resultTarget: targets[0].target }
      });
    });
    expect(await screen.findByText('A 的迟到解读')).toBeInTheDocument();
    expect(screen.getAllByText(/养老床位核定数/).length).toBeGreaterThan(0);
  });
});
