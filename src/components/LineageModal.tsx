import React from 'react';
import { GitBranch, X, Database, Layers, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LineageModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName?: string;
}

export const LineageModal: React.FC<LineageModalProps> = ({
  isOpen,
  onClose,
  tableName = 'pop_service_hotline',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B]">
              数据表血缘图谱 (Table Data Lineage)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="text-xs text-[#64748B]">
            数据表 <span className="font-mono font-bold text-[#1E293B]">{tableName}</span> 在上游源系统与下游对象建模、AI 问数的上游上游链路图谱：
          </div>

          {/* Lineage Visual Graph */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-4 space-y-4 font-mono text-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Upstream */}
              <div className="bg-white p-3 rounded border border-[#E2E8F0] w-full md:w-1/3 text-center space-y-1">
                <div className="text-[10px] text-[#94A3B8] uppercase">Upstream Source</div>
                <div className="font-bold text-[#1E293B]">population_mysql</div>
                <div className="text-[10px] text-[#64748B]">db: service.hotline_raw</div>
              </div>

              <ArrowRight className="w-4 h-4 text-[#4F46E5] shrink-0 hidden md:block" />

              {/* Current Table */}
              <div className="bg-[#EEF2FF] p-3 rounded border border-[#4F46E5]/40 w-full md:w-1/3 text-center space-y-1 shadow-2xs">
                <div className="text-[10px] text-[#4F46E5] font-bold uppercase">Current Target</div>
                <div className="font-bold text-[#312E81]">{tableName}</div>
                <div className="text-[10px] text-[#059669] font-sans font-semibold">工单过程记录 (事实类)</div>
              </div>

              <ArrowRight className="w-4 h-4 text-[#4F46E5] shrink-0 hidden md:block" />

              {/* Downstream */}
              <div className="bg-white p-3 rounded border border-[#E2E8F0] w-full md:w-1/3 text-center space-y-1">
                <div className="text-[10px] text-[#94A3B8] uppercase">Downstream Graph</div>
                <div className="font-bold text-[#1E293B]">服务工单对象</div>
                <div className="text-[10px] text-[#4F46E5]">Agent 找数问数中心</div>
              </div>
            </div>
          </div>

          <div className="bg-[#ECFDF5] border border-[#059669]/30 p-3 rounded text-xs text-[#065F46] space-y-1">
            <div className="font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>血缘链路与字段完整度验证</span>
            </div>
            <p className="text-[11px] text-[#047857]">
              上游 upstream service.hotline_raw 包含 36/36 全量映射字段，下游关系无断链或脱节阻碍。
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded text-xs font-semibold"
          >
            关闭血缘视图
          </button>
        </div>
      </div>
    </div>
  );
};
