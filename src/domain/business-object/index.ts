/**
 * Business Object 领域层统一出口
 *
 * 三条修订生命周期从这里清晰可见：
 * - BusinessObjectRevision：revision.ts / draft.ts（仅定义发布）
 * - DataSupportRevision：data-support-revision.ts（仅数据支撑动作）
 * - GroundingRevision：grounding.ts（仅落地修正）
 */
export * from './types';
export { businessObjectRepository, dataSupportSummary, getState, setStateForTesting } from './registry';
export { dataSupportService, isCurrentBindingStatus } from './data-support';
export type {
  BottomUpAlignResult,
  ConfirmCandidateResult,
  RevalidationKeepResult,
  RebindResult,
  RetireResult,
  SetPrimaryResult
} from './data-support';
export { resolveCanonicalDataAsset, resolveCanonicalDataAssetId } from './asset-identity';
export { groundingService } from './grounding';
export type { GroundingCorrectionResult } from './grounding';
export { listRevisions, nextRevisionLabel, snapshotOfObject } from './revision';
export { recordDataSupportRevision, listDataSupportRevisions } from './data-support-revision';
export { saveCreateDraft, saveChangeDraft, createDraft, updateDraft, getDraft, getWorkingDraft, discardDraft, publishDraft } from './draft';
export type { PublishDraftResult, UpdateDraftResult } from './draft';
export { objectResolutionContexts } from './task-context';
export { EVIDENCE_KIND_LABELS, tableEvidence, decisionEvidence, dataAssetEvidence, semanticAssetEvidence } from './evidence';
export { subscribe, getVersion, clearPersistedState, resetState, loadState as loadStateForTesting } from './store';
export type { BusinessObjectStoreState } from './store';
export { buildSeedState } from './seed';
export { resetDomainStateForTesting } from './registry';
