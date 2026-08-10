import React from 'react';
import { 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Key, 
  UserCheck, 
  Clock, 
  BarChart2, 
  Tag, 
  FolderTree, 
  Layers,
  Sparkles
} from 'lucide-react';

interface LeftTableContextPanelProps {
  tableName?: string;
  businessName?: string;
}

export const LeftTableContextPanel: React.FC<LeftTableContextPanelProps> = ({
  tableName = 'pop_service_hotline',
  businessName = '公共服务热线工单记录表',
}) => {
  return (
    <aside className="w-full lg:w-[280px] bg-white border-r border-[#E2E8F0] flex flex-col h-full shrink-0 overflow-y-auto p-3.5 space-y-3.5 shadow-2xs">
      {/* Panel Section Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-[#4F46E5]" />
          <h2 className="text-xs font-bold text-[#1E293B]">数据资产</h2>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#4F46E5] font-semibold border border-[#4F46E5]/20">
          TABLE ASSET
        </span>
      </div>

      {/* Main Asset Card */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3 space-y-2">
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <div className="font-mono text-xs font-bold text-[#1E293B] break-all">
              {tableName}
            </div>
            <div className="text-xs font-semibold text-[#312E81] mt-0.5">
              {businessName}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-1 border-t border-[#E2E8F0]/80 text-[10px]">
          <span className="px-1.5 py-0.2 rounded font-medium bg-[#ECFDF5] text-[#059669] border border-[#059669]/30 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
            <span>AI理解完成</span>
          </span>
          <span className="px-1.5 py-0.2 rounded font-semibold bg-[#EEF2FF] text-[#4F46E5] border border-[#4F46E5]/30">
            高可信
          </span>
        </div>
      </div>

      {/* Basic Info Section */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-[#1E293B] uppercase tracking-wider flex items-center space-x-1.5">
          <FolderTree className="w-3.5 h-3.5 text-[#64748B]" />
          <span>基础信息</span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-md p-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-[11px]">数据源</span>
            <span className="font-mono text-[11px] font-semibold text-[#1E293B]">population_mysql</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-[11px]">Schema</span>
            <span className="font-mono text-[11px] font-semibold text-[#1E293B]">service</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-[11px]">字段数量</span>
            <span className="font-mono text-[11px] font-bold text-[#4F46E5]">36 个字段</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-[11px]">更新时间</span>
            <span className="font-mono text-[11px] text-[#475569]">2026-08-10</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-[11px]">负责人</span>
            <span className="text-[11px] font-semibold text-[#1E293B]">民政数据中心</span>
          </div>
        </div>
      </div>

      {/* Business Attribution Section */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-[#1E293B] uppercase tracking-wider flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-[#64748B]" />
          <span>业务归属</span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-md p-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-[11px]">业务域</span>
            <span className="font-bold text-[#312E81] text-[11px] bg-[#EEF2FF] px-1.5 py-0.2 rounded border border-[#4F46E5]/20">
              公共服务
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-[11px]">主题</span>
            <span className="font-semibold text-[#1E293B] text-[11px]">群众诉求</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[#F1F5F9]">
            <span className="text-[#64748B] text-[11px]">业务对象候选</span>
            <span className="font-bold text-[#059669] text-[11px] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#059669]/20 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-[#059669]" />
              <span>服务工单</span>
            </span>
          </div>
        </div>
      </div>

      {/* Key Fields Summary Section */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-[#1E293B] uppercase tracking-wider flex items-center space-x-1.5">
            <Tag className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>关键字段摘要</span>
          </div>
          <span className="text-[10px] text-[#94A3B8]">按角色分组</span>
        </div>

        <div className="space-y-1.5 text-xs">
          {/* 1. 标识字段 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-semibold flex items-center space-x-1">
                <Key className="w-3 h-3 text-[#4F46E5]" />
                <span>标识字段</span>
              </span>
              <span className="font-mono font-bold text-[#1E293B]">ticket_id</span>
            </div>
            <div className="text-[#475569] text-[10px] pl-4">工单编号（唯一业务主码）</div>
          </div>

          {/* 2. 主体关联 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-semibold flex items-center space-x-1">
                <UserCheck className="w-3 h-3 text-[#059669]" />
                <span>主体关联</span>
              </span>
              <span className="font-mono font-bold text-[#1E293B]">person_id</span>
            </div>
            <div className="text-[#475569] text-[10px] pl-4">关联自然人人口库外键</div>
          </div>

          {/* 3. 状态字段 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-[#D97706]" />
                <span>状态字段</span>
              </span>
              <span className="font-mono font-bold text-[#1E293B]">status</span>
            </div>
            <div className="text-[#475569] text-[10px] pl-4">处理状态（受理/办理中/已办结）</div>
          </div>

          {/* 4. 时间字段 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-semibold flex items-center space-x-1">
                <Clock className="w-3 h-3 text-[#312E81]" />
                <span>时间字段</span>
              </span>
              <span className="font-mono text-[10px] font-bold text-[#1E293B]">created / close</span>
            </div>
            <div className="text-[#475569] text-[10px] pl-4 font-mono">created_time, close_time</div>
          </div>

          {/* 5. 度量字段 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-semibold flex items-center space-x-1">
                <BarChart2 className="w-3 h-3 text-[#4F46E5]" />
                <span>度量字段</span>
              </span>
              <span className="font-mono font-bold text-[#1E293B]">duration</span>
            </div>
            <div className="text-[#475569] text-[10px] pl-4">处理时长（分钟数值）</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
