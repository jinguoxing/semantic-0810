/**
 * Data Support Revision：数据支撑修订记录（Inv02 / §8 / §11）
 *
 * BOTTOM_UP_ALIGN / TOP_DOWN_CONFIRM / MARK_REVALIDATION / REVALIDATION_KEEP /
 * REBIND / RETIRE / SET_PRIMARY 每一步都落一条修订。
 * 该生命周期与 BusinessObjectRevision 严格分离：
 * 数据支撑动作永不修改 BusinessObject.currentRevision。
 *
 * recordDataSupportRevisionInDraft 为纯写入函数：在调用方命令的同一事务（draft）内
 * 追加修订，自身绝不发起 mutate —— 一条命令一次事务（§11，消除嵌套 mutate）。
 */
import { getState } from './registry';
import { mutate, nextId, nowIso } from './store';
import { DataSupportAction, DataSupportRevision } from './types';

/**
 * 纯写入：向调用方事务的 draft 追加一条数据支撑修订。
 * 只写字典条目、不读全局状态、不持久化、不通知 —— 持久化由外层命令的唯一 mutate 负责。
 */
export function recordDataSupportRevisionInDraft(
  draft: { dataSupportRevisions: Record<string, DataSupportRevision> },
  input: Omit<DataSupportRevision, 'id' | 'createdAt'>
): DataSupportRevision {
  const entry: DataSupportRevision = {
    id: nextId('dsrev'),
    createdAt: nowIso(),
    ...input
  };
  draft.dataSupportRevisions[entry.id] = entry;
  return entry;
}

/** 独立落一条修订（自带事务；命令内请改用 recordDataSupportRevisionInDraft） */
export function recordDataSupportRevision(
  input: Omit<DataSupportRevision, 'id' | 'createdAt'>
): DataSupportRevision {
  const entry: DataSupportRevision = {
    id: nextId('dsrev'),
    createdAt: nowIso(),
    ...input
  };
  return mutate(getState(), (draft) => {
    draft.dataSupportRevisions[entry.id] = entry;
    return entry;
  });
}

export function listDataSupportRevisions(objectId: string): DataSupportRevision[] {
  return Object.values(getState().dataSupportRevisions)
    .filter((revision) => revision.businessObjectId === objectId)
    .map((revision, index) => ({ revision, index }))
    .sort(
      (a, b) =>
        Date.parse(b.revision.createdAt) - Date.parse(a.revision.createdAt) || b.index - a.index
    )
    .map((entry) => entry.revision);
}
