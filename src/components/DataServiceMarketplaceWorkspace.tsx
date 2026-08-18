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
  X,
  Building2,
  HeartHandshake,
  Workflow,
  MapPin,
  User,
  Landmark,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface DataServiceMarketplaceWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToResources?: (query?: string) => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToMetrics?: () => void;
  onNavigateToBusinessObject?: () => void;
  onNavigateToDataAssets?: () => void;
  onNavigateToDataStandards?: () => void;
  onNavigateToHome?: () => void;
}

interface ConsumerResourceDetail {
  title: string;
  type: 'DATA_ASSET' | 'METRIC' | 'API_SERVICE' | 'BUSINESS_OBJECT';
  typeLabel: string;
  statusTag?: string;
  domain: string;
  description: string;
  applicableScenarios?: string;
  supportedDimensions?: string;
  accessStatus: 'DIRECT' | 'APPLY_REQUIRED' | 'APPLYING' | 'UNAVAILABLE';
  accessStatusLabel: string;
}

export const DataServiceMarketplaceWorkspace: React.FC<DataServiceMarketplaceWorkspaceProps> = ({
  addToast,
  onNavigateToResources,
  onNavigateToMyRequests,
  onNavigateToMetrics,
  onNavigateToBusinessObject,
  onNavigateToDataAssets,
}) => {
  // Discovery State: Default Discovery State (Search input empty by default)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'recommended' | 'popular' | 'recent'>('recommended');

  // Consumer Detail Drawer State
  const [selectedDetail, setSelectedDetail] = useState<ConsumerResourceDetail | null>(null);

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

              {/* Inside Right: Built-in Native Xino Identifier */}
              <div className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#FAF5FF] border border-[#E9D5FF] text-[#7C3AED] text-xs font-semibold select-none mr-2">
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Xino</span>
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
        {/* SECTION VIII & IX: 推荐资源 (Recommended Resources)     */}
        {/* ======================================================= */}
        <section className="space-y-3">
          {/* Section Header & Tabs */}
          <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2">
            <div className="flex items-center space-x-6">
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                推荐资源
              </h2>
              <div className="flex items-center space-x-4 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('recommended')}
                  className={`pb-2 -mb-2 transition-all cursor-pointer ${
                    activeTab === 'recommended'
                      ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                      : 'text-[#667085] hover:text-[#172033] font-medium'
                  }`}
                >
                  推荐资源
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('popular');
                    addToast?.('info', '热门使用', '已切换至平台高频调用与高热度资源推荐');
                  }}
                  className={`pb-2 -mb-2 transition-all cursor-pointer ${
                    activeTab === 'popular'
                      ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                      : 'text-[#667085] hover:text-[#172033] font-medium'
                  }`}
                >
                  热门使用
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('recent');
                    addToast?.('info', '最近发布', '已切换至最新上架与发布资源');
                  }}
                  className={`pb-2 -mb-2 transition-all cursor-pointer ${
                    activeTab === 'recent'
                      ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                      : 'text-[#667085] hover:text-[#172033] font-medium'
                  }`}
                >
                  最近发布
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToResources) {
                  onNavigateToResources('');
                } else {
                  addToast?.('info', '浏览全部资源', '进入全量可信数据资源库');
                }
              }}
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center space-x-1 cursor-pointer hover:underline"
            >
              <span>浏览全部资源</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Resource Brief List (3 Items, Height ~78–88px each) */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl divide-y divide-[#E6EAF0] shadow-xs overflow-hidden">
            
            {/* Resource 01: 人口基本信息视图 */}
            <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors group">
              <div className="flex items-start space-x-3.5 min-w-0">
                {/* Left Data Asset Icon (System Blue) */}
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-4 h-4 text-[#2563EB]" />
                </div>

                <div className="space-y-1 min-w-0">
                  {/* Title + Tags + Business Semantics */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      onClick={() => {
                        setSelectedDetail({
                          title: '人口基本信息视图',
                          type: 'DATA_ASSET',
                          typeLabel: '数据资产',
                          statusTag: '正式资源',
                          domain: '人口服务 · 自然人',
                          description: '覆盖居民基础属性、年龄、户籍、行政区划等人口分析基础信息。',
                          applicableScenarios: '适用于：人口结构分析 · 老龄化分析 · 区域人口统计',
                          accessStatus: 'APPLY_REQUIRED',
                          accessStatusLabel: '可申请使用',
                        });
                      }}
                      className="text-sm font-bold text-[#172033] hover:text-[#2563EB] cursor-pointer transition-colors"
                    >
                      人口基本信息视图
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                      数据资产
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                      正式资源
                    </span>
                    <span className="text-xs text-[#667085] font-normal">
                      人口服务 · 自然人
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-[#475569] leading-relaxed line-clamp-1">
                    覆盖居民基础属性、年龄、户籍、行政区划等人口分析基础信息。
                  </p>

                  {/* Applicable Scenarios */}
                  <div className="text-xs text-[#667085] font-medium">
                    适用于：人口结构分析 · 老龄化分析 · 区域人口统计
                  </div>
                </div>
              </div>

              {/* Right Access Status & Action */}
              <div className="flex items-center space-x-3 shrink-0 self-end md:self-center pt-1 md:pt-0">
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  <span>可申请使用</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetail({
                      title: '人口基本信息视图',
                      type: 'DATA_ASSET',
                      typeLabel: '数据资产',
                      statusTag: '正式资源',
                      domain: '人口服务 · 自然人',
                      description: '覆盖居民基础属性、年龄、户籍、行政区划等人口分析基础信息。',
                      applicableScenarios: '适用于：人口结构分析 · 老龄化分析 · 区域人口统计',
                      accessStatus: 'APPLY_REQUIRED',
                      accessStatusLabel: '可申请使用',
                    });
                  }}
                  className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center space-x-1 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                >
                  <span>查看资源</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Resource 02: 老龄化率 */}
            <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors group">
              <div className="flex items-start space-x-3.5 min-w-0">
                {/* Left Metric Icon (Semantic Indigo) */}
                <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]/60 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4 text-[#4F46E5]" />
                </div>

                <div className="space-y-1 min-w-0">
                  {/* Title + Tag + Business Semantics */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      onClick={() => {
                        setSelectedDetail({
                          title: '老龄化率',
                          type: 'METRIC',
                          typeLabel: '指标',
                          statusTag: '正式指标',
                          domain: '养老服务 · 人口统计',
                          description: '60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。',
                          supportedDimensions: '行政区划 · 年龄 · 时间',
                          accessStatus: 'DIRECT',
                          accessStatusLabel: '可直接使用',
                        });
                      }}
                      className="text-sm font-bold text-[#172033] hover:text-[#4F46E5] cursor-pointer transition-colors"
                    >
                      老龄化率
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                      正式指标
                    </span>
                    <span className="text-xs text-[#667085] font-normal">
                      养老服务 · 人口统计
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-[#475569] leading-relaxed line-clamp-1">
                    60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。
                  </p>

                  {/* Supported Dimensions */}
                  <div className="text-xs text-[#667085] font-medium">
                    支持：行政区划 · 年龄 · 时间
                  </div>
                </div>
              </div>

              {/* Right Access Status & Action */}
              <div className="flex items-center space-x-3 shrink-0 self-end md:self-center pt-1 md:pt-0">
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                  <span>可直接使用</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetail({
                      title: '老龄化率',
                      type: 'METRIC',
                      typeLabel: '指标',
                      statusTag: '正式指标',
                      domain: '养老服务 · 人口统计',
                      description: '60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。',
                      supportedDimensions: '行政区划 · 年龄 · 时间',
                      accessStatus: 'DIRECT',
                      accessStatusLabel: '可直接使用',
                    });
                  }}
                  className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-semibold flex items-center space-x-1 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                >
                  <span>查看指标</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Resource 03: 养老机构服务能力 */}
            <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors group">
              <div className="flex items-start space-x-3.5 min-w-0">
                {/* Left Data Asset Icon (System Blue) */}
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-4 h-4 text-[#2563EB]" />
                </div>

                <div className="space-y-1 min-w-0">
                  {/* Title + Tag + Business Semantics */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      onClick={() => {
                        setSelectedDetail({
                          title: '养老机构服务能力',
                          type: 'DATA_ASSET',
                          typeLabel: '数据资产',
                          domain: '养老服务 · 养老机构',
                          description: '覆盖养老机构、床位、服务能力与区域覆盖等核心业务信息。',
                          accessStatus: 'DIRECT',
                          accessStatusLabel: '可直接使用',
                        });
                      }}
                      className="text-sm font-bold text-[#172033] hover:text-[#2563EB] cursor-pointer transition-colors"
                    >
                      养老机构服务能力
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                      数据资产
                    </span>
                    <span className="text-xs text-[#667085] font-normal">
                      养老服务 · 养老机构
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-[#475569] leading-relaxed line-clamp-1">
                    覆盖养老机构、床位、服务能力与区域覆盖等核心业务信息。
                  </p>
                </div>
              </div>

              {/* Right Access Status & Action */}
              <div className="flex items-center space-x-3 shrink-0 self-end md:self-center pt-1 md:pt-0">
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                  <span>可直接使用</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetail({
                      title: '养老机构服务能力',
                      type: 'DATA_ASSET',
                      typeLabel: '数据资产',
                      domain: '养老服务 · 养老机构',
                      description: '覆盖养老机构、床位、服务能力与区域覆盖等核心业务信息。',
                      accessStatus: 'DIRECT',
                      accessStatusLabel: '可直接使用',
                    });
                  }}
                  className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center space-x-1 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                >
                  <span>查看资源</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
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

          {/* Three blocks on the same plane without large heavy card enclosures */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Column 1 (Left, lg:col-span-4): 按资源类型 */}
            <div className="lg:col-span-4 bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs flex flex-col justify-between">
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
                    onClick={() => {
                      if (onNavigateToDataAssets) {
                        onNavigateToDataAssets();
                      } else if (onNavigateToResources) {
                        onNavigateToResources('数据资产');
                      }
                    }}
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
                    onClick={() => {
                      if (onNavigateToMetrics) {
                        onNavigateToMetrics();
                      } else if (onNavigateToResources) {
                        onNavigateToResources('指标');
                      }
                    }}
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
                    onClick={() => {
                      if (onNavigateToResources) {
                        onNavigateToResources('接口服务');
                      } else {
                        addToast?.('info', '接口服务', '查看企业全部可调用的 API 与数据服务');
                      }
                    }}
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
                    onClick={() => {
                      if (onNavigateToBusinessObject) {
                        onNavigateToBusinessObject();
                      } else if (onNavigateToResources) {
                        onNavigateToResources('业务对象');
                      }
                    }}
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

            {/* Column 2 (Center, lg:col-span-5): 按业务领域 */}
            <div className="lg:col-span-5 bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <h3 className="text-sm font-bold text-[#172033]">
                    按业务领域
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToResources) {
                        onNavigateToResources('');
                      } else {
                        addToast?.('info', '业务领域', '展开企业全部业务领域');
                      }
                    }}
                    className="text-xs text-[#2563EB] hover:underline font-medium cursor-pointer"
                  >
                    查看全部业务领域 →
                  </button>
                </div>

                {/* Semantic Topic Strip (2 cols x 4 rows = 8 topics) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  
                  {/* 1. 人口服务 */}
                  <div
                    onClick={() => handleSuggestedClick('人口服务')}
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
                    onClick={() => handleSuggestedClick('养老服务')}
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

                  {/* 5. 自然人 */}
                  <div
                    onClick={() => handleSuggestedClick('自然人')}
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

                  {/* 6. 行政区划 */}
                  <div
                    onClick={() => handleSuggestedClick('行政区划')}
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

                  {/* 7. 服务工单 */}
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

                  {/* 8. 养老机构 */}
                  <div
                    onClick={() => handleSuggestedClick('养老机构')}
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

            {/* Column 3 (Right, lg:col-span-3): 继续使用 */}
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
                    onClick={() => {
                      setSelectedDetail({
                        title: '人口基本信息视图',
                        type: 'DATA_ASSET',
                        typeLabel: '数据资产',
                        statusTag: '正式资源',
                        domain: '人口服务 · 自然人',
                        description: '覆盖居民基础属性、年龄、户籍、行政区划等人口分析基础信息。',
                        applicableScenarios: '适用于：人口结构分析 · 老龄化分析 · 区域人口统计',
                        accessStatus: 'APPLY_REQUIRED',
                        accessStatusLabel: '可申请使用',
                      });
                    }}
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
                    onClick={() => {
                      setSelectedDetail({
                        title: '老龄化率',
                        type: 'METRIC',
                        typeLabel: '指标',
                        statusTag: '正式指标',
                        domain: '养老服务 · 人口统计',
                        description: '60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。',
                        supportedDimensions: '行政区划 · 年龄 · 时间',
                        accessStatus: 'DIRECT',
                        accessStatusLabel: '可直接使用',
                      });
                    }}
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
                    onClick={() => {
                      setSelectedDetail({
                        title: '养老机构服务能力接口',
                        type: 'API_SERVICE',
                        typeLabel: '接口服务',
                        domain: '养老服务 · 养老机构',
                        description: '覆盖养老机构、床位、服务能力与区域覆盖等核心业务信息与实时接口查询。',
                        accessStatus: 'DIRECT',
                        accessStatusLabel: '可直接使用',
                      });
                    }}
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
      </main>

      {/* ========================================================= */}
      {/* SECTION XVI: Consumer-Only Resource Detail Drawer        */}
      {/* ========================================================= */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/25 backdrop-blur-2xs">
          <div className="w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col border-l border-[#E6EAF0] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  selectedDetail.type === 'DATA_ASSET'
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                    : selectedDetail.type === 'METRIC'
                    ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]'
                    : selectedDetail.type === 'API_SERVICE'
                    ? 'bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC]'
                    : 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                }`}>
                  {selectedDetail.typeLabel}
                </span>
                {selectedDetail.statusTag && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                    {selectedDetail.statusTag}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-1 rounded-md hover:bg-[#E2E8F0] text-[#64748B] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body - Consumer Information ONLY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Title & Domain */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[#172033] tracking-tight">
                  {selectedDetail.title}
                </h3>
                <div className="text-xs text-[#667085] flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>业务语义：{selectedDetail.domain}</span>
                </div>
              </div>

              {/* Business Description */}
              <div className="space-y-1.5">
                <span className="font-bold text-[#172033] block">业务说明</span>
                <p className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg text-[#334155] leading-relaxed">
                  {selectedDetail.description}
                </p>
              </div>

              {/* Scenarios / Dimensions */}
              {selectedDetail.applicableScenarios && (
                <div className="space-y-1.5">
                  <span className="font-bold text-[#172033] block">适用场景</span>
                  <div className="p-3 bg-white border border-[#E6EAF0] rounded-lg text-[#475569]">
                    {selectedDetail.applicableScenarios}
                  </div>
                </div>
              )}

              {selectedDetail.supportedDimensions && (
                <div className="space-y-1.5">
                  <span className="font-bold text-[#172033] block">支持维度</span>
                  <div className="p-3 bg-white border border-[#E6EAF0] rounded-lg text-[#475569]">
                    {selectedDetail.supportedDimensions}
                  </div>
                </div>
              )}

              {/* Access Status Summary Box */}
              <div className="p-3.5 rounded-lg border border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#667085]">访问状态</div>
                  <div className="text-xs font-bold text-[#172033] mt-0.5">
                    {selectedDetail.accessStatus === 'DIRECT' ? (
                      <span className="text-[#16A36A]">● 可直接使用</span>
                    ) : (
                      <span className="text-[#2563EB]">● 可申请使用</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    selectedDetail.accessStatus === 'DIRECT'
                      ? 'bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0]'
                      : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                  }`}>
                    {selectedDetail.accessStatusLabel}
                  </span>
                </div>
              </div>

              {/* Trust Guarantee Note */}
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE]/60 rounded-lg text-[11px] text-[#1E40AF] flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  该资源由 Semovix 语义可信引擎背书，口径清晰且已对齐统一业务标准。
                </span>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="px-3.5 py-1.5 border border-[#E6EAF0] text-[#334155] rounded-md hover:bg-white text-xs transition-colors cursor-pointer"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDetail(null);
                  if (selectedDetail.accessStatus === 'DIRECT') {
                    addToast?.('success', '资源就绪', `已接入「${selectedDetail.title}」，可在应用与分析中直接使用`);
                  } else {
                    addToast?.('success', '申请提交', `已提交对「${selectedDetail.title}」的访问申请，预计即刻自动审批`);
                  }
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-md text-xs transition-colors cursor-pointer"
              >
                {selectedDetail.accessStatus === 'DIRECT' ? '立即使用' : '发起使用申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
