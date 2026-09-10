import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MetricDetailWorkspace } from '../../MetricDetailWorkspace';
import { DataAssetDetailWorkspace } from '../../DataAssetDetailWorkspace';
import { getCanonicalMetricIdForMarketplaceResource } from '../../../data/marketplaceMetricReferences';

// vitest 未开 globals，RTL 自动 cleanup 不生效：必须显式清理，避免上一用例的
// 已授权状态 DOM（含 进入分析 / 用于问数 按钮）泄漏到下一用例
afterEach(cleanup);

describe('detail-to-find-data entry callbacks', () => {
  it('sends the exact metric ID and displayed version rather than a name lookup', () => {
    const onEnterChatQuery = vi.fn();
    render(<MetricDetailWorkspace metricId="met_elderly_population" onEnterChatQuery={onEnterChatQuery} />);

    fireEvent.click(screen.getByRole('button', { name: '问这个指标' }));
    expect(onEnterChatQuery).toHaveBeenCalledWith(expect.objectContaining({
      entryId: 'metric:met_elderly_population:query-value',
      source: 'METRIC_DETAIL',
      target: { kind: 'METRIC', id: 'met_elderly_population', label: '老年人口数', version: 'v1.1.0' },
      intent: 'QUERY_VALUE'
    }));
  });

  it('keeps an asset as an asset context rather than claiming it is a metric', async () => {
    const onEnterChatQuery = vi.fn();
    render(<DataAssetDetailWorkspace assetId="asset-2" onEnterChatQuery={onEnterChatQuery} />);

    // 真实消费链路（BO-FZ-01）：需申请 → 提交申请（策略自动审批生效）→ 可直接使用
    fireEvent.click(screen.getByRole('button', { name: '申请使用' }));
    fireEvent.click(screen.getByRole('button', { name: '提交申请' }));
    await screen.findByRole('button', { name: '用于问数' }, { timeout: 4000 });
    fireEvent.click(screen.getByRole('button', { name: '用于问数' }));
    expect(onEnterChatQuery).toHaveBeenCalledWith(expect.objectContaining({
      entryId: 'asset:asset-2:query-value',
      source: 'ASSET_DETAIL',
      target: { kind: 'ASSET', id: 'asset-2', label: '人口基本信息' },
      intent: 'QUERY_VALUE'
    }));
  });

  it('uses one resolved asset identity for analysis entry, initial text, and fallback toast', async () => {
    const onEnterAnalysis = vi.fn();
    render(<DataAssetDetailWorkspace assetId="asset-2" onEnterAnalysis={onEnterAnalysis} />);
    fireEvent.click(screen.getByRole('button', { name: '申请使用' }));
    fireEvent.click(screen.getByRole('button', { name: '提交申请' }));
    await screen.findByRole('button', { name: '进入分析' }, { timeout: 4000 });
    fireEvent.click(screen.getByRole('button', { name: '进入分析' }));
    expect(onEnterAnalysis).toHaveBeenCalledWith(expect.objectContaining({
      entryId: 'asset:asset-2:analyze',
      target: { kind: 'ASSET', id: 'asset-2', label: '人口基本信息' },
      initialText: '围绕资源「人口基本信息」继续分析'
    }));

    const addToast = vi.fn();
    const toastView = render(<DataAssetDetailWorkspace assetId="asset-2" addToast={addToast} />);
    fireEvent.click(within(toastView.container).getByRole('button', { name: '申请使用' }));
    fireEvent.click(within(toastView.container).getByRole('button', { name: '提交申请' }));
    await within(toastView.container).findByRole('button', { name: '用于问数' }, { timeout: 4000 });
    fireEvent.click(within(toastView.container).getByRole('button', { name: '用于问数' }));
    expect(addToast).toHaveBeenLastCalledWith('info', '使用当前资产', '已将「人口基本信息」作为对象上下文带入数据助手');
  });

  it('uses the explicit marketplace resource-to-metric reference', () => {
    expect(getCanonicalMetricIdForMarketplaceResource('res-03')).toBe('met_001');
    expect(getCanonicalMetricIdForMarketplaceResource('met_001')).toBeUndefined();
  });

  it('does not replace an unknown non-empty metric ID with another metric', () => {
    const view = render(<MetricDetailWorkspace metricId="unknown_metric_42" />);

    expect(screen.getByRole('heading', { name: '未找到指标' })).toBeInTheDocument();
    expect(screen.getByText('指标 ID「unknown_metric_42」不是已登记的正式指标，未替换为其他指标。')).toBeInTheDocument();
    expect(within(view.container).queryByRole('button', { name: '问这个指标' })).not.toBeInTheDocument();
  });
});
