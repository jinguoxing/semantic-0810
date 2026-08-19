export type AccessRequestState =
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'GRANTED'
  | 'GRANTED_WITH_LIMITS'
  | 'DENIED'
  | 'EXPIRED';

export type ResourceAccessState = 'AVAILABLE' | 'REQUESTABLE' | 'PENDING' | 'UNAVAILABLE';
export type TaskReadiness = 'WAITING' | 'READY' | 'DEGRADED' | 'BLOCKED';
export type AccessOperation = 'QUERY' | 'EXPORT' | 'INVOKE' | 'SUBSCRIBE';
export type AccessDecisionType = 'GRANT' | 'GRANT_WITH_LIMITS' | 'DENY';
export type AccessPolicyProfile = 'PERSONAL_DATA' | 'BUSINESS_DATA' | 'API_SERVICE' | 'EXPORT_DATA' | 'SPECIAL_POPULATION';

export interface AccessScope {
  geography?: { regionIds?: string[]; regionNames?: string[] };
  fields?: string[];
  operation: AccessOperation;
}

export interface ProtectionRule {
  id: string;
  type: 'MASK' | 'EXCLUDE' | 'ROW_FILTER' | 'RATE_LIMIT' | 'NO_EXPORT' | 'AUDIT';
  target?: string;
  description: string;
}

export interface UsageRestriction { id: string; description: string; }

export interface AccessFieldDetail {
  businessName: string;
  technicalName?: string;
  treatment: 'ALLOW' | 'MASK' | 'EXCLUDE';
  sensitivity?: string;
}

export interface EffectiveGrant {
  id: string;
  requestId: string;
  resourceId: string;
  state: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  scope: AccessScope;
  protections: ProtectionRule[];
  restrictions: UsageRestriction[];
  effectiveAt: string;
  expiresAt?: string;
}

export interface AccessRequest {
  id: string;
  submissionId: string;
  solutionId: string;
  taskId: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  required: boolean;
  operation: AccessOperation;
  requestedScope: AccessScope;
  state: AccessRequestState;
  applicant: { id: string; name: string; department: string };
  purpose: string;
  reviewReason?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  requestedDurationDays?: number;
  policyProfile?: AccessPolicyProfile;
  resourceOwnerTeam?: string;
  fieldDetails?: AccessFieldDetail[];
  submittedAt: string;
  updatedAt: string;
}

export interface AccessDecision {
  id: string;
  requestId: string;
  decision: AccessDecisionType;
  decidedBy: string;
  decidedAt: string;
  reason?: string;
  grant?: EffectiveGrant;
}

export interface AccessSubmission {
  id: string;
  taskId: string;
  solutionId: string;
  taskTitle: string;
  purpose: string;
  source: string;
  requestIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAccessStatus {
  taskId: string;
  solutionId: string;
  readiness: TaskReadiness;
  requiredRequestIds: string[];
  optionalRequestIds: string[];
  waitingRequestIds: string[];
  limitedRequestIds: string[];
  blockedRequestIds: string[];
  evaluatedAt: string;
}

export interface SolutionExecutionContext {
  taskId: string;
  solutionId: string;
  goal: string;
  resourceIds: string[];
  requiredResourceIds: string[];
  metricIds?: string[];
  dimensions?: string[];
  grantIds: string[];
}

export interface AccessDecisionResult {
  requestId: string;
  decision: AccessDecisionType;
  grant?: EffectiveGrant;
  reason?: string;
}
