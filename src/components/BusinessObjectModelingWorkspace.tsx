import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Edit3,
  Layers,
  Key,
  List,
  GitFork,
  Database,
  Bot,
  Info,
  Check,
  Plus,
  ExternalLink,
  ShieldCheck,
  FileText,
  UserCheck,
  Tag,
  Clock,
  MapPin,
  FileCheck,
  ArrowRight,
  X,
  XCircle,
  Search,
  Filter,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

interface BusinessObjectModelingWorkspaceProps {
  onBackToDiscovery: () => void;
  onProceedToAssets: () => void;
  onViewDiscoveryEvidence?: () => void;
}

export const BusinessObjectModelingWorkspace: React.FC<BusinessObjectModelingWorkspaceProps> = ({
  onBackToDiscovery,
  onProceedToAssets,
  onViewDiscoveryEvidence
}) => {
  // View mode switcher: 'business' | 'data'
  const [activePerspective, setActivePerspective] = useState<'business' | 'data'>('business');
  
  // Data perspective inner sub-tab: 'attribute' | 'relation'
  const [dataSubTab, setDataSubTab] = useState<'attribute' | 'relation'>('attribute');
  const [attributeSearchTerm, setAttributeSearchTerm] = useState('');
  const [attributeFilterStatus, setAttributeFilterStatus] = useState<string>('all');
  const [relationFilterStatus, setRelationFilterStatus] = useState<string>('all');

  // Field Evidence Detail Modal state
  const [fieldEvidenceDetail, setFieldEvidenceDetail] = useState<{
    fieldName: string;
    sourceField: string;
    semantics: string;
    nullRate: string;
    uniqueRate: string;
    identityType: string;
    conclusion: string;
  } | null>(null);

  // Right sidebar tab: 'draft' | 'check'
  const [activeRightTab, setActiveRightTab] = useState<'draft' | 'check'>('check');

  // Active section anchor state
  const [activeAnchor, setActiveAnchor] = useState<string>('definition');

  // Modal / Drawer states
  const [isEditDefinitionOpen, setIsEditDefinitionOpen] = useState(false);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [isAddRelationOpen, setIsAddRelationOpen] = useState(false);

  // Editable definition state
  const [objectDefinition, setObjectDefinition] = useState(
    '表示群众通过公共服务热线发起，并经历受理、处理、办结等过程的服务工单业务实体。'
  );
  const [businessDomain, setBusinessDomain] = useState('公共服务');
  const [themeGroup, setThemeGroup] = useState('群众诉求');

  // Business relations state
  const [relations, setRelations] = useState([
    {
      id: 'rel-1',
      predicate: '申请人',
      target: '自然人',
      semantics: '服务工单由自然人发起',
      status: 'pending', // 'confirmed' | 'pending' | 'candidate'
      type: '1:N'
    },
    {
      id: 'rel-2',
      predicate: '受理区域',
      target: '行政区域',
      semantics: '服务工单由某行政区域受理',
      status: 'pending',
      type: 'N:1'
    },
    {
      id: 'rel-3',
      predicate: '关联服务事项',
      target: '服务事项',
      semantics: '服务工单关联某项公共服务事项',
      status: 'candidate',
      type: 'N:1'
    }
  ]);

  const handleConfirmRelation = (relId: string) => {
    setRelations(prev =>
      prev.map(r => (r.id === relId ? { ...r, status: 'confirmed' } : r))
    );
  };

  const scrollToAnchor = (id: string) => {
    setActiveAnchor(id);
    if (id === 'datamapping') {
      setActivePerspective('data');
    } else if (['definition', 'identity', 'attributes', 'relations'].includes(id)) {
      setActivePerspective('business');
    }
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden text-[#1E293B]">
      {/* ==============================================
          Main 3-Column Content Body
      ============================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ----------------------------------------------
            Left Column (260px): 对象上下文 (Object Context)
        ---------------------------------------------- */}
        <aside className="w-64 border-r border-[#E2E8F0] bg-white flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="p-4 border-b border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#1E293B] tracking-tight flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-[#4F46E5]" />
                <span>对象上下文</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#059669] border border-emerald-200">
                建模中
              </span>
            </div>

            {/* Compact Summary Cards */}
            <div className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">对象名称</span>
                <span className="font-bold text-[#1E293B]">服务工单</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#94A3B8]">英文名称</span>
                <span className="text-[#475569]">Service Ticket</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">对象类型</span>
                <span className="text-[#475569] font-medium">业务过程对象</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">来源资产</span>
                <span className="font-mono text-[#4F46E5] font-semibold text-[11px]">
                  pop_service_hotline
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">发现决策</span>
                <span className="text-[11px] font-bold text-[#4F46E5] bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                  创建新对象
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">可信等级</span>
                <span className="text-[11px] font-bold text-[#059669] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 flex items-center space-x-0.5">
                  <ShieldCheck className="w-3 h-3 text-[#059669]" />
                  <span>高可信</span>
                </span>
              </div>
            </div>
          </div>

          {/* Anchor Navigation */}
          <div className="p-3 border-b border-[#E2E8F0] space-y-1">
            <div className="text-[11px] font-bold text-[#94A3B8] px-2 py-1 uppercase tracking-wider">
              对象结构目录
            </div>
            <nav className="space-y-0.5 text-xs font-medium">
              {[
                { id: 'definition', label: '对象定义', icon: FileText },
                { id: 'identity', label: '对象身份', icon: Key },
                { id: 'attributes', label: '核心属性', icon: List },
                { id: 'relations', label: '业务关系', icon: GitFork },
                { id: 'datamapping', label: '数据映射', icon: Database },
                { id: 'preview', label: '消费预览', icon: Bot }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeAnchor === item.id || (item.id === 'datamapping' && activePerspective === 'data');
                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      onClick={() => {
                        if (item.id === 'datamapping') {
                          setActivePerspective('data');
                          scrollToAnchor('datamapping');
                        } else {
                          scrollToAnchor(item.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-indigo-50 text-[#4F46E5] font-bold border border-indigo-100/80 shadow-2xs'
                          : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#4F46E5]" />}
                    </button>

                    {/* Expandable Sub-Navigation under 数据映射 */}
                    {item.id === 'datamapping' && (isActive || activePerspective === 'data') && (
                      <div className="pl-7 pr-2 py-1 space-y-1 text-[11px] border-l-2 border-indigo-200 ml-4 my-1">
                        <button
                          onClick={() => {
                            setActivePerspective('data');
                            setDataSubTab('attribute');
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded transition-all cursor-pointer text-left ${
                            dataSubTab === 'attribute'
                              ? 'bg-indigo-100/70 text-[#4F46E5] font-bold'
                              : 'text-[#64748B] hover:text-[#1E293B]'
                          }`}
                        >
                          <span>属性映射</span>
                        </button>
                        <button
                          onClick={() => {
                            setActivePerspective('data');
                            setDataSubTab('relation');
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded transition-all cursor-pointer text-left ${
                            dataSubTab === 'relation'
                              ? 'bg-amber-100/80 text-[#D97706] font-bold'
                              : 'text-[#64748B] hover:text-[#1E293B]'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <span>关系映射</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                          </div>
                          <span className="text-[9px] px-1 bg-amber-200/60 rounded text-[#D97706] font-mono">2</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Source Summary */}
          <div className="p-4 space-y-2 mt-auto bg-[#F8FAFC]/50 border-t border-[#E2E8F0]">
            <div className="text-[11px] font-bold text-[#1E293B] flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>来源摘要</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-[#64748B]">
                <span>已确认语义字段</span>
                <span className="font-mono font-bold text-[#059669]">17 / 17</span>
              </div>
              <div className="border-t border-[#E2E8F0] pt-2">
                <span className="text-[#94A3B8] block mb-1">核心语义分布:</span>
                <div className="flex flex-wrap gap-1">
                  {['工单编号', '处理状态', '创建时间', '办结时间', '处理时长', '申请人'].map((s, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-slate-100 text-[#475569] rounded text-[10px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ----------------------------------------------
            Center Column (1000px): Business Perspective Workspace (Absolute Visual Center)
        ---------------------------------------------- */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#F8FAFC]/50 max-w-[1050px] mx-auto">
          {/* Top Perspective Switcher Header */}
          <div className="flex flex-wrap items-center justify-between bg-white p-3.5 rounded-lg border border-[#E2E8F0] shadow-2xs gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-[#1E293B] tracking-tight">
                  服务工单
                </h1>
                <span className="text-xs font-mono font-bold text-[#94A3B8]">
                  Service Ticket
                </span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                业务过程对象
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Switcher Tabs */}
              <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0] text-xs font-semibold">
                <button
                  onClick={() => setActivePerspective('business')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activePerspective === 'business'
                      ? 'bg-white text-[#4F46E5] font-bold shadow-2xs border border-[#E2E8F0]'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>业务视角</span>
                </button>
                <button
                  onClick={() => setActivePerspective('data')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activePerspective === 'data'
                      ? 'bg-white text-[#4F46E5] font-bold shadow-2xs border border-[#E2E8F0]'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>数据视角</span>
                </button>
              </div>

              {/* Discovery Evidence Modal Trigger */}
              <button
                onClick={() => setIsEvidenceDrawerOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#475569] text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>查看发现依据</span>
              </button>

              <button
                onClick={onBackToDiscovery}
                className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#475569] text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" />
                <span>返回对象发现</span>
              </button>
            </div>
          </div>

          {/* Second-Level Sub-Tabs: Strictly appears ONLY under 数据视角 */}
          {activePerspective === 'data' && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1E293B]">
                  <Database className="w-4 h-4 text-[#4F46E5]" />
                  <span>数据视角映射类型：</span>
                </div>
                <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg text-xs font-semibold border border-[#E2E8F0]">
                  <button
                    onClick={() => setDataSubTab('attribute')}
                    className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                      dataSubTab === 'attribute'
                        ? 'bg-white text-[#4F46E5] font-bold shadow-2xs border border-[#E2E8F0]'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <List className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>属性映射</span>
                  </button>
                  <button
                    onClick={() => setDataSubTab('relation')}
                    className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                      dataSubTab === 'relation'
                        ? 'bg-white text-[#D97706] font-bold shadow-2xs border border-[#E2E8F0]'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <GitFork className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>关系映射</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-[#D97706] font-bold">
                      2 待确认
                    </span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#64748B] font-medium hidden sm:block">
                {dataSubTab === 'attribute' ? (
                  <span>定义对象属性与底层来源字段对应 (Attribute ↔ Source Field)</span>
                ) : (
                  <span>审阅关联对象关系与外键证据 (Relationship ↔ Foreign Key Evidence)</span>
                )}
              </div>
            </div>
          )}

          {/* ==================== PERSPECTIVE 1: BUSINESS PERSPECTIVE ==================== */}
          {activePerspective === 'business' ? (
            <div className="space-y-6">
              {/* Module 1: 对象定义 (Object Definition) */}
              <section id="definition" className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs p-5 space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#4F46E5]" />
                    <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                      对象定义
                    </h3>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-[#4F46E5] border border-indigo-100">
                        AI生成
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#059669] border border-emerald-100 flex items-center space-x-0.5">
                        <Check className="w-3 h-3 text-[#059669]" />
                        <span>已确认</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditDefinitionOpen(true)}
                    className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>调整定义</span>
                  </button>
                </div>

                {/* Grid Info Fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0] text-xs">
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">对象名称</span>
                    <span className="font-bold text-[#1E293B] text-sm mt-0.5 block">服务工单</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">英文名称</span>
                    <span className="font-mono font-bold text-[#1E293B] text-sm mt-0.5 block">Service Ticket</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">业务域</span>
                    <span className="font-semibold text-[#475569] mt-0.5 block">{businessDomain}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">主题</span>
                    <span className="font-semibold text-[#475569] mt-0.5 block">{themeGroup}</span>
                  </div>
                </div>

                {/* Business Definition Text Box */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-[#64748B]">业务说明:</span>
                  <p className="text-xs text-[#1E293B] leading-relaxed bg-indigo-50/40 p-3.5 rounded-lg border border-indigo-100/80 font-medium">
                    {objectDefinition}
                  </p>
                </div>
              </section>

              {/* Module 2: 对象身份 (Object Identity) */}
              <section id="identity" className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs p-5 space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-[#4F46E5]" />
                    <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                      对象身份
                    </h3>
                  </div>

                  <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                    <span>对象身份已满足</span>
                  </span>
                </div>

                {/* Primary Business Identity Display */}
                <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[11px] text-[#94A3B8] font-medium block">核心业务标识</span>
                      <span className="text-base font-extrabold text-[#1E293B] tracking-tight text-indigo-950">
                        工单编号
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <div className="text-right">
                        <span className="text-[10px] text-[#94A3B8] block">身份类型</span>
                        <span className="font-semibold text-[#475569]">来源系统业务标识</span>
                      </div>
                      <div className="h-6 w-px bg-[#E2E8F0]" />
                      <div className="text-right">
                        <span className="text-[10px] text-[#94A3B8] block">业务粒度</span>
                        <span className="font-semibold text-[#475569]">1 张工单 = 1 个业务对象</span>
                      </div>
                    </div>
                  </div>

                  {/* Auxiliary Technical Evidence & Lightweight Explanation */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#64748B] text-[11px]">数据源底层对应:</span>
                      <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-[#E2E8F0] text-[#4F46E5]">
                        ticket_id
                      </span>
                      <span className="text-[11px] font-bold text-[#059669] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                        唯一率 99.9%
                      </span>
                    </div>

                    <div className="text-[11px] text-[#64748B] italic">
                      可通过当前来源资产稳定识别服务工单实体
                    </div>
                  </div>
                </div>

                {/* Explanation note */}
                <p className="text-[11px] text-[#64748B] leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200/80">
                  <strong className="text-[#1E293B]">身份说明:</strong> 当前标识可在当前来源资产内稳定识别服务工单；如果未来接入其他业务系统，仍需要进一步完成跨来源身份对齐。
                </p>
              </section>

              {/* Module 3: 核心属性 (Core Attributes) */}
              <section id="attributes" className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs p-5 space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center space-x-2">
                    <List className="w-4 h-4 text-[#4F46E5]" />
                    <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                      核心属性
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    共 6 项核心业务属性
                  </span>
                </div>

                {/* Grouped + Compact Content List */}
                <div className="space-y-4 text-xs">
                  {/* Group 1: 身份属性 */}
                  <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                      <span className="font-bold text-[#1E293B] flex items-center space-x-1.5">
                        <Key className="w-3.5 h-3.5 text-[#4F46E5]" />
                        <span>身份属性</span>
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">1 项</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-md border border-[#E2E8F0] flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-[#1E293B] text-xs">工单编号</span>
                        <span className="text-[#64748B] text-[11px]">唯一标识一张服务工单</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#94A3B8]">ticket_id</span>
                    </div>
                  </div>

                  {/* Group 2: 生命周期属性 */}
                  <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                      <span className="font-bold text-[#1E293B] flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#059669]" />
                        <span>生命周期属性</span>
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">3 项</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="bg-white p-2.5 rounded-md border border-[#E2E8F0] flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-[#1E293B] text-xs">处理状态</span>
                          <span className="text-[#64748B] text-[11px]">表示当前工单的流转办理状态</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#94A3B8]">status_code</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-md border border-[#E2E8F0] flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-[#1E293B] text-xs">创建时间</span>
                          <span className="text-[#64748B] text-[11px]">诉求发起的业务发生时刻</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#94A3B8]">create_time</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-md border border-[#E2E8F0] flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-[#1E293B] text-xs">办结时间</span>
                          <span className="text-[#64748B] text-[11px]">工单最终处理完成归档时刻</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#94A3B8]">close_time</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#64748B] pt-1">
                      共同描述服务工单从创建到完成办理的生命周期
                    </p>
                  </div>

                  {/* Group 3: 分析属性 */}
                  <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                      <span className="font-bold text-[#1E293B] flex items-center space-x-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>分析属性</span>
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">1 项</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-md border border-[#E2E8F0] flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-[#1E293B] text-xs">处理时长</span>
                        <span className="text-[#64748B] text-[11px]">用于办理效率和过程时长分析</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#94A3B8]">handle_duration</span>
                    </div>
                  </div>

                  {/* Group 4: 关系属性 */}
                  <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                      <span className="font-bold text-[#1E293B] flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
                        <span>关系属性</span>
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">1 项</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-md border border-[#E2E8F0] flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-[#1E293B] text-xs">申请人</span>
                        <span className="text-[#64748B] text-[11px]">表示发起该服务工单的自然人主体</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#94A3B8]">applicant_id</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Module 4: 业务关系 (Business Relations) */}
              <section id="relations" className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs p-5 space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center space-x-2">
                    <GitFork className="w-4 h-4 text-[#4F46E5]" />
                    <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                      业务关系
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsAddRelationOpen(true)}
                    className="px-3 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] border border-indigo-200 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加关系</span>
                  </button>
                </div>

                {/* 1-Layer Core Relationship Visual Cards */}
                <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
                  <div className="text-xs text-[#64748B] font-medium flex items-center justify-between">
                    <span>当前展示【服务工单】一层核心业务关系图谱</span>
                    <span className="text-[11px] text-[#D97706] font-bold">2 项关系待确认</span>
                  </div>

                  {/* Relationship Diagram Box */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {relations.map((rel) => {
                      const isConfirmed = rel.status === 'confirmed';
                      const isPending = rel.status === 'pending';
                      const isCandidate = rel.status === 'candidate';

                      return (
                        <div
                          key={rel.id}
                          className={`p-3.5 rounded-lg border transition-all space-y-2.5 relative ${
                            isConfirmed
                              ? 'bg-white border-emerald-300 shadow-2xs'
                              : isPending
                              ? 'bg-amber-50/40 border-amber-300/80 shadow-2xs'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-[#1E293B] flex items-center space-x-1">
                              <span className="text-xs text-[#4F46E5]">服务工单</span>
                              <span className="text-[#94A3B8] font-normal">→</span>
                              <span className="text-xs font-bold text-[#1E293B]">{rel.target}</span>
                            </span>

                            {isConfirmed && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#059669] border border-emerald-200">
                                已确认
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-[#D97706] border border-amber-200">
                                待确认
                              </span>
                            )}
                            {isCandidate && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-[#475569]">
                                候选
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] text-[#94A3B8]">谓词:</span>
                              <span className="text-xs font-bold text-[#4F46E5] bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                {rel.predicate}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#64748B] leading-snug">
                              {rel.semantics}
                            </p>
                          </div>

                          {/* Relationship Action */}
                          {!isConfirmed && (
                            <button
                              onClick={() => handleConfirmRelation(rel.id)}
                              className="w-full py-1.5 px-2 rounded bg-white hover:bg-emerald-50 text-[#059669] border border-emerald-300 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>确认此业务关系</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lightweight Entry below Business Relations (50-64px height) */}
                <div
                  id="datamapping"
                  className="h-14 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border border-indigo-100 rounded-lg px-4 flex items-center justify-between shadow-2xs scroll-mt-6"
                >
                  <div className="flex items-center space-x-3 text-xs">
                    <Database className="w-4 h-4 text-[#4F46E5]" />
                    <div>
                      <span className="font-bold text-[#1E293B]">数据映射已准备</span>
                      <span className="text-[#64748B] ml-2 font-normal">
                        主来源: <code className="font-mono text-[#4F46E5]">pop_service_hotline</code> · 核心属性: 已完成映射 · 关系: 2 项待确认
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActivePerspective('data')}
                    className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <span>切换至数据视角</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#4F46E5]" />
                  </button>
                </div>
              </section>
            </div>
          ) : (
            /* ==================== PERSPECTIVE 2: DATA PERSPECTIVE (V3.2 FINAL) ==================== */
            <div className="space-y-5">
              {/* 1. Mapping Summary Bar (横向摘要条 - 针对当前 View / SubTab 自适应) */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
                {dataSubTab === 'relation' ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 flex-1 divide-x-0 sm:divide-x divide-[#E2E8F0]">
                      {/* Block 1: 当前对象 */}
                      <div className="space-y-1 pr-2">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">当前对象</span>
                        <span className="font-bold text-[#1E293B] text-xs block truncate" title="服务工单">
                          服务工单
                        </span>
                      </div>

                      {/* Block 2: 关系候选 */}
                      <div className="space-y-1 sm:pl-4 pr-2">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">关系候选</span>
                        <span className="font-mono font-bold text-[#4F46E5] text-xs block">
                          3
                        </span>
                      </div>

                      {/* Block 3: 已确认 */}
                      <div className="space-y-1 sm:pl-4 pr-2">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">已确认</span>
                        <span className="font-mono font-bold text-[#059669] text-xs block">
                          0
                        </span>
                      </div>

                      {/* Block 4: 待确认 */}
                      <div className="space-y-1 sm:pl-4 pr-2">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">待确认</span>
                        <span className="font-mono font-bold text-[#D97706] text-xs block">
                          2
                        </span>
                      </div>

                      {/* Block 5: 可选 */}
                      <div className="space-y-1 sm:pl-4">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">可选</span>
                        <span className="font-mono font-bold text-[#64748B] text-xs block">
                          1
                        </span>
                      </div>
                    </div>

                    {/* Right Soft Tip Badge */}
                    <div className="shrink-0 flex items-center space-x-1.5 bg-amber-50 text-[#D97706] border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-[#D97706]" />
                      <span>当前对象关系映射已形成候选，但仍有 2 项关系待确认。</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 flex-1 divide-x-0 sm:divide-x divide-[#E2E8F0]">
                      {/* Block 1: 主来源 */}
                      <div className="space-y-1 pr-2">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">主来源</span>
                        <span className="font-mono font-bold text-[#4F46E5] text-xs block truncate" title="pop_service_hotline">
                          pop_service_hotline
                        </span>
                      </div>

                      {/* Block 2: 对象标识 */}
                      <div className="space-y-1 sm:pl-4 pr-2">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">对象标识</span>
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-[#1E293B]">工单编号</span>
                          <span className="text-[#94A3B8]">←</span>
                          <span className="font-mono text-[#4F46E5] font-semibold text-[11px]">ticket_id</span>
                        </div>
                      </div>

                      {/* Block 3: 核心属性 */}
                      <div className="space-y-1 sm:pl-4 pr-2">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">核心属性</span>
                        <span className="font-bold text-[#059669] text-xs block">
                          5 / 5 已映射
                        </span>
                      </div>

                      {/* Block 4: 关系状态 */}
                      <div className="space-y-1 sm:pl-4 pr-2">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">关系状态</span>
                        <span className="font-bold text-[#D97706] text-xs block">
                          0 / 3 已确认
                        </span>
                      </div>

                      {/* Block 5: 当前结论 */}
                      <div className="space-y-1 sm:pl-4">
                        <span className="text-[11px] text-[#94A3B8] font-medium block">当前结论</span>
                        <span className="font-bold text-[#059669] text-xs block">
                          可形成对象草稿
                        </span>
                      </div>
                    </div>

                    {/* Conclusion Tag Badge */}
                    <div className="shrink-0 flex items-center space-x-1.5 bg-emerald-50 text-[#059669] border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs">
                      <ShieldCheck className="w-4 h-4 text-[#059669]" />
                      <span>对象草稿已具备基础映射条件</span>
                    </div>
                  </>
                )}
              </div>

              {/* 2. Inner Sub-Tabs Switcher */}
              <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-[#E2E8F0] shadow-2xs">
                <div className="flex items-center space-x-1 bg-[#F1F5F9] p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setDataSubTab('attribute')}
                    className={`px-4 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                      dataSubTab === 'attribute'
                        ? 'bg-white text-[#4F46E5] font-bold shadow-2xs border border-[#E2E8F0]'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <List className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>属性映射</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-[#4F46E5] font-mono">8</span>
                  </button>

                  <button
                    onClick={() => setDataSubTab('relation')}
                    className={`px-4 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                      dataSubTab === 'relation'
                        ? 'bg-white text-[#4F46E5] font-bold shadow-2xs border border-[#E2E8F0]'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <GitFork className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>关系映射</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-50 text-[#D97706] font-mono">3</span>
                  </button>
                </div>

                <div className="text-xs text-[#64748B]">
                  来源物理资产: <span className="font-mono font-bold text-[#1E293B]">pop_service_hotline</span>
                </div>
              </div>

              {/* 3. Primary Table Workspace */}
              {dataSubTab === 'attribute' ? (
                /* SUB-TAB 1: 属性映射表 */
                <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs overflow-hidden">
                  {/* Table Header Bar with Search & Filter */}
                  <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-bold text-[#1E293B]">
                        对象属性映射
                      </h3>
                      <span className="text-[11px] text-[#94A3B8]">
                        (关联 8 个核心字段)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Search Box */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="搜索属性..."
                          value={attributeSearchTerm}
                          onChange={e => setAttributeSearchTerm(e.target.value)}
                          className="pl-8 pr-3 py-1 rounded-md border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:border-[#4F46E5] w-36"
                        />
                      </div>

                      {/* Filter Dropdown */}
                      <div className="flex items-center space-x-1 text-xs">
                        <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <select
                          value={attributeFilterStatus}
                          onChange={e => setAttributeFilterStatus(e.target.value)}
                          className="py-1 px-2 rounded-md border border-[#E2E8F0] text-xs bg-white text-[#475569] font-medium focus:outline-none focus:border-[#4F46E5]"
                        >
                          <option value="all">全部筛选</option>
                          <option value="pending">待确认</option>
                          <option value="conflict">冲突</option>
                          <option value="confirmed">已确认</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* High Density Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                        <tr>
                          <th className="p-3">对象属性</th>
                          <th className="p-3">来源字段</th>
                          <th className="p-3">字段语义</th>
                          <th className="p-3">属性角色</th>
                          <th className="p-3">字段状态</th>
                          <th className="p-3">映射状态</th>
                          <th className="p-3 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B] font-medium">
                        {/* Row 1: 工单编号 */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-[#1E293B] flex items-center space-x-1.5">
                            <Key className="w-3.5 h-3.5 text-[#4F46E5]" />
                            <span>工单编号</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-[#4F46E5] text-[11px]">ticket_id</td>
                          <td className="p-3 text-[#475569]">工单编号</td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-[#4F46E5] border border-indigo-100">
                              主标识属性
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已确认
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已映射
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setFieldEvidenceDetail({
                                fieldName: '工单编号',
                                sourceField: 'ticket_id',
                                semantics: '工单编号 / 主标识',
                                nullRate: '100%',
                                uniqueRate: '99.9%',
                                identityType: '来源系统业务标识',
                                conclusion: '满足当前对象身份映射要求'
                              })}
                              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                            >
                              查看依据
                            </button>
                          </td>
                        </tr>

                        {/* Row 2: 处理状态 */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-[#1E293B]">处理状态</td>
                          <td className="p-3 font-mono text-[#1E293B] text-[11px]">status</td>
                          <td className="p-3 text-[#475569]">处理状态</td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#475569]">
                              状态属性
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已确认
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已映射
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setFieldEvidenceDetail({
                                fieldName: '处理状态',
                                sourceField: 'status',
                                semantics: '服务工单办理流转状态',
                                nullRate: '99.8%',
                                uniqueRate: '0.1%',
                                identityType: '状态枚举编码',
                                conclusion: '完整覆盖受理、处理、办结主流程'
                              })}
                              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                            >
                              查看依据
                            </button>
                          </td>
                        </tr>

                        {/* Row 3: 创建时间 */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-[#1E293B]">创建时间</td>
                          <td className="p-3 font-mono text-[#1E293B] text-[11px]">created_time</td>
                          <td className="p-3 text-[#475569]">创建时间</td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#475569]">
                              生命周期属性
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已确认
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已映射
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setFieldEvidenceDetail({
                                fieldName: '创建时间',
                                sourceField: 'created_time',
                                semantics: '工单业务发生时间戳',
                                nullRate: '100%',
                                uniqueRate: '88.5%',
                                identityType: '时间维度支撑',
                                conclusion: '满足业务过程发生时间点要求'
                              })}
                              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                            >
                              查看依据
                            </button>
                          </td>
                        </tr>

                        {/* Row 4: 办结时间 */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-[#1E293B]">办结时间</td>
                          <td className="p-3 font-mono text-[#1E293B] text-[11px]">close_time</td>
                          <td className="p-3 text-[#475569]">办结时间</td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#475569]">
                              生命周期属性
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已确认
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已映射
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setFieldEvidenceDetail({
                                fieldName: '办结时间',
                                sourceField: 'close_time',
                                semantics: '工单归档办结时刻',
                                nullRate: '94.2%',
                                uniqueRate: '82.1%',
                                identityType: '终态时间维度',
                                conclusion: '满足计算时长与生命周期关口 requirement'
                              })}
                              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                            >
                              查看依据
                            </button>
                          </td>
                        </tr>

                        {/* Row 5: 处理时长 */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-[#1E293B]">处理时长</td>
                          <td className="p-3 font-mono text-[#1E293B] text-[11px]">duration</td>
                          <td className="p-3 text-[#475569]">处理时长</td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#475569]">
                              分析属性
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已确认
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已映射
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setFieldEvidenceDetail({
                                fieldName: '处理时长',
                                sourceField: 'duration',
                                semantics: '办理耗时分钟数',
                                nullRate: '94.2%',
                                uniqueRate: '45.0%',
                                identityType: '数值度量',
                                conclusion: '可直接支撑处理效率统计'
                              })}
                              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                            >
                              查看依据
                            </button>
                          </td>
                        </tr>

                        {/* Row 6: 申请人 */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-[#1E293B]">申请人</td>
                          <td className="p-3 font-mono text-[#1E293B] text-[11px]">person_id</td>
                          <td className="p-3 text-[#475569]">自然人标识</td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-100">
                              关系属性
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                              已确认
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                              待确认
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => setFieldEvidenceDetail({
                                fieldName: '申请人',
                                sourceField: 'person_id',
                                semantics: '自然人关联外键',
                                nullRate: '99.1%',
                                uniqueRate: '15.4%',
                                identityType: '外键关系引用',
                                conclusion: '可支撑关联【自然人】业务实体'
                              })}
                              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                            >
                              查看依据
                            </button>
                            <span className="text-[#CBD5E1]">|</span>
                            <button
                              onClick={() => alert('调整映射：已发起申请人与 person_id 的数据映射校准')}
                              className="text-xs font-bold text-[#059669] hover:text-[#047857] transition-colors cursor-pointer"
                            >
                              调整映射
                            </button>
                          </td>
                        </tr>

                        {/* Row 7: 受理区域 */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-[#1E293B]">受理区域</td>
                          <td className="p-3 font-mono text-[#1E293B] text-[11px]">region_id</td>
                          <td className="p-3 text-[#475569]">区域标识</td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-100">
                              关系属性
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#475569]">
                              候选
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                              待确认
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => setFieldEvidenceDetail({
                                fieldName: '受理区域',
                                sourceField: 'region_id',
                                semantics: '行政区域编码',
                                nullRate: '98.0%',
                                uniqueRate: '0.5%',
                                identityType: '外键区域引用',
                                conclusion: '候选引用，待确认建立正式关系'
                              })}
                              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                            >
                              查看依据
                            </button>
                            <span className="text-[#CBD5E1]">|</span>
                            <button
                              onClick={() => alert('调整映射：已发起受理区域的对应校准')}
                              className="text-xs font-bold text-[#059669] hover:text-[#047857] transition-colors cursor-pointer"
                            >
                              调整映射
                            </button>
                          </td>
                        </tr>

                        {/* Row 8: 关联服务事项 */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-[#1E293B]">关联服务事项</td>
                          <td className="p-3 font-mono text-[#1E293B] text-[11px]">service_item_id</td>
                          <td className="p-3 text-[#475569]">服务事项标识</td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#475569]">
                              关系属性
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#475569]">
                              候选
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#64748B]">
                              可选
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => setFieldEvidenceDetail({
                                fieldName: '关联服务事项',
                                sourceField: 'service_item_id',
                                semantics: '公共服务事项编码',
                                nullRate: '92.4%',
                                uniqueRate: '2.1%',
                                identityType: '事项维度外键',
                                conclusion: '可选拓扑节点，暂不影响主流程'
                              })}
                              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                            >
                              查看依据
                            </button>
                            <span className="text-[#CBD5E1]">|</span>
                            <button
                              onClick={() => alert('已将【关联服务事项】设为暂不纳入')}
                              className="text-xs font-medium text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
                            >
                              暂不纳入
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* SUB-TAB 2: 关系映射表 (主工作区 V3.2 Relationship Mapping Final) */
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs overflow-hidden space-y-0">
                    {/* Table Header Bar with Search & Filter */}
                    <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]/70 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <GitFork className="w-4 h-4 text-[#4F46E5]" />
                        <h3 className="text-xs font-bold text-[#1E293B]">
                          关系映射
                        </h3>
                        <span className="text-[11px] text-[#64748B]">
                          (审阅服务工单与其他业务对象关系候选与字段依据)
                        </span>
                      </div>

                      <div className="flex items-center space-x-2.5 text-xs">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="搜索关系名称 / 来源字段 / 目标对象..."
                            className="pl-8 pr-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-md text-xs focus:outline-none focus:border-[#4F46E5] w-64 text-[#1E293B]"
                          />
                        </div>

                        <div className="flex items-center space-x-1.5 bg-white border border-[#E2E8F0] rounded-md px-2 py-1">
                          <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <select
                            value={relationFilterStatus}
                            onChange={e => setRelationFilterStatus(e.target.value)}
                            className="text-xs bg-transparent text-[#475569] font-medium focus:outline-none cursor-pointer"
                          >
                            <option value="all">筛选: 全部关系 (4)</option>
                            <option value="pending">待确认 (2)</option>
                            <option value="optional">可选 (1)</option>
                            <option value="conflict">冲突 (1)</option>
                            <option value="confirmed">已确认 (0)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* High Density Enterprise Relationship Mapping Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                          <tr>
                            <th className="p-3 w-32">关系名称</th>
                            <th className="p-3 w-32">来源字段</th>
                            <th className="p-3 w-28">目标对象</th>
                            <th className="p-3 w-24">关系谓词</th>
                            <th className="p-3">关系证据 (Evidence Summary)</th>
                            <th className="p-3 w-28">当前状态</th>
                            <th className="p-3 text-right w-56">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B] font-medium">
                          {/* Row 1: 申请人 */}
                          <tr className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-bold text-[#1E293B]">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                                <span>申请人</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#4F46E5] text-[11px]">
                              person_id
                            </td>
                            <td className="p-3 font-bold text-[#1E293B]">
                              自然人
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-[#4F46E5] border border-indigo-100">
                                发起
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5 text-[11px] leading-relaxed">
                                <div><span className="text-[#94A3B8]">字段语义：</span><span className="text-[#1E293B] font-semibold">自然人标识</span></div>
                                <div><span className="text-[#94A3B8]">上下文：</span><span className="text-[#475569]">工单申请主体</span></div>
                                <div><span className="text-[#94A3B8]">业务判断：</span><span className="text-[#059669] font-semibold">服务工单由自然人发起</span></div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-[#D97706]" />
                                <span>待确认</span>
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => setFieldEvidenceDetail({
                                  fieldName: '申请人关系',
                                  sourceField: 'person_id',
                                  semantics: '自然人标识',
                                  nullRate: '99.1%',
                                  uniqueRate: '15.4%',
                                  identityType: '1:N 业务发起主关系',
                                  conclusion: '字段语义与业务上下文均极强匹配【服务工单由自然人发起】'
                                })}
                                className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                              >
                                查看依据
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已将【申请人】关系确认纳入对象草稿')}
                                className="text-xs font-bold text-[#059669] hover:text-[#047857] transition-colors cursor-pointer"
                              >
                                确认关系
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已发起调整【申请人】关系谓词或目标对象')}
                                className="text-xs font-bold text-[#D97706] hover:text-[#B45309] transition-colors cursor-pointer"
                              >
                                调整关系
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已暂不纳入【申请人】关系')}
                                className="text-xs font-medium text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
                              >
                                暂不纳入
                              </button>
                            </td>
                          </tr>

                          {/* Row 2: 受理区域 */}
                          <tr className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-bold text-[#1E293B]">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                                <span>受理区域</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#4F46E5] text-[11px]">
                              region_id
                            </td>
                            <td className="p-3 font-bold text-[#1E293B]">
                              行政区域
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-[#4F46E5] border border-indigo-100">
                                受理于
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5 text-[11px] leading-relaxed">
                                <div><span className="text-[#94A3B8]">字段语义：</span><span className="text-[#1E293B] font-semibold">区域标识</span></div>
                                <div><span className="text-[#94A3B8]">上下文：</span><span className="text-[#475569]">受理辖区</span></div>
                                <div><span className="text-[#94A3B8]">业务判断：</span><span className="text-[#059669] font-semibold">用于表示工单受理所属行政区域</span></div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-[#D97706]" />
                                <span>待确认</span>
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => setFieldEvidenceDetail({
                                  fieldName: '受理区域关系',
                                  sourceField: 'region_id',
                                  semantics: '区域标识',
                                  nullRate: '98.0%',
                                  uniqueRate: '0.5%',
                                  identityType: 'N:1 空间辖区划分',
                                  conclusion: '用于明确工单属地责任区域，匹配高信度'
                                })}
                                className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                              >
                                查看依据
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已将【受理区域】关系确认纳入对象草稿')}
                                className="text-xs font-bold text-[#059669] hover:text-[#047857] transition-colors cursor-pointer"
                              >
                                确认关系
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已发起调整【受理区域】关系谓词或目标对象')}
                                className="text-xs font-bold text-[#D97706] hover:text-[#B45309] transition-colors cursor-pointer"
                              >
                                调整关系
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已暂不纳入【受理区域】关系')}
                                className="text-xs font-medium text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
                              >
                                暂不纳入
                              </button>
                            </td>
                          </tr>

                          {/* Row 3: 关联服务事项 */}
                          <tr className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-bold text-[#1E293B]">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
                                <span>关联服务事项</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#4F46E5] text-[11px]">
                              service_item_id
                            </td>
                            <td className="p-3 font-bold text-[#1E293B]">
                              服务事项
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#475569]">
                                关联
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5 text-[11px] leading-relaxed">
                                <div><span className="text-[#94A3B8]">字段语义：</span><span className="text-[#1E293B] font-semibold">服务事项标识</span></div>
                                <div><span className="text-[#94A3B8]">上下文：</span><span className="text-[#475569]">事项准则</span></div>
                                <div><span className="text-[#94A3B8]">业务判断：</span><span className="text-[#64748B]">当前业务上下文中仍缺少强业务证据</span></div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#64748B] border border-slate-200">
                                <Info className="w-3 h-3 text-[#64748B]" />
                                <span>可选</span>
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => setFieldEvidenceDetail({
                                  fieldName: '服务事项关系',
                                  sourceField: 'service_item_id',
                                  semantics: '服务事项标识',
                                  nullRate: '92.4%',
                                  uniqueRate: '2.1%',
                                  identityType: 'N:1 业务分类支撑',
                                  conclusion: '当前缺乏直接事项引用强规则，建议做可选保留'
                                })}
                                className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                              >
                                查看依据
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已将【关联服务事项】确认纳入对象草稿')}
                                className="text-xs font-bold text-[#059669] hover:text-[#047857] transition-colors cursor-pointer"
                              >
                                确认关系
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已发起调整【关联服务事项】关系')}
                                className="text-xs font-bold text-[#D97706] hover:text-[#B45309] transition-colors cursor-pointer"
                              >
                                调整关系
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已暂不纳入【关联服务事项】关系')}
                                className="text-xs font-medium text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
                              >
                                暂不纳入
                              </button>
                            </td>
                          </tr>

                          {/* Row 4: 所属组织 (冲突示例 as specified) */}
                          <tr className="hover:bg-rose-50/30 bg-rose-50/10 transition-colors">
                            <td className="p-3 font-bold text-[#1E293B]">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C]" />
                                <span>所属组织</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#BE123C] text-[11px]">
                              org_id
                            </td>
                            <td className="p-3 font-bold text-[#1E293B]">
                              组织机构
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-[#BE123C] border border-rose-200">
                                归属
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5 text-[11px] leading-relaxed">
                                <div><span className="text-[#94A3B8]">字段语义：</span><span className="text-[#1E293B] font-semibold">组织代码</span></div>
                                <div><span className="text-[#94A3B8]">上下文：</span><span className="text-[#475569]">单位关联</span></div>
                                <div><span className="text-[#94A3B8]">业务判断：</span><span className="text-[#BE123C] font-semibold">字段可能表示办理单位，也可能表示责任组织，业务语义存在歧义</span></div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-[#BE123C] border border-rose-200">
                                <XCircle className="w-3 h-3 text-[#BE123C]" />
                                <span>冲突</span>
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => setFieldEvidenceDetail({
                                  fieldName: '所属组织关系',
                                  sourceField: 'org_id',
                                  semantics: '组织机构代码',
                                  nullRate: '88.5%',
                                  uniqueRate: '3.4%',
                                  identityType: '多重映射歧义节点',
                                  conclusion: '数据中 org_id 在 40% 的记录中对应办理单位，在 60% 中对应责任监督部门，需要业务介入判定'
                                })}
                                className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
                              >
                                查看依据
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('请在后续人工判断对话框中指定明确的组织关系类型')}
                                className="text-xs font-bold text-[#BE123C] hover:text-[#9F1239] transition-colors cursor-pointer"
                              >
                                人工判断
                              </button>
                              <span className="text-[#CBD5E1]">|</span>
                              <button
                                onClick={() => alert('已暂不纳入【所属组织】冲突关系')}
                                className="text-xs font-medium text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
                              >
                                暂不纳入
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Footnote Explanation */}
                    <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
                      <strong>说明：</strong> 关系映射表示当前业务对象与其他业务对象的连接证据来源，未确认关系不会进入正式语义资产。
                    </div>
                  </div>

                  {/* 表格下方轻量关系结构预览区 (Relationship Structure Preview) */}
                  <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                      <div className="flex items-center space-x-2">
                        <GitFork className="w-4 h-4 text-[#4F46E5]" />
                        <h4 className="text-xs font-bold text-[#1E293B]">
                          关系结构预览
                        </h4>
                        <span className="text-[11px] text-[#94A3B8]">
                          (辅助直观理解拓扑形态，主工作区仍为上方表格)
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-[10px] text-[#64748B] font-medium">
                        <span className="flex items-center space-x-1">
                          <span className="w-3 h-0.5 bg-[#059669] inline-block" />
                          <span>实线 = 已确认</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-3 h-0.5 border-t border-dashed border-[#D97706] inline-block" />
                          <span>虚线 = 待确认</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-3 h-0.5 bg-slate-300 inline-block" />
                          <span>浅灰 = 可选</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-3 h-0.5 border-t border-dashed border-[#BE123C] inline-block" />
                          <span>红虚线 = 冲突</span>
                        </span>
                      </div>
                    </div>

                    {/* Clean Centered Structure Node Canvas */}
                    <div className="py-6 px-4 bg-[#F8FAFC]/60 rounded-lg border border-[#E2E8F0] flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
                      {/* Top Node: 自然人 */}
                      <div className="flex flex-col items-center space-y-1">
                        <div className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs text-xs font-bold text-[#1E293B] flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                          <span>自然人</span>
                          <span className="text-[10px] text-[#94A3B8] font-normal">(Person)</span>
                        </div>
                        <div className="flex flex-col items-center text-[10px] font-mono text-[#D97706] font-bold">
                          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200">↑ 发起 (待确认)</span>
                          <div className="w-0.5 h-6 border-l-2 border-dashed border-[#D97706] my-0.5" />
                        </div>
                      </div>

                      {/* Middle Row: 行政区域 ← 服务工单 → 服务事项 */}
                      <div className="w-full max-w-xl flex items-center justify-between">
                        {/* Left Node: 行政区域 */}
                        <div className="flex items-center space-x-2">
                          <div className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs text-xs font-bold text-[#1E293B] flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                            <span>行政区域</span>
                          </div>
                          <div className="flex items-center font-mono text-[10px] font-bold text-[#D97706]">
                            <div className="h-0.5 w-12 border-t-2 border-dashed border-[#D97706]" />
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 ml-1">← 受理于</span>
                          </div>
                        </div>

                        {/* CENTER PRIMARY OBJECT NODE */}
                        <div className="px-5 py-3 rounded-xl bg-gradient-to-br from-indigo-50 to-white border-2 border-[#4F46E5] shadow-md flex items-center space-x-2.5 shrink-0 z-10">
                          <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-2xs">
                            <Key className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-[#1E293B] flex items-center space-x-1.5">
                              <span>服务工单</span>
                              <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 text-[#4F46E5] rounded-full font-bold">当前对象</span>
                            </div>
                            <div className="text-[10px] text-[#64748B] font-mono">Service Ticket · pop_service_hotline</div>
                          </div>
                        </div>

                        {/* Right Node: 服务事项 */}
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center font-mono text-[10px] font-bold text-[#64748B]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 mr-1">关联 →</span>
                            <div className="h-0.5 w-12 bg-slate-300" />
                          </div>
                          <div className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs text-xs font-bold text-[#1E293B] flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#64748B]" />
                            <span>服务事项</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom-Right Conflict Node: 组织机构 */}
                      <div className="w-full max-w-xl flex justify-end pr-8">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center space-x-1 font-mono text-[10px] font-bold text-[#BE123C] mb-1">
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">归属 ↘ (冲突)</span>
                          </div>
                          <div className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 shadow-2xs text-xs font-bold text-[#1E293B] flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#BE123C]" />
                            <span>组织机构</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ----------------------------------------------
            Right Column (340px): 对象草稿与建模检查 (Object Draft & Modeling Check)
        ---------------------------------------------- */}
        <aside className="w-80 border-l border-[#E2E8F0] bg-white flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          {/* Header Tabs: [ 对象草稿 ] [ 建模检查 ] */}
          <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex bg-[#E2E8F0]/60 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveRightTab('draft')}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center ${
                  activeRightTab === 'draft'
                    ? 'bg-white text-[#1E293B] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                对象草稿
              </button>
              <button
                onClick={() => setActiveRightTab('check')}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center ${
                  activeRightTab === 'check'
                    ? 'bg-white text-[#4F46E5] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                建模检查
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {activeRightTab === 'draft' ? (
              /* TAB 1: 对象草稿 SUMMARY */
              <div className="space-y-3 text-xs">
                <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#1E293B]">服务工单</span>
                    <div className="flex space-x-1">
                      <span className="text-[10px] bg-indigo-50 text-[#4F46E5] px-1.5 py-0.2 rounded font-bold border border-indigo-100">
                        AI生成
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-[#059669] px-1.5 py-0.2 rounded font-bold border border-emerald-100">
                        语义已确认
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-[#64748B] text-xs pt-1 border-t border-[#E2E8F0]">
                    <div className="flex justify-between">
                      <span>英文标识</span>
                      <span className="font-mono text-[#1E293B]">Service Ticket</span>
                    </div>
                    <div className="flex justify-between">
                      <span>对象形态</span>
                      <span className="text-[#1E293B] font-medium">业务过程对象</span>
                    </div>
                    <div className="flex justify-between">
                      <span>业务标识</span>
                      <span className="text-[#4F46E5] font-bold">工单编号</span>
                    </div>
                    <div className="flex justify-between">
                      <span>核心属性</span>
                      <span className="text-[#1E293B] font-bold">6 项</span>
                    </div>
                    <div className="flex justify-between">
                      <span>确认关系</span>
                      <span className="text-[#D97706] font-bold">0 / 3 项</span>
                    </div>
                    <div className="flex justify-between">
                      <span>来源数据资产</span>
                      <span className="font-mono text-[#1E293B]">1 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span>草稿状态</span>
                      <span className="text-[#059669] font-bold">草稿待确认</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: 建模检查 / MODELING READINESS CHECKLIST */
              <div className="space-y-4 text-xs">
                {/* Checklist Group */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#1E293B] flex items-center justify-between">
                    <span>建模必备要素 (Checklist)</span>
                    <span className="text-[10px] text-[#059669] font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      全部通过
                    </span>
                  </div>

                  <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3 space-y-2 text-xs">
                    {[
                      '对象名称已确认',
                      '业务定义已形成',
                      '对象身份已确认',
                      '数据粒度已确认',
                      '核心属性已确认',
                      '至少一个数据来源已确认'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-[#1E293B]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Non-blocking suggestions */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#D97706] flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>非阻塞建议 (2项)</span>
                  </div>

                  <div className="bg-amber-50/50 rounded-lg border border-amber-200/80 p-3 space-y-2 text-[11px] text-[#D97706]">
                    <div className="flex items-start space-x-1.5">
                      <span className="font-bold">△</span>
                      <span>申请人关系待确认 (服务工单 → 自然人)</span>
                    </div>
                    <div className="flex items-start space-x-1.5">
                      <span className="font-bold">△</span>
                      <span>受理区域关系待确认 (服务工单 → 行政区域)</span>
                    </div>
                  </div>
                </div>

                {/* Blocking issues */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-[#64748B] flex items-center justify-between">
                    <span>阻塞问题</span>
                    <span className="text-[10px] text-[#059669] font-bold">无</span>
                  </div>
                </div>

                {/* Light Emerald Conclusion Bar */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1.5 shadow-2xs">
                  <div className="flex items-center space-x-1.5 font-bold text-[#059669] text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#059669]" />
                    <span>可以进入语义资产完善</span>
                  </div>
                  <p className="text-[11px] text-[#047857] leading-relaxed">
                    当前对象草稿要素齐全，包含 2 项非阻塞关系建议，满足基础建模规范要求。
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ==============================================
          Bottom Agent Availability Preview Bar (Agent 可用性预览 - 80~100px)
      ============================================== */}
      <div id="preview" className="bg-white border-t border-[#E2E8F0] px-6 py-2.5 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs scroll-mt-6">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#1E293B] shrink-0">
          <Bot className="w-4 h-4 text-[#4F46E5]" />
          <span>Agent 可用性预览</span>
        </div>

        {/* 3 Lightweight Horizontal Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 text-xs">
          {/* Block 1: 支持的问题 */}
          <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-bold text-[#94A3B8] block">支持的问题</span>
            <ul className="text-[11px] text-[#475569] space-y-0.5 list-disc list-inside">
              <li>最近三个月服务工单数量趋势？</li>
              <li>平均办理时长是多少？</li>
              <li>某个自然人有哪些服务工单？</li>
            </ul>
          </div>

          {/* Block 2: 主要查询语义 */}
          <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-bold text-[#94A3B8] block">主要查询语义</span>
            <div className="text-[11px] text-[#475569] space-y-1 font-mono">
              <div><strong className="text-[#1E293B]">计数:</strong> 工单编号</div>
              <div><strong className="text-[#1E293B]">时间:</strong> 创建时间 / 办结时间</div>
              <div><strong className="text-[#1E293B]">度量:</strong> 处理时长</div>
            </div>
          </div>

          {/* Block 3: 当前限制 */}
          <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-bold text-[#D97706] block">当前限制</span>
            <ul className="text-[11px] text-[#64748B] space-y-0.5 list-disc list-inside">
              <li>完整状态流转历史需补充事件数据</li>
              <li>部分业务关系尚待确认</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ==============================================
          Fixed Bottom Action Bar
      ============================================== */}
      <footer className="bg-white border-t border-[#E2E8F0] px-6 py-3 shrink-0 flex items-center justify-between shadow-md">
        {/* Left Status Text */}
        <div className="flex items-center space-x-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span className="font-bold text-[#1E293B]">
            对象草稿已满足基础建模要求
          </span>
          <span className="text-[#CBD5E1]">·</span>
          <span className="text-[#D97706] font-medium">
            仍有 2 项非阻塞关系建议 (非阻塞，可直接提交)
          </span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => alert('对象草稿已成功保存到当前会话草稿')}
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#1E293B] font-semibold transition-all shadow-2xs cursor-pointer"
          >
            保存草稿
          </button>

          <button
            onClick={onProceedToAssets}
            className="px-5 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <span>确认对象草稿并继续</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </footer>

      {/* ==============================================
          Modals / Drawers
      ============================================== */}
      {/* 1. Edit Definition Modal */}
      {isEditDefinitionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-[#4F46E5]" />
                <span>调整业务对象定义</span>
              </h3>
              <button
                onClick={() => setIsEditDefinitionOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#1E293B] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-semibold mb-1">业务定义说明</label>
                <textarea
                  value={objectDefinition}
                  onChange={e => setObjectDefinition(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-semibold mb-1">业务域</label>
                  <input
                    type="text"
                    value={businessDomain}
                    onChange={e => setBusinessDomain(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#E2E8F0] text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-semibold mb-1">主题</label>
                  <input
                    type="text"
                    value={themeGroup}
                    onChange={e => setThemeGroup(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#E2E8F0] text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setIsEditDefinitionOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium"
              >
                取消
              </button>
              <button
                onClick={() => setIsEditDefinitionOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#4F46E5] text-white text-xs font-bold"
              >
                保存更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. View Discovery Evidence Drawer */}
      {isEvidenceDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full border-l border-[#E2E8F0] shadow-2xl p-5 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#4F46E5]" />
                <span>服务工单 · 发现依据</span>
              </h3>
              <button
                onClick={() => setIsEvidenceDrawerOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#1E293B] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1.5">
                <div className="font-bold text-[#1E293B]">来源资产</div>
                <p className="font-mono text-[#4F46E5] text-[11px]">pop_service_hotline</p>
                <p className="text-[11px] text-[#64748B]">包含 17 个已理解语义字段，表语义确定为“工单过程记录”。</p>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1.5">
                <div className="font-bold text-[#1E293B]">算法判定逻辑</div>
                <ul className="text-[11px] text-[#64748B] space-y-1 list-disc list-inside">
                  <li>ticket_id 字段唯一率达 99.9%，可作为高信度业务标识。</li>
                  <li>同时具备创建时间 (create_time) 与办结时间 (close_time)，形成完备的业务过程时间链。</li>
                  <li>状态流转 status_code 涵盖“提交/处理/归档”主生命周期。</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
                <div className="font-bold">决策结论</div>
                <p className="text-[11px]">系统根据数据分布与业务语义确定创建独立的“服务工单”业务过程对象。</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Relation Modal */}
      {isAddRelationOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center space-x-2">
                <GitFork className="w-4 h-4 text-[#4F46E5]" />
                <span>添加业务关系</span>
              </h3>
              <button
                onClick={() => setIsAddRelationOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#1E293B] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-semibold mb-1">关系谓词</label>
                <input
                  type="text"
                  placeholder="例如：负责组织 / 所属客户"
                  className="w-full p-2 rounded-lg border border-[#E2E8F0] text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-semibold mb-1">目标业务对象</label>
                <input
                  type="text"
                  placeholder="例如：组织机构 / 客户信息"
                  className="w-full p-2 rounded-lg border border-[#E2E8F0] text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-semibold mb-1">业务语义说明</label>
                <input
                  type="text"
                  placeholder="说明该关系的业务意义"
                  className="w-full p-2 rounded-lg border border-[#E2E8F0] text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setIsAddRelationOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setRelations(prev => [
                    ...prev,
                    {
                      id: `rel-${Date.now()}`,
                      predicate: '负责组织',
                      target: '组织机构',
                      semantics: '服务工单由某组织机构负责承办处理',
                      status: 'pending',
                      type: 'N:1'
                    }
                  ]);
                  setIsAddRelationOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#4F46E5] text-white text-xs font-bold"
              >
                添加关系
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Field Mapping Evidence Drawer / Modal */}
      {fieldEvidenceDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full border-l border-[#E2E8F0] shadow-2xl p-5 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-sm font-bold text-[#1E293B]">
                  映射依据 · {fieldEvidenceDetail.fieldName}
                </h3>
              </div>
              <button
                onClick={() => setFieldEvidenceDetail(null)}
                className="p-1 text-[#94A3B8] hover:text-[#1E293B] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">映射属性</span>
                  <span className="font-bold text-[#1E293B]">{fieldEvidenceDetail.fieldName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">来源字段</span>
                  <span className="font-mono font-bold text-[#4F46E5]">{fieldEvidenceDetail.sourceField}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">字段语义</span>
                  <span className="font-medium text-[#1E293B]">{fieldEvidenceDetail.semantics}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] space-y-2.5">
                <div className="text-[11px] font-bold text-[#1E293B] border-b border-[#E2E8F0] pb-1.5">
                  底层数据质量与统计指标
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                    <span className="text-[#94A3B8] block text-[10px]">非空率</span>
                    <span className="font-mono font-bold text-[#059669] text-sm">{fieldEvidenceDetail.nullRate}</span>
                  </div>
                  <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                    <span className="text-[#94A3B8] block text-[10px]">唯一率</span>
                    <span className="font-mono font-bold text-[#4F46E5] text-sm">{fieldEvidenceDetail.uniqueRate}</span>
                  </div>
                </div>
                <div className="pt-1 flex justify-between items-center">
                  <span className="text-[#64748B]">身份 / 语义角色</span>
                  <span className="font-semibold text-[#1E293B]">{fieldEvidenceDetail.identityType}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span>审核结论</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#047857]">
                  {fieldEvidenceDetail.conclusion}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setFieldEvidenceDetail(null)}
                className="px-4 py-1.5 rounded-lg bg-[#4F46E5] text-white text-xs font-bold shadow-2xs cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
