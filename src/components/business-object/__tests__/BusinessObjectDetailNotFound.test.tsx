import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessObjectDetailWorkspace } from '../../BusinessObjectDetailWorkspace';
import { resetDomainStateForTesting } from '../../../domain/business-object';

describe('BusinessObjectDetailWorkspace · 无效对象如实 Not Found（BO-FZ-01）', () => {
  beforeEach(() => {
    resetDomainStateForTesting();
  });
  afterEach(cleanup);

  it('未知 objectId → 显示未找到业务对象与对象标识，绝不回退演示「服务工单」', () => {
    const onBackToObjectsList = vi.fn();
    render(
      <BusinessObjectDetailWorkspace objectId="bo_unknown_42" onBackToObjectsList={onBackToObjectsList} />
    );

    expect(screen.getByText('未找到业务对象')).toBeInTheDocument();
    expect(screen.getByText(/对象标识：bo_unknown_42/)).toBeInTheDocument();
    // 主操作：返回业务对象目录
    const back = document.getElementById('btn-back-objects-not-found');
    expect(back).toBeTruthy();
    fireEvent.click(back!);
    expect(onBackToObjectsList).toHaveBeenCalledTimes(1);

    // 禁止回退演示对象：页面不得出现「服务工单」正式定义内容
    expect(screen.queryByText('主体标识：工单编号')).not.toBeInTheDocument();
  });

  it('空 objectId（例如上游跳转缺失标识）同样 Not Found，不默认 bo_service_ticket', () => {
    render(<BusinessObjectDetailWorkspace objectId={undefined} />);
    expect(screen.getByText('未找到业务对象')).toBeInTheDocument();
  });

  it('合法 objectId 仍正常渲染对象详情（防止守卫误伤正常路径）', () => {
    render(<BusinessObjectDetailWorkspace objectId="bo_service_ticket" initialTab="business" />);
    expect(screen.queryByText('未找到业务对象')).not.toBeInTheDocument();
  });
});
