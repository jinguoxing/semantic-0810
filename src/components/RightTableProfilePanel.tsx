import React, { useState } from 'react';
import { 
  PanelRightClose, 
  PanelRightOpen, 
  CheckCircle2, 
  FileEdit, 
  RotateCw, 
  AlertTriangle 
} from 'lucide-react';

interface RightTableProfilePanelProps {
  onConfirmTable: () => void;
  onAdjustTable: () => void;
  onReanalyzeTable: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export const RightTableProfilePanel: React.FC<RightTableProfilePanelProps> = ({
  onConfirmTable,
  onAdjustTable,
  onReanalyzeTable,
  isCollapsed = false,
  setIsCollapsed,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'adjust' | 'history'>('profile');
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = isCollapsed ?? internalCollapsed;
  const toggleCollapse = (value: boolean) => {
    if (setIsCollapsed) {
      setIsCollapsed(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  if (collapsed) {
    return (
      <div className="w-10 bg-white border-l border-[#E2E8F0] flex flex-col items-center py-3 shadow-2xs shrink-0 select-none">
        <button
          onClick={() => toggleCollapse(false)}
          className="p-1.5 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] transition-all"
          title="展开 Table Semantic Profile 面板"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
        <div className="writing-mode-vertical text-[11px] font-bold text-[#64748B] mt-6 tracking-widest uppercase">
          Table Semantic Profile
        </div>
      </div>
    );
  }

  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] bg-white border-l border-[#E2E8F0] flex flex-col h-full shrink-0 shadow-2xs select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#E2E8F0] bg-white space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Table Semantic Profile</h2>
            <p className="text-xs text-[#64748B]">表语义画像</p>
          </div>
          <button
            onClick={() => toggleCollapse(true)}
            className="p-1 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded"
            title="收起面板"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            AI 推荐完成 · 待确认
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-4 pt-2 border-b border-[#E2E8F0] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2 border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            当前画像
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`pb-2 border-b-2 transition-all ${
              activeTab === 'adjust'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            调整建议
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            历史版本
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-[#0F172A]">
        {activeTab === 'profile' && (
          <div className="space-y-3">
            {/* 1. BUSINESS DEFINITION */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                <span className="font-bold text-[#0F172A]">业务定义</span>
                <span className="text-[10px] font-mono font-semibold text-[#94A3B8]">BUSINESS DEFINITION</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">业务名称：</span>
                  <span className="font-bold text-[#0F172A]">服务热线工单</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[#64748B]">业务定义：</span>
                  <p className="text-[#334155] leading-relaxed">记录公共服务热线从受理、处理到办结的业务过程。</p>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[#64748B]">业务域：</span>
                  <span className="font-medium text-[#0F172A]">公共服务</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">潜在业务对象：</span>
                  <span className="font-medium text-[#0F172A]">服务工单</span>
                </div>
                <div className="pt-1 flex justify-end">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669]">
                    AI 推荐
                  </span>
                </div>
              </div>
            </div>

            {/* 2. RECORD MODEL */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                <span className="font-bold text-[#0F172A]">记录模型</span>
                <span className="text-[10px] font-mono font-semibold text-[#94A3B8]">RECORD MODEL</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">记录形态：</span>
                  <span className="font-bold text-[#2563EB]">工单过程记录</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">数据粒度：</span>
                  <span className="font-medium text-[#0F172A]">一条工单处理记录</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">粒度键：</span>
                  <span className="font-mono font-bold text-[#0F172A]">ticket_id</span>
                </div>
                <div className="pt-1 flex justify-end">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669]">
                    高可信
                  </span>
                </div>
              </div>
            </div>

            {/* 3. SUBJECT ENTITY */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                <span className="font-bold text-[#0F172A]">主体对象</span>
                <span className="text-[10px] font-mono font-semibold text-[#94A3B8]">SUBJECT ENTITY</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">主体候选：</span>
                  <span className="font-bold text-[#0F172A]">自然人</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[#64748B]">关系：</span>
                  <p className="font-mono text-[11px] text-[#334155]">服务工单 → 申请人 → 自然人</p>
                </div>
                <div className="pt-1 flex justify-end">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#D97706]">
                    待确认
                  </span>
                </div>
              </div>
            </div>

            {/* 4. TIME MODEL */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                <span className="font-bold text-[#0F172A]">时间模型</span>
                <span className="text-[10px] font-mono font-semibold text-[#94A3B8]">TIME MODEL</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">创建时间：</span>
                  <span className="font-mono font-medium text-[#0F172A]">created_time</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">完成时间：</span>
                  <span className="font-mono font-medium text-[#0F172A]">close_time</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">状态：</span>
                  <span className="font-mono font-medium text-[#0F172A]">status</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">生命周期：</span>
                  <span className="text-[#0F172A] font-medium">创建 → 处理中 → 办结</span>
                </div>
              </div>
            </div>

            {/* 5. UPDATE PATTERN */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-[#FDE68A] pb-1.5">
                <span className="font-bold text-[#B45309]">更新模式</span>
                <span className="text-[10px] font-mono font-semibold text-[#D97706]">UPDATE PATTERN</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#92400E]">AI 推测：</span>
                  <span className="font-bold text-[#B45309]">累积更新</span>
                </div>
                <p className="text-[#B45309] text-[11px] leading-relaxed">
                  依据：同一 ticket_id 包含创建状态和完成状态信息。
                </p>
                <div className="pt-1 flex justify-end">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#D97706]">
                    ⚠️ 待验证
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'adjust' && (
          <div className="space-y-3">
            <div className="text-xs text-[#64748B]">选择可替代的表语义解释：</div>
            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] bg-white cursor-pointer space-y-1 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">事件明细记录</span>
                  <button 
                    onClick={onAdjustTable}
                    className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded text-[10px] font-semibold"
                  >
                    采纳
                  </button>
                </div>
                <p className="text-[11px] text-[#64748B]">单次离散动作事件记录。</p>
              </div>

              <div className="p-3 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] bg-white cursor-pointer space-y-1 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">业务快照表</span>
                  <button 
                    onClick={onAdjustTable}
                    className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded text-[10px] font-semibold"
                  >
                    采纳
                  </button>
                </div>
                <p className="text-[11px] text-[#64748B]">按特定周期分区保存状态。</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="text-xs text-[#64748B]">版本历史：</div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-[#0F172A]">
                  <span>V3 (当前)</span>
                  <span className="text-[10px] text-[#94A3B8] font-normal">2026-08-10</span>
                </div>
                <p className="text-[#475569]">确认: 工单过程记录</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Buttons */}
      <div className="p-4 border-t border-[#E2E8F0] bg-white space-y-2">
        <button
          onClick={onConfirmTable}
          className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>确认表理解</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAdjustTable}
            className="py-2 px-3 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1"
          >
            <FileEdit className="w-3.5 h-3.5 text-[#64748B]" />
            <span>调整 AI 判断</span>
          </button>

          <button
            onClick={onReanalyzeTable}
            className="py-2 px-3 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#2563EB] rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>重新分析</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

