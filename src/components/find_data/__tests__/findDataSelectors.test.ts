import { describe, expect, it } from 'vitest';
import {
  selectDiscoverableResources,
  selectExecutableSolutionItems,
  selectPartialMatchItems,
  selectRecommendedSolutionItems,
  selectResourceById,
  selectResourceFields,
  selectSolutionGroups
} from '../model/findDataSelectors';
import { deniedResourceFixture } from './fixtures/deniedResourceFixture';
import { createEmptyTask, createResource, createSolutionItem, permissionsWithQuery } from './testUtils/findDataFactories';

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
      items: [item], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: ''
    } });
    expect(selectPartialMatchItems(task)).toEqual([item]);
    expect(selectRecommendedSolutionItems(task)).toEqual([]);
    expect(selectSolutionGroups(task).partialMatch).toEqual([item]);
  });

  it('partial matches never enter the executable collection', () => {
    const task = createEmptyTask({
      resources: { partial: createResource({ id: 'partial' }) },
      dataSolution: { items: [createSolutionItem({ resourceId: 'partial', role: 'PARTIAL_MATCH' })], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    expect(selectExecutableSolutionItems(task)).toEqual([]);
  });

  it('query-requestable resources never enter the executable collection', () => {
    const task = createEmptyTask({
      resources: { requestable: createResource({ id: 'requestable', availabilityByAction: permissionsWithQuery('REQUESTABLE') }) },
      dataSolution: { items: [createSolutionItem({ resourceId: 'requestable' })], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    expect(selectExecutableSolutionItems(task)).toEqual([]);
  });

  it('NOT_INCLUDED resources never enter the executable collection', () => {
    const task = createEmptyTask({
      resources: { excluded: createResource({ id: 'excluded' }) },
      dataSolution: { items: [createSolutionItem({ resourceId: 'excluded', inclusionState: 'NOT_INCLUDED' })], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    expect(selectExecutableSolutionItems(task)).toEqual([]);
  });

  it('conditional support requires relationship evidence to execute', () => {
    const resource = createResource({ id: 'conditional' });
    const item = createSolutionItem({ resourceId: 'conditional', role: 'CONDITIONAL_SUPPORT' });
    const base = createEmptyTask({ resources: { conditional: resource }, dataSolution: {
      items: [item], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: ''
    } });
    expect(selectExecutableSolutionItems(base)).toEqual([]);
    const related = { ...base, dataSolution: { ...base.dataSolution, relationshipEvidence: [{
      sourceResourceId: 'conditional', targetResourceId: 'core', relationType: 'SUPPLEMENT' as const, description: '支撑'
    }] } };
    expect(selectExecutableSolutionItems(related)).toEqual([item]);
  });
});
