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
  Compass,
  Layers,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Table,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bell,
  X,
  Send,
  Building2,
  HeartHandshake,
  Workflow
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

export const DataServiceMarketplaceWorkspace: React.FC<DataServiceMarketplaceWorkspaceProps> = ({
  addToast,
  onNavigateToResources,
  onNavigateToMyRequests,
  onNavigateToMetrics,
  onNavigateToBusinessObject,
  onNavigateToDataAssets,
  onNavigateToDataStandards,
  onNavigateToHome,
}) => {
  // Navigation states
  const [activeSideNav, setActiveSideNav] = useState<'discovery' | 'resources' | 'my_requests'>('discovery');
  
  // Search & Type Chip state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedResourceTypeChip, setSelectedResourceTypeChip] = useState<'ALL' | 'DATA_ASSET' | 'METRIC' | 'DATA_API' | 'BUSINESS_OBJECT'>('ALL');

  // Interactive Detail / Modal state
  const [isXinoAssistantOpen, setIsXinoAssistantOpen] = useState<boolean>(false);
  const [xinoPromptInput, setXinoPromptInput] = useState<string>('');
  const [selectedResourceDetail, setSelectedResourceDetail] = useState<{
    name: string;
    type: string;
    domain: string;
    status: string;
    description: string;
    path: string;
  } | null>(null);

  const isExplicitGoalQuery = (query: string) => {
    const q = query.trim();
    if (!q) return false;
    // Explicit Goal indicators: questions, desire verbs + analysis objects, or analytical sentence structures
    const explicitGoalMarkers = [
      '我想分析', '想分析', '需要哪些数据', '如何分析', '如何评估',
      '怎么分析', '需要什么数据', '分析方案', '构建方案', '我想了解'
    ];
    const hasExplicitMarker = explicitGoalMarkers.some(marker => q.includes(marker));
    const isAnalyticalQuestion = (q.includes('分析') || q.includes('评估') || q.includes('比较')) && 
                                  (q.includes('？') || q.includes('?') || q.includes('需要') || q.includes('如何') || q.includes('哪') || q.length >= 14);
    return hasExplicitMarker || isAnalyticalQuestion;
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      if (onNavigateToResources) {
        onNavigateToResources('');
      } else {
        addToast?.('info', '搜索提示', '请输入搜索关键词或业务问题，例如：人口年龄数据、老龄化率、或者直接描述业务目标');
      }
      return;
    }
    
    // User is explicit -> AI retreats rule:
    // Only route to GOAL_SEARCH if it's an explicit goal/problem statement.
    // If it's a resource keyword or fuzzy noun (e.g. "人口年龄数据", "老龄人口", "老龄化率"), route to RESOURCE_SEARCH.
    if (isExplicitGoalQuery(q)) {
      if (onNavigateToResources) {
        onNavigateToResources(q);
      }
      addToast?.('success', '目标意图识别', `已识别业务目标「${q}」，正在构建专属数据方案`);
    } else {
      if (onNavigateToResources) {
        onNavigateToResources(q);
      }
      addToast?.('info', '精准检索', `已进入资源检索模式，搜索「${q}」`);
    }
  };

  const handleStartSmartSearch = () => {
    setIsXinoAssistantOpen(true);
    addToast?.('info', 'Xino 智能找数', '已唤起智能找数对话助手，描述你的业务目标即可获得专属数据方案');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans antialiased">
      {/* ========================================================= */}
      {/* LEFT IN-APP SIDEBAR (~220px)                              */}
      {/* ========================================================= */}
      <aside className="w-[220px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none z-10">
        {/* Sidebar Header Title */}
        <div className="px-5 py-4 border-b border-[#E6EAF0]">
          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
            数据服务超市
          </h2>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="p-3 space-y-1 text-xs">
          {/* 1. 发现 (当前高亮) */}
          <button
            onClick={() => setActiveSideNav('discovery')}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'discovery'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Compass className="w-4 h-4 text-[#2563EB]" />
            <span>发现</span>
          </button>

          {/* 2. 资源 */}
          <button
            onClick={() => {
              if (onNavigateToResources) {
                onNavigateToResources('分析各街镇老龄化情况');
              } else {
                setActiveSideNav('resources');
                addToast?.('info', '资源目录', '切换至全部已发布数据表、指标、API 与业务对象全景库');
              }
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'resources'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#64748B]" />
            <span>资源</span>
          </button>

          {/* 3. 我的申请 */}
          <button
            onClick={() => {
              if (onNavigateToMyRequests) {
                onNavigateToMyRequests();
              } else {
                setActiveSideNav('my_requests');
                addToast?.('info', '我的申请', '查看已申请的数据访问权限与 API 调用授权记录');
              }
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'my_requests'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#64748B]" />
            <span>我的申请</span>
          </button>
        </nav>

        {/* Bottom Fixed Lightweight AI Partner Card */}
        <div className="mt-auto p-3 border-t border-[#EEF2F6] bg-[#FAFCFF]">
          <div className="p-2.5 rounded-md border border-[#E0E7FF] bg-white shadow-2xs">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-6 h-6 rounded-md bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-[#667085] leading-tight">AI Partner</div>
                <div className="text-xs font-bold text-[#172033] leading-tight truncate">
                  Xino｜犀诺
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA                                         */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header Region: Breadcrumb + Main Title */}
        <div className="bg-white border-b border-[#E6EAF0] px-8 pt-5 pb-5 shrink-0">
          <div className="max-w-[1400px] mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-xs text-[#667085] mb-2 font-normal">
              <span>数据服务超市</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-semibold text-[#172033]">发现</span>
            </div>

            {/* Page Title & Subtitle */}
            <div className="flex items-baseline space-x-3">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                数据服务超市
              </h1>
            </div>
            <p className="text-xs text-[#667085] mt-1">
              从业务语义出发，发现可信、可理解、可获取的数据资源。
            </p>
          </div>
        </div>

        {/* Core Scrollable Content Container (Max width 1360px - 1400px) */}
        <div className="flex-1 p-8 space-y-8 max-w-[1400px] w-full mx-auto">
          
          {/* ======================================================= */}
          {/* 模块一：Hero Search (首屏核心)                          */}
          {/* ======================================================= */}
          <section className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Hero Left Main Area (col 8) */}
              <div className="lg:col-span-8 space-y-3.5">
                <div>
                  <h2 className="text-xl font-bold text-[#172033] tracking-tight">
                    找到你需要的数据
                  </h2>
                  <p className="text-xs text-[#667085] mt-1">
                    描述业务需求，或直接搜索数据、指标、数据 API 与业务对象。
                  </p>
                </div>

                {/* Big Search Input Box */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 absolute left-3.5 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索数据、指标、API、业务对象，或直接描述你想完成的事情"
                      className="w-full pl-10 pr-24 py-2.5 text-xs bg-[#F8FAFC] border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#172033] placeholder-[#94A3B8] transition-all"
                    />
                    <div className="absolute right-3 flex items-center space-x-1 text-[11px] text-[#94A3B8] font-medium pointer-events-none select-none">
                      <span className="px-1.5 py-0.5 rounded bg-[#EDF2F7] text-[#64748B] text-[10px] font-mono">
                        Enter ↵
                      </span>
                      <span>搜索</span>
                    </div>
                  </div>
                </form>

                {/* Resource Type Chips Below Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-[#667085] font-medium mr-1">类型:</span>
                    
                    <button
                      onClick={() => setSelectedResourceTypeChip('ALL')}
                      className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        selectedResourceTypeChip === 'ALL'
                          ? 'bg-[#2563EB] text-white font-bold shadow-2xs'
                          : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      全部
                    </button>

                    <button
                      onClick={() => setSelectedResourceTypeChip('DATA_ASSET')}
                      className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        selectedResourceTypeChip === 'DATA_ASSET'
                          ? 'bg-[#2563EB] text-white font-bold shadow-2xs'
                          : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      数据资产
                    </button>

                    <button
                      onClick={() => setSelectedResourceTypeChip('METRIC')}
                      className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        selectedResourceTypeChip === 'METRIC'
                          ? 'bg-[#2563EB] text-white font-bold shadow-2xs'
                          : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      指标
                    </button>

                    <button
                      onClick={() => setSelectedResourceTypeChip('DATA_API')}
                      className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        selectedResourceTypeChip === 'DATA_API'
                          ? 'bg-[#2563EB] text-white font-bold shadow-2xs'
                          : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      数据 API
                    </button>

                    <button
                      onClick={() => setSelectedResourceTypeChip('BUSINESS_OBJECT')}
                      className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        selectedResourceTypeChip === 'BUSINESS_OBJECT'
                          ? 'bg-[#2563EB] text-white font-bold shadow-2xs'
                          : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      业务对象
                    </button>
                  </div>

                  {/* Explicit Browse All Resources link right under Hero Search */}
                  <button
                    onClick={() => {
                      if (onNavigateToResources) {
                        onNavigateToResources('');
                      } else {
                        addToast?.('info', '浏览全部资源', '进入全部可发现资源列表');
                      }
                    }}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center space-x-1 hover:underline cursor-pointer py-1"
                  >
                    <span>浏览全部资源</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Hero Right Light Auxiliary Card (col 4) */}
              <div className="lg:col-span-4 bg-[#FBFBFE] border border-[#E9D5FF] rounded-md p-4 flex flex-col justify-between h-full space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[#7C3AED]">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-xs font-bold text-[#7C3AED]">
                      Xino 智能找数
                    </h3>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    不知道该用哪些数据？描述你的业务目标，让 Xino 帮你识别需要的数据，并推荐可信的数据方案。
                  </p>
                </div>

                <button
                  onClick={handleStartSmartSearch}
                  className="w-full py-2 px-3 bg-white hover:bg-[#FAF5FF] border border-[#D8B4FE] text-[#7C3AED] hover:text-[#6B21A8] text-xs font-bold rounded-md flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <span>开始智能找数</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </section>

          {/* ======================================================= */}
          {/* 模块二：浏览资源类型                                     */}
          {/* ======================================================= */}
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#172033]">
                  浏览资源类型
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  按资源类型快速进入浏览与搜索。
                </p>
              </div>

              <button
                onClick={() => {
                  if (onNavigateToResources) {
                    onNavigateToResources('');
                  } else {
                    addToast?.('info', '浏览全部资源', '进入全量资源浏览视图');
                  }
                }}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
              >
                <span>浏览全部资源</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Card 1: 数据资产 */}
              <div
                onClick={() => {
                  onNavigateToDataAssets?.();
                  addToast?.('info', '数据资产', '进入已发布数据表、视图与数据集浏览视图');
                }}
                className="bg-white border border-[#E6EAF0] hover:border-[#2563EB] rounded-md p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB]">
                      <Table className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                    数据资产
                  </h3>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    浏览已发布的数据表、视图与数据集。
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#EEF2F6] text-[11px] text-[#94A3B8] font-mono">
                  Table / View / Dataset
                </div>
              </div>

              {/* Card 2: 指标 */}
              <div
                onClick={() => {
                  onNavigateToMetrics?.();
                  addToast?.('info', '指标注册表', '进入正式指标与统计口径浏览视图');
                }}
                className="bg-white border border-[#E6EAF0] hover:border-[#2563EB] rounded-md p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                      <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                    指标
                  </h3>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    浏览正式指标与统计口径。
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#EEF2F6] text-[11px] text-[#94A3B8] font-mono">
                  Metric
                </div>
              </div>

              {/* Card 3: 数据 API */}
              <div
                onClick={() => {
                  addToast?.('info', '数据 API', '进入可调用数据接口与开放服务能力视图');
                }}
                className="bg-white border border-[#E6EAF0] hover:border-[#2563EB] rounded-md p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A36A]">
                      <Globe className="w-4 h-4 text-[#16A36A]" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                    数据 API
                  </h3>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    浏览可调用的数据接口与服务能力。
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#EEF2F6] text-[11px] text-[#94A3B8] font-mono">
                  API / Service
                </div>
              </div>

              {/* Card 4: 业务对象 */}
              <div
                onClick={() => {
                  onNavigateToBusinessObject?.();
                  addToast?.('info', '业务对象', '从业务概念出发发现相关数据与服务');
                }}
                className="bg-white border border-[#E6EAF0] hover:border-[#2563EB] rounded-md p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-md bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED]">
                      <FolderTree className="w-4 h-4 text-[#7C3AED]" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                    业务对象
                  </h3>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    从业务概念出发发现相关数据与服务。
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#EEF2F6] text-[11px] text-[#94A3B8] font-mono">
                  Business Object
                </div>
              </div>

            </div>
          </section>

          {/* ======================================================= */}
          {/* 模块三：按业务领域发现                                   */}
          {/* ======================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#172033]">
                  按业务领域发现
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  从熟悉的业务领域开始探索相关资源。
                </p>
              </div>
              <button
                onClick={() => addToast?.('info', '业务领域', '展开企业全部 12 个业务领域全景分类')}
                className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-medium cursor-pointer"
              >
                <span>查看全部业务领域</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Domain 1: 人口服务 */}
              <div
                onClick={() => {
                  if (onNavigateToResources) {
                    onNavigateToResources('人口');
                  }
                  addToast?.('info', '人口服务', '进入人口主体、居住与户籍相关 128 项资源列表');
                }}
                className="bg-white border border-[#E6EAF0] hover:border-[#2563EB] rounded-md p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                      人口服务
                    </h3>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    人口主体、居住、户籍与人口统计相关资源
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      自然人
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      行政区域
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      人口指标
                    </span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-[#EEF2F6] text-xs font-medium text-[#667085]">
                  128 项相关资源
                </div>
              </div>

              {/* Domain 2: 公共服务 */}
              <div
                onClick={() => {
                  if (onNavigateToResources) {
                    onNavigateToResources('公共');
                  }
                  addToast?.('info', '公共服务', '进入热线服务工单、事项办理与服务评价相关 96 项资源列表');
                }}
                className="bg-white border border-[#E6EAF0] hover:border-[#2563EB] rounded-md p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Workflow className="w-4 h-4 text-[#4F46E5]" />
                    <h3 className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                      公共服务
                    </h3>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    热线服务工单、事项办理与服务评价相关资源
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      服务工单
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      办结状态
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      满意度
                    </span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-[#EEF2F6] text-xs font-medium text-[#667085]">
                  96 项相关资源
                </div>
              </div>

              {/* Domain 3: 企业服务 */}
              <div
                onClick={() => {
                  if (onNavigateToResources) {
                    onNavigateToResources('企业');
                  }
                  addToast?.('info', '企业服务', '进入企业主体、企业状态与涉企服务相关 84 项资源列表');
                }}
                className="bg-white border border-[#E6EAF0] hover:border-[#2563EB] rounded-md p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-[#0891B2]" />
                    <h3 className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                      企业服务
                    </h3>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    企业主体、企业状态与涉企服务相关资源
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      企业
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      法人
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      企业事项
                    </span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-[#EEF2F6] text-xs font-medium text-[#667085]">
                  84 项相关资源
                </div>
              </div>

              {/* Domain 4: 养老服务 */}
              <div
                onClick={() => {
                  if (onNavigateToResources) {
                    onNavigateToResources('养老');
                  }
                  addToast?.('info', '养老服务', '进入养老机构、服务能力与养老资源相关 42 项数据列表');
                }}
                className="bg-white border border-[#E6EAF0] hover:border-[#2563EB] rounded-md p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <HeartHandshake className="w-4 h-4 text-[#D97706]" />
                    <h3 className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                      养老服务
                    </h3>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    养老机构、服务能力与养老资源相关数据
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      养老机构
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      床位
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                      服务覆盖
                    </span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-[#EEF2F6] text-xs font-medium text-[#667085]">
                  42 项相关资源
                </div>
              </div>

            </div>
          </section>

          {/* ======================================================= */}
          {/* 模块四：按业务对象发现                                   */}
          {/* ======================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#172033]">
                  按业务对象发现
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  从企业核心业务概念出发，发现与对象相关的数据、指标和服务。
                </p>
              </div>
              <button
                onClick={() => {
                  onNavigateToBusinessObject?.();
                  addToast?.('info', '业务对象', '查看全部业务概念实体与知识模型');
                }}
                className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-medium cursor-pointer"
              >
                <span>查看全部业务对象</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Object 1: 自然人 */}
              <div className="bg-white border border-[#E6EAF0] rounded-md p-4 flex flex-col justify-between space-y-3 shadow-2xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono">
                      BUSINESS OBJECT
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#172033]">
                    自然人
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    人口与公共服务业务中的个人主体。
                  </p>
                  
                  {/* Linked Resource Overview */}
                  <div className="p-2 bg-[#F8FAFC] border border-[#EEF2F6] rounded text-[11px] font-medium text-[#1E293B]">
                    12 数据资产 · 7 指标 · 3 API
                  </div>

                  {/* Relation Tags */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      行政区域
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      家庭
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      服务工单
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EEF2F6]">
                  <button
                    onClick={() => {
                      if (onNavigateToResources) {
                        onNavigateToResources('自然人');
                      }
                      addToast?.('info', '自然人', '载入自然人关联的 12 项数据资产与 7 个指标');
                    }}
                    className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <span>查看相关资源</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Object 2: 服务工单 */}
              <div className="bg-white border border-[#E6EAF0] rounded-md p-4 flex flex-col justify-between space-y-3 shadow-2xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono">
                      BUSINESS OBJECT
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#172033]">
                    服务工单
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    公共服务热线和业务办理过程中产生的服务请求记录。
                  </p>
                  
                  {/* Linked Resource Overview */}
                  <div className="p-2 bg-[#F8FAFC] border border-[#EEF2F6] rounded text-[11px] font-medium text-[#1E293B]">
                    8 数据资产 · 5 指标 · 2 API
                  </div>

                  {/* Relation Tags */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      自然人
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      行政区域
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      服务事项
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EEF2F6]">
                  <button
                    onClick={() => {
                      if (onNavigateToResources) {
                        onNavigateToResources('服务工单');
                      }
                      addToast?.('info', '服务工单', '载入服务工单关联的 8 项数据资产与 5 个指标');
                    }}
                    className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <span>查看相关资源</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Object 3: 行政区域 */}
              <div className="bg-white border border-[#E6EAF0] rounded-md p-4 flex flex-col justify-between space-y-3 shadow-2xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono">
                      BUSINESS OBJECT
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#172033]">
                    行政区域
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    企业业务和公共服务中的标准地域空间对象。
                  </p>
                  
                  {/* Linked Resource Overview */}
                  <div className="p-2 bg-[#F8FAFC] border border-[#EEF2F6] rounded text-[11px] font-medium text-[#1E293B]">
                    16 数据资产 · 6 指标 · 0 API
                  </div>

                  {/* Relation Tags */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      自然人
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      服务工单
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      养老机构
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EEF2F6]">
                  <button
                    onClick={() => {
                      if (onNavigateToResources) {
                        onNavigateToResources('行政区划');
                      }
                      addToast?.('info', '行政区域', '载入行政区域关联的 16 项数据资产与 6 个指标');
                    }}
                    className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <span>查看相关资源</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Object 4: 养老机构 */}
              <div className="bg-white border border-[#E6EAF0] rounded-md p-4 flex flex-col justify-between space-y-3 shadow-2xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono">
                      BUSINESS OBJECT
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#172033]">
                    养老机构
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    提供养老服务与养老资源的机构主体。
                  </p>
                  
                  {/* Linked Resource Overview */}
                  <div className="p-2 bg-[#F8FAFC] border border-[#EEF2F6] rounded text-[11px] font-medium text-[#1E293B]">
                    6 数据资产 · 4 指标 · 2 API
                  </div>

                  {/* Relation Tags */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      行政区域
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      服务能力
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] rounded">
                      床位
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EEF2F6]">
                  <button
                    onClick={() => {
                      if (onNavigateToResources) {
                        onNavigateToResources('养老机构');
                      }
                      addToast?.('info', '养老机构', '载入养老机构关联的 6 项数据资产与 4 个指标');
                    }}
                    className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <span>查看相关资源</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* ======================================================= */}
          {/* 模块五：最近使用 (Compact Rows)                         */}
          {/* ======================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#172033]">
                  最近使用
                </h2>
              </div>
              <button
                onClick={() => addToast?.('info', '最近使用', '查看全部历史访问与调用记录')}
                className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-medium cursor-pointer"
              >
                <span>查看全部</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Compact Rows Table/List */}
            <div className="bg-white border border-[#E6EAF0] rounded-md shadow-2xs divide-y divide-[#EEF2F6] overflow-hidden">
              
              {/* Row 1 */}
              <div className="px-4 py-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shrink-0">
                    <Table className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="font-bold text-xs text-[#172033] hover:text-[#2563EB] cursor-pointer">
                      人口基本信息视图
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono">
                      DATA ASSET
                    </span>
                    <span className="text-xs text-[#667085] hidden md:inline">
                      人口服务 · 自然人
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                    <span>需申请</span>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedResourceDetail({
                        name: '人口基本信息视图',
                        type: 'DATA ASSET',
                        domain: '人口服务 · 自然人',
                        status: '需申请',
                        description: '整合常住人口基础户籍、居住地与行政区划代码，支持安全脱敏查询。',
                        path: 'pop_db.v_citizen_basic_info',
                      });
                    }}
                    className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <span>查看详情</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Row 2 */}
              <div className="px-4 py-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="font-bold text-xs text-[#172033] hover:text-[#2563EB] cursor-pointer">
                      60岁以上人口数
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] rounded font-mono">
                      METRIC
                    </span>
                    <span className="text-xs text-[#667085] hidden md:inline">
                      人口服务 · 正式指标
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0] rounded text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                    <span>可直接使用</span>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedResourceDetail({
                        name: '60岁以上人口数',
                        type: 'METRIC',
                        domain: '人口服务 · 正式指标',
                        status: '可直接使用',
                        description: '统计周期内年龄大于等于60周岁的常住人口总量，支持街镇多维切片。',
                        path: 'metrics.aging_pop_count',
                      });
                    }}
                    className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <span>查看详情</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Row 3 */}
              <div className="px-4 py-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A36A] shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="font-bold text-xs text-[#172033] hover:text-[#2563EB] cursor-pointer">
                      公共服务热线查询 API
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono">
                      DATA API
                    </span>
                    <span className="text-xs text-[#667085] hidden md:inline">
                      公共服务 · 服务工单
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                    <span>需申请</span>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedResourceDetail({
                        name: '公共服务热线查询 API',
                        type: 'DATA API',
                        domain: '公共服务 · 服务工单',
                        status: '需申请',
                        description: '通过工单编号或办理人证件号码查询热线服务办理进度与办结评价。',
                        path: 'https://api.semovix.internal/v1/hotline/query',
                      });
                    }}
                    className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <span>查看详情</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* ========================================================= */}
      {/* RESOURCE DETAIL DRAWER MODAL                              */}
      {/* ========================================================= */}
      {selectedResourceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-2xs">
          <div className="w-[480px] h-full bg-white shadow-2xl flex flex-col border-l border-[#E6EAF0] animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono">
                  {selectedResourceDetail.type}
                </span>
                <h3 className="text-base font-bold text-[#172033] mt-1">
                  {selectedResourceDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResourceDetail(null)}
                className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-[#172033]">业务说明</span>
                <p className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[#334155] leading-relaxed">
                  {selectedResourceDetail.description}
                </p>
              </div>

              <div className="border border-[#E6EAF0] rounded-md divide-y divide-[#EEF2F6] bg-white">
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-[#667085]">所属业务域</span>
                  <span className="font-medium text-[#172033]">
                    {selectedResourceDetail.domain}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-[#667085]">资源定位 / Path</span>
                  <span className="font-mono text-[#2563EB] text-[11px]">
                    {selectedResourceDetail.path}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-[#667085]">可用状态</span>
                  <span className="font-bold text-[#16A36A]">
                    {selectedResourceDetail.status}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md text-xs text-[#1E40AF] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>该资源由 Semovix 语义引擎持续校验，口径真实且已对齐统一业务标准。</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E6EAF0] flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedResourceDetail(null)}
                className="px-3.5 py-1.5 border border-[#E6EAF0] text-[#334155] rounded-md"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setSelectedResourceDetail(null);
                  addToast?.('success', '申请提交', `已提交对「${selectedResourceDetail.name}」的访问申请，预计即刻自动审批`);
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-md"
              >
                发起使用申请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* XINO SMART SEARCH DRAWER                                  */}
      {/* ========================================================= */}
      {isXinoAssistantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-2xs">
          <div className="w-[500px] h-full bg-white shadow-2xl flex flex-col border-l border-[#E6EAF0] animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#FAF5FF]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-md bg-[#7C3AED] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">
                    Xino 智能找数
                  </h3>
                  <p className="text-[11px] text-[#7C3AED]">
                    语义识别 · 方案生成 · 权限协同
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsXinoAssistantOpen(false)}
                className="p-1.5 rounded hover:bg-[#E9D5FF] text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-2">
                <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>你好，我是 Xino。请告诉我你想分析什么业务问题？</span>
                </div>
                <p className="text-[#475569] leading-relaxed">
                  你可以直接输入：例如「我想了解各街镇独居老人与养老床位配比情况，需要哪些数据与指标？」
                </p>
              </div>

              {/* Recommended Quick Intent Prompts */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#667085]">推荐业务场景：</span>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setXinoPromptInput('我想分析各街镇老龄化率与养老服务资源覆盖情况');
                    }}
                    className="w-full text-left p-2 rounded bg-white hover:bg-[#FAF5FF] border border-[#E6EAF0] hover:border-[#D8B4FE] text-[#334155] text-xs transition-colors"
                  >
                    👵 分析各街镇老龄化率与养老服务资源覆盖
                  </button>
                  <button
                    onClick={() => {
                      setXinoPromptInput('我想统计近三年 12345 热线服务工单办结率与满意度');
                    }}
                    className="w-full text-left p-2 rounded bg-white hover:bg-[#FAF5FF] border border-[#E6EAF0] hover:border-[#D8B4FE] text-[#334155] text-xs transition-colors"
                  >
                    📞 统计近三年热线服务工单办结率与满意度
                  </button>
                </div>
              </div>
            </div>

            {/* Prompt Input Box */}
            <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={xinoPromptInput}
                  onChange={(e) => setXinoPromptInput(e.target.value)}
                  placeholder="描述你的业务目标与取数诉求…"
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
                <button
                  onClick={() => {
                    if (!xinoPromptInput.trim()) return;
                    setIsXinoAssistantOpen(false);
                    addToast?.('success', 'Xino 方案已生成', `已为「${xinoPromptInput}」识别出 2 张数据资产表、3 个指标与 1 个 API 组合方案`);
                    setXinoPromptInput('');
                  }}
                  className="absolute right-2 p-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
