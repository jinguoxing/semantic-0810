import React from 'react';
import { BarChart3, ExternalLink, FileText } from 'lucide-react';
import { AskResultSnapshot, TaskActionCode } from '../model/FindDataTask';
import { buildActualScopeLabel } from '../presenters/conversationPresenters';

interface AskResultContentProps {
  snapshot: AskResultSnapshot;
  mode: 'compact' | 'full';
  canOpenDetails?: boolean;
  onActionClick?: (actionCode: TaskActionCode, payload?: Record<string, unknown>) => void;
}

const dataOriginLabel = (origin: AskResultSnapshot['dataOrigin']) => {
  if (origin === 'MOCK_FIXTURE') return '演示数据';
  if (origin === 'LIVE_QUERY') return '实时查询服务';
  return '来源尚未提供';
};

/** Shared result body for the compact conversation block and the full workspace. */
export const AskResultContent: React.FC<AskResultContentProps> = ({
  snapshot,
  mode,
  canOpenDetails = false,
  onActionClick
}) => {
  const { resultArtifact } = snapshot;
  const displayRows = mode === 'compact' ? resultArtifact.townResults.slice(0, 5) : resultArtifact.townResults;
  const hasUnknownActualPeriod = !resultArtifact.actualScope?.timeRange;
  const actionPayload = { askPlanBinding: snapshot.binding, executedAt: snapshot.executedAt, operationId: snapshot.operationId };

  return (
    <section className={`w-full space-y-3 ${mode === 'compact' ? 'rounded-xl border border-[#D9E5F5] bg-[#FAFCFF] p-3' : ''}`} aria-label="分析结果">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E2E8F0] pb-2">
        <div className="flex min-w-0 items-start gap-2">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[#0F172A]">{snapshot.metricName}</h4>
            <p className="mt-0.5 text-[11px] text-[#64748B]">分子口径：{snapshot.numeratorLabel}</p>
          </div>
        </div>
        <span className="rounded border border-[#E2E8F0] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#64748B]">
          {dataOriginLabel(snapshot.dataOrigin)}
        </span>
      </div>

      <div className="space-y-1 text-[11px] leading-relaxed text-[#475569]">
        <p><span className="font-medium text-[#64748B]">实际范围：</span>{buildActualScopeLabel(resultArtifact.actualScope)}</p>
        {hasUnknownActualPeriod && <p className="text-[#B45309]">实际数据期间尚未提供。</p>}
      </div>

      <div className="rounded-lg border border-[#E2E8F0] bg-white p-2.5 space-y-1.5">
        <div className="text-[11px] font-semibold text-[#0F172A]">{resultArtifact.benchmarkLabel}</div>
        {resultArtifact.benchmarkValue && <div className="font-mono text-base font-bold text-[#2563EB]">{resultArtifact.benchmarkValue}</div>}
        <p className="text-[11px] leading-relaxed text-[#475569]">{resultArtifact.summary}</p>
        {resultArtifact.benchmarkReference && <p className="text-[10px] leading-relaxed text-[#64748B]">基准来源：{resultArtifact.benchmarkReference}</p>}
      </div>

      {(resultArtifact.totalPopulation || resultArtifact.totalBeds) && (
        <p className="text-[11px] leading-relaxed text-[#64748B]">
          本次返回汇总：60 岁以上常住人口约 {resultArtifact.totalPopulation ?? '未返回'}，{snapshot.numeratorLabel.replace('（正式指标）', '')}共 {resultArtifact.totalBeds ?? '未返回'}。
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-[10px] font-semibold text-[#64748B]">
          <span>街镇</span><span>结果</span><span>比较说明</span>
        </div>
        {displayRows.map((town, index) => (
          <div key={`${town.townName}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 border-b border-[#F1F5F9] px-2.5 py-2 text-[11px] last:border-b-0">
            <span className="truncate font-medium text-[#0F172A]">{town.townName}</span>
            <span className="font-mono font-semibold text-[#B45309]">{town.supplyRatio}</span>
            <span className="min-w-0 text-[#64748B]">{town.comparisonNote}</span>
          </div>
        ))}
      </div>
      {mode === 'compact' && resultArtifact.townResults.length > displayRows.length && (
        <p className="text-[10px] text-[#64748B]">展示本次返回结果中的前 {displayRows.length} 条。</p>
      )}

      <div className="border-t border-[#E2E8F0] pt-2 text-[11px] leading-relaxed text-[#64748B]">
        <span className="font-medium text-[#475569]">结论边界：</span>{resultArtifact.boundaryNotice}
      </div>

      {mode === 'compact' && onActionClick && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <button
            type="button"
            disabled={!canOpenDetails}
            onClick={() => onActionClick('OPEN_ASK_PLAN', { ...actionPayload, focusSection: 'RESULT' })}
            title={canOpenDetails ? '查看本次完整结果' : '当前工作区无法恢复这次历史结果的详情'}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              canOpenDetails ? 'border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]' : 'cursor-not-allowed border-[#E2E8F0] text-[#94A3B8]'
            }`}
          >
            <ExternalLink className="h-3.5 w-3.5" /> 查看完整结果
          </button>
          <button
            type="button"
            disabled={!canOpenDetails}
            onClick={() => onActionClick('OPEN_ASK_PLAN', { ...actionPayload, focusSection: 'CALCULATION' })}
            title={canOpenDetails ? '查看本次计算依据' : '当前工作区无法恢复这次历史结果的详情'}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              canOpenDetails ? 'text-[#2563EB] hover:bg-[#EFF6FF]' : 'cursor-not-allowed text-[#94A3B8]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> 查看计算依据
          </button>
        </div>
      )}
    </section>
  );
};
