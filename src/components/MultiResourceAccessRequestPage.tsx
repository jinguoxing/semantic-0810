import React, { useState } from 'react';
import {
  X,
  Info,
  CheckCircle2,
  Clock,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { TYPE_PRESENTATION, OPERATION_PRESENTATION } from './resourcePresentation';
import {
  materializeSubmission,
  isAutoAllowed,
  type MaterializedSubmission,
} from './accessDomain';
import type { AccessResolution } from './accessResolution';

export interface MultiResourceAccessRequestPageProps {
  isOpen: boolean;
  onClose: () => void;
  /** Router output — the drafts this page submits as ONE AccessSubmission. */
  resolution: AccessResolution;
  /** Why the router chose MULTI (consumer copy). */
  routeReason?: string;
  taskContextTitle: string;
  /** Receives the materialized submission so the workspace advances the
   *  formal lifecycle per request (granted → AVAILABLE, review → PENDING). */
  onSubmitted?: (result: MaterializedSubmission) => void;
  onViewMyRequests?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const RISK_CHIP: Record<string, string> = {
  NORMAL: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  SENSITIVE: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
};

const SCOPE_CHIP: Record<string, string> = {
  SIMPLE: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  SCOPED: 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]',
};

/**
 * MULTI route of the AccessRequestRouter. One AccessSubmission groups N
 * AccessRequests; each request carries its own policy preview and decision.
 * The page never decides WHO to request — it renders what
 * resolveAccessDelta() computed.
 */
export const MultiResourceAccessRequestPage: React.FC<MultiResourceAccessRequestPageProps> = ({
  isOpen,
  onClose,
  resolution,
  routeReason,
  taskContextTitle,
  onSubmitted,
  onViewMyRequests,
  addToast,
}) => {
  const drafts = resolution.requiredRequests;
  const [purposeText, setPurposeText] = useState<string>(
    taskContextTitle ? `用于「${taskContextTitle}」相关分析` : '',
  );
  // 'form' | 'submitting' | 'result'
  const [phase, setPhase] = useState<'form' | 'submitting' | 'result'>('form');
  const [result, setResult] = useState<MaterializedSubmission | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setPhase('submitting');
    setTimeout(() => {
      // Walk the formal pipeline: one submission → N requests → decisions →
      // grants, all derived from each draft's policy evaluation.
      const materialized = materializeSubmission(
        drafts.map(d => ({
          resourceId: d.resourceId,
          resourceName: d.resourceName,
          resourceType: d.resourceType,
          operation: d.operation,
          requestedScope: d.requestedScope.length > 0 ? d.requestedScope : ['最小必要范围'],
          decision: d.policyPreview,
        })),
        `sub-${drafts[0]?.resourceId ?? 'multi'}`,
        purposeText,
        taskContextTitle,
      );
      setResult(materialized);
      setPhase('result');
      const grantedCount = materialized.grants.length;
      const reviewCount = materialized.reviewItems.length;
      addToast?.(
        grantedCount > 0 ? 'success' : 'info',
        '申请单已提交',
        `共 ${materialized.requests.length} 项访问请求：${grantedCount} 项已自动授权，${reviewCount} 项进入人工审批`,
      );
      onSubmitted?.(materialized);
    }, 900);
  };

  const handleClose = () => {
    setPhase('form');
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 sm:p-8">
      {/* Click outside backdrop to close (form phase only) */}
      <div className="absolute inset-0" onClick={phase === 'form' ? handleClose : undefined} />

      <div
        className="relative w-full max-w-3xl max-h-full bg-white rounded-xl shadow-2xl border border-[#E6EAF0] flex flex-col overflow-hidden text-[#172033] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. PAGE HEADER */}
        <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-start justify-between shrink-0 bg-white">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-[#172033] tracking-tight">
              多资源访问申请
            </h2>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#64748B] shrink-0 font-medium">用于：</span>
              <span className="font-semibold text-[#172033] truncate">{taskContextTitle}</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
            title="关闭"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {phase !== 'result' ? (
          <>
            {/* 2. BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Router reason — why this landed on the multi page */}
              <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-start space-x-2">
                <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <p className="text-xs text-[#1E40AF] leading-relaxed">
                  {routeReason ?? '本次申请包含多项资源，将在一个申请单中统一提交与追踪。'}
                </p>
              </div>

              {/* Request list — one card per AccessRequestDraft */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#172033]">
                    本次申请的 {drafts.length} 项资源
                  </h3>
                  <span className="text-[11px] text-[#667085]">
                    每项资源独立评估授权策略
                  </span>
                </div>

                {drafts.map((draft) => {
                  const op = OPERATION_PRESENTATION[draft.operation];
                  return (
                    <div
                      key={draft.resourceId}
                      className="p-4 rounded-lg border border-[#E6EAF0] bg-white space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-xs font-bold text-[#172033]">
                              {draft.resourceName}
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[10px] font-mono font-medium rounded">
                              {TYPE_PRESENTATION[draft.resourceType] ?? draft.resourceType}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center space-x-1.5 flex-wrap">
                            <span className="text-[10px] text-[#667085]">申请能力</span>
                            <span className="px-1.5 py-0.5 bg-[#ECFEFF] text-[#0E7490] text-[10px] font-semibold rounded border border-[#A5F3FC]">
                              {op.label} · {draft.operation}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${RISK_CHIP[draft.risk]}`}>
                              {draft.risk === 'SENSITIVE' ? '高敏感资源' : '普通风险'}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${SCOPE_CHIP[draft.scope]}`}>
                              {draft.scope === 'SCOPED' ? '需确认数据范围' : '标准范围'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {draft.requestedScope.length > 0 && (
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="text-[10px] text-[#667085] shrink-0">建议范围：</span>
                          {draft.requestedScope.map(s => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 bg-[#F8FAFC] text-[#475569] text-[10px] font-medium rounded border border-[#E2E8F0]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Policy preview — the engine's verdict before submit */}
                      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <Shield className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span className="text-[11px] text-[#667085] truncate">
                            提交前策略评估：{draft.policyPreview.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#172033]">
                  使用目的（对全部资源生效）
                </label>
                <input
                  type="text"
                  value={purposeText}
                  onChange={(e) => setPurposeText(e.target.value)}
                  placeholder="填写本次申请的使用目的"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#BFDBFE] bg-white"
                />
              </div>
            </div>

            {/* 3. FOOTER */}
            <div className="px-6 py-4 border-t border-[#EEF2F6] bg-[#F8FAFC] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#667085]">
                将作为一个申请单提交 · 生成 {drafts.length} 项访问请求
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClose}
                  disabled={phase === 'submitting'}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-semibold text-xs rounded cursor-pointer transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={phase === 'submitting' || drafts.length === 0}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-2xs disabled:opacity-60"
                >
                  {phase === 'submitting' ? '策略评估中…' : `一次性提交 ${drafts.length} 项申请`}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* 4. RESULT VIEW — per-request decisions from the formal pipeline */
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            <div className="p-5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex items-center space-x-2.5 text-[#172033]">
                <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0" />
                <h3 className="text-sm font-bold text-[#172033]">
                  申请单已提交
                </h3>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                申请单编号 {result?.submission.id}，包含 {result?.requests.length} 项访问请求；每项请求独立评估授权策略。
              </p>
            </div>

            <div className="space-y-2">
              {result?.requests.map(req => {
                const draft = drafts.find(d => d.resourceId === req.resourceId);
                const autoAllowed = isAutoAllowed(req.policyResult.decision);
                return (
                  <div
                    key={req.id}
                    className={`p-3.5 rounded-lg border space-y-1.5 ${
                      autoAllowed
                        ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                        : req.policyResult.decision === 'HARD_DENY'
                          ? 'bg-[#FEF2F2] border-[#FECACA]'
                          : 'bg-[#EFF6FF] border-[#BFDBFE]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2 min-w-0">
                        {autoAllowed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                        ) : (
                          <Clock className={`w-4 h-4 shrink-0 ${req.policyResult.decision === 'HARD_DENY' ? 'text-[#DC2626]' : 'text-[#2563EB]'}`} />
                        )}
                        <span className="text-xs font-bold text-[#172033] truncate">
                          {draft?.resourceName ?? req.resourceId}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold shrink-0">
                        {req.policyResult.label}
                      </span>
                    </div>
                    <div className="pl-6 text-[11px] text-[#667085] space-y-0.5">
                      <div>
                        授权能力：{OPERATION_PRESENTATION[req.operation].label}（{OPERATION_PRESENTATION[req.operation].capabilitySummary}）
                      </div>
                      {req.proposedScope.length > 0 && (
                        <div>授权范围：{req.proposedScope.join(' · ')}</div>
                      )}
                      {req.policyResult.limits.length > 0 && (
                        <div className="text-[#B45309]">使用限制：{req.policyResult.limits.join(' · ')}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#EEF2F6] flex justify-end space-x-3">
              {onViewMyRequests ? (
                <button
                  onClick={() => {
                    setPhase('form');
                    setResult(null);
                    onViewMyRequests();
                  }}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1.5"
                >
                  查看我的申请
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md cursor-pointer transition-colors shadow-2xs"
                >
                  返回数据方案
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
