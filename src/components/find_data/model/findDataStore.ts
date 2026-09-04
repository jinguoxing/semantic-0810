import { FindDataTaskState } from './FindDataTask';

export interface StoredFindDataTask {
  storeSchemaVersion: 1;
  taskSchemaVersion: 1;
  savedAt: string;
  task: FindDataTaskState;
}

export interface FindDataTaskStore {
  load(taskId: string): FindDataTaskState | null;
  save(task: FindDataTaskState): void;
  remove(taskId: string): void;
  list(): FindDataTaskState[];
  getCurrentTaskId(): string | null;
  setCurrentTaskId(taskId: string | null): void;
}

const STORAGE_PREFIX = 'semovix_find_data_task_';
const CURRENT_TASK_KEY = 'semovix_find_data_current_task_id';

function parseStoredTask(raw: string): FindDataTaskState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Partial<StoredFindDataTask> & Partial<FindDataTaskState>;
    if (candidate.storeSchemaVersion === 1 && candidate.taskSchemaVersion === 1 && candidate.task?.taskId) {
      return candidate.task;
    }
    // Migrate the original unversioned local format when it contains the full task contract.
    if (typeof candidate.taskId === 'string' && candidate.requirementHypothesis && candidate.dataSolution) {
      return candidate as FindDataTaskState;
    }
    return null;
  } catch {
    return null;
  }
}

export class LocalStorageFindDataTaskStore implements FindDataTaskStore {
  getCurrentTaskId(): string | null {
    try {
      return typeof window === 'undefined' ? null : localStorage.getItem(CURRENT_TASK_KEY);
    } catch {
      return null;
    }
  }

  setCurrentTaskId(taskId: string | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (taskId) localStorage.setItem(CURRENT_TASK_KEY, taskId);
      else localStorage.removeItem(CURRENT_TASK_KEY);
    } catch {
      // Storage availability is optional.
    }
  }

  load(taskId: string): FindDataTaskState | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${taskId}`);
      return raw ? parseStoredTask(raw) : null;
    } catch {
      return null;
    }
  }

  save(task: FindDataTaskState): void {
    if (typeof window === 'undefined' || !task.taskId) return;
    const stored: StoredFindDataTask = {
      storeSchemaVersion: 1,
      taskSchemaVersion: 1,
      savedAt: new Date().toISOString(),
      task
    };
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${task.taskId}`, JSON.stringify(stored));
    } catch {
      // Storage quota is non-fatal.
    }
  }

  remove(taskId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${taskId}`);
    } catch {
      // Storage availability is optional.
    }
  }

  list(): FindDataTaskState[] {
    if (typeof window === 'undefined') return [];
    const results: FindDataTaskState[] = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key?.startsWith(STORAGE_PREFIX)) continue;
        const raw = localStorage.getItem(key);
        const task = raw ? parseStoredTask(raw) : null;
        if (task) results.push(task);
      }
    } catch {
      return [];
    }
    return results.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }
}

export class NoopFindDataTaskStore implements FindDataTaskStore {
  load(): FindDataTaskState | null { return null; }
  save(): void {}
  remove(): void {}
  list(): FindDataTaskState[] { return []; }
  getCurrentTaskId(): string | null { return null; }
  setCurrentTaskId(): void {}
}

export class DisconnectedSessionTaskStore extends LocalStorageFindDataTaskStore {
  save(task: FindDataTaskState): void {
    super.save({
      ...task,
      resources: {},
      dataSolution: { ...task.dataSolution, items: [], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [] },
      searchResult: { query: '', totalMatches: 0, candidateIds: [], candidateSnapshot: [], returnedCount: 0 },
      askPlan: undefined,
      permissionRequests: {}
    });
  }
}

export type FindDataMode = 'mock' | 'http' | 'disconnected';

export function createFindDataTaskStore(mode: FindDataMode): FindDataTaskStore {
  if (mode === 'mock') return new LocalStorageFindDataTaskStore();
  if (mode === 'disconnected') return new DisconnectedSessionTaskStore();
  return new NoopFindDataTaskStore();
}

export const defaultTaskStore = new LocalStorageFindDataTaskStore();
