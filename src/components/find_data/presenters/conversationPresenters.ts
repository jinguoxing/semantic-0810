import type { ActualExecutionScope, AskPlan, AskRunResult, DataSolutionItem, FindDataResource, FindDataTaskState, PermissionDecision, PermissionRequestRef, ResourceCandidate, ResourceId } from '../model/FindDataTask';
import {
  selectActiveResource,
  selectAskHandoffReadiness,
  selectCandidateById,
  selectCandidateResources,
  selectDiscoverableResources,
  selectResourceById,
  selectResourceFields
} from '../model/findDataSelectors';
import { resourceCoversRange } from '../model/timeRangeUtils';
import { MINHANG_MOCK_RESULT_SCOPE } from '../fixtures/minhangBedSupplyFixture';
import { getPermissionActionLabel } from '../model/permissionActionLabels';

function inlineList(values: string[]): string {
  return values.filter(Boolean).join('、');
}

function resourceRoleSummary(resource: FindDataResource, item: DataSolutionItem): string {
  if (item.role === 'PARTIAL_MATCH') return '仅覆盖当前目标的一部分';
  if (item.role === 'OPTIONAL_DRILLDOWN') return '用于结果明细下钻';
  if (item.role === 'CONDITIONAL_SUPPORT') return '用于补充分析或明细下钻';
  if (/人口/.test(resource.name)) return '提供老年人口基数';
  if (/床位/.test(resource.name)) return '提供对应口径的养老床位规模';
  return resource.roleNote ?? '提供当前分析所需的核心信息';
}

function coreItems(task: FindDataTaskState): DataSolutionItem[] {
  return task.dataSolution.items.filter((item) =>
    item.role === 'CORE' && item.inclusionState !== 'NOT_INCLUDED' &&
    task.resources[item.resourceId]?.availabilityByAction.discover === 'ALLOWED'
  );
}

function formatRange(range?: { start: string; end: string }): string | undefined {
  if (!range) return undefined;
  return range.start === range.end ? range.start : `${range.start} 至 ${range.end}`;
}

function formatScope(scope?: ActualExecutionScope): string | undefined {
  if (!scope) return undefined;
  const values = [scope.region, formatRange(scope.timeRange), scope.grain === 'MONTH' ? '月度' : scope.grain].filter((value): value is string => !!value);
  return values.length > 0 ? values.join('，') : undefined;
}

function actionPermissionSummary(resource: FindDataResource): string {
  switch (resource.availabilityByAction.query) {
    case 'ALLOWED': return '当前可查询';
    case 'REQUESTABLE': return '查询需申请';
    case 'DENIED': return '当前不可查询';
    default: return '查询权限尚未确认';
  }
}

function permissionPhrase(decision: PermissionDecision | undefined): string {
  switch (decision) {
    case 'ALLOWED': return '当前可查询';
    case 'REQUESTABLE': return '当前未获查询许可，但可以申请';
    case 'DENIED': return '当前策略不支持查询申请';
    default: return '查询权限状态尚未确认';
  }
}

function equalStringArrays(first: string[] = [], second: string[] = []): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function requirementChangeLabels(before: FindDataTaskState, effective: FindDataTaskState): string[] {
  const changes: string[] = [];
  const beforeRange = formatRange(before.requirementHypothesis.timeRange);
  const effectiveRange = formatRange(effective.requirementHypothesis.timeRange);
  if (beforeRange !== effectiveRange && effectiveRange) changes.push(`时间范围更新为 ${effectiveRange}`);
  if (before.requirementHypothesis.region !== effective.requirementHypothesis.region && effective.requirementHypothesis.region) changes.push(`区域更新为 ${effective.requirementHypothesis.region}`);
  if (before.requirementHypothesis.populationDefinition !== effective.requirementHypothesis.populationDefinition && effective.requirementHypothesis.populationDefinition) changes.push('老年人口统计口径已更新');
  if (before.requirementHypothesis.bedDefinition !== effective.requirementHypothesis.bedDefinition && effective.requirementHypothesis.bedDefinition) changes.push('养老床位口径已更新');
  if (!equalStringArrays(before.requirementHypothesis.analysisFocus, effective.requirementHypothesis.analysisFocus)) changes.push('分析方向已更新');
  return changes;
}

function coreSolutionItems(task: FindDataTaskState): DataSolutionItem[] {
  return task.dataSolution.items.filter((item) => item.role === 'CORE' && item.inclusionState !== 'NOT_INCLUDED' && !!selectResourceById(task, item.resourceId));
}

function safePreviousResourceName(before: FindDataTaskState, effective: FindDataTaskState, resourceId: ResourceId): string | undefined {
  const current = selectResourceById(effective, resourceId);
  if (current) return current.name;
  if (effective.scenarioKey !== 'minhang_bed_supply') return undefined;
  const previous = selectResourceById(before, resourceId);
  return previous?.name;
}

function describeCandidate(resource: FindDataResource): string {
  if (resource.id === 'r02') return `「${resource.name}」保留当前实时状态，不保留历史月度快照，${actionPermissionSummary(resource)}。`;
  if (resource.id === 'r03') return `「${resource.name}」按月固化，可用于历史月度明细下钻，${actionPermissionSummary(resource)}。`;
  if (resource.id === 'r05') return `「${resource.name}」可作为床位口径替代候选，反映审批或设计容量。`;
  if (resource.id === 'r06') return `「${resource.name}」属于结果下钻资源，可用于解释街镇床位由哪些机构提供，不参与每千名老人床位数的核心计算。`;
  if (resource.id === 'r07') return `「${resource.name}」仅覆盖居家服务订单，属于部分匹配。`;
  return `「${resource.name}」${resource.roleNote ?? '与当前目标相关，可进一步评估。'}`;
}

/** Builds a short, fact-based completion summary for the current effective solution. */
export function buildSolutionCompletionSummary(task: FindDataTaskState): string {
  const core = coreItems(task);
  const partial = task.dataSolution.items.filter((item) => item.role === 'PARTIAL_MATCH' && task.resources[item.resourceId]?.availabilityByAction.discover === 'ALLOWED');
  const openGaps = task.dataSolution.gaps.filter((gap) => gap.status !== 'RESOLVED');
  const resources = core.map((item) => selectResourceById(task, item.resourceId)).filter((resource): resource is FindDataResource => !!resource);
  const requestedRange = task.requirementHypothesis.timeRange;

  if (resources.length > 0) {
    const roles = core.map((item) => {
      const resource = selectResourceById(task, item.resourceId)!;
      return `${resource.name}${resourceRoleSummary(resource, item) ? `（${resourceRoleSummary(resource, item)}）` : ''}`;
    });
    const coverageMatches = requestedRange && resources.every((resource) => resourceCoversRange(resource, requestedRange));
    const sharedMonthlyStreet = resources.every((resource) => {
      const dimensions = resource.analysisDimensions ?? [];
      return resource.timeGrain === 'MONTH' &&
        dimensions.includes('street_town') &&
        dimensions.includes('month');
    });
    const semanticOnly = task.dataSolution.relationshipEvidence.some((evidence) =>
      core.some((item) => item.resourceId === evidence.sourceResourceId) &&
      core.some((item) => item.resourceId === evidence.targetResourceId) &&
      evidence.verificationStatus === 'SEMANTIC_ONLY'
    );
    const sentences = [
      `已形成 ${resources.length} 项核心资源：${inlineList(roles)}。`,
      coverageMatches
        ? `它们的时间覆盖满足当前 ${formatRange(requestedRange)} 的请求。`
        : requestedRange
        ? `当前请求时间为 ${formatRange(requestedRange)}，资源覆盖仍需按方案核验。`
        : undefined,
      sharedMonthlyStreet
        ? '两项资源均按街镇和月份组织，可用于后续供给水平分析。'
        : undefined,
      semanticOnly
        ? '具体维度与时间对齐仍需在分析阶段验证。'
        : undefined
    ].filter((sentence): sentence is string => !!sentence);
    if (partial.length > 0 || openGaps.length > 0) {
      const partialNames = partial.map((item) => selectResourceById(task, item.resourceId)?.name).filter((name): name is string => !!name);
      const gapNames = openGaps.map((gap) => gap.title);
      sentences.push(`核心供给分析已具备基础；${partialNames.length > 0 ? `${inlineList(partialNames)}仅部分匹配当前目标。` : ''}${gapNames.length > 0 ? `仍需注意：${inlineList(gapNames)}。` : ''}`);
    }
    const limitation = task.dataSolution.limitationSummary[0] ?? core.flatMap((item) => item.limitations).at(0);
    if (limitation) sentences.push(`已知限制：${limitation}。`);
    sentences.push('可以查看完整方案，或在需要时继续补充候选数据。');
    return sentences.join('\n\n');
  }

  if (partial.length > 0) {
    const partialNames = partial.map((item) => selectResourceById(task, item.resourceId)?.name).filter((name): name is string => !!name);
    const detail = partial.map((item) => item.limitations.at(0)).find(Boolean) ?? openGaps.at(0)?.description;
    return `当前尚未形成完整核心方案。已发现 ${inlineList(partialNames)}，但它${partialNames.length > 1 ? '们' : ''}仅覆盖当前目标的一部分${detail ? `：${detail}` : '。'}\n\n可以查看当前缺口，或调整目标后继续检索。`;
  }

  if (openGaps.length > 0) {
    return `当前条件下尚未找到足够的可执行核心资源。${openGaps.map((gap) => `${gap.title}：${gap.description}`).join('；')}\n\n可以查看当前缺口，或调整检索条件后重新评估。`;
  }

  return '当前方案尚未形成可展示的核心资源。请继续补充区域、时间范围或目标指标。';
}

/** Describes only this search response; cumulative candidates are never presented as newly found. */
export function buildCandidateDiscoverySummary(
  task: FindDataTaskState,
  returnedResourceIds: ResourceId[],
  addedResourceIds: ResourceId[]
): string {
  const returned = returnedResourceIds
    .map((resourceId) => selectCandidateById(task, resourceId))
    .filter((candidate): candidate is ResourceCandidate => !!candidate);
  const added = addedResourceIds
    .map((resourceId) => selectCandidateById(task, resourceId))
    .filter((candidate): candidate is ResourceCandidate => !!candidate);
  const described = (added.length > 0 ? added : returned)
    .map((candidate) => selectResourceById(task, candidate.resourceId))
    .filter((resource): resource is FindDataResource => !!resource);
  if (described.length === 0) return '本轮没有返回新的可展示候选资源。';

  const subject = added.length > 0
    ? `本轮新增 ${added.length} 项候选资源`
    : `本轮返回 ${returned.length} 项已发现的候选资源`;
  const paragraphs = [`${subject}，尚未自动纳入当前方案。`, described.map(describeCandidate).join('\n')];
  const realtime = described.find((resource) => resource.id === 'r02');
  const monthly = described.find((resource) => resource.id === 'r03');
  if (realtime && monthly && task.requirementHypothesis.timeRange && resourceCoversRange(monthly, task.requirementHypothesis.timeRange)) {
    paragraphs.push(`当前请求需要 ${formatRange(task.requirementHypothesis.timeRange)} 的历史月度信息；月度快照保留相应的月度切片，因此更适合作为明细下钻候选。`);
  }
  if (described.some((resource) => resource.id === 'r05' || resource.id === 'r06' || resource.id === 'r07')) {
    paragraphs.push('这些资源分别用于口径替代、结果下钻和服务使用补充，不能因为同时发现而当作同一组比较对象。');
  }
  return paragraphs.join('\n\n');
}

export function buildComparisonSummary(task: FindDataTaskState): string {
  const ids = task.comparisonModel?.resourceIds ?? [];
  const resources = ids.map((id) => selectResourceById(task, id)).filter((resource): resource is FindDataResource => !!resource);
  if (resources.length !== 2) return '当前还没有形成明确的两项比较对象，请先指定需要比较的资源。';
  const [first, second] = resources;
  const paragraphs = [`「${first.name}」${first.granularity}，${first.timeCoverage}；「${second.name}」${second.granularity}，${second.timeCoverage}。`];
  const recommended = task.comparisonModel?.recommendedResourceId ? selectResourceById(task, task.comparisonModel.recommendedResourceId) : undefined;
  if (recommended && task.requirementHypothesis.timeRange && resourceCoversRange(recommended, task.requirementHypothesis.timeRange)) {
    paragraphs.push(`当前目标需要 ${formatRange(task.requirementHypothesis.timeRange)} 的时间范围；推荐「${recommended.name}」，因为它保留所需的历史月度切片${recommended.availabilityByAction.query === 'ALLOWED' ? '，且当前可查询' : ''}。`);
  } else if (recommended) {
    paragraphs.push(`当前可优先评估「${recommended.name}」，具体时间覆盖仍需结合本次目标确认。`);
  }
  paragraphs.push(`查询权限方面：${first.name}${actionPermissionSummary(first)}；${second.name}${actionPermissionSummary(second)}。`);
  return paragraphs.join('\n\n');
}

export function buildSelectionSuccessSummary(task: FindDataTaskState, resourceId: ResourceId): string {
  const resource = selectResourceById(task, resourceId);
  const item = task.dataSolution.items.find((entry) => entry.resourceId === resourceId);
  if (!resource || !item) return '资源已更新到当前方案。';
  if (item.role === 'PARTIAL_MATCH') {
    return `已记录「${resource.name}」为部分匹配资源。它仅覆盖当前目标的一部分，不进入本次核心计算。`;
  }
  const role = item.role === 'OPTIONAL_DRILLDOWN'
    ? '作为可选明细下钻资源'
    : item.role === 'CONDITIONAL_SUPPORT'
    ? '作为条件支持资源'
    : '作为当前方案资源';
  const paragraphs = [`已将「${resource.name}」加入方案，${role}。${item.role === 'OPTIONAL_DRILLDOWN' ? '它不作为本次核心计算输入。' : ''}`];
  if (item.selectionGroupId) {
    const alternativeResourceIds = item.selectionGroupId === 'population_detail_alternative'
      ? ['r02', 'r03']
      : [];
    const alternatives = selectDiscoverableResources(task)
      .filter((candidate) => candidate.id !== resourceId && alternativeResourceIds.includes(candidate.id))
      .filter((candidate) => task.searchResult?.candidateSnapshot.some((entry) => entry.resourceId === candidate.id));
    if (alternatives.length > 0) paragraphs.push(`${inlineList(alternatives.map((candidate) => `「${candidate.name}」`))}仍保留在候选中，未加入正式方案。`);
  }
  return paragraphs.join('\n\n');
}

export function buildFieldSummary(task: FindDataTaskState, question?: string): string {
  const resource = selectActiveResource(task);
  if (!resource) {
    const names = selectDiscoverableResources(task).slice(0, 3).map((candidate) => `「${candidate.name}」`);
    return names.length > 0
      ? `当前还没有选定要查看的资源。可查看 ${inlineList(names)} 的详情或字段；请先指定其中一项。`
      : '当前还没有可查看字段的资源，请先完成资源检索。';
  }
  if (resource.availabilityByAction.viewMetadata !== 'ALLOWED') {
    if (resource.availabilityByAction.viewMetadata === 'REQUESTABLE') return `「${resource.name}」的字段元数据需要申请查看权限，当前不会展示字段数量或内容。`;
    if (resource.availabilityByAction.viewMetadata === 'DENIED') return `当前没有权限查看「${resource.name}」的字段元数据。`;
    return `「${resource.name}」的字段元数据权限状态尚未确认。`;
  }
  if (resource.type === '正式指标') {
    return `「${resource.name}」是正式指标，不是物理数据表。当前已登记的定义为：${resource.desc} 统计粒度为 ${resource.granularity}${resource.department ? `，来源为 ${resource.department}` : ''}。`;
  }
  if (resource.fields === undefined) return `「${resource.name}」当前尚未登记可展示的字段元数据。`;
  const fields = selectResourceFields(task, resource.id);
  if (fields.length === 0) return `「${resource.name}」已登记字段元数据，但当前没有可展示字段。`;
  const onlyCount = /(多少|几(?:个|项)?字段|字段数|数量)/.test(question ?? '');
  if (onlyCount) return `「${resource.name}」当前登记 ${fields.length} 个字段。`;
  const representative = fields.slice(0, 4).map((field) => field.businessName);
  const goalRelated = fields.filter((field) => field.isKey || /核心|街镇|月份|时间/.test(`${field.role}${field.goalRelation}`)).slice(0, 2);
  return `「${resource.name}」当前登记 ${fields.length} 个字段，包括${inlineList(representative)}${fields.length > representative.length ? '等' : ''}。${goalRelated.length > 0 ? `与当前目标最相关的字段包括${inlineList(goalRelated.map((field) => `${field.businessName}（${field.goalRelation}）`))}。` : '这些是当前已登记的代表性字段。'}\n\n可以查看完整字段列表。`;
}

export function buildRecommendationExplanation(task: FindDataTaskState, resourceId?: ResourceId): string {
  const item = resourceId
    ? task.dataSolution.items.find((entry) => entry.resourceId === resourceId)
    : task.dataSolution.items.find((entry) => entry.inclusionState === 'SELECTED' || entry.inclusionState === 'RECOMMENDED');
  if (!item) return '当前方案还没有可解释的推荐资源。';
  const resource = selectResourceById(task, item.resourceId);
  if (!resource) return '当前推荐资源已不在本任务的可发现范围内。';
  const limitations = item.limitations.length ? item.limitations.join('；') : '当前未登记明确限制';
  return `推荐「${resource.name}」：粒度为${resource.granularity}，时间覆盖为${resource.timeCoverage}。覆盖：${item.coverage.join('；') || '待确认'}。限制：${limitations}。该推荐基于当前已登记的语义与元数据匹配情况。`;
}

export function buildGapSummary(task: FindDataTaskState): string {
  if (task.dataSolution.gaps.length === 0) return '当前方案没有已登记的明确缺口。';
  return task.dataSolution.gaps.map((gap) => `「${gap.title}」：${gap.description}（应对：${gap.mitigation}）`).join('\n');
}

export function buildCoverageSummary(task: FindDataTaskState): string {
  return task.dataSolution.coverageSummary.length
    ? task.dataSolution.coverageSummary.join('\n')
    : '当前方案尚未登记覆盖范围摘要。';
}

/** Builds a one-off explanation from the old task and the effective re-evaluated task. */
export function buildRequirementChangeSummary(before: FindDataTaskState, effective: FindDataTaskState): string {
  const changes = requirementChangeLabels(before, effective);
  const beforeCore = coreSolutionItems(before);
  const effectiveCore = coreSolutionItems(effective);
  const beforeCoreIds = beforeCore.map((item) => item.resourceId);
  const effectiveCoreIds = effectiveCore.map((item) => item.resourceId);
  const retainedCoreIds = effectiveCoreIds.filter((id) => beforeCoreIds.includes(id));
  const addedCoreIds = effectiveCoreIds.filter((id) => !beforeCoreIds.includes(id));
  const removedCoreIds = beforeCoreIds.filter((id) => !effectiveCoreIds.includes(id));
  const beforePartialIds = before.dataSolution.items.filter((item) => item.role === 'PARTIAL_MATCH').map((item) => item.resourceId);
  const addedPartial = effective.dataSolution.items.filter((item) => item.role === 'PARTIAL_MATCH' && !beforePartialIds.includes(item.resourceId));
  const paragraphs: string[] = [];

  if (changes.length > 0) paragraphs.push(`已按新条件完成重评：${inlineList(changes)}。`);
  else paragraphs.push('已完成当前需求的重新评估。');

  if (effectiveCore.length === 0) {
    const hasPartial = effective.dataSolution.items.some((item) => item.role === 'PARTIAL_MATCH');
    paragraphs.push(hasPartial
      ? '当前目标已切换，原人口与床位核心方案不再用于新目标；目前只形成部分匹配资源和覆盖缺口。'
      : '新条件已记录，但当前没有形成足够的核心方案。旧方案不能继续作为新需求的有效方案。');
  } else if (beforeCoreIds.length > 0 && equalStringArrays(beforeCoreIds, effectiveCoreIds)) {
    const range = effective.requirementHypothesis.timeRange;
    const coreResources = effectiveCore.map((item) => selectResourceById(effective, item.resourceId)).filter((resource): resource is FindDataResource => !!resource);
    const coversRange = !!range && coreResources.every((resource) => resourceCoversRange(resource, range));
    paragraphs.push(coversRange
      ? '原核心指标仍能覆盖本次请求，资源组合保持不变。'
      : '核心资源组合保持不变，覆盖范围仍需结合当前方案确认。');
  } else {
    const retainedNames = retainedCoreIds.map((id) => safePreviousResourceName(before, effective, id)).filter((name): name is string => !!name);
    const addedNames = addedCoreIds.map((id) => selectResourceById(effective, id)?.name).filter((name): name is string => !!name);
    const removedNames = removedCoreIds.map((id) => safePreviousResourceName(before, effective, id)).filter((name): name is string => !!name);
    if (retainedNames.length > 0) paragraphs.push(`${inlineList(retainedNames)}保持不变。`);
    if (addedNames.length > 0 && removedNames.length > 0) {
      paragraphs.push(`床位核心指标由${inlineList(removedNames)}替换为${inlineList(addedNames)}。`);
    } else if (addedNames.length > 0) {
      paragraphs.push(`新增核心资源：${inlineList(addedNames)}。`);
    }
  }

  if (before.requirementHypothesis.bedDefinition !== effective.requirementHypothesis.bedDefinition && /核定/.test(effective.requirementHypothesis.bedDefinition ?? '')) {
    paragraphs.push('后续分析反映核定容量，不代表实际可用容量。');
  }

  if (addedPartial.length > 0) {
    const names = addedPartial.map((item) => selectResourceById(effective, item.resourceId)?.name).filter((name): name is string => !!name);
    const hasOpenGap = effective.dataSolution.gaps.some((gap) => gap.status !== 'RESOLVED');
    paragraphs.push(`新增${inlineList(names)}等部分匹配资源${hasOpenGap ? '，完整服务使用缺口仍保留。' : '。'}`);
  }

  const oldPlanInvalidated = !!before.askPlan && !effective.askPlan;
  if (oldPlanInvalidated) {
    paragraphs.push('原分析计划已失效，需要按当前需求重新准备分析。');
    if (before.askPlan?.lastRunResult?.success) paragraphs.push('原分析结果不再适用于新需求。');
  }

  const readiness = selectAskHandoffReadiness(effective);
  paragraphs.push(readiness.ready
    ? '可以查看最新方案，或重新确认分析。'
    : '可以调整条件后继续评估。');
  return paragraphs.join('\n\n');
}

/** Explains query permissions by their effect on the current task, not as a matrix. */
export function buildPermissionImpactSummary(task: FindDataTaskState): string {
  const core = coreSolutionItems(task);
  if (core.length === 0) return '当前尚未形成可执行核心方案。是否具备查询权限需要在形成核心资源后再判断。';
  const coreResources = core.map((item) => selectResourceById(task, item.resourceId)).filter((resource): resource is FindDataResource => !!resource);
  const blocked = coreResources.filter((resource) => resource.availabilityByAction.query !== 'ALLOWED');
  if (blocked.length > 0) {
    const details = blocked.map((resource) => `「${resource.name}」${permissionPhrase(resource.availabilityByAction.query)}`).join('；');
    return `当前核心计算受到查询权限影响：${details}。在核心查询权限就绪前，不能完成本次核心计算。`;
  }
  const requestableCandidates = selectCandidateResources(task)
    .map((candidate) => selectResourceById(task, candidate.resourceId))
    .filter((resource): resource is FindDataResource => !!resource)
    .filter((resource) => !coreResources.some((coreResource) => coreResource.id === resource.id) && resource.availabilityByAction.query === 'REQUESTABLE');
  const coreLead = `${coreResources.length} 项核心指标当前可查询。`;
  if (requestableCandidates.length > 0) {
    return `${coreLead}${inlineList(requestableCandidates.map((resource) => `「${resource.name}」`))}仍需申请查询权限，这不阻塞当前核心计算；执行前仍会重新校验权限。`;
  }
  return `${coreLead}当前没有发现会阻塞核心计算的查询权限问题；执行前仍会重新校验权限。`;
}

export function buildPermissionRequestSubmittedSummary(task: FindDataTaskState, request: PermissionRequestRef): string {
  const names = request.resourceIds.map((id) => selectResourceById(task, id)?.name).filter((name): name is string => !!name);
  const label = getPermissionActionLabel(request.actionType);
  return `已提交${inlineList(names)}的${label}申请。申请编号：${request.requestId}；当前状态：已提交，等待处理。\n\n申请已提交，权限尚未获得。`;
}

export function buildPermissionRecheckSummary(
  task: FindDataTaskState,
  result: { decision: 'ALLOWED' | 'BLOCKED' | 'CHANGED'; updatedPermissions: Record<ResourceId, { query: PermissionDecision }> },
  serviceFailed = false
): string {
  if (serviceFailed) return '权限状态未能完成确认，暂不能执行。当前方案和已有权限记录没有因此被认定为拒绝；可以稍后重新校验。';
  if (result.decision === 'ALLOWED') return '本次核心资源查询权限重检已通过。正式执行仍会遵守原有运行门禁。';
  const coreIds = task.askPlan?.coreResourceIds ?? coreSolutionItems(task).map((item) => item.resourceId);
  const affected = coreIds.map((id) => {
    const resource = selectResourceById(task, id);
    const decision = result.updatedPermissions[id]?.query ?? resource?.availabilityByAction.query;
    return resource ? `「${resource.name}」${permissionPhrase(decision)}` : undefined;
  }).filter((entry): entry is string => !!entry);
  if (result.decision === 'CHANGED') return `本次权限快照发生变化：${inlineList(affected)}。请先确认新的可执行范围，再继续分析。`;
  return affected.length > 0
    ? `当前不能执行：${inlineList(affected)}。请根据当前状态申请权限或稍后重新校验。`
    : '当前不能执行，因为核心资源查询权限尚未满足。请先重新校验权限。';
}

export function buildAskRunFailureSummary(task: FindDataTaskState, error?: string): string {
  const hadHistoricalResult = task.askPlan?.lastRunResult?.success;
  const stable = hadHistoricalResult ? '上次结果仍作为历史结果保留，但不是本次执行结果。' : '本次没有形成新的成功结果。';
  if (/权限/.test(error ?? '')) return `${stable}\n\n权限尚未完成确认，请重新校验后再执行。`;
  if (/需求|检索|计划/.test(error ?? '')) return `${stable}\n\n当前需求或计划已变化，请重新准备分析计划。`;
  if (/未连接|无法连接/.test(error ?? '')) return `${stable}\n\n分析服务尚未连接，暂时无法执行。`;
  return `${stable}\n\n可以在条件确认后，通过当前分析计划再次执行。`;
}

export function buildOperationFailureSummary(
  task: FindDataTaskState,
  operation: 'TURN' | 'ACTION' | 'SEARCH' | 'PERMISSION_CHECK' | 'ASK_RUN',
  actionCode?: string,
  uncertain = false
): string {
  if (operation === 'PERMISSION_CHECK') return buildPermissionRecheckSummary(task, { decision: 'BLOCKED', updatedPermissions: {} }, true);
  if (operation === 'ASK_RUN') return buildAskRunFailureSummary(task, '');
  if (actionCode === 'REVISE_REQUIREMENT') {
    return uncertain
      ? '本次操作状态尚未确认。当前仍显示最后一次已读取的任务状态；请重新读取任务后再决定是否继续修改。'
      : '本次修改没有保存成功，当前仍是原需求，原方案也没有因此被替换。可以调整条件后重试。';
  }
  if (actionCode === 'SELECT_RESOURCE' || actionCode === 'EVALUATE_AND_ADD') {
    return '本次资源选择未完成，当前方案没有新增资源。可以在候选列表中重试。';
  }
  if (actionCode === 'CREATE_PERMISSION_REQUEST') {
    return uncertain
      ? '本次权限申请状态尚未确认，当前不认定为已提交。请先读取当前申请记录后再决定是否重试。'
      : '本次权限申请未完成，当前没有新增已提交申请。可以检查申请范围后重试。';
  }
  if (operation === 'TURN' || operation === 'SEARCH') {
    return task.dataSolution.state === 'READY'
      ? '本次补充检索未完成，原方案未因这次失败而改变。可以稍后重试。'
      : '本次检索未完成，当前还没有形成新的有效方案。可以补充条件后重试。';
  }
  return '本次操作未完成，当前已形成的任务内容保持不变。请根据当前方案继续操作或稍后重试。';
}

export function buildPermissionSummary(task: FindDataTaskState): string {
  const items = task.dataSolution.items.map((item) => {
    const resource = selectResourceById(task, item.resourceId);
    if (!resource) return undefined;
    const decision = resource.availabilityByAction.query;
    return `${resource.name}：${decision === 'ALLOWED' ? '可查询' : decision === 'REQUESTABLE' ? '需申请' : '不可查询'}`;
  }).filter(Boolean);
  return items.length ? items.join('；') : '当前方案没有可检查的资源权限。';
}

export function buildAskPlanScopeDisclosure(plan: AskPlan, dataOrigin?: AskRunResult['dataOrigin']): string {
  const requested = formatRange(plan.timeRange);
  const actualScope = dataOrigin === 'MOCK_FIXTURE' ? MINHANG_MOCK_RESULT_SCOPE : undefined;
  const actual = formatScope(actualScope);
  if (actual && requested && formatRange(actualScope?.timeRange) !== requested) {
    return `本次计划请求范围为 ${requested}。当前演示实际仅返回 ${actual} 的样例，不提供该请求范围内的趋势分析。`;
  }
  if (actual) return `当前演示预计返回 ${actual} 的样例结果。`;
  return requested
    ? `本次计划请求范围为 ${requested}。当前执行服务尚未提供可确认的实际数据期间，结果返回后以服务端范围为准。`
    : '当前执行服务尚未提供可确认的实际数据范围，结果返回后以服务端范围为准。';
}

export function buildAskPlanPreparedSummary(plan: AskPlan, dataOrigin?: AskRunResult['dataOrigin']): string {
  return `比较基准已确认，分析计划已准备完成。${buildAskPlanScopeDisclosure(plan, dataOrigin)}\n\n正式计算前仍需执行权限重校验。`;
}

export function buildAskRunCompletionSummary(plan: AskPlan, result: AskRunResult): string {
  const artifact = result.resultArtifact;
  if (!result.success || !artifact) return '分析未成功完成，当前没有可展示的分析结论。';
  const paragraphs = ['分析已完成。'];
  if (artifact.benchmarkValue) paragraphs.push(`${artifact.benchmarkLabel}为 ${artifact.benchmarkValue}。`);
  else paragraphs.push(artifact.summary);
  if (artifact.totalPopulation || artifact.totalBeds) {
    paragraphs.push(`本次返回的汇总中，60 岁以上常住人口约 ${artifact.totalPopulation ?? '未返回'}，${plan.calculationSpec.numerator.replace('（正式指标）', '')}共 ${artifact.totalBeds ?? '未返回'}。`);
  }
  if (artifact.townResults.length > 0) {
    paragraphs.push(`本次返回的街镇记录包括：${artifact.townResults.slice(0, 2).map((town) => `${town.townName} ${town.supplyRatio}（${town.comparisonNote}）`).join('；')}。`);
  }
  if (typeof artifact.belowBenchmarkCount === 'number') {
    paragraphs.push(artifact.belowBenchmarkCount === 0
      ? '服务返回的统计显示，本次结果范围内未发现低于当前比较基准的街镇。'
      : `服务返回的统计显示，本次结果范围内有 ${artifact.belowBenchmarkCount} 个街镇低于当前比较基准。`);
  }
  const actualScope = formatScope(artifact.actualScope);
  paragraphs.push(actualScope
    ? `本次实际分析范围：${actualScope}。`
    : '本次结果尚未提供可确认的实际数据期间。');
  paragraphs.push(result.dataOrigin === 'MOCK_FIXTURE' ? '结果来源：演示数据。' : '结果来源：实时查询服务。');
  paragraphs.push(`结论边界：${artifact.boundaryNotice}`);
  paragraphs.push('可以查看完整结果和计算依据。');
  return paragraphs.join('\n\n');
}

export function buildActualScopeLabel(scope?: ActualExecutionScope): string {
  return formatScope(scope) ?? '实际数据范围未提供';
}
