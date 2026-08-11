import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Settings,
  Bell,
  MessageSquare,
  Shield,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Check,
  Grid,
  X,
  ExternalLink,
  Sparkles,
  Sliders,
  Inbox
} from 'lucide-react';

interface PersonalCenterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userAccount?: string;
  roleName?: string;
  onNavigateSettings?: () => void;
  onLogout?: () => void;
}

export const PersonalCenterPanel: React.FC<PersonalCenterPanelProps> = ({
  isOpen,
  onClose,
  userName = 'Admin User',
  userAccount = '13800138000',
  roleName = '平台超级管理员',
  onNavigateSettings,
  onLogout
}) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex justify-end p-4 md:p-6">
          {/* Subtle Dim Backdrop for click-away */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/15 backdrop-blur-[2px] pointer-events-auto"
          />

          {/* Personal Center Floating Drawer / Card Panel (350px) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, x: 12, y: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, x: 10, y: -4 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className="relative pointer-events-auto w-[350px] bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-900/10 overflow-hidden my-1 flex flex-col z-10 self-start"
            style={{ maxHeight: 'calc(100vh - 32px)' }}
          >
            {/* 1. Top User Info Header */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border-b border-slate-100 relative">
              {/* Close icon */}
              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 w-6 h-6 rounded bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center space-x-3">
                {/* Avatar Badge */}
                <div className="relative">
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-lg flex items-center justify-center shadow-xs ring-1 ring-white">
                    <span>A</span>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate tracking-tight">
                      {userName}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono font-medium tracking-tight mt-0.5">
                    {userAccount}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-[10px] text-slate-400 font-normal">有效角色:</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-[#4F46E5] border border-indigo-200/60">
                      {roleName}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Personal Action Entry Button */}
              <button
                onClick={onNavigateSettings || onClose}
                className="w-full mt-3.5 py-1.5 px-3 bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-[#4F46E5] border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#4F46E5] transition-colors" />
                  <span>个人中心与设置</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Scrollable Middle Content */}
            <div className="p-3.5 space-y-3 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
              {/* 3. 消息与待办区 */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Bell className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">消息与待办通知</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                    暂无待办
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded text-[11px] text-slate-500 flex items-center space-x-2">
                  <Inbox className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">当前没有未处理的操作提醒或任务通知</span>
                </div>
              </div>

              {/* 4. 我的服务区 */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 mb-2 px-0.5">我的服务</h4>
                <div className="space-y-1">
                  {/* Service 1: 消息频道 */}
                  <div className="p-1.5 hover:bg-slate-50 rounded-md transition-colors flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                        <MessageSquare className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-[#4F46E5] transition-colors">
                          消息频道
                        </div>
                        <div className="text-[10px] text-slate-400">系统通知与团队协作通道</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Service 2: 系统管理 */}
                  <div className="p-1.5 hover:bg-slate-50 rounded-md transition-colors flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Shield className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          系统管理
                        </div>
                        <div className="text-[10px] text-slate-400">组织权限与安全审计配置</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Service 3: 我的服务 */}
                  <div className="p-1.5 hover:bg-slate-50 rounded-md transition-colors flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Grid className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">
                          我的服务
                        </div>
                        <div className="text-[10px] text-slate-400">已订阅数据 API 与 AI 服务</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>

              {/* 5. 界面外观区 */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-800">界面外观</span>
                  </div>

                  {/* Segmented Control: 浅色 vs 深色 */}
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200/80">
                    <button
                      onClick={() => setThemeMode('light')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        themeMode === 'light'
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>浅色</span>
                    </button>
                    <button
                      onClick={() => setThemeMode('dark')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        themeMode === 'dark'
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Moon className="w-3 h-3 text-indigo-400" />
                      <span>深色</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Bottom Logout Button */}
            <div className="p-3 bg-white border-t border-slate-100">
              <button
                onClick={onLogout || onClose}
                className="w-full py-2 px-3 rounded-lg bg-red-50/70 hover:bg-red-100/80 text-red-600 border border-red-200/60 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer group shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                <span>退出登录</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
