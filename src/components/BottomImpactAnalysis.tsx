import React, { useState } from 'react';
import { Layers, Activity, Bot, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { DownstreamImpact } from '../types';

interface BottomImpactAnalysisProps {
  impact: DownstreamImpact;
}

export const BottomImpactAnalysis: React.FC<BottomImpactAnalysisProps> = ({ impact }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border-t border-[#E2E8F0] px-4 py-2.5 lg:px-6 shrink-0 shadow-2xs transition-all duration-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group hover:opacity-90 transition-opacity focus:outline-none"
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
            确认影响分析 (Confirmation Downstream Impact Analysis)
          </h2>
          <span className="text-[10px] bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 rounded-full font-mono font-medium border border-[#C7D2FE]">
            3 项联动更新就绪
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#64748B]">
          <span className="text-[11px] hidden sm:inline text-[#94A3B8] font-mono">
            {isExpanded ? '收起分析' : '展开联动影响分析'}
          </span>
          <div className="p-1 rounded hover:bg-[#F1F5F9] transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[#4F46E5]" />
            ) : (
              <ChevronUp className="w-4 h-4 text-[#64748B] group-hover:text-[#4F46E5]" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-2.5 border-t border-[#F1F5F9] animate-fadeIn">
          {/* Column 1: 对象影响 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-md space-y-1.5 hover-scale-sleek">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1">
              <span className="text-xs font-bold text-[#1E293B] flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>1. 业务对象模型影响</span>
              </span>
              <span className="text-[10px] bg-[#EEF2FF] text-[#4F46E5] px-1.5 py-0.2 rounded-sm font-mono font-semibold">
                模型更新
              </span>
            </div>

            <div className="text-xs space-y-0.5">
              <div className="font-semibold text-[#312E81]">
                {impact.objectImpact.objectName}
              </div>
              <div className="text-[#475569] text-[11px]">
                <span className="text-[#94A3B8]">新增属性: </span>
                <span className="font-mono font-medium text-[#1E293B]">
                  {impact.objectImpact.newAttribute}
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] pt-0.5">
                {impact.objectImpact.description}
              </div>
            </div>
          </div>

          {/* Column 2: 指标影响 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-md space-y-1.5 hover-scale-sleek">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1">
              <span className="text-xs font-bold text-[#1E293B] flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-[#059669]" />
                <span>2. 业务指标库影响</span>
              </span>
              <span className="text-[10px] bg-[#ECFDF5] text-[#059669] px-1.5 py-0.2 rounded-sm font-mono font-semibold">
                3 指标激活
              </span>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-[10px] text-[#94A3B8]">自动解除依赖未就绪状态：</div>
              <div className="flex flex-wrap gap-1">
                {impact.metricImpact.metrics.map((met, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium bg-white px-2 py-0.5 rounded-sm border border-[#E2E8F0] text-[#1E293B] shadow-2xs hover-scale-sleek"
                  >
                    {met}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: AI消费影响 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-md space-y-1.5 hover-scale-sleek">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1">
              <span className="text-xs font-bold text-[#1E293B] flex items-center space-x-1.5">
                <Bot className="w-3.5 h-3.5 text-[#D97706]" />
                <span>3. AI 消费与自然语言问数</span>
              </span>
              <span className="text-[10px] bg-[#FFFBEB] text-[#D97706] px-1.5 py-0.2 rounded-sm font-mono font-semibold">
                问数增强
              </span>
            </div>

            <div className="text-[11px] space-y-1 text-[#475569]">
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#4F46E5] shrink-0" />
                <span className="truncate">{impact.aiConsumptionImpact.nlQuerySupport}</span>
              </div>
              <div className="text-[#64748B] truncate">
                {impact.aiConsumptionImpact.analyticsSupport}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

