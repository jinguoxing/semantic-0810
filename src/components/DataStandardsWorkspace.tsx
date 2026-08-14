import React, { useState, useMemo } from 'react';
import { StandardMatchingWorkspace } from './StandardMatchingWorkspace';
import {
  Search,
  Plus,
  Upload,
  Sparkles,
  ChevronDown,
  Filter,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  Layers,
  FileText,
  Info,
  Clock,
  ArrowRight,
  Database,
  Tag,
  ShieldCheck,
  AlertCircle,
  X,
  FileSpreadsheet,
  Check,
  Copy,
  BookOpen,
  GitPullRequest,
  History,
  Trash2,
  FolderTree
} from 'lucide-react';

export interface DataStandardItem {
  id: string;
  name: string;
  code: string;
  type: 'DATA_ELEMENT' | 'VALUE_DOMAIN'; // 数据元 or 码表
  requirementSummary: string; // e.g. DATETIME · 非空 · yyyy-MM-dd HH:mm:ss or 3 个有效码值
  requirementDetail?: string; // e.g. 01 男 · 02 女 · 09 未说明
  domain: string; // 业务域
  usageCount: number; // 使用字段数
  version: string; // e.g. V3
  publishDate: string; // 2026-06-18
  status: 'EFFECTIVE' | 'DEPRECATED'; // 生效中 | 已废止
  source: string; // 企业标准 | 国家标准 | 行业标准 | 地方标准 | 历史系统 | AI 发现
  description?: string;
  standardDocNo?: string; // 标准编号 e.g. GB/T 2260-2007
  linkedFields?: Array<{
    tableName: string;
    fieldName: string;
    dataType: string;
    dbName: string;
    complianceScore: number;
  }>;
  codeValues?: Array<{
    code: string;
    label: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
}

const INITIAL_STANDARDS: DataStandardItem[] = [
  {
    id: 'std_001',
    name: '业务办结时间',
    code: 'DE_CASE_CLOSE_TIME',
    type: 'DATA_ELEMENT',
    requirementSummary: 'DATETIME · 非空 · yyyy-MM-dd HH:mm:ss',
    requirementDetail: '规定热线与服务工单业务处理完毕的标准系统时间点，精确到秒。',
    domain: '公共服务',
    usageCount: 126,
    version: 'V3',
    publishDate: '2026-06-18',
    status: 'EFFECTIVE',
    source: '企业标准',
    description: '企业统一服务的工单与事项办结节点标准定义。',
    standardDocNo: 'Q/SMX-GOV-2026-012',
    linkedFields: [
      { tableName: 'pop_service_hotline', fieldName: 'close_time', dataType: 'DATETIME', dbName: 'hotline_db', complianceScore: 98 },
      { tableName: 'work_order_master', fieldName: 'finish_datetime', dataType: 'TIMESTAMP', dbName: 'service_db', complianceScore: 95 },
      { tableName: 'govt_appeal_records', fieldName: 'end_time', dataType: 'DATETIME', dbName: 'appeal_db', complianceScore: 92 },
      { tableName: 'city_complaint_log', fieldName: 'closed_at', dataType: 'TIMESTAMP', dbName: 'city_db', complianceScore: 90 },
    ]
  },
  {
    id: 'std_002',
    name: '公民身份号码',
    code: 'DE_PERSON_ID',
    type: 'DATA_ELEMENT',
    requirementSummary: 'VARCHAR(18) · 非空',
    requirementDetail: '符合 GB 11643 标准的 18 位公民身份号码规范。',
    domain: '人口服务',
    usageCount: 84,
    version: 'V5',
    publishDate: '2026-05-10',
    status: 'EFFECTIVE',
    source: '国家标准',
    description: '国家居民唯一身份标识号，包含地址码、出生日期码、顺序码和校验码。',
    standardDocNo: 'GB 11643-1999',
    linkedFields: [
      { tableName: 'pop_service_hotline', fieldName: 'person_id', dataType: 'VARCHAR(18)', dbName: 'hotline_db', complianceScore: 100 },
      { tableName: 'citizen_basic_info', fieldName: 'id_card', dataType: 'CHAR(18)', dbName: 'citizen_db', complianceScore: 99 },
      { tableName: 'social_security_log', fieldName: 'identity_no', dataType: 'VARCHAR(18)', dbName: 'social_db', complianceScore: 97 },
    ]
  },
  {
    id: 'std_003',
    name: '出生日期',
    code: 'DE_BIRTH_DATE',
    type: 'DATA_ELEMENT',
    requirementSummary: 'DATE · yyyy-MM-dd',
    requirementDetail: '自然人出生的日历日期，格式要求为四位年份-两位月份-两位日期。',
    domain: '人口服务',
    usageCount: 61,
    version: 'V2',
    publishDate: '2026-04-02',
    status: 'EFFECTIVE',
    source: '国家标准',
    description: '自然人出生日期国家标准数据元。',
    standardDocNo: 'GB/T 2261.1-2003',
    linkedFields: [
      { tableName: 'citizen_basic_info', fieldName: 'birth_date', dataType: 'DATE', dbName: 'citizen_db', complianceScore: 100 },
      { tableName: 'health_patient_master', fieldName: 'dob', dataType: 'DATE', dbName: 'health_db', complianceScore: 96 },
    ]
  },
  {
    id: 'std_004',
    name: '性别代码',
    code: 'GENDER_CODE',
    type: 'VALUE_DOMAIN',
    requirementSummary: '3 个有效码值',
    requirementDetail: '01 男 · 02 女 · 09 未说明',
    domain: '人口服务',
    usageCount: 82,
    version: 'V2',
    publishDate: '2026-03-15',
    status: 'EFFECTIVE',
    source: '国家标准',
    description: '人的性别代码 GB/T 2261.1 标准规范。',
    standardDocNo: 'GB/T 2261.1-2003',
    codeValues: [
      { code: '01', label: '男', description: '男性', status: 'ACTIVE' },
      { code: '02', label: '女', description: '女性', status: 'ACTIVE' },
      { code: '09', label: '未说明的性别', description: '未说明或未提供', status: 'ACTIVE' },
    ],
    linkedFields: [
      { tableName: 'pop_service_hotline', fieldName: 'gender', dataType: 'VARCHAR(2)', dbName: 'hotline_db', complianceScore: 94 },
      { tableName: 'citizen_basic_info', fieldName: 'sex_code', dataType: 'CHAR(2)', dbName: 'citizen_db', complianceScore: 100 },
    ]
  },
  {
    id: 'std_005',
    name: '行政区划代码',
    code: 'ADMIN_DIVISION_CODE',
    type: 'VALUE_DOMAIN',
    requirementSummary: '3,268 个有效码值',
    requirementDetail: '来源：国家标准 GB/T 2260',
    domain: '公共基础',
    usageCount: 146,
    version: 'V8',
    publishDate: '2026-01-20',
    status: 'EFFECTIVE',
    source: '国家标准',
    description: '中华人民共和国县级以上行政区划代码标准。',
    standardDocNo: 'GB/T 2260-2007',
    codeValues: [
      { code: '110000', label: '北京市', description: '直辖市', status: 'ACTIVE' },
      { code: '310000', label: '上海市', description: '直辖市', status: 'ACTIVE' },
      { code: '320000', label: '江苏省', description: '省份', status: 'ACTIVE' },
      { code: '330000', label: '浙江省', description: '省份', status: 'ACTIVE' },
      { code: '440000', label: '广东省', description: '省份', status: 'ACTIVE' },
    ],
    linkedFields: [
      { tableName: 'pop_service_hotline', fieldName: 'district_code', dataType: 'VARCHAR(6)', dbName: 'hotline_db', complianceScore: 98 },
      { tableName: 'enterprise_registry', fieldName: 'admin_region', dataType: 'VARCHAR(6)', dbName: 'corp_db', complianceScore: 96 },
    ]
  },
  {
    id: 'std_006',
    name: '统一社会信用代码',
    code: 'DE_UNIFIED_CREDIT_CODE',
    type: 'DATA_ELEMENT',
    requirementSummary: 'VARCHAR(18) · 非空 · 大写字母与数字',
    requirementDetail: '符合 GB 32100 标准的 18 位法人及其他组织统一社会信用代码。',
    domain: '法人服务',
    usageCount: 95,
    version: 'V4',
    publishDate: '2026-02-18',
    status: 'EFFECTIVE',
    source: '国家标准',
    description: '法人及其他组织统一社会信用代码标准。',
    standardDocNo: 'GB 32100-2015',
    linkedFields: [
      { tableName: 'enterprise_registry', fieldName: 'uscc_code', dataType: 'VARCHAR(18)', dbName: 'corp_db', complianceScore: 100 },
      { tableName: 'taxation_record_log', fieldName: 'taxpayer_id', dataType: 'VARCHAR(18)', dbName: 'tax_db', complianceScore: 97 },
    ]
  },
  {
    id: 'std_007',
    name: '工单紧急程度代码',
    code: 'PRIORITY_LEVEL_CODE',
    type: 'VALUE_DOMAIN',
    requirementSummary: '4 个有效码值',
    requirementDetail: '1 特急 · 2 加急 · 3 平急 · 4 常规',
    domain: '公共服务',
    usageCount: 53,
    version: 'V1',
    publishDate: '2025-11-05',
    status: 'EFFECTIVE',
    source: '企业标准',
    description: '热线工单与诉求办理优先级代码。',
    standardDocNo: 'Q/SMX-GOV-2025-088',
    codeValues: [
      { code: '1', label: '特急', description: '需 1 小时内响应', status: 'ACTIVE' },
      { code: '2', label: '加急', description: '需 4 小时内响应', status: 'ACTIVE' },
      { code: '3', label: '平急', description: '需 12 小时内响应', status: 'ACTIVE' },
      { code: '4', label: '常规', description: '按照标准时限响应', status: 'ACTIVE' },
    ],
    linkedFields: [
      { tableName: 'pop_service_hotline', fieldName: 'priority_level', dataType: 'CHAR(1)', dbName: 'hotline_db', complianceScore: 96 },
    ]
  },
  {
    id: 'std_008',
    name: '服务诉求分类代码（历史）',
    code: 'LEGACY_SERVICE_CAT_CODE',
    type: 'VALUE_DOMAIN',
    requirementSummary: '128 个历史码值',
    requirementDetail: '已于 2025 年正式废止，由全省统一三级分类码表替代。',
    domain: '公共服务',
    usageCount: 12,
    version: 'V1',
    publishDate: '2023-08-10',
    status: 'DEPRECATED',
    source: '历史系统',
    description: '原老版本政务热线分类代码，仅保留归档字段关联查询。',
    standardDocNo: 'Q/SMX-GOV-2023-004 (ARCHIVED)',
    linkedFields: [
      { tableName: 'archive_hotline_2023', fieldName: 'old_cat_code', dataType: 'VARCHAR(10)', dbName: 'archive_db', complianceScore: 80 },
    ]
  }
];

// Mock 20 AI standard suggestions
const MOCK_AI_RECOMMENDATIONS = [
  { id: 'rec_1', name: '工单处理时长', code: 'DE_WORK_DURATION', type: 'DATA_ELEMENT', reason: '在 32 个公共服务表单中检测到类似算法逻辑的 duration 字段，建议抽象为标准数据元', fieldCount: 32, suggestionType: 'MISSING' },
  { id: 'rec_2', name: '客户联系电话', code: 'DE_CUSTOMER_PHONE', type: 'DATA_ELEMENT', reason: '涉及 48 个表，检测到加密格式与手机号匹配规则，缺失统一数据元定义', fieldCount: 48, suggestionType: 'MISSING' },
  { id: 'rec_3', name: '满意度评价代码', code: 'SATISFACTION_DEGREE_CODE', type: 'VALUE_DOMAIN', reason: '分布在 18 个评价反馈表中，存在 1-5 分与非常满意/满意等 3 套不一致码表', fieldCount: 18, suggestionType: 'MISSING' },
  { id: 'rec_4', name: '诉求渠道类型代码', code: 'APPEAL_CHANNEL_CODE', type: 'VALUE_DOMAIN', reason: '发现网站、公众号、热线、随手拍等 14 个渠道识别字段', fieldCount: 14, suggestionType: 'MISSING' },
  { id: 'rec_5', name: '疑似重复标准：办结时间 vs 完成时间', code: 'DE_FINISH_TIME', type: 'DATA_ELEMENT', reason: '与正式标准 [DE_CASE_CLOSE_TIME 业务办结时间] 相似度 94.2%，建议合并合并归集', fieldCount: 9, suggestionType: 'DUPLICATED' },
];

interface DataStandardsWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToDataSemantics?: () => void;
  onNavigateToCreateDataElementStandard?: () => void;
  onNavigateToCreateValueDomainStandard?: () => void;
  onNavigateToImportStandards?: () => void;
  onNavigateToMappingConflictReview?: () => void;
  onNavigateToStandardDetail?: (standardId?: string) => void;
}

export const DataStandardsWorkspace: React.FC<DataStandardsWorkspaceProps> = ({
  addToast,
  onNavigateToDataSemantics,
  onNavigateToCreateDataElementStandard,
  onNavigateToCreateValueDomainStandard,
  onNavigateToImportStandards,
  onNavigateToMappingConflictReview,
  onNavigateToStandardDetail,
}) => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'matching' | 'inspection'>('catalog');
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DATA_ELEMENT' | 'VALUE_DOMAIN'>('ALL');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedStandard, setSelectedStandard] = useState<DataStandardItem | null>(null);
  const [linkageStandard, setLinkageStandard] = useState<DataStandardItem | null>(null);
  const [isNewStandardDropdownOpen, setIsNewStandardDropdownOpen] = useState(false);
  const [isNewStandardModalOpen, setIsNewStandardModalOpen] = useState(false);
  const [newStandardType, setNewStandardType] = useState<'DATA_ELEMENT' | 'VALUE_DOMAIN'>('DATA_ELEMENT');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAiRecommendationsDrawerOpen, setIsAiRecommendationsDrawerOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalTarget, setProposalTarget] = useState<DataStandardItem | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Form State for New Standard
  const [newStdName, setNewStdName] = useState('');
  const [newStdCode, setNewStdCode] = useState('');
  const [newStdDomain, setNewStdDomain] = useState('公共服务');
  const [newStdReq, setNewStdReq] = useState('');

  // Proposal Form State
  const [proposalReason, setProposalReason] = useState('');
  const [proposedChange, setProposedChange] = useState('');

  // Filter Logic
  const filteredStandards = useMemo(() => {
    return INITIAL_STANDARDS.filter((item) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requirementSummary.toLowerCase().includes(searchQuery.toLowerCase());

      // Type
      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;

      // Domain
      const matchesDomain = domainFilter === 'ALL' || item.domain === domainFilter;

      // Source
      const matchesSource = sourceFilter === 'ALL' || item.source === sourceFilter;

      // Status
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesType && matchesDomain && matchesSource && matchesStatus;
    });
  }, [searchQuery, typeFilter, domainFilter, sourceFilter, statusFilter]);

  const handleTabClick = (tab: 'catalog' | 'matching' | 'inspection') => {
    setActiveTab(tab);
    if (tab === 'matching') {
      addToast?.('info', '切换至 标准匹配', '已载入 AI 自动落标关联比对与字段映射引擎');
    } else if (tab === 'inspection') {
      addToast?.('info', '切换至 标准检查', '已载入企业数据合规率与码表覆盖度检查视图');
    }
  };

  const handleCreateStandard = () => {
    if (!newStdName || !newStdCode) {
      addToast?.('error', '请填写必填项', '标准名称与标准编码不能为空');
      return;
    }
    addToast?.('success', '标准提交流程已发起', `已生成【${newStdName} (${newStdCode})】审核单`);
    setIsNewStandardModalOpen(false);
    setNewStdName('');
    setNewStdCode('');
    setNewStdReq('');
  };

  const handleSubmitProposal = () => {
    if (!proposalReason) {
      addToast?.('error', '请输入变更理由', '正式标准修改必须提交明确的业务变更说明');
      return;
    }
    addToast?.('success', '变更申请提交成功', `标准【${proposalTarget?.name}】的变更提议已提交至数据标准评审委员会`);
    setIsProposalModalOpen(false);
    setProposalReason('');
    setProposedChange('');
  };

  if (activeTab === 'matching') {
    return (
      <StandardMatchingWorkspace
        addToast={addToast}
        onNavigateToCatalogTab={() => setActiveTab('catalog')}
        onNavigateToCheckTab={() => setActiveTab('inspection')}
        onNavigateToDataSemantics={onNavigateToDataSemantics}
        onNavigateToMappingConflictReview={onNavigateToMappingConflictReview}
      />
    );
  }

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-[#F7F9FC] text-[#172033] overflow-hidden select-none">
      
      {/* ========================================================= */}
      {/* LEFT SIDEBAR: 二级导航 (~208px)                            */}
      {/* ========================================================= */}
      <aside className="w-[208px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#E6EAF0]">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>数据治理</span>
          </div>
        </div>

        <nav className="p-2 space-y-1 text-xs font-medium">
          <button
            onClick={() => {
              setActiveSubNav('connections');
              addToast?.('info', '数据连接', '查看企业异构数据源与元数据采集节点');
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'connections'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>数据连接</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('probing');
              addToast?.('info', '数据探查', '载入字段数据分布、空值率与技术探查视图');
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'probing'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>数据探查</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('quality');
              addToast?.('info', '数据质量', '查看数据质量校验规则与监控指标');
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'quality'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>数据质量</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('views');
              addToast?.('info', '逻辑视图', '进入企业跨源物理表关联逻辑建模架构');
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'views'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>逻辑视图</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('semantics');
              onNavigateToDataSemantics?.();
            }}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSubNav === 'semantics'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>数据语义</span>
          </button>

          {/* Current Selected Menu Item */}
          <button
            onClick={() => setActiveSubNav('standards')}
            className={`w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]`}
          >
            <BookOpen className="w-4 h-4" />
            <span>数据标准</span>
          </button>
        </nav>

        <div className="mt-auto p-4 border-t border-[#E6EAF0] text-[11px] text-[#94A3B8]">
          <p className="font-semibold text-[#64748B]">Semovix Platform</p>
          <p>数据语义治理平台 V2.6</p>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA                                         */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F7F9FC]">
        
        {/* TOP SECTION: Breadcrumb + Header Info + Primary Actions */}
        <div className="bg-white border-b border-[#E6EAF0] px-8 pt-6 pb-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-1.5">
                <span>数据治理</span>
                <span>/</span>
                <span className="font-semibold text-[#172033]">数据标准</span>
              </div>

              {/* Title + Subtitle */}
              <div className="flex items-baseline space-x-3">
                <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                  数据标准
                </h1>
                <span className="text-xs font-mono text-[#64748B]">
                  Data Standards
                </span>
              </div>

              <p className="text-xs text-[#64748B] mt-1">
                统一管理企业数据元与值域标准，并持续关联实际数据。
              </p>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center space-x-3 relative">
              <button
                onClick={() => {
                  if (onNavigateToImportStandards) {
                    onNavigateToImportStandards();
                  } else {
                    setIsImportModalOpen(true);
                  }
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>导入标准</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsNewStandardDropdownOpen(!isNewStandardDropdownOpen)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E6EAF0] text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>新建标准</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>

                {/* Dropdown Menu for New Standard */}
                {isNewStandardDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E6EAF0] rounded-xl shadow-lg z-50 py-1.5 text-xs">
                    <button
                      onClick={() => {
                        setIsNewStandardDropdownOpen(false);
                        if (onNavigateToCreateDataElementStandard) {
                          onNavigateToCreateDataElementStandard();
                        } else {
                          setNewStandardType('DATA_ELEMENT');
                          setIsNewStandardModalOpen(true);
                        }
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#EFF6FF] hover:text-[#2563EB] font-medium flex items-center space-x-2 text-[#172033] cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>新建数据元标准</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsNewStandardDropdownOpen(false);
                        if (onNavigateToCreateValueDomainStandard) {
                          onNavigateToCreateValueDomainStandard();
                        } else {
                          setNewStandardType('VALUE_DOMAIN');
                          setIsNewStandardModalOpen(true);
                        }
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#EFF6FF] hover:text-[#2563EB] font-medium flex items-center space-x-2 text-[#172033] cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>新建码表 / 值域标准</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION: Level-1 Page Tabs */}
          <div className="flex items-center space-x-8 border-b border-[#E6EAF0] mt-6 -mb-5 text-xs font-bold">
            <button
              onClick={() => handleTabClick('catalog')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              标准库
            </button>
            <button
              onClick={() => {
                if (onNavigateToMappingConflictReview) {
                  onNavigateToMappingConflictReview();
                } else {
                  setActiveTab('matching');
                }
              }}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'matching'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              标准匹配
            </button>
            <button
              onClick={() => handleTabClick('inspection')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'inspection'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              标准检查
            </button>
          </div>
        </div>

        {/* MAIN BODY CONTAINER */}
        <div className="p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          
          {/* ========================================================= */}
          {/* SECTION: AI 轻量治理提醒 (Xino Insight Banner)             */}
          {/* ========================================================= */}
          <div className="bg-[#F4F7FF] border border-[#C7D2FE] rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-[#172033]">
                    Xino 发现 20 个值得关注的标准建议
                  </h3>
                  <span className="text-[10px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#C7D2FE]">
                    17 个可能缺失的标准 · 3 组疑似重复标准
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  基于近期 12,480 个字段的语义分析
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAiRecommendationsDrawerOpen(true)}
              className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-white px-3.5 py-1.5 rounded-lg border border-[#C7D2FE] hover:border-[#2563EB] transition-all cursor-pointer flex items-center space-x-1 shrink-0"
            >
              <span>查看建议</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ========================================================= */}
          {/* SECTION: 搜索与筛选工具栏                                 */}
          {/* ========================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            
            {/* Left: Search Input */}
            <div className="relative w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标准名称、编码、业务术语…"
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F7F9FC] border border-[#E6EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#172033] placeholder-[#94A3B8] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-[#172033]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Segmented Control & Filters */}
            <div className="flex flex-wrap items-center space-x-3 text-xs">
              
              {/* Segmented Control for Standard Type */}
              <div className="bg-[#F1F5F9] p-1 rounded-lg flex items-center space-x-1 font-semibold text-[#64748B]">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    typeFilter === 'ALL'
                      ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                      : 'hover:text-[#172033]'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setTypeFilter('DATA_ELEMENT')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    typeFilter === 'DATA_ELEMENT'
                      ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                      : 'hover:text-[#172033]'
                  }`}
                >
                  数据元标准
                </button>
                <button
                  onClick={() => setTypeFilter('VALUE_DOMAIN')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    typeFilter === 'VALUE_DOMAIN'
                      ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                      : 'hover:text-[#172033]'
                  }`}
                >
                  码表 / 值域
                </button>
              </div>

              <div className="h-4 w-[1px] bg-[#E6EAF0]" />

              {/* Filter 1: 业务域 */}
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="bg-[#F7F9FC] border border-[#E6EAF0] text-[#172033] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
              >
                <option value="ALL">业务域 ▾ (全部)</option>
                <option value="公共服务">公共服务</option>
                <option value="人口服务">人口服务</option>
                <option value="公共基础">公共基础</option>
                <option value="法人服务">法人服务</option>
                <option value="历史系统">历史系统</option>
              </select>

              {/* Filter 2: 来源 */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-[#F7F9FC] border border-[#E6EAF0] text-[#172033] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
              >
                <option value="ALL">来源 ▾ (全部)</option>
                <option value="企业标准">企业标准</option>
                <option value="国家标准">国家标准</option>
                <option value="行业标准">行业标准</option>
                <option value="地方标准">地方标准</option>
                <option value="历史系统">历史系统</option>
                <option value="AI 发现">AI 发现</option>
              </select>

              {/* Filter 3: 状态 */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F7F9FC] border border-[#E6EAF0] text-[#172033] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
              >
                <option value="ALL">状态 ▾ (全部)</option>
                <option value="EFFECTIVE">生效中</option>
                <option value="DEPRECATED">已废止</option>
              </select>

              {/* Filter 4: 更多筛选 */}
              <button
                onClick={() => addToast?.('info', '更多筛选', '已显示高级筛选配置')}
                className="bg-[#F7F9FC] hover:bg-[#F1F5F9] border border-[#E6EAF0] text-[#64748B] hover:text-[#172033] rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer flex items-center space-x-1"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>更多筛选</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION: 正式标准列表 (Standard Catalog Table - P0 Focus)   */}
          {/* ========================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F9FC] border-b border-[#E6EAF0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">标准名称 / 编码</th>
                    <th className="py-3 px-3">类型</th>
                    <th className="py-3 px-4">标准要求 / 内容摘要</th>
                    <th className="py-3 px-3">业务域</th>
                    <th className="py-3 px-3">使用情况</th>
                    <th className="py-3 px-3">当前版本</th>
                    <th className="py-3 px-3">状态</th>
                    <th className="py-3 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAF0] text-xs">
                  {filteredStandards.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#94A3B8]">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" />
                        <p className="font-semibold text-[#64748B]">暂无匹配的数据标准</p>
                        <p className="text-xs text-[#94A3B8] mt-1">请尝试调整搜索关键字或筛选条件</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStandards.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F8FAFC] transition-colors group cursor-pointer"
                        onClick={() => setSelectedStandard(item)}
                      >
                        {/* 1. 标准名称 + 辅助编码 */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                              {item.name}
                            </span>
                            <span className="font-mono text-[11px] text-[#64748B]">
                              {item.code}
                            </span>
                          </div>
                        </td>

                        {/* 2. 类型 (Badge: 数据元 | 码表) */}
                        <td className="py-3.5 px-3">
                          {item.type === 'DATA_ELEMENT' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                              数据元
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                              码表
                            </span>
                          )}
                        </td>

                        {/* 3. 标准要求 / 内容摘要 */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-medium text-[#172033] truncate">
                              {item.requirementSummary}
                            </span>
                            {item.requirementDetail && (
                              <span className="text-[11px] text-[#64748B] truncate">
                                {item.requirementDetail}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. 业务域 */}
                        <td className="py-3.5 px-3">
                          <span className="text-[#172033] font-medium">
                            {item.domain}
                          </span>
                        </td>

                        {/* 5. 使用情况 (Clickable Link) */}
                        <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setLinkageStandard(item)}
                            className="font-bold text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-1"
                          >
                            <span>{item.usageCount} 个字段</span>
                            <ExternalLink className="w-3 h-3 text-[#2563EB]" />
                          </button>
                        </td>

                        {/* 6. 当前版本 */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-mono font-bold text-[#172033]">
                              {item.version}
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              {item.publishDate} 发布
                            </span>
                          </div>
                        </td>

                        {/* 7. 状态 */}
                        <td className="py-3.5 px-3">
                          {item.status === 'EFFECTIVE' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>生效中</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
                              <XCircle className="w-3 h-3" />
                              <span>已废止</span>
                            </span>
                          )}
                        </td>

                        {/* 8. 操作 */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-2 relative">
                            <button
                              onClick={() => setSelectedStandard(item)}
                              className="px-2.5 py-1 text-xs font-bold text-[#2563EB] hover:bg-[#EFF6FF] rounded transition-colors cursor-pointer"
                            >
                              查看
                            </button>

                            <div className="relative">
                              <button
                                onClick={() => setActiveActionMenuId(activeActionMenuId === item.id ? null : item.id)}
                                className="p-1 text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] rounded cursor-pointer transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* More Action Popover */}
                              {activeActionMenuId === item.id && (
                                <div className="absolute right-0 top-6 w-36 bg-white border border-[#E6EAF0] rounded-xl shadow-lg z-50 py-1 text-xs text-left">
                                  <button
                                    onClick={() => {
                                      setProposalTarget(item);
                                      setIsProposalModalOpen(true);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-[#EFF6FF] text-[#172033] flex items-center space-x-2 font-medium"
                                  >
                                    <GitPullRequest className="w-3.5 h-3.5 text-[#2563EB]" />
                                    <span>提出变更</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setLinkageStandard(item);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-[#EFF6FF] text-[#172033] flex items-center space-x-2 font-medium"
                                  >
                                    <Database className="w-3.5 h-3.5 text-[#64748B]" />
                                    <span>查看使用情况</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      addToast?.('info', `【${item.name}】版本历史`, `已有 ${item.version}，历史版本发布于 ${item.publishDate}`);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-[#EFF6FF] text-[#172033] flex items-center space-x-2 font-medium"
                                  >
                                    <History className="w-3.5 h-3.5 text-[#64748B]" />
                                    <span>查看版本</span>
                                  </button>
                                  <div className="h-[1px] bg-[#E6EAF0] my-1" />
                                  <button
                                    onClick={() => {
                                      addToast?.('error', '废止请求已提交', `标准【${item.name}】废止提议需要经评审会表决`);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-[#FEF2F2] text-[#DC2626] flex items-center space-x-2 font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>废止标准</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-3.5 bg-[#F7F9FC] border-t border-[#E6EAF0] flex items-center justify-between text-xs text-[#64748B]">
              <span>共计 {filteredStandards.length} 条正式数据标准</span>
              <div className="flex items-center space-x-2">
                <button className="px-2.5 py-1 bg-white border border-[#E6EAF0] rounded hover:bg-[#F1F5F9] cursor-pointer text-[#172033]">
                  上一页
                </button>
                <span className="font-mono text-[#172033] font-bold">1 / 1</span>
                <button className="px-2.5 py-1 bg-white border border-[#E6EAF0] rounded hover:bg-[#F1F5F9] cursor-pointer text-[#172033]">
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* DRAWER 1: 标准详情 Drawer                                  */}
      {/* ========================================================= */}
      {selectedStandard && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
          <div className="w-[520px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F7F9FC]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded font-bold border border-[#BFDBFE]">
                    {selectedStandard.code}
                  </span>
                  {selectedStandard.type === 'DATA_ELEMENT' ? (
                    <span className="text-xs font-bold text-[#2563EB]">数据元标准</span>
                  ) : (
                    <span className="text-xs font-bold text-[#4F46E5]">码表/值域标准</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-[#172033] mt-1">
                  {selectedStandard.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedStandard(null)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-[#E6EAF0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              
              {/* Basic Meta Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[#F7F9FC] p-4 rounded-xl border border-[#E6EAF0]">
                <div>
                  <span className="text-[#64748B]">所属业务域:</span>
                  <p className="font-bold text-[#172033] mt-0.5">{selectedStandard.domain}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">标准来源:</span>
                  <p className="font-bold text-[#172033] mt-0.5">{selectedStandard.source}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">当前版本:</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">{selectedStandard.version} ({selectedStandard.publishDate})</p>
                </div>
                <div>
                  <span className="text-[#64748B]">标准编号 / 依据:</span>
                  <p className="font-mono text-[#2563EB] font-semibold mt-0.5">{selectedStandard.standardDocNo || '企业内部规范'}</p>
                </div>
              </div>

              {/* Requirement / Detail */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-[#172033]">标准规范与约束</h3>
                <div className="p-4 bg-white border border-[#E6EAF0] rounded-xl space-y-2">
                  <div>
                    <span className="text-[#64748B]">类型与格式要求:</span>
                    <p className="font-mono font-bold text-[#0F172A] mt-0.5">{selectedStandard.requirementSummary}</p>
                  </div>
                  {selectedStandard.requirementDetail && (
                    <div className="pt-2 border-t border-[#F1F5F9]">
                      <span className="text-[#64748B]">业务定义与定义说明:</span>
                      <p className="text-[#334155] mt-0.5 leading-relaxed">{selectedStandard.requirementDetail}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Code Values Table if Value Domain */}
              {selectedStandard.type === 'VALUE_DOMAIN' && selectedStandard.codeValues && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-[#172033]">有效码值映射表</h3>
                  <div className="border border-[#E6EAF0] rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F7F9FC] border-b border-[#E6EAF0] text-[#64748B]">
                          <th className="py-2 px-3 font-bold">代码值</th>
                          <th className="py-2 px-3 font-bold">含义标签</th>
                          <th className="py-2 px-3 font-bold">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6EAF0]">
                        {selectedStandard.codeValues.map((cv, idx) => (
                          <tr key={idx} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-3 font-mono font-bold text-[#2563EB]">{cv.code}</td>
                            <td className="py-2 px-3 font-medium text-[#172033]">{cv.label}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 bg-[#ECFDF5] text-[#059669] text-[10px] font-bold rounded">
                                有效
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Linked Fields Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#172033]">使用该标准的数据字段 ({selectedStandard.usageCount})</h3>
                  <button
                    onClick={() => {
                      setLinkageStandard(selectedStandard);
                      setSelectedStandard(null);
                    }}
                    className="text-xs text-[#2563EB] font-bold hover:underline"
                  >
                    查看全部关联字段 →
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedStandard.linkedFields?.slice(0, 3).map((lf, idx) => (
                    <div key={idx} className="p-3 bg-[#F7F9FC] border border-[#E6EAF0] rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-[#172033]">{lf.tableName}.{lf.fieldName}</span>
                        <p className="text-[10px] text-[#64748B]">数据库: {lf.dbName} ({lf.dataType})</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                        标准合规率 {lf.complianceScore}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E6EAF0] bg-[#F7F9FC] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setProposalTarget(selectedStandard);
                    setIsProposalModalOpen(true);
                    setSelectedStandard(null);
                  }}
                  className="px-3.5 py-2 bg-[#2563EB] text-white font-bold rounded-lg hover:bg-[#1D4ED8] transition-all cursor-pointer flex items-center space-x-1.5 text-xs"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>提出变更</span>
                </button>

                <button
                  onClick={() => {
                    const sid = selectedStandard?.id;
                    setSelectedStandard(null);
                    if (onNavigateToStandardDetail) {
                      onNavigateToStandardDetail(sid);
                    }
                  }}
                  className="px-3.5 py-2 bg-white border border-[#BFDBFE] text-[#2563EB] font-bold rounded-lg hover:bg-[#EFF6FF] transition-all cursor-pointer flex items-center space-x-1.5 text-xs"
                >
                  <span>查看标准详情页</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setSelectedStandard(null)}
                className="px-3.5 py-2 bg-white border border-[#E6EAF0] text-[#172033] font-bold rounded-lg hover:bg-[#F1F5F9] cursor-pointer text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER 2: 关联字段使用情况 Modal                            */}
      {/* ========================================================= */}
      {linkageStandard && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
          <div className="w-[580px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F7F9FC]">
              <div>
                <span className="text-xs font-mono text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded font-bold border border-[#BFDBFE]">
                  {linkageStandard.code}
                </span>
                <h2 className="text-base font-bold text-[#172033] mt-1">
                  【{linkageStandard.name}】关联的数据字段明细 ({linkageStandard.usageCount})
                </h2>
              </div>

              <button
                onClick={() => setLinkageStandard(null)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-[#E6EAF0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 text-xs">
              {linkageStandard.linkedFields?.map((lf, idx) => (
                <div key={idx} className="p-4 bg-white border border-[#E6EAF0] rounded-xl hover:border-[#2563EB] transition-all space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-[#2563EB]" />
                      <span className="font-mono font-bold text-[#172033] text-sm">
                        {lf.tableName}.{lf.fieldName}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                      合规率 {lf.complianceScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#64748B] text-[11px] pt-1 border-t border-[#F1F5F9]">
                    <span>数据库节点: <code className="font-mono text-[#172033]">{lf.dbName}</code></span>
                    <span>技术类型: <code className="font-mono text-[#172033]">{lf.dataType}</code></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#E6EAF0] bg-[#F7F9FC] text-right">
              <button
                onClick={() => setLinkageStandard(null)}
                className="px-4 py-2 bg-white border border-[#E6EAF0] text-[#172033] font-bold rounded-lg hover:bg-[#F1F5F9] cursor-pointer text-xs"
              >
                返回标准库
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER 3: Xino AI 建议 Center                              */}
      {/* ========================================================= */}
      {isAiRecommendationsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
          <div className="w-[600px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F4F7FF]">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-[#4F46E5]" />
                <div>
                  <h2 className="text-base font-bold text-[#172033]">
                    Xino AI 标准治理建议 (20 条)
                  </h2>
                  <p className="text-xs text-[#64748B]">基于近期 12,480 个字段的语义分析自动识别</p>
                </div>
              </div>

              <button
                onClick={() => setIsAiRecommendationsDrawerOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-[#E6EAF0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {MOCK_AI_RECOMMENDATIONS.map((rec) => (
                <div key={rec.id} className="p-4 bg-white border border-[#C7D2FE] rounded-xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#172033] text-sm">{rec.name}</span>
                      <span className="font-mono text-xs text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded font-bold">
                        {rec.code}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A]">
                      {rec.suggestionType === 'MISSING' ? '可能缺失标准' : '疑似重复标准'}
                    </span>
                  </div>

                  <p className="text-[#334155] leading-relaxed bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E6EAF0]">
                    {rec.reason}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#64748B]">涉及数据字段: <strong className="text-[#2563EB]">{rec.fieldCount} 个</strong></span>
                    <button
                      onClick={() => {
                        addToast?.('success', '已采纳建议', `标准【${rec.name}】已成功草拟并进入立项流程`);
                      }}
                      className="px-3 py-1 bg-[#2563EB] text-white font-bold rounded-lg hover:bg-[#1D4ED8] transition-all cursor-pointer"
                    >
                      生成标准提案
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: 新建标准 Modal                                   */}
      {/* ========================================================= */}
      {isNewStandardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[480px] max-w-full p-6 shadow-2xl space-y-5 border border-[#E6EAF0]">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                新建{newStandardType === 'DATA_ELEMENT' ? '数据元标准' : '码表 / 值域标准'}
              </h3>
              <button
                onClick={() => setIsNewStandardModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#172033] mb-1">标准中文名称 *</label>
                <input
                  type="text"
                  value={newStdName}
                  onChange={(e) => setNewStdName(e.target.value)}
                  placeholder="例如：业务办结时间"
                  className="w-full px-3 py-2 border border-[#E6EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">标准英文编码 *</label>
                <input
                  type="text"
                  value={newStdCode}
                  onChange={(e) => setNewStdCode(e.target.value)}
                  placeholder="例如：DE_CASE_CLOSE_TIME"
                  className="w-full px-3 py-2 border border-[#E6EAF0] rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">所属业务域</label>
                <select
                  value={newStdDomain}
                  onChange={(e) => setNewStdDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E6EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="公共服务">公共服务</option>
                  <option value="人口服务">人口服务</option>
                  <option value="公共基础">公共基础</option>
                  <option value="法人服务">法人服务</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">标准规范 / 值域要求</label>
                <textarea
                  value={newStdReq}
                  onChange={(e) => setNewStdReq(e.target.value)}
                  rows={3}
                  placeholder="请输入数据格式规范或有效码值列表…"
                  className="w-full px-3 py-2 border border-[#E6EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setIsNewStandardModalOpen(false)}
                className="px-4 py-2 border border-[#E6EAF0] rounded-lg font-bold text-xs text-[#172033] hover:bg-[#F1F5F9]"
              >
                取消
              </button>
              <button
                onClick={handleCreateStandard}
                className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-lg text-xs hover:bg-[#1D4ED8]"
              >
                提交发布
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: 导入标准 Modal                                   */}
      {/* ========================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[500px] max-w-full p-6 shadow-2xl space-y-5 border border-[#E6EAF0]">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">导入数据标准文件</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-[#C7D2FE] bg-[#EFF6FF]/40 rounded-xl p-8 text-center space-y-2 cursor-pointer hover:bg-[#EFF6FF] transition-all">
                <FileSpreadsheet className="w-10 h-10 text-[#2563EB] mx-auto" />
                <p className="font-bold text-[#172033]">拖拽 Excel / CSV 文件到此处，或点击上传</p>
                <p className="text-[11px] text-[#64748B]">支持 .xlsx, .xls, .csv 格式，包含数据元或码表模板</p>
              </div>

              <div className="p-3 bg-[#F7F9FC] rounded-lg border border-[#E6EAF0] flex items-center justify-between">
                <span className="text-[#64748B]">或者从已有标准系统同步:</span>
                <button
                  onClick={() => addToast?.('info', '标准系统同步', '正在连接国家数据标准 API 接口…')}
                  className="text-xs font-bold text-[#2563EB] hover:underline"
                >
                  同步国家/行业标准库 →
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-[#E6EAF0] rounded-lg font-bold text-xs text-[#172033] hover:bg-[#F1F5F9]"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: 提出变更 Proposal Modal                         */}
      {/* ========================================================= */}
      {isProposalModalOpen && proposalTarget && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[480px] max-w-full p-6 shadow-2xl space-y-5 border border-[#E6EAF0]">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                提出标准变更提案【{proposalTarget.name}】
              </h3>
              <button
                onClick={() => setIsProposalModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[#1E40AF]">
                正式数据标准不能直接编辑修改。必须提出变更流程说明理由，并由标准评审小组表决通过后生效新版本。
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">变更类型</label>
                <select className="w-full px-3 py-2 border border-[#E6EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]">
                  <option value="VERSION_BUMP">小版本修正 (如补充码值/说明)</option>
                  <option value="REDEFINITION">规则重定义 (需要全域从属系统兼容评估)</option>
                  <option value="DEPRECATE">提议废止标准</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">变更申请说明与理由 *</label>
                <textarea
                  value={proposalReason}
                  onChange={(e) => setProposalReason(e.target.value)}
                  rows={4}
                  placeholder="请详细描述需要修改的内容及业务依据…"
                  className="w-full px-3 py-2 border border-[#E6EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setIsProposalModalOpen(false)}
                className="px-4 py-2 border border-[#E6EAF0] rounded-lg font-bold text-xs text-[#172033] hover:bg-[#F1F5F9]"
              >
                取消
              </button>
              <button
                onClick={handleSubmitProposal}
                className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-lg text-xs hover:bg-[#1D4ED8]"
              >
                提交评审
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
