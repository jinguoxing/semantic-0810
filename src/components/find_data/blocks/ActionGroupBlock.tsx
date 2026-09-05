import React from 'react';
import { ActionGroupItem, FindDataTaskState, TaskActionCode } from '../model/FindDataTask';
import { canExecuteTaskAction } from '../model/findDataSelectors';

interface ActionGroupBlockProps {
  actions: ActionGroupItem[];
  task?: FindDataTaskState;
  onActionClick?: (actionCode: TaskActionCode, payload?: Record<string, unknown>) => void;
  historical?: boolean;
  historicalKind?: FindDataTaskState['turns'][number]['source']['kind'];
}

export const ActionGroupBlock: React.FC<ActionGroupBlockProps> = ({
  actions,
  task,
  onActionClick,
  historical = false,
  historicalKind
}) => {
  const displayLabel = (action: ActionGroupItem) => {
    if (!historical) return action.label;
    if (action.actionCode === 'OPEN_SOLUTION') return '查看最新方案';
    if (action.actionCode === 'OPEN_ASK_PLAN') {
      return historicalKind === 'ASK_RESULT' ? '查看最新结果和计算依据' : '查看最新分析计划';
    }
    return action.label;
  };

  const disabledReason = (action: ActionGroupItem): string | undefined => {
    if (!task || canExecuteTaskAction(task, action.actionCode, action.payload)) return undefined;
    if (task.pendingOperation) return '当前任务正在处理，请稍后再试。';
    if (action.actionCode === 'OPEN_ASK_PLAN' && action.payload?.focusSection === 'RESULT') {
      return '当前分析计划尚未产生可查看的成功结果。';
    }
    return '当前条件不满足，暂不能执行此操作。';
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {actions.map((act) => {
        const isPrimary = act.variant === 'primary';
        const isWeak = act.variant === 'weak';
        const enabled = !task || canExecuteTaskAction(task, act.actionCode, act.payload);
        const reason = disabledReason(act);
        const reasonId = `action-disabled-${act.id}`;

        const btnClass = isPrimary
          ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold shadow-2xs'
          : isWeak
          ? 'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          : 'bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-2xs font-medium';

        return (
          <React.Fragment key={act.id}>
          <button
            type="button"
            disabled={!enabled}
            onClick={() => onActionClick?.(act.actionCode, act.payload)}
            aria-describedby={reason ? reasonId : undefined}
            title={reason}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${enabled ? `cursor-pointer ${btnClass}` : 'cursor-not-allowed bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]'}`}
          >
            {displayLabel(act)}
          </button>
          {reason && <span id={reasonId} className="sr-only">{reason}</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};
