import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bot, 
  Grid, 
  Bell,
  HelpCircle,
  Sparkles,
  ChevronDown,
  FolderTree,
  BarChart3,
  BookOpen,
  Table,
  Layers,
  ArrowRight
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
  currentNav?: 'home' | 'governance' | 'assets' | 'semantics' | 'asset_detail' | 'metric_detail' | 'business_object_detail' | 'data_standards' | 'create_data_element_standard' | 'create_value_domain_standard' | 'import_standards' | 'mapping_conflict_review' | 'standard_proposal_review' | 'metrics' | 'create_metric' | 'marketplace' | 'marketplace_resources' | 'multi_resource_request' | 'my_requests' | 'access_review' | 'access_review_detail';
  onSelectNav?: (nav: 'home' | 'governance' | 'assets' | 'semantics' | 'asset_detail' | 'metric_detail' | 'business_object_detail' | 'data_standards' | 'create_data_element_standard' | 'create_value_domain_standard' | 'import_standards' | 'mapping_conflict_review' | 'standard_proposal_review' | 'metrics' | 'create_metric' | 'marketplace' | 'marketplace_resources' | 'multi_resource_request' | 'my_requests' | 'access_review' | 'access_review_detail') => void;
  batchCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLauncher,
  onOpenProfile,
  currentNav = 'marketplace_resources',
  onSelectNav,
}) => {
  const [isSemanticsDropdownOpen, setIsSemanticsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSemanticsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSemanticsActive = currentNav === 'governance' || currentNav === 'metrics' || currentNav === 'create_metric' || currentNav === 'business_object_detail' || currentNav === 'semantics' || currentNav === 'data_standards';

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
            onClick={() => onSelectNav && onSelectNav('marketplace')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentNav === 'marketplace' || currentNav === 'marketplace_resources' || currentNav === 'asset_detail' || currentNav === 'multi_resource_request' || currentNav === 'my_requests'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            数据服务超市
          </button>

          {/* 业务语义 (带二级菜单下拉) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setIsSemanticsDropdownOpen(!isSemanticsDropdownOpen);
              }}
              onMouseEnter={() => setIsSemanticsDropdownOpen(true)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                isSemanticsActive
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <span>业务语义</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSemanticsDropdownOpen ? 'rotate-180 text-[#2563EB]' : 'text-[#94A3B8]'}`} />
            </button>

            {/* Dropdown Menu Overlay matching Service Market Discover style */}
            {isSemanticsDropdownOpen && (
              <div 
                onMouseLeave={() => setIsSemanticsDropdownOpen(false)}
                className="absolute top-full left-0 mt-1 w-[320px] bg-white border border-[#E2E8F0] rounded-xl shadow-xl shadow-slate-900/10 p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
              >
                <div className="px-2.5 py-1.5 border-b border-[#F1F5F9] mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    业务语义中心
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] font-mono font-semibold">
                    语义驱动
                  </span>
                </div>

                <div className="space-y-1">
                  {/* 二级菜单 1: 业务对象 */}
                  <button
                    onClick={() => {
                      setIsSemanticsDropdownOpen(false);
                      onSelectNav && onSelectNav('governance');
                    }}
                    className={`w-full p-2.5 rounded-lg flex items-center space-x-3 transition-all text-left group cursor-pointer ${
                      currentNav === 'governance' || currentNav === 'business_object_detail'
                        ? 'bg-[#FFFBEB] border border-[#FDE68A]'
                        : 'hover:bg-[#FFFBEB]/60 hover:border-[#FDE68A]/60 border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0 group-hover:scale-105 transition-transform">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors">
                          业务对象
                        </span>
                        <span className="text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded-full border border-[#FDE68A]">
                          24 实体
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        自然人、企业、工单等业务概念建模与拓扑
                      </p>
                    </div>
                  </button>

                  {/* 二级菜单 2: 指标 */}
                  <button
                    onClick={() => {
                      setIsSemanticsDropdownOpen(false);
                      onSelectNav && onSelectNav('metrics');
                    }}
                    className={`w-full p-2.5 rounded-lg flex items-center space-x-3 transition-all text-left group cursor-pointer ${
                      currentNav === 'metrics' || currentNav === 'create_metric' || currentNav === 'metric_detail'
                        ? 'bg-[#F5F3FF] border border-[#DDD6FE]'
                        : 'hover:bg-[#F5F3FF]/60 hover:border-[#DDD6FE]/60 border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] shrink-0 group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#7C3AED] transition-colors">
                          标准指标
                        </span>
                        <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.2 rounded-full border border-[#DDD6FE]">
                          92 指标
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        统一官方统计口径、指标注册与计算验证
                      </p>
                    </div>
                  </button>

                  {/* 二级菜单 3: 数据语义 */}
                  <button
                    onClick={() => {
                      setIsSemanticsDropdownOpen(false);
                      onSelectNav && onSelectNav('semantics');
                    }}
                    className={`w-full p-2.5 rounded-lg flex items-center space-x-3 transition-all text-left group cursor-pointer ${
                      currentNav === 'semantics'
                        ? 'bg-[#EFF6FF] border border-[#BFDBFE]'
                        : 'hover:bg-[#EFF6FF]/60 hover:border-[#BFDBFE]/60 border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                          数据语义理解
                        </span>
                        <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded-full border border-[#BFDBFE]">
                          AI 推理
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        表与字段级语义推导、实体识别与对齐
                      </p>
                    </div>
                  </button>

                  {/* 二级菜单 4: 数据标准 */}
                  <button
                    onClick={() => {
                      setIsSemanticsDropdownOpen(false);
                      onSelectNav && onSelectNav('data_standards');
                    }}
                    className={`w-full p-2.5 rounded-lg flex items-center space-x-3 transition-all text-left group cursor-pointer ${
                      currentNav === 'data_standards'
                        ? 'bg-[#ECFDF5] border border-[#A7F3D0]'
                        : 'hover:bg-[#ECFDF5]/60 hover:border-[#A7F3D0]/60 border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#059669] transition-colors">
                          数据标准
                        </span>
                        <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.2 rounded-full border border-[#A7F3D0]">
                          156 标准
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        数据元、值域字典与全域标准映射中心
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => alert('知识网络：查看实体拓扑、语义本体与知识图谱服务')}
            className="px-3 py-1.5 rounded-md hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            知识网络
          </button>

          <button
            onClick={() => onSelectNav && onSelectNav('access_review')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentNav === 'access_review' || currentNav === 'access_review_detail'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                : 'hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
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
