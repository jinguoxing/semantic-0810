import React, { useState } from 'react';
import {
  Compass,
  Layers,
  FileCheck,
  Sparkles,
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  MessageSquare,
  Network,
  Users,
  User,
  Globe,
  Share2,
  Calendar,
  Percent,
  Code,
  Copy,
  Check,
  SlidersHorizontal,
  Info,
  Shield,
  ArrowRight,
  Database,
  Building2,
  Table,
  BarChart3,
  CheckCircle
} from 'lucide-react';

export interface MetricDetailWorkspaceProps {
  metricId?: string;
  fromGoalSearch?: boolean;
  goalQuery?: string;
  onBackToResources?: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToDataAssetDetail?: (assetId: string) => void;
  onNavigateToBusinessObject?: (objectId: string) => void;
  onNavigateToApiDetail?: (apiId: string) => void;
  onEnterAnalysis?: (metricName: string) => void;
  onEnterChatQuery?: (metricName: string) => void;
  onExploreRelatedData?: (metricName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MetricDetailWorkspace: React.FC<MetricDetailWorkspaceProps> = ({
  fromGoalSearch = false,
  goalQuery = '分析各街镇老龄化情况',
  onBackToResources,
  onNavigateToDiscovery,
  onNavigateToMyRequests,
  onNavigateToDataAssetDetail,
  onNavigateToBusinessObject,
  onNavigateToApiDetail,
  onEnterAnalysis,
  onEnterChatQuery,
  onExploreRelatedData,
  addToast
}) => {
  // Navigation inside Marketplace Sidebar
  const [activeSideNav, setActiveSideNav] = useState<'discovery' | 'resources' | 'my_requests'>('resources');

  // Access Permission Simulation State for underlying data asset (需申请 vs 可直接使用)
  const [popAssetAccess, setPopAssetAccess] = useState<'granted' | 'requestable'>('requestable');

  // Fitness Warning Simulation State (Normal vs Freshness Warning)
  const [popAssetFitness, setPopAssetFitness] = useState<'normal' | 'freshness_warning'>('normal');

  // Drawers & Modals
  const [isAccessRequestDrawerOpen, setIsAccessRequestDrawerOpen] = useState<boolean>(false);
  const [isTechImplementationDrawerOpen, setIsTechImplementationDrawerOpen] = useState<boolean>(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [isFitnessInfoDrawerOpen, setIsFitnessInfoDrawerOpen] = useState<boolean>(false);

  // Access Request Form State
  const [requestPurpose, setRequestPurpose] = useState<string>('街镇老龄化分析');
  const [requestDuration, setRequestDuration] = useState<string>('90_days');
  const [requestReason, setRequestReason] = useState<string>('用于测算各街镇老龄化率指标与养老服务资源配置评估');

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast?.('success', '已复制到剪贴板', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Submit Access Request
  const handleSubmitAccessRequest = () => {
    setPopAssetAccess('granted');
    setIsAccessRequestDrawerOpen(false);
    addToast?.(
      'success',
      '权限申请已提交并自动审批',
      '已获得「人口基本信息视图」的查询访问权限，老龄化率指标现已具备完整执行条件！'
    );
  };

  // Are all dependencies ready?
  const isAllReady = popAssetAccess === 'granted';

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] font-sans antialiased relative select-none">
      
      {/* ========================================================= */}
      {/* 1. MARKETPLACE SIDEBAR (210–220px)                         */}
      {/* ========================================================= */}
      <aside className="w-[210px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none z-10">
        {/* Sidebar Header Title */}
        <div className="px-5 py-4 border-b border-[#E6EAF0]">
          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
            数据服务超市
          </h2>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="p-3 space-y-1 text-xs">
          {/* 1. 发现 */}
          <button
            onClick={() => {
              if (onNavigateToDiscovery) {
                onNavigateToDiscovery();
              } else {
                setActiveSideNav('discovery');
                addToast?.('info', '发现首页', '切换至数据服务超市发现首页');
              }
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'discovery'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Compass className="w-4 h-4 text-[#64748B]" />
            <span>发现</span>
          </button>

          {/* 2. 资源 (当前高亮) */}
          <button
            onClick={() => {
              setActiveSideNav('resources');
              if (onBackToResources) onBackToResources();
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'resources'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#2563EB]" />
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
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#64748B]" />
            <span>我的申请</span>
          </button>
        </nav>

        {/* Bottom Fixed Lightweight AI Partner Card */}
        <div className="mt-auto p-3 border-t border-[#EEF2F6] bg-white">
          <div className="flex items-center space-x-2.5 text-xs py-1 px-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 fill-white/20" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#94A3B8] leading-tight">AI Partner</div>
              <div className="text-xs font-bold text-[#172033] leading-tight truncate">
                Xino ｜ 犀诺
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN RESOURCE DETAIL AREA (约 72%)                      */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F7F9FC] transition-all">
        
        {/* Conditional Goal Search Context Strip (仅当从 Goal Search 来源时出现) */}
        {fromGoalSearch && (
          <div className="bg-[#EFF6FF] border-b border-[#DBEAFE] px-8 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span className="text-[#1E40AF]">
                与当前目标相关：<strong className="font-semibold text-[#1E40AF]">老龄化率</strong>是衡量街镇人口老龄化程度的正式指标口径。
              </span>
            </div>
            <button
              onClick={onBackToResources}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>返回当前数据方案</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Scrollable Document Container */}
        <div className="p-8 max-w-[1000px] w-full mx-auto space-y-6">
          
          {/* ======================================================= */}
          {/* 2.1 BACK BUTTON & WEAK BREADCRUMB                       */}
          {/* ======================================================= */}
          <div className="space-y-1.5">
            <button
              onClick={onBackToResources}
              className="inline-flex items-center space-x-1.5 text-xs text-[#667085] hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回资源</span>
            </button>

            <div className="flex items-center space-x-1.5 text-xs text-[#98A2B3]">
              <span>数据服务超市</span>
              <span>/</span>
              <span>资源</span>
              <span>/</span>
              <span className="text-[#172033] font-medium">老龄化率</span>
            </div>
          </div>

          {/* ======================================================= */}
          {/* 2.2 METRIC HEADER & OFFICIAL DEFINITION                 */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-lg p-6 shadow-2xs space-y-4">
            
            {/* Title Row + Badges */}
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                  老龄化率
                </h1>
                
                {/* METRIC Badge */}
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                  METRIC
                </span>

                {/* Weak Status Badge */}
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] flex items-center space-x-1">
                  <Check className="w-3 h-3 text-[#16A36A]" />
                  <span>正式指标</span>
                </span>

                {/* Very Weak Technical Identifier */}
                <span className="text-xs font-mono text-[#98A2B3]">
                  aging_rate
                </span>
              </div>
            </div>

            {/* Official Business Definition (Directly Presented) */}
            <p className="text-sm text-[#172033] leading-relaxed font-normal">
              60 周岁及以上常住人口占全部常住人口的比例，用于衡量指定区域和统计期内的人口老龄化程度。
            </p>

            {/* Context & Applicable Scenarios */}
            <div className="space-y-1 pt-1 border-t border-[#F1F5F9]">
              <div className="text-xs text-[#475569] font-medium">
                人口服务 · 自然人
              </div>
              <div className="text-xs text-[#667085]">
                适用于：人口结构分析 · 老龄化趋势分析 · 区域人口对比 · 养老服务规划
              </div>
            </div>

            {/* ===================================================== */}
            {/* 2.3 HEADER FACTS STRIP (Lightweight, No KPI cards)    */}
            {/* ===================================================== */}
            <div className="pt-4 border-t border-[#EEF2F6]">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EEF2F6] bg-[#FAFCFF] p-3.5 rounded-md border border-[#E6EAF0] text-xs">
                
                {/* Fact 1 */}
                <div className="px-3 py-1 space-y-0.5">
                  <div className="text-[11px] text-[#667085]">衡量对象</div>
                  <div className="font-bold text-[#172033]">自然人</div>
                </div>

                {/* Fact 2 */}
                <div className="px-3 py-1 space-y-0.5">
                  <div className="text-[11px] text-[#667085]">指标单位</div>
                  <div className="font-bold text-[#172033]">%</div>
                </div>

                {/* Fact 3 */}
                <div className="px-3 py-1 space-y-0.5">
                  <div className="text-[11px] text-[#667085]">默认粒度</div>
                  <div className="font-bold text-[#172033]">行政区域 × 统计期</div>
                </div>

                {/* Fact 4 */}
                <div className="px-3 py-1 space-y-0.5">
                  <div className="text-[11px] text-[#667085]">当前口径</div>
                  <div className="font-bold text-[#16A36A]">正式生效</div>
                </div>

              </div>
            </div>

          </div>

          {/* ======================================================= */}
          {/* 2.4 SECTION: 指标口径 (Natural Title, No 01)            */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-lg p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                指标口径
              </h2>
              <span className="text-xs text-[#667085]">
                正式业务计算逻辑
              </span>
            </div>

            {/* Formula Expression (Prominent yet restrained) */}
            <div className="p-4 bg-[#FAFCFF] border border-[#D8E2ED] rounded-md text-center">
              <div className="text-xs text-[#667085] font-medium mb-1">
                计算关系公式
              </div>
              <div className="text-sm sm:text-base font-bold text-[#172033] tracking-tight py-1">
                老龄化率 = 60周岁及以上常住人口数 ÷ 全部常住人口数 × 100%
              </div>
            </div>

            {/* Numerator & Denominator Natural Explanation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Numerator (分子) */}
              <div className="p-4 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.5 rounded">
                    分子
                  </span>
                  <span className="text-xs font-bold text-[#172033]">
                    60 周岁及以上常住人口数
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  统计期内年龄达到 60 周岁及以上，且属于常住人口范围的人口数量。
                </p>
              </div>

              {/* Denominator (分母) */}
              <div className="p-4 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded">
                    分母
                  </span>
                  <span className="text-xs font-bold text-[#172033]">
                    全部常住人口数
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  同一统计区域、同一统计期内全部常住人口数量。
                </p>
              </div>

            </div>

            {/* Core Constraints (Inline Facts) */}
            <div className="pt-3 border-t border-[#EEF2F6] flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[#475569]">
                <div>
                  <span className="text-[#667085]">人口范围：</span>
                  <span className="font-semibold text-[#172033]">常住人口</span>
                </div>
                <div>
                  <span className="text-[#667085]">年龄边界：</span>
                  <span className="font-semibold text-[#172033]">60 周岁及以上</span>
                </div>
              </div>

              {/* Weak Action: 查看技术实现 → */}
              <button
                onClick={() => setIsTechImplementationDrawerOpen(true)}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-semibold cursor-pointer flex items-center space-x-1"
              >
                <span>查看技术实现 →</span>
              </button>
            </div>

          </div>

          {/* ======================================================= */}
          {/* 2.5 SECTION: 分析范围 (Natural Title, No 02)            */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-lg p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                分析范围
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                明确该指标在什么分析上下文中成立与支持的下钻层级
              </p>
            </div>

            {/* Two-column clean Definition List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              
              {/* Left Column: 时间与对象 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[11px] text-[#667085]">时间语义</div>
                  <div className="text-xs font-bold text-[#172033]">统计期</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-[#667085]">默认时间粒度</div>
                  <div className="text-xs font-bold text-[#172033]">月 / 年</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-[#667085]">统计对象</div>
                  <div className="text-xs font-bold text-[#172033]">常住人口</div>
                </div>
              </div>

              {/* Right Column: 空间与维度 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[11px] text-[#667085]">默认地域粒度</div>
                  <div className="text-xs font-bold text-[#172033]">行政区域</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-[#667085]">支持地域层级</div>
                  <div className="text-xs font-bold text-[#172033]">区 · 街镇 · 社区</div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] text-[#667085]">支持分析维度</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['性别', '年龄段', '时间'].map((dim) => (
                      <span
                        key={dim}
                        className="px-2 py-0.5 bg-[#F1F5F9] text-[#334155] rounded text-xs font-medium border border-[#E2E8F0]"
                      >
                        {dim}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ======================================================= */}
          {/* 2.6 SECTION: 执行准备 (Natural Title, No 03)            */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-lg p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                执行准备
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                以下资源支撑当前指标的正式计算。
              </p>
            </div>

            {/* Dependency Resource Items (Access vs Fitness strictly separated) */}
            <div className="space-y-3">
              
              {/* Dependency 1: 人口基本信息视图 */}
              <div className="p-4 bg-[#FAFCFF] border border-[#E2E8F0] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1 max-w-[620px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold text-[#172033]">
                      人口基本信息视图
                    </h3>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      DATA ASSET · VIEW
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      角色：<strong className="font-semibold text-[#172033]">核心数据</strong>
                    </span>
                  </div>

                  <div className="text-xs text-[#475569]">
                    提供：<span className="font-medium text-[#172033]">出生日期 · 常住状态 · 行政区域</span>
                  </div>

                  {/* Access & Fitness Status Tags */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                    {/* Access Status */}
                    {popAssetAccess === 'requestable' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded text-[11px] font-medium">
                        <Lock className="w-3 h-3 text-[#D97706]" />
                        <span>需申请查询权限</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] rounded text-[11px] font-medium">
                        <Check className="w-3 h-3 text-[#16A36A]" />
                        <span>可直接使用</span>
                      </span>
                    )}

                    {/* Fitness Status */}
                    {popAssetFitness === 'normal' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] rounded text-[11px] font-medium">
                        <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
                        <span>数据状态正常</span>
                      </span>
                    ) : (
                      <span 
                        onClick={() => setIsFitnessInfoDrawerOpen(true)}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded text-[11px] font-medium cursor-pointer"
                        title="点击查看数据提醒详情"
                      >
                        <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                        <span>存在新鲜度提醒</span>
                      </span>
                    )}

                    <span className="text-[11px] text-[#98A2B3]">
                      每日更新
                    </span>
                  </div>

                  {/* If Fitness Warning active, show consumer guidance directly */}
                  {popAssetFitness === 'freshness_warning' && (
                    <div className="mt-2 p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded text-[11px] text-[#92400E] leading-relaxed">
                      当前指标仍可用于历史和结构分析；如用于当日统计，建议先确认人口数据最新同步状态。
                    </div>
                  )}
                </div>

                {/* Right Action */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      if (onNavigateToDataAssetDetail) {
                        onNavigateToDataAssetDetail('res-02');
                      } else {
                        addToast?.('info', '资产详情', '已进入「人口基本信息视图」资产详情页');
                      }
                    }}
                    className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看 →</span>
                  </button>
                </div>
              </div>

              {/* Dependency 2: 行政区划基础数据 */}
              <div className="p-4 bg-[#FAFCFF] border border-[#E2E8F0] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1 max-w-[620px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold text-[#172033]">
                      行政区划基础数据
                    </h3>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      DATA ASSET
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      角色：<strong className="font-semibold text-[#172033]">分析维度</strong>
                    </span>
                  </div>

                  <div className="text-xs text-[#475569]">
                    提供：<span className="font-medium text-[#172033]">街镇 · 社区 · 标准区域编码</span>
                  </div>

                  {/* Access & Fitness Status Tags */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] rounded text-[11px] font-medium">
                      <Check className="w-3 h-3 text-[#16A36A]" />
                      <span>可直接使用</span>
                    </span>

                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] rounded text-[11px] font-medium">
                      <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
                      <span>数据状态正常</span>
                    </span>

                    <span className="text-[11px] text-[#98A2B3]">
                      半年更新
                    </span>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      if (onNavigateToDataAssetDetail) {
                        onNavigateToDataAssetDetail('res-05');
                      } else {
                        addToast?.('info', '资产详情', '已进入「行政区划基础数据」资产详情页');
                      }
                    }}
                    className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看 →</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Execution Readiness Summary Strip */}
            <div className="pt-3 border-t border-[#EEF2F6] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div className="text-[#334155]">
                {isAllReady ? (
                  <span>指标口径已正式生效；所有底层数据查询权限已就绪，可直接执行分析。</span>
                ) : (
                  <span>指标口径已正式生效；当前还需要获得 <strong className="font-semibold text-[#D97706]">1 项</strong> 底层数据查询权限后即可执行分析。</span>
                )}
              </div>
              <div className="text-[#667085] text-right font-medium">
                {isAllReady ? '2 项已准备 · 0 项需申请' : '1 项已准备 · 1 项需申请'}
              </div>
            </div>

          </div>

          {/* ======================================================= */}
          {/* 2.7 SECTION: 相关资源 (Natural Title, No 04)            */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-lg p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                相关资源
              </h2>
              <button
                onClick={() => {
                  if (onBackToResources) onBackToResources();
                }}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-semibold cursor-pointer flex items-center space-x-1"
              >
                <span>查看全部相关资源 →</span>
              </button>
            </div>

            {/* Compact Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Item 1 */}
              <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#172033]">60岁以上人口数</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EEF2FF] text-[#4F46E5]">
                      METRIC
                    </span>
                  </div>
                  <div className="text-[11px] text-[#667085]">
                    当前指标的核心人口规模指标
                  </div>
                </div>
                <button
                  onClick={() => addToast?.('info', '指标详情', '已进入「60岁以上人口数」指标页面')}
                  className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                >
                  查看 →
                </button>
              </div>

              {/* Item 2 */}
              <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#172033]">常住人口数</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EEF2FF] text-[#4F46E5]">
                      METRIC
                    </span>
                  </div>
                  <div className="text-[11px] text-[#667085]">
                    当前指标计算中的总体人口规模指标
                  </div>
                </div>
                <button
                  onClick={() => addToast?.('info', '指标详情', '已进入「常住人口数」指标页面')}
                  className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                >
                  查看 →
                </button>
              </div>

              {/* Item 3 */}
              <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#172033]">自然人</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#F5F3FF] text-[#7C3AED]">
                      BUSINESS OBJECT
                    </span>
                  </div>
                  <div className="text-[11px] text-[#667085]">
                    当前指标所衡量的核心业务对象
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (onNavigateToBusinessObject) {
                      onNavigateToBusinessObject('obj-01');
                    } else {
                      addToast?.('info', '业务对象', '已切换至「自然人」业务对象主页');
                    }
                  }}
                  className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                >
                  查看 →
                </button>
              </div>

              {/* Item 4 */}
              <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#172033]">人口统计查询 API</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#16A36A]">
                      DATA API
                    </span>
                  </div>
                  <div className="text-[11px] text-[#667085]">
                    提供区域人口统计查询能力
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (onNavigateToApiDetail) {
                      onNavigateToApiDetail('api-01');
                    } else {
                      addToast?.('info', 'API 详情', '已进入「人口统计查询 API」详情页');
                    }
                  }}
                  className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                >
                  查看 →
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. RIGHT USE RAIL (约 28%)                                */}
      {/* ========================================================= */}
      <aside className="w-[300px] bg-white border-l border-[#E6EAF0] flex flex-col shrink-0 overflow-y-auto select-none">
        <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
          
          <div className="space-y-5">
            {/* Rail Title */}
            <div className="border-b border-[#EEF2F6] pb-3">
              <h2 className="text-sm font-bold text-[#172033]">
                使用
              </h2>
            </div>

            {/* Current Execution State */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-[#667085]">
                当前执行
              </div>

              {isAllReady ? (
                <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-md space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#166534]">
                    <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
                    <span>已准备，可开始使用</span>
                  </div>
                  <p className="text-[11px] text-[#15803D] leading-relaxed">
                    底层数据权限与状态正常，可直接用于即时问数与深度分析。
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#B45309]">
                    <Lock className="w-4 h-4 text-[#D97706]" />
                    <span>还需 1 项资源权限</span>
                  </div>
                  <p className="text-[11px] text-[#92400E] leading-relaxed">
                    指标定义可直接查看；执行分析还需要人口基本信息视图的查询权限。
                  </p>
                </div>
              )}
            </div>

            {/* Data Readiness (Fitness) */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-[#667085]">
                数据准备
              </div>

              {popAssetFitness === 'normal' ? (
                <div className="flex items-center space-x-2 text-xs text-[#166534]">
                  <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                  <span>当前无阻断性数据提醒</span>
                </div>
              ) : (
                <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded text-[11px] text-[#92400E] space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                    <span>存在数据提醒</span>
                  </div>
                  <p className="leading-relaxed">
                    实时分析前建议确认底层数据最新同步状态。
                  </p>
                </div>
              )}
            </div>

            {/* Maintenance Team */}
            <div className="space-y-1.5 pt-2 border-t border-[#EEF2F6]">
              <div className="text-[11px] text-[#667085]">维护团队</div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#172033]">人口业务治理团队</span>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer"
                >
                  联系团队 →
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Primary Actions */}
          <div className="space-y-2.5 pt-4 border-t border-[#EEF2F6]">
            {!isAllReady ? (
              <>
                {/* Primary Button: 申请所需资源并使用 */}
                <button
                  onClick={() => setIsAccessRequestDrawerOpen(true)}
                  className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-bold rounded-md shadow-2xs transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>申请所需资源并使用</span>
                </button>

                {/* Secondary Action: 查看所需资源 */}
                <button
                  onClick={() => {
                    const el = document.querySelector('h2:has-text("执行准备")') || document.body;
                    el.scrollIntoView({ behavior: 'smooth' });
                    addToast?.('info', '执行准备', '已定位至底层所需数据资源列表');
                  }}
                  className="w-full py-2 px-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#D0D5DD] font-semibold rounded-md transition-all cursor-pointer text-xs"
                >
                  查看所需资源
                </button>

                {/* Weak Link */}
                <button
                  onClick={() => {
                    if (onExploreRelatedData) {
                      onExploreRelatedData('老龄化率');
                    } else if (onBackToResources) {
                      onBackToResources();
                    }
                  }}
                  className="w-full text-center text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-medium pt-1 cursor-pointer block"
                >
                  围绕此指标找数据 →
                </button>
              </>
            ) : (
              <>
                {/* Ready State - Primary Button: 进入分析 */}
                <button
                  onClick={() => {
                    if (onEnterAnalysis) {
                      onEnterAnalysis('老龄化率');
                    } else {
                      addToast?.('success', '进入分析沙箱', '已载入老龄化率指标与街镇/时间分析维度');
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-bold rounded-md shadow-2xs transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>进入分析</span>
                </button>

                {/* Ready State - Secondary Button: 用于问数 */}
                <button
                  onClick={() => {
                    if (onEnterChatQuery) {
                      onEnterChatQuery('老龄化率');
                    } else {
                      addToast?.('info', 'Xino 语义问数', '已将「老龄化率」作为当前问数主语');
                    }
                  }}
                  className="w-full py-2 px-4 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] font-semibold rounded-md transition-all cursor-pointer text-xs flex items-center justify-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>用于问数</span>
                </button>

                {/* Weak Link */}
                <button
                  onClick={() => {
                    if (onBackToResources) onBackToResources();
                  }}
                  className="w-full text-center text-xs text-[#667085] hover:text-[#2563EB] hover:underline font-medium pt-1 cursor-pointer block"
                >
                  查看相关资源 →
                </button>
              </>
            )}
          </div>

        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. MODALS & SLIDE-OVER DRAWERS                            */}
      {/* ========================================================= */}

      {/* 4.1 ACCESS REQUEST DRAWER (申请使用人口基本信息视图) */}
      {isAccessRequestDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[480px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-[#EEF2F6] bg-[#FAFCFF] flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  数据权限申请
                </div>
                <h3 className="text-base font-bold text-[#172033]">
                  申请使用人口基本信息视图
                </h3>
              </div>
              <button
                onClick={() => setIsAccessRequestDrawerOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              
              {/* Context Summary Box */}
              <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1.5 text-[#1E40AF]">
                <div className="font-bold flex items-center space-x-1.5 text-xs">
                  <Info className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>申请来源上下文</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#1D4ED8]">
                  为执行指标「<strong className="font-semibold">老龄化率</strong>」提供出生日期、常住状态与行政区域等核心计算字段。
                </p>
              </div>

              {/* Field 1: 申请对象 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#667085]">申请数据资源</label>
                <input
                  type="text"
                  disabled
                  value="人口基本信息视图 (dwd_population.pop_base_info_view)"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#334155] font-mono cursor-not-allowed"
                />
              </div>

              {/* Field 2: 使用用途 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#667085]">分析目的 / 业务场景</label>
                <input
                  type="text"
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-xs focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              {/* Field 3: 授权期限 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#667085]">期望授权期限</label>
                <select
                  value={requestDuration}
                  onChange={(e) => setRequestDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-xs focus:outline-hidden focus:border-[#2563EB] bg-white"
                >
                  <option value="30_days">30 天（临时统计分析）</option>
                  <option value="90_days">90 天（季度常规运营）</option>
                  <option value="365_days">1 年（年度规划及报表）</option>
                  <option value="permanent">长期有效（业务系统常态消费）</option>
                </select>
              </div>

              {/* Field 4: 申请说明 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#667085]">申请原因与说明</label>
                <textarea
                  rows={3}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-xs focus:outline-hidden focus:border-[#2563EB] leading-relaxed"
                />
              </div>

              {/* Fast Approval Note */}
              <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded text-[11px] text-[#667085] leading-relaxed">
                提示：当前资源属于「内部低敏数据 (L2)」，由系统策略自动核验用途，提交后通常在 1 分钟内完成授权。
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsAccessRequestDrawerOpen(false)}
                className="px-4 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-semibold rounded-md transition-colors cursor-pointer text-xs"
              >
                取消
              </button>
              <button
                onClick={handleSubmitAccessRequest}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-md transition-colors cursor-pointer text-xs shadow-2xs"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.2 TECHNICAL IMPLEMENTATION DRAWER (查看技术实现) */}
      {isTechImplementationDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[540px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-[#EEF2F6] bg-[#FAFCFF] flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  技术实现与编译逻辑
                </div>
                <h3 className="text-base font-bold text-[#172033]">
                  老龄化率 · 底层语义编译
                </h3>
              </div>
              <button
                onClick={() => setIsTechImplementationDrawerOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* StarRocks / ClickHouse SQL Pattern */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#667085]">
                  <span>标准 SQL 编译模式</span>
                  <button
                    onClick={() => handleCopyText(
`SELECT 
  region_code,
  street_code,
  stat_date,
  COUNT(CASE WHEN age >= 60 AND resident_status = 1 THEN person_id END) AS elderly_pop_count,
  COUNT(CASE WHEN resident_status = 1 THEN person_id END) AS permanent_pop_count,
  ROUND(
    COUNT(CASE WHEN age >= 60 AND resident_status = 1 THEN person_id END) * 100.0 / 
    NULLIF(COUNT(CASE WHEN resident_status = 1 THEN person_id END), 0),
    2
  ) AS aging_rate_pct
FROM dwd_population.pop_base_info_view
GROUP BY region_code, street_code, stat_date;`,
                      'sql'
                    )}
                    className="text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === 'sql' ? '已复制' : '复制代码'}</span>
                  </button>
                </div>
                <div className="p-3 bg-[#0F172A] text-[#38BDF8] font-mono text-[11px] rounded-md overflow-x-auto leading-relaxed border border-[#334155]">
                  <pre>{`SELECT 
  region_code,
  street_code,
  stat_date,
  COUNT(CASE WHEN age >= 60 AND resident_status = 1 THEN person_id END) AS elderly_pop_count,
  COUNT(CASE WHEN resident_status = 1 THEN person_id END) AS permanent_pop_count,
  ROUND(
    COUNT(CASE WHEN age >= 60 AND resident_status = 1 THEN person_id END) * 100.0 / 
    NULLIF(COUNT(CASE WHEN resident_status = 1 THEN person_id END), 0),
    2
  ) AS aging_rate_pct
FROM dwd_population.pop_base_info_view
GROUP BY region_code, street_code, stat_date;`}</pre>
                </div>
              </div>

              {/* Binding Information */}
              <div className="p-4 border border-[#E2E8F0] rounded-md bg-[#FAFCFF] space-y-2">
                <div className="font-bold text-[#172033] text-xs">
                  物理资产绑定拓扑
                </div>
                <div className="space-y-1 text-xs text-[#475569]">
                  <div>数据源：<span className="font-mono text-[#0F172A]">StarRocks Production Cluster (OLAP)</span></div>
                  <div>物理表：<span className="font-mono text-[#0F172A]">dwd_population.pop_base_info_view</span></div>
                  <div>分区键：<span className="font-mono text-[#0F172A]">stat_date (Day partition)</span></div>
                </div>
              </div>

              {/* Note */}
              <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded text-[11px] text-[#166534] leading-relaxed">
                本技术实现由 Semovix 语义引擎自动维系与下推，上层问数与分析沙箱无需编写任何 SQL 即可直接获取标准计算结果。
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex justify-end">
              <button
                onClick={() => setIsTechImplementationDrawerOpen(false)}
                className="px-4 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-semibold rounded-md transition-colors cursor-pointer text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.3 CONTACT TEAM MODAL (联系团队) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs transition-opacity p-4 animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[420px] bg-white rounded-lg shadow-2xl border border-[#E6EAF0] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#EEF2F6] bg-[#FAFCFF] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172033]">
                联系指标维护团队
              </h3>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-[#334155]">
              <div className="space-y-1">
                <div className="text-[11px] text-[#667085]">责任团队</div>
                <div className="font-bold text-[#172033] text-sm">人口业务治理团队</div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-[#667085]">业务接口人</div>
                <div className="font-medium text-[#172033]">张敏（人口规划与民政处）</div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-[#667085]">企业协同通道</div>
                <div className="font-medium text-[#2563EB]">#population-metrics-governance</div>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded text-[11px] text-[#667085] leading-relaxed">
                如对该指标的统计口径、年龄边界（如 60 岁 vs 65 岁口径）或适用范围有疑问，可直接在内部协同群发起讨论。
              </div>
            </div>

            <div className="p-3.5 border-t border-[#EEF2F6] bg-[#FAFCFF] flex justify-end">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-md text-xs cursor-pointer shadow-2xs"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
