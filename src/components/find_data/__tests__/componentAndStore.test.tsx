import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RightWorkspaceFields } from '../RightWorkspaceFields';
import { RightWorkspaceAskPlan } from '../RightWorkspaceAskPlan';
import { RightWorkspaceSolution } from '../RightWorkspaceSolution';
import { RightWorkspaceCatalog } from '../RightWorkspaceCatalog';
import { TaskContextDrawer } from '../TaskContextDrawer';
import { MINHANG_RESOURCES } from '../fixtures/minhangBedSupplyFixture';
import {
  createFindDataTaskStore,
  LocalStorageFindDataTaskStore,
  NoopFindDataTaskStore
} from '../model/findDataStore';
import { findDataReducer } from '../model/findDataReducer';
import { createAskPlan, createEmptyTask, createMinhangTask } from './testUtils/findDataFactories';

describe('RightWorkspaceFields & Store (AC-07, AC-16)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);
  it('AC-07: RightWorkspaceFields renders credible empty state when fields array is empty', () => {
    render(
      <RightWorkspaceFields
        resource={{
          id: 'r06',
          name: '养老机构基本信息',
          type: '数据资产',
          granularity: '一家机构一条记录',
          timeCoverage: '在营最新名录',
          desc: '登记在册的在营养老机构名录',
          availabilityByAction: {
            discover: 'ALLOWED',
            viewMetadata: 'ALLOWED',
            preview: 'ALLOWED',
            query: 'ALLOWED',
            export: 'DENIED'
          }
        }}
        fields={[]} // Empty!
        onClose={() => {}}
      />
    );

    // Verifies the exact empty state message mandated in AC-07
    expect(
      screen.getByText('当前资源尚未登记可展示的字段元数据。')
    ).toBeInTheDocument();

    // Verifies it does NOT render R03_FIELDS column headers or fields
    expect(screen.queryByText('person_id')).not.toBeInTheDocument();
    expect(screen.queryByText('snapshot_month')).not.toBeInTheDocument();
  });

  it('AC-16: LocalStorageFindDataTaskStore can save, load, and remove tasks', () => {
    const store = new LocalStorageFindDataTaskStore();
    const task = createEmptyTask({ taskId: 'task_store_test_01', title: '存储测试' });

    store.save(task);
    const loaded = store.load('task_store_test_01');
    expect(loaded).toBeDefined();
    expect(loaded?.title).toBe('存储测试');

    store.remove('task_store_test_01');
    const afterRemove = store.load('task_store_test_01');
    expect(afterRemove).toBeNull();
  });

  it('ignores incompatible store schema versions', () => {
    const store = new LocalStorageFindDataTaskStore();
    localStorage.setItem('semovix_find_data_task_bad', JSON.stringify({
      storeSchemaVersion: 99,
      taskSchemaVersion: 1,
      task: createEmptyTask({ taskId: 'bad' })
    }));
    expect(store.load('bad')).toBeNull();
    expect(store.list()).toEqual([]);
  });

  it('restores turns, solution, surface, and revisions from a versioned snapshot', () => {
    const store = new LocalStorageFindDataTaskStore();
    const task = createEmptyTask({
      taskId: 'restored', requirementRevision: 3, searchRevision: 4,
      activeSurface: { type: 'SOLUTION' },
      turns: [{ turnId: 'u1', sender: 'USER', createdAt: '', blocks: [{ type: 'TEXT', id: 't1', content: '目标' }] }],
      dataSolution: { ...createEmptyTask().dataSolution, items: [], gaps: [{ id: 'g1', title: '缺口', description: '缺口', impactLevel: 'LOW', mitigation: '补充', status: 'OPEN' }], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    store.save(task);
    expect(store.load('restored')).toMatchObject({
      requirementRevision: 3, searchRevision: 4, activeSurface: { type: 'SOLUTION' },
      turns: [{ turnId: 'u1' }], dataSolution: { gaps: [{ id: 'g1' }] }
    });
  });

  it('sanitizes an interrupted local operation and shows one recovery notice on hydrate', () => {
    const store = new LocalStorageFindDataTaskStore();
    store.save(createEmptyTask({ taskId: 'interrupted', status: 'SEARCHING', runtimeStatus: { active: true, message: '处理中' }, pendingOperation: { operationId: 'inflight', operationType: 'TURN', startedAt: '' } }));
    const restored = store.load('interrupted')!;
    expect(restored.pendingOperation).toBeUndefined();
    expect(restored.status).toBe('WAITING_USER');
    const hydrated = findDataReducer(createEmptyTask(), { type: 'TASK_HYDRATED', payload: { task: restored } });
    expect(hydrated.turns.at(-1)?.blocks[0]).toMatchObject({ type: 'SYSTEM_NOTICE', message: expect.stringContaining('未完成操作已安全停止') });
    expect(hydrated.metadata?.localRecoveryNotice).toBeUndefined();
  });

  it('uses backend persistence in HTTP mode and local metadata-minimal storage when disconnected', () => {
    expect(createFindDataTaskStore('http')).toBeInstanceOf(NoopFindDataTaskStore);
    const disconnected = createFindDataTaskStore('disconnected');
    disconnected.save(createEmptyTask({
      taskId: 'offline', resources: { secret: {
        id: 'secret', name: '不应持久化', type: '数据资产', granularity: '记录', timeCoverage: '当前', desc: '测试',
        availabilityByAction: { discover: 'ALLOWED', viewMetadata: 'ALLOWED', preview: 'ALLOWED', query: 'ALLOWED', export: 'DENIED' }
      } }
    }));
    expect(disconnected.load('offline')?.resources).toEqual({});
  });

  it('generic task context does not render Minhang pension definitions', () => {
    render(
      <TaskContextDrawer
        isOpen
        onClose={() => {}}
        hypothesis={createEmptyTask().requirementHypothesis}
        scenarioKey="generic"
        onApplyChanges={() => {}}
      />
    );
    expect(screen.queryByText('老年人口统计口径定义')).not.toBeInTheDocument();
    expect(screen.queryByText('养老床位供给口径定义')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('上海市闵行区')).not.toBeInTheDocument();
  });

  it('does not trigger a re-evaluation when the task context has not changed', () => {
    const onApplyChanges = vi.fn();
    const onClose = vi.fn();
    render(
      <TaskContextDrawer
        isOpen
        onClose={onClose}
        hypothesis={createMinhangTask().requirementHypothesis}
        scenarioKey="minhang_bed_supply"
        onApplyChanges={onApplyChanges}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '保存并更新口径' }));
    expect(onApplyChanges).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders CHANGED as a distinct non-runnable Ask state', () => {
    const askPlan = createAskPlan({ permissionCheckState: 'CHANGED' });
    render(
      <RightWorkspaceAskPlan
        task={createMinhangTask({ askPlan })}
        onCheckPermission={async () => ({ decision: 'CHANGED', updatedPermissions: {} })}
        onRunPlan={async () => {}}
        onReturnToSolution={() => {}}
        executionScopeDisclosure="演示仅返回 2026-08 月度样例。"
        onClose={() => {}}
      />
    );
    expect(screen.getByText('权限发生变化')).toBeInTheDocument();
    expect(screen.getByText('查看权限变化')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确认并开始计算' })).toBeDisabled();
    expect(screen.getByText(/演示仅返回 2026-08 月度样例/)).toBeInTheDocument();
  });

  it('renders relationship evidence with business names instead of internal resource ids', () => {
    const task = createMinhangTask();
    render(<RightWorkspaceSolution task={{
      ...task,
      dataSolution: {
        ...task.dataSolution,
        relationshipEvidence: [{
          sourceResourceId: 'r04', targetResourceId: 'r01', relationType: 'ANALYTICAL_COMPATIBILITY',
          verificationStatus: 'SEMANTIC_ONLY', evidenceLevel: 'MEDIUM', evidenceRefs: ['测试证据'],
          description: '同维度关联', joinKeys: ['street_town_code']
        }]
      }
    }} onClose={() => {}} />);
    expect(screen.getByText('在营可用养老床位数 ↔ 60 岁以上常住人口数')).toBeInTheDocument();
    expect(screen.queryByText('r04 ↔ r01')).not.toBeInTheDocument();
  });

  it('labels a PARTIAL_MATCH catalog candidate as recorded, not included', () => {
    const base = createMinhangTask();
    const task = {
      ...base,
      resources: { ...base.resources, r07: MINHANG_RESOURCES.r07 },
      searchResult: {
        query: '民政相关资源', totalMatches: 1, returnedCount: 1, candidateIds: ['r07'],
        candidateSnapshot: [{ resourceId: 'r07', title: '居家养老服务订单', reason: '部分匹配', matchType: 'PARTIAL' as const, proposedRole: 'PARTIAL_MATCH' as const, sourceSearchRevision: 1 }]
      },
      dataSolution: {
        ...base.dataSolution,
        items: [{ resourceId: 'r07', role: 'PARTIAL_MATCH' as const, inclusionState: 'NOT_INCLUDED' as const, coverage: [], limitations: [], evidenceRefs: [] }]
      }
    };
    render(<RightWorkspaceCatalog task={task} onClose={() => {}} onReturnToAnalysis={() => {}} onViewFields={() => {}} />);
    expect(screen.getByText('已记录为部分匹配')).toBeInTheDocument();
    expect(screen.queryByText('已加入方案')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保持部分匹配' })).toBeDisabled();
  });

  it('offers a controlled return to the available-bed definition from an approved-bed solution', () => {
    const base = createMinhangTask();
    const onAction = vi.fn();
    render(<RightWorkspaceSolution task={{
      ...base,
      resources: { ...base.resources, r05: MINHANG_RESOURCES.r05 },
      requirementHypothesis: { ...base.requirementHypothesis, bedDefinition: '养老床位核定数' },
      dataSolution: { ...base.dataSolution, items: [
        { ...base.dataSolution.items[0], resourceId: 'r01' },
        { ...base.dataSolution.items[1], resourceId: 'r05', selectionGroupId: 'bed_definition_alternative' }
      ] }
    }} onAction={onAction} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: '切换为在营可用口径' }));
    expect(onAction).toHaveBeenCalledWith('REVISE_REQUIREMENT', {
      hypothesisPatch: { bedDefinition: '民政核定且在营可用养老床位数' }
    });
  });
});
