import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BusinessObjectDetailWorkspace } from '../../BusinessObjectDetailWorkspace';
import {
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

  it('关系行可打开关系模式修正抽屉：标题 / 关系目标 / 当前裸字段 / 候选来自当前实现字段', () => {
    render(
      <BusinessObjectDetailWorkspace
        objectId="bo_service_ticket"
        initialTab="data_support"
        addToast={vi.fn()}
      />
    );

    // 第一条关系：申请人 → 自然人
    fireEvent.click(document.getElementById('btn-correct-rel-0')!);

    expect(screen.getByText('修正关系落地')).toBeInTheDocument();
    expect(screen.getAllByText('申请人 → 自然人').length).toBeGreaterThan(0);
    // 当前字段只展示裸字段部分（去掉「实现名 ·」前缀）：当前对应区 + 版本预览 Before 区
    expect(screen.getAllByText('applicant_id').length).toBe(2);
    // 关系模式叙事由调用方 reason 提供
    expect(screen.getByText(/主身份字段的口径不一致/)).toBeInTheDocument();
    // 候选字段来自当前实现（客服工单当前视图）的落地字段
    expect(screen.getByText(/服务工单主体标识 · 来源：客服工单当前视图/)).toBeInTheDocument();
    expect(screen.getByText(/服务工单受理时间 · 来源：客服工单当前视图/)).toBeInTheDocument();
  });

  it('确认关系修正：产生 RELATIONSHIP GroundingRevision，实现落地字段替换，对象修订可追溯', () => {
    render(
      <BusinessObjectDetailWorkspace
        objectId="bo_service_ticket"
        initialTab="data_support"
        addToast={vi.fn()}
      />
    );

    fireEvent.click(document.getElementById('btn-correct-rel-0')!);
    // 选择候选字段：受理时间 · accept_time
    fireEvent.click(screen.getByText(/服务工单受理时间 · 来源：客服工单当前视图/));
    fireEvent.click(document.getElementById('btn-confirm-correction')!);

    // 领域：RELATIONSHIP 修正当前生效
    const revisions = groundingService.listByObject('bo_service_ticket');
    expect(revisions[0].type).toBe('RELATIONSHIP');
    expect(revisions[0].targetName).toBe('申请人 → 自然人');
    expect(revisions[0].status).toBe('ACTIVE');
    expect(revisions[0].after.field).toBe('客服工单当前视图 · accept_time');

    // 领域：实现关系落地字段被替换，其他关系不受影响
    const impl = dataSupportService.getImplementation('impl_st_curr_view');
    expect(impl?.relationships[0].sourceField).toBe('客服工单当前视图 · accept_time');
    expect(impl?.relationships[1].sourceField).toBe('客服工单当前视图 · handle_dept_id');
    expect(impl?.relationships[2].sourceField).toBe('客服工单当前视图 · administrative_code');

    // 领域：对象修订记录（禁止页面写死，历史来自 Revision Store）
    const objectRevisions = listRevisions('bo_service_ticket');
    expect(objectRevisions[0].summary).toBe('落地修正：申请人 → 自然人 applicant_id → accept_time');
    expect(objectRevisions[0].changes[0]).toContain('关系落地');

    // UI：抽屉关闭，关系行来源字段即时更新
    expect(document.getElementById('local-grounding-correction-drawer')).toBeNull();
    expect(screen.getAllByText('客服工单当前视图 · accept_time').length).toBeGreaterThan(0);
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
