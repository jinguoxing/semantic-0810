/**
 * Business Object 领域类型定义
 *
 * Semovix 业务语义核心对象生命周期的统一模型：
 * Registry → Authoring/Change → Detail（业务视角 / 数据支撑）
 * → Bottom-up Resolution / Top-down Data Support → Grounding → Revalidation
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

/** 业务对象修订：发布 / 变更产生正式修订记录 */
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
}

/** Resolution 入口上下文：Bottom-up 对齐完成后返回原上下文 */
export interface ObjectResolutionContext {
  taskId: string;
  sourceType: 'DATA_ASSET' | 'DATA_SEMANTICS' | 'TASK';
  sourceId: string;
  sourceName?: string;
  sourceRevision: string;
  /** 返回路由（App 级 nav 值），如 'asset_detail' */
  returnRoute: string;
  createdAt: string;
}
