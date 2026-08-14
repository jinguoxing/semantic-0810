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
  Edit3,
  GitMerge,
  Trash2,
  PlusCircle,
  ArrowRight,
  CheckSquare,
  Square,
  XCircle,
  Eye,
  Sliders
} from 'lucide-react';

export interface ProposalItem {
  id: string;
  proposalType: 'ADD' | 'MODIFY' | 'MERGE' | 'DEPRECATE';
  proposalTypeLabel: string;
  proposalName: string;
  proposedCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  indexText: string;
  
  // Left Evidence
  evidenceSummary: string;
  fieldCount: number;
  sampleFields: string[];
  businessObject: string;
  semanticType: string;
  dataTypeDistribution: string;
  useCases: string[];
  similarStandards: Array<{
    name: string;
    code: string;
    usedByCount: number;
    matchDegree: '高度相似' | '部分相似';
    note: string;
  }>;
  aiConclusion: string;

  // Middle Proposed Standard
  definition: string;
  businessTerm: string;
  businessDomain: string;
  dataType: string;
  format: string;
  allowNull: string;
  timeZone: string;
  sourceType: string;
  externalRef?: {
    docName: string;
    clause: string;
  };

  // Right Impact & Xino
  xinoRecommendation: string;
  xinoReasons: string[];
  xinoUncertainties: string[];
  impactData: {
    fieldsCount: number;
    dataSourcesCount: number;
    tablesCount: number;
    businessObjectsCount: number;
    qaTopicsCount: number;
  };
}

const SAMPLE_PROPOSALS: ProposalItem[] = [
  {
    id: 'prop_006',
    proposalType: 'ADD',
    proposalTypeLabel: '建议新增标准',
    proposalName: '业务办结时间',
    proposedCode: 'DE_BUSINESS_FINISH_TIME',
    status: 'PENDING',
    indexText: '第 6 / 17 项标准建议',
    
    evidenceSummary: '87 个字段稳定表达“业务办结时间”，但当前企业标准库没有完全匹配的正式数据元标准。',
    fieldCount: 87,
    sampleFields: ['close_time', 'finish_time', 'completed_at', 'case_finish_time', 'biz_finish_time'],
    businessObject: '工单',
    semanticType: '事件时间',
    dataTypeDistribution: '81 / 87 为 DATETIME，6 / 87 为 TIMESTAMP',
    useCases: ['办结时长计算', '办结趋势分析', '时间范围筛选'],
    similarStandards: [
      {
        name: '事项办结时间',
        code: 'DE_APPROVAL_CLOSE_TIME',
        usedByCount: 47,
        matchDegree: '高度相似',
        note: '定义范围仅适用于政务事项审批场景，无法涵盖通用热线与工单。'
      },
      {
        name: '系统关闭时间',
        code: 'DE_SYSTEM_CLOSE_TIME',
        usedByCount: 42,
        matchDegree: '部分相似',
        note: '定义为系统后台记录关闭状态的技术时间点，而非业务完成时刻。'
      }
    ],
    aiConclusion: '当前没有一个现有标准能够完整覆盖 87 个字段的主要业务语义。',

    definition: '业务对象完成规定业务处理动作后形成的实际完成时间点，用于统一表达业务生命周期中的办结时刻。',
    businessTerm: '办结时间',
    businessDomain: '公共服务',
    dataType: 'DATETIME',
    format: 'yyyy-MM-dd HH:mm:ss',
    allowNull: '否',
    timeZone: 'Asia/Shanghai',
    sourceType: '企业自主标准（发现方式：AI 基于真实数据语义发现）',
    externalRef: {
      docName: '《公共服务基础数据元规范》',
      clause: '第 5.3.7 条 · P126'
    },

    xinoRecommendation: '建议建立统一数据元标准',
    xinoReasons: [
      '当前 87 个字段具有稳定的共同业务语义',
      '继续分别使用多个近似标准会增加后续匹配和问数理解的不一致性',
      '能够收拢 6 个主要异构数据源中的办结分析歧义'
    ],
    xinoUncertainties: [
      '6 个字段物理存储使用 TIMESTAMP，而建议标准规范为 DATETIME',
      '“事项办结时间”与当前建议存在较高概念重叠，建议明确业务适用范围'
    ],
    impactData: {
      fieldsCount: 87,
      dataSourcesCount: 6,
      tablesCount: 18,
      businessObjectsCount: 1,
      qaTopicsCount: 3
    }
  },
  {
    id: 'prop_007',
    proposalType: 'MODIFY',
    proposalTypeLabel: '建议修改标准',
    proposalName: '公民身份号码',
    proposedCode: 'DE_PERSON_ID',
    status: 'PENDING',
    indexText: '第 7 / 17 项标准建议',
    
    evidenceSummary: '84 个最新数据字段探查显示全部约束为 18 位，历史 V4 标准定义长度 VARCHAR(20) 需修订为 VARCHAR(18)。',
    fieldCount: 84,
    sampleFields: ['citizen_id', 'id_number', 'pid', 'cert_no', 'person_card'],
    businessObject: '自然人',
    semanticType: '身份标识',
    dataTypeDistribution: '84 / 84 为 VARCHAR(18)',
    useCases: ['个人身份关联', '主数据主键映射', '黑名单比对'],
    similarStandards: [],
    aiConclusion: '依据国家标准 GB 11643—2026 与真实列定义，建议更新正式标准长度要求。',

    definition: '国家法定公民身份识别号码，固定长度 18 位，遵循 GB 11643 校验码规则。',
    businessTerm: '身份证号',
    businessDomain: '人口基础',
    dataType: 'VARCHAR(18)',
    format: 'ISO/GB 11643',
    allowNull: '否',
    timeZone: 'N/A',
    sourceType: '国家标准 GB 11643—2026',

    xinoRecommendation: '建议升级标准规则版本至 V5',
    xinoReasons: [
      '符合最新数据探查特征',
      '物理列长度定义不匹配会导致标准检查报警频发'
    ],
    xinoUncertainties: [
      '需要评估历史旧表中是否存在带有前导空格的废弃 20 位数据'
    ],
    impactData: {
      fieldsCount: 84,
      dataSourcesCount: 8,
      tablesCount: 22,
      businessObjectsCount: 1,
      qaTopicsCount: 5
    }
  }
];

interface StandardProposalReviewWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateBackToMatching?: () => void;
  onNavigateBackToStandards?: () => void;
  onNavigateToDataSemantics?: () => void;
}

export const StandardProposalReviewWorkspace: React.FC<StandardProposalReviewWorkspaceProps> = ({
  addToast,
  onNavigateBackToMatching,
  onNavigateBackToStandards,
  onNavigateToDataSemantics,
}) => {
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');
  const [proposalIndex, setProposalIndex] = useState<number>(0);
  const currentProposal = SAMPLE_PROPOSALS[proposalIndex] || SAMPLE_PROPOSALS[0];

  // Modals / Drawer State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showAllEvidencesDrawer, setShowAllEvidencesDrawer] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('已有标准可以满足');

  // Editable fields in edit modal
  const [editedName, setEditedName] = useState<string>(currentProposal.proposalName);
  const [editedCode, setEditedCode] = useState<string>(currentProposal.proposedCode);
  const [editedDefinition, setEditedDefinition] = useState<string>(currentProposal.definition);
  const [editedDataType, setEditedDataType] = useState<string>(currentProposal.dataType);

  const handlePrevProposal = () => {
    if (proposalIndex > 0) {
      setProposalIndex(proposalIndex - 1);
    } else {
      addToast?.('info', '已是第一项', '当前已处于第 1 项标准建议');
    }
  };

  const handleNextProposal = () => {
    if (proposalIndex < SAMPLE_PROPOSALS.length - 1) {
      setProposalIndex(proposalIndex + 1);
    } else {
      addToast?.('info', '已是最后一项', '当前队列中的标准建议已全部处理完毕');
    }
  };

  const handleApproveProposal = () => {
    addToast?.(
      'success',
      '已提交治理确认',
      `标准建议【${currentProposal.proposalName}】已提交治理确认，将自动生成企业标准 V1 并更新任务引擎`
    );
    handleNextProposal();
  };

  const handleRejectProposal = () => {
    setShowRejectModal(false);
    addToast?.(
      'info',
      '建议暂不采用',
      `已记录反馈原因：“${rejectReason}”，系统将调优 AI 聚类推演阈值`
    );
    handleNextProposal();
  };

  const handleSaveEdits = () => {
    setShowEditModal(false);
    addToast?.('success', '拟议内容已修改', '已完成标准名称、编码与定义微调');
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
      {/* MAIN CONTENT AREA                                         */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC]">
        
        {/* ========================================================= */}
        {/* PAGE HEADER: Breadcrumb + Title + Quick Stepper Controls  */}
        {/* ========================================================= */}
        <div className="bg-white border-b border-[#E6EAF0] px-8 py-3.5 shadow-2xs shrink-0 flex items-center justify-between">
          <div className="space-y-1">
            {/* Breadcrumb & Return Links */}
            <div className="flex items-center space-x-3 text-xs text-[#64748B]">
              <button
                onClick={onNavigateBackToStandards}
                className="hover:text-[#2563EB] flex items-center space-x-1 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回标准库</span>
              </button>
              <span>/</span>
              <button
                onClick={onNavigateBackToMatching}
                className="hover:text-[#2563EB] cursor-pointer font-medium"
              >
                标准匹配
              </button>
              <span>/</span>
              <span className="font-semibold text-[#172033]">标准建议裁决</span>
            </div>

            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                标准建议裁决
              </h1>
              <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold rounded-full text-xs">
                {currentProposal.proposalTypeLabel}
              </span>
              <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1] font-bold rounded-full text-xs">
                待治理确认
              </span>
            </div>

            <p className="text-xs text-[#64748B]">
              审查 AI 基于真实数据和已有企业标准提出的治理建议。
            </p>
          </div>

          {/* Top Right Stepper & Counter */}
          <div className="flex items-center space-x-4 bg-[#F8FAFC] border border-[#E6EAF0] p-2 rounded-xl">
            <div className="text-right">
              <span className="text-xs font-bold text-[#172033] block">
                {currentProposal.indexText}
              </span>
              <span className="text-[10px] text-[#94A3B8]">
                共 17 项待审查提案
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevProposal}
                className="p-1.5 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] hover:bg-[#EFF6FF] hover:text-[#2563EB] cursor-pointer transition-all shadow-2xs"
                title="上一项"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextProposal}
                className="p-1.5 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] hover:bg-[#EFF6FF] hover:text-[#2563EB] cursor-pointer transition-all shadow-2xs"
                title="下一项"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CORE 3-COLUMN WORKSPACE                                   */}
        {/* Left (~34%) | Middle (~42%) | Right (~24%)                */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden p-6 gap-5">
          
          {/* ======================================================= */}
          {/* COLUMN 1: LEFT (~34%) · 为什么提出建议                   */}
          {/* ======================================================= */}
          <div className="w-[34%] bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs flex flex-col overflow-y-auto p-5 space-y-4 shrink-0">
            <div className="border-b border-[#E6EAF0] pb-3">
              <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block">
                Evidence & Discovery
              </span>
              <h2 className="text-base font-bold text-[#172033] mt-0.5">
                为什么提出建议？
              </h2>
            </div>

            {/* Top Evidence Conclusion */}
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs text-[#1E40AF] font-medium leading-relaxed">
              {currentProposal.evidenceSummary}
            </div>

            {/* Real Data Evidences */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                真实数据证据 (Data Evidences)
              </span>

              <div className="space-y-2 text-xs">
                {/* Cluster Count */}
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                  <span className="text-[#64748B]">语义聚类规模</span>
                  <strong className="text-[#2563EB] font-mono font-bold text-sm">
                    {currentProposal.fieldCount} 个字段
                  </strong>
                </div>

                {/* Sample Fields */}
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                  <span className="text-[#64748B] block">典型物理字段：</span>
                  <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                    {currentProposal.sampleFields.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-white border border-[#CBD5E1] rounded text-[#172033]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Object & Semantic */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl">
                    <span className="text-[#64748B] block text-[11px]">关联业务对象</span>
                    <strong className="text-[#172033]">{currentProposal.businessObject}</strong>
                  </div>
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl">
                    <span className="text-[#64748B] block text-[11px]">语义类型</span>
                    <strong className="text-[#4F46E5]">{currentProposal.semanticType}</strong>
                  </div>
                </div>

                {/* Data Type Specs */}
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-0.5">
                  <span className="text-[#64748B] block text-[11px]">物理数据类型分布</span>
                  <strong className="text-[#172033] font-mono text-[11px]">
                    {currentProposal.dataTypeDistribution}
                  </strong>
                </div>

                {/* Use Cases */}
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
                  <span className="text-[#64748B] block text-[11px]">主要使用场景</span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {currentProposal.useCases.map((uc, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-[#E6EAF0] rounded text-[#334155]">
                        • {uc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Standards Search Results */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                相似正式标准检索结果
              </span>

              {currentProposal.similarStandards.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {currentProposal.similarStandards.map((std, i) => (
                    <div key={i} className="p-2.5 bg-white border border-[#E6EAF0] rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#172033]">{std.name}</span>
                        <span className="text-[10px] font-mono text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-1.5 py-0.2 rounded">
                          {std.matchDegree} · 已被 {std.usedByCount} 字段使用
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-snug">
                        {std.note}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B] italic p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E6EAF0]">
                  检索完成，未在标准库中发现重叠度高于 40% 的已有标准。
                </p>
              )}

              <p className="text-[11px] text-[#4F46E5] font-medium pt-1">
                AI 结论：{currentProposal.aiConclusion}
              </p>
            </div>

            {/* View All Evidences Button */}
            <button
              onClick={() => setShowAllEvidencesDrawer(true)}
              className="mt-auto py-2 px-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] hover:border-[#BFDBFE] text-[#2563EB] font-bold text-xs rounded-xl transition-all cursor-pointer text-center block"
            >
              查看全部依据 (Open Drawer)
            </button>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 2: MIDDLE (~42%) · 建议形成的企业标准 (MAIN BODY)  */}
          {/* ======================================================= */}
          <div className="w-[42%] bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs flex flex-col justify-between overflow-y-auto p-6 space-y-5 shrink-0 relative">
            
            <div className="space-y-5">
              {/* Header Badge & Name */}
              <div className="border-b border-[#E6EAF0] pb-4 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block">
                    Proposed Standard Specification
                  </span>
                  <h2 className="text-2xl font-extrabold text-[#172033] mt-1 tracking-tight">
                    {currentProposal.proposalName}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-mono font-bold text-[#2563EB]">
                      {currentProposal.proposedCode}
                    </span>
                    <span className="text-[10px] bg-[#F1F5F9] text-[#64748B] px-1.5 py-0.2 rounded border border-[#E6EAF0]">
                      数据元标准
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="px-2.5 py-1 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] font-bold rounded-lg text-xs inline-block">
                    AI 生成 · 待确认
                  </span>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center space-x-1 text-xs text-[#2563EB] hover:underline font-bold cursor-pointer ml-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>调整建议内容</span>
                  </button>
                </div>
              </div>

              {/* Standard Definition Box */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#64748B] uppercase">标准定义</span>
                <p className="text-sm text-[#172033] leading-relaxed bg-[#F8FAFC] border border-[#E6EAF0] p-3.5 rounded-xl font-medium">
                  “{currentProposal.definition}”
                </p>
              </div>

              {/* Business Relations Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                  业务关联 (Business Context)
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-0.5">
                    <span className="text-[#64748B] text-[11px] block">业务术语</span>
                    <strong className="text-[#172033] font-bold">{currentProposal.businessTerm}</strong>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-0.5">
                    <span className="text-[#64748B] text-[11px] block">业务对象</span>
                    <strong className="text-[#172033] font-bold">{currentProposal.businessObject} · 办结时间</strong>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-0.5">
                    <span className="text-[#64748B] text-[11px] block">业务域</span>
                    <strong className="text-[#172033] font-bold">{currentProposal.businessDomain}</strong>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-0.5">
                    <span className="text-[#64748B] text-[11px] block">语义类型</span>
                    <strong className="text-[#4F46E5] font-bold">{currentProposal.semanticType}</strong>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                  标准技术要求 (Technical Requirements)
                </span>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">数据类型：</span>
                    <div className="flex items-center space-x-2">
                      <strong className="text-[#172033] font-mono font-bold">{currentProposal.dataType}</strong>
                      <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.2 rounded">
                        依据 81 个实际字段
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">格式约束：</span>
                    <div className="flex items-center space-x-2">
                      <strong className="text-[#172033] font-mono font-bold">{currentProposal.format}</strong>
                      <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.2 rounded">
                        依据 81 个实际字段
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">是否允许为空：</span>
                    <strong className="text-[#172033] font-bold">{currentProposal.allowNull}</strong>
                  </div>

                  <div className="p-2.5 bg-white border border-[#E6EAF0] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">时区约束：</span>
                    <strong className="text-[#172033] font-mono font-bold">{currentProposal.timeZone}</strong>
                  </div>
                </div>
              </div>

              {/* Standard Origin & External References */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl text-xs space-y-1">
                <span className="text-[#64748B] block text-[11px]">标准来源：</span>
                <p className="font-semibold text-[#172033]">
                  {currentProposal.sourceType}
                </p>

                {currentProposal.externalRef && (
                  <div className="pt-2 border-t border-[#E6EAF0] flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1 text-[#2563EB]">
                      <FileText className="w-3.5 h-3.5" />
                      <span>可参考外部标准依据：{currentProposal.externalRef.docName} {currentProposal.externalRef.clause}</span>
                    </div>
                    <button
                      onClick={() => addToast?.('info', '查看原文', '已载入《公共服务基础数据元规范》第 126 页参考条目')}
                      className="text-[#2563EB] hover:underline font-bold cursor-pointer"
                    >
                      查看原文
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Tip */}
            <div className="text-[11px] text-[#64748B] bg-[#F1F5F9] p-2.5 rounded-xl border border-[#CBD5E1] text-center">
              💡 提示：在此页面轻量修改参数不会改变现有生产环境表结构，采用后将生成 Draft 标准并进入治理确认任务链。
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 3: RIGHT (~24%) · 影响与决策 (IMPACT & ACTION)    */}
          {/* ======================================================= */}
          <div className="w-[24%] bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs flex flex-col justify-between overflow-y-auto p-5 space-y-4 shrink-0">
            
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#E6EAF0] pb-3">
                <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider block">
                  Xino Partner Decision
                </span>
                <h2 className="text-base font-bold text-[#172033] mt-0.5">
                  Xino 判断 & 影响范围
                </h2>
              </div>

              {/* Xino Recommendation Box */}
              <div className="p-3.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl space-y-2">
                <div className="flex items-center space-x-1.5 text-[#4F46E5] font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Xino 推荐</span>
                </div>

                <h3 className="text-sm font-extrabold text-[#1E1B4B]">
                  {currentProposal.xinoRecommendation}
                </h3>

                <ul className="space-y-1 text-xs text-[#312E81] list-disc list-inside">
                  {currentProposal.xinoReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Uncertainties Area (Crucial for Transparency) */}
              <div className="p-3.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl space-y-2 text-xs text-[#92400E]">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>需要确认 (Uncertainties)</span>
                </div>

                <ul className="space-y-1 text-[11px] text-[#78350F] list-disc list-inside">
                  {currentProposal.xinoUncertainties.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>

              {/* Expected Impact Summary */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                  预计影响范围 (Expected Impact)
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">标准匹配候选</span>
                    <strong className="text-[#2563EB] font-bold text-sm font-mono">
                      {currentProposal.impactData.fieldsCount} 个字段
                    </strong>
                  </div>

                  <div className="p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">涉及异构数据源</span>
                    <strong className="text-[#172033] font-bold text-sm font-mono">
                      {currentProposal.impactData.dataSourcesCount} 个
                    </strong>
                  </div>

                  <div className="p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">物理表</span>
                    <strong className="text-[#172033] font-bold text-sm font-mono">
                      {currentProposal.impactData.tablesCount} 张
                    </strong>
                  </div>

                  <div className="p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">问数智能主题</span>
                    <strong className="text-[#4F46E5] font-bold text-sm font-mono">
                      {currentProposal.impactData.qaTopicsCount} 个
                    </strong>
                  </div>
                </div>
              </div>

              {/* Outcome Impact */}
              <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs text-[#065F46] space-y-1">
                <span className="font-bold block">治理预期收益：</span>
                <p className="text-[11px] leading-relaxed">
                  消除 87 个标准缺口，将同类跨表时间统计歧义降低 100%，自动联动后续标准检查。
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#E6EAF0] space-y-2">
              <button
                onClick={handleApproveProposal}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>采用建议</span>
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                className="w-full py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#64748B]" />
                <span>修改后采用</span>
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                className="w-full py-1.5 text-[#64748B] hover:text-[#BE123C] text-xs font-medium cursor-pointer text-center underline block"
              >
                暂不采用（带原因反馈）
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL: Adjust Proposal Content                            */}
      {/* ========================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[560px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                微调标准建议参数 (Adjust Proposal)
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
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
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg text-xs font-bold text-[#172033]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">建议标准编码</label>
                <input
                  type="text"
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg text-xs font-mono font-bold text-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">标准定义说明</label>
                <textarea
                  rows={3}
                  value={editedDefinition}
                  onChange={(e) => setEditedDefinition(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg text-xs font-medium text-[#172033]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">建议数据类型</label>
                <select
                  value={editedDataType}
                  onChange={(e) => setEditedDataType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg text-xs font-bold text-[#172033]"
                >
                  <option value="DATETIME">DATETIME</option>
                  <option value="TIMESTAMP">TIMESTAMP</option>
                  <option value="VARCHAR(18)">VARCHAR(18)</option>
                  <option value="DATE">DATE</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdits}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                保存并更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Reject Reason                                      */}
      {/* ========================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[480px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                暂不采用标准建议 (Reason Feedback)
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#64748B]">请选择暂不采用原因，反馈将用于向 AI 模型调优聚类与挖掘阈值：</p>

              <div className="space-y-2">
                {[
                  '已有标准可以满足',
                  '业务概念不成立或缺乏代表性',
                  '证据不足，需积累更多底层列数据',
                  '暂不需要统一标准',
                  '其他自定义理由'
                ].map((reason, i) => (
                  <label key={i} className="flex items-center space-x-2.5 p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl cursor-pointer hover:bg-[#EFF6FF]">
                    <input
                      type="radio"
                      name="reject_reason"
                      checked={rejectReason === reason}
                      onChange={() => setRejectReason(reason)}
                      className="text-[#2563EB]"
                    />
                    <span className="font-bold text-[#172033]">{reason}</span>
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
                onClick={handleRejectProposal}
                className="px-4 py-2 bg-[#BE123C] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                确认暂不采用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER: Complete Evidence Detail                          */}
      {/* ========================================================= */}
      {showAllEvidencesDrawer && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex justify-end z-50">
          <div className="w-[600px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] p-6 space-y-4 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  完整数据依据图谱 (Full Evidence Graph)
                </h3>
                <span className="text-xs font-mono text-[#2563EB]">
                  Proposal ID: {currentProposal.id}
                </span>
              </div>
              <button
                onClick={() => setShowAllEvidencesDrawer(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
                <span className="font-bold text-[#2563EB] block">证据覆盖率分析：</span>
                <p className="text-[#1E40AF] mt-1">
                  该建议通过全库 12,480 个字段的语义分析提取，对 87 个同类列覆盖率达 100%，聚类显著度高于企业平均基线 4.2 倍。
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#172033] block">物理表样本关联详情：</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {[
                    { db: 'population_service', tbl: 'case_record', col: 'close_time', type: 'DATETIME' },
                    { db: 'service_case', tbl: 'history', col: 'finish_time', type: 'DATETIME' },
                    { db: 'hotline_db', tbl: 'workorder', col: 'completed_at', type: 'DATETIME' },
                    { db: 'public_service', tbl: 'ticket', col: 'case_finish_time', type: 'TIMESTAMP' },
                    { db: 'archive_db', tbl: 'process', col: 'biz_finish_time', type: 'DATETIME' },
                  ].map((row, i) => (
                    <div key={i} className="p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg flex justify-between">
                      <span>{row.db}.{row.tbl}</span>
                      <strong className="text-[#2563EB]">{row.col} ({row.type})</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6EAF0] mt-auto">
              <button
                onClick={() => setShowAllEvidencesDrawer(false)}
                className="w-full py-2 bg-[#F1F5F9] text-[#334155] font-bold text-xs rounded-xl cursor-pointer"
              >
                关闭图谱 Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
