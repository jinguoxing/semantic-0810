import React from 'react';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RightWorkspaceFields } from '../RightWorkspaceFields';
import { RightWorkspaceAskPlan } from '../RightWorkspaceAskPlan';
import { RightWorkspaceSolution } from '../RightWorkspaceSolution';
import { TaskContextDrawer } from '../TaskContextDrawer';
import {
  createFindDataTaskStore,
  LocalStorageFindDataTaskStore,
  NoopFindDataTaskStore
} from '../model/findDataStore';
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
      dataSolution: { items: [], gaps: [{ id: 'g1', title: '缺口', description: '缺口', impactLevel: 'LOW', mitigation: '补充', status: 'OPEN' }], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '' }
    });
    store.save(task);
    expect(store.load('restored')).toMatchObject({
      requirementRevision: 3, searchRevision: 4, activeSurface: { type: 'SOLUTION' },
      turns: [{ turnId: 'u1' }], dataSolution: { gaps: [{ id: 'g1' }] }
    });
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

  it('renders CHANGED as a distinct non-runnable Ask state', () => {
    const askPlan = createAskPlan({ permissionCheckState: 'CHANGED' });
    render(
      <RightWorkspaceAskPlan
        task={createMinhangTask({ askPlan })}
        onCheckPermission={async () => ({ decision: 'CHANGED', updatedPermissions: {} })}
        onRunPlan={async () => {}}
        onReturnToSolution={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('权限已变化 (CHANGED)')).toBeInTheDocument();
    expect(screen.getByText('查看权限变化')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确认并开始计算' })).toBeDisabled();
  });

  it('renders relationship evidence with business names instead of internal resource ids', () => {
    const task = createMinhangTask();
    render(<RightWorkspaceSolution task={{
      ...task,
      dataSolution: {
        ...task.dataSolution,
        relationshipEvidence: [{
          sourceResourceId: 'r04', targetResourceId: 'r01', relationType: 'CORRELATION',
          description: '同维度关联', joinKeys: ['street_town_code']
        }]
      }
    }} onClose={() => {}} />);
    expect(screen.getByText('在营可用养老床位数 ↔ 60 岁以上常住人口数')).toBeInTheDocument();
    expect(screen.queryByText('r04 ↔ r01')).not.toBeInTheDocument();
  });
});
