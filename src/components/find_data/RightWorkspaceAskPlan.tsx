import React, { useState } from 'react';
import { X, Calculator, CheckCircle2, ShieldCheck, Play, Edit3, AlertCircle, Loader2 } from 'lucide-react';
import { FindDataTaskState } from './model/FindDataTask';

interface RightWorkspaceAskPlanProps {
  task: FindDataTaskState;
  onRunPlan: () => Promise<void>;
  onReturnToSolution: () => void;
  onModifySpec?: () => void;
  onClose: () => void;
}

export const RightWorkspaceAskPlan: React.FC<RightWorkspaceAskPlanProps> = ({
  task,
  onRunPlan,
  onReturnToSolution,
  onModifySpec,
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plan = task.askPlan;
  const lastRunResult = plan?.lastRunResult;
  const isRunning = plan?.status === 'RUNNING' || isSubmitting;
  const hasExecuted = plan?.status === 'COMPLETED' && !!lastRunResult?.success;
  const checkState = plan?.permissionCheckState || 'NOT_CHECKED';

  const handleRunClick = async () => {
    if (isRunning) return;
    setIsSubmitting(true);
    try {
      await onRunPlan();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200 select-none">
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
                交接准备完成
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
        {/* Section 1: 本次分析计算 */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#0F172A]">一、本次分析计算定义</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] font-bold border border-[#FDE68A]">
              本次分析计算 · 非正式指标
            </span>
          </div>
          <div className="text-sm font-bold text-[#2563EB]">
            {plan?.calculationSpec.metricName || '每千名 60 岁以上常住人口养老床位数'}
          </div>

          {/* Formula Display */}
          <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] font-mono text-xs text-[#1E293B] space-y-1">
            <div className="text-[10px] font-sans font-semibold text-[#64748B] mb-1">计算公式：</div>
            <div className="text-[#2563EB] font-bold">
              {plan?.calculationSpec.formula || '( 在营可用养老床位数 ÷ 60 岁以上常住人口数 ) × 1000'}
            </div>
            <div className="text-[10px] font-sans text-[#94A3B8] pt-1 leading-relaxed">
              {plan?.calculationSpec.formulaExplanation || '* 分子：在营可用床位；分母：60 岁及以上常住人口；乘以 1000 换算为千人床位数。'}
            </div>
          </div>
        </div>

        {/* Section 2: 核心输入指标 */}
        <div className="space-y-2">
          <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5 pb-1 border-b border-[#F1F5F9]">
            <span className="w-1.5 h-3.5 bg-[#2563EB] rounded-full" />
            <span>二、核心输入（2项正式指标）</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
              <div className="font-bold text-[#0F172A]">60 岁以上常住人口数</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">正式指标 · 街镇 × 月份</div>
            </div>
            <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
              <div className="font-bold text-[#0F172A]">在营可用养老床位数</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">正式指标 · 街镇 × 月份</div>
            </div>
          </div>
        </div>

        {/* Section 3: 基准比对方式 */}
        <div className="space-y-2">
          <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5 pb-1 border-b border-[#F1F5F9]">
            <span className="w-1.5 h-3.5 bg-[#2563EB] rounded-full" />
            <span>三、基准比对规则</span>
          </div>
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
            <div className="font-semibold text-[#0F172A]">与全区加权平均基准比较</div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              以全区 14 个街镇总在营可用床位数与总 60 岁以上老年人口计算加权基准比率（24.8 张/千人），识别显著偏离均值的街镇。
            </p>
          </div>
        </div>

        {/* Section 4: 权限校验说明 */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span className="font-semibold text-[#0F172A]">执行前安全校验：</span>
            <span className="text-[#64748B]">
              {checkState === 'NOT_CHECKED'
                ? '将在执行前重新校验核心资源的查询权限。'
                : checkState === 'CHECKING'
                ? '正在核验查询权限…'
                : '核心指标查询权限已校验通过'}
            </span>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 font-bold rounded border ${
              checkState === 'ALLOWED'
                ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]'
                : checkState === 'CHECKING'
                ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
            }`}
          >
            {checkState === 'ALLOWED'
              ? '已通过'
              : checkState === 'CHECKING'
              ? '核验中'
              : '执行前自动触发'}
          </span>
        </div>

        {/* Execution Results View - Text based presentation, no cards */}
        {hasExecuted && lastRunResult?.resultArtifact && (
          <div className="pt-4 pb-2 border-t border-[#E2E8F0] space-y-3.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2 font-bold text-[#0F172A]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span className="text-sm">分析执行结论与基线核查</span>
              </div>
              <span className="text-[11px] text-[#64748B]">2026.08 最新月度</span>
            </div>

            {/* Core Finding Text */}
            <div className="space-y-1 text-xs text-[#1E293B] leading-relaxed">
              <div className="font-semibold text-[#0F172A]">全区基准供给水平：</div>
              <p className="text-[#334155] leading-relaxed">
                全区加权平均供给水平为{' '}
                <strong className="font-mono text-sm text-[#2563EB] font-bold">
                  {lastRunResult.resultArtifact.districtWeightedAverage}
                </strong>
                。全区 60 岁以上常住人口约 {lastRunResult.resultArtifact.totalPopulation}，在营可用养老床位共{' '}
                {lastRunResult.resultArtifact.totalBeds}。
              </p>
            </div>

            {/* Low Supply Towns Text List */}
            <div className="space-y-1.5 text-xs text-[#1E293B] leading-relaxed">
              <div className="font-semibold text-[#0F172A]">
                识别相对供给水平偏低街镇（建议进一步核查）：
              </div>
              <ul className="space-y-1.5 pl-1">
                {lastRunResult.resultArtifact.lowSupplyTowns.map((town, idx) => (
                  <li key={idx} className="flex items-baseline space-x-2 text-xs">
                    <span className="text-[#94A3B8]">•</span>
                    <span className="font-medium text-[#0F172A]">{town.townName}：</span>
                    <span className="font-mono font-bold text-[#D97706]">{town.supplyRatio}</span>
                    <span className="text-[11px] text-[#64748B]">（{town.differencePct}）</span>
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
          disabled={isRunning}
          className={`px-5 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5 ${
            isRunning ? 'bg-[#93C5FD] cursor-not-allowed' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
          }`}
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>
            {isRunning
              ? '正在重新校验权限并运行…'
              : hasExecuted
              ? '重新运行分析'
              : '确认并运行'}
          </span>
        </button>
      </div>
    </div>
  );
};
