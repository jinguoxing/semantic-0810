import type { AccessDecisionType, AccessRequest, AccessScope, ProtectionRule, UsageRestriction } from './access.types';

export interface AccessRecommendation {
  requestId: string;
  recommendation: AccessDecisionType;
  proposedScope?: AccessScope;
  protections: ProtectionRule[];
  restrictions: UsageRestriction[];
  triggerReason: string;
  policySummary: string;
  riskSummary: string;
  evidence: Array<{ type: string; description: string }>;
}

export function buildAccessRecommendation(request: AccessRequest): AccessRecommendation {
  const protectedResource = request.riskLevel === 'MEDIUM' || request.riskLevel === 'HIGH' || request.operation === 'EXPORT';
  const protections: ProtectionRule[] = protectedResource
    ? [
        { id: `${request.id}-mask`, type: 'MASK', target: '直接标识信息', description: '姓名等直接标识信息采用动态脱敏展示' },
        { id: `${request.id}-exclude`, type: 'EXCLUDE', target: '身份证号、联系方式', description: '排除与当前任务无关的敏感字段' },
        { id: `${request.id}-audit`, type: 'AUDIT', description: '所有访问调用均纳入审计' },
      ]
    : [{ id: `${request.id}-audit`, type: 'AUDIT', description: '所有访问调用均纳入审计' }];
  const restrictions: UsageRestriction[] = request.operation === 'EXPORT'
    ? [{ id: `${request.id}-restricted-export`, description: '仅允许受控环境内使用，禁止二次分发' }]
    : [{ id: `${request.id}-online-only`, description: '仅限在线查询，不允许导出' }];
  const recommendation: AccessDecisionType = protectedResource ? 'GRANT_WITH_LIMITS' : 'GRANT';

  return {
    requestId: request.id,
    recommendation,
    proposedScope: request.requestedScope,
    protections,
    restrictions,
    triggerReason: request.reviewReason ?? '需要确认资源访问范围与使用用途。',
    policySummary: protectedResource ? '在最小必要范围与标准保护条件下可受控授权。' : '符合当前自动授权策略。',
    riskSummary: request.riskLevel === 'HIGH' ? '高风险操作，需重点确认离线使用边界。' : request.riskLevel === 'MEDIUM' ? '涉及受保护数据，需要确认最小必要范围。' : '风险可控，建议按标准策略执行。',
    evidence: [
      { type: '任务必要性', description: `当前任务需要 ${request.requestedScope.fields?.join('、') || '申请范围内的数据字段'}。` },
      { type: '最小必要', description: protectedResource ? '直接标识信息已脱敏或排除，保留分析所需字段。' : '申请范围与任务目标一致。' },
      { type: '使用边界', description: restrictions.map((restriction) => restriction.description).join('；') },
    ],
  };
}
