/**
 * Data Support：数据支撑绑定领域服务
 *
 * Top-down 闭环：候选实现确认 → EFFECTIVE（PRIMARY / SECONDARY）→ 状态持久化；
 * 语义变化触发 NEEDS_REVALIDATION → 复核确认 / 重新绑定 / 退休。
 */
import { getState } from './registry';
import { commitRevision } from './revision';
import { mutate, nextId, nowIso } from './store';
import { DataImplementation, DataSupportBinding } from './types';
import { decisionEvidence } from './evidence';

function bumpBindingRevision(draft: DataSupportBinding, prefix: string): void {
  const match = /^R(\d+)$/.exec(draft.revision);
  const nextNumber = match ? Number(match[1]) + 1 : 2;
  draft.revision = `R${nextNumber}`;
  void prefix;
}

export const dataSupportService = {
  listBindings(objectId: string): DataSupportBinding[] {
    return Object.values(getState().bindings).filter((binding) => binding.businessObjectId === objectId);
  },

  getBinding(bindingId: string): DataSupportBinding | undefined {
    return getState().bindings[bindingId];
  },

  listImplementations(objectId: string): DataImplementation[] {
    return Object.values(getState().implementations).filter(
      (implementation) => implementation.businessObjectId === objectId
    );
  },

  getImplementation(implementationId: string): DataImplementation | undefined {
    return getState().implementations[implementationId];
  },

  /**
   * Top-down 确认：将 CANDIDATE 绑定确认为 EFFECTIVE。
   * 全部生效绑定形成 PRIMARY + SECONDARY 的正式角色结构，
   * 绑定修订号 +1，并记录业务对象修订（刷新后状态保持）。
   */
  confirmCandidate(
    objectId: string,
    options?: { changedBy?: string }
  ): { bindings: DataSupportBinding[]; revisionLabel: string } | undefined {
    const object = getState().objects[objectId];
    if (!object) return undefined;
    const candidates = this.listBindings(objectId).filter((binding) => binding.status === 'CANDIDATE');
    if (candidates.length === 0) return undefined;

    return mutate(getState(), () => {
      candidates.forEach((candidate) => {
        const binding = getState().bindings[candidate.id];
        binding.status = 'EFFECTIVE';
        binding.confirmedAt = nowIso();
        binding.evidence = [
          ...binding.evidence,
          decisionEvidence(`确认数据支撑：${getState().implementations[binding.implementationId]?.name ?? binding.implementationId}`, '确认候选数据实现正式生效，作为业务对象的数据支撑。')
        ];
      });
      const effective = Object.values(getState().bindings).filter(
        (binding) => binding.businessObjectId === objectId && binding.status === 'EFFECTIVE'
      );
      effective.forEach((binding) => bumpBindingRevision(binding, objectId));
      const revision = commitRevision(objectId, {
        summary: `确认数据支撑（${candidates.map((candidate) => getState().implementations[candidate.implementationId]?.name ?? candidate.implementationId).join('、')}）`,
        changes: [
          ...candidates.map(
            (candidate) => `${getState().implementations[candidate.implementationId]?.name ?? candidate.implementationId} 由候选转为正式生效`
          ),
          `生效实现形成 ${effective.filter((binding) => binding.role === 'PRIMARY').length} 主 + ${effective.filter((binding) => binding.role === 'SECONDARY').length} 辅角色结构`
        ],
        changedBy: options?.changedBy ?? '发现数据支撑工作台'
      });
      return { bindings: effective, revisionLabel: revision.revision };
    });
  },

  /** 语义修订变化触发复核：绑定进入 NEEDS_REVALIDATION */
  markNeedsRevalidation(
    bindingId: string,
    input: { reason: string; sourceRevision: string; affectedTargets: string[] }
  ): DataSupportBinding | undefined {
    const binding = getState().bindings[bindingId];
    if (!binding) return undefined;
    return mutate(getState(), (draft) => {
      const target = draft.bindings[bindingId];
      target.status = 'NEEDS_REVALIDATION';
      target.revalidation = {
        reason: input.reason,
        sourceRevision: input.sourceRevision,
        affectedTargets: input.affectedTargets,
        raisedAt: nowIso()
      };
      return target;
    });
  },

  /** 复核确认继续使用：回到 EFFECTIVE */
  confirmRevalidation(bindingId: string, options?: { changedBy?: string }): DataSupportBinding | undefined {
    const binding = getState().bindings[bindingId];
    if (!binding || binding.status !== 'NEEDS_REVALIDATION') return undefined;
    return mutate(getState(), (draft) => {
      const target = draft.bindings[bindingId];
      target.status = 'EFFECTIVE';
      target.confirmedAt = nowIso();
      target.revalidation = undefined;
      bumpBindingRevision(target, bindingId);
      commitRevision(target.businessObjectId, {
        summary: '数据支撑复核确认',
        changes: [`「${draft.implementations[target.implementationId]?.name ?? target.implementationId}」复核确认继续使用`],
        changedBy: options?.changedBy ?? '数据支撑复核工作台'
      });
      return draft.bindings[bindingId];
    });
  },

  /** 重新绑定：换绑到另一个数据实现 */
  rebind(bindingId: string, newImplementationId: string, options?: { reason?: string }): DataSupportBinding | undefined {
    const binding = getState().bindings[bindingId];
    const implementation = getState().implementations[newImplementationId];
    if (!binding || !implementation) return undefined;
    return mutate(getState(), (draft) => {
      const target = draft.bindings[bindingId];
      const previousName = draft.implementations[target.implementationId]?.name ?? target.implementationId;
      target.implementationId = newImplementationId;
      target.status = 'EFFECTIVE';
      target.scope = implementation.scope;
      target.confirmedAt = nowIso();
      target.revalidation = undefined;
      bumpBindingRevision(target, bindingId);
      commitRevision(target.businessObjectId, {
        summary: '数据支撑重新绑定',
        changes: [`「${previousName}」重绑为「${implementation.name}」${options?.reason ? `（${options.reason}）` : ''}`],
        changedBy: '数据支撑复核工作台'
      });
      return draft.bindings[bindingId];
    });
  },

  /** 退休绑定 */
  retireBinding(bindingId: string, options?: { reason?: string }): DataSupportBinding | undefined {
    const binding = getState().bindings[bindingId];
    if (!binding) return undefined;
    return mutate(getState(), (draft) => {
      const target = draft.bindings[bindingId];
      target.status = 'RETIRED';
      target.revalidation = undefined;
      bumpBindingRevision(target, bindingId);
      commitRevision(target.businessObjectId, {
        summary: '数据支撑退休',
        changes: [`「${draft.implementations[target.implementationId]?.name ?? target.implementationId}」不再作为数据支撑${options?.reason ? `（${options.reason}）` : ''}`],
        changedBy: '数据支撑复核工作台'
      });
      return draft.bindings[bindingId];
    });
  },

  /** 从数据资产 / 语义资产登记候选实现（Bottom-up 发现支撑时使用） */
  registerCandidate(
    objectId: string,
    input: { implementation: Omit<DataImplementation, 'id' | 'businessObjectId'>; scope?: string }
  ): { implementation: DataImplementation; binding: DataSupportBinding } | undefined {
    const object = getState().objects[objectId];
    if (!object) return undefined;
    const implementationId = nextId('impl');
    return mutate(getState(), (draft) => {
      const implementation: DataImplementation = { id: implementationId, businessObjectId: objectId, ...input.implementation };
      draft.implementations[implementationId] = implementation;
      const binding: DataSupportBinding = {
        id: nextId('bind'),
        businessObjectId: objectId,
        implementationId,
        status: 'CANDIDATE',
        role: 'SECONDARY',
        scope: input.scope ?? implementation.scope,
        evidence: [decisionEvidence(`发现数据支撑：${implementation.name}`, '自下而上发现候选数据实现，等待确认生效。')],
        revision: 'R1',
        createdAt: nowIso()
      };
      draft.bindings[binding.id] = binding;
      return { implementation, binding };
    });
  }
};
