import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Grid,
  X,
  Bot,
  ListTodo,
  BookOpen,
  ShoppingBag,
  ShieldCheck,
  Cpu,
  Settings,
  ChevronRight,
  Command,
  Sparkles,
  Layers,
  Search,
  CheckCircle2
} from 'lucide-react';

interface EnterpriseLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleKey: string, moduleName: string) => void;
  currentModule?: string;
}

export const EnterpriseLauncher: React.FC<EnterpriseLauncherProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  currentModule = 'xino_partner'
}) => {
  // Global keyboard shortcuts (Cmd+K / Ctrl+K or ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger launcher close/open handled in parent or here
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-start p-4 md:p-6 lg:p-8 overflow-y-auto">
          {/* Blur & Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm transition-all"
          />

          {/* Launcher Main Floating Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative z-10 w-full max-w-[580px] bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-900/15 overflow-hidden my-auto sm:my-0 flex flex-col"
            style={{ maxHeight: 'calc(100vh - 48px)' }}
          >
            {/* Top Header Region */}
            <div className="px-5 pt-4 pb-3.5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] shadow-2xs mt-0.5">
                  <Grid className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">应用中心</h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-[#4F46E5] border border-indigo-200/60">
                      全量模块
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">
                    一键切换工作空间与企业 AI 能力
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="关闭 (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Main Content Sections */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {/* Group A: 我的工作 */}
              <div>
                <div className="flex items-baseline mb-2">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wide">我的工作</h3>
                  <span className="text-[11px] text-slate-400 ml-2 font-normal">
                    面向日常高频任务与 AI 协作入口
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Card 1: Xino 智能伙伴 */}
                  <div
                    onClick={() => {
                      onSelectModule('xino_partner', 'Xino 智能伙伴');
                      onClose();
                    }}
                    className={`group relative p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      currentModule === 'xino_partner'
                        ? 'border-[#6366F1] bg-gradient-to-b from-[#F5F3FF] via-indigo-50/20 to-white ring-1 ring-[#6366F1]/30 shadow-xs'
                        : 'border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-2xs">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#4F46E5] text-white">
                          当前
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#4F46E5] transition-colors">
                        Xino 智能伙伴
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        面向企业员工的 AI 工作入口
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        通过自然语言发起任务、找数问数、分析问题与获取结果
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-2.5 pt-1.5 border-t border-indigo-100/60">
                      <ChevronRight className="w-3.5 h-3.5 text-[#4F46E5] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Card 2: 任务中心 */}
                  <div
                    onClick={() => {
                      onSelectModule('task_center', '任务中心');
                      onClose();
                    }}
                    className="group relative p-3 rounded-lg border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-2xs">
                          <ListTodo className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white">
                          14
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#4F46E5] transition-colors">
                        任务中心
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        管理 AI 任务生命周期与待处理事项
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        查看待我处理、我的任务、团队任务与执行状态
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-2.5 pt-1.5 border-t border-slate-100">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Group B: 企业智能能力 */}
              <div>
                <div className="flex items-baseline mb-2">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wide">企业智能能力</h3>
                  <span className="text-[11px] text-slate-400 ml-2 font-normal">
                    面向专业用户的语义、数据与智能体能力
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Card B1: 业务语义 */}
                  <div
                    onClick={() => {
                      onSelectModule('business_semantics', '业务语义');
                      onClose();
                    }}
                    className="group p-3 rounded-lg border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-md bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 mb-2">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                        业务语义
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        构建企业业务理解、本体与知识模型
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        业务本体 · 企业知识库 · 业务术语
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-2.5 pt-1.5 border-t border-slate-100">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Card B2: 数据服务超市 */}
                  <div
                    onClick={() => {
                      onSelectModule('data_market', '数据服务超市');
                      onClose();
                    }}
                    className="group p-3 rounded-lg border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-md bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 mb-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        数据服务超市
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        发现、浏览和消费可信数据服务
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        数据资源 · 数据产品 · 指标服务
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-2.5 pt-1.5 border-t border-slate-100">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Card B3: 数据治理 */}
                  <div
                    onClick={() => {
                      onSelectModule('data_governance', '数据治理');
                      onClose();
                    }}
                    className="group p-3 rounded-lg border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 mb-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        数据治理
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        保障数据连接、探查、质量与可信基础
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        数据接入 · 质量 · 血缘 · 标准 · 逻辑视图
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-2.5 pt-1.5 border-t border-slate-100">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Card B4: 智能体中心 */}
                  <div
                    onClick={() => {
                      onSelectModule('agent_center', '智能体中心');
                      onClose();
                    }}
                    className="group p-3 rounded-lg border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-md bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-[#4F46E5] mb-2">
                        <Cpu className="w-4 h-4 text-[#4F46E5]" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#4F46E5] transition-colors">
                        智能体中心
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        构建、配置、评估和发布企业智能体
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        智能体 · Skill · 工具 · 运行洞察
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-2.5 pt-1.5 border-t border-slate-100">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Group C: 平台管理 */}
              <div>
                <div className="flex items-baseline mb-2">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wide">平台管理</h3>
                  <span className="text-[11px] text-slate-400 ml-2 font-normal">
                    面向管理员的平台治理与资源控制入口
                  </span>
                </div>

                <div
                  onClick={() => {
                    onSelectModule('admin_center', '管理中心');
                    onClose();
                  }}
                  className="group p-3 rounded-lg border border-slate-200/90 bg-white hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                        <Settings className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-slate-900 transition-colors">
                            管理中心
                          </h4>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            管理员
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                          平台组织、权限、资源与运行管理入口
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          组织与身份 · 权限访问 · 模型资源 · 审计与诊断
                        </p>
                      </div>
                    </div>

                    <div className="self-end">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Region */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <Command className="w-3.5 h-3.5 text-slate-400" />
                <span>按下 <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700 shadow-2xs">Cmd + K</kbd> 可搜索全部功能</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>关闭</span>
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700 shadow-2xs">ESC</kbd>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
