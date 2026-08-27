import React, { useState, useMemo } from 'react';
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
  Layers,
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
  INITIAL_AGENTS
} from '../data/agentRegistryData';
import { CreateAgentDrawer } from './CreateAgentDrawer';

interface AgentRegistryWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToHome?: () => void;
  onNavigateToGovernance?: () => void;
  onNavigateToMetrics?: () => void;
  onNavigateToMarketplace?: () => void;
  onOpenAgentDefinition?: (agent: AgentItem) => void;
  initialOpenCreateDrawer?: boolean;
}

export const AgentRegistryWorkspace: React.FC<AgentRegistryWorkspaceProps> = ({
  addToast,
  onNavigateToHome,
  onNavigateToGovernance,
  onNavigateToMetrics,
  onNavigateToMarketplace,
  onOpenAgentDefinition,
  initialOpenCreateDrawer = true
}) => {
  // Navigation State
  const [activeLeftNav, setActiveLeftNav] = useState<'agents' | 'skills'>('agents');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SYSTEM' | 'MANAGED'>('ALL');
  const [engineFilter, setEngineFilter] = useState<'ALL' | 'Semovix' | 'Semovix Native' | 'WeKnora'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Drawers & Modals
  const [selectedAgentForDetail, setSelectedAgentForDetail] = useState<AgentItem | null>(null);
  const [isDraftDrawerOpen, setIsDraftDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState<boolean>(initialOpenCreateDrawer);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [hoveredExtraTasksAgentId, setHoveredExtraTasksAgentId] = useState<string | null>(null);

  // Mock Agent list
  const [agents, setAgents] = useState<AgentItem[]>(INITIAL_AGENTS);

  // Filtered List
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = agent.name.toLowerCase().includes(q);
        const matchResp = agent.responsibility.toLowerCase().includes(q);
        const matchOwner = agent.owner.toLowerCase().includes(q);
        const matchTask = agent.allTasks.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchResp && !matchOwner && !matchTask) return false;
      }

      // Type Filter
      if (typeFilter !== 'ALL') {
        if (agent.category !== typeFilter) return false;
      }

      // Engine Filter
      if (engineFilter !== 'ALL') {
        if (agent.runtimeEngine !== engineFilter) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        if (agent.status !== statusFilter) return false;
      }

      return true;
    });
  }, [agents, searchQuery, typeFilter, engineFilter, statusFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast?.('success', '状态已同步', '所有受管智能体运行引擎心跳与版本状态已更新至最新');
    }, 450);
  };

  // Helper for agent avatar
  const renderAgentAvatar = (agent: AgentItem) => {
    switch (agent.avatarType) {
      case 'xino':
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#4F46E5] text-white flex items-center justify-center shadow-2xs shrink-0">
            <Bot className="w-4 h-4" />
          </div>
        );
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

            {/* Weak Group Title: 高级管理 */}
            {!isSidebarCollapsed && (
              <div className="pt-4 pb-1 px-3">
                <span className="text-[10px] font-semibold text-[#94A3B8] tracking-wider uppercase">
                  高级管理
                </span>
              </div>
            )}

            {/* Weak Secondary Entry: 能力与技能 */}
            <button
              onClick={() => {
                setActiveLeftNav('skills');
                addToast?.('info', '能力与技能', '当前共挂载 18 项平台 Tools、Skill 算子与知识检索连接器');
              }}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer text-xs ${
                isSidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2.5'
              } ${
                activeLeftNav === 'skills'
                  ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#334155]'
              }`}
              title="能力与技能"
            >
              <Layers className="w-4 h-4 text-[#94A3B8] shrink-0" />
              {!isSidebarCollapsed && <span>能力与技能</span>}
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
                管理平台中的智能执行角色、任务职责、运行引擎与正式版本。
              </p>
            </div>

            {/* Main Action Button: 从模板创建 (Blue Primary Button) */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <button
                onClick={() => setIsCreateDrawerOpen(true)}
                className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>从模板创建</span>
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
              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  aria-label="筛选智能体类型"
                  className="appearance-none bg-[#F8FAFC] hover:bg-slate-100 text-xs font-medium text-[#334155] border border-[#E2E8F0] rounded-md pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="ALL">全部类型</option>
                  <option value="SYSTEM">系统智能体</option>
                  <option value="MANAGED">受管智能体</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* Engine Filter */}
              <div className="relative">
                <select
                  value={engineFilter}
                  onChange={(e) => setEngineFilter(e.target.value as any)}
                  aria-label="筛选运行引擎"
                  className="appearance-none bg-[#F8FAFC] hover:bg-slate-100 text-xs font-medium text-[#334155] border border-[#E2E8F0] rounded-md pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="ALL">全部运行引擎</option>
                  <option value="Semovix">Semovix</option>
                  <option value="Semovix Native">Semovix Native</option>
                  <option value="WeKnora">WeKnora</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  aria-label="筛选运行状态"
                  className="appearance-none bg-[#F8FAFC] hover:bg-slate-100 text-xs font-medium text-[#334155] border border-[#E2E8F0] rounded-md pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="ALL">全部状态</option>
                  <option value="ACTIVE">正常</option>
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
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1E40AF]">
                  1 个智能体有未发布草稿
                </div>
                <div className="text-xs text-[#3B82F6] mt-0.5 leading-relaxed">
                  企业知识伙伴 · 正式版本 v1.4 正常运行，当前草稿包含 2 项未发布修改。
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDraftDrawerOpen(true)}
              className="self-start sm:self-center px-3 py-1 bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#BFDBFE] rounded-md text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-2xs"
            >
              查看草稿
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────
              THIRTEEN - TWENTY. REGISTRY TABLE (成熟企业级表格)
          ───────────────────────────────────────────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569]">
                    <th className="py-3 px-4 w-[280px]">智能体</th>
                    <th className="py-3 px-4 w-[220px]">支持任务</th>
                    <th className="py-3 px-4 w-[160px]">运行引擎</th>
                    <th className="py-3 px-4 w-[160px]">正式版本</th>
                    <th className="py-3 px-4 w-[120px]">运行状态</th>
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
                      {/* Column 1: 智能体 (Avatar + Name + Responsibility + Management Badge) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start space-x-3">
                          {renderAgentAvatar(agent)}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-[#0F172A] text-xs tracking-tight group-hover:text-[#2563EB] transition-colors">
                                {agent.name}
                              </span>
                              {/* Management Badge */}
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                                  agent.category === 'SYSTEM'
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200/60'
                                }`}
                              >
                                {agent.agentType}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-2">
                              {agent.responsibility}
                            </p>
                          </div>
                        </div>
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
                          {agent.extraTasksCount > 0 && (
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
                                +{agent.extraTasksCount}
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

                      {/* Column 3: 运行引擎 (Semovix / Semovix Native / WeKnora + optional 已同步) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#0F172A] text-xs">
                            {agent.runtimeEngine}
                          </span>
                          {agent.engineSyncStatus && (
                            <p className="text-[11px] text-[#94A3B8] font-normal leading-tight">
                              {agent.engineSyncStatus}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Column 4: 正式版本 (vX.X + 发布时间 + optional 草稿有修改) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <div className="font-mono font-semibold text-[#0F172A] text-xs">
                            {agent.formalVersion}
                          </div>
                          <p className="text-[11px] text-[#64748B]">
                            {agent.releaseTime}
                          </p>
                          {agent.hasDraft && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDraftDrawerOpen(true);
                              }}
                              className="text-[11px] text-[#2563EB] hover:underline font-medium flex items-center space-x-1 pt-0.5 cursor-pointer"
                            >
                              <GitBranch className="w-3 h-3 text-[#2563EB]" />
                              <span>{agent.draftNote || '草稿有修改'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column 5: 运行状态 (● 正常) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center space-x-1.5 pt-0.5">
                          <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                          <span className="font-medium text-[#16A36A] text-xs">
                            {agent.statusLabel}
                          </span>
                        </div>
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
                                  setIsDraftDrawerOpen(true);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs text-[#2563EB] hover:bg-[#EFF6FF] rounded flex items-center space-x-2 text-left cursor-pointer"
                              >
                                <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>查看草稿</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                addToast?.('info', '版本历史', `「${agent.name}」已记录 6 个历史正式发布版本`);
                                setActiveActionMenuId(null);
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
              <span className="text-[11px] text-[#94A3B8]">
                Semovix 受管智能体平台 · 全量心跳在线
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          SLIDE-OVER DRAWER 1: VIEW DRAFT (查看草稿)
      ───────────────────────────────────────────────────────────── */}
      {isDraftDrawerOpen && (
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
                  <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">
                      企业知识伙伴 · 未发布草稿
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      正式版本 v1.4 (正常运行中) vs 当前编辑草稿
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
                    <span>草稿编辑人：王健 (企业知识治理组)</span>
                    <span className="text-[11px] font-normal text-[#3B82F6]">今天 10:15 更新</span>
                  </div>
                  <p className="text-[#3B82F6] text-[11px]">
                    该草稿已通过本地离线评估集，尚未发布至 WeKnora 生产环境，线上用户仍由 v1.4 正式版服务。
                  </p>
                </div>

                {/* Change list */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                    <span>包含 2 项待发布修改 (Changes)</span>
                    <span className="text-[10px] font-mono text-[#64748B] bg-slate-100 px-1.5 py-0.2 rounded">
                      DIFF: 2 MODIFICATIONS
                    </span>
                  </div>

                  {/* Change 1 */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span className="font-bold text-xs text-[#0F172A]">
                        1. 混合检索召回策略优化
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed pl-3.5">
                      调整稠密向量 (Dense) 与 BM25 稀疏检索权重配比至 0.7 : 0.3，提升政务及业务缩写术语检索召回率。
                    </p>
                    <div className="pl-3.5 pt-1 text-[11px] font-mono text-[#64748B] flex items-center space-x-2">
                      <span className="line-through text-red-500">Dense: 0.5, BM25: 0.5</span>
                      <span>→</span>
                      <span className="text-[#16A36A] font-bold">Dense: 0.7, BM25: 0.3</span>
                    </div>
                  </div>

                  {/* Change 2 */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span className="font-bold text-xs text-[#0F172A]">
                        2. 领域专有名词与实体词库更新
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed pl-3.5">
                      挂载「政务与民政老龄化服务领域专有名词库 V2.1」，新增 28 个核心词条及其同义词扩展。
                    </p>
                    <div className="pl-3.5 pt-1 text-[11px] font-mono text-[#16A36A] font-semibold">
                      + 28 词条 (含民政热线分类、常住老龄人口口径术语)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-end space-x-2.5">
              <button
                onClick={() => {
                  setIsDraftDrawerOpen(false);
                  addToast?.('info', '放弃草稿', '已放弃未发布的草稿修改，保留线上 v1.4 正式版');
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-[#475569] border border-[#CBD5E1] rounded-md text-xs font-semibold cursor-pointer"
              >
                放弃草稿
              </button>
              <button
                onClick={() => {
                  setIsDraftDrawerOpen(false);
                  addToast?.('success', '发布成功', '已成功发布「企业知识伙伴」正式版本 v1.5 并热同步至 WeKnora 引擎');
                }}
                className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>发布为 v1.5 正式版</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {selectedAgentForDetail.agentType}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      正式版本 {selectedAgentForDetail.formalVersion} · 运行正常
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
                  <span className="text-xs font-bold text-[#0F172A]">受管规格与运行配置</span>
                  <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-[#F1F5F9] text-xs">
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-[#64748B]">运行引擎 (Runtime)</span>
                      <span className="font-semibold text-[#0F172A]">
                        {selectedAgentForDetail.runtimeEngine}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-[#64748B]">当前正式版本</span>
                      <span className="font-mono font-bold text-[#2563EB]">
                        {selectedAgentForDetail.formalVersion}
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
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-[#64748B]">挂载技能 (Skills)</span>
                      <span className="font-semibold text-[#0F172A]">
                        {selectedAgentForDetail.skillsCount} 项已授权技能
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-[#64748B]">工具算子 (Tools)</span>
                      <span className="font-semibold text-[#0F172A]">
                        {selectedAgentForDetail.toolsCount} 项 API/MCP 接口
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
          A02: CREATE MANAGED AGENT DRAWER (880–940px)
          Stage 1: 选择模板 (Default) -> Stage 2: 基本定义
      ───────────────────────────────────────────────────────────── */}
      <CreateAgentDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        initialStep={1}
        initialTemplateId="enterprise_knowledge"
        onCreateAndConfigure={(agentData) => {
          setIsCreateDrawerOpen(false);
          addToast?.(
            'success',
            '已创建智能体草稿',
            `已基于「${agentData.name}」生成未发布草稿，即将进入定义工作区继续完善配置`
          );
          if (onOpenAgentDefinition) {
            const matchedAgent = agents.find(a => a.name === '企业知识伙伴') || agents[0];
            onOpenAgentDefinition({
              ...matchedAgent,
              name: agentData.name,
              responsibility: agentData.responsibility,
              owner: agentData.owner
            });
          }
        }}
      />
    </div>
  );
};
