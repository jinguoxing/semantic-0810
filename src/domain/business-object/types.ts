/**
 * Business Object 领域类型定义
 *
 * Semovix 业务语义核心对象生命周期的统一模型：
 * Registry → Authoring/Change → Detail（业务视角 / 数据支撑）
 * → Bottom-up Resolution / Top-down Data Support → Grounding → Revalidation
 *
 * 三条修订生命周期严格分离（Inv01-Inv03）：
 * - BusinessObjectRevision：仅业务定义发布 / 变更产生
 * - DataSupportRevision：仅数据支撑绑定动作产生
 * - GroundingRevision：仅属性 / 关系落地修正产生
 */

/** 业务对象生命周期状态 */
export type BusinessObjectStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';

/** 数据支撑绑定状态 */
export type BindingStatus = 'CANDIDATE' | 'EFFECTIVE' | 'NEEDS_REVALIDATION' | 'RETIRED';

/** 数据支撑绑定角色 */
export type BindingRole = 'PRIMARY' | 'SECONDARY';

/** 证据种类 */
export type EvidenceKind =
  | 'TABLE'
  | 'SEMANTIC_ASSET'
  | 'METRIC'
  | 'DATA_ASSET'
  | 'DECISION'
  | 'DOCUMENT';

/** 证据引用：所有领域决策必须可追溯 */
export interface EvidenceReference {
  id: string;
  kind: EvidenceKind;
  title: string;
  /** 证据来源系统或页面 */
  source: string;
  version?: string;
  /** 证据定位（字段、路径、章节等） */
  location?: string;
  /** 采纳该证据时作出的决策 */
  adoptedDecision?: string;
}

/** 业务属性 */
export interface BusinessAttribute {
  id: string;
  name: string;
  meaning: string;
  isIdentifier?: boolean;
}

/** 业务关系 */
export interface BusinessRelationship {
  id: string;
  relationName: string;
  targetObjectId: string;
  targetObjectName: string;
  meaning: string;
}

/** 关联业务术语 */
export interface BusinessTerm {
  id: string;
  name: string;
  definition: string;
  domain: string;
}

/** 关联指标 */
export interface RelatedMetric {
  id: string;
  name: string;
  definition: string;
  domain: string;
}

/** 相关数据（非正式实现的支撑数据） */
export interface RelatedDataItem {
  name: string;
  role: string;
  scope: string;
  note: string;
}

/**
 * 业务对象定义快照：某一次正式发布时的完整定义。
 * Draft 的待发布内容与 BusinessObjectRevision 的留档内容共用该结构，
 * 保证「历史版本可完整还原正式定义」。
 */
export interface BusinessObjectDefinitionSnapshot {
  name: string;
  aliases: string[];
  definition: string;
  domain: string;
  identity: { name: string; meaning: string };
  attributes: BusinessAttribute[];
  relationships: BusinessRelationship[];
  evidence: EvidenceReference[];
}

/** 业务对象草稿模式：CREATE = 新建对象，CHANGE = 修改已有对象 */
export type BusinessObjectDraftMode = 'CREATE' | 'CHANGE';

/** 业务对象草稿状态：WORKING → PUBLISHED / DISCARDED */
export type BusinessObjectDraftStatus = 'WORKING' | 'PUBLISHED' | 'DISCARDED';

/** 业务对象草稿：Create / Change 工作区的待发布定义，发布前不触碰正式对象 */
export interface BusinessObjectDraft {
  id: string;
  mode: BusinessObjectDraftMode;
  /** CHANGE 模式：被修改的正式对象 */
  objectId?: string;
  /** CHANGE 模式：起草时基于的正式修订号（乐观并发控制） */
  baseRevision?: string;
  content: BusinessObjectDefinitionSnapshot;
  status: BusinessObjectDraftStatus;
  createdAt: string;
  updatedAt: string;
}

/** 业务对象：企业 AI 可理解、引用、执行任务的稳定语义锚点 */
export interface BusinessObject {
  id: string;
  name: string;
  aliases: string[];
  definition: string;
  domain: string;
  status: BusinessObjectStatus;
  /** 当前生效修订号，如 'R1' */
  currentRevision: string;
  identity: {
    /** 识别属性名，如 '工单编号' */
    name: string;
    meaning: string;
  };
  attributes: BusinessAttribute[];
  relationships: BusinessRelationship[];
  evidence: EvidenceReference[];
  terms: BusinessTerm[];
  metrics: RelatedMetric[];
  relatedData: RelatedDataItem[];
  updatedAt: string;
}

/** 属性落地：业务属性在某个数据实现中的字段级映射 */
export interface AttributeGrounding {
  attributeName: string;
  /** 落地来源名称（实现本身或扩展表） */
  sourceName: string;
  isExtension?: boolean;
  field: string;
  semantics: string;
  isSupported: boolean;
  isIdentifier?: boolean;
  /** 语义存疑，等待本地修正 */
  needsCorrection?: boolean;
  correctionReason?: string;
}

/** 关系落地：业务关系在某个数据实现中的字段级映射 */
export interface RelationshipGrounding {
  relationName: string;
  targetObjectId: string;
  targetObjectName: string;
  sourceField: string;
  targetIdentity: string;
}

/**
 * 关系落地候选字段：与目标对象身份兼容的候选字段白名单。
 * 关系 Grounding 修正只允许落入同 targetObjectId 的候选字段（Inv08），
 * 例如「申请人 → 自然人」只允许 applicant_id / person_id 等自然人侧字段，
 * 禁止 ticket_id / status / close_time 等工单自身字段。
 */
export interface RelationshipCandidateField {
  /** 物理字段名，如 'applicant_id' */
  field: string;
  /** 业务标签，如 '申请人标识' */
  label: string;
  /** 来源实现名 */
  sourceName: string;
  semantics: string;
  /** 该字段身份兼容的目标业务对象 */
  targetObjectId: string;
  evidence?: string;
}

/** 实现扩展表：通过相同身份空间补充属性 */
export interface ImplementationExtension {
  name: string;
  techName: string;
  status: string;
  parentImplementation: string;
  identityMapping: string;
  providedAttr: string;
  providedField: string;
  note: string;
}

/** 数据实现：承载业务对象的具体表 / 视图 */
export interface DataImplementation {
  id: string;
  businessObjectId: string;
  name: string;
  techName: string;
  warehouseTable: string;
  assetId: string;
  scope: string;
  granularity: string;
  identity: string;
  scopeRelationText: string;
  scopeRelationNote: string;
  attributes: AttributeGrounding[];
  relationships: RelationshipGrounding[];
  /** 关系落地修正的候选字段白名单（可选，供 Grounding 修正校验） */
  relationshipCandidateFields?: RelationshipCandidateField[];
  extension?: ImplementationExtension | null;
}

/** 数据支撑绑定：业务对象与数据实现之间的正式关系 */
export interface DataSupportBinding {
  id: string;
  businessObjectId: string;
  implementationId: string;
  status: BindingStatus;
  role: BindingRole;
  scope: string;
  evidence: EvidenceReference[];
  /** 绑定修订号，如 'R1' */
  revision: string;
  createdAt: string;
  /** 最近一次确认生效的时间 */
  confirmedAt?: string;
  /** 待复核信息：语义修订变化触发 NEEDS_REVALIDATION 时填写 */
  revalidation?: {
    reason: string;
    /** 触发复核的语义侧修订号 */
    sourceRevision: string;
    /** 受影响的属性 / 关系名 */
    affectedTargets: string[];
    raisedAt: string;
  };
}

/** Grounding 修订：属性 / 关系落地修正的历史记录 */
export interface GroundingRevision {
  id: string;
  businessObjectId: string;
  bindingId: string;
  type: 'ATTRIBUTE' | 'RELATIONSHIP';
  /** 被修正的属性名或关系名 */
  targetName: string;
  before: { field: string; semantics?: string };
  after: { field: string; semantics?: string };
  reason: string;
  evidence: string[];
  status: 'ACTIVE' | 'HISTORY';
  createdAt: string;
}

/** 业务对象修订：发布 / 变更产生正式修订记录（仅定义生命周期，Inv01） */
export interface BusinessObjectRevision {
  id: string;
  businessObjectId: string;
  /** 修订号，如 'R2' */
  revision: string;
  summary: string;
  changes: string[];
  changedBy: string;
  createdAt: string;
  status: 'ACTIVE' | 'HISTORY';
  /** 该修订对应的完整正式定义快照 */
  snapshot: BusinessObjectDefinitionSnapshot;
}

/**
 * 数据支撑动作：数据支撑绑定生命周期的每一步（Inv02）。
 * 与 BusinessObjectRevision 严格分离：这些动作永不产生业务对象修订。
 */
export type DataSupportAction =
  | 'BOTTOM_UP_ALIGN'
  | 'TOP_DOWN_CONFIRM'
  | 'MARK_REVALIDATION'
  | 'REVALIDATION_KEEP'
  | 'REBIND'
  | 'RETIRE'
  | 'SET_PRIMARY';

/** 数据支撑修订：绑定确认 / 复核 / 重绑 / 退休 / 主实现切换的历史记录 */
export interface DataSupportRevision {
  id: string;
  businessObjectId: string;
  bindingId: string;
  action: DataSupportAction;
  beforeStatus?: BindingStatus;
  afterStatus?: BindingStatus;
  beforeImplementationId?: string;
  afterImplementationId?: string;
  reason: string;
  changedBy: string;
  createdAt: string;
}

/**
 * Grounding 修正输入。type 必须显式声明（Inv08 配套约束）：
 * 禁止通过 targetName 是否包含「→」等字符串规则推断类型。
 */
export interface GroundingCorrectionInput {
  bindingId: string;
  type: 'ATTRIBUTE' | 'RELATIONSHIP';
  /** 属性名（ATTRIBUTE）或关系名（RELATIONSHIP） */
  targetName: string;
  /** RELATIONSHIP 必填：目标业务对象，用于校验候选字段身份兼容 */
  targetObjectId?: string;
  fromField: string;
  toField: string;
  reason: string;
  evidence: string[];
  changedBy?: string;
}

/** Resolution 任务上下文状态：OPEN → POSTPONED / COMPLETED / CANCELLED */
export type ObjectResolutionStatus = 'OPEN' | 'POSTPONED' | 'COMPLETED' | 'CANCELLED';

/** Resolution 入口上下文：Bottom-up 对齐完成后返回原上下文 */
export interface ObjectResolutionContext {
  taskId: string;
  sourceType: 'DATA_ASSET' | 'DATA_SEMANTICS' | 'TASK';
  sourceId: string;
  sourceName?: string;
  sourceRevision: string;
  /** 返回路由（App 级 nav 值），如 'asset_detail' */
  returnRoute: string;
  /** 返回后聚焦的元素或入口标识 */
  returnFocus?: string;
  createdAt: string;
  status: ObjectResolutionStatus;
  updatedAt: string;
}

/**
 * Top-down 数据支撑发现上下文：从业务对象 Detail 进入发现工作区时必带，
 * 禁止无上下文的固定「服务工单」演示页。
 */
export interface DataSupportDiscoveryContext {
  businessObjectId: string;
  candidateBindingId?: string;
  returnRoute: string;
  returnFocus?: string;
}
