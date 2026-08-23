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
  ShoppingBag
} from 'lucide-react';
import { SingleResourceAccessRequestDrawer } from './SingleResourceAccessRequestDrawer';
import { DataBindingDrawer } from './DataBindingDrawer';
import { BusinessRuleDetailDrawer } from './BusinessRuleDetailDrawer';
import { MetricDataBindingTab } from './MetricDataBindingTab';
import { MetricOverviewTab } from './MetricOverviewTab';
import { metricRegistryService } from '../data/metricRegistryData';
import { Metric } from '../types';

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
  // Resolve current metric dynamically from registry as Single Source of Truth
  const metric: Metric = 
    metricRegistryService.getMetricById(metricId) || 
    metricRegistryService.getMetricById('met_valid_order_amount') || 
    metricRegistryService.getAllMetrics()[0];

  // Main Tab State - default to Data Binding per user request
  const [activeTab, setActiveTab] = useState<'overview' | 'binding' | 'evidence_versions'>('binding');

  // Modals & Drawers
  const [isModifyDraftModalOpen, setIsModifyDraftModalOpen] = useState<boolean>(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isDeprecateModalOpen, setIsDeprecateModalOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isDimensionDetailOpen, setIsDimensionDetailOpen] = useState<string | null>(null);
  const [isDataBindingDrawerOpen, setIsDataBindingDrawerOpen] = useState<boolean>(false);
  const [isBusinessRuleDrawerOpen, setIsBusinessRuleDrawerOpen] = useState<boolean>(false);
  const [currentMetricStatus, setCurrentMetricStatus] = useState<string>(metric.status || 'EFFECTIVE');

  // Access Permission Simulation State for underlying data asset (需申请 vs 可直接使用)
  const [popAssetAccess, setPopAssetAccess] = useState<'granted' | 'requestable'>('requestable');
  const [isAccessRequestDrawerOpen, setIsAccessRequestDrawerOpen] = useState<boolean>(false);

  // Draft description in Modify Modal
  const [modifyReason, setModifyReason] = useState<string>(`根据最新业务规则，优化「${metric.name}」的认定范围口径与计算逻辑`);

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
      onNavigateToModifyDraft(metric.id);
    } else {
      addToast?.('success', '已创建指标修改草稿', `已基于当前正式版本 ${metric.version} 创建草稿副本，并进入版本演进治理流程`);
    }
  };

  const handleTriggerAnalysis = () => {
    setIsAnalysisModalOpen(false);
    if (onEnterAnalysis) {
      onEnterAnalysis(metric.name);
    } else {
      addToast?.('success', '已载入 AI 分析工作台', `指标「${metric.name}」已绑定当前分析会话`);
    }
  };

  const getBoId = (bo: string) => {
    if (bo === '自然人' || bo === '人口') return 'bo_person';
    if (bo === '服务工单' || bo === '工单') return 'bo_ticket';
    if (bo === '企业') return 'bo_corp';
    if (bo === '客户') return 'bo_customer';
    return 'bo_order';
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
                onClick={() => onNavigateToBusinessObject?.(getBoId(metric.businessObject))}
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
              {metric.scope?.organization || '企业数据治理委员会'}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-[#667085]">
            <span className="text-[#7C3AED] font-bold">✦</span>
            <span>AI Partner: Semovix Semantic Engine</span>
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
          <span className="text-[#172033] font-semibold">{metric.name}</span>
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
                  {metric.name}
                </h1>
                <span className="text-xs text-[#667085] font-mono">
                  {metric.enName || metric.measurement?.measureName}
                </span>

                {/* 3 个轻量标签 */}
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  {metric.scope?.businessDomain || '业务域'}
                </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-md flex items-center space-x-1 ${
                  currentMetricStatus === 'EFFECTIVE'
                    ? 'bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0]'
                    : currentMetricStatus === 'DEPRECATED'
                    ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                    : 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    currentMetricStatus === 'EFFECTIVE'
                      ? 'bg-[#16A36A]'
                      : currentMetricStatus === 'DEPRECATED'
                      ? 'bg-[#DC2626]'
                      : 'bg-[#D97706]'
                  }`} />
                  <span>
                    {currentMetricStatus === 'EFFECTIVE'
                      ? '当前正式有效'
                      : currentMetricStatus === 'DEPRECATED'
                      ? '已停用 (DEPRECATED)'
                      : '草稿草拟'}
                  </span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center space-x-1">
                  <span>✦</span>
                  <span>{metric.aiReadiness === 'READY' ? 'AI 可用' : '未就绪'}</span>
                </span>
              </div>

              {/* 正式定义说明 */}
              <p className="text-sm text-[#475569] leading-relaxed max-w-4xl font-normal">
                {metric.definition}
              </p>

              {/* 元信息行 */}
              <div className="pt-1 flex items-center flex-wrap gap-x-6 gap-y-1.5 text-xs text-[#667085]">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[#94A3B8]">业务对象：</span>
                  <button
                    onClick={() => onNavigateToBusinessObject?.(getBoId(metric.businessObject))}
                    className="font-medium text-[#172033] hover:text-[#2563EB] transition-colors cursor-pointer"
                  >
                    {metric.businessObject}
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[#94A3B8]">业务域：</span>
                  <span className="font-medium text-[#172033]">{metric.scope?.businessDomain}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[#94A3B8]">Owner：</span>
                  <span className="font-medium text-[#172033]">{metric.provenance?.owner || '数据治理委员会'}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[#94A3B8]">当前版本：</span>
                  <span className="font-mono font-semibold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                    {metric.version}
                  </span>
                </div>
              </div>
            </div>

            {/* 右侧操作区 (申请资源 + 问这个指标 + 用于分析 + 发起修改 + More) */}
            <div className="flex items-center space-x-2.5 shrink-0 self-start pt-1">
              {popAssetAccess === 'requestable' && (
                <button
                  type="button"
                  onClick={() => setIsAccessRequestDrawerOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#D97706] flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="底层「人口基本信息视图」尚未授权，申请后指标具备完整执行条件"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>申请所需资源</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onEnterChatQuery) {
                    onEnterChatQuery(metric.name);
                  } else {
                    addToast?.('info', '问这个指标', `已在智能问数中绑定「${metric.name}」指标口径`);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>问这个指标</span>
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
                        setIsDeprecateModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#FEF2F2] text-[#DC2626] flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
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
              <span>AI 语义对齐就绪 · 5维相容性校验通过</span>
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
                metric={metric}
                onNavigateToBusinessObject={onNavigateToBusinessObject}
                onNavigateToBindingTab={() => setActiveTab('binding')}
                onNavigateToVersionsTab={() => setActiveTab('evidence_versions')}
                onOpenBusinessRuleDrawer={() => setIsBusinessRuleDrawerOpen(true)}
                onOpenDataBindingDrawer={() => setIsDataBindingDrawerOpen(true)}
                onSelectDimension={(dimName) => setIsDimensionDetailOpen(dimName)}
                addToast={addToast}
              />
            )}

            {/* --------------------------------------------------------- */}
            {/* Tab: 数据实现 Data Binding                                 */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'binding' && (
              <MetricDataBindingTab
                metric={metric}
                binding={metric.binding}
                onOpenDataBindingDrawer={() => setIsDataBindingDrawerOpen(true)}
                onOpenBusinessRuleDrawer={() => setIsBusinessRuleDrawerOpen(true)}
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
                  {/* 当前正式有效版本 */}
                  <div className="p-4 bg-[#F8FAFC] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#172033]">{metric.version}（当前正式有效版本）</span>
                        <span className="px-2 py-0.2 rounded bg-[#2563EB] text-white text-[10px] font-bold">CURRENT</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        currentMetricStatus === 'EFFECTIVE'
                          ? 'text-[#16A36A] bg-[#F0FDF4] border-[#DCFCE7]'
                          : currentMetricStatus === 'DEPRECATED'
                          ? 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]'
                          : 'text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]'
                      }`}>
                        {currentMetricStatus === 'EFFECTIVE' ? '已生效执行中' : currentMetricStatus === 'DEPRECATED' ? '已停用' : '草稿'}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      {metric.definition}
                    </p>
                    <div className="text-[11px] text-[#667085] flex items-center space-x-3 pt-1 flex-wrap gap-y-1">
                      <span>确认责任人: {metric.provenance?.owner || '指标归口责任人'}</span>
                      <span>·</span>
                      <span>确认状态: Owner 确认生效</span>
                      <span>·</span>
                      <span>依据制度: {metric.provenance?.evidence?.[0] || '《企业业务数据治理规范》'}</span>
                    </div>
                  </div>

                  {/* 历史初始归档版本 */}
                  <div className="p-4 bg-white space-y-2 opacity-80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#172033]">v1.0.0 (历史已归档版本)</span>
                      </div>
                      <span className="text-xs text-[#667085] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                        已归档
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] leading-relaxed">
                      初始创建版本，确立指标核心度量与基础粒度。
                    </p>
                    <div className="text-[11px] text-[#94A3B8] flex items-center space-x-3 pt-1">
                      <span>归档人: {metric.provenance?.owner || '数据治理委员会'}</span>
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
                  发起指标修改 - {metric.name}
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
                当前指标为 <strong>{metric.version} 当前正式有效版本</strong>，受语义事实保护不可直接编辑。发起修改将基于当前定义创建 <strong>新草稿副本</strong>，并在发布生效后完成版本演进。
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
                创建草稿版本
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
              您即将把正式指标 <strong>「{metric.name}」</strong> 载入 AI 协同分析工作台，您可以直接围绕该指标提问，例如：
            </p>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded bg-[#F8FAFC] border border-[#EEF2F6] text-[#2563EB] font-medium">
                • 过去三年各主要维度的「{metric.name}」增长趋势如何？
              </div>
              <div className="p-2 rounded bg-[#F8FAFC] border border-[#EEF2F6] text-[#2563EB] font-medium">
                • 针对不同分类对「{metric.name}」进行多维下钻与结构占比分析
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
                  指标历史版本一览 - {metric.name}
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#667085]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172033]">{metric.version}（当前正式有效版本）</span>
                  <span className="text-[10px] text-[#2563EB] font-mono">正式有效</span>
                </div>
                <p className="text-[11px] text-[#475569] mt-1">
                  {metric.definition}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#667085]">v1.0.0 (历史初版)</span>
                  <span className="text-[10px] text-[#94A3B8] font-mono">已归档</span>
                </div>
                <p className="text-[11px] text-[#667085] mt-1">
                  初版业务统计口径与事实基础。
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
                <span className="text-[#667085]">所属实体:</span>
                <span className="font-semibold text-[#172033]">{metric.businessObject}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF2F6]">
                <span className="text-[#667085]">下钻支持:</span>
                <span className="text-[#16A36A] font-semibold">支持逐级下钻</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#667085]">相容性状态:</span>
                <span className="text-[#16A36A] font-semibold">🟢 5维相容性 PASS</span>
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
            metric={metric}
            onViewDataAsset={(assetName) => {
              setIsDataBindingDrawerOpen(false);
              onNavigateToDataAssetDetail?.(metric.binding?.dataAssetId || 'asset_01');
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
        ruleName={metric.name}
        metric={metric}
        addToast={addToast}
      />

      {/* ========================================================= */}
      {/* 弹窗 7: 停用指标确认模态框 (遵循第25节：基础模型不硬编码委员会审批) */}
      {/* ========================================================= */}
      {isDeprecateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2F6]">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  确认停用指标 - {metric.name}
                </h3>
              </div>
              <button
                onClick={() => setIsDeprecateModalOpen(false)}
                className="p-1 rounded-md hover:bg-[#F1F5F9] text-[#667085] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] space-y-1.5">
              <div className="font-bold flex items-center space-x-1">
                <span>⚠️ 影响与停用说明：</span>
              </div>
              <p className="leading-relaxed">
                您即将停用「<strong>{metric.name}</strong>」（{metric.version} 当前正式有效版本）。停用后该指标状态将变更为「<strong>已停用（DEPRECATED）</strong>」，下游正在消费该口径的看板与 AI 问数将收到口径停用提示。
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#475569] space-y-1">
              <div className="font-semibold text-[#172033]">治理规则生效说明：</div>
              <p>
                根据语义平台规范（第 25 节），基础模式下由指标归口责任人（Owner：{metric.provenance?.owner || '指标负责人'}）直接确认生效；若企业环境配置了组织级 Governance Policy，系统将按预设策略自动流转。
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#EEF2F6]">
              <button
                type="button"
                onClick={() => setIsDeprecateModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-medium text-[#475569] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeprecateModalOpen(false);
                  setCurrentMetricStatus('DEPRECATED');
                  metric.status = 'DEPRECATED';
                  addToast?.('success', '指标已停用', `已将「${metric.name}」标记为已停用状态（DEPRECATED）`);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                确认停用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 弹窗 8: ACCESS REQUEST DRAWER (申请使用人口基本信息视图)    */}
      {/* ========================================================= */}
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
            '已获得「人口基本信息视图」的查询访问权限，指标现已具备完整执行条件！'
          );
        }}
        onViewMyRequests={onNavigateToMyRequests}
        addToast={addToast}
      />

    </div>
  );
};
