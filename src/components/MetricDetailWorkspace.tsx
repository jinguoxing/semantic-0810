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
  CheckCircle,
  Calculator,
  Workflow
} from 'lucide-react';
import { SingleResourceAccessRequestDrawer } from './SingleResourceAccessRequestDrawer';

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

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(label);
    addToast?.('success', '已复制到剪贴板', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Are all dependencies ready?
  const isAllReady = popAssetAccess === 'granted';

  return (
    <div className="flex-1 flex overflow-hidden bg-white text-[#0F172A] font-sans antialiased relative selection:bg-[#EFF6FF] selection:text-[#2563EB]">
      
      {/* ========================================================= */}
      {/* 1. MARKETPLACE SIDEBAR (210px)                            */}
      {/* ========================================================= */}
      <aside className="w-[210px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 select-none z-10">
        {/* Sidebar Header Title */}
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
            数据服务超市
          </h2>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="p-3 space-y-1 text-xs">
          {/* 1. 发现 */}
          <button
            onClick={() => {
              setActiveSideNav('discovery');
              onNavigateToDiscovery?.();
            }}
            className={`w-full px-3 py-2 rounded flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
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
              onBackToResources?.();
            }}
            className={`w-full px-3 py-2 rounded flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'resources'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>资源</span>
          </button>

          {/* 3. 我的申请 */}
          <button
            onClick={() => {
              setActiveSideNav('my_requests');
              onNavigateToMyRequests?.();
            }}
            className={`w-full px-3 py-2 rounded flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'my_requests'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#64748B]" />
            <span>我的申请</span>
          </button>
        </nav>

        {/* Bottom Fixed AI Partner Card */}
        <div className="mt-auto p-3 border-t border-[#E2E8F0] bg-white">
          <div className="flex items-center space-x-2.5 text-xs py-1 px-1">
            <div className="w-6 h-6 rounded bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 fill-white/20" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#94A3B8] leading-tight">AI Partner</div>
              <div className="text-xs font-bold text-[#0F172A] leading-tight truncate">
                Xino ｜ 犀诺
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. CONTINUOUS MAIN CONTENT AREA (Flat Entity Detail)       */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-white transition-all">

        {/* Conditional Goal Search Context Strip */}
        {fromGoalSearch && (
          <div className="bg-[#EFF6FF] border-b border-[#DBEAFE] px-8 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span className="text-[#1E40AF]">
                与当前目标「{goalQuery}」相关：<strong className="font-semibold text-[#1E40AF]">老龄化率</strong> 是衡量各街镇人口老龄化程度的正式指标口径。
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

        {/* Flat Continuous Document Canvas */}
        <div className="max-w-[1040px] w-full mx-auto px-8 py-7 space-y-7">

          {/* ======================================================= */}
          {/* I. BREADCRUMB & BACK ACTION                             */}
          {/* ======================================================= */}
          <div className="space-y-2">
            <div className="text-xs text-[#64748B] flex items-center space-x-2">
              <span
                onClick={onNavigateToDiscovery}
                className="hover:text-[#2563EB] cursor-pointer"
              >
                数据服务超市
              </span>
              <span>/</span>
              <span
                onClick={onBackToResources}
                className="hover:text-[#2563EB] cursor-pointer"
              >
                资源
              </span>
              <span>/</span>
              <span className="text-[#0F172A] font-semibold">老龄化率</span>
            </div>

            <button
              onClick={onBackToResources}
              className="inline-flex items-center space-x-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回资源</span>
            </button>
          </div>

          {/* ======================================================= */}
          {/* II. FLAT ENTITY HEADER (No Hero Card)                    */}
          {/* ======================================================= */}
          <div className="space-y-3.5">
            {/* Title Line */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                老龄化率
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-semibold">
                METRIC
              </span>
              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-medium">
                正式指标
              </span>
            </div>

            <div className="text-xs text-[#64748B] font-mono">
              aging_rate
            </div>

            {/* Formal Business Definition Paragraph */}
            <p className="text-sm text-[#334155] leading-relaxed">
              60 周岁及以上常住人口占全部常住人口的比例，用于衡量指定区域和统计期内的人口老龄化程度。
            </p>

            {/* Business Context & Tags */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs pt-1">
              <div className="flex items-center space-x-1.5 text-[#475569]">
                <span className="text-[#64748B]">主业务域：</span>
                <span className="text-[#0F172A] font-medium">人口服务 · 自然人</span>
              </div>

              <div className="flex items-center space-x-1.5 text-[#475569]">
                <span className="text-[#64748B]">适用场景：</span>
                <span className="text-[#0F172A] font-medium">
                  人口结构分析 · 老龄化趋势分析 · 区域人口对比 · 养老服务规划
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* III. CORE FACTS (横向事实带，不做四张统计卡)             */}
          {/* ======================================================= */}
          <div className="flex flex-wrap items-center justify-between py-3 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs gap-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">衡量对象：</span>
              <span className="font-bold text-[#0F172A]">自然人 (Person)</span>
            </div>

            <div className="h-3.5 w-px bg-[#CBD5E1] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">指标单位：</span>
              <span className="font-bold text-[#0F172A]">%</span>
            </div>

            <div className="h-3.5 w-px bg-[#CBD5E1] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">默认粒度：</span>
              <span className="font-bold text-[#0F172A]">行政区域 × 统计期</span>
            </div>

            <div className="h-3.5 w-px bg-[#CBD5E1] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">口径状态：</span>
              <span className="font-bold text-[#0F172A] flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span>正式生效</span>
              </span>
            </div>
          </div>

          {/* ======================================================= */}
          {/* IV. 指标口径 (Metric Formula & Business Definition)        */}
          {/* ======================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-[#2563EB]" />
                  <span>指标口径</span>
                </h2>
                <p className="text-xs text-[#64748B]">
                  正式业务计算逻辑与分子分母定义
                </p>
              </div>

              <button
                onClick={() => setIsTechImplementationDrawerOpen(true)}
                className="inline-flex items-center space-x-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold cursor-pointer transition-colors"
              >
                <span>查看技术实现</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Formula Expression Box */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-center">
              <div className="text-[11px] text-[#64748B] font-medium mb-0.5">
                计算关系公式
              </div>
              <div className="text-sm font-bold text-[#0F172A] tracking-tight font-mono">
                老龄化率 = 60周岁及以上常住人口数 ÷ 全部常住人口数 × 100%
              </div>
            </div>

            {/* Numerator & Denominator Definition Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Numerator */}
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    分子
                  </span>
                  <span className="font-bold text-[#0F172A]">
                    60 周岁及以上常住人口数
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  统计期内年龄达到 60 周岁及以上，且属于常住人口范围的人口数量。
                </p>
              </div>

              {/* Denominator */}
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                    分母
                  </span>
                  <span className="font-bold text-[#0F172A]">
                    全部常住人口数
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  同一统计区域、同一统计期内全部常住人口数量。
                </p>
              </div>
            </div>

            {/* Core Constraints */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#475569]">
              <div>
                <span className="text-[#64748B]">人口范围：</span>
                <span className="font-semibold text-[#0F172A]">常住人口</span>
              </div>
              <div>
                <span className="text-[#64748B]">年龄边界：</span>
                <span className="font-semibold text-[#0F172A]">60 周岁及以上</span>
              </div>
            </div>
          </section>

          {/* ======================================================= */}
          {/* V. 分析范围 (Analysis Scope & Dimensions)                 */}
          {/* ======================================================= */}
          <section className="space-y-3">
            <div className="space-y-0.5 pb-2 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
                <span>分析范围</span>
              </h2>
              <p className="text-xs text-[#64748B]">
                明确该指标在什么分析上下文中成立与支持的下钻层级
              </p>
            </div>

            {/* Two-Column Definition Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
              {/* Left Column: 时间与对象 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">时间语义</span>
                  <span className="font-bold text-[#0F172A]">统计期</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">默认时间粒度</span>
                  <span className="font-bold text-[#0F172A]">月 / 年</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">统计对象</span>
                  <span className="font-bold text-[#0F172A]">常住人口</span>
                </div>
              </div>

              {/* Right Column: 空间与维度 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">默认地域粒度</span>
                  <span className="font-bold text-[#0F172A]">行政区域</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">支持地域层级</span>
                  <span className="font-bold text-[#0F172A]">区 · 街镇 · 社区</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">支持分析维度</span>
                  <span className="font-bold text-[#0F172A]">性别 · 年龄段 · 时间</span>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================= */}
          {/* VI. 执行准备 (Underlying Data & Execution Readiness)       */}
          {/* ======================================================= */}
          <section id="section-execution-readiness" className="space-y-3">
            <div className="space-y-0.5 pb-2 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                <Database className="w-4 h-4 text-[#2563EB]" />
                <span>执行准备</span>
              </h2>
              <p className="text-xs text-[#64748B]">
                支撑当前指标正式计算的底层数据资产及其访问与可用状态
              </p>
            </div>

            {/* Dependency Items Table / Flat Rows */}
            <div className="border border-[#E2E8F0] rounded divide-y divide-[#F1F5F9] text-xs">
              {/* Dependency 1: 人口基本信息视图 */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#0F172A]">人口基本信息视图</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      DATA ASSET · VIEW
                    </span>
                    <span className="text-[#64748B]">
                      角色：<strong className="font-semibold text-[#0F172A]">核心数据</strong>
                    </span>
                  </div>

                  <div className="text-xs text-[#475569]">
                    提供字段：<span className="text-[#0F172A] font-medium">出生日期 · 常住状态 · 行政区域</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
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

                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] rounded text-[11px] font-medium">
                      <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
                      <span>数据状态正常 (每日更新)</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToDataAssetDetail?.('res-02')}
                  className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold shrink-0 cursor-pointer flex items-center space-x-0.5"
                >
                  <span>查看资产</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dependency 2: 行政区划基础数据 */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#0F172A]">行政区划基础数据</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      DATA ASSET
                    </span>
                    <span className="text-[#64748B]">
                      角色：<strong className="font-semibold text-[#0F172A]">分析维度</strong>
                    </span>
                  </div>

                  <div className="text-xs text-[#475569]">
                    提供字段：<span className="text-[#0F172A] font-medium">街镇 · 社区 · 标准区域编码</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] rounded text-[11px] font-medium">
                      <Check className="w-3 h-3 text-[#16A36A]" />
                      <span>可直接使用</span>
                    </span>

                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] rounded text-[11px] font-medium">
                      <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
                      <span>数据状态正常 (半年更新)</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToDataAssetDetail?.('res-05')}
                  className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold shrink-0 cursor-pointer flex items-center space-x-0.5"
                >
                  <span>查看资产</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Execution Readiness Summary */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#475569] gap-2">
              <div>
                {isAllReady ? (
                  <span>指标口径已正式生效；所有底层数据查询权限已就绪，可直接执行分析。</span>
                ) : (
                  <span>指标口径已正式生效；当前还需要获得 <strong className="font-semibold text-[#D97706]">1 项</strong> 底层数据查询权限后即可执行分析。</span>
                )}
              </div>
              <div className="text-[#64748B] font-medium">
                {isAllReady ? '2 项已准备 · 0 项需申请' : '1 项已准备 · 1 项需申请'}
              </div>
            </div>
          </section>

          {/* ======================================================= */}
          {/* VII. 相关资源 (Related Resources - Flat Compact Grid)     */}
          {/* ======================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                  <Network className="w-4 h-4 text-[#2563EB]" />
                  <span>相关资源</span>
                </h2>
                <p className="text-xs text-[#64748B]">
                  与老龄化率紧密关联的指标、业务对象与数据 API
                </p>
              </div>

              <button
                onClick={onBackToResources}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center space-x-0.5 cursor-pointer"
              >
                <span>查看全部相关资源</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Flat Compact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Item 1 */}
              <div className="p-3 border border-[#E2E8F0] rounded hover:border-[#2563EB] transition-all bg-white flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">60岁以上人口数</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                      METRIC
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    当前指标计算中的核心分子规模指标
                  </p>
                </div>
                <button
                  onClick={() => addToast?.('info', '指标详情', '已进入「60岁以上人口数」指标页面')}
                  className="pt-1.5 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center justify-between cursor-pointer"
                >
                  <span>查看详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item 2 */}
              <div className="p-3 border border-[#E2E8F0] rounded hover:border-[#2563EB] transition-all bg-white flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">常住人口数</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                      METRIC
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    当前指标计算中的总体人口分母指标
                  </p>
                </div>
                <button
                  onClick={() => addToast?.('info', '指标详情', '已进入「常住人口数」指标页面')}
                  className="pt-1.5 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center justify-between cursor-pointer"
                >
                  <span>查看详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item 3 */}
              <div className="p-3 border border-[#E2E8F0] rounded hover:border-[#2563EB] transition-all bg-white flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">自然人</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F5F3FF] text-[#7C3AED]">
                      BUSINESS OBJECT
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    当前指标所衡量的核心业务主体概念
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToBusinessObject?.('obj-01')}
                  className="pt-1.5 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center justify-between cursor-pointer"
                >
                  <span>查看详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item 4 */}
              <div className="p-3 border border-[#E2E8F0] rounded hover:border-[#2563EB] transition-all bg-white flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A] truncate max-w-[120px]">人口统计查询 API</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F5F3FF] text-[#7C3AED]">
                      DATA API
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    提供区域人口统计查询能力的对外服务
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToApiDetail?.('res-04')}
                  className="pt-1.5 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center justify-between cursor-pointer"
                >
                  <span>查看详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. LIGHTWEIGHT RIGHT USE RAIL (Flat Sidebar)              */}
      {/* ========================================================= */}
      <aside className="w-[300px] xl:w-[320px] bg-white border-l border-[#E2E8F0] flex flex-col shrink-0 overflow-y-auto select-none p-6 space-y-5">
        
        {/* Rail Title */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
            使用与分析
          </h3>
          <span className="text-[11px] font-mono text-[#2563EB]">
            METRIC
          </span>
        </div>

        {/* Section 1: 当前执行状态 */}
        <div className="space-y-1.5 text-xs">
          <div className="text-[#64748B]">当前执行状态</div>
          {isAllReady ? (
            <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#166534]">
                <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
                <span>已就绪，可直接执行</span>
              </div>
              <p className="text-[11px] text-[#15803D] leading-relaxed">
                底层数据权限与状态正常，可直接用于即时问数与深度分析。
              </p>
            </div>
          ) : (
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#B45309]">
                <Lock className="w-4 h-4 text-[#D97706]" />
                <span>还需 1 项底层数据权限</span>
              </div>
              <p className="text-[11px] text-[#92400E] leading-relaxed">
                指标定义可直接查看；执行分析还需要人口基本信息视图的查询权限。
              </p>
            </div>
          )}
        </div>

        <div className="h-px bg-[#E2E8F0]" />

        {/* Section 2: 数据准备与新鲜度 */}
        <div className="space-y-1.5 text-xs">
          <div className="text-[#64748B]">数据准备</div>
          <div className="flex items-center space-x-1.5 text-[#166534]">
            <Check className="w-3.5 h-3.5 text-[#16A36A]" />
            <span>当前无阻断性数据提醒</span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            底层数据源更新频率：每日同步
          </div>
        </div>

        <div className="h-px bg-[#E2E8F0]" />

        {/* Section 3: 维护团队 */}
        <div className="space-y-1.5 text-xs">
          <div className="text-[#64748B]">维护团队</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-5 h-5 rounded bg-[#F1F5F9] flex items-center justify-center text-[#475569]">
                <Building2 className="w-3 h-3" />
              </div>
              <span className="font-semibold text-[#0F172A]">人口业务治理团队</span>
            </div>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer"
            >
              联系团队 →
            </button>
          </div>
        </div>

        <div className="h-px bg-[#E2E8F0]" />

        {/* Section 4: CTAs */}
        <div className="space-y-2 pt-1">
          {!isAllReady ? (
            <>
              {/* Primary CTA: 申请所需资源并使用 */}
              <button
                onClick={() => setIsAccessRequestDrawerOpen(true)}
                className="w-full py-2 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>申请所需资源并使用</span>
              </button>

              {/* Secondary Action: 查看所需资源 */}
              <button
                onClick={() => {
                  const el = document.getElementById('section-execution-readiness');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  addToast?.('info', '执行准备', '已定位至底层所需数据资源列表');
                }}
                className="w-full py-2 px-4 bg-white hover:bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1] text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>查看所需资源</span>
              </button>

              {/* Link */}
              <button
                onClick={() => {
                  if (onExploreRelatedData) {
                    onExploreRelatedData('老龄化率');
                  } else if (onBackToResources) {
                    onBackToResources();
                  }
                }}
                className="w-full text-center text-xs text-[#2563EB] hover:underline font-medium pt-1 cursor-pointer block"
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
                className="w-full py-2 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
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
                className="w-full py-2 px-4 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>用于问数</span>
              </button>

              {/* Link */}
              <button
                onClick={onBackToResources}
                className="w-full text-center text-xs text-[#64748B] hover:text-[#2563EB] hover:underline font-medium pt-1 cursor-pointer block"
              >
                查看相关资源 →
              </button>
            </>
          )}
        </div>

      </aside>

      {/* ========================================================= */}
      {/* 4. MODALS & SLIDE-OVER DRAWERS                            */}
      {/* ========================================================= */}

      {/* 4.1 ACCESS REQUEST DRAWER (申请使用人口基本信息视图) */}
      <SingleResourceAccessRequestDrawer
        isOpen={isAccessRequestDrawerOpen}
        onClose={() => setIsAccessRequestDrawerOpen(false)}
        resourceName="人口基本信息视图"
        resourceTypeLabel="数据资产 · 视图"
        operation="QUERY"
        taskContextTitle="街镇老龄化分析"
        policyDecision="AUTO_ALLOW"
        suggestedScopeItems={['出生日期', '常住状态', '所属行政区域']}
        suggestedFieldMappings={[
          { label: '出生日期', field: 'birth_date' },
          { label: '常住状态', field: 'resident_status' },
          { label: '行政区域', field: 'region_code' }
        ]}
        onSuccessSubmit={() => {
          setPopAssetAccess('granted');
          setIsAccessRequestDrawerOpen(false);
          addToast?.(
            'success',
            '权限申请已提交并自动审批',
            '已获得「人口基本信息视图」的查询访问权限，老龄化率指标现已具备完整执行条件！'
          );
        }}
        onViewMyRequests={onNavigateToMyRequests}
        addToast={addToast}
      />

      {/* 4.2 TECHNICAL IMPLEMENTATION DRAWER (查看技术实现) */}
      {isTechImplementationDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150">
          <div
            className="absolute inset-0"
            onClick={() => setIsTechImplementationDrawerOpen(false)}
          />

          <div 
            className="relative w-full max-w-[560px] bg-white h-full shadow-2xl border-l border-[#E2E8F0] flex flex-col z-10 animate-in slide-in-from-right duration-200 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-white">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-[#64748B]">
                  技术实现与编译逻辑
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  老龄化率 · 底层语义编译
                </h3>
              </div>
              <button
                onClick={() => setIsTechImplementationDrawerOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* StarRocks / ClickHouse SQL Pattern */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B]">
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
                    className="text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === 'sql' ? '已复制' : '复制代码'}</span>
                  </button>
                </div>
                <div className="p-3.5 bg-[#0F172A] text-[#38BDF8] font-mono text-[11px] rounded overflow-x-auto leading-relaxed border border-[#334155]">
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
              <div className="p-4 border border-[#E2E8F0] rounded bg-[#F8FAFC] space-y-2">
                <div className="font-bold text-[#0F172A] text-xs">
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
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsTechImplementationDrawerOpen(false)}
                className="px-4 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-bold rounded transition-colors cursor-pointer text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.3 CONTACT TEAM MODAL (联系团队) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[420px] bg-white rounded shadow-2xl border border-[#E2E8F0] overflow-hidden animate-in zoom-in-95 duration-150 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">
                联系指标维护团队
              </h3>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-[#334155]">
              <div className="space-y-1">
                <div className="text-[11px] text-[#64748B]">责任团队</div>
                <div className="font-bold text-[#0F172A] text-sm">人口业务治理团队</div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-[#64748B]">业务接口人</div>
                <div className="font-medium text-[#0F172A]">张敏（人口规划与民政处）</div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-[#64748B]">企业协同通道</div>
                <div className="font-medium font-mono text-[#2563EB]">#population-metrics-governance</div>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#64748B] leading-relaxed">
                如对该指标的统计口径、年龄边界（如 60 岁 vs 65 岁口径）或适用范围有疑问，可直接在内部协同群发起讨论。
              </div>
            </div>

            <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded text-xs cursor-pointer shadow-2xs"
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
