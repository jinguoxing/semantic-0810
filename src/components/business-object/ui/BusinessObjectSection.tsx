import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * Surface 内的节（V2.2 §六 L2）：标题 + 可选描述 + 内容 + 可选分隔线。
 * 只有版式（标题 14/700、描述 12、标题→内容 12px、节间距 28px），无边框无阴影，
 * 内容区块之间不允许再嵌套卡片。
 */
export interface BusinessObjectSectionProps {
  title?: ReactNode;
  /** 标题右侧的操作区（如「查看本次范围」链接） */
  actions?: ReactNode;
  description?: ReactNode;
  /** 是否在节底部加分隔线（#EEF2F6） */
  divider?: boolean;
  /** 标题级别：Surface 直接子节用 h2，嵌套小节用 h3 */
  headingAs?: 'h2' | 'h3';
  headingId?: string;
  id?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function BusinessObjectSection({
  title,
  actions,
  description,
  divider = false,
  headingAs: Heading = 'h2',
  headingId,
  id,
  className,
  contentClassName,
  children
}: BusinessObjectSectionProps) {
  const hasHeader = title !== undefined || actions !== undefined;
  return (
    <section
      id={id}
      data-bo-section=""
      className={cx('flex min-w-0 flex-col gap-3', divider && 'border-b border-[#EEF2F6] pb-6', className)}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3">
          {title !== undefined && (
            <Heading
              id={headingId}
              className="text-sm leading-5 font-bold text-[#0F172A]"
            >
              {title}
            </Heading>
          )}
          {actions !== undefined && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </div>
      )}
      {description !== undefined && (
        <p className="text-xs leading-5 text-[#64748B]">{description}</p>
      )}
      <div className={cx('min-w-0', contentClassName)}>{children}</div>
    </section>
  );
}
