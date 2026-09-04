import React, { useState } from 'react';
import { X, Folder, Check, Plus, ExternalLink } from 'lucide-react';
import { FindDataTaskState, ResourceId, TaskActionCode } from './model/FindDataTask';
import { selectCandidateSolutionStatus, selectRelatedResourceCandidates, selectResourceById } from './model/findDataSelectors';

interface RightWorkspaceCatalogProps {
  task: FindDataTaskState;
  onClose: () => void;
  onReturnToAnalysis: () => void;
  onAction?: (actionCode: TaskActionCode, payload?: Record<string, unknown>) => void;
  onViewFields: (resourceId: ResourceId) => void;
}

export const RightWorkspaceCatalog: React.FC<RightWorkspaceCatalogProps> = ({
  task,
  onClose,
  onReturnToAnalysis,
  onAction,
  onViewFields
}) => {
  const catalogResources = selectRelatedResourceCandidates(task).flatMap((candidate) => {
    const resource = selectResourceById(task, candidate.resourceId);
    return resource ? [{ candidate, resource }] : [];
  });

  const [selectedId, setSelectedId] = useState<ResourceId | undefined>();

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">相关资源浏览</h3>
            <p className="text-[11px] text-[#64748B]">浏览当前业务目标相关、可进一步评估的数据资源。</p>
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

      {/* Retention Banner */}
      <div className="px-5 py-2 bg-[#EFF6FF]/60 border-b border-[#BFDBFE] flex items-center justify-between text-xs text-[#1E3A8A]">
        <div className="flex items-center space-x-2 truncate">
          <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="font-semibold truncate">当前分析任务已保留</span>
        </div>
        <button
          onClick={onReturnToAnalysis}
          className="text-[#2563EB] hover:underline text-xs font-semibold cursor-pointer shrink-0 ml-2"
        >
          返回方案
        </button>
      </div>

      {/* Main Catalog Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
        {catalogResources.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Folder className="w-10 h-10 text-[#CBD5E1]" />
            <p className="font-bold text-sm text-[#0F172A]">当前暂无可浏览的相关资源</p>
            <p className="text-xs text-[#64748B]">
              请在左侧发起找数据任务，系统将按业务主题索引相关资产。
            </p>
          </div>
        ) : (
          <>
            <div className="text-[11px] text-[#64748B]">
              当前共有 {catalogResources.length} 项可浏览资源。
            </div>

            <div className="space-y-3">
              {catalogResources.map(({ candidate, resource }) => {
                const isSelected = selectedId === resource.id;
                const isAllowed = resource.availabilityByAction.query === 'ALLOWED';
                const solutionStatus = selectCandidateSolutionStatus(task, resource.id);
                const isInSolution = solutionStatus === '已加入方案';

                return (
                  <div
                    key={resource.id}
                    onClick={() => setSelectedId(resource.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#EFF6FF]/20 ring-1 ring-[#2563EB]/30 shadow-xs'
                        : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                          <span className="font-bold text-xs text-[#0F172A] truncate">{resource.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                          {resource.type}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {isInSolution && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]">
                            {solutionStatus}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            isAllowed
                              ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]'
                              : 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]'
                          }`}
                        >
                          {isAllowed ? '可直接使用' : '需申请'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#64748B] leading-relaxed">{candidate.reason}</p>

                    <div className="p-2.5 bg-[#F8FAFC] rounded-lg text-[11px] text-[#475569] space-y-1">
                      <div><span className="font-semibold text-[#0F172A]">记录粒度：</span>{resource.granularity}</div>
                      <div><span className="font-semibold text-[#0F172A]">建议定位：</span>{resource.roleNote || '业务补充'}</div>
                    </div>

                    <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewFields(resource.id);
                        }}
                        className="text-[#2563EB] hover:underline flex items-center space-x-0.5"
                      >
                        <span>检视元数据</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        disabled={isInSolution}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction?.('EVALUATE_AND_ADD', { resourceId: resource.id });
                        }}
                        className={`px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 font-semibold ${
                          isInSolution
                            ? 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-default'
                            : 'bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] cursor-pointer'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isInSolution ? '已加入方案' : '评估并加入当前方案'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <button
          onClick={onReturnToAnalysis}
          className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
        >
          返回数据方案
        </button>
      </div>
    </div>
  );
};
