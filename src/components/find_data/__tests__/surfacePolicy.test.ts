import { describe, expect, it } from 'vitest';
import { evaluateSurfacePolicy, resolveInteractionIntent } from '../policy/surfacePolicy';
import { createAskPlan, createEmptyTask, createMinhangTask, createResource } from './testUtils/findDataFactories';

describe('surface policy and structured natural-language intent', () => {
  it.each(['这个表有哪些字段？', '它有多少字段', '为什么推荐它', '当前还缺什么', '这两个资源有什么不同'])(
    'keeps ordinary question in conversation: %s',
    (text) => {
      const intent = resolveInteractionIntent(text, createEmptyTask());
      expect(intent.kind).toBe('QUESTION');
      expect(evaluateSurfacePolicy(intent, undefined, { type: 'COMPARE' }, createEmptyTask())).toEqual({ action: 'NO_CHANGE' });
    }
  );

  it('recognizes explicit comparison without routing ordinary comparison questions', () => {
    expect(resolveInteractionIntent('比较这两张表', createEmptyTask())).toMatchObject({ kind: 'OPEN_SURFACE', surface: 'COMPARE', explicit: true });
    expect(resolveInteractionIntent('看看这两个候选有什么区别', createEmptyTask())).toMatchObject({ kind: 'OPEN_SURFACE', surface: 'COMPARE' });
    expect(resolveInteractionIntent('看看这两个资源有什么区别', createEmptyTask()).kind).toBe('QUESTION');
    expect(resolveInteractionIntent('这两个资源有什么不同', createEmptyTask()).kind).toBe('QUESTION');
  });

  it('recognizes related-resource browse and analysis intents', () => {
    expect(resolveInteractionIntent('我先看看民政相关资源', createEmptyTask())).toMatchObject({ kind: 'RESOURCE_BROWSE', surface: 'RELATED_RESOURCES' });
    expect(resolveInteractionIntent('计算各街镇每千名老人养老床位数', createEmptyTask())).toMatchObject({ kind: 'ANALYZE' });
  });

  it('opens fields only for an explicit fields command with resource context', () => {
    const resource = createResource({ id: 'selected' });
    const task = createEmptyTask({ resources: { selected: resource }, activeResourceId: 'selected' });
    const intent = resolveInteractionIntent('打开完整字段列表', task);
    expect(evaluateSurfacePolicy(intent, undefined, task.activeSurface, task)).toMatchObject({ action: 'OPEN', surface: 'FIELDS', resourceIds: ['selected'] });
  });

  it('OPEN_FIELDS is blocked without an explicit or active resource', () => {
    const command = evaluateSurfacePolicy(resolveInteractionIntent('', createEmptyTask()), 'OPEN_FIELDS', { type: 'CLOSED' }, createEmptyTask());
    expect(command.action).toBe('NO_CHANGE');
    expect(command.blockedReason).toContain('没有选定资源');
  });

  it('OPEN_COMPARE requires a dedicated comparison model or explicit action payload', () => {
    const task = createMinhangTask();
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', task), 'OPEN_COMPARE', task.activeSurface, task)).toMatchObject({
      action: 'NO_CHANGE'
    });
  });

  it('OPEN_ASK_PLAN is blocked when no plan exists', () => {
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', createMinhangTask()), 'OPEN_ASK_PLAN', { type: 'CLOSED' }, createMinhangTask())).toMatchObject({ action: 'NO_CHANGE', blockedReason: expect.any(String) });
  });

  it('carries a structured focus target for the plan, calculation, or completed result', () => {
    const withoutResult = createMinhangTask({ askPlan: createAskPlan({ permissionCheckState: 'ALLOWED' }) });
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', withoutResult), 'OPEN_ASK_PLAN', { type: 'ASK_PLAN' }, withoutResult, { focusSection: 'RESULT' }))
      .toMatchObject({ action: 'NO_CHANGE', blockedReason: '当前分析计划尚未产生可查看的成功结果。' });

    const withResult = createMinhangTask({
      askPlan: createAskPlan({
        permissionCheckState: 'ALLOWED',
        status: 'COMPLETED',
        lastRunResult: { success: true, executedAt: '2026-09-05T00:00:00.000Z', permissionSnapshot: {} }
      })
    });
    const command = evaluateSurfacePolicy(resolveInteractionIntent('', withResult), 'OPEN_ASK_PLAN', { type: 'ASK_PLAN' }, withResult, { focusSection: 'RESULT' });
    expect(command).toMatchObject({ action: 'REPLACE', surface: 'ASK_PLAN', focusSection: 'RESULT', focusTarget: true });
    expect(command.focusRequestId).toEqual(expect.any(String));
  });

  it('related resources and close remain policy commands', () => {
    const task = createEmptyTask();
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', task), 'OPEN_RELATED_RESOURCES', { type: 'CLOSED' }, task)).toMatchObject({ action: 'OPEN', surface: 'RELATED_RESOURCES' });
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', task), 'CLOSE_SURFACE', { type: 'FIELDS' }, task)).toEqual({ action: 'CLOSE', surface: 'CLOSED' });
  });

  it('opens only the current direct result or its bound definition without an AskPlan', () => {
    const snapshot = {
      binding: { kind: 'DIRECT_METRIC' as const, taskId: 'direct_task', requestId: 'request_1', metricId: 'met_elderly_population', requirementRevision: 0 },
      executedAt: '2026-09-07T00:00:00.000Z', metricName: '老年人口数', numeratorLabel: '60 岁及以上常住人口', resultArtifact: {}
    };
    const task = createEmptyTask({ taskId: 'direct_task', directMetricResult: snapshot });
    const command = evaluateSurfacePolicy(resolveInteractionIntent('', task), 'OPEN_METRIC_DEFINITION', { type: 'CLOSED' }, task, {
      directMetricBinding: snapshot.binding, executedAt: snapshot.executedAt
    });
    expect(command).toMatchObject({ action: 'OPEN', surface: 'METRIC_RESULT', metricResultFocus: 'DEFINITION', metricResultBinding: snapshot.binding });
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', task), 'OPEN_METRIC_RESULT', { type: 'CLOSED' }, task, {
      directMetricBinding: { ...snapshot.binding, requestId: 'old_request' }, executedAt: snapshot.executedAt
    })).toMatchObject({ action: 'NO_CHANGE', blockedReason: expect.stringContaining('历史指标结果') });
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', task), 'OPEN_METRIC_RESULT', { type: 'CLOSED' }, task, {
      directMetricBinding: { ...snapshot.binding, metricId: 'met_resident_population' }, executedAt: snapshot.executedAt
    })).toMatchObject({ action: 'NO_CHANGE', blockedReason: expect.stringContaining('历史指标结果') });
  });
});
