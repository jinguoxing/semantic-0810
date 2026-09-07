import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MetricDetailWorkspace } from '../../MetricDetailWorkspace';
import { DataAssetDetailWorkspace } from '../../DataAssetDetailWorkspace';
import { getCanonicalMetricIdForMarketplaceResource } from '../../../data/marketplaceMetricReferences';

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

  it('keeps an asset as an asset context rather than claiming it is a metric', () => {
    const onEnterChatQuery = vi.fn();
    render(<DataAssetDetailWorkspace assetId="asset_distinct_42" onEnterChatQuery={onEnterChatQuery} />);

    fireEvent.click(screen.getByRole('button', { name: /当前：需申请/ }));
    fireEvent.click(screen.getByRole('button', { name: '用于问数' }));
    expect(onEnterChatQuery).toHaveBeenCalledWith(expect.objectContaining({
      entryId: 'asset:asset_distinct_42:query-value',
      source: 'ASSET_DETAIL',
      target: { kind: 'ASSET', id: 'asset_distinct_42', label: 'asset_distinct_42' },
      intent: 'QUERY_VALUE'
    }));
  });

  it('uses one resolved asset identity for analysis entry, initial text, and fallback toast', () => {
    const onEnterAnalysis = vi.fn();
    const analysisView = render(<DataAssetDetailWorkspace assetId="asset_distinct_42" onEnterAnalysis={onEnterAnalysis} />);
    fireEvent.click(within(analysisView.container).getByRole('button', { name: /当前：需申请/ }));
    fireEvent.click(within(analysisView.container).getByRole('button', { name: '进入分析' }));
    expect(onEnterAnalysis).toHaveBeenCalledWith(expect.objectContaining({
      entryId: 'asset:asset_distinct_42:analyze',
      target: { kind: 'ASSET', id: 'asset_distinct_42', label: 'asset_distinct_42' },
      initialText: '围绕资源「asset_distinct_42」继续分析'
    }));

    const addToast = vi.fn();
    const toastView = render(<DataAssetDetailWorkspace assetId="asset_distinct_42" addToast={addToast} />);
    fireEvent.click(within(toastView.container).getByRole('button', { name: /当前：需申请/ }));
    fireEvent.click(within(toastView.container).getByRole('button', { name: '用于问数' }));
    expect(addToast).toHaveBeenLastCalledWith('info', '使用当前资产', '已将「asset_distinct_42」作为对象上下文带入数据助手');
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
