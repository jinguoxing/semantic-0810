import React from 'react';
import { BarChart3, ExternalLink, FileText, Table2 } from 'lucide-react';
import {
  AskResultSnapshot,
  AskResultTableContent,
  AskResultView,
  ResultTargetRef,
  ResultCell,
  TaskActionCode
} from '../model/FindDataTask';
import { buildActualScopeLabel } from '../presenters/conversationPresenters';

interface AskResultContentProps {
  snapshot: AskResultSnapshot;
  /** The exact conversation location of this snapshot; absent only for legacy standalone use. */
  resultTarget?: ResultTargetRef;
  mode: 'compact' | 'full';
  canOpenDetails?: boolean;
  fullView?: AskResultView;
  onFullViewChange?: (view: AskResultView) => void;
  onActionClick?: (actionCode: TaskActionCode, payload?: Record<string, unknown>) => void;
}

const dataOriginLabel = (snapshot: AskResultSnapshot) => {
  if (snapshot.dataOrigin === 'MOCK_FIXTURE') {
    return 'kind' in snapshot.binding && snapshot.binding.kind === 'DIRECT_METRIC' ? '设计演示数据' : '演示数据';
  }
  if (snapshot.dataOrigin === 'LIVE_QUERY') return '实时查询服务';
  return '来源尚未提供';
};

function resultStateLabel(cell: ResultCell): string {
  if (cell.state === 'NULL') return '服务返回空值';
  if (cell.state === 'MISSING') return '未提供';
  if (cell.state === 'SUPPRESSED') return '已抑制';
  if (cell.state === 'NOT_COMPUTABLE') return cell.reason ? `不可计算：${cell.reason}` : '不可计算';
  if (cell.kind === 'TEXT') return cell.value ?? '未提供';
  if (typeof cell.value !== 'number') return '未提供';
  const formatted = cell.value.toLocaleString('zh-CN', {
    minimumFractionDigits: cell.precision,
    maximumFractionDigits: cell.precision
  });
  return `${formatted}${cell.unit ? ` ${cell.unit}` : ''}`;
}

function structuredChartRows(content: AskResultTableContent) {
  if (!content.chart) return [];
  return content.rows.flatMap((row) => {
    const category = row.cells[content.chart!.categoryColumnId];
    const value = row.cells[content.chart!.valueColumnId];
    if (category?.kind !== 'TEXT' || category.state !== 'VALUE' || !category.value) return [];
    if (value?.kind !== 'NUMBER' || value.state !== 'VALUE' || typeof value.value !== 'number') return [];
    return [{ id: row.id, label: category.value, value }];
  });
}

const ResultTable: React.FC<{ content: AskResultTableContent; compact: boolean }> = ({ content, compact }) => {
  const rows = compact ? content.rows.slice(0, 5) : content.rows;
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white">
        <table className="w-full min-w-max border-collapse text-left text-[11px]">
          <thead className="bg-[#F8FAFC] text-[10px] font-semibold text-[#64748B]">
            <tr>
              {content.columns.map((column) => (
                <th key={column.id} className="border-b border-[#E2E8F0] px-2.5 py-1.5 font-semibold">
                  {column.label}{column.unit ? `（${column.unit}）` : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#F1F5F9] last:border-b-0">
                {content.columns.map((column) => {
                  const cell = row.cells[column.id];
                  return (
                    <td key={column.id} className="px-2.5 py-2 align-top text-[#475569]">
                      <span className={cell?.kind === 'NUMBER' && cell.state === 'VALUE' ? 'font-mono font-semibold text-[#B45309]' : ''}>
                        {cell ? resultStateLabel(cell) : '未提供'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-2.5 py-3 text-[#64748B]" colSpan={content.columns.length}>本次结果未返回可展示的数据行。</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {compact && content.rows.length > rows.length && (
        <p className="text-[10px] text-[#64748B]">展示本次返回结果中的前 {rows.length} 条。</p>
      )}
    </>
  );
};

const LegacyResultTable: React.FC<{ rows: NonNullable<AskResultSnapshot['resultArtifact']['townResults']>; compact: boolean }> = ({ rows, compact }) => {
  const displayRows = compact ? rows.slice(0, 5) : rows;
  return (
    <>
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
        {displayRows.length === 0 && <p className="px-2.5 py-3 text-[11px] text-[#64748B]">本次结果未返回可展示的数据行。</p>}
      </div>
      {compact && rows.length > displayRows.length && (
        <p className="text-[10px] text-[#64748B]">展示本次返回结果中的前 {displayRows.length} 条。</p>
      )}
    </>
  );
};

const ResultBarChart: React.FC<{ content: AskResultTableContent }> = ({ content }) => {
  const rows = structuredChartRows(content);
  const maximum = Math.max(0, ...rows.map((row) => row.value.value ?? 0));
  const unit = rows[0]?.value.unit;
  const title = content.chart?.title ?? '结果比较图表';
  if (!content.chart || rows.length === 0) {
    return <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFCFF] px-3 py-5 text-center text-[11px] text-[#64748B]">当前结构化结果不足以绘制图表；请查看数据视图。</div>;
  }
  const allValuesAreZero = maximum === 0;
  return (
    <figure className="rounded-lg border border-[#E2E8F0] bg-white p-3" data-testid="ask-result-chart">
      <figcaption className="mb-3 text-xs font-semibold text-[#0F172A]">{title}{unit ? `（${unit}）` : ''}</figcaption>
      <div className="space-y-3" role="img" aria-label={`${title}：${rows.map((row) => `${row.label} ${resultStateLabel(row.value)}`).join('；')} `}>
        {rows.map((row) => {
          const ratio = allValuesAreZero ? 0 : ((row.value.value ?? 0) / maximum) * 100;
          return (
            <div key={row.id} className="grid grid-cols-[minmax(5rem,1fr)_minmax(0,3fr)_auto] items-center gap-2 text-[11px]">
              <span className="truncate font-medium text-[#334155]">{row.label}</span>
              <div className="h-5 overflow-hidden rounded bg-[#EFF6FF]" aria-hidden="true"><div className="h-full rounded bg-[#2563EB]" style={{ width: `${ratio}%` }} /></div>
              <span className="font-mono font-semibold text-[#2563EB]">{resultStateLabel(row.value)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-[#64748B]">{allValuesAreZero ? '本次服务返回的所有可绘制数值均为 0。' : '图表从 0 起点展示本次服务返回的结构化数值。'}</p>
    </figure>
  );
};

/** Shared result body for the compact conversation block and the full workspace. */
export const AskResultContent: React.FC<AskResultContentProps> = ({
  snapshot,
  resultTarget,
  mode,
  canOpenDetails = false,
  fullView,
  onFullViewChange,
  onActionClick
}) => {
  const { resultArtifact } = snapshot;
  const structuredTable = resultArtifact.content?.kind === 'TABLE' ? resultArtifact.content : undefined;
  const scalar = resultArtifact.content?.kind === 'SCALAR' ? resultArtifact.content : undefined;
  const hasChart = structuredTable ? structuredChartRows(structuredTable).length > 0 : false;
  const selectedFullView: AskResultView = hasChart && fullView !== 'DATA' ? 'CHART' : 'DATA';
  const legacyRows = resultArtifact.townResults ?? [];
  const isDirectMetricResult = 'kind' in snapshot.binding && snapshot.binding.kind === 'DIRECT_METRIC';
  const hasUnknownActualPeriod = !resultArtifact.actualScope?.timeRange;
  const actionPayload = {
    resultTarget,
    resultView: hasChart ? 'CHART' as const : 'DATA' as const
  };

  return (
    <section className={`w-full space-y-3 ${mode === 'compact' ? 'rounded-xl border border-[#D9E5F5] bg-[#FAFCFF] p-3' : ''}`} aria-label="分析结果">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E2E8F0] pb-2">
        <div className="flex min-w-0 items-start gap-2"><BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /><div className="min-w-0"><h4 className="text-xs font-semibold text-[#0F172A]">{snapshot.metricName}</h4><p className="mt-0.5 text-[11px] text-[#64748B]">分子口径：{snapshot.numeratorLabel}</p></div></div>
        <span className="rounded border border-[#E2E8F0] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#64748B]">{dataOriginLabel(snapshot)}</span>
      </div>

      <div className="space-y-1 text-[11px] leading-relaxed text-[#475569]"><p><span className="font-medium text-[#64748B]">实际范围：</span>{buildActualScopeLabel(resultArtifact.actualScope)}</p>{hasUnknownActualPeriod && <p className="text-[#B45309]">实际数据期间尚未提供。</p>}</div>

      {scalar && <div className="rounded-lg border border-[#E2E8F0] bg-white p-3"><div className="text-[11px] font-semibold text-[#0F172A]">{scalar.label}</div><div className="mt-1 font-mono text-lg font-bold text-[#2563EB]">{resultStateLabel(scalar.value)}</div></div>}

      {(resultArtifact.benchmarkLabel || resultArtifact.summary) && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-2.5 space-y-1.5">
          {resultArtifact.benchmarkLabel && <div className="text-[11px] font-semibold text-[#0F172A]">{resultArtifact.benchmarkLabel}</div>}
          {resultArtifact.benchmarkValue && <div className="font-mono text-base font-bold text-[#2563EB]">{resultArtifact.benchmarkValue}</div>}
          {resultArtifact.summary && <p className="text-[11px] leading-relaxed text-[#475569]">{resultArtifact.summary}</p>}
          {resultArtifact.benchmarkReference && <p className="text-[10px] leading-relaxed text-[#64748B]">基准来源：{resultArtifact.benchmarkReference}</p>}
        </div>
      )}

      {(resultArtifact.totalPopulation || resultArtifact.totalBeds) && <p className="text-[11px] leading-relaxed text-[#64748B]">本次返回汇总：60 岁以上常住人口约 {resultArtifact.totalPopulation ?? '未返回'}，{snapshot.numeratorLabel.replace('（正式指标）', '')}共 {resultArtifact.totalBeds ?? '未返回'}。</p>}

      {mode === 'full' && hasChart && <div className="grid grid-cols-2 rounded-lg bg-[#F1F5F9] p-1" role="tablist" aria-label="结果视图">{(['CHART', 'DATA'] as const).map((view) => <button key={view} type="button" role="tab" aria-selected={selectedFullView === view} onClick={() => onFullViewChange?.(view)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${selectedFullView === view ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B] hover:text-[#334155]'}`}>{view === 'CHART' ? '图表' : '数据'}</button>)}</div>}

      {mode === 'full' && selectedFullView === 'CHART' && structuredTable
        ? <ResultBarChart content={structuredTable} />
        : structuredTable
        ? <ResultTable content={structuredTable} compact={mode === 'compact'} />
        : legacyRows.length > 0
        ? <LegacyResultTable rows={legacyRows} compact={mode === 'compact'} />
        : !scalar
        ? <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFCFF] px-3 py-5 text-center text-[11px] text-[#64748B]">本次结果没有可展示的数值或数据行。</div>
        : null}

      {resultArtifact.citations && resultArtifact.citations.length > 0 && <div className="rounded-lg border border-[#E2E8F0] bg-[#FAFCFF] px-2.5 py-2 text-[11px] leading-relaxed text-[#475569]"><span className="font-medium text-[#334155]">已有依据：</span>{resultArtifact.citations.map((citation) => `${citation.label}${citation.version ? `（${citation.version}）` : ''}`).join('；')}</div>}
      {resultArtifact.boundaryNotice && <div className="border-t border-[#E2E8F0] pt-2 text-[11px] leading-relaxed text-[#64748B]"><span className="font-medium text-[#475569]">结论边界：</span>{resultArtifact.boundaryNotice}</div>}

      {mode === 'compact' && onActionClick && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {!resultTarget && isDirectMetricResult ? <>
            <button type="button" disabled={!canOpenDetails} onClick={() => onActionClick('OPEN_METRIC_RESULT', { directMetricBinding: snapshot.binding, executedAt: snapshot.executedAt })} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${canOpenDetails ? 'border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]' : 'cursor-not-allowed border-[#E2E8F0] text-[#94A3B8]'}`}><ExternalLink className="h-3.5 w-3.5" /> 查看完整结果</button>
            <button type="button" disabled={!canOpenDetails} onClick={() => onActionClick('OPEN_METRIC_DEFINITION', { directMetricBinding: snapshot.binding, executedAt: snapshot.executedAt })} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${canOpenDetails ? 'text-[#2563EB] hover:bg-[#EFF6FF]' : 'cursor-not-allowed text-[#94A3B8]'}`}><FileText className="h-3.5 w-3.5" /> 查看指标口径</button>
          </> : <>
            <button type="button" disabled={!canOpenDetails || !resultTarget} onClick={() => onActionClick('OPEN_RESULT_DETAIL', actionPayload)} title={canOpenDetails && resultTarget ? '查看本次完整结果' : '当前工作区无法打开这份历史结果'} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${canOpenDetails && resultTarget ? 'border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]' : 'cursor-not-allowed border-[#E2E8F0] text-[#94A3B8]'}`}><ExternalLink className="h-3.5 w-3.5" /> 查看完整结果</button>
            <button type="button" disabled={!canOpenDetails || !resultTarget} onClick={() => onActionClick('OPEN_RESULT_EVIDENCE', actionPayload)} title={canOpenDetails && resultTarget ? '查看本次实际引用的依据' : '当前工作区无法打开这份历史结果的依据'} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${canOpenDetails && resultTarget ? 'text-[#2563EB] hover:bg-[#EFF6FF]' : 'cursor-not-allowed text-[#94A3B8]'}`}><FileText className="h-3.5 w-3.5" /> 查看本次依据</button>
            <button type="button" disabled={!canOpenDetails || !resultTarget} onClick={() => onActionClick('INTERPRET_RESULT', actionPayload)} title={canOpenDetails && resultTarget ? '继续解读这份结果' : '当前工作区无法引用这份历史结果'} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${canOpenDetails && resultTarget ? 'text-[#2563EB] hover:bg-[#EFF6FF]' : 'cursor-not-allowed text-[#94A3B8]'}`}><FileText className="h-3.5 w-3.5" /> 解读这份结果</button>
          </>}
        </div>
      )}

      {mode === 'full' && !hasChart && structuredTable && <p className="flex items-center gap-1 text-[10px] text-[#64748B]"><Table2 className="h-3 w-3" /> 当前结果未提供可绘图的数值列，仅显示数据视图。</p>}
    </section>
  );
};
