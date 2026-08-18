import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
  Info
} from 'lucide-react';

export interface SingleResourceAccessRequestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resourceName?: string;
  resourceTypeLabel?: string; // DATA ASSET · VIEW
  taskContextTitle?: string; // 街镇老龄化分析
  /** Access decision policy. The ORDINARY path is MANUAL_REVIEW (申请已提交 ·
   *  等待审批 → PENDING); AUTO_GRANT only when an explicit policy hits
   *  (e.g. L1 public data) — never a blanket default. */
  reviewDecision?: 'auto_granted' | 'manual_review';
  /** Minimal-necessary scope chips derived from the resource's real fields. */
  suggestedScopeItems?: string[];
  /** 业务字段 ↔ 技术字段对照 (replaces the built-in demo mapping when provided). */
  suggestedFieldMappings?: { label: string; field: string }[];
  onSuccessSubmit?: (resultType: 'auto_granted' | 'manual_review' | 'auto_denied') => void;
  onViewTaskDetail?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const SingleResourceAccessRequestDrawer: React.FC<SingleResourceAccessRequestDrawerProps> = ({
  isOpen,
  onClose,
  resourceName = '人口基本信息视图',
  resourceTypeLabel = 'DATA ASSET · VIEW',
  taskContextTitle = '街镇老龄化分析',
  reviewDecision = 'manual_review',
  suggestedScopeItems,
  suggestedFieldMappings,
  onSuccessSubmit,
  onViewTaskDetail,
  addToast
}) => {
  // Form states - Pre-filled based on task context (Confirm, not Configure)
  const [purposeText, setPurposeText] = useState<string>(
    taskContextTitle ? `用于「${taskContextTitle}」相关分析` : ''
  );
  const [durationOption, setDurationOption] = useState<string>('3months');
  const [applicationRemark, setApplicationRemark] = useState<string>('');

  // Expandable detailed scope toggle
  const [isDetailScopeExpanded, setIsDetailScopeExpanded] = useState<boolean>(false);

  // Submission lifecycle & decision simulation state: 'form' | 'submitting' | 'result'
  const [submitPhase, setSubmitPhase] = useState<'form' | 'submitting' | 'result'>('form');
  const [decisionResult, setDecisionResult] = useState<'auto_granted' | 'manual_review' | 'auto_denied'>(reviewDecision);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setSubmitPhase('submitting');

    // Simulate automated policy evaluation
    setTimeout(() => {
      // Ordinary request → MANUAL_REVIEW (submitted ≠ granted); AUTO_GRANT
      // only fires when the caller's policy explicitly hits.
      setDecisionResult(reviewDecision);
      setSubmitPhase('result');
      if (reviewDecision === 'auto_granted') {
        addToast?.('success', '已自动授权', '当前申请命中自动授权策略，查询权限已即时生效');
      } else {
        addToast?.('info', '申请已提交 · 等待审批', '申请已进入人工审批，通过后可在「我的申请」中查看并使用');
      }
      onSuccessSubmit?.(reviewDecision);
    }, 900);
  };

  const handleResetAndClose = () => {
    setSubmitPhase('form');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={handleResetAndClose} />

      {/* Drawer Container: 540px width, clean enterprise side panel styling */}
      <div 
        className="relative w-full max-w-[540px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col z-10 animate-in slide-in-from-right duration-200 text-[#172033]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. DRAWER HEADER                                          */}
        {/* ========================================================= */}
        <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-start justify-between shrink-0 bg-white">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-[#172033] tracking-tight">
              申请使用
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#334155]">{resourceName}</span>
              <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[10px] font-mono font-medium rounded">
                {resourceTypeLabel}
              </span>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
            title="关闭"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. CONTEXT STRIP (来源上下文)                              */}
        {/* ========================================================= */}
        <div className="px-6 py-2.5 bg-[#F8FAFC] border-b border-[#EEF2F6] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2 text-[#475569] min-w-0">
            <span className="text-[#64748B] shrink-0 font-medium">用于：</span>
            <span className="font-semibold text-[#172033] truncate">{taskContextTitle}</span>
            <span className="text-[#94A3B8] hidden sm:inline text-[11px] truncate">
              · Semovix 已根据任务整理建议的数据范围
            </span>
          </div>

          {onViewTaskDetail && (
            <button
              onClick={onViewTaskDetail}
              className="text-[#2563EB] hover:text-[#1D4ED8] text-xs font-medium shrink-0 ml-2 cursor-pointer transition-colors"
            >
              查看任务
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. DRAWER BODY                                            */}
        {/* ========================================================= */}
        {submitPhase === 'result' ? (
          /* Decision Result View */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between text-xs">
            <div className="space-y-6">
              {decisionResult === 'auto_granted' && (
                <div className="p-5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] space-y-3">
                  <div className="flex items-center space-x-2.5 text-[#166534]">
                    <CheckCircle2 className="w-5 h-5 text-[#16A36A] shrink-0" />
                    <h3 className="text-sm font-bold text-[#166534]">
                      访问权限已生效
                    </h3>
                  </div>
                  <p className="text-xs text-[#166534] leading-relaxed">
                    当前申请已根据数据安全与访问策略自动处理，建议范围授权已下发，可以继续原来的分析任务。
                  </p>
                  <div className="pt-2 border-t border-[#DCFCE7] text-[11px] text-[#15803D] space-y-1">
                    <div>• 授权能力：查询数据（在线分析与问数）</div>
                    <div>• 有效期限：3 个月（到期前 7 天支持续期）</div>
                    <div>• 安全要求：姓名已自动配置动态脱敏</div>
                  </div>
                </div>
              )}

              {decisionResult === 'manual_review' && (
                <div className="p-5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] space-y-3">
                  <div className="flex items-center space-x-2.5 text-[#1E40AF]">
                    <Clock className="w-5 h-5 text-[#2563EB] shrink-0" />
                    <h3 className="text-sm font-bold text-[#1E40AF]">
                      申请已提交
                    </h3>
                  </div>
                  <p className="text-xs text-[#1E40AF] leading-relaxed">
                    当前请求需要进一步访问审核，你可以在“我的申请”中查看审批进度与评估反馈。
                  </p>
                </div>
              )}

              {decisionResult === 'auto_denied' && (
                <div className="p-5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] space-y-3">
                  <div className="flex items-center space-x-2.5 text-[#991B1B]">
                    <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
                    <h3 className="text-sm font-bold text-[#991B1B]">
                      当前范围无法授权
                    </h3>
                  </div>
                  <p className="text-xs text-[#991B1B] leading-relaxed">
                    系统已找到一个可申请的较小范围。
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#EEF2F6] flex justify-end space-x-3">
              <button
                onClick={handleResetAndClose}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md cursor-pointer transition-colors shadow-2xs"
              >
                继续分析
              </button>
            </div>
          </div>
        ) : (
          /* Normal Form View (Confirm, not Configure) */
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            
            {/* 1. 使用目的 */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#172033]">
                使用目的
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={purposeText}
                  onChange={(e) => setPurposeText(e.target.value)}
                  placeholder="填写业务用途…"
                  className="w-full px-3 py-2 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] outline-hidden"
                />
                <p className="text-[11px] text-[#667085]">
                  用途将用于访问决策与审计记录。
                </p>
              </div>
            </div>

            {/* 2. 申请能力 */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-[#172033]">
                申请能力
              </label>
              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex items-start space-x-2.5">
                <div className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-1.5" />
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-[#172033] text-xs">
                    查询数据
                  </div>
                  <p className="text-[11px] text-[#667085] leading-relaxed">
                    用于在线分析和问数，不包含数据导出。
                  </p>
                </div>
              </div>
            </div>

            {/* 3. 建议数据范围 (最重要的内容区域) */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#172033]">
                  建议数据范围
                </label>
                <span className="text-[11px] text-[#667085]">
                  基于当前任务
                </span>
              </div>

              <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg space-y-4 shadow-2xs">
                <p className="text-xs text-[#475569] leading-relaxed">
                  Semovix 已按当前分析目标整理最小必要的数据范围。
                </p>

                {/* 当前需要 */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-[#172033]">
                    当前需要
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(suggestedScopeItems ?? [
                      '年龄与出生信息',
                      '常住状态',
                      '行政区域'
                    ]).map((item) => (
                      <div
                        key={item}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#1E293B]"
                      >
                        <Check className="w-3 h-3 text-[#2563EB] stroke-[2.5]" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 本次申请不包含 */}
                <div className="space-y-1.5 pt-2 border-t border-[#EEF2F6]">
                  <div className="text-[11px] font-semibold text-[#64748B]">
                    本次申请不包含
                  </div>
                  <div className="text-xs text-[#64748B] flex flex-wrap gap-x-3 gap-y-1">
                    <span>• 身份证号</span>
                    <span>• 手机号</span>
                    <span>• 联系方式明文</span>
                  </div>
                </div>

                {/* 数据保护摘要 */}
                <div className="space-y-1.5 pt-2 border-t border-[#EEF2F6]">
                  <div className="text-[11px] font-semibold text-[#172033]">
                    数据保护
                  </div>
                  <div className="text-xs text-[#475569] space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-1 h-1 rounded-full bg-[#64748B]"></span>
                      <span>姓名：按策略脱敏</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-1 h-1 rounded-full bg-[#64748B]"></span>
                      <span>敏感身份信息：不包含</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-1 h-1 rounded-full bg-[#64748B]"></span>
                      <span>数据导出：本次不申请</span>
                    </div>
                  </div>
                </div>

                {/* 查看详细范围链接 */}
                <div className="pt-2 border-t border-[#EEF2F6]">
                  <button
                    type="button"
                    onClick={() => setIsDetailScopeExpanded(!isDetailScopeExpanded)}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium inline-flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>{isDetailScopeExpanded ? '收起详细范围' : '查看详细范围 →'}</span>
                    {isDetailScopeExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : null}
                  </button>

                  {/* 详细范围展开内容 */}
                  {isDetailScopeExpanded && (
                    <div className="mt-3 p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-3 text-xs animate-in fade-in duration-150">
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-[#64748B]">
                          业务信息与技术字段对照
                        </div>
                        <div className="divide-y divide-[#EEF2F6] text-xs">
                          {(suggestedFieldMappings ?? [
                            { label: '年龄', field: 'age' },
                            { label: '出生日期', field: 'birth_date' },
                            { label: '常住状态', field: 'resident_status' },
                            { label: '所属行政区域', field: 'region_code' }
                          ]).map((m) => (
                            <div key={m.field} className="py-1.5 flex items-center justify-between">
                              <span className="text-[#172033] font-medium">{m.label}</span>
                              <code className="font-mono text-[#2563EB] text-[11px]">{m.field}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. 使用期限 */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-[#172033]">
                使用期限
              </label>
              <div className="flex items-center space-x-3">
                <div className="relative w-40">
                  <select
                    value={durationOption}
                    onChange={(e) => setDurationOption(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] outline-hidden cursor-pointer appearance-none pr-8"
                  >
                    <option value="1month">1 个月</option>
                    <option value="3months">3 个月</option>
                    <option value="6months">6 个月</option>
                    <option value="custom">自定义</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-3 pointer-events-none" />
                </div>
                <span className="text-[11px] text-[#667085]">
                  到期后如仍需使用，可重新申请。
                </span>
              </div>
            </div>

            {/* 5. 申请说明 */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-[#172033]">
                申请说明
              </label>
              <textarea
                rows={3}
                value={applicationRemark}
                onChange={(e) => setApplicationRemark(e.target.value)}
                placeholder="说明具体的分析背景与预期成效…"
                className="w-full px-3 py-2 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] leading-relaxed outline-hidden resize-none"
              />
            </div>

            {/* 6. 最终范围提示 */}
            <div className="text-[11px] text-[#64748B] leading-relaxed pt-1">
              最终可访问范围可能根据数据策略与访问决策进一步收敛。
            </div>

            {/* 7. 系统处理方式 (浅灰背景极轻提示) */}
            <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1">
              <div className="text-xs font-bold text-[#334155]">
                系统将优先自动处理
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                提交后，系统会先根据现有数据策略判断；只有需要例外决策的申请才会进入人工审核。
              </p>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 4. STICKY FOOTER ACTIONS                                  */}
        {/* ========================================================= */}
        {submitPhase === 'form' && (
          <div className="p-4 border-t border-[#EEF2F6] bg-white flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-4 py-2 text-xs font-semibold text-[#475569] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-md transition-colors cursor-pointer"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-bold rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              提交申请
            </button>
          </div>
        )}

        {submitPhase === 'submitting' && (
          <div className="p-4 border-t border-[#EEF2F6] bg-white flex items-center justify-center shrink-0">
            <div className="text-xs text-[#64748B] flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              <span>正在依据数据策略评估访问合规性…</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
