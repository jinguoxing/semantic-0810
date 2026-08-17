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
  currentNav?: 'home' | 'governance' | 'assets' | 'semantics' | 'asset_detail' | 'metric_detail' | 'data_standards' | 'create_data_element_standard' | 'create_value_domain_standard' | 'import_standards' | 'mapping_conflict_review' | 'standard_proposal_review' | 'metrics' | 'create_metric' | 'marketplace' | 'marketplace_resources' | 'multi_resource_request';
  onSelectNav?: (nav: 'home' | 'governance' | 'assets' | 'semantics' | 'asset_detail' | 'metric_detail' | 'data_standards' | 'create_data_element_standard' | 'create_value_domain_standard' | 'import_standards' | 'mapping_conflict_review' | 'standard_proposal_review' | 'metrics' | 'create_metric' | 'marketplace' | 'marketplace_resources' | 'multi_resource_request') => void;
  batchCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLauncher,
  onOpenProfile,
  currentNav = 'marketplace_resources',
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
            className="w-8 h-8 rounded-md bg-[#F8FAFC] hover:bg-[#EEF2FF] hover:text-[#2563EB] text-[#475569] border border-[#E2E8F0] flex items-center justify-center transition-all cursor-pointer"
            title="Semovix Enterprise AI Launcher"
          >
            <Grid className="w-4 h-4 text-[#334155]" />
          </button>

          {/* 2. Semovix Logo */}
          <div 
            onClick={() => onSelectNav && onSelectNav('home')}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-md bg-[#2563EB] flex items-center justify-center text-white font-bold shadow-2xs">
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
            AI 工作台
          </button>
          
          <button
            onClick={() => onSelectNav && onSelectNav('marketplace_resources')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentNav === 'marketplace' || currentNav === 'marketplace_resources' || currentNav === 'multi_resource_request'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            数据服务超市
          </button>

          <button
            onClick={() => onSelectNav && onSelectNav('metrics')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentNav === 'governance' || currentNav === 'metrics'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            业务语义
          </button>

          <button
            onClick={() => alert('知识网络：查看实体拓扑、语义本体与知识图谱服务')}
            className="px-3 py-1.5 rounded-md hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            知识网络
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
          placeholder="搜索资源名称、业务含义、业务对象或字段…"
          className="w-full pl-8 pr-12 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white text-[#0F172A] placeholder-[#94A3B8] transition-all"
        />
        <kbd className="absolute right-2.5 top-1.5 px-1.5 py-0.2 text-[10px] font-mono text-[#64748B] bg-white border border-[#CBD5E1] rounded shadow-2xs">
          ⌘ K
        </kbd>
      </div>

      {/* Right Area: Notifications, Help, User Avatar & Name */}
      <div className="flex items-center space-x-3.5 text-xs font-medium text-[#475569]">
        {/* Notification Bell */}
        <button
          onClick={() => alert('通知中心：暂无未读告警')}
          className="p-1.5 rounded-md hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors relative"
          title="通知消息"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] absolute top-1 right-1" />
        </button>

        {/* Help */}
        <button
          onClick={() => alert('Semovix 帮助与开发文档')}
          className="p-1.5 rounded-md hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
          title="帮助与文档"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-[#E2E8F0] hidden sm:block" />

        {/* User Profile */}
        <button
          onClick={onOpenProfile}
          className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-all pl-1"
          title="用户个人中心"
        >
          <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-2xs border border-[#1D4ED8]">
            <span>张</span>
          </div>
          <span className="text-xs font-bold text-[#172033] hidden sm:inline">
            张明
          </span>
        </button>
      </div>
    </header>
  );
};
;



