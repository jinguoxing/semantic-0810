/**
 * Evidence 证据领域能力
 *
 * 统一支撑 Evidence Drawer / 发布确认 / 修订历史中的证据呈现。
 */
import { EvidenceKind, EvidenceReference } from './types';
import { nextId } from './store';

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  TABLE: '数据表',
  SEMANTIC_ASSET: '语义资产',
  METRIC: '指标',
  DATA_ASSET: '数据资产',
  DECISION: '业务决策',
  DOCUMENT: '业务文档'
};

export function tableEvidence(
  title: string,
  location: string,
  adoptedDecision?: string,
  version?: string
): EvidenceReference {
  return {
    id: nextId('ev'),
    kind: 'TABLE',
    title,
    source: title,
    ...(version ? { version } : {}),
    location,
    ...(adoptedDecision ? { adoptedDecision } : {})
  };
}

export function semanticAssetEvidence(
  title: string,
  location: string,
  adoptedDecision?: string,
  version?: string
): EvidenceReference {
  return {
    id: nextId('ev'),
    kind: 'SEMANTIC_ASSET',
    title,
    source: title,
    ...(version ? { version } : {}),
    location,
    ...(adoptedDecision ? { adoptedDecision } : {})
  };
}

export function decisionEvidence(title: string, adoptedDecision: string, source = 'Business Object 工作台'): EvidenceReference {
  return {
    id: nextId('ev'),
    kind: 'DECISION',
    title,
    source,
    adoptedDecision
  };
}

export function dataAssetEvidence(title: string, assetId: string, adoptedDecision?: string): EvidenceReference {
  return {
    id: nextId('ev'),
    kind: 'DATA_ASSET',
    title,
    source: `资源超市 · ${assetId}`,
    ...(adoptedDecision ? { adoptedDecision } : {})
  };
}
