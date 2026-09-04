import { describe, expect, it } from 'vitest';
import { evaluateSurfacePolicy, resolveInteractionIntent } from '../policy/surfacePolicy';
import { createEmptyTask, createMinhangTask, createResource } from './testUtils/findDataFactories';

describe('surface policy and structured natural-language intent', () => {
  it.each(['这个表有哪些字段？', '它有多少字段', '为什么推荐它', '当前还缺什么', '这两个资源有什么不同'])(
    'keeps ordinary question in conversation: %s',
    (text) => {
      const intent = resolveInteractionIntent(text, createEmptyTask());
      expect(intent.kind).toBe('QUESTION');
      expect(evaluateSurfacePolicy(intent, undefined, { type: 'COMPARE' }, createEmptyTask())).toEqual({ action: 'NO_CHANGE' });
    }
  );

  it('recognizes explicit comparison without routing ordinary comparison questions', () => {
    expect(resolveInteractionIntent('比较这两张表', createEmptyTask())).toMatchObject({ kind: 'OPEN_SURFACE', surface: 'COMPARE', explicit: true });
    expect(resolveInteractionIntent('看看这两个候选有什么区别', createEmptyTask())).toMatchObject({ kind: 'OPEN_SURFACE', surface: 'COMPARE' });
    expect(resolveInteractionIntent('看看这两个资源有什么区别', createEmptyTask()).kind).toBe('QUESTION');
    expect(resolveInteractionIntent('这两个资源有什么不同', createEmptyTask()).kind).toBe('QUESTION');
  });

  it('recognizes related-resource browse and analysis intents', () => {
    expect(resolveInteractionIntent('我先看看民政相关资源', createEmptyTask())).toMatchObject({ kind: 'RESOURCE_BROWSE', surface: 'RELATED_RESOURCES' });
    expect(resolveInteractionIntent('计算各街镇每千名老人养老床位数', createEmptyTask())).toMatchObject({ kind: 'ANALYZE' });
  });

  it('opens fields only for an explicit fields command with resource context', () => {
    const resource = createResource({ id: 'selected' });
    const task = createEmptyTask({ resources: { selected: resource }, activeResourceId: 'selected' });
    const intent = resolveInteractionIntent('打开完整字段列表', task);
    expect(evaluateSurfacePolicy(intent, undefined, task.activeSurface, task)).toMatchObject({ action: 'OPEN', surface: 'FIELDS', resourceIds: ['selected'] });
  });

  it('OPEN_FIELDS is blocked without an explicit or active resource', () => {
    const command = evaluateSurfacePolicy(resolveInteractionIntent('', createEmptyTask()), 'OPEN_FIELDS', { type: 'CLOSED' }, createEmptyTask());
    expect(command.action).toBe('NO_CHANGE');
    expect(command.blockedReason).toContain('没有选定资源');
  });

  it('OPEN_COMPARE requires a dedicated comparison model or explicit action payload', () => {
    const task = createMinhangTask();
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', task), 'OPEN_COMPARE', task.activeSurface, task)).toMatchObject({
      action: 'NO_CHANGE'
    });
  });

  it('OPEN_ASK_PLAN is blocked when no plan exists', () => {
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', createMinhangTask()), 'OPEN_ASK_PLAN', { type: 'CLOSED' }, createMinhangTask())).toMatchObject({ action: 'NO_CHANGE', blockedReason: expect.any(String) });
  });

  it('related resources and close remain policy commands', () => {
    const task = createEmptyTask();
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', task), 'OPEN_RELATED_RESOURCES', { type: 'CLOSED' }, task)).toMatchObject({ action: 'OPEN', surface: 'RELATED_RESOURCES' });
    expect(evaluateSurfacePolicy(resolveInteractionIntent('', task), 'CLOSE_SURFACE', { type: 'FIELDS' }, task)).toEqual({ action: 'CLOSE', surface: 'CLOSED' });
  });
});
