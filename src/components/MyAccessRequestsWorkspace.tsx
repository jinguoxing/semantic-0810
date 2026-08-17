import React, { useState, useMemo } from 'react';
import {
  Compass,
  Layers,
  FileCheck,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Sliders,
  ExternalLink,
  Shield,
  FileText,
  Info,
  X,
  Lock,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';

export type TaskReadiness = 'WAITING' | 'READY' | 'DEGRADED' | 'BLOCKED';
export type RequestAccessState = 'GRANTED' | 'PROCESSING' | 'DENIED' | 'EXPIRED';

export interface ResourceRequestItem {
  id: string;
  name: string;
  typeBadge: string;
  roleBadge: '核心数据' | '补充数据' | '参考数据';
  operation: '查询数据' | '数据导出' | 'API调用';
  accessState: RequestAccessState;
  stateLabel: string;
  scopeSummary: string;
  validity: string;
  isAutoDecided?: boolean;
  autoDecideNote?: string;
  processingNote?: string;
  deniedNote?: string;
  expiredNote?: string;
  suggestedAction?: {
    label: string;
    actionType: 'reapply_suggested' | 'reapply' | 'view_resource';
  };
  // Detailed Drawer Data
  detail: {
    region: string;
    allowedFields: string[];
    protectionRules: string[];
    restrictions: string;
    decisionMethod: '系统自动处理' | '人工访问决策';
    decisionReason: string;
    submittedAt: string;
    purpose: string;
  };
}

export interface AccessSubmission {
  id: string;
  taskTitle: string;
  typeTag: string;
  purposeDescription: string;
  source: string;
  submittedTime: string;
  updatedTime: string;
  accessProgress: string; // e.g., "1 项已授权 · 1 项处理中"
  taskReadiness: TaskReadiness;
  taskReadinessLabel: string;
  taskReadinessNote: string;
  primaryAction: {
    label: string;
    actionType: 'resume' | 'resume_degraded' | 'check_progress' | 'adjust_plan' | 'reapply';
  };
  secondaryActions: Array<{
    label: string;
    actionType: 'view_limits' | 'back_to_solution' | 'view_submission_detail' | 'reapply_necessary';
  }>;
  requests: ResourceRequestItem[];
  // Drawer data for limitation breakdown when degraded
  limitations?: {
    canDo: string[];
    restricted: string[];
    reason: string;
  };
}

export interface MyAccessRequestsWorkspaceProps {
  onNavigateToDiscovery?: () => void;
  onNavigateToResources?: () => void;
  onNavigateToSolution?: (solutionName?: string) => void;
  onResumeAnalysisTask?: (taskName: string, mode?: 'full' | 'degraded') => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MyAccessRequestsWorkspace: React.FC<MyAccessRequestsWorkspaceProps> = ({
  onNavigateToDiscovery,
  onNavigateToResources,
  onNavigateToSolution,
  onResumeAnalysisTask,
  addToast,
}) => {
  // Navigation active side item
  const [activeSideNav, setActiveSideNav] = useState<'discovery' | 'resources' | 'my_requests'>('my_requests');

  // Filter and Search states
  const [activeTab, setActiveTab] = useState<'all' | 'WAITING' | 'READY' | 'DEGRADED' | 'BLOCKED'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('recent');

  // Top Light Notification Banner for newly ready submission
  const [showTopReadyBanner, setShowTopReadyBanner] = useState<boolean>(true);

  // Submissions expanded status map (submissionId -> boolean)
  // Requirement: First submission (WAITING) is expanded by default; 2nd (READY) & 3rd (DEGRADED) are collapsed
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({
    'sub-01-aging': true,
    'sub-02-structure': false,
    'sub-03-elderly-care': false,
    'sub-04-aging-rate': false,
  });

  // Drawer states
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<{
    submissionTitle: string;
    request: ResourceRequestItem;
  } | null>(null);

  const [selectedDegradedLimits, setSelectedDegradedLimits] = useState<{
    submissionTitle: string;
    submissionId: string;
    limitations: {
      canDo: string[];
      restricted: string[];
      reason: string;
    };
  } | null>(null);

  // Mock Submissions Data
  const [submissions, setSubmissions] = useState<AccessSubmission[]>([
    // -------------------------------------------------------------
    // Submission 1: WAITING (展开状态)
    // -------------------------------------------------------------
    {
      id: 'sub-01-aging',
      taskTitle: '街镇老龄化与养老资源分析',
      typeTag: '数据方案申请',
      purposeDescription: '为了分析街镇人口老龄化程度及养老资源覆盖情况申请所需数据。',
      source: '推荐数据方案',
      submittedTime: '今天 10:18',
      updatedTime: '今天 10:19',
      accessProgress: '1 项已授权 · 1 项处理中',
      taskReadiness: 'WAITING',
      taskReadinessLabel: '等待所需资源',
      taskReadinessNote: '人口基本信息视图已具备访问条件；养老机构基本信息仍在处理中，当前完整分析暂不能继续。',
      primaryAction: {
        label: '查看进度',
        actionType: 'check_progress',
      },
      secondaryActions: [
        {
          label: '返回数据方案',
          actionType: 'back_to_solution',
        },
      ],
      requests: [
        {
          id: 'req-01-pop-view',
          name: '人口基本信息视图',
          typeBadge: 'DATA ASSET · VIEW',
          roleBadge: '核心数据',
          operation: '查询数据',
          accessState: 'GRANTED',
          stateLabel: '已授权',
          scopeSummary: '年龄与出生信息 · 常住状态 · 行政区域 · 姓名脱敏',
          validity: '至 2026-11-17',
          isAutoDecided: true,
          autoDecideNote: '根据现有策略自动处理',
          detail: {
            region: '闵行区全域',
            allowedFields: ['年龄与出生信息', '常住状态', '行政区域'],
            protectionRules: ['姓名动态脱敏', '身份证号不可访问', '手机号不可访问'],
            restrictions: '禁止导出 · 仅限当前分析任务查询',
            decisionMethod: '系统自动处理',
            decisionReason: '在最小必要范围和标准数据保护条件下自动授权。',
            submittedAt: '今天 10:18',
            purpose: '街镇老龄化与养老资源分析',
          },
        },
        {
          id: 'req-02-elderly-care',
          name: '养老机构基本信息',
          typeBadge: 'DATA ASSET',
          roleBadge: '补充数据',
          operation: '查询数据',
          accessState: 'PROCESSING',
          stateLabel: '处理中',
          scopeSummary: '机构位置 · 床位规模 · 服务能力',
          validity: '待生效',
          processingNote: '当前请求需要人工访问决策。',
          detail: {
            region: '闵行区全域',
            allowedFields: ['机构名称', '机构地址与经纬度', '核定床位数', '提供服务类型'],
            protectionRules: ['运营人员薪资不可见', '内部财务账目不可见'],
            restrictions: '待审核策略确定',
            decisionMethod: '人工访问决策',
            decisionReason: '机构空间坐标与服务数据涉及特定业务线，正在进行合规策略核对。',
            submittedAt: '今天 10:18',
            purpose: '街镇老龄化与养老资源分析',
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // Submission 2: READY (收起状态)
    // -------------------------------------------------------------
    {
      id: 'sub-02-structure',
      taskTitle: '各街镇人口结构趋势分析',
      typeTag: '数据方案申请',
      purposeDescription: '测算近三年各街镇不同年龄梯队人口变动比例与抚养比。',
      source: '推荐数据方案',
      submittedTime: '昨天 16:40',
      updatedTime: '今天 09:30',
      accessProgress: '2 项已授权',
      taskReadiness: 'READY',
      taskReadinessLabel: '已准备',
      taskReadinessNote: '当前获批范围已满足原分析任务所需的数据能力。',
      primaryAction: {
        label: '继续分析',
        actionType: 'resume',
      },
      secondaryActions: [
        {
          label: '查看申请详情',
          actionType: 'view_submission_detail',
        },
      ],
      requests: [
        {
          id: 'req-03-history-pop',
          name: '历年人口变动统计表',
          typeBadge: 'DATA ASSET',
          roleBadge: '核心数据',
          operation: '查询数据',
          accessState: 'GRANTED',
          stateLabel: '已授权',
          scopeSummary: '2023-2025年按街镇年龄段汇总数据',
          validity: '至 2026-11-16',
          isAutoDecided: true,
          autoDecideNote: '根据现有策略自动处理',
          detail: {
            region: '全区各街镇',
            allowedFields: ['统计年份', '街镇编码', '年龄区间', '常住人口汇总数'],
            protectionRules: ['无个人级敏感信息', '已预聚合'],
            restrictions: '允许在线查询与生成可视化报表',
            decisionMethod: '系统自动处理',
            decisionReason: '公共统计聚合指标，符合开放访问规则。',
            submittedAt: '昨天 16:40',
            purpose: '各街镇人口结构趋势分析',
          },
        },
        {
          id: 'req-04-region-geo',
          name: '行政区划基础数据',
          typeBadge: 'DATA ASSET · DIMENSION',
          roleBadge: '核心数据',
          operation: '查询数据',
          accessState: 'GRANTED',
          stateLabel: '已授权',
          scopeSummary: '街镇行政区划代码 · 空间边界 · 面积',
          validity: '至 2027-08-16',
          isAutoDecided: true,
          autoDecideNote: '根据现有策略自动处理',
          detail: {
            region: '闵行区',
            allowedFields: ['区划代码', '街镇名称', '地理边界坐标', '辖区面积'],
            protectionRules: ['基础公共维度数据'],
            restrictions: '无特殊限制',
            decisionMethod: '系统自动处理',
            decisionReason: '标准空间维度字典表，全员只读开放。',
            submittedAt: '昨天 16:40',
            purpose: '各街镇人口结构趋势分析',
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // Submission 3: DEGRADED (收起状态)
    // -------------------------------------------------------------
    {
      id: 'sub-03-elderly-care',
      taskTitle: '社区养老服务供给分析',
      typeTag: '数据方案申请',
      purposeDescription: '评估各社区助餐点、日间照料中心的服务半径与覆盖效能。',
      source: '目标搜数推荐',
      submittedTime: '2026-08-14 14:20',
      updatedTime: '2026-08-15 11:05',
      accessProgress: '全部访问请求已处理',
      taskReadiness: 'DEGRADED',
      taskReadinessLabel: '受限可用',
      taskReadinessNote: '当前授权可支持机构位置和服务能力分析，但不包含部分敏感业务信息。',
      primaryAction: {
        label: '继续受限分析',
        actionType: 'resume_degraded',
      },
      secondaryActions: [
        {
          label: '查看限制',
          actionType: 'view_limits',
        },
      ],
      limitations: {
        canDo: [
          '养老机构位置与空间分布分析',
          '核定床位与服务能力规模评估',
          '各街镇服务供给覆盖率横向比较',
        ],
        restricted: [
          '机构负责人与联系人电话不可访问',
          '原始明细数据导出不可用',
          '内部运营支出明细字段已屏蔽',
        ],
        reason: '最终授权范围根据数据安全与隐私保护策略进行了收敛，裁剪了非必要的联系人及运营敏感字段。',
      },
      requests: [
        {
          id: 'req-05-care-sites',
          name: '社区助老服务网点明细',
          typeBadge: 'DATA ASSET',
          roleBadge: '核心数据',
          operation: '查询数据',
          accessState: 'GRANTED',
          stateLabel: '已授权 (已收敛)',
          scopeSummary: '网点名称 · 地址坐标 · 每日供餐能力 · 负责人脱敏',
          validity: '至 2026-11-14',
          isAutoDecided: false,
          processingNote: '人工访问决策：已收敛敏感联系方式',
          detail: {
            region: '全区各社区网格',
            allowedFields: ['网点名称', '街道社区归属', '空间位置', '供餐与照料核定能力'],
            protectionRules: ['联系人姓名掩码脱敏', '电话号码字段物理屏蔽'],
            restrictions: '禁止数据导出',
            decisionMethod: '人工访问决策',
            decisionReason: '根据数据分级要求，在保障服务能力分析前提下隐去个人隐私信息。',
            submittedAt: '2026-08-14 14:20',
            purpose: '社区养老服务供给分析',
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // Submission 4: BLOCKED (露出一部分)
    // -------------------------------------------------------------
    {
      id: 'sub-04-aging-rate',
      taskTitle: '老龄化率专题离线分析',
      typeTag: '数据方案申请',
      purposeDescription: '申请常住人口明细及外来迁移人口底册以进行离线数仓重构与专题建模。',
      source: '自主方案构建',
      submittedTime: '2026-08-12 09:10',
      updatedTime: '2026-08-13 17:30',
      accessProgress: '1 项已授权 · 1 项未授权',
      taskReadiness: 'BLOCKED',
      taskReadinessLabel: '暂时无法继续',
      taskReadinessNote: '当前授权范围缺少正式指标计算所需的常住人口信息。',
      primaryAction: {
        label: '调整数据方案',
        actionType: 'adjust_plan',
      },
      secondaryActions: [
        {
          label: '重新申请必要范围',
          actionType: 'reapply_necessary',
        },
      ],
      requests: [
        {
          id: 'req-06-base-pop',
          name: '全员人口底册明细 (含身份证)',
          typeBadge: 'DATA ASSET',
          roleBadge: '核心数据',
          operation: '数据导出',
          accessState: 'DENIED',
          stateLabel: '未授权',
          scopeSummary: '全区人口原始身份证与手机号明细',
          validity: '未生效',
          deniedNote: '当前操作不符合该资源使用策略。原始明细导出受严格合规限制，建议改为在线视图查询。',
          suggestedAction: {
            label: '按建议重新申请 (改选人口基本信息视图)',
            actionType: 'reapply_suggested',
          },
          detail: {
            region: '全区',
            allowedFields: [],
            protectionRules: ['极高风险数据，严禁离线大批量提取'],
            restrictions: '策略阻断',
            decisionMethod: '人工访问决策',
            decisionReason: '分析任务无需个人证件号码，建议申请脱敏后的「人口基本信息视图」。',
            submittedAt: '2026-08-12 09:10',
            purpose: '老龄化率专题离线分析',
          },
        },
        {
          id: 'req-07-standard-dim',
          name: '老龄人口判定指标口径字典',
          typeBadge: 'METRIC · STANDARD',
          roleBadge: '参考数据',
          operation: '查询数据',
          accessState: 'GRANTED',
          stateLabel: '已授权',
          scopeSummary: '60/65周岁划定口径 · 抚养比计算公式',
          validity: '至 2027-08-12',
          isAutoDecided: true,
          autoDecideNote: '根据现有策略自动处理',
          detail: {
            region: '全区统一',
            allowedFields: ['标准口径名称', '计算逻辑公式', '版本号'],
            protectionRules: ['公开标准口径'],
            restrictions: '只读引用',
            decisionMethod: '系统自动处理',
            decisionReason: '企业统一口径字典，已自动开放。',
            submittedAt: '2026-08-12 09:10',
            purpose: '老龄化率专题离线分析',
          },
        },
      ],
    },
  ]);

  // Toggle Submission Expansion
  const toggleSubmissionExpand = (id: string) => {
    setExpandedSubmissions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Tab filter (by TaskReadiness)
      if (activeTab !== 'all' && sub.taskReadiness !== activeTab) {
        return false;
      }
      // Keyword search
      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase();
        const matchTitle = sub.taskTitle.toLowerCase().includes(query);
        const matchPurpose = sub.purposeDescription.toLowerCase().includes(query);
        const matchResource = sub.requests.some((r) => r.name.toLowerCase().includes(query));
        if (!matchTitle && !matchPurpose && !matchResource) {
          return false;
        }
      }
      // Source filter
      if (sourceFilter !== 'all' && sub.source !== sourceFilter) {
        return false;
      }
      return true;
    });
  }, [submissions, activeTab, searchKeyword, sourceFilter]);

  // Handle Primary Actions
  const handlePrimaryAction = (sub: AccessSubmission) => {
    switch (sub.primaryAction.actionType) {
      case 'resume':
        if (onResumeAnalysisTask) {
          onResumeAnalysisTask(sub.taskTitle, 'full');
        }
        addToast?.('success', '继续工作', `已载入「${sub.taskTitle}」并恢复分析工作流`);
        break;
      case 'resume_degraded':
        if (onResumeAnalysisTask) {
          onResumeAnalysisTask(sub.taskTitle, 'degraded');
        }
        addToast?.('info', '继续受限分析', `已在受限访问模式下载入「${sub.taskTitle}」`);
        break;
      case 'check_progress':
        // Expand and highlight current progress
        setExpandedSubmissions((prev) => ({ ...prev, [sub.id]: true }));
        addToast?.('info', '查看申请进度', `「${sub.taskTitle}」内含 1 项已授权，1 项人工决策处理中`);
        break;
      case 'adjust_plan':
        if (onNavigateToSolution) {
          onNavigateToSolution(sub.taskTitle);
        }
        addToast?.('info', '调整数据方案', `正在进入数据方案调整页面，以便替换受阻断的资源`);
        break;
      default:
        break;
    }
  };

  // Handle Secondary Actions
  const handleSecondaryAction = (sub: AccessSubmission, actionType: string) => {
    if (actionType === 'view_limits' && sub.limitations) {
      setSelectedDegradedLimits({
        submissionTitle: sub.taskTitle,
        submissionId: sub.id,
        limitations: sub.limitations,
      });
    } else if (actionType === 'back_to_solution') {
      if (onNavigateToSolution) {
        onNavigateToSolution(sub.taskTitle);
      }
      addToast?.('info', '返回数据方案', `已返回「${sub.taskTitle}」的推荐数据方案`);
    } else if (actionType === 'view_submission_detail') {
      setExpandedSubmissions((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }));
    } else if (actionType === 'reapply_necessary') {
      addToast?.('info', '重新申请必要范围', `已根据最小必要原则为您生成合规范围申请模板`);
    }
  };

  // Get Task Readiness Badge & Icon Style
  const renderTaskReadinessBadge = (readiness: TaskReadiness, label: string) => {
    switch (readiness) {
      case 'READY':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] rounded-full text-xs font-bold shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
            <span>{label}</span>
          </div>
        );
      case 'WAITING':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] rounded-full text-xs font-bold shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{label}</span>
          </div>
        );
      case 'DEGRADED':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] rounded-full text-xs font-bold shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{label}</span>
          </div>
        );
      case 'BLOCKED':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] rounded-full text-xs font-bold shrink-0">
            <XCircle className="w-3.5 h-3.5 text-[#D92D20]" />
            <span>{label}</span>
          </div>
        );
    }
  };

  // Get Request Access State Badge
  const renderRequestStateBadge = (state: RequestAccessState, label: string) => {
    switch (state) {
      case 'GRANTED':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#15803D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
            <span>{label}</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#D97706]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>{label}</span>
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#DC2626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D92D20]" />
            <span>{label}</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#64748B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] select-none">
      {/* ========================================================= */}
      {/* 1. LEFT NAVIGATION SIDEBAR (220px)                        */}
      {/* ========================================================= */}
      <aside className="w-[220px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#EEF2F6]">
          <div className="text-xs font-bold text-[#667085] tracking-wider uppercase">
            Marketplace
          </div>
          <div className="text-sm font-extrabold text-[#172033] mt-0.5">
            数据服务超市
          </div>
        </div>

        {/* Navigation Items */}
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

          {/* 2. 资源 */}
          <button
            onClick={() => {
              setActiveSideNav('resources');
              onNavigateToResources?.();
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'resources'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#64748B]" />
            <span>资源</span>
          </button>

          {/* 3. 我的申请 (当前高亮) */}
          <button
            onClick={() => setActiveSideNav('my_requests')}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'my_requests'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#2563EB]" />
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
      {/* 2. MAIN SUBMISSION WORKSPACE (宽阔主体，~1080-1160px)        */}
      {/* ========================================================= */}
      <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col space-y-4">
        <div className="max-w-[1140px] w-full mx-auto space-y-4">
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-xs text-[#667085] font-normal">
            <span
              onClick={onNavigateToDiscovery}
              className="hover:text-[#2563EB] cursor-pointer"
            >
              数据服务超市
            </span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="font-semibold text-[#172033]">
              我的申请
            </span>
          </div>

          {/* Page Title Area */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-0.5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                我的申请
              </h1>
              <p className="text-xs text-[#667085] leading-relaxed">
                查看已提交的资源访问需求，并在访问条件满足后继续原来的工作。
              </p>
            </div>

            {/* Right link: 去发现资源 */}
            <button
              onClick={onNavigateToResources}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] hover:text-[#2563EB] text-xs font-medium rounded-md shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#64748B]" />
              <span>去发现资源</span>
            </button>
          </div>

          {/* Top Light Notification Banner: Ready Alert */}
          {showTopReadyBanner && (
            <div className="px-4 py-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg flex items-center justify-between text-xs text-[#166534] shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                <span>
                  <strong className="font-bold">“各街镇人口结构趋势分析”</strong>已具备继续条件。
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (onResumeAnalysisTask) {
                      onResumeAnalysisTask('各街镇人口结构趋势分析', 'full');
                    }
                    addToast?.('success', '继续工作', '已载入「各街镇人口结构趋势分析」并恢复工作流');
                  }}
                  className="px-2.5 py-1 bg-[#16A36A] hover:bg-[#15803D] text-white text-[11px] font-bold rounded shadow-2xs transition-colors cursor-pointer"
                >
                  继续分析
                </button>
                <button
                  onClick={() => setShowTopReadyBanner(false)}
                  className="text-[#166534] hover:text-[#14532D] cursor-pointer"
                  title="关闭提醒"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 顶部状态 Tabs (基于 Task Readiness 业务任务状态维度)         */}
          {/* ======================================================= */}
          <div className="flex items-center space-x-1 border-b border-[#E6EAF0] text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'border-[#2563EB] text-[#2563EB] font-bold'
                  : 'border-transparent text-[#667085] hover:text-[#172033]'
              }`}
            >
              全部 ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('WAITING')}
              className={`px-4 py-2.5 font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'WAITING'
                  ? 'border-[#2563EB] text-[#2563EB] font-bold'
                  : 'border-transparent text-[#667085] hover:text-[#172033]'
              }`}
            >
              处理中 ({submissions.filter((s) => s.taskReadiness === 'WAITING').length})
            </button>
            <button
              onClick={() => setActiveTab('READY')}
              className={`px-4 py-2.5 font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'READY'
                  ? 'border-[#2563EB] text-[#2563EB] font-bold'
                  : 'border-transparent text-[#667085] hover:text-[#172033]'
              }`}
            >
              可继续 ({submissions.filter((s) => s.taskReadiness === 'READY').length})
            </button>
            <button
              onClick={() => setActiveTab('DEGRADED')}
              className={`px-4 py-2.5 font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'DEGRADED'
                  ? 'border-[#2563EB] text-[#2563EB] font-bold'
                  : 'border-transparent text-[#667085] hover:text-[#172033]'
              }`}
            >
              受限可用 ({submissions.filter((s) => s.taskReadiness === 'DEGRADED').length})
            </button>
            <button
              onClick={() => setActiveTab('BLOCKED')}
              className={`px-4 py-2.5 font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'BLOCKED'
                  ? 'border-[#2563EB] text-[#2563EB] font-bold'
                  : 'border-transparent text-[#667085] hover:text-[#172033]'
              }`}
            >
              无法继续 ({submissions.filter((s) => s.taskReadiness === 'BLOCKED').length})
            </button>
          </div>

          {/* ======================================================= */}
          {/* 顶部搜索与过滤条 (轻量 Filter Bar)                         */}
          {/* ======================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索业务任务、资源名称或申请用途…"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] outline-hidden shadow-2xs"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-[#475569] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Filter 1: 申请时间 */}
              <div className="flex items-center space-x-1 text-[#667085]">
                <span>申请时间：</span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-white border border-[#D0D5DD] rounded px-2 py-1 text-xs text-[#172033] outline-hidden cursor-pointer font-medium"
                >
                  <option value="all">全部</option>
                  <option value="today">今天</option>
                  <option value="7days">近 7 天</option>
                  <option value="30days">近 30 天</option>
                </select>
              </div>

              {/* Filter 2: 来源 */}
              <div className="flex items-center space-x-1 text-[#667085]">
                <span>来源：</span>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="bg-white border border-[#D0D5DD] rounded px-2 py-1 text-xs text-[#172033] outline-hidden cursor-pointer font-medium"
                >
                  <option value="all">全部</option>
                  <option value="推荐数据方案">推荐数据方案</option>
                  <option value="目标搜数推荐">目标搜数推荐</option>
                  <option value="自主方案构建">自主方案构建</option>
                </select>
              </div>

              {/* Filter 3: 排序 */}
              <div className="flex items-center space-x-1 text-[#667085]">
                <span>排序：</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-white border border-[#D0D5DD] rounded px-2 py-1 text-xs text-[#172033] outline-hidden cursor-pointer font-medium"
                >
                  <option value="recent">最近更新</option>
                  <option value="submitted">提交时间</option>
                </select>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* 3. ACCESS SUBMISSION CARDS LIST                          */}
          {/* ======================================================= */}
          <div className="space-y-3.5 pt-1">
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((sub) => {
                const isExpanded = !!expandedSubmissions[sub.id];

                return (
                  <div
                    key={sub.id}
                    className="bg-white border border-[#E6EAF0] rounded-lg shadow-2xs overflow-hidden transition-all duration-150"
                  >
                    {/* Top Row: Task Title, Access Progress, Task Readiness & Actions */}
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                      
                      {/* Left Block: Business Task & Purpose */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
                            {sub.taskTitle}
                          </h2>
                          <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[10px] font-medium rounded">
                            {sub.typeTag}
                          </span>
                          <span className="text-[11px] text-[#94A3B8]">•</span>
                          <span className="text-[11px] text-[#64748B]">来源：{sub.source}</span>
                          <span className="text-[11px] text-[#94A3B8]">•</span>
                          <span className="text-[11px] text-[#94A3B8]">{sub.submittedTime}</span>
                        </div>

                        <p className="text-xs text-[#667085] leading-relaxed line-clamp-2">
                          {sub.purposeDescription}
                        </p>
                      </div>

                      {/* Middle Block: Access Progress & Task Readiness */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-6 shrink-0 lg:border-l lg:border-[#EEF2F6] lg:pl-5">
                        {/* 1. Access Progress (弱信息) */}
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-[#94A3B8]">访问进展</div>
                          <div className="text-xs font-semibold text-[#334155]">
                            {sub.accessProgress}
                          </div>
                        </div>

                        {/* 2. Task Readiness (主信息，强状态) */}
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-[#94A3B8]">当前任务</div>
                          {renderTaskReadinessBadge(sub.taskReadiness, sub.taskReadinessLabel)}
                        </div>
                      </div>

                      {/* Right Block: Primary Action & Secondary Toggle */}
                      <div className="flex items-center space-x-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#EEF2F6] justify-between lg:justify-end">
                        {/* Secondary Actions */}
                        {sub.secondaryActions.map((sec, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSecondaryAction(sub, sec.actionType)}
                            className="text-xs text-[#64748B] hover:text-[#2563EB] font-medium transition-colors cursor-pointer px-1 py-1"
                          >
                            {sec.label}
                          </button>
                        ))}

                        {/* Primary Action Button */}
                        <button
                          onClick={() => handlePrimaryAction(sub)}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-md shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer ${
                            sub.primaryAction.actionType === 'resume'
                              ? 'bg-[#16A36A] hover:bg-[#15803D] text-white'
                              : sub.primaryAction.actionType === 'resume_degraded'
                              ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                              : sub.primaryAction.actionType === 'adjust_plan'
                              ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                              : 'bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155]'
                          }`}
                        >
                          {(sub.primaryAction.actionType === 'resume' || sub.primaryAction.actionType === 'resume_degraded') && (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                          <span>{sub.primaryAction.label}</span>
                        </button>

                        {/* Expand / Collapse Button */}
                        <button
                          onClick={() => toggleSubmissionExpand(sub.id)}
                          className="p-1.5 hover:bg-[#F1F5F9] rounded text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer inline-flex items-center text-xs"
                          title={isExpanded ? '收起详情' : '展开详情'}
                        >
                          <span className="text-[11px] mr-0.5">{isExpanded ? '收起' : '详情'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Task Readiness Note Strip (轻量说明条) */}
                    <div className="px-4 sm:px-5 py-2 bg-[#F8FAFC] border-t border-[#EEF2F6] text-[11px] text-[#475569] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Info className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                        <span>{sub.taskReadinessNote}</span>
                      </div>
                      <span className="text-[#94A3B8] shrink-0 hidden sm:inline">
                        最近评估：{sub.updatedTime}
                      </span>
                    </div>

                    {/* =================================================== */}
                    {/* 展开区域：Compact Resource Requests List            */}
                    {/* =================================================== */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 border-t border-[#EEF2F6] bg-white space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
                          <span className="text-xs font-bold text-[#172033]">
                            包含的资源访问请求 ({sub.requests.length})
                          </span>
                          <span className="text-[11px] text-[#94A3B8]">
                            每项资源根据其独立数据安全策略分别授权
                          </span>
                        </div>

                        <div className="space-y-2">
                          {sub.requests.map((req) => (
                            <div
                              key={req.id}
                              className="p-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E6EAF0] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors text-xs"
                            >
                              {/* Left: Resource Name, Badges & Scope Summary */}
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-[#172033]">
                                    {req.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 bg-[#F1F5F9] text-[#64748B] text-[10px] font-mono rounded">
                                    {req.typeBadge}
                                  </span>
                                  <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-semibold rounded">
                                    {req.roleBadge}
                                  </span>
                                  <span className="text-[11px] text-[#94A3B8]">·</span>
                                  <span className="text-[11px] text-[#475569] font-medium">
                                    {req.operation}
                                  </span>
                                </div>

                                <div className="text-[11px] text-[#64748B] flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span>{req.scopeSummary}</span>
                                  <span className="text-[#CBD5E1]">|</span>
                                  <span>有效期：{req.validity}</span>
                                  {req.isAutoDecided && (
                                    <>
                                      <span className="text-[#CBD5E1]">|</span>
                                      <span className="text-[#15803D] font-medium">
                                        {req.autoDecideNote}
                                      </span>
                                    </>
                                  )}
                                  {req.processingNote && (
                                    <>
                                      <span className="text-[#CBD5E1]">|</span>
                                      <span className="text-[#D97706] font-medium">
                                        {req.processingNote}
                                      </span>
                                    </>
                                  )}
                                  {req.deniedNote && (
                                    <>
                                      <span className="text-[#CBD5E1]">|</span>
                                      <span className="text-[#DC2626] font-medium">
                                        {req.deniedNote}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Right: State & Actions */}
                              <div className="flex items-center space-x-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#EEF2F6]">
                                {/* Request State */}
                                <div className="w-24">
                                  {renderRequestStateBadge(req.accessState, req.stateLabel)}
                                </div>

                                {/* Suggested Action for Denied */}
                                {req.suggestedAction && (
                                  <button
                                    onClick={() => {
                                      if (onNavigateToSolution) {
                                        onNavigateToSolution(sub.taskTitle);
                                      }
                                      addToast?.('info', '按建议申请', '已将目标切换为「人口基本信息视图」在线查询');
                                    }}
                                    className="px-2 py-1 bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] font-bold text-[11px] rounded transition-colors cursor-pointer"
                                  >
                                    {req.suggestedAction.label}
                                  </button>
                                )}

                                {/* Action: 查看申请 (Open Drawer) */}
                                <button
                                  onClick={() =>
                                    setSelectedRequestDetail({
                                      submissionTitle: sub.taskTitle,
                                      request: req,
                                    })
                                  }
                                  className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-medium text-xs cursor-pointer"
                                >
                                  查看申请
                                </button>

                                {/* Action: 查看资源 */}
                                <button
                                  onClick={() => {
                                    if (onNavigateToResources) {
                                      onNavigateToResources();
                                    }
                                    addToast?.('info', '查看资源', `已跳转至「${req.name}」详情`);
                                  }}
                                  className="text-[#64748B] hover:text-[#172033] hover:underline font-medium text-xs cursor-pointer"
                                >
                                  查看资源
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              /* Empty State */
              <div className="p-12 bg-white border border-[#E6EAF0] rounded-lg text-center space-y-3.5">
                <FileCheck className="w-10 h-10 text-[#94A3B8] mx-auto stroke-[1.5]" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#172033]">
                    还没有符合条件的资源访问申请
                  </h3>
                  <p className="text-xs text-[#667085] max-w-md mx-auto leading-relaxed">
                    在资源详情或推荐数据方案中遇到需要访问权限的资源时，可以提交使用申请，并在这里跟踪处理进度与恢复业务分析。
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center space-x-3">
                  <button
                    onClick={onNavigateToResources}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md shadow-2xs transition-colors cursor-pointer"
                  >
                    去发现资源
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('all');
                      setSearchKeyword('');
                      setSourceFilter('all');
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    重置筛选条件
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 4. ACCESS REQUEST DETAIL DRAWER (查看申请详情)            */}
      {/* ========================================================= */}
      {selectedRequestDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#EEF2F6] flex items-center justify-between bg-[#F8FAFC]">
              <div className="space-y-1 min-w-0 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-mono rounded">
                    {selectedRequestDetail.request.typeBadge}
                  </span>
                  {renderRequestStateBadge(
                    selectedRequestDetail.request.accessState,
                    selectedRequestDetail.request.stateLabel
                  )}
                </div>
                <h3 className="text-base font-bold text-[#172033] truncate">
                  {selectedRequestDetail.request.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequestDetail(null)}
                className="p-1.5 text-[#64748B] hover:text-[#172033] hover:bg-[#EEF2F6] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Section 1: 申请基本信息 */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  申请基本信息
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">所属业务任务</span>
                    <span className="font-semibold text-[#172033]">
                      {selectedRequestDetail.submissionTitle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">访问能力</span>
                    <span className="font-semibold text-[#2563EB]">
                      {selectedRequestDetail.request.operation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">提交时间</span>
                    <span className="text-[#172033]">
                      {selectedRequestDetail.request.detail.submittedAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: 最终授权范围 */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  最终授权范围
                </div>
                <div className="p-3.5 bg-white border border-[#E6EAF0] rounded-md space-y-3">
                  {/* Region */}
                  <div>
                    <div className="text-[11px] text-[#64748B]">生效区域</div>
                    <div className="font-semibold text-[#172033] mt-0.5">
                      {selectedRequestDetail.request.detail.region}
                    </div>
                  </div>

                  {/* Allowed Fields */}
                  <div>
                    <div className="text-[11px] text-[#64748B] mb-1">允许访问信息</div>
                    {selectedRequestDetail.request.detail.allowedFields.length > 0 ? (
                      <div className="space-y-1">
                        {selectedRequestDetail.request.detail.allowedFields.map((f, i) => (
                          <div key={i} className="flex items-center space-x-1.5 text-[#172033]">
                            <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#94A3B8]">无已生效字段</span>
                    )}
                  </div>

                  {/* Data Protection Rules */}
                  <div>
                    <div className="text-[11px] text-[#64748B] mb-1">数据保护配置</div>
                    <div className="space-y-1">
                      {selectedRequestDetail.request.detail.protectionRules.map((rule, i) => (
                        <div key={i} className="flex items-center space-x-1.5 text-[#475569]">
                          <Shield className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usage Restrictions & Validity */}
                  <div className="pt-2 border-t border-[#EEF2F6] flex justify-between text-[11px]">
                    <div>
                      <span className="text-[#64748B]">使用限制：</span>
                      <span className="text-[#172033] font-medium">
                        {selectedRequestDetail.request.detail.restrictions}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">有效期：</span>
                      <span className="text-[#172033] font-medium">
                        {selectedRequestDetail.request.validity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: 决策结果与说明 */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  决策结果与说明
                </div>
                <div className="p-3.5 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">处理方式</span>
                    <span className="font-semibold text-[#172033]">
                      {selectedRequestDetail.request.detail.decisionMethod}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#64748B] mb-0.5">决策说明</div>
                    <p className="text-[#334155] leading-relaxed">
                      {selectedRequestDetail.request.detail.decisionReason}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EEF2F6] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setSelectedRequestDetail(null)}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-md hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. DEGRADED LIMITATIONS DRAWER (查看限制详情)               */}
      {/* ========================================================= */}
      {selectedDegradedLimits && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#EEF2F6] flex items-center justify-between bg-[#FFFBEB]">
              <div className="space-y-1 min-w-0 pr-3">
                <div className="flex items-center space-x-1.5 text-[#B45309] text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                  <span>受限可用 · 范围收敛说明</span>
                </div>
                <h3 className="text-base font-bold text-[#172033] truncate">
                  {selectedDegradedLimits.submissionTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDegradedLimits(null)}
                className="p-1.5 text-[#64748B] hover:text-[#172033] hover:bg-[#FEF3C7] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Section 1: 当前仍可完成 */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                  <span>当前仍可完成的分析能力</span>
                </div>
                <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-md space-y-1.5">
                  {selectedDegradedLimits.limitations.canDo.map((item, i) => (
                    <div key={i} className="flex items-center space-x-2 text-[#166534] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: 当前受限 */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#B45309] uppercase tracking-wider flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>当前受限或屏蔽的范围</span>
                </div>
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-1.5">
                  {selectedDegradedLimits.limitations.restricted.map((item, i) => (
                    <div key={i} className="flex items-center space-x-2 text-[#92400E] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: 收敛原因 */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  策略收敛原因
                </div>
                <div className="p-3.5 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md">
                  <p className="text-[#334155] leading-relaxed">
                    {selectedDegradedLimits.limitations.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EEF2F6] bg-[#F8FAFC] flex justify-end space-x-2">
              <button
                onClick={() => setSelectedDegradedLimits(null)}
                className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded hover:bg-[#F1F5F9] cursor-pointer"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setSelectedDegradedLimits(null);
                  if (onResumeAnalysisTask) {
                    onResumeAnalysisTask(selectedDegradedLimits.submissionTitle, 'degraded');
                  }
                  addToast?.('info', '继续受限分析', `已在受限模式下载入「${selectedDegradedLimits.submissionTitle}」`);
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded cursor-pointer shadow-2xs flex items-center space-x-1"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>继续受限分析</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
