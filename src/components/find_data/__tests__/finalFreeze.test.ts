import { describe, expect, it } from 'vitest';
import { MINHANG_RESOURCES } from '../fixtures/minhangBedSupplyFixture';
import { findDataReducer } from '../model/findDataReducer';
import { selectCandidateSolutionStatus } from '../model/findDataSelectors';
import { deriveMinhangInitialHypothesis } from '../scenarios/deriveMinhangInitialHypothesis';
import { buildMinhangCalculationSpec } from '../scenarios/MinhangBedSupplyScenario';
import { MockFindDataService } from '../services/MockFindDataService';
import { createAskPlan, createEmptyTask, createMinhangTask } from './testUtils/findDataFactories';
import { askRunCompletionMessage } from '../../DataAssistantFindDataWorkspace';

const apply = (task: ReturnType<typeof createEmptyTask>, events: Parameters<typeof findDataReducer>[1][]) => events.reduce(findDataReducer, task);

describe('final freeze Minhang initial hypothesis', () => {
  it('preserves an explicit 2024 approved-bed request', () => {
    const resolution = deriveMinhangInitialHypothesis('分析 2024 年 1 月至 12 月闵行区各街镇 60 岁以上常住人口与养老床位核定数。');
    expect(resolution).toMatchObject({
      status: 'READY',
      hypothesis: {
        timeRange: { start: '2024-01', end: '2024-12' },
        populationDefinition: '60 岁及以上常住人口',
        bedDefinition: '养老床位核定数'
      }
    });
  });

  it('uses the registered complete-month range for an explicit rolling-year request', () => {
    expect(deriveMinhangInitialHypothesis('分析过去 12 个月闵行区各街镇老年人口与在营养老床位供给。')).toMatchObject({
      status: 'READY', hypothesis: { timeRange: { start: '2025-09', end: '2026-08' }, bedDefinition: '民政核定且在营可用养老床位数' }
    });
  });

  it('asks for the bed definition instead of silently selecting one', () => {
    expect(deriveMinhangInitialHypothesis('分析闵行区各街镇老年人口与养老床位。')).toMatchObject({
      status: 'NEEDS_CLARIFICATION', question: { id: 'q_minhang_bed_definition' }
    });
  });

  it('records the 60-and-over definition as an assumption when older population is generic', () => {
    const resolution = deriveMinhangInitialHypothesis('分析闵行区各街镇老年人口与在营养老床位供给。');
    expect(resolution).toMatchObject({
      status: 'READY',
      hypothesis: {
        populationDefinition: '60 岁及以上常住人口',
        assumptions: expect.arrayContaining(['当前按 60 岁及以上常住人口理解，可在任务上下文中修改。'])
      }
    });
  });

  it('does not record the default population assumption when the user supplies the definition', () => {
    const resolution = deriveMinhangInitialHypothesis('分析闵行区各街镇 60 岁及以上常住人口与在营养老床位供给。');
    expect(resolution).toMatchObject({ status: 'READY', hypothesis: { populationDefinition: '60 岁及以上常住人口' } });
    expect(resolution.status === 'READY' && resolution.hypothesis.assumptions).not.toContain('当前按 60 岁及以上常住人口理解，可在任务上下文中修改。');
  });
});

describe('final freeze completion summaries', () => {
  const weightedPlan = createAskPlan({ calculationSpec: { ...createAskPlan().calculationSpec, benchmarkRule: 'WEIGHTED_DISTRICT_AVERAGE' } });
  const resultWith = (belowBenchmarkCount?: number) => ({
    success: true,
    executedAt: '2026-09-04T00:00:00.000Z',
    permissionSnapshot: {},
    resultArtifact: {
      benchmarkLabel: '全区加权平均',
      summary: '测试',
      townResults: [{ townName: '浦锦街道', supplyRatio: '1', comparisonNote: '测试' }, { townName: '七宝镇', supplyRatio: '2', comparisonNote: '测试' }],
      boundaryNotice: '测试',
      ...(belowBenchmarkCount === undefined ? {} : { belowBenchmarkCount })
    }
  });

  it('reports the service-provided below-benchmark count rather than the row count', () => {
    expect(askRunCompletionMessage(weightedPlan, resultWith(2))).toContain('识别出 2 个相对全区加权平均偏低的街镇');
  });

  it('reports no below-benchmark towns for an r05-style result', () => {
    const message = askRunCompletionMessage(weightedPlan, resultWith(0));
    expect(message).toContain('当前返回结果中未发现低于全区加权平均的街镇');
    expect(message).not.toContain('识别出 2 个');
  });

  it('uses a neutral message when an HTTP artifact omits belowBenchmarkCount', () => {
    const message = askRunCompletionMessage(weightedPlan, resultWith());
    expect(message).toContain('已生成 2 个街镇比较结果');
    expect(message).not.toContain('偏低');
  });
});

describe('final freeze scenario semantics', () => {
  it('keeps the available-bed calculation spec specific to r04', () => {
    const spec = buildMinhangCalculationSpec(['r01', 'r04']);
    expect(spec).toMatchObject({
      metricName: '每千名 60 岁以上常住人口在营可用养老床位数',
      numerator: '在营可用养老床位数（正式指标）'
    });
    expect(spec.formula).toContain('在营可用养老床位数');
  });

  it('creates an r05 plan with its own formula and fixture result', async () => {
    const service = new MockFindDataService();
    const initial = createEmptyTask();
    const first = await service.submitTurn(initial, '分析 2024 年 1 月至 12 月闵行区各街镇 60 岁以上常住人口与养老床位核定数。');
    const searched = apply(initial, first.events);
    expect(searched.dataSolution.items.map((item) => item.resourceId)).toEqual(['r01', 'r05']);

    const handoff = await service.submitTurn(searched, '按当前方案分析');
    const asking = apply(searched, handoff.events);
    const prepared = await service.executeAction(asking, { actionCode: 'SUBMIT_CLARIFICATION', payload: { questionId: 'q_minhang_benchmark', selectedOptionIds: ['benchmark_weighted'] } });
    const task = apply(asking, prepared.events);
    expect(task.askPlan?.calculationSpec).toMatchObject({
      metricName: '每千名 60 岁以上常住人口核定养老床位数',
      numerator: '养老床位核定数（正式指标）'
    });
    expect(task.askPlan?.calculationSpec.formula).toContain('养老床位核定数');
    expect(task.askPlan?.calculationSpec.formula).not.toContain('在营可用养老床位数');
    expect(task.askPlan?.calculationSpec.strictConclusionBoundary).toBe('核定床位数反映审批或设计容量，包含可能尚未投用、停用或不具备即时接收能力的床位；分析结果不得直接表述为实际可用养老资源供给水平。');

    const executable = { ...task, askPlan: task.askPlan && { ...task.askPlan, permissionCheckState: 'ALLOWED' as const } };
    const result = await service.runAskPlan(executable, {
      askPlanId: executable.askPlan!.id,
      expectedRequirementRevision: executable.requirementRevision,
      expectedSearchRevision: executable.searchRevision,
      idempotencyKey: 'approved-bed-fixture'
    });
    expect(result.resultArtifact?.totalBeds).toBe('12,936 张');
    expect(result.resultArtifact?.summary).toContain('核定床位容量');
    expect(result.resultArtifact?.belowBenchmarkCount).toBe(0);
  });

  it('keeps civil-affairs candidates out of a comparison model', async () => {
    const service = new MockFindDataService();
    const task = createMinhangTask();
    const result = await service.submitTurn(task, '我先看看民政相关资源');
    const next = apply(task, result.events);
    expect(result.events.some((event) => event.type === 'COMPARISON_MODEL_SET')).toBe(false);
    expect(result.events.some((event) => event.type === 'COMPARISON_MODEL_CLEARED')).toBe(true);
    expect(JSON.stringify(result.assistantBlocks)).not.toContain('OPEN_COMPARE');
    expect(next.searchResult?.candidateIds).toEqual(['r01', 'r04', 'r05', 'r06', 'r07']);
  });

  it('switches bed alternatives through a full requirement recomposition', async () => {
    const service = new MockFindDataService();
    const base = createMinhangTask({ askPlan: createAskPlan() });
    const browsed = apply(base, (await service.submitTurn(base, '我先看看民政相关资源')).events);
    const result = await service.executeAction(browsed, { actionCode: 'EVALUATE_AND_ADD', payload: { resourceId: 'r05' } });
    const next = apply(browsed, result.events);
    expect(next.dataSolution.items.filter((item) => item.role === 'CORE').map((item) => item.resourceId)).toEqual(['r01', 'r05']);
    expect(next.dataSolution.items.filter((item) => ['r04', 'r05'].includes(item.resourceId) && item.role === 'CORE')).toHaveLength(1);
    expect(next.dataSolution.items.find((item) => item.resourceId === 'r05')?.selectionGroupId).toBe('bed_definition_alternative');
    expect(next.askPlan).toBeUndefined();
  });

  it('labels a recorded partial candidate separately from an included resource', () => {
    const task = createMinhangTask({
      resources: { ...createMinhangTask().resources, r07: MINHANG_RESOURCES.r07 },
      dataSolution: { ...createMinhangTask().dataSolution, items: [{ resourceId: 'r07', role: 'PARTIAL_MATCH', inclusionState: 'NOT_INCLUDED', coverage: [], limitations: [], evidenceRefs: [] }] }
    });
    expect(selectCandidateSolutionStatus(task, 'r07')).toBe('PARTIAL_RECORDED');
  });

  it('rejects a whole overlapping permission batch without creating r07', async () => {
    const service = new MockFindDataService();
    const base = createMinhangTask();
    const browsed = apply(base, (await service.submitTurn(base, '我先看看民政相关资源')).events);
    const detailed = apply(browsed, (await service.submitTurn(browsed, '查看人口明细')).events);
    const first = await service.executeAction(detailed, { actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r02'], actionType: 'query' } });
    const requested = apply(detailed, first.events);
    const second = await service.executeAction(requested, { actionCode: 'CREATE_PERMISSION_REQUEST', payload: { resourceIds: ['r02', 'r07'], actionType: 'query' } });
    const finalTask = apply(requested, second.events);
    expect(second.events.some((event) => event.type === 'PERMISSION_REQUEST_CREATED')).toBe(false);
    expect(Object.values(finalTask.permissionRequests)).toHaveLength(1);
    expect(JSON.stringify(second)).toContain('其他资源尚未提交');
  });
});
