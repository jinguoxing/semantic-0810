import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  GitBranch,
  Play,
  Save,
  ExternalLink,
  FileText,
  Info,
  Layers,
  Database,
  Sparkles,
  Sliders,
  Shield,
  Cpu,
  Lock,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import {
  AgentContextBinding,
  ContextSelectionMode,
  MaxAutonomy,
  TaskTemplateBinding,
  UpdateAgentDraftPatch,
  AGENT_CONTEXT_SOURCE_VIEWS,
  MAX_AUTONOMY_VIEWS,
  MODEL_POLICY_OPTIONS,
  getTaskTemplateView
} from '../domain/agent/agentTypes';
import {
  getPresetById,
  TEMPLATE_AUTONOMY_OPTIONS,
  TEMPLATE_CAPABILITY_OPTIONS
} from '../domain/agent/agentPresets';
import { agentSelectors } from '../domain/agent/agentSelectors';
import { agentRepository } from '../domain/agent/agentRepository';
import { TEMPLATE_SCOPE_CONFIGS, describeScopeBinding } from '../data/agentScopeOptions';
import { getRuntimeAdapter } from '../domain/agent/runtime/adapters';
import type { RuntimeHealth } from '../domain/agent/runtime/runtimeTypes';

export interface AgentDefinitionWorkspaceProps {
  agentId?: string;
  /**
   * Runtime 技术诊断入口开关（V1.1 §5.3）：默认 false。
   * false 时普通 A03 不出现任何 Runtime 技术信息（引擎 / Revision / 集成状态）；
   * true 时仅增加一个弱入口「高级信息 → 运行与诊断」（不新增页面）。
   */
  showRuntimeDiagnostics?: boolean;
  onBackToRegistry: () => void;
  /** 进入 A04 的唯一正常入口（由「测试草稿」在自动保存成功后调用） */
  onNavigateToPublish?: () => void;
  /**
   * 唯一保存合同（V1.1 §28）：各 Section 的修改统一构造 UpdateAgentDraftPatch，
   * 由 App 层调用 agentService.updateAgentDraft() 写入同一个 AgentDraft。
   * 返回 false 表示 Domain 校验失败（A03 据此不提示保存成功 / 不进入 A04）。
   */
  onSaveDraftPatch?: (patch: UpdateAgentDraftPatch) => boolean;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

type SectionKey =
  | 'overview'
  | 'basic_info'
  | 'tasks'
  | 'scope'
  | 'capabilities'
  | 'model_autonomy';

/** 只读展示字段（内置锁定项）：readonly + lock icon + 「平台内置定义」提示，不用 Disabled 大灰块 */
const LockedField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="space-y-1">
    <div className="flex items-center space-x-1.5">
      <label className="font-bold text-[#0F172A]">{label}</label>
      <span className="flex items-center space-x-0.5 text-[10px] text-[#94A3B8]">
        <Lock className="w-3 h-3" />
        <span>平台内置定义</span>
      </span>
    </div>
    <div className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#334155] whitespace-pre-wrap leading-relaxed">
      {value}
    </div>
  </div>
);

export const AgentDefinitionWorkspace: React.FC<AgentDefinitionWorkspaceProps> = ({
  agentId,
  showRuntimeDiagnostics = false,
  onBackToRegistry,
  onNavigateToPublish,
  onSaveDraftPatch,
  addToast
}) => {
  // ─────────────────────────────────────────────────────────────
  // Domain-backed Workspace State（TASK 3 / TASK 18）：
  // A03 配置 SoT = AgentDraft > Published Snapshot > AgentDefinition，
  // 不再依赖 AgentItem / INITIAL_AGENT_DEFINITIONS 展示 Fixture。
  // ─────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [domainTick, setDomainTick] = useState(0); // 保存成功后强制从 Repository 重读

  const ws = useMemo(
    () => (agentId ? agentSelectors.getDefinitionWorkspaceState(agentId) : null),
    [agentId, domainTick]
  );

  const isBuiltIn = ws?.origin === 'BUILT_IN';
  const originLabel = isBuiltIn ? '内置' : '自定义';
  const preset = ws?.sourcePresetId ? getPresetById(ws.sourcePresetId) : undefined;

  // ── 本地编辑状态（每次 ws 变化重新播种；保存 round-trip 永远经过 Domain） ──
  const [editName, setEditName] = useState('');
  const [editResponsibility, setEditResponsibility] = useState('');
  const [editRoleInstruction, setEditRoleInstruction] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editTasks, setEditTasks] = useState<TaskTemplateBinding[]>([]);
  const [editScopeMode, setEditScopeMode] = useState<ContextSelectionMode>('ALL_ALLOWED');
  const [editScopeResourceIds, setEditScopeResourceIds] = useState<string[]>([]);
  const [editCapabilityPreset, setEditCapabilityPreset] = useState('');
  const [editModelPolicyId, setEditModelPolicyId] = useState('');
  const [editMaxAutonomy, setEditMaxAutonomy] = useState<MaxAutonomy>('SUGGEST');
  const [isRoleInstructionOpen, setIsRoleInstructionOpen] = useState(false); // 高级角色说明默认折叠

  const scopeConfig = useMemo(
    () => (ws?.sourcePresetId ? TEMPLATE_SCOPE_CONFIGS[ws.sourcePresetId] : undefined),
    [ws?.sourcePresetId]
  );

  useEffect(() => {
    if (!ws) return;
    setEditName(ws.editable.name);
    setEditResponsibility(ws.editable.responsibilitySummary);
    setEditRoleInstruction(ws.editable.roleInstruction);
    setEditOwner(ws.editable.owner);
    setEditTasks(ws.editable.supportedTaskTemplates.map((b) => ({ ...b })));
    const primary = scopeConfig
      ? ws.editable.contextBindings.find((b) => b.sourceType === scopeConfig.sourceType)
      : undefined;
    setEditScopeMode(primary?.selectionMode ?? 'ALL_ALLOWED');
    setEditScopeResourceIds([...(primary?.resourceIds ?? [])]);
    setEditCapabilityPreset(ws.editable.capabilityPreset);
    setEditModelPolicyId(ws.editable.modelPolicyId);
    setEditMaxAutonomy(ws.editable.maxAutonomy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws]);

  /** 主范围可编辑：模板主范围来源必须在当前允许来源内（Domain 校验为最终裁决，UI 只提前 disable） */
  const scopeEditable = Boolean(
    ws && scopeConfig && ws.editable.allowedContextSources.includes(scopeConfig.sourceType)
  );

  // ── 受控选项目录（模板边界） ──
  const capabilityOptions = useMemo(() => {
    if (!ws) return [];
    const options = ws.sourcePresetId ? TEMPLATE_CAPABILITY_OPTIONS[ws.sourcePresetId] ?? [] : [];
    // 当前值不在受控选项内（历史数据）时合并展示，避免出现错误的选中态
    if (!options.some((o) => o.capabilityPreset === ws.editable.capabilityPreset)) {
      return [
        ...options,
        { capabilityPreset: ws.editable.capabilityPreset, capabilityDesc: ws.editable.capabilityDesc || '' }
      ];
    }
    return options;
  }, [ws]);

  const autonomyOptions = useMemo(
    () =>
      (ws?.sourcePresetId && TEMPLATE_AUTONOMY_OPTIONS[ws.sourcePresetId]) || [
        { maxAutonomy: 'SUGGEST' as MaxAutonomy, desc: '以提供方案与建议为主' }
      ],
    [ws?.sourcePresetId]
  );

  const modelPolicySelectOptions = useMemo(() => {
    if (ws && !MODEL_POLICY_OPTIONS.some((o) => o.modelPolicyId === ws.editable.modelPolicyId)) {
      return [
        ...MODEL_POLICY_OPTIONS,
        {
          modelPolicyId: ws.editable.modelPolicyId,
          modelPolicyName: ws.editable.modelPolicyName || ws.editable.modelPolicyId,
          desc: ''
        }
      ];
    }
    return MODEL_POLICY_OPTIONS;
  }, [ws]);

  // ─────────────────────────────────────────────────────────────
  // Save Contract（TASK 27 / TASK 28）：本次可编辑字段统一构造 Domain Patch；
  // Built-in 锁定字段（名称 / 职责 / 角色说明 / 任务绑定）不进入 Patch。
  // ─────────────────────────────────────────────────────────────
  const buildPatch = (): UpdateAgentDraftPatch => {
    if (!ws) return {};
    const patch: UpdateAgentDraftPatch = {};
    if (!isBuiltIn) {
      patch.name = editName;
      patch.description = editResponsibility; // 「主要职责」同时映射 description + responsibilitySummary，不新增 UI 字段
      patch.responsibilitySummary = editResponsibility;
      patch.roleInstruction = editRoleInstruction;
      patch.supportedTaskTemplates = editTasks.map((b) => ({ ...b }));
    }
    patch.owner = editOwner;
    if (scopeConfig && scopeEditable) {
      const primary: AgentContextBinding = {
        sourceType: scopeConfig.sourceType,
        selectionMode: editScopeMode,
        resourceIds: editScopeMode === 'SELECTED' ? [...editScopeResourceIds] : undefined
      };
      patch.contextBindings = [
        ...ws.editable.contextBindings.filter((b) => b.sourceType !== scopeConfig.sourceType),
        primary
      ];
    }
    if (capabilityOptions.length > 1) {
      const selected = capabilityOptions.find((o) => o.capabilityPreset === editCapabilityPreset);
      patch.capabilityPreset = editCapabilityPreset;
      patch.capabilityDesc = selected?.capabilityDesc ?? ws.editable.capabilityDesc;
    }
    const policy = modelPolicySelectOptions.find((o) => o.modelPolicyId === editModelPolicyId);
    patch.modelPolicyId = editModelPolicyId;
    patch.modelPolicyName = policy?.modelPolicyName ?? ws.editable.modelPolicyName;
    const autonomy = autonomyOptions.find((o) => o.maxAutonomy === editMaxAutonomy);
    patch.maxAutonomy = editMaxAutonomy;
    patch.maxAutonomyDesc = autonomy?.desc ?? ws.editable.maxAutonomyDesc;
    return patch;
  };

  const scopeIncomplete =
    scopeEditable && editScopeMode === 'SELECTED' && editScopeResourceIds.length === 0;

  /**
   * 支持任务展示列表（TASK 15）：Draft 绑定 ∪ 模板任务集合；
   * 模板有但 Draft 没有的任务以「未启用」展示，勾选后 upsert 进 Draft 绑定。
   */
  const displayTasks: TaskTemplateBinding[] = useMemo(() => {
    if (!preset) return editTasks;
    const known = new Set(editTasks.map((t) => t.taskTemplateId));
    const missing = preset.supportedTaskTemplates
      .filter((t) => !known.has(t.taskTemplateId))
      .map((t) => ({ ...t, enabled: false }));
    return [...editTasks, ...missing];
  }, [editTasks, preset]);

  const toggleTask = (task: TaskTemplateBinding, enabled: boolean) => {
    setEditTasks((prev) => {
      if (prev.some((t) => t.taskTemplateId === task.taskTemplateId)) {
        return prev.map((t) => (t.taskTemplateId === task.taskTemplateId ? { ...t, enabled } : t));
      }
      return [...prev, { ...task, enabled }];
    });
  };

  /** 保存草稿：A03 所有编辑统一经 updateAgentDraft 写入同一个 AgentDraft */
  const handleSaveDraft = () => {
    if (!ws || !onSaveDraftPatch) return;
    if (scopeIncomplete) {
      addToast?.('error', '工作范围不完整', '指定范围必须至少选择一个资源');
      return;
    }
    const ok = onSaveDraftPatch(buildPatch());
    if (ok) {
      setDomainTick((t) => t + 1); // 从 Repository 重读最新 Draft（Domain 是 SoT）
      addToast?.(
        'success',
        '草稿已保存',
        ws.formalVersion
          ? `「${editName || ws.editable.name}」草稿已保存，线上 ${ws.formalVersion} 正式版保持稳定运行`
          : `「${editName || ws.editable.name}」未发布草稿已保存，待完成验证后发布首个正式版本`
      );
    }
  };

  /**
   * 测试草稿：唯一测试 / 发布入口（TASK 11 / AC-15）。
   * 先自动保存全部草稿配置 → 保存成功才进入 A04；Domain 校验失败则停留本页。
   */
  const handleTestDraft = () => {
    if (!onNavigateToPublish) return;
    if (onSaveDraftPatch) {
      if (scopeIncomplete) {
        addToast?.('error', '工作范围不完整', '指定范围必须至少选择一个资源');
        return;
      }
      const ok = onSaveDraftPatch(buildPatch());
      if (!ok) return; // Domain 校验失败：不进入 A04
      setDomainTick((t) => t + 1);
      addToast?.(
        'info',
        '草稿已自动保存',
        `「${editName || ws?.editable.name || '智能体'}」草稿已自动保存，正在进入测试与发布工作区`
      );
    }
    onNavigateToPublish();
  };

  // ─────────────────────────────────────────────────────────────
  // 高级信息 → 运行与诊断（仅 showRuntimeDiagnostics=true 可达；
  // 复用 Runtime Adapter / Health Logic，Runtime Domain 不删不改）
  // ─────────────────────────────────────────────────────────────
  const [isRuntimeModalOpen, setIsRuntimeModalOpen] = useState(false);
  const [runtimeHealth, setRuntimeHealth] = useState<RuntimeHealth | null>(null);
  const runtimeBinding = ws ? agentRepository.getRuntimeBinding(ws.agentId) : undefined;
  // WeKnora 真实 API 未接入 —— 诊断视图如实标注 MOCK_RUNTIME，不伪装已同步
  const runtimeEngineLabel = ws?.runtimeTarget === 'WEKNORA' ? 'WeKnora' : 'Semovix Native';

  useEffect(() => {
    if (!isRuntimeModalOpen || !ws) return;
    let cancelled = false;
    getRuntimeAdapter(ws.runtimeTarget)
      .getHealth({
        bindingId: runtimeBinding?.bindingId ?? `view_${ws.agentId}`,
        agentId: ws.agentId,
        runtimeTarget: ws.runtimeTarget,
        runtimeStatus: runtimeBinding?.runtimeStatus ?? 'MOCK_RUNTIME',
        integrationMode: runtimeBinding?.integrationMode ?? 'MOCK_RUNTIME'
      })
      .then((health) => {
        if (!cancelled) setRuntimeHealth(health);
      })
      .catch(() => {
        if (!cancelled) setRuntimeHealth(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRuntimeModalOpen, ws?.agentId, ws?.runtimeTarget]);

  // ─────────────────────────────────────────────────────────────
  // 未找到智能体（Domain 中无定义）：诚实空态，不从 UI Fixture 反推
  // ─────────────────────────────────────────────────────────────
  if (!ws) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-3">
          <div className="text-sm font-bold text-[#0F172A]">未找到智能体定义</div>
          <p className="text-xs text-[#64748B]">该智能体不存在于智能体注册表，请返回列表重新选择。</p>
          <button
            onClick={onBackToRegistry}
            className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold cursor-pointer"
          >
            返回智能体中心
          </button>
        </div>
      </div>
    );
  }

  const enabledTaskCount = ws.editable.supportedTaskTemplates.filter((t) => t.enabled).length;
  const enabledTaskNames = ws.editable.supportedTaskTemplates
    .filter((t) => t.enabled)
    .map((t) => getTaskTemplateView(t.taskTemplateId).name);
  const primaryScopeBinding = scopeConfig
    ? ws.editable.contextBindings.find((b) => b.sourceType === scopeConfig.sourceType)
    : undefined;
  const scopeSummary = primaryScopeBinding ? describeScopeBinding(primaryScopeBinding) : '尚未配置主工作范围';
  const scopeConfigured = Boolean(
    primaryScopeBinding &&
      (primaryScopeBinding.selectionMode === 'ALL_ALLOWED' || (primaryScopeBinding.resourceIds?.length ?? 0) > 0)
  );
  const isNewCustomDraft = !isBuiltIn && !ws.formalVersion;
  const currentPolicy = modelPolicySelectOptions.find((o) => o.modelPolicyId === ws.editable.modelPolicyId);

  const saveButton = (
    <button
      onClick={handleSaveDraft}
      disabled={!onSaveDraftPatch}
      className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
    >
      <Save className="w-3 h-3" />
      <span>保存草稿</span>
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* ─────────────────────────────────────────────────────────────
          HEADER：徽章 = 内置/自定义；状态只保留 正式版本 + 草稿状态（无 Runtime 项）
      ───────────────────────────────────────────────────────────── */}
      <header className="h-[68px] bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center space-x-4 min-w-0">
          <button
            onClick={onBackToRegistry}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer border border-[#E2E8F0] shrink-0"
            title="返回智能体中心列表"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>智能体</span>
          </button>
          <div className="h-5 w-px bg-[#E2E8F0] shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center space-x-2 text-[11px] text-[#64748B]">
              <span onClick={onBackToRegistry} className="hover:text-[#0F172A] cursor-pointer transition-colors">
                智能体中心
              </span>
              <span>/</span>
              <span className="text-[#0F172A] font-medium truncate">{ws.editable.name}</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <h1 className="text-sm font-bold text-[#0F172A] tracking-tight truncate">{ws.editable.name}</h1>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                  isBuiltIn
                    ? 'bg-violet-50 text-violet-700 border-violet-200/60'
                    : 'bg-blue-50 text-[#2563EB] border-blue-200/60'
                }`}
              >
                {originLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Tag 1: 正式版本 */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#334155]">
            <span className="text-[#64748B]">正式版本</span>
            {ws.formalVersion ? (
              <span className="font-mono font-semibold text-[#0F172A]">{ws.formalVersion}</span>
            ) : (
              <span className="font-semibold text-[#94A3B8]">暂无</span>
            )}
          </div>

          {/* Tag 2: 草稿状态（事实源 = formalVersion + hasDraft；businessDiffs 仅作变更摘要附注，不作为状态依据） */}
          {ws.formalVersion === null ? (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <GitBranch className="w-3 h-3 text-amber-600" />
              <span className="font-semibold">未发布草稿</span>
            </div>
          ) : ws.hasDraft ? (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs text-[#1E40AF]">
              <GitBranch className="w-3 h-3 text-[#2563EB]" />
              <span className="font-semibold">
                有未发布草稿
                {ws.businessDiffs.length > 0 ? ` · 已记录 ${ws.businessDiffs.length} 项变更摘要` : ''}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#334155]">
              <GitBranch className="w-3 h-3 text-[#64748B]" />
              <span className="font-semibold">当前无未发布草稿</span>
            </div>
          )}

          {/* Actions：只有 保存草稿 / 测试草稿（测试草稿 = 唯一 A04 入口） */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#E2E8F0]">
            <button
              onClick={handleTestDraft}
              disabled={!onNavigateToPublish || !onSaveDraftPatch}
              title="自动保存草稿并进入测试与发布工作区"
              className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3 h-3 text-[#2563EB]" />
              <span>测试草稿</span>
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={!onSaveDraftPatch}
              className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3 h-3" />
              <span>保存草稿</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header：职责摘要 + 类型 / Owner / 弱化 Agent ID（不与 Runtime 技术串拼接） */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-2 text-xs text-[#64748B] flex items-center justify-between">
        <p className="truncate">{ws.editable.responsibilitySummary}</p>
        <span className="text-[11px] text-[#94A3B8] hidden md:inline shrink-0 pl-4">
          类型：{originLabel} · Owner：{ws.editable.owner}
          <span className="font-mono ml-2">ID: {ws.agentId}</span>
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─────────────────────────────────────────────────────────
            COLUMN A. 左侧导航：概览 / 基本信息 / 支持任务 / 工作范围 / 能力 / 模型与自主程度
            （普通一级导航无「运行引擎」；Runtime 仅在高级信息弱入口）
        ───────────────────────────────────────────────────────── */}
        <aside className="w-[200px] bg-white border-r border-[#E2E8F0] flex flex-col justify-between p-3 shrink-0 select-none overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] tracking-wider uppercase">
              定义配置
            </div>
            {(
              [
                { key: 'overview', label: '概览', icon: FileText },
                { key: 'basic_info', label: '基本信息', icon: Info },
                { key: 'tasks', label: '支持任务', icon: Layers },
                { key: 'scope', label: '工作范围', icon: Database },
                { key: 'capabilities', label: '能力', icon: Sparkles },
                { key: 'model_autonomy', label: '模型与自主程度', icon: Sliders }
              ] as Array<{ key: SectionKey; label: string; icon: React.ElementType }>
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                  activeSection === key
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                {activeSection === key && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
                )}
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {/* 高级信息：仅 showRuntimeDiagnostics=true 时出现的弱入口（不新增页面） */}
            {showRuntimeDiagnostics && (
              <div className="p-2.5 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-md space-y-1.5">
                <div className="text-[10px] font-semibold text-[#94A3B8] tracking-wider uppercase">高级信息</div>
                <button
                  onClick={() => setIsRuntimeModalOpen(true)}
                  className="w-full flex items-center space-x-1.5 px-2 py-1.5 rounded text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-white border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                >
                  <Cpu className="w-3 h-3" />
                  <span>运行与诊断</span>
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </button>
              </div>
            )}

            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[11px] text-[#64748B] space-y-1">
              <div className="font-semibold text-[#0F172A] flex items-center space-x-1">
                <Shield className="w-3 h-3 text-[#2563EB]" />
                <span>Semovix 统一管控</span>
              </div>
              <p className="text-[10px] text-[#94A3B8] leading-tight">
                智能体生命周期由平台安全治理协议统一护航。
              </p>
            </div>
          </div>
        </aside>

        {/* ─────────────────────────────────────────────────────────
            COLUMN B. 主工作区
        ───────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC]">
          <div className="max-w-[960px] mx-auto space-y-6">
            {activeSection === 'overview' ? (
              <>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] tracking-tight">概览</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    查看「{ws.editable.name}」当前职责、类型、草稿状态与行为边界。
                  </p>
                </div>

                {/* 新建自定义智能体的轻量 Guidance（TASK 31：无 Stepper / KPI / 进度条） */}
                {isNewCustomDraft && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                      <GitBranch className="w-3.5 h-3.5 text-amber-700" />
                      <span>智能体草稿已创建，还需要完成发布验证</span>
                    </div>
                    <div className="text-[11px] text-amber-800 flex items-center flex-wrap gap-x-4 gap-y-1">
                      <span>
                        基础定义 <span className="font-semibold text-amber-900">已完成</span>
                      </span>
                      <span>
                        工作范围{' '}
                        <span className="font-semibold text-amber-900">{scopeConfigured ? '已配置' : '待完善'}</span>
                      </span>
                      <span>
                        发布验证 <span className="font-semibold text-amber-900">待完成</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700/90">
                      完善定义后测试草稿，通过发布验证后才会正式生效。
                    </p>
                  </div>
                )}

                {/* 智能体职责 */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <h3 className="text-xs font-bold text-[#0F172A]">智能体职责</h3>
                  <p className="text-xs text-[#334155] leading-relaxed text-justify">
                    {ws.editable.responsibilitySummary}
                  </p>
                  <p className="text-[11px] text-[#94A3B8] pt-1">
                    角色说明由 Agent Definition 管理；平台安全、权限与执行协议由 Semovix 统一控制。
                  </p>
                </div>

                {/* 当前定义摘要（无 Runtime 项） */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-2xs space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">当前定义摘要</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {ws.editableSource === 'DRAFT'
                        ? '基于当前草稿配置'
                        : ws.editableSource === 'PUBLISHED_SNAPSHOT'
                          ? '基于当前正式版本快照（编辑后将生成草稿）'
                          : '基于定义基线'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-[#F1F5F9]">
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">支持任务</div>
                      <div className="text-xs font-bold text-[#0F172A]">{enabledTaskCount} 项启用</div>
                      <div
                        className="text-[10px] text-[#94A3B8] truncate"
                        title={ws.editable.supportedTaskTemplates
                          .map((t) => getTaskTemplateView(t.taskTemplateId).name)
                          .join(' · ')}
                      >
                        {ws.editable.supportedTaskTemplates
                          .map((t) => getTaskTemplateView(t.taskTemplateId).name)
                          .join(' · ')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">工作范围</div>
                      <div className="text-xs font-bold text-[#0F172A]">
                        {scopeConfigured
                          ? primaryScopeBinding?.selectionMode === 'ALL_ALLOWED'
                            ? '按权限动态'
                            : `${primaryScopeBinding?.resourceIds?.length ?? 0} 项指定`
                          : '未配置'}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] truncate" title={scopeSummary}>
                        {scopeSummary}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">能力模式</div>
                      <div
                        className="text-xs font-bold text-[#2563EB] truncate"
                        title={ws.editable.capabilityPreset}
                      >
                        {ws.editable.capabilityPreset}
                      </div>
                      <div
                        className="text-[10px] text-[#94A3B8] truncate"
                        title={ws.editable.capabilityDesc}
                      >
                        {ws.editable.capabilityDesc}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">模型与自主程度</div>
                      <div className="text-xs font-bold text-[#0F172A]">
                        {currentPolicy?.modelPolicyName ?? ws.editable.modelPolicyId}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] truncate">
                        {MAX_AUTONOMY_VIEWS[ws.editable.maxAutonomy]}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 正式基线（无 目标运行引擎 / 正式运行配置 / 同步状态） */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">正式基线</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {ws.formalVersion === null
                        ? '尚未发布正式版本，当前所有配置仅存在于未发布草稿中。'
                        : !ws.hasDraft
                          ? `当前线上正式运行的是 ${ws.formalVersion}，当前没有未发布草稿。`
                          : ws.businessDiffs.length > 0
                            ? `当前线上正式运行的是 ${ws.formalVersion}，草稿已记录 ${ws.businessDiffs.length} 项变更摘要，尚未影响正式运行。`
                            : `当前线上正式运行的是 ${ws.formalVersion}，存在未发布草稿，尚未生成逐项差异摘要。`}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F1F5F9] text-xs">
                      <div className="divide-y divide-[#F1F5F9]">
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">正式版本</dt>
                          <dd className="font-mono font-semibold text-[#0F172A]">
                            {ws.formalVersion ?? <span className="text-[#94A3B8]">暂无 (未发布)</span>}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">类型</dt>
                          <dd className="font-medium text-[#0F172A]">{originLabel}</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">Owner</dt>
                          <dd className="font-medium text-[#0F172A]">{ws.editable.owner}</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">支持任务</dt>
                          <dd className="text-[#0F172A]">
                            {ws.formalVersion ? `${enabledTaskCount} 项启用` : <span className="text-[#94A3B8]">暂无正式基线</span>}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">工作范围</dt>
                          <dd
                            className="font-semibold text-[#0F172A] truncate max-w-[60%]"
                            title={scopeSummary}
                          >
                            {scopeConfigured ? scopeSummary : <span className="text-[#94A3B8] font-normal">未配置</span>}
                          </dd>
                        </div>
                      </div>
                      <div className="divide-y divide-[#F1F5F9]">
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">能力模式</dt>
                          <dd className="font-semibold text-[#0F172A]">{ws.editable.capabilityPreset}</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">模型策略</dt>
                          <dd className="text-[#0F172A]">
                            {currentPolicy?.modelPolicyName ?? ws.editable.modelPolicyId}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">最大自主程度</dt>
                          <dd className="text-[#0F172A]">{MAX_AUTONOMY_VIEWS[ws.editable.maxAutonomy]}</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">最近发布</dt>
                          <dd className="text-[#64748B]">
                            {ws.lastReleaseTime || <span className="text-[#94A3B8]">暂无发布记录</span>}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* 当前草稿（状态事实源 = formalVersion + hasDraft；businessDiffs 仅是下方「已记录的变更摘要」列表） */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">当前草稿</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {ws.formalVersion === null
                        ? '首次创建未发布草稿。'
                        : !ws.hasDraft
                          ? '当前没有未发布草稿。'
                          : ws.businessDiffs.length > 0
                            ? `存在未发布草稿，当前已记录 ${ws.businessDiffs.length} 项变更摘要。`
                            : '存在未发布草稿，尚未生成逐项差异摘要。'}
                    </p>
                  </div>

                  {ws.formalVersion === null ? (
                    <div className="p-4 bg-white border border-amber-200/80 rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="font-bold text-xs text-[#0F172A]">未发布草稿 (首次创建)</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                          NEW DRAFT
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">
                        已根据所选能力模板初始化基本定义，支持任务（{enabledTaskCount} 项启用：
                        {enabledTaskNames.join('、')}）与能力模式预设已载入。
                      </p>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#64748B] space-y-1">
                        <div className="font-semibold text-[#0F172A]">发布验证：待完成</div>
                        <div>测试草稿通过发布验证后，即可发布为首个正式版本 (v1.0)。</div>
                      </div>
                    </div>
                  ) : !ws.hasDraft ? (
                    <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]">
                      当前没有未发布草稿，线上正式版本 {ws.formalVersion} 正在稳定运行。
                    </div>
                  ) : ws.businessDiffs.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-[#475569]">
                        已记录的变更摘要（{ws.businessDiffs.length} 项）
                      </div>
                      {ws.businessDiffs.map((diff, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#0F172A]">{diff.field}</div>
                            <div className="font-mono text-[#2563EB] font-semibold text-[11px]">
                              {diff.changeText}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {diff.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]">
                      存在未发布草稿，尚未生成逐项差异摘要。
                    </div>
                  )}

                  {(ws.formalVersion === null || ws.hasDraft) && (
                    <p className="text-[11px] text-[#94A3B8] pt-1">
                      草稿修改不会影响当前正式运行，完成测试与发布后才会生效。
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                      {activeSection === 'basic_info' && '基本信息'}
                      {activeSection === 'tasks' && '支持任务'}
                      {activeSection === 'scope' && '工作范围'}
                      {activeSection === 'capabilities' && '能力'}
                      {activeSection === 'model_autonomy' && '模型与自主程度'}
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      智能体定义工作区 · {ws.editable.name} · {originLabel}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('overview')}
                    className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    返回概览
                  </button>
                </div>

                {/* ───────────── 基本信息（Built-in 锁定 / Custom 可编辑 + 高级角色说明） ───────────── */}
                {activeSection === 'basic_info' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    {isBuiltIn ? (
                      <>
                        <LockedField label="智能体名称" value={editName} />
                        <LockedField label="主要职责" value={editResponsibility} />
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="font-bold text-[#0F172A]">智能体名称</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#0F172A]">主要职责</label>
                          <textarea
                            rows={4}
                            value={editResponsibility}
                            onChange={(e) => setEditResponsibility(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A] leading-relaxed"
                          />
                          <p className="text-[11px] text-[#94A3B8]">面向用户展示的一句话业务职责。</p>
                        </div>
                      </>
                    )}

                    {/* Owner：内置与自定义都可编辑（§4.1 / §4.2） */}
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A]">责任组织 (Owner)</label>
                      <input
                        type="text"
                        value={editOwner}
                        onChange={(e) => setEditOwner(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                      />
                    </div>

                    {/* 高级角色说明（roleInstruction）：默认折叠；保存时不改动 responsibilitySummary */}
                    <div className="space-y-1.5 border-t border-[#F1F5F9] pt-3">
                      <button
                        onClick={() => setIsRoleInstructionOpen((v) => !v)}
                        className="flex items-center space-x-1.5 text-xs font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors cursor-pointer"
                      >
                        {isRoleInstructionOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                        )}
                        <span>高级角色说明</span>
                        {isBuiltIn && (
                          <span className="flex items-center space-x-0.5 text-[10px] font-normal text-[#94A3B8]">
                            <Lock className="w-3 h-3" />
                            <span>平台内置定义</span>
                          </span>
                        )}
                      </button>
                      {isRoleInstructionOpen && (
                        <div className="space-y-1">
                          {isBuiltIn ? (
                            <div className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#334155] whitespace-pre-wrap leading-relaxed">
                              {editRoleInstruction}
                            </div>
                          ) : (
                            <textarea
                              rows={5}
                              value={editRoleInstruction}
                              onChange={(e) => setEditRoleInstruction(e.target.value)}
                              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A] leading-relaxed"
                            />
                          )}
                          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                            定义智能体如何履行职责。平台安全、权限与执行协议不可在此覆盖。
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-1 flex justify-end">{saveButton}</div>
                  </div>
                )}

                {/* ───────────── 支持任务（Built-in 锁定 / Custom 模板集合内启停） ───────────── */}
                {activeSection === 'tasks' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                    <div className="font-bold text-[#0F172A]">
                      支持任务（{displayTasks.filter((t) => t.enabled).length}/{displayTasks.length} 启用）
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[11px] text-[#64748B] leading-relaxed">
                      任务定义（Workflow、步骤与输入输出契约）由 Task Engine 统一管理；Agent Center
                      仅维护绑定关系与启用状态，不在此编辑任务内容。
                    </div>
                    <div className="space-y-2">
                      {displayTasks.map((task, idx) => {
                        const view = getTaskTemplateView(task.taskTemplateId);
                        return (
                          <div
                            key={task.taskTemplateId || idx}
                            className={`p-3 rounded-md flex items-center justify-between gap-3 ${
                              task.enabled && !isBuiltIn
                                ? 'bg-[#EFF6FF] border border-[#BFDBFE]'
                                : 'bg-[#F8FAFC] border border-[#E2E8F0]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0F172A] flex items-center space-x-2">
                                <span className="truncate">
                                  {idx + 1}. {view.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#475569] border border-[#E2E8F0] shrink-0">
                                  {task.taskTemplateId}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#64748B] mt-0.5">{view.desc}</div>
                            </div>
                            <div className="flex items-center space-x-2.5 shrink-0">
                              <button
                                onClick={() =>
                                  addToast?.(
                                    'info',
                                    `任务定义 · ${task.taskTemplateId}`,
                                    '该任务由 Task Engine 管理，请在任务模板中心查看任务定义与版本详情'
                                  )
                                }
                                className="flex items-center space-x-1 text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>查看任务定义</span>
                              </button>

                              {isBuiltIn ? (
                                /* 内置：核心 Task 锁定，不显示无法点击的假开关 */
                                <span className="text-[10px] px-2 py-0.5 rounded font-medium border bg-violet-50 text-violet-700 border-violet-200/60">
                                  平台内置任务
                                </span>
                              ) : (
                                <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={task.enabled}
                                    onChange={(e) => toggleTask(task, e.target.checked)}
                                    className="w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                                  />
                                  <span className="text-[10px] font-medium text-[#475569]">
                                    {task.enabled ? '已启用' : '未启用'}
                                  </span>
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!isBuiltIn && preset && (
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                        只能在能力模板「{preset.presetName}」允许的任务集合内启用 / 停用；模板包含但当前未启用的任务不计入运行。
                      </p>
                    )}
                    {!isBuiltIn && <div className="pt-1 flex justify-end">{saveButton}</div>}
                  </div>
                )}

                {/* ───────────── 工作范围（A 主范围 / B 支撑来源 / C 权限说明） ───────────── */}
                {activeSection === 'scope' && (
                  <div className="space-y-4">
                    {/* A. 主要工作范围 */}
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                      <div className="font-bold text-[#0F172A]">
                        {scopeConfig ? scopeConfig.sectionTitle : '主要工作范围'}
                      </div>

                      {scopeConfig && scopeEditable ? (
                        <>
                          <div className="space-y-2">
                            <label
                              className={`flex items-start space-x-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                                editScopeMode === 'ALL_ALLOWED'
                                  ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                                  : 'bg-[#F8FAFC] border-[#E2E8F0]'
                              }`}
                            >
                              <input
                                type="radio"
                                checked={editScopeMode === 'ALL_ALLOWED'}
                                onChange={() => setEditScopeMode('ALL_ALLOWED')}
                                className="mt-0.5 w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                              />
                              <div>
                                <div className="font-semibold text-[#0F172A]">{scopeConfig.allAllowedLabel}</div>
                                <div className="text-[11px] text-[#64748B] mt-0.5">
                                  按当前用户权限动态确定实际可访问资源。
                                </div>
                              </div>
                            </label>
                            <label
                              className={`flex items-start space-x-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                                editScopeMode === 'SELECTED'
                                  ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                                  : 'bg-[#F8FAFC] border-[#E2E8F0]'
                              }`}
                            >
                              <input
                                type="radio"
                                checked={editScopeMode === 'SELECTED'}
                                onChange={() => setEditScopeMode('SELECTED')}
                                className="mt-0.5 w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                              />
                              <div>
                                <div className="font-semibold text-[#0F172A]">{scopeConfig.selectedLabel}</div>
                                <div className="text-[11px] text-[#64748B] mt-0.5">
                                  仅使用下方选中的资源（至少选择一个）。
                                </div>
                              </div>
                            </label>
                          </div>

                          {editScopeMode === 'SELECTED' && (
                            <div className="space-y-2">
                              <div className="text-[11px] font-semibold text-[#475569]">
                                {scopeConfig.optionsTitle}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {scopeConfig.options.map((option) => (
                                  <label
                                    key={option.resourceId}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                                      editScopeResourceIds.includes(option.resourceId)
                                        ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
                                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={editScopeResourceIds.includes(option.resourceId)}
                                      onChange={(e) =>
                                        setEditScopeResourceIds((prev) =>
                                          e.target.checked
                                            ? [...prev, option.resourceId]
                                            : prev.filter((id) => id !== option.resourceId)
                                        )
                                      }
                                      className="w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                                    />
                                    <span className="font-medium">{option.name}</span>
                                  </label>
                                ))}
                              </div>
                              {scopeIncomplete && (
                                <p className="text-[11px] text-amber-600 font-medium">
                                  指定范围必须至少选择一个资源后才能保存。
                                </p>
                              )}
                            </div>
                          )}

                          <div className="pt-1 flex justify-end">{saveButton}</div>
                        </>
                      ) : scopeConfig ? (
                        /* 模板主范围来源不在当前允许来源内：UI 提前只读（Domain 校验为最终裁决） */
                        <div className="space-y-2">
                          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[#475569] leading-relaxed">
                            当前{ws.formalVersion ? `正式版本 ${ws.formalVersion}` : '配置'}的允许来源不包含「
                            {AGENT_CONTEXT_SOURCE_VIEWS[scopeConfig.sourceType].label}
                            」，{scopeConfig.sectionTitle}
                            暂不开放配置；可使用的支撑来源见下方。
                          </div>
                          {ws.editable.contextBindings.length > 0 && (
                            <div className="space-y-1.5">
                              {ws.editable.contextBindings.map((binding, i) => (
                                <div
                                  key={i}
                                  className="p-2.5 bg-white border border-[#E2E8F0] rounded-md flex items-center justify-between"
                                >
                                  <span className="font-medium text-[#0F172A]">
                                    {AGENT_CONTEXT_SOURCE_VIEWS[binding.sourceType].label}
                                  </span>
                                  <span className="text-[11px] text-[#64748B]">{describeScopeBinding(binding)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* 未知模板：只读展示当前 Bindings */
                        <div className="space-y-1.5">
                          {ws.editable.contextBindings.length === 0 ? (
                            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[#64748B]">
                              当前未配置具体工作范围。
                            </div>
                          ) : (
                            ws.editable.contextBindings.map((binding, i) => (
                              <div
                                key={i}
                                className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between"
                              >
                                <span className="font-medium text-[#0F172A]">
                                  {AGENT_CONTEXT_SOURCE_VIEWS[binding.sourceType].label}
                                </span>
                                <span className="text-[11px] text-[#64748B]">{describeScopeBinding(binding)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* B. 可使用的支撑来源（Read-first 投影，不做成 Permission Matrix） */}
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                      <div className="font-bold text-[#0F172A]">可使用的支撑来源</div>
                      <div className="flex flex-wrap gap-2">
                        {ws.editable.allowedContextSources.map((sourceType) => (
                          <div
                            key={sourceType}
                            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md"
                            title={AGENT_CONTEXT_SOURCE_VIEWS[sourceType].desc}
                          >
                            <div className="font-semibold text-[#0F172A]">
                              {AGENT_CONTEXT_SOURCE_VIEWS[sourceType].label}
                            </div>
                            <div className="text-[10px] text-[#94A3B8]">
                              {AGENT_CONTEXT_SOURCE_VIEWS[sourceType].desc}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                        模板允许使用的支撑来源（V1.1 暂不逐项配置）；实际可达范围由用户权限与任务范围在运行时收敛。
                      </p>
                    </div>

                    {/* C. 权限说明 */}
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-1.5 text-xs">
                      <div className="font-bold text-[#0F172A]">权限说明</div>
                      <div className="font-mono text-[11px] text-[#2563EB] bg-[#F8FAFC] border border-[#BFDBFE] rounded px-2 py-1.5 leading-relaxed">
                        实际运行上下文 = 智能体允许范围 ∩ 当前用户权限 ∩ 当前任务范围
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        工作范围不能扩大用户权限：用户权限由 Permission Matrix
                        统一裁决，任务范围由 Task Engine 下发，Agent Center 不复制权限矩阵。
                      </p>
                    </div>
                  </div>
                )}

                {/* ───────────── 能力（受控 Capability Preset；单一选项时只读，不提供假下拉） ───────────── */}
                {activeSection === 'capabilities' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="font-bold text-[#0F172A]">能力模式</div>
                    {capabilityOptions.length > 1 ? (
                      <>
                        <div className="space-y-2">
                          {capabilityOptions.map((option) => (
                            <label
                              key={option.capabilityPreset}
                              className={`flex items-start space-x-2 p-3 rounded-md border cursor-pointer transition-colors ${
                                editCapabilityPreset === option.capabilityPreset
                                  ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                                  : 'bg-[#F8FAFC] border-[#E2E8F0]'
                              }`}
                            >
                              <input
                                type="radio"
                                checked={editCapabilityPreset === option.capabilityPreset}
                                onChange={() => setEditCapabilityPreset(option.capabilityPreset)}
                                className="mt-0.5 w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                              />
                              <div>
                                <div className="font-semibold text-[#0F172A]">{option.capabilityPreset}</div>
                                <div className="text-[11px] text-[#64748B] mt-0.5">{option.capabilityDesc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                        <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                          只能在平台为该能力模板验证过的能力模式内选择；检索与推理参数由平台统一管理。
                        </p>
                        <div className="pt-1 flex justify-end">{saveButton}</div>
                      </>
                    ) : (
                      <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1">
                        <div className="font-semibold text-[#1E40AF]">{ws.editable.capabilityPreset}</div>
                        <p className="text-[11px] text-[#2563EB]">{ws.editable.capabilityDesc}</p>
                        <p className="text-[11px] text-[#94A3B8]">
                          当前能力模板只提供这一种已验证的能力模式（平台模板约束）。
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ───────────── 模型与自主程度（受控 Select + 模板上限；不暴露底层参数） ───────────── */}
                {activeSection === 'model_autonomy' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-5 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-[#0F172A]">模型策略</label>
                      <select
                        value={editModelPolicyId}
                        onChange={(e) => setEditModelPolicyId(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A] cursor-pointer"
                      >
                        {modelPolicySelectOptions.map((option) => (
                          <option key={option.modelPolicyId} value={option.modelPolicyId}>
                            {option.modelPolicyName}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#94A3B8]">
                        {modelPolicySelectOptions.find((o) => o.modelPolicyId === editModelPolicyId)?.desc ||
                          '只允许选择平台正式策略；模型底层参数由平台统一管理。'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="font-bold text-[#0F172A]">最大自主程度</div>
                      {autonomyOptions.length > 1 ? (
                        <div className="space-y-2">
                          {autonomyOptions.map((option) => (
                            <label
                              key={option.maxAutonomy}
                              className={`flex items-start space-x-2 p-3 rounded-md border cursor-pointer transition-colors ${
                                editMaxAutonomy === option.maxAutonomy
                                  ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                                  : 'bg-[#F8FAFC] border-[#E2E8F0]'
                              }`}
                            >
                              <input
                                type="radio"
                                checked={editMaxAutonomy === option.maxAutonomy}
                                onChange={() => setEditMaxAutonomy(option.maxAutonomy)}
                                className="mt-0.5 w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                              />
                              <div>
                                <div className="font-semibold text-[#0F172A]">
                                  {MAX_AUTONOMY_VIEWS[option.maxAutonomy]}
                                </div>
                                <div className="text-[11px] text-[#64748B] mt-0.5">{option.desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1">
                          <div className="font-semibold text-[#0F172A]">
                            {MAX_AUTONOMY_VIEWS[autonomyOptions[0]?.maxAutonomy ?? ws.editable.maxAutonomy]}
                          </div>
                          <p className="text-[11px] text-[#64748B]">
                            {autonomyOptions[0]?.desc ?? ws.editable.maxAutonomyDesc}
                          </p>
                          <p className="text-[11px] text-[#94A3B8]">
                            V1.1 该能力模板的自主程度上限由平台控制，不开放更高自主。
                          </p>
                        </div>
                      )}
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                        自主程度只约束智能体的行为方式，永远不能提升用户权限。
                      </p>
                    </div>

                    <div className="pt-1 flex justify-end">{saveButton}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ─────────────────────────────────────────────────────────
            COLUMN C. 右侧草稿速览（无 目标 / 引擎 / 运行状态）
        ───────────────────────────────────────────────────────── */}
        <aside className="w-[290px] bg-white border-l border-[#E2E8F0] p-4 shrink-0 overflow-y-auto select-none space-y-4">
          <div className="pb-2 border-b border-[#F1F5F9]">
            <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">当前草稿</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {ws.editableSource === 'DRAFT'
                ? '基于未发布草稿配置'
                : '基于正式版本配置（编辑后生成草稿）'}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">类型</span>
              <span className="font-bold text-[#0F172A]">{originLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">支持任务</span>
              <span className="font-bold text-[#0F172A]">
                {enabledTaskCount}/{ws.editable.supportedTaskTemplates.length} 启用
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">工作范围</span>
              <span className="font-bold text-[#0F172A] truncate max-w-[150px]" title={scopeSummary}>
                {scopeConfigured ? scopeSummary : '未配置'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">能力模式</span>
              <span
                className="font-bold text-[#2563EB] truncate max-w-[140px]"
                title={ws.editable.capabilityPreset}
              >
                {ws.editable.capabilityPreset}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">模型策略</span>
              <span className="font-medium text-[#0F172A]">
                {currentPolicy?.modelPolicyName ?? ws.editable.modelPolicyId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">自主程度</span>
              <span className="font-medium text-[#0F172A]">{MAX_AUTONOMY_VIEWS[ws.editable.maxAutonomy]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">正式版本</span>
              <span className="font-mono font-semibold text-[#0F172A]">
                {ws.formalVersion ?? <span className="text-[#94A3B8] font-sans">暂无</span>}
              </span>
            </div>
          </div>

          {/* 底部：单一「测试草稿」入口（状态事实源 = formalVersion + hasDraft，不用 businessDiffs 推导一致） */}
          <div
            className={`p-3 rounded-lg space-y-2 ${
              ws.formalVersion === null
                ? 'bg-amber-50/80 border border-amber-200'
                : ws.hasDraft
                  ? 'bg-[#EFF6FF] border border-[#BFDBFE]'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0]'
            }`}
          >
            <div
              className={`flex items-center space-x-1.5 text-xs font-bold ${
                ws.formalVersion === null
                  ? 'text-amber-900'
                  : ws.hasDraft
                    ? 'text-[#1E40AF]'
                    : 'text-[#334155]'
              }`}
            >
              <GitBranch
                className={`w-3.5 h-3.5 ${
                  ws.formalVersion === null
                    ? 'text-amber-700'
                    : ws.hasDraft
                      ? 'text-[#2563EB]'
                      : 'text-[#64748B]'
                }`}
              />
              <span>
                {ws.formalVersion === null
                  ? '未发布草稿 (首次创建)'
                  : ws.hasDraft
                    ? ws.businessDiffs.length > 0
                      ? `有未发布草稿 · ${ws.businessDiffs.length} 项变更摘要`
                      : '有未发布草稿'
                    : '当前无未发布草稿'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-80">
              {ws.formalVersion === null
                ? '完成定义后测试草稿，通过发布验证发布首个正式版本。'
                : ws.hasDraft
                  ? ws.businessDiffs.length > 0
                    ? `存在未发布草稿（已记录 ${ws.businessDiffs.length} 项变更摘要），发布后生效。`
                    : '存在未发布草稿，尚未生成逐项差异摘要。'
                  : `线上正式版本 ${ws.formalVersion} 正在稳定运行。`}
            </p>
            <button
              onClick={handleTestDraft}
              disabled={!onNavigateToPublish || !onSaveDraftPatch}
              className="w-full py-1.5 bg-white hover:bg-slate-50 text-[#334155] border border-[#CBD5E1] rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-[#2563EB]" />
              <span>测试草稿 (进入测试与发布)</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          高级信息 → 运行与诊断 Modal（仅 showRuntimeDiagnostics=true 可达）
      ───────────────────────────────────────────────────────────── */}
      {isRuntimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsRuntimeModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-bold text-xs text-[#0F172A]">运行与诊断 · {ws.editable.name}</h3>
              </div>
              <button
                onClick={() => setIsRuntimeModalOpen(false)}
                className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">运行引擎</span>
                  <span className="font-semibold text-[#0F172A]">{runtimeEngineLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">集成模式</span>
                  <span
                    className={`font-semibold ${
                      runtimeHealth?.integrationMode === 'PRODUCTION' ? 'text-[#16A36A]' : 'text-amber-600'
                    }`}
                  >
                    {runtimeHealth?.integrationMode ?? runtimeBinding?.integrationMode ?? 'MOCK_RUNTIME'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Runtime 健康状态</span>
                  <span className="font-semibold text-[#0F172A]">
                    {runtimeHealth ? runtimeHealth.status : (runtimeBinding?.runtimeStatus ?? '读取中...')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">绑定正式版本</span>
                  <span className="font-mono text-[#0F172A]">{ws.formalVersion || '暂无 (待发布)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Runtime Revision</span>
                  <span className="font-mono text-[#0F172A]">
                    {runtimeBinding?.syncRevision || '— (未接入真实 API)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">最近同步</span>
                  <span className="text-[#475569]">{runtimeBinding?.lastSyncedAt || '尚未同步'}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-relaxed">
                {runtimeHealth?.message
                  ? `${runtimeHealth.message}（来自 AgentRuntimeAdapter.getHealth，非实时探测数据）`
                  : '正在从 Runtime Adapter 读取健康信息...（WeKnora 真实 API 未接入，集成模式如实标注 MOCK_RUNTIME）'}
              </div>

              <div className="text-[11px] text-[#64748B] leading-relaxed">
                草稿配置未同步至线上引擎，草稿修改仅在沙盒中生效；正式运行以已发布版本为准。
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsRuntimeModalOpen(false)}
                className="px-4 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold cursor-pointer"
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
