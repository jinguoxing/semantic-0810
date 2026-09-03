import { FindDataTaskState } from './FindDataTask';

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

export class LocalStorageFindDataTaskStore implements FindDataTaskStore {
  getCurrentTaskId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(CURRENT_TASK_KEY);
    } catch {
      return null;
    }
  }

  setCurrentTaskId(taskId: string | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (taskId) {
        localStorage.setItem(CURRENT_TASK_KEY, taskId);
      } else {
        localStorage.removeItem(CURRENT_TASK_KEY);
      }
    } catch {
      // ignore
    }
  }
  load(taskId: string): FindDataTaskState | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${taskId}`);
      if (!data) return null;
      return JSON.parse(data) as FindDataTaskState;
    } catch {
      return null;
    }
  }

  save(task: FindDataTaskState): void {
    if (typeof window === 'undefined' || !task.taskId) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${task.taskId}`, JSON.stringify(task));
    } catch {
      // storage quota or error handling
    }
  }

  remove(taskId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${taskId}`);
    } catch {
      // ignore
    }
  }

  list(): FindDataTaskState[] {
    if (typeof window === 'undefined') return [];
    try {
      const results: FindDataTaskState[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            results.push(JSON.parse(item));
          }
        }
      }
      return results.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch {
      return [];
    }
  }
}

export const defaultTaskStore = new LocalStorageFindDataTaskStore();
