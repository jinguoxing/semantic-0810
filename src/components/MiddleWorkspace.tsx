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
        return 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/30';
      case '辅助支持':
      default:
        return 'bg-[#EEF2FF] text-[#2563EB] border-[#2563EB]/20';
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] p-3 lg:p-4 overflow-y-auto space-y-3.5">
      {/* Top Field Header Bar (No outer card border, clean inline design) */}
      <div className="py-1 px-1 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#E2E8F0]/60 pb-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-bold font-mono text-[#0F172A] tracking-tight">
              {fieldItem.name}
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] font-medium">
              {fieldItem.dataType}
            </span>
            {fieldItem.status === 'conflict' ? (
              <span className="text-xs px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] font-medium">
                冲突
              </span>
            ) : fieldItem.status === 'pending' ? (
              <span className="text-xs px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-medium">
                待确认
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>语义已确认</span>
              </span>
            )}
          </div>
          <div className="text-xs text-[#64748B] flex items-center space-x-3 font-sans">
            <span><span className="text-[#94A3B8]">来源表:</span> <span className="font-mono text-[#334155]">{fieldItem.tableName}</span></span>
            <span className="text-[#CBD5E1]"></span>
            <span className="text-[#64748B]">公共服务热线工单记录表</span>
          </div>
        </div>

        {/* Right side status & Muted action links */}
        <div className="flex flex-col md:items-end space-y-1.5 text-xs">
          <div className="flex items-center space-x-1.5 text-[#2563EB] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>AI 已理解 · Review 中</span>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={onViewHistory}
              className="text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer transition-colors font-medium"
            >
              <History className="w-3.5 h-3.5" />
              <span>查看历史</span>
            </button>
            <button
              onClick={onMarkReview}
              className="text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer transition-colors font-medium"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>标记待复核</span>
            </button>
          </div>
        </div>
      </div>

      {/* Module 1: AI理解结果 */}
      <div className="bg-[#F0F5FF] rounded-md border border-[#BFDBFE] p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#DBEAFE] pb-2.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-xs font-bold text-[#1E3A8A]">AI 理解结果</h2>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[#475569]">
              可信度: <span className="font-mono font-bold text-[#2563EB]">{aiResult.confidenceScore}%</span>
            </span>
            <span className="text-[#475569]">
              治理状态: {fieldItem.status === 'conflict' ? (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] ml-1">
                  冲突
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] ml-1">
                  待确认
                </span>
              )}
            </span>
          </div>
        </div>

        {/* 4-column key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-[11px] text-[#64748B] mb-0.5">语义类型</div>
            <div className="font-bold text-[#0F172A] text-xs">
              {aiResult.recommendedSemantic || '主体标识'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#64748B] mb-0.5">业务名称</div>
            <div className="font-bold text-[#2563EB] text-xs">
              {aiResult.businessNameSuggestion || '申请人标识'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#64748B] mb-0.5">字段角色</div>
            <div className="font-semibold text-[#1E293B] text-xs">
              {data.currentAsset?.fieldRole || '主体关联字段'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#64748B] mb-0.5">对应物理类型</div>
            <div className="font-mono font-semibold text-[#475569] text-xs">
              {fieldItem.dataType}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#DBEAFE] text-xs text-[#334155] leading-relaxed">
          <span className="font-semibold text-[#1E3A8A]">业务定义: </span>
          {data.currentAsset?.businessDefinition || '表示发起服务热线工单申请的人员标识，用于关联工单主体与自然人实体。'}
        </div>
      </div>

      {/* Module 2: 理解依据与证据链 (Clean layout without outer card box) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-xs font-bold text-[#0F172A] flex items-center space-x-2">
            <span>为什么这样判断？</span>
            <span className="text-[#94A3B8] font-normal text-xs">理解依据与证据链</span>
          </h2>
        </div>

        {/* Table of Evidences */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden text-xs shadow-2xs">
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-3.5 py-2 grid grid-cols-12 gap-2 text-[11px] font-bold text-[#475569]">
            <div className="col-span-4">证据类型与发现</div>
            <div className="col-span-6">AI 判断</div>
            <div className="col-span-2 text-right">支持强度</div>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {evidences.map((ev, index) => (
              <div key={ev.id || index} className="px-3.5 py-2.5 grid grid-cols-12 gap-2 items-start hover:bg-[#F8FAFC]/80 transition-colors">
                {/* Column 1: Evidence Type & Params */}
                <div className="col-span-4 space-y-1">
                  <div className="font-bold text-[#0F172A] flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[10px] flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span>{ev.title}</span>
                  </div>
                  <div className="space-y-0.5 text-[11px] text-[#64748B] pl-5">
                    {ev.params.map((p, pIdx) => (
                      <div key={pIdx}>
                        <span>{p.label}: </span>
                        <span className="font-mono text-[#334155] font-medium">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: AI Judgment */}
                <div className="col-span-6 text-[#334155] leading-relaxed text-[11px] pt-0.5">
                  {ev.explanation}
                </div>

                {/* Column 3: Support Level Badge */}
                <div className="col-span-2 text-right pt-0.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getSupportBadgeClass(
                      ev.supportLevel
                    )}`}
                  >
                    {ev.supportLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module 3: AI 判断摘要 Box */}
      <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF]/60 p-3.5 space-y-1">
        <div className="flex items-center space-x-2 text-[#1E3A8A] font-bold text-xs">
          <Brain className="w-4 h-4 text-[#2563EB]" />
          <span>AI 判断摘要</span>
        </div>
        <p className="text-xs text-[#334155] leading-relaxed">
          {aiResult.summary}
        </p>
      </div>

      {/* Module 4: 其他可能解释 (Clean layout without outer card box) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#0F172A]">
              其他可能解释 ({candidates.length})
            </span>
          </div>
          <button
            onClick={() => setIsCandidatesExpanded(!isCandidatesExpanded)}
            className="text-xs text-[#2563EB] font-medium hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>查看差异</span>
            {isCandidatesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isCandidatesExpanded && (
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden text-xs shadow-2xs">
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-3.5 py-2 grid grid-cols-12 gap-2 text-[11px] font-bold text-[#475569]">
              <div className="col-span-3">候选解释</div>
              <div className="col-span-2">可信度</div>
              <div className="col-span-2">状态</div>
              <div className="col-span-3">原因摘要</div>
              <div className="col-span-2 text-right">操作</div>
            </div>

            <div className="divide-y divide-[#F1F5F9]">
              {candidates.map((cand) => (
                <div key={cand.id} className="px-3.5 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-[#F8FAFC]/80 transition-colors">
                  <div className="col-span-3 font-bold text-[#0F172A]">
                    {cand.semantic}
                  </div>
                  <div className="col-span-2 font-mono font-bold text-[#2563EB]">
                    {cand.confidenceScore}%
                  </div>
                  <div className="col-span-2">
                    {cand.isRecommended ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                        AI 推荐
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                        候选
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 text-[11px] text-[#64748B] truncate">
                    {cand.reasoningBrief}
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => onSelectCandidate(cand.semantic, cand.businessNameSuggestion)}
                      className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-xs cursor-pointer hover:underline"
                    >
                      采纳
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

