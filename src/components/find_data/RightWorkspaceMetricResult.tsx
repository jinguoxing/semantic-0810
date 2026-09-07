import React from 'react';
import { FileText, Info, X } from 'lucide-react';
import { AskResultSnapshot, MetricResultFocusSection } from './model/FindDataTask';
import { AskResultContent } from './blocks/AskResultContent';

interface RightWorkspaceMetricResultProps {
  snapshot: AskResultSnapshot;
  focus?: MetricResultFocusSection;
  onFocusChange: (focus: MetricResultFocusSection) => void;
  onClose: () => void;
}

/** Read-only companion surface for a direct official-metric result. */
export const RightWorkspaceMetricResult: React.FC<RightWorkspaceMetricResultProps> = ({
  snapshot,
  focus = 'RESULT',
  onFocusChange,
  onClose
}) => {
  const definition = snapshot.resultArtifact.citations?.find((citation) => citation.kind === 'METRIC_DEFINITION');
  const detail = definition?.definition;

  return (
    <div className="flex h-full w-full flex-col border-l border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-[#FAFAFA] px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]">
            {focus === 'DEFINITION' ? <FileText className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">{focus === 'DEFINITION' ? '本次指标口径' : '指标查询结果'}</h3>
            <p className="text-[11px] text-[#64748B]">{focus === 'DEFINITION' ? '只读展示本次答案实际引用的定义' : snapshot.metricName}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="关闭指标查询结果" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]" title="关闭工作区"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 text-xs">
        {focus === 'RESULT' ? (
          <AskResultContent snapshot={snapshot} mode="full" />
        ) : definition ? (
          <section className="space-y-4" aria-label="本次指标定义">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-[10px] font-semibold text-[#64748B]">本次实际引用</p>
              <h4 className="mt-1 text-sm font-bold text-[#0F172A]">{definition.label}</h4>
              <p className="mt-1 font-mono text-[11px] text-[#2563EB]">{definition.version ? `版本 ${definition.version}` : '服务未返回版本'}</p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-[11px] leading-relaxed">
              <dt className="text-[#64748B]">含义</dt><dd className="text-[#334155]">{detail?.meaning ?? '本次服务未返回可展示的定义说明。'}</dd>
              <dt className="text-[#64748B]">单位</dt><dd className="text-[#334155]">{detail?.unit ?? '本次服务未返回'}</dd>
              <dt className="text-[#64748B]">适用范围</dt><dd className="text-[#334155]">{detail?.scope ?? '本次服务未返回'}</dd>
              <dt className="text-[#64748B]">时间语义</dt><dd className="text-[#334155]">{detail?.timeSemantics ?? '本次服务未返回'}</dd>
              <dt className="text-[#64748B]">来源</dt><dd className="text-[#334155]">{detail?.source ?? '服务返回的指标定义引用'}</dd>
            </dl>
            <p className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-[11px] leading-relaxed text-[#1D4ED8]">查看定义不会重新执行查询，也不会用当前最新指标替换这次结果的实际引用。</p>
          </section>
        ) : (
          <p className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFCFF] p-3 text-[11px] text-[#64748B]">本次结果没有返回可读取的指标定义引用，不能以当前最新定义替代。</p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[#E2E8F0] bg-[#FAFAFA] p-4">
        {focus === 'RESULT' ? <span className="text-[11px] text-[#64748B]">当前只展示本次服务返回的数据。</span> : <button onClick={() => onFocusChange('RESULT')} className="rounded-lg px-3 py-1.5 text-xs text-[#2563EB] hover:bg-[#EFF6FF]">返回结果</button>}
        {focus === 'RESULT' && <button onClick={() => onFocusChange('DEFINITION')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#2563EB] hover:bg-[#EFF6FF]">查看指标口径</button>}
      </div>
    </div>
  );
};
