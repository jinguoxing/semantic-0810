import React, { useState, useSyncExternalStore } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Plus,
  Table as TableIcon,
  MoreHorizontal,
  X,
  Database
} from 'lucide-react';
import {
  businessObjectRepository,
  dataSupportService,
  objectResolutionContexts,
  subscribe,
  getVersion,
  type BusinessObject
} from '../domain/business-object';
import {
  BusinessObjectPageShell,
  BusinessObjectDecisionLayout,
  BusinessObjectSurface,
  BusinessObjectSection,
  BusinessObjectEmptyState
} from './business-object/ui';

export interface BusinessObjectResolutionWorkspaceProps {
  /** Bottom-up 入口登记的任务 ID（入口必须携带来源上下文，禁止无上下文演示） */
  taskId: string;
  /** 按上下文 returnRoute 返回原上下文（数据资产 / 数据语义 / 任务） */
  onBackToSource?: () => void;
  /** 创建新业务对象：携带本任务上下文进入创建工作台，发布后自动完成对齐 */
  onCreateNewObject?: (taskId: string) => void;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

/** Bottom-up 对齐失败 → 展示说明（领域校验失败时零写入） */
const ALIGN_ERROR_LABELS: Record<string, string> = {
  OBJECT_NOT_FOUND: '未找到目标业务对象，请刷新后重试'
};

export const BusinessObjectResolutionWorkspace: React.FC<BusinessObjectResolutionWorkspaceProps> = ({
  taskId,
  onBackToSource,
  onCreateNewObject,
  addToast
}) => {
  // 领域 Store 订阅：对齐写入 / 状态流转后本页同步刷新
  useSyncExternalStore(subscribe, getVersion);

  // Resolution 入口上下文：数据资产 / 数据语义 / 任务进入时登记
  const resolutionContext = objectResolutionContexts.get(taskId);
  const sourceName = resolutionContext?.dataAsset.name ?? '来源数据';
  // 旧版上下文迁移后无法解析到统一数据资产目录 → 只读保留，禁止再发起正式对齐
  const isMigrationReadOnly = Boolean(resolutionContext?.migrationWarning);

  // 候选业务对象来自领域仓库（禁止写死「服务工单 / 热线工单」演示对）；
  // 初始不选中任何对象：Bottom-up 对齐必须由用户显式选择目标对象。
  // 直接随 Store 订阅渲染取值（不缓存），新建对象后返回本页也能看到
  const publishedObjects = businessObjectRepository
    .list()
    .filter((object) => object.status === 'PUBLISHED');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const selectedObject: BusinessObject | null = selectedObjectId
    ? publishedObjects.find((object) => object.id === selectedObjectId) ?? null
    : null;

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeDefinitionObject, setActiveDefinitionObject] = useState<BusinessObject | null>(null);

  /** 上下文存在时的返回：按 returnRoute 回原上下文 */
  const returnToOrigin = () => {
    onBackToSource?.();
  };

  /** 确认对齐：真实领域写入（BOTTOM_UP_ALIGN 数据支撑修订，不产生业务对象修订） */
  const handleConfirm = () => {
    if (!resolutionContext || !selectedObject) return;
    if (isMigrationReadOnly) {
      addToast?.(
        'warning',
        '上下文只读',
        '该对齐任务来自旧版本来源，无法解析到统一数据资产目录，只读保留，不再产生正式绑定。'
      );
      return;
    }
    const { dataAsset, semanticSource } = resolutionContext;
    const result = dataSupportService.confirmBottomUpAlignment({
      taskId: resolutionContext.taskId,
      businessObjectId: selectedObject.id,
      dataAsset,
      ...(semanticSource ? { semanticSource } : {}),
      implementation: {
        name: dataAsset.name,
        techName: dataAsset.techName ?? dataAsset.id,
        warehouseTable: dataAsset.warehouseTable ?? dataAsset.techName ?? dataAsset.id,
        assetId: dataAsset.id,
        scope: dataAsset.name,
        granularity: '一行一条业务记录（对齐后完善）',
        identity: '（对齐后完善）',
        scopeRelationText: '自下而上对齐（Bottom-up Resolution 登记）',
        scopeRelationNote: '由 Bottom-up Resolution 确认的数据实现，直接生效并记录数据支撑修订，字段级落地待后续完善。',
        attributes: [],
        relationships: []
      },
      changedBy: '业务对象对齐工作台'
    });
    if (result.ok === false) {
      if (result.error === 'BINDING_CONFLICT') {
        addToast?.(
          'error',
          '对齐未生效',
          `该数据当前已作为“${result.conflictObjectName ?? '其他业务对象'}”的数据实现。如需表达多个业务主体，请先明确独立记录粒度、身份和范围。`
        );
      } else {
        addToast?.('error', '对齐未生效', ALIGN_ERROR_LABELS[result.error]);
      }
      return;
    }
    if (result.outcome === 'IDEMPOTENT_SUCCESS') {
      addToast?.(
        'info',
        '数据支撑已存在',
        `「${sourceName}」已正式承载「${selectedObject.name}」，本次未重复建立绑定（任务 ${resolutionContext.taskId} 已完成）。`
      );
    } else {
      addToast?.(
        'success',
        '业务对象对齐已确认',
        `「${sourceName}」已生效为「${selectedObject.name}」的${result.role === 'PRIMARY' ? '主要' : '其他'}数据实现（绑定修订 ${
          result.binding.revision
        }），任务 ${resolutionContext.taskId} 已完成；已记录数据支撑修订，业务对象修订不受影响。`
      );
    }
    returnToOrigin();
  };

  /** 稍后处理：POSTPONED（保留上下文，不清除，可从任务入口继续） */
  const handlePostponeClick = () => {
    if (resolutionContext) {
      objectResolutionContexts.postpone(resolutionContext.taskId);
    }
    addToast?.(
      'info',
      '已保留对齐任务',
      `${sourceName}的业务对象对齐任务已置为稍后处理（上下文已保留），您可随时从任务入口继续处理。`
    );
    returnToOrigin();
  };

  /** 本轮不建立：CANCELLED（本轮语义沉淀不建立对象关联） */
  const handleSkipThisRound = () => {
    setIsMoreMenuOpen(false);
    if (resolutionContext) {
      objectResolutionContexts.cancel(resolutionContext.taskId);
    }
    addToast?.(
      'info',
      '本轮不建立对象关联',
      `已将「${sourceName}」的对齐任务标记为本轮不建立（任务 ${resolutionContext?.taskId ?? ''} 已取消）。`
    );
    returnToOrigin();
  };

  // ---------------------------------------------------------
  // 无上下文 / 已终结状态（禁止退化成写死演示页）
  // ---------------------------------------------------------
  if (!resolutionContext) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F7F9FC] p-8">
        <BusinessObjectSurface variant="MAIN" padded={false} className="max-w-md">
          <BusinessObjectEmptyState
            icon={<Database className="w-5 h-5" />}
            title="未找到对齐任务上下文"
            description={`业务对象对齐必须从数据资产、数据语义或任务入口进入并携带来源上下文（任务 ${taskId} 不存在）。`}
            primaryAction={
              <button
                onClick={returnToOrigin}
                className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                返回
              </button>
            }
          />
        </BusinessObjectSurface>
      </div>
    );
  }

  if (resolutionContext.status === 'COMPLETED') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F7F9FC] p-8">
        <BusinessObjectSurface variant="MAIN" padded={false} className="max-w-md">
          <BusinessObjectEmptyState
            icon={<CheckCircle2 className="w-5 h-5 text-[#16A34A]" />}
            title="对齐任务已完成"
            description={`「${sourceName}」的业务对象对齐任务（${resolutionContext.taskId}）已完成，数据支撑修订已记录至对应业务对象。`}
            primaryAction={
              <button
                onClick={returnToOrigin}
                className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                返回原上下文
              </button>
            }
          />
        </BusinessObjectSurface>
      </div>
    );
  }

  if (resolutionContext.status === 'CANCELLED') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F7F9FC] p-8">
        <BusinessObjectSurface variant="MAIN" padded={false} className="max-w-md">
          <BusinessObjectEmptyState
            icon={<Info className="w-5 h-5" />}
            title="对齐任务已取消"
            description={`「${sourceName}」的对齐任务（${resolutionContext.taskId}）已标记为本轮不建立对象关联。`}
            primaryAction={
              <button
                onClick={returnToOrigin}
                className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                返回原上下文
              </button>
            }
          />
        </BusinessObjectSurface>
      </div>
    );
  }

  return (
    <BusinessObjectPageShell
      breadcrumb={
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#64748B]">
          <button onClick={returnToOrigin} className="hover:text-[#2563EB] transition-colors cursor-pointer">
            数据语义
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#475569] font-medium truncate max-w-[200px]">{sourceName}</span>
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#0F172A] font-medium">业务对象对齐</span>
        </nav>
      }
      header={
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">业务对象对齐</h1>
              <span className="text-xs text-[#64748B] font-mono">Business Object Resolution</span>
            </div>
            <p className="text-xs text-[#64748B]">
              根据当前有效数据语义，确认这份数据应采用哪个正式业务对象定义。
            </p>

            {/* Source Badges */}
            <div className="flex items-center space-x-3 pt-1.5 flex-wrap gap-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs text-[#334155] font-semibold">
                <TableIcon className="w-3.5 h-3.5 text-[#64748B]" />
                <span>{sourceName}</span>
              </div>
              <span className="text-[#CBD5E1]">·</span>
              <span className="font-mono text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                {resolutionContext.dataAsset.id}
              </span>
              {resolutionContext.semanticSource && (
                <>
                  <span className="text-[#CBD5E1]">·</span>
                  <span className="font-mono text-xs text-[#64748B]">
                    来源版本 {resolutionContext.semanticSource.semanticRevision}
                  </span>
                </>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                数据语义已确认
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                <Info className="w-3 h-3" />
                <span>
                  对齐任务 {resolutionContext.taskId} · {resolutionContext.status === 'POSTPONED' ? '稍后处理中，可继续确认' : '进行中'} · 完成后返回原上下文
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="btn-postpone-resolution"
              onClick={handlePostponeClick}
              className="px-3.5 py-1.5 rounded-md bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-medium transition-colors cursor-pointer"
            >
              稍后处理
            </button>
          </div>
        </div>
      }
    >
      <BusinessObjectDecisionLayout
        variant="THREE_COLUMN"
        /* --------------------------------------------------------------- */
        /* 左栏：当前数据上下文（决策期间固定）                                */
        /* --------------------------------------------------------------- */
        context={
          <BusinessObjectSurface variant="CONTEXT" padded={false} className="p-5 gap-6">
            {/* 1. 当前数据 */}
            <BusinessObjectSection divider title="当前数据" headingAs="h2">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0F172A]">{sourceName}</span>
                  <span className="text-[11px] font-medium text-[#64748B] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                    {resolutionContext.sourceType === 'DATA_ASSET' ? '数据资产' : resolutionContext.sourceType === 'DATA_SEMANTICS' ? '数据语义' : '任务'}
                  </span>
                </div>
                <div
                  className="font-mono text-[11px] text-[#64748B] truncate"
                  title={resolutionContext.dataAsset.techName ?? resolutionContext.dataAsset.id}
                >
                  {resolutionContext.dataAsset.techName ?? resolutionContext.dataAsset.id}
                </div>

                <dl className="space-y-3 pt-1">
                  {resolutionContext.semanticSource ? (
                    <div className="space-y-0.5">
                      <dt className="text-[#64748B] text-[11px] font-medium">语义来源</dt>
                      <dd className="text-[#0F172A] font-medium font-mono text-[11px] bg-[#F1F5F9] px-1.5 py-0.5 rounded inline-block">
                        {resolutionContext.semanticSource.semanticId} @ {resolutionContext.semanticSource.semanticRevision}
                      </dd>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <dt className="text-[#64748B] text-[11px] font-medium">数据资产目录</dt>
                      <dd className="text-[#0F172A] font-medium font-mono text-[11px] bg-[#F1F5F9] px-1.5 py-0.5 rounded inline-block">
                        {resolutionContext.dataAsset.id}
                      </dd>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <dt className="text-[#64748B] text-[11px] font-medium">语义状态</dt>
                    <dd className="text-[#0F172A] font-medium">已确认（进入对齐前完成）</dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-[#64748B] text-[11px] font-medium">对齐任务</dt>
                    <dd className="text-[#0F172A] font-medium">
                      {resolutionContext.taskId}（{resolutionContext.status === 'POSTPONED' ? '稍后处理中' : '进行中'}）
                    </dd>
                  </div>
                </dl>
              </div>
            </BusinessObjectSection>

            {/* 旧版来源只读警示 */}
            {isMigrationReadOnly && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-md p-3 flex items-start space-x-2">
                <Info className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#991B1B] leading-relaxed">
                  <div className="font-bold">旧版来源（只读保留）</div>
                  <p className="mt-0.5">{resolutionContext.migrationWarning}</p>
                </div>
              </div>
            )}

            {/* 2. 本次确认将建立 */}
            <BusinessObjectSection title="本次确认将建立" headingAs="h2">
              <div className="space-y-3 text-xs">
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  确认后当前数据将直接生效为目标业务对象的数据实现（自下而上对齐），并记录一条数据支撑修订；不会产生业务对象修订，也不会改动业务对象正式修订号。
                </p>
                <div className="pt-2 border-t border-[#EEF2F6]">
                  <button
                    onClick={returnToOrigin}
                    className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>返回原上下文</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </BusinessObjectSection>
          </BusinessObjectSurface>
        }

        /* --------------------------------------------------------------- */
        /* 中栏：选择正式业务对象（连续主表面）                                */
        /* --------------------------------------------------------------- */
        decision={
          <BusinessObjectSurface variant="MAIN">
            {/* 1. 决策问题 */}
            <BusinessObjectSection
              divider
              title="选择正式业务对象"
              headingId="resolution-select"
              description="当前数据可能符合多个正式业务对象，需要确认本次应采用哪一套企业业务定义（不预选，由您显式决定）。"
            >
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-md p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span className="text-xs font-bold text-[#92400E]">当前需要判断</span>
                </div>
                <div className="text-xs text-[#78350F] font-medium leading-relaxed pl-6">
                  {`这份「${sourceName}」数据，应采用哪个正式业务对象的定义？`}
                </div>
                <div className="text-[11px] text-[#A16207] pl-6">
                  当前没有可直接套用的企业采用规则，Semovix 不替用户默认决定。
                </div>
              </div>
            </BusinessObjectSection>

            {/* 2. 候选正式业务对象（来自领域仓库） */}
            <BusinessObjectSection divider title={`候选正式业务对象（${publishedObjects.length} 个）`} headingId="resolution-candidates">
              <div className="space-y-2.5">
                {publishedObjects.map((object) => {
                  const isSelected = selectedObjectId === object.id;
                  return (
                    <div
                      key={object.id}
                      id={`bo-option-${object.id}`}
                      onClick={() => setSelectedObjectId(object.id)}
                      className={`p-4 border rounded-md transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#EFF6FF] border-[#2563EB]'
                          : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <input
                            type="radio"
                            name="bo_candidate"
                            id={`candidate-${object.id}`}
                            checked={isSelected}
                            onChange={() => setSelectedObjectId(object.id)}
                            className="w-4 h-4 text-[#2563EB] border-[#CBD5E1] focus:ring-[#2563EB] cursor-pointer"
                          />
                          <div className="min-w-0">
                            <label htmlFor={`candidate-${object.id}`} className="text-sm font-bold text-[#0F172A] cursor-pointer">
                              {object.name}
                            </label>
                            <span className="ml-1.5 text-xs text-[#64748B] font-normal font-mono">{object.id}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded shrink-0">
                            已选择
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed pt-2 line-clamp-2">{object.definition}</p>

                      <div className="mt-2 flex items-center justify-between text-xs text-[#64748B]">
                        <span className="inline-flex items-center text-[11px] text-[#475569]">
                          已发布 · {object.domain} · 正式修订 {object.currentRevision}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDefinitionObject(object);
                          }}
                          className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                        >
                          查看完整定义
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </BusinessObjectSection>

            {/* 3. 当前选择状态 */}
            <BusinessObjectSection title="当前选择" headingId="resolution-status">
              <div className="p-3.5 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[#64748B]">当前选择：</span>
                  <span className="font-bold text-[#0F172A]">{selectedObject ? selectedObject.name : '尚未选择'}</span>
                </div>
                <div className="text-xs text-[#64748B]">
                  状态说明：
                  <span className="text-[#475569] font-medium">
                    {selectedObject ? '已选择目标业务对象，尚未提交正式对齐。' : '需先选择一个正式业务对象后才能确认对齐。'}
                  </span>
                </div>
              </div>
            </BusinessObjectSection>
          </BusinessObjectSurface>
        }

        /* --------------------------------------------------------------- */
        /* 右栏：Decision Inspector（本次对齐 + 条件 + 动作）                  */
        /* --------------------------------------------------------------- */
        inspector={
          <BusinessObjectSurface variant="INSPECTOR" padded={false} className="p-5 gap-6">
            {/* 1. 本次对齐 */}
            <BusinessObjectSection divider title="本次对齐" headingAs="h2">
              <div className="space-y-2.5 text-xs">
                <div className="space-y-0.5">
                  <div className="text-[#64748B] text-[11px] font-medium">目标业务对象</div>
                  <div className="text-sm font-bold text-[#0F172A]">
                    {selectedObject ? selectedObject.name : '（尚未选择）'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[#64748B] text-[11px] font-medium">当前数据来源</div>
                  <div className="text-xs text-[#334155] font-medium">{sourceName}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[#64748B] text-[11px] font-medium">拟建立关系</div>
                  <div className="text-xs text-[#334155] bg-[#F8FAFC] p-2 rounded border border-[#EEF2F6] leading-relaxed">
                    {selectedObject
                      ? `${sourceName} 作为「${selectedObject.name}」的一套数据实现（直接生效）`
                      : '选择目标业务对象后确认建立数据实现关系'}
                  </div>
                </div>
              </div>
            </BusinessObjectSection>

            {/* 2. 数据实现条件 */}
            <BusinessObjectSection divider title="数据实现条件" headingAs="h2">
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-md border border-[#EEF2F6] bg-[#F8FAFC] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0F172A]">资产唯一性</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                      系统核验
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-normal">
                    同一数据资产在同一时间只正式承载一个业务对象；如已被其他对象正式承载，确认时将被拦截。
                  </p>
                </div>
                <div className="p-2.5 rounded-md border border-[#EEF2F6] bg-[#F8FAFC] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0F172A]">直接生效</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                      Bottom-up 规则
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-normal">
                    自下而上确认的数据实现直接生效（不经过候选期）；对象尚无生效实现时成为主要数据实现，否则为其他数据实现。
                  </p>
                </div>
                <div className="p-2.5 rounded-md border border-[#EEF2F6] bg-[#F8FAFC] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0F172A]">修订边界</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                      数据支撑修订
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-normal">
                    仅记录数据支撑修订（BOTTOM_UP_ALIGN），不产生业务对象修订，不改动业务对象正式修订号。
                  </p>
                </div>
              </div>
            </BusinessObjectSection>

            {/* 3. 采用后的含义 */}
            <BusinessObjectSection title="采用后的含义" headingAs="h2">
              <p className="text-xs text-[#0F172A] leading-relaxed font-medium bg-[#F8FAFC] p-2.5 rounded border border-[#EEF2F6]">
                {selectedObject
                  ? `当前数据将成为「${selectedObject.name}」的一套正式数据实现，其适用范围与已有实现互不替换。`
                  : '选择业务对象后将说明采用后的含义。'}
              </p>
            </BusinessObjectSection>

            {/* 4. 决策动作 */}
            <div className="space-y-3">
              <button
                id="btn-confirm-resolution"
                onClick={handleConfirm}
                disabled={!selectedObject || isMigrationReadOnly}
                className="w-full h-10 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#93C5FD] disabled:cursor-not-allowed text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{selectedObject ? `确认对齐“${selectedObject.name}”` : '请先选择目标业务对象'}</span>
              </button>

              <p className="text-[11px] text-[#64748B] leading-normal text-center">
                将建立当前资产的数据实现（直接生效），记录数据支撑修订并完成对齐任务；不产生业务对象修订。
              </p>

              <div className="pt-1 flex items-center justify-between border-t border-[#EEF2F6]">
                <button
                  type="button"
                  id="btn-create-new-object"
                  onClick={() => onCreateNewObject?.(resolutionContext.taskId)}
                  className="text-xs text-[#475569] hover:text-[#0F172A] font-medium flex items-center space-x-1 transition-colors cursor-pointer pt-2"
                  title="适用于现有正式业务对象都不能准确表达这份数据的情况（创建后自动完成对齐）"
                >
                  <Plus className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>创建新业务对象</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className="p-1 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
                    aria-label="更多操作"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1 z-30">
                      <button
                        type="button"
                        id="btn-cancel-resolution"
                        onClick={handleSkipThisRound}
                        className="w-full px-3 py-1.5 text-xs text-left text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
                      >
                        本轮不建立对象关联
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </BusinessObjectSurface>
        }
      />

      {/* ========================================================= */}
      {/* MODAL: 查看完整定义（数据来自领域仓库，Local Overlay C）      */}
      {/* ========================================================= */}
      {activeDefinitionObject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-[#E2E8F0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">{activeDefinitionObject.name}</h3>
                <p className="text-xs text-[#64748B] font-mono">
                  {activeDefinitionObject.id} · 正式修订 {activeDefinitionObject.currentRevision}
                </p>
              </div>
              <button
                onClick={() => setActiveDefinitionObject(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded hover:bg-[#E2E8F0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-[#334155]">
              <div className="space-y-1">
                <div className="font-semibold text-[#0F172A]">业务定义</div>
                <p className="leading-relaxed bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                  {activeDefinitionObject.definition}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-[#0F172A]">主体标识</div>
                  <div className="font-mono bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                    {activeDefinitionObject.identity.name}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-[#0F172A]">业务域</div>
                  <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">{activeDefinitionObject.domain}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-[#0F172A]">核心关系定义</div>
                <ul className="list-disc pl-4 space-y-1 text-[#475569]">
                  {activeDefinitionObject.relationships.map((rel) => (
                    <li key={rel.id}>{`${rel.relationName} → ${rel.targetObjectName}（${rel.targetObjectId}）`}</li>
                  ))}
                  {activeDefinitionObject.relationships.length === 0 && <li>暂无核心关系</li>}
                </ul>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setActiveDefinitionObject(null)}
                className="px-4 py-1.5 bg-white border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] rounded cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </BusinessObjectPageShell>
  );
};
