import { describe, expect, it } from 'vitest';
import {
  buildAskPlanPreparedSummary,
  buildAskRunCompletionSummary,
  buildAskRunFailureSummary,
  buildCandidateDiscoverySummary,
  buildCoverageSummary,
  buildFieldSummary,
  buildGapSummary,
  buildOperationFailureSummary,
  buildPermissionImpactSummary,
  buildPermissionRecheckSummary,
  buildPermissionRequestSubmittedSummary,
  buildPermissionSummary,
  buildRequirementChangeSummary,
  buildRecommendationExplanation,
  buildSelectionSuccessSummary,
  buildSolutionCompletionSummary
} from '../presenters/conversationPresenters';
import { MINHANG_MOCK_RESULT_SCOPE, MINHANG_RESOURCES, R03_FIELDS } from '../fixtures/minhangBedSupplyFixture';
import { createAskPlan, createEmptyTask, createMinhangTask, createResource, createSolutionItem, permissionsWithQuery } from './testUtils/findDataFactories';

describe('conversation presenters derive answers from task state', () => {
  it('does not fall back to a fixture resource when none is active', () => {
    expect(buildFieldSummary(createEmptyTask())).toBe('当前还没有可查看字段的资源，请先完成资源检索。');
  });

  it('uses the active resource field metadata', () => {
    const task = createEmptyTask({
      activeResourceId: 'custom',
      resources: { custom: createResource({ id: 'custom', name: '自定义资源', fields: [{
        name: 'field', businessName: '业务字段', type: 'TEXT', group: '其他', role: '维度', goalRelation: '目标', isKey: false
      }] }) }
    });
    expect(buildFieldSummary(task)).toContain('自定义资源');
    expect(buildFieldSummary(task)).toContain('业务字段');
  });

  it('uses coverage, limitations, granularity, and time coverage for recommendations without exposing evidence references', () => {
    const task = createEmptyTask({
      resources: { custom: createResource({ id: 'custom', name: '推荐资源', granularity: '街镇', timeCoverage: '过去一年' }) },
      dataSolution: { ...createEmptyTask().dataSolution, state: 'READY', items: [createSolutionItem({ resourceId: 'custom', coverage: ['覆盖 A'], limitations: ['限制 B'], evidenceRefs: ['证据 C'] })], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    const summary = buildRecommendationExplanation(task, 'custom');
    expect(summary).toContain('街镇');
    expect(summary).toContain('过去一年');
    expect(summary).toContain('覆盖 A');
    expect(summary).toContain('限制 B');
    expect(summary).not.toContain('证据 C');
    expect(summary).toContain('语义与元数据匹配');
  });

  it('does not invent a gap or coverage summary', () => {
    expect(buildGapSummary(createEmptyTask())).toBe('当前方案没有已登记的明确缺口。');
    expect(buildCoverageSummary(createEmptyTask())).toContain('尚未登记');
  });

  it('uses business names rather than internal ids in permission summaries', () => {
    const task = createEmptyTask({
      resources: { internal_id: createResource({ id: 'internal_id', name: '业务资源名' }) },
      dataSolution: { ...createEmptyTask().dataSolution, state: 'READY', items: [createSolutionItem({ resourceId: 'internal_id' })], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    expect(buildPermissionSummary(task)).toContain('业务资源名');
    expect(buildPermissionSummary(task)).not.toContain('internal_id');
  });

  it('gives a standalone initial solution conclusion with coverage and relationship limits', () => {
    const task = createMinhangTask({
      dataSolution: {
        ...createMinhangTask().dataSolution,
        limitationSummary: ['技术连接尚待分析阶段验证']
      }
    });
    const summary = buildSolutionCompletionSummary(task);
    expect(summary).toContain('已形成 2 项核心资源');
    expect(summary).toContain('60 岁以上常住人口数');
    expect(summary).toContain('在营可用养老床位数');
    expect(summary).toContain('具体维度与时间对齐仍需在分析阶段验证');
    expect(summary).toContain('已知限制');
    expect(summary).toContain('查看完整方案');
  });

  it('describes new detail candidates without treating them as selected solution items', () => {
    const base = createMinhangTask();
    const task = {
      ...base,
      resources: { ...base.resources, r02: MINHANG_RESOURCES.r02, r03: MINHANG_RESOURCES.r03 },
      searchResult: {
        ...base.searchResult,
        candidateIds: ['r01', 'r04', 'r02', 'r03'],
        candidateSnapshot: [
          ...base.searchResult!.candidateSnapshot,
          { resourceId: 'r02', title: MINHANG_RESOURCES.r02.name, reason: '相关明细', matchType: 'RELATED' as const, proposedRole: 'OPTIONAL_DRILLDOWN' as const, sourceSearchRevision: 2 },
          { resourceId: 'r03', title: MINHANG_RESOURCES.r03.name, reason: '相关明细', matchType: 'RELATED' as const, proposedRole: 'OPTIONAL_DRILLDOWN' as const, sourceSearchRevision: 2 }
        ]
      }
    };
    const summary = buildCandidateDiscoverySummary(task, ['r02', 'r03'], ['r02', 'r03']);
    expect(summary).toContain('本轮新增 2 项候选资源');
    expect(summary).toContain('尚未自动纳入当前方案');
    expect(summary).toContain('月度快照');
    expect(summary).toContain('更适合作为明细下钻候选');
  });

  it('explains that a selected monthly snapshot leaves its alternative in the candidate pool', () => {
    const base = createMinhangTask();
    const task = {
      ...base,
      resources: { ...base.resources, r02: MINHANG_RESOURCES.r02, r03: MINHANG_RESOURCES.r03 },
      searchResult: {
        ...base.searchResult!,
        candidateIds: ['r01', 'r04', 'r02', 'r03'],
        candidateSnapshot: [
          ...base.searchResult!.candidateSnapshot,
          { resourceId: 'r02', title: MINHANG_RESOURCES.r02.name, reason: '相关明细', matchType: 'RELATED' as const, proposedRole: 'OPTIONAL_DRILLDOWN' as const, sourceSearchRevision: 2 },
          { resourceId: 'r03', title: MINHANG_RESOURCES.r03.name, reason: '相关明细', matchType: 'RELATED' as const, proposedRole: 'OPTIONAL_DRILLDOWN' as const, sourceSearchRevision: 2 }
        ]
      },
      dataSolution: {
        ...base.dataSolution,
        items: [...base.dataSolution.items, createSolutionItem({ resourceId: 'r03', role: 'OPTIONAL_DRILLDOWN', selectionGroupId: 'population_detail_alternative' })]
      }
    };
    const summary = buildSelectionSuccessSummary(task, 'r03');
    expect(summary).toContain('可选明细下钻资源');
    expect(summary).toContain('不作为本次核心计算输入');
    expect(summary).toContain('人口基本信息视图');
    expect(summary).toContain('未加入正式方案');
  });

  it('answers field count, formal-metric, and missing-metadata states from resource metadata', () => {
    const countTask = createEmptyTask({
      activeResourceId: 'r03',
      resources: { r03: MINHANG_RESOURCES.r03 }
    });
    expect(buildFieldSummary(countTask, '它有多少字段')).toContain(`${R03_FIELDS.length} 个字段`);

    const metricTask = createEmptyTask({ activeResourceId: 'r01', resources: { r01: MINHANG_RESOURCES.r01 } });
    expect(buildFieldSummary(metricTask, '这个表有哪些字段')).toContain('不是物理数据表');

    const absentTask = createEmptyTask({ activeResourceId: 'r06', resources: { r06: MINHANG_RESOURCES.r06 } });
    expect(buildFieldSummary(absentTask, '这个表有哪些字段')).toContain('尚未登记可展示的字段元数据');
  });

  it('discloses the mock sample range before execution and reports it after execution', () => {
    const plan = createAskPlan({ timeRange: { start: '2025-09', end: '2026-08' } });
    expect(buildAskPlanPreparedSummary(plan, 'MOCK_FIXTURE')).toContain('当前演示实际仅返回 上海市闵行区，2026-08，月度 的样例');
    const result = {
      success: true,
      executedAt: '2026-09-05T00:00:00.000Z',
      dataOrigin: 'MOCK_FIXTURE' as const,
      permissionSnapshot: {},
      resultArtifact: {
        benchmarkLabel: '全区加权平均供给水平',
        benchmarkValue: '24.8 张 / 千人',
        summary: '测试摘要',
        belowBenchmarkCount: 2,
        townResults: [{ townName: '浦锦街道', supplyRatio: '14.2 张 / 千人', comparisonNote: '低于全区' }],
        actualScope: MINHANG_MOCK_RESULT_SCOPE,
        boundaryNotice: '仅用于演示'
      }
    };
    const summary = buildAskRunCompletionSummary(plan, result);
    expect(summary).toContain('本次实际分析范围：上海市闵行区，2026-08，月度');
    expect(summary).toContain('有 2 个街镇低于当前比较基准');
    expect(summary).toContain('结果来源：演示数据');
  });

  it('summarizes a time-only recomposition without re-listing candidates and invalidates the old plan', () => {
    const before = createMinhangTask({ askPlan: createAskPlan() });
    const effective = createMinhangTask({
      requirementRevision: 2,
      searchRevision: 2,
      askPlan: undefined,
      requirementHypothesis: { ...before.requirementHypothesis, timeRange: { start: '2024.09', end: '2025.08' } }
    });
    const summary = buildRequirementChangeSummary(before, effective);
    expect(summary).toContain('时间范围更新为 2024.09 至 2025.08');
    expect(summary).toContain('原核心指标仍能覆盖本次请求，资源组合保持不变');
    expect(summary).toContain('原分析计划已失效，需要按当前需求重新准备分析');
    expect(summary).not.toContain('候选资源');
  });

  it('describes an r04-to-r05 replacement with the approved-capacity conclusion boundary', () => {
    const before = createMinhangTask({ askPlan: createAskPlan() });
    const effective = createMinhangTask({
      requirementRevision: 2,
      searchRevision: 2,
      askPlan: undefined,
      resources: { r01: MINHANG_RESOURCES.r01, r05: MINHANG_RESOURCES.r05 },
      requirementHypothesis: { ...before.requirementHypothesis, bedDefinition: '养老床位核定数' },
      dataSolution: {
        ...before.dataSolution,
        basedOnRequirementRevision: 2,
        basedOnSearchRevision: 2,
        items: [createSolutionItem({ resourceId: 'r01' }), createSolutionItem({ resourceId: 'r05' })]
      }
    });
    const summary = buildRequirementChangeSummary(before, effective);
    expect(summary).toContain('60 岁以上常住人口数保持不变');
    expect(summary).toContain('床位核心指标由在营可用养老床位数替换为养老床位核定数');
    expect(summary).toContain('后续分析反映核定容量，不代表实际可用容量');
    expect(summary).toContain('原分析计划已失效');
  });

  it('explains that a requestable candidate does not block queryable core metrics', () => {
    const base = createMinhangTask();
    const task = {
      ...base,
      resources: { ...base.resources, r02: MINHANG_RESOURCES.r02 },
      searchResult: {
        ...base.searchResult!,
        candidateIds: ['r01', 'r04', 'r02'],
        candidateSnapshot: [
          ...base.searchResult!.candidateSnapshot,
          { resourceId: 'r02', title: MINHANG_RESOURCES.r02.name, reason: '人口明细', matchType: 'RELATED' as const, proposedRole: 'OPTIONAL_DRILLDOWN' as const, sourceSearchRevision: 1 }
        ]
      }
    };
    const summary = buildPermissionImpactSummary(task);
    expect(summary).toContain('2 项核心指标当前可查询');
    expect(summary).toContain('人口基本信息视图');
    expect(summary).toContain('这不阻塞当前核心计算');
    expect(summary).toContain('执行前仍会重新校验权限');
  });

  it('explains blocked and unknown core query permissions without claiming they are allowed or denied interchangeably', () => {
    const requestable = createMinhangTask({
      resources: {
        ...createMinhangTask().resources,
        r04: { ...createMinhangTask().resources.r04, availabilityByAction: permissionsWithQuery('REQUESTABLE') }
      }
    });
    expect(buildPermissionImpactSummary(requestable)).toContain('当前未获查询许可，但可以申请');

    const unknown = createMinhangTask({
      resources: {
        ...createMinhangTask().resources,
        r04: { ...createMinhangTask().resources.r04, availabilityByAction: permissionsWithQuery('UNKNOWN') }
      }
    });
    expect(buildPermissionImpactSummary(unknown)).toContain('查询权限状态尚未确认');
  });

  it('reports submitted permission and failed recheck or analysis as recoverable business states', () => {
    const task = createMinhangTask({ askPlan: createAskPlan() });
    const submitted = buildPermissionRequestSubmittedSummary(task, {
      requestId: 'permission_42', resourceIds: ['r04'], actionType: 'query', status: 'SUBMITTED', submittedAt: '2026-09-05T00:00:00.000Z'
    });
    expect(submitted).toContain('在营可用养老床位数');
    expect(submitted).toContain('查询权限');
    expect(submitted).toContain('permission_42');
    expect(submitted).toContain('权限尚未获得');

    expect(buildPermissionRecheckSummary(task, { decision: 'BLOCKED', updatedPermissions: {} }, true)).toContain('权限状态未能完成确认，暂不能执行');
    expect(buildAskRunFailureSummary({ ...task, askPlan: createAskPlan({ lastRunResult: { success: true, executedAt: '', permissionSnapshot: {} } }) }, '服务暂时不可用')).toContain('上次结果仍作为历史结果保留');
    expect(buildOperationFailureSummary(task, 'TURN')).toContain('原方案未因这次失败而改变');
  });
});
