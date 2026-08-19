import type { AccessDecisionType, AccessFieldDetail, AccessPolicyProfile, AccessRequest, AccessScope, ProtectionRule, UsageRestriction } from './access.types';

export interface AccessRecommendation {
  requestId: string;
  recommendation: AccessDecisionType;
  proposedScope?: AccessScope;
  protections: ProtectionRule[];
  restrictions: UsageRestriction[];
  summary: string;
  triggerReason: string;
  policySummary: string;
  riskSummary: string;
  xinoCheckSummary: string;
  evidence: Array<{ type: string; description: string }>;
}

const region = (request: AccessRequest) => request.requestedScope.geography?.regionNames?.join('、') ?? '已核定区域';
const fields = (request: AccessRequest) => request.requestedScope.fields?.join('、') || '任务所需字段';
const purpose = (request: AccessRequest) => request.purpose.replace(/[。！？!?]+$/u, '');
const profileFor = (request: AccessRequest): AccessPolicyProfile => {
  if (request.policyProfile) return request.policyProfile;
  if (request.operation === 'EXPORT') return 'EXPORT_DATA';
  if (request.operation === 'INVOKE') return 'API_SERVICE';
  return 'BUSINESS_DATA';
};
const defaultFieldDetails = (request: AccessRequest): AccessFieldDetail[] => request.fieldDetails ?? (request.requestedScope.fields ?? []).map((businessName) => ({ businessName, treatment: 'ALLOW' as const }));
const rule = (request: AccessRequest, type: ProtectionRule['type'], description: string, suffix: string, target?: string): ProtectionRule => ({ id: `${request.id}-${suffix}`, type, description, target });
const restriction = (request: AccessRequest, description: string, suffix: string): UsageRestriction => ({ id: `${request.id}-${suffix}`, description });

export function buildAccessRecommendation(request: AccessRequest): AccessRecommendation {
  const requestRegion = region(request);
  const requestFields = fields(request);
  const fieldDetails = defaultFieldDetails(request);
  const profile = profileFor(request);
  const triggerReason = request.reviewReason ?? '需要确认资源访问范围与使用用途。';
  const base = {
    requestId: request.id,
    proposedScope: request.requestedScope,
    triggerReason,
  };

  if (profile === 'PERSONAL_DATA') {
    const masked = fieldDetails.filter((field) => field.treatment === 'MASK');
    const excluded = fieldDetails.filter((field) => field.treatment === 'EXCLUDE');
    const protections = [
      ...masked.map((field) => rule(request, 'MASK', `${field.businessName}采用动态脱敏展示`, `mask-${field.businessName}`, field.businessName)),
      ...excluded.map((field) => rule(request, 'EXCLUDE', `${field.businessName}不属于当前任务范围，予以排除`, `exclude-${field.businessName}`, field.businessName)),
      rule(request, 'ROW_FILTER', `限定${requestRegion}申请区域范围`, 'region'),
      rule(request, 'AUDIT', '所有访问调用均纳入审计', 'audit'),
    ];
    return {
      ...base, recommendation: 'GRANT_WITH_LIMITS', protections,
      restrictions: [restriction(request, '仅限在线查询，不允许数据导出', 'online-only')],
      summary: `允许${request.applicant.name}在完成当前任务所需的最小范围内查询${request.resourceName}，对直接标识信息实施脱敏或排除，并限定在${requestRegion}内使用。`,
      policySummary: '在个人信息最小必要、区域范围受控和审计条件下可受控授权。',
      riskSummary: '涉及个人信息或联系方式，需要确认最小必要范围，当前申请不包含数据导出。',
      xinoCheckSummary: `在当前建议限制下，未发现与个人信息最小必要原则及当前${purpose(request)}明显冲突的条件。最终授权范围仍由审核人确认。`,
      evidence: [
        { type: '任务必要性', description: `当前任务需要${requestFields}。` },
        { type: '最小必要', description: masked.length || excluded.length ? '直接标识与非必要敏感字段已按字段级策略收敛。' : '当前申请范围已限定为完成任务所需字段。' },
        { type: '使用边界', description: `仅允许${requestRegion}范围内在线查询并纳入审计。` },
      ],
    };
  }

  if (profile === 'API_SERVICE') {
    return {
      ...base, recommendation: 'GRANT_WITH_LIMITS',
      protections: [rule(request, 'RATE_LIMIT', '调用限速：20 QPS', 'qps'), rule(request, 'AUDIT', '调用日志全部纳入审计', 'audit')],
      restrictions: [restriction(request, '调用额度：50,000 次 / 日', 'quota'), restriction(request, `仅限${requestRegion}业务域与受控 Client 调用`, 'client-scope')],
      summary: `允许${request.applicant.name}在${request.requestedDurationDays ?? 180}天内受控调用${request.resourceName}，仅开放${requestFields}相关能力，并实施调用限速、额度与审计控制。`,
      policySummary: '在调用方、频率、额度和审计边界内可受控授权。',
      riskSummary: '跨组织服务调用需要确认调用方身份、业务域范围和持续调用额度。',
      xinoCheckSummary: '当前建议调用范围、访问期限与调用控制未发现明显策略冲突。最终授权条件仍由审核人确认。',
      evidence: [
        { type: '任务必要性', description: `当前看板需要调用${requestFields}相关服务能力。` },
        { type: '调用边界', description: `调用限定在${requestRegion}业务域与受控 Client。` },
        { type: '控制措施', description: '已配置 20 QPS 限速、每日调用额度和全量调用审计。' },
      ],
    };
  }

  if (profile === 'EXPORT_DATA') {
    return {
      ...base, recommendation: 'GRANT_WITH_LIMITS',
      protections: [rule(request, 'ROW_FILTER', `限定${requestRegion}与任务必要导出范围`, 'export-scope'), rule(request, 'AUDIT', '导出申请、下载和使用全程纳入审计', 'audit'), rule(request, 'NO_EXPORT', '导出文件附加动态水印与有效期控制', 'watermark')],
      restrictions: [restriction(request, '仅允许在受控运行环境内离线导出', 'controlled-environment'), restriction(request, '禁止二次分发，文件到期后不可继续使用', 'no-redistribution')],
      summary: `允许${request.applicant.name}在受控运行环境内导出${request.resourceName}的最小必要范围；导出文件须附加动态水印、有效期控制并禁止二次分发。`,
      policySummary: '高风险离线导出仅可在受控环境、范围限制和文件保护条件下授权。',
      riskSummary: '高风险离线导出，需重点确认受控环境、细粒度范围、文件保护和二次分发边界。',
      xinoCheckSummary: '当前导出范围、受控运行环境、文件保护与审计条件未发现明显策略冲突。最终授权条件仍由审核人确认。',
      evidence: [
        { type: '任务必要性', description: `当前离线研究需要${requestFields}。` },
        { type: '导出边界', description: `导出范围已限定为${requestRegion}内任务必要数据。` },
        { type: '文件保护', description: '受控环境、动态水印、有效期和禁止二次分发将共同生效。' },
      ],
    };
  }

  if (profile === 'SPECIAL_POPULATION') {
    return {
      ...base, recommendation: 'GRANT_WITH_LIMITS',
      protections: [rule(request, 'MASK', '降低社区空间精度并收敛最小知悉范围', 'precision'), rule(request, 'EXCLUDE', '排除直接联系方式', 'exclude-contact'), rule(request, 'ROW_FILTER', `限定${requestRegion}访问区域`, 'region'), rule(request, 'AUDIT', '所有访问调用均纳入审计', 'audit')],
      restrictions: [restriction(request, '仅限在线查询，不允许数据导出', 'online-only')],
      summary: `允许${request.applicant.name}在最小知悉范围内查询${request.resourceName}，降低空间精度、排除直接联系方式，并限定${requestRegion}内在线使用。`,
      policySummary: '重点关注人群信息须在最小知悉、空间精度收敛和审计条件下受控使用。',
      riskSummary: '涉及重点关注人群与照护信息，需要严格限定知悉范围、访问区域和使用方式。',
      xinoCheckSummary: `在当前建议限制下，未发现与重点关注人群最小知悉原则及当前${purpose(request)}明显冲突的条件。最终授权范围仍由审核人确认。`,
      evidence: [
        { type: '任务必要性', description: `当前服务专项需要${requestFields}。` },
        { type: '最小知悉', description: '空间精度与直接联系方式已按重点关注人群规则收敛。' },
        { type: '使用边界', description: `仅限${requestRegion}内在线使用并纳入审计。` },
      ],
    };
  }

  return {
    ...base, recommendation: 'GRANT_WITH_LIMITS',
    protections: [rule(request, 'ROW_FILTER', `限定${requestRegion}申请行政区域范围`, 'region'), rule(request, 'ROW_FILTER', '仅开放当前任务必要业务字段', 'field-scope'), rule(request, 'AUDIT', '访问调用均纳入审计', 'audit')],
    restrictions: [restriction(request, '仅允许在线查询，不允许导出', 'online-only')],
    summary: `允许${request.applicant.name}在当前任务所需的最小范围内查询${request.resourceName}，仅开放${requestRegion}内与本次分析相关的业务字段。`,
    policySummary: '在最小必要字段、行政区域范围和审计条件下可受控授权。',
    riskSummary: '涉及业务位置或服务能力信息，需要确认最小必要范围，当前用途不涉及数据导出。',
    xinoCheckSummary: `在当前建议范围下，未发现与最小必要访问原则及当前${purpose(request)}明显冲突的条件。最终授权范围仍由审核人确认。`,
    evidence: [
      { type: '任务必要性', description: `当前分析确实需要${requestFields}。` },
      { type: '范围控制', description: `当前授权范围已限定在${requestRegion}和任务必要字段。` },
      { type: '使用边界', description: '当前用途为在线分析，不允许导出并纳入审计。' },
    ],
  };
}
