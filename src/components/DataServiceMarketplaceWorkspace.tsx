import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  Database,
  BarChart3,
  Globe,
  FolderTree,
  Building2,
  Users,
  Workflow,
  Sparkles,
  Layers,
  HeartHandshake,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export interface SemanticFilter {
  type: 'domain' | 'object';
  name: string;
}

export interface DataServiceMarketplaceWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToResources?: (query?: string, resourceTypeFilter?: string, semanticFilter?: SemanticFilter) => void;
  onNavigateToDataAssetDetail?: (assetId: string) => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToBusinessObjectDetail?: (objectId: string) => void;
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
  onNavigateToDataAssetDetail,
  onNavigateToMetricDetail,
  onNavigateToBusinessObjectDetail,
  onNavigateToMyRequests,
  onNavigateToMetrics,
  onNavigateToBusinessObject,
  onNavigateToDataAssets,
  onNavigateToDataStandards,
  onNavigateToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 识别是否是业务目标查询（自然语言提问/业务方案诉求）
  const isExplicitGoalQuery = (query: string) => {
    const q = query.trim();
    if (!q) return false;
    const explicitGoalMarkers = [
      '我想分析', '想分析', '需要哪些数据', '如何分析', '如何评估',
      '怎么分析', '需要什么数据', '分析方案', '构建方案', '我想了解',
      '老龄化', '经营分析', '热线工单'
    ];
    return explicitGoalMarkers.some(marker => q.includes(marker)) || 
           ((q.includes('分析') || q.includes('评估') || q.includes('统计')) && q.length >= 6);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      if (onNavigateToResources) {
        onNavigateToResources('');
      } else {
        addToast?.('info', '浏览全部资源', '正在载入当前可发现范围内的全部数据与语义资源');
      }
      return;
    }

    if (isExplicitGoalQuery(q)) {
      onNavigateToResources?.(q);
      addToast?.('success', '目标意图识别', `已识别业务诉求「${q}」，正在构建专属数据资源方案`);
    } else {
      onNavigateToResources?.(q);
      addToast?.('info', '精准检索', `已进入资源检索模式，搜索「${q}」`);
    }
  };

  const handleQuickQueryClick = (query: string) => {
    setSearchQuery(query);
    onNavigateToResources?.(query);
    addToast?.('success', '目标方案推荐', `已载入「${query}」所需的可信数据与语义资源`);
  };

  return (
    <div className="flex-1 min-h-0 w-full bg-[#F8FAFC] overflow-y-auto py-8 pb-20 px-6 lg:px-12 flex flex-col justify-start items-center text-[#0F172A] font-sans antialiased">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col">
        
        {/* ========================================================= */}
        {/* 一、HERO 区域 (紧凑型 42-48px 顶部留白，标题 34-38px)          */}
        {/* ========================================================= */}
        <section className="text-center pt-2 pb-1 max-w-[880px] mx-auto">
          <h1 className="text-[34px] md:text-[36px] font-bold text-[#0F172A] tracking-tight leading-tight">
            找到业务需要的可信数据
          </h1>
          <p className="text-sm text-[#64748B] mt-2.5 leading-relaxed font-normal">
            搜索企业数据资源，或直接告诉 Xino 你想解决什么业务问题。
          </p>
        </section>

        {/* ========================================================= */}
        {/* 二、统一 DISCOVERY SEARCH (宽 1020-1120px，高 56px)         */}
        {/* ========================================================= */}
        <section className="w-full max-w-[1080px] mx-auto mt-6">
          <form
            onSubmit={handleSearchSubmit}
            className="h-[56px] bg-white border border-[#CBD5E1] hover:border-[#94A3B8] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 rounded-xl shadow-xs flex items-center px-4 transition-all"
          >
            <Search className="w-5 h-5 text-[#94A3B8] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索数据资源，或告诉 Xino 你想解决什么业务问题…"
              className="w-full h-full bg-transparent px-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
            />
            {/* 内部轻量能力提示: ✦ Xino */}
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] text-xs font-medium shrink-0 mr-3 select-none">
              <span className="text-[#2563EB] font-bold">✦</span>
              <span>Xino</span>
            </div>
            {/* 搜索资源 主按钮 */}
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-semibold transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center space-x-1.5"
            >
              <span>搜索资源</span>
            </button>
          </form>

          {/* ======================================================= */}
          {/* 三、SUGGESTED QUERIES (试试：4个轻量 Query Chip)          */}
          {/* ======================================================= */}
          <div className="mt-3.5 flex items-center flex-wrap gap-2 text-xs text-[#64748B] px-1">
            <span className="font-medium text-[#64748B]">试试：</span>
            <button
              type="button"
              onClick={() => handleQuickQueryClick('分析区域老龄化情况')}
              className="px-3 py-1 rounded-md bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] text-xs transition-all cursor-pointer"
            >
              分析区域老龄化情况
            </button>
            <button
              type="button"
              onClick={() => handleQuickQueryClick('查找人口基础数据')}
              className="px-3 py-1 rounded-md bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] text-xs transition-all cursor-pointer"
            >
              查找人口基础数据
            </button>
            <button
              type="button"
              onClick={() => handleQuickQueryClick('公共服务热线工单')}
              className="px-3 py-1 rounded-md bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] text-xs transition-all cursor-pointer"
            >
              公共服务热线工单
            </button>
            <button
              type="button"
              onClick={() => handleQuickQueryClick('企业经营分析')}
              className="px-3 py-1 rounded-md bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] text-xs transition-all cursor-pointer"
            >
              企业经营分析
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 四、推荐资源 PREVIEW (严格 3 项 Compact Rich Resource Rows) */}
        {/* ========================================================= */}
        <section className="mt-8">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              推荐资源
            </h2>
            <button
              onClick={() => onNavigateToResources?.('')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center space-x-1 cursor-pointer transition-colors group"
            >
              <span>浏览全部资源</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden divide-y divide-[#E2E8F0] mt-3 shadow-2xs">
            
            {/* 推荐资源 1: 人口基本信息视图 */}
            <div className="p-4 md:px-5 md:py-4 hover:bg-[#F8FAFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group">
              <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                <div className="w-[34px] h-[34px] rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span 
                      onClick={() => onNavigateToDataAssetDetail ? onNavigateToDataAssetDetail('res-02') : onNavigateToResources?.('人口基本信息视图')}
                      className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors cursor-pointer"
                    >
                      人口基本信息视图
                    </span>
                    <span className="px-1.5 py-0.2 text-[11px] font-semibold rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      数据资产
                    </span>
                    <span className="px-1.5 py-0.2 text-[11px] font-medium rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                      正式资源
                    </span>
                    <span className="text-xs text-[#64748B] font-medium">
                      人口服务 · 自然人
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    覆盖居民基础属性、年龄、户籍、常住状态与行政区划等人口分析基础信息。
                  </p>
                  <div className="text-[11px] text-[#64748B] mt-1 flex items-center space-x-1.5">
                    <span className="text-[#94A3B8]">适用于：</span>
                    <span>人口结构分析 · 老龄化分析 · 区域人口统计</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0 md:self-center pl-12 md:pl-0">
                <span className="text-xs font-semibold text-[#D97706] bg-[#FFFBEB] px-2.5 py-1 rounded-md border border-[#FDE68A] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                  <span>可申请使用</span>
                </span>
                <button
                  onClick={() => onNavigateToDataAssetDetail ? onNavigateToDataAssetDetail('res-02') : onNavigateToResources?.('人口基本信息视图')}
                  className="px-3 py-1.5 rounded-md border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] hover:border-[#2563EB] flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>查看资源</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              </div>
            </div>

            {/* 推荐资源 2: 老龄化率 */}
            <div className="p-4 md:px-5 md:py-4 hover:bg-[#F8FAFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group">
              <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                <div className="w-[34px] h-[34px] rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span 
                      onClick={() => onNavigateToMetricDetail ? onNavigateToMetricDetail('res-03') : onNavigateToMetrics?.()}
                      className="text-sm font-bold text-[#0F172A] group-hover:text-[#7C3AED] transition-colors cursor-pointer"
                    >
                      老龄化率
                    </span>
                    <span className="px-1.5 py-0.2 text-[11px] font-semibold rounded bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                      指标
                    </span>
                    <span className="px-1.5 py-0.2 text-[11px] font-medium rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                      正式指标
                    </span>
                    <span className="text-xs text-[#64748B] font-medium">
                      人口服务 · 人口统计
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。
                  </p>
                  <div className="text-[11px] text-[#64748B] mt-1 flex items-center space-x-1.5">
                    <span className="text-[#94A3B8]">支持：</span>
                    <span>行政区划 · 年龄 · 时间</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0 md:self-center pl-12 md:pl-0">
                <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-md border border-[#A7F3D0] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  <span>可直接使用</span>
                </span>
                <button
                  onClick={() => onNavigateToMetricDetail ? onNavigateToMetricDetail('res-03') : onNavigateToMetrics?.()}
                  className="px-3 py-1.5 rounded-md border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] hover:text-[#7C3AED] hover:border-[#7C3AED] flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>查看指标</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              </div>
            </div>

            {/* 推荐资源 3: 养老机构服务能力 */}
            <div className="p-4 md:px-5 md:py-4 hover:bg-[#F8FAFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group">
              <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                <div className="w-[34px] h-[34px] rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span 
                      onClick={() => onNavigateToDataAssetDetail ? onNavigateToDataAssetDetail('res-04') : onNavigateToResources?.('养老机构服务能力')}
                      className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors cursor-pointer"
                    >
                      养老机构服务能力
                    </span>
                    <span className="px-1.5 py-0.2 text-[11px] font-semibold rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      数据资产
                    </span>
                    <span className="text-xs text-[#64748B] font-medium">
                      养老服务 · 养老机构
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    覆盖养老机构、床位、服务能力和区域覆盖等核心业务信息。
                  </p>
                  <div className="text-[11px] text-[#64748B] mt-1 flex items-center space-x-1.5">
                    <span className="text-[#94A3B8]">适用于：</span>
                    <span>养老资源盘点 · 机构覆盖分析</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0 md:self-center pl-12 md:pl-0">
                <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-md border border-[#A7F3D0] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  <span>可直接使用</span>
                </span>
                <button
                  onClick={() => onNavigateToDataAssetDetail ? onNavigateToDataAssetDetail('res-04') : onNavigateToResources?.('养老机构服务能力')}
                  className="px-3 py-1.5 rounded-md border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] hover:border-[#2563EB] flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>查看资源</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 五、探索更多 (三栏布局 25% : 48% : 27%)                   */}
        {/* ========================================================= */}
        <section className="mt-8 pb-10">
          <div className="pb-2.5 border-b border-[#E2E8F0] mb-3">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              探索更多
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            
            {/* 第一栏：按资源类型 (~25% -> lg:col-span-3) */}
            <div className="lg:col-span-3 bg-white rounded-lg border border-[#E2E8F0] p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2.5 pb-1.5 border-b border-[#F1F5F9] flex items-center justify-between">
                  <span>按资源类型</span>
                  <span className="text-[10px] text-[#94A3B8] font-normal">分类浏览</span>
                </div>

                <div className="space-y-1">
                  {/* 数据资产 */}
                  <div
                    onClick={() => onNavigateToResources?.('', 'DATA_ASSET')}
                    className="p-2 rounded-md hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-[28px] h-[28px] rounded-md bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                          数据资产
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          业务表、视图与数据集
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>

                  {/* 指标 */}
                  <div
                    onClick={() => onNavigateToResources?.('', 'METRIC')}
                    className="p-2 rounded-md hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-[28px] h-[28px] rounded-md bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] shrink-0">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#7C3AED] transition-colors truncate">
                          指标
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          企业正式统计指标
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8] group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>

                  {/* 数据 API */}
                  <div
                    onClick={() => onNavigateToResources?.('', 'DATA_API')}
                    className="p-2 rounded-md hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-[28px] h-[28px] rounded-md bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] shrink-0">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#16A34A] transition-colors truncate">
                          数据 API
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          API 与数据服务
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8] group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>

                  {/* 业务对象 */}
                  <div
                    onClick={() => onNavigateToResources?.('', 'BUSINESS_OBJECT')}
                    className="p-2 rounded-md hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-[28px] h-[28px] rounded-md bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0">
                        <FolderTree className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors truncate">
                          业务对象
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          企业核心业务实体
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8] group-hover:text-[#D97706] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* 第二栏：按业务语义发现 (~48% -> lg:col-span-6) */}
            <div className="lg:col-span-6 bg-white rounded-lg border border-[#E2E8F0] p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2.5 pb-1.5 border-b border-[#F1F5F9] flex items-center justify-between">
                  <span>按业务语义发现</span>
                  <span className="text-[10px] text-[#64748B] font-normal">语义上下文与概念探索</span>
                </div>

                {/* 子区域 1: 业务领域 */}
                <div>
                  <div className="text-[11px] font-semibold text-[#64748B] mb-2 flex items-center space-x-1">
                    <span>业务领域</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToResources?.('', undefined, { type: 'domain', name: '人口服务' })}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-left flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        人口服务
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        128 资源
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToResources?.('', undefined, { type: 'domain', name: '公共服务' })}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-left flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        公共服务
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        96 资源
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToResources?.('', undefined, { type: 'domain', name: '企业服务' })}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-left flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        企业服务
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        84 资源
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToResources?.('', undefined, { type: 'domain', name: '养老服务' })}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-left flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        养老服务
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        42 资源
                      </span>
                    </button>
                  </div>
                </div>

                {/* 细分隔线 */}
                <div className="border-t border-[#F1F5F9] my-2.5" />

                {/* 子区域 2: 业务对象 */}
                <div>
                  <div className="text-[11px] font-semibold text-[#64748B] mb-2 flex items-center space-x-1">
                    <span>业务对象</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToBusinessObjectDetail ? onNavigateToBusinessObjectDetail('bo_person') : onNavigateToResources?.('', undefined, { type: 'object', name: '自然人' })}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-left flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        自然人
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        122 资源
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToResources?.('', undefined, { type: 'object', name: '行政区域' })}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-left flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        行政区域
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        16 资源
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToResources?.('', undefined, { type: 'object', name: '服务工单' })}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-left flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        服务工单
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        28 资源
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToResources?.('', undefined, { type: 'object', name: '养老机构' })}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-left flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        养老机构
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        6 资源
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 第三栏：继续使用 (~27% -> lg:col-span-3) */}
            <div className="lg:col-span-3 bg-white rounded-lg border border-[#E2E8F0] p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2.5 pb-1.5 border-b border-[#F1F5F9] flex items-center justify-between">
                  <span>继续使用</span>
                  <button
                    type="button"
                    onClick={() => onNavigateToMyRequests?.()}
                    className="text-[11px] font-normal text-[#64748B] hover:text-[#2563EB] cursor-pointer transition-colors"
                  >
                    查看全部最近使用 →
                  </button>
                </div>

                <div className="space-y-1.5">
                  {/* 人口基本信息视图 */}
                  <div
                    onClick={() => onNavigateToDataAssetDetail ? onNavigateToDataAssetDetail('res-02') : onNavigateToResources?.('人口基本信息视图')}
                    className="p-2 rounded-md hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-[28px] h-[28px] rounded-md bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                          人口基本信息视图
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          数据资产 · 10 分钟前
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>

                  {/* 老龄化率 */}
                  <div
                    onClick={() => onNavigateToMetricDetail ? onNavigateToMetricDetail('res-03') : onNavigateToMetrics?.()}
                    className="p-2 rounded-md hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-[28px] h-[28px] rounded-md bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] shrink-0">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#7C3AED] transition-colors truncate">
                          老龄化率
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          指标 · 1 小时前
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8] group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>

                  {/* 养老机构服务接口 */}
                  <div
                    onClick={() => onNavigateToResources?.('养老机构服务接口', 'DATA_API')}
                    className="p-2 rounded-md hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-[28px] h-[28px] rounded-md bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] shrink-0">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#16A34A] transition-colors truncate">
                          养老机构服务接口
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          数据 API · 昨天
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8] group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};
