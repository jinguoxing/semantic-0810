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
  GitPullRequest,
  Plus
} from 'lucide-react';

export interface ConflictFieldItem {
  id: string;
  fieldName: string;
  tableName: string;
  dbName: string;
  dataType: string;
  
  // Current Verified Semantics (Facts)
  businessName: string;
  semanticType: string;
  fieldRole: string;
  businessObject: string;
  businessDomain: string;
  
  // Profile Facts
  nonNullRate: string;
  typicalUsage: string;
  linkedState: string;
  sampleValues: string[];
  
  // Candidates
  candidateA: {
    title: string;
    code: string;
    version: string;
    isAiRecommended: boolean;
    definition: string;
    specs: string;
    businessContext: string;
    usageCount: number;
    evidence: string[];
  };
  
  candidateB: {
    title: string;
    code: string;
    version: string;
    definition: string;
    specs: string;
    businessContext: string;
    usageCount: number;
    evidence: string[];
  };
  
  whyConflict: string;
  
  // Additional candidates count
  otherCandidatesCount: number;
}

const CONFLICT_ITEMS: ConflictFieldItem[] = [
  {
    id: 'conf_018',
    fieldName: 'close_time',
    tableName: 'population_service.case_record',
    dbName: 'pop_service_db',
    dataType: 'DATETIME',
    businessName: '办结时间',
    semanticType: '事件时间',
    fieldRole: '生命周期时间',
    businessObject: '工单',
    businessDomain: '公共服务',
    nonNullRate: '98.8%',
    typicalUsage: '时间范围过滤 / 办结时长计算',
    linkedState: '工单关闭 / 办结阶段',
    sampleValues: ['2026-08-12 14:35:20', '2026-08-12 16:12:05', '2026-08-12 17:05:11'],
    candidateA: {
      title: '业务办结时间',
      code: 'DE_CASE_CLOSE_TIME',
      version: 'V3',
      isAiRecommended: true,
      definition: '业务事项实际完成办理并向群众反馈回复的时间点。',
      specs: 'DATETIME · 非空 · yyyy-MM-dd HH:mm:ss · Asia/Shanghai',
      businessContext: '工单 · 办结时间',
      usageCount: 126,
      evidence: [
        '字段数据语义为事件时间',
        '所属业务对象为工单',
        '元数据注释及数据字典备注包含“办结”',
        '已有 17 个同类热线服务字段已确认绑定该标准',
        '下游报表及问数模块常用于“业务办结时长”分析',
      ],
    },
    candidateB: {
      title: '系统关闭时间',
      code: 'DE_SYSTEM_CLOSE_TIME',
      version: 'V2',
      definition: '系统后台将业务记录置为关闭归档状态的技术时间点。',
      specs: 'DATETIME · 非空 · yyyy-MM-dd HH:mm:ss',
      businessContext: '系统记录 · 状态关闭',
      usageCount: 42,
      evidence: [
        '字段物理名称包含“close”等技术关键字',
        '部分系统底层查询逻辑用于控制状态关闭过滤',
        '来源物理表中存在对应 STATUS=CLOSED 状态指示字段',
      ],
    },
    whyConflict: '字段物理名称更接近“系统关闭时间”，但业务语义、所属对象和主要分析场景更接近“业务办结时间”。两个候选均存在有效技术证据，系统因此触发人工裁决。',
    otherCandidatesCount: 2,
  },
  {
    id: 'conf_019',
    fieldName: 'applicant_id',
    tableName: 'social_security.claim_item',
    dbName: 'social_security_db',
    dataType: 'VARCHAR(20)',
    businessName: '申请人标识',
    semanticType: '业务主键',
    fieldRole: '主体标识',
    businessObject: '自然人',
    businessDomain: '社会保障',
    nonNullRate: '100.0%',
    typicalUsage: '自然人关联与身份校验',
    linkedState: '业务申请阶段',
    sampleValues: ['310115199001011234', '110101198505054321'],
    candidateA: {
      title: '公民身份号码',
      code: 'DE_PERSON_ID',
      version: 'V5',
      isAiRecommended: true,
      definition: '符合 GB 11643 国家标准的 18 位公民身份号码规范。',
      specs: 'VARCHAR(18) · 非空 · 国标 GB 11643',
      businessContext: '自然人 · 身份证号',
      usageCount: 84,
      evidence: [
        '样本数据格式 100% 匹配 18 位身份证校验规则',
        '业务主体归属为自然人',
        '已有多项社保申领服务字段绑定该国标数据元',
      ],
    },
    candidateB: {
      title: '统一社会信用代码',
      code: 'DE_USCC',
      version: 'V2',
      definition: '法人及其他组织统一社会信用代码。',
      specs: 'VARCHAR(18) · 非空 · 国标 GB 32100',
      businessContext: '组织机构 · 信用代码',
      usageCount: 36,
      evidence: [
        '长度为 18 位字符',
        '来源物理表中同名字段在部分法人申请场景下混用',
      ],
    },
    whyConflict: '字段物理名 applicant_id 未能区分自然人与法人主体，但数据分布显示 100% 为居民身份证格式，需人工确认关联方向。',
    otherCandidatesCount: 1,
  },
];

interface MappingConflictReviewWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onBackToStandards?: () => void;
  onNavigateToDataSemantics?: () => void;
}

export const MappingConflictReviewWorkspace: React.FC<MappingConflictReviewWorkspaceProps> = ({
  addToast,
  onBackToStandards,
  onNavigateToDataSemantics,
}) => {
  // Navigation & SubNav
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');

  // Conflict item pagination index (Default item 0: close_time, Item #18 of 176)
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentConflict = CONFLICT_ITEMS[currentIndex] || CONFLICT_ITEMS[0];

  // Selected candidate state: 'candidateA' | 'candidateB'
  const [selectedCandidateKey, setSelectedCandidateKey] = useState<'candidateA' | 'candidateB'>('candidateA');

  // Modals & Drawers
  const [showStandardDetailDrawer, setShowStandardDetailDrawer] = useState<boolean>(false);
  const [drawerStandardData, setDrawerStandardData] = useState<{ title: string; code: string; version: string; definition: string; specs: string } | null>(null);
  const [showNoneAppropriateMenu, setShowNoneAppropriateMenu] = useState<boolean>(false);
  const [showOtherCandidatesModal, setShowOtherCandidatesModal] = useState<boolean>(false);

  const totalConflictsCount = 176;
  const displayItemNumber = currentIndex + 18;

  const handleConfirmCandidate = (candidateTitle: string) => {
    addToast?.('success', '已确认冲突裁决', `成功将字段【${currentConflict.fieldName}】映射至【${candidateTitle}】`);
    if (currentIndex < CONFLICT_ITEMS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedCandidateKey('candidateA');
    } else {
      addToast?.('info', '处理完毕', '已完成当前批次的所有冲突裁决任务');
    }
  };

  const handleOpenStandardDetail = (cand: { title: string; code: string; version: string; definition: string; specs: string }) => {
    setDrawerStandardData(cand);
    setShowStandardDetailDrawer(true);
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
          <p className="font-semibold text-[#64748B]">Semovix Decision Platform</p>
          <p>数据语义治理平台 V2.6</p>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTAINER AREA                                       */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC]">
        
        {/* ========================================================= */}
        {/* PAGE HEADER: Breadcrumb + Back + Title + Pagination       */}
        {/* ========================================================= */}
        <div className="bg-white border-b border-[#E6EAF0] px-8 py-4 shadow-2xs shrink-0 flex items-center justify-between">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center space-x-3 text-xs text-[#64748B] mb-1.5">
              <button
                onClick={onBackToStandards}
                className="font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回标准匹配</span>
              </button>
              <span>/</span>
              <span>数据标准</span>
              <span>/</span>
              <span>标准匹配</span>
              <span>/</span>
              <span className="font-semibold text-[#172033]">冲突裁决</span>
            </div>

            {/* Title & English Subtitle */}
            <div className="flex items-baseline space-x-3">
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                标准匹配冲突裁决
              </h1>
              <span className="text-xs font-mono text-[#64748B]">
                Mapping Conflict Review
              </span>
              <span className="px-2.5 py-0.5 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-xs font-bold rounded-full flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>存在冲突</span>
              </span>
            </div>

            <p className="text-xs text-[#64748B] mt-0.5">
              比较真实数据语义与候选企业标准，确认最合适的正式标准。
            </p>
          </div>

          {/* Conflict Items Pagination Controls */}
          <div className="flex items-center space-x-3 bg-[#F8FAFC] border border-[#E6EAF0] p-2 rounded-xl text-xs">
            <span className="text-[#64748B] font-medium pl-1">
              当前第 <strong className="text-[#172033] font-bold font-mono">{displayItemNumber}</strong> / {totalConflictsCount} 项
            </span>

            <div className="flex items-center space-x-1 border-l border-[#E6EAF0] pl-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => {
                  if (currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                    setSelectedCandidateKey('candidateA');
                  }
                }}
                className={`p-1.5 rounded-lg border transition-all ${
                  currentIndex === 0
                    ? 'text-[#CBD5E1] border-[#E6EAF0] cursor-not-allowed bg-white'
                    : 'text-[#334155] border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] cursor-pointer'
                }`}
                title="上一项"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                disabled={currentIndex >= CONFLICT_ITEMS.length - 1}
                onClick={() => {
                  if (currentIndex < CONFLICT_ITEMS.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setSelectedCandidateKey('candidateA');
                  }
                }}
                className={`p-1.5 rounded-lg border transition-all ${
                  currentIndex >= CONFLICT_ITEMS.length - 1
                    ? 'text-[#CBD5E1] border-[#E6EAF0] cursor-not-allowed bg-white'
                    : 'text-[#334155] border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] cursor-pointer'
                }`}
                title="下一项"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* THREE-COLUMN WORKSPACE LAYOUT                              */}
        {/* Left (~30%) | Middle (~45% Focus) | Right (~25%)            */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden p-6 gap-5">
          
          {/* ======================================================= */}
          {/* COLUMN 1: LEFT · REAL DATA CONTEXT (~30% Width)          */}
          {/* ======================================================= */}
          <div className="w-[30%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col overflow-y-auto p-5 space-y-4 shrink-0">
            
            {/* Header */}
            <div className="border-b border-[#E6EAF0] pb-3">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                当前字段 · Data Context
              </span>
              <h2 className="text-lg font-bold text-[#172033] font-mono tracking-tight mt-0.5 flex items-center justify-between">
                <span>{currentConflict.fieldName}</span>
                <span className="text-xs font-sans px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded font-bold">
                  {currentConflict.dataType}
                </span>
              </h2>
              <p className="text-xs font-mono text-[#64748B] mt-0.5">
                {currentConflict.tableName}
              </p>
            </div>

            {/* Current Verified Data Semantics (Fact) */}
            <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2">
                <span className="text-xs font-bold text-[#172033] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span>已确认数据语义</span>
                </span>
                <span className="text-[10px] text-[#64748B] bg-white border border-[#CBD5E1] px-1.5 py-0.2 rounded font-medium">
                  事实引用
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">业务名称：</span>
                  <span className="font-bold text-[#172033]">{currentConflict.businessName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">语义类型：</span>
                  <span className="font-semibold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#C7D2FE]">
                    {currentConflict.semanticType}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">字段角色：</span>
                  <span className="font-medium text-[#334155]">{currentConflict.fieldRole}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">所属业务对象：</span>
                  <span className="font-bold text-[#172033]">{currentConflict.businessObject}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">所属业务域：</span>
                  <span className="font-medium text-[#64748B]">{currentConflict.businessDomain}</span>
                </div>
              </div>
            </div>

            {/* Key Data Profile Facts */}
            <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3.5 space-y-2.5 text-xs">
              <span className="font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1.5">
                数据特征探查 (Profile)
              </span>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">非空率：</span>
                  <span className="font-mono font-bold text-[#059669]">{currentConflict.nonNullRate}</span>
                </div>

                <div>
                  <span className="text-[#64748B] block mb-0.5">典型使用：</span>
                  <span className="font-medium text-[#334155] bg-white border border-[#E6EAF0] px-2 py-1 rounded block">
                    {currentConflict.typicalUsage}
                  </span>
                </div>

                <div>
                  <span className="text-[#64748B] block mb-0.5">关联状态：</span>
                  <span className="font-medium text-[#334155] bg-white border border-[#E6EAF0] px-2 py-1 rounded block">
                    {currentConflict.linkedState}
                  </span>
                </div>

                {/* Sample Values */}
                <div>
                  <span className="text-[#64748B] block mb-1">物理数据样例 (Sample Values)：</span>
                  <div className="space-y-1 font-mono text-[11px] bg-white p-2 rounded-lg border border-[#E6EAF0] text-[#334155]">
                    {currentConflict.sampleValues.map((val, i) => (
                      <div key={i} className="flex items-center space-x-1.5">
                        <span className="text-[#94A3B8]">•</span>
                        <span>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Semantics Jump Link & Hint */}
            <div className="pt-2 border-t border-[#E6EAF0] space-y-2">
              <button
                onClick={() => {
                  if (onNavigateToDataSemantics) {
                    onNavigateToDataSemantics();
                  } else {
                    addToast?.('info', '跳转数据语义', '已重定向至字段【close_time】语义治理详情页');
                  }
                }}
                className="w-full py-2 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>查看完整数据语义详情</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <p className="text-[11px] text-[#94A3B8] leading-tight">
                当前页面仅引用已确认的语义事实。如需重新更正字段业务定义，请跳转至数据语义治理页。
              </p>
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 2: MIDDLE · CANDIDATE STANDARDS (~45% Main Focus) */}
          {/* ======================================================= */}
          <div className="w-[45%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col overflow-y-auto p-5 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">
                  Main Comparison Focus
                </span>
                <h2 className="text-base font-bold text-[#172033] tracking-tight">
                  候选企业标准 (Candidate Standards)
                </h2>
              </div>

              {currentConflict.otherCandidatesCount > 0 && (
                <button
                  onClick={() => setShowOtherCandidatesModal(true)}
                  className="text-xs text-[#2563EB] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <span>查看另外 {currentConflict.otherCandidatesCount} 个候选</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* CANDIDATE CARDS SIDE-BY-SIDE / COMPARISON GRID */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* CANDIDATE A */}
              <div
                onClick={() => setSelectedCandidateKey('candidateA')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                  selectedCandidateKey === 'candidateA'
                    ? 'border-[#2563EB] bg-[#EFF6FF]/30 shadow-2xs'
                    : 'border-[#E6EAF0] bg-[#F8FAFC] hover:border-[#CBD5E1]'
                }`}
              >
                {/* AI Recommended Badge */}
                {currentConflict.candidateA.isAiRecommended && (
                  <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 bg-[#2563EB] text-white text-[10px] font-bold rounded-full shadow-2xs flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI 推荐</span>
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-[#64748B] uppercase">
                        {currentConflict.candidateA.code}
                      </span>
                      <h3 className="text-sm font-bold text-[#172033] flex items-center space-x-1.5">
                        <span>{currentConflict.candidateA.title}</span>
                        <span className="text-[10px] font-mono font-bold bg-white border border-[#CBD5E1] px-1.5 py-0.2 rounded text-[#2563EB]">
                          {currentConflict.candidateA.version}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-[#334155] mt-2 line-clamp-2 leading-relaxed">
                    {currentConflict.candidateA.definition}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#E6EAF0] text-[11px] space-y-1">
                    <div>
                      <span className="text-[#64748B]">标准规范：</span>
                      <span className="font-mono text-[#172033] font-medium">{currentConflict.candidateA.specs}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">业务上下文：</span>
                      <span className="font-bold text-[#2563EB]">{currentConflict.candidateA.businessContext}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">关联使用：</span>
                      <strong className="text-[#172033]">{currentConflict.candidateA.usageCount} 个字段</strong>
                    </div>
                  </div>
                </div>

                {/* Evidence List Candidate A */}
                <div className="bg-white border border-[#E6EAF0] rounded-lg p-2.5 text-[11px] space-y-1">
                  <span className="font-bold text-[#059669] flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>支持证据 (Evidence)</span>
                  </span>
                  <ul className="space-y-0.5 text-[#334155]">
                    {currentConflict.candidateA.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start space-x-1">
                        <span className="text-[#059669] font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStandardDetail(currentConflict.candidateA);
                  }}
                  className="text-[11px] text-[#2563EB] font-bold hover:underline flex items-center justify-end space-x-0.5"
                >
                  <span>查看标准详情</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* CANDIDATE B */}
              <div
                onClick={() => setSelectedCandidateKey('candidateB')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                  selectedCandidateKey === 'candidateB'
                    ? 'border-[#2563EB] bg-[#EFF6FF]/30 shadow-2xs'
                    : 'border-[#E6EAF0] bg-[#F8FAFC] hover:border-[#CBD5E1]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-[#64748B] uppercase">
                        {currentConflict.candidateB.code}
                      </span>
                      <h3 className="text-sm font-bold text-[#172033] flex items-center space-x-1.5">
                        <span>{currentConflict.candidateB.title}</span>
                        <span className="text-[10px] font-mono font-bold bg-white border border-[#CBD5E1] px-1.5 py-0.2 rounded text-[#64748B]">
                          {currentConflict.candidateB.version}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-[#334155] mt-2 line-clamp-2 leading-relaxed">
                    {currentConflict.candidateB.definition}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#E6EAF0] text-[11px] space-y-1">
                    <div>
                      <span className="text-[#64748B]">标准规范：</span>
                      <span className="font-mono text-[#172033] font-medium">{currentConflict.candidateB.specs}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">业务上下文：</span>
                      <span className="font-bold text-[#64748B]">{currentConflict.candidateB.businessContext}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">关联使用：</span>
                      <strong className="text-[#172033]">{currentConflict.candidateB.usageCount} 个字段</strong>
                    </div>
                  </div>
                </div>

                {/* Evidence List Candidate B */}
                <div className="bg-white border border-[#E6EAF0] rounded-lg p-2.5 text-[11px] space-y-1">
                  <span className="font-bold text-[#D97706] flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>支持证据 (Evidence)</span>
                  </span>
                  <ul className="space-y-0.5 text-[#334155]">
                    {currentConflict.candidateB.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start space-x-1">
                        <span className="text-[#D97706] font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStandardDetail(currentConflict.candidateB);
                  }}
                  className="text-[11px] text-[#2563EB] font-bold hover:underline flex items-center justify-end space-x-0.5"
                >
                  <span>查看标准详情</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

            </div>

            {/* KEY DIFFERENCES TABLE (关键差异) */}
            <div className="space-y-2 pt-2 border-t border-[#E6EAF0]">
              <span className="text-xs font-bold text-[#172033] flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-[#2563EB]" />
                <span>关键差异对比 (Key Differences)</span>
              </span>

              <div className="border border-[#E6EAF0] rounded-xl overflow-hidden bg-white text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B]">
                      <th className="py-2 px-3 w-28">对比维度</th>
                      <th className="py-2 px-3 font-bold text-[#2563EB]">业务办结时间 (DE_CASE_CLOSE_TIME)</th>
                      <th className="py-2 px-3 font-bold text-[#64748B]">系统关闭时间 (DE_SYSTEM_CLOSE_TIME)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0] text-[11px]">
                    <tr>
                      <td className="py-2 px-3 font-bold text-[#64748B]">业务含义</td>
                      <td className="py-2 px-3 font-bold text-[#059669] bg-[#ECFDF5]">业务真正完成节点</td>
                      <td className="py-2 px-3 text-[#64748B]">系统记录置为关闭</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-[#64748B]">所属对象</td>
                      <td className="py-2 px-3 font-bold text-[#172033]">工单 (Work Order)</td>
                      <td className="py-2 px-3 text-[#64748B]">系统记录 (System Record)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-[#64748B]">典型使用</td>
                      <td className="py-2 px-3 font-bold text-[#2563EB]">业务办结周期与满意度分析</td>
                      <td className="py-2 px-3 text-[#64748B]">技术归档与系统监控状态跟踪</td>
                    </tr>
                    <tr className="bg-[#EFF6FF]/50">
                      <td className="py-2 px-3 font-bold text-[#2563EB]">当前字段匹配度</td>
                      <td className="py-2 px-3 font-bold text-[#2563EB]">强匹配 (98.2%)</td>
                      <td className="py-2 px-3 text-[#D97706] font-medium">部分匹配 (64.5%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* WHY HUMAN DECISION NEEDED BAR */}
            <div className="p-3.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl space-y-1 text-xs text-[#92400E]">
              <div className="flex items-center space-x-1.5 font-bold">
                <HelpCircle className="w-4 h-4 text-[#D97706]" />
                <span>为什么需要人工判断？</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#78350F]">
                {currentConflict.whyConflict}
              </p>
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 3: RIGHT · DECISION CONTEXT & ACTIONS (~25% Width) */}
          {/* ======================================================= */}
          <div className="w-[25%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col justify-between overflow-y-auto p-5 space-y-4 shrink-0">
            
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#E6EAF0] pb-3">
                <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider">
                  Decision Context & Impact
                </span>
                <h2 className="text-base font-bold text-[#172033] tracking-tight">
                  Xino 判断建议
                </h2>
              </div>

              {/* XINO RECOMMENDATION BOX */}
              <div className="p-3.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#4F46E5] flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span>推荐结果</span>
                  </span>
                  <span className="px-2 py-0.5 bg-[#2563EB] text-white text-[10px] font-bold rounded">
                    推荐优先级：高
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-[#C7D2FE] space-y-1">
                  <span className="text-[10px] text-[#64748B]">建议关联标准：</span>
                  <p className="font-bold text-[#172033] text-sm">
                    {currentConflict.candidateA.title}
                  </p>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    从业务对象（工单）、已确认数据语义及主要分析场景看，该字段更可能表达业务办结时间。
                  </p>
                </div>

                <div className="text-[11px] text-[#4F46E5] font-semibold pt-1 border-t border-[#C7D2FE] flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#D97706]" />
                  <span>注意：字段命名中的 “close” 是当前主要反向证据。</span>
                </div>
              </div>

              {/* CHOICE IMPACT (选择影响) */}
              <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3.5 space-y-2 text-xs">
                <span className="font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1.5">
                  选择影响 (Choice Impact)
                </span>

                {selectedCandidateKey === 'candidateA' ? (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between font-bold text-[#2563EB]">
                      <span>若选择【业务办结时间】：</span>
                      <span>更新 1 个标准匹配</span>
                    </div>
                    <ul className="space-y-1 text-[#334155] list-disc list-inside pl-1">
                      <li>对齐 2 个智能问数语义解析规则</li>
                      <li>更新 1 个工单业务对象核心生命周期属性</li>
                      <li>绑定 1 项标准合规自动化检查任务</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between font-bold text-[#D97706]">
                      <span>若选择【系统关闭时间】：</span>
                      <span>更新 1 个标准匹配</span>
                    </div>
                    <ul className="space-y-1 text-[#334155] list-disc list-inside pl-1">
                      <li>更新 1 个技术监控告警规则节点</li>
                      <li>作为后台系统归档与清理时间戳标识</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* DECISION ACTIONS AREA (右下固定决策区) */}
            <div className="pt-3 border-t border-[#E6EAF0] space-y-2">
              
              {/* Primary Action Button */}
              <button
                onClick={() => handleConfirmCandidate(currentConflict.candidateA.title)}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>确认“{currentConflict.candidateA.title}”</span>
              </button>

              {/* Secondary Action Button */}
              <button
                onClick={() => handleConfirmCandidate(currentConflict.candidateB.title)}
                className="w-full py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>选择“{currentConflict.candidateB.title}”</span>
              </button>

              {/* Tertiary Action: 都不合适 */}
              <div className="relative">
                <button
                  onClick={() => setShowNoneAppropriateMenu(!showNoneAppropriateMenu)}
                  className="w-full py-1.5 text-[#64748B] hover:text-[#172033] text-xs font-medium cursor-pointer text-center underline"
                >
                  都不合适…
                </button>

                {/* Dropdown Menu for "都不合适" */}
                {showNoneAppropriateMenu && (
                  <div className="absolute bottom-8 left-0 right-0 bg-white border border-[#E6EAF0] rounded-xl shadow-lg p-2 text-xs space-y-1 z-20">
                    <div className="px-2 py-1 font-bold text-[#172033] border-b border-[#E6EAF0] text-[11px]">
                      当前无合适企业标准
                    </div>
                    <button
                      onClick={() => {
                        setShowNoneAppropriateMenu(false);
                        addToast?.('info', '标记未匹配', '已将该字段标记为【未匹配企业标准】');
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#334155] cursor-pointer"
                    >
                      标记为未匹配
                    </button>
                    <button
                      onClick={() => {
                        setShowNoneAppropriateMenu(false);
                        addToast?.('info', '建议新增标准', '已将此需求加入待创建标准候选队列');
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-[#EFF6FF] text-[#2563EB] font-bold rounded-lg cursor-pointer flex items-center justify-between"
                    >
                      <span>建议新增标准</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* History Learning Hint */}
              <div className="pt-2 text-[10px] text-[#94A3B8] text-center border-t border-[#F1F5F9]">
                已有 17 个相似字段曾确认使用“业务办结时间”。
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* ========================================================= */}
      {/* DRAWER: Standard Specification Details                    */}
      {/* ========================================================= */}
      {showStandardDetailDrawer && drawerStandardData && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex justify-end z-50">
          <div className="w-[480px] bg-white h-full shadow-2xl flex flex-col justify-between p-6 space-y-4 animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">
                    {drawerStandardData.code}
                  </span>
                  <h3 className="text-lg font-bold text-[#172033] flex items-center space-x-2">
                    <span>{drawerStandardData.title}</span>
                    <span className="text-xs bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] px-2 py-0.5 rounded font-bold">
                      {drawerStandardData.version}
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setShowStandardDetailDrawer(false)}
                  className="p-1 text-[#94A3B8] hover:text-[#172033] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-[#172033] block mb-1">业务定义</span>
                  <p className="text-[#334155] bg-[#F8FAFC] p-3 rounded-xl border border-[#E6EAF0] leading-relaxed">
                    {drawerStandardData.definition}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-[#172033] block mb-1">技术规范与约束</span>
                  <p className="font-mono text-[#2563EB] bg-[#EFF6FF] p-3 rounded-xl border border-[#BFDBFE] font-medium">
                    {drawerStandardData.specs}
                  </p>
                </div>

                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E6EAF0] space-y-1.5 text-[11px]">
                  <span className="font-bold text-[#172033] block">关联治理资产</span>
                  <p className="text-[#64748B]">已在公共服务、政务服务、社会保障 3 个业务域绑定 126 个数据字段。</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setShowStandardDetailDrawer(false)}
                className="w-full py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                关闭规范视图
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Other Candidates List                              */}
      {/* ========================================================= */}
      {showOtherCandidatesModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[520px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                其余候选企业标准 ({currentConflict.otherCandidatesCount})
              </h3>
              <button
                onClick={() => setShowOtherCandidatesModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#172033]">工单终结时间 (DE_CASE_END_TIME)</span>
                  <span className="text-[10px] text-[#64748B]">匹配度 52.1%</span>
                </div>
                <p className="text-[11px] text-[#64748B]">热线系统手工人工标记强行关单节点。</p>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#172033]">事件销号时间 (DE_EVENT_CANCEL_TIME)</span>
                  <span className="text-[10px] text-[#64748B]">匹配度 41.8%</span>
                </div>
                <p className="text-[11px] text-[#64748B]">督查催办流程中撤销或重复投诉核销时间。</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowOtherCandidatesModal(false)}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                了解
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
