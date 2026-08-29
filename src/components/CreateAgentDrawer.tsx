import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Building2,
  ChevronDown,
  Info,
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  Network,
  BookOpen
} from 'lucide-react';
import {
  PRESET_LIST,
  ManagedAgentPreset,
  getPresetById,
  MANAGED_AGENT_PRESETS,
  getTaskTemplateView,
  AgentContextBinding,
  ContextSelectionMode
} from '../domain/agent';
import {
  TemplateScopeConfig,
  getTemplateScopeConfig,
  buildScopeContextBinding
} from '../data/agentScopeOptions';

export interface AgentTemplateDefinition {
  id: string;
  presetId: string;
  name: string;
  tag: string;
  desc: string;
  selectionSummary: string;
  defaultName: string;
  defaultResponsibility: string;
  defaultOwner: string;
  /** 内部数据：随创建传给 Domain (runtimeTarget 保留在 Domain，不在创建 UI 展示) */
  runtimeTarget: 'WEKNORA' | 'SEMOVIX_NATIVE';
  /** 展示标签投影：真实数据为 preset.supportedTaskTemplates (TaskTemplateBinding[]) */
  supportedTaskLabels: string[];
  supportedTaskTemplateIds: string[];
  /** V1.1 §18 自治产品语言：只展示行为结果，不展示底层 enum */
  behaviorLabel: string;
  /** V1.1 Stage 2 工作范围区块配置（按能力模板动态变化） */
  scopeConfig: TemplateScopeConfig;
  capabilityPreset: string;
  capabilityPresetDesc: string;
  defaultMaxAutonomy: string;
  autonomyDesc: string;
  symbolType: 'data' | 'governance' | 'knowledge';
}

/**
 * V1.1 §18 自治产品语言映射（用户行为结果）：
 * SUGGEST → 提供答案与建议 / PROPOSE → 生成待确认方案 / EXECUTE_WITHIN_POLICY → 可在授权范围内执行
 */
function behaviorLabelFor(preset: ManagedAgentPreset): string {
  if (preset.defaultMaxAutonomy === 'EXECUTE_WITHIN_POLICY') return '可在授权范围内执行';
  if (preset.defaultMaxAutonomy === 'PROPOSE') return '生成待确认的治理方案';
  return preset.presetId === 'ENTERPRISE_KNOWLEDGE'
    ? '提供答案与建议，并给出可追溯依据'
    : '提供数据结果、分析方案与解释';
}

/** Stage 1 展示前 3 个任务，+N 由真实任务数动态计算 */
const STAGE1_SHOWN_TASKS = 3;

export const V11_AGENT_TEMPLATES: AgentTemplateDefinition[] = PRESET_LIST.map((preset) => ({
  id: preset.presetId.toLowerCase(),
  presetId: preset.presetId,
  name: preset.presetName,
  tag: preset.categoryTag,
  desc: preset.description,
  selectionSummary: preset.selectionSummary,
  defaultName: preset.defaultName,
  defaultResponsibility: preset.defaultResponsibility,
  defaultOwner: preset.defaultOwner,
  runtimeTarget: preset.runtimeTarget,
  supportedTaskLabels: preset.supportedTaskTemplates.map(
    (binding) => getTaskTemplateView(binding.taskTemplateId).name
  ),
  supportedTaskTemplateIds: preset.supportedTaskTemplates.map((binding) => binding.taskTemplateId),
  behaviorLabel: behaviorLabelFor(preset),
  scopeConfig: getTemplateScopeConfig(preset.presetId),
  capabilityPreset: preset.capabilityPreset,
  capabilityPresetDesc: preset.capabilityPresetDesc,
  defaultMaxAutonomy:
    preset.defaultMaxAutonomy === 'SUGGEST'
      ? '建议'
      : preset.defaultMaxAutonomy === 'PROPOSE'
      ? '提议'
      : '策略内执行',
  autonomyDesc: preset.autonomyDesc,
  symbolType: preset.symbolType
}));

interface CreateAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAndConfigure: (agentData: {
    name: string;
    responsibility: string;
    owner: string;
    templateId: string;
    runtimeTarget: string;
    /** V1.1 工作范围：A02 正常创建路径始终显式传入当前 UI Binding */
    contextBindings: AgentContextBinding[];
  }) => void;
  initialStep?: 1 | 2;
  initialTemplateId?: string | null;
}

export const CreateAgentDrawer: React.FC<CreateAgentDrawerProps> = ({
  isOpen,
  onClose,
  onCreateAndConfigure,
  initialStep = 1,
  initialTemplateId = null
}) => {
  // Stage state: 1 = 选择能力模板, 2 = 定义用途与工作范围
  const [currentStep, setCurrentStep] = useState<1 | 2>(initialStep);

  // Template selection state: null by default (unselected), require explicit selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialTemplateId ?? null);

  const selectedTemplate = selectedTemplateId
    ? V11_AGENT_TEMPLATES.find((t) => t.id === selectedTemplateId || t.presetId === selectedTemplateId) || null
    : null;

  // Stage 2 Form State
  const [name, setName] = useState(selectedTemplate ? selectedTemplate.defaultName : '');
  const [responsibility, setResponsibility] = useState(
    selectedTemplate ? selectedTemplate.defaultResponsibility : ''
  );
  const [owner, setOwner] = useState(selectedTemplate ? selectedTemplate.defaultOwner : '');
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);

  // V1.1 工作范围状态：三个模板默认 ALL_ALLOWED（Quick Start），
  // 需要限定范围时才切换 SELECTED（Enterprise Scope Control）
  const [scopeMode, setScopeMode] = useState<ContextSelectionMode>('ALL_ALLOWED');
  const [scopeResourceIds, setScopeResourceIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep);
      setSelectedTemplateId(initialTemplateId ?? null);
      setScopeMode('ALL_ALLOWED');
      setScopeResourceIds([]);
      if (initialTemplateId) {
        const found = V11_AGENT_TEMPLATES.find((t) => t.id === initialTemplateId || t.presetId === initialTemplateId);
        if (found) {
          setName(found.defaultName);
          setResponsibility(found.defaultResponsibility);
          setOwner(found.defaultOwner);
        }
      } else {
        setName('');
        setResponsibility('');
        setOwner('');
      }
    }
  }, [isOpen, initialStep, initialTemplateId]);

  const ownerOptions = [
    '企业知识治理组',
    '数据架构与语义组',
    '数据智能团队',
    '语义治理团队',
    '人力资源运营中心',
    '法务合规中心'
  ];

  if (!isOpen) return null;

  const handleSelectTemplate = (template: AgentTemplateDefinition) => {
    setSelectedTemplateId(template.id);
    setName(template.defaultName);
    setResponsibility(template.defaultResponsibility);
    setOwner(template.defaultOwner);
    // 切换模板后工作范围回到默认 ALL_ALLOWED
    setScopeMode('ALL_ALLOWED');
    setScopeResourceIds([]);
  };

  const toggleScopeResource = (resourceId: string) => {
    setScopeResourceIds((prev) =>
      prev.includes(resourceId) ? prev.filter((id) => id !== resourceId) : [...prev, resourceId]
    );
  };

  const handleGoToBasicDefinition = () => {
    if (!selectedTemplate) return;
    if (!name) setName(selectedTemplate.defaultName);
    if (!responsibility) setResponsibility(selectedTemplate.defaultResponsibility);
    if (!owner) setOwner(selectedTemplate.defaultOwner);
    setCurrentStep(2);
  };

  // V1.1 SELECTED 校验：指定范围必须至少选择一个 resourceId，否则 Create CTA disabled
  const isScopeIncomplete =
    selectedTemplate !== null && scopeMode === 'SELECTED' && scopeResourceIds.length === 0;

  // 右栏工作范围摘要（动态跟随当前选择）
  const scopeSummary = selectedTemplate
    ? scopeMode === 'ALL_ALLOWED'
      ? selectedTemplate.scopeConfig.allAllowedLabel
      : scopeResourceIds
          .map((id) => selectedTemplate.scopeConfig.options.find((o) => o.resourceId === id)?.name ?? id)
          .join(' · ')
    : '';

  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    if (!name.trim() || !responsibility.trim() || !owner.trim()) return;
    if (isScopeIncomplete) return;
    onCreateAndConfigure({
      name: name.trim(),
      responsibility: responsibility.trim(),
      owner: owner.trim(),
      templateId: selectedTemplate.id,
      runtimeTarget: selectedTemplate.runtimeTarget,
      contextBindings: [
        buildScopeContextBinding(selectedTemplate.scopeConfig, scopeMode, scopeResourceIds)
      ]
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* ─────────────────────────────────────────────────────────────
          SEMI-TRANSPARENT BACKDROP OVERLAY
          Preserves subtle visibility of the underlying Agent Registry:
          数据查找与分析, 企业知识问答与研究, 语义治理与审查
      ───────────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* ─────────────────────────────────────────────────────────────
          RIGHT CREATE DRAWER (880–940px width: max-w-[920px])
      ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[920px] bg-white h-full shadow-2xl border-l border-[#CBD5E1] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* ─────────────────────────────────────────────────────────
            1. DRAWER HEADER (六、Drawer Header)
        ───────────────────────────────────────────────────────── */}
        <div className="px-8 py-5 border-b border-[#E2E8F0] bg-white flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <h2 className="font-bold text-base text-[#0F172A] tracking-tight">
              创建自定义智能体
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-[760px]">
              选择一个能力模板作为起点，并定义该智能体的业务用途与工作范围。创建后先生成未发布草稿，通过测试与发布后才会正式生效。
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer shrink-0"
            title="关闭"
            aria-label="关闭抽屉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────
            2. STAGE INDICATOR (七、阶段指示器)
            No 01/02 numbers, no large Stepper, only text, fine line, status dots
        ───────────────────────────────────────────────────────── */}
        <div className="px-8 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-3">
            {/* Step 1: 选择能力模板 */}
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-1.5 transition-colors cursor-pointer ${
                currentStep === 1
                  ? 'text-[#2563EB] font-semibold'
                  : 'text-[#16A36A] hover:text-[#15803D]'
              }`}
            >
              {currentStep === 2 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              )}
              <span>选择能力模板</span>
            </button>

            <span className="text-[#CBD5E1] text-xs">→</span>

            {/* Step 2: 定义用途与工作范围 */}
            <div
              className={`flex items-center space-x-1.5 ${
                currentStep === 2 ? 'text-[#2563EB] font-semibold' : 'text-[#94A3B8]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  currentStep === 2 ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
                }`}
              />
              <span>定义用途与工作范围</span>
            </div>
          </div>

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
              当前阶段：选择能力模板
            </span>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────
            3. DRAWER BODY
            Stage 1: 选择模板 (Selection Rows + Selected Preset Summary)
            Stage 2: 定义用途与工作范围 (Basic Info + Work Scope)
        ───────────────────────────────────────────────────────── */}
        {currentStep === 1 ? (
          <div className="flex-1 overflow-y-auto px-8 py-6 bg-white space-y-6">
            {/* ─────────────────────────────────────────────────────
                八、选择区顶部说明 (Selection Intro)
            ───────────────────────────────────────────────────── */}
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#0F172A] tracking-tight">
                选择能力模板
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                根据主要职责选择一个起点。模板提供经过平台验证的初始能力边界，创建后可在模板允许范围内继续调整。
              </p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                一个智能体可以承担多项正式任务，不需要为每个功能单独创建 Agent。
              </p>
            </div>

            {/* ─────────────────────────────────────────────────────
                九 ~ 十四、能力模板选择列表 (3 Selection Rows)
                Height ~150–165px each, crisp enterprise layout
            ───────────────────────────────────────────────────── */}
            <div className="space-y-3">
              {V11_AGENT_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-4.5 rounded-lg border transition-all cursor-pointer relative min-h-[145px] flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#F0F7FF] border-[#2563EB] ring-1 ring-[#2563EB]/40 shadow-2xs'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#FAFAFC]'
                    }`}
                  >
                    {/* Top Row: Symbol + Title & Tag + Radio */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3.5 min-w-0">
                        {/* Enterprise Agent Symbol (Calm, abstract geometric symbol) */}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                            tmpl.symbolType === 'data'
                              ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                              : tmpl.symbolType === 'governance'
                              ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                              : isSelected
                              ? 'bg-blue-50/80 border-blue-200 text-[#2563EB]'
                              : 'bg-slate-50 border-slate-200/80 text-slate-700'
                          }`}
                        >
                          {tmpl.symbolType === 'data' && <Database className="w-4.5 h-4.5" />}
                          {tmpl.symbolType === 'governance' && <Network className="w-4.5 h-4.5" />}
                          {tmpl.symbolType === 'knowledge' && <BookOpen className="w-4.5 h-4.5" />}
                        </div>

                        {/* Title, Weak Tag, Description */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-bold text-sm text-[#0F172A] tracking-tight">
                              {tmpl.name}
                            </span>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                                isSelected
                                  ? 'bg-blue-50 text-[#2563EB] border-blue-200/70'
                                  : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'
                              }`}
                            >
                              {tmpl.tag}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] leading-relaxed">
                            {tmpl.desc}
                          </p>
                        </div>
                      </div>

                      {/* Right Radio Indicator */}
                      <div className="shrink-0 pt-0.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#2563EB] border-2 border-[#2563EB] text-white shadow-2xs'
                              : 'border-2 border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Supported Task Chips (Muted gray/subtle blue, <= 3 chips) */}
                    <div className="pt-2 flex items-center space-x-1.5 flex-wrap">
                      <span className="text-[11px] text-[#64748B] mr-1">支持任务：</span>
                      {tmpl.supportedTaskLabels.slice(0, STAGE1_SHOWN_TASKS).map((taskName) => (
                        <span
                          key={taskName}
                          className="text-xs px-2.5 py-0.5 rounded bg-white text-[#334155] border border-[#CBD5E1]/80 font-medium"
                        >
                          {taskName}
                        </span>
                      ))}
                      {tmpl.supportedTaskLabels.length - STAGE1_SHOWN_TASKS > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] font-medium font-mono">
                          +{tmpl.supportedTaskLabels.length - STAGE1_SHOWN_TASKS}
                        </span>
                      )}
                    </div>

                    {/* Bottom Metadata: 默认行为（用户行为结果，不展示底层自治 enum / 运行引擎） */}
                    <div className="pt-2 border-t border-[#E2E8F0]/70 flex items-center justify-between text-xs text-[#64748B]">
                      <div className="flex items-center space-x-3">
                        <span>
                          默认行为：<strong className="text-[#0F172A] font-semibold">{tmpl.behaviorLabel}</strong>
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="text-[11px] text-[#2563EB] font-semibold flex items-center space-x-1">
                          <span>已选中</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] group-hover:text-[#475569]">
                          点击选择此模板
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ─────────────────────────────────────────────────────
                十五、Selected Preset Summary (已选择)
                Clean enterprise surface underneath the 3 selection rows
            ───────────────────────────────────────────────────── */}
            {selectedTemplate ? (
              <div className="border border-[#BFDBFE] bg-gradient-to-b from-[#F0F7FF]/50 to-white rounded-lg p-4.5 space-y-3.5 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                      已选择
                    </span>
                    <h4 className="font-bold text-sm text-[#0F172A]">
                      {selectedTemplate.name}
                    </h4>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {selectedTemplate.selectionSummary}
                  </p>
                </div>

                {/* 3-Item Lightweight Summary Grid (不展示运行引擎) */}
                <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                  {/* 1. 支持任务 */}
                  <div className="bg-white border border-[#E2E8F0] rounded-md p-2.5 space-y-0.5">
                    <span className="text-[11px] text-[#64748B] block">支持任务</span>
                    <span className="font-bold text-[#0F172A] text-xs block">
                      {selectedTemplate.supportedTaskLabels.length} 项
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block truncate">
                      {selectedTemplate.supportedTaskLabels.join(' · ')}
                    </span>
                  </div>

                  {/* 2. 能力模式 */}
                  <div className="bg-white border border-[#E2E8F0] rounded-md p-2.5 space-y-0.5">
                    <span className="text-[11px] text-[#64748B] block">能力模式</span>
                    <span className="font-bold text-[#0F172A] text-xs block truncate">
                      {selectedTemplate.capabilityPreset}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block truncate">
                      {selectedTemplate.capabilityPresetDesc}
                    </span>
                  </div>

                  {/* 3. 默认行为 (V1.1 §18 用户行为结果语言，不展示底层自治 enum) */}
                  <div className="bg-white border border-[#E2E8F0] rounded-md p-2.5 space-y-0.5">
                    <span className="text-[11px] text-[#64748B] block">默认行为</span>
                    <span className="font-bold text-[#0F172A] text-xs block leading-snug">
                      {selectedTemplate.behaviorLabel}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block truncate">
                      {selectedTemplate.autonomyDesc}
                    </span>
                  </div>
                </div>

                {/* Auxiliary Note */}
                <div className="pt-2 border-t border-[#E2E8F0] flex items-center space-x-1.5 text-[11px] text-[#64748B]">
                  <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>模板只提供推荐初始值，创建 Draft 后可继续调整。</span>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-[#CBD5E1] bg-[#F8FAFC] rounded-lg p-5 text-center space-y-1.5">
                <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-[#64748B]">
                  <Info className="w-4 h-4 text-[#94A3B8]" />
                  <span>尚未选择能力模板</span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  请在上方列表中选择一个业务职责相符的能力模板，以查看推荐配置并继续。
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────
              STAGE 2: 定义用途与工作范围 (PURPOSE & WORK SCOPE FORM)
          ───────────────────────────────────────────────────── */
          (() => {
            // Bug B 修复：未显式选择模板时不隐式回退到任何预设，给出引导态
            if (!selectedTemplate) {
              return (
                <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
                  <div className="text-center space-y-2">
                    <Info className="w-6 h-6 text-[#CBD5E1] mx-auto" />
                    <div className="text-xs font-bold text-[#0F172A]">尚未选择能力模板</div>
                    <p className="text-[11px] text-[#64748B]">请先返回上一步选择能力模板。</p>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold cursor-pointer transition-colors"
                    >
                      返回选择模板
                    </button>
                  </div>
                </div>
              );
            }
            const activeTemplate = selectedTemplate;
            return (
              <div className="flex-1 overflow-y-auto flex flex-col md:flex-row bg-[#F8FAFC] divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
                {/* Left Column: Form Fields */}
                <div className="flex-1 p-8 bg-white space-y-5">
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-[#64748B]">当前能力模板：</span>
                      <span className="font-bold text-xs text-[#0F172A]">{activeTemplate.name}</span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {activeTemplate.desc}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">
                      定义用途与工作范围
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      填写智能体的基础业务身份，并确定它的实际工作范围。任务绑定与运行配置将在创建后在定义工作区继续配置。
                    </p>
                  </div>

                  <form id="create-agent-form" onSubmit={handleSubmitFinal} className="space-y-4 text-xs">
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

                    {/* Field 4: 工作范围（按能力模板动态变化；只配置主业务范围，不暴露底层来源枚举） */}
                    <div className="space-y-2 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <label className="font-semibold text-[#0F172A] block">
                        {activeTemplate.scopeConfig.sectionTitle}
                      </label>

                      {/* Radio: ALL_ALLOWED（默认） */}
                      <button
                        type="button"
                        onClick={() => setScopeMode('ALL_ALLOWED')}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md border text-xs text-left transition-colors cursor-pointer ${
                          scopeMode === 'ALL_ALLOWED'
                            ? 'bg-[#F0F7FF] border-[#2563EB] text-[#0F172A]'
                            : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#94A3B8]'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            scopeMode === 'ALL_ALLOWED' ? 'border-[#2563EB]' : 'border-[#CBD5E1]'
                          }`}
                        >
                          {scopeMode === 'ALL_ALLOWED' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                          )}
                        </span>
                        <span className="font-medium">{activeTemplate.scopeConfig.allAllowedLabel}</span>
                      </button>

                      {/* Radio: SELECTED（指定范围） */}
                      <button
                        type="button"
                        onClick={() => setScopeMode('SELECTED')}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md border text-xs text-left transition-colors cursor-pointer ${
                          scopeMode === 'SELECTED'
                            ? 'bg-[#F0F7FF] border-[#2563EB] text-[#0F172A]'
                            : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#94A3B8]'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            scopeMode === 'SELECTED' ? 'border-[#2563EB]' : 'border-[#CBD5E1]'
                          }`}
                        >
                          {scopeMode === 'SELECTED' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                          )}
                        </span>
                        <span className="font-medium">{activeTemplate.scopeConfig.selectedLabel}</span>
                      </button>

                      {/* SELECTED → 多选资源列表 */}
                      {scopeMode === 'SELECTED' && (
                        <div className="space-y-1.5 pl-1">
                          <span className="text-[11px] text-[#64748B] block">
                            {activeTemplate.scopeConfig.optionsTitle}（可多选）
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {activeTemplate.scopeConfig.options.map((opt) => {
                              const checked = scopeResourceIds.includes(opt.resourceId);
                              return (
                                <button
                                  key={opt.resourceId}
                                  type="button"
                                  onClick={() => toggleScopeResource(opt.resourceId)}
                                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md border text-xs text-left transition-colors cursor-pointer ${
                                    checked
                                      ? 'bg-[#F0F7FF] border-[#2563EB] text-[#0F172A] font-medium'
                                      : 'bg-white border-[#CBD5E1] text-[#475569] hover:border-[#94A3B8]'
                                  }`}
                                >
                                  <span
                                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                      checked ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-[#CBD5E1] bg-white'
                                    }`}
                                  >
                                    {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </span>
                                  <span>{opt.name}</span>
                                </button>
                              );
                            })}
                          </div>
                          {isScopeIncomplete && (
                            <p className="text-[11px] text-amber-600 flex items-center space-x-1">
                              <Info className="w-3 h-3" />
                              <span>请至少选择一个工作范围。</span>
                            </p>
                          )}
                        </div>
                      )}

                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        {scopeMode === 'ALL_ALLOWED'
                          ? '智能体只会在当前用户有权访问的资源范围内工作。'
                          : '智能体只在指定的范围内工作，且仍然不能超出用户权限。'}
                      </p>
                    </div>
                  </form>

                  <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg flex items-start space-x-2 text-[11px] text-[#475569]">
                    <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      创建后只生成未发布草稿，不会直接影响正式环境。
                    </p>
                  </div>
                </div>

                {/* Right Column: 创建后将获得（用户化摘要，不含 Runtime 表达） */}
                <div className="w-full md:w-[320px] p-6 bg-[#F8FAFC] flex flex-col justify-between shrink-0 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">
                        创建后将获得
                      </h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        以“{activeTemplate.name}”能力模板为起点，创建后可继续调整。
                      </p>
                    </div>

                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-3 text-xs shadow-2xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-[#64748B] block">能力模板</span>
                        <span className="font-bold text-[#0F172A] block">{activeTemplate.name}</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] text-[#64748B] block">主要任务</span>
                        <span className="font-semibold text-[#0F172A] block leading-relaxed">
                          {activeTemplate.supportedTaskLabels.join(' · ')}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] text-[#64748B] block">工作范围</span>
                        <span className="font-semibold text-[#0F172A] block leading-relaxed">
                          {scopeSummary}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] text-[#64748B] block">行为方式</span>
                        <span className="font-semibold text-[#0F172A] block leading-relaxed">
                          {activeTemplate.behaviorLabel}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] text-[#64748B] block">Owner</span>
                        <span className="font-semibold text-[#0F172A] block">
                          {owner || activeTemplate.defaultOwner}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[11px] text-[#1E40AF] leading-relaxed">
                    以上是能力模板提供的初始定义。创建草稿后，可以在“智能体定义”工作区继续调整支持任务、工作范围、能力、模型策略与自主程度。
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* ─────────────────────────────────────────────────────────
            4. DRAWER FOOTER ACTIONS (十七、Footer 操作)
        ───────────────────────────────────────────────────────── */}
        <div className="px-8 py-4 bg-white border-t border-[#E2E8F0] flex items-center justify-between shrink-0 shadow-2xs">
          {/* Left Button */}
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
            >
              取消
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>更换模板</span>
            </button>
          )}

          {/* Right Primary Button */}
          {currentStep === 1 ? (
            <button
              type="button"
              disabled={!selectedTemplateId}
              onClick={handleGoToBasicDefinition}
              className={`px-5 py-2 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs ${
                selectedTemplateId
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer'
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <span>继续</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              form="create-agent-form"
              disabled={isScopeIncomplete}
              className={`px-5 py-2 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs ${
                isScopeIncomplete
                  ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer'
              }`}
            >
              <span>创建草稿并继续配置</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
