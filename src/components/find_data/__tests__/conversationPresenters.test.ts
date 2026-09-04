import { describe, expect, it } from 'vitest';
import {
  buildCoverageSummary,
  buildFieldSummary,
  buildGapSummary,
  buildPermissionSummary,
  buildRecommendationExplanation
} from '../presenters/conversationPresenters';
import { createEmptyTask, createResource, createSolutionItem } from './testUtils/findDataFactories';

describe('conversation presenters derive answers from task state', () => {
  it('does not fall back to a fixture resource when none is active', () => {
    expect(buildFieldSummary(createEmptyTask())).toBe('当前还没有选定资源，请先从候选结果中选择一个资源。');
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

  it('uses coverage, limitations, evidence, granularity, and time coverage for recommendations', () => {
    const task = createEmptyTask({
      resources: { custom: createResource({ id: 'custom', name: '推荐资源', granularity: '街镇', timeCoverage: '过去一年' }) },
      dataSolution: { ...createEmptyTask().dataSolution, state: 'READY', items: [createSolutionItem({ resourceId: 'custom', coverage: ['覆盖 A'], limitations: ['限制 B'], evidenceRefs: ['证据 C'] })], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    const summary = buildRecommendationExplanation(task, 'custom');
    expect(summary).toContain('街镇');
    expect(summary).toContain('过去一年');
    expect(summary).toContain('覆盖 A');
    expect(summary).toContain('限制 B');
    expect(summary).toContain('证据 C');
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
});
