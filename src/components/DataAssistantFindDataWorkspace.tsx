import React, { useState, useEffect, useRef, useReducer, useMemo, useCallback } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Compass,
  Home,
  Bot,
  Send,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Trash2
} from 'lucide-react';

import { FindDataTaskState, ResourceId } from './find_data/model/FindDataTask';
import { findDataReducer, initialFindDataTaskState } from './find_data/model/findDataReducer';
import { createFindDataService } from './find_data/services/createFindDataService';
import { defaultTaskStore } from './find_data/model/findDataStore';
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
  const [savedTaskList, setSavedTaskList] = useState(() => defaultTaskStore.list());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);

  // Keep saved task list updated & persist current task
  const refreshTaskList = useCallback(() => {
    setSavedTaskList(defaultTaskStore.list());
  }, []);

  useEffect(() => {
    if (task.taskId) {
      defaultTaskStore.save(task);
      defaultTaskStore.setCurrentTaskId(task.taskId);
      refreshTaskList();
    }
  }, [task, refreshTaskList]);

  // Unified Turn Pipeline (P0-02):
  // When initialQuery is provided, initialize a truly clean IDLE task, then submit the query as Turn 1
  useEffect(() => {
    let mounted = true;

    async function initTaskPipeline() {
      const cleanTask = await service.createTask({ initialQuery: '' });
      if (!mounted) return;

      if (!initialQuery || !initialQuery.trim()) {
        dispatch({
          type: 'TASK_CREATED',
          payload: { task: cleanTask }
        });
        defaultTaskStore.save(cleanTask);
        return;
      }

      // Initial query provided: dispatch task creation then submitTurn
      dispatch({
        type: 'TASK_CREATED',
        payload: { task: cleanTask }
      });

      const turnId = `turn_user_${Date.now()}`;
      dispatch({
        type: 'USER_TURN_SUBMITTED',
        payload: { text: initialQuery.trim(), turnId }
      });

      const engineResult = await service.submitTurn(cleanTask, initialQuery.trim());
      if (!mounted) return;

      for (const ev of engineResult.events) {
        dispatch(ev);
      }
    }

    initTaskPipeline();

    return () => {
      mounted = false;
    };
  }, [service, initialQuery]);

  // Scroll to bottom on new turns
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.turns, task.runtimeStatus]);

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

  // Switch task
  const handleSwitchTask = (taskId: string) => {
    const loaded = defaultTaskStore.get(taskId);
    if (loaded) {
      dispatch({
        type: 'TASK_CREATED',
        payload: { task: loaded }
      });
      defaultTaskStore.setCurrentTaskId(taskId);
    }
  };

  // Create new clean task
  const handleCreateNewTask = async () => {
    const newTask = await service.createTask({ initialQuery: '' });
    dispatch({
      type: 'TASK_CREATED',
      payload: { task: newTask }
    });
    defaultTaskStore.save(newTask);
    defaultTaskStore.setCurrentTaskId(newTask.taskId);
    refreshTaskList();
  };

  // Delete task from store
  const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    defaultTaskStore.delete(taskId);
    refreshTaskList();
    if (task.taskId === taskId) {
      handleCreateNewTask();
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

    if (actionCode === 'SUBMIT_CLARIFICATION') {
      dispatch({
        type: 'SUBMIT_CLARIFICATION',
        payload: {
          questionId: (payload?.questionId as string) || 'cq01',
          selectedOptionIds: (payload?.selectedOptionIds as string[]) || []
        }
      });
    }

    const engineResult = await service.executeAction(task, { actionCode, payload });
    for (const ev of engineResult.events) {
      dispatch(ev);
    }
  };

  // Check permission for Ask Plan (P0-14 strict state machine)
  const handleCheckPermissionForAskPlan = async (): Promise<boolean> => {
    if (!task.askPlan) return false;

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

    return checkResult.decision === 'ALLOWED';
  };

  // Run Ask Plan workflow (P0-15: Result isolation)
  const handleRunAskPlan = async () => {
    if (!task.askPlan) return;

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

  // Surface width governance (P1-03):
  // QUICK_PREVIEW: 560px, WORKBENCH: 780px
  const surfaceWidthClass =
    task.activeSurface.mode === 'QUICK_PREVIEW' ? 'w-[560px]' : 'w-[780px]';

  // Target resource for Fields workspace
  const targetFieldResourceId =
    task.activeSurface.resourceIds?.[0] || task.activeResourceId || 'r03';
  const targetFieldResource = selectResourceById(task, targetFieldResourceId);
  const targetFieldList = selectResourceFields(task, targetFieldResourceId);

  // Filter sessions
  const filteredSessions = savedTaskList.filter((s) =>
    s.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#0F172A] relative">
      <TaskContextDrawer
        isOpen={isContextDrawerOpen}
        onClose={() => setIsContextDrawerOpen(false)}
        hypothesis={task.requirementHypothesis}
        activeResourceName={activeResource?.name}
        onApplyChanges={(updated) => {
          handleAction('REVISE_REQUIREMENT', { hypothesisPatch: updated });
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
            onClick={handleCreateNewTask}
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

        {/* Recent Sessions from defaultTaskStore */}
        {!isSidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar text-xs">
            <div className="px-2 py-1 text-[11px] font-bold text-[#94A3B8]">
              任务历史（{filteredSessions.length}）
            </div>
            {filteredSessions.length === 0 ? (
              <div className="px-2 py-4 text-center text-[#94A3B8] text-[11px]">
                暂无历史任务
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.taskId === task.taskId;
                return (
                  <div
                    key={session.taskId}
                    onClick={() => handleSwitchTask(session.taskId)}
                    className={`group p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
                        : 'text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="truncate text-xs">{session.title}</span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(e, session.taskId)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-[#DC2626] rounded transition-opacity"
                      title="删除任务"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </aside>

      {/* 2. MIDDLE CONVERSATION AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC] relative">
        {/* Top Header & Context Bar (P1-02: Clean header, state-aware surface toggles) */}
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
                  <span>查看口径上下文</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Surface Toggles: Bound to task readiness (P1-02) */}
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
                disabled={task.dataSolution.items.length === 0}
                onClick={() =>
                  dispatch(
                    activeSurfaceType === 'SOLUTION'
                      ? { type: 'SURFACE_CLOSED' }
                      : { type: 'SURFACE_OPENED', payload: { type: 'SOLUTION' } }
                  )
                }
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  task.dataSolution.items.length === 0
                    ? 'text-[#94A3B8] cursor-not-allowed'
                    : activeSurfaceType === 'SOLUTION'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs cursor-pointer'
                    : 'text-[#64748B] hover:text-[#0F172A] cursor-pointer'
                }`}
              >
                数据方案
              </button>
              <button
                disabled={!targetFieldResource}
                onClick={() =>
                  dispatch(
                    activeSurfaceType === 'FIELDS'
                      ? { type: 'SURFACE_CLOSED' }
                      : {
                          type: 'SURFACE_OPENED',
                          payload: { type: 'FIELDS', resourceIds: [targetFieldResourceId] }
                        }
                  )
                }
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  !targetFieldResource
                    ? 'text-[#94A3B8] cursor-not-allowed'
                    : activeSurfaceType === 'FIELDS'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs cursor-pointer'
                    : 'text-[#64748B] hover:text-[#0F172A] cursor-pointer'
                }`}
              >
                字段检视
              </button>
              <button
                disabled={!task.askPlan}
                onClick={() =>
                  dispatch(
                    activeSurfaceType === 'ASK_PLAN'
                      ? { type: 'SURFACE_CLOSED' }
                      : { type: 'SURFACE_OPENED', payload: { type: 'ASK_PLAN' } }
                  )
                }
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  !task.askPlan
                    ? 'text-[#94A3B8] cursor-not-allowed'
                    : activeSurfaceType === 'ASK_PLAN'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs cursor-pointer'
                    : 'text-[#64748B] hover:text-[#0F172A] cursor-pointer'
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
          <div
            className={`mx-auto space-y-5 transition-all duration-200 ${
              isSurfaceOpen ? 'max-w-2xl' : 'max-w-4xl'
            }`}
          >
            {task.turns.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 text-xs">
                <Bot className="w-10 h-10 text-[#CBD5E1]" />
                <p className="font-bold text-sm text-[#0F172A]">请输入找数据意图</p>
                <p className="text-[#64748B] max-w-sm">
                  例如：“我想评估闵行区过去12个月养老服务供给情况，需要哪些数据？”
                </p>
              </div>
            ) : (
              task.turns.map((turn) => {
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
                                  onSubmit={(qId, optIds) => {
                                    handleAction('SUBMIT_CLARIFICATION', {
                                      questionId: qId,
                                      selectedOptionIds: optIds
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
              })
            )}

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
                placeholder="发送找数据意图、提出追问或输入口径调整要求…"
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
              <span>数据资产找数分析工作台</span>
            </div>
          </div>
        </footer>
      </main>

      {/* 3. RIGHT WORKSPACE AREA (P1-03: QUICK_PREVIEW: 560px, WORKBENCH: 780px) */}
      {isSurfaceOpen && (
        <aside className={`${surfaceWidthClass} shrink-0 z-10 overflow-hidden`}>
          {activeSurfaceType === 'COMPARE' && (
            <RightWorkspaceCompare
              resources={[task.resources.r02, task.resources.r03].filter(Boolean)}
              comparisonRows={task.comparisonModel?.rows || MINHANG_COMPARISON_ROWS}
              recommendationConclusion={task.comparisonModel?.conclusion}
              selectedResourceId={task.activeResourceId || 'r03'}
              onConfirmSelection={(resId) => {
                handleAction('SELECT_RESOURCE', { resourceId: resId });
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
              onCheckPermission={handleCheckPermissionForAskPlan}
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
