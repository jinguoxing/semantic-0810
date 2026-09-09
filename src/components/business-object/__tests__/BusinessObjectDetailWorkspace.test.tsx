import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BusinessObjectDetailWorkspace } from '../../BusinessObjectDetailWorkspace';
import {
  dataSupportService,
  groundingService,
  resetDomainStateForTesting
} from '../../../domain/business-object';

describe('BusinessObjectDetailWorkspace（PR-3：Detail 由领域仓库驱动）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  const openDataSupportTab = () => {
    const tab = document.getElementById('tab-data-support');
    expect(tab).toBeTruthy();
    fireEvent.click(tab!);
  };

  it('服务工单：数据支撑显示自己的两套实现，不串自然人数据', () => {
    render(<BusinessObjectDetailWorkspace objectId="bo_service_ticket" />);

    // 业务视角：身份与属性来自对象定义
    expect(screen.getAllByText('服务工单').length).toBeGreaterThan(0);
    expect(screen.getAllByText('工单编号').length).toBeGreaterThan(0);

    openDataSupportTab();
    expect(screen.getAllByText('客服工单当前视图').length).toBeGreaterThan(0);
    expect(screen.getAllByText('cs_db.service.ticket_curr_view').length).toBeGreaterThan(0);
    // 候选实现（bind_st_hotline = CANDIDATE）不出现在正式数据支撑视图（Inv05）
    expect(screen.queryByText('公共服务热线工单记录表')).not.toBeInTheDocument();
    expect(screen.queryByText('人口基本信息表')).not.toBeInTheDocument();
    expect(screen.queryByText('人口扩展信息')).not.toBeInTheDocument();
  });

  it('自然人：数据支撑显示人口实现，不串服务工单数据', () => {
    render(<BusinessObjectDetailWorkspace objectId="bo_person" />);

    expect(screen.getAllByText('身份标识').length).toBeGreaterThan(0);
    expect(screen.queryByText('工单编号')).not.toBeInTheDocument();

    openDataSupportTab();
    expect(screen.getAllByText('人口基本信息表').length).toBeGreaterThan(0);
    expect(screen.getAllByText('人口扩展信息').length).toBeGreaterThan(0);
    expect(screen.queryByText('客服工单当前视图')).not.toBeInTheDocument();
    expect(screen.queryByText('公共服务热线工单记录表')).not.toBeInTheDocument();
  });

  it('状态徽标来自领域状态而非写死“已发布”', () => {
    const { rerender } = render(<BusinessObjectDetailWorkspace objectId="bo_contract" />);
    expect(screen.getByText('草稿')).toBeInTheDocument();

    rerender(<BusinessObjectDetailWorkspace objectId="bo_order" />);
    expect(screen.getByText('已停用')).toBeInTheDocument();

    rerender(<BusinessObjectDetailWorkspace objectId="bo_service_ticket" />);
    expect(screen.getByText('已发布')).toBeInTheDocument();
  });

  it('落地修正走领域服务：字段修正后写入仓库并可在页面反映', () => {
    render(<BusinessObjectDetailWorkspace objectId="bo_service_ticket" />);
    openDataSupportTab();

    // 修正前：办结时间落在 finished_time 且有待修正标记
    expect(screen.getByText('finished_time')).toBeInTheDocument();

    // 通过领域服务应用与 drawer 相同的修正
    const binding = dataSupportService
      .listBindings('bo_service_ticket')
      .find((item) => item.implementationId === 'impl_st_curr_view');
    groundingService.applyCorrection({
      bindingId: binding!.id,
      type: 'ATTRIBUTE',
      targetId: 'attr_close_time',
      fromField: 'finished_time',
      toField: 'close_time',
      reason: '数据语义修订：finished_time 实际表示最后更新时间',
      evidence: ['ev_st_identity']
    });

    // 修正写入仓库（useSyncExternalStore 订阅会让页面同步重渲染）
    const implementation = dataSupportService.getImplementation('impl_st_curr_view');
    const attribute = implementation?.attributes.find((item) => item.attributeName === '办结时间');
    expect(attribute?.field).toBe('close_time');
    expect(attribute?.needsCorrection).toBeFalsy();
  });
});
