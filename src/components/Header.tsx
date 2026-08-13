import React from 'react';
import { 
  Search, 
  Bot, 
  Grid, 
  Bell,
  HelpCircle,
  Sparkles
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
  currentNav?: 'home' | 'governance' | 'assets' | 'semantics' | 'asset_detail' | 'data_standards' | 'create_data_element_standard' | 'create_value_domain_standard' | 'import_standards' | 'mapping_conflict_review' | 'standard_proposal_review';
  onSelectNav?: (nav: 'home' | 'governance' | 'assets' | 'semantics' | 'asset_detail' | 'data_standards' | 'create_data_element_standard' | 'create_value_domain_standard' | 'import_standards' | 'mapping_conflict_review' | 'standard_proposal_review') => void;
  batchCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLauncher,
  onOpenProfile,
  currentNav = 'governance',
  onSelectNav,
}) => {
  return (
    <header className="h-[64px] bg-white border-b border-[#E2E8F0] px-5 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none">
      {/* Left Area: Nine-dot Launcher + Semovix Logo + Primary Nav Menu */}
      <div className="flex items-center space-x-6">
        {/* 1. Nine-dot Launcher Icon */}
        <div className="flex items-center space-x-3">
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
        </div>

        {/* 3. Primary Top Navigation Menu */}
        <nav className="hidden lg:flex items-center space-x-1 text-xs font-semibold text-[#475569]">
          <button
            onClick={() => onSelectNav && onSelectNav('home')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentNav === 'home'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            AI工作台
          </button>
          <button
            onClick={() => alert('任务中心：显示全局数据治理与元数据扫描任务状态')}
            className="px-3 py-1.5 rounded-md hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            任务中心
          </button>
          <button
            onClick={() => onSelectNav && onSelectNav('governance')}
            className="px-3 py-1.5 rounded-md hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            业务语义
          </button>
          <button
            onClick={() => alert('数据服务超市：已打开 Semovix 数据资产与 API 消费服务中心')}
            className="px-3 py-1.5 rounded-md hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            数据服务超市
          </button>
          <button
            onClick={() => onSelectNav && onSelectNav('data_standards')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentNav === 'data_standards' || currentNav === 'create_data_element_standard' || currentNav === 'create_value_domain_standard' || currentNav === 'import_standards' || currentNav === 'mapping_conflict_review' || currentNav === 'standard_proposal_review'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            数据标准
          </button>
          <button
            onClick={() => onSelectNav && onSelectNav('semantics')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentNav === 'semantics'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            数据语义
          </button>
          <button
            onClick={() => onSelectNav && onSelectNav('asset_detail')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentNav === 'asset_detail'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            资产详情
          </button>
          <button
            onClick={() => onSelectNav && onSelectNav('assets')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentNav === 'assets'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            资产目录
          </button>
          <button
            onClick={() => alert('管理中心：显示组织机构、权限审批与数据连接配置')}
            className="px-3 py-1.5 rounded-md hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            管理中心
          </button>
        </nav>
      </div>

      {/* Global Search Bar (Center) */}
      <div className="relative hidden md:block w-72 lg:w-80">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="搜索数据资产、业务对象、指标…"
          className="w-full pl-8 pr-12 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#0F172A] placeholder-[#94A3B8] transition-all"
        />
        <kbd className="absolute right-2.5 top-1.5 px-1.5 py-0.2 text-[10px] font-mono text-[#64748B] bg-white border border-[#CBD5E1] rounded shadow-2xs">
          ⌘ K
        </kbd>
      </div>

      {/* Right Area: Notifications, Help, Xino | 犀诺 Partner, User Avatar */}
      <div className="flex items-center space-x-3.5 text-xs font-medium text-[#475569]">
        {/* Notification Bell */}
        <button
          onClick={() => alert('暂无新通知')}
          className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors relative"
          title="通知消息"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] absolute top-1 right-1" />
        </button>

        {/* Help */}
        <button
          onClick={() => alert('Semovix Data Assets 帮助中心文档')}
          className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
          title="帮助与文档"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-[#E2E8F0] hidden sm:block" />

        {/* Xino | 犀诺 AI Partner Button */}
        <button
          onClick={() => onSelectNav && onSelectNav('home')}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE] hover:bg-[#DBEAFE] cursor-pointer transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Xino｜犀诺</span>
        </button>

        {/* User Avatar */}
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
;



