import React, { useState, useMemo, useEffect } from 'react';
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
  ArrowDown,
  Tag,
  Code2,
  RefreshCw,
  Sliders,
  CheckCheck
} from 'lucide-react';
import { DataBindingDrawer } from './DataBindingDrawer';
import { BusinessRuleDetailDrawer } from './BusinessRuleDetailDrawer';
import { metricRegistryService, CANONICAL_DOMAIN_METRICS } from '../data/metricRegistryData';
import { Metric } from '../types';

export interface MetricAuthoringChangeModeProps {
  metricId?: string;
  metric?: Metric;
  onBackToRegistry?: () => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToBusinessObject?: (objectId?: string) => void;
  onNavigateToDataStandards?: () => void;
  onNavigateToDataSemantics?: () => void;
  onNavigateToDataAssets?: () => void;
  onNavigateToMarketplace?: () => void;
  onNavigateToHome?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

/**
 * Calculates next semantic version number
 * e.g. "v1.2.0" -> "v1.3.0", "v1.2" -> "v1.3", "v1.0" -> "v1.1"
 */
function calculateNextDraftVersion(currentVersion?: string): { targetDraftVersion: string; targetEffectiveVersion: string } {
  if (!currentVersion) return { targetDraftVersion: 'v1.1.0 Draft', targetEffectiveVersion: 'v1.1.0' };
  
  const clean = currentVersion.replace(/^v/, '');
  const parts = clean.split('.');
  if (parts.length >= 2) {
    const major = parseInt(parts[0], 10) || 1;
    const minor = (parseInt(parts[1], 10) || 0) + 1;
    const patch = parts.length >= 3 ? 0 : undefined;
    const nextVer = patch !== undefined ? `v${major}.${minor}.${patch}` : `v${major}.${minor}`;
    return {
      targetDraftVersion: `${nextVer} Draft`,
      targetEffectiveVersion: nextVer,
    };
  }
  return {
    targetDraftVersion: `${currentVersion}.1 Draft`,
    targetEffectiveVersion: `${currentVersion}.1`,
  };
}

export const MetricAuthoringChangeMode: React.FC<MetricAuthoringChangeModeProps> = ({
  metricId = 'met_001',
  metric: propMetric,
  onBackToRegistry,
  onNavigateToMetricDetail,
  onNavigateToBusinessObject,
  onNavigateToDataStandards,
  onNavigateToDataSemantics,
  onNavigateToDataAssets,
  onNavigateToMarketplace,
  onNavigateToHome,
  addToast,
}) => {
  // Resolve base metric dynamically from registry or prop
  const targetMetric: Metric = useMemo(() => {
    if (propMetric) return propMetric;
    if (metricId) {
      const found = metricRegistryService.getMetricById(metricId);
      if (found) return found;
      if (metricId === 'res-03' || metricId === 'metric_001') {
        const m1 = metricRegistryService.getMetricById('met_001');
        if (m1) return m1;
      }
      const fuzzy = CANONICAL_DOMAIN_METRICS.find(
        (m) => m.id === metricId || m.name === metricId || m.enName === metricId
      );
      if (fuzzy) return fuzzy;
    }
    return metricRegistryService.getMetricById('met_001') || CANONICAL_DOMAIN_METRICS[0];
  }, [propMetric, metricId]);

  const baseVersion = targetMetric.version || 'v1.2.0';
  const { targetDraftVersion, targetEffectiveVersion } = useMemo(
    () => calculateNextDraftVersion(baseVersion),
    [baseVersion]
  );

  // Dynamic default change reason according to target metric
  const defaultChangeReason = useMemo(() => {
    if (targetMetric.id === 'met_001' || targetMetric.name.includes('老龄化')) {
      return '调整老龄化率常住人口基数范围与过滤条件，增加常住居留时长约束，排除短期流动人员。';
    }
    if (targetMetric.id === 'met_002' || targetMetric.name.includes('办结率')) {
      return '调整按期办结规则，对于法定节假日以及第三方协查暂停计时时间予以扣除。';
    }
    if (targetMetric.id === 'met_valid_order_amount' || targetMetric.name.includes('有效订单')) {
      return '调整有效订单定义，排除退款订单，使指标更符合订单经营分析口径。';
    }
    if (targetMetric.id === 'met_007' || targetMetric.name.includes('客单价')) {
      return '调整客单价口径，排除企业批量采购单以更准确衡量普通C端客户消费单价。';
    }
    if (targetMetric.id === 'met_008' || targetMetric.name.includes('投诉率')) {
      return '重新映射时间字段与投诉工单状态 Binding，修复物理层失效与口径漂移问题。';
    }
    if (targetMetric.id === 'met_009' || targetMetric.name.includes('复购率')) {
      return '将复购周期窗口从 90 天调整为 180 天，以匹配长周期耐用品品类特征。';
    }
    return `调整「${targetMetric.name}」业务统计口径与过滤规则，优化计算精度与分析准确度。`;
  }, [targetMetric.id, targetMetric.name]);

  // Dynamic default modified definition
  const defaultDraftDefinition = useMemo(() => {
    if (targetMetric.id === 'met_001' || targetMetric.name.includes('老龄化')) {
      return '指定统计范围和统计时点下，60 周岁及以上且在本区域居住满半年的常住人口占有效常住人口总数的比例，用于衡量区域人口老龄化程度与公共养老服务资源承载力。';
    }
    if (targetMetric.id === 'met_valid_order_amount' || targetMetric.name.includes('有效订单')) {
      return '满足“有效订单（支付成功且未发生全额退款）”业务规则的订单实付金额合计，用于衡量一定统计周期内形成的有效订单交易规模。';
    }
    if (targetMetric.id === 'met_002' || targetMetric.name.includes('办结率')) {
      return '扣除法定节假日与协查等待期后，在承诺时限内办结的工单数占应办结工单总数的比例。';
    }
    return `${targetMetric.definition} (调整统计约束与有效性边界)`;
  }, [targetMetric.id, targetMetric.name, targetMetric.definition]);

  // Dynamic default modified formula
  const defaultDraftFormula = useMemo(() => {
    if (targetMetric.id === 'met_001' || targetMetric.name.includes('老龄化')) {
      return '老年人口数(居住>=6个月) ÷ 常住人口数 × 100%';
    }
    if (targetMetric.id === 'met_valid_order_amount' || targetMetric.name.includes('有效订单')) {
      return 'SUM(pay_amount - refund_amount)';
    }
    if (targetMetric.id === 'met_002' || targetMetric.name.includes('办结率')) {
      return 'SUM(CASE WHEN finish_time <= due_time_adjusted THEN 1 ELSE 0 END) / COUNT(ticket_id)';
    }
    if (targetMetric.measurement?.formula) {
      return `${targetMetric.measurement.formula} [已调整约束]`;
    }
    return `SUM(${targetMetric.binding?.measureField || 'amount'}) [已调整约束]`;
  }, [targetMetric.id, targetMetric.name, targetMetric.measurement, targetMetric.binding]);

  // Dynamic default modified rule
  const defaultDraftRule = useMemo(() => {
    if (targetMetric.id === 'met_001' || targetMetric.name.includes('老龄化')) {
      return 'resident_status = 1 AND residence_months >= 6 AND is_cancelled = 0';
    }
    if (targetMetric.id === 'met_valid_order_amount' || targetMetric.name.includes('有效订单')) {
      return 'order_status = 2 AND pay_status = 1 AND is_refund = 0';
    }
    if (targetMetric.id === 'met_002' || targetMetric.name.includes('办结率')) {
      return "ticket_status IN ('CLOSED', 'ARCHIVED') AND overtime_flag = 0";
    }
    return `${targetMetric.binding?.businessRuleFilter || 'status = 1'} AND valid_flag = 1`;
  }, [targetMetric.id, targetMetric.name, targetMetric.binding]);

  // Change Reason input state
  const [changeReason, setChangeReason] = useState<string>(defaultChangeReason);
  // Draft Definition editable state
  const [draftDefinition, setDraftDefinition] = useState<string>(defaultDraftDefinition);
  // Draft Formula editable state
  const [draftFormula, setDraftFormula] = useState<string>(defaultDraftFormula);
  // Draft Rule filter state
  const [draftRule, setDraftRule] = useState<string>(defaultDraftRule);

  // Sync state when target metric changes
  useEffect(() => {
    setChangeReason(defaultChangeReason);
    setDraftDefinition(defaultDraftDefinition);
    setDraftFormula(defaultDraftFormula);
    setDraftRule(defaultDraftRule);
    setValidationState('UNVERIFIED');
  }, [defaultChangeReason, defaultDraftDefinition, defaultDraftFormula, defaultDraftRule]);

  // Change Type determination state
  const [changeTypeSelection, setChangeTypeSelection] = useState<'semantic_change' | 'binding_change'>('semantic_change');

  // Drawers & Modals
  const [isDataBindingDrawerOpen, setIsDataBindingDrawerOpen] = useState<boolean>(false);
  const [isBusinessRuleDrawerOpen, setIsBusinessRuleDrawerOpen] = useState<boolean>(false);
  const [isValidatingModalOpen, setIsValidatingModalOpen] = useState<boolean>(false);
  const [isOwnerConfirmModalOpen, setIsOwnerConfirmModalOpen] = useState<boolean>(false);
  
  // Validation state: 'UNVERIFIED' | 'RUNNING' | 'PASSED'
  const [validationState, setValidationState] = useState<'UNVERIFIED' | 'RUNNING' | 'PASSED'>('UNVERIFIED');
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [validationSteps, setValidationSteps] = useState<
    Array<{ name: string; status: 'waiting' | 'running' | 'passed' | 'failed' }>
  >([
    { name: '业务定义完整性校验', status: 'waiting' },
    { name: '数据实现有效性校验', status: 'waiting' },
    { name: '时间口径一致性校验', status: 'waiting' },
    { name: '分析维度相容性证明', status: 'waiting' },
    { name: 'SQL执行计划生成验证', status: 'waiting' },
  ]);

  // Handle Save Draft
  const handleSaveDraft = () => {
    if (addToast) {
      addToast(
        'success',
        '修改草稿已保存',
        `「${targetMetric.name}」${targetDraftVersion} 已同步保存至企业业务语义版本库`
      );
    }
  };

  // Handle Run Validation
  const handleRunValidation = () => {
    setValidationState('RUNNING');
    setIsValidatingModalOpen(true);
    setValidationProgress(15);
    setValidationSteps([
      { name: '业务定义完整性校验', status: 'running' },
      { name: '数据实现有效性校验', status: 'waiting' },
      { name: '时间口径一致性校验', status: 'waiting' },
      { name: '分析维度相容性证明', status: 'waiting' },
      { name: 'SQL执行计划生成验证', status: 'waiting' },
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
    }, 500);

    setTimeout(() => {
      setValidationProgress(65);
      setValidationSteps((prev) => [
        prev[0],
        { ...prev[1], status: 'passed' },
        { ...prev[2], status: 'running' },
        prev[3],
        prev[4],
      ]);
    }, 1000);

    setTimeout(() => {
      setValidationProgress(85);
      setValidationSteps((prev) => [
        prev[0],
        prev[1],
        { ...prev[2], status: 'passed' },
        { ...prev[3], status: 'passed' },
        { ...prev[4], status: 'running' },
      ]);
    }, 1500);

    setTimeout(() => {
      setValidationProgress(100);
      setValidationSteps((prev) => [
        prev[0],
        prev[1],
        prev[2],
        prev[3],
        { ...prev[4], status: 'passed' },
      ]);
      setValidationState('PASSED');
      if (addToast) {
        addToast('success', '变更验证通过', `Change Draft (${targetDraftVersion}) 已通过全部语义与数据实现安全性证明`);
      }
    }, 2000);
  };

  // Handle Owner Confirm Publication
  const handleOwnerConfirm = () => {
    setIsOwnerConfirmModalOpen(false);
    
    if (addToast) {
      addToast(
        'success',
        '指标新版本已确认生效',
        `「${targetMetric.name}」新版本（${targetEffectiveVersion}）已正式发布生效，并已更新至 Metric Registry`
      );
    }

    if (onNavigateToMetricDetail) {
      onNavigateToMetricDetail(targetMetric.id);
    } else if (onBackToRegistry) {
      onBackToRegistry();
    }
  };

  const getBoId = (bo: string) => {
    if (bo === '自然人' || bo === '人口') return 'bo_person';
    if (bo === '服务工单' || bo === '工单') return 'bo_ticket';
    if (bo === '企业') return 'bo_corp';
    if (bo === '客户') return 'bo_customer';
    return 'bo_order';
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
            <button
              onClick={() => onNavigateToMetricDetail?.(targetMetric.id)}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              {targetMetric.name}
            </button>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-[#172033] font-semibold">修改草稿</span>
          </nav>

          {/* Title & Lightweight Status Badges */}
          <div className="flex items-center space-x-3 pt-0.5">
            <h1 className="text-lg font-bold text-[#172033] tracking-tight flex items-center space-x-2">
              <span>修改指标 · {targetMetric.name}</span>
            </h1>
            
            {/* Status Badge: 修改草稿 */}
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
              <span>修改草稿</span>
            </span>

            {/* Version Transition Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
              <span className="text-[#64748B]">当前版本:</span>
              <span className="font-semibold text-[#0F172A]">{baseVersion}</span>
              <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
              <span className="text-[#64748B]">目标草稿:</span>
              <span className="font-semibold text-[#2563EB]">{targetDraftVersion}</span>
            </div>

            {/* Validation Badge */}
            {validationState === 'PASSED' && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0] flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
                <span>验证通过</span>
              </span>
            )}
          </div>

          {/* Subtitle */}
          <p className="text-xs text-[#667085] leading-normal">
            基于正式指标「{targetMetric.name}」（{baseVersion}）创建修改草稿。任何正式 Metric 变化需通过 Semantic Diff、Validation 和 Owner Confirm 生效。
          </p>
        </div>

        {/* Right Actions: 保存草稿 + 已自动保存 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateToMetricDetail?.(targetMetric.id) || onBackToRegistry?.()}
            className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#475569] border border-[#D0D5DD] rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            返回详情
          </button>
          
          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#D0D5DD] hover:border-[#98A2B3] rounded-md text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#667085]" />
            <span>保存草稿</span>
          </button>
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
                onClick={() => onNavigateToBusinessObject?.(getBoId(targetMetric.businessObject))}
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
          <div className="w-[290px] border-r border-[#E6EAF0] bg-[#FAFCFF] flex flex-col shrink-0 overflow-y-auto">
            <div className="p-5 space-y-5 flex-1 flex flex-col justify-between">
              
              <div className="space-y-5">
                {/* 1. 修改原因 */}
                <div className="space-y-2">
                  <h2 className="text-xs font-bold text-[#667085] tracking-wider uppercase flex items-center justify-between">
                    <span>修改原因</span>
                    <span className="text-[10px] text-[#94A3B8] font-normal font-mono">必填</span>
                  </h2>

                  {/* Clean Non-Chat Natural Language Input Area */}
                  <div className="p-3 bg-white border border-[#D0D5DD] rounded-lg shadow-2xs space-y-2">
                    <textarea
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      rows={3}
                      className="w-full text-xs text-[#172033] bg-transparent border-0 resize-none focus:outline-none leading-relaxed placeholder:text-[#94A3B8]"
                      placeholder="输入本次指标修改的业务原因或口径调整描述..."
                    />
                    <div className="text-[10.5px] text-[#94A3B8] pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between">
                      <span>自然语言描述修改诉求</span>
                      <span className="text-[#16A36A] font-medium">已录入</span>
                    </div>
                  </div>
                </div>

                {/* 2. AI 理解 */}
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <h2 className="text-xs font-bold text-[#172033]">
                      AI 语义理解与推断
                    </h2>
                  </div>

                  <div className="p-3.5 bg-white border border-[#E6EAF0] rounded-lg shadow-2xs space-y-3 text-xs">
                    {/* Item 1: 修改类型 */}
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-semibold text-[#667085]">
                        修改性质
                      </div>
                      <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]"></span>
                        <span>业务规则与统计范围演进</span>
                      </div>
                    </div>

                    {/* Item 2: 关联实体 */}
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-semibold text-[#667085]">
                        业务对象与所属域
                      </div>
                      <div className="font-medium text-[#172033]">
                        {targetMetric.businessObject} · {targetMetric.scope?.businessDomain || '业务域'}
                      </div>
                    </div>

                    {/* Item 3: 版本判断 */}
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-semibold text-[#667085]">
                        版本演进策略
                      </div>
                      <div className="font-bold text-[#2563EB] leading-snug">
                        预计发布新版本：{targetEffectiveVersion}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#667085] leading-relaxed px-1">
                    系统已自动根据修改原因对比业务规则与度量计算差异，生成右侧 Semantic Diff 视图。
                  </p>
                </div>

                {/* 3. 修改类型确认选择 (支持系统判断与显式确认) */}
                <div className="space-y-2 pt-2 border-t border-[#EEF2F6]">
                  <div className="text-xs font-bold text-[#172033]">
                    变更类型判定
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setChangeTypeSelection('semantic_change')}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        changeTypeSelection === 'semantic_change'
                          ? 'bg-[#F5F3FF] border-[#DDD6FE] text-[#6D28D9] shadow-2xs'
                          : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>业务含义变化</span>
                        {changeTypeSelection === 'semantic_change' && (
                          <span className="text-[10px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.2 rounded">
                            主版本变更
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#667085] mt-1">
                        产生 Metric Semantic Version ({baseVersion} → {targetDraftVersion})
                      </div>
                    </button>

                    <button
                      onClick={() => setChangeTypeSelection('binding_change')}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        changeTypeSelection === 'binding_change'
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8] shadow-2xs'
                          : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>仅数据实现变化</span>
                        {changeTypeSelection === 'binding_change' && (
                          <span className="text-[10px] font-bold bg-[#2563EB] text-white px-1.5 py-0.2 rounded">
                            绑定变更
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#667085] mt-1">
                        业务含义不变，仅更新 Binding Version
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Return */}
              <div className="pt-4 border-t border-[#EEF2F6]">
                <button
                  onClick={() => onNavigateToMetricDetail?.(targetMetric.id) || onBackToRegistry?.()}
                  className="w-full py-2 px-3 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-xs font-semibold text-[#475569] transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>放弃修改并返回</span>
                </button>
              </div>

            </div>
          </div>

          {/* ----------------------------------------------------- */}
          {/* COLUMN 2: MIDDLE · CHANGE DRAFT & SEMANTIC DIFF        */}
          {/* ----------------------------------------------------- */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F7F9FC] p-6 lg:p-8">
            <div className="max-w-[840px] w-full mx-auto space-y-6">

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
                          基于正式指标「{targetMetric.name}」{baseVersion}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[#172033] mt-1 tracking-tight">
                        指标修改草稿对比
                      </h2>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setDraftDefinition(defaultDraftDefinition);
                          setDraftFormula(defaultDraftFormula);
                          setDraftRule(defaultDraftRule);
                          if (addToast) addToast('info', '已重置草稿', '已恢复至系统推荐的修改草稿定义');
                        }}
                        className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md border border-[#E2E8F0] transition-colors flex items-center space-x-1"
                        title="重置到推荐草稿"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>重置草稿</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                    以下展示当前正式定义与修改后草稿的详细差异。通过 Semantic Diff 清晰比对业务含义、计算关系、业务规则与数据实现的演进。
                  </p>
                </div>

                {/* Document Content Sections */}
                <div className="p-8 space-y-7 divide-y divide-[#EEF2F6] text-xs">

                  {/* Section 1: 业务含义 (Semantic Diff) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide flex items-center space-x-2">
                        <span>1. 业务含义</span>
                        <span className="text-[11px] text-[#64748B] font-normal font-mono">(Business Definition)</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]">
                        业务定义已调整
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* 当前正式定义 */}
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-1.5">
                        <div className="text-[11px] font-bold text-[#64748B] flex items-center justify-between">
                          <span>当前正式定义 ({baseVersion})</span>
                          <span className="text-[10px] text-[#94A3B8]">只读</span>
                        </div>
                        <div className="text-xs text-[#172033] font-normal leading-relaxed">
                          {targetMetric.definition}
                        </div>
                      </div>

                      {/* 修改后定义 */}
                      <div className="p-3.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-lg space-y-1.5">
                        <div className="text-[11px] font-bold text-[#7C3AED] flex items-center justify-between">
                          <span>修改后定义 ({targetDraftVersion})</span>
                          <span className="text-[10px] text-[#7C3AED] bg-white px-1 rounded border border-[#DDD6FE]">可编辑草稿</span>
                        </div>
                        <textarea
                          value={draftDefinition}
                          onChange={(e) => setDraftDefinition(e.target.value)}
                          rows={3}
                          className="w-full text-xs text-[#172033] font-medium leading-relaxed bg-white border border-[#DDD6FE] rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: 计算逻辑 (Calculation Diff) */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide flex items-center space-x-2">
                        <span>2. 计算逻辑与公式</span>
                        <span className="text-[11px] text-[#64748B] font-normal font-mono">(Calculation Logic)</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                        计算公式已演进
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* 当前计算公式 */}
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-1.5">
                        <div className="text-[11px] font-bold text-[#64748B]">
                          当前公式 ({baseVersion})
                        </div>
                        <div className="p-2 bg-white rounded border border-[#CBD5E1] text-[#0F172A] font-mono text-xs font-semibold">
                          {targetMetric.measurement?.formula || (targetMetric.measurement?.aggregation ? `${targetMetric.measurement.aggregation}(${targetMetric.binding?.measureField || 'field'})` : 'COUNT(*)')}
                        </div>
                        <div className="text-[10.5px] text-[#64748B]">
                          基础度量粒度: {targetMetric.measurement?.baseGrain || targetMetric.businessObject} · 聚合方式: {targetMetric.measurement?.aggregation || 'SUM'}
                        </div>
                      </div>

                      {/* 修改后计算公式 */}
                      <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg space-y-1.5">
                        <div className="text-[11px] font-bold text-[#2563EB] flex items-center justify-between">
                          <span>修改后公式 ({targetDraftVersion})</span>
                          <span className="text-[10px] text-[#2563EB] bg-white px-1 rounded border border-[#BFDBFE]">草稿</span>
                        </div>
                        <input
                          type="text"
                          value={draftFormula}
                          onChange={(e) => setDraftFormula(e.target.value)}
                          className="w-full p-2 bg-white rounded border border-[#93C5FD] text-[#1E3A8A] font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        />
                        <div className="text-[10.5px] text-[#2563EB]">
                          系统将基于新公式重新生成安全的 SQL 执行计划
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: 业务规则 (Business Rule Diff) */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide flex items-center space-x-2">
                        <span>3. 业务规则与过滤约束</span>
                        <span className="text-[11px] text-[#64748B] font-normal font-mono">(Business Rules & Filters)</span>
                      </h3>
                      <button
                        onClick={() => setIsBusinessRuleDrawerOpen(true)}
                        className="text-[11px] text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        <span>查看完整业务规则 →</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* 当前规则 */}
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#172033]">{targetMetric.name} 基础过滤</span>
                          <span className="text-[10px] font-mono text-[#64748B] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                            当前规则
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded border border-[#E2E8F0] font-mono text-xs text-[#475569]">
                          {targetMetric.binding?.businessRuleFilter || 'status = 1'}
                        </div>
                      </div>

                      {/* 修改后规则 */}
                      <div className="p-3.5 bg-[#FFFBEB] border border-[#FCD34D] rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#92400E]">{targetMetric.name} 修改后过滤</span>
                          <span className="text-[10px] font-mono text-[#B45309] bg-white px-1.5 py-0.5 rounded border border-[#FDE68A]">
                            修改后规则
                          </span>
                        </div>
                        <input
                          type="text"
                          value={draftRule}
                          onChange={(e) => setDraftRule(e.target.value)}
                          className="w-full p-2 bg-white rounded border border-[#FCD34D] font-mono text-xs text-[#78350F] font-bold focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: 时间语义 (Time Semantics) */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide flex items-center space-x-2">
                        <span>4. 时间语义</span>
                        <span className="text-[11px] text-[#64748B] font-normal font-mono">(Time Semantics)</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                        口径保持一致
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-1">
                        <div className="text-[11px] font-bold text-[#64748B]">当前时间语义</div>
                        <div className="text-xs text-[#172033] font-medium">
                          {targetMetric.timeSemantics?.businessTime || '业务时间'} ({targetMetric.timeSemantics?.type === 'SNAPSHOT' ? '快照时点' : '流动发生'}) · 支持 {(targetMetric.timeSemantics?.supportedGranularities || ['DAY', 'MONTH', 'YEAR']).join(' / ')}
                        </div>
                      </div>
                      <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-1">
                        <div className="text-[11px] font-bold text-[#64748B]">修改后时间语义</div>
                        <div className="text-xs text-[#172033] font-medium">
                          {targetMetric.timeSemantics?.businessTime || '业务时间'} ({targetMetric.timeSemantics?.type === 'SNAPSHOT' ? '快照时点' : '流动发生'}) · 支持 {(targetMetric.timeSemantics?.supportedGranularities || ['DAY', 'MONTH', 'YEAR']).join(' / ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: 数据实现 (Data Binding) */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide flex items-center space-x-2">
                        <span>5. 数据实现与物理绑定</span>
                        <span className="text-[11px] text-[#64748B] font-normal font-mono">(Data Binding)</span>
                      </h3>
                      <button
                        onClick={() => setIsDataBindingDrawerOpen(true)}
                        className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        <span>查看完整数据绑定 →</span>
                      </button>
                    </div>

                    <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#172033] flex items-center space-x-2">
                          <Database className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{targetMetric.binding?.dataAssetName || '数据资产表'}</span>
                          <span className="text-[11px] font-mono text-[#64748B]">({targetMetric.binding?.tableName || 'dwd_table'})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0]">
                          绑定健康 (HEALTHY)
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        当前物理表与度量字段（<code className="px-1 py-0.5 bg-white border border-[#CBD5E1] rounded text-[#0F172A] font-mono">{targetMetric.binding?.measureField || 'field'}</code>）可继续复用，引擎将在 SQL 生成时动态注入修改后的过滤规则。
                      </p>
                    </div>
                  </div>

                  {/* Section 6: 分析维度 (Analysis Dimensions) */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#172033] tracking-wide flex items-center space-x-2">
                        <span>6. 分析维度相容性</span>
                        <span className="text-[11px] text-[#64748B] font-normal font-mono">(Dimensions & Compatibility)</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0]">
                        5 维相容性 PASS
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {targetMetric.dimensions && targetMetric.dimensions.length > 0 ? (
                        targetMetric.dimensions.map((dim, idx) => {
                          const dimName = typeof dim === 'string' ? dim : (dim as any).name;
                          return (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-white border border-[#CBD5E1] text-[#334155] rounded-md text-xs font-medium flex items-center space-x-1.5 shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]"></span>
                              <span>{dimName}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-[#94A3B8]">默认继承业务对象的全部标准分析维度</span>
                      )}
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
                    DRAFT ID: METRIC_CHANGE_{targetMetric.id.toUpperCase()}_DRAFT
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* ----------------------------------------------------- */}
          {/* COLUMN 3: RIGHT · CHANGE SUMMARY & VALIDATION         */}
          {/* ----------------------------------------------------- */}
          <div className="w-[340px] border-l border-[#E6EAF0] bg-white flex flex-col shrink-0 overflow-y-auto">
            <div className="p-5 space-y-5 flex-1 flex flex-col justify-between">
              
              <div className="space-y-5">
                {/* 1. Header: 本次修改影响 */}
                <div>
                  <h2 className="text-sm font-bold text-[#172033]">
                    本次修改影响与评估
                  </h2>
                  <div className="text-xs text-[#667085] mt-0.5">
                    基于「{targetMetric.name}」变更范围评估
                  </div>
                </div>

                {/* 2. Impact Breakdown Items */}
                <div className="space-y-2.5">
                  {/* Item 1: 业务含义 */}
                  <div className="p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">业务含义</span>
                      <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.2 rounded border border-[#DDD6FE]">
                        语义变化
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      指标定义与统计边界发生变化，需告知下游使用者。
                    </p>
                  </div>

                  {/* Item 2: 计算逻辑 */}
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">计算逻辑</span>
                      <span className="text-[10px] font-bold text-[#1D4ED8] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                        规则演进
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      计算规则与过滤约束调整，将自动重构计算执行图。
                    </p>
                  </div>

                  {/* Item 3: 数据实现 */}
                  <div className="p-3 bg-[#FAFCFF] border border-[#E2E8F0] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">数据实现</span>
                      <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                        可复用
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      底层物理表和字段 Binding 继续复用。
                    </p>
                  </div>

                  {/* Item 4: 分析维度 */}
                  <div className="p-3 bg-[#FAFCFF] border border-[#E2E8F0] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">分析维度</span>
                      <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                        相容一致
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      支持下钻的全部分析维度保持相容。
                    </p>
                  </div>
                </div>

                {/* 3. 版本影响 Section */}
                <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-2">
                  <div className="text-xs font-bold text-[#0F172A] flex items-center space-x-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>版本演进路径</span>
                  </div>
                  
                  <div className="p-2.5 bg-white rounded-md border border-[#E2E8F0] flex items-center justify-between font-mono text-xs">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-[#94A3B8]">当前版本</div>
                      <div className="font-bold text-[#475569]">{baseVersion}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <div className="space-y-0.5 text-right">
                      <div className="text-[10px] text-[#2563EB]">目标发布版本</div>
                      <div className="font-bold text-[#2563EB]">{targetEffectiveVersion}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    本次修改影响业务语义，系统验证通过后将生成正式版本 <strong>{targetEffectiveVersion}</strong>。
                  </p>
                </div>
              </div>

              {/* Bottom Action Area: 运行验证 / Owner 确认生效 */}
              <div className="space-y-2.5 pt-4 border-t border-[#EEF2F6]">
                {validationState !== 'PASSED' ? (
                  <button
                    onClick={handleRunValidation}
                    className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>运行系统验证 (Run Validation)</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg text-xs text-[#16A36A] flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="font-bold">验证已通过，可确认生效</span>
                    </div>

                    <button
                      onClick={() => setIsOwnerConfirmModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-[#16A36A] hover:bg-[#15803D] text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Owner 确认生效 (Publish {targetEffectiveVersion})</span>
                    </button>

                    <button
                      onClick={handleRunValidation}
                      className="w-full py-1.5 px-3 bg-white hover:bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1] rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3 text-[#64748B]" />
                      <span>重新运行验证</span>
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-[#667085] leading-relaxed text-center pt-1">
                  Change Draft 必须通过系统语义与安全验证后，方可由 Owner 确认生效。
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
            metric={targetMetric}
            onViewDataAsset={(assetName) => {
              setIsDataBindingDrawerOpen(false);
              onNavigateToDataAssets?.();
            }}
            onViewBusinessRule={(ruleName) => {
              setIsBusinessRuleDrawerOpen(true);
            }}
            addToast={addToast}
          />
        </div>
      )}

      {/* 3.2 BUSINESS RULE DRAWER */}
      <BusinessRuleDetailDrawer
        isOpen={isBusinessRuleDrawerOpen}
        onClose={() => setIsBusinessRuleDrawerOpen(false)}
        ruleName={targetMetric.name}
        metric={targetMetric}
        addToast={addToast}
      />

      {/* 3.3 RUNNING VALIDATION MODAL */}
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
                    {validationProgress < 100 ? `正在执行「${targetMetric.name}」修改草稿系统验证` : '修改草稿系统验证全部通过'}
                  </h3>
                  <p className="text-xs text-[#667085]">
                    {validationProgress < 100 ? '正在校验变更拓扑、业务规则 Semantic Diff 与底层 Binding' : '未发现阻断级语义冲突与计算错误，已具备 Owner Confirm 生效条件'}
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
                      {step.status === 'passed' && <span className="text-[#16A36A] font-bold">PASS</span>}
                      {step.status === 'running' && <span className="text-[#2563EB] font-bold">校验中...</span>}
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

      {/* 3.4 OWNER CONFIRM MODAL */}
      {isOwnerConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 p-4">
          <div 
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E6EAF0] overflow-hidden animate-in zoom-in-95 duration-200 space-y-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 pb-3 border-b border-[#EEF2F6]">
              <div className="w-9 h-9 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#16A36A]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172033]">
                  确认生效指标新版本 ({targetEffectiveVersion})
                </h3>
                <p className="text-xs text-[#667085]">
                  Owner 确认与正式发布操作
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">指标名称:</span>
                  <span className="font-bold text-[#172033]">{targetMetric.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">版本变更:</span>
                  <span className="font-mono font-bold text-[#2563EB]">{baseVersion} → {targetEffectiveVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">所属域 / 对象:</span>
                  <span className="font-medium text-[#172033]">{targetMetric.scope?.businessDomain} · {targetMetric.businessObject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">修改原因:</span>
                  <span className="font-medium text-[#172033] line-clamp-1">{changeReason}</span>
                </div>
              </div>

              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[#1D4ED8] space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>生效说明：</span>
                </div>
                <p className="leading-relaxed">
                  确认发布后，新版本（<strong>{targetEffectiveVersion}</strong>）将在企业 Metric Registry 中正式生效，AI 问数、分析工作台与下游数据服务将自动使用新口径。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-[#EEF2F6]">
              <button
                type="button"
                onClick={() => setIsOwnerConfirmModalOpen(false)}
                className="px-3.5 py-2 rounded-md border border-[#D0D5DD] hover:bg-[#F8FAFC] text-xs font-medium text-[#475569] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleOwnerConfirm}
                className="px-5 py-2 rounded-md bg-[#16A36A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>确认并正式生效发布</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
