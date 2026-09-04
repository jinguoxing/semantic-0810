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

import { AskPlan, AskRunResult, FindDataTaskState, PendingOperation, TaskActionCode } from './find_data/model/FindDataTask';
import { FindDataEvent } from './find_data/model/findDataEvents';
import { findDataReducer, initialFindDataTaskState } from './find_data/model/findDataReducer';
import {
  createFindDataService,
  resolveFindDataServiceMode,
  FindDataServiceMode
} from './find_data/services/createFindDataService';
import { createFindDataTaskStore, FindDataTaskStore } from './find_data/model/findDataStore';
import { createFindDataTask } from './find_data/model/createFindDataTask';
import {
  FindDataEngineResult,
  FindDataService,
  FindDataTaskSummary,
  PermissionRecheckResult
} from './find_data/services/FindDataService';
import { SurfaceCommand } from './find_data/policy/surfacePolicy';
import {
  selectActiveResource,
  selectResourceById,
  selectResourceFields
} from './find_data/model/findDataSelectors';

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
  serviceOverride?: FindDataService;
  taskStoreOverride?: FindDataTaskStore;
  /** Dependency-injection seam for service-mode lifecycle tests. */
  serviceModeOverride?: FindDataServiceMode;
}

let uiSequence = 0;
const createUiId = (prefix: string) => {
  uiSequence += 1;
  return `${prefix}_${Date.now().toString(36)}_${uiSequence.toString(36)}`;
};

const askPlanStatusLabels: Record<AskPlan['status'], string> = {
  DRAFT: '草稿',
  READY_TO_RUN: '待确认',
  RUNNING: '执行中',
  COMPLETED: '已完成',
  FAILED: '执行失败'
};

function toTaskSummary(task: FindDataTaskState): FindDataTaskSummary {
  const { taskId, title, status, updatedAt, scenarioKey } = task;
  return { taskId, title, status, updatedAt, scenarioKey };
}

function getTaskIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('findTaskId');
}

function replaceTaskIdInUrl(taskId: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('findTaskId', taskId);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function askRunCompletionMessage(plan: AskPlan, result: AskRunResult): string {
  const count = result.resultArtifact?.townResults.length ?? 0;
  if (plan.calculationSpec.benchmarkRule === 'RANK_ONLY') {
    return `分析已完成，已生成 ${count} 个街镇的指标排名。完整结果和边界说明已在右侧展示。`;
  }
  if (plan.calculationSpec.benchmarkRule === 'POLICY_TARGET') {
    return `分析已完成，已按计划登记的政策目标生成 ${count} 个街镇比较结果。完整结果和边界说明已在右侧展示。`;
  }
  return `分析已完成，识别出 ${count} 个供给水平相对全区加权平均偏低的街镇。完整结果和边界说明已在右侧展示。`;
}

export const DataAssistantFindDataWorkspace: React.FC<DataAssistantFindDataWorkspaceProps> = ({
  initialQuery,
  onNavigateToNav,
  onBackToHome,
  serviceOverride,
  taskStoreOverride,
  serviceModeOverride
}) => {
  const serviceMode = useMemo(
    () => serviceModeOverride ?? resolveFindDataServiceMode(import.meta.env.VITE_FIND_DATA_MODE as string | undefined),
    [serviceModeOverride]
  );
  const service = useMemo(() => serviceOverride ?? createFindDataService(serviceMode), [serviceMode, serviceOverride]);
  const taskStore = useMemo(() => taskStoreOverride ?? createFindDataTaskStore(serviceMode), [serviceMode, taskStoreOverride]);
  const [task, dispatch] = useReducer(findDataReducer, initialFindDataTaskState);
  const taskRef = useRef<FindDataTaskState>(task);

  // Local UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [solutionMode, setSolutionMode] = useState<'recommended' | 'executable'>('recommended');
  const [savedTaskList, setSavedTaskList] = useState<FindDataTaskSummary[]>(() => taskStore.list().map(toTaskSummary));
  const [clarificationErrors, setClarificationErrors] = useState<Record<string, string>>({});
  const [clarificationSubmittingId, setClarificationSubmittingId] = useState<string>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  const dispatchTracked = useCallback((event: FindDataEvent) => {
    taskRef.current = findDataReducer(taskRef.current, event);
    dispatch(event);
    return taskRef.current;
  }, []);

  const dispatchTrackedEvents = useCallback((events: FindDataEvent[]) => {
    for (const event of events) dispatchTracked(event);
    return taskRef.current;
  }, [dispatchTracked]);

  const refreshTaskList = useCallback(async () => {
    if (serviceMode === 'http') {
      try {
        setSavedTaskList(await service.listTasks());
      } catch {
        setSavedTaskList([]);
      }
      return;
    }
    setSavedTaskList(taskStore.list().map(toTaskSummary));
  }, [service, serviceMode, taskStore]);

  const startOperation = useCallback((operationType: PendingOperation['operationType']): string | undefined => {
    if (taskRef.current.pendingOperation) return undefined;
    const operationId = createUiId('operation');
    dispatchTracked({
      type: 'OPERATION_STARTED',
      payload: { operationId, operationType, startedAt: new Date().toISOString() }
    });
    return operationId;
  }, [dispatchTracked]);

  const applySurfaceCommand = useCallback((command?: SurfaceCommand) => {
    if (!command) return;
    if (command.blockedReason) {
      dispatchTracked({
        type: 'ASSISTANT_TURN_RECEIVED',
        payload: {
          turnId: createUiId('surface_blocked'),
          nextStatus: taskRef.current.status,
          blocks: [{
            type: 'SYSTEM_NOTICE',
            id: createUiId('notice'),
            level: 'info',
            message: command.blockedReason
          }]
        }
      });
      return;
    }
    if ((command.action === 'OPEN' || command.action === 'REPLACE') && command.surface) {
      dispatchTracked({
        type: 'SURFACE_OPENED',
        payload: {
          type: command.surface,
          mode: command.mode,
          resourceIds: command.resourceIds,
          openedBy: command.openedBy
        }
      });
    } else if (command.action === 'CLOSE') {
      dispatchTracked({ type: 'SURFACE_CLOSED' });
    }
  }, [dispatchTracked]);

  const applyEngineResult = useCallback((result: FindDataEngineResult) => {
    if (result.taskId !== taskRef.current.taskId) return false;
    if (taskRef.current.pendingOperation && result.operationId !== taskRef.current.pendingOperation.operationId) return false;
    dispatchTrackedEvents(result.events);
    applySurfaceCommand(result.surfaceCommand);
    if (taskRef.current.pendingOperation?.operationId === result.operationId) {
      dispatchTracked({ type: 'OPERATION_COMPLETED', payload: { operationId: result.operationId } });
    }
    return true;
  }, [applySurfaceCommand, dispatchTracked, dispatchTrackedEvents]);

  const applyServiceFailure = useCallback((taskId: string, error: unknown, operationId?: string) => {
    if (taskId !== taskRef.current.taskId) return;
    if (operationId && taskRef.current.pendingOperation?.operationId !== operationId) return;
    if (operationId) dispatchTracked({ type: 'OPERATION_FAILED', payload: { operationId } });
    dispatchTracked({
      type: 'ASSISTANT_TURN_RECEIVED',
      payload: {
        turnId: createUiId('service_failure'),
        nextStatus: 'FAILED',
        blocks: [{
          type: 'SYSTEM_NOTICE',
          id: createUiId('notice'),
          level: 'error',
          message: error instanceof Error ? error.message : '数据服务请求失败，请稍后重试。'
        }]
      }
    });
  }, [dispatchTracked]);

  const persistTask = useCallback((taskToSave: FindDataTaskState = taskRef.current) => {
    if (serviceMode === 'http') return;
    if (!taskToSave.taskId) return;
    taskStore.save(taskToSave);
    taskStore.setCurrentTaskId(taskToSave.taskId);
  }, [serviceMode, taskStore]);

  useEffect(() => {
    if (!task.taskId) return;
    const timer = window.setTimeout(() => {
      persistTask(task);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [task, persistTask]);

  useEffect(() => {
    if (task.taskId) void refreshTaskList();
  }, [task.taskId, task.title, task.status, refreshTaskList]);

  useEffect(() => {
    let cancelled = false;

    async function initTaskPipeline() {
      if (!initialQuery?.trim()) {
        const requestedTaskId = getTaskIdFromUrl();
        if (requestedTaskId) {
          try {
            const restored = serviceMode === 'http'
              ? await service.getTask(requestedTaskId)
              : taskStore.load(requestedTaskId);
            if (restored && !cancelled) {
              dispatchTracked({ type: 'TASK_HYDRATED', payload: { task: restored } });
              return;
            }
          } catch (error: unknown) {
            if (!cancelled) applyServiceFailure(taskRef.current.taskId, error);
          }
        }
        // HTTP tasks are owned by the backend and must never be reconstructed
        // from a browser cache. Mock and disconnected modes can safely restore
        // the task store used by their local/demo runtime.
        const currentTaskId = serviceMode !== 'http' ? taskStore.getCurrentTaskId() : null;
        if (currentTaskId) {
          const restored = taskStore.load(currentTaskId);
          if (restored && !cancelled) {
            dispatchTracked({ type: 'TASK_HYDRATED', payload: { task: restored } });
            return;
          }
        }
      }

      let cleanTask: FindDataTaskState;
      try {
        cleanTask = await service.createTask({ initialQuery: '' });
      } catch (error: unknown) {
        if (cancelled) return;
        const failedTask = createFindDataTask({ taskId: createUiId('failed_task') });
        dispatchTracked({ type: 'TASK_CREATED', payload: { task: failedTask } });
        applyServiceFailure(failedTask.taskId, error);
        return;
      }
      if (cancelled) return;
      dispatchTracked({ type: 'TASK_CREATED', payload: { task: cleanTask } });
      replaceTaskIdInUrl(cleanTask.taskId);

      if (!initialQuery || !initialQuery.trim()) {
        if (serviceMode !== 'http') {
          taskStore.save(cleanTask);
          taskStore.setCurrentTaskId(cleanTask.taskId);
        }
        replaceTaskIdInUrl(cleanTask.taskId);
        void refreshTaskList();
        return;
      }

      const text = initialQuery.trim();
      const operationId = startOperation('TURN');
      if (!operationId) return;
      dispatchTracked({
        type: 'USER_TURN_SUBMITTED',
        payload: { text, turnId: createUiId('user') }
      });
      const submittedTaskId = taskRef.current.taskId;
      try {
        const engineResult = await service.submitTurn(taskRef.current, text, operationId);
        if (!cancelled) applyEngineResult(engineResult);
      } catch (error: unknown) {
        if (!cancelled) applyServiceFailure(submittedTaskId, error, operationId);
      }
    }

    void initTaskPipeline();

    return () => {
      cancelled = true;
    };
  }, [service, serviceMode, taskStore, initialQuery, dispatchTracked, applyEngineResult, applyServiceFailure, refreshTaskList, startOperation]);

  // Scroll to bottom on new turns
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.turns, task.runtimeStatus]);

  const isInputBlocked = task.status === 'UNDERSTANDING' || task.status === 'SEARCHING' || !!task.runtimeStatus?.active || !!task.pendingOperation;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isInputBlocked) return;
    const text = inputMessage.trim();
    const operationId = startOperation('TURN');
    if (!operationId) return;
    setInputMessage('');
    dispatchTracked({
      type: 'USER_TURN_SUBMITTED',
      payload: { text, turnId: createUiId('user') }
    });
    const submittedTaskId = taskRef.current.taskId;
    try {
      const engineResult = await service.submitTurn(taskRef.current, text, operationId);
      applyEngineResult(engineResult);
    } catch (error: unknown) {
      applyServiceFailure(submittedTaskId, error, operationId);
    }
  };

  const handleSwitchTask = async (taskId: string) => {
    if (taskRef.current.taskId && taskRef.current.taskId !== taskId) persistTask();
    try {
      const loaded = serviceMode === 'http' ? await service.getTask(taskId) : taskStore.load(taskId);
      if (loaded) {
        dispatchTracked({ type: 'TASK_HYDRATED', payload: { task: loaded } });
        if (serviceMode !== 'http') taskStore.setCurrentTaskId(taskId);
        replaceTaskIdInUrl(taskId);
        void refreshTaskList();
      }
    } catch (error: unknown) {
      applyServiceFailure(taskRef.current.taskId, error);
    }
  };

  const handleCreateNewTask = async (saveCurrent = true) => {
    if (saveCurrent) persistTask();
    const currentTaskId = taskRef.current.taskId;
    try {
      const newTask = await service.createTask({ initialQuery: '' });
      dispatchTracked({ type: 'TASK_CREATED', payload: { task: newTask } });
      if (serviceMode !== 'http') persistTask(newTask);
      replaceTaskIdInUrl(newTask.taskId);
      void refreshTaskList();
    } catch (error: unknown) {
      applyServiceFailure(currentTaskId, error);
    }
  };

  const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (serviceMode === 'http') await service.deleteTask(taskId);
    else taskStore.remove(taskId);
    void refreshTaskList();
    if (taskRef.current.taskId === taskId) void handleCreateNewTask(false);
  };

  const handleAction = async (actionCode: TaskActionCode, payload?: Record<string, unknown>) => {
    if (actionCode === 'MODIFY_UNDERSTANDING' || actionCode === 'MODIFY_SPEC') {
      setIsContextDrawerOpen(true);
      return;
    }
    const isSurfaceAction = ['OPEN_FIELDS', 'OPEN_COMPARE', 'OPEN_SOLUTION', 'OPEN_ACCESS', 'OPEN_RELATED_RESOURCES', 'OPEN_ASK_PLAN', 'CLOSE_SURFACE'].includes(actionCode);
    const operationId = isSurfaceAction ? undefined : startOperation('ACTION');
    if (!isSurfaceAction && !operationId) return;
    const actionTaskId = taskRef.current.taskId;
    try {
      const engineResult = await service.executeAction(taskRef.current, { actionCode, payload }, operationId);
      applyEngineResult(engineResult);
    } catch (error: unknown) {
      applyServiceFailure(actionTaskId, error, operationId);
    }
  };

  const handleCheckPermissionForAskPlan = async (): Promise<PermissionRecheckResult> => {
    const taskAtStart = taskRef.current;
    if (!taskAtStart.askPlan) return { decision: 'BLOCKED', updatedPermissions: {}, details: '当前没有分析计划。' };
    const operationId = startOperation('PERMISSION_CHECK');
    if (!operationId) return { decision: 'BLOCKED', updatedPermissions: {}, details: '当前任务正在处理，请稍后重试。' };
    dispatchTracked({
      type: 'PERMISSION_RECHECK_STARTED',
      payload: { resourceIds: taskAtStart.askPlan.coreResourceIds }
    });
    let checkResult: PermissionRecheckResult;
    try {
      checkResult = await service.recheckPermissions(
        taskAtStart,
        taskAtStart.askPlan.coreResourceIds,
        'query',
        operationId
      );
    } catch (error: unknown) {
      checkResult = {
        operationId,
        decision: 'BLOCKED',
        updatedPermissions: {},
        details: error instanceof Error ? error.message : '权限重检失败。'
      };
    }
    if (taskRef.current.taskId === taskAtStart.taskId && taskRef.current.pendingOperation?.operationId === operationId && (!checkResult.operationId || checkResult.operationId === operationId)) {
      dispatchTracked({
        type: 'PERMISSION_RECHECK_COMPLETED',
        payload: { decision: checkResult.decision, updatedPermissions: checkResult.updatedPermissions }
      });
      dispatchTracked({ type: 'OPERATION_COMPLETED', payload: { operationId } });
    }
    return checkResult;
  };

  const handleRunAskPlan = async () => {
    const taskAtStart = taskRef.current;
    if (!taskAtStart.askPlan) return;
    const operationId = startOperation('ASK_RUN');
    if (!operationId) return;
    dispatchTracked({ type: 'ASK_RUN_STARTED' });
    let runResult: AskRunResult;
    try {
      runResult = await service.runAskPlan(taskAtStart, {
        askPlanId: taskAtStart.askPlan.id,
        expectedRequirementRevision: taskAtStart.requirementRevision,
        expectedSearchRevision: taskAtStart.searchRevision,
        idempotencyKey: operationId
      }, operationId);
    } catch (error: unknown) {
      runResult = {
        operationId,
        success: false,
        executedAt: new Date().toISOString(),
        permissionSnapshot: {},
        error: error instanceof Error ? error.message : '执行分析计算失败'
      };
    }
    if (taskRef.current.taskId !== taskAtStart.taskId || taskRef.current.pendingOperation?.operationId !== operationId || (runResult.operationId && runResult.operationId !== operationId)) return;
    if (runResult.success) {
      dispatchTracked({ type: 'ASK_RUN_COMPLETED', payload: { result: runResult } });
      dispatchTracked({
          type: 'ASSISTANT_TURN_RECEIVED',
          payload: {
            turnId: createUiId('ask_complete'),
            nextStatus: 'READY',
            blocks: [
              { type: 'TEXT', id: createUiId('text'), content: askRunCompletionMessage(taskAtStart.askPlan!, runResult) },
              { type: 'ACTION_GROUP', id: createUiId('actions'), actions: [{ id: createUiId('view_result'), label: '查看完整结果', actionCode: 'OPEN_ASK_PLAN', variant: 'weak' }] }
            ]
          }
      });
    } else {
      dispatchTracked({ type: 'ASK_RUN_FAILED', payload: { error: runResult.error || '执行分析计算失败' } });
    }
    dispatchTracked({ type: 'OPERATION_COMPLETED', payload: { operationId } });
  };

  const handleClarificationSubmit = async (questionId: string, selectedOptionIds: string[]): Promise<void> => {
    const operationId = startOperation('ACTION');
    if (!operationId) throw new Error('当前任务正在处理，请稍后重试。');
    setClarificationSubmittingId(questionId);
    setClarificationErrors((errors) => ({ ...errors, [questionId]: '' }));
    const actionTaskId = taskRef.current.taskId;
    try {
      const engineResult = await service.executeAction(
        taskRef.current,
        { actionCode: 'SUBMIT_CLARIFICATION', payload: { questionId, selectedOptionIds } },
        operationId
      );
      if (!applyEngineResult(engineResult)) throw new Error('澄清结果已过期，请重新确认后再提交。');
    } catch (error: unknown) {
      if (taskRef.current.taskId === actionTaskId && taskRef.current.pendingOperation?.operationId === operationId) {
        dispatchTracked({ type: 'OPERATION_FAILED', payload: { operationId } });
      }
      const message = error instanceof Error ? error.message : '澄清提交失败，请重试。';
      setClarificationErrors((errors) => ({ ...errors, [questionId]: message }));
      throw new Error(message);
    } finally {
      setClarificationSubmittingId(undefined);
    }
  };

  const activeSurfaceType = task.activeSurface.type;
  const isSurfaceOpen = activeSurfaceType !== 'CLOSED';
  const isReevaluating = task.dataSolution.state === 'EVALUATING' || task.dataSolution.state === 'STALE';
  const activeResource = selectActiveResource(task);

  // Surface width governance (P1-03):
  // QUICK_PREVIEW: 560px, WORKBENCH: 780px
  const surfaceWidthClass =
    task.activeSurface.mode === 'QUICK_PREVIEW' ? 'w-[560px]' : 'w-[780px]';

  const targetFieldResourceId = task.activeSurface.resourceIds?.[0] ?? task.activeResourceId;
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
        scenarioKey={task.scenarioKey}
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
            onClick={() => void handleCreateNewTask()}
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
                  时间：{task.requirementHypothesis.timeRange
                    ? `${task.requirementHypothesis.timeRange.start} — ${task.requirementHypothesis.timeRange.end}`
                    : '未指定'}
                </span>
                <span className="text-[#CBD5E1]">·</span>
                <span>
                  焦点：
                  <span className="font-semibold text-[#0F172A]">
                    {activeResource?.name ?? task.requirementHypothesis.analysisFocus[0] ?? '尚未形成'}
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
                onClick={() => void handleAction('CLOSE_SURFACE')}
                className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer border border-[#E2E8F0]"
              >
                收起右侧工作区
              </button>
            )}

            {(task.dataSolution.items.length > 0 || task.dataSolution.gaps.length > 0 || task.activeResourceId || task.askPlan) && <div className="flex items-center space-x-1 bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0] text-xs">
              {task.dataSolution.items.length > 0 && (
              <button
                onClick={() => void handleAction(activeSurfaceType === 'SOLUTION' ? 'CLOSE_SURFACE' : 'OPEN_SOLUTION')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeSurfaceType === 'SOLUTION'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs cursor-pointer'
                    : 'text-[#64748B] hover:text-[#0F172A] cursor-pointer'
                }`}
              >
                {isReevaluating ? '正在重新评估' : `方案 · ${task.dataSolution.items.filter((item) => item.role === 'CORE').length} 项核心资源`}
              </button>
              )}
              {task.activeResourceId && targetFieldResource && (
              <button
                onClick={() => void handleAction(activeSurfaceType === 'FIELDS' ? 'CLOSE_SURFACE' : 'OPEN_FIELDS', { resourceId: task.activeResourceId })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeSurfaceType === 'FIELDS'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs cursor-pointer'
                    : 'text-[#64748B] hover:text-[#0F172A] cursor-pointer'
                }`}
              >
                当前资源 · {targetFieldResource.name}
              </button>
              )}
              {task.askPlan && (
              <button
                onClick={() => void handleAction(activeSurfaceType === 'ASK_PLAN' ? 'CLOSE_SURFACE' : 'OPEN_ASK_PLAN')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeSurfaceType === 'ASK_PLAN'
                    ? 'bg-white text-[#2563EB] font-bold shadow-2xs cursor-pointer'
                    : 'text-[#64748B] hover:text-[#0F172A] cursor-pointer'
                }`}
              >
                分析计划 · {askPlanStatusLabels[task.askPlan.status]}
              </button>
              )}
            </div>}
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
                                  submitting={clarificationSubmittingId === block.question.id}
                                  error={clarificationErrors[block.question.id]}
                                  disabled={!!task.pendingOperation && clarificationSubmittingId !== block.question.id}
                                  onSubmit={handleClarificationSubmit}
                                />
                              </div>
                            );

                          case 'RESULT_BRIEF':
                            return (
                              <div key={block.id} className="w-full">
                                <ResultBriefBlock
                                  block={block}
                                  task={task}
                                  onActionClick={(code, p) => handleAction(code, p)}
                                />
                              </div>
                            );

                          case 'ACTION_GROUP':
                            return (
                              <div key={block.id} className="w-full">
                                <ActionGroupBlock
                                  actions={block.actions}
                                  task={task}
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
                disabled={isInputBlocked}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isInputBlocked ? '当前任务正在处理，请稍候…' : '发送找数据意图、提出追问或输入口径调整要求…'}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isInputBlocked}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  inputMessage.trim() && !isInputBlocked
                    ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-2xs'
                    : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                }`}
              >
                {isInputBlocked ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
              resources={(task.activeSurface.resourceIds ?? []).map((id) => task.resources[id]).filter(Boolean)}
              comparisonRows={task.comparisonModel?.rows ?? []}
              recommendationConclusion={task.comparisonModel?.recommendationSummary}
              recommendedResourceId={task.comparisonModel?.recommendedResourceId}
              selectedResourceId={task.activeResourceId}
              onConfirmSelection={(resId) => {
                void handleAction('SELECT_RESOURCE', { resourceId: resId });
              }}
              onViewFields={(resId) => {
                handleAction('OPEN_FIELDS', { resourceId: resId });
              }}
              onClose={() => void handleAction('CLOSE_SURFACE')}
            />
          )}

          {activeSurfaceType === 'FIELDS' && (
            <RightWorkspaceFields
              resource={targetFieldResource}
              fields={targetFieldList}
              onClose={() => void handleAction('CLOSE_SURFACE')}
              onBackToSolution={() => void handleAction('OPEN_SOLUTION')}
            />
          )}

          {activeSurfaceType === 'SOLUTION' && (
            <RightWorkspaceSolution
              task={task}
              mode={solutionMode}
              onModeChange={(m) => setSolutionMode(m)}
              onAction={(code, p) => handleAction(code, p)}
              onClose={() => void handleAction('CLOSE_SURFACE')}
            />
          )}

          {activeSurfaceType === 'ACCESS' && (
            <RightWorkspaceAccess
              task={task}
              onAction={(code, p) => handleAction(code, p)}
              onClose={() => void handleAction('CLOSE_SURFACE')}
            />
          )}

          {activeSurfaceType === 'RELATED_RESOURCES' && (
            <RightWorkspaceCatalog
              task={task}
              onClose={() => void handleAction('CLOSE_SURFACE')}
              onReturnToAnalysis={() => void handleAction('OPEN_SOLUTION')}
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
              onReturnToSolution={() => void handleAction('OPEN_SOLUTION')}
              onViewPermissionChanges={() => void handleAction('OPEN_ACCESS')}
              onRegeneratePlan={() => void handleAction('REGENERATE_ASK_PLAN')}
              onModifySpec={() => setIsContextDrawerOpen(true)}
              onClose={() => void handleAction('CLOSE_SURFACE')}
            />
          )}
        </aside>
      )}
    </div>
  );
};
