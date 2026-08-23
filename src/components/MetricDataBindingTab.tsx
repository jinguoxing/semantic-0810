import React from 'react';
import {
  Check,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Database,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Info,
  Link2,
  Table,
  Building2,
  Tag,
  MapPin,
  GitFork,
  CheckCircle,
  FileCode2
} from 'lucide-react';
import { Metric, MetricBinding } from '../types';

interface MetricDataBindingTabProps {
  metric: Metric;
  binding?: MetricBinding;
  onOpenDataBindingDrawer?: () => void;
  onOpenBusinessRuleDrawer?: () => void;
  onNavigateToDataAssetDetail?: (assetId: string) => void;
  onNavigateToVersionsTab?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MetricDataBindingTab: React.FC<MetricDataBindingTabProps> = ({
  metric,
  binding: propBinding,
  onOpenDataBindingDrawer,
  onOpenBusinessRuleDrawer,
  onNavigateToDataAssetDetail,
  onNavigateToVersionsTab,
  addToast
}) => {
  const binding = propBinding || metric.binding;
  const name = metric.name;
  const businessObject = metric.businessObject;
  const dataAssetName = binding?.dataAssetName || `${businessObject}事实数据资产`;
  const tableName = binding?.tableName || `dwd_${metric.id}_df`;
  const dataAssetId = binding?.dataAssetId || 'asset_01';
  const measureField = binding?.measureField || metric.measurement?.measureName || 'measure_val';
  const aggregation = metric.measurement?.aggregation || 'SUM';
  const businessRuleFilter = binding?.businessRuleFilter || '';
  const baseGrain = metric.measurement?.baseGrain || businessObject;
  const physicalGrainField = binding?.grainMapping?.physicalGrainField || 'id';
  const businessTime = metric.timeSemantics?.businessTime || '业务时间';
  const timeField = binding?.timeField || 'stat_time';
  const isComposite = Boolean(metric.dependencies && metric.dependencies.length > 0);
  const numerator = metric.dependencies?.find(d => d.role === 'NUMERATOR');
  const denominator = metric.dependencies?.find(d => d.role === 'DENOMINATOR');
  const bindingHealth = binding?.health || 'HEALTHY';

  return (
    <div className="w-full bg-white rounded-xl border border-[#E6EAF0] p-6 sm:p-8 space-y-7 font-sans antialiased text-[#172033] shadow-2xs">

      {/* ========================================================= */}
      {/* 1. 当前数据实现 (Current Data Implementation)              */}
      {/* ========================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
            <h2 className="text-sm font-bold text-[#172033] tracking-tight">
              当前数据实现
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenDataBindingDrawer}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <span>查看实现详情 →</span>
          </button>
        </div>

        {/* 业务描述 */}
        <p className="text-xs text-[#334155] leading-relaxed">
          {isComposite ? (
            `当前指标为复合衍生指标，由分子指标「${numerator?.metricName || '分子'}」与分母指标「${denominator?.metricName || '分母'}」组合计算，依托基础事实模型与严格 5 维相容性对齐执行零除保护安全计算。`
          ) : businessRuleFilter ? (
            `当前指标基于“${dataAssetName}”，以${baseGrain}为基础粒度，对度量字段（${measureField}）进行 ${aggregation} 聚合，并通过业务过滤规则（${businessRuleFilter}）限定统计范围。`
          ) : (
            `当前指标基于“${dataAssetName}”，以${baseGrain}为基础粒度，对度量字段（${measureField}）进行 ${aggregation} 聚合计算。`
          )}
        </p>

        {/* Fact Summary 条带 (Flat Inline Fact Strip) */}
        <div className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#667085] block text-[11px]">数据来源</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block truncate max-w-[140px]" title={dataAssetName}>
              {dataAssetName}
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">基础粒度</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">
              {baseGrain} (`{physicalGrainField}`)
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">默认业务时间</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">
              {businessTime} (`{timeField}`)
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">实现状态</span>
            <span className={`font-semibold flex items-center space-x-1 mt-0.5 ${
              bindingHealth === 'HEALTHY' ? 'text-[#16A36A]' : bindingHealth === 'DEGRADED' ? 'text-[#D97706]' : 'text-[#DC2626]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                bindingHealth === 'HEALTHY' ? 'bg-[#16A36A]' : bindingHealth === 'DEGRADED' ? 'bg-[#D97706]' : 'bg-[#DC2626]'
              }`} />
              <span>{bindingHealth === 'HEALTHY' ? '数据实现正常' : bindingHealth === 'DEGRADED' ? '实现降级' : '实现异常'}</span>
            </span>
          </div>
        </div>
      </section>

      <hr className="border-t border-[#EEF2F6]" />

      {/* ========================================================= */}
      {/* 2. 数据来源 (Data Source)                                  */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
            <h2 className="text-sm font-bold text-[#172033] tracking-tight">
              数据来源
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToDataAssetDetail?.(dataAssetId)}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <span>查看数据资产 →</span>
          </button>
        </div>

        {/* 数据资产条目行 (Clean Flat Item Row) */}
        <div className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-bold text-[#172033] text-xs">{dataAssetName}</span>
                <span className="font-mono text-[10px] text-[#667085] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                  {tableName}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[#667085] text-[11px]">
                <span>业务域：<span className="text-[#334155] font-medium">{metric.scope?.businessDomain || '业务域'}</span></span>
                <span>·</span>
                <span>业务对象：<span className="text-[#334155] font-medium">{businessObject}</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
              bindingHealth === 'HEALTHY' 
                ? 'bg-[#F0FDF4] text-[#16A36A] border-[#DCFCE7]' 
                : bindingHealth === 'DEGRADED'
                ? 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]'
                : 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                bindingHealth === 'HEALTHY' ? 'bg-[#16A36A]' : bindingHealth === 'DEGRADED' ? 'bg-[#D97706]' : 'bg-[#DC2626]'
              }`} />
              {bindingHealth === 'HEALTHY' ? '当前可用' : bindingHealth === 'DEGRADED' ? '降级运行' : '不可用'}
            </span>
          </div>
        </div>
      </section>

      <hr className="border-t border-[#EEF2F6]" />

      {/* ========================================================= */}
      {/* 3. 计算映射 (Calculation Mapping)                          */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
            计算映射
          </h2>
        </div>

        {/* 映射表格 (Edge-to-Edge Table) */}
        <div className="border border-[#EEF2F6] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#EEF2F6] text-[#667085] font-semibold">
                <th className="py-2.5 px-4 font-semibold w-1/3">业务语义</th>
                <th className="py-2.5 px-4 font-semibold w-1/3">当前数据实现</th>
                <th className="py-2.5 px-4 font-semibold w-1/3">作用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6] text-[#172033]">
              
              {isComposite ? (
                <>
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#172033]">
                      分子指标 ({numerator?.metricName || '分子'})
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-xs bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded border border-[#BFDBFE]">
                        {numerator?.metricId} ({numerator?.version || 'v1.0.0'})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#2563EB]">
                      NUMERATOR 分子
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#172033]">
                      分母指标 ({denominator?.metricName || '分母'})
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-xs bg-[#F0FDF4] text-[#16A36A] px-1.5 py-0.5 rounded border border-[#BBF7D0]">
                        {denominator?.metricId} ({denominator?.version || 'v1.0.0'})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#16A36A]">
                      DENOMINATOR 分母 (Zero-Division Safe)
                    </td>
                  </tr>
                </>
              ) : (
                <tr className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-2.5 px-4 font-bold text-[#172033]">
                    度量字段 ({metric.measurement?.measureName || '度量'})
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-xs bg-[#F1F5F9] text-[#0F172A] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                      {tableName}.{measureField}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-[#2563EB]">
                    {aggregation} 聚合
                  </td>
                </tr>
              )}

              {/* Row: 业务限定规则 */}
              {businessRuleFilter && (
                <tr className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-2.5 px-4 font-bold text-[#172033]">
                    业务限定规则
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs bg-[#F8FAFC] text-[#334155] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                        {businessRuleFilter}
                      </span>
                      <button
                        type="button"
                        onClick={onOpenBusinessRuleDrawer}
                        className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer flex items-center space-x-0.5"
                      >
                        <span>详情 →</span>
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-[#475569]">
                    统计范围限定
                  </td>
                </tr>
              )}

              {/* Row: 基础粒度 */}
              <tr className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-4 font-bold text-[#172033]">
                  基础粒度 ({baseGrain})
                </td>
                <td className="py-2.5 px-4">
                  <span className="font-mono text-xs bg-[#F1F5F9] text-[#0F172A] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                    {tableName}.{physicalGrainField}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-[#475569]">
                  主键粒度对齐
                </td>
              </tr>

              {/* Row: 业务时间 */}
              <tr className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-4 font-bold text-[#172033]">
                  业务时间 ({businessTime})
                </td>
                <td className="py-2.5 px-4">
                  <span className="font-mono text-xs bg-[#F1F5F9] text-[#0F172A] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                    {tableName}.{timeField}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-[#475569]">
                  默认时态字段
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </section>

      <hr className="border-t border-[#EEF2F6]" />

      {/* ========================================================= */}
      {/* 4. 粒度与时间 (Grain & Time)                               */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
            粒度与时间
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* 左: 基础粒度 */}
          <div className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                基础粒度
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
                <Check className="w-2.5 h-2.5 mr-0.5" />
                粒度可解析
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-base font-bold text-[#172033]">
                {baseGrain}
              </span>
              <span className="font-mono text-[11px] text-[#475569] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                {physicalGrainField}
              </span>
            </div>

            <p className="text-[11px] text-[#475569] leading-relaxed">
              每个{baseGrain}主键记录（`{physicalGrainField}`）作为基础物理粒度参与计算，保证聚合无重复计算风险。
            </p>
          </div>

          {/* 右: 默认业务时间 */}
          <div className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                默认业务时间
              </span>
              <span className="text-[11px] text-[#475569]">
                字段：<span className="font-semibold font-mono text-[#172033]">{timeField}</span>
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-base font-bold text-[#172033]">
                {businessTime}
              </span>
              <span className="font-mono text-[11px] text-[#475569] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                {metric.timeSemantics?.type === 'FLOW'
                  ? 'FLOW (连续流量)'
                  : metric.timeSemantics?.type === 'SNAPSHOT'
                  ? 'SNAPSHOT (时点快照)'
                  : 'PERIOD (期间时段)'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 pt-0.5">
              <span className="text-[11px] text-[#667085]">支持聚合：</span>
              {['DAY', 'MONTH', 'QUARTER', 'YEAR'].map((grainKey) => {
                const label = grainKey === 'DAY' ? '日' : grainKey === 'MONTH' ? '月' : grainKey === 'QUARTER' ? '季' : '年';
                const isDefault = (metric.timeSemantics?.defaultGranularity || 'MONTH') === grainKey;
                return (
                  <span
                    key={grainKey}
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                      isDefault 
                        ? 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB]' 
                        : 'bg-white border border-[#CBD5E1] text-[#334155]'
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      <hr className="border-t border-[#EEF2F6]" />

      {/* ========================================================= */}
      {/* 5. 分析维度与数据路径 (Dimensions & Safe Paths)           */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
            分析维度与数据路径
          </h2>
        </div>

        <div className="border border-[#EEF2F6] rounded-lg overflow-hidden divide-y divide-[#EEF2F6] text-xs">
          {(!metric.dimensions || metric.dimensions.length === 0) ? (
            <div className="p-4 text-center text-xs text-[#94A3B8]">
              暂未配置限定分析维度
            </div>
          ) : (
            metric.dimensions.map((dimName, idx) => {
              const customPath = binding?.dimensionPaths?.find(p => p.dimensionName === dimName);
              return (
                <div key={idx} className="p-3.5 bg-white hover:bg-[#FAFCFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[#172033]">{dimName}</span>
                        <span className="text-[#667085] text-[11px]">（{businessObject}.{dimName}）</span>
                      </div>
                      <div className="text-[11px] text-[#475569] mt-0.5">
                        {customPath ? (
                          <>
                            数据路径：<span className="font-medium text-[#0F172A]">{customPath.sourceObject} → ({customPath.cardinality}) → {customPath.targetObject}</span> · <span className="text-[#16A36A] font-medium">{customPath.validationStatus === 'SAFE' ? '安全无分叉' : '关联已验证'}</span>
                          </>
                        ) : (
                          <>
                            数据映射：<span className="font-mono font-medium text-[#0F172A]">{dimName.toLowerCase()}_code</span> · <span className="text-[#16A36A] font-medium">直接映射 · 路径已确认</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] self-start sm:self-auto">
                    <Check className="w-3 h-3 mr-0.5" />
                    可用
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      <hr className="border-t border-[#EEF2F6]" />

      {/* ========================================================= */}
      {/* 6. 当前实现状态 (Current Implementation Status)            */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
            当前实现状态
          </h2>
        </div>

        {/* 4 项检查状态 (Flat List) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
            <div>
              <div className="font-bold text-[#172033]">数据来源正常</div>
              <div className="text-[10px] text-[#667085]">核心 Data Asset 可用</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
            <div>
              <div className="font-bold text-[#172033]">核心映射有效</div>
              <div className="text-[10px] text-[#667085]">度量与规则映射正常</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
            <div>
              <div className="font-bold text-[#172033]">粒度与时间可解析</div>
              <div className="text-[10px] text-[#667085]">Grain 与时态明确</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
            <div>
              <div className="font-bold text-[#172033]">分析路径可验证</div>
              <div className="text-[10px] text-[#667085]">正式维度路径安全</div>
            </div>
          </div>
        </div>

        {/* 浅绿色通栏说明条 */}
        <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-xs flex items-start space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-[#166534]">
            <div className="font-bold">当前数据实现正常</div>
            <div className="text-[11px] text-[#15803D] leading-relaxed">
              当前 Metric 可以继续用于找数、问数和分析；具体查询仍会根据 Scope、维度、时间和权限进行运行时验证。
            </div>
          </div>
        </div>

        {/* 底部轻量链接 */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center space-x-1 text-[#667085] text-[11px]">
            <span className="text-[#4F46E5] font-bold">✦</span>
            <span>Xino 持续校验中</span>
          </div>

          <button
            type="button"
            onClick={onNavigateToVersionsTab}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>查看实现版本 →</span>
          </button>
        </div>
      </section>

    </div>
  );
};

