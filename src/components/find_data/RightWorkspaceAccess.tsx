import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertCircle, Ban, ArrowRight, ExternalLink } from 'lucide-react';

interface RightWorkspaceAccessProps {
  onClose: () => void;
  onKeepMinimalPlan?: () => void;
  onApplyAndProceed?: () => void;
}

export const RightWorkspaceAccess: React.FC<RightWorkspaceAccessProps> = ({
  onClose,
  onKeepMinimalPlan,
  onApplyAndProceed
}) => {
  const resourcesAccess = [
    {
      name: '人口基本信息视图',
      type: '数据资产 · 人口明细候选',
      roleNote: '当前聚合分析非必需资源，加入后引入人员级明细',
      matrix: {
        metadata: { label: '允许', status: 'allowed' },
        query: { label: '可申请', status: 'requestable' },
        sample: { label: '可申请', status: 'requestable' },
        export: { label: '不可用', status: 'denied' }
      }
    },
    {
      name: '居家养老服务订单',
      type: '数据资产 · 部分匹配',
      roleNote: '仅覆盖居家上门与助餐服务，无法代表机构养老等完整服务使用',
      matrix: {
        metadata: { label: '允许', status: 'allowed' },
        query: { label: '可申请', status: 'requestable' },
        sample: { label: '可申请', status: 'requestable' },
        export: { label: '不可用', status: 'denied' }
      }
    }
  ];

  const getStatusBadge = (status: string, label: string) => {
    switch (status) {
      case 'allowed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] text-[11px] font-semibold border border-[#DCFCE7]">
            <CheckCircle2 className="w-3 h-3" />
            <span>{label}</span>
          </span>
        );
      case 'requestable':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#FFF7ED] text-[#EA580C] text-[11px] font-semibold border border-[#FED7AA]">
            <AlertCircle className="w-3 h-3" />
            <span>{label}</span>
          </span>
        );
      case 'denied':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#F1F5F9] text-[#94A3B8] text-[11px] font-medium border border-[#E2E8F0]">
            <Ban className="w-3 h-3" />
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">资源使用权限</h3>
            <p className="text-[11px] text-[#64748B]">按动作细分权限状态与申请通道</p>
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
        {/* Recommendation Notice */}
        <div className="p-3.5 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-xl flex items-start space-x-3 text-[#1E3A8A]">
          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-xs">建议保留最小可执行方案</div>
            <p className="text-[11px] text-[#3B82F6] leading-relaxed">
              当前业务目标（老龄人口规模与在营床位供给水平）已具备“60 岁以上常住人口数”与“在营可用养老床位数”两项可用正式指标。受限资源并非当前基线计算必需输入，可先行分析。
            </p>
          </div>
        </div>

        {/* Resources Matrix List */}
        <div className="space-y-4">
          {resourcesAccess.map((res) => (
            <div key={res.name} className="p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#0F172A]">{res.name}</h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{res.type}</p>
                </div>
                <span className="text-[10px] text-[#EA580C] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FFEDD5] font-semibold">
                  查询需申请
                </span>
              </div>

              <div className="text-[11px] text-[#475569] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#F1F5F9] leading-relaxed">
                <span className="font-semibold text-[#334155]">必要性与范围判断：</span>{res.roleNote}
              </div>

              {/* 4 Action Matrix */}
              <div className="pt-2 border-t border-[#F1F5F9]">
                <div className="text-[11px] font-bold text-[#64748B] mb-2">动作权限矩阵</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9] space-y-1">
                    <span className="text-[10px] text-[#64748B] block">查看安全元数据</span>
                    {getStatusBadge(res.matrix.metadata.status, res.matrix.metadata.label)}
                  </div>
                  <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9] space-y-1">
                    <span className="text-[10px] text-[#64748B] block">数据查询</span>
                    {getStatusBadge(res.matrix.query.status, res.matrix.query.label)}
                  </div>
                  <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9] space-y-1">
                    <span className="text-[10px] text-[#64748B] block">样本预览</span>
                    {getStatusBadge(res.matrix.sample.status, res.matrix.sample.label)}
                  </div>
                  <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9] space-y-1">
                    <span className="text-[10px] text-[#64748B] block">导出数据</span>
                    {getStatusBadge(res.matrix.export.status, res.matrix.export.label)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <button
          onClick={onKeepMinimalPlan}
          className="px-4 py-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg transition-colors cursor-pointer"
        >
          保留最小方案（推荐）
        </button>
        <button
          onClick={onApplyAndProceed}
          className="px-4 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
        >
          <span>申请权限并继续</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8]" />
        </button>
      </div>
    </div>
  );
};
