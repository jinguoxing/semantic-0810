import { describe, it, expect } from 'vitest';
import { findDataReducer, initialFindDataTaskState } from '../model/findDataReducer';
import { FindDataEvent } from '../model/findDataEvents';
import { FindDataTaskState } from '../model/FindDataTask';

describe('findDataReducer (AC-01, AC-02, AC-18)', () => {
  it('AC-01: initializes state and processes USER_TURN_SUBMITTED and ASSISTANT_TURN_RECEIVED', () => {
    const state0 = initialFindDataTaskState;
    expect(state0.requirementRevision).toBe(0);
    expect(state0.searchRevision).toBe(0);
    expect(state0.status).toBe('IDLE');

    // 1. Submit User Turn
    const userAction: FindDataEvent = {
      type: 'USER_TURN_SUBMITTED',
      payload: {
        text: '帮我评估闵行区老龄化与养老床位',
        turnId: 'turn_u_1'
      }
    };
    const state1 = findDataReducer(state0, userAction);
    expect(state1.status).toBe('UNDERSTANDING');
    expect(state1.runtimeStatus?.active).toBe(true);
    expect(state1.turns).toHaveLength(1);
    expect(state1.turns[0].sender).toBe('USER');
    expect(state1.turns[0].blocks[0].type).toBe('TEXT');

    // 2. Receive Assistant Turn
    const assistantAction: FindDataEvent = {
      type: 'ASSISTANT_TURN_RECEIVED',
      payload: {
        turnId: 'turn_a_1',
        blocks: [
          {
            type: 'TEXT',
            id: 'b1',
            content: '已为您定位核心指标'
          }
        ]
      }
    };
    const state2 = findDataReducer(state1, assistantAction);
    expect(state2.status).toBe('READY');
    expect(state2.runtimeStatus).toBeUndefined();
    expect(state2.turns).toHaveLength(2);
    expect(state2.turns[1].sender).toBe('ASSISTANT');
  });

  it('AC-02: strictly ignores SEARCH_RESULTS_RECEIVED when revisions mismatch (revision guard)', () => {
    const currentState: FindDataTaskState = {
      ...initialFindDataTaskState,
      requirementRevision: 2,
      searchRevision: 3,
      dataSolution: {
        items: [],
        gaps: [],
        relationshipEvidence: [],
        coverageSummary: [],
        limitationSummary: [],
        updatedAt: ''
      }
    };

    // Stale result with older searchRevision 2
    const staleAction: FindDataEvent = {
      type: 'SEARCH_RESULTS_RECEIVED',
      payload: {
        requirementRevision: 2,
        searchRevision: 2, // Mismatch!
        discoveredResourceIds: ['r01'],
        solutionItems: [
          {
            resourceId: 'r01',
            role: 'CORE',
            inclusionState: 'SELECTED',
            coverage: [],
            limitations: [],
            evidenceRefs: [],
            availabilityByAction: {
              discover: 'ALLOWED',
              viewMetadata: 'ALLOWED',
              preview: 'ALLOWED',
              query: 'ALLOWED',
              export: 'ALLOWED'
            }
          }
        ]
      }
    };

    const nextState = findDataReducer(currentState, staleAction);
    // Should NOT write stale items!
    expect(nextState).toBe(currentState);
    expect(nextState.dataSolution.items).toHaveLength(0);

    // Matching revision result
    const validAction: FindDataEvent = {
      type: 'SEARCH_RESULTS_RECEIVED',
      payload: {
        requirementRevision: 2,
        searchRevision: 3, // Matches!
        discoveredResourceIds: ['r01'],
        solutionItems: staleAction.payload.solutionItems
      }
    };

    const validState = findDataReducer(currentState, validAction);
    expect(validState.dataSolution.items).toHaveLength(1);
    expect(validState.dataSolution.items[0].resourceId).toBe('r01');
  });

  it('AC-18: maintains purity - does not mutate original state', () => {
    const stateA = { ...initialFindDataTaskState, turns: [] };
    const frozenState = Object.freeze({ ...stateA });

    const action: FindDataEvent = {
      type: 'USER_TURN_SUBMITTED',
      payload: {
        text: '测试纯函数',
        turnId: 't_pure'
      }
    };

    const stateB = findDataReducer(frozenState as FindDataTaskState, action);
    expect(stateB).not.toBe(frozenState);
    expect(frozenState.turns).toHaveLength(0);
    expect(stateB.turns).toHaveLength(1);
  });
});
