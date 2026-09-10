/**
 * Data Asset Detail View Model（BO-FZ-01 数据驱动资产详情）
 *
 * 身份唯一来源：MOCK_DATA_ASSETS（统一数据资产目录）。
 * DATA_ASSET_DETAIL_BY_ID 只补充 fields / subject / grain / identity / scope /
 * relatedMetrics / relatedApis / freshness，绝不重复或改写目录中的资产身份
 * （id / name / technicalName / qualifiedName / businessDomain / owner 等）。
 * 未知资产一律 ASSET_NOT_FOUND，禁止任何兜底资产。
 */
import { MOCK_DATA_ASSETS } from './dataAssetsData';
import type { GovernanceContextSummary } from '../types';

export interface DataAssetFieldViewModel {
  id: string;
  /** 技术字段名（物理列名） */
  name: string;
  /** 业务字段名（中文业务含义） */
  businessName: string;
  /** 数据类型（物理类型） */
  dataType: string;
  /** 语义类型（可选：时间 / 度量 / 维度 / 标识等） */
  semanticType?: string;
  /** 业务角色（主体主键 / 时间属性 / 分类枚举属性 / 空间维属性 等） */
  role: string;
  /** 字段业务定义 */
  definition: string;
  /** 正式数据标准映射（可选） */
  standardMapping?: string;
  /** 关联正式业务术语（可选） */
  businessTerm?: string;
  /** 是否主体标识字段 */
  isIdentifier?: boolean;
}

export interface DataAssetDetailViewModel {
  // —— 身份区：全部来自统一数据资产目录，禁止页面内二次维护 ——
  id: string;
  name: string;
  technicalName: string;
  qualifiedName: string;
  assetType: string;
  dataSourceName: string;
  businessDomain: string;
  subDomain?: string;
  definition: string;
  owner: string;
  /** 资产承载的正式业务对象（businessObjectId 驱动，禁止按名称猜 ID） */
  businessObject?: { id: string; name: string };
  // —— 补充区：仅由 DATA_ASSET_DETAIL_BY_ID 提供 ——
  subject?: string;
  grain?: string;
  identity?: string;
  scope?: string;
  fields: DataAssetFieldViewModel[];
  governanceContext: Pick<
    GovernanceContextSummary,
    | 'profileStatus'
    | 'semanticStatus'
    | 'qualityStatus'
    | 'lineageStatus'
    | 'lastProfiledTime'
    | 'semanticConfirmedTime'
    | 'qualityIssueCount'
  >;
  freshness?: { updateFrequency?: string; lastUpdatedAt?: string; warning?: string };
  relatedMetrics?: Array<{ id: string; name: string; definition: string }>;
  relatedApis?: Array<{ id: string; name: string; definition: string }>;
}

/** 目录身份之外的补充数据（按资产 ID 提供，不做任何身份字段覆盖） */
interface DataAssetDetailSupplement {
  subject?: string;
  grain?: string;
  identity?: string;
  scope?: string;
  freshness?: { updateFrequency?: string; lastUpdatedAt?: string; warning?: string };
  fields: DataAssetFieldViewModel[];
  relatedMetrics?: Array<{ id: string; name: string; definition: string }>;
  relatedApis?: Array<{ id: string; name: string; definition: string }>;
}

/**
 * 资产详情补充数据（BO-FZ-01 种子）：
 * - asset-1 公共服务热线工单记录表 → bo_service_ticket（服务工单）
 * - asset-2 人口基本信息 → bo_person（自然人）
 * 两份字段清单完全不同，页面内容完全由 assetId 决定。
 */
export const DATA_ASSET_DETAIL_BY_ID: Record<string, DataAssetDetailSupplement> = {
  'asset-1': {
    subject: '服务工单',
    grain: '一行一张服务工单',
    identity: 'ticket_id（工单编号）',
    scope: '热线受理的全量服务工单（含在办与已办结）',
    freshness: {
      updateFrequency: '实时（随工单流转更新）',
      lastUpdatedAt: '2026-08-11 17:20',
      warning: '工单数据随受理实时更新，统计分析建议以办结时间口径为准。'
    },
    fields: [
      {
        id: 'asset-1-field-ticket-id',
        name: 'ticket_id',
        businessName: '工单编号',
        dataType: 'VARCHAR(32)',
        semanticType: '标识',
        role: '主体主键 (PK)',
        definition: '热线服务工单的唯一编号，一张工单的全生命周期记录以此标识串联。',
        standardMapping: 'STD_HOTLINE_TICKET_ID_V1',
        businessTerm: '服务工单编号',
        isIdentifier: true
      },
      {
        id: 'asset-1-field-status',
        name: 'status',
        businessName: '处理状态',
        dataType: 'VARCHAR(16)',
        semanticType: '枚举',
        role: '分类枚举属性',
        definition: '工单当前办理状态（待受理 / 受理中 / 办结 / 退回），支撑办理时效分析。',
        standardMapping: 'STD_TICKET_STATUS_CODE',
        businessTerm: '工单办理状态'
      },
      {
        id: 'asset-1-field-created-time',
        name: 'created_time',
        businessName: '创建时间',
        dataType: 'TIMESTAMP',
        semanticType: '时间',
        role: '时间属性',
        definition: '群众诉求进入热线渠道、生成工单记录的时间。',
        standardMapping: 'STD_SYS_TIMESTAMP',
        businessTerm: '工单创建时间'
      },
      {
        id: 'asset-1-field-accepted-time',
        name: 'accepted_time',
        businessName: '受理时间',
        dataType: 'TIMESTAMP',
        semanticType: '时间',
        role: '时间属性',
        definition: '坐席正式受理工单的时间，与创建时间之差为受理时效。',
        standardMapping: 'STD_SYS_TIMESTAMP',
        businessTerm: '工单受理时间'
      },
      {
        id: 'asset-1-field-close-time',
        name: 'close_time',
        businessName: '办结时间',
        dataType: 'TIMESTAMP',
        semanticType: '时间',
        role: '时间属性',
        definition: '工单办结归档时间，支撑按期办结率与办理时长统计。',
        standardMapping: 'STD_SYS_TIMESTAMP',
        businessTerm: '工单办结时间'
      },
      {
        id: 'asset-1-field-applicant-id',
        name: 'applicant_id',
        businessName: '申请人标识',
        dataType: 'BIGINT',
        semanticType: '关系标识',
        role: '关系支撑属性',
        definition: '诉求申请人的自然人统一标识，关联「自然人」业务对象。',
        standardMapping: 'STD_PERSON_GLOBAL_ID_V1',
        businessTerm: '自然人统一代码 (GB/T 2261.1)'
      },
      {
        id: 'asset-1-field-handler-department-id',
        name: 'handler_department_id',
        businessName: '承办部门标识',
        dataType: 'VARCHAR(32)',
        semanticType: '关系标识',
        role: '关系支撑属性',
        definition: '工单承办部门标识，关联「部门」业务对象，支撑按部门绩效统计。',
        standardMapping: 'STD_DEPARTMENT_CODE',
        businessTerm: '承办部门代码'
      },
      {
        id: 'asset-1-field-region-code',
        name: 'region_code',
        businessName: '所属区域',
        dataType: 'VARCHAR(12)',
        semanticType: '空间维',
        role: '空间维属性',
        definition: '工单所属行政区划编码，支撑区域诉求热力与区域办结分析。',
        standardMapping: 'STD_GB_ADMIN_REGION_2024',
        businessTerm: '县级以上行政区划代码'
      },
      {
        id: 'asset-1-field-channel',
        name: 'channel',
        businessName: '来源渠道',
        dataType: 'VARCHAR(16)',
        semanticType: '枚举',
        role: '分类枚举属性',
        definition: '诉求进入渠道（电话 / 网站 / APP / 政务专线），支撑渠道来源分析。',
        standardMapping: 'STD_TICKET_CHANNEL_CODE',
        businessTerm: '诉求来源渠道'
      },
      {
        id: 'asset-1-field-satisfaction',
        name: 'satisfaction',
        businessName: '满意度评分',
        dataType: 'TINYINT',
        semanticType: '度量',
        role: '度量属性',
        definition: '办结回访满意度评分（1-5），支撑热线服务质量评估。',
        standardMapping: 'STD_SATISFACTION_SCORE',
        businessTerm: '工单满意度'
      }
    ],
    relatedMetrics: [
      {
        id: 'metric_hotline_ontime_rate',
        name: '热线工单按期办结率',
        definition: '在承诺时限内办结的热线工单占已办结工单的比例。'
      },
      {
        id: 'metric_hotline_accept_timeliness',
        name: '热线受理及时率',
        definition: '受理时效达到服务标准的工单占全部工单的比例。'
      }
    ],
    relatedApis: [
      {
        id: 'api_hotline_ticket_progress',
        name: '热线工单办理进度查询 API',
        definition: '按工单编号查询当前办理状态、承办部门与办结时限。'
      }
    ]
  },
  'asset-2': {
    subject: '自然人',
    grain: '一行一个自然人',
    identity: 'person_id（人口唯一标识）',
    scope: '市级常住与流动人口基础信息',
    freshness: {
      updateFrequency: '每日',
      lastUpdatedAt: '2026-08-11 16:52',
      warning: '人口数据每日凌晨批量同步，当日实时统计前建议确认最新同步状态。'
    },
    fields: [
      {
        id: 'asset-2-field-person-id',
        name: 'person_id',
        businessName: '人口唯一标识',
        dataType: 'BIGINT',
        semanticType: '标识',
        role: '主体主键 (PK)',
        definition: '唯一识别一个自然人主体，全域自然人主键统一编码。',
        standardMapping: 'STD_PERSON_GLOBAL_ID_V1',
        businessTerm: '自然人统一代码 (GB/T 2261.1)',
        isIdentifier: true
      },
      {
        id: 'asset-2-field-person-name',
        name: 'person_name',
        businessName: '姓名',
        dataType: 'VARCHAR(64)',
        semanticType: '文本',
        role: '主体描述属性',
        definition: '自然人登记姓名（脱敏展示），仅用于人口登记核对。'
      },
      {
        id: 'asset-2-field-birth-date',
        name: 'birth_date',
        businessName: '出生日期',
        dataType: 'DATE',
        semanticType: '时间',
        role: '时间属性',
        definition: '记录自然人公历出生日期，支撑实足年龄计算与老龄人口识别。',
        standardMapping: 'STD_GB_BIRTH_DATE_V2',
        businessTerm: '出生日期 (GB/T 2261.1)'
      },
      {
        id: 'asset-2-field-age',
        name: 'age',
        businessName: '年龄',
        dataType: 'INT',
        semanticType: '度量',
        role: '派生度量属性',
        definition: '按当前统计时间动态推导的实足年龄，支撑人口年龄结构分析。',
        standardMapping: 'STD_DERIVED_AGE',
        businessTerm: '实足年龄'
      },
      {
        id: 'asset-2-field-gender-code',
        name: 'gender_code',
        businessName: '性别',
        dataType: 'VARCHAR(2)',
        semanticType: '枚举',
        role: '分类枚举属性',
        definition: '记录自然人的生理性别（1-男，2-女，9-未说明），支撑人口结构分析。',
        standardMapping: 'STD_GB_GENDER_CODE',
        businessTerm: '性别代码 (GB/T 2261.1)'
      },
      {
        id: 'asset-2-field-resident-status',
        name: 'resident_status',
        businessName: '常住状态',
        dataType: 'TINYINT',
        semanticType: '枚举',
        role: '分类枚举属性',
        definition: '判断是否纳入常住人口统计范围（1-常住，0-非常住/流动）。',
        standardMapping: 'STD_RESIDENT_STATUS_CODE',
        businessTerm: '常住人口标识'
      },
      {
        id: 'asset-2-field-household-status',
        name: 'household_status',
        businessName: '户籍状态',
        dataType: 'VARCHAR(8)',
        semanticType: '枚举',
        role: '分类属性',
        definition: '家庭户 / 集体户等户籍登记类型，支撑户籍人口与常住人口对比。',
        standardMapping: 'STD_HOUSEHOLD_TYPE',
        businessTerm: '户籍类型'
      },
      {
        id: 'asset-2-field-region-code',
        name: 'region_code',
        businessName: '所属行政区域',
        dataType: 'VARCHAR(12)',
        semanticType: '空间维',
        role: '空间维属性',
        definition: '国标行政区划编码，支撑省、市、区县等层级人口分析。',
        standardMapping: 'STD_GB_ADMIN_REGION_2024',
        businessTerm: '县级以上行政区划代码'
      }
    ],
    relatedMetrics: [
      {
        id: 'metric_resident_population',
        name: '常住人口数',
        definition: '基于常住状态口径统计的常住人口规模。'
      },
      {
        id: 'metric_aging_rate',
        name: '老龄化率',
        definition: '60 岁及以上常住人口占常住人口总数的比例。'
      }
    ],
    relatedApis: [
      {
        id: 'api_population_stat_query',
        name: '人口统计汇总查询 API',
        definition: '按区域与口径查询人口规模、结构等统计汇总结果。'
      }
    ]
  }
};

export type DataAssetDetailResult =
  | { ok: true; asset: DataAssetDetailViewModel }
  | { ok: false; error: 'ASSET_NOT_FOUND' };

/**
 * 资产详情选择器（BO-FZ-01）：身份字段一律取自 MOCK_DATA_ASSETS，
 * 补充字段一律取自 DATA_ASSET_DETAIL_BY_ID；找不到目录资产即 ASSET_NOT_FOUND，
 * 不做任何名称猜测或默认资产兜底。
 */
export function getDataAssetDetail(assetId?: string): DataAssetDetailResult {
  const trimmed = assetId?.trim();
  if (!trimmed) return { ok: false, error: 'ASSET_NOT_FOUND' };

  const item = MOCK_DATA_ASSETS.find((asset) => asset.id === trimmed);
  if (!item) return { ok: false, error: 'ASSET_NOT_FOUND' };

  const supplement = DATA_ASSET_DETAIL_BY_ID[item.id];
  const businessObject =
    item.businessObjectId && item.businessObject
      ? { id: item.businessObjectId, name: item.businessObject }
      : undefined;

  return {
    ok: true,
    asset: {
      id: item.id,
      name: item.name,
      technicalName: item.technicalName,
      qualifiedName: item.qualifiedName,
      assetType: item.assetType,
      dataSourceName: item.dataSourceName,
      businessDomain: item.businessDomain,
      ...(item.subDomain ? { subDomain: item.subDomain } : {}),
      definition: item.description,
      owner: item.owner,
      ...(businessObject ? { businessObject } : {}),
      ...(supplement?.subject ? { subject: supplement.subject } : {}),
      ...(supplement?.grain ? { grain: supplement.grain } : {}),
      ...(supplement?.identity ? { identity: supplement.identity } : {}),
      ...(supplement?.scope ? { scope: supplement.scope } : {}),
      fields: supplement?.fields ?? [],
      governanceContext: {
        profileStatus: item.governanceContext.profileStatus,
        semanticStatus: item.governanceContext.semanticStatus,
        qualityStatus: item.governanceContext.qualityStatus,
        lineageStatus: item.governanceContext.lineageStatus,
        ...(item.governanceContext.lastProfiledTime
          ? { lastProfiledTime: item.governanceContext.lastProfiledTime }
          : {}),
        ...(item.governanceContext.semanticConfirmedTime
          ? { semanticConfirmedTime: item.governanceContext.semanticConfirmedTime }
          : {}),
        ...(typeof item.governanceContext.qualityIssueCount === 'number'
          ? { qualityIssueCount: item.governanceContext.qualityIssueCount }
          : {})
      },
      ...(supplement?.freshness ? { freshness: supplement.freshness } : {}),
      ...(supplement?.relatedMetrics ? { relatedMetrics: supplement.relatedMetrics } : {}),
      ...(supplement?.relatedApis ? { relatedApis: supplement.relatedApis } : {})
    }
  };
}
