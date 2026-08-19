import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpDown, Check, ChevronRight, Filter, Search, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react';
import { AdminCenterShell, type AdminCenterItem } from './AdminCenterShell';
import { usePendingReviewRequests, type AccessReviewItemViewModel } from '../domain/access/access.selectors';
import { useAccessStore } from '../domain/access/access.store';

export type ReviewItem = AccessReviewItemViewModel;
export interface AccessReviewWorkspaceProps {
  onNavigateToDataMarket?: () => void;
  onNavigateToBusinessSemantics?: () => void;
  onNavigateToAiHome?: () => void;
  onNavigateToAuthorizationRecords?: () => void;
  onNavigateToPolicyManagement?: () => void;
  onNavigateToAuditLogs?: () => void;
  onOpenDetail?: (requestId: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const riskClass = { LOW: 'bg-[#ECFDF5] text-[#15803D] border-[#A7F3D0]', MEDIUM: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]', HIGH: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]' };

export const AccessReviewWorkspace: React.FC<AccessReviewWorkspaceProps> = ({ onNavigateToAiHome, onNavigateToAuthorizationRecords, onNavigateToPolicyManagement, onNavigateToAuditLogs, onOpenDetail, addToast }) => {
  const reviewItems = usePendingReviewRequests();
  const { decideRequest } = useAccessStore();
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [sort, setSort] = useState<'NEWEST' | 'RISK_DESC' | 'APPLICANT'>('NEWEST');
  const [mineOnly, setMineOnly] = useState(false);
  const [activeItem, setActiveItem] = useState<AdminCenterItem>('access-review');
  const items = useMemo(() => reviewItems.filter((item) => {
    const term = query.trim().toLocaleLowerCase();
    if (risk !== 'ALL' && item.riskLevel !== risk) return false;
    if (mineOnly && !item.isAssignedToMe) return false;
    return !term || [item.requestId, item.resourceName, item.applicantName, item.applicantDepartment, item.parentSubmissionTitle].some((value) => value.toLocaleLowerCase().includes(term));
  }).sort((a, b) => sort === 'RISK_DESC' ? ({ HIGH: 3, MEDIUM: 2, LOW: 1 }[b.riskLevel] - { HIGH: 3, MEDIUM: 2, LOW: 1 }[a.riskLevel]) : sort === 'APPLICANT' ? a.applicantName.localeCompare(b.applicantName, 'zh') : b.timestamp - a.timestamp), [mineOnly, query, reviewItems, risk, sort]);
  const navigate = (item: AdminCenterItem) => {
    setActiveItem(item);
    if (item === 'authorization-records') onNavigateToAuthorizationRecords?.();
    if (item === 'policies') onNavigateToPolicyManagement?.();
    if (item === 'audit-logs') onNavigateToAuditLogs?.();
    if (item === 'users') addToast?.('info', '组织与用户', '组织与用户目录暂未在本次工作范围内。');
  };
  const decide = (item: ReviewItem, decision: 'GRANT' | 'GRANT_WITH_LIMITS' | 'DENY') => {
    decideRequest({ requestId: item.requestId, decision, reason: decision === 'DENY' ? '审核队列直接拒绝' : '审核队列按建议处理' });
    addToast?.(decision === 'DENY' ? 'info' : 'success', '访问决策已完成', `${item.resourceName} 已${decision === 'DENY' ? '拒绝' : '写入有效授权'}，原任务状态已重算。`);
  };
  return <AdminCenterShell activeItem={activeItem} onNavigate={navigate}><main className="flex-1 overflow-y-auto"><div className="mx-auto max-w-6xl space-y-5 p-6 lg:p-8">
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="mb-2 text-xs text-[#667085]">管理中心 / 权限管理</div><h1 className="text-xl font-bold">访问审核</h1><p className="mt-1 text-xs text-[#667085]">处理需要人工确认的资源访问申请。待处理状态代表工作流，不代表风险等级。</p></div><div className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs font-bold text-[#B45309]">待人工确认 {reviewItems.length}</div></header>
    <div className="grid gap-3 rounded-lg border border-[#E6EAF0] bg-white p-3 md:grid-cols-[1fr_auto_auto_auto]"><label className="relative"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索资源、申请人、任务或编号" className="w-full rounded border border-[#E2E8F0] py-2 pl-8 pr-3 text-xs" /></label><select value={risk} onChange={(event) => setRisk(event.target.value as typeof risk)} className="rounded border border-[#E2E8F0] px-3 text-xs"><option value="ALL">全部风险</option><option value="LOW">低风险</option><option value="MEDIUM">中等风险</option><option value="HIGH">高风险</option></select><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded border border-[#E2E8F0] px-3 text-xs"><option value="NEWEST">最新提交</option><option value="RISK_DESC">风险优先</option><option value="APPLICANT">申请人</option></select><label className="flex items-center gap-2 rounded border border-[#E2E8F0] px-3 text-xs"><input type="checkbox" checked={mineOnly} onChange={(event) => setMineOnly(event.target.checked)} />仅我的任务</label></div>
    <section className="space-y-3">{items.map((item) => { const canQuickApprove = item.riskLevel === 'LOW'; return <article key={item.id} className="rounded-lg border border-[#E6EAF0] bg-white p-4 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{item.resourceName}</h2><span className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] text-[#475569]">{item.requestedAction}</span><span className={`rounded border px-2 py-0.5 text-[11px] font-bold ${riskClass[item.riskLevel]}`}>{item.riskLevel === 'HIGH' ? '高风险' : item.riskLevel === 'MEDIUM' ? '中等风险' : '低风险'}</span></div><p className="text-xs text-[#475569]">{item.resourceActionSummary}</p><div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#667085]"><span>{item.applicantName} · {item.applicantDepartment}</span><span>{item.parentSubmissionTitle}</span><span>{item.submittedAtText}</span><span className="font-mono">{item.requestId}</span></div><div className="rounded bg-[#F8FAFC] px-3 py-2 text-xs text-[#475569]"><strong className="text-[#334155]">触发原因：</strong>{item.reviewReasonDescription}</div></div><div className="flex shrink-0 flex-wrap gap-2"><button onClick={() => onOpenDetail?.(item.requestId)} className="inline-flex items-center gap-1 rounded border border-[#CBD5E1] px-3 py-2 text-xs font-bold text-[#334155]">进入审核 <ChevronRight className="h-3.5 w-3.5" /></button>{canQuickApprove && <><button onClick={() => decide(item, 'DENY')} className="rounded border border-[#FECDCA] px-3 py-2 text-xs font-bold text-[#B91C1C]">不授权</button><button onClick={() => decide(item, 'GRANT_WITH_LIMITS')} className="inline-flex items-center gap-1 rounded bg-[#2563EB] px-3 py-2 text-xs font-bold text-white"><Check className="h-3.5 w-3.5" />按建议处理</button></>}</div></div></article>; })}{items.length === 0 && <div className="rounded-lg border border-dashed border-[#CBD5E1] p-10 text-center text-sm text-[#667085]"><ShieldCheck className="mx-auto mb-2 h-5 w-5" />当前没有待处理的访问申请。</div>}</section>
  </div></main></AdminCenterShell>;
};
