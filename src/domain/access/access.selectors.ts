import { useMemo } from 'react';
import { buildAccessRecommendation } from './accessDecision';
import { useAccessStore } from './access.store';
import type { AccessRequest, AccessSubmission, EffectiveGrant, TaskReadiness } from './access.types';
import { SUBTYPE_PRESENTATION, TYPE_PRESENTATION } from '../../components/resourcePresentation';

export interface ResourceRequestViewModel {
  id: string; name: string; typeBadge: string; roleBadge: '核心数据' | '补充数据' | '参考数据'; operation: '查询数据' | '数据导出' | 'API调用';
  accessState: 'GRANTED' | 'PROCESSING' | 'DENIED' | 'EXPIRED'; stateLabel: string; scopeSummary: string; validity: string;
  isAutoDecided?: boolean; autoDecideNote?: string; processingNote?: string; deniedNote?: string; expiredNote?: string;
  suggestedAction?: { label: string; actionType: 'reapply_suggested' | 'reapply' | 'view_resource' };
  detail: { region: string; allowedFields: string[]; protectionRules: string[]; restrictions: string; decisionMethod: '系统自动处理' | '人工访问决策'; decisionReason: string; submittedAt: string; purpose: string };
}
export interface MyAccessSubmissionViewModel {
  id: string; taskId: string; solutionId: string; taskTitle: string; typeTag: string; purposeDescription: string; source: string; submittedTime: string; updatedTime: string; createdAt: string; updatedAt: string; accessProgress: string;
  taskReadiness: TaskReadiness; taskReadinessLabel: string; taskReadinessNote: string;
  primaryAction: { label: string; actionType: 'resume' | 'resume_degraded' | 'check_progress' | 'adjust_plan' | 'reapply' };
  secondaryActions: Array<{ label: string; actionType: 'view_limits' | 'back_to_solution' | 'view_submission_detail' | 'reapply_necessary' }>;
  requests: ResourceRequestViewModel[]; limitations?: { canDo: string[]; restricted: string[]; reason: string };
}
export interface AccessReviewItemViewModel {
  id: string; requestId: string; submissionId: string; resourceId: string; resourceName: string; resourceType: 'DATA_ASSET' | 'API' | 'OTHER'; resourceSubType?: string;
  resourceActionSummary: string; suggestedProtection: string; applicantName: string; applicantAvatar?: string; applicantDepartment: string;
  requestedAction: '查询数据' | '调用服务' | '导出数据' | '订阅更新'; actionTypeKey: 'QUERY' | 'INVOKE' | 'EXPORT' | 'SUBSCRIBE'; parentSubmissionTitle: string; parentSubmissionContext: string;
  reviewReasonBadge: string; reviewReasonDescription: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; submittedAtText: string; submittedExactTime: string; timestamp: number;
  isAssignedToMe: boolean; departmentCategory: 'population' | 'business' | 'civil' | 'policy' | 'tech'; departmentCategoryName: string;
  details: { dataFieldsSummary: string[]; maskedFields: string[]; excludedFields: string[]; requestPurpose: string; requestedDuration: string; policyTriggerRule: string; suggestedScope: string };
}

const operationLabels = { QUERY: '查询数据', EXPORT: '数据导出', INVOKE: 'API调用', SUBSCRIBE: '订阅更新' } as const;
const operationLabel = (operation: AccessRequest['operation']) => operationLabels[operation];
const dateLabel = (value: string) => new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const typeLabel = (resourceType: string) => {
  if (resourceType.startsWith('DATA_ASSET')) return TYPE_PRESENTATION.DATA_ASSET;
  if (resourceType === 'DATA_API') return TYPE_PRESENTATION.DATA_API;
  return TYPE_PRESENTATION[resourceType] ?? '数据资产';
};
const readinessInfo = (readiness: TaskReadiness): [string, string, string, MyAccessSubmissionViewModel['primaryAction']['actionType']] => {
  if (readiness === 'WAITING') return ['等待所需资源', '当前仍有必要资源等待人工处理，完整任务暂不能继续。', '查看进度', 'check_progress'];
  if (readiness === 'READY') return ['可继续', '当前获批范围已满足原分析任务所需的数据能力。', '继续分析', 'resume'];
  if (readiness === 'DEGRADED') return ['受限可继续', '当前授权可支持部分任务目标，敏感或非必要范围已被收敛。', '按当前授权继续', 'resume_degraded'];
  return ['暂无法继续', '当前所需核心资源尚未获得访问权限，可调整数据方案或重新申请必要范围。', '调整数据方案', 'adjust_plan'];
};

function grantFor(request: AccessRequest, grants: EffectiveGrant[]) { return grants.find((grant) => grant.requestId === request.id && grant.state === 'ACTIVE'); }
function toRequestView(request: AccessRequest, grants: EffectiveGrant[]): ResourceRequestViewModel {
  const grant = grantFor(request, grants);
  const state = request.state === 'GRANTED' || request.state === 'GRANTED_WITH_LIMITS' ? 'GRANTED' : request.state === 'DENIED' ? 'DENIED' : request.state === 'EXPIRED' ? 'EXPIRED' : 'PROCESSING';
  const protections = grant?.protections.map((rule) => rule.description) ?? [];
  return {
    id: request.id, name: request.resourceName, typeBadge: typeLabel(request.resourceType), roleBadge: request.required ? '核心数据' : '参考数据', operation: operationLabel(request.operation) as ResourceRequestViewModel['operation'], accessState: state,
    stateLabel: request.state === 'GRANTED_WITH_LIMITS' ? '已授权（受限）' : state === 'GRANTED' ? '已授权' : state === 'PROCESSING' ? '处理中' : state === 'DENIED' ? '未授权' : '已过期',
    scopeSummary: request.requestedScope.fields?.join(' · ') ?? '已核定范围', validity: grant?.expiresAt ? `至 ${new Intl.DateTimeFormat('zh-CN').format(new Date(grant.expiresAt))}` : state === 'PROCESSING' ? '待生效' : '未生效',
    isAutoDecided: request.riskLevel === 'LOW' && state === 'GRANTED', autoDecideNote: request.riskLevel === 'LOW' ? '根据现有策略自动处理' : undefined,
    processingNote: state === 'PROCESSING' ? '当前请求需要人工访问决策。' : undefined, deniedNote: state === 'DENIED' ? '不符合受保护数据资源使用政策，建议调整为最小必要范围。' : undefined,
    expiredNote: state === 'EXPIRED' ? '授权已到期，请按当前任务需要重新申请。' : undefined,
    suggestedAction: state === 'DENIED' ? { label: '按建议重新申请', actionType: 'reapply_suggested' } : undefined,
    detail: { region: request.requestedScope.geography?.regionNames?.join('、') ?? '已核定区域', allowedFields: request.requestedScope.fields ?? [], protectionRules: protections, restrictions: grant?.restrictions.map((item) => item.description).join('；') ?? '待审核策略确定', decisionMethod: request.riskLevel === 'LOW' ? '系统自动处理' : '人工访问决策', decisionReason: request.reviewReason ?? '在最小必要范围和标准数据保护条件下授权。', submittedAt: dateLabel(request.submittedAt), purpose: request.purpose },
  };
}
function toSubmissionView(submission: AccessSubmission, requests: AccessRequest[], grants: EffectiveGrant[], readiness: TaskReadiness): MyAccessSubmissionViewModel {
  const [taskReadinessLabel, taskReadinessNote, primaryLabel, primaryAction] = readinessInfo(readiness);
  const granted = requests.filter((request) => request.state === 'GRANTED' || request.state === 'GRANTED_WITH_LIMITS').length;
  const processing = requests.filter((request) => request.state === 'SUBMITTED' || request.state === 'PENDING_REVIEW').length;
  const denied = requests.filter((request) => request.state === 'DENIED').length;
  const activeGrants = requests.map((request) => grantFor(request, grants)).filter((grant): grant is EffectiveGrant => Boolean(grant));
  const grantedFields = [...new Set(activeGrants.flatMap((grant) => grant.scope.fields ?? []))];
  const missingFields = [...new Set(requests.flatMap((request) => request.requestedScope.fields ?? []).filter((field) => !grantedFields.includes(field)))];
  const restrictionNotes = [...new Set(activeGrants.flatMap((grant) => grant.restrictions.map((item) => item.description)))];
  const degradedCanDo = grantedFields.length ? grantedFields : ['在已授权范围内继续在线分析'];
  const degradedRestricted = [...missingFields.map((field) => `${field}暂不可用`), ...restrictionNotes];
  return { id: submission.id, taskId: submission.taskId, solutionId: submission.solutionId, taskTitle: submission.taskTitle, typeTag: '数据方案申请', purposeDescription: submission.purpose, source: submission.source, submittedTime: dateLabel(submission.createdAt), updatedTime: dateLabel(submission.updatedAt), createdAt: submission.createdAt, updatedAt: submission.updatedAt, accessProgress: processing ? `${granted} 项已授权 · ${processing} 项等待处理` : denied ? `${granted} 项已授权 · ${denied} 项未授权` : `${granted} 项已授权`, taskReadiness: readiness, taskReadinessLabel, taskReadinessNote, primaryAction: { label: primaryLabel, actionType: primaryAction }, secondaryActions: readiness === 'DEGRADED' ? [{ label: '查看限制', actionType: 'view_limits' }] : readiness === 'BLOCKED' ? [{ label: '重新申请必要范围', actionType: 'reapply_necessary' }] : [{ label: '查看申请详情', actionType: 'view_submission_detail' }], requests: requests.map((request) => toRequestView(request, grants)), limitations: readiness === 'DEGRADED' ? { canDo: degradedCanDo, restricted: degradedRestricted.length ? degradedRestricted : ['部分申请范围暂不可用'], reason: '最终授权范围根据最小必要和受保护数据使用策略进行了收敛。' } : undefined };
}

export function useMyAccessSubmissions(): MyAccessSubmissionViewModel[] {
  const { submissions, requests, grants, taskStatuses } = useAccessStore();
  return useMemo(() => Object.values(submissions).map((submission) => toSubmissionView(submission, submission.requestIds.map((id) => requests[id]).filter(Boolean), Object.values(grants), taskStatuses[submission.taskId]?.readiness ?? 'WAITING')), [submissions, requests, grants, taskStatuses]);
}
export function usePendingReviewRequests(): AccessReviewItemViewModel[] {
  const { submissions, requests } = useAccessStore();
  return useMemo(() => Object.values(requests).filter((request) => request.state === 'PENDING_REVIEW' || request.state === 'SUBMITTED').map((request) => {
    const submission = submissions[request.submissionId]; const recommendation = buildAccessRecommendation(request); const departmentCategory = request.applicant.department.includes('人口') ? 'population' : request.applicant.department.includes('营商') ? 'business' : request.applicant.department.includes('政策') ? 'policy' : request.applicant.department.includes('技术') ? 'tech' : 'civil';
    return { id: request.id, requestId: request.id, submissionId: request.submissionId, resourceId: request.resourceId, resourceName: request.resourceName, resourceType: request.resourceType.includes('API') ? 'API' : request.resourceType.includes('DATA') ? 'DATA_ASSET' : 'OTHER', resourceSubType: request.resourceType.includes('_') ? request.resourceType.split('_').slice(1).join(' ') : undefined, resourceActionSummary: `${operationLabel(request.operation)} ${request.requestedScope.fields?.join('、') ?? '申请范围内的数据'}`, suggestedProtection: recommendation.protections.map((rule) => rule.description).join(' · '), applicantName: request.applicant.name, applicantDepartment: request.applicant.department, requestedAction: operationLabel(request.operation) as AccessReviewItemViewModel['requestedAction'], actionTypeKey: request.operation, parentSubmissionTitle: submission?.taskTitle ?? request.purpose, parentSubmissionContext: `共 ${submission?.requestIds.length ?? 1} 项资源，本项为其中之一`, reviewReasonBadge: request.riskLevel === 'HIGH' ? '高风险操作' : request.riskLevel === 'MEDIUM' ? '包含受保护数据' : '需确认使用边界', reviewReasonDescription: request.reviewReason ?? '需要确认访问范围。', riskLevel: request.riskLevel ?? 'LOW', submittedAtText: dateLabel(request.submittedAt), submittedExactTime: dateLabel(request.submittedAt), timestamp: new Date(request.submittedAt).getTime(), isAssignedToMe: request.riskLevel !== 'LOW', departmentCategory, departmentCategoryName: request.applicant.department, details: { dataFieldsSummary: request.requestedScope.fields ?? [], maskedFields: recommendation.protections.filter((rule) => rule.type === 'MASK').map((rule) => rule.description), excludedFields: recommendation.protections.filter((rule) => rule.type === 'EXCLUDE').map((rule) => rule.description), requestPurpose: request.purpose, requestedDuration: `${request.requestedDurationDays ?? 90} 天`, policyTriggerRule: recommendation.triggerReason, suggestedScope: request.requestedScope.geography?.regionNames?.join('、') ?? '已核定区域' } };
  }), [submissions, requests]);
}
