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

export type AssetType = 'Table' | 'View' | 'Dataset' | 'Structured File';

export interface GovernanceContextSummary {
  profileStatus: 'profiled' | 'unprofiled'; // 已探查 / 未探查
  qualityStatus: 'normal' | 'attention' | 'critical' | 'untested'; // 质量正常 / 质量关注 / 存在问题 / 未检测
  semanticStatus: 'confirmed' | 'pending' | 'understanding' | 'ununderstood'; // 语义已确认 / 语义待确认 / AI理解中 / 未理解
  lineageStatus: 'available' | 'unavailable'; // 血缘可用 / 血缘未采集
  qualityIssueCount?: number;
  lastProfiledTime?: string;
  semanticConfirmedTime?: string;
}

export interface DataSemanticsQueueItem {
  id: string;
  name: string; // Business/Display Name e.g. "公共服务热线工单记录表"
  technicalName: string; // e.g. "pop_service_hotline"
  qualifiedName: string; // e.g. "hotline_db.service.pop_service_hotline"
  businessDomain: string; // e.g. "公共服务"
  assetType: 'Table' | 'View' | 'Dataset';
  queueCategory: 'pending_review' | 'ai_understanding' | 'draft_pending' | 'confirmed';
  currentSemantics: {
    tableStatus: string; // e.g. "表语义已确认", "AI草稿已生成", "当前无新的有效草稿", "尚未开始语义理解"
    fieldStatus: string; // e.g. "核心字段已确认", "表语义待确认", "AI正在理解表与字段语义"
    detailNote?: string; // e.g. "4项非核心字段待完善", "12项核心字段待确认", "2个新增字段正在重新理解"
  };
  issuesToHandle: {
    title: string; // e.g. "办结时间语义冲突", "对象身份待确认", "—"
    type?: 'conflict' | 'grain' | 'identity' | 'field_pending' | 'none';
  };
  semanticAssociation: {
    terms?: string[]; // e.g. ["服务热线工单", "办结"]
    boundObject?: string; // e.g. "服务工单"
    objectSuggestions?: string[]; // e.g. ["对象建议 2"]
  };
  lastUpdate: {
    time: string; // e.g. "今天 17:16"
    action: string; // e.g. "语义确认", "AI完成理解", "AI理解中"
  };
  actionButton: {
    label: string; // e.g. "处理问题", "确认语义", "查看进度", "开始理解", "查看语义"
    variant: 'danger' | 'warning' | 'indigo' | 'primary' | 'secondary';
  };
  matchContext?: string; // e.g. "匹配字段语义：办结时间 · close_time"
}

export interface DataAssetItem {
  id: string;
  name: string; // Business or display name e.g. "公共服务热线工单记录表"
  technicalName: string;
  qualifiedName: string;
  assetType: AssetType;
  dataSourceName: string;
  dataSourceEngine: 'MySQL' | 'PostgreSQL' | 'Oracle' | 'ClickHouse' | 'Hive' | 'Greenplum' | 'StarRocks';
  database: string;
  schema: string;
  businessDomain: string;
  subDomain?: string;
  description: string;
  owner: string;
  lastScannedTime: string;
  lastScannedStatus: 'success' | 'failed';
  schemaChanged?: boolean;
  schemaChangeNote?: string;
  matchContext?: string;
  businessObject?: string;
  governanceContext: GovernanceContextSummary;
  fieldCount: number;
  rowCount: string;
  size: string;
  updatedAt: string;
}



