import { beforeEach, describe, expect, it } from 'vitest';
import {
  businessObjectRepository,
  buildSeedState,
  dataSupportService,
  getState,
  groundingService,
  listDataSupportRevisions,
  listRevisions,
  loadStateForTesting,
  objectResolutionContexts,
  resetDomainStateForTesting
} from '../index';

describe('business object domain', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });

  it('seeds detail data per object without cross-contamination', () => {
    const ticket = businessObjectRepository.get('bo_service_ticket');
    const person = businessObjectRepository.get('bo_person');

    expect(ticket?.attributes.map((attribute) => attribute.name)).toContain('工单编号');
    expect(person?.attributes.map((attribute) => attribute.name)).toContain('身份标识');

    const ticketImplementations = dataSupportService.listImplementations('bo_service_ticket').map((implementation) => implementation.name);
    const personImplementations = dataSupportService.listImplementations('bo_person').map((implementation) => implementation.name);

    expect(ticketImplementations).toEqual(expect.arrayContaining(['客服工单当前视图', '公共服务热线工单记录表']));
    expect(ticketImplementations).not.toContain('人口基本信息表');
    expect(personImplementations).toEqual(expect.arrayContaining(['人口基本信息表', '人口扩展信息']));
    expect(personImplementations).not.toContain('客服工单当前视图');
  });

  it('searches objects by name, alias and domain', () => {
    expect(businessObjectRepository.search('自然人').map((object) => object.id)).toContain('bo_person');
    expect(businessObjectRepository.search('居民').map((object) => object.id)).toContain('bo_person');
    expect(businessObjectRepository.search('人口服务').map((object) => object.id)).toContain('bo_person');
    expect(businessObjectRepository.search('不存在的东西')).toHaveLength(0);
  });

  it('confirms the selected top-down candidate to EFFECTIVE without touching business object revisions', () => {
    const before = dataSupportService.listBindings('bo_service_ticket');
    const hotline = before.find((binding) => binding.implementationId === 'impl_st_hotline');
    expect(hotline?.status).toBe('CANDIDATE');

    const result = dataSupportService.confirmCandidate(hotline!.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const after = dataSupportService.listBindings('bo_service_ticket');
    const confirmed = after.find((binding) => binding.implementationId === 'impl_st_hotline');
    const primary = after.find((binding) => binding.implementationId === 'impl_st_curr_view');
    expect(confirmed?.status).toBe('EFFECTIVE');
    expect(confirmed?.role).toBe('SECONDARY');
    // 只提升被确认绑定的修订号，其他绑定不受影响
    expect(confirmed?.revision).toBe('R2');
    expect(primary?.status).toBe('EFFECTIVE');
    expect(primary?.role).toBe('PRIMARY');
    expect(primary?.revision).toBe('R1');

    // 刷新后状态仍保持：从 localStorage 恢复（V3 schema）
    const reloaded = loadStateForTesting();
    expect(reloaded?.version).toBe(3);
    expect(reloaded?.bindings['bind_st_hotline'].status).toBe('EFFECTIVE');
    expect(reloaded?.bindings['bind_st_curr_view'].role).toBe('PRIMARY');

    // 数据支撑修订记录了 TOP_DOWN_CONFIRM，业务对象修订与 currentRevision 不变
    const supportRevisions = listDataSupportRevisions('bo_service_ticket');
    expect(supportRevisions[0].action).toBe('TOP_DOWN_CONFIRM');
    expect(supportRevisions[0].beforeStatus).toBe('CANDIDATE');
    expect(supportRevisions[0].afterStatus).toBe('EFFECTIVE');
    expect(listRevisions('bo_service_ticket').map((revision) => revision.revision)).toEqual(['R1']);
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
  });

  it('raises and resolves revalidation on bindings', () => {
    const binding = dataSupportService.listBindings('bo_service_ticket').find((b) => b.implementationId === 'impl_st_curr_view');

    dataSupportService.markNeedsRevalidation(binding!.id, {
      reason: 'Data Semantics Revision changed',
      sourceRevision: 'S5',
      affectedTargets: ['办结时间']
    });
    expect(dataSupportService.getBinding(binding!.id)?.status).toBe('NEEDS_REVALIDATION');
    expect(dataSupportService.getBinding(binding!.id)?.revalidation?.sourceRevision).toBe('S5');

    const keep = dataSupportService.confirmRevalidation(binding!.id);
    expect(keep.ok).toBe(true);
    expect(dataSupportService.getBinding(binding!.id)?.status).toBe('EFFECTIVE');
    expect(dataSupportService.getBinding(binding!.id)?.revalidation).toBeUndefined();
    expect(listDataSupportRevisions('bo_service_ticket')[0].action).toBe('REVALIDATION_KEEP');
  });

  it('applies attribute grounding correction and archives previous revisions', () => {
    const binding = dataSupportService.listBindings('bo_service_ticket').find((b) => b.implementationId === 'impl_st_curr_view');
    const result = groundingService.applyCorrection({
      bindingId: binding!.id,
      type: 'ATTRIBUTE',
      targetName: '办结时间',
      fromField: 'finished_time',
      toField: 'close_time',
      reason: '语义修订：finished_time 表示最后更新时间',
      evidence: ['ev_st_identity']
    });
    expect(result.ok).toBe(true);

    const implementation = dataSupportService.getImplementation('impl_st_curr_view');
    const attribute = implementation?.attributes.find((a) => a.attributeName === '办结时间');
    expect(attribute?.field).toBe('close_time');
    expect(attribute?.needsCorrection).toBeFalsy();

    const revisions = groundingService.listRevisions(binding!.id);
    expect(revisions).toHaveLength(1);
    expect(revisions[0].type).toBe('ATTRIBUTE');
    expect(revisions[0].status).toBe('ACTIVE');
    expect(revisions[0].before.field).toBe('finished_time');
    expect(revisions[0].after.field).toBe('close_time');

    // Grounding 修正只产生 GroundingRevision，业务对象修订不受影响
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
  });

  it('applies relationship grounding correction within the identity-compatible candidate set', () => {
    const binding = dataSupportService.listBindings('bo_service_ticket').find((b) => b.implementationId === 'impl_st_curr_view');
    const result = groundingService.applyCorrection({
      bindingId: binding!.id,
      type: 'RELATIONSHIP',
      targetName: '申请人',
      targetObjectId: 'bo_person',
      fromField: 'applicant_id',
      toField: 'person_id',
      reason: '发现字段错误：申请人应通过自然人标识字段关联',
      evidence: []
    });
    expect(result.ok).toBe(true);

    const implementation = dataSupportService.getImplementation('impl_st_curr_view');
    const relationship = implementation?.relationships.find((r) => r.relationName === '申请人');
    expect(relationship?.sourceField).toBe('客服工单当前视图 · person_id');

    const revisions = groundingService.listRevisions(binding!.id);
    expect(revisions[0].type).toBe('RELATIONSHIP');
  });

  it('records object revisions on publish and definition updates', () => {
    businessObjectRepository.updateDefinition('bo_service_ticket', { definition: '更新后的定义' }, { summary: '定义修订' });
    expect(businessObjectRepository.get('bo_service_ticket')?.definition).toBe('更新后的定义');

    businessObjectRepository.publish('bo_service_ticket', { summary: '正式发布' });
    const published = businessObjectRepository.get('bo_service_ticket');
    expect(published?.status).toBe('PUBLISHED');

    const revisions = listRevisions('bo_service_ticket');
    expect(revisions.length).toBeGreaterThanOrEqual(3);
    expect(revisions[0].status).toBe('ACTIVE');
    expect(revisions[1].status).toBe('HISTORY');
    // 每条修订都带完整定义快照
    expect(revisions[0].snapshot.definition).toBe('更新后的定义');
  });

  it('manages resolution task contexts through the status machine', () => {
    objectResolutionContexts.open({
      taskId: 'task_1',
      sourceType: 'DATA_ASSET',
      dataAsset: { id: 'asset-1', name: '公共服务热线工单记录表', techName: 'hotline_db.service.pop_service_hotline' },
      returnRoute: 'asset_detail'
    });
    expect(objectResolutionContexts.get('task_1')?.returnRoute).toBe('asset_detail');
    expect(objectResolutionContexts.get('task_1')?.sourceType).toBe('DATA_ASSET');
    expect(objectResolutionContexts.get('task_1')?.dataAsset.id).toBe('asset-1');
    expect(objectResolutionContexts.get('task_1')?.status).toBe('OPEN');

    // 稍后处理：保留上下文，不清除
    objectResolutionContexts.postpone('task_1');
    expect(objectResolutionContexts.get('task_1')?.status).toBe('POSTPONED');
    expect(objectResolutionContexts.getActive('task_1')).toBeDefined();

    // 确认完成：保留历史，不再活跃
    objectResolutionContexts.complete('task_1');
    expect(objectResolutionContexts.get('task_1')?.status).toBe('COMPLETED');
    expect(objectResolutionContexts.getActive('task_1')).toBeUndefined();

    // 本轮不建立：CANCELLED 同样保留历史；语义入口保留 semanticSource（仅证据）
    objectResolutionContexts.open({
      taskId: 'task_2',
      sourceType: 'DATA_SEMANTICS',
      dataAsset: { id: 'asset-1', name: '公共服务热线工单记录表' },
      semanticSource: { semanticId: 'sem_hotline_ticket', semanticRevision: 'S5' },
      returnRoute: 'semantics_detail'
    });
    expect(objectResolutionContexts.get('task_2')?.semanticSource?.semanticId).toBe('sem_hotline_ticket');
    objectResolutionContexts.cancel('task_2');
    expect(objectResolutionContexts.get('task_2')?.status).toBe('CANCELLED');
    expect(Object.keys(getState().taskContexts).sort()).toEqual(['task_1', 'task_2']);
  });

  it('migrates a persisted V2 state to V3 with canonical asset identity and read-only warnings', () => {
    // 旧版 V2：taskContexts 扁平来源字段 + 旧实现 assetId
    const legacyV2 = {
      ...buildSeedState(),
      version: 2 as const,
      implementations: {
        impl_st_hotline: { ...getState().implementations['impl_st_hotline'], assetId: 'res-02' }
      },
      taskContexts: {
        task_legacy_asset: {
          taskId: 'task_legacy_asset',
          sourceType: 'DATA_ASSET',
          sourceId: 'res-02',
          sourceName: '公共服务热线工单记录表',
          sourceRevision: 'v1.0',
          returnRoute: 'asset_detail',
          createdAt: '2026-08-01T00:00:00.000Z',
          status: 'OPEN',
          updatedAt: '2026-08-01T00:00:00.000Z'
        },
        task_legacy_sem: {
          taskId: 'task_legacy_sem',
          sourceType: 'DATA_SEMANTICS',
          sourceId: 'sem_hotline_ticket',
          sourceName: '公共服务热线工单记录表',
          sourceRevision: 'S5',
          returnRoute: 'semantics_detail',
          createdAt: '2026-08-01T00:00:00.000Z',
          status: 'OPEN',
          updatedAt: '2026-08-01T00:00:00.000Z'
        },
        task_legacy_unknown: {
          taskId: 'task_legacy_unknown',
          sourceType: 'DATA_ASSET',
          sourceId: 'res-99',
          sourceName: '未知旧资产',
          sourceRevision: 'v0.9',
          returnRoute: 'asset_detail',
          createdAt: '2026-08-01T00:00:00.000Z',
          status: 'OPEN',
          updatedAt: '2026-08-01T00:00:00.000Z'
        }
      }
    };
    window.localStorage.setItem('semovix_business_object_state_v1', JSON.stringify(legacyV2));

    const migrated = loadStateForTesting();
    expect(migrated?.version).toBe(3);
    // 旧 res-02 实现归一到统一目录 asset-1
    expect(migrated?.implementations['impl_st_hotline'].assetId).toBe('asset-1');
    // DATA_ASSET 旧上下文：dataAsset 规范化，无 semanticSource
    expect(migrated?.taskContexts['task_legacy_asset'].dataAsset.id).toBe('asset-1');
    expect(migrated?.taskContexts['task_legacy_asset'].semanticSource).toBeUndefined();
    expect(migrated?.taskContexts['task_legacy_asset'].migrationWarning).toBeUndefined();
    // DATA_SEMANTICS 旧上下文：semanticId 只进 semanticSource，不冒充资产身份
    expect(migrated?.taskContexts['task_legacy_sem'].dataAsset.id).toBe('asset-1');
    expect(migrated?.taskContexts['task_legacy_sem'].semanticSource).toEqual({
      semanticId: 'sem_hotline_ticket',
      semanticRevision: 'S5'
    });
    // 无法解析的旧来源：兼容引用 + migrationWarning（只读，不再产生正式绑定）
    expect(migrated?.taskContexts['task_legacy_unknown'].dataAsset.id).toBe('res-99');
    expect(migrated?.taskContexts['task_legacy_unknown'].migrationWarning).toBeTruthy();
    // 迁移后状态已回写为 V3
    const repersisted = JSON.parse(window.localStorage.getItem('semovix_business_object_state_v1') ?? '{}');
    expect(repersisted.version).toBe(3);
  });

  it('builds a version 3 seed state with drafts and data support revisions collections', () => {
    const seed = buildSeedState();
    expect(seed.version).toBe(3);
    expect(seed.drafts).toEqual({});
    expect(seed.dataSupportRevisions).toEqual({});
    // 自然人 currentRevision 与待复核绑定的 sourceRevision 一致
    expect(seed.objects['bo_person'].currentRevision).toBe('R2');
    expect(seed.bindings['bind_person_ext'].revalidation?.sourceRevision).toBe('R2');
    expect(listRevisions('bo_person').map((revision) => revision.revision)).toEqual(['R2', 'R1']);
  });
});
