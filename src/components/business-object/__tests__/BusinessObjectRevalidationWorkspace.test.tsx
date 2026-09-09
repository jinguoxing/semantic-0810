import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BusinessObjectRevalidationWorkspace } from '../../BusinessObjectRevalidationWorkspace';
import { BusinessObjectDetailWorkspace } from '../../BusinessObjectDetailWorkspace';
import {
  businessObjectRepository,
  dataSupportService,
  listDataSupportRevisions,
  listRevisions,
  resetDomainStateForTesting
} from '../../../domain/business-object';

describe('Binding Revalidation 工作区（PR-6）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  it('展示待复核绑定：复核原因 / 触发修订 / 受影响目标 来自领域种子', () => {
    render(<BusinessObjectRevalidationWorkspace addToast={vi.fn()} />);

    // 种子场景：自然人 · 人口扩展信息 待复核
    expect(screen.getByText('1 项待复核')).toBeInTheDocument();
    expect(screen.getAllByText('自然人').length).toBeGreaterThan(0);
    expect(screen.getAllByText('人口扩展信息').length).toBeGreaterThan(0);
    expect(screen.getByText(/常住状态.*业务口径/)).toBeInTheDocument();
    expect(screen.getByText('R2', { selector: '.font-mono' })).toBeInTheDocument();
    expect(screen.getByText('常住状态', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('户籍类型', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /确认继续使用/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重新绑定/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '退休' })).toBeInTheDocument();
  });

  it('确认继续使用：绑定恢复 EFFECTIVE，复核信息清空，修订可追溯', () => {
    render(<BusinessObjectRevalidationWorkspace addToast={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /确认继续使用/ }));

    const binding = dataSupportService.getBinding('bind_person_ext');
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.revalidation).toBeUndefined();
    expect(binding?.revision).toBe('R3');

    // 复核结论记录为数据支撑修订（REVALIDATION_KEEP），业务对象修订不受影响（Inv01 / Inv02）
    const dsRevisions = listDataSupportRevisions('bo_person');
    expect(dsRevisions[0].action).toBe('REVALIDATION_KEEP');
    expect(dsRevisions[0].reason).toContain('复核确认');
    expect(businessObjectRepository.get('bo_person')?.currentRevision).toBe('R2');
    expect(listRevisions('bo_person')).toHaveLength(2);

    // 队列清空 → 空状态
    expect(screen.getByText('没有待复核的数据支撑')).toBeInTheDocument();
  });

  it('重新绑定：切换到替代实现并恢复生效（已被占用的实现不作为替代项）', () => {
    // 领域准备：常住人口统计表当前已由 bind_person_stat 正式承载（EFFECTIVE），
    // 先退休该绑定释放实现，才能作为人口扩展信息的重新绑定目标
    dataSupportService.retireBinding('bind_person_stat', { reason: '测试准备：释放实现占用' });

    render(<BusinessObjectRevalidationWorkspace addToast={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /重新绑定/ }));
    // 替代实现来自同对象且未被其他在役绑定占用：人口基本信息表（bind_person_base 占用）不得出现
    expect(screen.queryByText('人口基本信息表')).toBeNull();
    fireEvent.click(screen.getByText('常住人口统计表'));
    fireEvent.click(screen.getByRole('button', { name: '确认重新绑定' }));

    const binding = dataSupportService.getBinding('bind_person_ext');
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.implementationId).toBe('impl_person_stat');
    expect(binding?.revalidation).toBeUndefined();

    // 重新绑定记录为数据支撑修订（REBIND），业务对象修订不受影响
    const dsRevisions = listDataSupportRevisions('bo_person');
    expect(dsRevisions[0].action).toBe('REBIND');
    expect(businessObjectRepository.get('bo_person')?.currentRevision).toBe('R2');
  });

  it('退休：绑定退出数据支撑，修订记录原因', () => {
    render(<BusinessObjectRevalidationWorkspace addToast={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '退休' }));

    const binding = dataSupportService.getBinding('bind_person_ext');
    expect(binding?.status).toBe('RETIRED');
    expect(binding?.revalidation).toBeUndefined();

    // 退休记录为数据支撑修订（RETIRE），业务对象修订不受影响
    const dsRevisions = listDataSupportRevisions('bo_person');
    expect(dsRevisions[0].action).toBe('RETIRE');
    expect(businessObjectRepository.get('bo_person')?.currentRevision).toBe('R2');
  });

  it('业务对象详情：存在待复核绑定时展示复核入口', () => {
    render(
      <BusinessObjectDetailWorkspace objectId="bo_person" initialTab="data_support" />
    );

    const entry = document.getElementById('btn-navigate-revalidation');
    expect(entry).not.toBeNull();
    expect(screen.getByText('1 项数据支撑待复核')).toBeInTheDocument();
  });

  it('业务对象详情：无待复核绑定时不出示复核入口', () => {
    render(
      <BusinessObjectDetailWorkspace objectId="bo_service_ticket" initialTab="data_support" />
    );

    expect(document.getElementById('btn-navigate-revalidation')).toBeNull();
  });
});
