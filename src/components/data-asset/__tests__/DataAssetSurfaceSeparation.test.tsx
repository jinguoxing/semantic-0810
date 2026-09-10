import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataAssetDetailWorkspace } from '../../DataAssetDetailWorkspace';

// vitest 未开 globals：显式清理，避免上一用例 DOM 泄漏
afterEach(cleanup);

describe('数据资产详情双操作面完全分离（BO-FZ-01 / §12）', () => {
  it('GOVERNANCE 治理面：有对齐业务对象与四项治理状态，无任何消费动作', () => {
    render(
      <DataAssetDetailWorkspace
        assetId="asset-1"
        surface="GOVERNANCE"
        onAlignToBusinessObject={vi.fn()}
        onBackToAssetCatalog={vi.fn()}
      />
    );

    // 治理面专属：面包屑「数据治理」+ 返回数据资产目录
    expect(screen.getAllByText('数据治理').length).toBeGreaterThan(0);
    expect(screen.getByText('返回数据资产目录')).toBeInTheDocument();
    // 治理动作与治理状态
    expect(screen.getByRole('button', { name: /对齐业务对象/ })).toBeInTheDocument();
    expect(screen.getByText('正式身份')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Data Semantics')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Lineage')).toBeInTheDocument();
    expect(screen.getByText('当前业务对象状态')).toBeInTheDocument();

    // 消费动作一个都不允许出现（含导航与申请 / 分析 / 问数 / 找数据）
    ['我的申请', '申请使用', '进入分析', '用于问数', '查看相关资源', '围绕此资源找数据', '访问权限模拟'].forEach(
      (label) => expect(screen.queryByText(new RegExp(label))).not.toBeInTheDocument()
    );
    expect(screen.queryByRole('button', { name: '发现' })).not.toBeInTheDocument();
  });

  it('MARKETPLACE 消费面：有数据服务超市导航与申请/分析/问数动作，无任何治理动作', () => {
    render(<DataAssetDetailWorkspace assetId="asset-1" surface="MARKETPLACE" />);

    // 消费面专属：数据服务超市导航 + 需申请状态 + 申请使用
    expect(screen.getByRole('button', { name: '发现' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '我的申请' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '申请使用' })).toBeInTheDocument();
    expect(screen.getByText('需申请')).toBeInTheDocument();

    // 治理动作一个都不允许出现
    ['对齐业务对象', '修改数据语义', 'Grounding', '治理任务', '查看语义依据', '当前业务对象状态'].forEach((label) =>
      expect(screen.queryByText(new RegExp(label))).not.toBeInTheDocument()
    );
    // 治理面面包屑「数据治理」也不得出现
    expect(screen.queryByText('数据治理')).not.toBeInTheDocument();
  });
});
