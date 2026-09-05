import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, HelpCircle, ArrowRight } from 'lucide-react';
import { ClarificationQuestion } from '../model/FindDataTask';

export interface ClarificationBlockProps {
  question: ClarificationQuestion;
  submitting?: boolean;
  error?: string;
  onSubmit: (questionId: string, selectedOptionIds: string[]) => Promise<void>;
  maxSelections?: number;
  disabled?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

function confirmedSummary(question: ClarificationQuestion, labels: string[]): string {
  return /比较基准/.test(question.question)
    ? `已确认比较基准：${labels.join('、') || '已确认选项'}`
    : `已确认：${labels.join('、') || '已确认选项'}`;
}

export const ClarificationBlock: React.FC<ClarificationBlockProps> = ({
  question,
  submitting = false,
  error,
  maxSelections,
  disabled = false,
  onSubmit,
  onSelectionChange
}) => {
  const resolutionStatus = question.resolution?.status ?? 'OPEN';
  const selectedOptionKey = (question.resolution?.selectedOptionIds ?? []).join('|');
  const [selectedIds, setSelectedIds] = useState<string[]>(question.resolution?.selectedOptionIds || []);
  const [localError, setLocalError] = useState<string>();
  const [isExpanded, setIsExpanded] = useState(false);

  const isResolved = resolutionStatus === 'RESOLVED';
  const isStale = resolutionStatus === 'STALE';
  const isLocked = disabled || submitting || isResolved || isStale;
  const effectiveMax = maxSelections || question.maxSelections || (question.type === 'SINGLE' ? 1 : undefined);
  const detailsId = `clarification-history-${question.id}`;
  const selectedOptions = useMemo(
    () => question.options.filter((option) => selectedIds.includes(option.id)),
    [question.options, selectedIds]
  );

  useEffect(() => {
    setSelectedIds(question.resolution?.selectedOptionIds || []);
    setLocalError(undefined);
    setIsExpanded(false);
  }, [question.id, resolutionStatus, selectedOptionKey]);

  const updateSelection = (next: string[]) => {
    setSelectedIds(next);
    onSelectionChange?.(next);
  };

  const handleToggle = (optionId: string) => {
    if (isLocked) return;
    if (question.type === 'SINGLE') {
      updateSelection([optionId]);
      return;
    }
    if (selectedIds.includes(optionId)) {
      updateSelection(selectedIds.filter((id) => id !== optionId));
      return;
    }
    if (effectiveMax && selectedIds.length >= effectiveMax) return;
    updateSelection([...selectedIds, optionId]);
  };

  const handleSubmit = async () => {
    if (isLocked || selectedIds.length === 0) return;
    setLocalError(undefined);
    try {
      await onSubmit(question.id, selectedIds);
    } catch (submitError: unknown) {
      setLocalError(submitError instanceof Error ? submitError.message : '提交失败，请重试。');
    }
  };

  const historyToggle = (
    <button
      type="button"
      aria-expanded={isExpanded}
      aria-controls={detailsId}
      onClick={() => setIsExpanded((expanded) => !expanded)}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
    >
      <span>{isExpanded ? '收起历史选项' : '展开历史选项'}</span>
      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
    </button>
  );

  const historicalDetails = isExpanded && (
    <div id={detailsId} className="space-y-2 rounded-lg border border-[#E2E8F0] bg-white p-3 text-xs text-[#475569]">
      <p className="font-semibold text-[#0F172A]">{question.question}</p>
      <ul className="space-y-1.5">
        {selectedOptions.map((option) => (
          <li key={option.id} className="rounded-md bg-[#F8FAFC] px-2.5 py-2">
            <span className="font-medium text-[#0F172A]">{option.label}</span>
            {option.description && <p className="mt-0.5 leading-relaxed">{option.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );

  if (isResolved) {
    return (
      <section className="space-y-2 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-3 text-xs" aria-label="已确认的澄清决定">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-semibold text-[#166534]">
            <Check className="h-3.5 w-3.5" />
            {confirmedSummary(question, selectedOptions.map((option) => option.label))}
          </p>
          {historyToggle}
        </div>
        {historicalDetails}
      </section>
    );
  }

  if (isStale) {
    return (
      <section className="space-y-2 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-3 text-xs" aria-label="已失效的澄清决定">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[#9A3412]">当前需求已变化，此选择已失效。</p>
          {historyToggle}
        </div>
        {historicalDetails}
      </section>
    );
  }

  const errorMessage = error || localError;
  return (
    <section className="space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs" aria-busy={submitting}>
      <fieldset disabled={disabled || submitting} className="space-y-3">
        <legend className="flex w-full items-center justify-between gap-3 font-bold text-[#0F172A]">
          <span className="flex items-start gap-1.5 leading-relaxed">
            <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
            <span>{question.question}</span>
          </span>
          {question.type === 'MULTIPLE' && (
            <span className="shrink-0 text-[11px] font-normal text-[#64748B]">
              {effectiveMax ? `最多选 ${effectiveMax} 项` : '可多选'}
            </span>
          )}
        </legend>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role={question.type === 'SINGLE' ? 'radiogroup' : undefined}>
          {question.options.map((option) => {
            const isSelected = selectedIds.includes(option.id);
            const inputType = question.type === 'SINGLE' ? 'radio' : 'checkbox';
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-2.5 text-left transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-[#2563EB] ${
                  isSelected
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                    : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#CBD5E1]'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type={inputType}
                    name={`clarification-${question.id}`}
                    checked={isSelected}
                    onChange={() => handleToggle(option.id)}
                    className="h-4 w-4 shrink-0 accent-[#2563EB]"
                  />
                  <span className="font-medium leading-relaxed">{option.label}</span>
                </span>
                {option.recommended && <span className="pointer-events-none shrink-0 rounded bg-[#DBEAFE] px-1.5 py-0.5 text-[10px] font-bold text-[#1E40AF]">推荐</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      {errorMessage && <p role="alert" className="rounded-md bg-[#FEF2F2] px-2.5 py-2 text-xs text-[#B91C1C]">{errorMessage}</p>}

      <div className="flex justify-end pt-1">
        <button
          type="button"
          disabled={isLocked || selectedIds.length === 0}
          onClick={handleSubmit}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
            isLocked || selectedIds.length === 0
              ? 'cursor-not-allowed border border-[#E2E8F0] bg-[#F1F5F9] text-[#94A3B8]'
              : 'cursor-pointer bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm'
          }`}
        >
          <span>{submitting ? '提交中' : '继续'}</span>
          {!isLocked && <ArrowRight className="h-3 w-3" />}
        </button>
      </div>
    </section>
  );
};
