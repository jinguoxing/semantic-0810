import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpFindDataService } from '../services/HttpFindDataService';
import { createEmptyTask } from './testUtils/findDataFactories';

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
});
