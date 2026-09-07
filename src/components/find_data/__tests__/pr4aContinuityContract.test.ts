import { describe, expect, it } from 'vitest';
import { AskResultSnapshot, DirectMetricQueryState, FindDataTaskState } from '../model/FindDataTask';
import { findDataReducer } from '../model/findDataReducer';
import {
  selectCanonicalMetricExecutionRef,
  selectDirectMetricQueryReadiness,
  selectEffectiveDataSolution,
  selectResultSnapshots
} from '../model/findDataSelectors';
import { MINHANG_RESOURCES } from '../fixtures/minhangBedSupplyFixture';
import { createEmptyTask, createSolutionItem } from './testUtils/findDataFactories';

function currentSolutionTask(overrides: Partial<FindDataTaskState> = {}): FindDataTaskState {
  return createEmptyTask({
    taskId: 'continuity_task',
    requirementRevision: 4,
    searchRevision: 7,
    resources: { r01: MINHANG_RESOURCES.r01, r04: MINHANG_RESOURCES.r04, r05: MINHANG_RESOURCES.r05 },
    dataSolution: {
      state: 'READY',
      basedOnRequirementRevision: 4,
      basedOnSearchRevision: 7,
      items: [createSolutionItem({ resourceId: 'r01' }), createSolutionItem({ resourceId: 'r04' })],
      gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '2026-09-07T00:00:00.000Z'
    },
    ...overrides
  });
}

function dataSolutionQuery(overrides: Partial<DirectMetricQueryState> = {}): DirectMetricQueryState {
  return {
    requestId: 'solution_query_1',
    metricId: 'met_elderly_population',
    source: {
      kind: 'DATA_SOLUTION',
      resourceId: 'r01',
      requirementRevision: 4,
      searchRevision: 7
    },
    requestedConditions: {
      region: '浦锦街道',
      timeRange: { start: '2026-08', end: '2026-08' },
      populationDefinition: '60 岁及以上常住人口'
    },
    status: 'READY',
    preparedAt: '2026-09-07T00:00:00.000Z',
    ...overrides
  };
}

function directSnapshot(task: FindDataTaskState, query: DirectMetricQueryState): AskResultSnapshot {
  return {
    binding: {
      kind: 'DIRECT_METRIC',
      taskId: task.taskId,
      requestId: query.requestId,
      metricId: query.metricId,
      requirementRevision: query.source.kind === 'DATA_SOLUTION'
        ? query.source.requirementRevision
        : task.requirementRevision
    },
    executedAt: '2026-09-07T01:00:00.000Z',
    metricName: '老年人口数',
    numeratorLabel: '60 岁及以上常住人口',
    resultArtifact: {
      resultRef: { kind: 'SERVICE_RESULT', id: 'direct_result_1' },
      content: {
        kind: 'SCALAR', label: '浦锦街道老年人口数',
        value: { kind: 'NUMBER', state: 'VALUE', value: 20000, unit: '人', precision: 0 }
      },
      boundaryNotice: '测试结果。'
    }
  };
}

describe('PR-4A effective data solution and execution identity', () => {
  it('recognizes only a READY solution with both exact current revisions', () => {
    const current = currentSolutionTask();
    expect(selectEffectiveDataSolution(current)).toBe(current.dataSolution);
    expect(selectEffectiveDataSolution(currentSolutionTask({
      dataSolution: { ...current.dataSolution, basedOnRequirementRevision: 3 }
    }))).toBeUndefined();
    expect(selectEffectiveDataSolution(currentSolutionTask({
      dataSolution: { ...current.dataSolution, basedOnSearchRevision: 6 }
    }))).toBeUndefined();
    for (const state of ['EMPTY', 'EVALUATING', 'STALE'] as const) {
      expect(selectEffectiveDataSolution(currentSolutionTask({
        dataSolution: { ...current.dataSolution, state }
      }))).toBeUndefined();
    }
  });

  it('keeps resource and canonical execution identities explicitly separate', () => {
    const r01Ref = selectCanonicalMetricExecutionRef(MINHANG_RESOURCES.r01);
    expect(r01Ref).toEqual({ kind: 'METRIC', id: 'met_elderly_population', version: 'v1.1.0' });
    expect(MINHANG_RESOURCES.r01.id).not.toBe(r01Ref?.id);
    expect(selectCanonicalMetricExecutionRef({
      ...MINHANG_RESOURCES.r01,
      executionRef: { kind: 'METRIC', id: 'met_missing', version: 'v1.1.0' }
    })).toBeUndefined();
    expect(selectCanonicalMetricExecutionRef({
      ...MINHANG_RESOURCES.r01,
      executionRef: { kind: 'METRIC', id: '老年人口数', version: 'v1.1.0' }
    })).toBeUndefined();
  });

  it('does not give r04 or r05 a production metric identity', () => {
    expect(MINHANG_RESOURCES.r04.executionRef).toBeUndefined();
    expect(MINHANG_RESOURCES.r05.executionRef).toBeUndefined();
    expect(selectCanonicalMetricExecutionRef(MINHANG_RESOURCES.r04)).toBeUndefined();
    expect(selectCanonicalMetricExecutionRef(MINHANG_RESOURCES.r05)).toBeUndefined();
  });
});

describe('PR-4A data-solution direct-query freshness', () => {
  it('makes a current DATA_SOLUTION query runnable with bound conditions', () => {
    const task = currentSolutionTask({ directMetricQuery: dataSolutionQuery() });
    expect(selectDirectMetricQueryReadiness(task)).toEqual(expect.objectContaining({ ready: true }));
    const started = findDataReducer(task, {
      type: 'DIRECT_METRIC_QUERY_STARTED', payload: { requestId: 'solution_query_1' }
    });
    expect(started.directMetricQuery?.status).toBe('RUNNING');
  });

  it('blocks a query whose declared Data Solution resource does not have an exact canonical identity', () => {
    const task = currentSolutionTask({
      resources: {
        r01: {
          ...MINHANG_RESOURCES.r01,
          executionRef: { kind: 'METRIC', id: '老年人口数', version: 'v1.1.0' }
        },
        r04: MINHANG_RESOURCES.r04,
        r05: MINHANG_RESOURCES.r05
      },
      directMetricQuery: dataSolutionQuery()
    });
    expect(selectDirectMetricQueryReadiness(task)).toEqual(expect.objectContaining({ ready: false }));
    expect(findDataReducer(task, {
      type: 'DIRECT_METRIC_QUERY_PREPARED', payload: { query: dataSolutionQuery() }
    })).toBe(task);
  });

  it('stales a mutable direct query on a requirement revision change while preserving ASK_RESULT history', () => {
    const query = dataSolutionQuery({ status: 'RUNNING' });
    const task = currentSolutionTask({
      directMetricQuery: query,
      directMetricResult: directSnapshot(currentSolutionTask(), query),
      turns: [{
        turnId: 'historic_direct_turn', sender: 'ASSISTANT', createdAt: '',
        blocks: [{ type: 'ASK_RESULT', id: 'historic_direct_result', snapshot: directSnapshot(currentSolutionTask(), query) }]
      }]
    });
    const stale = findDataReducer(task, {
      type: 'REQUIREMENT_UPDATED', payload: { hypothesis: { bedDefinition: '养老床位核定数' } }
    });
    expect(stale.requirementRevision).toBe(5);
    expect(stale.directMetricQuery?.status).toBe('STALE');
    expect(stale.directMetricResult).toBeUndefined();
    expect(selectResultSnapshots(stale)).toHaveLength(1);
    expect(findDataReducer(stale, {
      type: 'DIRECT_METRIC_RESULT_RECEIVED', payload: { snapshot: directSnapshot(task, query) }
    })).toBe(stale);
  });

  it('stales a mutable direct query on a search revision change and rejects its delayed result', () => {
    const query = dataSolutionQuery({ status: 'RUNNING' });
    const task = currentSolutionTask({ directMetricQuery: query });
    const stale = findDataReducer(task, {
      type: 'SEARCH_STARTED', payload: { searchRevision: 8 }
    });
    expect(stale.searchRevision).toBe(8);
    expect(stale.directMetricQuery?.status).toBe('STALE');
    expect(selectDirectMetricQueryReadiness(stale)).toEqual(expect.objectContaining({ ready: false }));
    expect(findDataReducer(stale, {
      type: 'DIRECT_METRIC_RESULT_RECEIVED', payload: { snapshot: directSnapshot(task, query) }
    })).toBe(stale);
  });

  it('keeps the existing entry-context direct-metric contract runnable', () => {
    const query: DirectMetricQueryState = {
      requestId: 'entry_query_1', metricId: 'met_elderly_population',
      source: { kind: 'ENTRY_CONTEXT', entryId: 'entry_1' },
      status: 'READY', preparedAt: '2026-09-07T00:00:00.000Z'
    };
    const task = createEmptyTask({
      entryContext: {
        entryId: 'entry_1', source: 'METRIC_DETAIL',
        target: { kind: 'METRIC', id: 'met_elderly_population', version: 'v1.1.0' },
        intent: 'QUERY_VALUE', initialText: '查询指标值'
      },
      directMetricQuery: query
    });
    expect(selectDirectMetricQueryReadiness(task)).toEqual(expect.objectContaining({ ready: true }));
    expect(findDataReducer(task, {
      type: 'DIRECT_METRIC_QUERY_STARTED', payload: { requestId: query.requestId }
    }).directMetricQuery?.status).toBe('RUNNING');
  });
});
