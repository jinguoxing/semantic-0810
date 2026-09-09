import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Table as TableIcon,
  Layers,
  FolderTree,
  BarChart3,
  Sparkles,
  BookOpen,
  Info,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  FileText,
  X
} from 'lucide-react';

export interface BusinessObjectResolutionWorkspaceProps {
  onBackToDataSemantics?: () => void;
  onNavigateToObjectsList?: () => void;
  onCreateNewObject?: () => void;
  onPostpone?: () => void;
  onConfirmResolution?: (selectedObject: 'service_ticket' | 'hotline_ticket') => void;
  onSwitchToResolveDataSupport?: () => void;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const BusinessObjectResolutionWorkspace: React.FC<BusinessObjectResolutionWorkspaceProps> = ({
  onBackToDataSemantics,
  onNavigateToObjectsList,
  onCreateNewObject,
  onPostpone,
  onConfirmResolution,
  onSwitchToResolveDataSupport,
  addToast
}) => {
  // Candidate selection state: user has selected 'service_ticket' ("服务工单"), can toggle to 'hotline_ticket' ("热线工单")
  const [selectedCandidate, setSelectedCandidate] = useState<'service_ticket' | 'hotline_ticket'>('service_ticket');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Modals/Drawers (closed by default in initial screenshot state)
  const [activeDefinitionModal, setActiveDefinitionModal] = useState<'service_ticket' | 'hotline_ticket' | null>(null);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [isDataSemanticsModalOpen, setIsDataSemanticsModalOpen] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    // Simulates enterprise multi-point semantic validation (BO version, Data Semantics version, non-conflict, gates, permissions)
    setTimeout(() => {
      setIsSubmitting(false);
      addToast?.(
        'success',
        '业务对象对齐已确认',
        '业务对象对齐已确认，数据支撑已建立。'
      );
      if (onConfirmResolution) {
        onConfirmResolution(selectedCandidate);
      } else if (onBackToDataSemantics) {
        onBackToDataSemantics();
      }
    }, 400);
  };

  const handlePostponeClick = () => {
    addToast?.(
      'info',
      '已保留对齐任务',
      '公共服务热线工单记录表的业务对象对齐状态已保留，您可随时在任务中心或数据语义工作台中继续处理。'
    );
    if (onPostpone) {
      onPostpone();
    } else if (onBackToDataSemantics) {
      onBackToDataSemantics();
    }
  };

  const handleSkipThisRound = () => {
    setIsMoreMenuOpen(false);
    addToast?.(
      'info',
      '本轮不建立对象关联',
      '已标记此数据资产在本轮语义沉淀中暂不建立业务对象实现关系。'
    );
    if (onBackToDataSemantics) {
      onBackToDataSemantics();
    }
  };

  return (
    <div className="flex-1 flex min-h-0 bg-[#F8FAFC] text-[#0F172A] font-sans antialiased relative select-none">
      
      {/* ========================================================= */}
      {/* 1. FOCUSED WORK SHELL: 64px NARROW SECONDARY NAV RAIL     */}
      {/* ========================================================= */}
      <aside className="w-16 shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col items-center py-4 space-y-4 select-none z-20">
        {/* Back action: back to data semantics / assets list */}
        <button
          onClick={onBackToDataSemantics}
          className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          title="返回数据语义"
          aria-label="返回数据语义"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-8 h-px bg-[#E2E8F0]" />

        {/* 1. 业务对象 (Active) */}
        <div className="relative group">
          <button
            onClick={onNavigateToObjectsList}
            className="w-10 h-10 rounded-md flex items-center justify-center bg-[#EFF6FF] text-[#2563EB] font-medium border border-[#BFDBFE] transition-colors cursor-pointer"
            aria-label="业务对象"
          >
            <FolderTree className="w-5 h-5" />
          </button>
          {/* Tooltip on hover */}
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            业务对象 (当前聚焦)
          </div>
        </div>

        {/* 2. 标准指标 */}
        <div className="relative group">
          <button
            onClick={() => addToast?.('info', '标准指标', '企业标准指标目录')}
            className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="标准指标"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            标准指标
          </div>
        </div>

        {/* 3. 数据语义 */}
        <div className="relative group">
          <button
            onClick={onBackToDataSemantics}
            className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="数据语义"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            数据语义
          </div>
        </div>

        {/* 4. 数据标准 */}
        <div className="relative group">
          <button
            onClick={() => addToast?.('info', '数据标准', '企业数据元与值域标准体系')}
            className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="数据标准"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            数据标准
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN DECISION WORKSPACE AREA                           */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        
        {/* ======================================================= */}
        {/* PAGE HEADER: BREADCRUMB, TITLE, ASSET INFO, ACTIONS     */}
        {/* ======================================================= */}
        <header className="bg-white border-b border-[#E2E8F0] px-8 py-4 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 min-w-0">
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 text-xs text-[#64748B]" aria-label="Breadcrumb">
                <span className="hover:text-[#0F172A] transition-colors cursor-pointer" onClick={onNavigateToObjectsList}>
                  业务语义
                </span>
                <span className="text-[#CBD5E1]">/</span>
                <span className="hover:text-[#0F172A] transition-colors cursor-pointer" onClick={onBackToDataSemantics}>
                  数据语义
                </span>
                <span className="text-[#CBD5E1]">/</span>
                <span className="text-[#475569] font-medium truncate max-w-[200px]">
                  公共服务热线工单记录表
                </span>
                <span className="text-[#CBD5E1]">/</span>
                <span className="text-[#0F172A] font-semibold">业务对象对齐</span>
              </nav>

              {/* Title & Subtitle */}
              <div className="flex items-baseline space-x-3 pt-0.5">
                <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
                  业务对象对齐
                </h1>
                <span className="text-xs font-medium text-[#94A3B8] tracking-normal font-sans">
                  Business Object Resolution
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-[#64748B] max-w-3xl">
                根据当前有效数据语义，确认这份数据应采用哪个正式业务对象定义。
              </p>

              {/* Current Data Asset Badge Row */}
              <div className="flex items-center space-x-3 pt-2">
                <div className="flex items-center space-x-1.5 text-xs text-[#334155] font-semibold">
                  <TableIcon className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>公共服务热线工单记录表</span>
                </div>
                <span className="text-[#CBD5E1]">·</span>
                <span className="font-mono text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  hotline_db.service.pop_service_hotline
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                  数据语义已确认
                </span>
              </div>
            </div>

            {/* Top Right Action: 切换工作台 & 稍后处理 */}
            <div className="flex items-center space-x-3 shrink-0 pt-1">
              {onSwitchToResolveDataSupport && (
                <button
                  id="btn-switch-to-data-support"
                  onClick={onSwitchToResolveDataSupport}
                  className="px-3 py-1.5 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1.5"
                  title="切换至自上而下的「发现数据支撑」工作台"
                >
                  <span>🔍 发现数据支撑工作台</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handlePostponeClick}
                className="px-3.5 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-md transition-colors cursor-pointer"
              >
                稍后处理
              </button>
            </div>
          </div>
        </header>

        {/* ======================================================= */}
        {/* 3. THREE-COLUMN DECISION WORKSPACE                     */}
        {/* Left ~24% | Middle ~50% | Right ~26%                    */}
        {/* Separated by gentle whitespace and subtle borders       */}
        {/* ======================================================= */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {/* ===================================================== */}
          {/* LEFT COLUMN: 当前数据 (Current Data Facts) ~24%       */}
          {/* ===================================================== */}
          <section className="w-[24%] min-w-[280px] max-w-[340px] bg-white border-r border-[#E2E8F0] flex flex-col min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6 flex-1">
              
              {/* Header */}
              <div className="space-y-1 border-b border-[#F1F5F9] pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                    当前数据
                  </h2>
                  <span className="text-[11px] font-medium text-[#64748B] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                    Table · MySQL
                  </span>
                </div>
                <div className="pt-1">
                  <div className="text-xs font-semibold text-[#1E293B]">
                    公共服务热线工单记录表
                  </div>
                  <div className="font-mono text-[11px] text-[#64748B] truncate mt-0.5" title="hotline_db.service.pop_service_hotline">
                    hotline_db.service.pop_service_hotline
                  </div>
                </div>
              </div>

              {/* 4 Core Facts (Description List, not cards) */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  已确认核心事实
                </div>

                <dl className="space-y-3.5 text-xs">
                  {/* Fact 1: 记录主体 */}
                  <div className="space-y-0.5">
                    <dt className="text-[#64748B] font-medium">记录主体</dt>
                    <dd className="text-[#0F172A] font-semibold flex items-center space-x-1.5">
                      <span>服务工单</span>
                    </dd>
                  </div>

                  {/* Fact 2: 记录粒度 */}
                  <div className="space-y-0.5">
                    <dt className="text-[#64748B] font-medium">记录粒度</dt>
                    <dd className="text-[#0F172A] font-medium">
                      一行一张服务工单
                    </dd>
                  </div>

                  {/* Fact 3: 实例身份 */}
                  <div className="space-y-0.5">
                    <dt className="text-[#64748B] font-medium">实例身份</dt>
                    <dd className="text-[#0F172A] font-medium flex items-center space-x-1.5">
                      <span>工单编号</span>
                      <span className="text-[#94A3B8]">·</span>
                      <span className="font-mono text-[#475569] text-[11px] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                        ticket_id
                      </span>
                    </dd>
                  </div>

                  {/* Fact 4: 业务范围 */}
                  <div className="space-y-0.5">
                    <dt className="text-[#64748B] font-medium">业务范围</dt>
                    <dd className="text-[#0F172A] font-medium">
                      公共服务热线渠道
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Confirmed Semantics Summary */}
              <div className="pt-2 border-t border-[#F1F5F9] space-y-4">
                <div className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  已确认语义摘要
                </div>

                {/* Confirmed Field Semantics */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-[#64748B] font-medium">
                    已确认字段语义
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['处理状态', '创建时间', '受理时间', '办结时间'].map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Confirmed Relationship Semantics */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-[#64748B] font-medium">
                    已确认关系语义
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['申请人', '承办部门', '所属区域'].map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Left Column Bottom: 查看当前数据语义 */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] shrink-0">
              <button
                onClick={() => setIsDataSemanticsModalOpen(true)}
                className="w-full py-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer"
              >
                <span>查看当前数据语义</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

          {/* ===================================================== */}
          {/* MIDDLE COLUMN: 选择正式业务对象 (~50%)                 */}
          {/* ===================================================== */}
          <section className="flex-1 min-w-0 bg-white border-r border-[#E2E8F0] flex flex-col min-h-0 overflow-y-auto">
            <div className="p-7 space-y-6 flex-1">
              
              {/* Middle Header */}
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  选择正式业务对象
                </h2>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  当前数据可能同时符合以下正式业务对象，需要确认本次应采用哪一套企业业务定义。
                </p>
              </div>

              {/* Callout: 当前需要判断 (Restrained, calm light amber prompt) */}
              <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span className="text-xs font-bold text-[#92400E]">
                    当前需要判断
                  </span>
                </div>
                <div className="text-xs text-[#78350F] font-medium leading-relaxed pl-6">
                  这份热线渠道数据，应采用企业统一的“服务工单”定义，还是采用独立的“热线工单”定义？
                </div>
                <div className="text-[11px] text-[#A16207] pl-6">
                  当前没有可直接套用的企业采用规则，Semovix 不替用户默认决定。
                </div>
              </div>

              {/* =================================================== */}
              {/* UNIFIED DUAL-COLUMN DIFFERENCE PANEL                */}
              {/* Side-by-side comparison of Service Ticket & Hotline */}
              {/* =================================================== */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  候选对象与关键差异比较
                </div>

                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden divide-y divide-[#E2E8F0]">
                  
                  {/* Candidates Top Selection Row */}
                  <div className="grid grid-cols-2 divide-x divide-[#E2E8F0] bg-[#F8FAFC]">
                    
                    {/* Left Candidate: 服务工单 (Selected) */}
                    <div 
                      onClick={() => setSelectedCandidate('service_ticket')}
                      className={`p-4 transition-all cursor-pointer ${
                        selectedCandidate === 'service_ticket'
                          ? 'bg-[#F0F7FF] border-t-2 border-t-[#2563EB]'
                          : 'hover:bg-white border-t-2 border-t-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="radio"
                            name="bo_candidate"
                            id="candidate_service_ticket"
                            checked={selectedCandidate === 'service_ticket'}
                            onChange={() => setSelectedCandidate('service_ticket')}
                            className="w-4 h-4 text-[#2563EB] border-[#CBD5E1] focus:ring-[#2563EB] cursor-pointer"
                          />
                          <div>
                            <label htmlFor="candidate_service_ticket" className="text-sm font-bold text-[#0F172A] cursor-pointer">
                              服务工单
                            </label>
                            <span className="ml-1.5 text-xs text-[#64748B] font-normal">
                              Service Ticket
                            </span>
                          </div>
                        </div>

                        {selectedCandidate === 'service_ticket' && (
                          <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded">
                            已选择
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-[#64748B]">
                        <span className="inline-flex items-center text-[11px] text-[#475569]">
                          已发布 · 公共服务
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDefinitionModal('service_ticket');
                          }}
                          className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                        >
                          查看完整定义
                        </button>
                      </div>
                    </div>

                    {/* Right Candidate: 热线工单 (Unselected) */}
                    <div 
                      onClick={() => setSelectedCandidate('hotline_ticket')}
                      className={`p-4 transition-all cursor-pointer ${
                        selectedCandidate === 'hotline_ticket'
                          ? 'bg-[#F0F7FF] border-t-2 border-t-[#2563EB]'
                          : 'hover:bg-white border-t-2 border-t-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="radio"
                            name="bo_candidate"
                            id="candidate_hotline_ticket"
                            checked={selectedCandidate === 'hotline_ticket'}
                            onChange={() => setSelectedCandidate('hotline_ticket')}
                            className="w-4 h-4 text-[#2563EB] border-[#CBD5E1] focus:ring-[#2563EB] cursor-pointer"
                          />
                          <div>
                            <label htmlFor="candidate_hotline_ticket" className="text-sm font-bold text-[#0F172A] cursor-pointer">
                              热线工单
                            </label>
                            <span className="ml-1.5 text-xs text-[#64748B] font-normal">
                              Hotline Ticket
                            </span>
                          </div>
                        </div>

                        {selectedCandidate === 'hotline_ticket' && (
                          <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded">
                            已选择
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-[#64748B]">
                        <span className="inline-flex items-center text-[11px] text-[#475569]">
                          已发布 · 热线服务
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDefinitionModal('hotline_ticket');
                          }}
                          className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                        >
                          查看完整定义
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Dimension 1: 业务定义 */}
                  <div className="p-4 bg-white">
                    <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                      业务定义
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-xs text-[#1E293B]">
                      <div className="leading-relaxed">
                        跨热线、线上、窗口等公共服务渠道统一管理的服务工单。
                      </div>
                      <div className="leading-relaxed text-[#475569]">
                        专门描述公共服务热线渠道形成和流转的工单。
                      </div>
                    </div>
                  </div>

                  {/* Comparison Dimension 2: 主体标识 */}
                  <div className="p-4 bg-[#FAFAFA]">
                    <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                      主体标识
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-xs">
                      <div className="font-semibold text-[#0F172A]">
                        工单编号
                      </div>
                      <div className="font-medium text-[#475569]">
                        热线工单编号
                      </div>
                    </div>
                  </div>

                  {/* Comparison Dimension 3: 业务范围 */}
                  <div className="p-4 bg-white">
                    <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                      业务范围
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-xs">
                      <div className="text-[#1E293B] leading-relaxed">
                        统一公共服务工单范围，允许不同渠道数据形成不同数据实现。
                      </div>
                      <div className="text-[#475569] leading-relaxed">
                        只面向公共服务热线渠道。
                      </div>
                    </div>
                  </div>

                  {/* Comparison Dimension 4: 核心关系关注点 */}
                  <div className="p-4 bg-[#FAFAFA]">
                    <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                      核心关系关注点
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-white text-[#1E293B] border border-[#E2E8F0] font-medium">申请人</span>
                        <span className="px-2 py-0.5 rounded bg-white text-[#1E293B] border border-[#E2E8F0] font-medium">承办部门</span>
                        <span className="px-2 py-0.5 rounded bg-white text-[#1E293B] border border-[#E2E8F0] font-medium">所属区域</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-white text-[#475569] border border-[#E2E8F0]">来电人</span>
                        <span className="px-2 py-0.5 rounded bg-white text-[#475569] border border-[#E2E8F0]">受理坐席</span>
                        <span className="px-2 py-0.5 rounded bg-white text-[#475569] border border-[#E2E8F0]">承办部门</span>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Dimension 5: 采用后的含义 */}
                  <div className="p-4 bg-white">
                    <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                      采用后的含义
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-xs">
                      <div className="text-[#0F172A] leading-relaxed font-medium">
                        当前数据将成为“服务工单”在公共服务热线范围内的一套数据实现。
                      </div>
                      <div className="text-[#475569] leading-relaxed">
                        当前数据将成为“热线工单”的正式数据实现。
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Status Line: Current Selection State */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[#64748B]">当前选择：</span>
                  <span className="font-bold text-[#0F172A]">
                    {selectedCandidate === 'service_ticket' ? '服务工单' : '热线工单'}
                  </span>
                </div>
                <div className="text-xs text-[#64748B]">
                  状态说明：<span className="text-[#475569] font-medium">已选择目标业务对象，尚未提交正式对齐。</span>
                </div>
              </div>

            </div>
          </section>

          {/* ===================================================== */}
          {/* RIGHT COLUMN: 本次对齐 (~26%)                          */}
          {/* ===================================================== */}
          <section className="w-[26%] min-w-[300px] max-w-[380px] bg-white flex flex-col min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6 flex-1">
              
              {/* Header */}
              <div className="space-y-1.5 border-b border-[#F1F5F9] pb-4">
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                  本次对齐
                </h2>

                <div className="pt-1 space-y-2">
                  <div>
                    <div className="text-[11px] text-[#64748B] font-medium">目标业务对象</div>
                    <div className="text-sm font-bold text-[#0F172A] flex items-center space-x-1.5">
                      <span>{selectedCandidate === 'service_ticket' ? '服务工单' : '热线工单'}</span>
                      <span className="text-xs font-normal text-[#64748B]">
                        {selectedCandidate === 'service_ticket' ? 'Service Ticket' : 'Hotline Ticket'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#64748B] font-medium">当前数据范围</div>
                    <div className="text-xs text-[#334155] font-medium">
                      公共服务热线渠道
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#64748B] font-medium">拟建立关系</div>
                    <div className="text-xs text-[#1E293B] bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] leading-relaxed">
                      公共服务热线工单记录表 作为“{selectedCandidate === 'service_ticket' ? '服务工单' : '热线工单'}”的一套数据实现
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-section: 数据实现条件 (4 Gate Rows) */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  数据实现条件
                </div>

                <div className="space-y-2 text-xs">
                  {/* Gate 1: 主体 */}
                  <div className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFA] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A]">主体</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                        一致
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-normal">
                      当前数据记录的主体符合“{selectedCandidate === 'service_ticket' ? '服务工单' : '热线工单'}”。
                    </p>
                  </div>

                  {/* Gate 2: 粒度 */}
                  <div className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFA] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A]">粒度</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                        一致
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-normal">
                      当前一行能够表示一张{selectedCandidate === 'service_ticket' ? '服务工单' : '热线工单'}。
                    </p>
                  </div>

                  {/* Gate 3: 身份 */}
                  <div className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFA] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A]">身份</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                        已核验
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-normal">
                      ticket_id 能够承载当前实现中的工单身份。
                    </p>
                  </div>

                  {/* Gate 4: 适用范围 */}
                  <div className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFA] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A]">适用范围</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                        已明确
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-normal">
                      当前实现只覆盖公共服务热线渠道。
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-section: 本次将建立 */}
              <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
                <div className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  本次将建立
                </div>

                <div className="space-y-3 text-xs">
                  {/* Basic meta */}
                  <div className="space-y-1 bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0] text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">数据实现：</span>
                      <span className="text-[#1E293B] font-medium">公共服务热线工单记录表</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">业务对象：</span>
                      <span className="text-[#1E293B] font-medium">{selectedCandidate === 'service_ticket' ? '服务工单' : '热线工单'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">适用范围：</span>
                      <span className="text-[#1E293B] font-medium">公共服务热线渠道</span>
                    </div>
                  </div>

                  {/* Property Mappings */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-[#64748B] font-medium">
                      属性对应 (已核验)
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded p-2 space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-[#334155]">
                        <span className="font-sans">工单编号</span>
                        <span className="text-[#94A3B8]">→</span>
                        <span>ticket_id</span>
                      </div>
                      <div className="flex items-center justify-between text-[#334155]">
                        <span className="font-sans">处理状态</span>
                        <span className="text-[#94A3B8]">→</span>
                        <span>status</span>
                      </div>
                      <div className="flex items-center justify-between text-[#334155]">
                        <span className="font-sans">创建时间</span>
                        <span className="text-[#94A3B8]">→</span>
                        <span>created_time</span>
                      </div>
                      <div className="flex items-center justify-between text-[#334155]">
                        <span className="font-sans">受理时间</span>
                        <span className="text-[#94A3B8]">→</span>
                        <span>accept_time</span>
                      </div>
                    </div>
                  </div>

                  {/* Relationship Mappings */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-[#64748B] font-medium">
                      关系对应 (已核验)
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded p-2 space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-[#334155]">
                        <span className="font-sans">申请人</span>
                        <span className="text-[#94A3B8]">→</span>
                        <span>person_id</span>
                      </div>
                      <div className="flex items-center justify-between text-[#334155]">
                        <span className="font-sans">承办部门</span>
                        <span className="text-[#94A3B8]">→</span>
                        <span>dept_id</span>
                      </div>
                    </div>
                  </div>

                  {/* Not included in this scope */}
                  <div className="space-y-1 bg-[#FAFAFA] border border-[#E2E8F0] rounded p-2.5 text-[11px]">
                    <div className="font-semibold text-[#475569] flex items-center justify-between">
                      <span>暂不纳入本次</span>
                      <span className="text-[#94A3B8] font-normal">需补充核验</span>
                    </div>
                    <div className="text-[#334155] font-medium pt-0.5">
                      办结时间、所属区域
                    </div>
                    <p className="text-[10px] text-[#64748B] leading-normal pt-1">
                      以上内容的数据语义已经存在，但当前对象对应关系仍需补充核验，不会随本次确认一并正式建立。
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-section: 查看判断依据 */}
              <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                <button
                  onClick={() => setIsEvidenceDrawerOpen(true)}
                  className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <span>查看判断依据</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <p className="text-[11px] text-[#64748B] leading-normal">
                  依据来自当前有效数据语义、正式业务对象定义以及已经核验的身份和关系条件。
                </p>
              </div>

            </div>

            {/* Right Column Bottom Actions */}
            <div className="p-6 border-t border-[#E2E8F0] bg-white space-y-3 shrink-0">
              {/* Primary CTA */}
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#93C5FD] text-white font-medium text-xs rounded-md shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>正在校验并建立数据支撑...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>确认对齐“{selectedCandidate === 'service_ticket' ? '服务工单' : '热线工单'}”</span>
                  </>
                )}
              </button>

              {/* Auxiliary note below primary button */}
              <p className="text-[11px] text-[#64748B] leading-normal text-center">
                将建立当前资产在公共服务热线范围内的数据实现，并提交本次已经核验的属性与关系对应。
              </p>

              {/* Secondary Actions: 创建新业务对象 + More menu */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onCreateNewObject}
                  className="text-xs text-[#475569] hover:text-[#0F172A] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                  title="适用于当前两个正式业务对象都不能准确表达这份数据的情况"
                >
                  <Plus className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>创建新业务对象</span>
                </button>

                {/* More Menu (...) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className="p-1 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
                    aria-label="更多操作"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute right-0 bottom-full mb-1 w-44 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1 z-30 animate-in fade-in-50 duration-100">
                      <button
                        type="button"
                        onClick={handleSkipThisRound}
                        className="w-full px-3 py-1.5 text-xs text-left text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
                      >
                        本轮不建立对象关联
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </section>

        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL: 查看完整定义 (Clean Popover / Modal)               */}
      {/* ========================================================= */}
      {activeDefinitionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E2E8F0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {activeDefinitionModal === 'service_ticket' ? '服务工单 (Service Ticket)' : '热线工单 (Hotline Ticket)'}
                </h3>
                <p className="text-xs text-[#64748B]">企业正式业务对象定义规范</p>
              </div>
              <button
                onClick={() => setActiveDefinitionModal(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded hover:bg-[#E2E8F0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs text-[#334155]">
              <div className="space-y-1">
                <div className="font-semibold text-[#0F172A]">业务定义</div>
                <p className="leading-relaxed bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                  {activeDefinitionModal === 'service_ticket'
                    ? '跨热线、线上、窗口等公共服务渠道统一管理的服务工单。统一公共服务业务主体，规范工单生命周期与多源数据实现。'
                    : '专门描述公共服务热线渠道形成和流转的工单。聚焦话务呼叫、语音转写、工单派发及电话回访闭环。'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-[#0F172A]">主体标识</div>
                  <div className="font-mono bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                    {activeDefinitionModal === 'service_ticket' ? '工单编号 (ticket_id)' : '热线工单编号 (hotline_ticket_id)'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-[#0F172A]">业务域</div>
                  <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                    {activeDefinitionModal === 'service_ticket' ? '公共服务域 · 服务运营' : '热线服务域 · 呼叫中心'}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-[#0F172A]">核心关系定义</div>
                <ul className="list-disc pl-4 space-y-1 text-[#475569]">
                  {activeDefinitionModal === 'service_ticket' ? (
                    <>
                      <li>申请人 → 自然人 (Person) [多对一]</li>
                      <li>承办部门 → 组织机构 (Organization) [多对一]</li>
                      <li>所属区域 → 行政区域 (Administrative Region) [多对一]</li>
                    </>
                  ) : (
                    <>
                      <li>来电人 → 电话联系人 (Caller) [多对一]</li>
                      <li>受理坐席 → 客服坐席 (Agent) [多对一]</li>
                      <li>承办部门 → 处理单位 (Handling Dept) [多对一]</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setActiveDefinitionModal(null)}
                className="px-4 py-1.5 bg-white border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] rounded cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER: 查看判断依据 (Evidence Drawer)                    */}
      {/* ========================================================= */}
      {isEvidenceDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-[480px] h-full shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">对齐判断依据</h3>
                <p className="text-xs text-[#64748B]">
                  依据来自当前有效数据语义、正式业务对象定义以及已经核验的身份和关系条件
                </p>
              </div>
              <button
                onClick={() => setIsEvidenceDrawerOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded hover:bg-[#E2E8F0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs text-[#334155]">
              {/* Evidence 1: Data Semantics Validation */}
              <div className="space-y-1.5">
                <div className="font-semibold text-[#0F172A] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  <span>有效数据语义支撑事实</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                  资产 <code className="font-mono text-[11px] text-[#0F172A]">hotline_db.service.pop_service_hotline</code> 已在数据语义工作台中完成正式理解，主键 <code>ticket_id</code> 唯一标识一张工单实体，记录时间戳完整覆盖工单创建与受理流转过程。
                </p>
              </div>

              {/* Evidence 2: Subject & Granularity Equivalence */}
              <div className="space-y-1.5">
                <div className="font-semibold text-[#0F172A] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  <span>业务主体与记录粒度等价性</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                  “服务工单”定义为企业全渠道公共服务记录的泛化主体。热线工单表的一行数据直接对应一张具有闭环流转属性的服务工单，粒度完全等价，无需做聚合或展开变换。
                </p>
              </div>

              {/* Evidence 3: Multi-channel Scope Separation */}
              <div className="space-y-1.5">
                <div className="font-semibold text-[#0F172A] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  <span>适用范围与多实现隔离</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                  “服务工单”已有一套主要实现（客服系统工单记录）。本资产声明范围为“公共服务热线渠道”，作为分渠道的独立数据实现并存，不覆盖、不替换主要实现。
                </p>
              </div>

              {/* Evidence 4: Identity & Relationship Verification */}
              <div className="space-y-1.5">
                <div className="font-semibold text-[#0F172A] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  <span>关键关系可解析性</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                  外键字段 <code>person_id</code> 与 <code>dept_id</code> 经抽样检验具备有效的跨表外键指向，已确证满足与企业自然人及组织机构对象的关联条件。
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsEvidenceDrawerOpen(false)}
                className="px-4 py-1.5 bg-white border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] rounded cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: 查看当前数据语义 (Data Semantics Modal)           */}
      {/* ========================================================= */}
      {isDataSemanticsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E2E8F0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">当前有效数据语义</h3>
                <p className="font-mono text-[11px] text-[#64748B]">hotline_db.service.pop_service_hotline</p>
              </div>
              <button
                onClick={() => setIsDataSemanticsModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded hover:bg-[#E2E8F0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-[#334155]">
              <div className="space-y-1.5">
                <div className="font-semibold text-[#0F172A]">语义理解状态</div>
                <div className="bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] p-2.5 rounded text-xs">
                  数据语义已完成审核与正式发布，主键标识、事实字段和外键关系已被系统解析确认。
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-[#0F172A]">已解析字段语义</div>
                <div className="border border-[#E2E8F0] rounded overflow-hidden text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                      <tr>
                        <th className="py-1.5 px-3">字段名</th>
                        <th className="py-1.5 px-3">物理类型</th>
                        <th className="py-1.5 px-3">语义角色</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] font-mono">
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-[#0F172A]">ticket_id</td>
                        <td className="py-1.5 px-3 text-[#64748B]">VARCHAR(64)</td>
                        <td className="py-1.5 px-3 font-sans text-[#16A34A]">实体主键标识</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-[#0F172A]">status</td>
                        <td className="py-1.5 px-3 text-[#64748B]">INT</td>
                        <td className="py-1.5 px-3 font-sans text-[#334155]">状态码</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-[#0F172A]">created_time</td>
                        <td className="py-1.5 px-3 text-[#64748B]">DATETIME</td>
                        <td className="py-1.5 px-3 font-sans text-[#334155]">创建时间</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-[#0F172A]">accept_time</td>
                        <td className="py-1.5 px-3 text-[#64748B]">DATETIME</td>
                        <td className="py-1.5 px-3 font-sans text-[#334155]">受理时间</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsDataSemanticsModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] rounded cursor-pointer"
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
