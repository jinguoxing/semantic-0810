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
  buildAgentDefinitionSnapshot
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
   * Release Validation：对当前草稿执行五道发布门检查。
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

    // 1) 配置完整性：名称 / 责任描述 / 至少一项启用的任务模板 / 模型策略
    const configPassed =
      Boolean(draft.name.trim()) &&
      Boolean(draft.responsibilitySummary.trim()) &&
      draft.supportedTaskTemplates.some((t) => t.enabled) &&
      Boolean(draft.modelPolicyId);

    // 2) Runtime 编译：Adapter.compile 抛错即 FAILED
    let projection = null;
    let runtimeCompile: AgentReleaseValidation['runtimeCompile'] = 'FAILED';
    try {
      projection = await adapter.compile(draft);
      runtimeCompile = 'PASSED';
    } catch {
      runtimeCompile = 'FAILED';
    }

    // 3) Runtime 依赖：Adapter.validate 结构校验
    let runtimeDependencies: AgentReleaseValidation['runtimeDependencies'] = 'FAILED';
    if (projection) {
      try {
        const result = await adapter.validate(projection);
        runtimeDependencies = result.passed ? 'PASSED' : 'FAILED';
      } catch {
        runtimeDependencies = 'FAILED';
      }
    }

    // 4) 测试运行：沙盒用例可在编译产物上执行（原型环境以结构可执行性为准）
    const testRun: AgentReleaseValidation['testRun'] =
      projection && draft.supportedTaskTemplates.some((t) => t.enabled) ? 'PASSED' : 'FAILED';

    // 5) 质量评估：责任边界与自治等级声明确认（原型基线）
    const qualityEvaluation: AgentReleaseValidation['qualityEvaluation'] =
      configPassed && Boolean(draft.maxAutonomyDesc) ? 'PASSED' : 'FAILED';

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
   * 失败安全规则（顺序不可颠倒）：
   *   Create candidate AgentVersion → Runtime Validation → Runtime Activation → Switch Published Version
   * 任何一步失败：正式版本保持不变（旧版本继续 ACTIVE），草稿保留。
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
   * P0: Create new edit draft from an existing published version.
   * V1.1：以 currentPublishedVersion 对应 AgentVersion 的不可变 Snapshot 为正式配置来源，
   * 不再把 mutable AgentDefinition 当作发布版本配置快照使用。
   */
  public createDraftFromPublishedVersion(agentId: string, editorName: string): AgentDraft {
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
    const draft: AgentDraft = {
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

    def.currentDraftId = draftId;
    agentRepository.saveDefinition(def);
    agentRepository.saveDraft(draft);

    return draft;
  }

  /**
   * V1.1 §28 Draft Update Contract：唯一统一的 Draft 编辑入口。
   * 所有 A03 Section 写入同一个 AgentDraft，禁止出现第二套保存逻辑。
   *
   * A. 找 AgentDefinition，不存在 → explicit error
   * B. Agent Edit Policy（FIX 1–8/10）：治理边界 + canonical normalization，
   *    在创建/写入 Draft 之前执行——校验失败不留任何 Draft 副作用
   * C. 必填字段空字符串 → AgentDraftValidationError，不静默吞掉
   * D. 无 Draft 且已有 Published Version → createDraftFromPublishedVersion()
   *    （无真实 editor → 诚实标注「未记录」，不把 Owner 当 Editor）
   * E. Context Domain Validation（FIX 9：Policy → effectiveAllowed → Binding 校验）
   * F. task / context / model 数组全部深拷贝，绝不保存调用方引用
   * G. updatedAt 更新；updatedBy 仅调用方显式提供时更新（Owner 修改不自动当成编辑人）
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

    // Agent Edit Policy：Built-in 锁 / 模板受控目录 / canonical normalization（FIX 1–8/10）
    const normalizedPatch = validateAndNormalizeAgentDraftPatch(def, existingDraft, patch);

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

    // 全部校验通过后才创建新草稿：失败路径不产生 Draft 副作用（FIX 17）
    const draft =
      existingDraft ??
      this.createDraftFromPublishedVersion(agentId, updatedBy ?? UNKNOWN_EDITOR);

    // Context Domain Validation（与创建路径同一套规则，FIX 9 执行顺序）：
    // effectiveAllowed = patch.allowedContextSources ?? draft.allowedContextSources；
    // 校验 patch.contextBindings（未传则以现有 draft.contextBindings 复核），
    // 因此「缩小 allowedContextSources 导致既有 Binding 非法」会显式失败，不留 Domain 不一致。
    const effectiveAllowed =
      normalizedPatch.allowedContextSources ?? draft.allowedContextSources;
    const bindingsToCheck = normalizedPatch.contextBindings ?? draft.contextBindings;
    const normalizedBindings = validateAndNormalizeContextBindingsAgainst(bindingsToCheck, effectiveAllowed);

    const updatedDraft: AgentDraft = {
      ...draft,
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
      updatedBy: updatedBy ?? draft.updatedBy
    };

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
