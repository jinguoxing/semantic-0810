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
  Table,
  Workflow
} from 'lucide-react';
import { SingleResourceAccessRequestDrawer } from './SingleResourceAccessRequestDrawer';
import { isAutoAllowed } from './accessDomain';

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
    <div className="flex-1 flex overflow-hidden bg-white text-[#0F172A] font-sans antialiased relative selection:bg-[#EFF6FF] selection:text-[#2563EB]">
      
      {/* ========================================================= */}
      {/* 1. MARKETPLACE SIDEBAR (210px)                            */}
      {/* ========================================================= */}
      <aside className="w-[210px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 select-none z-10">
        {/* Sidebar Header Title */}
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
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
            className={`w-full px-3 py-2 rounded flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
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
            className={`w-full px-3 py-2 rounded flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
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
            className={`w-full px-3 py-2 rounded flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'my_requests'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#64748B]" />
            <span>我的申请</span>
          </button>
        </nav>

        {/* Bottom Fixed AI Partner Card */}
        <div className="mt-auto p-3 border-t border-[#E2E8F0] bg-white">
          <div className="flex items-center space-x-2.5 text-xs py-1 px-1">
            <div className="w-6 h-6 rounded bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 fill-white/20" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#94A3B8] leading-tight">AI Partner</div>
              <div className="text-xs font-bold text-[#0F172A] leading-tight truncate">
                Xino ｜ 犀诺
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. CONTINUOUS MAIN CONTENT AREA (Flat Entity Detail)       */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-white transition-all">
        
        {/* Conditional Goal Search Context Strip */}
        {fromGoalSearch && (
          <div className="bg-[#EFF6FF] border-b border-[#DBEAFE] px-8 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span className="text-[#1E40AF]">
                与当前目标「{goalQuery}」相关：该数据提供年龄、常住状态和行政区域等分析所需业务信息。
              </span>
            </div>
            <button
              onClick={onBackToResources}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>返回当前数据方案</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Flat Continuous Document Canvas */}
        <div className="max-w-[1040px] w-full mx-auto px-8 py-7 space-y-7">

          {/* ======================================================= */}
          {/* I. BREADCRUMB & BACK ACTION                             */}
          {/* ======================================================= */}
          <div className="space-y-2">
            <div className="text-xs text-[#64748B] flex items-center space-x-2">
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
              <span className="text-[#0F172A] font-semibold">人口基本信息视图</span>
              {isAllFieldsView && (
                <>
                  <span>/</span>
                  <span className="text-[#2563EB] font-semibold">全部字段</span>
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
              <div className="flex items-center space-x-2 text-[11px] text-[#64748B]">
                <span>访问权限模拟:</span>
                <button
                  onClick={() => {
                    const next = accessState === 'granted' ? 'requestable' : 'granted';
                    setAccessState(next);
                    addToast?.('info', '切换权限模拟', next === 'granted' ? '已模拟「可直接使用」状态' : '已模拟「需申请使用」状态');
                  }}
                  className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#334155] hover:border-[#2563EB] font-medium transition-all cursor-pointer shadow-2xs"
                >
                  {accessState === 'granted' ? '🟢 当前：可直接使用' : '🟠 当前：需申请'}
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* II. FLAT ENTITY HEADER (No Hero Card)                    */}
          {/* ======================================================= */}
          <div className="space-y-3.5">
            {/* Title Line */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                人口基本信息视图
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] text-xs font-semibold">
                DATA ASSET · VIEW
              </span>
              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-medium">
                已发布资源
              </span>
            </div>

            <div className="text-xs text-[#64748B] font-mono">
              population_profile_view
            </div>

            {/* Formal Business Definition Paragraph */}
            <p className="text-sm text-[#334155] leading-relaxed">
              记录自然人的主体标识、出生日期、年龄、常住状态、性别及所属行政区域等基础信息，用于人口结构、老龄化与区域人口分析。
            </p>

            {/* Business Context & Applicability Tags */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs pt-1">
              <div className="flex items-center space-x-1.5 text-[#475569]">
                <span className="text-[#64748B]">业务上下文：</span>
                <button
                  onClick={() => onNavigateToBusinessObject?.('res-01')}
                  className="inline-flex items-center space-x-1 text-[#2563EB] hover:text-[#1D4ED8] font-semibold hover:underline cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>人口服务 · 自然人</span>
                </button>
              </div>

              <div className="flex items-center space-x-1.5 text-[#475569]">
                <span className="text-[#64748B]">适用于：</span>
                <span className="text-[#0F172A] font-medium">
                  人口结构分析 · 老龄化分析 · 区域人口统计
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* III. CORE FACTS (横向事实带，不做四张统计卡)             */}
          {/* ======================================================= */}
          <div className="flex flex-wrap items-center justify-between py-3 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs gap-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">一行代表：</span>
              <span className="font-bold text-[#0F172A]">一个自然人主体</span>
            </div>

            <div className="h-3.5 w-px bg-[#CBD5E1] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">覆盖范围：</span>
              <span className="font-bold text-[#0F172A]">指定行政区域内的常住人口</span>
            </div>

            <div className="h-3.5 w-px bg-[#CBD5E1] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">业务对象：</span>
              <button
                onClick={() => onNavigateToBusinessObject?.('res-01')}
                className="font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                自然人
              </button>
            </div>

            <div className="h-3.5 w-px bg-[#CBD5E1] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">更新：</span>
              <span className="font-bold text-[#0F172A] flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span>每日 · 今天 08:10</span>
              </span>
            </div>
          </div>

          {/* ======================================================= */}
          {/* IV. SECONDARY VIEW (ALL FIELDS) vs. MAIN ASSET VIEW      */}
          {/* ======================================================= */}
          {isAllFieldsView ? (
            /* SECONDARY VIEW: ALL FIELDS */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                      全部业务与技术字段
                    </h2>
                    <span className="text-xs text-[#64748B]">
                      共 {ALL_ASSET_FIELDS.length} 项字段
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
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
                      className="pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] w-48"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-8 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
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
              <div className="border border-[#E2E8F0] rounded overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0] font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">业务信息</th>
                      <th className="px-4 py-2.5">技术字段</th>
                      <th className="px-4 py-2.5">数据类型</th>
                      <th className="px-4 py-2.5">业务角色</th>
                      <th className="px-4 py-2.5">业务含义</th>
                      <th className="px-4 py-2.5 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredFields.map((field) => (
                      <tr
                        key={field.name}
                        onClick={() => setSelectedFieldDetail(field)}
                        className={`hover:bg-[#F8FAFC] cursor-pointer transition-colors ${
                          selectedFieldDetail?.name === field.name ? 'bg-[#EFF6FF]' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#0F172A] flex items-center space-x-1.5">
                            <span>{field.cnName}</span>
                            {field.isKey && (
                              <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-bold rounded">
                                PK
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#64748B]">
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

              <div className="flex justify-between items-center text-xs text-[#64748B] pt-1">
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
            /* MAIN ASSET VIEW */
            <>
              {/* ======================================================= */}
              {/* V. 关键业务信息 (Key Business Info)                      */}
              {/* ======================================================= */}
              <section className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                      <Table className="w-4 h-4 text-[#2563EB]" />
                      <span>关键业务信息</span>
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      覆盖人口主体、出生日期、年龄与行政区域等核心业务字段
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAllFieldsView(true)}
                    className="inline-flex items-center space-x-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold cursor-pointer transition-colors"
                  >
                    <span>查看全部字段</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="border border-[#E2E8F0] rounded overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0] font-semibold">
                      <tr>
                        <th className="px-4 py-2.5 w-[25%]">业务信息</th>
                        <th className="px-4 py-2.5 w-[50%]">业务含义</th>
                        <th className="px-4 py-2.5 w-[25%]">数据字段</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
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
                          <td className="px-4 py-3 font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
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
              </section>

              {/* ======================================================= */}
              {/* VI. 数据状态 (Data Fitness Status)                       */}
              {/* ======================================================= */}
              <section className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#2563EB]" />
                      <span>数据状态</span>
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      关注数据新鲜度、时效性与可用性评估（不表达权限状态）
                    </p>
                  </div>

                  <button
                    onClick={() => setIsFitnessDrawerOpen(true)}
                    className="inline-flex items-center space-x-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold cursor-pointer transition-colors"
                  >
                    <span>查看质量摘要</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Flat Status Definition Rows */}
                <div className="border border-[#E2E8F0] rounded divide-y divide-[#F1F5F9] text-xs">
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-[#0F172A]">更新频率</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                        每日更新
                      </span>
                    </div>
                    <span className="text-[#64748B] text-[11px]">
                      固定每日凌晨完成增量同步与全量快照归档
                    </span>
                  </div>

                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-[#0F172A]">最近数据更新</span>
                      <span className="font-mono text-xs font-semibold text-[#475569]">
                        今天 08:10
                      </span>
                    </div>
                    <span className="text-[#64748B] text-[11px]">
                      底层人口基本信息视图已同步至 2026-08-18 08:10 批次
                    </span>
                  </div>

                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-[#0F172A]">数据新鲜度 (Fitness)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                        <span>存在新鲜度提醒</span>
                      </span>
                    </div>
                    <span className="text-[#92400E] text-[11px] font-medium">
                      当前数据可用于历史人口与结构分析；如用于当日实时统计，建议先确认最新同步状态
                    </span>
                  </div>
                </div>
              </section>

              {/* ======================================================= */}
              {/* VII. 相关资源 (Related Resources)                       */}
              {/* ======================================================= */}
              <section id="section-related-resources" className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                      <Network className="w-4 h-4 text-[#2563EB]" />
                      <span>相关资源</span>
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      围绕当前人口资产关联的企业正式业务对象、派生指标与服务 API
                    </p>
                  </div>

                  <button
                    onClick={onBackToResources}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>查看全部相关资源</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Flat Compact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Card 1: 自然人 (BUSINESS OBJECT) */}
                  <div className="p-3 border border-[#E2E8F0] rounded hover:border-[#2563EB] transition-all bg-white flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A]">自然人</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                          BUSINESS OBJECT
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        当前资产承载的核心业务对象。
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToBusinessObject?.('res-01')}
                      className="pt-1.5 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center justify-between cursor-pointer"
                    >
                      <span>查看详情</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card 2: 老龄化率 (METRIC) */}
                  <div className="p-3 border border-[#E2E8F0] rounded hover:border-[#2563EB] transition-all bg-white flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A]">老龄化率</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#166534]">
                          METRIC
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        使用年龄与常住人口语义形成的正式指标。
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToMetricDetail?.('res-03')}
                      className="pt-1.5 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center justify-between cursor-pointer"
                    >
                      <span>查看详情</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card 3: 常住人口数 (METRIC) */}
                  <div className="p-3 border border-[#E2E8F0] rounded hover:border-[#2563EB] transition-all bg-white flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A]">常住人口数</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#166534]">
                          METRIC
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        基于当前人口数据形成的人口规模指标。
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToMetricDetail?.('res-07')}
                      className="pt-1.5 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center justify-between cursor-pointer"
                    >
                      <span>查看详情</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card 4: 人口统计查询 API (DATA API) */}
                  <div className="p-3 border border-[#E2E8F0] rounded hover:border-[#2563EB] transition-all bg-white flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A]">人口统计查询 API</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F5F3FF] text-[#7C3AED]">
                          DATA API
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        提供区域人口统计查询标准化服务能力。
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToApiDetail?.('res-04')}
                      className="pt-1.5 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center justify-between cursor-pointer"
                    >
                      <span>查看详情</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. LIGHTWEIGHT RIGHT USE RAIL (Flat Sidebar)              */}
      {/* ========================================================= */}
      <aside className="w-[300px] xl:w-[320px] bg-white border-l border-[#E2E8F0] flex flex-col shrink-0 overflow-y-auto select-none p-6 space-y-5">
        
        {/* Rail Title */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
            使用
          </h3>
          <span className="text-[11px] font-mono text-[#64748B]">
            DATA ASSET
          </span>
        </div>

        {/* 1. 当前访问 */}
        <div className="space-y-1 text-xs">
          {accessState === 'granted' ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">当前访问</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                  <span>可直接使用</span>
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                已具备查询权限，可直接用于分析与问数。
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">当前访问</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                  <span>需申请</span>
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                获取查询权限后，可将该数据用于分析与问数。
              </p>
            </div>
          )}
        </div>

        <div className="h-px bg-[#E2E8F0]" />

        {/* 2. 数据提醒 */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">数据提醒</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-[#D97706]" />
              <span>有提醒</span>
            </span>
          </div>
          <p className="text-[11px] text-[#B45309] leading-relaxed">
            实时分析前建议确认最新同步状态。
          </p>
        </div>

        <div className="h-px bg-[#E2E8F0]" />

        {/* 3. 详细元数据项列表 */}
        <div className="space-y-2.5 text-xs">
          {/* 维护团队 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">维护团队</span>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-[#0F172A]">人口业务治理团队</span>
              <button
                onClick={() => {
                  addToast?.('info', '联系团队', '已向 人口业务治理团队 发起即时咨询与工单申请');
                }}
                className="text-[#2563EB] hover:underline text-[11px] font-medium cursor-pointer"
              >
                联系 →
              </button>
            </div>
          </div>

          {/* 业务域 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">业务域</span>
            <span className="font-semibold text-[#0F172A]">人口服务</span>
          </div>

          {/* 业务对象 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">业务对象</span>
            <span className="font-semibold text-[#0F172A]">自然人</span>
          </div>

          {/* 一行代表 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">一行代表</span>
            <span className="font-semibold text-[#0F172A]">一个自然人主体</span>
          </div>

          {/* 更新频率 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">更新频率</span>
            <span className="font-semibold text-[#0F172A]">每日</span>
          </div>

          {/* 最近更新 */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">最近更新</span>
            <span className="font-mono font-semibold text-[#0F172A]">今天 08:10</span>
          </div>
        </div>

        <div className="h-px bg-[#E2E8F0]" />

        {/* 4. 主操作按钮区 */}
        <div className="space-y-2 pt-1">
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
                className="w-full py-2 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
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
                className="w-full py-2 px-4 bg-white hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#2563EB] text-xs font-bold rounded transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
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
                }}
                className="w-full py-2 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>申请使用</span>
              </button>

              {/* Secondary: 查看相关资源 */}
              <button
                onClick={onBackToResources}
                className="w-full py-1.5 px-4 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] text-xs font-medium rounded transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
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
      {/* 4. FIELD DETAIL DRAWER (字段语义上下文抽屉)                  */}
      {/* ========================================================= */}
      {selectedFieldDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[480px] bg-white h-full shadow-2xl border-l border-[#E2E8F0] flex flex-col animate-in slide-in-from-right duration-200 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-white">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-[#64748B]">
                  字段语义上下文
                </div>
                <div className="text-base font-bold text-[#0F172A] flex items-center space-x-2">
                  <span>{selectedFieldDetail.cnName}</span>
                  <code className="text-xs font-mono text-[#475569] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                    {selectedFieldDetail.name}
                  </code>
                </div>
              </div>

              <button
                onClick={() => setSelectedFieldDetail(null)}
                className="p-1.5 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* 1. 业务定义 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#64748B]">业务定义</label>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#334155] leading-relaxed">
                  {selectedFieldDetail.description}
                </div>
              </div>

              {/* 2. 字段基础属性 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E2E8F0] rounded space-y-1">
                  <div className="text-[10px] text-[#64748B]">数据类型</div>
                  <div className="font-mono font-bold text-[#0F172A]">
                    {selectedFieldDetail.type}
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E2E8F0] rounded space-y-1">
                  <div className="text-[10px] text-[#64748B]">业务角色</div>
                  <div className="font-bold text-[#2563EB]">
                    {selectedFieldDetail.role}
                  </div>
                </div>
              </div>

              {/* 3. 关联业务对象 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#64748B]">关联业务对象</label>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-bold text-[#0F172A]">自然人 (Person)</span>
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
                  <label className="text-[11px] font-semibold text-[#64748B]">关联正式业务术语</label>
                  <div className="p-3 bg-white border border-[#E2E8F0] rounded text-[#334155]">
                    {selectedFieldDetail.businessTerm}
                  </div>
                </div>
              )}

              {/* 5. 正式标准映射 */}
              {selectedFieldDetail.standardMapping && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#64748B]">正式数据标准映射</label>
                  <div className="p-3 bg-white border border-[#E2E8F0] rounded flex items-center justify-between">
                    <code className="font-mono text-[#2563EB] font-bold">
                      {selectedFieldDetail.standardMapping}
                    </code>
                    <button
                      onClick={() => handleCopyText(selectedFieldDetail.standardMapping!, 'standard')}
                      className="text-[#64748B] hover:text-[#0F172A] flex items-center space-x-1 cursor-pointer"
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
                <label className="text-[11px] font-semibold text-[#64748B]">技术元数据规范</label>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5">
                  <div className="flex justify-between text-[#64748B]">
                    <span>主键标识 (PK):</span>
                    <span className="font-semibold text-[#0F172A]">{selectedFieldDetail.isKey ? '是' : '否'}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>可为空约束 (Nullable):</span>
                    <span className="font-semibold text-[#0F172A]">{selectedFieldDetail.isKey ? '否 (NOT NULL)' : '是 (NULLABLE)'}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>脱敏安全策略:</span>
                    <span className="font-semibold text-[#16A36A]">
                      {selectedFieldDetail.name.includes('hash') || selectedFieldDetail.name.includes('id_card') ? '哈希不可逆散列' : '无需脱敏'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setSelectedFieldDetail(null)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-semibold text-xs rounded cursor-pointer transition-colors"
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[520px] bg-white h-full shadow-2xl border-l border-[#E2E8F0] flex flex-col animate-in slide-in-from-right duration-200 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-white">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-[#64748B]">
                  数据可用性与质量摘要
                </div>
                <div className="text-base font-bold text-[#0F172A]">
                  人口基本信息视图 · 状态评估
                </div>
              </div>

              <button
                onClick={() => setIsFitnessDrawerOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              
              {/* 核心结论 */}
              <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded space-y-2">
                <div className="flex items-center space-x-2 text-[#92400E] font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>数据可用性评估：适度可用 (存在新鲜度提醒)</span>
                </div>
                <p className="text-xs text-[#92400E] leading-relaxed">
                  当前数据可以用于历史人口、人口结构和老龄化分析；如果用于当日实时统计，建议先确认最新同步状态。
                </p>
              </div>

              {/* 1. 质量维度评估 */}
              <div className="space-y-3">
                <div className="font-bold text-[#0F172A] text-xs">
                  核心质量指标评估
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0F172A]">主键完整性 (Completeness)</div>
                      <div className="text-[11px] text-[#64748B]">person_id 主键无空值率</div>
                    </div>
                    <span className="font-bold text-[#16A36A] text-sm">100%</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0F172A]">行政区划合规率 (Validity)</div>
                      <div className="text-[11px] text-[#64748B]">符合 2024 国标行政区划编码规则</div>
                    </div>
                    <span className="font-bold text-[#16A36A] text-sm">99.85%</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0F172A]">数据新鲜度时延 (Timeliness)</div>
                      <div className="text-[11px] text-[#64748B]">前置库到集市同步延迟约 4 小时</div>
                    </div>
                    <span className="font-bold text-[#D97706] text-sm">T+1 每日</span>
                  </div>
                </div>
              </div>

              {/* 2. 建议适用场景与规避场景 */}
              <div className="space-y-3">
                <div className="font-bold text-[#0F172A] text-xs">
                  业务适用建议
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] space-y-1">
                    <div className="font-bold">✓ 推荐使用</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                      <li>全区人口结构历史宏观分析</li>
                      <li>各街镇老龄化率中长期规划</li>
                      <li>常住人口与户籍对比调研</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded bg-[#FFF7ED] border border-[#FFEDD5] text-[#9A3412] space-y-1">
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
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsFitnessDrawerOpen(false)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-semibold text-xs rounded cursor-pointer transition-colors"
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
        onSuccessSubmit={(decision) => {
          if (isAutoAllowed(decision)) {
            setAccessState('granted');
          }
        }}
        addToast={addToast}
      />

    </div>
  );
};
