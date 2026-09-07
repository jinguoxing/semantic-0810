import { describe, expect, it } from 'vitest';
import { AskResultSnapshot, FindDataTaskState } from '../model/FindDataTask';
import { FindDataEvent } from '../model/findDataEvents';
import { findDataReducer } from '../model/findDataReducer';
import { selectResultSnapshots, selectResultTargetByRef, validateAnalyticalAlignment } from '../model/findDataSelectors';
import { buildAskResultSnapshot } from '../presenters/conversationPresenters';
import { MetricQueryDesignDemoService } from '../services/MetricQueryDesignDemoService';

function apply(task: FindDataTaskState, events: FindDataEvent[]): FindDataTaskState {
  return events.reduce(findDataReducer, task);
}

async function submit(service: MetricQueryDesignDemoService, task: FindDataTaskState, text: string, operationId: string) {
  const submitted = findDataReducer(task, { type: 'USER_TURN_SUBMITTED', payload: { text, turnId: `${operationId}_user` } });
  const result = await service.submitTurn(submitted, text, operationId);
  return { result, task: apply(submitted, result.events) };
}

async function executePlan(
  service: MetricQueryDesignDemoService,
  task: FindDataTaskState,
  operationId: string
): Promise<{ task: FindDataTaskState; snapshot: AskResultSnapshot }> {
  const plan = task.askPlan;
  if (!plan) throw new Error('expected calculation plan');
  const run = await service.runAskPlan(task, {
    askPlanId: plan.id,
    expectedRequirementRevision: task.requirementRevision,
    expectedSearchRevision: task.searchRevision,
    idempotencyKey: operationId
  }, operationId);
  if (!run.success) throw new Error(run.error);
  const snapshot = buildAskResultSnapshot(task, plan, run);
  if (!snapshot) throw new Error('expected execution snapshot');
  const completed = apply(task, [{ type: 'ASK_RUN_STARTED' }, { type: 'ASK_RUN_COMPLETED', payload: { result: run } }]);
  return {
    snapshot,
    task: apply(completed, [{
      type: 'ASSISTANT_TURN_RECEIVED',
      payload: {
        turnId: `${operationId}_assistant`,
        nextStatus: 'READY',
        source: {
          kind: 'ASK_RESULT',
          requirementRevision: task.requirementRevision,
          searchRevision: task.searchRevision,
          askPlanId: plan.id,
          resultExecutedAt: run.executedAt
        },
        blocks: [{ type: 'ASK_RESULT', id: `${operationId}_result`, snapshot }]
      }
    }])
  };
}

async function taskWithDirectMetricHistory(service: MetricQueryDesignDemoService): Promise<FindDataTaskState> {
  const created = await service.createTask();
  const goal = await submit(service, created, '我想比较浦锦街道和七宝镇 2026 年 8 月的养老服务供给情况，先帮我看看需要哪些数据。', 'goal');
  const population = await submit(service, goal.task, '先查询 2026 年 8 月浦锦街道的 60 岁及以上常住人口数。', 'population');
  const populationResult = await service.executeAction(population.task, {
    actionCode: 'RUN_METRIC_QUERY', payload: { requestId: population.task.directMetricQuery?.requestId }
  }, 'population_run');
  const bedClarification = await submit(service, apply(population.task, populationResult.events), '查询 2026 年 8 月七宝镇的养老床位数。', 'bed');
  const question = bedClarification.task.turns.flatMap((turn) => turn.blocks).find((block) =>
    block.type === 'CLARIFICATION' && block.question.id.startsWith('design_solution_bed_definition_')
  );
  if (!question || question.type !== 'CLARIFICATION') throw new Error('expected solution-derived bed clarification');
  const confirmed = await service.executeAction(bedClarification.task, {
    actionCode: 'SUBMIT_CLARIFICATION', payload: { questionId: question.question.id, selectedOptionIds: ['r04'] }
  }, 'bed_confirm');
  const prepared = apply(bedClarification.task, confirmed.events);
  const bedResult = await service.executeAction(prepared, {
    actionCode: 'RUN_METRIC_QUERY', payload: { requestId: prepared.directMetricQuery?.requestId }
  }, 'bed_run');
  return apply(prepared, bedResult.events);
}

function ratios(snapshot: AskResultSnapshot): number[] {
  const content = snapshot.resultArtifact.content;
  if (content?.kind !== 'TABLE') throw new Error('expected result table');
  return content.rows.map((row) => {
    const value = row.cells.ratio;
    if (value?.kind !== 'NUMBER' || typeof value.value !== 'number') throw new Error('expected ratio');
    return value.value;
  });
}

describe('PR-4C Solution → Calculation → Result continuity', () => {
  it('C4-01–15: creates independent Plan A/B from one current Solution and preserves Result A', async () => {
    const service = new MetricQueryDesignDemoService();
    const directHistory = await taskWithDirectMetricHistory(service);
    const aPrepared = await submit(
      service,
      directHistory,
      '用当前数据方案中的老年人口和在营可用床位数据，比较浦锦街道和七宝镇每千名老人床位数。先让我确认计算方案，不判断是否充足。',
      'plan_a'
    );
    const planA = aPrepared.task.askPlan;
    if (!planA) throw new Error('expected Plan A');

    expect(aPrepared.result.events.some((event) => event.type === 'SEARCH_STARTED' || event.type === 'SEARCH_RESULTS_RECEIVED')).toBe(false);
    expect(aPrepared.task.requirementRevision).toBe(directHistory.requirementRevision);
    expect(aPrepared.task.searchRevision).toBe(directHistory.searchRevision);
    expect(aPrepared.result.surfaceCommand).toMatchObject({ surface: 'ASK_PLAN', focusSection: 'PLAN' });
    expect(planA).toMatchObject({
      id: expect.stringMatching(/^plan_/),
      coreResourceIds: ['r01', 'r04'],
      conditionalResourceIds: [],
      permissionBaseline: { r01: 'ALLOWED', r04: 'ALLOWED' },
      alignmentRequirement: { requiredRelationshipResourcePairs: [{ sourceResourceId: 'r04', targetResourceId: 'r01' }] },
      calculationSpec: { benchmarkRule: 'RANK_ONLY' }
    });
    expect(validateAnalyticalAlignment(aPrepared.task, planA)).toMatchObject({ allowed: true, status: 'VALIDATED' });

    // Mutating presentation history must not alter private execution inputs.
    const misleadingConversation = {
      ...aPrepared.task,
      turns: aPrepared.task.turns.map((turn) => ({
        ...turn,
        blocks: turn.blocks.map((block) => block.type !== 'ASK_RESULT' ? block : {
          ...block,
          snapshot: {
            ...block.snapshot,
            resultArtifact: {
              ...block.snapshot.resultArtifact,
              content: { kind: 'SCALAR' as const, label: '误导性的会话值', value: { kind: 'NUMBER' as const, state: 'VALUE' as const, value: 999999, unit: '人', precision: 0 } }
            }
          }
        })
      }))
    };
    const aExecuted = await executePlan(service, misleadingConversation, 'run_a');
    expect(ratios(aExecuted.snapshot)).toEqual([15, 20]);
    expect(aExecuted.snapshot.resultArtifact.summary).toBe('在当前口径下，七宝镇高于浦锦街道 5.0 张 / 千人。');
    expect(aExecuted.snapshot.resultArtifact.resultRef?.id).toBe('run_a');
    expect(aExecuted.snapshot.resultArtifact.boundaryNotice).toContain('不能据此判断差异原因');

    const bPrepared = await submit(service, aExecuted.task, '再用核定床位按同样方式计算一份，保留上一份结果。', 'plan_b');
    const planB = bPrepared.task.askPlan;
    if (!planB) throw new Error('expected Plan B');
    expect(bPrepared.result.events.some((event) => event.type === 'SEARCH_STARTED' || event.type === 'SEARCH_RESULTS_RECEIVED')).toBe(false);
    expect(bPrepared.task.requirementRevision).toBe(aExecuted.task.requirementRevision);
    expect(bPrepared.task.searchRevision).toBe(aExecuted.task.searchRevision);
    expect(planB).toMatchObject({
      id: expect.stringMatching(/^plan_/),
      coreResourceIds: ['r01', 'r05'],
      permissionBaseline: { r01: 'ALLOWED', r05: 'ALLOWED' },
      alignmentRequirement: { requiredRelationshipResourcePairs: [{ sourceResourceId: 'r05', targetResourceId: 'r01' }] }
    });
    expect(planB.id).not.toBe(planA.id);
    expect(validateAnalyticalAlignment(bPrepared.task, planB)).toMatchObject({ allowed: true, status: 'VALIDATED' });

    const bExecuted = await executePlan(service, bPrepared.task, 'run_b');
    expect(ratios(bExecuted.snapshot)).toEqual([22.5, 25]);
    expect(bExecuted.snapshot.resultArtifact.summary).toBe('在当前口径下，七宝镇高于浦锦街道 2.5 张 / 千人。');
    expect(bExecuted.snapshot.resultArtifact.resultRef?.id).toBe('run_b');

    const allResults = selectResultSnapshots(bExecuted.task);
    expect(allResults).toHaveLength(4);
    const calculationResults = allResults.filter((selection) => !('kind' in selection.snapshot.binding));
    expect(calculationResults.map((selection) => {
      if ('kind' in selection.snapshot.binding) throw new Error('expected calculation result binding');
      return selection.snapshot.binding.askPlanId;
    })).toEqual([planA.id, planB.id]);
    expect(calculationResults[0].snapshot).toEqual(aExecuted.snapshot);
    expect(calculationResults[0].target.resultRef).not.toEqual(calculationResults[1].target.resultRef);
    expect(bExecuted.task.askPlan?.id).toBe(planB.id);
  });

  it('C4-16–19: resolves an exact historical Plan A target without restoring Plan A', async () => {
    const service = new MetricQueryDesignDemoService();
    const directHistory = await taskWithDirectMetricHistory(service);
    const planA = await submit(service, directHistory, '用当前数据方案中的老年人口和在营可用床位数据，比较浦锦街道和七宝镇每千名老人床位数。先让我确认计算方案，不判断是否充足。', 'history_plan_a');
    const resultA = await executePlan(service, planA.task, 'history_run_a');
    const planB = await submit(service, resultA.task, '再用核定床位按同样方式计算一份，保留上一份结果。', 'history_plan_b');
    const resultB = await executePlan(service, planB.task, 'history_run_b');
    const targetA = selectResultSnapshots(resultB.task).find((selection) =>
      !('kind' in selection.snapshot.binding) && selection.snapshot.binding.askPlanId === planA.task.askPlan?.id
    )?.target;
    if (!targetA) throw new Error('expected exact Result A target');

    expect(selectResultTargetByRef(resultB.task, targetA)?.snapshot.resultArtifact.resultRef?.id).toBe('history_run_a');
    const interpretation = await service.submitTurn(resultB.task, '解释一下这个差异。', 'interpret_a', {
      resultTarget: { resultRef: targetA.resultRef, binding: targetA.binding, executedAt: targetA.executedAt }
    });
    const interpreted = apply(resultB.task, interpretation.events);
    expect(interpreted.askPlan?.id).toBe(planB.task.askPlan?.id);
    expect(interpretation.events.find((event) => event.type === 'ASSISTANT_TURN_RECEIVED')).toMatchObject({
      payload: { source: { resultTarget: expect.objectContaining({ resultRef: { kind: 'RUN_RESULT', id: 'history_run_a' } }) } }
    });
    expect(JSON.stringify(interpretation.assistantBlocks)).toContain('七宝镇为 20.0 张 / 千人，浦锦街道为 15.0 张 / 千人，相差 5.0 张 / 千人');
    expect(JSON.stringify(interpretation.assistantBlocks)).toContain('不能据此判断差异原因');
  });
});
