import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  GitBranch,
  Play,
  Save,
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
  /** 进入 A04 的唯一正常入口（由「进入发布验证」在自动保存成功后调用） */
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

/**
 * 任务绑定稳定比较（Commit 06.3）：按 taskTemplateId 归一后逐项比较 version / enabled。
 * 不依赖数组引用，不依赖 UI 展示顺序——只打开「支持任务」不改任何勾选时视为无变化。
 */
const areTaskBindingsEqual = (a: TaskTemplateBinding[], b: TaskTemplateBinding[]): boolean => {
  if (a.length !== b.length) return false;
  const byId = new Map(b.map((binding) => [binding.taskTemplateId, binding]));
  return a.every((binding) => {
    const other = byId.get(binding.taskTemplateId);
    return (
      other !== undefined && other.version === binding.version && other.enabled === binding.enabled
    );
  });
};

/** Patch 非空判定（Commit 06.3）：UpdateAgentDraftPatch 是 flat top-level contract，key 数即可 */
const hasDraftPatchChanges = (patch: UpdateAgentDraftPatch): boolean =>
  Object.keys(patch).length > 0;

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

/**
 * 行动边界的用户理解说明（V1.2 §33）：现有 MaxAutonomy enum 的用户化解释，
 * 纯 UI 投影——不是新 Domain 状态，保存时仍只写 maxAutonomy / maxAutonomyDesc。
 */
const MAX_AUTONOMY_BOUNDARY_NOTES: Record<
  MaxAutonomy,
  { can: string; wontLabel: string; wont: string }
> = {
  SUGGEST: {
    can: '理解、分析、回答、提供建议',
    wontLabel: '不会',
    wont: '自行执行业务变更'
  },
  PROPOSE: {
    can: '理解、分析、形成候选、生成待确认方案',
    wontLabel: '正式变更',
    wont: '仍需确认后才能生效'
  },
  EXECUTE_WITHIN_POLICY: {
    can: '在平台策略、当前用户权限和任务范围内执行',
    wontLabel: '不能',
    wont: '扩大用户权限或绕过平台安全策略'
  }
};

/**
 * 执行方式说明去技术化（V1.2 §29）：capabilityDesc 末尾的括号技术标注
 * （如 "(Schema Semantic Alignment)" / "(WeKnora Bridge)"）是底层引擎表达，
 * 普通 UI 主文案只取用户可理解的前半段；原文保留在 tooltip 中。
 */
const toFriendlyCapabilityDesc = (desc?: string): string => {
  if (!desc) return '';
  return desc
    .replace(/\s*[(（][^)）]*[)）]\s*$/, '')
    .trim();
};

/** 列表压缩（V1.2 §16）：前 shown 项 + 「等 N {unit}」，保证 Operating Flow 可快速扫描 */
const compressNameList = (items: string[], shown: number, unit: string): string =>
  items.length > shown
    ? `${items.slice(0, shown).join(' · ')} 等 ${items.length} ${unit}`
    : items.join(' · ');

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
  /**
   * 工作范围 Draft 启用状态（Commit 06.2）：只作用于本地编辑态，不改 Domain Contract。
   * - scopeActivationRequested：用户点击「在草稿中启用」待保存
   * - scopeTouched：用户真的操作过工作范围（防误写，见 buildPatch）
   */
  const [scopeActivationRequested, setScopeActivationRequested] = useState(false);
  const [scopeTouched, setScopeTouched] = useState(false);
  /**
   * 未保存离开保护（§10）：离开 A03 前用 buildPatch()+hasDraftPatchChanges() 判脏；
   * 脏 Patch 时弹轻量确认（继续编辑 / 放弃修改并离开），无脏 Patch 直接离开。
   */
  const [pendingLeave, setPendingLeave] = useState<null | (() => void)>(null);
  /** Overview D：正式版本配置弱折叠（V1.2 §20，默认收起，不再占据大型默认区域） */
  const [isPublishedDetailOpen, setIsPublishedDetailOpen] = useState(false);
  /** Overview D：草稿变更摘要弱折叠（V1.2 §21，businessDiffs 只是已记录摘要，不是完整 Diff） */
  const [isDiffSummaryOpen, setIsDiffSummaryOpen] = useState(false);

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
    // Workspace State 重新载入（切换智能体 / 保存成功后 domainTick 重读）时重置启用状态
    setScopeActivationRequested(false);
    setScopeTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws]);

  // ── 工作范围三态（Commit 06.2）：区分 当前配置 / 模板最大边界 / 可在草稿中启用 ──
  /** A. 当前配置（Draft 优先，其次正式快照）已启用该主范围来源 → 正常编辑 */
  const scopeCurrentlyAllowed = Boolean(
    ws && scopeConfig && ws.editable.allowedContextSources.includes(scopeConfig.sourceType)
  );
  /** 模板最大边界：Capability Template 允许该主范围来源 */
  const scopeAllowedByTemplate = Boolean(
    preset && scopeConfig && preset.allowedContextSources.includes(scopeConfig.sourceType)
  );
  /** B. 当前配置未启用但模板允许 → 可在草稿中启用（不与 C「模板不允许」混为一谈） */
  const scopeCanBeEnabledInDraft = !scopeCurrentlyAllowed && scopeAllowedByTemplate;
  /** 当前会话可编辑的工作范围：已启用，或用户已请求在草稿中启用 */
  const scopeIsActiveForEditing = scopeCurrentlyAllowed || scopeActivationRequested;

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
  // Save Contract（TASK 27 / TASK 28）+ Dirty Patch Builder（Commit 06.3）：
  // User Changed What → Patch Contains What。
  // 基本信息通过「本地编辑态 vs ws.editable 当前 Domain 态」值比较生成脏字段，
  // 不新增 nameTouched / ownerTouched 等大量 touch 状态；
  // Scope 因存在「模板允许但当前未启用」的 Activation UX，继续保留
  // scopeTouched / scopeActivationRequested（Commit 06.2 语义不变）。
  // Built-in 锁定字段（名称 / 职责 / 角色说明 / 任务绑定）不进入 Patch。
  // ─────────────────────────────────────────────────────────────
  const buildPatch = (): UpdateAgentDraftPatch => {
    if (!ws) return {};
    const patch: UpdateAgentDraftPatch = {};
    if (!isBuiltIn) {
      if (editName !== ws.editable.name) {
        patch.name = editName;
      }
      // 「主要职责」同时映射 description + responsibilitySummary，不新增 UI 字段
      if (editResponsibility !== ws.editable.responsibilitySummary) {
        patch.description = editResponsibility;
        patch.responsibilitySummary = editResponsibility;
      }
      if (editRoleInstruction !== ws.editable.roleInstruction) {
        patch.roleInstruction = editRoleInstruction;
      }
      if (!areTaskBindingsEqual(editTasks, ws.editable.supportedTaskTemplates)) {
        patch.supportedTaskTemplates = editTasks.map((b) => ({ ...b }));
      }
    }
    // Owner：Built-in + Custom 都可改；没改不写（不要每次 Save 都提交 Owner）
    if (editOwner !== ws.editable.owner) {
      patch.owner = editOwner;
    }
    // 工作范围 Patch 防误写（P0）：「模板允许」≠「用户已启用」——
    // 未发生用户操作（scopeTouched=false）或未请求启用时，绝不写入 allowedContextSources / contextBindings，
    // 只改 Owner 等其他字段的保存不能把 BUSINESS_DOMAIN 自动带进 Draft。
    if (scopeConfig && scopeTouched && scopeIsActiveForEditing) {
      const primary: AgentContextBinding = {
        sourceType: scopeConfig.sourceType,
        selectionMode: editScopeMode,
        resourceIds: editScopeMode === 'SELECTED' ? [...editScopeResourceIds] : undefined
      };
      // 替换主范围 Binding，保留其他 Context Bindings；Domain 负责最终校验
      patch.contextBindings = [
        ...ws.editable.contextBindings.filter((b) => b.sourceType !== scopeConfig.sourceType),
        primary
      ];
      if (scopeCanBeEnabledInDraft && scopeActivationRequested) {
        // 新启用：Draft 允许来源并入主范围来源（去重）；Domain Edit Policy 保证不超模板最大边界
        patch.allowedContextSources = Array.from(
          new Set([...ws.editable.allowedContextSources, scopeConfig.sourceType])
        );
      }
    }
    // Capability：没改不写（不因模板有多个合法选项就每次 Save 都写当前 capability）
    if (editCapabilityPreset !== ws.editable.capabilityPreset) {
      patch.capabilityPreset = editCapabilityPreset;
      const selected = capabilityOptions.find((o) => o.capabilityPreset === editCapabilityPreset);
      patch.capabilityDesc = selected?.capabilityDesc ?? ws.editable.capabilityDesc;
    }
    // Model Policy：没改不写；modelPolicyName 仍从 MODEL_POLICY_OPTIONS canonical 投影
    if (editModelPolicyId !== ws.editable.modelPolicyId) {
      patch.modelPolicyId = editModelPolicyId;
      const policy = modelPolicySelectOptions.find((o) => o.modelPolicyId === editModelPolicyId);
      patch.modelPolicyName = policy?.modelPolicyName ?? ws.editable.modelPolicyName;
    }
    // Autonomy：没改不写；maxAutonomyDesc 继续来自 TEMPLATE_AUTONOMY_OPTIONS canonical option
    if (editMaxAutonomy !== ws.editable.maxAutonomy) {
      patch.maxAutonomy = editMaxAutonomy;
      const autonomy = autonomyOptions.find((o) => o.maxAutonomy === editMaxAutonomy);
      patch.maxAutonomyDesc = autonomy?.desc ?? ws.editable.maxAutonomyDesc;
    }
    return patch;
  };

  /** 离开保护（§10）：脏 Patch → 轻量确认弹窗；无脏 Patch 直接离开 */
  const requestLeave = (leave: () => void) => {
    if (hasDraftPatchChanges(buildPatch())) {
      setPendingLeave(() => leave);
    } else {
      leave();
    }
  };

  const scopeIncomplete =
    scopeIsActiveForEditing &&
    editScopeMode === 'SELECTED' &&
    editScopeResourceIds.length === 0;

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

  /** 保存草稿：A03 所有编辑统一经 updateAgentDraft 写入同一个 AgentDraft。无变更 → 轻量「无需保存」，不触发 Domain Update */
  const handleSaveDraft = () => {
    if (!ws || !onSaveDraftPatch) return;
    if (scopeIncomplete) {
      addToast?.('error', '工作范围不完整', '指定范围必须至少选择一个资源');
      return;
    }
    const patch = buildPatch();
    if (!hasDraftPatchChanges(patch)) {
      // No-op Save：不调用 onSaveDraftPatch、不创建 Draft（Published Agent 首存空 Patch 尤其不能开草稿）
      addToast?.('info', '无需保存', '当前没有新的配置修改。');
      return;
    }
    const ok = onSaveDraftPatch(patch);
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
   * 进入发布验证：唯一发布验证 / 发布入口（TASK 11 / AC-15）。
   * - 有未保存修改：先经 Domain 保存成功再进入 A04；Domain 校验失败则停留本页
   * - 已有 Draft 且无新修改：直接进入 A04（既有草稿就是当前验证对象，不重复 update）
   * - 无 Draft 且无修改：不进入发布链——A04 是 Draft 发布验证工作区
   */
  const handleTestDraft = () => {
    if (!onNavigateToPublish) return;
    if (scopeIncomplete) {
      addToast?.('error', '工作范围不完整', '指定范围必须至少选择一个资源');
      return;
    }
    const patch = buildPatch();
    if (!hasDraftPatchChanges(patch)) {
      if (ws?.hasDraft) {
        onNavigateToPublish();
      } else {
        // 无未发布草稿不进入发布链（首次创建的 Custom Agent 本就已存在 Draft，不受影响）
        addToast?.('info', '当前没有未发布草稿', '请先修改配置并保存后再进入发布验证。');
      }
      return;
    }
    if (!onSaveDraftPatch) return;
    const ok = onSaveDraftPatch(patch);
    if (!ok) return; // Domain 校验失败：不进入 A04
    setDomainTick((t) => t + 1);
    addToast?.(
      'info',
      '草稿已自动保存',
      `「${editName || ws?.editable.name || '智能体'}」草稿已自动保存，正在进入发布验证工作区`
    );
    onNavigateToPublish();
  };

  // ─────────────────────────────────────────────────────────────
  // 高级信息 → 运行与诊断（仅 showRuntimeDiagnostics=true 可达；
  // 复用 Runtime Adapter / Health Logic，Runtime Domain 不删不改）。
  // Commit 08：读 Active Binding（Draft 不拥有正式 Binding；
  // 未发布自定义 Agent 无 Binding → 显示「尚无正式运行绑定」）
  // ─────────────────────────────────────────────────────────────
  const [isRuntimeModalOpen, setIsRuntimeModalOpen] = useState(false);
  const [runtimeHealth, setRuntimeHealth] = useState<RuntimeHealth | null>(null);
  const runtimeBinding = ws ? agentRepository.getActiveRuntimeBinding(ws.agentId) : undefined;
  // WeKnora 真实 API 未接入 —— 诊断视图如实标注 MOCK_RUNTIME，不伪装已同步
  const runtimeEngineLabel = ws?.runtimeTarget === 'WEKNORA' ? 'WeKnora' : 'Semovix Native';

  useEffect(() => {
    if (!isRuntimeModalOpen || !ws) return;
    // 切换智能体 / 重新打开时清空上一份健康快照，避免陈旧数据
    setRuntimeHealth(null);
    if (!runtimeBinding) return; // 无正式 Binding（未发布）→ 诊断视图展示空态
    let cancelled = false;
    getRuntimeAdapter(ws.runtimeTarget)
      .getHealth(runtimeBinding)
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
  }, [isRuntimeModalOpen, ws?.agentId, ws?.runtimeTarget, runtimeBinding?.bindingId]);

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
  const currentPolicy = modelPolicySelectOptions.find((o) => o.modelPolicyId === ws.editable.modelPolicyId);

  // ─────────────────────────────────────────────────────────────
  // Operating Flow 投影（V1.2 §14–§16）：这个智能体如何工作。
  // 全部由现有 Domain Projection（editable + preset + 展示目录）派生，
  // 不新增 AgentOperatingModel / 数据库字段 / 第二套 SoT——只是 UI Projection。
  // ─────────────────────────────────────────────────────────────
  /** 工作类别词：从能力模板 categoryTag 动态投影（数据智能→数据工作 / 企业知识→知识工作 / 语义治理→治理工作） */
  const workCategoryWord =
    preset?.categoryTag === '数据智能'
      ? '数据工作'
      : preset?.categoryTag === '企业知识'
        ? '知识工作'
        : preset?.categoryTag === '语义治理'
          ? '治理工作'
          : '工作';
  /** 任务压缩（§16）：前 3 项名称 + 等 N 项工作 */
  const flowTaskSub = compressNameList(enabledTaskNames, 3, '项工作');
  /** 主范围摘要：授权范围内的{来源} / N 个指定{来源}，未知模板退回 N 类授权信息 */
  const flowScopeMain = primaryScopeBinding
    ? primaryScopeBinding.selectionMode === 'ALL_ALLOWED'
      ? `授权范围内的${AGENT_CONTEXT_SOURCE_VIEWS[primaryScopeBinding.sourceType].label}`
      : `${primaryScopeBinding.resourceIds?.length ?? 0} 个指定${AGENT_CONTEXT_SOURCE_VIEWS[primaryScopeBinding.sourceType].label}`
    : `${ws.editable.allowedContextSources.length} 类授权信息`;
  /** 支撑来源：allowedContextSources 去掉主范围来源后压缩（≤3 项全显，>3 显示 等 N 类信息） */
  const supportingSourceLabels = ws.editable.allowedContextSources
    .filter((sourceType) => !primaryScopeBinding || sourceType !== primaryScopeBinding.sourceType)
    .map((sourceType) => AGENT_CONTEXT_SOURCE_VIEWS[sourceType].label);
  const flowScopeSub = compressNameList(supportingSourceLabels, 3, '类信息');
  /** 判断原则展示名：MODEL_POLICY_OPTIONS canonical 优先，历史数据回退 editable.modelPolicyName */
  const policyDisplayName = currentPolicy?.modelPolicyName ?? ws.editable.modelPolicyName ?? ws.editable.modelPolicyId;
  const policyDisplayDesc = currentPolicy?.desc ?? '';
  /** 行动边界说明：模板选项 desc 优先，回退 editable.maxAutonomyDesc */
  const autonomyDescDisplay =
    autonomyOptions.find((o) => o.maxAutonomy === ws.editable.maxAutonomy)?.desc ??
    ws.editable.maxAutonomyDesc ??
    '';
  const friendlyCapabilityDesc = toFriendlyCapabilityDesc(ws.editable.capabilityDesc);
  /** 当前工作定义来源说明（V1.2 §18）：明确告知用户当前看到的是草稿还是正式版本 */
  const editableSourceNote =
    ws.editableSource === 'DRAFT'
      ? ws.formalVersion
        ? `当前展示未发布草稿；正式版本 ${ws.formalVersion} 仍保持生效。`
        : '以下为当前未发布草稿配置。'
      : ws.editableSource === 'PUBLISHED_SNAPSHOT'
        ? '以下为当前正式版本配置。'
        : '以下为当前定义基线配置。';

  // ── 正式基线（Implementation Freeze §1）────────────────────────
  // 事实源 = ws.published（currentPublishedVersion 对应 AgentVersion.snapshot）。
  // Draft 的任何修改不得出现在正式基线中；未发布时 baseline = null。
  const baseline = ws.published;
  const baselineEnabledTaskCount = baseline
    ? baseline.supportedTaskTemplates.filter((t) => t.enabled).length
    : 0;
  const baselineScopeBinding =
    scopeConfig && baseline
      ? baseline.contextBindings.find((b) => b.sourceType === scopeConfig.sourceType)
      : undefined;
  const baselineScopeSummary = baselineScopeBinding
    ? describeScopeBinding(baselineScopeBinding)
    : null;
  const baselinePolicyName = baseline
    ? MODEL_POLICY_OPTIONS.find((o) => o.modelPolicyId === baseline.modelPolicyId)?.modelPolicyName ??
      baseline.modelPolicyName ??
      baseline.modelPolicyId
    : null;

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

  /** 在草稿中启用（TASK 6）：只改本地编辑状态，默认 ALL_ALLOWED，不直接触碰 Domain */
  const activateScopeInDraft = () => {
    setScopeActivationRequested(true);
    setScopeTouched(true);
    setEditScopeMode('ALL_ALLOWED');
    setEditScopeResourceIds([]);
  };

  /** 取消启用（TASK 7）：保存前的弱操作，不产生任何 Domain 变化 */
  const cancelScopeActivation = () => {
    setScopeActivationRequested(false);
    setScopeTouched(false);
    setEditScopeMode('ALL_ALLOWED');
    setEditScopeResourceIds([]);
  };

  /** 只读状态下的当前 Context Bindings 展示（启用 CTA / 模板不允许分支共用） */
  const currentBindingsList =
    ws.editable.contextBindings.length > 0 ? (
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
    ) : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* ─────────────────────────────────────────────────────────────
          HEADER：徽章 = 内置/自定义；状态只保留 正式版本 + 草稿状态（无 Runtime 项）
      ───────────────────────────────────────────────────────────── */}
      <header className="h-[68px] bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center space-x-4 min-w-0">
          <button
            onClick={() => requestLeave(onBackToRegistry)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer border border-[#E2E8F0] shrink-0"
            title="返回智能体中心列表"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>智能体</span>
          </button>
          <div className="h-5 w-px bg-[#E2E8F0] shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center space-x-2 text-[11px] text-[#64748B]">
              <span
                onClick={() => requestLeave(onBackToRegistry)}
                className="hover:text-[#0F172A] cursor-pointer transition-colors"
              >
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

          {/* Actions：只有 保存草稿 / 进入发布验证（发布验证 = 唯一 A04 入口） */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#E2E8F0]">
            <button
              onClick={handleTestDraft}
              disabled={!onNavigateToPublish || !onSaveDraftPatch}
              title="自动保存草稿并进入发布验证"
              className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3 h-3 text-[#2563EB]" />
              <span>进入发布验证</span>
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
            COLUMN A. 左侧导航（V1.2 §9：SectionKey 内部完全不变，只改用户展示）
            概览 / 角色与职责 / 工作任务 / 数据与知识范围 / 执行方式 / 决策与行动边界
            （普通一级导航无「运行引擎」；Runtime 仅在高级信息弱入口）
        ───────────────────────────────────────────────────────── */}
        <aside className="w-[200px] bg-white border-r border-[#E2E8F0] flex flex-col justify-between p-3 shrink-0 select-none overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] tracking-wider uppercase">
              智能体工作定义
            </div>
            {(
              [
                { key: 'overview', label: '概览', icon: FileText },
                { key: 'basic_info', label: '角色与职责', icon: Info },
                { key: 'tasks', label: '工作任务', icon: Layers },
                { key: 'scope', label: '数据与知识范围', icon: Database },
                { key: 'capabilities', label: '执行方式', icon: Sparkles },
                { key: 'model_autonomy', label: '决策与行动边界', icon: Sliders }
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
                    快速理解「{ws.editable.name}」的工作定义：它负责什么、如何工作，以及当前处于什么版本状态。
                  </p>
                </div>

                {/* A. 角色与工作目标（V1.2 §12：第一块直接回答「这个智能体是干什么的」） */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-2.5 shadow-2xs">
                  <h3 className="text-xs font-bold text-[#0F172A]">角色与工作目标</h3>
                  <div className="text-sm font-bold text-[#0F172A] tracking-tight">{ws.editable.name}</div>
                  <p className="text-xs text-[#334155] leading-relaxed text-justify">
                    {ws.editable.responsibilitySummary}
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    类型：{originLabel} · Owner：{ws.editable.owner}
                  </p>
                </div>

                {/* B. 这个智能体如何工作（V1.2 §13–§16：一条横向 Operating Flow 投影当前真实
                    Operating Model，替代原抽象概念教学块；单一 Surface，非卡片墙） */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3 shadow-2xs">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">这个智能体如何工作</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      由当前工作定义自动汇总；在左侧各分区修改并保存后，此处同步更新。
                    </p>
                  </div>
                  <div className="flex items-stretch overflow-x-auto pb-1">
                    {(
                      [
                        {
                          stage: '处理',
                          main: `${enabledTaskCount} 项${workCategoryWord}`,
                          sub: flowTaskSub,
                          title: enabledTaskNames.join(' · ')
                        },
                        {
                          stage: '使用',
                          main: flowScopeMain,
                          sub: flowScopeSub,
                          title: [scopeSummary, ...supportingSourceLabels].join(' · ')
                        },
                        {
                          stage: '采用',
                          main: ws.editable.capabilityPreset,
                          sub: friendlyCapabilityDesc,
                          title: ws.editable.capabilityDesc
                        },
                        {
                          stage: '遵循',
                          main: policyDisplayName,
                          sub: policyDisplayDesc,
                          title: policyDisplayDesc
                        },
                        {
                          stage: '最多',
                          main: MAX_AUTONOMY_VIEWS[ws.editable.maxAutonomy],
                          sub: autonomyDescDisplay,
                          title: autonomyDescDisplay
                        }
                      ] as Array<{ stage: string; main: string; sub?: string; title?: string }>
                    ).map((node, index) => (
                      <React.Fragment key={node.stage}>
                        {index > 0 && (
                          <div className="flex items-center px-1 text-[#CBD5E1] shrink-0">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className="min-w-[148px] max-w-[210px] flex-1 px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1"
                          title={node.title}
                        >
                          <div className="text-[10px] font-semibold text-[#94A3B8] tracking-wider">
                            {node.stage}
                          </div>
                          <div className="text-xs font-bold text-[#0F172A] leading-snug">{node.main}</div>
                          {node.sub && (
                            <div className="text-[10px] text-[#64748B] leading-relaxed">{node.sub}</div>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* C. 当前工作定义（V1.2 §17/§18：统一替代原「当前定义摘要 / 当前配置摘要」，
                    两列紧凑 Definition List 回答五个问题；明确标注当前展示 Draft 还是正式版本） */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3 shadow-2xs">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">当前工作定义</h3>
                    <p className="text-[11px] mt-0.5 font-medium text-[#475569]">{editableSourceNote}</p>
                  </div>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 pt-3 border-t border-[#F1F5F9] text-xs">
                    <div className="space-y-0.5">
                      <dt className="text-[11px] text-[#64748B]">工作任务</dt>
                      <dd className="font-bold text-[#0F172A]">{enabledTaskCount} 项已启用</dd>
                      <dd className="text-[10px] text-[#94A3B8] truncate" title={enabledTaskNames.join(' · ')}>
                        {flowTaskSub}
                      </dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-[11px] text-[#64748B]">数据与知识范围</dt>
                      <dd
                        className="font-bold text-[#0F172A] truncate"
                        title={scopeConfigured ? scopeSummary : undefined}
                      >
                        {scopeConfigured ? scopeSummary : '尚未配置主工作范围'}
                      </dd>
                      <dd
                        className="text-[10px] text-[#94A3B8] truncate"
                        title={supportingSourceLabels.join(' · ')}
                      >
                        {flowScopeSub ? `另可使用：${flowScopeSub}` : ' '}
                      </dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-[11px] text-[#64748B]">执行方式</dt>
                      <dd className="font-bold text-[#0F172A]">{ws.editable.capabilityPreset}</dd>
                      <dd className="text-[10px] text-[#94A3B8] truncate" title={ws.editable.capabilityDesc}>
                        {friendlyCapabilityDesc}
                      </dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-[11px] text-[#64748B]">判断原则</dt>
                      <dd className="font-bold text-[#0F172A]">{policyDisplayName}</dd>
                      <dd className="text-[10px] text-[#94A3B8]">{policyDisplayDesc}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-[11px] text-[#64748B]">行动边界</dt>
                      <dd className="font-bold text-[#0F172A]">
                        {MAX_AUTONOMY_VIEWS[ws.editable.maxAutonomy]}
                      </dd>
                      <dd className="text-[10px] text-[#94A3B8]">{autonomyDescDisplay}</dd>
                    </div>
                  </dl>
                </div>

                {/* D. 版本与状态（V1.2 §19–§21：原「正式基线 + 当前草稿」两个大块降级为紧凑状态区；
                    businessDiffs 只是已记录变更摘要，不当作完整 Diff 铺开） */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3 shadow-2xs">
                  <h3 className="text-xs font-bold text-[#0F172A]">版本与状态</h3>
                  {ws.formalVersion === null ? (
                    <dl className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-md space-y-0.5">
                        <dt className="text-[10px] text-[#92700A]">当前状态</dt>
                        <dd className="font-bold text-amber-900">未发布草稿</dd>
                      </div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-0.5">
                        <dt className="text-[10px] text-[#94A3B8]">正式版本</dt>
                        <dd className="font-bold text-[#94A3B8]">暂无</dd>
                      </div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-0.5">
                        <dt className="text-[10px] text-[#94A3B8]">发布验证</dt>
                        <dd className="font-bold text-[#0F172A]">待完成</dd>
                      </div>
                    </dl>
                  ) : ws.hasDraft ? (
                    <dl className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-0.5">
                        <dt className="text-[10px] text-[#94A3B8]">正式版本</dt>
                        <dd className="font-bold text-[#0F172A]">
                          <span className="font-mono">{ws.formalVersion}</span>
                          <span className="block text-[10px] font-normal text-[#16A36A]">
                            当前仍保持生效
                          </span>
                        </dd>
                      </div>
                      <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-0.5">
                        <dt className="text-[10px] text-[#2563EB]/70">当前草稿</dt>
                        <dd className="font-bold text-[#1E40AF]">有未发布修改</dd>
                      </div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-0.5">
                        <dt className="text-[10px] text-[#94A3B8]">最近发布</dt>
                        <dd className="font-medium text-[#475569] truncate" title={ws.lastReleaseTime ?? ''}>
                          {ws.lastReleaseTime || '—'}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <dl className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-0.5">
                        <dt className="text-[10px] text-[#94A3B8]">当前状态</dt>
                        <dd className="font-bold text-[#16A36A]">正常</dd>
                      </div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-0.5">
                        <dt className="text-[10px] text-[#94A3B8]">正式版本</dt>
                        <dd className="font-bold font-mono text-[#0F172A]">{ws.formalVersion}</dd>
                      </div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-0.5">
                        <dt className="text-[10px] text-[#94A3B8]">当前草稿</dt>
                        <dd className="font-bold text-[#94A3B8]">无</dd>
                      </div>
                    </dl>
                  )}

                  {/* 正式版本配置弱折叠（§20：formalVersion && hasDraft 时提供，事实源仍是 ws.published，
                      绝不混入 Draft；不再默认占据大型「正式基线」区域） */}
                  {ws.formalVersion && ws.hasDraft && baseline && (
                    <div className="border-t border-[#F1F5F9] pt-2.5 space-y-2">
                      <button
                        onClick={() => setIsPublishedDetailOpen((v) => !v)}
                        className="flex items-center space-x-1 text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                      >
                        {isPublishedDetailOpen ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span>查看正式版本配置（{ws.formalVersion}）</span>
                      </button>
                      {isPublishedDetailOpen && (
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs">
                          <div className="flex items-center justify-between">
                            <dt className="text-[#64748B]">Owner</dt>
                            <dd className="font-medium text-[#0F172A]">{baseline.owner}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[#64748B]">任务数量</dt>
                            <dd className="font-medium text-[#0F172A]">{baselineEnabledTaskCount} 项已启用</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[#64748B]">范围</dt>
                            <dd
                              className="font-medium text-[#0F172A] truncate max-w-[60%]"
                              title={baselineScopeSummary ?? undefined}
                            >
                              {baselineScopeSummary ?? '未配置'}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[#64748B]">执行方式</dt>
                            <dd className="font-medium text-[#0F172A]">{baseline.capabilityPreset}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[#64748B]">判断原则</dt>
                            <dd className="font-medium text-[#0F172A]">
                              {baselinePolicyName ?? baseline.modelPolicyId}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[#64748B]">行动边界</dt>
                            <dd className="font-medium text-[#0F172A]">
                              {MAX_AUTONOMY_VIEWS[baseline.maxAutonomy]}
                            </dd>
                          </div>
                        </dl>
                      )}
                    </div>
                  )}

                  {/* 草稿变更摘要弱折叠（§21：businessDiffs 只是「已记录的变更摘要」，
                      不是完整 Diff；无摘要时不显示「与正式版本一致」之类推断） */}
                  {ws.hasDraft && ws.businessDiffs.length > 0 && (
                    <div className="border-t border-[#F1F5F9] pt-2.5 space-y-2">
                      <button
                        onClick={() => setIsDiffSummaryOpen((v) => !v)}
                        className="flex items-center space-x-1 text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                      >
                        {isDiffSummaryOpen ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span>已记录 {ws.businessDiffs.length} 项草稿变更摘要 · 查看变更摘要</span>
                      </button>
                      {isDiffSummaryOpen && (
                        <div className="space-y-1.5">
                          {ws.businessDiffs.map((diff, index) => (
                            <div
                              key={index}
                              className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-[#0F172A]">{diff.field}</div>
                                <div className="text-[11px] text-[#475569] truncate">{diff.changeText}</div>
                              </div>
                              <span className="text-[10px] font-mono text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                                {diff.tag}
                              </span>
                            </div>
                          ))}
                          <p className="text-[10px] text-[#94A3B8] leading-relaxed">
                            变更摘要仅为创建与编辑时记录的业务摘要，不代表草稿与正式版本的完整差异。
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {(ws.formalVersion === null || ws.hasDraft) && (
                    <p className="text-[11px] text-[#94A3B8]">
                      草稿修改不会影响当前正式运行，完成发布验证并正式发布后才会生效。
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                      {activeSection === 'basic_info' && '角色与职责'}
                      {activeSection === 'tasks' && '工作任务'}
                      {activeSection === 'scope' && '数据与知识范围'}
                      {activeSection === 'capabilities' && '执行方式'}
                      {activeSection === 'model_autonomy' && '决策与行动边界'}
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {activeSection === 'basic_info' && '这个智能体是谁，为什么存在，谁负责它？'}
                      {activeSection === 'tasks' && '哪些工作可以交给这个智能体？'}
                      {activeSection === 'scope' && '这个智能体工作时可以使用哪些业务信息？'}
                      {activeSection === 'capabilities' && '面对这些工作，这个智能体默认如何完成？'}
                      {activeSection === 'model_autonomy' && '它如何判断？它最多可以做到哪里？'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('overview')}
                    className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    返回概览
                  </button>
                </div>

                {/* ───────────── 角色与职责（Built-in 锁定 / Custom 可编辑 + 高级角色说明；编辑逻辑不变） ───────────── */}
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
                            高级角色说明用于定义智能体履行职责时的专业行为规则；
                            平台安全、权限和任务协议不可在此覆盖。
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-1 flex justify-end">{saveButton}</div>
                  </div>
                )}

                {/* ───────────── 工作任务（Built-in 锁定 / Custom 模板集合内启停；不虚构 Output Contract） ───────────── */}
                {activeSection === 'tasks' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                    <div className="font-bold text-[#0F172A]">
                      工作任务（{displayTasks.filter((t) => t.enabled).length}/{displayTasks.length} 已启用）
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[11px] text-[#64748B] leading-relaxed">
                      这里决定哪些工作可以交给当前智能体。具体任务流程和执行规则由 Semovix 统一管理。
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
                            {/* §08：taskTemplateId 移入 tooltip，普通卡片只显示 名称/说明/启用状态 */}
                            <div className="min-w-0" title={task.taskTemplateId}>
                              <div className="font-semibold text-[#0F172A] flex items-center space-x-2">
                                <span className="truncate">
                                  {idx + 1}. {view.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#64748B] mt-0.5">{view.desc}</div>
                            </div>
                            <div className="flex items-center space-x-2.5 shrink-0">
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

                {/* ───────────── 数据与知识范围（A 主要工作范围 / B 工作时可以使用 / C 权限说明；保存逻辑不变） ───────────── */}
                {activeSection === 'scope' && (
                  <div className="space-y-4">
                    {/* A. 主要工作范围 */}
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                      <div className="font-bold text-[#0F172A]">主要工作范围</div>

                      {scopeConfig && scopeIsActiveForEditing ? (
                        <>
                          {/* 草稿启用模式提示 + 保存前取消（弱操作，无 Modal） */}
                          {!scopeCurrentlyAllowed && scopeActivationRequested && (
                            <div className="flex items-center justify-between gap-3 p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                              <span className="text-[11px] text-[#1E40AF] leading-relaxed">
                                本次配置仅写入草稿，不影响当前正式版本。
                              </span>
                              <button
                                onClick={cancelScopeActivation}
                                className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] underline underline-offset-2 cursor-pointer shrink-0"
                              >
                                取消启用
                              </button>
                            </div>
                          )}
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
                                onChange={() => {
                                  setEditScopeMode('ALL_ALLOWED');
                                  setScopeTouched(true);
                                }}
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
                                onChange={() => {
                                  setEditScopeMode('SELECTED');
                                  setScopeTouched(true);
                                }}
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
                                      onChange={(e) => {
                                        setScopeTouched(true);
                                        setEditScopeResourceIds((prev) =>
                                          e.target.checked
                                            ? [...prev, option.resourceId]
                                            : prev.filter((id) => id !== option.resourceId)
                                        );
                                      }}
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
                      ) : scopeConfig && scopeCanBeEnabledInDraft ? (
                        /* B. 当前正式配置尚未启用但能力模板允许：可在草稿中启用（不与「模板不允许」混淆） */
                        <div className="space-y-2">
                          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md space-y-2">
                            <div className="text-xs font-semibold text-amber-900">
                              当前正式版本尚未启用此工作范围
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              该工作范围已在当前能力模板的允许范围内。你可以在草稿中启用，完成发布验证并正式发布后才会生效。
                            </p>
                            <button
                              onClick={activateScopeInDraft}
                              className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              在草稿中启用
                            </button>
                          </div>
                          {currentBindingsList}
                        </div>
                      ) : scopeConfig ? (
                        /* C. 能力模板不允许该来源：不可配置（Domain 校验为最终裁决） */
                        <div className="space-y-2">
                          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[#475569] leading-relaxed">
                            该工作范围（{AGENT_CONTEXT_SOURCE_VIEWS[scopeConfig.sourceType].label}
                            ）不在当前能力模板的允许范围内，不可配置；可使用的支撑来源见下方。
                          </div>
                          {currentBindingsList}
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

                    {/* B. 工作时可以使用（allowedContextSources Read-first 投影；
                        不叫「模板允许的支撑来源」，不做成权限矩阵） */}
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                      <div className="font-bold text-[#0F172A]">工作时可以使用</div>
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
                        以上是当前能力模板允许使用的信息来源类型；
                        实际可使用的信息仍受当前用户权限和具体任务范围限制。
                      </p>
                    </div>

                    {/* C. 权限说明（普通用户语言；收敛公式放 title tooltip，主 UI 不出现权限矩阵/任务引擎等平台内部概念） */}
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-1.5 text-xs">
                      <div
                        className="font-bold text-[#0F172A] cursor-help"
                        title="实际运行上下文 = 智能体允许范围 ∩ 当前用户权限 ∩ 当前任务范围"
                      >
                        权限说明
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        实际可使用的信息还会受到当前用户权限和具体任务范围限制。
                        智能体的工作范围不会扩大用户原有权限。
                      </p>
                    </div>
                  </div>
                )}

                {/* ───────────── 执行方式（受控 Capability Preset；单一选项时只读，不提供假下拉；
                      底层引擎表达不进入主文案，capabilityDesc 原文保留在 tooltip） ───────────── */}
                {activeSection === 'capabilities' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="font-bold text-[#0F172A]">执行方式</div>
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
                              <div title={option.capabilityDesc}>
                                <div className="font-semibold text-[#0F172A]">{option.capabilityPreset}</div>
                                <div className="text-[11px] text-[#64748B] mt-0.5">
                                  {toFriendlyCapabilityDesc(option.capabilityDesc)}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                        <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                          只能在平台为该能力模板验证过的执行方式内选择；检索与推理参数由平台统一管理。
                        </p>
                        <div className="pt-1 flex justify-end">{saveButton}</div>
                      </>
                    ) : (
                      <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1">
                        <div className="font-semibold text-[#1E40AF]">{ws.editable.capabilityPreset}</div>
                        <p className="text-[11px] text-[#2563EB]" title={ws.editable.capabilityDesc}>
                          {friendlyCapabilityDesc}
                        </p>
                        <p className="text-[11px] text-[#94A3B8]">
                          当前能力模板只提供这一种平台已验证的执行方式。
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ───────────── 决策与行动边界（A 判断原则：modelPolicyId SoT；B 行动边界：MaxAutonomy SoT。
                      用户只看产品语义文案，不出现 SUGGEST / PROPOSE enum 与底层模型参数） ───────────── */}
                {activeSection === 'model_autonomy' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-1.5 text-xs">
                      <div className="font-bold text-[#0F172A]">判断原则</div>
                      <p className="text-[11px] text-[#64748B]">
                        它依据什么原则做出判断？底层模型与参数由平台统一管理，不在此配置。
                      </p>
                      <select
                        value={editModelPolicyId}
                        onChange={(e) => setEditModelPolicyId(e.target.value)}
                        className="w-full px-3 py-2 mt-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A] cursor-pointer"
                      >
                        {modelPolicySelectOptions.map((option) => (
                          <option key={option.modelPolicyId} value={option.modelPolicyId}>
                            {option.modelPolicyName}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                        {modelPolicySelectOptions.find((o) => o.modelPolicyId === editModelPolicyId)?.desc ||
                          '只允许选择平台正式判断原则。'}
                      </p>
                    </div>

                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                      <div className="font-bold text-[#0F172A]">行动边界</div>
                      <p className="text-[11px] text-[#64748B]">它最多可以自主做到哪一步？</p>
                      {autonomyOptions.length > 1 ? (
                        <div className="space-y-2">
                          {autonomyOptions.map((option) => {
                            const boundary = MAX_AUTONOMY_BOUNDARY_NOTES[option.maxAutonomy];
                            return (
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
                                <div className="space-y-1">
                                  <div className="font-semibold text-[#0F172A]">
                                    {MAX_AUTONOMY_VIEWS[option.maxAutonomy]}
                                  </div>
                                  <div className="text-[11px] text-[#64748B]">{option.desc}</div>
                                  <div className="text-[11px] leading-relaxed space-y-0.5">
                                    <div className="text-[#334155]">
                                      <span className="font-semibold">可以：</span>
                                      {boundary.can}
                                    </div>
                                    <div className="text-[#64748B]">
                                      <span className="font-semibold">{boundary.wontLabel}：</span>
                                      {boundary.wont}
                                    </div>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1.5">
                          <div className="font-semibold text-[#0F172A]">
                            {MAX_AUTONOMY_VIEWS[autonomyOptions[0]?.maxAutonomy ?? ws.editable.maxAutonomy]}
                          </div>
                          <p className="text-[11px] text-[#64748B]">
                            {autonomyOptions[0]?.desc ?? ws.editable.maxAutonomyDesc}
                          </p>
                          <div className="text-[11px] leading-relaxed space-y-0.5">
                            <div className="text-[#334155]">
                              <span className="font-semibold">可以：</span>
                              {MAX_AUTONOMY_BOUNDARY_NOTES[
                                autonomyOptions[0]?.maxAutonomy ?? ws.editable.maxAutonomy
                              ].can}
                            </div>
                            <div className="text-[#64748B]">
                              <span className="font-semibold">
                                {MAX_AUTONOMY_BOUNDARY_NOTES[
                                  autonomyOptions[0]?.maxAutonomy ?? ws.editable.maxAutonomy
                                ].wontLabel}
                                ：
                              </span>
                              {MAX_AUTONOMY_BOUNDARY_NOTES[
                                autonomyOptions[0]?.maxAutonomy ?? ws.editable.maxAutonomy
                              ].wont}
                            </div>
                          </div>
                          <p className="text-[11px] text-[#94A3B8]">
                            当前能力模板的行动边界由平台控制，不开放更高自主。
                          </p>
                        </div>
                      )}
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                        行动边界只约束智能体自身的行动，永远不会扩大用户权限。
                      </p>
                      <div className="pt-1 flex justify-end">{saveButton}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ─────────────────────────────────────────────────────────
            COLUMN C. 右侧栏（V1.2 §22）：只负责 当前状态 + 生命周期 + 下一步操作。
            工作定义主体在中央「当前工作定义」，不再在右栏重复
            任务 / 范围 / 执行方式 / 判断原则 / 行动边界。
        ───────────────────────────────────────────────────────── */}
        <aside className="w-[290px] bg-white border-l border-[#E2E8F0] p-4 shrink-0 overflow-y-auto select-none space-y-4">
          <div className="pb-2 border-b border-[#F1F5F9]">
            <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">当前状态</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {ws.editableSource === 'DRAFT'
                ? '当前展示未发布草稿配置'
                : '当前展示正式版本配置（编辑后生成草稿）'}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">类型</span>
              <span className="font-bold text-[#0F172A]">{originLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Owner</span>
              <span className="font-bold text-[#0F172A] truncate max-w-[150px]" title={ws.editable.owner}>
                {ws.editable.owner}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">正式版本</span>
              <span className="font-mono font-semibold text-[#0F172A]">
                {ws.formalVersion ?? <span className="text-[#94A3B8] font-sans">暂无</span>}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">草稿</span>
              <span className="font-bold text-[#0F172A]">
                {ws.formalVersion === null
                  ? '未发布草稿'
                  : ws.hasDraft
                    ? '有未发布修改'
                    : '无'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">最近更新</span>
              <span
                className="font-medium text-[#475569] truncate max-w-[150px]"
                title={ws.draftUpdatedAt ?? ws.lastReleaseTime ?? ''}
              >
                {ws.draftUpdatedAt ?? ws.lastReleaseTime ?? '—'}
              </span>
            </div>
          </div>

          {/* 底部：单一「进入发布验证」入口（状态事实源 = formalVersion + hasDraft，不用 businessDiffs 推导一致） */}
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
                ? '完成定义后进入发布验证，通过全部检查后发布首个正式版本。'
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
              <span>进入发布验证</span>
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
                {runtimeBinding ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">绑定正式版本</span>
                      <span className="font-mono font-semibold text-[#0F172A]">
                        {runtimeBinding.agentVersion}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">集成模式</span>
                      <span
                        className={`font-semibold ${
                          runtimeBinding.integrationMode === 'PRODUCTION' ? 'text-[#16A36A]' : 'text-amber-600'
                        }`}
                      >
                        {runtimeHealth?.integrationMode ?? runtimeBinding.integrationMode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">同步状态</span>
                      <span className="font-mono font-semibold text-[#0F172A]">
                        {runtimeBinding.syncStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">运行健康</span>
                      <span className="font-mono font-semibold text-[#0F172A]">
                        {runtimeHealth?.healthStatus ?? runtimeBinding.healthStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Runtime Config Revision</span>
                      <span className="font-mono text-[#0F172A]">
                        {runtimeBinding.runtimeConfigRevision || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">最近同步</span>
                      <span className="text-[#475569]">{runtimeBinding.lastSyncedAt || '尚未同步'}</span>
                    </div>
                  </>
                ) : (
                  <div className="pt-1 pb-0.5 text-[11px] text-[#475569] leading-relaxed">
                    尚无正式运行绑定——当前智能体未发布，
                    发布成功后才会建立首个版本化运行绑定。
                  </div>
                )}
              </div>

              {/* Commit 08 TASK 23：明确区分正式 Binding 与 Draft transient Projection，
                  不让用户误以为 Draft 已同步 */}
              {runtimeBinding && ws.hasDraft && (
                <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[11px] text-[#1E40AF] leading-relaxed">
                  正式运行绑定 → {runtimeBinding.agentVersion}；当前草稿（{ws.draftId}）尚未建立正式运行绑定，
                  测试时仅使用临时编译的 RuntimeProjection，不会切换正式 Binding。
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-relaxed">
                {runtimeHealth?.message
                  ? `${runtimeHealth.message}（来自 AgentRuntimeAdapter.getHealth，非实时探测数据）`
                  : '正在从 Runtime Adapter 读取健康信息...（当前为模拟集成，如实标注 MOCK_RUNTIME，不伪装生产连接）'}
              </div>

              <div className="text-[11px] text-[#64748B] leading-relaxed">
                草稿配置不会写入正式运行环境，草稿修改仅在发布验证环境中生效；正式运行以已发布版本为准。
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

      {/* ─────────────────────────────────────────────────────────────
          未保存离开保护确认（§10：脏 Patch 时弹轻量确认，不用原生 alert）
          ───────────────────────────────────────────────────────────── */}
      {pendingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setPendingLeave(null)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">有未保存的修改</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              当前修改尚未保存到草稿。离开后，本次未保存内容将丢失。
            </p>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => setPendingLeave(null)}
                className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs"
              >
                继续编辑
              </button>
              <button
                onClick={() => {
                  const leave = pendingLeave;
                  setPendingLeave(null);
                  leave();
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#475569] border border-[#CBD5E1] rounded-md text-xs font-semibold cursor-pointer"
              >
                放弃修改并离开
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
