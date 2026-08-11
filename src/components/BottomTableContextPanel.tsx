import React, { useState } from 'react';
import { 
  Bot, 
  BarChart2, 
  Calculator, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export const BottomTableContextPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer className="bg-white border-t border-[#E2E8F0] shrink-0 shadow-2xs transition-all">
      {/* Collapsed Bar / Header Toggle */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#F8FAFC] transition-colors select-none"
      >
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-[#1E293B]">
            <BarChart2 className="w-4 h-4 text-[#4F46E5]" />
            <span>分析结构与 Agent 使用上下文</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-[#64748B]">
            <span className="text-[#CBD5E1]">|</span>
            <span>计数口径: <strong className="text-[#312E81] font-mono">count(distinct ticket_id)</strong></span>
            <span className="text-[#CBD5E1]">|</span>
            <span>推荐维度: <strong className="text-[#1E293B]">status, created_time</strong></span>
            <span className="text-[#CBD5E1]">|</span>
            <span className="px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] font-semibold border border-[#059669]/20">
              Agent 问数已接入
            </span>
          </div>
        </div>

        <button 
          className="flex items-center space-x-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
        >
          <span>{isExpanded ? '收起面板' : '展开分析结构与 Agent 上下文'}</span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Content Body */}
      {isExpanded && (
        <div className="h-[220px] p-3 md:p-4 border-t border-[#F1F5F9] flex flex-col md:flex-row items-stretch justify-between gap-3 overflow-y-auto">
          {/* Block 1: 分析结构 (Left ~50%) */}
          <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-xs font-bold text-[#1E293B]">分析结构（Agent 找数问数关键配置）</h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EEF2FF] text-[#4F46E5] font-semibold border border-[#4F46E5]/20">
                ANALYSIS STRUCTURE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Module 1: 计数口径 */}
              <div className="bg-white p-2.5 rounded border border-[#E2E8F0] space-y-1">
                <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Calculator className="w-3 h-3 text-[#4F46E5]" />
                  <span>计数口径</span>
                </div>
                <div className="font-mono font-bold text-[#312E81] text-xs">
                  count(distinct ticket_id)
                </div>
                <p className="text-[10px] text-[#64748B]">
                  <span className="font-semibold text-[#1E293B]">原因: </span>ticket_id 为业务唯一主标识。
                </p>
              </div>

              {/* Module 2: 分析维度 */}
              <div className="bg-white p-2.5 rounded border border-[#E2E8F0] space-y-1">
                <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Layers className="w-3 h-3 text-[#059669]" />
                  <span>推荐分析维度</span>
                </div>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  <span className="bg-[#EEF2FF] text-[#312E81] font-mono font-bold px-1.5 py-0.5 rounded border border-[#4F46E5]/20">
                    status (处理状态)
                  </span>
                  <span className="bg-[#EEF2FF] text-[#312E81] font-mono font-bold px-1.5 py-0.5 rounded border border-[#4F46E5]/20">
                    created_time (时间趋势)
                  </span>
                </div>
              </div>

              {/* Module 3: 分析度量 */}
              <div className="bg-white p-2.5 rounded border border-[#E2E8F0] space-y-1">
                <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <BarChart2 className="w-3 h-3 text-[#D97706]" />
                  <span>推荐分析度量</span>
                </div>
                <div className="space-y-0.5 font-mono text-[10px]">
                  <div className="text-[#1E293B]"><span className="text-[#64748B]">字段:</span> duration (办理时长)</div>
                  <div className="text-[#4F46E5] font-bold"><span className="text-[#64748B]">函数:</span> avg(duration) (平均处理时间)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Block 2: Agent 使用上下文 (Right ~50%) */}
          <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-[#059669]" />
                <h3 className="text-xs font-bold text-[#1E293B]">Agent 使用上下文（AI 语义问数接入）</h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] font-semibold border border-[#059669]/20">
                AGENT CONTEXT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Suitable Questions */}
              <div className="bg-white p-2.5 rounded border border-[#E2E8F0] space-y-1">
                <div className="text-[10px] text-[#059669] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                  <span>适合回答的典型问题</span>
                </div>
                <ul className="text-[10px] text-[#475569] space-y-0.5 list-disc list-inside">
                  <li>“最近工单数量趋势”</li>
                  <li>“平均办理时长是多少”</li>
                  <li>“哪些区域工单最多”</li>
                </ul>
              </div>

              {/* Capabilities & Constraints */}
              <div className="bg-white p-2.5 rounded border border-[#E2E8F0] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#312E81] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#4F46E5]" />
                    <span>支持能力与约束限制</span>
                  </span>
                </div>
                <div className="text-[10px] space-y-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-[#64748B]">能力:</span>
                    <span className="font-semibold text-[#059669] bg-[#ECFDF5] px-1 py-0.2 rounded">找数</span>
                    <span className="font-semibold text-[#4F46E5] bg-[#EEF2FF] px-1 py-0.2 rounded">问数</span>
                    <span className="font-semibold text-[#312E81] bg-[#F1F5F9] px-1 py-0.2 rounded">分析</span>
                  </div>
                  <div className="text-[#BE123C] flex items-start space-x-1">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>限制: 不适合分析完整状态流转历史；关系字段 person_id 尚需确认。</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
