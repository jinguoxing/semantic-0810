import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ArrowRight,
  Database,
  Layers,
  Calendar,
  Clock,
  Play,
  RotateCcw,
  Save,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  BookOpen,
  User,
  ShoppingBag,
  Network,
  Bot,
  BarChart3,
  ShieldCheck,
  FolderTree,
  Edit3,
  Search,
  CheckCircle,
  HelpCircle,
  Info,
  ArrowLeft,
  Loader2,
  Filter,
  CheckCircle2,
  GitBranch,
  ArrowDown
} from 'lucide-react';
import { DataBindingDrawer } from './DataBindingDrawer';

interface MetricAuthoringChangeModeProps {
  onBackToRegistry?: () => void;
  onNavigateToBusinessObject?: () => void;
  onNavigateToDataStandards?: () => void;
  onNavigateToDataSemantics?: () => void;
  onNavigateToDataAssets?: () => void;
  onNavigateToMarketplace?: () => void;
  onNavigateToHome?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MetricAuthoringChangeMode: React.FC<MetricAuthoringChangeModeProps> = ({
  onBackToRegistry,
  onNavigateToBusinessObject,
  onNavigateToDataStandards,
  onNavigateToDataSemantics,
  onNavigateToDataAssets,
  onNavigateToMarketplace,
  onNavigateToHome,
  addToast,
}) => {
  // Change Reason input text (Natural language statement, NOT a chat)
  const [changeReason, setChangeReason] = useState<string>(
    '调整有效订单定义，排除退款订单，使指标更符合订单经营分析口径。'
  );

  // Change Type determination state:
  // - 'semantic_change': Business meaning & calculation changed -> Metric Semantic Version (v1.2 -> v1.3 Draft)
  // - 'binding_change': Only physical asset changed -> Binding Version
  // - 'needs_confirm': Uncertain type requiring user explicit choice
  const [changeTypeSelection, setChangeTypeSelection] = useState<'semantic_change' | 'binding_change' | 'needs_confirm'>('semantic_change');

  // Drawers & Modals
  const [isDataBindingDrawerOpen, setIsDataBindingDrawerOpen] = useState<boolean>(false);
  const [isValidatingModalOpen, setIsValidatingModalOpen] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [validationSteps, setValidationSteps] = useState<
    Array<{ name: string; status: 'waiting' | 'running' | 'passed' | 'failed' }>
  >([
    { name: '计算依赖拓扑与变更循环检测', status: 'waiting' },
    { name: '业务规则 Semantic Diff 校验', status: 'waiting' },
    { name: '时间语义一致性 (Temporal Consistency)', status: 'waiting' },
    { name: '可分析维度兼容性校验', status: 'waiting' },
    { name: '底层数据资产物理 Binding 探活', status: 'waiting' },
  ]);

  // Handle Save Draft
  const handleSaveDraft = () => {
    if (addToast) {
      addToast('success', '草稿已保存', '有效订单金额 v1.3 Change Draft 已同步至语义版本库');
    }
  };

  // Handle Run Validation
  const handleRunValidation = () => {
    setIsValidatingModalOpen(true);
    setValidationProgress(15);
    setValidationSteps([
      { name: '计算依赖拓扑与变更循环检测', status: 'running' },
      { name: '业务规则 Semantic Diff 校验', status: 'waiting' },
      { name: '时间语义一致性 (Temporal Consistency)', status: 'waiting' },
      { name: '可分析维度兼容性校验', status: 'waiting' },
      { name: '底层数据资产物理 Binding 探活', status: 'waiting' },
    ]);

    setTimeout(() => {
      setValidationProgress(40);
      setValidationSteps((prev) => [
        { ...prev[0], status: 'passed' },
        { ...prev[1], status: 'running' },
        prev[2],
        prev[3],
        prev[4],
      ]);
    }, 600);

    setTimeout(() => {
      setValidationProgress(75);
      setValidationSteps((prev) => [
        prev[0],
        { ...prev[1], status: 'passed' },
        { ...prev[2], status: 'passed' },
        { ...prev[3], status: 'running' },
        prev[4],
      ]);
    }, 1300);

    setTimeout(() => {
      setValidationProgress(100);
      setValidationSteps((prev) => [
        prev[0],
        prev[1],
        prev[2],
        { ...prev[3], status: 'passed' },
        { ...prev[4], status: 'passed' },
      ]);
      if (addToast) {
        addToast('success', '变更验证通过', 'Change Draft v1.3 已通过全部语义与数据实现验证');
      }
    }, 2100);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F7F9FC] text-[#172033] font-sans antialiased select-none overflow-hidden">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER & BREADCRUMB                                */}
      {/* ========================================================= */}
      <header className="bg-white border-b border-[#E6EAF0] px-6 py-3 flex items-center justify-between shrink-0 z-10 shadow-2xs">
        <div className="space-y-0.5">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-[#667085]">
            <button 
              onClick={onBackToRegistry} 
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              业务语义
            </button>
            <span className="text-[#CBD5E1]">/</span>
            <button 
              onClick={onBackToRegistry} 
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              指标
            </button>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-[#172033] font-semibold">有效订单金额</span>
          </nav>

          {/* Title & Lightweight Status Badges */}
          <div className="flex items-center space-x-3 pt-0.5">
            <h1 className="text-lg font-bold text-[#172033] tracking-tight flex items-center space-x-2">
              <span>修改指标 · 有效订单金额</span>
            </h1>
            
            {/* Status Badge: 修改草稿 */}
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
              <span>修改草稿</span>
            </span>

            {/* Version Transition Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
              <span className="text-[#64748B]">当前版本:</span>
              <span className="font-semibold text-[#0F172A]">v1.2</span>
              <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
              <span className="text-[#64748B]">目标版本:</span>
              <span className="font-semibold text-[#2563EB]">v1.3 Draft</span>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-xs text-[#667085] leading-normal">
            基于正式指标有效订单金额（v1.2）创建修改草稿。任何正式 Metric 变化需通过 Semantic Diff、Validation 和 Owner Confirm 生效。
          </p>
        </div>

        {/* Right Actions: 保存草稿 + 已自动保存 */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <button
              onClick={handleSaveDraft}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#D0D5DD] hover:border-[#98A2B3] rounded-md text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#667085]" />
              <span>保存草稿</span>
            </button>
            <div className="text-[11px] text-[#94A3B8] mt-0.5 font-normal">
              已自动保存
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN BODY: LEFT SIDEBAR + 3-COLUMN WORKSPACE           */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ======================================================= */}
        {/* 2.1 LEFT PLATFORM NAVIGATION SIDEBAR (210px)            */}
        {/* ======================================================= */}
        <aside className="w-[210px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none overflow-y-auto">
          <div className="p-3 space-y-6">
            
            {/* Primary Platform Menus */}
            <div className="space-y-0.5">
              <button
                onClick={onNavigateToHome}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Bot className="w-4 h-4 text-[#64748B]" />
                <span>AI 工作台</span>
              </button>

              <button
                onClick={onNavigateToDataAssets}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#64748B]" />
                <span>数据资产</span>
              </button>

              <button
                onClick={onNavigateToDataStandards}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#64748B]" />
                <span>数据标准</span>
              </button>

              <button
                onClick={onNavigateToDataSemantics}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <FolderTree className="w-4 h-4 text-[#64748B]" />
                <span>数据语义</span>
              </button>
            </div>

            {/* Business Semantics Group */}
            <div className="space-y-1">
              <div className="px-3 text-[11px] font-bold text-[#94A3B8] tracking-wider uppercase">
                业务语义
              </div>
              
              <button
                onClick={onNavigateToBusinessObject}
                className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#FFFBEB]/70 hover:text-[#92400E] transition-colors cursor-pointer group"
              >
                <div className="w-5 h-5 rounded-md bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0">
                  <FolderTree className="w-3 h-3 text-[#D97706]" />
                </div>
                <span>业务对象</span>
              </button>

              <button
                onClick={onBackToRegistry}
                className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] transition-colors cursor-pointer shadow-2xs group"
              >
                <div className="w-5 h-5 rounded-md bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] shrink-0">
                  <BarChart3 className="w-3 h-3 text-[#7C3AED]" />
                </div>
                <span>指标</span>
              </button>
            </div>

            {/* Bottom Group */}
            <div className="pt-2 border-t border-[#F1F5F9] space-y-0.5">
              <button
                onClick={onNavigateToMarketplace}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#64748B]" />
                <span>服务超市</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ======================================================= */}
        {/* 2.2 CHANGE MODE THREE COLUMNS CONTAINER                  */}
        {/* ======================================================= */}
        <div className="flex-1 flex overflow-hidden bg-[#F7F9FC]">

          {/* ----------------------------------------------------- */}
          {/* COLUMN 1: LEFT · CHANGE CONTEXT (280px)               */}
          {/* ----------------------------------------------------- */}
          <div className="w-[280px] border-r border-[#E6EAF0] bg-[#FAFCFF] flex flex-col shrink-0 overflow-y-auto">
            <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
              
              <div className="space-y-6">
                {/* 1. 修改原因 */}
                <div className="space-y-2">
                  <h2 className="text-xs font-bold text-[#667085] tracking-wider uppercase flex items-center space-x-1.5">
                    <span>修改原因</span>
                  </h2>

                  {/* Clean Non-Chat Natural Language Input Area */}
                  <div className="p-3.5 bg-white border border-[#D0D5DD] rounded-md shadow-2xs space-y-2">
                    <textarea
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      rows={3}
                      className="w-full text-xs text-[#172033] bg-transparent border-0 resize-none focus:outline-none leading-relaxed placeholder:text-[#94A3B8]"
                      placeholder="输入本次指标修改的业务原因或口径调整描述..."
                    />
                    <div className="text-[10.5px] text-[#94A3B8] pt-1 border-t border-[#F1F5F9] flex items-center justify-between">
                      <span>自然语言描述修改诉求</span>
                      <span>已录入</span>
                    </div>
                  </div>
                </div>

                {/* 2. AI 理解 */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <h2 className="text-xs font-bold text-[#172033]">
                      AI 理解
                    </h2>
                  </div>

                  <div className="p-3.5 bg-white border border-[#E6EAF0] rounded-md shadow-2xs space-y-3.5 text-xs">
                    {/* Item 1: 修改类型 */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-[#667085]">
                        修改类型
                      </div>
                      <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]"></span>
                        <span>业务规则变化</span>
                      </div>
                    </div>

                    {/* Item 2: 影响范围 */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-[#667085]">
                        影响范围
                      </div>
                      <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                        <span>计算逻辑</span>
                      </div>
                    </div>

                    {/* Item 3: 版本判断 */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-[#667085]">
                        版本判断
                      </div>
                      <div className="font-bold text-[#172033] leading-snug">
                        预计产生新的 Metric Version
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#667085] leading-relaxed px-1">
                    系统已解析业务规则与度量计算差异，形成语义草稿，需通过验证后方可提交确认。
                  </div>
                </div>

                {/* 3. 修改类型确认选择 (支持系统判断与显式确认) */}
                <div className="space-y-2 pt-2 border-t border-[#EEF2F6]">
                  <div className="text-xs font-bold text-[#172033]">
                    变更类型判定
                  </div>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setChangeTypeSelection('semantic_change')}
                      className={`w-full p-2.5 rounded-md border text-left text-xs transition-all cursor-pointer ${
                        changeTypeSelection === 'semantic_change'
                          ? 'bg-[#F5F3FF] border-[#DDD6FE] text-[#6D28D9]'
                          : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>业务含义变化</span>
                        {changeTypeSelection === 'semantic_change' && (
                          <span className="text-[10px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.2 rounded">
                            当前生效
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#667085] mt-0.5">
                        产生 Metric Semantic Version (v1.2 → v1.3)
                      </div>
                    </button>

                    <button
                      onClick={() => setChangeTypeSelection('binding_change')}
                      className={`w-full p-2.5 rounded-md border text-left text-xs transition-all cursor-pointer ${
                        changeTypeSelection === 'binding_change'
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                          : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>数据实现变化</span>
                        {changeTypeSelection === 'binding_change' && (
                          <span className="text-[10px] font-bold bg-[#2563EB] text-white px-1.5 py-0.2 rounded">
                            已选择
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#667085] mt-0.5">
                        业务含义不变，仅更新 Binding Version
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Return */}
              <div className="pt-4 border-t border-[#EEF2F6]">
                <button
                  onClick={onBackToRegistry}
                  className="w-full py-2 px-3 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-xs font-semibold text-[#475569] transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>放弃修改并返回</span>
                </button>
              </div>

            </div>
          </div>

          {/* ----------------------------------------------------- */}
          {/* COLUMN 2: MIDDLE · CHANGE DRAFT (760 - 820px)          */}
          {/* ----------------------------------------------------- */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F7F9FC] p-6 lg:p-8">
            <div className="max-w-[800px] w-full mx-auto space-y-6">

              {/* Single Continuous White Document Sheet */}
              <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-xs overflow-hidden">
                
                {/* Document Header */}
                <div className="px-8 py-6 border-b border-[#EEF2F6] bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] tracking-wider uppercase">
                          Semantic Diff
                        </span>
                        <span className="text-xs text-[#667085]">
                          基于有效订单金额 v1.2
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[#172033] mt-1 tracking-tight">
                        修改草稿
                      </h2>
                    </div>
                  </div>
                  <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                    以下展示当前正式定义与修改后定义的差异。通过 Semantic Diff 清晰比对业务含义、计算关系、业务规则与数据实现的演进。
                  </p>
                </div>

                {/* Document Content Sections */}
                <div className="p-8 space-y-7 divide-y divide-[#EEF2F6] text-xs">

                  {/* Section 1: 业务含义 (Semantic Diff) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide">
                        业务含义
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]">
                        Business Meaning Changed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* 当前正式定义 */}
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-1.5">
                        <div className="text-[11px] font-bold text-[#64748B]">
                          当前正式定义
                        </div>
                        <div className="text-xs text-[#172033] font-medium leading-relaxed">
                          已支付订单金额
                        </div>
                      </div>

                      {/* 修改后定义 */}
                      <div className="p-3.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-lg space-y-1.5">
                        <div className="text-[11px] font-bold text-[#7C3AED]">
                          修改后定义
                        </div>
                        <div className="text-xs text-[#172033] font-bold leading-relaxed">
                          支付成功且未退款订单金额
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: 计算逻辑 (Calculation Diff) */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide">
                        计算逻辑
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                        Calculation Changed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* 当前计算公式 */}
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-1.5">
                        <div className="text-[11px] font-bold text-[#64748B]">
                          当前公式
                        </div>
                        <div className="p-2 bg-white rounded border border-[#CBD5E1] text-[#0F172A] font-mono text-xs font-semibold">
                          SUM(order_amount)
                        </div>
                      </div>

                      {/* 修改后计算公式 */}
                      <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg space-y-1.5">
                        <div className="text-[11px] font-bold text-[#2563EB]">
                          修改后公式
                        </div>
                        <div className="p-2 bg-white rounded border border-[#93C5FD] text-[#1E3A8A] font-mono text-xs font-semibold">
                          SUM(order_amount - refund_amount)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: 业务规则 (Business Rule Diff - 重点) */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide">
                        业务规则
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        Business Rule Changed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* 当前规则 */}
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#172033]">有效订单</span>
                          <span className="text-[10px] font-mono text-[#64748B] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                            当前规则
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] leading-relaxed">
                          支付成功订单
                        </p>
                      </div>

                      {/* 修改后规则 */}
                      <div className="p-3.5 bg-[#FFFBEB] border border-[#FCD34D] rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#92400E]">有效订单</span>
                          <span className="text-[10px] font-mono text-[#B45309] bg-white px-1.5 py-0.5 rounded border border-[#FDE68A]">
                            修改后规则
                          </span>
                        </div>
                        <p className="text-xs text-[#78350F] font-bold leading-relaxed">
                          支付成功且未退款订单
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: 时间语义 (Unchanged) */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide">
                        时间语义
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                        未变化
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-1">
                        <div className="text-[11px] font-bold text-[#64748B]">当前时间语义</div>
                        <div className="text-xs text-[#172033] font-medium">支付时间 (支持 日 / 月 / 季 / 年)</div>
                      </div>
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-1">
                        <div className="text-[11px] font-bold text-[#64748B]">修改后时间语义</div>
                        <div className="text-xs text-[#172033] font-medium">支付时间 (支持 日 / 月 / 季 / 年)</div>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: 数据实现 (Unchanged) */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide">
                        数据实现
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                        未变化
                      </span>
                    </div>

                    <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#172033]">
                          订单事实数据 (dwd_order_fact_di)
                        </div>
                        <button
                          onClick={() => setIsDataBindingDrawerOpen(true)}
                          className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-1"
                        >
                          <span>查看完整实现 →</span>
                        </button>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        当前 Binding 可以继续复用。仅在 SQL 生成引擎中动态注入「未退款」过滤条件。
                      </p>
                    </div>
                  </div>

                </div>

                {/* Document Footer */}
                <div className="px-8 py-4 bg-[#FAFCFF] border-t border-[#EEF2F6] flex items-center justify-between text-xs text-[#64748B]">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
                    <span>Semovix Semantic Diff Engine · 业务语义版本演进控制</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#94A3B8]">
                    ID: METRIC_CHANGE_2026_0820_003
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* ----------------------------------------------------- */}
          {/* COLUMN 3: RIGHT · CHANGE SUMMARY (320 - 360px)        */}
          {/* ----------------------------------------------------- */}
          <div className="w-[340px] border-l border-[#E6EAF0] bg-white flex flex-col shrink-0 overflow-y-auto">
            <div className="p-5 space-y-5 flex-1 flex flex-col justify-between">
              
              <div className="space-y-5">
                {/* 1. Header: 本次修改影响 */}
                <div>
                  <h2 className="text-sm font-bold text-[#172033]">
                    本次修改影响
                  </h2>
                  <div className="text-xs text-[#667085] mt-0.5">
                    变更范围与影响评估
                  </div>
                </div>

                {/* 2. Impact Breakdown Items */}
                <div className="space-y-2.5">
                  {/* Item 1: 业务含义 */}
                  <div className="p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">业务含义</span>
                      <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.2 rounded border border-[#DDD6FE]">
                        变化
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      指标定义发生变化。
                    </p>
                  </div>

                  {/* Item 2: 计算逻辑 */}
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">计算逻辑</span>
                      <span className="text-[10px] font-bold text-[#1D4ED8] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                        变化
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      计算规则发生变化。
                    </p>
                  </div>

                  {/* Item 3: 数据实现 */}
                  <div className="p-3 bg-[#FAFCFF] border border-[#E2E8F0] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">数据实现</span>
                      <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                        未变化
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      当前数据实现仍可复用。
                    </p>
                  </div>

                  {/* Item 4: 分析维度 */}
                  <div className="p-3 bg-[#FAFCFF] border border-[#E2E8F0] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">分析维度</span>
                      <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                        未变化
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      当前分析能力保持一致。
                    </p>
                  </div>
                </div>

                {/* 3. 版本影响 Section */}
                <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md space-y-2">
                  <div className="text-xs font-bold text-[#0F172A] flex items-center space-x-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>版本影响</span>
                  </div>
                  
                  <div className="p-2 bg-white rounded border border-[#E2E8F0] flex items-center justify-between font-mono text-xs">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-[#94A3B8]">当前版本</div>
                      <div className="font-bold text-[#475569]">Metric v1.2</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <div className="space-y-0.5 text-right">
                      <div className="text-[10px] text-[#2563EB]">修改后版本</div>
                      <div className="font-bold text-[#2563EB]">Metric v1.3 Draft</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    本次修改影响业务语义，将产生新的指标版本。
                  </p>
                </div>
              </div>

              {/* Bottom Action Area: 下一步操作 */}
              <div className="space-y-2 pt-4 border-t border-[#EEF2F6]">
                <button
                  onClick={handleRunValidation}
                  className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-md shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>运行验证</span>
                </button>

                <button
                  onClick={() => {
                    if (addToast) addToast('info', '继续修改', '已开启指标草稿口径继续编辑');
                  }}
                  className="w-full py-1.5 px-3 bg-white hover:bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1] rounded text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1"
                >
                  <span>继续修改</span>
                </button>

                <p className="text-[11px] text-[#667085] leading-relaxed text-center pt-1">
                  Change Draft 必须重新进入系统验证通过后，方可由 Owner 确认生效。
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. DRAWERS & MODALS                                       */}
      {/* ========================================================= */}

      {/* 3.1 DATA BINDING DRAWER */}
      {isDataBindingDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <DataBindingDrawer
            isOpen={isDataBindingDrawerOpen}
            onClose={() => setIsDataBindingDrawerOpen(false)}
            onAdjustBinding={() => {
              if (addToast) addToast('info', '调整数据绑定', '数据绑定已更新');
            }}
            onViewDataAsset={(assetName) => {
              if (addToast) addToast('info', '查看数据资产', `已定位数据资产「${assetName}」`);
            }}
            onViewBusinessRule={(ruleName) => {
              if (addToast) addToast('info', '查看业务规则', `已打开「${ruleName}」业务规则定义`);
            }}
            addToast={addToast}
          />
        </div>
      )}

      {/* 3.2 RUNNING VALIDATION MODAL */}
      {isValidatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 p-4">
          <div 
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E6EAF0] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#EEF2F6] flex items-center justify-between bg-[#FAFCFF]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                  {validationProgress < 100 ? (
                    <Play className="w-4 h-4 fill-current animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">
                    {validationProgress < 100 ? '正在执行 Change Draft 系统验证' : 'Change Draft 验证通过'}
                  </h3>
                  <p className="text-xs text-[#667085]">
                    {validationProgress < 100 ? '正在校验变更拓扑、业务规则 Semantic Diff 与底层 Binding' : '未发现阻断级语义冲突与计算错误'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#475569]">总体验证进度</span>
                  <span className="text-[#2563EB] font-mono">{validationProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#EEF2F6] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#2563EB] transition-all duration-300 rounded-full"
                    style={{ width: `${validationProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {validationSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-md border border-[#F1F5F9] bg-[#FAFCFF] text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      {step.status === 'passed' && <CheckCircle className="w-4 h-4 text-[#16A36A]" />}
                      {step.status === 'running' && <Play className="w-3.5 h-3.5 text-[#2563EB] fill-current animate-pulse" />}
                      {step.status === 'waiting' && <div className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1]" />}
                      <span className={`font-medium ${step.status === 'passed' ? 'text-[#172033]' : 'text-[#64748B]'}`}>
                        {step.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono">
                      {step.status === 'passed' && <span className="text-[#16A36A]">PASS</span>}
                      {step.status === 'running' && <span className="text-[#2563EB]">校验中</span>}
                      {step.status === 'waiting' && <span className="text-[#94A3B8]">等待</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex items-center justify-end space-x-3">
              {validationProgress < 100 ? (
                <button
                  disabled
                  className="px-4 py-2 bg-[#F1F5F9] text-[#94A3B8] font-bold text-xs rounded-md cursor-not-allowed"
                >
                  正在验证中...
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsValidatingModalOpen(false);
                    if (addToast) {
                      addToast('info', '验证通过', '已具备 Owner Confirm 条件');
                    }
                  }}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  完成并查看验证证明
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
