import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BusinessObjectResolutionWorkspace } from '../../BusinessObjectResolutionWorkspace';
import { DataSemanticsDetailView } from '../../DataSemanticsDetailView';
import {
  dataSupportService,
  listRevisions,
  objectResolutionContexts,
  resetDomainStateForTesting
} from '../../../domain/business-object';

describe('Bottom-up Resolution 闭环（PR-4）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  it('数据语义详情提供「形成业务对象」入口，携带来源上下文', () => {
    const onForm = vi.fn();
    render(<DataSemanticsDetailView onFormBusinessObject={onForm} />);

    fireEvent.click(screen.getByText('形成业务对象'));
    expect(onForm).toHaveBeenCalledWith({
      id: 'sem_hotline_ticket',
      name: '公共服务热线工单记录表',
      revision: 'S5'
    });
  });

  it('对齐确认：登记候选数据支撑 + 记录修订 + 通知 App 按上下文返回', async () => {
    // 入口登记（App 层 openResolutionContext 的领域侧等价物）
    objectResolutionContexts.open({
      taskId: 'task_form_sem_hotline_ticket',
      sourceType: 'DATA_SEMANTICS',
      sourceId: 'sem_hotline_ticket',
      sourceName: '公共服务热线工单记录表',
      sourceRevision: 'S5',
      returnRoute: 'semantics_detail'
    });

    const onConfirmResolution = vi.fn();
    render(
      <BusinessObjectResolutionWorkspace
        taskId="task_form_sem_hotline_ticket"
        onConfirmResolution={onConfirmResolution}
      />
    );

    // 上下文可见：任务 ID 与来源版本
    expect(screen.getByText(/task_form_sem_hotline_ticket/)).toBeInTheDocument();
    expect(screen.getByText(/S5/)).toBeInTheDocument();

    // 对齐任务进行中：不允许跳转业务对象列表
    expect(screen.queryByLabelText('业务对象')).not.toBeInTheDocument();

    // 默认候选为 服务工单 → 确认对齐
    fireEvent.click(screen.getByRole('button', { name: /确认对齐/ }));

    await waitFor(() => expect(onConfirmResolution).toHaveBeenCalledWith('service_ticket'));

    // 领域侧：已产生业务对象修订（对齐动作可追溯）
    const revisions = listRevisions('bo_service_ticket');
    expect(revisions[0].summary).toContain('业务对象对齐');
    expect(revisions[0].changes[0]).toContain('任务 task_form_sem_hotline_ticket');

    // 语义来源无同资产实现 → 登记候选数据实现（等待确认生效）
    const registered = dataSupportService
      .listImplementations('bo_service_ticket')
      .find((impl) => impl.assetId === 'sem_hotline_ticket');
    expect(registered).toBeDefined();
    expect(registered?.name).toBe('公共服务热线工单记录表');
  });

  it('重复对齐已有资产实现：不重复登记，仅记录修订', async () => {
    objectResolutionContexts.open({
      taskId: 'task_align_res_02',
      sourceType: 'DATA_ASSET',
      sourceId: 'res-02',
      sourceName: '公共服务热线工单记录表',
      sourceRevision: 'v1.0',
      returnRoute: 'asset_detail'
    });

    render(
      <BusinessObjectResolutionWorkspace
        taskId="task_align_res_02"
        onConfirmResolution={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /确认对齐/ }));

    await waitFor(() => {
      expect(listRevisions('bo_service_ticket')[0].changes[0]).toContain('任务 task_align_res_02');
    });

    // 种子已登记 res-02 → impl_st_hotline，确认后不得重复登记
    const impls = dataSupportService.listImplementations('bo_service_ticket');
    expect(impls.filter((impl) => impl.assetId === 'res-02')).toHaveLength(1);
  });

  it('对齐新资产：不存在同资产实现时登记 CANDIDATE 绑定', async () => {
    objectResolutionContexts.open({
      taskId: 'task_align_res_99',
      sourceType: 'DATA_ASSET',
      sourceId: 'res-99',
      sourceName: '网格流转工单表',
      sourceRevision: 'v1.0',
      returnRoute: 'asset_detail'
    });

    render(
      <BusinessObjectResolutionWorkspace
        taskId="task_align_res_99"
        onConfirmResolution={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /确认对齐/ }));

    await waitFor(() => {
      const registered = dataSupportService
        .listImplementations('bo_service_ticket')
        .find((impl) => impl.assetId === 'res-99');
      expect(registered).toBeDefined();
    });

    const binding = dataSupportService
      .listBindings('bo_service_ticket')
      .find((item) => item.implementationId === dataSupportService.listImplementations('bo_service_ticket').find((impl) => impl.assetId === 'res-99')!.id);
    expect(binding?.status).toBe('CANDIDATE');
    expect(binding?.role).toBe('SECONDARY');
  });
});
