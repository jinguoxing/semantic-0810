import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  GitBranch,
  Play,
  Save,
  ExternalLink,
  ChevronRight,
  FileText,
  Info,
  Layers,
  Database,
  Sparkles,
  Sliders,
  Cpu,
  Shield,
  Send,
  X,
  Bot
} from 'lucide-react';
import {
  AgentItem,
  AgentDefinitionDetail,
  INITIAL_AGENT_DEFINITIONS
} from '../data/agentRegistryData';

export interface AgentDefinitionWorkspaceProps {
  agentId?: string;
  agent?: AgentItem;
  definition?: AgentDefinitionDetail;
  onBackToRegistry: () => void;
  onNavigateToPublish?: () => void;
  onSaveDraft?: (updatedDef: AgentDefinitionDetail) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AgentDefinitionWorkspace: React.FC<AgentDefinitionWorkspaceProps> = ({
  agentId,
  agent,
  definition,
  onBackToRegistry,
  onNavigateToPublish,
  onSaveDraft,
  addToast
}) => {
  // Left Section Navigation State
  const [activeSection, setActiveSection] = useState<
    'overview' | 'basic_info' | 'tasks' | 'context' | 'capabilities' | 'model_autonomy' | 'runtime'
  >('overview');

  // Compute resolved definition with fallback
  const resolvedDef = useMemo<AgentDefinitionDetail>(() => {
    if (definition && (!agentId || definition.agentId === `agt_${agentId}` || definition.agentId === agentId || definition.name === agent?.name)) {
      return definition;
    }
    if (agentId && INITIAL_AGENT_DEFINITIONS[agentId]) {
      return INITIAL_AGENT_DEFINITIONS[agentId];
    }
    if (definition) return definition;
    if (agent) {
      if (INITIAL_AGENT_DEFINITIONS[agent.id]) {
        return INITIAL_AGENT_DEFINITIONS[agent.id];
      }
      // Derive definition from agentItem
      const isKnowledge = agent.runtimeEngine === 'WeKnora';
      const isGovernance = agent.avatarType === 'governance';
      return {
        agentId: `agt_${agent.id}`,
        name: agent.name,
        responsibility: agent.responsibility,
        owner: agent.owner,
        agentType: agent.agentType,
        category: agent.category,
        formalVersion: agent.formalVersion,
        status: agent.status,
        runtimeEngine: agent.runtimeEngine,
        runtimeBinding: agent.runtimeBinding !== undefined ? agent.runtimeBinding : (agent.formalVersion ? 'ACTIVE' : null),
        runtimeRevision: agent.runtimeRevision || (agent.formalVersion ? 'r37' : null),
        lastReleaseTime: agent.releaseTime,
        lastSyncTime: agent.engineSyncStatus || (agent.formalVersion ? '已同步' : null),
        tasks: agent.allTasks.map((t, idx) => ({
          id: `task_${idx}`,
          name: t,
          desc: `受管支持任务 · ${t}`,
          status: 'ACTIVE'
        })),
        contextSources: [
          {
            id: 'c_1',
            name: isKnowledge ? '企业知识空间' : isGovernance ? '数据标准与业务对象' : '企业指标注册表',
            desc: agent.formalVersion ? '正式基线已有' : '草稿初始化',
            type: agent.formalVersion ? 'BASE' : 'DRAFT_NEW'
          }
        ],
        capabilityMode: isKnowledge ? '精准知识问答' : isGovernance ? '语义合规审查与标准对齐' : '指标计算与多维归因',
        capabilityDesc: isKnowledge ? '企业知识与制度检索增强' : isGovernance ? '数据标准比对与对象映射' : '语义模型与指标下钻计算',
        modelStrategy: isKnowledge ? '质量优先' : isGovernance ? '严谨与一致性优先' : '代码与逻辑优先',
        modelStrategyDesc: '以企业事实与规范为第一准则',
        maxAutonomy: isGovernance ? '提议' : '建议',
        maxAutonomyDesc: isGovernance ? '生成待裁决治理变更提案' : '以提供方案与依据为主',
        draftChanges: agent.hasDraft && agent.formalVersion
          ? [{ field: '草稿修改', changeText: agent.draftNote || '存在草稿变更', tag: 'DRAFT' }]
          : [],
        testSandbox: {
          welcomeMessage: `您好，我是「${agent.name} (${agent.formalVersion ? `正式版本 · ${agent.formalVersion}` : '未发布草稿'})」。请输入您想验证的问题。`,
          suggestedQueries: [`测试 ${agent.name} 核心支持任务`],
          sampleResponses: [],
          defaultResponse: {
            reply: `[${agent.name}] 已解析您的请求。当前运行环境配置正常。`,
            sources: [`${agent.runtimeEngine} Runtime`]
          }
        }
      };
    }
    return INITIAL_AGENT_DEFINITIONS['enterprise_knowledge'];
  }, [definition, agent, agentId]);

  // Local draft state
  const [currentDef, setCurrentDef] = useState<AgentDefinitionDetail>(resolvedDef);

  useEffect(() => {
    setCurrentDef(resolvedDef);
  }, [resolvedDef]);

  // Modals / Drawers
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRuntimeModalOpen, setIsRuntimeModalOpen] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testLogs, setTestLogs] = useState<Array<{ role: 'user' | 'agent'; text: string; sources?: string[] }>>([]);
  const [isSendingQuery, setIsSendingQuery] = useState(false);

  // Initialize test logs whenever currentDef changes
  useEffect(() => {
    setTestLogs([
      {
        role: 'agent',
        text: currentDef.testSandbox.welcomeMessage
      }
    ]);
  }, [currentDef]);

  const handleSendTestQuery = () => {
    if (!testQuery.trim()) return;
    const query = testQuery.trim();
    setTestLogs((prev) => [...prev, { role: 'user', text: query }]);
    setTestQuery('');
    setIsSendingQuery(true);

    setTimeout(() => {
      setIsSendingQuery(false);
      // Search for sample responses match
      const matched = currentDef.testSandbox.sampleResponses.find((sr) =>
        query.toLowerCase().includes(sr.trigger.toLowerCase())
      );

      if (matched) {
        setTestLogs((prev) => [
          ...prev,
          {
            role: 'agent',
            text: matched.reply,
            sources: matched.sources
          }
        ]);
      } else {
        setTestLogs((prev) => [
          ...prev,
          {
            role: 'agent',
            text: currentDef.testSandbox.defaultResponse.reply,
            sources: currentDef.testSandbox.defaultResponse.sources
          }
        ]);
      }
    }, 600);
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(currentDef);
    if (currentDef.formalVersion) {
      addToast?.(
        'success',
        '草稿已保存',
        `「${currentDef.name}」草稿已保存至本地工作区，线上 ${currentDef.formalVersion} 正式版保持稳定运行`
      );
    } else {
      addToast?.(
        'success',
        '草稿已保存',
        `「${currentDef.name}」未发布草稿已保存，待完成验证后发布首个正式版本`
      );
    }
  };

  const isFirstCreationState = !currentDef.formalVersion;

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
              <span
                onClick={onBackToRegistry}
                className="hover:text-[#0F172A] cursor-pointer transition-colors"
              >
                智能体中心
              </span>
              <span>/</span>
              <span className="text-[#0F172A] font-medium truncate">{currentDef.name}</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <h1 className="text-sm font-bold text-[#0F172A] tracking-tight truncate">
                {currentDef.name}
              </h1>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200/60 shrink-0">
                {currentDef.agentType}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Exactly 3 Status Tags + Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Status Tag 1: 正式版本 (v1.4 / 暂无) */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#334155]">
            <span className="text-[#64748B]">正式版本</span>
            {currentDef.formalVersion ? (
              <span className="font-mono font-semibold text-[#0F172A]">{currentDef.formalVersion}</span>
            ) : (
              <span className="font-semibold text-[#94A3B8]">暂无</span>
            )}
          </div>

          {/* Status Tag 2: 草稿状态 (未发布草稿 / 草稿有 N 项修改 / 正式版本) */}
          {isFirstCreationState ? (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <GitBranch className="w-3 h-3 text-amber-600" />
              <span className="font-semibold">未发布草稿</span>
            </div>
          ) : currentDef.draftChanges && currentDef.draftChanges.length > 0 ? (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs text-[#1E40AF]">
              <GitBranch className="w-3 h-3 text-[#2563EB]" />
              <span className="font-semibold">草稿有 {currentDef.draftChanges.length} 项修改</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#334155]">
              <GitBranch className="w-3 h-3 text-[#64748B]" />
              <span className="font-semibold">正式版本 (已同步)</span>
            </div>
          )}

          {/* Status Tag 3: 运行引擎 / 状态 */}
          {currentDef.runtimeBinding === 'ACTIVE' ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded text-xs text-[#334155]">
              <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
              <span className="font-medium text-[#0F172A]">{currentDef.runtimeEngine} · 正常</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded text-xs text-[#334155]">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-medium text-[#0F172A]">目标引擎 · {currentDef.runtimeEngine}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#E2E8F0]">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Play className="w-3 h-3 text-[#2563EB]" />
              <span>测试草盒</span>
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
          {currentDef.responsibility}
        </p>
        <span className="text-[11px] font-mono text-[#94A3B8] hidden md:inline">
          Agent ID: {currentDef.agentId} · {currentDef.runtimeEngine} Runtime {currentDef.formalVersion ? `(${currentDef.formalVersion})` : '(Draft)'}
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
                {currentDef.draftChanges.some(d => d.field.includes('范围') || d.field.includes('知识')) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" title="包含草稿修改" />
                )}
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
                {currentDef.isCapabilityUpgraded && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" title="包含草稿修改" />
                )}
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
                    查看「{currentDef.name}」当前职责、正式基线、草稿状态与运行情况。
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
                    {currentDef.responsibility}
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
                      {isFirstCreationState ? '基于新创建草稿初始定义' : '基于当前草稿配置'}
                    </p>
                  </div>

                  {/* 4 horizontal items in ONE single card */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-[#F1F5F9]">
                    {/* Item 1: 支持任务 */}
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">支持任务</div>
                      <div className="text-xs font-bold text-[#0F172A]">
                        {currentDef.tasks.length} 项
                      </div>
                      <div className="text-[10px] text-[#94A3B8] truncate" title={currentDef.tasks.map(t => t.name).join(' · ')}>
                        {currentDef.tasks.map(t => t.name).join(' · ')}
                      </div>
                    </div>

                    {/* Item 2: 知识/数据范围 */}
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">范围/空间</div>
                      <div className="text-xs font-bold text-[#0F172A]">
                        {currentDef.contextSources.length} 项
                      </div>
                      <div className="text-[10px] text-[#94A3B8] truncate" title={currentDef.contextSources.map(c => c.name).join(' · ')}>
                        {currentDef.contextSources.map(c => c.name).join(' · ')}
                      </div>
                    </div>

                    {/* Item 3: 能力模式 */}
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">能力模式</div>
                      <div className="text-xs font-bold text-[#2563EB] truncate" title={currentDef.capabilityMode}>
                        {currentDef.capabilityMode}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] truncate" title={currentDef.capabilityDesc}>
                        {currentDef.capabilityDesc}
                      </div>
                    </div>

                    {/* Item 4: 运行引擎 */}
                    <div className="space-y-1">
                      <div className="text-[11px] text-[#64748B]">运行引擎</div>
                      <div className="text-xs font-bold text-[#0F172A]">
                        {currentDef.runtimeEngine}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] truncate">
                        {currentDef.runtimeBinding === 'ACTIVE'
                          ? (currentDef.runtimeEngine === 'WeKnora' ? 'Enterprise Knowledge 实例' : 'Semovix Native 实例')
                          : '待首次发布绑定'}
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
                      {isFirstCreationState
                        ? '尚未发布正式版本，当前所有配置仅存在于未发布草稿中。'
                        : `当前线上正式运行的是 ${currentDef.formalVersion}，${
                            currentDef.draftChanges && currentDef.draftChanges.length > 0
                              ? `草稿有 ${currentDef.draftChanges.length} 项修改尚未影响正式运行。`
                              : '草稿与正式版一致。'
                          }`}
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F1F5F9] text-xs">
                      {/* Left Column (Items 1-6) */}
                      <div className="divide-y divide-[#F1F5F9]">
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">正式版本</dt>
                          <dd className="font-mono font-semibold text-[#0F172A]">
                            {currentDef.formalVersion ? (
                              currentDef.formalVersion
                            ) : (
                              <span className="text-[#94A3B8]">暂无 (未发布)</span>
                            )}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">Owner</dt>
                          <dd className="font-medium text-[#0F172A]">{currentDef.owner}</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">支持任务</dt>
                          <dd className="text-[#0F172A]">
                            {currentDef.formalVersion
                              ? `${currentDef.tasks.filter(t => t.status === 'ACTIVE').length} 项`
                              : <span className="text-[#94A3B8]">暂无正式基线</span>}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">范围/空间</dt>
                          <dd className="font-semibold text-[#0F172A]">
                            {currentDef.formalVersion
                              ? `${currentDef.contextSources.filter(c => c.type === 'BASE').length} 项`
                              : <span className="text-[#94A3B8]">暂无正式基线</span>}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">能力模式</dt>
                          <dd className="font-semibold text-[#0F172A]">
                            {currentDef.formalVersion
                              ? (currentDef.baseCapabilityMode || currentDef.capabilityMode)
                              : <span className="text-[#94A3B8]">暂无正式基线</span>}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">模型策略</dt>
                          <dd className="text-[#0F172A]">{currentDef.modelStrategy}</dd>
                        </div>
                      </div>

                      {/* Right Column (Items 7-11) */}
                      <div className="divide-y divide-[#F1F5F9]">
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">最大自主程度</dt>
                          <dd className="text-[#0F172A]">{currentDef.maxAutonomy}</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">目标运行引擎</dt>
                          <dd className="font-semibold text-[#0F172A]">{currentDef.runtimeEngine}</dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">正式运行配置</dt>
                          <dd>
                            {currentDef.runtimeBinding === 'ACTIVE' ? (
                              <span className="font-mono text-[#0F172A]">{currentDef.runtimeRevision || 'r37'}</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">尚未建立</span>
                            )}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">同步状态</dt>
                          <dd>
                            {currentDef.runtimeBinding === 'ACTIVE' ? (
                              <span className="font-medium text-[#16A36A]">已同步</span>
                            ) : (
                              <span className="text-[#94A3B8]">未绑定</span>
                            )}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <dt className="text-[#64748B]">最近发布</dt>
                          <dd className="text-[#64748B]">
                            {currentDef.lastReleaseTime || <span className="text-[#94A3B8]">暂无发布记录</span>}
                          </dd>
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
                      {isFirstCreationState
                        ? '当前智能体处于「首次创建未发布草稿」状态。'
                        : currentDef.draftChanges && currentDef.draftChanges.length > 0
                        ? `当前草稿相对正式版本 ${currentDef.formalVersion} 有 ${currentDef.draftChanges.length} 项修改。`
                        : `当前草稿与正式版本 ${currentDef.formalVersion} 保持一致，暂无未发布修改。`}
                    </p>
                  </div>

                  {isFirstCreationState ? (
                    <div className="p-4 bg-white border border-amber-200/80 rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="font-bold text-xs text-[#0F172A]">未发布草稿 (首次创建)</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                          NEW DRAFT
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">
                        已根据所选模板初始化基本定义，支持任务（{currentDef.tasks.length} 项：{currentDef.tasks.map(t => t.name).join('、')}）与能力模式预设已载入。
                      </p>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#64748B] space-y-1">
                        <div className="font-semibold text-[#0F172A]">正式运行配置：尚未建立</div>
                        <div>待在测试沙盒中验证核心问答/执行无误后，即可前往发布验证工作区发布为首个正式版本 (v1.0)。</div>
                      </div>
                    </div>
                  ) : currentDef.draftChanges && currentDef.draftChanges.length > 0 ? (
                    <div className="space-y-2">
                      {currentDef.draftChanges.map((diff, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#0F172A]">{diff.field}</div>
                            <div className="font-mono text-[#2563EB] font-semibold text-[11px]">
                              {diff.changeText}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {diff.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]">
                      当前草稿与正式版本 {currentDef.formalVersion} 保持一致，暂无未发布修改。
                    </div>
                  )}

                  <p className="text-[11px] text-[#94A3B8] pt-1">
                    草稿修改不会影响当前正式运行，完成测试与发布后才会生效。
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
                      {isFirstCreationState
                        ? `「${currentDef.name}」将以 ${currentDef.runtimeEngine} 作为目标运行引擎；当前处于首次创建草稿阶段，正式运行配置尚未建立。`
                        : `「${currentDef.name}」的运行与推理由 ${currentDef.runtimeEngine} Runtime 执行；Semovix 负责智能体定义、任务、权限和正式版本管理。`}
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-2xs space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                          {currentDef.runtimeEngine === 'WeKnora' ? 'WK' : 'SN'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#0F172A]">
                            {currentDef.runtimeEngine} Runtime
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            {currentDef.runtimeEngine === 'WeKnora' ? 'Knowledge Agent Execution Engine' : 'Native Semantic Execution Engine'}
                          </div>
                        </div>
                      </div>

                      {currentDef.runtimeBinding === 'ACTIVE' ? (
                        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-50 text-[#16A36A] border border-emerald-200/60 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                          <span>运行正常</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>正式运行配置：尚未建立</span>
                        </div>
                      )}
                    </div>

                    {/* Runtime Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-[#64748B] block">目标运行引擎</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5 block">{currentDef.runtimeEngine}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">运行状态</span>
                        <span className={`font-semibold mt-0.5 block ${currentDef.runtimeBinding === 'ACTIVE' ? 'text-[#16A36A]' : 'text-amber-600'}`}>
                          {currentDef.runtimeBinding === 'ACTIVE' ? '● 正常' : '未绑定 / 草稿阶段'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">绑定正式版本</span>
                        <span className="font-mono font-semibold text-[#0F172A] mt-0.5 block">
                          {currentDef.formalVersion || '暂无 (待发布)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">同步状态</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5 block">
                          {currentDef.runtimeBinding === 'ACTIVE' ? '正式版本已同步' : '尚未建立正式配置'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">Runtime Revision</span>
                        <span className="font-mono font-semibold text-[#0F172A] mt-0.5 block">
                          {currentDef.runtimeRevision || '暂无'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B] block">最近同步</span>
                        <span className="text-[#475569] mt-0.5 block">
                          {currentDef.lastSyncTime || '尚未同步'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-3 border-t border-[#F1F5F9] flex justify-end">
                      {currentDef.runtimeBinding === 'ACTIVE' ? (
                        <button
                          onClick={() => setIsRuntimeModalOpen(true)}
                          className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>查看运行详情</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsTestModalOpen(true)}
                          className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Play className="w-3 h-3 text-[#2563EB]" />
                          <span>在沙盒中试运行</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* If other section selected in left nav: Dedicated Section Workspace View */
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
                      受管智能体定义工作区 · {currentDef.name}
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
                        value={currentDef.name}
                        onChange={(e) => setCurrentDef({ ...currentDef, name: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A]">业务职责定义</label>
                      <textarea
                        rows={4}
                        value={currentDef.responsibility}
                        onChange={(e) => setCurrentDef({ ...currentDef, responsibility: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A] leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A]">责任组织 (Owner)</label>
                      <input
                        type="text"
                        value={currentDef.owner}
                        onChange={(e) => setCurrentDef({ ...currentDef, owner: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'tasks' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                    <div className="font-bold text-[#0F172A]">
                      当前受管支持任务 ({currentDef.tasks.length} 项)
                    </div>
                    <div className="space-y-2">
                      {currentDef.tasks.map((task, idx) => (
                        <div
                          key={task.id || idx}
                          className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-[#0F172A]">{idx + 1}. {task.name}</div>
                            <div className="text-[11px] text-[#64748B]">{task.desc}</div>
                          </div>
                          <span className="text-[10px] bg-emerald-50 text-[#16A36A] px-2 py-0.5 rounded font-medium border border-emerald-200">
                            {task.status === 'DRAFT_NEW' ? '草稿配置' : '启用中'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'context' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">
                        挂载资产与范围 ({currentDef.contextSources.length} 个)
                      </span>
                    </div>
                    <div className="space-y-2">
                      {currentDef.contextSources.map((ctx, idx) => (
                        <div
                          key={ctx.id || idx}
                          className={`p-3 rounded-md flex items-center justify-between ${
                            ctx.type === 'DRAFT_NEW'
                              ? 'bg-[#EFF6FF] border border-[#BFDBFE]'
                              : 'bg-[#F8FAFC] border border-[#E2E8F0]'
                          }`}
                        >
                          <div>
                            <div className={`font-semibold ${ctx.type === 'DRAFT_NEW' ? 'text-[#1E40AF]' : 'text-[#0F172A]'}`}>
                              {ctx.name}
                            </div>
                            <div className={`text-[11px] ${ctx.type === 'DRAFT_NEW' ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
                              {ctx.desc}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              ctx.type === 'DRAFT_NEW'
                                ? 'text-[#2563EB] bg-white font-semibold border border-blue-200'
                                : 'text-slate-500 bg-slate-100'
                            }`}
                          >
                            {ctx.type === 'DRAFT_NEW' ? '+ DRAFT' : 'BASE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'capabilities' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A]">能力模式</label>
                      <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1">
                        <div className="font-semibold text-[#1E40AF]">
                          {currentDef.capabilityMode}
                        </div>
                        <p className="text-[11px] text-[#2563EB]">
                          {currentDef.capabilityDesc}
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
                        <div className="text-[11px] text-[#64748B]">{currentDef.modelStrategyDesc}</div>
                      </div>
                      <span className="font-mono font-bold text-[#0F172A]">{currentDef.modelStrategy}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                      <div>
                        <div className="font-semibold text-[#0F172A]">最大自主程度</div>
                        <div className="text-[11px] text-[#64748B]">{currentDef.maxAutonomyDesc}</div>
                      </div>
                      <span className="font-bold text-[#2563EB]">{currentDef.maxAutonomy}</span>
                    </div>
                  </div>
                )}

                {activeSection === 'runtime' && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-2">
                      <div className="font-bold text-[#0F172A]">{currentDef.runtimeEngine} Runtime 绑定配置</div>
                      <p className="text-xs text-[#475569]">
                        由 Semovix 平台下发配置并由 {currentDef.runtimeEngine} 引擎承载执行计算。
                        {currentDef.runtimeBinding === 'ACTIVE'
                          ? ` 当前正式版本 ${currentDef.formalVersion} 与引擎状态一致。`
                          : ' 当前处于草稿阶段，正式运行配置尚未建立。'}
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
              <span className="font-bold text-[#0F172A]">{currentDef.tasks.length} 项</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">范围/空间</span>
              <span className="font-bold text-[#0F172A]">{currentDef.contextSources.length} 项</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">能力模式</span>
              <span className="font-bold text-[#2563EB] truncate max-w-[140px]" title={currentDef.capabilityMode}>
                {currentDef.capabilityMode}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">模型策略</span>
              <span className="font-medium text-[#0F172A]">{currentDef.modelStrategy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">自主程度</span>
              <span className="font-medium text-[#0F172A]">{currentDef.maxAutonomy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">目标/引擎</span>
              <span className="font-semibold text-[#0F172A]">{currentDef.runtimeEngine}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">运行状态</span>
              {currentDef.runtimeBinding === 'ACTIVE' ? (
                <div className="flex items-center space-x-1 text-[#16A36A] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                  <span>正常</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-amber-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>未绑定 (草稿)</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Draft Notification Block */}
          {isFirstCreationState ? (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                <GitBranch className="w-3.5 h-3.5 text-amber-700" />
                <span>未发布草稿 (首次创建)</span>
              </div>
              <div className="text-[11px] text-amber-800 space-y-0.5">
                <div>正式版本：暂无</div>
                <div>目标运行引擎：{currentDef.runtimeEngine}</div>
                <div className="font-medium text-amber-900">正式运行配置：尚未建立</div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="py-1.5 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <Play className="w-3 h-3 text-amber-700" />
                  <span>测试草盒</span>
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
          ) : currentDef.draftChanges && currentDef.draftChanges.length > 0 ? (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1E40AF]">
                <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{currentDef.draftChanges.length} 项未发布修改</span>
              </div>
              <p className="text-[11px] text-[#3B82F6] leading-relaxed">
                草稿与线上正式版本 {currentDef.formalVersion} 存在差异，发布后生效。
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="py-1.5 bg-white hover:bg-slate-50 text-[#1E40AF] border border-[#BFDBFE] rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <Play className="w-3 h-3 text-[#2563EB]" />
                  <span>测试草盒</span>
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
          ) : (
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#334155]">
                <GitBranch className="w-3.5 h-3.5 text-[#64748B]" />
                <span>草稿与正式版本一致</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                线上正式版本 {currentDef.formalVersion} 正在稳定运行。
              </p>
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="w-full py-1.5 bg-white hover:bg-slate-50 text-[#334155] border border-[#CBD5E1] rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs"
              >
                <Play className="w-3 h-3 text-[#2563EB]" />
                <span>运行验证沙盒</span>
              </button>
            </div>
          )}
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
                    {currentDef.name} · 草稿测试沙盒 (Draft Test Sandbox)
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    测试环境：包含 {currentDef.tasks.length} 项支持任务与 {currentDef.capabilityMode} (
                    {currentDef.formalVersion ? `不影响线上 ${currentDef.formalVersion} 正式版` : '首次创建未发布环境'}
                    )
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
                        <span className="font-semibold text-[#0F172A]">依据溯源：</span>
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
                  <span>正在执行草稿意图解析与沙盒推理...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            {currentDef.testSandbox.suggestedQueries && currentDef.testSandbox.suggestedQueries.length > 0 && (
              <div className="px-4 py-2 bg-white border-t border-[#F1F5F9] flex items-center space-x-2 overflow-x-auto text-[11px]">
                <span className="text-[#94A3B8] shrink-0">快捷测试：</span>
                {currentDef.testSandbox.suggestedQueries.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => setTestQuery(sq)}
                    className="px-2 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] rounded cursor-pointer shrink-0 truncate max-w-[280px]"
                    title={sq}
                  >
                    {sq}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-[#E2E8F0] flex items-center space-x-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTestQuery()}
                placeholder="输入测试语句，验证草稿支持任务与回答模式..."
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
                  {currentDef.runtimeEngine} Runtime 运行监控详情
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
                  <span className="text-[#64748B]">检索/执行延迟 (P95)</span>
                  <span className="font-mono text-[#0F172A]">142 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">运行实例</span>
                  <span className="font-semibold text-[#0F172A]">
                    {currentDef.runtimeEngine === 'WeKnora' ? 'Enterprise Knowledge 实例' : 'Semovix Native Cluster'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">正式配置 Revision</span>
                  <span className="font-mono text-[#0F172A]">
                    {currentDef.runtimeRevision || 'r37'} ({currentDef.lastReleaseTime || '已发布'})
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#64748B] leading-relaxed">
                当前运行实例已与正式版本 {currentDef.formalVersion} 绑定。草稿配置未同步至线上引擎，草稿修改仅在沙盒中生效。
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
