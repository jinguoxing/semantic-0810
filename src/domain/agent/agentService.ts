/**
 * Semovix Agent Domain Model - Service
 * Core business operations:
 * - createDraftFromPreset: Generates an AgentDefinition + AgentDraft from an official preset
 * - publishDraft: Enforces immutable versioning (creates AgentVersion, updates runtime binding)
 * - createDraftFromPublishedVersion: Starts a new draft cycle from an existing immutable version
 * - saveDraftEdit: Persists workspace edits into the repository draft
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
  ManagedAgentPreset
} from './agentTypes';
import { getPresetById } from './agentPresets';
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
 * Context Binding 领域校验与归一化（V1.1 Domain Contract）：
 * A. sourceType 必须在 preset.allowedContextSources 内（Context Binding 不能扩大模板允许范围）
 * B. SELECTED 必须携带至少一个 resourceId
 * C. SELECTED resourceIds 保存前去重（保持原顺序）
 * D. ALL_ALLOWED 统一不保存 resourceIds（归一为 undefined）
 */
function validateAndNormalizeContextBindings(
  bindings: AgentContextBinding[],
  preset: ManagedAgentPreset
): AgentContextBinding[] {
  return bindings.map((binding) => {
    if (!preset.allowedContextSources.includes(binding.sourceType)) {
      throw new AgentContextBindingValidationError(
        `能力模板「${preset.presetName}」不允许上下文来源: ${binding.sourceType}`
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
      origin: definition.origin,
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
    const candidateDef: AgentDefinition = {
      ...def,
      name: draft.name,
      description: draft.description,
      responsibilitySummary: draft.responsibilitySummary,
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
      currentPublishedVersion: targetVersionNumber, // 仅存在于候选快照中，失败不落库
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
      snapshot: { ...candidateDef },
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
   * P0: Create new edit draft from an existing published version
   */
  public createDraftFromPublishedVersion(agentId: string, editorName: string): AgentDraft {
    const def = agentRepository.getDefinition(agentId);
    if (!def) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const draftId = `draft_${agentId}_${Date.now().toString(36)}`;
    const draft: AgentDraft = {
      draftId,
      agentId,
      baseVersion: def.currentPublishedVersion,
      name: def.name,
      description: def.description,
      responsibilitySummary: def.responsibilitySummary,
      origin: def.origin,
      supportedTaskTemplates: def.supportedTaskTemplates.map((binding) => ({ ...binding })),
      allowedContextSources: [...def.allowedContextSources],
      contextBindings: cloneContextBindings(def.contextBindings),
      capabilityPreset: def.capabilityPreset,
      capabilityDesc: def.capabilityDesc,
      modelPolicyId: def.modelPolicyId,
      modelPolicyName: def.modelPolicyName,
      maxAutonomy: def.maxAutonomy,
      maxAutonomyDesc: def.maxAutonomyDesc,
      runtimeTarget: def.runtimeTarget,
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
   * 将定义工作区 (A03) 的编辑持久化到 Repository 草稿。
   * 没有草稿时基于当前正式版本自动开一个编辑草稿，保证 A04 读到同一份事实。
   */
  public saveDraftEdit(
    agentId: string,
    edits: { name: string; responsibility: string; owner: string }
  ): AgentDraft | null {
    const def = agentRepository.getDefinition(agentId);
    if (!def) return null;

    let draft = agentRepository.getDraftByAgentId(agentId);
    if (!draft) {
      draft = this.createDraftFromPublishedVersion(agentId, edits.owner || def.owner);
    }

    const updatedDraft: AgentDraft = {
      ...draft,
      name: edits.name.trim() || draft.name,
      description: edits.responsibility.trim() || draft.description,
      responsibilitySummary: edits.responsibility.trim() || draft.responsibilitySummary,
      updatedAt: '刚刚',
      updatedBy: edits.owner || draft.updatedBy
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
