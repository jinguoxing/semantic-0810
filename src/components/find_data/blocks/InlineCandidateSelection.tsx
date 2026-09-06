import React from 'react';
import { Check, ChevronRight, ExternalLink } from 'lucide-react';
import {
  FindDataTaskState,
  ResourceId,
  ResultBriefBlock as ResultBriefBlockType,
  TaskActionCode
} from '../model/FindDataTask';
import {
  selectCandidateById,
  selectCandidateSolutionStatus,
  selectResourceById
} from '../model/findDataSelectors';

interface InlineCandidateSelectionProps {
  block: ResultBriefBlockType;
  task: FindDataTaskState;
  selectedResourceId?: ResourceId;
  onSelectedResourceChange: (resourceId: ResourceId) => void;
  onActionClick: (actionCode: TaskActionCode, payload?: Record<string, unknown>) => void;
  onViewFields: (resourceId: ResourceId, comparisonResourceIds: ResourceId[]) => void;
}

const queryStatusLabel = (status: 'ALLOWED' | 'REQUESTABLE' | 'DENIED' | 'UNKNOWN') => {
  switch (status) {
    case 'ALLOWED': return '可查询';
    case 'REQUESTABLE': return '查询需申请';
    case 'DENIED': return '当前不可查询';
    default: return '查询状态待确认';
  }
};

const solutionStatusLabel = (status: ReturnType<typeof selectCandidateSolutionStatus>) => {
  switch (status) {
    case 'INCLUDED': return '已加入方案';
    case 'PARTIAL_RECORDED': return '已记录为部分匹配';
    default: return undefined;
  }
};

/**
 * Compact alternative-resource choice for a conversation turn.  It keeps the
 * selected draft outside the component so the same choice can be reused by
 * the detailed compare workspace.
 */
export const InlineCandidateSelection: React.FC<InlineCandidateSelectionProps> = ({
  block,
  task,
  selectedResourceId,
  onSelectedResourceChange,
  onActionClick,
  onViewFields
}) => {
  const selection = block.candidateSelection;
  if (!selection) return null;

  const candidates = selection.resourceIds.flatMap((resourceId) => {
    const resource = selectResourceById(task, resourceId);
    const candidate = selectCandidateById(task, resourceId);
    return resource && candidate ? [{ resource, candidate }] : [];
  });
  const resourceIds = candidates.map(({ resource }) => resource.id);
  const effectiveSelectedResourceId = resourceIds.includes(selectedResourceId ?? '')
    ? selectedResourceId
    : resourceIds.includes(selection.recommendedResourceId ?? '')
      ? selection.recommendedResourceId
      : resourceIds[0];
  const selectedStatus = effectiveSelectedResourceId
    ? selectCandidateSolutionStatus(task, effectiveSelectedResourceId)
    : 'NOT_INCLUDED';
  const canConfirm = Boolean(
    effectiveSelectedResourceId
    && selectedStatus === 'NOT_INCLUDED'
    && !task.pendingOperation
  );
  const isAlternativeGroup = Boolean(selection.selectionGroupId && resourceIds.length > 1);

  return (
    <section className="w-full rounded-xl border border-[#D9E5F5] bg-[#FAFCFF] p-3 space-y-3" aria-label={block.title}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-[#0F172A]">{block.title}</h4>
          {block.subtitle && <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748B]">{block.subtitle}</p>}
        </div>
        <span className="shrink-0 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-medium text-[#2563EB]">
          {candidates.length} 项
        </span>
      </div>

      {isAlternativeGroup ? (
        <div className="space-y-2" role="radiogroup" aria-label="选择要加入方案的人口明细资源">
          {candidates.map(({ resource, candidate }) => {
            const isSelected = resource.id === effectiveSelectedResourceId;
            const solutionStatus = solutionStatusLabel(selectCandidateSolutionStatus(task, resource.id));
            const canViewFields = resource.availabilityByAction.viewMetadata === 'ALLOWED';
            return (
              <label
                key={resource.id}
                className={`block rounded-lg border p-2.5 transition-colors ${
                  isSelected ? 'border-[#2563EB] bg-[#EFF6FF]/70' : 'border-[#E2E8F0] bg-white hover:border-[#BFDBFE]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name={`candidate-${selection.selectionGroupId}`}
                    aria-label={resource.name}
                    value={resource.id}
                    checked={isSelected}
                    onChange={() => onSelectedResourceChange(resource.id)}
                    className="mt-0.5 h-3.5 w-3.5 accent-[#2563EB]"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-medium text-[#0F172A]">{resource.name}</span>
                      {resource.id === selection.recommendedResourceId && (
                        <span className="rounded border border-[#BFDBFE] bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-medium text-[#2563EB]">推荐</span>
                      )}
                      {solutionStatus && (
                        <span className="rounded border border-[#BBF7D0] bg-[#F0FDF4] px-1.5 py-0.5 text-[10px] font-medium text-[#15803D]">{solutionStatus}</span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#64748B]">{resource.timeCoverage} · {resource.granularity}</p>
                    <p className="text-[11px] leading-relaxed text-[#475569]">{candidate.reason || resource.roleNote || resource.desc}</p>
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className={`text-[10px] ${resource.availabilityByAction.query === 'ALLOWED' ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
                        {queryStatusLabel(resource.availabilityByAction.query)}
                      </span>
                      <button
                        type="button"
                        disabled={!canViewFields}
                        onClick={(event) => {
                          event.preventDefault();
                          onViewFields(resource.id, resourceIds);
                        }}
                        aria-label={`查看${resource.name}字段`}
                        title={canViewFields ? '查看完整字段列表' : '当前无法查看字段元数据'}
                        className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${canViewFields ? 'text-[#2563EB] hover:underline' : 'cursor-not-allowed text-[#94A3B8]'}`}
                      >
                        查看字段 <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-[#64748B]">当前候选并非同一替代组，请在完整方案中分别评估。</p>
      )}

      <p className="text-[11px] leading-relaxed text-[#64748B]">加入明细方案不等于纳入当前核心床位比率计算。</p>
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => effectiveSelectedResourceId && onActionClick('SELECT_RESOURCE', { resourceId: effectiveSelectedResourceId })}
          title={selectedStatus === 'INCLUDED' ? '所选资源已加入方案' : task.pendingOperation ? '当前任务正在处理，暂不能变更方案' : undefined}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
            canConfirm ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]' : 'cursor-not-allowed bg-[#E2E8F0] text-[#94A3B8]'
          }`}
        >
          {selectedStatus === 'INCLUDED' ? <Check className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {selectedStatus === 'INCLUDED' ? '已加入方案' : '将所选资源加入方案'}
        </button>
        <button
          type="button"
          disabled={resourceIds.length < 2 || Boolean(task.pendingOperation)}
          onClick={() => onActionClick('OPEN_COMPARE', { resourceIds })}
          className={`rounded-lg border border-[#CBD5E1] px-2.5 py-1.5 text-xs font-medium ${
            resourceIds.length >= 2 && !task.pendingOperation ? 'text-[#334155] hover:bg-[#F1F5F9]' : 'cursor-not-allowed text-[#94A3B8]'
          }`}
        >
          详细比较
        </button>
      </div>
    </section>
  );
};
