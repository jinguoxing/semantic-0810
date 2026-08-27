import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Building2,
  ChevronDown,
  Info,
  Layers,
  Sparkles,
  Cpu,
  ArrowLeft,
  ArrowRight,
  Shield,
  Bot
} from 'lucide-react';

interface CreateAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAndConfigure: (agentData: {
    name: string;
    responsibility: string;
    owner: string;
  }) => void;
  onPrevStep?: () => void;
  onChangeTemplate?: () => void;
}

export const CreateAgentDrawer: React.FC<CreateAgentDrawerProps> = ({
  isOpen,
  onClose,
  onCreateAndConfigure,
  onPrevStep,
  onChangeTemplate
}) => {
  // Form State (Default initialized to "企业知识伙伴" template values)
  const [name, setName] = useState('企业知识伙伴');
  const [responsibility, setResponsibility] = useState(
    '基于企业正式知识回答问题、开展跨文档与 Wiki 研究，并提供可追溯的知识依据。'
  );
  const [owner, setOwner] = useState('企业知识治理组');
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);

  const ownerOptions = [
    '企业知识治理组',
    '数据架构与语义组',
    '人力资源运营中心',
    '客户体验与服务保障部',
    '法务合规中心'
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !responsibility.trim() || !owner.trim()) return;
    onCreateAndConfigure({
      name: name.trim(),
      responsibility: responsibility.trim(),
      owner: owner.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Semi-transparent Backdrop: Preserves visibility of the underlying Agent Registry */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* ─────────────────────────────────────────────────────────────
          RIGHT CREATE DRAWER (860–920px width)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[890px] bg-white h-full shadow-2xl border-l border-[#CBD5E1] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* ─────────────────────────────────────────────────────────
            1. DRAWER HEADER
        ───────────────────────────────────────────────────────── */}
        <div className="px-7 py-4.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-base text-[#0F172A] tracking-tight">
                创建智能体
              </h2>
              <span className="text-[10px] font-mono font-medium text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-1.5 py-0.5 rounded">
                Create Managed Agent
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
              从平台受控模板创建一个智能体草稿，创建后可继续完善任务、上下文、能力与运行配置。
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────
            2. STAGE INDICATOR (阶段指示器)
        ───────────────────────────────────────────────────────── */}
        <div className="px-7 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-3">
            {/* Step 1: 选择模板 (Completed) */}
            <div className="flex items-center space-x-1.5 text-[#16A36A]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
              <span className="font-medium">选择模板</span>
            </div>

            <span className="text-[#CBD5E1]">→</span>

            {/* Step 2: 基本定义 (Current Active) */}
            <div className="flex items-center space-x-1.5 text-[#2563EB]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="font-bold">基本定义</span>
            </div>
          </div>

          {/* Action: 更换模板 */}
          <button
            onClick={() => {
              if (onChangeTemplate) {
                onChangeTemplate();
              } else if (onPrevStep) {
                onPrevStep();
              }
            }}
            className="text-xs text-[#64748B] hover:text-[#2563EB] flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>更换模板</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────
            3. MAIN BODY (Split: Left Form 65% + Right Summary 35%)
        ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row bg-[#F8FAFC] divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
          {/* ─────────────────────────────────────────────────────
              LEFT COLUMN: BASIC DEFINITION FORM (~65%)
          ───────────────────────────────────────────────────── */}
          <div className="flex-1 p-7 bg-white space-y-5">
            {/* Template Context Banner (模板上下文提示) */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-[#64748B]">当前模板：</span>
                  <span className="font-bold text-xs text-[#0F172A]">企业知识伙伴</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200/60">
                    受管智能体
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-[#475569] border border-slate-200">
                    WeKnora
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                用于企业知识问答、跨文档研究与 Wiki 研究，默认使用 WeKnora 作为知识运行引擎。
              </p>
            </div>

            {/* Form Section Header */}
            <div>
              <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">
                基本定义
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                先填写这个智能体最基本的业务身份。任务、知识范围和运行能力将在创建后继续配置。
              </p>
            </div>

            {/* Form Fields Container */}
            <form id="create-agent-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Field 1: 智能体名称 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="agent-name" className="font-semibold text-[#0F172A]">
                    智能体名称 <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#94A3B8] font-mono">
                    {name.length} / 30
                  </span>
                </div>
                <input
                  id="agent-name"
                  type="text"
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：人力资源知识伙伴"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all shadow-2xs"
                  required
                />
                <p className="text-[11px] text-[#64748B]">
                  用于智能体中心、任务记录与运行审计中的识别。
                </p>
              </div>

              {/* Field 2: 主要职责 */}
              <div className="space-y-1.5">
                <label htmlFor="agent-responsibility" className="font-semibold text-[#0F172A] block">
                  主要职责 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="agent-responsibility"
                  rows={3}
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value)}
                  placeholder="用一句话描述这个智能体主要帮助用户完成什么。"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#0F172A] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all shadow-2xs resize-none"
                  required
                />
                <p className="text-[11px] text-[#64748B]">
                  这里只定义业务职责摘要，详细角色说明可在创建后继续完善。
                </p>
              </div>

              {/* Field 3: Owner */}
              <div className="space-y-1.5 relative">
                <label className="font-semibold text-[#0F172A] block">
                  Owner <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#0F172A] flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all shadow-2xs cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <span className="font-medium text-[#0F172A] truncate">{owner}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 ml-2" />
                </button>

                {isOwnerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-md shadow-lg z-20 py-1 max-h-48 overflow-y-auto">
                    {ownerOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setOwner(opt);
                          setIsOwnerDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-xs text-left flex items-center space-x-2 transition-colors cursor-pointer ${
                          owner === opt
                            ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                            : 'text-[#334155] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <Building2 className="w-3 h-3 text-[#94A3B8]" />
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-[#64748B]">
                  Owner 负责该智能体的配置、测试和正式版本管理。
                </p>
              </div>
            </form>

            {/* Bottom Info Banner */}
            <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg flex items-start space-x-2 text-[11px] text-[#475569]">
              <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                创建后只会生成一个未发布草稿，不会立即创建正式版本或影响当前运行环境。
              </p>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────
              RIGHT COLUMN: INITIAL SUMMARY SURFACE (~35%)
          ───────────────────────────────────────────────────── */}
          <div className="w-full md:w-[320px] p-6 bg-[#F8FAFC] flex flex-col justify-between shrink-0 space-y-6">
            <div className="space-y-4">
              {/* Summary Surface Header */}
              <div>
                <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">
                  初始配置
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  由“企业知识伙伴”模板提供，创建后可继续调整。
                </p>
              </div>

              {/* Definition List of Initial Settings */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-3 text-xs shadow-2xs">
                {/* 模板 */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#64748B] block">模板</span>
                  <span className="font-bold text-[#0F172A] block">企业知识伙伴</span>
                </div>

                {/* 类型 */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#64748B] block">类型</span>
                  <span className="font-medium text-[#0F172A] block">受管智能体</span>
                </div>

                {/* 支持任务 */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#64748B] block">支持任务</span>
                  <span className="font-bold text-[#0F172A] block">3 项</span>
                  <span className="text-[10px] text-[#94A3B8] block">
                    知识问答 · 文档研究 · Wiki 研究
                  </span>
                </div>

                {/* 能力模式 */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#64748B] block">能力模式</span>
                  <span className="font-semibold text-[#0F172A] block">精准知识问答</span>
                </div>

                {/* 最大自主程度 */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#64748B] block">最大自主程度</span>
                  <span className="font-medium text-[#0F172A] block">建议</span>
                </div>

                {/* 目标运行引擎 */}
                <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                  <span className="text-[11px] text-[#64748B] block">目标运行引擎</span>
                  <span className="font-bold text-xs text-[#0F172A] block">WeKnora</span>
                  <p className="text-[10px] text-[#64748B] leading-tight">
                    正式运行配置将在测试与发布阶段创建。
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Clarification Block (浅蓝信息提示) */}
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[11px] text-[#1E40AF] leading-relaxed">
              以上是模板提供的初始定义。创建草稿后，可以在“智能体定义”工作区继续调整支持任务、上下文来源、能力、模型策略与自主程度。
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            4. DRAWER FOOTER ACTIONS
        ───────────────────────────────────────────────────────── */}
        <div className="px-7 py-4 bg-white border-t border-[#E2E8F0] flex items-center justify-between shrink-0 shadow-2xs">
          {/* Left: 上一步 */}
          <button
            type="button"
            onClick={onPrevStep || onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>上一步</span>
          </button>

          {/* Right: 创建并继续配置 (Blue Primary Action) */}
          <button
            type="submit"
            form="create-agent-form"
            className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <span>创建并继续配置</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
