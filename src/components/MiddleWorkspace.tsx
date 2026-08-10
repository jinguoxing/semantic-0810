import React, { useState } from 'react';
import {
  Sparkles,
  History,
  Flag,
  ChevronDown,
  ChevronUp,
  Brain,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Zap,
  Tag,
  BarChart3,
  Bot,
  Hash,
  Lock,
  Layers,
  ArrowRight,
  Database,
  Info
} from 'lucide-react';
import { CompleteFieldGovernanceData } from '../types';

interface MiddleWorkspaceProps {
  data: CompleteFieldGovernanceData;
  onSelectCandidate: (semantic: string, businessName: string) => void;
  onViewHistory: () => void;
  onMarkReview: () => void;
  onOpenBatchConfirm?: () => void;
}

export const MiddleWorkspace: React.FC<MiddleWorkspaceProps> = ({
  data,
  onSelectCandidate,
  onViewHistory,
  onMarkReview,
  onOpenBatchConfirm,
}) => {
  const [isCotExpanded, setIsCotExpanded] = useState(true);
  const [isCandidatesExpanded, setIsCandidatesExpanded] = useState(true);

  const { fieldItem, aiResult, evidences, cotReasoning, candidates, generatedAssets } = data;

  const getSupportBadgeClass = (supportLevel: string) => {
    switch (supportLevel) {
      case '强支持':
        return 'bg-[#ECFDF5] text-[#059669] border-[#059669]/30';
      case '中支持':
        return 'bg-[#EEF2FF] text-[#4F46E5] border-[#4F46E5]/30';
      case '辅助支持':
      default:
        return 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]';
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] p-3 lg:p-4 overflow-y-auto space-y-3">
      {/* Top Field Header Bar */}
      <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-[#EEF2FF] border border-[#4F46E5]/20 flex items-center justify-center text-[#4F46E5]">
            <Tag className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#64748B]">当前字段：</span>
              <h1 className="text-sm font-bold font-mono text-[#1E293B]">
                {fieldItem.name}
              </h1>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                {fieldItem.dataType}
              </span>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#059669]/20 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                <span>语义已确认</span>
              </span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center space-x-2 font-mono">
              <span>{fieldItem.tableName} · {fieldItem.dataType}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onViewHistory}
            className="px-2.5 py-1 text-xs font-medium text-[#475569] hover:text-[#1E293B] bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded transition-colors flex items-center space-x-1.5"
          >
            <History className="w-3.5 h-3.5 text-[#64748B]" />
            <span>查看历史</span>
          </button>
          <button
            onClick={onMarkReview}
            className="px-2.5 py-1 text-xs font-medium text-[#D97706] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#D97706]/30 rounded transition-colors flex items-center space-x-1.5"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>标记待复核</span>
          </button>
        </div>
      </div>

      {/* Module 1: AI理解结果 */}
      <div className="bg-white rounded-md border border-[#E2E8F0] p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#4F46E5]" />
            <h2 className="text-xs font-bold text-[#1E293B]">AI理解结果</h2>
            <span className="text-[10px] text-[#64748B] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#4F46E5]/20 font-medium">
              Xino｜犀诺 智能理解
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#64748B]">可信等级:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#059669]/30">
              高可信
            </span>
            <span className="font-mono text-[11px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#4F46E5]/20">
              置信度: 82%
            </span>
          </div>
        </div>

        {/* Highlighted Result Grid */}
        <div className="bg-[#EEF2FF]/60 border border-[#4F46E5]/20 rounded p-3 space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-[11px] text-[#64748B] mb-0.5">语义类型</div>
              <div className="font-bold text-[#312E81] flex items-center space-x-1">
                <span>事件时间</span>
                <Sparkles className="w-3 h-3 text-[#4F46E5]" />
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#64748B] mb-0.5">业务名称</div>
              <div className="font-bold text-[#1E293B]">办结时间</div>
            </div>
            <div>
              <div className="text-[11px] text-[#64748B] mb-0.5">字段角色</div>
              <div className="font-semibold text-[#059669]">事件时间字段</div>
            </div>
            <div>
              <div className="text-[11px] text-[#64748B] mb-0.5">对应物理类型</div>
              <div className="font-mono font-semibold text-[#475569]">DATETIME</div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#4F46E5]/10 text-xs text-[#334155] leading-relaxed">
            <span className="font-semibold text-[#312E81]">业务定义: </span>
            表示工单完成处理发生的时间节点，用于过程分析和趋势统计。
          </div>
        </div>
      </div>

      {/* Module 2: 理解依据与证据链 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center space-x-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>为什么这样判断？（理解依据与证据链）</span>
          </h2>
          <span className="text-[10px] text-[#64748B]">多维凭证支撑</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card 1: 命名证据 */}
          <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">命名证据</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#059669]/30">
                  强支持
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] text-[10px] font-mono space-y-0.5">
                <div className="text-[#64748B]">来源: 字段名 close_time</div>
                <div className="text-[#312E81] font-bold">发现: close + time</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-tight">
                字段名称与“关闭/完成时间”语义高度匹配。
              </p>
            </div>
          </div>

          {/* Card 2: 数据画像 */}
          <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">数据画像</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#EEF2FF] text-[#4F46E5] border border-[#4F46E5]/30">
                  中支持
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] text-[10px] font-mono space-y-0.5">
                <div className="text-[#64748B]">类型: DATETIME</div>
                <div className="text-[#312E81] font-bold">空值率: 1.2%</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-tight">
                时间值连续分布，符合事件时间字段特征。
              </p>
            </div>
          </div>

          {/* Card 3: 结构关系 */}
          <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">结构关系</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
                  辅助支持
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] text-[10px] font-mono space-y-0.5">
                <div className="text-[#64748B]">关联: ticket_no</div>
                <div className="text-[#312E81] font-bold">关联类型: 主事件表</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-tight">
                字段与业务事件完成处理过程存在强关联。
              </p>
            </div>
          </div>

          {/* Card 4: 标准匹配 */}
          <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">标准匹配</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
                  辅助支持
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] text-[10px] font-mono space-y-0.5">
                <div className="text-[#64748B]">标准: 业务完成时间</div>
                <div className="text-[#312E81] font-bold">匹配度: 88%</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-tight">
                与企业已有“业务完成时间”语义标准高度接近。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Module 3: AI判断摘要 (CoT Chain) */}
      <div className="rounded-md border border-[#E2E8F0] overflow-hidden bg-white shadow-2xs">
        <button
          onClick={() => setIsCotExpanded(!isCotExpanded)}
          className="w-full px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] flex items-center justify-between text-left transition-colors border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-[#0F172A] text-white flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-[#818CF8]" />
            </div>
            <span className="text-xs font-bold text-[#1E293B]">
              AI判断摘要 (Step-by-Step Reasoning Summary)
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-[#64748B]">
            <span>{isCotExpanded ? '收起步骤' : '展开推理步骤'}</span>
            {isCotExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </button>

        {isCotExpanded && (
          <div className="p-3 bg-[#0F172A] text-slate-200 space-y-2 text-xs font-sans">
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center space-x-2 bg-slate-800/80 p-2 rounded border border-slate-700">
                <span className="w-5 h-5 rounded bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                  1
                </span>
                <span className="text-slate-200">检查字段命名模式（close_time）</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 p-2 rounded border border-slate-700">
                <span className="w-5 h-5 rounded bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                  2
                </span>
                <span className="text-slate-200">分析数据类型与数据分布（DATETIME，空值率 1.2%）</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 p-2 rounded border border-slate-700">
                <span className="w-5 h-5 rounded bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                  3
                </span>
                <span className="text-slate-200">结合同表上下文和关系证据（关联 ticket_no 工单主表）</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 p-2 rounded border border-slate-700">
                <span className="w-5 h-5 rounded bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                  4
                </span>
                <span className="text-slate-200">匹配企业语义标准（匹配“业务完成时间”规范）</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 p-2 rounded border border-slate-700">
                <span className="w-5 h-5 rounded bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                  5
                </span>
                <span className="text-slate-200">生成字段语义候选并排序（首选事件时间，置信度 82%）</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module 4: 其他可能解释 */}
      <div className="bg-white rounded-md border border-[#E2E8F0] overflow-hidden shadow-2xs">
        <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#1E293B]">
              其他可能解释（2）
            </span>
            <span className="text-[11px] text-[#64748B]">候选语义排序</span>
          </div>
          <button
            onClick={() => setIsCandidatesExpanded(!isCandidatesExpanded)}
            className="text-xs text-[#4F46E5] font-semibold hover:underline flex items-center space-x-1"
          >
            <span>查看差异</span>
            {isCandidatesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isCandidatesExpanded && (
          <div className="p-3 space-y-2 text-xs">
            {/* Candidate Row 1: 事件时间 */}
            <div className="p-2.5 rounded border border-[#4F46E5] bg-[#EEF2FF]/60 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#312E81]">事件时间</span>
                  <span className="bg-[#4F46E5] text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                    推荐
                  </span>
                </div>
                <p className="text-[#64748B] text-[11px]">与字段命名和表上下文最匹配。</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-[#4F46E5]">82%</span>
                <button
                  onClick={() => onSelectCandidate('事件时间', '办结时间')}
                  className="px-2.5 py-1 bg-[#4F46E5] text-white rounded text-xs font-semibold hover:bg-[#4338CA] transition-colors"
                >
                  采纳
                </button>
              </div>
            </div>

            {/* Candidate Row 2: 创建时间 */}
            <div className="p-2.5 rounded border border-[#E2E8F0] bg-white flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#1E293B]">创建时间</span>
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[9px] font-semibold px-1.5 py-0.2 rounded">
                    候选
                  </span>
                </div>
                <p className="text-[#64748B] text-[11px]">存在时间语义，但与 close 词义冲突。</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-mono font-semibold text-[#64748B]">61%</span>
                <button
                  onClick={() => onSelectCandidate('创建时间', '创建时间')}
                  className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#1E293B] rounded text-xs font-medium transition-colors"
                >
                  采纳
                </button>
              </div>
            </div>

            {/* Candidate Row 3: 关闭日期 */}
            <div className="p-2.5 rounded border border-[#E2E8F0] bg-white flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#1E293B]">关闭日期</span>
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[9px] font-semibold px-1.5 py-0.2 rounded">
                    候选
                  </span>
                </div>
                <p className="text-[#64748B] text-[11px]">日期语义相关，但精度和上下文不完全匹配。</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-mono font-semibold text-[#64748B]">42%</span>
                <button
                  onClick={() => onSelectCandidate('关闭日期', '关闭日期')}
                  className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#1E293B] rounded text-xs font-medium transition-colors"
                >
                  采纳
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module 5: AI 建议批量确认提示 Banner */}
      <div className="bg-[#ECFDF5] border border-[#059669]/30 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[#065F46]">AI建议确认 12 个高可信字段</div>
            <p className="text-[#047857] text-[11px]">
              当前存在 12 个高可信字段可批量确认，2 个字段存在冲突，需单独处理。
            </p>
          </div>
        </div>
        <button
          onClick={onOpenBatchConfirm}
          className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded text-xs shadow-2xs transition-colors shrink-0 flex items-center space-x-1"
        >
          <span>批量确认</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

