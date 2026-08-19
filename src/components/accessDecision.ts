// ─── Access decision policy ─────────────────────────────────────────────────
// Formal model: the access decision is an OUTPUT of policy evaluation over
// (resource designation × requester × requested scope). Security level is one
// policy INPUT — never the decision itself (数据安全等级 ≠ 自动授权策略).
// Call sites ask the engine; the rule lives here in exactly one place.
//
// The return enum is the FINAL contract language (AUTO_ALLOW /
// AUTO_ALLOW_WITH_LIMITS / HARD_DENY / REVIEW_REQUIRED) even where the demo
// rule body stays simple — swap the body for the real Policy / Permission /
// Scope engine and no call site changes.

import type { AccessDecisionKind, AccessOperation } from './accessDomain';

export interface AccessPolicyInput {
  /** Resource security designation, e.g. L1（公开可用）— an input, not a verdict. */
  securityLevel?: string;
  /** Demo knob: an explicit auto-grant policy published for the resource. */
  autoGrantPolicy?: boolean;
  /** What the request grants — EXPORT narrows even an auto-allow. */
  requestedOperation?: AccessOperation;
}

export interface AccessDecision {
  kind: AccessDecisionKind;
  /** Consumer-facing copy for the decision result. */
  label: string;
}

const DECISIONS: Record<AccessDecisionKind, AccessDecision> = {
  AUTO_ALLOW: { kind: 'AUTO_ALLOW', label: '已自动授权' },
  AUTO_ALLOW_WITH_LIMITS: { kind: 'AUTO_ALLOW_WITH_LIMITS', label: '已自动授权（附使用限制）' },
  HARD_DENY: { kind: 'HARD_DENY', label: '当前范围无法授权' },
  REVIEW_REQUIRED: { kind: 'REVIEW_REQUIRED', label: '申请已提交 · 等待审批' },
};

const isRestrictedLevel = (securityLevel?: string) =>
  !!securityLevel && /L[23]/.test(securityLevel);

/** Demo access policy engine.
 *  Rule: L4+ never authorizes (HARD_DENY); only an explicit auto-grant policy
 *  auto-allows — a security level alone never does — and restricted levels or
 *  EXPORT still attach limits (AUTO_ALLOW_WITH_LIMITS); everything else goes
 *  to a human (REVIEW_REQUIRED). */
export const evaluateAccessDecision = (input: AccessPolicyInput): AccessDecision => {
  if (input.securityLevel?.startsWith('L4')) return DECISIONS.HARD_DENY;
  if (input.autoGrantPolicy) {
    return isRestrictedLevel(input.securityLevel) || input.requestedOperation === 'EXPORT'
      ? DECISIONS.AUTO_ALLOW_WITH_LIMITS
      : DECISIONS.AUTO_ALLOW;
  }
  return DECISIONS.REVIEW_REQUIRED;
};
