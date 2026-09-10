import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * 空状态（V2.2 §9 / §8.5）：只允许一个主行动 + 一个次行动（次行动仅限已有真实能力）。
 * 空状态不得透出任何处理中动作或「通过」结果。
 */
export interface BusinessObjectEmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function BusinessObjectEmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className
}: BusinessObjectEmptyStateProps) {
  return (
    <div
      data-bo-empty=""
      className={cx('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}
    >
      {icon !== undefined && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">{icon}</div>
      )}
      <div className="text-sm font-bold text-[#0F172A]">{title}</div>
      {description !== undefined && <p className="max-w-md text-xs leading-5 text-[#64748B]">{description}</p>}
      {(primaryAction !== undefined || secondaryAction !== undefined) && (
        <div className="mt-2 flex items-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
