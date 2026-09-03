import {
  FindDataTaskState,
  FindDataResource,
  ResourceId,
  DataSolutionItem,
  SolutionGap,
  FieldMetadata
} from './FindDataTask';

/**
 * Filter out any resources where discover === 'DENIED'.
 * Strict rule: discover = DENIED resources must never appear in search results,
 * catalog listings, solution items, counts, or assistant summaries.
 */
export function selectDiscoverableResources(task: FindDataTaskState): FindDataResource[] {
  return Object.values(task.resources).filter(
    (res) => res.availabilityByAction.discover !== 'DENIED'
  );
}

export function selectDiscoverableResourceMap(task: FindDataTaskState): Record<ResourceId, FindDataResource> {
  const map: Record<ResourceId, FindDataResource> = {};
  for (const res of Object.values(task.resources)) {
    if (res.availabilityByAction.discover !== 'DENIED') {
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
  if (!res || res.availabilityByAction.discover === 'DENIED') {
    return undefined;
  }
  return res;
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

/**
 * All solution items where discover !== 'DENIED'.
 * Used in Recommended View: includes REQUESTABLE resources with recommendation notes.
 */
export function selectRecommendedSolutionItems(task: FindDataTaskState): DataSolutionItem[] {
  const discoverableMap = selectDiscoverableResourceMap(task);
  return task.dataSolution.items.filter((item) => {
    const res = discoverableMap[item.resourceId];
    return res !== undefined && item.inclusionState !== 'NOT_INCLUDED';
  });
}

/**
 * Executable subset:
 * Derived from the SAME DataSolution. Only items where query === 'ALLOWED' are strictly executable.
 */
export function selectExecutableSolutionItems(task: FindDataTaskState): DataSolutionItem[] {
  const recommended = selectRecommendedSolutionItems(task);
  return recommended.filter((item) => item.availabilityByAction.query === 'ALLOWED');
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
      ? selectRecommendedSolutionItems(task) // in executable mode, show all but mark non-allowed as not executable
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

  return groups;
}

export function selectSolutionCoverage(task: FindDataTaskState): string[] {
  return task.dataSolution.coverageSummary;
}

export function selectSolutionGaps(task: FindDataTaskState): SolutionGap[] {
  return task.dataSolution.gaps;
}

/**
 * Derives user-friendly display text for query permission
 */
export function getQueryStatusDisplay(item: DataSolutionItem): {
  label: string;
  badgeClass: string;
  isExecutable: boolean;
} {
  const queryDecision = item.availabilityByAction.query;
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
