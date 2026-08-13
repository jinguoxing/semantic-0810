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
  Plus,
  Edit3,
  SlidersHorizontal,
  TrendingUp,
  FileSearch,
  CheckSquare,
  XCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';

export interface ProposalItem {
  id: string;
  proposalType: 'NEW' | 'UPDATE' | 'MERGE' | 'SUNSET';
  proposalTypeLabel: string;
  title: string;
  suggestedCode: string;
  category: 'DATA_ELEMENT' | 'VALUE_DOMAIN';
  statusLabel: string;
  
  // Left Evidence & Cluster Facts
  coreConclusion: string;
  clusterCount: number;
  typicalFields: string[];
  businessObject: string;
  semanticType: string;
  dataTypeDistribution: string;
  primaryUsage: string[];
  
  // Existing Similar Standards
  similarStandards: Array<{
    name: string;
    code: string;
    usageCount: number;
    matchDegree: string;
    scopeDiff: string;
  }>;
  
  // Middle Proposed Standard Specs
  proposedDefinition: string;
  businessTerm: string;
  businessDomain: string;
  specs: {
    dataType: string;
    format: string;
    nullable: string;
    timezone: string;
  };
  docReference?: {
    docName: string;
    section: string;
  };
  
  // Right AI Judgement & Uncertainties
  xinoRecommendation: string;
  recommendationReasons: string[];
  uncertainties: string[];
  
  // Expected Impact
  impactStats: {
    fieldCount: number;
    sourceCount: number;
    tableCount: number;
    domainCount: number;
    topicCount: number;
  };
}

const PROPOSAL_ITEMS: ProposalItem[] = [
  {
    id: 'prop_006',
    proposalType: 'NEW',
    proposalTypeLabel: '建议新增标准',
    title: '业务办结时间',
    suggestedCode: 'DE_BUSINESS_FINISH_TIME',
    category: 'DATA_ELEMENT',
    statusLabel: '待治理确认',
    coreConclusion: '87 个字段在物理库与业务层稳定表达“业务办结时间”，但当前企业标准库没有完全匹配的正式数据元标准。',
    clusterCount: 87,
    typicalFields: ['close_time', 'finish_time', 'completed_at', 'case_finish_time', 'biz_finish_time'],
    businessObject: '工单',
    semanticType: '事件时间',
    dataTypeDistribution: '81/87 为 DATETIME · 6/87 为 TIMESTAMP',
    primaryUsage: ['办结时长指标自动化计算', '工单全生命周期趋势分析', '跨部门办结效率筛选'],
    similarStandards: [
      {
        name: '事项办结时间',
        code: 'DE_APPROVAL_CLOSE_TIME',
        usageCount: 47,
        matchDegree: '高度相似',
        scopeDiff: '定义范围仅适用于一网通办政务审批场景，不覆盖公共服务热线诉求。',
      },
      {
        name: '系统关闭时间',
        code: 'DE_SYSTEM_CLOSE_TIME',
        usageCount: 42,
        matchDegree: '部分相似',
        scopeDiff: '属于后台技术归档标识，缺乏真实业务交互与服务反馈完成语义。',
      },
    ],
    proposedDefinition: '业务对象完成规定业务处理动作后形成的实际完成时间点，用于统一表达业务生命周期中的办结时刻。',
    businessTerm: '办结时间',
    businessDomain: '公共服务',
    specs: {
      dataType: 'DATETIME',
      format: 'yyyy-MM-dd HH:mm:ss',
      nullable: '否',
      timezone: 'Asia/Shanghai',
    },
    docReference: {
      docName: '《公共服务基础数据元规范》',
      section: '第 5.3.7 条 · P126',
    },
    xinoRecommendation: '建议建立统一数据元标准',
    recommendationReasons: [
      '当前 87 个字段具有稳定的共同业务语义，具备极高归一价值',
      '无完全相符的已有正式标准，使用近似标准会导致下游分析歧义',
      '统一标准后可实现标准合规自动化检查与问数语义透传',
    ],
    uncertainties: [
      '6 个数据源物理字段类型使用 TIMESTAMP，而建议标准规范采用 DATETIME',
      '与政务审批“事项办结时间”存在部分概念重叠，需关注跨域复用边界',
    ],
    impactStats: {
      fieldCount: 87,
      sourceCount: 6,
      tableCount: 18,
      domainCount: 1,
      topicCount: 3,
    },
  },
  {
    id: 'prop_007',
    proposalType: 'UPDATE',
    proposalTypeLabel: '建议修改标准',
    title: '公民身份号码',
    suggestedCode: 'DE_PERSON_ID',
    category: 'DATA_ELEMENT',
    statusLabel: '待治理确认',
    coreConclusion: '新颁布 GB/T 国家标准将居民唯一标识规范设为 18 位长度，建议将企业 V4 标准由 VARCHAR(20) 调整为 VARCHAR(18)。',
    clusterCount: 84,
    typicalFields: ['id_card', 'cert_no', 'citizen_id', 'person_id'],
    businessObject: '自然人',
    semanticType: '业务主键',
    dataTypeDistribution: '84/84 为 VARCHAR(18)',
    primaryUsage: ['自然人身份唯一校验', '跨部门个人数据联动与去重'],
    similarStandards: [
      {
        name: '公民身份号码 (V4)',
        code: 'DE_PERSON_ID',
        usageCount: 84,
        matchDegree: '当前企业标准',
        scopeDiff: '现有企业标准 V4 的物理约束为 VARCHAR(20)，存在 2 位长度冗余。',
      },
    ],
    proposedDefinition: '符合 GB 11643 强制性国家标准的 18 位公民身份号码规范。',
    businessTerm: '公民身份号码',
    businessDomain: '人口基础',
    specs: {
      dataType: 'VARCHAR(18)',
      format: 'GB 11643',
      nullable: '否',
      timezone: '—',
    },
    docReference: {
      docName: 'GB 11643-1999 公民身份号码规范',
      section: '第 3 条 编码规则',
    },
    xinoRecommendation: '建议更新现有“公民身份号码”至 V5 版本',
    recommendationReasons: [
      '国标强制要求 18 位，符合合规审订要求',
      '物理库中 100% 实例数据为 18 位，无缩短截断风险',
    ],
    uncertainties: [
      '更新后涉及 84 个在线物理字段的标准关联关系升级',
    ],
    impactStats: {
      fieldCount: 84,
      sourceCount: 8,
      tableCount: 22,
      domainCount: 2,
      topicCount: 4,
    },
  },
];

interface StandardProposalReviewWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onBackToStandards?: () => void;
  onNavigateToDataSemantics?: () => void;
}

export const StandardProposalReviewWorkspace: React.FC<StandardProposalReviewWorkspaceProps> = ({
  addToast,
  onBackToStandards,
  onNavigateToDataSemantics,
}) => {
  // Navigation & SubNav
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');

  // Proposal item pagination (Default item 0: 业务办结时间, Item #6 of 17)
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentProposal = PROPOSAL_ITEMS[currentIndex] || PROPOSAL_ITEMS[0];

  // Modals & Drawers
  const [showAllEvidenceDrawer, setShowAllEvidenceDrawer] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('已有标准满足');

  // Edit Mode state for "调整建议内容"
  const [editedTitle, setEditedTitle] = useState<string>(currentProposal.title);
  const [editedDefinition, setEditedDefinition] = useState<string>(currentProposal.proposedDefinition);

  const totalProposalsCount = 17;
  const displayItemNumber = currentIndex + 6;

  const handleAdoptProposal = () => {
    addToast?.('success', '已提交治理确认', `成功采用【${currentProposal.title}】标准建议，已转入企业治理确认节点`);
    if (currentIndex < PROPOSAL_ITEMS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setEditedTitle(PROPOSAL_ITEMS[currentIndex + 1].title);
      setEditedDefinition(PROPOSAL_ITEMS[currentIndex + 1].proposedDefinition);
    } else {
      addToast?.('info', '处理完毕', '已完成所有待确认的标准治理建议');
    }
  };

  const handleSaveAdjustment = () => {
    setShowAdjustModal(false);
    addToast?.('success', '已修改建议内容', `已更新【${editedTitle}】标准建议草稿`);
  };

  const handleConfirmReject = () => {
    setShowRejectModal(false);
    addToast?.('info', '暂不采用建议', `已拒绝采用建议，理由：${rejectReason}`);
    if (currentIndex < PROPOSAL_ITEMS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
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
                <span>返回标准库</span>
              </button>
              <span>/</span>
              <span>数据标准</span>
              <span>/</span>
              <span>标准建议</span>
              <span>/</span>
              <span className="font-semibold text-[#172033]">{currentProposal.title}</span>
            </div>

            {/* Title & Badges */}
            <div className="flex items-baseline space-x-3">
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                标准建议裁决
              </h1>
              <span className="text-xs font-mono text-[#64748B]">
                Standard Proposal Review
              </span>

              <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-full flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentProposal.proposalTypeLabel}</span>
              </span>

              <span className="px-2.5 py-0.5 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-xs font-bold rounded-full">
                {currentProposal.statusLabel}
              </span>
            </div>

            <p className="text-xs text-[#64748B] mt-0.5">
              审查 AI 根据真实数据和已有企业标准提出的治理建议。
            </p>
          </div>

          {/* Proposals Pagination Controls */}
          <div className="flex items-center space-x-3 bg-[#F8FAFC] border border-[#E6EAF0] p-2 rounded-xl text-xs">
            <span className="text-[#64748B] font-medium pl-1">
              当前第 <strong className="text-[#172033] font-bold font-mono">{displayItemNumber}</strong> / {totalProposalsCount} 项标准建议
            </span>

            <div className="flex items-center space-x-1 border-l border-[#E6EAF0] pl-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => {
                  if (currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                    setEditedTitle(PROPOSAL_ITEMS[currentIndex - 1].title);
                    setEditedDefinition(PROPOSAL_ITEMS[currentIndex - 1].proposedDefinition);
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
                disabled={currentIndex >= PROPOSAL_ITEMS.length - 1}
                onClick={() => {
                  if (currentIndex < PROPOSAL_ITEMS.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setEditedTitle(PROPOSAL_ITEMS[currentIndex + 1].title);
                    setEditedDefinition(PROPOSAL_ITEMS[currentIndex + 1].proposedDefinition);
                  }
                }}
                className={`p-1.5 rounded-lg border transition-all ${
                  currentIndex >= PROPOSAL_ITEMS.length - 1
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
        {/* Left (~34%) | Middle (~42% Focus) | Right (~24%)            */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden p-6 gap-5">
          
          {/* ======================================================= */}
          {/* COLUMN 1: LEFT · WHY PROPOSED & EVIDENCE (~34% Width)    */}
          {/* ======================================================= */}
          <div className="w-[34%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col overflow-y-auto p-5 space-y-4 shrink-0">
            
            {/* Header */}
            <div className="border-b border-[#E6EAF0] pb-3">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Evidence & Data Cluster Facts
              </span>
              <h2 className="text-base font-bold text-[#172033] tracking-tight mt-0.5">
                为什么提出这个建议？
              </h2>
              <p className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] p-2.5 rounded-xl border border-[#BFDBFE] mt-2 leading-relaxed">
                {currentProposal.coreConclusion}
              </p>
            </div>

            {/* Core Data Cluster Evidence */}
            <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2">
                <span className="font-bold text-[#172033]">真实数据证据 (Cluster Evidence)</span>
                <span className="px-2 py-0.5 bg-white text-[#2563EB] border border-[#BFDBFE] rounded text-[11px] font-bold font-mono">
                  {currentProposal.clusterCount} 个同类字段
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[#64748B] block mb-1">典型代表字段：</span>
                  <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                    {currentProposal.typicalFields.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[#334155]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#E6EAF0]">
                  <div>
                    <span className="text-[#64748B]">业务对象：</span>
                    <strong className="text-[#172033]">{currentProposal.businessObject}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B]">语义类型：</span>
                    <strong className="text-[#4F46E5]">{currentProposal.semanticType}</strong>
                  </div>
                </div>

                <div className="text-[11px]">
                  <span className="text-[#64748B]">数据特征分布：</span>
                  <span className="font-mono text-[#059669] font-bold block bg-white p-1.5 rounded border border-[#E6EAF0] mt-0.5">
                    {currentProposal.dataTypeDistribution}
                  </span>
                </div>

                <div className="text-[11px]">
                  <span className="text-[#64748B] block mb-0.5">主要使用场景：</span>
                  <ul className="space-y-0.5 text-[#334155] list-disc list-inside pl-1">
                    {currentProposal.primaryUsage.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Existing Similar Standards Search */}
            <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3.5 space-y-2 text-xs">
              <span className="font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1.5">
                相似正式标准检索结果
              </span>

              <div className="space-y-2">
                {currentProposal.similarStandards.map((std, i) => (
                  <div key={i} className="p-2.5 bg-white rounded-lg border border-[#E6EAF0] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#172033]">{std.name}</span>
                      <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                        {std.matchDegree}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      已绑定 <strong className="text-[#172033]">{std.usageCount}</strong> 个字段
                    </p>
                    <p className="text-[11px] text-[#334155] leading-relaxed pt-1 border-t border-[#F1F5F9]">
                      {std.scopeDiff}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[11px] text-[#1E40AF] font-medium">
                AI 结论：当前没有一个现有标准能够完整覆盖 87 个字段的主要业务语义。
              </div>
            </div>

            {/* View All Evidence Button */}
            <div className="pt-2 border-t border-[#E6EAF0]">
              <button
                onClick={() => setShowAllEvidenceDrawer(true)}
                className="w-full py-2 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>查看完整依据与分布抽屉</span>
              </button>
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 2: MIDDLE · PROPOSED STANDARD (~42% Main Focus)   */}
          {/* ======================================================= */}
          <div className="w-[42%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col overflow-y-auto p-5 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">
                  Proposed Enterprise Standard Specification
                </span>
                <h2 className="text-base font-bold text-[#172033] tracking-tight flex items-center space-x-2">
                  <span>建议形成的正式标准</span>
                  <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] border border-[#BFDBFE] font-mono font-bold rounded">
                    {currentProposal.category === 'DATA_ELEMENT' ? '数据元标准' : '码表标准'}
                  </span>
                </h2>
              </div>

              <span className="text-[10px] font-bold text-[#475569] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded">
                AI 生成 · 待确认
              </span>
            </div>

            {/* Standard Title & Suggested Code Block */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase">
                    建议标准编码：{currentProposal.suggestedCode}
                  </span>
                  <h3 className="text-lg font-bold text-[#172033] tracking-tight mt-0.5">
                    {editedTitle}
                  </h3>
                </div>

                <button
                  onClick={() => setShowAdjustModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>调整建议内容</span>
                </button>
              </div>

              {/* Proposed Definition */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#172033]">建议业务定义：</span>
                <p className="text-xs text-[#334155] bg-white p-3 rounded-lg border border-[#E6EAF0] leading-relaxed">
                  {editedDefinition}
                </p>
              </div>
            </div>

            {/* Business Context Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E6EAF0] space-y-1">
                <span className="text-[#64748B]">业务术语：</span>
                <p className="font-bold text-[#172033]">{currentProposal.businessTerm}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E6EAF0] space-y-1">
                <span className="text-[#64748B]">关联业务对象：</span>
                <p className="font-bold text-[#2563EB]">{currentProposal.businessObject} · {currentProposal.title}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E6EAF0] space-y-1">
                <span className="text-[#64748B]">归属业务域：</span>
                <p className="font-bold text-[#172033]">{currentProposal.businessDomain}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E6EAF0] space-y-1">
                <span className="text-[#64748B]">语义类型：</span>
                <p className="font-bold text-[#4F46E5]">{currentProposal.semanticType}</p>
              </div>
            </div>

            {/* Standard Requirements Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1.5">
                标准技术规范与约束要求
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[#64748B] text-[11px]">数据类型</span>
                    <p className="font-mono font-bold text-[#172033]">{currentProposal.specs.dataType}</p>
                  </div>
                  <span className="text-[10px] text-[#059669] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#A7F3D0]">
                    依据 81 个实际字段
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[#64748B] text-[11px]">存储格式</span>
                    <p className="font-mono font-bold text-[#172033]">{currentProposal.specs.format}</p>
                  </div>
                  <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded">
                    来自惯例
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[#64748B] text-[11px]">允许为空</span>
                    <p className="font-bold text-[#172033]">{currentProposal.specs.nullable}</p>
                  </div>
                  <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded">
                    合规要求
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[#64748B] text-[11px]">时区与格式</span>
                    <p className="font-mono font-bold text-[#172033]">{currentProposal.specs.timezone}</p>
                  </div>
                  <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded">
                    企业统一标准
                  </span>
                </div>
              </div>
            </div>

            {/* Standard Source & External Document Reference */}
            <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#172033]">标准来源与参考依据</span>
                <span className="text-[11px] text-[#64748B]">发现方式：AI 基于真实数据语义发现</span>
              </div>

              {currentProposal.docReference && (
                <div className="bg-white p-2.5 rounded-lg border border-[#E6EAF0] flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-[#2563EB]">{currentProposal.docReference.docName}</span>
                    <span className="text-[#64748B] ml-2">{currentProposal.docReference.section}</span>
                  </div>
                  <button
                    onClick={() => addToast?.('info', '查看原文依据', `正在预览文件：${currentProposal.docReference?.docName}`)}
                    className="text-[#2563EB] hover:underline font-bold cursor-pointer"
                  >
                    查看原文
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 3: RIGHT · DECISION CONTEXT & ACTIONS (~24% Width) */}
          {/* ======================================================= */}
          <div className="w-[24%] bg-white border border-[#E6EAF0] rounded-xl shadow-2xs flex flex-col justify-between overflow-y-auto p-5 space-y-4 shrink-0">
            
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#E6EAF0] pb-3">
                <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider">
                  Governance Decision Context
                </span>
                <h2 className="text-base font-bold text-[#172033] tracking-tight mt-0.5">
                  Xino 判断
                </h2>
              </div>

              {/* Xino Judgement Box */}
              <div className="p-3.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-[#4F46E5]">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span>{currentProposal.xinoRecommendation}</span>
                </div>

                <p className="text-[11px] text-[#334155] leading-relaxed">
                  当前 87 个字段具有稳定的共同业务语义，继续分别使用多个近似标准会增加后续匹配和问数理解的不一致性。
                </p>

                <ul className="space-y-1 text-[11px] text-[#334155] list-disc list-inside pl-1 border-t border-[#C7D2FE] pt-2">
                  {currentProposal.recommendationReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Uncertainties (需要确认不确定点) */}
              <div className="p-3.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl space-y-1.5 text-xs text-[#92400E]">
                <div className="flex items-center space-x-1 font-bold">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>需要确认 (Uncertainties)</span>
                </div>
                <ul className="space-y-1 text-[11px] text-[#78350F] list-disc list-inside pl-1">
                  {currentProposal.uncertainties.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>

              {/* Expected Impact Stats */}
              <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3.5 space-y-2 text-xs">
                <span className="font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1.5">
                  预计影响 (Impact Scope)
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-white p-2 rounded border border-[#E6EAF0]">
                    <span className="text-[#64748B] block text-[10px]">可能匹配字段</span>
                    <strong className="text-[#2563EB] text-sm">{currentProposal.impactStats.fieldCount} 个</strong>
                  </div>

                  <div className="bg-white p-2 rounded border border-[#E6EAF0]">
                    <span className="text-[#64748B] block text-[10px]">关联数据源</span>
                    <strong className="text-[#172033] text-sm">{currentProposal.impactStats.sourceCount} 个</strong>
                  </div>

                  <div className="bg-white p-2 rounded border border-[#E6EAF0]">
                    <span className="text-[#64748B] block text-[10px]">涵盖表数量</span>
                    <strong className="text-[#172033] text-sm">{currentProposal.impactStats.tableCount} 张</strong>
                  </div>

                  <div className="bg-white p-2 rounded border border-[#E6EAF0]">
                    <span className="text-[#64748B] block text-[10px]">问数分析主题</span>
                    <strong className="text-[#172033] text-sm">{currentProposal.impactStats.topicCount} 个</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E6EAF0] text-[11px] flex justify-between items-center text-[#059669] font-bold">
                  <span>标准缺口覆盖：</span>
                  <span>87 → 0 (完全解决)</span>
                </div>
              </div>
            </div>

            {/* DECISION ACTIONS AREA (右下固定决策区) */}
            <div className="pt-3 border-t border-[#E6EAF0] space-y-2">
              
              {/* Primary Action Button */}
              <button
                onClick={handleAdoptProposal}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>采用建议</span>
              </button>

              {/* Secondary Action Button */}
              <button
                onClick={() => setShowAdjustModal(true)}
                className="w-full py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>修改后采用</span>
              </button>

              {/* Tertiary Action: 暂不采用 */}
              <button
                onClick={() => setShowRejectModal(true)}
                className="w-full py-1.5 text-[#64748B] hover:text-[#172033] text-xs font-medium cursor-pointer text-center underline"
              >
                暂不采用
              </button>

              {/* Light Notice */}
              <p className="text-[10px] text-[#94A3B8] text-center leading-tight">
                采用建议不会直接覆盖或修改正式企业标准，将提交治理确认节点。
              </p>

            </div>

          </div>

        </div>

      </main>

      {/* ========================================================= */}
      {/* DRAWER: All Evidence & Distribution                       */}
      {/* ========================================================= */}
      {showAllEvidenceDrawer && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex justify-end z-50">
          <div className="w-[520px] bg-white h-full shadow-2xl flex flex-col justify-between p-6 space-y-4 animate-in slide-in-from-right duration-200">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
                <h3 className="text-base font-bold text-[#172033]">
                  完整数据证据与语义分布明细
                </h3>
                <button
                  onClick={() => setShowAllEvidenceDrawer(false)}
                  className="p-1 text-[#94A3B8] hover:text-[#172033] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                  <span className="font-bold text-[#172033]">87 个聚类字段分布</span>
                  <p className="text-[#64748B] leading-relaxed">
                    涵盖 population_service、social_security、public_service 3 个主要部门数仓 DB 中的 18 张表。
                  </p>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-2">
                  <span className="font-bold text-[#172033]">同类字段命名词频分析</span>
                  <div className="space-y-1 font-mono text-[11px] text-[#334155]">
                    <div className="flex justify-between">
                      <span>close_time</span>
                      <span className="font-bold text-[#2563EB]">38 次 (43.6%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>finish_time</span>
                      <span className="font-bold text-[#172033]">24 次 (27.5%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>case_finish_time</span>
                      <span className="font-bold text-[#172033]">15 次 (17.2%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setShowAllEvidenceDrawer(false)}
                className="w-full py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                关闭证据视图
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Adjust Proposal Content                            */}
      {/* ========================================================= */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[540px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                调整建议内容 (Edit Proposal Draft)
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">建议标准名称</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E6EAF0] rounded-lg font-bold text-[#172033]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">建议业务定义</label>
                <textarea
                  rows={3}
                  value={editedDefinition}
                  onChange={(e) => setEditedDefinition(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end space-x-2">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveAdjustment}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
              >
                保存调整并采用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Reject / Not Adopt Proposal                        */}
      {/* ========================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[460px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                暂不采用标准建议
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#64748B]">
                请选择不采用此建议的原因，您的反馈将帮助 Xino 优化后续底层语义聚类与建议模型：
              </p>

              <div className="space-y-2">
                {[
                  '已有标准可以满足',
                  '业务概念不成立',
                  '证据不足或分类混淆',
                  '暂不需要统一标准',
                  '其他',
                ].map((reason) => (
                  <label
                    key={reason}
                    onClick={() => setRejectReason(reason)}
                    className={`flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      rejectReason === reason
                        ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-bold'
                        : 'border-[#E6EAF0] bg-white text-[#334155]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      checked={rejectReason === reason}
                      onChange={() => setRejectReason(reason)}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end space-x-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-[#DC2626] text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
              >
                确认暂不采用
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
