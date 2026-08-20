import React from 'react';
import { X, CheckCircle2, ShieldCheck, FileText, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';

interface BusinessRuleDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ruleName?: string;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const BusinessRuleDetailDrawer: React.FC<BusinessRuleDetailDrawerProps> = ({
  isOpen,
  onClose,
  ruleName = '有效订单',
  addToast
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-[#172033]">
                  业务规则实现详情
                </h3>
                <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
                  正式生效
                </span>
              </div>
              <div className="text-xs text-[#667085]">
                {ruleName} · 统计范围限定规则
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#F8FAFC] text-[#667085] hover:text-[#172033] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#172033]">
          
          {/* AI Status Notice */}
          <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg flex items-center space-x-2 text-[#4F46E5] text-[11.5px]">
            <Sparkles className="w-4 h-4 text-[#6366F1] shrink-0" />
            <span>✦ Xino 语义引擎已持续校验该业务规则的数据执行等价性</span>
          </div>

          {/* 业务含义 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
              业务定义与范围
            </h4>
            <div className="p-3.5 rounded-lg bg-[#FAFCFF] border border-[#E2E8F0] space-y-1.5">
              <div className="font-semibold text-[#172033]">
                什么是「有效订单」？
              </div>
              <p className="text-[#475569] leading-relaxed">
                在统计周期内已成功支付完成、且未发生整单退款或全额撤销的合法交易订单。排除预占库存、未付款超时作废以及虚假刷单的测试订单。
              </p>
            </div>
          </div>

          {/* 判定条件要素 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
              规则判定条件要素
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-[#F0FDF4] text-[#16A36A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-[#172033]">支付状态要求</div>
                  <div className="text-[11px] text-[#667085] mt-0.5">
                    订单已完成实际资金结算支付（已支付状态）
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-[#F0FDF4] text-[#16A36A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-[#172033]">退款与取消排除</div>
                  <div className="text-[11px] text-[#667085] mt-0.5">
                    排除整单全额退款、已取消订单及欺诈黑名单订单
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-[#F0FDF4] text-[#16A36A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-[#172033]">业务对象实体约束</div>
                  <div className="text-[11px] text-[#667085] mt-0.5">
                    主实体为有效订单（`order_id` 非空且唯一）
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 规范依据 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
              制度依据与归口
            </h4>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] space-y-2">
              <div className="flex items-center space-x-2 text-[#2563EB]">
                <FileText className="w-4 h-4" />
                <span className="font-semibold">《企业电商交易业务数据治理规范》第 4.2 条</span>
              </div>
              <div className="text-[11px] text-[#667085] flex justify-between">
                <span>归口部门：交易分析与财务核算组</span>
                <span>生效版本：v2.0 (2026正式版)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EEF2F6] bg-white flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            完成查看
          </button>
        </div>

      </div>
    </div>
  );
};
