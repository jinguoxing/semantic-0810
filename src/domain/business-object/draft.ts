/**
 * Draft：业务对象定义草稿（Create / Change）
 *
 * 草稿只存待发布内容，发布前绝不触碰正式对象；
 * 发布时才产生 BusinessObject + BusinessObjectRevision（R1 / Rn）。
 * CHANGE 发布带乐观并发控制：expectedBaseRevision 不匹配 → STALE_REVISION，
 * 全程零写入（Inv01 / Inv04：currentRevision 只随正式发布前进）。
 */
import { getState } from './registry';
import { mutate, nextId, nowIso } from './store';
import { recordRevision } from './revision';
import { BusinessObject, BusinessObjectDefinitionSnapshot, BusinessObjectDraft } from './types';

export type PublishDraftResult =
  | { ok: true; object: BusinessObject; revision: string; isNewObject: boolean }
  | { ok: false; error: 'NOT_FOUND' | 'ALREADY_PUBLISHED' | 'OBJECT_NOT_FOUND' | 'STALE_REVISION' };

/** 将草稿快照应用到正式对象（名称 / 别名 / 定义 / 域 / 身份 / 属性 / 关系 / 证据） */
function applySnapshot(object: BusinessObject, content: BusinessObjectDefinitionSnapshot): void {
  object.name = content.name;
  object.aliases = [...content.aliases];
  object.definition = content.definition;
  object.domain = content.domain;
  object.identity = { ...content.identity };
  object.attributes = content.attributes.map((attribute) => ({ ...attribute }));
  object.relationships = content.relationships.map((relationship) => ({ ...relationship }));
  object.evidence = content.evidence.map((item) => ({ ...item }));
}

export function saveCreateDraft(content: BusinessObjectDefinitionSnapshot): BusinessObjectDraft {
  const now = nowIso();
  const draft: BusinessObjectDraft = {
    id: nextId('bodraft'),
    mode: 'CREATE',
    content: { ...content, aliases: [...content.aliases] },
    status: 'WORKING',
    createdAt: now,
    updatedAt: now
  };
  return mutate(getState(), (state) => {
    state.drafts[draft.id] = draft;
    return draft;
  });
}

export function saveChangeDraft(
  objectId: string,
  baseRevision: string,
  content: BusinessObjectDefinitionSnapshot
): BusinessObjectDraft | undefined {
  const object = getState().objects[objectId];
  if (!object) return undefined;
  const now = nowIso();
  const draft: BusinessObjectDraft = {
    id: nextId('bodraft'),
    mode: 'CHANGE',
    objectId,
    baseRevision,
    content: { ...content, aliases: [...content.aliases] },
    status: 'WORKING',
    createdAt: now,
    updatedAt: now
  };
  return mutate(getState(), (state) => {
    state.drafts[draft.id] = draft;
    return draft;
  });
}

export function getDraft(draftId: string): BusinessObjectDraft | undefined {
  return getState().drafts[draftId];
}

export function discardDraft(draftId: string): void {
  mutate(getState(), (state) => {
    const draft = state.drafts[draftId];
    if (draft && draft.status === 'WORKING') {
      draft.status = 'DISCARDED';
      draft.updatedAt = nowIso();
    }
  });
}

export function publishDraft(
  draftId: string,
  options?: { expectedBaseRevision?: string; changedBy?: string; summary?: string; changes?: string[] }
): PublishDraftResult {
  const draft = getState().drafts[draftId];
  if (!draft) return { ok: false, error: 'NOT_FOUND' };
  if (draft.status !== 'WORKING') return { ok: false, error: 'ALREADY_PUBLISHED' };

  if (draft.mode === 'CHANGE') {
    const objectId = draft.objectId!;
    const object = getState().objects[objectId];
    if (!object) return { ok: false, error: 'OBJECT_NOT_FOUND' };
    const expected = options?.expectedBaseRevision ?? draft.baseRevision;
    if (expected && object.currentRevision !== expected) {
      return { ok: false, error: 'STALE_REVISION' };
    }
    return mutate(getState(), (state) => {
      const target = state.objects[objectId];
      applySnapshot(target, draft.content);
      target.updatedAt = nowIso();
      const revision = recordRevision(objectId, {
        summary: options?.summary ?? `发布「${target.name}」定义变更`,
        changes: options?.changes ?? ['更新了业务对象正式定义'],
        changedBy: options?.changedBy ?? '业务对象工作台',
        snapshot: draft.content
      });
      target.currentRevision = revision.revision;
      state.drafts[draftId].status = 'PUBLISHED';
      state.drafts[draftId].updatedAt = nowIso();
      return { ok: true as const, object: target, revision: revision.revision, isNewObject: false };
    });
  }

  // CREATE：发布即创建新正式对象 + R1 首次发布修订
  return mutate(getState(), (state) => {
    const objectId = nextId('bo');
    const object: BusinessObject = {
      id: objectId,
      ...draft.content,
      aliases: [...draft.content.aliases],
      identity: { ...draft.content.identity },
      status: 'PUBLISHED',
      currentRevision: 'R1',
      terms: [],
      metrics: [],
      relatedData: [],
      updatedAt: nowIso()
    };
    state.objects[objectId] = object;
    const revision = recordRevision(objectId, {
      summary: options?.summary ?? `首次发布「${object.name}」`,
      changes: options?.changes ?? ['正式发布至企业业务语义目录'],
      changedBy: options?.changedBy ?? '业务对象工作台',
      snapshot: draft.content
    });
    object.currentRevision = revision.revision;
    state.drafts[draftId].status = 'PUBLISHED';
    state.drafts[draftId].updatedAt = nowIso();
    return { ok: true as const, object, revision: revision.revision, isNewObject: true };
  });
}
