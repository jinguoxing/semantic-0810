import React, { useState } from 'react';
import {
  Database,
  Table,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Bookmark,
  MoreHorizontal,
  Search,
  Check,
  BarChart2,
  X,
  Sparkles,
  Calendar,
  Layers,
  Activity,
  FileText,
  ShieldCheck,
  ChevronRight,
  User,
  Tag,
  Folder,
  HardDrive,
  GitBranch,
  Info,
  SlidersHorizontal,
  ExternalLink,
  PieChart,
  Filter,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Eye,
  Share2,
  Send,
  RefreshCw,
  Cpu
} from 'lucide-react';

interface DataAssetDetailWorkspaceProps {
  assetId?: string;
  onBackToCatalog?: () => void;
  onNavigateToSemantics?: () => void;
  onNavigateToMarketplace?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

// Interface for Fields Tab
export interface FieldItemData {
  techName: string;
  businessName: string;
  dataType: string;
  constraints: string;
  status: '已确认' | '待确认' | '冲突' | '待完善';
  isNullable: boolean;
  defaultValue?: string;
  keyType?: string;
  desc?: string;
  profileNullRate?: string;
  profileDistinct?: string;
  profileRange?: string;
  profileLastRun?: string;
  qualityIssuesCount?: number;
  qualityRules?: string[];
  qualityAnomalies?: number;
  semanticDefinition?: string;
  semanticType?: string;
  fieldRole?: string;
  businessTerm?: string;
  conflictCandidates?: string[];
}

// Interface for Data Profile Tab
export interface ProfileFieldItem {
  techName: string;
  businessName: string;
  dataType: string;
  nonNullRate: string;
  nonNullPercent: number;
  distinctCount: string;
  uniquenessRate: string;
  valueRange: string;
  traits: string[];
  nullRate: string;
  minVal?: string;
  maxVal?: string;
  distributionNote?: string;
  distributionData?: { label: string; heightPercent: number; countStr: string }[];
  validCountStr?: string;
  nullCountStr?: string;
  qualityRulesCount?: number;
  qualityRuleSample?: string;
  semanticType?: string;
  semanticRole?: string;
  semanticStatus?: '已确认' | '待确认' | '冲突' | '待完善';
}

// Interface for Data Quality Tab
export interface QualityIssue {
  id: string;
  problem: string;
  scope: string;
  dimension: string;
  severity: '严重' | '警告' | '提示';
  recentDiscovery: string;
  status: '待处理' | '处理中' | '已解决' | '忽略';
  ruleName: string;
  affectedCountStr: string;
  affectedFields: string[];
  explanation: string;
  aiAnalysis: {
    summary: string;
    suggestion: string;
  };
}

export interface QualityRule {
  id: string;
  ruleName: string;
  templateName: string;
  dimension: '完整性' | '有效性' | '一致性' | '唯一性' | '准确性';
  scope: string;
  latestResult: '通过' | '未通过';
  summaryStr: string;
  recentDetection: string;
}

export interface QualityRunHistory {
  id: string;
  timeStr: string;
  scope: string;
  ruleCount: number;
  passCount: number;
  failCount: number;
  status: '成功' | '警告' | '失败';
}

export const DataAssetDetailWorkspace: React.FC<DataAssetDetailWorkspaceProps> = ({
  onBackToCatalog,
  onNavigateToSemantics,
  onNavigateToMarketplace,
  addToast,
}) => {
  // Active Tab state: 'overview' | 'fields' | 'profile' | 'quality' | 'semantics' | 'lineage'
  const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'profile' | 'quality' | 'semantics' | 'lineage'>('lineage');
  const [isBookmarked, setIsBookmarked] = useState(true);

  // === DATA LINEAGE TAB STATE ===
  const [lineageGranularity, setLineageGranularity] = useState<'asset' | 'field'>('asset');
  const [lineageDirection, setLineageDirection] = useState<'上下游' | '仅上游' | '仅下游'>('上下游');
  const [lineageDepth, setLineageDepth] = useState<'1层' | '2层' | '3层'>('1层');
  const [lineageAssetTypeFilter, setLineageAssetTypeFilter] = useState<string>('全部类型');
  const [lineageSearchQuery, setLineageSearchQuery] = useState<string>('');
  const [selectedFieldForLineage, setSelectedFieldForLineage] = useState<string>('close_time · 办结时间');
  const [selectedLineageNodeId, setSelectedLineageNodeId] = useState<string | null>('ticket_daily_summary');
  const [selectedLineageEdgeId, setSelectedLineageEdgeId] = useState<string | null>(null);
  const [highlightedPathNodes, setHighlightedPathNodes] = useState<string[]>([]);
  const [showImpactDrawer, setShowImpactDrawer] = useState<boolean>(false);
  const [showLineageMoreMenu, setShowLineageMoreMenu] = useState<boolean>(false);
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([]);
  const [canvasZoomLevel, setCanvasZoomLevel] = useState<number>(100);

  // === DATA QUALITY TAB STATE ===
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>('全部');
  const [ruleDimensionFilter, setRuleDimensionFilter] = useState<string>('全部');
  const [ruleResultFilter, setRuleResultFilter] = useState<string>('全部');
  const [selectedIssue, setSelectedIssue] = useState<QualityIssue | null>({
    id: 'ISSUE-8401',
    problem: '部分记录的办结时间早于创建时间',
    scope: 'created_time → close_time',
    dimension: '一致性',
    severity: '严重',
    recentDiscovery: '今天 17:10',
    status: '待处理',
    ruleName: '工单生命周期时间一致性',
    affectedCountStr: '18 条异常记录',
    affectedFields: ['created_time', 'close_time'],
    explanation: '检测到 18 条工单记录的 close_time 早于 created_time，不符合业务基本逻辑法则，可能由于跨时区格式转换错位或系统离线补录写入异常。',
    aiAnalysis: {
      summary: '这 18 条生命周期时间异常记录集中出现在 8 月 10 日 14:00 - 16:00 批次，关联承办部门为 DEPT-045，极可能由于该部门当日集中导入历史工单数据时时间戳格式转换倒置所致。',
      suggestion: '建议优先联系 DEPT-045 接口人重新回写该批次 18 条工单的时间字段，并在上游写入端增加 created_time <= close_time 前置校验。',
    },
  });

  // === FIELDS TAB STATE ===
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [fieldStatusFilter, setFieldStatusFilter] = useState<string>('全部');
  const [fieldTypeFilter, setFieldTypeFilter] = useState<string>('全部');
  const [fieldConstraintFilter, setFieldConstraintFilter] = useState<string>('全部');
  const [selectedField, setSelectedField] = useState<FieldItemData | null>({
    techName: 'close_time',
    businessName: '办结时间',
    dataType: 'DATETIME',
    constraints: 'Nullable',
    status: '已确认',
    isNullable: true,
    defaultValue: 'NULL',
    keyType: '—',
    desc: '工单归档或反馈闭环完成的正式业务时间戳',
    profileNullRate: '1.2%',
    profileDistinct: '823,401',
    profileRange: '2024-01-02 ～ 2026-08-12',
    profileLastRun: '今天 16:40',
    qualityIssuesCount: 1,
    qualityRules: ['办结时间格式有效性', '办结时间不得早于创建时间'],
    qualityAnomalies: 18,
    semanticDefinition: '服务工单完成办理并进入办结状态的时间',
    semanticType: '事件时间',
    fieldRole: '生命周期结束时间',
    businessTerm: '办结时间',
  });

  // === DATA PROFILE TAB STATE ===
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>('全部');
  const [profileTraitFilter, setProfileTraitFilter] = useState<string>('全部');
  const [selectedProfileField, setSelectedProfileField] = useState<ProfileFieldItem | null>({
    techName: 'close_time',
    businessName: '办结时间',
    dataType: 'DATETIME',
    nonNullRate: '98.8%',
    nonNullPercent: 98.8,
    distinctCount: '823,401',
    uniquenessRate: '64.1%',
    valueRange: '2024-01-03 → 2026-08-12',
    traits: ['存在空值', '时间字段'],
    nullRate: '1.2%',
    minVal: '2024-01-03 08:14',
    maxVal: '2026-08-12 17:48',
    distributionNote: '大部分记录集中在最近 12 个月。',
    distributionData: [
      { label: '24-Q1', heightPercent: 35, countStr: '112,400' },
      { label: '24-Q2', heightPercent: 48, countStr: '154,200' },
      { label: '24-Q3', heightPercent: 58, countStr: '186,100' },
      { label: '24-Q4', heightPercent: 62, countStr: '198,900' },
      { label: '25-Q1', heightPercent: 74, countStr: '237,500' },
      { label: '25-Q2', heightPercent: 88, countStr: '282,100' },
      { label: '25-Q3', heightPercent: 92, countStr: '295,400' },
      { label: '25-Q4', heightPercent: 85, countStr: '272,800' },
      { label: '26-Q1', heightPercent: 95, countStr: '304,200' },
      { label: '26-Q2', heightPercent: 100, countStr: '320,800' },
      { label: '26-Q3', heightPercent: 42, countStr: '134,600' },
    ],
    validCountStr: '1,268,979 条',
    nullCountStr: '15,413 条',
    qualityRulesCount: 2,
    qualityRuleSample: '办结时间不得早于创建时间',
    semanticType: '事件时间',
    semanticRole: '生命周期结束时间',
    semanticStatus: '已确认',
  });

  // DATASET 1: Fields Catalog (for Fields Tab)
  const FIELDS_CATALOG: FieldItemData[] = [
    {
      techName: 'ticket_id',
      businessName: '工单编号',
      dataType: 'VARCHAR(64)',
      constraints: 'PK · NOT NULL',
      status: '已确认',
      isNullable: false,
      defaultValue: '—',
      keyType: 'Primary Key',
      desc: '服务热线唯一工单主键标识',
      profileNullRate: '0.0%',
      profileDistinct: '1,284,392',
      profileRange: 'TK-20240101-00001 ～ TK-20260812-98432',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 0,
      qualityRules: ['主键唯一性校验', '非空性强制约束'],
      qualityAnomalies: 0,
      semanticDefinition: '热线服务工单在全域系统中的唯一主标识编码',
      semanticType: '业务主键',
      fieldRole: '实体唯一标识符',
      businessTerm: '工单编号',
    },
    {
      techName: 'status',
      businessName: '处理状态',
      dataType: 'VARCHAR(16)',
      constraints: 'NOT NULL',
      status: '已确认',
      isNullable: false,
      defaultValue: "'PENDING'",
      keyType: '—',
      desc: '工单业务阶段：待派发/处理中/已办结',
      profileNullRate: '0.0%',
      profileDistinct: '8',
      profileRange: '主要取值: COMPLETED, CLOSED, PROCESSING, PENDING',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 0,
      qualityRules: ['状态枚举合法性校验'],
      qualityAnomalies: 0,
      semanticDefinition: '工单在流转生命周期中所处的当前业务阶段状态',
      semanticType: '状态代码',
      fieldRole: '状态属性',
      businessTerm: '处理状态',
    },
    {
      techName: 'created_time',
      businessName: '创建时间',
      dataType: 'DATETIME',
      constraints: 'NOT NULL',
      status: '已确认',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
      keyType: '—',
      desc: '话务系统受理记录生成时间',
      profileNullRate: '0.0%',
      profileDistinct: '1,173,204',
      profileRange: '2024-01-02 00:00:00 ～ 2026-08-12 17:15:00',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 0,
      qualityRules: ['时间格式规范性', '合理时间跨度检测'],
      qualityAnomalies: 0,
      semanticDefinition: '话务员或在线渠道受理市民诉求并生成工单的时间',
      semanticType: '事件时间',
      fieldRole: '生命周期起始时间',
      businessTerm: '创建时间',
    },
    {
      techName: 'close_time',
      businessName: '办结时间',
      dataType: 'DATETIME',
      constraints: 'Nullable',
      status: '已确认',
      isNullable: true,
      defaultValue: 'NULL',
      keyType: '—',
      desc: '工单归档或反馈闭环完成时间',
      profileNullRate: '1.2%',
      profileDistinct: '823,401',
      profileRange: '2024-01-03 08:14:00 ～ 2026-08-12 17:48:00',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 1,
      qualityRules: ['办结时间格式有效性', '办结时间不得早于创建时间'],
      qualityAnomalies: 18,
      semanticDefinition: '服务工单完成办理并进入办结状态的时间',
      semanticType: '事件时间',
      fieldRole: '生命周期结束时间',
      businessTerm: '办结时间',
    },
    {
      techName: 'person_id',
      businessName: '申请人标识',
      dataType: 'VARCHAR(64)',
      constraints: 'FK',
      status: '已确认',
      isNullable: false,
      defaultValue: '—',
      keyType: 'Foreign Key',
      desc: '诉求市民在人口库的主身份锚定码',
      profileNullRate: '0.05%',
      profileDistinct: '612,940',
      profileRange: 'PID-843920192 ～ PID-998432104',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 0,
      qualityRules: ['外键关联有效性检测', '个人标识脱敏校验'],
      qualityAnomalies: 0,
      semanticDefinition: '提交服务诉求的市民在人口基础数据库中的主锚定身份码',
      semanticType: '身份标识',
      fieldRole: '关联外键',
      businessTerm: '市民标识',
    },
    {
      techName: 'region_code',
      businessName: '受理区域编码',
      dataType: 'VARCHAR(12)',
      constraints: '—',
      status: '待确认',
      isNullable: true,
      defaultValue: 'NULL',
      keyType: '—',
      desc: '诉求事发属地网格化行政区划编码',
      profileNullRate: '0.3%',
      profileDistinct: '14',
      profileRange: '310101 ～ 310115',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 0,
      qualityRules: ['国标区划代码一致性校验'],
      qualityAnomalies: 0,
      semanticDefinition: '市民诉求发生的具体标准行政区划代码',
      semanticType: '区划代码',
      fieldRole: '空间属性',
      businessTerm: '行政区划',
    },
    {
      techName: 'dept_code',
      businessName: '承办部门代码',
      dataType: 'VARCHAR(32)',
      constraints: 'NOT NULL',
      status: '冲突',
      isNullable: false,
      defaultValue: '—',
      keyType: '—',
      desc: '派发责任委办局机关代码',
      profileNullRate: '0.45%',
      profileDistinct: '128',
      profileRange: 'DEPT-001 ～ DEPT-245',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 1,
      qualityRules: ['空值上限告警', '部门代码映射表比对'],
      qualityAnomalies: 642,
      semanticDefinition: '派发处理该工单的具体责任委办局或街道部门代码',
      semanticType: '组织机构编码',
      fieldRole: '责任主体',
      businessTerm: '承办部门',
      conflictCandidates: ['承办部门代码', '派发单位编码', '责任机关标识'],
    },
    {
      techName: 'ext_flag',
      businessName: '—',
      dataType: 'VARCHAR(8)',
      constraints: 'Nullable',
      status: '待完善',
      isNullable: true,
      defaultValue: 'NULL',
      keyType: '—',
      desc: '底层保留扩展属性标记位',
      profileNullRate: '98.5%',
      profileDistinct: '2',
      profileRange: '0, 1',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 0,
      qualityRules: ['通用格式校验'],
      qualityAnomalies: 0,
      semanticDefinition: '尚未定义正式业务语义，需业务专家进一步明确补充。',
      semanticType: '待定义',
      fieldRole: '保留扩展字段',
      businessTerm: '—',
    },
    {
      techName: 'category_code',
      businessName: '工单事项类型分类代码',
      dataType: 'VARCHAR(32)',
      constraints: 'NOT NULL',
      status: '已确认',
      isNullable: false,
      defaultValue: '—',
      keyType: '—',
      desc: '三级事项分类标准编码',
      profileNullRate: '0.0%',
      profileDistinct: '482',
      profileRange: 'CAT-10101 ～ CAT-90402',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 0,
      qualityRules: ['三级分类树合法性'],
      qualityAnomalies: 0,
      semanticDefinition: '服务诉求归属的政务服务三级事项标准分类体系编码',
      semanticType: '分类编码',
      fieldRole: '业务分类',
      businessTerm: '事项分类',
    },
    {
      techName: 'satisfaction_score',
      businessName: '市民评价满意度分值',
      dataType: 'INT',
      constraints: 'Nullable',
      status: '已确认',
      isNullable: true,
      defaultValue: 'NULL',
      keyType: '—',
      desc: '回访市民给出的 1-5 星量化评分',
      profileNullRate: '24.1%',
      profileDistinct: '5',
      profileRange: '1 ～ 5',
      profileLastRun: '今天 16:40',
      qualityIssuesCount: 0,
      qualityRules: ['1-5 分范围约束'],
      qualityAnomalies: 0,
      semanticDefinition: '工单办结后对诉求市民回访所获取的服务满意度星级得分',
      semanticType: '度量数值',
      fieldRole: '评价指标',
      businessTerm: '满意度得分',
    },
  ];

  // DATASET 2: Profile Fields Catalog (for Data Profile Tab)
  const PROFILE_FIELDS_CATALOG: ProfileFieldItem[] = [
    {
      techName: 'ticket_id',
      businessName: '工单编号',
      dataType: 'VARCHAR(64)',
      nonNullRate: '100%',
      nonNullPercent: 100,
      distinctCount: '1,284,392',
      uniquenessRate: '100%',
      valueRange: '—',
      traits: ['高唯一性'],
      nullRate: '0.0%',
      minVal: 'TK-20240101-00001',
      maxVal: 'TK-20260812-98432',
      distributionNote: '唯一主键字段，分布均匀无重复。',
      distributionData: [
        { label: '24-Q1', heightPercent: 50, countStr: '160,000' },
        { label: '24-Q2', heightPercent: 60, countStr: '190,000' },
        { label: '24-Q3', heightPercent: 70, countStr: '220,000' },
        { label: '24-Q4', heightPercent: 80, countStr: '250,000' },
        { label: '25-Q1', heightPercent: 90, countStr: '280,000' },
        { label: '25-Q2', heightPercent: 100, countStr: '310,000' },
        { label: '26-Q1', heightPercent: 85, countStr: '270,000' },
      ],
      validCountStr: '1,284,392 条',
      nullCountStr: '0 条',
      qualityRulesCount: 2,
      qualityRuleSample: '主键唯一性校验',
      semanticType: '业务主键',
      semanticRole: '实体唯一标识符',
      semanticStatus: '已确认',
    },
    {
      techName: 'status',
      businessName: '处理状态',
      dataType: 'VARCHAR(16)',
      nonNullRate: '100%',
      nonNullPercent: 100,
      distinctCount: '8',
      uniquenessRate: '<0.01%',
      valueRange: '8 个主要取值',
      traits: ['低基数'],
      nullRate: '0.0%',
      minVal: 'CLOSED',
      maxVal: 'PROCESSING',
      distributionNote: '主要枚举分布：COMPLETED (68.4%), CLOSED (24.1%), PROCESSING (5.2%), PENDING (2.3%)',
      distributionData: [
        { label: 'COMPLETED', heightPercent: 100, countStr: '878,524' },
        { label: 'CLOSED', heightPercent: 35, countStr: '309,538' },
        { label: 'PROCESSING', heightPercent: 8, countStr: '66,788' },
        { label: 'PENDING', heightPercent: 4, countStr: '29,542' },
      ],
      validCountStr: '1,284,392 条',
      nullCountStr: '0 条',
      qualityRulesCount: 1,
      qualityRuleSample: '状态枚举值合法性约束',
      semanticType: '状态代码',
      semanticRole: '状态属性',
      semanticStatus: '已确认',
    },
    {
      techName: 'created_time',
      businessName: '创建时间',
      dataType: 'DATETIME',
      nonNullRate: '100%',
      nonNullPercent: 100,
      distinctCount: '1,173,204',
      uniquenessRate: '91.3%',
      valueRange: '2024-01-02 → 2026-08-12',
      traits: ['时间字段'],
      nullRate: '0.0%',
      minVal: '2024-01-02 00:00:00',
      maxVal: '2026-08-12 17:15:00',
      distributionNote: '持续稳定增长，无空时间点。',
      distributionData: [
        { label: '24-Q1', heightPercent: 40, countStr: '128,000' },
        { label: '24-Q2', heightPercent: 55, countStr: '176,000' },
        { label: '24-Q3', heightPercent: 68, countStr: '218,000' },
        { label: '24-Q4', heightPercent: 78, countStr: '250,000' },
        { label: '25-Q1', heightPercent: 88, countStr: '282,000' },
        { label: '25-Q2', heightPercent: 98, countStr: '314,000' },
        { label: '26-Q1', heightPercent: 92, countStr: '295,000' },
      ],
      validCountStr: '1,284,392 条',
      nullCountStr: '0 条',
      qualityRulesCount: 2,
      qualityRuleSample: '时间格式规范性与跨度逻辑校验',
      semanticType: '事件时间',
      semanticRole: '生命周期起始时间',
      semanticStatus: '已确认',
    },
    {
      techName: 'close_time',
      businessName: '办结时间',
      dataType: 'DATETIME',
      nonNullRate: '98.8%',
      nonNullPercent: 98.8,
      distinctCount: '823,401',
      uniquenessRate: '64.1%',
      valueRange: '2024-01-03 → 2026-08-12',
      traits: ['存在空值', '时间字段'],
      nullRate: '1.2%',
      minVal: '2024-01-03 08:14',
      maxVal: '2026-08-12 17:48',
      distributionNote: '大部分记录集中在最近 12 个月。',
      distributionData: [
        { label: '24-Q1', heightPercent: 35, countStr: '112,400' },
        { label: '24-Q2', heightPercent: 48, countStr: '154,200' },
        { label: '24-Q3', heightPercent: 58, countStr: '186,100' },
        { label: '24-Q4', heightPercent: 62, countStr: '198,900' },
        { label: '25-Q1', heightPercent: 74, countStr: '237,500' },
        { label: '25-Q2', heightPercent: 88, countStr: '282,100' },
        { label: '25-Q3', heightPercent: 92, countStr: '295,400' },
        { label: '25-Q4', heightPercent: 85, countStr: '272,800' },
        { label: '26-Q1', heightPercent: 95, countStr: '304,200' },
        { label: '26-Q2', heightPercent: 100, countStr: '320,800' },
        { label: '26-Q3', heightPercent: 42, countStr: '134,600' },
      ],
      validCountStr: '1,268,979 条',
      nullCountStr: '15,413 条',
      qualityRulesCount: 2,
      qualityRuleSample: '办结时间不得早于创建时间',
      semanticType: '事件时间',
      semanticRole: '生命周期结束时间',
      semanticStatus: '已确认',
    },
    {
      techName: 'region_code',
      businessName: '受理区域编码',
      dataType: 'VARCHAR(12)',
      nonNullRate: '99.7%',
      nonNullPercent: 99.7,
      distinctCount: '14',
      uniquenessRate: '<0.01%',
      valueRange: '14 个主要取值',
      traits: ['低基数'],
      nullRate: '0.3%',
      minVal: '310101',
      maxVal: '310115',
      distributionNote: '覆盖 14 个行政区划，前 3 大区域占比超过 52%。',
      distributionData: [
        { label: '310101', heightPercent: 100, countStr: '284,100' },
        { label: '310104', heightPercent: 82, countStr: '232,900' },
        { label: '310105', heightPercent: 64, countStr: '182,000' },
        { label: '310107', heightPercent: 52, countStr: '148,200' },
        { label: '310115', heightPercent: 40, countStr: '113,800' },
      ],
      validCountStr: '1,280,538 条',
      nullCountStr: '3,854 条',
      qualityRulesCount: 1,
      qualityRuleSample: '行政区划代码一致性校验',
      semanticType: '区划代码',
      semanticRole: '空间属性',
      semanticStatus: '待确认',
    },
    {
      techName: 'description',
      businessName: '诉求描述文本',
      dataType: 'TEXT',
      nonNullRate: '86.2%',
      nonNullPercent: 86.2,
      distinctCount: '1,104,281',
      uniquenessRate: '86.0%',
      valueRange: '长度 4–2048',
      traits: ['长文本', '存在空值'],
      nullRate: '13.8%',
      minVal: '4 字符',
      maxVal: '2048 字符',
      distributionNote: '平均文本长度 142 字符，存在约 13.8% 缺失诉求描述记录。',
      distributionData: [
        { label: '0-20字', heightPercent: 20, countStr: '220,000' },
        { label: '20-100字', heightPercent: 75, countStr: '820,000' },
        { label: '100-500字', heightPercent: 100, countStr: '1,100,000' },
        { label: '500字+', heightPercent: 15, countStr: '160,000' },
      ],
      validCountStr: '1,107,145 条',
      nullCountStr: '177,247 条',
      qualityRulesCount: 1,
      qualityRuleSample: '文本最小长度约束与敏感词检测',
      semanticType: '长文本描述',
      semanticRole: '业务文本',
      semanticStatus: '已确认',
    },
    {
      techName: 'person_id',
      businessName: '申请人标识',
      dataType: 'VARCHAR(64)',
      nonNullRate: '99.95%',
      nonNullPercent: 99.95,
      distinctCount: '612,940',
      uniquenessRate: '47.7%',
      valueRange: '范式 PID-843920192',
      traits: ['高唯一性'],
      nullRate: '0.05%',
      minVal: 'PID-843920192',
      maxVal: 'PID-998432104',
      distributionNote: '关联人口库主键，平均单个市民发起 2.1 次服务诉求。',
      distributionData: [
        { label: '1次', heightPercent: 100, countStr: '420,000' },
        { label: '2-3次', heightPercent: 65, countStr: '270,000' },
        { label: '4-5次', heightPercent: 30, countStr: '125,000' },
        { label: '5次+', heightPercent: 12, countStr: '50,000' },
      ],
      validCountStr: '1,283,750 条',
      nullCountStr: '642 条',
      qualityRulesCount: 1,
      qualityRuleSample: '外键关联有效性与身份证脱敏校验',
      semanticType: '身份标识',
      semanticRole: '关联外键',
      semanticStatus: '已确认',
    },
    {
      techName: 'dept_code',
      businessName: '承办部门代码',
      dataType: 'VARCHAR(32)',
      nonNullRate: '99.55%',
      nonNullPercent: 99.55,
      distinctCount: '128',
      uniquenessRate: '0.01%',
      valueRange: '128 个主要取值',
      traits: ['低基数', '存在空值'],
      nullRate: '0.45%',
      minVal: 'DEPT-001',
      maxVal: 'DEPT-245',
      distributionNote: '涉及 128 个委办局及街道，存在语义命名歧义冲突。',
      distributionData: [
        { label: 'DEPT-001', heightPercent: 100, countStr: '142,000' },
        { label: 'DEPT-005', heightPercent: 80, countStr: '113,600' },
        { label: 'DEPT-012', heightPercent: 60, countStr: '85,200' },
        { label: 'DEPT-045', heightPercent: 45, countStr: '63,900' },
      ],
      validCountStr: '1,278,612 条',
      nullCountStr: '5,780 条',
      qualityRulesCount: 1,
      qualityRuleSample: '部门代码映射比对与空值上限校验',
      semanticType: '组织机构编码',
      semanticRole: '责任主体',
      semanticStatus: '冲突',
    },
    {
      techName: 'category_code',
      businessName: '事项分类代码',
      dataType: 'VARCHAR(32)',
      nonNullRate: '100%',
      nonNullPercent: 100,
      distinctCount: '482',
      uniquenessRate: '0.04%',
      valueRange: 'CAT-10101 ～ CAT-90402',
      traits: ['低基数'],
      nullRate: '0.0%',
      minVal: 'CAT-10101',
      maxVal: 'CAT-90402',
      distributionNote: '标准政务服务三级事项分类编码，完全无缺失。',
      distributionData: [
        { label: 'CAT-1', heightPercent: 100, countStr: '320,000' },
        { label: 'CAT-2', heightPercent: 75, countStr: '240,000' },
        { label: 'CAT-3', heightPercent: 55, countStr: '176,000' },
        { label: 'CAT-4', heightPercent: 40, countStr: '128,000' },
      ],
      validCountStr: '1,284,392 条',
      nullCountStr: '0 条',
      qualityRulesCount: 1,
      qualityRuleSample: '三级分类树合规性比对',
      semanticType: '分类编码',
      semanticRole: '业务分类',
      semanticStatus: '已确认',
    },
    {
      techName: 'satisfaction_score',
      businessName: '市民满意度分值',
      dataType: 'INT',
      nonNullRate: '75.9%',
      nonNullPercent: 75.9,
      distinctCount: '5',
      uniquenessRate: '<0.01%',
      valueRange: '1 ～ 5',
      traits: ['低基数', '存在空值'],
      nullRate: '24.1%',
      minVal: '1',
      maxVal: '5',
      distributionNote: '回访成功率 75.9%，其中 5 星满意占比 82.1%。',
      distributionData: [
        { label: '5星', heightPercent: 100, countStr: '800,200' },
        { label: '4星', heightPercent: 18, countStr: '144,000' },
        { label: '3星', heightPercent: 3, countStr: '24,000' },
        { label: '1-2星', heightPercent: 1, countStr: '8,000' },
      ],
      validCountStr: '974,853 条',
      nullCountStr: '309,539 条 (未回访或拒答)',
      qualityRulesCount: 1,
      qualityRuleSample: '1-5 分合法数值范围约束',
      semanticType: '度量数值',
      semanticRole: '评价指标',
      semanticStatus: '已确认',
    },
  ];

  // DATASET 2: Quality Issues (for Quality Tab)
  const QUALITY_ISSUES: QualityIssue[] = [
    {
      id: 'ISSUE-8401',
      problem: '部分记录的办结时间早于创建时间',
      scope: 'created_time → close_time',
      dimension: '一致性',
      severity: '严重',
      recentDiscovery: '今天 17:10',
      status: '待处理',
      ruleName: '工单生命周期时间一致性',
      affectedCountStr: '18 条异常记录',
      affectedFields: ['created_time', 'close_time'],
      explanation: '检测到 18 条工单记录的 close_time 早于 created_time，不符合业务基本逻辑法则，可能由于跨时区格式转换错位或系统离线补录写入异常。',
      aiAnalysis: {
        summary: '这 18 条生命周期时间异常记录集中出现在 8 月 10 日 14:00 - 16:00 批次，关联承办部门为 DEPT-045，极可能由于该部门当日集中导入历史工单数据时时间戳格式转换倒置所致。',
        suggestion: '建议优先联系 DEPT-045 接口人重新回写该批次 18 条工单的时间字段，并在上游写入端增加 created_time <= close_time 前置校验。',
      },
    },
    {
      id: 'ISSUE-8402',
      problem: '办结时间缺失率超过规则阈值',
      scope: 'close_time',
      dimension: '完整性',
      severity: '警告',
      recentDiscovery: '今天 17:10',
      status: '待处理',
      ruleName: '办结时间完整性',
      affectedCountStr: '空值率 1.2% (阈值 ≤0.5%)',
      affectedFields: ['close_time'],
      explanation: 'close_time 字段实际空值率为 1.2%，超过质量阈值配置 (≤0.5%)。部分已标注“办结”状态的工单漏填了办结时间。',
      aiAnalysis: {
        summary: '分析显示该空值增量主要来自工单状态为“已办结”但办结时间为 NULL 的 15,412 条增量数据，主要源自移动端小程序批量结案接口未强管控必填。',
        suggestion: '建议在工单结案 API 增加强约束，强制传入有效 datetime 时间戳。',
      },
    },
    {
      id: 'ISSUE-8403',
      problem: '受理区域编码存在未映射取值',
      scope: 'region_code',
      dimension: '有效性',
      severity: '提示',
      recentDiscovery: '昨天 17:08',
      status: '处理中',
      ruleName: '受理区域编码标准约束',
      affectedCountStr: '3 个未登记编码取值',
      affectedFields: ['region_code'],
      explanation: 'region_code 出现 3 个不在标准行政区划代码表中的新编码 (310115999, 310104888)，导致与上级数据中心统计错位。',
      aiAnalysis: {
        summary: '该问题系新设园区临时划定区域编码，尚未同步至主数据码表体系。',
        suggestion: '建议将 3 个新编码补录至标准行政区划维表，或设置清洗映射规则。',
      },
    },
  ];

  // DATASET 3: Quality Rules (for Quality Tab)
  const QUALITY_RULES: QualityRule[] = [
    {
      id: 'RULE-101',
      ruleName: '工单编号非空',
      templateName: '质量模板: 主键与关键标识非空校验',
      dimension: '完整性',
      scope: 'ticket_id',
      latestResult: '通过',
      summaryStr: '非空率 100% (1,284,392/1,284,392)',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-102',
      ruleName: '办结时间完整性',
      templateName: '质量模板: 时间字段完整性检查',
      dimension: '完整性',
      scope: 'close_time',
      latestResult: '未通过',
      summaryStr: '空值率 1.2% / 要求 ≤0.5%',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-103',
      ruleName: '工单状态值域有效性',
      templateName: '业务规则: 工单状态码表映射约束',
      dimension: '有效性',
      scope: 'status',
      latestResult: '通过',
      summaryStr: '8 个取值均在允许码表范围内',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-104',
      ruleName: '生命周期时间一致性',
      templateName: '业务规则: 公共服务质量监控方案',
      dimension: '一致性',
      scope: 'created_time → close_time',
      latestResult: '未通过',
      summaryStr: '18 条记录不符合规则',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-105',
      ruleName: '市民标识关联有效性',
      templateName: '关联规则: 人口库主身份关联检查',
      dimension: '唯一性',
      scope: 'person_id',
      latestResult: '通过',
      summaryStr: '外键引用有效率 99.95%',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-106',
      ruleName: '市民满意度分值范围约束',
      templateName: '质量模板: 数值区间边界约束',
      dimension: '有效性',
      scope: 'satisfaction_score',
      latestResult: '通过',
      summaryStr: '1-5 分合法取值率 100%',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-107',
      ruleName: '承办部门代码非空率',
      templateName: '质量模板: 空值上限阈值约束',
      dimension: '完整性',
      scope: 'dept_code',
      latestResult: '通过',
      summaryStr: '空值率 0.45% / 要求 ≤1.0%',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-108',
      ruleName: '事项分类三级树合规性',
      templateName: '业务规则: 政务三级分类约束',
      dimension: '有效性',
      scope: 'category_code',
      latestResult: '通过',
      summaryStr: '100% 符合标准三级分类树',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-109',
      ruleName: '联系电话格式有效性',
      templateName: '质量模板: 手机/固话正则格式校验',
      dimension: '有效性',
      scope: 'contact_phone',
      latestResult: '通过',
      summaryStr: '通过率 99.98%',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-110',
      ruleName: '诉求描述最小长度约束',
      templateName: '质量模板: 文本最小长度约束',
      dimension: '完整性',
      scope: 'description',
      latestResult: '通过',
      summaryStr: '非空记录均 ≥4 字符',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-111',
      ruleName: '满意度评价时效约束',
      templateName: '业务规则: 评价时间不早于办结时间',
      dimension: '一致性',
      scope: 'close_time → evaluation_time',
      latestResult: '通过',
      summaryStr: '评价时间均晚于办结时间',
      recentDetection: '今天 17:10',
    },
    {
      id: 'RULE-112',
      ruleName: '工单主键全局唯一性',
      templateName: '质量模板: 全表主键唯一性断言',
      dimension: '唯一性',
      scope: 'ticket_id',
      latestResult: '通过',
      summaryStr: '重复行记录数 0',
      recentDetection: '今天 17:10',
    },
  ];

  // DATASET 4: Quality Run History (for Quality Tab)
  const QUALITY_RUN_HISTORY: QualityRunHistory[] = [
    {
      id: 'RUN-20260812-1710',
      timeStr: '今天 17:10',
      scope: '当前资产全量',
      ruleCount: 12,
      passCount: 10,
      failCount: 2,
      status: '成功',
    },
    {
      id: 'RUN-20260811-1708',
      timeStr: '昨天 17:08',
      scope: '当前资产全量',
      ruleCount: 12,
      passCount: 11,
      failCount: 1,
      status: '成功',
    },
    {
      id: 'RUN-20260810-1705',
      timeStr: '8月10日 17:05',
      scope: '当前资产全量',
      ruleCount: 11,
      passCount: 11,
      failCount: 0,
      status: '成功',
    },
  ];

  // Filtering for Fields Tab Table
  const filteredFieldsCatalog = FIELDS_CATALOG.filter((f) => {
    const matchesSearch =
      fieldSearchQuery === '' ||
      f.techName.toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
      f.businessName.toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
      (f.desc && f.desc.toLowerCase().includes(fieldSearchQuery.toLowerCase()));

    const matchesStatus = fieldStatusFilter === '全部' || f.status === fieldStatusFilter;

    let matchesType = true;
    if (fieldTypeFilter === '文本') matchesType = f.dataType.startsWith('VARCHAR') || f.dataType.startsWith('TEXT');
    else if (fieldTypeFilter === '数值') matchesType = f.dataType.startsWith('INT') || f.dataType.startsWith('BIGINT') || f.dataType.startsWith('DECIMAL');
    else if (fieldTypeFilter === '日期时间') matchesType = f.dataType.startsWith('DATETIME') || f.dataType.startsWith('DATE');

    let matchesConstraint = true;
    if (fieldConstraintFilter === 'Primary Key') matchesConstraint = f.constraints.includes('PK');
    else if (fieldConstraintFilter === 'Foreign Key') matchesConstraint = f.constraints.includes('FK');
    else if (fieldConstraintFilter === 'Not Null') matchesConstraint = f.constraints.includes('NOT NULL');
    else if (fieldConstraintFilter === 'Nullable') matchesConstraint = f.constraints.includes('Nullable');

    return matchesSearch && matchesStatus && matchesType && matchesConstraint;
  });

  // Filtering for Data Profile Tab Table
  const filteredProfileFields = PROFILE_FIELDS_CATALOG.filter((f) => {
    const matchesSearch =
      profileSearchQuery === '' ||
      f.techName.toLowerCase().includes(profileSearchQuery.toLowerCase()) ||
      f.businessName.toLowerCase().includes(profileSearchQuery.toLowerCase());

    let matchesType = true;
    if (profileTypeFilter === '文本') matchesType = f.dataType.startsWith('VARCHAR') || f.dataType.startsWith('TEXT');
    else if (profileTypeFilter === '数值') matchesType = f.dataType.startsWith('INT') || f.dataType.startsWith('BIGINT') || f.dataType.startsWith('DECIMAL');
    else if (profileTypeFilter === '日期时间') matchesType = f.dataType.startsWith('DATETIME') || f.dataType.startsWith('DATE');

    let matchesTrait = true;
    if (profileTraitFilter !== '全部') {
      matchesTrait = f.traits.includes(profileTraitFilter);
    }

    return matchesSearch && matchesType && matchesTrait;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* SECTION 1: Unified Data Asset Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 pt-4 pb-4 shrink-0 shadow-2xs">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-2">
          <button
            onClick={onBackToCatalog}
            className="hover:text-[#2563EB] hover:underline cursor-pointer transition-colors"
          >
            数据治理
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <button
            onClick={onBackToCatalog}
            className="hover:text-[#2563EB] hover:underline cursor-pointer transition-colors"
          >
            数据资产
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <span className="font-bold text-[#0F172A]">公共服务热线工单记录表</span>
        </div>

        {/* Title, Badges & Lightweight Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-4xl">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                公共服务热线工单记录表
              </h1>
              <div className="flex items-center space-x-1.5">
                <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold text-[11px] rounded">
                  Table
                </span>
                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] font-medium text-[11px] rounded">
                  MySQL
                </span>
                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] font-medium text-[11px] rounded">
                  公共服务热线库
                </span>
                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] font-medium text-[11px] rounded">
                  公共服务
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs text-[#64748B]">
              <div className="font-mono text-xs text-[#475569] flex items-center space-x-1.5 bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                <Database className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="font-semibold">hotline_db.service.pop_service_hotline</span>
              </div>
              <span className="text-[#CBD5E1]">|</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>最近更新：今天 14:20</span>
              </span>
              <span className="text-[#CBD5E1]">|</span>
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span className="font-medium text-[#059669]">资产状态：已入库</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                if (addToast) addToast('success', isBookmarked ? '取消收藏' : '已添加收藏', '资产状态已更新');
              }}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                  : 'bg-white border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="收藏此数据资产"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => {
                if (addToast) addToast('info', '更多操作', '包含：导出 Schema、发起数据探查、申请访问权限');
              }}
              className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] rounded-lg transition-all cursor-pointer"
              title="更多操作"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Complete Detail Tabs */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 pt-2 pb-0 shrink-0">
        <div className="flex items-center space-x-1 text-xs font-semibold">
          {[
            { id: 'overview', label: '概览' },
            { id: 'fields', label: '字段', badge: '36' },
            { id: 'profile', label: '数据画像' },
            { id: 'quality', label: '数据质量', badge: '3 项问题' },
            { id: 'semantics', label: '数据语义', badge: '核心已确认' },
            { id: 'lineage', label: '血缘' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 px-3.5 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#2563EB] text-[#2563EB] font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      tab.id === 'fields'
                        ? isActive
                          ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                          : 'bg-[#F1F5F9] text-[#64748B]'
                        : tab.id === 'quality'
                        ? 'bg-[#FEF2F2] text-[#DC2626] font-bold'
                        : 'bg-[#ECFDF5] text-[#059669] font-medium'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Main Viewport Switcher */}
      <div className="flex-1 overflow-hidden flex relative">
        {activeTab === 'overview' ? (
          /* TAB 1: OVERVIEW (概览) - Full Implementation */
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="max-w-7xl mx-auto space-y-5">
              {/* Asset Description & Key Metadata */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[#0F172A]">业务描述与定义</h2>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    本表为公共服务热线 (12345) 业务系统的核心工单记录表，全量承载市民诉求从呼入受理、派发委办局、办理跟踪、反馈归档至服务满意度回访的全生命周期闭环数据。为政务热线效能分析、热点诉求挖掘与政务服务感知评估提供标准高信任数据支撑。
                  </p>
                </div>

                {/* Metadata Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-[#F1F5F9] text-xs">
                  <div>
                    <div className="text-[#64748B] text-[11px]">所属数据库</div>
                    <div className="font-semibold text-[#0F172A] pt-0.5">hotline_db (MySQL)</div>
                  </div>
                  <div>
                    <div className="text-[#64748B] text-[11px]">数据规模</div>
                    <div className="font-mono font-bold text-[#0F172A] pt-0.5">1,284,392 行 (428 MB)</div>
                  </div>
                  <div>
                    <div className="text-[#64748B] text-[11px]">责任部门 / 负责人</div>
                    <div className="font-semibold text-[#0F172A] pt-0.5">市政热线治理组 · 张三</div>
                  </div>
                  <div>
                    <div className="text-[#64748B] text-[11px]">同步频率</div>
                    <div className="font-semibold text-[#0F172A] pt-0.5">实时增量同步 (5 min)</div>
                  </div>
                </div>

                {/* Asset Tags */}
                <div className="pt-2 flex items-center space-x-2 text-xs">
                  <span className="text-[#64748B] text-[11px]">分类标签:</span>
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded text-[11px] font-medium">核心资产</span>
                    <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded text-[11px] font-medium">市民诉求</span>
                    <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded text-[11px] font-medium">政务热线</span>
                    <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded text-[11px] font-medium">PII 已脱敏</span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Structure Card */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center space-x-1.5">
                      <Table className="w-4 h-4 text-[#2563EB]" />
                      <span>数据结构 (36 字段)</span>
                    </span>
                    <button
                      onClick={() => setActiveTab('fields')}
                      className="text-xs text-[#2563EB] hover:underline font-bold"
                    >
                      查看字段 →
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B]">包含 1 个主键 (ticket_id)、1 个外键 (person_id)、2 个事件时间戳，已确认 32 个字段生效语义。</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center space-x-1.5">
                      <BarChart2 className="w-4 h-4 text-[#059669]" />
                      <span>数据画像 (128 万行)</span>
                    </span>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="text-xs text-[#2563EB] hover:underline font-bold"
                    >
                      查看画像 →
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B]">最新探查显示数据时间跨度为 2024-01-02 至 2026-08-12，涵盖 5 个高唯一性与 8 个低基数字段。</p>
                </div>

                {/* Quality Card */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                      <span>数据质量 (8 条规则)</span>
                    </span>
                    <button
                      onClick={() => setActiveTab('quality')}
                      className="text-xs text-[#2563EB] hover:underline font-bold"
                    >
                      查看质量 →
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B]">整体逻辑一致性率 98.5%，存在 1 项关于办结时间合理性的边界异常告警。</p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'fields' ? (
          /* TAB 2: FIELDS CATALOG (字段) - Full Implementation */
          <div className="flex-1 overflow-hidden flex relative">
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6">
              <div className="max-w-7xl w-full mx-auto space-y-4">
                {/* Header Title Section */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-xl font-bold text-[#0F172A]">字段结构 catalog</h1>
                      <span className="px-2 py-0.5 bg-[#F1F5F9] border border-[#CBD5E1] text-[#475569] text-xs font-mono font-bold rounded-full">
                        36 个字段
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] pt-1">
                      查看当前数据资产的物理字段结构、数据类型、主外键约束与当前生效的正式业务语义。
                    </p>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="relative min-w-[280px] flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fieldSearchQuery}
                      onChange={(e) => setFieldSearchQuery(e.target.value)}
                      placeholder="搜索字段名称、业务名称或含义说明…"
                      className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#64748B] text-[11px]">语义状态:</span>
                      <select
                        value={fieldStatusFilter}
                        onChange={(e) => setFieldStatusFilter(e.target.value)}
                        className="bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer"
                      >
                        <option value="全部">全部状态</option>
                        <option value="已确认">已确认</option>
                        <option value="待确认">待确认</option>
                        <option value="冲突">冲突</option>
                        <option value="待完善">待完善</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#64748B] text-[11px]">字段类型:</span>
                      <select
                        value={fieldTypeFilter}
                        onChange={(e) => setFieldTypeFilter(e.target.value)}
                        className="bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer"
                      >
                        <option value="全部">全部类型</option>
                        <option value="文本">文本</option>
                        <option value="数值">数值</option>
                        <option value="日期时间">日期时间</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#64748B] text-[11px]">约束条件:</span>
                      <select
                        value={fieldConstraintFilter}
                        onChange={(e) => setFieldConstraintFilter(e.target.value)}
                        className="bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer"
                      >
                        <option value="全部">全部约束</option>
                        <option value="Primary Key">Primary Key</option>
                        <option value="Foreign Key">Foreign Key</option>
                        <option value="Not Null">Not Null</option>
                        <option value="Nullable">Nullable</option>
                      </select>
                    </div>

                    {(fieldStatusFilter !== '全部' || fieldTypeFilter !== '全部' || fieldConstraintFilter !== '全部' || fieldSearchQuery !== '') && (
                      <button
                        onClick={() => {
                          setFieldStatusFilter('全部');
                          setFieldTypeFilter('全部');
                          setFieldConstraintFilter('全部');
                          setFieldSearchQuery('');
                        }}
                        className="text-[#2563EB] hover:underline text-[11px] font-medium px-1.5 py-1 cursor-pointer"
                      >
                        重置
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] bg-[#F8FAFC]">
                          <th className="py-3 px-4 w-[22%]">字段 (Technical)</th>
                          <th className="py-3 px-4 w-[20%]">业务名称 (Effective)</th>
                          <th className="py-3 px-4 w-[16%]">数据类型</th>
                          <th className="py-3 px-4 w-[18%]">约束</th>
                          <th className="py-3 px-4 w-[16%]">语义状态</th>
                          <th className="py-3 px-4 w-[8%] text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9] text-xs">
                        {filteredFieldsCatalog.map((f, idx) => {
                          const isSelected = selectedField?.techName === f.techName;
                          return (
                            <tr
                              key={idx}
                              onClick={() => setSelectedField(f)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#EFF6FF]/70 border-l-4 border-l-[#2563EB]'
                                  : 'hover:bg-[#F8FAFC]'
                              }`}
                            >
                              <td className="py-3 px-4 font-mono font-semibold text-[#0F172A]">
                                <div className="flex items-center space-x-2">
                                  <span>{f.techName}</span>
                                  {f.constraints.includes('PK') && (
                                    <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[9px] font-mono font-bold rounded">
                                      PK
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 font-bold text-[#0F172A]">
                                {f.businessName === '—' ? (
                                  <span className="text-[#94A3B8] font-mono font-normal">—</span>
                                ) : (
                                  <span>{f.businessName}</span>
                                )}
                              </td>

                              <td className="py-3 px-4 font-mono text-[#334155] text-[11px]">
                                {f.dataType}
                              </td>

                              <td className="py-3 px-4">
                                {f.constraints.includes('PK') ? (
                                  <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-mono text-[10px] font-bold rounded">
                                    {f.constraints}
                                  </span>
                                ) : f.constraints.includes('FK') ? (
                                  <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] font-mono text-[10px] font-bold rounded">
                                    FK · NOT NULL
                                  </span>
                                ) : f.constraints.includes('NOT NULL') ? (
                                  <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] font-mono text-[10px] font-semibold rounded">
                                    NOT NULL
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#94A3B8] font-mono">Nullable</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                {f.status === '已确认' ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-bold rounded">
                                    <Check className="w-3 h-3 text-[#059669]" />
                                    <span>已确认</span>
                                  </span>
                                ) : f.status === '待确认' ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-[11px] font-bold rounded">
                                    <Clock className="w-3 h-3 text-[#D97706]" />
                                    <span>待确认</span>
                                  </span>
                                ) : f.status === '冲突' ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-[11px] font-bold rounded">
                                    <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
                                    <span>冲突</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1] text-[11px] font-medium rounded">
                                    <span>待完善</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedField(f);
                                  }}
                                  className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
                                  title="查看字段详情"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-4 py-2.5 text-xs text-[#64748B] flex items-center justify-between">
                    <span>显示 {filteredFieldsCatalog.length} 个字段，共 36 个字段</span>
                    <span className="text-[11px] text-[#94A3B8]">点击行可展开右侧 Field Detail Drawer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Drawer for Selected Field in Fields Tab */}
            {selectedField && (
              <div className="w-[460px] border-l border-[#E2E8F0] bg-white h-full overflow-y-auto flex flex-col shadow-lg shrink-0 transition-all z-20">
                <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between shrink-0">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold font-mono text-[#0F172A]">
                        {selectedField.techName}
                      </h2>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          selectedField.status === '已确认'
                            ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                            : selectedField.status === '待确认'
                            ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                            : selectedField.status === '冲突'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]'
                        }`}
                      >
                        {selectedField.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#2563EB]">
                      {selectedField.businessName === '—' ? '未置信定义业务名称' : selectedField.businessName}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedField(null)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-5 text-xs flex-1 overflow-y-auto">
                  {/* Block 1: Technical Info */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center justify-between">
                      <span>字段信息 (Technical Info)</span>
                      <Table className="w-3.5 h-3.5 text-[#2563EB]" />
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B]">数据类型:</span>
                        <span className="font-mono font-bold text-[#0F172A] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                          {selectedField.dataType}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B]">Nullable:</span>
                        <span className="font-mono font-medium text-[#0F172A]">
                          {selectedField.isNullable ? 'Yes (可空)' : 'No (必填)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B]">Default:</span>
                        <span className="font-mono text-[#64748B]">{selectedField.defaultValue || '—'}</span>
                      </div>
                      <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                        <div className="text-[#64748B] text-[11px]">来源全路径:</div>
                        <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded font-mono text-[11px] text-[#334155] break-all">
                          hotline_db.service.pop_service_hotline.{selectedField.techName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Profile Summary */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center justify-between">
                      <span>数据画像 (Summary)</span>
                      <BarChart2 className="w-3.5 h-3.5 text-[#059669]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                        <div className="text-[11px] text-[#64748B]">空值率</div>
                        <div className="font-mono font-bold text-sm text-[#0F172A] pt-0.5">
                          {selectedField.profileNullRate || '0.0%'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                        <div className="text-[11px] text-[#64748B]">Distinct 唯一定值</div>
                        <div className="font-mono font-bold text-sm text-[#0F172A] pt-0.5">
                          {selectedField.profileDistinct || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-[#F1F5F9]">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          if (addToast) addToast('info', '数据画像', `跳转至 ${selectedField.techName} 的物理画像视图`);
                        }}
                        className="text-xs font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>查看完整数据画像</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Block 3: Semantic Definition Summary */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center justify-between">
                      <span>数据语义 (Summary)</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                    </div>
                    <p className="text-[#334155] leading-relaxed text-[11px]">
                      {selectedField.semanticDefinition || selectedField.desc}
                    </p>
                    <div className="pt-1 border-t border-[#F1F5F9]">
                      <button
                        onClick={() => {
                          if (onNavigateToSemantics) onNavigateToSemantics();
                          else setActiveTab('semantics');
                        }}
                        className="text-xs font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>进入语义理解</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'profile' ? (
          /* TAB 3: DATA PROFILE (数据画像) - Full Implementation */
          <div className="flex-1 flex overflow-hidden w-full">
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6">
              <div className="max-w-7xl w-full mx-auto space-y-5">
                {/* 1. Page Title & Action Bar */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h1 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2">
                      <span>数据画像</span>
                      <span className="text-xs font-normal text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1]">
                        Data Profile
                      </span>
                    </h1>
                    <p className="text-xs text-[#64748B]">
                      查看当前数据资产最新的数据规模、分布以及字段统计特征。
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (addToast) addToast('info', '查看探查运行', '跳转至 Data Profiling Task Execution Context');
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                    >
                      <span>查看探查运行</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
                    </button>

                    <button
                      onClick={() => {
                        if (addToast) addToast('info', '探查配置', '包含：重新发起探查、查看历史运行日志');
                      }}
                      className="p-1.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] rounded-lg transition-colors cursor-pointer"
                      title="更多探查选项"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Recent Profiling Status Bar */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center space-x-3 text-[#334155]">
                    <div className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span className="font-semibold text-[#0F172A]">
                      最新画像：今天 16:40 · 完整探查 · 1,284,392 行 · 36 个字段
                    </span>
                    <span className="text-[#CBD5E1]">|</span>
                    <span className="text-[#64748B]">来自最近一次成功探查</span>
                  </div>

                  <button
                    onClick={() => {
                      if (addToast) addToast('info', '探查日志', '已被导航至 Profiling Run #8432 明细');
                    }}
                    className="text-[#2563EB] font-semibold hover:underline text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看运行详情</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3. Profile Overview Grid */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="text-xs font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2.5 flex items-center justify-between">
                    <span>数据概况</span>
                    <span className="text-[11px] font-normal text-[#94A3B8]">全量物理探查事实摘要</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-1">
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-[#64748B]">记录数</div>
                      <div className="font-mono font-bold text-base text-[#0F172A]">1,284,392</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] text-[#64748B]">字段数</div>
                      <div className="font-mono font-bold text-base text-[#0F172A]">36</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] text-[#64748B]">已采集字段画像</div>
                      <div className="font-mono font-bold text-base text-[#0F172A]">36 / 36</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] text-[#64748B]">画像方式</div>
                      <div className="font-bold text-xs text-[#0F172A] pt-1">完整探查</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] text-[#64748B]">最近画像</div>
                      <div className="font-bold text-xs text-[#0F172A] pt-1">今天 16:40</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] text-[#64748B]">数据范围</div>
                      <div className="font-mono font-semibold text-xs text-[#0F172A] pt-1">
                        2024-01-02 ～ 2026-08-12
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center space-x-2 text-xs">
                    <span className="font-bold text-[#475569] shrink-0">数据特征:</span>
                    <div className="flex items-center space-x-2 text-[#334155] font-medium flex-wrap">
                      <span className="bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1] text-[11px]">
                        5 个高唯一性字段
                      </span>
                      <span>·</span>
                      <span className="bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1] text-[11px]">
                        8 个低基数字段
                      </span>
                      <span>·</span>
                      <span className="bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1] text-[11px]">
                        12 个存在空值字段
                      </span>
                      <span>·</span>
                      <span className="bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1] text-[11px]">
                        6 个时间字段
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Field Profile Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#0F172A]">字段画像</h2>
                      <p className="text-xs text-[#64748B]">对比字段的完整性、基数、唯一性和值域特征。</p>
                    </div>

                    <div className="text-xs text-[#64748B]">
                      已采集 <span className="font-bold text-[#0F172A]">10</span> / 36 个字段的深入物理特征
                    </div>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="relative min-w-[280px] flex-1 max-w-md">
                      <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileSearchQuery}
                        onChange={(e) => setProfileSearchQuery(e.target.value)}
                        placeholder="搜索字段名称或业务名称…"
                        className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="flex items-center space-x-2 flex-wrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[#64748B] text-[11px]">数据类型:</span>
                        <select
                          value={profileTypeFilter}
                          onChange={(e) => setProfileTypeFilter(e.target.value)}
                          className="bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer"
                        >
                          <option value="全部">全部类型</option>
                          <option value="文本">文本</option>
                          <option value="数值">数值</option>
                          <option value="日期时间">日期时间</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-[#64748B] text-[11px]">画像特征:</span>
                        <select
                          value={profileTraitFilter}
                          onChange={(e) => setProfileTraitFilter(e.target.value)}
                          className="bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer"
                        >
                          <option value="全部">全部特征</option>
                          <option value="高唯一性">高唯一性</option>
                          <option value="低基数">低基数</option>
                          <option value="存在空值">存在空值</option>
                          <option value="时间字段">时间字段</option>
                          <option value="长文本">长文本</option>
                        </select>
                      </div>

                      {(profileTypeFilter !== '全部' || profileTraitFilter !== '全部' || profileSearchQuery !== '') && (
                        <button
                          onClick={() => {
                            setProfileTypeFilter('全部');
                            setProfileTraitFilter('全部');
                            setProfileSearchQuery('');
                          }}
                          className="text-[#2563EB] hover:underline text-[11px] font-medium px-1.5 py-1 cursor-pointer"
                        >
                          重置
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] bg-[#F8FAFC]">
                            <th className="py-3 px-4 w-[20%]">字段 (Technical)</th>
                            <th className="py-3 px-4 w-[12%]">数据类型</th>
                            <th className="py-3 px-4 w-[14%]">非空率</th>
                            <th className="py-3 px-4 w-[12%]">Distinct</th>
                            <th className="py-3 px-4 w-[12%]">唯一率</th>
                            <th className="py-3 px-4 w-[20%]">值域 / 分布摘要</th>
                            <th className="py-3 px-4 w-[10%] text-right">画像特征</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9] text-xs">
                          {filteredProfileFields.map((f, idx) => {
                            const isSelected = selectedProfileField?.techName === f.techName;
                            return (
                              <tr
                                key={idx}
                                onClick={() => setSelectedProfileField(f)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-[#EFF6FF]/70 border-l-4 border-l-[#2563EB]'
                                    : 'hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <div className="font-mono font-semibold text-[#0F172A] flex items-center space-x-1.5">
                                    <span>{f.techName}</span>
                                  </div>
                                  <div className="text-[11px] text-[#64748B] pt-0.5 font-medium">
                                    {f.businessName}
                                  </div>
                                </td>

                                <td className="py-3 px-4 font-mono text-[#334155] text-[11px]">
                                  {f.dataType}
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-bold text-[#0F172A] w-12 shrink-0">
                                      {f.nonNullRate}
                                    </span>
                                    <div className="flex-1 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden max-w-[60px]">
                                      <div
                                        className={`h-full ${
                                          f.nonNullPercent === 100
                                            ? 'bg-[#059669]'
                                            : f.nonNullPercent > 90
                                            ? 'bg-[#2563EB]'
                                            : 'bg-[#D97706]'
                                        }`}
                                        style={{ width: `${f.nonNullPercent}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4 font-mono text-[#0F172A] font-semibold">
                                  {f.distinctCount}
                                </td>

                                <td className="py-3 px-4 font-mono text-[#334155]">
                                  {f.uniquenessRate}
                                </td>

                                <td className="py-3 px-4 font-mono text-[11px] text-[#334155]">
                                  {f.valueRange}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end space-x-1 flex-wrap">
                                    {f.traits.map((t, ti) => (
                                      <span
                                        key={ti}
                                        className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                                          t === '高唯一性'
                                            ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]'
                                            : t === '低基数'
                                            ? 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'
                                            : t === '存在空值'
                                            ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                                            : t === '时间字段'
                                            ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                                            : 'bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1]'
                                        }`}
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-4 py-2.5 text-xs text-[#64748B] flex items-center justify-between">
                      <span>显示 {filteredProfileFields.length} 个字段特征，共 36 个字段</span>
                      <span className="text-[11px] text-[#94A3B8]">点击表格行可在右侧展开 Field Profile Drawer</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Field Profile Drawer */}
            {selectedProfileField && (
              <div className="w-[480px] border-l border-[#E2E8F0] bg-white h-full overflow-y-auto flex flex-col shadow-lg shrink-0 transition-all z-20">
                <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between shrink-0">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold font-mono text-[#0F172A]">
                        {selectedProfileField.techName}
                      </h2>
                      <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold text-[10px] rounded">
                        Field Profile
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#0F172A]">
                      {selectedProfileField.businessName}
                    </div>
                    <div className="text-[11px] text-[#64748B] font-mono">
                      {selectedProfileField.dataType} · Nullable
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProfileField(null)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-6 text-xs flex-1 overflow-y-auto">
                  {/* Block 1: Profile Summary */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center justify-between">
                      <span>画像摘要 (Profile Summary)</span>
                      <BarChart2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                        <div className="text-[11px] text-[#64748B]">非空率</div>
                        <div className="font-mono font-bold text-sm text-[#0F172A] pt-0.5">
                          {selectedProfileField.nonNullRate}
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                        <div className="text-[11px] text-[#64748B]">空值率</div>
                        <div className="font-mono font-bold text-sm text-[#0F172A] pt-0.5">
                          {selectedProfileField.nullRate}
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                        <div className="text-[11px] text-[#64748B]">Distinct 唯一定值</div>
                        <div className="font-mono font-bold text-sm text-[#0F172A] pt-0.5">
                          {selectedProfileField.distinctCount}
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                        <div className="text-[11px] text-[#64748B]">唯一率</div>
                        <div className="font-mono font-bold text-sm text-[#0F172A] pt-0.5">
                          {selectedProfileField.uniquenessRate}
                        </div>
                      </div>
                    </div>

                    {selectedProfileField.minVal && (
                      <div className="space-y-1 pt-1 text-[11px] border-t border-[#F1F5F9]">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">最小值 (Min):</span>
                          <span className="font-mono text-[#0F172A]">{selectedProfileField.minVal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">最大值 (Max):</span>
                          <span className="font-mono text-[#0F172A]">{selectedProfileField.maxVal}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Block 2: Histogram */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center justify-between">
                      <span>值分布 (Distribution)</span>
                      <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" />
                    </div>

                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-2">
                      <div className="text-[11px] text-[#64748B] flex justify-between">
                        <span>记录时间密度分布</span>
                        <span className="font-mono text-[#94A3B8]">按季度划分</span>
                      </div>

                      <div className="h-40 flex items-end justify-between gap-1.5 pt-4 pb-2 px-1 border-b border-[#CBD5E1]">
                        {selectedProfileField.distributionData?.map((item, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#0F172A] text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 font-mono">
                              {item.countStr}
                            </div>
                            <div
                              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] transition-all rounded-t-xs"
                              style={{ height: `${item.heightPercent}%` }}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between text-[9px] font-mono text-[#64748B] px-0.5">
                        {selectedProfileField.distributionData?.map((item, idx) => (
                          <span key={idx}>{item.label}</span>
                        ))}
                      </div>

                      <p className="text-[11px] text-[#475569] pt-1 leading-normal font-medium">
                        {selectedProfileField.distributionNote}
                      </p>
                    </div>
                  </div>

                  {/* Block 3: Null ratio */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center justify-between">
                      <span>空值情况 (Null Ratio)</span>
                      <PieChart className="w-3.5 h-3.5 text-[#059669]" />
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="h-3.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#2563EB] h-full"
                          style={{ width: `${selectedProfileField.nonNullPercent}%` }}
                        />
                        <div
                          className="bg-[#CBD5E1] h-full"
                          style={{ width: `${100 - selectedProfileField.nonNullPercent}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                          <span className="text-[#64748B]">有效值:</span>
                          <span className="font-mono font-bold text-[#0F172A]">
                            {selectedProfileField.nonNullRate} ({selectedProfileField.validCountStr})
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                          <span className="text-[#64748B]">空值:</span>
                          <span className="font-mono font-bold text-[#0F172A]">
                            {selectedProfileField.nullRate} ({selectedProfileField.nullCountStr})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 4: Related context */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center justify-between">
                      <span>相关上下文 (Context Summary)</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A]">数据质量 (Data Quality)</span>
                          <span className="text-[10px] font-mono text-[#64748B]">
                            关联 {selectedProfileField.qualityRulesCount || 1} 条规则
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569]">
                          {selectedProfileField.qualityRuleSample || '已监测完整性校验约束'}
                        </p>
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              setActiveTab('quality');
                              if (addToast) addToast('info', '数据质量', `查看 ${selectedProfileField.techName} 的规则与质量评估结果`);
                            }}
                            className="text-xs font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <span>查看数据质量</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A]">数据语义 (Data Semantics)</span>
                          <span className="px-1.5 py-0.2 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-bold rounded">
                            {selectedProfileField.semanticStatus || '已确认'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569]">
                          语义类型: <span className="font-semibold text-[#0F172A]">{selectedProfileField.semanticType}</span> · 角色: <span className="font-semibold text-[#0F172A]">{selectedProfileField.semanticRole}</span>
                        </p>
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              if (onNavigateToSemantics) onNavigateToSemantics();
                              else setActiveTab('semantics');
                            }}
                            className="text-xs font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <span>查看数据语义</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'quality' ? (
          /* TAB 4: DATA QUALITY (数据质量) - Full High-Fidelity Implementation */
          <div className="flex-1 flex overflow-hidden w-full">
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6">
              <div className="max-w-7xl w-full mx-auto space-y-6">
                
                {/* 1. Light Alert Banner (Top) */}
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3.5 flex items-center justify-between text-xs text-[#1E40AF]">
                  <div className="flex items-center space-x-2.5">
                    <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>
                      <strong className="font-bold">质量监测提醒：</strong>
                      资产结构最近发生变化，2 个新增字段（`caller_ip`, `channel_source`）尚未纳入当前质量检测方案。
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (addToast) addToast('info', '调整质量规则', '已为您打开数据质量规则与字段绑定配置界面');
                    }}
                    className="px-3 py-1 bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#BFDBFE] font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    调整质量规则
                  </button>
                </div>

                {/* 2. Page Header Title Area */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h1 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2">
                      <span>数据质量</span>
                      <span className="text-xs font-normal text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1]">
                        Data Quality
                      </span>
                    </h1>
                    <p className="text-xs text-[#64748B]">
                      展示当前数据资产的质量规则、最近检测结果和待处理质量问题。
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (addToast) addToast('info', '全局质量治理', '已跳转至全局 Semovix 数据质量治理工作台');
                      }}
                      className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                    >
                      <span>进入质量治理</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (addToast) addToast('info', '更多检测选项', '包含：发起一次实时检测、查看历史检测日志、导出质量报告');
                      }}
                      className="p-1.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] rounded-lg transition-colors cursor-pointer"
                      title="更多质量操作"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3. Compact Quality Status Summary Bar */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      <span className="text-xs font-bold text-[#0F172A]">当前资产质量状态:</span>
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-xs font-bold rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>需关注</span>
                      </span>
                      <span className="text-[#CBD5E1]">|</span>
                      <span className="text-xs text-[#64748B]">
                        最近检测：<strong className="text-[#0F172A] font-mono">今天 17:10</strong>
                      </span>
                    </div>

                    <div className="text-xs text-[#64748B] flex items-center space-x-2 flex-wrap">
                      <span>规则检测统计:</span>
                      <span className="font-mono font-bold text-[#0F172A]">12 条规则</span>
                      <span className="text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0] font-bold">10 通过</span>
                      <span className="text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA] font-bold">2 未通过</span>
                      <span className="text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A] font-bold">3 项待处理问题</span>
                    </div>
                  </div>

                  {/* Quality Dimensions Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs">
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-[#64748B] text-[11px]">
                        <span>完整性 (Completeness)</span>
                        <span className="text-[#DC2626] font-bold">1 异常</span>
                      </div>
                      <div className="font-bold text-[#0F172A]">3 条规则 · 1 条未通过</div>
                      <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#D97706] h-full" style={{ width: '66.6%' }} />
                      </div>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-[#64748B] text-[11px]">
                        <span>有效性 (Validity)</span>
                        <span className="text-[#059669] font-bold">正常</span>
                      </div>
                      <div className="font-bold text-[#0F172A]">4 条规则 · 全部通过</div>
                      <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#059669] h-full w-full" />
                      </div>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-[#64748B] text-[11px]">
                        <span>一致性 (Consistency)</span>
                        <span className="text-[#DC2626] font-bold">1 异常</span>
                      </div>
                      <div className="font-bold text-[#0F172A]">2 条规则 · 1 条未通过</div>
                      <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#DC2626] h-full" style={{ width: '50%' }} />
                      </div>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-[#64748B] text-[11px]">
                        <span>唯一性 (Uniqueness)</span>
                        <span className="text-[#059669] font-bold">正常</span>
                      </div>
                      <div className="font-bold text-[#0F172A]">2 条规则 · 全部通过</div>
                      <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#059669] h-full w-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. First Core Section: 待处理问题 (Issues Table) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#0F172A] flex items-center space-x-2">
                        <span>待处理问题</span>
                        <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-mono font-bold text-xs rounded-full">
                          3 项问题
                        </span>
                      </h2>
                      <p className="text-xs text-[#64748B] pt-0.5">
                        当前资产最近一次检测中发现的待修复与待确认数据质量问题。
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={issueStatusFilter}
                        onChange={(e) => setIssueStatusFilter(e.target.value)}
                        className="bg-white border border-[#CBD5E1] text-[#0F172A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer shadow-2xs"
                      >
                        <option value="全部">全部状态</option>
                        <option value="待处理">待处理</option>
                        <option value="处理中">处理中</option>
                      </select>
                    </div>
                  </div>

                  {/* Issue Table */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] bg-[#F8FAFC]">
                            <th className="py-3 px-4 w-[28%]">问题描述</th>
                            <th className="py-3 px-4 w-[20%]">影响范围 / 维度</th>
                            <th className="py-3 px-4 w-[12%]">严重程度</th>
                            <th className="py-3 px-4 w-[14%]">最近发现</th>
                            <th className="py-3 px-4 w-[12%]">状态</th>
                            <th className="py-3 px-4 w-[14%] text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9] text-xs">
                          {QUALITY_ISSUES.filter(issue => issueStatusFilter === '全部' || issue.status === issueStatusFilter).map((issue) => {
                            const isSelected = selectedIssue?.id === issue.id;
                            return (
                              <tr
                                key={issue.id}
                                onClick={() => setSelectedIssue(issue)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? 'bg-[#EFF6FF]/70 border-l-4 border-l-[#2563EB]' : 'hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <div className="font-bold text-[#0F172A]">{issue.problem}</div>
                                  <div className="text-[11px] text-[#64748B] pt-0.5 font-mono">
                                    规则: {issue.ruleName} · {issue.affectedCountStr}
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="font-mono text-[#0F172A] text-[11px] font-semibold">{issue.scope}</div>
                                  <div className="text-[10px] text-[#64748B] pt-0.5">维度: {issue.dimension}</div>
                                </td>

                                <td className="py-3 px-4">
                                  {issue.severity === '严重' ? (
                                    <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-bold text-[10px] rounded">
                                      严重
                                    </span>
                                  ) : issue.severity === '警告' ? (
                                    <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-bold text-[10px] rounded">
                                      警告
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold text-[10px] rounded">
                                      提示
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-[#475569] font-mono text-[11px]">
                                  {issue.recentDiscovery}
                                </td>

                                <td className="py-3 px-4">
                                  {issue.status === '待处理' ? (
                                    <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-bold text-[11px] rounded">
                                      待处理
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold text-[11px] rounded">
                                      处理中
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedIssue(issue);
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-[#EFF6FF] border border-[#2563EB] text-[#2563EB] font-bold rounded text-xs transition-colors cursor-pointer shadow-2xs"
                                  >
                                    查看问题
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 5. Second Core Section: 质量规则 (Rule Result Table) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#0F172A]">质量规则与检测结果</h2>
                      <p className="text-xs text-[#64748B]">当前资产已应用的 12 条质量规则明细与最近单测断言状态。</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={ruleDimensionFilter}
                        onChange={(e) => setRuleDimensionFilter(e.target.value)}
                        className="bg-white border border-[#CBD5E1] text-[#0F172A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer shadow-2xs"
                      >
                        <option value="全部">全部维度</option>
                        <option value="完整性">完整性</option>
                        <option value="有效性">有效性</option>
                        <option value="一致性">一致性</option>
                        <option value="唯一性">唯一性</option>
                      </select>

                      <select
                        value={ruleResultFilter}
                        onChange={(e) => setRuleResultFilter(e.target.value)}
                        className="bg-white border border-[#CBD5E1] text-[#0F172A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer shadow-2xs"
                      >
                        <option value="全部">全部结果</option>
                        <option value="未通过">未通过</option>
                        <option value="通过">通过</option>
                      </select>
                    </div>
                  </div>

                  {/* Rule Result Table */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] bg-[#F8FAFC]">
                            <th className="py-3 px-4 w-[26%]">规则名称</th>
                            <th className="py-3 px-4 w-[12%]">质量维度</th>
                            <th className="py-3 px-4 w-[18%]">作用范围</th>
                            <th className="py-3 px-4 w-[12%]">最新结果</th>
                            <th className="py-3 px-4 w-[20%]">结果摘要</th>
                            <th className="py-3 px-4 w-[12%] text-right">最近检测</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9] text-xs">
                          {QUALITY_RULES.filter(rule => {
                            const matchDim = ruleDimensionFilter === '全部' || rule.dimension.includes(ruleDimensionFilter);
                            const matchRes = ruleResultFilter === '全部' || rule.latestResult === ruleResultFilter;
                            return matchDim && matchRes;
                          }).map((rule) => (
                            <tr key={rule.id} className="hover:bg-[#F8FAFC] transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-[#0F172A]">{rule.ruleName}</div>
                                <div className="text-[11px] text-[#64748B] pt-0.5">{rule.templateName}</div>
                              </td>

                              <td className="py-3 px-4 text-[#334155] font-medium">
                                <span className="px-2 py-0.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded text-[10px] font-mono">
                                  {rule.dimension}
                                </span>
                              </td>

                              <td className="py-3 px-4 font-mono text-[#0F172A] font-medium">
                                {rule.scope}
                              </td>

                              <td className="py-3 px-4">
                                {rule.latestResult === '通过' ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-bold rounded">
                                    <Check className="w-3 h-3 text-[#059669]" />
                                    <span>通过</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-[11px] font-bold rounded">
                                    <X className="w-3 h-3 text-[#DC2626]" />
                                    <span>未通过</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 font-mono text-[11px] text-[#334155]">
                                {rule.summaryStr}
                              </td>

                              <td className="py-3 px-4 text-right text-[#64748B] font-mono text-[11px]">
                                {rule.recentDetection}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 6. Third Section: 最近检测 (Recent Runs Summary) */}
                <div className="space-y-3 pt-2 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#0F172A]">最近检测运行</h2>
                      <p className="text-xs text-[#64748B]">显示此数据资产最近 3 次质量检测历史批次纪录。</p>
                    </div>

                    <button
                      onClick={() => {
                        if (addToast) addToast('info', '全部历史运行', '展示历史 30 天 128 次质量检测日志明细');
                      }}
                      className="text-xs font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>查看全部运行记录</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] bg-[#F8FAFC]">
                          <th className="py-3 px-4 w-[20%]">检测时间</th>
                          <th className="py-3 px-4 w-[20%]">检测范围</th>
                          <th className="py-3 px-4 w-[15%]">检测规则数</th>
                          <th className="py-3 px-4 w-[30%]">检测结果</th>
                          <th className="py-3 px-4 w-[15%] text-right">运行状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9] text-xs">
                        {QUALITY_RUN_HISTORY.map((run) => (
                          <tr key={run.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{run.timeStr}</td>
                            <td className="py-3 px-4 text-[#475569]">{run.scope}</td>
                            <td className="py-3 px-4 font-mono text-[#0F172A]">{run.ruleCount} 条</td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-semibold text-[#059669]">{run.passCount} 通过</span>
                              {run.failCount > 0 && (
                                <span className="font-mono font-semibold text-[#DC2626] ml-2">· {run.failCount} 未通过</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-bold rounded">
                                {run.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Issue Detail Drawer */}
            {selectedIssue && (
              <div className="w-[500px] border-l border-[#E2E8F0] bg-white h-full overflow-y-auto flex flex-col shadow-lg shrink-0 transition-all z-20">
                <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between shrink-0">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          selectedIssue.severity === '严重'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : selectedIssue.severity === '警告'
                            ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                            : 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                        }`}
                      >
                        {selectedIssue.severity}问题
                      </span>
                      <span className="text-xs text-[#64748B] font-mono">ID: {selectedIssue.id}</span>
                    </div>
                    <h2 className="text-base font-bold text-[#0F172A] leading-snug">
                      {selectedIssue.problem}
                    </h2>
                  </div>

                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-5 text-xs flex-1 overflow-y-auto">
                  {/* Issue Specs */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center justify-between">
                      <span>问题基本信息</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B]">关联规则:</span>
                        <span className="font-semibold text-[#0F172A]">{selectedIssue.ruleName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B]">质量维度:</span>
                        <span className="font-mono font-medium text-[#0F172A]">{selectedIssue.dimension}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B]">影响记录/指标:</span>
                        <span className="font-mono font-bold text-[#DC2626]">{selectedIssue.affectedCountStr}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B]">最近发现时间:</span>
                        <span className="font-mono text-[#0F172A]">{selectedIssue.recentDiscovery}</span>
                      </div>
                      <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                        <div className="text-[#64748B] text-[11px]">关联字段路径:</div>
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          {selectedIssue.affectedFields.map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-mono text-[11px] rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Problem Explanation */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-2">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                      问题情况说明
                    </div>
                    <p className="text-[#334155] leading-relaxed text-[11px]">
                      {selectedIssue.explanation}
                    </p>
                  </div>

                  {/* Xino AI Partner Analysis Card */}
                  <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center space-x-2 text-[#4F46E5] font-bold border-b border-[#E0E7FF] pb-2">
                      <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                      <span>Xino｜犀诺 AI 归因分析</span>
                    </div>
                    <p className="text-[#1E1B4B] text-[11px] leading-relaxed">
                      {selectedIssue.aiAnalysis.summary}
                    </p>
                    <div className="p-2.5 bg-white/80 rounded-lg border border-[#C7D2FE] space-y-1">
                      <div className="text-[10px] font-bold text-[#4F46E5]">💡 建议修复路径:</div>
                      <div className="text-[11px] text-[#334155] font-medium">
                        {selectedIssue.aiAnalysis.suggestion}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Drawer Actions */}
                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (addToast) addToast('info', '查看质量规则', `已跳转至规则 [${selectedIssue.ruleName}] 的定义与配置界面`);
                      }}
                      className="flex-1 px-3 py-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                    >
                      查看质量规则
                    </button>
                    <button
                      onClick={() => {
                        if (addToast) addToast('success', '发起治理处置', `已针对问题 [${selectedIssue.problem}] 创建工单送达责任团队`);
                      }}
                      className="flex-1 px-3 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center space-x-1"
                    >
                      <span>进入问题治理</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'semantics' ? (
          /* TAB 5: DATA SEMANTICS (数据语义) - Rich Interactive View */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2">
                    <span>数据语义</span>
                    <span className="text-xs font-normal text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1]">
                      Data Semantics
                    </span>
                  </h1>
                  <p className="text-xs text-[#64748B] pt-0.5">
                    展示当前资产已生效应答的标准业务语义词条、业务对象映射与 AI 确认历史。
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (onNavigateToSemantics) onNavigateToSemantics();
                  }}
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                >
                  <span>进入语义理解工作台</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Semantics Summary Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                    <span className="text-xs font-bold text-[#0F172A]">表级别业务语义映射</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-bold rounded">
                    核心语义已确认 (32 / 36)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                    <div className="text-[11px] text-[#64748B]">映射业务实体</div>
                    <div className="font-bold text-sm text-[#0F172A]">12345市民热线工单 (HotlineTicket)</div>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                    <div className="text-[11px] text-[#64748B]">归属业务域</div>
                    <div className="font-bold text-sm text-[#0F172A]">公共服务 / 市民热线管理</div>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                    <div className="text-[11px] text-[#64748B]">Xino AI 推荐平均置信度</div>
                    <div className="font-mono font-bold text-sm text-[#059669]">98.2% (极高)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 6: DATA LINEAGE (血缘) - Complete Enterprise High-Fidelity Implementation */
          <div className="flex-1 flex overflow-hidden w-full relative">
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
              
              {/* Lineage Header & Control Bar */}
              <div className="p-6 pb-4 space-y-4 border-b border-[#E2E8F0] bg-white shrink-0 shadow-2xs">
                
                {/* 1. Page Header Title Area */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h1 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2">
                      <span>血缘</span>
                      <span className="text-xs font-normal text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1]">
                        Data Lineage
                      </span>
                    </h1>
                    <p className="text-xs text-[#64748B]">
                      查看当前数据资产的上下游来源、转换关系和字段级依赖。
                    </p>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center space-x-2 relative">
                    <button
                      onClick={() => setShowImpactDrawer(true)}
                      className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                    >
                      <span>{lineageGranularity === 'field' ? `分析 ${selectedFieldForLineage.split(' · ')[0]} 影响` : '分析下游影响'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setShowLineageMoreMenu(!showLineageMoreMenu)}
                        className="p-1.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] rounded-lg transition-colors cursor-pointer"
                        title="血缘更多操作"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {showLineageMoreMenu && (
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-[#CBD5E1] rounded-xl shadow-lg py-1 z-30 text-xs">
                          <button
                            onClick={() => {
                              setShowLineageMoreMenu(false);
                              if (addToast) addToast('info', '刷新血缘', '正在扫描 SQL AST 与元数据日志更新血缘…');
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] text-[#0F172A] font-medium flex items-center space-x-2"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>刷新血缘关系</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowLineageMoreMenu(false);
                              if (addToast) addToast('info', '查看最近刷新', '上次自动解析完成时间为 Today 16:32:04');
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] text-[#0F172A] font-medium flex items-center space-x-2"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>查看最近刷新日志</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowLineageMoreMenu(false);
                              if (addToast) addToast('info', '查看血缘来源', '主要由 SQL Parsing (DWD/DWS) 与 CDC Metadata Scanner 解析注入');
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] text-[#0F172A] font-medium flex items-center space-x-2"
                          >
                            <GitBranch className="w-3.5 h-3.5 text-[#4F46E5]" />
                            <span>查看血缘解析来源</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Compact Lineage Summary Strip */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-2 flex items-center justify-between text-xs text-[#475569]">
                  <div className="flex items-center space-x-4 divide-x divide-[#CBD5E1]">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#64748B]">直接上游:</span>
                      <strong className="font-mono font-bold text-[#0F172A]">4 个</strong>
                    </div>
                    <div className="pl-4 flex items-center space-x-1.5">
                      <span className="text-[#64748B]">直接下游:</span>
                      <strong className="font-mono font-bold text-[#0F172A]">7 个</strong>
                    </div>
                    <div className="pl-4 flex items-center space-x-1.5">
                      <span className="text-[#64748B]">字段血缘:</span>
                      <strong className="font-mono font-bold text-[#2563EB]">已解析 31 / 36</strong>
                    </div>
                    <div className="pl-4 flex items-center space-x-1.5">
                      <span className="text-[#64748B]">最近更新:</span>
                      <span className="font-mono text-[#0F172A]">今天 16:32</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#64748B] flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>来源: SQL Parsing · 元数据扫描</span>
                  </div>
                </div>

                {/* 3. Granularity Switch & Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  
                  {/* Granularity Segmented Control */}
                  <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#CBD5E1]">
                    <button
                      onClick={() => {
                        setLineageGranularity('asset');
                        setSelectedLineageNodeId('ticket_daily_summary');
                        setSelectedLineageEdgeId(null);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        lineageGranularity === 'asset'
                          ? 'bg-white text-[#2563EB] shadow-2xs border border-[#E2E8F0]'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      资产血缘
                    </button>
                    <button
                      onClick={() => {
                        setLineageGranularity('field');
                        setSelectedLineageNodeId(null);
                        setSelectedLineageEdgeId(null);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        lineageGranularity === 'field'
                          ? 'bg-white text-[#2563EB] shadow-2xs border border-[#E2E8F0]'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      字段血缘
                    </button>
                  </div>

                  {/* Canvas Toolbar Controls */}
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
                    
                    {lineageGranularity === 'field' && (
                      <div className="flex items-center space-x-1.5 bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-lg">
                        <span className="text-xs text-[#1E40AF] font-bold">选择字段:</span>
                        <select
                          value={selectedFieldForLineage}
                          onChange={(e) => setSelectedFieldForLineage(e.target.value)}
                          className="bg-white border border-[#93C5FD] text-[#0F172A] font-mono text-xs font-bold rounded px-2 py-0.5 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                        >
                          <option value="close_time · 办结时间">close_time · 办结时间</option>
                          <option value="created_time · 创建时间">created_time · 创建时间</option>
                          <option value="dept_code · 承办部门">dept_code · 承办部门</option>
                          <option value="ticket_id · 工单编号">ticket_id · 工单编号</option>
                        </select>
                      </div>
                    )}

                    <select
                      value={lineageDirection}
                      onChange={(e) => setLineageDirection(e.target.value as any)}
                      className="bg-white border border-[#CBD5E1] text-[#0F172A] text-xs font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#2563EB] cursor-pointer shadow-2xs"
                    >
                      <option value="上下游">上下游</option>
                      <option value="仅上游">仅上游</option>
                      <option value="仅下游">仅下游</option>
                    </select>

                    <select
                      value={lineageDepth}
                      onChange={(e) => setLineageDepth(e.target.value as any)}
                      className="bg-white border border-[#CBD5E1] text-[#0F172A] text-xs font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#2563EB] cursor-pointer shadow-2xs"
                    >
                      <option value="1层">1 层</option>
                      <option value="2层">2 层</option>
                      <option value="3层">3 层</option>
                    </select>

                    {lineageGranularity === 'asset' && (
                      <select
                        value={lineageAssetTypeFilter}
                        onChange={(e) => setLineageAssetTypeFilter(e.target.value)}
                        className="bg-white border border-[#CBD5E1] text-[#0F172A] text-xs font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#2563EB] cursor-pointer shadow-2xs"
                      >
                        <option value="全部类型">全部类型</option>
                        <option value="Table">Table</option>
                        <option value="View">View</option>
                        <option value="Dataset">Dataset</option>
                        <option value="Report">Report</option>
                      </select>
                    )}

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={lineageSearchQuery}
                        onChange={(e) => setLineageSearchQuery(e.target.value)}
                        placeholder="在当前血缘中查找资产…"
                        className="w-48 pl-8 pr-3 py-1 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Main Lineage Canvas (72%) + Context Panel (28%) Layout */}
              <div className="flex-1 flex overflow-hidden w-full relative">
                
                {/* Canvas Canvas Area (Left ~72%) */}
                <div className="flex-1 relative bg-[#F8FAFC] flex flex-col overflow-hidden border-r border-[#E2E8F0]">
                  
                  {/* Schema Change / Alert Notice */}
                  <div className="p-3 bg-[#EFF6FF]/80 border-b border-[#BFDBFE] flex items-center justify-between text-xs text-[#1E40AF] shrink-0">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-[#2563EB]" />
                      <span>检测到 2 个新增字段（`caller_ip`, `channel_source`），目前尚未解析到字段级血缘。</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('fields')}
                      className="px-2.5 py-0.5 bg-white border border-[#BFDBFE] text-[#2563EB] font-bold text-[11px] rounded hover:bg-[#F8FAFC] cursor-pointer"
                    >
                      查看字段
                    </button>
                  </div>

                  {/* Canvas Container with Dot Grid Pattern */}
                  <div className="flex-1 relative overflow-auto p-8 flex items-center justify-center bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]">
                    
                    {lineageGranularity === 'asset' ? (
                      /* === ASSET LINEAGE GRAPH === */
                      <div className="relative w-full max-w-5xl flex items-center justify-between gap-12 py-8 px-4 my-auto">
                        
                        {/* Upstream Column (Left) */}
                        {(lineageDirection === '上下游' || lineageDirection === '仅上游') && (
                          <div className="flex flex-col space-y-5 w-64 shrink-0 z-10">
                            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center space-x-1">
                              <Database className="w-3.5 h-3.5 text-[#2563EB]" />
                              <span>直接上游 (Upstream)</span>
                            </div>

                            {/* Node 1: dwd_hotline_ticket */}
                            <div
                              onClick={() => {
                                setSelectedLineageNodeId('dwd_hotline_ticket');
                                setSelectedLineageEdgeId(null);
                              }}
                              className={`p-3.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer relative group ${
                                selectedLineageNodeId === 'dwd_hotline_ticket'
                                  ? 'border-2 border-[#2563EB] ring-2 ring-[#BFDBFE]'
                                  : highlightedPathNodes.length > 0 && !highlightedPathNodes.includes('dwd_hotline_ticket')
                                  ? 'opacity-35 border-[#CBD5E1]'
                                  : 'border-[#E2E8F0] hover:border-[#2563EB]'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-[10px] font-bold rounded">
                                  Table
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">dwd_db</span>
                              </div>
                              <div className="font-bold text-xs text-[#0F172A]">热线工单标准化明细</div>
                              <div className="font-mono text-[11px] text-[#2563EB] font-semibold pt-0.5">dwd_hotline_ticket</div>
                              
                              {/* Hover expand indicator */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-3 top-1/2 -translate-y-1/2 bg-[#2563EB] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                                + 展开
                              </div>
                            </div>

                            {/* Node 2: ods_hotline_ticket */}
                            <div
                              onClick={() => {
                                setSelectedLineageNodeId('ods_hotline_ticket');
                                setSelectedLineageEdgeId(null);
                              }}
                              className={`p-3.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer relative group ${
                                selectedLineageNodeId === 'ods_hotline_ticket'
                                  ? 'border-2 border-[#2563EB] ring-2 ring-[#BFDBFE]'
                                  : highlightedPathNodes.length > 0 && !highlightedPathNodes.includes('ods_hotline_ticket')
                                  ? 'opacity-35 border-[#CBD5E1]'
                                  : 'border-[#E2E8F0] hover:border-[#2563EB]'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-[10px] font-bold rounded">
                                  Table
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">ods_db</span>
                              </div>
                              <div className="font-bold text-xs text-[#0F172A]">热线原始工单</div>
                              <div className="font-mono text-[11px] text-[#64748B] pt-0.5">ods_hotline_ticket</div>
                            </div>

                            {/* Node 3: dim_region */}
                            <div
                              onClick={() => {
                                setSelectedLineageNodeId('dim_region');
                                setSelectedLineageEdgeId(null);
                              }}
                              className={`p-3.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer relative group ${
                                selectedLineageNodeId === 'dim_region'
                                  ? 'border-2 border-[#2563EB] ring-2 ring-[#BFDBFE]'
                                  : highlightedPathNodes.length > 0 && !highlightedPathNodes.includes('dim_region')
                                  ? 'opacity-35 border-[#CBD5E1]'
                                  : 'border-[#E2E8F0] hover:border-[#2563EB]'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-[10px] font-bold rounded">
                                  Table
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">dim_db</span>
                              </div>
                              <div className="font-bold text-xs text-[#0F172A]">行政区域维表</div>
                              <div className="font-mono text-[11px] text-[#64748B] pt-0.5">dim_region</div>
                            </div>

                            {/* Node 4: dim_department */}
                            <div
                              onClick={() => {
                                setSelectedLineageNodeId('dim_department');
                                setSelectedLineageEdgeId(null);
                              }}
                              className={`p-3.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer relative group ${
                                selectedLineageNodeId === 'dim_department'
                                  ? 'border-2 border-[#2563EB] ring-2 ring-[#BFDBFE]'
                                  : highlightedPathNodes.length > 0 && !highlightedPathNodes.includes('dim_department')
                                  ? 'opacity-35 border-[#CBD5E1]'
                                  : 'border-[#E2E8F0] hover:border-[#2563EB]'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-[10px] font-bold rounded">
                                  Table
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">dim_db</span>
                              </div>
                              <div className="font-bold text-xs text-[#0F172A]">承办部门维表</div>
                              <div className="font-mono text-[11px] text-[#64748B] pt-0.5">dim_department</div>
                            </div>
                          </div>
                        )}

                        {/* Center Column: Current Asset Node */}
                        <div className="flex flex-col items-center justify-center w-72 shrink-0 z-20">
                          <div className="p-5 bg-[#EFF6FF] border-2 border-[#2563EB] rounded-2xl shadow-md w-full text-left space-y-2 relative">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 bg-[#2563EB] text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                                当前资产
                              </span>
                              <span className="text-[11px] text-[#1E40AF] font-mono font-bold">Table · MySQL</span>
                            </div>

                            <div>
                              <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                                公共服务热线工单记录表
                              </h2>
                              <div className="font-mono text-xs font-bold text-[#2563EB] pt-1">
                                pop_service_hotline
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[#BFDBFE] flex items-center justify-between text-[11px] text-[#1E40AF]">
                              <span>行数: 1,284,392</span>
                              <span>列数: 36 列</span>
                            </div>
                          </div>
                        </div>

                        {/* Downstream Column (Right) */}
                        {(lineageDirection === '上下游' || lineageDirection === '仅下游') && (
                          <div className="flex flex-col space-y-5 w-64 shrink-0 z-10">
                            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center space-x-1">
                              <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
                              <span>直接下游 (Downstream)</span>
                            </div>

                            {/* Node 1: ticket_analysis_view */}
                            <div
                              onClick={() => {
                                setSelectedLineageNodeId('ticket_analysis_view');
                                setSelectedLineageEdgeId(null);
                              }}
                              className={`p-3.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer relative group ${
                                selectedLineageNodeId === 'ticket_analysis_view'
                                  ? 'border-2 border-[#2563EB] ring-2 ring-[#BFDBFE]'
                                  : highlightedPathNodes.length > 0 && !highlightedPathNodes.includes('ticket_analysis_view')
                                  ? 'opacity-35 border-[#CBD5E1]'
                                  : 'border-[#E2E8F0] hover:border-[#2563EB]'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] text-[10px] font-bold rounded">
                                  View
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">analytics</span>
                              </div>
                              <div className="font-bold text-xs text-[#0F172A]">服务热线工单分析视图</div>
                              <div className="font-mono text-[11px] text-[#64748B] pt-0.5">ticket_analysis_view</div>
                            </div>

                            {/* Node 2: ticket_daily_summary (Selected by default) */}
                            <div
                              onClick={() => {
                                setSelectedLineageNodeId('ticket_daily_summary');
                                setSelectedLineageEdgeId(null);
                              }}
                              className={`p-3.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer relative group ${
                                selectedLineageNodeId === 'ticket_daily_summary'
                                  ? 'border-2 border-[#2563EB] ring-2 ring-[#BFDBFE]'
                                  : highlightedPathNodes.length > 0 && !highlightedPathNodes.includes('ticket_daily_summary')
                                  ? 'opacity-35 border-[#CBD5E1]'
                                  : 'border-[#E2E8F0] hover:border-[#2563EB]'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] text-[10px] font-bold rounded">
                                  View
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">analytics</span>
                              </div>
                              <div className="font-bold text-xs text-[#0F172A]">工单处理日报</div>
                              <div className="font-mono text-[11px] text-[#2563EB] font-bold pt-0.5">ticket_daily_summary</div>

                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-3 top-1/2 -translate-y-1/2 bg-[#2563EB] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                                + 展开 (3个下游)
                              </div>
                            </div>

                            {/* Node 3: hotline_operation_report */}
                            <div
                              onClick={() => {
                                setSelectedLineageNodeId('hotline_operation_report');
                                setSelectedLineageEdgeId(null);
                              }}
                              className={`p-3.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer relative group ${
                                selectedLineageNodeId === 'hotline_operation_report'
                                  ? 'border-2 border-[#2563EB] ring-2 ring-[#BFDBFE]'
                                  : highlightedPathNodes.length > 0 && !highlightedPathNodes.includes('hotline_operation_report')
                                  ? 'opacity-35 border-[#CBD5E1]'
                                  : 'border-[#E2E8F0] hover:border-[#2563EB]'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-bold rounded">
                                  Report
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">report</span>
                              </div>
                              <div className="font-bold text-xs text-[#0F172A]">服务热线运营日报</div>
                              <div className="font-mono text-[11px] text-[#64748B] pt-0.5">hotline_operation_report</div>
                            </div>

                            {/* Node 4: ticket_resolution_analysis */}
                            <div
                              onClick={() => {
                                setSelectedLineageNodeId('ticket_resolution_analysis');
                                setSelectedLineageEdgeId(null);
                              }}
                              className={`p-3.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer relative group ${
                                selectedLineageNodeId === 'ticket_resolution_analysis'
                                  ? 'border-2 border-[#2563EB] ring-2 ring-[#BFDBFE]'
                                  : highlightedPathNodes.length > 0 && !highlightedPathNodes.includes('ticket_resolution_analysis')
                                  ? 'opacity-35 border-[#CBD5E1]'
                                  : 'border-[#E2E8F0] hover:border-[#2563EB]'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-bold rounded">
                                  Dataset
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">marts</span>
                              </div>
                              <div className="font-bold text-xs text-[#0F172A]">工单处理时长分析</div>
                              <div className="font-mono text-[11px] text-[#64748B] pt-0.5">ticket_resolution_analysis</div>
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      /* === FIELD LINEAGE GRAPH === */
                      <div className="relative w-full max-w-4xl flex items-center justify-between gap-12 py-12 px-4 my-auto">
                        
                        {/* Upstream Field Column */}
                        <div className="flex flex-col space-y-4 w-60 shrink-0">
                          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                            上游来源字段 (dwd_hotline_ticket)
                          </div>

                          <div className="p-4 bg-white border border-[#CBD5E1] rounded-xl shadow-2xs space-y-1 font-mono text-xs">
                            <div className="text-[10px] text-[#64748B]">Table: dwd_hotline_ticket</div>
                            <div className="font-bold text-[#0F172A]">completed_at</div>
                            <div className="text-[11px] text-[#2563EB]">完成时间 · DATETIME</div>
                          </div>
                        </div>

                        {/* Current Field Center */}
                        <div className="flex flex-col items-center justify-center w-64 shrink-0">
                          <div className="p-5 bg-[#EFF6FF] border-2 border-[#2563EB] rounded-2xl shadow-md w-full space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-[#2563EB] text-white font-bold text-[10px] rounded-full">
                                当前字段
                              </span>
                              <span className="text-[10px] text-[#1E40AF] font-mono">DATETIME</span>
                            </div>
                            <div className="font-bold text-sm text-[#0F172A]">close_time</div>
                            <div className="text-xs text-[#2563EB] font-bold">办结时间</div>
                          </div>
                        </div>

                        {/* Downstream Fields Column */}
                        <div className="flex flex-col space-y-4 w-64 shrink-0">
                          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                            下游依赖字段
                          </div>

                          <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs space-y-1 font-mono text-xs">
                            <div className="text-[10px] text-[#64748B]">View: ticket_daily_summary</div>
                            <div className="font-bold text-[#0F172A]">close_date</div>
                            <div className="text-[11px] text-[#4F46E5]">办结日期 · DATE</div>
                          </div>

                          <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs space-y-1 font-mono text-xs">
                            <div className="text-[10px] text-[#64748B]">Dataset: ticket_resolution_analysis</div>
                            <div className="font-bold text-[#0F172A]">avg_resolution_time</div>
                            <div className="text-[11px] text-[#059669]">平均办理时长 · DECIMAL</div>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Canvas Controls (Bottom Right) */}
                  <div className="absolute bottom-4 right-4 bg-white border border-[#CBD5E1] rounded-xl shadow-md p-1 flex items-center space-x-1 z-20 text-xs">
                    <button
                      onClick={() => setCanvasZoomLevel(Math.min(150, canvasZoomLevel + 10))}
                      className="p-1.5 hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] rounded cursor-pointer"
                      title="放大"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCanvasZoomLevel(Math.max(50, canvasZoomLevel - 10))}
                      className="p-1.5 hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] rounded cursor-pointer"
                      title="缩小"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono text-[#64748B] px-1">{canvasZoomLevel}%</span>
                    <button
                      onClick={() => {
                        setCanvasZoomLevel(100);
                        setHighlightedPathNodes([]);
                        if (addToast) addToast('info', '重置画布', '已恢复标准视角与无路径高亮状态');
                      }}
                      className="p-1.5 hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] rounded cursor-pointer"
                      title="重置"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* Right Context Panel (~28% Width) */}
                <div className="w-[340px] bg-white h-full overflow-y-auto flex flex-col shrink-0 border-l border-[#E2E8F0] p-5 space-y-5 text-xs">
                  
                  {selectedLineageNodeId === 'ticket_daily_summary' ? (
                    /* Node Selected State (工单处理日报) */
                    <div className="space-y-4">
                      <div className="space-y-1.5 border-b border-[#F1F5F9] pb-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] font-bold text-[10px] rounded">
                            View · 视图
                          </span>
                          <span className="text-[11px] text-[#2563EB] font-bold">直接下游</span>
                        </div>
                        <h2 className="text-base font-bold text-[#0F172A]">工单处理日报</h2>
                        <div className="font-mono text-[11px] text-[#64748B]">analytics.service.ticket_daily_summary</div>
                      </div>

                      {/* Node Specs */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2.5">
                        <div className="font-bold text-[#0F172A] text-xs border-b border-[#CBD5E1] pb-1.5">
                          节点属性 (Node Properties)
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">归属数据源:</span>
                            <span className="font-medium text-[#0F172A]">分析库 (analytics_db)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">转换逻辑:</span>
                            <span className="font-mono text-[#0F172A]">Aggregation + Derived</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">最近刷新:</span>
                            <span className="font-mono text-[#0F172A]">今天 06:20</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">依赖上游数:</span>
                            <span className="font-mono font-bold text-[#0F172A]">3 个</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">被消费下游:</span>
                            <span className="font-mono font-bold text-[#0F172A]">2 个</span>
                          </div>
                        </div>
                      </div>

                      {/* Xino AI Transformation Summary */}
                      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center space-x-1.5 text-[#4F46E5] font-bold text-[11px]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>SQL 转换逻辑摘要</span>
                        </div>
                        <p className="text-[11px] text-[#334155] leading-relaxed">
                          基于 `pop_service_hotline` 基础数据，按 `dept_code` 与 `DATE(created_time)` 维度汇总，计算当日工单受理总量、按时办结率与平均解决时长。
                        </p>
                      </div>

                      {/* Node Context Actions */}
                      <div className="pt-2 space-y-2">
                        <button
                          onClick={() => {
                            setHighlightedPathNodes(['ods_hotline_ticket', 'dwd_hotline_ticket', 'pop_service_hotline', 'ticket_daily_summary', 'hotline_operation_report']);
                            if (addToast) addToast('info', '高亮路径', '已高亮 `ods_hotline_ticket` → `pop_service_hotline` → `ticket_daily_summary` 主数据链路');
                          }}
                          className="w-full py-2 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                        >
                          高亮依赖路径
                        </button>

                        <button
                          onClick={() => {
                            if (addToast) addToast('info', '查看资产详情', '已打开 downstream asset: analytics.service.ticket_daily_summary');
                          }}
                          className="w-full py-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center space-x-1"
                        >
                          <span>查看资产详情</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : selectedLineageNodeId ? (
                    /* Other Selected Node Details */
                    <div className="space-y-4">
                      <div className="space-y-1.5 border-b border-[#F1F5F9] pb-3">
                        <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] font-bold text-[10px] rounded">
                          Selected Node
                        </span>
                        <h2 className="text-base font-bold text-[#0F172A]">{selectedLineageNodeId}</h2>
                      </div>

                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">标识:</span>
                          <span className="font-mono text-[#0F172A]">{selectedLineageNodeId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">解析状态:</span>
                          <span className="font-bold text-[#059669]">正常有效</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedLineageNodeId('ticket_daily_summary')}
                        className="w-full py-2 bg-white border border-[#CBD5E1] text-[#0F172A] font-bold text-xs rounded-lg hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        切回默认摘要
                      </button>
                    </div>
                  ) : (
                    /* Default Summary State */
                    <div className="space-y-4">
                      <div className="border-b border-[#F1F5F9] pb-3">
                        <h2 className="text-sm font-bold text-[#0F172A]">血缘关系摘要</h2>
                        <p className="text-[11px] text-[#64748B]">当前资产 `pop_service_hotline` 上下游依赖上下文</p>
                      </div>

                      <div className="space-y-3 text-[11px]">
                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                          <div className="text-[#64748B]">主要上游资产 (3)</div>
                          <div className="font-mono text-[#0F172A] font-medium">dwd_hotline_ticket</div>
                          <div className="font-mono text-[#0F172A] font-medium">dim_region</div>
                          <div className="font-mono text-[#0F172A] font-medium">dim_department</div>
                        </div>

                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                          <div className="text-[#64748B]">主要下游消费 (3)</div>
                          <div className="font-mono text-[#2563EB] font-bold">ticket_daily_summary</div>
                          <div className="font-mono text-[#0F172A] font-medium">ticket_analysis_view</div>
                          <div className="font-mono text-[#0F172A] font-medium">hotline_operation_report</div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* Downstream Impact Analysis Slide-over Drawer */}
            {showImpactDrawer && (
              <div className="absolute inset-y-0 right-0 w-[520px] bg-white border-l border-[#CBD5E1] shadow-2xl z-40 flex flex-col h-full overflow-hidden transition-transform">
                
                <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between shrink-0">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-[10px] font-bold rounded">
                        中等影响风险 (Medium Impact)
                      </span>
                      <span className="text-xs text-[#64748B] font-mono">Impact Analysis</span>
                    </div>
                    <h2 className="text-base font-bold text-[#0F172A]">
                      下游影响分析 (Impact Analysis)
                    </h2>
                  </div>

                  <button
                    onClick={() => setShowImpactDrawer(false)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-5 text-xs flex-1 overflow-y-auto">
                  
                  {/* Summary Metric Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                      <div className="text-[#64748B] text-[11px]">受波及下游资产</div>
                      <div className="font-mono font-bold text-base text-[#0F172A]">7 个资产</div>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                      <div className="text-[#64748B] text-[11px]">依赖 BI 报表/API</div>
                      <div className="font-mono font-bold text-base text-[#2563EB]">2 报表 · 1 API</div>
                    </div>
                  </div>

                  {/* Impact Path Chain */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex justify-between items-center">
                      <span>关键影响传导链路</span>
                      <span className="text-[10px] font-mono text-[#D97706]">Critical Path</span>
                    </div>

                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[#2563EB] font-bold">
                        1. pop_service_hotline (当前资产)
                      </div>
                      <div className="pl-4 text-[#94A3B8]">↓ Aggregation SQL Transformation</div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A]">
                        2. analytics.service.ticket_daily_summary (View)
                      </div>
                      <div className="pl-4 text-[#94A3B8]">↓ Direct Query</div>
                      <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-[#D97706] font-bold">
                        3. report.exec.hotline_operation_report (运营日报)
                      </div>
                    </div>
                  </div>

                  {/* Affected Teams */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                      需通知责任团队与接口人
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between items-center p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                        <div>
                          <div className="font-bold text-[#0F172A]">市民热线运营中心 (DEPT-012)</div>
                          <div className="text-[#64748B]">接口人: 李明 · 消费工单日报数据</div>
                        </div>
                        <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] font-bold text-[10px] rounded">
                          主要干系人
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                        <div>
                          <div className="font-bold text-[#0F172A]">城市运行指挥平台 (DEPT-008)</div>
                          <div className="text-[#64748B]">接口人: 张华 · 订阅大屏 API 接口</div>
                        </div>
                        <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] font-bold text-[10px] rounded">
                          下游消费
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (addToast) addToast('success', '变更通知已发送', '已向市民热线运营团队与政务指挥中心接口人推送变更影响报告');
                        setShowImpactDrawer(false);
                      }}
                      className="flex-1 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                    >
                      发送变更通知
                    </button>
                    <button
                      onClick={() => {
                        if (addToast) addToast('info', '导出影响清单', '已生成 pop_service_hotline 下游影响清单 (PDF/CSV)');
                      }}
                      className="flex-1 py-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                    >
                      导出影响清单
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
