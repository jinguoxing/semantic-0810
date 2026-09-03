import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  Database,
  Check,
  ArrowRight,
  GitCompare
} from 'lucide-react';

interface BusinessObjectDiscoveryWorkspaceProps {
  onBackToSemantic?: () => void;
  onEnterModeling?: () => void;
  onViewLineage?: () => void;
  onReanalyze?: () => void;
}

type DecisionType = 'create' | 'map' | 'ignore' | 'manual';

export const BusinessObjectDiscoveryWorkspace: React.FC<
  BusinessObjectDiscoveryWorkspaceProps
> = ({ onEnterModeling }) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState('1');
  const [leftTab, setLeftTab] = useState<'pending' | 'matched' | 'ignored' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<DecisionType>('create');
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // Candidates list exact match with design screenshot
  const candidates = [
    {
      id: '1',
      name: '服务工单',
      score: '92%',
      sourceAsset: 'pop_service_hotline',
      objectForm: '业务过程对象',
      trustLevel: '高可信',
      status: 'pending',
      statusLabel: '待决策',
      statusBadgeStyle: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
    },
    {
      id: '2',
      name: '自然人',
      score: '95%',
      sourceAsset: 'person_basic_info',
      objectForm: '业务主体对象',
      trustLevel: '高可信',
      status: 'matched',
      statusLabel: '已匹配',
      statusBadgeStyle: 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]'
    },
    {
      id: '3',
      name: '工单日报',
      score: '—',
      sourceAsset: 'ticket_daily_summary',
      objectForm: '分析数据集',
      trustLevel: '不建议生成',
      status: 'ignored',
      statusLabel: '不建议生成',
      statusBadgeStyle: 'bg-[#FEF2F2] text-[#EF4444] border-[#FCA5A5]'
    },
    {
      id: '4',
      name: '服务事项',
      score: '88%',
      sourceAsset: 'service_item',
      objectForm: '参考对象',
      trustLevel: '中可信',
      status: 'pending',
      statusLabel: '待决策',
      statusBadgeStyle: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
    },
    {
      id: '5',
      name: '服务回访记录',
      score: '76%',
      sourceAsset: 'service_callback',
      objectForm: '业务过程对象',
      trustLevel: '中可信',
      status: 'pending',
      statusLabel: '待决策',
      statusBadgeStyle: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
    }
  ];

  const currentCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  // Evidence Rows exact match with design screenshot
  const evidenceRows = [
    {
      dimension: '业务语义',
      source: 'pop_service_hotline 公共服务热线工单记录',
      businessMeaning: '稳定表达一个独立的服务处理过程',
      supportLevel: '强支持',
      badgeStyle: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
    },
    {
      dimension: '业务身份',
      fields: ['ticket_id'],
      sourceExtra: '唯一率 99.9%',
      businessMeaning: '能够稳定识别单个服务工单实例',
      supportLevel: '强支持',
      badgeStyle: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
    },
    {
      dimension: '生命周期',
      fields: ['created_time', 'status', 'close_time', 'duration'],
      businessMeaning: '具备从创建、处理到关闭的完整状态变化过程',
      supportLevel: '强支持',
      badgeStyle: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
    },
    {
      dimension: '数据粒度',
      source: '每行代表一张服务工单处理记录',
      businessMeaning: '满足独立业务对象实例粒度',
      supportLevel: '中支持',
      badgeStyle: 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]'
    },
    {
      dimension: '业务关系',
      fields: ['person_id'],
      arrowText: '→ 自然人',
      businessMeaning: '存在明确业务参与主体',
      supportLevel: '辅助支持',
      badgeStyle: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
    }
  ];

  const handlePrimaryAction = () => {
    if (selectedDecision === 'create' && onEnterModeling) {
      onEnterModeling();
    } else {
      alert(`决策已更新为：${
        selectedDecision === 'create' ? '创建新对象' :
        selectedDecision === 'map' ? '映射已有对象' :
        selectedDecision === 'ignore' ? '不形成业务对象' : '暂缓决策'
      }`);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* 3-Column Main Body Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* =========================================================
            COLUMN 1: 对象候选队列 (Left Sidebar ~300px)
        ========================================================= */}
        <aside className="w-full lg:w-[300px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#F1F5F9] space-y-2">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              对象候选
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              AI 基于已完成的语义理解结果，发现可能形成独立业务对象的候选。
            </p>

            {/* Statistics Row: 发现 26  待决策 8  已匹配 5  不生成 13 */}
            <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] text-[#475569]">
              <div>
                <span>发现</span> <strong className="text-[#0F172A] ml-0.5">26</strong>
              </div>
              <div className="text-[#E2E8F0]">|</div>
              <div>
                <span>待决策</span> <strong className="text-[#2563EB] ml-0.5">8</strong>
              </div>
              <div className="text-[#E2E8F0]">|</div>
              <div>
                <span>已匹配</span> <strong className="text-[#10B981] ml-0.5">5</strong>
              </div>
              <div className="text-[#E2E8F0]">|</div>
              <div>
                <span>不生成</span> <strong className="text-[#64748B] ml-0.5">13</strong>
              </div>
            </div>

            {/* Sub Tabs: 待决策 | 已匹配 | 不生成 | 全部 */}
            <div className="flex items-center space-x-3 border-b border-[#E2E8F0] pt-1 text-xs">
              <button
                onClick={() => setLeftTab('pending')}
                className={`pb-1.5 font-semibold transition-all border-b-2 cursor-pointer ${
                  leftTab === 'pending'
                    ? 'text-[#2563EB] border-[#2563EB]'
                    : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
                }`}
              >
                待决策
              </button>
              <button
                onClick={() => setLeftTab('matched')}
                className={`pb-1.5 font-semibold transition-all border-b-2 cursor-pointer ${
                  leftTab === 'matched'
                    ? 'text-[#2563EB] border-[#2563EB]'
                    : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
                }`}
              >
                已匹配
              </button>
              <button
                onClick={() => setLeftTab('ignored')}
                className={`pb-1.5 font-semibold transition-all border-b-2 cursor-pointer ${
                  leftTab === 'ignored'
                    ? 'text-[#2563EB] border-[#2563EB]'
                    : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
                }`}
              >
                不生成
              </button>
              <button
                onClick={() => setLeftTab('all')}
                className={`pb-1.5 font-semibold transition-all border-b-2 cursor-pointer ${
                  leftTab === 'all'
                    ? 'text-[#2563EB] border-[#2563EB]'
                    : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
                }`}
              >
                全部
              </button>
            </div>

            {/* Search Input */}
            <div className="relative pt-0.5">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索对象候选..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#1E293B] placeholder-[#94A3B8]"
              />
            </div>
          </div>

          {/* Candidate Card List */}
          <div className="p-3 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {candidates.map((cand) => {
              const isSelected = selectedCandidateId === cand.id;

              return (
                <div
                  key={cand.id}
                  onClick={() => setSelectedCandidateId(cand.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#EFF6FF]/70 border-[#2563EB] shadow-2xs'
                      : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">
                      {cand.name}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        cand.score !== '—' ? 'text-[#10B981]' : 'text-[#94A3B8]'
                      }`}
                    >
                      {cand.score}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-[#64748B] font-mono text-[11px] truncate max-w-[150px]">
                      来源: {cand.sourceAsset}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${cand.statusBadgeStyle}`}
                    >
                      {cand.statusLabel}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>类型: {cand.objectForm}</span>
                    <span
                      className={
                        cand.trustLevel === '高可信'
                          ? 'text-[#10B981] font-medium'
                          : cand.trustLevel === '不建议生成'
                          ? 'text-[#EF4444] font-medium'
                          : 'text-[#64748B] font-medium'
                      }
                    >
                      {cand.trustLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* =========================================================
            COLUMN 2: AI 对象发现分析 (Middle Workspace Flex-1)
            Notice: Restrained, compact, exact 1:1 replica of design screenshot
        ========================================================= */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white">
          {/* Header Title Row */}
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">
                  {currentCandidate.name}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  {currentCandidate.objectForm}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                来源数据资产：<code className="font-mono text-[#334155]">{currentCandidate.sourceAsset}</code>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-[#10B981] bg-[#ECFDF5] px-3 py-1 rounded-full border border-[#A7F3D0]">
                {currentCandidate.trustLevel}  ·  {currentCandidate.score}
              </span>
            </div>
          </div>

          {/* AI 发现结论 - 纯文本展示，不使用卡片 */}
          <div className="space-y-1 text-xs text-[#334155] leading-relaxed pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0F172A]">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span>AI 发现结论：推荐创建业务对象</span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed pl-5.5">
              该数据资产稳定表达了一个独立的“服务工单”业务过程。<br />
              其稳定业务身份、完整生命周期、一致的数据粒度以及明确的业务关系，共同支持形成独立业务对象。
            </p>
          </div>

          {/* 发现依据 Table Section */}
          <div className="space-y-2.5">
            <div>
              <h3 className="text-xs font-bold text-[#0F172A]">发现依据</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                为什么 AI 认为该数据资产代表一个独立业务对象？
              </p>
            </div>

            <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <th className="py-2.5 px-3.5 w-24">判断维度</th>
                    <th className="py-2.5 px-3.5">数据依据</th>
                    <th className="py-2.5 px-3.5">业务意义</th>
                    <th className="py-2.5 px-3.5 w-24 text-center">支持度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[#334155]">
                  {evidenceRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC]/70">
                      <td className="py-2.5 px-3.5 font-bold text-[#0F172A] whitespace-nowrap">
                        {row.dimension}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {row.source && <span className="text-[#334155]">{row.source}</span>}
                        {row.fields && (
                          <div className="flex flex-wrap items-center gap-1 inline-flex">
                            {row.fields.map((f, fi) => (
                              <code
                                key={fi}
                                className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#1E293B] font-mono text-[11px] border border-[#E2E8F0]"
                              >
                                {f}
                              </code>
                            ))}
                            {row.sourceExtra && (
                              <span className="text-[#64748B] ml-1 font-mono text-[11px]">
                                {row.sourceExtra}
                              </span>
                            )}
                            {row.arrowText && (
                              <span className="text-[#2563EB] ml-1 font-semibold">
                                {row.arrowText}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#475569]">
                        {row.businessMeaning}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${row.badgeStyle}`}
                        >
                          {row.supportLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 企业语义资产匹配 Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#0F172A]">企业语义资产匹配</h3>

            <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#0F172A]">服务请求</span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-[#EFF6FF] text-[#2563EB]">
                      相似度: 64%
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    当前候选与“服务请求”存在一定业务相关性，但不足以直接复用。
                  </p>
                  <div className="flex items-center space-x-3 text-[11px] text-[#64748B]">
                    <span>• 业务定义不同</span>
                    <span>• 生命周期不同</span>
                    <span>• 主业务标识不同</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 space-y-1">
                <span className="text-xs font-bold text-[#EA580C]">不足以直接复用</span>
                <button
                  onClick={() => setIsDiffModalOpen(true)}
                  className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-0.5"
                >
                  <span>查看候选差异</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* =========================================================
            COLUMN 3: 对象决策 (Right Sidebar ~340px)
        ========================================================= */}
        <aside className="w-full lg:w-[340px] bg-white border-l border-[#E2E8F0] p-4 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar">
          <div className="space-y-3.5">
            {/* Header */}
            <div className="border-b border-[#F1F5F9] pb-2.5">
              <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                对象决策
              </h2>
              <div className="mt-1 text-xs text-[#64748B] flex items-center justify-between">
                <span>当前候选：<strong className="text-[#0F172A]">{currentCandidate.name}</strong></span>
                <span className="font-mono text-[11px] text-[#94A3B8]">pop_service_hotline</span>
              </div>
            </div>

            {/* AI 推荐 Box (Light Blue) */}
            <div className="p-3 bg-[#F0F5FF] rounded-lg border border-[#D0E1FD] text-xs space-y-2">
              <div className="font-bold text-[#2563EB] flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI 推荐</span>
              </div>
              <div className="font-bold text-[#0F172A]">
                推荐创建新的「服务工单」业务对象
              </div>
              <ul className="text-[11px] text-[#334155] space-y-1 pl-0.5">
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                  <span>有稳定业务身份</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                  <span>存在完整生命周期</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                  <span>数据粒度稳定</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                  <span>存在核心业务关系</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                  <span>无可直接复用的正式对象</span>
                </li>
              </ul>
            </div>

            {/* 你的决策 Radio Group */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#0F172A]">你的决策</div>

              {/* Option 1: 创建新对象 */}
              <div
                onClick={() => setSelectedDecision('create')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectedDecision === 'create'
                    ? 'bg-[#EFF6FF] border-[#2563EB] shadow-2xs'
                    : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedDecision === 'create'
                        ? 'border-[#2563EB] bg-[#2563EB]'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {selectedDecision === 'create' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">创建新对象</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5 leading-normal">
                      基于当前语义理解结果创建业务对象草稿。
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: 映射已有对象 */}
              <div
                onClick={() => setSelectedDecision('map')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectedDecision === 'map'
                    ? 'bg-[#EFF6FF] border-[#2563EB] shadow-2xs'
                    : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedDecision === 'map'
                        ? 'border-[#2563EB] bg-[#2563EB]'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {selectedDecision === 'map' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">映射已有对象</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5 leading-normal">
                      将当前数据作为已有业务对象的数据来源。
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 3: 不形成业务对象 */}
              <div
                onClick={() => setSelectedDecision('ignore')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectedDecision === 'ignore'
                    ? 'bg-[#EFF6FF] border-[#2563EB] shadow-2xs'
                    : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedDecision === 'ignore'
                        ? 'border-[#2563EB] bg-[#2563EB]'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {selectedDecision === 'ignore' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">不形成业务对象</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5 leading-normal">
                      继续作为数据资产管理，不建立独立业务实体。
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 4: 暂缓决策 */}
              <div
                onClick={() => setSelectedDecision('manual')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectedDecision === 'manual'
                    ? 'bg-[#EFF6FF] border-[#2563EB] shadow-2xs'
                    : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedDecision === 'manual'
                        ? 'border-[#2563EB] bg-[#2563EB]'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {selectedDecision === 'manual' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">暂缓决策</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5 leading-normal">
                      暂不确认，等待补充更多业务信息。
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 当前理由 Box */}
            <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
              <div className="text-xs font-bold text-[#0F172A]">当前理由</div>
              <p className="text-[11px] text-[#475569] leading-relaxed">
                该候选具有明确业务标识和稳定粒度，且现有正式对象中未发现可直接复用的对象，建议进入对象建模。
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2 border-t border-[#F1F5F9] mt-3">
            <button
              onClick={handlePrimaryAction}
              className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span>进入对象建模</span>
            </button>

            <button
              onClick={() => alert('决策已保存为草稿')}
              className="w-full py-2 px-4 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            >
              <span>保存决策</span>
            </button>

            <div className="text-center pt-0.5">
              <button
                onClick={() => {
                  const nextCand = candidates.find((c) => c.id !== selectedCandidateId);
                  if (nextCand) setSelectedCandidateId(nextCand.id);
                }}
                className="text-[11px] text-[#2563EB] hover:underline transition-colors cursor-pointer font-medium"
              >
                处理下一个候选 -&gt;
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================================================
          BOTTOM DOCK BAR: 进入对象建模后 预览条
      ========================================================= */}
      <div className="h-12 bg-[#EFF6FF]/60 border-t border-[#E2E8F0] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-5 h-5 rounded bg-[#2563EB] text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
            🔀
          </div>
          <span className="font-bold text-[#2563EB]">进入对象建模后</span>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[#475569]">预计生成：<strong className="text-[#0F172A]">服务工单</strong></span>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[#475569]">核心属性：<strong className="text-[#2563EB]">6</strong></span>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[#475569]">关系候选：<strong className="text-[#0F172A]">申请人 → 自然人</strong></span>
        </div>

        {/* Right Action Link */}
        <button
          onClick={onEnterModeling}
          className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer flex items-center space-x-1"
        >
          <span>查看预览</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
        </button>
      </div>

      {/* Diff Modal */}
      <AnimatePresence>
        {isDiffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDiffModalOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-xl bg-white rounded-xl border border-[#E2E8F0] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                  <GitCompare className="w-4 h-4 text-[#2563EB]" />
                  <span>对象候选差异对比</span>
                </h3>
                <button
                  onClick={() => setIsDiffModalOpen(false)}
                  className="text-[#94A3B8] hover:text-[#475569] text-xs font-bold cursor-pointer"
                >
                  关闭
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
                  <div className="font-bold text-[#2563EB]">候选：服务工单</div>
                  <ul className="text-[11px] text-[#334155] space-y-1">
                    <li>• 标识：ticket_id</li>
                    <li>• 粒度：单次服务响应过程</li>
                    <li>• 生命周期：提交→响应→办结</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                  <div className="font-bold text-[#334155]">已有：服务请求</div>
                  <ul className="text-[11px] text-[#334155] space-y-1">
                    <li>• 标识：req_code</li>
                    <li>• 粒度：事项申请需求总揽</li>
                    <li>• 生命周期：受理→流转</li>
                  </ul>
                </div>
              </div>

              <div className="text-xs text-[#EA580C] leading-relaxed py-1">
                <span className="font-bold">AI 结论：</span>两者的主业务标识与过程粒度不重叠，相似度 64% 处于低复用区间，建议创建独立业务对象。
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsDiffModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
