import React from 'react';
import { X, ShieldCheck, Calendar, MapPin, Database, Target, AlertTriangle } from 'lucide-react';

interface TaskContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeResource?: string;
}

export const TaskContextDrawer: React.FC<TaskContextDrawerProps> = ({
  isOpen,
  onClose,
  activeResource
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#0F172A]">当前任务上下文</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-[#64748B] flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>业务目标</span>
            </div>
            <p className="text-[#1E293B] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] leading-relaxed">
              评估 2025 年 9 月至 2026 年 8 月，闵行区各街镇 60 岁及以上常住人口规模，以及在营可用养老床位供给水平，识别相对供给水平偏低、需要进一步核查的街镇。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
              <div className="text-[10px] text-[#94A3B8] font-bold flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-[#2563EB]" />
                <span>分析区域</span>
              </div>
              <div className="font-semibold text-[#0F172A]">上海市闵行区</div>
              <div className="text-[10px] text-[#64748B]">全区及下辖各街镇</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
              <div className="text-[10px] text-[#94A3B8] font-bold flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-[#2563EB]" />
                <span>时间跨度</span>
              </div>
              <div className="font-semibold text-[#0F172A]">2025.09 — 2026.08</div>
              <div className="text-[10px] text-[#64748B]">过去 12 个月度快照与指标</div>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5">
            <div className="text-[10px] text-[#94A3B8] font-bold flex items-center space-x-1">
              <Database className="w-3 h-3 text-[#2563EB]" />
              <span>当前焦点资源</span>
            </div>
            <div className="font-semibold text-[#0F172A]">
              {activeResource || '尚未锁定单表（使用当前数据方案整体）'}
            </div>
          </div>

          <div className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] space-y-1 text-[#92400E]">
            <div className="text-[10px] font-bold flex items-center space-x-1 text-[#B45309]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>结论边界约束</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              分析结论仅表达“床位供给水平相对偏低，建议进一步核查”；严禁直接表达为“供需不足”或“缺少养老资源”，亦不能替代全面养老服务需求调查。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#FAFAFA] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
