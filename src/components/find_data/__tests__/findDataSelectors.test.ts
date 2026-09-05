import { describe, expect, it } from 'vitest';
import {
  selectDiscoverableResources,
  selectConversationTurnApplicability,
  selectExecutionAssessments,
  selectExecutableSolutionItems,
  selectPermissionRelevantItems,
  selectPartialMatchItems,
  selectRecommendedSolutionItems,
  selectResourceById,
  selectResourceFields,
  selectSolutionGroups,
  getDataSolutionDisplayState
} from '../model/findDataSelectors';
import { deniedResourceFixture } from './fixtures/deniedResourceFixture';
import { createAskPlan, createEmptyTask, createResource, createSolutionItem, permissionsWithQuery } from './testUtils/findDataFactories';

describe('find-data selectors', () => {
  it('never exposes a discovery-denied test resource', () => {
    const task = createEmptyTask({ resources: { denied: deniedResourceFixture } });
    expect(selectDiscoverableResources(task)).toEqual([]);
    expect(selectResourceById(task, deniedResourceFixture.id)).toBeUndefined();
  });

  it('returns the selected resource fields or a credible empty array', () => {
    const withoutFields = createResource({ id: 'empty' });
    const withFields = createResource({ id: 'fields', fields: [{
      name: 'month', businessName: '月份', type: 'CHAR(6)', group: '主体标识与时间', role: '时间', goalRelation: '分析月份', isKey: true
    }] });
    const task = createEmptyTask({ resources: { empty: withoutFields, fields: withFields } });
    expect(selectResourceFields(task, 'empty')).toEqual([]);
    expect(selectResourceFields(task, 'fields')).toHaveLength(1);
  });

  it('partial matches remain visible even when NOT_INCLUDED', () => {
    const resource = createResource({ id: 'partial' });
    const item = createSolutionItem({ resourceId: 'partial', role: 'PARTIAL_MATCH', inclusionState: 'NOT_INCLUDED' });
    const task = createEmptyTask({ resources: { partial: resource }, dataSolution: {
      ...createEmptyTask().dataSolution, state: 'READY', items: [item], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: ''
    } });
    expect(selectPartialMatchItems(task)).toEqual([item]);
    expect(selectRecommendedSolutionItems(task)).toEqual([]);
    expect(selectSolutionGroups(task).partialMatch).toEqual([item]);
  });

  it('partial matches never enter the executable collection', () => {
    const task = createEmptyTask({
      resources: { partial: createResource({ id: 'partial' }) },
      dataSolution: { ...createEmptyTask().dataSolution, state: 'READY', items: [createSolutionItem({ resourceId: 'partial', role: 'PARTIAL_MATCH' })], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    expect(selectExecutableSolutionItems(task)).toEqual([]);
  });

  it('query-requestable resources never enter the executable collection', () => {
    const task = createEmptyTask({
      resources: { requestable: createResource({ id: 'requestable', availabilityByAction: permissionsWithQuery('REQUESTABLE') }) },
      dataSolution: { ...createEmptyTask().dataSolution, state: 'READY', items: [createSolutionItem({ resourceId: 'requestable' })], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    expect(selectExecutableSolutionItems(task)).toEqual([]);
  });

  it('NOT_INCLUDED resources never enter the executable collection', () => {
    const task = createEmptyTask({
      resources: { excluded: createResource({ id: 'excluded' }) },
      dataSolution: { ...createEmptyTask().dataSolution, state: 'READY', items: [createSolutionItem({ resourceId: 'excluded', inclusionState: 'NOT_INCLUDED' })], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    expect(selectExecutableSolutionItems(task)).toEqual([]);
  });

  it('conditional support requires relationship evidence to execute', () => {
    const resource = createResource({ id: 'conditional' });
    const item = createSolutionItem({ resourceId: 'conditional', role: 'CONDITIONAL_SUPPORT' });
    const base = createEmptyTask({ resources: { conditional: resource }, dataSolution: {
      ...createEmptyTask().dataSolution, state: 'READY', items: [item], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: ''
    } });
    expect(selectExecutableSolutionItems(base)).toEqual([]);
    const related = { ...base, dataSolution: { ...base.dataSolution, relationshipEvidence: [{
      sourceResourceId: 'conditional', targetResourceId: 'core', relationType: 'SUPPLEMENT' as const,
      verificationStatus: 'CONFIRMED' as const, evidenceLevel: 'STRONG' as const, evidenceRefs: ['测试'], description: '支撑'
    }] } };
    expect(selectExecutableSolutionItems(related)).toEqual([item]);
  });

  it('keeps candidates separate from formal solution membership', () => {
    const task = createEmptyTask({
      resources: {
        r02: createResource({ id: 'r02' }),
        r03: createResource({ id: 'r03' })
      },
      searchResult: {
        query: '人口明细', totalMatches: 2, returnedCount: 2, candidateIds: ['r02', 'r03'],
        candidateSnapshot: [
          { resourceId: 'r02', title: '人口基本信息', reason: '可选明细', matchType: 'RELATED', proposedRole: 'OPTIONAL_DRILLDOWN', sourceSearchRevision: 2 },
          { resourceId: 'r03', title: '月度人口快照', reason: '更适合月度', matchType: 'RELATED', proposedRole: 'OPTIONAL_DRILLDOWN', sourceSearchRevision: 2 }
        ]
      }
    });
    expect(selectPermissionRelevantItems(task)).toEqual([]);
    expect(task.dataSolution.items).toEqual([]);
    expect(selectExecutionAssessments(task)).toEqual([]);
  });

  it('explains permission, partial-match, optional and relationship exclusions', () => {
    const task = createEmptyTask({
      resources: {
        requestable: createResource({ id: 'requestable', availabilityByAction: permissionsWithQuery('REQUESTABLE') }),
        partial: createResource({ id: 'partial' }),
        optional: createResource({ id: 'optional' }),
        conditional: createResource({ id: 'conditional' })
      },
      dataSolution: {
        ...createEmptyTask().dataSolution,
        state: 'READY',
        items: [
          createSolutionItem({ resourceId: 'requestable' }),
          createSolutionItem({ resourceId: 'partial', role: 'PARTIAL_MATCH' }),
          createSolutionItem({ resourceId: 'optional', role: 'OPTIONAL_DRILLDOWN' }),
          createSolutionItem({ resourceId: 'conditional', role: 'CONDITIONAL_SUPPORT' })
        ]
      }
    });
    expect(selectExecutionAssessments(task).map((assessment) => assessment.reason)).toEqual([
      'QUERY_PERMISSION_REQUIRED', 'PARTIAL_MATCH', 'OPTIONAL_DRILLDOWN', 'RELATIONSHIP_NOT_READY'
    ]);
  });

  it('does not treat semantic-only evidence as a confirmed executable relationship', () => {
    const item = createSolutionItem({ resourceId: 'conditional', role: 'CONDITIONAL_SUPPORT' });
    const task = createEmptyTask({
      resources: { conditional: createResource({ id: 'conditional' }) },
      dataSolution: {
        ...createEmptyTask().dataSolution,
        state: 'READY',
        items: [item],
        relationshipEvidence: [{
          sourceResourceId: 'conditional', targetResourceId: 'core', relationType: 'ANALYTICAL_COMPATIBILITY',
          verificationStatus: 'SEMANTIC_ONLY', evidenceLevel: 'MEDIUM', evidenceRefs: ['语义目录'], description: '仅语义关联'
        }]
      }
    });
    expect(selectExecutionAssessments(task)[0]?.reason).toBe('RELATIONSHIP_NOT_READY');
  });

  it('distinguishes complete, partial, and gap-only data-solution display states', () => {
    const complete = createEmptyTask({
      scenarioKey: 'minhang_bed_supply',
      resources: {
        r01: createResource({ id: 'r01', analysisDimensions: ['street_town', 'month'], timeGrain: 'MONTH' }),
        r04: createResource({ id: 'r04', analysisDimensions: ['street_town', 'month'], timeGrain: 'MONTH' })
      },
      dataSolution: {
        ...createEmptyTask().dataSolution,
        state: 'READY',
        items: [createSolutionItem({ resourceId: 'r01' }), createSolutionItem({ resourceId: 'r04' })],
        relationshipEvidence: [{ sourceResourceId: 'r04', targetResourceId: 'r01', relationType: 'ANALYTICAL_COMPATIBILITY', verificationStatus: 'SEMANTIC_ONLY', evidenceLevel: 'MEDIUM', description: '语义关系', evidenceRefs: ['test'] }]
      }
    });
    const partial = createEmptyTask({
      dataSolution: { ...createEmptyTask().dataSolution, state: 'READY', items: [createSolutionItem({ resourceId: 'r07', role: 'PARTIAL_MATCH', inclusionState: 'NOT_INCLUDED' })] }
    });
    const gapOnly = createEmptyTask({
      dataSolution: { ...createEmptyTask().dataSolution, state: 'READY', gaps: [{ id: 'gap', title: '缺口', description: '缺口', impactLevel: 'HIGH', mitigation: '补充', status: 'OPEN' }] }
    });
    expect(getDataSolutionDisplayState(complete).label).toBe('推荐就绪');
    expect(getDataSolutionDisplayState(partial).label).toBe('部分覆盖');
    expect(getDataSolutionDisplayState(gapOnly).label).toBe('当前仅发现缺口');
  });

  it('keeps historic bodies intact while exposing only the applicable source warning', () => {
    const task = createEmptyTask({ requirementRevision: 2, searchRevision: 3 });
    const resultTurn = {
      turnId: 'old_result', sender: 'ASSISTANT' as const, createdAt: '',
      blocks: [{ type: 'TEXT' as const, id: 'summary', content: '原始分析摘要，不应被改写。' }],
      source: { kind: 'ASK_RESULT' as const, requirementRevision: 1, searchRevision: 1, askPlanId: 'old_plan', resultExecutedAt: '2026-09-04T00:00:00.000Z' }
    };
    expect(selectConversationTurnApplicability(task, resultTurn)).toEqual({
      historical: true, kind: 'ASK_RESULT', message: '历史结果，尚未按新需求重新计算。'
    });
    expect(resultTurn.blocks[0].content).toBe('原始分析摘要，不应被改写。');

    const legacyTurn = { ...resultTurn, turnId: 'legacy', source: undefined };
    expect(selectConversationTurnApplicability(task, legacyTurn).message).toBe('历史内容，当前适用性需结合最新方案确认。');
  });

  it('does not mark a source-linked analysis result historical just because candidates changed', () => {
    const task = createEmptyTask({
      requirementRevision: 1,
      searchRevision: 2,
      askPlan: createAskPlan({
        id: 'plan_current', status: 'COMPLETED', coreResourceIds: [],
        lastRunResult: { success: true, executedAt: '2026-09-05T00:00:00.000Z', permissionSnapshot: {} }
      })
    });
    const resultTurn = {
      turnId: 'current_result', sender: 'ASSISTANT' as const, createdAt: '', blocks: [],
      source: { kind: 'ASK_RESULT' as const, requirementRevision: 1, searchRevision: 1, askPlanId: 'plan_current', resultExecutedAt: '2026-09-05T00:00:00.000Z' }
    };
    expect(selectConversationTurnApplicability(task, resultTurn).historical).toBe(false);
  });
});
