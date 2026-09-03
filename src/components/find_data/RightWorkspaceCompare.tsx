import React, { useState } from 'react';
import { X, CheckCircle2, Info, ArrowRight, ShieldAlert, Sparkles, Layers } from 'lucide-react';

interface RightWorkspaceCompareProps {
  onClose: () => void;
  onConfirmSelection: (resourceName: string) => void;
  selectedResource: string;
}

export const RightWorkspaceCompare: React.FC<RightWorkspaceCompareProps> = ({
  onClose,
  onConfirmSelection,
  selectedResource: initialSelected
}) => {
  const [selected, setSelected] = useState<string>(initialSelected || '常住人口月度快照');

  const comparisonData = [
    {
      dimension: '时间形态',
      r02: '当前状态（实时最新）',
      r03: '历史月度快照（按月固化）',
      highlightR03: true
    },
    {
      dimension: '记录粒度',
      r02: '一人一行',
      r03: '一人一月（支持时间序列分析）',
      highlightR03: true
    },
    {
      dimension: '适合用途',
      r02: '适合查看当前常住人口底册及最新属性明细',
      r03: '适合过去 12 个月人口趋势分析与历史月度明细下钻',
      highlightR03: true
    },
    {
      dimension: '当前限制',
      r02: '无历史月度快照；已有正式人口指标时不推荐纳入聚合方案',
      r03: '按月固化数据量级较大，聚合分析建议优先使用正式指标',
      highlightR03: false
    },
    {
      dimension: '问数状态',
      r02: '需申请（查询与样本均受限）',
      r03: '当前可查询（可直接问数）',
      highlightR03: true
    }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">资源比较</h3>
            <p className="text-[11px] text-[#64748B]">人口明细与快照候选比较</p>
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
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Context Tip */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start space-x-2.5 text-xs text-[#475569]">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            基于当前分析目标（2025.09 — 2026.08 过去 12 个月供给分析），对比两项人员级候选资源的特征与可用性。
          </p>
        </div>

        {/* Candidate Cards (Radio Selection) */}
        <div className="grid grid-cols-2 gap-3">
          {/* R02 Option */}
          <div
            onClick={() => setSelected('人口基本信息视图')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected === '人口基本信息视图'
                ? 'border-[#2563EB] bg-[#EFF6FF]/40 ring-2 ring-[#2563EB]/20 shadow-xs'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">人口基本信息视图</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#EA580C] font-semibold border border-[#FFEDD5]">
                  需申请
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] line-clamp-2">
                当前状态 · 一人一行 · 人员明细候选
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8]">数据资产</span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selected === '人口基本信息视图' ? 'border-[#2563EB] bg-[#2563EB] text-white' : 'border-[#CBD5E1]'
              }`}>
                {selected === '人口基本信息视图' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
            </div>
          </div>

          {/* R03 Option (Recommended) */}
          <div
            onClick={() => setSelected('常住人口月度快照')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative ${
              selected === '常住人口月度快照'
                ? 'border-[#2563EB] bg-[#EFF6FF]/50 ring-2 ring-[#2563EB]/20 shadow-xs'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
            }`}
          >
            <div className="absolute -top-2.5 right-3 bg-[#2563EB] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
              <Sparkles className="w-2.5 h-2.5" />
              <span>推荐使用</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">常住人口月度快照</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] font-semibold border border-[#DCFCE7]">
                  可查询
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] line-clamp-2">
                历史月度快照 · 一人一月 · 支持时间趋势
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8]">数据资产 · 18 字段</span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selected === '常住人口月度快照' ? 'border-[#2563EB] bg-[#2563EB] text-white' : 'border-[#CBD5E1]'
              }`}>
                {selected === '常住人口月度快照' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
            </div>
          </div>
        </div>

        {/* 5 Dimensional Comparison Matrix */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#334155] tracking-tight">对比维度</h4>
          <div className="border border-[#E2E8F0] rounded-xl overflow-hidden divide-y divide-[#E2E8F0] text-xs">
            {comparisonData.map((row, idx) => (
              <div key={idx} className="p-3 bg-white hover:bg-[#F8FAFC] transition-colors">
                <div className="text-[11px] font-bold text-[#64748B] mb-2">{row.dimension}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-[#475569] leading-relaxed bg-[#F8FAFC] p-2 rounded-lg border border-[#F1F5F9]">
                    <span className="text-[10px] font-semibold text-[#94A3B8] block mb-0.5">人口基本信息视图</span>
                    {row.r02}
                  </div>
                  <div className={`leading-relaxed p-2 rounded-lg border ${
                    row.highlightR03 
                      ? 'bg-[#EFF6FF]/60 text-[#1E3A8A] font-medium border-[#BFDBFE]' 
                      : 'bg-[#F8FAFC] text-[#475569] border-[#F1F5F9]'
                  }`}>
                    <span className="text-[10px] font-semibold text-[#3B82F6] block mb-0.5">常住人口月度快照</span>
                    {row.r03}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <div className="text-xs text-[#64748B]">
          当前选定：<span className="font-semibold text-[#0F172A]">{selected}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => onConfirmSelection(selected)}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5"
          >
            <span>确认选择</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
