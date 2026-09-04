import { describe, expect, it } from 'vitest';
import { findDataReducer } from '../model/findDataReducer';
import { FindDataTaskState } from '../model/FindDataTask';
import { MockFindDataService } from '../services/MockFindDataService';
import { isMinhangBedSupplyInitialGoal } from '../scenarios/MinhangBedSupplyScenario';
import { MINHANG_RESOURCES } from '../fixtures/minhangBedSupplyFixture';
import { createAskPlan, createEmptyTask, createMinhangTask, permissionsWithQuery } from './testUtils/findDataFactories';

const service = new MockFindDataService();

function apply(task: FindDataTaskState, events: Parameters<typeof findDataReducer>[1][]) {
  return events.reduce(findDataReducer, task);
}

async function submit(task: FindDataTaskState, text: string) {
  const withUser = findDataReducer(task, { type: 'USER_TURN_SUBMITTED', payload: { text, turnId: `user_${task.turns.length}` } });
  const result = await service.submitTurn(withUser, text);
  return { result, task: apply(withUser, result.events) };
}

describe('scenario classification and turn handling', () => {
  it.each([
    ['上海全市养老数据', false],
    ['全国人口趋势', false],
    ['医院床位供给', false],
    ['闵行区出生死亡迁入迁出', false],
    ['闵行区供应链供给分析', false],
    ['闵行区人口基本信息字段', false],
    ['帮我看看闵行区老人养老情况。', true]
  ])('strictly classifies %s', (text, expected) => {
    expect(isMinhangBedSupplyInitialGoal(text)).toBe(expected);
  });

  it('broad Minhang goal asks for clarification before search or solution generation', async () => {
    const { result, task } = await submit(createEmptyTask(), '帮我看看闵行区老人养老情况。');
    expect(result.events.map((event) => event.type)).toEqual([
      'SCENARIO_CLASSIFIED', 'REQUIREMENT_UPDATED', 'ASSISTANT_TURN_RECEIVED'
    ]);
    expect(task.status).toBe('NEEDS_CLARIFICATION');
    expect(task.resources).toEqual({});
    expect(task.dataSolution.items).toEqual([]);
    expect(task.dataSolution.gaps).toEqual([]);
    expect(task.activeResourceId).toBeUndefined();
    expect(task.askPlan).toBeUndefined();
  });

  it('sufficient goal creates only the minimal two-resource solution', async () => {
    const text = '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。';
    const { result, task } = await submit(createEmptyTask(), text);
    expect(result.events.map((event) => event.type)).toEqual([
      'SCENARIO_CLASSIFIED', 'REQUIREMENT_UPDATED', 'SEARCH_STARTED', 'SEARCH_RESULTS_RECEIVED', 'ASSISTANT_TURN_RECEIVED'
    ]);
    expect(task.status).toBe('READY');
    expect(Object.keys(task.resources)).toEqual(['r01', 'r04']);
    expect(task.searchResult?.totalMatches).toBe(2);
    expect(task.searchResult?.candidateIds).toEqual(['r01', 'r04']);
    expect(task.dataSolution.items.map((item) => item.resourceId)).toEqual(['r01', 'r04']);
    expect(task.askPlan).toBeUndefined();
  });

  it('normal scenario turns never emit TASK_HYDRATED', async () => {
    const { result } = await submit(createEmptyTask(), '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。');
    expect(result.events.some((event) => event.type === 'TASK_HYDRATED')).toBe(false);
  });

  it('follow-up field question stays in the classified scenario without reinitializing it', async () => {
    const task = createMinhangTask({ activeResourceId: 'r01' });
    const { result, task: next } = await submit(task, '这个表有哪些字段？');
    expect(result.events.some((event) => event.type === 'SCENARIO_CLASSIFIED')).toBe(false);
    expect(result.events.some((event) => event.type === 'SEARCH_STARTED')).toBe(false);
    expect(result.assistantBlocks[0]).toMatchObject({ type: 'TEXT' });
    expect(next.status).toBe('READY');
  });

  it('loads the explicit comparison model when detail candidates are requested', async () => {
    const { result, task } = await submit(createMinhangTask(), '查看明细');
    expect(result.events[0]?.type).toBe('COMPARISON_MODEL_SET');
    expect(task.comparisonModel?.resourceIds).toEqual(['r02', 'r03']);
    expect(task.status).toBe('READY');
  });

  it('adds the partial service-use resource only when requested after the minimal solution', async () => {
    const initial = await submit(createEmptyTask(), '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。');
    const relationships = initial.task.dataSolution.relationshipEvidence;
    const coverage = initial.task.dataSolution.coverageSummary;
    const limitations = initial.task.dataSolution.limitationSummary;
    const { task } = await submit(initial.task, '查看实际服务使用');
    expect(task.dataSolution.items.find((item) => item.resourceId === 'r07')).toMatchObject({ role: 'PARTIAL_MATCH' });
    expect(task.dataSolution.gaps.map((gap) => gap.id)).toContain('gap_homecare_partial');
    expect(task.dataSolution.items.filter((item) => ['r01', 'r04'].includes(item.resourceId))).toHaveLength(2);
    expect(task.dataSolution.relationshipEvidence).toEqual(relationships);
    expect(task.dataSolution.coverageSummary).toEqual(coverage);
    expect(task.dataSolution.limitationSummary).toEqual(limitations);
  });

  it('creates an Ask Plan only after the user confirms a comparison benchmark', async () => {
    const initial = await submit(createEmptyTask(), '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。');
    const handoff = await submit(initial.task, '按当前方案分析');
    expect(handoff.task.askPlan).toBeUndefined();
    expect(handoff.task.status).toBe('WAITING_USER');
    const action = await service.executeAction(handoff.task, {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: 'q_minhang_benchmark', selectedOptionIds: ['benchmark_weighted'] }
    });
    expect(action.events.map((event) => event.type)).toEqual([
      'CLARIFICATION_RESOLVED', 'REQUIREMENT_UPDATED', 'ASK_PLAN_PREPARED', 'ASSISTANT_TURN_RECEIVED'
    ]);
    const prepared = apply(handoff.task, action.events);
    expect(prepared.askPlan).toMatchObject({ status: 'READY_TO_RUN', permissionCheckState: 'NOT_CHECKED' });
    expect(prepared.status).toBe('WAITING_USER');
  });

  it.each([
    ['benchmark_rank', 'RANK_ONLY'],
    ['benchmark_weighted', 'WEIGHTED_DISTRICT_AVERAGE'],
    ['benchmark_policy', 'POLICY_TARGET']
  ] as const)('maps %s to its analysis-plan benchmark rule', async (optionId, benchmarkRule) => {
    const initial = await submit(createEmptyTask(), '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。');
    const handoff = await submit(initial.task, '按当前方案分析');
    const result = await service.executeAction(handoff.task, {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: 'q_minhang_benchmark', selectedOptionIds: [optionId] }
    });
    expect(apply(handoff.task, result.events).askPlan?.calculationSpec.benchmarkRule).toBe(benchmarkRule);
  });

  it('marks the policy target in mock mode as an offline demonstration value', async () => {
    const initial = await submit(createEmptyTask(), '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。');
    const handoff = await submit(initial.task, '按当前方案分析');
    const result = await service.executeAction(handoff.task, {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: 'q_minhang_benchmark', selectedOptionIds: ['benchmark_policy'] }
    });
    const calculationSpec = apply(handoff.task, result.events).askPlan?.calculationSpec;
    expect(calculationSpec?.benchmarkValue).toBe('30 张 / 千人');
    expect(calculationSpec?.benchmarkReference).toContain('Mock Fixture');
    expect(calculationSpec?.strictConclusionBoundary).toContain('不得据此声称真实政策达标或不达标');
  });

  it('rejects a fabricated clarification action that is absent from task history', async () => {
    const result = await service.executeAction(createMinhangTask(), {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: 'q_minhang_benchmark', selectedOptionIds: ['benchmark_weighted'] }
    });
    expect(result.events.some((event) => event.type === 'ASK_PLAN_PREPARED')).toBe(false);
  });
});

describe('clarification decisions', () => {
  async function broadTask() {
    return (await submit(createEmptyTask(), '帮我看看闵行区老人养老情况。')).task;
  }

  it('resolves history and stores business labels rather than option ids', async () => {
    const task = await broadTask();
    const result = await service.executeAction(task, {
      actionCode: 'SUBMIT_CLARIFICATION', payload: { questionId: 'q_minhang_focus', selectedOptionIds: ['opt_pop_bed'] }
    });
    const next = apply(task, result.events);
    expect(next.requirementHypothesis.analysisFocus).toEqual(['人口规模与养老床位供给']);
    expect(next.requirementHypothesis.analysisFocus).not.toContain('opt_pop_bed');
    const clarification = next.turns.flatMap((turn) => turn.blocks).find((block) => block.type === 'CLARIFICATION');
    expect(clarification?.type === 'CLARIFICATION' && clarification.question.resolution?.status).toBe('RESOLVED');
    expect(next.dataSolution.items.map((item) => item.resourceId)).toEqual(['r01', 'r04']);
    expect(next.askPlan).toBeUndefined();
  });

  it('service-use branch creates only a partial match and a gap', async () => {
    const task = await broadTask();
    const result = await service.executeAction(task, {
      actionCode: 'SUBMIT_CLARIFICATION', payload: { questionId: 'q_minhang_focus', selectedOptionIds: ['opt_service'] }
    });
    const next = apply(task, result.events);
    expect(next.dataSolution.items).toHaveLength(1);
    expect(next.dataSolution.items[0]).toMatchObject({ resourceId: 'r07', role: 'PARTIAL_MATCH' });
    expect(next.dataSolution.gaps).toHaveLength(1);
    expect(next.askPlan).toBeUndefined();
  });

  it('public-service branch produces only a retrieval gap', async () => {
    const task = await broadTask();
    const result = await service.executeAction(task, {
      actionCode: 'SUBMIT_CLARIFICATION', payload: { questionId: 'q_minhang_focus', selectedOptionIds: ['opt_public_service'] }
    });
    const next = apply(task, result.events);
    expect(next.dataSolution.items).toEqual([]);
    expect(next.dataSolution.gaps.map((gap) => gap.id)).toEqual(['gap_public_service']);
  });
});

describe('discovery and permission gates', () => {
  it('production fixture contains no denied resource', () => {
    expect(Object.values(MINHANG_RESOURCES).every((resource) => resource.availabilityByAction.discover === 'ALLOWED')).toBe(true);
  });

  it('cannot evaluate a resource absent from the task and never echoes its id', async () => {
    const result = await service.executeAction(createEmptyTask(), {
      actionCode: 'EVALUATE_AND_ADD', payload: { resourceId: 'secret_name_should_not_echo' }
    });
    expect(result.events.some((event) => event.type === 'SOLUTION_ITEM_UPSERTED')).toBe(false);
    expect(JSON.stringify(result)).not.toContain('secret_name_should_not_echo');
  });

  it('REQUESTABLE core permission is BLOCKED', async () => {
    const task = createMinhangTask({
      askPlan: createAskPlan({ permissionBaseline: { r01: 'REQUESTABLE', r04: 'ALLOWED' } }),
      resources: { ...createMinhangTask().resources, r01: { ...createMinhangTask().resources.r01, availabilityByAction: permissionsWithQuery('REQUESTABLE') } }
    });
    expect((await service.recheckPermissions(task, ['r01', 'r04'], 'query')).decision).toBe('BLOCKED');
  });

  it('changed core permission is reported as CHANGED without collapsing to BLOCKED', async () => {
    const task = createMinhangTask({
      askPlan: createAskPlan({ permissionBaseline: { r01: 'ALLOWED', r04: 'ALLOWED' } }),
      resources: { ...createMinhangTask().resources, r01: { ...createMinhangTask().resources.r01, availabilityByAction: permissionsWithQuery('REQUESTABLE') } }
    });
    expect((await service.recheckPermissions(task, ['r01', 'r04'], 'query')).decision).toBe('CHANGED');
  });
});

describe('Ask execution authorization', () => {
  function executableTask(overrides: Partial<FindDataTaskState> = {}) {
    const askPlan = createAskPlan({ permissionCheckState: 'ALLOWED', requirementRevision: 1 });
    return createMinhangTask({ askPlan, ...overrides });
  }

  it.each(['BLOCKED', 'CHANGED'] as const)('%s plans cannot run', async (permissionCheckState) => {
    const askPlan = createAskPlan({ permissionCheckState });
    const task = createMinhangTask({ askPlan });
    expect((await service.runAskPlan(task, askPlan)).success).toBe(false);
  });

  it('an old plan cannot run after requirement revision changes', async () => {
    const task = executableTask({ requirementRevision: 2 });
    expect((await service.runAskPlan(task, task.askPlan!)).success).toBe(false);
  });

  it('does not run a policy-target plan without a registered value and source', async () => {
    const basePlan = createAskPlan();
    const askPlan = createAskPlan({
      permissionCheckState: 'ALLOWED',
      calculationSpec: { ...basePlan.calculationSpec, benchmarkRule: 'POLICY_TARGET' }
    });
    const result = await service.runAskPlan(createMinhangTask({ askPlan }), askPlan);
    expect(result.success).toBe(false);
    expect(result.error).toContain('缺少已登记的目标值或来源');
  });

  it('run performs another authoritative check', async () => {
    const askPlan = createAskPlan({ permissionCheckState: 'ALLOWED', permissionBaseline: { r01: 'ALLOWED', r04: 'ALLOWED' } });
    const task = createMinhangTask({
      askPlan,
      resources: { ...createMinhangTask().resources, r04: { ...createMinhangTask().resources.r04, availabilityByAction: permissionsWithQuery('DENIED') } }
    });
    expect((await service.runAskPlan(task, askPlan)).success).toBe(false);
  });

  it('runs only when every core resource is still ALLOWED', async () => {
    const task = executableTask();
    const result = await service.runAskPlan(task, task.askPlan!);
    expect(result.success).toBe(true);
    expect(result.resultArtifact?.townResults).toHaveLength(2);
    expect(result.resultArtifact?.boundaryNotice).toBe(task.askPlan?.calculationSpec.strictConclusionBoundary);
  });

  it.each([
    ['RANK_ONLY', '街镇指标排名', '样例排名第 1'],
    ['WEIGHTED_DISTRICT_AVERAGE', '全区加权平均供给水平', '低于全区 -42.7%'],
    ['POLICY_TARGET', '政策目标比较（离线演示）', '低于演示目标 -52.7%']
  ] as const)('executes %s with matching result semantics', async (benchmarkRule, benchmarkLabel, comparisonNote) => {
    const basePlan = createAskPlan();
    const askPlan = createAskPlan({
      permissionCheckState: 'ALLOWED',
      calculationSpec: {
        ...basePlan.calculationSpec,
        benchmarkRule,
        benchmarkValue: benchmarkRule === 'POLICY_TARGET' ? '30 张 / 千人' : undefined,
        benchmarkReference: benchmarkRule === 'POLICY_TARGET' ? 'Mock Fixture' : undefined
      }
    });
    const task = createMinhangTask({ askPlan });
    const result = await service.runAskPlan(task, askPlan);
    expect(result.resultArtifact?.benchmarkLabel).toBe(benchmarkLabel);
    expect(result.resultArtifact?.townResults[0]?.comparisonNote).toBe(comparisonNote);
  });
});
