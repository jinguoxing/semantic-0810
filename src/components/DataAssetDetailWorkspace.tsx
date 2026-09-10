import React from 'react';
import { getDataAssetDetail } from '../data/dataAssetDetailData';
import { FindDataEntryContext } from './find_data/model/FindDataTask';
import { DataAssetMarketplaceShell } from './data-asset/DataAssetMarketplaceShell';
import { DataAssetGovernanceShell } from './data-asset/DataAssetGovernanceShell';
import { DataAssetNotFound } from './data-asset/DataAssetNotFound';

export type DataAssetSurface = 'MARKETPLACE' | 'GOVERNANCE';

export interface DataAssetDetailWorkspaceProps {
  /** 统一数据资产目录 ID（BO-FZ-01：详情完全由 assetId 驱动，禁止名称猜测与兜底资产） */
  assetId?: string;
  /** 页面所属操作面（§12）：MARKETPLACE = 消费面（默认），GOVERNANCE = 治理面 */
  surface?: DataAssetSurface;
  fromGoalSearch?: boolean;
  goalQuery?: string;
  onBackToResources?: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToBusinessObject?: (objectId: string) => void;
  /** Bottom-up 对齐入口：将该数据资产对齐到正式业务对象（仅 GOVERNANCE 治理面展示） */
  onAlignToBusinessObject?: (asset: { id: string; name: string }) => void;
  onNavigateToApiDetail?: (apiId: string) => void;
  onEnterAnalysis?: (entry: FindDataEntryContext) => void;
  onEnterChatQuery?: (entry: FindDataEntryContext) => void;
  onExploreRelatedData?: (assetName: string) => void;
  /** 治理面：返回统一数据资产目录；Not Found 主操作 */
  onBackToAssetCatalog?: () => void;
  /** Not Found 次操作：返回上一页 */
  onGoBack?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

/**
 * 数据资产详情工作台（BO-FZ-01 数据驱动版）：
 * 1. getDataAssetDetail(assetId) 决定一切 —— 查不到目录资产即为 Not Found（无任何兜底）；
 * 2. surface 决定操作面 —— MARKETPLACE 消费面 / GOVERNANCE 治理面完全分离；
 * 3. 两个操作面共用 DataAssetCoreDetail 的资产事实内容。
 */
export const DataAssetDetailWorkspace: React.FC<DataAssetDetailWorkspaceProps> = ({
  assetId,
  surface = 'MARKETPLACE',
  fromGoalSearch,
  goalQuery,
  onBackToResources,
  onNavigateToDiscovery,
  onNavigateToMyRequests,
  onNavigateToMetricDetail,
  onNavigateToBusinessObject,
  onAlignToBusinessObject,
  onNavigateToApiDetail,
  onEnterAnalysis,
  onEnterChatQuery,
  onExploreRelatedData,
  onBackToAssetCatalog,
  onGoBack,
  addToast
}) => {
  const detail = getDataAssetDetail(assetId);

  if (detail.ok === false) {
    return (
      <DataAssetNotFound
        assetId={assetId}
        onBackToAssetCatalog={onBackToAssetCatalog ?? onBackToResources}
        onGoBack={onGoBack ?? onBackToResources}
      />
    );
  }

  const { asset } = detail;

  if (surface === 'GOVERNANCE') {
    return (
      <DataAssetGovernanceShell
        asset={asset}
        onAlignToBusinessObject={onAlignToBusinessObject}
        onNavigateToBusinessObject={onNavigateToBusinessObject}
        onNavigateToMetricDetail={onNavigateToMetricDetail}
        onNavigateToApiDetail={onNavigateToApiDetail}
        onBackToAssetCatalog={onBackToAssetCatalog}
        addToast={addToast}
      />
    );
  }

  return (
    <DataAssetMarketplaceShell
      asset={asset}
      fromGoalSearch={fromGoalSearch}
      goalQuery={goalQuery}
      onBackToResources={onBackToResources}
      onNavigateToDiscovery={onNavigateToDiscovery}
      onNavigateToMyRequests={onNavigateToMyRequests}
      onNavigateToMetricDetail={onNavigateToMetricDetail}
      onNavigateToBusinessObject={onNavigateToBusinessObject}
      onNavigateToApiDetail={onNavigateToApiDetail}
      onEnterAnalysis={onEnterAnalysis}
      onEnterChatQuery={onEnterChatQuery}
      onExploreRelatedData={onExploreRelatedData}
      addToast={addToast}
    />
  );
};
