import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  PanelRightClose, 
  PanelRightOpen, 
  Clock, 
  FileEdit, 
  History, 
  Sparkles, 
  RotateCw, 
  AlertTriangle,
  ArrowRight
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
      <div className="w-10 bg-white border-l border-[#E2E8F0] flex flex-col items-center py-3 shadow-2xs shrink-0">
        <button
          onClick={() => toggleCollapse(false)}
          className="p-1.5 rounded bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] transition-all"
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
    <aside className="w-full lg:w-[400px] bg-white border-l border-[#E2E8F0] flex flex-col h-full shrink-0 shadow-2xs transition-all duration-200">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-xs font-bold text-[#1E293B]">Table Semantic Profile</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#059669]/20 font-semibold">
              AI 推导已完成
            </span>
            <button
              onClick={() => toggleCollapse(true)}
              className="p-1 text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded"
              title="收起面板"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#F1F5F9] p-1 rounded text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 rounded transition-all text-center flex items-center justify-center space-x-1 ${
              activeTab === 'profile'
                ? 'bg-white text-[#4F46E5] shadow-2xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span>当前画像</span>
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`py-1.5 rounded transition-all text-center flex items-center justify-center space-x-1 ${
              activeTab === 'adjust'
                ? 'bg-white text-[#4F46E5] shadow-2xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span>调整建议</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1.5 rounded transition-all text-center flex items-center justify-center space-x-1 ${
              activeTab === 'history'
                ? 'bg-white text-[#4F46E5] shadow-2xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span>历史版本</span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* Tab 1: 当前画像 */}
        {activeTab === 'profile' && (
          <div className="space-y-3 text-xs">
            {/* 1. 业务定义 */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-md space-y-2">
              <div className="text-[11px] font-bold text-[#1E293B] border-b border-[#E2E8F0] pb-1.5 flex items-center justify-between">
                <span>业务定义</span>
                <span className="text-[10px] text-[#4F46E5] font-mono">BUSINESS DEFINITION</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">业务名称:</span>
                  <span className="font-bold text-[#1E293B]">服务热线工单</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">业务对象候选:</span>
                  <span className="font-bold text-[#059669]">服务工单</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">业务域:</span>
                  <span className="font-semibold text-[#312E81]">公共服务</span>
                </div>
              </div>
            </div>

            {/* 2. 记录模型 */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-md space-y-2">
              <div className="text-[11px] font-bold text-[#1E293B] border-b border-[#E2E8F0] pb-1.5 flex items-center justify-between">
                <span>记录模型</span>
                <span className="text-[10px] text-[#4F46E5] font-mono">RECORD MODEL</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">记录形态:</span>
                  <span className="font-bold text-[#4F46E5]">工单过程记录</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">粒度:</span>
                  <span className="font-semibold text-[#1E293B]">一条工单处理记录</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">粒度键:</span>
                  <span className="font-mono font-bold text-[#1E293B]">ticket_id</span>
                </div>
              </div>
            </div>

            {/* 3. 主体对象 */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-md space-y-2">
              <div className="text-[11px] font-bold text-[#1E293B] border-b border-[#E2E8F0] pb-1.5 flex items-center justify-between">
                <span>主体对象</span>
                <span className="text-[10px] text-[#4F46E5] font-mono">SUBJECT ENTITY</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">主体:</span>
                  <span className="font-bold text-[#1E293B]">群众诉求事件</span>
                </div>
              </div>
            </div>

            {/* 4. 时间模型 */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-md space-y-2">
              <div className="text-[11px] font-bold text-[#1E293B] border-b border-[#E2E8F0] pb-1.5 flex items-center justify-between">
                <span>时间模型</span>
                <span className="text-[10px] text-[#4F46E5] font-mono">TIME MODEL</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">创建时间:</span>
                  <span className="font-mono font-semibold text-[#1E293B]">created_time</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">完成时间:</span>
                  <span className="font-mono font-semibold text-[#1E293B]">close_time</span>
                </div>
              </div>
            </div>

            {/* 5. 更新模式 */}
            <div className="bg-[#FFFBEB] border border-[#D97706]/30 p-3 rounded-md space-y-2">
              <div className="text-[11px] font-bold text-[#B45309] border-b border-[#D97706]/20 pb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>更新模式（AI 猜测推断）</span>
                </span>
                <span className="text-[10px] bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.2 rounded font-semibold border border-[#D97706]/20">
                  待验证
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#78350F]">疑似更新模式:</span>
                  <span className="font-bold text-[#B45309]">累积更新</span>
                </div>
                <div className="text-[#78350F] text-[10px]">
                  <span className="font-semibold">依据: </span>同一 ticket_id 记录同时包含创建时间与完成时间更新。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 调整建议 */}
        {activeTab === 'adjust' && (
          <div className="space-y-3 text-xs">
            <div className="text-[11px] text-[#64748B] font-medium">
              表语义类型二次微调修正：
            </div>

            <div className="bg-[#EEF2FF]/60 border border-[#4F46E5]/20 p-2.5 rounded text-[11px] space-y-1">
              <div className="text-[#64748B]">当前 AI 判断:</div>
              <div className="font-bold text-[#312E81] text-xs">工单过程记录 (事实类)</div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-[#1E293B]">候选表语义模型:</div>

              {/* Candidate Item 1 */}
              <div className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] p-2.5 rounded space-y-1 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E293B]">事件明细记录</span>
                  <button 
                    onClick={onAdjustTable}
                    className="px-2 py-0.5 bg-white border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#4F46E5] text-[#4F46E5] font-semibold rounded text-[10px]"
                  >
                    采纳该类型
                  </button>
                </div>
                <p className="text-[10px] text-[#64748B]">
                  证据差异：缺乏逐条独立动作的细粒度事件 ID，主要为单单据聚合形态。
                </p>
              </div>

              {/* Candidate Item 2 */}
              <div className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] p-2.5 rounded space-y-1 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E293B]">业务快照表</span>
                  <button 
                    onClick={onAdjustTable}
                    className="px-2 py-0.5 bg-white border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#4F46E5] text-[#4F46E5] font-semibold rounded text-[10px]"
                  >
                    采纳该类型
                  </button>
                </div>
                <p className="text-[10px] text-[#64748B]">
                  证据差异：不包含 snapshot_dt 周期分区特征，无全量快照标志。
                </p>
              </div>

              {/* Candidate Item 3 */}
              <div className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] p-2.5 rounded space-y-1 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E293B]">事务事实表</span>
                  <button 
                    onClick={onAdjustTable}
                    className="px-2 py-0.5 bg-white border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#4F46E5] text-[#4F46E5] font-semibold rounded text-[10px]"
                  >
                    采纳该类型
                  </button>
                </div>
                <p className="text-[10px] text-[#64748B]">
                  证据差异：更适合纯数值交易，政务工单侧重生命周期状态流转。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 历史版本 */}
        {activeTab === 'history' && (
          <div className="space-y-3 text-xs">
            <div className="text-[11px] text-[#64748B] font-medium">
              表语义治理审计变更历史：
            </div>

            <div className="space-y-2">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-[#1E293B]">
                  <span>V3 (当前版本)</span>
                  <span className="text-[10px] text-[#94A3B8]">2026-08-10 10:16</span>
                </div>
                <div className="text-[11px] text-[#475569]">
                  确认语义: <span className="font-bold text-[#4F46E5]">工单过程记录</span>
                </div>
                <div className="text-[10px] text-[#64748B] flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                  <span>来源: AI推荐</span>
                  <span>操作人: AI 引擎</span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-2.5 rounded space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-[#1E293B]">
                  <span>V2</span>
                  <span className="text-[10px] text-[#94A3B8]">2026-08-01 14:20</span>
                </div>
                <div className="text-[11px] text-[#475569]">
                  调整语义: <span className="font-bold text-[#334155]">事件明细表</span>
                </div>
                <div className="text-[10px] text-[#64748B] flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                  <span>来源: 人工调整</span>
                  <span>操作人: 王伟 (高级数据治理工程师)</span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-2.5 rounded space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-[#1E293B]">
                  <span>V1</span>
                  <span className="text-[10px] text-[#94A3B8]">2026-07-28 09:15</span>
                </div>
                <div className="text-[11px] text-[#475569]">
                  表初始化: <span className="font-bold text-[#94A3B8]">原始数据表</span>
                </div>
                <div className="text-[10px] text-[#64748B] flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                  <span>来源: 初始导入</span>
                  <span>操作人: 系统自动接入</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel Bottom Action Buttons */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
        <button
          onClick={onConfirmTable}
          className="w-full py-2.5 px-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>确认表理解</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAdjustTable}
            className="py-1.5 px-2 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E293B] rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <FileEdit className="w-3.5 h-3.5 text-[#64748B]" />
            <span>调整 AI 判断</span>
          </button>

          <button
            onClick={onReanalyzeTable}
            className="py-1.5 px-2 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#4F46E5] rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>重新分析</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
