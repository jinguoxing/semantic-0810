import { beforeEach, describe, expect, it } from 'vitest';
import {
  businessObjectRepository,
  dataSupportService,
  resetDomainStateForTesting
} from '../../../../domain/business-object';
import {
  buildSupportResourceGroups,
  deriveImplementationRole,
  deriveRelatedDataRole,
  isFormalImplementationRole
} from '../resourceRole';

/**
 * 资源角色 View Model（V2.2 §8.4）：角色只从领域数据（Subject / Grain / Identity / Scope）推导，
 * 不按表名硬编码、不新增 Binding 生命周期状态。分类结果必须与种子领域数据对齐。
 */
describe('resourceRole · 展示层资源角色推导', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });

  it('服务事项：主数据表为正式数据实现，指南表为属性扩展，材料清单为相关数据（不计入正式实现数）', () => {
    const object = businessObjectRepository.get('bo_service_item')!;
    const master = dataSupportService.getImplementation('impl_item_master')!;
    const guide = dataSupportService.getImplementation('impl_item_guide')!;
    const material = dataSupportService.getImplementation('impl_item_material')!;

    expect(deriveImplementationRole(master, object)).toBe('DATA_IMPLEMENTATION');
    expect(deriveImplementationRole(guide, object)).toBe('ATTRIBUTE_EXTENSION');
    expect(deriveImplementationRole(material, object)).toBe('RELATED_DATA');

    const groups = buildSupportResourceGroups(
      object,
      dataSupportService.listCurrentBindings(object.id).map((binding) => ({
        implementation: dataSupportService.getImplementation(binding.implementationId)!,
        binding
      }))
    );
    // 材料清单表不进入「正式数据实现」计数
    expect(groups.formal.map((item) => item.name)).toEqual(['服务事项主数据表']);
    expect(groups.attributeExtensions.map((item) => item.name)).toEqual(['事项办理指南表']);
    expect(groups.relatedData.map((item) => item.name)).toContain('事项材料清单表');
  });

  it('自然人：基本信息与扩展信息均为正式数据实现（复核流程不受分组影响），统计表为分析相关', () => {
    const object = businessObjectRepository.get('bo_person')!;
    const base = dataSupportService.getImplementation('impl_person_base')!;
    const ext = dataSupportService.getImplementation('impl_person_ext')!;
    const stat = dataSupportService.getImplementation('impl_person_stat')!;

    expect(deriveImplementationRole(base, object)).toBe('DATA_IMPLEMENTATION');
    expect(deriveImplementationRole(ext, object)).toBe('DATA_IMPLEMENTATION');
    expect(deriveImplementationRole(stat, object)).toBe('ANALYTICAL_RELATED');

    const groups = buildSupportResourceGroups(
      object,
      dataSupportService.listCurrentBindings(object.id).map((binding) => ({
        implementation: dataSupportService.getImplementation(binding.implementationId)!,
        binding
      }))
    );
    // BO-7：人口扩展信息（NEEDS_REVALIDATION）仍是当前正式数据实现
    expect(groups.formal.map((item) => item.name)).toEqual(['人口基本信息表', '人口扩展信息']);
  });

  it('服务工单：当前视图为正式数据实现；定义声明的历史 / 汇总表归入相关数据分组', () => {
    const object = businessObjectRepository.get('bo_service_ticket')!;
    const view = dataSupportService.getImplementation('impl_st_curr_view')!;

    expect(deriveImplementationRole(view, object)).toBe('DATA_IMPLEMENTATION');

    const groups = buildSupportResourceGroups(
      object,
      dataSupportService.listCurrentBindings(object.id).map((binding) => ({
        implementation: dataSupportService.getImplementation(binding.implementationId)!,
        binding
      }))
    );
    expect(groups.formal.map((item) => item.name)).toEqual(['客服工单当前视图']);
    const relatedNames = groups.relatedData.map((item) => item.name);
    expect(relatedNames).toContain('工单状态历史表');
    expect(relatedNames).toContain('工单月度汇总表');
    // 历史表 / 汇总表的角色分类
    const history = groups.relatedData.find((item) => item.name === '工单状态历史表')!;
    expect(history.role).toBe('EVENT_HISTORY');
    const summaryTable = groups.relatedData.find((item) => item.name === '工单月度汇总表')!;
    expect(summaryTable.role).toBe('ANALYTICAL_RELATED');
  });

  it('客服坐席：排班记录表按定义声明的事件 / 历史角色归入 EVENT_HISTORY', () => {
    const object = businessObjectRepository.get('bo_customer_agent')!;
    const schedule = dataSupportService.getImplementation('impl_agent_schedule')!;

    expect(deriveImplementationRole(schedule, object)).toBe('EVENT_HISTORY');
  });

  it('relatedData 声明角色推导与正式实现口径', () => {
    const ticket = businessObjectRepository.get('bo_service_ticket')!;
    expect(deriveRelatedDataRole(ticket.relatedData[0])).toBe('EVENT_HISTORY');
    expect(deriveRelatedDataRole(ticket.relatedData[1])).toBe('ANALYTICAL_RELATED');

    expect(isFormalImplementationRole('DATA_IMPLEMENTATION')).toBe(true);
    expect(isFormalImplementationRole('ATTRIBUTE_EXTENSION')).toBe(false);
    expect(isFormalImplementationRole('RELATED_DATA')).toBe(false);
    expect(isFormalImplementationRole('EVENT_HISTORY')).toBe(false);
    expect(isFormalImplementationRole('ANALYTICAL_RELATED')).toBe(false);
  });
});
