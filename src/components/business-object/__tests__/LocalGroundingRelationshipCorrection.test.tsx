import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BusinessObjectDetailWorkspace } from '../../BusinessObjectDetailWorkspace';
import {
  businessObjectRepository,
  dataSupportService,
  groundingService,
  listRevisions,
  resetDomainStateForTesting
} from '../../../domain/business-object';

describe('Local Grounding 关系落地修正（PR-7）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  it('关系行可打开关系模式修正抽屉：候选仅含与目标对象身份兼容的字段（Inv08）', () => {
    render(
      <BusinessObjectDetailWorkspace
        objectId="bo_service_ticket"
        initialTab="data_support"
        addToast={vi.fn()}
      />
    );

    // 第一条关系：申请人 → 自然人
    fireEvent.click(document.getElementById('btn-correct-rel-0')!);

    expect(screen.getByText('修正关系落地', { selector: 'h1' })).toBeInTheDocument();
    // 关系目标：申请人 → 自然人（当前对应 / 新的对应 / 版本预览多处出现）
    expect(screen.getAllByText('申请人 → 自然人').length).toBeGreaterThanOrEqual(2);
    // 当前字段只展示裸字段部分（去掉「实现名 ·」前缀）：当前对应区 + 版本预览 Before 区
    expect(screen.getAllByText('applicant_id').length).toBeGreaterThanOrEqual(2);
    // 关系模式叙事由调用方 reason 提供
    expect(screen.getByText(/主身份字段的口径不一致/)).toBeInTheDocument();
    // 候选字段来自当前实现的关系候选白名单，且按 targetObjectId 过滤出自然人侧字段
    expect(screen.getAllByText('申请人标识').length).toBeGreaterThan(0);
    expect(screen.getAllByText('自然人标识').length).toBeGreaterThan(0);
    // Inv08：候选区（抽屉内）不得出现其他关系目标的字段或工单自身字段
    const drawer = document.getElementById('local-grounding-correction-drawer')!;
    expect(drawer).not.toBeNull();
    const drawerScope = within(drawer);
    expect(drawerScope.queryByText('承办部门标识')).toBeNull();
    expect(drawerScope.queryByText('所属区域标识')).toBeNull();
    expect(drawerScope.queryByText('ticket_id')).toBeNull();
    expect(drawerScope.queryByText('close_time')).toBeNull();
    expect(drawerScope.queryByText('accept_time')).toBeNull();
  });

  it('确认关系修正：产生 RELATIONSHIP GroundingRevision，落地字段替换为身份兼容字段，不产生业务对象修订（Inv03）', () => {
    render(
      <BusinessObjectDetailWorkspace
        objectId="bo_service_ticket"
        initialTab="data_support"
        addToast={vi.fn()}
      />
    );

    fireEvent.click(document.getElementById('btn-correct-rel-0')!);
    // 选择候选字段：自然人标识 · person_id（与「自然人」身份兼容）
    fireEvent.click(screen.getByText(/自然人在工单记录中的主体标识字段/));
    fireEvent.click(document.getElementById('btn-confirm-correction')!);

    // 领域：RELATIONSHIP 修正当前生效，落地字段为「实现名 · 字段」完整形式
    const revisions = groundingService.listByObject('bo_service_ticket');
    expect(revisions[0].type).toBe('RELATIONSHIP');
    expect(revisions[0].targetName).toBe('申请人 → 自然人');
    expect(revisions[0].status).toBe('ACTIVE');
    expect(revisions[0].after.field).toBe('客服工单当前视图 · person_id');

    // 领域：实现关系落地字段被替换，其他关系不受影响
    const impl = dataSupportService.getImplementation('impl_st_curr_view');
    expect(impl?.relationships[0].sourceField).toBe('客服工单当前视图 · person_id');
    expect(impl?.relationships[1].sourceField).toBe('客服工单当前视图 · handle_dept_id');
    expect(impl?.relationships[2].sourceField).toBe('客服工单当前视图 · administrative_code');

    // 领域：Grounding 修正不产生业务对象修订，正式修订号与修订历史不变（Inv03）
    expect(businessObjectRepository.get('bo_service_ticket')?.currentRevision).toBe('R1');
    expect(listRevisions('bo_service_ticket')).toHaveLength(1);

    // UI：抽屉关闭，关系行来源字段即时更新
    expect(document.getElementById('local-grounding-correction-drawer')).toBeNull();
    expect(screen.getAllByText('客服工单当前视图 · person_id').length).toBeGreaterThan(0);
  });

  it('属性修正仍走 ATTRIBUTE 模式：默认候选修正办结时间，needsCorrection 清除', () => {
    render(
      <BusinessObjectDetailWorkspace
        objectId="bo_service_ticket"
        initialTab="data_support"
        addToast={vi.fn()}
      />
    );

    // 办结时间（第 5 列属性，idx=4）为 needsCorrection 种子场景
    fireEvent.click(document.getElementById('btn-correct-attr-4')!);

    expect(screen.getByText('修正属性对应', { selector: 'h1' })).toBeInTheDocument();
    // 属性模式使用默认候选叙事（finished_time → close_time）
    expect(screen.getByText(/实际表示：/)).toBeInTheDocument();
    fireEvent.click(document.getElementById('btn-confirm-correction')!);

    const revisions = groundingService.listByObject('bo_service_ticket');
    expect(revisions[0].type).toBe('ATTRIBUTE');
    expect(revisions[0].targetName).toBe('办结时间');
    expect(revisions[0].after.field).toBe('close_time');

    const impl = dataSupportService.getImplementation('impl_st_curr_view');
    const finishedAttr = impl?.attributes.find((attribute) => attribute.attributeName === '办结时间');
    expect(finishedAttr?.field).toBe('close_time');
    expect(finishedAttr?.needsCorrection).toBe(false);
  });
});
