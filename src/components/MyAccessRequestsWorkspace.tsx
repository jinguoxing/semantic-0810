import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Clock, Compass, Filter, Play, Search, ShieldAlert, X } from 'lucide-react';
import { useMyAccessSubmissions, type MyAccessSubmissionViewModel, type ResourceRequestViewModel } from '../domain/access/access.selectors';
import { useAccessStore } from '../domain/access/access.store';
import type { SolutionExecutionContext, TaskReadiness } from '../domain/access/access.types';

export interface MyAccessRequestsWorkspaceProps {
  onNavigateToDiscovery?: () => void;
  onNavigateToResources?: () => void;
  onNavigateToSolution?: (solutionId?: string) => void;
  onResumeAnalysisTask?: (taskId: string, solutionId: string, mode?: 'full' | 'degraded', context?: SolutionExecutionContext) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const readiness: Record<TaskReadiness, { label: string; className: string; Icon: typeof Clock }> = {
  WAITING: { label: '等待所需资源', className: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]', Icon: Clock },
  READY: { label: '可继续', className: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#15803D]', Icon: CheckCircle2 },
  DEGRADED: { label: '受限可继续', className: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]', Icon: AlertTriangle },
  BLOCKED: { label: '暂无法继续', className: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]', Icon: ShieldAlert },
};
const stateColor: Record<ResourceRequestViewModel['accessState'], string> = { GRANTED: 'text-[#15803D]', PROCESSING: 'text-[#B45309]', DENIED: 'text-[#B91C1C]', EXPIRED: 'text-[#64748B]' };

export const MyAccessRequestsWorkspace: React.FC<MyAccessRequestsWorkspaceProps> = ({ onNavigateToDiscovery, onNavigateToResources, onNavigateToSolution, onResumeAnalysisTask, addToast }) => {
  const submissions = useMyAccessSubmissions();
  const { getSubmissionRequests, grants } = useAccessStore();
  const [tab, setTab] = useState<'all' | TaskReadiness>('all');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [period, setPeriod] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [sort, setSort] = useState<'recent' | 'submitted'>('recent');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'sub-01-aging': true });
  const [showReadyBanner, setShowReadyBanner] = useState(true);
  const sources = useMemo(() => ['all', ...new Set(submissions.map((item) => item.source))], [submissions]);
  const readyTask = submissions.find((item) => item.taskReadiness === 'READY');

  const filtered = useMemo(() => {
    const now = new Date('2026-08-19T23:59:59.000Z').getTime();
    const periodMs = period === 'today' ? 864e5 : period === '7days' ? 7 * 864e5 : 30 * 864e5;
    return submissions.filter((item) => {
      if (tab !== 'all' && item.taskReadiness !== tab) return false;
      if (source !== 'all' && item.source !== source) return false;
      if (period !== 'all' && new Date(item.updatedAt).getTime() < now - periodMs) return false;
      const term = query.trim().toLocaleLowerCase();
      return !term || [item.taskTitle, item.purposeDescription, ...item.requests.map((request) => request.name)].some((value) => value.toLocaleLowerCase().includes(term));
    }).sort((a, b) => new Date(sort === 'recent' ? b.updatedAt : b.createdAt).getTime() - new Date(sort === 'recent' ? a.updatedAt : a.createdAt).getTime());
  }, [period, query, sort, source, submissions, tab]);

  const contextFor = (item: MyAccessSubmissionViewModel): SolutionExecutionContext => {
    const requests = getSubmissionRequests(item.id);
    const grantIds = Object.values(grants).filter((grant) => grant.state === 'ACTIVE' && requests.some((request) => request.id === grant.requestId)).map((grant) => grant.id);
    return { taskId: item.taskId, solutionId: item.solutionId, goal: item.purposeDescription, resourceIds: requests.map((request) => request.resourceId), requiredResourceIds: requests.filter((request) => request.required).map((request) => request.resourceId), grantIds };
  };
  const resume = (item: MyAccessSubmissionViewModel) => {
    const mode = item.taskReadiness === 'DEGRADED' ? 'degraded' : 'full';
    onResumeAnalysisTask?.(item.taskId, item.solutionId, mode, contextFor(item));
    if (!onResumeAnalysisTask) addToast?.(mode === 'degraded' ? 'info' : 'success', mode === 'degraded' ? '按当前授权恢复任务' : '恢复分析任务', '已恢复原分析任务及已授权的数据方案上下文。');
  };
  const primaryAction = (item: MyAccessSubmissionViewModel) => {
    if (item.taskReadiness === 'READY' || item.taskReadiness === 'DEGRADED') return resume(item);
    if (item.taskReadiness === 'BLOCKED') return onNavigateToSolution?.(item.solutionId);
    setExpanded((current) => ({ ...current, [item.id]: true }));
  };

  return <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-[#172033]"><main className="mx-auto w-full max-w-[1320px] space-y-6 px-8 py-7">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h1 className="text-xl font-bold">我的申请</h1><p className="mt-1 text-xs text-[#667085]">查看已提交的资源访问需求，并在访问条件满足后继续原来的工作。</p></div><button onClick={onNavigateToDiscovery} className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155]"><Compass className="h-3.5 w-3.5" />去发现资源</button></div>
    {showReadyBanner && readyTask && <div className="flex items-center justify-between gap-3 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-2.5 text-xs text-[#166534]"><span><strong>“{readyTask.taskTitle}”</strong> 已具备继续条件。</span><div className="flex items-center gap-3"><button onClick={() => resume(readyTask)} className="rounded bg-[#16A36A] px-2.5 py-1 text-[11px] font-bold text-white">继续分析</button><button onClick={() => setShowReadyBanner(false)}><X className="h-3.5 w-3.5" /></button></div></div>}
    <div className="flex gap-1 overflow-x-auto border-b border-[#E6EAF0] text-xs">{([['all', '全部'], ['WAITING', '等待处理'], ['READY', '可继续'], ['DEGRADED', '受限可继续'], ['BLOCKED', '暂无法继续']] as const).map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`shrink-0 border-b-2 px-4 py-2.5 font-medium ${tab === key ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#667085]'}`}>{label} ({key === 'all' ? submissions.length : submissions.filter((item) => item.taskReadiness === key).length})</button>)}</div>
    <div className="grid gap-3 rounded-lg border border-[#E6EAF0] bg-[#F8FAFC] p-3 md:grid-cols-[1fr_auto_auto_auto]"><label className="relative"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索业务任务、资源名称或申请用途…" className="w-full rounded border border-[#E2E8F0] bg-white py-2 pl-8 pr-3 text-xs" /></label><select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)} className="rounded border border-[#E2E8F0] bg-white px-3 text-xs"><option value="all">申请时间：全部</option><option value="today">申请时间：今天</option><option value="7days">申请时间：近 7 天</option><option value="30days">申请时间：近 30 天</option></select><select value={source} onChange={(event) => setSource(event.target.value)} className="rounded border border-[#E2E8F0] bg-white px-3 text-xs">{sources.map((value) => <option key={value} value={value}>{value === 'all' ? '来源：全部' : `来源：${value}`}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded border border-[#E2E8F0] bg-white px-3 text-xs"><option value="recent">最近更新</option><option value="submitted">提交时间</option></select></div>
    <section className="space-y-4">
      {filtered.map((item) => {
        const style = readiness[item.taskReadiness];
        const Icon = style.Icon;
        const open = Boolean(expanded[item.id]);
        const secondaryLabel = item.taskReadiness === 'DEGRADED' ? '查看限制' : '查看申请';
        const showSecondaryAction = item.taskReadiness !== 'WAITING';

        return <article key={item.id} className="overflow-hidden rounded-lg border border-[#E6EAF0] bg-white">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold">{item.taskTitle}</h2>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.className}`}>
                  <Icon className="h-3.5 w-3.5" />{style.label}
                </span>
              </div>
              <p className="text-xs text-[#667085]">{item.purposeDescription}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#667085]">
                <span>{item.source}</span><span>提交：{item.submittedTime}</span><span>更新：{item.updatedTime}</span>
              </div>
              <div className="grid gap-3 rounded bg-[#F8FAFC] px-3 py-2 text-xs sm:grid-cols-[1fr_auto]">
                <div>
                  <span className="text-[#98A2B3]">访问进展</span>
                  <div className="mt-0.5 font-semibold text-[#334155]">{item.accessProgress}</div>
                </div>
                <div className="sm:min-w-[132px] sm:text-right">
                  <span className="text-[#98A2B3]">当前任务</span>
                  <div className="mt-0.5 font-bold text-[#172033]">{style.label}</div>
                </div>
              </div>
              <p className="text-xs text-[#475569]">{item.taskReadinessNote}</p>
              {item.taskReadiness === 'DEGRADED' && item.limitations && <div className="space-y-1 rounded border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#713F12]">
                <div><strong>当前授权仍可支持：</strong>{item.limitations.canDo.join(' · ')}</div>
                <div><strong>当前限制：</strong>{item.limitations.restricted.join(' · ')}</div>
              </div>}
            </div>
            <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto sm:self-start">
              {showSecondaryAction && <button onClick={() => setExpanded((current) => ({ ...current, [item.id]: !open }))} className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded border border-[#E2E8F0] px-3 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC]">
                {secondaryLabel} {open ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
              </button>}
              <button onClick={() => primaryAction(item)} className={`inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded px-3 text-xs font-bold ${item.taskReadiness === 'BLOCKED' ? 'border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]' : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'}`}>
                <Play className="h-3.5 w-3.5" />{item.primaryAction.label}
              </button>
            </div>
          </div>
          {open && <div className="space-y-3 border-t border-[#E6EAF0] bg-[#FAFCFF] p-4">
            <div className="text-xs font-bold">包含的资源访问请求（{item.requests.length}）</div>
            {item.requests.map((request) => <div key={request.id} className="rounded border border-[#E6EAF0] bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><div className="text-xs font-bold">{request.name}</div><div className="mt-1 text-[11px] text-[#667085]">{request.typeBadge} · {request.roleBadge} · {request.operation}</div></div>
                <div className="text-right"><span className={`text-xs font-bold ${stateColor[request.accessState]}`}>● {request.stateLabel}</span><button className="ml-3 text-[11px] font-semibold text-[#2563EB]">查看申请</button></div>
              </div>
              <p className="mt-2 text-xs text-[#475569]">{request.scopeSummary}</p>
              <p className="mt-1 text-[11px] text-[#667085]">有效期：{request.validity}</p>
              {request.processingNote && <p className="mt-1 text-[11px] text-[#B45309]">{request.processingNote}</p>}
              {request.deniedNote && <p className="mt-1 text-[11px] text-[#B91C1C]">{request.deniedNote}</p>}
            </div>)}
          </div>}
        </article>;
      })}
      {filtered.length === 0 && <div className="rounded-lg border border-dashed border-[#CBD5E1] p-10 text-center text-sm text-[#667085]"><Filter className="mx-auto mb-2 h-5 w-5" />没有符合当前筛选条件的申请。</div>}
    </section>
    <button onClick={onNavigateToResources} className="text-xs font-semibold text-[#2563EB] hover:underline">前往资源列表</button>
  </main></div>;
};
