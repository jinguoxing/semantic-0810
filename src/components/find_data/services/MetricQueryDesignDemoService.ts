import {
  AskResultCitation,
  AskResultSnapshot,
  ClarificationQuestion,
  DirectMetricQueryState,
  FindDataTaskState,
  TaskAction,
  TurnTargetContext
} from '../model/FindDataTask';
import { FindDataEvent } from '../model/findDataEvents';
import { findDataReducer } from '../model/findDataReducer';
import { selectResultTargetByRef } from '../model/findDataSelectors';
import { createScenarioId } from '../scenarios/FindDataScenario';
import {
  CreateFindDataTaskInput,
  FindDataEngineResult,
  FindDataService,
  FindDataTaskSummary,
  PermissionRecheckResult
} from './FindDataService';
import { MockFindDataService } from './MockFindDataService';

/**
 * Isolated visual-contract adapter for figures 01 and 02. It is intentionally
 * not the default Mock service and never participates in HTTP or disconnected
 * execution. The values below are the approved design sample, not production
 * statistics.
 */
export class MetricQueryDesignDemoService implements FindDataService {
  private readonly fallback = new MockFindDataService();
  private readonly tasks = new Map<string, FindDataTaskState>();

  async createTask(input?: CreateFindDataTaskInput): Promise<FindDataTaskState> {
    return this.fallback.createTask(input);
  }

  async listTasks(): Promise<FindDataTaskSummary[]> {
    const fallback = await this.fallback.listTasks();
    const own = Array.from(this.tasks.values()).map(({ taskId, title, status, updatedAt, scenarioKey }) => ({ taskId, title, status, updatedAt, scenarioKey }));
    return [...own, ...fallback.filter((item) => !this.tasks.has(item.taskId))]
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }

  async getTask(taskId: string): Promise<FindDataTaskState> {
    return this.tasks.get(taskId) ?? this.fallback.getTask(taskId);
  }

  async deleteTask(taskId: string): Promise<void> {
    if (this.tasks.delete(taskId)) return;
    await this.fallback.deleteTask(taskId);
  }

  async submitTurn(task: FindDataTaskState, text: string, operationId = createScenarioId('operation'), context?: TurnTargetContext): Promise<FindDataEngineResult> {
    if (context?.resultTarget) {
      this.tasks.set(task.taskId, task);
      return this.persist(task, this.interpretResult(task, context, operationId));
    }
    if (/(生成.*床位.*比较|查看.*两份.*床位|在营可用.*核定.*比较)/.test(text)) {
      this.tasks.set(task.taskId, task);
      return this.persist(task, this.historyComparison(task, operationId));
    }
    const designKind = this.resolveDesignKind(task, text);
    if (!designKind) return this.fallback.submitTurn(task, text, operationId, context);
    this.tasks.set(task.taskId, task);
    const result = designKind === 'ELDERLY'
      ? this.handleElderlyTurn(task, text, operationId)
      : designKind === 'DEFINITION'
      ? this.handleDefinitionTurn(task, operationId)
      : this.handleBedTurn(task, text, operationId);
    return this.persist(task, result);
  }

  async executeAction(task: FindDataTaskState, action: TaskAction, operationId = createScenarioId('operation')): Promise<FindDataEngineResult> {
    if (!this.isDesignTask(task)) return this.fallback.executeAction(task, action, operationId);
    this.tasks.set(task.taskId, task);
    const result = action.actionCode === 'SUBMIT_CLARIFICATION'
      ? this.submitClarification(task, action, operationId)
      : action.actionCode === 'RUN_METRIC_QUERY'
      ? this.runMetricQuery(task, action, operationId)
      : this.notice(task, operationId, '当前设计演示仅支持提交口径或继续本次指标查询。', 'warning');
    return this.persist(task, result);
  }

  async recheckPermissions(task: FindDataTaskState, resourceIds: string[], action: 'query' | 'preview' | 'export', operationId?: string): Promise<PermissionRecheckResult> {
    return this.fallback.recheckPermissions(task, resourceIds, action, operationId);
  }

  async runAskPlan(task: FindDataTaskState, request: Parameters<FindDataService['runAskPlan']>[1], operationId?: string) {
    return this.fallback.runAskPlan(task, request, operationId);
  }

  private persist(task: FindDataTaskState, result: FindDataEngineResult): FindDataEngineResult {
    this.tasks.set(task.taskId, result.events.reduce(findDataReducer, task));
    return result;
  }

  private isDesignTask(task: FindDataTaskState): boolean {
    return task.entryContext?.target.id === 'met_elderly_population' || task.directMetricQuery?.metricId.startsWith('design_') === true ||
      task.turns.some((turn) => turn.blocks.some((block) => block.type === 'CLARIFICATION' && block.question.id.startsWith('design_')));
  }

  private resolveDesignKind(task: FindDataTaskState, text: string): 'ELDERLY' | 'BED' | 'DEFINITION' | undefined {
    const asksDefinition = /(指标定义|查看.*定义|定义是什么|口径是什么|查看.*口径)/.test(text);
    if (task.entryContext?.target.kind === 'METRIC' && task.entryContext.target.id === 'met_elderly_population' &&
      (task.entryContext.intent === 'VIEW_DEFINITION' || asksDefinition)) return 'DEFINITION';
    if (task.entryContext?.target.kind === 'METRIC' && task.entryContext.target.id === 'met_elderly_population') return 'ELDERLY';
    if (asksDefinition && /(老年人口|60\s*岁及以上常住人口)/.test(text)) return 'DEFINITION';
    if (/(老年人口|60\s*岁及以上常住人口)/.test(text)) return 'ELDERLY';
    if (/养老床位/.test(text)) return 'BED';
    return undefined;
  }

  private assistantEvent(blocks: FindDataTaskState['turns'][number]['blocks'], nextStatus: FindDataTaskState['status'], source?: FindDataTaskState['turns'][number]['source']): FindDataEvent {
    return {
      type: 'ASSISTANT_TURN_RECEIVED',
      payload: { turnId: createScenarioId('assistant'), blocks, nextStatus, source }
    };
  }

  private notice(task: FindDataTaskState, operationId: string, message: string, level: 'info' | 'warning' | 'error' = 'info'): FindDataEngineResult {
    const block = { type: 'SYSTEM_NOTICE' as const, id: createScenarioId('notice'), level, message };
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent([block], task.status)],
      assistantBlocks: [block]
    };
  }

  private clarification(question: ClarificationQuestion) {
    return { type: 'CLARIFICATION' as const, id: createScenarioId('clarification'), question };
  }

  private handleElderlyTurn(task: FindDataTaskState, text: string, operationId: string): FindDataEngineResult {
    const scope = this.scopeFrom(text, task);
    if (!scope) {
      const question: ClarificationQuestion = {
        id: 'design_elderly_scope',
        question: '请补充需要查询的地区和统计时间。',
        type: 'SINGLE',
        options: [
          { id: 'pujin_2026_08', label: '浦锦街道 · 2026 年 8 月末' },
          { id: 'qibao_2026_08', label: '七宝镇 · 2026 年 8 月末' }
        ],
        submitLabel: '按此范围继续查询'
      };
      const block = this.clarification(question);
      return {
        taskId: task.taskId,
        operationId,
        events: [this.assistantEvent([{ type: 'TEXT', id: createScenarioId('text'), content: '已识别到正式指标「老年人口数」，但还缺少查询地区和统计时间。' }, block], 'NEEDS_CLARIFICATION')],
        assistantBlocks: [block]
      };
    }
    const query = this.queryState(task, 'met_elderly_population', this.elderlyDefinition());
    const snapshot = this.snapshotFor(task, query, scope, undefined, operationId);
    return this.completedResult(task, query, snapshot, operationId);
  }

  private handleDefinitionTurn(task: FindDataTaskState, operationId: string): FindDataEngineResult {
    const definition = this.elderlyDefinition();
    const detail = definition.definition;
    const content = [
      `指标「${definition.label}」当前引用版本为 ${definition.version ?? '未返回版本'}。`,
      detail?.meaning,
      detail ? `单位：${detail.unit}；范围：${detail.scope}；时间语义：${detail.timeSemantics}。` : undefined
    ].filter(Boolean).join(' ');
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent([{ type: 'TEXT', id: createScenarioId('definition'), content }], 'READY')],
      assistantBlocks: [{ type: 'TEXT', id: createScenarioId('definition'), content }]
    };
  }

  private handleBedTurn(task: FindDataTaskState, _text: string, operationId: string): FindDataEngineResult {
    const question: ClarificationQuestion = {
      id: 'design_bed_definition',
      question: '“养老床位数”有多种可见口径，请选择本次查询使用的口径。',
      type: 'SINGLE',
      options: [
        { id: 'available', label: '在营可用养老床位数' },
        { id: 'approved', label: '养老床位核定数' }
      ],
      submitLabel: '使用此口径继续查询'
    };
    const block = this.clarification(question);
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent([{ type: 'TEXT', id: createScenarioId('text'), content: '设计演示中已保留你提出的地区和时间；数值查询前需要明确床位统计口径。' }, block], 'NEEDS_CLARIFICATION')],
      assistantBlocks: [block]
    };
  }

  private submitClarification(task: FindDataTaskState, action: TaskAction, operationId: string): FindDataEngineResult {
    const questionId = action.payload?.questionId as string | undefined;
    const selected = Array.from(new Set((action.payload?.selectedOptionIds as string[] | undefined) ?? []));
    const question = task.turns.flatMap((turn) => turn.blocks).find((block): block is { type: 'CLARIFICATION'; id: string; question: ClarificationQuestion } => block.type === 'CLARIFICATION' && block.question.id === questionId);
    if (!question || question.question.resolution?.status === 'RESOLVED' || question.question.resolution?.status === 'STALE' || selected.length !== 1 || !question.question.options.some((option) => option.id === selected[0])) {
      return this.notice(task, operationId, '请选择一个有效口径后再继续。', 'warning');
    }
    const metricId = questionId === 'design_elderly_scope' ? 'met_elderly_population' : 'design_elderly_bed_capacity';
    const definition = metricId === 'met_elderly_population'
      ? this.elderlyDefinition()
      : this.bedDefinition(selected[0]);
    const query = this.queryState(task, metricId, definition);
    const label = question.question.options.find((option) => option.id === selected[0])!.label;
    return {
      taskId: task.taskId,
      operationId,
      events: [
        {
          type: 'CLARIFICATION_RESOLVED',
          payload: {
            questionId,
            selectedOptionIds: selected,
            selectedOptionLabels: [label],
            requirementRevision: task.requirementRevision,
            resolvedAt: new Date().toISOString()
          }
        },
        { type: 'DIRECT_METRIC_QUERY_PREPARED', payload: { query } },
        this.assistantEvent([{ type: 'TEXT', id: createScenarioId('text'), content: '口径已确认；现在将按本次选择继续查询。' }], 'WAITING_USER')
      ],
      assistantBlocks: []
    };
  }

  private runMetricQuery(task: FindDataTaskState, action: TaskAction, operationId: string): FindDataEngineResult {
    const requestId = action.payload?.requestId as string | undefined;
    const query = task.directMetricQuery;
    if (!query || query.requestId !== requestId || !['READY', 'RUNNING'].includes(query.status)) {
      return this.notice(task, operationId, '当前指标请求已变化或尚未就绪，请以最新状态为准。', 'warning');
    }
    const definition = query.metricId === 'met_elderly_population' ? this.elderlyDefinition() : this.bedDefinition(query.definitionRef?.id === 'definition_design_bed_approved' ? 'approved' : 'available');
    const scope = query.metricId === 'met_elderly_population'
      ? this.scopeFromSelection(task) ?? { region: '浦锦街道', time: '2026-08', value: 20000 }
      : { region: '七宝镇', time: '2026-08', value: definition.id === 'definition_design_bed_approved' ? 1000 : 800 };
    const snapshot = this.snapshotFor(task, query, scope, definition, operationId);
    return this.completedResult(task, query, snapshot, operationId);
  }

  private completedResult(task: FindDataTaskState, query: DirectMetricQueryState, snapshot: AskResultSnapshot, operationId: string): FindDataEngineResult {
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [
      { type: 'TEXT', id: createScenarioId('text'), content: '查询已完成，关键结果如下。' },
      { type: 'ASK_RESULT', id: createScenarioId('metric_result'), snapshot }
    ];
    return {
      taskId: task.taskId,
      operationId,
      events: [
        { type: 'DIRECT_METRIC_QUERY_PREPARED', payload: { query } },
        { type: 'DIRECT_METRIC_QUERY_STARTED', payload: { requestId: query.requestId } },
        { type: 'DIRECT_METRIC_RESULT_RECEIVED', payload: { snapshot } },
        this.assistantEvent(blocks, 'READY', {
          kind: 'DIRECT_METRIC_RESULT',
          requirementRevision: task.requirementRevision,
          resultExecutedAt: snapshot.executedAt
        })
      ],
      assistantBlocks: blocks
    };
  }

  /** Approved figure-05 fixture, isolated from the default Mock service. */
  private historyComparison(task: FindDataTaskState, operationId: string): FindDataEngineResult {
    const available = this.historyComparisonSnapshot(task, 'available', operationId);
    const approved = this.historyComparisonSnapshot(task, 'approved', operationId);
    const blocks: FindDataTaskState['turns'][number]['blocks'] = [
      { type: 'TEXT', id: createScenarioId('history_text'), content: '设计演示中已保留两份独立结果。请选择其中一份查看或继续解读；这不会恢复或重新执行任何计划。' },
      { type: 'ASK_RESULT', id: 'design_history_available', snapshot: available },
      { type: 'ASK_RESULT', id: 'design_history_approved', snapshot: approved }
    ];
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent(blocks, 'READY', { kind: 'ASK_RESULT', requirementRevision: task.requirementRevision })],
      assistantBlocks: blocks,
      surfaceCommand: { action: 'NO_CHANGE' }
    };
  }

  private historyComparisonSnapshot(task: FindDataTaskState, kind: 'available' | 'approved', operationId: string): AskResultSnapshot {
    const definition = this.bedDefinition(kind);
    const rows = kind === 'available'
      ? [{ name: '浦锦街道', value: 15.0 }, { name: '七宝镇', value: 20.0 }]
      : [{ name: '浦锦街道', value: 22.5 }, { name: '七宝镇', value: 25.0 }];
    const difference = Math.abs(rows[0].value - rows[1].value);
    const label = kind === 'available' ? '在营可用床位比较' : '核定床位比较';
    return {
      binding: {
        kind: 'DIRECT_METRIC', taskId: task.taskId,
        requestId: `design_history_${kind}`,
        metricId: kind === 'available' ? 'design_bed_supply_available_compare' : 'design_bed_supply_approved_compare',
        requirementRevision: task.requirementRevision
      },
      operationId,
      executedAt: '2026-08-31T23:59:59.000Z',
      metricName: '养老床位供给比较',
      numeratorLabel: definition.label,
      formulaExplanation: '每千名老人对应床位数；仅展示这两份设计演示快照返回的比较值。',
      dataOrigin: 'MOCK_FIXTURE',
      resultArtifact: {
        resultRef: { kind: 'SERVICE_RESULT', id: `design-history-${kind}` },
        citations: [definition],
        content: {
          kind: 'TABLE',
          columns: [
            { id: 'town', label: '街镇', kind: 'TEXT' },
            { id: 'ratio', label: '每千名老人床位数', kind: 'NUMBER', unit: '张 / 千人' }
          ],
          rows: rows.map((row) => ({
            id: row.name,
            cells: {
              town: { kind: 'TEXT', state: 'VALUE', value: row.name },
              ratio: { kind: 'NUMBER', state: 'VALUE', value: row.value, unit: '张 / 千人', precision: 1 }
            }
          })),
          chart: { kind: 'BAR', categoryColumnId: 'town', valueColumnId: 'ratio', title: label }
        },
        actualScope: { region: '浦锦街道、七宝镇', timeRange: { start: '2026-08', end: '2026-08' }, grain: 'MONTH' },
        summary: `${label}：浦锦街道与七宝镇相差 ${difference.toFixed(1)} 张 / 千人。`,
        boundaryNotice: '设计演示数据，非真实业务统计。当前结果未提供机构规模、投入、床位利用或建设节奏等原因证据。'
      }
    };
  }

  private interpretResult(task: FindDataTaskState, context: TurnTargetContext, operationId: string): FindDataEngineResult {
    const selected = selectResultTargetByRef(task, { taskId: task.taskId, ...context.resultTarget! });
    if (!selected) return this.notice(task, operationId, '这份结果已无法精确定位，未使用最新结果替代。', 'warning');
    const table = selected.snapshot.resultArtifact.content?.kind === 'TABLE' ? selected.snapshot.resultArtifact.content : undefined;
    const numberColumn = table?.columns.find((column) => column.kind === 'NUMBER');
    const values = table && numberColumn ? table.rows.flatMap((row) => {
      const label = table.columns.find((column) => column.kind === 'TEXT');
      const text = label ? row.cells[label.id] : undefined;
      const value = row.cells[numberColumn.id];
      return text?.kind === 'TEXT' && text.state === 'VALUE' && value?.kind === 'NUMBER' && value.state === 'VALUE' && typeof value.value === 'number'
        ? [{ label: text.value ?? '未提供', value: value.value, unit: value.unit ?? numberColumn.unit }]
        : [];
    }) : [];
    const comparison = values.length >= 2
      ? `${values[0].label}为 ${values[0].value.toFixed(1)} ${values[0].unit ?? ''}，${values[1].label}为 ${values[1].value.toFixed(1)} ${values[1].unit ?? ''}，相差 ${Math.abs(values[0].value - values[1].value).toFixed(1)} ${values[0].unit ?? ''}。`
      : '这份结果未提供可用于比较的两项数值。';
    const block: FindDataTaskState['turns'][number]['blocks'][number] = {
      type: 'TEXT', id: createScenarioId('history_interpretation'),
      content: `我只解读「${selected.displayLabel}」。${comparison} 当前结果没有返回机构规模、投入、床位利用或建设节奏等原因证据，因此不能据此判断差异原因，也不能生成预测或建设建议。`
    };
    return {
      taskId: task.taskId,
      operationId,
      events: [this.assistantEvent([block], 'READY', {
        kind: 'ASK_RESULT',
        requirementRevision: selected.target.binding.requirementRevision,
        resultExecutedAt: selected.target.executedAt,
        resultTarget: selected.target
      })],
      assistantBlocks: [block],
      surfaceCommand: { action: 'NO_CHANGE' }
    };
  }

  private queryState(task: FindDataTaskState, metricId: string, definition: AskResultCitation): DirectMetricQueryState {
    return {
      requestId: createScenarioId('metric_request'),
      metricId,
      definitionRef: { id: definition.id, label: definition.label, version: definition.version },
      status: 'READY',
      preparedAt: new Date().toISOString()
    };
  }

  private scopeFrom(text: string, task: FindDataTaskState): { region: string; time: string; value: number } | undefined {
    const region = task.entryContext?.knownConditions?.region ?? (text.includes('浦锦') ? '浦锦街道' : text.includes('七宝') ? '七宝镇' : undefined);
    const time = task.entryContext?.knownConditions?.timeRange?.start ?? (/2026\s*年?\s*8\s*月/.test(text) ? '2026-08' : undefined);
    if (!region || time !== '2026-08') return undefined;
    if (region === '浦锦街道') return { region, time, value: 20000 };
    if (region === '七宝镇') return { region, time, value: 40000 };
    return undefined;
  }

  private scopeFromSelection(task: FindDataTaskState): { region: string; time: string; value: number } | undefined {
    const question = task.turns.flatMap((turn) => turn.blocks).find((block) => block.type === 'CLARIFICATION' && block.question.id === 'design_elderly_scope');
    const selected = question?.type === 'CLARIFICATION' ? question.question.resolution?.selectedOptionIds[0] : undefined;
    if (selected === 'qibao_2026_08') return { region: '七宝镇', time: '2026-08', value: 40000 };
    if (selected === 'pujin_2026_08') return { region: '浦锦街道', time: '2026-08', value: 20000 };
    return undefined;
  }

  private elderlyDefinition(): AskResultCitation {
    return {
      kind: 'METRIC_DEFINITION', id: 'met_elderly_population', label: '老年人口数', version: 'v1.1.0',
      definition: {
        meaning: '统计周期内在辖区内居住满半年且年龄达到或超过 60 周岁的常住人口总数。',
        unit: '人', scope: '常住人口 60 岁及以上群体', timeSemantics: '统计日期 · 月度快照', source: '设计演示定义快照'
      }
    };
  }

  private bedDefinition(option: string | undefined): AskResultCitation {
    const approved = option === 'approved';
    return {
      kind: 'METRIC_DEFINITION',
      id: approved ? 'definition_design_bed_approved' : 'definition_design_bed_available',
      label: approved ? '养老床位核定数' : '在营可用养老床位数',
      version: 'design-v1',
      definition: {
        meaning: approved ? '已核定的养老床位容量。' : '民政核定且当前在营、可实际提供服务的养老床位数。',
        unit: '张', scope: '养老服务机构床位', timeSemantics: '月末存量 · 月度快照', source: '设计演示定义快照'
      }
    };
  }

  private snapshotFor(
    task: FindDataTaskState,
    query: DirectMetricQueryState,
    scope: { region: string; time: string; value: number },
    explicitDefinition: AskResultCitation | undefined,
    operationId: string
  ): AskResultSnapshot {
    const definition = explicitDefinition ?? this.elderlyDefinition();
    const isBed = query.metricId.startsWith('design_');
    const metricName = isBed ? definition.label : '老年人口数';
    return {
      binding: { kind: 'DIRECT_METRIC', taskId: task.taskId, requestId: query.requestId, metricId: query.metricId, requirementRevision: task.requirementRevision },
      operationId,
      executedAt: new Date().toISOString(),
      metricName,
      numeratorLabel: isBed ? definition.label : '60 岁及以上常住人口',
      dataOrigin: 'MOCK_FIXTURE',
      resultArtifact: {
        resultRef: { kind: 'SERVICE_RESULT', id: `design-result-${query.requestId}` },
        citations: [definition],
        content: {
          kind: 'SCALAR',
          label: `${scope.time.replace('-', ' 年 ')} 月，${scope.region}${isBed ? definition.label : '60 岁及以上常住人口'}`,
          value: { kind: 'NUMBER', state: 'VALUE', value: scope.value, unit: isBed ? '张' : '人', precision: 0 }
        },
        actualScope: { region: scope.region, timeRange: { start: scope.time, end: scope.time }, grain: 'MONTH' },
        boundaryNotice: '设计演示数据，非真实业务统计；仅用于验证指标查询与口径澄清交互。'
      }
    };
  }
}
