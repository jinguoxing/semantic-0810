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
  type: '正式指标' | '数据资产' | 'API' | '业务对象' | '业务视图' | '未上架资源';
  granularity: string;
  timeCoverage: string;
  department?: string;
  desc: string;
  roleNote?: string;
  availabilityByAction: AvailabilityByAction;
  availabilityPeriod?: { start: string; end: string };
  analysisDimensions?: string[];
  timeGrain?: 'DAY' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CURRENT';
  fields?: FieldMetadata[];
}

export interface ClarificationOption {
  id: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

export interface ClarificationResolution {
  status: 'OPEN' | 'RESOLVED' | 'STALE';
  selectedOptionIds: string[];
  resolvedAt?: string;
  resolvedAtRequirementRevision?: number;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'SINGLE' | 'MULTIPLE';
  options: ClarificationOption[];
  maxSelections?: number;
  resolution?: ClarificationResolution;
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
  selectionGroupId?: string;
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
  relationType:
    | 'SEMANTIC_RELATION'
    | 'ANALYTICAL_COMPATIBILITY'
    | 'TECHNICAL_JOIN'
    | 'ALTERNATIVE'
    | 'SUPPLEMENT';
  verificationStatus: 'CONFIRMED' | 'SEMANTIC_ONLY' | 'UNVERIFIED' | 'CONFLICT';
  evidenceLevel: 'STRONG' | 'MEDIUM' | 'WEAK';
  description: string;
  joinKeys?: string[];
  evidenceRefs: string[];
  confirmedBy?: string;
  lastVerifiedAt?: string;
}

export type DataSolutionState = 'EMPTY' | 'EVALUATING' | 'READY' | 'STALE';

export interface DataSolution {
  state: DataSolutionState;
  basedOnRequirementRevision: number;
  basedOnSearchRevision: number;
  items: DataSolutionItem[];
  gaps: SolutionGap[];
  relationshipEvidence: RelationshipEvidence[];
  coverageSummary: string[];
  limitationSummary: string[];
  updatedAt: string;
}

export interface CandidateDelta {
  retainedIds: ResourceId[];
  addedIds: ResourceId[];
  removedIds: ResourceId[];
  allCandidateIds: ResourceId[];
}

export interface DataSolutionPatch {
  mode: 'REPLACE' | 'MERGE';
  upsertItems: DataSolutionItem[];
  removeResourceIds?: ResourceId[];
  gaps?: SolutionGap[];
  relationshipEvidence?: RelationshipEvidence[];
  coverageSummary?: string[];
  limitationSummary?: string[];
}

export type SurfaceType =
  | 'CLOSED'
  | 'COMPARE'
  | 'FIELDS'
  | 'SOLUTION'
  | 'ACCESS'
  | 'RELATED_RESOURCES'
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

export interface ResourceComparisonModel {
  resourceIds: ResourceId[];
  recommendedResourceId?: ResourceId;
  recommendationSummary?: string;
  rows: ResourceComparisonRow[];
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
  benchmarkRule: 'RANK_ONLY' | 'WEIGHTED_DISTRICT_AVERAGE' | 'POLICY_TARGET';
  benchmarkValue?: string;
  benchmarkReference?: string;
  strictConclusionBoundary: string;
}

export interface AskRunResult {
  operationId?: string;
  success: boolean;
  executedAt: string;
  dataOrigin?: 'MOCK_FIXTURE' | 'LIVE_QUERY';
  resultArtifact?: {
    benchmarkLabel: string;
    benchmarkValue?: string;
    benchmarkReference?: string;
    summary: string;
    totalPopulation?: string;
    totalBeds?: string;
    townResults: Array<{
      townName: string;
      supplyRatio: string;
      comparisonNote: string;
    }>;
    boundaryNotice: string;
  };
  permissionSnapshot: Record<ResourceId, AvailabilityByAction>;
  error?: string;
  alignmentValidation?: {
    status: 'VALIDATED' | 'INSUFFICIENT_METADATA' | 'RELATIONSHIP_CONFLICT' | 'TIME_NOT_ALIGNED' | 'GRAIN_NOT_ALIGNED';
    scope?: 'CURRENT_ANALYSIS_ONLY';
    details: string[];
  };
}

export type PermissionCheckState =
  | 'NOT_CHECKED'
  | 'CHECKING'
  | 'ALLOWED'
  | 'BLOCKED'
  | 'CHANGED';

export interface AskPlan {
  id: string;
  title: string;
  status: 'DRAFT' | 'READY_TO_RUN' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  calculationSpec: AskPlanCalculationSpec;
  coreResourceIds: ResourceId[];
  conditionalResourceIds: ResourceId[];
  permissionCheckState: PermissionCheckState;
  permissionBaseline?: Record<ResourceId, PermissionDecision>;
  permissionCheckedAt?: string;
  permissionRevision?: number;
  requirementRevision?: number;
  basedOnSearchRevision?: number;
  timeRange?: {
    start: string;
    end: string;
  };
  lastRunResult?: AskRunResult;
  alignmentRequirement?: AskAlignmentRequirement;
}

export interface AskAlignmentRequirement {
  requiredDimensions: string[];
  requiredTimeGrain: FindDataResource['timeGrain'];
  requiredRelationshipResourcePairs: Array<{ sourceResourceId: ResourceId; targetResourceId: ResourceId }>;
}

export interface AskPlanRunRequest {
  askPlanId: string;
  expectedRequirementRevision: number;
  expectedSearchRevision: number;
  idempotencyKey: string;
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

export type TaskActionCode =
  | 'OPEN_FIELDS'
  | 'OPEN_COMPARE'
  | 'OPEN_SOLUTION'
  | 'OPEN_ACCESS'
  | 'OPEN_RELATED_RESOURCES'
  | 'OPEN_ASK_PLAN'
  | 'CLOSE_SURFACE'
  | 'SELECT_RESOURCE'
  | 'EVALUATE_AND_ADD'
  | 'CREATE_PERMISSION_REQUEST'
  | 'KEEP_AS_GAP'
  | 'SUBMIT_CLARIFICATION'
  | 'REGENERATE_ASK_PLAN'
  | 'REVISE_REQUIREMENT'
  | 'MODIFY_UNDERSTANDING'
  | 'MODIFY_SPEC';

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
    actionCode: TaskActionCode;
    payload?: Record<string, unknown>;
  };
  secondaryAction?: {
    label: string;
    actionCode: TaskActionCode;
    payload?: Record<string, unknown>;
  };
  textLinkAction?: {
    label: string;
    actionCode: TaskActionCode;
    payload?: Record<string, unknown>;
  };
}

export interface ActionGroupItem {
  id: string;
  label: string;
  actionCode: TaskActionCode;
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

export interface PermissionRequestRef {
  requestId: string;
  resourceIds: ResourceId[];
  actionType: 'query' | 'export' | 'preview' | 'viewMetadata';
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export interface ResourceCandidate {
  resourceId: ResourceId;
  title: string;
  reason: string;
  matchType: 'DIRECT' | 'RELATED' | 'PARTIAL';
  proposedRole?: 'CORE' | 'CONDITIONAL_SUPPORT' | 'OPTIONAL_DRILLDOWN' | 'PARTIAL_MATCH';
  sourceSearchRevision: number;
  score?: number;
}

export interface TaskSearchResult {
  query: string;
  totalMatches: number;
  candidateIds: ResourceId[];
  candidateSnapshot: ResourceCandidate[];
  returnedCount: number;
}

export type ExecutionEligibilityReason =
  | 'INCLUDED'
  | 'NOT_SELECTED'
  | 'QUERY_PERMISSION_REQUIRED'
  | 'QUERY_PERMISSION_DENIED'
  | 'RELATIONSHIP_NOT_READY'
  | 'PARTIAL_MATCH'
  | 'OPTIONAL_DRILLDOWN'
  | 'RESOURCE_UNAVAILABLE';

export interface ExecutionAssessment {
  item: DataSolutionItem;
  included: boolean;
  reason: ExecutionEligibilityReason;
  userMessage: string;
}

export interface PendingOperation {
  operationId: string;
  operationType: 'TURN' | 'ACTION' | 'SEARCH' | 'PERMISSION_CHECK' | 'ASK_RUN';
  startedAt: string;
}

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
  searchResult?: TaskSearchResult;
  permissionRequests: Record<string, PermissionRequestRef>;
  comparisonModel?: ResourceComparisonModel;

  activeResourceId?: ResourceId;
  activeSurface: SurfaceState;

  requirementRevision: number;
  searchRevision: number;

  runtimeStatus?: RuntimeStatus;
  pendingOperation?: PendingOperation;
  lastCompletedOperationId?: string;
  askPlan?: AskPlan;
  metadata?: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
}

export interface TaskAction {
  actionCode: TaskActionCode;
  payload?: Record<string, unknown>;
}
