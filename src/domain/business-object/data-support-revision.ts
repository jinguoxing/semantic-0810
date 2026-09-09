/**
 * Data Support Revision：数据支撑修订记录（Inv02）
 *
 * BOTTOM_UP_ALIGN / TOP_DOWN_CONFIRM / MARK_REVALIDATION / REVALIDATION_KEEP /
 * REBIND / RETIRE / SET_PRIMARY 每一步都落一条修订。
 * 该生命周期与 BusinessObjectRevision 严格分离：
 * 数据支撑动作永不修改 BusinessObject.currentRevision。
 */
import { getState } from './registry';
import { mutate, nextId, nowIso } from './store';
import { DataSupportAction, DataSupportRevision } from './types';

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
