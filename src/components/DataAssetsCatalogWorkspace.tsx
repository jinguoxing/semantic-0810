import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Database,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Clock,
  Sparkles,
  Download,
  Bookmark,
  Activity,
  GitCommit,
  ShieldCheck,
  FolderTree,
  Server,
  X,
  FileSpreadsheet,
  Table as TableIcon,
  Eye,
  Box,
  User,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { DataAssetItem, AssetType } from '../types';
import { MOCK_DATA_ASSETS, DOMAIN_TREE, DATA_SOURCE_TREE, DomainTreeNode } from '../data/dataAssetsData';

interface DataAssetsCatalogWorkspaceProps {
  onOpenAssetDetail?: (asset: DataAssetItem) => void;
  onNavigateToTableUnderstanding?: (tableName: string) => void;
  onNavigateToDiscovery?: () => void;
  onViewLineage?: (tableName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const DataAssetsCatalogWorkspace: React.FC<DataAssetsCatalogWorkspaceProps> = ({
  onOpenAssetDetail,
  onNavigateToTableUnderstanding,
  onNavigateToDiscovery,
  onViewLineage,
  addToast,
}) => {
  // Search & Type Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | 'ALL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'scanned' | 'relevance' | 'name' | 'updated'>('scanned');

  // Scope Navigation state (Left sidebar)
  const [scopeMode, setScopeMode] = useState<'domain' | 'datasource'>('domain');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>('ds-all');
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    'dom-population': true,
    'dom-public': true,
  });

  // Filter Drawer State
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterProfileStatus, setFilterProfileStatus] = useState<'ALL' | 'profiled' | 'unprofiled'>('ALL');
  const [filterQualityStatus, setFilterQualityStatus] = useState<'ALL' | 'normal' | 'attention' | 'untested'>('ALL');
  const [filterSemanticStatus, setFilterSemanticStatus] = useState<'ALL' | 'confirmed' | 'pending' | 'ununderstood'>('ALL');

  // Multi-selection state
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Asset Detail Drawer State
  const [activeDetailAsset, setActiveDetailAsset] = useState<DataAssetItem | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'fields' | 'quality' | 'semantics' | 'lineage'>('overview');

  // Context Menu state
  const [openMenuAssetId, setOpenMenuAssetId] = useState<string | null>(null);

  // Toggle domain expansion
  const toggleDomainExpand = (id: string) => {
    setExpandedDomains((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterProfileStatus !== 'ALL') count++;
    if (filterQualityStatus !== 'ALL') count++;
    if (filterSemanticStatus !== 'ALL') count++;
    return count;
  }, [filterProfileStatus, filterQualityStatus, filterSemanticStatus]);

  // Filtered Assets list calculation
  const filteredAssets = useMemo(() => {
    return MOCK_DATA_ASSETS.filter((asset) => {
      // 1. Quick Asset Type Filter
      if (selectedAssetType !== 'ALL' && asset.assetType !== selectedAssetType) {
        return false;
      }

      // 2. Left Scope Filter (Domain or Datasource)
      if (scopeMode === 'domain' && selectedDomainId !== 'all') {
        if (selectedDomainId === 'dom-population' && asset.businessDomain !== '人口服务') return false;
        if (selectedDomainId === 'dom-pop-basic' && (asset.businessDomain !== '人口服务' || asset.subDomain !== '人口基础')) return false;
        if (selectedDomainId === 'dom-pop-service' && (asset.businessDomain !== '人口服务' || asset.subDomain !== '人口服务')) return false;
        if (selectedDomainId === 'dom-pub-hotline' && (asset.businessDomain !== '公共服务' || asset.subDomain !== '热线服务')) return false;
        if (selectedDomainId === 'dom-public' && asset.businessDomain !== '公共服务') return false;
        if (selectedDomainId === 'dom-enterprise' && asset.businessDomain !== '企业服务') return false;
        if (selectedDomainId === 'dom-city' && asset.businessDomain !== '城市治理') return false;
        if (selectedDomainId === 'dom-unassigned' && asset.businessDomain !== '未归属') return false;
      }

      if (scopeMode === 'datasource' && selectedDataSourceId !== 'ds-all') {
        if (selectedDataSourceId === 'ds-hotline' && asset.dataSourceName !== '公共服务热线库') return false;
        if (selectedDataSourceId === 'ds-population' && asset.dataSourceName !== '人口库') return false;
        if (selectedDataSourceId === 'ds-customer' && asset.dataSourceName !== '客户服务库') return false;
        if (selectedDataSourceId === 'ds-analytics' && asset.dataSourceName !== '分析与报表库') return false;
        if (selectedDataSourceId === 'ds-enterprise' && asset.dataSourceName !== '企业基础数据库') return false;
        if (selectedDataSourceId === 'ds-city' && asset.dataSourceName !== '城市运行数据湖') return false;
        if (selectedDataSourceId === 'ds-utility' && asset.dataSourceName !== '城市公共事业库') return false;
        if (selectedDataSourceId === 'ds-staging' && asset.dataSourceName !== '暂存清洗库') return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = asset.name.toLowerCase().includes(q);
        const techMatch = asset.technicalName.toLowerCase().includes(q);
        const qualMatch = asset.qualifiedName.toLowerCase().includes(q);
        const descMatch = asset.description.toLowerCase().includes(q);
        const domainMatch = asset.businessDomain.toLowerCase().includes(q);
        const matchContextMatch = asset.matchContext?.toLowerCase().includes(q);

        if (!nameMatch && !techMatch && !qualMatch && !descMatch && !domainMatch && !matchContextMatch) {
          return false;
        }
      }

      // 4. Drawer Context Filters
      if (filterProfileStatus !== 'ALL' && asset.governanceContext.profileStatus !== filterProfileStatus) {
        return false;
      }
      if (filterQualityStatus !== 'ALL' && asset.governanceContext.qualityStatus !== filterQualityStatus) {
        return false;
      }
      if (filterSemanticStatus !== 'ALL' && asset.governanceContext.semanticStatus !== filterSemanticStatus) {
        return false;
      }

      return true;
    });
  }, [
    selectedAssetType,
    scopeMode,
    selectedDomainId,
    selectedDataSourceId,
    searchQuery,
    filterProfileStatus,
    filterQualityStatus,
    filterSemanticStatus,
  ]);

  // Selection helpers
  const isAllSelected = filteredAssets.length > 0 && selectedAssetIds.length === filteredAssets.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map((a) => a.id));
    }
  };

  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedAssetType('ALL');
    setSelectedDomainId('all');
    setSelectedDataSourceId('ds-all');
    setFilterProfileStatus('ALL');
    setFilterQualityStatus('ALL');
    setFilterSemanticStatus('ALL');
    if (addToast) addToast('info', '筛选已重置', '已恢复至默认资产目录视角');
  };

  // Context render helper for Governance Summary
  const renderGovernanceContextSummary = (asset: DataAssetItem) => {
    const ctx = asset.governanceContext;

    return (
      <div className="group relative inline-flex items-center space-x-1.5 text-[11px] leading-tight">
        {/* Profile Status */}
        <span
          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded ${
            ctx.profileStatus === 'profiled'
              ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              ctx.profileStatus === 'profiled' ? 'bg-[#16A34A]' : 'bg-[#94A3B8]'
            }`}
          />
          <span>{ctx.profileStatus === 'profiled' ? '已探查' : '未探查'}</span>
        </span>

        <span className="text-[#CBD5E1]">·</span>

        {/* Quality Status */}
        <span
          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded ${
            ctx.qualityStatus === 'normal'
              ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
              : ctx.qualityStatus === 'attention'
              ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
          }`}
        >
          <span>
            {ctx.qualityStatus === 'normal'
              ? '质量正常'
              : ctx.qualityStatus === 'attention'
              ? '质量关注'
              : '未检测'}
          </span>
        </span>

        <span className="text-[#CBD5E1]">·</span>

        {/* Semantic Status */}
        <span
          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded ${
            ctx.semanticStatus === 'confirmed'
              ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
              : ctx.semanticStatus === 'pending'
              ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
          }`}
        >
          <span>
            {ctx.semanticStatus === 'confirmed'
              ? '语义已确认'
              : ctx.semanticStatus === 'pending'
              ? '语义待确认'
              : '未理解'}
          </span>
        </span>

        <span className="text-[#CBD5E1]">·</span>

        {/* Lineage Status */}
        <span
          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded ${
            ctx.lineageStatus === 'available'
              ? 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]'
              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
          }`}
        >
          <span>{ctx.lineageStatus === 'available' ? '血缘可用' : '血缘未采集'}</span>
        </span>

        {/* Hover Detailed Tooltip */}
        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block z-30 w-64 bg-[#0F172A] text-white p-3 rounded-lg shadow-xl text-xs space-y-2 pointer-events-none transition-all">
          <div className="font-bold text-white border-b border-[#334155] pb-1 flex items-center justify-between">
            <span>治理 Context 详情</span>
            <span className="text-[10px] text-[#94A3B8] font-mono">{asset.qualifiedName}</span>
          </div>
          <div className="space-y-1 text-[11px] text-[#94A3B8]">
            <div className="flex justify-between">
              <span>数据画像:</span>
              <span className="text-white font-medium">
                {ctx.profileStatus === 'profiled' ? `已探查 (${ctx.lastProfiledTime || '今天'})` : '未探查'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>数据质量:</span>
              <span
                className={
                  ctx.qualityStatus === 'normal'
                    ? 'text-[#4ADE80]'
                    : ctx.qualityStatus === 'attention'
                    ? 'text-[#FBBF24]'
                    : 'text-[#CBD5E1]'
                }
              >
                {ctx.qualityStatus === 'normal'
                  ? '质量正常'
                  : ctx.qualityStatus === 'attention'
                  ? `存在 ${ctx.qualityIssueCount || 3} 项问题`
                  : '未检测'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>数据语义:</span>
              <span className="text-white font-medium">
                {ctx.semanticStatus === 'confirmed'
                  ? `核心语义已确认 (${ctx.semanticConfirmedTime || '近半月'})`
                  : ctx.semanticStatus === 'pending'
                  ? '语义待确认'
                  : '未理解'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>血缘状态:</span>
              <span className="text-white font-medium">
                {ctx.lineageStatus === 'available' ? '上下游血缘路径已接入' : '未采集'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
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
              <span className="font-semibold text-[#0F172A]">数据资产</span>
            </div>

            {/* Title + Inline Natural Count (NO separate KPI card) */}
            <div className="flex items-baseline space-x-3">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">数据资产</h1>
              <span className="text-xs font-mono text-[#94A3B8]">Data Assets</span>
              <span className="text-xs text-[#64748B] font-medium bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#E2E8F0]">
                12,832 个资产
              </span>
            </div>

            {/* Subtitle description */}
            <p className="text-xs text-[#64748B]">
              浏览进入 Semovix 的数据资源，查看数据位置及当前治理上下文。
            </p>
          </div>

          {/* Right Action: View Data Connections */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (addToast) addToast('info', '数据连接', '已链接至数据源控制面板，共接入 18 个数据源');
              }}
              className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>查看数据连接</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Search & Filter Toolbar */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-3 shrink-0 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Wide Search Box + Quick Type Tabs */}
        <div className="flex-1 flex items-center space-x-4 w-full">
          {/* Wide Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索业务名称、技术名称、字段或描述…"
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

          {/* Quick Asset Type Filter Pills */}
          <div className="flex items-center space-x-1 bg-[#F1F5F9] p-1 rounded-lg text-xs font-medium shrink-0">
            {(['ALL', 'Table', 'View', 'Dataset'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedAssetType(type)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  selectedAssetType === type
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {type === 'ALL' ? '全部' : type}
              </button>
            ))}
            <button
              onClick={() => {
                if (addToast) addToast('info', '更多类型', '包括：Structured File, Stream API, Unstructured Store');
              }}
              className="px-2.5 py-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer text-[11px]"
            >
              更多类型
            </button>
          </div>
        </div>

        {/* Right: Filter Trigger & Sort Dropdown */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          {/* Filter Panel Toggle */}
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeFilterCount > 0
                ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>筛选</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1 bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#334155]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="scanned">最近扫描 ▼</option>
              <option value="relevance">相关度</option>
              <option value="name">名称</option>
              <option value="updated">最近更新</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: Main Workspace Split (Left Scope Nav + Right Asset Table) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Scope Navigation (范围导航 ~250px) */}
        <div className="w-[250px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 select-none">
          {/* Scope Header & Switcher */}
          <div className="p-3 border-b border-[#E2E8F0] space-y-2">
            <div className="text-xs font-bold text-[#0F172A]">范围导航</div>
            <div className="grid grid-cols-2 gap-1 bg-[#F1F5F9] p-0.5 rounded-md text-xs font-medium">
              <button
                onClick={() => setScopeMode('domain')}
                className={`py-1 rounded text-center transition-all cursor-pointer ${
                  scopeMode === 'domain'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                业务域
              </button>
              <button
                onClick={() => setScopeMode('datasource')}
                className={`py-1 rounded text-center transition-all cursor-pointer ${
                  scopeMode === 'datasource'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                数据源
              </button>
            </div>
          </div>

          {/* Scope Tree Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
            {scopeMode === 'domain' ? (
              // Business Domain Tree
              <div className="space-y-0.5">
                {DOMAIN_TREE.map((node) => {
                  const isSelected = selectedDomainId === node.id;
                  const hasChildren = node.children && node.children.length > 0;
                  const isExpanded = !!expandedDomains[node.id];

                  return (
                    <div key={node.id} className="space-y-0.5">
                      <div
                        onClick={() => setSelectedDomainId(node.id)}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                            : 'text-[#334155] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 overflow-hidden">
                          {hasChildren ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDomainExpand(node.id);
                              }}
                              className="text-[#94A3B8] hover:text-[#0F172A]"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="w-3.5" />
                          )}
                          <FolderTree className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                          <span className="truncate">{node.name}</span>
                        </div>
                        <span className="text-[11px] text-[#94A3B8] font-mono shrink-0 ml-1">
                          {node.count.toLocaleString()}
                        </span>
                      </div>

                      {/* Sub-tree children */}
                      {hasChildren && isExpanded && (
                        <div className="pl-6 space-y-0.5 border-l border-[#E2E8F0] ml-3">
                          {node.children!.map((child) => {
                            const isChildSelected = selectedDomainId === child.id;
                            return (
                              <div
                                key={child.id}
                                onClick={() => setSelectedDomainId(child.id)}
                                className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                                  isChildSelected
                                    ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                                    : 'text-[#475569] hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <span className="truncate text-[11px]">{child.name}</span>
                                <span className="text-[10px] text-[#94A3B8] font-mono ml-1">
                                  {child.count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Data Source Tree
              <div className="space-y-1">
                {DATA_SOURCE_TREE.map((ds) => {
                  const isSelected = selectedDataSourceId === ds.id;
                  return (
                    <div
                      key={ds.id}
                      onClick={() => setSelectedDataSourceId(ds.id)}
                      className={`p-2 rounded-md cursor-pointer transition-colors space-y-0.5 border ${
                        isSelected
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                          : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 font-bold truncate">
                          <Database className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                          <span className="truncate">{ds.name}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#F1F5F9] text-[#64748B]">
                          {ds.engine}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                        <span className="font-mono truncate">{ds.dbSchema}</span>
                        <span className="font-mono text-[#94A3B8] ml-1">{ds.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Asset List High-Density Enterprise Table */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Table Container */}
          <div className="flex-1 overflow-auto relative">
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
                  <th className="py-2.5 px-3 min-w-[280px]">数据资产</th>
                  <th className="py-2.5 px-3 w-20">类型</th>
                  <th className="py-2.5 px-3 w-36">数据源</th>
                  <th className="py-2.5 px-3 w-28">业务域</th>
                  <th className="py-2.5 px-3 min-w-[240px]">治理上下文</th>
                  <th className="py-2.5 px-3 w-36">负责人</th>
                  <th className="py-2.5 px-3 w-32">最近扫描</th>
                  <th className="py-2.5 px-3 w-10 text-center">操作</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#1E293B]">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => {
                    const isSelected = selectedAssetIds.includes(asset.id);
                    const primaryTitle = asset.name || asset.technicalName;

                    return (
                      <tr
                        key={asset.id}
                        className={`hover:bg-[#F8FAFC] transition-colors ${
                          isSelected ? 'bg-[#F0F5FF]/60' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center align-top pt-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectAsset(asset.id)}
                            className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                          />
                        </td>

                        {/* COLUMN 1: Data Asset (Title + Technical Qualified Name + Description) */}
                        <td className="py-3 px-3 align-top space-y-1">
                          <div className="flex items-center space-x-2">
                            {/* Primary Display Title */}
                            <span
                              onClick={() => {
                                setActiveDetailAsset(asset);
                                if (onOpenAssetDetail) onOpenAssetDetail(asset);
                              }}
                              className="font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer transition-colors"
                            >
                              {primaryTitle}
                            </span>

                            {/* Schema Change Badge if present */}
                            {asset.schemaChanged && (
                              <span className="px-1.5 py-0.2 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-[10px] font-medium flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                                <span>{asset.schemaChangeNote || '结构有变化'}</span>
                              </span>
                            )}
                          </div>

                          {/* Technical Qualified Name in JetBrains Mono */}
                          <div className="font-mono text-[11px] text-[#64748B] flex items-center space-x-2">
                            <span>{asset.qualifiedName}</span>
                          </div>

                          {/* Secondary description / Match context */}
                          <p className="text-[11px] text-[#64748B] line-clamp-1">
                            {searchQuery && asset.matchContext ? (
                              <span className="text-[#2563EB] font-medium bg-[#EFF6FF] px-1 py-0.2 rounded border border-[#BFDBFE]">
                                {asset.matchContext}
                              </span>
                            ) : (
                              asset.description
                            )}
                          </p>

                          {/* Business Object Link tag if present */}
                          {asset.businessObject && (
                            <div className="text-[10px] text-[#64748B] pt-0.5 flex items-center space-x-1">
                              <span className="text-[#94A3B8]">关联:</span>
                              <span className="text-[#1E293B] font-semibold bg-[#F1F5F9] px-1.5 py-0.2 rounded">
                                {asset.businessObject}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* COLUMN 2: Type Tag */}
                        <td className="py-3 px-3 align-top pt-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium inline-block ${
                              asset.assetType === 'Table'
                                ? 'bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]'
                                : asset.assetType === 'View'
                                ? 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]'
                                : 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                            }`}
                          >
                            {asset.assetType}
                          </span>
                        </td>

                        {/* COLUMN 3: Data Source */}
                        <td className="py-3 px-3 align-top space-y-0.5 pt-3">
                          <div className="font-medium text-[#0F172A]">{asset.dataSourceName}</div>
                          <div className="font-mono text-[10px] text-[#64748B]">
                            {asset.dataSourceEngine}
                          </div>
                        </td>

                        {/* COLUMN 4: Business Domain */}
                        <td className="py-3 px-3 align-top pt-3">
                          <span className="font-medium text-[#334155]">
                            {asset.businessDomain || '—'}
                          </span>
                        </td>

                        {/* COLUMN 5: Governance Context Summary */}
                        <td className="py-3 px-3 align-top pt-3">
                          {renderGovernanceContextSummary(asset)}
                        </td>

                        {/* COLUMN 6: Owner */}
                        <td className="py-3 px-3 align-top pt-3">
                          <span className="text-[#334155]">{asset.owner}</span>
                        </td>

                        {/* COLUMN 7: Last Scanned */}
                        <td className="py-3 px-3 align-top space-y-0.5 pt-3">
                          <div className="font-mono text-[11px] text-[#0F172A]">
                            {asset.lastScannedTime}
                          </div>
                          {asset.lastScannedStatus === 'failed' ? (
                            <span className="text-[10px] text-[#DC2626] font-medium flex items-center space-x-1">
                              <XCircle className="w-3 h-3" />
                              <span>扫描失败</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#16A34A] font-medium">成功</span>
                          )}
                        </td>

                        {/* COLUMN 8: Row Actions (`···`) */}
                        <td className="py-3 px-3 align-top text-center pt-3 relative">
                          <button
                            onClick={() =>
                              setOpenMenuAssetId(openMenuAssetId === asset.id ? null : asset.id)
                            }
                            className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Menu Dropdown */}
                          {openMenuAssetId === asset.id && (
                            <div className="absolute right-3 top-8 w-44 bg-white border border-[#E2E8F0] rounded-lg shadow-xl z-30 py-1 text-left text-xs space-y-0.5">
                              <button
                                onClick={() => {
                                  setActiveDetailAsset(asset);
                                  setOpenMenuAssetId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-[#F8FAFC] text-[#0F172A] flex items-center space-x-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>查看详情</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (onNavigateToTableUnderstanding) {
                                    onNavigateToTableUnderstanding(asset.technicalName);
                                  } else if (addToast) {
                                    addToast('info', '表语义理解', `已导航至 ${asset.technicalName} 表语义理解工作台`);
                                  }
                                  setOpenMenuAssetId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-[#F8FAFC] text-[#0F172A] flex items-center space-x-2 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>进入数据语义</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (onViewLineage) {
                                    onViewLineage(asset.technicalName);
                                  } else if (addToast) {
                                    addToast('info', '数据血缘', `查看 ${asset.technicalName} 数据血缘图谱`);
                                  }
                                  setOpenMenuAssetId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-[#F8FAFC] text-[#0F172A] flex items-center space-x-2 cursor-pointer"
                              >
                                <GitCommit className="w-3.5 h-3.5 text-[#4338CA]" />
                                <span>查看血缘</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (addToast) addToast('info', '数据服务超市', `已在服务超市打开 ${asset.name || asset.technicalName}`);
                                  setOpenMenuAssetId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-[#F8FAFC] text-[#0F172A] flex items-center space-x-2 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
                                <span>在服务超市查看</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // Search Empty State
                  <tr>
                    <td colSpan={9} className="py-16 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-[#0F172A] text-sm">未找到匹配的数据资产</h3>
                        <p className="text-xs text-[#64748B]">
                          尝试修改关键词或调整筛选条件。
                        </p>
                      </div>
                      <button
                        onClick={handleResetFilters}
                        className="px-3.5 py-1.5 bg-[#2563EB] text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs hover:bg-[#1D4ED8]"
                      >
                        重置搜索与筛选
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Floating Bulk Action Bar when rows are selected */}
          {selectedAssetIds.length > 0 && (
            <div className="p-3 bg-[#0F172A] text-white border-t border-[#334155] flex items-center justify-between shadow-2xl shrink-0">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-bold text-[#60A5FA]">
                  已选择 {selectedAssetIds.length} 个数据资产
                </span>
                <span className="text-[#64748B]">｜</span>
                <button
                  onClick={() => setSelectedAssetIds([])}
                  className="text-[#94A3B8] hover:text-white underline cursor-pointer text-[11px]"
                >
                  取消选择
                </button>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => {
                    if (addToast) addToast('success', '已加入收藏', `已将 ${selectedAssetIds.length} 个资产存入个人收藏`);
                  }}
                  className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded border border-[#475569] font-medium cursor-pointer transition-colors flex items-center space-x-1"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>加入收藏</span>
                </button>
                <button
                  onClick={() => {
                    if (addToast) addToast('success', '清单导出成功', `已下载 ${selectedAssetIds.length} 个资产元数据 Excel 清单`);
                  }}
                  className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded border border-[#475569] font-medium cursor-pointer transition-colors flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>导出清单</span>
                </button>
                <button
                  onClick={() => {
                    if (addToast) addToast('info', '启动数据探查', `已对 ${selectedAssetIds.length} 个资产预填探查任务`);
                  }}
                  className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded border border-[#475569] font-medium cursor-pointer transition-colors flex items-center space-x-1"
                >
                  <Activity className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>发起数据探查</span>
                </button>
                <button
                  onClick={() => {
                    if (onNavigateToDiscovery) {
                      onNavigateToDiscovery();
                    } else if (addToast) {
                      addToast('success', '启动 AI 语义理解', `已将选中的 ${selectedAssetIds.length} 个资产载入语义理解工作台`);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded font-bold cursor-pointer transition-colors flex items-center space-x-1 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>启动 AI 语义理解</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FILTER DRAWER / PANEL (Slide-over) */}
      {isFilterPanelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-[#2563EB]" />
                <h2 className="font-bold text-sm text-[#0F172A]">数据资产高级筛选</h2>
              </div>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-[#0F172A]">
              {/* SECTION 1: 资产维度 */}
              <div className="space-y-3">
                <div className="font-bold text-[#64748B] text-[11px] uppercase tracking-wider">
                  资产维度
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-[#334155]">资产类型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ALL', 'Table', 'View', 'Dataset'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedAssetType(t)}
                        className={`py-1.5 px-2 rounded border text-center font-medium cursor-pointer ${
                          selectedAssetType === t
                            ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold'
                            : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]'
                        }`}
                      >
                        {t === 'ALL' ? '全部类型' : t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: 业务维度 */}
              <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
                <div className="font-bold text-[#64748B] text-[11px] uppercase tracking-wider">
                  业务维度
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-[#334155]">归属业务域</label>
                  <select
                    value={selectedDomainId}
                    onChange={(e) => setSelectedDomainId(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="all">全部业务域 (12,832)</option>
                    <option value="dom-population">人口服务 (2,410)</option>
                    <option value="dom-public">公共服务 (3,528)</option>
                    <option value="dom-enterprise">企业服务 (1,890)</option>
                    <option value="dom-city">城市治理 (4,120)</option>
                    <option value="dom-unassigned">未归属 (884)</option>
                  </select>
                </div>
              </div>

              {/* SECTION 3: Context 状态 */}
              <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
                <div className="font-bold text-[#64748B] text-[11px] uppercase tracking-wider">
                  Context 治理状态
                </div>

                {/* Profile Status */}
                <div className="space-y-1.5">
                  <label className="font-medium text-[#334155]">数据画像探查</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '全部', val: 'ALL' },
                      { label: '已探查', val: 'profiled' },
                      { label: '未探查', val: 'unprofiled' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() => setFilterProfileStatus(item.val as any)}
                        className={`py-1.5 px-2 rounded border text-center font-medium cursor-pointer ${
                          filterProfileStatus === item.val
                            ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold'
                            : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Status */}
                <div className="space-y-1.5">
                  <label className="font-medium text-[#334155]">数据质量状态</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '全部', val: 'ALL' },
                      { label: '质量正常', val: 'normal' },
                      { label: '质量关注', val: 'attention' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() => setFilterQualityStatus(item.val as any)}
                        className={`py-1.5 px-2 rounded border text-center font-medium cursor-pointer ${
                          filterQualityStatus === item.val
                            ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold'
                            : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Semantic Status */}
                <div className="space-y-1.5">
                  <label className="font-medium text-[#334155]">数据语义状态</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '全部', val: 'ALL' },
                      { label: '核心语义已确认', val: 'confirmed' },
                      { label: '语义待确认', val: 'pending' },
                      { label: '未理解', val: 'ununderstood' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() => setFilterSemanticStatus(item.val as any)}
                        className={`py-1.5 px-2 rounded border text-center font-medium cursor-pointer ${
                          filterSemanticStatus === item.val
                            ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold'
                            : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-[#64748B] hover:text-[#0F172A] font-medium cursor-pointer"
              >
                重置所有筛选
              </button>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className="px-5 py-2 bg-[#2563EB] text-white font-bold rounded-md shadow-2xs hover:bg-[#1D4ED8] cursor-pointer"
              >
                应用筛选
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA ASSET DETAIL DRAWER (Slide-over) */}
      {activeDetailAsset && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between select-text">
            {/* Detail Drawer Header */}
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-bold text-[11px] border border-[#BFDBFE]">
                    {activeDetailAsset.assetType}
                  </span>
                  <span className="text-xs font-mono text-[#64748B]">
                    {activeDetailAsset.dataSourceName}
                  </span>
                </div>
                <button
                  onClick={() => setActiveDetailAsset(null)}
                  className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  {activeDetailAsset.name || activeDetailAsset.technicalName}
                </h2>
                <div className="font-mono text-xs text-[#64748B]">
                  {activeDetailAsset.qualifiedName}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center space-x-6 border-b border-[#E2E8F0] pt-2 text-xs font-medium">
                <button
                  onClick={() => setDetailTab('overview')}
                  className={`pb-2 transition-all cursor-pointer ${
                    detailTab === 'overview'
                      ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  概览与位置
                </button>
                <button
                  onClick={() => setDetailTab('fields')}
                  className={`pb-2 transition-all cursor-pointer ${
                    detailTab === 'fields'
                      ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  字段列表 ({activeDetailAsset.fieldCount})
                </button>
                <button
                  onClick={() => setDetailTab('quality')}
                  className={`pb-2 transition-all cursor-pointer ${
                    detailTab === 'quality'
                      ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  数据质量
                </button>
                <button
                  onClick={() => setDetailTab('semantics')}
                  className={`pb-2 transition-all cursor-pointer ${
                    detailTab === 'semantics'
                      ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  语义 Context
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[#0F172A]">
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  {/* Key Properties Grid */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-lg space-y-2">
                    <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">物理表名:</span>
                      <span className="font-mono font-bold text-[#0F172A]">
                        {activeDetailAsset.technicalName}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">所属 Database / Schema:</span>
                      <span className="font-mono text-[#334155]">
                        {activeDetailAsset.database} / {activeDetailAsset.schema}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">数据源引擎:</span>
                      <span className="font-semibold text-[#0F172A]">
                        {activeDetailAsset.dataSourceName} ({activeDetailAsset.dataSourceEngine})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">归属业务域:</span>
                      <span className="font-bold text-[#2563EB]">
                        {activeDetailAsset.businessDomain} {activeDetailAsset.subDomain ? `/ ${activeDetailAsset.subDomain}` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">数据规模:</span>
                      <span className="font-mono font-medium text-[#0F172A]">
                        {activeDetailAsset.rowCount} 行 ({activeDetailAsset.size})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">负责人 / Steward:</span>
                      <span className="font-medium text-[#0F172A]">
                        {activeDetailAsset.owner}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#64748B]">最近扫描时间:</span>
                      <span className="font-mono text-[#0F172A]">
                        {activeDetailAsset.lastScannedTime}
                      </span>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="space-y-1">
                    <span className="font-bold text-[#64748B]">业务说明:</span>
                    <p className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs leading-relaxed text-[#334155]">
                      {activeDetailAsset.description}
                    </p>
                  </div>

                  {/* Current Governance Summary Box */}
                  <div className="space-y-2">
                    <span className="font-bold text-[#0F172A]">治理 Context 聚合状态</span>
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                      {renderGovernanceContextSummary(activeDetailAsset)}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'fields' && (
                <div className="space-y-3">
                  <div className="text-xs text-[#64748B]">
                    以下为从元数据扫描抽取的 Schema 结构字段列表 (示例展示):
                  </div>
                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-bold text-[#475569]">
                        <tr>
                          <th className="py-2 px-3">字段名</th>
                          <th className="py-2 px-3">物理类型</th>
                          <th className="py-2 px-3">推荐业务语义</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        <tr>
                          <td className="py-2 px-3 font-mono font-bold text-[#2563EB]">close_time</td>
                          <td className="py-2 px-3 font-mono text-[#64748B]">DATETIME</td>
                          <td className="py-2 px-3 font-medium text-[#0F172A]">办结时间 · 事件时间</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-mono font-bold text-[#2563EB]">ticket_no</td>
                          <td className="py-2 px-3 font-mono text-[#64748B]">VARCHAR(64)</td>
                          <td className="py-2 px-3 font-medium text-[#0F172A]">服务工单号 · 业务单号</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-mono font-bold text-[#2563EB]">person_id</td>
                          <td className="py-2 px-3 font-mono text-[#64748B]">VARCHAR(32)</td>
                          <td className="py-2 px-3 font-medium text-[#0F172A]">请求人ID · 人员标识</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detailTab === 'quality' && (
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                  <div className="font-bold text-[#0F172A]">数据质量规则探查摘要</div>
                  <p className="text-xs text-[#64748B]">
                    当前数据资产探查得分 92 分，发现 3 项空值率与分布异常关注点。
                  </p>
                </div>
              )}

              {detailTab === 'semantics' && (
                <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg space-y-2">
                  <div className="font-bold text-[#1D4ED8] flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>AI 语义工程可信推导链</span>
                  </div>
                  <p className="text-xs text-[#1E3A8A]">
                    算法已完成物理字段与标准语义词库的归一化比对，高可信属性比例达到 88%。
                  </p>
                </div>
              )}
            </div>

            {/* Detail Drawer Actions Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <button
                onClick={() => {
                  if (onViewLineage) onViewLineage(activeDetailAsset.technicalName);
                }}
                className="px-3.5 py-2 bg-white hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] rounded-md font-semibold text-xs transition-colors cursor-pointer"
              >
                查看血缘图谱
              </button>
              <button
                onClick={() => {
                  if (onNavigateToTableUnderstanding) {
                    onNavigateToTableUnderstanding(activeDetailAsset.technicalName);
                  }
                  setActiveDetailAsset(null);
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md font-bold text-xs shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <span>进入数据语义工作台</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
