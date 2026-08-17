import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Compass,
  Layers,
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
  Network
} from 'lucide-react';
import { SingleResourceAccessRequestDrawer } from './SingleResourceAccessRequestDrawer';

interface ResourceExplorerWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  initialQuery?: string;
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToMetrics?: () => void;
  onNavigateToBusinessObject?: () => void;
  onNavigateToDataAssets?: () => void;
  onNavigateToDataAssetDetail?: (assetId: string, fromGoalSearch?: boolean, goalQuery?: string) => void;
  onNavigateToMetricDetail?: (metricId: string, fromGoalSearch?: boolean, goalQuery?: string) => void;
  onNavigateToMultiResourceRequest?: () => void;
}

export type ExplorerMode = 'browse' | 'goal_search' | 'resource_search';

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
  status?: 'available' | 'restricted';
  updatedAt: string;
  owner?: string;
  securityLevel?: string;
  updateFrequency?: string;
  // Match reasons (only shown in Search/Goal modes)
  matchReason?: string;
  // Detailed metadata for rich preview drawer
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

const ALL_RESOURCES: ResourceItem[] = [
  {
    id: 'res-01',
    name: '自然人',
    type: 'BUSINESS_OBJECT',
    description: '人口与公共服务业务中的个人主体，承载全生命周期身份、户籍与社保基础画像。',
    context: '人口服务',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    extraInfo: '12 数据资产 · 7 指标 · 3 API',
    updatedAt: '2026-08-10',
    owner: '人口大数据中心',
    securityLevel: 'L3（高敏感）',
    updateFrequency: '准实时 / 每日同步',
    matchReason: '核心业务对象，涵盖老龄化分析主体画像',
    fields: [
      { name: 'person_id', cnName: '自然人唯一标识', type: 'STRING', description: '全域自然人主键统一编码', isKey: true },
      { name: 'id_card_hash', cnName: '证件号哈希', type: 'STRING', description: '脱敏身份证散列标识' },
      { name: 'gender', cnName: '性别', type: 'VARCHAR(2)', description: '男 / 女' },
      { name: 'birth_date', cnName: '出生日期', type: 'DATE', description: '用于计算精确年龄' },
      { name: 'residence_type', cnName: '居住类型', type: 'VARCHAR(16)', description: '常住人口 / 暂住人口 / 流动人口' },
      { name: 'street_code', cnName: '所属街镇代码', type: 'VARCHAR(12)', description: '行政区划归属编码' }
    ],
    relatedAssets: [
      { name: '人口基本信息视图', type: 'DATA_ASSET', id: 'res-02' },
      { name: '老龄化率', type: 'METRIC', id: 'res-03' },
      { name: '人口统计查询 API', type: 'DATA_API', id: 'res-04' }
    ]
  },
  {
    id: 'res-02',
    name: '人口基本信息视图',
    type: 'DATA_ASSET',
    subType: 'VIEW',
    description: '记录自然人的出生日期、年龄、常住状态与所属行政区域等核心维度，支持老龄人口识别与多维画像统计。',
    context: '人口服务 · 自然人',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '一行代表：一个自然人主体',
    status: 'restricted',
    updatedAt: '2026-08-14',
    owner: '统计调查与人口运行处',
    securityLevel: 'L2（受限访问）',
    updateFrequency: '每日 02:00 定时增量',
    matchReason: '包含年龄字段与常住标识，为老龄人口计算基础底表',
    fields: [
      { name: 'person_id', cnName: '自然人ID', type: 'BIGINT', description: '主键', isKey: true },
      { name: 'age', cnName: '年龄', type: 'INT', description: '按当前统计时间动态计算的实足年龄' },
      { name: 'age_group', cnName: '年龄段', type: 'VARCHAR(16)', description: '0-14岁 / 15-59岁 / 60-79岁 / 80岁以上' },
      { name: 'is_permanent', cnName: '是否常住人口', type: 'TINYINT', description: '1-常住，0-非常住' },
      { name: 'street_code', cnName: '所属街镇代码', type: 'VARCHAR(12)', description: '关联行政区划代码' },
      { name: 'community_code', cnName: '所属社区代码', type: 'VARCHAR(12)', description: '村居级空间网格' }
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
    description: '60岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化发展阶段与公共服务负荷。',
    context: '人口服务 · 自然人',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '单位：% · 行政区域 × 统计期',
    status: 'available',
    updatedAt: '2026-08-12',
    owner: '发展规划与老龄办',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '月度 / 季度 / 年度',
    matchReason: '直接命中分析目标核心口径（60+常住人口比率）',
    metricFormula: '( count(distinct case when age >= 60 and is_permanent=1 then person_id end) / count(distinct case when is_permanent=1 then person_id end) ) * 100%',
    metricUnit: '% (百分比)',
    timeGranularity: '年 / 季 / 月',
    dimensions: ['行政区划（省/市/区县/街镇）', '统计期（年度/季度）', '性别分组'],
    relatedAssets: [
      { name: '60岁以上人口数', type: 'METRIC', id: 'res-06' },
      { name: '人口基本信息视图', type: 'DATA_ASSET', id: 'res-02' }
    ]
  },
  {
    id: 'res-04',
    name: '人口统计查询 API',
    type: 'DATA_API',
    description: '根据区域编码、年龄范围与统计期查询人口统计结果，支持微服务应用与低代码大屏实时在线调用。',
    context: '人口服务 · 自然人',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '输入：区域 / 年龄 / 时间',
    status: 'restricted',
    updatedAt: '2026-08-08',
    owner: '服务集成网关团队',
    securityLevel: 'L2（需申请 Token）',
    updateFrequency: '实时响应 (<50ms)',
    matchReason: '支持按街镇与年龄区间在线统计聚合',
    apiEndpoint: 'GET /api/v1/population/statistics/query',
    apiMethod: 'GET',
    apiParams: [
      { name: 'region_code', type: 'string', required: true, desc: '行政区划代码（如 310104001）' },
      { name: 'min_age', type: 'integer', required: false, desc: '最小年龄（默认 0）' },
      { name: 'max_age', type: 'integer', required: false, desc: '最大年龄（可为空）' },
      { name: 'stat_period', type: 'string', required: true, desc: '统计周期（格式 YYYY-MM）' }
    ],
    relatedAssets: [
      { name: '自然人', type: 'BUSINESS_OBJECT', id: 'res-01' },
      { name: '人口基本信息视图', type: 'DATA_ASSET', id: 'res-02' }
    ]
  },
  {
    id: 'res-05',
    name: '行政区划基础数据',
    type: 'DATA_ASSET',
    description: '提供市、区、街镇、社区等标准行政区划编码、名称与层级划分维度，为全域数据统计提供空间骨架。',
    context: '行政区划',
    domain: 'public',
    domainName: '公共服务',
    object: 'region',
    objectName: '行政区域',
    consumerFact: '一行代表：一个行政区划单元',
    status: 'available',
    updatedAt: '2026-08-01',
    owner: '基础地理与民政信息科',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '半年 / 依据民政调整',
    matchReason: '提供标准街镇代码、名称与层级划分维度',
    fields: [
      { name: 'region_code', cnName: '区划代码', type: 'VARCHAR(12)', description: '国标行政区划编码', isKey: true },
      { name: 'region_name', cnName: '区划全称', type: 'VARCHAR(64)', description: '街道/镇行政名称' },
      { name: 'parent_code', cnName: '上级区划代码', type: 'VARCHAR(12)', description: '归属区县代码' },
      { name: 'level', cnName: '行政层级', type: 'TINYINT', description: '1-市级, 2-区县, 3-街镇, 4-村居' },
      { name: 'area_sqkm', cnName: '辖区面积(km²)', type: 'DECIMAL(8,2)', description: '土地管辖面积' }
    ]
  },
  {
    id: 'res-06',
    name: '60岁以上人口数',
    type: 'METRIC',
    description: '指定区域和统计期内 60 周岁及以上常住人口总数，作为老龄化率计算的分子及养老保障供给测算基础。',
    context: '人口服务 · 自然人',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '单位：人 · 行政区域 × 统计期',
    status: 'available',
    updatedAt: '2026-08-11',
    owner: '发展规划与老龄办',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '月度 / 季度 / 年度',
    matchReason: '老龄化分子口径，支持下钻各街镇绝对数值',
    metricFormula: 'count(distinct case when age >= 60 and is_permanent=1 then person_id end)',
    metricUnit: '人',
    timeGranularity: '年 / 季 / 月',
    dimensions: ['行政区划（街镇/村居）', '年龄区间（60-69/70-79/80+）', '性别']
  },
  {
    id: 'res-07',
    name: '常住人口年度统计表',
    type: 'DATA_ASSET',
    description: '汇总各行政区划年度常住人口、户籍人口及机械变动数据，用于宏观趋势回溯。',
    context: '人口服务 · 自然人',
    domain: 'population',
    domainName: '人口服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '一行代表：一个年度区域统计记录',
    status: 'available',
    updatedAt: '2026-08-05',
    owner: '统计局人口处',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '年度'
  },
  {
    id: 'res-08',
    name: '养老服务机构名录',
    type: 'DATA_ASSET',
    description: '包含机构名称、所在街镇、核定床位数、已入住人数、评定等级与运营状态。',
    context: '养老服务 · 养老机构',
    domain: 'elderly',
    domainName: '养老服务',
    object: 'org',
    objectName: '养老机构',
    consumerFact: '一行代表：一家持证养老服务机构',
    status: 'available',
    updatedAt: '2026-08-02',
    owner: '民政养老服务发展处',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '月度更新'
  },
  {
    id: 'res-09',
    name: '高龄津贴发放明细',
    type: 'DATA_ASSET',
    description: '80周岁及以上老年人高龄津贴月度审批、资金到账与发放流水记录。',
    context: '养老服务 · 自然人',
    domain: 'elderly',
    domainName: '养老服务',
    object: 'person',
    objectName: '自然人',
    consumerFact: '一行代表：一笔高龄津贴发放记录',
    status: 'restricted',
    updatedAt: '2026-08-13',
    owner: '社会福利救助科',
    securityLevel: 'L2（受限访问）',
    updateFrequency: '每月 10 日生成流水'
  },
  {
    id: 'res-10',
    name: '网格化社区服务工单',
    type: 'DATA_ASSET',
    description: '社区网格员采集并流转的居民养老助餐、巡访救助与基层治理诉求。',
    context: '公共服务 · 服务工单',
    domain: 'public',
    domainName: '公共服务',
    object: 'ticket',
    objectName: '服务工单',
    consumerFact: '一行代表：一张社区网格治理诉求单',
    status: 'available',
    updatedAt: '2026-08-09',
    owner: '城运与网格化治理中心',
    securityLevel: 'L1（公开可用）',
    updateFrequency: '实时更新'
  }
];

export const ResourceExplorerWorkspace: React.FC<ResourceExplorerWorkspaceProps> = ({
  addToast,
  initialQuery = '',
  onNavigateToDiscovery,
  onNavigateToMyRequests,
  onNavigateToMetrics,
  onNavigateToBusinessObject,
  onNavigateToDataAssets,
  onNavigateToDataAssetDetail,
  onNavigateToMetricDetail,
  onNavigateToMultiResourceRequest,
}) => {
  // Navigation inside Marketplace Sidebar
  const [activeSideNav, setActiveSideNav] = useState<'discovery' | 'resources' | 'my_requests'>('resources');

  // Search Query & Mode State
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState<string>(initialQuery);

  // Type Tabs: ALL, DATA_ASSET, METRIC, DATA_API, BUSINESS_OBJECT
  const [activeTypeTab, setActiveTypeTab] = useState<'ALL' | 'DATA_ASSET' | 'METRIC' | 'DATA_API' | 'BUSINESS_OBJECT'>('ALL');

  // Filter Bar state
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [objectFilter, setObjectFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'latest' | 'name'>('default');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Active Selected Item for Right Preview Drawer
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<ResourceItem | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'schema' | 'lineage' | 'api_doc'>('overview');

  // Single Resource Access Request Drawer State
  const [singleResourceRequestTarget, setSingleResourceRequestTarget] = useState<ResourceItem | null>(null);

  // Solution Modal state
  const [isSolutionModalOpen, setIsSolutionModalOpen] = useState<boolean>(false);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState<boolean>(false);
  const [refineCondition, setRefineCondition] = useState<string>('按最新2025年度统计期，剔除集体户');

  // Determine current mode: In Browse Mode, submittedQuery is empty.
  const currentMode: ExplorerMode = useMemo(() => {
    const q = submittedQuery.trim();
    if (!q) return 'browse';
    if (
      q.includes('分析') ||
      q.includes('情况') ||
      q.includes('老龄化') ||
      q.includes('对比') ||
      q.includes('如何') ||
      q.includes('预测') ||
      q.includes('分布')
    ) {
      return 'goal_search';
    }
    return 'resource_search';
  }, [submittedQuery]);

  // Execute Search
  const handleExecuteSearch = (targetQuery: string) => {
    const q = targetQuery.trim();
    setSearchQuery(q);
    setSubmittedQuery(q);
    setCurrentPage(1);

    if (!q) {
      addToast?.('info', '浏览模式 (Browse Mode)', '已清空搜索，回到全量资源目录浏览状态');
    } else if (
      q.includes('分析') ||
      q.includes('情况') ||
      q.includes('老龄化') ||
      q.includes('对比') ||
      q.includes('如何') ||
      q.includes('预测') ||
      q.includes('分布')
    ) {
      addToast?.('success', '目标检索 (Goal Search Mode)', `已识别业务目标「${q}」，生成推荐数据方案`);
    } else {
      addToast?.('info', '精准检索 (Resource Search Mode)', `已精确检索「${q}」相关的资源与字段`);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleExecuteSearch(searchQuery);
  };

  const handleClearToBrowse = () => {
    setSearchQuery('');
    setSubmittedQuery('');
    setCurrentPage(1);
    addToast?.('info', '返回全量浏览', '已切换回 Browse Mode 全量资源空间');
  };

  const handleResetFilters = () => {
    setDomainFilter('all');
    setObjectFilter('all');
    setAvailabilityFilter('all');
    setSourceFilter('all');
    setSortBy('default');
    addToast?.('info', '重置筛选', '已将所有筛选器恢复为默认全量');
  };

  // Select Item for Preview Drawer
  const handleOpenPreview = (item: ResourceItem) => {
    setSelectedPreviewItem(item);
    setActiveDrawerTab('overview');
  };

  // Filter and sort items
  const filteredResources = useMemo(() => {
    return ALL_RESOURCES.filter((item) => {
      // Type Tab filter
      if (activeTypeTab !== 'ALL' && item.type !== activeTypeTab) {
        return false;
      }
      // Domain filter
      if (domainFilter !== 'all' && item.domain !== domainFilter) {
        return false;
      }
      // Object filter
      if (objectFilter !== 'all' && item.object !== objectFilter) {
        return false;
      }
      // Availability filter
      if (availabilityFilter !== 'all') {
        if (availabilityFilter === 'available' && item.status !== 'available') return false;
        if (availabilityFilter === 'restricted' && item.status !== 'restricted') return false;
      }
      // Query filter (if in search mode)
      if (submittedQuery.trim()) {
        const q = submittedQuery.toLowerCase();
        // If in Goal Search mode, prioritize relevance
        if (currentMode === 'goal_search') {
          // Return the top relevant items for aging / population / region
          return ['res-01', 'res-02', 'res-03', 'res-04', 'res-05', 'res-06'].includes(item.id);
        } else {
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchContext = item.context.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchContext) return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'latest') {
        return b.updatedAt.localeCompare(a.updatedAt);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh');
      }
      return 0;
    });
  }, [activeTypeTab, domainFilter, objectFilter, availabilityFilter, submittedQuery, sortBy, currentMode]);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] font-sans antialiased relative">
      
      {/* ========================================================= */}
      {/* 1. MARKETPLACE SIDEBAR (210–220px)                         */}
      {/* ========================================================= */}
      <aside className="w-[210px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none z-10">
        {/* Sidebar Header Title */}
        <div className="px-5 py-4 border-b border-[#E6EAF0]">
          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
            数据服务超市
          </h2>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="p-3 space-y-1 text-xs">
          {/* 1. 发现 */}
          <button
            onClick={() => {
              if (onNavigateToDiscovery) {
                onNavigateToDiscovery();
              } else {
                setActiveSideNav('discovery');
              }
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'discovery'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Compass className="w-4 h-4 text-[#64748B]" />
            <span>发现</span>
          </button>

          {/* 2. 资源 (当前高亮) */}
          <button
            onClick={() => {
              setActiveSideNav('resources');
              handleClearToBrowse();
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'resources'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>资源</span>
          </button>

          {/* 3. 我的申请 */}
          <button
            onClick={() => {
              if (onNavigateToMyRequests) {
                onNavigateToMyRequests();
              } else {
                setActiveSideNav('my_requests');
                addToast?.('info', '我的申请', '查看已申请的数据访问权限与 API 调用授权记录');
              }
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'my_requests'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#64748B]" />
            <span>我的申请</span>
          </button>
        </nav>

        {/* Bottom Fixed Lightweight AI Partner Card */}
        <div className="mt-auto p-3 border-t border-[#EEF2F6] bg-[#FAFCFF]">
          <div className="p-2.5 rounded-md border border-[#E0E7FF] bg-white shadow-2xs">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-6 h-6 rounded-md bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-[#667085] leading-tight">AI Partner</div>
                <div className="text-xs font-bold text-[#172033] leading-tight truncate">
                  Xino｜犀诺
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE (Single Wide Area + Adaptive Right Space)*/}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F7F9FC] transition-all">
        
        {/* Page Top Header (Compact & Professional) */}
        <div className="bg-white border-b border-[#E6EAF0] px-8 pt-4 pb-4 shrink-0">
          <div className="max-w-[1050px] flex items-center justify-between">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-xs text-[#667085] mb-1.5 font-normal">
                <span
                  onClick={onNavigateToDiscovery}
                  className="hover:text-[#2563EB] cursor-pointer"
                >
                  数据服务超市
                </span>
                <span className="text-[#CBD5E1]">/</span>
                <span
                  onClick={handleClearToBrowse}
                  className={`cursor-pointer ${currentMode === 'browse' ? 'font-semibold text-[#172033]' : 'hover:text-[#2563EB]'}`}
                >
                  资源
                </span>
                {currentMode !== 'browse' && (
                  <>
                    <span className="text-[#CBD5E1]">/</span>
                    <span className="font-semibold text-[#2563EB] truncate max-w-[240px]">
                      {currentMode === 'goal_search' ? `目标: ${submittedQuery}` : `检索: ${submittedQuery}`}
                    </span>
                  </>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                  {currentMode === 'browse' ? '资源浏览' : currentMode === 'goal_search' ? '目标检索结果' : '资源检索结果'}
                </h1>
                <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                  {currentMode === 'browse'
                    ? '浏览企业已发布的数据资产、指标、数据 API 与业务对象。点击任意资源行可在右侧快速预览字段与口径。'
                    : currentMode === 'goal_search'
                    ? '根据业务目标智能匹配数据方案与核心关联资源。'
                    : `精确匹配与「${submittedQuery}」相关的资源与字段。`}
                </p>
              </div>
            </div>

            {/* Quick Mode Switcher for seamless review / testing */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg p-1 text-xs">
              <span className="text-[11px] text-[#667085] px-2 font-medium">模式打通:</span>
              <button
                onClick={() => handleClearToBrowse()}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  currentMode === 'browse'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                全量浏览 (Browse)
              </button>
              <button
                onClick={() => handleExecuteSearch('分析各街镇老龄化情况')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  currentMode === 'goal_search'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                目标检索 (Goal)
              </button>
              <button
                onClick={() => handleExecuteSearch('人口基本信息视图')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  currentMode === 'resource_search'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                精确检索 (Resource)
              </button>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 px-8 py-6 space-y-4 max-w-[1050px] w-full">

          {/* ======================================================= */}
          {/* 主搜索框 & 控制栏                                         */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-md p-4 shadow-2xs space-y-3.5">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-[#94A3B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索资源名称、业务对象、业务含义或输入业务目标（如：分析各街镇老龄化情况）…"
                  className="w-full pl-10 pr-32 py-2 text-xs bg-[#F8FAFC] border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#172033] placeholder-[#94A3B8] transition-all font-medium"
                />
                
                {/* Clear button if has query */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      if (submittedQuery) handleClearToBrowse();
                    }}
                    className="absolute right-24 p-1 text-[#94A3B8] hover:text-[#475569] cursor-pointer"
                    title="清空搜索"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  className="absolute right-2 px-3 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <span>搜索</span>
                </button>
              </div>
            </form>

            {/* Quick Inspiration Chips in Browse Mode */}
            {currentMode === 'browse' && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                <span className="text-[11px] text-[#667085] flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-[#4F46E5]" />
                  <span>快捷目标探索:</span>
                </span>
                {[
                  '分析各街镇老龄化情况',
                  '查询养老机构分布与床位率',
                  '低保人员救助金发放分析',
                  '人口基本信息视图'
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleExecuteSearch(chip)}
                    className="px-2 py-0.5 bg-[#F1F5F9] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:border-[#BFDBFE] border border-[#E2E8F0] rounded text-[11px] text-[#475569] transition-all cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Type Tabs */}
            <div className="flex items-center justify-between border-t border-[#EEF2F6] pt-3 text-xs">
              <div className="flex items-center space-x-1">
                {[
                  { key: 'ALL', label: '全部' },
                  { key: 'DATA_ASSET', label: '数据资产' },
                  { key: 'METRIC', label: '指标' },
                  { key: 'DATA_API', label: '数据 API' },
                  { key: 'BUSINESS_OBJECT', label: '业务对象' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTypeTab(tab.key as any);
                      addToast?.('info', `类型切换`, `已筛选 ${tab.label}`);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                      activeTypeTab === tab.key
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status indicator */}
              <div className="text-[11px] text-[#667085]">
                {currentMode === 'browse' ? (
                  <span>全量浏览模式 · 共 156 项正式资源 · 支持行点击预览</span>
                ) : (
                  <button
                    onClick={handleClearToBrowse}
                    className="text-[#2563EB] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>清除检索，返回浏览</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Horizontal Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-[#EEF2F6]">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* 业务域 */}
                <div className="relative">
                  <select
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="h-8 pl-2.5 pr-7 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer"
                  >
                    <option value="all">业务域：全部</option>
                    <option value="population">业务域：人口服务</option>
                    <option value="public">业务域：公共服务</option>
                    <option value="elderly">业务域：养老服务</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
                </div>

                {/* 业务对象 */}
                <div className="relative">
                  <select
                    value={objectFilter}
                    onChange={(e) => setObjectFilter(e.target.value)}
                    className="h-8 pl-2.5 pr-7 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer"
                  >
                    <option value="all">业务对象：全部</option>
                    <option value="person">业务对象：自然人</option>
                    <option value="region">业务对象：行政区域</option>
                    <option value="org">业务对象：养老机构</option>
                    <option value="ticket">业务对象：服务工单</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
                </div>

                {/* 可用状态 */}
                <div className="relative">
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="h-8 pl-2.5 pr-7 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer"
                  >
                    <option value="all">可用状态：全部</option>
                    <option value="available">可直接使用</option>
                    <option value="restricted">需申请</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
                </div>

                {/* 数据来源 */}
                <div className="relative">
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="h-8 pl-2.5 pr-7 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer"
                  >
                    <option value="all">数据来源：全部</option>
                    <option value="production">生产核心库</option>
                    <option value="dw">数据仓库集市</option>
                    <option value="api_gateway">内部 API 网关</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
                </div>

                {/* 更多筛选 */}
                <button
                  onClick={() => addToast?.('info', '更多筛选', '支持按更新频次、安全等级与标签多维过滤')}
                  className="h-8 px-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E6EAF0] rounded-md text-xs text-[#475569] flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <SlidersHorizontal className="w-3 h-3 text-[#64748B]" />
                  <span>更多筛选</span>
                  <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
                </button>

                {(domainFilter !== 'all' || objectFilter !== 'all' || availabilityFilter !== 'all' || sourceFilter !== 'all') && (
                  <button
                    onClick={handleResetFilters}
                    className="h-8 px-2 text-xs text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>重置</span>
                  </button>
                )}
              </div>

              {/* 排序 */}
              <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
                <span>排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-8 pl-2 pr-6 bg-white border border-[#E6EAF0] rounded-md text-xs text-[#172033] font-medium focus:outline-none focus:border-[#2563EB] appearance-none cursor-pointer"
                >
                  <option value="default">{currentMode === 'browse' ? '默认' : '最相关'}</option>
                  <option value="latest">最近更新</option>
                  <option value="name">名称排序</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] -ml-5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* GOAL SEARCH MODE: 1. Context Strip (Xino 解析)           */}
          {/* ======================================================= */}
          {currentMode === 'goal_search' && (
            <div className="bg-[#FAFCFF] border border-[#BFDBFE] rounded-md p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] font-bold text-[11px] rounded flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Xino 解析</span>
                  </span>
                  <span className="text-xs font-semibold text-[#172033]">
                    当前分析需求
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <button
                    onClick={() => {
                      setIsRefineModalOpen(true);
                    }}
                    className="text-[#2563EB] hover:underline font-medium cursor-pointer"
                  >
                    补充条件
                  </button>
                  <span className="text-[#CBD5E1]">|</span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      handleClearToBrowse();
                    }}
                    className="text-[#64748B] hover:text-[#172033] font-medium cursor-pointer"
                  >
                    重新描述问题
                  </button>
                </div>
              </div>

              {/* 4 组语义分解 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-[#E0E7FF] text-xs">
                <div className="bg-white p-2 rounded border border-[#EEF2F6]">
                  <div className="text-[10px] text-[#667085]">分析目标</div>
                  <div className="font-bold text-[#172033] mt-0.5 truncate">
                    街镇人口老龄化分析
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-[#EEF2F6]">
                  <div className="text-[10px] text-[#667085]">业务对象</div>
                  <div className="font-bold text-[#172033] mt-0.5 truncate">
                    自然人 · 行政区域
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-[#EEF2F6]">
                  <div className="text-[10px] text-[#667085]">核心口径</div>
                  <div className="font-bold text-[#2563EB] mt-0.5 truncate">
                    老龄化率 (60岁及以上)
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-[#EEF2F6]">
                  <div className="text-[10px] text-[#667085]">分析范围</div>
                  <div className="font-bold text-[#172033] mt-0.5 truncate">
                    街镇 · 按统计期对比
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* GOAL SEARCH MODE: 2. 推荐数据方案 (页面主视觉)            */}
          {/* ======================================================= */}
          {currentMode === 'goal_search' && (
            <div className="bg-white border-2 border-[#2563EB]/40 rounded-md p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEF2F6] pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-[#2563EB] text-white font-bold text-[10px] rounded tracking-wide">
                      RECOMMENDED SOLUTION
                    </span>
                    <h3 className="text-sm font-bold text-[#172033]">
                      街镇老龄化分析基础数据方案
                    </h3>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    聚合街镇层级人口、老龄化率与空间区划维度，一站式满足全域老龄化态势评估。
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      if (onNavigateToMultiResourceRequest) {
                        onNavigateToMultiResourceRequest();
                      } else {
                        setIsSolutionModalOpen(true);
                      }
                    }}
                    className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-xs font-bold rounded transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>申请所需资源 (2项)</span>
                  </button>
                  <button
                    onClick={() => setIsSolutionModalOpen(true)}
                    className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded transition-colors cursor-pointer"
                  >
                    查看方案
                  </button>
                  <button
                    onClick={() => {
                      addToast?.('success', '启动分析', '已将方案内「老龄化率」「人口视图」「行政区划」载入分析工作区');
                    }}
                    className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>用于分析</span>
                  </button>
                </div>
              </div>

              {/* Solution Components: 3 Items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Item 1: Metric */}
                <div 
                  onClick={() => handleOpenPreview(ALL_RESOURCES.find(r => r.id === 'res-03')!)}
                  className="p-3 rounded-md bg-[#F8FAFC] hover:bg-[#EFF6FF]/60 hover:border-[#BFDBFE] border border-[#E2E8F0] space-y-1.5 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] rounded">
                      METRIC · 核心口径
                    </span>
                    <span className="inline-flex items-center space-x-1 text-[10px] text-[#16A36A] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                      <span>可直接使用</span>
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
                    <span>老龄化率</span>
                    <Eye className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                  <div className="text-[11px] text-[#64748B] line-clamp-2">
                    60岁及以上常住人口占全部常住人口的比例。
                  </div>
                </div>

                {/* Item 2: Data Asset View */}
                <div 
                  onClick={() => handleOpenPreview(ALL_RESOURCES.find(r => r.id === 'res-02')!)}
                  className="p-3 rounded-md bg-[#F8FAFC] hover:bg-[#EFF6FF]/60 hover:border-[#BFDBFE] border border-[#E2E8F0] space-y-1.5 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded">
                      DATA ASSET · 核心数据
                    </span>
                    <span className="inline-flex items-center space-x-1 text-[10px] text-[#D97706] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                      <span>需申请</span>
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
                    <span>人口基本信息视图</span>
                    <Eye className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                  <div className="text-[11px] text-[#64748B] line-clamp-2">
                    记录自然人的出生日期、年龄、常住状态与所属行政区域。
                  </div>
                </div>

                {/* Item 3: Admin Region */}
                <div 
                  onClick={() => handleOpenPreview(ALL_RESOURCES.find(r => r.id === 'res-05')!)}
                  className="p-3 rounded-md bg-[#F8FAFC] hover:bg-[#EFF6FF]/60 hover:border-[#BFDBFE] border border-[#E2E8F0] space-y-1.5 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded">
                      DATA ASSET · 分析维度
                    </span>
                    <span className="inline-flex items-center space-x-1 text-[10px] text-[#16A36A] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                      <span>可直接使用</span>
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
                    <span>行政区划基础数据</span>
                    <Eye className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                  <div className="text-[11px] text-[#64748B] line-clamp-2">
                    提供街镇、社区等标准行政区划代码与层级信息。
                  </div>
                </div>
              </div>

              {/* Bottom Matching Reasons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EEF2F6] text-xs">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#475569]">
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                    <span>覆盖老龄人口识别所需年龄语义</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                    <span>使用正式老龄化率口径</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                    <span>支持街镇粒度分析</span>
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] font-medium">
                  2 项可直接使用 · 1 项需申请权限
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* Result Summary (根据当前模式自适应文案)                     */}
          {/* ======================================================= */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline space-x-2">
              <h2 className="text-sm font-bold text-[#172033]">
                {currentMode === 'browse' ? '全部资源' : currentMode === 'goal_search' ? '相关资源列表' : '命中资源'}
              </h2>
              <span className="text-xs text-[#667085] font-normal">
                {currentMode === 'browse' ? '共 156 项' : `共 ${filteredResources.length} 项符合条件`}
              </span>
            </div>

            <div className="text-xs text-[#98A2B3] flex items-center space-x-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span>点击任意条目即可在右侧预览元数据与口径</span>
            </div>
          </div>

          {/* ======================================================= */}
          {/* Compact Rich Resource Rows (76–88px, Click to Open Drawer) */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-md divide-y divide-[#EEF2F6] shadow-2xs overflow-hidden">
            {filteredResources.map((item) => {
              const isSelected = selectedPreviewItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenPreview(item)}
                  className={`p-4 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer group select-none ${
                    isSelected
                      ? 'bg-[#EFF6FF]/70 border-l-4 border-l-[#2563EB]'
                      : 'hover:bg-[#F8FAFC] border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Left info area */}
                  <div className="space-y-1 max-w-[740px]">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Icon */}
                      {item.type === 'BUSINESS_OBJECT' && (
                        <div className="w-5 h-5 rounded bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5]">
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                      {item.type === 'DATA_ASSET' && (
                        <div className="w-5 h-5 rounded bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB]">
                          <Table className="w-3 h-3" />
                        </div>
                      )}
                      {item.type === 'METRIC' && (
                        <div className="w-5 h-5 rounded bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                          <BarChart3 className="w-3 h-3" />
                        </div>
                      )}
                      {item.type === 'DATA_API' && (
                        <div className="w-5 h-5 rounded bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED]">
                          <Globe className="w-3 h-3" />
                        </div>
                      )}

                      {/* Name */}
                      <h3
                        className={`text-xs font-bold transition-colors ${
                          isSelected ? 'text-[#2563EB]' : 'text-[#172033] group-hover:text-[#2563EB]'
                        }`}
                      >
                        {item.name}
                      </h3>

                      {/* Type Badge */}
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded font-mono">
                        {item.type} {item.subType ? `· ${item.subType}` : ''}
                      </span>

                      {/* Context */}
                      <span className="text-xs text-[#667085]">
                        {item.context}
                      </span>

                      {/* Extra info for Business Object */}
                      {item.extraInfo && (
                        <>
                          <span className="text-xs text-[#98A2B3]">·</span>
                          <span className="text-xs text-[#64748B]">
                            {item.extraInfo}
                          </span>
                        </>
                      )}

                      {/* Consumer Fact */}
                      {item.consumerFact && (
                        <>
                          <span className="text-xs text-[#98A2B3]">·</span>
                          <span className="text-xs text-[#64748B] bg-[#F8FAFC] px-1.5 py-0.2 rounded border border-[#EEF2F6]">
                            {item.consumerFact}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#475569] leading-relaxed">
                      {item.description}
                    </p>

                    {/* In Goal Search mode: show match reasons */}
                    {currentMode !== 'browse' && item.matchReason && (
                      <div className="text-[11px] text-[#2563EB] bg-[#EFF6FF]/60 px-2 py-0.5 rounded flex items-center space-x-1 w-fit">
                        <Check className="w-3 h-3 text-[#2563EB]" />
                        <span>{item.matchReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions & Status */}
                  <div 
                    className="flex items-center space-x-3 shrink-0 pt-1 lg:pt-0"
                    onClick={(e) => e.stopPropagation()} // Stop bubbling for specific buttons
                  >
                    {/* Status badge if applicable */}
                    {item.status === 'available' && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0] rounded text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                        <span>可直接使用</span>
                      </span>
                    )}
                    {item.status === 'restricted' && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                        <span>需申请</span>
                      </span>
                    )}

                    {/* Quick Preview trigger button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(item)}
                      className={`p-1.5 rounded transition-colors text-xs flex items-center space-x-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#2563EB] text-white font-bold'
                          : 'bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#64748B] hover:text-[#2563EB] border border-[#E2E8F0]'
                      }`}
                      title="在右侧打开快速预览"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[11px]">预览</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ======================================================= */}
          {/* 分页 (Standard Enterprise Pagination)                     */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-md px-4 py-3 flex items-center justify-between text-xs text-[#64748B] shadow-2xs">
            {/* Left: 每页条数 */}
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

            {/* Middle: 1 2 3 4 … 8 */}
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
              <span className="px-1 text-[#94A3B8]">…</span>
              <button
                onClick={() => {
                  setCurrentPage(8);
                  addToast?.('info', '第 8 页', '已载入第 8 页资源');
                }}
                className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  currentPage === 8
                    ? 'bg-[#2563EB] text-white font-bold'
                    : 'hover:bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                8
              </button>
            </div>

            {/* Right: 下一页 */}
            <div>
              <button
                onClick={() => {
                  setCurrentPage((prev) => Math.min(prev + 1, 8));
                  addToast?.('info', '下一页', `已翻至下一页`);
                }}
                className="px-3 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E6EAF0] rounded text-xs text-[#334155] font-medium cursor-pointer transition-colors"
              >
                下一页
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. OPTIMIZED RIGHT PREVIEW DRAWER (快速预览右侧栏)        */}
      {/* ========================================================= */}
      {selectedPreviewItem && (
        <aside className="w-[460px] bg-white border-l border-[#E6EAF0] shadow-2xl flex flex-col shrink-0 z-30 animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E6EAF0] bg-[#FAFCFF] flex items-start justify-between">
            <div className="space-y-1 min-w-0 pr-3">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] font-mono border border-[#BFDBFE]">
                  {selectedPreviewItem.type} {selectedPreviewItem.subType ? `· ${selectedPreviewItem.subType}` : ''}
                </span>
                {selectedPreviewItem.status === 'available' ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#16A36A] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#A7F3D0]">
                    <Unlock className="w-2.5 h-2.5" />
                    <span>可直接使用</span>
                  </span>
                ) : selectedPreviewItem.status === 'restricted' ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                    <Lock className="w-2.5 h-2.5" />
                    <span>需申请使用</span>
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

          {/* Drawer Navigation Tabs */}
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
            
            {/* Schema / Formula Tab */}
            {selectedPreviewItem.type === 'METRIC' ? (
              <button
                onClick={() => setActiveDrawerTab('schema')}
                className={`py-2.5 mr-4 font-semibold transition-colors cursor-pointer border-b-2 ${
                  activeDrawerTab === 'schema'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#64748B] hover:text-[#172033]'
                }`}
              >
                指标口径与公式
              </button>
            ) : selectedPreviewItem.type === 'DATA_API' ? (
              <button
                onClick={() => setActiveDrawerTab('api_doc')}
                className={`py-2.5 mr-4 font-semibold transition-colors cursor-pointer border-b-2 ${
                  activeDrawerTab === 'api_doc'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#64748B] hover:text-[#172033]'
                }`}
              >
                接口参数文档
              </button>
            ) : (
              <button
                onClick={() => setActiveDrawerTab('schema')}
                className={`py-2.5 mr-4 font-semibold transition-colors cursor-pointer border-b-2 ${
                  activeDrawerTab === 'schema'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#64748B] hover:text-[#172033]'
                }`}
              >
                字段结构 ({selectedPreviewItem.fields?.length || 0})
              </button>
            )}

            <button
              onClick={() => setActiveDrawerTab('lineage')}
              className={`py-2.5 font-semibold transition-colors cursor-pointer border-b-2 ${
                activeDrawerTab === 'lineage'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              关联与血缘
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#334155]">
            
            {/* TAB 1: OVERVIEW */}
            {activeDrawerTab === 'overview' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Description */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#64748B] flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>业务含义与定义</span>
                  </div>
                  <div className="bg-[#F8FAFC] p-3 rounded-md border border-[#E6EAF0] text-xs text-[#172033] leading-relaxed">
                    {selectedPreviewItem.description}
                  </div>
                </div>

                {/* Consumer Fact */}
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

                {/* Match Reason (if available) */}
                {selectedPreviewItem.matchReason && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-[#64748B] flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span>智能匹配依据</span>
                    </div>
                    <div className="bg-[#EFF6FF] p-3 rounded-md border border-[#C7D2FE] text-xs text-[#3730A3]">
                      {selectedPreviewItem.matchReason}
                    </div>
                  </div>
                )}

                {/* Meta Attributes Grid */}
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
                    <div className="bg-white p-2.5 rounded border border-[#E6EAF0]">
                      <div className="text-[#94A3B8]">数据责任方</div>
                      <div className="font-bold text-[#172033] mt-0.5">
                        {selectedPreviewItem.owner || '数据治理委员会'}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-[#E6EAF0]">
                      <div className="text-[#94A3B8]">更新周期</div>
                      <div className="font-bold text-[#172033] mt-0.5">
                        {selectedPreviewItem.updateFrequency || '每日更新'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Callout */}
                <div className="p-3 rounded-md border text-xs flex items-start space-x-2.5 bg-[#F8FAFC] border-[#E2E8F0]">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#172033]">
                      权限使用说明
                    </div>
                    <div className="text-[11px] text-[#64748B] leading-relaxed">
                      {selectedPreviewItem.status === 'available'
                        ? '当前已为您开通此资源的读取与自助消费权限，可直接加入分析视图。'
                        : '此资源涉及敏感信息或合规管控，点击下方「申请使用」可一键发起快速审批流程。'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SCHEMA / METRIC FORMULA */}
            {activeDrawerTab === 'schema' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {selectedPreviewItem.type === 'METRIC' ? (
                  /* Metric Specific Formula View */
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-[#64748B]">指标计算公式 (SQL / Logic)</div>
                      <div className="bg-[#0F172A] text-[#38BDF8] font-mono text-[11px] p-3 rounded-md overflow-x-auto leading-relaxed border border-[#334155]">
                        {selectedPreviewItem.metricFormula || 'SUM(target_amount) / COUNT(distinct user_id)'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E6EAF0]">
                        <div className="text-[#94A3B8] text-[10px]">度量单位</div>
                        <div className="font-bold text-[#172033] text-xs mt-0.5">
                          {selectedPreviewItem.metricUnit || '数值'}
                        </div>
                      </div>
                      <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E6EAF0]">
                        <div className="text-[#94A3B8] text-[10px]">支持时间粒度</div>
                        <div className="font-bold text-[#172033] text-xs mt-0.5">
                          {selectedPreviewItem.timeGranularity || '天 / 月 / 年'}
                        </div>
                      </div>
                    </div>

                    {selectedPreviewItem.dimensions && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-[#64748B]">可下钻分析维度</div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPreviewItem.dimensions.map((dim) => (
                            <span key={dim} className="px-2 py-1 bg-[#EFF6FF] text-[#2563EB] rounded text-[11px] border border-[#BFDBFE] font-medium">
                              {dim}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fields Table for Data Assets / Business Objects */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>字段列表</span>
                      <span>共 {selectedPreviewItem.fields?.length || 0} 个核心字段</span>
                    </div>

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
                          {selectedPreviewItem.fields && selectedPreviewItem.fields.length > 0 ? (
                            selectedPreviewItem.fields.map((field) => (
                              <tr key={field.name} className="hover:bg-[#F8FAFC]">
                                <td className="py-2 px-3">
                                  <div className="font-mono font-bold text-[#172033] flex items-center space-x-1">
                                    <span>{field.name}</span>
                                    {field.isKey && (
                                      <span className="px-1 py-0.2 bg-[#FEF3C7] text-[#B45309] text-[9px] rounded font-sans">
                                        PK
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#64748B]">{field.cnName}</div>
                                </td>
                                <td className="py-2 px-3 font-mono text-[#2563EB]">{field.type}</td>
                                <td className="py-2 px-3 text-[#475569]">{field.description}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-6 text-center text-[#94A3B8]">
                                暂无公开字段字典，请联系管理员
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: API DOC */}
            {activeDrawerTab === 'api_doc' && selectedPreviewItem.type === 'DATA_API' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-[#64748B]">请求地址 (Endpoint)</div>
                  <div className="flex items-center space-x-2 bg-[#F8FAFC] p-2.5 rounded border border-[#E6EAF0]">
                    <span className="px-1.5 py-0.5 bg-[#2563EB] text-white font-mono text-[10px] font-bold rounded">
                      {selectedPreviewItem.apiMethod || 'GET'}
                    </span>
                    <span className="font-mono text-xs text-[#172033] font-semibold truncate">
                      {selectedPreviewItem.apiEndpoint || '/api/v1/resource/query'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#64748B]">输入参数列表</div>
                  <div className="border border-[#E6EAF0] rounded-md overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E6EAF0] text-[11px]">
                        <tr>
                          <th className="py-2 px-3 font-semibold">参数名</th>
                          <th className="py-2 px-3 font-semibold">类型 / 必填</th>
                          <th className="py-2 px-3 font-semibold">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF2F6] text-[11px]">
                        {selectedPreviewItem.apiParams?.map((p) => (
                          <tr key={p.name} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-3 font-mono font-bold text-[#172033]">{p.name}</td>
                            <td className="py-2 px-3">
                              <span className="font-mono text-[#2563EB]">{p.type}</span>
                              {p.required && (
                                <span className="ml-1 text-[10px] text-[#DC2626] font-bold">必填</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[#475569]">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LINEAGE & RELATIONS */}
            {activeDrawerTab === 'lineage' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="text-[11px] font-bold text-[#64748B]">关联业务与数据资产</div>
                
                {selectedPreviewItem.relatedAssets && selectedPreviewItem.relatedAssets.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPreviewItem.relatedAssets.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => {
                          const target = ALL_RESOURCES.find(r => r.id === rel.id);
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

                <div className="p-3 bg-[#FAFCFF] border border-[#BFDBFE] rounded text-xs space-y-1">
                  <div className="font-bold text-[#2563EB] flex items-center space-x-1">
                    <Network className="w-3.5 h-3.5" />
                    <span>血缘溯源提示</span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    本资源已完成全链路元数据血缘注册，变更影响面评级为「低」，上游生产库具备保障 SLA。
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between">
            <div className="text-[11px] text-[#64748B]">
              ID: <span className="font-mono">{selectedPreviewItem.id}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedPreviewItem(null)}
                className="px-3 py-1.5 bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded hover:bg-[#F1F5F9] cursor-pointer"
              >
                关闭
              </button>

              {selectedPreviewItem.type === 'BUSINESS_OBJECT' && (
                <button
                  onClick={() => {
                    onNavigateToBusinessObject?.();
                    addToast?.('info', '业务对象', `已进入「${selectedPreviewItem.name}」模型主页`);
                  }}
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer shadow-2xs"
                >
                  查看完整业务对象
                </button>
              )}

              {selectedPreviewItem.type === 'METRIC' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (onNavigateToMetricDetail) {
                        onNavigateToMetricDetail(
                          selectedPreviewItem.id,
                          currentMode === 'goal_search',
                          searchQuery || '分析各街镇老龄化情况'
                        );
                      } else {
                        addToast?.('info', '指标详情', `已进入「${selectedPreviewItem.name}」指标详情视图`);
                      }
                    }}
                    className="px-3 py-1.5 bg-white border border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] text-xs font-bold rounded cursor-pointer shadow-2xs"
                  >
                    查看完整指标详情
                  </button>
                  <button
                    onClick={() => {
                      addToast?.('success', '载入分析', `已将「${selectedPreviewItem.name}」指标加入分析沙箱`);
                    }}
                    className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer shadow-2xs flex items-center space-x-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>用于分析</span>
                  </button>
                </div>
              )}

              {selectedPreviewItem.type === 'DATA_ASSET' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (onNavigateToDataAssetDetail) {
                        onNavigateToDataAssetDetail(
                          selectedPreviewItem.id,
                          currentMode === 'goal_search',
                          searchQuery || '分析各街镇老龄化情况'
                        );
                      } else {
                        addToast?.('info', '数据资产详情', `已进入「${selectedPreviewItem.name}」资产详情视图`);
                      }
                    }}
                    className="px-3 py-1.5 bg-white border border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] text-xs font-bold rounded cursor-pointer shadow-2xs"
                  >
                    查看完整资产详情
                  </button>
                  {selectedPreviewItem.status === 'restricted' ? (
                    <button
                      onClick={() => {
                        setSingleResourceRequestTarget(selectedPreviewItem);
                        addToast?.('info', '申请使用', `已打开「${selectedPreviewItem.name}」访问需求确认抽屉`);
                      }}
                      className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer shadow-2xs"
                    >
                      发起申请使用
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (onNavigateToDataAssetDetail) {
                          onNavigateToDataAssetDetail(
                            selectedPreviewItem.id,
                            currentMode === 'goal_search',
                            searchQuery || '分析各街镇老龄化情况'
                          );
                        } else {
                          addToast?.('success', '进入资产分析', `已载入「${selectedPreviewItem.name}」数据集`);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer shadow-2xs flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>进入资产分析</span>
                    </button>
                  )}
                </div>
              )}

              {selectedPreviewItem.type === 'DATA_API' && (
                <button
                  onClick={() => {
                    addToast?.('success', 'API 申请', `已发起「${selectedPreviewItem.name}」调用密钥申请`);
                  }}
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer shadow-2xs"
                >
                  申请调用凭据
                </button>
              )}
            </div>
          </div>

        </aside>
      )}

      {/* ========================================================= */}
      {/* 4. SOLUTION MODAL (方案详情弹窗)                          */}
      {/* ========================================================= */}
      {isSolutionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E6EAF0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-[#2563EB] text-white text-[10px] font-bold rounded">
                  DATA SOLUTION
                </span>
                <h3 className="text-sm font-bold text-[#172033]">
                  街镇老龄化分析基础数据方案详情
                </h3>
              </div>
              <button
                onClick={() => setIsSolutionModalOpen(false)}
                className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-[#334155] max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="font-bold text-[#172033] mb-1">方案设计目标</h4>
                <p className="text-[#64748B] leading-relaxed">
                  针对「分析各街镇老龄化情况」，自动聚合计算 60 周岁及以上常住老龄人口指标、自然人底表及街镇行政空间编码，构建全链路可回溯分析数据集。
                </p>
              </div>

              <div className="border-t border-[#EEF2F6] pt-3">
                <h4 className="font-bold text-[#172033] mb-2">方案包含资源清单 (3 项)</h4>
                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E6EAF0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#172033]">1. 老龄化率 (METRIC)</div>
                      <div className="text-[11px] text-[#64748B]">核心计算口径 · 60岁及以上常住人口 / 全部常住人口</div>
                    </div>
                    <span className="text-[#16A36A] font-semibold text-[11px]">🟢 可直接使用</span>
                  </div>

                  <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E6EAF0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#172033]">2. 人口基本信息视图 (DATA ASSET)</div>
                      <div className="text-[11px] text-[#64748B]">底层明细底表 · 出生日期、年龄、常住状态、街镇编码</div>
                    </div>
                    <span className="text-[#D97706] font-semibold text-[11px]">🟠 需发起申请</span>
                  </div>

                  <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E6EAF0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#172033]">3. 行政区划基础数据 (DATA ASSET)</div>
                      <div className="text-[11px] text-[#64748B]">空间分析维度 · 街镇代码、街镇名称、所属区县</div>
                    </div>
                    <span className="text-[#16A36A] font-semibold text-[11px]">🟢 可直接使用</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#EEF2F6] pt-3 bg-[#FAFCFF] p-3 rounded border border-[#BFDBFE]">
                <div className="font-bold text-[#2563EB] text-xs flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>自动化接入建议</span>
                </div>
                <div className="text-[11px] text-[#475569] mt-1 leading-relaxed">
                  点击“一键用于分析”将自动将可用资源导入分析工作区，并自动为「人口基本信息视图」生成快捷审批工单。
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E6EAF0] flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsSolutionModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded hover:bg-[#F1F5F9] cursor-pointer"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setIsSolutionModalOpen(false);
                  if (onNavigateToMultiResourceRequest) {
                    onNavigateToMultiResourceRequest();
                  }
                }}
                className="px-3.5 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-xs font-bold rounded cursor-pointer transition-colors"
              >
                申请所需资源 (2项)
              </button>
              <button
                onClick={() => {
                  setIsSolutionModalOpen(false);
                  addToast?.('success', '方案已应用', '已完成方案装载并进入分析准备阶段');
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer shadow-2xs"
              >
                一键用于分析
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. REFINE MODAL (补充条件弹窗)                           */}
      {/* ========================================================= */}
      {isRefineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E6EAF0] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#172033]">
                补充分析目标限定条件
              </h3>
              <button
                onClick={() => setIsRefineModalOpen(false)}
                className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#475569]">
                  当前意图：分析各街镇老龄化情况
                </label>
                <textarea
                  value={refineCondition}
                  onChange={(e) => setRefineCondition(e.target.value)}
                  placeholder="例如：限定为80岁以上高龄老人、剔除集体户人口、增加养老机构床位匹配..."
                  className="w-full h-24 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {['按2025年最新统计期', '限定80岁以上高龄', '叠加养老床位供给'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setRefineCondition((prev) => `${prev}，${tag}`)}
                    className="px-2 py-0.5 bg-[#F1F5F9] hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded text-[10px] text-[#64748B] border border-[#E2E8F0]"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E6EAF0] flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsRefineModalOpen(false)}
                className="px-3 py-1 bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded hover:bg-[#F1F5F9]"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setIsRefineModalOpen(false);
                  addToast?.('success', '条件已更新', `已重新解析目标并调整数据方案：${refineCondition}`);
                }}
                className="px-4 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded"
              >
                重新匹配方案
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SINGLE RESOURCE ACCESS REQUEST DRAWER                  */}
      {/* ========================================================= */}
      {singleResourceRequestTarget && (
        <SingleResourceAccessRequestDrawer
          isOpen={!!singleResourceRequestTarget}
          onClose={() => setSingleResourceRequestTarget(null)}
          resourceName={singleResourceRequestTarget.name}
          resourceTypeLabel="DATA ASSET · VIEW"
          taskContextTitle={searchQuery || "街镇老龄化分析"}
          onSuccessSubmit={() => {
            setSingleResourceRequestTarget(null);
          }}
          onViewTaskDetail={() => {
            addToast?.('info', '查看任务', '已定位至目标分析任务关联的方案流');
          }}
          addToast={addToast}
        />
      )}

    </div>
  );
};
