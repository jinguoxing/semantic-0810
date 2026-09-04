import React from 'react';
import { ActionGroupItem, TaskActionCode } from '../model/FindDataTask';

interface ActionGroupBlockProps {
  actions: ActionGroupItem[];
  onActionClick?: (actionCode: TaskActionCode, payload?: Record<string, unknown>) => void;
}

export const ActionGroupBlock: React.FC<ActionGroupBlockProps> = ({
  actions,
  onActionClick
}) => {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {actions.map((act) => {
        const isPrimary = act.variant === 'primary';
        const isWeak = act.variant === 'weak';

        const btnClass = isPrimary
          ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold shadow-2xs'
          : isWeak
          ? 'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          : 'bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-2xs font-medium';

        return (
          <button
            key={act.id}
            type="button"
            onClick={() => onActionClick?.(act.actionCode, act.payload)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${btnClass}`}
          >
            {act.label}
          </button>
        );
      })}
    </div>
  );
};
