import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  History,
  CheckCircle2,
  Search,
  Save,
  Flag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
  UserCheck,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { CompleteFieldGovernanceData } from '../types';

interface RightAssetPanelProps {
  data: CompleteFieldGovernanceData;
  activeRightTab: 'result' | 'adjust' | 'history';
  setActiveRightTab: (tab: 'result' | 'adjust' | 'history') => void;
  onConfirmNext: () => void;
  onSaveDraft: () => void;
  onMarkReview: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export const RightAssetPanel: React.FC<RightAssetPanelProps> = ({
  data,
  activeRightTab,
  setActiveRightTab,
  onConfirmNext,
  onSaveDraft,
  onMarkReview,
  isCollapsed = false,
  setIsCollapsed,
}) => {
  const { currentAsset, historyVersions } = data;

  // Internal state fallback if controlled prop is not passed
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isCollapsed ?? internalCollapsed;
  const toggleCollapse = (value: boolean) => {
    if (setIsCollapsed) {
      setIsCollapsed(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  // State for tab 2 (adjust)
  const [semanticSearch, setSemanticSearch] = useState('');
  const [selectedSemantic, setSelectedSemantic] = useState(currentAsset.semanticType);
  const [selectedRole, setSelectedRole] = useState(currentAsset.fieldRole);
  const [customBusinessName, setCustomBusinessName] = useState(currentAsset.businessName);
  const [customDefinition, setCustomDefinition] = useState(currentAsset.businessDefinition);

  const roles = ['事件时间字段', '业务时间字段', '审计时间字段', '维度字段', '度量指标', '主体标识'];

  const recommendedGroups = [
    { title: 'AI 推荐', items: [currentAsset.semanticType] },
    { title: '相近语义类型', items: ['创建时间', '更新时间', '业务时间'] },
    { title: '其他通用语义', items: ['日期字段', '审计时间', '时序坐标'] },
  ];

  // State for decision
  const [userDecision, setUserDecision] = useState<'confirm' | 'candidate' | 'manual' | 'review'>('confirm');

  if (collapsed) {
    return (
      <div className="w-11 lg:w-12 bg-white border-l border-[#E2E8F0] flex flex-col items-center justify-between py-3 shrink-0 shadow-2xs transition-all duration-200 select-none">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={() => toggleCollapse(false)}
            className="p-1.5 rounded bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] transition-all duration-150 hover:scale-105 shadow-2xs"
            title="展开右侧语义资产面板"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>

          <div
            onClick={() => toggleCollapse(false)}
            className="cursor-pointer flex flex-col items-center space-y-2 text-[#475569] hover:text-[#4F46E5] transition-colors py-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
            <span className="text-[11px] font-bold tracking-wider [writing-mode:vertical-lr] my-1 text-[#334155]">
              语义资产面板
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={() => {
              toggleCollapse(false);
              setActiveRightTab('adjust');
            }}
            className="p-1.5 rounded text-[#64748B] hover:text-[#4F46E5] hover:bg-[#F1F5F9] transition-colors"
            title="调整推荐"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              toggleCollapse(false);
              setActiveRightTab('history');
            }}
            className="p-1.5 rounded text-[#64748B] hover:text-[#4F46E5] hover:bg-[#F1F5F9] transition-colors"
            title="历史版本"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[380px] xl:w-[400px] bg-white border-l border-[#E2E8F0] flex flex-col h-full shrink-0 shadow-2xs transition-all duration-200 select-none">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-[#E2E8F0] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#94A3B8] font-mono uppercase tracking-wide">Column Semantic Profile</div>
            <h2 className="text-sm font-bold text-[#0F172A]">字段语义画像</h2>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-medium text-[#D97706]">
              AI 推导完成 · 待确认
            </span>
            {setIsCollapsed && (
              <button
                onClick={() => toggleCollapse(true)}
                className="p-1 rounded text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] transition-colors"
                title="收起面板"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Underline Tabs */}
        <div className="flex items-center space-x-6 border-b border-[#E2E8F0] text-xs font-medium">
          <button
            onClick={() => setActiveRightTab('result')}
            className={`pb-2 transition-all duration-150 cursor-pointer ${
              activeRightTab === 'result'
                ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>当前结果</span>
          </button>
          <button
            onClick={() => setActiveRightTab('adjust')}
            className={`pb-2 transition-all duration-150 cursor-pointer ${
              activeRightTab === 'adjust'
                ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>调整建议</span>
          </button>
          <button
            onClick={() => setActiveRightTab('history')}
            className={`pb-2 transition-all duration-150 cursor-pointer ${
              activeRightTab === 'history'
                ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>历史版本</span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-4">
        {/* Tab 1: 当前结果 */}
        {activeRightTab === 'result' && (
          <div className="space-y-4 text-xs">
            {/* Key-Value Profile List (Clean list without horizontal border lines) */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">物理字段名:</span>
                <span className="font-mono font-medium text-[#0F172A] text-right">{currentAsset.field}</span>
              </div>
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">物理类型:</span>
                <span className="font-mono text-[#334155] text-right">{currentAsset.dataType}</span>
              </div>
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">语义类型:</span>
                <span className="font-medium text-[#0F172A] text-right">{selectedSemantic || currentAsset.semanticType}</span>
              </div>
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">业务名称:</span>
                <span className="font-medium text-[#0F172A] text-right">{customBusinessName || currentAsset.businessName}</span>
              </div>
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">字段角色:</span>
                <span className="text-[#334155] text-right">{selectedRole || currentAsset.fieldRole}</span>
              </div>
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">业务定义:</span>
                <span className="text-[#334155] text-right leading-relaxed pl-2">
                  {customDefinition || currentAsset.businessDefinition}
                </span>
              </div>
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">业务关联对象:</span>
                <span className="text-[#0F172A] text-right">工单对象</span>
              </div>
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">关联主体:</span>
                <span className="text-[#0F172A] text-right">自然人</span>
              </div>
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">支持分析维度:</span>
                <span className="text-[#334155] text-right">主体分析、生命周期分析、人群分析</span>
              </div>
              <div className="flex items-start justify-between text-[11px] py-0.5">
                <span className="text-[#64748B] w-24 shrink-0">治理状态:</span>
                <span className="font-medium text-[#D97706] text-right">
                  待人工确认
                </span>
              </div>
            </div>

            {/* Decision Section (No background box per option) */}
            <div className="pt-2 space-y-2">
              <div className="font-bold text-[#0F172A] text-xs">
                你的决策
              </div>

              <div className="space-y-2 text-xs">
                <label
                  onClick={() => setUserDecision('confirm')}
                  className="flex items-start space-x-2.5 py-1 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={userDecision === 'confirm'}
                    onChange={() => setUserDecision('confirm')}
                    className="mt-0.5 text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
                  />
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#0F172A]">确认 AI 推荐</div>
                    <div className="text-[11px] text-[#64748B]">
                      采用“{customBusinessName || '申请人标识'}”作为当前字段语义。
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => {
                    setUserDecision('candidate');
                    setActiveRightTab('adjust');
                  }}
                  className="flex items-start space-x-2.5 py-1 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={userDecision === 'candidate'}
                    onChange={() => {
                      setUserDecision('candidate');
                      setActiveRightTab('adjust');
                    }}
                    className="mt-0.5 text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
                  />
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#0F172A]">采纳其他候选</div>
                    <div className="text-[11px] text-[#64748B]">从候选列表中选择其他解释。</div>
                  </div>
                </label>

                <label
                  onClick={() => {
                    setUserDecision('manual');
                    setActiveRightTab('adjust');
                  }}
                  className="flex items-start space-x-2.5 py-1 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={userDecision === 'manual'}
                    onChange={() => {
                      setUserDecision('manual');
                      setActiveRightTab('adjust');
                    }}
                    className="mt-0.5 text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
                  />
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#0F172A]">手工调整</div>
                    <div className="text-[11px] text-[#64748B]">
                      手工修正语义类型、业务名称或字段角色。
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setUserDecision('review')}
                  className="flex items-start space-x-2.5 py-1 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={userDecision === 'review'}
                    onChange={() => setUserDecision('review')}
                    className="mt-0.5 text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
                  />
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#0F172A]">标记待复核</div>
                    <div className="text-[11px] text-[#64748B]">
                      当前证据不足，先保留待复核状态。
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 调整推荐 */}
        {activeRightTab === 'adjust' && (
          <div className="space-y-4 text-xs">
            <div className="font-bold text-[#1E293B]">修改语义结果</div>

            {/* Search Semantic */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#1E293B]">搜索语义类型…</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="检索语义词典..."
                  value={semanticSearch}
                  onChange={(e) => setSemanticSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                />
              </div>
            </div>

            {/* Grouped Recommendation Selector */}
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-[#1E293B]">候选语义选定</label>
              {recommendedGroups.map((group, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">
                    {group.title}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => {
                      const isSelected = selectedSemantic === item;
                      return (
                        <button
                          key={item}
                          onClick={() => setSelectedSemantic(item)}
                          className={`px-2.5 py-1 rounded text-xs transition-all font-medium border ${
                            isSelected
                              ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-2xs font-bold'
                              : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Field Role Dropdown */}
            <div className="space-y-1 pt-2 border-t border-[#E2E8F0]">
              <label className="text-[11px] font-semibold text-[#1E293B]">字段角色调整</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-[#E2E8F0] rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5] font-medium text-[#1E293B]"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Name Override */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#1E293B]">业务标准名称微调</label>
              <input
                type="text"
                value={customBusinessName}
                onChange={(e) => setCustomBusinessName(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-[#E2E8F0] rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5] font-medium text-[#1E293B]"
              />
            </div>

            {/* Business Definition Override */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#1E293B]">业务定义描述调整</label>
              <textarea
                rows={3}
                value={customDefinition}
                onChange={(e) => setCustomDefinition(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-[#E2E8F0] rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#334155]"
              />
            </div>
          </div>
        )}

        {/* Tab 3: 历史版本 */}
        {activeRightTab === 'history' && (
          <div className="space-y-3 text-xs">
            <div className="text-[11px] text-[#64748B] font-medium">
              版本变更历史记录
            </div>

            <div className="space-y-2">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-[#1E293B]">
                  <span>V3 (当前版本)</span>
                  <span className="text-[10px] text-[#94A3B8]">2026-08-10 10:16</span>
                </div>
                <div className="text-[11px] text-[#475569]">
                  采纳语义: <span className="font-bold text-[#4F46E5]">事件时间 (办结时间)</span>
                </div>
                <div className="text-[10px] text-[#64748B] flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                  <span>来源: AI推荐</span>
                  <span>操作人: AI 引擎</span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-2.5 rounded space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-[#1E293B]">
                  <span>V2</span>
                  <span className="text-[10px] text-[#94A3B8]">2026-08-01 14:22</span>
                </div>
                <div className="text-[11px] text-[#475569]">
                  采纳语义: <span className="font-bold text-[#334155]">关闭日期</span>
                </div>
                <div className="text-[10px] text-[#64748B] flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                  <span>来源: 人工微调</span>
                  <span>操作人: 张强 (数据工程师)</span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-2.5 rounded space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-[#1E293B]">
                  <span>V1</span>
                  <span className="text-[10px] text-[#94A3B8]">2026-07-28 09:48</span>
                </div>
                <div className="text-[11px] text-[#475569]">
                  采纳语义: <span className="font-bold text-[#94A3B8]">未知</span>
                </div>
                <div className="text-[10px] text-[#64748B] flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                  <span>来源: 初始导入</span>
                  <span>操作人: 系统自动扫描</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Actions (All buttons on a single horizontal row) */}
      <div className="p-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between gap-2">
        <button
          onClick={onConfirmNext}
          className="flex-1 py-2 px-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors text-center cursor-pointer whitespace-nowrap"
        >
          保存并进入下一个字段
        </button>

        <button
          onClick={onSaveDraft}
          className="py-2 px-2.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
        >
          保存草稿
        </button>

        <button
          onClick={onMarkReview}
          className="text-[#2563EB] hover:underline text-xs font-medium cursor-pointer transition-colors whitespace-nowrap px-1"
        >
          标记待复核
        </button>
      </div>
    </div>
  );
};

