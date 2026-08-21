import React, { useState } from 'react';
import {
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
  Sparkles,
  Layers,
  FileCheck,
  FolderTree,
  HelpCircle,
  MoreHorizontal,
  GitBranch,
  ShieldCheck,
  FileText,
  TrendingUp,
  Link2,
  Activity,
  History,
  Tag,
  Hash,
  Home,
  Compass,
  Box,
  Layers3,
  Cpu
} from 'lucide-react';
import { DataBindingDrawer } from './DataBindingDrawer';
import { BusinessRuleDetailDrawer } from './BusinessRuleDetailDrawer';
import { MetricDataBindingTab } from './MetricDataBindingTab';
import { MetricOverviewTab } from './MetricOverviewTab';
import { RuntimeMetricResolutionStudio } from './RuntimeMetricResolutionStudio';

export interface MetricDetailWorkspaceProps {
  metricId?: string;
  fromGoalSearch?: boolean;
  goalQuery?: string;
  onBackToResources?: () => void;
  onBackToRegistry?: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToDataAssetDetail?: (assetId: string) => void;
  onNavigateToBusinessObject?: (objectId: string) => void;
  onNavigateToApiDetail?: (apiId: string) => void;
  onEnterAnalysis?: (metricName: string) => void;
  onEnterChatQuery?: (metricName: string) => void;
  onExploreRelatedData?: (metricName: string) => void;
  onNavigateToDataAssets?: () => void;
  onNavigateToDataStandards?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToModifyDraft?: (metricId?: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MetricDetailWorkspace: React.FC<MetricDetailWorkspaceProps> = ({
  metricId = 'met_001',
  fromGoalSearch = false,
  goalQuery = '分析各街镇老龄化情况',
  onBackToResources,
  onBackToRegistry,
  onNavigateToDiscovery,
  onNavigateToMyRequests,
  onNavigateToDataAssetDetail,
  onNavigateToBusinessObject,
  onNavigateToApiDetail,
  onEnterAnalysis,
  onEnterChatQuery,
  onExploreRelatedData,
  onNavigateToDataAssets,
  onNavigateToDataStandards,
  onNavigateToHome,
  onNavigateToModifyDraft,
  addToast
}) => {
  // Main Tab State - default to Data Binding per user request
  const [activeTab, setActiveTab] = useState<'overview' | 'binding' | 'evidence_versions'>('binding');

  // Modals & Drawers
  const [isModifyDraftModalOpen, setIsModifyDraftModalOpen] = useState<boolean>(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isRuntimeModalOpen, setIsRuntimeModalOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isDimensionDetailOpen, setIsDimensionDetailOpen] = useState<string | null>(null);
  const [isDataBindingDrawerOpen, setIsDataBindingDrawerOpen] = useState<boolean>(false);
  const [isBusinessRuleDrawerOpen, setIsBusinessRuleDrawerOpen] = useState<boolean>(false);

  // Draft description in Modify Modal
  const [modifyReason, setModifyReason] = useState<string>('根据最新业务规则，优化有效订单的认定范围口径');

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast?.('success', '已复制到剪贴板', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartModifyDraft = () => {
    setIsModifyDraftModalOpen(false);
    if (onNavigateToModifyDraft) {
      onNavigateToModifyDraft(metricId);
    } else {
      addToast?.('success', '已创建指标修改草稿', '已基于当前正式版本 v1.2 创建 v1.3 草稿副本，并进入版本演进治理流程');
    }
  };

  const handleTriggerAnalysis = () => {
    setIsAnalysisModalOpen(false);
    if (onEnterAnalysis) {
      onEnterAnalysis('老年人口数');
    } else {
      addToast?.('success', '已载入 AI 分析工作台', '指标「老年人口数」已绑定当前分析会话');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] font-sans antialiased">
      
      {/* ========================================================= */}
      {/* 左侧固定导航栏 (220px–240px)                               */}
      {/* ========================================================= */}
      <aside className="w-[230px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none z-10">
        <div className="p-4 border-b border-[#EEF2F6] flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs shadow-2xs">
            S
          </div>
          <div>
            <div className="text-xs font-bold text-[#172033] tracking-tight">
              Semovix 语义治理
            </div>
            <div className="text-[10px] text-[#667085]">
              企业级 AI 原生平台
            </div>
          </div>
        </div>

        {/* 导航菜单列表 */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 text-xs font-medium text-[#475569]">
          <button
            onClick={() => onNavigateToHome?.()}
            className="w-full px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#667085]" />
            <span>首页</span>
          </button>

          <button
            onClick={() => addToast?.('info', '数据连接', '查看企业数据源与多模态连接器状态')}
            className="w-full px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <Link2 className="w-4 h-4 text-[#667085]" />
            <span>数据连接</span>
          </button>

          <button
            onClick={() => onNavigateToDataAssets?.()}
            className="w-full px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4 text-[#667085]" />
            <span>数据资产</span>
          </button>

          <button
            onClick={() => onNavigateToDataStandards?.()}
            className="w-full px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-[#667085]" />
            <span>数据标准</span>
          </button>

          <button
            onClick={() => addToast?.('info', '数据质量', '查看全域数据质量规则与检核大盘')}
            className="w-full px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#667085]" />
            <span>数据质量</span>
          </button>

          {/* 业务语义 (当前一级高亮并展开) */}
          <div className="pt-1">
            <div className="px-3 py-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-bold text-left flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <FolderTree className="w-4 h-4 text-[#2563EB]" />
                <span>业务语义</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            </div>

            {/* 二级菜单 */}
            <div className="pl-4 pr-1 py-1 space-y-0.5 mt-0.5 border-l-2 border-[#BFDBFE] ml-4">
              <button
                onClick={() => onNavigateToBusinessObject?.('bo_person')}
                className="w-full px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-left text-xs text-[#475569] flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#667085]" />
                <span>业务对象</span>
              </button>

              <button
                onClick={() => onBackToRegistry?.() || onBackToResources?.()}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#DBEAFE] text-[#1D4ED8] font-bold text-left text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>指标</span>
                </div>
                <span className="text-[10px] bg-white text-[#2563EB] px-1.5 py-0.2 rounded font-mono font-semibold">
                  当前
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={() => onNavigateToDiscovery?.()}
            className="w-full px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#667085]" />
            <span>服务超市</span>
          </button>

          <button
            onClick={() => addToast?.('info', '知识网络', '查看政务知识图谱与语义关系拓扑')}
            className="w-full px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <Network className="w-4 h-4 text-[#667085]" />
            <span>知识网络</span>
          </button>

          <button
            onClick={() => onNavigateToHome?.()}
            className="w-full px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#667085]" />
            <span>AI 工作台</span>
          </button>
        </div>

        {/* 左侧栏底部：租户/组织信息 + AI Partner */}
        <div className="p-3 border-t border-[#EEF2F6] bg-[#FAFCFF] space-y-1.5">
          <div className="flex items-center space-x-2">
            <Building2 className="w-3.5 h-3.5 text-[#667085]" />
            <span className="text-xs font-semibold text-[#172033]">
              人口管理局
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-[#667085]">
            <span className="text-[#7C3AED] font-bold">✦</span>
            <span>AI Partner: Xino｜犀诺</span>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 主内容区 (从上到下: Breadcrumb -> Header -> Tabs -> Overview)*/}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F7F9FC]">
        
        {/* ======================================================= */}
        {/* 1. Breadcrumb                                           */}
        {/* ======================================================= */}
        <div className="px-8 pt-5 pb-2 flex items-center space-x-2 text-xs text-[#667085] select-none">
          <button
            onClick={() => onBackToRegistry?.() || onBackToResources?.()}
            className="hover:text-[#2563EB] transition-colors cursor-pointer flex items-center space-x-1"
          >
            <span>业务语义</span>
          </button>
          <span>/</span>
          <button
            onClick={() => onBackToRegistry?.() || onBackToResources?.()}
            className="hover:text-[#2563EB] transition-colors cursor-pointer"
          >
            <span>指标</span>
          </button>
          <span>/</span>
          <span className="text-[#172033] font-semibold">有效订单金额</span>
        </div>

        {/* ======================================================= */}
        {/* 2. Header 区 (正式指标核心事实)                            */}
        {/* ======================================================= */}
        <div className="px-8 py-4 bg-white border-b border-[#E6EAF0] shadow-2xs">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
            
            {/* 左侧核心信息 */}
            <div className="space-y-2 flex-1 min-w-0">
              {/* 主标题与轻量标签 */}
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                  有效订单金额
                </h1>
                <span className="text-xs text-[#667085] font-mono">
                  Effective Order Amount
                </span>

                {/* 3 个轻量标签 */}
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  电商交易
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                  <span>正式有效</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center space-x-1">
                  <span>✦</span>
                  <span>AI 可用</span>
                </span>
              </div>

              {/* 正式定义说明 */}
              <p className="text-sm text-[#475569] leading-relaxed max-w-4xl font-normal">
                满足“有效订单”业务规则的订单金额合计，用于衡量一定统计周期内形成的有效订单交易规模。
              </p>

              {/* 元信息行 */}
              <div className="pt-1 flex items-center flex-wrap gap-x-6 gap-y-1.5 text-xs text-[#667085]">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[#94A3B8]">业务对象：</span>
                  <button
                    onClick={() => onNavigateToBusinessObject?.('bo_order')}
                    className="font-medium text-[#172033] hover:text-[#2563EB] transition-colors cursor-pointer"
                  >
                    订单
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[#94A3B8]">业务域：</span>
                  <span className="font-medium text-[#172033]">电商交易</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[#94A3B8]">Owner：</span>
                  <span className="font-medium text-[#172033]">交易分析与财务核算组</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[#94A3B8]">当前版本：</span>
                  <span className="font-mono font-semibold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                    v1.2
                  </span>
                </div>
              </div>
            </div>

            {/* 右侧操作区 (问这个指标 + 运行时解析验证 + 用于分析 + 发起修改 + More) */}
            <div className="flex items-center space-x-2.5 shrink-0 self-start pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onEnterChatQuery) {
                    onEnterChatQuery('有效订单金额');
                  } else {
                    addToast?.('info', '问这个指标', '已在 Xino 智能问数中绑定「有效订单金额」指标口径');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>问这个指标</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRuntimeModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-[#DBEAFE] text-xs font-bold text-[#1D4ED8] shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="验证 User Question → Metric Resolution → Context Validation → Binding Resolution → Execution Plan"
              >
                <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>运行时解析验证</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAnalysisModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-white border border-[#E6EAF0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-xs font-semibold text-[#172033] shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>用于分析</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModifyDraftModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-semibold text-[#475569] hover:text-[#172033] flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>发起修改</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="p-2 rounded-lg bg-white border border-[#E6EAF0] hover:bg-[#F8FAFC] text-[#667085] hover:text-[#172033] transition-colors cursor-pointer shadow-2xs"
                  title="更多操作"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMoreMenuOpen && (
                  <div
                    onMouseLeave={() => setIsMoreMenuOpen(false)}
                    className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-lg border border-[#E6EAF0] shadow-lg py-1 z-30 text-xs text-[#172033] animate-in fade-in-50 duration-100"
                  >
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsHistoryModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#F8FAFC] flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-[#667085]" />
                      <span>查看历史版本</span>
                    </button>
                    <div className="border-t border-[#EEF2F6] my-1" />
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        addToast?.('error', '权限限制', '停用正式已发布指标需提交企业数据治理委员会审批');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#FEF2F2] text-[#E45454] flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[#E45454]" />
                      <span>停用指标</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================= */}
        {/* 3. 一级 Tabs 区                                          */}
        {/* ======================================================= */}
        <div className="px-8 bg-white border-b border-[#E6EAF0] select-none">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-8 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
                  activeTab === 'overview'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#667085] hover:text-[#172033]'
                }`}
              >
                <span>概览 Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('binding')}
                className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
                  activeTab === 'binding'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#667085] hover:text-[#172033]'
                }`}
              >
                <span>数据实现 Data Binding</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('evidence_versions')}
                className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
                  activeTab === 'evidence_versions'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#667085] hover:text-[#172033]'
                }`}
              >
                <span>依据与版本 Evidence & Versions</span>
              </button>
            </div>

            {/* Tabs 右侧极轻状态提示 */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-[#667085]">
              <span className="text-[#7C3AED] font-bold">✦</span>
              <span>AI 持续验证中 · 当前未发现阻断问题</span>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 4. Tab 内容区                                            */}
        {/* ======================================================= */}
        <div className="flex-1 p-5 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">

            {activeTab === 'overview' && (
              <MetricOverviewTab
                metricName="有效订单金额"
                onNavigateToBusinessObject={onNavigateToBusinessObject}
                onNavigateToBindingTab={() => setActiveTab('binding')}
                onNavigateToVersionsTab={() => setActiveTab('evidence_versions')}
                onOpenBusinessRuleDrawer={() => setIsBusinessRuleDrawerOpen(true)}
                onOpenDataBindingDrawer={() => setIsDataBindingDrawerOpen(true)}
                onOpenRuntimeResolution={() => setIsRuntimeModalOpen(true)}
                onSelectDimension={(dimName) => setIsDimensionDetailOpen(dimName)}
                addToast={addToast}
              />
            )}

            {/* --------------------------------------------------------- */}
            {/* Tab: 数据实现 Data Binding                                 */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'binding' && (
              <MetricDataBindingTab
                metricName="有效订单金额"
                onOpenDataBindingDrawer={() => setIsDataBindingDrawerOpen(true)}
                onOpenBusinessRuleDrawer={() => setIsBusinessRuleDrawerOpen(true)}
                onOpenRuntimeResolution={() => setIsRuntimeModalOpen(true)}
                onNavigateToDataAssetDetail={onNavigateToDataAssetDetail}
                onNavigateToVersionsTab={() => setActiveTab('evidence_versions')}
                addToast={addToast}
              />
            )}

            {/* --------------------------------------------------------- */}
            {/* Tab: 依据与版本 Evidence & Versions                        */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'evidence_versions' && (
              <div className="w-full bg-white rounded-xl border border-[#E6EAF0] p-6 sm:p-8 space-y-7 font-sans antialiased text-[#172033] shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
                    <h2 className="text-sm font-bold text-[#172033] tracking-tight">
                      指标版本演进与治理凭证链
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsModifyDraftModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>发起新版本修改</span>
                  </button>
                </div>

                <div className="border border-[#EEF2F6] rounded-lg overflow-hidden divide-y divide-[#EEF2F6] text-xs">
                  {/* v2.0 当前正式发布版本 */}
                  <div className="p-4 bg-[#F8FAFC] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#172033]">v2.0 (当前正式发布版本)</span>
                        <span className="px-2 py-0.2 rounded bg-[#2563EB] text-white text-[10px] font-bold">CURRENT</span>
                      </div>
                      <span className="text-xs text-[#16A36A] font-semibold bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#DCFCE7]">
                        已生效执行中
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      将“有效订单”业务规则升级为标准共享规则，排除已全额退款、作废订单及测试订单；新增地区跨对象拓扑关联安全路径。
                    </p>
                    <div className="text-[11px] text-[#667085] flex items-center space-x-3 pt-1">
                      <span>发布人: 交易分析与财务核算组 · 李晨</span>
                      <span>·</span>
                      <span>发布时间: 2026-06-15 14:30</span>
                      <span>·</span>
                      <span>依据制度: 《企业电商交易业务数据治理规范》第 4.2 条</span>
                    </div>
                  </div>

                  {/* v1.0 历史版本 */}
                  <div className="p-4 bg-white space-y-2 opacity-80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#172033]">v1.0 (历史已归档版本)</span>
                      </div>
                      <span className="text-xs text-[#667085] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                        已归档
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] leading-relaxed">
                      初始创建版本，直接基于原交易流水表粗粒度求和。
                    </p>
                    <div className="text-[11px] text-[#94A3B8] flex items-center space-x-3 pt-1">
                      <span>发布人: 数据中心 · 王伟</span>
                      <span>·</span>
                      <span>发布时间: 2025-11-20</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

      {/* ========================================================= */}
      {/* 弹窗 1: 发起修改模态框 (解释正式版不可直接修改，将创建草稿)  */}
      {/* ========================================================= */}
      {isModifyDraftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2F6]">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  发起指标修改
                </h3>
              </div>
              <button
                onClick={() => setIsModifyDraftModalOpen(false)}
                className="p-1 rounded-md hover:bg-[#F1F5F9] text-[#667085]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF] space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>语义治理规范约束：</span>
              </div>
              <p>
                当前指标为 <strong>v1.2 已发布正式版本</strong>，受语义事实保护不可直接编辑。发起修改将基于当前定义创建 <strong>v1.3 草稿副本</strong>，并在审核发布后生效替换。
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                修改原因与变更诉求说明
              </label>
              <textarea
                value={modifyReason}
                onChange={(e) => setModifyReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] focus:outline-none focus:border-[#2563EB] focus:bg-white text-[#172033]"
                placeholder="请详细描述指标口径调整的原因..."
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#EEF2F6]">
              <button
                type="button"
                onClick={() => setIsModifyDraftModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-medium text-[#475569] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleStartModifyDraft}
                className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                创建 v1.3 草稿版本
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 弹窗 2: 用于分析模态框                                     */}
      {/* ========================================================= */}
      {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2F6]">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  用于 AI 分析与问数
                </h3>
              </div>
              <button
                onClick={() => setIsAnalysisModalOpen(false)}
                className="p-1 rounded-md hover:bg-[#F1F5F9] text-[#667085]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              您即将把正式指标 <strong>「老年人口数」</strong> 载入 AI 协同分析工作台，您可以直接围绕该指标提问，例如：
            </p>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded bg-[#F8FAFC] border border-[#EEF2F6] text-[#2563EB] font-medium">
                • 过去三年各街镇老年人口增长趋势如何？
              </div>
              <div className="p-2 rounded bg-[#F8FAFC] border border-[#EEF2F6] text-[#2563EB] font-medium">
                • 80 岁以上高龄老年人口的区域分布集中在哪些网格？
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#EEF2F6]">
              <button
                type="button"
                onClick={() => setIsAnalysisModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-medium text-[#475569] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleTriggerAnalysis}
                className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>进入分析</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 弹窗 3: 历史版本查看模态框                                 */}
      {/* ========================================================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2F6]">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  指标历史版本一览
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-md hover:bg-[#F1F5F9] text-[#667085]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172033]">v1.2 (当前版本)</span>
                  <span className="text-[10px] text-[#2563EB] font-mono">2026-06-15 生效</span>
                </div>
                <p className="text-[11px] text-[#475569] mt-1">
                  修正 60 周岁精确时间差算法，并规范 5 项分析维度。
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#667085]">v1.1</span>
                  <span className="text-[10px] text-[#94A3B8] font-mono">2026-01-10 生效</span>
                </div>
                <p className="text-[11px] text-[#667085] mt-1">
                  初版人口业务统计口径。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#EEF2F6]">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 弹窗 4: 维度详情轻量抽屉/弹窗                               */}
      {/* ========================================================= */}
      {isDimensionDetailOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-2xl max-w-sm w-full p-5 space-y-3 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#EEF2F6]">
              <h3 className="text-xs font-bold text-[#172033]">
                分析维度：{isDimensionDetailOpen}
              </h3>
              <button
                onClick={() => setIsDimensionDetailOpen(null)}
                className="p-1 rounded-md hover:bg-[#F1F5F9] text-[#667085]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#EEF2F6]">
                <span className="text-[#667085]">维度层级:</span>
                <span className="font-semibold text-[#172033]">企业正式分析维度</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF2F6]">
                <span className="text-[#667085]">下钻支持:</span>
                <span className="text-[#16A36A] font-semibold">支持逐级下钻</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#667085]">验证状态:</span>
                <span className="text-[#16A36A] font-semibold">🟢 已验证</span>
              </div>
            </div>

            <button
              onClick={() => setIsDimensionDetailOpen(null)}
              className="w-full py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-semibold text-[#172033] transition-colors cursor-pointer"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 弹窗 5: Data Binding Drawer (数据实现检查面板)             */}
      {/* ========================================================= */}
      {isDataBindingDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <DataBindingDrawer
            isOpen={isDataBindingDrawerOpen}
            onClose={() => setIsDataBindingDrawerOpen(false)}
            onViewDataAsset={(assetName) => {
              setIsDataBindingDrawerOpen(false);
              onNavigateToDataAssetDetail?.('res-order-fact');
            }}
            onViewBusinessRule={(ruleName) => {
              setIsBusinessRuleDrawerOpen(true);
            }}
            addToast={addToast}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 弹窗 6: Business Rule Detail Drawer (业务规则实现详情)     */}
      {/* ========================================================= */}
      <BusinessRuleDetailDrawer
        isOpen={isBusinessRuleDrawerOpen}
        onClose={() => setIsBusinessRuleDrawerOpen(false)}
        ruleName="有效订单"
        addToast={addToast}
      />

      {/* ========================================================= */}
      {/* 弹窗 7: Runtime Metric Resolution Studio (运行时解析工作台) */}
      {/* ========================================================= */}
      {isRuntimeModalOpen && (
        <RuntimeMetricResolutionStudio
          isOpen={isRuntimeModalOpen}
          onClose={() => setIsRuntimeModalOpen(false)}
          initialMetricId={metricId}
          initialMetricName="有效订单金额"
          initialQuestion="查看今年华东地区各渠道有效订单金额"
          addToast={addToast}
        />
      )}

    </div>
  );
};
