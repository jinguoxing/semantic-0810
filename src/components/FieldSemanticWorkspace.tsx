import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileText,
  Clock,
  Database,
  Tag,
  HelpCircle,
  Sliders,
  Table,
  Zap,
  AlertTriangle,
  RefreshCw,
  Edit3,
  BookOpen,
  Info
} from 'lucide-react';

interface FieldSemanticWorkspaceProps {
  onNavigateToTableWorkspace?: () => void;
  onNavigateToAssetDetail?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const FieldSemanticWorkspace: React.FC<FieldSemanticWorkspaceProps> = ({
  onNavigateToTableWorkspace,
  onNavigateToAssetDetail,
  addToast,
}) => {
  // Perspective Tab: 'table' vs 'field'
  const [activePerspective, setActivePerspective] = useState<'table' | 'field'>('field');

  // Left Navigator Filter: 'all' | 'pending' | 'resolved' | 'technical'
  const [navFilter, setNavFilter] = useState<'all' | 'pending' | 'resolved' | 'technical'>('all');
  const [searchFieldQuery, setSearchFieldQuery] = useState('');

  // Currently Selected Field ID
  const [selectedFieldId, setSelectedFieldId] = useState<string>('close_time');

  // Selected Candidate Option inside Decision
  const [selectedOption, setSelectedOption] = useState<'banjie' | 'guanbi' | 'custom'>('banjie');
  const [customInputValue, setCustomInputValue] = useState('');

  // Decision State: Has the user adopted the recommendation?
  const [isAdopted, setIsAdopted] = useState(false);

  // Field Data List
  const fieldsList = [
    {
      id: 'ticket_id',
      techName: 'ticket_id',
      type: 'VARCHAR',
      businessName: '工单编号',
      status: 'resolved',
      statusText: '无需处理',
      isPending: false,
    },
    {
      id: 'status',
      techName: 'status',
      type: 'VARCHAR',
      businessName: '处理状态',
      status: 'resolved',
      statusText: '无需处理',
      isPending: false,
    },
    {
      id: 'created_time',
      techName: 'created_time',
      type: 'DATETIME',
      businessName: '创建时间',
      status: 'resolved',
      statusText: '无需处理',
      isPending: false,
    },
    {
      id: 'close_time',
      techName: 'close_time',
      type: 'DATETIME',
      businessName: '办结时间？',
      status: 'pending',
      statusText: '需要处理',
      isPending: true,
    },
    {
      id: 'work_duration',
      techName: 'work_duration',
      type: 'INT',
      businessName: '工单处理时长？',
      status: 'pending',
      statusText: '需要处理',
      isPending: true,
    },
    {
      id: 'person_id',
      techName: 'person_id',
      type: 'VARCHAR',
      businessName: '申请人标识',
      status: 'resolved',
      statusText: '无需处理',
      isPending: false,
    },
    {
      id: 'ext_flag_3',
      techName: 'ext_flag_3',
      type: 'VARCHAR',
      businessName: '待确定含义？',
      status: 'pending',
      statusText: '证据不足',
      isPending: true,
    },
    {
      id: 'etl_batch_id',
      techName: 'etl_batch_id',
      type: 'BIGINT',
      businessName: '技术字段',
      status: 'technical',
      statusText: 'Technical Only',
      isPending: false,
    },
  ];

  // Filtered fields calculation
  const filteredFields = fieldsList.filter((f) => {
    if (navFilter === 'pending' && !f.isPending) return false;
    if (navFilter === 'resolved' && f.status !== 'resolved') return false;
    if (navFilter === 'technical' && f.status !== 'technical') return false;

    if (searchFieldQuery.trim()) {
      const q = searchFieldQuery.toLowerCase().trim();
      return (
        f.techName.toLowerCase().includes(q) ||
        f.businessName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action: Adopt "办结时间"
  const handleAdopt = () => {
    setIsAdopted(true);
    if (addToast) {
      addToast(
        'success',
        '决策已采纳',
        '已将 close_time 正式确认为“办结时间”，并同步更新 4 项关联语义'
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans overflow-hidden select-none">
      {/* 1. ASSET HEADER */}
      <div className="bg-white border-b border-[#E2E8F0] px-8 py-4 shrink-0 shadow-2xs">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-xs text-[#64748B]">
              <span>数据治理</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-semibold text-[#0F172A]">数据语义</span>
            </div>

            {/* Title & Technical Name */}
            <div className="flex items-center space-x-3 pt-0.5">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center space-x-2">
                <span>公共服务热线工单记录表</span>
              </h1>
              <span className="font-mono text-xs bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded border border-[#E2E8F0] font-medium">
                hotline_db.service.pop_service_hotline
              </span>

              {/* Badges */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  Table
                </span>
                <span className="text-[11px] font-medium text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  公共服务
                </span>
                <span className="text-[11px] font-medium text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  公共服务热线库
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 text-xs text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
              <Check className="w-3.5 h-3.5" />
              <span className="font-medium text-[#047857]">已自动保存</span>
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

        {/* 2. PERSPECTIVE TABS (Non-Stepper) */}
        <div className="mt-4 border-t border-[#F1F5F9] pt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActivePerspective('table');
                if (onNavigateToTableWorkspace) onNavigateToTableWorkspace();
              }}
              className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
            >
              <Table className="w-3.5 h-3.5" />
              <span>表语义</span>
            </button>

            <button
              onClick={() => setActivePerspective('field')}
              className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 bg-[#2563EB] text-white shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>字段语义</span>
            </button>
          </div>

          <div className="text-[11px] text-[#64748B] flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>AI Field Semantic Decision Workspace · Semovix Xino</span>
          </div>
        </div>
      </div>

      {/* 3. THREE-COLUMN MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Field Navigator (~20% Width)                 */}
        {/* ========================================================= */}
        <div className="w-[320px] shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col h-full overflow-hidden">
          {/* Navigator Header */}
          <div className="p-4 border-b border-[#E2E8F0] space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-[#0F172A] tracking-tight">字段 · 36</h2>
              <span className="text-[11px] font-mono text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                Work Queue
              </span>
            </div>

            {/* Field Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                value={searchFieldQuery}
                onChange={(e) => setSearchFieldQuery(e.target.value)}
                placeholder="搜索字段…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#0F172A] placeholder-[#94A3B8]"
              />
            </div>

            {/* Filter Pills (Work Queue View) */}
            <div className="flex items-center space-x-1 text-[11px] font-medium pt-1">
              {[
                { id: 'all', label: '全部 36' },
                { id: 'pending', label: '需要处理 2', alert: true },
                { id: 'resolved', label: '无需处理 33' },
                { id: 'technical', label: '技术字段 1' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setNavFilter(tab.id as any)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    navFilter === tab.id
                      ? 'bg-[#2563EB] text-white font-bold'
                      : tab.alert
                      ? 'bg-[#FEF2F2] text-[#DC2626] font-semibold hover:bg-[#FEE2E2]'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fields List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
            {filteredFields.map((f) => {
              const isSelected = selectedFieldId === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => {
                    setSelectedFieldId(f.id);
                    if (f.id === 'close_time') setIsAdopted(false);
                  }}
                  className={`p-3.5 transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#EFF6FF] border-l-4 border-l-[#2563EB] pl-2.5'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[#0F172A]">
                        {f.techName}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        {f.type}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[#334155]">
                      {f.businessName}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {f.isPending ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                        {f.statusText}
                      </span>
                    ) : f.status === 'technical' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#64748B] bg-[#F1F5F9]">
                        {f.statusText}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium text-[#059669] bg-[#ECFDF5]">
                        {f.statusText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MIDDLE COLUMN: Semantic Decision Workspace (~52% Width)    */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]">
          {selectedFieldId === 'close_time' ? (
            <>
              {/* Top Tech Fact Bar */}
              <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] font-mono font-bold text-xs">
                    T
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold font-mono text-[#0F172A]">
                        close_time
                      </h2>
                      <span className="text-xs font-mono text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                        DATETIME · Nullable
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      所属资产：公共服务热线工单记录表 · Current Technical Fact
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-[#D97706] bg-[#FFFBEB] px-2.5 py-1 rounded-full border border-[#FDE68A] flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>1 项关键业务含义待确认</span>
                  </span>
                </div>
              </div>

              {/* SECTION 1: AI 当前建议 (AI Candidate) */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                    <h2 className="text-sm font-bold text-[#0F172A]">AI 当前建议</h2>
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    基于知识图谱、术语库与上下文自动提炼 Candidate
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI Recommended Name */}
                  <div className="p-3.5 bg-[#EEF2FF]/60 border border-[#C7D2FE] rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#4338CA] font-medium">AI 推荐业务名称</span>
                      <span className="text-[10px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#C7D2FE]">
                        {isAdopted ? '已确认' : 'AI推荐'}
                      </span>
                    </div>
                    <div className="text-base font-bold text-[#1E1B4B]">
                      办结时间
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      服务工单完成办理并进入办结状态时对应的业务时间。
                    </p>
                  </div>

                  {/* Candidate Time Semantics */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B] font-medium">建议时间语义</span>
                      <span className="text-[10px] font-medium text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded">
                        {isAdopted ? '已生效' : '候选'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#0F172A] font-mono">
                      EVENT · 服务工单办结
                    </div>
                    <p className="text-xs text-[#64748B]">
                      作为工单业务生命周期中的核心状态变更时间节点
                    </p>
                  </div>

                  {/* Candidate Business Term */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B] font-medium">候选业务术语</span>
                      <span className="text-[10px] text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded">
                        候选匹配
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#0F172A]">
                      办结时间 (Hotline_Close_Time)
                    </div>
                  </div>

                  {/* Candidate Data Element */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B] font-medium">候选标准数据元</span>
                      <span className="text-[10px] text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded">
                        候选匹配
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#0F172A]">
                      办结时间标准数据元
                    </div>
                    <p className="text-[10px] text-[#64748B]">
                      字段类型、业务域与当前表级上下文与该标准数据元一致。
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: 需要你决定 (Pending Decision - Visual Focus Area) */}
              <div className="bg-white border-2 border-[#2563EB] rounded-xl p-5 space-y-5 shadow-md">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-[#2563EB]" />
                    <h2 className="text-base font-bold text-[#0F172A]">需要你决定</h2>
                  </div>
                  <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#BFDBFE]">
                    Pending Decision 01
                  </span>
                </div>

                <p className="text-xs text-[#334155] leading-relaxed">
                  技术字段名 <code className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A]">close_time</code> 对“关闭时间”有一定支持，但结合当前表的业务过程、企业术语和状态值语义，AI 更推荐理解为“办结时间”。请确认最准确的业务含义。
                </p>

                {/* Candidate Decision Cards */}
                <div className="space-y-3">
                  {/* Candidate 1: 办结时间 */}
                  <div
                    onClick={() => setSelectedOption('banjie')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2.5 ${
                      selectedOption === 'banjie'
                        ? 'bg-[#EFF6FF]/80 border-[#2563EB] ring-1 ring-[#2563EB]'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="radio"
                          name="field_meaning"
                          checked={selectedOption === 'banjie'}
                          onChange={() => setSelectedOption('banjie')}
                          className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                        />
                        <span className="font-bold text-sm text-[#0F172A]">
                          办结时间
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                        推荐
                      </span>
                    </div>

                    <p className="text-xs text-[#475569] pl-6">
                      定义：服务工单完成办理并进入办结状态时对应的业务时间。
                    </p>

                    <div className="pl-6 pt-1">
                      <div className="text-[11px] font-bold text-[#334155] mb-1">推荐依据摘要：</div>
                      <ul className="text-[11px] text-[#64748B] space-y-0.5 list-disc pl-4 font-medium">
                        <li>当前表主要记录主体为“服务工单”</li>
                        <li><code className="font-mono text-[#0F172A]">status</code> 存在“已办结”业务状态 (04 → 已办结)</li>
                        <li>存在候选企业术语“办结时间”</li>
                        <li><code className="font-mono text-[#0F172A]">created_time → accept_time → close_time</code> 与主要业务过程一致</li>
                      </ul>
                    </div>
                  </div>

                  {/* Candidate 2: 关闭时间 */}
                  <div
                    onClick={() => setSelectedOption('guanbi')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      selectedOption === 'guanbi'
                        ? 'bg-[#EFF6FF]/80 border-[#2563EB] ring-1 ring-[#2563EB]'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="radio"
                          name="field_meaning"
                          checked={selectedOption === 'guanbi'}
                          onChange={() => setSelectedOption('guanbi')}
                          className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                        />
                        <span className="font-bold text-sm text-[#0F172A]">
                          关闭时间
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#475569] pl-6">
                      定义：技术系统将当前记录关闭时对应的时间。
                    </p>

                    <div className="pl-6 pt-1">
                      <div className="text-[11px] font-semibold text-[#475569] mb-1">支持依据摘要：</div>
                      <ul className="text-[11px] text-[#64748B] space-y-0.5 list-disc pl-4">
                        <li><code className="font-mono text-[#0F172A]">close_time</code> 技术命名提供一定支持</li>
                        <li>未发现明确“系统关闭”业务事件</li>
                        <li>与当前工单业务生命周期的匹配弱于“办结时间”</li>
                      </ul>
                    </div>
                  </div>

                  {/* Candidate 3: 其他理解 */}
                  <div
                    onClick={() => setSelectedOption('custom')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      selectedOption === 'custom'
                        ? 'bg-[#EFF6FF]/80 border-[#2563EB] ring-1 ring-[#2563EB]'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="field_meaning"
                        checked={selectedOption === 'custom'}
                        onChange={() => setSelectedOption('custom')}
                        className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                      />
                      <span className="font-bold text-sm text-[#0F172A]">
                        其他理解
                      </span>
                      <span className="text-xs text-[#64748B]">
                        (当前候选均不准确)
                      </span>
                    </div>

                    {selectedOption === 'custom' && (
                      <div className="pl-6 pt-2 space-y-2">
                        <label className="block text-xs font-bold text-[#0F172A]">
                          输入更准确的业务含义：
                        </label>
                        <input
                          type="text"
                          value={customInputValue}
                          onChange={(e) => setCustomInputValue(e.target.value)}
                          placeholder="例如：工单终结时间 / 归档时间…"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Impact Banner */}
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-[#334155]">
                    <Zap className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-medium">
                      {isAdopted ? (
                        <span className="text-[#059669] font-bold">✓ 已应用到 4 项相关语义</span>
                      ) : (
                        <span>采用后将同步更新 <strong>4 项相关语义</strong> (业务名称、定义、时间语义、术语映射)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Decision Action Area */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleAdopt}
                      className={`px-5 py-2.5 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center space-x-2 ${
                        isAdopted
                          ? 'bg-[#059669] hover:bg-[#047857] text-white'
                          : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isAdopted ? '已采纳“办结时间”' : '采用“办结时间”'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (addToast) addToast('info', '修改理解', '开启自定义字段语义编辑模式');
                      }}
                      className="px-4 py-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      修改理解
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (addToast) addToast('info', '完整依据', '定位至右侧 6 层权威与数据证据面板');
                    }}
                    className="text-xs text-[#2563EB] font-bold hover:underline cursor-pointer"
                  >
                    查看完整依据 →
                  </button>
                </div>
              </div>

              {/* SECTION 3: Bottom Next Field Prompt */}
              <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-[#0F172A]">还有 1 个字段需要处理:</span>
                  <span className="font-mono text-[#2563EB] font-bold">work_duration</span>
                  <span className="text-[#64748B]">(工单处理时长？)</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedFieldId('work_duration');
                    if (addToast) addToast('info', '跳转字段', '已跳转至 work_duration 字段语义判断');
                  }}
                  className="px-3.5 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <span>跳转到该字段</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : selectedFieldId === 'etl_batch_id' ? (
            /* TECHNICAL FIELD SCENARIO */
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5 shadow-2xs">
              <div className="flex items-center space-x-3 border-b border-[#F1F5F9] pb-4">
                <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#64748B] font-mono font-bold text-sm">
                  ETL
                </div>
                <div>
                  <h2 className="text-lg font-bold font-mono text-[#0F172A]">etl_batch_id</h2>
                  <p className="text-xs text-[#64748B]">BIGINT · Technical Field</p>
                </div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                <h3 className="font-bold text-sm text-[#0F172A]">AI 判断：技术字段</h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  该字段主要用于 ETL 批次管理，不属于当前业务语义治理范围。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[#334155]">判别依据：</h4>
                <ul className="text-xs text-[#64748B] space-y-1 list-disc pl-5">
                  <li>字段名称符合技术批次模式 (<code className="font-mono">etl_batch_*</code>)</li>
                  <li>数据源于 ETL 处理管道</li>
                  <li>多张底层管道表存在相同技术字段</li>
                  <li>未发现业务术语或业务消费证据</li>
                </ul>
              </div>

              <div className="pt-3 flex space-x-3">
                <button
                  onClick={() => {
                    if (addToast) addToast('success', '已确认', '已保持 etl_batch_id 为技术字段');
                  }}
                  className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  保持技术字段
                </button>
                <button
                  onClick={() => {
                    if (addToast) addToast('info', '切换模式', '已将该字段纳入业务语义治理范围');
                  }}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] font-semibold rounded-lg text-xs cursor-pointer"
                >
                  纳入语义治理
                </button>
              </div>
            </div>
          ) : (
            /* UNRESOLVED / EVIDENCE INSUFFICIENT SCENARIO */
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5 shadow-2xs">
              <div className="flex items-center space-x-3 border-b border-[#F1F5F9] pb-4">
                <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706] font-mono font-bold text-sm">
                  ?
                </div>
                <div>
                  <h2 className="text-lg font-bold font-mono text-[#0F172A]">ext_flag_3</h2>
                  <p className="text-xs text-[#64748B]">VARCHAR · Nullable</p>
                </div>
              </div>

              <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg space-y-2">
                <h3 className="font-bold text-sm text-[#B45309]">当前证据不足 · 暂不推断</h3>
                <p className="text-xs text-[#92400E] leading-relaxed">
                  AI 暂时无法可靠确定该字段的业务含义，需要人工补充业务背景或技术注释。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[#334155]">已检查证据：</h4>
                <ul className="text-xs text-[#64748B] space-y-1 list-disc pl-5">
                  <li>字段注释：无</li>
                  <li>企业标准：无匹配项</li>
                  <li>业务术语：无匹配项</li>
                  <li>已验证查询：无频繁关联 pattern</li>
                  <li>数据画像：仅发现有限值域 [0, 1, 9]，无法确定值含义</li>
                </ul>
              </div>

              <div className="pt-3 flex space-x-3">
                <button
                  onClick={() => {
                    if (addToast) addToast('info', '暂不处理', '已跳过该字段');
                  }}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] font-semibold rounded-lg text-xs cursor-pointer"
                >
                  暂不处理
                </button>
                <button
                  onClick={() => {
                    if (addToast) addToast('info', '补充说明', '打开业务说明补充弹窗');
                  }}
                  className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  补充业务说明
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Evidence Panel (~28% Width)                  */}
        {/* ========================================================= */}
        <div className="w-[360px] shrink-0 bg-white border-l border-[#E2E8F0] flex flex-col h-full overflow-y-auto p-5 space-y-5">
          {/* Header */}
          <div className="border-b border-[#E2E8F0] pb-3 space-y-1">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#2563EB]" />
              <h2 className="font-bold text-sm text-[#0F172A]">理解依据</h2>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-[#64748B]">
              <span>当前字段:</span>
              <strong className="font-mono text-[#0F172A]">{selectedFieldId}</strong>
              <span>·</span>
              <span>当前决策: 字段业务含义</span>
            </div>
          </div>

          {/* LAYER 1: 权威依据 (Authority Evidence) */}
          <div className="space-y-2.5">
            <div className="font-bold text-[#0F172A] text-xs border-b border-[#F1F5F9] pb-1.5 flex items-center justify-between">
              <span>1. 权威依据 (Authority)</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2.5 text-[11px]">
              <div>
                <div className="text-[#64748B] font-medium">企业标准:</div>
                <div className="font-bold text-[#0F172A] mt-0.5">
                  候选标准数据元：办结时间
                </div>
                <div className="text-[10px] text-[#94A3B8]">
                  类型与业务上下文匹配，尚未正式关联。
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0]">
                <div className="text-[#64748B] font-medium">业务术语:</div>
                <div className="font-bold text-[#0F172A] mt-0.5">
                  候选业务术语：办结时间
                </div>
                <div className="text-[10px] text-[#94A3B8]">
                  当前表语义和生命周期证据支持该候选。
                </div>
              </div>
            </div>
          </div>

          {/* LAYER 2: 已治理上下文 (Governed Context) */}
          <div className="space-y-2.5">
            <div className="font-bold text-[#0F172A] text-xs border-b border-[#F1F5F9] pb-1.5 flex items-center justify-between">
              <span>2. 已治理上下文 (Governed Context)</span>
              <FileText className="w-3.5 h-3.5 text-[#059669]" />
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">表级主要记录主体:</span>
                <span className="font-bold text-[#0F172A]">服务工单</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Record Grain:</span>
                <span className="font-semibold text-[#0F172A]">一行代表一张服务工单</span>
              </div>
            </div>
          </div>

          {/* LAYER 3: 数据证据 (Data Profile Evidence) */}
          <div className="space-y-2.5">
            <div className="font-bold text-[#0F172A] text-xs border-b border-[#F1F5F9] pb-1.5 flex items-center justify-between">
              <span>3. 数据证据 (Data Profile)</span>
              <Database className="w-3.5 h-3.5 text-[#64748B]" />
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Technical Metadata:</span>
                <span className="font-mono text-[#0F172A]">close_time · DATETIME</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Null Rate:</span>
                <span className="font-mono font-bold text-[#0F172A]">1.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Distribution:</span>
                <span className="font-medium text-[#059669]">有效 DATETIME 分布稳定</span>
              </div>
            </div>
          </div>

          {/* LAYER 4: 相关字段 (Related Fields) */}
          <div className="space-y-2.5">
            <div className="font-bold text-[#0F172A] text-xs border-b border-[#F1F5F9] pb-1.5 flex items-center justify-between">
              <span>4. 相关字段 (Lifecycle Sequence)</span>
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[#0F172A]">created_time</span>
                <span className="text-[#64748B]">创建时间</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[#0F172A]">accept_time</span>
                <span className="text-[#64748B]">受理时间</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[#0F172A]">status</span>
                <span className="text-[#64748B]">处理状态</span>
              </div>
            </div>
          </div>

          {/* LAYER 5: 业务状态证据 (Value Evidence with Explicit Source) */}
          <div className="space-y-2.5">
            <div className="font-bold text-[#0F172A] text-xs border-b border-[#F1F5F9] pb-1.5 flex items-center justify-between">
              <span>5. 业务状态证据 (Value Semantics)</span>
              <Tag className="w-3.5 h-3.5 text-[#D97706]" />
            </div>

            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3.5 space-y-1.5 text-[11px]">
              <div className="font-mono font-bold text-[#92400E]">
                status = 04 → 已办结
              </div>
              <div className="text-[10px] font-medium text-[#B45309] border-t border-[#FDE68A] pt-1">
                来源：工单状态代码集 · 已确认值语义
              </div>
            </div>
          </div>

          {/* LAYER 6: AI 推断说明 (Muted at bottom) */}
          <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-1 text-[11px]">
            <div className="font-bold text-[#475569] flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>AI 推断说明</span>
            </div>
            <p className="text-[#64748B] text-[10px] leading-relaxed">
              当前生命周期结构、业务状态和值语义整体更支持“办结时间”，而不是单纯技术系统“关闭时间”。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
