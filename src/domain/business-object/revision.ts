/**
 * Revision：业务对象定义修订记录（Inv01）
 *
 * 只有以下动作会产生 BusinessObjectRevision：
 * - 首次发布（Create publish）
 * - 发布定义变更（Change publish）
 * - 发布名称 / 别名 / 定义 / 身份 / 属性 / 关系变更
 *
 * 永不产生修订的动作：新增实现、确认数据支撑、重新绑定、退休、
 * 复核、属性 / 关系 Grounding 修正 —— 它们分别归属
 * DataSupportRevision 与 GroundingRevision 生命周期。
 */
import { getState } from './registry';
import { mutate, nowIso, nextId } from './store';
import { BusinessObject, BusinessObjectDefinitionSnapshot, BusinessObjectRevision } from './types';

/** 从正式对象提取定义快照（发布留档用） */
export function snapshotOfObject(object: BusinessObject): BusinessObjectDefinitionSnapshot {
  return {
    name: object.name,
    aliases: [...object.aliases],
    definition: object.definition,
    domain: object.domain,
    identity: { ...object.identity },
    attributes: object.attributes.map((attribute) => ({ ...attribute })),
    relationships: object.relationships.map((relationship) => ({ ...relationship })),
    evidence: object.evidence.map((item) => ({ ...item }))
  };
}

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
 * 注意：必须在 mutate() 事务内调用（registry / draft 已保证）。
 */
export function recordRevision(
  objectId: string,
  input: {
    summary: string;
    changes: string[];
    changedBy?: string;
    /** 本次修订对应的正式定义快照；缺省时从当前正式对象提取 */
    snapshot?: BusinessObjectDefinitionSnapshot;
  }
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
    status: 'ACTIVE',
    snapshot: input.snapshot ?? snapshotOfObject(getState().objects[objectId])
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

/** 提交业务对象修订的事务包装（仅限业务定义发布路径使用） */
export function publishRevision(
  objectId: string,
  input: { summary: string; changes: string[]; changedBy?: string; snapshot?: BusinessObjectDefinitionSnapshot }
): BusinessObjectRevision {
  return mutate(getState(), () => recordRevision(objectId, input));
}
