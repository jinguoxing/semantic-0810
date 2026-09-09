/**
 * Task Context：Resolution 入口上下文
 *
 * Bottom-up（数据资产 / 数据语义 / 任务）进入 BusinessObjectResolutionWorkspace 时
 * 登记来源上下文，对齐完成后按 returnRoute + sourceId + taskId 返回原上下文，
 * 禁止退回业务对象列表。
 *
 * 上下文带状态机（OPEN → POSTPONED / COMPLETED / CANCELLED）：
 * 「稍后处理」POSTPONED 保留上下文不清除；「确认完成」COMPLETED 保留历史但不再活跃；
 * 「本轮不建立」CANCELLED。只有显式 cancel/complete 才终结任务。
 */
import { getState } from './registry';
import { mutate, nowIso } from './store';
import { ObjectResolutionContext, ObjectResolutionStatus } from './types';

function transition(taskId: string, status: ObjectResolutionStatus): ObjectResolutionContext | undefined {
  const context = getState().taskContexts[taskId];
  if (!context) return undefined;
  return mutate(getState(), (draft) => {
    const target = draft.taskContexts[taskId];
    target.status = status;
    target.updatedAt = nowIso();
    return target;
  });
}

export const objectResolutionContexts = {
  open(context: Omit<ObjectResolutionContext, 'createdAt' | 'status' | 'updatedAt'>): ObjectResolutionContext {
    const now = nowIso();
    const entry: ObjectResolutionContext = { ...context, createdAt: now, status: 'OPEN', updatedAt: now };
    return mutate(getState(), (draft) => {
      draft.taskContexts[entry.taskId] = entry;
      return entry;
    });
  },

  get(taskId: string): ObjectResolutionContext | undefined {
    return getState().taskContexts[taskId];
  },

  /** 当前活跃（未终结）的上下文 */
  getActive(taskId: string): ObjectResolutionContext | undefined {
    const context = getState().taskContexts[taskId];
    return context && context.status !== 'COMPLETED' && context.status !== 'CANCELLED' ? context : undefined;
  },

  /** 稍后处理：保留上下文，状态置为 POSTPONED，返回原上下文入口 */
  postpone(taskId: string): ObjectResolutionContext | undefined {
    return transition(taskId, 'POSTPONED');
  },

  /** 确认完成：保留历史（不再活跃），状态置为 COMPLETED */
  complete(taskId: string): ObjectResolutionContext | undefined {
    return transition(taskId, 'COMPLETED');
  },

  /** 本轮不建立：状态置为 CANCELLED，上下文保留为历史 */
  cancel(taskId: string): ObjectResolutionContext | undefined {
    return transition(taskId, 'CANCELLED');
  }
};
