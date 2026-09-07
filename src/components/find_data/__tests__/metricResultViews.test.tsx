import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AskResultSnapshot } from '../model/FindDataTask';
import { AskResultContent } from '../blocks/AskResultContent';
import { RightWorkspaceMetricResult } from '../RightWorkspaceMetricResult';
import { canOpenDirectMetricResult } from '../../DataAssistantFindDataWorkspace';
import { createEmptyTask } from './testUtils/findDataFactories';

const snapshot: AskResultSnapshot = {
  binding: { kind: 'DIRECT_METRIC', taskId: 'task_metric', requestId: 'request_metric', metricId: 'met_elderly_population', requirementRevision: 1 },
  operationId: 'operation_metric',
  executedAt: '2026-09-07T00:00:00.000Z',
  metricName: '老年人口数',
  numeratorLabel: '60 岁及以上常住人口',
  dataOrigin: 'MOCK_FIXTURE',
  resultArtifact: {
    resultRef: { kind: 'SERVICE_RESULT', id: 'result_metric' },
    content: { kind: 'SCALAR', label: '2026 年 8 月，浦锦街道 60 岁及以上常住人口', value: { kind: 'NUMBER', state: 'VALUE', value: 20000, unit: '人', precision: 0 } },
    actualScope: { region: '浦锦街道', timeRange: { start: '2026-08', end: '2026-08' }, grain: 'MONTH' },
    citations: [{
      kind: 'METRIC_DEFINITION', id: 'met_elderly_population', label: '老年人口数', version: 'v1.1.0',
      definition: { meaning: '60 岁及以上常住人口总数。', unit: '人', scope: '常住人口', timeSemantics: '月度快照', source: '测试服务' }
    }]
  }
};

describe('direct metric result views', () => {
  it('uses the same task, request, revision, and metric identity before opening a direct result', () => {
    const task = createEmptyTask({ taskId: 'task_metric', directMetricResult: snapshot });
    expect(canOpenDirectMetricResult(task, snapshot)).toBe(true);
    const wrongMetric = {
      ...snapshot,
      binding: { ...snapshot.binding, metricId: 'met_resident_population' }
    } as AskResultSnapshot;
    expect(canOpenDirectMetricResult(task, wrongMetric)).toBe(false);
  });

  it('opens the current direct result and its actual definition without an AskPlan action', () => {
    const onActionClick = vi.fn();
    render(<AskResultContent snapshot={snapshot} mode="compact" canOpenDetails onActionClick={onActionClick} />);

    expect(screen.getByText('设计演示数据')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看完整结果' }));
    expect(onActionClick).toHaveBeenLastCalledWith('OPEN_METRIC_RESULT', expect.objectContaining({ directMetricBinding: snapshot.binding }));
    fireEvent.click(screen.getByRole('button', { name: '查看指标口径' }));
    expect(onActionClick).toHaveBeenLastCalledWith('OPEN_METRIC_DEFINITION', expect.objectContaining({ directMetricBinding: snapshot.binding }));
    expect(onActionClick).not.toHaveBeenCalledWith('OPEN_ASK_PLAN', expect.anything());
  });

  it('shows only the definition attached to this result and returns without a query callback', () => {
    const onFocusChange = vi.fn();
    render(<RightWorkspaceMetricResult snapshot={snapshot} focus="DEFINITION" onFocusChange={onFocusChange} onClose={() => {}} />);

    expect(screen.getByRole('heading', { name: '本次指标口径' })).toBeInTheDocument();
    expect(screen.getByText('版本 v1.1.0')).toBeInTheDocument();
    expect(screen.getByText('60 岁及以上常住人口总数。')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '返回结果' }));
    expect(onFocusChange).toHaveBeenCalledWith('RESULT');
    expect(screen.queryByRole('button', { name: '按此方案计算' })).not.toBeInTheDocument();
  });
});
