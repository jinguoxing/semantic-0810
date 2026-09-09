import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResolveDataSupportWorkspace } from '../../ResolveDataSupportWorkspace';
import {
  businessObjectRepository,
  dataSupportService,
  listDataSupportRevisions,
  listRevisions,
  resetDomainStateForTesting
} from '../../../domain/business-object';

describe('Top-down Data Support 绑定状态闭环（PR-5）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  it('确认数据支撑：CANDIDATE → EFFECTIVE（TOP_DOWN_CONFIRM 数据支撑修订），业务对象修订不受影响', async () => {
    const addToast = vi.fn();
    render(
      <ResolveDataSupportWorkspace
        businessObjectId="bo_service_ticket"
        returnRoute="business_object_detail"
        addToast={addToast}
      />
    );

    // 初始为候选待确认
    expect(screen.getByText('需要你确认')).toBeInTheDocument();

    fireEvent.click(document.getElementById('btn-confirm-data-support')!);

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith(
        'success',
        '数据实现已建立',
        expect.stringContaining('绑定修订 R2')
      )
    );

    // 领域侧：热线实现转正（绑定修订 R1 → R2，成为其他数据实现）；主实现保持不变
    const bindings = dataSupportService.listBindings('bo_service_ticket');
    const hotline = bindings.find((binding) => binding.implementationId === 'impl_st_hotline');
    const primary = bindings.find((binding) => binding.implementationId === 'impl_st_curr_view');
    expect(hotline?.status).toBe('EFFECTIVE');
    expect(hotline?.role).toBe('SECONDARY');
    expect(hotline?.revision).toBe('R2');
    expect(primary?.status).toBe('EFFECTIVE');
    expect(primary?.role).toBe('PRIMARY');
    expect(primary?.revision).toBe('R1');

    // 数据支撑修订可追溯（TOP_DOWN_CONFIRM 只影响这一条绑定）
    const dsRevisions = listDataSupportRevisions('bo_service_ticket');
    expect(dsRevisions[0].action).toBe('TOP_DOWN_CONFIRM');
    expect(dsRevisions[0].reason).toContain('公共服务热线工单记录表');

    // 业务对象修订不受影响（Inv01：currentRevision 只随 BusinessObjectRevision 变化）
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
    expect(listRevisions('bo_service_ticket')).toHaveLength(1);
  });

  it('状态持久化：确认写入 localStorage，重新进入工作区仍保持已确认生效', async () => {
    const { unmount } = render(
      <ResolveDataSupportWorkspace businessObjectId="bo_service_ticket" addToast={vi.fn()} />
    );
    fireEvent.click(document.getElementById('btn-confirm-data-support')!);
    await waitFor(() => {
      expect(
        dataSupportService.listBindings('bo_service_ticket').find((b) => b.implementationId === 'impl_st_hotline')?.status
      ).toBe('EFFECTIVE');
    });
    unmount();

    // 持久化证明：localStorage 中的状态快照包含 EFFECTIVE 绑定（刷新后由此恢复）
    const persisted = window.localStorage.getItem('semovix_business_object_state_v1');
    expect(persisted).toBeTruthy();
    const snapshot = JSON.parse(persisted!);
    const persistedHotline = Object.values(snapshot.bindings as Record<string, { implementationId: string; status: string }>).find(
      (binding) => binding.implementationId === 'impl_st_hotline'
    );
    expect(persistedHotline?.status).toBe('EFFECTIVE');

    // 重新进入（等价于刷新后从详情携带候选上下文再次进入）：候选已生效，不再出现确认按钮
    render(
      <ResolveDataSupportWorkspace
        businessObjectId="bo_service_ticket"
        candidateBindingId="bind_st_hotline"
        addToast={vi.fn()}
      />
    );
    expect(screen.getByText('候选已确认生效')).toBeInTheDocument();
    expect(screen.getByText(/已确认生效 · R2 · 刷新页面状态仍保持/)).toBeInTheDocument();
    expect(screen.queryByText('需要你确认')).not.toBeInTheDocument();
    expect(document.getElementById('btn-confirm-data-support')).toBeNull();
  });
});
