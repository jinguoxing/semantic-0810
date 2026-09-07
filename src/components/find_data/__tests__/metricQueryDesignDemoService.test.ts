import { describe, expect, it } from 'vitest';
import { FindDataTaskState } from '../model/FindDataTask';
import { FindDataEvent } from '../model/findDataEvents';
import { findDataReducer } from '../model/findDataReducer';
import { MetricQueryDesignDemoService } from '../services/MetricQueryDesignDemoService';
import { createEmptyTask } from './testUtils/findDataFactories';

function apply(task: FindDataTaskState, events: FindDataEvent[]): FindDataTaskState {
  return events.reduce(findDataReducer, task);
}

describe('MetricQueryDesignDemoService', () => {
  it('answers a definition-only metric request without running a numeric query', async () => {
    const service = new MetricQueryDesignDemoService();
    const created = await service.createTask({
      entryContext: {
        entryId: 'metric:met_elderly_population:view-definition', source: 'METRIC_DETAIL',
        target: { kind: 'METRIC', id: 'met_elderly_population', version: 'v1.1.0' }, intent: 'VIEW_DEFINITION', initialText: '查看指标定义'
      }
    });
    const response = await service.submitTurn(created, '查看指标定义');

    expect(response.events.some((event) => event.type === 'DIRECT_METRIC_QUERY_STARTED' || event.type === 'DIRECT_METRIC_RESULT_RECEIVED')).toBe(false);
    expect(response.assistantBlocks).toContainEqual(expect.objectContaining({ type: 'TEXT', content: expect.stringContaining('v1.1.0') }));
  });

  it('returns a scoped scalar through a direct metric binding without creating a composition plan', async () => {
    const service = new MetricQueryDesignDemoService();
    const created = await service.createTask({
      entryContext: {
        entryId: 'metric:met_elderly_population:query-value',
        source: 'METRIC_DETAIL',
        target: { kind: 'METRIC', id: 'met_elderly_population', label: '老年人口数', version: 'v1.1.0' },
        intent: 'QUERY_VALUE',
        initialText: '查询指标「老年人口数」',
        knownConditions: { region: '浦锦街道', timeRange: { start: '2026-08', end: '2026-08' } }
      }
    });

    const response = await service.submitTurn(created, '查询指标「老年人口数」', 'turn_1');
    const settled = apply(created, response.events);

    expect(settled.askPlan).toBeUndefined();
    expect(settled.dataSolution.items).toEqual([]);
    expect(settled.directMetricResult).toMatchObject({
      binding: { kind: 'DIRECT_METRIC', metricId: 'met_elderly_population' },
      dataOrigin: 'MOCK_FIXTURE',
      resultArtifact: {
        content: { kind: 'SCALAR', value: { value: 20000, unit: '人' } },
        actualScope: { region: '浦锦街道', timeRange: { start: '2026-08', end: '2026-08' } }
      }
    });
    expect(settled.directMetricResult?.resultArtifact.citations).toMatchObject([
      { kind: 'METRIC_DEFINITION', id: 'met_elderly_population', version: 'v1.1.0' }
    ]);
  });

  it('keeps the bed definition unselected, confirms it once, then runs a separate design query', async () => {
    const service = new MetricQueryDesignDemoService();
    const created = await service.createTask();
    const clarification = await service.submitTurn(created, '查询 2026 年 8 月七宝镇养老床位数', 'turn_2');
    const waiting = apply(created, clarification.events);
    const question = waiting.turns.flatMap((turn) => turn.blocks).find((block) => block.type === 'CLARIFICATION');

    expect(question).toMatchObject({
      question: {
        id: 'design_bed_definition',
        submitLabel: '使用此口径继续查询',
        options: [
          { id: 'available' },
          { id: 'approved' }
        ]
      }
    });
    if (!question || question.type !== 'CLARIFICATION') throw new Error('expected clarification');
    expect(question.question.resolution).toBeUndefined();
    expect(question.question.options.every((option) => option.recommended !== true)).toBe(true);

    const confirmed = await service.executeAction(waiting, {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: question.question.id, selectedOptionIds: ['available'] }
    }, 'confirm_1');
    const prepared = apply(waiting, confirmed.events);
    expect(prepared.directMetricQuery).toMatchObject({ status: 'READY', metricId: 'design_elderly_bed_capacity' });
    expect(prepared.directMetricResult).toBeUndefined();

    const result = await service.executeAction(prepared, {
      actionCode: 'RUN_METRIC_QUERY',
      payload: { requestId: prepared.directMetricQuery?.requestId }
    }, 'run_1');
    const settled = apply(prepared, result.events);
    expect(settled.turns.flatMap((turn) => turn.blocks).filter((block) => block.type === 'CLARIFICATION').at(-1)).toMatchObject({
      question: { resolution: { status: 'RESOLVED', selectedOptionIds: ['available'] } }
    });
    expect(settled.directMetricResult).toMatchObject({
      binding: { kind: 'DIRECT_METRIC' },
      resultArtifact: { content: { kind: 'SCALAR', value: { value: 800, unit: '张' } } }
    });
  });

  it('keeps figure-05 A/B results isolated and interprets only the exact selected A', async () => {
    const service = new MetricQueryDesignDemoService();
    const created = await service.createTask();
    const history = await service.submitTurn(created, '生成两份床位比较结果', 'history_1');
    const settled = apply(created, history.events);
    const snapshots = settled.turns.flatMap((turn) => turn.blocks)
      .filter((block): block is Extract<typeof block, { type: 'ASK_RESULT' }> => block.type === 'ASK_RESULT')
      .map((block) => block.snapshot);
    expect(snapshots).toHaveLength(2);
    expect(snapshots.map((snapshot) => snapshot.resultArtifact.resultRef?.id)).toEqual(['design-history-available', 'design-history-approved']);
    expect(history.events.some((event) => event.type === 'DIRECT_METRIC_QUERY_STARTED' || event.type === 'DIRECT_METRIC_RESULT_RECEIVED')).toBe(false);

    const a = snapshots[0];
    const response = await service.submitTurn(settled, '解释浦锦街道为什么比七宝镇低', 'interpret_a', {
      resultTarget: { resultRef: a.resultArtifact.resultRef, binding: a.binding, executedAt: a.executedAt }
    });
    const text = JSON.stringify(response.assistantBlocks);
    expect(text).toContain('相差 5.0');
    expect(text).not.toContain('相差 2.5');
    expect(text).toContain('不能据此判断差异原因');
    expect(response.events.some((event) => event.type === 'DIRECT_METRIC_QUERY_STARTED' || event.type === 'DIRECT_METRIC_RESULT_RECEIVED')).toBe(false);
  });

  it('drops a late direct-metric result when its request, requirement revision, or metric identity is no longer current', async () => {
    const service = new MetricQueryDesignDemoService();
    const created = await service.createTask({
      entryContext: {
        entryId: 'metric:met_elderly_population:query-value', source: 'METRIC_DETAIL',
        target: { kind: 'METRIC', id: 'met_elderly_population' }, intent: 'QUERY_VALUE', initialText: '查询指标「老年人口数」'
      }
    });
    const response = await service.submitTurn(created, '查询 2026 年 8 月浦锦街道 60 岁及以上常住人口数');
    const lateResult = response.events.find((event) => event.type === 'DIRECT_METRIC_RESULT_RECEIVED');
    if (!lateResult || lateResult.type !== 'DIRECT_METRIC_RESULT_RECEIVED') throw new Error('expected direct result');
    const binding = lateResult.payload.snapshot.binding;
    if (!('kind' in binding) || binding.kind !== 'DIRECT_METRIC') throw new Error('expected direct result binding');

    const current = createEmptyTask({
      taskId: created.taskId,
      requirementRevision: binding.requirementRevision + 1,
      directMetricQuery: {
        requestId: binding.requestId,
        metricId: binding.metricId,
        source: { kind: 'USER_EXPLICIT' },
        status: 'RUNNING',
        preparedAt: '2026-09-07T00:00:00.000Z'
      }
    });
    expect(findDataReducer(current, lateResult).directMetricResult).toBeUndefined();

    const matchingRevision = createEmptyTask({
      taskId: created.taskId,
      requirementRevision: binding.requirementRevision,
      directMetricQuery: {
        requestId: binding.requestId,
        metricId: binding.metricId,
        source: { kind: 'USER_EXPLICIT' },
        status: 'RUNNING',
        preparedAt: '2026-09-07T00:00:00.000Z'
      }
    });
    const wrongMetric = {
      ...lateResult,
      payload: { snapshot: { ...lateResult.payload.snapshot, binding: { ...binding, metricId: 'met_resident_population' } } }
    };
    expect(findDataReducer(matchingRevision, wrongMetric).directMetricResult).toBeUndefined();
  });
});
