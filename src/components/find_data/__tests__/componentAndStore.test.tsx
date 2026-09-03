import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RightWorkspaceFields } from '../RightWorkspaceFields';
import { LocalStorageFindDataTaskStore } from '../model/findDataStore';
import { initialFindDataTaskState } from '../model/findDataReducer';

describe('RightWorkspaceFields & Store (AC-07, AC-16)', () => {
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
    const task = {
      ...initialFindDataTaskState,
      taskId: 'task_store_test_01',
      title: '存储测试'
    };

    store.save(task);
    const loaded = store.load('task_store_test_01');
    expect(loaded).toBeDefined();
    expect(loaded?.title).toBe('存储测试');

    store.remove('task_store_test_01');
    const afterRemove = store.load('task_store_test_01');
    expect(afterRemove).toBeNull();
  });
});
