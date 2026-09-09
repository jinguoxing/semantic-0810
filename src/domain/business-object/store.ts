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
 *
 * Schema V3（最终收口：规范资产身份）：
 * - taskContexts.sourceId/sourceName/sourceRevision → dataAsset（规范引用）+ semanticSource（仅语义来源）
 * - implementations.assetId 经统一目录解析（如 res-02 → asset-1）
 * - 无法解析的旧来源保留为兼容引用并标记 migrationWarning（只读，不再产生正式绑定）
 *
 * Schema V4（Grounding 修正目标 ID 化，§9）：
 * - AttributeGrounding / RelationshipGrounding 增加 attributeId / relationshipId
 * - GroundingRevision 增加 targetId / targetKey（同键至多一条 ACTIVE）
 * - 旧修订迁移时补 legacy 目标键并归档为 HISTORY，绝不丢弃
 * 读取到 V1 / V2 / V3 状态时执行结构化迁移链并回写为 V4，绝不因 Schema 升级清空用户状态。
 */
import {
  BusinessObject,
  BusinessObjectDraft,
  BusinessObjectRevision,
  DataImplementation,
  DataSupportBinding,
  DataSupportRevision,
  GroundingRevision,
  ObjectResolutionContext,
  ObjectResolutionStatus
} from './types';
import { resolveCanonicalDataAsset, resolveCanonicalDataAssetId } from './asset-identity';

const STORAGE_KEY = 'semovix_business_object_state_v1';

const CURRENT_VERSION = 4;

export interface BusinessObjectStoreState {
  version: 4;
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

/** 旧版（V1 / V2）任务上下文的结构：扁平 sourceId / sourceName / sourceRevision */
interface LegacyTaskContext {
  taskId: string;
  sourceType: 'DATA_ASSET' | 'DATA_SEMANTICS' | 'TASK';
  sourceId: string;
  sourceName?: string;
  sourceRevision: string;
  returnRoute: string;
  returnFocus?: string;
  createdAt: string;
  status?: ObjectResolutionStatus;
  updatedAt?: string;
}

/** V1 持久化状态的结构（缺 drafts / dataSupportRevisions，taskContexts 缺状态字段） */
interface LegacyV1State {
  version: 1;
  objects: Record<string, BusinessObject>;
  implementations: Record<string, DataImplementation>;
  bindings: Record<string, DataSupportBinding>;
  groundingRevisions: Record<string, GroundingRevision>;
  revisions: Record<string, BusinessObjectRevision>;
  taskContexts: Record<string, LegacyTaskContext>;
}

/** V2 持久化状态的结构（taskContexts 仍是扁平来源字段） */
interface LegacyV2State {
  version: 2;
  objects: Record<string, BusinessObject>;
  implementations: Record<string, DataImplementation>;
  bindings: Record<string, DataSupportBinding>;
  groundingRevisions: Record<string, GroundingRevision>;
  revisions: Record<string, BusinessObjectRevision>;
  taskContexts: Record<string, LegacyTaskContext>;
  drafts: Record<string, BusinessObjectDraft>;
  dataSupportRevisions: Record<string, DataSupportRevision>;
}

/** V3 持久化状态的结构（groundingRevisions 尚无 targetId / targetKey） */
interface LegacyV3State {
  version: 3;
  objects: Record<string, BusinessObject>;
  implementations: Record<string, DataImplementation>;
  bindings: Record<string, DataSupportBinding>;
  groundingRevisions: Record<string, Omit<GroundingRevision, 'targetId' | 'targetKey'>>;
  revisions: Record<string, BusinessObjectRevision>;
  taskContexts: Record<string, ObjectResolutionContext>;
  drafts: Record<string, BusinessObjectDraft>;
  dataSupportRevisions: Record<string, DataSupportRevision>;
}

/** V1 → V2 结构化迁移：补齐新集合，回填任务上下文状态字段 */
function migrateV1ToV2(legacy: LegacyV1State): LegacyV2State {
  const taskContexts: Record<string, LegacyTaskContext> = {};
  Object.entries(legacy.taskContexts ?? {}).forEach(([taskId, context]) => {
    taskContexts[taskId] = {
      ...context,
      status: 'OPEN',
      updatedAt: context.createdAt
    };
  });
  return {
    version: 2,
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

/** 旧来源字段 → 规范 dataAsset 引用；语义入口单独保留 semanticSource（仅证据） */
function migrateLegacyTaskContext(context: LegacyTaskContext): ObjectResolutionContext {
  const resolved = resolveCanonicalDataAsset({ id: context.sourceId, name: context.sourceName });
  return {
    taskId: context.taskId,
    sourceType: context.sourceType,
    dataAsset: resolved.reference,
    ...(context.sourceType === 'DATA_SEMANTICS'
      ? { semanticSource: { semanticId: context.sourceId, semanticRevision: context.sourceRevision } }
      : {}),
    returnRoute: context.returnRoute,
    ...(context.returnFocus ? { returnFocus: context.returnFocus } : {}),
    createdAt: context.createdAt,
    status: context.status ?? 'OPEN',
    updatedAt: context.updatedAt ?? context.createdAt,
    ...(resolved.canonical
      ? {}
      : {
          migrationWarning: `来源「${context.sourceId}」无法解析到统一数据资产目录，该对齐上下文只读保留，不再产生正式绑定。`
        })
  };
}

/** V2 → V3 结构化迁移：规范资产身份（dataAsset / semanticSource / assetId） */
function migrateV2ToV3(legacy: LegacyV2State): LegacyV3State {
  const taskContexts: Record<string, ObjectResolutionContext> = {};
  Object.entries(legacy.taskContexts ?? {}).forEach(([taskId, context]) => {
    taskContexts[taskId] = migrateLegacyTaskContext(context);
  });

  const implementations: Record<string, DataImplementation> = {};
  Object.values(legacy.implementations ?? {}).forEach((implementation) => {
    const canonicalAssetId = resolveCanonicalDataAssetId(implementation.assetId);
    implementations[implementation.id] = canonicalAssetId
      ? { ...implementation, assetId: canonicalAssetId }
      : { ...implementation };
  });

  return {
    version: 3,
    objects: legacy.objects ?? {},
    implementations,
    bindings: legacy.bindings ?? {},
    groundingRevisions: legacy.groundingRevisions ?? {},
    revisions: legacy.revisions ?? {},
    taskContexts,
    drafts: legacy.drafts ?? {},
    dataSupportRevisions: legacy.dataSupportRevisions ?? {}
  };
}

/**
 * V3 → V4 结构化迁移：Grounding 修正目标 ID 化（§9）。
 * 旧修订没有 targetId / targetKey，统一补 legacy 目标键（legacy:{targetName}）并归档为
 * HISTORY —— 迁移后「同一 targetKey 至多一条 ACTIVE」对旧数据自然成立，且旧键与
 * 新业务属性 / 关系 ID 键不冲突。旧实现落地行如缺 attributeId / relationshipId，
 * 其后续修正将以 TARGET_NOT_FOUND 拒绝（零写入）；新种子与新生成的实现均带 ID。
 */
function migrateV3ToV4(legacy: LegacyV3State): BusinessObjectStoreState {
  const groundingRevisions: Record<string, GroundingRevision> = {};
  Object.values(legacy.groundingRevisions ?? {}).forEach((revision) => {
    const targetId = `legacy:${revision.targetName}`;
    groundingRevisions[revision.id] = {
      ...revision,
      targetId,
      targetKey: `${revision.type}:${targetId}`,
      status: revision.status === 'ACTIVE' ? 'HISTORY' : revision.status
    };
  });

  return {
    version: CURRENT_VERSION,
    objects: legacy.objects ?? {},
    implementations: legacy.implementations ?? {},
    bindings: legacy.bindings ?? {},
    groundingRevisions,
    revisions: legacy.revisions ?? {},
    taskContexts: legacy.taskContexts ?? {},
    drafts: legacy.drafts ?? {},
    dataSupportRevisions: legacy.dataSupportRevisions ?? {}
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
    // 迁移链 V1 → V2 → V3 → V4：逐级结构化迁移并回写，绝不因升级清空用户状态
    if (parsed.version === 1 || parsed.version === 2) {
      const asV2 = parsed.version === 1 ? migrateV1ToV2(parsed as unknown as LegacyV1State) : (parsed as unknown as LegacyV2State);
      const migrated = migrateV3ToV4(migrateV2ToV3(asV2));
      persistState(migrated);
      return migrated;
    }
    if (parsed.version === 3) {
      const migrated = migrateV3ToV4(parsed as unknown as LegacyV3State);
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
