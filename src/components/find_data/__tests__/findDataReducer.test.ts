import { describe, expect, it } from 'vitest';
import { findDataReducer } from '../model/findDataReducer';
import { FindDataEvent } from '../model/findDataEvents';
import { createEmptyTask, createResource, createSolutionItem } from './testUtils/findDataFactories';

function reduce(events: FindDataEvent[]) {
  return events.reduce(findDataReducer, createEmptyTask());
}

describe('findDataReducer task lifecycle', () => {
  it('keeps the first user turn while later events update the same task', () => {
    const state = reduce([
      { type: 'USER_TURN_SUBMITTED', payload: { text: '宽泛目标', turnId: 'u1' } },
      { type: 'SCENARIO_CLASSIFIED', payload: { scenarioKey: 'generic' } },
      { type: 'ASSISTANT_TURN_RECEIVED', payload: { turnId: 'a1', blocks: [], nextStatus: 'NEEDS_CLARIFICATION' } }
    ]);
    expect(state.turns.map((turn) => turn.turnId)).toEqual(['u1', 'a1']);
    expect(state.status).toBe('NEEDS_CLARIFICATION');
  });

  it('keeps status unless an assistant turn supplies nextStatus', () => {
    const searching = createEmptyTask({ status: 'SEARCHING' });
    const next = findDataReducer(searching, {
      type: 'ASSISTANT_TURN_RECEIVED', payload: { turnId: 'a1', blocks: [] }
    });
    expect(next.status).toBe('SEARCHING');
  });

  it('resolves the matching historical clarification as a read-only decision', () => {
    const task = createEmptyTask({
      requirementRevision: 1,
      turns: [{ turnId: 'a1', sender: 'ASSISTANT', createdAt: '', blocks: [{
        type: 'CLARIFICATION', id: 'block1', question: {
          id: 'q1', question: '请选择', type: 'SINGLE', options: [{ id: 'opt_pop', label: '老年人口规模与分布' }],
          resolution: { status: 'OPEN', selectedOptionIds: [] }
        }
      }] }]
    });
    const next = findDataReducer(task, {
      type: 'CLARIFICATION_RESOLVED',
      payload: { questionId: 'q1', selectedOptionIds: ['opt_pop'], selectedOptionLabels: ['老年人口规模与分布'], requirementRevision: 2, resolvedAt: '2026-09-04T01:00:00.000Z' }
    });
    const block = next.turns[0].blocks[0];
    expect(block.type === 'CLARIFICATION' && block.question.resolution).toEqual({
      status: 'RESOLVED', selectedOptionIds: ['opt_pop'], resolvedAt: '2026-09-04T01:00:00.000Z', resolvedAtRequirementRevision: 2
    });
  });
});

describe('findDataReducer search result contract', () => {
  const r1 = createResource({ id: 'r1' });
  const r2 = createResource({ id: 'r2' });
  const r3 = createResource({ id: 'r3' });

  function searchEvent(mode: 'REPLACE' | 'MERGE'): FindDataEvent {
    return {
      type: 'SEARCH_RESULTS_RECEIVED',
      payload: {
        taskId: 'task_test', requirementRevision: 1, searchRevision: 2, query: 'new', totalMatches: 2,
        resourceUpserts: [r2, r3],
        candidateDelta: { retainedIds: ['r2'], addedIds: ['r3'], removedIds: ['r1'], allCandidateIds: ['r2', 'r3'] },
        solutionPatch: {
          mode, upsertItems: [createSolutionItem({ resourceId: 'r3' })], removeResourceIds: ['r1'],
          relationshipEvidence: [{ sourceResourceId: 'r2', targetResourceId: 'r3', relationType: 'SUPPLEMENT', verificationStatus: 'CONFIRMED', evidenceLevel: 'STRONG', evidenceRefs: ['测试'], description: '补充' }],
          coverageSummary: ['新覆盖'], limitationSummary: ['新限制']
        }
      }
    };
  }

  function existingTask() {
    return createEmptyTask({
      requirementRevision: 1, searchRevision: 2, activeResourceId: 'r1', activeSurface: { type: 'FIELDS', resourceIds: ['r1'] },
      resources: { r1, r2 }, searchResult: { query: 'old', totalMatches: 2, candidateIds: ['r1', 'r2'], candidateSnapshot: [], returnedCount: 2 },
      dataSolution: {
        state: 'READY', basedOnRequirementRevision: 1, basedOnSearchRevision: 2,
        items: [createSolutionItem({ resourceId: 'r1' }), createSolutionItem({ resourceId: 'r2' })], gaps: [],
        relationshipEvidence: [], coverageSummary: ['旧覆盖'], limitationSummary: ['旧限制'], updatedAt: ''
      }
    });
  }

  it('rejects a result for another task or stale revisions', () => {
    const task = existingTask();
    const event = searchEvent('REPLACE');
    if (event.type !== 'SEARCH_RESULTS_RECEIVED') throw new Error('unexpected event');
    expect(findDataReducer(task, { ...event, payload: { ...event.payload, taskId: 'other' } })).toBe(task);
    expect(findDataReducer(task, { ...event, payload: { ...event.payload, searchRevision: 1 } })).toBe(task);
  });

  it('REPLACE removes old candidates and solution items and closes their surface', () => {
    const next = findDataReducer(existingTask(), searchEvent('REPLACE'));
    expect(next.searchResult?.candidateIds).toEqual(['r2', 'r3']);
    expect(next.dataSolution.items.map((item) => item.resourceId)).toEqual(['r3']);
    expect(next.activeResourceId).toBeUndefined();
    expect(next.activeSurface.type).toBe('CLOSED');
  });

  it('MERGE retains existing items, adds new items, and updates solution metadata', () => {
    const next = findDataReducer(existingTask(), searchEvent('MERGE'));
    expect(next.dataSolution.items.map((item) => item.resourceId)).toEqual(['r2', 'r3']);
    expect(next.dataSolution.relationshipEvidence).toHaveLength(1);
    expect(next.dataSolution.coverageSummary).toEqual(['新覆盖']);
    expect(next.dataSolution.limitationSummary).toEqual(['新限制']);
  });
});

describe('findDataReducer solution selection', () => {
  it('selects only one resource inside an alternative group', () => {
    const task = createEmptyTask({ dataSolution: {
      state: 'READY', basedOnRequirementRevision: 0, basedOnSearchRevision: 0,
      items: [
        createSolutionItem({ resourceId: 'r2', selectionGroupId: 'population_detail_alternative', inclusionState: 'SELECTED' }),
        createSolutionItem({ resourceId: 'r3', selectionGroupId: 'population_detail_alternative', inclusionState: 'RECOMMENDED' })
      ], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: ''
    } });
    const next = findDataReducer(task, { type: 'RESOURCE_SELECTED', payload: { resourceId: 'r3' } });
    expect(next.dataSolution.items.map((item) => item.inclusionState)).toEqual(['NOT_INCLUDED', 'SELECTED']);
  });
});

describe('requirement recomposition and operation ordering', () => {
  it('invalidates a former Ask Plan and puts the former solution into evaluation', () => {
    const task = createEmptyTask({
      requirementRevision: 1,
      askPlan: {
        id: 'plan', title: '旧计划', status: 'READY_TO_RUN', coreResourceIds: [], conditionalResourceIds: [],
        permissionCheckState: 'ALLOWED', permissionBaseline: {}, requirementRevision: 1,
        calculationSpec: { metricName: 'x', isOfficialMetric: false, formula: 'x', formulaExplanation: 'x', numerator: 'x', denominator: 'x', multiplier: 1, benchmarkRule: 'RANK_ONLY', strictConclusionBoundary: 'x' }
      },
      dataSolution: { ...createEmptyTask().dataSolution, state: 'READY', items: [createSolutionItem({ resourceId: 'r1' })] }
    });
    const events: FindDataEvent[] = [
      { type: 'REQUIREMENT_UPDATED', payload: { hypothesis: { timeRange: { start: '2024.01', end: '2024.12' } } } },
      { type: 'ASK_PLAN_INVALIDATED', payload: { reason: '需求已更新' } },
      { type: 'COMPARISON_MODEL_CLEARED' },
      { type: 'SOLUTION_EVALUATION_STARTED', payload: { requirementRevision: 2 } },
      { type: 'SEARCH_STARTED', payload: { searchRevision: 1 } }
    ];
    const next = events.reduce(findDataReducer, task);
    expect(next.askPlan).toBeUndefined();
    expect(next.dataSolution.state).toBe('EVALUATING');
    expect(next.dataSolution.items).toHaveLength(1);
  });

  it('only completes the pending operation that started the mutation', () => {
    const started = findDataReducer(createEmptyTask(), {
      type: 'OPERATION_STARTED', payload: { operationId: 'new', operationType: 'TURN', startedAt: '2026-09-04T00:00:00.000Z' }
    });
    const stale = findDataReducer(started, { type: 'OPERATION_COMPLETED', payload: { operationId: 'old' } });
    expect(stale.pendingOperation?.operationId).toBe('new');
    const completed = findDataReducer(stale, { type: 'OPERATION_COMPLETED', payload: { operationId: 'new' } });
    expect(completed.pendingOperation).toBeUndefined();
    expect(completed.lastCompletedOperationId).toBe('new');
  });
});
