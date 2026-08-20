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
  ExternalLink,
  Filter,
  ArrowUpDown,
  Calendar,
  User,
  X,
  TrendingUp,
  Cpu,
  Check,
  Download
} from 'lucide-react';
import { ImportExistingMetricDrawer } from './ImportExistingMetricDrawer';

interface MetricItem {
  id: string;
  name: string;
  enName: string;
  domain: string;
  definition: string;
  businessObject: string;
  calculationSummary: string;
  timeSemantics: string;
  validationStatus: 'PASSED' | 'PENDING' | 'FAILED';
  validationMessage?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'DEPRECATED';
  owner: string;
  dimensionCount?: number;
}

const MOCK_METRICS_DATA: MetricItem[] = [
  {
    id: 'met_valid_order_amount',
    name: '有效订单金额',
    enName: 'Valid Order Amount',
    domain: '交易分析',
    definition: '满足“有效订单”业务规则的订单金额合计，用于衡量一定统计周期内形成的有效订单交易规模。',
    businessObject: '订单',
    calculationSummary: 'SUM(order_amount)',
    timeSemantics: '支付时间 · 日',
    validationStatus: 'PASSED',
    status: 'PUBLISHED',
    owner: '交易分析与财务核算组',
    dimensionCount: 6,
  },
  {
    id: 'met_001',
    name: '老龄化率',
    enName: 'Aging Ratio',
    domain: '人口服务',
    definition: '60岁及以上常住人口占全部常住人口的比例',
    businessObject: '自然人',
    calculationSummary: '老年人口数 ÷ 常住人口数',
    timeSemantics: '统计日期 · 月',
    validationStatus: 'PASSED',
    status: 'PUBLISHED',
    owner: '人口管理处',
    dimensionCount: 5,
  },
  {
    id: 'met_002',
    name: '工单办结率',
    enName: 'Ticket Closure Rate',
    domain: '公共服务',
    definition: '统计周期内已办结工单占全部工单的比例',
    businessObject: '服务工单',
    calculationSummary: '已办结工单数 ÷ 工单总数',
    timeSemantics: '办结时间 · 月',
    validationStatus: 'PASSED',
    status: 'PUBLISHED',
    owner: '热线管理处',
    dimensionCount: 4,
  },
  {
    id: 'met_003',
    name: '平均工单处理时长',
    enName: 'Average Ticket Processing Time',
    domain: '公共服务',
    definition: '统计周期内工单从受理到办结的平均处理时长',
    businessObject: '服务工单',
    calculationSummary: '工单处理总时长 ÷ 工单数',
    timeSemantics: '办结时间 · 月',
    validationStatus: 'PENDING',
    status: 'DRAFT',
    owner: '热线管理处',
  },
  {
    id: 'met_004',
    name: '月活企业数',
    enName: 'Monthly Active Enterprises',
    domain: '企业服务',
    definition: '统计月内发生有效业务行为的企业数量',
    businessObject: '企业',
    calculationSummary: 'COUNT DISTINCT 企业ID',
    timeSemantics: '行为时间 · 月',
    validationStatus: 'PASSED',
    status: 'PUBLISHED',
    owner: '企业服务中心',
    dimensionCount: 6,
  },
  {
    id: 'met_005',
    name: '新增企业数',
    enName: 'New Enterprise Count',
    domain: '企业服务',
    definition: '统计周期内新注册企业数量',
    businessObject: '企业',
    calculationSummary: 'COUNT DISTINCT 企业ID',
    timeSemantics: '注册时间 · 月',
    validationStatus: 'PASSED',
    status: 'PUBLISHED',
    owner: '企业服务中心',
  },
  {
    id: 'met_006',
    name: '客户流失率',
    enName: 'Customer Churn Rate',
    domain: '客户运营',
    definition: '统计周期内流失客户占活跃客户的比例',
    businessObject: '客户',
    calculationSummary: '流失客户数 ÷ 活跃客户数',
    timeSemantics: '统计月份 · 月',
    validationStatus: 'PENDING',
    status: 'DRAFT',
    owner: '用户运营组',
  },
  {
    id: 'met_007',
    name: '客单价',
    enName: 'Average Order Value',
    domain: '销售分析',
    definition: '统计周期内平均每笔订单金额',
    businessObject: '订单',
    calculationSummary: '销售额 ÷ 订单数',
    timeSemantics: '支付时间 · 日',
    validationStatus: 'PASSED',
    status: 'PUBLISHED',
    owner: '销售分析组',
    dimensionCount: 8,
  },
  {
    id: 'met_008',
    name: '投诉率',
    enName: 'Complaint Rate',
    domain: '公共服务',
    definition: '统计周期内投诉工单占全部服务工单的比例',
    businessObject: '服务工单',
    calculationSummary: '投诉工单数 ÷ 工单总数',
    timeSemantics: '受理时间 · 月',
    validationStatus: 'FAILED',
    validationMessage: '时间字段 Binding 已失效，当前问数能力受限。',
    status: 'DRAFT',
    owner: '运营质控组',
  },
  {
    id: 'met_009',
    name: '复购率',
    enName: 'Repurchase Rate',
    domain: '客户运营',
    definition: '统计周期内产生复购客户占全部客户的比例',
    businessObject: '客户',
    calculationSummary: '复购客户数 ÷ 客户总数',
    timeSemantics: '统计月份 · 月',
    validationStatus: 'PASSED',
    status: 'PUBLISHED',
    owner: '用户运营组',
    dimensionCount: 3,
  },
];

interface MetricRegistryWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToBusinessObject?: () => void;
  onNavigateToDataStandards?: () => void;
  onNavigateToDataSemantics?: () => void;
  onNavigateToDataAssets?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToCreateMetric?: () => void;
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
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'DEPRECATED'>('PUBLISHED');

  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedObject, setSelectedObject] = useState<string>('ALL');
  const [selectedValidation, setSelectedValidation] = useState<string>('ALL');
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Active Menu action row
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Detail Modal / Drawer state
  const [selectedMetricForDetail, setSelectedMetricForDetail] = useState<MetricItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isImportDrawerOpen, setIsImportDrawerOpen] = useState<boolean>(false);

  // New Metric Form State
  const [newMetricForm, setNewMetricForm] = useState({
    name: '',
    enName: '',
    domain: '公共服务',
    businessObject: '服务工单',
    definition: '',
    calculationSummary: '',
    timeSemantics: '统计日期 · 月',
    owner: '运营质控组',
  });

  // Filtered dataset
  const filteredMetrics = useMemo(() => {
    return MOCK_METRICS_DATA.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'PUBLISHED' && item.status !== 'PUBLISHED') return false;
      if (activeTab === 'DRAFT' && item.status !== 'DRAFT') return false;
      if (activeTab === 'DEPRECATED' && item.status !== 'DEPRECATED') return false;

      // 2. Search query (Metric name, English name, definition, businessObject)
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

  const handleCreateMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricForm.name.trim()) {
      addToast?.('error', '请填写指标名称', '指标名称为必填项');
      return;
    }
    setIsCreateModalOpen(false);
    addToast?.('success', '指标创建成功', `已成功新建指标「${newMetricForm.name}」，Xino 正在自动执行语义绑定推导与验证`);
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

            {/* 二级展开项: 业务对象 / 指标 / 数据语义 / 数据标准 */}
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

        {/* Left Bottom Light Branding: AI Partner: Xino｜犀诺 */}
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

            {/* Actions: 导入已有指标 + 新建指标 */}
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
                  if (onNavigateToCreateMetric) {
                    onNavigateToCreateMetric();
                  } else {
                    setIsCreateModalOpen(true);
                  }
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

          {/* 4. Tabs: 全部 128 | 已发布 108 | 草稿 12 | 已停用 8 */}
          <div className="mt-4 flex items-center space-x-6 border-b border-[#EEF2F6] text-xs font-medium">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'ALL'
                  ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              <span>全部</span>
              <span className="px-1.5 py-0.2 rounded text-[11px] bg-[#F1F5F9] text-[#64748B] font-mono">
                128
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PUBLISHED')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'PUBLISHED'
                  ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              <span>已发布</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-mono ${
                  activeTab === 'PUBLISHED'
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                108
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
              <span className="px-1.5 py-0.2 rounded text-[11px] bg-[#F1F5F9] text-[#64748B] font-mono">
                12
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DEPRECATED')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'DEPRECATED'
                  ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              <span>已停用</span>
              <span className="px-1.5 py-0.2 rounded text-[11px] bg-[#F1F5F9] text-[#64748B] font-mono">
                8
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
                AI 正在持续校验 <strong className="font-semibold text-[#172033]">108</strong> 个已发布指标的业务语义与数据实现，其中{' '}
                <span className="text-[#E45454] font-semibold">12</span> 项需要关注。
              </span>
            </div>
            <div className="text-[#94A3B8] text-[11px] font-mono">
              最近一次检查：10 分钟前
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
                  <option value="自然人">自然人</option>
                  <option value="服务工单">服务工单</option>
                  <option value="企业">企业</option>
                  <option value="客户">客户</option>
                  <option value="订单">订单</option>
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
                  <option value="PASSED">验证通过</option>
                  <option value="PENDING">待验证</option>
                  <option value="FAILED">验证失败</option>
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
                  <option value="人口管理处">人口管理处</option>
                  <option value="热线管理处">热线管理处</option>
                  <option value="企业服务中心">企业服务中心</option>
                  <option value="用户运营组">用户运营组</option>
                  <option value="销售分析组">销售分析组</option>
                  <option value="运营质控组">运营质控组</option>
                </select>
              </div>

              {/* Filter 5: 状态 */}
              <div className="flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#E6EAF0] px-2.5 py-1 rounded-md">
                <span className="text-[#667085]">状态:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-transparent font-medium text-[#172033] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">全部状态</option>
                  <option value="PUBLISHED">已发布</option>
                  <option value="DRAFT">草稿</option>
                  <option value="DEPRECATED">已停用</option>
                </select>
              </div>
            </div>

            {/* Reset Button (Light text button on far right) */}
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
                {/* Table Header: No Index Column */}
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#667085] font-semibold">
                    <th className="py-3 px-4 w-[18%]">指标</th>
                    <th className="py-3 px-4 w-[24%]">业务定义</th>
                    <th className="py-3 px-3 w-[10%]">业务对象</th>
                    <th className="py-3 px-4 w-[16%]">计算摘要</th>
                    <th className="py-3 px-3 w-[12%]">时间语义</th>
                    <th className="py-3 px-3 w-[9%]">验证</th>
                    <th className="py-3 px-3 w-[7%]">状态</th>
                    <th className="py-3 px-3 w-[10%]">Owner</th>
                    <th className="py-3 px-3 w-[4%] text-center">操作</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-[#EEF2F6]">
                  {filteredMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#667085]">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <BarChart3 className="w-8 h-8 text-[#CBD5E1]" />
                          <p className="text-sm font-medium text-[#172033]">未找到符合条件的指标</p>
                          <p className="text-xs text-[#94A3B8]">请尝试调整筛选条件或搜索关键词</p>
                          <button
                            onClick={handleResetFilters}
                            className="mt-2 px-3 py-1.5 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-md hover:bg-[#DBEAFE] transition-colors"
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
                        {/* 1. 指标 (业务域轻量标签 + 中文名称字重高 + 英文名称更小更浅 + 个别维度辅助) */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col space-y-0.5">
                            {/* Domain badge */}
                            <div>
                              <span className="text-[10px] text-[#667085] bg-[#F1F5F9] px-1.5 py-0.2 rounded font-medium border border-[#E2E8F0]">
                                {metric.domain}
                              </span>
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
                            {metric.dimensionCount && (
                              <div className="pt-0.5">
                                <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded font-medium">
                                  {metric.dimensionCount} 个分析维度
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 2. 业务定义 */}
                        <td className="py-3.5 px-4 text-[#334155] leading-relaxed">
                          {metric.definition}
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

                        {/* 5. 时间语义 (业务时间字段 · 默认时间粒度) */}
                        <td className="py-3.5 px-3 text-[#334155] text-xs">
                          {metric.timeSemantics}
                        </td>

                        {/* 6. 验证 (通过绿色、待验证橙色、失败红色 + Tooltip 不直接破坏表格行高) */}
                        <td className="py-3.5 px-3">
                          {metric.validationStatus === 'PASSED' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0] rounded text-[11px] font-medium">
                              <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
                              <span>验证通过</span>
                            </span>
                          ) : metric.validationStatus === 'PENDING' ? (
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
                              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/tip:block z-30 w-56 bg-[#1E293B] text-white text-[11px] rounded p-2 shadow-lg leading-snug">
                                {metric.validationMessage || '时间字段 Binding 已失效，当前问数能力受限。'}
                                <div className="absolute top-full left-3 -mt-1 border-4 border-transparent border-t-[#1E293B]" />
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 7. 状态 (已发布 / 草稿 / 已停用) */}
                        <td className="py-3.5 px-3">
                          {metric.status === 'PUBLISHED' ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-[#ECFDF5] text-[#16A36A] rounded text-[11px] font-medium">
                              已发布
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

                        {/* 8. Owner */}
                        <td className="py-3.5 px-3 text-[#334155] font-medium">
                          {metric.owner}
                        </td>

                        {/* 9. 操作 (仅放 ... 按钮) */}
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
                                className="w-full px-3 py-1.5 text-[#334155] hover:bg-[#EFF6FF] hover:text-[#2563EB] flex items-center space-x-2 text-left font-medium"
                              >
                                <span>查看事实详情页</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  addToast?.('info', '发起变更', `已为「${metric.name}」创建变更申请草稿`);
                                }}
                                className="w-full px-3 py-1.5 text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB] flex items-center space-x-2 text-left"
                              >
                                <span>发起变更</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  addToast?.('success', '语义重新校验', `Xino 已针对「${metric.name}」触发物理表与计算引擎 Binding 校验`);
                                }}
                                className="w-full px-3 py-1.5 text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB] flex items-center space-x-2 text-left"
                              >
                                <span>重新校验</span>
                              </button>
                              <div className="my-1 border-t border-[#EEF2F6]" />
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  addToast?.('info', '导出定义', `已导出「${metric.name}」的标准语义 JSON/YAML 描述`);
                                }}
                                className="w-full px-3 py-1.5 text-[#64748B] hover:bg-[#F8FAFC] text-left"
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
                {filteredMetrics.length < MOCK_METRICS_DATA.length && (
                  <span className="text-[#94A3B8] ml-1.5">（已从全部 {MOCK_METRICS_DATA.length} 项中过滤）</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-[11px] text-[#667085]">Semovix 语义智能持续校验服务运行中</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* METRIC DETAIL DRAWER / MODAL                              */}
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
                className="p-1.5 rounded-md hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Validation Alert if Failed */}
              {selectedMetricForDetail.validationStatus === 'FAILED' && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-[#E45454] space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <XCircle className="w-4 h-4 text-[#E45454]" />
                    <span>校验异常告警</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#991B1B]">
                    {selectedMetricForDetail.validationMessage}
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
                    <span className="text-[#667085]">生命周期状态</span>
                    <span className="font-medium text-[#16A36A]">
                      {selectedMetricForDetail.status === 'PUBLISHED' ? '已正式发布' : selectedMetricForDetail.status === 'DRAFT' ? '草稿' : '已停用'}
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
                  该指标已绑定至公共基础模型与实时数仓中间层，支持自然语言问数（NL-to-SQL）与多维交叉分析。
                </p>
                <div className="pt-1 flex items-center space-x-2 text-[11px]">
                  <span className="text-[#059669] font-medium">✓ 字段级血缘已贯通</span>
                  <span className="text-[#64748B]">·</span>
                  <span className="text-[#059669] font-medium">✓ 口径一致性 100%</span>
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
                    addToast?.('success', '发起变更', `已打开「${selectedMetricForDetail.name}」的口径变更申请工单`);
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
      {/* CREATE METRIC MODAL (AI-assisted Metric Authoring)        */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-xl bg-white rounded-lg shadow-xl border border-[#E6EAF0] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  新建业务指标
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  输入指标业务定义与计算口径，Xino 将辅助推导时间语义与物理实现绑定
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateMetric} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    指标名称 (中文) <span className="text-[#E45454]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：办结满意率"
                    value={newMetricForm.name}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E6EAF0] rounded-md focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    英文标识 (English Name)
                  </label>
                  <input
                    type="text"
                    placeholder="例如：Satisfaction Rate"
                    value={newMetricForm.enName}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, enName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E6EAF0] rounded-md focus:ring-1 focus:ring-[#2563EB] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    所属业务域
                  </label>
                  <select
                    value={newMetricForm.domain}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, domain: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E6EAF0] rounded-md focus:ring-1 focus:ring-[#2563EB] focus:outline-none bg-white"
                  >
                    <option value="公共服务">公共服务</option>
                    <option value="人口服务">人口服务</option>
                    <option value="企业服务">企业服务</option>
                    <option value="客户运营">客户运营</option>
                    <option value="销售分析">销售分析</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    衡量业务对象
                  </label>
                  <select
                    value={newMetricForm.businessObject}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, businessObject: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E6EAF0] rounded-md focus:ring-1 focus:ring-[#2563EB] focus:outline-none bg-white"
                  >
                    <option value="服务工单">服务工单</option>
                    <option value="自然人">自然人</option>
                    <option value="企业">企业</option>
                    <option value="客户">客户</option>
                    <option value="订单">订单</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">
                  业务定义与口径说明
                </label>
                <textarea
                  rows={2}
                  placeholder="清晰描述该指标衡量的实际业务场景与口径边界…"
                  value={newMetricForm.definition}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, definition: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E6EAF0] rounded-md focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    计算摘要 / 聚合公式
                  </label>
                  <input
                    type="text"
                    placeholder="例如：满意工单数 ÷ 评价总工单数"
                    value={newMetricForm.calculationSummary}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, calculationSummary: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E6EAF0] rounded-md focus:ring-1 focus:ring-[#2563EB] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    时间语义 (业务时间 · 粒度)
                  </label>
                  <input
                    type="text"
                    placeholder="例如：评价时间 · 月"
                    value={newMetricForm.timeSemantics}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, timeSemantics: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E6EAF0] rounded-md focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md flex items-center space-x-2 text-xs text-[#1E40AF]">
                <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>保存后，Xino 将自动挂载到语义治理图谱中，并启动物理表 Binding 校验。</span>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 border-t border-[#EEF2F6] flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#E6EAF0] text-[#334155] hover:bg-[#F8FAFC] rounded-md font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-md shadow-2xs"
                >
                  确认新建
                </button>
              </div>
            </form>
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
          if (onNavigateToCreateMetric) {
            onNavigateToCreateMetric();
          }
        }}
        addToast={addToast}
      />
    </div>
  );
};
