import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  Info,
  ShieldCheck,
  FileText,
  Layers,
  Table,
  Tag,
  Clock,
  GitCommit,
  Check,
  ExternalLink,
  Lock,
  RefreshCw,
  Database,
  ArrowUpRight,
  Sliders,
  Filter,
  CheckSquare,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface TableSemanticWorkspaceProps {
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToFields?: () => void;
  onNavigateToAssetDetail?: () => void;
}

export const TableSemanticWorkspace: React.FC<TableSemanticWorkspaceProps> = ({
  addToast,
  onNavigateToFields,
  onNavigateToAssetDetail,
}) => {
  // Tab state: 'table' (表语义) | 'field' (字段语义)
  const [activeTab, setActiveTab] = useState<'table' | 'field'>('table');

  // Focus Decision ID: 'decision_01' (记录粒度) | 'decision_02' (主体标识) | 'identity' (业务身份) | 'timestamps' (关键时间) | 'relations' (业务关系)
  const [focusedSection, setFocusedSection] = useState<
    'decision_01' | 'decision_02' | 'identity' | 'timestamps' | 'relations'
  >('decision_01');

  // Decision 1 State (记录粒度)
  const [decision1Choice, setDecision1Choice] = useState<'single_ticket' | 'status_change' | 'other'>('single_ticket');
  const [isDecision1Confirmed, setIsDecision1Confirmed] = useState<boolean>(false);

  // Decision 2 State (主体标识)
  const [decision2Choice, setDecision2Choice] = useState<'ticket_id' | 'record_id' | 'composite'>('ticket_id');
  const [isDecision2Confirmed, setIsDecision2Confirmed] = useState<boolean>(false);

  // Custom choice input for other
  const [customGrainInput, setCustomGrainInput] = useState<string>('');

  // Handle Decision 01 Confirm
  const handleConfirmDecision1 = () => {
    setIsDecision1Confirmed(true);
    if (addToast) {
      const choiceLabel =
        decision1Choice === 'single_ticket'
          ? '一张服务工单'
          : decision1Choice === 'status_change'
          ? '一次工单状态变化'
          : customGrainInput || '自定义理解';
      addToast('success', '已确认记录粒度', `表达语义已更新为【${choiceLabel}】，已同步至关联模型与指标层`);
    }
  };

  // Handle Decision 02 Confirm
  const handleConfirmDecision2 = () => {
    setIsDecision2Confirmed(true);
    if (addToast) {
      const choiceLabel =
        decision2Choice === 'ticket_id'
          ? 'ticket_id · 工单编号'
          : decision2Choice === 'record_id'
          ? 'record_id · 记录ID'
          : '组合标识';
      addToast('success', '已确认主体标识', `已将【${choiceLabel}】绑定为当前表的主体标识，关联字段映射已同步`);
    }
  };

  // Calculate pending decisions count
  const pendingDecisionsCount = (isDecision1Confirmed ? 0 : 1) + (isDecision2Confirmed ? 0 : 1);

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans overflow-hidden select-none">
      
      {/* 1. Page Header (Asset Header) */}
      <div className="bg-white border-b border-[#E2E8F0] px-8 py-4 shrink-0 shadow-2xs">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-xs text-[#64748B]">
              <span>数据治理</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-semibold text-[#0F172A]">数据语义</span>
            </div>

            {/* Title & Metadata Line */}
            <div className="flex items-center space-x-3 pt-0.5">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                <span>公共服务热线工单记录表</span>
              </h1>

              {/* Badges */}
              <div className="flex items-center space-x-1.5">
                <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[11px] font-bold rounded">
                  Table
                </span>
                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-[11px] font-medium rounded">
                  公共服务
                </span>
                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-[11px] font-medium rounded">
                  公共服务热线库
                </span>
              </div>
            </div>

            {/* Technical Qualified Name */}
            <div className="flex items-center space-x-2 text-xs font-mono text-[#64748B]">
              <Database className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>hotline_db.service.pop_service_hotline</span>
            </div>
          </div>

          {/* Right Header Status Text - Lightweight Auto Saved Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-lg text-xs text-[#64748B]">
              <Check className="w-3.5 h-3.5 text-[#059669]" />
              <span className="font-medium text-[#475569]">已自动保存</span>
            </div>

            {onNavigateToAssetDetail && (
              <button
                onClick={onNavigateToAssetDetail}
                className="px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
              >
                <span>查看完整资产</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Secondary Perspective Switch (Tabs - Non-Stepper) */}
        <div className="mt-4 border-t border-[#F1F5F9] pt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'table'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>表语义</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('field');
                if (onNavigateToFields) {
                  onNavigateToFields();
                } else if (addToast) {
                  addToast('info', '切换至 字段语义', '即将载入字段语义理解与实体映射视图');
                }
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'field'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>字段语义</span>
            </button>
          </div>

          <div className="text-[11px] text-[#64748B] flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>AI Semantic Decision Workspace · Semovix Xino</span>
          </div>
        </div>
      </div>

      {/* 3. Page Main Text Summary Bar */}
      <div className="bg-[#EFF6FF]/70 border-b border-[#BFDBFE] px-8 py-3 shrink-0 flex items-center justify-between text-xs text-[#1E40AF]">
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
          <strong className="font-bold text-[#1E3A8A]">AI 已形成当前表级理解</strong>
          <span className="text-[#334155] border-l border-[#93C5FD] pl-2.5">
            业务身份、关键业务时间和主要业务关系已具备充分依据。
            {pendingDecisionsCount > 0 ? (
              <span className="font-semibold text-[#1E40AF]">
                当前仍有 <strong className="text-[#D97706] font-bold">{pendingDecisionsCount}</strong> 项关键业务含义需要你确认。
              </span>
            ) : (
              <span className="font-semibold text-[#059669]">
                所有关键业务含义已全部完成确认。
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {pendingDecisionsCount > 0 && (
            <button
              onClick={() => setFocusedSection('decision_01')}
              className="px-2.5 py-1 bg-white hover:bg-[#F8FAFC] border border-[#93C5FD] text-[#2563EB] font-bold text-[11px] rounded transition-colors cursor-pointer"
            >
              优先处理决策
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Dual-Column Layout (Left ~70%, Right ~30%) */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Left Main Workspace (~70% Width) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          
          {/* SECTION 1: AI 当前理解 (AI Current Understanding) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">AI 当前理解</h2>
              </div>
              <span className="text-[11px] text-[#64748B]">基于元数据日志、数据画像与企业规范自动提炼</span>
            </div>

            {/* Read-First Semantic Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Module 1: 业务身份 (Business Identity) */}
              <div
                onClick={() => setFocusedSection('identity')}
                className={`p-4 bg-[#F8FAFC] rounded-xl transition-all cursor-pointer space-y-3 border ${
                  focusedSection === 'identity'
                    ? 'border-[#2563EB] ring-1 ring-[#BFDBFE] bg-[#EFF6FF]/30'
                    : 'border-[#F1F5F9] hover:border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#E2E8F0]/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">01 · 业务身份</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] text-[10px] font-bold rounded">
                    已形成理解
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-[#0F172A]">
                    公共服务热线工单记录表
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    记录群众通过公共服务热线产生的服务诉求，以及从受理到办理、办结的业务过程。
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">主要记录主体:</span>
                  <span className="font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-[#BFDBFE]">
                    服务工单
                  </span>
                </div>
              </div>

              {/* Module 2: 记录语义 (Record Semantics) */}
              <div
                onClick={() => setFocusedSection('decision_01')}
                className={`p-4 bg-[#F8FAFC] rounded-xl transition-all cursor-pointer space-y-3 border ${
                  focusedSection === 'decision_01' || focusedSection === 'decision_02'
                    ? 'border-[#2563EB] ring-1 ring-[#BFDBFE] bg-[#EFF6FF]/30'
                    : 'border-[#F1F5F9] hover:border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#E2E8F0]/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-[#D97706]" />
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">02 · 记录语义</span>
                  </div>
                  {pendingDecisionsCount > 0 ? (
                    <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] text-[10px] font-bold rounded">
                      待你决策 ({pendingDecisionsCount})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] text-[10px] font-bold rounded">
                      已全部确认
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  {/* Record Grain Item */}
                  <div className="p-2.5 bg-white rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] font-semibold">记录粒度:</span>
                      {isDecision1Confirmed ? (
                        <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] font-bold rounded text-[11px] flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>已确认: 一张服务工单</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] font-bold rounded text-[11px]">
                          待确认
                        </span>
                      )}
                    </div>
                    {!isDecision1Confirmed && (
                      <p className="text-[11px] text-[#64748B]">
                        AI 已生成推荐结果，需你确认当前一行记录代表的业务粒度。
                      </p>
                    )}
                  </div>

                  {/* Identifier Item */}
                  <div className="p-2.5 bg-white rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] font-semibold">主体标识:</span>
                      {isDecision2Confirmed ? (
                        <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] font-bold rounded text-[11px] flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>已确认: ticket_id · 工单编号</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] font-bold rounded text-[11px]">
                          待确认
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Module 3: 关键时间 (Key Timestamps) */}
              <div
                onClick={() => setFocusedSection('timestamps')}
                className={`p-4 bg-[#F8FAFC] rounded-xl transition-all cursor-pointer space-y-3 border ${
                  focusedSection === 'timestamps'
                    ? 'border-[#2563EB] ring-1 ring-[#BFDBFE] bg-[#EFF6FF]/30'
                    : 'border-[#F1F5F9] hover:border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#E2E8F0]/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#4F46E5]" />
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">03 · 关键时间</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] text-[10px] font-bold rounded">
                    3 个语义映射
                  </span>
                </div>

                {/* Clean Lightweight Table */}
                <div className="overflow-x-auto bg-white rounded-lg p-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[11px] text-[#64748B] border-b border-[#F1F5F9]">
                        <th className="py-1.5 px-2 font-bold">业务时间语义</th>
                        <th className="py-1.5 px-2 font-bold">对应字段</th>
                        <th className="py-1.5 px-2 font-bold">业务过程</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="py-1.5 px-2 font-bold text-[#0F172A]">创建时间</td>
                        <td className="py-1.5 px-2 font-mono text-[#2563EB]">created_time</td>
                        <td className="py-1.5 px-2 text-[#475569]">工单创建</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="py-1.5 px-2 font-bold text-[#0F172A]">受理时间</td>
                        <td className="py-1.5 px-2 font-mono text-[#2563EB]">accept_time</td>
                        <td className="py-1.5 px-2 text-[#475569]">工单受理</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="py-1.5 px-2 font-bold text-[#0F172A]">办结时间</td>
                        <td className="py-1.5 px-2 font-mono text-[#2563EB]">close_time</td>
                        <td className="py-1.5 px-2 text-[#475569]">工单办结</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Module 4: 业务关系 (Business Relationships) */}
              <div
                onClick={() => setFocusedSection('relations')}
                className={`p-4 bg-[#F8FAFC] rounded-xl transition-all cursor-pointer space-y-3 border ${
                  focusedSection === 'relations'
                    ? 'border-[#2563EB] ring-1 ring-[#BFDBFE] bg-[#EFF6FF]/30'
                    : 'border-[#F1F5F9] hover:border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#E2E8F0]/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <GitCommit className="w-4 h-4 text-[#059669]" />
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">04 · 业务关系</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] text-[10px] font-bold rounded">
                    3 条实体关联
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {/* 已确认关系 1 */}
                  <div className="p-2 bg-white rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-[#0F172A]">服务工单</span>
                      <ArrowRight className="w-3 h-3 text-[#2563EB]" />
                      <span className="text-[#334155]">申请人</span>
                      <ArrowRight className="w-3 h-3 text-[#2563EB]" />
                      <span className="font-bold text-[#2563EB]">自然人</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                      已确认
                    </span>
                  </div>

                  {/* 已确认关系 2 */}
                  <div className="p-2 bg-white rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-[#0F172A]">服务工单</span>
                      <ArrowRight className="w-3 h-3 text-[#2563EB]" />
                      <span className="text-[#334155]">承办部门</span>
                      <ArrowRight className="w-3 h-3 text-[#2563EB]" />
                      <span className="font-bold text-[#2563EB]">组织机构</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                      已确认
                    </span>
                  </div>

                  {/* AI 建议关系 */}
                  <div className="p-2 bg-white/80 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-[#475569]">服务工单</span>
                      <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                      <span className="text-[#64748B]">所属区域</span>
                      <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                      <span className="font-semibold text-[#475569]">行政区域</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded">
                      AI 建议
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: 需要你决定 (Needs Your Decision) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="px-2 py-0.5 bg-[#D97706] text-white text-xs font-bold rounded">
                  需要你决定 · {pendingDecisionsCount}
                </div>
                <p className="text-xs text-[#64748B]">
                  AI 算法保留少数关键业务歧义点，请明确业务定义与识别主体
                </p>
              </div>

              {pendingDecisionsCount === 0 && (
                <span className="text-xs font-bold text-[#059669] flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>已全部完成确认</span>
                </span>
              )}
            </div>

            {/* Decision Cards */}
            <div className="space-y-5">
              
              {/* === DECISION 01: 记录粒度 === */}
              <div
                onClick={() => setFocusedSection('decision_01')}
                className={`p-5 rounded-xl transition-all relative space-y-3.5 border ${
                  isDecision1Confirmed
                    ? 'border-[#A7F3D0] bg-[#F0FDF4]/30'
                    : focusedSection === 'decision_01'
                    ? 'border-[#2563EB] bg-[#EFF6FF]/20 shadow-2xs'
                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] font-mono font-bold text-xs rounded">
                        Decision 01
                      </span>
                      <h3 className="text-base font-bold text-[#0F172A]">记录粒度</h3>
                      {isDecision1Confirmed && (
                        <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] text-xs font-bold rounded flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>已决策</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B]">
                      AI 无法完全确定这张表的一行记录代表什么，请你确认最准确的业务粒度。
                    </p>
                  </div>
                </div>

                {/* Recommendation Banner */}
                <div className="p-3.5 bg-[#EFF6FF]/70 rounded-xl space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#1E40AF]">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span>推荐：一行代表一张服务工单</span>
                  </div>

                  {/* Concise Evidence Summary (3-4 bullet points) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#334155]">
                    <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span><strong className="font-mono text-[#0F172A]">ticket_id</strong> 在绝大多数记录中唯一</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span><strong className="font-mono text-[#0F172A]">status</strong> 更像当前状态而不是状态变化流水</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span>未发现独立事件序列字段</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span>工单术语和字段组合支持当前理解</span>
                    </div>
                  </div>
                </div>

                {/* Radio Options */}
                <div className="space-y-2">
                  <label
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      decision1Choice === 'single_ticket'
                        ? 'border-[#2563EB] bg-[#EFF6FF]/80 font-bold text-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 text-xs">
                      <input
                        type="radio"
                        name="decision1"
                        checked={decision1Choice === 'single_ticket'}
                        onChange={() => setDecision1Choice('single_ticket')}
                        className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <span>一张服务工单</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#2563EB] bg-white px-2 py-0.5 rounded">
                      AI 推荐项
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      decision1Choice === 'status_change'
                        ? 'border-[#2563EB] bg-[#EFF6FF]/80 font-bold text-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 text-xs">
                      <input
                        type="radio"
                        name="decision1"
                        checked={decision1Choice === 'status_change'}
                        onChange={() => setDecision1Choice('status_change')}
                        className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <span>一次工单状态变化</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      decision1Choice === 'other'
                        ? 'border-[#2563EB] bg-[#EFF6FF]/80 font-bold text-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 text-xs w-full">
                      <input
                        type="radio"
                        name="decision1"
                        checked={decision1Choice === 'other'}
                        onChange={() => setDecision1Choice('other')}
                        className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <span>其他理解</span>
                      {decision1Choice === 'other' && (
                        <input
                          type="text"
                          value={customGrainInput}
                          onChange={(e) => setCustomGrainInput(e.target.value)}
                          placeholder="请输入特定的业务记录粒度…"
                          className="ml-3 px-3 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] flex-1"
                        />
                      )}
                    </div>
                  </label>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setFocusedSection('decision_01');
                      if (addToast) addToast('info', '查看完整依据', '已在右侧高亮呈现“记录粒度”数据画像与关系证据');
                    }}
                    className="text-xs font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看完整依据</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleConfirmDecision1}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5 ${
                      isDecision1Confirmed
                        ? 'bg-[#059669] hover:bg-[#047857] text-white'
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{isDecision1Confirmed ? '重新确认建议' : '采用建议'}</span>
                  </button>
                </div>
              </div>

              {/* === DECISION 02: 主体标识 === */}
              <div
                onClick={() => setFocusedSection('decision_02')}
                className={`p-5 rounded-xl transition-all relative space-y-3.5 border ${
                  isDecision2Confirmed
                    ? 'border-[#A7F3D0] bg-[#F0FDF4]/30'
                    : focusedSection === 'decision_02'
                    ? 'border-[#2563EB] bg-[#EFF6FF]/20 shadow-2xs'
                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] font-mono font-bold text-xs rounded">
                        Decision 02
                      </span>
                      <h3 className="text-base font-bold text-[#0F172A]">主体标识</h3>
                      {isDecision2Confirmed && (
                        <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] text-xs font-bold rounded flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>已决策</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B]">
                      请确认哪个字段真正用于标识一张“服务工单”。
                    </p>
                  </div>
                </div>

                {/* Recommendation Banner */}
                <div className="p-3.5 bg-[#EFF6FF]/70 rounded-xl space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#1E40AF]">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span>推荐：ticket_id · 工单编号</span>
                  </div>

                  {/* Concise Evidence Summary (4 bullet points) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#334155]">
                    <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span>命名与业务术语匹配</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span>非空率高、唯一性高</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span>下游多处以该字段进行关联</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      <span><strong className="font-mono text-[#0F172A]">record_id</strong> 更像技术记录主键</span>
                    </div>
                  </div>
                </div>

                {/* Radio Options */}
                <div className="space-y-2">
                  <label
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      decision2Choice === 'ticket_id'
                        ? 'border-[#2563EB] bg-[#EFF6FF]/80 font-bold text-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 text-xs">
                      <input
                        type="radio"
                        name="decision2"
                        checked={decision2Choice === 'ticket_id'}
                        onChange={() => setDecision2Choice('ticket_id')}
                        className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <span className="font-mono">ticket_id · 工单编号</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#2563EB] bg-white px-2 py-0.5 rounded">
                      AI 推荐项
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      decision2Choice === 'record_id'
                        ? 'border-[#2563EB] bg-[#EFF6FF]/80 font-bold text-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 text-xs">
                      <input
                        type="radio"
                        name="decision2"
                        checked={decision2Choice === 'record_id'}
                        onChange={() => setDecision2Choice('record_id')}
                        className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <span className="font-mono">record_id · 记录ID</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      decision2Choice === 'composite'
                        ? 'border-[#2563EB] bg-[#EFF6FF]/80 font-bold text-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 text-xs">
                      <input
                        type="radio"
                        name="decision2"
                        checked={decision2Choice === 'composite'}
                        onChange={() => setDecision2Choice('composite')}
                        className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <span>组合标识 (dept_code + ticket_id)</span>
                    </div>
                  </label>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setFocusedSection('decision_02');
                      if (addToast) addToast('info', '查看完整依据', '已在右侧高亮呈现“主体标识”数据证据与权威标准对比');
                    }}
                    className="text-xs font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>查看完整依据</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleConfirmDecision2}
                    className={`px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5 ${
                      isDecision2Confirmed
                        ? 'bg-[#059669] hover:bg-[#047857] text-white'
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{isDecision2Confirmed ? '重新确认建议' : '采用建议'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Evidence Panel (~30% Width: 380px) */}
        <div className="w-[380px] bg-white h-full overflow-y-auto flex flex-col shrink-0 border-l border-[#E2E8F0] p-6 space-y-6 text-xs select-text">
          
          {/* Panel Header */}
          <div className="border-b border-[#F1F5F9] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">理解依据</h2>
              <p className="text-[11px] text-[#64748B]">
                随当前焦点语义动态变动的多维验证数据
              </p>
            </div>
            <span className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#2563EB]">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          {/* 1. 当前选中语义 Focus Card */}
          <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">
              当前选中语义 (Current Focused Semantic)
            </div>
            <div className="text-sm font-extrabold text-[#0F172A]">
              {focusedSection === 'decision_01'
                ? '记录粒度 (Record Grain)'
                : focusedSection === 'decision_02'
                ? '主体标识 (Subject Identifier)'
                : focusedSection === 'identity'
                ? '业务身份 (Business Identity)'
                : focusedSection === 'timestamps'
                ? '关键时间 (Key Timestamps)'
                : '业务关系 (Business Relationships)'}
            </div>
          </div>

          {/* 2. 权威依据 (Authoritative Standards) */}
          <div className="space-y-2.5">
            <div className="font-bold text-[#0F172A] text-xs border-b border-[#F1F5F9] pb-1.5 flex items-center justify-between">
              <span>权威依据 (Authority Evidence)</span>
              <FileText className="w-3.5 h-3.5 text-[#64748B]" />
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">企业标准:</span>
                <span className="font-medium text-[#94A3B8] italic">未命中直接标准</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">业务术语:</span>
                <span className="font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                  服务热线工单
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">已确认业务对象:</span>
                <span className="font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  服务工单 (ServiceTicket)
                </span>
              </div>
            </div>
          </div>

          {/* 3. 已治理依据 (Governed Semantics Evidence) */}
          <div className="space-y-2.5">
            <div className="font-bold text-[#0F172A] text-xs border-b border-[#F1F5F9] pb-1.5 flex items-center justify-between">
              <span>已治理依据 (Governed Evidence)</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">已确认表级语义:</span>
                <span className="font-semibold text-[#0F172A]">记录主体 = 服务工单</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">已确认时间语义:</span>
                <span className="font-mono text-[#2563EB]">created / accept / close</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">已确认字段语义:</span>
                <span className="font-mono text-[#0F172A]">status = 处理状态</span>
              </div>
            </div>
          </div>

          {/* 4. 数据证据 (Data Profile Evidence) */}
          <div className="space-y-2.5">
            <div className="font-bold text-[#0F172A] text-xs border-b border-[#F1F5F9] pb-1.5 flex items-center justify-between">
              <span>数据证据 (Data Profile)</span>
              <Database className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2.5 text-[11px]">
              {focusedSection === 'decision_02' ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                    <span className="font-mono font-bold text-[#0F172A]">ticket_id</span>
                    <span className="font-mono text-[#64748B]">VARCHAR · NOT NULL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">唯一率 (Uniqueness):</span>
                    <span className="font-mono font-bold text-[#059669]">99.3% (极高)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">非空率 (Completeness):</span>
                    <span className="font-mono font-bold text-[#059669]">100.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">对照对比:</span>
                    <span className="font-mono text-[#64748B]">record_id 为自增整数键</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                    <span className="font-mono font-bold text-[#0F172A]">ticket_id + status</span>
                    <span className="font-mono text-[#64748B]">组合画像</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">唯一率 (Uniqueness):</span>
                    <span className="font-mono font-bold text-[#059669]">99.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">status 值域:</span>
                    <span className="font-mono text-[#0F172A]">有限枚举 (5 个状态值)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">时间戳关联:</span>
                    <span className="font-mono text-[#0F172A]">close_time 与 accept_time 同时出现</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 4. 关系证据 (Relationship Evidence) */}
          <div className="space-y-2.5">
            <div className="font-bold text-[#0F172A] text-xs border-b border-[#F1F5F9] pb-1.5 flex items-center justify-between">
              <span>关系证据 (Lineage & Model Links)</span>
              <GitCommit className="w-3.5 h-3.5 text-[#059669]" />
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2 text-[11px]">
              <div className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-1 shrink-0" />
                <span className="text-[#334155]">
                  <strong className="font-mono font-bold text-[#0F172A]">7 个</strong> 相关资产通过 <code className="font-mono text-[#2563EB]">ticket_id</code> 进行关联
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-1 shrink-0" />
                <span className="text-[#334155]">
                  <code className="font-mono text-[#2563EB]">person_id</code> 与自然人资产形成稳定关联
                </span>
              </div>
            </div>
          </div>

          {/* 5. AI 推断摘要 (AI Inference Summary - Weakest Expression) */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5 opacity-90">
            <div className="text-[10px] font-bold text-[#64748B] flex items-center space-x-1">
              <Lightbulb className="w-3 h-3 text-[#D97706]" />
              <span>AI 推断摘要 (Inference Summary)</span>
            </div>
            <p className="text-[11px] text-[#475569] leading-relaxed">
              {focusedSection === 'decision_02'
                ? '`ticket_id` 命名模式、字符格式及在下游数据仓库中的 Join 习惯，充分支持其作为服务工单的主体标识。'
                : '当前字段组合更符合“工单主记录”而非“状态流水记录”。未在结构中发现 `event_seq` 或 `log_id` 序列标志。'}
            </p>
          </div>

          {/* Help & Documentation Note */}
          <div className="pt-2 border-t border-[#F1F5F9] text-[11px] text-[#94A3B8] flex items-center justify-between">
            <span>Semovix Semantic Engine v4.2</span>
            <button
              onClick={() => alert('已载入 Semovix 表级语义理解算法与标准参考文档')}
              className="text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer font-medium"
            >
              <span>了解理解依据</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
