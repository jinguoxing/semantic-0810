/**
 * Resolution Continuation：Bottom-up 创建 / 复用后的统一续作命令（BO-FZ-02）
 *
 * 统一「发布新对象 → 来源数据对齐」的结果口径：
 * - 领域命令只返回 ResolutionContinuationResult，不做导航、不发 Toast（UI 层职责）；
 * - 任务是否完成以领域任务上下文状态为准（confirmBottomUpAlignment 在同一事务内
 *   置 COMPLETED），成功结果必须重新读取任务上下文确认 COMPLETED 后才允许返回；
 * - 失败（对象冲突 / 任务不可处理 / 迁移阻断 / 任务未完成）如实返回错误，
 *   禁止在失败后继续调用成功回调或以 Toast 冒充任务完成。
 */
import { dataSupportService } from './data-support';
import { objectResolutionContexts } from './task-context';
import type { DataAssetReference, DataImplementation, ObjectResolutionContext } from './types';

/** 续作失败口径：任务不可处理 / 迁移阻断 / 目标对象缺失 / 资产冲突 / 任务未随绑定完成 */
export type ResolutionContinuationError =
  | 'TASK_NOT_FOUND'
  | 'TASK_NOT_ACTIVE'
  | 'MIGRATION_BLOCKED'
  | 'OBJECT_NOT_FOUND'
  | 'BINDING_CONFLICT'
  | 'ALIGNMENT_NOT_COMPLETED';

/** 续作模式：CREATE = 新建对象后登记；REUSE = 复用已有对象时登记 */
export type ResolutionContinuationMode = 'CREATE' | 'REUSE';

export type ResolutionContinuationResult =
  | {
      ok: true;
      taskId: string;
      businessObjectId: string;
      bindingId: string;
      implementationId: string;
      taskStatus: 'COMPLETED';
      outcome: 'ALIGNED' | 'IDEMPOTENT_SUCCESS';
    }
  | {
      ok: false;
      taskId: string;
      businessObjectId: string;
      /** 调用侧事实：对象是否已发布 / 已选定（失败不回滚已发布对象，仅表达部分成功） */
      objectPublished: boolean;
      error: ResolutionContinuationError;
      conflictObjectId?: string;
      conflictObjectName?: string;
    };

export interface CompleteBottomUpContinuationInput {
  taskId: string;
  businessObjectId: string;
  /** 调用侧事实：新建对象已发布（true）或复用目标已存在（true） */
  objectPublished: boolean;
  changedBy?: string;
  /** 续作模式（决定实现登记的范围关系表述），默认 CREATE */
  mode?: ResolutionContinuationMode;
}

/** 任务是否仍可被续作处理（OPEN / POSTPONED 均允许） */
function isContinuableTask(context: ObjectResolutionContext): boolean {
  return context.status === 'OPEN' || context.status === 'POSTPONED';
}

/** 由任务上下文的规范数据资产引用推导默认数据实现登记（字段级落地待后续完善） */
export function buildContinuationImplementation(
  dataAsset: DataAssetReference,
  mode: ResolutionContinuationMode = 'CREATE'
): Omit<DataImplementation, 'id' | 'businessObjectId'> {
  return {
    name: dataAsset.name,
    techName: dataAsset.techName ?? dataAsset.id,
    warehouseTable: dataAsset.warehouseTable ?? dataAsset.techName ?? dataAsset.id,
    assetId: dataAsset.id,
    scope: dataAsset.name,
    granularity: '一行一条业务记录（对齐后完善）',
    identity: '（对齐后完善）',
    scopeRelationText:
      mode === 'REUSE' ? '自下而上对齐（复用已有对象登记）' : '自下而上对齐（新建对象自动登记）',
    scopeRelationNote:
      mode === 'REUSE'
        ? '由 Bottom-up Resolution 复用已有业务对象时登记的数据实现，字段级落地待后续完善。'
        : '由 Bottom-up Resolution 在创建新业务对象后自动登记的数据实现，字段级落地待后续完善。',
    attributes: [],
    relationships: []
  };
}

/**
 * 统一 Bottom-up 续作：把任务上下文中的来源数据资产对齐到目标业务对象，
 * 并以任务上下文最终状态裁定成功 / 失败。
 */
export function completeBottomUpContinuation(
  input: CompleteBottomUpContinuationInput
): ResolutionContinuationResult {
  const { taskId, businessObjectId, objectPublished, changedBy } = input;
  const mode: ResolutionContinuationMode = input.mode ?? 'CREATE';

  const failure = (
    error: ResolutionContinuationError,
    extra?: { conflictObjectId?: string; conflictObjectName?: string }
  ): ResolutionContinuationResult => ({
    ok: false,
    taskId,
    businessObjectId,
    objectPublished,
    error,
    ...extra
  });

  // 1-2. 任务上下文必须存在
  const context = objectResolutionContexts.get(taskId);
  if (!context) return failure('TASK_NOT_FOUND');

  // 3. 只有 OPEN / POSTPONED 任务可续作（COMPLETED / CANCELLED 不再处理）
  if (!isContinuableTask(context)) return failure('TASK_NOT_ACTIVE');

  // 4. 迁移预警阻断：先处理迁移，再谈对齐
  if (context.migrationWarning) return failure('MIGRATION_BLOCKED');

  // 5. 由任务上下文的规范数据资产构建默认实现登记
  const implementation = buildContinuationImplementation(context.dataAsset, mode);

  // 6-7. 领域命令：confirmBottomUpAlignment（失败错误原样透传，不降级、不改写）
  const result = dataSupportService.confirmBottomUpAlignment({
    taskId,
    businessObjectId,
    dataAsset: context.dataAsset,
    ...(context.semanticSource ? { semanticSource: context.semanticSource } : {}),
    implementation,
    changedBy
  });
  if (result.ok === false) {
    return failure(result.error, {
      ...(result.conflictObjectId ? { conflictObjectId: result.conflictObjectId } : {}),
      ...(result.conflictObjectName ? { conflictObjectName: result.conflictObjectName } : {})
    });
  }

  // 8-9. 成功必须重新读取任务上下文：仅 COMPLETED 才是真正闭环
  const completedContext = objectResolutionContexts.get(taskId);
  if (!completedContext || completedContext.status !== 'COMPLETED') {
    // 10. 绑定已生效但任务未完成 → 对齐未完成（禁止以绑定成功冒充任务完成）
    return failure('ALIGNMENT_NOT_COMPLETED');
  }

  return {
    ok: true,
    taskId,
    businessObjectId,
    bindingId: result.binding.id,
    implementationId: result.implementation.id,
    taskStatus: 'COMPLETED',
    outcome: result.outcome
  };
}
