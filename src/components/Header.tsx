import React from 'react';
import { 
  Search, 
  Bot, 
  Grid, 
  Building2, 
  ChevronDown 
} from 'lucide-react';

interface HeaderProps {
  onRefresh?: () => void;
  onReanalyze?: () => void;
  onBatchConfirm?: () => void;
  onPreviewPublish?: () => void;
  onViewLineage?: () => void;
  onEnterModeling?: () => void;
  onOpenLauncher?: () => void;
  onOpenProfile?: () => void;
  isProfileOpen?: boolean;
  currentNav?: 'home' | 'governance';
  onSelectNav?: (nav: 'home' | 'governance') => void;
  batchCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLauncher,
  onOpenProfile,
  currentNav = 'home',
  onSelectNav,
}) => {
  return (
    <header className="h-[64px] bg-white border-b border-[#E2E8F0] px-5 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left Area */}
      <div className="flex items-center space-x-3.5">
        {/* 1. Nine-dot Launcher Icon */}
        <button
          onClick={onOpenLauncher}
          className="w-8 h-8 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF2FF] hover:text-[#2563EB] text-[#475569] border border-[#E2E8F0] flex items-center justify-center transition-all cursor-pointer"
          title="Semovix Enterprise AI Launcher"
        >
          <Grid className="w-4 h-4 text-[#334155]" />
        </button>

        {/* 2. Semovix Logo */}
        <div 
          onClick={() => onSelectNav && onSelectNav('home')}
          className="flex items-center space-x-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold shadow-2xs">
            <span className="text-base font-mono tracking-tighter">S</span>
          </div>
          <span className="font-extrabold text-base text-[#0F172A] tracking-tight">
            Semovix
          </span>
        </div>

        <span className="text-[#CBD5E1]">/</span>

        {/* 3. Current Page Name */}
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1E293B]">
          <Bot className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>{currentNav === 'home' ? 'Xino 智能伙伴' : '语义治理与资产化'}</span>
        </div>

        {/* Module Switcher Tag for Demo */}
        {currentNav === 'governance' && (
          <button
            onClick={() => onSelectNav && onSelectNav('home')}
            className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE] hover:bg-[#DBEAFE] cursor-pointer ml-2"
          >
            ← 返回 Xino 智能伙伴
          </button>
        )}
      </div>

      {/* Right Area */}
      <div className="flex items-center space-x-3.5">
        {/* 1. Workspace Selector */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155] font-medium cursor-pointer hover:border-[#CBD5E1] transition-colors">
          <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>工作组织｜上海市闵行区</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] ml-1">
            默认
          </span>
          <ChevronDown className="w-3 h-3 text-[#94A3B8] ml-0.5" />
        </div>

        {/* 2. Global Search Box */}
        <div className="relative hidden md:block w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="搜索功能、任务、业务对象、数据或知识…"
            className="w-full pl-8 pr-12 py-1 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#1E293B] placeholder-[#94A3B8]"
          />
          <kbd className="absolute right-2.5 top-1.5 px-1.5 py-0.2 text-[10px] font-mono text-[#64748B] bg-white border border-[#CBD5E1] rounded shadow-2xs">
            ⌘ K
          </kbd>
        </div>

        <div className="h-4 w-[1px] bg-[#E2E8F0] hidden sm:block" />

        {/* 3. User Avatar */}
        <button
          onClick={onOpenProfile}
          className="flex items-center space-x-2 cursor-pointer hover:opacity-85 transition-all"
          title="个人中心"
        >
          <div className="w-8 h-8 rounded-full bg-[#1E293B] text-white font-bold text-xs flex items-center justify-center shadow-2xs border border-[#334155]">
            <span>A</span>
          </div>
        </button>
      </div>
    </header>
  );
};



