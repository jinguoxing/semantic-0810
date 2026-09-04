import React, { useState } from 'react';
import { X, Calculator, CheckCircle2, ShieldCheck, Play, Edit3, Loader2, RefreshCw } from 'lucide-react';
import { AskPlan, FindDataTaskState, PermissionCheckState } from './model/FindDataTask';
import { PermissionRecheckResult } from './services/FindDataService';

interface RightWorkspaceAskPlanProps {
  task: FindDataTaskState;
  onCheckPermission: () => Promise<PermissionRecheckResult>;
  onRunPlan: () => Promise<void>;
  onReturnToSolution: () => void;
  onModifySpec?: () => void;
  onViewPermissionChanges?: () => void;
  onRegeneratePlan?: () => void;
  onClose: () => void;
}

const benchmarkCopy: Record<AskPlan['calculationSpec']['benchmarkRule'], { title: string; description: string }> = {
  RANK_ONLY: {
    title: '只展示街镇排名',
    description: '按计划中的派生指标计算各街镇结果并排序，不额外推导供给是否充足。'
  },
  WEIGHTED_DISTRICT_AVERAGE: {
    title: '与全区加权平均基准比较',
    description: '使用计划中的分子与分母计算全区加权平均基准。'
  },
  POLICY_TARGET: {
    title: '使用正式政策目标',
    description: '使用执行端已登记并核验的正式政策目标作为比较基准。'
  }
};

export const RightWorkspaceAskPlan: React.FC<RightWorkspaceAskPlanProps> = ({
  task,
  onCheckPermission,
  onRunPlan,
  onReturnToSolution,
  onModifySpec,
  onViewPermissionChanges,
  onRegeneratePlan,
  onClose
}) => {
  const plan = task.askPlan;
  const [isChecking, setIsChecking] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!plan) {
    return (
      <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200">
        <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
          <div className="flex items-center space-x-2.5">
            <Calculator className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Ask Data 分析计划</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2 text-xs">
          <Calculator className="w-10 h-10 text-[#CBD5E1]" />
          <p className="font-bold text-sm text-[#0F172A]">当前尚未生成分析计划</p>
          <p className="text-[#64748B] max-w-xs">
            分析计划需要在完成找数据意图收敛、数据方案确认及核心指标权限就绪后生成。
          </p>
        </div>
      </div>
    );
  }

  const lastRunResult = plan.lastRunResult;
  const hasExecuted = plan.status === 'COMPLETED' && !!lastRunResult?.success;
  const checkState: PermissionCheckState = plan.permissionCheckState;
  const coreResources = plan.coreResourceIds.map((id) => task.resources[id]).filter(Boolean);
  const selectedBenchmark = benchmarkCopy[plan.calculationSpec.benchmarkRule];

  const handleCheckPermission = async () => {
    if (isChecking || isExecuting) return;
    setIsChecking(true);
    try {
      await onCheckPermission();
    } finally {
      setIsChecking(false);
    }
  };

  const handleRunClick = async () => {
    if (checkState !== 'ALLOWED' || isChecking || isExecuting) return;
    setIsExecuting(true);
    try {
      await onRunPlan();
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">Ask Data 分析计划</h3>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] font-bold rounded border border-[#BFDBFE]">
                交接准备
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">由找数据方案转入分析计算的执行规划</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
          title="关闭工作区"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
        {/* Section 1: 本次分析计算定义 */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#0F172A]">一、本次分析计算定义</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] font-bold border border-[#FDE68A]">
              分析派生指标
            </span>
          </div>
          <div className="text-sm font-bold text-[#2563EB]">
            {plan.calculationSpec.metricName}
          </div>

          {/* Formula Display */}
          <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] font-mono text-xs text-[#1E293B] space-y-1">
            <div className="text-[10px] font-sans font-semibold text-[#64748B] mb-1">计算公式：</div>
            <div className="text-[#2563EB] font-bold">
              {plan.calculationSpec.formula}
            </div>
            <div className="text-[10px] font-sans text-[#94A3B8] pt-1 leading-relaxed">
              {plan.calculationSpec.formulaExplanation}
            </div>
          </div>
        </div>

        {/* Section 2: 核心输入指标 */}
        <div className="space-y-2">
          <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5 pb-1 border-b border-[#F1F5F9]">
            <span className="w-1.5 h-3.5 bg-[#2563EB] rounded-full" />
            <span>二、核心输入资源（{coreResources.length} 项）</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {coreResources.map((resource) => (
              <div key={resource.id} className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
                <div className="font-bold text-[#0F172A]">{resource.name}</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">{resource.type} · {resource.granularity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: 基准比对方式 */}
        <div className="space-y-2">
          <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5 pb-1 border-b border-[#F1F5F9]">
            <span className="w-1.5 h-3.5 bg-[#2563EB] rounded-full" />
            <span>三、基准比对规则与边界</span>
          </div>
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1.5">
            <div className="font-semibold text-[#0F172A]">
              {selectedBenchmark.title}
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              {selectedBenchmark.description} 分子「{plan.calculationSpec.numerator}」，分母「{plan.calculationSpec.denominator}」。
            </p>
            {plan.calculationSpec.benchmarkValue && (
              <div className="text-[11px] text-[#475569] leading-relaxed">
                <span className="font-semibold">计划登记基准：</span>
                {plan.calculationSpec.benchmarkValue}
                {plan.calculationSpec.benchmarkReference && ` · ${plan.calculationSpec.benchmarkReference}`}
              </div>
            )}
            <div className="p-2 bg-[#FFFBEB] rounded border border-[#FEF3C7] text-[11px] text-[#92400E]">
              <span className="font-semibold">约束边界：</span>
              {plan.calculationSpec.strictConclusionBoundary}
            </div>
          </div>
        </div>

        {/* Section 4: 权限校验状态机卡片 */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span className="font-bold text-[#0F172A]">执行前权限校验：</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 font-bold rounded border ${
                checkState === 'ALLOWED'
                  ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]'
                  : checkState === 'CHECKING'
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                  : checkState === 'BLOCKED'
                  ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                  : checkState === 'CHANGED'
                  ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                  : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
              }`}
            >
              {checkState === 'ALLOWED'
                ? '可以执行'
                : checkState === 'CHECKING'
                ? '核验中…'
                : checkState === 'BLOCKED'
                ? '当前无法执行'
                : checkState === 'CHANGED'
                ? '权限发生变化'
                : '尚未校验'}
            </span>
          </div>

          <div className="text-[11px] text-[#64748B] flex items-center justify-between">
            <span>
              {checkState === 'ALLOWED'
                ? '核心资源查询权限已确认，可安全执行计算。'
                : checkState === 'CHECKING'
                ? '正在向权限服务核查资源查询权限快照…'
                : checkState === 'BLOCKED'
                ? '由于核心资源查询权限缺失，暂不可开始计算。'
                : checkState === 'CHANGED'
                ? '部分核心资源的查询权限自分析计划生成后发生变化，请先确认新的可执行范围。'
                : '系统要求在正式触发运算前显式完成权限状态校验。'}
            </span>

            <button
              type="button"
              disabled={isChecking || isExecuting}
              onClick={handleCheckPermission}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                checkState === 'ALLOWED'
                  ? 'bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#475569]'
                  : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-2xs'
              }`}
            >
              {isChecking ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              <span>{checkState === 'ALLOWED' ? '重新校验' : '执行权限重校验'}</span>
            </button>
          </div>

          {checkState === 'CHANGED' && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={onViewPermissionChanges} className="px-2.5 py-1 rounded-md bg-white border border-[#CBD5E1] text-[#475569]">查看权限变化</button>
              <button onClick={onReturnToSolution} className="px-2.5 py-1 rounded-md bg-white border border-[#CBD5E1] text-[#475569]">返回数据方案</button>
              <button onClick={onRegeneratePlan} className="px-2.5 py-1 rounded-md bg-[#2563EB] text-white">重新生成分析计划</button>
            </div>
          )}
        </div>

        {/* Section 5: P0-15 隔离计算结果: 仅在执行后呈现 */}
        {hasExecuted && lastRunResult?.resultArtifact && (
          <div className="pt-4 pb-2 border-t border-[#E2E8F0] space-y-3.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2 font-bold text-[#0F172A]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span className="text-sm">分析执行结论与基线核查</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-mono border border-[#E2E8F0]">
                  {lastRunResult.dataOrigin === 'MOCK_FIXTURE' ? '演示数据' : '实时查询引擎'}
                </span>
                <span className="text-[11px] text-[#64748B]">{plan.timeRange?.end ? `${plan.timeRange.end} 最新月度` : '时间未指定'}</span>
              </div>
            </div>

            {/* Core Finding Text */}
            <div className="space-y-1 text-xs text-[#1E293B] leading-relaxed">
              <div className="font-semibold text-[#0F172A]">
                {lastRunResult.resultArtifact.benchmarkLabel}：
              </div>
              <p className="text-[#334155] leading-relaxed">
                {lastRunResult.resultArtifact.summary}
              </p>
              {lastRunResult.resultArtifact.benchmarkValue && (
                <div className="font-mono text-sm text-[#2563EB] font-bold">
                  {lastRunResult.resultArtifact.benchmarkValue}
                </div>
              )}
              {(lastRunResult.resultArtifact.totalPopulation || lastRunResult.resultArtifact.totalBeds) && (
                <p className="text-[11px] text-[#64748B]">
                  全区 60 岁以上常住人口约 {lastRunResult.resultArtifact.totalPopulation ?? '未返回'}，在营可用养老床位共{' '}
                  {lastRunResult.resultArtifact.totalBeds ?? '未返回'}。
                </p>
              )}
              {lastRunResult.resultArtifact.benchmarkReference && (
                <p className="text-[11px] text-[#64748B]">
                  基准来源：{lastRunResult.resultArtifact.benchmarkReference}
                </p>
              )}
            </div>

            {/* Town Result Text List */}
            <div className="space-y-1.5 text-xs text-[#1E293B] leading-relaxed">
              <div className="font-semibold text-[#0F172A]">
                街镇结果：
              </div>
              <ul className="space-y-1.5 pl-1">
                {lastRunResult.resultArtifact.townResults.map((town, idx) => (
                  <li key={idx} className="flex items-baseline space-x-2 text-xs">
                    <span className="text-[#94A3B8]">•</span>
                    <span className="font-medium text-[#0F172A]">{town.townName}：</span>
                    <span className="font-mono font-bold text-[#D97706]">{town.supplyRatio}</span>
                    <span className="text-[11px] text-[#64748B]">（{town.comparisonNote}）</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strict Conclusion Boundary Notice as Plain Text */}
            <div className="pt-2 text-[11px] text-[#64748B] leading-relaxed border-t border-[#F1F5F9] space-y-1">
              <div className="font-semibold text-[#475569]">结论合规与边界声明：</div>
              <p className="text-[#64748B] leading-relaxed">
                {lastRunResult.resultArtifact.boundaryNotice}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={onReturnToSolution}
            className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
          >
            返回数据方案
          </button>
          {onModifySpec && (
            <button
              onClick={onModifySpec}
              className="px-3 py-1.5 text-xs text-[#475569] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>修改口径</span>
            </button>
          )}
        </div>

        <button
          onClick={handleRunClick}
          disabled={checkState !== 'ALLOWED' || isChecking || isExecuting}
          className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center space-x-1.5 ${
            checkState === 'ALLOWED' && !isChecking && !isExecuting
              ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer'
              : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed'
          }`}
        >
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>
            {isExecuting
              ? '正在执行分析计算…'
              : hasExecuted
              ? '重新运行分析'
              : '确认并开始计算'}
          </span>
        </button>
      </div>
    </div>
  );
};
