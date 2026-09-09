/**
 * 共享业务证据抽屉（Business Evidence Drawer）
 *
 * 展示业务对象定义依据：证据列表由调用方传入（领域 Store 的 evidence
 * 或工作区组装的证据数据），组件本身不持有任何页面写死内容。
 */
import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { EVIDENCE_KIND_LABELS, type EvidenceReference } from '../../domain/business-object';

export interface BusinessEvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  objectName: string;
  /** 依据列表：来自领域 Store（object.evidence）或调用方组装的证据数据 */
  evidence: EvidenceReference[];
  /** 抽屉标题，默认「定义依据 · {objectName}」 */
  title?: string;
  /** 抽屉副标题 */
  subtitle?: string;
}

export const BusinessEvidenceDrawer: React.FC<BusinessEvidenceDrawerProps> = ({
  isOpen,
  onClose,
  objectName,
  evidence,
  title,
  subtitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
      <aside className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-[#0F172A]">{title ?? `定义依据 · ${objectName}`}</h3>
            <p className="text-xs text-[#64748B]">
              {subtitle ?? '当前正式业务定义的已记录来源'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[#334155]">
          {evidence.length > 0 ? (
            evidence.map((item) => (
              <div key={item.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-semibold text-[#0F172A]">{item.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-medium shrink-0">
                    {EVIDENCE_KIND_LABELS[item.kind]}
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {item.adoptedDecision ?? '作为该业务对象定义的已记录来源。'}
                </p>
                <div className="text-[11px] text-[#64748B]">
                  来源：{item.source}
                  {item.version ? ` · ${item.version}` : ''}
                  {item.location ? ` · ${item.location}` : ''}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#94A3B8]">
              暂无记录的定义依据。
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded hover:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </aside>
    </div>
  );
};
