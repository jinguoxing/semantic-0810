import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { FindDataTaskState, ResultBriefBlock as ResultBriefBlockType, TaskActionCode } from '../model/FindDataTask';
import { canExecuteTaskAction } from '../model/findDataSelectors';

interface ResultBriefBlockProps {
  block: ResultBriefBlockType;
  task?: FindDataTaskState;
  onActionClick?: (actionCode: TaskActionCode, payload?: Record<string, unknown>) => void;
}

export const ResultBriefBlock: React.FC<ResultBriefBlockProps> = ({
  block,
  task,
  onActionClick
}) => {
  const { title, candidates, keyPoints, primaryAction, secondaryAction, textLinkAction } = block;
  const actionEnabled = (action?: { actionCode: TaskActionCode; payload?: Record<string, unknown> }) => !task || !action || canExecuteTaskAction(task, action.actionCode, action.payload);

  return (
    <div className="pt-1 text-xs space-y-2 w-full">
      {/* Title & Badge */}
      <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
        <span className="font-semibold text-[#0F172A] tracking-tight truncate">
          {title}
        </span>
        {candidates && candidates.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-mono shrink-0 ml-2">
            共 {candidates.length} 项
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="space-y-2">
        {candidates && candidates.length > 0 ? (
          <div className="space-y-2">
            {candidates.map((cand) => (
              <div key={cand.resourceId} className="space-y-0.5 pl-2.5 border-l-2 border-[#2563EB]/40 py-0.5">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-medium text-[#0F172A]">{cand.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] font-medium border border-[#BFDBFE] shrink-0">
                    {cand.typeBadge}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#16A34A] font-medium border border-[#DCFCE7] shrink-0">
                    {cand.statusBadge}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] leading-relaxed">
                  {cand.description}
                </div>
              </div>
            ))}
          </div>
        ) : keyPoints && keyPoints.length > 0 ? (
          <ul className="space-y-1 text-[11px] text-[#475569]">
            {keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start space-x-1.5">
                <span className="text-[#2563EB] font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Actions (Max 1 Primary + 1 Secondary + 1 Text Link) */}
      {(primaryAction || secondaryAction || textLinkAction) && (
        <div className="pt-2 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2">
            {primaryAction && (
              <button
                type="button"
                disabled={!actionEnabled(primaryAction)}
                onClick={() => onActionClick?.(primaryAction.actionCode, primaryAction.payload)}
                className={`px-2.5 py-1 font-medium rounded-lg transition-colors flex items-center space-x-1 text-xs ${actionEnabled(primaryAction) ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer' : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'}`}
              >
                <span>{primaryAction.label}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}

            {secondaryAction && (
              <button
                type="button"
                disabled={!actionEnabled(secondaryAction)}
                onClick={() => onActionClick?.(secondaryAction.actionCode, secondaryAction.payload)}
                className={`px-2.5 py-1 border border-[#E2E8F0] font-medium rounded-lg transition-colors text-xs ${actionEnabled(secondaryAction) ? 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] cursor-pointer' : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'}`}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>

          {textLinkAction && (
            <button
              type="button"
              disabled={!actionEnabled(textLinkAction)}
              onClick={() => onActionClick?.(textLinkAction.actionCode, textLinkAction.payload)}
              className={`text-[11px] flex items-center space-x-0.5 ml-auto ${actionEnabled(textLinkAction) ? 'text-[#2563EB] hover:underline cursor-pointer' : 'text-[#94A3B8] cursor-not-allowed'}`}
            >
              <span>{textLinkAction.label}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
