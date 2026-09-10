import React, { useState } from 'react';
import {
  Compass,
  Layers,
  FileCheck,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  AlertCircle
} from 'lucide-react';
import { SingleResourceAccessRequestDrawer } from '../SingleResourceAccessRequestDrawer';
import { FindDataEntryContext } from '../find_data/model/FindDataTask';
import type { DataAssetDetailViewModel } from '../../data/dataAssetDetailData';
import { DataAssetCoreDetail } from './DataAssetCoreDetail';

/**
 * 数据资产详情 · 消费面（MARKETPLACE，BO-FZ-01 §12）：
 * 只回答「我能不能用、怎么用」——数据服务超市导航 / 资源可用状态 / 我的申请 /
 * 申请使用 / 进入分析 / 用于问数 / 查看相关资源 / 围绕此资源找数据。
 * 禁止出现任何治理操作（对齐业务对象 / 修改数据语义 / Grounding 修正 / 治理任务）。
 */
export interface DataAssetMarketplaceShellProps {
  asset: DataAssetDetailViewModel;
  fromGoalSearch?: boolean;
  goalQuery?: string;
  onBackToResources?: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToBusinessObject?: (objectId: string) => void;
  onNavigateToApiDetail?: (apiId: string) => void;
  onEnterAnalysis?: (entry: FindDataEntryContext) => void;
  onEnterChatQuery?: (entry: FindDataEntryContext) => void;
  onExploreRelatedData?: (assetName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const DataAssetMarketplaceShell: React.FC<DataAssetMarketplaceShellProps> = ({
  asset,
  fromGoalSearch = false,
  goalQuery = '',
  onBackToResources,
  onNavigateToDiscovery,
  onNavigateToMyRequests,
  onNavigateToMetricDetail,
  onNavigateToBusinessObject,
  onNavigateToApiDetail,
  onEnterAnalysis,
  onEnterChatQuery,
  onExploreRelatedData,
  addToast
}) => {
  // Navigation inside Marketplace Sidebar
  const [activeSideNav, setActiveSideNav] = useState<'discovery' | 'resources' | 'my_requests'>('resources');

  // Single Resource Access Request Drawer State
  const [isAccessRequestDrawerOpen, setIsAccessRequestDrawerOpen] = useState<boolean>(false);

  // Access Permission Simulation State (可直接使用 vs 需申请)
  const [accessState, setAccessState] = useState<'granted' | 'requestable'>('requestable');

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F9FC] text-[#172033] font-sans antialiased relative">
      {/* ========================================================= */}
      {/* 1. MARKETPLACE SIDEBAR                                     */}
      {/* ========================================================= */}
      <aside className="w-[210px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none z-10">
        <div className="px-5 py-4 border-b border-[#E6EAF0]">
          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
            数据服务超市
          </h2>
        </div>

        <nav className="p-3 space-y-1 text-xs">
          {/* 1. 发现 */}
          <button
            onClick={() => {
              if (onNavigateToDiscovery) {
                onNavigateToDiscovery();
              } else {
                setActiveSideNav('discovery');
                addToast?.('info', '发现首页', '切换至数据服务超市发现首页');
              }
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'discovery'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Compass className="w-4 h-4 text-[#64748B]" />
            <span>发现</span>
          </button>

          {/* 2. 资源 (当前高亮) */}
          <button
            onClick={() => {
              setActiveSideNav('resources');
              if (onBackToResources) onBackToResources();
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'resources'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>资源</span>
          </button>

          {/* 3. 我的申请（仅消费面 MARKETPLACE，§12：治理面不显示我的申请） */}
          <button
            onClick={() => {
              if (onNavigateToMyRequests) {
                onNavigateToMyRequests();
              } else {
                setActiveSideNav('my_requests');
                addToast?.('info', '我的申请', '查看已申请的数据访问权限与 API 调用授权记录');
              }
            }}
            className={`w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
              activeSideNav === 'my_requests'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#64748B]" />
            <span>我的申请</span>
          </button>
        </nav>

        {/* Bottom Fixed Lightweight AI Partner Card */}
        <div className="mt-auto p-3 border-t border-[#EEF2F6] bg-white">
          <div className="flex items-center space-x-2.5 text-xs py-1 px-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 fill-white/20" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#94A3B8] leading-tight">AI Partner</div>
              <div className="text-xs font-bold text-[#172033] leading-tight truncate">
                Xino ｜ 犀诺
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN RESOURCE DETAIL AREA                               */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F7F9FC] transition-all">
        {/* Goal Search Context Strip（仅当从 Goal Search 来源时出现） */}
        {fromGoalSearch && (
          <div className="bg-[#EFF6FF] border-b border-[#DBEAFE] px-8 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span className="text-[#1E40AF] font-medium">
                与当前目标「{goalQuery}」相关：该资产可提供目标所需的业务数据。
              </span>
            </div>
            <button
              onClick={onBackToResources}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>返回当前数据方案</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Top Return Link & Breadcrumb */}
        <div className="px-8 pt-8 max-w-[940px] w-full mx-auto space-y-2">
          <div className="text-xs text-[#94A3B8] flex items-center space-x-2">
            <span
              onClick={onNavigateToDiscovery}
              className="hover:text-[#2563EB] cursor-pointer"
            >
              数据服务超市
            </span>
            <span>/</span>
            <span
              onClick={onBackToResources}
              className="hover:text-[#2563EB] cursor-pointer"
            >
              资源
            </span>
            <span>/</span>
            <span className="text-[#172033] font-medium">{asset.name}</span>
          </div>

          <div className="flex items-center">
            <button
              onClick={onBackToResources}
              className="inline-flex items-center space-x-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回资源</span>
            </button>
          </div>
        </div>

        {/* 核心详情（数据驱动，两操作面共用） */}
        <DataAssetCoreDetail
          asset={asset}
          onNavigateToBusinessObject={onNavigateToBusinessObject}
          onNavigateToMetricDetail={onNavigateToMetricDetail}
          onNavigateToApiDetail={onNavigateToApiDetail}
          addToast={addToast}
        />
      </main>

      {/* ========================================================= */}
      {/* 3. RIGHT USE RAIL（只回答：权限与下一步操作）                */}
      {/* ========================================================= */}
      <aside className="w-[300px] bg-white border-l border-[#E6EAF0] flex flex-col shrink-0 p-6 space-y-6 select-none overflow-y-auto">
        {/* Rail Title */}
        <div>
          <h3 className="text-base font-bold text-[#172033] tracking-tight">
            使用
          </h3>
        </div>

        {/* 1. 资源可用状态 */}
        <div className="space-y-1 text-xs">
          {accessState === 'granted' ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#16A36A]">
                <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                <span>可直接使用</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed pl-5.5">
                已具备查询权限，可直接用于分析与问数。
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#D97706]">
                <Lock className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>需申请</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed pl-5.5">
                获取查询权限后，可将该数据用于分析与问数。
              </p>
            </div>
          )}
        </div>

        {/* 2. 数据提醒 */}
        {asset.freshness?.warning && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-[#D97706]">
              <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>存在新鲜度提醒</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed pl-5.5">
              {asset.freshness.warning}
            </p>
          </div>
        )}

        {/* 3. 详细元数据项列表（目录事实驱动） */}
        <div className="space-y-3.5 text-xs border-t border-[#EEF2F6] pt-5">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">维护团队</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-[#172033]">{asset.owner}</span>
              <button
                onClick={() => {
                  addToast?.('info', '联系团队', `已向 ${asset.owner} 发起即时咨询与工单申请`);
                }}
                className="text-[#2563EB] hover:underline text-[11px] font-medium cursor-pointer"
              >
                联系团队 →
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">业务域</span>
            <span className="font-medium text-[#172033]">{asset.businessDomain}</span>
          </div>

          {asset.businessObject && (
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">业务对象</span>
              <span className="font-medium text-[#172033]">{asset.businessObject.name}</span>
            </div>
          )}

          {asset.grain && (
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">一行代表</span>
              <span className="font-medium text-[#172033]">{asset.grain}</span>
            </div>
          )}

          {asset.freshness?.updateFrequency && (
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">更新频率</span>
              <span className="font-medium text-[#172033]">{asset.freshness.updateFrequency}</span>
            </div>
          )}

          {asset.freshness?.lastUpdatedAt && (
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">最近更新</span>
              <span className="font-medium text-[#172033]">{asset.freshness.lastUpdatedAt}</span>
            </div>
          )}
        </div>

        {/* 4. 主操作按钮区（进入分析 / 用于问数 仅消费面 MARKETPLACE，§12） */}
        <div className="space-y-3 border-t border-[#EEF2F6] pt-5">
          {accessState === 'granted' ? (
            <>
              {/* Primary: 进入分析 */}
              <button
                onClick={() => {
                  if (onEnterAnalysis) {
                    onEnterAnalysis({
                      entryId: `asset:${asset.id}:analyze`,
                      source: 'ASSET_DETAIL',
                      target: { kind: 'ASSET', id: asset.id, label: asset.name },
                      intent: 'ANALYZE',
                      initialText: `围绕资源「${asset.name}」继续分析`
                    });
                  } else {
                    addToast?.('success', '进入分析', `已将「${asset.name}」载入数据助手`);
                  }
                }}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>进入分析</span>
              </button>

              {/* Secondary: 用于问数 */}
              <button
                onClick={() => {
                  if (onEnterChatQuery) {
                    onEnterChatQuery({
                      entryId: `asset:${asset.id}:query-value`,
                      source: 'ASSET_DETAIL',
                      target: { kind: 'ASSET', id: asset.id, label: asset.name },
                      intent: 'QUERY_VALUE',
                      initialText: `基于资源「${asset.name}」提出查询需求`
                    });
                  } else {
                    addToast?.('info', '使用当前资产', `已将「${asset.name}」作为对象上下文带入数据助手`);
                  }
                }}
                className="w-full py-2.5 bg-white hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#2563EB] text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>用于问数</span>
              </button>
            </>
          ) : (
            <>
              {/* Primary: 申请使用 */}
              <button
                onClick={() => {
                  setIsAccessRequestDrawerOpen(true);
                  addToast?.('info', '申请使用', `已打开「${asset.name}」访问需求确认抽屉`);
                }}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>申请使用</span>
              </button>

              {/* Secondary: 查看相关资源 */}
              <button
                onClick={onBackToResources}
                className="w-full py-2.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#2563EB] text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>查看相关资源</span>
              </button>
            </>
          )}

          {/* 底部弱动作: 围绕此资源找数据 */}
          <div className="pt-2 text-center">
            <button
              onClick={() => {
                if (onExploreRelatedData) {
                  onExploreRelatedData(asset.name);
                } else if (onBackToResources) {
                  onBackToResources();
                }
              }}
              className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>围绕此资源找数据 →</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* SINGLE RESOURCE ACCESS REQUEST DRAWER (仅消费面)             */}
      {/* ========================================================= */}
      <SingleResourceAccessRequestDrawer
        isOpen={isAccessRequestDrawerOpen}
        onClose={() => setIsAccessRequestDrawerOpen(false)}
        resourceName={asset.name}
        resourceTypeLabel={asset.assetType === 'View' ? 'DATA ASSET · VIEW' : 'DATA ASSET · TABLE'}
        taskContextTitle={goalQuery || '数据资源申请'}
        onSuccessSubmit={() => {
          setAccessState('granted');
        }}
        addToast={addToast}
      />
    </div>
  );
};
