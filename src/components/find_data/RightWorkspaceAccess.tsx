import React, { useState } from 'react';
import { X, ShieldCheck, Check, AlertTriangle, Clock, FileCheck, ArrowRight } from 'lucide-react';
import { FindDataTaskState, PermissionDecision, ResourceId } from './model/FindDataTask';
import {
  selectPermissionRelevantItems,
  selectResourceById,
  selectResourceAvailability
} from './model/findDataSelectors';

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
  const items = selectPermissionRelevantItems(task);
  const [selectedToApply, setSelectedToApply] = useState<ResourceId[]>([]);

  const permissionRequests = Object.values(task.permissionRequests || {});

  const getDecisionBadge = (decision?: PermissionDecision) => {
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

  const toggleSelect = (resId: ResourceId) => {
    if (selectedToApply.includes(resId)) {
      setSelectedToApply(selectedToApply.filter((id) => id !== resId));
    } else {
      setSelectedToApply([...selectedToApply, resId]);
    }
  };

  const handleSubmitRequest = () => {
    if (selectedToApply.length === 0) return;
    onAction?.('CREATE_PERMISSION_REQUEST', {
      resourceIds: selectedToApply,
      actionType: 'query'
    });
    setSelectedToApply([]);
  };

  const hasCoreAllAllowed = items.length > 0 && items
    .filter((it) => it.role === 'CORE')
    .every((it) => task.resources[it.resourceId]?.availabilityByAction?.query === 'ALLOWED');

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
        {items.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <ShieldCheck className="w-10 h-10 text-[#CBD5E1]" />
            <p className="font-bold text-sm text-[#0F172A]">暂无待检视的权限资源</p>
            <p className="text-xs text-[#64748B]">
              数据方案生成后，与本任务相关的官方指标及明细表权限状态将在此集中透视与申请。
            </p>
          </div>
        ) : (
          <>
            {hasCoreAllAllowed ? (
              <div className="p-3 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-xl space-y-1 text-xs text-[#1E3A8A]">
                <div className="font-bold flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-[#2563EB]" />
                  <span>核心计算指标已通过权限校验</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  当前方案核心指标均具备即时查询权限，可直接执行 Ask Data 问数分析。下钻明细可按需勾选申请。
                </p>
              </div>
            ) : (
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl space-y-1 text-xs text-[#92400E]">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>部分方案资源需申请查询权限</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  请勾选需要申请的资源项，并点击下方按钮提交权限申请流程。
                </p>
              </div>
            )}

            {/* Submitted Requests List */}
            {permissionRequests.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>已提交的权限申请记录</span>
                </div>
                <div className="space-y-1.5">
                  {permissionRequests.map((req) => (
                    <div
                      key={req.requestId}
                      className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#0F172A]">{req.requestId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-semibold border border-[#BFDBFE]">
                          {req.status === 'SUBMITTED' ? '审批中' : req.status === 'APPROVED' ? '已批准' : '已拒绝'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        申请权限：{req.actionType === 'query' ? '查询问数' : req.actionType} · 涉及资源：
                        {req.resourceIds.map((id) => task.resources[id]?.name || id).join('、')}
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">
                        提交时间：{new Date(req.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Access Matrix Table */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#475569]">
                    <th className="py-2.5 px-3 font-semibold">方案资源名称</th>
                    <th className="py-2.5 px-2 font-semibold text-center">元数据</th>
                    <th className="py-2.5 px-2 font-semibold text-center">样本预览</th>
                    <th className="py-2.5 px-2 font-semibold text-center">查询问数</th>
                    <th className="py-2.5 px-2 font-semibold text-center">数据导出</th>
                    <th className="py-2.5 px-2 font-semibold text-center">申请勾选</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {items.map((item) => {
                    const res = selectResourceById(task, item.resourceId);
                    if (!res) return null;
                    const perms = selectResourceAvailability(task, item.resourceId);
                    if (!perms) return null;

                    const isRequestable = perms.query === 'REQUESTABLE';
                    const isSelected = selectedToApply.includes(item.resourceId);

                    return (
                      <tr key={item.resourceId} className="hover:bg-[#F8FAFC]/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#0F172A]">{res.name}</div>
                          <div className="text-[10px] text-[#94A3B8]">
                            {res.type} · {res.department || '市大数据平台'}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">{getDecisionBadge(perms.viewMetadata)}</td>
                        <td className="py-2.5 px-2 text-center">{getDecisionBadge(perms.preview)}</td>
                        <td className="py-2.5 px-2 text-center">{getDecisionBadge(perms.query)}</td>
                        <td className="py-2.5 px-2 text-center">{getDecisionBadge(perms.export)}</td>
                        <td className="py-2.5 px-2 text-center">
                          {isRequestable ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item.resourceId)}
                              className="rounded border-[#CBD5E1] text-[#2563EB] cursor-pointer"
                            />
                          ) : perms.query === 'ALLOWED' ? (
                            <span className="text-[10px] text-[#16A34A] font-medium">已获得</span>
                          ) : (
                            <span className="text-[10px] text-[#94A3B8]">不可申请</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
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
          onClick={handleSubmitRequest}
          disabled={selectedToApply.length === 0}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
            selectedToApply.length > 0
              ? 'text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-2xs'
              : 'text-[#94A3B8] bg-[#F1F5F9] cursor-not-allowed'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>发起选定权限申请 ({selectedToApply.length})</span>
        </button>
      </div>
    </div>
  );
};
