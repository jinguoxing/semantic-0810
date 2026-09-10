import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  ChevronRight,
  ChevronDown,
  X,
  Copy,
  Network,
  Database,
  FileText,
  Edit3,
  MoreHorizontal,
  BookOpen,
  History,
  ShieldAlert
} from 'lucide-react';
import {
  businessObjectRepository,
  dataSupportService,
  groundingService,
  listRevisions,
  listDataSupportRevisions,
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
import {
  BusinessObjectPageShell,
  BusinessObjectReadLayout,
  BusinessObjectSurface,
  BusinessObjectSection,
  BusinessObjectContextStrip,
  BusinessObjectEmptyState,
  BusinessObjectFactGrid,
  RESOURCE_ROLE_LABELS,
  buildSupportResourceGroups,
  deriveImplementationRole,
  type SupportResourceViewModel
} from './business-object/ui';

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
  onNavigateToBusinessObjectDetail?: (objectId: string, initialTab?: 'business' | 'data_support') => void;
  onNavigateToChangeBusinessObject?: (objectId: string) => void;
  /** 数据支撑复核入口：携带业务对象与待复核绑定上下文进入复核工作台 */
  onNavigateToRevalidation?: (objectId: string, bindingId?: string) => void;
  /** Top-down 发现数据支撑入口：必须携带当前业务对象上下文（禁止无上下文演示页） */
  onDiscoverDataSupport?: (businessObjectId: string, candidateBindingId?: string) => void;
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
  /** 落地的业务属性 ID：Grounding 修正按此识别目标（§9），缺失时不可发起修正 */
  attributeId?: string;
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
  /** 关系目标对象 ID（身份兼容校验用，注意与落地业务关系 ID relationshipId 区分） */
  targetId: string;
  /** 落地的业务关系 ID：Grounding 修正按此识别目标（§9），缺失时不可发起修正 */
  relationshipId?: string;
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

/** Grounding 修正失败 → 展示说明（领域校验失败时零写入） */
const GROUNDING_ERROR_LABELS: Record<string, string> = {
  BINDING_NOT_FOUND: '未找到当前数据实现的正式绑定',
  TARGET_NOT_FOUND: '未找到待修正的落地映射，请刷新后重试',
  FIELD_MISMATCH: '当前字段与落地记录不一致，请刷新后重试',
  CANDIDATE_NOT_ALLOWED: '该字段与关系目标对象身份不兼容，不能作为关系落地字段'
};

export const BusinessObjectDetailWorkspace: React.FC<BusinessObjectDetailWorkspaceProps> = ({
  objectId = 'bo_service_ticket',
  initialTab = 'business',
  onBackToObjectsList,
  onNavigateToBusinessObjectDetail,
  onNavigateToChangeBusinessObject,
  onNavigateToKnowledgeNetwork,
  onNavigateToMetricDetail,
  onNavigateToDataAssetDetail,
  onDiscoverDataSupport,
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

  // 已停用对象：页面为只读归档视图，隐藏全部改写型动作（V2.2 §12）
  const isRetired = currentObject.status === 'RETIRED';

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
  // 正式数据支撑选择器：仅 EFFECTIVE + NEEDS_REVALIDATION（Inv05）。
  // CANDIDATE 只出现在发现 / 确认工作区，RETIRED 只出现在历史抽屉。
  const domainImplementations = dataSupportService.listImplementations(currentObject.id);
  const bindings = dataSupportService.listCurrentBindings(currentObject.id);

  // 正式数据实现视图由当前生效绑定驱动：无生效绑定的实现（候选 / 已退休）不进入正式视图
  const implementations: FormalDataImplementation[] = bindings.flatMap((binding) => {
    const impl = domainImplementations.find((item) => item.id === binding.implementationId);
    if (!impl) return [];
    const groundingRevisions = groundingService.listByObject(currentObject.id);
    return [{
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
        // 修正记录按业务属性 ID 匹配（§9：禁止中文名称识别）
        const correctionRevisions = groundingRevisions.filter(
          (revision) =>
            revision.type === 'ATTRIBUTE' &&
            revision.targetId === attribute.attributeId &&
            revision.bindingId === binding?.id
        );
        const activeCorrection = correctionRevisions.find((revision) => revision.status === 'ACTIVE');
        return {
          ...(attribute.attributeId ? { attributeId: attribute.attributeId } : {}),
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
        ...(relationship.relationshipId ? { relationshipId: relationship.relationshipId } : {}),
        sourceField: relationship.sourceField,
        targetIdentity: relationship.targetIdentity
      })),
      extension: impl.extension ?? null
    }];
  });

  // 资源角色 View Model（V2.2 §8.4）：从 Subject / Grain / Identity / Scope 推导，
  // 只影响展示分组，不新增 Binding 生命周期状态
  const implRoleById = new Map<string, string>();
  for (const binding of bindings) {
    const impl = domainImplementations.find((item) => item.id === binding.implementationId);
    if (impl) {
      implRoleById.set(impl.id, deriveImplementationRole(impl, currentObject));
    }
  }
  const supportGroups = buildSupportResourceGroups(
    currentObject,
    bindings.flatMap((binding) => {
      const impl = domainImplementations.find((item) => item.id === binding.implementationId);
      return impl ? [{ implementation: impl, binding }] : [];
    })
  );

  // 正式数据实现 = 角色为 DATA_IMPLEMENTATION 的当前绑定（「N 套数据实现」统一口径）
  const formalImplementations = implementations.filter(
    (impl) => implRoleById.get(impl.id) === 'DATA_IMPLEMENTATION'
  );
  const formalCount = formalImplementations.length;

  const primaryImpl = formalImplementations.find((impl) => impl.role === '主要数据实现');
  const objectRevisions = listRevisions(currentObject.id);
  // 三条修订生命周期分节数据：定义修订 / 数据支撑修订 / Grounding 修正（历史抽屉共用）
  const dataSupportRevisions = listDataSupportRevisions(currentObject.id);
  const groundingRevisions = groundingService.listByObject(currentObject.id);
  const bindingByImplId = new Map(bindings.map((binding) => [binding.implementationId, binding]));

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

  // Current Implementation（仅在正式数据实现中切换）
  const currentImpl =
    formalImplementations.find((impl) => impl.id === selectedImplId) ||
    formalImplementations[0] ||
    null;
  const currentBinding = currentImpl ? bindingByImplId.get(currentImpl.id) : undefined;

  // 待复核绑定数量（语义修订触发）
  const revalidationCount = bindings.filter((binding) => binding.status === 'NEEDS_REVALIDATION').length;

  // 关系落地修正候选：来自实现的候选字段白名单，且只保留与当前修正关系
  // 目标对象身份兼容的字段（Inv08：「申请人 → 自然人」只允许自然人侧字段，
  // 禁止 ticket_id / status / close_time 等工单自身字段）
  const currentDomainImpl = domainImplementations.find((impl) => impl.id === currentImpl?.id);
  const relationshipCandidates: CandidateFieldOption[] = selectedCorrectionRel
    ? (currentDomainImpl?.relationshipCandidateFields ?? [])
        .filter((candidate) => candidate.targetObjectId === selectedCorrectionRel.targetId)
        .map((candidate) => ({
          id: `rel-${candidate.field}`,
          field: candidate.field,
          label: candidate.label,
          semanticType: candidate.sourceName,
          semantics: candidate.semantics,
          evidence: candidate.evidence ?? `「${candidate.label}」与「${selectedCorrectionRel.targetObject}」身份兼容。`,
          note: `目标对象：${selectedCorrectionRel.targetObject}`
        }))
    : [];

  const handleConfirmCorrection = (selectedField: CandidateFieldOption) => {
    if (!currentImpl) return;
    const binding = bindings.find((item) => item.implementationId === currentImpl.id);
    if (!binding) return;

    // 关系落地修正：type 显式声明 RELATIONSHIP，目标按业务关系 ID 识别（§9），
    // targetObjectId 参与身份兼容校验（Inv08）
    if (selectedCorrectionRel) {
      if (!selectedCorrectionRel.relationshipId) {
        addToast?.('error', '修正未生效', GROUNDING_ERROR_LABELS.TARGET_NOT_FOUND);
        return;
      }
      const fromField =
        selectedCorrectionRel.sourceField.split('·').pop()?.trim() ?? selectedCorrectionRel.sourceField;

      const result = groundingService.applyCorrection({
        bindingId: binding.id,
        type: 'RELATIONSHIP',
        targetId: selectedCorrectionRel.relationshipId,
        targetObjectId: selectedCorrectionRel.targetId,
        fromField,
        toField: selectedField.field,
        reason: `关系落地修正：「${currentObject.name}」的「${selectedCorrectionRel.relationName}」关系应通过 ${selectedField.field} 关联「${selectedCorrectionRel.targetObject}」。`,
        evidence: currentObject.evidence.map((item) => item.id)
      });

      if (result.ok === false) {
        addToast?.('error', '修正未生效', GROUNDING_ERROR_LABELS[result.error]);
        return;
      }

      setIsCorrectionDrawerOpen(false);
      setSelectedCorrectionRel(null);
      addToast?.(
        'success',
        '已生成新的 Grounding Revision',
        `已将「${result.revision.targetName}」关系落地字段修正为 ${selectedField.field}，历史记录已完整保留。`
      );
      return;
    }

    if (!selectedCorrectionAttr) return;
    if (!selectedCorrectionAttr.attributeId) {
      addToast?.('error', '修正未生效', GROUNDING_ERROR_LABELS.TARGET_NOT_FOUND);
      return;
    }

    const result = groundingService.applyCorrection({
      bindingId: binding.id,
      type: 'ATTRIBUTE',
      targetId: selectedCorrectionAttr.attributeId,
      fromField: selectedCorrectionAttr.field,
      toField: selectedField.field,
      reason: selectedCorrectionAttr.correctionReason ?? `本地落地修正：${selectedCorrectionAttr.name}`,
      evidence: currentObject.evidence.map((item) => item.id)
    });

    if (result.ok === false) {
      addToast?.('error', '修正未生效', GROUNDING_ERROR_LABELS[result.error]);
      return;
    }

    setIsCorrectionDrawerOpen(false);
    addToast?.(
      'success',
      '已生成新的 Grounding Revision',
      `已将「${selectedCorrectionAttr.name}」数据字段修正为 ${selectedField.field}，历史记录已完整保留。`
    );
  };

  const handleBack = () => {
    if (onBackToObjectsList) {
      onBackToObjectsList();
    }
  };

  /** Top-down 发现入口：必须携带当前业务对象上下文（Inv07），禁止无上下文演示页 */
  const handleDiscoverDataSupport = (candidateBindingId?: string) => {
    if (onDiscoverDataSupport) {
      onDiscoverDataSupport(currentObject.id, candidateBindingId);
    } else {
      addToast?.('info', '发现数据支撑', `已发起针对「${currentObject.name}」的数据支撑发现`);
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
    <BusinessObjectPageShell
      breadcrumb={
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
      }
      header={
        <div className="flex flex-col gap-4">
          {/* 标题行：名称 + 对象 ID + 生命周期状态徽标 + 动作 */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
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

              {/* 弱事实行（禁止 KPI 大数字） */}
              <div className="flex items-center space-x-2 text-xs text-[#64748B] pt-0.5">
                <span>主要业务域：{currentObject.domain}</span>
                <span className="text-[#CBD5E1]">·</span>
                <span>{formalCount} 套数据实现</span>
              </div>
            </div>

            {/* Header Right Actions：RETIRED 隐藏修改 / 停用（隐藏而非禁用，V2.2 §12） */}
            <div className="flex items-center space-x-2 shrink-0 relative" ref={moreMenuRef}>
              <button
                id="btn-view-knowledge-network"
                onClick={handleKnowledgeNetworkClick}
                className="px-3.5 py-1.5 rounded-md bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                title={`查看以${currentObject.name}为中心的知识网络上下文`}
              >
                <Network className="w-3.5 h-3.5 text-[#64748B]" />
                <span>在知识网络中查看</span>
              </button>

              {!isRetired && (
                <button
                  id="btn-change-business-object"
                  onClick={() => onNavigateToChangeBusinessObject?.(currentObject.id)}
                  className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="进入业务对象修改工作区"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>修改业务对象</span>
                </button>
              )}

              <div className="relative">
                <button
                  id="btn-more-actions"
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition-colors cursor-pointer"
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
                    {!isRetired && (
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 正式业务定义（第二层信息，弱化展示） */}
          <div className="pt-3 pb-2 border-t border-[#F1F5F9]">
            <p className="text-sm text-[#334155] leading-relaxed max-w-4xl">
              {currentObject.definition}
            </p>
          </div>
        </div>
      }
      tabs={
        <div
          role="tablist"
          aria-label="业务对象视角"
          className="border-t border-[#E2E8F0] flex items-center space-x-6 text-xs font-semibold"
        >
          <button
            id="tab-business-view"
            role="tab"
            aria-selected={activeTab === 'business'}
            aria-controls="bo-detail-panel"
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
            role="tab"
            aria-selected={activeTab === 'data_support'}
            aria-controls="bo-detail-panel"
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
              {formalCount} 套实现
            </span>
          </button>
        </div>
      }
    >
      <div id="bo-detail-panel" role="tabpanel">
        {/* ======================================================= */}
        {/* TAB 1: 业务视角 —— 单一 Main Surface + 单一 Inspector     */}
        {/* ======================================================= */}
        {activeTab === 'business' && (
          <BusinessObjectReadLayout
            main={
              <BusinessObjectSurface variant="MAIN">
                {/* 1. 对象身份 */}
                <BusinessObjectSection divider title="对象身份" headingId="bo-identity">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
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
                </BusinessObjectSection>

                {/* 2. 关键属性 */}
                <BusinessObjectSection
                  divider
                  title="关键属性"
                  headingId="bo-attributes"
                  description={`描述${currentObject.name}跨具体数据实现仍具有稳定业务意义的核心特征。`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {attributes.map((attr, idx) => (
                      <div
                        key={idx}
                        className="py-2.5 border-b border-[#EEF2F6] last:border-b-0 space-y-1"
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
                </BusinessObjectSection>

                {/* 3. 核心业务关系 */}
                <BusinessObjectSection
                  divider
                  title="核心业务关系"
                  headingId="bo-relationships"
                  description={`描述${currentObject.name}与其他企业正式业务对象之间稳定的业务联系。`}
                >
                  <div className="space-y-3">
                    {relationships.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
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
                </BusinessObjectSection>

                {/* 4. 关联业务语义 */}
                <BusinessObjectSection
                  title="关联业务语义"
                  headingId="bo-semantics"
                  description={`与${currentObject.name}紧密关联的已核准企业业务术语与统计分析指标。`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
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
                        包含业务规模与时效相关的企业正式核准指标。
                      </p>
                    </div>
                  </div>
                </BusinessObjectSection>
              </BusinessObjectSurface>
            }
            inspector={
              <BusinessObjectSurface variant="INSPECTOR" padded={false} className="p-5">
                {/* 1. 当前数据支撑：无支撑时给出单一空提示，不再罗列占位事实 */}
                <BusinessObjectSection headingAs="h3" divider title="当前数据支撑">
                  {formalCount === 0 ? (
                    <div className="space-y-2 text-xs">
                      <div className="text-[#0F172A] font-semibold">当前暂无数据支撑</div>
                      <p className="text-[#64748B] leading-relaxed">
                        {isRetired
                          ? '该对象已停用，历史数据支撑记录可在完整历史中查看。'
                          : '尚未建立当前有效的数据实现关系。'}
                      </p>
                      <button
                        onClick={() => setActiveTab('data_support')}
                        className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer pt-0.5"
                      >
                        <span>查看数据支撑</span>
                        <span>→</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      <div className="space-y-0.5">
                        <div className="text-[#64748B] text-[11px]">主要数据实现</div>
                        <div className="font-semibold text-[#0F172A]">{primaryImpl ? primaryImpl.name : '（待确认）'}</div>
                        <div className="text-[11px] text-[#64748B]">{primaryImpl ? primaryImpl.scope : '—'}</div>
                      </div>

                      <div className="space-y-0.5 pt-1">
                        <div className="text-[#64748B] text-[11px]">其他数据实现</div>
                        {formalImplementations.filter((impl) => impl !== primaryImpl).length > 0 ? (
                          formalImplementations
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

                      <div className="pt-2 border-t border-[#EEF2F6]">
                        <button
                          onClick={() => setActiveTab('data_support')}
                          className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <span>查看数据支撑</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  )}
                </BusinessObjectSection>

                {/* 2. 定义依据 */}
                <BusinessObjectSection headingAs="h3" divider title="定义依据">
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

                    <div className="pt-1 border-t border-[#EEF2F6]">
                      <button
                        onClick={() => setIsEvidenceDrawerOpen(true)}
                        className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <span>查看定义依据</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </BusinessObjectSection>

                {/* 3. 最近更新 */}
                <BusinessObjectSection headingAs="h3" title="最近更新">
                  <div className="space-y-2 text-xs">
                    <p className="text-xs text-[#475569] leading-relaxed">
                      {objectRevisions[0]?.summary ?? '当前定义来自初始登记。'}
                    </p>
                    <div className="pt-1 border-t border-[#EEF2F6]">
                      <button
                        onClick={() => setIsHistoryDrawerOpen(true)}
                        className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <span>查看完整历史</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </BusinessObjectSection>
              </BusinessObjectSurface>
            }
          />
        )}

        {/* ======================================================= */}
        {/* TAB 2: 数据支撑 —— Context Strip + 单一 Main + 分组 Inspector */}
        {/* ======================================================= */}
        {activeTab === 'data_support' && revalidationCount > 0 && (
          <BusinessObjectSurface variant="CALLOUT" tone="warning" className="flex-row flex-wrap items-center justify-between gap-3">
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
              onClick={() =>
                onNavigateToRevalidation?.(
                  currentObject.id,
                  bindings.find((binding) => binding.status === 'NEEDS_REVALIDATION')?.id
                )
              }
              className="shrink-0 px-3.5 py-1.5 rounded-md bg-white border border-[#FED7AA] hover:bg-[#FFF7ED] text-[#D97706] text-xs font-bold cursor-pointer transition-colors"
            >
              处理复核 →
            </button>
          </BusinessObjectSurface>
        )}

        {activeTab === 'data_support' && !currentImpl && (
          <BusinessObjectSurface variant="MAIN" padded={false}>
            <BusinessObjectEmptyState
              icon={<Database className="w-5 h-5" />}
              title="当前暂无数据实现"
              description={
                isRetired
                  ? '该业务对象已停用，数据支撑以历史记录形式保留，可在完整历史中查看。'
                  : '可从当前业务对象出发，发现并确认能够承载该对象的数据实现。'
              }
              primaryAction={
                !isRetired ? (
                  <button
                    id="btn-discover-data-support"
                    onClick={() => handleDiscoverDataSupport()}
                    className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    发现数据支撑
                  </button>
                ) : undefined
              }
            />
          </BusinessObjectSurface>
        )}

        {activeTab === 'data_support' && currentImpl && (
          <>
            {/* 顶部 Context Strip：当前实现 + 状态 + 适用范围 + 动作（主要实现名不在此重复展示） */}
            <BusinessObjectContextStrip
              selector={
                <div className="relative" ref={selectorRef}>
                  <button
                    onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                    className="inline-flex items-center space-x-2 text-sm font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors py-0.5 cursor-pointer group"
                    aria-haspopup="listbox"
                    aria-expanded={isSelectorOpen}
                  >
                    <span>{currentImpl.name}</span>
                    <ChevronDown className={`w-4 h-4 text-[#64748B] group-hover:text-[#2563EB] transition-transform duration-150 ${isSelectorOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSelectorOpen && (
                    <div className="absolute left-0 mt-1.5 w-80 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-1.5 text-[11px] text-[#94A3B8] font-medium border-b border-[#F1F5F9]">
                        切换查看的数据实现
                      </div>
                      {formalImplementations.map((impl) => {
                        const isSelected = impl.id === currentImpl.id;
                        const isMain = impl.role === '主要数据实现';
                        const implBinding = bindingByImplId.get(impl.id);
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
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-semibold ${isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                                {impl.name}
                              </span>
                              <div className="flex items-center space-x-1.5 shrink-0">
                                {isMain ? (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                                    主要数据实现
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                                    其他数据实现
                                  </span>
                                )}
                                {implBinding?.status === 'NEEDS_REVALIDATION' && (
                                  <span
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setIsSelectorOpen(false);
                                      onNavigateToRevalidation?.(currentObject.id, implBinding.id);
                                    }}
                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] cursor-pointer hover:bg-[#FEF3C7]"
                                  >
                                    处理复核
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
              }
              status={
                <>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                    {currentImpl.role} · {currentImpl.status}
                  </span>
                  {currentBinding?.status === 'NEEDS_REVALIDATION' && (
                    <button
                      id="btn-handle-revalidation"
                      onClick={() => onNavigateToRevalidation?.(currentObject.id, currentBinding.id)}
                      className="px-2 py-0.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[11px] font-bold cursor-pointer hover:bg-[#FEF3C7] transition-colors"
                      title="该实现待复核：确认继续使用、重新绑定或退休"
                    >
                      处理复核
                    </button>
                  )}
                </>
              }
              scope={<span>适用范围：{currentImpl.scope}</span>}
              actions={
                <div className="flex items-center space-x-2" ref={contextMoreRef}>
                  <button
                    onClick={() => {
                      if (onNavigateToDataAssetDetail) {
                        onNavigateToDataAssetDetail(currentImpl.assetId);
                      } else {
                        addToast?.('info', '查看数据资产', `已定位至「${currentImpl.name}」底层资产详情`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] font-medium transition-colors cursor-pointer text-xs"
                  >
                    查看数据资产
                  </button>

                  <button
                    onClick={() => setIsEvidenceDrawerOpen(true)}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] font-medium transition-colors cursor-pointer text-xs"
                  >
                    查看判断依据
                  </button>

                  {!isRetired && (
                    <button
                      id="btn-discover-more-data-support"
                      onClick={() => handleDiscoverDataSupport()}
                      className="px-3 py-1.5 rounded-md bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] font-medium transition-colors cursor-pointer text-xs"
                    >
                      发现更多数据支撑
                    </button>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setIsContextMoreOpen(!isContextMoreOpen)}
                      className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition-colors cursor-pointer"
                      title="更多操作"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isContextMoreOpen && (
                      <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
                        {!isRetired && currentBinding?.status === 'EFFECTIVE' && currentBinding.role !== 'PRIMARY' ? (
                          <button
                            onClick={() => {
                              setIsContextMoreOpen(false);
                              setIsSetPrimaryModalOpen(true);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] text-[#334155] transition-colors cursor-pointer"
                          >
                            设为主要数据实现
                          </button>
                        ) : (
                          <div
                            className="px-3.5 py-2 text-[#94A3B8]"
                            title="仅已生效且非主要的数据实现可设为主要"
                          >
                            {isRetired
                              ? '已停用对象为只读视图'
                              : currentBinding?.status === 'NEEDS_REVALIDATION'
                                ? '待复核实现需先完成复核'
                                : '当前已是主要数据实现'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              }
            />

            <BusinessObjectReadLayout
              main={
                <BusinessObjectSurface variant="MAIN">
                  {/* 1. 实现概览 */}
                  <BusinessObjectSection
                    divider
                    title="实现概览"
                    headingId="impl-overview"
                    actions={
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5" />
                        {currentImpl.status}
                      </span>
                    }
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-sm font-bold text-[#0F172A]">{currentImpl.name}</span>
                        <span className="font-mono text-xs text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {currentImpl.techName}
                        </span>
                      </div>

                      <BusinessObjectFactGrid
                        columns={4}
                        items={[
                          { label: '记录主体', value: currentImpl.subject },
                          { label: '记录粒度', value: currentImpl.granularity },
                          { label: '实例身份', value: currentImpl.identity, mono: true },
                          { label: '适用范围', value: currentImpl.scope }
                        ]}
                      />
                    </div>
                  </BusinessObjectSection>

                  {/* 2. 实现范围关系 */}
                  <BusinessObjectSection divider title="实现范围关系" headingId="impl-scope-relation">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#64748B]">当前实现角色：</span>
                        <span className="font-semibold text-[#0F172A]">{currentImpl.role}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[#64748B]">范围关系：</span>
                        <span className="font-semibold text-[#0F172A]">{currentImpl.scopeRelationText}</span>
                      </div>
                      <p className="text-[#475569] leading-relaxed">
                        {currentImpl.scopeRelationNote}
                      </p>
                      {primaryImpl && currentImpl.id !== primaryImpl.id ? (
                        <div className="text-[#334155]">
                          <span className="text-[#64748B]">主要数据实现：</span>
                          <span className="font-semibold text-[#0F172A]">
                            {primaryImpl.name}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[#2563EB] font-medium">当前实现即主要数据实现。</div>
                      )}
                    </div>
                  </BusinessObjectSection>

                  {/* 3. 关键属性落地 */}
                  <BusinessObjectSection
                    divider
                    title="关键属性落地"
                    headingId="impl-attributes"
                    description={`展示当前数据实现及其属性扩展如何承载${currentObject.name}的关键业务属性。`}
                  >
                    <div className="border border-[#E2E8F0] rounded-md overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2.5 px-4 font-semibold">业务属性</th>
                            <th className="py-2.5 px-4 font-semibold">当前来源</th>
                            <th className="py-2.5 px-4 font-semibold">数据字段</th>
                            <th className="py-2.5 px-4 font-semibold">当前正式语义</th>
                            <th className="py-2.5 px-4 font-semibold">状态</th>
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
                                <td className="py-2.5 px-4">
                                  {attr.needsCorrection ? (
                                    <span className="text-[#B45309] font-medium">需要修正</span>
                                  ) : attr.isSupported ? (
                                    <span className="text-[#15803D]">已支撑</span>
                                  ) : (
                                    <span className="text-[#94A3B8]">暂无支撑</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  {isRetired ? (
                                    <span className="text-[11px] text-[#94A3B8]">—</span>
                                  ) : attr.needsCorrection ? (
                                    <button
                                      id={`btn-correct-attr-${idx}`}
                                      onClick={() => {
                                        setSelectedCorrectionAttr(attr);
                                        setSelectedCorrectionRel(null);
                                        setIsCorrectionDrawerOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-medium cursor-pointer transition-colors"
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
                                    <span className="text-[11px] text-[#94A3B8]">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </BusinessObjectSection>

                  {/* 4. 核心关系落地 */}
                  <BusinessObjectSection
                    divider
                    title="核心关系落地"
                    headingId="impl-relationships"
                    description={`展示当前数据实现如何提供核心业务关系的身份支撑。`}
                  >
                    <div className="border border-[#E2E8F0] rounded-md overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2.5 px-4 font-semibold">业务关系</th>
                            <th className="py-2.5 px-4 font-semibold">目标对象</th>
                            <th className="py-2.5 px-4 font-semibold">来源字段</th>
                            <th className="py-2.5 px-4 font-semibold">目标身份</th>
                            <th className="py-2.5 px-4 font-semibold">状态</th>
                            <th className="py-2.5 px-4 font-semibold text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {currentImpl.relationships.map((rel, idx) => (
                            <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors text-[#334155]">
                              <td className="py-2.5 px-4">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <span className="font-semibold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                                    {rel.sourceObject}
                                  </span>
                                  <span className="text-[#2563EB] font-medium flex items-center px-1">
                                    <span>─</span>
                                    <span className="px-1.5 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[11px] font-semibold">
                                      {rel.relationName}
                                    </span>
                                    <span>→</span>
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                <button
                                  onClick={() => onNavigateToBusinessObjectDetail?.(rel.targetId, 'business')}
                                  className="font-semibold text-[#2563EB] hover:underline bg-white px-2 py-0.5 rounded border border-[#BFDBFE] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                                  title={`查看「${rel.targetObject}」正式业务对象详情`}
                                >
                                  {rel.targetObject}
                                </button>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-[#0F172A]">
                                {rel.sourceField}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="font-medium text-[#0F172A]">{rel.targetIdentity}</span>
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="text-[#15803D]">身份支撑已落地</span>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                {isRetired ? (
                                  <span className="text-[11px] text-[#94A3B8]">—</span>
                                ) : (
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
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </BusinessObjectSection>

                  {/* 5. 属性扩展与相关数据（资源角色分组，§8.4） */}
                  <BusinessObjectSection
                    title="属性扩展与相关数据"
                    headingId="impl-extensions-related"
                    description={`属性扩展与相关数据不单独计入正式数据实现基数，按资源角色分类展示。`}
                  >
                    <div className="space-y-6">
                      {/* 5.1 属性扩展 */}
                      <div className="space-y-3">
                        <h3 className="text-[13px] font-bold text-[#0F172A]">属性扩展</h3>
                        <div className="space-y-3">
                          {currentImpl.extension && (
                            <div className="p-4 bg-white border border-[#EEF2F6] rounded-md space-y-3">
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
                          )}

                          {supportGroups.attributeExtensions.map((resource) => (
                            <div
                              key={resource.key}
                              className="p-3.5 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="font-bold text-[#0F172A]">{resource.name}</div>
                                <div className="text-[11px] text-[#64748B]">
                                  适用范围：{resource.implementation?.scope ?? resource.relatedItem?.scope ?? '—'}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded font-medium">
                                  属性扩展
                                </span>
                                {resource.binding?.status === 'NEEDS_REVALIDATION' && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] rounded font-medium">
                                    待复核
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}

                          {!currentImpl.extension && supportGroups.attributeExtensions.length === 0 && (
                            <div className="p-4 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md text-xs text-[#64748B]">
                              当前数据实现暂无依附的属性扩展表，所有关键业务属性均已在视图中闭环承载。
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 5.2 相关数据（含事件历史 / 分析相关，分类清晰 §8.4） */}
                      <div className="space-y-3">
                        <h3 className="text-[13px] font-bold text-[#0F172A]">相关数据</h3>
                        {supportGroups.relatedData.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {supportGroups.relatedData.map((resource: SupportResourceViewModel) => (
                              <div
                                key={resource.key}
                                className="p-3.5 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-[#0F172A]">{resource.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-white text-[#475569] border border-[#E2E8F0] rounded font-medium">
                                    {RESOURCE_ROLE_LABELS[resource.role]}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#64748B]">
                                  关联范围：
                                  {resource.implementation?.scope ?? resource.relatedItem?.scope ?? '—'}
                                </div>
                                {(resource.implementation || resource.relatedItem) && (
                                  <p className="text-[#475569] leading-relaxed pt-1 border-t border-[#EEF2F6]">
                                    {resource.relatedItem?.note ??
                                      `以独立数据资源支撑「${currentObject.name}」，不表示对象实例本身。`}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md text-xs text-[#64748B]">
                            暂无与{currentObject.name}关联的相关数据资源。
                          </div>
                        )}
                      </div>
                    </div>
                  </BusinessObjectSection>
                </BusinessObjectSurface>
              }
              inspector={
                <BusinessObjectSurface variant="INSPECTOR" padded={false} className="p-5">
                  <BusinessObjectSection headingAs="h3" title="全部数据支撑">
                    <div className="space-y-5 text-xs">
                      {/* A. 正式数据实现（可切换查看） */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">正式数据实现</div>
                        <div className="space-y-2">
                          {formalImplementations.map((impl) => {
                            const isSelected = impl.id === currentImpl.id;
                            const isMain = impl.role === '主要数据实现';
                            const implBinding = bindingByImplId.get(impl.id);
                            return (
                              <div
                                key={impl.id}
                                onClick={() => {
                                  setSelectedImplId(impl.id);
                                  addToast?.('info', '切换查看上下文', `已切换至「${impl.name}」数据实现`);
                                }}
                                className={`p-2.5 rounded-md border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#EFF6FF] border-[#BFDBFE] border-l-2 border-l-[#2563EB]'
                                    : 'bg-[#F8FAFC] border-[#EEF2F6] hover:bg-[#F1F5F9]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`font-semibold ${isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                                    {impl.name}
                                  </span>
                                  {isMain && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shrink-0">
                                      主要数据实现
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#64748B] pt-1 flex items-center justify-between gap-2">
                                  <span>范围：{impl.scope}</span>
                                  {implBinding?.status === 'NEEDS_REVALIDATION' && (
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        onNavigateToRevalidation?.(currentObject.id, implBinding.id);
                                      }}
                                      className="shrink-0 px-1.5 py-0.5 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[10px] font-bold cursor-pointer hover:bg-[#FEF3C7]"
                                    >
                                      处理复核
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* B. 属性扩展 */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">属性扩展</div>
                        {supportGroups.attributeExtensions.length > 0 ? (
                          supportGroups.attributeExtensions.map((resource) => (
                            <div key={resource.key} className="p-2.5 rounded-md bg-[#F8FAFC] border border-[#EEF2F6]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-[#0F172A]">{resource.name}</span>
                                {resource.binding?.status === 'NEEDS_REVALIDATION' && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] font-medium shrink-0">
                                    待复核
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#64748B] pt-1">
                                依附：{resource.implementation?.identity ?? `${currentObject.name}关键属性`}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-[#94A3B8]">暂无属性扩展资源。</div>
                        )}
                      </div>

                      {/* C. 相关数据 */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">相关数据</div>
                        {supportGroups.relatedData.length > 0 ? (
                          supportGroups.relatedData.map((resource) => (
                            <div key={resource.key} className="p-2.5 rounded-md bg-[#F8FAFC] border border-[#EEF2F6]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-[#0F172A]">{resource.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-white text-[#475569] border border-[#E2E8F0] rounded shrink-0">
                                  {RESOURCE_ROLE_LABELS[resource.role]}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#64748B] pt-1">
                                范围：{resource.implementation?.scope ?? resource.relatedItem?.scope ?? '—'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-[#94A3B8]">暂无相关数据资源。</div>
                        )}
                      </div>

                      {/* D. 历史实现 */}
                      <div className="pt-2 border-t border-[#EEF2F6]">
                        <button
                          onClick={() => setIsHistoryDrawerOpen(true)}
                          className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <span>查看完整历史</span>
                          <span>→</span>
                        </button>
                        <p className="text-[11px] text-[#94A3B8] pt-1 leading-relaxed">
                          历史实现（已退休绑定）在完整历史中查看。
                        </p>
                      </div>
                    </div>
                  </BusinessObjectSection>
                </BusinessObjectSurface>
              }
            />
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* DRAWERS & MODALS（只读共享组件，不参与页面骨架）             */}
      {/* ========================================================= */}

      {/* EVIDENCE DRAWER（共享组件：依据来自领域 Store） */}
      <BusinessEvidenceDrawer
        isOpen={isEvidenceDrawerOpen}
        onClose={() => setIsEvidenceDrawerOpen(false)}
        objectName={currentObject.name}
        evidence={currentObject.evidence}
      />

      {/* HISTORY DRAWER（共享组件：三条修订生命周期分节，均来自领域 Store） */}
      <BusinessObjectHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        objectName={currentObject.name}
        revisions={objectRevisions}
        dataSupportRevisions={dataSupportRevisions}
        groundingRevisions={groundingRevisions}
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
                className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-3">
                <div className="font-semibold text-[#0F172A]">核心业务实体网络</div>
                <div className="space-y-2">
                  {relationships.length > 0 ? (
                    relationships.map((rel) => (
                      <div key={rel.targetId + rel.relationName} className="flex items-center justify-between bg-white p-2.5 rounded-md border border-[#E2E8F0]">
                        <span className="text-[#475569]">{rel.targetObject}</span>
                        <span className="text-xs font-medium text-[#2563EB]">← {rel.relationName}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#94A3B8]">暂未登记核心业务关系。</div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-3">
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
                className="px-4 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded-md hover:bg-[#1D4ED8] transition-colors cursor-pointer"
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
                「{currentObject.name}」当前处于<strong>{objectStatusLabel(currentObject.status)}</strong>生效状态，关联 {formalCount} 套正式数据实现及多项业务指标。
              </p>
              <p className="leading-relaxed">
                停用后，该对象将转为归档状态，在全域资源发现和新语义分析中将提示已停用。
              </p>
            </div>

            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end space-x-2">
              <button
                onClick={() => setIsDeactivateModalOpen(false)}
                className="px-3.5 py-1.5 border border-[#E2E8F0] text-[#334155] text-xs font-medium rounded-md hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setIsDeactivateModalOpen(false);
                  businessObjectRepository.setStatus(currentObject.id, 'RETIRED');
                  addToast?.('warning', '业务对象已停用', `「${currentObject.name}」已从正式生效业务对象目录中归档停用`);
                }}
                className="px-3.5 py-1.5 bg-[#DC2626] text-white text-xs font-medium rounded-md hover:bg-[#B91C1C] transition-colors cursor-pointer"
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
                是否将「{currentImpl?.name}」设为「{currentObject.name}」的主要数据实现？
              </p>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1.5 text-[11px] text-[#475569]">
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
                className="px-3.5 py-1.5 border border-[#E2E8F0] text-[#334155] text-xs font-medium rounded-md hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setIsSetPrimaryModalOpen(false);
                  // 真实领域写入：SET_PRIMARY 数据支撑修订 + 原主要实现自动降级（不改业务对象修订）
                  if (!currentImpl || !currentBinding) {
                    addToast?.('error', '操作失败', '未找到当前数据实现的正式绑定');
                    return;
                  }
                  const result = dataSupportService.setPrimary(currentBinding.id, { changedBy: '业务对象详情' });
                  if (result.ok === false) {
                    if (result.error === 'NOT_EFFECTIVE') {
                      addToast?.('warning', '无法设为主要实现', '仅已生效的数据实现可以设为主要数据实现，待复核实现请先完成复核');
                    } else {
                      addToast?.('error', '操作失败', '未找到当前数据实现的正式绑定');
                    }
                    return;
                  }
                  addToast?.(
                    'success',
                    '已更新主要数据实现',
                    `已将「${currentImpl.name}」设为主要数据实现${result.demotedBindingId ? '，原主要实现已降级为其他数据实现' : ''}，已记录数据支撑修订`
                  );
                }}
                className="px-3.5 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded-md hover:bg-[#1D4ED8] transition-colors cursor-pointer"
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

    </BusinessObjectPageShell>
  );
};
