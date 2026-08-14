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
  ChevronDown,
  CheckSquare,
  Square,
  ArrowRight
} from 'lucide-react';

export interface MatchingItem {
  id: string;
  fieldCode: string;
  tableName: string;
  dbName: string;
  fieldType: string;
  recommendedStandardName: string;
  recommendedStandardCode: string;
  recommendedStandardVersion: string;
  businessObject: string;
  semanticType: string;
  businessDomain: string;
  confidenceLabel: '高可信' | '较高可信' | '中等可信';
  status: 'MATCHED' | 'PENDING' | 'CONFLICT' | 'UNMATCHED' | 'RECONFIRM';
  statusLabel: string;
  
  // Right side evidence context
  aiExplanation: string;
  evidences: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  counterNotice?: string;
}

const MATCHING_ITEMS: MatchingItem[] = [
  {
    id: 'mat_001',
    fieldCode: 'close_time',
    tableName: 'case_record',
    dbName: 'population_service',
    fieldType: 'DATETIME',
    recommendedStandardName: '业务办结时间',
    recommendedStandardCode: 'DE_CASE_CLOSE_TIME',
    recommendedStandardVersion: 'V3',
    businessObject: '工单',
    semanticType: '事件时间',
    businessDomain: '公共服务',
    confidenceLabel: '高可信',
    status: 'PENDING',
    statusLabel: '待确认',
    aiExplanation: '该字段表达工单业务生命周期中的实际完成时间，与企业正式标准“业务办结时间”在业务语义、所属对象与数据格式上高度一致。',
    evidences: [
      { label: '字段语义', value: '事件时间', note: '与标准业务语义契合度 100%' },
      { label: '业务对象', value: '工单 · 办结时间', note: '与标准绑定的实体模型完全一致' },
      { label: '数据类型', value: 'DATETIME', note: '与标准技术规范要求完全相符' },
      { label: '使用方式', value: '时间范围过滤与办结效率统计', note: '符合企业数仓常规查询惯例' },
      { label: '历史确认', value: '17 个语义相似字段', note: '已有同类热线字段绑定该标准' },
    ],
    counterNotice: '部分下游查询注释中将该字段解释为“系统关闭时间”，可能存在物理命名惯性带来的归类混淆。',
  },
  {
    id: 'mat_002',
    fieldCode: 'citizen_id',
    tableName: 'person',
    dbName: 'population_base',
    fieldType: 'VARCHAR(18)',
    recommendedStandardName: '公民身份号码',
    recommendedStandardCode: 'DE_PERSON_ID',
    recommendedStandardVersion: 'V5',
    businessObject: '自然人',
    semanticType: '身份标识',
    businessDomain: '人口基础',
    confidenceLabel: '高可信',
    status: 'PENDING',
    statusLabel: '待确认',
    aiExplanation: '该字段物理存储格式为 18 位字符串，包含身份证号正则表达式规则特征，完全遵循国家标准 GB 11643。',
    evidences: [
      { label: '字段语义', value: '身份标识', note: '与标准主键校验规范一致' },
      { label: '业务对象', value: '自然人 · 主键', note: '归属于人口基础主数据' },
      { label: '数据类型', value: 'VARCHAR(18)', note: '符合国标 GB 11643 标准约束' },
      { label: '探查特征', value: '100% 规则合规率', note: '样例数据全部通过校验' },
    ],
  },
  {
    id: 'mat_003',
    fieldCode: 'gender_cd',
    tableName: 'person',
    dbName: 'population_base',
    fieldType: 'VARCHAR(2)',
    recommendedStandardName: '性别代码',
    recommendedStandardCode: 'GENDER_CODE',
    recommendedStandardVersion: 'V2',
    businessObject: '自然人',
    semanticType: '分类属性',
    businessDomain: '人口基础',
    confidenceLabel: '较高可信',
    status: 'PENDING',
    statusLabel: '待确认',
    aiExplanation: '该字段在数值探查中仅出现 "1", "2", "9" 等离散取值，对应 GB/T 2261.1 国家性别代码值域映射。',
    evidences: [
      { label: '字段语义', value: '分类属性', note: '属于基础特征枚举分类' },
      { label: '值域分布', value: '1, 2, 9', note: '与 GB/T 2261.1 码表完全重合' },
    ],
  },
  {
    id: 'mat_004',
    fieldCode: 'finish_date',
    tableName: 'history',
    dbName: 'service_case',
    fieldType: 'DATE',
    recommendedStandardName: '业务办结日期',
    recommendedStandardCode: 'DE_BUSINESS_FINISH_DATE',
    recommendedStandardVersion: 'V1',
    businessObject: '工单',
    semanticType: '生命周期',
    businessDomain: '公共服务',
    confidenceLabel: '中等可信',
    status: 'PENDING',
    statusLabel: '待确认',
    aiExplanation: '该字段仅精确到天（DATE），物理精细度略低于标准要求（DATETIME），但业务含义仍匹配“办结日期”。',
    evidences: [
      { label: '字段语义', value: '生命周期日期', note: '缺乏时分秒精确度' },
    ],
    counterNotice: '物理字段类型为 DATE，若强制要求 DATETIME 可能导致数据类型不一致报警。',
  },
  // Conflict Row Sample
  {
    id: 'mat_005',
    fieldCode: 'close_time',
    tableName: 'case_record',
    dbName: 'public_service_db',
    fieldType: 'DATETIME',
    recommendedStandardName: '业务办结时间 ↔ 系统关闭时间',
    recommendedStandardCode: 'DE_CASE_CLOSE_TIME / DE_SYSTEM_CLOSE_TIME',
    recommendedStandardVersion: 'V3 / V2',
    businessObject: '工单',
    semanticType: '事件时间 / 系统状态',
    businessDomain: '公共服务',
    confidenceLabel: '中等可信',
    status: 'CONFLICT',
    statusLabel: '有冲突',
    aiExplanation: '该字段同时具备“业务真正办理完成”和“系统自动化归档”双重技术与业务证据，触发候选冲突，需人工裁决。',
    evidences: [
      { label: '候选 A', value: '业务办结时间', note: '业务含义相符，符合诉求闭环分析' },
      { label: '候选 B', value: '系统关闭时间', note: '物理列名 close_time 更接近技术归档' },
    ],
  },
  // Unmatched Row Sample
  {
    id: 'mat_006',
    fieldCode: 'resident_category',
    tableName: 'person',
    dbName: 'population_base',
    fieldType: 'VARCHAR(16)',
    recommendedStandardName: '未发现精确匹配标准',
    recommendedStandardCode: 'N/A',
    recommendedStandardVersion: '—',
    businessObject: '自然人',
    semanticType: '人口分类',
    businessDomain: '人口基础',
    confidenceLabel: '中等可信',
    status: 'UNMATCHED',
    statusLabel: '未匹配',
    aiExplanation: '探查识别为居民居住分类（户籍/常住/流动/境外），但当前企业正式标准库中缺失对应的标准数据元。',
    evidences: [
      { label: '聚类规模', value: '16 个相似字段', note: '稳定包含相同枚举与业务术语' },
      { label: '标准建议', value: '建议新增“居民分类”标准', note: '可一键转入标准建议裁决节点' },
    ],
  },
  // Reconfirm Row Sample
  {
    id: 'mat_007',
    fieldCode: 'close_time',
    tableName: 'history_archive',
    dbName: 'legacy_data',
    fieldType: 'VARCHAR(32)',
    recommendedStandardName: '业务办结时间 (旧匹配)',
    recommendedStandardCode: 'DE_CASE_CLOSE_TIME',
    recommendedStandardVersion: 'V2',
    businessObject: '工单',
    semanticType: '事件时间',
    businessDomain: '公共服务',
    confidenceLabel: '中等可信',
    status: 'RECONFIRM',
    statusLabel: '需要重新确认',
    aiExplanation: '该字段之前已落标“业务办结时间”，但最近 DDL 变更将其类型由 DATETIME 改为 VARCHAR(32)，原匹配关系失效。',
    evidences: [
      { label: '变更原因', value: '物理类型发生变更', note: 'DATETIME → VARCHAR(32)' },
      { label: '治理建议', value: '重新评估匹配或配置类型转换', note: '防止影响后续数据标准检查' },
    ],
  },
];

interface StandardMatchingWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToStandardProposalReview?: () => void;
  onNavigateToMappingConflictReview?: () => void;
  onNavigateToCatalogTab?: () => void;
  onNavigateToCheckTab?: () => void;
  onNavigateToDataSemantics?: () => void;
}

export const StandardMatchingWorkspace: React.FC<StandardMatchingWorkspaceProps> = ({
  addToast,
  onNavigateToStandardProposalReview,
  onNavigateToMappingConflictReview,
  onNavigateToCatalogTab,
  onNavigateToCheckTab,
  onNavigateToDataSemantics,
}) => {
  // SubNav selection
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');

  // Status Filter Tabs: 'PENDING' (412) | 'MATCHED' (9832) | 'CONFLICT' (176) | 'UNMATCHED' (134) | 'RECONFIRM' (37) | 'ALL'
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'MATCHED' | 'CONFLICT' | 'UNMATCHED' | 'RECONFIRM' | 'ALL'>('PENDING');

  // Multi-select Checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Selected row for Right Evidence Context
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // Filtered rows
  const filteredRows = MATCHING_ITEMS.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  const currentSelectedRow = filteredRows[selectedRowIndex] || MATCHING_ITEMS[0];

  // Modals
  const [showPickerModal, setShowPickerModal] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showScopeModal, setShowScopeModal] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map((r) => r.id));
    }
  };

  const handleToggleRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleConfirmSingleMatch = () => {
    addToast?.('success', '匹配确认成功', `字段【${currentSelectedRow.fieldCode}】已成功挂接标准【${currentSelectedRow.recommendedStandardName}】`);
    if (selectedRowIndex < filteredRows.length - 1) {
      setSelectedRowIndex(selectedRowIndex + 1);
    }
  };

  const handleBatchConfirm = () => {
    setShowBatchModal(false);
    addToast?.('success', '批量确认成功', `已成功批量落标 ${selectedIds.length > 0 ? selectedIds.length : 23} 个同类字段`);
    setSelectedIds([]);
  };

  const handleReanalyze = () => {
    setIsReanalyzing(true);
    addToast?.('info', '启动 AI 分析', '正在基于语义规则库对人口服务 1,286 个新增字段进行大规模标准匹配分析…');
    setTimeout(() => {
      setIsReanalyzing(false);
      addToast?.('success', '分析完毕', '匹配分析已完成，更新了 12 项高可信标准推荐结果');
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

            {/* Active Selected Tab */}
            <button
              className="pb-3 border-b-2 border-[#2563EB] text-[#2563EB] transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>标准匹配</span>
              <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded text-[10px]">
                412 待确认
              </span>
            </button>

            <button
              onClick={() => {
                if (onNavigateToCheckTab) {
                  onNavigateToCheckTab();
                } else {
                  addToast?.('info', '标准检查', '切换至标准执行情况检查工作台');
                }
              }}
              className="pb-3 border-b-2 border-transparent text-[#64748B] hover:text-[#172033] transition-all cursor-pointer"
            >
              标准检查
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SUBHEADER HINT & COMPACT SCOPE BAR                        */}
        {/* ========================================================= */}
        <div className="px-8 pt-4 pb-2 space-y-3 shrink-0">
          <p className="text-xs text-[#64748B]">
            AI 已帮助识别真实数据与企业正式标准之间的关系，优先处理需要人工判断的异常项。
          </p>

          {/* Scope Bar */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl p-3 flex items-center justify-between text-xs shadow-2xs">
            <div className="flex items-center space-x-3">
              <span className="text-[#64748B] font-bold">当前分析范围：</span>
              <button
                onClick={() => setShowScopeModal(true)}
                className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] hover:border-[#BFDBFE] font-bold text-[#172033] hover:text-[#2563EB] rounded-lg transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <span>人口服务 · 本次新增资产</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>
              <span className="text-[#94A3B8]">|</span>
              <span className="text-[#334155] font-medium">
                包含 <strong className="text-[#172033] font-bold font-mono">1,286</strong> 个物理数据字段
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[#64748B] text-[11px]">
                最近分析：10:38
              </span>

              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#93C5FD] text-white font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                <span>重新分析</span>
              </button>
            </div>
          </div>

          {/* Status Segmented Summary Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2 bg-[#F1F5F9] p-1 rounded-xl text-xs font-bold border border-[#E6EAF0]">
              <button
                onClick={() => {
                  setStatusFilter('MATCHED');
                  setSelectedRowIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'MATCHED'
                    ? 'bg-[#059669] text-white shadow-2xs'
                    : 'text-[#059669] hover:bg-[#D1FAE5]'
                }`}
              >
                <span>已匹配</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  9,832
                </span>
              </button>

              <button
                onClick={() => {
                  setStatusFilter('PENDING');
                  setSelectedRowIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'PENDING'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-[#2563EB] hover:bg-[#EFF6FF]'
                }`}
              >
                <span>待确认</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  412
                </span>
              </button>

              <button
                onClick={() => {
                  setStatusFilter('CONFLICT');
                  setSelectedRowIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'CONFLICT'
                    ? 'bg-[#D97706] text-white shadow-2xs'
                    : 'text-[#D97706] hover:bg-[#FEF3C7]'
                }`}
              >
                <span>有冲突</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  176
                </span>
              </button>

              <button
                onClick={() => {
                  setStatusFilter('UNMATCHED');
                  setSelectedRowIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'UNMATCHED'
                    ? 'bg-[#64748B] text-white shadow-2xs'
                    : 'text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                <span>未匹配</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  134
                </span>
              </button>

              <button
                onClick={() => {
                  setStatusFilter('RECONFIRM');
                  setSelectedRowIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  statusFilter === 'RECONFIRM'
                    ? 'bg-[#4F46E5] text-white shadow-2xs'
                    : 'text-[#4F46E5] hover:bg-[#EEF2FF]'
                }`}
              >
                <span>需要重新确认</span>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  37
                </span>
              </button>

              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setSelectedRowIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-[#172033] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                全部
              </button>
            </div>

            {/* AI Similar Group Batch Tip */}
            {statusFilter === 'PENDING' && (
              <div className="flex items-center space-x-2 bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1.5 rounded-xl text-xs text-[#1E40AF]">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span>
                  AI 已自动按语义聚类 <strong>23 项</strong> 办结时间相似字段，建议批量确认。
                </span>
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg transition-all cursor-pointer ml-2 text-[11px]"
                >
                  批量确认 23 项
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN WORKSPACE split: Left Queue (~68%) + Right Evidence (~32%) */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden px-8 pb-6 gap-5 mt-1">
          
          {/* ======================================================= */}
          {/* COLUMN 1: LEFT MAIN MATCHING QUEUE TABLE (~68% Width)    */}
          {/* ======================================================= */}
          <div className="w-[68%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col overflow-hidden shrink-0">
            
            {/* Table Toolbar */}
            <div className="p-3 border-b border-[#E6EAF0] flex items-center justify-between gap-3 bg-[#F8FAFC]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="搜索字段、表或标准…"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E6EAF0] rounded-lg text-xs font-medium text-[#172033] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button className="px-2.5 py-1.5 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] font-medium hover:bg-[#F1F5F9] cursor-pointer flex items-center space-x-1">
                  <span>业务域: 全部</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>

                <button className="px-2.5 py-1.5 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] font-medium hover:bg-[#F1F5F9] cursor-pointer flex items-center space-x-1">
                  <span>可信程度: 全部</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>

                {selectedIds.length > 0 && (
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="px-3 py-1.5 bg-[#2563EB] text-white font-bold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <span>批量确认 {selectedIds.length} 项</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold sticky top-0 z-10">
                    <th className="py-2.5 px-3 w-8">
                      <button onClick={handleSelectAll} className="cursor-pointer text-[#64748B]">
                        {selectedIds.length === filteredRows.length && filteredRows.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#2563EB]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#CBD5E1]" />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-3">数据字段与技术上下文</th>
                    <th className="py-2.5 px-3">AI 推荐标准</th>
                    <th className="py-2.5 px-3">业务上下文</th>
                    <th className="py-2.5 px-3">判断</th>
                    <th className="py-2.5 px-3">状态</th>
                    <th className="py-2.5 px-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAF0]">
                  {filteredRows.map((row, index) => {
                    const isSelectedRow = selectedRowIndex === index;
                    const isChecked = selectedIds.includes(row.id);

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRowIndex(index)}
                        className={`transition-all cursor-pointer hover:bg-[#F8FAFC] ${
                          isSelectedRow ? 'bg-[#EFF6FF]/60 font-medium' : 'bg-white'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleToggleRow(row.id)} className="cursor-pointer">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-[#2563EB]" />
                            ) : (
                              <Square className="w-4 h-4 text-[#CBD5E1]" />
                            )}
                          </button>
                        </td>

                        {/* Physical Field Code & DB */}
                        <td className="py-3 px-3">
                          <div>
                            <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                              <span className="font-mono text-sm">{row.fieldCode}</span>
                              <span className="text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded border border-[#E6EAF0]">
                                {row.fieldType}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-[#64748B]">
                              {row.dbName}.{row.tableName}
                            </span>
                          </div>
                        </td>

                        {/* AI Recommended Standard */}
                        <td className="py-3 px-3">
                          <div>
                            <div className="font-bold text-[#2563EB] flex items-center space-x-1">
                              <span>{row.recommendedStandardName}</span>
                              {row.recommendedStandardVersion !== '—' && (
                                <span className="text-[10px] font-mono text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.2 rounded">
                                  {row.recommendedStandardVersion}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-[#64748B]">
                              {row.recommendedStandardCode}
                            </span>
                          </div>
                        </td>

                        {/* Business Context */}
                        <td className="py-3 px-3">
                          <div>
                            <div className="font-bold text-[#172033]">
                              {row.businessObject} · <span className="text-[#4F46E5]">{row.semanticType}</span>
                            </div>
                            <span className="text-[11px] text-[#64748B]">
                              {row.businessDomain}
                            </span>
                          </div>
                        </td>

                        {/* Confidence Label (Qualitative) */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.confidenceLabel === '高可信'
                              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                              : row.confidenceLabel === '较高可信'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                              : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                          }`}>
                            {row.confidenceLabel}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            row.status === 'PENDING'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                              : row.status === 'CONFLICT'
                              ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                              : row.status === 'UNMATCHED'
                              ? 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                              : row.status === 'RECONFIRM'
                              ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]'
                              : 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                          }`}>
                            {row.statusLabel}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3 text-right">
                          {row.status === 'CONFLICT' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigateToMappingConflictReview) {
                                  onNavigateToMappingConflictReview();
                                } else {
                                  addToast?.('info', '跳转至冲突裁决', '已导航至标准匹配冲突裁决工作台');
                                }
                              }}
                              className="px-2.5 py-1 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-lg transition-all cursor-pointer text-xs flex items-center space-x-1 ml-auto"
                            >
                              <span>处理冲突</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : row.status === 'UNMATCHED' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigateToStandardProposalReview) {
                                  onNavigateToStandardProposalReview();
                                } else {
                                  addToast?.('info', '跳转至标准建议', '已重定向至标准建议裁决页面');
                                }
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold rounded-lg transition-all cursor-pointer text-xs"
                            >
                              查看标准建议
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRowIndex(index);
                                handleConfirmSingleMatch();
                              }}
                              className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg transition-all cursor-pointer text-xs shadow-2xs"
                            >
                              确认
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 2: RIGHT SIDEBAR · EVIDENCE CONTEXT (~32% Width)   */}
          {/* ======================================================= */}
          <div className="w-[32%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col justify-between overflow-y-auto p-5 space-y-4 shrink-0">
            
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#E6EAF0] pb-3">
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">
                  Matching Evidence Context
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <h2 className="text-base font-bold text-[#172033] tracking-tight">
                    判断依据
                  </h2>
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded">
                    {currentSelectedRow.fieldCode}
                  </span>
                </div>
              </div>

              {/* Recommended Match Card */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">推荐匹配标准</span>
                <div className="flex items-baseline space-x-2">
                  <h3 className="text-base font-bold text-[#172033]">
                    {currentSelectedRow.recommendedStandardName}
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#2563EB]">
                    {currentSelectedRow.recommendedStandardCode}
                  </span>
                </div>

                <p className="text-xs text-[#334155] leading-relaxed bg-white p-2.5 rounded-lg border border-[#E6EAF0]">
                  {currentSelectedRow.aiExplanation}
                </p>
              </div>

              {/* Core Evidences List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1.5">
                  支撑证据 (Core Evidences)
                </span>

                <div className="space-y-2 text-xs">
                  {currentSelectedRow.evidences.map((ev, i) => (
                    <div key={i} className="p-2.5 bg-white border border-[#E6EAF0] rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#172033] flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                          <span>{ev.label}</span>
                        </span>
                        <strong className="text-[#2563EB] font-mono">{ev.value}</strong>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-snug pl-4">
                        {ev.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counter-Notice / Attention Area */}
              {currentSelectedRow.counterNotice && (
                <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl space-y-1 text-xs text-[#92400E]">
                  <div className="flex items-center space-x-1 font-bold">
                    <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                    <span>需要注意 (Counter Notice)</span>
                  </div>
                  <p className="text-[11px] text-[#78350F] leading-relaxed">
                    {currentSelectedRow.counterNotice}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Primary Actions */}
            <div className="pt-3 border-t border-[#E6EAF0] space-y-2">
              <button
                onClick={handleConfirmSingleMatch}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>确认匹配</span>
              </button>

              <button
                onClick={() => setShowPickerModal(true)}
                className="w-full py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>选择其他标准</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToStandardProposalReview) {
                    onNavigateToStandardProposalReview();
                  } else {
                    addToast?.('info', '标准缺口', '当前还有 23 个语义相近字段未找到正式标准，已进入标准建议裁决页面');
                  }
                }}
                className="w-full py-1.5 text-[#64748B] hover:text-[#172033] text-xs font-medium cursor-pointer text-center underline block"
              >
                暂无合适标准（查看标准建议）
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL: Light Standard Picker                              */}
      {/* ========================================================= */}
      {showPickerModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[560px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                选择其他企业标准 (Standard Picker)
              </h3>
              <button
                onClick={() => setShowPickerModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="搜索标准名称、编码或定义…"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg text-xs font-medium text-[#172033]"
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto text-xs pr-1">
              {[
                { name: '业务办结时间', code: 'DE_CASE_CLOSE_TIME', version: 'V3', def: '业务事项实际完成办理的时间点', usages: 126 },
                { name: '系统关闭时间', code: 'DE_SYSTEM_CLOSE_TIME', version: 'V2', def: '系统后台置为关闭归档状态的技术时间点', usages: 42 },
                { name: '事项完成日期', code: 'DE_APPROVAL_CLOSE_TIME', version: 'V1', def: '政务审批场景下的办结时间点', usages: 47 },
              ].map((std, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setShowPickerModal(false);
                    addToast?.('success', '调整成功', `已将字段关联标准重置为【${std.name}】`);
                  }}
                  className="p-3 bg-white hover:bg-[#EFF6FF] border border-[#E6EAF0] hover:border-[#BFDBFE] rounded-xl cursor-pointer transition-all space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#172033]">{std.name}</span>
                    <span className="text-[10px] font-mono text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                      {std.code} · {std.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">{std.def}</p>
                  <span className="text-[10px] text-[#94A3B8] block">当前已绑定 {std.usages} 个字段</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end">
              <button
                onClick={() => setShowPickerModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Batch Confirm                                      */}
      {/* ========================================================= */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[520px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                批量确认标准匹配 (Batch Confirmation)
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[#1E40AF]">
                即将将 <strong className="font-mono text-sm">{selectedIds.length > 0 ? selectedIds.length : 23}</strong> 个语义聚类字段统一落标至企业正式标准：
                <div className="font-bold text-sm text-[#2563EB] mt-1">
                  业务办结时间 (DE_CASE_CLOSE_TIME V3)
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                <span className="font-bold text-[#172033]">涵盖字段列表样例：</span>
                <p className="font-mono text-[11px] text-[#64748B]">
                  close_time, finish_time, case_finish_time, completed_at, biz_close_date...
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end space-x-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleBatchConfirm}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
              >
                确认批量落标
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Scope Switcher                                     */}
      {/* ========================================================= */}
      {showScopeModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[460px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                切换分析与匹配范围
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
                { name: '人口服务 · 本次新增资产', count: '1,286 个字段', active: true },
                { name: '全域 · 尚未匹配标准的资产', count: '3,410 个字段', active: false },
                { name: '公共服务 · 工单域核心表', count: '820 个字段', active: false },
                { name: '最近 7 天物理 DDL 变更资产', count: '142 个字段', active: false },
              ].map((scope, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setShowScopeModal(false);
                    addToast?.('info', '分析范围已切换', `已载入【${scope.name}】下的数据元标准匹配队列`);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                    scope.active
                      ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-bold'
                      : 'border-[#E6EAF0] bg-white hover:bg-[#F8FAFC] text-[#334155]'
                  }`}
                >
                  <span>{scope.name}</span>
                  <span className="font-mono text-[11px] text-[#64748B]">{scope.count}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end">
              <button
                onClick={() => setShowScopeModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
