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

export type ExplorerMode = 'browse' | 'resource_search' | 'goal_search';

interface ResourceExplorerWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  initialQuery?: string;
  initialMode?: ExplorerMode;
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
    owner: '统计调查与人口运行处',
    securityLevel: 'L2（受限访问）',
    updateFrequency: '每日 02:00 定时增量',
    matchReason: '包含年龄、出生日期等人口年龄分析所需信息',
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
    owner: '发展规划与老龄办',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '月度 / 季度 / 年度',
    matchReason: '正式指标口径直接对应人口年龄结构分析',
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
    owner: '基础地理与民政信息科',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '半年 / 依据民政调整',
    matchReason: '支持人口年龄数据按街镇进行分析',
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
    owner: '人口大数据中心',
    securityLevel: 'L2（受限访问）',
    updateFrequency: '每日同步',
    matchReason: '与常住人口年龄分析相关',
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
    owner: '统计局人口处',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '月度更新',
    matchReason: '已形成年龄区间聚合结果',
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
    owner: '人口大数据中心',
    securityLevel: 'L3（业务概念）',
    updateFrequency: '模型持续演进',
    matchReason: '是当前人口年龄相关资源的核心业务主体',
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
    owner: '服务集成网关团队',
    securityLevel: 'L1（开放网关）',
    updateFrequency: '实时响应 (<50ms)',
    matchReason: '支持按年龄条件查询人口统计结果',
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
    owner: '民政养老服务发展处',
    securityLevel: 'L2（受限访问）'
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
    owner: '民政养老服务发展处',
    securityLevel: 'L1（公开可用）'
  }
];

export const ResourceExplorerWorkspace: React.FC<ResourceExplorerWorkspaceProps> = ({
  addToast,
  initialQuery = '',
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
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>(['res-02', 'res-03', 'res-05']);
  const [isSelectedTrayDrawerOpen, setIsSelectedTrayDrawerOpen] = useState<boolean>(false);
  const [isGoalCaptureModalOpen, setIsGoalCaptureModalOpen] = useState<boolean>(false);
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

  // Business Goal State for Goal Search Mode
  const [businessGoal, setBusinessGoal] = useState<string>(
    initialQuery && initialQuery.length > 5 ? initialQuery : '分析闵行区各街镇人口老龄化程度，并比较不同街镇的人口结构差异'
  );
  const [isEditingGoalModalOpen, setIsEditingGoalModalOpen] = useState<boolean>(false);
  const [tempGoalInput, setTempGoalInput] = useState<string>(businessGoal);

  // Solution Resources for Goal Search Mode
  const [solutionResources, setSolutionResources] = useState<SolutionResourceItem[]>([
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
  ]);

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
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'schema' | 'api_doc' | 'lineage'>('overview');
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Synchronize when initialMode or initialQuery changes
  useEffect(() => {
    if (initialMode && initialMode !== 'browse') {
      setCurrentMode(initialMode);
    } else if (initialQuery !== undefined) {
      if (initialQuery && isExplicitGoal(initialQuery)) {
        setCurrentMode('goal_search');
        setBusinessGoal(initialQuery);
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

  // Filtering for Browse / Resource Search mode
  const filteredBrowseResources = useMemo(() => {
    let list = [...ALL_DISCOVERABLE_RESOURCES];

    // Query filter
    if (submittedQuery.trim()) {
      const q = submittedQuery.toLowerCase().trim();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q) ||
        r.context.toLowerCase().includes(q) ||
        (r.matchReason && r.matchReason.toLowerCase().includes(q))
      );
    }

    if (activeTypeTab !== 'ALL') {
      list = list.filter(r => r.type === activeTypeTab);
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
  }, [submittedQuery, activeTypeTab, domainFilter, objectFilter, accessFilter]);

  // Type Counts within discoverable scope
  const typeCounts = useMemo(() => {
    return {
      ALL: 128,
      DATA_ASSET: 73,
      METRIC: 21,
      DATA_API: 12,
      BUSINESS_OBJECT: 22
    };
  }, []);

  // Calculate Solution Coverage facts
  const isCoverageComplete = useMemo(() => {
    const hasCoreData = solutionResources.some(r => r.role === 'CORE_DATA');
    const hasMetric = solutionResources.some(r => r.role === 'CORE_METRIC');
    const hasDimension = solutionResources.some(r => r.role === 'DIMENSION');
    return hasCoreData && hasMetric && hasDimension;
  }, [solutionResources]);

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

  // Start Building Data Solution from Browse / Search Tray
  const handleStartComposeSolution = () => {
    if (selectedResourceIds.length === 0) {
      addToast?.('info', '请先加入资源', '至少加入一项资源后再构建数据方案');
      return;
    }

    if (isQueryFullGoal(submittedQuery)) {
      setBusinessGoal(submittedQuery);
      setCurrentMode('goal_search');
      addToast?.('success', '构建数据方案', `已基于目标「${submittedQuery}」组合 ${selectedResourceIds.length} 项候选资源`);
    } else {
      setGoalInputValue('');
      setIsGoalCaptureModalOpen(true);
    }
  };

  // Confirm Goal and Compose Solution
  const handleConfirmGoalAndCompose = () => {
    const finalGoal = goalInputValue.trim() || '分析各街镇人口老龄化程度及人口结构差异';
    setBusinessGoal(finalGoal);
    setIsGoalCaptureModalOpen(false);
    setCurrentMode('goal_search');
    addToast?.('success', '构建数据方案', `已基于目标「${finalGoal}」智能解析候选资源角色与依赖`);
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
      setCurrentMode('goal_search');
      addToast?.('success', '业务目标解析', `已针对目标「${q}」解析最小数据方案`);
    } else {
      setCurrentMode('resource_search');
      addToast?.('info', '精准检索', `已刷新检索结果「${q}」`);
    }
  };

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
    addToast?.('info', '已重置筛选', '已展示全部可发现资源');
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
    setActiveDrawerTab('overview');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">

      {/* ========================================================= */}
      {/* MAIN WORKSPACE (Single Natural Reading Path)               */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F8FAFC] relative transition-all">

        {/* Page Top Header */}
        <div className="bg-white border-b border-[#E6EAF0] px-6 lg:px-8 pt-4 pb-4 shrink-0">
          <div className="w-full max-w-[1500px]">
            {/* Title & Subtitle */}
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
        </div>

        {/* ======================================================= */}
        {/* VIEW BRANCH A: GOAL SEARCH (CURRENT DATA SOLUTION)      */}
        {/* ======================================================= */}
        {currentMode === 'goal_search' ? (
          <div className={`p-6 lg:p-8 space-y-6 w-full max-w-[1500px] transition-all ${candidatesQueue.length > 0 ? 'pb-28' : 'pb-12'}`}>
            
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

                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono border border-[#E2E8F0]">
                          {item.type} {item.subType ? `· ${item.subType}` : ''}
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
                          {item.accessStatus === 'available' ? (
                            <span className="text-[#16A36A] flex items-center space-x-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                              <span>{item.accessLabel}</span>
                            </span>
                          ) : item.accessStatus === 'dependent' ? (
                            <span className="text-[#475569] text-[11px]">
                              {item.accessLabel}
                            </span>
                          ) : (
                            <span className="text-[#D97706] flex items-center space-x-0.5 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                              <span>{item.accessLabel}</span>
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
                  <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#EEF2F6]">
                    <span className="text-[#475569]">人口范围（实足年龄 / 常住状态）</span>
                    <span className="font-semibold text-[#16A36A] flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>已覆盖</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#EEF2F6]">
                    <span className="text-[#475569]">老龄化口径（60周岁及以上比例）</span>
                    <span className="font-semibold text-[#16A36A] flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>已覆盖</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#EEF2F6]">
                    <span className="text-[#475569]">街镇维度（街镇代码与名称聚合）</span>
                    <span className="font-semibold text-[#16A36A] flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>已覆盖</span>
                    </span>
                  </div>
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
                        {r.accessStatus === 'available' ? (
                          <span className="text-[#16A36A] font-semibold">🟢 可使用</span>
                        ) : r.accessStatus === 'dependent' ? (
                          <span className="text-[#475569]">依赖人口基本信息视图</span>
                        ) : (
                          <span className="text-[#D97706] font-semibold">🟠 需申请</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#667085] leading-relaxed pt-1">
                  {accessReadiness.isAllReady
                    ? '当前方案已具备完整执行条件，可直接进入分析。'
                    : '补齐人口基本信息视图的查询条件后，当前方案即可支持正式老龄化分析。'}
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
                    : '当前仅缺少人口基本信息视图的查询访问条件。'}
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
                  相关资源
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  围绕当前老龄化分析任务，可进一步加入并扩展的数据与服务资源。
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
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono border border-[#E2E8F0]">
                            {candidate.type} {candidate.subType ? `· ${candidate.subType}` : ''}
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
                            {candidate.whyUseful}
                          </span>

                          <div className="flex items-center space-x-1 text-[11px] font-medium">
                            <span className="text-[#94A3B8]">访问:</span>
                            {candidate.accessStatus === 'available' ? (
                              <span className="text-[#16A36A] flex items-center space-x-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                                <span>{candidate.accessLabel}</span>
                              </span>
                            ) : (
                              <span className="text-[#D97706] flex items-center space-x-0.5 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                                <span>{candidate.accessLabel}</span>
                              </span>
                            )}
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
          <div className={`p-6 lg:p-8 space-y-5 w-full max-w-[1500px] transition-all ${selectedResourceIds.length > 0 ? 'pb-28' : 'pb-12'}`}>
            
            {/* Search Box Area */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-4 shadow-2xs space-y-2">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#98A2B3]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleExecuteSearch(searchQuery);
                    }}
                    placeholder="可搜索数据资产、指标、数据 API、业务对象，也可以直接输入业务目标…"
                    className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSubmittedQuery('');
                      }}
                      className="absolute right-3 top-2.5 text-[#98A2B3] hover:text-[#475569]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleExecuteSearch(searchQuery)}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  搜索
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#98A2B3] pl-1">
                <span>可搜索数据资产、指标、数据 API、业务对象，或直接输入业务目标。</span>
                {submittedQuery && (
                  <span className="text-[#2563EB] font-medium">
                    当前检索: “{submittedQuery}” ({filteredBrowseResources.length} 项)
                  </span>
                )}
              </div>
            </div>

            {/* Resource Type Tabs (Horizontal) */}
            <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-2">
              <div className="flex items-center space-x-2">
                {[
                  { key: 'ALL', label: '全部', count: typeCounts.ALL },
                  { key: 'DATA_ASSET', label: '数据资产', count: typeCounts.DATA_ASSET },
                  { key: 'METRIC', label: '指标', count: typeCounts.METRIC },
                  { key: 'DATA_API', label: '数据 API', count: typeCounts.DATA_API },
                  { key: 'BUSINESS_OBJECT', label: '业务对象', count: typeCounts.BUSINESS_OBJECT },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTypeTab(tab.key as any);
                      addToast?.('info', '类型切换', `已筛选「${tab.label}」`);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
                      activeTypeTab === tab.key
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${activeTypeTab === tab.key ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Bar (Only P0: 业务域、业务对象、访问条件、排序、重置) */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* 业务域 */}
                <div className="relative">
                  <select
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="h-8 pl-2.5 pr-7 bg-white border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer shadow-2xs font-medium"
                  >
                    <option value="all">全部业务域 ▾</option>
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
                    <option value="all">全部业务对象 ▾</option>
                    <option value="person">自然人</option>
                    <option value="region">行政区域</option>
                    <option value="org">养老机构</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
                </div>

                {/* 访问条件 */}
                <div className="relative">
                  <select
                    value={accessFilter}
                    onChange={(e) => setAccessFilter(e.target.value)}
                    className="h-8 pl-2.5 pr-7 bg-white border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer shadow-2xs font-medium"
                  >
                    <option value="all">访问条件：全部 ▾</option>
                    <option value="available">可直接使用 / 可调用</option>
                    <option value="restricted">需申请使用</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
                </div>

                {/* 排序 */}
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="h-8 pl-2.5 pr-7 bg-white border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer shadow-2xs font-medium"
                  >
                    <option value="relevance">排序：默认排序 ▾</option>
                    <option value="update">最近更新时间</option>
                    <option value="name">资源名称</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* 重置 */}
              <button
                onClick={handleResetFilters}
                className="h-8 px-3 text-xs text-[#667085] hover:text-[#172033] font-medium flex items-center space-x-1 cursor-pointer hover:bg-white rounded-md transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-[#98A2B3]" />
                <span>重置</span>
              </button>
            </div>

            {/* List Result Header */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-baseline space-x-2">
                <h2 className="text-sm font-bold text-[#172033]">
                  {submittedQuery ? `搜索结果` : '可发现资源'}
                </h2>
                <span className="text-xs text-[#667085] font-normal">
                  {submittedQuery ? `找到与“${submittedQuery}”相关的资源` : '当前可发现范围内的全部资源'} ({filteredBrowseResources.length} 项)
                </span>
              </div>
            </div>

            {/* Compact Rich Resource Rows */}
            <div className="bg-white border border-[#E6EAF0] rounded-md divide-y divide-[#EEF2F6] shadow-2xs overflow-hidden">
              {filteredBrowseResources.map((item) => {
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

                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono border border-[#E2E8F0]">
                          {item.type} {item.subType ? `· ${item.subType}` : ''}
                        </span>

                        <span className="text-xs text-[#667085]">
                          {item.context}
                        </span>
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5 text-xs">
                        {item.matchReason && (
                          <div className="text-[11px] text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE] flex items-center space-x-1">
                            <Check className="w-3 h-3 text-[#2563EB]" />
                            <span>{item.matchReason}</span>
                          </div>
                        )}

                        {item.type !== 'BUSINESS_OBJECT' ? (
                          <div className="flex items-center space-x-1 text-[11px] font-medium">
                            <span className="text-[#64748B]">访问:</span>
                            {item.accessStatus === 'available' ? (
                              <span className="text-[#16A36A] flex items-center space-x-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                                <span>{item.accessLabel || '可使用'}</span>
                              </span>
                            ) : (
                              <span className="text-[#D97706] flex items-center space-x-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                                <span>{item.accessLabel || '需申请'}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#64748B] font-medium">
                            <span>类型: 语义概念资源</span>
                          </div>
                        )}

                        {item.fitnessLabel && (
                          <div className="flex items-center space-x-1 text-[11px] font-medium">
                            <span className="text-[#64748B]">适用性:</span>
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
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center space-x-2 shrink-0 self-start md:self-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className={`px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer border ${
                          isCurrentPreview
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'text-[#475569] hover:text-[#172033] hover:bg-[#F1F5F9] border-[#E6EAF0]'
                        }`}
                      >
                        {item.type === 'BUSINESS_OBJECT' ? '查看相关' : '查看详情'}
                      </button>

                      {isAdded ? (
                        <button
                          type="button"
                          onClick={() => handleToggleBrowseResource(item)}
                          className="px-3 py-1.5 rounded text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA] transition-all cursor-pointer flex items-center space-x-1 group/btn"
                        >
                          <Check className="w-3.5 h-3.5 group-hover/btn:hidden text-[#2563EB]" />
                          <X className="w-3.5 h-3.5 hidden group-hover/btn:inline-block text-[#DC2626]" />
                          <span className="group-hover/btn:hidden">✓ 已加入</span>
                          <span className="hidden group-hover/btn:inline">移除</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleBrowseResource(item)}
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
                {[1, 2, 3, 4].map((p) => (
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
                    setCurrentPage((prev) => Math.min(prev + 1, 4));
                    addToast?.('info', '下一页', `已翻至下一页`);
                  }}
                  className="px-3 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E6EAF0] rounded text-xs text-[#334155] font-medium cursor-pointer transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TRAY FOR BROWSE/RESOURCE SEARCH MODE                      */}
        {/* ========================================================= */}
        {currentMode !== 'goal_search' && selectedResourceIds.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xs border-t border-[#E6EAF0] shadow-lg px-6 lg:px-8 py-3.5 transition-all animate-in slide-in-from-bottom-2 duration-150">
            <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#172033]">
                    已选资源
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#2563EB] text-white text-[11px] font-bold rounded-full">
                    {selectedResourceIds.length}
                  </span>
                  <span className="text-[11px] text-[#98A2B3]">
                    · 临时工作集合
                  </span>
                </div>
                
                <p className="text-xs text-[#64748B] truncate max-w-[580px]">
                  {selectedResourceItems.slice(0, 3).map(r => r.name).join(' · ')}
                  {selectedResourceItems.length > 3 ? ` · 等 ${selectedResourceItems.length} 项` : ''}
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSelectedTrayDrawerOpen(true)}
                  className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer px-2 py-1"
                >
                  查看已选 ({selectedResourceIds.length})
                </button>

                <button
                  type="button"
                  onClick={handleClearAllSelected}
                  className="text-xs text-[#667085] hover:text-[#DC2626] cursor-pointer px-2 py-1 transition-colors"
                >
                  清空
                </button>

                <button
                  type="button"
                  onClick={handleStartComposeSolution}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-sm flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>用这些资源构建数据方案</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TRAY FOR GOAL SEARCH MODE (待加入当前方案)                  */}
        {/* ========================================================= */}
        {currentMode === 'goal_search' && candidatesQueue.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xs border-t border-[#E6EAF0] shadow-lg px-6 lg:px-8 py-3.5 transition-all animate-in slide-in-from-bottom-2 duration-150">
            <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
      {/* 3. SELECTED TRAY DRAWER (Browse Mode)                     */}
      {/* ========================================================= */}
      {isSelectedTrayDrawerOpen && (
        <aside className="w-[420px] bg-white border-l border-[#E6EAF0] shadow-2xl flex flex-col shrink-0 z-30 animate-in slide-in-from-right duration-200">
          <div className="px-5 py-4 border-b border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#172033]">
                已选资源
              </h3>
              <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[11px] font-bold rounded">
                {selectedResourceIds.length} 项
              </span>
            </div>

            <button
              onClick={() => setIsSelectedTrayDrawerOpen(false)}
              className="p-1.5 rounded hover:bg-[#EEF2F6] text-[#64748B] hover:text-[#172033] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {selectedResourceItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#98A2B3]">
                暂无已选资源，请在列表中点击「＋ 加入」
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
                        {item.type} {item.subType ? `· ${item.subType}` : ''}
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

          <div className="p-4 border-t border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between">
            <button
              onClick={handleClearAllSelected}
              className="text-xs text-[#64748B] hover:text-[#DC2626] font-medium cursor-pointer"
            >
              清空全部
            </button>

            <button
              onClick={() => {
                setIsSelectedTrayDrawerOpen(false);
                handleStartComposeSolution();
              }}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>用这些资源构建数据方案</span>
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================= */}
      {/* 4. GOAL CAPTURE MODAL                                     */}
      {/* ========================================================= */}
      {isGoalCaptureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E6EAF0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-[#172033]">
                  准备用这些资源做什么？
                </h3>
              </div>
              <button
                onClick={() => setIsGoalCaptureModalOpen(false)}
                className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#475569] leading-relaxed">
                描述你准备完成的业务目标，Semovix 会判断这些资源分别承担什么作用、还缺哪些数据，以及当前是否适合使用。
              </p>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#64748B]">
                  当前已选：{selectedResourceIds.length} 项候选资源
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedResourceItems.map(r => (
                    <span
                      key={r.id}
                      className="px-2 py-0.5 bg-[#F1F5F9] text-[#334155] rounded text-[11px] border border-[#E2E8F0]"
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#172033]">
                  业务目标描述
                </label>
                <textarea
                  rows={3}
                  value={goalInputValue}
                  onChange={(e) => setGoalInputValue(e.target.value)}
                  placeholder="例如：分析闵行区各街镇人口老龄化程度及人口结构差异"
                  className="w-full p-2.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all font-medium resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E6EAF0] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsGoalCaptureModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#475569] hover:text-[#172033] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmGoalAndCompose}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs"
              >
                构建数据方案
              </button>
            </div>
          </div>
        </div>
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
      {/* 7. RESOURCE DETAIL PREVIEW DRAWER                         */}
      {/* ========================================================= */}
      {selectedPreviewItem && (
        <aside className="w-full sm:w-[460px] xl:w-[500px] bg-white border-l border-[#E6EAF0] shadow-2xl flex flex-col shrink-0 z-30 animate-in slide-in-from-right duration-200">
          <div className="px-5 py-4 border-b border-[#E6EAF0] bg-[#FAFCFF] flex items-start justify-between">
            <div className="space-y-1 min-w-0 pr-3">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] font-mono border border-[#BFDBFE]">
                  {selectedPreviewItem.type} {selectedPreviewItem.subType ? `· ${selectedPreviewItem.subType}` : ''}
                </span>
                {selectedPreviewItem.accessStatus === 'available' ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#16A36A] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#A7F3D0]">
                    <Unlock className="w-2.5 h-2.5" />
                    <span>{selectedPreviewItem.accessLabel || '可直接使用'}</span>
                  </span>
                ) : selectedPreviewItem.accessStatus === 'restricted' ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{selectedPreviewItem.accessLabel || '需申请使用'}</span>
                  </span>
                ) : null}
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

          <div className="flex items-center border-b border-[#EEF2F6] bg-white px-5 text-xs">
            <button
              onClick={() => setActiveDrawerTab('overview')}
              className={`py-2.5 mr-4 font-semibold transition-colors cursor-pointer border-b-2 ${
                activeDrawerTab === 'overview'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              业务概览
            </button>
            
            <button
              onClick={() => setActiveDrawerTab('schema')}
              className={`py-2.5 mr-4 font-semibold transition-colors cursor-pointer border-b-2 ${
                activeDrawerTab === 'schema'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              {selectedPreviewItem.type === 'METRIC' ? '指标公式' : '字段结构'}
            </button>

            <button
              onClick={() => setActiveDrawerTab('lineage')}
              className={`py-2.5 font-semibold transition-colors cursor-pointer border-b-2 ${
                activeDrawerTab === 'lineage'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              关联与依赖
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {activeDrawerTab === 'overview' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#64748B]">业务定义</div>
                  <p className="text-xs text-[#172033] leading-relaxed bg-[#F8FAFC] p-3 rounded-md border border-[#E6EAF0]">
                    {selectedPreviewItem.description}
                  </p>
                </div>

                {selectedPreviewItem.consumerFact && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-[#64748B] flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                      <span>消费者关键事实 (Consumer Fact)</span>
                    </div>
                    <div className="bg-[#FAFCFF] p-3 rounded-md border border-[#BFDBFE] text-xs text-[#1E40AF] font-medium">
                      {selectedPreviewItem.consumerFact}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-[#64748B]">管理与质量属性</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2.5 rounded border border-[#E6EAF0]">
                      <div className="text-[#94A3B8]">业务域 / 对象</div>
                      <div className="font-bold text-[#172033] mt-0.5">
                        {selectedPreviewItem.domainName} · {selectedPreviewItem.objectName}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-[#E6EAF0]">
                      <div className="text-[#94A3B8]">数据安全等级</div>
                      <div className="font-bold text-[#172033] mt-0.5">
                        {selectedPreviewItem.securityLevel || 'L1（公开可用）'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDrawerTab === 'schema' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {selectedPreviewItem.type === 'METRIC' ? (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-[#64748B]">指标计算公式</div>
                    <div className="bg-[#0F172A] text-[#38BDF8] font-mono text-[11px] p-3 rounded-md overflow-x-auto leading-relaxed border border-[#334155]">
                      {selectedPreviewItem.metricFormula || 'SUM(target) / COUNT(*)'}
                    </div>
                  </div>
                ) : (
                  <div className="border border-[#E6EAF0] rounded-md overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E6EAF0] text-[11px]">
                        <tr>
                          <th className="py-2 px-3 font-semibold">字段名 / 中文名</th>
                          <th className="py-2 px-3 font-semibold">类型</th>
                          <th className="py-2 px-3 font-semibold">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF2F6] text-[11px]">
                        {selectedPreviewItem.fields?.map((field) => (
                          <tr key={field.name} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-3">
                              <div className="font-mono font-bold text-[#172033]">{field.name}</div>
                              <div className="text-[10px] text-[#64748B]">{field.cnName}</div>
                            </td>
                            <td className="py-2 px-3 font-mono text-[#2563EB]">{field.type}</td>
                            <td className="py-2 px-3 text-[#475569]">{field.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeDrawerTab === 'lineage' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="text-[11px] font-bold text-[#64748B]">关联业务与数据资产</div>
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
                            {rel.type}
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
            )}
          </div>

          <div className="p-4 border-t border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between">
            {selectedPreviewItem.type === 'BUSINESS_OBJECT' ? (
              <button
                onClick={() => {
                  setSelectedPreviewItem(null);
                  onNavigateToBusinessObjectDetail?.(selectedPreviewItem.id, currentMode === 'goal_search', businessGoal);
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>查看业务对象详情</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : selectedPreviewItem.type === 'DATA_ASSET' ? (
              <button
                onClick={() => {
                  setSelectedPreviewItem(null);
                  onNavigateToDataAssetDetail?.(selectedPreviewItem.id, currentMode === 'goal_search', businessGoal);
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>查看资产详情</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : selectedPreviewItem.type === 'METRIC' ? (
              <button
                onClick={() => {
                  setSelectedPreviewItem(null);
                  onNavigateToMetricDetail?.(selectedPreviewItem.id, currentMode === 'goal_search', businessGoal);
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>查看指标详情</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={() => setSelectedPreviewItem(null)}
              className="px-4 py-1.5 bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded hover:bg-[#F1F5F9] cursor-pointer"
            >
              关闭
            </button>
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
                r.id === 'res-02'
                  ? { ...r, accessStatus: 'available', accessLabel: '可使用' }
                  : r
              )
            );
            addToast?.('success', '申请已提交', '已授予「人口基本信息视图」查询权限，方案执行条件已就绪！');
          }}
          addToast={addToast}
        />
      )}

    </div>
  );
};
