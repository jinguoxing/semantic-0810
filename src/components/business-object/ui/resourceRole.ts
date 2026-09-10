/**
 * 展示层资源角色 View Model（V2.2 §8.4）
 *
 * 数据支撑的资源角色（正式数据实现 / 属性扩展 / 相关数据 / 事件历史 / 分析相关）
 * 从领域数据（Subject / Grain / Identity / Scope）推导，只用于展示分组，
 * 不新增任何 Binding 生命周期状态，不写回领域 Store。
 */
import type {
  BusinessObject,
  DataImplementation,
  DataSupportBinding,
  RelatedDataItem
} from '../../../domain/business-object';

/** 资源在数据支撑中的展示角色 */
export type ResourceRole =
  | 'DATA_IMPLEMENTATION'
  | 'ATTRIBUTE_EXTENSION'
  | 'RELATED_DATA'
  | 'EVENT_HISTORY'
  | 'ANALYTICAL_RELATED';

export const RESOURCE_ROLE_LABELS: Record<ResourceRole, string> = {
  DATA_IMPLEMENTATION: '正式数据实现',
  ATTRIBUTE_EXTENSION: '属性扩展',
  RELATED_DATA: '相关数据',
  EVENT_HISTORY: '事件 / 历史数据',
  ANALYTICAL_RELATED: '分析相关'
};

/** 是否计入「正式数据实现」数量（Header 弱事实与 Tab 徽标用同一口径） */
export function isFormalImplementationRole(role: ResourceRole): boolean {
  return role === 'DATA_IMPLEMENTATION';
}

/** 定义侧「相关数据」声明的展示角色 */
export function deriveRelatedDataRole(item: RelatedDataItem): ResourceRole {
  const role = item.role ?? '';
  if (role.includes('事件') || role.includes('历史')) return 'EVENT_HISTORY';
  if (role.includes('分析') || role.includes('统计')) return 'ANALYTICAL_RELATED';
  return 'RELATED_DATA';
}

/** 事件 / 历史与分析类角色统一归入「相关数据」大类展示 */
export function isRelatedDataRole(role: ResourceRole): boolean {
  return role === 'RELATED_DATA' || role === 'EVENT_HISTORY' || role === 'ANALYTICAL_RELATED';
}

/**
 * 推导某个数据实现的展示角色（仅依据领域字段，禁止按表名硬编码）：
 * 1. 实例身份以业务对象识别属性开头（如「工单编号 · ticket_id」）→ 记录主体即业务对象 → 正式数据实现；
 * 2. 粒度含「统计」→ 分析相关；
 * 3. 对象定义的 relatedData 同名声明为事件 / 历史或分析 → 事件历史 / 分析相关；
 * 4. 落地了对象识别属性：粒度为「一行一个主体」→ 属性扩展；粒度更细（一行一项 / 一次…）→ 相关数据；
 * 5. 其余 → 相关数据。
 */
export function deriveImplementationRole(implementation: DataImplementation, object: BusinessObject): ResourceRole {
  const subjectIdentityPrefix = `${object.identity.name} ·`;
  if (implementation.identity.startsWith(subjectIdentityPrefix)) {
    return 'DATA_IMPLEMENTATION';
  }

  if (implementation.granularity.includes('统计')) {
    return 'ANALYTICAL_RELATED';
  }

  const declared = object.relatedData.find((item) => item.name === implementation.name);
  if (declared) {
    const declaredRole = deriveRelatedDataRole(declared);
    if (declaredRole === 'EVENT_HISTORY' || declaredRole === 'ANALYTICAL_RELATED') {
      return declaredRole;
    }
  }

  const identifierAttributeId = object.attributes.find((attribute) => attribute.isIdentifier)?.id;
  const groundsIdentifier = identifierAttributeId
    ? implementation.attributes.some((attribute) => attribute.attributeId === identifierAttributeId)
    : false;

  if (groundsIdentifier) {
    // 「一行一个<主体>」= 每个主体一条记录（属性扩展）；「一行一项 / 一次 / 一条 / 一笔」= 更细粒度（相关数据）
    const subjectLevelGrain = implementation.granularity.startsWith('一行一个');
    return subjectLevelGrain ? 'ATTRIBUTE_EXTENSION' : 'RELATED_DATA';
  }

  return 'RELATED_DATA';
}

/** 当前数据支撑条目（实现 + 当前绑定） */
export interface CurrentSupportEntry {
  implementation: DataImplementation;
  binding: DataSupportBinding;
}

/** 数据支撑资源的展示视图模型 */
export interface SupportResourceViewModel {
  key: string;
  name: string;
  role: ResourceRole;
  /** 来自当前绑定的资源 */
  implementation?: DataImplementation;
  binding?: DataSupportBinding;
  /** 仅在对象定义中声明、尚未落地为绑定的相关数据 */
  relatedItem?: RelatedDataItem;
}

export interface ClassifiedSupportResources {
  /** 正式数据实现（计入「N 套数据实现」） */
  formal: SupportResourceViewModel[];
  /** 属性扩展资源 */
  attributeExtensions: SupportResourceViewModel[];
  /** 相关数据（含事件历史 / 分析相关） */
  relatedData: SupportResourceViewModel[];
}

/**
 * 把当前绑定按展示角色分组：正式数据实现 / 属性扩展 / 相关数据。
 * 定义侧 relatedData 中尚未落地为绑定的声明一并合入「相关数据」。
 */
export function buildSupportResourceGroups(
  object: BusinessObject,
  entries: CurrentSupportEntry[]
): ClassifiedSupportResources {
  const formal: SupportResourceViewModel[] = [];
  const attributeExtensions: SupportResourceViewModel[] = [];
  const relatedData: SupportResourceViewModel[] = [];
  const boundNames = new Set<string>();

  for (const entry of entries) {
    const role = deriveImplementationRole(entry.implementation, object);
    boundNames.add(entry.implementation.name);
    const view: SupportResourceViewModel = {
      key: entry.binding.id,
      name: entry.implementation.name,
      role,
      implementation: entry.implementation,
      binding: entry.binding
    };
    if (isFormalImplementationRole(role)) {
      formal.push(view);
    } else if (role === 'ATTRIBUTE_EXTENSION') {
      attributeExtensions.push(view);
    } else {
      relatedData.push(view);
    }
  }

  for (const item of object.relatedData) {
    if (boundNames.has(item.name)) continue;
    relatedData.push({
      key: `declared:${item.name}`,
      name: item.name,
      role: deriveRelatedDataRole(item),
      relatedItem: item
    });
  }

  return { formal, attributeExtensions, relatedData };
}
