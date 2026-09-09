/**
 * Data Support：数据支撑绑定领域服务（Inv02 / Inv05）
 *
 * 两条闭环：
 * - Top-down（对象 → 数据）：CANDIDATE → confirmCandidate(bindingId) → EFFECTIVE
 * - Bottom-up（数据 → 对象）：confirmBottomUpAlignment 直接落 EFFECTIVE 并闭环任务
 * 语义变化触发 NEEDS_REVALIDATION → 复核确认 / 重新绑定 / 退休 / 切主。
 *
 * 本服务所有动作只写 DataSupportRevision，永不产生 BusinessObjectRevision，
 * 永不修改 BusinessObject.currentRevision。
 * 正式数据支撑选择器（listCurrentBindings）只含 EFFECTIVE + NEEDS_REVALIDATION，
 * CANDIDATE / RETIRED 不得出现在正式视图（Inv05）。
 */
import { getState } from './registry';
import { mutate, nextId, nowIso } from './store';
import { BindingRole, BindingStatus, DataAssetReference, DataImplementation, DataSupportBinding } from './types';
import { dataAssetEvidence, decisionEvidence, semanticAssetEvidence } from './evidence';
import { recordDataSupportRevision } from './data-support-revision';
import { objectResolutionContexts } from './task-context';

/**
 * 当前绑定的唯一判定口径（Inv05）：EFFECTIVE 与 NEEDS_REVALIDATION 都是当前关系。
 * 待复核不是「非当前关系」：选择器、PRIMARY 唯一性、冲突检测、幂等判定统一使用本函数，
 * 禁止在调用点各自内联 status 判断。
 */
export function isCurrentBindingStatus(status: BindingStatus): boolean {
  return status === 'EFFECTIVE' || status === 'NEEDS_REVALIDATION';
}

function bumpBindingRevision(draft: DataSupportBinding): void {
  const match = /^R(\d+)$/.exec(draft.revision);
  const nextNumber = match ? Number(match[1]) + 1 : 2;
  draft.revision = `R${nextNumber}`;
}

function implementationName(implementationId: string): string {
  return getState().implementations[implementationId]?.name ?? implementationId;
}

/** 同一实现上是否已存在当前（EFFECTIVE / NEEDS_REVALIDATION）绑定 */
function findActiveBindingByImplementation(implementationId: string, excludeBindingId?: string): DataSupportBinding | undefined {
  return Object.values(getState().bindings).find(
    (binding) =>
      binding.id !== excludeBindingId &&
      binding.implementationId === implementationId &&
      isCurrentBindingStatus(binding.status)
  );
}

export type BottomUpAlignResult =
  | {
      ok: true;
      outcome: 'ALIGNED' | 'IDEMPOTENT_SUCCESS';
      binding: DataSupportBinding;
      implementation: DataImplementation;
      role: BindingRole;
    }
  | { ok: false; error: 'OBJECT_NOT_FOUND' | 'BINDING_CONFLICT'; conflictObjectId?: string; conflictObjectName?: string };

export type ConfirmCandidateResult =
  | { ok: true; binding: DataSupportBinding; role: BindingRole }
  | { ok: false; error: 'NOT_FOUND' | 'NOT_CANDIDATE' };

export type RevalidationKeepResult =
  | { ok: true; binding: DataSupportBinding }
  | { ok: false; error: 'NOT_FOUND' | 'NOT_PENDING' };

export type RebindResult =
  | { ok: true; binding: DataSupportBinding }
  | { ok: false; error: 'NOT_FOUND' | 'IMPLEMENTATION_NOT_FOUND' | 'SAME_IMPLEMENTATION' | 'IMPLEMENTATION_IN_USE' };

export type RetireResult =
  | { ok: true; binding: DataSupportBinding }
  | { ok: false; error: 'NOT_FOUND' | 'NOT_CURRENT' | 'IS_PRIMARY' };

export type SetPrimaryResult =
  | { ok: true; binding: DataSupportBinding; demotedBindingId?: string }
  | { ok: false; error: 'NOT_FOUND' | 'NOT_EFFECTIVE' };

export const dataSupportService = {
  // ---------------------------------------------------------------------------
  // 选择器
  // ---------------------------------------------------------------------------
  listBindings(objectId: string): DataSupportBinding[] {
    return Object.values(getState().bindings).filter((binding) => binding.businessObjectId === objectId);
  },

  /** 当前正式数据支撑：仅 EFFECTIVE + NEEDS_REVALIDATION（Inv05，统一口径见 isCurrentBindingStatus） */
  listCurrentBindings(objectId: string): DataSupportBinding[] {
    return this.listBindings(objectId).filter((binding) => isCurrentBindingStatus(binding.status));
  },

  /** 候选绑定：仅 CANDIDATE，只出现在发现 / 确认工作区 */
  listCandidateBindings(objectId: string): DataSupportBinding[] {
    return this.listBindings(objectId).filter((binding) => binding.status === 'CANDIDATE');
  },

  /** 历史绑定：仅 RETIRED，只出现在历史视图 */
  listRetiredBindings(objectId: string): DataSupportBinding[] {
    return this.listBindings(objectId).filter((binding) => binding.status === 'RETIRED');
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

  // ---------------------------------------------------------------------------
  // Top-down：候选确认（一次只确认选中的那一条绑定）
  // ---------------------------------------------------------------------------
  /**
   * Top-down 确认：将选中的 CANDIDATE 绑定确认为 EFFECTIVE。
   * 对象尚无生效绑定时成为 PRIMARY，否则 SECONDARY；
   * 只提升该绑定的修订号并记录 TOP_DOWN_CONFIRM 数据支撑修订，
   * 不产生业务对象修订，不改 currentRevision。
   */
  confirmCandidate(bindingId: string, options?: { changedBy?: string }): ConfirmCandidateResult {
    const binding = getState().bindings[bindingId];
    if (!binding) return { ok: false, error: 'NOT_FOUND' };
    if (binding.status !== 'CANDIDATE') return { ok: false, error: 'NOT_CANDIDATE' };
    const objectId = binding.businessObjectId;
    const object = getState().objects[objectId];
    if (!object) return { ok: false, error: 'NOT_FOUND' };

    return mutate(getState(), (draft) => {
      const target = draft.bindings[bindingId];
      // 已有当前绑定（含待复核）即占有主要席位：新确认的实现只能进入其他数据实现，
      // 避免 NEEDS_REVALIDATION 的主实现被旁路出现两个 PRIMARY
      const hasCurrent = Object.values(draft.bindings).some(
        (item) => item.businessObjectId === objectId && item.id !== bindingId && isCurrentBindingStatus(item.status)
      );
      const role: BindingRole = hasCurrent ? 'SECONDARY' : 'PRIMARY';
      target.role = role;
      target.status = 'EFFECTIVE';
      target.confirmedAt = nowIso();
      target.evidence = [
        ...target.evidence,
        decisionEvidence(
          `确认数据支撑：${implementationName(target.implementationId)}`,
          '自上而下确认候选数据实现正式生效，作为业务对象的数据支撑。'
        )
      ];
      bumpBindingRevision(target);
      recordDataSupportRevision({
        businessObjectId: objectId,
        bindingId,
        action: 'TOP_DOWN_CONFIRM',
        beforeStatus: 'CANDIDATE',
        afterStatus: 'EFFECTIVE',
        reason: `确认「${implementationName(target.implementationId)}」由候选转为正式生效（${role === 'PRIMARY' ? '主要' : '其他'}数据实现）`,
        changedBy: options?.changedBy ?? '发现数据支撑工作台'
      });
      return { ok: true as const, binding: target, role };
    });
  },

  // ---------------------------------------------------------------------------
  // Bottom-up：从数据侧对齐业务对象（直接落 EFFECTIVE 并闭环任务）
  // ---------------------------------------------------------------------------
  /**
   * 自下而上对齐确认（规范数据资产身份版）：
   * 1. 按 input.dataAsset.id（统一目录规范 ID，semanticId 绝不作为资产身份）定位同资产实现；
   * 2. 同一资产已当前承载（EFFECTIVE / NEEDS_REVALIDATION）本对象 → IDEMPOTENT_SUCCESS，不重复建绑定；
   * 3. 同一资产已当前承载其他对象 → BINDING_CONFLICT，不自动改写；
   * 4. 对象尚无当前实现 → PRIMARY，否则 SECONDARY；
   * 5. 新绑定直接 EFFECTIVE（不经过 CANDIDATE）；
   * 6. 记录 BOTTOM_UP_ALIGN 数据支撑修订（不产生业务对象修订；semanticSource 仅进证据）；
   * 7. 任务上下文（若有）置为 COMPLETED。
   */
  confirmBottomUpAlignment(input: {
    taskId?: string;
    businessObjectId: string;
    /** 规范数据资产引用（来自统一目录解析，见 asset-identity.ts） */
    dataAsset: DataAssetReference;
    /** 数据语义入口来源（仅作为证据记录，不参与资产身份判定） */
    semanticSource?: { semanticId: string; semanticRevision: string };
    implementation: Omit<DataImplementation, 'id' | 'businessObjectId'>;
    changedBy?: string;
  }): BottomUpAlignResult {
    const object = getState().objects[input.businessObjectId];
    if (!object) return { ok: false, error: 'OBJECT_NOT_FOUND' };

    // 同资产冲突 / 幂等检查：按规范 dataAsset.id 找到所有实现及其当前（含待复核）绑定
    const sameAssetImplementations = Object.values(getState().implementations).filter(
      (implementation) => implementation.assetId === input.dataAsset.id
    );
    for (const implementation of sameAssetImplementations) {
      const currentBinding = Object.values(getState().bindings).find(
        (binding) => binding.implementationId === implementation.id && isCurrentBindingStatus(binding.status)
      );
      if (!currentBinding) continue;
      if (currentBinding.businessObjectId === input.businessObjectId) {
        // 幂等：该资产已正式承载本对象，直接成功返回
        if (input.taskId) objectResolutionContexts.complete(input.taskId);
        return { ok: true, outcome: 'IDEMPOTENT_SUCCESS', binding: currentBinding, implementation, role: currentBinding.role };
      }
      const conflictObject = getState().objects[currentBinding.businessObjectId];
      return {
        ok: false,
        error: 'BINDING_CONFLICT',
        conflictObjectId: conflictObject?.id,
        conflictObjectName: conflictObject?.name ?? currentBinding.businessObjectId
      };
    }

    const implementationId = nextId('impl');
    const result = mutate(getState(), (draft) => {
      // 复用本对象下同资产的实现记录，避免重复登记实现
      const existing = sameAssetImplementations.find((implementation) => implementation.businessObjectId === input.businessObjectId);
      const implementation: DataImplementation = existing
        ? existing
        : { id: implementationId, businessObjectId: input.businessObjectId, ...input.implementation };
      if (!existing) {
        draft.implementations[implementation.id] = implementation;
      }

      const hasCurrent = Object.values(draft.bindings).some(
        (binding) => binding.businessObjectId === input.businessObjectId && isCurrentBindingStatus(binding.status)
      );
      const role: BindingRole = hasCurrent ? 'SECONDARY' : 'PRIMARY';

      // 同一实现已有 CANDIDATE 绑定时提升该绑定（CANDIDATE → EFFECTIVE），
      // 不再新建绑定：一个数据实现对一个业务对象只允许一条在役绑定
      const existingCandidateBinding = existing
        ? Object.values(draft.bindings).find(
            (binding) =>
              binding.implementationId === existing.id &&
              binding.businessObjectId === input.businessObjectId &&
              binding.status === 'CANDIDATE'
          )
        : undefined;
      if (existingCandidateBinding) {
        const promoted = draft.bindings[existingCandidateBinding.id];
        promoted.status = 'EFFECTIVE';
        promoted.role = role;
        promoted.confirmedAt = nowIso();
        promoted.evidence = [
          ...promoted.evidence,
          dataAssetEvidence(
            `自下而上对齐：${input.dataAsset.name}`,
            input.dataAsset.id,
            `「${input.dataAsset.name}」确认为「${draft.objects[input.businessObjectId].name}」的数据支撑（${role === 'PRIMARY' ? '主要' : '其他'}数据实现）。`
          ),
          ...(input.semanticSource
            ? [
                semanticAssetEvidence(
                  `语义来源：${input.semanticSource.semanticId}`,
                  input.semanticSource.semanticId,
                  `对齐发起自数据语义 ${input.semanticSource.semanticRevision}，仅作为来源证据，不作为数据资产身份。`,
                  input.semanticSource.semanticRevision
                )
              ]
            : [])
        ];
        bumpBindingRevision(promoted);
        recordDataSupportRevision({
          businessObjectId: input.businessObjectId,
          bindingId: promoted.id,
          action: 'BOTTOM_UP_ALIGN',
          beforeStatus: 'CANDIDATE',
          afterStatus: 'EFFECTIVE',
          afterImplementationId: implementation.id,
          reason: `自下而上对齐：「${input.dataAsset.name}」由候选提升并生效为「${draft.objects[input.businessObjectId].name}」的数据支撑`,
          changedBy: input.changedBy ?? '业务对象对齐工作台'
        });
        return { ok: true as const, outcome: 'ALIGNED' as const, binding: promoted, implementation, role };
      }

      const binding: DataSupportBinding = {
        id: nextId('bind'),
        businessObjectId: input.businessObjectId,
        implementationId: implementation.id,
        status: 'EFFECTIVE',
        role,
        scope: input.implementation.scope,
        evidence: [
          dataAssetEvidence(
            `自下而上对齐：${input.dataAsset.name}`,
            input.dataAsset.id,
            `「${input.dataAsset.name}」确认为「${draft.objects[input.businessObjectId].name}」的数据支撑（${role === 'PRIMARY' ? '主要' : '其他'}数据实现）。`
          ),
          ...(input.semanticSource
            ? [
                semanticAssetEvidence(
                  `语义来源：${input.semanticSource.semanticId}`,
                  input.semanticSource.semanticId,
                  `对齐发起自数据语义 ${input.semanticSource.semanticRevision}，仅作为来源证据，不作为数据资产身份。`,
                  input.semanticSource.semanticRevision
                )
              ]
            : [])
        ],
        revision: 'R1',
        createdAt: nowIso(),
        confirmedAt: nowIso()
      };
      draft.bindings[binding.id] = binding;
      recordDataSupportRevision({
        businessObjectId: input.businessObjectId,
        bindingId: binding.id,
        action: 'BOTTOM_UP_ALIGN',
        afterStatus: 'EFFECTIVE',
        afterImplementationId: implementation.id,
        reason: `自下而上对齐：「${input.dataAsset.name}」直接生效为「${draft.objects[input.businessObjectId].name}」的数据支撑`,
        changedBy: input.changedBy ?? '业务对象对齐工作台'
      });
      return { ok: true as const, outcome: 'ALIGNED' as const, binding, implementation, role };
    });

    if (input.taskId) objectResolutionContexts.complete(input.taskId);
    return result;
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
      const beforeStatus = target.status;
      target.status = 'NEEDS_REVALIDATION';
      target.revalidation = {
        reason: input.reason,
        sourceRevision: input.sourceRevision,
        affectedTargets: input.affectedTargets,
        raisedAt: nowIso()
      };
      recordDataSupportRevision({
        businessObjectId: target.businessObjectId,
        bindingId,
        action: 'MARK_REVALIDATION',
        beforeStatus,
        afterStatus: 'NEEDS_REVALIDATION',
        reason: input.reason,
        changedBy: '语义修订同步'
      });
      return target;
    });
  },

  /** 复核确认继续使用：NEEDS_REVALIDATION → EFFECTIVE（REVALIDATION_KEEP） */
  confirmRevalidation(bindingId: string, options?: { changedBy?: string }): RevalidationKeepResult {
    const binding = getState().bindings[bindingId];
    if (!binding) return { ok: false, error: 'NOT_FOUND' };
    if (binding.status !== 'NEEDS_REVALIDATION') return { ok: false, error: 'NOT_PENDING' };
    return mutate(getState(), (draft) => {
      const target = draft.bindings[bindingId];
      target.status = 'EFFECTIVE';
      target.confirmedAt = nowIso();
      target.revalidation = undefined;
      bumpBindingRevision(target);
      recordDataSupportRevision({
        businessObjectId: target.businessObjectId,
        bindingId,
        action: 'REVALIDATION_KEEP',
        beforeStatus: 'NEEDS_REVALIDATION',
        afterStatus: 'EFFECTIVE',
        reason: `复核确认「${implementationName(target.implementationId)}」继续作为数据支撑`,
        changedBy: options?.changedBy ?? '数据支撑复核工作台'
      });
      return { ok: true as const, binding: target };
    });
  },

  /**
   * 重新绑定：换绑到另一个数据实现。
   * 约束：新实现 ≠ 当前实现；新实现不得已被其他活跃绑定使用（一个实现最多一个活跃绑定）。
   */
  rebind(bindingId: string, newImplementationId: string, options?: { reason?: string; changedBy?: string }): RebindResult {
    const binding = getState().bindings[bindingId];
    if (!binding) return { ok: false, error: 'NOT_FOUND' };
    if (binding.implementationId === newImplementationId) return { ok: false, error: 'SAME_IMPLEMENTATION' };
    const implementation = getState().implementations[newImplementationId];
    if (!implementation) return { ok: false, error: 'IMPLEMENTATION_NOT_FOUND' };
    const occupied = findActiveBindingByImplementation(newImplementationId, bindingId);
    if (occupied) return { ok: false, error: 'IMPLEMENTATION_IN_USE' };

    return mutate(getState(), (draft) => {
      const target = draft.bindings[bindingId];
      const beforeStatus = target.status;
      const beforeImplementationId = target.implementationId;
      const previousName = implementationName(beforeImplementationId);
      target.implementationId = newImplementationId;
      target.status = 'EFFECTIVE';
      target.scope = implementation.scope;
      target.confirmedAt = nowIso();
      target.revalidation = undefined;
      bumpBindingRevision(target);
      recordDataSupportRevision({
        businessObjectId: target.businessObjectId,
        bindingId,
        action: 'REBIND',
        beforeStatus,
        afterStatus: 'EFFECTIVE',
        beforeImplementationId,
        afterImplementationId: newImplementationId,
        reason: `「${previousName}」重绑为「${implementation.name}」${options?.reason ? `（${options.reason}）` : ''}`,
        changedBy: options?.changedBy ?? '数据支撑复核工作台'
      });
      return { ok: true as const, binding: target };
    });
  },

  /**
   * 退休绑定。约束：
   * - 只有当前绑定（EFFECTIVE / NEEDS_REVALIDATION，含待复核）可退休；
   * - PRIMARY 绑定不可直接退休 ——
   *   需先通过 SET_PRIMARY 确认新的主要数据实现（无其他生效实现时同样不可退休）。
   */
  retireBinding(bindingId: string, options?: { reason?: string; changedBy?: string }): RetireResult {
    const binding = getState().bindings[bindingId];
    if (!binding) return { ok: false, error: 'NOT_FOUND' };
    if (!isCurrentBindingStatus(binding.status)) return { ok: false, error: 'NOT_CURRENT' };
    if (binding.role === 'PRIMARY') return { ok: false, error: 'IS_PRIMARY' };

    return mutate(getState(), (draft) => {
      const target = draft.bindings[bindingId];
      const beforeStatus = target.status;
      target.status = 'RETIRED';
      target.revalidation = undefined;
      bumpBindingRevision(target);
      recordDataSupportRevision({
        businessObjectId: target.businessObjectId,
        bindingId,
        action: 'RETIRE',
        beforeStatus,
        afterStatus: 'RETIRED',
        reason: `「${implementationName(target.implementationId)}」不再作为数据支撑${options?.reason ? `（${options.reason}）` : ''}`,
        changedBy: options?.changedBy ?? '数据支撑复核工作台'
      });
      return { ok: true as const, binding: target };
    });
  },

  /**
   * 切换主要数据实现：目标绑定须为当前绑定（EFFECTIVE 或 NEEDS_REVALIDATION，Inv05）。
   * 待复核的主实现仍占主要席位，切主会使其降级为其他数据实现；
   * 原 PRIMARY（含 NEEDS_REVALIDATION）自动降级为 SECONDARY，保证主要数据实现唯一，
   * 只记录 SET_PRIMARY 数据支撑修订。
   */
  setPrimary(bindingId: string, options?: { reason?: string; changedBy?: string }): SetPrimaryResult {
    const binding = getState().bindings[bindingId];
    if (!binding) return { ok: false, error: 'NOT_FOUND' };
    if (!isCurrentBindingStatus(binding.status)) return { ok: false, error: 'NOT_EFFECTIVE' };

    return mutate(getState(), (draft) => {
      const target = draft.bindings[bindingId];
      const demoted = Object.values(draft.bindings).find(
        (item) =>
          item.businessObjectId === target.businessObjectId &&
          item.id !== bindingId &&
          item.role === 'PRIMARY' &&
          isCurrentBindingStatus(item.status)
      );
      if (demoted) {
        demoted.role = 'SECONDARY';
        bumpBindingRevision(demoted);
      }
      target.role = 'PRIMARY';
      bumpBindingRevision(target);
      recordDataSupportRevision({
        businessObjectId: target.businessObjectId,
        bindingId,
        action: 'SET_PRIMARY',
        beforeStatus: target.status,
        afterStatus: target.status,
        reason: `「${implementationName(target.implementationId)}」确认为主要数据实现${demoted ? `，「${implementationName(demoted.implementationId)}」降级为其他数据实现` : ''}`,
        changedBy: options?.changedBy ?? '业务对象详情'
      });
      return { ok: true as const, binding: target, ...(demoted ? { demotedBindingId: demoted.id } : {}) };
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
