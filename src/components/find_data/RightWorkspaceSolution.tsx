import React from 'react';
import { X, Layers, AlertCircle, ArrowRight, ExternalLink, GitMerge } from 'lucide-react';
import { FindDataTaskState, ResourceId, TaskActionCode } from './model/FindDataTask';
import {
  selectSolutionGroups,
  selectSolutionCoverage,
  selectSolutionGaps,
  selectResourceById,
  selectResourceAvailability,
  getQueryStatusDisplay,
  selectExecutionAssessments
} from './model/findDataSelectors';

interface RightWorkspaceSolutionProps {
  task: FindDataTaskState;
  mode?: 'recommended' | 'executable';
  onModeChange?: (mode: 'recommended' | 'executable') => void;
  onAction?: (actionCode: TaskActionCode, payload?: Record<string, unknown>) => void;
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
  const isExecutableMode = currentMode === 'executable';

  const groups = selectSolutionGroups(task, 'recommended');
  const executableGroups = selectSolutionGroups(task, 'executable');
  const activeGroups = isExecutableMode ? executableGroups : groups;

  const coverage = selectSolutionCoverage(task);
  const gaps = selectSolutionGaps(task);
  const relationships = task.dataSolution.relationshipEvidence || [];
  const executionAssessments = selectExecutionAssessments(task);
  const excludedAssessments = executionAssessments.filter((assessment) => !assessment.included);
  const isReevaluating = task.dataSolution.state === 'EVALUATING' || task.dataSolution.state === 'STALE';

  const totalItems = task.dataSolution.items.length;
  const isEmpty = totalItems === 0 && gaps.length === 0;

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight truncate">
                数据方案 · {task.title || '当前方案'}
              </h3>
              {!isEmpty && (
                <span className="text-[10px] px-1.5 py-0.2 bg-[#F0FDF4] text-[#16A34A] rounded border border-[#DCFCE7] font-bold shrink-0">
                  {isReevaluating ? '正在重新评估' : isExecutableMode ? '可执行' : '推荐就绪'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] truncate">
              {isEmpty
                ? '暂无活跃数据方案'
                : isReevaluating
                ? '正在按新口径重新评估，旧内容仅供过渡查看'
                : isExecutableMode
                ? '仅核验具备即时查询权限的直接可执行范围'
                : '完整业务推荐方案与缺口声明'}
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

      {/* Mode Switch Tab Bar */}
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
          更新于 {new Date(task.dataSolution.updatedAt || task.updatedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
        {isEmpty ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-sm text-[#0F172A]">当前任务尚未形成数据方案</p>
              <p className="text-xs text-[#64748B] leading-relaxed">
                请在左侧对话中输入您的业务分析诉求（如时间跨度、关注地区与分析指标），系统将自动匹配资产、指标并评估权限与方案完整性。
              </p>
            </div>
          </div>
        ) : (
          <>
            {isReevaluating && (
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
                正在按新口径重新评估。旧方案暂不作为推荐就绪方案，也不能进入 Ask Data。
              </div>
            )}
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

            {isExecutableMode && excludedAssessments.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[#F1F5F9]">
                <div className="font-bold text-xs text-[#0F172A]">未进入本次执行范围的资源</div>
                {[
                  ['QUERY_PERMISSION_REQUIRED', '因权限未就绪未进入'],
                  ['QUERY_PERMISSION_DENIED', '因权限不可用未进入'],
                  ['RELATIONSHIP_NOT_READY', '因关系未确认未进入'],
                  ['OPTIONAL_DRILLDOWN', '仅供下钻，不参与计算'],
                  ['PARTIAL_MATCH', '部分匹配，不进入执行'],
                  ['NOT_SELECTED', '尚未选入当前方案'],
                  ['RESOURCE_UNAVAILABLE', '资源当前不可用']
                ].map(([reason, title]) => {
                  const assessments = excludedAssessments.filter((assessment) => assessment.reason === reason);
                  if (assessments.length === 0) return null;
                  return (
                    <div key={reason} className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                      <div className="font-semibold text-[#475569]">{title}</div>
                      {assessments.map((assessment) => (
                        <div key={assessment.item.resourceId} className="text-[11px] text-[#64748B]">
                          {selectResourceById(task, assessment.item.resourceId)?.name ?? '相关资源'}：{assessment.userMessage}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Group 1: 核心指标 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
                <span className="font-bold text-xs text-[#0F172A]">
                  一、核心指标（{activeGroups.core.length} 项 · 构成计算基线）
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#16A34A] font-bold border border-[#DCFCE7]">
                  必备
                </span>
              </div>

              <div className="space-y-2">
                {activeGroups.core.map((item) => {
                  const res = selectResourceById(task, item.resourceId);
                  const availability = selectResourceAvailability(task, item.resourceId);
                  const statusInfo = getQueryStatusDisplay(availability);
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
            {(activeGroups.conditional.length > 0 || activeGroups.optional.length > 0) && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
                  <span className="font-bold text-xs text-[#0F172A]">
                    二、可选明细与下钻支撑（{activeGroups.conditional.length + activeGroups.optional.length} 项）
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] font-bold border border-[#E2E8F0]">
                    辅助下钻
                  </span>
                </div>

                <div className="space-y-2">
                  {[...activeGroups.conditional, ...activeGroups.optional].map((item) => {
                    const res = selectResourceById(task, item.resourceId);
                    const availability = selectResourceAvailability(task, item.resourceId);
                    const statusInfo = getQueryStatusDisplay(availability);
                    if (!res) return null;

                    return (
                      <div
                        key={item.resourceId}
                        className="p-3 rounded-xl border bg-white border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors space-y-2"
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
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.label}
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
            )}

            {/* Group 3: 部分匹配资源 (Partial Matches) */}
            {!isExecutableMode && activeGroups.partialMatch.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
                  <span className="font-bold text-xs text-[#64748B]">
                    三、部分匹配资源（{activeGroups.partialMatch.length} 项 · 未直接纳入计算）
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFFBEB] text-[#B45309] font-bold border border-[#FDE68A]">
                    业务参考
                  </span>
                </div>

                <div className="space-y-2">
                  {activeGroups.partialMatch.map((item) => {
                    const res = selectResourceById(task, item.resourceId);
                    const availability = selectResourceAvailability(task, item.resourceId);
                    const statusInfo = getQueryStatusDisplay(availability);
                    if (!res) return null;

                    return (
                      <div
                        key={item.resourceId}
                        className="p-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA] space-y-2 opacity-85"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 truncate">
                            <span className="font-medium text-xs text-[#334155] truncate">
                              {res.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] font-medium border border-[#E2E8F0]">
                              部分匹配
                            </span>
                          </div>
                          <span className="text-[10px] text-[#94A3B8]">
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-relaxed">{res.desc}</p>
                        {item.limitations && item.limitations.length > 0 && (
                          <div className="text-[10px] text-[#B45309] bg-[#FFFBEB] p-1.5 rounded border border-[#FEF3C7]">
                            未纳入原因：{item.limitations.join('；')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Relationship Evidence */}
            {relationships.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-[#0F172A]">
                  <GitMerge className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>数据关联证据说明</span>
                </div>
                <div className="space-y-1.5">
                  {relationships.map((rel, idx) => (
                    <div key={idx} className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1E293B]">
                          {selectResourceById(task, rel.sourceResourceId)?.name || '相关资源'} ↔{' '}
                          {selectResourceById(task, rel.targetResourceId)?.name || '相关资源'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] rounded font-medium">
                          {rel.verificationStatus === 'CONFIRMED'
                            ? '已确认关系'
                            : rel.verificationStatus === 'SEMANTIC_ONLY'
                            ? '仅语义关联'
                            : rel.verificationStatus === 'CONFLICT'
                            ? '关系存在冲突'
                            : '待分析阶段验证'}
                        </span>
                      </div>
                      <p className="text-[#64748B]">{rel.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps / Limitations */}
            {gaps && gaps.length > 0 && (
              <div className="space-y-2 text-xs pt-3 border-t border-[#F1F5F9]">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-[#0F172A]">
                  <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span>当前方案声明缺口与约束：</span>
                </div>
                <ul className="space-y-2 text-[11px] text-[#475569] pl-1">
                  {gaps.map((g) => (
                    <li key={g.id} className="space-y-0.5">
                      <div className="leading-relaxed">
                        <span className="text-[#D97706] font-bold mr-1.5">•</span>
                        <span className="font-semibold text-[#1E293B]">{g.title}：</span>
                        <span>{g.description}</span>
                      </div>
                      <div className="text-[10px] text-[#64748B] pl-3.5">
                        缓解应对：{g.mitigation}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
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

        {task.askPlan && !isReevaluating && (
          <button
            onClick={() => onAction?.('OPEN_ASK_PLAN')}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
          >
            <span>转入分析计划</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
