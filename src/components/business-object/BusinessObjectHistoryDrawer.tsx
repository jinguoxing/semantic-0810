/**
 * 共享业务对象历史抽屉（Business Object History Drawer）
 *
 * 三个生命周期分节呈现，互不混淆：
 * - 业务定义版本：BusinessObjectRevision（仅此分节显示「当前正式版本」）
 * - 数据支撑变化：DataSupportRevision（BOTTOM_UP_ALIGN / TOP_DOWN_CONFIRM / 复核 / 重绑 / 退休 / 切主）
 * - Grounding 修正：GroundingRevision（属性对应修正 / 关系对应修正）
 * 所有记录必须来自领域 Store，组件本身不持有任何页面写死的版本记录。
 */
import React from 'react';
import { X } from 'lucide-react';
import type {
  BusinessObjectRevision,
  DataSupportRevision,
  GroundingRevision
} from '../../domain/business-object';

const DATA_SUPPORT_ACTION_LABELS: Record<DataSupportRevision['action'], string> = {
  BOTTOM_UP_ALIGN: '自下而上对齐生效',
  TOP_DOWN_CONFIRM: '候选确认生效',
  MARK_REVALIDATION: '标记待复核',
  REVALIDATION_KEEP: '复核确认继续',
  REBIND: '重新绑定',
  RETIRE: '退休',
  SET_PRIMARY: '切换主要实现'
};

const BINDING_STATUS_LABELS: Record<string, string> = {
  CANDIDATE: '候选待确认',
  EFFECTIVE: '已生效',
  NEEDS_REVALIDATION: '待复核',
  RETIRED: '已退休'
};

function formatStatusPair(revision: DataSupportRevision): string | null {
  if (!revision.beforeStatus && !revision.afterStatus) return null;
  const before = revision.beforeStatus ? BINDING_STATUS_LABELS[revision.beforeStatus] ?? revision.beforeStatus : '—';
  const after = revision.afterStatus ? BINDING_STATUS_LABELS[revision.afterStatus] ?? revision.afterStatus : '—';
  return before === after ? after : `${before} → ${after}`;
}

export interface BusinessObjectHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  objectName: string;
  /** 业务定义修订：来自 listRevisions(objectId) */
  revisions: BusinessObjectRevision[];
  /** 数据支撑修订：来自 listDataSupportRevisions(objectId) */
  dataSupportRevisions?: DataSupportRevision[];
  /** Grounding 修订：来自 groundingService.listByObject(objectId) */
  groundingRevisions?: GroundingRevision[];
  /** 抽屉标题，默认「变更历史 · {objectName}」 */
  title?: string;
  /** 抽屉副标题 */
  subtitle?: string;
}

const SectionShell: React.FC<{
  label: string;
  count: number;
  emptyHint: string;
  children?: React.ReactNode;
}> = ({ label, count, emptyHint, children }) => (
  <section className="space-y-2" aria-label={label}>
    <div className="flex items-center space-x-2">
      <span className="text-xs font-bold text-[#0F172A]">{label}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] font-medium">
        {count} 条
      </span>
    </div>
    {count === 0 ? (
      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#64748B]">{emptyHint}</div>
    ) : (
      children
    )}
  </section>
);

export const BusinessObjectHistoryDrawer: React.FC<BusinessObjectHistoryDrawerProps> = ({
  isOpen,
  onClose,
  objectName,
  revisions,
  dataSupportRevisions = [],
  groundingRevisions = [],
  title,
  subtitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
      <aside className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-[#0F172A]">{title ?? `变更历史 · ${objectName}`}</h3>
            <p className="text-xs text-[#64748B]">
              {subtitle ?? '业务定义版本、数据支撑变化与落地修正分节记录，均来自领域 Store'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* ============ 第一节：业务定义版本（BusinessObjectRevision） ============ */}
          <SectionShell label="业务定义版本" count={revisions.length} emptyHint="尚无正式定义修订记录。">
            <div className="space-y-3">
              {revisions.map((revision) => (
                <div
                  key={revision.id}
                  className={`p-4 border border-[#E2E8F0] rounded space-y-2 ${
                    revision.status === 'ACTIVE' ? 'bg-white' : 'bg-[#F8FAFC] opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={revision.status === 'ACTIVE' ? 'font-bold text-[#0F172A]' : 'font-medium text-[#334155]'}>
                      {revision.revision} · {revision.summary}
                    </span>
                    {revision.status === 'ACTIVE' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium text-[#166534] bg-[#F0FDF4] border border-[#DCFCE7]">
                        当前正式版本
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium text-[#64748B] bg-[#F1F5F9]">历史版本</span>
                    )}
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
              ))}
            </div>
          </SectionShell>

          {/* ============ 第二节：数据支撑变化（DataSupportRevision） ============ */}
          <SectionShell label="数据支撑变化" count={dataSupportRevisions.length} emptyHint="尚无数据支撑变更记录。">
            <div className="space-y-3">
              {dataSupportRevisions.map((revision) => {
                const statusPair = formatStatusPair(revision);
                return (
                  <div key={revision.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">{DATA_SUPPORT_ACTION_LABELS[revision.action]}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE]">
                        数据支撑变更
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed">{revision.reason}</p>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#64748B]">
                      {statusPair && <span>绑定状态：{statusPair}</span>}
                      <span>
                        {revision.changedBy} · {revision.createdAt.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionShell>

          {/* ============ 第三节：Grounding 修正（GroundingRevision） ============ */}
          <SectionShell label="Grounding 修正" count={groundingRevisions.length} emptyHint="尚无属性 / 关系落地修正记录。">
            <div className="space-y-3">
              {groundingRevisions.map((revision) => (
                <div key={revision.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">
                      {revision.targetName}：{revision.before.field} → {revision.after.field}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE]">
                      {revision.type === 'ATTRIBUTE' ? '属性对应修正' : '关系对应修正'}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">{revision.reason}</p>
                  <div className="text-[11px] text-[#64748B]">
                    {(revision.evidence ?? []).length > 0 && <span>依据 {revision.evidence.length} 项 · </span>}
                    {revision.createdAt.slice(0, 10)}
                  </div>
                </div>
              ))}
            </div>
          </SectionShell>
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
