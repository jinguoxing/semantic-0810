import React, { useState } from 'react';
import {
  Compass,
  Layers,
  FileCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  Trash2,
  RotateCcw,
  Info,
  ExternalLink,
  Play,
  FileText,
  AlertCircle
} from 'lucide-react';

export interface MultiResourceAccessRequestWorkspaceProps {
  onBackToSolution?: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToResources?: () => void;
  onNavigateToMyRequests?: () => void;
  onContinueAnalysis?: (taskName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

interface ResourceItemRequest {
  id: string;
  name: string;
  typeBadge: string;
  categoryBadge: string;
  description: string;
  capability: string;
  capabilityDetail: string;
  requiredScopeList: string[];
  protectionSummary: string;
  isExpanded: boolean;
  businessFields: string[];
  techFields: string[];
  scopeNote: string;
  isExcluded: boolean;
}

export const MultiResourceAccessRequestWorkspace: React.FC<MultiResourceAccessRequestWorkspaceProps> = ({
  onBackToSolution,
  onNavigateToDiscovery,
  onNavigateToResources,
  onNavigateToMyRequests,
  onContinueAnalysis,
  addToast,
}) => {
  // Navigation active side item
  const [activeSideNav, setActiveSideNav] = useState<'discovery' | 'resources' | 'my_requests'>('resources');

  // Resource items state
  const [resources, setResources] = useState<ResourceItemRequest[]>([
    {
      id: 'res-pop-view',
      name: '人口基本信息视图',
      typeBadge: 'DATA ASSET · VIEW',
      categoryBadge: '核心数据',
      description: '提供人口年龄、出生信息、常住状态与所属行政区域等基础信息。',
      capability: '查询数据',
      capabilityDetail: '用于在线分析和问数，不包含数据导出',
      requiredScopeList: ['年龄与出生信息', '常住状态', '行政区域'],
      protectionSummary: '姓名脱敏 · 身份证号不包含 · 本次不申请导出',
      isExpanded: true, // Resource 1 is expanded by default (状态 A: 展开状态)
      businessFields: ['年龄', '出生日期', '常住状态', '行政区域'],
      techFields: ['age', 'birth_date', 'resident_status', 'region_code'],
      scopeNote: '缺少身份与联系方式字段不在本次建议申请范围内。',
      isExcluded: false,
    },
    {
      id: 'res-elderly-care',
      name: '养老机构基本信息',
      typeBadge: 'DATA ASSET',
      categoryBadge: '补充数据',
      description: '提供养老机构的位置、床位规模与服务能力等基础信息。',
      capability: '查询数据',
      capabilityDetail: '用于空间匹配与服务覆盖评估',
      requiredScopeList: ['机构位置', '床位规模', '服务能力'],
      protectionSummary: '仅申请当前任务所需业务信息',
      isExpanded: false, // Resource 2 is collapsed by default (状态 B: 折叠状态)
      businessFields: ['机构名称', '机构地址', '经纬度坐标', '核定床位数', '提供服务类型', '运营状态'],
      techFields: ['org_name', 'address', 'location_geo', 'bed_count', 'service_types', 'operational_status'],
      scopeNote: '运营人员薪资与内部财务账目不在本次申请范围内。',
      isExcluded: false,
    },
  ]);

  // Form states
  const [durationOption, setDurationOption] = useState<string>('3months');
  const [applicationRemark, setApplicationRemark] = useState<string>(
    '用于分析街镇人口老龄化程度及人口结构差异，并结合养老机构的位置、床位和服务能力评估养老资源覆盖情况。'
  );

  // Excluded item undo stack
  const [lastExcludedId, setLastExcludedId] = useState<string | null>(null);

  // Submission lifecycle: 'idle' | 'evaluating' | 'result'
  const [submissionPhase, setSubmissionPhase] = useState<'idle' | 'evaluating' | 'result'>('idle');

  // Active resource count
  const activeResources = resources.filter((r) => !r.isExcluded);
  const activeCount = activeResources.length;

  // Duration label display
  const durationLabelMap: Record<string, string> = {
    '1month': '1 个月',
    '3months': '3 个月',
    '6months': '6 个月',
    custom: '自定义期限',
  };

  // Toggle detail expansion for a specific resource
  const handleToggleExpand = (id: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isExpanded: !r.isExpanded } : r))
    );
  };

  // Expand all resources detail
  const handleExpandAll = () => {
    setResources((prev) => prev.map((r) => ({ ...r, isExpanded: true })));
    addToast?.('info', '展开详细范围', '已展开所有待申请资源的业务与技术字段对照');
  };

  // Exclude resource from this application
  const handleExcludeResource = (id: string, name: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isExcluded: true } : r))
    );
    setLastExcludedId(id);
    addToast?.('info', '已移出本次申请', `已从申请列表中剔除「${name}」`);
  };

  // Undo exclude
  const handleUndoExclude = () => {
    if (!lastExcludedId) return;
    setResources((prev) =>
      prev.map((r) => (r.id === lastExcludedId ? { ...r, isExcluded: false } : r))
    );
    setLastExcludedId(null);
    addToast?.('success', '已恢复申请项', '资源已重新加入本次申请列表');
  };

  // Submit application
  const handleSubmit = () => {
    if (activeCount === 0) {
      addToast?.('error', '无法提交', '请至少保留 1 项需要申请的资源');
      return;
    }

    setSubmissionPhase('evaluating');
    addToast?.('info', '正在提交申请', 'Semovix 策略引擎正在逐项评估访问合规性…');

    // Simulate automated policy evaluation
    setTimeout(() => {
      setSubmissionPhase('result');
      addToast?.('success', '申请处理完成', '所有资源均已通过策略自动化评估并完成授权');
    }, 1100);
  };

  // Handle return to solution
  const handleReturnToSolution = () => {
    if (onBackToSolution) {
      onBackToSolution();
    } else if (onNavigateToResources) {
      onNavigateToResources();
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] select-none">
      {/* ========================================================= */}
      {/* 1. LEFT NAVIGATION SIDEBAR (220px)                        */}
      {/* ========================================================= */}
      <aside className="w-[220px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#EEF2F6]">
          <div className="text-xs font-bold text-[#667085] tracking-wider uppercase">
            Marketplace
          </div>
          <div className="text-sm font-extrabold text-[#172033] mt-0.5">
            数据服务超市
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 text-xs">
          {/* 1. 发现 */}
          <button
            onClick={() => {
              setActiveSideNav('discovery');
              onNavigateToDiscovery?.();
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'discovery'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Compass className="w-4 h-4 text-[#64748B]" />
            <span>发现</span>
          </button>

          {/* 2. 资源 (当前高亮) */}
          <button
            onClick={() => {
              setActiveSideNav('resources');
              onNavigateToResources?.();
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'resources'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>资源</span>
          </button>

          {/* 3. 我的申请 */}
          <button
            onClick={() => {
              setActiveSideNav('my_requests');
              onNavigateToMyRequests?.();
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'my_requests'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#64748B]" />
            <span>我的申请</span>
          </button>
        </nav>

        {/* Bottom Fixed Lightweight AI Partner Card */}
        <div className="mt-auto p-3 border-t border-[#EEF2F6] bg-[#FAFCFF]">
          <div className="p-2.5 rounded-md border border-[#E0E7FF] bg-white shadow-2xs">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-6 h-6 rounded-md bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-[#667085] leading-tight">AI Partner</div>
                <div className="text-xs font-bold text-[#172033] leading-tight truncate">
                  Xino｜犀诺
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MIDDLE CONTENT AREA (~1020-1080px)                     */}
      {/* ========================================================= */}
      <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col space-y-5">
        <div className="max-w-[1060px] w-full space-y-5">
          
          {/* Top Breadcrumb */}
          <div className="flex items-center space-x-2 text-xs text-[#667085] font-normal">
            <span
              onClick={onNavigateToDiscovery}
              className="hover:text-[#2563EB] cursor-pointer"
            >
              数据服务超市
            </span>
            <span className="text-[#CBD5E1]">/</span>
            <span
              onClick={onNavigateToResources}
              className="hover:text-[#2563EB] cursor-pointer"
            >
              资源
            </span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="font-semibold text-[#172033]">
              申请使用所需资源
            </span>
          </div>

          {/* Page Title Area */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                申请使用所需资源
              </h1>
              <p className="text-xs text-[#667085] leading-relaxed">
                完成街镇老龄化与养老资源分析，还需要以下资源。请确认申请范围与使用期限后提交。
              </p>
            </div>

            {/* Right link: 返回数据方案 */}
            <button
              onClick={handleReturnToSolution}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] hover:text-[#2563EB] text-xs font-medium rounded-md shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" />
              <span>返回数据方案</span>
            </button>
          </div>

          {/* ======================================================= */}
          {/* 任务上下文卡片 (横向任务上下文卡片)                        */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-lg p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs divide-y sm:divide-y-0 sm:divide-x divide-[#EEF2F6]">
              {/* 1. 当前任务 */}
              <div className="space-y-1 sm:pr-3">
                <div className="text-[11px] font-semibold text-[#667085]">
                  当前任务
                </div>
                <div className="font-bold text-[#172033] truncate">
                  街镇老龄化与养老资源分析
                </div>
              </div>

              {/* 2. 来源 */}
              <div className="space-y-1 pt-2 sm:pt-0 sm:px-4">
                <div className="text-[11px] font-semibold text-[#667085]">
                  来源
                </div>
                <div className="font-medium text-[#334155] flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  <span>推荐数据方案</span>
                </div>
              </div>

              {/* 3. 当前资源情况 */}
              <div className="space-y-1 pt-2 sm:pt-0 sm:px-4">
                <div className="text-[11px] font-semibold text-[#667085]">
                  当前资源情况
                </div>
                <div className="font-semibold text-[#172033] flex items-center space-x-1.5">
                  <span className="text-[#16A36A]">2 项已具备</span>
                  <span className="text-[#94A3B8]">·</span>
                  <span className="text-[#2563EB]">{activeCount} 项需申请</span>
                </div>
              </div>

              {/* 4. 处理原则 */}
              <div className="space-y-1 pt-2 sm:pt-0 sm:pl-4">
                <div className="text-[11px] font-semibold text-[#667085]">
                  处理原则
                </div>
                <div className="font-medium text-[#2563EB]">
                  按当前任务的最小必要范围申请
                </div>
              </div>
            </div>
          </div>

          {/* Undo exclusion alert strip if an item was excluded */}
          {lastExcludedId && (
            <div className="px-4 py-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-between text-xs text-[#1E40AF]">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>已将资源移出本次申请。</span>
              </div>
              <button
                onClick={handleUndoExclude}
                className="text-[#2563EB] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>撤销操作</span>
              </button>
            </div>
          )}

          {/* ======================================================= */}
          {/* 主内容区：需要申请的资源                                   */}
          {/* ======================================================= */}
          <div className="space-y-3.5 pt-1">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-[#172033]">
                需要申请的资源
              </h2>
              <p className="text-xs text-[#667085]">
                以下资源是完成当前分析任务仍需补齐的部分。
              </p>
            </div>

            {/* Vertical Resource Card List */}
            <div className="space-y-4">
              {resources
                .filter((res) => !res.isExcluded)
                .map((res) => (
                  <div
                    key={res.id}
                    className="bg-white border border-[#E6EAF0] rounded-lg p-5 shadow-2xs space-y-4 transition-all"
                  >
                    {/* Header Row: Title, Badges & Right Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEF2F6] pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[#172033]">
                          {res.name}
                        </h3>
                        <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[10px] font-mono font-medium rounded">
                          {res.typeBadge}
                        </span>
                        <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-semibold rounded">
                          {res.categoryBadge}
                        </span>
                      </div>

                      {/* Right Actions: 移出本次申请 + 展开/收起详细范围 */}
                      <div className="flex items-center space-x-3 text-xs shrink-0">
                        <button
                          type="button"
                          onClick={() => handleExcludeResource(res.id, res.name)}
                          className="text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
                        >
                          移出本次申请
                        </button>
                        <span className="text-[#CBD5E1]">|</span>
                        <button
                          type="button"
                          onClick={() => handleToggleExpand(res.id)}
                          className="text-[#2563EB] hover:text-[#1D4ED8] font-medium inline-flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <span>{res.isExpanded ? '收起详细范围' : '查看详细范围'}</span>
                          {res.isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#667085] leading-relaxed">
                      {res.description}
                    </p>

                    {/* First Level Summary (3 Information Blocks) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                      {/* Block 1: 申请能力 */}
                      <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1">
                        <div className="text-[11px] font-semibold text-[#64748B]">
                          申请能力
                        </div>
                        <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                          <span>{res.capability}</span>
                        </div>
                      </div>

                      {/* Block 2: 当前任务需要 */}
                      <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1">
                        <div className="text-[11px] font-semibold text-[#64748B]">
                          当前任务需要
                        </div>
                        <div className="font-semibold text-[#172033] truncate">
                          {res.requiredScopeList.join(' · ')}
                        </div>
                      </div>

                      {/* Block 3: 建议数据保护 */}
                      <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1">
                        <div className="text-[11px] font-semibold text-[#64748B]">
                          建议数据保护
                        </div>
                        <div className="font-medium text-[#475569] truncate">
                          {res.protectionSummary}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Scope (Expanded View) */}
                    {res.isExpanded && (
                      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-3.5 text-xs animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-2">
                          <span className="font-bold text-[#172033]">
                            建议业务范围与字段对照
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            系统已根据任务目标裁剪最小字段集合
                          </span>
                        </div>

                        {/* Two Columns: 业务信息范围 & 技术字段 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: 业务信息范围 */}
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-[#64748B]">
                              业务信息范围
                            </div>
                            <div className="space-y-1.5 bg-white p-3 rounded border border-[#EEF2F6]">
                              {res.businessFields.map((field) => (
                                <div
                                  key={field}
                                  className="flex items-center space-x-2 text-xs text-[#172033] font-medium"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#2563EB] stroke-[2.5]" />
                                  <span>{field}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: 技术字段 */}
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-[#64748B]">
                              技术字段
                            </div>
                            <div className="space-y-1.5 bg-white p-3 rounded border border-[#EEF2F6]">
                              {res.techFields.map((tech) => (
                                <div
                                  key={tech}
                                  className="flex items-center space-x-2 text-xs font-mono text-[#2563EB]"
                                >
                                  <span className="text-[#94A3B8] font-sans text-[11px]">•</span>
                                  <code>{tech}</code>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Light Note at bottom of expanded section */}
                        <div className="pt-2 border-t border-[#EEF2F6] text-[11px] text-[#64748B] flex items-center space-x-1.5">
                          <Shield className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                          <span>{res.scopeNote}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {/* All items excluded state */}
              {activeCount === 0 && (
                <div className="p-8 bg-white border border-[#E6EAF0] rounded-lg text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <div className="text-xs font-bold text-[#172033]">
                    当前没有待申请的资源
                  </div>
                  <p className="text-xs text-[#64748B]">
                    你已将所有资源移出本次申请。你可以撤销操作或直接返回数据方案。
                  </p>
                  <button
                    onClick={handleUndoExclude}
                    className="px-4 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-md hover:bg-[#1D4ED8] cursor-pointer"
                  >
                    恢复所有申请资源
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================= */}
          {/* 全局申请范围说明 (建议申请范围)                            */}
          {/* ======================================================= */}
          <div className="p-4 bg-white border border-[#E6EAF0] rounded-lg shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#172033]">
                建议申请范围
              </h2>
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-[11px] text-[#2563EB] hover:text-[#1D4ED8] font-medium cursor-pointer"
              >
                查看各资源详细范围
              </button>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Semovix 已根据当前任务为每项资源整理最小必要范围；敏感身份信息、联系方式及与当前任务无关的数据默认不包含。
            </p>
          </div>

          {/* ======================================================= */}
          {/* 使用期限与申请说明 (下方两列布局)                           */}
          {/* ======================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* Left: 使用期限 */}
            <div className="bg-white border border-[#E6EAF0] rounded-lg p-5 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-[#172033]">
                使用期限
              </label>
              <div className="relative">
                <select
                  value={durationOption}
                  onChange={(e) => setDurationOption(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D0D5DD] focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] outline-hidden cursor-pointer appearance-none pr-8 font-medium"
                >
                  <option value="1month">1 个月</option>
                  <option value="3months">3 个月（默认）</option>
                  <option value="6months">6 个月</option>
                  <option value="custom">自定义期限</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-[#667085] leading-relaxed">
                不同资源的最终有效期可能根据数据策略分别确定。
              </p>
            </div>

            {/* Right: 申请说明 */}
            <div className="bg-white border border-[#E6EAF0] rounded-lg p-5 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-[#172033]">
                申请说明
              </label>
              <textarea
                rows={3}
                value={applicationRemark}
                onChange={(e) => setApplicationRemark(e.target.value)}
                placeholder="填写具体的业务用途说明…"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D0D5DD] focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] leading-relaxed outline-hidden resize-none font-medium"
              />
              <p className="text-[11px] text-[#667085]">
                可根据实际业务需求补充说明。
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. RIGHT SUMMARY & PROCESSING PANEL (330px)               */}
      {/* ========================================================= */}
      <aside className="w-[330px] bg-white border-l border-[#E6EAF0] p-6 flex flex-col justify-between shrink-0 overflow-y-auto space-y-6">
        <div className="space-y-6">
          
          {/* ======================================================= */}
          {/* 模块 A：申请摘要                                         */}
          {/* ======================================================= */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-[#172033] tracking-wide">
              申请摘要
            </h2>
            <div className="p-4 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">待申请资源</span>
                <span className="font-bold text-[#172033]">{activeCount} 项</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">申请能力</span>
                <span className="font-semibold text-[#172033]">查询数据</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-[#64748B]">用途</div>
                <div className="font-semibold text-[#172033] leading-tight truncate">
                  街镇老龄化与养老资源分析
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">申请范围</span>
                <span className="font-medium text-[#2563EB]">当前任务所需最小范围</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">使用期限</span>
                <span className="font-bold text-[#172033]">{durationLabelMap[durationOption] || '3 个月'}</span>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* 模块 B：系统处理方式                                     */}
          {/* ======================================================= */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold text-[#172033] tracking-wide">
              系统处理方式
            </h2>
            <div className="p-4 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg space-y-2 text-xs">
              <p className="text-[#334155] leading-relaxed">
                提交后，每项资源将分别根据现有数据策略进行判断。可自动处理的申请不会进入人工审核。
              </p>
              <div className="pt-2 border-t border-[#EEF2F6] text-[11px] text-[#64748B] leading-relaxed">
                最终可访问范围可能根据数据策略与访问决策进一步收敛。
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================= */}
        {/* 模块 C：提交操作 (底部固定操作区)                          */}
        {/* ======================================================= */}
        <div className="pt-4 border-t border-[#EEF2F6] space-y-2.5">
          {/* 主按钮 */}
          <button
            type="button"
            disabled={submissionPhase === 'evaluating' || activeCount === 0}
            onClick={handleSubmit}
            className={`w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-bold rounded-md shadow-2xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {submissionPhase === 'evaluating' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>策略自动评估中…</span>
              </>
            ) : (
              <span>提交申请（{activeCount}项资源）</span>
            )}
          </button>

          {/* 次按钮 */}
          <button
            type="button"
            onClick={handleReturnToSolution}
            className="w-full py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] hover:text-[#172033] border border-[#D0D5DD] text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            取消
          </button>

          {/* 底部弱链接 */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleReturnToSolution}
              className="text-[11px] text-[#2563EB] hover:underline font-medium cursor-pointer"
            >
              返回数据方案
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. DECISION RESULT MODAL (提交后自动化策略决策结果)         */}
      {/* ========================================================= */}
      {submissionPhase === 'result' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#F0FDF4] border-b border-[#BBF7D0] flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-[#166534]">
                <CheckCircle2 className="w-5 h-5 text-[#16A36A] shrink-0" />
                <h3 className="text-sm font-bold text-[#166534]">
                  访问权限已生效 · 2项资源已准备就绪
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#334155] leading-relaxed">
                当前申请已根据数据安全与访问策略自动处理，所有必要资源已成功接入分析工作区。
              </p>

              {/* Atomic Items Evaluation Status */}
              <div className="space-y-2 border border-[#E6EAF0] rounded-lg p-3 bg-[#F8FAFC]">
                <div className="text-[11px] font-bold text-[#64748B] mb-1">
                  逐项处理结果 (One Submission, Independent Evaluation)
                </div>
                
                {/* Item 1 */}
                <div className="p-2.5 bg-white rounded border border-[#EEF2F6] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#172033]">人口基本信息视图</div>
                    <div className="text-[11px] text-[#15803D]">已按最小必要范围授权 · 姓名已自动配置动态脱敏</div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] font-bold text-[10px] rounded">
                    自动生效
                  </span>
                </div>

                {/* Item 2 */}
                <div className="p-2.5 bg-white rounded border border-[#EEF2F6] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#172033]">养老机构基本信息</div>
                    <div className="text-[11px] text-[#15803D]">公共机构基础信息 · 策略允许直接查询分析</div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] font-bold text-[10px] rounded">
                    自动生效
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#F0FDF4] rounded border border-[#DCFCE7] text-[11px] text-[#15803D] space-y-1">
                <div>• 有效期限：3 个月（到期前 7 天支持续期）</div>
                <div>• 授权能力：查询数据（在线分析与问数）</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E6EAF0] flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setSubmissionPhase('idle');
                  onNavigateToMyRequests?.();
                }}
                className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded hover:bg-[#F1F5F9] cursor-pointer"
              >
                查看我的申请
              </button>
              <button
                onClick={() => {
                  setSubmissionPhase('idle');
                  if (onContinueAnalysis) {
                    onContinueAnalysis('街镇老龄化与养老资源分析');
                  } else {
                    handleReturnToSolution();
                  }
                  addToast?.('success', '进入分析', '已载入全部 4 项资源至 AI 语义分析工作区');
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer shadow-2xs"
              >
                继续分析任务
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
