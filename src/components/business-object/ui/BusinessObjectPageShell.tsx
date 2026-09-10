import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * 页面骨架（V2.2 模板 A/B 公共外框）：
 * L0 页面底 #F7F9FC → 白色页头条带（面包屑 / 标题行 / Tabs）→ 居中内容区（1320px / 32px 横向 / 24px 纵向）。
 */
export interface BusinessObjectPageShellProps {
  breadcrumb?: ReactNode;
  /** 标题行 + 动作 + 描述（由调用方按页面组合） */
  header: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  /** 内容区顶部额外内容（如警示条），与主内容同样受 1320px 约束 */
  contentTop?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function BusinessObjectPageShell({
  breadcrumb,
  header,
  tabs,
  contentTop,
  children,
  className,
  contentClassName
}: BusinessObjectPageShellProps) {
  return (
    <div
      data-bo-page=""
      className={cx(
        'flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#F7F9FC] font-sans text-[#0F172A] antialiased',
        className
      )}
    >
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-8 pt-6">
          {breadcrumb !== undefined && <div className="min-w-0">{breadcrumb}</div>}
          <div className="min-w-0">{header}</div>
          {tabs !== undefined && <div className="-mb-px min-w-0">{tabs}</div>}
        </div>
      </header>
      <main data-bo-page-content="" className={cx('mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-8 py-6', contentClassName)}>
        {contentTop}
        {children}
      </main>
    </div>
  );
}
