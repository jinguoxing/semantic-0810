/**
 * Task Context：Resolution 入口上下文
 *
 * Bottom-up（数据资产 / 数据语义 / 任务）进入 BusinessObjectResolutionWorkspace 时
 * 登记来源上下文，对齐完成后按 returnRoute + sourceId + taskId 返回原上下文，
 * 禁止退回业务对象列表。
 */
import { getState } from './registry';
import { mutate } from './store';
import { ObjectResolutionContext } from './types';

export const objectResolutionContexts = {
  open(context: Omit<ObjectResolutionContext, 'createdAt'>): ObjectResolutionContext {
    const entry: ObjectResolutionContext = { ...context, createdAt: new Date().toISOString() };
    return mutate(getState(), (draft) => {
      draft.taskContexts[entry.taskId] = entry;
      return entry;
    });
  },

  get(taskId: string): ObjectResolutionContext | undefined {
    return getState().taskContexts[taskId];
  },

  /** 消费后清除，避免陈旧上下文被再次返回 */
  clear(taskId: string): void {
    mutate(getState(), (draft) => {
      delete draft.taskContexts[taskId];
    });
  }
};
