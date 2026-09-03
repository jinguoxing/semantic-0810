import { describe, it, expect } from 'vitest';
import {
  determineInteractionIntent,
  evaluateSurfacePolicy
} from '../policy/surfacePolicy';
import { initialFindDataTaskState } from '../model/findDataReducer';

describe('surfacePolicy (AC-03, AC-04, AC-08)', () => {
  it('AC-03: ordinary questions return NO_CHANGE and do NOT open or replace surfaces', () => {
    const questions = [
      '这个表有哪些字段？',
      '这个资源适合当前分析吗？',
      '为什么推荐它？',
      '当前缺什么？',
      '它能覆盖过去 12 个月吗？'
    ];

    for (const q of questions) {
      const intent = determineInteractionIntent(q);
      expect(intent).toBe('QUESTION');

      const cmd = evaluateSurfacePolicy(intent, undefined, { type: 'CLOSED' }, initialFindDataTaskState, q);
      expect(cmd.action).toBe('NO_CHANGE');
      expect(cmd.surface).toBeUndefined();
    }
  });

  it('AC-03: even when surface is already open (e.g. COMPARE), asking a question preserves active surface without switching', () => {
    const q = '这个表有哪些字段？';
    const intent = determineInteractionIntent(q);
    const cmd = evaluateSurfacePolicy(
      intent,
      undefined,
      { type: 'COMPARE', resourceIds: ['r02', 'r03'] },
      initialFindDataTaskState,
      q
    );
    expect(cmd.action).toBe('NO_CHANGE');
  });

  it('AC-04: explicit commands return OPEN or REPLACE with target surface FIELDS', () => {
    const explicitPrompts = [
      '打开完整字段列表',
      '查看全部字段',
      '打开这个表的完整字段列表'
    ];

    for (const p of explicitPrompts) {
      const intent = determineInteractionIntent(p);
      expect(intent).toBe('OPEN_SURFACE');

      const cmd = evaluateSurfacePolicy(intent, undefined, { type: 'CLOSED' }, initialFindDataTaskState, p);
      expect(cmd.action).toBe('OPEN');
      expect(cmd.surface).toBe('FIELDS');
    }
  });

  it('AC-08: KEEP_AS_GAP action code returns NO_CHANGE (does NOT open SOLUTION surface)', () => {
    const cmd = evaluateSurfacePolicy('TASK_ACTION', 'KEEP_AS_GAP', { type: 'CLOSED' });
    expect(cmd.action).toBe('NO_CHANGE');
    expect(cmd.surface).toBeUndefined();
  });

  it('handles action code OPEN_COMPARE and OPEN_SOLUTION', () => {
    const cmdCompare = evaluateSurfacePolicy('TASK_ACTION', 'OPEN_COMPARE', { type: 'CLOSED' });
    expect(cmdCompare.action).toBe('OPEN');
    expect(cmdCompare.surface).toBe('COMPARE');

    const cmdSolution = evaluateSurfacePolicy('TASK_ACTION', 'OPEN_SOLUTION', { type: 'CLOSED' });
    expect(cmdSolution.action).toBe('OPEN');
    expect(cmdSolution.surface).toBe('SOLUTION');
  });
});
