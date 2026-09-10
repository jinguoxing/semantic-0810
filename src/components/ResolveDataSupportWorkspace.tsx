import React, { useMemo, useState, useSyncExternalStore } from 'react';
import {
  Check,
  CheckCircle2,
  Database,
  X
} from 'lucide-react';
import {
  businessObjectRepository,
  dataSupportService,
  getVersion,
  subscribe,
  type BusinessObject,
  type DataImplementation,
  type DataSupportBinding
} from '../domain/business-object';
import {
  BusinessObjectPageShell,
  BusinessObjectDecisionLayout,
  BusinessObjectSurface,
  BusinessObjectSection,
  BusinessObjectEmptyState,
  BusinessObjectFactGrid
} from './business-object/ui';

export interface ResolveDataSupportWorkspaceProps {
  /** 当前业务对象（Top-down 必须携带对象上下文进入，禁止无上下文演示页） */
  businessObjectId: string;
  /** 发现入口预选的候选绑定 */
  candidateBindingId?: string;
  /** 返回路由（发现上下文的一部分，确认 / 稍后处理后回跳） */
  returnRoute?: string;
  /** 返回后聚焦的区域（如数据支撑选择器） */
  returnFocus?: string;
  /** 返回业务对象详情（数据支撑视角） */
  onBackToDetail?: (focus?: string) => void;
  /** 查看当前数据支撑（等价于返回详情数据支撑视角） */
  onViewCurrentSupport?: () => void;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

/** 候选确认失败 → 展示说明（领域校验失败时零写入） */
const CONFIRM_ERROR_LABELS: Record<string, string> = {
  NOT_FOUND: '未找到候选数据支撑绑定，请刷新后重试',
  NOT_CANDIDATE: '该候选已被处理过（可能已确认生效），请刷新查看当前数据支撑'
};

export const ResolveDataSupportWorkspace: React.FC<ResolveDataSupportWorkspaceProps> = ({
  businessObjectId,
  candidateBindingId,
  returnFocus,
  onBackToDetail,
  onViewCurrentSupport,
  addToast
}) => {
  // 领域 Store 订阅：确认写入后本页与其余工作区同步刷新
  const stateVersion = useSyncExternalStore(subscribe, getVersion);

  const object: BusinessObject | undefined = useMemo(() => {
    void stateVersion;
    return businessObjectRepository.get(businessObjectId);
  }, [stateVersion, businessObjectId]);

  // 当前正式数据实现（EFFECTIVE + NEEDS_REVALIDATION）
  const currentBindings = useMemo(() => {
    void stateVersion;
    return dataSupportService.listCurrentBindings(businessObjectId);
  }, [stateVersion, businessObjectId]);
  const currentImplementations = currentBindings.flatMap((binding) => {
    const impl = dataSupportService.getImplementation(binding.implementationId);
    return impl ? [{ binding, impl }] : [];
  });
  const primaryEntry = currentImplementations.find((entry) => entry.binding.role === 'PRIMARY');

  // 候选数据实现（仅 CANDIDATE 出现在本工作区）
  const candidates = useMemo(() => {
    void stateVersion;
    return dataSupportService.listCandidateBindings(businessObjectId);
  }, [stateVersion, businessObjectId]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(candidateBindingId ?? null);
  // 选中候选：优先用户选择，其次入口预选，最后唯一候选
  const selectedCandidate: DataSupportBinding | undefined =
    candidates.find((binding) => binding.id === selectedCandidateId) ??
    (candidateBindingId ? candidates.find((binding) => binding.id === candidateBindingId) : undefined) ??
    (candidates.length === 1 ? candidates[0] : undefined);
  const candidateImpl: DataImplementation | undefined = selectedCandidate
    ? dataSupportService.getImplementation(selectedCandidate.implementationId)
    : undefined;

  // 已确认状态：入口预选绑定（或刚确认的绑定）已生效时展示“已确认生效”
  const confirmedBindingId = candidateBindingId ?? selectedCandidateId;
  const confirmedBinding = confirmedBindingId ? dataSupportService.getBinding(confirmedBindingId) : undefined;
  const isConfirmed = confirmedBinding?.status === 'EFFECTIVE' || confirmedBinding?.status === 'NEEDS_REVALIDATION';

  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);

  const handleBack = () => {
    if (onBackToDetail) {
      onBackToDetail(returnFocus);
    } else {
      onViewCurrentSupport?.();
    }
  };

  /** Top-down 确认：只确认当前选中的那一条候选绑定（TOP_DOWN_CONFIRM 数据支撑修订，不改业务对象修订） */
  const handleConfirm = () => {
    if (!selectedCandidate) return;
    const result = dataSupportService.confirmCandidate(selectedCandidate.id, { changedBy: '发现数据支撑工作台' });
    if (result.ok === false) {
      const isAlreadyEffective = result.error === 'NOT_CANDIDATE';
      addToast?.(
        isAlreadyEffective ? 'info' : 'error',
        isAlreadyEffective ? '数据支撑已是生效状态' : '确认未生效',
        isAlreadyEffective
          ? `该数据实现已作为「${object?.name ?? businessObjectId}」的数据支撑正式生效，无需重复确认。`
          : CONFIRM_ERROR_LABELS[result.error]
      );
      return;
    }
    setSelectedCandidateId(result.binding.id);
    addToast?.(
      'success',
      '数据实现已建立',
      `「${candidateImpl?.name ?? result.binding.implementationId}」已正式生效为「${object?.name ?? businessObjectId}」的${
        result.role === 'PRIMARY' ? '主要' : '其他'
      }数据实现（绑定修订 ${result.binding.revision}），已记录数据支撑修订，业务对象修订不受影响。`
    );
  };

  /** 暂不采用：候选保留为 CANDIDATE，不建立正式数据实现关系 */
  const handleDismiss = () => {
    if (selectedCandidate && candidateImpl) {
      addToast?.(
        'info',
        '暂不采用此数据实现',
        `已保留「${candidateImpl.name}」候选分析结果，未建立正式数据实现关系。`
      );
    }
    handleBack();
  };

  const objectName = object?.name ?? businessObjectId;
  const domain = object?.domain ?? '—';
  const hasEffective = currentBindings.some((binding) => binding.status === 'EFFECTIVE');
  const nextRole = hasEffective ? '其他数据实现' : '主要数据实现';

  // 未找到对象：上下文无效时直接提示并返回（禁止退化成写死演示）
  if (!object) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F7F9FC] p-8">
        <BusinessObjectSurface variant="MAIN" padded={false} className="max-w-md">
          <BusinessObjectEmptyState
            icon={<Database className="w-5 h-5" />}
            title="未找到业务对象"
            description={`发现数据支撑必须从具体业务对象进入（标识 ${businessObjectId} 在领域存储中不存在）。`}
            primaryAction={
              <button
                onClick={handleBack}
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

  // 四态判定（V2.2 §9）：
  // - 已确认：两栏结果态（隐藏 Decision Inspector / 条件检查 / 本次将建立 / 确认 / 稍后处理）
  // - 无候选：两栏空态（同上隐藏决策区，仅保留返回）
  // - 候选未选中：三栏，Inspector 提示选择，不出现任何提前「通过」结论
  // - 候选已选中：三栏决策工作台
  const hasCandidates = candidates.length > 0;
  const decisionVariant = hasCandidates ? 'THREE_COLUMN' : 'TWO_COLUMN';

  return (
    <BusinessObjectPageShell
      breadcrumb={
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#64748B]">
          <button onClick={handleBack} className="hover:text-[#2563EB] transition-colors cursor-pointer">
            业务语义
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <button onClick={handleBack} className="hover:text-[#2563EB] transition-colors cursor-pointer">
            业务对象
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <button onClick={handleBack} className="hover:text-[#2563EB] transition-colors cursor-pointer">
            {objectName}
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#0F172A] font-medium">发现数据支撑</span>
        </nav>
      }
      header={
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">发现数据支撑</h1>
              <span className="text-xs text-[#64748B] font-mono">{businessObjectId}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5" />
                已发布 · 正式修订 {object.currentRevision}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              基于当前正式业务定义，确认能够真实承载「{objectName}」的数据实现。
            </p>
          </div>

          {/* 决策仍在进行时才提供「稍后处理」；空态 / 已确认结果态隐藏 */}
          {hasCandidates && !isConfirmed && (
            <button
              id="btn-handle-later"
              onClick={handleBack}
              className="shrink-0 px-3.5 py-1.5 rounded-md bg-white hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-medium transition-colors cursor-pointer"
            >
              稍后处理
            </button>
          )}
        </div>
      }
    >
      <BusinessObjectDecisionLayout
        variant={decisionVariant}
        /* --------------------------------------------------------------- */
        /* 左栏：当前业务对象及已有数据实现（上下文，决策期间固定）            */
        /* --------------------------------------------------------------- */
        context={
          <BusinessObjectSurface variant="CONTEXT" padded={false} className="p-5 gap-6">
            {/* 1. 当前业务对象 */}
            <BusinessObjectSection divider title="当前业务对象" headingAs="h2">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0F172A]">{objectName}</span>
                  <span className="text-[10px] text-[#166534] bg-[#F0FDF4] border border-[#DCFCE7] px-1.5 py-0.2 rounded font-medium">
                    已发布 · {domain}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] font-mono">{businessObjectId}</div>

                <div className="space-y-1 pt-1">
                  <div className="text-[#64748B] text-[11px] font-medium">业务定义</div>
                  <p className="text-[#334155] leading-relaxed">{object.definition}</p>
                </div>

                <div className="space-y-1">
                  <div className="text-[#64748B] text-[11px] font-medium">主体标识</div>
                  <div className="font-semibold text-[#0F172A] bg-[#F8FAFC] px-2 py-1 rounded border border-[#E2E8F0] inline-block font-mono text-[11px]">
                    {object.identity.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[#64748B] text-[11px] font-medium">关键属性</div>
                  <div className="text-[#334155] leading-relaxed">
                    {object.attributes.map((attribute) => attribute.name).join(' · ') || '—'}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-[#EEF2F6]">
                  <div className="text-[#64748B] text-[11px] font-medium">核心关系</div>
                  <div className="space-y-1.5 text-[11px]">
                    {object.relationships.map((rel) => (
                      <div key={rel.id} className="flex items-center text-[#334155]">
                        <span className="font-medium">{objectName}</span>
                        <span className="text-[#2563EB] mx-1">─{rel.relationName}→</span>
                        <span className="font-medium text-[#0F172A]">{rel.targetObjectName}</span>
                      </div>
                    ))}
                    {object.relationships.length === 0 && <span className="text-[#94A3B8]">—</span>}
                  </div>
                </div>
              </div>
            </BusinessObjectSection>

            {/* 2. 当前数据实现 */}
            <BusinessObjectSection title="当前数据实现" headingAs="h2">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#0F172A] text-xs">
                    {primaryEntry ? primaryEntry.impl.name : '（待确认）'}
                  </div>
                  {primaryEntry && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      主要数据实现
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="text-[#64748B]">适用范围：</div>
                  <div className="text-[#334155] leading-relaxed">
                    {primaryEntry ? primaryEntry.impl.scope : '当前暂无生效数据实现'}
                  </div>
                </div>
                {currentImplementations.length > 1 && (
                  <div className="text-[11px] text-[#64748B] pt-1 border-t border-[#EEF2F6]">
                    其他数据实现：{currentImplementations.filter((entry) => entry !== primaryEntry).map((entry) => entry.impl.name).join('、')}
                  </div>
                )}
                <div className="pt-2 border-t border-[#EEF2F6]">
                  <button
                    onClick={() => (onViewCurrentSupport ? onViewCurrentSupport() : handleBack())}
                    className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看当前数据支撑</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </BusinessObjectSection>
          </BusinessObjectSurface>
        }

        /* --------------------------------------------------------------- */
        /* 中栏：候选确认主表面 / 空态 / 已确认结果态                          */
        /* --------------------------------------------------------------- */
        decision={
          isConfirmed && confirmedBinding ? (
            /* 已确认结果态（两栏）：只读结果 + 返回，无决策区（优先级最高，刚确认的绑定立即进入） */
            <BusinessObjectSurface variant="MAIN" padded={false}>
              <BusinessObjectEmptyState
                icon={<CheckCircle2 className="w-5 h-5 text-[#16A34A]" />}
                title="候选已确认生效"
                description={`数据支撑已确认。「${dataSupportService.getImplementation(confirmedBinding.implementationId)?.name ?? confirmedBinding.implementationId}」已作为「${objectName}」的${
                  confirmedBinding.role === 'PRIMARY' ? '主要' : '其他'
                }数据实现正式生效（绑定修订 ${confirmedBinding.revision}），刷新页面后状态仍保持。`}
                primaryAction={
                  <button
                    onClick={() => (onViewCurrentSupport ? onViewCurrentSupport() : handleBack())}
                    className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    查看当前数据支撑
                  </button>
                }
              />
              <div className="px-6 pb-6">
                <div
                  id="confirm-state-effective"
                  className="w-full rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-medium flex items-center justify-center space-x-2 px-4 py-2.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>已确认生效 · {confirmedBinding.revision} · 刷新页面状态仍保持</span>
                </div>
              </div>
            </BusinessObjectSurface>
          ) : hasCandidates && selectedCandidate && candidateImpl ? (
            <BusinessObjectSurface variant="MAIN">
              {/* 1. 决策问题 */}
              <BusinessObjectSection divider>
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                    需要你确认
                  </div>
                  <h2 className="text-base font-bold text-[#0F172A] leading-snug">
                    {`是否将「${candidateImpl.name}」作为「${objectName}」在${candidateImpl.scope}范围内的一套数据实现？`}
                  </h2>
                  {candidates.length > 1 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {candidates.map((binding) => {
                        const impl = dataSupportService.getImplementation(binding.implementationId);
                        const isSelected = binding.id === selectedCandidate.id;
                        return (
                          <button
                            key={binding.id}
                            id={`candidate-${binding.id}`}
                            onClick={() => setSelectedCandidateId(binding.id)}
                            className={`px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                                : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            {impl?.name ?? binding.implementationId}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </BusinessObjectSection>

              {/* 2. 候选实现 */}
              <BusinessObjectSection divider title="候选数据实现" headingId="candidate-implementation">
                <div className="p-4 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[#0F172A]">{candidateImpl.name}</div>
                      <div className="font-mono text-xs text-[#64748B] pt-0.5">{candidateImpl.warehouseTable}</div>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white text-[#334155] border border-[#CBD5E1]">
                      数据实现候选（{selectedCandidate.revision}）
                    </span>
                  </div>
                </div>
              </BusinessObjectSection>

              {/* 3. 候选成立事实 */}
              <BusinessObjectSection
                divider
                title="候选成立事实"
                headingId="candidate-facts"
                description="Semovix 已完成相关数据检索和角色判断，当前只需要确认新的数据实现候选。"
              >
                <div className="space-y-3">
                  <BusinessObjectFactGrid
                    columns={4}
                    items={[
                      {
                        label: '记录主体',
                        value: objectName,
                        hint: '候选记录主体与正式业务对象定义一致。'
                      },
                      {
                        label: '记录粒度',
                        value: candidateImpl.granularity,
                        hint: candidateImpl.scopeRelationText
                      },
                      {
                        label: '实例身份',
                        value: `${object.identity.name} · ${candidateImpl.identity}`,
                        mono: true,
                        hint: `${candidateImpl.identity} 能够解释当前实现中的${objectName}实例身份。`
                      },
                      {
                        label: '适用范围',
                        value: candidateImpl.scope,
                        hint: `该实现只覆盖上述范围，不代表${objectName}全部范围。`
                      }
                    ]}
                  />
                </div>
              </BusinessObjectSection>

              {/* 4. 与已有数据实现 */}
              <BusinessObjectSection title="与已有数据实现" headingId="candidate-scope-relation">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1">
                      <div className="text-[#64748B] text-[11px]">已有实现：{primaryEntry ? primaryEntry.impl.name : '（暂无生效实现）'}</div>
                      <div className="text-[#334155] leading-relaxed">
                        {primaryEntry ? `范围：${primaryEntry.impl.scope}` : '当前对象尚无生效数据实现'}
                      </div>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] border border-[#EEF2F6] rounded-md space-y-1">
                      <div className="text-[#64748B] text-[11px]">新候选：{candidateImpl.name}</div>
                      <div className="text-[#334155] leading-relaxed">范围：{candidateImpl.scope}</div>
                    </div>
                  </div>

                  {primaryEntry && (
                    <p className="text-xs text-[#64748B] leading-relaxed bg-[#FFFBEB] border border-[#FDE68A] rounded-md p-2.5">
                      本次确认只新增一套独立数据实现，不会合并数据、替换现有实现或改变主要数据实现。
                    </p>
                  )}
                </div>
              </BusinessObjectSection>
            </BusinessObjectSurface>
          ) : hasCandidates && !selectedCandidate ? (
            /* 候选未选中：中栏只呈现候选清单，不出现任何「通过」结论 */
            <BusinessObjectSurface variant="MAIN">
              <BusinessObjectSection title="候选数据支撑" headingId="candidate-list">
                <div className="space-y-2">
                  {candidates.map((binding) => {
                    const impl = dataSupportService.getImplementation(binding.implementationId);
                    return (
                      <button
                        key={binding.id}
                        id={`candidate-${binding.id}`}
                        onClick={() => setSelectedCandidateId(binding.id)}
                        className="w-full text-left p-3.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#EEF2F6] rounded-md transition-colors cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#0F172A]">{impl?.name ?? binding.implementationId}</div>
                          <div className="text-[11px] text-[#64748B] pt-0.5">适用范围：{impl?.scope ?? '—'}</div>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white text-[#334155] border border-[#CBD5E1] shrink-0">
                          数据实现候选（{binding.revision}）
                        </span>
                      </button>
                    );
                  })}
                </div>
              </BusinessObjectSection>
            </BusinessObjectSurface>
          ) : (
            /* 无候选空态（两栏）：不透出处理中动作与「通过」结果 */
            <BusinessObjectSurface variant="MAIN" padded={false}>
              <div id="empty-candidates-state">
                <BusinessObjectEmptyState
                  icon={<Database className="w-5 h-5" />}
                  title="当前没有新的候选数据支撑"
                  description={`「${objectName}」当前没有待确认的候选数据实现。已确认生效的数据实现可在业务对象详情的数据支撑视角中查看。`}
                  primaryAction={
                    <button
                      onClick={handleBack}
                      className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      返回业务对象详情
                    </button>
                  }
                />
              </div>
            </BusinessObjectSurface>
          )
        }

        /* --------------------------------------------------------------- */
        /* 右栏：Decision Inspector（仅候选决策态呈现）                       */
        /* --------------------------------------------------------------- */
        inspector={
          hasCandidates && !isConfirmed && selectedCandidate && candidateImpl ? (
            <BusinessObjectSurface variant="INSPECTOR" padded={false} className="p-5 gap-6">
              {/* 1. 数据实现条件（选中候选后才有结论） */}
              <BusinessObjectSection divider title="数据实现条件" headingAs="h2">
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">主体</span>
                    <span className="text-[#15803D] font-medium flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>一致</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">粒度</span>
                    <span className="text-[#15803D] font-medium flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>一致</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">身份</span>
                    <span className="text-[#15803D] font-medium flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>已核验</span>
                    </span>
                  </div>
                  <div className="space-y-0.5 py-1 border-b border-[#F8FAFC]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">适用范围</span>
                      <span className="text-[#15803D] font-medium flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>已明确</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] text-right">{candidateImpl.scope}</div>
                  </div>
                  <div className="space-y-0.5 py-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">与现有实现</span>
                      <span className="text-[#15803D] font-medium flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>关系已识别</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] text-right">
                      {primaryEntry ? '存在范围差异，互不替换' : '当前无生效实现'}
                    </div>
                  </div>
                </div>
              </BusinessObjectSection>

              {/* 2. 本次将建立 */}
              <BusinessObjectSection divider title="本次将建立" headingAs="h2">
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-[#64748B] text-[11px]">新增数据实现</div>
                    <div className="font-bold text-[#0F172A]">{candidateImpl.name}</div>
                    <div className="text-[11px] text-[#475569] space-y-0.5">
                      <div>业务对象：{objectName}</div>
                      <div>适用范围：{candidateImpl.scope}</div>
                      <div>正式角色：{nextRole}</div>
                    </div>
                  </div>

                  {candidateImpl.extension && (
                    <>
                      <div className="h-px bg-[#F1F5F9]" />
                      <div className="space-y-1">
                        <div className="text-[#64748B] text-[11px]">属性扩展</div>
                        <div className="font-semibold text-[#0F172A]">{candidateImpl.extension.name}</div>
                        <div className="text-[11px] text-[#475569]">依附：{candidateImpl.extension.parentImplementation}</div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5 pt-1 border-t border-[#EEF2F6]">
                    <div className="text-[#64748B] text-[11px]">关键语义对应</div>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      本次范围内已核验的关键属性与关系对应，将随当前数据实现正式建立。
                    </p>
                    <button
                      onClick={() => setIsScopeModalOpen(true)}
                      className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>查看本次范围</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </BusinessObjectSection>

              {/* 3. 决策动作 */}
              <div className="space-y-2.5">
                <button
                  id="btn-confirm-data-support"
                  onClick={handleConfirm}
                  className="w-full h-10 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <span>确认数据支撑</span>
                </button>
                <p className="text-[11px] text-[#64748B] text-center leading-relaxed">
                  将新增当前数据实现（候选绑定 {selectedCandidate.revision} → 生效），并按本次范围建立已核验的属性、关系对应。
                </p>
                <div className="text-center pt-1">
                  <button
                    id="btn-dismiss-candidate"
                    onClick={handleDismiss}
                    className="text-xs text-[#64748B] hover:text-[#0F172A] hover:underline cursor-pointer"
                  >
                    暂不采用此数据实现
                  </button>
                </div>
                <p className="text-[11px] text-[#94A3B8] text-center leading-relaxed pt-1">
                  确认后不会替换现有实现，也不会自动改变主要数据实现。
                </p>
              </div>
            </BusinessObjectSurface>
          ) : hasCandidates && !isConfirmed && !selectedCandidate ? (
            /* 候选未选中：Inspector 只提示选择，不出现任何提前「通过」结论 */
            <BusinessObjectSurface variant="INSPECTOR" padded={false}>
              <BusinessObjectEmptyState
                icon={<Database className="w-5 h-5" />}
                title="请选择一个候选数据支撑"
                description="选中左侧候选后，将在此呈现数据实现条件与本次将建立的范围。"
              />
            </BusinessObjectSurface>
          ) : undefined
        }
      />

      {/* ========================================================= */}
      {/* SCOPE DETAILS MODAL（本次范围来自候选实现的落地数据）        */}
      {/* ========================================================= */}
      {isScopeModalOpen && candidateImpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">

            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">本次建立范围详情</h3>
                <p className="text-xs text-[#64748B] font-mono pt-0.5">
                  {objectName} ← {candidateImpl.name}
                </p>
              </div>
              <button onClick={() => setIsScopeModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#334155]">

              {/* 1. 核验通过的关键属性落地（来自实现属性落地数据） */}
              <div className="space-y-2">
                <div className="font-bold text-[#0F172A] flex items-center justify-between">
                  <span>1. 核验通过的关键属性落地</span>
                  <span className="text-[11px] text-[#64748B] font-normal">共 {candidateImpl.attributes.length} 项对应</span>
                </div>
                <div className="border border-[#E2E8F0] rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                      <tr>
                        <th className="py-2 px-3 font-semibold">业务属性</th>
                        <th className="py-2 px-3 font-semibold">数据字段</th>
                        <th className="py-2 px-3 font-semibold">来源 / 语义</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {candidateImpl.attributes.map((attribute) => (
                        <tr key={attribute.attributeName} className={attribute.isExtension ? 'bg-[#F8FAFC]/50' : ''}>
                          <td className="py-2 px-3 font-semibold text-[#0F172A]">
                            {attribute.attributeName}
                            {attribute.isExtension && (
                              <span className="ml-1.5 text-[10px] text-[#2563EB] bg-[#EFF6FF] px-1 py-0.2 rounded border border-[#BFDBFE]">
                                属性扩展
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px]">{attribute.field}</td>
                          <td className="py-2 px-3 text-[#64748B]">
                            {attribute.sourceName} · {attribute.semantics}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. 核验通过的核心关系落地 */}
              <div className="space-y-2">
                <div className="font-bold text-[#0F172A] flex items-center justify-between">
                  <span>2. 核验通过的核心关系落地</span>
                  <span className="text-[11px] text-[#64748B] font-normal">共 {candidateImpl.relationships.length} 条关系</span>
                </div>
                <div className="space-y-2">
                  {candidateImpl.relationships.map((relationship) => (
                    <div key={relationship.relationName} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[#0F172A]">
                          {objectName} ─{relationship.relationName}→ {relationship.targetObjectName}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] flex items-center space-x-4">
                        <span>来源字段：<span className="font-mono text-[#0F172A]">{relationship.sourceField}</span></span>
                        <span>目标身份：<span className="font-medium text-[#0F172A]">{relationship.targetIdentity}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 属性扩展依附详情 */}
              {candidateImpl.extension && (
                <div className="space-y-2">
                  <div className="font-bold text-[#0F172A]">3. 属性扩展依附说明</div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#475569] space-y-1">
                    <div>依附实现：<span className="font-medium text-[#0F172A]">{candidateImpl.extension.parentImplementation}</span></div>
                    <div>对齐身份：<span className="font-mono text-[#0F172A]">{candidateImpl.extension.identityMapping}</span></div>
                    <div>提供属性：<span className="text-[#334155]">{candidateImpl.extension.providedAttr} → {candidateImpl.extension.providedField}</span></div>
                  </div>
                </div>
              )}

            </div>

            <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end shrink-0">
              <button
                onClick={() => setIsScopeModalOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium text-[#334155] rounded transition-colors cursor-pointer"
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
