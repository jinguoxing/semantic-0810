export type FieldStatus = 'confirmed' | 'pending' | 'conflict' | 'abnormal';
export type ConfidenceLevel = '高可信' | '中可信' | '低可信';
export type SupportLevel = '强支持' | '中支持' | '辅助支持';

export interface FieldItem {
  id: string;
  name: string;
  tableName: string;
  dataType: string;
  currentSemantic: string;
  recommendedSemantic: string;
  businessName: string;
  status: FieldStatus;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number; // e.g. 82
  description?: string;
  updatedAt: string;
  isBatchEligible?: boolean;
}

export interface EvidenceItem {
  id: string;
  type: 'naming' | 'profiling' | 'structure' | 'standard';
  title: string;
  params: { label: string; value: string }[];
  explanation: string;
  supportLevel: SupportLevel;
}

export interface CoTStep {
  step: number;
  title: string;
  detail: string;
  status: 'passed' | 'warning' | 'info';
}

export interface CoTReasoning {
  targetField: string;
  candidateCluster: string[];
  currentRecommendation: string;
  steps: CoTStep[];
  latencyMs: number;
  sourceTable: string;
  rulesVersion: string;
  securityLevel: string;
  hashStamp: string;
}

export interface CandidateExplanation {
  id: string;
  semantic: string;
  confidenceScore: number;
  isRecommended?: boolean;
  businessNameSuggestion: string;
  reasoningBrief: string;
}

export interface SemanticAssetGenerated {
  businessObject: {
    targetObject: string;
    newAttribute: string;
    lifecycleUsage: string;
  };
  terminologyAndAnalytics: {
    term: string;
    analyticsSupport: string[];
  };
  aiConsumption: {
    nlQueryUnderstanding: string;
    generatableOutcome: string;
  };
}

export interface CurrentAssetDefinition {
  field: string;
  tableName: string;
  dataType: string;
  semanticType: string;
  fieldRole: string;
  businessName: string;
  businessDefinition: string;
  badges: string[];
}

export interface HistoryVersion {
  version: string;
  semantic: string;
  source: 'AI推荐' | '人工调整' | '初始导入';
  timestamp: string;
  operator: string;
  note?: string;
}

export interface DownstreamImpact {
  objectImpact: {
    objectName: string;
    newAttribute: string;
    description: string;
  };
  metricImpact: {
    metrics: string[];
  };
  aiConsumptionImpact: {
    nlQuerySupport: string;
    analyticsSupport: string;
    reportSupport: string;
  };
}

export interface CompleteFieldGovernanceData {
  fieldItem: FieldItem;
  aiResult: {
    recommendedSemantic: string;
    businessNameSuggestion: string;
    dataType: string;
    confidenceLevel: ConfidenceLevel;
    confidenceScore: number;
    summary: string;
  };
  evidences: EvidenceItem[];
  cotReasoning: CoTReasoning;
  candidates: CandidateExplanation[];
  generatedAssets: SemanticAssetGenerated;
  currentAsset: CurrentAssetDefinition;
  historyVersions: HistoryVersion[];
  downstreamImpact: DownstreamImpact;
}
