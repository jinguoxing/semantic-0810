import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Check,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { DataSemanticsQueueItem } from '../types';
import { MOCK_DATA_SEMANTICS_QUEUE } from '../data/dataSemanticsData';

interface DataSemanticsQueueWorkspaceProps {
  onNavigateToTableUnderstanding?: (tableName: string) => void;
  onNavigateToCatalog?: () => void;
  onNavigateToAssetDetail?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const DataSemanticsQueueWorkspace: React.FC<DataSemanticsQueueWorkspaceProps> = ({
  onNavigateToTableUnderstanding,
  onNavigateToAssetDetail,
  addToast,
}) => {
  // Queue Work View Tabs (Default: 'pending_review' 需处理 24)
  const [activeQueueTab, setActiveQueueTab] = useState<'pending_review' | 'ai_understanding' | 'draft_pending' | 'confirmed' | 'all'>('pending_review');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'issues_first' | 'updated' | 'name'>('issues_first');

  // Dropdown filter selections
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('ALL');

  // Drawer / Modal States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [confirmModalItem, setConfirmModalItem] = useState<DataSemanticsQueueItem | null>(null);

  // Filtered Queue Calculation
  const filteredList = useMemo(() => {
    return MOCK_DATA_SEMANTICS_QUEUE.filter((item) => {
      // 1. Work Queue View Tab Filter
      if (activeQueueTab !== 'all' && item.queueCategory !== activeQueueTab) {
        return false;
      }

      // 2. Domain Filter
      if (domainFilter !== 'ALL' && item.businessDomain !== domainFilter) {
        return false;
      }

      // 3. Issue Type Filter
      if (issueTypeFilter !== 'ALL') {
        if (issueTypeFilter === 'grain' && !item.issuesToHandle.title.includes('粒度') && item.issuesToHandle.type !== 'grain') return false;
        if (issueTypeFilter === 'identity' && !item.issuesToHandle.title.includes('主体') && item.issuesToHandle.type !== 'identity') return false;
        if (issueTypeFilter === 'conflict' && item.issuesToHandle.type !== 'conflict') return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = item.name.toLowerCase().includes(q);
        const techMatch = item.technicalName.toLowerCase().includes(q);
        const qualMatch = item.qualifiedName.toLowerCase().includes(q);
        const issueMatch = item.issuesToHandle.title.toLowerCase().includes(q);
        const domainMatch = item.businessDomain.toLowerCase().includes(q);

        if (!nameMatch && !techMatch && !qualMatch && !issueMatch && !domainMatch) {
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
  }, [activeQueueTab, domainFilter, issueTypeFilter, searchQuery, sortOrder]);

  // Tab Counts
  const counts = useMemo(() => {
    return {
      pending: 24, // As explicitly specified in prompt header tab: "需要处理 24"
      ai: 3,       // "AI理解中 3"
      draft: 18,   // "待确认 18"
      confirmed: 426, // "已确认 426"
      all: 471,
    };
  }, []);

  // Selection Logic
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
    const label = item.actionButton.label;
    if (label.includes('处理') || label === '处理 4 项' || label === '处理 1 项' || label === '处理变更') {
      if (onNavigateToTableUnderstanding) {
        onNavigateToTableUnderstanding(item.technicalName);
      } else if (addToast) {
        addToast('info', '切换工作台', `已跳转至 ${item.name || item.technicalName} 表语义理解与治理`);
      }
    } else if (label === '确认语义') {
      setConfirmModalItem(item);
    } else if (label === '查看语义') {
      if (onNavigateToAssetDetail) {
        onNavigateToAssetDetail();
      } else if (addToast) {
        addToast('info', '查看生效语义', `载入 ${item.name || item.technicalName} 当前生效数据语义`);
      }
    } else if (label === '查看进度') {
      if (addToast) addToast('info', 'AI 理解进程', `${item.name || item.technicalName} 正在后台深度元数据推理中`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* HEADER AREA */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-xs text-[#64748B]">
              <span>数据治理</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-semibold text-[#0F172A]">数据语义</span>
            </div>

            {/* Page Title & Subtitle */}
            <div className="flex items-baseline space-x-3">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">数据语义</h1>
              <span className="text-xs font-mono text-[#94A3B8]">Data Semantics</span>
            </div>

            <p className="text-xs text-[#64748B]">
              AI 自动理解数据资产的业务含义，只将关键歧义和高影响语义交给你确认。
            </p>
          </div>

          {/* Primary Action Button: 批量启动 AI 理解 */}
          <button
            onClick={() => setIsBatchDrawerOpen(true)}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>批量启动 AI 理解</span>
          </button>
        </div>
      </div>

      {/* TOP WORK QUEUE VIEWS (Lightweight text tabs) */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 pt-3 pb-0 shrink-0">
        <div className="flex items-center space-x-2 text-xs font-semibold">
          {[
            { id: 'pending_review', label: '需要处理', count: counts.pending, alert: true },
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

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-2.5 shrink-0 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xl w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索数据资产、字段语义或待处理问题…"
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#0F172A] placeholder-[#94A3B8] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Triggers */}
        <div className="flex items-center space-x-2 shrink-0 text-xs">
          {/* 业务域 Filter */}
          <div className="relative">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="appearance-none bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-lg pl-3 pr-7 py-1.5 font-medium text-[#334155] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="ALL">业务域▼</option>
              <option value="公共服务">公共服务</option>
              <option value="人口服务">人口服务</option>
              <option value="企业服务">企业服务</option>
              <option value="城市治理">城市治理</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* 问题类型 Filter */}
          <div className="relative">
            <select
              value={issueTypeFilter}
              onChange={(e) => setIssueTypeFilter(e.target.value)}
              className="appearance-none bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-lg pl-3 pr-7 py-1.5 font-medium text-[#334155] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="ALL">问题类型▼</option>
              <option value="grain">记录粒度</option>
              <option value="identity">主体标识</option>
              <option value="conflict">语义冲突</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* 更多筛选 Button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-[#334155] font-medium transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span>更多筛选</span>
          </button>

          {/* Sort order */}
          <div className="flex items-center space-x-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#334155]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="issues_first">问题优先▼</option>
              <option value="updated">最近更新</option>
              <option value="name">资产名称</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN WORK LIST TABLE (6 CORE COLUMNS) */}
      <div className="flex-1 bg-white overflow-auto relative">
        <table className="w-full text-left border-collapse select-text">
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
              <th className="py-2.5 px-4 min-w-[200px]">2. 当前有效语义</th>
              <th className="py-2.5 px-4 min-w-[220px]">3. 本轮 AI 理解</th>
              <th className="py-2.5 px-4 min-w-[240px]">4. 需要你处理</th>
              <th className="py-2.5 px-4 w-36">5. 最近更新</th>
              <th className="py-2.5 px-4 w-32 text-right">6. 操作</th>
            </tr>
          </thead>

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
                    {/* Select Checkbox */}
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
                      <div className="flex items-center space-x-2">
                        <span
                          onClick={() => {
                            if (item.actionButton.label === '查看语义') {
                              if (onNavigateToAssetDetail) onNavigateToAssetDetail();
                            } else {
                              if (onNavigateToTableUnderstanding) onNavigateToTableUnderstanding(item.technicalName);
                            }
                          }}
                          className="font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer transition-colors text-sm"
                        >
                          {primaryName}
                        </span>
                      </div>

                      {/* Technical Qualified Name in Monospace */}
                      <div className="font-mono text-[11px] text-[#64748B]">
                        {item.qualifiedName}
                      </div>

                      {/* Domain and Asset Type Badge */}
                      <div className="flex items-center space-x-2 pt-0.5">
                        <span className="text-[11px] font-medium text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {item.businessDomain} · {item.assetType}
                        </span>
                      </div>
                    </td>

                    {/* COLUMN 2: 当前有效语义 */}
                    <td className="py-3.5 px-4 align-top space-y-1">
                      <div className="font-semibold text-[#0F172A]">
                        {item.currentSemantics.tableStatus}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {item.currentSemantics.fieldStatus}
                      </div>
                    </td>

                    {/* COLUMN 3: 本轮 AI 理解 */}
                    <td className="py-3.5 px-4 align-top space-y-1">
                      {item.id === 'sem-1' ? (
                        <div>
                          <div className="font-bold text-[#0F172A]">32 项无需处理</div>
                          <div className="text-[11px] text-[#64748B]">18 项标准继承 · 1 项技术字段</div>
                        </div>
                      ) : item.id === 'sem-2' ? (
                        <div>
                          <div className="font-bold text-[#0F172A]">新增字段 2</div>
                          <div className="text-[11px] text-[#64748B]">1 项已自动明确</div>
                        </div>
                      ) : item.id === 'sem-3' ? (
                        <div>
                          <div className="font-bold text-[#2563EB] flex items-center space-x-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>AI 正在分析表与字段语义</span>
                          </div>
                          <div className="text-[11px] text-[#64748B]">正在多维自动发现元数据与契约</div>
                        </div>
                      ) : item.id === 'sem-4' ? (
                        <div>
                          <div className="font-bold text-[#0F172A]">16 项标准直接继承</div>
                          <div className="text-[11px] text-[#64748B]">3 项多证据一致</div>
                        </div>
                      ) : item.id === 'sem-5' ? (
                        <div>
                          <div className="font-bold text-[#0F172A]">无新的语义变化</div>
                          <div className="text-[11px] text-[#64748B]">维持已确认 Effective 语义</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-[#0F172A]">检测到标准变更</div>
                          <div className="text-[11px] text-[#64748B]">1 项规则匹配触发重算</div>
                        </div>
                      )}
                    </td>

                    {/* COLUMN 4: 需要你处理 (Visual Focus Column) */}
                    <td className="py-3.5 px-4 align-top">
                      {item.id === 'sem-1' ? (
                        <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] space-y-1 text-xs">
                          <div className="font-bold text-[#BE123C] flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>4 个关键决策</span>
                          </div>
                          <ul className="text-[11px] text-[#991B1B] pl-5 list-disc space-y-0.5 font-medium">
                            <li>记录粒度</li>
                            <li>主体标识</li>
                          </ul>
                          <div className="text-[10px] text-[#7F1D1D] pt-0.5 font-sans">
                            另有 2 个字段语义问题
                          </div>
                        </div>
                      ) : item.id === 'sem-2' ? (
                        <div className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] space-y-1 text-xs">
                          <div className="font-bold text-[#B45309] flex items-center space-x-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>1 个关键决策</span>
                          </div>
                          <div className="text-[11px] font-mono text-[#92400E] font-medium">
                            <span className="font-semibold underline">death_flag</span> 值语义需要确认
                          </div>
                        </div>
                      ) : item.id === 'sem-6' ? (
                        <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] space-y-1 text-xs">
                          <div className="font-bold text-[#BE123C] flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>1 个字段语义冲突</span>
                          </div>
                          <div className="text-[11px] text-[#991B1B] font-medium">
                            <span className="font-mono">close_time</span> · 办结时间 vs 关闭时间
                          </div>
                        </div>
                      ) : item.id === 'sem-4' ? (
                        <div className="text-xs text-[#059669] font-medium flex items-center space-x-1 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>无关键问题</span>
                        </div>
                      ) : (
                        <div className="text-xs text-[#94A3B8] font-mono pt-1">—</div>
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

                    {/* COLUMN 6: 操作 */}
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
                        {item.actionButton.label.includes('处理') && <AlertTriangle className="w-3.5 h-3.5" />}
                        {item.actionButton.label === '确认语义' && <Check className="w-3.5 h-3.5" />}
                        {item.actionButton.label === '查看进度' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
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
                      当前 Work Queue 视角下无阻碍性 Data Semantic Decision。
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DRAWER: 批量启动 AI 理解 */}
      {isBatchDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-bold text-base text-[#0F172A]">批量启动 AI 理解</h2>
              </div>
              <button
                onClick={() => setIsBatchDrawerOpen(false)}
                className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#334155]">
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-3.5 rounded-lg text-[#1E40AF] font-medium">
                已选择数据资产：<span className="font-bold font-mono text-base">{selectedAssetIds.length > 0 ? selectedAssetIds.length : 18}</span>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-[#0F172A] text-sm">理解内容：</label>
                <div className="space-y-1.5 pl-1 font-semibold text-[#0F172A]">
                  <div className="flex items-center space-x-2 text-[#059669]">
                    <Check className="w-4 h-4" />
                    <span>表语义</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#059669]">
                    <Check className="w-4 h-4" />
                    <span>字段语义</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                <label className="font-bold text-[#0F172A] text-sm">AI 将自动：</label>
                <ul className="space-y-2 text-[#475569] pl-2 list-disc font-medium">
                  <li>读取 Metadata 与 Data Profile</li>
                  <li>匹配企业数据标准</li>
                  <li>匹配业务术语</li>
                  <li>分析字段关系</li>
                  <li>复用已确认语义</li>
                  <li>识别技术字段</li>
                  <li>生成 Semantic Draft</li>
                  <li>发现冲突与关键 Decision</li>
                </ul>
              </div>
            </div>

            <div className="p-5 border-t border-[#E2E8F0] flex items-center justify-end space-x-3 bg-[#F8FAFC]">
              <button
                onClick={() => setIsBatchDrawerOpen(false)}
                className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#475569] hover:bg-white cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setIsBatchDrawerOpen(false);
                  if (addToast) addToast('success', '启动 AI 理解', '已成功为所选 18 个数据资产启动 AI 语义分析引擎');
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
              >
                开始理解
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 确认当前数据语义 (Light Review Summary) */}
      {confirmModalItem && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#E2E8F0] overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="font-bold text-base text-[#0F172A]">确认当前数据语义</h2>
              <button
                onClick={() => setConfirmModalItem(null)}
                className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#0F172A]">
              <div className="font-bold text-sm text-[#2563EB]">
                {confirmModalItem.name || confirmModalItem.technicalName}
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">本轮生成</span>
                  <span className="font-mono font-bold text-sm">19 项</span>
                </div>
                <div className="flex justify-between items-center text-[#475569]">
                  <span>企业标准直接继承</span>
                  <span className="font-mono font-semibold">16 项</span>
                </div>
                <div className="flex justify-between items-center text-[#475569]">
                  <span>多证据一致</span>
                  <span className="font-mono font-semibold">3 项</span>
                </div>
                <div className="flex justify-between items-center text-[#475569]">
                  <span>关键冲突</span>
                  <span className="font-mono font-semibold text-[#059669]">0 项</span>
                </div>
              </div>

              <p className="text-[#64748B] text-[11px] leading-relaxed">
                确认后，本次语义将成为该 Data Asset 当前有效语义。
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setConfirmModalItem(null)}
                className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setConfirmModalItem(null);
                  if (addToast) addToast('success', '语义已确认', `${confirmModalItem.name || confirmModalItem.technicalName} 已正式生效为 Effective Data Semantics`);
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
              >
                确认语义
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER DRAWER */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-[#2563EB]" />
                <h2 className="font-bold text-sm text-[#0F172A]">高级语义筛选</h2>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[#0F172A]">
              <div className="space-y-2">
                <label className="font-bold text-[#334155]">1. 问题类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '全部类型', val: 'ALL' },
                    { label: '记录粒度', val: 'grain' },
                    { label: '主体标识', val: 'identity' },
                    { label: '语义冲突', val: 'conflict' },
                  ].map((it) => (
                    <button
                      key={it.val}
                      onClick={() => setIssueTypeFilter(it.val)}
                      className={`py-1.5 px-2.5 rounded border text-center font-medium cursor-pointer ${
                        issueTypeFilter === it.val
                          ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold'
                          : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]'
                      }`}
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
                <label className="font-bold text-[#334155]">2. 归属业务域</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ALL', '公共服务', '人口服务', '企业服务', '城市治理'].map((dom) => (
                    <button
                      key={dom}
                      onClick={() => setDomainFilter(dom)}
                      className={`py-1.5 px-2.5 rounded border text-center font-medium cursor-pointer ${
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
                  setIssueTypeFilter('ALL');
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
