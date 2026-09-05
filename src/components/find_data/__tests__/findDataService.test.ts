import { describe, expect, it } from 'vitest';
import { findDataReducer } from '../model/findDataReducer';
import { FindDataTaskState } from '../model/FindDataTask';
import { MockFindDataService } from '../services/MockFindDataService';
import { isMinhangBedSupplyInitialGoal } from '../scenarios/MinhangBedSupplyScenario';
import { MINHANG_RESOURCES } from '../fixtures/minhangBedSupplyFixture';
import { getDataSolutionDisplayState } from '../model/findDataSelectors';
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

function askRunRequest(task: FindDataTaskState, askPlan = task.askPlan!) {
  return {
    askPlanId: askPlan.id,
    expectedRequirementRevision: task.requirementRevision,
    expectedSearchRevision: task.searchRevision,
    idempotencyKey: `idem_${askPlan.id}`
  };
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

  it('extends the minimal solution with a partial service-use resource by default', async () => {
    const initial = await submit(createEmptyTask(), '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。');
    const { task } = await submit(initial.task, '查看实际服务使用');
    expect(task.dataSolution.items.find((item) => item.resourceId === 'r07')).toMatchObject({ role: 'PARTIAL_MATCH' });
    expect(task.dataSolution.gaps.map((gap) => gap.id)).toContain('gap_homecare_partial');
    expect(task.dataSolution.items.filter((item) => ['r01', 'r04'].includes(item.resourceId))).toHaveLength(2);
    expect(task.dataSolution.relationshipEvidence).toHaveLength(1);
    expect(getDataSolutionDisplayState(task).code).toBe('READY_PARTIAL');
  });

  it('extends an approved-bed core solution when the user asks to also inspect service use', async () => {
    const initial = await submit(createEmptyTask(), '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与养老床位核定数。');
    const { task } = await submit(initial.task, '同时看看实际服务使用');
    expect(task.dataSolution.items.filter((item) => item.role === 'CORE').map((item) => item.resourceId)).toEqual(['r01', 'r05']);
    expect(task.dataSolution.items.find((item) => item.resourceId === 'r07')).toMatchObject({ role: 'PARTIAL_MATCH', inclusionState: 'NOT_INCLUDED' });
    expect(task.dataSolution.gaps.map((gap) => gap.id)).toContain('gap_homecare_partial');
  });

  it('replaces the core solution only for an explicit service-use-only request', async () => {
    const base = createMinhangTask({ askPlan: createAskPlan() });
    const { task } = await submit(base, '改为只看养老服务实际使用');
    expect(task.dataSolution.items.filter((item) => item.role === 'CORE')).toEqual([]);
    expect(task.dataSolution.items).toMatchObject([{ resourceId: 'r07', role: 'PARTIAL_MATCH' }]);
    expect(task.dataSolution.gaps.map((gap) => gap.id)).toEqual(['gap_homecare_partial']);
    expect(task.askPlan).toBeUndefined();
    expect(getDataSolutionDisplayState(task).code).toBe('READY_PARTIAL');
  });

  it('keeps the data solution unchanged for a service-use coverage question', async () => {
    const base = createMinhangTask();
    const { result, task } = await submit(base, '为什么实际服务使用只有部分匹配');
    expect(result.events.some((event) => event.type === 'REQUIREMENT_UPDATED')).toBe(false);
    expect(result.events.some((event) => event.type === 'SEARCH_STARTED')).toBe(false);
    expect(task.dataSolution).toEqual(base.dataSolution);
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
      'CLARIFICATION_RESOLVED', 'ASK_PLAN_PREPARED', 'ASSISTANT_TURN_RECEIVED'
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
    expect(calculationSpec?.strictConclusionBoundary).toContain('严禁直接表达为“供需不足”');
  });

  it('gives a regenerated benchmark clarification its own id and keeps the historical decision locked', async () => {
    const initial = await submit(createEmptyTask(), '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。');
    const firstHandoff = await submit(initial.task, '按当前方案分析');
    const firstResolution = await service.executeAction(firstHandoff.task, {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: 'q_minhang_benchmark', selectedOptionIds: ['benchmark_rank'] }
    });
    const prepared = apply(firstHandoff.task, firstResolution.events);
    const recomposed = await service.executeAction(prepared, {
      actionCode: 'REVISE_REQUIREMENT',
      payload: { hypothesisPatch: { bedDefinition: '养老床位核定数' } }
    });
    const revised = apply(prepared, recomposed.events);
    const secondHandoff = await submit(revised, '按当前方案分析');
    const questions = secondHandoff.task.turns
      .flatMap((turn) => turn.blocks)
      .filter((block) => block.type === 'CLARIFICATION' && block.question.id.startsWith('q_minhang_benchmark'));
    const secondQuestion = questions.at(-1);
    const secondQuestionId = secondQuestion?.type === 'CLARIFICATION' ? secondQuestion.question.id : undefined;
    expect(secondQuestionId).not.toBe('q_minhang_benchmark');

    const secondResolution = await service.executeAction(secondHandoff.task, {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: secondQuestionId!, selectedOptionIds: ['benchmark_weighted'] }
    });
    const next = apply(secondHandoff.task, secondResolution.events);
    const resolvedQuestions = next.turns
      .flatMap((turn) => turn.blocks)
      .filter((block) => block.type === 'CLARIFICATION' && block.question.id.startsWith('q_minhang_benchmark'));
    expect(resolvedQuestions[0]?.type === 'CLARIFICATION' && resolvedQuestions[0].question.resolution?.selectedOptionIds).toEqual(['benchmark_rank']);
    expect(next.askPlan?.calculationSpec.benchmarkRule).toBe('WEIGHTED_DISTRICT_AVERAGE');
  });

  it('rejects a fabricated clarification action that is absent from task history', async () => {
    const result = await service.executeAction(createMinhangTask(), {
      actionCode: 'SUBMIT_CLARIFICATION',
      payload: { questionId: 'q_minhang_benchmark', selectedOptionIds: ['benchmark_weighted'] }
    });
    expect(result.events.some((event) => event.type === 'ASK_PLAN_PREPARED')).toBe(false);
  });

  it('does not create a second open benchmark question in the same analysis stage', async () => {
    const first = await submit(createMinhangTask(), '按当前方案分析');
    const second = await submit(first.task, '按当前方案分析');
    const openQuestions = second.task.turns
      .flatMap((turn) => turn.blocks)
      .filter((block) => block.type === 'CLARIFICATION' &&
        block.question.id.startsWith('q_minhang_benchmark') && block.question.resolution?.status === 'OPEN');
    expect(openQuestions).toHaveLength(1);
    expect(second.result.events.some((event) => event.type === 'ASK_PLAN_PREPARED')).toBe(false);
    expect(JSON.stringify(second.result.assistantBlocks)).toContain('当前比较基准尚未确认');
  });

  it('marks an open benchmark stale when the requirement changes and creates a fresh one only for the revised core plan', async () => {
    const initial = await submit(createEmptyTask(), '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。');
    const benchmark = await submit(initial.task, '按当前方案分析');
    const originalQuestion = benchmark.task.turns
      .flatMap((turn) => turn.blocks)
      .find((block) => block.type === 'CLARIFICATION' && block.question.id === 'q_minhang_benchmark');
    expect(originalQuestion?.type === 'CLARIFICATION' && originalQuestion.question.resolution?.status).toBe('OPEN');

    const replaced = await submit(benchmark.task, '改为只看养老服务实际使用');
    expect(replaced.result.events.map((event) => event.type)).toEqual([
      'CLARIFICATION_STALE', 'REQUIREMENT_UPDATED', 'ASK_PLAN_INVALIDATED', 'COMPARISON_MODEL_CLEARED',
      'SOLUTION_EVALUATION_STARTED', 'SEARCH_STARTED', 'SEARCH_RESULTS_RECEIVED', 'ASSISTANT_TURN_RECEIVED'
    ]);
    const staleQuestion = replaced.task.turns
      .flatMap((turn) => turn.blocks)
      .find((block) => block.type === 'CLARIFICATION' && block.question.id === 'q_minhang_benchmark');
    expect(staleQuestion?.type === 'CLARIFICATION' && staleQuestion.question.resolution).toMatchObject({
      status: 'STALE', staleReason: '需求或核心方案已变化，原比较基准需重新确认。'
    });
    expect(replaced.task.turns.flatMap((turn) => turn.blocks).filter((block) =>
      block.type === 'CLARIFICATION' && block.question.id.startsWith('q_minhang_benchmark') && block.question.resolution?.status === 'OPEN'
    )).toHaveLength(0);
    expect(replaced.task.dataSolution.items).toMatchObject([{ resourceId: 'r07', role: 'PARTIAL_MATCH' }]);
    expect(replaced.task.dataSolution.gaps.map((gap) => gap.id)).toEqual(['gap_homecare_partial']);

    const staleSubmission = await service.executeAction(replaced.task, {
      actionCode: 'SUBMIT_CLARIFICATION', payload: { questionId: 'q_minhang_benchmark', selectedOptionIds: ['benchmark_weighted'] }
    });
    expect(staleSubmission.events.some((event) => event.type === 'ASK_PLAN_PREPARED')).toBe(false);
    expect(JSON.stringify(staleSubmission.assistantBlocks)).toContain('该比较基准选择已失效');
    const partialAnalysis = await submit(replaced.task, '按当前方案分析');
    expect(JSON.stringify(partialAnalysis.result.assistantBlocks)).toContain('当前只有部分匹配资源');

    const revised = await service.executeAction(benchmark.task, {
      actionCode: 'REVISE_REQUIREMENT', payload: { hypothesisPatch: { bedDefinition: '养老床位核定数' } }
    });
    const revisedTask = apply(benchmark.task, revised.events);
    const refreshed = await submit(revisedTask, '按当前方案分析');
    const questions = refreshed.task.turns
      .flatMap((turn) => turn.blocks)
      .filter((block) => block.type === 'CLARIFICATION' && block.question.id.startsWith('q_minhang_benchmark'));
    expect(questions.filter((block) => block.type === 'CLARIFICATION' && block.question.resolution?.status === 'STALE')).toHaveLength(1);
    expect(questions.filter((block) => block.type === 'CLARIFICATION' && block.question.resolution?.status === 'OPEN')).toHaveLength(1);
    const latestQuestion = questions.at(-1);
    expect(latestQuestion?.type === 'CLARIFICATION' ? latestQuestion.question.id : undefined).not.toBe('q_minhang_benchmark');
    expect(revisedTask.dataSolution.items.filter((item) => item.role === 'CORE').map((item) => item.resourceId)).toEqual(['r01', 'r05']);
  });

  it('uses the institution resource only for optional drilldown', async () => {
    const browsed = await submit(createMinhangTask(), '解释床位由哪些机构提供');
    expect(browsed.task.searchResult?.candidateSnapshot.find((candidate) => candidate.resourceId === 'r06')?.proposedRole).toBe('OPTIONAL_DRILLDOWN');
    const response = JSON.stringify(browsed.result.assistantBlocks);
    expect(response).toContain('结果下钻资源');
    expect(response).toContain('不参与每千名老人床位数的核心计算');
    expect(response).not.toContain('月度快照更适合');

    const taskWithPlan = { ...browsed.task, askPlan: createAskPlan() };
    const calculationSpec = taskWithPlan.askPlan.calculationSpec;
    const added = await service.executeAction(taskWithPlan, { actionCode: 'EVALUATE_AND_ADD', payload: { resourceId: 'r06' } });
    const next = apply(taskWithPlan, added.events);
    expect(next.dataSolution.items.find((item) => item.resourceId === 'r06')).toMatchObject({ role: 'OPTIONAL_DRILLDOWN', inclusionState: 'RECOMMENDED' });
    expect(next.dataSolution.items.filter((item) => item.role === 'CORE').map((item) => item.resourceId)).toEqual(['r01', 'r04']);
    expect(next.askPlan?.calculationSpec).toEqual(calculationSpec);
  });

  it('returns a comparison conclusion in the conversation before opening the comparison surface', async () => {
    const detail = await submit(createMinhangTask(), '我还想看人口明细');
    const compared = await service.submitTurn(detail.task, '比较这两张表');
    expect(compared.surfaceCommand).toMatchObject({ action: 'OPEN', surface: 'COMPARE' });
    const response = JSON.stringify(compared.assistantBlocks);
    expect(response).toContain('人口基本信息视图');
    expect(response).toContain('常住人口月度快照');
    expect(response).toContain('推荐「常住人口月度快照」');
    expect(response).toContain('查询权限方面');
  });
});

describe('clarification decisions', () => {
  async function broadTask() {
    return (await submit(createEmptyTask(), '帮我看看闵行区老人养老情况。')).task;
  }

  it('completes broad-path defaults and stores normalized domain focus', async () => {
    const task = await broadTask();
    const result = await service.executeAction(task, {
      actionCode: 'SUBMIT_CLARIFICATION', payload: { questionId: 'q_minhang_focus', selectedOptionIds: ['opt_pop_bed'] }
    });
    const next = apply(task, result.events);
    expect(next.requirementHypothesis.analysisFocus).toEqual(['老年人口规模与分布', '养老床位供给']);
    expect(next.requirementHypothesis.analysisFocus).not.toContain('opt_pop_bed');
    const clarification = next.turns.flatMap((turn) => turn.blocks).find((block) => block.type === 'CLARIFICATION');
    expect(clarification?.type === 'CLARIFICATION' && clarification.question.resolution?.status).toBe('RESOLVED');
    expect(next.dataSolution.items.map((item) => item.resourceId)).toEqual(['r01', 'r04']);
    expect(next.requirementHypothesis.timeRange).toEqual({ start: '2025-09', end: '2026-08' });
    expect(next.requirementHypothesis.dimensions).toEqual(['时间（月度）', '空间（街镇）']);
    expect(next.requirementHypothesis.populationDefinition).toBe('60 岁及以上常住人口');
    expect(next.requirementHypothesis.bedDefinition).toBe('民政核定且在营可用养老床位数');
    expect(next.requirementHypothesis.assumptions).toEqual(expect.arrayContaining([
      '当前按 60 岁及以上常住人口理解，可在任务上下文中修改。',
      '当前按在营可用养老床位理解，可在任务上下文中修改。',
      '当前按核心资源共同覆盖的最近 12 个完整月，并按街镇和月份组织分析，可在任务上下文中修改。'
    ]));
    expect(next.askPlan).toBeUndefined();
  });

  it('preserves normalized focus when service use is extended and the bed definition changes', async () => {
    const broad = await broadTask();
    const selected = apply(broad, (await service.executeAction(broad, {
      actionCode: 'SUBMIT_CLARIFICATION', payload: { questionId: 'q_minhang_focus', selectedOptionIds: ['opt_pop_bed'] }
    })).events);
    const extended = await submit(selected, '再加入养老服务实际使用');
    const revised = await service.executeAction(extended.task, {
      actionCode: 'REVISE_REQUIREMENT', payload: { hypothesisPatch: { bedDefinition: '养老床位核定数' } }
    });
    const next = apply(extended.task, revised.events);
    expect(next.requirementHypothesis.analysisFocus).toEqual([
      '老年人口规模与分布',
      '养老床位供给',
      '养老服务实际使用'
    ]);
    expect(next.dataSolution.items.filter((item) => item.role === 'CORE').map((item) => item.resourceId)).toEqual(['r01', 'r05']);
    expect(next.dataSolution.items.find((item) => item.resourceId === 'r07')).toMatchObject({ role: 'PARTIAL_MATCH' });
    expect(next.dataSolution.gaps.map((gap) => gap.id)).toContain('gap_homecare_partial');
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
    expect((await service.runAskPlan(task, askRunRequest(task, askPlan))).success).toBe(false);
  });

  it('an old plan cannot run after requirement revision changes', async () => {
    const task = executableTask({ requirementRevision: 2 });
    expect((await service.runAskPlan(task, askRunRequest(task))).success).toBe(false);
  });

  it('does not run a policy-target plan without a registered value and source', async () => {
    const basePlan = createAskPlan();
    const askPlan = createAskPlan({
      permissionCheckState: 'ALLOWED',
      calculationSpec: { ...basePlan.calculationSpec, benchmarkRule: 'POLICY_TARGET' }
    });
    const policyTask = createMinhangTask({ askPlan });
    const result = await service.runAskPlan(policyTask, askRunRequest(policyTask, askPlan));
    expect(result.success).toBe(false);
    expect(result.error).toContain('缺少已登记的目标值或来源');
  });

  it('run performs another authoritative check', async () => {
    const askPlan = createAskPlan({ permissionCheckState: 'ALLOWED', permissionBaseline: { r01: 'ALLOWED', r04: 'ALLOWED' } });
    const task = createMinhangTask({
      askPlan,
      resources: { ...createMinhangTask().resources, r04: { ...createMinhangTask().resources.r04, availabilityByAction: permissionsWithQuery('DENIED') } }
    });
    expect((await service.runAskPlan(task, askRunRequest(task, askPlan))).success).toBe(false);
  });

  it('runs only when every core resource is still ALLOWED', async () => {
    const task = executableTask();
    const result = await service.runAskPlan(task, askRunRequest(task));
    expect(result.success).toBe(true);
    expect(result.resultArtifact?.townResults).toHaveLength(2);
    expect(result.resultArtifact?.belowBenchmarkCount).toBe(2);
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
    const result = await service.runAskPlan(task, askRunRequest(task, askPlan));
    expect(result.resultArtifact?.benchmarkLabel).toBe(benchmarkLabel);
    expect(result.resultArtifact?.townResults[0]?.comparisonNote).toBe(comparisonNote);
  });
});

describe('fourth-round task recomposition and candidate pool', () => {
  it('revises a requirement through invalidation, evaluation, and a fresh search', async () => {
    const task = createMinhangTask({ askPlan: createAskPlan() });
    const result = await service.executeAction(task, {
      actionCode: 'REVISE_REQUIREMENT',
      payload: { hypothesisPatch: { timeRange: { start: '2024.09', end: '2025.08' } } }
    });
    expect(result.events.map((event) => event.type)).toEqual([
      'REQUIREMENT_UPDATED', 'ASK_PLAN_INVALIDATED', 'COMPARISON_MODEL_CLEARED',
      'SOLUTION_EVALUATION_STARTED', 'SEARCH_STARTED', 'SEARCH_RESULTS_RECEIVED', 'ASSISTANT_TURN_RECEIVED'
    ]);
    const next = apply(task, result.events);
    expect(next.askPlan).toBeUndefined();
    expect(next.dataSolution).toMatchObject({ state: 'READY', basedOnRequirementRevision: 2, basedOnSearchRevision: 2 });
    expect(next.requirementHypothesis.timeRange).toEqual({ start: '2024.09', end: '2025.08' });
  });

  it('does not leave Minhang resources in an active solution after a non-Minhang revision', async () => {
    const result = await service.executeAction(createMinhangTask(), {
      actionCode: 'REVISE_REQUIREMENT', payload: { hypothesisPatch: { region: '上海市徐汇区' } }
    });
    const next = apply(createMinhangTask(), result.events);
    expect(result.events.some((event) => event.type === 'SCENARIO_RECLASSIFIED')).toBe(true);
    expect(next.scenarioKey).toBe('generic');
    expect(next.dataSolution.items).toEqual([]);
    expect(Object.keys(next.resources)).toEqual([]);
    expect(next.dataSolution.gaps[0]?.description).toContain('尚未配置该区域');
  });

  it('upgrades an empty generic task after the user supplies complete Minhang context', async () => {
    const generic = createEmptyTask({
      scenarioKey: 'generic', status: 'NEEDS_CLARIFICATION', goal: '我想找养老数据',
      turns: [{ turnId: 'u1', sender: 'USER', createdAt: '', blocks: [{ type: 'TEXT', id: 'u1b', content: '我想找养老数据' }] }]
    });
    const { result, task } = await submit(generic, '闵行区过去 12 个月，按街镇看老年人口和在营可用养老床位');
    expect(result.events[0]).toMatchObject({ type: 'SCENARIO_RECLASSIFIED', payload: { fromScenarioKey: 'generic', toScenarioKey: 'minhang_bed_supply' } });
    expect(task.dataSolution.items.map((item) => item.resourceId)).toEqual(['r01', 'r04']);
  });

  it('does not reclassify a generic task that already has a formal solution', async () => {
    const task = createMinhangTask({ scenarioKey: 'generic', status: 'READY' });
    const result = await service.submitTurn(task, '闵行区过去 12 个月，按街镇看老年人口和养老床位');
    expect(result.events.some((event) => event.type === 'SCENARIO_RECLASSIFIED')).toBe(false);
  });

  it('adds detail resources to the candidate pool and only adds the chosen monthly snapshot to the solution', async () => {
    const detail = await submit(createMinhangTask(), '我还想看人口明细');
    expect(detail.task.searchResult?.candidateIds).toEqual(['r01', 'r04', 'r02', 'r03']);
    expect(detail.task.dataSolution.items.map((item) => item.resourceId)).toEqual(['r01', 'r04']);
    const selected = await service.executeAction(detail.task, { actionCode: 'SELECT_RESOURCE', payload: { resourceId: 'r03' } });
    const next = apply(detail.task, selected.events);
    expect(next.dataSolution.items.map((item) => item.resourceId)).toEqual(['r01', 'r04', 'r03']);
    expect(next.dataSolution.items.some((item) => item.resourceId === 'r02')).toBe(false);
  });
});

describe('permission request server contract', () => {
  function requestableTask(query: 'ALLOWED' | 'REQUESTABLE' | 'DENIED' | 'UNKNOWN' = 'REQUESTABLE') {
    const base = createMinhangTask();
    return {
      ...base,
      resources: { ...base.resources, r04: { ...base.resources.r04, availabilityByAction: permissionsWithQuery(query) } }
    };
  }

  function noticeText(result: Awaited<ReturnType<MockFindDataService['executeAction']>>) {
    const turn = result.events.find((event) => event.type === 'ASSISTANT_TURN_RECEIVED');
    return turn?.type === 'ASSISTANT_TURN_RECEIVED' ? JSON.stringify(turn.payload.blocks) : '';
  }

  it('only creates a request for a REQUESTABLE task candidate', async () => {
    const result = await service.executeAction(requestableTask(), { actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r04'], actionType: 'query' } });
    expect(result.events.find((event) => event.type === 'PERMISSION_REQUEST_CREATED')).toBeTruthy();
  });

  it.each([
    ['ALLOWED', '无需重复申请'],
    ['DENIED', '不支持申请'],
    ['UNKNOWN', '尚未确认']
  ] as const)('rejects %s permission request without creating a record', async (query, message) => {
    const result = await service.executeAction(requestableTask(query), { actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r04'], actionType: 'query' } });
    expect(result.events.some((event) => event.type === 'PERMISSION_REQUEST_CREATED')).toBe(false);
    expect(noticeText(result)).toContain(message);
  });

  it('rejects a constructed resource id without echoing it and uses all-or-nothing validation', async () => {
    const result = await service.executeAction(requestableTask(), {
      actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r04', 'constructed_resource_id'], actionType: 'query' }
    });
    expect(result.events.some((event) => event.type === 'PERMISSION_REQUEST_CREATED')).toBe(false);
    expect(JSON.stringify(result)).not.toContain('constructed_resource_id');
    expect(noticeText(result)).toContain('不属于本任务可申请范围');
  });

  it('rejects a duplicate submitted request without creating another record', async () => {
    const initial = requestableTask();
    const first = await service.executeAction(initial, { actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r04'], actionType: 'query' } });
    const afterFirst = apply(initial, first.events);
    const second = await service.executeAction(afterFirst, { actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r04'], actionType: 'query' } });
    expect(first.events.some((event) => event.type === 'PERMISSION_REQUEST_CREATED')).toBe(true);
    expect(second.events.some((event) => event.type === 'PERMISSION_REQUEST_CREATED')).toBe(false);
    expect(noticeText(second)).toContain('其他资源尚未提交');
  });

  it('uses the metadata action label for an overlapping metadata request', async () => {
    const base = createMinhangTask();
    const metadataRequestable = {
      ...base,
      resources: {
        ...base.resources,
        r04: {
          ...base.resources.r04,
          availabilityByAction: { ...base.resources.r04.availabilityByAction, viewMetadata: 'REQUESTABLE' as const }
        }
      }
    };
    const first = await service.executeAction(metadataRequestable, {
      actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r04'], actionType: 'viewMetadata' }
    });
    const second = await service.executeAction(apply(metadataRequestable, first.events), {
      actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r04'], actionType: 'viewMetadata' }
    });
    expect(noticeText(second)).toContain('元数据查看权限申请');
    expect(noticeText(second)).not.toContain('查询权限申请');
  });

  it('uses the export action label when export permission is denied', async () => {
    const base = createMinhangTask();
    const exportDenied = {
      ...base,
      resources: {
        ...base.resources,
        r04: {
          ...base.resources.r04,
          availabilityByAction: { ...base.resources.r04.availabilityByAction, export: 'DENIED' as const }
        }
      }
    };
    const result = await service.executeAction(exportDenied, {
      actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r04'], actionType: 'export' }
    });
    expect(noticeText(result)).toContain('导出权限');
  });
});
