import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  X,
  Copy,
  Check,
  Network,
  Database,
  FileText,
  Edit3,
  MoreHorizontal,
  ExternalLink,
  BookOpen,
  History,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  businessObjectRepository,
  dataSupportService,
  groundingService,
  listRevisions,
  subscribe,
  getVersion
} from '../domain/business-object';
import type { BusinessObject } from '../domain/business-object';
import {
  LocalGroundingCorrectionDrawer,
  CandidateFieldOption
} from './LocalGroundingCorrectionDrawer';
import { BusinessEvidenceDrawer } from './business-object/BusinessEvidenceDrawer';
import { BusinessObjectHistoryDrawer } from './business-object/BusinessObjectHistoryDrawer';

export interface BusinessObjectDetailWorkspaceProps {
  objectId?: string;
  initialTab?: 'business' | 'data_support';
  fromGoalSearch?: boolean;
  goalQuery?: string;
  onBackToResources?: () => void;
  onBackToObjectsList?: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToMyRequests?: () => void;
  onNavigateToDataAssetDetail?: (assetId: string) => void;
  onNavigateToMetricDetail?: (metricId: string) => void;
  onNavigateToApiDetail?: (apiId: string) => void;
  onNavigateToKnowledgeNetwork?: (objectId: string) => void;
  onExploreResourcesForObject?: (objectName: string, attributeName?: string) => void;
  onFindDataWithObjectGoal?: (objectName: string) => void;
  onNavigateToBusinessObjectDetail?: (objectId: string, initialTab?: 'business' | 'data_support') => void;
  onNavigateToChangeBusinessObject?: (objectId: string) => void;
  /** 数据支撑复核入口：对象存在 NEEDS_REVALIDATION 绑定时展示复核引导 */
  onNavigateToRevalidation?: () => void;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

interface KeyAttribute {
  name: string;
  meaning: string;
  isIdentifier?: boolean;
}

interface CoreRelationship {
  sourceObject: string;
  relationName: string;
  targetObject: string;
  targetId: string;
  meaning: string;
}

interface BusinessTermItem {
  id: string;
  name: string;
  definition: string;
  domain: string;
}

interface RelatedMetricItem {
  id: string;
  name: string;
  definition: string;
  domain: string;
}

// Data Support Perspective Data Models (view models built from the domain store)
export type DataImplementationId = string;

export interface DataImplementationAttributeLanding {
  name: string;
  source: string;
  isExtension?: boolean;
  field: string;
  semantics: string;
  isSupported: boolean;
  isIdentifier?: boolean;
  needsCorrection?: boolean;
  correctionReason?: string;
  revisionVersion?: string;
}

export interface DataImplementationRelationshipLanding {
  sourceObject: string;
  relationName: string;
  targetObject: string;
  targetId: string;
  sourceField: string;
  targetIdentity: string;
}

export interface DataImplementationExtensionLanding {
  name: string;
  techName: string;
  status: string;
  parentImplementation: string;
  identityMapping: string;
  providedAttr: string;
  providedField: string;
  note: string;
}

export interface FormalDataImplementation {
  id: DataImplementationId;
  name: string;
  techName: string;
  warehouseTable: string;
  assetId: string;
  role: '主要数据实现' | '其他数据实现';
  status: string;
  scope: string;
  granularity: string;
  identity: string;
  subject: string;
  scopeRelationText: string;
  scopeRelationNote: string;
  attributes: DataImplementationAttributeLanding[];
  relationships: DataImplementationRelationshipLanding[];
  extension?: DataImplementationExtensionLanding | null;
}

export interface RelatedDataItem {
  name: string;
  role: string;
  scope: string;
  note: string;
}


/** 对象生命周期状态 → 展示标签 */
function objectStatusLabel(status: BusinessObject['status']): string {
  return status === 'PUBLISHED' ? '已发布' : status === 'DRAFT' ? '草稿' : '已停用';
}

/** 绑定状态 → 展示标签 */
function bindingStatusLabel(status: string): string {
  switch (status) {
    case 'EFFECTIVE':
      return '已生效';
    case 'CANDIDATE':
      return '候选待确认';
    case 'NEEDS_REVALIDATION':
      return '待复核';
    default:
      return '已退休';
  }
}

export const BusinessObjectDetailWorkspace: React.FC<BusinessObjectDetailWorkspaceProps> = ({
  objectId = 'bo_service_ticket',
  initialTab = 'business',
  onBackToObjectsList,
  onNavigateToBusinessObjectDetail,
  onNavigateToChangeBusinessObject,
  onNavigateToKnowledgeNetwork,
  onNavigateToMetricDetail,
  onNavigateToDataAssetDetail,
  onFindDataWithObjectGoal,
  onNavigateToRevalidation,
  addToast
}) => {
  // Active Tab: 业务视角 vs 数据支撑
  const [activeTab, setActiveTab] = useState<'business' | 'data_support'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, objectId]);

  // 订阅领域 Store：确认数据支撑 / 落地修正 / 状态流转后自动重渲染
  useSyncExternalStore(subscribe, getVersion);

  // Current Object — 所有内容来自领域仓库，禁止页面写死
  const currentObject: BusinessObject =
    businessObjectRepository.get(objectId) ?? businessObjectRepository.get('bo_service_ticket')!;

  // Attributes & Relationships（来自对象定义）
  const attributes: KeyAttribute[] = currentObject.attributes.map((attribute) => ({
    name: attribute.name,
    meaning: attribute.meaning,
    ...(attribute.isIdentifier ? { isIdentifier: true } : {})
  }));

  const relationships: CoreRelationship[] = currentObject.relationships.map((rel) => ({
    sourceObject: currentObject.name,
    relationName: rel.relationName,
    targetObject: rel.targetObjectName,
    targetId: rel.targetObjectId,
    meaning: rel.meaning
  }));

  // State for menus and drawers
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isKnowledgeDrawerOpen, setIsKnowledgeDrawerOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<BusinessTermItem | null>(null);

  // Data Support View State
  // 数据实现与绑定全部由领域仓库派生（刷新 / 复核 / 修正后自动同步）
  const domainImplementations = dataSupportService.listImplementations(currentObject.id);
  const bindings = dataSupportService.listBindings(currentObject.id);

  const implementations: FormalDataImplementation[] = domainImplementations.map((impl) => {
    const binding = bindings.find((item) => item.implementationId === impl.id);
    const groundingRevisions = groundingService.listByObject(currentObject.id);
    return {
      id: impl.id,
      name: impl.name,
      techName: impl.techName,
      warehouseTable: impl.warehouseTable,
      assetId: impl.assetId,
      role: binding?.role === 'PRIMARY' ? '主要数据实现' : '其他数据实现',
      status: binding ? bindingStatusLabel(binding.status) : '未绑定',
      scope: impl.scope,
      granularity: impl.granularity,
      identity: impl.identity,
      subject: currentObject.name,
      scopeRelationText: impl.scopeRelationText,
      scopeRelationNote: impl.scopeRelationNote,
      attributes: impl.attributes.map((attribute) => {
        const correctionRevisions = groundingRevisions.filter(
          (revision) =>
            revision.type === 'ATTRIBUTE' &&
            revision.targetName === attribute.attributeName &&
            revision.bindingId === binding?.id
        );
        const activeCorrection = correctionRevisions.find((revision) => revision.status === 'ACTIVE');
        return {
          name: attribute.attributeName,
          source: attribute.sourceName,
          ...(attribute.isExtension ? { isExtension: true } : {}),
          field: attribute.field,
          semantics: attribute.semantics,
          isSupported: attribute.isSupported,
          ...(attribute.isIdentifier ? { isIdentifier: true } : {}),
          ...(attribute.needsCorrection
            ? { needsCorrection: true, correctionReason: attribute.correctionReason }
            : {}),
          ...(activeCorrection
            ? {
                revisionVersion: `Revision ${correctionRevisions.length}（${activeCorrection.createdAt.slice(0, 10)} ${
                  activeCorrection.status === 'ACTIVE' ? '当前有效' : '历史'
                }）`
              }
            : {})
        };
      }),
      relationships: impl.relationships.map((relationship) => ({
        sourceObject: currentObject.name,
        relationName: relationship.relationName,
        targetObject: relationship.targetObjectName,
        targetId: relationship.targetObjectId,
        sourceField: relationship.sourceField,
        targetIdentity: relationship.targetIdentity
      })),
      extension: impl.extension ?? null
    };
  });

  const primaryImpl = implementations.find((impl) => impl.role === '主要数据实现');
  const objectRevisions = listRevisions(currentObject.id);

  const [selectedImplId, setSelectedImplId] = useState<DataImplementationId | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSetPrimaryModalOpen, setIsSetPrimaryModalOpen] = useState(false);
  const [isContextMoreOpen, setIsContextMoreOpen] = useState(false);
  const [isCorrectionDrawerOpen, setIsCorrectionDrawerOpen] = useState(false);
  const [selectedCorrectionAttr, setSelectedCorrectionAttr] = useState<DataImplementationAttributeLanding | null>(null);
  const [selectedCorrectionRel, setSelectedCorrectionRel] = useState<DataImplementationRelationshipLanding | null>(null);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const contextMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsSelectorOpen(false);
      }
      if (contextMoreRef.current && !contextMoreRef.current.contains(event.target as Node)) {
        setIsContextMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Current Implementation
  const currentImpl =
    implementations.find((impl) => impl.id === selectedImplId) ||
    implementations[0] ||
    null;

  // 待复核绑定数量（语义修订触发）
  const revalidationCount = bindings.filter((binding) => binding.status === 'NEEDS_REVALIDATION').length;

  // 关系落地修正候选：当前实现的落地字段（作为关系关联键候选）
  const relationshipCandidates: CandidateFieldOption[] = (currentImpl?.attributes ?? []).map((attr) => ({
    id: `rel-${attr.field}`,
    field: attr.field,
    label: attr.name,
    semanticType: attr.source,
    semantics: attr.semantics,
    evidence: `「${attr.name}」在「${currentImpl?.name ?? '当前数据实现'}」中的落地字段，可作为关系关联键候选。`,
    note: `来源：${attr.source}`
  }));

  const handleConfirmCorrection = (selectedField: CandidateFieldOption) => {
    if (!currentImpl) return;
    const binding = bindings.find((item) => item.implementationId === currentImpl.id);
    if (!binding) return;

    // 关系落地修正：targetName 约定「关系名 → 目标对象」，fromField 取 sourceField 的裸字段部分
    if (selectedCorrectionRel) {
      const relTargetName = `${selectedCorrectionRel.relationName} → ${selectedCorrectionRel.targetObject}`;
      const fromField =
        selectedCorrectionRel.sourceField.split('·').pop()?.trim() ?? selectedCorrectionRel.sourceField;

      groundingService.applyCorrection({
        bindingId: binding.id,
        targetName: relTargetName,
        fromField,
        toField: selectedField.field,
        reason: `关系落地修正：「${currentObject.name}」的「${selectedCorrectionRel.relationName}」关系应通过 ${selectedField.field} 关联「${selectedCorrectionRel.targetObject}」。`,
        evidence: currentObject.evidence.map((item) => item.id)
      });

      setIsCorrectionDrawerOpen(false);
      setSelectedCorrectionRel(null);
      const correctionCount = groundingService
        .listByObject(currentObject.id)
        .filter(
          (revision) => revision.bindingId === binding.id && revision.targetName === relTargetName
        ).length;
      addToast?.(
        'success',
        '已生成新的 Grounding Revision',
        `已将「${relTargetName}」关系落地字段修正为 ${selectedField.field}，Revision ${correctionCount} 当前生效。历史记录已完整保留。`
      );
      return;
    }

    if (!selectedCorrectionAttr) return;

    groundingService.applyCorrection({
      bindingId: binding.id,
      targetName: selectedCorrectionAttr.name,
      fromField: selectedCorrectionAttr.field,
      toField: selectedField.field,
      reason: selectedCorrectionAttr.correctionReason ?? `本地落地修正：${selectedCorrectionAttr.name}`,
      evidence: currentObject.evidence.map((item) => item.id)
    });

    setIsCorrectionDrawerOpen(false);
    const correctionCount = groundingService
      .listByObject(currentObject.id)
      .filter(
        (revision) => revision.bindingId === binding.id && revision.targetName === selectedCorrectionAttr.name
      ).length;
    addToast?.(
      'success',
      '已生成新的 Grounding Revision',
      `已将「${selectedCorrectionAttr.name}」数据字段修正为 ${selectedField.field}，Revision ${correctionCount} 当前生效。历史记录已完整保留。`
    );
  };

  const handleBack = () => {
    if (onBackToObjectsList) {
      onBackToObjectsList();
    }
  };

  const handleCopyIdentifier = (text: string) => {
    navigator.clipboard?.writeText(text);
    addToast?.('success', '已复制主体标识', `已复制「${text}」到剪贴板`);
  };

  const handleTermClick = (term: BusinessTermItem) => {
    setSelectedTerm(term);
    addToast?.('info', `业务术语 · ${term.name}`, `${term.definition}（业务域：${term.domain}）`);
  };

  const handleMetricClick = (metric: RelatedMetricItem) => {
    if (onNavigateToMetricDetail) {
      onNavigateToMetricDetail(metric.id);
    } else {
      addToast?.('info', `相关指标 · ${metric.name}`, `${metric.definition}（业务域：${metric.domain}）`);
    }
  };

  const handleKnowledgeNetworkClick = () => {
    if (onNavigateToKnowledgeNetwork) {
      onNavigateToKnowledgeNetwork(currentObject.id);
    } else {
      setIsKnowledgeDrawerOpen(true);
      addToast?.('info', '知识网络上下文', `已载入以「${currentObject.name}」为中心的业务知识网络`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] text-[#0F172A] font-sans antialiased relative select-none overflow-y-auto">
      
      {/* ========================================================= */}
      {/* 1. TOP BREADCRUMB & HEADER CONTAINER                      */}
      {/* ========================================================= */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 lg:px-8 pt-5 pb-0 shrink-0">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#64748B]">
            <button
              onClick={handleBack}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              业务语义
            </button>
            <span className="text-[#CBD5E1]">/</span>
            <button
              onClick={handleBack}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              业务对象
            </button>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-[#0F172A] font-medium">{currentObject.name}</span>
          </nav>

          {/* Title Row & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              {/* Title, English & Status Badge */}
              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  {currentObject.name}
                </h1>
                <span className="text-xs text-[#64748B] font-mono">
                  {currentObject.id}
                </span>
                {currentObject.status === 'PUBLISHED' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5" />
                    已发布
                  </span>
                ) : currentObject.status === 'DRAFT' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFFBEB] text-[#92400E] border border-[#FEF3C7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1.5" />
                    草稿
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] mr-1.5" />
                    已停用
                  </span>
                )}
              </div>

              {/* Weak Facts Line (No big numbers/KPI badges) */}
              <div className="flex items-center space-x-2 text-xs text-[#64748B] pt-0.5">
                <span>主要业务域：{currentObject.domain}</span>
                <span className="text-[#CBD5E1]">·</span>
                <span>{implementations.length} 套数据实现</span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-2 shrink-0 relative" ref={moreMenuRef}>
              <button
                id="btn-view-knowledge-network"
                onClick={handleKnowledgeNetworkClick}
                className="px-3.5 py-1.5 rounded bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                title={`查看以${currentObject.name}为中心的知识网络上下文`}
              >
                <Network className="w-3.5 h-3.5 text-[#64748B]" />
                <span>在知识网络中查看</span>
              </button>

              <button
                id="btn-change-business-object"
                onClick={() => onNavigateToChangeBusinessObject?.(currentObject.id)}
                className="px-3.5 py-1.5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                title="进入业务对象修改工作区"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>修改业务对象</span>
              </button>

              <div className="relative">
                <button
                  id="btn-more-actions"
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition-colors cursor-pointer"
                  title="更多操作"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1 z-40 text-xs text-[#334155]">
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsHistoryDrawerOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>查看完整历史</span>
                    </button>
                    <div className="h-px bg-[#E2E8F0] my-1" />
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsDeactivateModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FEF2F2] text-[#DC2626] flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>停用业务对象</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formal Business Definition - Second Layer Information (Clean, not in thick card) */}
          <div className="pt-2 pb-1 border-t border-[#F1F5F9]">
            <p className="text-sm text-[#334155] leading-relaxed max-w-4xl">
              {currentObject.definition}
            </p>
          </div>

          {/* Tabs: 业务视角 vs 数据支撑 */}
          <div className="border-t border-[#E2E8F0] flex items-center space-x-6 text-xs font-semibold pt-0">
            <button
              id="tab-business-view"
              onClick={() => setActiveTab('business')}
              className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'business'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>业务视角</span>
            </button>

            <button
              id="tab-data-support"
              onClick={() => setActiveTab('data_support')}
              className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'data_support'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>数据支撑</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[11px] bg-[#F1F5F9] text-[#64748B] font-normal">
                {implementations.length} 套实现
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN BODY CONTAINER: DUAL COLUMN (73% / 27%)            */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
        
        {/* ======================================================= */}
        {/* TAB 1: 业务视角 (BUSINESS PERSPECTIVE)                   */}
        {/* ======================================================= */}
        {activeTab === 'business' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ---------------------------------------------------- */}
            {/* LEFT MAIN AREA (~73%, 9 of 12 cols in lg grid)       */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              
              {/* SECTION 1: 对象身份 */}
              <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                <div className="border-b border-[#F1F5F9] pb-3">
                  <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">对象身份</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* 主体标识 */}
                  <div className="space-y-1.5">
                    <div className="text-[#64748B] font-medium">主体标识</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {currentObject.identity.name}
                      </span>
                      <button
                        onClick={() => handleCopyIdentifier(currentObject.identity.name)}
                        className="p-1 text-[#94A3B8] hover:text-[#2563EB] rounded transition-colors cursor-pointer"
                        title="复制主体标识名称"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {currentObject.identity.meaning}
                    </p>
                  </div>

                  {/* 正式别名 */}
                  <div className="space-y-1.5">
                    <div className="text-[#64748B] font-medium">正式别名</div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {currentObject.aliases.map((alias, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded"
                        >
                          {alias}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed pt-0.5">
                      企业内不同业务条线或历史系统对该主体的已核准正式别称。
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 2: 关键属性 */}
              <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                <div className="border-b border-[#F1F5F9] pb-3 space-y-0.5">
                  <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">关键属性</h2>
                  <p className="text-xs text-[#64748B]">
                    描述{currentObject.name}跨具体数据实现仍具有稳定业务意义的核心特征。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-1">
                  {attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 border-b border-[#F1F5F9] last:border-b-0 space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-[#0F172A]">
                          {attr.name}
                        </span>
                        {attr.isIdentifier && (
                          <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.2 rounded font-medium">
                            主体标识
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">
                        {attr.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 3: 核心业务关系 */}
              <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                <div className="border-b border-[#F1F5F9] pb-3 space-y-0.5">
                  <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">核心业务关系</h2>
                  <p className="text-xs text-[#64748B]">
                    描述{currentObject.name}与其他企业正式业务对象之间稳定的业务联系。
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {relationships.map((rel, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Compact Semantic Relation Row */}
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="font-semibold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                            {rel.sourceObject}
                          </span>
                          
                          {/* Relationship Name ON THE LINE */}
                          <span className="text-xs text-[#2563EB] font-medium flex items-center px-1">
                            <span>─</span>
                            <span className="px-1.5 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[11px] font-semibold">
                              {rel.relationName}
                            </span>
                            <span>→</span>
                          </span>

                          {/* Target Business Object (Clickable) */}
                          <button
                            onClick={() => onNavigateToBusinessObjectDetail?.(rel.targetId, 'business')}
                            className="font-semibold text-[#2563EB] hover:underline bg-white px-2 py-0.5 rounded border border-[#BFDBFE] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                            title={`查看「${rel.targetObject}」正式业务对象详情`}
                          >
                            {rel.targetObject}
                          </button>
                        </div>

                        {/* Semantic Explanation */}
                        <p className="text-xs text-[#475569] leading-relaxed pt-0.5">
                          {rel.meaning}
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigateToBusinessObjectDetail?.(rel.targetId, 'business')}
                        className="text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-medium shrink-0 flex items-center space-x-1 cursor-pointer"
                      >
                        <span>查看{rel.targetObject}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 4: 关联业务语义 */}
              <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                <div className="border-b border-[#F1F5F9] pb-3 space-y-0.5">
                  <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">关联业务语义</h2>
                  <p className="text-xs text-[#64748B]">
                    与{currentObject.name}紧密关联的已核准企业业务术语与统计分析指标。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs">
                  {/* Group 1: 业务术语 (Business Terms) */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-semibold text-[#334155] flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>业务术语</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentObject.terms.map((term) => (
                        <button
                          key={term.id}
                          onClick={() => handleTermClick(term)}
                          className="px-2.5 py-1 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#2563EB] hover:underline font-medium transition-colors cursor-pointer flex items-center space-x-1"
                          title={`${term.name}: ${term.definition}`}
                        >
                          <span>{term.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      点击可查看定义来源与业务口径说明。
                    </p>
                  </div>

                  {/* Group 2: 相关指标 (Metrics) */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-semibold text-[#334155] flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>相关指标</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentObject.metrics.map((metric) => (
                        <button
                          key={metric.id}
                          onClick={() => handleMetricClick(metric)}
                          className="px-2.5 py-1 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#2563EB] hover:underline font-medium transition-colors cursor-pointer flex items-center space-x-1"
                          title={`${metric.name}: ${metric.definition}`}
                        >
                          <span>{metric.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      包含工单规模与办结时效相关的企业正式核准指标。
                    </p>
                  </div>
                </div>
              </section>

            </div>

            {/* ---------------------------------------------------- */}
            {/* RIGHT SUMMARY INSPECTOR (~27%, 3 of 12 cols in lg)   */}
            {/* ---------------------------------------------------- */}
            <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-[#E2E8F0] rounded-md p-5 shadow-2xs space-y-5 select-none">
              
              {/* SUBSECTION 1: 当前数据支撑 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  当前数据支撑
                </h3>

                <div className="space-y-2.5 text-xs">
                  {/* 主要数据实现 */}
                  <div className="space-y-0.5">
                    <div className="text-[#64748B] text-[11px]">主要数据实现</div>
                    <div className="font-semibold text-[#0F172A]">{primaryImpl ? primaryImpl.name : '（待确认）'}</div>
                    <div className="text-[11px] text-[#64748B]">{primaryImpl ? primaryImpl.scope : '—'}</div>
                  </div>

                  {/* 其他数据实现 */}
                  <div className="space-y-0.5 pt-1">
                    <div className="text-[#64748B] text-[11px]">其他数据实现</div>
                    {implementations.filter((impl) => impl !== primaryImpl).length > 0 ? (
                      implementations
                        .filter((impl) => impl !== primaryImpl)
                        .map((impl) => (
                          <div key={impl.id} className="space-y-0.5">
                            <div className="font-semibold text-[#0F172A]">{impl.name}</div>
                            <div className="text-[11px] text-[#64748B]">{impl.scope}</div>
                          </div>
                        ))
                    ) : (
                      <div className="font-semibold text-[#0F172A]">—</div>
                    )}
                  </div>

                  {/* 属性扩展 */}
                  <div className="space-y-0.5 pt-1">
                    <div className="text-[#64748B] text-[11px]">属性扩展</div>
                    <div className="text-[#334155]">
                      {implementations.find((impl) => impl.extension)?.extension?.name ?? '无'}
                    </div>
                  </div>

                  {/* 相关数据 */}
                  <div className="space-y-0.5 pt-1">
                    <div className="text-[#64748B] text-[11px]">相关数据</div>
                    <div className="text-[#334155] leading-relaxed">
                      {currentObject.relatedData.length > 0
                        ? currentObject.relatedData.map((item) => item.name).join('、')
                        : '无'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => setActiveTab('data_support')}
                    className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看数据支撑</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="h-px bg-[#E2E8F0]" />

              {/* SUBSECTION 2: 定义依据 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  定义依据
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="space-y-1.5">
                    {currentObject.evidence.length > 0 ? (
                      currentObject.evidence.map((item) => (
                        <div key={item.id} className="text-[#334155] flex items-center space-x-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#94A3B8]" />
                          <span>{item.title}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#94A3B8]">暂无记录的定义依据</div>
                    )}
                  </div>

                  <div className="text-[11px] text-[#166534] pt-1">
                    {currentObject.status === 'PUBLISHED'
                      ? '当前正式定义已发布'
                      : currentObject.status === 'DRAFT'
                        ? '当前定义处于草稿状态'
                        : '该对象已停用归档'}
                  </div>
                </div>

                <div className="pt-1 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => setIsEvidenceDrawerOpen(true)}
                    className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看定义依据</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="h-px bg-[#E2E8F0]" />

              {/* SUBSECTION 3: 最近更新 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  最近更新
                </h3>

                <p className="text-xs text-[#475569] leading-relaxed">
                  明确热线、线上、窗口等公共服务渠道，并加入别名“群众诉求工单”和关键属性“来源渠道”。
                </p>

                <div className="pt-1 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => setIsHistoryDrawerOpen(true)}
                    className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看完整历史</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </aside>

          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 2: 数据支撑 (DATA SUPPORT PERSPECTIVE)               */}
        {/* ======================================================= */}
        {/* 待复核提示：语义修订触发绑定复核时引导进入复核工作台 */}
        {activeTab === 'data_support' && revalidationCount > 0 && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start space-x-2.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-[#92400E]">
                  {revalidationCount} 项数据支撑待复核
                </div>
                <p className="text-[#64748B] leading-relaxed">
                  业务对象语义修订影响了现有数据支撑绑定，需要复核：确认继续使用、重新绑定或退休。
                </p>
              </div>
            </div>
            <button
              id="btn-navigate-revalidation"
              onClick={onNavigateToRevalidation}
              className="shrink-0 px-3.5 py-1.5 rounded bg-white border border-[#FED7AA] hover:bg-[#FFF7ED] text-[#D97706] text-xs font-bold cursor-pointer transition-colors"
            >
              进入数据支撑复核 →
            </button>
          </div>
        )}

        {activeTab === 'data_support' && !currentImpl && (
          <div className="bg-white border border-[#E2E8F0] rounded-md p-8 text-center space-y-2">
            <Database className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <div className="text-sm font-semibold text-[#0F172A]">暂无正式数据实现</div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              「{currentObject.name}」尚未确认任何正式数据实现，可通过发现数据支撑自下而上登记候选实现。
            </p>
          </div>
        )}

        {activeTab === 'data_support' && currentImpl && (
          <div className="space-y-6">
            
            {/* 顶层上下文栏 */}
            <div className="bg-white border border-[#E2E8F0] rounded-md p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: 当前查看的数据实现与下拉切换 */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-[#64748B]">当前查看的数据实现</span>
                </div>

                {/* Restrained selector dropdown */}
                <div className="relative" ref={selectorRef}>
                  <button
                    onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                    className="inline-flex items-center space-x-2 text-sm font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors py-0.5 cursor-pointer group"
                  >
                    <span>{currentImpl.name}</span>
                    <ChevronDown className={`w-4 h-4 text-[#64748B] group-hover:text-[#2563EB] transition-transform duration-150 ${isSelectorOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSelectorOpen && (
                    <div className="absolute left-0 mt-1.5 w-80 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-1.5 text-[11px] text-[#94A3B8] font-medium border-b border-[#F1F5F9]">
                        正式数据实现（共 {implementations.length} 套）
                      </div>
                      {implementations.map((impl) => {
                        const isSelected = impl.id === selectedImplId;
                        const isMain = impl.role === '主要数据实现';
                        return (
                          <button
                            key={impl.id}
                            onClick={() => {
                              setSelectedImplId(impl.id);
                              setIsSelectorOpen(false);
                              addToast?.('info', '切换查看上下文', `已切换至「${impl.name}」数据实现`);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer flex flex-col space-y-1 border-b border-[#F8FAFC] last:border-b-0 ${
                              isSelected ? 'bg-[#F8FAFC]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold ${isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                                {impl.name}
                              </span>
                              <div className="flex items-center space-x-1.5">
                                {isMain ? (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                                    主要数据实现
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                                    其他数据实现
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="text-[10px] text-[#166534] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#DCFCE7] font-medium">
                                    当前查看
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-[11px] text-[#64748B]">
                              适用范围：{impl.scope}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sub-status line */}
                <div className="flex items-center space-x-2 text-xs text-[#64748B] pt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                    {currentImpl.role} · {currentImpl.status}
                  </span>
                  <span>适用范围：{currentImpl.scope}</span>
                </div>
              </div>

              {/* Right: 主要数据实现与关系及快捷操作 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F1F5F9]">
                <div className="space-y-1 text-left sm:text-right">
                  <div className="text-[#334155]">
                    <span className="text-[#64748B]">主要数据实现：</span>
                    <span className="font-semibold text-[#0F172A]">
                      {primaryImpl ? primaryImpl.name : '（待确认）'}
                    </span>
                  </div>
                  <div className="text-[#64748B] text-[11px]">
                    {currentImpl.role === '主要数据实现' ? (
                      <span className="text-[#2563EB] font-medium">当前即主要数据实现</span>
                    ) : (
                      <span>{currentImpl.scopeRelationText}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2" ref={contextMoreRef}>
                  <button
                    onClick={() => {
                      if (onNavigateToDataAssetDetail) {
                        onNavigateToDataAssetDetail(currentImpl.assetId);
                      } else {
                        addToast?.('info', '查看数据资产', `已定位至「${currentImpl.name}」底层资产详情`);
                      }
                    }}
                    className="px-3 py-1.5 rounded bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] font-medium transition-colors cursor-pointer"
                  >
                    查看数据资产
                  </button>

                  <button
                    onClick={() => setIsEvidenceDrawerOpen(true)}
                    className="px-3 py-1.5 rounded bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] font-medium transition-colors cursor-pointer"
                  >
                    查看判断依据
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setIsContextMoreOpen(!isContextMoreOpen)}
                      className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition-colors cursor-pointer"
                      title="更多操作"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isContextMoreOpen && (
                      <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => {
                            setIsContextMoreOpen(false);
                            setIsSetPrimaryModalOpen(true);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] text-[#334155] transition-colors cursor-pointer"
                        >
                          设为主要数据实现
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Split Grid: 73% Main / 27% Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT MAIN AREA (~73%) */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-6">

                {/* 1. 当前实现概览 */}
                <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                  <div className="border-b border-[#F1F5F9] pb-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">当前实现概览</h2>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5" />
                      {currentImpl.status}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-bold text-[#0F172A]">{currentImpl.name}</span>
                      <span className="font-mono text-xs text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                        {currentImpl.techName}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                        {currentImpl.role}
                      </span>
                    </div>

                    {/* Compact 4 items (Not KPI cards) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                        <div className="text-[#64748B] text-[11px]">记录主体</div>
                        <div className="font-semibold text-[#0F172A]">{currentImpl.subject}</div>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                        <div className="text-[#64748B] text-[11px]">记录粒度</div>
                        <div className="font-semibold text-[#0F172A]">{currentImpl.granularity}</div>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                        <div className="text-[#64748B] text-[11px]">实例身份</div>
                        <div className="font-semibold text-[#0F172A] font-mono text-[11px]">{currentImpl.identity}</div>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                        <div className="text-[#64748B] text-[11px]">适用范围</div>
                        <div className="font-semibold text-[#0F172A]">{currentImpl.scope}</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. 实现范围关系 */}
                <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-3">
                  <div className="border-b border-[#F1F5F9] pb-3">
                    <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">实现范围关系</h2>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#64748B]">当前事实：</span>
                      <span className="font-semibold text-[#0F172A]">{currentImpl.scopeRelationText}</span>
                    </div>
                    <p className="text-[#475569] leading-relaxed">
                      {currentImpl.scopeRelationNote}
                    </p>
                  </div>
                </section>

                {/* 3. 关键属性落地 */}
                <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                  <div className="border-b border-[#F1F5F9] pb-3 space-y-0.5">
                    <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">关键属性落地</h2>
                    <p className="text-xs text-[#64748B]">
                      展示当前数据实现及其属性扩展如何承载{currentObject.name}的关键业务属性。
                    </p>
                  </div>

                  <div className="border border-[#E2E8F0] rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                          <th className="py-2.5 px-4 font-semibold">业务属性</th>
                          <th className="py-2.5 px-4 font-semibold">当前来源</th>
                          <th className="py-2.5 px-4 font-semibold">数据字段</th>
                          <th className="py-2.5 px-4 font-semibold">当前正式语义</th>
                          <th className="py-2.5 px-4 font-semibold text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {currentImpl.attributes.map((attr, idx) => {
                          const isUnsupported = !attr.isSupported;
                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-[#F8FAFC] transition-colors ${
                                attr.needsCorrection
                                  ? 'bg-[#FEFCE8]/60 hover:bg-[#FEFCE8]'
                                  : isUnsupported
                                  ? 'text-[#94A3B8] bg-[#FAFAFA]'
                                  : 'text-[#334155]'
                              }`}
                            >
                              <td className="py-2.5 px-4">
                                <div className="flex items-center space-x-2">
                                  <span className={`font-semibold ${isUnsupported ? 'text-[#64748B]' : 'text-[#0F172A]'}`}>
                                    {attr.name}
                                  </span>
                                  {attr.isIdentifier && (
                                    <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.2 rounded font-medium">
                                      主体标识
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center space-x-1.5">
                                  <span>{attr.source}</span>
                                  {attr.isExtension && (
                                    <span className="text-[10px] text-[#475569] bg-[#F1F5F9] border border-[#E2E8F0] px-1.5 py-0.2 rounded">
                                      属性扩展
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px]">
                                <div className="flex items-center space-x-2">
                                  <span className={attr.needsCorrection ? 'text-[#B45309] font-bold' : ''}>
                                    {attr.field}
                                  </span>
                                  {attr.needsCorrection && (
                                    <span className="text-[10px] font-sans font-medium px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                                      需要修正
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex flex-col">
                                  <span className={isUnsupported ? 'text-[#94A3B8]' : 'text-[#334155]'}>
                                    {attr.semantics}
                                  </span>
                                  {attr.revisionVersion && (
                                    <span className="text-[10px] text-[#166534] font-medium mt-0.5 inline-flex items-center space-x-1">
                                      <span>✓</span>
                                      <span>{attr.revisionVersion}</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                {attr.needsCorrection ? (
                                  <button
                                    id={`btn-correct-attr-${idx}`}
                                    onClick={() => {
                                      setSelectedCorrectionAttr(attr);
                                      setSelectedCorrectionRel(null);
                                      setIsCorrectionDrawerOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                                    title="修正此属性的数据支撑对应字段"
                                  >
                                    修正属性对应
                                  </button>
                                ) : attr.isSupported ? (
                                  <button
                                    id={`btn-re-correct-attr-${idx}`}
                                    onClick={() => {
                                      setSelectedCorrectionAttr(attr);
                                      setSelectedCorrectionRel(null);
                                      setIsCorrectionDrawerOpen(true);
                                    }}
                                    className="text-xs text-[#64748B] hover:text-[#2563EB] hover:underline cursor-pointer"
                                  >
                                    修正对应
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-[#94A3B8]">暂无支撑</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 4. 核心关系落地 */}
                <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                  <div className="border-b border-[#F1F5F9] pb-3 space-y-0.5">
                    <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">核心关系落地</h2>
                    <p className="text-xs text-[#64748B]">
                      展示当前数据实现如何提供核心业务关系的身份支撑。
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {currentImpl.relationships.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2.5"
                      >
                        {/* Compact Semantic Relation Row with relation name strictly on the line */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="font-semibold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                              {rel.sourceObject}
                            </span>
                            
                            <span className="text-xs text-[#2563EB] font-medium flex items-center px-1">
                              <span>─</span>
                              <span className="px-1.5 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[11px] font-semibold">
                                {rel.relationName}
                              </span>
                              <span>→</span>
                            </span>

                            <button
                              onClick={() => onNavigateToBusinessObjectDetail?.(rel.targetId, 'business')}
                              className="font-semibold text-[#2563EB] hover:underline bg-white px-2 py-0.5 rounded border border-[#BFDBFE] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                              title={`查看「${rel.targetObject}」正式业务对象详情`}
                            >
                              {rel.targetObject}
                            </button>
                          </div>

                          <button
                            onClick={() => onNavigateToBusinessObjectDetail?.(rel.targetId, 'business')}
                            className="text-xs text-[#2563EB] hover:underline font-medium flex items-center space-x-1 cursor-pointer"
                          >
                            <span>查看{rel.targetObject}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Identity Support Detail */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#475569] pt-2 border-t border-[#E2E8F0]/60">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[#64748B]">来源：</span>
                            <span className="font-mono text-[#0F172A] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                              {rel.sourceField}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[#64748B]">目标身份：</span>
                              <span className="font-medium text-[#0F172A]">{rel.targetIdentity}</span>
                            </div>
                            <button
                              id={`btn-correct-rel-${idx}`}
                              onClick={() => {
                                setSelectedCorrectionRel(rel);
                                setSelectedCorrectionAttr(null);
                                setIsCorrectionDrawerOpen(true);
                              }}
                              className="text-xs text-[#64748B] hover:text-[#2563EB] hover:underline cursor-pointer shrink-0"
                              title="修正此关系的数据支撑落地字段"
                            >
                              修正落地
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 5. 属性扩展 */}
                <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                  <div className="border-b border-[#F1F5F9] pb-3 space-y-0.5">
                    <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">属性扩展</h2>
                    <p className="text-xs text-[#64748B]">
                      为当前数据实现中的同一{currentObject.name}补充场景特定属性，不单独计入核心数据实现基数。
                    </p>
                  </div>

                  {currentImpl.extension ? (
                    <div className="p-4 bg-white border border-[#E2E8F0] rounded space-y-3">
                      {/* Compact Parent-Child representation */}
                      <div className="space-y-1 text-xs">
                        <div className="text-[#334155] font-semibold flex items-center space-x-1.5">
                          <span>{currentImpl.name}</span>
                        </div>
                        <div className="text-[#2563EB] flex items-center space-x-2 pl-3">
                          <span className="text-[#94A3B8]">└─</span>
                          <span className="font-bold text-[#0F172A]">{currentImpl.extension.name}</span>
                          <span className="text-[#64748B] text-[11px] font-mono">({currentImpl.extension.techName})</span>
                          <span className="ml-auto inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                            {currentImpl.extension.status}
                          </span>
                        </div>
                      </div>

                      {/* Structured Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-[#F1F5F9]">
                        <div className="space-y-0.5">
                          <div className="text-[#64748B] text-[11px]">依附实现</div>
                          <div className="text-[#334155] font-medium">{currentImpl.extension.parentImplementation}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[#64748B] text-[11px]">身份对应</div>
                          <div className="text-[#334155] font-mono text-[11px]">{currentImpl.extension.identityMapping}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[#64748B] text-[11px]">提供属性</div>
                          <div className="text-[#2563EB] font-medium font-mono text-[11px]">{currentImpl.extension.providedAttr}</div>
                        </div>
                      </div>

                      <p className="text-xs text-[#64748B] leading-relaxed pt-2 border-t border-[#F8FAFC]">
                        {currentImpl.extension.note}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#64748B]">
                      当前数据实现暂无依附的属性扩展表，所有关键业务属性均已在视图中闭环承载。
                    </div>
                  )}
                </section>

                {/* 6. 相关数据 */}
                <section className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-2xs space-y-4">
                  <div className="border-b border-[#F1F5F9] pb-3 space-y-0.5">
                    <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">相关数据</h2>
                    <p className="text-xs text-[#64748B]">
                      与{currentObject.name}有关，但本身不表示{currentObject.name}实例的数据资源。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentObject.relatedData.map((item, idx) => (
                      <div key={idx} className="p-4 bg-white border border-[#E2E8F0] rounded space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A]">{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded border border-[#E2E8F0]">
                            {item.role}
                          </span>
                        </div>
                        <div className="text-[#64748B] text-[11px] flex items-center space-x-1.5">
                          <span>关联范围：</span>
                          <span className="text-[#334155]">{item.scope}</span>
                        </div>
                        <p className="text-[#475569] leading-relaxed pt-1.5 border-t border-[#F1F5F9]">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

              </div>

              {/* RIGHT SUMMARY INSPECTOR (27%) */}
              <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-[#E2E8F0] rounded-md p-5 shadow-2xs space-y-5 select-none">
                
                {/* 1. 当前查看 */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    当前查看
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-[#0F172A]">{currentImpl.name}</div>
                    <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                      <span className="text-[#64748B]">实现状态</span>
                      <span className="text-[#334155]">{currentImpl.role} · {currentImpl.status}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                      <span className="text-[#64748B]">适用范围</span>
                      <span className="text-[#334155]">{currentImpl.scope}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                      <span className="text-[#64748B]">属性扩展</span>
                      <span className="text-[#334155]">
                        {currentImpl.extension ? currentImpl.extension.name : '无'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-[#E2E8F0]" />

                {/* 2. 全部数据实现 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                      全部数据实现
                    </h3>
                    <span className="text-[11px] text-[#64748B]">{implementations.length} 套</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {implementations.map((impl) => {
                      const isSelected = impl.id === selectedImplId;
                      const isMain = impl.role === '主要数据实现';
                      return (
                        <div
                          key={impl.id}
                          onClick={() => {
                            setSelectedImplId(impl.id);
                            addToast?.('info', '切换查看上下文', `已切换至「${impl.name}」数据实现`);
                          }}
                          className={`p-2.5 rounded border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#F0FDF4] border-[#86EFAC]'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold ${isSelected ? 'text-[#166534]' : 'text-[#0F172A]'}`}>
                              {impl.name}
                            </span>
                            {isMain ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                                主要数据实现
                              </span>
                            ) : isSelected ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                                当前查看
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#64748B] bg-white px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                                其他实现
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#64748B] pt-1">
                            范围：{impl.scope}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        if (onFindDataWithObjectGoal) {
                          onFindDataWithObjectGoal(currentObject.name);
                        } else {
                          addToast?.('info', '发现数据支撑', `已发起针对「${currentObject.name}」业务主体的语义数据资产发现与关联分析`);
                        }
                      }}
                      className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>发现更多数据</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                <div className="h-px bg-[#E2E8F0]" />

                {/* 3. 范围关系 */}
                <div className="space-y-2 text-xs">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    范围关系
                  </h3>
                  <p className="text-[#334155] leading-relaxed">
                    {currentImpl.name}：{currentImpl.scopeRelationText}。
                  </p>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed pt-1">
                    当前关系只表达数据实现的业务覆盖范围，不代表系统已经完成合并或去重。
                  </p>
                </div>

                <div className="h-px bg-[#E2E8F0]" />

                {/* 4. 最近校验 */}
                <div className="space-y-2 text-xs">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    最近校验
                  </h3>

                  <div className="space-y-1.5">
                    <div className="text-[#334155] flex items-start space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mt-1 shrink-0" />
                      <span>主体、粒度和实例身份仍然有效</span>
                    </div>
                    <div className="text-[#334155] flex items-start space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mt-1 shrink-0" />
                      <span>与主要数据实现的范围关系已确认</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#F1F5F9]">
                    <button
                      onClick={() => setIsHistoryDrawerOpen(true)}
                      className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>查看完整历史</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

              </aside>

            </div>

          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 3. DRAWERS & MODALS (READ-ONLY)                           */}
      {/* ========================================================= */}

      {/* EVIDENCE DRAWER（共享组件：依据来自领域 Store） */}
      <BusinessEvidenceDrawer
        isOpen={isEvidenceDrawerOpen}
        onClose={() => setIsEvidenceDrawerOpen(false)}
        objectName={currentObject.name}
        evidence={currentObject.evidence}
      />

      {/* HISTORY DRAWER（共享组件：历史来自 Revision Store） */}
      <BusinessObjectHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        objectName={currentObject.name}
        revisions={objectRevisions}
      />

      {/* KNOWLEDGE NETWORK CONTEXT DRAWER */}
      {isKnowledgeDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <aside className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-[#0F172A]">知识网络上下文 · {currentObject.name}</h3>
                <p className="text-xs text-[#64748B]">以{currentObject.name}为中心的企业语义关系上下文</p>
              </div>
              <button
                onClick={() => setIsKnowledgeDrawerOpen(false)}
                className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-3">
                <div className="font-semibold text-[#0F172A]">核心业务实体网络</div>
                <div className="space-y-2">
                  {relationships.length > 0 ? (
                    relationships.map((rel) => (
                      <div key={rel.targetId + rel.relationName} className="flex items-center justify-between bg-white p-2.5 rounded border border-[#E2E8F0]">
                        <span className="text-[#475569]">{rel.targetObject}</span>
                        <span className="text-xs font-medium text-[#2563EB]">← {rel.relationName}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#94A3B8]">暂未登记核心业务关系。</div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-3">
                <div className="font-semibold text-[#0F172A]">业务术语与指标网络</div>
                <div className="flex flex-wrap gap-2">
                  {currentObject.terms.map((term) => (
                    <span key={term.id} className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[#334155]">术语: {term.name}</span>
                  ))}
                  {currentObject.metrics.map((metric) => (
                    <span key={metric.id} className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[#334155]">指标: {metric.name}</span>
                  ))}
                  {currentObject.terms.length === 0 && currentObject.metrics.length === 0 && (
                    <span className="text-xs text-[#94A3B8]">暂未关联术语与指标。</span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsKnowledgeDrawerOpen(false)}
                className="px-4 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* DEACTIVATE OBJECT MODAL */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">停用业务对象确认</h3>
              <button
                onClick={() => setIsDeactivateModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs text-[#475569]">
              <p className="leading-relaxed text-[#334155]">
                「{currentObject.name}」当前处于<strong>{objectStatusLabel(currentObject.status)}</strong>生效状态，关联 {implementations.length} 套正式数据实现及多项业务指标。
              </p>
              <p className="leading-relaxed">
                停用后，该对象将转为归档状态，在全域资源发现和新语义分析中将提示已停用。
              </p>
            </div>

            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end space-x-2">
              <button
                onClick={() => setIsDeactivateModalOpen(false)}
                className="px-3.5 py-1.5 border border-[#E2E8F0] text-[#334155] text-xs font-medium rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setIsDeactivateModalOpen(false);
                  businessObjectRepository.setStatus(currentObject.id, 'RETIRED');
                  addToast?.('warning', '业务对象已停用', `「${currentObject.name}」已从正式生效业务对象目录中归档停用`);
                }}
                className="px-3.5 py-1.5 bg-[#DC2626] text-white text-xs font-medium rounded hover:bg-[#B91C1C] transition-colors cursor-pointer"
              >
                确认停用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SET PRIMARY CONFIRMATION MODAL */}
      {isSetPrimaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">设为主要数据实现确认</h3>
              <button
                onClick={() => setIsSetPrimaryModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs text-[#475569]">
              <p className="leading-relaxed text-[#0F172A] font-semibold">
                是否将「{currentImpl.name}」设为「{currentObject.name}」的主要数据实现？
              </p>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5 text-[11px] text-[#475569]">
                <div className="text-[#0F172A] font-medium pb-1 border-b border-[#E2E8F0]">口径与操作影响说明：</div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-[#2563EB]">·</span>
                  <span>仅调整在企业业务语义目录中的默认展示与一般基准参考实现。</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-[#2563EB]">·</span>
                  <span>不会删除或变更现有其他正式数据实现（如{primaryImpl ? primaryImpl.name : '当前主要实现'}）。</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-[#2563EB]">·</span>
                  <span>不会执行任何跨来源合并、去重或数据物理融合操作。</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-[#2563EB]">·</span>
                  <span>不会强制改变已在生产运行的具体下游查询任务与数据路由。</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end space-x-2">
              <button
                onClick={() => setIsSetPrimaryModalOpen(false)}
                className="px-3.5 py-1.5 border border-[#E2E8F0] text-[#334155] text-xs font-medium rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setIsSetPrimaryModalOpen(false);
                  addToast?.('success', '已更新主要数据实现', `已将「${currentImpl.name}」设为业务对象详情默认基准参考实现`);
                }}
                className="px-3.5 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded hover:bg-[#1D4ED8] transition-colors cursor-pointer shadow-xs"
              >
                确认设为主要数据实现
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOCAL GROUNDING CORRECTION DRAWER */}
      <LocalGroundingCorrectionDrawer
        isOpen={isCorrectionDrawerOpen}
        onClose={() => {
          setIsCorrectionDrawerOpen(false);
          setSelectedCorrectionRel(null);
        }}
        onConfirm={handleConfirmCorrection}
        businessObjectName={currentObject.name}
        dataImplementationName={currentImpl?.name}
        dataImplementationRole={currentImpl?.role}
        attributeName={selectedCorrectionRel ? selectedCorrectionRel.relationName : selectedCorrectionAttr?.name}
        currentField={
          selectedCorrectionRel
            ? selectedCorrectionRel.sourceField.split('·').pop()?.trim() ?? selectedCorrectionRel.sourceField
            : selectedCorrectionAttr?.field
        }
        currentSemantics={
          selectedCorrectionRel
            ? `通过 ${selectedCorrectionRel.sourceField} 关联「${selectedCorrectionRel.targetObject}」（目标身份：${selectedCorrectionRel.targetIdentity}）。`
            : selectedCorrectionAttr?.semantics
        }
        mode={selectedCorrectionRel ? 'RELATIONSHIP' : 'ATTRIBUTE'}
        candidates={selectedCorrectionRel ? relationshipCandidates : undefined}
        targetObjectName={selectedCorrectionRel?.targetObject}
        reason={
          selectedCorrectionRel
            ? `经新的数据语义确认：当前关联字段与「${selectedCorrectionRel.targetObject}」主身份字段的口径不一致，「${selectedCorrectionRel.relationName}」关系应改用语义吻合的身份字段落地。`
            : undefined
        }
      />

    </div>
  );
};
