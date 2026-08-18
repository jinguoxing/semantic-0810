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
  BarChart3,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Terminal,
  KeyRound,
  ShieldAlert,
  Server,
  Zap,
  HelpCircle,
  Send,
  Eye,
  Workflow
} from 'lucide-react';
import { SingleResourceAccessRequestDrawer } from './SingleResourceAccessRequestDrawer';

export interface DataApiDetailWorkspaceProps {
  apiId?: string;
  fromGoalSearch?: boolean;
  goalQuery?: string;
  onBackToResources?: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToDataAssetDetail?: (assetId: string) => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToBusinessObject?: (objectId: string) => void;
  onNavigateToResourceExplorerWithQuery?: (query: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

// Request parameter technical definition
interface RequestParamContract {
  businessName: string;
  paramName: string;
  position: 'Query' | 'Path' | 'Header' | 'Body';
  required: boolean;
  dataType: string;
  rules: string;
  example: string;
}

// Response field schema definition with support for nested children
interface ResponseFieldSchema {
  businessName: string;
  field: string;
  type: string;
  meaning: string;
  children?: ResponseFieldSchema[];
}

export const DataApiDetailWorkspace: React.FC<DataApiDetailWorkspaceProps> = ({
  apiId = 'res-04',
  fromGoalSearch = false,
  goalQuery = '分析各街镇老龄化情况',
  onBackToResources,
  onNavigateToDiscovery,
  onNavigateToMyRequests,
  onNavigateToDataAssetDetail,
  onNavigateToMetricDetail,
  onNavigateToBusinessObject,
  onNavigateToResourceExplorerWithQuery,
  addToast
}) => {
  // Navigation inside Marketplace Sidebar
  const [activeSideNav, setActiveSideNav] = useState<'discovery' | 'resources' | 'my_requests'>('resources');

  // Drawers and Modals
  const [isContractDrawerOpen, setIsContractDrawerOpen] = useState<boolean>(false);
  const [isAccessRequestDrawerOpen, setIsAccessRequestDrawerOpen] = useState<boolean>(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);

  // Contract Drawer states
  const [contractResponseStatusTab, setContractResponseStatusTab] = useState<'200' | '400' | '403' | '429'>('200');
  const [contract200ViewMode, setContract200ViewMode] = useState<'schema' | 'example'>('schema');
  const [isAgeDistributionExpanded, setIsAgeDistributionExpanded] = useState<boolean>(true);
  const [isRegionExpanded, setIsRegionExpanded] = useState<boolean>(true);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast?.('success', '已复制到剪贴板', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Request Parameters Contract (Strictly from API Definition)
  const REQUEST_PARAMS: RequestParamContract[] = [
    {
      businessName: '行政区域',
      paramName: 'region_code',
      position: 'Query',
      required: true,
      dataType: 'string',
      rules: '标准行政区划6位代码',
      example: '310112'
    },
    {
      businessName: '年龄下限',
      paramName: 'age_min',
      position: 'Query',
      required: false,
      dataType: 'integer',
      rules: '≥ 0，默认 0',
      example: '60'
    },
    {
      businessName: '年龄上限',
      paramName: 'age_max',
      position: 'Query',
      required: false,
      dataType: 'integer',
      rules: '> age_min（可选）',
      example: '69'
    },
    {
      businessName: '统计期',
      paramName: 'period',
      position: 'Query',
      required: true,
      dataType: 'string',
      rules: '格式 YYYY-MM',
      example: '2026-07'
    },
    {
      businessName: '常住状态',
      paramName: 'residence_status',
      position: 'Query',
      required: false,
      dataType: 'string',
      rules: 'permanent（常住）/ registered（户籍）',
      example: 'permanent'
    }
  ];

  // 200 Response Field Schema (Hierarchical & Expandable)
  const RESPONSE_SCHEMA_FIELDS: ResponseFieldSchema[] = [
    {
      businessName: '人口数量',
      field: 'total_population',
      type: 'integer',
      meaning: '满足当前条件的统计人口总规模'
    },
    {
      businessName: '年龄结构',
      field: 'age_distribution',
      type: 'array<object>',
      meaning: '当前统计人口的年龄段聚合分布结果',
      children: [
        {
          businessName: '年龄段分组',
          field: 'age_group',
          type: 'string',
          meaning: '例如 "60-69"、"70-79"、"80及以上"'
        },
        {
          businessName: '段内人口数',
          field: 'count',
          type: 'integer',
          meaning: '该年龄段内的统计人口数量'
        },
        {
          businessName: '段内占比',
          field: 'percentage',
          type: 'number',
          meaning: '该年龄段占总统计人口的比率 (0.00 ~ 1.00)'
        }
      ]
    },
    {
      businessName: '行政区域',
      field: 'region',
      type: 'object',
      meaning: '当前统计结果对应的地域范围与行政信息',
      children: [
        {
          businessName: '区域编码',
          field: 'region_code',
          type: 'string',
          meaning: '行政区划标准代码（如 "310112"）'
        },
        {
          businessName: '区域名称',
          field: 'region_name',
          type: 'string',
          meaning: '行政区划中文全称（如 "上海市闵行区"）'
        }
      ]
    },
    {
      businessName: '统计期',
      field: 'period',
      type: 'string',
      meaning: '当前统计结果对应的时间所属范围 (YYYY-MM)'
    }
  ];

  // 200 JSON Example Payload (Based on Contract Mock / Synthetic Data)
  const JSON_EXAMPLE_200 = `{
  "code": 200,
  "message": "success",
  "data": {
    "total_population": 128420,
    "region": {
      "region_code": "310112",
      "region_name": "上海市闵行区"
    },
    "period": "2026-07",
    "age_distribution": [
      {
        "age_group": "60-69",
        "count": 23120,
        "percentage": 0.18
      },
      {
        "age_group": "70-79",
        "count": 14280,
        "percentage": 0.111
      },
      {
        "age_group": "80及以上",
        "count": 8940,
        "percentage": 0.0696
      }
    ]
  },
  "meta": {
    "data_version": "20260818-0810",
    "stat_caliber": "permanent_resident",
    "source_view": "v_pop_base_info_view"
  }
}`;

  // Error payloads for Contract Drawer
  const JSON_EXAMPLE_400 = `{
  "code": 400,
  "error": "INVALID_PARAMETER",
  "message": "参数 region_code 格式不符合行政区划编码规则，必须为 6 位数字代码",
  "request_id": "req-98f21e03-a12b"
}`;

  const JSON_EXAMPLE_403 = `{
  "code": 403,
  "error": "PERMISSION_DENIED",
  "message": "未获得「人口统计查询 API」的调用权限 (CALL)，请先在数据服务超市提交申请",
  "request_id": "req-62b109e4-c54d"
}`;

  const JSON_EXAMPLE_429 = `{
  "code": 429,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "接口请求频次超出当前调用配额（当前配额上限：100 QPS）",
  "request_id": "req-71ac90d1-f89a"
}`;

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] font-sans antialiased relative selection:bg-[#EFF6FF] selection:text-[#2563EB]">

      {/* ========================================================= */}
      {/* 1. LEFT MARKETPLACE SIDEBAR (210–220px)                   */}
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
              setActiveSideNav('discovery');
              onNavigateToDiscovery?.();
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
              onBackToResources?.();
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
              setActiveSideNav('my_requests');
              onNavigateToMyRequests?.();
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

        {/* Bottom Fixed AI Partner Card */}
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
      {/* 2. CENTER: MAIN API DETAIL AREA (Scrollable)              */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F7F9FC] transition-all">

        {/* Goal Search Context Banner (If navigated from AI Goal Search) */}
        {fromGoalSearch && (
          <div className="bg-[#EFF6FF] border-b border-[#DBEAFE] px-8 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2.5 text-[#1E40AF]">
              <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>
                当前正在围绕业务目标「<strong className="font-bold">{goalQuery}</strong>」评估数据服务与接入方案
              </span>
            </div>
            <button
              onClick={onBackToResources}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>查看其他候选方案</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Document Container */}
        <div className="p-6 sm:p-8 max-w-[1060px] w-full mx-auto space-y-6">

          {/* Top Navigation & Breadcrumb */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-2 text-xs text-[#64748B]">
              <button
                onClick={onNavigateToDiscovery}
                className="hover:text-[#2563EB] transition-colors cursor-pointer"
              >
                数据服务超市
              </button>
              <span>/</span>
              <button
                onClick={onBackToResources}
                className="hover:text-[#2563EB] transition-colors cursor-pointer"
              >
                资源
              </button>
              <span>/</span>
              <span className="font-semibold text-[#1E293B]">人口统计查询 API</span>
            </nav>

            <button
              onClick={onBackToResources}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#CBD5E1] hover:border-[#2563EB] hover:text-[#2563EB] text-[#334155] rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回资源</span>
            </button>
          </div>

          {/* ------------------------------------------------------- */}
          {/* A. HEADER AREA: Identity & Business Definition           */}
          {/* ------------------------------------------------------- */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                    人口统计查询 API
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                    DATA API
                  </span>
                  <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-mono text-[#475569]">
                    <span className="font-bold text-[#2563EB]">GET</span>
                    <span>/population/statistics</span>
                  </div>
                </div>
                <div className="text-xs text-[#64748B] font-medium">
                  Population Statistics API
                </div>
              </div>
            </div>

            {/* Business Definition Callout */}
            <div className="p-4 bg-[#F8FAFC] border-l-4 border-[#7C3AED] rounded-r-lg text-xs sm:text-sm text-[#334155] leading-relaxed">
              <span className="font-semibold text-[#0F172A]">业务定义：</span>
              根据行政区域、年龄范围和统计期获取人口统计结果，用于人口规模、人口结构、老龄人口及区域人口分析。
            </div>

            {/* Business Context & Applicability */}
            <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-[#475569]">
                <span className="text-[#64748B] font-medium">业务上下文：</span>
                <button
                  onClick={() => onNavigateToBusinessObject?.('bo_person')}
                  className="inline-flex items-center space-x-1 text-[#2563EB] hover:text-[#1D4ED8] font-semibold hover:underline cursor-pointer"
                  title="点击查看自然人业务对象"
                >
                  <User className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>人口服务 · 自然人</span>
                  <ChevronRight className="w-3 h-3 text-[#2563EB]" />
                </button>
              </div>

              <div className="flex items-center space-x-2 text-[#475569]">
                <span className="text-[#64748B] font-medium">适用于：</span>
                <span className="font-medium text-[#1E293B]">
                  区域人口统计 · 老年人口分析 · 年龄结构分析 · 街镇人口比较
                </span>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------- */}
          {/* B. TOP KEY FACTS: One Line of Lightweight Facts         */}
          {/* ------------------------------------------------------- */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl px-6 py-4 shadow-2xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#F1F5F9]">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-[#64748B]">提供能力</div>
                <div className="text-sm font-bold text-[#0F172A]">人口统计查询</div>
              </div>

              <div className="space-y-1 md:pl-4 pt-3 md:pt-0">
                <div className="text-[11px] font-semibold text-[#64748B]">返回形式</div>
                <div className="text-sm font-bold text-[#0F172A] flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                  <span>聚合统计结果</span>
                </div>
              </div>

              <div className="space-y-1 md:pl-4 pt-3 md:pt-0">
                <div className="text-[11px] font-semibold text-[#64748B]">查询粒度</div>
                <div className="text-sm font-bold text-[#0F172A]">行政区域 × 统计期</div>
              </div>

              <div className="space-y-1 md:pl-4 pt-3 md:pt-0">
                <div className="text-[11px] font-semibold text-[#64748B]">数据更新</div>
                <div className="text-sm font-bold text-[#0F172A] flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                  <span>每日</span>
                </div>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------- */}
          {/* C. SERVICE CAPABILITY (服务能力 - Definition Rows)      */}
          {/* ------------------------------------------------------- */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2">
                <Workflow className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-base font-bold text-[#0F172A]">服务能力</h2>
              </div>
              <span className="text-xs text-[#64748B]">
                业务语义映射已与真实接口契约对齐
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Row 1: 可以做什么 */}
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] space-y-1">
                <div className="text-[11px] font-bold text-[#2563EB] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>可以做什么</span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed pl-5 font-medium">
                  根据行政区域、年龄范围、统计期等业务条件，对符合条件的人口进行统计，并返回人口规模及人口结构相关结果。
                </p>
              </div>

              {/* Row 2: 适合用于 */}
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] space-y-1">
                <div className="text-[11px] font-bold text-[#475569] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#475569]" />
                  <span>适合用于</span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed pl-5">
                  区域人口规模分析 / 老年人口统计 / 年龄结构分析 / 街镇人口比较
                </p>
              </div>

              {/* Row 3: 使用边界 (Clear Boundary) */}
              <div className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] space-y-1">
                <div className="text-[11px] font-bold text-[#B45309] flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>使用边界</span>
                </div>
                <p className="text-xs text-[#92400E] leading-relaxed pl-5 font-bold">
                  提供人口统计结果，不用于获取自然人明细记录。如需微观个体数据请申请相关数据资产的受控明细权限。
                </p>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------- */}
          {/* D. CORE MODULE: 业务查询与结果 (Two-Column Layout)       */}
          {/* ------------------------------------------------------- */}
          <section id="section-query-and-results" className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-[#0F172A] flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
                  <span>业务查询与结果</span>
                </h2>
                <p className="text-xs text-[#64748B]">
                  以业务输入与输出为核心投影真实接口契约，无需预先理解底层 HTTP Schema
                </p>
              </div>

              <button
                onClick={() => setIsContractDrawerOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] hover:text-[#6D28D9] border border-[#DDD6FE] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <span>查看接口契约</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Two-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Column: 查询条件 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <span>查询条件 (输入)</span>
                  </h3>
                  <span className="text-[11px] text-[#64748B]">
                    来源于实际 API Parameter
                  </span>
                </div>

                <div className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                        <th className="py-2.5 px-3">业务条件</th>
                        <th className="py-2.5 px-3">业务含义</th>
                        <th className="py-2.5 px-3">示例</th>
                        <th className="py-2.5 px-3 text-right">约束</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      <tr className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">行政区域</td>
                        <td className="py-2.5 px-3 text-[#475569]">指定人口统计地域范围</td>
                        <td className="py-2.5 px-3 font-mono text-[#64748B]">闵行区 / 莘庄镇</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                            必填
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">年龄范围</td>
                        <td className="py-2.5 px-3 text-[#475569]">限定参与统计的人口年龄</td>
                        <td className="py-2.5 px-3 font-mono text-[#64748B]">60岁及以上</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#64748B]">
                            可选
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">统计期</td>
                        <td className="py-2.5 px-3 text-[#475569]">指定统计结果所属时间</td>
                        <td className="py-2.5 px-3 font-mono text-[#64748B]">2026年7月</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                            必填
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">常住状态</td>
                        <td className="py-2.5 px-3 text-[#475569]">限定人口统计业务口径</td>
                        <td className="py-2.5 px-3 font-mono text-[#64748B]">常住人口</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#64748B]">
                            可选
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: 返回结果 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                    <span>返回结果 (输出)</span>
                  </h3>
                  <span className="text-[11px] text-[#64748B]">
                    来源于 Response Schema
                  </span>
                </div>

                <div className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                        <th className="py-2.5 px-3">业务结果</th>
                        <th className="py-2.5 px-3">业务含义</th>
                        <th className="py-2.5 px-3 text-right">技术字段</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      <tr className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">人口数量</td>
                        <td className="py-2.5 px-3 text-[#475569]">满足当前条件的人口规模</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#64748B]">
                          total_population
                        </td>
                      </tr>

                      <tr className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">年龄结构</td>
                        <td className="py-2.5 px-3 text-[#475569]">当前统计人口的年龄分布结果</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#64748B]">
                          age_distribution[]
                        </td>
                      </tr>

                      <tr className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">行政区域</td>
                        <td className="py-2.5 px-3 text-[#475569]">当前统计结果对应的地域范围</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#64748B]">
                          region
                        </td>
                      </tr>

                      <tr className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">统计期</td>
                        <td className="py-2.5 px-3 text-[#475569]">当前统计结果对应的时间范围</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#64748B]">
                          period
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Result Shape Box */}
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#0F172A]">结果形态：</span>
                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] font-bold rounded">
                      聚合统计结果
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    返回符合当前查询条件的人口统计结果，不返回自然人明细。
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* ------------------------------------------------------- */}
          {/* E. DATA BASIS (数据依据 - Formal Execution Dependencies) */}
          {/* ------------------------------------------------------- */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-[#2563EB]" />
                  <h2 className="text-base font-bold text-[#0F172A]">数据依据</h2>
                </div>
                <p className="text-xs text-[#64748B]">
                  展示当前 API 结果建立在哪些正式数据资源之上（严格来自真实数据血缘与网关配置，非语义推断）
                </p>
              </div>

              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B]">
                <Shield className="w-3.5 h-3.5 text-[#16A36A]" />
                <span>Lineage Verified</span>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <th className="py-2.5 px-3">数据资源</th>
                    <th className="py-2.5 px-3">类型</th>
                    <th className="py-2.5 px-3">角色</th>
                    <th className="py-2.5 px-3">提供内容</th>
                    <th className="py-2.5 px-3 text-center">数据状态</th>
                    <th className="py-2.5 px-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {/* Row 1: 人口基本信息视图 */}
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0F172A]">人口基本信息视图</div>
                      <div className="text-[11px] font-mono text-[#64748B]">v_pop_base_info_view</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        DATA ASSET · VIEW
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#0F172A]">核心数据</span>
                    </td>
                    <td className="py-3 px-3 text-[#475569]">
                      出生日期、常住状态、行政区域
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#166534]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                        <span>正常</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigateToDataAssetDetail?.('res-02')}
                        className="text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center space-x-0.5 cursor-pointer"
                      >
                        <span>查看</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 2: 行政区划基础数据 */}
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0F172A]">行政区划基础数据</div>
                      <div className="text-[11px] font-mono text-[#64748B]">dim_region_boundary</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        DATA ASSET
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#0F172A]">分析维度</span>
                    </td>
                    <td className="py-3 px-3 text-[#475569]">
                      街镇、社区、标准区域编码
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#166534]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                        <span>正常</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigateToDataAssetDetail?.('res-01')}
                        className="text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center space-x-0.5 cursor-pointer"
                      >
                        <span>查看</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg text-[11px] text-[#64748B] flex items-center space-x-2">
              <Info className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              <span>
                数据依据约束原则：Semantic Relationship ≠ Execution Dependency（语义关联不等于执行依赖，本表仅列出真实执行与血缘关联资源）。
              </span>
            </div>
          </section>

          {/* ------------------------------------------------------- */}
          {/* F. RUNTIME & DATA STATUS (运行与数据状态 - 3 Statuses)    */}
          {/* ------------------------------------------------------- */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-[#2563EB]" />
                  <h2 className="text-base font-bold text-[#0F172A]">运行与数据状态</h2>
                </div>
                <p className="text-xs text-[#64748B]">
                  明确区分访问权限 (Access)、服务可用性 (Service Health) 与数据新鲜度 (Data Fitness)，严禁模糊合并
                </p>
              </div>

              <span className="text-xs text-[#64748B]">
                最近检测：刚刚
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Status 1: 服务运行 */}
              <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[#166534]">服务运行 (Service)</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                    <span>运行正常</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#166534] leading-relaxed">
                  当前服务可以正常接受调用，网关节点可用性 99.99%，平均响应延迟 &lt;45ms。
                </p>
              </div>

              {/* Status 2: 最近数据更新 */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[#475569]">最近数据更新</div>
                  <span className="font-mono text-xs font-bold text-[#0F172A]">
                    今天 08:10
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  底层统计底库与视图已按 T+1 批次同步，统计基准时间为 2026-08-18 08:10。
                </p>
              </div>

              {/* Status 3: 数据新鲜度 */}
              <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[#92400E]">数据新鲜度 (Fitness)</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                    <span>有提醒</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#92400E] leading-relaxed">
                  服务本身运行正常，但底层人口数据更新时间晚于预期；如用于实时统计，建议确认最新同步状态。
                </p>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------- */}
          {/* G. RELATED RESOURCES (相关资源 - Hybrid Entities)        */}
          {/* ------------------------------------------------------- */}
          <section id="section-related-resources" className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-[#2563EB]" />
                  <h2 className="text-base font-bold text-[#0F172A]">相关资源</h2>
                </div>
                <p className="text-xs text-[#64748B]">
                  围绕当前人口统计服务关联的企业正式业务对象、指标与数据资产
                </p>
              </div>

              <button
                onClick={() => onNavigateToResourceExplorerWithQuery?.('人口')}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center space-x-1 cursor-pointer"
              >
                <span>查看全部相关资源</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Item 1: 自然人 (BUSINESS_OBJECT) */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-2xs transition-all bg-white flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded bg-[#EEF2FF] text-[#2563EB] flex items-center justify-center">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-[#0F172A]">自然人</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                      BUSINESS OBJECT
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    当前数据服务围绕的核心业务对象，统一人身主体概念与基础身份属性。
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToBusinessObject?.('bo_person')}
                  className="pt-2 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center justify-between cursor-pointer"
                >
                  <span>查看业务对象详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item 2: 总人口数 (METRIC) */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-2xs transition-all bg-white flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded bg-[#F0FDF4] text-[#16A36A] flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-[#0F172A]">总人口数</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#166534]">
                      METRIC
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    人口规模统计中的正式指标，定义行政区域内常住总人口核算逻辑。
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToMetricDetail?.('res-03')}
                  className="pt-2 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center justify-between cursor-pointer"
                >
                  <span>查看指标定义与口径</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item 3: 60岁以上人口数 (METRIC) */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-2xs transition-all bg-white flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded bg-[#F0FDF4] text-[#16A36A] flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-[#0F172A]">60岁以上人口数</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#166534]">
                      METRIC
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    老年人口分析相关正式指标，支撑街镇老龄化率与养老服务测算。
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToMetricDetail?.('res-03')}
                  className="pt-2 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center justify-between cursor-pointer"
                >
                  <span>查看指标定义与口径</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item 4: 人口基本信息视图 (DATA ASSET) */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-2xs transition-all bg-white flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                        <Table className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-[#0F172A]">人口基本信息视图</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                      DATA ASSET
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    当前服务统计结果的核心数据依据，提供脱敏后的人口底层聚合基底。
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToDataAssetDetail?.('res-02')}
                  className="pt-2 border-t border-[#F1F5F9] text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center justify-between cursor-pointer"
                >
                  <span>查看数据资产详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. RIGHT USE RAIL (右侧使用栏 - 300–320px, Scrollable)    */}
      {/* ========================================================= */}
      <aside className="w-[300px] xl:w-[320px] bg-white border-l border-[#E6EAF0] flex flex-col shrink-0 overflow-y-auto select-none p-5 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-extrabold text-[#0F172A] tracking-tight">
            使用
          </h3>
          <span className="text-[11px] font-mono text-[#64748B]">
            DATA API
          </span>
        </div>

        {/* Section 1: 当前访问 */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] font-medium">当前访问</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
              <span>需申请</span>
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            获得调用权限后即可使用人口统计查询服务。
          </p>
        </div>

        <div className="h-px bg-[#F1F5F9]" />

        {/* Section 2: 服务运行 */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] font-medium">服务运行</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
              <span>正常</span>
            </span>
          </div>
        </div>

        <div className="h-px bg-[#F1F5F9]" />

        {/* Section 3: 数据新鲜度 */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] font-medium">数据新鲜度</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-[#D97706]" />
              <span>有提醒</span>
            </span>
          </div>
          <p className="text-[11px] text-[#B45309] leading-relaxed">
            底层数据更新时间晚于预期，请按需核对。
          </p>
        </div>

        <div className="h-px bg-[#F1F5F9]" />

        {/* Section 4: 维护团队 */}
        <div className="space-y-2 text-xs">
          <div className="text-[#64748B] font-medium">维护团队</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-[#F1F5F9] flex items-center justify-center text-[#475569]">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-[#0F172A]">人口数据服务团队</span>
            </div>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold cursor-pointer transition-colors"
            >
              联系团队 →
            </button>
          </div>
        </div>

        <div className="h-px bg-[#F1F5F9]" />

        {/* CTA Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Primary CTA: 申请调用 */}
          <button
            onClick={() => setIsAccessRequestDrawerOpen(true)}
            className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>申请调用</span>
          </button>

          {/* Secondary CTA: 查看接口契约 */}
          <button
            onClick={() => setIsContractDrawerOpen(true)}
            className="w-full py-2.5 px-4 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] hover:text-[#6D28D9] border border-[#DDD6FE] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Code className="w-3.5 h-3.5" />
            <span>查看接口契约</span>
          </button>

          {/* Tertiary CTA: 查看相关资源 */}
          <button
            onClick={() => scrollToSection('section-related-resources')}
            className="w-full py-2 px-4 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Network className="w-3.5 h-3.5" />
            <span>查看相关资源</span>
          </button>
        </div>

      </aside>

      {/* ========================================================= */}
      {/* 4. INTERFACE CONTRACT DRAWER (接口契约 Drawer, 680px)      */}
      {/* ========================================================= */}
      {isContractDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150">
          <div
            className="absolute inset-0"
            onClick={() => setIsContractDrawerOpen(false)}
          />

          <div
            className="relative w-full max-w-[680px] bg-white h-full shadow-2xl border-l border-[#E2E8F0] flex flex-col z-10 animate-in slide-in-from-right duration-200 text-[#172033]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-start justify-between shrink-0 bg-white">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                    接口契约
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                    Real Contract Aware
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-semibold text-[#475569]">人口统计查询 API</span>
                  <span className="text-[#94A3B8]">·</span>
                  <span className="font-mono text-[#2563EB] font-bold">GET /population/statistics</span>
                </div>
              </div>

              <button
                onClick={() => setIsContractDrawerOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">

              {/* 1. Contract 基础信息 */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  基础契约信息 (Contract Metadata)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#64748B]">API Version</div>
                    <div className="font-mono font-bold text-[#0F172A]">v1</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#64748B]">Method</div>
                    <div className="font-mono font-bold text-[#2563EB]">GET</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#64748B]">Content Type</div>
                    <div className="font-mono font-bold text-[#0F172A]">application/json</div>
                  </div>
                  <div className="space-y-0.5 sm:col-span-2">
                    <div className="text-[11px] text-[#64748B]">Endpoint</div>
                    <div className="font-mono font-bold text-[#0F172A]">/population/statistics</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#64748B]">Authentication</div>
                    <div className="font-bold text-[#0F172A] flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-[#2563EB]" />
                      <span>OAuth 2.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Request Contract (请求契约) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <span>请求 (Request)</span>
                  </h3>
                  <span className="text-[11px] text-[#64748B]">Query Parameters</span>
                </div>

                <div className="border border-[#E2E8F0] rounded-lg overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs min-w-[560px]">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                        <th className="py-2.5 px-3">业务名称</th>
                        <th className="py-2.5 px-3">参数名</th>
                        <th className="py-2.5 px-3">位置</th>
                        <th className="py-2.5 px-3">必填</th>
                        <th className="py-2.5 px-3">类型</th>
                        <th className="py-2.5 px-3">规则 / 约束</th>
                        <th className="py-2.5 px-3 text-right">示例</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {REQUEST_PARAMS.map((p) => (
                        <tr key={p.paramName} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{p.businessName}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">{p.paramName}</td>
                          <td className="py-2.5 px-3 text-[#64748B]">{p.position}</td>
                          <td className="py-2.5 px-3">
                            {p.required ? (
                              <span className="text-[#2563EB] font-bold">是</span>
                            ) : (
                              <span className="text-[#94A3B8]">否</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#64748B]">{p.dataType}</td>
                          <td className="py-2.5 px-3 text-[#475569]">{p.rules}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#0F172A]">{p.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Response Contract (响应契约) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                    <span>响应 (Response)</span>
                  </h3>
                  <span className="text-[11px] text-[#64748B]">按 HTTP 状态码切换</span>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-2">
                  <button
                    onClick={() => setContractResponseStatusTab('200')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      contractResponseStatusTab === '200'
                        ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                        : 'text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                    <span>200 成功</span>
                  </button>

                  <button
                    onClick={() => setContractResponseStatusTab('400')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      contractResponseStatusTab === '400'
                        ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                        : 'text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>400 参数错误</span>
                  </button>

                  <button
                    onClick={() => setContractResponseStatusTab('403')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      contractResponseStatusTab === '403'
                        ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
                        : 'text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                    <span>403 无访问权限</span>
                  </button>

                  <button
                    onClick={() => setContractResponseStatusTab('429')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      contractResponseStatusTab === '429'
                        ? 'bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1]'
                        : 'text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#64748B]" />
                    <span>429 请求过多</span>
                  </button>
                </div>

                {/* 200 Response: Schema vs Example */}
                {contractResponseStatusTab === '200' && (
                  <div className="space-y-3">
                    {/* Schema / Example Switcher */}
                    <div className="flex items-center justify-between">
                      <div className="inline-flex p-0.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
                        <button
                          onClick={() => setContract200ViewMode('schema')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            contract200ViewMode === 'schema'
                              ? 'bg-white text-[#0F172A] shadow-2xs'
                              : 'text-[#64748B] hover:text-[#0F172A]'
                          }`}
                        >
                          Schema (结构定义)
                        </button>
                        <button
                          onClick={() => setContract200ViewMode('example')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            contract200ViewMode === 'example'
                              ? 'bg-white text-[#0F172A] shadow-2xs'
                              : 'text-[#64748B] hover:text-[#0F172A]'
                          }`}
                        >
                          Example (报文示例)
                        </button>
                      </div>

                      {contract200ViewMode === 'example' && (
                        <button
                          onClick={() => handleCopyText(JSON_EXAMPLE_200, 'example-200')}
                          className="inline-flex items-center space-x-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold cursor-pointer"
                        >
                          {copiedKey === 'example-200' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                              <span className="text-[#16A36A]">已复制</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>复制代码</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Schema Tab */}
                    {contract200ViewMode === 'schema' && (
                      <div className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                              <th className="py-2.5 px-3">业务名称</th>
                              <th className="py-2.5 px-3">字段名</th>
                              <th className="py-2.5 px-3">类型</th>
                              <th className="py-2.5 px-3">含义说明</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9]">
                            {RESPONSE_SCHEMA_FIELDS.map((f) => (
                              <React.Fragment key={f.field}>
                                <tr className="hover:bg-[#F8FAFC] transition-colors">
                                  <td className="py-2.5 px-3 font-semibold text-[#0F172A]">
                                    {f.children ? (
                                      <button
                                        onClick={() => {
                                          if (f.field === 'age_distribution') {
                                            setIsAgeDistributionExpanded(!isAgeDistributionExpanded);
                                          } else if (f.field === 'region') {
                                            setIsRegionExpanded(!isRegionExpanded);
                                          }
                                        }}
                                        className="inline-flex items-center space-x-1.5 hover:text-[#2563EB] cursor-pointer"
                                      >
                                        {(f.field === 'age_distribution' && isAgeDistributionExpanded) ||
                                        (f.field === 'region' && isRegionExpanded) ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-[#2563EB]" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                                        )}
                                        <span>{f.businessName}</span>
                                      </button>
                                    ) : (
                                      <span>{f.businessName}</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">{f.field}</td>
                                  <td className="py-2.5 px-3 font-mono text-[#64748B]">{f.type}</td>
                                  <td className="py-2.5 px-3 text-[#475569]">{f.meaning}</td>
                                </tr>

                                {/* Nested Child Fields */}
                                {f.children &&
                                  ((f.field === 'age_distribution' && isAgeDistributionExpanded) ||
                                    (f.field === 'region' && isRegionExpanded)) &&
                                  f.children.map((child) => (
                                    <tr key={`${f.field}-${child.field}`} className="bg-[#F8FAFC] text-[11px]">
                                      <td className="py-2 px-3 pl-8 text-[#475569] font-medium flex items-center space-x-1">
                                        <span className="text-[#94A3B8]">└</span>
                                        <span>{child.businessName}</span>
                                      </td>
                                      <td className="py-2 px-3 font-mono text-[#475569] font-semibold">
                                        {child.field}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-[#64748B]">{child.type}</td>
                                      <td className="py-2 px-3 text-[#64748B]">{child.meaning}</td>
                                    </tr>
                                  ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Example Tab */}
                    {contract200ViewMode === 'example' && (
                      <div className="rounded-lg bg-[#0F172A] p-4 text-[#F8FAFC] font-mono text-xs overflow-x-auto shadow-inner">
                        <pre className="leading-relaxed whitespace-pre font-mono">
                          {JSON_EXAMPLE_200}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* 400 Response */}
                {contractResponseStatusTab === '400' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E]">
                      <strong>400 Bad Request：</strong> 客户端请求参数缺失或格式不合法。
                    </div>
                    <div className="rounded-lg bg-[#0F172A] p-4 text-[#F8FAFC] font-mono text-xs overflow-x-auto shadow-inner">
                      <pre className="leading-relaxed whitespace-pre font-mono">
                        {JSON_EXAMPLE_400}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 403 Response */}
                {contractResponseStatusTab === '403' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
                      <strong>403 Forbidden：</strong> 当前调用凭证未获得此 API 的 CALL 授权。
                    </div>
                    <div className="rounded-lg bg-[#0F172A] p-4 text-[#F8FAFC] font-mono text-xs overflow-x-auto shadow-inner">
                      <pre className="leading-relaxed whitespace-pre font-mono">
                        {JSON_EXAMPLE_403}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 429 Response */}
                {contractResponseStatusTab === '429' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-xs text-[#334155]">
                      <strong>429 Too Many Requests：</strong> 当前客户端调用超出配额频率限制。
                    </div>
                    <div className="rounded-lg bg-[#0F172A] p-4 text-[#F8FAFC] font-mono text-xs overflow-x-auto shadow-inner">
                      <pre className="leading-relaxed whitespace-pre font-mono">
                        {JSON_EXAMPLE_429}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EEF2F6] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div className="text-[11px] text-[#64748B]">
                契约来源：OpenAPI Definition (v1.0.4) · 网关同步于今天 08:10
              </div>
              <button
                onClick={() => {
                  setIsContractDrawerOpen(false);
                  setIsAccessRequestDrawerOpen(true);
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                申请调用此接口
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SINGLE RESOURCE ACCESS REQUEST DRAWER                  */}
      {/* ========================================================= */}
      <SingleResourceAccessRequestDrawer
        isOpen={isAccessRequestDrawerOpen}
        onClose={() => setIsAccessRequestDrawerOpen(false)}
        resourceName="人口统计查询 API"
        resourceTypeLabel="DATA API"
        taskContextTitle={fromGoalSearch ? goalQuery : '人口规模与老龄人口统计分析'}
        reviewDecision="manual_review"
        suggestedScopeItems={[
          '接口调用权限 (CALL)',
          '按行政区与统计期聚合人口规模',
          '按年龄段获取老龄人口统计分布'
        ]}
        suggestedFieldMappings={[
          { label: '行政区域', field: 'region_code' },
          { label: '统计期', field: 'period' },
          { label: '年龄范围', field: 'age_min / age_max' },
          { label: '常住状态', field: 'residence_status' }
        ]}
        onSuccessSubmit={() => {
          setIsAccessRequestDrawerOpen(false);
          addToast?.('success', '调用申请已提交', '已进入「我的申请」流转队列，审批通过后即可获取接口调用凭证');
        }}
        addToast={addToast}
      />

      {/* ========================================================= */}
      {/* 6. CONTACT MAINTAINER TEAM MODAL                          */}
      {/* ========================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full p-6 space-y-5 text-xs text-[#172033] animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  联系人口数据服务团队
                </h3>
                <p className="text-xs text-[#64748B]">
                  人口统计查询 API 维护与数据服务支持
                </p>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">服务负责人</span>
                <span className="font-bold text-[#0F172A]">李工（数据服务集成组）</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">企微 / 钉钉群</span>
                <span className="font-mono font-bold text-[#2563EB]">#人口与空间数据服务支持群</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">服务 SLA</span>
                <span className="font-bold text-[#16A36A]">工作日 15 分钟响应</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">支持邮箱</span>
                <span className="font-mono text-[#0F172A]">pop-api-support@semovix.enterprise</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg cursor-pointer transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setIsContactModalOpen(false);
                  addToast?.('success', '已发起企业通讯会话', '已在企业 IM 中拉起「人口数据服务支持」群聊');
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg cursor-pointer transition-colors"
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
