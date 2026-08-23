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
import { Metric } from '../types';

interface DataBindingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metric?: Metric;
  onAdjustBinding?: () => void;
  onViewDataAsset?: (assetName: string) => void;
  onViewBusinessRule?: (ruleName: string) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const DataBindingDrawer: React.FC<DataBindingDrawerProps> = ({
  isOpen,
  onClose,
  metric,
  onAdjustBinding,
  onViewDataAsset,
  onViewBusinessRule,
  addToast
}) => {
  const metricName = metric?.name || '有效订单金额';
  const dataAssetName = metric?.binding?.dataAssetName || '事实数据资产';
  const tableName = metric?.binding?.tableName || 'dwd_fact_table';
  const businessObject = metric?.businessObject || '订单';
  const baseGrain = metric?.measurement?.baseGrain || businessObject;
  const physicalGrainField = metric?.binding?.grainMapping?.physicalGrainField || 'id';
  const measureField = metric?.binding?.measureField || metric?.measurement?.measureName || 'measure_val';
  const aggregation = metric?.measurement?.aggregation || 'SUM';
  const businessTime = metric?.timeSemantics?.businessTime || '业务时间';
  const timeField = metric?.binding?.timeField || 'stat_time';
  const businessRuleFilter = metric?.binding?.businessRuleFilter || '';

  // Lightweight Edit Mode toggle for "调整绑定"
  const [isAdjustMode, setIsAdjustMode] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<string>(tableName);
  const [selectedMeasureField, setSelectedMeasureField] = useState<string>(measureField);
  const [selectedTimeField, setSelectedTimeField] = useState<string>(timeField);

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
            {metricName}
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
          <div className="flex items-center space-x-1.5 text-[11.5px] font-medium text-[#4F46E5]">
            <Sparkles className="w-3.5 h-3.5 text-[#6366F1] shrink-0" />
            <span>✦ Xino 已根据当前业务语义建立候选数据实现</span>
          </div>

          <p className="text-xs text-[#334155] leading-relaxed font-normal">
            当前指标基于“{dataAssetName}”计算，粒度为{baseGrain}，通过正式业务过滤规则限定统计范围。
          </p>

          <div className="pt-2 border-t border-[#F1F5F9] grid grid-cols-3 gap-3">
            <div className="space-y-0.5">
              <div className="text-[11px] text-[#667085]">数据来源</div>
              <div className="text-xs font-bold text-[#172033] truncate" title={dataAssetName}>
                {dataAssetName}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] text-[#667085]">基础粒度</div>
              <div className="text-xs font-bold text-[#172033]">
                {baseGrain}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] text-[#667085]">当前状态</div>
              <div className="text-xs font-bold text-[#16A36A] flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]"></span>
                <span className="truncate">数据实现正常</span>
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
                  onViewDataAsset(dataAssetName);
                } else {
                  addToast?.('info', '查看数据资产', `已定位数据资产「${dataAssetName} (${tableName})」`);
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
                    {dataAssetName}
                  </span>
                  <span className="text-[10.5px] font-mono text-[#475569] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    {tableName}
                  </span>
                </div>
                <div className="text-xs text-[#667085]">
                  业务对象：<span className="text-[#334155] font-semibold">{businessObject}</span>
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
            <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
              <div className="text-[11px] font-semibold text-[#667085]">
                计算值映射
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-bold text-[#172033]">
                    度量字段
                  </span>
                  <span className="text-[#98A2B3] text-xs">→</span>
                  <code className="text-xs font-mono font-medium text-[#1E293B] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    {measureField}
                  </code>
                </div>

                <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                  {aggregation}
                </div>
              </div>
            </div>

            {businessRuleFilter && (
              <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-[#667085]">
                    业务限定规则
                  </div>
                  <button
                    onClick={() => {
                      if (onViewBusinessRule) {
                        onViewBusinessRule(metricName);
                      } else {
                        addToast?.('info', '查看规则实现', `已打开「${metricName}」正式业务规则定义`);
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
                      过滤条件
                    </span>
                    <span className="text-[#98A2B3] text-xs">→</span>
                    <span className="text-xs font-mono text-[#334155] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                      {businessRuleFilter}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-xs font-semibold text-[#16A36A]">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>已映射</span>
                  </div>
                </div>
              </div>
            )}
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
            <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  基础粒度
                </div>
                <div className="text-sm font-bold text-[#172033]">
                  {baseGrain}
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-[#667085]">
                  <span className="text-[#98A2B3]">↓</span>
                  <code className="text-xs font-mono font-medium text-[#1E293B] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                    {physicalGrainField}
                  </code>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#667085]">
                  默认业务时间
                </div>
                <div className="text-sm font-bold text-[#172033]">
                  {businessTime}
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-[#667085]">
                  <span className="text-[#98A2B3]">↓</span>
                  <code className="text-xs font-mono font-medium text-[#1E293B] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                    {timeField}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
