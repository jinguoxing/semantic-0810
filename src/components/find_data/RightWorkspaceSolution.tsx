import React, { useState } from 'react';
import { X, Layers, CheckCircle2, AlertCircle, HelpCircle, FileText, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

interface RightWorkspaceSolutionProps {
  onClose: () => void;
  viewMode?: 'recommended' | 'executable';
  onSwitchViewMode?: (mode: 'recommended' | 'executable') => void;
  onNavigateToAskPlan?: () => void;
}

export const RightWorkspaceSolution: React.FC<RightWorkspaceSolutionProps> = ({
  onClose,
  viewMode: propViewMode = 'recommended',
  onSwitchViewMode,
  onNavigateToAskPlan
}) => {
  const [internalMode, setInternalMode] = useState<'recommended' | 'executable'>(propViewMode);

  const currentMode = onSwitchViewMode ? propViewMode : internalMode;
  const setMode = (mode: 'recommended' | 'executable') => {
    if (onSwitchViewMode) {
      onSwitchViewMode(mode);
    } else {
      setInternalMode(mode);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200 select-none">
      {/* Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">当前数据方案</h3>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#F1F5F9] text-[#2563EB] font-bold rounded">
                {currentMode === 'executable' ? '当前可执行视图' : '完整推荐视图'}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">按角色组织的资源方案、支持范围与缺口声明</p>
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0] text-xs">
            <button
              onClick={() => setMode('recommended')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                currentMode === 'recommended'
                  ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              推荐视图
            </button>
            <button
              onClick={() => setMode('executable')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                currentMode === 'executable'
                  ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              可执行视图
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
            title="关闭工作区"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
        
        {/* Section 1: 本次计算核心 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
            <span className="font-bold text-[#0F172A] text-xs flex items-center space-x-1.5">
              <span className="w-1.5 h-3.5 bg-[#2563EB] rounded-full" />
              <span>一、本次计算核心（2项）</span>
            </span>
            <span className="text-[11px] text-[#16A34A] font-medium bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#DCFCE7]">
              问数状态：可直接使用
            </span>
          </div>

          <div className="space-y-2">
            {/* Item 1 */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:bg-white transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#0F172A] text-xs">60 岁以上常住人口数</span>
                    <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold rounded border border-[#BFDBFE]">
                      正式指标
                    </span>
                    <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded">
                      角色：核心人口口径
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569]">
                    支持街镇 × 月份维度，覆盖 2025 年 9 月至 2026 年 8 月。
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#16A34A]">可使用</span>
              </div>
            </div>

            {/* Item 2 */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:bg-white transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#0F172A] text-xs">在营可用养老床位数</span>
                    <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold rounded border border-[#BFDBFE]">
                      正式指标
                    </span>
                    <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded">
                      角色：核心床位供给口径
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569]">
                    口径严格限定为在营机构当前可提供使用的养老床位，非核定或历史最大床位。
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#16A34A]">可使用</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: 条件性支撑 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
            <span className="font-bold text-[#0F172A] text-xs flex items-center space-x-1.5">
              <span className="w-1.5 h-3.5 bg-[#64748B] rounded-full" />
              <span>二、条件性支撑（1项）</span>
            </span>
            <span className="text-[11px] text-[#64748B]">按需引入 · 不默认加所有计算</span>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#0F172A] text-xs">行政区划</span>
                  <span className="px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] text-[10px] font-medium rounded">
                    数据资产
                  </span>
                  <span className="text-[10px] text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                    条件性维度支撑
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  使用原则：仅在各源头街镇编码、街镇标准名称或层级需要对齐时加入，不参与聚合计算。
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#16A34A]">当前可使用</span>
            </div>
          </div>
        </div>

        {/* Section 3: 可选下钻 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
            <span className="font-bold text-[#0F172A] text-xs flex items-center space-x-1.5">
              <span className="w-1.5 h-3.5 bg-[#8B5CF6] rounded-full" />
              <span>三、可选下钻（2项）</span>
            </span>
            <span className="text-[11px] text-[#8B5CF6] font-medium">不参与核心比率计算</span>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#0F172A] text-xs">常住人口月度快照</span>
                    <span className="px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] text-[10px] font-medium rounded">
                      数据资产 · 18 字段
                    </span>
                    <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                      用户已选定
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    用于人口趋势与人员月度明细下钻；不进入“每千名老人床位数”核心分母计算。
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#16A34A]">可直接问数</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#0F172A] text-xs">养老机构基本信息</span>
                    <span className="px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] text-[10px] font-medium rounded">
                      数据资产
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    用于解释某街镇的床位由哪些机构提供；不参与核心分子汇总。
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#16A34A]">可直接使用</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: 部分匹配 (推荐视图显示，可执行视图标记“暂不进入执行”) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
            <span className="font-bold text-[#0F172A] text-xs flex items-center space-x-1.5">
              <span className="w-1.5 h-3.5 bg-[#EA580C] rounded-full" />
              <span>四、部分匹配与受限候选</span>
            </span>
            <span className="text-[11px] text-[#EA580C] font-semibold">
              {currentMode === 'executable' ? '暂不进入本次执行' : '未纳入核心方案'}
            </span>
          </div>

          <div className="p-3 bg-[#FFF7ED]/40 border border-[#FFEDD5] rounded-xl space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#0F172A] text-xs">居家养老服务订单</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFF7ED] text-[#EA580C] font-semibold border border-[#FED7AA]">
                    部分匹配
                  </span>
                  <span className="text-[10px] text-[#64748B] bg-white px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                    需申请查询
                  </span>
                </div>
                <p className="text-[11px] text-[#7C2D12]">
                  范围限制：只覆盖居家养老服务使用记录，不能代表机构养老、全口径养老服务使用或全部老年人服务需求。
                </p>
              </div>
              <span className="text-[11px] font-medium text-[#EA580C]">
                {currentMode === 'executable' ? '执行排除' : '需申请'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: 当前方案缺口 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
            <span className="font-bold text-[#0F172A] text-xs flex items-center space-x-1.5">
              <span className="w-1.5 h-3.5 bg-[#94A3B8] rounded-full" />
              <span>五、当前方案缺口声明</span>
            </span>
            <span className="text-[11px] text-[#64748B]">客观边界保留</span>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs text-[#475569]">
              <AlertCircle className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              <span className="font-medium">完整养老服务实际使用情况</span>
              <span className="text-[10px] text-[#94A3B8]">（机构养老、日托等未纳管）</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-[#475569]">
              <AlertCircle className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              <span className="font-medium">老年人心理咨询服务使用情况</span>
              <span className="text-[10px] text-[#94A3B8]">（当前可发现资源尚未覆盖）</span>
            </div>
          </div>
        </div>

        {/* Section 6: 关系说明与边界 */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-[11px] text-[#475569]">
          <div className="font-bold text-[#0F172A] text-xs flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>六、语义关系与推导边界说明</span>
          </div>
          <ul className="space-y-1 list-disc list-inside leading-relaxed text-[#64748B]">
            <li>“60 岁以上常住人口数”与“在营可用养老床位数”均天然支持街镇 × 月份组织本次分析。</li>
            <li>行政区划仅在街镇代码或名称需要统一时使用，不默认参与关联。</li>
            <li>养老机构基本信息仅作为结果机构下钻解释，不参与核心供给比率计算。</li>
            <li>居家养老服务订单与当前任务仅存在业务语义联系，未建立直接关联。</li>
            <li>严禁声称所有资源可以直接 Join 或同名即关联。</li>
          </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <div className="text-xs text-[#64748B]">
          方案状态：<span className="font-semibold text-[#16A34A]">可满足供给水平基线分析</span>
        </div>
        {onNavigateToAskPlan && (
          <button
            onClick={onNavigateToAskPlan}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5"
          >
            <span>进入 Ask Data 分析计划</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
