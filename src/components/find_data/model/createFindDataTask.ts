import { FindDataEntryContext, FindDataTaskState } from './FindDataTask';

interface CreateFindDataTaskOptions {
  taskId: string;
  initialQuery?: string;
  scenarioKey?: string;
  entryContext?: FindDataEntryContext;
}

export function createFindDataTask({
  taskId,
  initialQuery = '',
  scenarioKey,
  entryContext
}: CreateFindDataTaskOptions): FindDataTaskState {
  const now = new Date().toISOString();
  const normalizedQuery = initialQuery.trim();
  const title = normalizedQuery.length > 24
    ? `${normalizedQuery.slice(0, 24)}...`
    : normalizedQuery || '新建找数据任务';

  return {
    taskId,
    title,
    status: 'IDLE',
    scenarioKey,
    goal: normalizedQuery || undefined,
    requirementHypothesis: { dimensions: [], analysisFocus: [], assumptions: [], unresolvedQuestions: [] },
    searchScope: { domains: [], includeCrossDepartment: true },
    turns: [],
    resources: {},
    searchResult: { totalMatches: 0, candidateIds: [], candidateSnapshot: [], returnedCount: 0, query: '' },
    dataSolution: {
      state: 'EMPTY',
      basedOnRequirementRevision: 0,
      basedOnSearchRevision: 0,
      items: [], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: now
    },
    permissionRequests: {},
    activeResourceId: undefined,
    activeSurface: { type: 'CLOSED', mode: 'QUICK_PREVIEW' },
    requirementRevision: 0,
    searchRevision: 0,
    runtimeStatus: { active: false, message: '' },
    askPlan: undefined,
    entryContext,
    metadata: {},
    createdAt: now,
    updatedAt: now
  };
}
