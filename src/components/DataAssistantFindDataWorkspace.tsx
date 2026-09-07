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

import { AskPlan, AskPlanBinding, AskResultSnapshot, AskRunResult, FindDataEntryContext, FindDataTaskState, PendingOperation, ResourceId, ResultTargetRef, TaskActionCode, TurnTargetContext, isDirectMetricResultBinding, isSameDirectMetricResultBinding } from './find_data/model/FindDataTask';
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
import { evaluateSurfacePolicy, isSurfaceActionCode, SurfaceCommand } from './find_data/policy/surfacePolicy';
import {
  selectActiveResource,
  selectCandidateById,
  selectConversationTurnApplicability,
  selectRelatedResourceCandidates,
  resolveCandidateSelection,
  selectResourceById,
  selectResourceFields,
  selectDirectMetricQueryReadiness,
  getResultTargetKey,
  isResultSnapshotReadable,
  selectCurrentViewedResult,
  selectReadableResultSnapshots,
  selectResultSnapshots,
  selectResultTargetByRef
} from './find_data/model/findDataSelectors';
import {
  buildAskPlanScopeDisclosure,
  buildAskResultSnapshot,
  buildAskRunCompletionSummary,
  buildAskRunFailureSummary,
  buildOperationFailureSummary,
  buildPermissionRecheckSummary
} from './find_data/presenters/conversationPresenters';

// Blocks
import { AssistantTextBlock } from './find_data/blocks/AssistantTextBlock';
import { ClarificationBlock } from './find_data/blocks/ClarificationBlock';
import { ResultBriefBlock } from './find_data/blocks/ResultBriefBlock';
import { ActionGroupBlock } from './find_data/blocks/ActionGroupBlock';
import { RuntimeStatusBlock } from './find_data/blocks/RuntimeStatusBlock';
import { SystemNoticeBlock } from './find_data/blocks/SystemNoticeBlock';
import { AskResultContent } from './find_data/blocks/AskResultContent';

// Right Workspaces
import { RightWorkspaceCompare } from './find_data/RightWorkspaceCompare';
import { RightWorkspaceFields } from './find_data/RightWorkspaceFields';
import { RightWorkspaceSolution } from './find_data/RightWorkspaceSolution';
import { RightWorkspaceAccess } from './find_data/RightWorkspaceAccess';
import { RightWorkspaceCatalog } from './find_data/RightWorkspaceCatalog';
import { RightWorkspaceAskPlan } from './find_data/RightWorkspaceAskPlan';
import { RightWorkspaceMetricResult } from './find_data/RightWorkspaceMetricResult';
import { RightWorkspaceResultDetail } from './find_data/RightWorkspaceResultDetail';
import { TaskContextDrawer } from './find_data/TaskContextDrawer';

// Brand components
import { BrandLogo } from './brand/BrandLogo';
import { XinoAvatar } from './brand/XinoAvatar';

interface DataAssistantFindDataWorkspaceProps {
  initialQuery?: string;
  entryContext?: FindDataEntryContext;
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

type DetailReturnSource = 'COMPARE' | 'SOLUTION' | 'RELATED_RESOURCES';

interface DetailReturnContext {
  taskId: string;
  source: DetailReturnSource;
  resourceId: ResourceId;
  comparisonResourceIds?: ResourceId[];
  comparisonSelectedResourceId?: ResourceId;
  comparisonSelectionGroupId?: string;
  solutionMode?: 'recommended' | 'executable';
}

interface ComparisonDraft {
  taskId: string;
  resourceIds: ResourceId[];
  selectedResourceId: ResourceId;
  selectionGroupId?: string;
}

function hasSameResourceIds(left: ResourceId[], right: ResourceId[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

function hasCurrentComparisonDraft(
  draft: ComparisonDraft | undefined,
  taskId: string,
  resourceIds: ResourceId[],
  selectionGroupId?: string
): draft is ComparisonDraft {
  return Boolean(
    draft && draft.taskId === taskId &&
    draft.selectionGroupId === selectionGroupId &&
    hasSameResourceIds(draft.resourceIds, resourceIds) &&
    resourceIds.includes(draft.selectedResourceId)
  );
}

function isCurrentAskPlanBinding(task: FindDataTaskState, binding: AskPlanBinding): boolean {
  const plan = task.askPlan;
  return task.taskId === binding.taskId && plan?.id === binding.askPlanId &&
    plan.requirementRevision === binding.requirementRevision &&
    plan.basedOnSearchRevision === binding.searchRevision;
}

function canOpenAskResultDetails(task: FindDataTaskState, snapshot: AskResultSnapshot): boolean {
  if (!('askPlanId' in snapshot.binding)) return false;
  const result = task.askPlan?.lastRunResult;
  return isCurrentAskPlanBinding(task, snapshot.binding) && result?.success === true &&
    result.executedAt === snapshot.executedAt &&
    (!snapshot.operationId || !result.operationId || result.operationId === snapshot.operationId);
}

export function canOpenDirectMetricResult(task: FindDataTaskState, snapshot: AskResultSnapshot): boolean {
  const binding = snapshot.binding;
  const currentBinding = task.directMetricResult?.binding;
  return isDirectMetricResultBinding(binding) &&
    isDirectMetricResultBinding(currentBinding) &&
    isSameDirectMetricResultBinding(currentBinding, binding) &&
    task.directMetricResult?.executedAt === snapshot.executedAt;
}

export const askRunCompletionMessage = buildAskRunCompletionSummary;

export const DataAssistantFindDataWorkspace: React.FC<DataAssistantFindDataWorkspaceProps> = ({
  initialQuery,
  entryContext,
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
  const [permissionCheckFailure, setPermissionCheckFailure] = useState<string>();
  const [askPlanInteractionErrors, setAskPlanInteractionErrors] = useState<Record<string, string>>({});
  const [comparisonDraft, setComparisonDraft] = useState<ComparisonDraft>();
  const comparisonDraftRef = useRef<ComparisonDraft>();
  const [detailReturnContext, setDetailReturnContext] = useState<DetailReturnContext>();
  const detailReturnContextRef = useRef<DetailReturnContext>();
  const [surfaceMessage, setSurfaceMessage] = useState<string>();
  const returnFocusRef = useRef<HTMLElement>();
  const inputRef = useRef<HTMLInputElement>(null);
  const localContextTaskIdRef = useRef(task.taskId);
  // Display-only surface changes must remain visible while an execution is in
  // flight. This sequence lets the completion callback distinguish the panel
  // it started from from a panel the user chose afterwards.
  const surfaceNavigationSequenceRef = useRef(0);
  const consumedEntryIdRef = useRef<string>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);

  const updateComparisonDraft = useCallback((next?: ComparisonDraft) => {
    comparisonDraftRef.current = next;
    setComparisonDraft(next);
  }, []);

  const updateDetailReturnContext = useCallback((next?: DetailReturnContext) => {
    detailReturnContextRef.current = next;
    setDetailReturnContext(next);
  }, []);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  useEffect(() => {
    if (localContextTaskIdRef.current === task.taskId) return;
    localContextTaskIdRef.current = task.taskId;
    updateComparisonDraft(undefined);
    updateDetailReturnContext(undefined);
    setSurfaceMessage(undefined);
    setAskPlanInteractionErrors({});
    returnFocusRef.current = undefined;
  }, [task.taskId, updateComparisonDraft, updateDetailReturnContext]);

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
      setSurfaceMessage(command.blockedReason);
      return;
    }
    if ((command.action === 'OPEN' || command.action === 'REPLACE') && command.surface) {
      surfaceNavigationSequenceRef.current += 1;
      setSurfaceMessage(undefined);
      if (command.surface === 'COMPARE') {
        const resourceIds = command.resourceIds ?? [];
        const currentDraft = comparisonDraftRef.current;
        const comparisonModel = taskRef.current.comparisonModel;
        const selectionGroupId = (comparisonModel && hasSameResourceIds(comparisonModel.resourceIds, resourceIds)
          ? comparisonModel.selectionGroupId
          : undefined) ?? (currentDraft && currentDraft.taskId === taskRef.current.taskId && hasSameResourceIds(currentDraft.resourceIds, resourceIds)
          ? currentDraft.selectionGroupId
          : undefined);
        const currentSelectionIsValid = hasCurrentComparisonDraft(
          currentDraft,
          taskRef.current.taskId,
          resourceIds,
          selectionGroupId
        );
        if (!currentSelectionIsValid && resourceIds.length >= 2) {
          const resolution = resolveCandidateSelection(taskRef.current, {
            resourceIds,
            selectionGroupId,
            recommendedResourceId: comparisonModel?.recommendedResourceId
          });
          if (!resolution.resourceId) return;
          updateComparisonDraft({
            taskId: taskRef.current.taskId,
            resourceIds,
            selectedResourceId: resolution.resourceId,
            selectionGroupId
          });
        }
      }
      dispatchTracked({
        type: 'SURFACE_OPENED',
        payload: {
          type: command.surface,
          mode: command.mode,
          resourceIds: command.resourceIds,
          openedBy: command.openedBy,
          focusSection: command.focusSection,
          resultView: command.resultView,
          focusRequestId: command.focusRequestId,
          focusTarget: command.focusTarget,
          metricResultBinding: command.metricResultBinding,
          metricResultFocus: command.metricResultFocus,
          resultTarget: command.resultTarget,
          resultDetailFocus: command.resultDetailFocus
        }
      });
    } else if (command.action === 'CLOSE') {
      surfaceNavigationSequenceRef.current += 1;
      updateDetailReturnContext(undefined);
      dispatchTracked({ type: 'SURFACE_CLOSED' });
    }
  }, [dispatchTracked, updateComparisonDraft, updateDetailReturnContext]);

  const applyEngineResult = useCallback((result: FindDataEngineResult, options?: { suppressSurface?: boolean; surfaceNavigationSequenceAtStart?: number }) => {
    if (result.taskId !== taskRef.current.taskId) return false;
    if (taskRef.current.pendingOperation && result.operationId !== taskRef.current.pendingOperation.operationId) return false;
    dispatchTrackedEvents(result.events);
    if (!options?.suppressSurface && (options?.surfaceNavigationSequenceAtStart === undefined ||
      options.surfaceNavigationSequenceAtStart === surfaceNavigationSequenceRef.current)) {
      applySurfaceCommand(result.surfaceCommand);
    }
    if (taskRef.current.pendingOperation?.operationId === result.operationId) {
      dispatchTracked({ type: 'OPERATION_COMPLETED', payload: { operationId: result.operationId } });
    }
    return true;
  }, [applySurfaceCommand, dispatchTracked, dispatchTrackedEvents]);

  const applyServiceFailure = useCallback((
    taskId: string,
    error: unknown,
    operationId?: string,
    actionCode?: TaskActionCode,
    uncertain = false
  ) => {
    if (taskId !== taskRef.current.taskId) return;
    if (operationId && taskRef.current.pendingOperation?.operationId !== operationId) return;
    const operationType = taskRef.current.pendingOperation?.operationType ?? 'ACTION';
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
          message: buildOperationFailureSummary(taskRef.current, operationType, actionCode, uncertain)
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
      const hasNewEntry = Boolean(entryContext && entryContext.entryId !== consumedEntryIdRef.current);
      if (!hasNewEntry && consumedEntryIdRef.current === entryContext?.entryId && taskRef.current.taskId) return;
      if (!hasNewEntry && !initialQuery?.trim()) {
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
        cleanTask = await service.createTask({ initialQuery: '', entryContext: hasNewEntry ? entryContext : undefined });
      } catch (error: unknown) {
        if (cancelled) return;
        const failedTask = createFindDataTask({ taskId: createUiId('failed_task') });
        dispatchTracked({ type: 'TASK_CREATED', payload: { task: failedTask } });
        applyServiceFailure(failedTask.taskId, error);
        return;
      }
      if (cancelled) return;
      dispatchTracked({ type: 'TASK_CREATED', payload: { task: cleanTask } });
      if (hasNewEntry && entryContext) consumedEntryIdRef.current = entryContext.entryId;
      replaceTaskIdInUrl(cleanTask.taskId);

      const text = (hasNewEntry ? entryContext?.initialText : initialQuery)?.trim();
      if (!text) {
        if (serviceMode !== 'http') {
          taskStore.save(cleanTask);
          taskStore.setCurrentTaskId(cleanTask.taskId);
        }
        replaceTaskIdInUrl(cleanTask.taskId);
        void refreshTaskList();
        return;
      }

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
  }, [service, serviceMode, taskStore, initialQuery, entryContext, dispatchTracked, applyEngineResult, applyServiceFailure, refreshTaskList, startOperation]);

  // Scroll to bottom on new turns
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.turns, task.runtimeStatus]);

  const isInputBlocked = task.status === 'UNDERSTANDING' || task.status === 'SEARCHING' || !!task.runtimeStatus?.active || !!task.pendingOperation;
  const requiresHistoricalResultReadAuthorization = serviceMode === 'http';

  const selectReadableResults = () => selectReadableResultSnapshots(
    taskRef.current,
    requiresHistoricalResultReadAuthorization
  );

  const readResultTarget = (target: ResultTargetRef | undefined) => {
    const selected = selectResultTargetByRef(taskRef.current, target);
    if (!selected) return { selected: undefined, blockedReason: '未找到这份历史结果，无法继续操作。' };
    // A loaded HTTP Task is not proof that a former result is still readable.
    // Current result paths stay compatible; historical results require a fresh
    // server authorization marker carried with that exact snapshot.
    if (!isResultSnapshotReadable(selected, requiresHistoricalResultReadAuthorization)) {
      return { selected: undefined, blockedReason: '这份历史结果当前不可读取；服务尚未确认当前访问授权。' };
    }
    return { selected };
  };

  const isInterpretationRequest = (text: string): boolean => {
    const readableSelections = selectReadableResults();
    if (readableSelections.length === 0) return false;
    // The word "why" belongs to Find Data by default. Treat it as a result
    // continuation only with an explicit result reference, or with a focused
    // result-object follow-up in the existing right workspace.
    const hasExplicitResultReference = /(?:这份|这个|此|那份)\s*结果|结果\s*[AB]|(?:在营可用|核定)[^，。！？?]*那份结果/.test(text);
    if (hasExplicitResultReference) return true;
    const viewed = selectCurrentViewedResult(taskRef.current);
    if (viewed && isResultSnapshotReadable(viewed, requiresHistoricalResultReadAuthorization) &&
      /^(?:这里|为什么(?:这里)?(?:更低|更高)|(?:这个|这份|此)?差异(?:为什么)?)[？?！!。]*$/.test(text.trim())) {
      return true;
    }
    // With exactly one readable result, still require the user to name the
    // result object. This keeps resource/permission questions in Find Data.
    return readableSelections.length === 1 && /结果/.test(text);
  };

  const resolveTextResultTarget = (text: string): { target?: ResultTargetRef; ambiguous: boolean; blockedReason?: string } => {
    const selections = selectReadableResults();
    if (selections.length === 0) return { ambiguous: false };
    const knownSelections = selectResultSnapshots(taskRef.current);
    const normalized = text.replace(/[\s，。、“”‘’「」()（）·]/g, '').toLowerCase();
    const matchingSelections = (candidates: typeof selections) => candidates.filter((selection) => [selection.displayLabel, selection.snapshot.metricName, selection.snapshot.numeratorLabel]
      .flatMap((label) => label ? [label, label.replace(/养老/g, ''), label.replace(/数/g, ''), label.replace(/养老/g, '').replace(/数/g, '')] : [])
      .some((label) => normalized.includes(label.replace(/[\s，。、“”‘’「」()（）·]/g, '').toLowerCase())));
    const mentions = matchingSelections(selections);
    const knownMentions = matchingSelections(knownSelections);
    if (mentions.length === 0 && knownMentions.length > 0) {
      return { ambiguous: false, blockedReason: '这份历史结果当前不可读取，不能使用其他结果替代。' };
    }
    if (mentions.length === 1) return { target: mentions[0].target, ambiguous: false };
    if (mentions.length > 1) return { ambiguous: true };
    const refersA = /(?:结果\s*)?A(?:\s*那份|\s*结果)?/i.test(text);
    const refersB = /(?:结果\s*)?B(?:\s*那份|\s*结果)?/i.test(text);
    if (refersA !== refersB) {
      const ordinalTarget = knownSelections[refersA ? 0 : 1];
      if (!ordinalTarget) return { ambiguous: false };
      if (!isResultSnapshotReadable(ordinalTarget, requiresHistoricalResultReadAuthorization)) {
        return { ambiguous: false, blockedReason: '这份历史结果当前不可读取，不能使用其他结果替代。' };
      }
      return { target: ordinalTarget.target, ambiguous: false };
    }
    const viewed = selectCurrentViewedResult(taskRef.current);
    if (viewed && isResultSnapshotReadable(viewed, requiresHistoricalResultReadAuthorization)) return { target: viewed.target, ambiguous: false };
    if (selections.length === 1) return { target: selections[0].target, ambiguous: false };
    return { ambiguous: true };
  };

  const addResultTargetClarification = (text: string) => {
    const selections = selectReadableResults();
    if (selections.length < 2) return false;
    dispatchTracked({ type: 'USER_TURN_SUBMITTED', payload: { text, turnId: createUiId('user') } });
    dispatchTracked({
      type: 'ASSISTANT_TURN_RECEIVED',
      payload: {
        turnId: createUiId('result_target_clarification'),
        nextStatus: 'NEEDS_CLARIFICATION',
        blocks: [{
          type: 'CLARIFICATION',
          id: createUiId('result_target_block'),
          question: {
            id: createUiId('result_target_question'),
            question: '你希望解读哪一份结果？',
            type: 'SINGLE',
            options: selections.map((selection) => ({
              id: getResultTargetKey(selection.target),
              label: selection.displayLabel,
              description: `执行时间：${new Date(selection.snapshot.executedAt).toLocaleString('zh-CN')}`
            })),
            submitLabel: '解读此结果'
          }
        }]
      }
    });
    return true;
  };

  const submitTurnWithResultTarget = async (text: string, target?: ResultTargetRef) => {
    const resolved = readResultTarget(target);
    if (!resolved.selected) {
      setSurfaceMessage(resolved.blockedReason);
      return;
    }
    const operationId = startOperation('TURN');
    if (!operationId) return;
    const taskAtStart = taskRef.current;
    const surfaceNavigationSequenceAtStart = surfaceNavigationSequenceRef.current;
    const context: TurnTargetContext = {
      resultTarget: {
        resultRef: resolved.selected.target.resultRef,
        binding: resolved.selected.target.binding,
        executedAt: resolved.selected.target.executedAt
      }
    };
    dispatchTracked({ type: 'USER_TURN_SUBMITTED', payload: { text, turnId: createUiId('user') } });
    try {
      const engineResult = await service.submitTurn(taskRef.current, text, operationId, context);
      // A continuation is conversation-only. Its delayed response must never
      // re-open the result it explains or replace a surface the user chose later.
      applyEngineResult(engineResult, { suppressSurface: true, surfaceNavigationSequenceAtStart });
    } catch (error: unknown) {
      applyServiceFailure(taskAtStart.taskId, error, operationId);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isInputBlocked) return;
    const text = inputMessage.trim();
    if (isInterpretationRequest(text)) {
      const targetResolution = resolveTextResultTarget(text);
      setInputMessage('');
      if (targetResolution.target) {
        await submitTurnWithResultTarget(text, targetResolution.target);
        return;
      }
      if (targetResolution.blockedReason) {
        setSurfaceMessage(targetResolution.blockedReason);
        return;
      }
      if (targetResolution.ambiguous && addResultTargetClarification(text)) return;
      setInputMessage(text);
      return;
    }
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

  const handleRunDirectMetricQuery = async (): Promise<void> => {
    const taskAtStart = taskRef.current;
    const query = taskAtStart.directMetricQuery;
    const readiness = selectDirectMetricQueryReadiness(taskAtStart);
    if (!query || (!readiness.ready && query.status !== 'FAILED')) {
      setSurfaceMessage(readiness.message);
      return;
    }
    const operationId = startOperation('METRIC_QUERY');
    if (!operationId) return;
    const refreshedQuery = { ...query, status: 'READY' as const, error: undefined };
    dispatchTracked({ type: 'DIRECT_METRIC_QUERY_PREPARED', payload: { query: refreshedQuery } });
    dispatchTracked({ type: 'DIRECT_METRIC_QUERY_STARTED', payload: { requestId: query.requestId } });
    try {
      const engineResult = await service.executeAction(
        taskRef.current,
        { actionCode: 'RUN_METRIC_QUERY', payload: { requestId: query.requestId } },
        operationId
      );
      if (!applyEngineResult(engineResult)) throw new Error('指标查询结果已过期，请以当前任务为准。');
    } catch (error: unknown) {
      if (taskRef.current.taskId !== taskAtStart.taskId || taskRef.current.pendingOperation?.operationId !== operationId) return;
      const message = error instanceof Error ? error.message : '正式指标查询失败，请稍后重试。';
      dispatchTracked({ type: 'DIRECT_METRIC_QUERY_FAILED', payload: { requestId: query.requestId, error: message } });
      dispatchTracked({ type: 'OPERATION_FAILED', payload: { operationId } });
      dispatchTracked({
        type: 'ASSISTANT_TURN_RECEIVED',
        payload: {
          turnId: createUiId('metric_query_failed'),
          nextStatus: 'WAITING_USER',
          source: { kind: 'DIRECT_METRIC_RESULT', requirementRevision: taskAtStart.requirementRevision },
          blocks: [
            { type: 'SYSTEM_NOTICE', id: createUiId('notice'), level: 'error', message: '口径已确认，但本次指标查询未完成。可重试查询，不会重复提交口径。' },
            { type: 'ACTION_GROUP', id: createUiId('retry'), actions: [{ id: createUiId('retry_query'), label: '重试查询', actionCode: 'RUN_METRIC_QUERY', variant: 'primary' }] }
          ]
        }
      });
    }
  };

  const handleAction = async (actionCode: TaskActionCode, payload?: Record<string, unknown>) => {
    if (actionCode === 'MODIFY_UNDERSTANDING' || actionCode === 'MODIFY_SPEC') {
      setIsContextDrawerOpen(true);
      return;
    }
    if (actionCode === 'RUN_METRIC_QUERY') {
      await handleRunDirectMetricQuery();
      return;
    }
    const resultTarget = payload?.resultTarget as ResultTargetRef | undefined;
    if (actionCode === 'INTERPRET_RESULT') {
      await submitTurnWithResultTarget('解读这份结果', resultTarget);
      return;
    }
    if (actionCode === 'OPEN_RESULT_DETAIL' || actionCode === 'OPEN_RESULT_EVIDENCE') {
      const resolved = readResultTarget(resultTarget);
      if (!resolved.selected) {
        setSurfaceMessage(resolved.blockedReason);
        return;
      }
      // Canonicalize the target from the current conversation before it reaches
      // Surface Policy, so a stale or forged payload cannot choose another result.
      payload = { ...payload, resultTarget: resolved.selected.target };
    }
    const boundPlan = payload?.askPlanBinding as AskPlanBinding | undefined;
    if (actionCode === 'OPEN_ASK_PLAN' && boundPlan && !isCurrentAskPlanBinding(taskRef.current, boundPlan)) {
      setSurfaceMessage('当前需求或计划已变化，请使用最新分析计划。');
      return;
    }
    const expectedExecutedAt = payload?.executedAt as string | undefined;
    if (actionCode === 'OPEN_ASK_PLAN' && expectedExecutedAt && taskRef.current.askPlan?.lastRunResult?.executedAt !== expectedExecutedAt) {
      setSurfaceMessage('当前工作区无法恢复这次历史结果的详情。');
      return;
    }
    if (isSurfaceActionCode(actionCode)) {
      // Opening and closing the existing workspaces is a local display action:
      // it uses the same surface policy and Task events, but must not wait for
      // (or compete with) an in-flight calculation request.
      applySurfaceCommand(evaluateSurfacePolicy(
        { kind: 'TASK_ACTION', explicit: true, confidence: 'HIGH' },
        actionCode,
        taskRef.current.activeSurface,
        taskRef.current,
        payload
      ));
      return;
    }
    const operationId = startOperation('ACTION');
    if (!operationId) return;
    const actionTaskId = taskRef.current.taskId;
    const actionTaskAtStart = taskRef.current;
    try {
      const engineResult = await service.executeAction(taskRef.current, { actionCode, payload }, operationId);
      applyEngineResult(engineResult);
    } catch (error: unknown) {
      const needsReadBack = serviceMode === 'http' &&
        (actionCode === 'REVISE_REQUIREMENT' || actionCode === 'CREATE_PERMISSION_REQUEST');
      if (needsReadBack) {
        try {
          const refreshed = await service.getTask(actionTaskId);
          if (taskRef.current.taskId === actionTaskId && taskRef.current.pendingOperation?.operationId === operationId) {
            const requirementSaved = actionCode === 'REVISE_REQUIREMENT' &&
              refreshed.requirementRevision > actionTaskAtStart.requirementRevision;
            const refreshedSolutionReady = requirementSaved &&
              refreshed.dataSolution.state === 'READY' &&
              refreshed.dataSolution.basedOnRequirementRevision === refreshed.requirementRevision;
            const newPermissionRequestExists = actionCode === 'CREATE_PERMISSION_REQUEST' &&
              Object.keys(refreshed.permissionRequests).some((requestId) => !actionTaskAtStart.permissionRequests[requestId]);
            const readbackMessage = refreshedSolutionReady
              ? '已从当前任务状态读取到新的数据方案。请以最新方案为准，再决定是否继续分析。'
              : requirementSaved
              ? '新需求已保存，但重新检索尚未形成新方案。旧方案仅供历史参考；可以稍后重试。'
              : newPermissionRequestExists
              ? '已从当前任务状态读取到新的权限申请记录。申请已提交，权限尚未获得，请以当前申请记录为准。'
              : '本次操作状态尚未确认，已读取当前任务状态。请以当前方案和申请记录为准，再决定是否重试。';
            dispatchTracked({ type: 'OPERATION_FAILED', payload: { operationId } });
            dispatchTracked({ type: 'TASK_HYDRATED', payload: { task: refreshed } });
            dispatchTracked({
              type: 'ASSISTANT_TURN_RECEIVED',
              payload: {
                turnId: createUiId('state_readback'),
                nextStatus: refreshed.status,
                blocks: [{
                  type: 'SYSTEM_NOTICE',
                  id: createUiId('notice'),
                  level: 'warning',
                  message: readbackMessage
                }]
              }
            });
            return;
          }
        } catch {
          // Keep the operation unresolved to the user rather than inferring a write outcome.
        }
      }
      applyServiceFailure(actionTaskId, error, operationId, actionCode, serviceMode === 'http' && actionCode === 'REVISE_REQUIREMENT');
    }
  };

  const handleCheckPermissionForAskPlan = async (binding: AskPlanBinding): Promise<PermissionRecheckResult> => {
    const taskAtStart = taskRef.current;
    const askPlanAtStart = taskAtStart.askPlan;
    if (!askPlanAtStart || !isCurrentAskPlanBinding(taskAtStart, binding)) {
      const details = '当前需求或计划已变化，请使用最新分析计划。';
      setAskPlanInteractionErrors((errors) => ({ ...errors, [binding.askPlanId]: details }));
      return { decision: 'BLOCKED', updatedPermissions: {}, details };
    }
    const operationId = startOperation('PERMISSION_CHECK');
    if (!operationId) return { decision: 'BLOCKED', updatedPermissions: {}, details: '当前任务正在处理，请稍后重试。' };
    setPermissionCheckFailure(undefined);
    setAskPlanInteractionErrors((errors) => ({ ...errors, [binding.askPlanId]: '' }));
    dispatchTracked({
      type: 'PERMISSION_RECHECK_STARTED',
      payload: { resourceIds: askPlanAtStart.coreResourceIds }
    });
    let checkResult: PermissionRecheckResult;
    let serviceFailed = false;
    try {
      checkResult = await service.recheckPermissions(
        taskAtStart,
        askPlanAtStart.coreResourceIds,
        'query',
        operationId
      );
    } catch (error: unknown) {
      serviceFailed = true;
      setPermissionCheckFailure('权限状态未能完成确认，暂不能执行。可以稍后重新校验。');
      setAskPlanInteractionErrors((errors) => ({ ...errors, [binding.askPlanId]: '权限状态未能完成确认，暂不能执行。可以稍后重新校验。' }));
      checkResult = {
        operationId,
        decision: 'BLOCKED',
        updatedPermissions: {},
        details: error instanceof Error ? error.message : '权限重检失败。'
      };
    }
    if (taskRef.current.taskId === taskAtStart.taskId && taskRef.current.pendingOperation?.operationId === operationId && (!checkResult.operationId || checkResult.operationId === operationId)) {
      const taskAfterRecheck = dispatchTracked({
        type: 'PERMISSION_RECHECK_COMPLETED',
        payload: { decision: checkResult.decision, updatedPermissions: checkResult.updatedPermissions }
      });
      dispatchTracked({
        type: 'ASSISTANT_TURN_RECEIVED',
        payload: {
          turnId: createUiId('permission_recheck'),
          nextStatus: taskAfterRecheck.status,
          source: {
            kind: 'PERMISSION',
            requirementRevision: taskAfterRecheck.requirementRevision,
            searchRevision: taskAfterRecheck.searchRevision,
            askPlanId: taskAfterRecheck.askPlan?.id
          },
          blocks: [{
            type: 'TEXT',
            id: createUiId('text'),
            content: buildPermissionRecheckSummary(taskAfterRecheck, checkResult, serviceFailed)
          }]
        }
      });
      dispatchTracked({ type: 'OPERATION_COMPLETED', payload: { operationId } });
    }
    return checkResult;
  };

  const handleRunAskPlan = async (binding: AskPlanBinding): Promise<void> => {
    const taskAtStart = taskRef.current;
    const askPlanAtStart = taskAtStart.askPlan;
    if (!askPlanAtStart || !isCurrentAskPlanBinding(taskAtStart, binding)) {
      setAskPlanInteractionErrors((errors) => ({ ...errors, [binding.askPlanId]: '当前需求或计划已变化，请使用最新分析计划。' }));
      return;
    }
    const operationId = startOperation('ASK_RUN');
    if (!operationId) return;
    const surfaceNavigationSequenceAtStart = surfaceNavigationSequenceRef.current;
    dispatchTracked({ type: 'ASK_RUN_STARTED' });
    let runResult: AskRunResult;
    try {
      runResult = await service.runAskPlan(taskAtStart, {
        askPlanId: askPlanAtStart.id,
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
      const resultSnapshot = buildAskResultSnapshot(taskAtStart, askPlanAtStart, runResult);
      const activeSurface = taskRef.current.activeSurface;
      if (
        surfaceNavigationSequenceRef.current === surfaceNavigationSequenceAtStart &&
        activeSurface.type === 'ASK_PLAN' &&
        taskRef.current.askPlan?.id === askPlanAtStart.id
      ) {
        dispatchTracked({
          type: 'SURFACE_OPENED',
          payload: {
            ...activeSurface,
            focusSection: 'RESULT',
            focusRequestId: createUiId('ask_focus'),
            // A completed run is not an explicit navigation click, so do not steal keyboard focus.
            focusTarget: false
          }
        });
      }
      dispatchTracked({
          type: 'ASSISTANT_TURN_RECEIVED',
          payload: {
            turnId: createUiId('ask_complete'),
            nextStatus: 'READY',
            source: {
              kind: 'ASK_RESULT',
              requirementRevision: taskAtStart.requirementRevision,
              searchRevision: taskAtStart.searchRevision,
              askPlanId: askPlanAtStart.id,
              resultExecutedAt: runResult.executedAt
            },
            blocks: resultSnapshot
              ? [
                  { type: 'TEXT', id: createUiId('text'), content: '分析已完成，关键结果如下。' },
                  { type: 'ASK_RESULT', id: createUiId('ask_result'), snapshot: resultSnapshot }
                ]
              : [{ type: 'TEXT', id: createUiId('text'), content: '分析已完成，但服务未返回可展示的结构化结果。' }]
          }
      });
    } else {
      dispatchTracked({ type: 'ASK_RUN_FAILED', payload: { error: runResult.error || '执行分析计算失败' } });
      dispatchTracked({
        type: 'ASSISTANT_TURN_RECEIVED',
        payload: {
          turnId: createUiId('ask_failed'),
          nextStatus: 'WAITING_USER',
          source: {
            kind: 'ASK_PLAN',
            requirementRevision: taskAtStart.requirementRevision,
            searchRevision: taskAtStart.searchRevision,
            askPlanId: askPlanAtStart.id
          },
          blocks: [
            { type: 'TEXT', id: createUiId('text'), content: buildAskRunFailureSummary(taskAtStart, runResult.error) },
            { type: 'ACTION_GROUP', id: createUiId('actions'), actions: [{ id: createUiId('view_plan'), label: '查看当前分析计划', actionCode: 'OPEN_ASK_PLAN', variant: 'weak' }] }
          ]
        }
      });
    }
    dispatchTracked({ type: 'OPERATION_COMPLETED', payload: { operationId } });
  };

  const handleClarificationSubmit = async (questionId: string, selectedOptionIds: string[]): Promise<void> => {
    if (questionId.startsWith('result_target_question_')) {
      const target = selectReadableResults().find((selection) => getResultTargetKey(selection.target) === selectedOptionIds[0])?.target;
      if (!target) throw new Error('这份结果已无法精确定位，请重新选择。');
      dispatchTracked({
        type: 'CLARIFICATION_RESOLVED',
        payload: {
          questionId,
          selectedOptionIds: [selectedOptionIds[0]],
          selectedOptionLabels: [target.label ?? '已选择结果'],
          requirementRevision: taskRef.current.requirementRevision,
          resolvedAt: new Date().toISOString()
        }
      });
      await submitTurnWithResultTarget('解读此结果', target);
      return;
    }
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
      if (taskRef.current.directMetricQuery?.status === 'READY') {
        await handleRunDirectMetricQuery();
      }
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

  const captureReturnFocus = () => {
    if (document.activeElement instanceof HTMLElement) returnFocusRef.current = document.activeElement;
  };

  const openFieldsFrom = (
    source: DetailReturnSource,
    resourceId: ResourceId,
    sourceComparisonResourceIds?: ResourceId[]
  ) => {
    const currentTask = taskRef.current;
    const activeSurface = currentTask.activeSurface;
    const comparisonResourceIds = source === 'COMPARE'
      ? sourceComparisonResourceIds ?? activeSurface.resourceIds
      : undefined;
    const existingDraft = comparisonDraftRef.current;
    const comparisonModel = currentTask.comparisonModel;
    const selectionGroupId = (comparisonResourceIds && comparisonModel &&
      hasSameResourceIds(comparisonModel.resourceIds, comparisonResourceIds)
      ? comparisonModel.selectionGroupId
      : undefined) ?? (comparisonResourceIds && existingDraft && existingDraft.taskId === currentTask.taskId &&
        hasSameResourceIds(existingDraft.resourceIds, comparisonResourceIds)
      ? existingDraft.selectionGroupId
      : undefined);
    const comparisonSelectedResourceId = source === 'COMPARE' && comparisonResourceIds?.length
      ? resolveCandidateSelection(currentTask, {
        resourceIds: comparisonResourceIds,
        selectionGroupId,
        recommendedResourceId: comparisonModel?.recommendedResourceId,
        draftResourceId: hasCurrentComparisonDraft(existingDraft, currentTask.taskId, comparisonResourceIds, selectionGroupId)
          ? existingDraft.selectedResourceId
          : undefined
      }).resourceId
      : undefined;
    if (source === 'COMPARE' && comparisonResourceIds && comparisonSelectedResourceId) {
      updateComparisonDraft({
        taskId: currentTask.taskId,
        resourceIds: comparisonResourceIds,
        selectedResourceId: comparisonSelectedResourceId,
        selectionGroupId
      });
    }
    const context: DetailReturnContext = {
      taskId: currentTask.taskId,
      source,
      resourceId,
      solutionMode: source === 'SOLUTION' ? solutionMode : undefined,
      comparisonResourceIds,
      comparisonSelectedResourceId,
      comparisonSelectionGroupId: selectionGroupId
    };
    captureReturnFocus();
    updateDetailReturnContext(context);
    void handleAction('OPEN_FIELDS', { resourceId });
  };

  const relatedResourceIds = selectRelatedResourceCandidates(task).map((candidate) => candidate.resourceId);
  const isReturnContextCurrent = detailReturnContext?.taskId === task.taskId;
  const isReturnContextValid = Boolean(detailReturnContext && isReturnContextCurrent && (
    detailReturnContext.source === 'COMPARE'
      ? Boolean(
          detailReturnContext.comparisonResourceIds &&
          task.comparisonModel &&
          hasSameResourceIds(task.comparisonModel.resourceIds, detailReturnContext.comparisonResourceIds) &&
          detailReturnContext.comparisonResourceIds.every((id) => Boolean(selectCandidateById(task, id))) &&
          detailReturnContext.comparisonSelectedResourceId &&
          detailReturnContext.comparisonResourceIds.includes(detailReturnContext.comparisonSelectedResourceId)
        )
      : detailReturnContext.source === 'SOLUTION'
      ? task.dataSolution.items.some((item) => item.resourceId === detailReturnContext.resourceId)
      : relatedResourceIds.includes(detailReturnContext.resourceId)
  ));

  const returnFromFields = () => {
    const context = detailReturnContextRef.current;
    if (!context || !isReturnContextValid) return;
    if (context.source === 'COMPARE' && context.comparisonResourceIds && context.comparisonSelectedResourceId) {
      updateComparisonDraft({
        taskId: task.taskId,
        resourceIds: context.comparisonResourceIds,
        selectedResourceId: context.comparisonSelectedResourceId,
        selectionGroupId: context.comparisonSelectionGroupId
      });
      void handleAction('OPEN_COMPARE', { resourceIds: context.comparisonResourceIds });
      return;
    }
    if (context.source === 'SOLUTION') {
      setSolutionMode(context.solutionMode ?? 'recommended');
      void handleAction('OPEN_SOLUTION');
      return;
    }
    void handleAction('OPEN_RELATED_RESOURCES');
  };

  const closeFields = () => {
    updateDetailReturnContext(undefined);
    void handleAction('CLOSE_SURFACE');
    window.requestAnimationFrame(() => inputRef.current?.focus());
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
  const viewedResultCandidate = selectCurrentViewedResult(task);
  const currentViewedResult = viewedResultCandidate && isResultSnapshotReadable(
    viewedResultCandidate,
    requiresHistoricalResultReadAuthorization
  ) ? viewedResultCandidate : undefined;
  const viewedResultUnavailable = activeSurfaceType === 'RESULT_DETAIL' && !currentViewedResult;
  const targetFieldResource = selectResourceById(task, targetFieldResourceId);
  const targetFieldList = selectResourceFields(task, targetFieldResourceId);
  const fieldBackLabel = detailReturnContext?.source === 'COMPARE'
    ? '返回资源比较'
    : detailReturnContext?.source === 'SOLUTION'
    ? '返回数据方案'
    : detailReturnContext?.source === 'RELATED_RESOURCES'
    ? '返回相关资源'
    : undefined;
  const fieldReturnMessage = detailReturnContext && !isReturnContextValid
    ? '原比较上下文已变化，请查看最新方案。'
    : undefined;

  useEffect(() => {
    const context = detailReturnContextRef.current;
    const focusTarget = returnFocusRef.current;
    if (!context || !focusTarget || task.activeSurface.type !== context.source) return;
    if (focusTarget.isConnected) focusTarget.focus();
    returnFocusRef.current = undefined;
  }, [task.activeSurface.type, task.activeSurface.focusRequestId]);

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
              {!isSidebarCollapsed && <span>数据助手</span>}
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
                  数据助手
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
                {task.entryContext?.target && <>
                  <span className="text-[#CBD5E1]">·</span>
                  <span>
                    当前对象：<span className="font-semibold text-[#0F172A]">{task.entryContext.target.label ?? task.entryContext.target.id}</span>
                  </span>
                </>}
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
                onClick={() => activeSurfaceType === 'FIELDS' ? closeFields() : void handleAction('CLOSE_SURFACE')}
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

        {surfaceMessage && (
          <div role="status" className="mx-5 mt-3 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs leading-relaxed text-[#1E40AF]">
            {surfaceMessage}
          </div>
        )}

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
                <p className="font-bold text-sm text-[#0F172A]">从这里开始</p>
                <p className="text-[#64748B] max-w-sm">
                  可以查询正式指标、查找可用数据，或基于当前对象发起分析。
                </p>
              </div>
            ) : (
              task.turns.map((turn) => {
                const isUser = turn.sender === 'USER';
                const applicability = selectConversationTurnApplicability(task, turn);

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
                      className={`flex min-w-0 flex-col space-y-2.5 ${
                        isUser ? 'max-w-[85%] items-end' : 'w-full max-w-none items-start'
                      }`}
                    >
                      {applicability.message && (
                        <p className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] text-[#64748B]">
                          {applicability.message}
                        </p>
                      )}
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

                          case 'RESULT_BRIEF': {
                            const candidateResourceIds = block.candidateSelection?.resourceIds ?? [];
                            const candidateSelectionGroupId = block.candidateSelection?.selectionGroupId;
                            const currentCandidateDraft = hasCurrentComparisonDraft(
                              comparisonDraft,
                              task.taskId,
                              candidateResourceIds,
                              candidateSelectionGroupId
                            ) ? comparisonDraft : undefined;
                            const candidateSelection = block.candidateSelection
                              ? resolveCandidateSelection(task, {
                                resourceIds: candidateResourceIds,
                                selectionGroupId: candidateSelectionGroupId,
                                recommendedResourceId: block.candidateSelection.recommendedResourceId,
                                draftResourceId: currentCandidateDraft?.selectedResourceId
                              })
                              : undefined;
                            return (
                              <div key={block.id} className="w-full">
                                <ResultBriefBlock
                                  block={block}
                                  task={task}
                                  onActionClick={(code, p) => handleAction(code, p)}
                                  selectedCandidateResourceId={candidateSelection?.resourceId}
                                  onSelectedCandidateChange={(resourceId) => {
                                    if (!candidateResourceIds.includes(resourceId)) return;
                                    updateComparisonDraft({
                                      taskId: task.taskId,
                                      resourceIds: candidateResourceIds,
                                      selectedResourceId: resourceId,
                                      selectionGroupId: candidateSelectionGroupId
                                    });
                                  }}
                                  onViewCandidateFields={(resourceId, resourceIds) => {
                                    openFieldsFrom('COMPARE', resourceId, resourceIds);
                                  }}
                                  onCheckAskPlan={async (binding) => { await handleCheckPermissionForAskPlan(binding); }}
                                  onRunAskPlan={handleRunAskPlan}
                                  askPlanError={block.askReady ? askPlanInteractionErrors[block.askReady.binding.askPlanId] : undefined}
                                />
                              </div>
                            );
                          }

                          case 'ASK_RESULT': {
                            const resultSelection = selectResultSnapshots(task).find((selection) =>
                              selection.turnId === turn.turnId && selection.blockId === block.id
                            );
                            const canReadResult = Boolean(resultSelection &&
                              isResultSnapshotReadable(resultSelection, requiresHistoricalResultReadAuthorization));
                            const isCurrentDirectMetricResult = Boolean(resultSelection &&
                              isDirectMetricResultBinding(resultSelection.snapshot.binding) && resultSelection.isCurrent);
                            const canOpenDetails = Boolean(resultSelection && canReadResult &&
                              (!isCurrentDirectMetricResult || canOpenDirectMetricResult(task, resultSelection.snapshot)));
                            if (!canReadResult) {
                              return (
                                <section key={block.id} className="w-full rounded-xl border border-dashed border-[#CBD5E1] bg-[#FAFCFF] p-3 text-[11px] text-[#64748B]" aria-label="历史结果不可读取">
                                  <p className="font-medium text-[#475569]">这份历史结果当前不可读取</p>
                                  <p className="mt-1 leading-relaxed">服务尚未确认你当前仍有读取该结果的权限，因此不会显示缓存的数值、数据、图表或依据。</p>
                                </section>
                              );
                            }
                            return (
                              <div key={block.id} className="w-full">
                                <AskResultContent
                                  snapshot={block.snapshot}
                                  resultTarget={resultSelection?.target}
                                  isCurrentResult={resultSelection?.isCurrent}
                                  mode="compact"
                                  canOpenDetails={canOpenDetails}
                                  onActionClick={(code, payload) => handleAction(code, payload)}
                                />
                              </div>
                            );
                          }

                          case 'ACTION_GROUP':
                            return (
                              <div key={block.id} className="w-full">
                                <ActionGroupBlock
                                  actions={block.actions}
                                  task={task}
                                  historical={applicability.historical}
                                  historicalKind={applicability.historical ? applicability.kind : undefined}
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
                ref={inputRef}
                type="text"
                value={inputMessage}
                disabled={isInputBlocked}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                aria-label="发送找数据意图"
                placeholder={isInputBlocked ? '当前任务正在处理，请稍候…' : '发送找数据意图、提出追问或输入口径调整要求…'}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isInputBlocked}
                aria-label={isInputBlocked ? '任务处理中' : '发送消息'}
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
              selectedResourceId={(() => {
                const resourceIds = task.activeSurface.resourceIds ?? [];
                const comparisonModel = task.comparisonModel;
                const selectionGroupId = (comparisonModel && hasSameResourceIds(comparisonModel.resourceIds, resourceIds)
                  ? comparisonModel.selectionGroupId
                  : undefined) ?? (comparisonDraft && comparisonDraft.taskId === task.taskId && hasSameResourceIds(comparisonDraft.resourceIds, resourceIds)
                  ? comparisonDraft.selectionGroupId
                  : undefined);
                return resolveCandidateSelection(task, {
                  resourceIds,
                  selectionGroupId,
                  recommendedResourceId: comparisonModel?.recommendedResourceId,
                  draftResourceId: hasCurrentComparisonDraft(comparisonDraft, task.taskId, resourceIds, selectionGroupId)
                    ? comparisonDraft.selectedResourceId
                    : undefined
                }).resourceId;
              })()}
              onSelectionChange={(resourceId) => {
                const resourceIds = task.activeSurface.resourceIds ?? [];
                if (!resourceIds.includes(resourceId)) return;
                const comparisonModel = task.comparisonModel;
                updateComparisonDraft({
                  taskId: task.taskId,
                  resourceIds,
                  selectedResourceId: resourceId,
                  selectionGroupId: (comparisonModel && hasSameResourceIds(comparisonModel.resourceIds, resourceIds)
                    ? comparisonModel.selectionGroupId
                    : undefined) ?? (comparisonDraft && comparisonDraft.taskId === task.taskId && hasSameResourceIds(comparisonDraft.resourceIds, resourceIds)
                    ? comparisonDraft.selectionGroupId
                    : undefined)
                });
              }}
              onConfirmSelection={(resId) => {
                void handleAction('SELECT_RESOURCE', { resourceId: resId });
              }}
              onViewFields={(resId) => {
                openFieldsFrom('COMPARE', resId);
              }}
              onClose={() => void handleAction('CLOSE_SURFACE')}
            />
          )}

          {activeSurfaceType === 'FIELDS' && (
            <RightWorkspaceFields
              resource={targetFieldResource}
              fields={targetFieldList}
              onClose={closeFields}
              onBack={isReturnContextValid ? returnFromFields : undefined}
              backLabel={isReturnContextValid ? fieldBackLabel : undefined}
              returnContextMessage={fieldReturnMessage}
              onViewLatestSolution={fieldReturnMessage && (task.dataSolution.items.length > 0 || task.dataSolution.gaps.length > 0)
                ? () => {
                    updateDetailReturnContext(undefined);
                    void handleAction('OPEN_SOLUTION');
                  }
                : undefined}
            />
          )}

          {activeSurfaceType === 'SOLUTION' && (
            <RightWorkspaceSolution
              task={task}
              mode={solutionMode}
              onModeChange={(m) => setSolutionMode(m)}
              onAction={(code, p) => handleAction(code, p)}
              onViewFields={(resId) => openFieldsFrom('SOLUTION', resId)}
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
                openFieldsFrom('RELATED_RESOURCES', resId);
              }}
            />
          )}

          {activeSurfaceType === 'ASK_PLAN' && (
            <RightWorkspaceAskPlan
              task={task}
              executionScopeDisclosure={buildAskPlanScopeDisclosure(
                task.askPlan,
                serviceMode === 'mock' ? 'MOCK_FIXTURE' : undefined
              )}
              onCheckPermission={handleCheckPermissionForAskPlan}
              onRunPlan={handleRunAskPlan}
              onReturnToSolution={() => void handleAction('OPEN_SOLUTION')}
              onViewPermissionChanges={() => void handleAction('OPEN_ACCESS')}
              onRegeneratePlan={() => void handleAction('REGENERATE_ASK_PLAN')}
              permissionCheckFailure={permissionCheckFailure}
              focusSection={task.activeSurface.focusSection}
              resultView={task.activeSurface.resultView}
              focusRequestId={task.activeSurface.focusRequestId}
              focusTarget={task.activeSurface.focusTarget}
              onFocusSection={(focusSection, resultView) => void handleAction('OPEN_ASK_PLAN', { focusSection, resultView })}
              onModifySpec={() => setIsContextDrawerOpen(true)}
              onClose={() => void handleAction('CLOSE_SURFACE')}
            />
          )}

          {activeSurfaceType === 'METRIC_RESULT' && task.directMetricResult && (
            <RightWorkspaceMetricResult
              snapshot={task.directMetricResult}
              focus={task.activeSurface.metricResultFocus}
              onFocusChange={(metricResultFocus) => void handleAction(
                metricResultFocus === 'DEFINITION' ? 'OPEN_METRIC_DEFINITION' : 'OPEN_METRIC_RESULT',
                { directMetricBinding: task.directMetricResult?.binding, executedAt: task.directMetricResult?.executedAt }
              )}
              onClose={() => void handleAction('CLOSE_SURFACE')}
            />
          )}

          {activeSurfaceType === 'RESULT_DETAIL' && currentViewedResult && (
            <RightWorkspaceResultDetail
              snapshot={currentViewedResult.snapshot}
              displayLabel={currentViewedResult.displayLabel}
              focus={task.activeSurface.resultDetailFocus}
              resultView={task.activeSurface.resultView}
              onResultViewChange={(resultView) => void handleAction('OPEN_RESULT_DETAIL', {
                resultTarget: currentViewedResult.target,
                resultView
              })}
              onFocusChange={(focus) => void handleAction(
                focus === 'EVIDENCE' ? 'OPEN_RESULT_EVIDENCE' : 'OPEN_RESULT_DETAIL',
                { resultTarget: currentViewedResult.target, resultView: task.activeSurface.resultView }
              )}
              onClose={() => void handleAction('CLOSE_SURFACE')}
            />
          )}

          {viewedResultUnavailable && (
            <div className="flex h-full w-full flex-col border-l border-[#E2E8F0] bg-white shadow-sm" aria-label="历史结果不可读取">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-[#FAFAFA] px-5">
                <div><h3 className="text-sm font-bold text-[#0F172A]">结果详情</h3><p className="text-[11px] text-[#64748B]">历史结果读取状态</p></div>
                <button onClick={() => void handleAction('CLOSE_SURFACE')} aria-label="关闭结果详情" title="关闭结果详情" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]">×</button>
              </div>
              <div className="p-5 text-xs"><p className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFCFF] p-3 leading-relaxed text-[#64748B]">这份历史结果当前不可读取。服务尚未确认当前访问授权，因此不会展示浏览器缓存的结果内容或依据。</p></div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
};
