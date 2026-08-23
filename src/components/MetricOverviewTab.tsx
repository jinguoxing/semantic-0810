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
  FileText,
  FileCheck,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  FolderTree,
  BarChart3,
  Copy,
  Users,
  FileCode2
} from 'lucide-react';
import { Metric } from '../types';

interface MetricOverviewTabProps {
  metric: Metric;
  onNavigateToBusinessObject?: (boId: string) => void;
  onNavigateToBindingTab?: () => void;
  onNavigateToVersionsTab?: () => void;
  onOpenBusinessRuleDrawer?: () => void;
  onOpenDataBindingDrawer?: () => void;
  onSelectDimension?: (dimName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MetricOverviewTab: React.FC<MetricOverviewTabProps> = ({
  metric,
  onNavigateToBusinessObject,
  onNavigateToBindingTab,
  onNavigateToVersionsTab,
  onOpenBusinessRuleDrawer,
  onOpenDataBindingDrawer,
  onSelectDimension,
  addToast
}) => {
  const name = metric.name;
  const definition = metric.definition;
  const businessObject = metric.businessObject;
  const businessDomain = metric.scope?.businessDomain || '业务域';
  const scenario = metric.scope?.scenario || '业务分析';
  const entityScope = metric.scope?.entityScope || '全量基数';
  const organization = metric.scope?.organization || '数据管理责任组';
  const measureName = metric.measurement?.measureName || 'measure_value';
  const aggregation = metric.measurement?.aggregation || 'SUM';
  const baseGrain = metric.measurement?.baseGrain || businessObject;
  const unit = metric.measurement?.unit || '';
  const businessTime = metric.timeSemantics?.businessTime || '业务时间';
  const timeType = metric.timeSemantics?.type === 'FLOW'
    ? '连续流量时间语义 (Flow Time)'
    : metric.timeSemantics?.type === 'SNAPSHOT'
    ? '时点快照时间语义 (Snapshot Time)'
    : '时段期间时间语义 (Period Time)';
  const granularity = metric.timeSemantics?.defaultGranularity || 'MONTH';

  // Helper for business object id
  const getBoId = (bo: string) => {
    if (bo === '自然人' || bo === '人口') return 'bo_person';
    if (bo === '服务工单' || bo === '工单') return 'bo_ticket';
    if (bo === '企业') return 'bo_corp';
    if (bo === '客户') return 'bo_customer';
    return 'bo_order';
  };

  // Check if composite
  const isComposite = Boolean(metric?.dependencies && metric.dependencies.length > 0);
  const numerator = metric?.dependencies?.find(d => d.role === 'NUMERATOR');
  const denominator = metric?.dependencies?.find(d => d.role === 'DENOMINATOR');

  return (
    <div className="w-full bg-white rounded-xl border border-[#E6EAF0] p-6 sm:p-8 space-y-7 font-sans antialiased text-[#172033] shadow-2xs">

      {/* ========================================================= */}
      {/* 1. 业务含义 (Business Meaning)                             */}
      {/* ========================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
            <h2 className="text-sm font-bold text-[#172033] tracking-tight">
              业务含义与定义
            </h2>
          </div>
          <span className="text-[11px] text-[#667085]">
            Business Semantic Definition
          </span>
        </div>

        {/* 业务定义描述 */}
        <p className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] p-3.5 rounded-lg border border-[#EEF2F6]">
          {definition}
        </p>

        {/* 核心元属性行 (Flat Inline Strip) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg space-y-1">
            <span className="text-[11px] text-[#667085] block">业务对象 (Business Object)</span>
            <button
              type="button"
              onClick={() => onNavigateToBusinessObject?.(getBoId(businessObject))}
              className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              {businessObject === '自然人' ? <Users className="w-3.5 h-3.5 mr-0.5" /> : <ShoppingBag className="w-3.5 h-3.5 mr-0.5" />}
              <span>{businessObject}</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg space-y-1">
            <span className="text-[11px] text-[#667085] block">
              {isComposite ? '复合指标依赖 (Dependencies)' : '限定业务规则 (Business Rule)'}
            </span>
            <div className="flex items-center space-x-1.5">
              {isComposite ? (
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-[#2563EB] font-mono text-[11px]">{numerator?.metricName || '分子指标'}</span>
                  <span className="text-[#64748B]">÷</span>
                  <span className="font-bold text-[#16A36A] font-mono text-[11px]">{denominator?.metricName || '分母指标'}</span>
                </div>
              ) : (
                <span className="font-bold text-[#172033] truncate">
                  {metric?.binding?.businessRuleFilter ? `${metric.name}业务限定规则` : '标准度量'}
                </span>
              )}
              <button
                type="button"
                onClick={onOpenBusinessRuleDrawer}
                className="text-[11px] text-[#2563EB] hover:underline cursor-pointer ml-1"
              >
                (查看规则)
              </button>
            </div>
          </div>
        </div>

        {/* Applicable Context (适用上下文) */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <span className="w-1.5 h-3 bg-[#2563EB] rounded-xs" />
            <span>适用上下文 (Applicable Scope)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
              <div className="text-[10px] text-[#64748B] font-bold">业务域</div>
              <div className="font-bold text-[#0F172A]">{businessDomain}</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
              <div className="text-[10px] text-[#64748B] font-bold">业务场景</div>
              <div className="font-bold text-[#0F172A]">{scenario}</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
              <div className="text-[10px] text-[#64748B] font-bold">统计范围</div>
              <div className="font-bold text-[#0F172A]">{entityScope}</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
              <div className="text-[10px] text-[#64748B] font-bold">组织/实体</div>
              <div className="font-bold text-[#0F172A]">{organization}</div>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-[#EEF2F6]" />

      {/* ========================================================= */}
      {/* 2. 如何衡量 (Measurement & Calculation)                    */}
      {/* ========================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
            <h2 className="text-sm font-bold text-[#172033] tracking-tight">
              度量方式与计算逻辑
            </h2>
          </div>
          <span className="text-[11px] text-[#667085]">
            Measurement & Grain
          </span>
        </div>

        {/* 4 项关键度量要素条带 */}
        <div className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#667085] block text-[11px]">度量方式</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">
              {isComposite ? '比率复合衍生' : aggregation === 'SUM' ? '累加求和' : aggregation === 'COUNT_DISTINCT' ? '去重计数' : '平均计算'}
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">聚合算子</span>
            <span className="font-mono font-bold text-[#2563EB] mt-0.5 inline-block">
              {isComposite ? 'COMPOSITE_RATIO' : aggregation}
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">基础粒度</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">{baseGrain}</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">计量单位</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">{unit}</span>
          </div>
        </div>

        {/* 逻辑计算口径与时态 (Pure Business Calculation & Time Semantic) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-lg border border-[#EEF2F6] bg-white space-y-2">
            <span className="text-[11px] font-bold text-[#667085]">业务计算口径 (Calculation)</span>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-bold text-[#0F172A] text-xs">
                  {name}
                </span>
                <span className="text-[#64748B] font-bold">=</span>
                {isComposite ? (
                  <span className="font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {numerator?.metricName || '分子'} ÷ {denominator?.metricName || '分母'} × 100%
                  </span>
                ) : (
                  <span className="font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {aggregation}( {metric?.binding?.measureField || measureName} )
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#475569] flex items-center space-x-1.5 pt-0.5">
                <span className="font-semibold text-[#64748B]">限定范围：</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                  {metric?.binding?.businessRuleFilter || entityScope}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#667085]">
              {isComposite 
                ? '基于已发布的分子与分母基础指标，沿统一时空维度与粒度执行零除保护安全除法运算。'
                : `以每条${baseGrain}基础业务事实为基准进行${aggregation}聚合运算。（物理字段与过滤规则映射详见「数据实现」Tab）`}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-[#EEF2F6] bg-white space-y-2">
            <span className="text-[11px] font-bold text-[#667085]">时间语义与粒度 (Time Semantics)</span>
            <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded space-y-1.5">
              <div className="flex items-center space-x-1.5 text-[11px] text-[#166534]">
                <Calendar className="w-3.5 h-3.5 text-[#16A36A] shrink-0" />
                <span className="font-bold">业务时间：{businessTime}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-[#166534]">
                <span className="text-[#15803D] font-medium">支持周期：</span>
                <span className="font-mono font-semibold bg-white/80 px-1.5 py-0.2 rounded border border-[#BBF7D0]">
                  {granularity === 'DAY' ? '日 / 月 / 季 / 年' : granularity === 'MONTH' ? '月 / 季 / 年' : '按需聚合'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#667085]">
              时态为{timeType}，支持沿{businessTime}进行多周期滑动、同比环比与聚合分析。
            </p>
          </div>
        </div>
      </section>

      <hr className="border-t border-[#EEF2F6]" />

      {/* ========================================================= */}
      {/* 3. 可分析维度与时间 (Analyzable Dimensions & Time)         */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
            <h2 className="text-sm font-bold text-[#172033] tracking-tight">
              分析维度与时间
            </h2>
          </div>
          <span className="text-[11px] text-[#667085]">
            Analyzable Dimensions & Time Semantics
          </span>
        </div>

        {/* 3.1 业务分析维度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center space-x-1.5">
              <Tag className="w-3 h-3 text-[#2563EB]" />
              <span>分析维度 ({metric?.dimensions?.length || 0} 个可用)</span>
            </div>
            <span className="text-[11px] text-[#64748B]">全量维度均经过 5 维相容性校验与拓扑防环验证</span>
          </div>

          <div className="border border-[#EEF2F6] rounded-lg overflow-hidden divide-y divide-[#EEF2F6] text-xs">
            {(!metric?.dimensions || metric.dimensions.length === 0) ? (
              <div className="p-4 text-center text-xs text-[#94A3B8]">
                暂未配置限定分析维度
              </div>
            ) : (
              metric.dimensions.map((dimName, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectDimension?.(dimName)}
                  className="p-3 bg-white hover:bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">{dimName}</span>
                        <span className="text-[#667085] text-[11px]">({businessObject}.{dimName})</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        直接映射分析维度 (Direct Mapping)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 self-start sm:self-auto shrink-0">
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
                      <Check className="w-2.5 h-2.5 mr-0.5" />
                      正式可用
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3.2 时间语义 (单独展示为时间切片) */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center space-x-1.5">
            <Calendar className="w-3 h-3 text-[#16A36A]" />
            <span>时间 (Time Semantics)</span>
          </div>
          
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded bg-[#F0FDF4] text-[#16A36A] flex items-center justify-center font-bold text-xs shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#172033]">{businessTime}</span>
                  <span className="text-[#64748B] text-[11px] font-mono">({metric?.binding?.timeField || 'stat_time'})</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#DCFCE7] text-[#166534]">
                    {timeType}
                  </span>
                </div>
                <div className="text-[11px] text-[#475569] mt-0.5">
                  支持聚合粒度：<span className="font-mono font-semibold text-[#0F172A]">{granularity === 'DAY' ? '日 / 月 / 季 / 年' : '月 / 季 / 年'}</span>
                </div>
              </div>
            </div>
            
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] self-start sm:self-auto">
              <Check className="w-2.5 h-2.5 mr-0.5" />
              时间对齐可用
            </span>
          </div>
        </div>
      </section>

      <hr className="border-t border-[#EEF2F6]" />

      {/* ========================================================= */}
      {/* 4. 数据实现概况与依据 (Implementation & Evidence)         */}
      {/* ========================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
            <h2 className="text-sm font-bold text-[#172033] tracking-tight">
              数据实现与可信依据
            </h2>
          </div>
          <button
            type="button"
            onClick={onNavigateToBindingTab}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>查看完整数据实现 →</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          
          {/* 数据绑定摘要 */}
          <div className="p-3.5 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#172033] flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>数据来源资产</span>
              </span>
              <span className="text-[10px] font-semibold text-[#16A36A] bg-[#F0FDF4] px-1.5 py-0.2 rounded border border-[#DCFCE7]">
                {metric?.binding?.health === 'HEALTHY' ? '绑定正常' : '待绑定'}
              </span>
            </div>
            <div className="text-xs font-bold text-[#172033]">
              {metric?.binding?.dataAssetName || '事实数据资产'} ({metric?.binding?.tableName || 'dwd_fact_table'})
            </div>
            <div className="text-[11px] text-[#667085]">
              来源系统：{businessDomain}系统 ｜ 基础主键：{metric?.binding?.grainMapping?.physicalGrainField || 'id'}
            </div>
          </div>

          {/* 制度规范依据 */}
          <div className="p-3.5 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#172033] flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>规范制度依据</span>
              </span>
              <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#DBEAFE]">
                {metric?.version || 'v1.0.0'} 正式版
              </span>
            </div>
            <div className="text-xs font-bold text-[#172033]">
              {metric?.provenance?.evidence?.[0] || `《${businessDomain}业务数据治理规范》`}
            </div>
            <div className="text-[11px] text-[#667085]">
              归口责任主体：{metric?.provenance?.owner || '数据治理委员会'}
            </div>
          </div>

        </div>

        {/* AI 可用声明条带 (遵循 V1.2 规范：无需打分与百分比，清晰声明业务语义完整、数据实现可解析、当前无阻断问题) */}
        <div className="p-3.5 bg-[#F5F3FF] border border-[#DDD6FE] rounded-lg text-xs flex items-start space-x-3">
          <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
          <div className="space-y-1 text-[#5B21B6] flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-bold flex items-center space-x-2 text-xs">
                <span>✦ AI 可用</span>
                <span className="text-[10px] font-semibold bg-white/80 px-2 py-0.5 rounded text-[#6D28D9] border border-[#DDD6FE]">
                  已通过语义与实现校验
                </span>
              </div>
            </div>
            <div className="text-[11px] text-[#6D28D9] leading-relaxed flex items-center flex-wrap gap-x-3 gap-y-1 pt-0.5 font-medium">
              <span className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-[#16A36A]" />
                <span>业务语义完整</span>
              </span>
              <span className="text-[#C4B5FD]">·</span>
              <span className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-[#16A36A]" />
                <span>数据实现可解析</span>
              </span>
              <span className="text-[#C4B5FD]">·</span>
              <span className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-[#16A36A]" />
                <span>当前无阻断问题</span>
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
