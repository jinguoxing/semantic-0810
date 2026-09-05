import {
  FindDataTaskState,
  FindDataResource,
  ResourceId,
  DataSolutionItem,
  SolutionGap,
  FieldMetadata,
  AvailabilityByAction,
  ResourceCandidate,
  ExecutionAssessment,
  AskPlan,
  ConversationTurn
} from './FindDataTask';
import { getResourceRangeIntersection, resourceCoversRange } from './timeRangeUtils';

export type AskHandoffReadinessCode = 'READY' | 'SOLUTION_NOT_READY' | 'MISSING_CORE_RESOURCES' | 'PARTIAL_MATCH_ONLY' | 'NO_EXECUTABLE_CORE' | 'RELATIONSHIP_CONFLICT';
export interface AskHandoffReadiness {
  ready: boolean;
  code: AskHandoffReadinessCode;
  message: string;
  coreResourceIds: ResourceId[];
  missingRequirements?: string[];
  requiresRuntimeAlignmentValidation?: boolean;
}

export function selectAskHandoffReadiness(task: FindDataTaskState): AskHandoffReadiness {
  if (task.dataSolution.state !== 'READY') return { ready: false, code: 'SOLUTION_NOT_READY', message: '当前数据方案尚未完成评估。', coreResourceIds: [] };
  const coreItems = task.dataSolution.items.filter((item) => item.role === 'CORE' && item.inclusionState !== 'NOT_INCLUDED' && task.resources[item.resourceId]?.availabilityByAction.discover === 'ALLOWED');
  const coreResourceIds = coreItems.map((item) => item.resourceId);
  if (coreItems.length === 0 && task.dataSolution.items.some((item) => item.role === 'PARTIAL_MATCH')) return { ready: false, code: 'PARTIAL_MATCH_ONLY', message: '当前只有部分匹配资源，尚未形成可执行的核心数据方案。', coreResourceIds: [] };
  if (task.scenarioKey === 'minhang_bed_supply') {
    const hasPopulation = coreResourceIds.includes('r01');
    const hasBeds = coreResourceIds.includes('r04') || coreResourceIds.includes('r05');
    if (!hasPopulation || !hasBeds) return { ready: false, code: 'MISSING_CORE_RESOURCES', message: '当前方案尚未同时覆盖老年人口规模和养老床位口径。', coreResourceIds, missingRequirements: [!hasPopulation ? '老年人口规模' : '', !hasBeds ? '养老床位口径' : ''].filter(Boolean) };
  }
  if (coreItems.length === 0) return { ready: false, code: 'NO_EXECUTABLE_CORE', message: '当前方案尚未形成可执行核心资源。', coreResourceIds };
  const coreConflict = task.dataSolution.relationshipEvidence.some((evidence) => coreResourceIds.includes(evidence.sourceResourceId) && coreResourceIds.includes(evidence.targetResourceId) && evidence.verificationStatus === 'CONFLICT');
  if (coreConflict) return { ready: false, code: 'RELATIONSHIP_CONFLICT', message: '核心资源关系存在冲突，暂不能准备分析计划。', coreResourceIds };
  const semanticOnly = task.dataSolution.relationshipEvidence.some((evidence) => coreResourceIds.includes(evidence.sourceResourceId) && coreResourceIds.includes(evidence.targetResourceId) && evidence.verificationStatus === 'SEMANTIC_ONLY');
  return { ready: true, code: 'READY', message: semanticOnly ? '核心资源可以围绕街镇和月份组织分析，但具体维度与时间对齐将在分析阶段验证。' : '当前核心资源已满足分析计划准备条件。', coreResourceIds, requiresRuntimeAlignmentValidation: semanticOnly };
}

export function validateAnalyticalAlignment(task: FindDataTaskState, askPlan: AskPlan): { allowed: boolean; status: 'VALIDATED' | 'INSUFFICIENT_METADATA' | 'RELATIONSHIP_CONFLICT' | 'TIME_NOT_ALIGNED' | 'GRAIN_NOT_ALIGNED'; details: string[] } {
  const core = askPlan.coreResourceIds.map((id) => task.resources[id]).filter((resource): resource is FindDataResource => !!resource);
  if (core.length !== askPlan.coreResourceIds.length) return { allowed: false, status: 'INSUFFICIENT_METADATA', details: ['核心资源不存在。'] };
  const relationship = task.dataSolution.relationshipEvidence.filter((evidence) => askPlan.coreResourceIds.includes(evidence.sourceResourceId) && askPlan.coreResourceIds.includes(evidence.targetResourceId));
  if (relationship.some((evidence) => evidence.verificationStatus === 'CONFLICT')) return { allowed: false, status: 'RELATIONSHIP_CONFLICT', details: ['核心资源关系存在冲突。'] };
  if (!relationship.some((evidence) => evidence.relationType === 'ANALYTICAL_COMPATIBILITY' || evidence.relationType === 'TECHNICAL_JOIN')) return { allowed: false, status: 'INSUFFICIENT_METADATA', details: ['缺少核心资源分析关系证据。'] };
  const requiredDimensions = askPlan.alignmentRequirement?.requiredDimensions ?? ['street_town', 'month'];
  if (core.some((resource) => !resource.analysisDimensions || requiredDimensions.some((dimension) => !resource.analysisDimensions!.includes(dimension)))) return { allowed: false, status: 'INSUFFICIENT_METADATA', details: ['核心资源缺少共同分析维度。'] };
  const requiredGrain = askPlan.alignmentRequirement?.requiredTimeGrain ?? 'MONTH';
  if (core.some((resource) => resource.timeGrain !== requiredGrain)) return { allowed: false, status: 'GRAIN_NOT_ALIGNED', details: ['核心资源时间粒度不一致。'] };
  if (askPlan.timeRange && (core.some((resource) => !resourceCoversRange(resource, askPlan.timeRange)) || !getResourceRangeIntersection(core))) return { allowed: false, status: 'TIME_NOT_ALIGNED', details: ['核心资源的时间覆盖交集不能满足分析时间范围。'] };
  return { allowed: true, status: 'VALIDATED', details: ['已验证街镇、月份、月度粒度与时间覆盖交集；验证仅适用于本次分析。'] };
}

export function getDataSolutionDisplayState(task: FindDataTaskState): { code: 'EMPTY' | 'EVALUATING' | 'READY_COMPLETE' | 'READY_PARTIAL' | 'GAP_ONLY' | 'STALE'; label: string } {
  if (task.dataSolution.state === 'EMPTY') return { code: 'EMPTY', label: '尚未形成方案' };
  if (task.dataSolution.state === 'EVALUATING') return { code: 'EVALUATING', label: '正在重新评估' };
  if (task.dataSolution.state === 'STALE') return { code: 'STALE', label: '需求已变化，方案待更新' };
  const hasUnresolvedGap = task.dataSolution.gaps.some((gap) => gap.status === 'OPEN' || gap.status === 'ACKNOWLEDGED');
  if (task.dataSolution.items.length === 0 && hasUnresolvedGap) return { code: 'GAP_ONLY', label: '当前仅发现缺口' };
  if (task.dataSolution.items.some((item) => item.role === 'PARTIAL_MATCH') || hasUnresolvedGap) {
    return { code: 'READY_PARTIAL', label: '部分覆盖' };
  }
  const readiness = selectAskHandoffReadiness(task);
  if (readiness.ready) return { code: 'READY_COMPLETE', label: '推荐就绪' };
  return { code: 'READY_PARTIAL', label: '部分覆盖' };
}

/** Returns whether an action recorded in an older conversation turn is still safe to execute. */
export function canExecuteTaskAction(task: FindDataTaskState, actionCode: import('./FindDataTask').TaskActionCode, payload?: Record<string, unknown>): boolean {
  if (task.pendingOperation && actionCode !== 'CLOSE_SURFACE') return false;
  switch (actionCode) {
    case 'OPEN_SOLUTION': return task.dataSolution.items.length > 0 || task.dataSolution.gaps.length > 0;
    case 'OPEN_ACCESS': return selectPermissionRelevantItems(task).length > 0;
    case 'OPEN_ASK_PLAN': return Boolean(task.askPlan && selectAskHandoffReadiness(task).ready);
    case 'REGENERATE_ASK_PLAN': return selectAskHandoffReadiness(task).ready;
    case 'OPEN_COMPARE': return (payload?.resourceIds as ResourceId[] | undefined ?? task.comparisonModel?.resourceIds ?? [])
      .filter((id) => Boolean(selectCandidateById(task, id))).length >= 2;
    case 'OPEN_FIELDS': {
      const id = payload?.resourceId as ResourceId | undefined ?? task.activeResourceId;
      return Boolean(id && task.resources[id]?.availabilityByAction.discover === 'ALLOWED' && task.resources[id]?.availabilityByAction.viewMetadata === 'ALLOWED');
    }
    case 'SELECT_RESOURCE': return Boolean(selectCandidateById(task, payload?.resourceId as ResourceId | undefined));
    case 'EVALUATE_AND_ADD': return Boolean(selectCandidateById(task, payload?.resourceId as ResourceId | undefined));
    default: return true;
  }
}

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
  return resource?.availabilityByAction.viewMetadata === 'ALLOWED' ? resource.fields || [] : [];
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

export type CandidateSolutionStatus = 'INCLUDED' | 'PARTIAL_RECORDED' | 'NOT_INCLUDED';

export function selectCandidateSolutionStatus(task: FindDataTaskState, resourceId: ResourceId): CandidateSolutionStatus {
  const item = task.dataSolution.items.find((entry) => entry.resourceId === resourceId);
  if (item?.role === 'PARTIAL_MATCH') return 'PARTIAL_RECORDED';
  if (item && item.inclusionState !== 'NOT_INCLUDED') return 'INCLUDED';
  return 'NOT_INCLUDED';
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

export interface ConversationTurnApplicability {
  historical: boolean;
  message?: string;
  kind?: ConversationTurn['source']['kind'];
}

/**
 * Classifies only summaries that carry a source reference. Older turns remain
 * intact; when their provenance is absent we communicate that uncertainty
 * rather than inventing a revision.
 */
export function selectConversationTurnApplicability(
  task: FindDataTaskState,
  turn: ConversationTurn
): ConversationTurnApplicability {
  const source = turn.source;
  if (!source) {
    return task.requirementRevision > 1 && turn.sender === 'ASSISTANT'
      ? { historical: true, message: '历史内容，当前适用性需结合最新方案确认。' }
      : { historical: false };
  }

  const requirementChanged = source.requirementRevision !== undefined &&
    source.requirementRevision < task.requirementRevision;
  if (requirementChanged) {
    switch (source.kind) {
      case 'SOLUTION':
        return { historical: true, kind: source.kind, message: '历史方案，当前需求已更新。' };
      case 'CANDIDATES':
        return { historical: true, kind: source.kind, message: '历史候选列表，当前需求已更新，候选情况以最新为准。' };
      case 'ASK_PLAN':
        return { historical: true, kind: source.kind, message: '历史分析计划，当前需求已更新。' };
      case 'ASK_RESULT':
        return { historical: true, kind: source.kind, message: '历史结果，尚未按新需求重新计算。' };
      default:
        return { historical: true, kind: source.kind, message: '历史权限信息，当前需求已更新，请以当前方案为准。' };
    }
  }

  if (source.kind === 'CANDIDATES' && source.searchRevision !== undefined && source.searchRevision < task.searchRevision) {
    return { historical: true, kind: source.kind, message: '历史候选列表，不是最新候选列表。' };
  }
  if (source.kind === 'ASK_PLAN' && source.askPlanId && source.askPlanId !== task.askPlan?.id) {
    return { historical: true, kind: source.kind, message: '历史分析计划，当前计划已更新。' };
  }
  if (source.kind === 'ASK_RESULT' && source.resultExecutedAt && source.resultExecutedAt !== task.askPlan?.lastRunResult?.executedAt) {
    return { historical: true, kind: source.kind, message: '上次分析结果，当前结果已更新。' };
  }
  return { historical: false, kind: source.kind };
}
