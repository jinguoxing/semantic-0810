import React, { useSyncExternalStore } from 'react';
import {
  ArrowLeft,
  Share2,
  FileText,
  ShieldCheck,
  Activity,
  Eye,
  GitBranch,
  User,
  Database,
  Info
} from 'lucide-react';
import {
  businessObjectRepository,
  subscribe,
  getVersion,
  type BusinessObject
} from '../../domain/business-object';
import type { DataAssetDetailViewModel } from '../../data/dataAssetDetailData';
import { DataAssetCoreDetail } from './DataAssetCoreDetail';

/**
 * 数据资产详情 · 治理面（GOVERNANCE，BO-FZ-01 §12）：
 * 只回答「这份数据的正式身份与语义治理状态」——正式身份 / Profile / Data Semantics /
 * Quality / Lineage 状态 / 当前业务对象状态 / 对齐业务对象 / 查看语义依据 / 返回数据资产目录。
 * 禁止出现任何消费操作（数据服务超市导航 / 我的申请 / 访问权限模拟 / 申请使用 /
 * 进入分析 / 用于问数 / 查看相关资源 / 围绕此资源找数据 / 单资源申请抽屉）。
 */
export interface DataAssetGovernanceShellProps {
  asset: DataAssetDetailViewModel;
  /** Bottom-up 对齐入口：将该数据资产对齐到正式业务对象（仅治理面展示） */
  onAlignToBusinessObject?: (asset: { id: string; name: string }) => void;
  onNavigateToBusinessObject?: (objectId: string) => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToApiDetail?: (apiId: string) => void;
  onBackToAssetCatalog?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

/** 目录治理状态 → 展示标签 */
const PROFILE_LABELS: Record<string, string> = {
  profiled: '已探查',
  unprofiled: '未探查'
};
const SEMANTIC_LABELS: Record<string, string> = {
  confirmed: '语义已确认',
  pending: '语义待确认',
  understanding: 'AI 理解中',
  ununderstood: '语义未理解'
};
const QUALITY_LABELS: Record<string, string> = {
  normal: '质量正常',
  attention: '质量关注',
  critical: '存在问题',
  untested: '未检测'
};
const LINEAGE_LABELS: Record<string, string> = {
  available: '血缘可用',
  unavailable: '血缘未采集'
};

function objectStatusLabel(status: BusinessObject['status']): string {
  return status === 'PUBLISHED' ? '已发布' : status === 'DRAFT' ? '草稿' : '已停用';
}

export const DataAssetGovernanceShell: React.FC<DataAssetGovernanceShellProps> = ({
  asset,
  onAlignToBusinessObject,
  onNavigateToBusinessObject,
  onNavigateToMetricDetail,
  onNavigateToApiDetail,
  onBackToAssetCatalog,
  addToast
}) => {
  // 订阅领域 Store：业务对象生命周期变化（发布 / 停用）后同步刷新「当前业务对象状态」
  useSyncExternalStore(subscribe, getVersion);

  // 当前业务对象状态按 businessObjectId 从领域仓库读取（禁止按名称反查）
  const boundObject = asset.businessObject ? businessObjectRepository.get(asset.businessObject.id) : undefined;

  const handleBackToCatalog = () => {
    if (onBackToAssetCatalog) {
      onBackToAssetCatalog();
    } else {
      addToast?.('info', '返回数据资产目录', '已返回统一数据资产目录');
    }
  };

  const handleViewSemanticsEvidence = () => {
    const confirmed = asset.governanceContext.semanticConfirmedTime
      ? `最近确认时间 ${asset.governanceContext.semanticConfirmedTime}`
      : '尚无确认记录';
    addToast?.(
      'info',
      '查看语义依据',
      `「${asset.name}」当前语义状态：${SEMANTIC_LABELS[asset.governanceContext.semanticStatus] ?? asset.governanceContext.semanticStatus}（${confirmed}）；探查状态：${PROFILE_LABELS[asset.governanceContext.profileStatus] ?? asset.governanceContext.profileStatus}。`
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC] text-[#172033] font-sans antialiased relative">
      <main className="flex-1 overflow-y-auto bg-[#F7F9FC] transition-all">
        {/* Top Return Link & Breadcrumb（治理面口径：数据治理 / 数据资产） */}
        <div className="px-8 pt-8 max-w-[940px] w-full mx-auto space-y-2">
          <div className="text-xs text-[#94A3B8] flex items-center space-x-2">
            <span>数据治理</span>
            <span>/</span>
            <span
              onClick={handleBackToCatalog}
              className="hover:text-[#2563EB] cursor-pointer"
            >
              数据资产
            </span>
            <span>/</span>
            <span className="text-[#172033] font-medium">{asset.name}</span>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleBackToCatalog}
              className="inline-flex items-center space-x-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回数据资产目录</span>
            </button>
          </div>
        </div>

        <div className="pb-8 space-y-6">
          {/* ======================================================= */}
          {/* A. 正式身份 + 治理状态 + 当前业务对象（治理面专属头部）      */}
          {/* ======================================================= */}
          <div className="px-8 max-w-[940px] w-full mx-auto">
            <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-5">
              {/* 标题行 */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start space-x-4 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-[#059669] flex items-center justify-center text-white shrink-0 shadow-2xs">
                    <Database className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                        {asset.name}
                      </h1>
                      <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] text-[11px] font-semibold rounded">
                        DATA ASSET · {asset.assetType.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#94A3B8]">
                      {asset.technicalName}
                    </div>
                    <p className="text-xs text-[#334155] leading-relaxed pt-1">
                      {asset.definition}
                    </p>
                  </div>
                </div>

                {/* 治理面动作区：对齐业务对象 / 查看语义依据 */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    id="btn-align-business-object"
                    onClick={() => {
                      if (onAlignToBusinessObject) {
                        onAlignToBusinessObject({ id: asset.id, name: asset.name });
                      } else {
                        addToast?.('info', '对齐业务对象', `已发起「${asset.name}」的业务对象对齐`);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] text-xs font-medium transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                    title="将该数据资产对齐到企业正式业务对象，形成数据支撑"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>对齐业务对象</span>
                  </button>
                  <button
                    onClick={handleViewSemanticsEvidence}
                    className="px-3.5 py-1.5 rounded bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-medium transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                    title="查看该资产的语义确认依据与时间"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>查看语义依据</span>
                  </button>
                </div>
              </div>

              {/* 正式身份（全部来自统一目录，禁止页面二次维护） */}
              <div className="border-t border-[#EEF2F6] pt-4">
                <div className="text-xs font-semibold text-[#0F172A] flex items-center space-x-1.5 pb-3">
                  <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>正式身份</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[11px] text-[#64748B]">技术全名（库.模式.表）</div>
                    <div className="font-mono font-semibold text-[#172033] truncate" title={asset.qualifiedName}>
                      {asset.qualifiedName}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#64748B]">数据来源</div>
                    <div className="font-semibold text-[#172033]">{asset.dataSourceName}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#64748B]">负责人</div>
                    <div className="font-semibold text-[#172033]">{asset.owner}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#64748B]">业务域</div>
                    <div className="font-semibold text-[#172033]">
                      {asset.businessDomain}{asset.subDomain ? ` · ${asset.subDomain}` : ''}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#64748B]">资产标识</div>
                    <div className="font-mono font-semibold text-[#172033]">{asset.id}</div>
                  </div>
                  {asset.identity && (
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[11px] text-[#64748B]">实例身份</div>
                      <div className="font-semibold text-[#172033] truncate" title={asset.identity}>
                        {asset.identity}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 治理状态：Profile / Data Semantics / Quality / Lineage */}
              <div className="border-t border-[#EEF2F6] pt-4">
                <div className="text-xs font-semibold text-[#0F172A] flex items-center space-x-1.5 pb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>治理状态</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Profile */}
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#64748B]">Profile</span>
                      <Activity className="w-3.5 h-3.5 text-[#64748B]" />
                    </div>
                    <div className="text-xs font-bold text-[#172033]">
                      {PROFILE_LABELS[asset.governanceContext.profileStatus] ?? asset.governanceContext.profileStatus}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">
                      {asset.governanceContext.lastProfiledTime
                        ? `最近探查 ${asset.governanceContext.lastProfiledTime}`
                        : '尚无探查记录'}
                    </div>
                  </div>

                  {/* Data Semantics */}
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#64748B]">Data Semantics</span>
                      <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                    </div>
                    <div className="text-xs font-bold text-[#172033]">
                      {SEMANTIC_LABELS[asset.governanceContext.semanticStatus] ?? asset.governanceContext.semanticStatus}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">
                      {asset.governanceContext.semanticConfirmedTime
                        ? `最近确认 ${asset.governanceContext.semanticConfirmedTime}`
                        : '尚无确认记录'}
                    </div>
                  </div>

                  {/* Quality */}
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#64748B]">Quality</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#64748B]" />
                    </div>
                    <div
                      className={`text-xs font-bold ${
                        (asset.governanceContext.qualityIssueCount ?? 0) > 0
                          ? 'text-[#D97706]'
                          : 'text-[#16A36A]'
                      }`}
                    >
                      {QUALITY_LABELS[asset.governanceContext.qualityStatus] ?? asset.governanceContext.qualityStatus}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">
                      质量问题 {asset.governanceContext.qualityIssueCount ?? 0} 项
                    </div>
                  </div>

                  {/* Lineage */}
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#64748B]">Lineage</span>
                      <GitBranch className="w-3.5 h-3.5 text-[#64748B]" />
                    </div>
                    <div className="text-xs font-bold text-[#172033]">
                      {LINEAGE_LABELS[asset.governanceContext.lineageStatus] ?? asset.governanceContext.lineageStatus}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">血缘采集状态</div>
                  </div>
                </div>
              </div>

              {/* 当前业务对象状态（businessObjectId 驱动） */}
              <div className="border-t border-[#EEF2F6] pt-4">
                <div className="text-xs font-semibold text-[#0F172A] flex items-center space-x-1.5 pb-3">
                  <User className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>当前业务对象状态</span>
                </div>
                {asset.businessObject ? (
                  <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shrink-0">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-sm font-bold text-[#172033]">
                            {asset.businessObject.name}
                          </span>
                          <span className="text-[11px] text-[#64748B] font-mono">
                            {asset.businessObject.id}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              boundObject?.status === 'PUBLISHED'
                                ? 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]'
                                : boundObject?.status === 'RETIRED'
                                  ? 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'
                                  : 'bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7]'
                            }`}
                          >
                            {boundObject ? objectStatusLabel(boundObject.status) : '未登记'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {boundObject
                            ? `${boundObject.domain} · 正式修订 ${boundObject.currentRevision}`
                            : '领域仓库中未找到该业务对象，可能已被删除'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateToBusinessObject?.(asset.businessObject!.id)}
                      className="text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-semibold shrink-0 cursor-pointer"
                    >
                      查看业务对象 →
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] flex items-start space-x-2">
                    <Info className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#64748B] leading-relaxed">
                      当前资产尚未对齐正式业务对象，可通过「对齐业务对象」发起 Bottom-up 对齐。
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* B. 核心详情（数据驱动，两操作面共用）                       */}
          {/* ======================================================= */}
          <DataAssetCoreDetail
            asset={asset}
            onNavigateToBusinessObject={onNavigateToBusinessObject}
            onNavigateToMetricDetail={onNavigateToMetricDetail}
            onNavigateToApiDetail={onNavigateToApiDetail}
            addToast={addToast}
          />
        </div>
      </main>
    </div>
  );
};
