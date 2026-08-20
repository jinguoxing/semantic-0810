import React, { useState } from 'react';
import {
  X,
  Check,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Database,
  Calendar,
  Layers,
  ChevronRight,
  Sliders,
  ShieldCheck,
  Info,
  Link2,
  Table
} from 'lucide-react';

interface DataBindingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAdjustBinding?: () => void;
  onViewDataAsset?: (assetName: string) => void;
  onViewBusinessRule?: (ruleName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const DataBindingDrawer: React.FC<DataBindingDrawerProps> = ({
  isOpen,
  onClose,
  onAdjustBinding,
  onViewDataAsset,
  onViewBusinessRule,
  addToast
}) => {
  // Lightweight Edit Mode toggle for "调整绑定"
  const [isAdjustMode, setIsAdjustMode] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<string>('dwd_order_fact_di');
  const [selectedMeasureField, setSelectedMeasureField] = useState<string>('order_amount');
  const [selectedTimeField, setSelectedTimeField] = useState<string>('paid_time');

  if (!isOpen) return null;

  return (
    <aside
      className="w-[580px] lg:w-[600px] bg-white border-l border-[#E6EAF0] flex flex-col h-full shrink-0 z-30 transition-all shadow-xs overflow-hidden"
      aria-label="数据实现检查面板"
    >
      {/* ========================================================= */}
      {/* 1. DRAWER HEADER                                          */}
      {/* ========================================================= */}
      <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-start justify-between bg-white shrink-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-base font-bold text-[#172033] tracking-tight">
              数据实现
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
              可进入验证
            </span>
          </div>
          <div className="text-xs font-medium text-[#667085]">
            有效订单金额
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-[#98A2B3] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-md transition-colors cursor-pointer"
          title="关闭面板"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. DYNAMIC SOURCE & TOP SUMMARY                          */}
      {/* ========================================================= */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#EEF2F6]">
        
        {/* Dynamic Source Notice + Narrative Summary + Key Facts */}
        <div className="p-6 space-y-4 bg-white">
          {/* Dynamic source note (AI-native light line) */}
          <div className="flex items-center space-x-1.5 text-[11.5px] font-medium text-[#4F46E5]">
            <Sparkles className="w-3.5 h-3.5 text-[#6366F1] shrink-0" />
            <span>✦ Xino 已根据当前业务语义建立候选数据实现</span>
          </div>

          {/* Narrative Summary */}
          <p className="text-xs text-[#334155] leading-relaxed font-normal">
            当前指标基于“订单事实数据”计算订单金额，并使用正式“有效订单”业务规则限定统计范围。
          </p>

          {/* Compact Fact Summary (Label / Value / Whitespace / Light Divider) */}
          <div className="pt-2 border-t border-[#F1F5F9] grid grid-cols-3 gap-3">
            <div className="space-y-0.5">
              <div className="text-[11px] text-[#667085]">数据来源</div>
              <div className="text-xs font-bold text-[#172033] truncate">
                订单事实数据
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] text-[#667085]">基础粒度</div>
              <div className="text-xs font-bold text-[#172033]">
                订单
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] text-[#667085]">当前状态</div>
              <div className="text-xs font-bold text-[#16A36A] flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]"></span>
                <span className="truncate">数据实现可验证</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 3. SECTION: 数据来源                                     */}
        {/* ======================================================= */}
        <div className="p-6 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
              数据来源
            </h3>
            <button
              onClick={() => {
                if (onViewDataAsset) {
                  onViewDataAsset('订单事实数据');
                } else {
                  addToast?.('info', '查看数据资产', '已定位数据资产「订单事实数据 (dwd_order_fact_di)」');
                }
              }}
              className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>查看数据资产</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-[#172033]">
                    订单事实数据
                  </span>
                  <span className="text-[10.5px] font-mono text-[#475569] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    Data Asset · Table
                  </span>
                </div>
                <div className="text-xs text-[#667085]">
                  来源：<span className="text-[#334155] font-medium">订单业务系统</span> · 映射业务对象：<span className="text-[#334155] font-semibold">订单</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs font-semibold text-[#16A36A] shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>当前可用</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 4. SECTION: 计算与业务限定                               */}
        {/* ======================================================= */}
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
            计算与业务限定
          </h3>

          <div className="space-y-3">
            {/* 4.1 计算值 */}
            <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
              <div className="text-[11px] font-semibold text-[#667085]">
                计算值映射
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-bold text-[#172033]">
                    订单金额
                  </span>
                  <span className="text-[#98A2B3] text-xs">→</span>
                  <code className="text-xs font-mono font-medium text-[#1E293B] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    order_amount
                  </code>
                </div>

                <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                  SUM
                </div>
              </div>
            </div>

            {/* 4.2 业务限定 */}
            <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-[#667085]">
                  业务限定规则
                </div>
                <button
                  onClick={() => {
                    if (onViewBusinessRule) {
                      onViewBusinessRule('有效订单');
                    } else {
                      addToast?.('info', '查看规则实现', '已打开「有效订单」正式业务规则定义与过滤逻辑');
                    }
                  }}
                  className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>查看规则实现</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-bold text-[#172033]">
                    有效订单
                  </span>
                  <span className="text-[#98A2B3] text-xs">→</span>
                  <span className="text-xs font-medium text-[#334155] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    正式业务规则
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-xs font-semibold text-[#16A36A]">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>已映射</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 5. SECTION: 粒度与时间                                   */}
        {/* ======================================================= */}
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
            粒度与时间
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* 基础粒度 */}
            <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  基础粒度
                </div>
                <div className="text-sm font-bold text-[#172033]">
                  订单
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-[#667085]">
                  <span className="text-[#98A2B3]">↓</span>
                  <code className="text-xs font-mono font-medium text-[#1E293B] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                    order_id
                  </code>
                </div>
              </div>

              <p className="text-[11px] text-[#667085] leading-relaxed pt-1.5 border-t border-[#EEF2F6]">
                每个订单作为一次基础业务事实参与计算。
              </p>
            </div>

            {/* 默认业务时间 */}
            <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  默认业务时间
                </div>
                <div className="text-sm font-bold text-[#172033]">
                  支付时间
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-[#667085]">
                  <span className="text-[#98A2B3]">↓</span>
                  <code className="text-xs font-mono font-medium text-[#1E293B] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                    paid_time
                  </code>
                </div>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-[#EEF2F6]">
                <div className="text-[10.5px] text-[#667085]">
                  时间语义：<span className="text-[#334155] font-medium">交易发生时间</span>
                </div>
                <div className="flex items-center space-x-1 pt-0.5">
                  <span className="text-[10px] text-[#98A2B3]">支持粒度：</span>
                  {['日', '月', '季', '年'].map((grain) => (
                    <span
                      key={grain}
                      className="px-1.5 py-0.5 bg-white text-[#475569] border border-[#E2E8F0] rounded text-[10px] font-medium"
                    >
                      {grain}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 6. SECTION: 分析维度                                     */}
        {/* ======================================================= */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
              分析维度
            </h3>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              当前仅展示已经完成数据映射并具有安全分析路径的正式维度。
            </p>
          </div>

          <div className="space-y-3">
            {/* 维度 1: 渠道 */}
            <div className="p-3 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#172033]">
                    渠道
                  </span>
                  <span className="text-[11px] text-[#667085]">
                    (订单.渠道)
                  </span>
                  <span className="text-[#98A2B3] text-xs">→</span>
                  <code className="text-xs font-mono font-medium text-[#1E293B] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                    channel_code
                  </code>
                </div>
                <div className="text-[10.5px] text-[#667085]">
                  关系：<span className="font-medium text-[#334155]">直接映射</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs font-semibold text-[#16A36A]">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>可用</span>
              </div>
            </div>

            {/* 维度 2: 商品分类 */}
            <div className="p-3 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#172033]">
                    商品分类
                  </span>
                  <span className="text-[11px] text-[#667085]">
                    (订单.商品分类)
                  </span>
                  <span className="text-[#98A2B3] text-xs">→</span>
                  <code className="text-xs font-mono font-medium text-[#1E293B] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                    product_category
                  </code>
                </div>
                <div className="text-[10.5px] text-[#667085]">
                  关系：<span className="font-medium text-[#334155]">直接映射</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs font-semibold text-[#16A36A]">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>可用</span>
              </div>
            </div>

            {/* 维度 3: 地区 · 跨对象分析路径 */}
            <div className="p-4 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#172033]">
                      地区
                    </span>
                    <span className="text-[11px] text-[#667085]">
                      (客户.所属地区)
                    </span>
                  </div>
                  <div className="text-[11px] text-[#667085] mt-0.5">
                    跨对象分析路径
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-xs font-semibold text-[#16A36A]">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>关系路径已确认</span>
                </div>
              </div>

              {/* Lightweight Path Visualization (3 small clean nodes, very thin connector, N:1 subtle text) */}
              <div className="p-3 bg-white border border-[#E2E8F0] rounded-md flex items-center justify-between">
                {/* Node 1 */}
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs font-bold text-[#172033]">
                  <span>订单</span>
                </div>

                {/* Arrow 1 */}
                <div className="flex flex-col items-center px-1">
                  <span className="text-[10px] text-[#98A2B3] font-mono leading-none">N:1</span>
                  <div className="flex items-center text-[#98A2B3] -mt-0.5">
                    <div className="w-6 sm:w-10 h-px bg-[#CBD5E1]"></div>
                    <ChevronRight className="w-3 h-3 -ml-1 text-[#98A2B3]" />
                  </div>
                </div>

                {/* Node 2 */}
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs font-bold text-[#172033]">
                  <span>客户</span>
                </div>

                {/* Arrow 2 */}
                <div className="flex flex-col items-center px-1">
                  <span className="text-[10px] text-[#98A2B3] font-mono leading-none">N:1</span>
                  <div className="flex items-center text-[#98A2B3] -mt-0.5">
                    <div className="w-6 sm:w-10 h-px bg-[#CBD5E1]"></div>
                    <ChevronRight className="w-3 h-3 -ml-1 text-[#98A2B3]" />
                  </div>
                </div>

                {/* Node 3 */}
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs font-bold text-[#172033]">
                  <span>行政区域</span>
                </div>
              </div>

              {/* Final mapping note */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center space-x-2 text-[#475569]">
                  <span>最终数据映射：</span>
                  <span className="font-semibold text-[#172033]">地区</span>
                  <span className="text-[#98A2B3]">→</span>
                  <code className="font-mono text-[11px] text-[#1E293B] bg-white px-1.5 py-0.2 rounded border border-[#CBD5E1]">
                    region_id
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 7. SECTION: 数据实现完整性                               */}
        {/* ======================================================= */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
              数据实现完整性
            </h3>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              当前 Binding 是否已经具备进入系统验证所需的基础条件。
            </p>
          </div>

          {/* 4 Green Check Items */}
          <div className="space-y-3">
            {/* Item 1 */}
            <div className="flex items-start space-x-2.5">
              <div className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-[#16A36A] stroke-[3]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#172033]">
                  数据来源有效
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5 leading-relaxed">
                  当前核心 Data Asset 与必要字段存在。
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start space-x-2.5">
              <div className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-[#16A36A] stroke-[3]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#172033]">
                  粒度可解析
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5 leading-relaxed">
                  订单粒度与唯一标识已经明确。
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-start space-x-2.5">
              <div className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-[#16A36A] stroke-[3]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#172033]">
                  时间映射有效
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5 leading-relaxed">
                  支付时间已映射到正式业务时间。
                </div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-start space-x-2.5">
              <div className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-[#16A36A] stroke-[3]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#172033]">
                  分析路径可验证
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5 leading-relaxed">
                  当前正式维度均使用 V1.2 支持的安全分析关系。
                </div>
              </div>
            </div>
          </div>

          {/* Overall Status Bar (Restrained Light Green Status Area) */}
          <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg space-y-1.5 mt-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
              <span className="text-xs font-bold text-[#166534]">
                数据实现可进入系统验证
              </span>
            </div>
            <p className="text-[11px] text-[#15803D] leading-relaxed">
              当前数据实现已经具备完整性条件，系统验证将进一步检查语义、依赖、粒度、时间、维度和实际执行安全性。
            </p>
          </div>
        </div>

        {/* Lightweight Adjust Mode Overlay / Options (if user clicked '调整绑定') */}
        {isAdjustMode && (
          <div className="p-6 bg-[#FAFCFF] border-t-2 border-[#2563EB] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#2563EB]" />
                <h4 className="text-xs font-bold text-[#172033]">
                  轻量调整绑定（V1.2 安全受控范围）
                </h4>
              </div>
              <button
                onClick={() => setIsAdjustMode(false)}
                className="text-[11px] text-[#667085] hover:text-[#172033] cursor-pointer"
              >
                取消调整
              </button>
            </div>

            <p className="text-[11px] text-[#667085] leading-relaxed">
              仅允许在已有数据资产、正式度量与安全关系路径之间调整，不支持自定义非安全 SQL 或任意多对多笛卡尔积。
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#475569]">Root Data Asset 资产</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs text-[#172033] focus:border-[#2563EB] focus:outline-hidden"
                >
                  <option value="dwd_order_fact_di">dwd_order_fact_di (订单事实数据 - 推荐)</option>
                  <option value="dws_order_summary_d">dws_order_summary_d (订单聚合汇总表)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569]">度量物理字段</label>
                  <select
                    value={selectedMeasureField}
                    onChange={(e) => setSelectedMeasureField(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs text-[#172033] focus:border-[#2563EB] focus:outline-hidden"
                  >
                    <option value="order_amount">order_amount (订单金额)</option>
                    <option value="pay_amount">pay_amount (实付金额)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569]">业务时间字段</label>
                  <select
                    value={selectedTimeField}
                    onChange={(e) => setSelectedTimeField(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs text-[#172033] focus:border-[#2563EB] focus:outline-hidden"
                  >
                    <option value="paid_time">paid_time (支付时间)</option>
                    <option value="create_time">create_time (下单时间)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setIsAdjustMode(false)}
                  className="px-3 py-1 bg-white border border-[#E2E8F0] text-[#334155] rounded text-xs font-medium hover:bg-[#F8FAFC] cursor-pointer"
                >
                  放弃更改
                </button>
                <button
                  onClick={() => {
                    setIsAdjustMode(false);
                    addToast?.('success', '绑定调整已暂存', '已将指标物理字段映射更新，并在背景草稿中保持数据就绪');
                  }}
                  className="px-3 py-1 bg-[#2563EB] text-white rounded text-xs font-semibold hover:bg-[#1D4ED8] cursor-pointer"
                >
                  保存调整
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 8. DRAWER FOOTER (FIXED)                                  */}
      {/* ========================================================= */}
      <div className="px-6 py-4 border-t border-[#EEF2F6] bg-white flex items-center justify-between shrink-0">
        <button
          onClick={() => {
            setIsAdjustMode(!isAdjustMode);
            if (!isAdjustMode) {
              addToast?.('info', '轻量调整模式', '已进入安全受控的字段与时间映射调整模式');
            }
          }}
          className="px-4 py-2 border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] hover:border-[#94A3B8] rounded-md font-semibold text-xs transition-colors cursor-pointer"
        >
          {isAdjustMode ? '退出调整' : '调整绑定'}
        </button>

        <button
          onClick={onClose}
          className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white rounded-md font-bold text-xs transition-colors shadow-2xs cursor-pointer"
        >
          完成
        </button>
      </div>
    </aside>
  );
};
