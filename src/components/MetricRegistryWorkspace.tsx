import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  Info,
  MoreHorizontal,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Home,
  Database,
  Layers,
  BookOpen,
  ShieldCheck,
  FolderTree,
  BarChart3,
  ShoppingBag,
  Network,
  Bot,
  ChevronDown,
  ChevronRight,
  X,
  Download,
  AlertCircle,
  Link2Off,
  GitMerge,
  Split,
  FileQuestion,
  Zap,
  Cpu
} from 'lucide-react';
import { ImportExistingMetricDrawer } from './ImportExistingMetricDrawer';
import {
  Metric,
  MetricRegistryRowVM,
  MetricPendingActionType,
  MetricDraftInitialData,
  ExistingMetricCandidate
} from '../types';
import { CANONICAL_DOMAIN_METRICS, metricRegistryService } from '../data/metricRegistryData';

// Domain Source of Truth: Canonical Domain Metrics from central Registry Service
const MOCK_DOMAIN_METRICS: Metric[] = CANONICAL_DOMAIN_METRICS;

// =========================================================
// Projection Function: Metric (Domain) -> MetricRegistryRowVM (View)
// =========================================================
export function projectMetricToRowVM(metric: Metric): MetricRegistryRowVM {
  let calcSummary = '';
  if (metric.measurement.aggregation === 'SUM') {
    calcSummary = `SUM(${metric.measurement.measureName})`;
  } else if (metric.measurement.aggregation === 'COUNT_DISTINCT') {
    calcSummary = `COUNT DISTINCT ${metric.measurement.measureName}`;
  } else if (metric.measurement.aggregation === 'COUNT') {
    calcSummary = `COUNT(${metric.measurement.measureName})`;
  } else if (metric.measurement.aggregation === 'AVG') {
    calcSummary = `AVG(${metric.measurement.measureName})`;
  } else {
    calcSummary = metric.measurement.measureName;
  }

  if (metric.id === 'met_001') calcSummary = '老年人口数 ÷ 常住人口数';
  if (metric.id === 'met_002') calcSummary = '已办结工单数 ÷ 工单总数';
  if (metric.id === 'met_007') calcSummary = '销售额 ÷ 订单数';
  if (metric.id === 'met_008') calcSummary = '投诉工单数 ÷ 工单总数';
  if (metric.id === 'met_009') calcSummary = '复购客户数 ÷ 客户总数';

  const timeGrainMap: Record<string, string> = {
    DAY: '日',
    MONTH: '月',
    QUARTER: '季',
    YEAR: '年',
  };
  const timeSemanticsStr = `${metric.timeSemantics.businessTime} · ${
    timeGrainMap[metric.timeSemantics.defaultGranularity] || '月'
  }`;

  // Deduce Pending Action Type & Description
  let pendingActionType: MetricPendingActionType | undefined = undefined;
  let pendingActionDesc = '';

  if (metric.id === 'met_008' || metric.binding?.health === 'INVALID') {
    pendingActionType = 'BINDING_ISSUE';
    pendingActionDesc = '时间字段 Binding 已失效，物理层时间口径需重新映射';
  } else if (metric.id === 'met_010') {
    pendingActionType = 'CONFLICT';
    pendingActionDesc = '与「APP端日活跃用户」存在定义重叠冲突';
  } else if (metric.id === 'met_011') {
    pendingActionType = 'CONTEXT_VARIANT';
    pendingActionDesc = '大区与总部存在场景派生口径，建议收敛合并';
  } else if (metric.id === 'met_012') {
    pendingActionType = 'MISSING_MEANING';
    pendingActionDesc = '缺少汇率折算规则与关税退还约束定义';
  } else if (metric.binding?.health === 'DEGRADED') {
    pendingActionType = 'BINDING_ISSUE';
    pendingActionDesc = '执行层数据绑定存在降级或依赖变动';
  }

  return {
    id: metric.id,
    name: metric.name,
    enName: metric.enName || metric.id,
    domain: metric.scope.businessDomain || '未分类',
    definition: metric.definition,
    businessObject: metric.businessObject,
    calculationSummary: calcSummary,
    timeSemantics: timeSemanticsStr,
    validationStatus: metric.validationStatus || 'UNVERIFIED',
    validationMessage: metric.changeReason || undefined,
    status: metric.status,
    bindingHealth: metric.binding?.health || 'HEALTHY',
    aiReadiness: metric.aiReadiness || 'NOT_READY',
    owner: metric.provenance?.owner || '未分配',
    dimensionCount: metric.dimensions?.length || 0,
    pendingActionType,
    pendingActionDesc,
    originalMetric: metric,
  };
}

interface MetricRegistryWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToBusinessObject?: () => void;
  onNavigateToDataStandards?: () => void;
  onNavigateToDataSemantics?: () => void;
  onNavigateToDataAssets?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToCreateMetric?: (
    mode?: 'ai_prompt' | 'blank' | 'draft' | 'imported_draft' | 'change_draft',
    initialDraftData?: MetricDraftInitialData
  ) => void;
}

export const MetricRegistryWorkspace: React.FC<MetricRegistryWorkspaceProps> = ({
  addToast,
  onNavigateToMetricDetail,
  onNavigateToBusinessObject,
  onNavigateToDataStandards,
  onNavigateToDataSemantics,
  onNavigateToDataAssets,
  onNavigateToHome,
  onNavigateToCreateMetric,
}) => {
  // Navigation states
  const [activeNav, setActiveNav] = useState<'semantics'>('semantics');
  const [semanticsExpanded, setSemanticsExpanded] = useState<boolean>(true);
  const [activeSubNav, setActiveSubNav] = useState<'metrics' | 'objects'>('metrics');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Frozen IA Work Views: 全部指标 (ALL) | 待处理 (ATTENTION) | 草稿 (DRAFT)
  const [activeTab, setActiveTab] = useState<'ALL' | 'ATTENTION' | 'DRAFT'>('ALL');

  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedObject, setSelectedObject] = useState<string>('ALL');
  const [selectedValidation, setSelectedValidation] = useState<string>('ALL');
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Action Menu open row
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Detail Modal / Drawer state
  const [selectedMetricForDetail, setSelectedMetricForDetail] = useState<MetricRegistryRowVM | null>(null);
  const [isImportDrawerOpen, setIsImportDrawerOpen] = useState<boolean>(false);

  // Projected Rows from Domain Source of Truth
  const allMetricRows = useMemo(() => {
    return MOCK_DOMAIN_METRICS.map(projectMetricToRowVM);
  }, []);

  // Counts for Frozen IA Tabs
  const tabCounts = useMemo(() => {
    const totalCount = allMetricRows.length;
    const attentionCount = allMetricRows.filter(
      (m) =>
        m.pendingActionType != null ||
        m.validationStatus === 'FAIL' ||
        m.bindingHealth === 'INVALID' ||
        m.bindingHealth === 'DEGRADED' ||
        (m.status === 'EFFECTIVE' && m.aiReadiness !== 'READY')
    ).length;
    const draftCount = allMetricRows.filter((m) => m.status === 'DRAFT').length;

    return { totalCount, attentionCount, draftCount };
  }, [allMetricRows]);

  // Filtered dataset
  const filteredMetrics = useMemo(() => {
    return allMetricRows.filter((item) => {
      // 1. Frozen IA Tab filter
      if (activeTab === 'ATTENTION') {
        const isAttentionItem =
          item.pendingActionType != null ||
          item.validationStatus === 'FAIL' ||
          item.bindingHealth === 'INVALID' ||
          item.bindingHealth === 'DEGRADED' ||
          (item.status === 'EFFECTIVE' && item.aiReadiness !== 'READY');
        if (!isAttentionItem) return false;
      } else if (activeTab === 'DRAFT') {
        if (item.status !== 'DRAFT') return false;
      }

      // 2. Search query (Metric name, English name, definition, businessObject, calculationSummary)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchEn = item.enName.toLowerCase().includes(q);
        const matchDef = item.definition.toLowerCase().includes(q);
        const matchObj = item.businessObject.toLowerCase().includes(q);
        const matchCalc = item.calculationSummary.toLowerCase().includes(q);
        if (!matchName && !matchEn && !matchDef && !matchObj && !matchCalc) {
          return false;
        }
      }

      // 3. Dropdown filters
      if (selectedDomain !== 'ALL' && item.domain !== selectedDomain) return false;
      if (selectedObject !== 'ALL' && item.businessObject !== selectedObject) return false;
      if (selectedValidation !== 'ALL' && item.validationStatus !== selectedValidation) return false;
      if (selectedOwner !== 'ALL' && item.owner !== selectedOwner) return false;
      if (selectedStatusFilter !== 'ALL' && item.status !== selectedStatusFilter) return false;

      return true;
    });
  }, [
    allMetricRows,
    activeTab,
    searchQuery,
    selectedDomain,
    selectedObject,
    selectedValidation,
    selectedOwner,
    selectedStatusFilter,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDomain('ALL');
    setSelectedObject('ALL');
    setSelectedValidation('ALL');
    setSelectedOwner('ALL');
    setSelectedStatusFilter('ALL');
    addToast?.('info', '筛选已重置', '已恢复默认展示状态');
  };

  // Helper renderer for Attention Badge
  const renderAttentionBadge = (type?: MetricPendingActionType) => {
    if (!type) return null;
    switch (type) {
      case 'BINDING_ISSUE':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
            <Link2Off className="w-3 h-3 text-[#DC2626]" />
            <span>Binding 失效</span>
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]">
            <GitMerge className="w-3 h-3 text-[#7E22CE]" />
            <span>口径语义冲突</span>
          </span>
        );
      case 'CONTEXT_VARIANT':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            <Split className="w-3 h-3 text-[#2563EB]" />
            <span>场景派生待收敛</span>
          </span>
        );
      case 'MISSING_MEANING':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
            <FileQuestion className="w-3 h-3 text-[#D97706]" />
            <span>缺失核心语义</span>
          </span>
        );
      case 'HIGH_IMPACT_CHANGE':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]">
            <Zap className="w-3 h-3 text-[#E11D48]" />
            <span>高影响变更</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] font-sans antialiased">
      {/* ========================================================= */}
      {/* LEFT FIXED NAVIGATION (220px - 240px)                     */}
      {/* ========================================================= */}
      <aside className="w-[230px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none z-10 shadow-2xs">
        {/* Navigation Items List */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1 text-xs">
          {/* 1. 首页 */}
          <button
            onClick={() => {
              setActiveNav('semantics');
              onNavigateToHome?.();
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all text-left cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#64748B]" />
            <span>首页</span>
          </button>

          {/* 2. 数据连接 */}
          <button
            onClick={() => {
              addToast?.('info', '数据连接', '查看企业异构数据源与元数据采集连接');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all text-left cursor-pointer"
          >
            <Database className="w-4 h-4 text-[#64748B]" />
            <span>数据连接</span>
          </button>

          {/* 3. 数据资产 */}
          <button
            onClick={() => {
              onNavigateToDataAssets?.();
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all text-left cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#64748B]" />
            <span>数据资产</span>
          </button>

          {/* 4. 数据标准 */}
          <button
            onClick={() => {
              onNavigateToDataStandards?.();
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all text-left cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#64748B]" />
            <span>数据标准</span>
          </button>

          {/* 5. 数据质量 */}
          <button
            onClick={() => {
              addToast?.('info', '数据质量', '查看数据质量校验规则、探查分布与监控指标');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all text-left cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#64748B]" />
            <span>数据质量</span>
          </button>

          {/* 6. 业务语义 (一级高亮并展开, 仅保留一层) */}
          <div className="pt-0.5">
            <button
              onClick={() => setSemanticsExpanded(!semanticsExpanded)}
              className="w-full px-3 py-2 rounded-md flex items-center justify-between transition-all text-left cursor-pointer bg-[#EFF6FF] text-[#2563EB] font-bold"
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span>业务语义</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#2563EB] transition-transform duration-200 ${
                  semanticsExpanded ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {/* 二级展开项: 业务对象 / 指标 */}
            {semanticsExpanded && (
              <div className="mt-1.5 pl-3 space-y-1 border-l-2 border-[#DBEAFE] ml-3.5">
                {/* 业务对象 (Amber 风格) */}
                <button
                  onClick={() => {
                    setActiveSubNav('objects');
                    onNavigateToBusinessObject?.();
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center space-x-2.5 transition-all text-left group cursor-pointer ${
                    activeSubNav === 'objects'
                      ? 'bg-[#FFFBEB] text-[#B45309] font-bold border border-[#FDE68A]'
                      : 'text-[#475569] hover:bg-[#FFFBEB]/70 hover:text-[#92400E]'
                  }`}
                >
                  <div className="w-5 h-5 rounded-md bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0">
                    <FolderTree className="w-3 h-3 text-[#D97706]" />
                  </div>
                  <span className="text-xs">业务对象</span>
                </button>

                {/* 指标 (Purple 风格) */}
                <button
                  onClick={() => {
                    setActiveSubNav('metrics');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center space-x-2.5 transition-all text-left group cursor-pointer ${
                    activeSubNav === 'metrics'
                      ? 'bg-[#F5F3FF] text-[#6D28D9] font-bold border border-[#DDD6FE]'
                      : 'text-[#475569] hover:bg-[#F5F3FF]/70 hover:text-[#5B21B6]'
                  }`}
                >
                  <div className="w-5 h-5 rounded-md bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] shrink-0">
                    <BarChart3 className="w-3 h-3 text-[#7C3AED]" />
                  </div>
                  <span className="text-xs">指标</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. 服务超市 */}
          <button
            onClick={() => {
              addToast?.('info', '服务超市', '查看企业数据服务、API 与语义消费入口');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all text-left cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#64748B]" />
            <span>服务超市</span>
          </button>

          {/* 8. 知识网络 */}
          <button
            onClick={() => {
              addToast?.('info', '知识网络', '查看企业实体拓扑与多模态知识图谱网络');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all text-left cursor-pointer"
          >
            <Network className="w-4 h-4 text-[#64748B]" />
            <span>知识网络</span>
          </button>

          {/* 9. AI 工作台 */}
          <button
            onClick={() => {
              onNavigateToHome?.();
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all text-left cursor-pointer"
          >
            <Bot className="w-4 h-4 text-[#64748B]" />
            <span>AI 工作台</span>
          </button>
        </div>

        {/* Left Bottom Light Branding */}
        <div className="p-3.5 border-t border-[#EEF2F6] bg-[#F8FAFC]">
          <div className="flex items-center space-x-2 text-[11px] text-[#667085]">
            <div className="w-4 h-4 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
            <span className="font-medium">
              AI Partner: <strong className="text-[#172033] font-semibold">Xino｜犀诺</strong>
            </span>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA                                         */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F7F9FC]">
        {/* TOP SECTION: Breadcrumb + Title & Subtitle + Single Primary Action */}
        <div className="bg-white border-b border-[#E6EAF0] px-8 pt-5 pb-5 shadow-2xs">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-xs text-[#667085] mb-2 font-normal">
            <span>业务语义</span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="font-semibold text-[#172033]">指标</span>
          </div>

          {/* Title Row + Subtitle + Action Button */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline space-x-3">
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                  指标
                </h1>
                <span className="text-xs font-mono text-[#667085]">
                  Metric Registry
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-1">
                统一定义和管理企业正式业务指标，持续校验其业务语义、计算口径与数据实现。
              </p>
            </div>

            {/* Actions: 导入已有指标 + 新建指标 (Unified Route to Metric Authoring) */}
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => setIsImportDrawerOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded-md transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#64748B]" />
                <span>导入已有指标</span>
              </button>

              <button
                onClick={() => {
                  onNavigateToCreateMetric?.('draft');
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>新建指标</span>
              </button>
            </div>
          </div>

          {/* 3. Search Bar: Width approx 56% */}
          <div className="mt-4 w-full md:w-[56%]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索指标名称、业务含义、业务对象，或描述你想衡量的问题"
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#172033] placeholder-[#94A3B8] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#64748B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 4. Frozen IA Tabs: 全部指标 | 待处理 | 草稿 */}
          <div className="mt-4 flex items-center space-x-6 border-b border-[#EEF2F6] text-xs font-medium">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'ALL'
                  ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              <span>全部指标</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-mono ${
                  activeTab === 'ALL'
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {tabCounts.totalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ATTENTION')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'ATTENTION'
                  ? 'text-[#DC2626] font-bold border-b-2 border-[#DC2626]'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              <div className="flex items-center space-x-1">
                <span>待处理</span>
                {tabCounts.attentionCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] inline-block" />
                )}
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-mono ${
                  activeTab === 'ATTENTION'
                    ? 'bg-[#FEF2F2] text-[#DC2626] font-bold'
                    : tabCounts.attentionCount > 0
                    ? 'bg-[#FEF2F2] text-[#DC2626]'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {tabCounts.attentionCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DRAFT')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'DRAFT'
                  ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              <span>草稿</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-mono ${
                  activeTab === 'DRAFT'
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {tabCounts.draftCount}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* WORKSPACE MAIN BODY: Summary + Filter + Table             */}
        {/* ========================================================= */}
        <div className="p-8 space-y-4">
          
          {/* 5. Lightweight AI Summary Bar */}
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E6EAF0] px-4 py-2.5 rounded-md text-xs text-[#475569]">
            <div className="flex items-center space-x-2">
              <span className="text-[#7C3AED] font-bold text-sm">✦</span>
              <span>
                AI 正在持续校验 <strong className="font-semibold text-[#172033]">{tabCounts.totalCount}</strong> 个指标的业务语义与数据实现，其中{' '}
                <button
                  onClick={() => setActiveTab('ATTENTION')}
                  className="text-[#DC2626] font-bold hover:underline cursor-pointer inline-flex items-center space-x-0.5"
                >
                  <span>{tabCounts.attentionCount} 项需要处理</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                （包含 Binding 异常、口径冲突与场景派生待收敛）。
              </span>
            </div>
            <div className="text-[#94A3B8] text-[11px] font-mono">
              Semovix V1.2 实时治理引擎 · 最近检查：2 分钟前
            </div>
          </div>

          {/* 6. Filter Bar: Dropdowns + Reset */}
          <div className="bg-white border border-[#E6EAF0] p-3 rounded-md flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {/* Filter 1: 业务域 */}
              <div className="flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#E6EAF0] px-2.5 py-1 rounded-md">
                <span className="text-[#667085]">业务域:</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-transparent font-medium text-[#172033] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">全部业务域</option>
                  <option value="交易分析">交易分析</option>
                  <option value="人口服务">人口服务</option>
                  <option value="公共服务">公共服务</option>
                  <option value="企业服务">企业服务</option>
                  <option value="客户运营">客户运营</option>
                  <option value="销售分析">销售分析</option>
                </select>
              </div>

              {/* Filter 2: 业务对象 */}
              <div className="flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#E6EAF0] px-2.5 py-1 rounded-md">
                <span className="text-[#667085]">业务对象:</span>
                <select
                  value={selectedObject}
                  onChange={(e) => setSelectedObject(e.target.value)}
                  className="bg-transparent font-medium text-[#172033] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">全部业务对象</option>
                  <option value="订单">订单</option>
                  <option value="自然人">自然人</option>
                  <option value="服务工单">服务工单</option>
                  <option value="企业">企业</option>
                  <option value="客户">客户</option>
                </select>
              </div>

              {/* Filter 3: 验证状态 */}
              <div className="flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#E6EAF0] px-2.5 py-1 rounded-md">
                <span className="text-[#667085]">验证状态:</span>
                <select
                  value={selectedValidation}
                  onChange={(e) => setSelectedValidation(e.target.value)}
                  className="bg-transparent font-medium text-[#172033] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">全部验证状态</option>
                  <option value="PASS">验证通过</option>
                  <option value="UNVERIFIED">待验证</option>
                  <option value="FAIL">验证失败</option>
                </select>
              </div>

              {/* Filter 4: Owner */}
              <div className="flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#E6EAF0] px-2.5 py-1 rounded-md">
                <span className="text-[#667085]">Owner:</span>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="bg-transparent font-medium text-[#172033] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">全部责任主体</option>
                  <option value="交易分析与财务核算组">交易分析与财务核算组</option>
                  <option value="人口管理处">人口管理处</option>
                  <option value="热线管理处">热线管理处</option>
                  <option value="企业服务中心">企业服务中心</option>
                  <option value="用户运营组">用户运营组</option>
                  <option value="销售分析组">销售分析组</option>
                  <option value="运营质控组">运营质控组</option>
                </select>
              </div>

              {/* Filter 5: 状态 (DEPRECATED is available here) */}
              <div className="flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#E6EAF0] px-2.5 py-1 rounded-md">
                <span className="text-[#667085]">指标状态:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-transparent font-medium text-[#172033] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">全部状态</option>
                  <option value="EFFECTIVE">正式有效 (EFFECTIVE)</option>
                  <option value="DRAFT">草稿 (DRAFT)</option>
                  <option value="DEPRECATED">已停用 (DEPRECATED)</option>
                </select>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#667085] hover:text-[#2563EB] flex items-center space-x-1 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          </div>

          {/* 7. Metric Registry Table */}
          <div className="bg-white border border-[#E6EAF0] rounded-md shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                {/* Table Header */}
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#667085] font-semibold">
                    <th className="py-3 px-4 w-[20%]">指标</th>
                    <th className="py-3 px-4 w-[22%]">业务语义定义</th>
                    <th className="py-3 px-3 w-[9%]">业务对象</th>
                    <th className="py-3 px-4 w-[14%]">计算摘要</th>
                    <th className="py-3 px-3 w-[11%]">时间语义</th>
                    <th className="py-3 px-3 w-[9%]">验证状态</th>
                    <th className="py-3 px-3 w-[8%]">生命周期</th>
                    <th className="py-3 px-3 w-[8%]">AI 就绪</th>
                    <th className="py-3 px-3 w-[8%]">Owner</th>
                    <th className="py-3 px-3 w-[4%] text-center">操作</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-[#EEF2F6]">
                  {filteredMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#667085]">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <BarChart3 className="w-8 h-8 text-[#CBD5E1]" />
                          <p className="text-sm font-medium text-[#172033]">未找到符合条件的指标</p>
                          <p className="text-xs text-[#94A3B8]">请尝试调整筛选条件或搜索关键词</p>
                          <button
                            onClick={handleResetFilters}
                            className="mt-2 px-3 py-1.5 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-md hover:bg-[#DBEAFE] transition-colors cursor-pointer"
                          >
                            重置全部筛选
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMetrics.map((metric) => (
                      <tr
                        key={metric.id}
                        onClick={() => setSelectedMetricForDetail(metric)}
                        className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                      >
                        {/* 1. 指标 (业务域轻量标签 + 中文名称 + 英文标识 + 待处理提醒) */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col space-y-0.5">
                            {/* Domain badge & Attention Badge */}
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span className="text-[10px] text-[#667085] bg-[#F1F5F9] px-1.5 py-0.2 rounded font-medium border border-[#E2E8F0]">
                                {metric.domain}
                              </span>
                              {renderAttentionBadge(metric.pendingActionType)}
                            </div>

                            {/* Main Chinese Name */}
                            <div className="flex items-center space-x-1.5 pt-0.5">
                              <span className="font-bold text-sm text-[#172033] group-hover:text-[#2563EB] transition-colors">
                                {metric.name}
                              </span>
                            </div>

                            {/* Sub English Name */}
                            <span className="text-[11px] text-[#667085] italic font-normal">
                              {metric.enName}
                            </span>

                            {/* Optional secondary dimension badge */}
                            {metric.dimensionCount > 0 && (
                              <div className="pt-0.5">
                                <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded font-medium">
                                  {metric.dimensionCount} 个分析维度
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 2. 业务语义定义 */}
                        <td className="py-3.5 px-4 text-[#334155] leading-relaxed">
                          <p className="line-clamp-2">{metric.definition}</p>
                        </td>

                        {/* 3. 业务对象 */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] rounded text-[11px] font-medium">
                            {metric.businessObject}
                          </span>
                        </td>

                        {/* 4. 计算摘要 */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#1E293B]">
                          {metric.calculationSummary}
                        </td>

                        {/* 5. 时间语义 */}
                        <td className="py-3.5 px-3 text-[#334155] text-xs">
                          {metric.timeSemantics}
                        </td>

                        {/* 6. 验证状态 (PASS / UNVERIFIED / FAIL) */}
                        <td className="py-3.5 px-3">
                          {metric.validationStatus === 'PASS' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0] rounded text-[11px] font-medium">
                              <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
                              <span>验证通过</span>
                            </span>
                          ) : metric.validationStatus === 'UNVERIFIED' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded text-[11px] font-medium">
                              <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                              <span>待验证</span>
                            </span>
                          ) : (
                            <div className="relative group/tip inline-flex items-center space-x-1">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FEF2F2] text-[#E45454] border border-[#FECACA] rounded text-[11px] font-medium">
                                <XCircle className="w-3 h-3 text-[#E45454]" />
                                <span>验证失败</span>
                              </span>
                              <div className="cursor-help text-[#E45454] hover:text-[#B91C1C]">
                                <Info className="w-3.5 h-3.5" />
                              </div>
                              {/* Hover Tooltip */}
                              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/tip:block z-30 w-60 bg-[#1E293B] text-white text-[11px] rounded p-2.5 shadow-lg leading-snug">
                                <div className="font-bold text-[#FCA5A5] mb-1">校验异常原因</div>
                                {metric.validationMessage || '时间字段 Binding 已失效，当前问数能力受限。'}
                                <div className="absolute top-full left-3 -mt-1 border-4 border-transparent border-t-[#1E293B]" />
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 7. 生命周期状态 (EFFECTIVE / DRAFT / DEPRECATED) */}
                        <td className="py-3.5 px-3">
                          {metric.status === 'EFFECTIVE' ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0] rounded text-[11px] font-medium">
                              正式有效
                            </span>
                          ) : metric.status === 'DRAFT' ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-[#F8FAFC] text-[#667085] border border-[#E2E8F0] rounded text-[11px] font-medium">
                              草稿
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 bg-[#F1F5F9] text-[#94A3B8] rounded text-[11px] font-medium">
                              已停用
                            </span>
                          )}
                        </td>

                        {/* 8. AI 就绪 (READY / DEGRADED / NOT_READY) */}
                        <td className="py-3.5 px-3">
                          {metric.aiReadiness === 'READY' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] rounded text-[11px] font-medium">
                              <span>✦</span>
                              <span>AI 可用</span>
                            </span>
                          ) : metric.aiReadiness === 'DEGRADED' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded text-[11px] font-medium">
                              <span>降级受限</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 bg-[#F1F5F9] text-[#94A3B8] rounded text-[11px] font-medium">
                              未就绪
                            </span>
                          )}
                        </td>

                        {/* 9. Owner */}
                        <td className="py-3.5 px-3 text-[#334155] font-medium">
                          {metric.owner}
                        </td>

                        {/* 10. 操作 */}
                        <td
                          className="py-3.5 px-3 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setActionMenuOpenId(actionMenuOpenId === metric.id ? null : metric.id);
                            }}
                            className="p-1 rounded hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#172033] cursor-pointer transition-colors"
                            title="更多操作"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Popover Action Menu */}
                          {actionMenuOpenId === metric.id && (
                            <div className="absolute right-2 top-10 w-36 bg-white border border-[#E6EAF0] rounded-md shadow-lg py-1 z-20 text-left text-xs">
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  if (onNavigateToMetricDetail) {
                                    onNavigateToMetricDetail(metric.id);
                                  } else {
                                    setSelectedMetricForDetail(metric);
                                  }
                                }}
                                className="w-full px-3 py-1.5 text-[#334155] hover:bg-[#EFF6FF] hover:text-[#2563EB] flex items-center space-x-2 text-left font-medium cursor-pointer"
                              >
                                <span>查看事实详情页</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  onNavigateToCreateMetric?.('change_draft');
                                  addToast?.('info', '发起口径变更', `已为「${metric.name}」创建变更申请草稿空间`);
                                }}
                                className="w-full px-3 py-1.5 text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB] flex items-center space-x-2 text-left cursor-pointer"
                              >
                                <span>发起变更</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  addToast?.('success', '语义重新校验', `Xino 已针对「${metric.name}」触发物理表与计算引擎 Binding 校验`);
                                }}
                                className="w-full px-3 py-1.5 text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB] flex items-center space-x-2 text-left cursor-pointer"
                              >
                                <span>重新校验</span>
                              </button>
                              <div className="my-1 border-t border-[#EEF2F6]" />
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  addToast?.('info', '导出定义', `已导出「${metric.name}」的标准语义 JSON/YAML 描述`);
                                }}
                                className="w-full px-3 py-1.5 text-[#64748B] hover:bg-[#F8FAFC] text-left cursor-pointer"
                              >
                                <span>导出定义</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 border-t border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#667085]">
              <div>
                共展示 <span className="font-semibold text-[#172033] font-mono">{filteredMetrics.length}</span> 项指标
                {filteredMetrics.length < allMetricRows.length && (
                  <span className="text-[#94A3B8] ml-1.5">（已从全部 {allMetricRows.length} 项中过滤）</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-[11px] text-[#667085]">Semovix V1.2 语义智能持续校验服务运行中</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* METRIC DETAIL DRAWER                                      */}
      {/* ========================================================= */}
      {selectedMetricForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-2xs">
          <div className="w-[520px] h-full bg-white shadow-2xl flex flex-col border-l border-[#E6EAF0] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#667085] bg-white border border-[#CBD5E1] px-1.5 py-0.2 rounded font-medium">
                    {selectedMetricForDetail.domain}
                  </span>
                  <span className="text-xs text-[#667085] font-mono">
                    {selectedMetricForDetail.enName}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#172033] mt-0.5">
                  {selectedMetricForDetail.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMetricForDetail(null)}
                className="p-1.5 rounded-md hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Validation / Binding Alert if Issue Exists */}
              {selectedMetricForDetail.validationStatus === 'FAIL' && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-[#E45454] space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <XCircle className="w-4 h-4 text-[#E45454]" />
                    <span>执行层绑定校验异常</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#991B1B]">
                    {selectedMetricForDetail.validationMessage ||
                      '时间字段 Binding 已失效（底层字段 rename 未同步），物理层时间口径无法对齐。'}
                  </p>
                  <p className="text-[10px] text-[#7F1D1D] pt-0.5">
                    💡 提示：该指标业务定义（Semantic Status）依然保持正式有效，仅需重新对齐物理层执行绑定。
                  </p>
                </div>
              )}

              {/* Basic Semantic Definition */}
              <div className="space-y-2">
                <span className="font-bold text-[#172033] text-sm">业务语义定义</span>
                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[#334155] leading-relaxed">
                  {selectedMetricForDetail.definition}
                </div>
              </div>

              {/* Core Attributes Grid */}
              <div className="space-y-2">
                <span className="font-bold text-[#172033] text-sm">指标核心属性</span>
                <div className="border border-[#E6EAF0] rounded-md divide-y divide-[#EEF2F6] bg-white">
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-[#667085]">衡量业务对象</span>
                    <span className="font-bold text-[#172033] bg-[#F1F5F9] px-2 py-0.5 rounded">
                      {selectedMetricForDetail.businessObject}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-[#667085]">计算公式 / 聚合摘要</span>
                    <span className="font-mono font-bold text-[#2563EB]">
                      {selectedMetricForDetail.calculationSummary}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-[#667085]">时间语义 (字段 · 粒度)</span>
                    <span className="font-medium text-[#172033]">
                      {selectedMetricForDetail.timeSemantics}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-[#667085]">责任团队 (Owner)</span>
                    <span className="font-medium text-[#172033]">
                      {selectedMetricForDetail.owner}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-[#667085]">业务语义生命周期</span>
                    <span
                      className={`font-medium px-2 py-0.5 rounded text-[11px] ${
                        selectedMetricForDetail.status === 'EFFECTIVE'
                          ? 'bg-[#ECFDF5] text-[#16A36A]'
                          : selectedMetricForDetail.status === 'DRAFT'
                          ? 'bg-[#F1F5F9] text-[#475569]'
                          : 'bg-[#FEF2F2] text-[#DC2626]'
                      }`}
                    >
                      {selectedMetricForDetail.status === 'EFFECTIVE'
                        ? '正式有效 (EFFECTIVE)'
                        : selectedMetricForDetail.status === 'DRAFT'
                        ? '草稿 (DRAFT)'
                        : '已停用 (DEPRECATED)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-[#667085]">执行层 Binding 健康度</span>
                    <span
                      className={`font-medium px-2 py-0.5 rounded text-[11px] ${
                        selectedMetricForDetail.bindingHealth === 'HEALTHY'
                          ? 'bg-[#ECFDF5] text-[#16A36A]'
                          : selectedMetricForDetail.bindingHealth === 'DEGRADED'
                          ? 'bg-[#FFFBEB] text-[#D97706]'
                          : 'bg-[#FEF2F2] text-[#DC2626]'
                      }`}
                    >
                      {selectedMetricForDetail.bindingHealth === 'HEALTHY'
                        ? '正常 (HEALTHY)'
                        : selectedMetricForDetail.bindingHealth === 'DEGRADED'
                        ? '降级 (DEGRADED)'
                        : '失效 (INVALID)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Binding & AI Reasoning */}
              <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-[#1E40AF]">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span>Xino 语义实现绑定与血缘</span>
                </div>
                <p className="text-[11px] text-[#334155] leading-relaxed">
                  {selectedMetricForDetail.originalMetric.binding
                    ? `已绑定物理表「${selectedMetricForDetail.originalMetric.binding.tableName}」，度量字段为「${selectedMetricForDetail.originalMetric.binding.measureField}」。`
                    : '当前指标尚未完成物理表绑定，处于语义草稿阶段。'}
                </p>
                <div className="pt-1 flex items-center space-x-2 text-[11px]">
                  <span className="text-[#059669] font-medium">✓ 语义对象对齐</span>
                  <span className="text-[#64748B]">·</span>
                  <span className="text-[#059669] font-medium">
                    {selectedMetricForDetail.dimensionCount} 个维度路径
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#E6EAF0] bg-white flex items-center justify-between">
              <button
                onClick={() => {
                  const id = selectedMetricForDetail.id;
                  setSelectedMetricForDetail(null);
                  if (onNavigateToMetricDetail) {
                    onNavigateToMetricDetail(id);
                  }
                }}
                className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-md font-semibold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                <span>进入完整事实详情页</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedMetricForDetail(null)}
                  className="px-3.5 py-1.5 border border-[#E6EAF0] text-[#334155] hover:bg-[#F8FAFC] rounded-md font-medium text-xs cursor-pointer"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    setSelectedMetricForDetail(null);
                    onNavigateToCreateMetric?.('change_draft');
                    addToast?.('info', '发起口径变更', `已打开「${selectedMetricForDetail.name}」的变更草稿空间`);
                  }}
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md font-bold text-xs cursor-pointer"
                >
                  发起口径变更
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* IMPORT EXISTING METRIC DRAWER                             */}
      {/* ========================================================= */}
      <ImportExistingMetricDrawer
        isOpen={isImportDrawerOpen}
        onClose={() => setIsImportDrawerOpen(false)}
        onImportMetric={(candidate) => {
          setIsImportDrawerOpen(false);
          const initialDraftData: MetricDraftInitialData = {
            metricName: candidate.suggestedName,
            businessDefinition:
              candidate.suggestedDefinition ||
              `基于存量口径「${candidate.originalName}」结构化形成的业务指标定义。`,
            businessObject: candidate.suggestedBusinessObject,
            scopeText: candidate.suggestedScope,
            timeSemanticsText: candidate.suggestedTime,
            timeGrains: ['日', '月', '季', '年'],
            dimensions: candidate.suggestedDimensions || ['渠道', '业务线', '区域'],
            aggregation: candidate.suggestedAggregation || 'SUM',
            measureField: candidate.suggestedMeasureField,
            businessRuleFilter: candidate.suggestedFilter,
            tableName: candidate.suggestedTableName,
            timeField: candidate.suggestedTimeField,
            importSource: {
              sourceType: candidate.sourceType,
              sourceName: candidate.sourceName,
              sourceLocation: candidate.sourceLocation,
              originalName: candidate.originalName,
              originalExpression: candidate.originalExpression,
              parseStatus: candidate.parseStatus,
              supplementNeeds: candidate.supplementNeeds,
            },
          };
          if (onNavigateToCreateMetric) {
            onNavigateToCreateMetric('imported_draft', initialDraftData);
          }
        }}
        addToast={addToast}
      />
    </div>
  );
};
