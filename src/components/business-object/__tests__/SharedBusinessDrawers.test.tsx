import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BusinessEvidenceDrawer } from '../../business-object/BusinessEvidenceDrawer';
import { BusinessObjectHistoryDrawer } from '../../business-object/BusinessObjectHistoryDrawer';
import { BusinessObjectPublishDialog } from '../../business-object/BusinessObjectPublishDialog';
import { BusinessObjectDetailWorkspace } from '../../BusinessObjectDetailWorkspace';
import { BusinessObjectChangeWorkspace } from '../../BusinessObjectChangeWorkspace';
import {
  businessObjectRepository,
  commitRevision,
  groundingService,
  listRevisions,
  resetDomainStateForTesting
} from '../../../domain/business-object';

describe('共享 Evidence Drawer / History Drawer / Publish Dialog（PR-8）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  it('BusinessEvidenceDrawer：依据条目来自领域 Store，展示标题 / 类型 / 采纳决策 / 来源', () => {
    const object = businessObjectRepository.get('bo_service_ticket');
    render(
      <BusinessEvidenceDrawer
        isOpen
        onClose={vi.fn()}
        objectName={object.name}
        evidence={object.evidence}
      />
    );

    expect(screen.getByText('定义依据 · 服务工单')).toBeInTheDocument();
    expect(screen.getByText('公共服务热线工单记录表')).toBeInTheDocument();
    expect(screen.getByText('数据表', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/采用工单编号作为服务工单的稳定身份标识/)).toBeInTheDocument();
    expect(screen.getByText(/来源：hotline_db.service.pop_service_hotline/)).toBeInTheDocument();
  });

  it('BusinessEvidenceDrawer：无依据时展示空状态', () => {
    render(<BusinessEvidenceDrawer isOpen onClose={vi.fn()} objectName="空对象" evidence={[]} />);

    expect(screen.getByText('暂无记录的定义依据。')).toBeInTheDocument();
  });

  it('BusinessObjectHistoryDrawer：历史来自 Revision Store，修订按生效状态呈现', () => {
    // 通过领域写入产生修订记录（禁止页面写死）
    groundingService.applyCorrection({
      bindingId: 'bind_st_curr_view',
      targetName: '办结时间',
      fromField: 'finished_time',
      toField: 'close_time',
      reason: '数据语义修订：finished_time 实际表示最后更新时间',
      evidence: []
    });

    render(
      <BusinessObjectHistoryDrawer
        isOpen
        onClose={vi.fn()}
        objectName="服务工单"
        revisions={listRevisions('bo_service_ticket')}
      />
    );

    expect(screen.getByText(/落地修正：办结时间 finished_time → close_time/)).toBeInTheDocument();
    expect(screen.getByText('当前生效')).toBeInTheDocument();
    expect(screen.getByText(/本地落地修正 · /)).toBeInTheDocument();
  });

  it('BusinessObjectHistoryDrawer：无修订时展示空提示', () => {
    render(
      <BusinessObjectHistoryDrawer isOpen onClose={vi.fn()} objectName="服务工单" revisions={[]} />
    );

    expect(screen.getByText('尚无正式修订记录，当前定义来自初始登记。')).toBeInTheDocument();
  });

  it('BusinessObjectPublishDialog：变更清单数据传入，确认 / 取消回调生效', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <BusinessObjectPublishDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        objectName="服务工单"
        changeSummary={['明确服务工单的渠道范围描述', '新增关键属性“来源渠道”']}
        dataSupportNotes={['现有数据实现继续有效']}
        confirmLabel="发布修改"
      />
    );

    expect(screen.getByText('确认发布业务对象')).toBeInTheDocument();
    expect(screen.getByText(/发布后将形成「服务工单」新的正式业务对象版本/)).toBeInTheDocument();
    expect(screen.getByText('新增关键属性“来源渠道”')).toBeInTheDocument();
    expect(screen.getByText('现有数据实现继续有效')).toBeInTheDocument();

    fireEvent.click(screen.getByText('发布修改'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('返回编辑'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Detail 集成：定义依据与变更历史均由共享抽屉呈现领域数据', () => {
    commitRevision('bo_service_ticket', {
      summary: '明确全域渠道范围',
      changes: ['新增关键属性“来源渠道”'],
      changedBy: '业务架构岗'
    });

    render(
      <BusinessObjectDetailWorkspace
        objectId="bo_service_ticket"
        initialTab="business"
        addToast={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('查看定义依据'));
    expect(screen.getByText('定义依据 · 服务工单')).toBeInTheDocument();
    expect(screen.getAllByText('服务工单范围界定评审').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('关闭'));
    fireEvent.click(screen.getAllByText('查看完整历史')[0]);
    expect(screen.getByText(/明确全域渠道范围/)).toBeInTheDocument();
  });

  it('Change 集成：修改依据 = 工作区输入 + 领域 Store 正式依据；发布走共享弹窗', () => {
    const onPublish = vi.fn();
    render(
      <BusinessObjectChangeWorkspace
        onCancel={vi.fn()}
        onSaveDraft={vi.fn()}
        onPublish={onPublish}
        addToast={vi.fn()}
      />
    );

    // 修改依据抽屉：用户修改说明 + 领域 Store 的正式定义依据（不串其他对象数据）
    fireEvent.click(screen.getAllByText('查看依据')[0]);
    expect(screen.getByText('修改依据明细')).toBeInTheDocument();
    expect(screen.getAllByText('用户修改说明').length).toBeGreaterThan(0);
    expect(screen.getAllByText('新版《公共服务热线运行管理办法》').length).toBeGreaterThan(0);
    expect(screen.getAllByText('公共服务热线工单记录表').length).toBeGreaterThan(0);
    expect(screen.queryByText('人口基本信息表')).toBeNull();

    fireEvent.click(screen.getByText('关闭'));

    // 发布确认：共享弹窗，确认后回调 onPublish
    fireEvent.click(document.getElementById('btn-publish-change')!);
    expect(screen.getByText('本次将正式更新：')).toBeInTheDocument();
    expect(screen.getByText('新增关键属性“来源渠道”')).toBeInTheDocument();
    fireEvent.click(document.getElementById('btn-confirm-publish')!);
    expect(onPublish).toHaveBeenCalledTimes(1);
  });
});
