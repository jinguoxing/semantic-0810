import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Database,
  Table as TableIcon,
  FileText,
  Layers,
  ShieldCheck,
  AlertCircle,
  Info,
  ExternalLink,
  X,
  Sparkles,
  CheckCircle2,
  Box,
  BarChart3,
  BookOpen,
  FolderTree,
  Network
} from 'lucide-react';

export interface ResolveDataSupportWorkspaceProps {
  onBackToDetail?: () => void;
  onViewCurrentSupport?: () => void;
  onConfirmSuccess?: () => void;
  onDismissCandidate?: () => void;
  onNavigateToObjectsList?: () => void;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const ResolveDataSupportWorkspace: React.FC<ResolveDataSupportWorkspaceProps> = ({
  onBackToDetail,
  onViewCurrentSupport,
  onConfirmSuccess,
  onDismissCandidate,
  onNavigateToObjectsList,
  addToast
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);

  // Handle confirming the data support candidate
  const handleConfirm = () => {
    setIsVerifying(true);
    // Simulate instantaneous enterprise validation check (object version, semantic eligibility, non-conflict)
    setTimeout(() => {
      setIsVerifying(false);
      addToast?.(
        'success',
        '数据实现已建立',
        '「公共服务热线工单记录表」已正式确立为「服务工单」的数据实现，服务工单的数据支撑已更新。'
      );
      if (onConfirmSuccess) {
        onConfirmSuccess();
      } else if (onBackToDetail) {
        onBackToDetail();
      }
    }, 450);
  };

  const handleDismiss = () => {
    addToast?.(
      'info',
      '暂不采用此数据实现',
      '已保留「公共服务热线工单记录表」候选分析结果，未建立正式数据实现关系。'
    );
    if (onDismissCandidate) {
      onDismissCandidate();
    } else if (onBackToDetail) {
      onBackToDetail();
    }
  };

  return (
    <div className="flex-1 flex min-h-0 bg-[#F8FAFC] text-[#0F172A] font-sans antialiased relative select-none">
      
      {/* ========================================================= */}
      {/* 1. FOCUSED WORK SHELL: 64px NARROW SECONDARY NAV BAR      */}
      {/* ========================================================= */}
      <aside className="w-16 shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col items-center py-4 space-y-4 select-none z-20">
        
        {/* Back to Business Objects Catalog */}
        <button
          onClick={onNavigateToObjectsList || onBackToDetail}
          className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          title="返回业务对象列表"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-8 h-px bg-[#E2E8F0]" />

        {/* 1. 业务对象 (Active) */}
        <div className="relative group">
          <button
            className="w-10 h-10 rounded-md flex items-center justify-center bg-[#EFF6FF] text-[#2563EB] font-medium border border-[#BFDBFE] transition-colors cursor-pointer"
            aria-label="业务对象"
          >
            <Box className="w-5 h-5" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#0F172A] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
            业务对象 (Business Objects)
          </div>
        </div>

        {/* 2. 业务指标 */}
        <div className="relative group">
          <button
            onClick={() => addToast?.('info', '业务指标', '当前处于「服务工单」数据支撑发现工作区')}
            className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="业务指标"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#0F172A] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
            业务指标 (Metrics)
          </div>
        </div>

        {/* 3. 业务术语 */}
        <div className="relative group">
          <button
            onClick={() => addToast?.('info', '业务术语', '当前处于「服务工单」数据支撑发现工作区')}
            className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="业务术语"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#0F172A] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
            业务术语 (Business Terms)
          </div>
        </div>

        {/* 4. 数据标准 */}
        <div className="relative group">
          <button
            onClick={() => addToast?.('info', '数据标准', '当前处于「服务工单」数据支撑发现工作区')}
            className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="数据标准"
          >
            <FolderTree className="w-5 h-5" />
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#0F172A] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
            数据标准 (Data Standards)
          </div>
        </div>

      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE CONTAINER                               */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        
        {/* --------------------------------------------------------- */}
        {/* HEADER AREA                                               */}
        {/* --------------------------------------------------------- */}
        <header className="bg-white border-b border-[#E2E8F0] px-6 lg:px-8 py-4 shrink-0">
          <div className="max-w-7xl mx-auto space-y-3">
            
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#64748B]">
              <button
                onClick={onNavigateToObjectsList || onBackToDetail}
                className="hover:text-[#2563EB] transition-colors cursor-pointer"
              >
                业务语义
              </button>
              <span className="text-[#CBD5E1]">/</span>
              <button
                onClick={onNavigateToObjectsList || onBackToDetail}
                className="hover:text-[#2563EB] transition-colors cursor-pointer"
              >
                业务对象
              </button>
              <span className="text-[#CBD5E1]">/</span>
              <button
                onClick={onBackToDetail}
                className="hover:text-[#2563EB] transition-colors cursor-pointer"
              >
                服务工单
              </button>
              <span className="text-[#CBD5E1]">/</span>
              <span className="text-[#0F172A] font-medium">发现数据支撑</span>
            </nav>

            {/* Title Row & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                    发现数据支撑
                  </h1>
                  <span className="text-xs text-[#64748B] font-mono">
                    Resolve Data Support
                  </span>
                </div>
                
                <p className="text-xs text-[#64748B]">
                  基于当前正式业务定义，确认能够真实承载“服务工单”的数据实现。
                </p>

                {/* Object Identification Line */}
                <div className="flex items-center space-x-2.5 pt-1 text-xs">
                  <span className="font-semibold text-[#0F172A]">服务工单</span>
                  <span className="text-[#64748B] font-mono text-[11px]">Service Ticket</span>
                  <span className="text-[#CBD5E1]">·</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5" />
                    已发布 · 当前正式定义
                  </span>
                </div>
              </div>

              {/* Header Right Action: 稍后处理 only */}
              <div className="flex items-center space-x-3 shrink-0">
                <button
                  id="btn-handle-later"
                  onClick={onBackToDetail}
                  className="px-3.5 py-1.5 rounded bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-medium transition-colors cursor-pointer"
                >
                  稍后处理
                </button>
              </div>
            </div>

          </div>
        </header>

        {/* --------------------------------------------------------- */}
        {/* THREE-COLUMN DECISION WORKSPACE                           */}
        {/* Left: ~24% | Middle: ~50% | Right: ~26%                   */}
        {/* --------------------------------------------------------- */}
        <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ======================================================= */}
            {/* LEFT COLUMN: ~24% (lg:col-span-3)                       */}
            {/* 当前业务对象及已有数据实现                                 */}
            {/* ======================================================= */}
            <section aria-label="当前业务对象及已有数据实现" className="lg:col-span-3 space-y-6">
              
              {/* Part 1: 当前业务对象 */}
              <div className="bg-white border border-[#E2E8F0] rounded-md p-5 shadow-2xs space-y-4">
                <div className="border-b border-[#F1F5F9] pb-3 space-y-1">
                  <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    当前业务对象
                  </h2>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0F172A]">服务工单</span>
                    <span className="text-[10px] text-[#166534] bg-[#F0FDF4] border border-[#DCFCE7] px-1.5 py-0.2 rounded font-medium">
                      已发布 · 公共服务
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] font-mono">
                    Service Ticket
                  </div>
                </div>

                {/* 业务定义 */}
                <div className="space-y-1 text-xs">
                  <div className="text-[#64748B] text-[11px] font-medium">业务定义</div>
                  <p className="text-[#334155] leading-relaxed">
                    表示公众通过公共服务渠道提出诉求，并经过受理、办理和办结的业务主体。
                  </p>
                </div>

                {/* 主体标识 */}
                <div className="space-y-1 text-xs">
                  <div className="text-[#64748B] text-[11px] font-medium">主体标识</div>
                  <div className="font-semibold text-[#0F172A] bg-[#F8FAFC] px-2 py-1 rounded border border-[#E2E8F0] inline-block font-mono text-[11px]">
                    工单编号
                  </div>
                </div>

                {/* 关键属性 */}
                <div className="space-y-1 text-xs">
                  <div className="text-[#64748B] text-[11px] font-medium">关键属性</div>
                  <div className="text-[#334155] leading-relaxed">
                    处理状态 · 创建时间 · 受理时间 · 办结时间 · 诉求类型
                  </div>
                </div>

                {/* 核心关系 */}
                <div className="space-y-1.5 text-xs pt-1 border-t border-[#F1F5F9]">
                  <div className="text-[#64748B] text-[11px] font-medium">核心关系</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center text-[#334155]">
                      <span className="font-medium">服务工单</span>
                      <span className="text-[#2563EB] mx-1">─申请人→</span>
                      <span className="font-medium text-[#0F172A]">自然人</span>
                    </div>
                    <div className="flex items-center text-[#334155]">
                      <span className="font-medium">服务工单</span>
                      <span className="text-[#2563EB] mx-1">─承办部门→</span>
                      <span className="font-medium text-[#0F172A]">组织机构</span>
                    </div>
                    <div className="flex items-center text-[#334155]">
                      <span className="font-medium">服务工单</span>
                      <span className="text-[#2563EB] mx-1">─所属区域→</span>
                      <span className="font-medium text-[#0F172A]">行政区域</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Part 2: 当前数据实现 */}
              <div className="bg-white border border-[#E2E8F0] rounded-md p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
                  <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    当前数据实现
                  </h2>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    主要数据实现
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-bold text-[#0F172A] text-xs">
                    客服工单当前视图
                  </div>
                  <div className="space-y-1 text-[#475569] text-[11px]">
                    <div className="text-[#64748B]">适用范围：</div>
                    <div className="text-[#334155] leading-relaxed">
                      客服业务当前工单，其中包含部分热线转接工单
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F1F5F9]">
                  <button
                    onClick={onViewCurrentSupport || onBackToDetail}
                    className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看当前数据支撑</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </section>

            {/* ======================================================= */}
            {/* MIDDLE COLUMN: ~50% (lg:col-span-6)                     */}
            {/* 当前需要确认的新数据实现候选                               */}
            {/* ======================================================= */}
            <section aria-label="数据支撑分析与候选确认" className="lg:col-span-6 space-y-6">
              
              {/* Middle Top: 数据支撑分析说明 */}
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                  数据支撑分析
                </h2>
                <p className="text-xs text-[#64748B]">
                  Semovix 已完成相关数据检索和角色判断，当前只需要确认一套新的数据实现。
                </p>
              </div>

              {/* Core Decision Section: 需要你确认 */}
              <div className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-5">
                
                <div className="space-y-2 border-b border-[#F1F5F9] pb-4">
                  <div className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
                    需要你确认
                  </div>
                  {/* The most prominent question in the middle column */}
                  <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                    是否将“公共服务热线工单记录表”作为“服务工单”在公共服务热线范围内的一套数据实现？
                  </h3>
                </div>

                {/* Unified Candidate Surface */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[#0F172A]">
                        公共服务热线工单记录表
                      </div>
                      <div className="font-mono text-xs text-[#64748B] pt-0.5">
                        hotline_db.service.pop_service_hotline
                      </div>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white text-[#334155] border border-[#CBD5E1]">
                      Table · MySQL · 数据实现候选
                    </span>
                  </div>
                </div>

                {/* Candidate Facts: Four essential facts in a clean 2-column description grid */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-[#0F172A]">
                    候选成立事实
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Fact 1: 记录主体 */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B] text-[11px]">记录主体</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                          一致
                        </span>
                      </div>
                      <div className="font-bold text-[#0F172A]">服务工单</div>
                      <p className="text-[#64748B] text-[11px] leading-relaxed pt-0.5">
                        当前记录主体符合正式业务对象定义。
                      </p>
                    </div>

                    {/* Fact 2: 记录粒度 */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B] text-[11px]">记录粒度</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                          一致
                        </span>
                      </div>
                      <div className="font-bold text-[#0F172A]">一行一张服务工单</div>
                      <p className="text-[#64748B] text-[11px] leading-relaxed pt-0.5">
                        每条记录能够表示一个服务工单实例。
                      </p>
                    </div>

                    {/* Fact 3: 实例身份 */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B] text-[11px]">实例身份</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                          已核验
                        </span>
                      </div>
                      <div className="font-bold text-[#0F172A]">工单编号 · ticket_id</div>
                      <p className="text-[#64748B] text-[11px] leading-relaxed pt-0.5">
                        ticket_id 能够解释当前实现中的服务工单身份。
                      </p>
                    </div>

                    {/* Fact 4: 适用范围 */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B] text-[11px]">适用范围</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                          已明确
                        </span>
                      </div>
                      <div className="font-bold text-[#0F172A]">公共服务热线渠道</div>
                      <p className="text-[#64748B] text-[11px] leading-relaxed pt-0.5">
                        该实现只覆盖热线渠道，不代表服务工单全部范围。
                      </p>
                    </div>

                  </div>
                </div>

                {/* Relationship with Existing Implementation */}
                <div className="pt-3 border-t border-[#F1F5F9] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-[#0F172A]">
                      与已有数据实现
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      部分范围重叠
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                      <div className="text-[#64748B] text-[11px]">已有实现：客服工单当前视图</div>
                      <div className="text-[#334155] leading-relaxed">
                        范围：客服业务当前工单，其中包含部分热线转接工单
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                      <div className="text-[#64748B] text-[11px]">新候选：公共服务热线工单记录表</div>
                      <div className="text-[#334155] leading-relaxed">
                        范围：公共服务热线渠道全部工单
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#64748B] leading-relaxed bg-[#FFFBEB]/40 p-2.5 rounded border border-[#FEF3C7]">
                    两套实现可能包含部分相同服务工单。本次确认只新增一套独立数据实现，不会合并数据、替换现有实现或改变主要数据实现。
                  </p>
                </div>

              </div>

              {/* Part 3: 已识别的其他数据 */}
              <div className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                <div className="space-y-0.5 border-b border-[#F1F5F9] pb-3">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    已识别的其他数据
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    以下资源已完成角色判断，不需要用户逐项重新选择数据类型。
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  
                  {/* Resource 1: 工单扩展信息表 */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0F172A]">工单扩展信息表</div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        属性扩展建议
                      </span>
                    </div>
                    <p className="text-[#475569] text-[11px] leading-relaxed">
                      通过工单编号与当前候选实现对齐，为同一服务工单补充诉求类型。
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#E2E8F0]/60 text-[#64748B]">
                      <div>依附实现：<span className="text-[#334155] font-medium">公共服务热线工单记录表</span></div>
                      <div>身份对应：<span className="font-mono text-[#334155]">工单编号 ↔ ticket_id</span></div>
                      <div>提供属性：<span className="text-[#334155]">诉求类型 → appeal_type</span></div>
                      <div>当前状态：<span className="text-[#2563EB] font-medium">拟随当前数据实现建立</span></div>
                    </div>
                  </div>

                  {/* Resource 2: 工单状态历史表 */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0F172A]">工单状态历史表</div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                        事件 / 历史相关数据
                      </span>
                    </div>
                    <p className="text-[#475569] text-[11px] leading-relaxed">
                      一行表示一次服务工单状态变化，与服务工单相关，但不表示服务工单实例。
                    </p>
                    <div className="text-[11px] text-[#64748B] pt-0.5">
                      当前状态：<span className="text-[#334155]">系统已完成角色识别</span>
                    </div>
                  </div>

                  {/* Resource 3: 工单月度汇总表 */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0F172A]">工单月度汇总表</div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                        分析相关数据
                      </span>
                    </div>
                    <p className="text-[#475569] text-[11px] leading-relaxed">
                      按月份、行政区域和诉求类型形成聚合统计，不表示具体服务工单实例。
                    </p>
                    <div className="text-[11px] text-[#64748B] pt-0.5">
                      当前状态：<span className="text-[#334155]">系统已完成角色识别</span>
                    </div>
                  </div>

                </div>
              </div>

            </section>

            {/* ======================================================= */}
            {/* RIGHT COLUMN: ~26% (lg:col-span-3)                      */}
            {/* 数据实现条件与本次正式建立范围                              */}
            {/* ======================================================= */}
            <section aria-label="数据实现条件与建立范围" className="lg:col-span-3 space-y-6">
              
              {/* Part 1: 数据实现条件 (Five Compact Gate Rows) */}
              <div className="bg-white border border-[#E2E8F0] rounded-md p-5 shadow-2xs space-y-3.5">
                <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-[#F1F5F9] pb-2.5">
                  数据实现条件
                </h2>

                <div className="space-y-2.5 text-xs">
                  {/* Gate 1 */}
                  <div className="flex items-center justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">主体</span>
                    <span className="text-[#166534] font-medium flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>一致</span>
                    </span>
                  </div>

                  {/* Gate 2 */}
                  <div className="flex items-center justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">粒度</span>
                    <span className="text-[#166534] font-medium flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>一致</span>
                    </span>
                  </div>

                  {/* Gate 3 */}
                  <div className="flex items-center justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">身份</span>
                    <span className="text-[#166534] font-medium flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>已核验</span>
                    </span>
                  </div>

                  {/* Gate 4 */}
                  <div className="space-y-0.5 py-1 border-b border-[#F8FAFC]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">适用范围</span>
                      <span className="text-[#166534] font-medium flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>已明确</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] text-right">
                      公共服务热线渠道
                    </div>
                  </div>

                  {/* Gate 5 */}
                  <div className="space-y-0.5 py-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">与现有实现</span>
                      <span className="text-[#166534] font-medium flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>关系已识别</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] text-right">
                      存在部分范围重叠
                    </div>
                  </div>
                </div>
              </div>

              {/* Part 2: 本次将建立 (Summary) */}
              <div className="bg-white border border-[#E2E8F0] rounded-md p-5 shadow-2xs space-y-4">
                <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-[#F1F5F9] pb-2.5">
                  本次将建立
                </h2>

                <div className="space-y-3 text-xs">
                  
                  {/* 1. 新增数据实现 */}
                  <div className="space-y-1">
                    <div className="text-[#64748B] text-[11px]">新增数据实现</div>
                    <div className="font-bold text-[#0F172A]">公共服务热线工单记录表</div>
                    <div className="text-[11px] text-[#475569] space-y-0.5">
                      <div>业务对象：服务工单</div>
                      <div>适用范围：公共服务热线渠道</div>
                      <div>正式角色：其他数据实现</div>
                    </div>
                  </div>

                  <div className="h-px bg-[#F1F5F9]" />

                  {/* 2. 属性扩展 */}
                  <div className="space-y-1">
                    <div className="text-[#64748B] text-[11px]">属性扩展</div>
                    <div className="font-semibold text-[#0F172A]">工单扩展信息表</div>
                    <div className="text-[11px] text-[#475569]">
                      依附：公共服务热线工单记录表
                    </div>
                    <div className="text-[11px] text-[#2563EB]">
                      当前状态：拟随当前实现建立
                    </div>
                  </div>

                  <div className="h-px bg-[#F1F5F9]" />

                  {/* 3. 关键语义对应 */}
                  <div className="space-y-1.5">
                    <div className="text-[#64748B] text-[11px]">关键语义对应</div>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      本次范围内已核验的关键属性与关系对应，将随当前数据实现正式建立。
                    </p>
                    <button
                      onClick={() => setIsScopeModalOpen(true)}
                      className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>查看本次范围</span>
                      <span>→</span>
                    </button>
                  </div>

                  <div className="h-px bg-[#F1F5F9]" />

                  {/* 4. 同步维护相关数据 */}
                  <div className="space-y-1">
                    <div className="text-[#64748B] text-[11px]">同步维护相关数据</div>
                    <div className="font-medium text-[#334155] text-[11px]">
                      工单状态历史表 · 工单月度汇总表
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      系统将把它们维护为服务工单的相关数据上下文，不会将其建立为新的服务工单实例数据实现。
                    </p>
                  </div>

                </div>

                {/* 确认后不会发生什么 (Low-key note) */}
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    确认后不会替换现有实现，也不会自动改变主要数据实现。
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#F1F5F9] space-y-2.5">
                  {/* Primary CTA: 确认数据支撑 */}
                  <button
                    id="btn-confirm-data-support"
                    onClick={handleConfirm}
                    disabled={isVerifying}
                    className="w-full h-10 rounded bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {isVerifying ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>正在进行数据实现基准核验...</span>
                      </>
                    ) : (
                      <span>确认数据支撑</span>
                    )}
                  </button>

                  {/* Subtitle helper under primary button */}
                  <p className="text-[11px] text-[#64748B] text-center leading-relaxed">
                    将新增当前数据实现，并按本次范围建立已核验的属性、关系和扩展对应。
                  </p>

                  {/* Secondary Action */}
                  <div className="text-center pt-1">
                    <button
                      id="btn-dismiss-candidate"
                      onClick={handleDismiss}
                      className="text-xs text-[#64748B] hover:text-[#0F172A] hover:underline cursor-pointer"
                    >
                      暂不采用此数据实现
                    </button>
                  </div>
                </div>

              </div>

            </section>

          </div>
        </div>

      </main>

      {/* ========================================================= */}
      {/* SCOPE DETAILS MODAL (查看本次范围)                           */}
      {/* ========================================================= */}
      {isScopeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">本次建立范围详情</h3>
                <p className="text-xs text-[#64748B] font-mono pt-0.5">
                  服务工单 ← 公共服务热线工单记录表
                </p>
              </div>
              <button
                onClick={() => setIsScopeModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#334155]">
              
              {/* 1. 核验通过的属性对应 */}
              <div className="space-y-2">
                <div className="font-bold text-[#0F172A] flex items-center justify-between">
                  <span>1. 核验通过的关键属性落地</span>
                  <span className="text-[11px] text-[#64748B] font-normal">共 6 项对应</span>
                </div>
                <div className="border border-[#E2E8F0] rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                      <tr>
                        <th className="py-2 px-3 font-semibold">业务属性</th>
                        <th className="py-2 px-3 font-semibold">数据字段</th>
                        <th className="py-2 px-3 font-semibold">来源 / 语义</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#0F172A]">工单编号</td>
                        <td className="py-2 px-3 font-mono text-[11px]">ticket_id</td>
                        <td className="py-2 px-3 text-[#64748B]">主体标识 · 主表核心身份</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#0F172A]">处理状态</td>
                        <td className="py-2 px-3 font-mono text-[11px]">status</td>
                        <td className="py-2 px-3 text-[#64748B]">服务工单当前流转状态</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#0F172A]">创建时间</td>
                        <td className="py-2 px-3 font-mono text-[11px]">create_time</td>
                        <td className="py-2 px-3 text-[#64748B]">工单正式生成时间</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#0F172A]">受理时间</td>
                        <td className="py-2 px-3 font-mono text-[11px]">accept_time</td>
                        <td className="py-2 px-3 text-[#64748B]">工单正式受理立案时间</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#0F172A]">办结时间</td>
                        <td className="py-2 px-3 font-mono text-[11px]">close_time</td>
                        <td className="py-2 px-3 text-[#64748B]">工单实际完成办理时间</td>
                      </tr>
                      <tr className="bg-[#F8FAFC]/50">
                        <td className="py-2 px-3 font-semibold text-[#0F172A]">
                          诉求类型
                          <span className="ml-1.5 text-[10px] text-[#2563EB] bg-[#EFF6FF] px-1 py-0.2 rounded border border-[#BFDBFE]">
                            属性扩展
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">appeal_type</td>
                        <td className="py-2 px-3 text-[#64748B]">由依附表「工单扩展信息表」补充提供</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. 核验通过的核心关系对应 */}
              <div className="space-y-2">
                <div className="font-bold text-[#0F172A] flex items-center justify-between">
                  <span>2. 核验通过的核心关系落地</span>
                  <span className="text-[11px] text-[#64748B] font-normal">共 3 条关系</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-[#0F172A]">服务工单 ─申请人→ 自然人</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] flex items-center space-x-4">
                      <span>来源字段：<span className="font-mono text-[#0F172A]">caller_id</span></span>
                      <span>目标身份：<span className="font-medium text-[#0F172A]">自然人 · 身份标识</span></span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-[#0F172A]">服务工单 ─承办部门→ 组织机构</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] flex items-center space-x-4">
                      <span>来源字段：<span className="font-mono text-[#0F172A]">dept_id</span></span>
                      <span>目标身份：<span className="font-medium text-[#0F172A]">组织机构 · 机构标识</span></span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-[#0F172A]">服务工单 ─所属区域→ 行政区域</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] flex items-center space-x-4">
                      <span>来源字段：<span className="font-mono text-[#0F172A]">region_code</span></span>
                      <span>目标身份：<span className="font-medium text-[#0F172A]">行政区域 · 区域标识</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 属性扩展依附详情 */}
              <div className="space-y-2">
                <div className="font-bold text-[#0F172A]">3. 属性扩展依附说明</div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#475569] space-y-1">
                  <div>依附实现：<span className="font-medium text-[#0F172A]">公共服务热线工单记录表</span></div>
                  <div>对齐身份：<span className="font-mono text-[#0F172A]">ticket_id</span>（同一工单编号业务身份空间）</div>
                  <div>粒度兼容：每条记录对应单个服务工单，补充诉求类型，不作为独立数据实现重复计入基数。</div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end shrink-0">
              <button
                onClick={() => setIsScopeModalOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium text-[#334155] rounded transition-colors cursor-pointer"
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
