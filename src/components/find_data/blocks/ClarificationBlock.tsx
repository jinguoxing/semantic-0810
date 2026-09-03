import React, { useState } from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { ClarificationQuestion } from '../model/FindDataTask';

interface ClarificationBlockProps {
  question: ClarificationQuestion;
  onSelectionChange?: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export const ClarificationBlock: React.FC<ClarificationBlockProps> = ({
  question,
  onSelectionChange,
  disabled = false
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(question.selectedOptionIds || []);

  const handleToggle = (optionId: string) => {
    if (disabled) return;
    let next: string[];
    if (question.type === 'SINGLE') {
      next = [optionId];
    } else {
      if (selectedIds.includes(optionId)) {
        next = selectedIds.filter((id) => id !== optionId);
      } else {
        next = [...selectedIds, optionId];
      }
    }
    setSelectedIds(next);
    onSelectionChange?.(next);
  };

  return (
    <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2.5 text-xs select-none">
      <div className="flex items-center space-x-1.5 text-[#0F172A] font-bold">
        <HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" />
        <span>{question.question}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => handleToggle(opt.id)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                  : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#CBD5E1]'
              } ${disabled ? 'opacity-75 cursor-default' : ''}`}
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
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#DBEAFE] text-[#1E40AF] font-bold shrink-0 ml-1.5">
                  推荐
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
