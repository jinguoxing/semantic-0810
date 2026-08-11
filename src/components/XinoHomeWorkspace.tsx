import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Bot,
  MessageSquare,
  Sparkles,
  Search,
  ChevronDown,
  Database,
  BarChart3,
  TrendingUp,
  Send,
  Building2,
  Paperclip,
  BookOpen,
  ShieldCheck,
  ListTodo,
  ChevronRight,
  ArrowRight,
  Check,
  Clock
} from 'lucide-react';

interface XinoHomeWorkspaceProps {
  onNavigateToGovernance?: () => void;
  onOpenLauncher?: () => void;
}

type ModeType = 'auto' | 'data' | 'knowledge' | 'governance';

export const XinoHomeWorkspace: React.FC<XinoHomeWorkspaceProps> = ({
  onNavigateToGovernance
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [searchHistory, setSearchHistory] = useState('');
  const [selectedMode, setSelectedMode] = useState<ModeType>('auto');
  const [isModePopoverOpen, setIsModePopoverOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [dataScope] = useState('上海市闵行区');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsModePopoverOpen(false);
      }
    };

    if (isModePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModePopoverOpen]);

  const modesConfig = [
    {
      id: 'auto' as ModeType,
      name: '自动',
      description: '由 Xino 根据你的目标自动判断',
      icon: Sparkles,
      iconColor: 'text-[#2563EB]',
      badge: '默认'
    },
    {
      id: 'data' as ModeType,
      name: '数据工作',
      description: '查找数据、查询指标、分析和比较业务数据',
      icon: Database,
      iconColor: 'text-[#2563EB]'
    },
    {
      id: 'knowledge' as ModeType,
      name: '知识问答',
      description: '基于企业知识回答问题并提供来源依据',
      icon: BookOpen,
      iconColor: 'text-[#10B981]'
    },
    {
      id: 'governance' as ModeType,
      name: '治理工作',
      description: '处理数据理解、语义、质量等治理事项',
      icon: ShieldCheck,
      iconColor: 'text-[#7C3AED]'
    }
  ];

  const historySessions = [
    { id: '1', title: '企业数据治理主要目标是什么？', time: '10分钟前', category: '今天', active: true },
    { id: '2', title: '分析闵行区老年人口趋势', time: '2小时前', category: '今天' },
    { id: '3', title: '找人口服务相关数据', time: '昨天', category: '昨天' },
    { id: '4', title: '老龄人口指标口径分析', time: '昨天', category: '昨天' },
    { id: '5', title: '数据集与数据资源有什么区别', time: '3天前', category: '更早' }
  ];

  const filteredHistory = historySessions.filter((item) =>
    item.title.toLowerCase().includes(searchHistory.toLowerCase())
  );

  const getModeLabel = (mode: ModeType) => {
    switch (mode) {
      case 'data':
        return '数据工作';
      case 'knowledge':
        return '知识问答';
      case 'governance':
        return '治理工作';
      case 'auto':
      default:
        return '自动';
    }
  };

  const handlePillClick = (promptText: string) => {
    setPromptInput(promptText);
  };

  const handleSelectMode = (mode: ModeType) => {
    setSelectedMode(mode);
    setIsModePopoverOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F7F9FC]">
      {/* =========================================================
          LEFT SESSION HISTORY SIDEBAR (~270px, Near-White #FCFCFD)
      ========================================================= */}
      <aside className="w-full md:w-[270px] bg-[#FCFCFD] border-r border-[#E6EAF0] flex flex-col shrink-0">
        
        {/* 1. Primary Button: + 新建会话 */}
        <div className="p-4 border-b border-[#F1F5F9] space-y-3">
          <button
            onClick={() => {
              setPromptInput('');
              setIsModePopoverOpen(false);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span>新建会话</span>
          </button>

          {/* 2. Task Center Light Entrance Card */}
          <div
            onClick={onNavigateToGovernance}
            className="p-2.5 rounded-lg bg-white hover:bg-[#EFF6FF]/70 border border-[#E2E8F0] hover:border-[#BFDBFE] text-xs transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center space-x-2">
              <ListTodo className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#2563EB]" />
              <span className="font-bold text-[#0F172A] group-hover:text-[#2563EB]">任务中心</span>
            </div>
            <div className="flex items-center space-x-1 text-[#2563EB] font-semibold text-[11px]">
              <span>待我处理 14</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 3. Session Search Box */}
        <div className="px-3.5 pt-3 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="搜索会话…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#1E293B] placeholder-[#94A3B8]"
            />
          </div>
        </div>

        {/* 4. Session History List (Grouped by "最近") */}
        <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          <div>
            <div className="px-1.5 mb-2 flex items-center justify-between text-[11px] font-bold text-[#94A3B8] tracking-tight">
              <span>最近</span>
            </div>

            <div className="space-y-1">
              {filteredHistory.map((session) => (
                <div
                  key={session.id}
                  onClick={onNavigateToGovernance}
                  className={`p-2.5 rounded-lg text-xs transition-all cursor-pointer group flex items-center justify-between ${
                    session.active
                      ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                      : 'text-[#334155] hover:bg-[#F1F5F9] border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate pr-2">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${session.active ? 'text-[#2563EB]' : 'text-[#94A3B8] group-hover:text-[#64748B]'}`} />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] font-mono shrink-0">
                    {session.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Bottom Light Entrance: 查看全部会话 > */}
        <div className="p-3 border-t border-[#F1F5F9] bg-[#FCFCFD] text-center">
          <button
            onClick={onNavigateToGovernance}
            className="text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors cursor-pointer inline-flex items-center space-x-1"
          >
            <span>查看全部会话</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* =========================================================
          CENTRAL XINO WORKSPACE (Light Cool Gray Canvas #F7F9FC)
      ========================================================= */}
      <main className="flex-1 flex flex-col justify-between items-center p-6 md:p-12 overflow-y-auto relative bg-[#F7F9FC]">
        <div className="w-full max-w-[860px] my-auto space-y-7 text-center">
          
          {/* Central Xino Brand Section */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-extrabold text-[#0F172A] tracking-wider uppercase font-mono">
              xino
            </span>
          </div>

          {/* Main Headline & Sub-headline */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              今天需要完成什么工作？
            </h1>
            <p className="text-xs md:text-sm text-[#64748B] font-normal leading-relaxed max-w-lg mx-auto">
              描述你的问题、目标或工作事项，Xino 会理解需求并协助推进。
            </p>
          </div>

          {/* =========================================================
              CORE COMPONENT: WORK COMPOSER (White Surface #FFFFFF)
          ========================================================= */}
          <div 
            className={`relative rounded-2xl p-[1px] transition-all duration-300 ${
              promptInput.trim().length > 0 || isInputFocused || isModePopoverOpen
                ? 'shadow-md ring-1 ring-black/5'
                : 'shadow-2xs'
            }`}
          >
            {/* Background & Border Layer (Clips spinning gradient to 1px thin border) */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
              {(promptInput.trim().length > 0 || isInputFocused || isModePopoverOpen) ? (
                <div className="absolute -inset-[150%] animate-google-spin opacity-100 bg-[conic-gradient(from_0deg,#4285F4_0deg,#EA4335_90deg,#FBBC05_180deg,#34A853_270deg,#4285F4_360deg)]" />
              ) : (
                <div className="absolute inset-0 border border-[#E2E8F0] rounded-2xl" />
              )}
              {/* Inner White Surface cutout (1px inset) */}
              <div className="absolute inset-[1px] bg-white rounded-[15px]" />
            </div>

            {/* Inner Interactive Surface (No middle line inside dialog) */}
            <div className="relative z-10 p-4 text-left space-y-2">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="描述你想完成的事情…"
                rows={3}
                className="w-full text-xs md:text-sm text-[#0F172A] placeholder-[#94A3B8] border-none focus:outline-none resize-none bg-transparent leading-relaxed"
              />

              {/* Composer Bottom Toolbar: 📎 | 自动 ▾ | 上海市闵行区 | 发送 */}
              <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                {/* 1. Attachment Icon */}
                <button
                  type="button"
                  onClick={() => setIsInputFocused(true)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#334155] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  title="添加附件"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* 2. 自动 ▾ (Mode Selector Button & Popover) */}
                <div ref={popoverRef} className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModePopoverOpen((prev) => !prev);
                      setIsInputFocused(true);
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                      isModePopoverOpen
                        ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                        : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]'
                    }`}
                  >
                    <span>{getModeLabel(selectedMode)}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isModePopoverOpen ? 'rotate-180 text-[#2563EB]' : 'text-[#94A3B8]'}`} />
                  </button>

                  {/* Mode Selector Popover (320-360px, Clean without area borders) */}
                  <AnimatePresence>
                    {isModePopoverOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 z-50 w-[340px] bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-3.5 space-y-2 text-left"
                      >
                        <div className="text-xs font-bold text-[#0F172A] pb-1">
                          处理方式
                        </div>

                        <div className="space-y-1">
                          {modesConfig.map((mode) => {
                            const isSelected = selectedMode === mode.id;

                            return (
                              <div
                                key={mode.id}
                                onClick={() => handleSelectMode(mode.id)}
                                className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start space-x-2.5 ${
                                  isSelected
                                    ? 'bg-[#EFF6FF]'
                                    : 'hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                    isSelected
                                      ? 'border-[#2563EB] bg-[#2563EB]'
                                      : 'border-[#CBD5E1] bg-white'
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <span className={`text-xs font-bold ${isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                                      {mode.name}
                                    </span>
                                    {mode.badge && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB]">
                                        {mode.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#64748B] mt-0.5 leading-normal">
                                    {mode.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. 上海市闵行区 Context Pill */}
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] text-xs text-[#334155] font-medium border border-[#E2E8F0]">
                  <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{dataScope}</span>
                </div>
              </div>

              {/* 4. Send Button */}
              <button
                onClick={onNavigateToGovernance}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                  promptInput.trim().length > 0
                    ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                    : 'bg-[#2563EB] text-white opacity-90'
                }`}
                title="发送工作目标"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

          {/* Quick Action Capsules (找数据 | 问数据 | 做分析 | 问知识) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              onClick={() => handlePillClick('查找公共服务热线相关的全量表与业务字段')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] text-xs text-[#334155] hover:text-[#2563EB] font-medium flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>找数据</span>
            </button>

            <button
              onClick={() => handlePillClick('查询近 30 天服务热线工单按时响应率与解决率')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] text-xs text-[#334155] hover:text-[#2563EB] font-medium flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>问数据</span>
            </button>

            <button
              onClick={() => handlePillClick('分析闵行区老年人口分布与服务诉求关联变动趋势')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] text-xs text-[#334155] hover:text-[#2563EB] font-medium flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
              <span>做分析</span>
            </button>

            <button
              onClick={() => handlePillClick('查阅公共服务热线工单处理流程规范与术语口径')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] text-xs text-[#334155] hover:text-[#2563EB] font-medium flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>问知识</span>
            </button>
          </div>

          {/* Continuation Bar: 继续上次工作 (Max 1 bar) */}
          <div className="pt-2">
            <div
              onClick={onNavigateToGovernance}
              className="w-full p-3.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] shadow-2xs flex items-center justify-between text-left cursor-pointer transition-all hover:bg-[#EFF6FF]/40 group"
            >
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#64748B] tracking-tight">
                  继续上次工作
                </div>
                <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  上海老年人口趋势分析
                </div>
                <div className="text-[11px] text-[#10B981] font-medium flex items-center space-x-1">
                  <Check className="w-3 h-3 text-[#10B981] stroke-[3]" />
                  <span>已完成数据准备 · 等待继续分析</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs font-bold text-[#2563EB] group-hover:underline">
                <span>继续</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
              </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-[11px] text-[#94A3B8] font-medium">
          Semovix 企业 AI 原生语义智能平台
        </div>
      </main>
    </div>
  );
};

