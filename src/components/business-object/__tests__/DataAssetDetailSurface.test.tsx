import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DataAssetDetailWorkspace } from '../../DataAssetDetailWorkspace';

/**
 * §12 消费面 / 治理面边界（同一资产详情组件按 surface 分流）：
 * - MARKETPLACE（消费面）：显示「我的申请」与消费动作，不显示治理操作；
 * - GOVERNANCE（治理面）：显示「对齐业务对象」治理入口，不显示消费动作。
 */
describe('DataAssetDetailWorkspace · surface 边界（§12）', () => {
  afterEach(cleanup);

  it('MARKETPLACE：显示我的申请与申请使用，不显示对齐业务对象 / 修正数据语义 / 进入分析 / 用于问数', () => {
    render(
      <DataAssetDetailWorkspace
        assetId="asset-1"
        assetName="公共服务热线工单记录表"
        surface="MARKETPLACE"
        addToast={vi.fn()}
      />
    );

    // 消费面要素：我的申请侧栏入口 + 默认「需申请」状态的主操作
    expect(screen.getByText('我的申请')).toBeInTheDocument();
    expect(screen.getAllByText('申请使用').length).toBeGreaterThan(0);
    expect(screen.getAllByText('公共服务热线工单记录表').length).toBeGreaterThan(0);

    // 治理操作不进入消费面
    expect(document.getElementById('btn-align-business-object')).toBeNull();
    expect(screen.queryByText('对齐业务对象')).toBeNull();
    expect(screen.queryByText('修正数据语义')).toBeNull();
    // 消费动作仅在授权后出现（默认 requestable，不渲染）
    expect(screen.queryByText('进入分析')).toBeNull();
    expect(screen.queryByText('用于问数')).toBeNull();
  });

  it('GOVERNANCE：显示对齐业务对象并回传规范资产身份，不显示我的申请 / 进入分析 / 用于问数', () => {
    const onAlignToBusinessObject = vi.fn();
    render(
      <DataAssetDetailWorkspace
        assetId="asset-1"
        assetName="公共服务热线工单记录表"
        surface="GOVERNANCE"
        onAlignToBusinessObject={onAlignToBusinessObject}
        addToast={vi.fn()}
      />
    );

    // 治理面要素：Bottom-up 对齐入口
    const alignButton = document.getElementById('btn-align-business-object');
    expect(alignButton).toBeTruthy();
    fireEvent.click(alignButton!);
    expect(onAlignToBusinessObject).toHaveBeenCalledTimes(1);
    // 回传统一目录的规范资产身份（id + 名称，不用语义 ID 冒充）
    expect(onAlignToBusinessObject).toHaveBeenCalledWith({ id: 'asset-1', name: '公共服务热线工单记录表' });

    // 消费面操作不进入治理面
    expect(screen.queryByText('我的申请')).toBeNull();
    expect(screen.queryByText('进入分析')).toBeNull();
    expect(screen.queryByText('用于问数')).toBeNull();
  });
});
