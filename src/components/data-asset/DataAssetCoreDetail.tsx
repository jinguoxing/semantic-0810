import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  X,
  Check,
  Copy,
  User,
  Globe,
  Share2,
  Calendar,
  Database,
  Code,
  AlertCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import type {
  DataAssetDetailViewModel,
  DataAssetFieldViewModel
} from '../../data/dataAssetDetailData';

/**
 * Data Asset 核心详情（BO-FZ-01）：完全由 DataAssetDetailViewModel 驱动的资产事实内容，
 * 消费面（Marketplace）与治理面（Governance）共用；不含任何一面专属操作。
 * 页面身份（名称 / 技术名 / 业务域 / 负责人 / 业务对象）一律来自统一数据资产目录。
 */
export interface DataAssetCoreDetailProps {
  asset: DataAssetDetailViewModel;
  onNavigateToBusinessObject?: (objectId: string) => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToApiDetail?: (apiId: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  Table: 'DATA ASSET · TABLE',
  View: 'DATA ASSET · VIEW'
};

function assetTypeBadge(assetType: string): string {
  return ASSET_TYPE_LABELS[assetType] ?? `DATA ASSET · ${assetType.toUpperCase()}`;
}

export const DataAssetCoreDetail: React.FC<DataAssetCoreDetailProps> = ({
  asset,
  onNavigateToBusinessObject,
  onNavigateToMetricDetail,
  onNavigateToApiDetail,
  addToast
}) => {
  // Secondary View toggle: Main Asset View vs. All Fields Secondary View
  const [isAllFieldsView, setIsAllFieldsView] = useState<boolean>(false);

  // Field Detail Drawer State
  const [selectedFieldDetail, setSelectedFieldDetail] = useState<DataAssetFieldViewModel | null>(null);

  // Fitness Summary Drawer State
  const [isFitnessDrawerOpen, setIsFitnessDrawerOpen] = useState<boolean>(false);

  // Fields View search & filter
  const [fieldSearchTerm, setFieldSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast?.('success', '已复制到剪贴板', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered fields for secondary view
  const filteredFields = asset.fields.filter((f) => {
    if (roleFilter !== 'all' && !f.role.includes(roleFilter)) return false;
    if (fieldSearchTerm.trim()) {
      const q = fieldSearchTerm.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.businessName.toLowerCase().includes(q) ||
        f.definition.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const hasQualityAttention = (asset.governanceContext.qualityIssueCount ?? 0) > 0;

  return (
    <div className="p-8 max-w-[940px] w-full mx-auto space-y-6">
      {/* ======================================================= */}
      {/* A. RESOURCE HEADER（身份全部来自资产目录）                  */}
      {/* ======================================================= */}
      <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-5">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 rounded-xl bg-[#059669] flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Database className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                {asset.name}
              </h1>
              <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] text-[11px] font-semibold rounded">
                {assetTypeBadge(asset.assetType)}
              </span>
              <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-medium rounded">
                已发布资源
              </span>
            </div>

            <div className="text-xs font-mono text-[#94A3B8]">
              {asset.technicalName}
            </div>

            {/* 正式业务定义（目录 description） */}
            <p className="text-xs text-[#334155] leading-relaxed pt-1">
              {asset.definition}
            </p>
          </div>
        </div>

        {/* Pills row & Applicable scenarios */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#475569] font-medium">
              {asset.businessDomain}
            </span>
            {asset.subDomain && (
              <span className="px-3 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#475569] font-medium">
                {asset.subDomain}
              </span>
            )}
            {asset.businessObject && (
              <span className="px-3 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#475569] font-medium">
                {asset.businessObject.name}
              </span>
            )}
          </div>

          {asset.scope && (
            <div className="text-xs text-[#64748B]">
              <span className="text-[#334155] font-medium">适用于：</span>
              <span className="ml-1">{asset.scope}</span>
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* B. 4 核心事实卡片（Subject / Grain / 业务对象 / 更新）       */}
        {/* ======================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-[#F8FAFC]/80 border border-[#EEF2F6] text-xs">
          {/* Col 1: 一行代表 */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] text-[#64748B]">一行代表</div>
              <div className="font-bold text-[#172033] truncate">{asset.grain ?? '—'}</div>
            </div>
          </div>

          {/* Col 2: 覆盖范围 */}
          <div className="flex items-center space-x-3 border-l border-[#E2E8F0] pl-4">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] text-[#64748B]">覆盖范围</div>
              <div className="font-bold text-[#172033] truncate">{asset.scope ?? '—'}</div>
            </div>
          </div>

          {/* Col 3: 业务对象（businessObjectId 驱动，禁止按名称猜 ID） */}
          <div className="flex items-center space-x-3 border-l border-[#E2E8F0] pl-4">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] text-[#64748B]">业务对象</div>
              {asset.businessObject ? (
                <div
                  onClick={() => onNavigateToBusinessObject?.(asset.businessObject!.id)}
                  className="font-bold text-[#172033] hover:text-[#2563EB] cursor-pointer truncate"
                  title={`查看业务对象 ${asset.businessObject.name}（${asset.businessObject.id}）`}
                >
                  {asset.businessObject.name}
                </div>
              ) : (
                <div className="font-bold text-[#94A3B8]">未对齐</div>
              )}
            </div>
          </div>

          {/* Col 4: 更新 */}
          <div className="flex items-center space-x-3 border-l border-[#E2E8F0] pl-4">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] text-[#64748B]">更新</div>
              <div className="font-bold text-[#172033] truncate">
                {asset.freshness
                  ? `${asset.freshness.updateFrequency ?? '—'} · ${asset.freshness.lastUpdatedAt ?? '—'}`
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAllFieldsView ? (
        /* ======================================================= */
        /* C. SECONDARY VIEW: ALL FIELDS                            */
        /* ======================================================= */
        <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF2F6] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#172033] tracking-tight">
                  全部业务与技术字段
                </h2>
                <span className="text-xs text-[#667085]">
                  共 {asset.fields.length} 项字段
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                点击任意字段行可呼出字段业务定义、角色及标准映射抽屉。
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={fieldSearchTerm}
                  onChange={(e) => setFieldSearchTerm(e.target.value)}
                  placeholder="搜索字段名称或含义…"
                  className="pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] w-48"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 px-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="all">全部角色</option>
                <option value="主键">主体主键 (PK)</option>
                <option value="时间">时间属性</option>
                <option value="度量">度量属性</option>
                <option value="空间">空间属性</option>
                <option value="分类">分类属性</option>
                <option value="关系">关系支撑属性</option>
              </select>
            </div>
          </div>

          {/* All Fields Table */}
          <div className="border border-[#EEF2F6] rounded-md overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F8FAFC] text-[#667085] border-b border-[#EEF2F6] font-semibold">
                <tr>
                  <th className="px-4 py-3">业务信息</th>
                  <th className="px-4 py-3">技术字段</th>
                  <th className="px-4 py-3">数据类型</th>
                  <th className="px-4 py-3">业务角色</th>
                  <th className="px-4 py-3">业务含义</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F6]">
                {filteredFields.map((field) => (
                  <tr
                    key={field.id}
                    onClick={() => setSelectedFieldDetail(field)}
                    className={`hover:bg-[#F8FAFC] cursor-pointer transition-colors ${
                      selectedFieldDetail?.id === field.id ? 'bg-[#EFF6FF]' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#172033] flex items-center space-x-1.5">
                        <span>{field.businessName}</span>
                        {field.isIdentifier && (
                          <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-bold rounded">
                            PK
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#667085]">
                      {field.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#475569]">
                      {field.dataType}
                    </td>
                    <td className="px-4 py-3 text-[#475569]">
                      <span className="px-2 py-0.5 bg-[#F1F5F9] rounded text-[11px]">
                        {field.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#334155] max-w-[240px] truncate">
                      {field.definition}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[#2563EB] hover:underline font-medium text-xs">
                        详情 →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-xs text-[#667085] pt-2">
            <span>显示 {filteredFields.length} / {asset.fields.length} 个字段</span>
            <button
              onClick={() => setIsAllFieldsView(false)}
              className="text-[#2563EB] hover:underline font-medium cursor-pointer"
            >
              ← 返回资产主详情
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ======================================================= */}
          {/* D. 关键业务信息（前 6 个字段）                            */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                关键业务信息
              </h2>
              <button
                onClick={() => setIsAllFieldsView(true)}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <span>查看全部字段</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3 列企业级轻量表格 */}
            <div className="border border-[#EEF2F6] rounded-md overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#EEF2F6] font-semibold">
                  <tr>
                    <th className="px-4 py-2.5 w-[25%] font-medium">业务信息</th>
                    <th className="px-4 py-2.5 w-[50%] font-medium">业务含义</th>
                    <th className="px-4 py-2.5 w-[25%] font-medium">数据字段</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {asset.fields.slice(0, 6).map((field) => (
                    <tr
                      key={field.id}
                      onClick={() => setSelectedFieldDetail(field)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 font-medium text-[#172033] group-hover:text-[#2563EB]">
                        {field.businessName}
                      </td>
                      <td className="px-4 py-3 text-[#475569] leading-relaxed">
                        {field.definition}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#64748B]">
                        {field.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ======================================================= */}
          {/* E. 数据状态（Fitness Only，不表达权限）                   */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                数据状态
              </h2>
              <button
                onClick={() => setIsFitnessDrawerOpen(true)}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <span>查看质量摘要</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3 列数据状态内容 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-1">
              {/* Col 1: 更新频率 */}
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#172033]">
                    {asset.freshness?.updateFrequency ?? '—'}
                  </div>
                  <div className="text-[11px] text-[#64748B]">更新频率</div>
                </div>
              </div>

              {/* Col 2: 最近更新 */}
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#172033]">
                    {asset.freshness?.lastUpdatedAt ?? '—'}
                  </div>
                  <div className="text-[11px] text-[#64748B]">最近更新</div>
                </div>
              </div>

              {/* Col 3: 新鲜度提醒（目录质量数据驱动） */}
              <div className="flex items-start space-x-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    hasQualityAttention
                      ? 'bg-[#FFFBEB] text-[#D97706]'
                      : 'bg-[#F0FDF4] text-[#16A36A]'
                  }`}
                >
                  {hasQualityAttention ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <div
                    className={`text-xs font-bold ${
                      hasQualityAttention ? 'text-[#D97706]' : 'text-[#16A36A]'
                    }`}
                  >
                    {hasQualityAttention
                      ? `存在质量与新鲜度提醒${asset.governanceContext.qualityIssueCount ? `（${asset.governanceContext.qualityIssueCount} 项）` : ''}`
                      : '无已知质量提醒'}
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    {asset.freshness?.warning ?? '当前数据状态正常，可按更新频率放心使用。'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* F. 相关资源（业务对象 / 相关指标 / 相关 API，数据驱动）      */}
          {/* ======================================================= */}
          <div className="bg-white border border-[#E6EAF0] rounded-md p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                相关资源
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs">
              {/* Card 1: 业务对象（BUSINESS OBJECT） */}
              <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#93C5FD] transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[#172033] truncate">
                        {asset.businessObject?.name ?? '未对齐业务对象'}
                      </div>
                      <span className="inline-block px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-semibold rounded">
                        BUSINESS OBJECT
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    当前资产承载的核心业务对象。
                  </p>
                </div>
                {asset.businessObject && (
                  <button
                    onClick={() => onNavigateToBusinessObject?.(asset.businessObject!.id)}
                    className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-xs text-left cursor-pointer"
                  >
                    查看 →
                  </button>
                )}
              </div>

              {/* Card 2-3: 相关指标（METRIC） */}
              {(asset.relatedMetrics ?? []).map((metric) => (
                <div
                  key={metric.id}
                  className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#93C5FD] transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shrink-0 font-bold text-xs">
                        %
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#172033] truncate">{metric.name}</div>
                        <span className="inline-block px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-semibold rounded">
                          METRIC
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      {metric.definition}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateToMetricDetail?.(metric.id)}
                    className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-xs text-left cursor-pointer"
                  >
                    查看 →
                  </button>
                </div>
              ))}

              {/* Card 4: 相关 API（DATA API） */}
              {(asset.relatedApis ?? []).map((api) => (
                <div
                  key={api.id}
                  className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#93C5FD] transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EA580C] flex items-center justify-center text-white shrink-0">
                        <Code className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#172033] truncate">{api.name}</div>
                        <span className="inline-block px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-semibold rounded">
                          DATA API
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      {api.definition}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateToApiDetail?.(api.id)}
                    className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-xs text-left cursor-pointer"
                  >
                    查看 →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* FIELD DETAIL DRAWER (字段语义上下文抽屉)                     */}
      {/* ========================================================= */}
      {selectedFieldDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div
            className="w-full max-w-[480px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-center justify-between shrink-0 bg-[#FAFCFF]">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  字段语义上下文
                </div>
                <div className="text-base font-bold text-[#172033] flex items-center space-x-2">
                  <span>{selectedFieldDetail.businessName}</span>
                  <code className="text-xs font-mono text-[#667085] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                    {selectedFieldDetail.name}
                  </code>
                </div>
              </div>

              <button
                onClick={() => setSelectedFieldDetail(null)}
                className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* 1. 业务定义 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#667085]">业务定义</label>
                <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md text-xs text-[#334155] leading-relaxed">
                  {selectedFieldDetail.definition}
                </div>
              </div>

              {/* 2. 字段基础属性 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#EEF2F6] rounded-md space-y-1">
                  <div className="text-[10px] text-[#667085]">数据类型</div>
                  <div className="font-mono font-bold text-[#172033]">
                    {selectedFieldDetail.dataType}
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#EEF2F6] rounded-md space-y-1">
                  <div className="text-[10px] text-[#667085]">业务角色</div>
                  <div className="font-bold text-[#2563EB]">
                    {selectedFieldDetail.role}
                  </div>
                </div>
              </div>

              {/* 3. 关联业务对象（businessObjectId 驱动） */}
              {asset.businessObject && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#667085]">关联业务对象</label>
                  <div className="p-3 bg-white border border-[#EEF2F6] rounded-md flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-[#2563EB]" />
                      <span className="font-bold text-[#172033]">
                        {asset.businessObject.name}（{asset.businessObject.id}）
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFieldDetail(null);
                        onNavigateToBusinessObject?.(asset.businessObject!.id);
                      }}
                      className="text-[#2563EB] hover:underline text-xs font-semibold cursor-pointer"
                    >
                      查看对象 →
                    </button>
                  </div>
                </div>
              )}

              {/* 4. 关联正式业务术语 */}
              {selectedFieldDetail.businessTerm && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#667085]">关联正式业务术语</label>
                  <div className="p-3 bg-white border border-[#EEF2F6] rounded-md text-[#334155]">
                    {selectedFieldDetail.businessTerm}
                  </div>
                </div>
              )}

              {/* 5. 正式标准映射 */}
              {selectedFieldDetail.standardMapping && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#667085]">正式数据标准映射</label>
                  <div className="p-3 bg-white border border-[#EEF2F6] rounded-md flex items-center justify-between">
                    <code className="font-mono text-[#2563EB] font-bold">
                      {selectedFieldDetail.standardMapping}
                    </code>
                    <button
                      onClick={() => handleCopyText(selectedFieldDetail.standardMapping!, 'standard')}
                      className="text-[#64748B] hover:text-[#172033] flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedKey === 'standard' ? (
                        <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px]">{copiedKey === 'standard' ? '已复制' : '复制'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. 技术映射与安全属性 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#667085]">技术元数据规范</label>
                <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1.5">
                  <div className="flex justify-between text-[#667085]">
                    <span>主键标识 (PK):</span>
                    <span className="font-semibold text-[#172033]">
                      {selectedFieldDetail.isIdentifier ? '是' : '否'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#667085]">
                    <span>可为空约束 (Nullable):</span>
                    <span className="font-semibold text-[#172033]">
                      {selectedFieldDetail.isIdentifier ? '否 (NOT NULL)' : '是 (NULLABLE)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#667085]">
                    <span>脱敏安全策略:</span>
                    <span className="font-semibold text-[#16A36A]">
                      {selectedFieldDetail.name.includes('hash') || selectedFieldDetail.name.includes('id_card')
                        ? '哈希不可逆散列'
                        : '无需脱敏'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex justify-end">
              <button
                onClick={() => setSelectedFieldDetail(null)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-semibold text-xs rounded-md cursor-pointer transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DATA FITNESS DRAWER (数据可用性与质量摘要抽屉)               */}
      {/* ========================================================= */}
      {isFitnessDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div
            className="w-full max-w-[520px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-center justify-between shrink-0 bg-[#FAFCFF]">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  数据可用性与质量摘要
                </div>
                <div className="text-base font-bold text-[#172033]">
                  {asset.name} · 状态评估
                </div>
              </div>

              <button
                onClick={() => setIsFitnessDrawerOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* 核心评估结论 */}
              <div className="space-y-1.5 pb-3 border-b border-[#F1F5F9]">
                <div
                  className={`flex items-center space-x-2 text-[#0F172A] font-bold text-sm`}
                >
                  {hasQualityAttention ? (
                    <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  ) : (
                    <Check className="w-4 h-4 text-[#16A36A]" />
                  )}
                  <span>
                    数据可用性评估结论：
                    {hasQualityAttention ? '适度可用 (存在质量与新鲜度提醒)' : '可用 (无已知质量提醒)'}
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed pl-6">
                  {asset.freshness?.warning ?? '当前数据状态正常，可按更新频率放心使用。'}
                </p>
              </div>

              {/* 1. 质量维度评估 */}
              <div className="space-y-3">
                <div className="font-bold text-[#172033] text-xs">核心质量指标评估</div>

                <div className="space-y-2">
                  <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#172033]">探查覆盖 (Profile)</div>
                      <div className="text-[11px] text-[#667085]">
                        {asset.governanceContext.profileStatus === 'profiled'
                          ? `最近探查 ${asset.governanceContext.lastProfiledTime ?? '—'}`
                          : '尚未完成数据探查'}
                      </div>
                    </div>
                    <span className="font-bold text-[#16A36A] text-sm">
                      {asset.governanceContext.profileStatus === 'profiled' ? '已探查' : '未探查'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#172033]">质量问题 (Quality)</div>
                      <div className="text-[11px] text-[#667085]">按目录质量检测口径汇总</div>
                    </div>
                    <span
                      className={`font-bold text-sm ${hasQualityAttention ? 'text-[#D97706]' : 'text-[#16A36A]'}`}
                    >
                      {asset.governanceContext.qualityIssueCount ?? 0} 项
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#172033]">数据新鲜度 (Timeliness)</div>
                      <div className="text-[11px] text-[#667085]">
                        {asset.freshness?.updateFrequency ?? '—'}
                      </div>
                    </div>
                    <span className="font-bold text-[#16A36A] text-sm">
                      {asset.freshness?.lastUpdatedAt ?? '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex justify-end">
              <button
                onClick={() => setIsFitnessDrawerOpen(false)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-semibold text-xs rounded-md cursor-pointer transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
