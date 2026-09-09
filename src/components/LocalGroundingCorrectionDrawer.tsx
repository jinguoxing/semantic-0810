import React, { useEffect, useState } from 'react';
import { 
  X, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Layers, 
  FileText, 
  Info,
  CheckCircle2
} from 'lucide-react';

export interface CandidateFieldOption {
  id: string;
  field: string;
  label: string;
  semanticType: string;
  semantics: string;
  evidence: string;
  note: string;
}

const CANDIDATE_FIELDS: CandidateFieldOption[] = [
  {
    id: 'close_time',
    field: 'close_time',
    label: '完成时间字段',
    semanticType: '事件时间',
    semantics: '服务工单完成办理的实际时间',
    evidence: '根据客服系统底层流程动作，该字段记录工单最终办理完成的实际物理时间戳。',
    note: '经最新数据语义修订确认，与业务属性「办结时间」严格吻合。'
  },
  {
    id: 'finished_at',
    field: 'finished_at',
    label: '完成状态时间',
    semanticType: '状态变更时间',
    semantics: '工单状态置为已完成的打标时间',
    evidence: '状态机自动打标时间，可能因异步事件通知队列延迟而略晚于实际办结时刻。',
    note: '适用于系统状态生命周期审计，非业务视角的实际办结时间基准。'
  },
  {
    id: 'update_time',
    field: 'update_time',
    label: '更新时间',
    semanticType: '审计时间',
    semantics: '记录最后一次发生变更的时间戳',
    evidence: '包含工单备注、满意度回执等流转更新，与办结动作无排他绑定关系。',
    note: '字段语义宽泛，不建议作为办结时间对应。'
  }
];

interface LocalGroundingCorrectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedField: CandidateFieldOption) => void;
  businessObjectName?: string;
  dataImplementationName?: string;
  dataImplementationRole?: string;
  attributeName?: string;
  currentField?: string;
  currentSemantics?: string;
  /** 修正类型：ATTRIBUTE（属性落地，默认）或 RELATIONSHIP（关系落地） */
  mode?: 'ATTRIBUTE' | 'RELATIONSHIP';
  /** 候选字段列表：默认为属性修正候选；关系修正由调用方传入实现字段候选 */
  candidates?: CandidateFieldOption[];
  /** 修正原因：覆盖默认的属性修正叙事 */
  reason?: string;
  /** 关系模式：目标对象名（关系名 → 目标对象 展示用） */
  targetObjectName?: string;
}

export const LocalGroundingCorrectionDrawer: React.FC<LocalGroundingCorrectionDrawerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  businessObjectName = '服务工单',
  dataImplementationName = '客服工单当前视图',
  dataImplementationRole = '主要数据实现',
  attributeName = '办结时间',
  currentField = 'finished_time',
  currentSemantics = '表示服务工单完成处理时间。',
  mode = 'ATTRIBUTE',
  candidates,
  reason,
  targetObjectName
}) => {
  const effectiveCandidates = candidates ?? CANDIDATE_FIELDS;
  const isRelationship = mode === 'RELATIONSHIP';
  const displayTarget = isRelationship ? `${attributeName} → ${targetObjectName ?? ''}` : attributeName;

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    effectiveCandidates[0]?.id ?? 'close_time'
  );

  // 修正目标切换（属性 ↔ 关系）时重置候选选择
  useEffect(() => {
    setSelectedCandidateId((candidates ?? CANDIDATE_FIELDS)[0]?.id ?? 'close_time');
  }, [isOpen, candidates]);

  if (!isOpen) return null;

  const selectedCandidate =
    effectiveCandidates.find((c) => c.id === selectedCandidateId) || effectiveCandidates[0];

  return (
    <div 
      id="local-grounding-correction-overlay"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* DRAWER CONTAINER (580px width) */}
      <div 
        id="local-grounding-correction-drawer"
        className="w-full max-w-[590px] h-full bg-white shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-in slide-in-from-right duration-250 select-none"
      >
        {/* ======================================================= */}
        {/* DRAWER HEADER                                           */}
        {/* ======================================================= */}
        <header 
          id="drawer-header"
          className="px-6 py-4.5 border-b border-[#E2E8F0] bg-[#FAFAFC] shrink-0 space-y-2"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-[#0F172A] tracking-tight">
                  {isRelationship ? '修正关系落地' : '修正属性对应'}
                </h1>
                <span className="text-[11px] font-mono font-medium text-[#64748B] px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                  Local Grounding Correction
                </span>
              </div>
              
              {/* Hierarchy path */}
              <div className="flex items-center space-x-1.5 text-xs text-[#475569] pt-0.5">
                <span className="font-semibold text-[#0F172A]">{businessObjectName}</span>
                <span className="text-[#94A3B8]">↓</span>
                <span className="text-[#334155]">{dataImplementationName}</span>
                <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                  {dataImplementationRole}
                </span>
              </div>
            </div>

            <button
              id="btn-close-drawer"
              onClick={onClose}
              className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
              title="关闭抽屉"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lightweight status indicator */}
          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
              <span>当前对应需要修正</span>
            </div>
            <span className="text-[11px] text-[#94A3B8]">
              仅修正单条{isRelationship ? '关系' : '属性'}映射 · 不影响整体架构
            </span>
          </div>
        </header>

        {/* ======================================================= */}
        {/* DRAWER BODY (SCROLLABLE)                                */}
        {/* ======================================================= */}
        <div 
          id="drawer-scroll-body"
          className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#334155]"
        >
          {/* ===================================================== */}
          {/* 区域 1：当前对应 (CURRENT GROUNDING)                   */}
          {/* ===================================================== */}
          <section id="section-current-grounding" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                当前对应
              </h2>
              <span className="text-[11px] text-[#64748B]">
                状态：<span className="text-[#166534] font-medium">当前有效</span>
              </span>
            </div>

            <div className="p-4 bg-white border border-[#E2E8F0] rounded-md space-y-3 shadow-2xs">
              <div className="grid grid-cols-2 gap-3 pb-2.5 border-b border-[#F1F5F9]">
                <div className="space-y-1">
                  <div className="text-[11px] text-[#64748B]">{isRelationship ? '业务关系' : '业务属性'}</div>
                  <div className="font-bold text-[#0F172A] text-sm flex items-center space-x-1.5">
                    <span>{displayTarget}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-[#64748B]">当前数据实现</div>
                  <div className="font-semibold text-[#0F172A]">{dataImplementationName}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">当前字段</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                    需要修正
                  </span>
                </div>
                <div className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] px-2.5 py-1.5 rounded border border-[#E2E8F0]">
                  {currentField}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-[#64748B]">当前正式解释</div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {currentSemantics}
                </p>
              </div>

              {/* 当前依据 */}
              <div className="pt-2 border-t border-[#F1F5F9] space-y-1.5">
                <div className="text-[11px] text-[#64748B] font-medium">当前依据：</div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-[#475569]">
                  <div className="flex items-center space-x-1">
                    <span className="text-[#2563EB]">·</span>
                    <span>字段名称原推导</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[#2563EB]">·</span>
                    <span>历史确认记录</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[#2563EB]">·</span>
                    <span>历史数据语义</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================== */}
          {/* 区域 2：修正原因 (WHY CORRECTION NEEDED)               */}
          {/* ===================================================== */}
          <section id="section-correction-reason" className="space-y-2.5">
            <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              为什么需要修正
            </h2>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-3">
              <div className="space-y-2 leading-relaxed text-xs">
                <p className="text-[#0F172A]">
                  经过新的数据语义确认：
                </p>
                {reason ? (
                  <div className="p-2.5 bg-white border border-[#E2E8F0] rounded text-xs text-[#475569] leading-relaxed">
                    {reason}
                  </div>
                ) : (
                  <div className="p-2.5 bg-white border border-[#E2E8F0] rounded space-y-1.5 text-xs">
                    <div className="flex items-start space-x-2">
                      <span className="font-mono text-[11px] text-[#B45309] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                        {currentField}
                      </span>
                      <span className="text-[#475569]">
                        实际表示：<strong className="text-[#0F172A]">最后更新时间</strong>，而不是服务工单实际办结时间。
                      </span>
                    </div>
                    <div className="flex items-start space-x-2 pt-1 border-t border-[#F1F5F9]">
                      <span className="font-mono text-[11px] text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                        close_time
                      </span>
                      <span className="text-[#475569]">
                        表示：<strong className="text-[#0F172A]">服务工单完成办理的实际时间</strong>。
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-[#64748B] text-[11px]">
                  因此：原{isRelationship ? '关系' : '属性'}对应不再准确，需对单条 Grounding 实施局部版本更正。
                </p>
              </div>

              {/* 来源事实依据 */}
              <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-2 gap-2 text-[11px] text-[#64748B]">
                <div>
                  <span className="text-[#94A3B8]">来源：</span>
                  <span className="text-[#334155] font-medium">数据语义修订</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">版本：</span>
                  <span className="text-[#334155] font-medium">Data Semantics Revision</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">用户输入：</span>
                  <span className="text-[#334155]">无</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">范围限定：</span>
                  <span className="text-[#334155]">仅当前{isRelationship ? '关系' : '属性'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================== */}
          {/* 区域 3：新的对应 (NEW GROUNDING MAPPING)              */}
          {/* ===================================================== */}
          <section id="section-new-grounding" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                新的对应
              </h2>
              <span className="text-[11px] text-[#2563EB] font-medium">
                当前候选已就绪
              </span>
            </div>

            {/* Core Semantic Mapping Visual Row */}
            <div className="p-3.5 bg-[#EFF6FF]/50 border border-[#BFDBFE] rounded-md flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] text-[#64748B]">{isRelationship ? '业务关系' : '业务属性'}</div>
                <div className="font-bold text-[#0F172A] text-sm">
                  {displayTarget}
                </div>
              </div>

              <div className="flex items-center space-x-1 text-[#2563EB] font-bold px-3">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="space-y-0.5 text-right">
                <div className="text-[11px] text-[#64748B]">新的数据字段</div>
                <div className="font-mono font-bold text-[#2563EB] text-sm">
                  {selectedCandidate.field}
                </div>
              </div>
            </div>

            {/* Selected candidate details card with Semovix Blue border */}
            <div className="p-4 bg-white border-2 border-[#2563EB] rounded-md space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-[#0F172A]">
                    {selectedCandidate.field}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-medium">
                    {selectedCandidate.label}
                  </span>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  候选修正
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#F1F5F9]">
                <div>
                  <span className="text-[#64748B]">语义类型：</span>
                  <span className="text-[#0F172A] font-medium">{selectedCandidate.semanticType}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">业务解释：</span>
                  <span className="text-[#0F172A] font-medium">{selectedCandidate.semantics}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#475569] leading-relaxed pt-1.5 border-t border-[#F8FAFC]">
                {selectedCandidate.evidence}
              </p>
            </div>

            {/* Candidate selection options */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-[#64748B] font-medium">
                可选候选字段列表：
              </div>

              <div className="space-y-1.5">
                {effectiveCandidates.map((candidate) => {
                  const isSelected = candidate.id === selectedCandidateId;
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className={`p-3 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#EFF6FF] border-[#2563EB]'
                          : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="candidate_field"
                            checked={isSelected}
                            onChange={() => setSelectedCandidateId(candidate.id)}
                            className="w-3.5 h-3.5 text-[#2563EB] focus:ring-0 cursor-pointer"
                          />
                          <span className="font-mono text-xs font-semibold text-[#0F172A]">
                            {candidate.field}
                          </span>
                          <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded">
                            {candidate.label}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] text-[#2563EB] font-medium flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>已选定</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] pt-1 pl-5.5 leading-relaxed">
                        {candidate.semantics} · {candidate.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ===================================================== */}
          {/* 区域 4：更新影响 (UPDATE IMPACT)                      */}
          {/* ===================================================== */}
          <section id="section-update-impact" className="space-y-2.5">
            <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              更新影响
            </h2>

            <div className="p-4 bg-white border border-[#E2E8F0] rounded-md space-y-3 shadow-2xs">
              <p className="text-xs text-[#475569]">
                本次操作属于局部对应更正（Local Grounding Correction），范围受到严格隔离：
              </p>

              {/* Plain clean list without numbers/trees */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start space-x-2 text-[#0F172A]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#2563EB]">本次更新：</span>
                    <span>{displayTarget}{isRelationship ? '关系落地' : '属性对应'}（{currentField} → {selectedCandidate.field}）</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[#475569]">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#166534]">保持不变：</span>
                    <span>{businessObjectName}业务定义（业务概念与定义不变）</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[#475569]">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#166534]">保持不变：</span>
                    <span>{dataImplementationName}数据实现（物理表结构不变）</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[#475569]">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#166534]">保持不变：</span>
                    <span>
                      {isRelationship
                        ? '全部属性对应（属性映射不受关系修正影响）'
                        : '其他属性对应（工单编号、处理状态等 6 项不变）'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[#475569]">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#166534]">保持不变：</span>
                    <span>
                      {isRelationship
                        ? '其他核心关系对应（承办部门、所属区域等关系不变）'
                        : '核心关系对应（申请人、承办部门等 3 项不变）'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[#475569] pt-1 border-t border-[#F1F5F9]">
                  <Info className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#B45309]">可能影响：</span>
                    <span>办结率指标（相关依赖指标将标记自动基于新对应字段计算）</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================== */}
          {/* 区域 5：版本变化预览 (VERSION PREVIEW)                 */}
          {/* ===================================================== */}
          <section id="section-version-preview" className="space-y-2.5">
            <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              即将形成新的对应版本
            </h2>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-3">
              {/* Lightweight Before / After */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E2E8F0] rounded space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Before (当前)</span>
                    <span className="text-[10px] text-[#94A3B8]">Revision 1</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-[#475569] font-medium">{displayTarget}</div>
                    <div className="text-[#94A3B8] text-[11px]">↓</div>
                    <div className="font-mono text-[#64748B] line-through">
                      {currentField}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#94A3B8] pt-1">
                    有效：2026-01-01 ~ 2026-09-08
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#BFDBFE] rounded space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#2563EB]">
                    <span className="font-semibold">After (新版本)</span>
                    <span className="text-[10px] bg-[#EFF6FF] px-1 py-0.2 rounded text-[#2563EB] font-medium">Revision 2</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-[#0F172A] font-semibold">{displayTarget}</div>
                    <div className="text-[#2563EB] text-[11px]">↓</div>
                    <div className="font-mono text-[#2563EB] font-bold">
                      {selectedCandidate.field}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#166534] pt-1 font-medium">
                    当前有效：2026-09-08 起生效
                  </div>
                </div>
              </div>

              {/* 说明 */}
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                历史对应仍保留在版本审计链中。新的对应从确认时间开始正式生效。
              </p>
            </div>
          </section>
        </div>

        {/* ======================================================= */}
        {/* FIXED BOTTOM ACTION BAR                                 */}
        {/* ======================================================= */}
        <footer 
          id="drawer-footer"
          className="px-6 py-4 bg-white border-t border-[#E2E8F0] shrink-0 flex items-center justify-between gap-4 select-none"
        >
          <div className="text-[11px] text-[#64748B]">
            确认后将生成新的 Grounding Revision。
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="btn-cancel-correction"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] text-xs font-medium rounded transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              id="btn-confirm-correction"
              onClick={() => onConfirm(selectedCandidate)}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
            >
              确认修正对应
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
