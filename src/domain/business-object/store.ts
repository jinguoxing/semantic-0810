/**
 * Business Object 领域状态存储
 *
 * 单一内存状态 + localStorage 持久化（对齐 find_data 的 findDataStore 先例）。
 * 领域模块（registry / draft / data-support / grounding / revision / task-context）
 * 都通过 mutate() 提交变更，保证写入即持久化并通知订阅者。
 *
 * Schema V2（Business Object V2.2 生命周期硬化）：
 * - 新增 drafts（Create / Change 草稿）与 dataSupportRevisions（数据支撑修订）
 * - taskContexts 增加 status / updatedAt / returnFocus
 * 读取到 V1 状态时执行结构化迁移并回写为 V2，绝不因 Schema 升级清空用户状态。
 */
import {
  BusinessObject,
  BusinessObjectDraft,
  BusinessObjectRevision,
  DataImplementation,
  DataSupportBinding,
  DataSupportRevision,
  GroundingRevision,
  ObjectResolutionContext
} from './types';

const STORAGE_KEY = 'semovix_business_object_state_v1';

const CURRENT_VERSION = 2;

export interface BusinessObjectStoreState {
  version: 2;
  objects: Record<string, BusinessObject>;
  implementations: Record<string, DataImplementation>;
  bindings: Record<string, DataSupportBinding>;
  groundingRevisions: Record<string, GroundingRevision>;
  revisions: Record<string, BusinessObjectRevision>;
  taskContexts: Record<string, ObjectResolutionContext>;
  drafts: Record<string, BusinessObjectDraft>;
  dataSupportRevisions: Record<string, DataSupportRevision>;
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

/** V1 持久化状态的结构（缺 drafts / dataSupportRevisions，taskContexts 缺状态字段） */
interface LegacyV1State {
  version: 1;
  objects: Record<string, BusinessObject>;
  implementations: Record<string, DataImplementation>;
  bindings: Record<string, DataSupportBinding>;
  groundingRevisions: Record<string, GroundingRevision>;
  revisions: Record<string, BusinessObjectRevision>;
  taskContexts: Record<string, Omit<ObjectResolutionContext, 'status' | 'updatedAt'>>;
}

/** V1 → V2 结构化迁移：补齐新集合，回填任务上下文状态字段 */
function migrateV1ToV2(legacy: LegacyV1State): BusinessObjectStoreState {
  const taskContexts: Record<string, ObjectResolutionContext> = {};
  Object.entries(legacy.taskContexts ?? {}).forEach(([taskId, context]) => {
    taskContexts[taskId] = {
      ...context,
      status: 'OPEN',
      updatedAt: context.createdAt
    };
  });
  return {
    version: CURRENT_VERSION,
    objects: legacy.objects ?? {},
    implementations: legacy.implementations ?? {},
    bindings: legacy.bindings ?? {},
    groundingRevisions: legacy.groundingRevisions ?? {},
    revisions: legacy.revisions ?? {},
    taskContexts,
    drafts: {},
    dataSupportRevisions: {}
  };
}

export function loadState(): BusinessObjectStoreState | null {
  if (!isBrowserStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BusinessObjectStoreState> & { version?: number };
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.version === CURRENT_VERSION) return parsed as BusinessObjectStoreState;
    if (parsed.version === 1) {
      const migrated = migrateV1ToV2(parsed as unknown as LegacyV1State);
      persistState(migrated);
      return migrated;
    }
    return null;
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

/** 重置为种子态（供测试与开发使用）：全部 8 个集合深拷贝，避免污染种子常量 */
export function resetState(state: BusinessObjectStoreState, seed: BusinessObjectStoreState): void {
  state.objects = structuredClone(seed.objects);
  state.implementations = structuredClone(seed.implementations);
  state.bindings = structuredClone(seed.bindings);
  state.groundingRevisions = structuredClone(seed.groundingRevisions);
  state.revisions = structuredClone(seed.revisions);
  state.taskContexts = structuredClone(seed.taskContexts);
  state.drafts = structuredClone(seed.drafts);
  state.dataSupportRevisions = structuredClone(seed.dataSupportRevisions);
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
