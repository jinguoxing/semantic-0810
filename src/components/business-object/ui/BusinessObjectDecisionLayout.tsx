import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * 决策态布局（V2.2 模板 B）：
 * - THREE_COLUMN：280px 上下文 | 连续决策主面 minmax(0,1fr) | 280px 决策检查（有候选待确认时）；
 * - TWO_COLUMN：280px 上下文 | 结果主面（无候选 / 已确认 / 空态时，隐藏右栏与全部通过态）。
 */
export type BusinessObjectDecisionLayoutVariant = 'THREE_COLUMN' | 'TWO_COLUMN';

export interface BusinessObjectDecisionLayoutProps {
  variant?: BusinessObjectDecisionLayoutVariant;
  context: ReactNode;
  decision: ReactNode;
  inspector?: ReactNode;
  className?: string;
}

export function BusinessObjectDecisionLayout({
  variant = 'THREE_COLUMN',
  context,
  decision,
  inspector,
  className
}: BusinessObjectDecisionLayoutProps) {
  const columns =
    variant === 'THREE_COLUMN'
      ? 'lg:grid-cols-[280px_minmax(0,1fr)_280px]'
      : 'lg:grid-cols-[280px_minmax(0,1fr)]';
  return (
    <div
      data-bo-layout="decision"
      data-bo-decision-columns={variant === 'THREE_COLUMN' ? '3' : '2'}
      className={cx('grid min-w-0 grid-cols-1 items-start gap-6', columns, className)}
    >
      <div className="min-w-0">{context}</div>
      <div className="min-w-0">{decision}</div>
      {variant === 'THREE_COLUMN' && inspector !== undefined && <aside className="min-w-0">{inspector}</aside>}
    </div>
  );
}
