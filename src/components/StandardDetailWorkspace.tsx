import React, { useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  Layers,
  Database,
  ShieldCheck,
  FolderTree,
  X,
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
  XSquare,
  MoreHorizontal,
  FileCheck,
  FileSpreadsheet,
  Download,
  Share2,
  Tag,
  Link,
  ChevronDown
} from 'lucide-react';

interface StandardDetailWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateBackToCatalog?: () => void;
  onNavigateToMatchingTab?: () => void;
  onNavigateToCheckTab?: () => void;
  onNavigateToCheckIssueDetail?: () => void;
  onNavigateToProposalReview?: () => void;
  onNavigateToDataSemantics?: () => void;
}

// Usage fields mock data
const USAGE_FIELDS_DATA = [
  { id: 'uf_1', ds: 'population_service', table: 'case_record', field: 'close_time', type: 'VARCHAR', nonNullRate: '98.8%', status: 'NON_COMPLIANT', statusLabel: '数据类型不符合 (VARCHAR)', lastChecked: '2026-08-12 03:20' },
  { id: 'uf_2', ds: 'hotline_db', table: 'case_record', field: 'finish_time', type: 'DATETIME', nonNullRate: '99.5%', status: 'COMPLIANT', statusLabel: '符合标准', lastChecked: '2026-08-12 03:20' },
  { id: 'uf_3', ds: 'gov_service_hub', table: 'service_case', field: 'completed_at', type: 'DATETIME', nonNullRate: '100%', status: 'COMPLIANT', statusLabel: '符合标准', lastChecked: '2026-08-12 03:20' },
  { id: 'uf_4', ds: 'crm_service', table: 'work_order_main', field: 'done_timestamp', type: 'DATETIME', nonNullRate: '97.2%', status: 'COMPLIANT', statusLabel: '符合标准', lastChecked: '2026-08-12 03:20' },
  { id: 'uf_5', ds: 'appeal_db', table: 'citizen_appeal', field: 'resolve_time', type: 'DATETIME', nonNullRate: '99.1%', status: 'COMPLIANT', statusLabel: '符合标准', lastChecked: '2026-08-12 03:20' },
  { id: 'uf_6', ds: 'inspect_db', table: 'supervise_task', field: 'archive_time', type: 'TIMESTAMP', nonNullRate: '96.4%', status: 'INDETERMINATE', statusLabel: '时区待补全 (TIMESTAMP)', lastChecked: '2026-08-12 03:20' },
  { id: 'uf_7', ds: 'subdistrict_db', table: 'grid_event', field: 'closed_date', type: 'VARCHAR', nonNullRate: '94.0%', status: 'NON_COMPLIANT', statusLabel: '格式不合规 (yyyy/MM/dd)', lastChecked: '2026-08-12 03:20' },
  { id: 'uf_8', ds: 'smart_city_dw', table: 'dwd_case_fact', field: 'close_time', type: 'DATETIME', nonNullRate: '100%', status: 'COMPLIANT', statusLabel: '符合标准', lastChecked: '2026-08-12 03:20' },
];

export const StandardDetailWorkspace: React.FC<StandardDetailWorkspaceProps> = ({
  addToast,
  onNavigateBackToCatalog,
  onNavigateToMatchingTab,
  onNavigateToCheckTab,
  onNavigateToCheckIssueDetail,
  onNavigateToProposalReview,
  onNavigateToDataSemantics
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'history'>('overview');
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');
  
  // Modals
  const [showProposalModal, setShowProposalModal] = useState<boolean>(false);
  const [showOriginalDocModal, setShowOriginalDocModal] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [usageSearch, setUsageSearch] = useState<string>('');

  // Change Proposal Form State
  const [proposalReason, setProposalReason] = useState<string>('上游部分新型微服务使用 VARCHAR 存储标准时间，建议扩充格式兼容性。');
  const [proposalType, setProposalType] = useState<'MODIFY_REQUIREMENT' | 'EXPAND_FORMAT' | 'DEPRECATE'>('EXPAND_FORMAT');

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setShowProposalModal(false);
    addToast?.(
      'success',
      '标准变更提议已提交',
      '提议已提交至数据标准委员会评审队列，标准将保持 V3 生效直到新版本裁决发布。'
    );
    if (onNavigateToProposalReview) {
      onNavigateToProposalReview();
    }
  };

  const filteredUsage = USAGE_FIELDS_DATA.filter(item => 
    item.field.toLowerCase().includes(usageSearch.toLowerCase()) ||
    item.table.toLowerCase().includes(usageSearch.toLowerCase()) ||
    item.ds.toLowerCase().includes(usageSearch.toLowerCase())
  );

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
            className={`w-[#192px] px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
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
            className={`w-[#192px] px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
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
              addToast?.('info', '数据质量', '进入企业数据质量监控与规则治理视图');
            }}
            className={`w-[#192px] px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
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
            className={`w-[#192px] px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
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
            className={`w-[#192px] px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
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
            className="w-[#192px] px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]"
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
        {/* PAGE HEADER: Breadcrumb + Standard Identity + Tabs        */}
        {/* ========================================================= */}
        <div className="bg-white border-b border-[#E6EAF0] px-6 pt-3.5 pb-0 shrink-0 shadow-2xs">
          
          {/* Breadcrumb & Back action */}
          <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-2">
            <button
              onClick={onNavigateBackToCatalog}
              className="hover:text-[#2563EB] flex items-center space-x-1 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回标准库</span>
            </button>
            <span>/</span>
            <span>标准库</span>
            <span>/</span>
            <span className="font-semibold text-[#172033]">业务办结时间</span>
          </div>

          {/* Identity Block & Action Row */}
          <div className="flex items-start justify-between pb-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-extrabold text-[#172033] tracking-tight">
                  业务办结时间
                </h1>
                <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-md">
                  数据元
                </span>
                <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-bold rounded-md flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>生效中</span>
                </span>
                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-xs font-mono font-bold rounded-md">
                  V3
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-[#64748B]">
                <span className="font-mono text-[#2563EB] font-bold">DE_CASE_CLOSE_TIME</span>
                <span>•</span>
                <span className="text-[#334155] font-medium">
                  业务事项实际完成办理的时间点。
                </span>
              </div>
            </div>

            {/* Top-Right Action Buttons */}
            <div className="flex items-center space-x-2 relative">
              <button
                onClick={() => setShowProposalModal(true)}
                className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              >
                <GitPullRequest className="w-3.5 h-3.5" />
                <span>提出变更</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-1.5 border border-[#E6EAF0] hover:bg-[#F8FAFC] text-[#64748B] rounded-md transition-all cursor-pointer"
                  title="更多操作"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-9 w-44 bg-white border border-[#E6EAF0] rounded-lg shadow-lg p-1.5 z-30 text-xs space-y-0.5">
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setActiveTab('usage');
                      }}
                      className="w-full px-3 py-1.5 text-left text-[#334155] hover:bg-[#F1F5F9] rounded-md cursor-pointer flex items-center space-x-2"
                    >
                      <Table className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>查看使用情况</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowOriginalDocModal(true);
                      }}
                      className="w-full px-3 py-1.5 text-left text-[#334155] hover:bg-[#F1F5F9] rounded-md cursor-pointer flex items-center space-x-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>查看标准依据</span>
                    </button>
                    <div className="border-t border-[#E6EAF0] my-1" />
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        addToast?.('error', '无法直接废止', '正式企业数据元标准不可直接下线，需通过“提出变更”并经标准委员会审批后废止。');
                      }}
                      className="w-full px-3 py-1.5 text-left text-[#BE123C] hover:bg-[#FFF1F2] rounded-md cursor-pointer flex items-center space-x-2"
                    >
                      <XSquare className="w-3.5 h-3.5" />
                      <span>废止标准申请</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail Tabs (Strictly 3 tabs) */}
          <div className="flex space-x-8 text-xs font-medium border-t border-[#F1F5F9] pt-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#2563EB] text-[#2563EB] font-bold'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'usage'
                  ? 'border-[#2563EB] text-[#2563EB] font-bold'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <span>使用情况</span>
              <span className="px-1.5 py-0.2 bg-[#F1F5F9] text-[#64748B] text-[10px] rounded font-mono font-bold">
                126
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'border-[#2563EB] text-[#2563EB] font-bold'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <span>版本历史</span>
              <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[10px] rounded font-mono font-bold">
                V3
              </span>
            </button>
          </div>

        </div>

        {/* ========================================================= */}
        {/* TAB 1: 概览 (OVERVIEW) · 整合一体化规范面板 + 右侧摘要     */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="flex-1 flex overflow-hidden p-5 gap-5 max-w-[1680px] w-full mx-auto">
            
            {/* ----------------------------------------------------- */}
            {/* MAIN CONTENT AREA (~70%) - 一体化整合标准规范体        */}
            {/* ----------------------------------------------------- */}
            <div className="w-[70%] overflow-y-auto space-y-4 pr-1">
              
              {/* Consolidated Specification Panel (标准规范主体卡片) */}
              <div className="bg-white border border-[#E6EAF0] rounded-lg shadow-2xs divide-y divide-[#E6EAF0]">
                
                {/* 01 · 标准定义与基本元信息 */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
                      <FileCheck className="w-4 h-4 text-[#2563EB]" />
                      <span>标准定义与元数据</span>
                    </h2>
                    <span className="text-[11px] text-[#64748B]">核心数据元规范</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs leading-relaxed text-[#334155]">
                    业务事项在完成全部规定办理动作后形成的实际完成时间点，用于表达业务事项生命周期的办结时刻。
                  </div>

                  {/* 2-Column Key-Value Grid */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs pt-1">
                    <div className="space-y-0.5">
                      <span className="text-[#64748B] text-[11px] block">标准名称</span>
                      <strong className="text-[#172033] font-bold">业务办结时间</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#64748B] text-[11px] block">标准编码</span>
                      <strong className="text-[#2563EB] font-mono font-bold">DE_CASE_CLOSE_TIME</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#64748B] text-[11px] block">标准类型</span>
                      <strong className="text-[#172033] font-bold">数据元标准 (Data Element)</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#64748B] text-[11px] block">当前生效版本</span>
                      <strong className="text-[#172033] font-mono font-bold">V3 (2026-06-18 发布)</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#64748B] text-[11px] block">Owner (管理团队)</span>
                      <strong className="text-[#172033] font-bold">数据标准管理组 · 治理中心</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#64748B] text-[11px] block">上一有效版本</span>
                      <strong className="text-[#64748B] font-mono font-bold">V2 (2025-11-04 归档)</strong>
                    </div>
                  </div>
                </div>

                {/* 02 · 标准技术要求基线 (Sleek Compact Spec Strip) */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-[#2563EB]" />
                      <span>标准要求 (技术约束基线)</span>
                    </h2>
                    <span className="text-[11px] text-[#64748B]">生产物理字段合规校验基准</span>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {/* Data Type */}
                    <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-0.5">
                      <span className="text-[11px] text-[#64748B] block">数据类型</span>
                      <strong className="text-sm font-extrabold font-mono text-[#2563EB] block">
                        DATETIME
                      </strong>
                      <span className="text-[10px] text-[#94A3B8]">标准时间类型</span>
                    </div>

                    {/* Format */}
                    <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-0.5">
                      <span className="text-[11px] text-[#64748B] block">格式规范</span>
                      <strong className="text-[11px] font-extrabold font-mono text-[#172033] block truncate" title="yyyy-MM-dd HH:mm:ss">
                        yyyy-MM-dd HH:mm:ss
                      </strong>
                      <span className="text-[10px] text-[#94A3B8]">24小时秒级精度</span>
                    </div>

                    {/* Allow Null */}
                    <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-0.5">
                      <span className="text-[11px] text-[#64748B] block">允许为空</span>
                      <strong className="text-sm font-extrabold text-[#BE123C] block">
                        否 (NOT NULL)
                      </strong>
                      <span className="text-[10px] text-[#94A3B8]">归档必须具备时刻</span>
                    </div>

                    {/* Time Zone */}
                    <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-0.5">
                      <span className="text-[11px] text-[#64748B] block">时区基准</span>
                      <strong className="text-sm font-extrabold font-mono text-[#172033] block">
                        Asia/Shanghai
                      </strong>
                      <span className="text-[10px] text-[#94A3B8]">UTC+08:00 北京时间</span>
                    </div>
                  </div>
                </div>

                {/* 03 · 业务上下文与语义关联 */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
                      <Link className="w-4 h-4 text-[#2563EB]" />
                      <span>业务上下文 (Semantic Linkage)</span>
                    </h2>
                    <span className="text-[11px] text-[#64748B]">模型与术语体系对齐</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Related Business Term */}
                    <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#64748B]">关联业务术语</span>
                        <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold rounded">
                          已绑定
                        </span>
                      </div>
                      <strong
                        className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-1"
                        onClick={() => onNavigateToDataSemantics?.()}
                      >
                        <span>办结时间</span>
                        <ArrowRight className="w-3 h-3" />
                      </strong>
                      <p className="text-[11px] text-[#64748B] leading-tight">
                        业务含义：业务事项完成全部审批或处理并正式归档的时间。
                      </p>
                    </div>

                    {/* Related Business Object */}
                    <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#64748B]">关联业务对象与属性</span>
                        <span className="px-1.5 py-0.2 bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold rounded">
                          核心主实体
                        </span>
                      </div>
                      <strong
                        className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-1"
                        onClick={() => onNavigateToDataSemantics?.()}
                      >
                        <span>工单 · 办结时间</span>
                        <ArrowRight className="w-3 h-3" />
                      </strong>
                      <p className="text-[11px] text-[#64748B] leading-tight">
                        实体模型：公共服务热线及诉求工单生命周期最终态属性。
                      </p>
                    </div>

                    {/* Business Domain */}
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">所属业务域</span>
                        <strong className="text-xs font-bold text-[#172033]">公共服务 (Public Service)</strong>
                      </div>
                      <span className="px-2 py-0.5 bg-white border border-[#CBD5E1] text-[#334155] text-[11px] font-bold rounded">
                        域主标准
                      </span>
                    </div>

                    {/* Semantic Type */}
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">语义原子类型</span>
                        <strong className="text-xs font-bold text-[#172033]">事件时间 (Event Timestamp)</strong>
                      </div>
                      <span className="px-2 py-0.5 bg-white border border-[#CBD5E1] text-[#334155] text-[11px] font-bold rounded">
                        时序语义
                      </span>
                    </div>
                  </div>
                </div>

                {/* 04 · 标准依据 (Grounding Authority Reference) */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-[#059669]" />
                      <span>标准依据 (Authority Reference)</span>
                    </h2>
                    <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded text-[11px] font-bold">
                      国家标准溯源认证
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.2 bg-[#059669] text-white text-[10px] font-bold rounded">
                          国家标准
                        </span>
                        <strong className="text-xs font-bold text-[#172033]">
                          《公共服务基础数据元规范》
                        </strong>
                        <span className="font-mono text-[11px] text-[#64748B]">GB/T XXXXX—2026</span>
                      </div>

                      <div className="flex items-center space-x-4 text-[11px] text-[#64748B]">
                        <span>发布机构：<strong className="text-[#172033]">国家数据标准委员会</strong></span>
                        <span>生效日期：<strong className="text-[#172033]">2026-01-01</strong></span>
                        <span className="text-[#2563EB] font-semibold">条目：第 5.3.7 条 (P126)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowOriginalDocModal(true)}
                      className="px-3 py-1.5 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold text-xs rounded-md transition-all shadow-2xs cursor-pointer flex items-center space-x-1 shrink-0"
                    >
                      <span>查看原文依据</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* ----------------------------------------------------- */}
            {/* RIGHT SUMMARY AREA (~30%) - 紧凑侧栏模块                */}
            {/* ----------------------------------------------------- */}
            <div className="w-[30%] space-y-4 overflow-y-auto shrink-0 pr-1">
              
              {/* Card 1: 使用情况 (Usage Summary) */}
              <div className="bg-white border border-[#E6EAF0] rounded-lg p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
                  <h3 className="text-xs font-bold text-[#172033] flex items-center space-x-1.5">
                    <Table className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>资产使用情况</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('usage')}
                    className="text-[11px] text-[#2563EB] hover:underline font-bold cursor-pointer inline-flex items-center space-x-0.5"
                  >
                    <span>查看清单</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-extrabold text-[#172033] font-mono">126</span>
                    <span className="text-xs font-bold text-[#64748B]">个物理字段</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    分布于 <strong>8 个数据源</strong> · <strong>23 张业务表</strong> · <strong>3 个业务对象</strong>
                  </p>
                </div>

                {/* Sample Linked Assets List */}
                <div className="space-y-1 pt-0.5">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">
                    典型绑定资产
                  </span>

                  {[
                    { asset: 'population_service.case_record.close_time', compliant: false },
                    { asset: 'hotline_db.case_record.finish_time', compliant: true },
                    { asset: 'gov_service_hub.service_case.completed_at', compliant: true }
                  ].map((sample, idx) => (
                    <div key={idx} className="p-1.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-[#334155] truncate max-w-[190px]" title={sample.asset}>
                        {sample.asset}
                      </span>
                      {sample.compliant ? (
                        <span className="text-[10px] text-[#059669] font-bold shrink-0">合规</span>
                      ) : (
                        <span className="text-[10px] text-[#BE123C] font-bold shrink-0">待诊断</span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab('usage')}
                  className="w-full py-1.5 bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#2563EB] border border-[#E6EAF0] rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <span>进入使用情况 (126) →</span>
                </button>
              </div>

              {/* Card 2: 最近标准检查 (Latest Standard Check) */}
              <div className="bg-white border border-[#E6EAF0] rounded-lg p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
                  <h3 className="text-xs font-bold text-[#172033] flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>最近标准检查</span>
                  </h3>
                  <span className="text-[10px] text-[#94A3B8]">
                    08-12 03:20
                  </span>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-md">
                    <span className="text-base font-bold font-mono text-[#059669] block">115</span>
                    <span className="text-[10px] font-bold text-[#047857]">符合</span>
                  </div>

                  <div className="p-2 bg-[#FEF3C7] border border-[#FDE68A] rounded-md">
                    <span className="text-base font-bold font-mono text-[#D97706] block">7</span>
                    <span className="text-[10px] font-bold text-[#B45309]">不符合</span>
                  </div>

                  <div className="p-2 bg-[#F1F5F9] border border-[#CBD5E1] rounded-md">
                    <span className="text-base font-bold font-mono text-[#64748B] block">4</span>
                    <span className="text-[10px] font-bold text-[#475569]">待定</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  发现 7 个字段存在数据类型不符或非空率不满足要求（如 close_time 改为 VARCHAR）。
                </p>

                <button
                  onClick={() => {
                    if (onNavigateToCheckIssueDetail) {
                      onNavigateToCheckIssueDetail();
                    } else if (onNavigateToCheckTab) {
                      onNavigateToCheckTab();
                    }
                  }}
                  className="w-full py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 shadow-2xs"
                >
                  <Search className="w-3 h-3" />
                  <span>查看标准检查诊断与决策 →</span>
                </button>
              </div>

              {/* Card 3: Xino AI Insight Banner */}
              <div className="p-3.5 bg-linear-to-br from-[#EEF2FF] to-[#F5F3FF] border border-[#C7D2FE] rounded-lg space-y-1.5 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-[#4F46E5]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Xino 智能匹配提示</span>
                </div>

                <p className="text-[11px] text-[#312E81] leading-relaxed">
                  近期探查发现 <strong>18 个新增字段</strong> 与“业务办结时间”高度匹配，其中 <strong>4 个尚未确认</strong>。
                </p>

                <button
                  onClick={() => onNavigateToMatchingTab?.()}
                  className="text-[11px] text-[#4F46E5] hover:underline font-bold cursor-pointer inline-flex items-center space-x-0.5 pt-0.5"
                >
                  <span>查看待确认匹配队列 →</span>
                </button>
              </div>

              {/* Version Note */}
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[10px] text-[#64748B] space-y-0.5">
                <div className="flex justify-between">
                  <span>当前版本：<strong className="text-[#172033] font-mono">V3</strong></span>
                  <span>发布时间：<strong className="text-[#172033]">2026-06-18</strong></span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>上一版本：V2 (2025-11)</span>
                  <span>维护人：数据标准管理组</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 使用情况 (USAGE)                                   */}
        {/* ========================================================= */}
        {activeTab === 'usage' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-[1600px] w-full mx-auto space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-[#E6EAF0]">
              <div>
                <h2 className="text-sm font-bold text-[#172033]">
                  已匹配与使用的物理数据资产 (126 个字段)
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  展示企业全域已映射至【业务办结时间 DE_CASE_CLOSE_TIME · V3】的字段及其实时合规状态。
                </p>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2" />
                  <input
                    type="text"
                    value={usageSearch}
                    onChange={(e) => setUsageSearch(e.target.value)}
                    placeholder="搜索库名 / 表名 / 字段名..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-xs focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <button
                  onClick={() => addToast?.('info', '导出报告', '正在导出 126 个标准关联字段合规清单 CSV...')}
                  className="px-3 py-1.5 bg-white border border-[#CBD5E1] text-[#334155] rounded-md text-xs font-bold hover:bg-[#F8FAFC] cursor-pointer flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出清单</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E6EAF0] rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold">
                  <tr>
                    <th className="py-2.5 px-4">数据源 (Database)</th>
                    <th className="py-2.5 px-4">数据表 (Table)</th>
                    <th className="py-2.5 px-4">物理字段 (Field)</th>
                    <th className="py-2.5 px-3">数据类型</th>
                    <th className="py-2.5 px-3">非空率</th>
                    <th className="py-2.5 px-4">标准检查状态</th>
                    <th className="py-2.5 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAF0]">
                  {filteredUsage.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[#334155]">{row.ds}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#172033]">{row.table}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#2563EB]">{row.field}</td>
                      <td className="py-2.5 px-3 font-mono">{row.type}</td>
                      <td className="py-2.5 px-3 font-mono">{row.nonNullRate}</td>
                      <td className="py-2.5 px-4">
                        {row.status === 'COMPLIANT' ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {row.statusLabel}
                          </span>
                        ) : row.status === 'NON_COMPLIANT' ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {row.statusLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1] rounded text-[11px] font-bold">
                            <HelpCircle className="w-3 h-3 mr-1" />
                            {row.statusLabel}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {row.status === 'NON_COMPLIANT' ? (
                          <button
                            onClick={() => onNavigateToCheckIssueDetail?.()}
                            className="text-[#2563EB] hover:underline font-bold cursor-pointer"
                          >
                            诊断异常 →
                          </button>
                        ) : (
                          <button
                            onClick={() => addToast?.('info', '查看探查', `载入 ${row.table}.${row.field} 的 Profile 样本`)}
                            className="text-[#64748B] hover:text-[#172033] font-medium cursor-pointer"
                          >
                            查看探查
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 版本历史 (VERSION HISTORY)                         */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-[1100px] w-full mx-auto space-y-4">
            <div className="bg-white p-5 rounded-lg border border-[#E6EAF0] shadow-2xs space-y-5">
              <div>
                <h2 className="text-sm font-bold text-[#172033]">
                  标准全生命周期版本演进树 (Version Timeline)
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  企业数据标准每一次定义变动均生成不可逆的历史版本，确保数据资产质量溯源一致性。
                </p>
              </div>

              {/* Version List */}
              <div className="space-y-5 border-l-2 border-[#E6EAF0] ml-3 pl-5">
                
                {/* V3 Current */}
                <div className="relative space-y-1.5">
                  <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#2563EB] border-2 border-white shadow-xs" />
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-extrabold font-mono text-[#2563EB]">V3 (当前生效版本)</span>
                    <span className="px-1.5 py-0.2 bg-[#ECFDF5] text-[#059669] text-[10px] font-bold rounded border border-[#A7F3D0]">
                      生效中
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">2026-06-18 由 数据标准管理组 发布</span>
                  </div>
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md text-xs space-y-1.5">
                    <p className="font-bold text-[#1E40AF]">版本变更要点：</p>
                    <ul className="list-disc list-inside text-[#1E3A8A] space-y-0.5 text-[11px]">
                      <li>严格限制【允许为空】为“否”，要求工单办结必须具备合法时间戳。</li>
                      <li>对齐国家标准《公共服务基础数据元规范》GB/T XXXXX—2026 第 5.3.7 条。</li>
                      <li>统一标准时区基准为 Asia/Shanghai。</li>
                    </ul>
                  </div>
                </div>

                {/* V2 */}
                <div className="relative space-y-1.5">
                  <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#94A3B8] border-2 border-white" />
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-bold font-mono text-[#475569]">V2 (历史版本)</span>
                    <span className="px-1.5 py-0.2 bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold rounded">
                      已归档
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">2025-11-04 由 业务标准组 发布</span>
                  </div>
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[11px] space-y-0.5 text-[#64748B]">
                    <p>调整格式说明为 yyyy-MM-dd HH:mm:ss，原允许部分草稿库字段保留空值。</p>
                  </div>
                </div>

                {/* V1 */}
                <div className="relative space-y-1.5">
                  <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#CBD5E1] border-2 border-white" />
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-bold font-mono text-[#64748B]">V1 (初始创建)</span>
                    <span className="text-[11px] text-[#94A3B8]">2024-03-12 初始建立标准编码 DE_CASE_CLOSE_TIME</span>
                  </div>
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[11px] space-y-0.5 text-[#64748B]">
                    <p>首次发布公共服务域办结时间数据元标准规范。</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODAL: 提出变更 (CREATE CHANGE PROPOSAL)                  */}
      {/* ========================================================= */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[520px] bg-white rounded-lg shadow-2xl border border-[#E6EAF0] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <div className="flex items-center space-x-2">
                <GitPullRequest className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  提出数据标准变更提议 (Create Proposal)
                </h3>
              </div>
              <button
                onClick={() => setShowProposalModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-3.5 text-xs">
              <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md text-[#1E40AF] text-[11px]">
                🛡️ 正式企业标准无法直接篡改。提交变更后将生成 Proposal 工单并保留当前 V3 版本继续生效，待标准委员会审核通过后升级为 V4 版本。
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#172033] block">目标标准</label>
                <input
                  type="text"
                  disabled
                  value="业务办结时间 (DE_CASE_CLOSE_TIME · V3)"
                  className="w-full p-2 bg-[#F1F5F9] border border-[#CBD5E1] rounded-md text-[#64748B] font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#172033] block">提议变更类型</label>
                <select
                  value={proposalType}
                  onChange={(e: any) => setProposalType(e.target.value)}
                  className="w-full p-2 bg-white border border-[#CBD5E1] rounded-md text-[#172033] font-medium focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="EXPAND_FORMAT">扩充允许格式 (例如兼容 ISO8601 字符串)</option>
                  <option value="MODIFY_REQUIREMENT">修改约束条件 (例如调整允许为空或时区)</option>
                  <option value="DEPRECATE">提请废止该标准</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#172033] block">变更原因与支撑依据</label>
                <textarea
                  rows={3}
                  value={proposalReason}
                  onChange={(e) => setProposalReason(e.target.value)}
                  placeholder="详细描述为何现行 V3 标准需要调整、涉及的数据资产范围以及上游技术变动..."
                  className="w-full p-2 bg-white border border-[#CBD5E1] rounded-md text-[#172033] focus:border-[#2563EB] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2.5 border-t border-[#E6EAF0] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="px-3.5 py-1.5 bg-[#F1F5F9] text-[#334155] font-bold rounded-md cursor-pointer hover:bg-[#E2E8F0]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-md shadow-2xs cursor-pointer flex items-center space-x-1"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>提交变更申请</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: 查看原文依据 (ORIGINAL AUTHORITY DOCUMENT)         */}
      {/* ========================================================= */}
      {showOriginalDocModal && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-[620px] bg-white rounded-lg shadow-2xl border border-[#E6EAF0] p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#059669]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  国家标准原文依据 · 溯源快照
                </h3>
              </div>
              <button
                onClick={() => setShowOriginalDocModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed">
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex items-center justify-between">
                <div>
                  <strong className="text-xs text-[#172033] block">《公共服务基础数据元规范》</strong>
                  <span className="text-[#64748B] font-mono text-[11px]">GB/T XXXXX—2026 第 5.3.7 条 (P126)</span>
                </div>
                <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded font-bold text-[11px]">
                  官方认证溯源
                </span>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-[#334155] font-serif leading-normal space-y-1.5 text-xs">
                <p className="font-bold text-[#172033]">5.3.7 业务办结时间 (Case Close Time)</p>
                <p className="text-[11px] leading-relaxed">
                  【中文名称】业务办结时间<br />
                  【英文名称】Case Close Time<br />
                  【数据元定义】指公共政务服务事项、热线诉求等在经由受托单位完成规定承办、审核并正式向诉求人反馈闭环的时间点。<br />
                  【表示格式】DATETIME，采用 yyyy-MM-dd HH:mm:ss 格式表达。<br />
                  【值域要求】不得晚于当前系统时刻，归档记录必须具备非空值。
                </p>
              </div>

              <div className="text-[10px] text-[#94A3B8] flex justify-between pt-0.5">
                <span>来源发布机构：国家数据标准委员会</span>
                <span>认证版本验证戳：2026-01-01 / SHA256-AUTH-VERIFIED</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#E6EAF0] flex justify-end">
              <button
                onClick={() => setShowOriginalDocModal(false)}
                className="px-3.5 py-1.5 bg-[#2563EB] text-white font-bold rounded-md cursor-pointer text-xs"
              >
                已了解
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
