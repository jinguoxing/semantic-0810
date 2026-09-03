import React, { useState, useEffect, useRef, useReducer, useMemo } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Compass,
  Home,
  MessageSquare,
  Bot,
  Send,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

import { FindDataTaskState, ResourceId } from './find_data/model/FindDataTask';
import { findDataReducer, initialFindDataTaskState } from './find_data/model/findDataReducer';
import { createFindDataService } from './find_data/services/createFindDataService';
import {
  selectActiveResource,
  selectResourceById,
  selectResourceFields
} from './find_data/model/findDataSelectors';
import { MINHANG_COMPARISON_ROWS } from './find_data/fixtures/minhangBedSupplyFixture';

// Blocks
import { AssistantTextBlock } from './find_data/blocks/AssistantTextBlock';
import { ClarificationBlock } from './find_data/blocks/ClarificationBlock';
import { ResultBriefBlock } from './find_data/blocks/ResultBriefBlock';
import { ActionGroupBlock } from './find_data/blocks/ActionGroupBlock';
import { RuntimeStatusBlock } from './find_data/blocks/RuntimeStatusBlock';
import { SystemNoticeBlock } from './find_data/blocks/SystemNoticeBlock';

// Right Workspaces
import { RightWorkspaceCompare } from './find_data/RightWorkspaceCompare';
import { RightWorkspaceFields } from './find_data/RightWorkspaceFields';
import { RightWorkspaceSolution } from './find_data/RightWorkspaceSolution';
import { RightWorkspaceAccess } from './find_data/RightWorkspaceAccess';
import { RightWorkspaceCatalog } from './find_data/RightWorkspaceCatalog';
import { RightWorkspaceAskPlan } from './find_data/RightWorkspaceAskPlan';
import { TaskContextDrawer } from './find_data/TaskContextDrawer';

// Brand components
import { BrandLogo } from './brand/BrandLogo';
import { XinoAvatar } from './brand/XinoAvatar';

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
  // Service instance
  const service = useMemo(() => createFindDataService(), []);

  // Reducer
  const [task, dispatch] = useReducer(findDataReducer, initialFindDataTaskState);

  // Local UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [solutionMode, setSolutionMode] = useState<'recommended' | 'executable'>('recommended');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);

  // Check if developer query param exists for debug milestones
  const showDevMilestones = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      import.meta.env.DEV &&
      new URLSearchParams(window.location.search).has('demoStage')
    );
  }, []);

  // Initialize task on mount or when initialQuery changes
  useEffect(() => {
    let mounted = true;
    async function initTask() {
      const newTask = await service.createTask({ initialQuery });
      if (mounted) {
        dispatch({
          type: 'TASK_CREATED',
          payload: { task: newTask }
        });
      }
    }
    initTask();
    return () => {
      mounted = false;
    };
  }, [service, initialQuery]);

  // Scroll to bottom on new turns
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.turns, task.runtimeStatus]);

  // Sidebar mock history
  const recentSessions = [
    { id: 's1', title: '闵行区老年人口与养老床位供给水平分析', time: '进行中', active: true },
    { id: 's2', title: '出生、死亡、迁入迁出事件记录', time: '昨天', active: false },
    { id: 's3', title: '公共服务热线工单办结分析', time: '前天', active: false }
  ];

  const filteredSessions = recentSessions.filter((s) =>
    s.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Send a user turn
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim();
    setInputMessage('');

    const turnId = `turn_user_${Date.now()}`;
    dispatch({
      type: 'USER_TURN_SUBMITTED',
      payload: { text, turnId }
    });

    const engineResult = await service.submitTurn(task, text);
    for (const ev of engineResult.events) {
      dispatch(ev);
    }
  };

  // Execute typed actions from blocks or workspaces
  const handleAction = async (actionCode: string, payload?: Record<string, unknown>) => {
    if (actionCode === 'CLOSE_SURFACE') {
      dispatch({ type: 'SURFACE_CLOSED' });
      return;
    }

    if (actionCode === 'MODIFY_UNDERSTANDING' || actionCode === 'MODIFY_SPEC') {
      setIsContextDrawerOpen(true);
      return;
    }

    const engineResult = await service.executeAction(task, { actionCode, payload });
    for (const ev of engineResult.events) {
      dispatch(ev);
    }
  };

  // Run Ask Plan workflow
  const handleRunAskPlan = async () => {
    if (!task.askPlan) return;

    // 1. Recheck permissions first
    dispatch({
      type: 'PERMISSION_RECHECK_STARTED',
      payload: { resourceIds: task.askPlan.coreResourceIds }
    });

    const checkResult = await service.recheckPermissions(
      task,
      task.askPlan.coreResourceIds,
      'query'
    );

    dispatch({
      type: 'PERMISSION_RECHECK_COMPLETED',
      payload: {
        decision: checkResult.decision,
        updatedPermissions: checkResult.updatedPermissions
      }
    });

    if (checkResult.decision === 'BLOCKED') {
      dispatch({
        type: 'ASK_RUN_FAILED',
        payload: { error: '查询权限未通过校验，无法执行。' }
      });
      return;
    }

    // 2. Run plan
    dispatch({ type: 'ASK_RUN_STARTED' });

    const runResult = await service.runAskPlan(task, task.askPlan);

    if (runResult.success) {
      dispatch({
        type: 'ASK_RUN_COMPLETED',
        payload: { result: runResult }
      });

      if (runResult.resultArtifact) {
        const artifact = runResult.resultArtifact;
        const conclusionText = `### 分析基线核查结论（2026.08 最新月度）\n\n- **全区加权平均供给水平**：**${artifact.districtWeightedAverage}**（全区 60 岁以上常住人口约 ${artifact.totalPopulation}，在营可用养老床位共 ${artifact.totalBeds}）。\n- **相对供给偏低街镇（建议进一步核查）**：\n${artifact.lowSupplyTowns.map((t) => `  • **${t.townName}**：供给水平为 **${t.supplyRatio}**（${t.differencePct}）`).join('\n')}\n\n**结论合规与边界声明**：\n${artifact.boundaryNotice}`;

        dispatch({
          type: 'ASSISTANT_TURN_RECEIVED',
          payload: {
            turnId: `turn_conclusion_${Date.now()}`,
            blocks: [
              {
                type: 'TEXT',
                id: `txt_conclusion_${Date.now()}`,
                content: conclusionText
              }
            ]
          }
        });
      }
    } else {
      dispatch({
        type: 'ASK_RUN_FAILED',
        payload: { error: runResult.error || '执行分析计算失败' }
      });
    }
  };

  const activeSurfaceType = task.activeSurface.type;
  const isSurfaceOpen = activeSurfaceType !== 'CLOSED';
  const activeResource = selectActiveResource(task);

  // Target resource for Fields workspace
  const targetFieldResourceId =
    task.activeSurface.resourceIds?.[0] || task.activeResourceId || 'r03';
  const targetFieldResource = selectResourceById(task, targetFieldResourceId);
  const targetFieldList = selectResourceFields(task, targetFieldResourceId);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#0F172A] relative">
      <TaskContextDrawer
        isOpen={isContextDrawerOpen}
        onClose={() => setIsContextDrawerOpen(false)}
        hypothesis={task.requirementHypothesis}
        activeResourceName={activeResource?.name}
        onApplyChanges={(updated) => {
          dispatch({
            type: 'REQUIREMENT_UPDATED',
            payload: { hypothesis: updated }
          });
        }}
      />

      {/* 1. LEFT SIDEBAR */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-14' : 'w-[264px]'
        } bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 transition-all duration-200 z-20 select-none`}
      >
        <div className="h-14 px-3.5 border-b border-[#F1F5F9] flex items-center justify-between shrink-0">
          {!isSidebarCollapsed ? (
            <BrandLogo size="md" showText={true} />
          ) : (
            <BrandLogo size="md" showText={false} className="mx-auto" />
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

        {/* Primary Action Button */}
        <div className="p-3 border-b border-[#F1F5F9]">
          <button
            onClick={async () => {
              const newTask = await service.createTask({ initialQuery: '' });
              dispatch({
                type: 'TASK_CREATED',
                payload: { task: newTask }
              });
            }}
            className="w-full py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {!isSidebarCollapsed && <span>新建任务</span>}
          </button>
        </div>

        {/* Entrances */}
        <div className="p-2 space-y-0.5 border-b border-[#F1F5F9] text-xs">
          <button className="w-full px-2.5 py-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-bold flex items-center justify-between group transition-colors cursor-pointer">
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
            onClick={() => (onBackToHome ? onBackToHome() : onNavigateToNav && onNavigateToNav('home'))}
            className="w-full px-2.5 py-1.5 rounded-lg text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-medium flex items-center justify-between group transition-colors cursor-pointer"
            title="返回 AI 工作台"
          >
            <div className="flex items-center space-x-2.5">
              <Home className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
              {!isSidebarCollapsed && <span>返回 AI 工作台</span>}
            </div>
          </button>
        </div>

        {/* Recent Sessions */}
        {!isSidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar text-xs">
            <div className="px-2 py-1 text-[11px] font-bold text-[#94A3B8]">
              近期找数据任务
            </div>
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`p-2.5 rounded-lg transition-colors cursor-pointer flex flex-col space-y-0.5 ${
                  session.active
                    ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
                    : 'text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="truncate">{session.title}</span>
                </div>
                <div className="text-[10px] text-[#94A3B8]">{session.time}</div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* 2. MIDDLE CONVERSATION AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC] relative">
        {/* Top Header & Context Bar */}
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
                  {task.title}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-semibold border border-[#BFDBFE] shrink-0">
                  数据助手 · 找数据
                </span>
              </div>

              {/* Lightweight Context Bar */}
              <div className="flex items-center space-x-2 text-[11px] text-[#64748B] mt-0.5">
                <span>区域：{task.requirementHypothesis.region || '未指定'}</span>
                <span className="text-[#CBD5E1]">·</span>
                <span>
                  时间：{task.requirementHypothesis.timeRange?.start || '2025.09'} —{' '}
                  {task.requirementHypothesis.timeRange?.end || '2026.08'}
                </span>
                <span className="text-[#CBD5E1]">·</span>
                <span>
                  焦点：
                  <span className="font-semibold text-[#0F172A]">
                    {activeResource ? activeResource.name : '整体方案'}
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

          {/* Quick Surface Toggles */}
          <div className="flex items-center space-x-2 shrink-0">
            {isSurfaceOpen && (
              <button
                onClick={() => dispatch({ type: 'SURFACE_CLOSED' })}
                className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer border border-[#E2E8F0]"
              >
                收起右侧工作区
              </button>
            )}

            <div className="flex items-center space-x-1 bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0] text-xs">
              <button
                onClick={() =>
                  dispatch(
                    activeSurfaceType === 'SOLUTION'
                      ? { type: 'SURFACE_CLOSED' }
                      : { type: 'SURFACE_OPENED', payload: { type: 'SOLUTION' } }
                  )
                }
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  activeSurfaceType === 'SOLUTION'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                数据方案
              </button>
              <button
                onClick={() =>
                  dispatch(
                    activeSurfaceType === 'FIELDS'
                      ? { type: 'SURFACE_CLOSED' }
                      : {
                          type: 'SURFACE_OPENED',
                          payload: { type: 'FIELDS', resourceIds: [task.activeResourceId || 'r03'] }
                        }
                  )
                }
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  activeSurfaceType === 'FIELDS'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                字段
              </button>
              <button
                onClick={() =>
                  dispatch(
                    activeSurfaceType === 'ASK_PLAN'
                      ? { type: 'SURFACE_CLOSED' }
                      : { type: 'SURFACE_OPENED', payload: { type: 'ASK_PLAN' } }
                  )
                }
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  activeSurfaceType === 'ASK_PLAN'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                分析计划
              </button>
            </div>
          </div>
        </header>

        {/* Vertically Scrollable Conversation Stream */}
        <div
          ref={conversationScrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar"
        >
          {/* Centralized Reading Column:
              880-1040px when surface is closed; narrower when surface is open. */}
          <div
            className={`mx-auto space-y-5 transition-all duration-200 ${
              isSurfaceOpen ? 'max-w-2xl' : 'max-w-4xl'
            }`}
          >
            {task.turns.map((turn) => {
              const isUser = turn.sender === 'USER';

              return (
                <div
                  key={turn.turnId}
                  className={`flex items-start space-x-3 ${
                    isUser ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  {isUser ? (
                    <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white font-bold flex items-center justify-center shrink-0 shadow-2xs text-xs">
                      我
                    </div>
                  ) : (
                    <XinoAvatar size="md" />
                  )}

                  {/* Message Bubble Column */}
                  <div
                    className={`flex flex-col space-y-2.5 max-w-[85%] ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    {turn.blocks.map((block) => {
                      switch (block.type) {
                        case 'TEXT':
                          return isUser ? (
                            <div
                              key={block.id}
                              className="px-4 py-2.5 rounded-2xl bg-[#2563EB] text-white text-xs leading-relaxed shadow-2xs"
                            >
                              {block.content}
                            </div>
                          ) : (
                            <div
                              key={block.id}
                              className="py-1 text-xs text-[#0F172A] leading-relaxed w-full"
                            >
                              <AssistantTextBlock content={block.content} />
                            </div>
                          );

                        case 'CLARIFICATION':
                          return (
                            <div key={block.id} className="w-full">
                              <ClarificationBlock
                                question={block.question}
                                onSelectionChange={(selectedIds) => {
                                  dispatch({
                                    type: 'REQUIREMENT_UPDATED',
                                    payload: {
                                      hypothesis: {
                                        analysisFocus: selectedIds
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                          );

                        case 'RESULT_BRIEF':
                          return (
                            <div key={block.id} className="w-full">
                              <ResultBriefBlock
                                block={block}
                                onActionClick={(code, p) => handleAction(code, p)}
                              />
                            </div>
                          );

                        case 'ACTION_GROUP':
                          return (
                            <div key={block.id} className="w-full">
                              <ActionGroupBlock
                                actions={block.actions}
                                onActionClick={(code, p) => handleAction(code, p)}
                              />
                            </div>
                          );

                        case 'RUNTIME_STATUS':
                          return (
                            <div key={block.id} className="w-full">
                              <RuntimeStatusBlock message={block.message} />
                            </div>
                          );

                        case 'SYSTEM_NOTICE':
                          return (
                            <div key={block.id} className="w-full">
                              <SystemNoticeBlock
                                level={block.level}
                                title={block.title}
                                message={block.message}
                              />
                            </div>
                          );

                        default:
                          return null;
                      }
                    })}
                  </div>
                </div>
              );
            })}

            {/* Transient Runtime Status Indicator */}
            {task.runtimeStatus?.active && (
              <div className="flex items-center space-x-3">
                <XinoAvatar size="md" />
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
                  <RuntimeStatusBlock message={task.runtimeStatus.message} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Message Input */}
        <footer className="p-4 bg-white border-t border-[#E2E8F0] shrink-0">
          <div
            className={`mx-auto transition-all duration-200 ${
              isSurfaceOpen ? 'max-w-2xl' : 'max-w-4xl'
            }`}
          >
            <div className="flex items-center space-x-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-1.5 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition-all">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="向 Xino 发送找数据意图、提出追问或输入口径调整要求…"
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  inputMessage.trim()
                    ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-2xs'
                    : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] px-2 pt-1.5">
              <span>按 Enter 发送</span>
              <span>Xino 数据语义理解引擎</span>
            </div>
          </div>
        </footer>
      </main>

      {/* 3. RIGHT WORKSPACE AREA (480-600px, dynamically mounted based on task.activeSurface) */}
      {isSurfaceOpen && (
        <aside className="w-[520px] shrink-0 z-10 overflow-hidden">
          {activeSurfaceType === 'COMPARE' && (
            <RightWorkspaceCompare
              resources={[task.resources.r02, task.resources.r03].filter(Boolean)}
              comparisonRows={MINHANG_COMPARISON_ROWS}
              selectedResourceId={task.activeResourceId || 'r03'}
              onConfirmSelection={(resId) => {
                handleAction('SELECT_RESOURCE', { resourceId: resId });
                // Return to conversation or solution
                dispatch({
                  type: 'SURFACE_OPENED',
                  payload: { type: 'SOLUTION' }
                });
              }}
              onViewFields={(resId) => {
                handleAction('OPEN_FIELDS', { resourceId: resId });
              }}
              onClose={() => dispatch({ type: 'SURFACE_CLOSED' })}
            />
          )}

          {activeSurfaceType === 'FIELDS' && (
            <RightWorkspaceFields
              resource={targetFieldResource}
              fields={targetFieldList}
              onClose={() => dispatch({ type: 'SURFACE_CLOSED' })}
              onBackToSolution={() =>
                dispatch({ type: 'SURFACE_OPENED', payload: { type: 'SOLUTION' } })
              }
            />
          )}

          {activeSurfaceType === 'SOLUTION' && (
            <RightWorkspaceSolution
              task={task}
              mode={solutionMode}
              onModeChange={(m) => setSolutionMode(m)}
              onAction={(code, p) => handleAction(code, p)}
              onClose={() => dispatch({ type: 'SURFACE_CLOSED' })}
            />
          )}

          {activeSurfaceType === 'ACCESS' && (
            <RightWorkspaceAccess
              task={task}
              onAction={(code, p) => handleAction(code, p)}
              onClose={() => dispatch({ type: 'SURFACE_CLOSED' })}
            />
          )}

          {activeSurfaceType === 'CATALOG' && (
            <RightWorkspaceCatalog
              task={task}
              onClose={() => dispatch({ type: 'SURFACE_CLOSED' })}
              onReturnToAnalysis={() =>
                dispatch({ type: 'SURFACE_OPENED', payload: { type: 'SOLUTION' } })
              }
              onAction={(code, p) => handleAction(code, p)}
              onViewFields={(resId) => {
                handleAction('OPEN_FIELDS', { resourceId: resId });
              }}
            />
          )}

          {activeSurfaceType === 'ASK_PLAN' && (
            <RightWorkspaceAskPlan
              task={task}
              onRunPlan={handleRunAskPlan}
              onReturnToSolution={() =>
                dispatch({ type: 'SURFACE_OPENED', payload: { type: 'SOLUTION' } })
              }
              onModifySpec={() => setIsContextDrawerOpen(true)}
              onClose={() => dispatch({ type: 'SURFACE_CLOSED' })}
            />
          )}
        </aside>
      )}
    </div>
  );
};
