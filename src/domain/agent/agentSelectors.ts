/**
 * Semovix Agent Domain Model - Selectors & View Projections
 * Provides selectors for UI layers (Registry, Definition Workspace, Publish Workspace)
 */

import {
  AgentDefinition,
  AgentDraft,
  AgentVersion,
  AgentRuntimeBinding,
  AgentBusinessDiff
} from './agentTypes';
import { agentRepository } from './agentRepository';

export interface AgentDisplayState {
  agentId: string;
  name: string;
  responsibility: string;
  owner: string;
  agentType: '系统智能体' | '受管智能体';
  category: 'SYSTEM' | 'MANAGED';
  formalVersion: string | null; // null if unreleased
  hasDraft: boolean;
  draftId?: string;
  status: 'ACTIVE' | 'DRAFT' | 'DISABLED';
  runtimeEngine: 'Semovix' | 'Semovix Native' | 'WeKnora';
  runtimeBindingStatus: 'READY' | 'DRAFT_PROJECTION' | 'SYNCED' | 'UNBOUND' | 'ERROR';
  runtimeRevision: string | null;
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
    const binding = agentRepository.getRuntimeBinding(agentId);
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
      owner: def.owner,
      agentType: def.agentKind === 'SYSTEM' ? '系统智能体' : '受管智能体',
      category: def.agentKind,
      formalVersion,
      hasDraft,
      draftId: draft?.draftId,
      status: def.status,
      runtimeEngine,
      runtimeBindingStatus: binding?.runtimeStatus || 'UNBOUND',
      runtimeRevision: binding?.syncRevision || null,
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
   * Get the active draft diff items formatted for UI
   */
  getActiveDraftDiffs(agentId: string): AgentBusinessDiff[] {
    const draft = agentRepository.getDraftByAgentId(agentId);
    return draft?.businessDiffs || [];
  }
};
