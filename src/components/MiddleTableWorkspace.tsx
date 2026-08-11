import React, { useState } from 'react';
import { Sparkles, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface MiddleTableWorkspaceProps {
  onOpenBatchConfirm?: () => void;
  onOpenModeling?: () => void;
  onOpenLineage?: () => void;
  onToggleBottomContext?: () => void;
}

export const MiddleTableWorkspace: React.FC<MiddleTableWorkspaceProps> = ({
  onToggleBottomContext,
}) => {
  const [isDiffExpanded, setIsDiffExpanded] = useState(false);
  const [isUsageExpanded, setIsUsageExpanded] = useState(false);

  return (
    <main className="flex-1 bg-[#FAFAFA] p-4 lg:p-6 overflow-y-auto space-y-6 text-xs text-[#0F172A] select-none">
      {/* Table Understanding Title Block */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0F172A]">表语义理解</h2>
          <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
            高可信 · 89%
          </span>
        </div>
        <h1 className="text-xl font-bold font-mono text-[#0F172A]">
          pop_service_hotline
        </h1>
        <p className="text-xs text-[#64748B]">公共服务热线工单记录表</p>
        <div className="flex items-center space-x-2 pt-1">
          <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
            AI 理解完成
          </span>
          <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
            待确认
          </span>
        </div>
      </div>

      {/* AI 理解结果 Card (Blue Card) */}
      <div className="bg-[#F0F6FF] border border-[#DBEAFE] rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center space-x-2 text-[#2563EB] font-bold text-sm">
          <Sparkles className="w-4 h-4 fill-[#2563EB]" />
          <span>AI 理解结果</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <div className="text-xs text-[#64748B] mb-1">业务记录类型</div>
            <div className="text-xl font-bold text-[#2563EB]">工单过程记录</div>
          </div>
          <div>
            <div className="text-xs text-[#64748B] mb-1">分析角色</div>
            <div className="text-base font-bold text-[#0F172A]">事实类</div>
          </div>
          <div>
            <div className="text-xs text-[#64748B] mb-1">总体置信度</div>
            <div className="text-xl font-bold text-[#0F172A]">89%</div>
          </div>
        </div>

        <div className="text-xs text-[#334155] pt-2 border-t border-[#DBEAFE]/60 leading-relaxed">
          <span className="font-bold text-[#1E293B]">AI 语义摘要：</span>
          该记录公共服务热线从受理、处理到办结的完整业务过程。每一行代表一条独立的工单处理记录。
        </div>
      </div>

      {/* 为什么这样判断？ EVIDENCE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-[#0F172A]">为什么这样判断？</h3>
            <span className="text-[11px] font-mono text-[#94A3B8] font-semibold">EVIDENCE</span>
          </div>
          <span className="text-xs text-[#94A3B8]">多维证据支持</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <th className="py-2.5 px-3.5 w-24">判断维度</th>
                <th className="py-2.5 px-3.5 w-64">关键证据</th>
                <th className="py-2.5 px-3.5">AI 判断</th>
                <th className="py-2.5 px-3.5 w-24 text-center">支持强度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#334155]">
              {/* Row 1 */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-3.5 font-medium text-[#0F172A]">字段组成</td>
                <td className="py-3 px-3.5 font-mono text-[11px]">
                  <span className="bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A]">
                    ticket_id, person_id, status, created_time, close_time
                  </span>
                </td>
                <td className="py-3 px-3.5 leading-relaxed">
                  字段组合同时覆盖业务身份、参与主体、状态变化、创建与完成时间，符合典型业务过程记录结构。
                </td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">
                    强支持
                  </span>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-3.5 font-medium text-[#0F172A]">数据粒度</td>
                <td className="py-3 px-3.5 font-mono text-[11px]">
                  <span className="bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A]">
                    ticket_id
                  </span>
                  <span className="ml-1 text-[#64748B]">：唯一率 99.9%</span>
                </td>
                <td className="py-3 px-3.5 leading-relaxed">
                  一行能够稳定代表一张独立工单处理记录。推断粒度：一条工单处理记录。
                </td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">
                    强支持
                  </span>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-3.5 font-medium text-[#0F172A]">时间模型</td>
                <td className="py-3 px-3.5 font-mono text-[11px]">
                  <span className="bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A]">
                    created_time, close_time, status
                  </span>
                </td>
                <td className="py-3 px-3.5 leading-relaxed">
                  存在创建、处理中、完成等生命周期特征。
                </td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">
                    强支持
                  </span>
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-3.5 font-medium text-[#0F172A]">关系</td>
                <td className="py-3 px-3.5 font-mono text-[11px]">
                  <span className="bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A]">
                    person_id
                  </span>
                  <div className="text-[10px] text-[#D97706] mt-0.5">
                    候选关系：服务工单 → 自然人 <span className="bg-[#FEF3C7] px-1 rounded">待确认</span>
                  </div>
                </td>
                <td className="py-3 px-3.5 leading-relaxed">
                  存在明确业务参与主体关系。
                </td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706]">
                    中支持
                  </span>
                </td>
              </tr>

              {/* Row 5 */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-3.5 font-medium text-[#0F172A]">使用</td>
                <td className="py-3 px-3.5 text-[11px] text-[#475569]">
                  工单趋势分析；办理时效分析；完成率分析
                </td>
                <td className="py-3 px-3.5 leading-relaxed">
                  字段结构支持典型工单生命周期与效率分析。
                </td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB]">
                    辅助支持
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 其他可能解释 · 2 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#0F172A]">其他可能解释 · 2</h3>
          <button
            onClick={() => setIsDiffExpanded(!isDiffExpanded)}
            className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center space-x-1"
          >
            <span>{isDiffExpanded ? '收起差异' : '查看差异'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <th className="py-2.5 px-3.5 w-48">候选解释</th>
                <th className="py-2.5 px-3.5 w-24">置信度</th>
                <th className="py-2.5 px-3.5 w-24">状态</th>
                <th className="py-2.5 px-3.5">理由</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#334155]">
              <tr className="bg-[#ECFDF5]/30 hover:bg-[#ECFDF5]/50">
                <td className="py-3 px-3.5 font-bold text-[#0F172A]">候选 1：工单过程记录</td>
                <td className="py-3 px-3.5 font-bold font-mono text-[#059669]">89%</td>
                <td className="py-3 px-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                    AI 首选
                  </span>
                </td>
                <td className="py-3 px-3.5 leading-relaxed">
                  字段结构、粒度、生命周期与业务上下文高度一致。
                </td>
              </tr>
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-3.5 font-medium text-[#0F172A]">候选 2：事件明细记录</td>
                <td className="py-3 px-3.5 font-mono text-[#64748B]">72%</td>
                <td className="py-3 px-3.5 text-[#94A3B8]">—</td>
                <td className="py-3 px-3.5 leading-relaxed text-[#64748B]">
                  存在状态与时间字段，但当前数据粒度不是单次事件，而是完整工单实例。
                </td>
              </tr>
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-3.5 font-medium text-[#0F172A]">候选 3：业务快照表</td>
                <td className="py-3 px-3.5 font-mono text-[#64748B]">48%</td>
                <td className="py-3 px-3.5 text-[#94A3B8]">—</td>
                <td className="py-3 px-3.5 leading-relaxed text-[#64748B]">
                  缺乏典型周期性快照结构。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 下游可用性 Card */}
      <div className="bg-[#F0F6FF] border border-[#DBEAFE] rounded-2xl p-4 space-y-2 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-[#2563EB] font-bold">
            <Sparkles className="w-4 h-4 fill-[#2563EB]" />
            <span>下游可用性</span>
          </div>
          <div className="text-[#475569]">
            分析：<span className="font-medium text-[#0F172A]">工单趋势、办理时效、完成率</span>
          </div>
          <div className="text-[#475569]">
            推荐计数口径：<span className="font-mono font-bold text-[#2563EB]">count(distinct ticket_id)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DBEAFE]/80 text-xs">
          <div className="flex items-center space-x-3 text-[#475569]">
            <span>Agent 可用：<strong className="text-[#059669]">找数、问数、分析</strong></span>
            <span>|</span>
            <span>限制：<strong className="text-[#D97706]">person_id 关系需确认</strong></span>
          </div>

          <button
            onClick={() => {
              setIsUsageExpanded(!isUsageExpanded);
              if (onToggleBottomContext) onToggleBottomContext();
            }}
            className="text-[#2563EB] font-semibold flex items-center space-x-1 hover:underline"
          >
            <span>查看完整使用上下文</span>
            {isUsageExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </main>
  );
};

