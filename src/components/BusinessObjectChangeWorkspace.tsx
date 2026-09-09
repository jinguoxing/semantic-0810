import React, { useMemo, useState, useSyncExternalStore } from 'react';
import {
  FileText,
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Layers,
  Database,
  Info,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { BusinessEvidenceDrawer } from './business-object/BusinessEvidenceDrawer';
import { BusinessObjectPublishDialog } from './business-object/BusinessObjectPublishDialog';
import {
  businessObjectRepository,
  listRevisions,
  nextRevisionLabel,
  publishDraft,
  saveChangeDraft,
  subscribe,
  getVersion,
  type BusinessObjectDefinitionSnapshot,
  type EvidenceReference
} from '../domain/business-object';

export interface BusinessObjectChangeWorkspaceProps {
  /** 被修改的正式业务对象（禁止写死服务工单） */
  objectId: string;
  onCancel: () => void;
  /** 发布成功后打开新的正式版本（业务视角） */
  onPublished?: (objectId: string) => void;
  onNavigateToSemantics?: () => void;
  onNavigateToObjectsList?: () => void;
  onNavigateToObjectDetail?: (objectId: string) => void;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const BusinessObjectChangeWorkspace: React.FC<BusinessObjectChangeWorkspaceProps> = ({
  objectId,
  onCancel,
  onPublished,
  onNavigateToObjectsList,
  onNavigateToObjectDetail,
  addToast
}) => {
  // 正式对象唯一事实源：领域 Store（名称 / 业务域 / 正式定义 / 别名 / 当前修订号）
  const stateVersion = useSyncExternalStore(subscribe, getVersion);
  const businessObject = useMemo(() => {
    void stateVersion;
    return businessObjectRepository.get(objectId);
  }, [stateVersion, objectId]);

  const objectName = businessObject?.name ?? objectId;
  const domain = businessObject?.domain ?? '—';
  const officialDefinition = businessObject?.definition ?? '（未找到正式定义）';
  const baseRevision = businessObject?.currentRevision ?? 'R1';
  const nextRevision = useMemo(() => {
    void stateVersion;
    return nextRevisionLabel(objectId);
  }, [stateVersion, objectId]);
  const revisionCount = useMemo(() => {
    void stateVersion;
    return listRevisions(objectId).length;
  }, [stateVersion, objectId]);

  // Draft Form States
  const [changeReason, setChangeReason] = useState(
    '根据新版业务资料，进一步明确“服务工单”覆盖热线、线上和窗口等公共服务渠道，并增加“来源渠道”关键属性。'
  );
  const [definition, setDefinition] = useState(
    '表示公众通过热线、线上、窗口等公共服务渠道提出诉求，并经过受理、办理和办结的统一业务主体。'
  );
  const [showOfficialDefinition, setShowOfficialDefinition] = useState(false);

  // Aliases State（正式别名来自领域 Store，新增别名标记 isNew）
  const [aliases, setAliases] = useState<Array<{ text: string; isNew?: boolean }>>(() =>
    (businessObject?.aliases ?? []).map((text) => ({ text })).concat([{ text: '群众诉求工单', isNew: true }])
  );
  const [newAliasInput, setNewAliasInput] = useState('');

  // Drawers & Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [isKeySemanticsDrawerOpen, setIsKeySemanticsDrawerOpen] = useState(false);
  const [isImpactDrawerOpen, setIsImpactDrawerOpen] = useState(false);

  // 修改依据：用户修改说明 + 新版制度文件 + 领域 Store 中该对象的正式定义依据（禁止页面写死正式定义）
  const changeEvidence: EvidenceReference[] = [
    {
      id: 'ev-change-user-note',
      kind: 'DECISION',
      title: '用户修改说明',
      source: '工作区输入',
      adoptedDecision:
        '用户指定需要进一步明确“服务工单”覆盖热线、线上和窗口等全域渠道，并增加“来源渠道”作为核心业务识别特征。'
    },
    {
      id: 'ev-change-document',
      kind: 'DOCUMENT',
      title: '新版《公共服务热线运行管理办法》',
      source: '制度文件',
      location: '第 2 章 · 第 5 条',
      adoptedDecision:
        '“建立涵盖电话热线、政务服务网、移动客户端及线下办事窗口的一体化服务工单受理与协同督办机制。”'
    },
    ...(businessObject?.evidence ?? [])
  ];

  /** 组装 CHANGE 草稿快照：以正式对象为基线，叠加本次草稿修改 */
  const buildSnapshot = (): BusinessObjectDefinitionSnapshot | undefined => {
    if (!businessObject) return undefined;
    const newAttribute = {
      id: 'attr-source-channel',
      name: '来源渠道',
      meaning: '表示当前服务工单由哪个公共服务渠道形成（热线、线上平台、政务窗口等）。'
    };
    const attributes = businessObject.attributes.some((attribute) => attribute.name === newAttribute.name)
      ? businessObject.attributes
      : [...businessObject.attributes, newAttribute];
    return {
      name: businessObject.name,
      aliases: aliases.map((alias) => alias.text),
      definition,
      domain: businessObject.domain,
      identity: businessObject.identity,
      attributes,
      relationships: businessObject.relationships,
      evidence: [...businessObject.evidence, ...changeEvidence.filter((item) => item.kind === 'DOCUMENT')]
    };
  };

  // Optimizing States
  const [isOptimizingReason, setIsOptimizingReason] = useState(false);
  const [isOptimizingDef, setIsOptimizingDef] = useState(false);

  const handleAddAlias = () => {
    const trimmed = newAliasInput.trim();
    if (!trimmed) return;
    if (aliases.some((a) => a.text === trimmed)) {
      addToast?.('warning', '别名已存在', `别名「${trimmed}」已在列表中`);
      return;
    }
    setAliases([...aliases, { text: trimmed, isNew: true }]);
    setNewAliasInput('');
    addToast?.('info', '已添加别名', `已添加别名「${trimmed}」`);
  };

  const handleRemoveAlias = (text: string) => {
    setAliases(aliases.filter((a) => a.text !== text));
  };

  const handleOptimizeReason = () => {
    setIsOptimizingReason(true);
    setTimeout(() => {
      setIsOptimizingReason(false);
      addToast?.('success', '语义表达已优化', '已微调变更说明的业务语义表达，更符合企业治理规范');
    }, 600);
  };

  const handleOptimizeDefinition = () => {
    setIsOptimizingDef(true);
    setTimeout(() => {
      setIsOptimizingDef(false);
      addToast?.('success', '业务定义已优化', '已校验全渠道诉求流转主体的语义严谨性');
    }, 600);
  };

  /** 保存草稿：saveChangeDraft（基于当前正式修订号），正式对象发布前不受影响 */
  const handleSaveDraftClick = () => {
    const snapshot = buildSnapshot();
    if (!snapshot) {
      addToast?.('error', '暂无法保存', '未在领域存储中找到该业务对象');
      return;
    }
    const draft = saveChangeDraft(objectId, baseRevision, snapshot);
    if (!draft) {
      addToast?.('error', '暂无法保存', '未在领域存储中找到该业务对象');
      return;
    }
    addToast?.(
      'success',
      '草稿已保存',
      `已保存「${objectName}」修改草稿（${draft.id}，基于 ${baseRevision}）；当前正式版本仍正常生效`
    );
  };

  /** 发布确认：publishDraft（CHANGE：校验 baseRevision，落地新正式修订） */
  const handleConfirmPublish = () => {
    setIsPublishModalOpen(false);
    const snapshot = buildSnapshot();
    if (!snapshot) {
      addToast?.('error', '发布失败', '未在领域存储中找到该业务对象');
      return;
    }
    const draft = saveChangeDraft(objectId, baseRevision, snapshot);
    if (!draft) {
      addToast?.('error', '发布失败', '未在领域存储中找到该业务对象');
      return;
    }
    const result = publishDraft(draft.id, {
      expectedBaseRevision: baseRevision,
      changedBy: '业务对象修改工作台',
      summary: changeReason.trim() || `更新「${objectName}」业务定义`,
      changes: [
        definition !== officialDefinition ? '更新业务定义（明确渠道范围描述）' : '业务定义保持不变',
        aliases.some((alias) => alias.isNew) ? `新增别名：${aliases.filter((alias) => alias.isNew).map((alias) => alias.text).join('、')}` : '',
        '新增关键属性「来源渠道」（尚未形成数据落地）'
      ].filter((change) => change !== '')
    });
    if (result.ok === false) {
      if (result.error === 'STALE_REVISION') {
        addToast?.('error', '发布冲突', '正式对象已被其他人更新，请返回后基于最新正式版本重新修改');
      } else {
        addToast?.('error', '发布失败', '发布未完成，请稍后重试');
      }
      return;
    }
    addToast?.(
      'success',
      '业务对象修改已发布',
      `「${objectName}」正式修订 ${result.revision} 已发布（${baseRevision} → ${result.revision}），历史版本已归档`
    );
    onPublished?.(objectId);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-[#0F172A] font-sans antialiased min-h-full flex flex-col">
      <div className="w-full max-w-[1440px] mx-auto px-6 py-5 lg:px-8 space-y-5 flex-1 flex flex-col">
        
        {/* ========================================================= */}
        {/* 1. PAGE HEADER                                            */}
        {/* ========================================================= */}
        <div className="space-y-3">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-1.5 text-xs text-[#64748B]">
            <span 
              onClick={onNavigateToObjectsList}
              className="hover:text-[#2563EB] cursor-pointer transition-colors"
            >
              业务语义
            </span>
            <span>/</span>
            <span 
              onClick={onNavigateToObjectsList}
              className="hover:text-[#2563EB] cursor-pointer transition-colors"
            >
              业务对象
            </span>
            <span>/</span>
            <span
              onClick={() => onNavigateToObjectDetail?.(objectId)}
              className="hover:text-[#2563EB] cursor-pointer transition-colors"
            >
              {objectName}
            </span>
            <span>/</span>
            <span className="text-[#0F172A] font-medium">修改</span>
          </nav>

          {/* Title & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  修改业务对象
                </h1>
                <span className="text-sm text-[#94A3B8] font-normal">
                  Change Business Object
                </span>
                
                {/* Object Name & Status Badge */}
                <div className="flex items-center space-x-2 pl-1">
                  <span className="text-xs text-[#475569] font-medium">
                    {objectName} · {domain}
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-normal bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    <span>已发布 · 当前正式版本 {baseRevision} 仍在生效</span>
                  </span>
                </div>
              </div>

              {/* Concise Helper Description */}
              <p className="text-xs text-[#64748B] leading-relaxed">
                当前修改将保存为工作草稿，只有发布后才会形成新的正式业务对象版本。
              </p>
            </div>

            {/* Top-Right Action Buttons (Single Set on Page) */}
            <div className="flex items-center space-x-2.5 shrink-0 pt-0.5">
              <button
                id="btn-cancel-change"
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-md transition-colors cursor-pointer"
              >
                取消
              </button>

              <button
                id="btn-save-draft"
                onClick={handleSaveDraftClick}
                className="px-3.5 py-1.5 text-xs font-medium text-[#1E293B] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-md transition-colors cursor-pointer"
              >
                保存草稿
              </button>

              <button
                id="btn-publish-change"
                onClick={() => setIsPublishModalOpen(true)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                发布
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. DUAL COLUMN WORKSPACE (64% / 36%)                      */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-100 gap-5 items-start flex-1">
          
          {/* ======================================================= */}
          {/* LEFT COLUMN: ~64% Business Object Change Draft          */}
          {/* ======================================================= */}
          <div className="lg:col-span-64 space-y-5">
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-2xs space-y-6">
              
              {/* SECTION A: 本次修改 (Natural Section Header) */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between border-b border-[#F1F5F9] pb-2.5">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-[#0F172A]">本次修改</h2>
                    <p className="text-xs text-[#64748B]">
                      说明本次修改的业务目的及其定义依据。
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <button
                      onClick={() => setIsEvidenceDrawerOpen(true)}
                      className="text-[#2563EB] hover:text-[#1D4ED8] font-medium cursor-pointer transition-colors"
                    >
                      引用业务资料
                    </button>
                    <span className="text-[#E2E8F0]">|</span>
                    <button
                      onClick={() => setIsEvidenceDrawerOpen(true)}
                      className="text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
                    >
                      查看依据
                    </button>
                  </div>
                </div>

                {/* Change Reason Textarea */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <textarea
                      id="input-change-reason"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-xs text-[#1E293B] bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] focus:bg-white transition-all resize-none leading-relaxed"
                    />
                    <button
                      onClick={handleOptimizeReason}
                      disabled={isOptimizingReason}
                      className="absolute right-2.5 bottom-2.5 text-[11px] text-[#64748B] hover:text-[#2563EB] flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-[#2563EB]" />
                      <span>{isOptimizingReason ? '优化中...' : '优化说明'}</span>
                    </button>
                  </div>

                  {/* Sources Footnote */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#64748B] pt-0.5">
                    <span className="text-[#94A3B8]">修改来源：</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] text-[11px]">
                      用户修改说明
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] text-[11px]">
                      新版《公共服务热线运行管理办法》
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] text-[11px]">
                      当前正式定义
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION B: 核心定义 (Natural Section Header) */}
              <div className="space-y-4 pt-1">
                <div className="border-b border-[#F1F5F9] pb-2.5 space-y-0.5">
                  <h2 className="text-sm font-bold text-[#0F172A]">核心定义</h2>
                  <p className="text-xs text-[#64748B]">
                    编辑当前业务对象的新版本定义；发布前，当前正式定义继续生效。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 业务对象名称 */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#334155] block">
                      业务对象名称
                    </label>
                    <input
                      type="text"
                      value={objectName}
                      readOnly
                      className="w-full px-3 py-1.5 text-xs text-[#1E293B] bg-[#F8FAFC] border border-[#CBD5E1] rounded-md cursor-default select-none"
                    />
                  </div>

                  {/* 主要业务域 */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#334155] block">
                      主要业务域
                    </label>
                    <input
                      type="text"
                      value={domain}
                      readOnly
                      className="w-full px-3 py-1.5 text-xs text-[#1E293B] bg-[#F8FAFC] border border-[#CBD5E1] rounded-md cursor-default select-none"
                    />
                    <p className="text-[11px] text-[#94A3B8] leading-tight pt-0.5">
                      用于标识主要业务上下文与治理归属，不限制该对象被其他业务域复用。
                    </p>
                  </div>
                </div>

                {/* 业务定义 (First Visual Priority) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-semibold text-[#0F172A]">
                        业务定义
                      </label>
                      <span className="px-1.5 py-0.2 rounded text-[11px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                        已修改
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      id="input-business-definition"
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-xs text-[#1E293B] bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all resize-none leading-relaxed"
                    />
                    <button
                      onClick={handleOptimizeDefinition}
                      disabled={isOptimizingDef}
                      className="absolute right-2.5 bottom-2.5 text-[11px] text-[#64748B] hover:text-[#2563EB] flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-[#2563EB]" />
                      <span>{isOptimizingDef ? '优化中...' : '优化定义'}</span>
                    </button>
                  </div>

                  {/* Weak toggle for official definition */}
                  <div className="pt-0.5">
                    <button
                      onClick={() => setShowOfficialDefinition(!showOfficialDefinition)}
                      className="text-xs text-[#2563EB] hover:underline cursor-pointer inline-flex items-center space-x-1 font-medium"
                    >
                      <span>{showOfficialDefinition ? '收起当前正式定义' : '查看当前正式定义'}</span>
                    </button>

                    {showOfficialDefinition && (
                      <div className="mt-2 p-2.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569] space-y-1">
                        <div className="text-[11px] text-[#64748B] font-medium">
                          当前正式生效定义（{baseRevision}，发布前仍对外有效）：
                        </div>
                        <p className="leading-relaxed text-[#334155]">
                          {officialDefinition}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 别名 Token Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-[#334155] block">
                    别名
                  </label>
                  <div className="p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md flex flex-wrap items-center gap-1.5">
                    {aliases.map((alias) => (
                      <span
                        key={alias.text}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs transition-colors ${
                          alias.isNew
                            ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                            : 'bg-white text-[#334155] border border-[#E2E8F0]'
                        }`}
                      >
                        <span>{alias.text}</span>
                        {alias.isNew && (
                          <span className="text-[10px] px-1 py-0.2 bg-[#DBEAFE] text-[#1E40AF] rounded font-medium">
                            新增
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveAlias(alias.text)}
                          className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    
                    <div className="inline-flex items-center">
                      <input
                        type="text"
                        value={newAliasInput}
                        onChange={(e) => setNewAliasInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAlias();
                          }
                        }}
                        placeholder="+ 输入别名后回车"
                        className="text-xs bg-transparent border-none focus:outline-none placeholder-[#94A3B8] text-[#1E293B] px-1.5 py-0.5 w-28"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION C: 关键语义草稿 (Natural Section Header) */}
              <div className="space-y-3 pt-1 border-t border-[#F1F5F9]">
                <div className="flex items-baseline justify-between pt-2">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-[#0F172A]">关键语义草稿</h2>
                    <p className="text-xs text-[#64748B]">
                      只展示本次发生变化的关键语义，其余内容继续沿用当前正式版本。
                    </p>
                  </div>

                  <button
                    onClick={() => setIsKeySemanticsDrawerOpen(true)}
                    className="text-xs text-[#2563EB] hover:underline font-medium cursor-pointer"
                  >
                    查看并调整
                  </button>
                </div>

                {/* Main Content: 新增关键属性 (Summary State) */}
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#0F172A]">
                        新增关键属性：来源渠道
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        已纳入草稿
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed">
                    属性定义：表示当前服务工单由哪个公共服务渠道形成。
                  </p>
                </div>

                {/* Retained Content in Current Official Version */}
                <div className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-md space-y-2.5 text-xs text-[#334155]">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#64748B]">主体标识：</span>
                      <span className="font-semibold text-[#0F172A]">{businessObject?.identity.name ?? '—'}</span>
                    </div>

                    <div className="flex items-start space-x-1.5">
                      <span className="text-[#64748B] shrink-0">其他关键属性：</span>
                      <span className="text-[#334155]">
                        {(businessObject?.attributes ?? [])
                          .filter((attribute) => !attribute.isIdentifier)
                          .map((attribute) => attribute.name)
                          .join('、') || '—'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-[#64748B] block">核心业务关系：</span>
                      <div className="space-y-1 pl-1 text-xs text-[#334155]">
                        {(businessObject?.relationships ?? []).map((relationship) => (
                          <div key={relationship.id} className="flex items-center space-x-1.5">
                            <span>{objectName}</span>
                            <span className="text-[#94A3B8]">─{relationship.relationName}→</span>
                            <span className="font-medium text-[#0F172A]">{relationship.targetObjectName}</span>
                          </div>
                        ))}
                        {(businessObject?.relationships ?? []).length === 0 && (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#94A3B8] border-t border-[#F1F5F9] pt-2">
                    主体标识与核心关系沿用当前正式版本（{baseRevision}）。
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN: ~36% Change Understanding Inspector       */}
          {/* ======================================================= */}
          <div className="lg:col-span-36 space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-2xs space-y-5">
              
              {/* Inspector Header */}
              <div className="border-b border-[#F1F5F9] pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline space-x-2">
                    <h2 className="text-sm font-bold text-[#0F172A]">变更理解</h2>
                    <span className="text-xs text-[#94A3B8]">Change Understanding</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal bg-[#F1F5F9] text-[#475569]">
                    已根据当前草稿更新
                  </span>
                </div>
              </div>

              {/* 1. 本次变化 (Natural Section Header) */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#0F172A]">本次变化</h3>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <div className="font-semibold text-[#0F172A]">明确渠道范围</div>
                    <p className="text-[#475569] leading-relaxed text-[11px]">
                      在原“公共服务渠道”定义中，进一步明确热线、线上和窗口等渠道，不改变“服务工单”的核心业务主体身份。
                    </p>
                  </div>

                  <div className="p-2.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <div className="font-semibold text-[#0F172A]">新增别名</div>
                    <p className="text-[#475569] text-[11px]">
                      群众诉求工单
                    </p>
                  </div>

                  <div className="p-2.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <div className="font-semibold text-[#0F172A]">新增关键属性</div>
                    <p className="text-[#475569] text-[11px]">
                      来源渠道
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-[#94A3B8] pt-0.5">
                  主体身份与核心业务关系保持不变。
                </p>
              </div>

              {/* 2. 对象边界 (Natural Section Header) */}
              <div className="space-y-2 pt-1 border-t border-[#F1F5F9]">
                <h3 className="text-xs font-bold text-[#0F172A]">对象边界</h3>
                
                <div className="p-2.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-xs text-[#166534] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    <span>未发现需要处理的新增对象边界冲突</span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    修改后的定义仍表示跨公共服务渠道统一管理的“服务工单”。
                  </p>
                </div>

                <p className="text-[11px] text-[#64748B]">
                  当前草稿仍适合作为业务对象。
                </p>
              </div>

              {/* 3. 数据支撑影响 (Natural Section Header) */}
              <div className="space-y-2.5 pt-1 border-t border-[#F1F5F9]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A]">数据支撑影响</h3>
                  <button
                    onClick={() => setIsImpactDrawerOpen(true)}
                    className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                  >
                    查看影响详情
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-medium text-[#1E293B]">
                      现有数据实现和属性扩展继续有效
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      本次未改变服务工单的主体、记录粒度或实例身份规则。
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-medium text-[#1E293B]">
                      新增“来源渠道”尚未形成正式数据落地
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      发布后 Semovix 将继续识别可能的字段支撑；当前暂无映射不阻塞业务对象版本发布。
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-medium text-[#1E293B]">
                      核心关系与相关数据不受影响
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. 修改依据 (Natural Section Header) */}
              <div className="space-y-2 pt-1 border-t border-[#F1F5F9]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A]">修改依据</h3>
                  <button
                    onClick={() => setIsEvidenceDrawerOpen(true)}
                    className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                  >
                    查看依据
                  </button>
                </div>

                <div className="space-y-1 text-xs text-[#475569]">
                  <div className="py-1 border-b border-[#F8FAFC]">用户修改说明</div>
                  <div className="py-1 border-b border-[#F8FAFC]">新版《公共服务热线运行管理办法》</div>
                  <div className="py-1">当前正式业务对象定义</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. LIGHTWEIGHT PUBLISH CONFIRMATION MODAL（共享组件）       */}
      {/* ========================================================= */}
      <BusinessObjectPublishDialog
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirm={handleConfirmPublish}
        objectName={objectName}
        title="确认发布业务对象修改"
        confirmLabel="发布修改"
        currentRevision={baseRevision}
        nextRevision={nextRevision}
        changeSummary={[
          '明确服务工单的渠道范围描述',
          '新增别名“群众诉求工单”',
          '新增关键属性“来源渠道”'
        ]}
        dataSupportNotes={[
          '现有数据实现继续有效',
          '新增属性尚未形成数据落地',
          '发布后继续识别和校验可能的字段支撑'
        ]}
        impactSummary={[
          `正式修订号 ${baseRevision} → ${nextRevision}，${baseRevision} 自动归档为历史版本（历史共 ${revisionCount} 条修订）`,
          '现有数据支撑绑定不受影响，不产生数据支撑修订'
        ]}
      />

      {/* ========================================================= */}
      {/* 4. LEAVE CONFIRMATION MODAL                               */}
      {/* ========================================================= */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#0F172A]">保留草稿或放弃修改？</h3>
              <p className="text-xs text-[#64748B]">
                当前修改尚未发布为正式版本，您可以将本次修改保留为草稿以便后续继续编辑。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="w-full sm:w-auto px-3.5 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                继续编辑
              </button>
              <button
                onClick={() => {
                  setIsLeaveModalOpen(false);
                  onCancel();
                }}
                className="w-full sm:w-auto px-3.5 py-1.5 text-xs text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-md cursor-pointer transition-colors"
              >
                放弃修改
              </button>
              <button
                onClick={() => {
                  setIsLeaveModalOpen(false);
                  handleSaveDraftClick();
                  onCancel();
                }}
                className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md cursor-pointer transition-colors shadow-2xs"
              >
                保存草稿
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. EVIDENCE DRAWER（共享组件：修改说明 + 领域 Store 依据） */}
      {/* ========================================================= */}
      <BusinessEvidenceDrawer
        isOpen={isEvidenceDrawerOpen}
        onClose={() => setIsEvidenceDrawerOpen(false)}
        objectName={objectName}
        title="修改依据明细"
        subtitle="支撑本次业务对象修改与边界调整的业务资料"
        evidence={changeEvidence}
      />

      {/* ========================================================= */}
      {/* 6. KEY SEMANTICS ADJUSTMENT DRAWER                        */}
      {/* ========================================================= */}
      {isKeySemanticsDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsKeySemanticsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white border-l border-[#E2E8F0] shadow-xl flex flex-col">
              <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-[#0F172A]">关键语义视图</h3>
                  <p className="text-xs text-[#64748B]">
                    在纯业务语义层查看与调整对象关键属性与核心业务关系
                  </p>
                </div>
                <button
                  onClick={() => setIsKeySemanticsDrawerOpen(false)}
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
                {/* 新增属性 */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0F172A]">本次新增属性</h4>
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1E40AF]">来源渠道</span>
                      <span className="text-[10px] bg-[#DBEAFE] text-[#1E40AF] px-1.5 py-0.2 rounded font-medium">
                        草稿待发布
                      </span>
                    </div>
                    <p className="text-[#334155] leading-relaxed text-[11px]">
                      表示当前服务工单由哪个公共服务渠道形成（热线、线上平台、政务窗口等）。
                    </p>
                  </div>
                </div>

                {/* 沿用属性 */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0F172A]">沿用正式属性</h4>
                  <div className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded-md overflow-hidden bg-white">
                    {(businessObject?.attributes ?? []).map((attribute) => (
                      <div key={attribute.id} className="p-2.5 flex items-center justify-between">
                        <span className="font-medium text-[#0F172A]">{attribute.name}</span>
                        <span className="text-[11px] text-[#64748B]">
                          {attribute.isIdentifier ? '主体唯一标识' : '关键属性'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 核心业务关系 */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0F172A]">核心业务关系</h4>
                  <div className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded-md overflow-hidden bg-white">
                    {(businessObject?.relationships ?? []).map((relationship) => (
                      <div key={relationship.id} className="p-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[#475569]">{objectName}</span>
                          <span className="text-[#94A3B8]">─{relationship.relationName}→</span>
                          <span className="font-semibold text-[#0F172A]">{relationship.targetObjectName}</span>
                        </div>
                        <span className="text-[11px] text-[#64748B]">沿用当前生效关系</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. DATA IMPACT DETAILS DRAWER                             */}
      {/* ========================================================= */}
      {isImpactDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsImpactDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-[#E2E8F0] shadow-xl flex flex-col">
              <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-[#0F172A]">数据支撑影响说明</h3>
                  <p className="text-xs text-[#64748B]">
                    本次业务语义变更对现有数据支撑和下游调用的影响分析
                  </p>
                </div>
                <button
                  onClick={() => setIsImpactDrawerOpen(false)}
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1.5">
                  <div className="font-semibold text-[#0F172A]">现有数据实现运行状态</div>
                  <p className="text-[#475569] leading-relaxed">
                    现有主数据实现表与流水表继续正常支撑「服务工单」的实例查询与分析，由于本次修改不涉及主体粒度变化，现有数据流转完全不受破坏。
                  </p>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1.5">
                  <div className="font-semibold text-[#0F172A]">新增属性的数据落地策略</div>
                  <p className="text-[#475569] leading-relaxed">
                    新增的关键属性“来源渠道”尚未绑定物理字段。发布业务对象定义后，Semovix 将在后台根据新版《公共服务热线运行管理办法》及全域数据资产目录自动推荐潜在的数据支撑候选，该过程异步进行，不影响业务对象的定义生效。
                  </p>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1.5">
                  <div className="font-semibold text-[#0F172A]">下游服务与业务指标</div>
                  <p className="text-[#475569] leading-relaxed">
                    依赖于「服务工单」的既有衍生指标（如工单办结率、准时办结率）与数据服务 API 保持正常运转。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
