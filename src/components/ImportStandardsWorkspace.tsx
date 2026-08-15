import React, { useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  PlusCircle,
  FileSpreadsheet,
  RefreshCw,
  FileText,
  ExternalLink,
  ChevronRight,
  X,
  Layers,
  Database,
  ShieldCheck,
  FolderTree,
  Check,
  Copy,
  Info,
  HelpCircle,
  GitPullRequest
} from 'lucide-react';

export interface ImportStandardItem {
  id: string;
  name: string;
  code: string;
  type: 'DATA_ELEMENT' | 'VALUE_DOMAIN';
  alignResult: 'CHANGE' | 'SAME' | 'CONFLICT' | 'NEW';
  alignResultLabel: string;
  diffSummary: string;
  aiSuggestion: string;
  status: 'PENDING' | 'AUTO_PROCESSABLE' | 'SUBMITTABLE' | 'RESOLVED';
  statusLabel: string;
  
  // Detail Fields
  importSource: string;
  importType: string;
  importLength: string;
  importNullable: string;
  importStandardDoc: string;
  
  // Current Enterprise Standard
  currentVersion?: string;
  currentCode?: string;
  currentType?: string;
  currentLength?: string;
  currentNullable?: string;
  currentUsageCount?: number;
  
  // Value Domain Specifics
  importValues?: Array<{ code: string; label: string; desc?: string }>;
  currentValues?: Array<{ code: string; label: string; desc?: string }>;
  
  // Conflict Specifics
  conflictCandidates?: Array<{ name: string; basis: string[]; desc: string }>;
  
  // Document Trace
  docTraceDocName?: string;
  docTraceSection?: string;
  docTraceExcerpt?: string;
}

const IMPORT_ITEMS: ImportStandardItem[] = [
  {
    id: 'imp_001',
    name: '公民身份号码',
    code: 'DE_PERSON_ID',
    type: 'DATA_ELEMENT',
    alignResult: 'CHANGE',
    alignResultLabel: '可能是标准变更',
    diffSummary: '长度：18 ↔ 20',
    aiSuggestion: '建议评估更新',
    status: 'PENDING',
    statusLabel: '待确认',
    importSource: '《人口基础信息数据标准.xlsx》',
    importType: 'VARCHAR',
    importLength: '18',
    importNullable: '否',
    importStandardDoc: 'GB/T XXXXX—2026',
    currentVersion: 'V4',
    currentCode: 'DE_PERSON_ID',
    currentType: 'VARCHAR',
    currentLength: '20',
    currentNullable: '否',
    currentUsageCount: 84,
    docTraceDocName: '《公共服务基础数据元规范》',
    docTraceSection: '第 5.3.7 条 · P126',
    docTraceExcerpt: '公民身份号码 (DE_PERSON_ID)：国家居民唯一身份标识号，字符型，长度规范为 18 位。符合 GB 11643 强制性国家标准要求。',
  },
  {
    id: 'imp_002',
    name: '性别代码',
    code: 'GENDER_CODE',
    type: 'VALUE_DOMAIN',
    alignResult: 'SAME',
    alignResultLabel: '已有相同标准',
    diffSummary: '无差异',
    aiSuggestion: '复用现有标准',
    status: 'AUTO_PROCESSABLE',
    statusLabel: '可自动处理',
    importSource: '《人口基础信息数据标准.xlsx》',
    importType: 'VARCHAR(2)',
    importLength: '2',
    importNullable: '否',
    importStandardDoc: 'GB/T 2261.1-2003',
    currentVersion: 'V2',
    currentCode: 'GENDER_CODE',
    currentUsageCount: 82,
    importValues: [
      { code: '01', label: '男' },
      { code: '02', label: '女' },
      { code: '09', label: '未说明' },
    ],
    currentValues: [
      { code: '01', label: '男' },
      { code: '02', label: '女' },
      { code: '09', label: '未说明' },
    ],
  },
  {
    id: 'imp_003',
    name: '事项完成时间',
    code: 'DE_CASE_FINISH_TIME',
    type: 'DATA_ELEMENT',
    alignResult: 'CONFLICT',
    alignResultLabel: '存在冲突',
    diffSummary: '对应 2 个现有标准',
    aiSuggestion: '需要人工判断',
    status: 'PENDING',
    statusLabel: '待确认',
    importSource: '《人口基础信息数据标准.xlsx》',
    importType: 'DATETIME',
    importLength: '—',
    importNullable: '否',
    importStandardDoc: '企业内部标准规范',
    conflictCandidates: [
      {
        name: '业务办结时间 (DE_CASE_CLOSE_TIME)',
        basis: ['工单业务对象', '事件时间', '业务完成语义'],
        desc: '热线诉求与服务工单正式送达办结回复的时间节点',
      },
      {
        name: '系统关闭时间 (DE_SYSTEM_CLOSE_TIME)',
        basis: ['系统状态变化', '技术关闭语义'],
        desc: '数仓或业务系统后台自动置为终结归档状态的时间点',
      },
    ],
  },
  {
    id: 'imp_004',
    name: '出生日期',
    code: 'DE_BIRTH_DATE',
    type: 'DATA_ELEMENT',
    alignResult: 'NEW',
    alignResultLabel: '可新增',
    diffSummary: '当前标准库无正式标准',
    aiSuggestion: '建议新增',
    status: 'SUBMITTABLE',
    statusLabel: '可提交',
    importSource: '《人口基础信息数据标准.xlsx》',
    importType: 'DATE',
    importLength: 'yyyy-MM-dd',
    importNullable: '是',
    importStandardDoc: 'GB/T 2261.1-2003',
  },
  {
    id: 'imp_005',
    name: '民族代码',
    code: 'ETHNIC_CODE',
    type: 'VALUE_DOMAIN',
    alignResult: 'SAME',
    alignResultLabel: '已有相同标准',
    diffSummary: '无差异',
    aiSuggestion: '复用现有标准',
    status: 'AUTO_PROCESSABLE',
    statusLabel: '可自动处理',
    importSource: '《人口基础信息数据标准.xlsx》',
    importType: 'VARCHAR(2)',
    importLength: '2',
    importNullable: '是',
    importStandardDoc: 'GB/T 3304-1991',
    currentVersion: 'V3',
    currentCode: 'ETHNIC_CODE',
    currentUsageCount: 45,
    importValues: [
      { code: '01', label: '汉族' },
      { code: '02', label: '蒙古族' },
      { code: '03', label: '回族' },
      { code: '04', label: '藏族' },
    ],
    currentValues: [
      { code: '01', label: '汉族' },
      { code: '02', label: '蒙古族' },
      { code: '03', label: '回族' },
      { code: '04', label: '藏族' },
    ],
  },
  {
    id: 'imp_006',
    name: '婚姻状况代码',
    code: 'MARITAL_STATUS_CODE',
    type: 'VALUE_DOMAIN',
    alignResult: 'CHANGE',
    alignResultLabel: '可能是标准变更',
    diffSummary: '增加 2 个新码值',
    aiSuggestion: '建议评估更新码表',
    status: 'PENDING',
    statusLabel: '待确认',
    importSource: '《人口基础信息数据标准.xlsx》',
    importType: 'VARCHAR(2)',
    importLength: '2',
    importNullable: '是',
    importStandardDoc: 'GB/T 2261.2-2003',
    currentVersion: 'V1',
    currentCode: 'MARITAL_STATUS_CODE',
    currentUsageCount: 38,
    importValues: [
      { code: '10', label: '未婚' },
      { code: '20', label: '已婚' },
      { code: '30', label: '丧偶' },
      { code: '40', label: '离婚' },
      { code: '90', label: '其他' },
    ],
    currentValues: [
      { code: '10', label: '未婚' },
      { code: '20', label: '已婚' },
      { code: '30', label: '丧偶' },
      { code: '40', label: '离婚' },
    ],
  },
  {
    id: 'imp_007',
    name: '户籍所在地地址',
    code: 'DE_REGISTERED_ADDR',
    type: 'DATA_ELEMENT',
    alignResult: 'NEW',
    alignResultLabel: '可新增',
    diffSummary: '当前标准库无正式标准',
    aiSuggestion: '建议新增',
    status: 'SUBMITTABLE',
    statusLabel: '可提交',
    importSource: '《人口基础信息数据标准.xlsx》',
    importType: 'VARCHAR',
    importLength: '256',
    importNullable: '是',
    importStandardDoc: '企业内部标准规范',
  },
];

interface ImportStandardsWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onBackToCatalog?: () => void;
  onNavigateToDataSemantics?: () => void;
}

export const ImportStandardsWorkspace: React.FC<ImportStandardsWorkspaceProps> = ({
  addToast,
  onBackToCatalog,
  onNavigateToDataSemantics,
}) => {
  // Navigation
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');

  // Alignment Filter State: 'ALL' | 'NEW' | 'SAME' | 'CHANGE' | 'CONFLICT' | 'CONFIRM_NEEDED'
  const [filterTab, setFilterTab] = useState<'CONFIRM_NEEDED' | 'ALL' | 'NEW' | 'SAME' | 'CHANGE' | 'CONFLICT'>('CONFIRM_NEEDED');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item on the left list (Default item 0: 公民身份号码)
  const [selectedItemId, setSelectedItemId] = useState<string>('imp_001');

  // Modal / Drawer states
  const [showDocTraceDrawer, setShowDocTraceDrawer] = useState(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [showConflictDecisionModal, setShowConflictDecisionModal] = useState(false);

  // Get current selected item object
  const currentItem = IMPORT_ITEMS.find((item) => item.id === selectedItemId) || IMPORT_ITEMS[0];

  // Filtered list logic
  const filteredList = IMPORT_ITEMS.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterTab === 'CONFIRM_NEEDED') {
      return matchesSearch && (item.alignResult === 'CHANGE' || item.alignResult === 'CONFLICT');
    }
    if (filterTab === 'NEW') return matchesSearch && item.alignResult === 'NEW';
    if (filterTab === 'SAME') return matchesSearch && item.alignResult === 'SAME';
    if (filterTab === 'CHANGE') return matchesSearch && item.alignResult === 'CHANGE';
    if (filterTab === 'CONFLICT') return matchesSearch && item.alignResult === 'CONFLICT';

    return matchesSearch;
  });

  const handleAction = (actionName: string, message: string) => {
    addToast?.('success', actionName, message);
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
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <Database className="w-4 h-4" />
            <span>数据连接</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('probing');
              addToast?.('info', '数据探查', '载入字段数据分布、空值率与技术探查视图');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <Search className="w-4 h-4" />
            <span>数据探查</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('quality');
              addToast?.('info', '数据质量', '查看数据质量校验规则与监控指标');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>数据质量</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('views');
              addToast?.('info', '逻辑视图', '进入企业跨源物理表关联逻辑建模架构');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <FolderTree className="w-4 h-4" />
            <span>逻辑视图</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('semantics');
              onNavigateToDataSemantics?.();
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <Sparkles className="w-4 h-4" />
            <span>数据语义</span>
          </button>

          {/* Current Selected Menu Item */}
          <button
            onClick={() => setActiveSubNav('standards')}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]"
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
        {/* PAGE HEADER: Breadcrumb + Back + Title + Wizard Stepper    */}
        {/* ========================================================= */}
        <div className="bg-white border-b border-[#E6EAF0] px-6 py-3.5 shadow-2xs shrink-0">
          <div className="flex items-center justify-between">
            <div>
              {/* Back & Breadcrumb */}
              <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-1">
                <button
                  onClick={onBackToCatalog}
                  className="font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回标准库</span>
                </button>
                <span>/</span>
                <span>数据标准</span>
                <span>/</span>
                <span>标准库</span>
                <span>/</span>
                <span className="font-semibold text-[#172033]">导入标准</span>
              </div>

              {/* Title & English Subtitle */}
              <div className="flex items-baseline space-x-3">
                <h1 className="text-base font-bold text-[#172033] tracking-tight">
                  导入标准
                </h1>
                <span className="text-xs font-mono text-[#64748B]">
                  Import Standards
                </span>
              </div>
            </div>

            {/* Stepper (Light 4-step Stepper) */}
            <div className="flex items-center space-x-2 bg-[#F8FAFC] border border-[#E6EAF0] px-3 py-1.5 rounded-lg text-xs">
              <div className="flex items-center space-x-1.5 text-[#059669] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>01 选择来源</span>
              </div>
              <span className="text-[#CBD5E1]">─</span>

              <div className="flex items-center space-x-1.5 text-[#059669] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>02 AI 解析</span>
              </div>
              <span className="text-[#CBD5E1]">─</span>

              {/* ACTIVE STEP 03 */}
              <div className="flex items-center space-x-1.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] px-2 py-0.5 rounded-md font-bold shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#2563EB]" />
                <span>03 对齐检查</span>
              </div>
              <span className="text-[#CBD5E1]">─</span>

              <div className="flex items-center space-x-1.5 text-[#94A3B8]">
                <span className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] text-[10px] flex items-center justify-center font-mono">4</span>
                <span>04 确认导入</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TASK SUMMARY BAR & AI PARSING COMPACT SUMMARY             */}
          {/* ========================================================= */}
          <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg px-3.5 py-2 gap-3">
            {/* Task Info */}
            <div className="flex items-center space-x-2.5 text-xs">
              <div className="w-6 h-6 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#172033]">《人口基础信息数据标准.xlsx》</span>
                  <span className="text-[10px] text-[#64748B] bg-white border border-[#CBD5E1] px-1.5 py-0.2 rounded font-medium">
                    企业历史标准
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  3 个工作表 · <strong className="font-bold text-[#172033]">193</strong> 项结构化标准已识别
                </p>
              </div>
            </div>

            {/* Compact AI Parsing Summary */}
            <div className="flex items-center space-x-3 text-xs border-t md:border-t-0 md:border-l border-[#E6EAF0] pt-2 md:pt-0 md:pl-3">
              <div className="flex items-center space-x-1.5">
                <span className="text-[#64748B]">共识别</span>
                <span className="font-bold text-[#172033] font-mono">193 项标准</span>
                <span className="text-[11px] text-[#64748B]">(186 数据元 · 7 码表)</span>
              </div>

              <div className="h-3 w-[1px] bg-[#CBD5E1]" />

              <div className="flex items-center space-x-2.5 text-[11px]">
                <span className="text-[#059669] font-medium">
                  <strong>172</strong> 已完整识别
                </span>
                <span className="text-[#D97706] font-medium">
                  <strong>15</strong> 建议补充
                </span>
                <span className="text-[#DC2626] font-medium">
                  <strong>6</strong> 存在解析疑问
                </span>
              </div>

              <button
                onClick={() => addToast?.('info', '重新解析', 'Xino 已重新拉取 XLSX 内容与元数据关系...')}
                className="px-2.5 py-1 text-xs font-bold text-[#2563EB] hover:bg-[#EFF6FF] border border-[#BFDBFE] rounded-md transition-all cursor-pointer flex items-center space-x-1 ml-auto"
              >
                <RefreshCw className="w-3 h-3" />
                <span>重新解析</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* WORKSPACE CONTENT: ALIGNMENT CHECK & TWO-COLUMN VIEW       */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-3.5">
          
          {/* SECTION HEADER: Title & Filter Tabs ("Human by Exception") */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 bg-white border border-[#E6EAF0] rounded-lg p-3.5 shadow-2xs">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-bold text-[#172033] tracking-tight">
                  与现有企业标准对齐
                </h2>
                <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                  Human by Exception
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Xino 已自动比较导入内容与当前正式标准库，优先展示需要人工确认的项目。
              </p>
            </div>

            {/* Alignment Filter Tabs */}
            <div className="flex flex-wrap items-center bg-[#F1F5F9] p-0.5 rounded-md text-xs font-semibold">
              <button
                onClick={() => setFilterTab('CONFIRM_NEEDED')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center space-x-1.5 ${
                  filterTab === 'CONFIRM_NEEDED'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <span>需要确认</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-[#EFF6FF] text-[#2563EB] rounded-full border border-[#BFDBFE]">
                  20
                </span>
              </button>

              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-white text-[#172033] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                全部 193
              </button>

              <button
                onClick={() => setFilterTab('NEW')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  filterTab === 'NEW'
                    ? 'bg-white text-[#059669] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                可新增 142
              </button>

              <button
                onClick={() => setFilterTab('SAME')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  filterTab === 'SAME'
                    ? 'bg-white text-[#475569] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                已有相同标准 31
              </button>

              <button
                onClick={() => setFilterTab('CHANGE')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  filterTab === 'CHANGE'
                    ? 'bg-white text-[#D97706] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                可能是标准变更 14
              </button>

              <button
                onClick={() => setFilterTab('CONFLICT')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  filterTab === 'CONFLICT'
                    ? 'bg-white text-[#DC2626] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                存在冲突 6
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TWO-COLUMN LAYOUT: Left Table (~65%) + Right Detail (~35%) */}
          {/* ========================================================= */}
          <div className="flex-1 flex overflow-hidden gap-4">
            
            {/* LEFT MAIN ALIGNMENT LIST (~65% Width) */}
            <div className="w-[65%] bg-white border border-[#E6EAF0] rounded-lg shadow-2xs flex flex-col overflow-hidden">
              
              {/* Table Search & Secondary Filter Bar */}
              <div className="p-2.5 border-b border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-between">
                <div className="relative w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索导入标准名称或编码…"
                    className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="text-xs text-[#64748B] font-medium">
                  显示 <strong className="text-[#172033] font-bold">{filteredList.length}</strong> 项结果
                </div>
              </div>

              {/* Alignment Results Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold z-10">
                    <tr>
                      <th className="py-2.5 px-3.5 w-44">导入标准</th>
                      <th className="py-2.5 px-3 w-24">类型</th>
                      <th className="py-2.5 px-3.5 w-36">对齐结果</th>
                      <th className="py-2.5 px-3.5">主要差异</th>
                      <th className="py-2.5 px-3.5 w-32">AI 建议</th>
                      <th className="py-2.5 px-3 w-24 text-right">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0]">
                    {filteredList.map((row) => {
                      const isSelected = row.id === selectedItemId;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedItemId(row.id)}
                          className={`transition-colors cursor-pointer group ${
                            isSelected
                              ? 'bg-[#EFF6FF]/70 border-l-2 border-[#2563EB]'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          {/* 导入标准 */}
                          <td className="py-2.5 px-3.5">
                            <div className="flex flex-col space-y-0.5">
                              <span className="font-bold text-[#172033] group-hover:text-[#2563EB]">
                                {row.name}
                              </span>
                              <span className="font-mono text-[11px] text-[#64748B]">
                                {row.code}
                              </span>
                            </div>
                          </td>

                          {/* 类型 */}
                          <td className="py-2.5 px-3">
                            {row.type === 'DATA_ELEMENT' ? (
                              <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded text-[11px] font-bold">
                                数据元
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] rounded text-[11px] font-bold">
                                码表
                              </span>
                            )}
                          </td>

                          {/* 对齐结果 (Colored Badges) */}
                          <td className="py-2.5 px-3.5">
                            {row.alignResult === 'CHANGE' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded-full text-[11px] font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{row.alignResultLabel}</span>
                              </span>
                            ) : row.alignResult === 'CONFLICT' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-full text-[11px] font-bold">
                                <AlertCircle className="w-3 h-3" />
                                <span>{row.alignResultLabel}</span>
                              </span>
                            ) : row.alignResult === 'SAME' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-full text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{row.alignResultLabel}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full text-[11px] font-bold">
                                <PlusCircle className="w-3 h-3" />
                                <span>{row.alignResultLabel}</span>
                              </span>
                            )}
                          </td>

                          {/* 主要差异 */}
                          <td className="py-2.5 px-3.5 text-[#334155] font-medium">
                            {row.diffSummary}
                          </td>

                          {/* AI 建议 */}
                          <td className="py-2.5 px-3.5 text-[#2563EB] font-bold">
                            {row.aiSuggestion}
                          </td>

                          {/* 状态 */}
                          <td className="py-2.5 px-3 text-right">
                            {row.status === 'AUTO_PROCESSABLE' ? (
                              <span className="text-[#059669] font-bold text-[11px] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#A7F3D0]">
                                可自动处理
                              </span>
                            ) : row.status === 'SUBMITTABLE' ? (
                              <span className="text-[#2563EB] font-bold text-[11px] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                                可提交
                              </span>
                            ) : (
                              <span className="text-[#D97706] font-bold text-[11px] bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                                待确认
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COMPARISON DETAIL PANEL (~35% Width) */}
            <div className="w-[35%] bg-white border border-[#E6EAF0] rounded-lg shadow-2xs flex flex-col overflow-y-auto p-4 space-y-4">
              
              {/* Header */}
              <div className="border-b border-[#E6EAF0] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase">
                    {currentItem.code}
                  </span>
                  <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                    {currentItem.name}
                  </h3>
                </div>

                {/* Status Badge */}
                {currentItem.alignResult === 'CHANGE' ? (
                  <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-xs font-bold rounded-md flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>可能是标准变更</span>
                  </span>
                ) : currentItem.alignResult === 'CONFLICT' ? (
                  <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] text-xs font-bold rounded-md flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>存在冲突</span>
                  </span>
                ) : currentItem.alignResult === 'SAME' ? (
                  <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-xs font-bold rounded-md flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                    <span>内容完全一致</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-md flex items-center space-x-1">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>标准库无此项目</span>
                  </span>
                )}
              </div>

              {/* DYNAMIC CONTENT SCENARIOS */}
              {currentItem.alignResult === 'CHANGE' ? (
                /* SCENARIO 1: 可能是标准变更 (e.g. 公民身份号码 长度 18 ↔ 20) */
                <div className="space-y-3.5 text-xs">
                  
                  {/* 1. 导入标准 */}
                  <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-md p-3 space-y-2">
                    <div className="flex justify-between items-center border-b border-[#E6EAF0] pb-1.5">
                      <span className="font-bold text-[#172033]">导入标准内容</span>
                      <span className="text-[11px] text-[#64748B]">来源：{currentItem.importSource}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#64748B]">数据类型：</span>
                        <strong className="text-[#172033] font-mono">{currentItem.importType}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B]">长度要求：</span>
                        <strong className="text-[#D97706] font-mono font-bold bg-[#FEF3C7] px-1 py-0.2 rounded border border-[#FDE68A]">
                          {currentItem.importLength}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#64748B]">允许为空：</span>
                        <strong className="text-[#172033]">{currentItem.importNullable}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B]">来源依据：</span>
                        <strong className="text-[#2563EB]">{currentItem.importStandardDoc}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. 当前企业标准 */}
                  <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-md p-3 space-y-2">
                    <div className="flex justify-between items-center border-b border-[#E6EAF0] pb-1.5">
                      <span className="font-bold text-[#172033]">当前企业标准 ({currentItem.currentVersion})</span>
                      <span className="text-[11px] font-mono text-[#2563EB]">{currentItem.currentCode}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#64748B]">数据类型：</span>
                        <strong className="text-[#172033] font-mono">{currentItem.currentType}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B]">长度要求：</span>
                        <strong className="text-[#172033] font-mono font-bold">{currentItem.currentLength}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B]">允许为空：</span>
                        <strong className="text-[#172033]">{currentItem.currentNullable}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B]">关联使用：</span>
                        <strong className="text-[#2563EB]">{currentItem.currentUsageCount} 个字段</strong>
                      </div>
                    </div>
                  </div>

                  {/* 3. 差异对比 (Mini Diff Table) */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-[#172033]">差异对比 (Diff)</span>
                    <div className="border border-[#E6EAF0] rounded-md overflow-hidden bg-white text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B]">
                            <th className="py-1.5 px-2.5">标准要求</th>
                            <th className="py-1.5 px-2.5">当前企业标准</th>
                            <th className="py-1.5 px-2.5">导入标准</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6EAF0]">
                          <tr>
                            <td className="py-1.5 px-2.5 text-[#64748B]">数据类型</td>
                            <td className="py-1.5 px-2.5 font-mono">VARCHAR</td>
                            <td className="py-1.5 px-2.5 font-mono">VARCHAR</td>
                          </tr>
                          <tr className="bg-[#FEF3C7]/40">
                            <td className="py-1.5 px-2.5 font-bold text-[#D97706]">长度</td>
                            <td className="py-1.5 px-2.5 font-mono font-bold text-[#172033]">20</td>
                            <td className="py-1.5 px-2.5 font-mono font-bold text-[#D97706]">18 (变化)</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-2.5 text-[#64748B]">是否为空</td>
                            <td className="py-1.5 px-2.5">否</td>
                            <td className="py-1.5 px-2.5">否</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-2.5 text-[#64748B]">标准依据</td>
                            <td className="py-1.5 px-2.5">企业标准</td>
                            <td className="py-1.5 px-2.5 text-[#2563EB]">国家标准</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. Xino 建议 */}
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1.5 text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-[#1E40AF]">
                      <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Xino 建议</span>
                    </div>
                    <p className="font-bold text-[#172033]">
                      导入标准可能是现有“公民身份号码”标准的更新版本。
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-[#334155] space-y-0.5 pl-1">
                      <li>标准名称与业务定义完全一致</li>
                      <li>数据类型与规则约束一致</li>
                      <li>新来源为较新的 GB/T 国家标准规范</li>
                      <li>主要差异集中在长度要求（18 ↔ 20）</li>
                    </ul>
                    <p className="text-[11px] text-[#2563EB] font-semibold pt-1 border-t border-[#BFDBFE]">
                      建议评估是否将企业标准更新为新版本，而不是创建重复标准。
                    </p>
                  </div>

                  {/* 5. 原文依据 */}
                  {currentItem.docTraceDocName && (
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#172033]">原文依据</span>
                        <p className="text-[11px] text-[#64748B]">
                          {currentItem.docTraceDocName} · {currentItem.docTraceSection}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDocTraceDrawer(true)}
                        className="px-2 py-1 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>查看原文</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-[#E6EAF0]">
                    <button
                      onClick={() => handleAction('提议更新', '已成功发起“公民身份号码 V5”标准变更提议草稿')}
                      className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-all cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
                    >
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>提出标准变更</span>
                    </button>

                    <button
                      onClick={() => handleAction('保留现有', '已保留当前企业标准 V4 设定')}
                      className="w-full py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#E6EAF0] text-xs font-bold rounded-md transition-all cursor-pointer"
                    >
                      保留当前企业标准
                    </button>

                    <button
                      onClick={() => handleAction('暂不处理', '已暂存待后续确认')}
                      className="w-full py-1 text-[#94A3B8] hover:text-[#64748B] text-xs font-medium cursor-pointer text-center"
                    >
                      暂不处理
                    </button>
                  </div>

                </div>
              ) : currentItem.alignResult === 'SAME' ? (
                /* SCENARIO 2: 已有相同标准 (e.g. 性别代码) */
                <div className="space-y-3.5 text-xs">
                  
                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-2">
                    <span className="font-bold text-[#172033]">值域/码表比对</span>
                    <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11px]">
                      {/* 导入值域 */}
                      <div className="bg-white p-2.5 rounded-md border border-[#E6EAF0] space-y-1">
                        <span className="font-bold text-[#2563EB]">导入值域码值</span>
                        <div className="space-y-0.5 font-mono">
                          {currentItem.importValues?.map((v) => (
                            <div key={v.code} className="flex justify-between text-[#334155]">
                              <span>{v.code}</span>
                              <span className="font-sans text-[#172033] font-medium">{v.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 当前企业值域 */}
                      <div className="bg-white p-2.5 rounded-md border border-[#E6EAF0] space-y-1">
                        <span className="font-bold text-[#172033]">当前企业值域 ({currentItem.currentVersion})</span>
                        <div className="space-y-0.5 font-mono">
                          {currentItem.currentValues?.map((v) => (
                            <div key={v.code} className="flex justify-between text-[#334155]">
                              <span>{v.code}</span>
                              <span className="font-sans text-[#172033] font-medium">{v.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Xino Judgement */}
                  <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-md space-y-1 text-xs text-[#065F46]">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                      <span>内容完全一致</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      导入值域码值与当前企业标准【{currentItem.name} ({currentItem.currentVersion})】100% 重合，无需重复新建。
                    </p>
                  </div>

                  {/* Action */}
                  <div className="pt-2 border-t border-[#E6EAF0]">
                    <button
                      onClick={() => handleAction('复用标准', `已设置复用现有“${currentItem.name} ${currentItem.currentVersion}”`)}
                      className="w-full py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-md transition-all cursor-pointer shadow-2xs"
                    >
                      复用现有标准
                    </button>
                  </div>

                </div>
              ) : currentItem.alignResult === 'CONFLICT' ? (
                /* SCENARIO 3: 存在冲突 (e.g. 事项完成时间) */
                <div className="space-y-3.5 text-xs">
                  
                  <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md space-y-1 text-[#991B1B]">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>检测到 2 个匹配的标准候选</span>
                    </div>
                    <p className="text-[11px]">
                      当前导入的“{currentItem.name}”可能同时对应企业标准库中的两个独立标准定义，需要人工裁决关联。
                    </p>
                  </div>

                  {/* Candidates List */}
                  <div className="space-y-2">
                    <span className="font-bold text-[#172033]">候选标准对象</span>
                    {currentItem.conflictCandidates?.map((cand, idx) => (
                      <div key={idx} className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#172033]">{cand.name}</span>
                          <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                            候选 {idx + 1}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">{cand.desc}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {cand.basis.map((b, i) => (
                            <span key={i} className="text-[10px] bg-white border border-[#CBD5E1] text-[#334155] px-1.5 py-0.2 rounded">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="pt-2 border-t border-[#E6EAF0]">
                    <button
                      onClick={() => setShowConflictDecisionModal(true)}
                      className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-all cursor-pointer shadow-2xs"
                    >
                      处理冲突
                    </button>
                  </div>

                </div>
              ) : (
                /* SCENARIO 4: 可新增 (e.g. 出生日期) */
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1 text-[#1E40AF]">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <PlusCircle className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>建议新增为企业正式数据标准</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      当前标准库中尚无匹配的“{currentItem.name} ({currentItem.code})”标准，Xino 建议将其直接纳管新增。
                    </p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">数据类型</span>
                      <span className="font-mono font-bold text-[#172033]">{currentItem.importType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">标准依据</span>
                      <span className="font-bold text-[#2563EB]">{currentItem.importStandardDoc}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E6EAF0]">
                    <button
                      onClick={() => handleAction('提交新增', `已将【${currentItem.name}】标注为拟新增数据标准`)}
                      className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-all cursor-pointer shadow-2xs"
                    >
                      新增为企业标准
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* FIXED FOOTER BAR                                         */}
        {/* ========================================================= */}
        <footer className="bg-white border-t border-[#E6EAF0] px-6 py-3 flex items-center justify-between shrink-0 shadow-2xs">
          <button
            onClick={onBackToCatalog}
            className="px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#E6EAF0] text-xs font-bold rounded-md transition-all cursor-pointer flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>上一步</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => handleAction('草稿已保存', '已将当前 193 项对齐确认状态存为导入草稿')}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#E6EAF0] text-xs font-bold rounded-md transition-all cursor-pointer"
            >
              保存导入草稿
            </button>

            {/* Primary CTA: Step 04 Trigger */}
            <button
              onClick={() => setShowConfirmSubmitModal(true)}
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
            >
              <span>下一步：确认导入</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>

      </main>

      {/* ========================================================= */}
      {/* DRAWERS & MODALS                                          */}
      {/* ========================================================= */}

      {/* 1. Original Document Trace Drawer (查看原文) */}
      {showDocTraceDrawer && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
          <div className="w-[480px] bg-white h-full shadow-2xl flex flex-col p-5 space-y-4 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                <span>原文依据与标准来源追溯</span>
              </h3>
              <button
                onClick={() => setShowDocTraceDrawer(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md text-[#1E40AF]">
                Xino 自动定位到了导入文件关联的底层标准文档，以下为提取的原文字段要求。
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-[#172033]">标准文档信息</span>
                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                  <div className="flex justify-between font-bold text-[#172033]">
                    <span>{currentItem.docTraceDocName}</span>
                    <span className="text-[#2563EB]">{currentItem.docTraceSection}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">发文单位：国家标准化管理委员会</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-[#172033]">PDF/Word 摘录文本</span>
                <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md font-mono text-xs text-[#172033] leading-relaxed relative">
                  "{currentItem.docTraceExcerpt}"
                </div>
              </div>
            </div>

            <div className="mt-auto pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setShowDocTraceDrawer(false)}
                className="w-full py-2 bg-[#F1F5F9] text-[#172033] font-bold text-xs rounded-md cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Step 04 Confirm Submit Preview Modal (导入确认) */}
      {showConfirmSubmitModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="w-[500px] bg-white rounded-lg shadow-2xl p-5 space-y-4 border border-[#E6EAF0] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">
                  导入确认
                </h3>
                <p className="text-[11px] text-[#64748B]">确认后将把标准对齐结果提交至 Semovix 治理工作流</p>
              </div>
              <button
                onClick={() => setShowConfirmSubmitModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-0.5">
                  <span className="text-[#2563EB] font-bold">142 个</span>
                  <p className="text-[#172033] font-medium">新增标准建议</p>
                </div>

                <div className="p-2.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-md space-y-0.5">
                  <span className="text-[#475569] font-bold">31 项</span>
                  <p className="text-[#172033] font-medium">复用现有标准</p>
                </div>

                <div className="p-2.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-md space-y-0.5">
                  <span className="text-[#D97706] font-bold">14 个</span>
                  <p className="text-[#172033] font-medium">标准变更建议</p>
                </div>

                <div className="p-2.5 bg-[#FEE2E2] border border-[#FECACA] rounded-md space-y-0.5">
                  <span className="text-[#DC2626] font-bold">6 个</span>
                  <p className="text-[#172033] font-medium">待处理冲突</p>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[#64748B] text-[11px] leading-relaxed">
                💡 <strong>温馨提示：</strong> 导入不会直接强制覆盖现有正式企业标准。所有新增和变更内容将自动生成评审提议，进入数据标准委员会治理确认环节。
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2.5 border-t border-[#E6EAF0]">
              <button
                onClick={() => setShowConfirmSubmitModal(false)}
                className="px-3.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E6EAF0] text-[#172033] font-bold text-xs rounded-md cursor-pointer"
              >
                返回修改
              </button>

              <button
                onClick={() => {
                  setShowConfirmSubmitModal(false);
                  addToast?.('success', '提交治理确认成功', '标准导入任务已完成并送入审核中心！');
                  if (onBackToCatalog) onBackToCatalog();
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-md transition-all cursor-pointer shadow-2xs"
              >
                提交治理确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Conflict Decision Modal (处理冲突) */}
      {showConflictDecisionModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="w-[500px] bg-white rounded-lg shadow-2xl p-5 space-y-3.5 border border-[#E6EAF0]">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <h3 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                <span>标准冲突人工裁决</span>
              </h3>
              <button
                onClick={() => setShowConflictDecisionModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <p className="text-[#64748B]">
                针对导入的【<strong>事项完成时间</strong>】，请选择裁决方案：
              </p>

              <div className="space-y-2">
                <label className="p-2.5 bg-[#F8FAFC] border border-[#2563EB] rounded-md flex items-start space-x-2.5 cursor-pointer">
                  <input type="radio" name="conflict" defaultChecked className="mt-0.5" />
                  <div>
                    <span className="font-bold text-[#172033]">映射至【业务办结时间 (DE_CASE_CLOSE_TIME)】</span>
                    <p className="text-[11px] text-[#64748B]">认定其为政务热线诉求办结的标准业务时间点。</p>
                  </div>
                </label>

                <label className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex items-start space-x-2.5 cursor-pointer">
                  <input type="radio" name="conflict" className="mt-0.5" />
                  <div>
                    <span className="font-bold text-[#172033]">映射至【系统关闭时间 (DE_SYSTEM_CLOSE_TIME)】</span>
                    <p className="text-[11px] text-[#64748B]">认定其为系统后台技术自动关闭与归档的时间戳。</p>
                  </div>
                </label>

                <label className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex items-start space-x-2.5 cursor-pointer">
                  <input type="radio" name="conflict" className="mt-0.5" />
                  <div>
                    <span className="font-bold text-[#172033]">拆分为全新独立标准</span>
                    <p className="text-[11px] text-[#64748B]">认为两者业务含义均不相符，新建全新标准。</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2.5 border-t border-[#E6EAF0]">
              <button
                onClick={() => setShowConflictDecisionModal(false)}
                className="px-3.5 py-1.5 bg-[#F1F5F9] text-[#172033] font-bold text-xs rounded-md cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowConflictDecisionModal(false);
                  addToast?.('success', '冲突裁决完成', '已将“事项完成时间”映射至【业务办结时间】！');
                }}
                className="px-4 py-1.5 bg-[#2563EB] text-white font-bold text-xs rounded-md transition-all cursor-pointer shadow-2xs"
              >
                保存裁决
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
