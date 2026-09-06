import React from 'react';
import { Calculator, CheckCircle2, Edit3, FileText, Loader2, Play, RefreshCw, ShieldCheck, X } from 'lucide-react';
import {
  AskPlan,
  AskPlanBinding,
  AskPlanFocusSection,
  AskResultView,
  FindDataTaskState,
  PermissionCheckState
} from './model/FindDataTask';
import { PermissionRecheckResult } from './services/FindDataService';
import { buildAskResultSnapshot } from './presenters/conversationPresenters';
import { AskResultContent } from './blocks/AskResultContent';

interface RightWorkspaceAskPlanProps {
  task: FindDataTaskState;
  onCheckPermission: (binding: AskPlanBinding) => Promise<PermissionRecheckResult>;
  onRunPlan: (binding: AskPlanBinding) => Promise<void>;
  onReturnToSolution: () => void;
  onModifySpec?: () => void;
  onViewPermissionChanges?: () => void;
  onRegeneratePlan?: () => void;
  executionScopeDisclosure?: string;
  permissionCheckFailure?: string;
  focusSection?: AskPlanFocusSection;
  resultView?: AskResultView;
  focusRequestId?: string;
  focusTarget?: boolean;
  onFocusSection?: (section: AskPlanFocusSection, resultView?: AskResultView) => void;
  onClose: () => void;
}

const benchmarkCopy: Record<AskPlan['calculationSpec']['benchmarkRule'], { title: string; description: string }> = {
  RANK_ONLY: { title: '只展示街镇排名', description: '按计划中的派生指标计算各街镇结果并排序，不额外推导供给是否充足。' },
  WEIGHTED_DISTRICT_AVERAGE: { title: '与全区加权平均基准比较', description: '使用计划中的分子与分母计算全区加权平均基准。' },
  POLICY_TARGET: { title: '使用正式政策目标', description: '使用执行端已登记并核验的正式政策目标作为比较基准。' }
};

const sectionTitle: Record<AskPlanFocusSection, string> = {
  PLAN: '本次计算',
  RESULT: '分析结果',
  CALCULATION: '本次计算依据'
};

export const RightWorkspaceAskPlan: React.FC<RightWorkspaceAskPlanProps> = ({
  task,
  onCheckPermission,
  onRunPlan,
  onReturnToSolution,
  onModifySpec,
  onViewPermissionChanges,
  onRegeneratePlan,
  executionScopeDisclosure = '本次执行范围将在服务返回后确认。',
  permissionCheckFailure,
  focusSection = 'PLAN',
  resultView,
  onFocusSection,
  onClose
}) => {
  const plan = task.askPlan;
  if (!plan) {
    return (
      <div className="flex h-full w-full flex-col border-l border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-[#FAFAFA] px-5"><div className="flex items-center space-x-2.5"><Calculator className="h-4 w-4 text-[#2563EB]" /><h3 className="text-sm font-bold text-[#0F172A]">本次计算</h3></div><button onClick={onClose} aria-label="关闭分析计划" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"><X className="h-4 w-4" /></button></div>
        <div className="flex flex-1 flex-col items-center justify-center space-y-2 p-6 text-center text-xs"><Calculator className="h-10 w-10 text-[#CBD5E1]" /><p className="text-sm font-bold text-[#0F172A]">当前尚未生成分析计划</p><p className="max-w-xs text-[#64748B]">分析计划需要在完成找数据意图收敛、数据方案确认及核心指标权限就绪后生成。</p></div>
      </div>
    );
  }

  const lastRunResult = plan.lastRunResult;
  const hasExecuted = plan.status === 'COMPLETED' && Boolean(lastRunResult?.success);
  const resultSnapshot = lastRunResult ? buildAskResultSnapshot(task, plan, lastRunResult) : undefined;
  const activeSection = focusSection === 'RESULT' && !resultSnapshot ? 'PLAN' : focusSection;
  const checkState: PermissionCheckState = plan.permissionCheckState;
  const isChecking = checkState === 'CHECKING' || task.pendingOperation?.operationType === 'PERMISSION_CHECK';
  const isExecuting = plan.status === 'RUNNING' || task.pendingOperation?.operationType === 'ASK_RUN';
  const coreResources = plan.coreResourceIds.map((id) => task.resources[id]).filter(Boolean);
  const selectedBenchmark = benchmarkCopy[plan.calculationSpec.benchmarkRule];
  const planBinding: AskPlanBinding = {
    taskId: task.taskId,
    askPlanId: plan.id,
    requirementRevision: plan.requirementRevision ?? task.requirementRevision,
    searchRevision: plan.basedOnSearchRevision ?? task.searchRevision
  };
  const go = (section: AskPlanFocusSection, nextResultView?: AskResultView) => onFocusSection?.(section, nextResultView);
  const handleCheckPermission = async () => {
    if (!isChecking && !isExecuting) await onCheckPermission(planBinding);
  };
  const handleRunClick = async () => {
    if (checkState === 'ALLOWED' && !isChecking && !isExecuting && !hasExecuted) await onRunPlan(planBinding);
  };

  const PlanBody = () => (
    <div className="space-y-5">
      <section className="space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <div className="flex items-center justify-between"><span className="text-xs font-bold text-[#0F172A]">本次计算</span><span className="rounded border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">本次计算</span></div>
        <div className="text-sm font-bold text-[#2563EB]">{plan.calculationSpec.metricName}</div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[11px] leading-relaxed"><dt className="text-[#64748B]">时间</dt><dd className="text-[#334155]">{plan.timeRange ? `${plan.timeRange.start} 至 ${plan.timeRange.end}` : '未登记'}</dd><dt className="text-[#64748B]">计算类型</dt><dd className="text-[#334155]">本次计算</dd><dt className="text-[#64748B]">比较方式</dt><dd className="text-[#334155]">{selectedBenchmark.title}</dd></dl>
      </section>

      <section className="space-y-2"><div className="flex items-center space-x-1.5 border-b border-[#F1F5F9] pb-1 text-xs font-bold text-[#0F172A]"><span className="h-3.5 w-1.5 rounded-full bg-[#2563EB]" /><span>拟使用输入（{coreResources.length} 项）</span></div><div className="grid grid-cols-2 gap-2">{coreResources.map((resource) => <div key={resource.id} className="rounded-lg border border-[#E2E8F0] bg-white p-2.5"><div className="font-bold text-[#0F172A]">{resource.name}</div><div className="mt-0.5 text-[11px] text-[#64748B]">{resource.type} · {resource.granularity}</div></div>)}</div></section>

      <section className="space-y-2"><div className="flex items-center space-x-1.5 border-b border-[#F1F5F9] pb-1 text-xs font-bold text-[#0F172A]"><span className="h-3.5 w-1.5 rounded-full bg-[#2563EB]" /><span>公式与边界</span></div><div className="space-y-2 rounded-lg border border-[#E2E8F0] bg-white p-3"><p className="font-mono text-xs font-bold text-[#2563EB]">{plan.calculationSpec.formula}</p><p className="text-[11px] leading-relaxed text-[#64748B]">{plan.calculationSpec.formulaExplanation}</p><p className="text-[11px] leading-relaxed text-[#475569]">{selectedBenchmark.description} 分子「{plan.calculationSpec.numerator}」，分母「{plan.calculationSpec.denominator}」。</p>{plan.calculationSpec.benchmarkValue && <p className="text-[11px] text-[#475569]"><span className="font-semibold">计划登记基准：</span>{plan.calculationSpec.benchmarkValue}{plan.calculationSpec.benchmarkReference && ` · ${plan.calculationSpec.benchmarkReference}`}</p>}<p className="rounded border border-[#FEF3C7] bg-[#FFFBEB] p-2 text-[11px] text-[#92400E]"><span className="font-semibold">约束边界：</span>{plan.calculationSpec.strictConclusionBoundary}</p><p className="rounded border border-[#BFDBFE] bg-[#EFF6FF] p-2 text-[11px] leading-relaxed text-[#1D4ED8]"><span className="font-semibold">执行范围说明：</span>{executionScopeDisclosure}</p></div></section>

      {!hasExecuted && <section className="space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5"><div className="flex items-center justify-between"><div className="flex items-center space-x-2"><ShieldCheck className="h-4 w-4 text-[#2563EB]" /><span className="text-xs font-bold text-[#0F172A]">执行前权限校验</span></div><span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${checkState === 'ALLOWED' ? 'border-[#DCFCE7] bg-[#F0FDF4] text-[#16A34A]' : checkState === 'CHECKING' ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]' : checkState === 'BLOCKED' ? 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]' : checkState === 'CHANGED' ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]' : 'border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B]'}`}>{checkState === 'ALLOWED' ? '可以执行' : checkState === 'CHECKING' ? '核验中…' : checkState === 'BLOCKED' ? '当前无法执行' : checkState === 'CHANGED' ? '权限发生变化' : '尚未校验'}</span></div><p className="text-[11px] leading-relaxed text-[#64748B]">{checkState === 'ALLOWED' ? '核心资源查询权限已确认，可安全执行计算。' : checkState === 'CHECKING' ? '正在向权限服务核查资源查询权限快照…' : checkState === 'BLOCKED' ? permissionCheckFailure ?? '由于核心资源查询权限缺失，暂不可开始计算。' : checkState === 'CHANGED' ? '部分核心资源的查询权限自分析计划生成后发生变化，请先确认新的可执行范围。' : '系统要求在正式触发运算前显式完成权限状态校验。'}</p>{checkState === 'CHANGED' && <div className="flex flex-wrap gap-2"><button onClick={onViewPermissionChanges} className="rounded-md border border-[#CBD5E1] bg-white px-2.5 py-1 text-xs text-[#475569]">查看权限变化</button><button onClick={onReturnToSolution} className="rounded-md border border-[#CBD5E1] bg-white px-2.5 py-1 text-xs text-[#475569]">返回数据方案</button><button onClick={onRegeneratePlan} className="rounded-md bg-[#2563EB] px-2.5 py-1 text-xs text-white">重新生成分析计划</button></div>}</section>}
    </div>
  );

  const CalculationBody = () => (
    <div className="space-y-5"><section className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#2563EB]" /><h4 className="text-sm font-bold text-[#0F172A]">{plan.calculationSpec.metricName}</h4></div><dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[11px] leading-relaxed"><dt className="text-[#64748B]">公式</dt><dd className="font-mono text-[#2563EB]">{plan.calculationSpec.formula}</dd><dt className="text-[#64748B]">说明</dt><dd className="text-[#334155]">{plan.calculationSpec.formulaExplanation}</dd><dt className="text-[#64748B]">结论边界</dt><dd className="text-[#334155]">{plan.calculationSpec.strictConclusionBoundary}</dd></dl></section><section className="space-y-2"><div className="text-xs font-bold text-[#0F172A]">本次输入</div>{coreResources.map((resource) => <div key={resource.id} className="rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-[11px]"><div className="font-semibold text-[#0F172A]">{resource.name}</div><div className="mt-1 text-[#64748B]">{resource.type} · {resource.granularity}</div></div>)}</section>{resultSnapshot?.resultArtifact.citations?.length ? <section className="space-y-2"><div className="text-xs font-bold text-[#0F172A]">服务返回的依据</div><ul className="space-y-1 text-[11px] text-[#475569]">{resultSnapshot.resultArtifact.citations.map((citation) => <li key={`${citation.kind}-${citation.id}`}>{citation.label}{citation.version ? `（${citation.version}）` : ''}</li>)}</ul></section> : <p className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFCFF] p-3 text-[11px] text-[#64748B]">当前服务未返回额外的定义或来源引用；此处只展示本次计划已有的公式和输入。</p>}</div>
  );

  return (
    <div className="flex h-full w-full flex-col border-l border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-[#FAFAFA] px-5"><div className="flex items-center space-x-2.5"><div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]">{activeSection === 'RESULT' ? <CheckCircle2 className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}</div><div><div className="flex items-center gap-2"><h3 className="text-sm font-bold text-[#0F172A]">{sectionTitle[activeSection]}</h3>{activeSection === 'RESULT' && <span className="rounded border border-[#DCFCE7] bg-[#F0FDF4] px-1.5 py-0.5 text-[10px] font-bold text-[#16A34A]">已完成</span>}</div><p className="text-[11px] text-[#64748B]">{activeSection === 'RESULT' ? plan.calculationSpec.metricName : activeSection === 'CALCULATION' ? '与当前结果绑定的计划、公式和已有依据' : '确认范围、输入和执行前提'}</p></div></div><button onClick={onClose} aria-label="关闭分析计划" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]" title="关闭工作区"><X className="h-4 w-4" /></button></div>

      <div className="flex-1 overflow-y-auto p-5 text-xs">{activeSection === 'PLAN' ? <PlanBody /> : activeSection === 'RESULT' && resultSnapshot ? <AskResultContent snapshot={resultSnapshot} mode="full" fullView={resultView} onFullViewChange={(view) => go('RESULT', view)} /> : <CalculationBody />}</div>

      <div className="flex shrink-0 items-center justify-between border-t border-[#E2E8F0] bg-[#FAFAFA] p-4">
        <div className="flex items-center gap-2">{activeSection === 'PLAN' ? <><button onClick={onReturnToSolution} className="rounded-lg px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]">返回数据方案</button>{onModifySpec && !hasExecuted && <button onClick={onModifySpec} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[#475569] hover:bg-[#E2E8F0]"><Edit3 className="h-3.5 w-3.5" /><span>调整条件</span></button>}</> : activeSection === 'RESULT' ? <><button onClick={() => go('PLAN')} className="rounded-lg px-3 py-1.5 text-xs text-[#475569] hover:bg-[#E2E8F0]">查看计算方案</button><button onClick={() => go('CALCULATION', resultView)} className="rounded-lg px-3 py-1.5 text-xs text-[#2563EB] hover:bg-[#EFF6FF]">查看本次计算依据</button></> : <button onClick={() => go('RESULT', resultView)} className="rounded-lg px-3 py-1.5 text-xs text-[#2563EB] hover:bg-[#EFF6FF]">返回结果</button>}</div>
        {activeSection === 'PLAN' && (hasExecuted ? <button onClick={() => go('RESULT', resultView)} className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-bold text-white">查看结果</button> : checkState === 'ALLOWED' ? <button onClick={() => void handleRunClick()} disabled={isExecuting} className={`flex items-center gap-1.5 rounded-lg px-5 py-1.5 text-xs font-bold ${isExecuting ? 'cursor-not-allowed bg-[#F1F5F9] text-[#94A3B8]' : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'}`}>{isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}<span>{isExecuting ? '正在执行分析计算…' : '按此方案计算'}</span></button> : <button onClick={() => void handleCheckPermission()} disabled={isChecking || isExecuting} className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold ${isChecking || isExecuting ? 'cursor-not-allowed bg-[#F1F5F9] text-[#94A3B8]' : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'}`}>{isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}<span>{isChecking ? '正在校验' : checkState === 'CHANGED' || checkState === 'BLOCKED' ? '重新校验执行权限' : '校验执行权限'}</span></button>)}</div>
    </div>
  );
};
