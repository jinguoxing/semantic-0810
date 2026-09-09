/**
 * Grounding：属性 / 关系落地修正
 *
 * Local Grounding Correction 的领域实现：
 * 修正写入数据实现的字段级映射，同时产生 ACTIVE 的 GroundingRevision，
 * 之前的同目标修正自动归档为 HISTORY。
 */
import { getState } from './registry';
import { commitRevision } from './revision';
import { mutate, nextId, nowIso } from './store';
import { GroundingRevision } from './types';

export interface GroundingCorrectionInput {
  bindingId: string;
  /** 属性名（ATTRIBUTE）或关系名（RELATIONSHIP） */
  targetName: string;
  fromField: string;
  toField: string;
  reason: string;
  evidence: string[];
  changedBy?: string;
}

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
  applyCorrection(input: GroundingCorrectionInput): GroundingRevision | undefined {
    const binding = getState().bindings[input.bindingId];
    const implementation = binding ? getState().implementations[binding.implementationId] : undefined;
    if (!binding || !implementation) return undefined;

    return mutate(getState(), (draft) => {
      archivePreviousActive(input.bindingId, input.targetName.includes('→') ? 'RELATIONSHIP' : 'ATTRIBUTE', input.targetName);

      let before: GroundingRevision['before'] = { field: input.fromField };
      let after: GroundingRevision['after'] = { field: input.toField };

      if (!input.targetName.includes('→')) {
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
        // 关系修正：同步实现中的关系落地字段
        const relationPart = input.targetName.split('→')[0].trim();
        const relationship = draft.implementations[implementation.id].relationships.find(
          (relationshipGrounding) => relationshipGrounding.relationName === relationPart
        );
        if (relationship) {
          before = { field: relationship.sourceField };
          relationship.sourceField = relationship.sourceField.replace(input.fromField, input.toField);
          after = { field: relationship.sourceField };
        }
      }

      const revision: GroundingRevision = {
        id: nextId('gr'),
        businessObjectId: binding.businessObjectId,
        bindingId: input.bindingId,
        type: input.targetName.includes('→') ? 'RELATIONSHIP' : 'ATTRIBUTE',
        targetName: input.targetName,
        before,
        after,
        reason: input.reason,
        evidence: input.evidence,
        status: 'ACTIVE',
        createdAt: nowIso()
      };
      draft.groundingRevisions[revision.id] = revision;

      commitRevision(binding.businessObjectId, {
        summary: `落地修正：${input.targetName} ${input.fromField} → ${input.toField}`,
        changes: [`「${input.targetName}」字段映射由 ${input.fromField} 修正为 ${input.toField}（${revision.type === 'ATTRIBUTE' ? '属性' : '关系'}落地）`],
        changedBy: input.changedBy ?? '本地落地修正'
      });

      return revision;
    });
  },

  listRevisions(bindingId?: string): GroundingRevision[] {
    return Object.values(getState().groundingRevisions)
      .filter((revision) => (bindingId ? revision.bindingId === bindingId : true))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  /** 某个绑定的全部修正（含 HISTORY），供 History Drawer 呈现 */
  listByObject(objectId: string): GroundingRevision[] {
    return Object.values(getState().groundingRevisions)
      .filter((revision) => revision.businessObjectId === objectId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  /** 当前生效的修正 */
  activeRevision(bindingId: string, targetName: string): GroundingRevision | undefined {
    return this.listRevisions(bindingId).find(
      (revision) => revision.targetName === targetName && revision.status === 'ACTIVE'
    );
  }
};
