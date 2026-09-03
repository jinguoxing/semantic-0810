import { describe, it, expect } from 'vitest';
import {
  selectDiscoverableResources,
  selectResourceById,
  selectResourceFields,
  selectRecommendedSolutionItems,
  selectExecutableSolutionItems,
  selectSolutionGroups
} from '../model/findDataSelectors';
import {
  MINHANG_RESOURCES,
  MINHANG_DATA_SOLUTION
} from '../fixtures/minhangBedSupplyFixture';
import { FindDataTaskState } from '../model/FindDataTask';

describe('findDataSelectors (AC-06, AC-10, AC-11, AC-12)', () => {
  const mockTask: FindDataTaskState = {
    taskId: 'test_task',
    title: '测试任务',
    status: 'READY',
    requirementHypothesis: {
      dimensions: [],
      analysisFocus: [],
      assumptions: [],
      unresolvedQuestions: []
    },
    searchScope: { domains: [], includeCrossDepartment: true },
    turns: [],
    resources: MINHANG_RESOURCES,
    dataSolution: MINHANG_DATA_SOLUTION,
    activeResourceId: 'r03',
    activeSurface: { type: 'CLOSED' },
    requirementRevision: 1,
    searchRevision: 1,
    createdAt: '',
    updatedAt: ''
  };

  it('AC-10: selectDiscoverableResources strictly excludes any resource with discover === DENIED', () => {
    // r_neg_rescue has discover: DENIED
    expect(mockTask.resources.r_neg_rescue.availabilityByAction.discover).toBe('DENIED');

    const discoverable = selectDiscoverableResources(mockTask);
    const hasNegativeSample = discoverable.some((r) => r.id === 'r_neg_rescue');
    expect(hasNegativeSample).toBe(false);

    // Should also return undefined when selecting directly by id
    const res = selectResourceById(mockTask, 'r_neg_rescue');
    expect(res).toBeUndefined();
  });

  it('AC-06: selectResourceFields returns empty array (0 fields) for r06 (养老机构基本信息)', () => {
    const r06Fields = selectResourceFields(mockTask, 'r06');
    expect(r06Fields).toBeDefined();
    expect(r06Fields).toHaveLength(0);

    // Whereas r03 has 18 fields
    const r03Fields = selectResourceFields(mockTask, 'r03');
    expect(r03Fields).toHaveLength(18);
  });

  it('AC-11 & AC-12: derived Recommended vs Executable views from the single DataSolution', () => {
    const recommended = selectRecommendedSolutionItems(mockTask);
    const executable = selectExecutableSolutionItems(mockTask);

    // Recommended includes resources even if query is REQUESTABLE (e.g. conditional resources)
    expect(recommended.length).toBeGreaterThan(0);

    // Executable ONLY includes items where query === 'ALLOWED'
    for (const item of executable) {
      expect(item.availabilityByAction.query).toBe('ALLOWED');
    }

    // Both views share same underlying solution items
    const groupsRecommended = selectSolutionGroups(mockTask, 'recommended');
    const groupsExecutable = selectSolutionGroups(mockTask, 'executable');
    expect(groupsRecommended.core).toHaveLength(2); // r01 and r04
    expect(groupsExecutable.core).toHaveLength(2);
  });
});
