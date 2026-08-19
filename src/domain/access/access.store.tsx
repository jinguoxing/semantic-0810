import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { ACCESS_REQUESTS, ACCESS_SUBMISSIONS, EFFECTIVE_GRANTS } from './access.mock';
import { buildAccessRecommendation } from './accessDecision';
import { evaluateTaskReadiness } from './taskReadiness';
import type { AccessDecision, AccessDecisionResult, AccessRequest, AccessSubmission, EffectiveGrant, TaskAccessStatus } from './access.types';

export interface AccessDomainState {
  submissions: Record<string, AccessSubmission>;
  requests: Record<string, AccessRequest>;
  decisions: Record<string, AccessDecision>;
  grants: Record<string, EffectiveGrant>;
  taskStatuses: Record<string, TaskAccessStatus>;
}

const byId = <T extends { id: string }>(items: T[]) => Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, T>;

function buildState(): AccessDomainState {
  const submissions = byId(ACCESS_SUBMISSIONS);
  const requests = byId(ACCESS_REQUESTS);
  const grants = byId(EFFECTIVE_GRANTS);
  const taskStatuses = Object.fromEntries(ACCESS_SUBMISSIONS.map((submission) => [
    submission.taskId,
    evaluateTaskReadiness(submission, submission.requestIds.map((id) => requests[id]), EFFECTIVE_GRANTS),
  ]));
  return { submissions, requests, decisions: {}, grants, taskStatuses };
}

type Action =
  | { type: 'CREATE_SUBMISSION'; submission: AccessSubmission; requests: AccessRequest[] }
  | { type: 'SUBMIT_REQUEST'; request: AccessRequest }
  | { type: 'DECIDE_REQUEST'; result: AccessDecisionResult; decidedBy: string }
  | { type: 'EXPIRE_GRANT'; grantId: string };

function reevaluate(state: AccessDomainState, submissionId: string): AccessDomainState {
  const submission = state.submissions[submissionId];
  if (!submission) return state;
  const requests = submission.requestIds.map((id) => state.requests[id]).filter(Boolean);
  const taskStatus = evaluateTaskReadiness(submission, requests, Object.values(state.grants));
  return { ...state, taskStatuses: { ...state.taskStatuses, [submission.taskId]: taskStatus } };
}

function createGrant(result: AccessDecisionResult, request: AccessRequest): EffectiveGrant | undefined {
  if (result.decision === 'DENY') return undefined;
  if (result.grant) return result.grant;
  const recommendation = buildAccessRecommendation(request);
  const days = request.requestedDurationDays ?? 90;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: `grant-${request.id}-${Date.now()}`,
    requestId: request.id,
    resourceId: request.resourceId,
    state: 'ACTIVE',
    scope: recommendation.proposedScope ?? request.requestedScope,
    protections: recommendation.protections,
    restrictions: recommendation.restrictions,
    effectiveAt: new Date().toISOString(),
    expiresAt,
  };
}

function reducer(state: AccessDomainState, action: Action): AccessDomainState {
  if (action.type === 'CREATE_SUBMISSION') {
    const next = {
      ...state,
      submissions: { ...state.submissions, [action.submission.id]: action.submission },
      requests: { ...state.requests, ...byId(action.requests) },
    };
    return reevaluate(next, action.submission.id);
  }
  if (action.type === 'SUBMIT_REQUEST') {
    const request = { ...action.request, state: 'PENDING_REVIEW' as const, updatedAt: new Date().toISOString() };
    return reevaluate({ ...state, requests: { ...state.requests, [request.id]: request } }, request.submissionId);
  }
  if (action.type === 'EXPIRE_GRANT') {
    const grant = state.grants[action.grantId];
    if (!grant) return state;
    const request = state.requests[grant.requestId];
    const next = {
      ...state,
      grants: { ...state.grants, [grant.id]: { ...grant, state: 'EXPIRED' as const } },
      requests: request ? { ...state.requests, [request.id]: { ...request, state: 'EXPIRED' as const, updatedAt: new Date().toISOString() } } : state.requests,
    };
    return request ? reevaluate(next, request.submissionId) : next;
  }
  const request = state.requests[action.result.requestId];
  if (!request) return state;
  const grant = createGrant(action.result, request);
  const requestState = action.result.decision === 'DENY'
    ? 'DENIED' as const
    : action.result.decision === 'GRANT_WITH_LIMITS'
      ? 'GRANTED_WITH_LIMITS' as const
      : 'GRANTED' as const;
  const decision: AccessDecision = {
    id: `decision-${request.id}-${Date.now()}`,
    requestId: request.id,
    decision: action.result.decision,
    decidedBy: action.decidedBy,
    decidedAt: new Date().toISOString(),
    reason: action.result.reason,
    grant,
  };
  const next: AccessDomainState = {
    ...state,
    requests: { ...state.requests, [request.id]: { ...request, state: requestState, updatedAt: decision.decidedAt } },
    decisions: { ...state.decisions, [decision.id]: decision },
    grants: grant ? { ...state.grants, [grant.id]: grant } : state.grants,
  };
  return reevaluate(next, request.submissionId);
}

export interface AccessStore extends AccessDomainState {
  createSubmission: (submission: AccessSubmission, requests: AccessRequest[]) => void;
  submitRequest: (request: AccessRequest) => void;
  decideRequest: (result: AccessDecisionResult) => void;
  approveRequest: (requestId: string, reason?: string) => void;
  approveRequestWithLimits: (requestId: string, reason?: string) => void;
  denyRequest: (requestId: string, reason?: string) => void;
  expireGrant: (grantId: string) => void;
  getRequest: (requestId: string) => AccessRequest | undefined;
  getSubmission: (submissionId: string) => AccessSubmission | undefined;
  getSubmissionRequests: (submissionId: string) => AccessRequest[];
  getPendingReviewRequests: () => AccessRequest[];
  evaluateTaskReadiness: (submissionId: string) => TaskAccessStatus | undefined;
}

const AccessContext = createContext<AccessStore | null>(null);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildState);
  const createSubmission = useCallback((submission: AccessSubmission, requests: AccessRequest[]) => dispatch({ type: 'CREATE_SUBMISSION', submission, requests }), []);
  const submitRequest = useCallback((request: AccessRequest) => dispatch({ type: 'SUBMIT_REQUEST', request }), []);
  const decideRequest = useCallback((result: AccessDecisionResult) => dispatch({ type: 'DECIDE_REQUEST', result, decidedBy: '当前审核人' }), []);
  const approveRequest = useCallback((requestId: string, reason?: string) => decideRequest({ requestId, decision: 'GRANT', reason }), [decideRequest]);
  const approveRequestWithLimits = useCallback((requestId: string, reason?: string) => decideRequest({ requestId, decision: 'GRANT_WITH_LIMITS', reason }), [decideRequest]);
  const denyRequest = useCallback((requestId: string, reason?: string) => decideRequest({ requestId, decision: 'DENY', reason }), [decideRequest]);
  const expireGrant = useCallback((grantId: string) => dispatch({ type: 'EXPIRE_GRANT', grantId }), []);
  const value = useMemo<AccessStore>(() => ({
    ...state, createSubmission, submitRequest, decideRequest, approveRequest, approveRequestWithLimits, denyRequest, expireGrant,
    getRequest: (requestId) => state.requests[requestId],
    getSubmission: (submissionId) => state.submissions[submissionId],
    getSubmissionRequests: (submissionId) => {
      const submission = state.submissions[submissionId];
      return submission ? submission.requestIds.map((id) => state.requests[id]).filter(Boolean) : [];
    },
    getPendingReviewRequests: () => (Object.values(state.requests) as AccessRequest[]).filter((request) => request.state === 'PENDING_REVIEW' || request.state === 'SUBMITTED'),
    evaluateTaskReadiness: (submissionId) => {
      const submission = state.submissions[submissionId];
      return submission ? state.taskStatuses[submission.taskId] : undefined;
    },
  }), [state, createSubmission, submitRequest, decideRequest, approveRequest, approveRequestWithLimits, denyRequest, expireGrant]);
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccessStore(): AccessStore {
  const store = useContext(AccessContext);
  if (!store) throw new Error('useAccessStore must be used inside AccessProvider');
  return store;
}

export const useAccessRequest = (requestId?: string) => useAccessStore().getRequest(requestId ?? '');
export const useAccessSubmission = (submissionId?: string) => useAccessStore().getSubmission(submissionId ?? '');
export const useEffectiveGrant = (requestId?: string) => Object.values(useAccessStore().grants).find((grant) => grant.requestId === requestId && grant.state === 'ACTIVE');
