import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Search,
  RefreshCw,
  Info,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Cpu,
  CheckCircle2,
  FileText,
  Clock,
  Shield,
  BookOpen,
  BarChart3,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeft,
  X,
  ExternalLink,
  Zap,
  ArrowRight,
  GitBranch,
  Settings,
  History,
  Workflow
} from 'lucide-react';
import {
  AgentItem,
  INITIAL_AGENTS,
  AgentDefinitionDetail,
  AgentProductStatusKey,
  AgentRuntimeSignals,
  createAgentDraft,
  getAgentOriginLabel,
  getAgentProductStatus
} from '../data/agentRegistryData';
import { agentService, agentSelectors } from '../domain/agent';
import { getTaskTemplateView } from '../domain/agent/agentTypes';
import { CreateAgentDrawer } from './CreateAgentDrawer';
import type { AgentPublishSectionKey } from './AgentPublishWorkspace';

interface AgentRegistryWorkspaceProps {
  agents?: AgentItem[];
  onAgentsChange?: (agents: AgentItem[]) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToHome?: () => void;
  onNavigateToGovernance?: () => void;
  onNavigateToMetrics?: () => void;
  onNavigateToMarketplace?: () => void;
  onOpenAgentDefinition?: (agent: AgentItem, definition?: AgentDefinitionDetail) => void;
  /**
   * 前往发布验证工作区 (A04 是唯一发布入口，Registry 不再本地发布)。
   * opts.initialSection 用于直达分区（§15：A01「版本记录」→ release_history）；
   * 缺省进入 release_overview。
   */
  onOpenPublishWorkspace?: (agent: AgentItem, opts?: { initialSection?: AgentPublishSectionKey }) => void;
  initialOpenCreateDrawer?: boolean;
}

export const AgentRegistryWorkspace: React.FC<AgentRegistryWorkspaceProps> = ({
  agents: agentsProp,
  onAgentsChange,
  addToast,
  onNavigateToHome,
  onNavigateToGovernance,
  onNavigateToMetrics,
  onNavigateToMarketplace,
  onOpenAgentDefinition,
  onOpenPublishWorkspace,
  initialOpenCreateDrawer = false
}) => {
  // Navigation State（Implementation Freeze §2：删除「能力与技能」假入口，
  // V1.1 左侧只保留「智能体」一级导航）
  const [activeLeftNav, setActiveLeftNav] = useState<'agents'>('agents');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  // V1.1: 用户分类 = origin (内置 / 自定义)，不再依据 agentKind / category
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUILT_IN' | 'CUSTOM'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AgentProductStatusKey>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Drawers & Modals
  const [selectedAgentForDetail, setSelectedAgentForDetail] = useState<AgentItem | null>(null);
  const [selectedDraftAgent, setSelectedDraftAgent] = useState<AgentItem | null>(null);
  const [isDraftDrawerOpen, setIsDraftDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState<boolean>(initialOpenCreateDrawer);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [hoveredExtraTasksAgentId, setHoveredExtraTasksAgentId] = useState<string | null>(null);

  // Agent list state (controlled from App.tsx or local fallback)
  const [internalAgents, setInternalAgents] = useState<AgentItem[]>(INITIAL_AGENTS);
  const agents = agentsProp || internalAgents;
  const setAgents = (updater: AgentItem[] | ((prev: AgentItem[]) => AgentItem[])) => {
    if (onAgentsChange) {
      const next = typeof updater === 'function' ? updater(agents) : updater;
      onAgentsChange(next);
    } else {
      setInternalAgents(updater);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Domain-backed Projection（Implementation Freeze §4）：
  // A01 业务事实（name / responsibility / owner / 支持任务 / formalVersion /
  // hasDraft / 发布时间 / 状态 / 产品状态信号）一律从 Agent Domain selector
  // 实时读取覆盖——INITIAL_AGENTS / AgentItem Fixture 仅保留 avatarType 等
  // 纯视觉信息与 Domain 缺失时的兜底，不再是这些字段的第二套 SoT。
  // 每次渲染直接投影（不 memo）：A03 保存草稿后返回 A01 立即与 Domain 一致。
  // ─────────────────────────────────────────────────────────────
  const displayAgents: AgentItem[] = [];
  // Domain Active Binding 运行信号（Commit 08 TASK 21）：只用于产品状态推导，
  // Registry 主 UI 不展示 syncStatus / healthStatus / integrationMode 原始 enum
  const runtimeSignalsById = new Map<string, AgentRuntimeSignals>();
  for (const agent of agents) {
    const domain = agentSelectors.getDisplayState(agent.id);
    if (domain) {
      runtimeSignalsById.set(agent.id, {
        activeBindingVersion: domain.activeBindingVersion,
        syncStatus: domain.syncStatus,
        healthStatus: domain.healthStatus
      });
    }
    const wsState = agentSelectors.getDefinitionWorkspaceState(agent.id);
    if (!domain || !wsState) {
      displayAgents.push(agent); // Domain 无定义：兜底展示 Fixture（不应发生）
      continue;
    }
    const enabledTaskNames = wsState.editable.supportedTaskTemplates
      .filter((t) => t.enabled)
      .map((t) => getTaskTemplateView(t.taskTemplateId).name);
    displayAgents.push({
      ...agent,
      name: domain.name,
      responsibility: domain.responsibility,
      owner: domain.owner,
      tasks: enabledTaskNames.slice(0, 2),
      allTasks: enabledTaskNames,
      formalVersion: domain.formalVersion,
      releaseTime: domain.lastReleaseTime || '尚未发布',
      status: domain.status,
      hasDraft: domain.hasDraft
    });
  }

  // Filtered List
  const filteredAgents = displayAgents.filter((agent) => {
      // Search: 名称 / 职责 / Owner / 支持任务 / 类型标签
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = agent.name.toLowerCase().includes(q);
        const matchResp = agent.responsibility.toLowerCase().includes(q);
        const matchOwner = agent.owner.toLowerCase().includes(q);
        const matchTask = agent.allTasks.some(t => t.toLowerCase().includes(q));
        const matchOrigin = getAgentOriginLabel(agent.origin).includes(q);
        if (!matchName && !matchResp && !matchOwner && !matchTask && !matchOrigin) return false;
      }

      // Type Filter (origin)
      if (typeFilter !== 'ALL') {
        if (agent.origin !== typeFilter) return false;
      }

      // Status Filter (产品状态投影)
      if (statusFilter !== 'ALL') {
        if (getAgentProductStatus(agent, runtimeSignalsById.get(agent.id)).key !== statusFilter) {
          return false;
        }
      }

      return true;
    });

  // §11：列表事实由 Domain 投影实时读取，刷新只是重读当前状态——
  // 不宣称「已同步 / 已更新至最新」，Toast 只说明页面状态已刷新
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast?.('info', '页面状态已刷新', '已重新读取当前智能体状态。');
    }, 450);
  };

  // 产品状态弱展示样式（V1.1 §7.4：不把 Runtime / Sync 技术状态作为 Registry 状态）
  const getProductStatusStyle = (key: AgentProductStatusKey): { dot: string; text: string } => {
    switch (key) {
      case 'NORMAL':
        return { dot: 'bg-[#16A36A]', text: 'text-[#16A36A]' };
      case 'UNPUBLISHED':
        return { dot: 'bg-amber-500', text: 'text-amber-700' };
      case 'PENDING_CHANGES':
        return { dot: 'bg-[#2563EB]', text: 'text-[#2563EB]' };
      case 'NEEDS_ATTENTION':
        return { dot: 'bg-orange-500', text: 'text-orange-600' };
      case 'DISABLED':
        return { dot: 'bg-slate-400', text: 'text-slate-500' };
    }
  };

  // Helper for agent avatar
  const renderAgentAvatar = (agent: AgentItem) => {
    switch (agent.avatarType) {
      case 'data':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
        );
      case 'governance':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'knowledge':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
      {/* ─────────────────────────────────────────────────────────────
          EIGHT. LEFT PRODUCT NAVIGATION (智能体中心侧边栏)
      ───────────────────────────────────────────────────────────── */}
      <aside
        className={`bg-white border-r border-[#E2E8F0] flex flex-col justify-between transition-all duration-200 select-none shrink-0 ${
          isSidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
        }`}
      >
        {/* Top Product Nav Items */}
        <div className="p-3">
          {/* Header Title */}
          {!isSidebarCollapsed ? (
            <div className="px-3 py-2 mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-sm text-[#0F172A] tracking-tight">
                  智能体中心
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] tracking-wide mt-0.5 block">
                Agent Registry
              </span>
            </div>
          ) : (
            <div className="flex justify-center py-2 mb-2">
              <Cpu className="w-5 h-5 text-[#2563EB]" />
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            {/* Primary Entry: 智能体 (High-Priority Current Highlight) */}
            <button
              onClick={() => setActiveLeftNav('agents')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer text-xs font-semibold ${
                isSidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2.5'
              } ${
                activeLeftNav === 'agents'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
              title="智能体"
            >
              <Bot className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>智能体</span>}
            </button>
          </div>
        </div>

        {/* Bottom Left Collapse Button */}
        <div className="p-3 border-t border-[#F1F5F9]">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-full flex items-center rounded-md p-2 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : 'space-x-2'
            }`}
            title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>收起</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          NINE. MAIN REGISTRY CONTENT AREA (主内容区)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0 bg-[#F8FAFC]">
        <div className="p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-4">
          {/* ─────────────────────────────────────────────────────────
              TEN. 页面标题区
          ───────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
                  智能体
                </h1>
                <span className="text-xs font-mono font-medium text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded">
                  Agent Registry
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                管理平台内置和组织自定义的智能体，查看它们的工作职责、支持任务与正式状态。
              </p>
            </div>

            {/* Main Action Button: 创建智能体 (Blue Primary Button) */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <button
                onClick={() => setIsCreateDrawerOpen(true)}
                className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>创建智能体</span>
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              ELEVEN. 搜索与筛选区
          ───────────────────────────────────────────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索智能体名称或职责"
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#0F172A] placeholder-[#94A3B8] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-[#475569]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {/* Type Filter (origin: 内置 / 自定义) */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'BUILT_IN' | 'CUSTOM')}
                  aria-label="筛选智能体类型"
                  className="appearance-none bg-[#F8FAFC] hover:bg-slate-100 text-xs font-medium text-[#334155] border border-[#E2E8F0] rounded-md pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="ALL">全部类型</option>
                  <option value="BUILT_IN">内置智能体</option>
                  <option value="CUSTOM">自定义智能体</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* Status Filter (产品状态投影) */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | AgentProductStatusKey)}
                  aria-label="筛选状态"
                  className="appearance-none bg-[#F8FAFC] hover:bg-slate-100 text-xs font-medium text-[#334155] border border-[#E2E8F0] rounded-md pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="ALL">全部状态</option>
                  <option value="NORMAL">正常</option>
                  <option value="UNPUBLISHED">未发布</option>
                  <option value="PENDING_CHANGES">有未发布修改</option>
                  <option value="NEEDS_ATTENTION">需关注</option>
                  <option value="DISABLED">已停用</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="p-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] rounded-md cursor-pointer transition-colors"
                title="刷新智能体列表"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              TWELVE. 草稿提醒信息条 (Light Blue Information Strip)
          ───────────────────────────────────────────────────────── */}
          {displayAgents.some((a) => a.hasDraft) && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1E40AF]">
                    {displayAgents.filter((a) => a.hasDraft).length} 个智能体有待处理草稿
                  </div>
                  <div className="text-xs text-[#3B82F6] mt-0.5 leading-relaxed">
                    {displayAgents
                      .filter((a) => a.hasDraft)
                      .map(
                        (a) =>
                          a.formalVersion
                            ? `${a.name} 当前正式版本 ${a.formalVersion} 仍正常使用，存在未发布草稿。`
                            : `${a.name} 为新创建智能体，尚未发布首个正式版本。`
                      )
                      .join('；')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const target = displayAgents.find((a) => a.hasDraft) || displayAgents[0];
                  setSelectedDraftAgent(target);
                  setIsDraftDrawerOpen(true);
                }}
                className="self-start sm:self-center px-3 py-1 bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#BFDBFE] rounded-md text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-2xs"
              >
                查看草稿
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              THIRTEEN - TWENTY. REGISTRY TABLE (成熟企业级表格)
          ───────────────────────────────────────────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569]">
                    <th className="py-3 px-4 w-[280px]">智能体</th>
                    <th className="py-3 px-4 w-[90px]">类型</th>
                    <th className="py-3 px-4 w-[220px]">支持任务</th>
                    <th className="py-3 px-4 w-[160px]">正式版本</th>
                    <th className="py-3 px-4 w-[130px]">状态</th>
                    <th className="py-3 px-4 w-[140px]">Owner</th>
                    <th className="py-3 px-4 w-[60px] text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {filteredAgents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="hover:bg-[#F8FAFC]/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        if (onOpenAgentDefinition) {
                          onOpenAgentDefinition(agent);
                        } else {
                          setSelectedAgentForDetail(agent);
                        }
                      }}
                    >
                      {/* Column 1: 智能体 (Avatar + Name + Responsibility) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start space-x-3">
                          {renderAgentAvatar(agent)}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-[#0F172A] text-xs tracking-tight group-hover:text-[#2563EB] transition-colors">
                                {agent.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-2">
                              {agent.responsibility}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: 类型 (origin 弱展示 Badge：内置 / 自定义) */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-50 text-slate-500 border border-slate-200">
                          {getAgentOriginLabel(agent.origin)}
                        </span>
                      </td>

                      {/* Column 2: 支持任务 (Task Chips, max 2 + rest as +N) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center flex-wrap gap-1.5">
                          {agent.tasks.slice(0, 2).map((task, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]"
                            >
                              {task}
                            </span>
                          ))}
                          {agent.allTasks.length - agent.tasks.length > 0 && (
                            <div className="relative inline-block">
                              <button
                                onMouseEnter={() => setHoveredExtraTasksAgentId(agent.id)}
                                onMouseLeave={() => setHoveredExtraTasksAgentId(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAgentForDetail(agent);
                                }}
                                className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] border border-[#E2E8F0] transition-colors cursor-pointer"
                              >
                                +{agent.allTasks.length - agent.tasks.length}
                              </button>

                              {/* Hover Popover showing all tasks */}
                              {hoveredExtraTasksAgentId === agent.id && (
                                <div className="absolute left-0 bottom-full mb-1.5 z-40 w-48 bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-2 text-left">
                                  <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                                    全部支持任务 ({agent.allTasks.length})
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {agent.allTasks.map((t, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0]"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 4: 正式版本 (vX.X / 暂无 + 发布时间 + optional 草稿有修改) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <div className="font-mono font-semibold text-[#0F172A] text-xs">
                            {agent.formalVersion ? (
                              agent.formalVersion
                            ) : (
                              <span className="text-[#94A3B8] font-normal">暂无 (未发布)</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#64748B]">
                            {agent.releaseTime || '尚未发布'}
                          </p>
                          {agent.hasDraft && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDraftAgent(agent);
                                setIsDraftDrawerOpen(true);
                              }}
                              className="text-[11px] text-[#2563EB] hover:underline font-medium flex items-center space-x-1 pt-0.5 cursor-pointer"
                            >
                              <GitBranch className="w-3 h-3 text-[#2563EB]" />
                              <span>{agent.formalVersion ? '草稿有修改' : '未发布草稿'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column 5: 状态 (产品状态投影：正常 / 未发布 / 有未发布修改 / 需关注 / 已停用) */}
                      <td className="py-3.5 px-4 align-top">
                        {(() => {
                          const productStatus = getAgentProductStatus(
                            agent,
                            runtimeSignalsById.get(agent.id)
                          );
                          const statusStyle = getProductStatusStyle(productStatus.key);
                          return (
                            <div className="flex items-center space-x-1.5 pt-0.5">
                              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                              <span className={`font-medium text-xs ${statusStyle.text}`}>
                                {productStatus.label}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Column 6: Owner (统一中文组织名) */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="text-xs text-[#334155] font-medium">
                          {agent.owner}
                        </span>
                      </td>

                      {/* Column 7: 操作 (···) */}
                      <td className="py-3.5 px-4 align-top text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenuId(activeActionMenuId === agent.id ? null : agent.id);
                          }}
                          className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                          title="更多操作"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Action Menu Popover */}
                        {activeActionMenuId === agent.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-4 top-10 z-50 w-36 bg-white border border-[#E2E8F0] rounded-lg shadow-xl p-1 text-left animate-in fade-in-50 zoom-in-95 duration-100"
                          >
                            <button
                              onClick={() => {
                                if (onOpenAgentDefinition) {
                                  onOpenAgentDefinition(agent);
                                } else {
                                  setSelectedAgentForDetail(agent);
                                }
                                setActiveActionMenuId(null);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded flex items-center space-x-2 text-left cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                              <span>查看定义工作区</span>
                            </button>
                            {agent.hasDraft && (
                              <button
                                onClick={() => {
                                  setSelectedDraftAgent(agent);
                                  setIsDraftDrawerOpen(true);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs text-[#2563EB] hover:bg-[#EFF6FF] rounded flex items-center space-x-2 text-left cursor-pointer"
                              >
                                <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>查看草稿</span>
                              </button>
                            )}
                            {/* Implementation Freeze §5 + §15：版本记录进入 A04 发布验证工作区
                                并直达「发布记录」分区（真实 AgentVersion 历史），不再弹固定数量 Toast */}
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                if (onOpenPublishWorkspace) {
                                  onOpenPublishWorkspace(agent, { initialSection: 'release_history' });
                                } else {
                                  onOpenAgentDefinition?.(agent);
                                }
                              }}
                              className="w-full px-2.5 py-1.5 text-xs text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded flex items-center space-x-2 text-left cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5 text-[#64748B]" />
                              <span>版本记录</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─────────────────────────────────────────────────────────
                TWENTY-ONE. 表格底部 (禁止分页器，仅显示共 4 个智能体)
            ───────────────────────────────────────────────────────── */}
            <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-medium text-[#475569]">
                共 {filteredAgents.length} 个智能体
              </span>
              <span className="text-[11px] text-[#94A3B8]">状态以当前列表为准</span>
            </div>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          SLIDE-OVER DRAWER 1: VIEW DRAFT (查看草稿)
      ───────────────────────────────────────────────────────────── */}
      {isDraftDrawerOpen && (() => {
        const activeDraftAgent = selectedDraftAgent || displayAgents.find((a) => a.hasDraft) || displayAgents[0];
        const hasFormal = Boolean(activeDraftAgent.formalVersion);
        // Implementation Freeze §4：草稿事实（编辑人 / 更新时间 / 变更摘要）读 Domain，
        // businessDiffs 仅作为「已记录变更摘要」，不当作与正式版本的完整 Diff
        const draftWs = agentSelectors.getDefinitionWorkspaceState(activeDraftAgent.id);
        const changes = draftWs?.businessDiffs ?? [];
        const draftAuthor = draftWs?.draftUpdatedBy || activeDraftAgent.owner;
        const draftUpdatedAt = draftWs?.draftUpdatedAt || '刚刚';
        // 二十一: 版本号由 Domain Service 依据当前正式版本推导，不写死
        const targetNextVersion = agentService.getExpectedNextVersion(activeDraftAgent.id) ?? 'v1.0';

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
              onClick={() => setIsDraftDrawerOpen(false)}
            />
            <div className="relative z-10 w-full max-w-[480px] bg-white h-full shadow-2xl border-l border-[#E2E8F0] flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Drawer Header */}
                <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                  <div className="flex items-center space-x-2.5">
                    {renderAgentAvatar(activeDraftAgent)}
                    <div>
                      <h3 className="font-bold text-sm text-[#0F172A]">
                        {activeDraftAgent.name} · 未发布草稿
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        {hasFormal
                          ? `正式版本 ${activeDraftAgent.formalVersion} (正常运行中) vs 当前编辑草稿`
                          : '首次创建草稿 (尚未建立正式版本)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDraftDrawerOpen(false)}
                    className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="p-5 space-y-4">
                  {/* Meta info */}
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs space-y-1">
                    <div className="font-bold text-[#1E40AF] flex items-center justify-between">
                      <span>草稿编辑人：{draftAuthor}</span>
                      <span className="text-[11px] font-normal text-[#3B82F6]">{draftUpdatedAt} 更新</span>
                    </div>
                    <p className="text-[#3B82F6] text-[11px]">
                      {hasFormal
                        ? '该草稿尚未发布，当前正式版本仍保持生效。草稿将在发布验证通过后才会成为新的正式版本。'
                        : '该智能体目前仅存在未发布草稿，通过发布验证并正式发布后才会生成首个正式版本。'}
                    </p>
                  </div>

                  {/* Change list：已记录变更摘要（businessDiffs 仅是编辑时记录的摘要） */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                      <span>
                        已记录变更摘要{changes.length > 0 ? `（${changes.length} 项）` : ''}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B] bg-slate-100 px-1.5 py-0.2 rounded">
                        {hasFormal
                          ? changes.length > 0
                            ? `${changes.length} RECORDED`
                            : 'NO SUMMARY'
                          : 'INITIAL DRAFT'}
                      </span>
                    </div>

                    {!hasFormal ? (
                      <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="font-bold text-xs text-[#0F172A]">
                            首次创建草稿
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] pl-3.5">
                          已初始化支持任务与基础配置，进入定义工作区可继续完善配置，并进行发布前验证。
                        </p>
                      </div>
                    ) : changes.length > 0 ? (
                      changes.map((ch, idx) => (
                        <div key={idx} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between space-x-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                              <span className="font-bold text-xs text-[#0F172A] truncate">
                                {idx + 1}. {ch.field}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                              {ch.tag}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] leading-relaxed pl-3.5">
                            {ch.changeText}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="font-bold text-xs text-[#0F172A]">
                            尚未生成逐项差异摘要
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] pl-3.5 leading-relaxed">
                          当前草稿尚未记录任何变更摘要；这不代表草稿与正式版本一致，
                          各配置项的当前取值以定义工作区为准。
                        </p>
                      </div>
                    )}

                    <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                      变更摘要仅为创建与编辑时记录的业务摘要，不代表草稿与正式版本的完整差异。
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsDraftDrawerOpen(false);
                    if (onOpenAgentDefinition) {
                      onOpenAgentDefinition(activeDraftAgent);
                    }
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#2563EB] border border-[#BFDBFE] rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>进入定义工作区</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setIsDraftDrawerOpen(false);
                      addToast?.('info', '保留草稿', `已保留「${activeDraftAgent.name}」未发布的草稿`);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#475569] border border-[#CBD5E1] rounded-md text-xs font-semibold cursor-pointer"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => {
                      setIsDraftDrawerOpen(false);
                      if (onOpenPublishWorkspace) {
                        onOpenPublishWorkspace(activeDraftAgent);
                      } else {
                        onOpenAgentDefinition?.(activeDraftAgent);
                      }
                      addToast?.(
                        'info',
                        '前往发布验证',
                        `「${activeDraftAgent.name}」草稿需通过发布验证的全部发布检查后才能发布为 ${targetNextVersion}`
                      );
                    }}
                    className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>前往发布验证 (预计 {targetNextVersion})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─────────────────────────────────────────────────────────────
          SLIDE-OVER DRAWER 2: AGENT DETAIL / SPEC (智能体详情)
      ───────────────────────────────────────────────────────────── */}
      {selectedAgentForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedAgentForDetail(null)}
          />
          <div className="relative z-10 w-full max-w-[500px] bg-white h-full shadow-2xl border-l border-[#E2E8F0] flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex items-center space-x-3">
                  {renderAgentAvatar(selectedAgentForDetail)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-[#0F172A]">
                        {selectedAgentForDetail.name}
                      </h3>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-50 text-slate-500 border border-slate-200">
                        {getAgentOriginLabel(selectedAgentForDetail.origin)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {selectedAgentForDetail.formalVersion
                        ? `正式版本 ${selectedAgentForDetail.formalVersion}`
                        : '尚未发布正式版本'}
                      {' · '}
                      {getAgentProductStatus(
                        selectedAgentForDetail,
                        runtimeSignalsById.get(selectedAgentForDetail.id)
                      ).label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgentForDetail(null)}
                  className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 space-y-5">
                {/* 职责概览 */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#0F172A]">核心业务职责</span>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#334155] leading-relaxed">
                    {selectedAgentForDetail.description}
                  </div>
                </div>

                {/* 规格参数清单 */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#0F172A]">规格信息</span>
                  <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-[#F1F5F9] text-xs">
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-[#64748B]">类型</span>
                      <span className="font-semibold text-[#0F172A]">
                        {getAgentOriginLabel(selectedAgentForDetail.origin)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-[#64748B]">当前正式版本</span>
                      <span className="font-mono font-bold text-[#2563EB]">
                        {selectedAgentForDetail.formalVersion || '暂无 (未发布)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-[#64748B]">发布时间</span>
                      <span className="text-[#334155]">
                        {selectedAgentForDetail.releaseTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-[#64748B]">责任团队 (Owner)</span>
                      <span className="font-medium text-[#334155]">
                        {selectedAgentForDetail.owner}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 全量支持任务 */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#0F172A]">全量支持业务任务 ({selectedAgentForDetail.allTasks.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgentForDetail.allTasks.map((task, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium px-2.5 py-1 rounded bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]"
                      >
                        {task}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-end">
              <button
                onClick={() => setSelectedAgentForDetail(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          A02: CREATE CUSTOM AGENT DRAWER (880–940px)
          Stage 1: 选择能力模板 -> Stage 2: 定义用途与工作范围
      ───────────────────────────────────────────────────────────── */}
      <CreateAgentDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        initialStep={1}
        initialTemplateId={null}
        onCreateAndConfigure={(agentData) => {
          setIsCreateDrawerOpen(false);
          const { agentItem, definition } = createAgentDraft({
            name: agentData.name,
            responsibility: agentData.responsibility,
            owner: agentData.owner,
            templateId: agentData.templateId,
            runtimeTarget: agentData.runtimeTarget,
            contextBindings: agentData.contextBindings
          });

          // Prepend new draft agent to registry
          setAgents((prev) => [agentItem, ...prev]);

          addToast?.(
            'success',
            '已创建智能体草稿',
            `已基于模板生成「${agentData.name}」未发布草稿，已进入定义工作区继续配置`
          );

          if (onOpenAgentDefinition) {
            onOpenAgentDefinition(agentItem, definition);
          }
        }}
      />
    </div>
  );
};
