/**
 * Grounding：属性 / 关系落地修正（Inv03 / Inv08）
 *
 * Local Grounding Correction 的领域实现：
 * 修正写入数据实现的字段级映射，同时产生 ACTIVE 的 GroundingRevision，
 * 之前的同目标修正自动归档为 HISTORY。
 *
 * 约束：
 * - 修正类型由输入 type 显式声明，禁止通过 targetName 字符串推断；
 * - RELATIONSHIP 修正必须校验 targetObjectId，且 toField 只允许落入
 *   该目标对象的候选字段白名单（身份兼容校验），失败即报错、零写入；
 * - 关系落地字段直接整体赋值为「实现名 · toField」，禁止字符串替换；
 * - 只产生 GroundingRevision，永不产生业务对象修订 / 数据支撑修订。
 */
import { getState } from './registry';
import { mutate, nextId, nowIso } from './store';
import { GroundingCorrectionInput, GroundingRevision } from './types';

export type GroundingCorrectionResult =
  | { ok: true; revision: GroundingRevision }
  | { ok: false; error: 'BINDING_NOT_FOUND' | 'TARGET_NOT_FOUND' | 'FIELD_MISMATCH' | 'CANDIDATE_NOT_ALLOWED' };

function archivePreviousActive(bindingId: string, type: GroundingRevision['type'], targetName: string): void {
  Object.values(getState().groundingRevisions)
    .filter(
      (revision) =>
        revision.bindingId === bindingId && revision.type === type && revision.targetName === targetName && revision.status === 'ACTIVE'
    )
    .forEach((revision) => {
      revision.status = 'HISTORY';
    });
}

export const groundingService = {
  /** 应用一条修正（属性或关系），并同步数据实现落地映射 */
  applyCorrection(input: GroundingCorrectionInput): GroundingCorrectionResult {
    const binding = getState().bindings[input.bindingId];
    const implementation = binding ? getState().implementations[binding.implementationId] : undefined;
    if (!binding || !implementation) return { ok: false, error: 'BINDING_NOT_FOUND' };

    // ---- 前置校验（全部通过才进入事务，失败零写入） ----
    if (input.type === 'ATTRIBUTE') {
      const attribute = implementation.attributes.find((attributeGrounding) => attributeGrounding.attributeName === input.targetName);
      if (!attribute) return { ok: false, error: 'TARGET_NOT_FOUND' };
      if (attribute.field !== input.fromField) return { ok: false, error: 'FIELD_MISMATCH' };
    } else {
      if (!input.targetObjectId) return { ok: false, error: 'TARGET_NOT_FOUND' };
      const relationship = implementation.relationships.find(
        (relationshipGrounding) =>
          relationshipGrounding.relationName === input.targetName && relationshipGrounding.targetObjectId === input.targetObjectId
      );
      if (!relationship) return { ok: false, error: 'TARGET_NOT_FOUND' };
      if (relationship.sourceField !== `${implementation.name} · ${input.fromField}`) {
        return { ok: false, error: 'FIELD_MISMATCH' };
      }
      // 身份兼容校验：toField 必须属于该目标对象的候选字段白名单（Inv08）
      const allowedFields = (implementation.relationshipCandidateFields ?? []).filter(
        (candidate) => candidate.targetObjectId === input.targetObjectId
      );
      if (allowedFields.length === 0 || !allowedFields.some((candidate) => candidate.field === input.toField)) {
        return { ok: false, error: 'CANDIDATE_NOT_ALLOWED' };
      }
    }

    return mutate(getState(), (draft) => {
      archivePreviousActive(input.bindingId, input.type, input.targetName);

      let before: GroundingRevision['before'] = { field: input.fromField };
      let after: GroundingRevision['after'] = { field: input.toField };
      let targetName = input.targetName;

      if (input.type === 'ATTRIBUTE') {
        // 属性修正：同步实现中的字段映射并清除待修正标记
        const attribute = draft.implementations[implementation.id].attributes.find(
          (attributeGrounding) => attributeGrounding.attributeName === input.targetName
        );
        if (attribute) {
          before = { field: attribute.field, semantics: attribute.semantics };
          attribute.field = input.toField;
          attribute.needsCorrection = false;
          attribute.correctionReason = undefined;
          after = { field: attribute.field, semantics: attribute.semantics };
        }
      } else {
        // 关系修正：落地字段直接整体赋值为「实现名 · toField」
        const relationship = draft.implementations[implementation.id].relationships.find(
          (relationshipGrounding) =>
            relationshipGrounding.relationName === input.targetName && relationshipGrounding.targetObjectId === input.targetObjectId
        );
        if (relationship) {
          before = { field: relationship.sourceField };
          relationship.sourceField = `${implementation.name} · ${input.toField}`;
          after = { field: relationship.sourceField };
          targetName = `${relationship.relationName} → ${relationship.targetObjectName}`;
        }
      }

      const revision: GroundingRevision = {
        id: nextId('gr'),
        businessObjectId: binding.businessObjectId,
        bindingId: input.bindingId,
        type: input.type,
        targetName,
        before,
        after,
        reason: input.reason,
        evidence: input.evidence,
        status: 'ACTIVE',
        createdAt: nowIso()
      };
      draft.groundingRevisions[revision.id] = revision;
      return { ok: true as const, revision };
    });
  },

  listRevisions(bindingId?: string): GroundingRevision[] {
    return Object.values(getState().groundingRevisions)
      .filter((revision) => (bindingId ? revision.bindingId === bindingId : true))
      .map((revision, index) => ({ revision, index }))
      .sort(
        (a, b) =>
          Date.parse(b.revision.createdAt) - Date.parse(a.revision.createdAt) || b.index - a.index
      )
      .map((entry) => entry.revision);
  },

  /** 某个绑定的全部修正（含 HISTORY），供 History Drawer 呈现 */
  listByObject(objectId: string): GroundingRevision[] {
    return Object.values(getState().groundingRevisions)
      .filter((revision) => revision.businessObjectId === objectId)
      .map((revision, index) => ({ revision, index }))
      .sort(
        (a, b) =>
          Date.parse(b.revision.createdAt) - Date.parse(a.revision.createdAt) || b.index - a.index
      )
      .map((entry) => entry.revision);
  },

  /** 当前生效的修正 */
  activeRevision(bindingId: string, targetName: string): GroundingRevision | undefined {
    return this.listRevisions(bindingId).find(
      (revision) => revision.targetName === targetName && revision.status === 'ACTIVE'
    );
  }
};
