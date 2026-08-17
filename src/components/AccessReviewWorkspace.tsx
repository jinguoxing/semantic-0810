import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Info,
  Users,
  Building2,
  Table,
  Globe,
  FileText,
  FileCheck,
  Eye,
  Check,
  X,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles,
  Download,
  KeyRound,
  FileSpreadsheet,
  AlertCircle,
  BarChart3,
  UserCheck,
  Layers,
  HelpCircle,
  SlidersHorizontal,
  RefreshCw,
  FolderTree,
  ShieldQuestion,
  Share2
} from 'lucide-react';

export interface ReviewItem {
  id: string;
  requestId: string;
  submissionId: string;
  resourceId: string;
  resourceName: string;
  resourceType: 'DATA_ASSET' | 'API' | 'OTHER';
  resourceSubType?: string;
  resourceActionSummary: string;
  suggestedProtection: string;
  applicantName: string;
  applicantAvatar?: string;
  applicantDepartment: string;
  requestedAction: '查询数据' | '调用服务' | '导出数据' | '订阅更新';
  actionTypeKey: 'QUERY' | 'INVOKE' | 'EXPORT' | 'SUBSCRIBE';
  parentSubmissionTitle: string;
  parentSubmissionContext: string;
  reviewReasonBadge: string;
  reviewReasonDescription: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  submittedAtText: string;
  submittedExactTime: string;
  timestamp: number;
  isAssignedToMe: boolean;
  departmentCategory: 'population' | 'business' | 'civil' | 'policy' | 'tech';
  departmentCategoryName: string;
  details: {
    dataFieldsSummary: string[];
    maskedFields: string[];
    excludedFields: string[];
    requestPurpose: string;
    requestedDuration: string;
    policyTriggerRule: string;
    suggestedScope: string;
  };
}

export const MOCK_REVIEW_ITEMS: ReviewItem[] = [
  {
    id: 'rev-001',
    requestId: 'REQ-20260817-091',
    submissionId: 'SUB-20260817-042',
    resourceId: 'res-view-pop-basic',
    resourceName: '人口基本信息视图',
    resourceType: 'DATA_ASSET',
    resourceSubType: 'VIEW',
    resourceActionSummary: '查询年龄、出生信息、常住状态与行政区域相关数据',
    suggestedProtection: '建议数据保护：姓名脱敏 · 身份证号不包含 · 禁止导出',
    applicantName: '张明',
    applicantDepartment: '人口分析部门',
    requestedAction: '查询数据',
    actionTypeKey: 'QUERY',
    parentSubmissionTitle: '街镇老龄化与养老资源分析',
    parentSubmissionContext: '共 2 项资源，本项为其中之一',
    reviewReasonBadge: '包含受限身份信息',
    reviewReasonDescription: '需要确认最终可访问范围与脱敏方案',
    riskLevel: 'MEDIUM',
    submittedAtText: '12 分钟前',
    submittedExactTime: '今天 10:36',
    timestamp: Date.now() - 12 * 60 * 1000,
    isAssignedToMe: true,
    departmentCategory: 'population',
    departmentCategoryName: '人口分析部门',
    details: {
      dataFieldsSummary: ['person_id (主键)', 'age (实足年龄)', 'birth_date (出生日期)', 'resident_status (常住标识)', 'region_code (区划代码)'],
      maskedFields: ['name (姓名 - 掩码展示)'],
      excludedFields: ['id_card_no (身份证号 - 排除)', 'phone (联系电话 - 排除)'],
      requestPurpose: '测算各街镇 60 岁及以上老龄化率与人口年龄金字塔结构',
      requestedDuration: '90 天 (至 2026-11-15)',
      policyTriggerRule: 'RULE-SEC-PII-02: 包含中度敏感 PII 属性，需人工确认列级脱敏策略',
      suggestedScope: '已配置行级过滤：行政区划限定上海市辖区；字段限定已核定 5 项字段'
    }
  },
  {
    id: 'rev-002',
    requestId: 'REQ-20260817-088',
    submissionId: 'SUB-20260817-039',
    resourceId: 'res-view-corp-contact',
    resourceName: '法人联系方式视图',
    resourceType: 'DATA_ASSET',
    resourceSubType: 'VIEW',
    resourceActionSummary: '查询企业法定代表人姓名、联络通讯与经营登记地址',
    suggestedProtection: '建议数据保护：手机号部分掩码 · 仅限工作日查询',
    applicantName: '李倩',
    applicantDepartment: '营商分析组',
    requestedAction: '查询数据',
    actionTypeKey: 'QUERY',
    parentSubmissionTitle: '企业主体活跃度分析',
    parentSubmissionContext: '共 3 项资源，本项为其中之一',
    reviewReasonBadge: '包含联系方式信息',
    reviewReasonDescription: '需要确认最小必要访问范围与使用场景',
    riskLevel: 'MEDIUM',
    submittedAtText: '35 分钟前',
    submittedExactTime: '今天 10:13',
    timestamp: Date.now() - 35 * 60 * 1000,
    isAssignedToMe: true,
    departmentCategory: 'business',
    departmentCategoryName: '营商分析组',
    details: {
      dataFieldsSummary: ['corp_code (统一社码)', 'corp_name (企业全称)', 'legal_person (法人姓名)', 'reg_district (注册区县)'],
      maskedFields: ['contact_phone (联系电话 - 掩码中间4位)'],
      excludedFields: ['personal_email (个人邮箱 - 排除)'],
      requestPurpose: '用于营商环境评估调研中的企业回访样本抽样',
      requestedDuration: '30 天 (至 2026-09-16)',
      policyTriggerRule: 'RULE-BUS-CONTACT-01: 涉及商事主体关键联络人信息访问',
      suggestedScope: '仅限查询在营及存续状态企业，排除注销/吊销记录'
    }
  },
  {
    id: 'rev-003',
    requestId: 'REQ-20260817-084',
    submissionId: 'SUB-20260817-035',
    resourceId: 'res-api-community-care',
    resourceName: '社区养老服务查询 API',
    resourceType: 'API',
    resourceSubType: 'REST API',
    resourceActionSummary: '按街镇与服务类型高频检索日间照料点、助餐点及机构床位实时数据',
    suggestedProtection: '建议流控保护：限速 20 QPS · 限制 IP 段',
    applicantName: '王斌',
    applicantDepartment: '民政服务组',
    requestedAction: '调用服务',
    actionTypeKey: 'INVOKE',
    parentSubmissionTitle: '社区养老服务供给分析',
    parentSubmissionContext: '共 1 项资源，独立服务申请',
    reviewReasonBadge: '跨组织调用',
    reviewReasonDescription: '需要确认可用范围、流控配额与授权期限',
    riskLevel: 'LOW',
    submittedAtText: '1 小时前',
    submittedExactTime: '今天 09:48',
    timestamp: Date.now() - 60 * 60 * 1000,
    isAssignedToMe: false,
    departmentCategory: 'civil',
    departmentCategoryName: '民政服务组',
    details: {
      dataFieldsSummary: ['facility_id', 'facility_name', 'facility_type', 'available_beds', 'service_status'],
      maskedFields: [],
      excludedFields: ['internal_admin_token'],
      requestPurpose: '为社区养老数字看板提供底层实时设施点位与负荷数据支撑',
      requestedDuration: '180 天 (至 2027-02-13)',
      policyTriggerRule: 'RULE-API-CROSS-ORG: 跨组织调用外部 API，须复核调用配额与安全白名单',
      suggestedScope: '最大允许 QPS 20，每日配额上限 50,000 次'
    }
  },
  {
    id: 'rev-004',
    requestId: 'REQ-20260817-079',
    submissionId: 'SUB-20260817-028',
    resourceId: 'res-view-pop-basic-export',
    resourceName: '人口基本信息视图',
    resourceType: 'DATA_ASSET',
    resourceSubType: 'VIEW',
    resourceActionSummary: '申请批量导出包含街道/居委粒度的人口基础统计明细文件',
    suggestedProtection: '建议安全要求：仅限离线受控环境 · 导出文件自动添加动态水印',
    applicantName: '陈蕾',
    applicantDepartment: '政策研究室',
    requestedAction: '导出数据',
    actionTypeKey: 'EXPORT',
    parentSubmissionTitle: '老龄化专题离线分析',
    parentSubmissionContext: '共 4 项资源，本项为其中之一',
    reviewReasonBadge: '高风险操作',
    reviewReasonDescription: '涉及离线导出访问，需安全主管人工复核与用途认定',
    riskLevel: 'HIGH',
    submittedAtText: '今天 08:54',
    submittedExactTime: '今天 08:54',
    timestamp: Date.now() - 110 * 60 * 1000,
    isAssignedToMe: true,
    departmentCategory: 'policy',
    departmentCategoryName: '政策研究室',
    details: {
      dataFieldsSummary: ['person_id', 'gender_code', 'age', 'region_code', 'resident_status'],
      maskedFields: ['all_direct_identifiers (全量直接标识均已剔除)'],
      excludedFields: ['id_card', 'name', 'mobile', 'home_address'],
      requestPurpose: '支撑十四五人口规划中期评估模型线下仿真测算',
      requestedDuration: '单次导出 (文件有效保护期 7 天)',
      policyTriggerRule: 'RULE-EXPORT-LEVEL-3: 离线导出数据行数预计超 50 万条，触发高风险人工审批',
      suggestedScope: '限定受限离线沙箱环境打开，文件下载附带操作员追溯隐形水印'
    }
  },
  {
    id: 'rev-005',
    requestId: 'REQ-20260817-073',
    submissionId: 'SUB-20260817-024',
    resourceId: 'res-view-aging-dist',
    resourceName: '老龄人口分布视图',
    resourceType: 'DATA_ASSET',
    resourceSubType: 'VIEW',
    resourceActionSummary: '查询居村委层级 80 岁以上高龄独居老人分布与照护等级',
    suggestedProtection: '建议保护：隐藏精确门牌号 · 仅提供网格化聚类数据',
    applicantName: '赵宇',
    applicantDepartment: '民政服务组',
    requestedAction: '查询数据',
    actionTypeKey: 'QUERY',
    parentSubmissionTitle: '独居高龄老人关爱服务专项',
    parentSubmissionContext: '共 2 项资源，本项为其中之一',
    reviewReasonBadge: '特殊群体隐私保护',
    reviewReasonDescription: '涉及高龄重点关注人群，需确认最小知悉范围',
    riskLevel: 'MEDIUM',
    submittedAtText: '昨天 17:20',
    submittedExactTime: '昨天 17:20',
    timestamp: Date.now() - 18 * 60 * 60 * 1000,
    isAssignedToMe: false,
    departmentCategory: 'civil',
    departmentCategoryName: '民政服务组',
    details: {
      dataFieldsSummary: ['community_code', 'elderly_age_group', 'care_level', 'guardian_status'],
      maskedFields: ['building_room_no (门牌号 - 隐藏至网格级别)'],
      excludedFields: ['contact_phone', 'medical_history'],
      requestPurpose: '精准匹配社区志愿者结对帮扶与紧急呼叫铃加装工作',
      requestedDuration: '60 天 (至 2026-10-16)',
      policyTriggerRule: 'RULE-SPECIAL-GROUP: 涉及重点保障群体敏感标签，需业务归口主管审核',
      suggestedScope: '仅开放申请人所在辖区（浦东新区部分街道）的数据权限'
    }
  },
  {
    id: 'rev-006',
    requestId: 'REQ-20260817-068',
    submissionId: 'SUB-20260817-019',
    resourceId: 'res-asset-elderly-org',
    resourceName: '街镇养老机构基础信息',
    resourceType: 'DATA_ASSET',
    resourceSubType: 'TABLE',
    resourceActionSummary: '查询机构定级、运营财务资质与政府补贴核拨流水',
    suggestedProtection: '建议保护：财务补贴明细列受限，仅开放机构基本属性与床位数',
    applicantName: '刘宏',
    applicantDepartment: '营商分析组',
    requestedAction: '查询数据',
    actionTypeKey: 'QUERY',
    parentSubmissionTitle: '民营养老机构运营补贴效益评估',
    parentSubmissionContext: '共 3 项资源，本项为其中之一',
    reviewReasonBadge: '包含财务敏感属性',
    reviewReasonDescription: '包含财政资金拨付指标，需核验申请人业务职责授权',
    riskLevel: 'HIGH',
    submittedAtText: '昨天 15:40',
    submittedExactTime: '昨天 15:40',
    timestamp: Date.now() - 20 * 60 * 60 * 1000,
    isAssignedToMe: true,
    departmentCategory: 'business',
    departmentCategoryName: '营商分析组',
    details: {
      dataFieldsSummary: ['org_id', 'org_name', 'street_town_code', 'bed_capacity', 'occupancy_rate'],
      maskedFields: [],
      excludedFields: ['subsidy_grant_amount (财政补贴明细金额 - 需单独特批)'],
      requestPurpose: '评估各区民营养老机构床位利用率与政府扶持政策实际落地成效',
      requestedDuration: '90 天 (至 2026-11-15)',
      policyTriggerRule: 'RULE-FIN-PII-04: 访问财政资金流水类受控列，必须由数据资产 Owner 签署意见',
      suggestedScope: '仅批准机构基础设施属性，财务列做缺省列级屏蔽'
    }
  },
  {
    id: 'rev-007',
    requestId: 'REQ-20260817-061',
    submissionId: 'SUB-20260817-015',
    resourceId: 'res-view-resident-status',
    resourceName: '人口居住状态视图',
    resourceType: 'DATA_ASSET',
    resourceSubType: 'VIEW',
    resourceActionSummary: '查询半年内人口跨区流动轨迹与居住地变更记录',
    suggestedProtection: '建议保护：数据仅限统计周期内聚合使用，不沉淀个体轨迹',
    applicantName: '孙立强',
    applicantDepartment: '政策研究室',
    requestedAction: '查询数据',
    actionTypeKey: 'QUERY',
    parentSubmissionTitle: '街镇人口流动与公共设施配套研究',
    parentSubmissionContext: '共 2 项资源，本项为其中之一',
    reviewReasonBadge: '时空轨迹分析',
    reviewReasonDescription: '涉及个体空间动态变动，需确认防逆向标识措施',
    riskLevel: 'HIGH',
    submittedAtText: '昨天 11:15',
    submittedExactTime: '昨天 11:15',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    isAssignedToMe: false,
    departmentCategory: 'policy',
    departmentCategoryName: '政策研究室',
    details: {
      dataFieldsSummary: ['pseudo_id (匿名化标识)', 'origin_district', 'target_district', 'move_quarter'],
      maskedFields: ['precise_stay_days (精确驻留天数 - 转化为区间段)'],
      excludedFields: ['exact_gps_coords', 'cell_tower_id'],
      requestPurpose: '测算各大型居住区人口早晚通勤流动潮汐对公共交通与托幼设施的承压',
      requestedDuration: '180 天 (至 2027-02-13)',
      policyTriggerRule: 'RULE-MOBILITY-02: 包含时间序列空间位移信息，触发差分隐私合规审查',
      suggestedScope: '仅提供街镇级聚合后的流动趋势矩阵，严禁查询单个自然人完整轨迹'
    }
  }
];

export interface AccessReviewWorkspaceProps {
  onNavigateToDataMarket?: () => void;
  onNavigateToBusinessSemantics?: () => void;
  onNavigateToAiHome?: () => void;
  onNavigateToAuthorizationRecords?: () => void;
  onNavigateToPolicyManagement?: () => void;
  onNavigateToAuditLogs?: () => void;
  onOpenDetail?: (requestId: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AccessReviewWorkspace: React.FC<AccessReviewWorkspaceProps> = ({
  onNavigateToDataMarket,
  onNavigateToBusinessSemantics,
  onNavigateToAiHome,
  onNavigateToAuthorizationRecords,
  onNavigateToPolicyManagement,
  onNavigateToAuditLogs,
  onOpenDetail,
  addToast
}) => {
  // Sidebar navigation within Admin Center
  const [activeAdminNav, setActiveAdminNav] = useState<'users' | 'review_queue' | 'auth_records' | 'policies' | 'audit_logs'>('review_queue');

  // Review Items State (supports local decision actions)
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(MOCK_REVIEW_ITEMS);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'PROCESSED' | 'ALL'>('PENDING');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<'ALL' | 'DATA_ASSET' | 'API' | 'OTHER'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'RISK_DESC' | 'APPLICANT'>('NEWEST');
  const [onlyMyTasks, setOnlyMyTasks] = useState<boolean>(false);

  // Modal / Drawer state for Review Detail Decision
  const [activeDecisionItem, setActiveDecisionItem] = useState<ReviewItem | null>(null);
  const [decisionActionType, setDecisionActionType] = useState<'APPROVE' | 'APPROVE_RESTRICTED' | 'REJECT'>('APPROVE_RESTRICTED');
  const [decisionNotes, setDecisionNotes] = useState<string>('同意按照建议的数据保护策略授权，姓名掩码脱敏，排除敏感证件与联络字段。');
  const [modifiedDuration, setModifiedDuration] = useState<string>('90_days');

  // Quick Scope View Drawer
  const [scopePreviewItem, setScopePreviewItem] = useState<ReviewItem | null>(null);

  // Filtered Review Items
  const filteredItems = useMemo(() => {
    return reviewItems.filter((item) => {
      // Keyword search (resource name, applicant, parent submission, request ID)
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const matchesName = item.resourceName.toLowerCase().includes(q);
        const matchesApplicant = item.applicantName.toLowerCase().includes(q) || item.applicantDepartment.toLowerCase().includes(q);
        const matchesSubmission = item.parentSubmissionTitle.toLowerCase().includes(q);
        const matchesId = item.requestId.toLowerCase().includes(q);
        const matchesReason = item.reviewReasonBadge.toLowerCase().includes(q) || item.reviewReasonDescription.toLowerCase().includes(q);
        if (!matchesName && !matchesApplicant && !matchesSubmission && !matchesId && !matchesReason) {
          return false;
        }
      }

      // Risk level filter
      if (riskFilter !== 'ALL' && item.riskLevel !== riskFilter) {
        return false;
      }

      // Resource type filter
      if (resourceTypeFilter !== 'ALL' && item.resourceType !== resourceTypeFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'ALL' && item.departmentCategory !== departmentFilter) {
        return false;
      }

      // Only Assigned to Me
      if (onlyMyTasks && !item.isAssignedToMe) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return b.timestamp - a.timestamp;
      }
      if (sortBy === 'RISK_DESC') {
        const riskWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
      }
      if (sortBy === 'APPLICANT') {
        return a.applicantName.localeCompare(b.applicantName, 'zh');
      }
      return 0;
    });
  }, [reviewItems, searchKeyword, riskFilter, resourceTypeFilter, departmentFilter, onlyMyTasks, sortBy]);

  // Handle Decision Submit (Approve / Approve with limits / Reject)
  const handleConfirmDecision = () => {
    if (!activeDecisionItem) return;

    const actionText = 
      decisionActionType === 'APPROVE' ? '直接核准' :
      decisionActionType === 'APPROVE_RESTRICTED' ? '受限核准 (已套用保护策略)' : '拒绝访问';

    // Remove from active queue in local state
    setReviewItems((prev) => prev.filter((item) => item.id !== activeDecisionItem.id));
    
    addToast?.(
      decisionActionType === 'REJECT' ? 'info' : 'success',
      `已完成访问决策：${activeDecisionItem.resourceName}`,
      `申请人：${activeDecisionItem.applicantName} (${activeDecisionItem.applicantDepartment}) · 裁决结果：${actionText}`
    );

    setActiveDecisionItem(null);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setStatusFilter('PENDING');
    setRiskFilter('ALL');
    setResourceTypeFilter('ALL');
    setDepartmentFilter('ALL');
    setSortBy('NEWEST');
    setOnlyMyTasks(false);
    addToast?.('info', '筛选已重置', '已恢复默认待处理队列视图');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] font-sans antialiased relative select-none">
      
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR: 管理中心 (Admin Center Navigation)       */}
      {/* ========================================================= */}
      <aside className="w-[210px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none z-10">
        <div className="p-4 border-b border-[#E6EAF0]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-[#4F46E5] flex items-center justify-center text-white font-bold text-xs shadow-2xs">
              M
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#172033] tracking-tight">管理中心</h2>
              <p className="text-[10px] text-[#667085]">Admin & Governance</p>
            </div>
          </div>
        </div>

        <div className="p-2.5 flex-1 space-y-4 overflow-y-auto">
          {/* Group 1: 组织与用户 */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-[#98A2B3] tracking-wider uppercase">
              组织与架构
            </div>
            <button
              onClick={() => {
                setActiveAdminNav('users');
                addToast?.('info', '组织与用户', '查看企业组织架构、用户目录与身份同步配置');
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
                activeAdminNav === 'users'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>组织与用户</span>
            </button>
          </div>

          {/* Group 2: 权限管理 (Core Decision Workspace) */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-[#98A2B3] tracking-wider uppercase flex items-center justify-between">
              <span>权限管理</span>
              <span className="text-[9px] px-1 py-0.2 bg-[#EEF2FF] text-[#4F46E5] rounded font-mono font-bold">
                POLICY
              </span>
            </div>

            {/* 访问审核 (Active) */}
            <button
              onClick={() => setActiveAdminNav('review_queue')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
                activeAdminNav === 'review_queue'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <span>访问审核</span>
              </div>
              <span className="w-5 h-4.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                {reviewItems.length}
              </span>
            </button>

            {/* 授权记录 */}
            <button
              onClick={() => {
                setActiveAdminNav('auth_records');
                onNavigateToAuthorizationRecords?.();
                addToast?.('info', '授权记录', '查看企业历史已生效数据访问授权与到期台账');
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
                activeAdminNav === 'auth_records'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>授权记录</span>
            </button>

            {/* 策略管理 */}
            <button
              onClick={() => {
                setActiveAdminNav('policies');
                onNavigateToPolicyManagement?.();
                addToast?.('info', '策略管理', '配置基于属性的安全合规与自动裁决策略规则 (ABAC)');
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
                activeAdminNav === 'policies'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>策略管理</span>
            </button>
          </div>

          {/* Group 3: 安全与审计 */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-[#98A2B3] tracking-wider uppercase">
              安全合规
            </div>
            <button
              onClick={() => {
                setActiveAdminNav('audit_logs');
                onNavigateToAuditLogs?.();
                addToast?.('info', '审计日志', '查看数据访问调用链与人工裁决不可篡改审计追踪');
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
                activeAdminNav === 'audit_logs'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>审计日志</span>
            </button>
          </div>
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
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
              </div>
              <div className="text-[10px] text-[#667085]">安全策略与决策辅助</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN LIST WORKSPACE                                    */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC]">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
            
            {/* Breadcrumb & Header Title Area */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-[#98A2B3]">
                <span>管理中心</span>
                <span>/</span>
                <span>权限管理</span>
                <span>/</span>
                <span className="text-[#475569] font-medium">访问审核</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                    访问审核
                  </h1>
                  <p className="text-xs text-[#667085] pt-1 leading-relaxed">
                    处理当前需要人工决策的访问请求。系统已自动完成可确定的授权判断。
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="px-2.5 py-1 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-semibold text-[#1E40AF] flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>仅显示需人工决策项</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Summary Facts Strip (No loud KPI wall, highly disciplined facts) */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs flex-1">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-[#98A2B3]">待处理</div>
                  <div className="text-base font-bold text-[#172033] flex items-baseline space-x-1">
                    <span>{reviewItems.length}</span>
                    <span className="text-xs font-normal text-[#667085]">项</span>
                  </div>
                </div>

                <div className="space-y-0.5 border-l border-[#EEF2F6] pl-6">
                  <div className="text-[11px] text-[#98A2B3]">高风险</div>
                  <div className="text-base font-bold text-[#D92D20] flex items-baseline space-x-1">
                    <span>{reviewItems.filter(i => i.riskLevel === 'HIGH').length}</span>
                    <span className="text-xs font-normal text-[#667085]">项</span>
                  </div>
                </div>

                <div className="space-y-0.5 border-l border-[#EEF2F6] pl-6">
                  <div className="text-[11px] text-[#98A2B3]">今日新进入</div>
                  <div className="text-base font-bold text-[#2563EB] flex items-baseline space-x-1">
                    <span>5</span>
                    <span className="text-xs font-normal text-[#667085]">项</span>
                  </div>
                </div>

                <div className="space-y-0.5 border-l border-[#EEF2F6] pl-6">
                  <div className="text-[11px] text-[#98A2B3]">自动处理状态</div>
                  <div className="text-xs font-semibold text-[#16A36A] flex items-center space-x-1 pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                    <span>已自动处理可确定请求</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#667085] bg-[#F8FAFC] px-3 py-2 rounded border border-[#EEF2F6] max-w-sm hidden lg:block leading-relaxed">
                人工审核仅处理安全合规策略（Policy）无法安全自动裁决的访问需求。
              </div>
            </div>

            {/* Filter Bar (Enterprise Single Line Filter) */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-3 shadow-2xs space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#98A2B3]" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索资源名称、申请人、所属申请或请求编号…"
                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#172033] placeholder-[#98A2B3] transition-all"
                  />
                  {searchKeyword && (
                    <button
                      onClick={() => setSearchKeyword('')}
                      className="absolute right-2.5 top-2 text-[#98A2B3] hover:text-[#475569] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Status Select */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="appearance-none bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#334155] text-xs rounded pl-2.5 pr-7 py-1.5 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    >
                      <option value="PENDING">状态：待处理 ({reviewItems.length})</option>
                      <option value="PROCESSED">状态：我已处理 (38)</option>
                      <option value="ALL">状态：全部状态</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2 top-2 pointer-events-none" />
                  </div>

                  {/* Risk Level Select */}
                  <div className="relative">
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value as any)}
                      className="appearance-none bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#334155] text-xs rounded pl-2.5 pr-7 py-1.5 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    >
                      <option value="ALL">风险等级：全部</option>
                      <option value="HIGH">高风险</option>
                      <option value="MEDIUM">中等风险</option>
                      <option value="LOW">普通风险</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2 top-2 pointer-events-none" />
                  </div>

                  {/* Resource Type Select */}
                  <div className="relative">
                    <select
                      value={resourceTypeFilter}
                      onChange={(e) => setResourceTypeFilter(e.target.value as any)}
                      className="appearance-none bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#334155] text-xs rounded pl-2.5 pr-7 py-1.5 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    >
                      <option value="ALL">资源类型：全部</option>
                      <option value="DATA_ASSET">数据资产 (Data Asset)</option>
                      <option value="API">数据 API</option>
                      <option value="OTHER">其他资源</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2 top-2 pointer-events-none" />
                  </div>

                  {/* Department Select */}
                  <div className="relative">
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="appearance-none bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#334155] text-xs rounded pl-2.5 pr-7 py-1.5 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    >
                      <option value="ALL">申请部门：全部</option>
                      <option value="population">人口分析部门</option>
                      <option value="business">营商分析组</option>
                      <option value="civil">民政服务组</option>
                      <option value="policy">政策研究室</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2 top-2 pointer-events-none" />
                  </div>

                  {/* Sort Order Select */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="appearance-none bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#334155] text-xs rounded pl-2.5 pr-7 py-1.5 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    >
                      <option value="NEWEST">排序：最新进入优先</option>
                      <option value="RISK_DESC">排序：风险由高到低</option>
                      <option value="APPLICANT">排序：申请人姓名</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* Right Quick Controls (Only Assigned to Me + Reset) */}
                <div className="flex items-center space-x-2.5 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-[#EEF2F6]">
                  {/* Toggle: 仅看分配给我 */}
                  <button
                    onClick={() => setOnlyMyTasks(prev => !prev)}
                    className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer border ${
                      onlyMyTasks
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>仅看分配给我</span>
                  </button>

                  <button
                    onClick={handleResetFilters}
                    className="px-2 py-1.5 text-xs text-[#64748B] hover:text-[#172033] hover:underline cursor-pointer transition-colors"
                  >
                    重置
                  </button>
                </div>
              </div>
            </div>

            {/* Review Queue Table (Enterprise Review Table + Rich First Column) */}
            <div className="bg-white border border-[#E6EAF0] rounded-md shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] text-[11px]">
                      <th className="py-3 px-4 font-semibold w-[34%]">访问请求</th>
                      <th className="py-3 px-3 font-semibold w-[12%]">申请人</th>
                      <th className="py-3 px-3 font-semibold w-[10%]">申请动作</th>
                      <th className="py-3 px-4 font-semibold w-[18%]">所属申请</th>
                      <th className="py-3 px-4 font-semibold w-[14%]">需要人工决策原因</th>
                      <th className="py-3 px-3 font-semibold w-[12%]">提交时间</th>
                      <th className="py-3 px-4 font-semibold text-right w-[100px]">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F6]">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#98A2B3]">
                          <div className="space-y-1.5">
                            <ShieldCheck className="w-8 h-8 text-[#CBD5E1] mx-auto" />
                            <div className="text-xs font-semibold text-[#64748B]">当前筛选条件下暂无待人工审核项</div>
                            <div className="text-[11px] text-[#98A2B3]">可直接调整筛选条件或重置筛选器</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F8FAFC] transition-colors group"
                        >
                          {/* Col 1: Rich First Column (Resource Entity + Protection Hint) */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-[#172033] hover:text-[#2563EB] transition-colors cursor-pointer"
                                      onClick={() => setScopePreviewItem(item)}>
                                  {item.resourceName}
                                </span>
                                
                                {item.resourceType === 'DATA_ASSET' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] text-[#2563EB] rounded border border-[#E2E8F0] font-mono">
                                    DATA ASSET · {item.resourceSubType || 'VIEW'}
                                  </span>
                                )}
                                {item.resourceType === 'API' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F5F3FF] text-[#7C3AED] rounded border border-[#DDD6FE] font-mono">
                                    API
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-[#475569] leading-relaxed">
                                {item.resourceActionSummary}
                              </p>

                              <div className="text-[10px] text-[#667085] pt-0.5 flex items-center space-x-1">
                                <span className="text-[#98A2B3]">{item.suggestedProtection}</span>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Applicant */}
                          <td className="py-3.5 px-3 align-top">
                            <div className="space-y-0.5">
                              <div className="font-bold text-[#172033] flex items-center space-x-1">
                                <span>{item.applicantName}</span>
                              </div>
                              <div className="text-[10px] text-[#667085]">
                                {item.applicantDepartment}
                              </div>
                            </div>
                          </td>

                          {/* Col 3: Requested Action */}
                          <td className="py-3.5 px-3 align-top">
                            <div>
                              {item.actionTypeKey === 'EXPORT' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#FEF3F2] text-[#D92D20] font-bold text-[11px] border border-[#FECDCA]">
                                  <Download className="w-3 h-3" />
                                  <span>{item.requestedAction}</span>
                                </span>
                              ) : item.actionTypeKey === 'INVOKE' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#F5F3FF] text-[#7C3AED] font-semibold text-[11px] border border-[#DDD6FE]">
                                  <Globe className="w-3 h-3" />
                                  <span>{item.requestedAction}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#F8FAFC] text-[#334155] font-semibold text-[11px] border border-[#E2E8F0]">
                                  <span>{item.requestedAction}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Col 4: Parent Submission Context */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-[#172033] line-clamp-1" title={item.parentSubmissionTitle}>
                                {item.parentSubmissionTitle}
                              </div>
                              <div className="text-[10px] text-[#98A2B3]">
                                {item.parentSubmissionContext}
                              </div>
                            </div>
                          </td>

                          {/* Col 5: Reason for Human Review Required */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <div>
                                {item.riskLevel === 'HIGH' ? (
                                  <span className="inline-block px-1.5 py-0.2 rounded bg-[#FEF3F2] text-[#D92D20] font-bold text-[10px] border border-[#FECDCA]">
                                    {item.reviewReasonBadge}
                                  </span>
                                ) : item.riskLevel === 'MEDIUM' ? (
                                  <span className="inline-block px-1.5 py-0.2 rounded bg-[#FFFBEB] text-[#D97706] font-semibold text-[10px] border border-[#FDE68A]">
                                    {item.reviewReasonBadge}
                                  </span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#475569] font-medium text-[10px] border border-[#E2E8F0]">
                                    {item.reviewReasonBadge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#667085] leading-relaxed">
                                {item.reviewReasonDescription}
                              </p>
                            </div>
                          </td>

                          {/* Col 6: Submission Time */}
                          <td className="py-3.5 px-3 align-top">
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-[#334155]">
                                {item.submittedAtText}
                              </div>
                              <div className="text-[10px] text-[#98A2B3]">
                                {item.submittedExactTime}
                              </div>
                            </div>
                          </td>

                          {/* Col 7: Actions */}
                          <td className="py-3.5 px-4 align-top text-right space-y-1.5">
                            <button
                              onClick={() => {
                                if (onOpenDetail) {
                                  onOpenDetail(item.id);
                                } else {
                                  setActiveDecisionItem(item);
                                  setDecisionActionType(item.riskLevel === 'HIGH' ? 'APPROVE_RESTRICTED' : 'APPROVE_RESTRICTED');
                                  setDecisionNotes(
                                    item.actionTypeKey === 'EXPORT'
                                      ? '核准导出：限定沙箱环境使用，附带操作员隐形水印，有效期 7 天。'
                                      : '同意按建议数据保护范围受限授权，已核定列级脱敏与行级过滤条件。'
                                  );
                                }
                              }}
                              className="w-full py-1 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs"
                            >
                              审核
                            </button>

                            <button
                              onClick={() => setScopePreviewItem(item)}
                              className="w-full text-[11px] text-[#667085] hover:text-[#2563EB] hover:underline text-center cursor-pointer transition-colors block"
                            >
                              查看范围
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-3.5 bg-[#FAFCFF] border-t border-[#E6EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#667085]">
                <div>
                  显示 <span className="font-bold text-[#172033]">{filteredItems.length}</span> 项需人工裁决请求
                  {onlyMyTasks && <span className="ml-1 text-[#2563EB]">（仅看分配给我）</span>}
                </div>

                <div className="flex items-center space-x-3 text-[11px]">
                  <span>系统自动裁决规则引擎已启用</span>
                  <span className="text-[#CBD5E1]">|</span>
                  <button 
                    onClick={() => addToast?.('info', '刷新队列', '已同步最新访问请求队列')}
                    className="text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>刷新队列</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ========================================================= */}
      {/* 3. ACCESS REVIEW DECISION MODAL                           */}
      {/* ========================================================= */}
      {activeDecisionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E6EAF0] flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EEF2FF] text-[#4F46E5] rounded font-mono">
                    {activeDecisionItem.requestId}
                  </span>
                  <h3 className="text-sm font-bold text-[#172033]">
                    访问审核决策 · {activeDecisionItem.resourceName}
                  </h3>
                </div>
                <p className="text-xs text-[#667085]">
                  申请人：{activeDecisionItem.applicantName}（{activeDecisionItem.applicantDepartment}）· 所属任务：{activeDecisionItem.parentSubmissionTitle}
                </p>
              </div>

              <button
                onClick={() => setActiveDecisionItem(null)}
                className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Trigger Reason Box */}
              <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-1">
                <div className="text-[11px] font-bold text-[#92400E] flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>策略触发原因：{activeDecisionItem.reviewReasonBadge}</span>
                </div>
                <p className="text-xs text-[#78350F] leading-relaxed">
                  {activeDecisionItem.details.policyTriggerRule}
                </p>
              </div>

              {/* Request Context Summary */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="bg-[#F8FAFC] p-3 rounded border border-[#E6EAF0] space-y-1">
                  <div className="text-[#98A2B3]">申请目的</div>
                  <div className="font-semibold text-[#172033]">{activeDecisionItem.details.requestPurpose}</div>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded border border-[#E6EAF0] space-y-1">
                  <div className="text-[#98A2B3]">申请动作与期限</div>
                  <div className="font-semibold text-[#172033]">{activeDecisionItem.requestedAction} · {activeDecisionItem.details.requestedDuration}</div>
                </div>
              </div>

              {/* Proposed Protection Strategy */}
              <div className="space-y-2 border-t border-[#EEF2F6] pt-3">
                <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
                  <span>建议受限访问方案 (Protected Scope)</span>
                  <span className="text-[10px] text-[#16A36A] font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>已通过系统前置静态合规校验</span>
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded border border-[#E6EAF0] space-y-2">
                  <div className="text-[11px] text-[#475569]">
                    <strong>开放字段：</strong> {activeDecisionItem.details.dataFieldsSummary.join('，')}
                  </div>
                  {activeDecisionItem.details.maskedFields.length > 0 && (
                    <div className="text-[11px] text-[#2563EB]">
                      <strong>脱敏保护列：</strong> {activeDecisionItem.details.maskedFields.join('，')}
                    </div>
                  )}
                  {activeDecisionItem.details.excludedFields.length > 0 && (
                    <div className="text-[11px] text-[#D92D20]">
                      <strong>屏蔽排除列：</strong> {activeDecisionItem.details.excludedFields.join('，')}
                    </div>
                  )}
                </div>
              </div>

              {/* Decision Action Selection */}
              <div className="space-y-2 border-t border-[#EEF2F6] pt-3">
                <div className="text-xs font-bold text-[#172033]">裁决操作</div>
                
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`p-2.5 rounded border flex flex-col cursor-pointer transition-all ${
                      decisionActionType === 'APPROVE_RESTRICTED'
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1E40AF]'
                        : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <input
                        type="radio"
                        name="decision"
                        checked={decisionActionType === 'APPROVE_RESTRICTED'}
                        onChange={() => setDecisionActionType('APPROVE_RESTRICTED')}
                        className="text-[#2563EB]"
                      />
                      <span>受限核准 (推荐)</span>
                    </div>
                    <span className="text-[10px] text-[#667085] mt-1">按建议保护策略授权</span>
                  </label>

                  <label
                    className={`p-2.5 rounded border flex flex-col cursor-pointer transition-all ${
                      decisionActionType === 'APPROVE'
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1E40AF]'
                        : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <input
                        type="radio"
                        name="decision"
                        checked={decisionActionType === 'APPROVE'}
                        onChange={() => setDecisionActionType('APPROVE')}
                        className="text-[#2563EB]"
                      />
                      <span>直接核准</span>
                    </div>
                    <span className="text-[10px] text-[#667085] mt-1">完全按原申请范围开放</span>
                  </label>

                  <label
                    className={`p-2.5 rounded border flex flex-col cursor-pointer transition-all ${
                      decisionActionType === 'REJECT'
                        ? 'bg-[#FEF3F2] border-[#D92D20] text-[#991B1B]'
                        : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <input
                        type="radio"
                        name="decision"
                        checked={decisionActionType === 'REJECT'}
                        onChange={() => setDecisionActionType('REJECT')}
                        className="text-[#D92D20]"
                      />
                      <span>拒绝访问</span>
                    </div>
                    <span className="text-[10px] text-[#667085] mt-1">不予批准此次访问请求</span>
                  </label>
                </div>
              </div>

              {/* Reviewer Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#475569]">审核审批意见记录</label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="填写审核依据、授权限制或拒绝原因（将存入不可篡改审计日志）…"
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white resize-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E6EAF0] flex items-center justify-between shrink-0">
              <div className="text-[11px] text-[#98A2B3]">
                裁决结果将同步记入不可篡改访问授权审计日志
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => setActiveDecisionItem(null)}
                  className="px-4 py-1.5 bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded hover:bg-[#F1F5F9] cursor-pointer transition-colors"
                >
                  取消
                </button>

                <button
                  onClick={handleConfirmDecision}
                  className={`px-4 py-1.5 text-white text-xs font-bold rounded cursor-pointer shadow-2xs transition-colors ${
                    decisionActionType === 'REJECT'
                      ? 'bg-[#D92D20] hover:bg-[#B42318]'
                      : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                  }`}
                >
                  确认裁决
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. QUICK SCOPE PREVIEW DRAWER                             */}
      {/* ========================================================= */}
      {scopePreviewItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <aside className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            
            <div className="px-6 py-4 border-b border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-[#172033]">{scopePreviewItem.resourceName}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EEF2FF] text-[#4F46E5] rounded font-mono">
                    {scopePreviewItem.requestId}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">申请人：{scopePreviewItem.applicantName} · {scopePreviewItem.applicantDepartment}</p>
              </div>

              <button
                onClick={() => setScopePreviewItem(null)}
                className="p-1.5 rounded hover:bg-[#EEF2F6] text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#64748B]">所属业务申请</div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md font-semibold text-[#172033]">
                  {scopePreviewItem.parentSubmissionTitle}
                  <div className="text-[10px] font-normal text-[#667085] mt-0.5">{scopePreviewItem.parentSubmissionContext}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#64748B]">人工审核原因</div>
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md text-[#92400E]">
                  <div className="font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>{scopePreviewItem.reviewReasonBadge}</span>
                  </div>
                  <div className="text-[11px] mt-1 text-[#78350F]">{scopePreviewItem.reviewReasonDescription}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#64748B]">建议可访问字段范围</div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-2">
                  <div className="text-[11px] text-[#334155]">
                    <strong>开放字段：</strong> {scopePreviewItem.details.dataFieldsSummary.join('，')}
                  </div>
                  {scopePreviewItem.details.maskedFields.length > 0 && (
                    <div className="text-[11px] text-[#2563EB]">
                      <strong>脱敏字段：</strong> {scopePreviewItem.details.maskedFields.join('，')}
                    </div>
                  )}
                  {scopePreviewItem.details.excludedFields.length > 0 && (
                    <div className="text-[11px] text-[#D92D20]">
                      <strong>排除字段：</strong> {scopePreviewItem.details.excludedFields.join('，')}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#64748B]">申请目的</div>
                <p className="text-xs text-[#475569] leading-relaxed p-3 bg-[#F8FAFC] rounded border border-[#E6EAF0]">
                  {scopePreviewItem.details.requestPurpose}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-[#E6EAF0] bg-[#FAFCFF] flex items-center justify-between">
              <button
                onClick={() => setScopePreviewItem(null)}
                className="px-4 py-1.5 bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded hover:bg-[#F1F5F9] cursor-pointer"
              >
                关闭
              </button>

              <button
                onClick={() => {
                  const target = scopePreviewItem;
                  setScopePreviewItem(null);
                  setActiveDecisionItem(target);
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-2xs"
              >
                直接进入审核决策 →
              </button>
            </div>

          </aside>
        </div>
      )}

    </div>
  );
};
