import { describe, expect, it } from 'vitest';
import { FindDataTaskState } from '../model/FindDataTask';
import { FindDataEvent } from '../model/findDataEvents';
import { findDataReducer } from '../model/findDataReducer';
import { selectEffectiveDataSolution } from '../model/findDataSelectors';
import { MetricQueryDesignDemoService } from '../services/MetricQueryDesignDemoService';
import { createEmptyTask } from './testUtils/findDataFactories';

function apply(task: FindDataTaskState, events: FindDataEvent[]): FindDataTaskState {
  return events.reduce(findDataReducer, task);
}

async function submit(service: MetricQueryDesignDemoService, task: FindDataTaskState, text: string, turnId: string) {
  const submitted = findDataReducer(task, { type: 'USER_TURN_SUBMITTED', payload: { text, turnId } });
  const result = await service.submitTurn(submitted, text, turnId);
  return { result, task: apply(submitted, result.events) };
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

  it('keeps Find, direct population query, and answer in one task without a re-Find', async () => {
    const service = new MetricQueryDesignDemoService();
    const created = await service.createTask();
    const goal = await submit(
      service,
      created,
      '我想比较浦锦街道和七宝镇 2026 年 8 月的养老服务供给情况，先帮我看看需要哪些数据。',
      'continuity_goal'
    );

    expect(goal.task.taskId).toBe(created.taskId);
    expect(goal.task.title).toBe('浦锦、七宝养老服务供给比较');
    expect(goal.result.events.filter((event) => event.type === 'TASK_TITLE_UPDATED')).toHaveLength(1);
    expect(goal.task.activeSurface.type).toBe('SOLUTION');
    expect(selectEffectiveDataSolution(goal.task)?.items).toMatchObject([
      { resourceId: 'r01', role: 'CORE', inclusionState: 'SELECTED' },
      { resourceId: 'r04', role: 'CORE', inclusionState: 'SELECTED', selectionGroupId: 'bed_definition_alternative' },
      { resourceId: 'r05', role: 'CORE', inclusionState: 'NOT_INCLUDED', selectionGroupId: 'bed_definition_alternative' }
    ]);
    expect(goal.task.resources.r01.executionRef).toEqual({ kind: 'METRIC', id: 'met_elderly_population', version: 'v1.1.0' });
    expect(goal.task.resources.r04.executionRef).toBeUndefined();
    expect(goal.task.resources.r05.executionRef).toBeUndefined();

    const population = await submit(
      service,
      goal.task,
      '先查询 2026 年 8 月浦锦街道的 60 岁及以上常住人口数。',
      'continuity_population'
    );
    expect(population.task.taskId).toBe(created.taskId);
    expect(population.task.title).toBe('浦锦、七宝养老服务供给比较');
    expect(population.result.events.some((event) => event.type === 'TASK_TITLE_UPDATED')).toBe(false);
    expect(population.result.events.some((event) => event.type === 'SEARCH_STARTED' || event.type === 'SEARCH_RESULTS_RECEIVED')).toBe(false);
    expect(population.result.surfaceCommand).toMatchObject({ action: 'CLOSE', surface: 'CLOSED' });
    expect(population.task.requirementRevision).toBe(goal.task.requirementRevision);
    expect(population.task.searchRevision).toBe(goal.task.searchRevision);
    expect(population.task.activeSurface.type).toBe('SOLUTION');
    expect(population.task.directMetricQuery).toMatchObject({
      metricId: 'met_elderly_population',
      source: {
        kind: 'DATA_SOLUTION', resourceId: 'r01',
        requirementRevision: goal.task.requirementRevision,
        searchRevision: goal.task.searchRevision
      },
      requestedConditions: {
        region: '浦锦街道', timeRange: { start: '2026-08', end: '2026-08' }, populationDefinition: '60 岁及以上常住人口'
      }
    });

    const result = await service.executeAction(population.task, {
      actionCode: 'RUN_METRIC_QUERY', payload: { requestId: population.task.directMetricQuery?.requestId }
    }, 'continuity_population_run');
    const settled = apply(population.task, result.events);
    expect(settled.taskId).toBe(created.taskId);
    expect(settled.dataSolution).toEqual(population.task.dataSolution);
    expect(settled.directMetricResult).toMatchObject({
      resultArtifact: { content: { kind: 'SCALAR', value: { value: 20000, unit: '人' } } }
    });
  });

  it('uses solution alternatives for bed clarification and executes only after submit', async () => {
    const service = new MetricQueryDesignDemoService();
    const created = await service.createTask();
    const goal = await submit(service, created, '我想比较浦锦街道和七宝镇 2026 年 8 月的养老服务供给情况，先帮我看看需要哪些数据。', 'bed_goal');
    // Clarification provenance must not depend on a retained search candidate snapshot.
    const withoutCandidates = { ...goal.task, searchResult: { ...goal.task.searchResult, candidateIds: [], candidateSnapshot: [], returnedCount: 0 } };
    const clarification = await submit(service, withoutCandidates, '查询 2026 年 8 月七宝镇的养老床位数。', 'bed_request');
    const question = clarification.task.turns.flatMap((turn) => turn.blocks)
      .find((block) => block.type === 'CLARIFICATION' && block.question.id === 'design_solution_bed_definition');

    expect(clarification.task.taskId).toBe(created.taskId);
    expect(clarification.result.events.some((event) => event.type === 'SEARCH_STARTED' || event.type === 'SEARCH_RESULTS_RECEIVED')).toBe(false);
    expect(clarification.result.surfaceCommand).toMatchObject({ action: 'CLOSE', surface: 'CLOSED' });
    expect(clarification.task.activeSurface.type).toBe('SOLUTION');
    expect(question).toMatchObject({
      question: {
        resolution: { status: 'OPEN', selectedOptionIds: [] },
        options: [
          { id: 'r04', label: '在营可用养老床位数', description: '用于了解本口径下的在营可用容量。' },
          { id: 'r05', label: '养老床位核定数', description: '用于了解核定容量，不等于实际可用容量。' }
        ]
      }
    });
    if (!question || question.type !== 'CLARIFICATION') throw new Error('expected solution clarification');
    expect(question.question.options.every((option) => option.recommended !== true)).toBe(true);

    const confirmed = await service.executeAction(clarification.task, {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: question.question.id, selectedOptionIds: ['r04'] }
    }, 'bed_confirm');
    const prepared = apply(clarification.task, confirmed.events);
    expect(prepared.directMetricQuery).toMatchObject({
      metricId: 'design_elderly_bed_capacity', source: { kind: 'USER_EXPLICIT' },
      requestedConditions: { region: '七宝镇', timeRange: { start: '2026-08', end: '2026-08' }, bedDefinition: '在营可用养老床位数' }
    });
    expect(prepared.turns.flatMap((turn) => turn.blocks).find((block) => block.type === 'CLARIFICATION' && block.question.id === question.question.id)).toMatchObject({
      question: { resolution: { status: 'RESOLVED', selectedOptionIds: ['r04'] } }
    });

    const executed = await service.executeAction(prepared, {
      actionCode: 'RUN_METRIC_QUERY', payload: { requestId: prepared.directMetricQuery?.requestId }
    }, 'bed_run');
    const settled = apply(prepared, executed.events);
    expect(settled.taskId).toBe(created.taskId);
    expect(settled.title).toBe('浦锦、七宝养老服务供给比较');
    expect(settled.directMetricResult).toMatchObject({
      resultArtifact: { content: { kind: 'SCALAR', value: { value: 800, unit: '张' } } }
    });

    const approvedClarification = await submit(service, settled, '查询 2026 年 8 月七宝镇的养老床位数。', 'bed_approved_request');
    const approvedQuestion = approvedClarification.task.turns.flatMap((turn) => turn.blocks).reverse()
      .find((block) => block.type === 'CLARIFICATION' && block.question.id === 'design_solution_bed_definition');
    if (!approvedQuestion || approvedQuestion.type !== 'CLARIFICATION') throw new Error('expected approved clarification');
    const approvedPrepared = apply(approvedClarification.task, (await service.executeAction(approvedClarification.task, {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: approvedQuestion.question.id, selectedOptionIds: ['r05'] }
    }, 'bed_approved_confirm')).events);
    const approvedResult = await service.executeAction(approvedPrepared, {
      actionCode: 'RUN_METRIC_QUERY', payload: { requestId: approvedPrepared.directMetricQuery?.requestId }
    }, 'bed_approved_run');
    expect(apply(approvedPrepared, approvedResult.events).directMetricResult).toMatchObject({
      resultArtifact: { content: { kind: 'SCALAR', value: { value: 1000, unit: '张' } } }
    });
  });

  it('keeps a one-off month override local and leaves unsupported demo data as a query failure', async () => {
    const service = new MetricQueryDesignDemoService();
    const created = await service.createTask();
    const goal = await submit(service, created, '我想比较浦锦街道和七宝镇 2026 年 8 月的养老服务供给情况，先帮我看看需要哪些数据。', 'override_goal');
    const override = await submit(service, goal.task, '那浦锦 7 月是多少？', 'override_turn');
    expect(override.task.requirementRevision).toBe(goal.task.requirementRevision);
    expect(override.task.searchRevision).toBe(goal.task.searchRevision);
    expect(override.task.dataSolution.state).toBe('READY');
    expect(override.task.directMetricQuery?.requestedConditions?.timeRange).toEqual({ start: '2026-07', end: '2026-07' });
    expect(override.result.events.some((event) => event.type === 'SEARCH_STARTED')).toBe(false);

    const failed = await service.executeAction(override.task, {
      actionCode: 'RUN_METRIC_QUERY', payload: { requestId: override.task.directMetricQuery?.requestId }
    }, 'override_run');
    const settled = apply(override.task, failed.events);
    expect(settled.directMetricQuery).toMatchObject({ status: 'FAILED' });
    expect(JSON.stringify(failed.assistantBlocks)).toContain('演示数据未覆盖该月份');
  });

  it('stales the current solution only for an explicit task requirement change and preserves prior result history', async () => {
    const service = new MetricQueryDesignDemoService();
    const created = await service.createTask();
    const goal = await submit(service, created, '我想比较浦锦街道和七宝镇 2026 年 8 月的养老服务供给情况，先帮我看看需要哪些数据。', 'change_goal');
    const prepared = await submit(service, goal.task, '先查询 2026 年 8 月浦锦街道的 60 岁及以上常住人口数。', 'change_population');
    const executed = await service.executeAction(prepared.task, {
      actionCode: 'RUN_METRIC_QUERY', payload: { requestId: prepared.task.directMetricQuery?.requestId }
    }, 'change_population_run');
    const withResult = apply(prepared.task, executed.events);
    const changed = await submit(service, withResult, '后续都按核定床位。', 'requirement_change');

    expect(changed.task.taskId).toBe(created.taskId);
    expect(changed.task.title).toBe('浦锦、七宝养老服务供给比较');
    expect(changed.task.requirementRevision).toBe(withResult.requirementRevision + 1);
    expect(changed.task.searchRevision).toBe(withResult.searchRevision);
    expect(changed.task.dataSolution.state).toBe('STALE');
    expect(changed.task.directMetricResult).toBeUndefined();
    expect(changed.task.turns.flatMap((turn) => turn.blocks).some((block) => block.type === 'ASK_RESULT')).toBe(true);
    expect(changed.result.events.some((event) => event.type === 'SEARCH_STARTED' || event.type === 'SEARCH_RESULTS_RECEIVED')).toBe(false);
  });
});
