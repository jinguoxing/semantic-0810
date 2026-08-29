/**
 * Semovix Agent Domain Model - Selectors & View Projections
 * Provides selectors for UI layers (Registry, Definition Workspace, Publish Workspace)
 */

import {
  AgentDefinition,
  AgentDraft,
  AgentVersion,
  AgentRuntimeBinding,
  AgentBusinessDiff,
  AgentOrigin,
  AgentContextBinding,
  AgentContextSource,
  MaxAutonomy,
  RuntimeTarget,
  RuntimeIntegrationMode,
  RuntimeSyncStatus,
  RuntimeHealthStatus,
  TaskTemplateBinding
} from './agentTypes';
import { agentRepository } from './agentRepository';

/**
 * A03 可编辑配置事实（V1.1 §28）：AgentDraft / AgentDefinitionSnapshot / AgentDefinition
 * 在这些字段上结构一致，Workspace 一律通过本投影读取，不直接依赖 UI Fixture。
 */
export interface AgentEditableConfig {
  name: string;
  description: string;
  responsibilitySummary: string;
  roleInstruction: string;
  owner: string;
  supportedTaskTemplates: TaskTemplateBinding[];
  allowedContextSources: AgentContextSource[];
  contextBindings: AgentContextBinding[];
  capabilityPreset: string;
  capabilityDesc?: string;
  modelPolicyId: string;
  modelPolicyName?: string;
  maxAutonomy: MaxAutonomy;
  maxAutonomyDesc?: string;
}

/**
 * A03 Definition Workspace 的唯一 View Projection（V1.1 §20）：
 * - 用户类型：definition.origin（内置 / 自定义）
 * - 正式版本：definition.currentPublishedVersion
 * - 草稿状态：draft 是否存在
 * - 可编辑配置：有 Draft 用 Draft；否则当前 Published Snapshot；否则 Definition 基线
 * - Runtime 字段仅供高级诊断（showRuntimeDiagnostics），普通 UI 不展示
 */
export interface AgentDefinitionWorkspaceState {
  agentId: string;
  origin: AgentOrigin;
  sourcePresetId?: string;
  /** 内部投影：仅高级诊断使用 */
  runtimeTarget: RuntimeTarget;
  formalVersion: string | null;
  hasDraft: boolean;
  draftId?: string;
  draftUpdatedBy?: string;
  draftUpdatedAt?: string;
  businessDiffs: AgentBusinessDiff[];
  editable: AgentEditableConfig;
  editableSource: 'DRAFT' | 'PUBLISHED_SNAPSHOT' | 'DEFINITION';
  lastReleaseTime: string | null;
}

export interface AgentDisplayState {
  agentId: string;
  name: string;
  responsibility: string;
  owner: string;
  agentType: '系统智能体' | '受管智能体';
  category: 'SYSTEM' | 'MANAGED';
  /** 用户可见分类：内置 vs 组织自定义（V1.1 起以此为准，agentKind 仅内部兼容） */
  origin: AgentOrigin;
  formalVersion: string | null; // null if unreleased
  hasDraft: boolean;
  draftId?: string;
  status: 'ACTIVE' | 'DRAFT' | 'DISABLED';
  runtimeEngine: 'Semovix' | 'Semovix Native' | 'WeKnora';
  /**
   * Runtime 三维度诊断投影（Commit 08 TASK 20）：仅供技术诊断 / A01 产品状态推导，
   * 普通 UI 不直接展示原始 enum。无 Binding（未发布）时全部为 null。
   */
  activeBindingVersion: string | null;
  integrationMode: RuntimeIntegrationMode | null;
  syncStatus: RuntimeSyncStatus | null;
  healthStatus: RuntimeHealthStatus | null;
  runtimeConfigRevision: string | null;
  lastReleaseTime: string | null;
  lastSyncTime: string | null;
  businessDiffs: AgentBusinessDiff[];
  isCapabilityUpgraded?: boolean;
}

export const agentSelectors = {
  /**
   * Get the primary display state for an agent
   */
  getDisplayState(agentId: string): AgentDisplayState | null {
    const def = agentRepository.getDefinition(agentId);
    if (!def) return null;

    const draft = agentRepository.getDraftByAgentId(agentId);
    // Commit 08 TASK 20：读 Active Binding（未发布 Agent → undefined → 三维度 null）
    const binding: AgentRuntimeBinding | undefined = agentRepository.getActiveRuntimeBinding(agentId);
    const versions = agentRepository.getVersions(agentId);
    const latestVersion = versions[0];

    const hasDraft = Boolean(draft);
    const formalVersion = def.currentPublishedVersion || null;

    const runtimeEngine: 'Semovix' | 'Semovix Native' | 'WeKnora' =
      def.runtimeTarget === 'WEKNORA'
        ? 'WeKnora'
        : def.agentKind === 'SYSTEM'
        ? 'Semovix'
        : 'Semovix Native';

    return {
      agentId: def.agentId,
      name: draft ? draft.name : def.name,
      responsibility: draft ? draft.responsibilitySummary : def.responsibilitySummary,
      // V1.1 修复：Owner 修改保存在 Draft 中，有 Draft 时必须优先读 draft.owner，
      // 否则 UI 会在 selector 层"丢失"未发布的 Owner 修改
      owner: draft?.owner ?? def.owner,
      agentType: def.agentKind === 'SYSTEM' ? '系统智能体' : '受管智能体',
      category: def.agentKind,
      origin: def.origin,
      formalVersion,
      hasDraft,
      draftId: draft?.draftId,
      status: def.status,
      runtimeEngine,
      activeBindingVersion: binding?.agentVersion ?? null,
      integrationMode: binding?.integrationMode ?? null,
      syncStatus: binding?.syncStatus ?? null,
      healthStatus: binding?.healthStatus ?? null,
      runtimeConfigRevision: binding?.runtimeConfigRevision ?? null,
      lastReleaseTime: latestVersion ? latestVersion.publishedAt : null,
      lastSyncTime: binding?.lastSyncedAt || null,
      businessDiffs: draft?.businessDiffs || [],
      isCapabilityUpgraded: draft?.businessDiffs.some((d) => d.tag.includes('UPGRADED'))
    };
  },

  /**
   * Check if an agent is currently in an unreleased draft state (never published)
   */
  isUnreleased(agentId: string): boolean {
    const def = agentRepository.getDefinition(agentId);
    return !def?.currentPublishedVersion;
  },

  /**
   * V1.1 内置判定基线：origin === 'BUILT_IN' 即平台内置智能体。
   * UI 层的内置锁定/保护在后续 Commit 中基于此判定实现。
   */
  isBuiltInAgent(agentId: string): boolean {
    const def = agentRepository.getDefinition(agentId);
    return def?.origin === 'BUILT_IN';
  },

  /**
   * A03 Definition Workspace View Projection（V1.1 §20 / Commit 06 TASK 3）。
   * 配置事实优先级：AgentDraft > 当前 Published Snapshot > AgentDefinition；
   * 调用方不依赖 INITIAL_AGENT_DEFINITIONS 之类的展示 Fixture 作为配置 SoT。
   */
  getDefinitionWorkspaceState(agentId: string): AgentDefinitionWorkspaceState | null {
    const def = agentRepository.getDefinition(agentId);
    if (!def) return null;

    const draft = agentRepository.getDraftByAgentId(agentId);
    const publishedSnapshot = def.currentPublishedVersion
      ? agentRepository.getVersion(agentId, def.currentPublishedVersion)?.snapshot
      : undefined;
    const versions = agentRepository.getVersions(agentId);
    const latestVersion = versions[0];

    // 三种来源在 AgentEditableConfig 字段上结构一致
    const source: AgentEditableConfig = draft ?? publishedSnapshot ?? def;
    const editable: AgentEditableConfig = {
      name: source.name,
      description: source.description,
      responsibilitySummary: source.responsibilitySummary,
      roleInstruction: source.roleInstruction,
      owner: source.owner,
      supportedTaskTemplates: source.supportedTaskTemplates.map((binding) => ({ ...binding })),
      allowedContextSources: [...source.allowedContextSources],
      contextBindings: source.contextBindings.map((binding) => ({
        sourceType: binding.sourceType,
        selectionMode: binding.selectionMode,
        resourceIds: binding.resourceIds ? [...binding.resourceIds] : undefined
      })),
      capabilityPreset: source.capabilityPreset,
      capabilityDesc: source.capabilityDesc,
      modelPolicyId: source.modelPolicyId,
      modelPolicyName: source.modelPolicyName,
      maxAutonomy: source.maxAutonomy,
      maxAutonomyDesc: source.maxAutonomyDesc
    };

    return {
      agentId: def.agentId,
      origin: def.origin,
      sourcePresetId: def.sourcePresetId,
      runtimeTarget: def.runtimeTarget,
      formalVersion: def.currentPublishedVersion || null,
      hasDraft: Boolean(draft),
      draftId: draft?.draftId,
      draftUpdatedBy: draft?.updatedBy,
      draftUpdatedAt: draft?.updatedAt,
      businessDiffs: draft?.businessDiffs || [],
      editable,
      editableSource: draft ? 'DRAFT' : publishedSnapshot ? 'PUBLISHED_SNAPSHOT' : 'DEFINITION',
      lastReleaseTime: latestVersion ? latestVersion.publishedAt : null
    };
  },

  /**
   * Get the active draft diff items formatted for UI
   */
  getActiveDraftDiffs(agentId: string): AgentBusinessDiff[] {
    const draft = agentRepository.getDraftByAgentId(agentId);
    return draft?.businessDiffs || [];
  }
};
