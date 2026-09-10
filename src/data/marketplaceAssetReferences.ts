/**
 * Marketplace 资源与统一数据资产目录 / 业务对象仓库是不同的 ID 空间。
 * 跨空间的引用一律集中登记在此（先例：marketplaceMetricReferences），
 * 禁止在各个跳转点把资源 ID 当作目录资产 ID 或 bo_* 对象 ID 使用
 * （BO-FZ-01 §12：资源 ID res-01 绝不直接作为 Business Object ID）。
 *
 * 注意：res-02 在「业务对象侧旧版持久化状态」命名空间里指向 asset-1（见
 * asset-identity.ts LEGACY_ASSET_ID_MAP，仅用于旧状态迁移）；在「数据服务超市
 * 资源」命名空间里是人口基本信息视图，指向目录资产 asset-2（人口基本信息）。
 * 两个命名空间互不通用，消费面跳转必须走本模块。
 */
export const MARKETPLACE_RESOURCE_ASSET_REFERENCES = {
  /** 人口基本信息视图：呈现目录资产「人口基本信息」 */
  'res-02': { canonicalAssetId: 'asset-2' },
  /** 人口统计查询服务（API 资源卡）：服务于「人口基本信息」资产之上 */
  'res-04': { canonicalAssetId: 'asset-2' }
} as const;

export const MARKETPLACE_RESOURCE_OBJECT_REFERENCES = {
  /** 超市「自然人」业务对象资源 → 正式业务对象 bo_person */
  'res-01': { canonicalObjectId: 'bo_person' }
} as const;

export function getCanonicalAssetIdForMarketplaceResource(resourceId?: string): string | undefined {
  if (!resourceId) return undefined;
  return MARKETPLACE_RESOURCE_ASSET_REFERENCES[resourceId.trim() as keyof typeof MARKETPLACE_RESOURCE_ASSET_REFERENCES]
    ?.canonicalAssetId;
}

export function getCanonicalBusinessObjectIdForMarketplaceResource(resourceId?: string): string | undefined {
  if (!resourceId) return undefined;
  return MARKETPLACE_RESOURCE_OBJECT_REFERENCES[resourceId.trim() as keyof typeof MARKETPLACE_RESOURCE_OBJECT_REFERENCES]
    ?.canonicalObjectId;
}
