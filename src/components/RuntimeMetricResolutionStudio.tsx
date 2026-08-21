import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Database,
  Calendar,
  Layers,
  Code,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  FileText,
  Clock,
  ChevronRight,
  Network,
  Cpu,
  Lock,
  Tag,
  MapPin,
  X,
  Play,
  Terminal,
  FileCode,
  FileCheck,
  TrendingUp,
  Sliders,
  Maximize2
} from 'lucide-react';
import { MetricExecutionContext, ResolvedMetricExecution } from '../types';
import { parseNaturalLanguageQuery, resolveMetricExecution } from '../utils/runtimeMetricResolver';

interface RuntimeMetricResolutionStudioProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMetricId?: string;
  initialMetricName?: string;
  initialQuestion?: string;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const PRESET_TEST_CASES = [
  {
    id: 'case_01',
    title: '查看今年华东地区各渠道有效订单金额',
    tag: 'READY_TO_EXECUTE · 全链路就绪',
    query: '查看今年华东地区各渠道有效订单金额',
    desc: '全项通过：标准指标、合法业务范围、安全拓扑维度、健康物理绑定与合法权限'
  },
  {
    id: 'case_02',
    title: '跨业务域查询未授权范围订单数据',
    tag: 'BLOCKED_BY_SCOPE · 范围不匹配',
    query: '跨业务域查询未授权范围订单数据',
    desc: '阻断模拟：业务范围跨域超出指标定义范围，触发 BLOCKED_BY_SCOPE'
  },
  {
    id: 'case_03',
    title: '按天气运势和宇宙能量统计有效订单',
    tag: 'BLOCKED_BY_CONTEXT · 维度非法',
    query: '按天气运势和宇宙能量统计本月有效订单',
    desc: '阻断模拟：请求维度在语义拓扑中不存在映射路径，触发 BLOCKED_BY_CONTEXT'
  },
  {
    id: 'case_04',
    title: '统计上个月工单投诉率 (底层字段变更)',
    tag: 'BLOCKED_BY_BINDING · 物理绑定异常',
    query: '统计上个月工单投诉率',
    desc: '阻断模拟：物理字段变更（ticket_type 改名），触发 BLOCKED_BY_BINDING'
  },
  {
    id: 'case_05',
    title: '未授权用户匿名查询核心交易数据',
    tag: 'BLOCKED_BY_PERMISSION · 权限未授权',
    query: '未授权用户匿名查询核心交易订单金额',
    desc: '阻断模拟：当前用户缺少资产访问审批权限，触发 BLOCKED_BY_PERMISSION'
  },
  {
    id: 'case_06',
    title: '模糊查询未知名词概念数据',
    tag: 'AMBIGUOUS · 指标歧义',
    query: '模糊查询一些未知名词概念数据',
    desc: '阻断模拟：提问未唯一定位到已发布的标准指标定义，触发 AMBIGUOUS'
  }
];

export const RuntimeMetricResolutionStudio: React.FC<RuntimeMetricResolutionStudioProps> = ({
  isOpen = true,
  onClose,
  initialMetricId = 'met_valid_order_amount',
  initialMetricName = '有效订单金额',
  initialQuestion = '查看今年华东地区各渠道有效订单金额',
  addToast
}) => {
  const [inputQuery, setInputQuery] = useState<string>(initialQuestion);
  const [activeTab, setActiveTab] = useState<'plan' | 'dimensions_time' | 'filters_security' | 'evidence' | 'raw_json'>('plan');
  const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Computed resolution result
  const [resolutionResult, setResolutionResult] = useState<ResolvedMetricExecution>(() => {
    const initialContext = parseNaturalLanguageQuery(initialQuestion, initialMetricId);
    return resolveMetricExecution(initialContext);
  });

  // Re-run resolution
  const handleRunResolution = (queryToRun?: string) => {
    const q = queryToRun !== undefined ? queryToRun : inputQuery;
    setIsResolving(true);
    setTimeout(() => {
      const context = parseNaturalLanguageQuery(q, initialMetricId);
      const res = resolveMetricExecution(context);
      setResolutionResult(res);
      setIsResolving(false);
      if (addToast) {
        if (res.status === 'READY_TO_EXECUTE') {
          addToast('success', '运行时解析成功', `已成功解析「${res.metric.name}」的完整执行上下文并生成安全执行计划`);
        } else {
          addToast('error', '运行时解析检测到异常', res.diagnostics[0]?.message || '检测到底层绑定或权限异常');
        }
      }
    }, 280);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast?.('success', '已复制到剪贴板', text.length > 50 ? `${text.substring(0, 50)}...` : text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rawJsonString = useMemo(() => {
    return JSON.stringify(resolutionResult, null, 2);
  }, [resolutionResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-[#E2E8F0] flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ========================================================= */}
        {/* Header                                                    */}
        {/* ========================================================= */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#60A5FA]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  运行时指标解析验证 (Runtime Metric Resolution Engine)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Semantic Engine Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                User Question → Metric Resolution → Context Validation → Binding Resolution → Execution Plan
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleRunResolution()}
              disabled={isResolving}
              className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResolving ? 'animate-spin' : ''}`} />
              <span>{isResolving ? '解析中...' : '重新解析执行'}</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* Top Input & Presets Bar                                   */}
        {/* ========================================================= */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] space-y-3 shrink-0">
          
          {/* Natural Language Query Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
              </div>
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunResolution()}
                placeholder="输入自然语言业务问数意图，例如：查看今年华东地区各渠道有效订单金额..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent placeholder-[#94A3B8] shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRunResolution()}
              disabled={isResolving}
              className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>运行解析</span>
            </button>
          </div>

          {/* Preset Cases Strip */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-[#64748B] shrink-0">典型测试意图：</span>
            {PRESET_TEST_CASES.map((tc) => (
              <button
                key={tc.id}
                type="button"
                onClick={() => {
                  setInputQuery(tc.query);
                  handleRunResolution(tc.query);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border shrink-0 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  inputQuery === tc.query
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] shadow-2xs'
                    : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                }`}
              >
                <span>{tc.title}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/80 text-[#64748B] border border-slate-200">
                  {tc.tag}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5-Stage Connected Pipeline Visualizer                     */}
        {/* ========================================================= */}
        <div className="px-6 py-3.5 bg-white border-b border-[#EEF2F6] shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
            {resolutionResult.pipelineStages.map((stage, idx) => {
              const isPassed = stage.status === 'PASSED';
              const isWarning = stage.status === 'WARNING';
              const isFailed = stage.status === 'FAILED';
              const isSelected = selectedStageIndex === idx;

              return (
                <div
                  key={stage.stageId}
                  onClick={() => setSelectedStageIndex(isSelected ? null : idx)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'ring-2 ring-[#2563EB] border-transparent shadow-xs'
                      : 'hover:border-[#CBD5E1]'
                  } ${
                    isFailed
                      ? 'bg-[#FEF2F2] border-[#FECACA]'
                      : isWarning
                      ? 'bg-[#FFFBEB] border-[#FDE68A]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#64748B]">STEP 0{idx + 1}</span>
                    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isFailed
                        ? 'bg-red-100 text-red-700'
                        : isWarning
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isFailed ? 'FAILED' : isWarning ? 'WARNING' : 'PASSED'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#0F172A] truncate">
                    {stage.stageName.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-[#64748B] truncate mt-0.5">
                    耗时 {stage.durationMs}ms
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Stage Detail Expand (if clicked) */}
          {selectedStageIndex !== null && (
            <div className="mt-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155] animate-in fade-in">
              <div className="flex items-center justify-between font-bold text-[#0F172A] mb-1">
                <span>{resolutionResult.pipelineStages[selectedStageIndex].stageName}</span>
                <span className="text-[11px] font-normal text-[#64748B]">
                  执行耗时：{resolutionResult.pipelineStages[selectedStageIndex].durationMs}ms
                </span>
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed">
                {resolutionResult.pipelineStages[selectedStageIndex].summary}
              </p>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* Main Content Area (Tabs & Inspectors)                     */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
          
          {/* Sub Navigation Tabs */}
          <div className="px-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
            <div className="flex space-x-1">
              {[
                { id: 'plan', label: '📋 执行计划与安全 SQL', count: resolutionResult.executionPlan.steps.length },
                { id: 'dimensions_time', label: '🔍 维度拓扑与时态映射', count: resolutionResult.validatedDimensions.length },
                { id: 'filters_security', label: '🛡️ 过滤组合与权限控制', count: resolutionResult.resolvedFilters.businessRuleFilters.length + resolutionResult.resolvedFilters.userContextFilters.length },
                { id: 'evidence', label: '📜 依据规范与审计追溯', badge: '100% Verified' },
                { id: 'raw_json', label: '{ } 原始契约 JSON', badge: 'Contract Output' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    activeTab === tab.id
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#F1F5F9] text-[#475569]">
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Resolution Status Indicator */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#64748B] font-medium">契约状态：</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                resolutionResult.status === 'READY_TO_EXECUTE'
                  ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                  : resolutionResult.status === 'AMBIGUOUS'
                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                  : resolutionResult.status === 'BLOCKED_BY_SCOPE'
                  ? 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]'
                  : resolutionResult.status === 'BLOCKED_BY_CONTEXT'
                  ? 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]'
                  : resolutionResult.status === 'BLOCKED_BY_PERMISSION'
                  ? 'bg-[#FFE4E6] text-[#9F1239] border border-[#FECDD3]'
                  : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
              }`}>
                {resolutionResult.status === 'READY_TO_EXECUTE' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#16A36A]" />
                    READY_TO_EXECUTE (就绪可执行)
                  </>
                ) : resolutionResult.status === 'AMBIGUOUS' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#D97706]" />
                    AMBIGUOUS (指标意图歧义)
                  </>
                ) : resolutionResult.status === 'BLOCKED_BY_SCOPE' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#9333EA]" />
                    BLOCKED_BY_SCOPE (业务范围不匹配)
                  </>
                ) : resolutionResult.status === 'BLOCKED_BY_CONTEXT' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#EA580C]" />
                    BLOCKED_BY_CONTEXT (维度/时态不合法)
                  </>
                ) : resolutionResult.status === 'BLOCKED_BY_PERMISSION' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#E11D48]" />
                    BLOCKED_BY_PERMISSION (数据权限不足)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#DC2626]" />
                    BLOCKED_BY_BINDING (物理绑定异常)
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Tab Content Panels (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* ======================================================= */}
            {/* TAB 1: Execution Plan & Safe SQL                        */}
            {/* ======================================================= */}
            {activeTab === 'plan' && (
              <div className="space-y-6">
                
                {/* Diagnostics Banner if any */}
                {resolutionResult.diagnostics.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                    <div className="font-bold flex items-center space-x-2 text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>诊断提示与阻断原因 ({resolutionResult.diagnostics.length} 项)</span>
                    </div>
                    {resolutionResult.diagnostics.map((d, i) => (
                      <div key={i} className="pl-6 space-y-0.5">
                        <div className="font-semibold">{d.message}</div>
                        {d.remediation && (
                          <div className="text-[11px] text-amber-700">建议操作：{d.remediation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Engine Stats Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-1 shadow-2xs">
                    <div className="text-[11px] text-[#64748B] font-bold">目标计算引擎</div>
                    <div className="font-mono font-bold text-[#0F172A] text-sm">
                      {resolutionResult.executionPlan.executionEngine}
                    </div>
                  </div>
                  <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-1 shadow-2xs">
                    <div className="text-[11px] text-[#64748B] font-bold">预估扫描行数</div>
                    <div className="font-bold text-[#0F172A] text-sm">
                      {resolutionResult.executionPlan.estimatedCost.rowsScanned}
                    </div>
                  </div>
                  <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-1 shadow-2xs">
                    <div className="text-[11px] text-[#64748B] font-bold">预估执行耗时</div>
                    <div className="font-bold text-[#16A36A] text-sm">
                      {resolutionResult.executionPlan.estimatedCost.latencyEstimate}
                    </div>
                  </div>
                  <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-1 shadow-2xs">
                    <div className="text-[11px] text-[#64748B] font-bold">基础汇总粒度</div>
                    <div className="font-semibold text-[#0F172A] text-sm">
                      {resolutionResult.executionPlan.grainLevel}
                    </div>
                  </div>
                </div>

                {/* Operator Execution Flow */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 shadow-2xs">
                  <div className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Network className="w-4 h-4 text-[#2563EB]" />
                      <span>算子执行计划流 (Operator Execution Pipeline)</span>
                    </div>
                    <span className="text-[11px] text-[#64748B]">按算子拓扑顺序执行</span>
                  </div>

                  <div className="space-y-2.5">
                    {resolutionResult.executionPlan.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg flex items-start space-x-3 text-xs"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold flex items-center justify-center shrink-0 text-xs border border-[#BFDBFE]">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F172A]">{step.title}</span>
                            <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#E2E8F0] text-[#475569]">
                              {step.operation}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated Safe SQL Block */}
                <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-md">
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Terminal className="w-4 h-4 text-[#60A5FA]" />
                      <span className="font-mono font-bold">Generated Safe Semantic SQL</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(resolutionResult.executionPlan.generatedSql, 'sql')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      {copiedKey === 'sql' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">已复制 SQL</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制 SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-emerald-400/90 overflow-x-auto leading-relaxed max-h-72">
                    <code>{resolutionResult.executionPlan.generatedSql}</code>
                  </pre>
                </div>

                {/* Safety Guarantees */}
                <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl text-xs space-y-2">
                  <div className="font-bold text-[#166534] flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
                    <span>运行时安全保障与合规校验</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#15803D]">
                    {resolutionResult.executionPlan.safetyGuarantees.map((g, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5">
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================= */}
            {/* TAB 2: Validated Dimensions & Time Mapping              */}
            {/* ======================================================= */}
            {activeTab === 'dimensions_time' && (
              <div className="space-y-6">
                
                {/* Validated Dimensions Section */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-[#2563EB]" />
                      <h3 className="text-xs font-bold text-[#0F172A]">已验证分析维度 (Validated Dimensions)</h3>
                    </div>
                    <span className="text-[11px] text-[#64748B]">
                      共 {resolutionResult.validatedDimensions.length} 个维度已通过拓扑安全校验
                    </span>
                  </div>

                  <div className="border border-[#EEF2F6] rounded-lg overflow-hidden divide-y divide-[#EEF2F6] text-xs">
                    {resolutionResult.validatedDimensions.map((dim, idx) => (
                      <div key={idx} className="p-3.5 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#0F172A] text-sm">{dim.name}</span>
                            <span className="text-[#64748B] text-xs font-mono">({dim.attr})</span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              dim.pathType === 'DIRECT'
                                ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                                : 'bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]'
                            }`}>
                              {dim.pathType === 'DIRECT' ? '直接映射 (Direct Mapping)' : '跨对象关系路径 (Relationship Path)'}
                            </span>
                          </div>

                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
                            <Check className="w-3 h-3 mr-0.5" />
                            {dim.securityStatus} (安全无环)
                          </span>
                        </div>

                        {dim.pathType === 'RELATIONSHIP' && dim.relationshipPath && (
                          <div className="p-2.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-md space-y-1">
                            <div className="text-[10px] font-bold text-[#7E22CE]">拓扑连接路径 (Join Graph Path):</div>
                            <div className="font-mono text-[11px] text-[#6B21A8] flex items-center space-x-1.5 overflow-x-auto">
                              {dim.relationshipPath.map((node, nIdx) => (
                                <React.Fragment key={nIdx}>
                                  <span className="bg-white px-2 py-0.5 rounded border border-[#D8B4FE]">{node}</span>
                                  {nIdx < dim.relationshipPath!.length - 1 && (
                                    <span className="text-[#A855F7]">→</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolved Time Mapping Section */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-[#16A36A]" />
                      <h3 className="text-xs font-bold text-[#0F172A]">时间语义与时态截断 (Resolved Time Semantics)</h3>
                    </div>
                    <span className="text-[11px] text-[#166534] font-bold bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0]">
                      时态已对齐 (Time Aligned)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                      <span className="text-[11px] font-bold text-[#64748B]">业务时间字段</span>
                      <div className="font-mono font-bold text-[#0F172A]">
                        {resolutionResult.resolvedTimeMapping.timeColumn}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {resolutionResult.resolvedTimeMapping.timeColumnComment}
                      </div>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                      <span className="text-[11px] font-bold text-[#64748B]">请求时间粒度</span>
                      <div className="font-bold text-[#2563EB]">
                        {resolutionResult.resolvedTimeMapping.requestedGrain} (按月分桶)
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        相对统计范围：{resolutionResult.resolvedTimeMapping.relativePeriodText}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                    <span className="text-[11px] font-bold text-[#64748B]">SQL 时态截断表达式 (Trunc SQL)</span>
                    <div className="font-mono text-xs text-[#0F172A] bg-white p-2.5 rounded border border-[#CBD5E1]">
                      {resolutionResult.resolvedTimeMapping.truncSqlExpression}
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                    <span className="text-[11px] font-bold text-[#64748B]">时间过滤谓词 (Time Filter Predicate)</span>
                    <div className="font-mono text-xs text-[#0F172A] bg-white p-2.5 rounded border border-[#CBD5E1]">
                      {resolutionResult.resolvedTimeMapping.timeFilterExpression}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================= */}
            {/* TAB 3: Resolved Filters & Security                      */}
            {/* ======================================================= */}
            {activeTab === 'filters_security' && (
              <div className="space-y-6">
                
                {/* Business Rule Filters (Mandatory) */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                      <h3 className="text-xs font-bold text-[#0F172A]">强制嵌入业务口径规则 (Business Rule Filters)</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-[#F5F3FF] text-[#7C3AED] px-2 py-0.5 rounded border border-[#DDD6FE]">
                      Mandatory (不可被上层覆盖)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {resolutionResult.resolvedFilters.businessRuleFilters.map((bf, idx) => (
                      <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1 text-xs">
                        <div className="font-bold text-[#0F172A]">{bf.description}</div>
                        <div className="font-mono text-xs text-[#2563EB] bg-white p-2 rounded border border-[#CBD5E1]">
                          {bf.expression}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Context Filters */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-[#2563EB]" />
                      <h3 className="text-xs font-bold text-[#0F172A]">用户上下文动态过滤 (User Context Filters)</h3>
                    </div>
                    <span className="text-[11px] text-[#64748B]">
                      {resolutionResult.resolvedFilters.userContextFilters.length} 项有效过滤
                    </span>
                  </div>

                  {resolutionResult.resolvedFilters.userContextFilters.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#94A3B8] bg-[#F8FAFC] rounded-lg border border-[#EEF2F6]">
                      无额外用户传入过滤条件，全量有效统计
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {resolutionResult.resolvedFilters.userContextFilters.map((uf, idx) => (
                        <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0F172A]">{uf.label || `${uf.field} ${uf.operator} ${uf.value}`}</span>
                          <span className="font-mono text-[11px] text-[#475569] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                            {uf.field} {uf.operator} '{uf.value}'
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Permission Requirements & RLS */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-[#EA580C]" />
                      <h3 className="text-xs font-bold text-[#0F172A]">权限策略与行级隔离 (RLS & Permissions)</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-[#FFF7ED] text-[#C2410C] px-2 py-0.5 rounded border border-[#FFEDD5]">
                      {resolutionResult.permissionRequirements.requiredSensitivityLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] font-bold text-[#64748B]">访问权限校验结果</span>
                      {resolutionResult.permissionRequirements.hasAccess ? (
                        <div className="font-bold text-[#16A36A] flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>权限校验通过 ({resolutionResult.permissionRequirements.userPermissionLevel})</span>
                        </div>
                      ) : (
                        <div className="font-bold text-[#DC2626] flex items-center space-x-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span>权限拦截 ({resolutionResult.permissionRequirements.userPermissionLevel})</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] font-bold text-[#64748B]">动态字段掩码脱敏</span>
                      <div className="font-mono text-xs text-[#0F172A]">
                        {resolutionResult.permissionRequirements.maskedFields.length > 0
                          ? resolutionResult.permissionRequirements.maskedFields.join(', ')
                          : '无敏感字段脱敏'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================= */}
            {/* TAB 4: Evidence Refs & Governance Lineage               */}
            {/* ======================================================= */}
            {activeTab === 'evidence' && (
              <div className="space-y-6">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileCheck className="w-4 h-4 text-[#2563EB]" />
                      <h3 className="text-xs font-bold text-[#0F172A]">规范依据与可信追溯 (Evidence & Governance Lineage)</h3>
                    </div>
                    <span className="text-[11px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0]">
                      语义可信度 {resolutionResult.evidenceRefs.semanticIntegrityScore}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] font-bold text-[#64748B]">治理制度规范</span>
                      <div className="font-bold text-[#0F172A]">{resolutionResult.evidenceRefs.ruleStandardDoc}</div>
                    </div>
                    <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] font-bold text-[#64748B]">契约规范版本</span>
                      <div className="font-bold text-[#0F172A]">{resolutionResult.evidenceRefs.dataGovernanceSpec}</div>
                    </div>
                    <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] font-bold text-[#64748B]">生效版本血缘</span>
                      <div className="font-mono text-xs text-[#2563EB] font-bold">{resolutionResult.evidenceRefs.activeVersionLineage}</div>
                    </div>
                    <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] font-bold text-[#64748B]">验证责任人与时间</span>
                      <div className="text-xs text-[#0F172A]">{resolutionResult.evidenceRefs.verifiedBy} ｜ {resolutionResult.evidenceRefs.verifiedAt}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================= */}
            {/* TAB 5: Raw JSON Contract                                */}
            {/* ======================================================= */}
            {activeTab === 'raw_json' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0F172A] flex items-center space-x-1.5">
                    <FileCode className="w-4 h-4 text-[#2563EB]" />
                    <span>ResolvedMetricExecution 契约对象完整输出</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(rawJsonString, 'raw_json')}
                    className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'raw_json' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>已复制 JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>复制完整 JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-4 shadow-md">
                  <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-96">
                    <code>{rawJsonString}</code>
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ========================================================= */}
        {/* Footer Bar                                                */}
        {/* ========================================================= */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E2E8F0] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2 text-[#64748B]">
            <span>Resolution ID:</span>
            <span className="font-mono font-bold text-[#0F172A]">{resolutionResult.resolutionId}</span>
            <span>·</span>
            <span>耗时总计:</span>
            <span className="font-bold text-[#16A36A]">
              {resolutionResult.pipelineStages.reduce((acc, s) => acc + s.durationMs, 0)}ms
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-bold rounded-lg transition-colors cursor-pointer"
              >
                关闭
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                handleCopy(resolutionResult.executionPlan.generatedSql, 'sql');
              }}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>复制 Safe SQL 并在引擎执行</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
