import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessObjectAuthoringWorkspace } from '../../BusinessObjectAuthoringWorkspace';
import {
  getState,
  objectResolutionContexts,
  resetDomainStateForTesting
} from '../../../domain/business-object';

describe('BusinessObjectAuthoringWorkspace · Bottom-up 续作失败不冒充成功（BO-FZ-02）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  /** 登记一个来源资产已承载其他对象的对齐任务（res-01 种子已 EFFECTIVE 承载 bo_service_ticket） */
  const openConflictingTask = (taskId: string) => {
    objectResolutionContexts.open({
      taskId,
      sourceType: 'DATA_ASSET',
      dataAsset: { id: 'res-01', name: '客服业务当前工单视图' },
      returnRoute: 'asset_detail'
    });
  };

  it('Create：对象已发布但来源数据 BINDING_CONFLICT → 无任何成功回调，任务保持 OPEN，部分成功面板可见', async () => {
    openConflictingTask('task_create_conflict');
    const onPublished = vi.fn();
    const onResolutionCompleted = vi.fn();
    const addToast = vi.fn();
    render(
      <BusinessObjectAuthoringWorkspace
        resolutionTaskId="task_create_conflict"
        onPublished={onPublished}
        onResolutionCompleted={onResolutionCompleted}
        addToast={addToast}
      />
    );

    // 独立创建评估（800ms 异步）→ 允许发布
    fireEvent.click(document.getElementById('btn-toggle-define-independent')!);
    fireEvent.click(screen.getByRole('button', { name: /提交 Semovix 重新评估/ }));
    await waitFor(
      () => expect(screen.getByText('Semovix 评估认可独立业务对象身份')).toBeInTheDocument(),
      { timeout: 4000 }
    );

    // 发布 → 发布确认弹窗 → 确认发布
    fireEvent.click(document.getElementById('btn-bo-publish')!);
    fireEvent.click(document.getElementById('btn-confirm-publish')!);

    // 部分成功面板：业务对象已发布，但来源数据尚未完成对齐
    const panel = document.getElementById('bo-continuation-failure-panel');
    expect(panel).toBeTruthy();
    expect(panel!.textContent).toContain('业务对象已发布，但来源数据尚未完成对齐');
    expect(panel!.textContent).toContain('对齐失败原因');
    expect(panel!.textContent).toContain('已发布事实不会回滚');

    // 绝不触发任何成功回调（不返回来源、不冒充任务完成）
    expect(onPublished).not.toHaveBeenCalled();
    expect(onResolutionCompleted).not.toHaveBeenCalled();
    // 禁止以成功 Toast 冒充任务完成 / 数据支撑已生效（发布前「差异评估通过」属正常 UI 反馈，不算闭环）
    const toastTitles = addToast.mock.calls.map(([, title]) => title);
    expect(toastTitles).not.toContain('业务对象已发布，来源数据已完成对齐');
    expect(toastTitles).not.toContain('业务对象已发布');
    expect(toastTitles).toContain('业务对象已发布，但来源数据尚未完成对齐');

    // 领域事实：新对象已发布不回滚；任务保持未完成
    const state = getState();
    const createdNames = Object.values(state.objects).map((object) => object.name);
    expect(createdNames).toContain('热线坐席');
    expect(state.taskContexts.task_create_conflict.status).toBe('OPEN');
    // 重试数据对齐动作存在（只重跑续作，不重新发布）
    expect(document.getElementById('btn-retry-continuation')).toBeTruthy();
    expect(document.getElementById('btn-back-to-resolution-task')).toBeTruthy();
    expect(document.getElementById('btn-view-published-object')).toBeTruthy();
  });

  it('Reuse：来源数据 BINDING_CONFLICT → 立即停止，不复用、不回调、不改「客服坐席」定义', () => {
    openConflictingTask('task_reuse_conflict');
    const objectsBefore = structuredClone(getState().objects);
    const onReuseExisting = vi.fn();
    const onResolutionCompleted = vi.fn();
    const addToast = vi.fn();
    render(
      <BusinessObjectAuthoringWorkspace
        resolutionTaskId="task_reuse_conflict"
        onReuseExisting={onReuseExisting}
        onResolutionCompleted={onResolutionCompleted}
        addToast={addToast}
      />
    );

    // 复用「客服坐席」→ 确认 → 续作失败（res-01 已承载 服务工单）
    fireEvent.click(document.getElementById('btn-reuse-existing-bo')!);
    fireEvent.click(screen.getByRole('button', { name: '确认复用「客服坐席」' }));

    // 失败提示：未完成对象复用，任务保持未完成
    const callout = document.getElementById('bo-reuse-continuation-failure');
    expect(callout).toBeTruthy();
    expect(callout!.textContent).toContain('已选择复用对象，但来源数据未完成对齐');
    expect(callout!.textContent).toContain('未完成对象复用');
    expect(callout!.textContent).toContain('任务 task_reuse_conflict 保持未完成');

    // 绝不触发成功回调，也绝不置为已复用（保持可重新发起）
    expect(onReuseExisting).not.toHaveBeenCalled();
    expect(onResolutionCompleted).not.toHaveBeenCalled();
    const toastTitles = addToast.mock.calls.map(([, title]) => title);
    expect(toastTitles).not.toContain('已复用现有业务对象');
    expect(toastTitles).not.toContain('来源数据已对齐到已有对象');
    expect(toastTitles).toContain('已选择复用对象，但来源数据未完成对齐');
    expect(document.getElementById('existing-object-card')).toBeTruthy();

    // 领域事实：正式对象集合零改动，任务保持 OPEN
    const state = getState();
    expect(state.objects).toEqual(objectsBefore);
    expect(state.objects.bo_customer_agent.aliases).not.toContain('热线坐席');
    expect(state.taskContexts.task_reuse_conflict.status).toBe('OPEN');
  });
});
