// ─── Consumer-facing presentation mappings (internal enums never render raw) ───
// Single source of truth shared by Browse rows, Goal rows, trays and drawers.
import { Lock, Unlock, Clock, Ban, Boxes } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

// Formal consumer access lifecycle:
//   AVAILABLE → 可直接使用
//   REQUESTABLE → 可申请使用
//   PENDING → 申请中
//   UNAVAILABLE → 暂不可用
// SEMANTIC_ONLY rides alongside as a resource-class distinction (business
// objects are consumed as semantics, not queried).
// REQUESTABLE is an invitation to request, not a warning — Blue, not Orange.
export const ACCESS_PRESENTATION: Record<
  string,
  { label: string; dotClass: string; textClass: string; bgClass: string; borderClass: string; Icon?: LucideIcon }
> = {
  AVAILABLE: { label: '可直接使用', dotClass: 'bg-[#16A36A]', textClass: 'text-[#16A36A]', bgClass: 'bg-[#ECFDF5]', borderClass: 'border-[#A7F3D0]', Icon: Unlock },
  REQUESTABLE: { label: '可申请使用', dotClass: 'bg-[#2563EB]', textClass: 'text-[#2563EB]', bgClass: 'bg-[#EFF6FF]', borderClass: 'border-[#BFDBFE]', Icon: Lock },
  PENDING: { label: '申请中', dotClass: 'bg-[#D97706]', textClass: 'text-[#D97706]', bgClass: 'bg-[#FFFBEB]', borderClass: 'border-[#FDE68A]', Icon: Clock },
  UNAVAILABLE: { label: '暂不可用', dotClass: 'bg-[#94A3B8]', textClass: 'text-[#94A3B8]', bgClass: 'bg-[#F1F5F9]', borderClass: 'border-[#E2E8F0]', Icon: Ban },
  SEMANTIC_ONLY: { label: '语义资源', dotClass: 'bg-[#6366F1]', textClass: 'text-[#6366F1]', bgClass: 'bg-[#EEF2FF]', borderClass: 'border-[#C7D2FE]', Icon: Boxes },
};

export const accessPresentation = (status: string) => {
  if (!status) return ACCESS_PRESENTATION.AVAILABLE;
  const upper = status.toUpperCase();
  if (upper === 'RESTRICTED') return ACCESS_PRESENTATION.REQUESTABLE;
  if (upper === 'AVAILABLE') return ACCESS_PRESENTATION.AVAILABLE;
  if (upper === 'PENDING') return ACCESS_PRESENTATION.PENDING;
  if (upper === 'UNAVAILABLE') return ACCESS_PRESENTATION.UNAVAILABLE;
  if (upper === 'SEMANTIC_ONLY') return ACCESS_PRESENTATION.SEMANTIC_ONLY;
  return ACCESS_PRESENTATION[upper] ?? ACCESS_PRESENTATION.AVAILABLE;
};

// Requested capability — WHAT the access request grants, parameterized by
// resource class: an API grants a CALL, a data asset grants a QUERY.
export type RequestOperation = 'QUERY' | 'CALL' | 'PREVIEW' | 'EXPORT';

export const OPERATION_PRESENTATION: Record<
  RequestOperation,
  { label: string; description: string; capabilitySummary: string }
> = {
  QUERY: { label: '查询数据', description: '用于在线分析和问数，不包含数据导出。', capabilitySummary: '在线分析与问数' },
  CALL: { label: '调用服务', description: '用于应用与系统集成在线调用，按接口协议取数，不包含数据导出。', capabilitySummary: '应用集成调用' },
  PREVIEW: { label: '预览数据', description: '用于申请前查看脱敏样例，不包含全量访问。', capabilitySummary: '脱敏样例预览' },
  EXPORT: { label: '导出数据', description: '用于离线分析场景的数据文件导出。', capabilitySummary: '数据文件导出' },
};

// Goal-relative fitness labels — only meaningful with an active goal (goal_search mode)
export const goalFitnessLabel = (status?: string): string => {
  if (status === 'good') return '高度相关';
  if (status === 'warning') return '相关但有时效限制';
  return '可满足当前需求';
};
