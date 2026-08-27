import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  Rocket,
  Shield,
  Layers,
  Sparkles,
  FileCheck2,
  PlayCircle,
  BarChart3,
  History,
  X,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Database,
  Cpu,
  Sliders,
  FileText
} from 'lucide-react';

interface AgentPublishWorkspaceProps {
  onBackToDefinition: () => void;
  onBackToRegistry?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AgentPublishWorkspace: React.FC<AgentPublishWorkspaceProps> = ({
  onBackToDefinition,
  onBackToRegistry,
  addToast
}) => {
  // Left Navigation State: Release Section Workspace
  const [activeSection, setActiveSection] = useState<
    'release_overview' | 'config_check' | 'test_run' | 'quality_eval' | 'release_history'
  >('release_overview');

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasPublishedV15, setHasPublishedV15] = useState(false);

  const handleConfirmPublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setIsPublishModalOpen(false);
      setHasPublishedV15(true);
      addToast?.(
        'success',
        'v1.5 版本发布成功',
        '企业知识伙伴 v1.5 已成功发布并同步至 WeKnora 运行时实例，正式生效。'
      );
    }, 900);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* ─────────────────────────────────────────────────────────────
          SECTION ONE. IMMERSIVE AGENT WORKSPACE HEADER (Consistent with Page 02)
      ───────────────────────────────────────────────────────────── */}
      <header className="h-[68px] bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
        {/* Left: Back to Definition & Breadcrumb */}
        <div className="flex items-center space-x-4 min-w-0">
          <button
            onClick={onBackToDefinition}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer border border-[#E2E8F0] shrink-0"
            title="返回智能体定义工作区"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>企业知识伙伴</span>
          </button>

          <div className="h-5 w-px bg-[#E2E8F0] shrink-0" />

          {/* Breadcrumb + Page Title */}
          <div className="min-w-0">
            <div className="flex items-center space-x-2 text-[11px] text-[#64748B]">
              <span
                onClick={onBackToRegistry}
                className="hover:text-[#0F172A] cursor-pointer transition-colors"
              >
                智能体中心
              </span>
              <span>/</span>
              <span
                onClick={onBackToDefinition}
                className="hover:text-[#0F172A] cursor-pointer transition-colors"
              >
                企业知识伙伴
              </span>
              <span>/</span>
              <span className="text-[#0F172A] font-medium">测试与发布</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <h1 className="text-sm font-bold text-[#0F172A] tracking-tight truncate">
                企业知识伙伴 · 测试与发布
              </h1>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200/60 shrink-0">
                受管智能体
              </span>
            </div>
          </div>
        </div>

        {/* Right: Exactly 3 Status Tags + Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Status Tag 1: 正式版本 v1.4 (or v1.5 if published) */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#334155]">
            <span className="text-[#64748B]">正式版本</span>
            <span className="font-mono font-semibold text-[#0F172A]">
              {hasPublishedV15 ? 'v1.5' : 'v1.4'}
            </span>
          </div>

          {/* Status Tag 2: 草稿待发布 */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs text-[#1E40AF]">
            <GitBranch className="w-3 h-3 text-[#2563EB]" />
            <span className="font-semibold">
              {hasPublishedV15 ? '已是最新版本' : '草稿待发布'}
            </span>
          </div>

          {/* Status Tag 3: WeKnora · 正常 */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded text-xs text-[#334155]">
            <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
            <span className="font-medium text-[#0F172A]">WeKnora · 正常</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#E2E8F0]">
            <button
              onClick={onBackToDefinition}
              className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <span>返回定义页</span>
            </button>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>发布新版本</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header Description bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-2 text-xs text-[#64748B] flex items-center justify-between">
        <p className="truncate">
          在正式发布前，对当前草稿的配置、Runtime、测试结果与质量基线进行统一验证。
        </p>
        <span className="text-[11px] font-mono text-[#94A3B8] hidden md:inline">
          Release Gate: 5/5 PASSED · Target: v1.5
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION TWO. THREE-COLUMN RELEASE WORKSPACE BODY
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─────────────────────────────────────────────────────────
            COLUMN A. LEFT RELEASE NAVIGATION (190-210px)
        ───────────────────────────────────────────────────────── */}
        <aside className="w-[200px] bg-white border-r border-[#E2E8F0] flex flex-col justify-between p-3 shrink-0 select-none overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] tracking-wider uppercase">
              发布验证流程
            </div>

            {/* Nav 1: 发布概览 (Default Active) */}
            <button
              onClick={() => setActiveSection('release_overview')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold text-left transition-all cursor-pointer relative ${
                activeSection === 'release_overview'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'release_overview' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>发布概览</span>
            </button>

            {/* Nav 2: 配置检查 */}
            <button
              onClick={() => setActiveSection('config_check')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'config_check'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'config_check' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span>配置检查</span>
                <Check className="w-3 h-3 text-[#16A36A]" />
              </div>
            </button>

            {/* Nav 3: 测试运行 */}
            <button
              onClick={() => setActiveSection('test_run')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'test_run'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'test_run' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <PlayCircle className="w-3.5 h-3.5 shrink-0" />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span>测试运行</span>
                <Check className="w-3 h-3 text-[#16A36A]" />
              </div>
            </button>

            {/* Nav 4: 质量评估 */}
            <button
              onClick={() => setActiveSection('quality_eval')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'quality_eval'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'quality_eval' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span>质量评估</span>
                <Check className="w-3 h-3 text-[#16A36A]" />
              </div>
            </button>

            {/* Nav 5: 发布记录 */}
            <button
              onClick={() => setActiveSection('release_history')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'release_history'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'release_history' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>发布记录</span>
            </button>
          </div>

          {/* Release Guarantee Note */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[11px] text-[#64748B] space-y-1">
            <div className="font-semibold text-[#0F172A] flex items-center space-x-1">
              <Shield className="w-3 h-3 text-[#2563EB]" />
              <span>安全发布门控</span>
            </div>
            <p className="text-[10px] text-[#94A3B8] leading-tight">
              若发布遇阻或中断，线上正式版将自动维持原状，杜绝环境降级。
            </p>
          </div>
        </aside>

        {/* ─────────────────────────────────────────────────────────
            COLUMN B. MIDDLE MAIN WORKSPACE (920-1000px)
        ───────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC]">
          <div className="max-w-[960px] mx-auto space-y-6">
            {activeSection === 'release_overview' ? (
              <>
                {/* Section Header */}
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                    发布概览
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    查看本次草稿变更、发布门状态，以及新版本正式生效前的关键验证结果。
                  </p>
                </div>

                {/* ─────────────────────────────────────────────────────
                    REGION 1: 本次发布 (Summary Section, NOT KPI wall)
                ───────────────────────────────────────────────────── */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <h3 className="text-xs font-bold text-[#0F172A]">本次发布</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                    {/* Current Formal Version */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] text-[#64748B] block">当前正式版本</span>
                      <div className="font-mono font-bold text-xs text-[#0F172A]">v1.4</div>
                      <span className="text-[10px] text-[#64748B] block">
                        WeKnora · r37 · 正常运行
                      </span>
                    </div>

                    {/* Current Draft */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] text-[#64748B] block">当前草稿</span>
                      <div className="font-bold text-xs text-[#2563EB]">2 项修改</div>
                      <span className="text-[10px] text-[#64748B] block">
                        知识范围与能力模式升级
                      </span>
                    </div>

                    {/* Target Version */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] text-[#64748B] block">预计发布版本</span>
                      <div className="font-mono font-bold text-xs text-[#0F172A]">v1.5</div>
                      <span className="text-[10px] text-[#64748B] block">
                        发布成功后正式生成
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#94A3B8] pt-1">
                    发布成功后才会生成正式版本 v1.5；当前草稿不会影响正在运行的 v1.4。
                  </p>
                </div>

                {/* ─────────────────────────────────────────────────────
                    REGION 2: 草稿变更 (Diff List)
                ───────────────────────────────────────────────────── */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">草稿变更</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      相比正式版本 v1.4，本次准备发布以下 2 项业务级修改。
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Diff 1: 知识范围 */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A]">知识范围</span>
                        <span className="text-[10px] font-mono text-[#16A36A] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          + 数据治理规范
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] flex items-center space-x-2">
                        <span>正式版本：企业制度、产品知识</span>
                        <span>→</span>
                        <span className="text-[#0F172A] font-medium">
                          当前草稿：企业制度、产品知识、<strong className="text-[#16A36A]">数据治理规范</strong>
                        </span>
                      </div>
                    </div>

                    {/* Diff 2: 能力模式 */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A]">能力模式</span>
                        <span className="text-[10px] font-mono text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          MODE UPGRADE
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] flex items-center space-x-2">
                        <span className="line-through">精准知识问答</span>
                        <span>→</span>
                        <span className="text-[#2563EB] font-bold">
                          Wiki + RAG 混合研究
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────
                    REGION 3: 发布准备情况 (The ONE Primary Core Card)
                ───────────────────────────────────────────────────── */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">发布准备情况</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      发布前自动运行的 5 项门控检查。
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-2xs space-y-3 text-xs">
                    {/* Gate 1 */}
                    <div className="flex items-start justify-between py-2 border-b border-[#F1F5F9]">
                      <div className="space-y-0.5 pr-4">
                        <div className="font-bold text-[#0F172A]">配置检查</div>
                        <p className="text-[11px] text-[#64748B]">
                          Agent 定义、任务绑定、上下文范围与模型策略均有效。
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-[#16A36A] font-medium shrink-0 pt-0.5">
                        <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                        <span>通过</span>
                      </div>
                    </div>

                    {/* Gate 2 */}
                    <div className="flex items-start justify-between py-2 border-b border-[#F1F5F9]">
                      <div className="space-y-0.5 pr-4">
                        <div className="font-bold text-[#0F172A]">Runtime 编译</div>
                        <p className="text-[11px] text-[#64748B]">
                          当前草稿已成功编译为 WeKnora Runtime Projection。
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-[#16A36A] font-medium shrink-0 pt-0.5">
                        <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                        <span>通过</span>
                      </div>
                    </div>

                    {/* Gate 3 */}
                    <div className="flex items-start justify-between py-2 border-b border-[#F1F5F9]">
                      <div className="space-y-0.5 pr-4">
                        <div className="font-bold text-[#0F172A]">Runtime 依赖</div>
                        <p className="text-[11px] text-[#64748B]">
                          知识空间、Skill、模型策略和 Runtime 依赖均可用。
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-[#16A36A] font-medium shrink-0 pt-0.5">
                        <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                        <span>通过</span>
                      </div>
                    </div>

                    {/* Gate 4 */}
                    <div className="flex items-start justify-between py-2 border-b border-[#F1F5F9]">
                      <div className="space-y-0.5 pr-4">
                        <div className="font-bold text-[#0F172A]">测试运行</div>
                        <p className="text-[11px] text-[#64748B]">
                          关键知识问答测试已全部完成。
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-[#16A36A] font-medium shrink-0 pt-0.5">
                        <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                        <span>通过</span>
                      </div>
                    </div>

                    {/* Gate 5 */}
                    <div className="flex items-start justify-between py-2 border-b border-[#F1F5F9]">
                      <div className="space-y-0.5 pr-4">
                        <div className="font-bold text-[#0F172A]">质量评估</div>
                        <p className="text-[11px] text-[#64748B]">
                          当前草稿满足企业知识伙伴正式发布质量标准。
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-[#16A36A] font-medium shrink-0 pt-0.5">
                        <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                        <span>通过</span>
                      </div>
                    </div>

                    {/* Bottom Gate Highlight (The ONLY prominent success highlight) */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">发布门禁汇总结果 (5/5)</span>
                      <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 text-[#16A36A] border border-emerald-200/80 rounded font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Release Gate Passed ｜ 满足发布条件</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────
                    REGION 4: 验证结果摘要 (Compact Summary)
                ───────────────────────────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#0F172A]">验证结果摘要</h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        各验证维度的轻量统计指标。
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Sub-item 1 */}
                      <div className="space-y-1">
                        <div className="text-[11px] text-[#64748B]">配置</div>
                        <div className="font-bold text-xs text-[#0F172A]">全部通过</div>
                        <button
                          onClick={() => setActiveSection('config_check')}
                          className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                        >
                          查看配置检查 →
                        </button>
                      </div>

                      {/* Sub-item 2 */}
                      <div className="space-y-1">
                        <div className="text-[11px] text-[#64748B]">Runtime Projection</div>
                        <div className="font-bold text-xs text-[#0F172A]">
                          Ready <span className="text-[10px] font-normal text-[#64748B]">(WeKnora)</span>
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">发布前验证副本</div>
                      </div>

                      {/* Sub-item 3 */}
                      <div className="space-y-1">
                        <div className="text-[11px] text-[#64748B]">测试运行</div>
                        <div className="font-bold text-xs text-[#0F172A]">5 / 5 关键测试通过</div>
                        <button
                          onClick={() => setActiveSection('test_run')}
                          className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                        >
                          查看测试结果 →
                        </button>
                      </div>

                      {/* Sub-item 4 */}
                      <div className="space-y-1">
                        <div className="text-[11px] text-[#64748B]">质量评估</div>
                        <div className="font-bold text-xs text-[#0F172A]">47 / 50 案例通过</div>
                        <button
                          onClick={() => setActiveSection('quality_eval')}
                          className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                        >
                          查看质量评估 →
                        </button>
                      </div>
                    </div>

                    {/* Lightweight Quality Metrics (No heavy charts) */}
                    <div className="pt-3 border-t border-[#F1F5F9] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      <div>
                        <span className="text-[#64748B] block">Grounded Answer</span>
                        <span className="font-mono font-bold text-[#0F172A]">96%</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block">Citation Correctness</span>
                        <span className="font-mono font-bold text-[#0F172A]">98%</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block">Retrieval Relevance</span>
                        <span className="font-mono font-bold text-[#0F172A]">93%</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block">No-evidence Honesty</span>
                        <span className="font-mono font-bold text-[#0F172A]">100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Dedicated Views for other Sections when clicked in Left Nav */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                      {activeSection === 'config_check' && '配置检查 (Configuration Validation)'}
                      {activeSection === 'test_run' && '测试运行 (Test Run & Verification)'}
                      {activeSection === 'quality_eval' && '质量评估 (Quality Baseline Evaluation)'}
                      {activeSection === 'release_history' && '发布记录 (Version Release History)'}
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      受管智能体发布前验证 · 独立 Section 视图
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('release_overview')}
                    className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    返回发布概览
                  </button>
                </div>

                {/* Section View: 配置检查 */}
                {activeSection === 'config_check' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="space-y-3">
                      <div className="font-bold text-[#0F172A]">Agent Definition 校验</div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#0F172A]">名称、主要职责与 Owner</span>
                          <span className="text-[#16A36A] font-semibold">VALID</span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          企业知识伙伴 · 企业知识治理组 · 职责长度合规 (68/500)
                        </p>
                      </div>

                      <div className="font-bold text-[#0F172A] pt-2">Context & Capability 校验</div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#0F172A]">知识空间与能力模式挂载</span>
                          <span className="text-[#16A36A] font-semibold">VALID</span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          3 个空间（企业制度、产品知识、数据治理规范）均在线且向量索引可用。
                        </p>
                      </div>

                      <div className="font-bold text-[#0F172A] pt-2">WeKnora Runtime 编译投影</div>
                      <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#1E40AF]">Runtime Schema Compatibility</span>
                          <span className="text-[#2563EB] font-semibold">PROJECTION READY</span>
                        </div>
                        <p className="text-[11px] text-[#2563EB]">
                          Runtime Revision Projection: r38-draft · 目标引擎 WeKnora 已完成协议编译。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section View: 测试运行 */}
                {activeSection === 'test_run' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="font-bold text-[#0F172A]">关键测试运行集 (5 项全部通过)</div>
                    <div className="space-y-3">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-[#0F172A]">测试案例 1：敏感数据如何定义？</div>
                          <span className="text-[#16A36A] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            测试通过
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                          <div>Routing: <span className="font-mono text-[#0F172A]">KNOWLEDGE_QA_V1</span></div>
                          <div>Agent: <span className="text-[#0F172A]">当前草稿</span></div>
                          <div>Runtime: <span className="text-[#0F172A]">WeKnora · Draft Projection</span></div>
                          <div>Evidence: <span className="font-bold text-[#0F172A]">4 条有效引用</span></div>
                        </div>
                        <div className="text-[11px] text-[#334155] bg-white p-2.5 rounded border border-[#E2E8F0]">
                          <strong>回答摘要：</strong> 依据《数据治理规范 V2.4》第 3.1 节，企业敏感数据分为 L1~L4 四级，涉及客户个人身份标识与交易鉴权要素归入 L3 以上受控范围。
                        </div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">测试案例 2：产品架构多租户隔离规范</div>
                          <div className="text-[11px] text-[#64748B]">命中知识空间：《产品知识》 · Evidence: 3 条</div>
                        </div>
                        <span className="text-[#16A36A] font-semibold">通过</span>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">测试案例 3：跨文档考勤与差旅补贴对比</div>
                          <div className="text-[11px] text-[#64748B]">命中知识空间：《企业制度》 · Evidence: 5 条</div>
                        </div>
                        <span className="text-[#16A36A] font-semibold">通过</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section View: 质量评估 */}
                {activeSection === 'quality_eval' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0F172A]">标准基线评测集 (47/50 案例通过)</div>
                      <span className="text-xs text-[#16A36A] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        满足发布标准
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                        <span className="text-[11px] text-[#64748B] block">Grounded Answer Rate</span>
                        <span className="text-base font-bold font-mono text-[#0F172A]">96%</span>
                        <span className="text-[10px] text-[#16A36A] block">基线: ≥90% (达标)</span>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                        <span className="text-[11px] text-[#64748B] block">Citation Correctness</span>
                        <span className="text-base font-bold font-mono text-[#0F172A]">98%</span>
                        <span className="text-[10px] text-[#16A36A] block">基线: ≥95% (达标)</span>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                        <span className="text-[11px] text-[#64748B] block">Retrieval Relevance</span>
                        <span className="text-base font-bold font-mono text-[#0F172A]">93%</span>
                        <span className="text-[10px] text-[#16A36A] block">基线: ≥88% (达标)</span>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                        <span className="text-[11px] text-[#64748B] block">No-evidence Honesty</span>
                        <span className="text-base font-bold font-mono text-[#0F172A]">100%</span>
                        <span className="text-[10px] text-[#16A36A] block">无推测 (达标)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section View: 发布记录 */}
                {activeSection === 'release_history' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#64748B]">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">版本</th>
                          <th className="py-2.5 px-4 font-semibold">状态</th>
                          <th className="py-2.5 px-4 font-semibold">发布时间</th>
                          <th className="py-2.5 px-4 font-semibold">Runtime</th>
                          <th className="py-2.5 px-4 font-semibold">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {hasPublishedV15 && (
                          <tr className="bg-blue-50/40 font-medium">
                            <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">v1.5</td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] bg-emerald-50 text-[#16A36A] px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                                当前正式
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#475569]">刚刚发布</td>
                            <td className="py-3 px-4 font-mono text-[#64748B]">WeKnora r38</td>
                            <td className="py-3 px-4 text-[#0F172A]">新增数据治理规范知识空间；升级 Wiki+RAG 模式</td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">v1.4</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] bg-slate-100 text-[#475569] px-1.5 py-0.5 rounded">
                              {hasPublishedV15 ? '历史' : '当前正式'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">2026-08-25 16:40</td>
                          <td className="py-3 px-4 font-mono text-[#64748B]">WeKnora r37</td>
                          <td className="py-3 px-4 text-[#334155]">增加产品知识空间</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">v1.3</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] bg-slate-100 text-[#475569] px-1.5 py-0.5 rounded">历史</span>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">2026-08-18</td>
                          <td className="py-3 px-4 font-mono text-[#64748B]">WeKnora r31</td>
                          <td className="py-3 px-4 text-[#334155]">优化知识问答策略</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">v1.2</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] bg-slate-100 text-[#475569] px-1.5 py-0.5 rounded">历史</span>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">2026-08-10</td>
                          <td className="py-3 px-4 font-mono text-[#64748B]">WeKnora r26</td>
                          <td className="py-3 px-4 text-[#334155]">首次正式发布</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ─────────────────────────────────────────────────────────
            COLUMN C. RIGHT RELEASE SUMMARY INSPECTOR (280-300px)
            (Restrained, Compact Summary Surface)
        ───────────────────────────────────────────────────────── */}
        <aside className="w-[290px] bg-white border-l border-[#E2E8F0] p-4 shrink-0 overflow-y-auto select-none space-y-4">
          <div className="pb-2 border-b border-[#F1F5F9]">
            <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">发布摘要</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">目标版本发布概况</p>
          </div>

          {/* Compact Parameter List */}
          <div className="space-y-3 text-xs">
            {/* Formal Baseline */}
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#64748B] block">当前正式版本</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#0F172A]">v1.4</span>
                <span className="text-[10px] font-mono text-[#64748B]">WeKnora · r37</span>
              </div>
            </div>

            {/* Target Draft */}
            <div className="space-y-0.5 pt-2 border-t border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B] block">当前草稿</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2563EB]">2 项修改</span>
                <span className="font-mono font-bold text-[#0F172A]">预计版本：v1.5</span>
              </div>
            </div>

            {/* Changes list */}
            <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] space-y-1 text-[#334155]">
              <div className="font-semibold text-[#0F172A]">本次主要变更：</div>
              <div>• 新增：数据治理规范</div>
              <div>• 能力模式：Wiki + RAG 混合研究</div>
            </div>

            {/* Runtime Projection */}
            <div className="space-y-1 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64748B]">Runtime</span>
                <span className="font-semibold text-[#0F172A]">WeKnora</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#64748B]">Draft Projection</span>
                <span className="font-mono font-bold text-[#16A36A]">Ready</span>
              </div>
              <p className="text-[10px] text-[#94A3B8] leading-tight">
                仅用于发布前验证，尚未替代当前正式 Runtime。
              </p>
            </div>

            {/* Release Gate Passed Highlight */}
            <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64748B]">发布门</span>
                <span className="font-bold text-[#0F172A]">5 / 5 已通过</span>
              </div>

              {/* The Only Primary Green Status Block in Inspector */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-[#16A36A] rounded text-xs font-bold flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>可以发布</span>
              </div>
            </div>
          </div>

          {/* Footer Publish Action */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>发布新版本</span>
            </button>

            <button
              onClick={() => setActiveSection('config_check')}
              className="w-full py-1 text-center text-xs text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              查看发布详情
            </button>
          </div>
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CONFIRMATION MODAL: PUBLISH AGENT VERSION (轻量确认抽屉/弹窗)
      ───────────────────────────────────────────────────────────── */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsPublishModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">
                  发布企业知识伙伴 · 新版本
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  将当前已验证的草稿发布为正式运行版本。
                </p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <div>
                  <span className="text-[11px] text-[#64748B] block">预计生成新版本</span>
                  <span className="text-sm font-bold font-mono text-[#0F172A] block mt-0.5">
                    v1.5
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#64748B] block">绑定 Runtime</span>
                  <span className="font-medium text-[#0F172A] block mt-0.5">WeKnora (r38)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-[#0F172A]">本次主要变更 (2 项)：</div>
                <ul className="list-disc list-inside space-y-1 text-[#475569] pl-1">
                  <li>新增「数据治理规范」知识空间挂载</li>
                  <li>能力模式由「精准知识问答」升级为「Wiki + RAG 混合研究」</li>
                </ul>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#F1F5F9]">
                <div className="font-bold text-[#0F172A]">发布检查与安全门控：</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#16A36A]">
                  <div className="flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>配置检查通过</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Runtime 编译通过</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>关键测试通过 (5/5)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>质量基线达标 (47/50)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[11px] text-[#475569] leading-relaxed">
                <strong>发布保障：</strong> 若发布过程中断或 WeKnora 同步失败，线上正式版本 v1.4 将保持在线不受影响。
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-md text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handleConfirmPublish}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isPublishing ? (
                  <span>正在发布...</span>
                ) : (
                  <>
                    <Rocket className="w-3.5 h-3.5" />
                    <span>发布 v1.5</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
