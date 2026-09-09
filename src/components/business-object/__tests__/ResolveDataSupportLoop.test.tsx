import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResolveDataSupportWorkspace } from '../../ResolveDataSupportWorkspace';
import {
  dataSupportService,
  listRevisions,
  resetDomainStateForTesting
} from '../../../domain/business-object';

describe('Top-down Data Support 绑定状态闭环（PR-5）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  it('确认数据支撑：CANDIDATE → EFFECTIVE，绑定 Revision 2，形成 主+辅 角色结构', async () => {
    const onConfirmSuccess = vi.fn();
    const addToast = vi.fn();
    render(
      <ResolveDataSupportWorkspace onConfirmSuccess={onConfirmSuccess} addToast={addToast} />
    );

    // 初始为候选待确认
    expect(screen.getByText('需要你确认')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /确认数据支撑/ }));

    await waitFor(() => expect(onConfirmSuccess).toHaveBeenCalledOnce());
    expect(addToast).toHaveBeenCalledWith(
      'success',
      '数据实现已建立',
      expect.stringContaining('绑定修订 R2')
    );

    // 领域侧：热线实现转正，绑定修订 R2；主实现同步升级 R2
    const bindings = dataSupportService.listBindings('bo_service_ticket');
    const hotline = bindings.find((binding) => binding.implementationId === 'impl_st_hotline');
    const primary = bindings.find((binding) => binding.implementationId === 'impl_st_curr_view');
    expect(hotline?.status).toBe('EFFECTIVE');
    expect(hotline?.role).toBe('SECONDARY');
    expect(hotline?.revision).toBe('R2');
    expect(primary?.status).toBe('EFFECTIVE');
    expect(primary?.role).toBe('PRIMARY');
    expect(primary?.revision).toBe('R2');

    // 业务对象修订可追溯
    const revisions = listRevisions('bo_service_ticket');
    expect(revisions[0].summary).toContain('确认数据支撑');
    expect(revisions[0].changes.join(' ')).toContain('1 主 + 1 辅');
  });

  it('状态持久化：确认写入 localStorage，刷新页面后状态仍保持', async () => {
    const { unmount } = render(<ResolveDataSupportWorkspace addToast={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /确认数据支撑/ }));
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

    // 重挂载（等价于刷新后重新进入工作台）：呈现已确认生效状态，不再出现确认按钮
    render(<ResolveDataSupportWorkspace addToast={vi.fn()} />);
    expect(screen.getByText('已确认生效')).toBeInTheDocument();
    expect(screen.getByText(/刷新页面状态仍保持/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /确认数据支撑/ })).not.toBeInTheDocument();
  });
});
