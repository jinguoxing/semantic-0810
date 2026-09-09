/**
 * 共享业务对象发布确认弹窗（Business Object Publish Dialog）
 *
 * 发布前确认：本次变更清单、修订号、数据支撑说明、依据与影响均由调用方以数据传入，
 * 组件本身不持有任何页面写死的发布内容。Create 与 Change 发布共用。
 */
import React from 'react';

export interface BusinessObjectPublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  objectName: string;
  /** 本次正式更新的变更清单 */
  changeSummary: string[];
  /** 数据支撑说明（可选区块） */
  dataSupportNotes?: string[];
  /** 发布前正式修订号，如 'R1'（Create 时可省略） */
  currentRevision?: string;
  /** 发布后形成的正式修订号，如 'R2' */
  nextRevision?: string;
  /** 定义依据摘要（可选区块） */
  evidenceSummary?: string[];
  /** 影响摘要（可选区块） */
  impactSummary?: string[];
  /** 弹窗标题，默认「确认发布业务对象」 */
  title?: string;
  /** 弹窗说明，默认引用 objectName 形成新版本 */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const BusinessObjectPublishDialog: React.FC<BusinessObjectPublishDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  objectName,
  changeSummary,
  dataSupportNotes,
  currentRevision,
  nextRevision,
  evidenceSummary,
  impactSummary,
  title,
  description,
  confirmLabel = '确认发布',
  cancelLabel = '返回编辑'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-2xs flex items-center justify-center p-4">
      <div
        id="business-object-publish-dialog"
        className="bg-white border border-[#E2E8F0] rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#0F172A]">{title ?? '确认发布业务对象'}</h3>
          <p className="text-xs text-[#64748B]">
            {description ?? `发布后将形成「${objectName}」新的正式业务对象版本。`}
          </p>
          {currentRevision && nextRevision && (
            <p className="text-xs text-[#334155] pt-0.5">
              正式修订号：<span className="font-mono font-semibold">{currentRevision}</span>
              <span className="mx-1.5 text-[#94A3B8]">→</span>
              <span className="font-mono font-semibold text-[#2563EB]">{nextRevision}</span>
            </p>
          )}
          {!currentRevision && nextRevision && (
            <p className="text-xs text-[#334155] pt-0.5">
              首次发布将形成正式修订号 <span className="font-mono font-semibold text-[#2563EB]">{nextRevision}</span>
            </p>
          )}
        </div>

        <div className="space-y-3.5 text-xs text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
          <div className="space-y-1.5">
            <div className="font-bold text-[#0F172A]">本次将正式更新：</div>
            <ul className="list-disc list-inside space-y-1 text-[#475569] pl-1">
              {changeSummary.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {dataSupportNotes && dataSupportNotes.length > 0 && (
            <div className="border-t border-[#E2E8F0] pt-2.5 space-y-1.5">
              <div className="font-bold text-[#0F172A]">数据支撑：</div>
              <ul className="list-disc list-inside space-y-1 text-[#475569] pl-1">
                {dataSupportNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {evidenceSummary && evidenceSummary.length > 0 && (
            <div className="border-t border-[#E2E8F0] pt-2.5 space-y-1.5">
              <div className="font-bold text-[#0F172A]">定义依据：</div>
              <ul className="list-disc list-inside space-y-1 text-[#475569] pl-1">
                {evidenceSummary.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {impactSummary && impactSummary.length > 0 && (
            <div className="border-t border-[#E2E8F0] pt-2.5 space-y-1.5">
              <div className="font-bold text-[#0F172A]">发布影响：</div>
              <ul className="list-disc list-inside space-y-1 text-[#475569] pl-1">
                {impactSummary.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2.5 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-md transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            id="btn-confirm-publish"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
