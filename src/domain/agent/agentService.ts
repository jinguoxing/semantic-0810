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
  AgentReleaseValidation
} from './agentTypes';
import { getPresetById, MANAGED_AGENT_PRESETS } from './agentPresets';
import { agentRepository } from './agentRepository';
import { getRuntimeAdapter } from './runtime/adapters';

export interface CreateDraftFromPresetInput {
  presetId: string;
  name: string;
  responsibility: string;
  owner: string;
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

class AgentService {
  /**
   * P0: Create new unreleased Agent Definition + Initial Draft from an official preset
   */
  public createDraftFromPreset(input: CreateDraftFromPresetInput): {
    definition: AgentDefinition;
    draft: AgentDraft;
    runtimeBinding: AgentRuntimeBinding;
  } {
    const preset = getPresetById(input.presetId) || MANAGED_AGENT_PRESETS.ENTERPRISE_KNOWLEDGE;
    const timestamp = Date.now().toString(36);
    const agentId = `agent_${timestamp}`;
    const draftId = `draft_${agentId}_v1_0`;
    const nowStr = '刚刚';

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
        changeText: `基于受管预设「${preset.presetName}」生成未发布草稿`,
        tag: 'NEW DRAFT',
        isNew: true
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
