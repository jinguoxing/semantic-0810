/**
 * V2.2 生命周期硬化不变量（Inv01 – Inv08 领域侧收口）
 *
 * 八项不变量验收：
 * 1. 数据支撑动作全集不产生业务对象修订（Inv01 / Inv02）
 * 2. Grounding 修正不产生业务对象修订（Inv01 / Inv03）
 * 3. Registry 摘要与 Detail 正式选择器读同一 Store
 * 4. CANDIDATE / RETIRED 不得进入正式数据支撑选择器（Inv05）
 * 5. 一次确认只影响一条绑定
 * 6. 同一数据实现最多一条活跃绑定
 * 7. 唯一 PRIMARY 绑定不可直接退休
 * 8. 关系落地修正只接受目标对象身份兼容字段（Inv08）
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  businessObjectRepository,
  dataSupportService,
  dataSupportSummary,
  getState,
  groundingService,
  listDataSupportRevisions,
  listRevisions,
  resetDomainStateForTesting
} from '../index';

describe('business object lifecycle invariants (V2.2)', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });

  it('数据支撑动作全集只写 DataSupportRevision，业务对象修订与 currentRevision 不变（Inv01 / Inv02）', () => {
    // —— bo_service_ticket：TOP_DOWN_CONFIRM / BOTTOM_UP_ALIGN / MARK_REVALIDATION / REVALIDATION_KEEP
    const confirm = dataSupportService.confirmCandidate('bind_st_hotline');
    expect(confirm.ok).toBe(true);

    const align = dataSupportService.confirmBottomUpAlignment({
      businessObjectId: 'bo_service_ticket',
      dataAsset: { id: 'res-99', name: '网格流转工单表' },
      implementation: {
        name: '网格流转工单表',
        techName: 'res-99',
        warehouseTable: 'res-99',
        assetId: 'res-99',
        scope: '网格流转工单',
        granularity: '一行一张工单',
        identity: '（对齐后完善）',
        scopeRelationText: '自下而上对齐（Bottom-up Resolution 登记）',
        scopeRelationNote: '由 Bottom-up Resolution 确认的数据实现。',
        attributes: [],
        relationships: []
      }
    });
    expect(align.ok).toBe(true);

    dataSupportService.markNeedsRevalidation('bind_st_hotline', {
      reason: '语义修订：诉求类型口径调整',
      sourceRevision: 'S6',
      affectedTargets: ['诉求类型']
    });
    const keep = dataSupportService.confirmRevalidation('bind_st_hotline');
    expect(keep.ok).toBe(true);

    const ticketActions = listDataSupportRevisions('bo_service_ticket').map((revision) => revision.action);
    expect(ticketActions).toEqual(
      expect.arrayContaining(['TOP_DOWN_CONFIRM', 'BOTTOM_UP_ALIGN', 'MARK_REVALIDATION', 'REVALIDATION_KEEP'])
    );

    // —— bo_person：REBIND / SET_PRIMARY / RETIRE
    const retireStat = dataSupportService.retireBinding('bind_person_stat', { reason: '释放实现占用' });
    expect(retireStat.ok).toBe(true);
    const rebind = dataSupportService.rebind('bind_person_ext', 'impl_person_stat', { reason: '口径一致' });
    expect(rebind.ok).toBe(true);
    const setPrimary = dataSupportService.setPrimary('bind_person_ext', { reason: '切换主要数据实现' });
    expect(setPrimary.ok).toBe(true);

    const personActions = listDataSupportRevisions('bo_person').map((revision) => revision.action);
    expect(personActions).toEqual(expect.arrayContaining(['RETIRE', 'REBIND', 'SET_PRIMARY']));

    // Inv01 / Inv02：七类数据支撑动作之后，两个对象的正式修订与 currentRevision 均不变
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
    expect(listRevisions('bo_service_ticket').map((revision) => revision.revision)).toEqual(['R1']);
    expect(businessObjectRepository.get('bo_person')?.currentRevision).toBe('R2');
    expect(listRevisions('bo_person').map((revision) => revision.revision)).toEqual(['R2', 'R1']);
  });

  it('Grounding 修正（属性 / 关系）只写 GroundingRevision，业务对象修订不变（Inv01 / Inv03）', () => {
    const attribute = groundingService.applyCorrection({
      bindingId: 'bind_st_curr_view',
      type: 'ATTRIBUTE',
      targetName: '办结时间',
      fromField: 'finished_time',
      toField: 'close_time',
      reason: '语义修订：finished_time 表示最后更新时间',
      evidence: []
    });
    expect(attribute.ok).toBe(true);

    const relationship = groundingService.applyCorrection({
      bindingId: 'bind_st_curr_view',
      type: 'RELATIONSHIP',
      targetName: '申请人',
      targetObjectId: 'bo_person',
      fromField: 'applicant_id',
      toField: 'person_id',
      reason: '主身份字段口径不一致，修正为自然人标识',
      evidence: []
    });
    expect(relationship.ok).toBe(true);

    const groundingRevisions = groundingService.listByObject('bo_service_ticket');
    expect(groundingRevisions.map((revision) => revision.type).sort()).toEqual(['ATTRIBUTE', 'RELATIONSHIP']);
    // Grounding 修正不产生业务对象修订，也不产生数据支撑修订
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
    expect(listRevisions('bo_service_ticket').map((revision) => revision.revision)).toEqual(['R1']);
    expect(listDataSupportRevisions('bo_service_ticket')).toHaveLength(0);
  });

  it('Registry 摘要与 Detail 正式选择器读同一 Store，确认后两侧同步变化', () => {
    // 全量对象：列表摘要与详情选择器口径一致（同一 Store，无第二事实源）
    for (const object of businessObjectRepository.list()) {
      const current = dataSupportService.listCurrentBindings(object.id);
      const summary = dataSupportSummary(object.id);
      expect(summary.count).toBe(current.length);
      expect(summary.hasImplementation).toBe(current.length > 0);
    }

    // 种子态：服务工单仅 1 项正式支撑（热线为 CANDIDATE，不计入）
    const before = dataSupportSummary('bo_service_ticket');
    expect(before.count).toBe(1);
    expect(before.mainAsset).toBe('客服工单当前视图');

    // 领域写入一次，Registry 摘要与 Detail 选择器同时反映
    const confirm = dataSupportService.confirmCandidate('bind_st_hotline');
    expect(confirm.ok).toBe(true);

    const afterSummary = dataSupportSummary('bo_service_ticket');
    const afterDetail = dataSupportService.listCurrentBindings('bo_service_ticket');
    expect(afterSummary.count).toBe(afterDetail.length);
    expect(afterSummary.count).toBe(2);
    expect(afterDetail.map((binding) => binding.implementationId)).toContain('impl_st_hotline');

    // 事实源唯一：两个读法背后是同一份绑定状态
    expect(afterSummary.count).toBe(
      Object.values(getState().bindings).filter(
        (binding) =>
          binding.businessObjectId === 'bo_service_ticket' &&
          (binding.status === 'EFFECTIVE' || binding.status === 'NEEDS_REVALIDATION')
      ).length
    );
  });

  it('正式数据支撑选择器只含 EFFECTIVE / NEEDS_REVALIDATION，CANDIDATE / RETIRED 不进入（Inv05）', () => {
    const current = dataSupportService.listCurrentBindings('bo_service_ticket');
    const candidates = dataSupportService.listCandidateBindings('bo_service_ticket');
    expect(current.map((binding) => binding.id)).toEqual(['bind_st_curr_view']);
    expect(candidates.map((binding) => binding.id)).toEqual(['bind_st_hotline']);
    // 两个选择器不相交
    expect(current.filter((binding) => candidates.some((candidate) => candidate.id === binding.id))).toHaveLength(0);

    // 确认后：候选进入正式选择器，候选选择器清空
    const confirm = dataSupportService.confirmCandidate('bind_st_hotline');
    expect(confirm.ok).toBe(true);
    expect(dataSupportService.listCandidateBindings('bo_service_ticket')).toHaveLength(0);
    expect(dataSupportService.listCurrentBindings('bo_service_ticket').map((binding) => binding.id).sort()).toEqual(
      ['bind_st_curr_view', 'bind_st_hotline'].sort()
    );

    // 退休后：退出正式选择器，只出现在历史选择器
    const retire = dataSupportService.retireBinding('bind_st_hotline', { reason: '口径不满足' });
    expect(retire.ok).toBe(true);
    expect(dataSupportService.listCurrentBindings('bo_service_ticket').map((binding) => binding.id)).toEqual([
      'bind_st_curr_view'
    ]);
    expect(dataSupportService.listRetiredBindings('bo_service_ticket').map((binding) => binding.id)).toEqual([
      'bind_st_hotline'
    ]);

    // 种子中的 RETIRED 绑定（历史交易订单）从不进入正式选择器
    expect(dataSupportService.listCurrentBindings('bo_order').some((binding) => binding.id === 'bind_order_flow')).toBe(
      false
    );
    expect(dataSupportService.listRetiredBindings('bo_order').map((binding) => binding.id)).toEqual(['bind_order_flow']);
  });

  it('一次确认只影响一条绑定：仅被确认绑定修订号 +1，其余绑定与其他对象不受牵连', () => {
    const result = dataSupportService.confirmCandidate('bind_st_hotline');
    expect(result.ok).toBe(true);

    // 被确认绑定：R1 → R2；同对象主要绑定保持 R1 / EFFECTIVE / PRIMARY
    const hotline = dataSupportService.getBinding('bind_st_hotline');
    const primary = dataSupportService.getBinding('bind_st_curr_view');
    expect(hotline?.revision).toBe('R2');
    expect(primary?.revision).toBe('R1');
    expect(primary?.status).toBe('EFFECTIVE');
    expect(primary?.role).toBe('PRIMARY');

    // 只记录一条 TOP_DOWN_CONFIRM，且指向被确认绑定
    const confirms = listDataSupportRevisions('bo_service_ticket').filter(
      (revision) => revision.action === 'TOP_DOWN_CONFIRM'
    );
    expect(confirms).toHaveLength(1);
    expect(confirms[0].bindingId).toBe('bind_st_hotline');

    // 其他对象的绑定完全不受影响
    expect(dataSupportService.getBinding('bind_person_base')?.revision).toBe('R1');
    expect(dataSupportService.getBinding('bind_person_ext')?.revision).toBe('R2');
    expect(listDataSupportRevisions('bo_person')).toHaveLength(0);
  });

  it('同一数据实现最多一条活跃绑定：换绑占用实现被拒绝，跨对象对齐冲突被拒绝', () => {
    // 换绑到已被 bind_person_base（EFFECTIVE）占用的实现 → IMPLEMENTATION_IN_USE，零写入
    const occupied = dataSupportService.rebind('bind_person_ext', 'impl_person_base', { reason: '尝试占用' });
    expect(occupied.ok).toBe(false);
    if (occupied.ok === false) {
      expect(occupied.error).toBe('IMPLEMENTATION_IN_USE');
    }
    expect(dataSupportService.getBinding('bind_person_ext')?.implementationId).toBe('impl_person_ext');
    expect(dataSupportService.getBinding('bind_person_ext')?.revision).toBe('R2');

    // 换绑到自身 → SAME_IMPLEMENTATION
    const same = dataSupportService.rebind('bind_person_ext', 'impl_person_ext');
    expect(same.ok).toBe(false);
    if (same.ok === false) {
      expect(same.error).toBe('SAME_IMPLEMENTATION');
    }

    // 不存在的实现 → IMPLEMENTATION_NOT_FOUND
    const missing = dataSupportService.rebind('bind_person_ext', 'impl_not_exist');
    expect(missing.ok).toBe(false);
    if (missing.ok === false) {
      expect(missing.error).toBe('IMPLEMENTATION_NOT_FOUND');
    }

    // Bottom-up：res-01 已 EFFECTIVE 承载「服务工单」，对齐到「自然人」→ BINDING_CONFLICT，零写入
    const conflict = dataSupportService.confirmBottomUpAlignment({
      businessObjectId: 'bo_person',
      dataAsset: { id: 'res-01', name: '客服工单当前视图' },
      implementation: {
        name: '客服工单当前视图',
        techName: 'res-01',
        warehouseTable: 'res-01',
        assetId: 'res-01',
        scope: '客服业务当前工单',
        granularity: '一行一张服务工单',
        identity: '工单编号 · ticket_id',
        scopeRelationText: '自下而上对齐',
        scopeRelationNote: '冲突测试',
        attributes: [],
        relationships: []
      }
    });
    expect(conflict.ok).toBe(false);
    if (conflict.ok === false) {
      expect(conflict.error).toBe('BINDING_CONFLICT');
      expect(conflict.conflictObjectName).toBe('服务工单');
    }
    expect(
      dataSupportService.listImplementations('bo_person').some((impl) => impl.assetId === 'res-01')
    ).toBe(false);

    // 同资产已承载本对象 → 幂等成功，不新建第二条绑定
    const idempotent = dataSupportService.confirmBottomUpAlignment({
      businessObjectId: 'bo_service_ticket',
      dataAsset: { id: 'res-01', name: '客服工单当前视图' },
      implementation: {
        name: '客服工单当前视图',
        techName: 'res-01',
        warehouseTable: 'res-01',
        assetId: 'res-01',
        scope: '客服业务当前工单',
        granularity: '一行一张服务工单',
        identity: '工单编号 · ticket_id',
        scopeRelationText: '自下而上对齐',
        scopeRelationNote: '幂等测试',
        attributes: [],
        relationships: []
      }
    });
    expect(idempotent.ok).toBe(true);
    if (idempotent.ok) {
      expect(idempotent.outcome).toBe('IDEMPOTENT_SUCCESS');
    }
    expect(
      dataSupportService
        .listBindings('bo_service_ticket')
        .filter((binding) => binding.implementationId === 'impl_st_curr_view')
    ).toHaveLength(1);

    // 三次拒绝均零写入：无任何数据支撑修订产生
    expect(listDataSupportRevisions('bo_person')).toHaveLength(0);
  });

  it('唯一 PRIMARY 绑定不可直接退休：须先 SET_PRIMARY 确认新的主要数据实现', () => {
    // 服务工单当前仅有主要实现 → 直接退休被拒绝，零写入
    const blocked = dataSupportService.retireBinding('bind_st_curr_view', { reason: '尝试直接退休主实现' });
    expect(blocked.ok).toBe(false);
    if (blocked.ok === false) {
      expect(blocked.error).toBe('IS_PRIMARY');
    }
    expect(dataSupportService.getBinding('bind_st_curr_view')?.status).toBe('EFFECTIVE');
    expect(dataSupportService.getBinding('bind_st_curr_view')?.role).toBe('PRIMARY');
    expect(listDataSupportRevisions('bo_service_ticket')).toHaveLength(0);

    // 正确路径：确认候选 → 切主 → 原主要实现降级后方可退休
    const confirm = dataSupportService.confirmCandidate('bind_st_hotline');
    expect(confirm.ok).toBe(true);
    const promote = dataSupportService.setPrimary('bind_st_hotline', { reason: '热线数据更完整' });
    expect(promote.ok).toBe(true);
    expect(dataSupportService.getBinding('bind_st_hotline')?.role).toBe('PRIMARY');
    expect(dataSupportService.getBinding('bind_st_curr_view')?.role).toBe('SECONDARY');

    const retire = dataSupportService.retireBinding('bind_st_curr_view', { reason: '被热线实现替代' });
    expect(retire.ok).toBe(true);
    expect(dataSupportService.getBinding('bind_st_curr_view')?.status).toBe('RETIRED');
    // 对象始终保有主要数据实现
    expect(dataSupportService.getBinding('bind_st_hotline')?.role).toBe('PRIMARY');
    expect(dataSupportService.getBinding('bind_st_hotline')?.status).toBe('EFFECTIVE');
  });

  it('关系落地修正只接受目标对象身份兼容字段，业务错误字段被拒绝且零写入（Inv08）', () => {
    const correctionBase = {
      bindingId: 'bind_st_curr_view',
      type: 'RELATIONSHIP' as const,
      targetName: '申请人',
      fromField: 'applicant_id',
      reason: '主身份字段口径不一致',
      evidence: []
    };

    // 其他关系目标的字段（承办部门 → bo_org）不得作为「申请人 → 自然人」的候选
    const wrongTarget = groundingService.applyCorrection({ ...correctionBase, targetObjectId: 'bo_person', toField: 'handle_dept_id' });
    expect(wrongTarget.ok).toBe(false);
    if (wrongTarget.ok === false) {
      expect(wrongTarget.error).toBe('CANDIDATE_NOT_ALLOWED');
    }

    // 工单自身字段（ticket_id）不是身份兼容候选
    const selfField = groundingService.applyCorrection({ ...correctionBase, targetObjectId: 'bo_person', toField: 'ticket_id' });
    expect(selfField.ok).toBe(false);
    if (selfField.ok === false) {
      expect(selfField.error).toBe('CANDIDATE_NOT_ALLOWED');
    }

    // 缺失 targetObjectId（禁止用 targetName 字符串判断类型/目标）
    const noTarget = groundingService.applyCorrection({ ...correctionBase, toField: 'person_id' });
    expect(noTarget.ok).toBe(false);
    if (noTarget.ok === false) {
      expect(noTarget.error).toBe('TARGET_NOT_FOUND');
    }

    // 三次拒绝均零写入：落地字段未变，无 GroundingRevision
    const implementation = dataSupportService.getImplementation('impl_st_curr_view');
    expect(implementation?.relationships[0].sourceField).toBe('客服工单当前视图 · applicant_id');
    expect(groundingService.listRevisions('bind_st_curr_view')).toHaveLength(0);

    // 身份兼容字段（person_id）通过，落地字段更新为「实现名 · 字段」完整形式
    const valid = groundingService.applyCorrection({ ...correctionBase, targetObjectId: 'bo_person', toField: 'person_id' });
    expect(valid.ok).toBe(true);
    expect(dataSupportService.getImplementation('impl_st_curr_view')?.relationships[0].sourceField).toBe(
      '客服工单当前视图 · person_id'
    );
  });
});
