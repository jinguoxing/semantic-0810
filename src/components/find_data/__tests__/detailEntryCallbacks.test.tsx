import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MetricDetailWorkspace } from '../../MetricDetailWorkspace';
import { DataAssetDetailWorkspace } from '../../DataAssetDetailWorkspace';

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
      target: { kind: 'ASSET', id: 'asset_distinct_42', label: '人口基本信息视图' },
      intent: 'QUERY_VALUE'
    }));
  });
});
