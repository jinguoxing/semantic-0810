import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Key,
  Database,
  Info,
  Check,
  Plus,
  X,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  FileText,
  Building2,
  ClipboardCheck,
  Bot
} from 'lucide-react';

export interface BusinessObjectAuthoringWorkspaceProps {
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  onNavigateToSemantics?: () => void;
  onNavigateToObjectsList?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const BusinessObjectAuthoringWorkspace: React.FC<BusinessObjectAuthoringWorkspaceProps> = ({
  onCancel,
  onSaveDraft,
  onPublish,
  onNavigateToSemantics,
  onNavigateToObjectsList,
  addToast
}) => {
  // Form States
  const [objectName, setObjectName] = useState('热线坐席');
  const [businessDomain, setBusinessDomain] = useState('公共服务');
  const [definition, setDefinition] = useState(
    '表示通过公共服务热线渠道承担咨询、受理和协同服务职责的业务主体。'
  );
  const [aliases, setAliases] = useState<string[]>(['服务热线坐席', '热线服务坐席']);
  const [newAliasInput, setNewAliasInput] = useState('');
  const [isAddingAlias, setIsAddingAlias] = useState(false);

  // AI Semantic Summary Expansion State (Default: Collapsed as required)
  const [isSemanticSummaryExpanded, setIsSemanticSummaryExpanded] = useState(false);

  // Right Inspector States
  const [isDiffExpanded, setIsDiffExpanded] = useState(false);
  const [isDefineIndependentExpanded, setIsDefineIndependentExpanded] = useState(false);
  const [distinctionReason, setDistinctionReason] = useState(
    '热线坐席具有独立的人员管理、排班、业务状态和服务身份，不只是客服坐席在热线渠道中的使用方式。'
  );
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [isUnderstandingRefreshing, setIsUnderstandingRefreshing] = useState(false);
  const [independentApproved, setIndependentApproved] = useState(false);

  // Dialog / Popover States
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [showReuseConfirmModal, setShowReuseConfirmModal] = useState(false);
  const [isOptimizingDefinition, setIsOptimizingDefinition] = useState(false);

  // Handlers
  const handleRemoveAlias = (aliasToRemove: string) => {
    setAliases(prev => prev.filter(a => a !== aliasToRemove));
  };

  const handleAddAlias = () => {
    if (newAliasInput.trim() && !aliases.includes(newAliasInput.trim())) {
      setAliases(prev => [...prev, newAliasInput.trim()]);
      setNewAliasInput('');
      setIsAddingAlias(false);
      addToast?.('success', '别名已添加', `已为业务对象补充别名「${newAliasInput.trim()}」`);
    }
  };

  const handleOptimizeDefinition = () => {
    setIsOptimizingDefinition(true);
    setTimeout(() => {
      setIsOptimizingDefinition(false);
      setDefinition(
        '表示通过公共服务热线渠道承担咨询、受理和协同服务职责的业务主体。'
      );
      addToast?.('success', '定义已优化', 'Semovix 已依据企业业务主体标准与政务服务规范优化表述');
    }, 600);
  };

  const handleReanalyzeUnderstanding = () => {
    setIsUnderstandingRefreshing(true);
    setTimeout(() => {
      setIsUnderstandingRefreshing(false);
      addToast?.('info', '语义理解已更新', '已根据当前定义的业务主体范围重新完成语义推导');
    }, 700);
  };

  const handleSubmitDistinction = () => {
    setIsReevaluating(true);
    setTimeout(() => {
      setIsReevaluating(false);
      setIndependentApproved(true);
      addToast?.('success', '差异评估已完成', 'Semovix 认可在特定人员排班与话务身份下的业务独立性');
    }, 900);
  };

  const handleConfirmReuse = () => {
    setShowReuseConfirmModal(false);
    addToast?.('success', '已确认复用「客服坐席」', '已将「热线坐席」作为「客服坐席」在热线渠道下的业务别名与特化形式沉淀');
  };

  const handleSaveDraftAction = () => {
    if (onSaveDraft) {
      onSaveDraft();
    } else {
      addToast?.('success', '草稿保存成功', '已保存「热线坐席」业务对象草稿至企业语义资产库');
    }
  };

  return (
    <div id="bo-authoring-container" className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto text-[#1E293B]">
      {/* =========================================================================
          Sticky Page Header
          Breadcrumb + Main Title + Single Top Action Set (Cancel / Save Draft / Publish disabled)
      ========================================================================= */}
      <header id="bo-sticky-header" className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-[#E2E8F0] px-6 lg:px-10 py-3.5 shadow-2xs">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Breadcrumb & Title */}
          <div className="space-y-1">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
              <button
                onClick={onNavigateToSemantics}
                className="hover:text-[#2563EB] cursor-pointer transition-colors"
              >
                业务语义
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <button
                onClick={onNavigateToObjectsList}
                className="hover:text-[#2563EB] cursor-pointer transition-colors"
              >
                业务对象
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="text-[#0F172A] font-medium">新建业务对象</span>
            </div>

            {/* Main Title & Subtitle */}
            <div className="flex items-baseline space-x-2.5">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
                新建业务对象
              </h1>
              <span className="text-xs font-medium text-[#94A3B8] font-sans">
                Create Business Object
              </span>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              定义一个企业稳定业务主体，Semovix 会同步检查企业中是否已经存在相同或相近语义。
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3 shrink-0 self-start sm:self-center">
            {/* 取消 */}
            <button
              id="btn-bo-cancel"
              onClick={onCancel || onNavigateToObjectsList}
              className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              取消
            </button>

            {/* 保存草稿 */}
            <button
              id="btn-bo-save-draft"
              onClick={handleSaveDraftAction}
              className="px-4 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#94A3B8] transition-colors cursor-pointer shadow-2xs"
            >
              保存草稿
            </button>

            {/* 发布 (Disabled + Notice) */}
            <div className="flex items-center space-x-2">
              <button
                id="btn-bo-publish"
                disabled
                className="px-4 py-1.5 rounded-lg bg-[#E2E8F0] text-xs font-semibold text-[#94A3B8] cursor-not-allowed border border-[#CBD5E1]/60"
                title="存在未解决的对象身份判断，暂无法发布"
              >
                发布
              </button>
              <span className="text-[11px] text-[#94A3B8] whitespace-nowrap">
                存在未解决的对象身份判断
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          Main Body Grid: 66% Left (Authoring Surface) / 34% Right (Live Semantic Inspector)
      ========================================================================= */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* -------------------------------------------------------------------
              左侧 66%｜Authoring Surface
              严格遵循最多 4 个轻 Surface / Card 规范：这是 Surface 1
          ------------------------------------------------------------------- */}
          <div
            id="authoring-surface"
            className="w-full lg:w-[66%] bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6 lg:p-7 space-y-6"
          >
            {/* Section: 核心定义 */}
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                核心定义
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                先说明这个业务主体是谁，以及它与企业其他业务概念的核心区别。
              </p>
            </div>

            {/* 第一行: 业务对象名称 * + 业务域 * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* 业务对象名称 */}
              <div className="space-y-1.5">
                <label
                  htmlFor="input-bo-name"
                  className="block text-xs font-semibold text-[#334155]"
                >
                  业务对象名称 <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="input-bo-name"
                  type="text"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm text-[#0F172A] font-semibold bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                  placeholder="请输入业务主体名称，如：热线坐席"
                />
                <p className="text-[11px] text-[#64748B]">
                  使用企业业务中稳定、可复用的主体名称。
                </p>
              </div>

              {/* 业务域 */}
              <div className="space-y-1.5">
                <label
                  htmlFor="select-bo-domain"
                  className="block text-xs font-semibold text-[#334155]"
                >
                  业务域 <span className="text-[#EF4444]">*</span>
                </label>
                <div className="relative">
                  <select
                    id="select-bo-domain"
                    value={businessDomain}
                    onChange={(e) => setBusinessDomain(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm text-[#0F172A] font-medium bg-white border border-[#CBD5E1] rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] cursor-pointer transition-all pr-8"
                  >
                    <option value="公共服务">公共服务</option>
                    <option value="城市治理">城市治理</option>
                    <option value="社会保障">社会保障</option>
                    <option value="市场监管">市场监管</option>
                    <option value="综合行政">综合行政</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#2563EB] font-medium flex items-center space-x-1">
                  <span>Semovix 推荐</span>
                </p>
              </div>
            </div>

            {/* 第二行: 业务定义 * (第一视觉) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="textarea-bo-definition"
                  className="block text-xs font-semibold text-[#334155]"
                >
                  业务定义 <span className="text-[#EF4444]">*</span>
                </label>
                <button
                  id="btn-optimize-definition"
                  type="button"
                  onClick={handleOptimizeDefinition}
                  disabled={isOptimizingDefinition}
                  className="inline-flex items-center space-x-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium cursor-pointer transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isOptimizingDefinition ? 'animate-spin' : ''}`} />
                  <span>{isOptimizingDefinition ? '正在优化...' : '优化定义'}</span>
                </button>
              </div>
              <div className="relative">
                <textarea
                  id="textarea-bo-definition"
                  rows={3}
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-[#0F172A] leading-relaxed bg-[#F8FAFC]/50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] focus:bg-white transition-all resize-none"
                  placeholder="说明业务主体的核心职责与内涵..."
                />
              </div>
              <p className="text-[11px] text-[#059669] font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>已参考 Semovix 建议优化</span>
              </p>
            </div>

            {/* 第三行: 别名 (降权处理) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#475569]">
                别名
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {aliases.map((alias) => (
                  <span
                    key={alias}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#334155] font-medium"
                  >
                    <span>{alias}</span>
                    <button
                      onClick={() => handleRemoveAlias(alias)}
                      className="text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
                      title="移除别名"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {isAddingAlias ? (
                  <div className="inline-flex items-center space-x-1">
                    <input
                      type="text"
                      value={newAliasInput}
                      onChange={(e) => setNewAliasInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddAlias();
                        if (e.key === 'Escape') setIsAddingAlias(false);
                      }}
                      autoFocus
                      placeholder="输入别名按回车"
                      className="px-2 py-0.5 text-xs border border-[#CBD5E1] rounded bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB] w-28"
                    />
                    <button
                      onClick={handleAddAlias}
                      className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium px-1.5 py-0.5"
                    >
                      确定
                    </button>
                    <button
                      onClick={() => setIsAddingAlias(false)}
                      className="text-xs text-[#94A3B8] hover:text-[#64748B] px-1 py-0.5"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingAlias(true)}
                    className="inline-flex items-center space-x-1 text-xs text-[#64748B] hover:text-[#2563EB] px-2 py-1 rounded border border-dashed border-[#CBD5E1] hover:border-[#2563EB] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#64748B]">
                已自动排除与其他正式业务对象冲突的名称。
              </p>
            </div>

            {/* Divider 分隔线 */}
            <div className="border-t border-[#E2E8F0] pt-4" />

            {/* Section: AI 已准备关键语义 (宽而轻的 Semantic Summary Surface - 这是 Surface 2) */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
                  AI 已准备关键语义
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Semovix 已根据当前定义和企业已有语义整理核心建议。
                </p>
              </div>

              {/* 关键语义 Summary Surface */}
              <div
                id="semantic-summary-surface"
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      已准备
                    </span>
                    <span className="text-xs font-bold text-[#1E293B]">
                      1 个主体标识 · 3 个关键属性 · 2 个核心关系
                    </span>
                  </div>

                  {/* 查看并调整按钮 */}
                  <button
                    id="btn-toggle-semantic-summary"
                    type="button"
                    onClick={() => setIsSemanticSummaryExpanded(!isSemanticSummaryExpanded)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-xs font-semibold text-[#334155] transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>{isSemanticSummaryExpanded ? '收起调整' : '查看并调整'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSemanticSummaryExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* 默认折叠状态下的轻量预览行 (严格遵循模型语义，避免重复编号) */}
                <div className="text-xs text-[#475569] leading-relaxed pt-1 border-t border-[#E2E8F0]/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <div>
                    <span className="font-semibold text-[#1E293B]">主体标识：</span>
                    <span className="text-[#0F172A] font-bold">坐席编号</span>
                    <span className="mx-2 text-[#CBD5E1]">·</span>
                    <span className="font-semibold text-[#1E293B]">其他关键属性：</span>
                    <span>坐席名称 · 服务状态</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#1E293B]">核心关系：</span>
                    <span className="text-[#334155]">所属部门 → 组织机构 · 受理工单 → 服务工单</span>
                  </div>
                </div>

                {/* 点击“查看并调整”后的展开内容 (本版默认折叠，按需展开) */}
                {isSemanticSummaryExpanded && (
                  <div className="pt-3 border-t border-[#E2E8F0] space-y-4 animate-in fade-in-50 duration-200">
                    {/* 1. 主体标识 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1E293B]">
                        <Key className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>主体标识</span>
                      </div>
                      <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-md flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0F172A]">坐席编号</span>
                          <span className="text-[11px] text-[#64748B]">
                            (语义角色：主体唯一业务标识 · 引用关键属性)
                          </span>
                        </div>
                        <span className="text-[10px] text-[#059669] font-medium bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                          建议采用
                        </span>
                      </div>
                    </div>

                    {/* 2. 关键属性 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1E293B]">
                        <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>其他关键属性</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F172A]">坐席名称</span>
                            <span className="text-[10px] text-[#64748B]">文本型</span>
                          </div>
                          <p className="text-[11px] text-[#64748B]">表示热线服务人员的对外业务显示名称</p>
                        </div>
                        <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F172A]">服务状态</span>
                            <span className="text-[10px] text-[#64748B]">枚举字典</span>
                          </div>
                          <p className="text-[11px] text-[#64748B]">空闲 / 振铃 / 通话 / 后处理 / 离线</p>
                        </div>
                      </div>
                    </div>

                    {/* 3. 核心关系 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1E293B]">
                        <ArrowRight className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>核心关系</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-md flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-[#0F172A]">所属部门</span>
                            <span className="text-[#94A3B8]">→</span>
                            <span className="font-semibold text-[#2563EB]">组织机构</span>
                            <span className="text-[11px] text-[#64748B]">(多对一 归属拓扑)</span>
                          </div>
                          <span className="text-[10px] text-[#059669] font-medium bg-[#ECFDF5] px-2 py-0.5 rounded">
                            已对齐
                          </span>
                        </div>
                        <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-md flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-[#0F172A]">受理工单</span>
                            <span className="text-[#94A3B8]">→</span>
                            <span className="font-semibold text-[#2563EB]">服务工单</span>
                            <span className="text-[11px] text-[#64748B]">(一对多 履约流转)</span>
                          </div>
                          <span className="text-[10px] text-[#059669] font-medium bg-[#ECFDF5] px-2 py-0.5 rounded">
                            已对齐
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 关键语义区底部极弱说明 */}
              <div className="flex items-center space-x-2 text-[11px] text-[#94A3B8] pt-1">
                <span>数据支撑将在对象创建后自动发现。</span>
                <button
                  id="btn-learn-more-data-support"
                  type="button"
                  onClick={() => setShowLearnMoreModal(true)}
                  className="text-[#2563EB] hover:underline font-medium cursor-pointer"
                >
                  了解更多
                </button>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              右侧 34%｜Live Semantic Inspector (单一统一 Panel - Surface 3)
          ------------------------------------------------------------------- */}
          <aside
            id="semantic-inspector"
            className="w-full lg:w-[34%] bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6 space-y-5"
          >
            {/* Header: 语义理解 + 状态 + 重新理解 */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                    语义理解
                  </h2>
                  <span className="text-[11px] font-medium text-[#94A3B8] font-sans">
                    Semantic Understanding
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-[#059669] font-medium mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block animate-pulse" />
                  <span>已根据当前定义更新</span>
                </div>
              </div>

              <button
                id="btn-reanalyze-understanding"
                type="button"
                onClick={handleReanalyzeUnderstanding}
                disabled={isUnderstandingRefreshing}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium cursor-pointer flex items-center space-x-1"
                title="根据当前输入重新执行语义对齐"
              >
                <RefreshCw className={`w-3 h-3 ${isUnderstandingRefreshing ? 'animate-spin' : ''}`} />
                <span>重新理解</span>
              </button>
            </div>

            {/* 第一视觉：可能已有正式业务对象 (这是 Surface 4 - 轻强调区) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                可能已有正式业务对象
              </h3>

              {/* Existing Object 候选强调区 */}
              <div
                id="existing-object-card"
                className="bg-[#FFFBEB]/50 border-l-[3px] border-l-[#D97706] border-y border-r border-[#FDE68A]/80 rounded-r-lg p-4 space-y-3"
              >
                {/* 实体名称与双标签 */}
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-[#0F172A]">
                    客服坐席
                  </h4>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                      已发布
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      公共服务
                    </span>
                  </div>
                </div>

                {/* 客服坐席定义 */}
                <p className="text-xs text-[#475569] leading-relaxed">
                  表示承担客户咨询、受理和服务处理职责的业务主体。
                </p>

                {/* Duplicate Comparison 极限压缩: 一句话核心判断 */}
                <div className="text-xs text-[#334155] leading-relaxed pt-2 border-t border-[#FDE68A]/60 space-y-1.5">
                  <p className="font-medium">
                    两者都承担咨询与受理职责，当前最关键的差异是“热线渠道”是否足以形成独立的企业业务身份。
                  </p>
                  <p className="text-xs font-bold text-[#92400E]">
                    Semovix 建议：优先确认是否应复用“客服坐席”。
                  </p>
                </div>

                {/* 操作层级: 1 个强 CTA + 2 个文本型次级动作 */}
                <div className="pt-2 space-y-2.5">
                  <button
                    id="btn-reuse-existing-bo"
                    type="button"
                    onClick={() => setShowReuseConfirmModal(true)}
                    className="w-full py-2 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    复用“客服坐席”
                  </button>

                  <div className="flex items-center justify-center space-x-6 text-xs font-medium text-[#64748B]">
                    <button
                      id="btn-toggle-diff-view"
                      type="button"
                      onClick={() => setIsDiffExpanded(!isDiffExpanded)}
                      className="hover:text-[#0F172A] underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      {isDiffExpanded ? '收起差异' : '查看差异'}
                    </button>
                    <button
                      id="btn-toggle-define-independent"
                      type="button"
                      onClick={() => setIsDefineIndependentExpanded(!isDefineIndependentExpanded)}
                      className="hover:text-[#0F172A] underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      {isDefineIndependentExpanded ? '收起独立定义说明' : '仍定义独立对象'}
                    </button>
                  </div>
                </div>

                {/* 按需查看: 点击“查看差异”展开详细对比 (默认折叠) */}
                {isDiffExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#FDE68A] space-y-2.5 text-xs text-[#334155] animate-in fade-in-50 duration-150">
                    <div>
                      <span className="font-bold text-[#0F172A]">当前重叠：</span>
                      <ul className="list-disc list-inside text-[11px] text-[#475569] space-y-0.5 mt-1">
                        <li>咨询职责：两者均承担公众与诉求人业务咨询</li>
                        <li>受理职责：均负责首问登记、事项流转与结果回访</li>
                        <li>核心关系：均挂载于组织机构并关联服务工单</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-[#0F172A]">当前差异：</span>
                      <ul className="list-disc list-inside text-[11px] text-[#475569] space-y-0.5 mt-1">
                        <li>新对象限定于语音热线专属服务渠道</li>
                        <li>已有“客服坐席”适用线上、线下与热线全渠道服务</li>
                      </ul>
                    </div>
                    <div className="text-[11px] text-[#64748B] bg-white/70 p-2 rounded border border-[#FDE68A]/60">
                      <span className="font-semibold text-[#0F172A]">事实依据：</span>
                      <span>企业已有 182 条坐席人员台账与工单分配策略直接挂载于「客服坐席」。</span>
                    </div>
                  </div>
                )}

                {/* 按需查看: 点击“仍定义独立对象”展开 Inline 说明区 (默认折叠) */}
                {isDefineIndependentExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#FDE68A] space-y-2.5 text-xs animate-in fade-in-50 duration-150">
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A] block">
                        请说明核心业务区别
                      </label>
                      <p className="text-[11px] text-[#64748B]">
                        为什么“热线坐席”不能直接复用已有“客服坐席”？
                      </p>
                    </div>

                    <textarea
                      rows={3}
                      value={distinctionReason}
                      onChange={(e) => setDistinctionReason(e.target.value)}
                      className="w-full p-2 text-xs text-[#0F172A] bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#2563EB] resize-none leading-relaxed"
                      placeholder="请补充业务独立性依据..."
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#64748B]">
                        {independentApproved ? '✓ 差异依据已记录，待综合复核' : '提交后 Semovix 将重估业务实体独立性'}
                      </span>
                      <button
                        type="button"
                        onClick={handleSubmitDistinction}
                        disabled={isReevaluating}
                        className="px-3 py-1 bg-[#0F172A] hover:bg-[#334155] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                      >
                        {isReevaluating ? '分析中...' : '提交 Semovix 重新评估'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Divider 分隔线 */}
            <div className="border-t border-[#E2E8F0] pt-2" />

            {/* Section: 当前理解 (大幅压缩，最多 3-4 行) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                当前理解
              </h3>
              <p className="text-xs text-[#334155] leading-relaxed">
                <strong className="text-[#0F172A]">热线坐席</strong>表示公共服务领域中承担服务热线咨询、受理和协同职责的业务主体，通过<strong className="text-[#0F172A]">坐席编号</strong>稳定识别，并与<strong className="text-[#0F172A]">组织机构、服务工单</strong>存在核心业务关系。
              </p>

              {/* 相关语义 (降权为下方一行) */}
              <div className="pt-2 border-t border-[#E2E8F0]/70 flex flex-wrap items-baseline gap-1 text-[11px]">
                <span className="text-[#64748B] font-semibold">相关语义：</span>
                <span className="text-[#475569] font-medium">
                  热线服务 · 服务受理 · 组织机构 · 服务工单
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* =========================================================================
          Modal 1: 数据支撑自动发现“了解更多”说明弹窗
      ========================================================================= */}
      {showLearnMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A]">数据支撑自动发现机制</h3>
              </div>
              <button
                onClick={() => setShowLearnMoreModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#475569] leading-relaxed space-y-2.5">
              <p>
                在 Semovix 企业语义架构中，<strong>业务对象定义专注于业务概念与实体职责</strong>，无需在创建阶段逐一绑定物理数据表或写死 SQL 字段。
              </p>
              <p>
                当业务对象发布或确认后，Semovix 将根据主体标识（如「坐席编号」）与关键属性，<strong>自动在企业数仓及业务系统中扫描匹配相应的数据资产与字段血缘</strong>。
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLearnMoreModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Modal 2: 复用“客服坐席”决策确认弹窗
      ========================================================================= */}
      {showReuseConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <h3 className="text-sm font-bold text-[#0F172A]">确认复用企业已有业务对象「客服坐席」</h3>
              </div>
              <button
                onClick={() => setShowReuseConfirmModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#475569] leading-relaxed space-y-2.5">
              <p>
                选择复用后，系统将把<strong>「热线坐席」</strong>登记为<strong>「客服坐席」</strong>在热线语音服务渠道下的<strong>专业化别名与业务视图</strong>，避免在全域语义层造成重复业务主体分裂。
              </p>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                <div className="font-semibold text-[#0F172A]">复用生效结果：</div>
                <ul className="list-disc list-inside text-[11px] text-[#64748B] space-y-1">
                  <li>现有客服坐席的 182 条物理数据台账直接共享</li>
                  <li>自然人及服务工单关系自动继承</li>
                  <li>支持在热线报表与问数中无缝识别「热线坐席」语义</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReuseConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] text-xs text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
              >
                返回继续对比
              </button>
              <button
                type="button"
                onClick={handleConfirmReuse}
                className="px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer shadow-xs"
              >
                确认复用「客服坐席」
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
