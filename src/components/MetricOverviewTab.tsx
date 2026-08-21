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
  Copy
} from 'lucide-react';

interface MetricOverviewTabProps {
  metricName?: string;
  onNavigateToBusinessObject?: (boId: string) => void;
  onNavigateToBindingTab?: () => void;
  onNavigateToVersionsTab?: () => void;
  onOpenBusinessRuleDrawer?: () => void;
  onOpenDataBindingDrawer?: () => void;
  onSelectDimension?: (dimName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MetricOverviewTab: React.FC<MetricOverviewTabProps> = ({
  metricName = '有效订单金额',
  onNavigateToBusinessObject,
  onNavigateToBindingTab,
  onNavigateToVersionsTab,
  onOpenBusinessRuleDrawer,
  onOpenDataBindingDrawer,
  onSelectDimension,
  addToast
}) => {
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
          满足“有效订单”业务规则的订单金额合计，用于衡量企业在指定统计周期内实际产生的有效商业交易规模与营收总盘。
        </p>

        {/* 核心元属性行 (Flat Inline Strip) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg space-y-1">
            <span className="text-[11px] text-[#667085] block">业务对象 (Business Object)</span>
            <button
              type="button"
              onClick={() => onNavigateToBusinessObject?.('bo_order')}
              className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-0.5" />
              <span>{metricName === '有效订单金额' ? '订单 (Order)' : '自然人 (Person)'}</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg space-y-1">
            <span className="text-[11px] text-[#667085] block">限定业务规则 (Business Rule)</span>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-[#172033]">{metricName === '有效订单金额' ? '有效订单 = 支付成功且未退款' : '老龄化率 = 60周岁及以上常住人口'}</span>
              <button
                type="button"
                onClick={onOpenBusinessRuleDrawer}
                className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
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
              <div className="font-bold text-[#0F172A]">{metricName === '有效订单金额' ? '交易分析' : '人口服务'}</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
              <div className="text-[10px] text-[#64748B] font-bold">业务场景</div>
              <div className="font-bold text-[#0F172A]">{metricName === '有效订单金额' ? '订单经营分析' : '人口结构分析'}</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
              <div className="text-[10px] text-[#64748B] font-bold">统计范围</div>
              <div className="font-bold text-[#0F172A]">{metricName === '有效订单金额' ? '有效订单' : '有效常住人口'}</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
              <div className="text-[10px] text-[#64748B] font-bold">组织/实体</div>
              <div className="font-bold text-[#0F172A]">{metricName === '有效订单金额' ? '销售业务与财务核算' : '全域自然人'}</div>
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
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">金额累加求和</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">聚合算子</span>
            <span className="font-mono font-bold text-[#2563EB] mt-0.5 inline-block">SUM</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">基础粒度</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">订单 (order_id)</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">计量单位</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">元 (CNY)</span>
          </div>
        </div>

        {/* 逻辑计算口径与时态 (Pure Business Calculation & Time Semantic) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-lg border border-[#EEF2F6] bg-white space-y-2">
            <span className="text-[11px] font-bold text-[#667085]">业务计算口径 (Calculation)</span>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#0F172A] text-xs">
                  {metricName}
                </span>
                <span className="text-[#64748B] font-bold">=</span>
                <span className="font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  SUM( 订单金额 )
                </span>
              </div>
              <div className="text-[11px] text-[#475569] flex items-center space-x-1.5 pt-0.5">
                <span className="font-semibold text-[#64748B]">限定范围：</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                  有效订单（支付成功且未退款）
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#667085]">
              以每笔支付完成且未作废的订单事实为基础进行度量累加。（物理字段与过滤规则映射详见「数据实现」Tab）
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-[#EEF2F6] bg-white space-y-2">
            <span className="text-[11px] font-bold text-[#667085]">时间语义与粒度 (Time Semantics)</span>
            <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded space-y-1.5">
              <div className="flex items-center space-x-1.5 text-[11px] text-[#166534]">
                <Calendar className="w-3.5 h-3.5 text-[#16A36A] shrink-0" />
                <span className="font-bold">业务时间：支付时间</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-[#166534]">
                <span className="text-[#15803D] font-medium">支持周期：</span>
                <span className="font-mono font-semibold bg-white/80 px-1.5 py-0.2 rounded border border-[#BBF7D0]">
                  日 / 月 / 季 / 年
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#667085]">
              时态为连续流量时间语义，支持沿支付发生时间进行多周期滑动与聚合分析。
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
              <span>分析维度 (4 个可用)</span>
            </div>
            <span className="text-[11px] text-[#64748B]">包含 3 个直接映射维度 · 1 个安全关系路径维度</span>
          </div>

          <div className="border border-[#EEF2F6] rounded-lg overflow-hidden divide-y divide-[#EEF2F6] text-xs">
            {[
              {
                name: '渠道',
                attr: '订单.渠道',
                type: 'DIRECT',
                mappingDesc: '直接映射 (Direct Mapping)',
                icon: Tag
              },
              {
                name: '商品分类',
                attr: '订单.商品分类',
                type: 'DIRECT',
                mappingDesc: '直接映射 (Direct Mapping)',
                icon: Layers
              },
              {
                name: '地区',
                attr: '客户.所属地区',
                type: 'RELATIONSHIP',
                mappingDesc: '安全关系路径: 订单 → 客户 → 行政区域',
                icon: MapPin
              },
              {
                name: '支付方式',
                attr: '订单.支付方式',
                type: 'DIRECT',
                mappingDesc: '直接映射 (Direct Mapping)',
                icon: CreditCard
              },
            ].map((dim, idx) => (
              <div
                key={idx}
                onClick={() => onSelectDimension?.(dim.name)}
                className="p-3 bg-white hover:bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                    <dim.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors">{dim.name}</span>
                      <span className="text-[#667085] text-[11px]">({dim.attr})</span>
                      {dim.type === 'RELATIONSHIP' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]">
                          Relationship Path
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#475569] mt-0.5">
                      {dim.type === 'RELATIONSHIP' ? (
                        <span className="text-[#7E22CE] font-medium">{dim.mappingDesc}</span>
                      ) : (
                        <span className="text-[#64748B]">{dim.mappingDesc}</span>
                      )}
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
            ))}
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
                  <span className="font-bold text-[#172033]">支付时间</span>
                  <span className="text-[#64748B] text-[11px] font-mono">(paid_time)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#DCFCE7] text-[#166534]">
                    流量时间 (Flow Time)
                  </span>
                </div>
                <div className="text-[11px] text-[#475569] mt-0.5">
                  支持聚合粒度：<span className="font-mono font-semibold text-[#0F172A]">日 / 月 / 季 / 年</span>
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
                绑定正常
              </span>
            </div>
            <div className="text-xs font-bold text-[#172033]">
              订单事实数据 (`res-order-fact`)
            </div>
            <div className="text-[11px] text-[#667085]">
              来源系统：订单业务系统 ｜ 基础主键：`order_id`
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
                v2.0 正式版
              </span>
            </div>
            <div className="text-xs font-bold text-[#172033]">
              《企业电商交易业务数据治理规范》第 4.2 条
            </div>
            <div className="text-[11px] text-[#667085]">
              归口责任部门：交易分析与财务核算组
            </div>
          </div>

        </div>

        {/* AI 可用声明条带 */}
        <div className="p-3 bg-[#F5F3FF] border border-[#DDD6FE] rounded-lg text-xs flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-[#5B21B6]">
            <div className="font-bold flex items-center space-x-2">
              <span>✦ AI 可用已就绪</span>
              <span className="text-[10px] font-semibold bg-white/70 px-1.5 py-0.2 rounded text-[#6D28D9]">语义完整度 100%</span>
            </div>
            <div className="text-[11px] text-[#6D28D9] leading-relaxed">
              当前指标语义结构完整、数据映射明确、拓扑路径安全，Semovix AI 可安全用于找数、问数、归因分析及多维下钻。
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
