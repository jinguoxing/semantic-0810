/**
 * Revision：业务对象修订记录
 *
 * 发布 / 变更 / 绑定确认都会产生正式修订，History Drawer 从这里读取，
 * 禁止页面写死历史。
 */
import { getState } from './registry';
import { mutate, nextId, nowIso } from './store';
import { BusinessObjectRevision } from './types';

/** 计算对象的下一个修订号，如 R1 → R2 */
export function nextRevisionLabel(objectId: string): string {
  const revisions = Object.values(getState().revisions).filter((revision) => revision.businessObjectId === objectId);
  const maxNumber = revisions.reduce((max, revision) => {
    const match = /^R(\d+)$/.exec(revision.revision);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `R${maxNumber + 1}`;
}

/**
 * 记录一条修订并将之前的 ACTIVE 修订归档为 HISTORY。
 * 注意：必须在 mutate() 事务内调用（registry / data-support 已保证）。
 */
export function recordRevision(
  objectId: string,
  input: { summary: string; changes: string[]; changedBy?: string }
): BusinessObjectRevision {
  const revisionLabel = nextRevisionLabel(objectId);
  const entry: BusinessObjectRevision = {
    id: nextId('rev'),
    businessObjectId: objectId,
    revision: revisionLabel,
    summary: input.summary,
    changes: input.changes,
    changedBy: input.changedBy ?? '业务对象工作台',
    createdAt: nowIso(),
    status: 'ACTIVE'
  };
  const draft = getState();
  Object.values(draft.revisions)
    .filter((revision) => revision.businessObjectId === objectId && revision.status === 'ACTIVE')
    .forEach((revision) => {
      revision.status = 'HISTORY';
    });
  draft.revisions[entry.id] = entry;
  return entry;
}

function revisionNumber(revision: BusinessObjectRevision): number {
  const match = /^R(\d+)$/.exec(revision.revision);
  return match ? Number(match[1]) : 0;
}

export function listRevisions(objectId: string): BusinessObjectRevision[] {
  return Object.values(getState().revisions)
    .filter((revision) => revision.businessObjectId === objectId)
    .sort((a, b) => revisionNumber(b) - revisionNumber(a) || Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** 提交修订的事务包装（供领域模块外部直接使用） */
export function commitRevision(
  objectId: string,
  input: { summary: string; changes: string[]; changedBy?: string }
): BusinessObjectRevision {
  return mutate(getState(), () => recordRevision(objectId, input));
}
