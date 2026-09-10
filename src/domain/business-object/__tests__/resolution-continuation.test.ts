import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildContinuationImplementation,
  completeBottomUpContinuation,
  getState,
  objectResolutionContexts,
  resetDomainStateForTesting,
  type ResolutionContinuationResult
} from '../index';

describe('completeBottomUpContinuation（BO-FZ-02 统一续作）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });

  /** 失败结果窄化辅助（只读断言用） */
  const asFailure = (result: ResolutionContinuationResult) => {
    expect(result.ok).toBe(false);
    return result as Extract<ResolutionContinuationResult, { ok: false }>;
  };

  it('BINDING_CONFLICT：来源资产已承载其他对象 → 失败如实返回且任务保持未完成', () => {
    // 种子事实：res-01 已 EFFECTIVE 承载 bo_service_ticket（服务工单）
    objectResolutionContexts.open({
      taskId: 'task_conflict_res01',
      sourceType: 'DATA_ASSET',
      dataAsset: { id: 'res-01', name: '客服业务当前工单视图' },
      returnRoute: 'asset_detail'
    });

    const result = completeBottomUpContinuation({
      taskId: 'task_conflict_res01',
      businessObjectId: 'bo_person',
      objectPublished: true,
      changedBy: '单测'
    });

    const failure = asFailure(result);
    expect(failure.error).toBe('BINDING_CONFLICT');
    expect(failure.objectPublished).toBe(true);
    expect(failure.conflictObjectId).toBe('bo_service_ticket');
    expect(failure.conflictObjectName).toBe('服务工单');
    // 失败绝不完成任务（也绝不产生任何绑定改写）
    expect(getState().taskContexts.task_conflict_res01.status).toBe('OPEN');
    const personRes01Impls = Object.values(getState().implementations).filter(
      (impl) => impl.businessObjectId === 'bo_person' && impl.assetId === 'res-01'
    );
    expect(personRes01Impls).toHaveLength(0);
  });

  it('成功路径：未承载冲突的资产对齐到 bo_person → 任务在同一命令内置为 COMPLETED', () => {
    objectResolutionContexts.open({
      taskId: 'task_success_asset2',
      sourceType: 'DATA_ASSET',
      dataAsset: { id: 'asset-2', name: '人口基本信息' },
      returnRoute: 'asset_detail'
    });

    const result = completeBottomUpContinuation({
      taskId: 'task_success_asset2',
      businessObjectId: 'bo_person',
      objectPublished: true,
      mode: 'REUSE',
      changedBy: '单测'
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.taskStatus).toBe('COMPLETED');
      expect(result.outcome).toBe('ALIGNED');
      expect(result.businessObjectId).toBe('bo_person');
      expect(result.bindingId).toBeTruthy();
      expect(result.implementationId).toBeTruthy();
    }
    // 任务上下文以领域状态为准：COMPLETED
    expect(getState().taskContexts.task_success_asset2.status).toBe('COMPLETED');
    // 绑定已生效（bo_person 已有 EFFECTIVE 主要实现 res-11 → 本次为 SECONDARY）
    const binding = getState().bindings[result.ok ? result.bindingId : ''];
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.role).toBe('SECONDARY');
  });

  it('TASK_NOT_ACTIVE：已完结任务不再接受续作', () => {
    objectResolutionContexts.open({
      taskId: 'task_done_asset2',
      sourceType: 'DATA_ASSET',
      dataAsset: { id: 'asset-2', name: '人口基本信息' },
      returnRoute: 'asset_detail'
    });
    objectResolutionContexts.complete('task_done_asset2');

    const failure = asFailure(
      completeBottomUpContinuation({
        taskId: 'task_done_asset2',
        businessObjectId: 'bo_person',
        objectPublished: true
      })
    );
    expect(failure.error).toBe('TASK_NOT_ACTIVE');
    expect(getState().taskContexts.task_done_asset2.status).toBe('COMPLETED');
  });

  it('TASK_NOT_FOUND：任务上下文不存在时如实失败', () => {
    const failure = asFailure(
      completeBottomUpContinuation({
        taskId: 'task_ghost_404',
        businessObjectId: 'bo_person',
        objectPublished: true
      })
    );
    expect(failure.error).toBe('TASK_NOT_FOUND');
  });

  it('OBJECT_NOT_FOUND：目标对象不在领域仓库 → 透传领域错误', () => {
    objectResolutionContexts.open({
      taskId: 'task_target_missing',
      sourceType: 'DATA_ASSET',
      dataAsset: { id: 'asset-2', name: '人口基本信息' },
      returnRoute: 'asset_detail'
    });
    const failure = asFailure(
      completeBottomUpContinuation({
        taskId: 'task_target_missing',
        businessObjectId: 'bo_ghost_object',
        objectPublished: false
      })
    );
    expect(failure.error).toBe('OBJECT_NOT_FOUND');
    expect(getState().taskContexts.task_target_missing.status).toBe('OPEN');
  });

  it('buildContinuationImplementation：实现登记携带规范资产身份，不写死字段', () => {
    const implementation = buildContinuationImplementation(
      { id: 'asset-2', name: '人口基本信息', techName: 'pop_person_base' },
      'REUSE'
    );
    expect(implementation.assetId).toBe('asset-2');
    expect(implementation.techName).toBe('pop_person_base');
    expect(implementation.warehouseTable).toBe('pop_person_base');
    expect(implementation.scopeRelationText).toContain('复用已有对象登记');
    expect(implementation.attributes).toEqual([]);
    const createImpl = buildContinuationImplementation({ id: 'asset-2', name: '人口基本信息' }, 'CREATE');
    expect(createImpl.scopeRelationText).toContain('新建对象自动登记');
    expect(createImpl.techName).toBe('asset-2');
  });
});
