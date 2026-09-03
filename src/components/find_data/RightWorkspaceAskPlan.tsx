import React, { useState } from 'react';
import { X, Calculator, CheckCircle2, ShieldCheck, Play, ArrowLeft, Edit3, AlertCircle, BarChart3 } from 'lucide-react';

interface RightWorkspaceAskPlanProps {
  onClose: () => void;
  onReturnToSolution: () => void;
  onModifySpec: () => void;
}

export const RightWorkspaceAskPlan: React.FC<RightWorkspaceAskPlanProps> = ({
  onClose,
  onReturnToSolution,
  onModifySpec
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);

  const handleRunExecution = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasExecuted(true);
    }, 800);
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
            每千名 60 岁以上常住人口养老床位数
          </div>
          {/* Formula Display */}
          <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] font-mono text-xs text-[#1E293B] space-y-1">
            <div className="text-[10px] font-sans font-semibold text-[#64748B] mb-1">计算公式：</div>
            <div className="flex items-center space-x-2 text-[#2563EB] font-bold">
              <span>( 在营可用养老床位数 ÷ 60 岁以上常住人口数 ) × 1000</span>
            </div>
            <div className="text-[10px] font-sans text-[#94A3B8] pt-1">
              * 分子：在营可用床位；分母：60 岁及以上常住人口。
            </div>
          </div>
        </div>

        {/* Section 2: 核心输入 */}
        <div className="space-y-2">
          <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5 pb-1 border-b border-[#F1F5F9]">
            <span className="w-1.5 h-3.5 bg-[#2563EB] rounded-full" />
            <span>二、核心输入（2项）</span>
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

        {/* Section 3: 条件性资源 */}
        <div className="space-y-2">
          <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5 pb-1 border-b border-[#F1F5F9]">
            <span className="w-1.5 h-3.5 bg-[#64748B] rounded-full" />
            <span>三、条件性资源（1项）</span>
          </div>
          <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[#475569]">
            <span className="font-bold text-[#0F172A]">行政区划：</span>
            <span>仅在街镇编码和标准名称需要统一映射时使用，不直接参与数值运算。</span>
          </div>
        </div>

        {/* Section 4: 不进入本次计算 */}
        <div className="space-y-2">
          <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5 pb-1 border-b border-[#F1F5F9]">
            <span className="w-1.5 h-3.5 bg-[#94A3B8] rounded-full" />
            <span>四、不进入本次计算的资源与角色界定</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg divide-y divide-[#E2E8F0] text-[11px] text-[#64748B]">
            <div className="p-2 flex items-center justify-between">
              <span className="font-medium text-[#334155]">养老机构基本信息</span>
              <span>仅用于结果下钻（解释床位由哪些机构提供）</span>
            </div>
            <div className="p-2 flex items-center justify-between">
              <span className="font-medium text-[#334155]">常住人口月度快照</span>
              <span>仅用于人口趋势与人员明细下钻</span>
            </div>
            <div className="p-2 flex items-center justify-between">
              <span className="font-medium text-[#334155]">人口基本信息视图</span>
              <span>当前聚合分析不需要，排除在执行外</span>
            </div>
            <div className="p-2 flex items-center justify-between">
              <span className="font-medium text-[#334155]">居家养老服务订单</span>
              <span>不参与本次床位供给比率计算</span>
            </div>
          </div>
        </div>

        {/* Section 5: 时间与粒度 */}
        <div className="space-y-2">
          <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5 pb-1 border-b border-[#F1F5F9]">
            <span className="w-1.5 h-3.5 bg-[#2563EB] rounded-full" />
            <span>五、时间与粒度口径</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[#94A3B8] block">分析时间窗</span>
              <span className="font-semibold text-[#0F172A]">2025 年 9 月至 2026 年 8 月</span>
            </div>
            <div className="p-2 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[#94A3B8] block">聚合粒度</span>
              <span className="font-semibold text-[#0F172A]">街镇 × 月份</span>
            </div>
            <div className="p-2 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[#94A3B8] block">人口口径</span>
              <span className="font-semibold text-[#0F172A]">60 岁及以上常住人口</span>
            </div>
            <div className="p-2 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[#94A3B8] block">床位口径</span>
              <span className="font-semibold text-[#0F172A]">在营机构可用养老床位</span>
            </div>
          </div>
        </div>

        {/* Section 6: 比较基准 */}
        <div className="p-3.5 bg-[#EFF6FF]/50 border border-[#BFDBFE] rounded-xl space-y-2">
          <div className="font-bold text-xs text-[#1E3A8A]">六、比较基准：全区加权平均</div>
          <div className="font-mono text-xs text-[#2563EB] p-2 bg-white rounded border border-[#BFDBFE]">
            全区在营可用养老床位总数 ÷ 全区 60 岁以上常住人口总数 × 1000
          </div>
          <p className="text-[10px] text-[#3B82F6] leading-relaxed">
            * 严格采用加权平均基准，严禁对各街镇比率直接做简单算术平均。
          </p>
        </div>

        {/* Section 7: 输出预期 */}
        <div className="space-y-1.5 text-[11px] text-[#64748B]">
          <div className="font-bold text-xs text-[#0F172A]">七、预期输出结果</div>
          <ul className="list-disc list-inside space-y-0.5">
            <li>各街镇月度供给水平及变化走势</li>
            <li>各街镇与全区加权平均的相对离差</li>
            <li>相对供给水平偏低、需要进一步核查的街镇清单</li>
            <li>完整结果计算依据与可追溯口径</li>
          </ul>
        </div>

        {/* Section 8: 权限校验说明 */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span className="font-semibold text-[#0F172A]">执行前安全策略：</span>
            <span className="text-[#64748B]">执行前重新校验查询权限</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] font-bold rounded border border-[#DCFCE7]">
            已通过校验
          </span>
        </div>

        {/* Execution Results View (if executed) */}
        {hasExecuted && (
          <div className="p-4 bg-[#F0FDF4]/60 border border-[#86EFAC] rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#166534]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>分析执行完成 · 基线核查结果</span>
              </div>
              <span className="text-[10px] text-[#64748B]">2026.08 最新月度</span>
            </div>

            {/* Findings obeying strict boundary */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-[#DCFCE7] space-y-1">
                <div className="font-bold text-[#0F172A] flex items-center justify-between">
                  <span>全区加权平均供给水平：</span>
                  <span className="font-mono text-[#2563EB]">24.8 张 / 千人</span>
                </div>
                <div className="text-[11px] text-[#64748B]">
                  全区 60 岁以上常住人口约 41.2 万人，在营可用养老床位共 10,218 张。
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-[#DCFCE7] space-y-1.5">
                <div className="font-bold text-[#0F172A]">识别相对供给水平偏低街镇（建议进一步核查）：</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between p-1.5 bg-[#F8FAFC] rounded">
                    <span className="font-medium text-[#334155]">浦锦街道</span>
                    <span className="font-mono text-[#D97706] font-semibold">14.2 张 / 千人（低于全区 -42.7%）</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-[#F8FAFC] rounded">
                    <span className="font-medium text-[#334155]">七宝镇</span>
                    <span className="font-mono text-[#D97706] font-semibold">16.5 张 / 千人（低于全区 -33.5%）</span>
                  </div>
                </div>
              </div>

              {/* Strict Conclusion Boundary Notice */}
              <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-[11px] text-[#92400E] leading-relaxed">
                <span className="font-bold block mb-0.5">结论合规与边界声明：</span>
                当前仅完成在营床位供给侧基线比率分析。上述结果仅表示床位供给水平相对全区加权平均偏低，建议进一步核查；不能直接表达为“养老服务供需不足”或“缺少养老资源”，亦不能证明真实服务需求。
              </div>
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
          <button
            onClick={onModifySpec}
            className="px-3 py-1.5 text-xs text-[#475569] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>修改口径</span>
          </button>
        </div>

        <button
          onClick={handleRunExecution}
          disabled={isRunning}
          className={`px-5 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5 ${
            isRunning ? 'bg-[#93C5FD] cursor-not-allowed' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunning ? '正在校验权限并运行…' : hasExecuted ? '重新运行分析' : '确认并运行'}</span>
        </button>
      </div>
    </div>
  );
};
