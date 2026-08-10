import React from 'react';
import { 
  Search, 
  RotateCw, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  User, 
  Layers,
  Bot
} from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onReanalyze: () => void;
  onBatchConfirm?: () => void;
  onPreviewPublish?: () => void;
  onViewLineage?: () => void;
  onEnterModeling?: () => void;
  batchCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onReanalyze,
  onBatchConfirm,
  onPreviewPublish,
  onViewLineage,
  onEnterModeling,
  batchCount = 0,
}) => {
  return (
    <header className="h-[64px] bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs shrink-0">
      {/* Left Branding & App Name */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold shadow-xs">
            <span className="text-lg font-mono tracking-tighter">S</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-[#1E293B] tracking-tight">Semovix</span>
            </div>
            <div className="text-[11px] text-[#64748B] flex items-center space-x-1.5 font-medium">
              <span>数据语义治理平台</span>
              <span className="text-[#CBD5E1]">|</span>
              <span className="inline-flex items-center space-x-1 text-[#4F46E5]">
                <Bot className="w-3 h-3" />
                <span>Xino｜犀诺</span>
              </span>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 ml-4 border-l border-[#E2E8F0] pl-6">
          <button className="px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md transition-colors flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>AI工作台</span>
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md transition-colors">
            <span>任务中心</span>
          </button>
          <button className="px-3 py-1.5 text-xs font-bold text-[#4F46E5] border-b-2 border-[#4F46E5] flex items-center space-x-1 bg-[#EEF2FF]/60 rounded-t-md">
            <span>语义治理</span>
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md transition-colors">
            <span>知识网络</span>
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md transition-colors">
            <span>管理中心</span>
          </button>
        </nav>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Global Search Bar */}
        <div className="relative hidden md:block w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="搜索语义标准/对象..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#1E293B] placeholder-[#94A3B8]"
          />
        </div>

        <div className="h-4 w-[1px] bg-[#E2E8F0] hidden sm:block" />

        {/* Action Buttons */}
        <button 
          onClick={onReanalyze}
          className="px-2.5 py-1 text-xs font-medium text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#4F46E5]/30 rounded-md transition-colors flex items-center space-x-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>重新分析</span>
        </button>

        <button 
          onClick={onViewLineage}
          className="px-2.5 py-1 text-xs font-medium text-[#475569] bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-md transition-colors flex items-center space-x-1"
        >
          <Layers className="w-3.5 h-3.5 text-[#64748B]" />
          <span>查看血缘</span>
        </button>

        <button 
          onClick={onEnterModeling}
          className="px-2.5 py-1 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-md transition-colors flex items-center space-x-1 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>进入对象建模</span>
        </button>

        <div className="h-4 w-[1px] bg-[#E2E8F0]" />

        {/* User Profile */}
        <div className="flex items-center space-x-2 pl-1 cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-[#E2E8F0] text-[#312E81] border border-[#CBD5E1] flex items-center justify-center font-bold text-xs">
            <User className="w-3.5 h-3.5 text-[#475569]" />
          </div>
        </div>
      </div>
    </header>
  );
};

