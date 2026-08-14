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
  FileText,
  Building,
  Table,
  Check,
  ArrowRight,
  Eye,
  Info,
  Clock,
  History,
  GitPullRequest,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Sliders,
  CheckSquare,
  XSquare
} from 'lucide-react';

export interface IssueDetailItem {
  id: string;
  fieldCode: string;
  dataAsset: string;
  standardName: string;
  standardCode: string;
  version: string;
  checkResultLabel: string;
  standardRequirement: {
    dataType: string;
    format: string;
    allowNull: string;
    timeZone: string;
  };
  actualData: {
    dataType: string;
    nonNullRate: string;
    valuePattern: string;
    recentSchemaChange: string;
    changeDate: string;
    semanticTerm: string;
    semanticType: string;
    businessObject: string;
  };
  issueConclusion: string;
  hypotheses: Array<{
    id: string;
    title: string;
    statusLabel: string;
    statusType: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    supportingEvidence: string[];
    opposingEvidence?: string[];
    suggestedDirection: string;
  }>;
  evidencePros: string[];
  evidenceCons: string[];
  historyTimeline: Array<{
    date: string;
    event: string;
    detail: string;
  }>;
  xinoJudgement: {
    conclusion: string;
    explanation: string;
    secondaryAdvice: string;
  };
  impactScope: {
    directFields: number;
    qaTopics: number;
    objectAttributes: number;
    checkRules: number;
    downstreamAnalytics: number;
  };
}

const SAMPLE_ISSUE: IssueDetailItem = {
  id: 'issue_004',
  fieldCode: 'close_time',
  dataAsset: 'population_service.case_record',
  standardName: '业务办结时间',
  standardCode: 'DE_CASE_CLOSE_TIME',
  version: 'V3',
  checkResultLabel: '数据类型不符合',
  standardRequirement: {
    dataType: 'DATETIME',
    format: 'yyyy-MM-dd HH:mm:ss',
    allowNull: '否',
    timeZone: 'Asia/Shanghai'
  },
  actualData: {
    dataType: 'VARCHAR',
    nonNullRate: '98.8%',
    valuePattern: '2026-08-12 14:22:05 (标准 ISO 时间字符串)',
    recentSchemaChange: 'DATETIME → VARCHAR',
    changeDate: '2026-08-09',
    semanticTerm: '办结时间',
    semanticType: '事件时间',
    businessObject: '工单'
  },
  issueConclusion: '当前字段的数据类型已从 DATETIME 变更为 VARCHAR，与“业务办结时间 V3”的正式类型要求不一致。',
  hypotheses: [
    {
      id: 'h1',
      title: '诊断 1 · 数据结构发生偏离 (建议审查上游 DDL 改造)',
      statusLabel: '较可能 (High Likelihood)',
      statusType: 'HIGH',
      description: '字段业务语义仍保持“办结时间”，但物理技术类型发生改变，可能是上游微服务改造将日志存储改为文本字符串格式导致的数据标准偏差。',
      supportingEvidence: [
        '业务语义探查结果仍 100% 对应“办结时间”',
        '关联物理表所属业务对象仍为“工单”',
        '数据列值 98.8% 依然存储合法时间字符串',
        '版本审计日志显示 Schema 最近于 2026-08-09 由 DATETIME 变更为了 VARCHAR'
      ],
      suggestedDirection: '进入数据质量治理，排查上游同步转换或要求恢复 DATETIME 类型'
    },
    {
      id: 'h2',
      title: '诊断 2 · 原标准匹配关系可能需要重新确认',
      statusLabel: '需要检查 (Medium Risk)',
      statusType: 'MEDIUM',
      description: '近期部分新上线的统计分析看板开始将该 close_time 字段解释为“系统技术关闭时间”而非真实业务处理完成时间。',
      supportingEvidence: [
        '部分分析查询将其用于 CLOSED 状态系统过滤',
        '字段物理技术名称包含 close 字样',
        '近期新增的数据消费上下文语义发生细微漂移'
      ],
      opposingEvidence: [
        '主表注释仍说明该字段为窗口办结完成时间',
        '87% 的关联 SQL join 仍与办结工单统计绑定'
      ],
      suggestedDirection: '重新确认该字段是否仍应匹配“业务办结时间 V3”'
    },
    {
      id: 'h3',
      title: '诊断 3 · 企业标准本身可能需要调整升级',
      statusLabel: '当前证据较弱 (Low Probability)',
      statusType: 'LOW',
      description: '同类新增的 6 个异构子系统中已有物理字段使用 VARCHAR 存储时间，但尚不足以证明企业正式标准应当整体变更。',
      supportingEvidence: [
        '6 个近期新增的数据源字段均采用了 VARCHAR(19)'
      ],
      opposingEvidence: [
        '标准库中 81 个同类核心字段仍严格采用 DATETIME',
        '变更企业标准影响面覆盖 18 张核心物理表'
      ],
      suggestedDirection: '当前不建议修改企业标准，应维持标准稳定性'
    }
  ],
  evidencePros: [
    '当前数据语义探查结果仍为“办结时间”',
    '关联业务对象“工单”结构未改变',
    '81 个同类字段仍严格采用 DATETIME',
    '17 个历史审计字段已确认该标准匹配'
  ],
  evidenceCons: [
    '物理字段类型已被 Alter table 改为 VARCHAR',
    '部分微服务查询上下文偏向“系统关闭点”',
    '6 个新引入边缘数据源采用了 VARCHAR 存储'
  ],
  historyTimeline: [
    { date: '2026-08-09', event: 'Schema 物理变更', detail: '物理字段 close_time 数据类型由 DATETIME 被 DDL 调整为 VARCHAR' },
    { date: '2026-07-18', event: '标准匹配确认', detail: '治理人员确认匹配至【业务办结时间 DE_CASE_CLOSE_TIME · V3】' },
    { date: '2026-06-18', event: '标准 V3 发布', detail: '数据标准委员会正式发布业务办结时间 V3 标准规范' }
  ],
  xinoJudgement: {
    conclusion: '优先检查数据结构变化 (D1 概率最高)',
    explanation: '当前业务语义和工单对象上下文仍然高度支持“业务办结时间”，因此暂不建议修改企业标准。优先确认上游为何将字段类型由 DATETIME 改为 VARCHAR。',
    secondaryAdvice: '若排查确认上游系统改造不可逆，可重新验证当前 Standard Mapping，排除业务含义是否已发生漂移。'
  },
  impactScope: {
    directFields: 1,
    qaTopics: 2,
    objectAttributes: 1,
    checkRules: 1,
    downstreamAnalytics: 3
  }
};

interface StandardCheckIssueDetailWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateBackToCheckList?: () => void;
  onNavigateToDataQuality?: () => void;
  onNavigateToStandardMatching?: () => void;
  onNavigateToStandardProposalReview?: () => void;
  onNavigateToDataSemantics?: () => void;
}

export const StandardCheckIssueDetailWorkspace: React.FC<StandardCheckIssueDetailWorkspaceProps> = ({
  addToast,
  onNavigateBackToCheckList,
  onNavigateToDataQuality,
  onNavigateToStandardMatching,
  onNavigateToStandardProposalReview,
  onNavigateToDataSemantics
}) => {
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');
  const [currentIssueIndex, setCurrentIssueIndex] = useState<number>(4);
  const [showIndeterminateModal, setShowIndeterminateModal] = useState<boolean>(false);
  const [indeterminateReason, setIndeterminateReason] = useState<string>('需要业务专家进一步确认');

  const handlePrevIssue = () => {
    if (currentIssueIndex > 1) {
      setCurrentIssueIndex(currentIssueIndex - 1);
      addToast?.('info', '切换问题', `已载入第 ${currentIssueIndex - 1} / 7 个标准检查问题`);
    } else {
      addToast?.('info', '已是第一个', '当前已处于第 1 个异常诊断项');
    }
  };

  const handleNextIssue = () => {
    if (currentIssueIndex < 7) {
      setCurrentIssueIndex(currentIssueIndex + 1);
      addToast?.('info', '切换问题', `已载入第 ${currentIssueIndex + 1} / 7 个标准检查问题`);
    } else {
      addToast?.('info', '已是最后一个', '当前队列中的异常问题已全部审查完毕');
    }
  };

  const handleGoToDataQuality = () => {
    addToast?.(
      'success',
      '路由至数据质量治理',
      '已创建数据质量治理上下文（带入close_time 与 DATETIME 校验），进入数据质量工单流'
    );
    if (onNavigateToDataQuality) {
      onNavigateToDataQuality();
    }
  };

  const handleGoToStandardMatching = () => {
    addToast?.(
      'info',
      '路由至标准匹配',
      '已带入 close_time 字段筛选，进入标准匹配重新校验 mapping 对应关系'
    );
    if (onNavigateToStandardMatching) {
      onNavigateToStandardMatching();
    }
  };

  const handleGoToProposalReview = () => {
    addToast?.(
      'info',
      '路由至标准建议裁决',
      '已生成 CHANGE 类型的企业标准调整提议上下文'
    );
    if (onNavigateToStandardProposalReview) {
      onNavigateToStandardProposalReview();
    }
  };

  const handleConfirmIndeterminate = () => {
    setShowIndeterminateModal(false);
    addToast?.(
      'info',
      '状态更新为【待补充证据】',
      `问题已记录归档，原因：“${indeterminateReason}”，暂不归咎为数据质量错误`
    );
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
              if (onNavigateToDataQuality) onNavigateToDataQuality();
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
        {/* PAGE HEADER: Breadcrumb + Title + Stepper Controls        */}
        {/* ========================================================= */}
        <div className="bg-white border-b border-[#E6EAF0] px-8 py-3.5 shadow-2xs shrink-0 flex items-center justify-between">
          <div className="space-y-1">
            {/* Breadcrumb & Back Link */}
            <div className="flex items-center space-x-3 text-xs text-[#64748B]">
              <button
                onClick={onNavigateBackToCheckList}
                className="hover:text-[#2563EB] flex items-center space-x-1 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回标准检查</span>
              </button>
              <span>/</span>
              <span>业务办结时间</span>
              <span>/</span>
              <span className="font-semibold text-[#172033] font-mono">close_time</span>
            </div>

            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                标准检查问题详情
              </h1>
              <span className="px-2.5 py-0.5 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] font-bold rounded-full text-xs flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{SAMPLE_ISSUE.checkResultLabel}</span>
              </span>
              <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1] font-bold rounded-full text-xs">
                需要诊断
              </span>
            </div>

            <p className="text-xs text-[#64748B]">
              判断标准偏差的真实原因（数据问题、标准匹配问题或标准本身调整），并选择正确的治理方向。
            </p>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center space-x-4 bg-[#F8FAFC] border border-[#E6EAF0] p-2 rounded-xl">
            <div className="text-right">
              <span className="text-xs font-bold text-[#172033] block">
                第 {currentIssueIndex} / 7 个问题
              </span>
              <span className="text-[10px] text-[#94A3B8]">
                数据类型不符合类异常
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevIssue}
                className="p-1.5 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] hover:bg-[#EFF6FF] hover:text-[#2563EB] cursor-pointer transition-all shadow-2xs"
                title="上一项"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextIssue}
                className="p-1.5 bg-white border border-[#E6EAF0] rounded-lg text-[#334155] hover:bg-[#EFF6FF] hover:text-[#2563EB] cursor-pointer transition-all shadow-2xs"
                title="下一项"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CORE 3-COLUMN DIAGNOSIS WORKSPACE                         */}
        {/* Left (~30%) | Middle (~45% Main) | Right (~25%)           */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden p-6 gap-5">
          
          {/* ======================================================= */}
          {/* COLUMN 1: LEFT (~30%) · 标准与实际事实                   */}
          {/* ======================================================= */}
          <div className="w-[30%] bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs flex flex-col overflow-y-auto p-5 space-y-4 shrink-0">
            
            {/* Standard Facts Section */}
            <div className="space-y-2 border-b border-[#E6EAF0] pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block">
                  Enterprise Standard Spec
                </span>
                <span className="px-1.5 py-0.2 bg-[#ECFDF5] text-[#059669] text-[10px] font-bold rounded border border-[#A7F3D0]">
                  生效中
                </span>
              </div>

              <h2 className="text-base font-bold text-[#172033]">
                企业标准：{SAMPLE_ISSUE.standardName}
              </h2>
              <span className="text-xs font-mono text-[#2563EB] block">
                {SAMPLE_ISSUE.standardCode} · {SAMPLE_ISSUE.version}
              </span>

              {/* Standard Requirements Grid */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl text-xs space-y-1.5 mt-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block border-b border-[#E6EAF0] pb-1">
                  正式标准定义要求
                </span>

                <div className="flex justify-between py-0.5">
                  <span className="text-[#64748B]">数据类型：</span>
                  <strong className="text-[#172033] font-mono font-bold">{SAMPLE_ISSUE.standardRequirement.dataType}</strong>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-[#64748B]">格式约束：</span>
                  <strong className="text-[#172033] font-mono font-bold text-[11px]">{SAMPLE_ISSUE.standardRequirement.format}</strong>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-[#64748B]">允许为空：</span>
                  <strong className="text-[#172033] font-bold">{SAMPLE_ISSUE.standardRequirement.allowNull}</strong>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-[#64748B]">时区约束：</span>
                  <strong className="text-[#172033] font-mono font-bold">{SAMPLE_ISSUE.standardRequirement.timeZone}</strong>
                </div>
              </div>

              <button
                onClick={() => addToast?.('info', '标准详情', '载入【业务办结时间 DE_CASE_CLOSE_TIME · V3】规则书')}
                className="text-xs text-[#2563EB] hover:underline font-bold cursor-pointer inline-flex items-center space-x-1 pt-1"
              >
                <span>查看标准详情</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Actual Data Facts Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider block">
                Actual Data Profile
              </span>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold font-mono text-[#172033]">
                  {SAMPLE_ISSUE.fieldCode}
                </h3>
                <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] font-mono font-bold text-xs rounded border border-[#FDE68A]">
                  实际: {SAMPLE_ISSUE.actualData.dataType}
                </span>
              </div>

              <span className="text-[11px] font-mono text-[#64748B] block">
                资产表: {SAMPLE_ISSUE.dataAsset}
              </span>

              {/* Data Feature Cards */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">非空列采样率：</span>
                  <strong className="text-[#059669] font-mono font-bold">{SAMPLE_ISSUE.actualData.nonNullRate || '98.8%'}</strong>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[#64748B] text-[11px] block">主要值形态采样：</span>
                  <p className="text-[11px] font-mono bg-white p-1.5 rounded border border-[#CBD5E1] text-[#172033]">
                    {SAMPLE_ISSUE.actualData.valuePattern}
                  </p>
                </div>

                <div className="p-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-[11px] text-[#92400E] space-y-0.5">
                  <span className="font-bold flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#D97706]" />
                    <span>最近 Schema 变更审计：</span>
                  </span>
                  <p className="font-mono font-bold">
                    {SAMPLE_ISSUE.actualData.recentSchemaChange} ({SAMPLE_ISSUE.actualData.changeDate})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                  <div className="p-1.5 bg-white border border-[#E6EAF0] rounded">
                    <span className="text-[#64748B] block text-[10px]">探查语义</span>
                    <strong className="text-[#172033] font-bold">{SAMPLE_ISSUE.actualData.semanticTerm}</strong>
                  </div>
                  <div className="p-1.5 bg-white border border-[#E6EAF0] rounded">
                    <span className="text-[#64748B] block text-[10px]">所属对象</span>
                    <strong className="text-[#172033] font-bold">{SAMPLE_ISSUE.actualData.businessObject}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onNavigateToDataSemantics) onNavigateToDataSemantics();
                }}
                className="text-xs text-[#2563EB] hover:underline font-bold cursor-pointer inline-flex items-center space-x-1 pt-1"
              >
                <span>查看数据语义与特征探查 →</span>
              </button>
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 2: MIDDLE (~45% MAIN) · 原因诊断 (DIAGNOSIS)     */}
          {/* ======================================================= */}
          <div className="w-[45%] bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs flex flex-col justify-between overflow-y-auto p-6 space-y-5 shrink-0">
            
            <div className="space-y-5">
              {/* Header Box: Fact Conclusion */}
              <div className="p-4 bg-[#FEF3C7]/60 border border-[#FDE68A] rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider block">
                  Why Non-Compliant? · 事实判定结论
                </span>
                <h2 className="text-base font-extrabold text-[#78350F] leading-snug">
                  {SAMPLE_ISSUE.issueConclusion}
                </h2>
                <div className="flex items-center space-x-2 pt-1 text-xs text-[#92400E] font-medium">
                  <span className="px-2 py-0.5 bg-white border border-[#FDE68A] rounded font-bold text-[#D97706]">
                    确定存在标准偏差
                  </span>
                  <span>偏差存在不代表必须修数据，需根据因果证据选择正确治理方向。</span>
                </div>
              </div>

              {/* Multi-Hypothesis Diagnosis Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2">
                  <h3 className="text-sm font-bold text-[#172033]">
                    原因多重假设诊断 (Diagnostic Hypotheses)
                  </h3>
                  <span className="text-xs text-[#64748B]">依据证据强度推演</span>
                </div>

                <div className="space-y-3.5">
                  {SAMPLE_ISSUE.hypotheses.map((hypo) => {
                    const isHigh = hypo.statusType === 'HIGH';
                    const isMedium = hypo.statusType === 'MEDIUM';

                    return (
                      <div
                        key={hypo.id}
                        className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                          isHigh
                            ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                            : isMedium
                            ? 'bg-[#F8FAFC] border-[#E6EAF0]'
                            : 'bg-[#F8FAFC] border-[#E6EAF0] opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-bold ${
                            isHigh ? 'text-[#1E40AF] text-sm' : 'text-[#172033]'
                          }`}>
                            {hypo.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHigh
                              ? 'bg-[#2563EB] text-white'
                              : isMedium
                              ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                              : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                          }`}>
                            {hypo.statusLabel}
                          </span>
                        </div>

                        <p className="text-xs text-[#334155] leading-relaxed">
                          {hypo.description}
                        </p>

                        {/* Evidence bullets */}
                        <div className="space-y-1 text-[11px] pt-1">
                          <span className="font-bold text-[#172033] block">支撑证据 (Supporting Evidences):</span>
                          <ul className="space-y-0.5 text-[#475569] list-disc list-inside">
                            {hypo.supportingEvidence.map((se, i) => (
                              <li key={i}>{se}</li>
                            ))}
                          </ul>

                          {hypo.opposingEvidence && hypo.opposingEvidence.length > 0 && (
                            <div className="pt-1.5">
                              <span className="font-bold text-[#BE123C] block">反向证据 (Opposing Evidences):</span>
                              <ul className="space-y-0.5 text-[#9F1239] list-disc list-inside">
                                {hypo.opposingEvidence.map((oe, i) => (
                                  <li key={i}>{oe}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#CBD5E1]/40 flex items-center justify-between text-[11px]">
                          <span className="text-[#64748B]">建议处理方向：</span>
                          <strong className="text-[#2563EB]">{hypo.suggestedDirection}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Supporting vs Opposing Evidences Matrix */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                  综合证据全景 (Evidence Balance)
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Pros */}
                  <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl space-y-1.5">
                    <span className="font-bold text-[#065F46] flex items-center space-x-1">
                      <CheckSquare className="w-3.5 h-3.5 text-[#059669]" />
                      <span>支持继续维持当前标准匹配 ({SAMPLE_ISSUE.evidencePros.length})</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-[#047857] list-disc list-inside">
                      {SAMPLE_ISSUE.evidencePros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl space-y-1.5">
                    <span className="font-bold text-[#9F1239] flex items-center space-x-1">
                      <XSquare className="w-3.5 h-3.5 text-[#BE123C]" />
                      <span>需要注意的矛盾点 ({SAMPLE_ISSUE.evidenceCons.length})</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-[#BE123C] list-disc list-inside">
                      {SAMPLE_ISSUE.evidenceCons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Historical Changes Timeline */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                  历史演进节点 (Timeline Context)
                </span>

                <div className="space-y-2 text-xs">
                  {SAMPLE_ISSUE.historyTimeline.map((item, i) => (
                    <div key={i} className="flex items-start space-x-3 p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl">
                      <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#BFDBFE] shrink-0 mt-0.5">
                        {item.date}
                      </span>
                      <div>
                        <strong className="text-[#172033] block text-xs">{item.event}</strong>
                        <p className="text-[11px] text-[#64748B]">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 3: RIGHT (~25%) · XINO JUDGEMENT & DECISION ACTIONS */}
          {/* ======================================================= */}
          <div className="w-[25%] bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs flex flex-col justify-between overflow-y-auto p-5 space-y-4 shrink-0">
            
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#E6EAF0] pb-3">
                <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider block">
                  Xino Partner Decision
                </span>
                <h2 className="text-base font-bold text-[#172033] mt-0.5">
                  Xino 综合判断
                </h2>
              </div>

              {/* Xino Recommendation Card */}
              <div className="p-3.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl space-y-2">
                <div className="flex items-center space-x-1.5 text-[#4F46E5] font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>核心结论</span>
                </div>

                <h3 className="text-sm font-extrabold text-[#1E1B4B]">
                  {SAMPLE_ISSUE.xinoJudgement.conclusion}
                </h3>

                <p className="text-xs text-[#312E81] leading-relaxed">
                  {SAMPLE_ISSUE.xinoJudgement.explanation}
                </p>

                <p className="text-[11px] text-[#4338CA] pt-1 border-t border-[#C7D2FE]/60 italic">
                  💡 {SAMPLE_ISSUE.xinoJudgement.secondaryAdvice}
                </p>
              </div>

              {/* Impact Scope */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                  当前异常影响范围 (Impact)
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">异常字段</span>
                    <strong className="text-[#2563EB] font-bold text-sm font-mono">1 个</strong>
                  </div>

                  <div className="p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">智能问数主题</span>
                    <strong className="text-[#4F46E5] font-bold text-sm font-mono">2 个</strong>
                  </div>

                  <div className="p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">业务对象属性</span>
                    <strong className="text-[#172033] font-bold text-sm font-mono">1 项</strong>
                  </div>

                  <div className="p-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg">
                    <span className="text-[#64748B] text-[10px] block">下游看板分析</span>
                    <strong className="text-[#172033] font-bold text-sm font-mono">3 个</strong>
                  </div>
                </div>
              </div>

              {/* Recommended Next Paths */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[#172033] block border-b border-[#E6EAF0] pb-1">
                  推荐治理下一步 (Decision Actions)
                </span>

                <div className="space-y-2">
                  {/* Primary Action */}
                  <button
                    onClick={handleGoToDataQuality}
                    className="w-full p-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl transition-all cursor-pointer shadow-2xs text-left space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>1. 进入数据质量治理</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] text-[#BFDBFE] block leading-tight">
                      排查上游字段类型变化及同步转换（推荐主路径）
                    </span>
                  </button>

                  {/* Secondary Action */}
                  <button
                    onClick={handleGoToStandardMatching}
                    className="w-full p-2.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-xl transition-all cursor-pointer text-left space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-[#172033]">
                      <span>2. 重新确认标准匹配</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                    </div>
                    <span className="text-[10px] text-[#64748B] block leading-tight">
                      重新校验 close_time 是否仍对应“业务办结时间”
                    </span>
                  </button>

                  {/* Tertiary Action */}
                  <button
                    onClick={handleGoToProposalReview}
                    className="w-full p-2.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-xl transition-all cursor-pointer text-left space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-[#172033]">
                      <span>3. 提出标准变更建议</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                    </div>
                    <span className="text-[10px] text-[#64748B] block leading-tight">
                      若确认企业标准本身需要更新为 VARCHAR 时使用
                    </span>
                  </button>

                  {/* Indeterminate Action */}
                  <button
                    onClick={() => setShowIndeterminateModal(true)}
                    className="w-full py-1.5 text-[#64748B] hover:text-[#2563EB] text-xs font-medium cursor-pointer text-center underline block"
                  >
                    暂无法判断（补充证据）
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Info Note */}
            <div className="text-[11px] text-[#64748B] bg-[#F1F5F9] p-2.5 rounded-xl border border-[#CBD5E1] text-center">
              🛡️ 治理决策将自动保存并转交 Semovix 任务引擎追溯，不会直接强制修改物理库数据。
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL: Indeterminate Reason Selection                      */}
      {/* ========================================================= */}
      {showIndeterminateModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[480px] bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                标记为【暂无法判断】 (Indeterminate)
              </h3>
              <button
                onClick={() => setShowIndeterminateModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#64748B]">
                选择无法判定的主因，问题将进入【待补充证据】队列，不会归咎为数据质量失效：
              </p>

              <div className="space-y-2">
                {[
                  '缺少必要的数据探查 Profile 样本',
                  '需要业务专家进一步确认业务含义',
                  '当前账号缺少该源物理表数据访问权限',
                  '上游系统改造尚未完成，等待下周上线',
                  '其他自定义原因'
                ].map((reason, i) => (
                  <label key={i} className="flex items-center space-x-2.5 p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl cursor-pointer hover:bg-[#EFF6FF]">
                    <input
                      type="radio"
                      name="indet_reason"
                      checked={indeterminateReason === reason}
                      onChange={() => setIndeterminateReason(reason)}
                      className="text-[#2563EB]"
                    />
                    <span className="font-bold text-[#172033]">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF0] flex justify-end space-x-2">
              <button
                onClick={() => setShowIndeterminateModal(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#334155] text-xs font-bold rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmIndeterminate}
                className="px-4 py-2 bg-[#64748B] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                标记为待补充证据
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
