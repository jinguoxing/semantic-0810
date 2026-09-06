import React from 'react';
import { Calculator, CheckCircle2, Loader2, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  AskPlanBinding,
  FindDataTaskState,
  ResultBriefBlock as ResultBriefBlockType,
  TaskActionCode
} from '../model/FindDataTask';

interface InlineAskReadyProps {
  block: ResultBriefBlockType;
  task: FindDataTaskState;
  onCheckPermission: (binding: AskPlanBinding) => Promise<void>;
  onRunPlan: (binding: AskPlanBinding) => Promise<void>;
  onActionClick: (actionCode: TaskActionCode, payload?: Record<string, unknown>) => void;
  error?: string;
}

function isCurrentBinding(task: FindDataTaskState, binding: AskPlanBinding): boolean {
  const plan = task.askPlan;
  return task.taskId === binding.taskId && plan?.id === binding.askPlanId &&
    plan.requirementRevision === binding.requirementRevision &&
    plan.basedOnSearchRevision === binding.searchRevision;
}

const formatRange = (range?: { start: string; end: string }) => range ? `${range.start} 至 ${range.end}` : '未登记';

/** A concise, current-state-derived confirmation for a specific Ask Plan. */
export const InlineAskReady: React.FC<InlineAskReadyProps> = ({
  block,
  task,
  onCheckPermission,
  onRunPlan,
  onActionClick,
  error
}) => {
  const brief = block.askReady;
  if (!brief) return null;
  const { binding } = brief;
  const current = isCurrentBinding(task, binding);
  const plan = current ? task.askPlan : undefined;
  const taskBusy = Boolean(task.pendingOperation);
  const checking = current && (plan?.permissionCheckState === 'CHECKING' || task.pendingOperation?.operationType === 'PERMISSION_CHECK');
  const running = current && (plan?.status === 'RUNNING' || task.pendingOperation?.operationType === 'ASK_RUN');
  const checkState = plan?.permissionCheckState;
  const isCompleted = plan?.status === 'COMPLETED' && Boolean(plan.lastRunResult?.success);

  const status = !current
    ? '当前需求或计划已变化，请使用最新分析计划。'
    : running
    ? '正在执行本次计算。'
    : checking
    ? '正在校验执行权限。'
    : isCompleted
    ? '本次计划已执行，结果见下方分析结果。'
    : checkState === 'ALLOWED'
    ? '执行权限已校验，可以开始计算。'
    : checkState === 'CHANGED'
    ? '权限发生变化，请重新校验后再决定是否执行。'
    : checkState === 'BLOCKED'
    ? (error ?? '当前无法执行，请检查权限或重新校验。')
    : '需要先校验执行权限。';

  const canCheck = current && !taskBusy && !running && !isCompleted;
  const canRun = current && !taskBusy && !checking && !running && !isCompleted && checkState === 'ALLOWED';

  return (
    <section className="w-full rounded-xl border border-[#D9E5F5] bg-[#FAFCFF] p-3 space-y-3" aria-label="本次计算确认">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] p-1 text-[#2563EB]">
          <Calculator className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-[#0F172A]">{block.title}</h4>
          <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-[#2563EB]">{brief.metricName}</p>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] leading-relaxed">
        <dt className="text-[#64748B]">区域</dt><dd className="min-w-0 text-[#334155]">{brief.region ?? '未登记'}</dd>
        <dt className="text-[#64748B]">请求期间</dt><dd className="min-w-0 text-[#334155]">{formatRange(brief.requestedTimeRange)}</dd>
        <dt className="text-[#64748B]">比较基准</dt><dd className="min-w-0 text-[#334155]">{brief.benchmarkLabel}</dd>
        {brief.coreResourceNames && brief.coreResourceNames.length > 0 && (
          <><dt className="text-[#64748B]">核心资源</dt><dd className="min-w-0 text-[#334155]">{brief.coreResourceNames.join('、')}</dd></>
        )}
      </dl>

      <p className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF]/60 px-2 py-1.5 text-[11px] leading-relaxed text-[#1D4ED8]">
        {brief.scopeDisclosure}
      </p>

      <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[#475569]" role="status" aria-live="polite">
        {checking || running ? <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-[#2563EB]" /> :
          isCompleted ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16A34A]" /> :
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64748B]" />}
        <span>{status}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canRun ? (
          <button
            type="button"
            onClick={() => void onRunPlan(binding)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8]"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> 确认并开始计算
          </button>
        ) : (
          <button
            type="button"
            disabled={!canCheck}
            onClick={() => void onCheckPermission(binding)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              canCheck ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]' : 'cursor-not-allowed bg-[#E2E8F0] text-[#94A3B8]'
            }`}
          >
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {checking ? '正在校验' : checkState === 'CHANGED' || checkState === 'BLOCKED' ? '重新校验执行权限' : '校验执行权限'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onActionClick('OPEN_ASK_PLAN', current ? { askPlanBinding: binding } : undefined)}
          className="rounded-lg border border-[#CBD5E1] px-2.5 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]"
        >
          {current ? '查看完整计划' : '查看最新分析计划'}
        </button>
      </div>
    </section>
  );
};
