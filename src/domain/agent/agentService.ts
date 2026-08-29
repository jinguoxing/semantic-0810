/**
 * Semovix Agent Domain Model - Service
 * Core business operations:
 * - createDraftFromPreset: Generates an AgentDefinition + AgentDraft from an official preset
 * - publishDraft: Enforces immutable versioning (creates AgentVersion, updates runtime binding)
 * - createDraftFromPublishedVersion: Starts a new draft cycle from an immutable published snapshot
 * - updateAgentDraft: The single unified draft edit entry (UpdateAgentDraftPatch)
 * - evaluateReleaseValidation: Runs the five Release Gates for the current draft
 */

import {
  AgentDefinition,
  AgentDraft,
  AgentVersion,
  AgentRuntimeBinding,
  AgentBusinessDiff,
  AgentReleaseValidation,
  AgentContextBinding,
  AgentContextSource,
  AGENT_CONTEXT_SOURCE_VIEWS,
  ManagedAgentPreset,
  TaskTemplateBinding,
  UpdateAgentDraftPatch,
  MODEL_POLICY_OPTIONS,
  buildAgentDefinitionSnapshot,
  ReleaseGateKey,
  RELEASE_GATE_LABELS,
  getFailedReleaseGates,
  isReleaseGatePassed
} from './agentTypes';
import {
  getPresetById,
  TEMPLATE_AUTONOMY_OPTIONS,
  TEMPLATE_CAPABILITY_OPTIONS
} from './agentPresets';
import { agentRepository } from './agentRepository';
import { getRuntimeAdapter } from './runtime/adapters';

export interface CreateDraftFromPresetInput {
  presetId: string;
  name: string;
  responsibility: string;
  owner: string;
  /** V1.1 工作范围；A02 正常创建路径应始终显式传入当前 UI Binding */
  contextBindings?: AgentContextBinding[];
}

/**
 * 各能力模板的主工作范围来源：调用者未传 contextBindings 时，
 * Domain Service 依据 Preset 生成明确默认 Binding（ALL_ALLOWED），
 * 不落空数组导致行为不可预测。
 */
const PRESET_DEFAULT_SCOPE_SOURCE: Record<string, AgentContextSource> = {
  DATA_INTELLIGENCE: 'BUSINESS_DOMAIN',
  ENTERPRISE_KNOWLEDGE: 'KNOWLEDGE_SPACE',
  SEMANTIC_GOVERNANCE: 'BUSINESS_DOMAIN'
};

/** 深拷贝：Definition 与 Draft 各自持有独立副本，避免共享引用 */
function cloneContextBindings(bindings: AgentContextBinding[]): AgentContextBinding[] {
  return bindings.map((binding) => ({
    sourceType: binding.sourceType,
    selectionMode: binding.selectionMode,
    resourceIds: binding.resourceIds ? [...binding.resourceIds] : undefined
  }));
}

/** 依据 Preset 生成默认主范围 Binding：BUSINESS_DOMAIN / KNOWLEDGE_SPACE × ALL_ALLOWED */
function defaultContextBindingFor(preset: ManagedAgentPreset): AgentContextBinding[] {
  const sourceType = PRESET_DEFAULT_SCOPE_SOURCE[preset.presetId] ?? 'BUSINESS_DOMAIN';
  return [{ sourceType, selectionMode: 'ALL_ALLOWED' }];
}

/**
 * Context Binding 领域校验与归一化（V1.1 Domain Contract，创建与更新共用同一规则）：
 * A. sourceType 必须在允许的来源范围内（Context Binding 不能扩大允许范围）
 * B. SELECTED 必须携带至少一个 resourceId
 * C. SELECTED resourceIds 保存前去重（保持原顺序）
 * D. ALL_ALLOWED 统一不保存 resourceIds（归一为 undefined）
 */
function validateAndNormalizeContextBindingsAgainst(
  bindings: AgentContextBinding[],
  allowedContextSources: AgentContextSource[]
): AgentContextBinding[] {
  return bindings.map((binding) => {
    if (!allowedContextSources.includes(binding.sourceType)) {
      throw new AgentContextBindingValidationError(
        `上下文来源不在允许范围内: ${binding.sourceType}`
      );
    }
    if (binding.selectionMode === 'SELECTED') {
      if (!binding.resourceIds || binding.resourceIds.length === 0) {
        throw new AgentContextBindingValidationError(
          `SELECTED 工作范围必须至少指定一个资源: ${binding.sourceType}`
        );
      }
      return {
        sourceType: binding.sourceType,
        selectionMode: 'SELECTED',
        resourceIds: Array.from(new Set(binding.resourceIds))
      };
    }
    return { sourceType: binding.sourceType, selectionMode: 'ALL_ALLOWED' };
  });
}

/** 创建路径：以能力模板的 allowedContextSources 为允许范围 */
function validateAndNormalizeContextBindings(
  bindings: AgentContextBinding[],
  preset: ManagedAgentPreset
): AgentContextBinding[] {
  return validateAndNormalizeContextBindingsAgainst(bindings, preset.allowedContextSources);
}

/** 草稿 diff 用的工作范围描述（Domain 层不依赖 UI 名称 Fixture，只写来源类型与数量） */
function describeContextBindings(bindings: AgentContextBinding[]): string {
  return bindings
    .map((binding) => {
      const label = AGENT_CONTEXT_SOURCE_VIEWS[binding.sourceType].label;
      return binding.selectionMode === 'ALL_ALLOWED'
        ? `${label} · 按用户权限动态使用`
        : `${label} · 指定 ${binding.resourceIds?.length ?? 0} 项资源`;
    })
    .join('；');
}

export class AgentPublishError extends Error {
  constructor(
    message: string,
    public readonly failedStage: 'VALIDATION' | 'ACTIVATION'
  ) {
    super(message);
    this.name = 'AgentPublishError';
  }
}

/** 非法 / 未知能力模板 ID：禁止静默 fallback 到任何默认模板（如知识模板） */
export class AgentCapabilityTemplateNotFoundError extends Error {
  constructor(public readonly presetId: string) {
    super(`未找到对应的能力模板: ${presetId}`);
    this.name = 'AgentCapabilityTemplateNotFoundError';
  }
}

/**
 * Context Binding 领域校验失败：
 * AgentContextBinding 是正式 Domain Contract，不能只依赖 A02 UI 校验。
 */
export class AgentContextBindingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentContextBindingValidationError';
  }
}

/** Draft 编辑校验失败（如必填字段被显式传入空字符串）—— 禁止静默吞掉非法编辑 */
export class AgentDraftValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentDraftValidationError';
  }
}

/** currentPublishedVersion 存在但找不到对应 AgentVersion Snapshot —— 禁止静默继续 */
export class AgentPublishedVersionNotFoundError extends Error {
  constructor(agentId: string, versionNumber: string) {
    super(`未找到智能体 ${agentId} 的正式版本快照: ${versionNumber}`);
    this.name = 'AgentPublishedVersionNotFoundError';
  }
}

/**
 * 违反 Agent / Template 治理策略（Commit 06.1 Edit Policy）：
 * - Built-in 锁定字段被修改
 * - Task 超出 Capability Template 范围
 * - Capability Preset / Model Policy 非法
 * - Autonomy 超出模板上限
 * - allowedContextSources 越界
 *
 * 与既有错误的语义边界：
 * AgentDraftValidationError          → 数据自身非法（如空字符串）
 * AgentContextBindingValidationError → Context Contract 非法
 * AgentEditPolicyViolationError      → 违反 Agent / Template 治理策略
 */
export class AgentEditPolicyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentEditPolicyViolationError';
  }
}

/**
 * Release Gate 未通过（Commit 07 §34）：UI Guard ≠ Domain Invariant。
 * publishDraft() 自行重新执行五道门，任何调用路径都不能绕过。
 * 携带完整 validation 供 A04 刷新展示（stale canPublish 恢复）。
 */
export class ReleaseGateNotPassedError extends Error {
  constructor(
    public readonly validation: AgentReleaseValidation,
    public readonly failedChecks: ReleaseGateKey[]
  ) {
    super(`发布验证未通过：${failedChecks.map((key) => RELEASE_GATE_LABELS[key]).join('、')}`);
    this.name = 'ReleaseGateNotPassedError';
  }
}

/**
 * 发布验证对象已变化（Commit 07 TASK 29）：
 * Gate 评估的 Draft 与发布开始读取的 Draft 不是同一个——发布期间目标草稿被替换。
 */
export class ReleaseDraftChangedError extends Error {
  constructor(expectedDraftId: string, evaluatedDraftId: string) {
    super(`发布验证对象已变化，请重新执行发布检查（评估 ${evaluatedDraftId}，当前 ${expectedDraftId}）`);
    this.name = 'ReleaseDraftChangedError';
  }
}

/**
 * 无真实编辑人上下文时的诚实标注。
 * Owner ≠ updatedBy：没有 Current User Context 就不伪造审计身份（不把 Owner 当 Editor）。
 */
const UNKNOWN_EDITOR = '未记录';

/** Built-in 锁定字段：不属于普通 Built-in Agent Owner 可编辑 Contract（Patch 显式包含即拒绝，不比较值是否变化） */
const BUILT_IN_LOCKED_PATCH_FIELDS = [
  'name',
  'description',
  'responsibilitySummary',
  'roleInstruction',
  'supportedTaskTemplates'
] as const;

const BUILT_IN_LOCKED_FIELD_LABELS: Record<(typeof BUILT_IN_LOCKED_PATCH_FIELDS)[number], string> = {
  name: '智能体名称',
  description: '描述',
  responsibilitySummary: '主要职责',
  roleInstruction: '高级角色说明',
  supportedTaskTemplates: '支持任务绑定'
};

/**
 * Agent Edit Policy（Commit 06.1 FIX 10）：统一校验 + canonical normalization。
 * 在写入 AgentDraft 之前执行，保证「UI Constraint + Domain Constraint」双层边界——
 * 绕过 A03 UI 直接调用 Service 也无法写入非法配置。
 *
 * 校验顺序（FIX 9）：Template Edit Policy → effectiveAllowedContextSources → Context Binding Validation。
 * 本函数只负责 Edit Policy；Context Binding 校验仍由 validateAndNormalizeContextBindingsAgainst() 承担。
 *
 * @param def   目标 AgentDefinition（origin / sourcePresetId 以 Definition 为准）
 * @param draft 当前草稿；尚无草稿时传 undefined（基线退化为 Definition）
 * @param patch 调用方传入的 UpdateAgentDraftPatch
 * @returns 经过治理规则验证并完成 canonical normalization 的新 Patch（canonical desc/name 由 SoT 决定，不信任调用方）
 */
function validateAndNormalizeAgentDraftPatch(
  def: AgentDefinition,
  draft: AgentDraft | undefined,
  patch: UpdateAgentDraftPatch
): UpdateAgentDraftPatch {
  // FIX 3：Domain Policy 只以 AgentDefinition.sourcePresetId 解析模板，
  // 不从名称 / runtimeTarget / avatar / UI 类型推断；找不到就不 fallback。
  const preset = def.sourcePresetId ? getPresetById(def.sourcePresetId) : undefined;

  // FIX 2：Built-in Domain Lock —— 只要 Patch 明确包含锁定字段即拒绝
  if (def.origin === 'BUILT_IN') {
    for (const field of BUILT_IN_LOCKED_PATCH_FIELDS) {
      if (patch[field] !== undefined) {
        throw new AgentEditPolicyViolationError(
          `内置智能体的「${BUILT_IN_LOCKED_FIELD_LABELS[field]}」由平台内置定义，不属于普通 Draft 编辑合同`
        );
      }
    }
  }

  const normalized: UpdateAgentDraftPatch = { ...patch };

  // FIX 4：Custom Task Boundary —— 只能来自当前 Capability Template 的任务集合
  if (patch.supportedTaskTemplates !== undefined) {
    if (!preset) {
      throw new AgentEditPolicyViolationError(
        `智能体 ${def.agentId} 缺少合法能力模板（sourcePresetId: ${def.sourcePresetId ?? '缺失'}），不允许修改支持任务`
      );
    }
    const seen = new Set<string>();
    const normalizedTasks: TaskTemplateBinding[] = [];
    for (const binding of patch.supportedTaskTemplates) {
      const templateBinding = preset.supportedTaskTemplates.find(
        (t) => t.taskTemplateId === binding.taskTemplateId
      );
      if (!templateBinding) {
        throw new AgentEditPolicyViolationError(
          `任务 ${binding.taskTemplateId} 不在能力模板 ${preset.presetId} 允许的任务集合内`
        );
      }
      if (seen.has(binding.taskTemplateId)) {
        throw new AgentEditPolicyViolationError(`任务 ${binding.taskTemplateId} 重复，不允许重复绑定`);
      }
      if (binding.version !== templateBinding.version) {
        throw new AgentEditPolicyViolationError(
          `任务 ${binding.taskTemplateId} 的 version 必须是模板正式版本 ${templateBinding.version}（收到 ${binding.version}）`
        );
      }
      seen.add(binding.taskTemplateId);
      normalizedTasks.push({
        taskTemplateId: binding.taskTemplateId,
        version: templateBinding.version,
        enabled: binding.enabled === true
      });
    }
    normalized.supportedTaskTemplates = normalizedTasks;
  }

  // FIX 5：Capability Preset 必须在模板受控目录内；capabilityDesc 由所选模式 canonical 决定
  if (patch.capabilityDesc !== undefined && patch.capabilityPreset === undefined) {
    throw new AgentEditPolicyViolationError(
      '不允许单独修改 capabilityDesc：能力模式描述由所选能力模式决定，不是自由文本配置入口'
    );
  }
  if (patch.capabilityPreset !== undefined) {
    if (!preset) {
      throw new AgentEditPolicyViolationError(
        `智能体 ${def.agentId} 缺少合法能力模板（sourcePresetId: ${def.sourcePresetId ?? '缺失'}），不允许修改能力模式`
      );
    }
    const option = (TEMPLATE_CAPABILITY_OPTIONS[preset.presetId] ?? []).find(
      (o) => o.capabilityPreset === patch.capabilityPreset
    );
    if (!option) {
      throw new AgentEditPolicyViolationError(
        `能力模式「${patch.capabilityPreset}」不在能力模板 ${preset.presetId} 的受控选项内`
      );
    }
    normalized.capabilityPreset = option.capabilityPreset;
    normalized.capabilityDesc = option.capabilityDesc;
  }

  // FIX 6：Model Policy 只允许平台正式策略；modelPolicyName 由 SoT（modelPolicyId）canonical 决定
  if (patch.modelPolicyName !== undefined && patch.modelPolicyId === undefined) {
    throw new AgentEditPolicyViolationError(
      '不允许单独修改 modelPolicyName：正式 SoT 是 modelPolicyId，展示名由平台策略目录决定'
    );
  }
  if (patch.modelPolicyId !== undefined) {
    const option = MODEL_POLICY_OPTIONS.find((o) => o.modelPolicyId === patch.modelPolicyId);
    if (!option) {
      throw new AgentEditPolicyViolationError(
        `模型策略 ${patch.modelPolicyId} 不是平台正式策略（正式 SoT 是 modelPolicyId，不是展示名）`
      );
    }
    normalized.modelPolicyId = option.modelPolicyId;
    normalized.modelPolicyName = option.modelPolicyName;
  }

  // FIX 7：Autonomy 不得超出模板上限；EXECUTE_WITHIN_POLICY 不对普通 Agent Owner 开放
  if (patch.maxAutonomyDesc !== undefined && patch.maxAutonomy === undefined) {
    throw new AgentEditPolicyViolationError(
      '不允许单独修改 maxAutonomyDesc：自主程度说明由所选自主程度决定，不是自由文本策略'
    );
  }
  if (patch.maxAutonomy !== undefined) {
    if (!preset) {
      throw new AgentEditPolicyViolationError(
        `智能体 ${def.agentId} 缺少合法能力模板（sourcePresetId: ${def.sourcePresetId ?? '缺失'}），不允许修改自主程度`
      );
    }
    const option = (TEMPLATE_AUTONOMY_OPTIONS[preset.presetId] ?? []).find(
      (o) => o.maxAutonomy === patch.maxAutonomy
    );
    if (!option) {
      throw new AgentEditPolicyViolationError(
        `自主程度 ${patch.maxAutonomy} 超出能力模板 ${preset.presetId} 的 V1.1 上限` +
          `（EXECUTE_WITHIN_POLICY 不对普通 Agent Owner 开放）`
      );
    }
    normalized.maxAutonomy = option.maxAutonomy;
    normalized.maxAutonomyDesc = option.desc;
  }

  // FIX 8：allowedContextSources 允许缩小、禁止扩大
  // 有合法 preset → 上限 = preset.allowedContextSources；无 preset → 上限 = 当前草稿/定义基线
  if (patch.allowedContextSources !== undefined) {
    const maxAllowed = preset
      ? preset.allowedContextSources
      : (draft ?? def).allowedContextSources;
    const boundaryLabel = preset ? `能力模板 ${preset.presetId}` : '当前配置';
    for (const source of patch.allowedContextSources) {
      if (!maxAllowed.includes(source)) {
        throw new AgentEditPolicyViolationError(
          `上下文来源 ${source} 超出${boundaryLabel}的最大允许范围（允许缩小，禁止扩大）`
        );
      }
    }
    normalized.allowedContextSources = [...patch.allowedContextSources];
  }

  return normalized;
}

/**
 * Final-State Configuration Validation（Commit 07 §32 configCheck）：
 * 验证「整个最终 Draft 当前是否可发布」，与 Commit 06.1 的
 * validateAndNormalizeAgentDraftPatch（「某个编辑 Patch 是否允许」）是两个不同概念——
 * 绝不能把整个 Built-in Draft 当作 Update Patch 喂给 Built-in Lock Validator，
 * 否则内置字段会被误判为「正在编辑」。
 *
 * 只检查、不修复、不 normalize（Normalization 属于 Draft Edit 阶段）。
 * Built-in / Custom 在发布检查使用相同的最终配置合法性规则：
 * 不判断「用户是否有权编辑」，只判断「最终配置是否可发布」。
 */
function validateDraftConfigurationForRelease(def: AgentDefinition, draft: AgentDraft): boolean {
  // TASK 15（严格方案）：V1.1 Agent Center 正式 Agent 必须有可解析的 sourcePresetId，缺失即 FAILED，不 fallback
  if (!def.sourcePresetId) return false;
  const preset = getPresetById(def.sourcePresetId);
  if (!preset) return false;

  // TASK 7：发布配置完整性（必填文本 + 至少一项启用任务）
  if (!draft.name.trim()) return false;
  if (!draft.description.trim()) return false;
  if (!draft.responsibilitySummary.trim()) return false;
  if (!draft.roleInstruction.trim()) return false;
  if (!draft.owner.trim()) return false;
  if (!draft.modelPolicyId.trim()) return false;
  if (!draft.supportedTaskTemplates.some((t) => t.enabled)) return false;

  // TASK 9：Final Task Validation——任务 ID 属于模板集合 / 无重复 / version 一致
  const seenTasks = new Set<string>();
  for (const binding of draft.supportedTaskTemplates) {
    const templateBinding = preset.supportedTaskTemplates.find(
      (t) => t.taskTemplateId === binding.taskTemplateId
    );
    if (!templateBinding) return false;
    if (seenTasks.has(binding.taskTemplateId)) return false;
    if (binding.version !== templateBinding.version) return false;
    seenTasks.add(binding.taskTemplateId);
  }

  // TASK 10：Final Capability Validation——必须在模板受控选项内
  const capabilityOptions = TEMPLATE_CAPABILITY_OPTIONS[preset.presetId] ?? [];
  if (!capabilityOptions.some((o) => o.capabilityPreset === draft.capabilityPreset)) return false;

  // TASK 11：Final Model Policy Validation——SoT 是 modelPolicyId（展示名不参与判断）
  if (!MODEL_POLICY_OPTIONS.some((o) => o.modelPolicyId === draft.modelPolicyId)) return false;

  // TASK 12：Final Autonomy Validation——不得超出模板上限
  const autonomyOptions = TEMPLATE_AUTONOMY_OPTIONS[preset.presetId] ?? [];
  if (!autonomyOptions.some((o) => o.maxAutonomy === draft.maxAutonomy)) return false;

  // TASK 13：Final Context Source Validation——允许比模板少，禁止比模板多
  for (const source of draft.allowedContextSources) {
    if (!preset.allowedContextSources.includes(source)) return false;
  }

  // TASK 14：Final Context Binding Validation——只验证，不 normalize、不修改
  for (const binding of draft.contextBindings) {
    if (!draft.allowedContextSources.includes(binding.sourceType)) return false;
    if (binding.selectionMode === 'SELECTED' && (!binding.resourceIds || binding.resourceIds.length === 0)) {
      return false;
    }
  }

  return true;
}

class AgentService {
  /**
   * P0: Create new unreleased Agent Definition + Initial Draft from an official preset
   */
  public createDraftFromPreset(input: CreateDraftFromPresetInput): {
    definition: AgentDefinition;
    draft: AgentDraft;
    runtimeBinding: AgentRuntimeBinding;
  } {
    // V1.1: 非法 presetId 必须显式失败，禁止静默 fallback 成知识模板
    const preset = getPresetById(input.presetId);
    if (!preset) {
      throw new AgentCapabilityTemplateNotFoundError(input.presetId);
    }
    const timestamp = Date.now().toString(36);
    const agentId = `agent_${timestamp}`;
    const draftId = `draft_${agentId}_v1_0`;
    const nowStr = '刚刚';

    // V1.1 Context Binding：显式传入优先（经领域校验与归一化）；否则按模板生成明确默认 Binding
    const contextBindings = input.contextBindings?.length
      ? validateAndNormalizeContextBindings(input.contextBindings, preset)
      : defaultContextBindingFor(preset);

    // 1. Initial Definition (Status: DRAFT, no published formal version)
    const definition: AgentDefinition = {
      agentId,
      name: input.name.trim() || preset.defaultName,
      description: input.responsibility.trim() || preset.defaultResponsibility,
      responsibilitySummary: input.responsibility.trim() || preset.defaultResponsibility,
      // V1.1：roleInstruction 来自能力模板独立默认值（≠ responsibilitySummary 业务职责摘要）。
      // A02 创建时不收集 Role Instruction，创建后在 A03「高级角色说明」编辑（Commit 06）。
      roleInstruction: preset.defaultRoleInstruction,
      agentKind: 'MANAGED',
      // 用户经由能力模板创建的智能体 = 组织自定义 (CUSTOM)
      origin: 'CUSTOM',
      owner: input.owner.trim() || preset.defaultOwner,
      sourcePresetId: preset.presetId,
      supportedTaskTemplates: preset.supportedTaskTemplates.map((binding) => ({ ...binding })),
      allowedContextSources: [...preset.allowedContextSources],
      contextBindings: cloneContextBindings(contextBindings),
      capabilityPreset: preset.capabilityPreset,
      capabilityDesc: preset.capabilityPresetDesc,
      modelPolicyId: preset.modelPolicyId,
      modelPolicyName: preset.modelPolicyName,
      maxAutonomy: preset.defaultMaxAutonomy,
      maxAutonomyDesc: preset.autonomyDesc,
      runtimeTarget: preset.runtimeTarget,
      status: 'DRAFT',
      currentPublishedVersion: undefined, // Unreleased
      currentDraftId: draftId,
      createdAt: nowStr,
      createdBy: input.owner.trim() || preset.defaultOwner,
      updatedAt: nowStr
    };

    // 2. Initial Draft
    const initialDiffs: AgentBusinessDiff[] = [
      {
        field: '初始草稿',
        changeText: `基于能力模板「${preset.presetName}」生成未发布草稿`,
        tag: 'NEW DRAFT',
        isNew: true
      },
      {
        field: '工作范围',
        changeText: describeContextBindings(contextBindings),
        tag: 'SCOPE'
      },
      {
        field: '能力预设',
        changeText: `${preset.capabilityPreset} (${preset.capabilityPresetDesc})`,
        tag: 'CAPABILITY'
      },
      {
        field: '目标引擎',
        changeText: preset.runtimeEngineLabel,
        tag: 'RUNTIME'
      }
    ];

    const draft: AgentDraft = {
      draftId,
      agentId,
      baseVersion: undefined, // First draft without base formal version
      name: definition.name,
      description: definition.description,
      responsibilitySummary: definition.responsibilitySummary,
      roleInstruction: definition.roleInstruction,
      origin: definition.origin,
      // AgentDraft 是完整可编辑配置：持有 owner（Agent 配置的一部分，≠ updatedBy）
      owner: definition.owner,
      supportedTaskTemplates: definition.supportedTaskTemplates.map((binding) => ({ ...binding })),
      allowedContextSources: [...definition.allowedContextSources],
      // 草稿持有独立副本（深 clone），与 Definition 不共享引用
      contextBindings: cloneContextBindings(contextBindings),
      capabilityPreset: definition.capabilityPreset,
      capabilityDesc: definition.capabilityDesc,
      modelPolicyId: definition.modelPolicyId,
      modelPolicyName: definition.modelPolicyName,
      maxAutonomy: definition.maxAutonomy,
      maxAutonomyDesc: definition.maxAutonomyDesc,
      runtimeTarget: definition.runtimeTarget,
      businessDiffs: initialDiffs,
      updatedAt: nowStr,
      updatedBy: definition.owner
    };

    // 3. Runtime Binding (Unbound / Draft Projection)
    const runtimeBinding: AgentRuntimeBinding = {
      bindingId: `bind_${agentId}`,
      agentId,
      runtimeTarget: preset.runtimeTarget,
      runtimeStatus: 'DRAFT_PROJECTION',
      syncRevision: 'r0-draft',
      lastSyncedAt: undefined
    };

    // Persist in repository
    agentRepository.saveDefinition(definition);
    agentRepository.saveDraft(draft);
    agentRepository.saveRuntimeBinding(runtimeBinding);

    return { definition, draft, runtimeBinding };
  }

  /**
   * 计算期望的下一版本号（只依据当前正式版本推导，绝不写死具体版本号）：
   * 无正式版本 → v1.0；v1.4 → v1.5
   */
  public getExpectedNextVersion(agentId: string): string | null {
    const def = agentRepository.getDefinition(agentId);
    if (!def) return null;
    return def.currentPublishedVersion ? this.incrementMinorVersion(def.currentPublishedVersion) : 'v1.0';
  }

  /**
   * Release Validation：对当前草稿执行五道发布门检查（PURE，无正式状态副作用）。
   * 允许：读取 Draft / compile transient RuntimeProjection / validate Runtime 依赖；
   * 禁止：activate Runtime / create AgentVersion / save RuntimeBinding /
   * update AgentDefinition / remove Draft。
   * 没有未发布草稿时全部保持 PENDING（无可发布内容）。
   */
  public async evaluateReleaseValidation(agentId: string): Promise<AgentReleaseValidation> {
    const def = agentRepository.getDefinition(agentId);
    const draft = agentRepository.getDraftByAgentId(agentId);

    if (!def || !draft) {
      return {
        agentId,
        draftId: draft?.draftId ?? '',
        configCheck: 'PENDING',
        runtimeCompile: 'PENDING',
        runtimeDependencies: 'PENDING',
        testRun: 'PENDING',
        qualityEvaluation: 'PENDING'
      };
    }

    const adapter = getRuntimeAdapter(draft.runtimeTarget);

    // 1) 配置检查：最终 Draft 状态的完整发布配置校验（TASK 7–15，Final-State 而非 Patch 校验）
    const configPassed = validateDraftConfigurationForRelease(def, draft);

    // 2) 运行准备（runtimeCompile）：Adapter.compile 抛错即 FAILED；
    //    Projection 只作为 validation transient artifact，不保存 RuntimeBinding（TASK 16）
    let projection = null;
    let runtimeCompile: AgentReleaseValidation['runtimeCompile'] = 'FAILED';
    try {
      projection = await adapter.compile(draft);
      runtimeCompile = 'PASSED';
    } catch {
      runtimeCompile = 'FAILED';
    }

    // 3) 运行依赖检查（runtimeDependencies）：Adapter.validate 结构校验。
    //    保持真实：WeKnora 当前仍是 MOCK_RUNTIME，不伪装 PRODUCTION（TASK 17）
    let runtimeDependencies: AgentReleaseValidation['runtimeDependencies'] = 'FAILED';
    if (projection) {
      try {
        const result = await adapter.validate(projection);
        runtimeDependencies = result.passed ? 'PASSED' : 'FAILED';
      } catch {
        runtimeDependencies = 'FAILED';
      }
    }

    // 4) 测试运行（testRun）——V1.1 原型诚实语义（TASK 18）：
    //    当前没有正式 Test Harness API，本门是「基础运行检查 / Smoke Readiness」：
    //    projection 存在 + 至少一项启用任务 + 运行依赖检查已通过。
    //    不宣称真实大规模 Eval Suite 已执行；未来真实 Test Harness 只替换本门内部实现，
    //    不改变 Release Gate Contract。
    const testRun: AgentReleaseValidation['testRun'] =
      projection !== null &&
      draft.supportedTaskTemplates.some((t) => t.enabled) &&
      runtimeDependencies === 'PASSED'
        ? 'PASSED'
        : 'FAILED';

    // 5) 质量评估（qualityEvaluation）——V1.1 原型诚实语义（TASK 19）：
    //    当前没有真实 Evaluation Backend，本门是「Policy / Configuration Baseline Evaluation」：
    //    配置检查通过 + roleInstruction 非空 + maxAutonomy 合法 + 运行依赖检查通过。
    //    不产出虚构百分比；未来真实 Eval Backend 只替换本门内部实现。
    const preset = def.sourcePresetId ? getPresetById(def.sourcePresetId) : undefined;
    const autonomyValid = preset
      ? (TEMPLATE_AUTONOMY_OPTIONS[preset.presetId] ?? []).some((o) => o.maxAutonomy === draft.maxAutonomy)
      : false;
    const qualityEvaluation: AgentReleaseValidation['qualityEvaluation'] =
      configPassed &&
      Boolean(draft.roleInstruction.trim()) &&
      autonomyValid &&
      runtimeDependencies === 'PASSED'
        ? 'PASSED'
        : 'FAILED';

    return {
      agentId,
      draftId: draft.draftId,
      configCheck: configPassed ? 'PASSED' : 'FAILED',
      runtimeCompile,
      runtimeDependencies,
      testRun,
      qualityEvaluation
    };
  }

  /**
   * P0: 发布草稿为不可变版本。
   *
   * Commit 07 §34 —— Release Gate 是 Domain Invariant，UI Guard ≠ 发布授权凭证：
   * publishDraft() 自行重新执行 Release Gate（不接收 validation / canPublish /
   * passedGateCount 之类的「UI 自证」参数），任何调用路径都不能绕过。
   *
   * 最终顺序（§35，顺序冻结）：
   *   Read Definition → Read Draft → Evaluate Release Gate → Assert draftId 一致
   *   → Assert Five Gates PASSED → Create Candidate Definition/Snapshot
   *   → Compile Runtime Projection → Validate Runtime Dependencies → Activate Runtime
   *   → Create AgentVersion → Save/Switch Runtime Binding → Update currentPublishedVersion
   *   → Remove Current Draft
   * 任何失败：旧正式版本保持不变、当前 Draft 保留、RuntimeBinding 不切换、
   * AgentVersion 不增加、Registry 不假更新。
   */
  public async publishDraft(params: {
    agentId: string;
    publishedBy: string;
    releaseNotes?: string;
  }): Promise<{ version: AgentVersion; definition: AgentDefinition; runtimeBinding: AgentRuntimeBinding }> {
    const def = agentRepository.getDefinition(params.agentId);
    if (!def) {
      throw new Error(`Agent definition not found for id: ${params.agentId}`);
    }

    const draft = agentRepository.getDraftByAgentId(params.agentId);
    if (!draft) {
      throw new Error('当前没有未发布草稿，无需发布');
    }

    // ── Step 0: Release Gate（Domain Invariant，每次 publish 重新计算） ──
    const releaseValidation = await this.evaluateReleaseValidation(params.agentId);
    // TASK 29：防止 Gate 评估的是旧 Draft 而发布的是另一个 Draft
    if (releaseValidation.draftId !== draft.draftId) {
      throw new ReleaseDraftChangedError(draft.draftId, releaseValidation.draftId);
    }
    // TASK 4：Gate 判断必须发生在 Candidate Version / Runtime Activation / Repository Write 之前
    if (!isReleaseGatePassed(releaseValidation)) {
      throw new ReleaseGateNotPassedError(releaseValidation, getFailedReleaseGates(releaseValidation));
    }

    // 期望下一版本号：无正式版本 → v1.0；否则次版本号 +1
    const targetVersionNumber = def.currentPublishedVersion
      ? this.incrementMinorVersion(def.currentPublishedVersion)
      : 'v1.0';

    // ── Step 1: 候选版本（尚未落库，仅为快照） ──
    // V1.1：owner / roleInstruction 必须来自 Draft，否则用户编辑不会进入新正式版本
    const candidateDef: AgentDefinition = {
      ...def,
      name: draft.name,
      description: draft.description,
      responsibilitySummary: draft.responsibilitySummary,
      roleInstruction: draft.roleInstruction,
      owner: draft.owner,
      capabilityPreset: draft.capabilityPreset,
      capabilityDesc: draft.capabilityDesc || def.capabilityDesc,
      supportedTaskTemplates: draft.supportedTaskTemplates.map((binding) => ({ ...binding })),
      allowedContextSources: [...draft.allowedContextSources],
      contextBindings: cloneContextBindings(draft.contextBindings),
      modelPolicyId: draft.modelPolicyId,
      modelPolicyName: draft.modelPolicyName || def.modelPolicyName,
      maxAutonomy: draft.maxAutonomy,
      maxAutonomyDesc: draft.maxAutonomyDesc || def.maxAutonomyDesc,
      runtimeTarget: draft.runtimeTarget,
      status: 'ACTIVE',
      currentPublishedVersion: targetVersionNumber, // 仅存在于候选定义中，不进入 Snapshot
      currentDraftId: undefined,
      updatedAt: '刚刚'
    };

    // ── Step 2: Runtime Validation（编译 + 依赖校验） ──
    const adapter = getRuntimeAdapter(candidateDef.runtimeTarget);
    let projection;
    try {
      projection = await adapter.compile(draft);
      const validation = await adapter.validate(projection);
      if (!validation.passed) {
        throw new AgentPublishError(
          `Runtime 校验未通过：${validation.checks.filter((c) => c.status === 'FAILED').map((c) => c.name).join('、')}`,
          'VALIDATION'
        );
      }
    } catch (error) {
      if (error instanceof AgentPublishError) throw error;
      throw new AgentPublishError('Runtime 编译失败，发布中止', 'VALIDATION');
    }

    // ── Step 3: Runtime Activation（激活成功才允许切换正式版本） ──
    let runtimeBinding: AgentRuntimeBinding;
    try {
      runtimeBinding = await adapter.activate(projection);
    } catch {
      throw new AgentPublishError('Runtime 激活失败，发布中止', 'ACTIVATION');
    }

    // ── Step 4: 切换正式版本（以上全部成功后才写仓库） ──
    const version: AgentVersion = {
      versionId: `ver_${params.agentId}_${Date.now().toString(36)}`,
      versionNumber: targetVersionNumber,
      agentId: params.agentId,
      // V1.1：AgentVersion.snapshot 只能是 canonical builder 产生的干净 Snapshot
      // （candidateDef 继续用于更新当前 AgentDefinition，但不整体进入快照）
      snapshot: buildAgentDefinitionSnapshot(candidateDef),
      publishedAt: '刚刚',
      publishedBy: params.publishedBy,
      releaseNotes: params.releaseNotes || `正式发布版本 ${targetVersionNumber}`,
      runtimeRevision: runtimeBinding.syncRevision ?? targetVersionNumber
    };

    agentRepository.saveDefinition(candidateDef);
    agentRepository.addVersion(version);
    agentRepository.saveRuntimeBinding(runtimeBinding);
    agentRepository.removeDraft(draft.draftId);

    return { version, definition: candidateDef, runtimeBinding };
  }

  /**
   * PURE / NON-PERSISTING（Commit 06.3）：从 currentPublishedVersion 对应
   * AgentVersion.snapshot 构造 Transient Draft Candidate。
   *
   * Candidate ≠ Persisted Draft：
   * - 不调用 saveDraft()
   * - 不修改 definition.currentDraftId
   * - 不产生任何 Repository 写操作
   *
   * Published Snapshot 仍是正式配置 SoT——Policy / Context Validation 的
   * 基线一律先由本 Candidate 从 Snapshot 构造，不退化为 mutable AgentDefinition。
   */
  private buildDraftCandidateFromPublishedVersion(agentId: string, editorName: string): AgentDraft {
    const def = agentRepository.getDefinition(agentId);
    if (!def) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const versionNumber = def.currentPublishedVersion;
    if (!versionNumber) {
      throw new AgentPublishedVersionNotFoundError(agentId, '(none)');
    }
    const version = agentRepository.getVersion(agentId, versionNumber);
    if (!version) {
      throw new AgentPublishedVersionNotFoundError(agentId, versionNumber);
    }

    // Snapshot → New AgentDraft（深拷贝，Draft 与历史版本互不影响）
    const snap = buildAgentDefinitionSnapshot(version.snapshot);
    const draftId = `draft_${agentId}_${Date.now().toString(36)}`;
    return {
      draftId,
      agentId,
      baseVersion: versionNumber,
      origin: snap.origin,
      name: snap.name,
      description: snap.description,
      responsibilitySummary: snap.responsibilitySummary,
      roleInstruction: snap.roleInstruction,
      owner: snap.owner,
      supportedTaskTemplates: snap.supportedTaskTemplates.map((binding) => ({ ...binding })),
      allowedContextSources: [...snap.allowedContextSources],
      contextBindings: cloneContextBindings(snap.contextBindings),
      capabilityPreset: snap.capabilityPreset,
      capabilityDesc: snap.capabilityDesc,
      modelPolicyId: snap.modelPolicyId,
      modelPolicyName: snap.modelPolicyName,
      maxAutonomy: snap.maxAutonomy,
      maxAutonomyDesc: snap.maxAutonomyDesc,
      runtimeTarget: snap.runtimeTarget,
      businessDiffs: [],
      updatedAt: '刚刚',
      updatedBy: editorName
    };
  }

  /**
   * P0: Create new edit draft from an existing published version（显式创建编辑草稿的公开业务操作）。
   * V1.1：以 currentPublishedVersion 对应 AgentVersion 的不可变 Snapshot 为正式配置来源，
   * 不再把 mutable AgentDefinition 当作发布版本配置快照使用。
   * Commit 06.3：实现 = Transient Candidate + 持久化（save Draft → 写 currentDraftId → save Definition）。
   */
  public createDraftFromPublishedVersion(agentId: string, editorName: string): AgentDraft {
    const candidate = this.buildDraftCandidateFromPublishedVersion(agentId, editorName);
    const def = agentRepository.getDefinition(agentId);
    if (!def) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    def.currentDraftId = candidate.draftId;
    agentRepository.saveDefinition(def);
    agentRepository.saveDraft(candidate);

    return candidate;
  }

  /**
   * V1.1 §28 Draft Update Contract：唯一统一的 Draft 编辑入口。
   * 所有 A03 Section 写入同一个 AgentDraft，禁止出现第二套保存逻辑。
   *
   * Commit 06.3 Command Semantics —— Validation Failure Must Be Side-effect Free：
   * 任何校验失败（Edit Policy / Required Field / Context Binding / Task /
   * Capability / Model / Autonomy / Scope）都不得创建 Draft、写 currentDraftId、
   * 修改 Definition / Version / RuntimeBinding。
   *
   * A. 读取 AgentDefinition，不存在 → explicit error
   * B. 读取 Existing Draft
   * C. 无 Existing Draft：从 Published Snapshot 构造 Transient Draft Candidate（不保存）
   * D. baseDraft = existingDraft ?? transientDraftCandidate（基线 = Published Snapshot SoT）
   * E. 全部校验：Agent Edit Policy → Required Field → Context Binding Validation
   * F. 构造 updatedDraft（验证完成前 Repository 不发生任何写操作）
   * G. 全部验证成功后才持久化：
   *    原无 Draft → save Draft → definition.currentDraftId = draftId → save Definition；
   *    原有 Draft → 只更新 Draft
   * H. return updatedDraft
   *
   * No-op 语义（UI 被绕过时的 Domain 安全网）：
   * - Published Agent + 无 Draft + 空 Patch → AgentDraftValidationError，不创建空 Draft
   * - 已有 Draft + 空 Patch → 直接返回 existingDraft，不改 updatedAt / updatedBy
   */
  public updateAgentDraft(
    agentId: string,
    patch: UpdateAgentDraftPatch,
    updatedBy?: string
  ): AgentDraft {
    const def = agentRepository.getDefinition(agentId);
    if (!def) {
      throw new Error(`Agent definition not found for id: ${agentId}`);
    }

    const existingDraft = agentRepository.getDraftByAgentId(agentId);
    if (!existingDraft && !def.currentPublishedVersion) {
      throw new AgentDraftValidationError(
        `智能体 ${agentId} 没有可编辑草稿，也没有可开新草稿的正式版本`
      );
    }

    // No-op is No-op：空 Patch 不制造「假编辑」。
    // 已有 Draft → 原样返回（updatedAt / updatedBy 不变）；无 Draft → 明确失败，不创建空 Draft。
    if (Object.keys(patch).length === 0) {
      if (existingDraft) {
        return existingDraft;
      }
      throw new AgentDraftValidationError('当前没有草稿，且未提供任何配置修改');
    }

    // C/D：无 Existing Draft 时构造 Transient Candidate（PURE，不落库），
    // 后续 Policy / Context Validation 基线一律来自 Published Snapshot。
    const baseDraft =
      existingDraft ??
      this.buildDraftCandidateFromPublishedVersion(agentId, updatedBy ?? UNKNOWN_EDITOR);

    // Agent Edit Policy：Built-in 锁 / 模板受控目录 / canonical normalization（FIX 1–8/10）
    const normalizedPatch = validateAndNormalizeAgentDraftPatch(def, baseDraft, patch);

    // 必填文本字段：显式传入空字符串 → 明确失败（禁止 trim() || oldValue 静默吞掉非法编辑）
    const requiredTextFields: Array<
      ['name' | 'responsibilitySummary' | 'roleInstruction' | 'owner' | 'modelPolicyId', string]
    > = [
      ['name', '智能体名称'],
      ['responsibilitySummary', '主要职责'],
      ['roleInstruction', '角色行为说明'],
      ['owner', 'Owner'],
      ['modelPolicyId', '模型策略']
    ];
    for (const [field, label] of requiredTextFields) {
      const value = normalizedPatch[field];
      if (value !== undefined && value.trim() === '') {
        throw new AgentDraftValidationError(`${label}不能为空`);
      }
    }

    // Context Domain Validation（与创建路径同一套规则，FIX 9 执行顺序）：
    // effectiveAllowed = patch.allowedContextSources ?? baseDraft.allowedContextSources；
    // 校验 patch.contextBindings（未传则以现有 draft.contextBindings 复核），
    // 因此「缩小 allowedContextSources 导致既有 Binding 非法」会显式失败，不留 Domain 不一致。
    const effectiveAllowed =
      normalizedPatch.allowedContextSources ?? baseDraft.allowedContextSources;
    const bindingsToCheck = normalizedPatch.contextBindings ?? baseDraft.contextBindings;
    const normalizedBindings = validateAndNormalizeContextBindingsAgainst(bindingsToCheck, effectiveAllowed);

    // F：构造 updatedDraft —— 到这里为止 Repository 未发生任何写操作
    const updatedDraft: AgentDraft = {
      ...baseDraft,
      ...(normalizedPatch.name !== undefined ? { name: normalizedPatch.name.trim() } : {}),
      ...(normalizedPatch.description !== undefined ? { description: normalizedPatch.description } : {}),
      ...(normalizedPatch.responsibilitySummary !== undefined
        ? { responsibilitySummary: normalizedPatch.responsibilitySummary.trim() }
        : {}),
      ...(normalizedPatch.roleInstruction !== undefined
        ? { roleInstruction: normalizedPatch.roleInstruction.trim() }
        : {}),
      ...(normalizedPatch.owner !== undefined ? { owner: normalizedPatch.owner.trim() } : {}),
      ...(normalizedPatch.capabilityPreset !== undefined
        ? { capabilityPreset: normalizedPatch.capabilityPreset }
        : {}),
      ...(normalizedPatch.capabilityDesc !== undefined ? { capabilityDesc: normalizedPatch.capabilityDesc } : {}),
      ...(normalizedPatch.modelPolicyId !== undefined
        ? { modelPolicyId: normalizedPatch.modelPolicyId.trim() }
        : {}),
      ...(normalizedPatch.modelPolicyName !== undefined
        ? { modelPolicyName: normalizedPatch.modelPolicyName }
        : {}),
      ...(normalizedPatch.maxAutonomy !== undefined ? { maxAutonomy: normalizedPatch.maxAutonomy } : {}),
      ...(normalizedPatch.maxAutonomyDesc !== undefined
        ? { maxAutonomyDesc: normalizedPatch.maxAutonomyDesc }
        : {}),
      ...(normalizedPatch.supportedTaskTemplates !== undefined
        ? { supportedTaskTemplates: normalizedPatch.supportedTaskTemplates.map((binding) => ({ ...binding })) }
        : {}),
      ...(normalizedPatch.allowedContextSources !== undefined
        ? { allowedContextSources: [...normalizedPatch.allowedContextSources] }
        : {}),
      // 归一化后的 Binding（去重 / ALL_ALLOWED 去 resourceIds），独立新数组
      contextBindings: normalizedBindings,
      updatedAt: '刚刚',
      updatedBy: updatedBy ?? baseDraft.updatedBy
    };

    // G：全部验证成功后才持久化（内存原型顺序：save Draft → 写指针 → save Definition）
    if (!existingDraft) {
      def.currentDraftId = updatedDraft.draftId;
      agentRepository.saveDefinition(def);
    }
    agentRepository.saveDraft(updatedDraft);
    return updatedDraft;
  }

  private incrementMinorVersion(version: string): string {
    const match = version.match(/^v(\d+)\.(\d+)$/);
    if (match) {
      const major = match[1];
      const minor = parseInt(match[2], 10) + 1;
      return `v${major}.${minor}`;
    }
    return `${version}.1`;
  }
}

export const agentService = new AgentService();
