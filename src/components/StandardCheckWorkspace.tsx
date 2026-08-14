import React, { useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Layers,
  Database,
  ShieldCheck,
  FolderTree,
  X,
  RefreshCw,
  ChevronDown,
  Filter,
  FileText,
  Building,
  Table,
  Check,
  ArrowRight,
  Eye,
  Info,
  SlidersHorizontal,
  BarChart2,
  PieChart
} from 'lucide-react';

export interface StandardCheckItem {
  id: string;
  standardName: string;
  standardCode: string;
  version: string;
  usedFieldsCount: number;
  compliantCount: number;
  nonCompliantCount: number;
  indeterminateCount: number;
  lastCheckedTime: string;
  status: 'HAS_ISSUES' | 'ALL_COMPLIANT';
  statusLabel: string;
  businessDomain: string;

  // Right Side Standard Requirements
  dataType: string;
  format: string;
  allowNull: string;
  timeZone: string;

  // Top Issues Breakdown
  issues: Array<{
    type: string;
    count: number;
    description: string;
  }>;
  indeterminateReasons?: Array<{
    reason: string;
    count: number;
  }>;
}

const SAMPLE_CHECK_STANDARDS: StandardCheckItem[] = [
  {
    id: 'chk_001',
    standardName: '业务办结时间',
    standardCode: 'DE_CASE_CLOSE_TIME',
    version: 'V3',
    usedFieldsCount: 126,
    compliantCount: 115,
    nonCompliantCount: 7,
    indeterminateCount: 4,
    lastCheckedTime: '今天 10:30',
    status: 'HAS_ISSUES',
    statusLabel: '存在问题',
    businessDomain: '公共服务',

    dataType: 'DATETIME',
    format: 'yyyy-MM-dd HH:mm:ss',
    allowNull: '否',
    timeZone: 'Asia/Shanghai',

    issues: [
      { type: '数据类型偏离', count: 4, description: '4 个物理字段从 DATETIME 被 DDL 修改为 VARCHAR' },
      { type: '必填要求未满足', count: 2, description: '2 个字段在核心表中存在 1.2% 的 NULL 空值' },
      { type: '格式不符合', count: 1, description: '1 个日志历史表中日期仅精确到 yyyy-MM-dd' },
    ],
    indeterminateReasons: [
      { reason: '2 个字段缺少必要数据探查 Profile', count: 2 },
      { reason: '1 个视图字段缺少物理元数据访问权限', count: 1 },
      { reason: '1 个外部挂载数据表值域尚未同步完成', count: 1 },
    ],
  },
  {
    id: 'chk_002',
    standardName: '公民身份号码',
    standardCode: 'DE_PERSON_ID',
    version: 'V5',
    usedFieldsCount: 84,
    compliantCount: 79,
    nonCompliantCount: 3,
    indeterminateCount: 2,
    lastCheckedTime: '今天 10:31',
    status: 'HAS_ISSUES',
    statusLabel: '存在问题',
    businessDomain: '人口基础',

    dataType: 'VARCHAR(18)',
    format: 'ISO/GB 11643',
    allowNull: '否',
    timeZone: 'N/A',

    issues: [
      { type: '长度不符合', count: 2, description: '2 个老旧离线字段定义为 VARCHAR(20)' },
      { type: '值域不符合', count: 1, description: '1 个中间表中包含测试样例字符串 XXXXX' },
    ],
    indeterminateReasons: [
      { reason: '2 个加密字段触发了脱敏安全拦截', count: 2 },
    ],
  },
  {
    id: 'chk_003',
    standardName: '出生日期',
    standardCode: 'DE_BIRTH_DATE',
    version: 'V2',
    usedFieldsCount: 61,
    compliantCount: 61,
    nonCompliantCount: 0,
    indeterminateCount: 0,
    lastCheckedTime: '今天 10:25',
    status: 'ALL_COMPLIANT',
    statusLabel: '全部符合',
    businessDomain: '人口基础',

    dataType: 'DATE',
    format: 'yyyy-MM-dd',
    allowNull: '否',
    timeZone: 'Asia/Shanghai',

    issues: [],
  },
  {
    id: 'chk_004',
    standardName: '性别代码',
    standardCode: 'GENDER_CODE',
    version: 'V2',
    usedFieldsCount: 82,
    compliantCount: 80,
    nonCompliantCount: 1,
    indeterminateCount: 1,
    lastCheckedTime: '今天 10:28',
    status: 'HAS_ISSUES',
    statusLabel: '存在问题',
    businessDomain: '人口基础',

    dataType: 'VARCHAR(2)',
    format: 'GB/T 2261.1 码表',
    allowNull: '否',
    timeZone: 'N/A',

    issues: [
      { type: '值域不符合', count: 1, description: '1 个业务系统自定义使用了 "F/M" 代替国标 "1/2"' },
    ],
    indeterminateReasons: [
      { reason: '1 个实时流数据表样本数不足 100 条', count: 1 },
    ],
  },
];

// Sample Asset View Items
const ASSET_VIEW_ITEMS = [
  {
    assetName: '人口基本信息表 (person_base_info)',
    domain: '人口基础',
    matchedStandardsCount: 32,
    compliantCount: 27,
    nonCompliantCount: 4,
    indeterminateCount: 1,
    status: 'HAS_ISSUES',
    statusLabel: '存在问题',
  },
  {
    assetName: '公共服务热线工单记录表 (public_service_ticket)',
    domain: '公共服务',
    matchedStandardsCount: 26,
    compliantCount: 24,
    nonCompliantCount: 2,
    indeterminateCount: 0,
    status: 'HAS_ISSUES',
    statusLabel: '存在问题',
  },
  {
    assetName: '居民婚姻登记历史表 (marital_status_history)',
    domain: '人口基础',
    matchedStandardsCount: 18,
    compliantCount: 18,
    nonCompliantCount: 0,
    indeterminateCount: 0,
    status: 'ALL_COMPLIANT',
    statusLabel: '全部符合',
  },
];

// Sample Domain View Items
const DOMAIN_VIEW_ITEMS = [
  {
    domainName: '人口服务',
    matchedFieldsCount: 2318,
    compliantCount: 2156,
    nonCompliantCount: 104,
    indeterminateCount: 58,
  },
  {
    domainName: '公共服务',
    matchedFieldsCount: 1824,
    compliantCount: 1751,
    nonCompliantCount: 53,
    indeterminateCount: 20,
  },
  {
    domainName: '社会保障',
    matchedFieldsCount: 1420,
    compliantCount: 1390,
    nonCompliantCount: 18,
    indeterminateCount: 12,
  },
];

interface StandardCheckWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToCatalogTab?: () => void;
  onNavigateToMatchingTab?: () => void;
  onNavigateToDataSemantics?: () => void;
  onNavigateToIssueDetail?: () => void;
}

export const StandardCheckWorkspace: React.FC<StandardCheckWorkspaceProps> = ({
  addToast,
  onNavigateToCatalogTab,
  onNavigateToMatchingTab,
  onNavigateToDataSemantics,
  onNavigateToIssueDetail,
}) => {
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');

  // Status Filter Tabs: 'NON_COMPLIANT' (327) | 'COMPLIANT' (7918) | 'INDETERMINATE' (181) | 'ALL'
  const [statusFilter, setStatusFilter] = useState<'NON_COMPLIANT' | 'COMPLIANT' | 'INDETERMINATE' | 'ALL'>('NON_COMPLIANT');

  // View Switcher: 'BY_STANDARD' | 'BY_ASSET' | 'BY_DOMAIN'
  const [viewMode, setViewMode] = useState<'BY_STANDARD' | 'BY_ASSET' | 'BY_DOMAIN'>('BY_STANDARD');

  // Selected row index for Right Side Context
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [showScopeModal, setShowScopeModal] = useState<boolean>(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [showIssueDetailModal, setShowIssueDetailModal] = useState<boolean>(false);
  const [showIndeterminateModal, setShowIndeterminateModal] = useState<boolean>(false);
  const [isRechecking, setIsRechecking] = useState<boolean>(false);

  const currentStandard = SAMPLE_CHECK_STANDARDS[selectedIndex] || SAMPLE_CHECK_STANDARDS[0];

  const handleRecheck = () => {
    setIsRechecking(true);
    addToast?.('info', '启动标准检查', '正在持续检查人口服务 8,426 个已确认标准匹配字段…');
    setTimeout(() => {
      setIsRechecking(false);
      addToast?.('success', '检查完毕', '已完成 8,426 个字段的标准执行情况排查，更新了 327 个偏差判定');
    }, 1800);
  };

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-[#F7F9FC] text-[#172033] overflow-hidden select-none">
      
      {/* ========================================================= */}
      {/* LEFT SIDEBAR: 二级导航 (208px)                              */}
      {/* ========================================================= */}
      <aside className="w-[208px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#E6EAF0]">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>数据治理</span>
          </div>
        </div>

        <nav className="p-2 space-y-1 text-xs font-medium">
          <button
            onClick={() => {
              setActiveSubNav('connections');
              addToast?.('info', '数据连接', '查看企业异构数据源与元数据采集节点');
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'connections'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>数据连接</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('probing');
              addToast?.('info', '数据探查', '载入字段数据分布、空值率与技术探查视图');
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'probing'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>数据探查</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('quality');
              addToast?.('info', '数据质量', '查看数据质量校验规则与监控指标');
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'quality'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>数据质量</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('views');
              addToast?.('info', '逻辑视图', '进入企业跨源物理表关联逻辑建模架构');
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'views'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>逻辑视图</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('semantics');
              onNavigateToDataSemantics?.();
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'semantics'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>数据语义</span>
          </button>

          <button
            onClick={() => setActiveSubNav('standards')}
            className="w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]"
          >
            <BookOpen className="w-4 h-4" />
            <span>数据标准</span>
          </button>
        </nav>

        <div className="mt-auto p-4 border-t border-[#E6EAF0] text-[11px] text-[#94A3B8]">
          <p className="font-semibold text-[#64748B]">Semovix Platform</p>
          <p>数据语义治理平台 V2.6</p>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTAINER                                            */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC]">
        
        {/* ========================================================= */}
        {/* PAGE HEADER: Breadcrumb + Title + Fixed Workspace Tabs   */}
        {/* ========================================================= */}
        <div className="bg-white border-b border-[#E6EAF0] px-8 pt-4 pb-0 shadow-2xs shrink-0">
          <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-1">
            <span>数据治理</span>
            <span>/</span>
            <span className="font-semibold text-[#172033]">数据标准</span>
          </div>

          <div className="flex items-baseline space-x-3 mb-3">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              数据标准
            </h1>
            <span className="text-xs font-mono text-[#64748B]">
              Data Standards
            </span>
          </div>

          {/* Fixed Workspace Tabs */}
          <div className="flex space-x-8 border-b border-[#E6EAF0] text-xs font-bold">
            <button
              onClick={() => {
                if (onNavigateToCatalogTab) {
                  onNavigateToCatalogTab();
                } else {
                  addToast?.('info', '标准库', '切换至企业正式数据标准目录');
                }
              }}
              className="pb-3 border-b-2 border-transparent text-[#64748B] hover:text-[#172033] transition-all cursor-pointer"
            >
              标准库
            </button>

            <button
              onClick={() => {
                if (onNavigateToMatchingTab) {
                  onNavigateToMatchingTab();
                } else {
                  addToast?.('info', '标准匹配', '切换至 AI 批量标准匹配工作台');
                }
              }}
              className="pb-3 border-b-2 border-transparent text-[#64748B] hover:text-[#172033] transition-all cursor-pointer"
            >
              标准匹配
            </button>

            {/* Active Selected Tab */}
            <button
              className="pb-3 border-b-2 border-[#2563EB] text-[#2563EB] transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>标准检查</span>
              <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded text-[10px]">
                327 不符合
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SUBHEADER HINT, SCOPE BAR & LIGHT AI INSIGHT              */}
        {/* ========================================================= */}
        <div className="px-8 pt-3.5 pb-1 space-y-2.5 shrink-0">
          <p className="text-xs text-[#64748B]">
            持续检查真实数据是否符合已确认的企业标准，优先定位需要治理的标准偏差。
          </p>

          {/* Scope Bar */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl p-3 flex items-center justify-between text-xs shadow-2xs">
            <div className="flex items-center space-x-3">
              <span className="text-[#64748B] font-bold">当前检查范围：</span>
              <button
                onClick={() => setShowScopeModal(true)}
                className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] hover:border-[#BFDBFE] font-bold text-[#172033] hover:text-[#2563EB] rounded-lg transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <span>人口服务 · 当前正式标准</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>
              <span className="text-[#94A3B8]">|</span>
              <span className="text-[#334155] font-medium">
                覆盖 <strong className="text-[#172033] font-bold font-mono">8,426</strong> 个已确认标准匹配字段
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[#64748B] text-[11px]">
                最近检查：今天 10:32
              </span>

              <button
                onClick={handleRecheck}
                disabled={isRechecking}
                className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#93C5FD] text-white font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
                <span>重新检查</span>
              </button>
            </div>
          </div>

          {/* Restrained Light AI Insight Bar */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-[#1E40AF]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>
                <strong>Xino 归纳：</strong>发现 327 个不符合项，其中 <strong>42 个</strong> 可能由标准匹配失效引起，而不是数据本身质量问题。
              </span>
            </div>
            <button
              onClick={() => setShowAnalysisModal(true)}
              className="text-[#2563EB] hover:underline font-bold cursor-pointer shrink-0 ml-2 text-[11px]"
            >
              查看分析 →
            </button>
          </div>

          {/* Status Segmented Summary & View Switcher */}
          <div className="flex items-center justify-between pt-1">
            {/* Status Segmented Summary Tabs */}
            <div className="flex items-center space-x-2 bg-[#F1F5F9] p-1 rounded-xl text-xs font-bold border border-[#E6EAF0]">
              <button
                onClick={() => setStatusFilter('COMPLIANT')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'COMPLIANT'
                    ? 'bg-[#059669] text-white shadow-2xs'
                    : 'text-[#059669] hover:bg-[#D1FAE5]'
                }`}
              >
                <span>符合标准</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  7,918
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('NON_COMPLIANT')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'NON_COMPLIANT'
                    ? 'bg-[#D97706] text-white shadow-2xs'
                    : 'text-[#D97706] hover:bg-[#FEF3C7]'
                }`}
              >
                <span>不符合标准</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  327
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('INDETERMINATE')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'INDETERMINATE'
                    ? 'bg-[#64748B] text-white shadow-2xs'
                    : 'text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                <span>无法判断</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  181
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-[#172033] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                全部
              </button>
            </div>

            {/* View Switcher Controls */}
            <div className="flex items-center space-x-1 bg-white border border-[#E6EAF0] p-1 rounded-xl text-xs font-bold">
              <span className="text-[#94A3B8] text-[11px] px-2">视角:</span>
              <button
                onClick={() => setViewMode('BY_STANDARD')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'BY_STANDARD'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                按标准
              </button>
              <button
                onClick={() => setViewMode('BY_ASSET')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'BY_ASSET'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                按数据资产
              </button>
              <button
                onClick={() => setViewMode('BY_DOMAIN')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'BY_DOMAIN'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                按业务域
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN WORKSPACE: Left Table (~70%) + Right Context (~30%)  */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden px-8 pb-6 gap-5 mt-2">
          
          {/* ======================================================= */}
          {/* COLUMN 1: LEFT CHECK LIST TABLE (~70% Width)            */}
          {/* ======================================================= */}
          <div className="w-[70%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col overflow-hidden shrink-0">
            
            {/* Table Toolbar */}
            <div className="p-3 border-b border-[#E6EAF0] flex items-center justify-between gap-3 bg-[#F8FAFC]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="搜索标准、字段或数据资产…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E6EAF0] rounded-lg text-xs font-medium text-[#172033] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button className="px-2.5 py-1.5 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] font-medium hover:bg-[#F1F5F9] cursor-pointer flex items-center space-x-1">
                  <span>业务域: 全部</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>

                <button className="px-2.5 py-1.5 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] font-medium hover:bg-[#F1F5F9] cursor-pointer flex items-center space-x-1">
                  <span>问题类型: 全部</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>

                <button className="px-2.5 py-1.5 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] font-medium hover:bg-[#F1F5F9] cursor-pointer flex items-center space-x-1">
                  <span>最近检查: 今天</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              </div>
            </div>

            {/* Table Content Switcher based on viewMode */}
            <div className="flex-1 overflow-y-auto">
              
              {/* VIEW MODE 1: 按标准 (DEFAULT) */}
              {viewMode === 'BY_STANDARD' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold sticky top-0 z-10">
                      <th className="py-2.5 px-4">企业标准与代码</th>
                      <th className="py-2.5 px-3">使用字段</th>
                      <th className="py-2.5 px-4">检查结果明细 (符合 / 不符合 / 无法判断)</th>
                      <th className="py-2.5 px-3">最近检查</th>
                      <th className="py-2.5 px-3">状态</th>
                      <th className="py-2.5 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0]">
                    {SAMPLE_CHECK_STANDARDS.map((row, index) => {
                      const isSelected = selectedIndex === index;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedIndex(index)}
                          className={`transition-all cursor-pointer hover:bg-[#F8FAFC] ${
                            isSelected ? 'bg-[#EFF6FF]/60 font-medium' : 'bg-white'
                          }`}
                        >
                          {/* Standard Name & Code */}
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                                <span className="text-sm">{row.standardName}</span>
                                <span className="text-[10px] font-mono text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                                  {row.version}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-[#64748B]">
                                {row.standardCode}
                              </span>
                            </div>
                          </td>

                          {/* Used Fields Count */}
                          <td className="py-3 px-3 font-mono font-bold text-[#172033]">
                            {row.usedFieldsCount}
                          </td>

                          {/* Compliance Breakdown Badges */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2 text-[11px] font-mono">
                              <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] font-bold rounded border border-[#A7F3D0]">
                                {row.compliantCount} 符合
                              </span>

                              {row.nonCompliantCount > 0 ? (
                                <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] font-bold rounded border border-[#FDE68A]">
                                  {row.nonCompliantCount} 不符合
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#94A3B8] rounded border border-[#E6EAF0]">
                                  0 不符合
                                </span>
                              )}

                              {row.indeterminateCount > 0 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowIndeterminateModal(true);
                                  }}
                                  className="px-2 py-0.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] font-bold rounded border border-[#CBD5E1] cursor-pointer"
                                >
                                  {row.indeterminateCount} 无法判断
                                </button>
                              ) : (
                                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#94A3B8] rounded border border-[#E6EAF0]">
                                  0 无法判断
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Last Checked Time */}
                          <td className="py-3 px-3 text-[#64748B] text-[11px]">
                            {row.lastCheckedTime}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              row.status === 'HAS_ISSUES'
                                ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                                : 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                            }`}>
                              {row.statusLabel}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIndex(index);
                                setShowIssueDetailModal(true);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold rounded-lg transition-all cursor-pointer text-xs"
                            >
                              查看问题
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* VIEW MODE 2: 按数据资产 */}
              {viewMode === 'BY_ASSET' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold sticky top-0 z-10">
                      <th className="py-2.5 px-4">物理数据资产表名</th>
                      <th className="py-2.5 px-3">所属业务域</th>
                      <th className="py-2.5 px-3">已匹配标准数</th>
                      <th className="py-2.5 px-4">结果分布 (符合 / 不符合 / 无法判断)</th>
                      <th className="py-2.5 px-3">状态</th>
                      <th className="py-2.5 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0]">
                    {ASSET_VIEW_ITEMS.map((asset, i) => (
                      <tr key={i} className="hover:bg-[#F8FAFC] transition-all cursor-pointer">
                        <td className="py-3 px-4 font-bold text-[#172033]">{asset.assetName}</td>
                        <td className="py-3 px-3 text-[#64748B]">{asset.domain}</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#2563EB]">{asset.matchedStandardsCount}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2 text-[11px] font-mono">
                            <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] font-bold rounded border border-[#A7F3D0]">
                              {asset.compliantCount} 符合
                            </span>
                            <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] font-bold rounded border border-[#FDE68A]">
                              {asset.nonCompliantCount} 不符合
                            </span>
                            <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded border border-[#CBD5E1]">
                              {asset.indeterminateCount} 无法判断
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            asset.status === 'HAS_ISSUES'
                              ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                              : 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                          }`}>
                            {asset.statusLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setShowIssueDetailModal(true)}
                            className="px-2.5 py-1 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold rounded-lg cursor-pointer"
                          >
                            查看问题
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* VIEW MODE 3: 按业务域 */}
              {viewMode === 'BY_DOMAIN' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold sticky top-0 z-10">
                      <th className="py-2.5 px-4">业务域</th>
                      <th className="py-2.5 px-3">已匹配标准字段总数</th>
                      <th className="py-2.5 px-4">符合项</th>
                      <th className="py-2.5 px-4">不符合项</th>
                      <th className="py-2.5 px-4">无法判断项</th>
                      <th className="py-2.5 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0]">
                    {DOMAIN_VIEW_ITEMS.map((dom, i) => (
                      <tr key={i} className="hover:bg-[#F8FAFC] transition-all cursor-pointer">
                        <td className="py-3 px-4 font-bold text-[#172033] text-sm">{dom.domainName}</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#172033] text-sm">{dom.matchedFieldsCount}</td>
                        <td className="py-3 px-4 font-mono text-[#059669] font-bold">{dom.compliantCount} 符合</td>
                        <td className="py-3 px-4 font-mono text-[#D97706] font-bold">{dom.nonCompliantCount} 不符合</td>
                        <td className="py-3 px-4 font-mono text-[#64748B]">{dom.indeterminateCount} 无法判断</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setShowIssueDetailModal(true)}
                            className="px-2.5 py-1 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold rounded-lg cursor-pointer"
                          >
                            查看域偏差
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 2: RIGHT SIDEBAR · STANDARD CONTEXT (~30% Width)  */}
          {/* ======================================================= */}
          <div className="w-[30%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col justify-between overflow-y-auto p-5 space-y-4 shrink-0">
            
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#E6EAF0] pb-3">
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block">
                  Standard Context & Requirements
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <h2 className="text-base font-bold text-[#172033] tracking-tight">
                    {currentStandard.standardName}
                  </h2>
                  <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded font-bold text-[10px]">
                    生效中
                  </span>
                </div>
                <span className="text-xs font-mono text-[#64748B] block mt-0.5">
                  {currentStandard.standardCode} · {currentStandard.version}
                </span>
              </div>

              {/* Standard Requirements Grid */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block border-b border-[#E6EAF0] pb-1">
                  生效数据标准要求
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">数据类型</span>
                    <strong className="text-[#172033] font-mono font-bold">{currentStandard.dataType}</strong>
                  </div>

                  <div className="p-2 bg-white border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">格式约束</span>
                    <strong className="text-[#172033] font-mono font-bold text-[11px]">{currentStandard.format}</strong>
                  </div>

                  <div className="p-2 bg-white border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">允许为空</span>
                    <strong className="text-[#172033] font-bold">{currentStandard.allowNull}</strong>
                  </div>

                  <div className="p-2 bg-white border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">时区约束</span>
                    <strong className="text-[#172033] font-mono font-bold text-[11px]">{currentStandard.timeZone}</strong>
                  </div>
                </div>
              </div>

              {/* Current Check Results Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                  当前检查结果 ({currentStandard.usedFieldsCount} 个字段正在使用)
                </span>

                <div className="p-3 bg-white border border-[#E6EAF0] rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-[#F1F5F9]">
                    <span className="text-[#059669] font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>符合标准项</span>
                    </span>
                    <strong className="text-[#059669] font-mono font-bold">{currentStandard.compliantCount} 个</strong>
                  </div>

                  <div className="flex justify-between items-center pb-1 border-b border-[#F1F5F9]">
                    <span className="text-[#D97706] font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>不符合标准项</span>
                    </span>
                    <strong className="text-[#D97706] font-mono font-bold">{currentStandard.nonCompliantCount} 个</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B] font-bold flex items-center space-x-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>无法判断项</span>
                    </span>
                    <strong className="text-[#64748B] font-mono font-bold">{currentStandard.indeterminateCount} 个</strong>
                  </div>
                </div>
              </div>

              {/* Main Issues List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                  主要偏差类型 (Main Issues)
                </span>

                {currentStandard.issues.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {currentStandard.issues.map((iss, i) => (
                      <div key={i} className="p-2.5 bg-[#FEF3C7]/40 border border-[#FDE68A] rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#92400E]">{iss.type}</span>
                          <span className="text-[10px] font-mono font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                            {iss.count} 个字段
                          </span>
                        </div>
                        <p className="text-[11px] text-[#78350F] leading-snug">
                          {iss.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] p-2.5 rounded-xl font-medium text-center">
                    ✓ 当前标准执行完美，所有挂接物理字段全部符合要求。
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => {
                  if (onNavigateToIssueDetail) {
                    onNavigateToIssueDetail();
                  } else {
                    setShowIssueDetailModal(true);
                  }
                }}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <span>查看偏差详情 (进入完整决策页)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL: Issue Detail Drawer / Modal                        */}
      {/* ========================================================= */}
      {showIssueDetailModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[640px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  标准执行偏差处理 (Standard Check Issue Detail)
                </h3>
                <span className="text-xs font-mono text-[#2563EB]">
                  {currentStandard.standardName} ({currentStandard.standardCode} V3)
                </span>
              </div>
              <button
                onClick={() => setShowIssueDetailModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-[#92400E] space-y-1">
                <span className="font-bold block">Xino 诊断分析：</span>
                <p className="text-[11px] leading-relaxed">
                  在 7 个“业务办结时间”不符合项中，4 个字段近期经历了数据表 DDL 修改（由 DATETIME 变更为了 VARCHAR），建议优先排查原标准匹配关系是否仍然适用。
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#172033] block">偏差物理字段列表：</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {[
                    { col: 'population_service.case_record.close_time', issue: '数据类型偏离 (DATETIME → VARCHAR)', action: '建议重新进行标准匹配' },
                    { col: 'service_case.history.finish_time', issue: '必填要求未满足 (包含 1.2% 空值)', action: '路由至数据质量工单库' },
                    { col: 'hotline_db.workorder.completed_at', issue: '格式不符合 (yyyy-MM-dd 无时分秒)', action: '保留微小差异例外或要求修改 DDL' },
                  ].map((row, i) => (
                    <div key={i} className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-[#172033]">{row.col}</strong>
                        <span className="text-[10px] text-[#D97706] font-bold bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                          {row.issue}
                        </span>
                      </div>
                      <span className="text-[#64748B] text-[10px] block">建议下一步治理：{row.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end space-x-2">
              <button
                onClick={() => setShowIssueDetailModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setShowIssueDetailModal(false);
                  if (onNavigateToMatchingTab) {
                    onNavigateToMatchingTab();
                  } else {
                    addToast?.('info', '跳转至标准匹配', '已导航至标准匹配工作台重新校验匹配映射');
                  }
                }}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                进入标准匹配重新校验
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Indeterminate Reasons                              */}
      {/* ========================================================= */}
      {showIndeterminateModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[500px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                无法判断原因排查 (Indeterminate Analysis)
              </h3>
              <button
                onClick={() => setShowIndeterminateModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#64748B]">“无法判断”表明系统缺乏足够的数据探查样本或物理权限，未归类为故障不合规：</p>

              <div className="space-y-2 pt-2">
                {currentStandard.indeterminateReasons?.map((r, i) => (
                  <div key={i} className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                    <span className="font-medium text-[#172033]">{r.reason}</span>
                    <strong className="text-[#64748B] font-mono">{r.count} 项</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end">
              <button
                onClick={() => setShowIndeterminateModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Scope Bar Picker                                  */}
      {/* ========================================================= */}
      {showScopeModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[520px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                切换标准检查范围 (Scope Picker)
              </h3>
              <button
                onClick={() => setShowScopeModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: '人口服务 · 当前正式标准', count: '8,426 字段' },
                { label: '公共服务 · 核心数据资产', count: '5,120 字段' },
                { label: '社会保障 · 全部正式标准', count: '3,840 字段' },
                { label: '最近 30 天新增资产标准检查', count: '1,286 字段' },
              ].map((scope, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setShowScopeModal(false);
                    addToast?.('success', '检查范围已切换', `已成功载入【${scope.label}】`);
                  }}
                  className="p-3 bg-white hover:bg-[#EFF6FF] border border-[#E6EAF0] hover:border-[#BFDBFE] rounded-xl cursor-pointer transition-all flex justify-between items-center"
                >
                  <span className="font-bold text-[#172033]">{scope.label}</span>
                  <span className="text-[10px] font-mono text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {scope.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end">
              <button
                onClick={() => setShowScopeModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AI Analysis Panel                                  */}
      {/* ========================================================= */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[560px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div className="flex items-center space-x-2 text-[#2563EB]">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#172033]">
                  Xino 偏差归因深度分析 (Attribution Analysis)
                </h3>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[#1E40AF]">
                在当前的 327 个不符合项中，Xino 通过对数据 DDL 变更记录与日志行为的关联推演，完成了偏差根因分流：
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-[#D97706]">1. 标准匹配失效 (42 项 / 12.8%)</span>
                    <span className="font-mono text-[#2563EB]">推荐重推匹配</span>
                  </div>
                  <p className="text-[#64748B] text-[11px]">
                    因源端表结构被重构或变更字段名，原匹配映射未及时同步，导致误判为数据违规。
                  </p>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-[#BE123C]">2. 真实数据质量缺陷 (215 项 / 65.7%)</span>
                    <span className="font-mono text-[#BE123C]">建议发起质量工单</span>
                  </div>
                  <p className="text-[#64748B] text-[11px]">
                    源头系统录入不规范（如脏数据、空值、非法编码），需进入数据质量治理与源端修复流程。
                  </p>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-[#64748B]">3. 标准规范本身需迭代 (70 项 / 21.4%)</span>
                    <span className="font-mono text-[#4F46E5]">发起标准修改建议</span>
                  </div>
                  <p className="text-[#64748B] text-[11px]">
                    业务逻辑发生改变后，既有正式标准的校验约束（如特定正则表达式）已不再适应当前新业务形态。
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                关闭分析
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
