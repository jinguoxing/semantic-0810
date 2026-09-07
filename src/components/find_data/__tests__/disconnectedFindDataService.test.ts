import { describe, expect, it } from 'vitest';
import { findDataReducer } from '../model/findDataReducer';
import { DisconnectedFindDataService } from '../services/DisconnectedFindDataService';
import { createEmptyTask } from './testUtils/findDataFactories';

describe('DisconnectedFindDataService', () => {
  it('fails a direct metric request explicitly and never returns a demonstration result', async () => {
    const task = createEmptyTask({
      directMetricQuery: {
        requestId: 'metric_request_1',
        metricId: 'met_elderly_population',
        source: { kind: 'USER_EXPLICIT' },
        status: 'READY',
        preparedAt: '2026-09-07T00:00:00.000Z'
      }
    });
    const result = await new DisconnectedFindDataService().executeAction(task, {
      actionCode: 'RUN_METRIC_QUERY',
      payload: { requestId: 'metric_request_1' }
    });

    expect(result.events.some((event) => event.type === 'DIRECT_METRIC_RESULT_RECEIVED')).toBe(false);
    expect(result.events).toContainEqual(expect.objectContaining({
      type: 'DIRECT_METRIC_QUERY_FAILED',
      payload: expect.objectContaining({ requestId: 'metric_request_1' })
    }));
    expect(result.events.reduce(findDataReducer, task).directMetricResult).toBeUndefined();
  });
});
