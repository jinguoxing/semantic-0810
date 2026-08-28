/**
 * Semovix Agent Domain Model - Service
 * Core business operations:
 * - createDraftFromPreset: Generates an AgentDefinition + AgentDraft from an official preset
 * - publishDraft: Enforces immutable versioning (creates AgentVersion, updates runtime binding)
 * - createDraftFromPublishedVersion: Starts a new draft cycle from an existing immutable version
 * - updateDraft: Persists draft changes
 */

import {
  AgentDefinition,
  AgentDraft,
  AgentVersion,
  AgentRuntimeBinding,
  AgentBusinessDiff
} from './agentTypes';
import { getPresetById, MANAGED_AGENT_PRESETS } from './agentPresets';
import { agentRepository } from './agentRepository';

export interface CreateDraftFromPresetInput {
  presetId: string;
  name: string;
  responsibility: string;
  owner: string;
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
      owner: input.owner.trim() || preset.defaultOwner,
      sourcePresetId: preset.presetId,
      supportedTaskTemplateIds: [...preset.supportedTaskTemplateIds],
      allowedContextSources: preset.allowedContextSources.map((ctx) => ({
        ...ctx,
        type: 'DRAFT_NEW' as const
      })),
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
      supportedTaskTemplateIds: [...definition.supportedTaskTemplateIds],
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
   * P0: Publish an existing draft to create an immutable AgentVersion
   */
  public publishDraft(params: {
    agentId: string;
    publishedBy: string;
    releaseNotes?: string;
    targetVersion?: string;
  }): { version: AgentVersion; definition: AgentDefinition; runtimeBinding: AgentRuntimeBinding } {
    const def = agentRepository.getDefinition(params.agentId);
    if (!def) {
      throw new Error(`Agent definition not found for id: ${params.agentId}`);
    }

    const draft = agentRepository.getDraftByAgentId(params.agentId);
    const targetVersionNumber =
      params.targetVersion ||
      (def.currentPublishedVersion
        ? this.incrementMinorVersion(def.currentPublishedVersion)
        : 'v1.0');

    // Update definition with draft data
    const updatedDef: AgentDefinition = {
      ...def,
      name: draft ? draft.name : def.name,
      description: draft ? draft.description : def.description,
      responsibilitySummary: draft ? draft.responsibilitySummary : def.responsibilitySummary,
      capabilityPreset: draft ? draft.capabilityPreset : def.capabilityPreset,
      capabilityDesc: draft?.capabilityDesc || def.capabilityDesc,
      supportedTaskTemplateIds: draft ? draft.supportedTaskTemplateIds : def.supportedTaskTemplateIds,
      allowedContextSources: draft
        ? draft.allowedContextSources.map((c) => ({ ...c, type: 'BASE' as const }))
        : def.allowedContextSources,
      modelPolicyId: draft ? draft.modelPolicyId : def.modelPolicyId,
      maxAutonomy: draft ? draft.maxAutonomy : def.maxAutonomy,
      runtimeTarget: draft ? draft.runtimeTarget : def.runtimeTarget,
      status: 'ACTIVE',
      currentPublishedVersion: targetVersionNumber,
      currentDraftId: undefined, // Draft is closed after release
      updatedAt: '刚刚'
    };

    const newRevision = `r${Math.floor(Math.random() * 50) + 20}`;

    // Immutable Version snapshot
    const version: AgentVersion = {
      versionId: `ver_${params.agentId}_${Date.now().toString(36)}`,
      versionNumber: targetVersionNumber,
      agentId: params.agentId,
      snapshot: { ...updatedDef },
      publishedAt: '刚刚',
      publishedBy: params.publishedBy,
      releaseNotes: params.releaseNotes || `正式发布版本 ${targetVersionNumber}`,
      runtimeRevision: newRevision
    };

    // Update Runtime Binding to SYNCED
    const runtimeBinding: AgentRuntimeBinding = {
      bindingId: `bind_${params.agentId}`,
      agentId: params.agentId,
      runtimeTarget: updatedDef.runtimeTarget,
      runtimeInstanceId: `inst_${params.agentId}_prod`,
      runtimeStatus: 'SYNCED',
      syncRevision: newRevision,
      lastSyncedAt: '刚刚'
    };

    // Save all to repository
    agentRepository.saveDefinition(updatedDef);
    agentRepository.addVersion(version);
    agentRepository.saveRuntimeBinding(runtimeBinding);
    if (draft) {
      agentRepository.removeDraft(draft.draftId);
    }

    return { version, definition: updatedDef, runtimeBinding };
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
      supportedTaskTemplateIds: [...def.supportedTaskTemplateIds],
      allowedContextSources: def.allowedContextSources.map((c) => ({ ...c })),
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
