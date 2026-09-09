import { beforeEach, describe, expect, it } from 'vitest';
import {
  businessObjectRepository,
  buildSeedState,
  dataSupportService,
  getState,
  groundingService,
  loadStateForTesting,
  objectResolutionContexts,
  resetDomainStateForTesting,
  listRevisions
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

  it('confirms top-down candidates to EFFECTIVE with revision bump and persistence', () => {
    const before = dataSupportService.listBindings('bo_service_ticket');
    const hotline = before.find((binding) => binding.implementationId === 'impl_st_hotline');
    expect(hotline?.status).toBe('CANDIDATE');

    const result = dataSupportService.confirmCandidate('bo_service_ticket');
    expect(result).toBeDefined();

    const after = dataSupportService.listBindings('bo_service_ticket');
    const confirmed = after.find((binding) => binding.implementationId === 'impl_st_hotline');
    const primary = after.find((binding) => binding.implementationId === 'impl_st_curr_view');
    expect(confirmed?.status).toBe('EFFECTIVE');
    expect(confirmed?.role).toBe('SECONDARY');
    expect(primary?.status).toBe('EFFECTIVE');
    expect(primary?.role).toBe('PRIMARY');
    expect(after.every((binding) => binding.revision === 'R2')).toBe(true);

    // 刷新后状态仍保持：从 localStorage 恢复
    const reloaded = loadStateForTesting();
    expect(reloaded?.bindings['bind_st_hotline'].status).toBe('EFFECTIVE');
    expect(reloaded?.bindings['bind_st_curr_view'].role).toBe('PRIMARY');

    // 修订历史已记录
    const revisions = listRevisions('bo_service_ticket');
    expect(revisions[0].summary).toContain('确认数据支撑');
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
  });

  it('raises and resolves revalidation on bindings', () => {
    dataSupportService.confirmCandidate('bo_service_ticket');
    const binding = dataSupportService.listBindings('bo_service_ticket').find((b) => b.implementationId === 'impl_st_curr_view');

    dataSupportService.markNeedsRevalidation(binding!.id, {
      reason: 'Data Semantics Revision changed',
      sourceRevision: 'S5',
      affectedTargets: ['办结时间']
    });
    expect(dataSupportService.getBinding(binding!.id)?.status).toBe('NEEDS_REVALIDATION');
    expect(dataSupportService.getBinding(binding!.id)?.revalidation?.sourceRevision).toBe('S5');

    dataSupportService.confirmRevalidation(binding!.id);
    expect(dataSupportService.getBinding(binding!.id)?.status).toBe('EFFECTIVE');
    expect(dataSupportService.getBinding(binding!.id)?.revalidation).toBeUndefined();
  });

  it('applies attribute grounding correction and archives previous revisions', () => {
    const binding = dataSupportService.listBindings('bo_service_ticket').find((b) => b.implementationId === 'impl_st_curr_view');
    groundingService.applyCorrection({
      bindingId: binding!.id,
      targetName: '办结时间',
      fromField: 'finished_time',
      toField: 'close_time',
      reason: '语义修订：finished_time 表示最后更新时间',
      evidence: ['ev_st_identity']
    });

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
  });

  it('applies relationship grounding correction', () => {
    const binding = dataSupportService.listBindings('bo_service_ticket').find((b) => b.implementationId === 'impl_st_curr_view');
    groundingService.applyCorrection({
      bindingId: binding!.id,
      targetName: '承办部门 → 组织机构',
      fromField: 'handle_dept_code',
      toField: 'dept_id',
      reason: '发现字段错误：承办部门应通过 dept_id 关联组织机构',
      evidence: []
    });

    const implementation = dataSupportService.getImplementation('impl_st_curr_view');
    const relationship = implementation?.relationships.find((r) => r.relationName === '承办部门');
    expect(relationship?.sourceField).toContain('dept_id');
    expect(relationship?.sourceField).not.toContain('handle_dept_code');

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
    expect(revisions.length).toBeGreaterThanOrEqual(2);
    expect(revisions[0].status).toBe('ACTIVE');
    expect(revisions[1].status).toBe('HISTORY');
  });

  it('opens, reads and clears resolution task contexts', () => {
    objectResolutionContexts.open({
      taskId: 'task_1',
      sourceType: 'DATA_ASSET',
      sourceId: 'res-02',
      sourceName: '公共服务热线工单记录表',
      sourceRevision: 'v3.2',
      returnRoute: 'asset_detail'
    });
    expect(objectResolutionContexts.get('task_1')?.returnRoute).toBe('asset_detail');
    expect(objectResolutionContexts.get('task_1')?.sourceType).toBe('DATA_ASSET');

    objectResolutionContexts.clear('task_1');
    expect(objectResolutionContexts.get('task_1')).toBeUndefined();
    expect(getState().taskContexts).toEqual({});
  });
});
