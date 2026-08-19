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
  Workflow,
  FolderTree,
  SlidersHorizontal,
  FileText
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
    id: 'res-02',
    name: '人口基本信息视图',
    type: 'DATA_ASSET',
    subType: 'VIEW',
    description: '记录自然人的主体标识、出生日期、常住状态及行政区域等基础信息。',
    role: '核心数据',
    accessStatus: 'restricted',
    accessLabel: '需申请'
  },
  {
    id: 'res-03',
    name: '老龄化率',
    type: 'METRIC',
    description: '衡量 60 周岁及以上常住人口占全部常住人口的比例。',
    role: '相关指标',
    accessStatus: 'available',
    accessLabel: '正式指标'
  },
  {
    id: 'res-07',
    name: '常住人口数',
    type: 'METRIC',
    description: '表示指定统计范围内常住人口主体数量。',
    role: '相关指标',
    accessStatus: 'available',
    accessLabel: '正式指标'
  },
  {
    id: 'res-04',
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
              setActiveSideNav('discovery');
              onNavigateToDiscovery?.();
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
              onBackToResources?.();
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
              setActiveSideNav('my_requests');
              onNavigateToMyRequests?.();
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
                与当前目标「{goalQuery}」相关：<strong className="font-semibold text-[#1E40AF]">自然人</strong> 是该分析场景的核心业务概念实体。
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
              <span className="text-[#0F172A] font-semibold">自然人</span>
            </div>

            <button
              onClick={onBackToResources}
              className="inline-flex items-center space-x-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回资源</span>
            </button>
          </div>

          {/* ======================================================= */}
          {/* II. FLAT ENTITY HEADER (No Hero Card)                    */}
          {/* ======================================================= */}
          <div className="space-y-3.5">
            {/* Title Line */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                自然人
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] text-xs font-semibold">
                BUSINESS OBJECT
              </span>
              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-medium">
                正式业务对象
              </span>
            </div>

            <div className="text-xs text-[#64748B] font-mono">
              Person · bo_person
            </div>

            {/* Formal Business Definition Paragraph */}
            <p className="text-sm text-[#334155] leading-relaxed">
              人口与公共服务业务中的个人主体，用于统一表达人口身份、人口属性以及个人与行政区域、家庭和公共服务之间的业务关系。
            </p>

            {/* Business Context & Tags */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs pt-1">
              <div className="flex items-center space-x-1.5 text-[#475569]">
                <span className="text-[#64748B]">主业务域：</span>
                <span className="text-[#0F172A] font-medium">人口服务 · 公共服务</span>
              </div>

              <div className="flex items-center space-x-1.5 text-[#475569]">
                <span className="text-[#64748B]">定位：</span>
                <span className="text-[#0F172A] font-medium">
                  企业统一语义主体概念 · 支撑全域数据对齐
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* III. CORE FACTS (横向事实带，不做四张统计卡)             */}
          {/* ======================================================= */}
          <div className="flex flex-wrap items-center justify-between py-3 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs gap-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">主体类型：</span>
              <span className="font-bold text-[#0F172A]">个人主体 (Person)</span>
            </div>

            <div className="h-3.5 w-px bg-[#CBD5E1] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">常见称谓：</span>
              <span className="font-bold text-[#0F172A]">人口 · 居民 · 个人</span>
            </div>

            <div className="h-3.5 w-px bg-[#CBD5E1] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">承载资源：</span>
              <span className="font-bold text-[#0F172A] flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                <span>12 资产 · 7 指标 · 3 API</span>
              </span>
            </div>

            <div className="h-3.5 w-px bg-[#CBD5E1] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-[#64748B]">概念状态：</span>
              <span className="font-bold text-[#0F172A] flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span>已发布正式生效</span>
              </span>
            </div>
          </div>

          {/* ======================================================= */}
          {/* IV. 核心属性 (Core Attributes - High Density Table)       */}
          {/* ======================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                  <Table className="w-4 h-4 text-[#2563EB]" />
                  <span>核心属性</span>
                </h2>
                <p className="text-xs text-[#64748B]">
                  自然人在企业业务语义模型中的核心定义属性（非物理字段类型）
                </p>
              </div>

              <button
                onClick={() => setIsAllAttributesDrawerOpen(true)}
                className="inline-flex items-center space-x-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold cursor-pointer transition-colors"
              >
                <span>查看全部属性 ({ALL_ATTRIBUTES.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="border border-[#E2E8F0] rounded overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <th className="py-2.5 px-4 w-[28%]">业务属性</th>
                    <th className="py-2.5 px-4">业务含义</th>
                    <th className="py-2.5 px-4 text-right w-36">探索</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {CORE_ATTRIBUTES.map((attr) => (
                    <tr key={attr.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A] flex items-center space-x-2">
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
                          className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold hover:underline cursor-pointer transition-colors"
                        >
                          查看承载资源 →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ======================================================= */}
          {/* V. 业务关系 (Business Relationships - Flat Semantic Flow) */}
          {/* ======================================================= */}
          <section className="space-y-3">
            <div className="space-y-0.5 pb-2 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                <Workflow className="w-4 h-4 text-[#7C3AED]" />
                <span>业务关系</span>
              </h2>
              <p className="text-xs text-[#64748B]">
                表达业务世界的正式关系语义（业务关系 ≠ 数据库物理外键 Join）
              </p>
            </div>

            <div className="border border-[#E2E8F0] rounded divide-y divide-[#F1F5F9] text-xs">
              {BUSINESS_RELATIONSHIPS.map((rel) => (
                <div
                  key={rel.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                        {rel.source}
                      </span>
                      <span className="text-[11px] text-[#7C3AED] font-semibold flex items-center space-x-1 px-1.5 py-0.2 bg-[#F5F3FF] rounded border border-[#DDD6FE]">
                        <span>— {rel.relation} →</span>
                      </span>
                      <span className="font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
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
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold shrink-0 cursor-pointer flex items-center space-x-0.5"
                  >
                    <span>查看{rel.target}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ======================================================= */}
          {/* VI. 相关资源 (Related Resources - Flat High-Density Grid)  */}
          {/* ======================================================= */}
          <section id="section-related-resources" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                  <Network className="w-4 h-4 text-[#2563EB]" />
                  <span>相关资源</span>
                </h2>
                <p className="text-xs text-[#64748B]">
                  承载该业务概念的数据资产、已注册指标与对外开放的数据服务 API
                </p>
              </div>

              <button
                onClick={() => {
                  onExploreResourcesForObject?.('自然人');
                  addToast?.('info', '全部相关资源', '已在资源超市中筛选归属于「自然人」的全部资源');
                }}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center space-x-0.5 cursor-pointer"
              >
                <span>查看全部相关资源</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Flat Compact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {RELATED_RESOURCES.map((res) => (
                <div
                  key={res.id}
                  className="p-3 border border-[#E2E8F0] rounded hover:border-[#2563EB] transition-all bg-white flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] truncate max-w-[130px]" title={res.name}>
                        {res.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        res.type === 'DATA_ASSET'
                          ? 'bg-[#EFF6FF] text-[#2563EB]'
                          : res.type === 'METRIC'
                          ? 'bg-[#F0FDF4] text-[#166534]'
                          : 'bg-[#F5F3FF] text-[#7C3AED]'
                      }`}>
                        {res.type === 'DATA_ASSET' ? 'DATA ASSET' : res.type === 'METRIC' ? 'METRIC' : 'DATA API'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                      <span>角色：{res.role}</span>
                      <span className={res.accessStatus === 'available' ? 'text-[#16A36A] font-medium' : 'text-[#D97706] font-medium'}>
                        {res.accessLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#475569] leading-relaxed line-clamp-2">
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
                    className="pt-1.5 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center justify-between cursor-pointer"
                  >
                    <span>查看详情</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. LIGHTWEIGHT RIGHT USE RAIL (Flat Sidebar)              */}
      {/* ========================================================= */}
      <aside className="w-[300px] xl:w-[320px] bg-white border-l border-[#E2E8F0] flex flex-col shrink-0 overflow-y-auto select-none p-6 space-y-5">
        
        {/* Rail Title */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
            使用与探索
          </h3>
          <span className="text-[11px] font-mono text-[#7C3AED]">
            BUSINESS OBJECT
          </span>
        </div>

        {/* Section 1: 语义概念说明 */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">概念状态</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
              <span>正式业务对象</span>
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            业务对象为企业统一概念主体，不可直接作为物理表查询；请通过关联的数据资产、指标或 API 获取真实数据。
          </p>
        </div>

        <div className="h-px bg-[#E2E8F0]" />

        {/* Section 2: 详细元数据项 */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">主业务域</span>
            <span className="font-semibold text-[#0F172A]">人口服务</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">关联业务域</span>
            <span className="font-semibold text-[#0F172A]">公共服务 · 养老服务</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">下属数据资产</span>
            <span className="font-mono font-semibold text-[#0F172A]">12 项</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">注册指标</span>
            <span className="font-mono font-semibold text-[#0F172A]">7 项</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">开放 API</span>
            <span className="font-mono font-semibold text-[#0F172A]">3 项</span>
          </div>
        </div>

        <div className="h-px bg-[#E2E8F0]" />

        {/* Section 3: 维护团队 */}
        <div className="space-y-1.5 text-xs">
          <div className="text-[#64748B]">维护团队</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-5 h-5 rounded bg-[#F1F5F9] flex items-center justify-center text-[#475569]">
                <Building2 className="w-3 h-3" />
              </div>
              <span className="font-semibold text-[#0F172A]">人口业务治理团队</span>
            </div>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer"
            >
              联系团队 →
            </button>
          </div>
        </div>

        <div className="h-px bg-[#E2E8F0]" />

        {/* Section 4: CTAs */}
        <div className="space-y-2 pt-1">
          {/* Primary CTA: 查看相关资源 */}
          <button
            onClick={() => {
              onExploreResourcesForObject?.('自然人');
              addToast?.('info', '查看相关资源', '已在资源超市中筛选「自然人」的全部数据资产、指标与 API');
            }}
            className="w-full py-2 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>查看相关资源</span>
          </button>

          {/* Secondary CTA: 基于此对象找数 */}
          <button
            onClick={() => {
              onFindDataWithObjectGoal?.('自然人');
              addToast?.('info', '基于此对象找数', '已将「自然人」作为已知语义上下文载入目标找数');
            }}
            className="w-full py-2 px-4 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
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
            className="w-full py-1.5 px-4 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Network className="w-3.5 h-3.5 text-[#64748B]" />
            <span>进入知识网络 →</span>
          </button>
        </div>

      </aside>

      {/* ========================================================= */}
      {/* 4. ALL ATTRIBUTES DRAWER (全部属性抽屉)                     */}
      {/* ========================================================= */}
      {isAllAttributesDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150">
          <div
            className="absolute inset-0"
            onClick={() => setIsAllAttributesDrawerOpen(false)}
          />

          <div
            className="relative w-full max-w-[560px] bg-white h-full shadow-2xl border-l border-[#E2E8F0] flex flex-col z-10 animate-in slide-in-from-right duration-200 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-white">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-[#0F172A]">自然人 · 全部业务属性</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F5F3FF] text-[#7C3AED] rounded border border-[#DDD6FE]">
                    共 {ALL_ATTRIBUTES.length} 项
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">企业业务语义模型中的全部已生效属性定义</p>
              </div>

              <button
                onClick={() => setIsAllAttributesDrawerOpen(false)}
                className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 text-xs">
              <div className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded overflow-hidden bg-white">
                {ALL_ATTRIBUTES.map((attr) => (
                  <div key={attr.id} className="p-3.5 hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#0F172A]">{attr.name}</span>
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

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsAllAttributesDrawerOpen(false)}
                className="px-4 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] text-xs font-bold rounded cursor-pointer transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. CONTACT TEAM MODAL                                     */}
      {/* ========================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded shadow-2xl border border-[#E2E8F0] max-w-md w-full p-6 space-y-5 text-xs text-[#0F172A] animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0F172A]">
                  联系人口业务治理团队
                </h3>
                <p className="text-xs text-[#64748B]">
                  自然人业务概念、语义属性与口径咨询
                </p>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded p-4">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">责任架构师</span>
                <span className="font-bold text-[#0F172A]">李工（人口数据主数据专家）</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">企微 / 钉钉群</span>
                <span className="font-mono font-bold text-[#2563EB]">#Semovix-人口业务对象治理群</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">联系邮箱</span>
                <span className="font-mono text-[#0F172A]">li.ming@semovix.enterprise</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="px-4 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded cursor-pointer transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setIsContactModalOpen(false);
                  addToast?.('success', '已发起企业通讯会话', '已在企业 IM 中拉起「人口业务对象治理」群聊');
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded cursor-pointer transition-colors"
              >
                发起企业协同
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
