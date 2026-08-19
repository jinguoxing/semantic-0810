// ─── AccessResolutionService ─────────────────────────────────────────────────
// Pages never decide WHICH resource to request. They say 申请所需资源 and hand
// the DataSolution to this service; it computes the access delta and picks the
// entry surface:
//
//   DataSolution ──► resolveAccessDelta() ──► AccessRequestDraft[]
//                                             ──► routeAccessRequest()
//                                                     SINGLE → Single Request Drawer
//                                                     MULTI  → Multi-resource Request Page
//
// Router rule (frozen): SINGLE only when there is exactly one request AND
// risk == NORMAL AND scope == SIMPLE. Anything else is the multi page.

import { evaluateAccessDecision, type AccessDecision } from './accessDecision';
import type {
  AccessOperation,
  AccessResourceType,
  TaskResourceRef,
  TaskResourceStatus,
} from './accessDomain';

export type AccessRoute = 'SINGLE' | 'MULTI';

/** What the request grants, derived from resource class: an API grants a
 *  CALL, a data asset grants a QUERY. BUSINESS_OBJECT is consumed as
 *  semantics — it is never REQUESTABLE, so it never drafts. */
export const operationForResource = (type: AccessResourceType): AccessOperation => {
  if (type === 'DATA_API') return 'CALL';
  if (type === 'METRIC') return 'QUERY';
  return 'QUERY';
};

export type RequestRisk = 'NORMAL' | 'SENSITIVE';
export type RequestScopeClass = 'SIMPLE' | 'SCOPED';

export interface AccessRequestDraft {
  resourceId: string;
  resourceName: string;
  resourceType: AccessResourceType;
  operation: AccessOperation;
  risk: RequestRisk;
  scope: RequestScopeClass;
  requestedScope: string[];
  /** Policy evaluation over (resource designation × operation). */
  policyPreview: AccessDecision;
}

export interface AccessResolution {
  /** Requests the consumer must raise to unblock the task. */
  requiredRequests: AccessRequestDraft[];
  route: AccessRoute;
  /** Consumer-facing reason when routed to the multi page. */
  routeReason?: string;
  /** Already in flight — nothing to draft, just wait. */
  pendingItems: TaskResourceRef[];
  /** Not requestable at all — needs a replacement, never a request. */
  unavailableItems: TaskResourceRef[];
}

/** Policy inputs the resolver reads off a solution resource. */
export interface AccessDeltaResource extends TaskResourceRef {
  resourceType: AccessResourceType;
  securityLevel?: string;
  autoGrantPolicy?: boolean;
  /** Minimal-necessary scope chips for the request. */
  requestedScope?: string[];
}

const riskFor = (securityLevel?: string): RequestRisk =>
  !!securityLevel && /L[45]/.test(securityLevel) ? 'SENSITIVE' : 'NORMAL';

const scopeClassFor = (decision: AccessDecision, operation: AccessOperation): RequestScopeClass =>
  decision.kind === 'AUTO_ALLOW_WITH_LIMITS' || operation === 'EXPORT' ? 'SCOPED' : 'SIMPLE';

/** Compute what still blocks the task: AVAILABLE/DEPENDENT are covered,
 *  PENDING is already submitted, UNAVAILABLE is a replacement problem; every
 *  REQUESTABLE resource becomes a draft with its policy preview. */
export const resolveAccessDelta = (resources: AccessDeltaResource[]): AccessResolution => {
  const pendingItems = resources.filter(r => r.accessStatus === 'PENDING');
  const unavailableItems = resources.filter(r => r.accessStatus === 'UNAVAILABLE');

  const requiredRequests: AccessRequestDraft[] = resources
    .filter(r => r.accessStatus === 'REQUESTABLE')
    .map(r => {
      const operation = operationForResource(r.resourceType);
      const policyPreview = evaluateAccessDecision({
        securityLevel: r.securityLevel,
        autoGrantPolicy: r.autoGrantPolicy,
        requestedOperation: operation,
      });
      return {
        resourceId: r.id,
        resourceName: r.name,
        resourceType: r.resourceType,
        operation,
        risk: riskFor(r.securityLevel),
        scope: scopeClassFor(policyPreview, operation),
        requestedScope: r.requestedScope ?? [],
        policyPreview,
      };
    });

  return {
    requiredRequests,
    route: routeAccessRequest(requiredRequests),
    pendingItems,
    unavailableItems,
  };
};

/** Frozen router rule: one NORMAL, SIMPLE request → the single drawer;
 *  everything else (multiple requests, sensitive, or scope-narrowed) → the
 *  multi-resource page where each request is visible and reviewable. */
export const routeAccessRequest = (drafts: AccessRequestDraft[]): AccessRoute => {
  if (drafts.length === 0) return 'MULTI';
  if (drafts.length === 1 && drafts[0].risk === 'NORMAL' && drafts[0].scope === 'SIMPLE') {
    return 'SINGLE';
  }
  return 'MULTI';
};

/** Consumer-facing reason for the multi page — which dimension forced MULTI. */
export const multiRouteReason = (drafts: AccessRequestDraft[]): string => {
  if (drafts.length > 1) {
    return `本次需为 ${drafts.length} 项资源分别提交访问申请，将在一个申请单中统一提交与追踪。`;
  }
  const only = drafts[0];
  if (!only) return '当前申请需要统一提交与追踪。';
  if (only.risk === 'SENSITIVE') {
    return `「${only.resourceName}」属于高敏感资源，需在多资源申请页确认安全使用要求后统一提交。`;
  }
  return `「${only.resourceName}」的授权附带范围限制，需在多资源申请页确认缩减后的数据范围。`;
};
