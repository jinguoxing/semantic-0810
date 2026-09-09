/**
 * Business Object 领域层统一出口
 */
export * from './types';
export { businessObjectRepository, dataSupportSummary, getState, setStateForTesting } from './registry';
export { dataSupportService } from './data-support';
export { groundingService } from './grounding';
export { listRevisions, commitRevision, nextRevisionLabel } from './revision';
export { objectResolutionContexts } from './task-context';
export { EVIDENCE_KIND_LABELS, tableEvidence, decisionEvidence, dataAssetEvidence, semanticAssetEvidence } from './evidence';
export { subscribe, getVersion, clearPersistedState, resetState, loadState as loadStateForTesting } from './store';
export type { BusinessObjectStoreState } from './store';
export { buildSeedState } from './seed';
export { resetDomainStateForTesting } from './registry';
