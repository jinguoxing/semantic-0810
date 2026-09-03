import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Compass,
  ListTodo,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Paperclip,
  Bot,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  ExternalLink,
  Layers,
  Database,
  ArrowRight,
  ArrowLeft,
  Home,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import {
  ActiveWorkspaceType,
  DialogueMessage,
  ScenarioMilestoneKey
} from './find_data/FindDataTypes';
import {
  DIALOGUE_ROUNDS,
  SCENARIO_MILESTONES,
  TEST_RESOURCES
} from './find_data/FindDataMockData';
import { RightWorkspaceCompare } from './find_data/RightWorkspaceCompare';
import { RightWorkspaceFields } from './find_data/RightWorkspaceFields';
import { RightWorkspaceSolution } from './find_data/RightWorkspaceSolution';
import { RightWorkspaceAccess } from './find_data/RightWorkspaceAccess';
import { RightWorkspaceCatalog } from './find_data/RightWorkspaceCatalog';
import { RightWorkspaceAskPlan } from './find_data/RightWorkspaceAskPlan';
import { TaskContextDrawer } from './find_data/TaskContextDrawer';

interface DataAssistantFindDataWorkspaceProps {
  initialQuery?: string;
  onNavigateToNav?: (navId: string) => void;
  onBackToHome?: () => void;
}

export const DataAssistantFindDataWorkspace: React.FC<DataAssistantFindDataWorkspaceProps> = ({
  initialQuery,
  onNavigateToNav,
  onBackToHome
}) => {
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Scenario and Interaction state
  const [currentMaxTurn, setCurrentMaxTurn] = useState<number>(14); // full 14 rounds available
  const [activeSurface, setActiveSurface] = useState<ActiveWorkspaceType>('CLOSED');
  const [activeResource, setActiveResource] = useState<string>('常住人口月度快照');
  const [activeMilestone, setActiveMilestone] = useState<ScenarioMilestoneKey | 'custom'>('workspace_ask_plan');
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  // Round 1 interactive checkbox selections
  const [r01Selections, setR01Selections] = useState<string[]>(['老年人口规模与分布', '养老床位供给']);
  // Round 13 interactive benchmark selection
  const [r13Benchmark, setR13Benchmark] = useState<string>('与全区加权平均比较');

  // Solution view mode
  const [solutionMode, setSolutionMode] = useState<'recommended' | 'executable'>('recommended');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);

  // Filtered session history on the left
  const recentSessions = [
    { id: 's1', title: '闵行区老年人口与养老床位供给水平分析', time: '进行中', active: true },
    { id: 's2', title: '出生、死亡、迁入迁出事件记录', time: '昨天', active: false },
    { id: 's3', title: '公共服务热线工单办结分析', time: '前天', active: false },
    { id: 's4', title: '实收金额指标口径对齐', time: '3天前', active: false }
  ];

  const filteredSessions = recentSessions.filter((s) =>
    s.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Switch to specific milestone state
  const handleSelectMilestone = (key: ScenarioMilestoneKey) => {
    const milestone = SCENARIO_MILESTONES.find((m) => m.key === key);
    if (!milestone) return;

    setActiveMilestone(key);
    setCurrentMaxTurn(milestone.maxTurn);
    setActiveSurface(milestone.defaultSurface);
    if (milestone.activeResource !== undefined) {
      setActiveResource(milestone.activeResource);
    }
  };

  // Handle action buttons inside message bubbles
  const handleAction = (actionKey: string) => {
    switch (actionKey) {
      case 'open_compare':
        setActiveSurface('COMPARE');
        setActiveMilestone('workspace_compare');
        break;
      case 'choose_snapshot':
        setActiveResource('常住人口月度快照');
        setActiveSurface('CLOSED');
        break;
      case 'open_fields':
        setActiveSurface('FIELDS');
        setActiveMilestone('workspace_fields');
        break;
      case 'open_solution':
      case 'view_partial_match':
      case 'keep_as_gap':
      case 'retain_gap':
        setActiveSurface('SOLUTION');
        setActiveMilestone('workspace_solution');
        break;
      case 'open_access':
        setActiveSurface('ACCESS');
        setActiveMilestone('workspace_access');
        break;
      case 'keep_minimal_plan':
      case 'view_executable_scope':
        setSolutionMode('executable');
        setActiveSurface('SOLUTION');
        break;
      case 'open_catalog':
        setActiveSurface('CATALOG');
        setActiveMilestone('workspace_catalog');
        break;
      case 'open_ask_plan':
      case 'prepare_analysis':
        setActiveSurface('ASK_PLAN');
        setActiveMilestone('workspace_ask_plan');
        break;
      case 'ask_data_single':
        setActiveResource('60 岁以上常住人口数');
        alert('已定位正式指标「60 岁以上常住人口数」，可直接执行查询问数。');
        break;
      case 'view_metric_spec':
        alert('正式指标口径：按月统计各街镇 60 岁及以上常住人口总数，统计口径稳定。');
        break;
      case 'modify_understanding':
        setIsContextDrawerOpen(true);
        break;
      case 'apply_and_proceed':
        alert('已发起数据资产使用申请流程（查询权限与样本预览），审批将流转至数据管理岗。');
        break;
      default:
        break;
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim();
    setInputMessage('');

    // If user explicitly asks for actions
    if (text.includes('比较') || text.includes('对比')) {
      setActiveSurface('COMPARE');
    } else if (text.includes('字段')) {
      setActiveSurface('FIELDS');
    } else if (text.includes('方案')) {
      setActiveSurface('SOLUTION');
    } else if (text.includes('权限')) {
      setActiveSurface('ACCESS');
    } else if (text.includes('目录') || text.includes('民政')) {
      setActiveSurface('CATALOG');
    } else if (text.includes('计算') || text.includes('计划') || text.includes('分析') || text.includes('千名')) {
      setActiveSurface('ASK_PLAN');
    }
  };

  const visibleMessages = DIALOGUE_ROUNDS.filter((msg) => msg.turnIndex <= currentMaxTurn);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#0F172A] relative">
      <TaskContextDrawer
        isOpen={isContextDrawerOpen}
        onClose={() => setIsContextDrawerOpen(false)}
        activeResource={activeResource}
      />

      {/* =========================================================
          1. LEFT HISTORY & ENTRANCE BAR (252–268px, #FFFFFF)
      ========================================================= */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-14' : 'w-[264px]'
        } bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 transition-all duration-200 z-20 select-none`}
      >
        {/* Top Header inside Sidebar: Logo & Collapse Button */}
        <div className="h-14 px-3.5 border-b border-[#F1F5F9] flex items-center justify-between shrink-0">
          {!isSidebarCollapsed ? (
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {/* Semovix Brand Logo */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white font-extrabold shadow-2xs shrink-0">
                <span className="text-base font-mono tracking-tighter">S</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm text-[#0F172A] tracking-tight leading-none">
                  Semovix
                </span>
                <span className="text-[10px] text-[#64748B] tracking-tight font-medium mt-0.5 truncate">
                  企业 AI 原生语义智能平台
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-extrabold shadow-2xs">
              <span className="text-base font-mono">S</span>
            </div>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-7 h-7 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
            title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Action Button: 新建任务 */}
        <div className="p-3 border-b border-[#F1F5F9]">
          <button
            onClick={() => {
              setCurrentMaxTurn(1);
              setActiveMilestone('clarification');
              setActiveSurface('CLOSED');
              setActiveResource('');
            }}
            className="w-full py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {!isSidebarCollapsed && <span>新建任务</span>}
          </button>
        </div>

        {/* Core Workspace Entrances */}
        <div className="p-2 space-y-0.5 border-b border-[#F1F5F9] text-xs">
          <button
            onClick={() => onNavigateToNav && onNavigateToNav('home')}
            className="w-full px-2.5 py-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-bold flex items-center justify-between group transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Bot className="w-4 h-4 text-[#2563EB]" />
              {!isSidebarCollapsed && <span>数据助手 · 找数据</span>}
            </div>
            {!isSidebarCollapsed && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            )}
          </button>

          <button
            onClick={() => onNavigateToNav && onNavigateToNav('data_catalog')}
            className="w-full px-2.5 py-1.5 rounded-lg text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-medium flex items-center justify-between group transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Compass className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
              {!isSidebarCollapsed && <span>应用中心</span>}
            </div>
          </button>

          <button
            onClick={() => onBackToHome ? onBackToHome() : onNavigateToNav && onNavigateToNav('home')}
            className="w-full px-2.5 py-1.5 rounded-lg text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-medium flex items-center justify-between group transition-colors cursor-pointer"
            title="返回 AI 工作台"
          >
            <div className="flex items-center space-x-2.5">
              <Home className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
              {!isSidebarCollapsed && <span>返回 AI 工作台</span>}
            </div>
          </button>

          <button
            onClick={() => onNavigateToNav && onNavigateToNav('home')}
            className="w-full px-2.5 py-1.5 rounded-lg text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-medium flex items-center justify-between group transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <MessageSquare className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
              {!isSidebarCollapsed && <span>全部对话</span>}
            </div>
          </button>

          <button
            onClick={() => onNavigateToNav && onNavigateToNav('task_center')}
            className="w-full px-2.5 py-1.5 rounded-lg text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-medium flex items-center justify-between group transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <ListTodo className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
              {!isSidebarCollapsed && <span>任务中心</span>}
            </div>
            {!isSidebarCollapsed && (
              <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] font-bold text-[10px] rounded-full border border-[#BFDBFE]">
                14
              </span>
            )}
          </button>
        </div>

        {/* History Search Box (when expanded) */}
        {!isSidebarCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="搜索历史任务…"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#1E293B]"
              />
            </div>
          </div>
        )}

        {/* Recent Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {!isSidebarCollapsed && (
            <div className="px-2 py-1 text-[11px] font-bold text-[#94A3B8]">
              最近对话
            </div>
          )}

          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`p-2 rounded-lg text-xs transition-all cursor-pointer group flex items-center justify-between ${
                session.active
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold border border-[#BFDBFE]'
                  : 'text-[#334155] hover:bg-[#F8FAFC] border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2 truncate pr-1">
                <MessageSquare
                  className={`w-3.5 h-3.5 shrink-0 ${
                    session.active ? 'text-[#2563EB]' : 'text-[#94A3B8] group-hover:text-[#64748B]'
                  }`}
                />
                {!isSidebarCollapsed && <span className="truncate">{session.title}</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[10px] text-[#94A3B8] shrink-0 font-mono">
                  {session.time}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Current User Section: 闵行区养老服务分析员 (DO NOT display 平台超级管理员) */}
        <div className="p-3 border-t border-[#F1F5F9] bg-[#FAFAFA] flex items-center space-x-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0">
            <span>分</span>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-[#0F172A] truncate">
                闵行区养老服务分析员
              </span>
              <span className="text-[10px] text-[#64748B] truncate">
                民政与老龄业务分析岗
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================
          2. MIDDLE CONVERSATION AREA
             Width: 880-1040px when right is closed;
                    520-680px when right is open.
      ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC] relative">
        
        {/* Top Stable Task Header & Context Bar */}
        <header className="h-14 px-5 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-3 truncate">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#475569] hover:text-[#2563EB] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-semibold shrink-0"
                title="返回 AI 工作台首页"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回工作台</span>
              </button>
            )}
            <div className="flex flex-col truncate">
              <div className="flex items-center space-x-2 truncate">
                <h1 className="text-sm font-bold text-[#0F172A] tracking-tight truncate">
                  {initialQuery && initialQuery.length > 20
                    ? `${initialQuery.slice(0, 20)}...`
                    : initialQuery || '闵行区老年人口与养老床位供给水平分析'}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-semibold border border-[#BFDBFE] shrink-0">
                  数据助手 · 找数据
                </span>
              </div>
              
              {/* Lightweight Context Bar */}
              <div className="flex items-center space-x-2 text-[11px] text-[#64748B] mt-0.5">
                <span>区域：上海市闵行区</span>
                <span className="text-[#CBD5E1]">·</span>
                <span>时间：2025.09 — 2026.08</span>
                <span className="text-[#CBD5E1]">·</span>
                <span>
                  当前资源：
                  <span className="font-semibold text-[#0F172A]">
                    {activeResource ? activeResource : '未指定'}
                  </span>
                </span>
                <span className="text-[#CBD5E1]">·</span>
                <button
                  onClick={() => setIsContextDrawerOpen(true)}
                  className="text-[#2563EB] hover:underline font-medium cursor-pointer inline-flex items-center space-x-0.5"
                >
                  <span>查看上下文</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Workspace Status Bar (Right Surface Toggle) */}
          <div className="flex items-center space-x-2 shrink-0">
            {activeSurface !== 'CLOSED' && (
              <button
                onClick={() => setActiveSurface('CLOSED')}
                className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer border border-[#E2E8F0]"
              >
                收起右侧工作区
              </button>
            )}

            {/* Manual Quick Surface Buttons if user wants to inspect */}
            <div className="flex items-center space-x-1 bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0] text-xs">
              <button
                onClick={() => setActiveSurface(activeSurface === 'SOLUTION' ? 'CLOSED' : 'SOLUTION')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  activeSurface === 'SOLUTION'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                数据方案
              </button>
              <button
                onClick={() => setActiveSurface(activeSurface === 'FIELDS' ? 'CLOSED' : 'FIELDS')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  activeSurface === 'FIELDS'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                字段
              </button>
              <button
                onClick={() => setActiveSurface(activeSurface === 'ASK_PLAN' ? 'CLOSED' : 'ASK_PLAN')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  activeSurface === 'ASK_PLAN'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                分析计划
              </button>
            </div>
          </div>
        </header>

        {/* Discrete Top Milestone Quick-Navigation Bar (Allows viewing all 10 key states cleanly) */}
        <div className="px-6 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0 overflow-x-auto custom-scrollbar select-none">
          <div className="flex items-center space-x-1.5 text-[11px] text-[#64748B] shrink-0">
            <span className="font-semibold text-[#475569]">场景阶段直达：</span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {SCENARIO_MILESTONES.map((milestone) => {
              const isSelected = activeMilestone === milestone.key;
              return (
                <button
                  key={milestone.key}
                  onClick={() => handleSelectMilestone(milestone.key as ScenarioMilestoneKey)}
                  className={`px-2.5 py-0.8 rounded-md text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#2563EB] text-white font-bold shadow-2xs'
                      : 'bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                  }`}
                >
                  {milestone.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vertically Scrollable Conversation Stream */}
        <div
          ref={conversationScrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar"
        >
          {/* Centralized Reading Column: width 880-1040px when closed, narrower when open */}
          <div
            className={`mx-auto transition-all duration-200 space-y-5 ${
              activeSurface === 'CLOSED'
                ? 'max-w-[940px]'
                : 'max-w-[620px]'
            }`}
          >
            {visibleMessages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${
                    isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  {!isUser ? (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#4F46E5] flex items-center justify-center text-white shrink-0 shadow-2xs">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#475569] flex items-center justify-center text-white shrink-0 shadow-2xs text-xs font-bold">
                      <span>分</span>
                    </div>
                  )}

                  {/* Message Bubble Column */}
                  <div
                    className={`flex flex-col space-y-2 ${
                      isUser ? 'items-end' : 'items-start'
                    } max-w-[85%]`}
                  >
                    {/* Sender Label */}
                    <div className="text-[11px] text-[#94A3B8] px-1 font-medium">
                      {isUser ? '闵行区养老服务分析员' : 'Xino｜犀诺'}
                    </div>

                    {/* Main Text Content */}
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-[#2563EB] text-white font-medium rounded-tr-xs'
                          : 'bg-white text-[#1E293B] border border-[#E2E8F0] rounded-tl-xs'
                      }`}
                    >
                      {msg.text}

                      {/* Interactive Section for Round 1: Minimal Clarification Checkboxes */}
                      {msg.briefType === 'clarify_choice' && (
                        <div className="mt-3 pt-3 border-t border-[#F1F5F9] space-y-2.5">
                          <div className="text-[11px] font-bold text-[#475569]">
                            请选择你希望先关注的方向（最多选两项）：
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {[
                              '老年人口规模与分布',
                              '养老床位供给',
                              '实际服务使用',
                              '公共服务诉求'
                            ].map((opt) => {
                              const isChecked = r01Selections.includes(opt);
                              return (
                                <label
                                  key={opt}
                                  onClick={() => {
                                    if (isChecked) {
                                      setR01Selections(r01Selections.filter((s) => s !== opt));
                                    } else {
                                      if (r01Selections.length < 2) {
                                        setR01Selections([...r01Selections, opt]);
                                      }
                                    }
                                  }}
                                  className={`p-2.5 rounded-lg border flex items-center space-x-2 transition-colors cursor-pointer ${
                                    isChecked
                                      ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A] font-semibold'
                                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                                  }`}
                                >
                                  <div
                                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                      isChecked
                                        ? 'bg-[#2563EB] border-[#2563EB] text-white'
                                        : 'border-[#CBD5E1] bg-white'
                                    }`}
                                  >
                                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                  <span className="text-[11px]">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[10px] text-[#94A3B8]">已选 {r01Selections.length} / 2 项</span>
                            <button
                              onClick={() => {
                                if (currentMaxTurn < 2) {
                                  setCurrentMaxTurn(2);
                                }
                              }}
                              className="px-3 py-1 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              继续
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Interactive Section for Round 13: Benchmark Choice */}
                      {msg.briefType === 'benchmark_choice' && (
                        <div className="mt-3 pt-3 border-t border-[#F1F5F9] space-y-2">
                          <div className="text-[11px] font-bold text-[#475569]">
                            请确认“相对偏低”的判定基准：
                          </div>
                          <div className="space-y-1.5">
                            {[
                              '只展示各街镇排名',
                              '与全区加权平均比较',
                              '使用正式政策目标值'
                            ].map((bench) => (
                              <label
                                key={bench}
                                onClick={() => setR13Benchmark(bench)}
                                className={`p-2 rounded-lg border flex items-center space-x-2 text-xs transition-colors cursor-pointer ${
                                  r13Benchmark === bench
                                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A] font-bold'
                                    : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                    r13Benchmark === bench
                                      ? 'border-[#2563EB] bg-[#2563EB] text-white'
                                      : 'border-[#CBD5E1]'
                                  }`}
                                >
                                  {r13Benchmark === bench && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                                <span>{bench}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Result Brief Cards (strictly adhering to brief specs: height 96-144px, max 168px, <=2 resources) */}
                    
                    {/* 1. Candidate Summary Brief (Round 4) */}
                    {msg.briefType === 'candidate_summary' && (
                      <div className="w-full max-w-[480px] p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#F1F5F9]">
                          <span className="font-bold text-[#0F172A]">候选数据资产 · 2 项</span>
                          <span className="text-[10px] text-[#64748B]">按时间形态与用途区分</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9] space-y-0.5">
                            <div className="font-bold text-[#0F172A] text-[11px]">人口基本信息视图</div>
                            <div className="text-[10px] text-[#64748B]">当前状态 · 一人一行</div>
                            <div className="text-[10px] text-[#EA580C]">问数状态：需申请</div>
                          </div>
                          <div className="p-2 bg-[#EFF6FF]/60 rounded-lg border border-[#BFDBFE] space-y-0.5">
                            <div className="font-bold text-[#1E3A8A] text-[11px] flex items-center space-x-1">
                              <span>常住人口月度快照</span>
                              <span className="text-[9px] bg-[#2563EB] text-white px-1 rounded">推荐</span>
                            </div>
                            <div className="text-[10px] text-[#3B82F6]">历史月度 · 一人一月</div>
                            <div className="text-[10px] text-[#16A34A] font-semibold">问数状态：可使用</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Partial Match Brief (Round 7) */}
                    {msg.briefType === 'partial_match' && (
                      <div className="w-full max-w-[480px] p-3 bg-white border border-[#FED7AA] rounded-xl shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#F1F5F9]">
                          <span className="font-bold text-[#C2410C]">部分匹配 · 1 项</span>
                          <span className="text-[10px] text-[#EA580C] bg-[#FFF7ED] px-1.5 py-0.2 rounded font-semibold border border-[#FFEDD5]">
                            需申请查询
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="font-bold text-[#0F172A]">居家养老服务订单</div>
                          <div className="text-[11px] text-[#475569]">
                            覆盖：居家养老服务实际使用记录
                          </div>
                          <div className="text-[11px] text-[#C2410C] font-medium flex items-center space-x-1">
                            <span>主要缺口：</span>
                            <span>完整养老服务实际使用情况（不含机构养老等）</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Access Brief (Round 10) */}
                    {msg.briefType === 'access_brief' && (
                      <div className="w-full max-w-[480px] p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-xs pb-1 border-b border-[#F1F5F9]">
                          <span className="font-bold text-[#0F172A]">受限与非必要资源检查 · 2 项</span>
                          <span className="text-[10px] text-[#64748B]">建议保留最小方案</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between p-1.5 bg-[#F8FAFC] rounded">
                            <span className="font-medium text-[#334155]">人口基本信息视图</span>
                            <span className="text-[#64748B]">明细候选 · 查询需申请 · 非必需</span>
                          </div>
                          <div className="flex items-center justify-between p-1.5 bg-[#F8FAFC] rounded">
                            <span className="font-medium text-[#334155]">居家养老服务订单</span>
                            <span className="text-[#EA580C]">部分匹配 · 查询需申请 · 缺口保留</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    {msg.actionButtons && (
                      <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-1">
                        {msg.actionButtons.primary && (
                          <button
                            onClick={() => handleAction(msg.actionButtons!.primary!.actionKey)}
                            className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1"
                          >
                            <span>{msg.actionButtons.primary.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {msg.actionButtons.secondary && (
                          <button
                            onClick={() => handleAction(msg.actionButtons!.secondary!.actionKey)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {msg.actionButtons.secondary.label}
                          </button>
                        )}

                        {msg.actionButtons.weak && (
                          <button
                            onClick={() => handleAction(msg.actionButtons!.weak!.actionKey)}
                            className="px-2.5 py-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] text-xs font-medium transition-colors cursor-pointer"
                          >
                            {msg.actionButtons.weak.label}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Fixed Conversation Input Composer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-white shrink-0 z-10">
          <div
            className={`mx-auto transition-all duration-200 ${
              activeSurface === 'CLOSED'
                ? 'max-w-[940px]'
                : 'max-w-[620px]'
            }`}
          >
            {/* Input pill with active context reminder */}
            <div className="rounded-xl border border-[#CBD5E1] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20 bg-white transition-all shadow-2xs p-2 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Xino 智能分析</span>
                  {activeResource && (
                    <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.2 rounded font-semibold border border-[#BFDBFE]">
                      当前焦点：{activeResource}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#94A3B8]">按 Enter 发送</span>
              </div>

              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder="继续提问，或补充你希望分析的范围（例如：比较这两张表、查看字段、打开数据方案…）"
                className="w-full text-xs text-[#0F172A] bg-transparent resize-none focus:outline-none placeholder-[#94A3B8] leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1 border-t border-[#F1F5F9]">
                <div className="flex items-center space-x-1 text-[#64748B]">
                  <button
                    className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] transition-colors cursor-pointer"
                    title="上传附件"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveSurface('SOLUTION')}
                    className="px-2 py-0.8 text-[11px] text-[#475569] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
                  >
                    查看数据方案
                  </button>
                  <button
                    onClick={() => setActiveSurface('FIELDS')}
                    className="px-2 py-0.8 text-[11px] text-[#475569] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
                  >
                    字段列表
                  </button>
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all flex items-center space-x-1 cursor-pointer ${
                    inputMessage.trim()
                      ? 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-2xs'
                      : 'bg-[#CBD5E1] cursor-not-allowed'
                  }`}
                >
                  <span>发送</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================
          3. RIGHT WORKSPACE (GUI on Demand)
             In-page side-by-side flex column (NOT an overlay)
             Width: 560px for COMPARE, 760px for deep workspaces
      ========================================================= */}
      {activeSurface !== 'CLOSED' && (
        <aside
          className={`transition-all duration-200 shrink-0 h-full z-20 ${
            activeSurface === 'COMPARE' ? 'w-[580px]' : 'w-[780px]'
          }`}
        >
          {activeSurface === 'COMPARE' && (
            <RightWorkspaceCompare
              onClose={() => setActiveSurface('CLOSED')}
              selectedResource={activeResource}
              onConfirmSelection={(resourceName) => {
                setActiveResource(resourceName);
                setActiveSurface('CLOSED');
              }}
            />
          )}

          {activeSurface === 'FIELDS' && (
            <RightWorkspaceFields
              onClose={() => setActiveSurface('CLOSED')}
              resourceName={activeResource || '常住人口月度快照'}
            />
          )}

          {activeSurface === 'SOLUTION' && (
            <RightWorkspaceSolution
              onClose={() => setActiveSurface('CLOSED')}
              viewMode={solutionMode}
              onSwitchViewMode={(mode) => setSolutionMode(mode)}
              onNavigateToAskPlan={() => {
                setActiveSurface('ASK_PLAN');
                setActiveMilestone('workspace_ask_plan');
              }}
            />
          )}

          {activeSurface === 'ACCESS' && (
            <RightWorkspaceAccess
              onClose={() => setActiveSurface('CLOSED')}
              onKeepMinimalPlan={() => {
                setSolutionMode('executable');
                setActiveSurface('SOLUTION');
              }}
              onApplyAndProceed={() => {
                alert('已进入权限申请审批通道');
              }}
            />
          )}

          {activeSurface === 'CATALOG' && (
            <RightWorkspaceCatalog
              onClose={() => setActiveSurface('CLOSED')}
              onReturnToAnalysis={() => setActiveSurface('CLOSED')}
              onEvaluateAndAdd={(res) => {
                alert(`正在评估「${res}」：重新核实业务目标需求、资源角色、覆盖提升与使用权限…`);
              }}
              onViewFields={(res) => {
                setActiveResource(res);
                setActiveSurface('FIELDS');
              }}
            />
          )}

          {activeSurface === 'ASK_PLAN' && (
            <RightWorkspaceAskPlan
              onClose={() => setActiveSurface('CLOSED')}
              onReturnToSolution={() => setActiveSurface('SOLUTION')}
              onModifySpec={() => {
                setIsContextDrawerOpen(true);
              }}
            />
          )}
        </aside>
      )}
    </div>
  );
};
