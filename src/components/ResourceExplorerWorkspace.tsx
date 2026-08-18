import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Sparkles,
  FileCheck,
  Table,
  BarChart3,
  Globe,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  X,
  Eye,
  Info,
  Play,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Users,
  Layers3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Filter,
  Check,
  RefreshCw,
  Database,
  Code2,
  FileText,
  KeyRound,
  Lock,
  Unlock,
  TrendingUp,
  Share2,
  Copy,
  FolderGit2,
  Network,
  Plus,
  Trash2,
  MoreHorizontal,
  ArrowLeft,
  Bot
} from 'lucide-react';
import { SingleResourceAccessRequestDrawer } from './SingleResourceAccessRequestDrawer';
import {
  TYPE_PRESENTATION,
  SUBTYPE_PRESENTATION,
  ACCESS_PRESENTATION,
  accessPresentation,
  goalFitnessLabel,
} from './resourcePresentation';

export type ExplorerMode = 'browse' | 'resource_search' | 'goal_search';

interface ResourceExplorerWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  initialQuery?: string;
  initialMode?: ExplorerMode;
  /** Demo/story-only: pre-checked candidates. Product default is an empty selection. */
  initialSelectedResourceIds?: string[];
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToMetrics?: () => void;
  onNavigateToBusinessObject?: () => void;
  onNavigateToBusinessObjectDetail?: (objectId: string, fromGoalSearch?: boolean, goalQuery?: string) => void;
  onNavigateToDataAssets?: () => void;
  onNavigateToDataAssetDetail?: (assetId: string, fromGoalSearch?: boolean, goalQuery?: string) => void;
  onNavigateToMetricDetail?: (metricId: string, fromGoalSearch?: boolean, goalQuery?: string) => void;
  onNavigateToMultiResourceRequest?: () => void;
}

export interface FieldItem {
  name: string;
  cnName: string;
  type: string;
  description: string;
  isKey?: boolean;
}

export interface ResourceItem {
  id: string;
  name: string;
  type: 'BUSINESS_OBJECT' | 'DATA_ASSET' | 'METRIC' | 'DATA_API';
  subType?: string;
  description: string;
  context: string;
  domain: string;
  domainName: string;
  object: string;
  objectName: string;
  consumerFact?: string;
  extraInfo?: string;
  accessStatus: 'available' | 'restricted' | 'semantic_only';
  fitnessStatus: 'ready' | 'good' | 'warning' | 'semantic';
  fitnessLabel?: string;
  accessLabel?: string;
  updatedAt: string;
  owner?: string;
  securityLevel?: string;
  updateFrequency?: string;
  matchReason?: string;
  usageCount?: number;
  useCases?: string[];
  fields?: FieldItem[];
  metricFormula?: string;
  metricUnit?: string;
  timeGranularity?: string;
  dimensions?: string[];
  apiEndpoint?: string;
  apiMethod?: string;
  apiParams?: { name: string; type: string; required: boolean; desc: string }[];
  relatedAssets?: { name: string; type: string; id: string }[];
}

export interface SolutionResourceItem {
  id: string;
  name: string;
  type: 'BUSINESS_OBJECT' | 'DATA_ASSET' | 'METRIC' | 'DATA_API';
  subType?: string;
  role: 'CORE_DATA' | 'CORE_METRIC' | 'DIMENSION' | 'SUPPORTING_DATA' | 'SUBJECT';
  roleLabel: string;
  description: string;
  whyNeeded: string;
  accessStatus: 'available' | 'restricted' | 'dependent' | 'semantic_only';
  accessLabel: string;
  fitnessStatus: 'ready' | 'good' | 'warning' | 'semantic';
  fitnessLabel: string;
  isKeyDependency?: boolean;
  fields?: FieldItem[];
  metricFormula?: string;
}

export interface RelatedResourceCandidate {
  id: string;
  name: string;
  type: 'BUSINESS_OBJECT' | 'DATA_ASSET' | 'METRIC' | 'DATA_API';
  subType?: string;
  description: string;
  context: string;
  accessStatus: 'available' | 'restricted';
  accessLabel: string;
  fitnessLabel?: string;
  fitnessStatus?: 'ready' | 'good' | 'warning';
  potentialRole: string;
  whyUseful: string;
}

// Full Enterprise Discoverable Resources Dataset (Used in BROWSE & RESOURCE_SEARCH modes)
const ALL_DISCOVERABLE_RESOURCES: ResourceItem[] = [
  {
    id: 'res-02',
    name: '人口基本信息视图',
    type: 'DATA_ASSET',
    subType: 'VIEW',
    description: '提供自然人的年龄、出生日期、常住状态、户籍及所属行政区域等基础人口信息。',
    context: '人口服务 · 自然人',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '一行代表：一个自然人主体',
    accessStatus: 'restricted',
    accessLabel: '需申请',
    fitnessStatus: 'ready',
    fitnessLabel: '可用于分析',
    updatedAt: '2026-08-14',
    usageCount: 342,
    owner: '统计调查与人口运行处',
    securityLevel: 'L2（受限访问）',
    updateFrequency: '每日 02:00 定时增量',
    matchReason: '包含年龄、出生日期等人口年龄分析所需信息',
    useCases: ['人口结构分析', '老龄化分析', '区域人口统计'],
    fields: [
      { name: 'person_id', cnName: '自然人ID', type: 'BIGINT', description: '主键', isKey: true },
      { name: 'age', cnName: '年龄', type: 'INT', description: '按当前统计时间动态计算的实足年龄' },
      { name: 'birth_date', cnName: '出生日期', type: 'DATE', description: '自然人出生日期' },
      { name: 'age_group', cnName: '年龄段', type: 'VARCHAR(16)', description: '0-14岁 / 15-59岁 / 60-79岁 / 80岁以上' },
      { name: 'is_permanent', cnName: '是否常住人口', type: 'TINYINT', description: '1-常住，0-非常住' },
      { name: 'street_code', cnName: '所属街镇代码', type: 'VARCHAR(12)', description: '关联行政区划代码' }
    ],
    relatedAssets: [
      { name: '老龄化率', type: 'METRIC', id: 'res-03' },
      { name: '行政区划基础数据', type: 'DATA_ASSET', id: 'res-05' }
    ]
  },
  {
    id: 'res-03',
    name: '老龄化率',
    type: 'METRIC',
    description: '60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。',
    context: '人口服务 · 自然人',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '单位：% · 行政区域 × 统计期',
    accessStatus: 'available',
    accessLabel: '依赖数据访问条件',
    fitnessStatus: 'ready',
    fitnessLabel: '正式指标',
    updatedAt: '2026-08-12',
    usageCount: 518,
    owner: '发展规划与老龄办',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '月度 / 季度 / 年度',
    matchReason: '正式指标口径直接对应人口年龄结构分析',
    useCases: ['老龄化程度评估', '区域对比分析', '人口结构监测'],
    metricFormula: '( count(distinct case when age >= 60 and is_permanent=1 then person_id end) / count(distinct case when is_permanent=1 then person_id end) ) * 100%',
    metricUnit: '% (百分比)',
    timeGranularity: '年 / 季 / 月',
    dimensions: ['行政区划（省/市/区县/街镇）', '统计期（年度/季度）', '性别分组'],
    relatedAssets: [
      { name: '人口基本信息视图', type: 'DATA_ASSET', id: 'res-02' }
    ]
  },
  {
    id: 'res-05',
    name: '行政区划基础数据',
    type: 'DATA_ASSET',
    description: '提供街镇、居委及行政区划编码等标准区域信息，用于区域聚合与比较。',
    context: '公共基础 · 行政区域',
    domain: 'public',
    domainName: '公共基础',
    object: 'region',
    objectName: '行政区域',
    consumerFact: '一行代表：一个行政区划单元',
    accessStatus: 'available',
    accessLabel: '可使用',
    fitnessStatus: 'good',
    fitnessLabel: '状态良好',
    updatedAt: '2026-08-01',
    usageCount: 893,
    owner: '基础地理与民政信息科',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '半年 / 依据民政调整',
    matchReason: '支持人口年龄数据按街镇进行分析',
    useCases: ['区域聚合统计', '地址标准化', '地理维度关联'],
    fields: [
      { name: 'region_code', cnName: '区划代码', type: 'VARCHAR(12)', description: '国标行政区划编码', isKey: true },
      { name: 'region_name', cnName: '区划全称', type: 'VARCHAR(64)', description: '街道/镇行政名称' },
      { name: 'parent_code', cnName: '上级区划代码', type: 'VARCHAR(12)', description: '归属区县代码' },
      { name: 'level', cnName: '行政层级', type: 'TINYINT', description: '3-街镇' }
    ]
  },
  {
    id: 'res-04-asset',
    name: '常住人口主题视图',
    type: 'DATA_ASSET',
    subType: 'VIEW',
    description: '提供常住人口身份、年龄结构、居住状态及区域分布等主题数据。',
    context: '人口服务 · 常住人口',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '一行代表：一个常住人口主题记录',
    accessStatus: 'restricted',
    accessLabel: '需申请',
    fitnessStatus: 'ready',
    fitnessLabel: '可用于分析',
    updatedAt: '2026-08-11',
    usageCount: 127,
    owner: '人口大数据中心',
    securityLevel: 'L2（受限访问）',
    updateFrequency: '每日同步',
    matchReason: '与常住人口年龄分析相关',
    useCases: ['常住人口分析', '居住状态统计'],
    fields: [
      { name: 'person_id', cnName: '自然人ID', type: 'BIGINT', description: '主键', isKey: true },
      { name: 'age_strata', cnName: '年龄分层', type: 'VARCHAR(32)', description: '少年/青壮年/初老/高龄' },
      { name: 'housing_status', cnName: '居住状态', type: 'VARCHAR(16)', description: '自购/租住/养老机构' }
    ]
  },
  {
    id: 'res-07',
    name: '人口年龄结构数据集',
    type: 'DATA_ASSET',
    subType: 'DATASET',
    description: '按照年龄段和行政区域汇总的人口结构数据。',
    context: '统计调查 · 人口集市',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '一行代表：一个街镇某一统计期的年龄区间聚合结果',
    accessStatus: 'available',
    accessLabel: '可使用',
    fitnessStatus: 'warning',
    fitnessLabel: '更新至上月',
    updatedAt: '2026-07-31',
    usageCount: 204,
    owner: '统计局人口处',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '月度更新',
    matchReason: '已形成年龄区间聚合结果',
    useCases: ['人口结构快速分析', '年龄段分布统计'],
    fields: [
      { name: 'stat_month', cnName: '统计月份', type: 'VARCHAR(7)', description: 'YYYY-MM' },
      { name: 'region_code', cnName: '区划代码', type: 'VARCHAR(12)', description: '街镇编码' },
      { name: 'age_bracket', cnName: '年龄区间', type: 'VARCHAR(16)', description: '如 60-64, 65-69' },
      { name: 'population_count', cnName: '区间人数', type: 'INT', description: '总人数' }
    ]
  },
  {
    id: 'res-01',
    name: '自然人',
    type: 'BUSINESS_OBJECT',
    description: '人口业务中代表具有身份、年龄、居住及人口属性的核心业务对象。',
    context: '人口服务',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    extraInfo: '12 数据资产 · 7 指标 · 3 API',
    accessStatus: 'semantic_only',
    accessLabel: '语义资源',
    fitnessStatus: 'semantic',
    fitnessLabel: '核心概念',
    updatedAt: '2026-08-10',
    usageCount: 466,
    owner: '人口大数据中心',
    securityLevel: 'L3（业务概念）',
    updateFrequency: '模型持续演进',
    matchReason: '是当前人口年龄相关资源的核心业务主体',
    useCases: ['人口类业务建模', '主体识别与关联'],
    fields: [
      { name: 'person_id', cnName: '自然人唯一标识', type: 'STRING', description: '全域自然人主键统一编码', isKey: true },
      { name: 'birth_date', cnName: '出生日期', type: 'DATE', description: '用于计算精确年龄' },
      { name: 'gender', cnName: '性别', type: 'VARCHAR(2)', description: '男 / 女' }
    ]
  },
  {
    id: 'res-04',
    name: '人口统计查询服务',
    type: 'DATA_API',
    description: '提供按行政区域与年龄范围查询人口统计结果的数据服务。',
    context: '人口服务 · 统计查询',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '输入：区域 / 年龄 / 时间',
    accessStatus: 'available',
    accessLabel: '可调用',
    fitnessStatus: 'good',
    fitnessLabel: '服务正常',
    updatedAt: '2026-08-08',
    usageCount: 1208,
    owner: '服务集成网关团队',
    securityLevel: 'L1（开放网关）',
    updateFrequency: '实时响应 (<50ms)',
    matchReason: '支持按年龄条件查询人口统计结果',
    useCases: ['人口统计查询', '应用集成取数'],
    apiEndpoint: 'GET /api/v1/population/statistics/query',
    apiMethod: 'GET',
    apiParams: [
      { name: 'region_code', type: 'string', required: true, desc: '行政区划代码（如 310104001）' },
      { name: 'min_age', type: 'integer', required: false, desc: '最小年龄（默认 0）' },
      { name: 'max_age', type: 'integer', required: false, desc: '最大年龄（可为空）' },
      { name: 'stat_period', type: 'string', required: true, desc: '统计周期（格式 YYYY-MM）' }
    ]
  },
  {
    id: 'res-elderly-org',
    name: '养老机构基本信息',
    type: 'DATA_ASSET',
    description: '包含机构名称、所在街镇、核定床位数、已入住人数与运营状态。',
    context: '养老服务 · 养老机构',
    domain: 'elderly',
    domainName: '养老服务',
    object: 'org',
    objectName: '养老机构',
    accessStatus: 'restricted',
    accessLabel: '需申请',
    fitnessStatus: 'ready',
    fitnessLabel: '可用于分析',
    updatedAt: '2026-08-02',
    usageCount: 96,
    owner: '民政养老服务发展处',
    securityLevel: 'L2（受限访问）',
    useCases: ['养老资源盘点', '机构覆盖分析']
  },
  {
    id: 'res-community-facility',
    name: '社区养老服务设施',
    type: 'DATA_ASSET',
    description: '记录社区日间照料中心、老年助餐点及综合为老服务中心的分布与服务能力。',
    context: '养老服务 · 社区设施',
    domain: 'elderly',
    domainName: '养老服务',
    object: 'facility',
    objectName: '社区设施',
    accessStatus: 'available',
    accessLabel: '可使用',
    fitnessStatus: 'good',
    fitnessLabel: '状态良好',
    updatedAt: '2026-08-05',
    usageCount: 57,
    owner: '民政养老服务发展处',
    securityLevel: 'L1（公开可用）',
    useCases: ['社区养老服务供给分析', '设施覆盖评估']
  }
];

// Curated minimal solution Semovix proposes when a goal arrives WITHOUT explicit
// candidates (goal-only entry from the discovery bar / Discovery home).
const DEFAULT_GOAL_SOLUTION: SolutionResourceItem[] = [
  {
    id: 'res-02',
    name: '人口基本信息视图',
    type: 'DATA_ASSET',
    subType: 'VIEW',
    role: 'CORE_DATA',
    roleLabel: '核心数据',
    description: '提供年龄、出生日期、常住状态和行政区域，是计算人口年龄结构与老龄化程度的基础数据。',
    whyNeeded: '用于确定分析人口范围，并形成不同年龄段的人口统计。',
    accessStatus: 'restricted',
    accessLabel: '需申请',
    fitnessStatus: 'ready',
    fitnessLabel: '可用于当前分析',
    isKeyDependency: true,
    fields: [
      { name: 'person_id', cnName: '自然人ID', type: 'BIGINT', description: '主键', isKey: true },
      { name: 'age', cnName: '年龄', type: 'INT', description: '实足年龄' },
      { name: 'birth_date', cnName: '出生日期', type: 'DATE', description: '出生年月日' },
      { name: 'is_permanent', cnName: '是否常住人口', type: 'TINYINT', description: '1-常住' },
      { name: 'street_code', cnName: '所属街镇代码', type: 'VARCHAR(12)', description: '街镇编码' }
    ]
  },
  {
    id: 'res-03',
    name: '老龄化率',
    type: 'METRIC',
    role: 'CORE_METRIC',
    roleLabel: '核心口径',
    description: '60 周岁及以上常住人口占全部常住人口的比例。',
    whyNeeded: '提供企业正式认定的人口老龄化衡量口径。',
    accessStatus: 'dependent',
    accessLabel: '依赖人口基本信息视图',
    fitnessStatus: 'ready',
    fitnessLabel: '正式指标',
    metricFormula: '( count(distinct case when age >= 60 and is_permanent=1 then person_id end) / count(distinct case when is_permanent=1 then person_id end) ) * 100%'
  },
  {
    id: 'res-05',
    name: '行政区划基础数据',
    type: 'DATA_ASSET',
    role: 'DIMENSION',
    roleLabel: '分析维度',
    description: '提供街镇及标准行政区划编码，用于将人口结果按街镇聚合和比较。',
    whyNeeded: '提供标准街镇层级与名称编码，支持空间区域对比。',
    accessStatus: 'available',
    accessLabel: '可使用',
    fitnessStatus: 'good',
    fitnessLabel: '状态良好',
    fields: [
      { name: 'region_code', cnName: '区划代码', type: 'VARCHAR(12)', description: '国标行政区划编码', isKey: true },
      { name: 'region_name', cnName: '区划全称', type: 'VARCHAR(64)', description: '街镇名称' },
      { name: 'level', cnName: '行政层级', type: 'TINYINT', description: '3-街镇' }
    ]
  }
];

// Semovix Compose — Business Goal + Candidate Set → Solution Resources.
// Candidates are HARD CONSTRAINTS: the solution is built from exactly what the user
// collected. Roles derive per type — 1st data asset = core data, 2nd = dimension,
// further assets = supporting. With no candidates, Semovix proposes the curated
// default solution for the goal.
const composeSolutionResources = (candidates: ResourceItem[]): SolutionResourceItem[] => {
  if (candidates.length === 0) {
    return DEFAULT_GOAL_SOLUTION.map(r => ({ ...r }));
  }

  let coreDataTaken = false;
  let dimensionTaken = false;
  const coreData = candidates.find(c => c.type === 'DATA_ASSET');

  return candidates.map(c => {
    let role: SolutionResourceItem['role'];
    let roleLabel: string;
    let whyNeeded: string;

    if (c.type === 'BUSINESS_OBJECT') {
      role = 'SUBJECT';
      roleLabel = '业务主体';
      whyNeeded = '方案围绕的核心业务主体，统一关联各资源的业务口径。';
    } else if (c.type === 'METRIC') {
      role = 'CORE_METRIC';
      roleLabel = '核心口径';
      whyNeeded = '提供当前业务目标所需的正式统计口径。';
    } else if (c.type === 'DATA_API') {
      role = 'SUPPORTING_DATA';
      roleLabel = '取数服务';
      whyNeeded = '为应用集成与后续分析流程提供标准取数服务。';
    } else if (!coreDataTaken) {
      coreDataTaken = true;
      role = 'CORE_DATA';
      roleLabel = '核心数据';
      whyNeeded = '作为方案的主数据底表，承载目标分析所需的事实与明细。';
    } else if (!dimensionTaken) {
      dimensionTaken = true;
      role = 'DIMENSION';
      roleLabel = '分析维度';
      whyNeeded = '提供标准维度与编码，支撑目标所需的分组与对比。';
    } else {
      role = 'SUPPORTING_DATA';
      roleLabel = '补充数据';
      whyNeeded = '补充目标分析所需的辅助数据。';
    }

    // A metric computes FROM the core data — its usability depends on that asset's access
    const isDependentMetric = c.type === 'METRIC' && !!coreData;

    return {
      id: c.id,
      name: c.name,
      type: c.type,
      subType: c.subType,
      role,
      roleLabel,
      description: c.description,
      whyNeeded,
      accessStatus: isDependentMetric ? 'dependent' : c.accessStatus,
      accessLabel: isDependentMetric ? `依赖${coreData!.name}` : (c.accessLabel || ''),
      fitnessStatus: c.fitnessStatus,
      fitnessLabel: c.fitnessLabel || '可用于分析',
    };
  });
};

export const ResourceExplorerWorkspace: React.FC<ResourceExplorerWorkspaceProps> = ({
  addToast,
  initialQuery = '',
  initialSelectedResourceIds = [],
  initialMode = 'browse',
  onNavigateToDiscovery,
  onNavigateToMyRequests,
  onNavigateToMetrics,
  onNavigateToBusinessObject,
  onNavigateToBusinessObjectDetail,
  onNavigateToDataAssets,
  onNavigateToDataAssetDetail,
  onNavigateToMetricDetail,
  onNavigateToMultiResourceRequest,
}) => {
  // Mode: 'browse' (Browse all discoverable scope) | 'resource_search' | 'goal_search' (Composed Data Solution)
  const isExplicitGoal = (q?: string) => {
    if (!q) return false;
    const trimmed = q.trim();
    // Explicit Goal markers: Questions, intention sentences, analytical goals with structured verbs
    const explicitGoalMarkers = [
      '我想分析', '想分析', '需要哪些数据', '如何分析', '如何评估',
      '怎么分析', '需要什么数据', '分析方案', '构建方案', '我想了解'
    ];
    const hasExplicitMarker = explicitGoalMarkers.some(marker => trimmed.includes(marker));
    const isAnalyticalQuestion = (trimmed.includes('分析') || trimmed.includes('评估') || trimmed.includes('比较')) && 
                                  (trimmed.includes('？') || trimmed.includes('?') || trimmed.includes('需要') || trimmed.includes('如何') || trimmed.includes('哪') || trimmed.length >= 14);
    return hasExplicitMarker || isAnalyticalQuestion;
  };

  const [currentMode, setCurrentMode] = useState<ExplorerMode>(() => {
    if (initialMode) return initialMode;
    if (initialQuery && isExplicitGoal(initialQuery)) {
      return 'goal_search';
    } else if (initialQuery && initialQuery.trim().length > 0) {
      return 'resource_search';
    }
    return 'browse';
  });

  // Search Query for Browse / Resource Search mode
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery || '');
  const [submittedQuery, setSubmittedQuery] = useState<string>(initialQuery || '');

  // Progressive Selected Candidates (for Browse / Search mode)
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>(initialSelectedResourceIds);
  const [isSelectedTrayDrawerOpen, setIsSelectedTrayDrawerOpen] = useState<boolean>(false);
  const [goalInputValue, setGoalInputValue] = useState<string>('');

  // Type Tabs for Browse Mode: ALL, DATA_ASSET, METRIC, DATA_API, BUSINESS_OBJECT
  const [activeTypeTab, setActiveTypeTab] = useState<'ALL' | 'DATA_ASSET' | 'METRIC' | 'DATA_API' | 'BUSINESS_OBJECT'>('ALL');

  // Filter Bar state for Browse Mode (Only P0)
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [objectFilter, setObjectFilter] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('relevance');

  // Pagination for Browse Mode
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Business Goal State for Goal Search Mode — never silently defaulted
  const [businessGoal, setBusinessGoal] = useState<string>(
    initialQuery && initialQuery.length > 5 ? initialQuery : ''
  );
  const [isEditingGoalModalOpen, setIsEditingGoalModalOpen] = useState<boolean>(false);
  const [tempGoalInput, setTempGoalInput] = useState<string>(businessGoal);

  // Solution Resources for Goal Search Mode — ALWAYS the output of Semovix Compose
  // (goal + candidate set); never a statically preloaded solution
  const [solutionResources, setSolutionResources] = useState<SolutionResourceItem[]>([]);

  // Candidate Resources (To be added via Tray in Goal Search Mode)
  const [candidatesQueue, setCandidatesQueue] = useState<string[]>([]);
  const [isCandidateTrayDrawerOpen, setIsCandidateTrayDrawerOpen] = useState<boolean>(false);

  // Warnings / Notices
  const [activeOverlapNotice, setActiveOverlapNotice] = useState<{
    newResource: string;
    existingResource: string;
    message: string;
  } | null>(null);

  const [goalExtensionPrompt, setGoalExtensionPrompt] = useState<{
    resourceName: string;
    extendedGoal: string;
  } | null>(null);

  const [removalTargetResource, setRemovalTargetResource] = useState<SolutionResourceItem | null>(null);

  // Single Resource Access Request Drawer
  const [isAccessDrawerOpen, setIsAccessDrawerOpen] = useState<boolean>(false);
  const [accessTargetResource, setAccessTargetResource] = useState<{ name: string; typeBadge: string } | null>(null);

  // Detail Preview Drawer
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<ResourceItem | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Synchronize when initialMode or initialQuery changes
  useEffect(() => {
    if (initialMode && initialMode !== 'browse') {
      setCurrentMode(initialMode);
    } else if (initialQuery !== undefined) {
      if (initialQuery && isExplicitGoal(initialQuery)) {
        setCurrentMode('goal_search');
        setBusinessGoal(initialQuery);
        setSolutionResources(composeSolutionResources(
          selectedResourceIds.map(id => ALL_DISCOVERABLE_RESOURCES.find(r => r.id === id)).filter(Boolean) as ResourceItem[]
        ));
      } else if (initialQuery && initialQuery.trim().length > 0) {
        setCurrentMode('resource_search');
      } else {
        setCurrentMode('browse');
      }
    }
    if (initialQuery !== undefined) {
      setSearchQuery(initialQuery);
      setSubmittedQuery(initialQuery);
    }
  }, [initialMode, initialQuery]);

  // AI Recommended Related Resources
  const RELATED_CANDIDATES: RelatedResourceCandidate[] = [
    {
      id: 'res-elderly-org',
      name: '养老机构基本信息',
      type: 'DATA_ASSET',
      description: '包含机构名称、所在街镇、核定床位数、已入住人数与运营状态。',
      context: '养老服务 · 养老机构',
      accessStatus: 'restricted',
      accessLabel: '需申请',
      fitnessStatus: 'ready',
      fitnessLabel: '可用于分析',
      potentialRole: '补充数据',
      whyUseful: '可用于进一步分析街镇老龄人口与养老机构资源之间的覆盖关系。'
    },
    {
      id: 'res-community-facility',
      name: '社区养老服务设施',
      type: 'DATA_ASSET',
      description: '记录社区日间照料中心、老年助餐点及综合为老服务中心的分布与服务能力。',
      context: '养老服务 · 社区设施',
      accessStatus: 'available',
      accessLabel: '可使用',
      fitnessStatus: 'good',
      fitnessLabel: '状态良好',
      potentialRole: '补充数据',
      whyUseful: '可用于补充社区养老服务供给分析。'
    },
    {
      id: 'res-07-dataset',
      name: '人口年龄结构数据集',
      type: 'DATA_ASSET',
      subType: 'DATASET',
      description: '已形成年龄段聚合结果，可作为快速人口结构分析补充。',
      context: '统计调查 · 人口集市',
      accessStatus: 'available',
      accessLabel: '可使用',
      fitnessStatus: 'warning',
      fitnessLabel: '更新至上月',
      potentialRole: '补充数据',
      whyUseful: '已形成年龄段聚合结果，可作为快速人口结构分析补充。'
    },
    {
      id: 'res-overlap-view',
      name: '常住人口主题视图',
      type: 'DATA_ASSET',
      subType: 'VIEW',
      description: '提供常住人口身份、年龄结构及居住状态等主题数据。',
      context: '人口服务 · 常住人口',
      accessStatus: 'restricted',
      accessLabel: '需申请',
      fitnessStatus: 'ready',
      fitnessLabel: '可用于分析',
      potentialRole: '核心数据（备选）',
      whyUseful: '与人口基本信息视图能力重叠，可作为备用替代数据源。'
    }
  ];

  // Selected items objects for Browse/Resource Search mode
  const selectedResourceItems = useMemo(() => {
    return selectedResourceIds
      .map(id => ALL_DISCOVERABLE_RESOURCES.find(r => r.id === id))
      .filter(Boolean) as ResourceItem[];
  }, [selectedResourceIds]);

  // Browse scope — query + facet filters applied, BEFORE the type tab.
  // Facet counts are computed over this scope so tabs and the result header always agree.
  const browseScopeResources = useMemo(() => {
    let list = [...ALL_DISCOVERABLE_RESOURCES];

    // Query filter (matchReason is goal-relative and never searched in Browse)
    if (submittedQuery.trim()) {
      const q = submittedQuery.toLowerCase().trim();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.context.toLowerCase().includes(q)
      );
    }

    if (domainFilter !== 'all') {
      list = list.filter(r => r.domain === domainFilter);
    }

    if (objectFilter !== 'all') {
      list = list.filter(r => r.object === objectFilter);
    }

    if (accessFilter !== 'all') {
      if (accessFilter === 'available') {
        list = list.filter(r => r.accessStatus === 'available');
      } else if (accessFilter === 'restricted') {
        list = list.filter(r => r.accessStatus === 'restricted');
      }
    }

    return list;
  }, [submittedQuery, domainFilter, objectFilter, accessFilter]);

  // Type facets — real counts over the current scope (never hardcoded totals)
  const typeCounts = useMemo(() => {
    return {
      ALL: browseScopeResources.length,
      DATA_ASSET: browseScopeResources.filter(r => r.type === 'DATA_ASSET').length,
      METRIC: browseScopeResources.filter(r => r.type === 'METRIC').length,
      DATA_API: browseScopeResources.filter(r => r.type === 'DATA_API').length,
      BUSINESS_OBJECT: browseScopeResources.filter(r => r.type === 'BUSINESS_OBJECT').length
    };
  }, [browseScopeResources]);

  // Filtering for Browse / Resource Search mode (scope + active type tab)
  const filteredBrowseResources = useMemo(() => {
    if (activeTypeTab === 'ALL') return browseScopeResources;
    return browseScopeResources.filter(r => r.type === activeTypeTab);
  }, [browseScopeResources, activeTypeTab]);

  // Sort — 'relevance' keeps the curated order; popular / recent are real sorts
  // over mock metadata (usageCount / updatedAt)
  const sortedBrowseResources = useMemo(() => {
    const list = [...filteredBrowseResources];
    if (sortOrder === 'recent') {
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } else if (sortOrder === 'popular') {
      list.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0) || b.updatedAt.localeCompare(a.updatedAt));
    }
    return list;
  }, [filteredBrowseResources, sortOrder]);

  // Pagination — derived from the real result set (no decorative page buttons)
  const totalPages = Math.max(1, Math.ceil(sortedBrowseResources.length / pageSize));
  const pagedBrowseResources = sortedBrowseResources.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Any change to the query / facets / tab / sort / page size restarts from page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [submittedQuery, activeTypeTab, domainFilter, objectFilter, accessFilter, sortOrder, pageSize]);

  // Solution Coverage facts — derived from the composed roles, not hardcoded per-demo
  const coverageElements = useMemo(() => {
    const hasCoreData = solutionResources.some(r => r.role === 'CORE_DATA');
    const hasMetric = solutionResources.some(r => r.role === 'CORE_METRIC');
    const hasDimension = solutionResources.some(r => r.role === 'DIMENSION');
    return [
      { label: '主数据（分析底表）', covered: hasCoreData },
      { label: '统计口径（正式指标）', covered: hasMetric },
      { label: '分析维度（分组与对比依据）', covered: hasDimension },
    ];
  }, [solutionResources]);
  const isCoverageComplete = coverageElements.every(e => e.covered);

  // Calculate Access Readiness
  const accessReadiness = useMemo(() => {
    const restrictedItems = solutionResources.filter(r => r.accessStatus === 'restricted');
    const availableItems = solutionResources.filter(r => r.accessStatus === 'available');
    const dependentItems = solutionResources.filter(r => r.accessStatus === 'dependent');

    const isAllReady = restrictedItems.length === 0;
    return {
      isAllReady,
      restrictedCount: restrictedItems.length,
      availableCount: availableItems.length + dependentItems.length,
      restrictedItems
    };
  }, [solutionResources]);

  // Toggle Add / Remove Resource in Browse / Resource Search mode
  const handleToggleBrowseResource = (resource: ResourceItem) => {
    const isAdded = selectedResourceIds.includes(resource.id);
    if (isAdded) {
      setSelectedResourceIds(prev => prev.filter(id => id !== resource.id));
      addToast?.('info', '已从已选资源移除', `已移除「${resource.name}」`);
    } else {
      setSelectedResourceIds(prev => [...prev, resource.id]);
      addToast?.('success', '已加入', `已加入「${resource.name}」至当前工作集合`);
    }
  };

  // Quick-preview content chips — full schema & metric formulas live in Resource Detail, not here
  const previewContains: string[] = selectedPreviewItem
    ? selectedPreviewItem.type === 'METRIC'
      ? selectedPreviewItem.dimensions || []
      : selectedPreviewItem.type === 'DATA_API'
        ? (selectedPreviewItem.apiParams || []).map(p => p.name)
        : (selectedPreviewItem.fields || []).map(f => f.cnName)
    : [];
  const isPreviewAdded = selectedPreviewItem ? selectedResourceIds.includes(selectedPreviewItem.id) : false;

  // Compose requires an explicit goal — never silently defaulted. When already in
  // Goal Search context, the existing goal is reused automatically.
  const effectiveComposeGoal = goalInputValue.trim() || (currentMode === 'goal_search' ? businessGoal.trim() : '');

  // Clear all selected in Browse mode
  const handleClearAllSelected = () => {
    setSelectedResourceIds([]);
    setIsSelectedTrayDrawerOpen(false);
    addToast?.('info', '已清空已选资源', '已重置当前临时工作集合');
  };

  // Check if a query is a full business goal
  const isQueryFullGoal = (query: string) => {
    return isExplicitGoal(query);
  };

  // Confirm Goal and Compose Solution (from Candidate Drawer).
  // Goal is required — no silent default. Candidates are the compose constraints.
  const handleConfirmGoalAndCompose = () => {
    const finalGoal = goalInputValue.trim() || (currentMode === 'goal_search' ? businessGoal.trim() : '');
    if (!finalGoal) return;
    setBusinessGoal(finalGoal);
    setSolutionResources(composeSolutionResources(selectedResourceItems));
    setCurrentMode('goal_search');
    addToast?.('success', '构建数据方案', `已基于目标「${finalGoal}」与 ${selectedResourceItems.length} 项候选资源解析最小数据方案`);
  };

  // Execute Search in Browse Mode
  const handleExecuteSearch = (val: string) => {
    const q = val.trim();
    setSubmittedQuery(q);
    setSearchQuery(q);
    if (!q) {
      setCurrentMode('browse');
      addToast?.('info', '全量浏览', '已切换为浏览可发现范围内的全部资源');
    } else if (isQueryFullGoal(q)) {
      setBusinessGoal(q);
      setSolutionResources(composeSolutionResources(selectedResourceItems));
      setCurrentMode('goal_search');
      addToast?.('success', '业务目标解析', `已针对目标「${q}」解析最小数据方案`);
    } else {
      setCurrentMode('resource_search');
      addToast?.('info', '精准检索', `已刷新检索结果「${q}」`);
    }
  };

  // Whether any consumer-visible filter is active (drives 清除筛选 visibility)
  const hasActiveFilters = useMemo(() => {
    return (
      domainFilter !== 'all' ||
      objectFilter !== 'all' ||
      accessFilter !== 'all' ||
      sortOrder !== 'relevance' ||
      activeTypeTab !== 'ALL' ||
      submittedQuery.trim() !== ''
    );
  }, [domainFilter, objectFilter, accessFilter, sortOrder, activeTypeTab, submittedQuery]);

  // Reset Filters in Browse Mode
  const handleResetFilters = () => {
    setDomainFilter('all');
    setObjectFilter('all');
    setAccessFilter('all');
    setSortOrder('relevance');
    setActiveTypeTab('ALL');
    setSearchQuery('');
    setSubmittedQuery('');
    setCurrentMode('browse');
    addToast?.('info', '已清除筛选', '已恢复默认浏览条件');
  };

  // Handle Toggle Candidate in Goal Search Mode
  const handleToggleCandidate = (candidateId: string) => {
    const candidate = RELATED_CANDIDATES.find(c => c.id === candidateId);
    if (!candidate) return;

    if (candidatesQueue.includes(candidateId)) {
      setCandidatesQueue(prev => prev.filter(id => id !== candidateId));
      addToast?.('info', '已移除', `已从待加入队列中移除「${candidate.name}」`);
    } else {
      setCandidatesQueue(prev => [...prev, candidateId]);
      addToast?.('success', '已加入待添加队列', `已暂存「${candidate.name}」，点击底部更新当前方案`);
    }
  };

  // Clear Candidates in Goal Search Mode
  const handleClearCandidates = () => {
    setCandidatesQueue([]);
    setIsCandidateTrayDrawerOpen(false);
    addToast?.('info', '已清空待添加资源', '已重置待更新队列');
  };

  // Recompose Data Solution with Candidates in Goal Search Mode
  const handleRecomposeSolution = () => {
    if (candidatesQueue.length === 0) return;

    if (candidatesQueue.includes('res-overlap-view')) {
      setActiveOverlapNotice({
        newResource: '常住人口主题视图',
        existingResource: '人口基本信息视图',
        message: '“人口基本信息视图”已覆盖当前分析需要的人口年龄与常住状态信息，“常住人口主题视图”与其主要能力重复。'
      });
      setCandidatesQueue(prev => prev.filter(id => id !== 'res-overlap-view'));
      setIsCandidateTrayDrawerOpen(false);
      return;
    }

    if (candidatesQueue.includes('res-elderly-org')) {
      setGoalExtensionPrompt({
        resourceName: '养老机构基本信息',
        extendedGoal: '分析闵行区各街镇人口老龄化程度与养老机构服务资源供需覆盖关系'
      });
    }

    const newItems: SolutionResourceItem[] = candidatesQueue.map(id => {
      const c = RELATED_CANDIDATES.find(item => item.id === id)!;
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        subType: c.subType,
        role: 'SUPPORTING_DATA',
        roleLabel: '补充数据',
        description: c.description,
        whyNeeded: c.whyUseful,
        accessStatus: c.accessStatus as any,
        accessLabel: c.accessLabel,
        fitnessStatus: (c.fitnessStatus || 'ready') as any,
        fitnessLabel: c.fitnessLabel || '可用于分析'
      };
    });

    setSolutionResources(prev => [...prev, ...newItems]);
    setCandidatesQueue([]);
    setIsCandidateTrayDrawerOpen(false);
    addToast?.('success', '方案已更新', 'Semovix 已重新计算资源角色、依赖与数据访问缺口');
  };

  // Remove resource from solution
  const handleRequestRemoveResource = (resource: SolutionResourceItem) => {
    setActiveActionMenuId(null);
    if (resource.isKeyDependency || resource.role === 'CORE_DATA' || resource.role === 'CORE_METRIC') {
      setRemovalTargetResource(resource);
    } else {
      setSolutionResources(prev => prev.filter(r => r.id !== resource.id));
      addToast?.('info', '已移除资源', `已从当前数据方案中移除「${resource.name}」`);
    }
  };

  // Confirm Removal of key resource
  const handleConfirmRemoveKeyResource = () => {
    if (!removalTargetResource) return;
    setSolutionResources(prev => prev.filter(r => r.id !== removalTargetResource.id));
    setRemovalTargetResource(null);
    addToast?.('error', '已移除核心依赖', '方案覆盖情况已改变，当前缺少核心计算底表');
  };

  // Handle Primary CTA in Goal Search Mode
  const handlePrimaryAction = () => {
    if (!isCoverageComplete) {
      addToast?.('error', '方案不完整', '请先在下方补充所需的核心口径或维度');
      return;
    }

    if (accessReadiness.isAllReady) {
      addToast?.('success', '进入分析', '已将全部就绪资源载入 AI 数据分析工作台');
    } else {
      const restricted = solutionResources.find(r => r.accessStatus === 'restricted') || solutionResources[0];
      setAccessTargetResource({
        name: restricted.name,
        typeBadge: `${restricted.type}${restricted.subType ? ` · ${restricted.subType}` : ''}`
      });
      setIsAccessDrawerOpen(true);
    }
  };

  // Open Preview Drawer
  const handleOpenPreview = (item: ResourceItem | SolutionResourceItem | RelatedResourceCandidate) => {
    const full = ALL_DISCOVERABLE_RESOURCES.find(r => r.id === item.id) || {
      id: item.id,
      name: item.name,
      type: item.type,
      subType: item.subType,
      description: item.description,
      context: '企业业务语义域',
      domain: 'general',
      domainName: '公共数据服务',
      object: 'general',
      objectName: '通用业务实体',
      accessStatus: item.accessStatus as any,
      accessLabel: item.accessLabel,
      fitnessStatus: (item as any).fitnessStatus || 'ready',
      fitnessLabel: (item as any).fitnessLabel || '可用于分析',
      updatedAt: '2026-08-14'
    } as ResourceItem;

    setSelectedPreviewItem(full);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">

      {/* ========================================================= */}
      {/* MAIN WORKSPACE (Single Natural Reading Path)               */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F8FAFC] relative transition-all">

        {/* Page Title — in the centered working surface (no admin header strip) */}
        <div className="w-full max-w-[1500px] mx-auto px-6 lg:px-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                {currentMode === 'goal_search' ? '数据方案' : '浏览数据资源'}
              </h1>
              <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                {currentMode === 'goal_search'
                  ? '围绕业务目标组合并使用可信的数据与业务语义资源。'
                  : '搜索、筛选并发现适合业务需求的可信数据资源。'}
              </p>
            </div>

            {/* Exit Goal Search state back to Browse (only rendered in Goal Search) */}
            {currentMode === 'goal_search' && (
              <button
                onClick={() => {
                  setCurrentMode('browse');
                  setSearchQuery('');
                  setSubmittedQuery('');
                  addToast?.('info', '切换视图', '已切换回全量资源浏览模式');
                }}
                className="px-2.5 py-1 text-xs text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded font-medium cursor-pointer transition-colors"
              >
                ← 返回全量资源浏览
              </button>
            )}
          </div>
        </div>

        {/* ======================================================= */}
        {/* VIEW BRANCH A: GOAL SEARCH (CURRENT DATA SOLUTION)      */}
        {/* ======================================================= */}
        {currentMode === 'goal_search' ? (
          <div className={`p-6 lg:p-8 space-y-6 w-full max-w-[1500px] mx-auto transition-all ${candidatesQueue.length > 0 ? 'pb-28' : 'pb-12'}`}>
            
            {/* SECTION 1: BUSINESS GOAL (Context Strip) */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-4 shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-[#667085] px-1.5 py-0.2 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                      当前需求
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-[#172033] leading-snug">
                    {businessGoal}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTempGoalInput(businessGoal);
                    setIsEditingGoalModalOpen(true);
                  }}
                  className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer shrink-0 pt-0.5"
                >
                  修改目标
                </button>
              </div>

              {/* Light Semantic Parsing Summary */}
              <div className="pt-2 border-t border-[#EEF2F6] flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#475569]">
                <div className="flex items-center space-x-1">
                  <span className="text-[#94A3B8]">分析主体:</span>
                  <span className="font-semibold text-[#172033]">自然人</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[#94A3B8]">范围:</span>
                  <span className="font-semibold text-[#172033]">闵行区</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[#94A3B8]">分析粒度:</span>
                  <span className="font-semibold text-[#172033]">街镇</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[#94A3B8]">核心关注:</span>
                  <span className="font-semibold text-[#2563EB]">老龄化程度 · 人口结构</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: CURRENT DATA SOLUTION (The Core Solution) */}
            <div className="bg-white border border-[#E6EAF0] rounded-md shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-[#EEF2F6] bg-[#FAFCFF] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">
                    当前数据方案
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Semovix 根据当前目标和企业资源，整理出完成分析所需的最小资源组合。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('related-resources-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                    addToast?.('info', '添加资源', '已定位至下方推荐资源列表，点击「＋ 加入」即可暂存');
                  }}
                  className="px-3 py-1.5 bg-white border border-[#CBD5E1] text-[#334155] hover:border-[#2563EB] hover:text-[#2563EB] text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加资源</span>
                </button>
              </div>

              {/* Overlap Notice Banner if triggered */}
              {activeOverlapNotice && (
                <div className="p-3.5 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-start justify-between gap-3 text-xs animate-in fade-in duration-150">
                  <div className="flex items-start space-x-2.5">
                    <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#92400E]">发现功能重叠</div>
                      <p className="text-[#B45309] leading-relaxed">
                        {activeOverlapNotice.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setActiveOverlapNotice(null);
                        addToast?.('info', '保留当前核心数据', '已取消重复添加常住人口主题视图');
                      }}
                      className="px-2.5 py-1 bg-white border border-[#D97706] text-[#92400E] font-semibold rounded hover:bg-[#FEF3C7] cursor-pointer"
                    >
                      保留当前核心数据
                    </button>
                    <button
                      onClick={() => {
                        setActiveOverlapNotice(null);
                        addToast?.('info', '都保留', '已将两项资源同时置于候选范围');
                      }}
                      className="px-2 py-1 text-[#92400E] hover:underline cursor-pointer"
                    >
                      都保留
                    </button>
                  </div>
                </div>
              )}

              {/* Goal Extension Notice Banner if triggered */}
              {goalExtensionPrompt && (
                <div className="p-3.5 bg-[#EFF6FF] border-b border-[#BFDBFE] flex items-start justify-between gap-3 text-xs animate-in fade-in duration-150">
                  <div className="flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#1E40AF]">新资源扩展了当前分析范围</div>
                      <p className="text-[#1E3A8A] leading-relaxed">
                        「{goalExtensionPrompt.resourceName}」更适合用于进一步分析养老资源覆盖。如果希望使用该资源，可一键扩展当前目标。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setBusinessGoal(goalExtensionPrompt.extendedGoal);
                        setGoalExtensionPrompt(null);
                        addToast?.('success', '目标已扩展', '已更新业务分析目标为包含养老机构资源覆盖');
                      }}
                      className="px-2.5 py-1 bg-[#2563EB] text-white font-semibold rounded hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      扩展当前目标
                    </button>
                    <button
                      onClick={() => {
                        setGoalExtensionPrompt(null);
                        addToast?.('info', '暂时保留', '保留原有分析目标，新资源作为补充参考');
                      }}
                      className="px-2 py-1 text-[#2563EB] hover:underline cursor-pointer"
                    >
                      暂时保留
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Solution Resource Rows */}
              <div className="divide-y divide-[#EEF2F6]">
                {solutionResources.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8FAFC]"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0 max-w-[760px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.role === 'CORE_DATA'
                            ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                            : item.role === 'CORE_METRIC'
                            ? 'bg-[#F0FDF4] text-[#16A36A] border border-[#BBF7D0]'
                            : item.role === 'DIMENSION'
                            ? 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]'
                            : 'bg-[#FAF5FF] text-[#7C3AED] border border-[#E9D5FF]'
                        }`}>
                          {item.roleLabel}
                        </span>

                        <h4
                          onClick={() => handleOpenPreview(item)}
                          className="text-sm font-bold text-[#172033] hover:text-[#2563EB] cursor-pointer transition-colors"
                        >
                          {item.name}
                        </h4>

                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded border border-[#E2E8F0]">
                          {TYPE_PRESENTATION[item.type]}{item.subType ? ` · ${SUBTYPE_PRESENTATION[item.subType] || item.subType}` : ''}
                        </span>
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed">
                        {item.description}
                      </p>

                      <div className="text-[11px] text-[#667085] flex items-center space-x-1.5 pt-0.5">
                        <span className="font-semibold text-[#172033]">为什么需要:</span>
                        <span>{item.whyNeeded}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-start md:self-center">
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end space-x-1 text-[11px] font-medium">
                          <span className="text-[#94A3B8]">访问:</span>
                          {item.accessStatus === 'dependent' ? (
                            <span className="text-[#475569] text-[11px]">
                              {item.accessLabel}
                            </span>
                          ) : (
                            <span className={`${accessPresentation(item.accessStatus).textClass} flex items-center space-x-0.5 font-semibold`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${accessPresentation(item.accessStatus).dotClass}`} />
                              <span>{accessPresentation(item.accessStatus).label}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end space-x-1 text-[11px] font-medium">
                          <span className="text-[#94A3B8]">适用性:</span>
                          {item.fitnessStatus === 'warning' ? (
                            <span className="text-[#D97706] flex items-center space-x-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                              <span>{item.fitnessLabel}</span>
                            </span>
                          ) : (
                            <span className="text-[#16A36A] flex items-center space-x-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                              <span>{item.fitnessLabel}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="px-2.5 py-1.5 rounded text-xs text-[#475569] hover:text-[#172033] hover:bg-[#F1F5F9] border border-[#E6EAF0] transition-colors cursor-pointer"
                      >
                        查看详情
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveActionMenuId(activeActionMenuId === item.id ? null : item.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded border border-transparent hover:border-[#E2E8F0] cursor-pointer"
                          title="更多操作"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeActionMenuId === item.id && (
                          <div className="absolute right-0 top-8 w-36 bg-white border border-[#E6EAF0] rounded-md shadow-lg py-1 z-20 text-xs animate-in fade-in duration-100">
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                addToast?.('info', '查看替代资源', `正在为「${item.name}」查找同类可替代数据源`);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
                            >
                              查看替代资源
                            </button>
                            <button
                              onClick={() => handleRequestRemoveResource(item)}
                              className="w-full text-left px-3 py-1.5 text-[#DC2626] hover:bg-[#FEE2E2] cursor-pointer"
                            >
                              从当前方案移除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Business Subject Context Row */}
              <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#EEF2F6] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white text-[#4F46E5] rounded border border-[#C7D2FE]">
                    BUSINESS OBJECT · 业务主体
                  </span>
                  <span className="font-bold text-[#172033]">自然人</span>
                  <span className="text-[#64748B] hidden sm:inline">
                    — 当前分析围绕自然人及其年龄、常住状态和所属区域展开。
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateToBusinessObject?.();
                    addToast?.('info', '业务对象', '已跳转至自然人业务概念实体与建模视图');
                  }}
                  className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer shrink-0"
                >
                  查看业务对象
                </button>
              </div>
            </div>

            {/* SECTION 3: ASSESSMENT (Coverage & Access Separated) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E6EAF0] rounded-md p-4 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#172033]">
                    方案覆盖
                  </span>
                  {isCoverageComplete ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#16A36A] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#A7F3D0]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>已覆盖当前分析所需核心要素</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                      <AlertCircle className="w-3 h-3" />
                      <span>缺少必要口径或维度</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  {coverageElements.map(el => (
                    <div key={el.label} className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#EEF2F6]">
                      <span className="text-[#475569]">{el.label}</span>
                      {el.covered ? (
                        <span className="font-semibold text-[#16A36A] flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>已覆盖</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-[#D97706] flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>未覆盖</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E6EAF0] rounded-md p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172033]">
                    访问准备
                  </span>
                  <span className="text-xs text-[#667085] font-medium">
                    {accessReadiness.isAllReady
                      ? '全部资源已可使用'
                      : `${accessReadiness.availableCount} 项可直接使用 · ${accessReadiness.restrictedCount} 项需要申请`}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {solutionResources.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#EEF2F6]">
                      <span className="text-[#334155] font-medium truncate max-w-[200px]">{r.name}</span>
                      <span className="text-[11px]">
                        {r.accessStatus === 'dependent' ? (
                          <span className="text-[#475569]">{r.accessLabel}</span>
                        ) : (
                          <span className={`${accessPresentation(r.accessStatus).textClass} font-semibold flex items-center space-x-1 justify-end`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${accessPresentation(r.accessStatus).dotClass}`} />
                            <span>{accessPresentation(r.accessStatus).label}</span>
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#667085] leading-relaxed pt-1">
                  {accessReadiness.isAllReady
                    ? '当前方案已具备完整执行条件，可直接进入分析。'
                    : `补齐「${accessReadiness.restrictedItems[0]?.name ?? '受限资源'}」的访问条件后，当前方案即可开始执行。`}
                </p>
              </div>
            </div>

            {/* SECTION 4: MAIN ACTION CTA AREA */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#172033]">
                  {accessReadiness.isAllReady ? '方案已就绪' : '方案待补齐访问授权'}
                </div>
                <p className="text-[11px] text-[#667085]">
                  {accessReadiness.isAllReady
                    ? '方案覆盖完整且所有资源均具备使用条件。'
                    : `当前仅缺少「${accessReadiness.restrictedItems[0]?.name ?? '受限资源'}」的访问授权。`}
                </p>
              </div>

              <div className="flex items-center space-x-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('related-resources-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                    addToast?.('info', '调整资源', '已定位至下方推荐资源列表');
                  }}
                  className="px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] text-xs font-semibold rounded-md transition-colors cursor-pointer"
                >
                  继续调整资源
                </button>

                {accessReadiness.isAllReady ? (
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    className="px-5 py-2 bg-[#16A36A] hover:bg-[#15803D] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs flex items-center space-x-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>进入分析</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs flex items-center space-x-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>申请所需资源并继续</span>
                  </button>
                )}
              </div>
            </div>

            {/* SECTION 5: RELATED RESOURCES */}
            <div id="related-resources-section" className="space-y-3 pt-2">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">
                  与当前目标相关的资源
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  按业务目标匹配程度排序
                </p>
              </div>

              <div className="bg-white border border-[#E6EAF0] rounded-md divide-y divide-[#EEF2F6] shadow-2xs overflow-hidden">
                {RELATED_CANDIDATES.map((candidate) => {
                  const isCandidateQueued = candidatesQueue.includes(candidate.id);

                  return (
                    <div
                      key={candidate.id}
                      className="p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8FAFC]"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0 max-w-[760px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            onClick={() => handleOpenPreview(candidate)}
                            className="text-xs font-bold text-[#172033] hover:text-[#2563EB] cursor-pointer transition-colors"
                          >
                            {candidate.name}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded border border-[#E2E8F0]">
                            {TYPE_PRESENTATION[candidate.type]}{candidate.subType ? ` · ${SUBTYPE_PRESENTATION[candidate.subType] || candidate.subType}` : ''}
                          </span>
                          <span className="text-xs text-[#667085]">
                            {candidate.context}
                          </span>
                        </div>

                        <p className="text-xs text-[#475569] leading-relaxed">
                          {candidate.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-0.5">
                          <span className="text-[11px] text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                            匹配当前目标：{candidate.whyUseful}
                          </span>

                          <div className="flex items-center space-x-1 text-[11px] font-medium">
                            <span className="text-[#94A3B8]">访问:</span>
                            <span className={`${accessPresentation(candidate.accessStatus).textClass} flex items-center space-x-0.5 font-semibold`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${accessPresentation(candidate.accessStatus).dotClass}`} />
                              <span>{accessPresentation(candidate.accessStatus).label}</span>
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 text-[11px] font-medium">
                            <span className="text-[#94A3B8]">适用性:</span>
                            <span className="text-[#16A36A] font-semibold">
                              {goalFitnessLabel(candidate.fitnessStatus)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(candidate)}
                          className="px-2.5 py-1.5 rounded text-xs text-[#475569] hover:text-[#172033] hover:bg-[#F1F5F9] border border-[#E6EAF0] transition-colors cursor-pointer"
                        >
                          查看详情
                        </button>

                        {isCandidateQueued ? (
                          <button
                            type="button"
                            onClick={() => handleToggleCandidate(candidate.id)}
                            className="px-3 py-1.5 rounded text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA] transition-all cursor-pointer flex items-center space-x-1 group/btn"
                          >
                            <Check className="w-3.5 h-3.5 text-[#2563EB] group-hover/btn:hidden" />
                            <X className="w-3.5 h-3.5 text-[#DC2626] hidden group-hover/btn:inline" />
                            <span className="group-hover/btn:hidden">已暂存待加</span>
                            <span className="hidden group-hover/btn:inline">移除</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleCandidate(candidate.id)}
                            className="px-3 py-1.5 rounded text-xs font-semibold bg-white text-[#334155] border border-[#CBD5E1] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#F8FAFC] transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>＋ 加入</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          /* ======================================================= */
          /* VIEW BRANCH B: BROWSE ALL / RESOURCE SEARCH MODE        */
          /* (Standard Discover Scope Browse: Filters, Rows & Tray)  */
          /* ======================================================= */
          <div className={`p-6 lg:p-8 space-y-5 w-full max-w-[1500px] mx-auto transition-all ${selectedResourceIds.length > 0 ? 'pb-28' : 'pb-12'}`}>
            
            {/* Compact Unified Discovery Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteSearch(searchQuery);
              }}
              className="relative flex items-center bg-white border border-[#E6EAF0] hover:border-[#CBD5E1] focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-[#2563EB]/10 rounded-xl p-1.5 shadow-sm transition-all duration-200"
            >
              {/* Left Search Icon */}
              <div className="pl-3.5 pr-1 text-[#94A3B8] shrink-0">
                <Search className="w-4 h-4" />
              </div>

              {/* Discovery Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索资源，或告诉 Xino 你想解决什么业务问题……"
                className="flex-1 px-2.5 py-2 text-xs text-[#172033] placeholder-[#94A3B8] bg-transparent outline-none font-normal min-w-0"
              />

              {/* Clear */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSubmittedQuery('');
                  }}
                  className="p-1.5 text-[#98A2B3] hover:text-[#475569] rounded shrink-0 cursor-pointer"
                  title="清空"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Built-in Xino Identifier */}
              <div className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#FAF5FF] border border-[#E9D5FF] text-[#7C3AED] text-xs font-semibold select-none mr-2 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Xino</span>
              </div>

              {/* Primary Action */}
              <button
                type="submit"
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                搜索
              </button>
            </form>

            {/* Resource Type Tabs (Discover-style underline tabs) */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2">
              <div className="flex items-center space-x-5 text-xs">
                {[
                  { key: 'ALL', label: '全部', count: typeCounts.ALL },
                  { key: 'DATA_ASSET', label: '数据资产', count: typeCounts.DATA_ASSET },
                  { key: 'METRIC', label: '指标', count: typeCounts.METRIC },
                  { key: 'DATA_API', label: '接口服务', count: typeCounts.DATA_API },
                  { key: 'BUSINESS_OBJECT', label: '业务对象', count: typeCounts.BUSINESS_OBJECT },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTypeTab(tab.key as any);
                      addToast?.('info', '类型切换', `已筛选「${tab.label}」`);
                    }}
                    className={`pb-2 -mb-2 transition-all cursor-pointer flex items-baseline space-x-1 ${
                      activeTypeTab === tab.key
                        ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                        : 'text-[#667085] hover:text-[#172033] font-medium'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] font-mono ${activeTypeTab === tab.key ? 'text-[#60A5FA]' : 'text-[#94A3B8]'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Bar (业务领域、业务对象、使用条件、排序) */}
            <div className="flex flex-wrap items-center gap-2 text-xs py-1">
              {/* 业务领域 */}
              <div className="relative">
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="h-8 pl-2.5 pr-7 bg-white border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer shadow-2xs font-medium"
                >
                  <option value="all">全部业务领域</option>
                  <option value="population">人口服务</option>
                  <option value="public">公共基础</option>
                  <option value="elderly">养老服务</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* 业务对象 */}
              <div className="relative">
                <select
                  value={objectFilter}
                  onChange={(e) => setObjectFilter(e.target.value)}
                  className="h-8 pl-2.5 pr-7 bg-white border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer shadow-2xs font-medium"
                >
                  <option value="all">全部业务对象</option>
                  <option value="person">自然人</option>
                  <option value="region">行政区域</option>
                  <option value="org">养老机构</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* 使用条件 */}
              <div className="relative">
                <select
                  value={accessFilter}
                  onChange={(e) => setAccessFilter(e.target.value)}
                  className="h-8 pl-2.5 pr-7 bg-white border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer shadow-2xs font-medium"
                >
                  <option value="all">使用条件：全部</option>
                  <option value="available">可直接使用 / 可调用</option>
                  <option value="restricted">需申请使用</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* 排序（Browse 默认排序 / Search 相关度） */}
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="h-8 pl-2.5 pr-7 bg-white border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer shadow-2xs font-medium"
                >
                  <option value="relevance">{currentMode === 'resource_search' ? '相关度' : '默认排序'}</option>
                  <option value="popular">热门使用</option>
                  <option value="recent">最近发布</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* 清除筛选（仅在有筛选时出现，紧跟筛选器） */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="h-8 px-2.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>清除筛选</span>
                </button>
              )}
            </div>

            {/* List Result Header */}
            <div className="flex items-baseline space-x-2 pt-1">
              {submittedQuery ? (
                <>
                  <h2 className="text-sm font-bold text-[#172033]">
                    找到 {filteredBrowseResources.length} 个资源
                  </h2>
                  <span className="text-xs text-[#667085] font-normal">
                    与“{submittedQuery}”相关
                  </span>
                </>
              ) : (
                <>
                  <h2 className="text-sm font-bold text-[#172033]">
                    {filteredBrowseResources.length} 个资源
                  </h2>
                  <span className="text-xs text-[#667085] font-normal">
                    符合当前浏览条件
                  </span>
                </>
              )}
            </div>

            {/* Compact Rich Resource Rows */}
            <div className="bg-white border border-[#E6EAF0] rounded-md divide-y divide-[#EEF2F6] shadow-2xs overflow-hidden">
              {pagedBrowseResources.map((item) => {
                const isAdded = selectedResourceIds.includes(item.id);
                const isCurrentPreview = selectedPreviewItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenPreview(item)}
                    className={`p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                      isCurrentPreview
                        ? 'bg-[#EFF6FF]/60 border-l-4 border-l-[#2563EB]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {/* Resource Content — only the resource's own facts */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.type === 'BUSINESS_OBJECT' && (
                          <div className="w-5 h-5 rounded bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] shrink-0">
                            <Users className="w-3 h-3" />
                          </div>
                        )}
                        {item.type === 'DATA_ASSET' && (
                          <div className="w-5 h-5 rounded bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] shrink-0">
                            <Table className="w-3 h-3" />
                          </div>
                        )}
                        {item.type === 'METRIC' && (
                          <div className="w-5 h-5 rounded bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
                            <BarChart3 className="w-3 h-3" />
                          </div>
                        )}
                        {item.type === 'DATA_API' && (
                          <div className="w-5 h-5 rounded bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] shrink-0">
                            <Globe className="w-3 h-3" />
                          </div>
                        )}

                        <h3
                          className={`text-sm font-bold transition-colors ${
                            isCurrentPreview ? 'text-[#2563EB]' : 'text-[#172033] hover:text-[#2563EB]'
                          }`}
                        >
                          {item.name}
                        </h3>

                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded border border-[#E2E8F0]">
                          {TYPE_PRESENTATION[item.type]}
                        </span>

                        {(item.fitnessStatus === 'ready' || item.fitnessStatus === 'good') && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#ECFDF5] text-[#16A36A] rounded border border-[#A7F3D0]">
                            正式资源
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#667085]">
                        {item.domainName} · {item.objectName}
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed">
                        {item.description}
                      </p>

                      {item.useCases && item.useCases.length > 0 && (
                        <div className="text-[11px] text-[#667085] pt-0.5">
                          适用于：{item.useCases.join(' · ')}
                        </div>
                      )}
                    </div>

                    {/* Action Rail */}
                    <div
                      className="flex flex-col items-end gap-2 shrink-0 self-start md:self-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className={`inline-flex items-center space-x-1 text-[11px] font-semibold ${accessPresentation(item.accessStatus).textClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${accessPresentation(item.accessStatus).dotClass}`} />
                        <span>{accessPresentation(item.accessStatus).label}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold transition-colors cursor-pointer flex items-center space-x-0.5"
                      >
                        <span>查看资源</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {isAdded ? (
                        <button
                          type="button"
                          onClick={() => handleToggleBrowseResource(item)}
                          className="px-3 py-1.5 rounded text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA] transition-all cursor-pointer flex items-center space-x-1 group/btn"
                        >
                          <Check className="w-3.5 h-3.5 group-hover/btn:hidden text-[#2563EB]" />
                          <X className="w-3.5 h-3.5 hidden group-hover/btn:inline-block text-[#DC2626]" />
                          <span className="group-hover/btn:hidden">✓ 已加入候选</span>
                          <span className="hidden group-hover/btn:inline">移除</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleBrowseResource(item)}
                          className="px-3 py-1.5 rounded text-xs font-semibold bg-white text-[#334155] border border-[#CBD5E1] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#F8FAFC] transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>加入候选</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="bg-white border border-[#E6EAF0] rounded-md px-4 py-3 flex items-center justify-between text-xs text-[#64748B] shadow-2xs">
              <div className="flex items-center space-x-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-7 px-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded text-xs text-[#334155] focus:outline-none cursor-pointer"
                >
                  <option value={20}>每页 20 条</option>
                  <option value={50}>每页 50 条</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 font-medium">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setCurrentPage(p);
                      addToast?.('info', `第 ${p} 页`, `已载入第 ${p} 页资源`);
                    }}
                    className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                      currentPage === p
                        ? 'bg-[#2563EB] text-white font-bold'
                        : 'hover:bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div>
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    addToast?.('info', '下一页', `已翻至下一页`);
                  }}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E6EAF0] rounded text-xs text-[#334155] font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TRAY FOR BROWSE/RESOURCE SEARCH MODE (collect only —      */}
        {/* compose lives one layer deeper, in the candidate drawer)  */}
        {/* ========================================================= */}
        {currentMode !== 'goal_search' && selectedResourceIds.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xs border-t border-[#E6EAF0] shadow-lg px-6 lg:px-8 py-3.5 transition-all animate-in slide-in-from-bottom-2 duration-150">
            <div className="w-full max-w-[1500px] mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <span className="text-xs font-bold text-[#172033] shrink-0">
                  候选资源
                </span>
                <span className="px-1.5 py-0.2 bg-[#2563EB] text-white text-[11px] font-bold rounded-full shrink-0">
                  {selectedResourceIds.length}
                </span>

                <p className="text-xs text-[#64748B] truncate max-w-[580px]">
                  {selectedResourceItems.slice(0, 3).map(r => r.name).join(' · ')}
                  {selectedResourceItems.length > 3 ? ` · 等 ${selectedResourceItems.length} 项` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSelectedTrayDrawerOpen(true)}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold cursor-pointer flex items-center space-x-0.5 shrink-0"
              >
                <span>查看候选</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TRAY FOR GOAL SEARCH MODE (待加入当前方案)                  */}
        {/* ========================================================= */}
        {currentMode === 'goal_search' && candidatesQueue.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xs border-t border-[#E6EAF0] shadow-lg px-6 lg:px-8 py-3.5 transition-all animate-in slide-in-from-bottom-2 duration-150">
            <div className="w-full max-w-[1500px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#172033]">
                    待加入当前方案
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#2563EB] text-white text-[11px] font-bold rounded-full">
                    {candidatesQueue.length}
                  </span>
                </div>
                
                <p className="text-xs text-[#64748B] truncate max-w-[580px]">
                  {candidatesQueue.map(id => RELATED_CANDIDATES.find(c => c.id === id)?.name).filter(Boolean).join(' · ')}
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCandidateTrayDrawerOpen(true)}
                  className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer px-2 py-1"
                >
                  查看已选 ({candidatesQueue.length})
                </button>

                <button
                  type="button"
                  onClick={handleClearCandidates}
                  className="text-xs text-[#667085] hover:text-[#DC2626] cursor-pointer px-2 py-1 transition-colors"
                >
                  清空
                </button>

                <button
                  type="button"
                  onClick={handleRecomposeSolution}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-sm flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>更新当前方案</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 3. CANDIDATE DRAWER (collect → compose lives here,        */}
      {/*    one layer deeper than the tray)                        */}
      {/* ========================================================= */}
      {isSelectedTrayDrawerOpen && (
        <aside className="w-[420px] bg-white border-l border-[#E6EAF0] shadow-2xl flex flex-col shrink-0 z-30 animate-in slide-in-from-right duration-200">
          <div className="px-5 py-4 border-b border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#172033]">
                候选资源
              </h3>
              <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[11px] font-bold rounded">
                {selectedResourceIds.length} 项
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearAllSelected}
                className="px-2 py-1 rounded text-[11px] text-[#64748B] hover:text-[#DC2626] font-medium cursor-pointer transition-colors"
              >
                清空
              </button>

              <button
                onClick={() => setIsSelectedTrayDrawerOpen(false)}
                className="p-1.5 rounded hover:bg-[#EEF2F6] text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {selectedResourceItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#98A2B3]">
                暂无已选资源，请在列表中点击「＋ 加入候选」
              </div>
            ) : (
              selectedResourceItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white text-[#475569] rounded border border-[#CBD5E1]">
                        {TYPE_PRESENTATION[item.type]}{item.subType ? ` · ${SUBTYPE_PRESENTATION[item.subType] || item.subType}` : ''}
                      </span>
                      <h4 className="text-xs font-bold text-[#172033] truncate">
                        {item.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#64748B] line-clamp-1">
                      {item.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleBrowseResource(item)}
                    className="text-xs text-[#98A2B3] hover:text-[#DC2626] font-medium shrink-0 cursor-pointer px-1.5 py-1"
                  >
                    移除
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Compose: what does the user want to do with these candidates? */}
          <div className="p-4 border-t border-[#E6EAF0] bg-[#FAFCFF] space-y-2.5">
            <div className="text-[11px] font-bold text-[#172033]">
              这些资源准备做什么？
            </div>

            <textarea
              rows={3}
              value={goalInputValue}
              onChange={(e) => setGoalInputValue(e.target.value)}
              placeholder="描述你的业务目标……"
              className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#2563EB] transition-all font-medium resize-none"
            />

            {/* No silent default goal — compose stays disabled until a goal exists */}
            {!effectiveComposeGoal && (
              <p className="text-[11px] text-[#D97706] flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>请先描述这些资源准备解决什么业务问题</span>
              </p>
            )}

            <button
              type="button"
              disabled={!effectiveComposeGoal}
              onClick={() => {
                handleConfirmGoalAndCompose();
                setIsSelectedTrayDrawerOpen(false);
              }}
              className="w-full px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:hover:bg-[#2563EB] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>基于候选构建数据方案 →</span>
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================= */}
      {/* 5. EDIT GOAL MODAL (In Goal Search Mode)                  */}
      {/* ========================================================= */}
      {isEditingGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E6EAF0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-[#172033]">
                  修改业务目标
                </h3>
              </div>
              <button
                onClick={() => setIsEditingGoalModalOpen(false)}
                className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#475569] leading-relaxed">
                更新目标后，Semovix 将重新评估当前资源组合的角色分配、口径依赖与覆盖完整性。
              </p>

              <div className="space-y-1.5">
                <textarea
                  rows={3}
                  value={tempGoalInput}
                  onChange={(e) => setTempGoalInput(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all font-medium resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E6EAF0] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditingGoalModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#475569] hover:text-[#172033] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tempGoalInput.trim()) {
                    setBusinessGoal(tempGoalInput.trim());
                    // Recompose over the CURRENT solution membership (goal changed, resources kept)
                    setSolutionResources(composeSolutionResources(
                      solutionResources
                        .map(s => ALL_DISCOVERABLE_RESOURCES.find(r => r.id === s.id))
                        .filter(Boolean) as ResourceItem[]
                    ));
                    setIsEditingGoalModalOpen(false);
                    addToast?.('success', '目标已更新', 'Semovix 已重新组织数据方案');
                  }
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs"
              >
                重新构建方案
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. KEY RESOURCE REMOVAL CONFIRMATION MODAL               */}
      {/* ========================================================= */}
      {removalTargetResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 text-[#D97706]" />
              <h3 className="text-sm font-bold text-[#92400E]">
                移除「{removalTargetResource.name}」？
              </h3>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-[#475569] leading-relaxed">
                该资源是当前老龄化率计算和人口结构分析的<strong>核心数据/口径</strong>。移除后当前方案将无法完整完成原分析目标。
              </p>
            </div>

            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E6EAF0] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRemovalTargetResource(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#475569] hover:text-[#172033] cursor-pointer"
              >
                保留
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveKeyResource}
                className="px-4 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs"
              >
                仍然移除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. RESOURCE DETAIL PREVIEW DRAWER — true overlay:         */}
      {/*    floats over the explorer, never reflows the list       */}
      {/* ========================================================= */}
      {selectedPreviewItem && (
        <aside className="fixed right-0 top-[64px] bottom-0 w-full sm:w-[480px] bg-white border-l border-[#E6EAF0] shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-200">
          <div className="px-5 py-4 border-b border-[#E6EAF0] bg-[#FAFCFF] flex items-start justify-between">
            <div className="space-y-1 min-w-0 pr-3">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  {TYPE_PRESENTATION[selectedPreviewItem.type]}{selectedPreviewItem.subType ? ` · ${SUBTYPE_PRESENTATION[selectedPreviewItem.subType] || selectedPreviewItem.subType}` : ''}
                </span>
                {(selectedPreviewItem.fitnessStatus === 'ready' || selectedPreviewItem.fitnessStatus === 'good') && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0]">
                    正式资源
                  </span>
                )}
                {selectedPreviewItem.accessStatus === 'semantic_only' ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#6366F1] bg-[#EEF2FF] px-1.5 py-0.2 rounded border border-[#C7D2FE]">
                    <span>{ACCESS_PRESENTATION.semantic_only.label}</span>
                  </span>
                ) : (
                  <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    selectedPreviewItem.accessStatus === 'available'
                      ? 'text-[#16A36A] bg-[#ECFDF5] border-[#A7F3D0]'
                      : 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]'
                  }`}>
                    {selectedPreviewItem.accessStatus === 'available' ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                    <span>{accessPresentation(selectedPreviewItem.accessStatus).label}</span>
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-[#172033] tracking-tight truncate">
                {selectedPreviewItem.name}
              </h3>
              <p className="text-[11px] text-[#64748B] truncate">
                归属：{selectedPreviewItem.domainName} · {selectedPreviewItem.objectName}
              </p>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(selectedPreviewItem.name);
                  addToast?.('success', '已复制', `已复制「${selectedPreviewItem.name}」名称`);
                }}
                className="p-1.5 rounded hover:bg-[#EEF2F6] text-[#64748B] hover:text-[#172033] cursor-pointer"
                title="复制名称"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedPreviewItem(null)}
                className="p-1.5 rounded hover:bg-[#EEF2F6] text-[#64748B] hover:text-[#172033] cursor-pointer"
                title="关闭预览"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* 业务说明 */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#172033]">业务说明</div>
                <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] p-3 rounded-md border border-[#E6EAF0]">
                  {selectedPreviewItem.description}
                </p>
              </div>

              {/* 这份资源包含什么 — full schema & formulas live in Resource Detail */}
              {previewContains.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#172033]">这份资源包含什么</div>
                  <div className="flex flex-wrap gap-1.5">
                    {previewContains.map((entry) => (
                      <span key={entry} className="px-2 py-1 rounded-md text-[11px] font-medium bg-white text-[#334155] border border-[#E6EAF0]">
                        {entry}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 适合做什么 */}
              {selectedPreviewItem.useCases && selectedPreviewItem.useCases.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#172033]">适合做什么</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPreviewItem.useCases.map((useCase) => (
                      <span key={useCase} className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3.5 pt-1">
                <div className="text-[11px] font-bold text-[#172033]">相关资源</div>
                {selectedPreviewItem.relatedAssets && selectedPreviewItem.relatedAssets.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPreviewItem.relatedAssets.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => {
                          const target = ALL_DISCOVERABLE_RESOURCES.find(r => r.id === rel.id);
                          if (target) setSelectedPreviewItem(target);
                        }}
                        className="p-2.5 rounded-md bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.2 bg-white text-[#2563EB] text-[10px] font-bold rounded border border-[#CBD5E1]">
                            {TYPE_PRESENTATION[rel.type] || rel.type}
                          </span>
                          <span className="font-bold text-xs text-[#172033]">{rel.name}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#F8FAFC] rounded border border-[#E6EAF0] text-center text-[#94A3B8]">
                    暂无直接关联资产记录
                  </div>
                )}
              </div>
          </div>

          <div className="p-4 border-t border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between gap-3">
            {/* Collect — Browse / Resource Search only; goal mode manages its own solution set */}
            {currentMode !== 'goal_search' ? (
              isPreviewAdded ? (
                <button
                  type="button"
                  onClick={() => handleToggleBrowseResource(selectedPreviewItem)}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA] transition-all cursor-pointer flex items-center space-x-1 group/btn"
                >
                  <Check className="w-3.5 h-3.5 group-hover/btn:hidden text-[#2563EB]" />
                  <X className="w-3.5 h-3.5 hidden group-hover/btn:inline-block text-[#DC2626]" />
                  <span className="group-hover/btn:hidden">✓ 已加入候选</span>
                  <span className="hidden group-hover/btn:inline">移除</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleBrowseResource(selectedPreviewItem)}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-white text-[#334155] border border-[#CBD5E1] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#F8FAFC] transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>加入候选</span>
                </button>
              )
            ) : (
              <div />
            )}

            {/* Full detail — unified label, per-type navigation (DATA_API has no detail page yet) */}
            {selectedPreviewItem.type !== 'DATA_API' ? (
              <button
                onClick={() => {
                  const target = selectedPreviewItem;
                  const fromGoalSearch = currentMode === 'goal_search';
                  setSelectedPreviewItem(null);
                  if (target.type === 'BUSINESS_OBJECT') {
                    onNavigateToBusinessObjectDetail?.(target.id, fromGoalSearch, businessGoal);
                  } else if (target.type === 'DATA_ASSET') {
                    onNavigateToDataAssetDetail?.(target.id, fromGoalSearch, businessGoal);
                  } else {
                    onNavigateToMetricDetail?.(target.id, fromGoalSearch, businessGoal);
                  }
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>查看完整详情</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </aside>
      )}

      {/* ========================================================= */}
      {/* 8. SINGLE RESOURCE ACCESS REQUEST DRAWER                  */}
      {/* ========================================================= */}
      {isAccessDrawerOpen && accessTargetResource && (
        <SingleResourceAccessRequestDrawer
          resourceName={accessTargetResource.name}
          resourceType="DATA_ASSET"
          subType="VIEW"
          technicalName="population_basic_info_v"
          businessDefinition="提供自然人的年龄、出生日期、常住状态和行政区域，是计算人口年龄结构与老龄化程度的基础数据。"
          consumerFact="一行代表：一个自然人主体"
          businessDomain="人口服务"
          businessObject="自然人"
          availableFieldsCount={12}
          onClose={() => setIsAccessDrawerOpen(false)}
          onSubmitSuccess={() => {
            setIsAccessDrawerOpen(false);
            setSolutionResources(prev =>
              prev.map(r =>
                r.name === accessTargetResource.name
                  ? { ...r, accessStatus: 'available', accessLabel: '可使用' }
                  : r
              )
            );
            addToast?.('success', '申请已提交', `已授予「${accessTargetResource.name}」查询权限，方案执行条件已就绪！`);
          }}
          addToast={addToast}
        />
      )}

    </div>
  );
};
