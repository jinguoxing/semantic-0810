import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Shield,
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
  ChevronDown,
  ShieldQuestion,
  RefreshCw,
  FolderTree,
  Calendar,
  MapPin,
  Filter
} from 'lucide-react';

export interface AccessReviewDetailWorkspaceProps {
  requestId?: string;
  onBackToQueue?: () => void;
  onNavigateToAuthorizationRecords?: () => void;
  onNavigateToPolicyManagement?: () => void;
  onNavigateToAuditLogs?: () => void;
  onDecisionComplete?: (decisionType: 'ALLOW_WITH_LIMITS' | 'ALLOW_CUSTOM_LIMITS' | 'DENY', requestName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AccessReviewDetailWorkspace: React.FC<AccessReviewDetailWorkspaceProps> = ({
  requestId = 'rev-001',
  onBackToQueue,
  onNavigateToAuthorizationRecords,
  onNavigateToPolicyManagement,
  onNavigateToAuditLogs,
  onDecisionComplete,
  addToast
}) => {
  // Sidebar navigation within Admin Center
  const [activeAdminNav, setActiveAdminNav] = useState<'users' | 'review_queue' | 'auth_records' | 'policies' | 'audit_logs'>('review_queue');

  // Limited Adjustment States (Reviewer Decides, Not Configures)
  const [durationOption, setDurationOption] = useState<string>('90_days');
  const [dataScopeOption, setDataScopeOption] = useState<string>('minhang');
  const [protectionPolicyOption, setProtectionPolicyOption] = useState<string>('std_pop_analysis');
  const [isFieldScopeExpanded, setIsFieldScopeExpanded] = useState<boolean>(true);

  // Modals for Decision Actions
  const [isCustomGrantModalOpen, setIsCustomGrantModalOpen] = useState<boolean>(false);
  const [isDenyModalOpen, setIsDenyModalOpen] = useState<boolean>(false);
  const [denyReasonCategory, setDenyReasonCategory] = useState<string>('scope_exceeds');
  const [denyNotes, setDenyNotes] = useState<string>('');

  // Execution Handler: 按建议授权
  const handleApproveRecommended = () => {
    addToast?.(
      'success',
      '当前资源访问决策已完成',
      '已生成有效授权凭证（Effective Grant：90天受限查询 · 姓名脱敏 · 排除身份证及手机号）。系统已将决策结果回传原申请任务「街镇老龄化与养老资源分析」重新校验就绪状态。'
    );
    onDecisionComplete?.('ALLOW_WITH_LIMITS', '人口基本信息视图');
    onBackToQueue?.();
  };

  // Execution Handler: 调整限制并授权
  const handleConfirmCustomGrant = () => {
    setIsCustomGrantModalOpen(false);
    const durationLabel = durationOption === '30_days' ? '30天' : durationOption === '90_days' ? '90天' : '180天';
    const scopeLabel = dataScopeOption === 'minhang' ? '闵行区' : dataScopeOption === 'pudong' ? '浦东新区' : '全市辖区';
    
    addToast?.(
      'success',
      '当前资源访问决策已完成（自定义限制）',
      `已按调整条件生成授权：${durationLabel} · ${scopeLabel} · 人口分析标准保护策略。原任务就绪状态已同步刷新。`
    );
    onDecisionComplete?.('ALLOW_CUSTOM_LIMITS', '人口基本信息视图');
    onBackToQueue?.();
  };

  // Execution Handler: 不授权
  const handleConfirmDeny = () => {
    setIsDenyModalOpen(false);
    const reasonText = 
      denyReasonCategory === 'scope_exceeds' ? '申请范围超出当前分析任务所需' :
      denyReasonCategory === 'policy_mismatch' ? '不符合该涉密资源安全管理使用政策' :
      denyReasonCategory === 'high_risk' ? '高风险未满足必要安全隔离条件' : '组织职能范围不匹配';

    addToast?.(
      'info',
      '已拒绝本次资源访问请求',
      `已裁决不予授权。原因：${reasonText}。已通知申请人张明（人口分析部门）根据建议调整后重新申请。`
    );
    onDecisionComplete?.('DENY', '人口基本信息视图');
    onBackToQueue?.();
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
          {/* Group 1: 组织与架构 */}
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

          {/* Group 2: 权限管理 */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-[#98A2B3] tracking-wider uppercase flex items-center justify-between">
              <span>权限管理</span>
              <span className="text-[9px] px-1 py-0.2 bg-[#EEF2FF] text-[#4F46E5] rounded font-mono font-bold">
                POLICY
              </span>
            </div>

            {/* 访问审核 (Active) */}
            <button
              onClick={() => {
                setActiveAdminNav('review_queue');
                onBackToQueue?.();
              }}
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
                12
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
      {/* 2. MAIN DECISION WORKSPACE (68%) + CONTEXT RAIL (32%)     */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC]">
        
        {/* Scrollable Center Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            
            {/* Top Navigation Back & Breadcrumb */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={onBackToQueue}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回访问审核列表</span>
                </button>

                <div className="flex items-center space-x-2 text-xs text-[#98A2B3]">
                  <span>管理中心</span>
                  <span>/</span>
                  <span>权限管理</span>
                  <span>/</span>
                  <span className="text-[#475569] font-medium">访问审核</span>
                </div>
              </div>

              {/* Page Title: 人口基本信息视图 · 访问申请 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                      人口基本信息视图 · 访问申请
                    </h1>
                    <span className="px-2 py-0.5 rounded bg-[#FEF3F2] text-[#D92D20] text-xs font-bold border border-[#FECDCA] flex items-center space-x-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>需人工决策</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] pt-1 leading-relaxed">
                    张明申请为“街镇老龄化与养老资源分析”查询人口基本信息视图，当前需要人工确认最终访问范围。
                  </p>
                </div>
              </div>
            </div>

            {/* Context Strip: 所属申请 Context */}
            <div className="bg-white border border-[#E6EAF0] rounded-md p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[#98A2B3]">所属申请:</span>
                  <span className="font-bold text-[#172033]">街镇老龄化与养老资源分析</span>
                </div>
                <div className="flex items-center space-x-2 border-l border-[#EEF2F6] pl-6">
                  <span className="text-[#98A2B3]">本次申请情况:</span>
                  <span className="text-[#475569]">共 2 项访问需求，当前正在审核其中 1 项</span>
                </div>
                <div className="flex items-center space-x-1.5 border-l border-[#EEF2F6] pl-6 text-[#16A36A] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>另 1 项已自动处理</span>
                </div>
              </div>

              <div className="text-[11px] text-[#667085]">
                请求编号: <span className="font-mono text-[#475569]">REQ-20260817-091</span>
              </div>
            </div>

            {/* Main Decision Layout (Grid: 68% Main + 32% Right Rail) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ========================================================= */}
              {/* LEFT COLUMN: Main Decision Content (8 Cols / ~67-68%)     */}
              {/* ========================================================= */}
              <div className="lg:col-span-8 space-y-5">
                
                {/* 1. 顶部决策摘要 (Facts Strip) */}
                <div className="bg-white border border-[#E6EAF0] rounded-md p-4 shadow-2xs space-y-3">
                  <p className="text-xs text-[#172033] font-medium leading-relaxed">
                    张明希望在未来 3 个月内，为街镇老龄化与养老资源分析查询人口年龄、常住状态和行政区域信息。
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-[#EEF2F6] text-xs">
                    <div>
                      <div className="text-[11px] text-[#98A2B3]">申请人</div>
                      <div className="font-bold text-[#172033] pt-0.5">张明</div>
                      <div className="text-[10px] text-[#667085]">人口分析部门</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#98A2B3]">申请动作</div>
                      <div className="font-bold text-[#2563EB] pt-0.5">查询数据</div>
                      <div className="text-[10px] text-[#667085]">在线交互查询</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#98A2B3]">使用期限</div>
                      <div className="font-bold text-[#172033] pt-0.5">3 个月</div>
                      <div className="text-[10px] text-[#667085]">至 2026-11-15</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#98A2B3]">提交时间</div>
                      <div className="font-bold text-[#172033] pt-0.5">今天 10:36</div>
                      <div className="text-[10px] text-[#667085]">12 分钟前</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#98A2B3]">来源</div>
                      <div className="font-bold text-[#4F46E5] pt-0.5">推荐数据方案</div>
                      <div className="text-[10px] text-[#667085]">超市智能组装</div>
                    </div>
                  </div>
                </div>

                {/* 2. 访问目的 (Purpose & Needs) */}
                <div className="bg-white border border-[#E6EAF0] rounded-md p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-[#172033] tracking-wide">
                      访问目的
                    </h2>
                    <button
                      onClick={() => addToast?.('info', '原数据方案', '查看《街镇老龄化与养老资源分析》初始组装的 2 项资源协同方案')}
                      className="text-[11px] text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>查看原数据方案</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed">
                    分析各街镇人口老龄化程度及人口结构差异，为后续老龄人口分布与养老资源覆盖分析提供基础人口数据。
                  </p>

                  <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded text-xs space-y-1.5">
                    <div className="font-semibold text-[#334155] text-[11px]">当前任务需要：</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[#334155]">
                        • 年龄与出生信息
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[#334155]">
                        • 常住状态
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[#334155]">
                        • 行政区域
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. 建议授权方案 (Recommended Decision - Core Block) */}
                <div className="bg-white border-2 border-[#BFDBFE] rounded-md p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                      <h2 className="text-xs font-bold text-[#172033] tracking-wide">
                        建议授权方案
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold rounded border border-[#BFDBFE]">
                      系统建议
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-base font-bold text-[#1E40AF]">
                      附带限制授权
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      允许张明在完成当前分析所需的最小范围内查询人口基本信息视图，同时排除与当前任务无关的敏感身份与联系方式信息。
                    </p>
                  </div>

                  {/* Clean Definition Rows */}
                  <div className="border-t border-[#EEF2F6] pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#98A2B3]">数据范围</div>
                      <div className="font-semibold text-[#172033]">闵行区</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-[#98A2B3]">建议有效期</div>
                      <div className="font-semibold text-[#172033]">90 天</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-[#98A2B3]">允许访问</div>
                      <div className="text-[#334155]">
                        年龄与出生信息、常住状态、行政区域
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-[#98A2B3]">建议数据保护</div>
                      <div className="text-[#334155] font-medium">
                        姓名：<span className="text-[#D97706]">脱敏</span> · 身份证号：<span className="text-[#D92D20]">不包含</span> · 手机号：<span className="text-[#D92D20]">不包含</span>
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1 bg-[#F8FAFC] p-2.5 rounded border border-[#EEF2F6]">
                      <div className="text-[11px] text-[#98A2B3]">使用限制</div>
                      <div className="text-[#334155] flex flex-wrap gap-x-4 gap-y-1">
                        <span>• 仅允许在线查询</span>
                        <span>• 不允许数据导出</span>
                        <span>• 本次访问纳入审计</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. 推荐依据 (Why Propose This Scope) */}
                <div className="bg-white border border-[#E6EAF0] rounded-md p-5 shadow-2xs space-y-3">
                  <h2 className="text-xs font-bold text-[#172033] tracking-wide">
                    推荐依据
                  </h2>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#EEF2F6]">
                      <div className="flex items-start space-x-2 text-[#334155]">
                        <Check className="w-3.5 h-3.5 text-[#16A36A] shrink-0 mt-0.5" />
                        <span>当前分析需要年龄、常住状态与行政区域信息</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 bg-white text-[#667085] rounded border border-[#E2E8F0] font-mono">
                        任务需求
                      </span>
                    </div>

                    <div className="flex items-start justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#EEF2F6]">
                      <div className="flex items-start space-x-2 text-[#334155]">
                        <Check className="w-3.5 h-3.5 text-[#16A36A] shrink-0 mt-0.5" />
                        <span>姓名不是完成当前统计分析的必要信息，故进行列级脱敏</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 bg-white text-[#667085] rounded border border-[#E2E8F0] font-mono">
                        敏感字段策略
                      </span>
                    </div>

                    <div className="flex items-start justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#EEF2F6]">
                      <div className="flex items-start space-x-2 text-[#334155]">
                        <Check className="w-3.5 h-3.5 text-[#16A36A] shrink-0 mt-0.5" />
                        <span>身份证明信息与联系方式不属于当前任务范围，直接予以排除</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 bg-white text-[#667085] rounded border border-[#E2E8F0] font-mono">
                        敏感字段策略
                      </span>
                    </div>

                    <div className="flex items-start justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#EEF2F6]">
                      <div className="flex items-start space-x-2 text-[#334155]">
                        <Check className="w-3.5 h-3.5 text-[#16A36A] shrink-0 mt-0.5" />
                        <span>当前用途是聚合分析，不涉及导出使用，禁止离线下载权限</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 bg-white text-[#667085] rounded border border-[#E2E8F0] font-mono">
                        访问规则
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. 申请范围与详细字段范围 (Scope & Details Table) */}
                <div className="bg-white border border-[#E6EAF0] rounded-md p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-bold text-[#172033] tracking-wide">
                        申请范围与详细字段
                      </h2>
                      <p className="text-[11px] text-[#667085] pt-0.5">
                        资源：<span className="font-semibold text-[#172033]">人口基本信息视图</span> (DATA ASSET · VIEW)
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setIsFieldScopeExpanded(prev => !prev)}
                      className="text-xs text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer font-medium"
                    >
                      <span>{isFieldScopeExpanded ? '收起详细范围' : '查看详细字段范围'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFieldScopeExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded Field Protection Table */}
                  {isFieldScopeExpanded && (
                    <div className="border border-[#E6EAF0] rounded overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] text-[11px]">
                            <th className="py-2.5 px-4 font-semibold">业务信息</th>
                            <th className="py-2.5 px-4 font-semibold font-mono">技术字段</th>
                            <th className="py-2.5 px-4 font-semibold text-right">建议处理</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF2F6]">
                          <tr className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-4 font-medium text-[#172033]">年龄</td>
                            <td className="py-2.5 px-4 font-mono text-[#475569]">age</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A36A] font-bold text-[11px] border border-[#A7F3D0]">
                                允许
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-4 font-medium text-[#172033]">出生日期</td>
                            <td className="py-2.5 px-4 font-mono text-[#475569]">birth_date</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A36A] font-bold text-[11px] border border-[#A7F3D0]">
                                允许
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-4 font-medium text-[#172033]">常住状态</td>
                            <td className="py-2.5 px-4 font-mono text-[#475569]">resident_status</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A36A] font-bold text-[11px] border border-[#A7F3D0]">
                                允许
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-4 font-medium text-[#172033]">行政区域</td>
                            <td className="py-2.5 px-4 font-mono text-[#475569]">region_code</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A36A] font-bold text-[11px] border border-[#A7F3D0]">
                                允许
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-4 font-medium text-[#172033]">姓名</td>
                            <td className="py-2.5 px-4 font-mono text-[#475569]">person_name</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] font-bold text-[11px] border border-[#FDE68A]">
                                脱敏 (掩码)
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-4 font-medium text-[#64748B]">身份证号</td>
                            <td className="py-2.5 px-4 font-mono text-[#94A3B8]">id_card_no</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded bg-[#FEF3F2] text-[#D92D20] font-bold text-[11px] border border-[#FECDCA]">
                                不允许 (排除)
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-4 font-medium text-[#64748B]">手机号</td>
                            <td className="py-2.5 px-4 font-mono text-[#94A3B8]">mobile_phone</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded bg-[#FEF3F2] text-[#D92D20] font-bold text-[11px] border border-[#FECDCA]">
                                不允许 (排除)
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 6. 有限调整区 (Reviewer Decides, Not Configures) */}
                <div className="bg-white border border-[#E6EAF0] rounded-md p-5 shadow-2xs space-y-4">
                  <div>
                    <h2 className="text-xs font-bold text-[#172033] tracking-wide flex items-center space-x-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>授权限制调整（可选）</span>
                    </h2>
                    <p className="text-[11px] text-[#667085] pt-0.5">
                      如有必要，可在既有安全策略允许的范围内调整本次授权条件。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    {/* 有效期限 Select */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#334155] flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#64748B]" />
                        <span>有效期限</span>
                      </label>
                      <div className="relative">
                        <select
                          value={durationOption}
                          onChange={(e) => setDurationOption(e.target.value)}
                          className="w-full appearance-none bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#172033] text-xs rounded pl-3 pr-8 py-2 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        >
                          <option value="30_days">30 天 (快速试用与临时任务)</option>
                          <option value="90_days">90 天 (推荐 · 标准季度分析)</option>
                          <option value="180_days">180 天 (半年度专项研究)</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {/* 数据范围 Select */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#334155] flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-[#64748B]" />
                        <span>数据范围 (行级过滤)</span>
                      </label>
                      <div className="relative">
                        <select
                          value={dataScopeOption}
                          onChange={(e) => setDataScopeOption(e.target.value)}
                          className="w-full appearance-none bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#172033] text-xs rounded pl-3 pr-8 py-2 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        >
                          <option value="minhang">闵行区辖区 (当前任务推荐)</option>
                          <option value="pudong">浦东新区辖区</option>
                          <option value="all_city">全市所有行政辖区</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {/* 数据保护策略 Select */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#334155] flex items-center space-x-1">
                        <Shield className="w-3 h-3 text-[#64748B]" />
                        <span>数据保护策略模版</span>
                      </label>
                      <div className="relative">
                        <select
                          value={protectionPolicyOption}
                          onChange={(e) => setProtectionPolicyOption(e.target.value)}
                          className="w-full appearance-none bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#172033] text-xs rounded pl-3 pr-8 py-2 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        >
                          <option value="std_pop_analysis">人口分析标准保护策略 (姓名掩码/排除证件)</option>
                          <option value="strict_anonymized">深度匿名化策略 (K-匿名/区划泛化)</option>
                          <option value="audit_only">受限审计直通策略 (仅限在管终端)</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {/* 导出权限 (只读受控状态) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#334155] flex items-center space-x-1">
                        <Download className="w-3 h-3 text-[#64748B]" />
                        <span>数据导出权限</span>
                      </label>
                      <div className="w-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] text-xs rounded px-3 py-2 font-medium flex items-center justify-between">
                        <span>不允许导出 (受控只读状态)</span>
                        <Lock className="w-3 h-3 text-[#94A3B8]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ========================================================= */}
              {/* RIGHT COLUMN: Context Rail - 决策依据 (4 Cols / ~32%)    */}
              {/* ========================================================= */}
              <div className="lg:col-span-4 space-y-4">
                
                <div className="bg-white border border-[#E6EAF0] rounded-md p-4 shadow-2xs space-y-4">
                  <div className="border-b border-[#EEF2F6] pb-3">
                    <h2 className="text-xs font-bold text-[#172033] tracking-wide">
                      决策依据
                    </h2>
                    <p className="text-[11px] text-[#667085] pt-0.5">
                      为什么本次请求必须进入人工决策
                    </p>
                  </div>

                  {/* 1. 为什么需要人工决策 */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#98A2B3]">触发原因</div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-[#FEF3F2] text-[#D92D20] font-bold text-[11px] border border-[#FECDCA]">
                        包含受限身份信息
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] leading-relaxed pt-0.5">
                      当前资源包含受保护个人信息，超出普通自动授权边界，需要人工确认最终可访问范围与脱敏方案。
                    </p>
                  </div>

                  {/* 2. 当前安全策略 */}
                  <div className="space-y-1 pt-3 border-t border-[#EEF2F6]">
                    <div className="text-[11px] font-semibold text-[#98A2B3]">当前匹配策略</div>
                    <div className="font-bold text-xs text-[#172033]">
                      允许受控查询
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      普通人口分析可在最小必要范围与标准保护条件下授权。
                    </p>
                  </div>

                  {/* 3. 风险上下文 */}
                  <div className="space-y-1 pt-3 border-t border-[#EEF2F6]">
                    <div className="text-[11px] font-semibold text-[#98A2B3]">风险上下文</div>
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] font-bold text-[11px] border border-[#FDE68A]">
                        中等风险
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed pt-0.5">
                      涉及个人信息，但当前用途为聚合分析使用，且不申请数据导出。
                    </p>
                  </div>

                  {/* 4. 组织与归属信息 */}
                  <div className="pt-3 border-t border-[#EEF2F6] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#98A2B3] text-[11px]">申请组织</span>
                      <span className="font-semibold text-[#172033]">人口分析部门</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#98A2B3] text-[11px]">资源归属</span>
                      <span className="font-semibold text-[#172033]">人口业务治理团队</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#98A2B3] text-[11px]">当前已有授权</span>
                      <span className="text-[#64748B]">无正式查询授权</span>
                    </div>
                    <div className="text-[10px] text-[#98A2B3] pt-0.5">
                      已具备资源发现权限，无真实数据查询授权。
                    </div>
                  </div>

                  {/* 5. 历史访问情况 */}
                  <div className="pt-3 border-t border-[#EEF2F6] space-y-1 text-xs">
                    <div className="text-[11px] font-semibold text-[#98A2B3]">历史访问记录</div>
                    <div className="text-[#475569] text-[11px]">
                      申请人张明在最近 90 天内无该资源正式访问授权记录。
                    </div>
                  </div>
                </div>

                {/* Xino Safety Co-pilot Card */}
                <div className="bg-[#FAFCFF] border border-[#BFDBFE] rounded-md p-3.5 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-[#2563EB] font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Xino 合规校验摘要</span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    若采用建议授权（姓名脱敏 + 排除高危列），该请求完全满足《个人信息最小化采集与统计分析合规规范 V3.2》。
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. STICKY BOTTOM DECISION BAR (Decisions & Commit)        */}
        {/* ========================================================= */}
        <div className="bg-white border-t border-[#E6EAF0] p-4 px-6 lg:px-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 select-none z-20">
          <div className="text-xs text-[#667085] flex items-center space-x-2">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>当前决策将生成该资源请求的最终访问结果，并在授权生效前再次进行策略校验。</span>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Action 1: 不授权 (Danger Outline) */}
            <button
              onClick={() => setIsDenyModalOpen(true)}
              className="px-4 py-2 bg-white border border-[#FECDCA] text-[#D92D20] hover:bg-[#FEF3F2] text-xs font-bold rounded transition-colors cursor-pointer"
            >
              不授权
            </button>

            {/* Action 2: 调整限制并授权 (Secondary) */}
            <button
              onClick={() => setIsCustomGrantModalOpen(true)}
              className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#172033] hover:bg-[#F8FAFC] text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs"
            >
              调整限制并授权
            </button>

            {/* Action 3: 按建议授权 (Primary Semovix Blue) */}
            <button
              onClick={handleApproveRecommended}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>按建议授权</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 4. MODAL: 确认调整限制并授权                               */}
      {/* ========================================================= */}
      {isCustomGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E6EAF0] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172033]">
                  确认调整限制并授权？
                </h3>
                <p className="text-xs text-[#667085]">
                  生成生效授权凭证并返回原业务申请
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#EEF2F6] rounded text-xs space-y-2">
              <div className="font-semibold text-[#172033]">本次授权条件摘要：</div>
              <div className="text-[#475569] space-y-1">
                <div>• 资源：人口基本信息视图 (查询数据)</div>
                <div>• 数据范围：{dataScopeOption === 'minhang' ? '闵行区' : dataScopeOption === 'pudong' ? '浦东新区' : '全市辖区'}</div>
                <div>• 有效期限：{durationOption === '30_days' ? '30天' : durationOption === '90_days' ? '90天' : '180天'}</div>
                <div>• 数据保护：人口分析标准保护策略 (姓名掩码/排除身份证手机号)</div>
                <div>• 导出控制：禁止导出</div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsCustomGrantModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] rounded cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCustomGrant}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded cursor-pointer shadow-2xs"
              >
                确认授权
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: 不授权当前访问请求                                */}
      {/* ========================================================= */}
      {isDenyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E6EAF0] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-center text-[#D92D20]">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172033]">
                  不授权当前访问请求
                </h3>
                <p className="text-xs text-[#667085]">
                  裁决不予授权，将回传结果并建议申请人调整
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#334155]">请选择结构化不授权原因：</label>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-[#F8FAFC] rounded border border-[#EEF2F6] hover:bg-[#F1F5F9]">
                    <input
                      type="radio"
                      name="denyReason"
                      value="scope_exceeds"
                      checked={denyReasonCategory === 'scope_exceeds'}
                      onChange={() => setDenyReasonCategory('scope_exceeds')}
                      className="text-[#2563EB]"
                    />
                    <span className="text-[#172033] font-medium">申请范围超过任务所需</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-[#F8FAFC] rounded border border-[#EEF2F6] hover:bg-[#F1F5F9]">
                    <input
                      type="radio"
                      name="denyReason"
                      value="policy_mismatch"
                      checked={denyReasonCategory === 'policy_mismatch'}
                      onChange={() => setDenyReasonCategory('policy_mismatch')}
                      className="text-[#2563EB]"
                    />
                    <span className="text-[#172033] font-medium">不符合资源使用政策与合规准则</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-[#F8FAFC] rounded border border-[#EEF2F6] hover:bg-[#F1F5F9]">
                    <input
                      type="radio"
                      name="denyReason"
                      value="high_risk"
                      checked={denyReasonCategory === 'high_risk'}
                      onChange={() => setDenyReasonCategory('high_risk')}
                      className="text-[#2563EB]"
                    />
                    <span className="text-[#172033] font-medium">高风险操作未满足必要安全条件</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-[#F8FAFC] rounded border border-[#EEF2F6] hover:bg-[#F1F5F9]">
                    <input
                      type="radio"
                      name="denyReason"
                      value="org_mismatch"
                      checked={denyReasonCategory === 'org_mismatch'}
                      onChange={() => setDenyReasonCategory('org_mismatch')}
                      className="text-[#2563EB]"
                    />
                    <span className="text-[#172033] font-medium">申请部门职责范围不符合</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#64748B]">补充说明（可选）：</label>
                <textarea
                  value={denyNotes}
                  onChange={(e) => setDenyNotes(e.target.value)}
                  placeholder="如有必要，可说明原因或建议申请人按更小范围重新申请…"
                  rows={2}
                  className="w-full text-xs p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsDenyModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] rounded cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDeny}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#D92D20] hover:bg-[#B42318] rounded cursor-pointer shadow-2xs"
              >
                确认不授权
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
