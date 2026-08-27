import React, { useState } from 'react';
import {
  Bot,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  GitBranch,
  Play,
  Save,
  BookOpen,
  Layers,
  Cpu,
  FileText,
  Sliders,
  Shield,
  Activity,
  ExternalLink,
  X,
  Send,
  MessageSquare,
  Search,
  ChevronRight,
  Database,
  Info,
  Clock,
  UserCheck
} from 'lucide-react';

interface AgentDefinitionWorkspaceProps {
  onBackToRegistry: () => void;
  onNavigateToPublish?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AgentDefinitionWorkspace: React.FC<AgentDefinitionWorkspaceProps> = ({
  onBackToRegistry,
  onNavigateToPublish,
  addToast
}) => {
  // Left Section Navigation State
  const [activeSection, setActiveSection] = useState<
    'overview' | 'basic_info' | 'tasks' | 'context' | 'capabilities' | 'model_autonomy' | 'runtime'
  >('overview');

  // Modals / Drawers
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRuntimeModalOpen, setIsRuntimeModalOpen] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testLogs, setTestLogs] = useState<Array<{ role: 'user' | 'agent'; text: string; sources?: string[] }>>([
    {
      role: 'agent',
      text: '您好，我是「企业知识伙伴 (草稿环境 · v1.4+Draft)」。当前已挂载 3 个知识空间（含草稿新增的《数据治理规范》）及 Wiki + RAG 混合检索。请输入您想验证的知识查询。'
    }
  ]);
  const [isSendingQuery, setIsSendingQuery] = useState(false);

  const handleSendTestQuery = () => {
    if (!testQuery.trim()) return;
    const query = testQuery.trim();
    setTestLogs((prev) => [...prev, { role: 'user', text: query }]);
    setTestQuery('');
    setIsSendingQuery(true);

    setTimeout(() => {
      setIsSendingQuery(false);
      if (query.includes('治理') || query.includes('标准') || query.includes('规范')) {
        setTestLogs((prev) => [
          ...prev,
          {
            role: 'agent',
            text: '根据草稿新增的《数据治理规范 V2.4》及企业数据资产管理办法：\n1. 企业所有核心数据元素与值域标准需由领域数据负责人进行三审发布；\n2. 字段映射冲突需在 3 个工作日内由数据质量组完成仲裁。\n该依据来自新增的「数据治理规范」知识空间。',
            sources: ['《数据治理规范 V2.4》第 4.2 节', '《数据资产目录管理办法》']
          }
        ]);
      } else {
        setTestLogs((prev) => [
          ...prev,
          {
            role: 'agent',
            text: '已通过 Wiki + RAG 混合研究在「企业制度」与「产品知识」空间完成多跳检索。已确认相关正式文件条款并生成结构化答复。',
            sources: ['《企业员工手册 2026版》', '《Semovix 产品白皮书》']
          }
        ]);
      }
    }, 600);
  };

  const handleSaveDraft = () => {
    addToast?.('success', '草稿已保存', '当前包含 2 项修改的草稿已保存至本地工作区，线上 v1.4 正式版保持稳定运行');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* ─────────────────────────────────────────────────────────────
          SECTION ONE. IMMERSIVE AGENT WORKSPACE HEADER
      ───────────────────────────────────────────────────────────── */}
      <header className="h-[68px] bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
        {/* Left: Back to Registry & Breadcrumb & Agent Identity */}
        <div className="flex items-center space-x-4 min-w-0">
          {/* Back button */}
          <button
            onClick={onBackToRegistry}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer border border-[#E2E8F0] shrink-0"
            title="返回智能体中心列表"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>智能体</span>
          </button>

          {/* Vertical divider */}
          <div className="h-5 w-px bg-[#E2E8F0] shrink-0" />

          {/* Breadcrumb + Agent Title */}
          <div className="min-w-0">
            <div className="flex items-center space-x-2 text-[11px] text-[#64748B]">
              <span>智能体中心</span>
              <span>/</span>
              <span className="text-[#0F172A] font-medium">企业知识伙伴</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <h1 className="text-sm font-bold text-[#0F172A] tracking-tight truncate">
                企业知识伙伴
              </h1>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200/60 shrink-0">
                受管智能体
              </span>
            </div>
          </div>
        </div>

        {/* Right: Exactly 3 Status Tags + Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Status Tag 1: 正式版本 v1.4 */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#334155]">
            <span className="text-[#64748B]">正式版本</span>
            <span className="font-mono font-semibold text-[#0F172A]">v1.4</span>
          </div>

          {/* Status Tag 2: 草稿有 2 项修改 */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs text-[#1E40AF]">
            <GitBranch className="w-3 h-3 text-[#2563EB]" />
            <span className="font-semibold">草稿有 2 项修改</span>
          </div>

          {/* Status Tag 3: WeKnora · 正常 (Strictly NO "已同步" in header) */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded text-xs text-[#334155]">
            <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
            <span className="font-medium text-[#0F172A]">WeKnora · 正常</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#E2E8F0]">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Play className="w-3 h-3 text-[#2563EB]" />
              <span>测试草稿</span>
            </button>
            <button
              onClick={handleSaveDraft}
              className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Save className="w-3 h-3" />
              <span>保存草稿</span>
            </button>
            {onNavigateToPublish && (
              <button
                onClick={onNavigateToPublish}
                className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <span>前往发布验证</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sub-header Description bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-2 text-xs text-[#64748B] flex items-center justify-between">
        <p className="truncate">
          基于企业正式知识回答问题、开展跨文档与 Wiki 研究，并提供可追溯的知识依据。
        </p>
        <span className="text-[11px] font-mono text-[#94A3B8] hidden md:inline">
          Agent ID: agt_ent_knowledge_01 · WeKnora Runtime
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION TWO. THREE-COLUMN WORKSPACE BODY
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─────────────────────────────────────────────────────────
            COLUMN A. LEFT SECTION NAVIGATION (190-210px)
        ───────────────────────────────────────────────────────── */}
        <aside className="w-[200px] bg-white border-r border-[#E2E8F0] flex flex-col justify-between p-3 shrink-0 select-none overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] tracking-wider uppercase">
              定义配置
            </div>

            {/* Nav 1: 概览 (Default Active) */}
            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold text-left transition-all cursor-pointer relative ${
                activeSection === 'overview'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'overview' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>概览</span>
            </button>

            {/* Nav 2: 基本信息 */}
            <button
              onClick={() => setActiveSection('basic_info')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'basic_info'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'basic_info' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>基本信息</span>
            </button>

            {/* Nav 3: 支持任务 */}
            <button
              onClick={() => setActiveSection('tasks')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'tasks'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'tasks' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>支持任务</span>
            </button>

            {/* Nav 4: 上下文来源 */}
            <button
              onClick={() => setActiveSection('context')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'context'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'context' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <Database className="w-3.5 h-3.5 shrink-0" />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span>上下文来源</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" title="包含草稿修改" />
              </div>
            </button>

            {/* Nav 5: 能力 */}
            <button
              onClick={() => setActiveSection('capabilities')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'capabilities'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'capabilities' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span>能力</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" title="包含草稿修改" />
              </div>
            </button>

            {/* Nav 6: 模型与自主程度 */}
            <button
              onClick={() => setActiveSection('model_autonomy')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'model_autonomy'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'model_autonomy' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>模型与自主程度</span>
            </button>

            {/* Nav 7: 运行引擎 */}
            <button
              onClick={() => setActiveSection('runtime')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs text-left transition-all cursor-pointer relative ${
                activeSection === 'runtime'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {activeSection === 'runtime' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r" />
              )}
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span>运行引擎</span>
            </button>
          </div>

          {/* Nav Footer Note */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[11px] text-[#64748B] space-y-1">
            <div className="font-semibold text-[#0F172A] flex items-center space-x-1">
              <Shield className="w-3 h-3 text-[#2563EB]" />
              <span>Semovix 统一管控</span>
            </div>
            <p className="text-[10px] text-[#94A3B8] leading-tight">
              受管智能体生命周期由平台安全治理协议统一护航。
            </p>
          </div>
        </aside>

        {/* ─────────────────────────────────────────────────────────
            COLUMN B. MIDDLE MAIN WORKSPACE (920-1000px)
        ───────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC]">
          <div className="max-w-[960px] mx-auto space-y-6">
            {activeSection === 'overview' ? (
              <>
                {/* Section Header */}
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                    概览
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    查看企业知识伙伴当前职责、正式基线、草稿状态与运行情况。
                  </p>
                </div>

                {/* ─────────────────────────────────────────────────────
                    BLOCK 1: 智能体职责 (Text section, NOT a card)
                ───────────────────────────────────────────────────── */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <h3 className="text-xs font-bold text-[#0F172A]">
                    智能体职责
                  </h3>
                  <p className="text-xs text-[#334155] leading-relaxed text-justify">
                    企业知识伙伴负责基于当前用户有权访问的企业正式知识回答问题，并支持跨文档、Wiki 与知识空间开展深入研究。回答应优先采用当前有效的正式知识来源；当证据不足、来源冲突或无法确认企业事实时，应明确说明，不得将推测表达为正式结论。
                  </p>
                  <p className="text-[11px] text-[#94A3B8] pt-1">
                    角色说明由 Agent Definition 管理；平台安全、权限与执行协议由 Semovix 统一控制。
                  </p>
                </div>

                {/* ─────────────────────────────────────────────────────
                    BLOCK 2: 当前定义摘要 (Card 1: Based on Current Draft)
                ───────────────────────────────────────────────────── */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-2xs space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">
                      当前定义摘要
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      基于当前草稿配置
                    </p>
                  </div>

                  {/* 4 horizontal items in ONE single card */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-[#F1F5F9]">
                    {/* Item 1: 支持任务 */}
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">支持任务</div>
                      <div className="text-xs font-bold text-[#0F172A]">3 项</div>
                      <div className="text-[10px] text-[#94A3B8]">
                        知识问答 · 文档研究 · Wiki 研究
                      </div>
                    </div>

                    {/* Item 2: 知识范围 */}
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">知识范围</div>
                      <div className="text-xs font-bold text-[#0F172A]">3 个知识空间</div>
                      <div className="text-[10px] text-[#94A3B8]">
                        企业制度 · 产品知识 · 数据治理规范
                      </div>
                    </div>

                    {/* Item 3: 能力模式 */}
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">能力模式</div>
                      <div className="text-xs font-bold text-[#2563EB]">
                        Wiki + RAG 混合
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">
                        多跳语义拓扑检索
                      </div>
                    </div>

                    {/* Item 4: 运行引擎 */}
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">运行引擎</div>
                      <div className="text-xs font-bold text-[#0F172A]">WeKnora</div>
                      <div className="text-[10px] text-[#94A3B8]">
                        Enterprise Knowledge 实例
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────
                    BLOCK 3: 正式基线 (Definition List, 2 columns)
                ───────────────────────────────────────────────────── */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">
                      正式基线
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      当前线上正式运行的是 v1.4，草稿修改尚未影响正式运行。
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F1F5F9] text-xs">
                      {/* Left Column (Items 1-6) */}
                      <div className="divide-y divide-[#F1F5F9]">
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">正式版本</dt>
                          <dd className="font-mono font-semibold text-[#0F172A]">v1.4</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">Owner</dt>
                          <dd className="font-medium text-[#0F172A]">企业知识治理组</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">支持任务</dt>
                          <dd className="text-[#0F172A]">3 项</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">知识范围</dt>
                          <dd className="font-semibold text-[#0F172A]">2 个知识空间</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">能力模式</dt>
                          <dd className="font-semibold text-[#0F172A]">精准知识问答</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">模型策略</dt>
                          <dd className="text-[#0F172A]">质量优先</dd>
                        </div>
                      </div>

                      {/* Right Column (Items 7-11) */}
                      <div className="divide-y divide-[#F1F5F9]">
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">最大自主程度</dt>
                          <dd className="text-[#0F172A]">建议</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">运行引擎</dt>
                          <dd className="font-semibold text-[#0F172A]">WeKnora</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">Runtime Revision</dt>
                          <dd className="font-mono text-[#0F172A]">r37</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">同步状态</dt>
                          <dd className="font-medium text-[#16A36A]">已同步</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">最近发布</dt>
                          <dd className="text-[#64748B]">2026-08-25 16:40</dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────
                    BLOCK 4: 当前草稿 (Diff List)
                ───────────────────────────────────────────────────── */}
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">
                      当前草稿
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      当前草稿相对正式版本 v1.4 有 2 项修改。
                    </p>
                  </div>

                  {/* 2 Lightweight Diff Items */}
                  <div className="space-y-2">
                    {/* Diff Item 1 */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#0F172A]">知识范围</div>
                        <div className="font-mono text-[#16A36A] font-semibold text-[11px]">
                          + 新增：数据治理规范
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded">
                        CONTEXT ADDED
                      </span>
                    </div>

                    {/* Diff Item 2 */}
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#0F172A]">能力模式</div>
                        <div className="text-[11px] text-[#2563EB] font-medium flex items-center space-x-1">
                          <span className="text-[#64748B] line-through">精准知识问答</span>
                          <span>→</span>
                          <span className="font-semibold text-[#2563EB]">Wiki + RAG 混合研究</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        MODE UPGRADE
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#94A3B8] pt-1">
                    草稿修改不会影响当前正式版本，完成测试与发布后才会生效。
                  </p>
                </div>

                {/* ─────────────────────────────────────────────────────
                    BLOCK 5: 运行引擎 (Card 2: Runtime Status Card)
                ───────────────────────────────────────────────────── */}
                <div className="space-y-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">
                      运行引擎
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      企业知识伙伴的知识检索与推理由 WeKnora Runtime 执行；Semovix 负责智能体定义、任务、权限和正式版本管理。
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-2xs space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                          WK
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#0F172A]">WeKnora Runtime</div>
                          <div className="text-[10px] text-[#64748B]">Knowledge Agent Execution Engine</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-50 text-[#16A36A] border border-emerald-200/60 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                        <span>运行正常</span>
                      </div>
                    </div>

                    {/* Runtime Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-[#64748B] block">运行状态</span>
                        <span className="font-semibold text-[#16A36A] mt-0.5 block">● 正常</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">同步状态</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5 block">正式版本已同步</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">运行实例</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5 block">Enterprise Knowledge</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">绑定正式版本</span>
                        <span className="font-mono font-semibold text-[#0F172A] mt-0.5 block">v1.4</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">Runtime Revision</span>
                        <span className="font-mono font-semibold text-[#0F172A] mt-0.5 block">r37</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">最近同步</span>
                        <span className="text-[#475569] mt-0.5 block">今天 10:26</span>
                      </div>
                    </div>

                    {/* Bottom Action (Single Button: 查看运行详情, Strictly NO 重新同步) */}
                    <div className="pt-3 border-t border-[#F1F5F9] flex justify-end">
                      <button
                        onClick={() => setIsRuntimeModalOpen(true)}
                        className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>查看运行详情</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* If other section selected in left nav: Dedicated Section Workspace View (clean, not long-form) */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A] tracking-tight capitalize">
                      {activeSection === 'basic_info' && '基本信息 (Basic Information)'}
                      {activeSection === 'tasks' && '支持任务 (Supported Tasks)'}
                      {activeSection === 'context' && '上下文来源 (Context Sources)'}
                      {activeSection === 'capabilities' && '能力模式与技能 (Capabilities & Skills)'}
                      {activeSection === 'model_autonomy' && '模型策略与自主程度 (Model & Autonomy)'}
                      {activeSection === 'runtime' && '运行引擎绑定 (Runtime Binding)'}
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      受管智能体定义工作区 · 独立 Section 编辑视图
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('overview')}
                    className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    返回概览
                  </button>
                </div>

                {activeSection === 'basic_info' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A]">智能体名称</label>
                      <input
                        type="text"
                        defaultValue="企业知识伙伴"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A]">业务职责定义</label>
                      <textarea
                        rows={4}
                        defaultValue="企业知识伙伴负责基于当前用户有权访问的企业正式知识回答问题，并支持跨文档、Wiki 与知识空间开展深入研究。回答应优先采用当前有效的正式知识来源；当证据不足、来源冲突或无法确认企业事实时，应明确说明，不得将推测表达为正式结论。"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A] leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A]">责任组织 (Owner)</label>
                      <input
                        type="text"
                        defaultValue="企业知识治理组"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'tasks' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                    <div className="font-bold text-[#0F172A]">当前受管支持任务 (3 项)</div>
                    <div className="space-y-2">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">1. 知识问答</div>
                          <div className="text-[11px] text-[#64748B]">基于企业标准制度与规范进行精准事实提取</div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-[#16A36A] px-2 py-0.5 rounded font-medium border border-emerald-200">启用中</span>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">2. 文档研究</div>
                          <div className="text-[11px] text-[#64748B]">跨长篇白皮书与政策文档进行多章节归纳对比</div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-[#16A36A] px-2 py-0.5 rounded font-medium border border-emerald-200">启用中</span>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">3. Wiki 研究</div>
                          <div className="text-[11px] text-[#64748B]">企业内部 Wiki 拓扑词条与领域专有名词协同检索</div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-[#16A36A] px-2 py-0.5 rounded font-medium border border-emerald-200">启用中</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'context' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">挂载知识空间 (3 个)</span>
                      <span className="text-[11px] text-[#2563EB] font-semibold bg-blue-50 px-2 py-0.5 rounded">草稿新增 1 项</span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">企业制度</div>
                          <div className="text-[11px] text-[#64748B]">正式基线已有 · 涵盖行政、合规、财务规范</div>
                        </div>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">BASE</span>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0F172A]">产品知识</div>
                          <div className="text-[11px] text-[#64748B]">正式基线已有 · 涵盖产品白皮书、架构规范</div>
                        </div>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">BASE</span>
                      </div>
                      <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#1E40AF]">数据治理规范</div>
                          <div className="text-[11px] text-[#2563EB]">草稿新增 · 涵盖数据标准、值域代码与血缘规则</div>
                        </div>
                        <span className="text-[10px] text-[#2563EB] bg-white px-2 py-0.5 rounded font-semibold border border-blue-200">+ DRAFT ADD</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'capabilities' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A]">能力模式</label>
                      <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1">
                        <div className="font-semibold text-[#1E40AF]">Wiki + RAG 混合研究 (草稿配置)</div>
                        <p className="text-[11px] text-[#2563EB]">
                          正式基线为「精准知识问答」，草稿已升级为支持多跳实体与稀疏/稠密混合召回的 Wiki + RAG 拓扑研究。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'model_autonomy' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                      <div>
                        <div className="font-semibold text-[#0F172A]">模型策略</div>
                        <div className="text-[11px] text-[#64748B]">质量优先 · 严禁无依据推测</div>
                      </div>
                      <span className="font-mono font-bold text-[#0F172A]">Quality First</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                      <div>
                        <div className="font-semibold text-[#0F172A]">最大自主程度</div>
                        <div className="text-[11px] text-[#64748B]">建议模式 · 执行任何写入需人工确认</div>
                      </div>
                      <span className="font-bold text-[#2563EB]">建议 (Suggest)</span>
                    </div>
                  </div>
                )}

                {activeSection === 'runtime' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-2">
                      <div className="font-bold text-[#0F172A]">WeKnora Runtime 绑定配置</div>
                      <p className="text-xs text-[#475569]">
                        由 Semovix 平台下发配置并由 WeKnora 引擎承载知识向量库与拓扑图计算。当前正式版本 v1.4 与 WeKnora 状态一致。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ─────────────────────────────────────────────────────────
            COLUMN C. RIGHT DRAFT INSPECTOR (280-300px)
            (Compact Summary-only Inspector, natural height)
        ───────────────────────────────────────────────────────── */}
        <aside className="w-[290px] bg-white border-l border-[#E2E8F0] p-4 shrink-0 overflow-y-auto select-none space-y-4">
          {/* Header */}
          <div className="pb-2 border-b border-[#F1F5F9]">
            <h3 className="font-bold text-xs text-[#0F172A] tracking-tight">
              当前草稿
            </h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              目标定义与执行规格预览
            </p>
          </div>

          {/* Compact Summary List */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">支持任务</span>
              <span className="font-bold text-[#0F172A]">3 项</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">知识范围</span>
              <span className="font-bold text-[#0F172A]">3 个知识空间</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">能力模式</span>
              <span className="font-bold text-[#2563EB]">Wiki + RAG 混合</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">模型策略</span>
              <span className="font-medium text-[#0F172A]">质量优先</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">自主程度</span>
              <span className="font-medium text-[#0F172A]">建议</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">运行引擎</span>
              <span className="font-semibold text-[#0F172A]">WeKnora</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">运行状态</span>
              <div className="flex items-center space-x-1 text-[#16A36A] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span>正常</span>
              </div>
            </div>
          </div>

          {/* Bottom Draft Notification Block */}
          <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1E40AF]">
              <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>2 项未发布修改</span>
            </div>
            <p className="text-[11px] text-[#3B82F6] leading-relaxed">
              新增《数据治理规范》知识空间并升级检索模式为 Wiki+RAG。
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="py-1.5 bg-white hover:bg-slate-50 text-[#1E40AF] border border-[#BFDBFE] rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs"
              >
                <Play className="w-3 h-3 text-[#2563EB]" />
                <span>测试草稿</span>
              </button>
              {onNavigateToPublish ? (
                <button
                  onClick={onNavigateToPublish}
                  className="py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>去发布</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={handleSaveDraft}
                  className="py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <Save className="w-3 h-3" />
                  <span>保存草稿</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: TEST DRAFT DIALOG (测试草稿沙盒)
      ───────────────────────────────────────────────────────────── */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsTestModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-[#E2E8F0] flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#0F172A]">
                    企业知识伙伴 · 草稿测试沙盒 (Draft Test Sandbox)
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    测试环境：包含 3 个知识空间与 Wiki+RAG 混合研究模式 (不影响线上 v1.4 正式版)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
              {testLogs.map((log, index) => (
                <div
                  key={index}
                  className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                      log.role === 'user'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-white border border-[#E2E8F0] text-[#0F172A] shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">{log.text}</div>
                    {log.sources && log.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#F1F5F9] text-[10px] text-[#64748B]">
                        <span className="font-semibold text-[#0F172A]">知识依据溯源：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {log.sources.map((src, i) => (
                            <span
                              key={i}
                              className="bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded border border-[#BFDBFE]"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isSendingQuery && (
                <div className="flex items-center space-x-2 text-xs text-[#64748B] p-2">
                  <div className="w-3.5 h-3.5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                  <span>正在执行 Wiki + RAG 拓扑知识检索与实体召回...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 bg-white border-t border-[#F1F5F9] flex items-center space-x-2 overflow-x-auto text-[11px]">
              <span className="text-[#94A3B8] shrink-0">快捷测试：</span>
              <button
                onClick={() => setTestQuery('数据治理规范对字段映射冲突有什么审核要求？')}
                className="px-2 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] rounded cursor-pointer shrink-0 truncate max-w-[240px]"
              >
                测试新增《数据治理规范》
              </button>
              <button
                onClick={() => setTestQuery('员工报销与差旅审批的流程规范是什么？')}
                className="px-2 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] rounded cursor-pointer shrink-0 truncate max-w-[240px]"
              >
                测试既有《企业制度》空间
              </button>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-[#E2E8F0] flex items-center space-x-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTestQuery()}
                placeholder="输入测试问题，验证草稿知识范围与回答模式..."
                className="flex-1 px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#0F172A]"
              />
              <button
                onClick={handleSendTestQuery}
                disabled={!testQuery.trim() || isSendingQuery}
                className="px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#94A3B8] text-white rounded-md text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>发送</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: RUNTIME DETAIL DIALOG (查看运行详情)
      ───────────────────────────────────────────────────────────── */}
      {isRuntimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsRuntimeModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-bold text-xs text-[#0F172A]">
                  WeKnora Runtime 运行监控详情
                </h3>
              </div>
              <button
                onClick={() => setIsRuntimeModalOpen(false)}
                className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">集群节点状态</span>
                  <span className="font-semibold text-[#16A36A]">3/3 Nodes Ready (Healthy)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">检索延迟 (P95)</span>
                  <span className="font-mono text-[#0F172A]">142 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">向量空间索引健康度</span>
                  <span className="font-semibold text-[#16A36A]">100% (Dense + Sparse Inverted)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">正式配置 Revision</span>
                  <span className="font-mono text-[#0F172A]">r37 (2026-08-25 16:40)</span>
                </div>
              </div>

              <div className="text-[11px] text-[#64748B] leading-relaxed">
                当前运行实例为「Enterprise Knowledge」。正式版本 v1.4 在 WeKnora 引擎中保持稳定运行，草稿配置未同步至线上引擎。
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsRuntimeModalOpen(false)}
                className="px-4 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold cursor-pointer"
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
