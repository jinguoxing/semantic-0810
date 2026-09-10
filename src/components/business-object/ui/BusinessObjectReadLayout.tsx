import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * 阅读态双栏布局（V2.2 模板 A）：左侧唯一 Main Surface + 右侧唯一 Inspector Surface，
 * 比例约 73 / 27，间距 24px；窄屏自然退化为单栏。
 */
export interface BusinessObjectReadLayoutProps {
  main: ReactNode;
  inspector?: ReactNode;
  className?: string;
}

export function BusinessObjectReadLayout({ main, inspector, className }: BusinessObjectReadLayoutProps) {
  if (!inspector) {
    return <div className={cx('min-w-0', className)}>{main}</div>;
  }
  return (
    <div
      data-bo-layout="read"
      className={cx('grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,73fr)_minmax(280px,27fr)]', className)}
    >
      <div className="min-w-0">{main}</div>
      <aside className="min-w-0">{inspector}</aside>
    </div>
  );
}
