import React, { useMemo, useState, useSyncExternalStore } from 'react';
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  ChevronDown,
  Database,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import {
  businessObjectRepository,
  dataSupportService,
  getVersion,
  subscribe,
  type DataImplementation,
  type DataSupportBinding
} from '../domain/business-object';

export interface BusinessObjectRevalidationWorkspaceProps {
  /** 入口上下文：从业务对象详情进入时携带，仅复核该对象（可选，不传则复核全部） */
  objectId?: string;
  /** 入口预选的待复核绑定（高亮置顶） */
  bindingId?: string;
  onNavigateToObjectsList?: () => void;
  onNavigateToObjectDetail?: (objectId: string, initialTab?: 'business' | 'data_support') => void;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

/** 待复核绑定视图模型：绑定 + 对象 + 实现 联表 */
interface RevalidationItem {
  binding: DataSupportBinding;
  objectId: string;
  objectName: string;
  implementationName: string;
  warehouseTable: string;
  techName: string;
  /** 同对象下可切换的替代实现（重新绑定用） */
  alternatives: DataImplementation[];
}

export const BusinessObjectRevalidationWorkspace: React.FC<BusinessObjectRevalidationWorkspaceProps> = ({
  objectId,
  bindingId,
  onNavigateToObjectsList,
  onNavigateToObjectDetail,
  addToast
}) => {
  // 订阅领域 Store：确认继续使用 / 重新绑定 / 退休 后列表自动刷新
  const stateVersion = useSyncExternalStore(subscribe, getVersion);

  const items: RevalidationItem[] = useMemo(() => {
    void stateVersion;
    const pending: RevalidationItem[] = [];
    businessObjectRepository.list().forEach((object) => {
      if (objectId && object.id !== objectId) return;
      const objectBindings = dataSupportService.listBindings(object.id);
      objectBindings
        .filter((binding) => binding.status === 'NEEDS_REVALIDATION')
        .forEach((binding) => {
          const implementation = dataSupportService.getImplementation(binding.implementationId);
          pending.push({
            binding,
            objectId: object.id,
            objectName: object.name,
            implementationName: implementation?.name ?? binding.implementationId,
            warehouseTable: implementation?.warehouseTable ?? '—',
            techName: implementation?.techName ?? '—',
            // 重新绑定约束（领域校验同口径）：新实现 ≠ 当前实现，且未被其他在役绑定占用
            alternatives: dataSupportService
              .listImplementations(object.id)
              .filter((impl) => impl.id !== binding.implementationId)
              .filter(
                (impl) =>
                  !objectBindings.some(
                    (other) =>
                      other.id !== binding.id &&
                      other.implementationId === impl.id &&
                      other.status !== 'RETIRED'
                  )
              )
          });
        });
    });
    // 入口预选的待复核绑定置顶
    if (bindingId) {
      pending.sort((a, b) => (a.binding.id === bindingId ? -1 : b.binding.id === bindingId ? 1 : 0));
    }
    return pending;
  }, [stateVersion, objectId, bindingId]);

  // 重新绑定展开面板：当前展开的 bindingId 与选中的替代实现
  const [rebindPanelBindingId, setRebindPanelBindingId] = useState<string | null>(null);
  const [rebindChoice, setRebindChoice] = useState<string>('');

  const openRebindPanel = (item: RevalidationItem) => {
    setRebindPanelBindingId(item.binding.id);
    setRebindChoice(item.alternatives[0]?.id ?? '');
  };

  /** 确认继续使用：NEEDS_REVALIDATION → EFFECTIVE（REVALIDATION_KEEP 数据支撑修订） */
  const handleConfirmKeep = (item: RevalidationItem) => {
    const result = dataSupportService.confirmRevalidation(item.binding.id, { changedBy: '数据支撑复核工作台' });
    if (result.ok === false) {
      addToast?.(
        'error',
        '复核未生效',
        result.error === 'NOT_FOUND' ? '未找到待复核的数据支撑绑定，请刷新后重试' : '该绑定不处于待复核状态，可能已被处理'
      );
      return;
    }
    addToast?.('success', '复核确认', `「${item.implementationName}」确认继续作为「${item.objectName}」的数据支撑，绑定已恢复生效（记录数据支撑修订，不产生业务对象修订）。`);
  };

  /** 重新绑定：新实现 ≠ 当前实现，且未被其他在役绑定占用（领域校验，失败零写入） */
  const handleRebind = (item: RevalidationItem) => {
    if (!rebindChoice) return;
    const target = item.alternatives.find((impl) => impl.id === rebindChoice);
    const result = dataSupportService.rebind(item.binding.id, rebindChoice, {
      reason: `语义修订 ${item.binding.revalidation?.sourceRevision ?? ''} 后由「${item.implementationName}」切换为「${target?.name ?? rebindChoice}」`,
      changedBy: '数据支撑复核工作台'
    });
    if (result.ok === false) {
      const messages: Record<string, string> = {
        NOT_FOUND: '未找到待复核的数据支撑绑定，请刷新后重试',
        SAME_IMPLEMENTATION: '新数据实现与当前实现相同，无需重新绑定',
        IMPLEMENTATION_NOT_FOUND: '未找到所选替代数据实现，请刷新后重试',
        IMPLEMENTATION_IN_USE: '所选数据实现已被其他绑定正式使用，同一实现不能同时承载多条在役绑定'
      };
      addToast?.('error', '重新绑定未生效', messages[result.error]);
      return;
    }
    setRebindPanelBindingId(null);
    addToast?.('success', '重新绑定完成', `「${item.objectName}」该数据支撑已切换为「${target?.name ?? rebindChoice}」并恢复生效（记录数据支撑修订，不产生业务对象修订）。`);
  };

  /** 退休：PRIMARY 绑定不可直接退休，需先确认新的主要数据实现 */
  const handleRetire = (item: RevalidationItem) => {
    const result = dataSupportService.retireBinding(item.binding.id, {
      reason: `语义修订后不再满足「${item.objectName}」的数据支撑要求`,
      changedBy: '数据支撑复核工作台'
    });
    if (result.ok === false) {
      if (result.error === 'IS_PRIMARY') {
        addToast?.('warning', '无法退休主要数据实现', '请先确认新的主要数据实现，再退休当前主要实现。');
      } else {
        addToast?.('error', '退休未生效', '未找到待退休的数据支撑绑定，请刷新后重试');
      }
      return;
    }
    addToast?.('success', '数据支撑已退休', `「${item.implementationName}」已不再作为「${item.objectName}」的数据支撑（可在历史中查看，不产生业务对象修订）。`);
  };

  return (
    <div className="flex-1 flex min-h-0 bg-[#F8FAFC] text-[#0F172A] font-sans antialiased relative select-none">

      {/* ========================================================= */}
      {/* 1. FOCUSED WORK SHELL: 64px NARROW SECONDARY NAV BAR      */}
      {/* ========================================================= */}
      <aside className="w-16 shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col items-center py-4 space-y-4 select-none z-20">
        <button
          onClick={onNavigateToObjectsList}
          className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          title="返回业务对象列表"
          aria-label="返回业务对象列表"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-8 h-px bg-[#E2E8F0]" />

        {/* 业务对象（当前聚焦：数据支撑复核） */}
        <div className="relative group">
          <button
            className="w-10 h-10 rounded-md flex items-center justify-center bg-[#FFF7ED] text-[#D97706] border border-[#FED7AA] transition-colors cursor-pointer"
            aria-label="数据支撑复核"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#0F172A] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
            数据支撑复核 (Binding Revalidation)
          </div>
        </div>

        <div className="relative group">
          <button
            onClick={onNavigateToObjectsList}
            className="w-10 h-10 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="业务对象目录"
          >
            <Box className="w-5 h-5" />
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#0F172A] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
            业务对象目录
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT                                            */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#E2E8F0] px-8 py-4 shrink-0 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-[#0F172A]">数据支撑复核</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#D97706] border border-[#FED7AA] text-[11px] font-bold">
                {items.length} 项待复核
              </span>
              {objectId && (
                <button
                  onClick={() => onNavigateToObjectDetail?.(objectId, 'data_support')}
                  className="text-[11px] text-[#2563EB] hover:underline cursor-pointer font-medium"
                >
                  {items.length > 0 ? `来自「${items[0].objectName}」· 返回详情` : '返回业务对象详情'}
                </button>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              业务对象语义修订后，受影响的数据支撑绑定需要人工复核：确认继续使用、重新绑定或退休。
            </p>
          </div>
        </div>

        <div className="flex-1 p-8 max-w-[920px] w-full mx-auto space-y-5">
          {items.length === 0 ? (
            /* 空状态 */
            <div className="bg-white border border-[#E2E8F0] rounded-md p-10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#059669] mx-auto" />
              <div className="text-sm font-semibold text-[#0F172A]">没有待复核的数据支撑</div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {objectId
                  ? '该业务对象当前没有待复核的数据支撑绑定。'
                  : '当前所有生效绑定的语义上下文均与业务对象最新修订保持一致。'}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <section
                key={item.binding.id}
                aria-label={`待复核绑定 ${item.implementationName}`}
                className={`bg-white border rounded-md shadow-2xs overflow-hidden ${
                  item.binding.id === bindingId ? 'border-[#D97706] ring-2 ring-[#FDE68A]' : 'border-[#FDE68A]'
                }`}
              >
                {/* 卡片头：对象 / 实现 / 角色 / 修订 */}
                <div className="px-6 py-4 bg-[#FFFBEB]/60 border-b border-[#FDE68A] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                      <button
                        onClick={() => onNavigateToObjectDetail?.(item.objectId, 'data_support')}
                        className="font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer"
                      >
                        {item.objectName}
                      </button>
                      <span className="text-[#94A3B8]">·</span>
                      <span className="font-bold text-[#0F172A]">{item.implementationName}</span>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-white text-[#334155] border border-[#CBD5E1]">
                        {item.binding.role === 'PRIMARY' ? '主要数据实现' : '其他数据实现'}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFF7ED] text-[#D97706] border border-[#FED7AA]">
                      待复核 · 绑定修订 {item.binding.revision}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-[#64748B]">{item.warehouseTable}</div>
                </div>

                {/* 复核原因 */}
                <div className="px-6 py-4 space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-[#0F172A]">复核原因</div>
                    <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
                      {item.binding.revalidation?.reason ?? '业务对象语义发生修订，需复核该绑定是否仍然有效。'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#64748B]">触发修订：</span>
                      <span className="font-mono font-semibold text-[#0F172A]">
                        {item.binding.revalidation?.sourceRevision ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#64748B]">受影响目标：</span>
                      {(item.binding.revalidation?.affectedTargets ?? []).map((target) => (
                        <span
                          key={target}
                          className="px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[11px] font-medium"
                        >
                          {target}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 重新绑定展开面板 */}
                {rebindPanelBindingId === item.binding.id && (
                  <div className="mx-6 mb-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-3">
                    <div className="text-xs font-semibold text-[#0F172A]">选择替代数据实现</div>
                    {item.alternatives.length === 0 ? (
                      <p className="text-xs text-[#64748B]">当前对象没有其他可切换的数据实现。</p>
                    ) : (
                      <div className="space-y-1.5">
                        {item.alternatives.map((impl) => (
                          <label
                            key={impl.id}
                            className={`flex items-start space-x-2.5 p-2.5 rounded border cursor-pointer text-xs transition-colors ${
                              rebindChoice === impl.id
                                ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                                : 'bg-white border-[#E2E8F0] hover:border-[#93C5FD]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`rebind-${item.binding.id}`}
                              checked={rebindChoice === impl.id}
                              onChange={() => setRebindChoice(impl.id)}
                              className="mt-0.5 cursor-pointer"
                            />
                            <span className="space-y-0.5">
                              <span className="flex items-center space-x-1.5">
                                <Database className="w-3.5 h-3.5 text-[#64748B]" />
                                <span className="font-bold text-[#0F172A]">{impl.name}</span>
                              </span>
                              <span className="block font-mono text-[11px] text-[#64748B]">{impl.warehouseTable}</span>
                              <span className="block text-[11px] text-[#64748B]">范围：{impl.scope}</span>
                            </span>
                          </label>
                        ))}
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => handleRebind(item)}
                            disabled={!rebindChoice}
                            className="px-3.5 py-1.5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-medium cursor-pointer transition-colors"
                          >
                            确认重新绑定
                          </button>
                          <button
                            onClick={() => setRebindPanelBindingId(null)}
                            className="px-3 py-1.5 rounded bg-white border border-[#CBD5E1] text-[#334155] text-xs font-medium cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 操作区：确认继续使用 / 重新绑定 / 退休 */}
                <div className="px-6 py-4 border-t border-[#F1F5F9] flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => handleConfirmKeep(item)}
                    className="px-4 py-2 rounded bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>确认继续使用</span>
                  </button>
                  <button
                    onClick={() =>
                      rebindPanelBindingId === item.binding.id
                        ? setRebindPanelBindingId(null)
                        : openRebindPanel(item)
                    }
                    className="px-4 py-2 rounded bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#2563EB] text-xs font-bold cursor-pointer transition-colors inline-flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>重新绑定</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${rebindPanelBindingId === item.binding.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => handleRetire(item)}
                    className="px-4 py-2 rounded bg-white border border-[#FECACA] hover:bg-[#FEF2F2] text-[#DC2626] text-xs font-bold cursor-pointer transition-colors"
                  >
                    退休
                  </button>
                  <span className="text-[11px] text-[#94A3B8] ml-auto">
                    复核结论记录为数据支撑修订，不产生业务对象修订
                  </span>
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
