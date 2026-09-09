import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BusinessObjectRevalidationWorkspace } from '../../BusinessObjectRevalidationWorkspace';
import { BusinessObjectDetailWorkspace } from '../../BusinessObjectDetailWorkspace';
import {
  dataSupportService,
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

    const revisions = listRevisions('bo_person');
    expect(revisions[0].summary).toBe('数据支撑复核确认');
    expect(revisions[0].changes[0]).toContain('复核确认继续使用');

    // 队列清空 → 空状态
    expect(screen.getByText('没有待复核的数据支撑')).toBeInTheDocument();
  });

  it('重新绑定：切换到替代实现并恢复生效', () => {
    render(<BusinessObjectRevalidationWorkspace addToast={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /重新绑定/ }));
    // 替代实现来自同对象（人口基本信息表 / 常住人口统计表）
    fireEvent.click(screen.getByText('常住人口统计表'));
    fireEvent.click(screen.getByRole('button', { name: '确认重新绑定' }));

    const binding = dataSupportService.getBinding('bind_person_ext');
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.implementationId).toBe('impl_person_stat');
    expect(binding?.revalidation).toBeUndefined();

    const revisions = listRevisions('bo_person');
    expect(revisions[0].summary).toContain('重新绑定');
  });

  it('退休：绑定退出数据支撑，修订记录原因', () => {
    render(<BusinessObjectRevalidationWorkspace addToast={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '退休' }));

    const binding = dataSupportService.getBinding('bind_person_ext');
    expect(binding?.status).toBe('RETIRED');
    expect(binding?.revalidation).toBeUndefined();

    const revisions = listRevisions('bo_person');
    expect(revisions[0].summary).toBe('数据支撑退休');
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
