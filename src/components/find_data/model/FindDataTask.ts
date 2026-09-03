export type ResourceId = string;

export type PermissionDecision = 'ALLOWED' | 'REQUESTABLE' | 'DENIED' | 'UNKNOWN';

export interface AvailabilityByAction {
  discover: PermissionDecision;
  viewMetadata: PermissionDecision;
  preview: PermissionDecision;
  query: PermissionDecision;
  export: PermissionDecision;
}

export type ResourceRole =
  | 'CORE'
  | 'CONDITIONAL_SUPPORT'
  | 'OPTIONAL_DRILLDOWN'
  | 'PARTIAL_MATCH'
  | 'EXCLUDED';

export type InclusionState =
  | 'RECOMMENDED'
  | 'SELECTED'
  | 'CONDITIONAL'
  | 'NOT_INCLUDED';

export interface FieldMetadata {
  name: string;
  businessName: string;
  type: string;
  group: '主体标识与时间' | '空间区划与归属' | '人员与老龄属性' | '治理与有效周期' | '服务与机构' | '其他';
  role: string;
  goalRelation: string;
  isKey: boolean;
}

export interface FindDataResource {
  id: ResourceId;
  name: string;
  type: '正式指标' | '数据资产' | '业务视图' | '未上架资源';
  granularity: string;
  timeCoverage: string;
  department?: string;
  desc: string;
  roleNote?: string;
  availabilityByAction: AvailabilityByAction;
  fields?: FieldMetadata[];
}

export interface ClarificationOption {
  id: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'SINGLE' | 'MULTIPLE';
  options: ClarificationOption[];
  selectedOptionIds: string[];
}

export interface RequirementHypothesis {
  region?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  populationDefinition?: string;
  bedDefinition?: string;
  dimensions: string[];
  analysisFocus: string[];
  assumptions: string[];
  unresolvedQuestions: ClarificationQuestion[];
}

export interface SearchScope {
  domains: string[];
  includeCrossDepartment: boolean;
  expandedDomains?: string[];
  statusFilter?: string[];
}

export interface DataSolutionItem {
  resourceId: ResourceId;
  role: ResourceRole;
  inclusionState: InclusionState;
  coverage: string[];
  limitations: string[];
  evidenceRefs: string[];
  availabilityByAction: AvailabilityByAction;
}

export interface SolutionGap {
  id: string;
  title: string;
  description: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface RelationshipEvidence {
  sourceResourceId: ResourceId;
  targetResourceId: ResourceId;
  relationType: 'CORRELATION' | 'HIERARCHY' | 'SUPPLEMENT' | 'ALTERNATIVE';
  description: string;
  joinKeys?: string[];
}

export interface DataSolution {
  items: DataSolutionItem[];
  gaps: SolutionGap[];
  relationshipEvidence: RelationshipEvidence[];
  coverageSummary: string[];
  limitationSummary: string[];
  updatedAt: string;
}

export type SurfaceType =
  | 'CLOSED'
  | 'COMPARE'
  | 'FIELDS'
  | 'SOLUTION'
  | 'ACCESS'
  | 'CATALOG'
  | 'ASK_PLAN';

export interface SurfaceState {
  type: SurfaceType;
  mode?: 'QUICK_PREVIEW' | 'WORKBENCH';
  resourceIds?: ResourceId[];
  openedBy?: 'USER_EXPLICIT' | 'ACTION_CLICK' | 'TASK_REQUIRED';
}

export interface ResourceComparisonRow {
  dimension: string;
  values: Record<ResourceId, string>;
  highlightResourceId?: ResourceId;
}

export interface RuntimeStatus {
  active: boolean;
  message: string;
  step?: string;
}

export interface AskPlanCalculationSpec {
  metricName: string;
  isOfficialMetric: boolean;
  formula: string;
  formulaExplanation: string;
  numerator: string;
  denominator: string;
  multiplier: number;
  benchmarkRule: 'WEIGHTED_DISTRICT_AVERAGE' | 'SIMPLE_AVERAGE';
  strictConclusionBoundary: string;
}

export interface AskRunResult {
  success: boolean;
  executedAt: string;
  resultArtifact?: {
    districtWeightedAverage: string;
    totalPopulation: string;
    totalBeds: string;
    lowSupplyTowns: Array<{
      townName: string;
      supplyRatio: string;
      differencePct: string;
    }>;
    boundaryNotice: string;
  };
  permissionSnapshot: Record<ResourceId, AvailabilityByAction>;
  error?: string;
}

export interface AskPlan {
  id: string;
  title: string;
  status: 'DRAFT' | 'READY_TO_RUN' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  calculationSpec: AskPlanCalculationSpec;
  coreResourceIds: ResourceId[];
  conditionalResourceIds: ResourceId[];
  permissionCheckState: 'NOT_CHECKED' | 'CHECKING' | 'ALLOWED' | 'BLOCKED' | 'CHANGED';
  lastRunResult?: AskRunResult;
}

// Conversation Blocks
export interface AssistantTextBlock {
  type: 'TEXT';
  id: string;
  content: string;
}

export interface ClarificationBlock {
  type: 'CLARIFICATION';
  id: string;
  question: ClarificationQuestion;
}

export interface ResultBriefCandidate {
  resourceId: ResourceId;
  title: string;
  typeBadge: string;
  statusBadge: string;
  description: string;
  granularity?: string;
}

export interface ResultBriefBlock {
  type: 'RESULT_BRIEF';
  id: string;
  briefKind:
    | 'CANDIDATE_SUMMARY'
    | 'DIRECT_METRIC'
    | 'SOLUTION_SUMMARY'
    | 'PARTIAL_MATCH'
    | 'ACCESS_SUMMARY'
    | 'ASK_READY';
  title: string;
  subtitle?: string;
  candidates?: ResultBriefCandidate[];
  keyPoints?: string[];
  primaryAction?: {
    label: string;
    actionCode: string;
    payload?: Record<string, unknown>;
  };
  secondaryAction?: {
    label: string;
    actionCode: string;
    payload?: Record<string, unknown>;
  };
  textLinkAction?: {
    label: string;
    actionCode: string;
    payload?: Record<string, unknown>;
  };
}

export interface ActionGroupItem {
  id: string;
  label: string;
  actionCode: string;
  variant?: 'primary' | 'secondary' | 'weak';
  payload?: Record<string, unknown>;
}

export interface ActionGroupBlock {
  type: 'ACTION_GROUP';
  id: string;
  actions: ActionGroupItem[];
}

export interface RuntimeStatusBlock {
  type: 'RUNTIME_STATUS';
  id: string;
  message: string;
}

export interface SystemNoticeBlock {
  type: 'SYSTEM_NOTICE';
  id: string;
  level: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
}

export type ConversationBlock =
  | AssistantTextBlock
  | ClarificationBlock
  | ResultBriefBlock
  | ActionGroupBlock
  | RuntimeStatusBlock
  | SystemNoticeBlock;

export interface ConversationTurn {
  turnId: string;
  sender: 'USER' | 'ASSISTANT' | 'SYSTEM';
  createdAt: string;
  blocks: ConversationBlock[];
}

export type TaskStatus =
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'NEEDS_CLARIFICATION'
  | 'SEARCHING'
  | 'READY'
  | 'WAITING_USER'
  | 'PREPARING_ASK'
  | 'FAILED';

export interface FindDataTaskState {
  taskId: string;
  title: string;
  status: TaskStatus;
  scenarioKey?: string;

  goal?: string;
  requirementHypothesis: RequirementHypothesis;
  searchScope: SearchScope;

  turns: ConversationTurn[];

  resources: Record<ResourceId, FindDataResource>;
  dataSolution: DataSolution;

  activeResourceId?: ResourceId;
  activeSurface: SurfaceState;

  requirementRevision: number;
  searchRevision: number;

  runtimeStatus?: RuntimeStatus;
  askPlan?: AskPlan;

  createdAt: string;
  updatedAt: string;
}

export interface TaskAction {
  actionCode: string;
  payload?: Record<string, unknown>;
}
