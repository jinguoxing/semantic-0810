// ─── Access domain contract (AccessDomainContext) ───────────────────────────
// The single authoritative state model for the access journey. Pages may
// simplify EVALUATION, but they consume THESE enums and shapes — never invent
// local ones. Internal enums never render raw: every consumer-facing label
// comes from a presentation contract.
//
// Formal pipeline (one submission fans out to N resource requests):
//
//   AccessSubmission
//         │
//         ├── AccessRequest A ──► Policy Evaluation ──► Decision / Review ──► EffectiveGrant
//         │
//         └── AccessRequest B ──► ...
//
//   Effective Grants ──► Revalidate DataSolution ──► TaskReadiness

// The domain owns the contract; the policy engine (accessDecision.ts)
// implements it. Structural shape kept local so this module stays
// dependency-free — nothing may import INTO the domain.
export interface AccessPolicyVerdict {
  kind: AccessDecisionKind;
  label: string;
}

// ─── Final enums (frozen now; evaluation may stay simple) ───────────────────

/** What a request GRANTS. An API grants a CALL, a data asset grants a QUERY. */
export type AccessOperation = 'PREVIEW' | 'QUERY' | 'EXPORT' | 'CALL';

/** Final policy verdict. AUTO_GRANT/MANUAL_REVIEW/DENY were demo vocabulary —
 *  the contract speaks the final language from day one. */
export type AccessDecisionKind =
  | 'AUTO_ALLOW'
  | 'AUTO_ALLOW_WITH_LIMITS'
  | 'HARD_DENY'
  | 'REVIEW_REQUIRED';

/** Who holds the request right now. PENDING badges in Explorer reflect
 *  SUBMITTED/UNDER_REVIEW; AVAILABLE reflects a materialized EffectiveGrant. */
export type AccessRequestState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'GRANTED'
  | 'REJECTED'
  | 'REVOKED';

export type AccessResourceType = 'DATA_ASSET' | 'METRIC' | 'DATA_API' | 'BUSINESS_OBJECT';

// ─── Frozen state objects ────────────────────────────────────────────────────

/** Policy evaluation output attached to each request. */
export interface AccessPolicyResult {
  decision: AccessDecisionKind;
  /** Consumer-facing copy — internal enums never reach the user. */
  label: string;
  /** AUTO_ALLOW_WITH_LIMITS: what the narrowing imposes (脱敏 / 仅聚合 …). */
  limits: string[];
}

/** One resource's request inside a submission. FROZEN — add fields, never
 *  repurpose these. */
export interface AccessRequest {
  id: string;
  submissionId: string;
  resourceId: string;
  resourceType: AccessResourceType;
  operation: AccessOperation;
  /** What the consumer asked for. */
  requestedScope: string[];
  /** What policy proposes to actually grant (may be narrower). */
  proposedScope: string[];
  state: AccessRequestState;
  policyResult: AccessPolicyResult;
}

/** Groups per-resource requests raised for the same task at the same moment. */
export interface AccessSubmission {
  id: string;
  purpose: string;
  taskContext: string;
  requestedAt?: string;
  requestIds: string[];
}

/** A request parked in front of a human reviewer. */
export interface ReviewItem {
  id: string;
  requestId: string;
  submissionId: string;
  resourceName: string;
  state: 'WAITING' | 'APPROVED' | 'REJECTED';
  decision?: AccessDecisionKind;
}

/** What actually authorizes use once a request is allowed. */
export interface EffectiveGrant {
  id: string;
  requestId: string;
  resourceId: string;
  operation: AccessOperation;
  scope: string[];
  limits: string[];
  grantedAt?: string;
  expiresAt?: string;
}

// ─── TaskReadiness (Effective Grants → revalidate solution → readiness) ─────

export type TaskResourceStatus =
  | 'AVAILABLE'
  | 'REQUESTABLE'
  | 'PENDING'
  | 'UNAVAILABLE'
  | 'SEMANTIC_ONLY'
  | 'DEPENDENT';

export interface TaskResourceRef {
  id: string;
  name: string;
  accessStatus: TaskResourceStatus;
}

export interface TaskReadiness {
  isAllReady: boolean;
  availableCount: number;
  requestableCount: number;
  pendingCount: number;
  unavailableCount: number;
  /** REQUESTABLE + PENDING + UNAVAILABLE, in blocking order. */
  blockingItems: TaskResourceRef[];
  pendingItems: TaskResourceRef[];
  unavailableItems: TaskResourceRef[];
}

/** REQUESTABLE and PENDING both block execution (submitted ≠ granted);
 *  UNAVAILABLE blocks too — it needs a REPLACEMENT, not a request; DEPENDENT
 *  rides on its core data and counts as ready. */
export const evaluateTaskReadiness = (resources: TaskResourceRef[]): TaskReadiness => {
  const requestableItems = resources.filter(r => r.accessStatus === 'REQUESTABLE');
  const pendingItems = resources.filter(r => r.accessStatus === 'PENDING');
  const unavailableItems = resources.filter(r => r.accessStatus === 'UNAVAILABLE');
  const availableItems = resources.filter(r => r.accessStatus === 'AVAILABLE');
  const dependentItems = resources.filter(r => r.accessStatus === 'DEPENDENT');

  return {
    isAllReady:
      requestableItems.length === 0 && pendingItems.length === 0 && unavailableItems.length === 0,
    requestableCount: requestableItems.length,
    pendingCount: pendingItems.length,
    unavailableCount: unavailableItems.length,
    availableCount: availableItems.length + dependentItems.length,
    blockingItems: [...requestableItems, ...pendingItems, ...unavailableItems],
    pendingItems,
    unavailableItems,
  };
};

// ─── Decision helpers ────────────────────────────────────────────────────────

/** Both AUTO_ALLOW variants materialize a grant immediately. */
export const isAutoAllowed = (kind: AccessDecisionKind): boolean =>
  kind === 'AUTO_ALLOW' || kind === 'AUTO_ALLOW_WITH_LIMITS';

// ─── Pipeline materializer (demo) ────────────────────────────────────────────

export interface MaterializedSubmission {
  submission: AccessSubmission;
  requests: AccessRequest[];
  reviewItems: ReviewItem[];
  grants: EffectiveGrant[];
}

export interface SubmissionDraftInput {
  resourceId: string;
  resourceName: string;
  resourceType: AccessResourceType;
  operation: AccessOperation;
  requestedScope: string[];
  /** Already-evaluated policy for this request. */
  decision: AccessPolicyVerdict;
}

/** Walks the formal pipeline for a whole submission: one AccessSubmission,
 *  one AccessRequest per resource, ReviewItems for REVIEW_REQUIRED, and
 *  EffectiveGrants wherever policy auto-allows. IDs are deterministic
 *  (derived from resourceId + submissionId) so renders stay stable. */
export const materializeSubmission = (
  drafts: SubmissionDraftInput[],
  submissionId: string,
  purpose: string,
  taskContext: string,
): MaterializedSubmission => {
  const submission: AccessSubmission = {
    id: submissionId,
    purpose,
    taskContext,
    requestIds: drafts.map(d => `req-${submissionId}-${d.resourceId}`),
  };

  const requests: AccessRequest[] = drafts.map(d => {
    const autoAllowed = isAutoAllowed(d.decision.kind);
    return {
      id: `req-${submissionId}-${d.resourceId}`,
      submissionId,
      resourceId: d.resourceId,
      resourceType: d.resourceType,
      operation: d.operation,
      requestedScope: d.requestedScope,
      proposedScope: d.decision.kind === 'AUTO_ALLOW_WITH_LIMITS'
        ? d.requestedScope.slice(0, Math.max(1, d.requestedScope.length - 1))
        : d.requestedScope,
      state: d.decision.kind === 'HARD_DENY' ? 'REJECTED' : autoAllowed ? 'GRANTED' : 'UNDER_REVIEW',
      policyResult: {
        decision: d.decision.kind,
        label: d.decision.label,
        limits: d.decision.kind === 'AUTO_ALLOW_WITH_LIMITS' ? ['敏感字段动态脱敏', '仅限聚合结果导出'] : [],
      },
    };
  });

  const reviewItems: ReviewItem[] = requests
    .filter(r => r.policyResult.decision === 'REVIEW_REQUIRED')
    .map(r => ({
      id: `rev-${r.id}`,
      requestId: r.id,
      submissionId,
      resourceName: drafts.find(d => d.resourceId === r.resourceId)?.resourceName ?? r.resourceId,
      state: 'WAITING' as const,
    }));

  const grants: EffectiveGrant[] = requests
    .filter(r => r.state === 'GRANTED')
    .map(r => ({
      id: `grant-${r.id}`,
      requestId: r.id,
      resourceId: r.resourceId,
      operation: r.operation,
      scope: r.proposedScope,
      limits: r.policyResult.limits,
      grantedAt: undefined,
      expiresAt: '3 个月',
    }));

  return { submission, requests, reviewItems, grants };
};
