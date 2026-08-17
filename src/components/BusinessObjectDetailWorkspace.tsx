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
  Users,
  Building2,
  Table,
  BarChart3,
  Globe,
  Share2,
  Copy,
  Check,
  Info,
  Shield,
  ArrowRight,
  Network,
  Lock,
  Unlock,
  MessageSquare,
  Sparkle
} from 'lucide-react';

export interface BusinessObjectDetailWorkspaceProps {
  objectId?: string;
  fromGoalSearch?: boolean;
  goalQuery?: string;
  onBackToResources?: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToDataAssetDetail?: (assetId: string) => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToApiDetail?: (apiId: string) => void;
  onNavigateToKnowledgeNetwork?: (objectId: string) => void;
  onExploreResourcesForObject?: (objectName: string, attributeName?: string) => void;
  onFindDataWithObjectGoal?: (objectName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

interface CoreAttributeItem {
  id: string;
  name: string;
  meaning: string;
  domainContext?: string;
}

const CORE_ATTRIBUTES: CoreAttributeItem[] = [
  { id: 'attr-1', name: '身份标识', meaning: '唯一识别一个自然人主体', domainContext: '全域主键' },
  { id: 'attr-2', name: '姓名', meaning: '自然人在业务中的名称', domainContext: '基础身份' },
  { id: 'attr-3', name: '出生日期', meaning: '表示自然人的出生时间，支撑年龄分析', domainContext: '人口属性' },
  { id: 'attr-4', name: '性别', meaning: '表示人口性别属性', domainContext: '人口属性' },
  { id: 'attr-5', name: '常住状态', meaning: '表示当前是否属于常住人口范围', domainContext: '统计属性' },
  { id: 'attr-6', name: '户籍状态', meaning: '表示当前户籍业务状态', domainContext: '管理属性' },
  { id: 'attr-7', name: '所属行政区域', meaning: '表示自然人当前所属或统计地域范围', domainContext: '空间属性' },
];

const ALL_ATTRIBUTES: CoreAttributeItem[] = [
  ...CORE_ATTRIBUTES,
  { id: 'attr-8', name: '民族代码', meaning: '表示自然人民族归属代码 (GB/T 3304)', domainContext: '人口属性' },
  { id: 'attr-9', name: '文化程度', meaning: '自然人最高学历或受教育程度分类', domainContext: '人口素质' },
  { id: 'attr-10', name: '婚姻状况', meaning: '自然人法定婚姻状态（未婚/已婚/离异/丧偶）', domainContext: '家庭属性' },
  { id: 'attr-11', name: '联系电话', meaning: '自然人当前有效联络通讯方式', domainContext: '服务联络' },
  { id: 'attr-12', name: '居住地详细地址', meaning: '自然人实际常住空间门牌与地理位置', domainContext: '空间属性' },
  { id: 'attr-13', name: '户籍地详细地址', meaning: '自然人户口簿登记的法定住所地址', domainContext: '空间属性' },
  { id: 'attr-14', name: '养老服务状态', meaning: '是否享受政府或社区兜底养老待遇及照护等级', domainContext: '公共服务' },
];

interface BusinessRelationshipItem {
  id: string;
  source: string;
  relation: string;
  target: string;
  targetId: string;
  description: string;
}

const BUSINESS_RELATIONSHIPS: BusinessRelationshipItem[] = [
  {
    id: 'rel-1',
    source: '自然人',
    relation: '居住于',
    target: '行政区域',
    targetId: 'bo_region',
    description: '表示自然人当前居住或统计归属的地域范围。'
  },
  {
    id: 'rel-2',
    source: '自然人',
    relation: '属于',
    target: '家庭',
    targetId: 'bo_household',
    description: '表示自然人与家庭主体之间的业务归属关系。'
  },
  {
    id: 'rel-3',
    source: '自然人',
    relation: '产生',
    target: '服务工单',
    targetId: 'bo_service_ticket',
    description: '表示自然人在公共服务过程中形成的服务请求或事项记录。'
  },
  {
    id: 'rel-4',
    source: '自然人',
    relation: '接受服务',
    target: '服务事项',
    targetId: 'bo_service_item',
    description: '表示自然人与公共服务事项之间的业务关系。'
  }
];

interface RelatedResourceItem {
  id: string;
  name: string;
  type: 'DATA_ASSET' | 'METRIC' | 'DATA_API';
  subType?: string;
  description: string;
  role: string;
  accessStatus?: 'available' | 'restricted';
  accessLabel?: string;
}

const RELATED_RESOURCES: RelatedResourceItem[] = [
  {
    id: 'view_pop_basic_info',
    name: '人口基本信息视图',
    type: 'DATA_ASSET',
    subType: 'VIEW',
    description: '记录自然人的主体标识、出生日期、常住状态及行政区域等基础信息。',
    role: '核心数据',
    accessStatus: 'restricted',
    accessLabel: '需申请'
  },
  {
    id: 'metric_aging_rate',
    name: '老龄化率',
    type: 'METRIC',
    description: '衡量 60 周岁及以上常住人口占全部常住人口的比例。',
    role: '相关指标',
    accessStatus: 'available',
    accessLabel: '正式指标'
  },
  {
    id: 'metric_resident_pop_count',
    name: '常住人口数',
    type: 'METRIC',
    description: '表示指定统计范围内常住人口主体数量。',
    role: '相关指标',
    accessStatus: 'available',
    accessLabel: '正式指标'
  },
  {
    id: 'api_pop_stat_query',
    name: '人口统计查询 API',
    type: 'DATA_API',
    description: '按区域、年龄范围与统计期提供人口统计查询能力。',
    role: '数据服务',
    accessStatus: 'restricted',
    accessLabel: '需申请'
  }
];

export const BusinessObjectDetailWorkspace: React.FC<BusinessObjectDetailWorkspaceProps> = ({
  objectId = 'bo_person',
  fromGoalSearch = false,
  goalQuery = '分析各街镇老龄化情况',
  onBackToResources,
  onNavigateToDiscovery,
  onNavigateToMyRequests,
  onNavigateToDataAssetDetail,
  onNavigateToMetricDetail,
  onNavigateToApiDetail,
  onNavigateToKnowledgeNetwork,
  onExploreResourcesForObject,
  onFindDataWithObjectGoal,
  addToast
}) => {
  // Navigation inside Marketplace Sidebar
  const [activeSideNav, setActiveSideNav] = useState<'discovery' | 'resources' | 'my_requests'>('resources');

  // Drawers & Modals
  const [isAllAttributesDrawerOpen, setIsAllAttributesDrawerOpen] = useState<boolean>(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(label);
    addToast?.('success', '已复制到剪贴板', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] font-sans antialiased relative select-none">
      
      {/* ========================================================= */}
      {/* 1. MARKETPLACE SIDEBAR (210–220px)                         */}
      {/* ========================================================= */}
      <aside className="w-[210px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none z-10">
        <div className="p-4 border-b border-[#E6EAF0]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#172033] tracking-tight">数据服务超市</h2>
              <p className="text-[10px] text-[#667085]">Data Marketplace</p>
            </div>
          </div>
        </div>

        <div className="p-2.5 flex-1 space-y-1">
          <button
            onClick={() => {
              setActiveSideNav('discovery');
              onNavigateToDiscovery?.();
            }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
              activeSideNav === 'discovery'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>发现</span>
          </button>

          <button
            onClick={() => {
              setActiveSideNav('resources');
              onBackToResources?.();
            }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
              activeSideNav === 'resources'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>资源</span>
          </button>

          <button
            onClick={() => {
              setActiveSideNav('my_requests');
              onNavigateToMyRequests?.();
            }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
              activeSideNav === 'my_requests'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>我的申请</span>
          </button>
        </div>

        {/* AI Partner Footer (Xino) */}
        <div className="p-3.5 border-t border-[#EEF2F6] bg-[#FAFCFF]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#172033] flex items-center space-x-1">
                <span>Xino｜犀诺</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              </div>
              <div className="text-[10px] text-[#667085]">企业 AI 语义伙伴</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN BUSINESS OBJECT DETAIL (72% Main + 28% Right Rail) */}
      {/* ========================================================= */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Main Content Scrollable Area (72%) */}
        <div className="flex-1 overflow-y-auto bg-[#F7F9FC]">
          <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
            
            {/* Top Navigation & Breadcrumb */}
            <div className="space-y-1.5">
              <button
                onClick={onBackToResources}
                className="inline-flex items-center space-x-1.5 text-xs text-[#667085] hover:text-[#2563EB] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回资源</span>
              </button>

              <div className="flex items-center space-x-2 text-xs text-[#98A2B3]">
                <span onClick={onNavigateToDiscovery} className="hover:text-[#667085] cursor-pointer">数据服务超市</span>
                <span>/</span>
                <span onClick={onBackToResources} className="hover:text-[#667085] cursor-pointer">资源</span>
                <span>/</span>
                <span className="text-[#475569] font-medium">自然人</span>
              </div>
            </div>

            {/* Goal Search Condition Context Notice (If navigated from goal search) */}
            {fromGoalSearch && (
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-md px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-[#1E40AF]">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>与当前目标相关：<strong>自然人</strong>是「{goalQuery}」的核心业务对象。</span>
                </div>
                <button
                  onClick={onBackToResources}
                  className="text-xs text-[#2563EB] font-semibold hover:underline cursor-pointer"
                >
                  返回当前数据方案
                </button>
              </div>
            )}

            {/* ======================================================= */}
            {/* RESOURCE HEADER                                         */}
            {/* ======================================================= */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] font-mono">
                      BUSINESS OBJECT
                    </span>
                    <span className="text-xs text-[#98A2B3] font-mono">
                      Person
                    </span>
                    <span className="text-[11px] text-[#CBD5E1] font-mono">
                      bo_person
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                    自然人
                  </h1>

                  {/* Formal Business Definition */}
                  <p className="text-xs text-[#334155] leading-relaxed pt-1">
                    人口与公共服务业务中的个人主体，用于统一表达人口身份、人口属性以及个人与行政区域、家庭和公共服务之间的业务关系。
                  </p>

                  <div className="flex items-center space-x-3 pt-1 text-xs">
                    <span className="text-[#667085]">
                      人口服务 · 公共服务
                    </span>
                    <span className="text-[#CBD5E1]">·</span>
                    <span className="text-[#16A36A] font-medium flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                      <span>正式业务对象</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleCopyText('bo_person', 'ID')}
                    className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] border border-[#E6EAF0] transition-colors cursor-pointer"
                    title="复制对象标识"
                  >
                    {copiedKey === 'ID' ? <Check className="w-3.5 h-3.5 text-[#16A36A]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Facts Strip (No nested card, subtle borders) */}
              <div className="border-t border-[#EEF2F6] pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-[#98A2B3]">主业务域</div>
                  <div className="font-semibold text-[#172033]">人口服务</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-[#98A2B3]">业务身份</div>
                  <div className="font-semibold text-[#172033]">个人主体</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-[#98A2B3]">常见业务称谓</div>
                  <div className="font-semibold text-[#172033]">人口 · 居民 · 个人</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-[#98A2B3]">关联范围</div>
                  <div className="font-semibold text-[#172033]">数据资产 · 指标 · 数据 API</div>
                </div>
              </div>
            </div>

            {/* ======================================================= */}
            {/* 1. CORE ATTRIBUTES                                      */}
            {/* ======================================================= */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-[#172033]">核心属性</h2>
                  <p className="text-[11px] text-[#667085]">
                    自然人在企业业务语义模型中的核心定义属性（非物理字段类型）。
                  </p>
                </div>

                <button
                  onClick={() => setIsAllAttributesDrawerOpen(true)}
                  className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <span>查看全部属性</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Two-Column Business Attribute Table */}
              <div className="overflow-hidden border border-[#E6EAF0] rounded-md">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B]">
                      <th className="py-2.5 px-4 font-semibold w-1/3">业务属性</th>
                      <th className="py-2.5 px-4 font-semibold">业务含义</th>
                      <th className="py-2.5 px-4 font-semibold text-right w-36">探索</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F6]">
                    {CORE_ATTRIBUTES.map((attr) => (
                      <tr key={attr.id} className="hover:bg-[#F8FAFC] transition-colors group">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#172033] flex items-center space-x-2">
                            <span>{attr.name}</span>
                            {attr.domainContext && (
                              <span className="text-[10px] font-normal px-1.5 py-0.2 bg-[#F1F5F9] text-[#64748B] rounded border border-[#E2E8F0]">
                                {attr.domainContext}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#475569] leading-relaxed">
                          {attr.meaning}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              onExploreResourcesForObject?.('自然人', attr.name);
                              addToast?.('info', '查看承载资源', `已筛选承载「${attr.name}」属性的真实数据资产`);
                            }}
                            className="text-[11px] text-[#64748B] group-hover:text-[#2563EB] font-medium hover:underline cursor-pointer transition-colors"
                          >
                            查看承载资源 →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ======================================================= */}
            {/* 2. BUSINESS RELATIONSHIPS                               */}
            {/* ======================================================= */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
              <div className="space-y-0.5 border-b border-[#EEF2F6] pb-3">
                <h2 className="text-sm font-bold text-[#172033]">业务关系</h2>
                <p className="text-[11px] text-[#667085]">
                  表达业务世界的正式关系语义（业务关系 ≠ 数据库物理 Join）。
                </p>
              </div>

              {/* Relationship Rows */}
              <div className="space-y-2.5">
                {BUSINESS_RELATIONSHIPS.map((rel) => (
                  <div
                    key={rel.id}
                    className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-[#CBD5E1] transition-all"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-bold text-[#172033] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {rel.source}
                        </span>
                        <span className="text-[11px] text-[#4F46E5] font-semibold flex items-center space-x-1 px-1.5 py-0.2 bg-[#EEF2FF] rounded border border-[#C7D2FE]">
                          <span>— {rel.relation} →</span>
                        </span>
                        <span className="font-bold text-[#172033] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {rel.target}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed pt-0.5">
                        {rel.description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        addToast?.('info', `业务对象 · ${rel.target}`, `已查看「${rel.target}」业务对象概况`);
                      }}
                      className="text-xs text-[#2563EB] hover:underline font-semibold shrink-0 cursor-pointer flex items-center space-x-1"
                    >
                      <span>查看{rel.target}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ======================================================= */}
            {/* 3. RELATED RESOURCES                                    */}
            {/* ======================================================= */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-baseline space-x-2">
                    <h2 className="text-sm font-bold text-[#172033]">相关资源</h2>
                    <span className="text-[11px] text-[#98A2B3]">
                      当前权限范围内可发现的真实资源
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    承载该业务概念的数据资产、已注册指标与对外开放的数据服务 API。
                  </p>
                </div>

                <button
                  onClick={() => {
                    onExploreResourcesForObject?.('自然人');
                    addToast?.('info', '全部相关资源', '已在资源超市中筛选归属于「自然人」的全部资源');
                  }}
                  className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <span>查看全部相关资源</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Resource Rows (Unified Resource Space View) */}
              <div className="divide-y divide-[#EEF2F6] border border-[#E6EAF0] rounded-md overflow-hidden bg-white">
                {RELATED_RESOURCES.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {res.type === 'DATA_ASSET' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#2563EB] rounded border border-[#E2E8F0] font-mono flex items-center space-x-1">
                            <Table className="w-3 h-3" />
                            <span>DATA ASSET · {res.subType || 'TABLE'}</span>
                          </span>
                        )}
                        {res.type === 'METRIC' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] rounded border border-[#BFDBFE] font-mono flex items-center space-x-1">
                            <BarChart3 className="w-3 h-3" />
                            <span>METRIC</span>
                          </span>
                        )}
                        {res.type === 'DATA_API' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F5F3FF] text-[#7C3AED] rounded border border-[#DDD6FE] font-mono flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <span>DATA API</span>
                          </span>
                        )}

                        <h4 className="text-xs font-bold text-[#172033]">
                          {res.name}
                        </h4>

                        <span className="text-[11px] text-[#667085] px-1.5 py-0.2 bg-[#F8FAFC] rounded border border-[#EEF2F6]">
                          角色：{res.role}
                        </span>

                        {res.accessStatus && (
                          <span className="text-[11px] flex items-center space-x-1">
                            {res.accessStatus === 'available' ? (
                              <span className="text-[#16A36A] flex items-center space-x-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                                <span>{res.accessLabel}</span>
                              </span>
                            ) : (
                              <span className="text-[#D97706] flex items-center space-x-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                                <span>{res.accessLabel}</span>
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed">
                        {res.description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (res.type === 'DATA_ASSET') {
                          onNavigateToDataAssetDetail?.(res.id);
                        } else if (res.type === 'METRIC') {
                          onNavigateToMetricDetail?.(res.id);
                        } else if (res.type === 'DATA_API') {
                          onNavigateToApiDetail?.(res.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded text-xs text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      查看 →
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================= */}
        {/* RIGHT RAIL: 探索 (28% Fixed Rail)                        */}
        {/* ======================================================= */}
        <aside className="w-[300px] xl:w-[320px] bg-white border-l border-[#E6EAF0] flex flex-col shrink-0 overflow-y-auto select-none">
          <div className="p-6 space-y-6">
            
            {/* Rail Header */}
            <div className="space-y-1 border-b border-[#EEF2F6] pb-4">
              <h3 className="text-sm font-bold text-[#172033]">探索</h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                从当前业务对象继续进入关联资源、目标找数或知识网络。
              </p>
            </div>

            {/* Belonging Domain */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-[#98A2B3] font-medium">主业务域</div>
              <div className="text-xs font-bold text-[#172033]">人口服务</div>
              <div className="text-[11px] text-[#667085]">关联：公共服务 · 养老服务</div>
            </div>

            {/* Object State (Formal Only) */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-[#98A2B3] font-medium">对象状态</div>
              <div className="text-xs font-bold text-[#16A36A] flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span>正式业务对象</span>
              </div>
              <p className="text-[11px] text-[#667085] leading-relaxed">
                当前业务定义已正式生效，可用于企业资源发现和语义导航。
              </p>
            </div>

            {/* Maintenance Team */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-[#98A2B3] font-medium">维护团队</div>
              <div className="text-xs font-semibold text-[#172033]">人口业务治理团队</div>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="text-xs text-[#2563EB] hover:underline font-medium cursor-pointer"
              >
                联系团队 →
              </button>
            </div>

            {/* Main Action CTAs */}
            <div className="pt-2 space-y-2.5 border-t border-[#EEF2F6]">
              {/* Primary CTA: 查看相关资源 */}
              <button
                onClick={() => {
                  onExploreResourcesForObject?.('自然人');
                  addToast?.('info', '查看相关资源', '已在资源超市中筛选「自然人」的全部数据资产、指标与 API');
                }}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>查看相关资源</span>
              </button>

              {/* Secondary CTA: 基于此对象找数 */}
              <button
                onClick={() => {
                  onFindDataWithObjectGoal?.('自然人');
                  addToast?.('info', '基于此对象找数', '已将「自然人」作为已知语义上下文载入目标找数');
                }}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>基于此对象找数</span>
              </button>

              {/* Tertiary CTA: 进入知识网络 */}
              <button
                onClick={() => {
                  onNavigateToKnowledgeNetwork?.(objectId);
                  addToast?.('info', '知识网络', '已跳转至企业知识网络查看完整的自然人关系图谱与拓扑');
                }}
                className="w-full py-2 px-3 text-xs text-[#475569] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer flex items-center justify-center space-x-1"
              >
                <Network className="w-3.5 h-3.5 text-[#64748B]" />
                <span>进入知识网络 →</span>
              </button>
            </div>

          </div>
        </aside>

      </main>

      {/* ========================================================= */}
      {/* 3. ALL ATTRIBUTES DRAWER                                  */}
      {/* ========================================================= */}
      {isAllAttributesDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <aside className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-[#172033]">自然人 · 全部业务属性</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EEF2FF] text-[#4F46E5] rounded">
                    共 {ALL_ATTRIBUTES.length} 项
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">企业业务语义模型中的全部已生效属性定义</p>
              </div>

              <button
                onClick={() => setIsAllAttributesDrawerOpen(false)}
                className="p-1.5 rounded hover:bg-[#EEF2F6] text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="divide-y divide-[#EEF2F6] border border-[#E6EAF0] rounded-md overflow-hidden bg-white">
                {ALL_ATTRIBUTES.map((attr) => (
                  <div key={attr.id} className="p-3.5 hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#172033]">{attr.name}</span>
                        {attr.domainContext && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#F1F5F9] text-[#64748B] rounded border border-[#E2E8F0]">
                            {attr.domainContext}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#475569]">{attr.meaning}</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsAllAttributesDrawerOpen(false);
                        onExploreResourcesForObject?.('自然人', attr.name);
                        addToast?.('info', '查看承载资源', `已筛选承载「${attr.name}」属性的真实数据资产`);
                      }}
                      className="text-xs text-[#2563EB] hover:underline font-semibold shrink-0 cursor-pointer"
                    >
                      承载资源 →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-[#E6EAF0] bg-[#FAFCFF] flex justify-end">
              <button
                onClick={() => setIsAllAttributesDrawerOpen(false)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CONTACT TEAM MODAL                                     */}
      {/* ========================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E6EAF0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172033]">联系人口业务治理团队</h3>
              <button onClick={() => setIsContactModalOpen(false)} className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-[#475569]">
              <div className="space-y-1">
                <div className="font-semibold text-[#172033]">责任架构师</div>
                <div>李工（企业人口数据主数据专家）· 企微 / 内部邮件：li.ming@semovix.corp</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-[#172033]">业务口径咨询群</div>
                <div>企微群：Semovix-人口业务对象治理与服务对接群</div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E6EAF0] flex justify-end">
              <button
                onClick={() => {
                  setIsContactModalOpen(false);
                  addToast?.('success', '已发送咨询提醒', '已向治理团队负责人发送业务口径咨询消息');
                }}
                className="px-4 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
