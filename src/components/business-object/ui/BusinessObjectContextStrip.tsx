import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * Context Strip（V2.2 §8.1）：数据支撑视角顶部的当前事实条。
 * 左侧：当前实现选择器 + 角色·状态 + 适用范围；右侧：只读动作（查看数据资产 / 查看判断依据 / 发现更多数据支撑 / 更多）。
 * 同一事实（如主要数据实现名）在本条只出现一次。
 */
export interface BusinessObjectContextStripProps {
  id?: string;
  /** 「当前实现」标签下的选择器（button + 下拉） */
  selector?: ReactNode;
  /** 角色 · 状态（如「主要数据实现 · 已生效」）+ 复核入口 */
  status?: ReactNode;
  /** 适用范围事实 */
  scope?: ReactNode;
  /** 右侧动作区 */
  actions?: ReactNode;
  className?: string;
}

export function BusinessObjectContextStrip({
  id,
  selector,
  status,
  scope,
  actions,
  className
}: BusinessObjectContextStripProps) {
  return (
    <section
      id={id}
      data-bo-strip="implementation"
      className={cx('rounded-lg border border-[#E2E8F0] bg-white px-6 py-4', className)}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {selector !== undefined && (
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-xs font-medium text-[#64748B]">当前实现</span>
            <div className="min-w-0">{selector}</div>
          </div>
        )}
        {status !== undefined && <div className="flex min-w-0 items-center gap-2">{status}</div>}
        {scope !== undefined && <div className="flex min-w-0 items-center gap-2 text-xs text-[#475569]">{scope}</div>}
        {actions !== undefined && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}
