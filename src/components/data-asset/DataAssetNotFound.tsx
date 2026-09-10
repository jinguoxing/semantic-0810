import React from 'react';
import { Database, ArrowLeft, LayoutGrid } from 'lucide-react';

/**
 * 数据资产 Not Found（BO-FZ-01）：无效 assetId 的唯一归宿。
 * 禁止任何兜底资产（res-02 / population / asset-1），禁止按名称猜 ID。
 */
export interface DataAssetNotFoundProps {
  assetId?: string;
  /** 返回统一数据资产目录 */
  onBackToAssetCatalog?: () => void;
  /** 返回上一页（消费面 = 数据服务超市，治理面 = 数据治理） */
  onGoBack?: () => void;
}

export const DataAssetNotFound: React.FC<DataAssetNotFoundProps> = ({
  assetId,
  onBackToAssetCatalog,
  onGoBack
}) => (
  <div className="flex-1 flex items-center justify-center bg-[#F7F9FC] p-8">
    <div className="max-w-md w-full bg-white border border-[#E6EAF0] rounded-md shadow-2xs p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto">
        <Database className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">
          数据资产不存在或已不可用
        </h1>
        <p className="text-xs text-[#64748B] leading-relaxed">
          该数据资产可能已下线、被合并，或标识无效，无法展示资产详情。
        </p>
        {assetId?.trim() && (
          <p className="text-[11px] text-[#94A3B8] font-mono">
            资产标识：{assetId}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2.5 pt-1">
        <button
          id="btn-back-asset-catalog"
          onClick={onBackToAssetCatalog}
          className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer transition-colors inline-flex items-center space-x-1.5"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>返回数据资产目录</span>
        </button>
        <button
          id="btn-back-from-asset-not-found"
          onClick={onGoBack}
          className="px-3.5 py-1.5 rounded-md bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold cursor-pointer transition-colors inline-flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回上一页</span>
        </button>
      </div>
    </div>
  </div>
);
