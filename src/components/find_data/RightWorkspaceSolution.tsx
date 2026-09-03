import React from 'react';
import { X, Layers, CheckCircle2, ChevronRight, AlertCircle, ArrowRight, ShieldCheck, Database, ExternalLink } from 'lucide-react';
import { FindDataTaskState, ResourceId } from './model/FindDataTask';
import {
  selectSolutionGroups,
  selectSolutionCoverage,
  selectSolutionGaps,
  selectResourceById,
  getQueryStatusDisplay
} from './model/findDataSelectors';

interface RightWorkspaceSolutionProps {
  task: FindDataTaskState;
  mode?: 'recommended' | 'executable';
  onModeChange?: (mode: 'recommended' | 'executable') => void;
  onAction?: (actionCode: string, payload?: Record<string, unknown>) => void;
  onClose: () => void;
}

export const RightWorkspaceSolution: React.FC<RightWorkspaceSolutionProps> = ({
  task,
  mode = 'recommended',
  onModeChange,
  onAction,
  onClose
}) => {
  const currentMode: 'recommended' | 'executable' = mode === 'executable' ? 'executable' : 'recommended';
  const groups = selectSolutionGroups(task, currentMode);
  const coverage = selectSolutionCoverage(task);
  const gaps = selectSolutionGaps(task);

  const isExecutableMode = mode === 'executable';

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight truncate">
                数据方案 · 闵行区养老供给
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#F0FDF4] text-[#16A34A] rounded border border-[#DCFCE7] font-bold shrink-0">
                已就绪
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] truncate">
              {isExecutableMode ? '仅核验具备即时查询权限的可执行资源' : '完整业务推荐方案与缺口声明'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="关闭工作区"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switch Tab Bar: 统一从 DataSolution 派生的两份视图 */}
      <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
          <button
            onClick={() => onModeChange?.('recommended')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              !isExecutableMode
                ? 'bg-[#2563EB] text-white font-bold shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            业务推荐方案
          </button>
          <button
            onClick={() => onModeChange?.('executable')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              isExecutableMode
                ? 'bg-[#2563EB] text-white font-bold shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            当前可执行范围
          </button>
        </div>

        <span className="text-[11px] text-[#64748B]">
          更新于 {new Date(task.dataSolution.updatedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
        {/* Coverage Scope Card */}
        {coverage && coverage.length > 0 && (
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
            <div className="font-bold text-xs text-[#0F172A] flex items-center space-x-1.5">
              <span className="w-1.5 h-3.5 bg-[#2563EB] rounded-full" />
              <span>覆盖范围与口径说明</span>
            </div>
            <ul className="space-y-1 text-[11px] text-[#475569]">
              {coverage.map((c, i) => (
                <li key={i} className="flex items-center space-x-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#94A3B8]" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Group 1: 核心指标（计算分子分母） */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
            <span className="font-bold text-xs text-[#0F172A]">
              一、核心指标（2 项 · 构成计算基线）
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#16A34A] font-bold border border-[#DCFCE7]">
              必备
            </span>
          </div>

          <div className="space-y-2">
            {groups.core.map((item) => {
              const res = selectResourceById(task, item.resourceId);
              const statusInfo = getQueryStatusDisplay(item);
              if (!res) return null;

              return (
                <div
                  key={item.resourceId}
                  className="p-3 bg-white border border-[#E2E8F0] rounded-xl space-y-2 hover:border-[#CBD5E1] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-bold text-xs text-[#0F172A] truncate">
                        {res.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] font-medium border border-[#BFDBFE]">
                        {res.type}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-relaxed">{res.desc}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#F8FAFC] text-[11px] text-[#475569]">
                    <span>粒度：{res.granularity}</span>
                    <span>覆盖：{res.timeCoverage}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group 2: 条件性 / 下钻支撑资源 */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
            <span className="font-bold text-xs text-[#0F172A]">
              二、可选明细与下钻支撑（{groups.conditional.length + groups.optional.length} 项）
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] font-bold border border-[#E2E8F0]">
              辅助下钻
            </span>
          </div>

          <div className="space-y-2">
            {[...groups.conditional, ...groups.optional].map((item) => {
              const res = selectResourceById(task, item.resourceId);
              const statusInfo = getQueryStatusDisplay(item);
              if (!res) return null;

              // In Executable mode, explicitly mark non-allowed items without deleting them!
              const displayStatus =
                isExecutableMode && !statusInfo.isExecutable
                  ? '不进入当前执行（查询需申请）'
                  : statusInfo.label;

              return (
                <div
                  key={item.resourceId}
                  className={`p-3 rounded-xl border transition-colors space-y-2 ${
                    isExecutableMode && !statusInfo.isExecutable
                      ? 'bg-[#FAFAFA] border-[#E2E8F0] opacity-80'
                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-bold text-xs text-[#0F172A] truncate">
                        {res.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] font-medium border border-[#E2E8F0]">
                        {res.type}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        isExecutableMode && !statusInfo.isExecutable
                          ? 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0]'
                          : statusInfo.badgeClass
                      }`}
                    >
                      {displayStatus}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-relaxed">{res.desc}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#F8FAFC] text-[11px]">
                    <span className="text-[#475569]">{res.roleNote || res.granularity}</span>
                    <button
                      type="button"
                      onClick={() => onAction?.('OPEN_FIELDS', { resourceId: res.id })}
                      className="text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-0.5"
                    >
                      <span>检视字段</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gaps / Limitations */}
        {gaps && gaps.length > 0 && (
          <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl space-y-2 text-[#92400E]">
            <div className="flex items-center space-x-1.5 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>当前方案声明缺口与约束：</span>
            </div>
            {gaps.map((g) => (
              <div key={g.id} className="space-y-1 text-[11px] leading-relaxed">
                <span className="font-semibold text-[#B45309]">{g.title}：</span>
                <span>{g.description}</span>
                <div className="text-[10px] text-[#B45309]/80 pt-0.5">
                  缓解应对：{g.mitigation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <button
          onClick={() => onAction?.('OPEN_ACCESS')}
          className="px-3 py-1.5 text-xs text-[#475569] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
        >
          查看全景权限
        </button>

        <button
          onClick={() => onAction?.('PREPARE_ASK_PLAN')}
          className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
        >
          <span>转入分析计划</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
