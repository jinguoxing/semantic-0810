import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  X,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Database,
  FileText,
  ShieldAlert,
  GitBranch,
  RefreshCw,
  ExternalLink,
  Tag,
  Box,
  Check,
  AlertTriangle
} from 'lucide-react';
import { DataSemanticsQueueItem } from '../types';
import { MOCK_DATA_SEMANTICS_QUEUE } from '../data/dataSemanticsData';

interface DataSemanticsQueueWorkspaceProps {
  onNavigateToTableUnderstanding?: (tableName: string) => void;
  onNavigateToCatalog?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const DataSemanticsQueueWorkspace: React.FC<DataSemanticsQueueWorkspaceProps> = ({
  onNavigateToTableUnderstanding,
  onNavigateToCatalog,
  addToast,
}) => {
  // Queue Tab State (Default: 'pending_review' 待处理)
  const [activeQueueTab, setActiveQueueTab] = useState<'pending_review' | 'ai_understanding' | 'draft_pending' | 'confirmed' | 'all'>('pending_review');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'issues_first' | 'updated' | 'name'>('issues_first');

  // Filter Drawer State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [workFilter, setWorkFilter] = useState<'ALL' | 'conflict' | 'grain' | 'identity'>('ALL');
  const [domainFilter, setDomainFilter] = useState<'ALL' | '公共服务' | '人口服务' | '企业服务' | '城市治理'>('ALL');

  // Batch Start AI Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [batchScopeTable, setBatchScopeTable] = useState(true);
  const [batchScopeField, setBatchScopeField] = useState(true);

  // Confirm Semantics Drawer State
  const [confirmItem, setConfirmItem] = useState<DataSemanticsQueueItem | null>(null);

  // Filtered List calculation
  const filteredList = useMemo(() => {
    return MOCK_DATA_SEMANTICS_QUEUE.filter((item) => {
      // 1. Queue Tab Filter
      if (activeQueueTab !== 'all' && item.queueCategory !== activeQueueTab) {
        return false;
      }

      // 2. Work Filter
      if (workFilter !== 'ALL') {
        if (workFilter === 'conflict' && item.issuesToHandle.type !== 'conflict') return false;
        if (workFilter === 'grain' && item.issuesToHandle.type !== 'grain') return false;
        if (workFilter === 'identity' && item.issuesToHandle.type !== 'identity') return false;
      }

      // 3. Domain Filter
      if (domainFilter !== 'ALL' && item.businessDomain !== domainFilter) {
        return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = item.name.toLowerCase().includes(q);
        const techMatch = item.technicalName.toLowerCase().includes(q);
        const qualMatch = item.qualifiedName.toLowerCase().includes(q);
        const issueMatch = item.issuesToHandle.title.toLowerCase().includes(q);
        const domainMatch = item.businessDomain.toLowerCase().includes(q);
        const termMatch = item.semanticAssociation.terms?.some((t) => t.toLowerCase().includes(q));

        if (!nameMatch && !techMatch && !qualMatch && !issueMatch && !domainMatch && !termMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'issues_first') {
        const hasIssueA = a.issuesToHandle.type && a.issuesToHandle.type !== 'none' ? 1 : 0;
        const hasIssueB = b.issuesToHandle.type && b.issuesToHandle.type !== 'none' ? 1 : 0;
        return hasIssueB - hasIssueA;
      }
      if (sortOrder === 'name') {
        return (a.name || a.technicalName).localeCompare(b.name || b.technicalName);
      }
      return 0;
    });
  }, [activeQueueTab, workFilter, domainFilter, searchQuery, sortOrder]);

  // Tab Counts
  const counts = useMemo(() => {
    const p = MOCK_DATA_SEMANTICS_QUEUE.filter((i) => i.queueCategory === 'pending_review').length;
    const ai = MOCK_DATA_SEMANTICS_QUEUE.filter((i) => i.queueCategory === 'ai_understanding').length;
    const dp = MOCK_DATA_SEMANTICS_QUEUE.filter((i) => i.queueCategory === 'draft_pending').length;
    const c = MOCK_DATA_SEMANTICS_QUEUE.filter((i) => i.queueCategory === 'confirmed').length;
    return {
      pending: p,
      ai: ai,
      draft: dp,
      confirmed: c,
      all: MOCK_DATA_SEMANTICS_QUEUE.length,
    };
  }, []);

  // Selection
  const isAllSelected = filteredList.length > 0 && selectedAssetIds.length === filteredList.length;
  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedAssetIds([]);
    else setSelectedAssetIds(filteredList.map((item) => item.id));
  };
  const toggleSelect = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Action Click Handler
  const handleItemAction = (item: DataSemanticsQueueItem) => {
    if (item.actionButton.label === '处理问题' || item.actionButton.label === '处理变更') {
      if (onNavigateToTableUnderstanding) {
        onNavigateToTableUnderstanding(item.technicalName);
      } else if (addToast) {
        addToast('info', '跳转至语义工作台', `正在处理 ${item.name || item.technicalName} 的语义问题`);
      }
    } else if (item.actionButton.label === '确认语义') {
      setConfirmItem(item);
    } else if (item.actionButton.label === '查看进度') {
      if (addToast) addToast('info', 'AI 理解进程', `${item.name || item.technicalName} 处于后台深度 LLM 推导中 (耗时约 45s)`);
    } else if (item.actionButton.label === '开始理解') {
      if (addToast) addToast('success', '启动 AI 语义理解', `已为此数据资产发起 AI 自动理解任务`);
    } else if (item.actionButton.label === '查看语义') {
      if (onNavigateToTableUnderstanding) {
        onNavigateToTableUnderstanding(item.technicalName);
      } else if (addToast) {
        addToast('info', '查看生效语义', `查阅 ${item.name || item.technicalName} 当前生效数据语义`);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* SECTION 1: Page Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-xs text-[#64748B]">
              <span>数据治理</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-semibold text-[#0F172A]">数据语义</span>
            </div>

            {/* Page Title + English label */}
            <div className="flex items-baseline space-x-3">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">数据语义</h1>
              <span className="text-xs font-mono text-[#94A3B8]">Data Semantics</span>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-[#64748B]">
              使用 AI 理解并确认数据资产的表与字段业务含义，处理关键语义问题。
            </p>
          </div>

          {/* Right Main Primary Action Button: 批量启动 AI 理解 */}
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>批量启动 AI 理解</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Segmented Queue Tabs (GovTech High-Trust Segmented Work View) */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 pt-3 pb-0 shrink-0">
        <div className="flex items-center space-x-2 border-b border-transparent text-xs font-semibold">
          {[
            { id: 'pending_review', label: '待处理', count: counts.pending, alert: true },
            { id: 'ai_understanding', label: 'AI理解中', count: counts.ai, running: true },
            { id: 'draft_pending', label: '待确认', count: counts.draft },
            { id: 'confirmed', label: '已确认', count: counts.confirmed },
            { id: 'all', label: '全部', count: counts.all },
          ].map((tab) => {
            const isActive = activeQueueTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveQueueTab(tab.id as any)}
                className={`relative pb-3 px-3.5 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#2563EB] text-[#2563EB] font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[11px] font-mono font-bold ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : tab.alert
                      ? 'bg-[#FEF2F2] text-[#DC2626]'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {tab.count}
                </span>

                {/* Running pulse dot for AI理解中 */}
                {tab.running && (
                  <span className="relative flex h-2 w-2 ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Search & Filter Bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-3 shrink-0 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-2xl w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索数据资产、业务名称、字段语义或待处理问题…"
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#0F172A] placeholder-[#94A3B8] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Filter & Sort controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
              workFilter !== 'ALL' || domainFilter !== 'ALL'
                ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>筛选</span>
            {(workFilter !== 'ALL' || domainFilter !== 'ALL') && (
              <span className="w-2 h-2 rounded-full bg-[#2563EB] ml-0.5" />
            )}
          </button>

          <div className="flex items-center space-x-1 bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#334155]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="issues_first">问题优先 ▼</option>
              <option value="updated">最近更新</option>
              <option value="name">资产名称</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 4: Semantic Work Queue Table (Exact 6 Core Columns) */}
      <div className="flex-1 bg-white overflow-auto relative">
        <table className="w-full text-left border-collapse select-text">
          {/* Table Header */}
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-20 text-[11px] font-bold text-[#475569]">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-4 min-w-[280px]">1. 数据资产</th>
              <th className="py-2.5 px-4 min-w-[240px]">2. 当前语义</th>
              <th className="py-2.5 px-4 min-w-[220px]">3. 需要处理</th>
              <th className="py-2.5 px-4 min-w-[220px]">4. 语义关联</th>
              <th className="py-2.5 px-4 w-36">5. 最近更新</th>
              <th className="py-2.5 px-4 w-32 text-right">6. 操作</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#1E293B]">
            {filteredList.length > 0 ? (
              filteredList.map((item) => {
                const isSelected = selectedAssetIds.includes(item.id);
                const primaryName = item.name || item.technicalName;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#F8FAFC] transition-colors ${
                      isSelected ? 'bg-[#F0F5FF]/60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-3 text-center align-top pt-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                      />
                    </td>

                    {/* COLUMN 1: 数据资产 */}
                    <td className="py-3.5 px-4 align-top space-y-1">
                      {/* Business or Display Title */}
                      <div className="flex items-center space-x-2">
                        <span
                          onClick={() => handleItemAction(item)}
                          className="font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer transition-colors text-sm"
                        >
                          {primaryName}
                        </span>
                      </div>

                      {/* Qualified Name in JetBrains Mono */}
                      <div className="font-mono text-[11px] text-[#64748B]">
                        {item.qualifiedName}
                      </div>

                      {/* Domain and Asset Type Badge */}
                      <div className="flex items-center space-x-2 pt-0.5">
                        <span className="text-[11px] font-medium text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {item.businessDomain} · {item.assetType}
                        </span>
                        {searchQuery && (
                          <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                            匹配字段语义：办结时间 · close_time
                          </span>
                        )}
                      </div>
                    </td>

                    {/* COLUMN 2: 当前语义 */}
                    <td className="py-3.5 px-4 align-top space-y-1">
                      {/* Table Semantics Status */}
                      <div className="font-semibold text-[#0F172A] flex items-center space-x-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.currentSemantics.tableStatus.includes('已确认')
                              ? 'bg-[#059669]'
                              : item.currentSemantics.tableStatus.includes('草稿')
                              ? 'bg-[#D97706]'
                              : item.currentSemantics.tableStatus.includes('理解中')
                              ? 'bg-[#2563EB] animate-pulse'
                              : 'bg-[#94A3B8]'
                          }`}
                        />
                        <span>{item.currentSemantics.tableStatus}</span>
                      </div>

                      {/* Field Semantics Status */}
                      <div className="text-[11px] text-[#475569]">
                        {item.currentSemantics.fieldStatus}
                      </div>

                      {/* Detail note / Draft status */}
                      {item.currentSemantics.detailNote && (
                        <div className="text-[10px] text-[#94A3B8]">
                          {item.currentSemantics.detailNote}
                        </div>
                      )}
                    </td>

                    {/* COLUMN 3: 需要处理 */}
                    <td className="py-3.5 px-4 align-top pt-3.5">
                      {item.issuesToHandle.type === 'conflict' ? (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#BE123C] font-semibold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.issuesToHandle.title}</span>
                        </div>
                      ) : item.issuesToHandle.type === 'identity' ||
                        item.issuesToHandle.type === 'grain' ||
                        item.issuesToHandle.type === 'field_pending' ? (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] font-semibold text-xs">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.issuesToHandle.title}</span>
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* COLUMN 4: 语义关联 */}
                    <td className="py-3.5 px-4 align-top space-y-1.5 pt-3">
                      {/* Terms chips */}
                      {item.semanticAssociation.terms && item.semanticAssociation.terms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.semanticAssociation.terms.map((term, tidx) => (
                            <span
                              key={tidx}
                              className="px-1.5 py-0.2 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#334155] text-[10px] font-medium"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bound Business Object (Solid) */}
                      {item.semanticAssociation.boundObject && (
                        <div className="flex items-center space-x-1 text-[11px]">
                          <span className="text-[#94A3B8]">关联对象:</span>
                          <span className="px-2 py-0.5 rounded bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] font-bold inline-flex items-center space-x-1">
                            <Box className="w-3 h-3 text-[#4338CA]" />
                            <span>{item.semanticAssociation.boundObject}</span>
                          </span>
                        </div>
                      )}

                      {/* AI Business Object Suggestions (Dashed) */}
                      {item.semanticAssociation.objectSuggestions &&
                        item.semanticAssociation.objectSuggestions.length > 0 && (
                          <div className="flex items-center space-x-1 text-[10px]">
                            <span className="text-[#94A3B8]">AI建议:</span>
                            {item.semanticAssociation.objectSuggestions.map((sug, sidx) => (
                              <span
                                key={sidx}
                                className="px-1.5 py-0.2 rounded bg-white border border-dashed border-[#93C5FD] text-[#2563EB] font-medium"
                              >
                                {sug}
                              </span>
                            ))}
                          </div>
                        )}

                      {!item.semanticAssociation.boundObject &&
                        (!item.semanticAssociation.terms || item.semanticAssociation.terms.length === 0) &&
                        (!item.semanticAssociation.objectSuggestions || item.semanticAssociation.objectSuggestions.length === 0) && (
                          <span className="text-[#94A3B8] font-mono text-xs">—</span>
                        )}
                    </td>

                    {/* COLUMN 5: 最近更新 */}
                    <td className="py-3.5 px-4 align-top space-y-0.5 pt-3.5">
                      <div className="font-mono text-xs text-[#0F172A] font-medium">
                        {item.lastUpdate.time}
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        {item.lastUpdate.action}
                      </div>
                    </td>

                    {/* COLUMN 6: 操作 (Dynamic Action Buttons based on Work State) */}
                    <td className="py-3.5 px-4 align-top text-right pt-3">
                      <button
                        onClick={() => handleItemAction(item)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors inline-flex items-center space-x-1 shadow-2xs ${
                          item.actionButton.variant === 'danger'
                            ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                            : item.actionButton.variant === 'warning'
                            ? 'bg-[#D97706] hover:bg-[#B45309] text-white'
                            : item.actionButton.variant === 'primary'
                            ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                            : item.actionButton.variant === 'indigo'
                            ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'
                            : 'bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1]'
                        }`}
                      >
                        {item.actionButton.label === '处理问题' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {item.actionButton.label === '确认语义' && <Check className="w-3.5 h-3.5" />}
                        {item.actionButton.label === '查看进度' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        {item.actionButton.label === '开始理解' && <Sparkles className="w-3.5 h-3.5" />}
                        <span>{item.actionButton.label}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-[#0F172A] text-sm">当前队列暂无待处理项</h3>
                    <p className="text-xs text-[#64748B]">
                      所选 Queue 视图下暂无匹配的数据语义治理任务。
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: 批量启动 AI 理解 (Batch Start Modal) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#E2E8F0] overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-bold text-base text-[#0F172A]">批量启动 AI 理解</h2>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#334155]">
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-3 rounded-lg text-[#1E40AF]">
                已选择资产：<span className="font-bold font-mono text-sm">{selectedAssetIds.length > 0 ? selectedAssetIds.length : 18}</span> 个数据资产
              </div>

              <div className="space-y-2">
                <label className="font-bold text-[#0F172A]">理解范围</label>
                <div className="space-y-2 pl-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchScopeTable}
                      onChange={(e) => setBatchScopeTable(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="font-semibold text-[#0F172A]">表语义</span>
                    <span className="text-[#64748B] text-[11px]">（包括业务名称、数据粒度与核心标识）</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchScopeField}
                      onChange={(e) => setBatchScopeField(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="font-semibold text-[#0F172A]">字段语义</span>
                    <span className="text-[#64748B] text-[11px]">（包括字段分类、业务含义与逻辑冲突推论）</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-[#F1F5F9]">
                <label className="font-bold text-[#0F172A]">结果形式</label>
                <p className="text-[#64748B] bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                  生成 <span className="font-bold text-[#0F172A]">Working Draft</span>，需要人工确认后方可正式生效为 Effective Data Semantics。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setIsBatchModalOpen(false);
                  if (addToast) addToast('success', '批量任务已提交', '已启动 18 个数据资产的 AI 语义理解任务');
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
              >
                开始理解
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER 2: 确认数据语义 (Confirm Semantics Drawer) */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                <div>
                  <h2 className="font-bold text-sm text-[#0F172A]">确认数据语义</h2>
                  <p className="text-[11px] text-[#64748B] font-mono">{confirmItem.qualifiedName}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmItem(null)}
                className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[#0F172A]">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg space-y-1">
                <div className="text-[11px] font-bold text-[#64748B]">目标数据资产</div>
                <div className="font-bold text-sm text-[#0F172A]">
                  {confirmItem.name || confirmItem.technicalName}
                </div>
              </div>

              {/* Table Semantics Checklist */}
              <div className="space-y-2">
                <div className="font-bold text-[#334155] text-xs">表语义校验</div>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center space-x-2 text-[#059669] font-medium">
                    <Check className="w-4 h-4" />
                    <span>业务名称已明确：{confirmItem.name || confirmItem.technicalName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#059669] font-medium">
                    <Check className="w-4 h-4" />
                    <span>数据粒度已明确：每一行为一条全生命周期记录</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#059669] font-medium">
                    <Check className="w-4 h-4" />
                    <span>业务标识已明确：以主键与工单号双向锚定</span>
                  </div>
                </div>
              </div>

              {/* Field Semantics Checklist */}
              <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
                <div className="font-bold text-[#334155] text-xs">核心字段校验</div>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center space-x-2 text-[#059669] font-medium">
                    <Check className="w-4 h-4" />
                    <span>12 个核心字段语义明确</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#B45309] font-medium">
                    <AlertCircle className="w-4 h-4 text-[#D97706]" />
                    <span>4 个非核心字段仍未知（非阻塞）</span>
                  </div>
                </div>
              </div>

              {/* Blocking issues status */}
              <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
                <div className="font-bold text-[#334155] text-xs">阻塞问题检查</div>
                <div className="p-2.5 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>0 个阻塞问题，符合语义正式发布标准</span>
                </div>
              </div>

              {/* Impact Notice */}
              <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg text-[#3730A3] text-[11px] space-y-1">
                <div className="font-bold">确认后生效范围：</div>
                <p>
                  当前语义将作为该 Data Asset 的有效语义，用于 Search、数据发现、问数（NL2SQL）与 AI Agent 上下文。
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-end space-x-2 bg-[#F8FAFC]">
              <button
                onClick={() => setConfirmItem(null)}
                className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#475569] hover:bg-white cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setConfirmItem(null);
                  if (addToast) addToast('success', '语义已正式确认', `${confirmItem.name || confirmItem.technicalName} 已生效为 Current Effective Data Semantics`);
                }}
                className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
              >
                确认语义
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER 3: Advanced Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-[#2563EB]" />
                <h2 className="font-bold text-sm text-[#0F172A]">数据语义队列筛选</h2>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-[#0F172A]">
              {/* Work Filter */}
              <div className="space-y-2">
                <label className="font-bold text-[#334155]">1. Work Filter (问题类型)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '全部问题', val: 'ALL' },
                    { label: '有语义冲突', val: 'conflict' },
                    { label: '有粒度问题', val: 'grain' },
                    { label: '有身份问题', val: 'identity' },
                  ].map((wf) => (
                    <button
                      key={wf.val}
                      onClick={() => setWorkFilter(wf.val as any)}
                      className={`py-1.5 px-2 rounded border text-center font-medium cursor-pointer ${
                        workFilter === wf.val
                          ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold'
                          : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]'
                      }`}
                    >
                      {wf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope Filter */}
              <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
                <label className="font-bold text-[#334155]">2. Scope Filter (归属业务域)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ALL', '公共服务', '人口服务', '企业服务', '城市治理'].map((dom) => (
                    <button
                      key={dom}
                      onClick={() => setDomainFilter(dom as any)}
                      className={`py-1.5 px-2 rounded border text-center font-medium cursor-pointer ${
                        domainFilter === dom
                          ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold'
                          : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]'
                      }`}
                    >
                      {dom === 'ALL' ? '全部业务域' : dom}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <button
                onClick={() => {
                  setWorkFilter('ALL');
                  setDomainFilter('ALL');
                }}
                className="text-xs text-[#64748B] hover:text-[#0F172A] underline cursor-pointer"
              >
                重置筛选
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
