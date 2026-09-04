import React, { useState } from 'react';
import { Check, HelpCircle, ArrowRight } from 'lucide-react';
import { ClarificationQuestion } from '../model/FindDataTask';

export interface ClarificationBlockProps {
  question: ClarificationQuestion;
  maxSelections?: number;
  disabled?: boolean;
  onSubmit?: (questionId: string, selectedOptionIds: string[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const ClarificationBlock: React.FC<ClarificationBlockProps> = ({
  question,
  maxSelections,
  disabled = false,
  onSubmit,
  onSelectionChange
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    question.resolution?.selectedOptionIds || []
  );
  const [submitted, setSubmitted] = useState<boolean>(false);

  const isResolved = question.resolution?.status === 'RESOLVED';
  const isLocked = disabled || submitted || isResolved;
  const effectiveMax = maxSelections || question.maxSelections || (question.type === 'SINGLE' ? 1 : undefined);

  const handleToggle = (optionId: string) => {
    if (isLocked) return;
    let next: string[];
    if (question.type === 'SINGLE') {
      next = [optionId];
    } else {
      if (selectedIds.includes(optionId)) {
        next = selectedIds.filter((id) => id !== optionId);
      } else {
        if (effectiveMax && selectedIds.length >= effectiveMax) {
          return; // reached limit
        }
        next = [...selectedIds, optionId];
      }
    }
    setSelectedIds(next);
    onSelectionChange?.(next);
  };

  const handleSubmit = () => {
    if (isLocked || selectedIds.length === 0) return;
    setSubmitted(true);
    onSubmit?.(question.id, selectedIds);
  };

  return (
    <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3 text-xs select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-[#0F172A] font-bold">
          <HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>{question.question}</span>
        </div>
        {question.type === 'MULTIPLE' && (
          <span className="text-[11px] text-[#64748B]">
            {effectiveMax ? `最多选 ${effectiveMax} 项` : '可多选'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={isLocked}
              onClick={() => handleToggle(opt.id)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                  : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#CBD5E1]'
              } ${isLocked ? 'opacity-80 cursor-default' : ''}`}
            >
              <div className="flex items-center space-x-2 truncate">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-[#2563EB] border-[#2563EB] text-white'
                      : 'border-[#CBD5E1] bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="font-medium truncate">{opt.label}</span>
              </div>
              {opt.recommended && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DBEAFE] text-[#1E40AF] font-bold shrink-0 ml-1.5">
                  推荐
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          disabled={isLocked || selectedIds.length === 0}
          onClick={handleSubmit}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
            isLocked
              ? 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-default'
              : selectedIds.length === 0
              ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
              : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm cursor-pointer'
          }`}
        >
          <span>{isResolved ? '已确认' : submitted ? '提交中' : '继续'}</span>
          {!isLocked && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
