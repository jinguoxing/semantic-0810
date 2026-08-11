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
    <div className="w-full lg:w-[420px] bg-white border-l border-[#E2E8F0] flex flex-col h-full shrink-0 shadow-2xs transition-all duration-200">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-xs font-bold text-[#1E293B]">当前语义资产 (Column Semantic Profile)</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#059669]/20 font-semibold">
              已确认
            </span>
            <button
              onClick={() => toggleCollapse(true)}
              className="p-1 rounded text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] transition-colors"
              title="收起面板"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#F1F5F9] p-1 rounded text-xs font-semibold">
          <button
            onClick={() => setActiveRightTab('result')}
            className={`py-1.5 rounded transition-all duration-150 text-center flex items-center justify-center space-x-1 ${
              activeRightTab === 'result'
                ? 'bg-white text-[#4F46E5] shadow-2xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>当前结果</span>
          </button>
          <button
            onClick={() => setActiveRightTab('adjust')}
            className={`py-1.5 rounded transition-all duration-150 text-center flex items-center justify-center space-x-1 ${
              activeRightTab === 'adjust'
                ? 'bg-white text-[#4F46E5] shadow-2xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>调整推荐</span>
          </button>
          <button
            onClick={() => setActiveRightTab('history')}
            className={`py-1.5 rounded transition-all duration-150 text-center flex items-center justify-center space-x-1 ${
              activeRightTab === 'history'
                ? 'bg-white text-[#4F46E5] shadow-2xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>历史版本</span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* Tab 1: 当前结果 */}
        {activeRightTab === 'result' && (
          <div className="space-y-3 text-xs">
            {/* Readonly Asset Card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-md space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">物理字段名</span>
                <span className="font-mono font-bold text-[#1E293B] text-sm">
                  {currentAsset.field}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#94A3B8]">物理类型:</span>
                  <div className="font-mono font-semibold text-[#1E293B] mt-0.5">
                    {currentAsset.dataType}
                  </div>
                </div>
                <div>
                  <span className="text-[#94A3B8]">语义类型:</span>
                  <div className="font-bold text-[#4F46E5] mt-0.5">
                    {selectedSemantic || currentAsset.semanticType}
                  </div>
                </div>
                <div>
                  <span className="text-[#94A3B8]">字段角色:</span>
                  <div className="font-semibold text-[#312E81] mt-0.5">
                    {selectedRole || currentAsset.fieldRole}
                  </div>
                </div>
                <div>
                  <span className="text-[#94A3B8]">业务标准名称:</span>
                  <div className="font-bold text-[#059669] mt-0.5">
                    {customBusinessName || currentAsset.businessName}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-2 space-y-1">
                <span className="text-[#94A3B8] text-[11px]">业务定义描述:</span>
                <p className="text-[#334155] leading-relaxed bg-white p-2.5 rounded border border-[#E2E8F0]">
                  {customDefinition || currentAsset.businessDefinition}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#E2E8F0]">
                <div>
                  <span className="text-[#94A3B8]">业务关联对象:</span>
                  <div className="font-bold text-[#1E293B] mt-0.5">工单对象</div>
                </div>
                <div>
                  <span className="text-[#94A3B8]">支持分析维度:</span>
                  <div className="font-medium text-[#4F46E5] mt-0.5">生命周期 / 趋势分析</div>
                </div>
              </div>

              {/* Badges */}
              <div className="pt-2 flex flex-wrap gap-1.5 border-t border-[#E2E8F0]">
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#059669]/20">
                  <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                  <span>语义已确认</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EEF2FF] text-[#4F46E5] border border-[#4F46E5]/20">
                  <CheckCircle2 className="w-3 h-3 text-[#4F46E5]" />
                  <span>企业标准已匹配</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1]">
                  <span>可下游消费</span>
                </span>
              </div>
            </div>

            {/* Quick Status Box */}
            <div className="bg-[#EEF2FF] border border-[#4F46E5]/20 p-3 rounded-md text-xs space-y-1 text-[#312E81]">
              <div className="font-bold flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>语义确定性说明</span>
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed">
                该字段已通过《政务数据语义治理规范》一致性校验，可直接用于指标计算与知识网络消费。
              </p>
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

      {/* Bottom Sticky Actions */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
        <button
          onClick={onConfirmNext}
          className="w-full py-2.5 px-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>确认并进入下一个字段</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSaveDraft}
            className="py-1.5 px-2 bg-white hover:bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Save className="w-3.5 h-3.5 text-[#64748B]" />
            <span>保存草稿</span>
          </button>
          <button
            onClick={onMarkReview}
            className="py-1.5 px-2 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>标记待复核</span>
          </button>
        </div>
      </div>
    </div>
  );
};

