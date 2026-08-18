// ─── Consumer-facing presentation mappings (internal enums never render raw) ───
// Single source of truth shared by Browse rows, Goal rows, trays and drawers.

export const TYPE_PRESENTATION: Record<string, string> = {
  DATA_ASSET: '数据资产',
  METRIC: '指标',
  DATA_API: '接口服务',
  BUSINESS_OBJECT: '业务对象',
};

export const SUBTYPE_PRESENTATION: Record<string, string> = {
  VIEW: '视图',
  DATASET: '数据集',
};

// Certification display — per-type official badge label.
// Certification (trust designation) is orthogonal to fitness (goal-relative).
export const CERTIFICATION_BADGE: Record<string, string> = {
  DATA_ASSET: '正式资源',
  METRIC: '正式指标',
  DATA_API: '正式服务',
  BUSINESS_OBJECT: '正式对象',
};

// Frozen four-state access presentation.
// restricted is an invitation to request, not a warning — hence Blue, not Orange.
export const ACCESS_PRESENTATION: Record<string, { label: string; dotClass: string; textClass: string }> = {
  available: { label: '可直接使用', dotClass: 'bg-[#16A36A]', textClass: 'text-[#16A36A]' },
  restricted: { label: '可申请使用', dotClass: 'bg-[#2563EB]', textClass: 'text-[#2563EB]' },
  pending: { label: '申请中', dotClass: 'bg-[#D97706]', textClass: 'text-[#D97706]' },
  semantic_only: { label: '语义资源', dotClass: 'bg-[#6366F1]', textClass: 'text-[#6366F1]' },
};

export const accessPresentation = (status: string) =>
  ACCESS_PRESENTATION[status] ?? ACCESS_PRESENTATION.available;

// Goal-relative fitness labels — only meaningful with an active goal (goal_search mode)
export const goalFitnessLabel = (status?: string): string => {
  if (status === 'good') return '高度相关';
  if (status === 'warning') return '相关但有时效限制';
  return '可满足当前需求';
};
