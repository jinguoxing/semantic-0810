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
  GitCompare,
  Sliders,
  Check,
  Send,
  Layers,
  Building2,
  Paperclip,
  BookOpen,
  ShieldCheck,
  ListTodo,
  FileText,
  Clock,
  HelpCircle,
  X
} from 'lucide-react';

interface XinoHomeWorkspaceProps {
  onNavigateToGovernance?: () => void;
  onOpenLauncher?: () => void;
}

type ModeType = 'auto' | 'data' | 'knowledge' | 'governance';

export const XinoHomeWorkspace: React.FC<XinoHomeWorkspaceProps> = ({
  onNavigateToGovernance,
  onOpenLauncher
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [searchHistory, setSearchHistory] = useState('');
  const [selectedMode, setSelectedMode] = useState<ModeType>('auto');
  const [isModePopoverOpen, setIsModePopoverOpen] = useState(true); // Default open as per user prompt spec
  const [dataScope, setDataScope] = useState('上海市闵行区');
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
      iconBg: 'bg-indigo-50 text-[#4F46E5]',
      badge: '推荐'
    },
    {
      id: 'data' as ModeType,
      name: '数据工作',
      description: '查找数据、查询指标、分析和比较业务数据',
      icon: Database,
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'knowledge' as ModeType,
      name: '知识问答',
      description: '基于企业知识回答问题并提供来源依据',
      icon: BookOpen,
      iconBg: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 'governance' as ModeType,
      name: '治理工作',
      description: '处理数据理解、语义、质量等治理事项',
      icon: ShieldCheck,
      iconBg: 'bg-purple-50 text-purple-600'
    }
  ];

  const historyTasks = [
    { id: '1', title: 'pop_service_hotline 表语义推导与字段解析', time: '10分钟前', active: true },
    { id: '2', title: '闵行区政务工单高频热点问题聚类与分析', time: '2小时前' },
    { id: '3', title: '人口与公共服务热线跨表逻辑视图校验', time: '昨天' },
    { id: '4', title: '近30天热线响应效率与治理指标探查', time: '3天前' },
    { id: '5', title: '公共服务热线异常工单自动化标注流程', time: '1周前' }
  ];

  const filteredHistory = historyTasks.filter(item =>
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
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar (260px) */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0">
        {/* New Chat Button */}
        <div className="p-3.5 border-b border-slate-100 space-y-2">
          <button
            onClick={() => {
              setPromptInput('');
              setIsModePopoverOpen(false);
            }}
            className="w-full py-2 px-3 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>新建会话</span>
          </button>

          {/* Task Center Shortcut with Badge 14 */}
          <div
            onClick={onNavigateToGovernance}
            className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 text-xs transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-2">
              <ListTodo className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#4F46E5]" />
              <span className="font-bold text-slate-700 group-hover:text-[#4F46E5]">任务中心 / 待我处理</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              14
            </span>
          </div>
        </div>

        {/* Search Session Bar */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="搜索历史会话..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* History Sessions List */}
        <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          <div>
            <div className="px-2 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              <span>历史会话</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono">
                {filteredHistory.length}
              </span>
            </div>

            <div className="space-y-1">
              {filteredHistory.map((task) => (
                <div
                  key={task.id}
                  onClick={onNavigateToGovernance}
                  className={`p-2.5 rounded-lg text-xs transition-all cursor-pointer group flex flex-col ${
                    task.active
                      ? 'bg-indigo-50/70 text-[#4F46E5] font-semibold border border-indigo-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${task.active ? 'text-[#4F46E5]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="truncate">{task.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 pl-5 font-mono">
                    {task.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AI 引擎在线</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">v2.4 Pro</span>
        </div>
      </aside>

      {/* Main Center Content Workspace */}
      <main className="flex-1 flex flex-col justify-between items-center p-6 md:p-12 overflow-y-auto relative bg-gradient-to-b from-white via-slate-50/50 to-indigo-50/20">
        <div className="w-full max-w-2xl my-auto space-y-8 text-center">
          {/* Xino Brand Logo Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/70 text-[#4F46E5] text-xs font-bold shadow-2xs">
            <div className="w-5 h-5 rounded-md bg-[#4F46E5] text-white flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span>Xino ｜ 犀诺 智能伙伴</span>
          </div>

          {/* Main Titles */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              今天需要完成什么工作？
            </h1>
            <p className="text-sm text-slate-500 font-normal max-w-md mx-auto leading-relaxed">
              描述你的问题、目标或工作事项，Xino 会理解需求并协助推进。
            </p>
          </div>

          {/* Large Work Composer Input Box */}
          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-4 text-left space-y-3 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/10">
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="描述你想完成的事情…"
              rows={3}
              className="w-full text-sm text-slate-800 placeholder-slate-400 border-none focus:outline-none resize-none bg-transparent"
            />

            {/* Config & Scope Bar */}
            <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                {/* Attachment Button */}
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="上传附件"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Processing Mode Dropdown Trigger */}
                <div ref={popoverRef} className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setIsModePopoverOpen((prev) => !prev)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                      isModePopoverOpen
                        ? 'bg-indigo-50 text-[#4F46E5] border-indigo-200 ring-1 ring-indigo-500/20'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-transparent'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>{getModeLabel(selectedMode)}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isModePopoverOpen ? 'rotate-180 text-[#4F46E5]' : 'text-slate-400'}`} />
                  </button>

                  {/* Lightweight Popover (Processing Mode Selector V2 Final) */}
                  <AnimatePresence>
                    {isModePopoverOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 z-30 w-[340px] bg-white rounded-xl border border-[#E6EAF0] shadow-xl shadow-slate-900/12 p-3.5 space-y-2 text-left"
                      >
                        {/* Popover Header */}
                        <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-800 tracking-tight">
                            处理方式
                          </span>
                          <button
                            onClick={() => setIsModePopoverOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Options List */}
                        <div className="space-y-1.5">
                          {modesConfig.map((mode) => {
                            const IconComponent = mode.icon;
                            const isSelected = selectedMode === mode.id;

                            return (
                              <div
                                key={mode.id}
                                onClick={() => handleSelectMode(mode.id)}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 h-[64px] ${
                                  isSelected
                                    ? 'bg-[#EEF2FF] border-indigo-200/90 shadow-2xs'
                                    : 'bg-white hover:bg-[#F7F9FC] border-slate-100 hover:border-slate-200'
                                }`}
                              >
                                {/* Left Icon Badge */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${mode.iconBg}`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>

                                {/* Center Name + Description */}
                                <div className="flex-1 min-w-0 pr-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className={`text-xs font-bold ${isSelected ? 'text-[#4F46E5]' : 'text-slate-800'}`}>
                                      {mode.name}
                                    </span>
                                    {mode.badge && (
                                      <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-indigo-100 text-[#4F46E5]">
                                        {mode.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                                    {mode.description}
                                  </p>
                                </div>

                                {/* Right Radio Dot Indicator */}
                                <div className="shrink-0 mt-1">
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'border-[#4F46E5] bg-[#4F46E5]'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Data Scope Selector */}
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50/80 text-xs text-[#4F46E5] font-semibold border border-indigo-100 cursor-pointer hover:bg-indigo-100/60 transition-colors">
                  <Building2 className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>{dataScope}</span>
                </div>
              </div>

              {/* Submit / Send Button */}
              <button
                onClick={onNavigateToGovernance}
                className="px-4 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <span>发送</span>
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Quick Pill Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => handlePillClick('帮我查找与公共服务热线工单相关的全量表与字段')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 hover:text-[#4F46E5] font-semibold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>找数据</span>
            </button>

            <button
              onClick={() => handlePillClick('查询近 30 天服务热线工单按时响应率与解决率')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 hover:text-[#4F46E5] font-semibold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
              <span>问数据</span>
            </button>

            <button
              onClick={() => handlePillClick('分析各月份政务热线投诉量变动趋势与归因')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 hover:text-[#4F46E5] font-semibold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>做分析</span>
            </button>

            <button
              onClick={() => handlePillClick('查阅公共服务热线工单处理流程规范与术语表')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 hover:text-[#4F46E5] font-semibold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>问知识</span>
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="text-[11px] text-slate-400 font-medium">
          Semovix 企业 AI 原生语义智能平台 · 支持全自动化 Schema 识别与逻辑推导
        </div>
      </main>
    </div>
  );
};
