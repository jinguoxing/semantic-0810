import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Info, ShieldAlert, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { AdminCenterShell, type AdminCenterItem } from './AdminCenterShell';
import { buildAccessRecommendation } from '../domain/access/accessDecision';
import { useAccessRequest, useAccessStore, useAccessSubmission, useEffectiveGrant } from '../domain/access/access.store';
import type { AccessFieldDetail, EffectiveGrant, ProtectionRule, UsageRestriction } from '../domain/access/access.types';

export interface AccessReviewDetailWorkspaceProps {
  requestId?: string;
  onBackToQueue?: () => void;
  onNavigateToAuthorizationRecords?: () => void;
  onNavigateToPolicyManagement?: () => void;
  onNavigateToAuditLogs?: () => void;
  onDecisionComplete?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const operationLabel = (operation: string) => ({ QUERY: '查询数据', EXPORT: '离线导出', INVOKE: '调用服务', SUBSCRIBE: '订阅更新' }[operation] ?? operation);
const controlledOperationLabel = (operation: string) => ({ QUERY: '查询', EXPORT: '导出', INVOKE: '调用', SUBSCRIBE: '订阅' }[operation] ?? operation);
const treatmentPresentation = {
  ALLOW: { label: '允许', className: 'text-[#15803D]' },
  MASK: { label: '脱敏', className: 'text-[#B45309]' },
  EXCLUDE: { label: '排除', className: 'text-[#B91C1C]' },
} as const;

export const AccessReviewDetailWorkspace: React.FC<AccessReviewDetailWorkspaceProps> = ({
  requestId,
  onBackToQueue,
  onNavigateToAuthorizationRecords,
  onNavigateToPolicyManagement,
  onNavigateToAuditLogs,
  onDecisionComplete,
  addToast,
}) => {
  const request = useAccessRequest(requestId);
  const submission = useAccessSubmission(request?.submissionId);
  const grant = useEffectiveGrant(request?.id);
  const { decideRequest } = useAccessStore();
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);
  const [duration, setDuration] = useState(90);
  const [regionOverride, setRegionOverride] = useState('');
  const [protectionPolicy, setProtectionPolicy] = useState<'standard' | 'strict'>('standard');
  const [denyReason, setDenyReason] = useState('申请范围超出当前任务所需');

  if (!request) {
    return <AdminCenterShell activeItem="access-review"><main className="grid flex-1 place-items-center text-sm text-[#667085]">未找到对应的访问申请。</main></AdminCenterShell>;
  }

  const recommendation = buildAccessRecommendation(request);
  const requestedFields = request.requestedScope.fields ?? [];
  const scope = request.requestedScope.geography?.regionNames?.join('、') ?? '已核定区域';
  const selectedRegion = regionOverride || scope;
  const fieldDetails: AccessFieldDetail[] = request.fieldDetails ?? requestedFields.map((businessName) => ({ businessName, treatment: 'ALLOW' }));
  const counts = {
    allow: fieldDetails.filter((field) => field.treatment === 'ALLOW').length,
    mask: fieldDetails.filter((field) => field.treatment === 'MASK').length,
    exclude: fieldDetails.filter((field) => field.treatment === 'EXCLUDE').length,
  };
  const riskPresentation = request.riskLevel === 'HIGH'
    ? { label: '高风险', className: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' }
    : request.riskLevel === 'MEDIUM'
      ? { label: '中等风险', className: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]' }
      : { label: '低风险', className: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]' };
  const policyLabel = request.policyProfile === 'PERSONAL_DATA' ? '个人信息' : request.policyProfile === 'API_SERVICE' ? '服务调用' : request.policyProfile === 'EXPORT_DATA' ? '受控导出' : request.policyProfile === 'SPECIAL_POPULATION' ? '重点人群' : '业务数据';
  const scopeLabels = request.policyProfile === 'API_SERVICE'
    ? { scope: '调用范围', duration: '调用期限', protections: '访问控制', fields: '调用能力' }
    : request.policyProfile === 'EXPORT_DATA'
      ? { scope: '导出范围', duration: '有效期', protections: '文件保护', fields: '导出内容' }
      : { scope: '允许范围', duration: '期限', protections: '保护措施', fields: '允许访问' };
  const exportControl = request.operation === 'EXPORT' ? '仅允许在受控运行环境内导出' : '不允许';
  const customProtections: ProtectionRule[] = protectionPolicy === 'strict'
    ? [...recommendation.protections, { id: `${request.id}-strict-audit`, type: 'AUDIT', description: '启用加强审计与异常访问告警' }]
    : recommendation.protections;
  const customRestrictions: UsageRestriction[] = protectionPolicy === 'strict'
    ? [...recommendation.restrictions, { id: `${request.id}-strict-use`, description: '仅限受控环境内使用，禁止二次分发' }]
    : recommendation.restrictions;
  const controls = [
    ...recommendation.protections.filter((item) => !item.target || !fieldDetails.some((field) => field.businessName === item.target)).map((item) => item.description),
    ...recommendation.restrictions.map((item) => item.description),
  ];
  const navigate = (item: AdminCenterItem) => {
    if (item === 'access-review') onBackToQueue?.();
    if (item === 'authorization-records') onNavigateToAuthorizationRecords?.();
    if (item === 'policies') onNavigateToPolicyManagement?.();
    if (item === 'audit-logs') onNavigateToAuditLogs?.();
  };
  const complete = (decision: 'GRANT' | 'GRANT_WITH_LIMITS' | 'DENY', customGrant?: EffectiveGrant, reason?: string) => {
    decideRequest({ requestId: request.id, decision, grant: customGrant, reason });
    addToast?.(decision === 'DENY' ? 'info' : 'success', decision === 'DENY' ? '已拒绝访问申请' : '访问决策已完成', `已写入本次访问决策，并重新计算「${submission?.taskTitle ?? request.purpose}」的任务状态。`);
    onDecisionComplete?.();
    onBackToQueue?.();
  };
  const approveCustom = () => {
    const customScope = selectedRegion === scope ? request.requestedScope : { ...request.requestedScope, geography: { regionNames: [selectedRegion] } };
    const customGrant: EffectiveGrant = {
      id: `grant-${request.id}-custom-${Date.now()}`,
      requestId: request.id,
      resourceId: request.resourceId,
      state: 'ACTIVE',
      scope: customScope,
      protections: customProtections,
      restrictions: customRestrictions,
      effectiveAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + duration * 864e5).toISOString(),
    };
    setCustomOpen(false);
    complete('GRANT_WITH_LIMITS', customGrant, '审核人调整限制后授权');
  };
  const openCustom = () => {
    setDuration(request.requestedDurationDays ?? 90);
    setRegionOverride(scope);
    setProtectionPolicy('standard');
    setCustomOpen(true);
  };

  return <AdminCenterShell activeItem="access-review" onNavigate={navigate}>
    <main className="flex flex-1 flex-col overflow-hidden bg-[#F7F9FC]">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-5 p-6 lg:p-8">
          <header className="space-y-3">
            <button onClick={onBackToQueue} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]"><ArrowLeft className="h-3.5 w-3.5" />返回访问审核列表</button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5"><h1 className="text-2xl font-bold">{request.resourceName} · 访问申请</h1><span className="inline-flex items-center gap-1 rounded border border-[#FDE68A] bg-[#FFFBEB] px-2 py-0.5 text-xs font-bold text-[#B45309]">待人工确认</span></div>
              <p className="mt-1 text-xs text-[#98A2B3]">提交于 {new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(request.submittedAt))}</p>
            </div>
            <div className="rounded-lg border border-[#E6EAF0] bg-white px-5 py-4">
              <div className="text-[11px] text-[#667085]">需要你确认</div>
              <div className="mt-1 text-sm font-semibold leading-relaxed text-[#172033]">是否允许{request.applicant.name}在未来 {request.requestedDurationDays ?? 90} 天内，以受控{controlledOperationLabel(request.operation)}方式访问{scope}的{requestedFields.join('、') || '申请范围内信息'}。</div>
              <div className="mt-1 text-xs text-[#667085]">用于：{submission?.taskTitle ?? request.purpose}</div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <section className="rounded-lg border border-[#E6EAF0] bg-white p-5">
                <h2 className="mb-4 text-sm font-bold">申请摘要</h2>
                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                  <div><div className="text-[#98A2B3]">申请人</div><div className="mt-1 font-bold">{request.applicant.name}</div><div className="text-[#667085]">{request.applicant.department}</div></div>
                  <div><div className="text-[#98A2B3]">申请动作</div><div className="mt-1 font-bold text-[#2563EB]">{operationLabel(request.operation)}</div></div>
                  <div><div className="text-[#98A2B3]">使用期限</div><div className="mt-1 font-bold">{request.requestedDurationDays ?? 90} 天</div></div>
                  <div><div className="text-[#98A2B3]">来源</div><div className="mt-1 font-bold">{submission?.source ?? '访问申请'}</div></div>
                </div>
                <div className="mt-4 border-t border-[#EEF2F6] pt-3 text-xs text-[#475569]"><strong>任务用途：</strong>{request.purpose}</div>
              </section>

              <section className="rounded-lg border border-[#BFDBFE] bg-white p-5">
                <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2563EB]" /><div><div className="text-[11px] font-bold text-[#2563EB]">系统建议</div><h2 className="text-base font-bold">{recommendation.recommendation === 'GRANT_WITH_LIMITS' ? '附带限制授权' : recommendation.recommendation === 'GRANT' ? '建议授权' : '建议不授权'}</h2></div></div>
                <p className="mb-3 text-xs leading-relaxed text-[#475569]">{recommendation.summary}</p>
                <div className="grid gap-3 border-t border-[#EEF2F6] pt-3 text-xs sm:grid-cols-2">
                  <div><div className="text-[#98A2B3]">{scopeLabels.scope}</div><div className="mt-1 font-semibold">{scope}</div></div>
                  <div><div className="text-[#98A2B3]">{scopeLabels.fields}</div><div className="mt-1">{requestedFields.join('、') || '申请范围内能力'}</div></div>
                  <div><div className="text-[#98A2B3]">{scopeLabels.duration}</div><div className="mt-1 font-semibold">{request.requestedDurationDays ?? 90} 天</div></div>
                  <div><div className="text-[#98A2B3]">{scopeLabels.protections}</div><div className="mt-1">{recommendation.protections.map((item) => item.description).join('；')}</div></div>
                  <div className="sm:col-span-2 rounded bg-[#F8FAFC] p-3"><div className="text-[#98A2B3]">使用限制</div><div className="mt-1">{recommendation.restrictions.map((item) => item.description).join('；')}</div></div>
                </div>
                <div className="mt-4 border-t border-[#EEF2F6] pt-3 text-xs"><div className="mb-2 font-bold">为什么这样建议</div>{recommendation.evidence.slice(0, 3).map((item) => <div key={item.type} className="mt-1 text-[#475569]">✓ {item.description}</div>)}</div>
              </section>

              <section className="rounded-lg border border-[#E6EAF0] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold">详细授权范围</h2><p className="mt-1 text-xs text-[#667085]">允许 {counts.allow} 项 · 脱敏 {counts.mask} 项 · 排除 {counts.exclude} 项</p></div><button onClick={() => setFieldsOpen((open) => !open)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB]">{fieldsOpen ? '收起详细范围' : '查看详细范围'}<ChevronDown className={`h-3.5 w-3.5 ${fieldsOpen ? 'rotate-180' : ''}`} /></button></div>
                {fieldsOpen && <div className="mt-4 space-y-4"><div className="overflow-hidden rounded border border-[#E6EAF0]"><table className="w-full text-left text-xs"><thead className="bg-[#F8FAFC] text-[#667085]"><tr><th className="p-3">业务信息</th><th className="p-3">技术字段</th><th className="p-3">处理方式</th></tr></thead><tbody>{fieldDetails.map((field) => <tr key={field.businessName} className="border-t border-[#EEF2F6]"><td className="p-3">{field.businessName}</td><td className="p-3 font-mono text-[#667085]">{field.technicalName ?? '—'}</td><td className={`p-3 font-semibold ${treatmentPresentation[field.treatment].className}`}>{treatmentPresentation[field.treatment].label}</td></tr>)}</tbody></table></div><div className="rounded bg-[#F8FAFC] p-3 text-xs"><div className="font-bold text-[#334155]">其他访问保护</div><div className="mt-2 space-y-1 text-[#475569]">{controls.map((control) => <div key={control}>· {control}</div>)}</div></div></div>}
              </section>
            </div>

            <aside className="space-y-4 lg:col-span-4">
              <section className="rounded-lg border border-[#E6EAF0] bg-white p-4 text-xs"><h2 className="font-bold">决策依据</h2><div className="mt-4 space-y-4"><div><div className="text-[#98A2B3]">触发原因</div><p className="mt-1 text-[#475569]">{recommendation.triggerReason}</p></div><div className="border-t border-[#EEF2F6] pt-3"><div className="text-[#98A2B3]">当前策略</div><p className="mt-1 font-semibold">{recommendation.policySummary}</p></div><div className="border-t border-[#EEF2F6] pt-3"><div className="text-[#98A2B3]">风险边界</div><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${riskPresentation.className}`}>{riskPresentation.label}</span><p className="mt-2 text-[#475569]">{recommendation.riskSummary}</p></div><div className="border-t border-[#EEF2F6] pt-3"><div className="text-[#98A2B3]">上下文与历史</div><p className="mt-1 leading-relaxed text-[#475569]">申请部门：{request.applicant.department}<br />资源责任方：{request.resourceOwnerTeam ?? '数据资源责任团队'}<br />当前授权：{grant ? '已有生效授权' : '无正式访问授权'}<br />近 90 天：无该资源正式访问记录</p></div></div></section>
              <section className="rounded-lg border border-[#DBEAFE] bg-[#FAFCFF] p-4 text-xs"><div className="flex items-center gap-2 font-bold text-[#2563EB]"><Info className="h-3.5 w-3.5" />Xino 辅助校验</div><p className="mt-2 leading-relaxed text-[#475569]">{recommendation.xinoCheckSummary}</p></section>
            </aside>
          </div>
        </div>
      </div>

      <footer className="flex flex-col justify-between gap-3 border-t border-[#E6EAF0] bg-white px-6 py-4 sm:flex-row sm:items-center"><div className="text-xs text-[#667085]"><Info className="mr-1 inline h-4 w-4 text-[#2563EB]" />当前决定将在授权生效前再次经过策略校验。</div><div className="flex gap-2"><button onClick={() => setDenyOpen(true)} className="rounded border border-[#FECDCA] px-3 py-2 text-xs font-bold text-[#B91C1C]">不授权</button><button onClick={openCustom} className="rounded border border-[#CBD5E1] px-3 py-2 text-xs font-bold"><SlidersHorizontal className="mr-1 inline h-3.5 w-3.5" />调整限制并授权</button><button onClick={() => complete(recommendation.recommendation, undefined, '按系统建议授权')} className="rounded bg-[#2563EB] px-4 py-2 text-xs font-bold text-white"><Check className="mr-1 inline h-3.5 w-3.5" />按建议授权</button></div></footer>
    </main>

    {customOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/40 p-4"><div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl"><div><h3 className="font-bold">调整授权限制</h3><p className="mt-1 text-xs text-[#667085]">仅在审核人确认需要变化时修改有效期、数据范围和保护策略。</p></div><div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2"><label>有效期限<select value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-1 w-full rounded border border-[#E2E8F0] p-2"><option value={30}>30 天</option><option value={90}>90 天</option><option value={180}>180 天</option></select></label><label>数据范围<select value={selectedRegion} onChange={(event) => setRegionOverride(event.target.value)} className="mt-1 w-full rounded border border-[#E2E8F0] p-2"><option value={scope}>{scope}</option><option value="浦东新区">浦东新区</option><option value="全市辖区">全市辖区</option></select></label><label className="sm:col-span-2">数据保护<select value={protectionPolicy} onChange={(event) => setProtectionPolicy(event.target.value as 'standard' | 'strict')} className="mt-1 w-full rounded border border-[#E2E8F0] p-2"><option value="standard">{policyLabel}标准保护策略</option><option value="strict">加强{policyLabel}保护与审计策略</option></select></label></div><div className="rounded border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-xs text-[#475569]"><div><strong>将写入授权：</strong>{customProtections.map((item) => item.description).join('；')}</div><div className="mt-2"><strong>数据导出：</strong>{exportControl}</div></div><div className="flex justify-end gap-2"><button onClick={() => setCustomOpen(false)} className="px-3 py-2 text-xs">取消</button><button onClick={approveCustom} className="rounded bg-[#2563EB] px-3 py-2 text-xs font-bold text-white">按调整后方案授权</button></div></div></div>}
    {denyOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/40 p-4"><div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl"><div className="flex items-center gap-2 text-[#B91C1C]"><ShieldAlert className="h-5 w-5" /><h3 className="font-bold">不授权当前访问请求</h3></div><label className="block text-xs">不授权原因<select value={denyReason} onChange={(event) => setDenyReason(event.target.value)} className="mt-1 w-full rounded border border-[#E2E8F0] p-2"><option>申请范围超出当前任务所需</option><option>不符合受保护数据资源使用政策</option><option>高风险操作未满足必要安全条件</option></select></label><div className="flex justify-end gap-2"><button onClick={() => setDenyOpen(false)} className="px-3 py-2 text-xs">取消</button><button onClick={() => complete('DENY', undefined, denyReason)} className="rounded bg-[#B91C1C] px-3 py-2 text-xs font-bold text-white">确认不授权</button></div></div></div>}
  </AdminCenterShell>;
};
