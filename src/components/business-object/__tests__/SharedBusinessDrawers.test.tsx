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
  getState,
  groundingService,
  listDataSupportRevisions,
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

  it('BusinessObjectHistoryDrawer：三类修订分节呈现，Grounding 修正不混入业务定义版本', () => {
    // 通过领域写入产生 Grounding 修订（禁止页面写死）
    groundingService.applyCorrection({
      bindingId: 'bind_st_curr_view',
      type: 'ATTRIBUTE',
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
        dataSupportRevisions={listDataSupportRevisions('bo_service_ticket')}
        groundingRevisions={groundingService.listByObject('bo_service_ticket')}
      />
    );

    // 三节标题齐备：业务定义版本 / 数据支撑变化 / Grounding 修正
    expect(screen.getByText('业务定义版本')).toBeInTheDocument();
    expect(screen.getByText('数据支撑变化')).toBeInTheDocument();
    expect(screen.getByText('Grounding 修正')).toBeInTheDocument();

    // Grounding 修正落在第三节（不产生业务对象修订）
    expect(screen.getByText('办结时间：finished_time → close_time')).toBeInTheDocument();
    expect(screen.getByText('属性对应修正')).toBeInTheDocument();
    expect(screen.getByText(/finished_time 实际表示最后更新时间/)).toBeInTheDocument();

    // 业务定义版本节呈现领域修订与当前生效版本
    expect(screen.getByText('当前正式版本')).toBeInTheDocument();
  });

  it('BusinessObjectHistoryDrawer：无修订时各节展示空提示', () => {
    render(
      <BusinessObjectHistoryDrawer isOpen onClose={vi.fn()} objectName="服务工单" revisions={[]} />
    );

    expect(screen.getByText('尚无正式定义修订记录。')).toBeInTheDocument();
    expect(screen.getByText('尚无数据支撑变更记录。')).toBeInTheDocument();
    expect(screen.getByText('尚无属性 / 关系落地修正记录。')).toBeInTheDocument();
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
    businessObjectRepository.updateDefinition(
      'bo_service_ticket',
      {},
      {
        summary: '明确全域渠道范围',
        changes: ['新增关键属性“来源渠道”'],
        changedBy: '业务架构岗'
      }
    );

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

  it('Change 集成：对象数据来自领域 Store，发布走真实草稿管线并回调 onPublished', () => {
    const onPublished = vi.fn();
    render(
      <BusinessObjectChangeWorkspace
        objectId="bo_service_ticket"
        onCancel={vi.fn()}
        onPublished={onPublished}
        addToast={vi.fn()}
      />
    );

    // 页头基线修订号来自领域 Store（bo_service_ticket 种子 currentRevision = R1）
    expect(screen.getByText(/当前正式版本 R1 仍在生效/)).toBeInTheDocument();

    // 输入修改说明（用户输入才产生「用户修改说明」依据条目）
    fireEvent.change(document.getElementById('input-change-reason')!, {
      target: { value: '按新版管理办法统一全域渠道口径' }
    });

    // 修改依据抽屉：用户修改说明 + 种子 WORKING 草稿文档依据 + 领域 Store 正式依据（不串其他对象数据）
    fireEvent.click(screen.getAllByText('查看依据')[0]);
    expect(screen.getByText('修改依据明细')).toBeInTheDocument();
    expect(screen.getAllByText('用户修改说明').length).toBeGreaterThan(0);
    expect(screen.getAllByText('新版《公共服务热线运行管理办法》').length).toBeGreaterThan(0);
    expect(screen.getAllByText('公共服务热线工单记录表').length).toBeGreaterThan(0);
    expect(screen.queryByText('人口基本信息表')).toBeNull();

    fireEvent.click(screen.getByText('关闭'));

    // 发布确认：共享弹窗；确认后与保存共用同一份种子草稿 → publishDraft 真实领域写入
    fireEvent.click(document.getElementById('btn-publish-change')!);
    expect(screen.getByText('确认发布业务对象修改')).toBeInTheDocument();
    expect(screen.getByText('本次将正式更新：')).toBeInTheDocument();
    expect(screen.getByText('更新「服务工单」业务定义')).toBeInTheDocument();
    expect(screen.getAllByText('本次未新增业务属性').length).toBeGreaterThan(0);
    fireEvent.click(document.getElementById('btn-confirm-publish')!);
    expect(onPublished).toHaveBeenCalledTimes(1);
    expect(onPublished).toHaveBeenCalledWith('bo_service_ticket');

    // 领域状态真实变化：正式修订号 R1 → R2，修订历史 +1
    const object = businessObjectRepository.get('bo_service_ticket');
    expect(object?.currentRevision).toBe('R2');
    expect(listRevisions('bo_service_ticket').length).toBeGreaterThanOrEqual(2);

    // §10 同一份草稿：发布的是进入页面时恢复的种子 WORKING 草稿本身，发布后置 PUBLISHED，无 WORKING 残留
    const stateAfter = getState();
    expect(stateAfter.drafts['bodraft_st_change_demo'].status).toBe('PUBLISHED');
    expect(
      Object.values(stateAfter.drafts).filter((draft) => draft.status === 'WORKING' && draft.objectId === 'bo_service_ticket')
    ).toHaveLength(0);
  });
});
