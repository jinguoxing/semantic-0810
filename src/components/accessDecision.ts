// ─── Access decision policy ─────────────────────────────────────────────────
// Formal model: the access decision (AUTO_GRANT / MANUAL_REVIEW / DENY) is an
// OUTPUT of policy evaluation over (resource designation × requester ×
// requested scope). Security level is one policy INPUT — never the decision
// itself (数据安全等级 ≠ 自动授权策略). Call sites ask the engine; the rule
// lives here in exactly one place.

export type AccessDecisionType = 'AUTO_GRANT' | 'MANUAL_REVIEW' | 'DENY';

export interface AccessPolicyInput {
  /** Resource security designation, e.g. L1（公开可用）— an input, not a verdict. */
  securityLevel?: string;
  /** Demo knob: an explicit auto-grant policy published for the resource. */
  autoGrantPolicy?: boolean;
}

export interface AccessDecision {
  type: AccessDecisionType;
  /** Consumer-facing copy for the decision result. */
  label: string;
}

const DECISIONS: Record<AccessDecisionType, AccessDecision> = {
  AUTO_GRANT: { type: 'AUTO_GRANT', label: '已自动授权' },
  MANUAL_REVIEW: { type: 'MANUAL_REVIEW', label: '申请已提交 · 等待审批' },
  DENY: { type: 'DENY', label: '当前范围无法授权' },
};

/** Demo access policy engine. Rule: only an explicit auto-grant policy
 *  auto-grants; a security level alone never does. Swap the body for the real
 *  Policy / Permission / Scope engine — the input → AccessDecision contract
 *  stays, so no call site changes. */
export const evaluateAccessDecision = (input: AccessPolicyInput): AccessDecision =>
  input.autoGrantPolicy ? DECISIONS.AUTO_GRANT : DECISIONS.MANUAL_REVIEW;
