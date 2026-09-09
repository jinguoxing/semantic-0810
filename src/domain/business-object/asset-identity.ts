/**
 * Asset Identity：统一数据资产身份解析
 *
 * Bottom-up 对齐的唯一正式身份是数据资产目录（Data Asset Registry）的规范 ID。
 * 本模块是唯一的「语义资产 ID → 数据资产 ID」桥：
 * - 数据语义入口（sem_hotline_ticket）解析到目录规范 ID（asset-1）；
 * - 数据资产目录入口（asset-N）保持目录 ID 不变；
 * - 复用 src/data/dataAssetsData.ts 的 MOCK_DATA_ASSETS 作为目录事实源，
 *   不引入第三份静态资产表。
 *
 * 解析不到的引用（如测试临时资产）返回兼容引用（保留原 ID），
 * 不产生规范身份，也不得写入正式身份约束（见 Store V3 迁移的 migrationWarning）。
 */
import { MOCK_DATA_ASSETS } from '../../data/dataAssetsData';
import { DataAssetReference } from './types';

/** 语义资产 ID → 数据资产目录 ID 的唯一映射表 */
const SEMANTIC_TO_ASSET_ID: Record<string, string> = {
  sem_hotline_ticket: 'asset-1'
};

/** 旧版业务对象侧资产 ID → 目录规范 ID（V2 持久化状态迁移用） */
const LEGACY_ASSET_ID_MAP: Record<string, string> = {
  'res-02': 'asset-1'
};

/** 候选 ID 是否可解析为数据资产目录规范 ID */
export function resolveCanonicalDataAssetId(candidateId: string): string | undefined {
  const semanticMapped = SEMANTIC_TO_ASSET_ID[candidateId];
  if (semanticMapped) return semanticMapped;
  if (MOCK_DATA_ASSETS.some((asset) => asset.id === candidateId)) return candidateId;
  return LEGACY_ASSET_ID_MAP[candidateId];
}

/**
 * 将候选引用解析为规范 DataAssetReference。
 * 可解析 → 目录规范引用（id / name / techName / warehouseTable 来自目录）；
 * 不可解析 → 兼容引用（保留候选 ID 与名称，canonical = false）。
 */
export function resolveCanonicalDataAsset(candidate: { id: string; name?: string }): {
  reference: DataAssetReference;
  canonical: boolean;
} {
  const canonicalId = resolveCanonicalDataAssetId(candidate.id);
  if (canonicalId) {
    const asset = MOCK_DATA_ASSETS.find((item) => item.id === canonicalId);
    if (asset) {
      return {
        reference: { id: asset.id, name: asset.name, techName: asset.qualifiedName },
        canonical: true
      };
    }
  }
  return {
    reference: { id: candidate.id, name: candidate.name?.trim() || candidate.id },
    canonical: false
  };
}
