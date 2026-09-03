import React, { useState } from 'react';
import { X, Check, ArrowRight, ShieldCheck, FileText, Info } from 'lucide-react';
import { FindDataResource, ResourceComparisonRow, ResourceId } from './model/FindDataTask';

interface RightWorkspaceCompareProps {
  resources: FindDataResource[];
  comparisonRows: ResourceComparisonRow[];
  selectedResourceId?: ResourceId;
  onConfirmSelection: (resourceId: ResourceId) => void;
  onViewFields: (resourceId: ResourceId) => void;
  onClose: () => void;
}

export const RightWorkspaceCompare: React.FC<RightWorkspaceCompareProps> = ({
  resources,
  comparisonRows,
  selectedResourceId = 'r03',
  onConfirmSelection,
  onViewFields,
  onClose
}) => {
  const [selectedId, setSelectedId] = useState<ResourceId>(selectedResourceId);

  const resA = resources[0];
  const resB = resources[1];

  if (!resA || !resB) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white p-6 text-xs text-[#64748B]">
        <span>暂无可比对的资源。</span>
        <button onClick={onClose} className="mt-3 text-[#2563EB] hover:underline">
          关闭
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">资源选型对比</h3>
            <p className="text-[11px] text-[#64748B]">
              比对底册最新态与历史月度快照的适用范围
            </p>
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
        {/* Recommendation & Conclusion - Pure Text Representation */}
        <div className="space-y-1 text-xs text-[#334155] leading-relaxed pb-2 border-b border-[#F1F5F9]">
          <div className="flex items-center space-x-1.5 font-bold text-[#0F172A]">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>比对结论与推荐建议：</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#475569] pl-5">
            本次分析覆盖过去 12 个月（2025.09 — 2026.08），推荐将「<strong className="text-[#0F172A]">{resB.name}</strong>」作为可选下钻资源；
            而「{resA.name}」仅含实时最新状态、无历史月度切片，且权限需申请，不建议纳入本次分析方案。
          </p>
        </div>

        {/* 2 Candidate Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Resource A */}
          <div
            onClick={() => setSelectedId(resA.id)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
              selectedId === resA.id
                ? 'border-[#2563EB] bg-[#EFF6FF]/20 ring-1 ring-[#2563EB]/40'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-medium border border-[#E2E8F0]">
                {resA.type}
              </span>
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                  selectedId === resA.id
                    ? 'border-[#2563EB] bg-[#2563EB] text-white'
                    : 'border-[#CBD5E1]'
                }`}
              >
                {selectedId === resA.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
            <div className="font-bold text-xs text-[#0F172A]">{resA.name}</div>
            <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">{resA.desc}</p>
            <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[10px]">
              <span className="text-[#EA580C] font-semibold">查询需申请</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewFields(resA.id);
                }}
                className="text-[#2563EB] hover:underline"
              >
                查看元数据
              </button>
            </div>
          </div>

          {/* Resource B */}
          <div
            onClick={() => setSelectedId(resB.id)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
              selectedId === resB.id
                ? 'border-[#2563EB] bg-[#EFF6FF]/20 ring-1 ring-[#2563EB]/40'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-medium border border-[#E2E8F0]">
                  {resB.type}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#DBEAFE] text-[#1E40AF] font-bold">
                  推荐选择
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                  selectedId === resB.id
                    ? 'border-[#2563EB] bg-[#2563EB] text-white'
                    : 'border-[#CBD5E1]'
                }`}
              >
                {selectedId === resB.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
            <div className="font-bold text-xs text-[#0F172A]">{resB.name}</div>
            <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">{resB.desc}</p>
            <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[10px]">
              <span className="text-[#16A34A] font-semibold">当前可查询</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewFields(resB.id);
                }}
                className="text-[#2563EB] hover:underline"
              >
                查看字段 (18)
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#475569]">
                <th className="py-2.5 px-3 font-semibold w-24">比对维度</th>
                <th className="py-2.5 px-3 font-semibold text-[#64748B]">{resA.name}</th>
                <th className="py-2.5 px-3 font-semibold text-[#2563EB] bg-[#EFF6FF]/40">
                  {resB.name} (推荐)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[#0F172A] bg-[#FAFAFA] border-r border-[#F1F5F9] text-[11px]">
                    {row.dimension}
                  </td>
                  <td className="py-2.5 px-3 text-[#475569] leading-relaxed">
                    {row.values[resA.id]}
                  </td>
                  <td className="py-2.5 px-3 text-[#0F172A] font-medium leading-relaxed bg-[#EFF6FF]/20">
                    {row.values[resB.id]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <div className="text-[11px] text-[#64748B]">
          当前已选中：
          <span className="font-bold text-[#0F172A]">
            {selectedId === resA.id ? resA.name : resB.name}
          </span>
        </div>
        <button
          onClick={() => onConfirmSelection(selectedId)}
          className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
        >
          <span>确认优选并同步至方案</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
