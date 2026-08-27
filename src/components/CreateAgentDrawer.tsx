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
  Bot,
  BookOpen,
  BarChart3,
  Check
} from 'lucide-react';

export interface AgentTemplateDefinition {
  id: string;
  name: string;
  kind: string;
  desc: string;
  defaultName: string;
  defaultResponsibility: string;
  defaultOwner: string;
  runtimeTarget: 'WEKNORA' | 'SEMOVIX_NATIVE';
  runtimeEngineLabel: string;
  supportedTasks: string[];
  capabilityPreset: string;
  defaultMaxAutonomy: string;
  defaultModelPolicy: string;
  icon: 'knowledge' | 'data' | 'governance';
}

export const V11_AGENT_TEMPLATES: AgentTemplateDefinition[] = [
  {
    id: 'enterprise_knowledge',
    name: '企业知识伙伴',
    kind: '受管智能体',
    desc: '用于企业知识问答、跨文档研究与 Wiki 研究，默认使用 WeKnora 作为知识运行引擎。',
    defaultName: '企业知识伙伴',
    defaultResponsibility: '基于企业正式知识回答问题、开展跨文档与 Wiki 研究，并提供可追溯的知识依据。',
    defaultOwner: '企业知识治理组',
    runtimeTarget: 'WEKNORA',
    runtimeEngineLabel: 'WeKnora',
    supportedTasks: ['知识问答', '文档研究', 'Wiki 研究'],
    capabilityPreset: '精准知识问答',
    defaultMaxAutonomy: '建议 (SUGGEST)',
    defaultModelPolicy: '质量优先',
    icon: 'knowledge'
  },
  {
    id: 'data_intelligence',
    name: '数据智能分析助手',
    kind: '受管智能体',
    desc: '基于语义模型与指标中台进行多维指标查询、维度下钻、异动根因归因与图表生成。',
    defaultName: '数据智能分析助手',
    defaultResponsibility: '解析业务口径与指标语义，执行安全的多维计算与下钻分析，保障数据一致性。',
    defaultOwner: '数据架构与语义组',
    runtimeTarget: 'SEMOVIX_NATIVE',
    runtimeEngineLabel: 'Semovix Native',
    supportedTasks: ['指标查询', '多维下钻', '根因归因'],
    capabilityPreset: '指标计算与归因',
    defaultMaxAutonomy: '建议 (SUGGEST)',
    defaultModelPolicy: '均衡',
    icon: 'data'
  },
  {
    id: 'semantic_governance',
    name: '语义治理助手',
    kind: '受管智能体',
    desc: '自动化数据标准比对、字段命名规范性审查与业务对象语义映射建议。',
    defaultName: '语义治理助手',
    defaultResponsibility: '扫描未决治理资产，识别标准冲突与命名歧义，生成结构化治理提案。',
    defaultOwner: '数据架构与语义组',
    runtimeTarget: 'SEMOVIX_NATIVE',
    runtimeEngineLabel: 'Semovix Native',
    supportedTasks: ['标准对齐审查', '映射冲突仲裁', '业务对象绑定'],
    capabilityPreset: '语义合规审查',
    defaultMaxAutonomy: '提议 (PROPOSE)',
    defaultModelPolicy: '均衡',
    icon: 'governance'
  }
];

interface CreateAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAndConfigure: (agentData: {
    name: string;
    responsibility: string;
    owner: string;
    templateId: string;
    runtimeTarget: string;
  }) => void;
  onPrevStep?: () => void;
  onChangeTemplate?: () => void;
}

export const CreateAgentDrawer: React.FC<CreateAgentDrawerProps> = ({
  isOpen,
  onClose,
  onCreateAndConfigure
}) => {
  // Step state: 1 = 选择模板, 2 = 基本定义 (Defaults to 2 for Enterprise Knowledge)
  const [currentStep, setCurrentStep] = useState<1 | 2>(2);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('enterprise_knowledge');

  const selectedTemplate = V11_AGENT_TEMPLATES.find((t) => t.id === selectedTemplateId) || V11_AGENT_TEMPLATES[0];

  // Form State
  const [name, setName] = useState(selectedTemplate.defaultName);
  const [responsibility, setResponsibility] = useState(selectedTemplate.defaultResponsibility);
  const [owner, setOwner] = useState(selectedTemplate.defaultOwner);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);

  const ownerOptions = [
    '企业知识治理组',
    '数据架构与语义组',
    '人力资源运营中心',
    '客户体验与服务保障部',
    '法务合规中心'
  ];

  if (!isOpen) return null;

  const handleSelectTemplate = (template: AgentTemplateDefinition) => {
    setSelectedTemplateId(template.id);
    setName(template.defaultName);
    setResponsibility(template.defaultResponsibility);
    setOwner(template.defaultOwner);
    setCurrentStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !responsibility.trim() || !owner.trim()) return;
    onCreateAndConfigure({
      name: name.trim(),
      responsibility: responsibility.trim(),
      owner: owner.trim(),
      templateId: selectedTemplate.id,
      runtimeTarget: selectedTemplate.runtimeTarget
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
                A02 · Create Managed Agent
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
            {/* Step 1: 选择模板 */}
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-1.5 cursor-pointer transition-colors ${
                currentStep === 1
                  ? 'text-[#2563EB] font-bold'
                  : 'text-[#16A36A] hover:text-[#15803D]'
              }`}
            >
              {currentStep === 2 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              )}
              <span>选择模板</span>
            </button>

            <span className="text-[#CBD5E1]">→</span>

            {/* Step 2: 基本定义 */}
            <div
              className={`flex items-center space-x-1.5 ${
                currentStep === 2 ? 'text-[#2563EB] font-bold' : 'text-[#94A3B8]'
              }`}
            >
              {currentStep === 2 && <span className="w-2 h-2 rounded-full bg-[#2563EB]" />}
              <span>基本定义</span>
            </div>
          </div>

          {/* Action: 更换模板 or 下一步 */}
          {currentStep === 2 ? (
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-[#64748B] hover:text-[#2563EB] flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>更换模板</span>
            </button>
          ) : (
            <span className="text-[11px] text-[#94A3B8]">
              选择受控模板后进入基本定义
            </span>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────
            3. MAIN BODY (Step 1: Template Selection OR Step 2: Basic Definition Form)
        ───────────────────────────────────────────────────────── */}
        {currentStep === 1 ? (
          /* STEP 1: CHOOSE TEMPLATE */
          <div className="flex-1 overflow-y-auto p-7 bg-[#F8FAFC] space-y-4">
            <div>
              <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">
                选择受控智能体模板
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Semovix 平台提供 3 项标准化业务模板，已预置适用的任务边界与运行引擎映射。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 text-xs">
              {V11_AGENT_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white space-y-3 relative ${
                      isSelected
                        ? 'border-[#2563EB] ring-1 ring-[#2563EB] shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            tmpl.icon === 'knowledge'
                              ? 'bg-amber-50 border border-amber-200 text-amber-600'
                              : tmpl.icon === 'data'
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                              : 'bg-purple-50 border border-purple-200 text-purple-600'
                          }`}
                        >
                          {tmpl.icon === 'knowledge' && <BookOpen className="w-4 h-4" />}
                          {tmpl.icon === 'data' && <BarChart3 className="w-4 h-4" />}
                          {tmpl.icon === 'governance' && <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-[#0F172A]">
                              {tmpl.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200/60 font-medium">
                              {tmpl.kind}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-[#475569] border border-slate-200 font-mono">
                              {tmpl.runtimeEngineLabel}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] leading-relaxed">
                            {tmpl.desc}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                      <div className="flex items-center space-x-3">
                        <span>支持任务：<strong className="text-[#0F172A]">{tmpl.supportedTasks.join(' · ')}</strong></span>
                        <span>能力：<strong className="text-[#0F172A]">{tmpl.capabilityPreset}</strong></span>
                      </div>
                      <span className="text-[#2563EB] font-semibold flex items-center space-x-1">
                        <span>选用此模板</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* STEP 2: BASIC DEFINITION (Left Form 65% + Right Summary 35%) */
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row bg-[#F8FAFC] divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
            {/* ─────────────────────────────────────────────────────
                LEFT COLUMN: BASIC DEFINITION FORM (~65%)
            ───────────────────────────────────────────────────── */}
            <div className="flex-1 p-7 bg-white space-y-5">
              {/* Template Context Banner */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-[#64748B]">当前模板：</span>
                    <span className="font-bold text-xs text-[#0F172A]">{selectedTemplate.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200/60">
                      {selectedTemplate.kind}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-[#475569] border border-slate-200">
                      {selectedTemplate.runtimeEngineLabel}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  {selectedTemplate.desc}
                </p>
              </div>

              {/* Form Section Header */}
              <div>
                <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">
                  基本定义
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  填写智能体的基础业务身份。任务绑定、上下文范围和运行配置将在创建后在定义工作区继续配置。
                </p>
              </div>

              {/* Form Fields Container */}
              <form id="create-agent-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Field 1: 智能体名称 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#0F172A]">
                      智能体名称 <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#94A3B8] font-mono">
                      {name.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="输入智能体名称..."
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
                  />
                  <p className="text-[11px] text-[#64748B]">
                    在平台智能体中心识别该智能体的主名称。
                  </p>
                </div>

                {/* Field 2: 主要职责 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#0F172A]">
                      主要职责 <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#94A3B8] font-mono">
                      {responsibility.length}/500
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    maxLength={500}
                    value={responsibility}
                    onChange={(e) => setResponsibility(e.target.value)}
                    placeholder="简述该智能体负责的业务范围与核心目标..."
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-[#64748B]">
                    定义业务职责摘要。详细的角色指令和原则可在创建后完善。
                  </p>
                </div>

                {/* Field 3: Owner */}
                <div className="space-y-1.5 relative">
                  <label className="font-semibold text-[#0F172A]">
                    Owner <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#0F172A] flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                      <span className="font-medium">{owner}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>

                  {isOwnerDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-30 py-1 divide-y divide-[#F1F5F9]">
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
                    由“{selectedTemplate.name}”模板提供，创建后可继续调整。
                  </p>
                </div>

                {/* Definition List of Initial Settings */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-3 text-xs shadow-2xs">
                  {/* 模板 */}
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-[#64748B] block">模板</span>
                    <span className="font-bold text-[#0F172A] block">{selectedTemplate.name}</span>
                  </div>

                  {/* 类型 */}
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-[#64748B] block">类型</span>
                    <span className="font-medium text-[#0F172A] block">{selectedTemplate.kind}</span>
                  </div>

                  {/* 支持任务 */}
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-[#64748B] block">支持任务</span>
                    <span className="font-bold text-[#0F172A] block">{selectedTemplate.supportedTasks.length} 项</span>
                    <span className="text-[10px] text-[#94A3B8] block">
                      {selectedTemplate.supportedTasks.join(' · ')}
                    </span>
                  </div>

                  {/* 能力模式 */}
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-[#64748B] block">能力模式</span>
                    <span className="font-semibold text-[#0F172A] block">{selectedTemplate.capabilityPreset}</span>
                  </div>

                  {/* 最大自主程度 */}
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-[#64748B] block">最大自主程度</span>
                    <span className="font-medium text-[#0F172A] block">{selectedTemplate.defaultMaxAutonomy}</span>
                  </div>

                  {/* 目标运行引擎 */}
                  <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                    <span className="text-[11px] text-[#64748B] block">目标运行引擎</span>
                    <span className="font-bold text-xs text-[#0F172A] block">{selectedTemplate.runtimeEngineLabel}</span>
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
        )}

        {/* ─────────────────────────────────────────────────────────
            4. DRAWER FOOTER ACTIONS
        ───────────────────────────────────────────────────────── */}
        <div className="px-7 py-4 bg-white border-t border-[#E2E8F0] flex items-center justify-between shrink-0 shadow-2xs">
          {/* Left: 上一步 / 关闭 */}
          {currentStep === 2 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>更换模板</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1] rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              取消
            </button>
          )}

          {/* Right: 下一步 / 创建并继续配置 */}
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <span>下一步：基本定义</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              form="create-agent-form"
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <span>创建并继续配置</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
