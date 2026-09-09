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
import { isCurrentBindingStatus } from './data-support';

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
  }
};

/**
 * 列表页展示用：数据支撑摘要。
 * 与 Detail 正式选择器同口径：只统计当前绑定（EFFECTIVE + NEEDS_REVALIDATION），
 * CANDIDATE / RETIRED 不计入（Inv05）；主要数据实现在当前绑定中唯一，
 * 待复核（NEEDS_REVALIDATION）的主实现同样计入（不是「非当前关系」）。
 */
export function dataSupportSummary(objectId: string): { count: number; hasImplementation: boolean; mainAsset?: string } {
  const current = Object.values(getState().bindings).filter(
    (binding) => binding.businessObjectId === objectId && isCurrentBindingStatus(binding.status)
  );
  const primary = current.find((binding) => binding.role === 'PRIMARY');
  const mainImplementation = primary ? getState().implementations[primary.implementationId] : undefined;
  return {
    count: current.length,
    hasImplementation: current.length > 0,
    ...(mainImplementation ? { mainAsset: mainImplementation.name } : {})
  };
}
