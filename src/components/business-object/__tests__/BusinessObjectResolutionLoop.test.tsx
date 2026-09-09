import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BusinessObjectResolutionWorkspace } from '../../BusinessObjectResolutionWorkspace';
import { DataSemanticsDetailView } from '../../DataSemanticsDetailView';
import {
  businessObjectRepository,
  dataSupportService,
  listDataSupportRevisions,
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

  it('对齐确认：直接登记 EFFECTIVE 数据支撑 + BOTTOM_UP_ALIGN 修订 + 完成任务并按上下文返回', async () => {
    // 入口登记（App 层 openResolutionContext 的领域侧等价物）
    objectResolutionContexts.open({
      taskId: 'task_form_sem_hotline_ticket',
      sourceType: 'DATA_SEMANTICS',
      sourceId: 'sem_hotline_ticket',
      sourceName: '公共服务热线工单记录表',
      sourceRevision: 'S5',
      returnRoute: 'semantics_detail'
    });

    const onBackToSource = vi.fn();
    const addToast = vi.fn();
    render(
      <BusinessObjectResolutionWorkspace
        taskId="task_form_sem_hotline_ticket"
        onBackToSource={onBackToSource}
        addToast={addToast}
      />
    );

    // 上下文可见：任务 ID 与来源版本
    expect(screen.getAllByText(/task_form_sem_hotline_ticket/).length).toBeGreaterThan(0);
    expect(screen.getByText(/来源版本 S5/)).toBeInTheDocument();

    // Bottom-up 必须显式选择目标对象（不预选任何业务对象）
    expect(screen.getByText('请先选择目标业务对象')).toBeInTheDocument();
    fireEvent.click(document.getElementById('bo-option-bo_service_ticket')!);

    // 确认对齐（真实领域写入）
    fireEvent.click(document.getElementById('btn-confirm-resolution')!);

    await waitFor(() => expect(onBackToSource).toHaveBeenCalledTimes(1));

    // 领域侧：语义来源无同资产实现 → 登记新数据实现，直接 EFFECTIVE（不经过候选期）
    const registered = dataSupportService
      .listImplementations('bo_service_ticket')
      .find((impl) => impl.assetId === 'sem_hotline_ticket');
    expect(registered).toBeDefined();
    expect(registered?.name).toBe('公共服务热线工单记录表');
    const binding = dataSupportService
      .listBindings('bo_service_ticket')
      .find((item) => item.implementationId === registered!.id);
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.role).toBe('SECONDARY');

    // BOTTOM_UP_ALIGN 数据支撑修订可追溯；业务对象修订不受影响（Inv01 / Inv02）
    const dsRevisions = listDataSupportRevisions('bo_service_ticket');
    expect(dsRevisions[0].action).toBe('BOTTOM_UP_ALIGN');
    expect(dsRevisions[0].reason).toContain('自下而上对齐');
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
    expect(listRevisions('bo_service_ticket')).toHaveLength(1);

    // 任务闭环：COMPLETED
    expect(objectResolutionContexts.get('task_form_sem_hotline_ticket')?.status).toBe('COMPLETED');
  });

  it('重复对齐已有资产实现：提升既有 CANDIDATE 绑定，不重复登记实现 / 绑定', async () => {
    // 种子已登记 res-02 → impl_st_hotline（CANDIDATE 绑定 bind_st_hotline）
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
        onBackToSource={vi.fn()}
        addToast={vi.fn()}
      />
    );
    fireEvent.click(document.getElementById('bo-option-bo_service_ticket')!);
    fireEvent.click(document.getElementById('btn-confirm-resolution')!);

    // 同资产实现不重复登记；确认动作只提升既有 CANDIDATE 绑定（一次只影响一条绑定）
    await waitFor(() => {
      expect(dataSupportService.getBinding('bind_st_hotline')?.status).toBe('EFFECTIVE');
    });
    const impls = dataSupportService.listImplementations('bo_service_ticket');
    expect(impls.filter((impl) => impl.assetId === 'res-02')).toHaveLength(1);
    const hotlineBindings = dataSupportService
      .listBindings('bo_service_ticket')
      .filter((item) => item.implementationId === 'impl_st_hotline');
    expect(hotlineBindings).toHaveLength(1);
    expect(hotlineBindings[0].role).toBe('SECONDARY');

    // 提升记录为 BOTTOM_UP_ALIGN 数据支撑修订（CANDIDATE → EFFECTIVE）
    const dsRevisions = listDataSupportRevisions('bo_service_ticket');
    expect(dsRevisions[0].action).toBe('BOTTOM_UP_ALIGN');
    expect(dsRevisions[0].beforeStatus).toBe('CANDIDATE');
    expect(objectResolutionContexts.get('task_align_res_02')?.status).toBe('COMPLETED');
  });

  it('对齐新资产：不存在同资产实现时直接登记 EFFECTIVE 绑定（不经过候选期）', async () => {
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
        onBackToSource={vi.fn()}
        addToast={vi.fn()}
      />
    );
    fireEvent.click(document.getElementById('bo-option-bo_service_ticket')!);
    fireEvent.click(document.getElementById('btn-confirm-resolution')!);

    await waitFor(() => {
      const registered = dataSupportService
        .listImplementations('bo_service_ticket')
        .find((impl) => impl.assetId === 'res-99');
      expect(registered).toBeDefined();
    });

    const registered = dataSupportService
      .listImplementations('bo_service_ticket')
      .find((impl) => impl.assetId === 'res-99')!;
    const binding = dataSupportService
      .listBindings('bo_service_ticket')
      .find((item) => item.implementationId === registered.id);
    // Bottom-up 规则：直接生效（不经过 CANDIDATE），对象已有生效实现 → 其他数据实现
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.role).toBe('SECONDARY');
    expect(listDataSupportRevisions('bo_service_ticket')[0].action).toBe('BOTTOM_UP_ALIGN');
  });
});
