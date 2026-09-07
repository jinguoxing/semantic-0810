import React from 'react';
import { BookOpenCheck, FileText, Info, X } from 'lucide-react';
import { AskResultSnapshot, AskResultView, ResultDetailFocusSection } from './model/FindDataTask';
import { AskResultContent } from './blocks/AskResultContent';

interface RightWorkspaceResultDetailProps {
  snapshot: AskResultSnapshot;
  displayLabel: string;
  focus?: ResultDetailFocusSection;
  resultView?: AskResultView;
  onResultViewChange: (view: AskResultView) => void;
  onFocusChange: (focus: ResultDetailFocusSection) => void;
  onClose: () => void;
}

/**
 * A result-object reader hosted in the existing right workspace. It receives a
 * snapshot, never a task plan, so opening it cannot restore or run an old plan.
 */
export const RightWorkspaceResultDetail: React.FC<RightWorkspaceResultDetailProps> = ({
  snapshot,
  displayLabel,
  focus = 'RESULT',
  resultView,
  onResultViewChange,
  onFocusChange,
  onClose
}) => {
  const citations = snapshot.resultArtifact.citations ?? [];

  return (
    <div className="flex h-full w-full flex-col border-l border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-[#FAFAFA] px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]">
            {focus === 'EVIDENCE' ? <BookOpenCheck className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">{focus === 'EVIDENCE' ? '本次结果依据' : '分析结果'}</h3>
            <p className="truncate text-[11px] text-[#64748B]" title={displayLabel}>{focus === 'EVIDENCE' ? '只读展示这份结果实际携带的引用' : displayLabel}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="关闭结果详情" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]" title="关闭结果详情"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 text-xs">
        {focus === 'RESULT' ? (
          <AskResultContent snapshot={snapshot} mode="full" fullView={resultView} onFullViewChange={onResultViewChange} />
        ) : citations.length > 0 ? (
          <div className="space-y-3" aria-label="本次结果依据">
            {snapshot.formulaExplanation && <section className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><p className="text-[10px] font-semibold text-[#64748B]">本次计算说明</p><p className="mt-1 text-[11px] leading-relaxed text-[#334155]">{snapshot.formulaExplanation}</p></section>}
            {citations.map((citation) => (
              <section key={`${citation.kind}-${citation.id}`} className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /><div><p className="text-[10px] font-semibold text-[#64748B]">{citation.kind === 'METRIC_DEFINITION' ? '本次指标口径' : citation.kind === 'CALCULATION_PLAN' ? '本次计算依据' : '本次数据来源'}</p><h4 className="mt-0.5 text-sm font-bold text-[#0F172A]">{citation.label}</h4><p className="mt-0.5 font-mono text-[11px] text-[#2563EB]">{citation.version ? `版本 ${citation.version}` : '本次服务未返回版本'}</p></div></div>
                {citation.definition && <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[11px] leading-relaxed"><dt className="text-[#64748B]">含义</dt><dd className="text-[#334155]">{citation.definition.meaning ?? '本次未提供'}</dd><dt className="text-[#64748B]">单位</dt><dd className="text-[#334155]">{citation.definition.unit ?? '本次未提供'}</dd><dt className="text-[#64748B]">适用范围</dt><dd className="text-[#334155]">{citation.definition.scope ?? '本次未提供'}</dd><dt className="text-[#64748B]">时间语义</dt><dd className="text-[#334155]">{citation.definition.timeSemantics ?? '本次未提供'}</dd><dt className="text-[#64748B]">来源</dt><dd className="text-[#334155]">{citation.definition.source ?? '本次未提供'}</dd></dl>}
              </section>
            ))}
            <p className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-[11px] leading-relaxed text-[#1D4ED8]">依据只读取这份结果携带的快照；不会重新查询，也不会以当前定义替代。</p>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFCFF] p-3 text-[11px] text-[#64748B]">这份结果未提供可读取的定义或来源引用，不能以当前最新定义替代。</p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[#E2E8F0] bg-[#FAFAFA] p-4">
        {focus === 'RESULT' ? <span className="text-[11px] text-[#64748B]">当前只展示这份结果的原始快照。</span> : <button onClick={() => onFocusChange('RESULT')} className="rounded-lg px-3 py-1.5 text-xs text-[#2563EB] hover:bg-[#EFF6FF]">返回结果</button>}
        {focus === 'RESULT' && <button onClick={() => onFocusChange('EVIDENCE')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#2563EB] hover:bg-[#EFF6FF]">查看本次计算依据</button>}
      </div>
    </div>
  );
};
