import React, { useState, useEffect, useRef } from 'react';
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
import { INITIAL_BUSINESS_OBJECTS, BusinessObjectItem } from '../data/businessObjectsData';
import { 
  LocalGroundingCorrectionDrawer, 
  CandidateFieldOption 
} from './LocalGroundingCorrectionDrawer';

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

// Canonical Key Attributes for Service Ticket
const SERVICE_TICKET_ATTRIBUTES: KeyAttribute[] = [
  {
    name: '工单编号',
    meaning: '用于稳定识别一张服务工单。',
    isIdentifier: true
  },
  {
    name: '处理状态',
    meaning: '表示服务工单当前所处的办理状态。'
  },
  {
    name: '创建时间',
    meaning: '表示服务工单正式形成的业务时间。'
  },
  {
    name: '受理时间',
    meaning: '表示服务工单被正式受理的时间。'
  },
  {
    name: '办结时间',
    meaning: '表示服务工单完成办理的实际时间。'
  },
  {
    name: '诉求类型',
    meaning: '表示当前服务诉求所属的业务分类。'
  },
  {
    name: '来源渠道',
    meaning: '表示当前服务工单由热线、线上、窗口等哪个公共服务渠道形成。'
  }
];

// Fallback Key Attributes for other objects
const DEFAULT_ATTRIBUTES_MAP: Record<string, KeyAttribute[]> = {
  bo_person: [
    { name: '身份标识', meaning: '用于在约定的业务身份范围内稳定识别一个自然人。', isIdentifier: true },
    { name: '姓名', meaning: '表示自然人在业务中的正式核准姓名。' },
    { name: '出生日期', meaning: '表示自然人的出生时间，用于年龄与生命周期统计。' },
    { name: '性别', meaning: '表示人口生理或社会性别属性。' },
    { name: '常住状态', meaning: '表示当前是否属于常住人口统计范围。' },
    { name: '户籍状态', meaning: '表示自然人当前的户籍登记业务状态。' },
    { name: '所属行政区域', meaning: '表示自然人当前所属或统计归属的行政区域。' }
  ],
  bo_org: [
    { name: '统一社会信用代码', meaning: '用于法定稳定识别一家组织机构主体。', isIdentifier: true },
    { name: '机构名称', meaning: '组织机构在政务登记中的正式法定名称。' },
    { name: '机构级别', meaning: '组织机构在行政或权责体系中的层级分类。' },
    { name: '所在区域', meaning: '组织机构法定注册或履职所在的空间行政区划。' }
  ],
  bo_region: [
    { name: '行政区划代码', meaning: '用于国家标准体系下稳定识别一个行政区域。', isIdentifier: true },
    { name: '区域名称', meaning: '行政区域的标准规范全称。' },
    { name: '行政层级', meaning: '省、市、区县、街道镇等行政层级划分。' },
    { name: '常住人口总数', meaning: '该行政区域统计周期的常住人口总量。' }
  ]
};

// Canonical Core Business Relationships for Service Ticket
const SERVICE_TICKET_RELATIONSHIPS: CoreRelationship[] = [
  {
    sourceObject: '服务工单',
    relationName: '申请人',
    targetObject: '自然人',
    targetId: 'bo_person',
    meaning: '表示当前服务工单由哪个自然人提出。'
  },
  {
    sourceObject: '服务工单',
    relationName: '承办部门',
    targetObject: '组织机构',
    targetId: 'bo_org',
    meaning: '表示当前服务工单由哪个组织机构承担办理职责。'
  },
  {
    sourceObject: '服务工单',
    relationName: '所属区域',
    targetObject: '行政区域',
    targetId: 'bo_region',
    meaning: '表示当前服务工单在业务上归属的行政区域。'
  }
];

// Associated Business Semantics
const SERVICE_TICKET_TERMS: BusinessTermItem[] = [
  { id: 'term-st', name: '服务工单', definition: '公众通过公共服务渠道提出的诉求记录单据', domain: '公共服务' },
  { id: 'term-accept', name: '受理', definition: '服务机构审核公众诉求并正式立案接单的业务环节', domain: '公共服务' },
  { id: 'term-finish', name: '办结', definition: '承办部门完成诉求办理并形成答复结果的归档状态', domain: '公共服务' },
  { id: 'term-status', name: '工单状态', definition: '工单在整个生命周期中的流转环节与责任标识', domain: '公共服务' }
];

const SERVICE_TICKET_METRICS: RelatedMetricItem[] = [
  { id: 'met-count', name: '工单数量', definition: '统计期内公共服务渠道正式生成的工单总量', domain: '公共服务' },
  { id: 'met-rate', name: '办结率', definition: '在承诺办理期限内完成办结的工单占受理总量的比重', domain: '公共服务' },
  { id: 'met-duration', name: '平均办理时长', definition: '工单自正式受理至最终完成办结所耗费的平均工作小时数', domain: '公共服务' }
];

// Data Support Perspective Data Models
export type DataImplementationId = 'hotline_ticket' | 'curr_view';

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

export const SERVICE_TICKET_IMPLEMENTATIONS: FormalDataImplementation[] = [
  {
    id: 'hotline_ticket',
    name: '公共服务热线工单记录表',
    techName: 'hotline_db.service.pop_service_hotline',
    warehouseTable: 'dwd_pub_service_hotline_ticket_df',
    assetId: 'res-02',
    role: '其他数据实现',
    status: '当前有效',
    scope: '公共服务热线渠道',
    granularity: '一行一张服务工单',
    identity: '工单编号 · ticket_id',
    subject: '服务工单',
    scopeRelationText: '与“客服工单当前视图”存在部分范围重叠',
    scopeRelationNote: '两套实现可能包含部分相同的服务工单。本页只展示已经确认的语义范围关系，不执行跨来源合并、去重或优先级配置。',
    attributes: [
      {
        name: '工单编号',
        source: '公共服务热线工单记录表',
        field: 'ticket_id',
        semantics: '服务工单主体标识',
        isSupported: true,
        isIdentifier: true
      },
      {
        name: '处理状态',
        source: '公共服务热线工单记录表',
        field: 'status',
        semantics: '服务工单处理状态',
        isSupported: true
      },
      {
        name: '创建时间',
        source: '公共服务热线工单记录表',
        field: 'created_time',
        semantics: '服务工单创建时间',
        isSupported: true
      },
      {
        name: '受理时间',
        source: '公共服务热线工单记录表',
        field: 'accept_time',
        semantics: '服务工单受理时间',
        isSupported: true
      },
      {
        name: '办结时间',
        source: '公共服务热线工单记录表',
        field: 'close_time',
        semantics: '服务工单办结时间',
        isSupported: true
      },
      {
        name: '诉求类型',
        source: '工单扩展信息表',
        isExtension: true,
        field: 'appeal_type',
        semantics: '服务工单诉求类型',
        isSupported: true
      },
      {
        name: '来源渠道',
        source: '—',
        field: '—',
        semantics: '当前实现暂无正式支撑',
        isSupported: false
      }
    ],
    relationships: [
      {
        sourceObject: '服务工单',
        relationName: '申请人',
        targetObject: '自然人',
        targetId: 'bo_person',
        sourceField: '公共服务热线工单记录表 · person_id',
        targetIdentity: '自然人 · 主体标识'
      },
      {
        sourceObject: '服务工单',
        relationName: '承办部门',
        targetObject: '组织机构',
        targetId: 'bo_org',
        sourceField: '公共服务热线工单记录表 · dept_id',
        targetIdentity: '组织机构 · 机构标识'
      },
      {
        sourceObject: '服务工单',
        relationName: '所属区域',
        targetObject: '行政区域',
        targetId: 'bo_region',
        sourceField: '公共服务热线工单记录表 · region_code',
        targetIdentity: '行政区域 · 区域标识'
      }
    ],
    extension: {
      name: '工单扩展信息表',
      techName: 'hotline_db.service.ticket_extension',
      status: '当前有效',
      parentImplementation: '公共服务热线工单记录表',
      identityMapping: '工单编号 · ticket_id',
      providedAttr: '诉求类型 → appeal_type',
      providedField: 'appeal_type',
      note: '通过相同的工单身份空间，为当前数据实现中的同一服务工单补充业务属性。'
    }
  },
  {
    id: 'curr_view',
    name: '客服工单当前视图',
    techName: 'cs_db.service.ticket_curr_view',
    warehouseTable: 'dwd_pub_service_ticket_curr_view_df',
    assetId: 'res-01',
    role: '主要数据实现',
    status: '当前有效',
    scope: '客服业务当前工单',
    granularity: '一行一张服务工单',
    identity: '工单编号 · ticket_id',
    subject: '服务工单',
    scopeRelationText: '基准主要数据实现',
    scopeRelationNote: '承载客服业务当前工单全生命周期核心数据，作为服务工单最优先的数据查询与语义映射基准实现。',
    attributes: [
      {
        name: '工单编号',
        source: '客服工单当前视图',
        field: 'ticket_id',
        semantics: '服务工单主体标识',
        isSupported: true,
        isIdentifier: true
      },
      {
        name: '处理状态',
        source: '客服工单当前视图',
        field: 'status',
        semantics: '服务工单处理状态',
        isSupported: true
      },
      {
        name: '创建时间',
        source: '客服工单当前视图',
        field: 'created_time',
        semantics: '服务工单创建时间',
        isSupported: true
      },
      {
        name: '受理时间',
        source: '客服工单当前视图',
        field: 'accept_time',
        semantics: '服务工单受理时间',
        isSupported: true
      },
      {
        name: '办结时间',
        source: '客服工单当前视图',
        field: 'finished_time',
        semantics: '表示服务工单完成处理时间。',
        isSupported: true,
        needsCorrection: true,
        correctionReason: '数据语义修订：finished_time 实际表示最后更新时间，需修正为服务工单实际办结时间'
      },
      {
        name: '诉求类型',
        source: '客服工单当前视图',
        field: 'appeal_type',
        semantics: '服务工单诉求类型',
        isSupported: true
      },
      {
        name: '来源渠道',
        source: '客服工单当前视图',
        field: 'source_channel',
        semantics: '服务工单来源渠道',
        isSupported: true
      }
    ],
    relationships: [
      {
        sourceObject: '服务工单',
        relationName: '申请人',
        targetObject: '自然人',
        targetId: 'bo_person',
        sourceField: '客服工单当前视图 · applicant_id',
        targetIdentity: '自然人 · 主体标识'
      },
      {
        sourceObject: '服务工单',
        relationName: '承办部门',
        targetObject: '组织机构',
        targetId: 'bo_org',
        sourceField: '客服工单当前视图 · handle_dept_id',
        targetIdentity: '组织机构 · 机构标识'
      },
      {
        sourceObject: '服务工单',
        relationName: '所属区域',
        targetObject: '行政区域',
        targetId: 'bo_region',
        sourceField: '客服工单当前视图 · administrative_code',
        targetIdentity: '行政区域 · 区域标识'
      }
    ],
    extension: null
  }
];

export const SERVICE_TICKET_RELATED_DATA: RelatedDataItem[] = [
  {
    name: '工单状态历史表',
    role: '事件 / 历史数据',
    scope: '公共服务热线渠道',
    note: '一行记录一次热线服务工单状态变化，用于过程追溯。'
  },
  {
    name: '工单月度汇总表',
    role: '分析数据',
    scope: '服务工单整体分析',
    note: '按月份、区域和诉求类型形成聚合统计，不表示具体服务工单实例。'
  }
];

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
  addToast
}) => {
  // Active Tab: 业务视角 vs 数据支撑
  const [activeTab, setActiveTab] = useState<'business' | 'data_support'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, objectId]);

  // Current Object
  const currentObject: BusinessObjectItem =
    INITIAL_BUSINESS_OBJECTS.find((b) => b.id === objectId) ||
    INITIAL_BUSINESS_OBJECTS.find((b) => b.id === 'bo_service_ticket')!;

  const isServiceTicket = currentObject.id === 'bo_service_ticket';

  // Attributes & Relationships
  const attributes: KeyAttribute[] = isServiceTicket
    ? SERVICE_TICKET_ATTRIBUTES
    : DEFAULT_ATTRIBUTES_MAP[currentObject.id] || DEFAULT_ATTRIBUTES_MAP.bo_person;

  const relationships: CoreRelationship[] = isServiceTicket
    ? SERVICE_TICKET_RELATIONSHIPS
    : currentObject.relationships.map((rel) => ({
        sourceObject: currentObject.name,
        relationName: rel.name,
        targetObject: rel.targetName,
        targetId: rel.targetId,
        meaning: `表示${currentObject.name}与${rel.targetName}之间的业务对应与约束逻辑。`
      }));

  // State for menus and drawers
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isKnowledgeDrawerOpen, setIsKnowledgeDrawerOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<BusinessTermItem | null>(null);

  // Data Support View State
  const [implementations, setImplementations] = useState<FormalDataImplementation[]>(SERVICE_TICKET_IMPLEMENTATIONS);
  const [selectedImplId, setSelectedImplId] = useState<DataImplementationId>('curr_view');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSetPrimaryModalOpen, setIsSetPrimaryModalOpen] = useState(false);
  const [isContextMoreOpen, setIsContextMoreOpen] = useState(false);
  const [isCorrectionDrawerOpen, setIsCorrectionDrawerOpen] = useState(true);
  const [selectedCorrectionAttr, setSelectedCorrectionAttr] = useState<DataImplementationAttributeLanding | null>(null);

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
    implementations[0];

  const handleConfirmCorrection = (selectedField: CandidateFieldOption) => {
    const targetAttrName = selectedCorrectionAttr ? selectedCorrectionAttr.name : '办结时间';
    setImplementations((prev) =>
      prev.map((impl) => {
        if (impl.id === selectedImplId) {
          return {
            ...impl,
            attributes: impl.attributes.map((attr) => {
              if (attr.name === targetAttrName) {
                return {
                  ...attr,
                  field: selectedField.field,
                  semantics: selectedField.semantics,
                  needsCorrection: false,
                  revisionVersion: 'Revision 2 (2026-09-08 当前有效)'
                };
              }
              return attr;
            })
          };
        }
        return impl;
      })
    );
    setIsCorrectionDrawerOpen(false);
    addToast?.('success', '已生成新的 Grounding Revision', `已将「${targetAttrName}」数据字段修正为 ${selectedField.field}，Revision 2 当前生效。历史记录已完整保留。`);
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
                  {isServiceTicket ? 'Service Ticket' : currentObject.id}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5" />
                  已发布
                </span>
              </div>

              {/* Weak Facts Line (No big numbers/KPI badges) */}
              <div className="flex items-center space-x-2 text-xs text-[#64748B] pt-0.5">
                <span>主要业务域：{currentObject.domain}</span>
                <span className="text-[#CBD5E1]">·</span>
                <span>两套数据实现</span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-2 shrink-0 relative" ref={moreMenuRef}>
              <button
                id="btn-view-knowledge-network"
                onClick={handleKnowledgeNetworkClick}
                className="px-3.5 py-1.5 rounded bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="查看以服务工单为中心的知识网络上下文"
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
                2 套实现
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
                        {isServiceTicket ? '工单编号' : attributes.find(a => a.isIdentifier)?.name || '业务唯一标识'}
                      </span>
                      <button
                        onClick={() => handleCopyIdentifier(isServiceTicket ? '工单编号' : '业务唯一标识')}
                        className="p-1 text-[#94A3B8] hover:text-[#2563EB] rounded transition-colors cursor-pointer"
                        title="复制主体标识名称"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      用于在约定的业务身份范围内稳定识别一张服务工单。
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
                    描述服务工单跨具体数据实现仍具有稳定业务意义的核心特征。
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
                    描述服务工单与其他企业正式业务对象之间稳定的业务联系。
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
                    与服务工单紧密关联的已核准企业业务术语与统计分析指标。
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
                      {SERVICE_TICKET_TERMS.map((term) => (
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
                      {SERVICE_TICKET_METRICS.map((metric) => (
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
                    <div className="font-semibold text-[#0F172A]">客服工单当前视图</div>
                    <div className="text-[11px] text-[#64748B]">客服业务当前工单</div>
                  </div>

                  {/* 其他数据实现 */}
                  <div className="space-y-0.5 pt-1">
                    <div className="text-[#64748B] text-[11px]">其他数据实现</div>
                    <div className="font-semibold text-[#0F172A]">公共服务热线工单记录表</div>
                    <div className="text-[11px] text-[#64748B]">公共服务热线渠道</div>
                  </div>

                  {/* 属性扩展 */}
                  <div className="space-y-0.5 pt-1">
                    <div className="text-[#64748B] text-[11px]">属性扩展</div>
                    <div className="text-[#334155]">工单扩展信息表</div>
                  </div>

                  {/* 相关数据 */}
                  <div className="space-y-0.5 pt-1">
                    <div className="text-[#64748B] text-[11px]">相关数据</div>
                    <div className="text-[#334155] leading-relaxed">
                      工单状态历史表、工单月度汇总表
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
                    <div className="text-[#334155] flex items-center space-x-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#94A3B8]" />
                      <span>新版《公共服务热线运行管理办法》</span>
                    </div>
                    <div className="text-[#334155] flex items-center space-x-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#94A3B8]" />
                      <span>用户业务说明</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#166534] pt-1">
                    当前正式定义已发布
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
        {activeTab === 'data_support' && (
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
                        正式数据实现（共 2 套）
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
                    <span className="font-semibold text-[#0F172A]">客服工单当前视图</span>
                  </div>
                  <div className="text-[#64748B] text-[11px]">
                    {currentImpl.id === 'hotline_ticket' ? (
                      <span>与主要实现：部分范围重叠</span>
                    ) : (
                      <span className="text-[#2563EB] font-medium">当前即主要数据实现</span>
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
                      展示当前数据实现及其属性扩展如何承载“服务工单”的关键业务属性。
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
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[#64748B]">目标身份：</span>
                            <span className="font-medium text-[#0F172A]">{rel.targetIdentity}</span>
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
                      为当前数据实现中的同一服务工单补充场景特定属性，不单独计入核心数据实现基数。
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
                      与“服务工单”有关，但本身不表示服务工单实例的数据资源。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SERVICE_TICKET_RELATED_DATA.map((item, idx) => (
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
                    <span className="text-[11px] text-[#64748B]">2 套</span>
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
                          addToast?.('info', '发现数据支撑', '已发起针对「服务工单」业务主体的语义数据资产发现与关联分析');
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
                    公共服务热线工单记录表与主要数据实现存在部分范围重叠。
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

      {/* EVIDENCE DRAWER */}
      {isEvidenceDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <aside className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-[#0F172A]">定义依据 · 服务工单</h3>
                <p className="text-xs text-[#64748B]">当前正式业务定义的已记录来源</p>
              </div>
              <button
                onClick={() => setIsEvidenceDrawerOpen(false)}
                className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[#334155]">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-semibold text-[#0F172A]">新版《公共服务热线运行管理办法》</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  第二章 第四条：“服务工单统指公民、法人或其他组织通过热线、移动客户端、政务大厅窗口等公共服务渠道提交的事项申请、咨询、求助与投诉流转全过程的统一业务凭据。”
                </p>
                <div className="text-[11px] text-[#64748B]">来源机构：市政务服务管理办公室 · 2026年核准</div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-semibold text-[#0F172A]">用户业务说明</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  业务部门在需求说明中明确指出：“统一将热线受理单、网格流转单和群众诉求工单统括在‘服务工单’这一业务主体下，统一考核办结率与平均办理时长。”
                </p>
                <div className="text-[11px] text-[#64748B]">确认记录：业务架构委员会语义评审纪要</div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsEvidenceDrawerOpen(false)}
                className="px-4 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* HISTORY DRAWER */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <aside className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-[#0F172A]">变更历史 · 服务工单</h3>
                <p className="text-xs text-[#64748B]">企业业务语义目录中该对象的生效版本记录</p>
              </div>
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-4 bg-white border border-[#E2E8F0] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">当前生效正式版本</span>
                  <span className="text-[10px] text-[#166534] bg-[#F0FDF4] border border-[#DCFCE7] px-2 py-0.5 rounded font-medium">
                    已发布
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  明确热线、线上、窗口等公共服务渠道，并加入别名“群众诉求工单”和关键属性“来源渠道”。
                </p>
                <div className="text-[11px] text-[#64748B] pt-1">
                  变更依据：新版《公共服务热线运行管理办法》
                </div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#334155]">历史基线版本</span>
                  <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    历史版本
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  初始定义为企业公共服务热线服务诉求主体，建立与自然人、组织机构的核心业务关联。
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="px-4 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* KNOWLEDGE NETWORK CONTEXT DRAWER */}
      {isKnowledgeDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <aside className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-[#0F172A]">知识网络上下文 · 服务工单</h3>
                <p className="text-xs text-[#64748B]">以服务工单为中心的企业语义关系上下文</p>
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
                  <div className="flex items-center justify-between bg-white p-2.5 rounded border border-[#E2E8F0]">
                    <span className="text-[#475569]">自然人</span>
                    <span className="text-xs font-medium text-[#2563EB]">← 提出申请人</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded border border-[#E2E8F0]">
                    <span className="text-[#475569]">组织机构</span>
                    <span className="text-xs font-medium text-[#2563EB]">← 承办部门</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded border border-[#E2E8F0]">
                    <span className="text-[#475569]">行政区域</span>
                    <span className="text-xs font-medium text-[#2563EB]">← 所属区域</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-3">
                <div className="font-semibold text-[#0F172A]">业务术语与指标网络</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[#334155]">术语: 受理</span>
                  <span className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[#334155]">术语: 办结</span>
                  <span className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[#334155]">指标: 工单数量</span>
                  <span className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[#334155]">指标: 办结率</span>
                  <span className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[#334155]">指标: 平均办理时长</span>
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
                「服务工单」当前处于<strong>已发布</strong>生效状态，关联 2 套正式数据实现及多项业务指标。
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
                  addToast?.('warning', '业务对象已停用', '「服务工单」已从正式生效业务对象目录中归档停用');
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
                是否将「{currentImpl.name}」设为「服务工单」的主要数据实现？
              </p>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5 text-[11px] text-[#475569]">
                <div className="text-[#0F172A] font-medium pb-1 border-b border-[#E2E8F0]">口径与操作影响说明：</div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-[#2563EB]">·</span>
                  <span>仅调整在企业业务语义目录中的默认展示与一般基准参考实现。</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-[#2563EB]">·</span>
                  <span>不会删除或变更现有其他正式数据实现（如客服工单当前视图）。</span>
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
        onClose={() => setIsCorrectionDrawerOpen(false)}
        onConfirm={handleConfirmCorrection}
        businessObjectName={currentObject.name}
        dataImplementationName={currentImpl.name}
        dataImplementationRole={currentImpl.role}
        attributeName={selectedCorrectionAttr ? selectedCorrectionAttr.name : '办结时间'}
        currentField={selectedCorrectionAttr ? selectedCorrectionAttr.field : (currentImpl.attributes.find(a => a.name === '办结时间')?.field || 'finished_time')}
        currentSemantics={selectedCorrectionAttr ? selectedCorrectionAttr.semantics : (currentImpl.attributes.find(a => a.name === '办结时间')?.semantics || '表示服务工单完成处理时间。')}
      />

    </div>
  );
};
