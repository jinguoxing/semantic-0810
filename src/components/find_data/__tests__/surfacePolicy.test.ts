import { describe, expect, it } from 'vitest';
import { determineInteractionIntent, evaluateSurfacePolicy } from '../policy/surfacePolicy';
import { createEmptyTask, createMinhangTask, createResource } from './testUtils/findDataFactories';

describe('surface policy as the single control plane', () => {
  it.each([
    '这个表有哪些字段？', '为什么推荐它？', '当前缺什么？', '它能覆盖过去 12 个月吗？'
  ])('ordinary question preserves the current surface: %s', (text) => {
    expect(determineInteractionIntent(text)).toBe('QUESTION');
    expect(evaluateSurfacePolicy('QUESTION', undefined, { type: 'COMPARE' }, createEmptyTask(), text)).toEqual({ action: 'NO_CHANGE' });
  });

  it('OPEN_FIELDS is blocked without an explicit or active resource', () => {
    const command = evaluateSurfacePolicy('TASK_ACTION', 'OPEN_FIELDS', { type: 'CLOSED' }, createEmptyTask());
    expect(command.action).toBe('NO_CHANGE');
    expect(command.blockedReason).toContain('没有选定资源');
  });

  it('OPEN_FIELDS uses an explicit task resource and no default fallback', () => {
    const resource = createResource({ id: 'selected' });
    const task = createEmptyTask({ resources: { selected: resource } });
    expect(evaluateSurfacePolicy('TASK_ACTION', 'OPEN_FIELDS', task.activeSurface, task, undefined, { resourceId: 'selected' })).toMatchObject({
      action: 'OPEN', surface: 'FIELDS', resourceIds: ['selected']
    });
  });

  it('OPEN_COMPARE is blocked when fewer than two explicit comparison resources exist', () => {
    const task = createMinhangTask();
    expect(evaluateSurfacePolicy('TASK_ACTION', 'OPEN_COMPARE', task.activeSurface, task)).toMatchObject({ action: 'NO_CHANGE' });
  });

  it('OPEN_COMPARE uses the comparison model when it has two discoverable resources', () => {
    const task = createMinhangTask({ comparisonModel: { resourceIds: ['r01', 'r04'], rows: [] } });
    expect(evaluateSurfacePolicy('TASK_ACTION', 'OPEN_COMPARE', task.activeSurface, task)).toMatchObject({
      action: 'OPEN', surface: 'COMPARE', resourceIds: ['r01', 'r04']
    });
  });

  it('OPEN_ASK_PLAN is blocked when no plan exists', () => {
    expect(evaluateSurfacePolicy('TASK_ACTION', 'OPEN_ASK_PLAN', { type: 'CLOSED' }, createMinhangTask())).toMatchObject({
      action: 'NO_CHANGE', blockedReason: expect.any(String)
    });
  });

  it('OPEN_SOLUTION is blocked until a solution or gap exists', () => {
    expect(evaluateSurfacePolicy('TASK_ACTION', 'OPEN_SOLUTION', { type: 'CLOSED' }, createEmptyTask())).toMatchObject({
      action: 'NO_CHANGE', blockedReason: expect.any(String)
    });
  });

  it('related resources uses its truthful internal surface name', () => {
    expect(evaluateSurfacePolicy('TASK_ACTION', 'OPEN_RELATED_RESOURCES', { type: 'CLOSED' }, createEmptyTask())).toMatchObject({
      action: 'OPEN', surface: 'RELATED_RESOURCES'
    });
  });

  it('close is represented as a command rather than a reducer event from the service', () => {
    expect(evaluateSurfacePolicy('TASK_ACTION', 'CLOSE_SURFACE', { type: 'FIELDS' }, createEmptyTask())).toEqual({ action: 'CLOSE', surface: 'CLOSED' });
  });
});
