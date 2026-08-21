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
  CheckCircle
} from 'lucide-react';

interface MetricDataBindingTabProps {
  metricName?: string;
  onOpenDataBindingDrawer?: () => void;
  onOpenBusinessRuleDrawer?: () => void;
  onNavigateToDataAssetDetail?: (assetId: string) => void;
  onNavigateToVersionsTab?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MetricDataBindingTab: React.FC<MetricDataBindingTabProps> = ({
  metricName = '有效订单金额',
  onOpenDataBindingDrawer,
  onOpenBusinessRuleDrawer,
  onNavigateToDataAssetDetail,
  onNavigateToVersionsTab,
  addToast
}) => {
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
          当前指标基于“订单事实数据”，以订单为基础粒度，对订单金额进行 SUM 聚合，并通过正式“有效订单”业务规则限定统计范围。
        </p>

        {/* Fact Summary 条带 (Flat Inline Fact Strip，紧凑通栏，非孤立卡片) */}
        <div className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#667085] block text-[11px]">数据来源</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">订单事实数据</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">基础粒度</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">订单 (`order_id`)</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">默认业务时间</span>
            <span className="font-semibold text-[#172033] mt-0.5 inline-block">支付时间 (`paid_time`)</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px]">实现状态</span>
            <span className="font-semibold text-[#16A36A] flex items-center space-x-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
              <span>数据实现正常</span>
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
            onClick={() => onNavigateToDataAssetDetail?.('res-order-fact')}
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
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#172033] text-xs">订单事实数据</span>
                <span className="font-mono text-[10px] text-[#667085] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                  Data Asset · Table
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[#667085] text-[11px]">
                <span>来源系统：<span className="text-[#334155] font-medium">订单业务系统</span></span>
                <span>·</span>
                <span>业务对象：<span className="text-[#334155] font-medium">订单</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] mr-1" />
              当前可用
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
              
              {/* Row 1: 订单金额 */}
              <tr className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-4 font-bold text-[#172033]">
                  订单金额
                </td>
                <td className="py-2.5 px-4">
                  <span className="font-mono text-xs bg-[#F1F5F9] text-[#0F172A] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                    order_amount
                  </span>
                </td>
                <td className="py-2.5 px-4 font-semibold text-[#2563EB]">
                  SUM 聚合
                </td>
              </tr>

              {/* Row 2: 有效订单 */}
              <tr className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-4 font-bold text-[#172033]">
                  有效订单
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-[#172033]">正式业务规则</span>
                    <button
                      type="button"
                      onClick={onOpenBusinessRuleDrawer}
                      className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer flex items-center space-x-0.5"
                    >
                      <span>查看规则实现 →</span>
                    </button>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-[#475569]">
                  统计范围限定
                </td>
              </tr>

              {/* Row 3: 订单 */}
              <tr className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-4 font-bold text-[#172033]">
                  订单
                </td>
                <td className="py-2.5 px-4">
                  <span className="font-mono text-xs bg-[#F1F5F9] text-[#0F172A] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                    order_id
                  </span>
                </td>
                <td className="py-2.5 px-4 text-[#475569]">
                  基础粒度
                </td>
              </tr>

              {/* Row 4: 支付时间 */}
              <tr className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-4 font-bold text-[#172033]">
                  支付时间
                </td>
                <td className="py-2.5 px-4">
                  <span className="font-mono text-xs bg-[#F1F5F9] text-[#0F172A] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                    paid_time
                  </span>
                </td>
                <td className="py-2.5 px-4 text-[#475569]">
                  默认业务时间
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

        {/* 2-column Compact Layout without heavy card borders */}
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
                订单
              </span>
              <span className="font-mono text-[11px] text-[#475569] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                order_id
              </span>
            </div>

            <p className="text-[11px] text-[#475569] leading-relaxed">
              每个订单作为一次基础业务事实参与计算。
            </p>
          </div>

          {/* 右: 默认业务时间 */}
          <div className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                默认业务时间
              </span>
              <span className="text-[11px] text-[#475569]">
                时间语义：<span className="font-semibold text-[#172033]">交易发生时间</span>
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-base font-bold text-[#172033]">
                支付时间
              </span>
              <span className="font-mono text-[11px] text-[#475569] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                paid_time
              </span>
            </div>

            <div className="flex items-center space-x-1.5 pt-0.5">
              <span className="text-[11px] text-[#667085]">支持聚合：</span>
              {['日', '月', '季', '年'].map((grain) => (
                <span
                  key={grain}
                  className="px-1.5 py-0.2 bg-white border border-[#CBD5E1] rounded text-[10px] font-semibold text-[#334155]"
                >
                  {grain}
                </span>
              ))}
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
          
          {/* 维度 1: 渠道 */}
          <div className="p-3.5 bg-white hover:bg-[#FAFCFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-[#172033]">渠道</span>
                  <span className="text-[#667085] text-[11px]">（订单.渠道）</span>
                </div>
                <div className="text-[11px] text-[#475569] mt-0.5">
                  数据映射：<span className="font-mono font-medium text-[#0F172A]">channel_code</span> · <span className="text-[#16A36A] font-medium">直接映射</span>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] self-start sm:self-auto">
              <Check className="w-3 h-3 mr-0.5" />
              可用
            </span>
          </div>

          {/* 维度 2: 商品分类 */}
          <div className="p-3.5 bg-white hover:bg-[#FAFCFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-[#172033]">商品分类</span>
                  <span className="text-[#667085] text-[11px]">（订单.商品分类）</span>
                </div>
                <div className="text-[11px] text-[#475569] mt-0.5">
                  数据映射：<span className="font-mono font-medium text-[#0F172A]">product_category</span> · <span className="text-[#16A36A] font-medium">直接映射</span>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] self-start sm:self-auto">
              <Check className="w-3 h-3 mr-0.5" />
              可用
            </span>
          </div>

          {/* 维度 3: 地区 (跨对象关联) */}
          <div className="p-3.5 bg-white hover:bg-[#FAFCFF] space-y-2.5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-[#172033]">地区</span>
                    <span className="text-[#667085] text-[11px]">（客户.所属地区 · 跨对象分析）</span>
                  </div>
                  <div className="text-[11px] text-[#475569] mt-0.5">
                    结果映射：<span className="font-mono font-medium text-[#0F172A]">region_id</span> · 关系路径已确认
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] self-start sm:self-auto">
                <Check className="w-3 h-3 mr-0.5" />
                关系路径已确认
              </span>
            </div>

            {/* 安全拓扑关联路径 (Dense Horizontal Stepper) */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2 flex items-center flex-wrap gap-2 text-xs">
              <span className="text-[11px] text-[#667085] font-semibold">安全关联路径：</span>
              <span className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[11px] font-bold text-[#172033]">
                订单
              </span>
              <span className="text-[10px] font-mono text-[#2563EB] font-semibold">── N:1 ──→</span>
              <span className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[11px] font-bold text-[#172033]">
                客户
              </span>
              <span className="text-[10px] font-mono text-[#2563EB] font-semibold">── N:1 ──→</span>
              <span className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[11px] font-bold text-[#172033]">
                行政区域
              </span>
              <span className="text-[10px] text-[#667085] ml-auto">
                (无笛卡尔积风险)
              </span>
            </div>
          </div>

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
