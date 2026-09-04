import {
  FindDataTaskState,
  FindDataResource,
  ResourceId,
  DataSolutionItem,
  SolutionGap,
  FieldMetadata,
  AvailabilityByAction,
  ResourceCandidate,
  ExecutionAssessment
} from './FindDataTask';

/**
 * Filter out any resources where discover === 'DENIED'.
 * Strict rule: discover = DENIED resources must never appear in search results,
 * catalog listings, solution items, counts, or assistant summaries.
 */
export function selectDiscoverableResources(task: FindDataTaskState): FindDataResource[] {
  return Object.values(task.resources).filter(
    (res) => res.availabilityByAction?.discover === 'ALLOWED'
  );
}

export function selectDiscoverableResourceMap(task: FindDataTaskState): Record<ResourceId, FindDataResource> {
  const map: Record<ResourceId, FindDataResource> = {};
  for (const res of Object.values(task.resources)) {
    if (res.availabilityByAction?.discover === 'ALLOWED') {
      map[res.id] = res;
    }
  }
  return map;
}

export function selectResourceById(
  task: FindDataTaskState,
  resourceId?: ResourceId
): FindDataResource | undefined {
  if (!resourceId) return undefined;
  const res = task.resources[resourceId];
  if (!res || res.availabilityByAction?.discover !== 'ALLOWED') {
    return undefined;
  }
  return res;
}

export function selectResourceAvailability(
  task: FindDataTaskState,
  resourceId?: ResourceId
): AvailabilityByAction | undefined {
  if (!resourceId) return undefined;
  return task.resources[resourceId]?.availabilityByAction;
}

export function selectActiveResource(task: FindDataTaskState): FindDataResource | undefined {
  return selectResourceById(task, task.activeResourceId);
}

export function selectResourceFields(
  task: FindDataTaskState,
  resourceId?: ResourceId
): FieldMetadata[] {
  const resource = selectResourceById(task, resourceId);
  return resource?.fields || [];
}

export function selectCandidateResources(task: FindDataTaskState): ResourceCandidate[] {
  return (task.searchResult?.candidateSnapshot ?? []).filter(
    (candidate) => task.resources[candidate.resourceId]?.availabilityByAction.discover === 'ALLOWED'
  );
}

export function selectRelatedResourceCandidates(task: FindDataTaskState): ResourceCandidate[] {
  return selectCandidateResources(task).filter((candidate) => candidate.matchType !== 'DIRECT');
}

export function selectCandidateById(task: FindDataTaskState, resourceId?: ResourceId): ResourceCandidate | undefined {
  if (!resourceId) return undefined;
  return selectCandidateResources(task).find((candidate) => candidate.resourceId === resourceId);
}

export function selectCandidatesForComparison(task: FindDataTaskState): ResourceCandidate[] {
  const comparisonIds = task.comparisonModel?.resourceIds ?? [];
  return selectCandidateResources(task).filter((candidate) => comparisonIds.includes(candidate.resourceId));
}

export function selectCandidateSolutionStatus(task: FindDataTaskState, resourceId: ResourceId): '已加入方案' | '未加入方案' {
  return task.dataSolution.items.some((item) => item.resourceId === resourceId) ? '已加入方案' : '未加入方案';
}

/**
 * 1. selectBusinessRelevantItems:
 * Returns all discoverable items with business role CORE, CONDITIONAL_SUPPORT, OPTIONAL_DRILLDOWN, or PARTIAL_MATCH
 */
export function selectBusinessRelevantItems(task: FindDataTaskState): DataSolutionItem[] {
  const discoverableMap = selectDiscoverableResourceMap(task);
  return task.dataSolution.items.filter((item) => {
    const res = discoverableMap[item.resourceId];
    return res !== undefined && ['CORE', 'CONDITIONAL_SUPPORT', 'OPTIONAL_DRILLDOWN', 'PARTIAL_MATCH'].includes(item.role);
  });
}

/**
 * 2. selectRecommendedSolutionItems:
 * Returns items where inclusionState is RECOMMENDED or SELECTED.
 */
export function selectRecommendedSolutionItems(task: FindDataTaskState): DataSolutionItem[] {
  const discoverableMap = selectDiscoverableResourceMap(task);
  return task.dataSolution.items.filter((item) => {
    const res = discoverableMap[item.resourceId];
    return res !== undefined && item.role !== 'PARTIAL_MATCH' &&
      (item.inclusionState === 'RECOMMENDED' || item.inclusionState === 'SELECTED');
  });
}

/**
 * 3. selectPartialMatchSolutionItems:
 * Returns items where role is PARTIAL_MATCH
 */
export function selectPartialMatchItems(task: FindDataTaskState): DataSolutionItem[] {
  const discoverableMap = selectDiscoverableResourceMap(task);
  return task.dataSolution.items.filter((item) => {
    const res = discoverableMap[item.resourceId];
    return res !== undefined && item.role === 'PARTIAL_MATCH';
  });
}

export const selectPartialMatchSolutionItems = selectPartialMatchItems;

/**
 * 4. selectExecutableSolutionItems:
 * Must be in recommended/selected AND resource availability query === 'ALLOWED'
 */
export function selectExecutionAssessments(task: FindDataTaskState): ExecutionAssessment[] {
  return task.dataSolution.items.map((item) => {
    const resource = task.resources[item.resourceId];
    if (!resource || resource.availabilityByAction.discover !== 'ALLOWED') {
      return { item, included: false, reason: 'RESOURCE_UNAVAILABLE', userMessage: '资源当前不可用，未纳入执行范围。' };
    }
    if (item.role === 'PARTIAL_MATCH') {
      return { item, included: false, reason: 'PARTIAL_MATCH', userMessage: '该资源仅部分匹配当前目标，不参与本次执行。' };
    }
    if (item.role === 'OPTIONAL_DRILLDOWN') {
      return { item, included: false, reason: 'OPTIONAL_DRILLDOWN', userMessage: '该资源仅供明细下钻，不作为本次计算输入。' };
    }
    if (item.inclusionState === 'NOT_INCLUDED') {
      return { item, included: false, reason: 'NOT_SELECTED', userMessage: '该资源尚未被选入当前方案。' };
    }
    if (resource.availabilityByAction.query === 'REQUESTABLE') {
      return { item, included: false, reason: 'QUERY_PERMISSION_REQUIRED', userMessage: '查询权限尚需申请，暂未纳入执行范围。' };
    }
    if (resource.availabilityByAction.query !== 'ALLOWED') {
      return { item, included: false, reason: 'QUERY_PERMISSION_DENIED', userMessage: '当前查询权限不可用，无法纳入执行范围。' };
    }
    const relationshipSatisfied = item.role !== 'CONDITIONAL_SUPPORT' || task.dataSolution.relationshipEvidence.some(
      (evidence) =>
        (evidence.sourceResourceId === item.resourceId || evidence.targetResourceId === item.resourceId) &&
        evidence.verificationStatus === 'CONFIRMED'
    );
    if (!relationshipSatisfied) {
      return { item, included: false, reason: 'RELATIONSHIP_NOT_READY', userMessage: '与核心资源的关系尚未确认，暂不进入执行范围。' };
    }
    return { item, included: true, reason: 'INCLUDED', userMessage: '已纳入本次实际计算输入。' };
  });
}

export function selectExecutableSolutionItems(task: FindDataTaskState): DataSolutionItem[] {
  return selectExecutionAssessments(task)
    .filter((assessment) => assessment.included)
    .map((assessment) => assessment.item);
}

/**
 * 5. selectPermissionRelevantItems:
 * Used by Access Surface:
 * - Current solution recommended or selected items
 * - Business relevant items where query is REQUESTABLE
 * - Partial match items where query is REQUESTABLE
 */
export function selectPermissionRelevantItems(task: FindDataTaskState): DataSolutionItem[] {
  const discoverableMap = selectDiscoverableResourceMap(task);
  const itemsMap = new Map<ResourceId, DataSolutionItem>();

  for (const item of task.dataSolution.items) {
    if (!discoverableMap[item.resourceId]) continue;
    const availability = task.resources[item.resourceId]?.availabilityByAction;

    const isRecommendedOrSelected = item.inclusionState === 'RECOMMENDED' || item.inclusionState === 'SELECTED';
    const isRequestable = availability?.query === 'REQUESTABLE';

    if (isRecommendedOrSelected || isRequestable) {
      itemsMap.set(item.resourceId, item);
    }
  }

  // A requestable candidate is still relevant to the permission surface even
  // before the user elects to make it part of the formal solution. This keeps
  // discovery and solution membership separate while allowing a user to ask
  // for access to a resource they are evaluating.
  for (const candidate of selectCandidateResources(task)) {
    const availability = task.resources[candidate.resourceId]?.availabilityByAction;
    if (availability?.query !== 'REQUESTABLE' || itemsMap.has(candidate.resourceId)) continue;
    itemsMap.set(candidate.resourceId, {
      resourceId: candidate.resourceId,
      role: candidate.proposedRole ?? 'OPTIONAL_DRILLDOWN',
      inclusionState: 'NOT_INCLUDED',
      coverage: [candidate.reason],
      limitations: ['尚未纳入正式数据方案。'],
      evidenceRefs: ['检索候选池']
    });
  }

  return Array.from(itemsMap.values());
}

export interface SolutionGroups {
  core: DataSolutionItem[];
  conditional: DataSolutionItem[];
  optional: DataSolutionItem[];
  partialMatch: DataSolutionItem[];
}

export function selectSolutionGroups(
  task: FindDataTaskState,
  mode: 'recommended' | 'executable' = 'recommended'
): SolutionGroups {
  const items =
    mode === 'executable'
      ? selectExecutableSolutionItems(task)
      : selectRecommendedSolutionItems(task);

  const groups: SolutionGroups = {
    core: [],
    conditional: [],
    optional: [],
    partialMatch: []
  };

  for (const item of items) {
    switch (item.role) {
      case 'CORE':
        groups.core.push(item);
        break;
      case 'CONDITIONAL_SUPPORT':
        groups.conditional.push(item);
        break;
      case 'OPTIONAL_DRILLDOWN':
        groups.optional.push(item);
        break;
      case 'PARTIAL_MATCH':
        groups.partialMatch.push(item);
        break;
      default:
        break;
    }
  }

  if (mode === 'recommended') {
    groups.partialMatch = selectPartialMatchItems(task);
  }

  return groups;
}

export function selectSolutionCoverage(task: FindDataTaskState): string[] {
  return task.dataSolution.coverageSummary;
}

export function selectSolutionGaps(task: FindDataTaskState): SolutionGap[] {
  return task.dataSolution.gaps;
}

/**
 * Derives user-friendly display text for query permission based on availability
 */
export function getQueryStatusDisplay(availability?: AvailabilityByAction): {
  label: string;
  badgeClass: string;
  isExecutable: boolean;
} {
  const queryDecision = availability?.query;
  switch (queryDecision) {
    case 'ALLOWED':
      return {
        label: '可用于问数',
        badgeClass: 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]',
        isExecutable: true
      };
    case 'REQUESTABLE':
      return {
        label: '查询需申请',
        badgeClass: 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]',
        isExecutable: false
      };
    case 'DENIED':
    default:
      return {
        label: '当前不可查询',
        badgeClass: 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0]',
        isExecutable: false
      };
  }
}
