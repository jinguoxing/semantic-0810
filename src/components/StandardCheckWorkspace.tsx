import React, { useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Layers,
  Database,
  ShieldCheck,
  FolderTree,
  X,
  ExternalLink,
  Info,
  Check,
  HelpCircle,
  FileText,
  Building,
  Clock,
  Tag,
  AlertTriangle,
  RefreshCw,
  Filter,
  SlidersHorizontal,
  XCircle,
  HelpCircle as QuestionIcon,
  ChevronDown
} from 'lucide-react';

export interface StandardCheckRow {
  id: string;
  title: string;
  code: string;
  version: string;
  domain: string;
  usedFieldCount: number;
  compliantCount: number;
  nonCompliantCount: number;
  undeterminedCount: number;
  lastCheckTime: string;
  status: 'PROBLEM' | 'COMPLIANT' | 'UNDETERMINED';
  
  // Right side details
  specs: {
    dataType: string;
    format: string;
    nullable: string;
    timezone: string;
  };
  mainIssues: Array<{
    issueType: string;
    count: number;
    description: string;
  }>;
  undeterminedReasons?: string[];
}

const CHECK_ROWS: StandardCheckRow[] = [
  {
    id: 'chk_001',
    title: '业务办结时间',
    code: 'DE_CASE_CLOSE_TIME',
    version: 'V3',
    domain: '公共服务',
    usedFieldCount: 126,
    compliantCount: 115,
    nonCompliantCount: 7,
    undeterminedCount: 4,
    lastCheckTime: '今天 10:30',
    status: 'PROBLEM',
    specs: {
      dataType: 'DATETIME',
      format: 'yyyy-MM-dd HH:mm:ss',
      nullable: '否',
      timezone: 'Asia/Shanghai',
    },
    mainIssues: [
      { issueType: '数据类型偏离', count: 4, description: '4 个物理字段的数据类型为 VARCHAR 而非 DATETIME' },
      { issueType: '必填要求未满足', count: 2, description: '2 个字段在业务办结阶段存在 NULL 空值记录' },
      { issueType: '格式不符合', count: 1, description: '1 个字段时间戳缺失秒级精确度格式' },
    ],
    undeterminedReasons: [
      '2 个字段缺少最近 30 天探查 Profile',
      '1 个字段所属数据库当前无样本读取权限',
      '1 个值域绑定规则正在重新同步',
    ],
  },
  {
    id: 'chk_002',
    title: '公民身份号码',
    code: 'DE_PERSON_ID',
    version: 'V5',
    domain: '人口基础',
    usedFieldCount: 84,
    compliantCount: 79,
    nonCompliantCount: 3,
    undeterminedCount: 2,
    lastCheckTime: '今天 10:32',
    status: 'PROBLEM',
    specs: {
      dataType: 'VARCHAR(18)',
      format: 'GB 11643',
      nullable: '否',
      timezone: '—',
    },
    mainIssues: [
      { issueType: '长度不符合', count: 2, description: '2 个历史库字段包含旧版 15 位数字身份标识' },
      { issueType: '格式不符合', count: 1, description: '1 个测试环境字段存在尾部校验位字符非法' },
    ],
    undeterminedReasons: ['2 个备份表字段由于数据量过大尚未完成深度正则校验'],
  },
  {
    id: 'chk_003',
    title: '出生日期',
    code: 'DE_BIRTH_DATE',
    version: 'V2',
    domain: '人口基础',
    usedFieldCount: 61,
    compliantCount: 61,
    nonCompliantCount: 0,
    undeterminedCount: 0,
    lastCheckTime: '今天 09:15',
    status: 'COMPLIANT',
    specs: {
      dataType: 'DATE',
      format: 'yyyy-MM-dd',
      nullable: '否',
      timezone: '—',
    },
    mainIssues: [],
  },
  {
    id: 'chk_004',
    title: '性别代码',
    code: 'GENDER_CODE',
    version: 'V2',
    domain: '人口基础',
    usedFieldCount: 82,
    compliantCount: 80,
    nonCompliantCount: 1,
    undeterminedCount: 1,
    lastCheckTime: '今天 08:45',
    status: 'PROBLEM',
    specs: {
      dataType: 'VARCHAR(2)',
      format: 'GB/T 2261.1',
      nullable: '否',
      timezone: '—',
    },
    mainIssues: [
      { issueType: '值域不符合', count: 1, description: '1 个接口传输字段包含未定义枚举值 "99"' },
    ],
    undeterminedReasons: ['1 个历史镜像表全表为空值无法判定编码关联'],
  },
];

interface StandardCheckWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToDataSemantics?: () => void;
  onNavigateToCatalogTab?: () => void;
  onNavigateToMatchingTab?: () => void;
}

export const StandardCheckWorkspace: React.FC<StandardCheckWorkspaceProps> = ({
  addToast,
  onNavigateToDataSemantics,
  onNavigateToCatalogTab,
  onNavigateToMatchingTab,
}) => {
  // Navigation & SubNav
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');

  // Main View Mode: 'BY_STANDARD' | 'BY_ASSET' | 'BY_DOMAIN'
  const [viewMode, setViewMode] = useState<'BY_STANDARD' | 'BY_ASSET' | 'BY_DOMAIN'>('BY_STANDARD');

  // Active Filter Status: 'ALL' | 'NON_COMPLIANT' | 'COMPLIANT' | 'UNDETERMINED'
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NON_COMPLIANT' | 'COMPLIANT' | 'UNDETERMINED'>('NON_COMPLIANT');

  // Selected row index in the table
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const selectedRow = CHECK_ROWS[selectedRowIndex] || CHECK_ROWS[0];

  // Re-check progress simulation state
  const [isRechecking, setIsRechecking] = useState<boolean>(false);
  const [recheckProgress, setRecheckProgress] = useState<number>(6832);

  // Modals / Drawers
  const [showIssueDetailModal, setShowIssueDetailModal] = useState<boolean>(false);
  const [showInsightAnalysisDrawer, setShowInsightAnalysisDrawer] = useState<boolean>(false);

  const handleStartRecheck = () => {
    setIsRechecking(true);
    addToast?.('info', '正在重新检查', '已启动人口服务 8,426 个已确认标准匹配字段的标准执行检查');
    setTimeout(() => {
      setRecheckProgress(8426);
      setIsRechecking(false);
      addToast?.('success', '检查完成', '标准检查任务已同步最新探查结果');
    }, 2000);
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

          {/* Current Selected Menu Item */}
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
      {/* MAIN CONTAINER AREA                                       */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC]">
        
        {/* ========================================================= */}
        {/* PAGE HEADER: Breadcrumb + Title + Top Workspace Tabs     */}
        {/* ========================================================= */}
        <div className="bg-white border-b border-[#E6EAF0] px-8 pt-4 pb-0 shadow-2xs shrink-0">
          {/* Breadcrumb */}
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
                  addToast?.('info', '标准匹配', '切换至标准自动映射与冲突处理工作台');
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
              <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded text-[10px]">
                327 问题
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SUBHEADER HINT & COMPACT SCOPE BAR                        */}
        {/* ========================================================= */}
        <div className="px-8 pt-4 pb-2 space-y-3 shrink-0">
          <p className="text-xs text-[#64748B]">
            持续检查真实数据是否符合已确认的企业标准，优先定位需要治理的标准偏差。
          </p>

          {/* Scope Bar */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl p-3 flex items-center justify-between text-xs shadow-2xs">
            <div className="flex items-center space-x-3">
              <span className="text-[#64748B] font-bold">当前检查范围：</span>
              <button
                onClick={() => addToast?.('info', '切换检查范围', '支持按业务域、业务对象或最近资产进行范围筛选')}
                className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] hover:border-[#BFDBFE] font-bold text-[#172033] hover:text-[#2563EB] rounded-lg transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <span>人口服务 · 当前正式标准</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>
              <span className="text-[#94A3B8]">|</span>
              <span className="text-[#334155] font-medium">
                涵盖 <strong className="text-[#172033] font-bold font-mono">8,426</strong> 个已确认标准匹配字段
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {isRechecking ? (
                <span className="text-[#2563EB] font-bold font-mono animate-pulse">
                  正在检查：{recheckProgress} / 8,426
                </span>
              ) : (
                <span className="text-[#64748B] text-[11px]">
                  最近检查：今天 10:32
                </span>
              )}

              <button
                onClick={handleStartRecheck}
                disabled={isRechecking}
                className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#93C5FD] text-white font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
                <span>重新检查</span>
              </button>
            </div>
          </div>

          {/* AI Insight Light Banner */}
          <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-[#4F46E5]">
              <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span className="font-semibold">
                Xino 发现 327 个不符合项，其中 42 个可能由标准匹配失效引起，而不是数据本身质量问题。
              </span>
            </div>

            <button
              onClick={() => setShowInsightAnalysisDrawer(true)}
              className="text-[#2563EB] hover:underline font-bold text-xs flex items-center space-x-0.5 cursor-pointer"
            >
              <span>查看分析</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Core Status Summary Segment Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2 bg-[#F1F5F9] p-1 rounded-xl text-xs font-bold border border-[#E6EAF0]">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-[#172033] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                全部标准
              </button>

              <button
                onClick={() => setStatusFilter('NON_COMPLIANT')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'NON_COMPLIANT'
                    ? 'bg-[#DC2626] text-white shadow-2xs'
                    : 'text-[#DC2626] hover:bg-[#FEE2E2]'
                }`}
              >
                <span>不符合标准</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  327
                </span>
              </button>

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
                onClick={() => setStatusFilter('UNDETERMINED')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'UNDETERMINED'
                    ? 'bg-[#64748B] text-white shadow-2xs'
                    : 'text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                <span>无法判断</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  181
                </span>
              </button>
            </div>

            {/* Core View Switch: 按标准 | 按数据资产 | 按业务域 */}
            <div className="flex items-center space-x-1 bg-white border border-[#E6EAF0] p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode('BY_STANDARD')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'BY_STANDARD'
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                按标准
              </button>

              <button
                onClick={() => {
                  setViewMode('BY_ASSET');
                  addToast?.('info', '按数据资产视图', '已载入按数据表分类的标准检查视图');
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'BY_ASSET'
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                按数据资产
              </button>

              <button
                onClick={() => {
                  setViewMode('BY_DOMAIN');
                  addToast?.('info', '按业务域视图', '已载入按业务主题域分类的标准检查视图');
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'BY_DOMAIN'
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                按业务域
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN WORKSPACE split: Left List (~70%) + Right Detail (~30%) */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden px-8 pb-6 gap-5 mt-1">
          
          {/* ======================================================= */}
          {/* COLUMN 1: LEFT MAIN TABLE (~70% Width)                   */}
          {/* ======================================================= */}
          <div className="w-[70%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col overflow-hidden shrink-0">
            
            {/* Table Toolbar Filters */}
            <div className="p-3 border-b border-[#E6EAF0] flex items-center justify-between gap-3 bg-[#F8FAFC]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="搜索标准、字段或数据资产…"
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
                  <span>最近检查</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto">
              {viewMode === 'BY_STANDARD' ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold sticky top-0 z-10">
                      <th className="py-2.5 px-4">企业数据标准</th>
                      <th className="py-2.5 px-3">使用字段</th>
                      <th className="py-2.5 px-3 text-[#059669]">符合</th>
                      <th className="py-2.5 px-3 text-[#DC2626]">不符合</th>
                      <th className="py-2.5 px-3 text-[#64748B]">无法判断</th>
                      <th className="py-2.5 px-3">最近检查</th>
                      <th className="py-2.5 px-3">状态</th>
                      <th className="py-2.5 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0]">
                    {CHECK_ROWS.map((row, index) => {
                      const isSelected = selectedRowIndex === index;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedRowIndex(index)}
                          className={`transition-all cursor-pointer hover:bg-[#F8FAFC] ${
                            isSelected ? 'bg-[#EFF6FF]/60 font-medium' : 'bg-white'
                          }`}
                        >
                          {/* Standard Title & Code */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                                  <span>{row.title}</span>
                                  <span className="text-[10px] font-mono text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.2 rounded font-bold">
                                    {row.version}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-[#64748B]">
                                  {row.code}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Used Field Count */}
                          <td className="py-3 px-3 font-mono font-bold text-[#172033]">
                            {row.usedFieldCount}
                          </td>

                          {/* Compliant */}
                          <td className="py-3 px-3 font-mono font-bold text-[#059669]">
                            {row.compliantCount}
                          </td>

                          {/* Non-Compliant */}
                          <td className="py-3 px-3 font-mono font-bold text-[#DC2626]">
                            {row.nonCompliantCount > 0 ? (
                              <span className="px-1.5 py-0.5 bg-[#FEE2E2] rounded border border-[#FCA5A5]">
                                {row.nonCompliantCount}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>

                          {/* Undetermined */}
                          <td className="py-3 px-3 font-mono text-[#64748B]">
                            {row.undeterminedCount}
                          </td>

                          {/* Last Check Time */}
                          <td className="py-3 px-3 text-[#64748B] text-[11px]">
                            {row.lastCheckTime}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3">
                            {row.status === 'PROBLEM' ? (
                              <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] text-[11px] font-bold rounded-full inline-flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>存在问题</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] text-[11px] font-bold rounded-full inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>全部符合</span>
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRowIndex(index);
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
              ) : viewMode === 'BY_ASSET' ? (
                /* BY ASSET VIEW TABLE */
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold sticky top-0 z-10">
                      <th className="py-2.5 px-4">数据资产 (表名)</th>
                      <th className="py-2.5 px-3">已匹配标准</th>
                      <th className="py-2.5 px-3 text-[#059669]">符合</th>
                      <th className="py-2.5 px-3 text-[#DC2626]">不符合</th>
                      <th className="py-2.5 px-3 text-[#64748B]">无法判断</th>
                      <th className="py-2.5 px-3">状态</th>
                      <th className="py-2.5 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0] text-xs">
                    <tr className="bg-white hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-bold text-[#172033]">
                        <div>人口基本信息表</div>
                        <span className="text-[11px] font-mono text-[#64748B]">population_service.person_info</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">32</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#059669]">27</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#DC2626]">4</td>
                      <td className="py-3 px-3 font-mono text-[#64748B]">1</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] font-bold rounded-full text-[11px]">
                          存在问题
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setShowIssueDetailModal(true)}
                          className="px-2.5 py-1 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold rounded-lg text-xs cursor-pointer"
                        >
                          查看问题
                        </button>
                      </td>
                    </tr>

                    <tr className="bg-white hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-bold text-[#172033]">
                        <div>公共服务热线工单记录表</div>
                        <span className="text-[11px] font-mono text-[#64748B]">population_service.case_record</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">26</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#059669]">24</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#DC2626]">2</td>
                      <td className="py-3 px-3 font-mono text-[#64748B]">0</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] font-bold rounded-full text-[11px]">
                          存在问题
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setShowIssueDetailModal(true)}
                          className="px-2.5 py-1 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold rounded-lg text-xs cursor-pointer"
                        >
                          查看问题
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* BY DOMAIN VIEW TABLE */
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold sticky top-0 z-10">
                      <th className="py-2.5 px-4">业务域 (Domain)</th>
                      <th className="py-2.5 px-3">已匹配字段</th>
                      <th className="py-2.5 px-3 text-[#059669]">符合</th>
                      <th className="py-2.5 px-3 text-[#DC2626]">不符合</th>
                      <th className="py-2.5 px-3 text-[#64748B]">无法判断</th>
                      <th className="py-2.5 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0] text-xs">
                    <tr className="bg-white hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-bold text-[#172033]">人口服务</td>
                      <td className="py-3 px-3 font-mono font-bold">2,318</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#059669]">2,156</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#DC2626]">104</td>
                      <td className="py-3 px-3 font-mono text-[#64748B]">58</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setStatusFilter('NON_COMPLIANT')}
                          className="px-2.5 py-1 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold rounded-lg text-xs cursor-pointer"
                        >
                          筛选问题
                        </button>
                      </td>
                    </tr>

                    <tr className="bg-white hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-bold text-[#172033]">公共服务</td>
                      <td className="py-3 px-3 font-mono font-bold">1,824</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#059669]">1,751</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#DC2626]">53</td>
                      <td className="py-3 px-3 font-mono text-[#64748B]">20</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setStatusFilter('NON_COMPLIANT')}
                          className="px-2.5 py-1 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold rounded-lg text-xs cursor-pointer"
                        >
                          筛选问题
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 2: RIGHT SIDEBAR · SELECTED STANDARD SUMMARY (~30%) */}
          {/* ======================================================= */}
          <div className="w-[30%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col justify-between overflow-y-auto p-5 space-y-4 shrink-0">
            
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#E6EAF0] pb-3">
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">
                  Standard Check Context
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <h2 className="text-base font-bold text-[#172033] tracking-tight">
                    {selectedRow.title}
                  </h2>
                  <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-bold rounded">
                    生效中
                  </span>
                </div>
                <p className="text-xs font-mono text-[#64748B] mt-0.5">
                  {selectedRow.code} · {selectedRow.version}
                </p>
              </div>

              {/* Standard Technical Requirements */}
              <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3.5 space-y-2 text-xs">
                <span className="font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1.5">
                  标准要求 (Specs)
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#64748B] block">数据类型</span>
                    <strong className="font-mono text-[#172033]">{selectedRow.specs.dataType}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">规范格式</span>
                    <strong className="font-mono text-[#172033]">{selectedRow.specs.format}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">允许为空</span>
                    <strong className="text-[#172033]">{selectedRow.specs.nullable}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">时区要求</span>
                    <strong className="font-mono text-[#172033]">{selectedRow.specs.timezone}</strong>
                  </div>
                </div>
              </div>

              {/* Current Check Results Breakdown */}
              <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-[#E6EAF0] pb-1.5">
                  <span className="font-bold text-[#172033]">当前检查结果</span>
                  <span className="text-[11px] font-bold text-[#2563EB] font-mono">
                    {selectedRow.usedFieldCount} 个字段关联使用
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-[#A7F3D0]">
                    <span className="text-[#059669] block font-bold">符合</span>
                    <strong className="text-[#059669] text-base font-mono">{selectedRow.compliantCount}</strong>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-[#FCA5A5]">
                    <span className="text-[#DC2626] block font-bold">不符合</span>
                    <strong className="text-[#DC2626] text-base font-mono">{selectedRow.nonCompliantCount}</strong>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-[#CBD5E1]">
                    <span className="text-[#64748B] block font-bold">无法判断</span>
                    <strong className="text-[#64748B] text-base font-mono">{selectedRow.undeterminedCount}</strong>
                  </div>
                </div>
              </div>

              {/* Main Issues List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1.5">
                  主要偏离问题 (Main Issues)
                </span>

                {selectedRow.mainIssues.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRow.mainIssues.map((issue, i) => (
                      <div key={i} className="p-2.5 bg-white border border-[#E6EAF0] rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#DC2626] flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{issue.issueType}</span>
                          </span>
                          <span className="px-2 py-0.2 bg-[#FEE2E2] text-[#DC2626] font-mono font-bold rounded text-[10px]">
                            {issue.count} 个字段
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569] leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs text-[#059669] font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>该标准下的所有关联字段均 100% 遵从规范。</span>
                  </div>
                )}
              </div>

              {/* Undetermined Reasons (无法判断说明) */}
              {selectedRow.undeterminedReasons && selectedRow.undeterminedReasons.length > 0 && (
                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1.5 text-xs">
                  <span className="font-bold text-[#64748B] block text-[11px]">无法判断依据说明：</span>
                  <ul className="space-y-1 text-[11px] text-[#475569] list-disc list-inside pl-1">
                    {selectedRow.undeterminedReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Primary Action Button */}
            <div className="pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setShowIssueDetailModal(true)}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <span>查看偏差问题明细</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL: Issue Detail Diagnosis View                         */}
      {/* ========================================================= */}
      {showIssueDetailModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[680px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#64748B] uppercase">
                  {selectedRow.code}
                </span>
                <h3 className="text-base font-bold text-[#172033] flex items-center space-x-2">
                  <span>{selectedRow.title} · 偏离问题诊断</span>
                  <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] text-xs font-bold rounded-full">
                    {selectedRow.nonCompliantCount} 项偏离
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setShowIssueDetailModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[380px] overflow-y-auto pr-1">
              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-2">
                <span className="font-bold text-[#172033]">偏离字段 01：population_service.case_record.close_time</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-[#E6EAF0]">
                  <div>
                    <span className="text-[#64748B] block">标准要求类型</span>
                    <strong className="font-mono text-[#2563EB]">DATETIME</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">实际物理数据类型</span>
                    <strong className="font-mono text-[#DC2626]">VARCHAR(32)</strong>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Xino 诊断结论：该字段存放格式为 ISO 字符串格式，属于物理数据类型不符合，建议在逻辑视图转换层统一封装 DATETIME 转换规则。
                </p>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-2">
                <span className="font-bold text-[#172033]">偏离字段 02：social_security.claim_item.finish_date</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-[#E6EAF0]">
                  <div>
                    <span className="text-[#64748B] block">标准必填约束</span>
                    <strong className="text-[#2563EB]">NOT NULL</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">探查空值率</span>
                    <strong className="text-[#DC2626]">存在 1.2% NULL 记录</strong>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Xino 诊断结论：源头社保系统中部分撤销状态的单据未录入完成时间，建议引导源头数据质量校验或完善标准例外说明。
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end space-x-2">
              <button
                onClick={() => setShowIssueDetailModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                关闭视图
              </button>
              <button
                onClick={() => {
                  setShowIssueDetailModal(false);
                  addToast?.('info', '生成治理任务', '已将 2 项标准偏离问题加入治理协同任务队列');
                }}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
              >
                转入治理协同
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER: AI Insight Analysis                               */}
      {/* ========================================================= */}
      {showInsightAnalysisDrawer && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex justify-end z-50">
          <div className="w-[500px] bg-white h-full shadow-2xl flex flex-col justify-between p-6 space-y-4 animate-in slide-in-from-right duration-200">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#2563EB]" />
                  <h3 className="text-base font-bold text-[#172033]">
                    Xino 偏差根因分析报告
                  </h3>
                </div>
                <button
                  onClick={() => setShowInsightAnalysisDrawer(false)}
                  className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl space-y-1 text-[#334155]">
                  <span className="font-bold text-[#4F46E5] block">42 个映射失效引发的虚假偏离</span>
                  <p className="text-[11px] leading-relaxed">
                    在 327 个不符合项中，42 个字段近期发生了物理表结构改版，原关联的标准映射已不匹配，建议优先进行重新匹配，而非误判为业务数据质量故障。
                  </p>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                  <span className="font-bold text-[#172033] block">核心治理建议优先级</span>
                  <ul className="space-y-1 text-[11px] text-[#475569] list-disc list-inside pl-1">
                    <li>1. 优先对人口基础域 3 个身份校验字段重新绑定 GB 11643 V5 标准</li>
                    <li>2. 在公共服务数据接入层增加字符串转 DATETIME 预处理节点</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setShowInsightAnalysisDrawer(false)}
                className="w-full py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                关闭分析报告
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
