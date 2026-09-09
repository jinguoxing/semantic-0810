/**
 * Business Object V2.2 最终收口边界（§15 单元测试）
 *
 * 八项领域侧边界验收：
 * 1. CHANGE 草稿按 objectId 隔离（§3 通用化：演示草稿不串对象）；
 * 2. Bottom-up 资产身份按 dataAsset.id 归一，semanticId 只作证据（§4）；
 * 3. NEEDS_REVALIDATION 统一按当前绑定处理：选择器 / PRIMARY 唯一 / 资产冲突（§7）；
 * 4. Grounding 同一 targetKey 至多一条 ACTIVE（§9）；
 * 5. 保存与发布共用同一份草稿（§10）；
 * 6. 全部数据支撑命令只写 DataSupportRevision（Inv02 / Inv04）；
 * 7. Grounding 修正只写 GroundingRevision（Inv03 / Inv04）；
 * 8. Bottom-up 对齐在同一命令内闭环任务（§11：任务折入同一事务）。
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  businessObjectRepository,
  dataSupportService,
  getState,
  getWorkingDraft,
  groundingService,
  groundingTargetKey,
  isCurrentBindingStatus,
  listDataSupportRevisions,
  listRevisions,
  objectResolutionContexts,
  publishDraft,
  resetDomainStateForTesting,
  saveChangeDraft,
  updateDraft,
  type BusinessObjectDefinitionSnapshot
} from '../index';

/** 以正式对象为基线组装 CHANGE 草稿快照（覆盖指定字段） */
function snapshotOf(objectId: string, patch: Partial<BusinessObjectDefinitionSnapshot> = {}): BusinessObjectDefinitionSnapshot {
  const object = businessObjectRepository.get(objectId)!;
  return {
    name: object.name,
    aliases: [...object.aliases],
    definition: object.definition,
    domain: object.domain,
    identity: { ...object.identity },
    attributes: object.attributes,
    relationships: object.relationships,
    evidence: object.evidence,
    ...patch
  };
}

/** Bottom-up 对齐登记用的最小数据实现（资产身份以 assetId 为准） */
function bottomUpImplementation(assetId: string, name: string) {
  return {
    name,
    techName: assetId,
    warehouseTable: assetId,
    assetId,
    scope: name,
    granularity: '一行一条业务记录（对齐后完善）',
    identity: '（对齐后完善）',
    scopeRelationText: '自下而上对齐（Bottom-up Resolution 登记）',
    scopeRelationNote: '由 Bottom-up Resolution 确认的数据实现。',
    attributes: [],
    relationships: []
  };
}

describe('business object final closure edge cases (V2.2)', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });

  it('CHANGE 草稿按 objectId 隔离：自然人创建自己的草稿，不串服务工单演示草稿，发布互不影响（§3）', () => {
    // 种子只有服务工单的演示 CHANGE 草稿；自然人没有预置草稿
    expect(getWorkingDraft('CHANGE', 'bo_person')).toBeUndefined();
    expect(getWorkingDraft('CHANGE', 'bo_service_ticket')?.id).toBe('bodraft_st_change_demo');

    const created = saveChangeDraft('bo_person', 'R2', snapshotOf('bo_person', { definition: '统一覆盖户籍与常住人口口径。' }));
    expect(created?.objectId).toBe('bo_person');
    expect(created?.baseRevision).toBe('R2');
    expect(getWorkingDraft('CHANGE', 'bo_person')?.id).toBe(created?.id);
    // 两个对象的 WORKING 草稿并存，互不取代
    expect(getWorkingDraft('CHANGE', 'bo_service_ticket')?.id).toBe('bodraft_st_change_demo');

    const published = publishDraft(created!.id, { summary: '自然人定义修订' });
    expect(published.ok).toBe(true);
    if (published.ok === true) {
      expect(published.revision).toBe('R3');
      expect(published.isNewObject).toBe(false);
    }
    expect(businessObjectRepository.get('bo_person')?.currentRevision).toBe('R3');
    expect(businessObjectRepository.get('bo_person')?.definition).toBe('统一覆盖户籍与常住人口口径。');
    // 服务工单完全不受影响：修订号与演示草稿原样
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
    expect(getState().drafts['bodraft_st_change_demo'].status).toBe('WORKING');
    // 发布后自然人无 WORKING 草稿残留
    expect(getWorkingDraft('CHANGE', 'bo_person')).toBeUndefined();
  });

  it('Bottom-up 资产身份按 dataAsset.id 归一：semanticId 只进证据，双入口只登记一条实现（§4）', () => {
    // 数据语义入口：semanticSource 携带 sem_hotline_ticket，资产身份是统一目录的 asset-1
    const fromSemantics = dataSupportService.confirmBottomUpAlignment({
      businessObjectId: 'bo_service_ticket',
      dataAsset: { id: 'asset-1', name: '公共服务热线工单记录表' },
      semanticSource: { semanticId: 'sem_hotline_ticket', semanticRevision: 'S5' },
      implementation: bottomUpImplementation('asset-1', '公共服务热线工单记录表')
    });
    expect(fromSemantics.ok).toBe(true);

    // 种子热线实现（asset-1 的 CANDIDATE 绑定）被提升为 EFFECTIVE，不新建实现
    const assetImpls = Object.values(getState().implementations).filter((impl) => impl.assetId === 'asset-1');
    expect(assetImpls.map((impl) => impl.id)).toEqual(['impl_st_hotline']);
    const hotlineBinding = Object.values(getState().bindings).find((binding) => binding.implementationId === 'impl_st_hotline');
    expect(hotlineBinding?.status).toBe('EFFECTIVE');
    // semanticId 只作为证据落到绑定证据链，绝不冒充资产身份
    expect(
      hotlineBinding?.evidence.some((item) => item.source.includes('sem_hotline_ticket') || item.title.includes('sem_hotline_ticket'))
    ).toBe(true);

    // 数据资产目录入口：同一 dataAsset.id 再次对齐 → 幂等成功，仍只有一条实现
    const fromCatalog = dataSupportService.confirmBottomUpAlignment({
      businessObjectId: 'bo_service_ticket',
      dataAsset: { id: 'asset-1', name: '公共服务热线工单记录表' },
      implementation: bottomUpImplementation('asset-1', '公共服务热线工单记录表')
    });
    expect(fromCatalog.ok).toBe(true);
    if (fromCatalog.ok === true) {
      expect(fromCatalog.outcome).toBe('IDEMPOTENT_SUCCESS');
    }
    expect(Object.values(getState().implementations).filter((impl) => impl.assetId === 'asset-1')).toHaveLength(1);
    // 语义 ID / 旧资源 ID 绝不作为资产身份落库
    expect(Object.values(getState().implementations).filter((impl) => impl.assetId === 'sem_hotline_ticket')).toHaveLength(0);
    expect(Object.values(getState().implementations).filter((impl) => impl.assetId === 'res-02')).toHaveLength(0);
  });

  it('NEEDS_REVALIDATION 统一按当前绑定处理：选择器 / PRIMARY 唯一 / 资产冲突（§7）', () => {
    // (a) 待复核绑定进入当前选择器（isCurrentBindingStatus 统一口径，非「非当前关系」）
    dataSupportService.markNeedsRevalidation('bind_st_curr_view', {
      reason: '语义修订：办结口径调整',
      sourceRevision: 'S6',
      affectedTargets: ['办结时间']
    });
    expect(isCurrentBindingStatus('NEEDS_REVALIDATION')).toBe(true);
    expect(dataSupportService.listCurrentBindings('bo_service_ticket').map((binding) => binding.id)).toContain(
      'bind_st_curr_view'
    );

    // (b) 待复核绑定仍占用资产：res-01 对齐自然人 → BINDING_CONFLICT，零写入
    const conflict = dataSupportService.confirmBottomUpAlignment({
      businessObjectId: 'bo_person',
      dataAsset: { id: 'res-01', name: '客服工单当前视图' },
      implementation: bottomUpImplementation('res-01', '客服工单当前视图')
    });
    expect(conflict.ok).toBe(false);
    if (conflict.ok === false) {
      expect(conflict.error).toBe('BINDING_CONFLICT');
      expect(conflict.conflictObjectName).toBe('服务工单');
    }
    expect(Object.values(getState().implementations).some((impl) => impl.businessObjectId === 'bo_person' && impl.assetId === 'res-01')).toBe(
      false
    );

    // (c) PRIMARY 唯一性含 NEEDS_REVALIDATION：待复核主实现不可直接退休；切主后原主实现降级且恰有一条 PRIMARY
    const blocked = dataSupportService.retireBinding('bind_st_curr_view', { reason: '尝试直接退休待复核主实现' });
    expect(blocked.ok).toBe(false);
    if (blocked.ok === false) {
      expect(blocked.error).toBe('IS_PRIMARY');
    }

    const confirm = dataSupportService.confirmCandidate('bind_st_hotline');
    expect(confirm.ok).toBe(true);
    const promote = dataSupportService.setPrimary('bind_st_hotline', { reason: '热线数据更完整' });
    expect(promote.ok).toBe(true);
    const current = dataSupportService.listCurrentBindings('bo_service_ticket');
    expect(current.filter((binding) => binding.role === 'PRIMARY').map((binding) => binding.id)).toEqual(['bind_st_hotline']);
    // 原主实现降级为其他实现，但仍是当前绑定（待复核状态不因降级丢失）
    expect(current.find((binding) => binding.id === 'bind_st_curr_view')?.role).toBe('SECONDARY');
    expect(current.find((binding) => binding.id === 'bind_st_curr_view')?.status).toBe('NEEDS_REVALIDATION');

    // (d) 待复核的当前绑定可被复核确认恢复生效
    const keep = dataSupportService.confirmRevalidation('bind_st_curr_view');
    expect(keep.ok).toBe(true);
    expect(dataSupportService.getBinding('bind_st_curr_view')?.status).toBe('EFFECTIVE');
  });

  it('Grounding 同一 targetKey 至多一条 ACTIVE：连续修正归档上一条，不同目标互不影响（§9）', () => {
    const relationBase = {
      bindingId: 'bind_st_curr_view',
      type: 'RELATIONSHIP' as const,
      targetId: 'rel_st_applicant',
      targetObjectId: 'bo_person',
      reason: '主身份字段口径不一致',
      evidence: []
    };
    const first = groundingService.applyCorrection({ ...relationBase, fromField: 'applicant_id', toField: 'person_id' });
    expect(first.ok).toBe(true);
    const second = groundingService.applyCorrection({ ...relationBase, fromField: 'person_id', toField: 'applicant_id' });
    expect(second.ok).toBe(true);

    const relationRevisions = groundingService
      .listRevisions('bind_st_curr_view')
      .filter((revision) => revision.type === 'RELATIONSHIP');
    expect(relationRevisions).toHaveLength(2);
    expect(relationRevisions.every((revision) => revision.targetKey === groundingTargetKey('RELATIONSHIP', 'rel_st_applicant'))).toBe(true);
    expect(relationRevisions.every((revision) => revision.targetId === 'rel_st_applicant')).toBe(true);
    // 至多一条 ACTIVE：上一条归档为 HISTORY，最新修正为 ACTIVE
    expect(relationRevisions.filter((revision) => revision.status === 'ACTIVE')).toHaveLength(1);
    expect(relationRevisions.filter((revision) => revision.status === 'HISTORY')).toHaveLength(1);
    const active = relationRevisions.find((revision) => revision.status === 'ACTIVE');
    expect(active?.after.field).toBe('客服工单当前视图 · applicant_id');

    // 不同 targetKey 的属性修正与之并存（各一条 ACTIVE，互不归档）
    const attribute = groundingService.applyCorrection({
      bindingId: 'bind_st_curr_view',
      type: 'ATTRIBUTE',
      targetId: 'attr_close_time',
      fromField: 'finished_time',
      toField: 'close_time',
      reason: '语义修订：finished_time 表示最后更新时间',
      evidence: []
    });
    expect(attribute.ok).toBe(true);
    const allRevisions = groundingService.listByObject('bo_service_ticket');
    expect(allRevisions.filter((revision) => revision.targetKey === 'ATTRIBUTE:attr_close_time')).toHaveLength(1);
    expect(allRevisions.filter((revision) => revision.status === 'ACTIVE').map((revision) => revision.targetKey).sort()).toEqual([
      'ATTRIBUTE:attr_close_time',
      'RELATIONSHIP:rel_st_applicant'
    ]);
  });

  it('保存与发布共用同一份草稿：updateDraft 复用 draftId，发布后无 WORKING 孤儿（§10）', () => {
    const created = saveChangeDraft('bo_person', 'R2', snapshotOf('bo_person', { definition: '第一版草稿' }));
    const draftId = created!.id;

    const updated = updateDraft(draftId, snapshotOf('bo_person', { definition: '第二版草稿' }));
    expect(updated.ok).toBe(true);
    // 两次保存同一份草稿：WORKING 草稿的 id 不变
    expect(getWorkingDraft('CHANGE', 'bo_person')?.id).toBe(draftId);
    expect(getState().drafts[draftId].content.definition).toBe('第二版草稿');

    // 发布的是这份草稿：正式内容为最后一次保存
    const published = publishDraft(draftId, { summary: '发布修改' });
    expect(published.ok).toBe(true);
    expect(businessObjectRepository.get('bo_person')?.definition).toBe('第二版草稿');
    expect(businessObjectRepository.get('bo_person')?.currentRevision).toBe('R3');
    expect(getState().drafts[draftId].status).toBe('PUBLISHED');
    expect(getWorkingDraft('CHANGE', 'bo_person')).toBeUndefined();

    // 同一份草稿不可二次发布（不产生第二条业务对象修订）
    const again = publishDraft(draftId);
    expect(again.ok).toBe(false);
    if (again.ok === false) {
      expect(again.error).toBe('ALREADY_PUBLISHED');
    }
    expect(businessObjectRepository.get('bo_person')?.currentRevision).toBe('R3');
    expect(listRevisions('bo_person').map((revision) => revision.revision)).toEqual(['R3', 'R2', 'R1']);
  });

  it('全部数据支撑命令只写 DataSupportRevision：currentRevision 与业务对象修订不变（Inv02 / Inv04）', () => {
    const ticketBefore = businessObjectRepository.get('bo_service_ticket')?.currentRevision;
    const personBefore = businessObjectRepository.get('bo_person')?.currentRevision;

    // 七类命令全走一遍（含任务闭环折入 BOTTOM_UP_ALIGN 的同一事务）
    objectResolutionContexts.open({
      taskId: 'task_edge_support',
      sourceType: 'DATA_ASSET',
      dataAsset: { id: 'res-99', name: '网格流转工单表' },
      returnRoute: 'asset_detail'
    });
    expect(dataSupportService.confirmCandidate('bind_st_hotline').ok).toBe(true);
    expect(
      dataSupportService.confirmBottomUpAlignment({
        taskId: 'task_edge_support',
        businessObjectId: 'bo_service_ticket',
        dataAsset: { id: 'res-99', name: '网格流转工单表' },
        implementation: bottomUpImplementation('res-99', '网格流转工单表')
      }).ok
    ).toBe(true);
    // markNeedsRevalidation 直接返回绑定（语义模块触发的领域写入，无结果联合）
    const marked = dataSupportService.markNeedsRevalidation('bind_st_hotline', {
      reason: '语义修订：诉求类型口径调整',
      sourceRevision: 'S6',
      affectedTargets: ['诉求类型']
    });
    expect(marked.status).toBe('NEEDS_REVALIDATION');
    expect(dataSupportService.confirmRevalidation('bind_st_hotline').ok).toBe(true);
    expect(dataSupportService.setPrimary('bind_st_hotline', { reason: '热线数据更完整' }).ok).toBe(true);
    expect(dataSupportService.retireBinding('bind_st_curr_view', { reason: '被热线实现替代' }).ok).toBe(true);
    expect(dataSupportService.retireBinding('bind_person_stat', { reason: '释放实现占用' }).ok).toBe(true);
    expect(dataSupportService.rebind('bind_person_ext', 'impl_person_stat', { reason: '口径一致' }).ok).toBe(true);

    // 七类动作全部落成数据支撑修订
    const ticketActions = listDataSupportRevisions('bo_service_ticket').map((revision) => revision.action);
    expect(ticketActions).toEqual(
      expect.arrayContaining(['TOP_DOWN_CONFIRM', 'BOTTOM_UP_ALIGN', 'MARK_REVALIDATION', 'REVALIDATION_KEEP', 'SET_PRIMARY', 'RETIRE'])
    );
    const personActions = listDataSupportRevisions('bo_person').map((revision) => revision.action);
    expect(personActions).toEqual(expect.arrayContaining(['RETIRE', 'REBIND']));

    // 任务闭环折入 BOTTOM_UP_ALIGN 同一命令（§11）
    expect(getState().taskContexts['task_edge_support']?.status).toBe('COMPLETED');

    // Inv02 / Inv04：数据支撑命令绝不推动业务对象修订
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe(ticketBefore);
    expect(businessObjectRepository.get('bo_person')?.currentRevision).toBe(personBefore);
    expect(listRevisions('bo_service_ticket').map((revision) => revision.revision)).toEqual(['R1']);
    expect(listRevisions('bo_person').map((revision) => revision.revision)).toEqual(['R2', 'R1']);
  });

  it('Grounding 修正只写 GroundingRevision：业务对象修订 / currentRevision / 数据支撑修订均不变（Inv03 / Inv04）', () => {
    const attribute = groundingService.applyCorrection({
      bindingId: 'bind_st_curr_view',
      type: 'ATTRIBUTE',
      targetId: 'attr_close_time',
      fromField: 'finished_time',
      toField: 'close_time',
      reason: '语义修订：finished_time 表示最后更新时间',
      evidence: []
    });
    expect(attribute.ok).toBe(true);
    const relationship = groundingService.applyCorrection({
      bindingId: 'bind_st_curr_view',
      type: 'RELATIONSHIP',
      targetId: 'rel_st_applicant',
      targetObjectId: 'bo_person',
      fromField: 'applicant_id',
      toField: 'person_id',
      reason: '主身份字段口径不一致',
      evidence: []
    });
    expect(relationship.ok).toBe(true);
    const repeat = groundingService.applyCorrection({
      bindingId: 'bind_st_curr_view',
      type: 'RELATIONSHIP',
      targetId: 'rel_st_applicant',
      targetObjectId: 'bo_person',
      fromField: 'person_id',
      toField: 'applicant_id',
      reason: '回滚上一次修正',
      evidence: []
    });
    expect(repeat.ok).toBe(true);

    expect(groundingService.listByObject('bo_service_ticket')).toHaveLength(3);
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
    expect(listRevisions('bo_service_ticket').map((revision) => revision.revision)).toEqual(['R1']);
    expect(listDataSupportRevisions('bo_service_ticket')).toHaveLength(0);
  });

  it('Bottom-up 对齐在同一命令内闭环任务：绑定生效与任务 COMPLETED 一次写入（§11）', () => {
    objectResolutionContexts.open({
      taskId: 'task_edge_create',
      sourceType: 'DATA_SEMANTICS',
      dataAsset: { id: 'asset-1', name: '公共服务热线工单记录表' },
      semanticSource: { semanticId: 'sem_hotline_ticket', semanticRevision: 'S5' },
      returnRoute: 'semantics_detail'
    });
    const before = getState().taskContexts['task_edge_create'];

    const result = dataSupportService.confirmBottomUpAlignment({
      taskId: 'task_edge_create',
      businessObjectId: 'bo_service_ticket',
      dataAsset: { id: 'asset-1', name: '公共服务热线工单记录表' },
      semanticSource: { semanticId: 'sem_hotline_ticket', semanticRevision: 'S5' },
      implementation: bottomUpImplementation('asset-1', '公共服务热线工单记录表')
    });
    expect(result.ok).toBe(true);

    // 一次写入同时完成：绑定生效 + 任务闭环；返回路由保留（闭环后仍可按原路返回原上下文）
    const task = getState().taskContexts['task_edge_create'];
    expect(task?.status).toBe('COMPLETED');
    expect(task?.returnRoute).toBe('semantics_detail');
    expect(task?.dataAsset.id).toBe('asset-1');
    expect(task && before ? task.updatedAt >= before.updatedAt : false).toBe(true);

    // 幂等路径同样闭环任务（不重复建绑定）
    objectResolutionContexts.open({
      taskId: 'task_edge_idem',
      sourceType: 'DATA_ASSET',
      dataAsset: { id: 'asset-1', name: '公共服务热线工单记录表' },
      returnRoute: 'asset_detail'
    });
    const idempotent = dataSupportService.confirmBottomUpAlignment({
      taskId: 'task_edge_idem',
      businessObjectId: 'bo_service_ticket',
      dataAsset: { id: 'asset-1', name: '公共服务热线工单记录表' },
      implementation: bottomUpImplementation('asset-1', '公共服务热线工单记录表')
    });
    expect(idempotent.ok).toBe(true);
    if (idempotent.ok === true) {
      expect(idempotent.outcome).toBe('IDEMPOTENT_SUCCESS');
    }
    expect(getState().taskContexts['task_edge_idem']?.status).toBe('COMPLETED');
  });
});
