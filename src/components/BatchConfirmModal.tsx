import React, { useState } from 'react';
import { X, CheckCircle2, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { FieldItem } from '../types';

interface BatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FieldItem[];
  onConfirmBatch: (selectedIds: string[]) => void;
}

export const BatchConfirmModal: React.FC<BatchConfirmModalProps> = ({
  isOpen,
  onClose,
  fields,
  onConfirmBatch,
}) => {
  if (!isOpen) return null;

  const batchableFields = fields.filter((f) => f.confidenceScore >= 80 || f.isBatchEligible);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    batchableFields.map((f) => f.id)
  );

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedIds(batchableFields.map((f) => f.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleSubmit = () => {
    onConfirmBatch(selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#059669]/30 text-[#059669] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center space-x-2">
                <span>AI 建议批量确认工作台</span>
                <span className="text-xs font-mono font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#059669]/20">
                  {batchableFields.length} 个高可信字段
                </span>
              </h3>
              <p className="text-xs text-[#64748B]">
                可信度大于 80% 且匹配企业标准的字段，建议进行一键批量沉淀。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Toolbar */}
        <div className="px-6 py-2.5 bg-[#EEF2FF]/60 border-b border-[#E2E8F0] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3 text-[#312E81]">
            <span className="font-semibold">
              已选定: <span className="font-mono font-bold text-[#4F46E5]">{selectedIds.length}</span> / {batchableFields.length}
            </span>
            <span className="text-[#CBD5E1]">|</span>
            <button onClick={selectAll} className="text-[#4F46E5] hover:underline font-medium">
              全选
            </button>
            <button onClick={deselectAll} className="text-[#64748B] hover:underline font-medium">
              取消全选
            </button>
          </div>

          <div className="text-[11px] text-[#64748B] flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>2 冲突字段已排除，需单项裁决</span>
          </div>
        </div>

        {/* Field Selection Table */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-[#E2E8F0] px-6">
          {batchableFields.map((f) => {
            const isChecked = selectedIds.includes(f.id);
            return (
              <div
                key={f.id}
                onClick={() => toggleSelect(f.id)}
                className={`py-2.5 px-3 flex items-center justify-between text-xs cursor-pointer hover:bg-[#F8FAFC] transition-colors ${
                  isChecked ? 'bg-[#ECFDF5]/30' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 text-[#059669] rounded border-[#CBD5E1] focus:ring-[#059669]"
                  />
                  <div>
                    <div className="font-mono font-bold text-[#1E293B] flex items-center space-x-2">
                      <span>{f.name}</span>
                      <span className="text-[10px] text-[#64748B] font-mono px-1.5 py-0.2 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                        {f.dataType}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      推荐语义: <span className="font-semibold text-[#312E81]">{f.recommendedSemantic}</span>
                      <span className="mx-1.5">•</span>
                      业务标准: <span className="text-[#059669]">{f.businessName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] text-[#94A3B8]">AI可信度</span>
                    <div className="font-mono font-bold text-xs text-[#059669]">
                      {f.confidenceScore}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="text-xs text-[#64748B]">
            确认后将直接生成对应的业务对象属性与指标依赖关系。
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded-md transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] disabled:opacity-50 rounded-md shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>确认并沉淀 {selectedIds.length} 个字段语义资产</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
