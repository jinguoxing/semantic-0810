/**
 * Business Object 领域状态存储
 *
 * 单一内存状态 + localStorage 持久化（对齐 find_data 的 findDataStore 先例）。
 * 领域模块（registry / data-support / grounding / revision / task-context）
 * 都通过 mutate() 提交变更，保证写入即持久化并通知订阅者。
 */
import {
  BusinessObject,
  BusinessObjectRevision,
  DataImplementation,
  DataSupportBinding,
  GroundingRevision,
  ObjectResolutionContext
} from './types';

const STORAGE_KEY = 'semovix_business_object_state_v1';

export interface BusinessObjectStoreState {
  version: 1;
  objects: Record<string, BusinessObject>;
  implementations: Record<string, DataImplementation>;
  bindings: Record<string, DataSupportBinding>;
  groundingRevisions: Record<string, GroundingRevision>;
  revisions: Record<string, BusinessObjectRevision>;
  taskContexts: Record<string, ObjectResolutionContext>;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let version = 0;

function isBrowserStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadState(): BusinessObjectStoreState | null {
  if (!isBrowserStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BusinessObjectStoreState;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistState(state: BusinessObjectStoreState): void {
  if (!isBrowserStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储不可用（隐私模式 / 配额满）时静默降级为内存态
  }
}

export function clearPersistedState(): void {
  if (!isBrowserStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** 事务式提交：读取-变更-持久化-通知，一次完成 */
export function mutate<T>(state: BusinessObjectStoreState, fn: (draft: BusinessObjectStoreState) => T): T {
  const result = fn(state);
  persistState(state);
  version += 1;
  listeners.forEach((listener) => listener());
  return result;
}

/** 重置为种子态（供测试与开发使用） */
export function resetState(state: BusinessObjectStoreState, seed: BusinessObjectStoreState): void {
  state.objects = { ...seed.objects };
  state.implementations = { ...seed.implementations };
  state.bindings = { ...seed.bindings };
  state.groundingRevisions = { ...seed.groundingRevisions };
  state.revisions = { ...seed.revisions };
  state.taskContexts = { ...seed.taskContexts };
  persistState(state);
  version += 1;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 供 React useSyncExternalStore 使用的版本快照 */
export function getVersion(): number {
  return version;
}

export function nextId(prefix: string): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${stamp}${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
