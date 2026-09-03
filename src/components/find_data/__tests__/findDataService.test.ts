import { describe, it, expect } from 'vitest';
import { MockFindDataService } from '../services/MockFindDataService';

describe('MockFindDataService (AC-05, AC-08, AC-09, AC-13, AC-14, AC-17)', () => {
  const service = new MockFindDataService();

  it('AC-17: handles non-Minhang distinct queries without faking Minhang bed data', async () => {
    const customQuery = '帮我查询昨天全国各省份销售额与订单数';
    const task = await service.createTask({ initialQuery: customQuery });

    expect(task.title).toBe(customQuery);
    expect(task.scenarioKey).toBe('generic');
    expect(task.goal).toBe(customQuery);
    expect(task.turns[0].blocks[0]).toMatchObject({
      type: 'TEXT',
      content: customQuery
    });
    // Should NOT have Minhang beds preloaded
    expect(task.resources.r01).toBeUndefined();
    expect(task.dataSolution.items).toHaveLength(0);
  });

  it('AC-05: executeAction with SELECT_RESOURCE emits RESOURCE_SELECTED event', async () => {
    const task = await service.createTask({ initialQuery: '评估闵行区老龄化与养老床位' });
    const result = await service.executeAction(task, {
      actionCode: 'SELECT_RESOURCE',
      payload: { resourceId: 'r03' }
    });

    const selectEvent = result.events.find((e) => e.type === 'RESOURCE_SELECTED');
    expect(selectEvent).toBeDefined();
    if (selectEvent && selectEvent.type === 'RESOURCE_SELECTED') {
      expect(selectEvent.payload.resourceId).toBe('r03');
    }
  });

  it('AC-08: executeAction with KEEP_AS_GAP emits SOLUTION_GAP_UPSERTED and surfaceCommand is NO_CHANGE', async () => {
    const task = await service.createTask({ initialQuery: '闵行区养老服务评估' });
    const result = await service.executeAction(task, {
      actionCode: 'KEEP_AS_GAP'
    });

    const gapEvent = result.events.find((e) => e.type === 'SOLUTION_GAP_UPSERTED');
    expect(gapEvent).toBeDefined();
    expect(result.surfaceCommand?.action).toBe('NO_CHANGE');
  });

  it('AC-09: executeAction with EXPAND_SCOPE updates searchScope and bumps searchRevision', async () => {
    const task = await service.createTask({ initialQuery: '闵行区养老服务评估' });
    const initialRev = task.searchRevision;

    const result = await service.executeAction(task, {
      actionCode: 'EXPAND_SCOPE'
    });

    const searchStarted = result.events.find((e) => e.type === 'SEARCH_STARTED');
    expect(searchStarted).toBeDefined();
    if (searchStarted && searchStarted.type === 'SEARCH_STARTED') {
      expect(searchStarted.payload.searchRevision).toBe(initialRev + 1);
    }

    const searchResults = result.events.find((e) => e.type === 'SEARCH_RESULTS_RECEIVED');
    expect(searchResults).toBeDefined();
    if (searchResults && searchResults.type === 'SEARCH_RESULTS_RECEIVED') {
      expect(searchResults.payload.discoveredResourceIds).toContain('r05');
    }
  });

  it('AC-13: recheckPermissions validates core resources before execution', async () => {
    const task = await service.createTask();
    const result = await service.recheckPermissions(task, ['r01', 'r04'], 'query');

    expect(result.decision).toBe('ALLOWED');
    expect(result.updatedPermissions.r01.query).toBe('ALLOWED');
    expect(result.updatedPermissions.r04.query).toBe('ALLOWED');
  });

  it('AC-14: runAskPlan produces results strictly complying with conclusion boundary', async () => {
    const task = await service.createTask();
    expect(task.askPlan).toBeDefined();
    if (!task.askPlan) return;

    const result = await service.runAskPlan(task, task.askPlan);
    expect(result.success).toBe(true);
    expect(result.resultArtifact).toBeDefined();
    expect(result.resultArtifact?.districtWeightedAverage).toBe('24.8 张 / 千人');

    // Strict boundary verification: must NOT state 供需不足!
    const notice = result.resultArtifact?.boundaryNotice || '';
    expect(notice).toContain('相对全区加权平均偏低，建议进一步核查');
    expect(notice).toContain('严禁直接表达为“供需不足”');
  });
});
