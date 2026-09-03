import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { ResultBriefBlock as ResultBriefBlockType } from '../model/FindDataTask';

interface ResultBriefBlockProps {
  block: ResultBriefBlockType;
  onActionClick?: (actionCode: string, payload?: Record<string, unknown>) => void;
}

export const ResultBriefBlock: React.FC<ResultBriefBlockProps> = ({
  block,
  onActionClick
}) => {
  const { title, candidates, keyPoints, primaryAction, secondaryAction, textLinkAction } = block;

  return (
    <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-xs space-y-2.5 shadow-2xs select-none">
      {/* Title & Badge */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
        <span className="font-bold text-[#0F172A] tracking-tight truncate">
          {title}
        </span>
        {candidates && candidates.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-mono shrink-0 ml-2">
            共 {candidates.length} 项
          </span>
        )}
      </div>

      {/* Content Area (bounded height 144-168px with custom scrollbar) */}
      <div className="max-h-[168px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {candidates && candidates.length > 0 ? (
          <div className="space-y-1.5 divide-y divide-[#F1F5F9]">
            {candidates.map((cand) => (
              <div key={cand.resourceId} className="pt-1.5 first:pt-0 space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="font-semibold text-[#1E293B] truncate">{cand.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] font-medium border border-[#BFDBFE] shrink-0">
                      {cand.typeBadge}
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#16A34A] font-medium border border-[#DCFCE7] shrink-0 ml-2">
                    {cand.statusBadge}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] line-clamp-1">
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
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {primaryAction && (
              <button
                type="button"
                onClick={() => onActionClick?.(primaryAction.actionCode, primaryAction.payload)}
                className="px-3 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 text-xs"
              >
                <span>{primaryAction.label}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}

            {secondaryAction && (
              <button
                type="button"
                onClick={() => onActionClick?.(secondaryAction.actionCode, secondaryAction.payload)}
                className="px-3 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] font-medium rounded-lg transition-colors cursor-pointer text-xs"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>

          {textLinkAction && (
            <button
              type="button"
              onClick={() => onActionClick?.(textLinkAction.actionCode, textLinkAction.payload)}
              className="text-[11px] text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-0.5"
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
