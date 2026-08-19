import type { AccessRequest, AccessSubmission, EffectiveGrant, TaskAccessStatus } from './access.types';

const hasActiveGrant = (request: AccessRequest, grants: EffectiveGrant[]) =>
  grants.some((grant) => grant.requestId === request.id && grant.state === 'ACTIVE');

const grantCoversRequiredCapability = (request: AccessRequest, grants: EffectiveGrant[]) => {
  const grant = grants.find((candidate) => candidate.requestId === request.id && candidate.state === 'ACTIVE');
  if (!grant || grant.scope.operation !== request.operation) return false;
  const requestedFields = request.requestedScope.fields ?? [];
  const grantedFields = grant.scope.fields ?? [];
  const requestedRegions = request.requestedScope.geography?.regionNames ?? [];
  const grantedRegions = grant.scope.geography?.regionNames ?? [];
  return requestedFields.every((field) => grantedFields.includes(field))
    && requestedRegions.every((region) => grantedRegions.includes(region));
};

export function evaluateTaskReadiness(
  submission: AccessSubmission,
  requests: AccessRequest[],
  grants: EffectiveGrant[],
): TaskAccessStatus {
  const required = requests.filter((request) => request.required);
  const optional = requests.filter((request) => !request.required);
  const waitingRequestIds = required
    .filter((request) => request.state === 'SUBMITTED' || request.state === 'PENDING_REVIEW')
    .map((request) => request.id);
  const blockedRequestIds = required
    .filter((request) => request.state === 'DENIED' || request.state === 'EXPIRED')
    .map((request) => request.id);
  const limitedRequestIds = required
    .filter((request) => request.state === 'GRANTED_WITH_LIMITS'
      && hasActiveGrant(request, grants)
      && !grantCoversRequiredCapability(request, grants))
    .map((request) => request.id);
  const readiness = blockedRequestIds.length > 0
    ? 'BLOCKED'
    : waitingRequestIds.length > 0
      ? 'WAITING'
      : limitedRequestIds.length > 0
        ? 'DEGRADED'
        : 'READY';

  return {
    taskId: submission.taskId,
    solutionId: submission.solutionId,
    readiness,
    requiredRequestIds: required.map((request) => request.id),
    optionalRequestIds: optional.map((request) => request.id),
    waitingRequestIds,
    limitedRequestIds,
    blockedRequestIds,
    evaluatedAt: new Date().toISOString(),
  };
}
