import React, { useState } from 'react';
import {
  Compass,
  Layers,
  FileCheck,
  Sparkles,
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  MessageSquare,
  Network,
  Users,
  User,
  Globe,
  Share2,
  Calendar,
  Percent,
  Code,
  Copy,
  Check,
  SlidersHorizontal,
  Info,
  Shield,
  ArrowRight,
  Database,
  Building2,
  Table
} from 'lucide-react';
import { SingleResourceAccessRequestDrawer } from './SingleResourceAccessRequestDrawer';

export interface DataAssetDetailWorkspaceProps {
  assetId?: string;
  fromGoalSearch?: boolean;
  goalQuery?: string;
  onBackToResources?: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToBusinessObject?: (objectId: string) => void;
  onNavigateToApiDetail?: (apiId: string) => void;
  onEnterAnalysis?: (assetName: string) => void;
  onEnterChatQuery?: (assetName: string) => void;
  onExploreRelatedData?: (assetName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

interface FullFieldItem {
  name: string;
  cnName: string;
  type: string;
  role: string;
  description: string;
  standardMapping?: string;
  businessTerm?: string;
  isKey?: boolean;
}

const ALL_ASSET_FIELDS: FullFieldItem[] = [
  {
    name: 'person_id',
    cnName: '人口唯一标识',
    type: 'BIGINT',
    role: '主体主键 (PK)',
    description: '唯一识别一个自然人主体，全域自然人主键统一编码。',
    standardMapping: 'STD_PERSON_GLOBAL_ID_V1',
    businessTerm: '自然人统一代码 (GB/T 2261.1)',
    isKey: true
  },
  {
    name: 'birth_date',
    cnName: '出生日期',
    type: 'DATE',
    role: '时间属性',
    description: '记录自然人公历出生日期，支撑实足年龄计算与老龄人口识别。',
    standardMapping: 'STD_GB_BIRTH_DATE_V2',
    businessTerm: '出生日期 (GB/T 2261.1)'
  },
  {
    name: 'age',
    cnName: '年龄',
    type: 'INT',
    role: '派生度量属性',
    description: '按当前统计时间动态推导的实足年龄，支撑人口年龄结构与年龄段分析。',
    standardMapping: 'STD_DERIVED_AGE',
    businessTerm: '实足年龄'
  },
  {
    name: 'resident_status',
    cnName: '常住状态',
    type: 'TINYINT',
    role: '分类枚举属性',
    description: '判断是否纳入常住人口统计范围（1-常住，0-非常住/流动）。',
    standardMapping: 'STD_RESIDENT_STATUS_CODE',
    businessTerm: '常住人口标识'
  },
  {
    name: 'gender_code',
    cnName: '性别',
    type: 'VARCHAR(2)',
    role: '分类枚举属性',
    description: '记录自然人的生理性别（1-男，2-女，9-未说明），支撑人口结构分析。',
    standardMapping: 'STD_GB_GENDER_CODE',
    businessTerm: '性别代码 (GB/T 2261.1)'
  },
  {
    name: 'region_code',
    cnName: '所属行政区域',
    type: 'VARCHAR(12)',
    role: '空间维属性',
    description: '国标行政区划编码，支撑省、市、区县等层级分析。',
    standardMapping: 'STD_GB_ADMIN_REGION_2024',
    businessTerm: '县级以上行政区划代码'
  },
  {
    name: 'street_code',
    cnName: '所属街镇代码',
    type: 'VARCHAR(12)',
    role: '空间维属性',
    description: '街镇级行政区划代码，支撑街镇、社区等基层治理分析。',
    standardMapping: 'STD_GB_STREET_CODE',
    businessTerm: '街镇行政区划代码'
  },
  {
    name: 'community_code',
    cnName: '所属社区代码',
    type: 'VARCHAR(12)',
    role: '空间维属性',
    description: '村居级空间网格编码，支撑精细化社区网格分析。',
    standardMapping: 'STD_COMMUNITY_GRID_CODE',
    businessTerm: '村居社区网格代码'
  },
  {
    name: 'age_group',
    cnName: '年龄段分组',
    type: 'VARCHAR(16)',
    role: '派生分类属性',
    description: '按统计口径划分为 0-14岁 / 15-59岁 / 60-79岁 / 80岁以上。',
    standardMapping: 'STD_AGE_BRACKET_V1',
    businessTerm: '人口统计年龄段'
  },
  {
    name: 'household_type',
    cnName: '户口性质',
    type: 'VARCHAR(8)',
    role: '分类属性',
    description: '家庭户、集体户等户籍登记类型。',
    standardMapping: 'STD_HOUSEHOLD_TYPE',
    businessTerm: '户籍类型'
  },
  {
    name: 'id_card_hash',
    cnName: '证件号脱敏散列',
    type: 'VARCHAR(64)',
    role: '安全标识',
    description: '不可逆单向 SHA-256 证件哈希标识，用于跨源多表安全对齐。',
    standardMapping: 'STD_SEC_HASH_ID',
    businessTerm: '脱敏证件散列'
  },
  {
    name: 'residence_address_hash',
    cnName: '常住地网格散列',
    type: 'VARCHAR(64)',
    role: '空间属性',
    description: '空间地理编码脱敏标识，保护居民物理住址隐私。',
    standardMapping: 'STD_GEO_HASH',
    businessTerm: '空间网格脱敏编码'
  },
  {
    name: 'is_elderly_welfare_eligible',
    cnName: '高龄福利资格标识',
    type: 'TINYINT',
    role: '业务状态属性',
    description: '标识该主体是否具备 80 岁以上高龄津贴申报与发放资格。',
    standardMapping: 'STD_WELFARE_ELIGIBILITY_FLAG',
    businessTerm: '高龄津贴资格标识'
  },
  {
    name: 'sync_updated_at',
    cnName: '数据同步时间',
    type: 'TIMESTAMP',
    role: '系统运维属性',
    description: '记录该条事实记录从前置库同步至集市的物理入库时间戳。',
    standardMapping: 'STD_SYS_TIMESTAMP',
    businessTerm: '系统时间戳'
  }
];

export const DataAssetDetailWorkspace: React.FC<DataAssetDetailWorkspaceProps> = ({
  fromGoalSearch = false,
  goalQuery = '分析各街镇老龄化情况',
  onBackToResources,
  onNavigateToDiscovery,
  onNavigateToMyRequests,
  onNavigateToMetricDetail,
  onNavigateToBusinessObject,
  onNavigateToApiDetail,
  onEnterAnalysis,
  onEnterChatQuery,
  onExploreRelatedData,
  addToast
}) => {
  // Navigation inside Marketplace Sidebar
  const [activeSideNav, setActiveSideNav] = useState<'discovery' | 'resources' | 'my_requests'>('resources');

  // Secondary View toggle: Main Asset View vs. All Fields Secondary View
  const [isAllFieldsView, setIsAllFieldsView] = useState<boolean>(false);

  // Field Detail Drawer State
  const [selectedFieldDetail, setSelectedFieldDetail] = useState<FullFieldItem | null>(null);

  // Fitness Summary Drawer State
  const [isFitnessDrawerOpen, setIsFitnessDrawerOpen] = useState<boolean>(false);

  // Single Resource Access Request Drawer State
  const [isAccessRequestDrawerOpen, setIsAccessRequestDrawerOpen] = useState<boolean>(false);

  // Access Permission Simulation State (可直接使用 vs 需申请)
  const [accessState, setAccessState] = useState<'granted' | 'requestable'>('requestable');

  // Fields View search & filter
  const [fieldSearchTerm, setFieldSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast?.('success', '已复制到剪贴板', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered fields for secondary view
  const filteredFields = ALL_ASSET_FIELDS.filter((f) => {
    if (roleFilter !== 'all' && !f.role.includes(roleFilter)) return false;
    if (fieldSearchTerm.trim()) {
      const q = fieldSearchTerm.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.cnName.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
                addToast?.('info', '发现首页', '切换至数据服务超市发现首页');
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
              if (onBackToResources) onBackToResources();
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'resources'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
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
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#64748B]" />
            <span>我的申请</span>
          </button>
        </nav>

        {/* Bottom Fixed Lightweight AI Partner Card */}
        <div className="mt-auto p-3 border-t border-[#EEF2F6] bg-white">
          <div className="flex items-center space-x-2.5 text-xs py-1 px-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 fill-white/20" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#94A3B8] leading-tight">AI Partner</div>
              <div className="text-xs font-bold text-[#172033] leading-tight truncate">
                Xino ｜ 犀诺
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN RESOURCE DETAIL AREA (约 72%)                      */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F7F9FC] transition-all">
        
        {/* Conditional Goal Search Context Strip (仅当从 Goal Search 来源时出现) */}
        {fromGoalSearch && (
          <div className="bg-[#EFF6FF] border-b border-[#DBEAFE] px-8 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span className="text-[#1E40AF] font-medium">
                与当前目标「{goalQuery}」相关：该数据提供年龄、常住状态和行政区域等分析所需业务信息。
              </span>
            </div>
            <button
              onClick={onBackToResources}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>返回当前数据方案</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="p-8 max-w-[940px] w-full mx-auto space-y-6">

          {/* Top Return Link & Breadcrumb */}
          <div className="space-y-2">
            <div className="text-xs text-[#94A3B8] flex items-center space-x-2">
              <span
                onClick={onNavigateToDiscovery}
                className="hover:text-[#2563EB] cursor-pointer"
              >
                数据服务超市
              </span>
              <span>/</span>
              <span
                onClick={onBackToResources}
                className="hover:text-[#2563EB] cursor-pointer"
              >
                资源
              </span>
              <span>/</span>
              <span className="text-[#172033] font-medium">人口基本信息视图</span>
              {isAllFieldsView && (
                <>
                  <span>/</span>
                  <span className="text-[#2563EB] font-medium">全部字段</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (isAllFieldsView) {
                    setIsAllFieldsView(false);
                  } else if (onBackToResources) {
                    onBackToResources();
                  }
                }}
                className="inline-flex items-center space-x-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isAllFieldsView ? '返回资产概览' : '返回资源'}</span>
              </button>

              {/* Demo Mode Toggle for Permission Status in Use Rail */}
              <div className="flex items-center space-x-2 text-[11px] text-[#94A3B8]">
                <span>访问权限模拟:</span>
                <button
                  onClick={() => {
                    const next = accessState === 'granted' ? 'requestable' : 'granted';
                    setAccessState(next);
                    addToast?.('info', '切换权限模拟', next === 'granted' ? '已模拟「可直接使用」状态' : '已模拟「需申请使用」状态');
                  }}
                  className="px-2 py-0.5 rounded bg-white border border-[#E6EAF0] text-[#334155] hover:border-[#2563EB] font-medium transition-all cursor-pointer shadow-2xs"
                >
                  {accessState === 'granted' ? '🟢 当前：可直接使用' : '🟠 当前：需申请'}
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* A. RESOURCE HEADER                                      */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-5">
            
            {/* Top Row: Green Database Icon + Title + Badges + Subtitle */}
            <div className="flex items-start space-x-4">
              {/* Green Icon Box */}
              <div className="w-14 h-14 rounded-xl bg-[#059669] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <Database className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                    人口基本信息视图
                  </h1>
                  <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] text-[11px] font-semibold rounded">
                    DATA ASSET · VIEW
                  </span>
                  <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-medium rounded">
                    已发布资源
                  </span>
                </div>

                <div className="text-xs font-mono text-[#94A3B8]">
                  population_profile_view
                </div>

                {/* 正式业务定义 */}
                <p className="text-xs text-[#334155] leading-relaxed pt-1">
                  记录自然人的主体标识、出生日期、年龄、常住状态、性别及所属行政区域等基础信息，用于人口结构、老龄化与区域人口分析。
                </p>
              </div>
            </div>

            {/* Pills row & Applicable scenarios */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#475569] font-medium">
                  人口服务
                </span>
                <span className="px-3 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#475569] font-medium">
                  自然人
                </span>
              </div>

              <div className="text-xs text-[#64748B]">
                <span className="text-[#334155] font-medium">适用于：</span>
                <span className="ml-1">人口结构分析 · 老龄化分析 · 区域人口统计</span>
              </div>
            </div>

            {/* ======================================================= */}
            {/* B. 4 核心事实卡片 (4 列纯净分隔白底布局)                   */}
            {/* ======================================================= */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-[#F8FAFC]/80 border border-[#EEF2F6] text-xs">
              
              {/* Col 1: 一行代表 */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[11px] text-[#64748B]">一行代表</div>
                  <div className="font-bold text-[#172033] truncate">一个自然人主体</div>
                </div>
              </div>

              {/* Col 2: 覆盖范围 */}
              <div className="flex items-center space-x-3 border-l border-[#E2E8F0] pl-4">
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[11px] text-[#64748B]">覆盖范围</div>
                  <div className="font-bold text-[#172033] truncate">指定行政区域内的常住人口</div>
                </div>
              </div>

              {/* Col 3: 业务对象 */}
              <div className="flex items-center space-x-3 border-l border-[#E2E8F0] pl-4">
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[11px] text-[#64748B]">业务对象</div>
                  <div
                    onClick={() => onNavigateToBusinessObject?.('res-01')}
                    className="font-bold text-[#172033] hover:text-[#2563EB] cursor-pointer truncate"
                  >
                    自然人
                  </div>
                </div>
              </div>

              {/* Col 4: 更新 */}
              <div className="flex items-center space-x-3 border-l border-[#E2E8F0] pl-4">
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[11px] text-[#64748B]">更新</div>
                  <div className="font-bold text-[#172033] truncate">每日 · 今天 08:10</div>
                </div>
              </div>

            </div>

          </div>

          {/* ======================================================= */}
          {/* C. SECONDARY VIEW: ALL FIELDS (查看全部字段二级视图)         */}
          {/* ======================================================= */}
          {isAllFieldsView ? (
            <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF2F6] pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-[#172033] tracking-tight">
                      全部业务与技术字段
                    </h2>
                    <span className="text-xs text-[#667085]">
                      共 {ALL_ASSET_FIELDS.length} 项字段
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] mt-0.5">
                    点击任意字段行可呼出字段业务定义、角色及标准映射抽屉。
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={fieldSearchTerm}
                      onChange={(e) => setFieldSearchTerm(e.target.value)}
                      placeholder="搜索字段名称或含义…"
                      className="pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] w-48"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-8 px-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
                  >
                    <option value="all">全部角色</option>
                    <option value="主键">主体主键 (PK)</option>
                    <option value="时间">时间属性</option>
                    <option value="度量">度量属性</option>
                    <option value="空间">空间属性</option>
                    <option value="分类">分类属性</option>
                  </select>
                </div>
              </div>

              {/* All Fields Table */}
              <div className="border border-[#EEF2F6] rounded-md overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] text-[#667085] border-b border-[#EEF2F6] font-semibold">
                    <tr>
                      <th className="px-4 py-3">业务信息</th>
                      <th className="px-4 py-3">技术字段</th>
                      <th className="px-4 py-3">数据类型</th>
                      <th className="px-4 py-3">业务角色</th>
                      <th className="px-4 py-3">业务含义</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F6]">
                    {filteredFields.map((field) => (
                      <tr
                        key={field.name}
                        onClick={() => setSelectedFieldDetail(field)}
                        className={`hover:bg-[#F8FAFC] cursor-pointer transition-colors ${
                          selectedFieldDetail?.name === field.name ? 'bg-[#EFF6FF]' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                            <span>{field.cnName}</span>
                            {field.isKey && (
                              <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-bold rounded">
                                PK
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#667085]">
                          {field.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#475569]">
                          {field.type}
                        </td>
                        <td className="px-4 py-3 text-[#475569]">
                          <span className="px-2 py-0.5 bg-[#F1F5F9] rounded text-[11px]">
                            {field.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#334155] max-w-[240px] truncate">
                          {field.description}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[#2563EB] hover:underline font-medium text-xs">
                            详情 →
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-xs text-[#667085] pt-2">
                <span>显示 {filteredFields.length} / {ALL_ASSET_FIELDS.length} 个字段</span>
                <button
                  onClick={() => setIsAllFieldsView(false)}
                  className="text-[#2563EB] hover:underline font-medium cursor-pointer"
                >
                  ← 返回资产主详情
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ======================================================= */}
              {/* D. 关键业务信息 (第一核心区域)                            */}
              {/* ======================================================= */}
              <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                  <h2 className="text-base font-bold text-[#172033] tracking-tight">
                    关键业务信息
                  </h2>
                  <button
                    onClick={() => setIsAllFieldsView(true)}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>查看全部字段</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* 3 列企业级轻量表格 */}
                <div className="border border-[#EEF2F6] rounded-md overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#EEF2F6] font-semibold">
                      <tr>
                        <th className="px-4 py-2.5 w-[25%] font-medium">业务信息</th>
                        <th className="px-4 py-2.5 w-[50%] font-medium">业务含义</th>
                        <th className="px-4 py-2.5 w-[25%] font-medium">数据字段</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF2F6]">
                      {[
                        { info: '人口唯一标识', meaning: '唯一识别一个自然人主体', field: 'person_id', raw: ALL_ASSET_FIELDS[0] },
                        { info: '出生日期', meaning: '支撑年龄计算与老龄人口识别', field: 'birth_date', raw: ALL_ASSET_FIELDS[1] },
                        { info: '年龄', meaning: '支撑人口年龄结构与年龄段分析', field: 'age', raw: ALL_ASSET_FIELDS[2] },
                        { info: '常住状态', meaning: '判断是否纳入常住人口统计范围', field: 'resident_status', raw: ALL_ASSET_FIELDS[3] },
                        { info: '性别', meaning: '支撑人口结构分析', field: 'gender_code', raw: ALL_ASSET_FIELDS[4] },
                        { info: '所属行政区域', meaning: '支撑街镇、社区等区域分析', field: 'region_code', raw: ALL_ASSET_FIELDS[5] }
                      ].map((item) => (
                        <tr
                          key={item.field}
                          onClick={() => setSelectedFieldDetail(item.raw)}
                          className="hover:bg-[#F8FAFC] cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3 font-medium text-[#172033] group-hover:text-[#2563EB]">
                            {item.info}
                          </td>
                          <td className="px-4 py-3 text-[#475569] leading-relaxed">
                            {item.meaning}
                          </td>
                          <td className="px-4 py-3 font-mono text-[#64748B]">
                            {item.field}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ======================================================= */}
              {/* E. 数据状态 (Fitness Only，不表达权限)                   */}
              {/* ======================================================= */}
              <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                  <h2 className="text-base font-bold text-[#172033] tracking-tight">
                    数据状态
                  </h2>
                  <button
                    onClick={() => setIsFitnessDrawerOpen(true)}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>查看质量摘要</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* 3 列数据状态内容 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-1">
                  
                  {/* Col 1: 每日更新 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-[#172033]">每日更新</div>
                      <div className="text-[11px] text-[#64748B]">更新频率</div>
                    </div>
                  </div>

                  {/* Col 2: 今天 08:10 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-[#172033]">今天 08:10</div>
                      <div className="text-[11px] text-[#64748B]">最近更新</div>
                    </div>
                  </div>

                  {/* Col 3: 存在新鲜度提醒 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#D97706] shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#D97706]">存在新鲜度提醒</div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        当前数据可以用于历史人口、人口结构和老龄化分析；如果用于当日实时统计，建议先确认最新同步状态。
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* ======================================================= */}
              {/* F. 相关资源 (4 张紧凑横向卡片)                             */}
              {/* ======================================================= */}
              <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                  <h2 className="text-base font-bold text-[#172033] tracking-tight">
                    相关资源
                  </h2>
                  <button
                    onClick={onBackToResources}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>查看全部相关资源</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs">
                  
                  {/* Card 1: 自然人 (BUSINESS OBJECT) */}
                  <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#93C5FD] transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#172033] truncate">自然人</div>
                          <span className="inline-block px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-semibold rounded">
                            BUSINESS OBJECT
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        当前资产承载的核心业务对象。
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToBusinessObject?.('res-01')}
                      className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-xs text-left cursor-pointer"
                    >
                      查看 →
                    </button>
                  </div>

                  {/* Card 2: 老龄化率 (METRIC) */}
                  <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#93C5FD] transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shrink-0 font-bold text-xs">
                          %
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#172033] truncate">老龄化率</div>
                          <span className="inline-block px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-semibold rounded">
                            METRIC
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        使用年龄与常住人口语义形成的正式指标。
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToMetricDetail?.('res-03')}
                      className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-xs text-left cursor-pointer"
                    >
                      查看 →
                    </button>
                  </div>

                  {/* Card 3: 常住人口数 (METRIC) */}
                  <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#93C5FD] transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shrink-0 font-bold text-xs">
                          %
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#172033] truncate">常住人口数</div>
                          <span className="inline-block px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-semibold rounded">
                            METRIC
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        基于当前人口数据形成的人口规模指标。
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToMetricDetail?.('res-07')}
                      className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-xs text-left cursor-pointer"
                    >
                      查看 →
                    </button>
                  </div>

                  {/* Card 4: 人口统计查询 API (DATA API) */}
                  <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#93C5FD] transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#EA580C] flex items-center justify-center text-white shrink-0 font-bold text-xs">
                          <Code className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#172033] truncate">人口统计查询 API</div>
                          <span className="inline-block px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-semibold rounded">
                            DATA API
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        提供区域人口统计查询能力。
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToApiDetail?.('res-04')}
                      className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-xs text-left cursor-pointer"
                    >
                      查看 →
                    </button>
                  </div>

                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. RIGHT USE RAIL (约 28%，只回答：权限与下一步操作)          */}
      {/* ========================================================= */}
      <aside className="w-[300px] bg-white border-l border-[#E6EAF0] flex flex-col shrink-0 p-6 space-y-6 select-none overflow-y-auto">
        
        {/* Rail Title */}
        <div>
          <h3 className="text-base font-bold text-[#172033] tracking-tight">
            使用
          </h3>
        </div>

        {/* 1. 当前访问 */}
        <div className="space-y-1 text-xs">
          {accessState === 'granted' ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#16A36A]">
                <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                <span>可直接使用</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed pl-5.5">
                已具备查询权限，可直接用于分析与问数。
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#D97706]">
                <Lock className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>需申请</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed pl-5.5">
                获取查询权限后，可将该数据用于分析与问数。
              </p>
            </div>
          )}
        </div>

        {/* 2. 数据提醒 */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-[#D97706]">
            <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>存在新鲜度提醒</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed pl-5.5">
            实时分析前建议确认最新同步状态。
          </p>
        </div>

        {/* 3. 详细元数据项列表 */}
        <div className="space-y-3.5 text-xs border-t border-[#EEF2F6] pt-5">
          
          {/* 维护团队 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">维护团队</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-[#172033]">人口业务治理团队</span>
              <button
                onClick={() => {
                  addToast?.('info', '联系团队', '已向 人口业务治理团队 发起即时咨询与工单申请');
                }}
                className="text-[#2563EB] hover:underline text-[11px] font-medium cursor-pointer"
              >
                联系团队 →
              </button>
            </div>
          </div>

          {/* 业务域 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">业务域</span>
            <span className="font-medium text-[#172033]">人口服务</span>
          </div>

          {/* 业务对象 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">业务对象</span>
            <span className="font-medium text-[#172033]">自然人</span>
          </div>

          {/* 一行代表 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">一行代表</span>
            <span className="font-medium text-[#172033]">一个自然人主体</span>
          </div>

          {/* 更新频率 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">更新频率</span>
            <span className="font-medium text-[#172033]">每日</span>
          </div>

          {/* 最近更新 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">最近更新</span>
            <span className="font-medium text-[#172033]">今天 08:10</span>
          </div>

        </div>

        {/* 4. 主操作按钮区 */}
        <div className="space-y-3 border-t border-[#EEF2F6] pt-5">
          {accessState === 'granted' ? (
            <>
              {/* Primary: 进入分析 */}
              <button
                onClick={() => {
                  if (onEnterAnalysis) {
                    onEnterAnalysis('人口基本信息视图');
                  } else {
                    addToast?.('success', '进入分析', '已将「人口基本信息视图」载入 AI 分析工作台');
                  }
                }}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>进入分析</span>
              </button>

              {/* Secondary: 用于问数 */}
              <button
                onClick={() => {
                  if (onEnterChatQuery) {
                    onEnterChatQuery('人口基本信息视图');
                  } else {
                    addToast?.('info', '用于问数', '已在 Xino 对话流中绑定当前资产上下文');
                  }
                }}
                className="w-full py-2.5 bg-white hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#2563EB] text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>用于问数</span>
              </button>
            </>
          ) : (
            <>
              {/* Primary: 申请使用 */}
              <button
                onClick={() => {
                  setIsAccessRequestDrawerOpen(true);
                  addToast?.('info', '申请使用', '已打开「人口基本信息视图」访问需求确认抽屉');
                }}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>申请使用</span>
              </button>

              {/* Secondary: 查看相关资源 */}
              <button
                onClick={onBackToResources}
                className="w-full py-2.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#2563EB] text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>查看相关资源</span>
              </button>
            </>
          )}

          {/* 底部弱动作: 围绕此资源找数据 */}
          <div className="pt-2 text-center">
            <button
              onClick={() => {
                if (onExploreRelatedData) {
                  onExploreRelatedData('人口基本信息视图');
                } else if (onBackToResources) {
                  onBackToResources();
                }
              }}
              className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>围绕此资源找数据 →</span>
            </button>
          </div>
        </div>

      </aside>

      {/* ========================================================= */}
      {/* 4. FIELD DETAIL DRAWER (字段语义上下文抽屉，无治理噪点)      */}
      {/* ========================================================= */}
      {selectedFieldDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[480px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-center justify-between shrink-0 bg-[#FAFCFF]">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  字段语义上下文
                </div>
                <div className="text-base font-bold text-[#172033] flex items-center space-x-2">
                  <span>{selectedFieldDetail.cnName}</span>
                  <code className="text-xs font-mono text-[#667085] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                    {selectedFieldDetail.name}
                  </code>
                </div>
              </div>

              <button
                onClick={() => setSelectedFieldDetail(null)}
                className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* 1. 业务定义 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#667085]">业务定义</label>
                <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md text-xs text-[#334155] leading-relaxed">
                  {selectedFieldDetail.description}
                </div>
              </div>

              {/* 2. 字段基础属性 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#EEF2F6] rounded-md space-y-1">
                  <div className="text-[10px] text-[#667085]">数据类型</div>
                  <div className="font-mono font-bold text-[#172033]">
                    {selectedFieldDetail.type}
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#EEF2F6] rounded-md space-y-1">
                  <div className="text-[10px] text-[#667085]">业务角色</div>
                  <div className="font-bold text-[#2563EB]">
                    {selectedFieldDetail.role}
                  </div>
                </div>
              </div>

              {/* 3. 关联业务对象 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#667085]">关联业务对象</label>
                <div className="p-3 bg-white border border-[#EEF2F6] rounded-md flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-bold text-[#172033]">自然人 (Person)</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFieldDetail(null);
                      onNavigateToBusinessObject?.('res-01');
                    }}
                    className="text-[#2563EB] hover:underline text-xs font-semibold cursor-pointer"
                  >
                    查看对象 →
                  </button>
                </div>
              </div>

              {/* 4. 关联正式业务术语 */}
              {selectedFieldDetail.businessTerm && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#667085]">关联正式业务术语</label>
                  <div className="p-3 bg-white border border-[#EEF2F6] rounded-md text-[#334155]">
                    {selectedFieldDetail.businessTerm}
                  </div>
                </div>
              )}

              {/* 5. 正式标准映射 */}
              {selectedFieldDetail.standardMapping && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#667085]">正式数据标准映射</label>
                  <div className="p-3 bg-white border border-[#EEF2F6] rounded-md flex items-center justify-between">
                    <code className="font-mono text-[#2563EB] font-bold">
                      {selectedFieldDetail.standardMapping}
                    </code>
                    <button
                      onClick={() => handleCopyText(selectedFieldDetail.standardMapping!, 'standard')}
                      className="text-[#64748B] hover:text-[#172033] flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedKey === 'standard' ? (
                        <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px]">{copiedKey === 'standard' ? '已复制' : '复制'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. 技术映射与安全属性 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#667085]">技术元数据规范</label>
                <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1.5">
                  <div className="flex justify-between text-[#667085]">
                    <span>主键标识 (PK):</span>
                    <span className="font-semibold text-[#172033]">{selectedFieldDetail.isKey ? '是' : '否'}</span>
                  </div>
                  <div className="flex justify-between text-[#667085]">
                    <span>可为空约束 (Nullable):</span>
                    <span className="font-semibold text-[#172033]">{selectedFieldDetail.isKey ? '否 (NOT NULL)' : '是 (NULLABLE)'}</span>
                  </div>
                  <div className="flex justify-between text-[#667085]">
                    <span>脱敏安全策略:</span>
                    <span className="font-semibold text-[#16A36A]">
                      {selectedFieldDetail.name.includes('hash') || selectedFieldDetail.name.includes('id_card') ? '哈希不可逆散列' : '无需脱敏'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex justify-end">
              <button
                onClick={() => setSelectedFieldDetail(null)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-semibold text-xs rounded-md cursor-pointer transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. DATA FITNESS DRAWER (数据可用性与质量摘要抽屉)              */}
      {/* ========================================================= */}
      {isFitnessDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[520px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-center justify-between shrink-0 bg-[#FAFCFF]">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  数据可用性与质量摘要
                </div>
                <div className="text-base font-bold text-[#172033]">
                  人口基本信息视图 · 状态评估
                </div>
              </div>

              <button
                onClick={() => setIsFitnessDrawerOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              
              {/* 核心评估结论 - 纯文本呈现 */}
              <div className="space-y-1.5 pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center space-x-2 text-[#0F172A] font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>数据可用性评估结论：适度可用 (存在新鲜度提醒)</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed pl-6">
                  当前数据可以用于历史人口、人口结构和老龄化分析；如果用于当日实时统计，建议先确认最新同步状态。
                </p>
              </div>

              {/* 1. 质量维度评估 */}
              <div className="space-y-3">
                <div className="font-bold text-[#172033] text-xs">
                  核心质量指标评估
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#172033]">主键完整性 (Completeness)</div>
                      <div className="text-[11px] text-[#667085]">person_id 主键无空值率</div>
                    </div>
                    <span className="font-bold text-[#16A36A] text-sm">100%</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#172033]">行政区划合规率 (Validity)</div>
                      <div className="text-[11px] text-[#667085]">符合 2024 国标行政区划编码规则</div>
                    </div>
                    <span className="font-bold text-[#16A36A] text-sm">99.85%</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#172033]">数据新鲜度时延 (Timeliness)</div>
                      <div className="text-[11px] text-[#667085]">前置库到集市同步延迟约 4 小时</div>
                    </div>
                    <span className="font-bold text-[#D97706] text-sm">T+1 每日</span>
                  </div>
                </div>
              </div>

              {/* 2. 建议适用场景与规避场景 */}
              <div className="space-y-3">
                <div className="font-bold text-[#172033] text-xs">
                  业务适用建议
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] space-y-1">
                    <div className="font-bold">✓ 推荐使用</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                      <li>全区人口结构历史宏观分析</li>
                      <li>各街镇老龄化率中长期规划</li>
                      <li>常住人口与户籍对比调研</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-md bg-[#FFF7ED] border border-[#FFEDD5] text-[#9A3412] space-y-1">
                    <div className="font-bold">⚠ 审慎或避免使用</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                      <li>今日实时进出港人口监测</li>
                      <li>秒级高频网格治安调度</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex justify-end">
              <button
                onClick={() => setIsFitnessDrawerOpen(false)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-semibold text-xs rounded-md cursor-pointer transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. SINGLE RESOURCE ACCESS REQUEST DRAWER (单资源申请抽屉)    */}
      {/* ========================================================= */}
      <SingleResourceAccessRequestDrawer
        isOpen={isAccessRequestDrawerOpen}
        onClose={() => setIsAccessRequestDrawerOpen(false)}
        resourceName="人口基本信息视图"
        resourceTypeLabel="DATA ASSET · VIEW"
        taskContextTitle={goalQuery || "街镇老龄化分析"}
        onSuccessSubmit={(resultType) => {
          if (resultType === 'auto_granted') {
            setAccessState('granted');
          }
        }}
        addToast={addToast}
      />

    </div>
  );
};

