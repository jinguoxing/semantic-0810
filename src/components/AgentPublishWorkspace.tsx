import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  Rocket,
  Shield,
  FileCheck2,
  PlayCircle,
  BarChart3,
  History,
  X,
  Check,
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';
import {
  AgentItem,
  AgentDefinitionDetail,
  INITIAL_AGENT_DEFINITIONS
} from '../data/agentRegistryData';
import {
  agentRepository,
  agentService,
  isReleaseGatePassed,
  AgentReleaseValidation,
  ReleaseCheckStatus,
  RELEASE_GATE_KEYS,
  RELEASE_GATE_LABELS,
  ReleaseGateNotPassedError
} from '../domain/agent';

interface AgentPublishWorkspaceProps {
  /** P0: 必须由外部传入 agentId，本工作区从 Agent Domain 读取全部事实 */
  agentId: string;
  agent?: AgentItem;
  definition?: AgentDefinitionDetail;
  onBackToDefinition: () => void;
  onBackToRegistry?: () => void;
  onPublishSuccess?: (newVersion: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  /**
   * 发布人（Commit 07 TASK 24）：Owner ≠ Publisher。
   * 只有调用方拥有真实 Current User Context 时才传入；当前 App 不传 → publishedBy = 未记录。
   */
  publisherName?: string;
}

/** 单项发布门的状态展示 */
function GateStatusChip({ status }: { status: ReleaseCheckStatus }) {
  if (status === 'PASSED') {
    return (
      <div className="flex items-center space-x-1 text-[#16A36A] font-medium shrink-0 pt-0.5">
        <Check className="w-3.5 h-3.5 text-[#16A36A]" />
        <span>通过</span>
      </div>
    );
  }
  if (status === 'FAILED') {
    return (
      <div className="flex items-center space-x-1 text-red-600 font-medium shrink-0 pt-0.5">
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        <span>未通过</span>
      </div>
    );
  }
  return (
    <div className="flex items-center space-x-1 text-[#94A3B8] font-medium shrink-0 pt-0.5">
      <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
      <span>待检查</span>
    </div>
  );
}

export const AgentPublishWorkspace: React.FC<AgentPublishWorkspaceProps> = ({
  agentId,
  agent,
  definition,
  onBackToDefinition,
  onBackToRegistry,
  onPublishSuccess,
  addToast,
  publisherName
}) => {
  /* ─────────────────────────────────────────────────────────────
     P0: 全部事实来自 Agent Domain (同一 Repository)：
     Current Published Version / Current Draft / Target Runtime /
     Expected Next Version / Draft Changes
     ───────────────────────────────────────────────────────────── */
  const [repoTick, setRepoTick] = useState(0);
  const domain = useMemo(() => {
    const def = agentRepository.getDefinition(agentId);
    return {
      def,
      draft: def ? agentRepository.getDraftByAgentId(agentId) : undefined,
      binding: agentRepository.getRuntimeBinding(agentId),
      versions: agentRepository.getVersions(agentId)
    };
  }, [agentId, repoTick]);

  // ViewModel 仅用于展示投影（测试沙盒 / 任务名称 / 上下文标签）
  const vmDef = useMemo(() => {
    if (definition) return definition;
    return INITIAL_AGENT_DEFINITIONS[agentId] ?? null;
  }, [agentId, definition]);

  // TASK 23：发布的是 Draft——主展示（agentName / owner / tasks / scope / capability）
  // 一律 Draft 优先，正式 Definition 只作为正式基线；改名后的草稿在 A04 标题显示新名称
  const releaseSource = domain.draft ?? domain.def;
  const agentName = domain.draft?.name || domain.def?.name || vmDef?.name || agent?.name || '智能体';
  const runtimeEngine =
    domain.def?.runtimeTarget === 'WEKNORA'
      ? 'WeKnora'
      : domain.def?.runtimeTarget === 'SEMOVIX_NATIVE'
      ? 'Semovix Native'
      : vmDef?.runtimeEngine || agent?.runtimeEngine || 'Semovix Native';
  // TASK 22：类型徽章基于 domain.def.origin，与 A01/A03 统一（不显示 系统智能体/受管智能体）
  const kindLabel = domain.def?.origin === 'BUILT_IN' ? '内置' : '自定义';
  const formalVersion = domain.def?.currentPublishedVersion ?? null;
  const isFirstRelease = !formalVersion;
  const hasDraft = Boolean(domain.draft);
  const isMockIntegration = domain.binding?.integrationMode !== 'PRODUCTION'; // 真实 API 未接入前一律 MOCK_RUNTIME

  // Expected Next Version: 由 Domain Service 依据当前正式版本推导，不写死
  const targetNewVersion = useMemo(
    () => agentService.getExpectedNextVersion(agentId) ?? 'v1.0',
    [agentId, repoTick]
  );

  const draftChanges = domain.draft?.businessDiffs ?? [];

  /* ─────────────────────────────────────────────────────────────
     二十: Release Validation Model —— 五道发布门
     ───────────────────────────────────────────────────────────── */
  const [validation, setValidation] = useState<AgentReleaseValidation | null>(null);
  useEffect(() => {
    let cancelled = false;
    agentService.evaluateReleaseValidation(agentId).then((result) => {
      if (!cancelled) setValidation(result);
    });
    return () => {
      cancelled = true;
    };
  }, [agentId, repoTick]);

  const canPublish = validation ? isReleaseGatePassed(validation) : false;
  const passedGateCount = validation
    ? RELEASE_GATE_KEYS.map((key) => validation[key]).filter((s) => s === 'PASSED').length
    : 0;
  // TASK 25：A04 是发布验证页不是 Runtime Console——Header 第三状态显示「运行准备」产品语义，
  // 具体 Runtime Provider 只出现在检查详情 / 弱技术说明中
  const runtimeReadiness: 'passed' | 'failed' | 'pending' =
    validation?.runtimeCompile === 'PASSED' && validation?.runtimeDependencies === 'PASSED'
      ? 'passed'
      : validation && (validation.runtimeCompile === 'FAILED' || validation.runtimeDependencies === 'FAILED')
      ? 'failed'
      : 'pending';

  // Left Navigation State: Release Section Workspace
  const [activeSection, setActiveSection] = useState<
    'release_overview' | 'config_check' | 'test_run' | 'quality_eval' | 'release_history'
  >('release_overview');

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  /* ─────────────────────────────────────────────────────────────
     二十一: 真实 Publish State —— agentService.publishDraft
     顺序: Release Gate（Domain Invariant）→ 候选版本 → 运行准备校验 → 激活 → 切换正式版本
     失败: 正式版本保持原状，草稿保留
     UI 的 validation 只负责展示 / 提前反馈 / 按钮状态，不是发布授权凭证（§34）
     ───────────────────────────────────────────────────────────── */
  const handleConfirmPublish = async () => {
    if (!canPublish || isPublishing) return;
    setIsPublishing(true);
    try {
      const result = await agentService.publishDraft({
        agentId,
        // TASK 24：Owner ≠ Publisher；无真实 Current User Context 时不伪造，诚实标注「未记录」
        publishedBy: publisherName ?? '未记录'
      });
      setRepoTick((t) => t + 1); // 重新从 Repository 读取全部事实
      setIsPublishModalOpen(false);
      onPublishSuccess?.(result.version.versionNumber);
      addToast?.(
        'success',
        `${result.version.versionNumber} 版本发布成功`,
        `「${agentName}」${result.version.versionNumber} 已发布，正式版本已切换并写回智能体注册表。`
      );
    } catch (error) {
      setIsPublishModalOpen(false);
      // TASK 30：stale canPublish 不能绕过 Domain Gate——以 Domain 重新评估结果为准，
      // 刷新失败 Gate 展示并重读 Repository，不继续显示旧的 5/5
      if (error instanceof ReleaseGateNotPassedError) {
        setValidation(error.validation);
        setRepoTick((t) => t + 1);
      }
      addToast?.(
        'error',
        '发布失败，正式版本保持不变',
        error instanceof Error
          ? `${error.message}。当前正式版本 ${formalVersion || '（无）'} 保持 ACTIVE 不受影响。`
          : `发布过程中断，当前正式版本 ${formalVersion || '（无）'} 保持 ACTIVE 不受影响。`
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const openPublishModal = () => {
    if (!canPublish) {
      addToast?.(
        'info',
        '发布检查未通过',
        `发布检查 ${passedGateCount}/5 通过，需五项检查全部通过后才能发布新版本。`
      );
      return;
    }
    setIsPublishModalOpen(true);
  };

  // 必要 empty state: Repository 中找不到该智能体定义
  if (!domain.def) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
        <header className="h-[68px] bg-white border-b border-[#E2E8F0] px-6 flex items-center shrink-0">
          <button
            onClick={onBackToRegistry || onBackToDefinition}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors cursor-pointer border border-[#E2E8F0]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回智能体中心</span>
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-[#CBD5E1] mx-auto" />
            <div className="text-sm font-bold text-[#0F172A]">未找到智能体定义</div>
            <p className="text-xs text-[#64748B]">
              Agent Repository 中不存在 ID 为 <span className="font-mono">{agentId}</span> 的智能体。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // TASK 21：五道门使用普通用户名称（配置检查 / 运行准备 / 运行依赖检查 / 测试运行 / 质量评估）；
  // Runtime 编译 / Runtime Projection / Runtime 依赖等技术细节只出现在说明或详情中
  const gateList: Array<{ key: keyof AgentReleaseValidation; title: string; desc: string }> = [
    {
      key: 'configCheck',
      title: RELEASE_GATE_LABELS.configCheck,
      desc: '智能体定义、任务绑定、工作范围、能力模式与模型策略均完整有效。'
    },
    {
      key: 'runtimeCompile',
      title: RELEASE_GATE_LABELS.runtimeCompile,
      desc: `当前草稿已通过运行准备检查，可生成${runtimeEngine}运行配置（当前为原型投影）。`
    },
    {
      key: 'runtimeDependencies',
      title: RELEASE_GATE_LABELS.runtimeDependencies,
      desc: '知识范围、技能与模型策略等运行依赖均可用。'
    },
    {
      key: 'testRun',
      title: RELEASE_GATE_LABELS.testRun,
      desc: '基础运行检查：草稿具备可执行的运行配置与启用任务（完整测试套件待测试引擎接入）。'
    },
    {
      key: 'qualityEvaluation',
      title: RELEASE_GATE_LABELS.qualityEvaluation,
      desc: `当前草稿满足「${agentName}」发布质量基线（配置、行为边界与运行依赖）。`
    }
  ];

  const draftFirstEnabledTask =
    domain.draft?.supportedTaskTemplates.find((t) => t.enabled)?.taskTemplateId ??
    domain.def.supportedTaskTemplates.find((t) => t.enabled)?.taskTemplateId;

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
                {kindLabel}
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
              {formalVersion ? formalVersion : '暂无'}
            </span>
          </div>

          {/* Status Tag 2: 草稿状态 */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 border rounded text-xs ${
              hasDraft
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
            }`}
          >
            <GitBranch className={`w-3 h-3 ${hasDraft ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`} />
            <span className="font-semibold">
              {!hasDraft
                ? '无未发布草稿'
                : isFirstRelease
                ? '首发草稿待发布'
                : '草稿待发布'}
            </span>
          </div>

          {/* Status Tag 3: 运行准备（TASK 25：不重点显示引擎名/MOCK_RUNTIME，Provider 移入检查详情） */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded text-xs text-[#334155]">
            <span
              className={`w-2 h-2 rounded-full ${
                runtimeReadiness === 'passed'
                  ? 'bg-[#16A36A]'
                  : runtimeReadiness === 'failed'
                  ? 'bg-red-500'
                  : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-[#0F172A]">
              运行准备 ·{' '}
              {runtimeReadiness === 'passed' ? '通过' : runtimeReadiness === 'failed' ? '未通过' : '待检查'}
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
              onClick={openPublishModal}
              disabled={!canPublish || isPublishing || !hasDraft}
              title={
                !hasDraft
                  ? '当前无未发布草稿'
                  : canPublish
                  ? `发布 ${targetNewVersion}`
                  : `发布检查 ${passedGateCount}/5，未全部通过`
              }
              className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
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
          在正式发布前，对当前草稿的配置、运行准备、测试结果与质量基线进行统一验证。
        </p>
        <span className="text-[11px] font-mono text-[#94A3B8] hidden md:inline">
          发布检查 {passedGateCount}/5 {canPublish ? '通过' : '未完成'} · 目标版本 {targetNewVersion}
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
                {validation && validation.configCheck === 'PASSED' && (
                  <Check className="w-3 h-3 text-[#16A36A]" />
                )}
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
                {validation && validation.testRun === 'PASSED' && (
                  <Check className="w-3 h-3 text-[#16A36A]" />
                )}
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
                {validation && validation.qualityEvaluation === 'PASSED' && (
                  <Check className="w-3 h-3 text-[#16A36A]" />
                )}
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
                          ? `${runtimeEngine} · ${
                              isMockIntegration ? 'MOCK_RUNTIME 投影' : '正式运行配置'
                            }`
                          : `${runtimeEngine} · 尚未建立正式运行配置`}
                      </span>
                    </div>

                    {/* Current Draft */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                      <span className="text-[11px] text-[#64748B] block">当前草稿</span>
                      <div className="font-bold text-xs text-[#2563EB]">
                        {!hasDraft
                          ? '无未发布草稿'
                          : isFirstRelease
                          ? '首发创建草稿'
                          : draftChanges.length > 0
                          ? `${draftChanges.length} 项修改`
                          : '与正式版一致'}
                      </div>
                      <span className="text-[10px] text-[#64748B] block truncate">
                        {!hasDraft
                          ? '最近发布后草稿已关闭'
                          : isFirstRelease
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
                        {hasDraft ? targetNewVersion : '—'}
                      </div>
                      <span className="text-[10px] text-[#64748B] block">
                        {hasDraft ? '由当前正式版本推导，发布成功后生效' : '无草稿，暂无待发布版本'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#94A3B8] pt-1">
                    {!hasDraft
                      ? '当前没有未发布草稿，请返回定义工作区发起修改。'
                      : isFirstRelease
                      ? `发布成功后将正式生成首发版本 ${targetNewVersion}，并建立 ${runtimeEngine} 运行时绑定（当前为 MOCK_RUNTIME 投影，真实 API 待接入）。`
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
                      {!hasDraft
                        ? '当前没有未发布草稿，暂无变更待审。'
                        : isFirstRelease
                        ? `首发版本上线，包含 ${
                            domain.draft?.supportedTaskTemplates.filter((t) => t.enabled).length ?? 0
                          } 项支持任务与基础能力模式配置。`
                        : draftChanges.length > 0
                        ? `相比正式版本 ${formalVersion}，本次准备发布以下 ${draftChanges.length} 项业务级修改。`
                        : `当前草稿与正式版本 ${formalVersion} 保持完全一致，无需额外差异调整。`}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    {!hasDraft ? (
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B]">
                        最近一次发布已完成，草稿已关闭；如需继续迭代请返回定义工作区编辑。
                      </div>
                    ) : isFirstRelease ? (
                      <div className="p-3 bg-white border border-blue-200 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A]">首发规格定义</span>
                          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                            NEW DRAFT
                          </span>
                        </div>
                        <div className="text-[11px] text-[#475569] leading-relaxed">
                          包含支持任务：{(vmDef?.tasks || []).map((t) => t.name).join('、')}；能力模式：{vmDef?.capabilityMode}。
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
                    {gateList.map((gate, idx) => (
                      <div
                        key={gate.key}
                        className={`flex items-start justify-between py-2 ${
                          idx < gateList.length - 1 ? 'border-b border-[#F1F5F9]' : ''
                        }`}
                      >
                        <div className="space-y-0.5 pr-4">
                          <div className="font-bold text-[#0F172A]">{gate.title}</div>
                          <p className="text-[11px] text-[#64748B]">{gate.desc}</p>
                        </div>
                        <GateStatusChip status={validation ? (validation[gate.key] as ReleaseCheckStatus) : 'PENDING'} />
                      </div>
                    ))}

                    {/* Bottom Gate Highlight */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">发布检查汇总结果 ({passedGateCount}/5)</span>
                      {canPublish ? (
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 text-[#16A36A] border border-emerald-200/80 rounded font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>发布检查通过 ｜ 满足发布条件</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded font-semibold text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>发布检查未通过 ｜ 暂不可发布</span>
                        </div>
                      )}
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
                        <div className="font-bold text-xs text-[#0F172A]">
                          {validation?.configCheck === 'PASSED' ? '全部通过' : validation?.configCheck === 'FAILED' ? '存在缺项' : '待检查'}
                        </div>
                        <button
                          onClick={() => setActiveSection('config_check')}
                          className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                        >
                          查看配置检查 →
                        </button>
                      </div>

                      {/* Sub-item 2 */}
                      <div className="space-y-1">
                        <div className="text-[11px] text-[#64748B]">运行准备</div>
                        <div className="font-bold text-xs text-[#0F172A]">
                          {validation?.runtimeCompile === 'PASSED' ? '已就绪' : '未就绪'}{' '}
                          <span className="text-[10px] font-normal text-[#64748B]">({runtimeEngine})</span>
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">发布前验证副本</div>
                      </div>

                      {/* Sub-item 3 */}
                      <div className="space-y-1">
                        <div className="text-[11px] text-[#64748B]">测试运行</div>
                        <div className="font-bold text-xs text-[#0F172A]">
                          {validation?.testRun === 'PASSED' ? '基础检查通过' : validation?.testRun === 'FAILED' ? '检查未通过' : '待检查'}
                        </div>
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
                        <div className="font-bold text-xs text-[#0F172A]">
                          {validation?.qualityEvaluation === 'PASSED' ? '满足发布标准' : validation?.qualityEvaluation === 'FAILED' ? '未达基线' : '待评估'}
                        </div>
                        <button
                          onClick={() => setActiveSection('quality_eval')}
                          className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                        >
                          查看质量评估 →
                        </button>
                      </div>
                    </div>

                    {/* 质量评估事实说明（TASK 20：删除固定假百分比，不虚构数值） */}
                    <div className="pt-3 border-t border-[#F1F5F9] space-y-1.5">
                      <div className="text-[11px] text-[#0F172A] font-semibold">质量评估说明</div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        当前质量评估基于：配置完整性、行为边界、运行依赖、发布策略基线。
                        真实离线评测指标将在 Evaluation Backend 接入后展示。
                      </p>
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
                      {agentName} 发布前验证 · 独立 Section 视图
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('release_overview')}
                    className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    返回发布概览
                  </button>
                </div>

                {/* Section View: 配置检查（展示 Draft 优先：releaseSource = draft ?? def） */}
                {activeSection === 'config_check' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="space-y-3">
                      <div className="font-bold text-[#0F172A]">智能体定义检查</div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#0F172A]">名称、主要职责与 Owner</span>
                          <span className={`font-semibold ${validation?.configCheck === 'FAILED' ? 'text-red-600' : 'text-[#16A36A]'}`}>
                            {validation?.configCheck === 'PASSED' ? '有效' : validation?.configCheck === 'FAILED' ? '无效' : '待检查'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          {agentName} · {releaseSource.owner} · 职责定义完整 ({releaseSource.responsibilitySummary.length}/500)
                        </p>
                      </div>

                      <div className="font-bold text-[#0F172A] pt-2">工作范围与能力模式检查</div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#0F172A]">范围资产与能力模式挂载</span>
                          <span className="font-semibold text-[#16A36A]">
                            {releaseSource.allowedContextSources.length >= 1 ? '有效' : '无效'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          {releaseSource.allowedContextSources.length} 个允许上下文来源（{releaseSource.allowedContextSources.join('、')}）；实际运行范围仍由用户权限与任务范围收敛。
                        </p>
                      </div>

                      <div className="font-bold text-[#0F172A] pt-2">运行准备检查详情</div>
                      <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#1E40AF]">运行配置兼容性</span>
                          <span className="text-[#2563EB] font-semibold">
                            {validation?.runtimeCompile === 'PASSED' ? '已就绪' : '未就绪'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#2563EB]">
                          目标引擎 {runtimeEngine} ·{' '}
                          {isMockIntegration
                            ? 'MOCK_RUNTIME 投影（真实 Runtime API 未接入，仅本地结构校验）'
                            : '已完成协议编译'}
                          ；运行依赖检查{validation?.runtimeDependencies === 'PASSED' ? '通过' : '未通过'}。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section View: 测试运行（TASK 18：V1.1 为基础运行检查 / Smoke Readiness，
                    不宣称真实完整 Test Suite；未来测试引擎接入后替换内部实现） */}
                {activeSection === 'test_run' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#0F172A]">
                        基础运行检查 ({validation?.testRun === 'PASSED' ? '通过' : validation?.testRun === 'FAILED' ? '未通过' : '待检查'})
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        当前为 V1.1 原型的基础运行检查（Smoke Readiness）：验证草稿具备可执行的运行配置与启用任务；完整测试套件将在测试引擎接入后执行。
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-[#0F172A]">
                            {vmDef?.testSandbox?.suggestedQueries?.[0]
                              ? `测试案例 1：${vmDef.testSandbox.suggestedQueries[0]}`
                              : `测试案例 1：${agentName} 核心任务能力探查`}
                          </div>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded border ${
                              validation?.testRun === 'PASSED'
                                ? 'text-[#16A36A] bg-emerald-50 border-emerald-200'
                                : 'text-amber-700 bg-amber-50 border-amber-200'
                            }`}
                          >
                            {validation?.testRun === 'PASSED' ? '测试通过' : '待执行'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                          <div>Routing: <span className="font-mono text-[#0F172A]">{draftFirstEnabledTask || '未绑定任务'}</span></div>
                          <div>Agent: <span className="text-[#0F172A]">{hasDraft ? '当前草稿' : '正式版本'}</span></div>
                          <div>Runtime: <span className="text-[#0F172A]">{runtimeEngine} · {isMockIntegration ? 'MOCK_RUNTIME' : '验证副本'}</span></div>
                          <div>Evidence: <span className="font-bold text-[#0F172A]">{releaseSource.allowedContextSources.length} 项允许来源</span></div>
                        </div>
                        <div className="text-[11px] text-[#334155] bg-white p-2.5 rounded border border-[#E2E8F0]">
                          <strong>回答摘要：</strong>{' '}
                          {vmDef?.testSandbox?.sampleResponses?.[0]?.reply
                            ? vmDef.testSandbox.sampleResponses[0].reply.split('\n')[0]
                            : `已通过 ${runtimeEngine} 运行时验证，草稿配置符合业务规范与执行标准。`}
                        </div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">
                            {vmDef?.testSandbox?.suggestedQueries?.[1]
                              ? `测试案例 2：${vmDef.testSandbox.suggestedQueries[1]}`
                              : `测试案例 2：${vmDef?.tasks?.[0]?.name || '基础支持任务'}边界校验`}
                          </div>
                          <div className="text-[11px] text-[#64748B]">命中受管资产：{vmDef?.contextSources?.[0]?.label || '受管业务语义'} · 状态: 正常</div>
                        </div>
                        <span className={`font-semibold ${validation?.testRun === 'PASSED' ? 'text-[#16A36A]' : 'text-amber-600'}`}>
                          {validation?.testRun === 'PASSED' ? '通过' : '待执行'}
                        </span>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">
                            测试案例 3：{vmDef?.tasks?.[1]?.name || '多维意图与策略识别'}联动执行探查
                          </div>
                          <div className="text-[11px] text-[#64748B]">运行引擎：{runtimeEngine} · 自主程度: {releaseSource.maxAutonomyDesc || '建议'}</div>
                        </div>
                        <span className={`font-semibold ${validation?.testRun === 'PASSED' ? 'text-[#16A36A]' : 'text-amber-600'}`}>
                          {validation?.testRun === 'PASSED' ? '通过' : '待执行'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section View: 质量评估 */}
                {activeSection === 'quality_eval' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0F172A]">
                        发布质量基线 ({validation?.qualityEvaluation === 'PASSED' ? '满足发布标准' : validation?.qualityEvaluation === 'FAILED' ? '未达基线' : '待评估'})
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          validation?.qualityEvaluation === 'PASSED'
                            ? 'text-[#16A36A] bg-emerald-50 border-emerald-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {validation?.qualityEvaluation === 'PASSED' ? '满足发布标准' : '待评估'}
                      </span>
                    </div>

                    {/* TASK 19/20：V1.1 为 Policy / Configuration Baseline Evaluation，
                        不虚构评测百分比；真实 Eval Backend 接入后替换本视图内部实现 */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-[#0F172A]">当前质量评估基于</div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-[#475569]">
                        <li>配置完整性：定义、任务、工作范围、能力模式与模型策略全部有效</li>
                        <li>行为边界：角色行为说明完整，自主程度不超过能力模板上限</li>
                        <li>运行依赖：目标运行时的依赖检查已通过</li>
                        <li>发布策略基线：满足平台发布门禁策略</li>
                      </ul>
                    </div>

                    <p className="text-[10px] text-[#94A3B8]">
                      真实离线评测指标将在 Evaluation Backend 接入后展示；质量发布门以发布检查结果为准。
                    </p>
                  </div>
                )}

                {/* Section View: 发布记录 —— 从 Agent Repository 版本历史读取 */}
                {activeSection === 'release_history' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden text-xs">
                    {domain.versions.length === 0 ? (
                      <div className="p-10 text-center text-[#64748B] space-y-1">
                        <History className="w-6 h-6 text-[#CBD5E1] mx-auto" />
                        <div className="text-xs font-semibold text-[#334155]">暂无发布记录</div>
                        <p className="text-[11px]">首次发布成功后，不可变版本历史将在此沉淀。</p>
                      </div>
                    ) : (
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
                          {domain.versions.map((v) => {
                            const isCurrent = v.versionNumber === formalVersion;
                            return (
                              <tr key={v.versionId} className={isCurrent ? 'bg-blue-50/40 font-medium' : ''}>
                                <td className={`py-3 px-4 font-mono font-bold ${isCurrent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                                  {v.versionNumber}
                                </td>
                                <td className="py-3 px-4">
                                  {isCurrent ? (
                                    <span className="text-[10px] bg-emerald-50 text-[#16A36A] px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                                      当前正式
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-[#475569] px-1.5 py-0.5 rounded">
                                      历史
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-[#475569]">{v.publishedAt}</td>
                                <td className="py-3 px-4 font-mono text-[#64748B]">
                                  {v.snapshot.runtimeTarget === 'WEKNORA' ? 'WeKnora · MOCK_RUNTIME' : 'Semovix Native'}
                                </td>
                                <td className="py-3 px-4 text-[#334155]">{v.releaseNotes || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
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
                  {runtimeEngine} {isMockIntegration ? '· MOCK_RUNTIME' : ''}
                </span>
              </div>
            </div>

            {/* Target Draft */}
            <div className="space-y-0.5 pt-2 border-t border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B] block">当前草稿</span>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${hasDraft ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
                  {!hasDraft
                    ? '无未发布草稿'
                    : isFirstRelease
                    ? '首发创建草稿'
                    : draftChanges.length > 0
                    ? `${draftChanges.length} 项修改`
                    : '与正式版一致'}
                </span>
                <span className="font-mono font-bold text-[#0F172A]">
                  {hasDraft ? `预计版本：${targetNewVersion}` : '无待发布版本'}
                </span>
              </div>
            </div>

            {/* Changes list */}
            <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] space-y-1 text-[#334155]">
              <div className="font-semibold text-[#0F172A]">本次主要变更：</div>
              {!hasDraft ? (
                <div>• 无未发布草稿，配置与线上正式版本一致</div>
              ) : isFirstRelease ? (
                <div>• 首发正式上线并建立运行时绑定</div>
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
                <span className="text-[#64748B]">运行准备</span>
                <span className={`font-mono font-bold ${validation?.runtimeCompile === 'PASSED' ? 'text-[#16A36A]' : 'text-amber-600'}`}>
                  {validation?.runtimeCompile === 'PASSED' ? 'Ready' : '未就绪'}
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8] leading-tight">
                {isMockIntegration
                  ? 'MOCK_RUNTIME 投影：仅用于发布前验证，未接入真实 Runtime API。'
                  : '仅用于发布前验证，尚未替代当前正式 Runtime。'}
              </p>
            </div>

            {/* Release Gate Highlight */}
            <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64748B]">发布门</span>
                <span className="font-bold text-[#0F172A]">{passedGateCount} / 5 已通过</span>
              </div>

              {canPublish ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-[#16A36A] rounded text-xs font-bold flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>可以发布</span>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-xs font-bold flex items-center justify-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>门禁未满足 ｜ 不可发布</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Publish Action: canPublish = true 才启用 */}
          <div className="pt-2 space-y-2">
            <button
              onClick={openPublishModal}
              disabled={!canPublish || isPublishing || !hasDraft}
              title={
                !hasDraft
                  ? '当前无未发布草稿'
                  : canPublish
                  ? `发布 ${targetNewVersion}`
                  : `发布检查 ${passedGateCount}/5，未全部通过`
              }
              className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>
                {!hasDraft
                  ? '无草稿可发布'
                  : isFirstRelease
                  ? `发布首发版本 ${targetNewVersion}`
                  : `发布新版本 ${targetNewVersion}`}
              </span>
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
                    {runtimeEngine}（{isMockIntegration ? 'MOCK_RUNTIME 投影' : '正式连接'}）
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-[#0F172A]">本次主要变更：</div>
                <ul className="list-disc list-inside space-y-1 text-[#475569] pl-1">
                  {draftChanges.length > 0 ? (
                    draftChanges.map((change, idx) => (
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
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {(
                    [
                      [RELEASE_GATE_LABELS.configCheck, validation?.configCheck],
                      [RELEASE_GATE_LABELS.runtimeCompile, validation?.runtimeCompile],
                      [RELEASE_GATE_LABELS.runtimeDependencies, validation?.runtimeDependencies],
                      [RELEASE_GATE_LABELS.testRun, validation?.testRun],
                      [RELEASE_GATE_LABELS.qualityEvaluation, validation?.qualityEvaluation]
                    ] as Array<[string, ReleaseCheckStatus | undefined]>
                  ).map(([label, status]) => (
                    <div
                      key={label}
                      className={`flex items-center space-x-1 ${
                        status === 'PASSED' ? 'text-[#16A36A]' : status === 'FAILED' ? 'text-red-600' : 'text-[#94A3B8]'
                      }`}
                    >
                      {status === 'PASSED' ? (
                        <Check className="w-3 h-3" />
                      ) : status === 'FAILED' ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>
                        {label}
                        {status === 'PASSED' ? '通过' : status === 'FAILED' ? '未通过' : '待检查'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[11px] text-[#475569] leading-relaxed">
                <strong>发布保障：</strong>{' '}
                {isFirstRelease
                  ? `发布将首次建立「${agentName}」在 ${runtimeEngine} 中的运行时绑定（当前为 MOCK_RUNTIME 投影），发布后即可在受控范围提供服务。`
                  : `候选版本先经 Runtime 校验与激活，全部成功后才切换正式版本；若任一步失败，线上正式版本 ${formalVersion} 保持 ACTIVE 不受影响。`}
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
                disabled={isPublishing || !canPublish}
                onClick={handleConfirmPublish}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
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
