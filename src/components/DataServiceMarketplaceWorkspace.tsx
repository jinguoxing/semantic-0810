import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  Database,
  BarChart3,
  Globe,
  FolderTree,
  FileText,
  Users,
  Building2,
  HeartHandshake,
  Workflow,
  MapPin,
  User,
  Landmark
} from 'lucide-react';

/** Facet entry into Resource Explorer BROWSE — pre-applied type/domain/object
 *  filter. Discover entries route into resource browsing, never directly into
 *  governance modules. */
export interface BrowseEntryFilters {
  type?: 'DATA_ASSET' | 'METRIC' | 'DATA_API' | 'BUSINESS_OBJECT';
  domain?: string;
  object?: string;
}

interface DataServiceMarketplaceWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToResources?: (query?: string) => void;
  /** Facet entry — preferred over onNavigateToResources for type/domain/object
   *  chips: lands in BROWSE with the filter pre-applied, not a text search. */
  onNavigateToBrowse?: (filters: BrowseEntryFilters, label: string) => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToDataStandards?: () => void;
  onNavigateToHome?: () => void;
}

export const DataServiceMarketplaceWorkspace: React.FC<DataServiceMarketplaceWorkspaceProps> = ({
  addToast,
  onNavigateToResources,
  onNavigateToBrowse,
  onNavigateToMyRequests,
}) => {
  // Discovery State: Default Discovery State (Search input empty by default)
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (onNavigateToResources) {
      onNavigateToResources(q);
    } else {
      if (q) {
        addToast?.('success', '资源检索', `正在为你搜索「${q}」相关的可信数据资源`);
      } else {
        addToast?.('info', '浏览资源', '正在载入全部已发布可信数据资源列表');
      }
    }
  };

  const handleSuggestedClick = (query: string) => {
    setSearchQuery(query);
    if (onNavigateToResources) {
      onNavigateToResources(query);
    } else {
      addToast?.('success', '意图搜索', `正在为你检索「${query}」`);
    }
  };

  // Facet entry — BROWSE with a pre-applied filter (type / domain / object).
  const handleBrowseEntry = (filters: BrowseEntryFilters, label: string) => {
    if (onNavigateToBrowse) {
      onNavigateToBrowse(filters, label);
    } else if (onNavigateToResources) {
      onNavigateToResources(label);
    } else {
      addToast?.('info', '浏览资源', `已按「${label}」筛选可发现资源`);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#F8FAFC] text-[#172033] flex flex-col font-sans selection:bg-[#EFF6FF] selection:text-[#2563EB]">
      {/* ========================================================= */}
      {/* MAIN CONTAINER: Max-width 1480–1520px, Centered, No Sidebar */}
      {/* ========================================================= */}
      <main className="flex-1 w-full max-w-[1500px] mx-auto px-6 sm:px-8 py-6 sm:py-7 space-y-6">

        {/* ======================================================= */}
        {/* SECTION V & VI & VII: Unified Discovery Surface         */}
        {/* ======================================================= */}
        <section className="pt-1 sm:pt-2 text-center space-y-4">
          {/* Main Title & Subtitle */}
          <div className="space-y-1.5 max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-extrabold text-[#172033] tracking-tight leading-tight">
              找到业务需要的可信数据
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
              搜索企业数据资源，或直接告诉 Xino 你想解决什么业务问题。
            </p>
          </div>

          {/* Unified Discovery Input (Width ~1100–1200px) */}
          <div className="max-w-[1160px] mx-auto w-full">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center bg-white border border-[#E6EAF0] hover:border-[#CBD5E1] focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-[#2563EB]/10 rounded-xl p-1.5 shadow-sm transition-all duration-200"
            >
              {/* Left Search Icon */}
              <div className="pl-3.5 pr-1 text-[#94A3B8] shrink-0">
                <Search className="w-5 h-5" />
              </div>

              {/* Discovery Input Box */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索数据资源，或告诉 Xino 你想解决什么业务问题…"
                className="flex-1 px-2.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#172033] placeholder-[#94A3B8] bg-transparent outline-none font-normal"
              />

              {/* Inside Right: Built-in Xino Identifier — plain text mark: AI lives inside discovery, not a mode button */}
              <div className="hidden sm:flex items-center space-x-2 mr-2 shrink-0 select-none">
                <span className="w-4 h-px bg-[#E2E8F0]" />
                <span className="flex items-center space-x-1 text-[#7C3AED] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Xino</span>
                </span>
              </div>

              {/* Right Outside Primary Action Button */}
              <button
                type="submit"
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <span>搜索资源</span>
              </button>
            </form>

            {/* SECTION VII: Suggested Queries (试试：) */}
            <div className="mt-3 flex items-center justify-center flex-wrap gap-2 text-xs">
              <span className="text-[#667085] font-medium mr-1">试试：</span>

              <button
                type="button"
                onClick={() => handleSuggestedClick('分析区域老龄化情况')}
                className="px-3 py-1 bg-white hover:bg-[#F1F5F9] border border-[#E6EAF0] hover:border-[#CBD5E1] text-[#334155] rounded-md text-xs transition-colors cursor-pointer shadow-2xs"
              >
                分析区域老龄化情况
              </button>

              <button
                type="button"
                onClick={() => handleSuggestedClick('查找人口基础数据')}
                className="px-3 py-1 bg-white hover:bg-[#F1F5F9] border border-[#E6EAF0] hover:border-[#CBD5E1] text-[#334155] rounded-md text-xs transition-colors cursor-pointer shadow-2xs"
              >
                查找人口基础数据
              </button>

              <button
                type="button"
                onClick={() => handleSuggestedClick('公共服务热线工单')}
                className="px-3 py-1 bg-white hover:bg-[#F1F5F9] border border-[#E6EAF0] hover:border-[#CBD5E1] text-[#334155] rounded-md text-xs transition-colors cursor-pointer shadow-2xs"
              >
                公共服务热线工单
              </button>

              <button
                type="button"
                onClick={() => handleSuggestedClick('企业经营分析')}
                className="px-3 py-1 bg-white hover:bg-[#F1F5F9] border border-[#E6EAF0] hover:border-[#CBD5E1] text-[#334155] rounded-md text-xs transition-colors cursor-pointer shadow-2xs"
              >
                企业经营分析
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================= */}
        {/* SECTION XI–XIV: 探索更多 (Explore More - 3 Columns)      */}
        {/* ======================================================= */}
        <section className="space-y-3 pt-1">
          <div className="border-b border-[#E6EAF0] pb-2">
            <h2 className="text-base font-bold text-[#172033] tracking-tight">
              探索更多
            </h2>
          </div>

          {/* Four blocks on the same plane without large heavy card enclosures */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

            {/* Column 1 (Left, lg:col-span-3): 按资源类型 */}
            <div className="lg:col-span-3 bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="pb-1.5">
                  <h3 className="text-sm font-bold text-[#172033]">
                    按资源类型
                  </h3>
                </div>

                {/* Navigation List / Strip */}
                <div className="divide-y divide-[#F1F5F9]">
                  {/* 1. 数据资产 */}
                  <div
                    onClick={() => handleBrowseEntry({ type: 'DATA_ASSET' }, '数据资产')}
                    className="py-2 flex items-center justify-between hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                          数据资产
                        </div>
                        <div className="text-[11px] text-[#667085]">
                          业务表、视图与数据集
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 2. 指标 */}
                  <div
                    onClick={() => handleBrowseEntry({ type: 'METRIC' }, '指标')}
                    className="py-2 flex items-center justify-between hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033] group-hover:text-[#4F46E5] transition-colors">
                          指标
                        </div>
                        <div className="text-[11px] text-[#667085]">
                          企业正式统计指标
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 3. 接口服务 */}
                  <div
                    onClick={() => handleBrowseEntry({ type: 'DATA_API' }, '接口服务')}
                    className="py-2 flex items-center justify-between hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#ECFEFF] text-[#0891B2] flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033] group-hover:text-[#0891B2] transition-colors">
                          接口服务
                        </div>
                        <div className="text-[11px] text-[#667085]">
                          API 与数据服务
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0891B2] group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 4. 业务对象 */}
                  <div
                    onClick={() => handleBrowseEntry({ type: 'BUSINESS_OBJECT' }, '业务对象')}
                    className="py-2 flex items-center justify-between hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                        <FolderTree className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033] group-hover:text-[#7C3AED] transition-colors">
                          业务对象
                        </div>
                        <div className="text-[11px] text-[#667085]">
                          企业核心业务实体
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2 (lg:col-span-3): 按业务领域 */}
            <div className="lg:col-span-3 bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="pb-1.5">
                  <h3 className="text-sm font-bold text-[#172033]">
                    按业务领域
                  </h3>
                </div>

                {/* Domain Strip (2 cols x 2 rows = 4 domains) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  
                  {/* 1. 人口服务 */}
                  <div
                    onClick={() => handleBrowseEntry({ domain: 'population' }, '人口服务')}
                    className="p-2 rounded-lg border border-[#F1F5F9] hover:border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Users className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <span className="text-xs font-semibold text-[#172033] group-hover:text-[#2563EB] truncate">
                        人口服务
                      </span>
                    </div>
                    <span className="text-[11px] text-[#667085] shrink-0 ml-1">
                      128 个相关资源
                    </span>
                  </div>

                  {/* 2. 公共服务 */}
                  <div
                    onClick={() => handleSuggestedClick('公共服务')}
                    className="p-2 rounded-lg border border-[#F1F5F9] hover:border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Workflow className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
                      <span className="text-xs font-semibold text-[#172033] group-hover:text-[#4F46E5] truncate">
                        公共服务
                      </span>
                    </div>
                    <span className="text-[11px] text-[#667085] shrink-0 ml-1">
                      96 个相关资源
                    </span>
                  </div>

                  {/* 3. 企业服务 */}
                  <div
                    onClick={() => handleSuggestedClick('企业服务')}
                    className="p-2 rounded-lg border border-[#F1F5F9] hover:border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-[#0891B2] shrink-0" />
                      <span className="text-xs font-semibold text-[#172033] group-hover:text-[#0891B2] truncate">
                        企业服务
                      </span>
                    </div>
                    <span className="text-[11px] text-[#667085] shrink-0 ml-1">
                      84 个相关资源
                    </span>
                  </div>

                  {/* 4. 养老服务 */}
                  <div
                    onClick={() => handleBrowseEntry({ domain: 'elderly' }, '养老服务')}
                    className="p-2 rounded-lg border border-[#F1F5F9] hover:border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <HeartHandshake className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <span className="text-xs font-semibold text-[#172033] group-hover:text-[#2563EB] truncate">
                        养老服务
                      </span>
                    </div>
                    <span className="text-[11px] text-[#667085] shrink-0 ml-1">
                      42 个相关资源
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Column 3 (lg:col-span-3): 按业务对象 */}
            <div className="lg:col-span-3 bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="pb-1.5">
                  <h3 className="text-sm font-bold text-[#172033]">
                    按业务对象
                  </h3>
                </div>

                {/* Business Object Strip (2 cols x 2 rows = 4 objects) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">

                  {/* 1. 自然人 */}
                  <div
                    onClick={() => handleBrowseEntry({ object: 'person' }, '自然人')}
                    className="p-2 rounded-lg border border-[#F1F5F9] hover:border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <User className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
                      <span className="text-xs font-semibold text-[#172033] group-hover:text-[#4F46E5] truncate">
                        自然人
                      </span>
                    </div>
                    <span className="text-[11px] text-[#667085] shrink-0 ml-1">
                      122 个相关资源
                    </span>
                  </div>

                  {/* 2. 行政区划 */}
                  <div
                    onClick={() => handleBrowseEntry({ object: 'region' }, '行政区划')}
                    className="p-2 rounded-lg border border-[#F1F5F9] hover:border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-[#0891B2] shrink-0" />
                      <span className="text-xs font-semibold text-[#172033] group-hover:text-[#0891B2] truncate">
                        行政区划
                      </span>
                    </div>
                    <span className="text-[11px] text-[#667085] shrink-0 ml-1">
                      16 个相关资源
                    </span>
                  </div>

                  {/* 3. 服务工单 */}
                  <div
                    onClick={() => handleSuggestedClick('服务工单')}
                    className="p-2 rounded-lg border border-[#F1F5F9] hover:border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <span className="text-xs font-semibold text-[#172033] group-hover:text-[#2563EB] truncate">
                        服务工单
                      </span>
                    </div>
                    <span className="text-[11px] text-[#667085] shrink-0 ml-1">
                      28 个相关资源
                    </span>
                  </div>

                  {/* 4. 养老机构 */}
                  <div
                    onClick={() => handleBrowseEntry({ object: 'org' }, '养老机构')}
                    className="p-2 rounded-lg border border-[#F1F5F9] hover:border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Landmark className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
                      <span className="text-xs font-semibold text-[#172033] group-hover:text-[#4F46E5] truncate">
                        养老机构
                      </span>
                    </div>
                    <span className="text-[11px] text-[#667085] shrink-0 ml-1">
                      6 个相关资源
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Column 4 (Right, lg:col-span-3): 继续使用 */}
            <div className="lg:col-span-3 bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <h3 className="text-sm font-bold text-[#172033]">
                    继续使用
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToMyRequests) {
                        onNavigateToMyRequests();
                      } else {
                        addToast?.('info', '最近使用', '查看企业历史访问与调用记录');
                      }
                    }}
                    className="text-xs text-[#2563EB] hover:underline font-medium cursor-pointer"
                  >
                    查看全部最近使用 →
                  </button>
                </div>

                {/* Continuation List (3 Items) */}
                <div className="divide-y divide-[#F1F5F9]">
                  {/* 1. 人口基本信息视图 */}
                  <div
                    onClick={() => handleSuggestedClick('人口基本信息视图')}
                    className="py-2 flex items-center justify-between hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                        <Database className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] truncate transition-colors">
                          人口基本信息视图
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          数据资产 · 10 分钟前
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>

                  {/* 2. 老龄化率 */}
                  <div
                    onClick={() => handleSuggestedClick('老龄化率')}
                    className="py-2 flex items-center justify-between hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                        <BarChart3 className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#172033] group-hover:text-[#4F46E5] truncate transition-colors">
                          老龄化率
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          指标 · 1 小时前
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>

                  {/* 3. 养老机构服务能力接口 */}
                  <div
                    onClick={() => handleSuggestedClick('养老机构服务能力接口')}
                    className="py-2 flex items-center justify-between hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-[#ECFEFF] text-[#0891B2] flex items-center justify-center shrink-0">
                        <Globe className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#172033] group-hover:text-[#0891B2] truncate transition-colors">
                          养老机构服务能力接口
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          接口服务 · 昨天
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0891B2] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Full-width entry: 浏览全部资源 — the single full-list exit into Explorer */}
        <section className="mt-6">
          <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#172033]">
                浏览全部资源
              </h2>
              <p className="text-xs text-[#667085] mt-1">
                在资源浏览器中查看当前可发现范围内的全部数据资产、指标、接口服务与业务对象。
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onNavigateToResources) {
                  onNavigateToResources('');
                } else {
                  addToast?.('info', '浏览全部资源', '已进入资源浏览器，可按类型、领域与对象筛选');
                }
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              进入资源浏览器
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </main>

    </div>
  );
};
