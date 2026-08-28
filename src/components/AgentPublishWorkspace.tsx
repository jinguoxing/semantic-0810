import React, { useState, useMemo } from 'react';
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
import {
  AgentItem,
  AgentDefinitionDetail,
  INITIAL_AGENT_DEFINITIONS
} from '../data/agentRegistryData';

interface AgentPublishWorkspaceProps {
  agentId?: string;
  agent?: AgentItem;
  definition?: AgentDefinitionDetail;
  onBackToDefinition: () => void;
  onBackToRegistry?: () => void;
  onPublishSuccess?: (newVersion: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AgentPublishWorkspace: React.FC<AgentPublishWorkspaceProps> = ({
  agentId,
  agent,
  definition,
  onBackToDefinition,
  onBackToRegistry,
  onPublishSuccess,
  addToast
}) => {
  const currentDef = useMemo(() => {
    if (definition && (!agentId || definition.agentId === `agt_${agentId}` || definition.agentId === agentId || definition.name === agent?.name)) {
      return definition;
    }
    if (agentId && INITIAL_AGENT_DEFINITIONS[agentId]) {
      return INITIAL_AGENT_DEFINITIONS[agentId];
    }
    if (definition) return definition;
    if (agent && INITIAL_AGENT_DEFINITIONS[agent.id]) {
      return INITIAL_AGENT_DEFINITIONS[agent.id];
    }
    return agentId ? INITIAL_AGENT_DEFINITIONS[agentId] : null;
  }, [agentId, definition, agent]);

  const agentName = currentDef?.name || agent?.name || '受管智能体';
  const runtimeEngine = currentDef?.runtimeEngine || agent?.runtimeEngine || 'Semovix Native';
  const formalVersion = currentDef?.formalVersion || agent?.formalVersion || null;
  const isFirstRelease = !formalVersion;
  
  // Calculate target version dynamically
  const targetNewVersion = useMemo(() => {
    if (!formalVersion) return 'v1.0';
    const match = formalVersion.match(/v?(\d+)\.(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      return `v${major}.${minor + 1}`;
    }
    return 'v1.0';
  }, [formalVersion]);

  const draftChanges = currentDef?.draftChanges || [];

  // Left Navigation State: Release Section Workspace
  const [activeSection, setActiveSection] = useState<
    'release_overview' | 'config_check' | 'test_run' | 'quality_eval' | 'release_history'
  >('release_overview');

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasPublishedNext, setHasPublishedNext] = useState(false);

  const handleConfirmPublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setIsPublishModalOpen(false);
      setHasPublishedNext(true);
      onPublishSuccess?.(targetNewVersion);
      addToast?.(
        'success',
        `${targetNewVersion} 版本发布成功`,
        `「${agentName}」${targetNewVersion} 已成功发布并同步至 ${runtimeEngine} 运行时实例，正式生效。`
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
            <span>{agentName}</span>
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
                {agentName}
              </span>
              <span>/</span>
              <span className="text-[#0F172A] font-medium">测试与发布</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <h1 className="text-sm font-bold text-[#0F172A] tracking-tight truncate">
                {agentName} · 测试与发布
              </h1>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200/60 shrink-0">
                受管智能体
              </span>
            </div>
          </div>
        </div>

        {/* Right: Exactly 3 Status Tags + Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Status Tag 1: 正式版本 */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#334155]">
            <span className="text-[#64748B]">正式版本</span>
            <span className="font-mono font-semibold text-[#0F172A]">
              {hasPublishedNext ? targetNewVersion : formalVersion ? formalVersion : '暂无'}
            </span>
          </div>

          {/* Status Tag 2: 草稿状态 */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs text-[#1E40AF]">
            <GitBranch className="w-3 h-3 text-[#2563EB]" />
            <span className="font-semibold">
              {hasPublishedNext
                ? '已是最新版本'
                : isFirstRelease
                ? '首发草稿待发布'
                : '草稿待发布'}
            </span>
          </div>

          {/* Status Tag 3: Runtime · 状态 */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded text-xs text-[#334155]">
            <span
              className={`w-2 h-2 rounded-full ${
                hasPublishedNext || formalVersion ? 'bg-[#16A36A]' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-[#0F172A]">
              {runtimeEngine} · {hasPublishedNext || formalVersion ? '正常' : '待激活'}
            </span>
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
          Release Gate: 5/5 PASSED · Target: {targetNewVersion}
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
                      <div className="font-mono font-bold text-xs text-[#0F172A]">
                        {formalVersion || '暂无 (未发布)'}
                      </div>
                      <span className="text-[10px] text-[#64748B] block truncate">
                        {formalVersion
                          ? `${runtimeEngine} · ${currentDef?.runtimeRevision || 'r37'} · 正常运行`
                          : `${runtimeEngine} · 尚未建立正式运行配置`}
                      </span>
                    </div>

                    {/* Current Draft */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] text-[#64748B] block">当前草稿</span>
                      <div className="font-bold text-xs text-[#2563EB]">
                        {isFirstRelease
                          ? '首发创建草稿'
                          : draftChanges.length > 0
                          ? `${draftChanges.length} 项修改`
                          : '与正式版一致'}
                      </div>
                      <span className="text-[10px] text-[#64748B] block truncate">
                        {isFirstRelease
                          ? '待发布为初始正式版本'
                          : draftChanges.length > 0
                          ? draftChanges.map((d) => d.field).join('、')
                          : '配置文件已就绪'}
                      </span>
                    </div>

                    {/* Target Version */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] text-[#64748B] block">预计发布版本</span>
                      <div className="font-mono font-bold text-xs text-[#0F172A]">
                        {targetNewVersion}
                      </div>
                      <span className="text-[10px] text-[#64748B] block">
                        发布成功后正式生成
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#94A3B8] pt-1">
                    {isFirstRelease
                      ? `发布成功后将正式生成首发版本 ${targetNewVersion} 并激活 ${runtimeEngine} 运行时实例。`
                      : `发布成功后才会生成正式版本 ${targetNewVersion}；当前草稿不会影响正在运行的 ${formalVersion}。`}
                  </p>
                </div>

                {/* ─────────────────────────────────────────────────────
                    REGION 2: 草稿变更 (Diff List)
                ───────────────────────────────────────────────────── */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">草稿变更</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {isFirstRelease
                        ? `首发版本上线，包含 ${(currentDef?.tasks || []).length} 项支持任务与基础能力模式配置。`
                        : draftChanges.length > 0
                        ? `相比正式版本 ${formalVersion}，本次准备发布以下 ${draftChanges.length} 项业务级修改。`
                        : `当前草稿与正式版本 ${formalVersion} 保持完全一致，无需额外差异调整。`}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    {isFirstRelease ? (
                      <div className="p-3 bg-white border border-blue-200 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A]">首发规格定义</span>
                          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                            NEW DRAFT
                          </span>
                        </div>
                        <div className="text-[11px] text-[#475569] leading-relaxed">
                          包含支持任务：{(currentDef?.tasks || []).map((t) => t.name).join('、')}；能力模式：{currentDef?.capabilityMode}。
                        </div>
                      </div>
                    ) : draftChanges.length > 0 ? (
                      draftChanges.map((change, idx) => (
                        <div key={idx} className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F172A]">{change.field}</span>
                            <span className="text-[10px] font-mono text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {change.tag}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#475569] leading-relaxed">
                            {change.changeText}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B]">
                        当前草稿与正式版本 {formalVersion} 保持一致，暂无未发布修改。
                      </div>
                    )}
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
                          当前草稿已成功编译为 {runtimeEngine} Runtime Projection。
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
                          关键能力与支持任务测试已全部完成。
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
                          当前草稿满足「{agentName}」正式发布质量标准。
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
                          Ready <span className="text-[10px] font-normal text-[#64748B]">({runtimeEngine})</span>
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
                          {agentName} · {currentDef?.owner || agent?.owner || '受管团队'} · 职责定义完整 ({currentDef?.responsibility?.length || 45}/500)
                        </p>
                      </div>

                      <div className="font-bold text-[#0F172A] pt-2">Context & Capability 校验</div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#0F172A]">范围资产与能力模式挂载</span>
                          <span className="text-[#16A36A] font-semibold">VALID</span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          {currentDef?.contextSources?.length || 1} 个挂载范围（{(currentDef?.contextSources || []).map((c) => c.name).join('、') || '默认受管资产'}）均在线且配置一致。
                        </p>
                      </div>

                      <div className="font-bold text-[#0F172A] pt-2">{runtimeEngine} Runtime 编译投影</div>
                      <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#1E40AF]">Runtime Schema Compatibility</span>
                          <span className="text-[#2563EB] font-semibold">PROJECTION READY</span>
                        </div>
                        <p className="text-[11px] text-[#2563EB]">
                          Runtime Revision Projection: {currentDef?.runtimeRevision ? `r${parseInt(currentDef.runtimeRevision.replace(/\D/g, '') || '37') + 1}` : 'r38'}-draft · 目标引擎 {runtimeEngine} 已完成协议编译。
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
                          <div className="font-bold text-[#0F172A]">
                            {currentDef?.testSandbox?.suggestedQueries?.[0]
                              ? `测试案例 1：${currentDef.testSandbox.suggestedQueries[0]}`
                              : `测试案例 1：${agentName} 核心任务能力探查`}
                          </div>
                          <span className="text-[#16A36A] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            测试通过
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                          <div>Routing: <span className="font-mono text-[#0F172A]">{runtimeEngine === 'WeKnora' ? 'KNOWLEDGE_QA_V1' : 'NATIVE_SEMANTIC_ROUTING'}</span></div>
                          <div>Agent: <span className="text-[#0F172A]">当前草稿</span></div>
                          <div>Runtime: <span className="text-[#0F172A]">{runtimeEngine} · Draft Projection</span></div>
                          <div>Evidence: <span className="font-bold text-[#0F172A]">{currentDef?.contextSources?.length ? `${currentDef.contextSources.length} 项有效依据` : '3 项有效引用'}</span></div>
                        </div>
                        <div className="text-[11px] text-[#334155] bg-white p-2.5 rounded border border-[#E2E8F0]">
                          <strong>回答摘要：</strong>{' '}
                          {currentDef?.testSandbox?.sampleResponses?.[0]?.reply
                            ? currentDef.testSandbox.sampleResponses[0].reply.split('\n')[0]
                            : `已通过 ${runtimeEngine} 运行时验证，草稿配置符合业务规范与执行标准。`}
                        </div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">
                            {currentDef?.testSandbox?.suggestedQueries?.[1]
                              ? `测试案例 2：${currentDef.testSandbox.suggestedQueries[1]}`
                              : `测试案例 2：${currentDef?.tasks?.[0]?.name || '基础支持任务'}边界校验`}
                          </div>
                          <div className="text-[11px] text-[#64748B]">命中受管资产：{currentDef?.contextSources?.[0]?.name || '受管业务语义'} · 状态: 正常</div>
                        </div>
                        <span className="text-[#16A36A] font-semibold">通过</span>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">
                            测试案例 3：{currentDef?.tasks?.[1]?.name || '多维意图与策略识别'}联动执行探查
                          </div>
                          <div className="text-[11px] text-[#64748B]">运行引擎：{runtimeEngine} · 自主程度: {currentDef?.maxAutonomy || '建议'}</div>
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
                        {hasPublishedNext && (
                          <tr className="bg-blue-50/40 font-medium">
                            <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">{targetNewVersion}</td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] bg-emerald-50 text-[#16A36A] px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                                当前正式
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#475569]">刚刚发布</td>
                            <td className="py-3 px-4 font-mono text-[#64748B]">{runtimeEngine} r38</td>
                            <td className="py-3 px-4 text-[#0F172A]">
                              {isFirstRelease
                                ? '首发正式版本上线并激活受管实例'
                                : '新增数据治理规范知识空间；升级 Wiki+RAG 模式'}
                            </td>
                          </tr>
                        )}
                        {formalVersion && (
                          <tr>
                            <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{formalVersion}</td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] bg-slate-100 text-[#475569] px-1.5 py-0.5 rounded">
                                {hasPublishedNext ? '历史' : '当前正式'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#64748B]">2026-08-25 16:40</td>
                            <td className="py-3 px-4 font-mono text-[#64748B]">{runtimeEngine} r37</td>
                            <td className="py-3 px-4 text-[#334155]">已验证并稳定运行版本</td>
                          </tr>
                        )}
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
                <span className="font-mono font-bold text-[#0F172A]">
                  {formalVersion || '暂无 (未发布)'}
                </span>
                <span className="text-[10px] font-mono text-[#64748B]">
                  {runtimeEngine} {currentDef?.runtimeRevision ? `· ${currentDef.runtimeRevision}` : ''}
                </span>
              </div>
            </div>

            {/* Target Draft */}
            <div className="space-y-0.5 pt-2 border-t border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B] block">当前草稿</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2563EB]">
                  {isFirstRelease ? '首发创建草稿' : draftChanges.length > 0 ? `${draftChanges.length} 项修改` : '与正式版一致'}
                </span>
                <span className="font-mono font-bold text-[#0F172A]">预计版本：{targetNewVersion}</span>
              </div>
            </div>

            {/* Changes list */}
            <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] space-y-1 text-[#334155]">
              <div className="font-semibold text-[#0F172A]">本次主要变更：</div>
              {isFirstRelease ? (
                <div>• 首发正式上线并激活受管实例</div>
              ) : draftChanges.length > 0 ? (
                draftChanges.map((d, i) => (
                  <div key={i} className="truncate">• {d.field}：{d.changeText}</div>
                ))
              ) : (
                <div>• 配置文件与线上正式版本一致</div>
              )}
            </div>

            {/* Runtime Projection */}
            <div className="space-y-1 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64748B]">Runtime</span>
                <span className="font-semibold text-[#0F172A]">{runtimeEngine}</span>
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
              <span>{isFirstRelease ? `发布首发版本 ${targetNewVersion}` : `发布新版本 ${targetNewVersion}`}</span>
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
                  发布「{agentName}」· {isFirstRelease ? '首发版本' : '新版本'}
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
                    {targetNewVersion}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#64748B] block">绑定 Runtime</span>
                  <span className="font-medium text-[#0F172A] block mt-0.5">
                    {runtimeEngine} {currentDef?.runtimeRevision ? `(${currentDef.runtimeRevision})` : '(初始编译)'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-[#0F172A]">本次主要变更：</div>
                <ul className="list-disc list-inside space-y-1 text-[#475569] pl-1">
                  {currentDef?.draftChanges && currentDef.draftChanges.length > 0 ? (
                    currentDef.draftChanges.map((change, idx) => (
                      <li key={idx}>
                        {change.field}：{change.changeText}
                      </li>
                    ))
                  ) : (
                    <>
                      <li>基础配置初始化：设定业务职责与安全规则边界</li>
                      <li>绑定运行引擎：接入 {runtimeEngine} 运行时执行流</li>
                    </>
                  )}
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
                <strong>发布保障：</strong>{' '}
                {isFirstRelease
                  ? `发布将首次建立「${agentName}」在 ${runtimeEngine} 中的受管运行实例，发布后可立即对外提供服务。`
                  : `若发布过程中断或 ${runtimeEngine} 同步失败，线上正式版本 ${formalVersion} 将保持在线不受影响。`}
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
                    <span>发布 {targetNewVersion}</span>
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
