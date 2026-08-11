import React from 'react';
import { Sparkles, X, Layers, CheckCircle2, ArrowRight, Box } from 'lucide-react';

interface ObjectModelingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName?: string;
}

export const ObjectModelingModal: React.FC<ObjectModelingModalProps> = ({
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
            <Sparkles className="w-5 h-5 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B]">
              进入阶段 ② 对象建模 (Business Object Modeling)
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
          <div className="text-xs text-[#64748B] leading-relaxed">
            数据表 <span className="font-mono font-bold text-[#1E293B]">{tableName}</span> 的表语义理解结果为 <span className="font-bold text-[#312E81]">“工单过程记录”</span>。
            可以直接将表沉淀映射为企业级 <span className="font-bold text-[#059669]">“服务工单”</span> 业务对象实体。
          </div>

          <div className="bg-[#EEF2FF]/60 border border-[#4F46E5]/20 rounded-md p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#4F46E5]/10 pb-2">
              <span className="font-bold text-[#312E81] flex items-center space-x-1.5">
                <Box className="w-4 h-4 text-[#4F46E5]" />
                <span>生成业务对象属性集</span>
              </span>
              <span className="text-[10px] bg-[#4F46E5] text-white font-bold px-2 py-0.5 rounded">
                准备生成
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white p-2.5 rounded border border-[#E2E8F0]">
                <div className="text-[#64748B]">目标业务对象</div>
                <div className="font-bold text-[#1E293B] text-sm mt-0.5">服务工单</div>
              </div>
              <div className="bg-white p-2.5 rounded border border-[#E2E8F0]">
                <div className="text-[#64748B]">对象主体键</div>
                <div className="font-mono font-bold text-[#312E81] text-sm mt-0.5">ticket_id</div>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-[#E2E8F0] space-y-1">
              <div className="text-[#64748B] font-semibold text-[11px]">属性自动绑定方案:</div>
              <div className="text-[10px] text-[#475569] space-y-0.5 font-mono">
                <div>• 创建时间 → created_time</div>
                <div>• 办结时间 → close_time</div>
                <div>• 处理状态 → status</div>
                <div>• 诉求自然人 → person_id</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#1E293B] rounded text-xs font-medium"
          >
            取消
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-2xs"
          >
            <span>确认进入对象建模</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
