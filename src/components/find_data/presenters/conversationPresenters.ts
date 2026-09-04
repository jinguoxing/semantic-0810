import { FindDataTaskState, ResourceId } from '../model/FindDataTask';
import { selectActiveResource, selectResourceById, selectResourceFields } from '../model/findDataSelectors';

export function buildFieldSummary(task: FindDataTaskState): string {
  const resource = selectActiveResource(task);
  if (!resource) return '当前还没有选定资源，请先从候选结果中选择一个资源。';
  const fields = selectResourceFields(task, resource.id);
  if (fields.length === 0) return `「${resource.name}」当前尚未登记可展示的字段元数据。`;
  return `「${resource.name}」当前登记 ${fields.length} 个字段，包括${fields.slice(0, 6).map((field) => field.businessName).join('、')}${fields.length > 6 ? '等' : ''}。`;
}

export function buildRecommendationExplanation(task: FindDataTaskState, resourceId?: ResourceId): string {
  const item = resourceId
    ? task.dataSolution.items.find((entry) => entry.resourceId === resourceId)
    : task.dataSolution.items.find((entry) => entry.inclusionState === 'SELECTED' || entry.inclusionState === 'RECOMMENDED');
  if (!item) return '当前方案还没有可解释的推荐资源。';
  const resource = selectResourceById(task, item.resourceId);
  if (!resource) return '当前推荐资源已不在本任务的可发现范围内。';
  const evidence = item.evidenceRefs.length ? item.evidenceRefs.join('；') : '尚无额外证据引用';
  const limitations = item.limitations.length ? item.limitations.join('；') : '当前未登记明确限制';
  return `推荐「${resource.name}」：粒度为${resource.granularity}，时间覆盖为${resource.timeCoverage}。覆盖：${item.coverage.join('；') || '待确认'}。限制：${limitations}。根据当前语义与元数据证据：${evidence}。`;
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

export function buildPermissionSummary(task: FindDataTaskState): string {
  const items = task.dataSolution.items.map((item) => {
    const resource = selectResourceById(task, item.resourceId);
    if (!resource) return undefined;
    const decision = resource.availabilityByAction.query;
    return `${resource.name}：${decision === 'ALLOWED' ? '可查询' : decision === 'REQUESTABLE' ? '需申请' : '不可查询'}`;
  }).filter(Boolean);
  return items.length ? items.join('；') : '当前方案没有可检查的资源权限。';
}
