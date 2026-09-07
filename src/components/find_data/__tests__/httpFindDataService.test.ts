import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpFindDataService } from '../services/HttpFindDataService';
import { createEmptyTask } from './testUtils/findDataFactories';
import { createAskPlan, createMinhangTask } from './testUtils/findDataFactories';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HTTP find-data task lifecycle', () => {
  it('lists, restores, and deletes tasks through the task REST contract', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/tasks') && !init?.method) {
        return new Response(JSON.stringify([{ taskId: 'task_1', title: '恢复任务', status: 'READY', updatedAt: '2026-09-04T00:00:00.000Z' }]));
      }
      if (url.endsWith('/tasks/task_1') && !init?.method) {
        return new Response(JSON.stringify(createEmptyTask({ taskId: 'task_1', title: '恢复任务' })));
      }
      if (url.endsWith('/tasks/task_1') && init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      return new Response(null, { status: 404, statusText: 'Not Found' });
    });
    vi.stubGlobal('fetch', fetchMock);
    const service = new HttpFindDataService('/api/find-data/');

    await expect(service.listTasks()).resolves.toMatchObject([{ taskId: 'task_1', title: '恢复任务' }]);
    await expect(service.getTask('task_1')).resolves.toMatchObject({ taskId: 'task_1', title: '恢复任务' });
    await expect(service.deleteTask('task_1')).resolves.toBeUndefined();

    expect(fetchMock.mock.calls.map(([url, init]) => [String(url), (init as RequestInit | undefined)?.method])).toEqual([
      ['/api/find-data/tasks', undefined],
      ['/api/find-data/tasks/task_1', undefined],
      ['/api/find-data/tasks/task_1', 'DELETE']
    ]);
  });

  it('preserves the client operation id when submitting a state-changing request', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ taskId: 'task_1', events: [], assistantBlocks: [], surfaceCommand: { action: 'NO_CHANGE' } })));
    vi.stubGlobal('fetch', fetchMock);
    const service = new HttpFindDataService('/api/find-data');
    const result = await service.submitTurn(createEmptyTask({ taskId: 'task_1' }), '继续找数据', 'operation_1');
    expect(result.operationId).toBe('operation_1');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/find-data/tasks/task_1/turns');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
    expect(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body)).toContain('operation_1');
  });

  it('passes the exact detail reference to task creation and rejects a Mock direct-metric result', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST' && String(_input).endsWith('/tasks')) return new Response(JSON.stringify(createEmptyTask({ taskId: 'task_direct' })));
      return new Response(JSON.stringify({
        taskId: 'task_direct', events: [{
          type: 'DIRECT_METRIC_RESULT_RECEIVED', payload: {
            snapshot: {
              binding: { kind: 'DIRECT_METRIC', taskId: 'task_direct', requestId: 'request_1', metricId: 'met_elderly_population', requirementRevision: 0 },
              executedAt: '', metricName: '老年人口数', numeratorLabel: '60 岁及以上常住人口', dataOrigin: 'MOCK_FIXTURE', resultArtifact: {}
            }
          }
        }], assistantBlocks: []
      }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const service = new HttpFindDataService('/api/find-data');
    await service.createTask({
      entryContext: {
        entryId: 'metric:met_elderly_population:query-value', source: 'METRIC_DETAIL',
        target: { kind: 'METRIC', id: 'met_elderly_population', version: 'v1.1.0' },
        intent: 'QUERY_VALUE', initialText: '查询指标「老年人口数」'
      }
    });
    expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body))).toMatchObject({
      entryContext: { target: { kind: 'METRIC', id: 'met_elderly_population', version: 'v1.1.0' } }
    });
    await expect(service.submitTurn(createEmptyTask({ taskId: 'task_direct' }), '查询指标「老年人口数」', 'operation_direct')).rejects.toThrow('不能使用演示数据来源');
  });

  it('sends only Ask plan identity, revisions, and idempotency data to the server', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, executedAt: '', permissionSnapshot: {}, dataOrigin: 'LIVE_QUERY' })));
    vi.stubGlobal('fetch', fetchMock);
    const service = new HttpFindDataService('/api/find-data');
    const task = createMinhangTask({ askPlan: createAskPlan() });
    await service.runAskPlan(task, { askPlanId: 'plan_test', expectedRequirementRevision: 1, expectedSearchRevision: 1, idempotencyKey: 'idem_1' }, 'operation_ask');
    const call = (fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit]>)[0];
    const body = JSON.parse(String(call?.[1].body));
    expect(body).toEqual({ askPlanId: 'plan_test', expectedRequirementRevision: 1, expectedSearchRevision: 1, idempotencyKey: 'idem_1', operationId: 'operation_ask' });
    expect(body.calculationSpec).toBeUndefined();
  });

  it('rejects an Ask response without server dataOrigin', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, executedAt: '', permissionSnapshot: {} }))));
    const service = new HttpFindDataService('/api/find-data');
    const task = createMinhangTask({ askPlan: createAskPlan() });
    await expect(service.runAskPlan(task, { askPlanId: 'plan_test', expectedRequirementRevision: 1, expectedSearchRevision: 1, idempotencyKey: 'idem_1' })).rejects.toThrow('实时查询数据');
  });

  it('rejects a Mock result returned by the HTTP service', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      success: true, executedAt: '', permissionSnapshot: {}, dataOrigin: 'MOCK_FIXTURE'
    }))));
    const service = new HttpFindDataService('/api/find-data');
    const task = createMinhangTask({ askPlan: createAskPlan() });
    await expect(service.runAskPlan(task, { askPlanId: 'plan_test', expectedRequirementRevision: 1, expectedSearchRevision: 1, idempotencyKey: 'idem_1' })).rejects.toThrow('不能使用演示数据来源');
  });

  it('preserves typed result content and service result references without a Mock fallback', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      success: true, executedAt: '2026-09-06T00:00:00.000Z', permissionSnapshot: {}, dataOrigin: 'LIVE_QUERY',
      resultArtifact: {
        resultRef: { kind: 'SERVICE_RESULT', id: 'result_123' },
        content: {
          kind: 'SCALAR', label: '正式指标值',
          value: { kind: 'NUMBER', state: 'VALUE', value: 0, unit: '户', precision: 0 }
        }
      }
    }))));
    const service = new HttpFindDataService('/api/find-data');
    const task = createMinhangTask({ askPlan: createAskPlan() });
    const result = await service.runAskPlan(task, { askPlanId: 'plan_test', expectedRequirementRevision: 1, expectedSearchRevision: 1, idempotencyKey: 'idem_1' });
    expect(result.dataOrigin).toBe('LIVE_QUERY');
    expect(result.resultArtifact).toMatchObject({ resultRef: { id: 'result_123' }, content: { kind: 'SCALAR', value: { value: 0 } } });
  });
});
