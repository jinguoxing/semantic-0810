import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * 事实格（V2.2 §六 L3）：浅底 (#F8FAFC) + 1px #EEF2F6 + 6px 圆角的 Fact Cell，
 * 一组最多 4 个，用于「实现概览」等证据型事实。
 */
export interface BusinessObjectFactItem {
  label: string;
  value: ReactNode;
  /** 等宽展示（表名 / 字段 / ID） */
  mono?: boolean;
  hint?: ReactNode;
}

export interface BusinessObjectFactGridProps {
  items: BusinessObjectFactItem[];
  /** 一行最多几格（默认 2，最多 4 项时可用 4） */
  columns?: 2 | 4;
  className?: string;
}

export function BusinessObjectFactGrid({ items, columns = 2, className }: BusinessObjectFactGridProps) {
  const shown = items.slice(0, 4);
  const gridClass = columns === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2';
  return (
    <dl data-bo-fact-grid="" className={cx('grid grid-cols-1 gap-3', gridClass, className)}>
      {shown.map((item) => (
        <div key={item.label} data-bo-fact-cell="" className="rounded-md border border-[#EEF2F6] bg-[#F8FAFC] px-4 py-3">
          <dt className="text-[11px] leading-4 text-[#64748B]">{item.label}</dt>
          <dd className={cx('mt-1.5 text-[13px] leading-5 font-medium text-[#0F172A]', item.mono && 'font-mono')}>
            {item.value}
          </dd>
          {item.hint !== undefined && <div className="mt-1 text-[11px] leading-4 text-[#94A3B8]">{item.hint}</div>}
        </div>
      ))}
    </dl>
  );
}
