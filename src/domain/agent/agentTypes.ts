/**
 * Semovix Agent Domain Model - Core Types
 * Defines the official enterprise domain entities:
 * AgentDefinition, AgentDraft, AgentVersion, AgentRuntimeBinding, ManagedAgentPreset
 */

export type AgentKind = 'SYSTEM' | 'MANAGED';

export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'DISABLED';

export type MaxAutonomy =
  | 'SUGGEST'
  | 'PROPOSE'
  | 'EXECUTE_WITHIN_POLICY';

export type RuntimeTarget =
  | 'SEMOVIX_NATIVE'
  | 'WEKNORA';

export interface AgentContextSource {
  id: string;
  name: string;
  desc: string;
  type: 'BASE' | 'DRAFT_NEW';
}

export interface AgentTaskItem {
  id: string;
  name: string;
  desc: string;
  status: 'ACTIVE' | 'DRAFT_NEW' | 'DISABLED';
}

export interface AgentBusinessDiff {
  field: string;
  changeText: string;
  tag: string;
  isNew?: boolean;
}

export interface AgentDefinition {
  agentId: string;
  name: string;
  description: string;
  responsibilitySummary: string;
  agentKind: AgentKind;
  owner: string;
  sourcePresetId?: string;
  supportedTaskTemplateIds: string[];
  allowedContextSources: AgentContextSource[];
  capabilityPreset: string;
  capabilityDesc?: string;
  modelPolicyId: string;
  modelPolicyName?: string;
  maxAutonomy: MaxAutonomy;
  maxAutonomyDesc?: string;
  runtimeTarget: RuntimeTarget;
  status: AgentStatus;
  currentPublishedVersion?: string; // e.g. "v1.4", undefined if unreleased
  currentDraftId?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface AgentDraft {
  draftId: string;
  agentId: string;
  baseVersion?: string;
  name: string;
  description: string;
  responsibilitySummary: string;
  supportedTaskTemplateIds: string[];
  allowedContextSources: AgentContextSource[];
  capabilityPreset: string;
  capabilityDesc?: string;
  modelPolicyId: string;
  modelPolicyName?: string;
  maxAutonomy: MaxAutonomy;
  maxAutonomyDesc?: string;
  runtimeTarget: RuntimeTarget;
  businessDiffs: AgentBusinessDiff[];
  updatedAt: string;
  updatedBy: string;
}

export interface AgentVersion {
  versionId: string;
  versionNumber: string; // e.g. "v1.0", "v1.4"
  agentId: string;
  snapshot: AgentDefinition;
  publishedAt: string;
  publishedBy: string;
  releaseNotes?: string;
  runtimeRevision: string;
}

export interface AgentRuntimeBinding {
  bindingId: string;
  agentId: string;
  runtimeTarget: RuntimeTarget;
  runtimeInstanceId?: string;
  runtimeStatus: 'READY' | 'DRAFT_PROJECTION' | 'SYNCED' | 'UNBOUND' | 'ERROR';
  syncRevision?: string;
  lastSyncedAt?: string;
}

export interface ManagedAgentPreset {
  presetId: string;
  presetName: string;
  categoryTag: string;
  description: string;
  selectionSummary: string;
  defaultName: string;
  defaultResponsibility: string;
  defaultOwner: string;
  runtimeTarget: RuntimeTarget;
  runtimeEngineLabel: string;
  supportedTaskTemplateIds: string[];
  supportedTaskNames: string[];
  extraTasksCount?: number;
  capabilityPreset: string;
  capabilityPresetDesc: string;
  modelPolicyId: string;
  modelPolicyName: string;
  defaultMaxAutonomy: MaxAutonomy;
  autonomyDesc: string;
  allowedContextSources: AgentContextSource[];
  symbolType: 'data' | 'governance' | 'knowledge';
}
