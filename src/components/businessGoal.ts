// ─── Goal plan semantics ────────────────────────────────────────────────────
// Deterministic demo-grade semantic layer for Goal Search, in two halves:
//   1. detectDiscoveryIntent — one discovery entry, two intents, with confidence
//   2. parseBusinessGoal     — raw goal text → GoalPlanContext (semantics only)
// The retrieval half of the plan (recommendedResourceIds) is filled in by the
// workspace's mockGoalResolver, so parsing stays library-independent.

export interface GoalCoverageRequirement {
  id: string;
  label: string;
  required: boolean;
}

export interface GoalPlanContext {
  rawGoal: string;
  /** 分析主体（命中的业务对象；'' = 未识别） */
  subject: string;
  /** 范围（如行政区域） */
  scope?: string;
  /** 分析维度（分组/对比依据） */
  dimensions: string[];
  /** 核心关注（度量/口径意图） */
  concerns: string[];
  /** mockGoalResolver 的推荐资源（纯解析阶段为空，由工作区填充） */
  recommendedResourceIds: string[];
  /** 目标对方案的结构性要求（由 buildGoalPlan 填充） */
  coverageRequirements: GoalCoverageRequirement[];
}

export interface DiscoveryIntent {
  type: 'RESOURCE_LOOKUP' | 'BUSINESS_GOAL';
  confidence: number;
}

/** Queries at/above this confidence auto-enter Goal Search; below stay in
 *  Resource Search with a lightweight “让 Xino 按业务目标理解” escalation. */
export const GOAL_INTENT_AUTO_THRESHOLD = 0.75;

// Unambiguous goal phrasing — full intent sentences and meta-questions.
const EXPLICIT_GOAL_RE = /(我想分析|想分析|帮我分析|如何分析|怎么分析|如何评估|需要哪些数据|需要什么数据|分析方案|构建方案|我想了解)/;
// Verb-led goals: 分析……/评估……/比较……/统计……/盘点……/了解……/看看……
// (optionally preceded by 我想/帮我/需要/想要……).
const VERB_LED_GOAL_RE = /^(我想|帮我|需要|想要|希望|请|来)?(分析|评估|比较|对比|统计|盘点|摸底|清查|了解|看看|查看|查询|弄清|理清)/;
// Tail cues that make a topic + analysis verb read as a goal (……情况/……趋势).
const GOAL_TAIL_CUE_RE = /(情况|程度|趋势|关系|供需|表现|状况|变化|分布|规模|占比)/;
const ANALYSIS_VERB_RE = /(分析|评估|比较|对比|统计|盘点|趋势)/;

export const detectDiscoveryIntent = (query: string): DiscoveryIntent => {
  const q = query.trim();
  if (!q) return { type: 'RESOURCE_LOOKUP', confidence: 0 };
  if (EXPLICIT_GOAL_RE.test(q)) return { type: 'BUSINESS_GOAL', confidence: 0.95 };
  if (VERB_LED_GOAL_RE.test(q)) return { type: 'BUSINESS_GOAL', confidence: 0.9 };
  if (ANALYSIS_VERB_RE.test(q) && GOAL_TAIL_CUE_RE.test(q)) return { type: 'BUSINESS_GOAL', confidence: 0.85 };
  // Goal-ish but ambiguous (e.g. a topic name containing 分析) — default to
  // Resource Search and let the user escalate explicitly.
  if (ANALYSIS_VERB_RE.test(q)) return { type: 'BUSINESS_GOAL', confidence: 0.55 };
  return { type: 'RESOURCE_LOOKUP', confidence: 0.8 };
};

interface SubjectTarget {
  subject: string;
  domain: string;
  object: string;
  re: RegExp;
}

// Subject targets — earliest position in the query wins (a goal may mention
// several entities; the leading one is the analysis subject).
const SUBJECT_TARGETS: SubjectTarget[] = [
  { subject: '自然人', domain: 'population', object: 'person', re: /人口|老龄化|年龄结构|常住人口|自然人/ },
  { subject: '养老机构', domain: 'elderly', object: 'org', re: /养老机构|床位|机构养老/ },
  { subject: '社区设施', domain: 'elderly', object: 'facility', re: /社区设施|为老服务|助餐|日间照料|社区养老/ },
];

const DIMENSION_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /街镇|行政区划|区划/, label: '行政区划（街镇）' },
  { re: /区域|地区/, label: '行政区划' },
  { re: /性别/, label: '性别分组' },
  { re: /年龄|年龄段/, label: '年龄结构' },
  { re: /时间|趋势|统计期|按月|逐月|季度|年度/, label: '统计期' },
];

const CONCERN_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /老龄化/, label: '老龄化率' },
  { re: /人口结构|年龄结构/, label: '人口结构' },
  { re: /床位/, label: '床位供给' },
  { re: /覆盖|供需/, label: '资源覆盖' },
];

// Scope = a place name ending in 区/市/县. Leading intent words get stripped
// (“分析闵行区” → 闵行区); place names are capped at 3 hanzi (浦东新/黑龙江).
const SCOPE_RE = /([一-龥]{2,8})[区市县]/;
const SCOPE_LEADING_NOISE = /^(我想|需要|希望|帮我|请|来|分析|评估|了解|查看|查询|盘点|统计|对比|比较|各|的|在)+/;

export const parseBusinessGoal = (rawGoal: string): GoalPlanContext => {
  const q = rawGoal.trim();
  const plan: GoalPlanContext = {
    rawGoal: q,
    subject: '',
    dimensions: [],
    concerns: [],
    recommendedResourceIds: [],
    coverageRequirements: [],
  };
  if (!q) return plan;

  const subjectHits = SUBJECT_TARGETS
    .map(t => ({ t, at: q.search(t.re) }))
    .filter(h => h.at >= 0)
    .sort((a, b) => a.at - b.at);
  if (subjectHits.length > 0) plan.subject = subjectHits[0].t.subject;

  const scopeMatch = q.match(SCOPE_RE);
  if (scopeMatch) {
    const name = scopeMatch[1].replace(SCOPE_LEADING_NOISE, '').slice(-3);
    if (name.length >= 2) plan.scope = name + scopeMatch[0].slice(-1);
  }

  for (const p of DIMENSION_PATTERNS) {
    if (!p.re.test(q)) continue;
    // “行政区划” is the coarse fallback — skip when a finer 区划 cue already hit
    if (p.label === '行政区划' && plan.dimensions.includes('行政区划（街镇）')) continue;
    plan.dimensions.push(p.label);
  }

  plan.concerns = CONCERN_PATTERNS.filter(p => p.re.test(q)).map(p => p.label);

  return plan;
};

/** Resolve the business-object target a parsed subject points at (domain + object ids). */
export const resolveSubjectTarget = (subject?: string): { domain: string; object: string } | undefined =>
  SUBJECT_TARGETS.find(t => t.subject === subject);
