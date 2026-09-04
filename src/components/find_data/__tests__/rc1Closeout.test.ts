import { describe, expect, it } from 'vitest';
import { composeMinhangSolution } from '../scenarios/minhangSolutionComposer';
import { MINHANG_RESOURCES } from '../fixtures/minhangBedSupplyFixture';
import {
  canExecuteTaskAction,
  selectAskHandoffReadiness,
  selectResourceFields,
  validateAnalyticalAlignment
} from '../model/findDataSelectors';
import { createAskPlan, createMinhangTask, createSolutionItem, permissionsWithQuery } from './testUtils/findDataFactories';

describe('RC1 deterministic composition and execution gates', () => {
  it('selects approved-bed r05 only when the confirmed bed definition requests that definition', () => {
    const task = createMinhangTask();
    const composition = composeMinhangSolution({ ...task.requirementHypothesis, bedDefinition: '民政核定养老床位数' }, MINHANG_RESOURCES);
    expect(composition.items.map((item) => item.resourceId)).toEqual(['r01', 'r05']);
    expect(composition.readiness).toBe('COMPLETE');
  });

  it('keeps service-use and unsupported population definitions out of the executable core', () => {
    const task = createMinhangTask();
    const serviceUse = composeMinhangSolution({ ...task.requirementHypothesis, analysisFocus: ['养老服务实际使用'] }, MINHANG_RESOURCES);
    const unsupported = composeMinhangSolution({ ...task.requirementHypothesis, populationDefinition: '失能老人' }, MINHANG_RESOURCES);
    expect(serviceUse.items).toMatchObject([{ resourceId: 'r07', role: 'PARTIAL_MATCH', inclusionState: 'NOT_INCLUDED' }]);
    expect(unsupported.items).toEqual([]);
    expect(unsupported.gaps[0]?.id).toBe('gap_population_definition');
  });

  it('allows semantic-only core resources to prepare Ask but refuses a partial-only solution', () => {
    const complete = createMinhangTask();
    expect(selectAskHandoffReadiness(complete)).toMatchObject({ ready: true, requiresRuntimeAlignmentValidation: true });
    const partial = createMinhangTask({
      dataSolution: { ...complete.dataSolution, items: [createSolutionItem({ resourceId: 'r07', role: 'PARTIAL_MATCH', inclusionState: 'NOT_INCLUDED' })], relationshipEvidence: [] },
      resources: { ...complete.resources, r07: MINHANG_RESOURCES.r07 }
    });
    expect(selectAskHandoffReadiness(partial)).toMatchObject({ ready: false, code: 'PARTIAL_MATCH_ONLY' });
  });

  it('validates dimensions, grain and time coverage at run time without promoting semantic evidence', () => {
    const task = createMinhangTask({ askPlan: createAskPlan({ permissionCheckState: 'ALLOWED' }) });
    expect(validateAnalyticalAlignment(task, task.askPlan!)).toMatchObject({ allowed: true, status: 'VALIDATED' });
    const misaligned = {
      ...task,
      resources: { ...task.resources, r04: { ...task.resources.r04, timeGrain: 'YEAR' as const } }
    };
    expect(validateAnalyticalAlignment(misaligned, misaligned.askPlan!)).toMatchObject({ allowed: false, status: 'GRAIN_NOT_ALIGNED' });
    expect(misaligned.dataSolution.relationshipEvidence[0]?.verificationStatus).toBe('SEMANTIC_ONLY');
  });

  it('enforces metadata permission before fields and expires historical actions after recomposition', () => {
    const task = createMinhangTask({
      activeResourceId: 'r01',
      resources: { ...createMinhangTask().resources, r01: { ...createMinhangTask().resources.r01, availabilityByAction: { ...permissionsWithQuery('ALLOWED'), viewMetadata: 'REQUESTABLE' } } }
    });
    expect(selectResourceFields(task, 'r01')).toEqual([]);
    expect(canExecuteTaskAction(task, 'OPEN_FIELDS', { resourceId: 'r01' })).toBe(false);
    expect(canExecuteTaskAction({ ...task, dataSolution: { ...task.dataSolution, items: [], gaps: [] } }, 'OPEN_SOLUTION')).toBe(false);
  });
});
