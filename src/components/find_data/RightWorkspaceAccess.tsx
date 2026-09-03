import React from 'react';
import { X, ShieldCheck, Check, AlertTriangle, ArrowRight, Lock } from 'lucide-react';
import { FindDataTaskState, PermissionDecision } from './model/FindDataTask';
import { selectRecommendedSolutionItems, selectResourceById } from './model/findDataSelectors';

interface RightWorkspaceAccessProps {
  task: FindDataTaskState;
  onAction?: (actionCode: string, payload?: Record<string, unknown>) => void;
  onClose: () => void;
}

export const RightWorkspaceAccess: React.FC<RightWorkspaceAccessProps> = ({
  task,
  onAction,
  onClose
}) => {
  const items = selectRecommendedSolutionItems(task);

  const getDecisionBadge = (decision: PermissionDecision) => {
    switch (decision) {
      case 'ALLOWED':
        return (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] font-medium">
            允许
          </span>
        );
      case 'REQUESTABLE':
        return (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] font-medium">
            需申请
          </span>
        );
      case 'DENIED':
        return (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-medium">
            禁止
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] font-medium">
            未知
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
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">权限透视 · 找数据方案</h3>
            <p className="text-[11px] text-[#64748B]">
              按操作动作（目录发现、元数据、样例预览、查询问数、导出）精细化核验
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
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
        <div className="p-3 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-xl space-y-1 text-xs text-[#1E3A8A]">
          <div className="font-bold flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-[#2563EB]" />
            <span>核心计算指标已通过权限校验</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            两项核心指标（60 岁以上常住人口数、在营可用养老床位数）均具备即时查询权限，可直接执行 Ask Data 问数分析。
          </p>
        </div>

        {/* Access Matrix Table */}
        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#475569]">
                <th className="py-2.5 px-3 font-semibold">方案资源名称</th>
                <th className="py-2.5 px-2 font-semibold text-center">元数据检视</th>
                <th className="py-2.5 px-2 font-semibold text-center">样本预览</th>
                <th className="py-2.5 px-2 font-semibold text-center">查询问数</th>
                <th className="py-2.5 px-2 font-semibold text-center">数据导出</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {items.map((item) => {
                const res = selectResourceById(task, item.resourceId);
                if (!res) return null;
                const perms = item.availabilityByAction;

                return (
                  <tr key={item.resourceId} className="hover:bg-[#F8FAFC]/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#0F172A]">{res.name}</div>
                      <div className="text-[10px] text-[#94A3B8]">{res.type} · {res.department || '市大数据平台'}</div>
                    </td>
                    <td className="py-2.5 px-2 text-center">{getDecisionBadge(perms.viewMetadata)}</td>
                    <td className="py-2.5 px-2 text-center">{getDecisionBadge(perms.preview)}</td>
                    <td className="py-2.5 px-2 text-center">{getDecisionBadge(perms.query)}</td>
                    <td className="py-2.5 px-2 text-center">{getDecisionBadge(perms.export)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <button
          onClick={() => onAction?.('OPEN_SOLUTION')}
          className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
        >
          返回数据方案
        </button>

        <button
          onClick={() => onAction?.('APPLY_PERMISSIONS')}
          className="px-4 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg transition-colors cursor-pointer"
        >
          发起缺失权限申请
        </button>
      </div>
    </div>
  );
};
