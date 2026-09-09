/**
 * 共享业务对象历史抽屉（Business Object History Drawer）
 *
 * 变更历史必须来自领域 Revision Store（listRevisions），组件本身
 * 不持有任何页面写死的版本记录。
 */
import React from 'react';
import { X } from 'lucide-react';
import type { BusinessObjectRevision } from '../../domain/business-object';

export interface BusinessObjectHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  objectName: string;
  /** 修订记录：来自领域 Revision Store（listRevisions(objectId)） */
  revisions: BusinessObjectRevision[];
  /** 抽屉标题，默认「变更历史 · {objectName}」 */
  title?: string;
  /** 抽屉副标题 */
  subtitle?: string;
  /** 无修订记录时的提示 */
  emptyHint?: string;
}

export const BusinessObjectHistoryDrawer: React.FC<BusinessObjectHistoryDrawerProps> = ({
  isOpen,
  onClose,
  objectName,
  revisions,
  title,
  subtitle,
  emptyHint
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
      <aside className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-[#0F172A]">{title ?? `变更历史 · ${objectName}`}</h3>
            <p className="text-xs text-[#64748B]">
              {subtitle ?? '企业业务语义目录中该对象的生效版本记录'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {revisions.length > 0 ? (
            revisions.map((revision, index) => (
              <div
                key={revision.id}
                className={`p-4 border border-[#E2E8F0] rounded space-y-2 ${
                  index === 0 ? 'bg-white' : 'bg-[#F8FAFC] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={index === 0 ? 'font-bold text-[#0F172A]' : 'font-medium text-[#334155]'}>
                    {revision.revision} · {revision.summary}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      revision.status === 'ACTIVE'
                        ? 'text-[#166534] bg-[#F0FDF4] border border-[#DCFCE7]'
                        : 'text-[#64748B] bg-[#F1F5F9]'
                    }`}
                  >
                    {revision.status === 'ACTIVE' ? '当前生效' : '历史版本'}
                  </span>
                </div>
                <ul className="space-y-1">
                  {revision.changes.map((change, changeIdx) => (
                    <li key={changeIdx} className="text-xs text-[#475569] leading-relaxed">
                      · {change}
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] text-[#64748B] pt-1">
                  {revision.changedBy} · {revision.createdAt.slice(0, 10)}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#64748B]">
              {emptyHint ?? '尚无正式修订记录，当前定义来自初始登记。'}
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
