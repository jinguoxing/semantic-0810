import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
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
  BookOpen,
  ClipboardCheck,
  ShieldCheck,
  Sliders,
  CheckCheck
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
  // ---------------------------------------------------------------------------
  // Core Definition Form States
  // ---------------------------------------------------------------------------
  const [objectName, setObjectName] = useState('热线坐席');
  const [businessDomain, setBusinessDomain] = useState('公共服务');
  const [definition, setDefinition] = useState(
    '表示通过公共服务热线渠道承担咨询、受理和协同服务职责的业务主体。'
  );
  const [aliases, setAliases] = useState<string[]>(['服务热线坐席', '热线服务坐席']);
  const [newAliasInput, setNewAliasInput] = useState('');
  const [isAddingAlias, setIsAddingAlias] = useState(false);
  const [isOptimizingDefinition, setIsOptimizingDefinition] = useState(false);

  // ---------------------------------------------------------------------------
  // Key Semantic Draft States (3 key attributes, 2 core relationships)
  // ---------------------------------------------------------------------------
  const [identityAttr, setIdentityAttr] = useState('坐席编号');
  const [keyAttributes, setKeyAttributes] = useState([
    { id: 'attr-1', name: '坐席编号', meaning: '热线业务系统中唯一识别坐席的主体标识代码', isIdentity: true },
    { id: 'attr-2', name: '坐席名称', meaning: '热线服务人员的对外业务显示姓名或工作代号', isIdentity: false },
    { id: 'attr-3', name: '服务状态', meaning: '空闲 / 振铃 / 通话 / 后处理 / 离线', isIdentity: false }
  ]);
  const [coreRelationships, setCoreRelationships] = useState([
    { id: 'rel-1', name: '所属部门', targetObject: '组织机构', multiplicity: '多对一 归属拓扑', targetStatus: '已对齐' },
    { id: 'rel-2', name: '受理工单', targetObject: '服务工单', multiplicity: '一对多 履约流转', targetStatus: '已对齐' }
  ]);

  // ---------------------------------------------------------------------------
  // Right Inspector States: Reuse Check
  // ---------------------------------------------------------------------------
  // 'pending' (default, publish blocked) | 'reused' (reused 客服坐席) | 'independent' (confirmed distinct)
  const [reuseStatus, setReuseStatus] = useState<'pending' | 'reused' | 'independent'>('pending');
  const [isDiffExpanded, setIsDiffExpanded] = useState(false);
  const [isDefineIndependentExpanded, setIsDefineIndependentExpanded] = useState(false);
  const [distinctionReason, setDistinctionReason] = useState(
    '热线坐席具有独立的排班、话务技能评级与专属政务热线业务身份，需独立沉淀业务指标。'
  );
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [isUnderstandingRefreshing, setIsUnderstandingRefreshing] = useState(false);

  // ---------------------------------------------------------------------------
  // Drawers & Modals States
  // ---------------------------------------------------------------------------
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [isMaterialsDrawerOpen, setIsMaterialsDrawerOpen] = useState(false);
  const [isSemanticsAdjustDrawerOpen, setIsSemanticsAdjustDrawerOpen] = useState(false);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [showReuseConfirmModal, setShowReuseConfirmModal] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleRemoveAlias = (aliasToRemove: string) => {
    setAliases(prev => prev.filter(a => a !== aliasToRemove));
  };

  const handleAddAlias = () => {
    const trimmed = newAliasInput.trim();
    if (!trimmed) {
      setIsAddingAlias(false);
      return;
    }
    if (trimmed === '客服坐席') {
      addToast?.('error', '别名冲突', '「客服坐席」为已有独立正式业务对象，不可作为别名。');
      return;
    }
    if (!aliases.includes(trimmed)) {
      setAliases(prev => [...prev, trimmed]);
      setNewAliasInput('');
      setIsAddingAlias(false);
      addToast?.('success', '别名已添加', `已为业务对象添加常用称谓「${trimmed}」`);
    } else {
      setIsAddingAlias(false);
    }
  };

  const handleOptimizeDefinition = () => {
    setIsOptimizingDefinition(true);
    setTimeout(() => {
      setIsOptimizingDefinition(false);
      setDefinition(
        '表示通过公共服务热线渠道承担咨询、受理和协同服务职责的业务主体。'
      );
      addToast?.('success', '定义已优化', 'Semovix 已依据《公共服务热线运行管理办法》和企业语义规范优化表述');
    }, 600);
  };

  const handleReanalyzeUnderstanding = () => {
    setIsUnderstandingRefreshing(true);
    setTimeout(() => {
      setIsUnderstandingRefreshing(false);
      addToast?.('info', '语义理解已同步', '已依据核心定义重新检验语义完整性与企业复用池');
    }, 500);
  };

  const handleConfirmReuse = () => {
    setShowReuseConfirmModal(false);
    setReuseStatus('reused');
    addToast?.('success', '已确认复用「客服坐席」', '已将「热线坐席」注册为「客服坐席」在热线渠道下的业务特化形式');
  };

  const handleSubmitDistinction = () => {
    setIsReevaluating(true);
    setTimeout(() => {
      setIsReevaluating(false);
      setReuseStatus('independent');
      setIsDefineIndependentExpanded(false);
      addToast?.('success', '差异评估通过', 'Semovix 认可在特定热线排班体系与专属业务身份下的独立创建');
    }, 800);
  };

  const handlePublish = () => {
    if (reuseStatus === 'pending') {
      addToast?.('error', '暂无法发布', '需先处理与“客服坐席”的对象复用判断');
      return;
    }
    setShowPublishSuccessModal(true);
  };

  const handleFinalPublishConfirm = () => {
    setShowPublishSuccessModal(false);
    if (onPublish) {
      onPublish();
    } else if (onNavigateToObjectsList) {
      onNavigateToObjectsList();
    }
    addToast?.('success', '业务对象已发布', `「${objectName}」已正式发布至企业业务语义目录`);
  };

  const handleSaveDraftAction = () => {
    if (onSaveDraft) {
      onSaveDraft();
    } else {
      addToast?.('success', '草稿保存成功', `已保存「${objectName}」业务对象定义草稿至企业语义中心`);
    }
  };

  return (
    <div id="bo-authoring-container" className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto text-[#0F172A]">
      {/* =========================================================================
          Sticky Page Header
          Breadcrumb + Main Title + Single Top Action Set (Cancel / Save Draft / Publish)
      ========================================================================= */}
      <header id="bo-sticky-header" className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-6 lg:px-10 py-3.5 shadow-2xs">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Breadcrumb & Title */}
          <div className="space-y-1">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
              <button
                onClick={onNavigateToSemantics || onNavigateToObjectsList}
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

            {/* Page Description */}
            <p className="text-xs text-[#64748B] leading-relaxed">
              定义一个企业稳定业务主体，Semovix 会同步检查语义类型、已有对象与定义依据。
            </p>
          </div>

          {/* Right: Actions (Only ONE set at top as required) */}
          <div className="flex items-center space-x-3 shrink-0 self-start sm:self-center">
            {/* 取消 */}
            <button
              id="btn-bo-cancel"
              onClick={onCancel || onNavigateToObjectsList}
              className="px-3.5 py-1.5 rounded-md border border-[#CBD5E1] bg-white text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              取消
            </button>

            {/* 保存草稿 */}
            <button
              id="btn-bo-save-draft"
              onClick={handleSaveDraftAction}
              className="px-3.5 py-1.5 rounded-md border border-[#2563EB] bg-white text-xs font-medium text-[#2563EB] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
            >
              保存草稿
            </button>

            {/* 发布 Button with Dynamic Status */}
            <div className="flex items-center space-x-2.5">
              <button
                id="btn-bo-publish"
                disabled={reuseStatus === 'pending'}
                onClick={handlePublish}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  reuseStatus === 'pending'
                    ? 'bg-[#E2E8F0] text-[#94A3B8] border border-[#CBD5E1]/60 cursor-not-allowed'
                    : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer shadow-xs font-semibold'
                }`}
                title={reuseStatus === 'pending' ? '需先处理与“客服坐席”的对象复用判断' : '发布至企业业务语义目录'}
              >
                发布
              </button>

              {/* Status Note Beside Publish */}
              {reuseStatus === 'pending' ? (
                <span className="text-xs text-[#64748B] whitespace-nowrap">
                  需先处理与“客服坐席”的对象复用判断
                </span>
              ) : reuseStatus === 'reused' ? (
                <span className="text-xs text-[#059669] font-medium whitespace-nowrap flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>已确认为「客服坐席」的特化形式</span>
                </span>
              ) : (
                <span className="text-xs text-[#059669] font-medium whitespace-nowrap flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>已确认独立业务对象身份</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Source notification line under title */}
        <div className="max-w-[1440px] mx-auto mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
          <div className="flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-[#64748B]" />
            <span>基于《公共服务热线运行管理办法》的识别结果创建</span>
          </div>
          <button
            onClick={() => setIsEvidenceDrawerOpen(true)}
            className="text-[#2563EB] hover:underline cursor-pointer font-medium"
          >
            查看来源
          </button>
        </div>
      </header>

      {/* =========================================================================
          Main Body Dual-Column Grid: 64% Left (Authoring Surface) / 36% Right (Semantic Inspector)
      ========================================================================= */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* -------------------------------------------------------------------
              左侧 64%｜业务对象编辑主工作面 (Authoring Surface)
              纯白工作面，细边框，极轻阴影
          ------------------------------------------------------------------- */}
          <div
            id="authoring-surface"
            className="w-full lg:w-[64%] bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6 lg:p-7 space-y-7"
          >
            {/* ================= 模块一：核心定义 ================= */}
            <div className="space-y-5">
              {/* Header with 引用业务资料 */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                    核心定义
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    说明这个业务主体是什么，以及它与相近业务主体的关键区别。
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    id="btn-cite-business-materials"
                    type="button"
                    onClick={() => setIsMaterialsDrawerOpen(true)}
                    className="inline-flex items-center space-x-1.5 text-[#2563EB] hover:text-[#1D4ED8] font-medium cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>引用业务资料</span>
                  </button>
                  <span className="text-[#94A3B8]">·</span>
                  <span className="text-[#64748B]">已引用 1 份</span>
                </div>
              </div>

              {/* 第一行: 业务对象名称 * + 主要业务域 * */}
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

                {/* 主要业务域 (严格称“主要业务域”) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="select-bo-domain"
                    className="block text-xs font-semibold text-[#334155]"
                  >
                    主要业务域 <span className="text-[#EF4444]">*</span>
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
                  <p className="text-[11px] text-[#64748B]">
                    用于标识主要业务上下文与治理归属，不限制该对象被其他业务域复用。
                  </p>
                </div>
              </div>

              {/* 第二行: 业务定义 * */}
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
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B]">
                    说明这个业务主体是什么，以及它与相近业务主体的关键区别。
                  </span>
                  <span className="text-[#059669] font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                    <span>已参考业务资料与 Semovix 建议优化</span>
                  </span>
                </div>
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
                      className="inline-flex items-center space-x-1 text-xs text-[#64748B] hover:text-[#2563EB] px-2.5 py-1 rounded border border-dashed border-[#CBD5E1] hover:border-[#2563EB] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>添加别名</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B]">
                  用于搜索、识别和兼容企业中的其他常用称谓。
                </p>
              </div>
            </div>

            {/* Divider 分隔线 */}
            <div className="border-t border-[#E2E8F0]" />

            {/* ================= 模块二：关键语义草稿 ================= */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                  关键语义草稿
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Semovix 已根据当前定义和可用依据整理，发布前可按需调整。
                </p>
              </div>

              {/* 关键语义草稿轻量概览容器 */}
              <div
                id="key-semantics-draft-card"
                className="bg-[#F8FAFC]/80 border border-[#E2E8F0] rounded-lg p-4 space-y-3 transition-all"
              >
                {/* 概览顶部条 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <span className="text-xs font-bold text-[#0F172A]">
                      3 个关键属性 · 2 个核心关系
                    </span>
                  </div>

                  {/* 查看并调整按钮 */}
                  <button
                    id="btn-open-semantics-adjust"
                    type="button"
                    onClick={() => setIsSemanticsAdjustDrawerOpen(true)}
                    className="inline-flex items-center space-x-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium cursor-pointer"
                  >
                    <span>查看并调整</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 紧凑语义行：遵循统一规范，坐席编号既是标识又是属性 */}
                <div className="text-xs text-[#334155] leading-relaxed pt-2 border-t border-[#E2E8F0]/80 space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-[#64748B] shrink-0">主体标识：</span>
                    <span className="font-bold text-[#0F172A]">{identityAttr}</span>
                    <span className="text-[11px] text-[#64748B]">(标识该业务主体的唯一性)</span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-[#64748B] shrink-0">其他关键属性：</span>
                    <span className="text-[#334155]">
                      {keyAttributes.filter(a => a.name !== identityAttr).map(a => a.name).join(' · ')}
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-[#64748B] shrink-0">核心关系：</span>
                    <div className="flex flex-wrap items-center gap-3 text-[#334155]">
                      {coreRelationships.map(rel => (
                        <span key={rel.id} className="inline-flex items-center space-x-1">
                          <span className="font-medium text-[#0F172A]">{rel.name}</span>
                          <span className="text-[#94A3B8]">→</span>
                          <span className="font-semibold text-[#2563EB]">{rel.targetObject}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 关键语义区底部弱化说明 */}
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
              右侧 36%｜语义理解 (Semantic Inspector)
              纯白色底，细边框，单一统一 Inspector 容器
          ------------------------------------------------------------------- */}
          <aside
            id="semantic-inspector"
            className="w-full lg:w-[36%] bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 lg:p-6 space-y-5"
          >
            {/* Header: 语义理解 + 状态 */}
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
                  <Check className="w-3 h-3 text-[#059669]" />
                  <span>已根据当前定义更新</span>
                </div>
              </div>

              <button
                id="btn-reanalyze-understanding"
                type="button"
                onClick={handleReanalyzeUnderstanding}
                disabled={isUnderstandingRefreshing}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium cursor-pointer flex items-center space-x-1"
                title="重新推导与核验"
              >
                <RefreshCw className={`w-3 h-3 ${isUnderstandingRefreshing ? 'animate-spin' : ''}`} />
                <span>重新理解</span>
              </button>
            </div>

            {/* ================= 右侧第一视觉：对象复用检查 (最核心) ================= */}
            <div className="space-y-2.5">
              {reuseStatus === 'pending' ? (
                /* 状态 1: 待复用判断 (默认暖黄强调块) */
                <div
                  id="existing-object-card"
                  className="bg-[#FFFBEB]/40 border border-[#FDE68A] rounded-lg p-4 space-y-3"
                >
                  {/* Top Status Header */}
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#B45309]">
                    <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                    <span>可能已有正式业务对象</span>
                  </div>

                  {/* 目标对象名称与标签 */}
                  <div className="flex items-center justify-between pt-1">
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

                  {/* 核心重叠与差异判断 */}
                  <div className="text-xs text-[#334155] leading-relaxed pt-2.5 border-t border-[#FDE68A]/60 space-y-2">
                    <p className="font-medium">
                      两者都承担咨询与受理职责。当前需要判断的是，“热线渠道”是否足以让“热线坐席”形成独立的企业业务身份。
                    </p>

                    {/* Semovix 建议 Banner */}
                    <div className="p-2 rounded-md bg-[#FEF3C7] text-[#92400E] text-xs font-medium">
                      <span className="font-bold">Semovix 建议：</span> 优先确认是否应复用“客服坐席”。
                    </div>
                  </div>

                  {/* 操作层级: 1 个强 CTA + 2 个文本型次级动作 */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      id="btn-reuse-existing-bo"
                      type="button"
                      onClick={() => setShowReuseConfirmModal(true)}
                      className="w-full py-2 px-4 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      复用“客服坐席”
                    </button>

                    <div className="flex items-center justify-center space-x-6 text-xs font-medium text-[#2563EB]">
                      <button
                        id="btn-toggle-diff-view"
                        type="button"
                        onClick={() => setIsDiffExpanded(!isDiffExpanded)}
                        className="hover:underline cursor-pointer transition-colors"
                      >
                        {isDiffExpanded ? '收起差异' : '查看差异'}
                      </button>
                      <button
                        id="btn-toggle-define-independent"
                        type="button"
                        onClick={() => setIsDefineIndependentExpanded(!isDefineIndependentExpanded)}
                        className="hover:underline cursor-pointer transition-colors"
                      >
                        {isDefineIndependentExpanded ? '收起独立定义说明' : '仍定义独立对象'}
                      </button>
                    </div>
                  </div>

                  {/* 按需展开: 查看差异 */}
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

                  {/* 按需展开: 仍定义独立对象 */}
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
                        className="w-full p-2 text-xs text-[#0F172A] bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] resize-none leading-relaxed"
                        placeholder="请说明核心业务区别..."
                      />

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#64748B]">
                          提交后 Semovix 将重估业务实体独立性
                        </span>
                        <button
                          type="button"
                          onClick={handleSubmitDistinction}
                          disabled={isReevaluating}
                          className="px-3 py-1 bg-[#0F172A] hover:bg-[#334155] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        >
                          {isReevaluating ? '分析中...' : '提交 Semovix 重新评估'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : reuseStatus === 'reused' ? (
                /* 状态 2: 已选择复用客服坐席 */
                <div className="bg-[#ECFDF5]/50 border border-[#A7F3D0] rounded-lg p-4 space-y-2.5 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-[#059669]">
                      <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                      <span>已确认复用正式对象「客服坐席」</span>
                    </div>
                    <button
                      onClick={() => setReuseStatus('pending')}
                      className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                    >
                      重新评估
                    </button>
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    「热线坐席」将作为「客服坐席」的专属业务别名与热线渠道特化视图进行沉淀，复用其已有 182 条数据台账与工单分配关系，避免业务实体分裂。
                  </p>
                </div>
              ) : (
                /* 状态 3: 已评估通过独立创建 */
                <div className="bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-lg p-4 space-y-2.5 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-[#2563EB]">
                      <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                      <span>Semovix 评估认可独立业务对象身份</span>
                    </div>
                    <button
                      onClick={() => setReuseStatus('pending')}
                      className="text-[11px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                    >
                      修改依据
                    </button>
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    已记录核心区别：语音热线专属排班技能体系与独立业务指标沉淀。允许在「公共服务」业务域下独立创建。
                  </p>
                </div>
              )}
            </div>

            {/* Divider 分隔线 */}
            <div className="border-t border-[#E2E8F0]" />

            {/* ================= 右侧第二块：当前理解 (最多3行) ================= */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#475569]">
                <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                <span>当前理解</span>
              </div>
              <p className="text-xs text-[#334155] leading-relaxed">
                热线坐席表示公共服务领域中承担服务热线咨询、受理和协同职责的业务主体；Semovix 建议通过坐席编号稳定识别，并与组织机构、服务工单形成核心业务关系。
              </p>

              {/* 相关语义 (降权为下方一行) */}
              <div className="pt-2 border-t border-[#E2E8F0]/70 flex flex-wrap items-baseline gap-1 text-[11px]">
                <span className="text-[#64748B] font-semibold">相关语义：</span>
                <span className="text-[#475569]">
                  热线服务 · 服务受理 · 组织机构 · 服务工单
                </span>
              </div>
            </div>

            {/* Divider 分隔线 */}
            <div className="border-t border-[#E2E8F0]" />

            {/* ================= 右侧第三块：语义适配 ================= */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#475569]">语义适配：</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] inline-flex items-center space-x-1">
                  <Check className="w-3 h-3 text-[#059669]" />
                  <span>适合作为业务对象</span>
                </span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                当前内容可以形成稳定的业务主体集合，并被企业持续识别和引用。
              </p>
            </div>

            {/* Divider 分隔线 */}
            <div className="border-t border-[#E2E8F0]" />

            {/* ================= 右侧第四块：定义依据 ================= */}
            <div className="space-y-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#475569]">
                <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
                <span>定义依据</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start space-x-2 text-[#334155]">
                  <span className="text-[#94A3B8]">•</span>
                  <div>
                    <span className="font-semibold text-[#0F172A]">用户输入</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[#334155]">
                  <span className="text-[#94A3B8]">•</span>
                  <div>
                    <span className="font-semibold text-[#0F172A]">《公共服务热线运行管理办法》</span>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      第 3 章 · 服务岗位职责
                    </div>
                  </div>
                </div>
              </div>

              {/* 依据底部条 */}
              <div className="pt-2 border-t border-[#E2E8F0]/70 flex items-center justify-between text-xs">
                <span className="text-[#64748B]">已引用 2 项依据</span>
                <button
                  onClick={() => setIsEvidenceDrawerOpen(true)}
                  className="text-[#2563EB] hover:underline font-medium cursor-pointer flex items-center space-x-0.5"
                >
                  <span>查看依据</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* =========================================================================
          Drawer 1: 定义依据与来源追溯 (Evidence Drawer)
      ========================================================================= */}
      {isEvidenceDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">定义依据与来源追溯</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  查看当前业务对象定义的制度凭据与提取过程
                </p>
              </div>
              <button
                onClick={() => setIsEvidenceDrawerOpen(false)}
                className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#334155]">
              {/* 来源 1: 用户输入 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 font-bold text-[#0F172A]">
                  <span className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>来源一：用户交互式创建草稿</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1">
                  <div><span className="text-[#64748B]">创建人：</span>张伟 (某市大数据中心 · 业务架构岗)</div>
                  <div><span className="text-[#64748B]">创建方式：</span>业务语义中心 · 新建业务对象向导</div>
                  <div><span className="text-[#64748B]">输入语义核心：</span>“定义热线接听电话的坐席人员”</div>
                </div>
              </div>

              {/* 来源 2: 制度文件 */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 font-bold text-[#0F172A]">
                  <span className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>来源二：《公共服务热线运行管理办法》</span>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-[#64748B]">发文字号：</span>市政发〔2024〕18号</div>
                    <div><span className="text-[#64748B]">生效版本：</span>V2.1 正式施行</div>
                    <div><span className="text-[#64748B]">适用范围：</span>全市公共服务热线中心</div>
                    <div><span className="text-[#64748B]">引用章节：</span>第 3 章 · 服务岗位职责</div>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <span className="font-semibold text-[#0F172A] block mb-1">
                      条款原文摘录（第 12 条【热线坐席职责界定】）：
                    </span>
                    <blockquote className="p-2.5 bg-white border-l-2 border-l-[#2563EB] border border-[#E2E8F0] text-[11px] text-[#334155] leading-relaxed rounded-r">
                      “热线坐席负责接听市民与企事业单位诉求电话，提供政策法规咨询、即时解答、诉求受理、在线协同及工单派发，保证 7×24 小时服务闭环。”
                    </blockquote>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B] space-y-1">
                    <span className="font-semibold text-[#0F172A]">Semovix 语义提取与结构化：</span>
                    <ul className="list-disc list-inside space-y-0.5 pl-1">
                      <li>抽取“咨询、受理和协同服务职责”作为业务定义规范表述；</li>
                      <li>识别并建议将“坐席编号”作为主体唯一识别码；</li>
                      <li>发现与已有全渠道“客服坐席”存在相近业务语义，触发复用拦截检查。</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                type="button"
                onClick={() => setIsEvidenceDrawerOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Drawer 2: 引用业务资料 (Business Materials Drawer)
      ========================================================================= */}
      {isMaterialsDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">引用业务资料</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  已引用 1 份文件作为本业务对象的定义依据与口径标准
                </p>
              </div>
              <button
                onClick={() => setIsMaterialsDrawerOpen(false)}
                className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-4 bg-white border border-[#BFDBFE] rounded-lg space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-bold text-[#0F172A] text-xs">
                      《公共服务热线运行管理办法》
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                    已生效
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  归口部门：市政务服务和数字化建设管理局 · 2024年修订版
                </p>
                <p className="text-xs text-[#334155] leading-relaxed">
                  本办法规定了热线中心机构职责、坐席岗位职能、工单分派规范以及质检与评价标准，是热线坐席业务主体设定的最高制度依据。
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0F172A]">企业推荐可关联参考资料</span>
                  <span className="text-[10px] text-[#94A3B8]">供后续指标扩展</span>
                </div>
                <div className="space-y-2 text-[11px] text-[#475569]">
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E2E8F0]">
                    <span>《市政务服务工单分类与代码规范》</span>
                    <button
                      onClick={() => addToast?.('info', '已记录参考意向', '已将《工单分类代码》添加为候选关系依据')}
                      className="text-[#2563EB] hover:underline"
                    >
                      关联引用
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E2E8F0]">
                    <span>《12345热线服务质检与满意度考核办法》</span>
                    <button
                      onClick={() => addToast?.('info', '已记录参考意向', '已将《热线质检办法》添加为候选关系依据')}
                      className="text-[#2563EB] hover:underline"
                    >
                      关联引用
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                type="button"
                onClick={() => setIsMaterialsDrawerOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Drawer 3: 关键语义草稿查看并调整 (Key Semantics Adjust Drawer)
          严格约束：纯业务层概念，绝对无任何物理字段/VARCHAR/SQL/FK
      ========================================================================= */}
      {isSemanticsAdjustDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">调整关键语义草稿</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  调整主体标识、业务属性与核心关系定义（发布前按需维护）
                </p>
              </div>
              <button
                onClick={() => setIsSemanticsAdjustDrawerOpen(false)}
                className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#334155]">
              {/* 1. 主体标识选择 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-[#0F172A]">
                  <Key className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>主体标识角色</span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  标识该业务主体在全域语义层唯一性的核心属性代码。
                </p>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#0F172A] text-xs">{identityAttr}</span>
                    <p className="text-[11px] text-[#64748B]">
                      热线业务系统中唯一识别坐席的主体标识代码
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded text-[10px] font-bold">
                    唯一标识
                  </span>
                </div>
              </div>

              {/* 2. 关键属性列表 */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-1.5 font-bold text-[#0F172A]">
                  <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>关键属性定义</span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  反映业务主体核心特性的关键业务属性，可在发布后由系统自动匹配数据源。
                </p>

                <div className="space-y-2">
                  {keyAttributes.map((attr, idx) => (
                    <div
                      key={attr.id}
                      className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={attr.name}
                            onChange={(e) => {
                              const newArr = [...keyAttributes];
                              newArr[idx].name = e.target.value;
                              setKeyAttributes(newArr);
                            }}
                            className="font-bold text-xs text-[#0F172A] border-b border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none px-1 py-0.5"
                          />
                          {attr.isIdentity && (
                            <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-[#92400E] rounded text-[10px]">
                              主体标识
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={attr.meaning}
                        onChange={(e) => {
                          const newArr = [...keyAttributes];
                          newArr[idx].meaning = e.target.value;
                          setKeyAttributes(newArr);
                        }}
                        className="w-full text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 核心关系 */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-1.5 font-bold text-[#0F172A]">
                  <ArrowRight className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>核心业务关系</span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  定义该对象与企业已有其他业务对象的关联链路。若目标对象尚未建立，可选择“待确认”。
                </p>

                <div className="space-y-2">
                  {coreRelationships.map((rel, idx) => (
                    <div
                      key={rel.id}
                      className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[#0F172A]">{rel.name}</span>
                        <span className="text-[#94A3B8]">→</span>
                        <span className="font-bold text-[#2563EB]">{rel.targetObject}</span>
                        <span className="text-[11px] text-[#64748B]">({rel.multiplicity})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                        {rel.targetStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsSemanticsAdjustDrawerOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                保存调整
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="px-4 py-1.5 rounded-md bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-md border border-[#CBD5E1] text-xs text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
              >
                返回继续对比
              </button>
              <button
                type="button"
                onClick={handleConfirmReuse}
                className="px-4 py-1.5 rounded-md bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer shadow-xs"
              >
                确认复用「客服坐席」
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Modal 3: 发布成功确认弹窗
      ========================================================================= */}
      {showPublishSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in-50 zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto">
              <CheckCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0F172A]">
                业务对象「{objectName}」发布就绪
              </h3>
              <p className="text-xs text-[#64748B]">
                {reuseStatus === 'reused'
                  ? '已作为「客服坐席」的特化形式完成全域语义登记。'
                  : '已作为独立业务对象沉淀至「公共服务」业务域。'}
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-left text-xs space-y-1.5 text-[#475569]">
              <div className="flex justify-between">
                <span>主体标识：</span>
                <span className="font-semibold text-[#0F172A]">{identityAttr}</span>
              </div>
              <div className="flex justify-between">
                <span>业务域：</span>
                <span className="font-semibold text-[#0F172A]">{businessDomain}</span>
              </div>
              <div className="flex justify-between">
                <span>定义依据：</span>
                <span className="font-semibold text-[#0F172A]">《公共服务热线运行管理办法》</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setShowPublishSuccessModal(false)}
                className="px-3.5 py-1.5 rounded-md border border-[#CBD5E1] text-xs text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
              >
                留在页面
              </button>
              <button
                type="button"
                onClick={handleFinalPublishConfirm}
                className="px-4 py-1.5 rounded-md bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] cursor-pointer shadow-xs"
              >
                确认并返回目录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
