import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * Primary Surface（V2.2 §六 L1）：白色主表面，1px 边框，8px 圆角，默认无阴影。
 * 阴影只允许出现在 hover / popover / drawer / dialog。
 */
export type BusinessObjectSurfaceVariant = 'MAIN' | 'INSPECTOR' | 'CONTEXT' | 'CALLOUT';

export type BusinessObjectCalloutTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const CALLOUT_TONES: Record<BusinessObjectCalloutTone, string> = {
  neutral: 'bg-[#F8FAFC] border-[#EEF2F6]',
  info: 'bg-[#EFF6FF] border-[#BFDBFE]',
  success: 'bg-[#F0FDF4] border-[#BBF7D0]',
  warning: 'bg-[#FFFBEB] border-[#FDE68A]',
  danger: 'bg-[#FEF2F2] border-[#FECACA]'
};

export interface BusinessObjectSurfaceProps {
  variant?: BusinessObjectSurfaceVariant;
  /** 仅 CALLOUT 生效的语义色调 */
  tone?: BusinessObjectCalloutTone;
  /** MAIN / INSPECTOR / CONTEXT 默认 24px 内边距 */
  padded?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}

export function BusinessObjectSurface({
  variant = 'MAIN',
  tone = 'neutral',
  padded = true,
  id,
  className,
  children
}: BusinessObjectSurfaceProps) {
  if (variant === 'CALLOUT') {
    return (
      <div
        id={id}
        data-bo-surface="callout"
        className={cx('rounded-md border px-4 py-3', CALLOUT_TONES[tone], className)}
      >
        {children}
      </div>
    );
  }

  return (
    <section
      id={id}
      data-bo-surface={variant.toLowerCase()}
      className={cx(
        'rounded-lg border border-[#E2E8F0] bg-white',
        padded && 'p-6',
        'flex flex-col gap-7',
        className
      )}
    >
      {children}
    </section>
  );
}
