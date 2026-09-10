import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BusinessObjectAuthoringWorkspace } from '../../BusinessObjectAuthoringWorkspace';
import {
  getState,
  objectResolutionContexts,
  resetDomainStateForTesting
} from '../../../domain/business-object';

describe('BusinessObjectAuthoringWorkspace · Bottom-up 复用闭环（§6C / Inv09）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  it('复用「客服坐席」：不建新对象、不改正式定义、不静默加别名，来源资产对齐并把任务折入同一命令', () => {
    // 数据语义入口登记 Bottom-up 任务（来源资产 = 统一目录的 asset-1）
    objectResolutionContexts.open({
      taskId: 'task_reuse_hotline',
      sourceType: 'DATA_SEMANTICS',
      dataAsset: { id: 'asset-1', name: '公共服务热线工单记录表' },
      semanticSource: { semanticId: 'sem_hotline_ticket', semanticRevision: 'S5' },
      returnRoute: 'semantics_detail'
    });

    // 复用前快照：正式对象集合（含定义 / 别名 / 修订号）
    const objectsBefore = structuredClone(getState().objects);

    const onReuseExisting = vi.fn();
    const onResolutionCompleted = vi.fn();
    const addToast = vi.fn();
    render(
      <BusinessObjectAuthoringWorkspace
        resolutionTaskId="task_reuse_hotline"
        onReuseExisting={onReuseExisting}
        onResolutionCompleted={onResolutionCompleted}
        addToast={addToast}
      />
    );

    // 复用判断默认待处理：直接走「复用客服坐席」→ 确认
    expect(document.getElementById('existing-object-card')).toBeTruthy();
    fireEvent.click(document.getElementById('btn-reuse-existing-bo')!);
    fireEvent.click(screen.getByRole('button', { name: '确认复用「客服坐席」' }));

    // Bottom-up 复用唯一成功出口（BO-FZ-02）：onResolutionCompleted（普通复用回调绝不触发）
    expect(onReuseExisting).not.toHaveBeenCalled();
    expect(onResolutionCompleted).toHaveBeenCalledTimes(1);
    expect(onResolutionCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task_reuse_hotline',
        businessObjectId: 'bo_customer_agent',
        mode: 'REUSE'
      })
    );

    const state = getState();
    // Inv09：复用 ≠ 修改定义 —— 正式对象集合与复用前完全一致（零新对象、零定义改写、零别名追加）
    expect(state.objects).toEqual(objectsBefore);
    const agent = state.objects.bo_customer_agent;
    expect(agent.definition).toBe('表示承担客户咨询、受理和服务处理职责的业务主体。');
    expect(agent.aliases).toEqual(['客户服务坐席', '服务坐席']);
    expect(agent.aliases).not.toContain('热线坐席');
    expect(agent.currentRevision).toBe('R1');
    expect(Object.values(state.objects).some((object) => object.name === '热线坐席')).toBe(false);

    // 来源资产对齐到被复用对象：登记一条 asset-1 的数据实现（EFFECTIVE），任务在同一命令内闭环
    const agentImpls = Object.values(state.implementations).filter(
      (impl) => impl.businessObjectId === 'bo_customer_agent' && impl.assetId === 'asset-1'
    );
    expect(agentImpls).toHaveLength(1);
    const binding = Object.values(state.bindings).find((item) => item.implementationId === agentImpls[0].id);
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.role).toBe('SECONDARY');
    expect(state.taskContexts.task_reuse_hotline.status).toBe('COMPLETED');
    const actions = Object.values(state.dataSupportRevisions)
      .filter((revision) => revision.businessObjectId === 'bo_customer_agent')
      .map((revision) => revision.action);
    expect(actions).toContain('BOTTOM_UP_ALIGN');
    // 资产身份保持规范 ID（semanticId 只作证据，绝不落为实现身份）
    expect(Object.values(state.implementations).some((impl) => impl.assetId === 'sem_hotline_ticket')).toBe(false);
  });
});
