/**
 * Business Object Registry：对象目录仓库
 *
 * 列表 / 检索 / 详情 / 发布 / 状态流转的唯一入口。
 * 状态在首次访问时从 localStorage 恢复，否则使用种子数据。
 */
import { buildSeedState } from './seed';
import { clearPersistedState, loadState, mutate, nowIso, resetState } from './store';
import { BusinessObjectStoreState } from './store';
import { BusinessObject, BusinessObjectStatus } from './types';
import { recordRevision } from './revision';

let state: BusinessObjectStoreState | null = null;

export function getState(): BusinessObjectStoreState {
  if (!state) {
    state = loadState() ?? buildSeedState();
  }
  return state;
}

/** 供测试注入干净状态 */
export function setStateForTesting(next: BusinessObjectStoreState): void {
  state = next;
}

/** 供测试：清空持久化并重置为种子态 */
export function resetDomainStateForTesting(): void {
  clearPersistedState();
  if (!state) {
    state = buildSeedState();
  } else {
    resetState(state, buildSeedState());
  }
}

export const businessObjectRepository = {
  list(): BusinessObject[] {
    return Object.values(getState().objects).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
  },

  get(objectId: string): BusinessObject | undefined {
    return getState().objects[objectId];
  },

  /** 按名称 / 别名 / 定义 / 业务域检索 */
  search(query: string): BusinessObject[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return this.list();
    return this.list().filter((object) => {
      const haystack = [object.name, ...object.aliases, object.definition, object.domain]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  },

  /** 更新定义（变更草稿落地），并产生修订记录 */
  updateDefinition(
    objectId: string,
    input: { definition?: string; aliases?: string[]; attributes?: BusinessObject['attributes']; relationships?: BusinessObject['relationships'] },
    options?: { summary?: string; changes?: string[]; changedBy?: string }
  ): BusinessObject | undefined {
    const current = getState().objects[objectId];
    if (!current) return undefined;
    return mutate(getState(), (draft) => {
      const next = draft.objects[objectId];
      if (input.definition !== undefined) next.definition = input.definition;
      if (input.aliases !== undefined) next.aliases = input.aliases;
      if (input.attributes !== undefined) next.attributes = input.attributes;
      if (input.relationships !== undefined) next.relationships = input.relationships;
      next.updatedAt = nowIso();
      const revision = recordRevision(objectId, {
        summary: options?.summary ?? '业务对象定义更新',
        changes: options?.changes ?? ['更新了业务对象定义内容'],
        changedBy: options?.changedBy ?? '业务对象工作台'
      });
      next.currentRevision = revision.revision;
      return next;
    });
  },

  /** 发布：DRAFT/变更 → PUBLISHED，产生正式修订 */
  publish(
    objectId: string,
    options?: { summary?: string; changes?: string[]; changedBy?: string }
  ): BusinessObject | undefined {
    const current = getState().objects[objectId];
    if (!current) return undefined;
    return mutate(getState(), (draft) => {
      const next = draft.objects[objectId];
      next.status = 'PUBLISHED';
      next.updatedAt = nowIso();
      const revision = recordRevision(objectId, {
        summary: options?.summary ?? `发布「${next.name}」`,
        changes: options?.changes ?? ['正式发布至企业业务语义目录'],
        changedBy: options?.changedBy ?? '业务对象工作台'
      });
      next.currentRevision = revision.revision;
      return next;
    });
  },

  setStatus(objectId: string, status: BusinessObjectStatus): BusinessObject | undefined {
    const current = getState().objects[objectId];
    if (!current) return undefined;
    return mutate(getState(), (draft) => {
      draft.objects[objectId].status = status;
      draft.objects[objectId].updatedAt = nowIso();
      return draft.objects[objectId];
    });
  },

  /** 新建草稿对象 */
  createDraft(input: { name: string; definition: string; domain: string; aliases?: string[] }): BusinessObject {
    const objectId = `bo_${Date.now().toString(36)}`;
    const object: BusinessObject = {
      id: objectId,
      name: input.name,
      aliases: input.aliases ?? [],
      definition: input.definition,
      domain: input.domain,
      status: 'DRAFT',
      currentRevision: 'R0',
      identity: { name: '（待定义）', meaning: '草稿阶段尚未确认身份属性。' },
      attributes: [],
      relationships: [],
      evidence: [],
      terms: [],
      metrics: [],
      relatedData: [],
      updatedAt: nowIso()
    };
    return mutate(getState(), (draft) => {
      draft.objects[objectId] = object;
      return object;
    });
  }
};

/** 列表页展示用：数据支撑摘要 */
export function dataSupportSummary(objectId: string): { count: number; hasImplementation: boolean; mainAsset?: string } {
  const bindings = Object.values(getState().bindings).filter((binding) => binding.businessObjectId === objectId);
  const effective = bindings.filter((binding) => binding.status === 'EFFECTIVE');
  const primary = effective.find((binding) => binding.role === 'PRIMARY');
  const mainImplementation = primary ? getState().implementations[primary.implementationId] : undefined;
  return {
    count: effective.length,
    hasImplementation: effective.length > 0,
    ...(mainImplementation ? { mainAsset: mainImplementation.name } : {})
  };
}
