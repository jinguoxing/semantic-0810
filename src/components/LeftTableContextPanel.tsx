import React from 'react';
import { Info } from 'lucide-react';

interface LeftTableContextPanelProps {
  tableName?: string;
  businessName?: string;
}

export const LeftTableContextPanel: React.FC<LeftTableContextPanelProps> = ({
  tableName = 'pop_service_hotline',
  businessName = '公共服务热线工单记录表',
}) => {
  return (
    <aside className="w-full lg:w-[280px] xl:w-[320px] bg-white border-r border-[#E2E8F0] flex flex-col h-full shrink-0 overflow-y-auto no-scrollbar p-4 space-y-4 text-xs select-none">
      {/* 组 1: 数据资产 */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
          数据资产
        </div>
        <h1 className="text-base font-bold text-[#0F172A] font-mono break-all leading-tight">
          {tableName}
        </h1>
        <p className="text-xs text-[#64748B] font-medium">{businessName}</p>
        
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
            TABLE ASSET
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            AI 理解完成
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            可信度：高
          </span>
        </div>
      </div>

      <div className="h-px bg-[#E2E8F0]" />

      {/* 组 2: 基础信息 */}
      <div className="space-y-2">
        <div className="font-bold text-[#0F172A] text-xs">基础信息</div>
        <div className="space-y-2 text-xs text-[#64748B]">
          <div className="flex items-center justify-between">
            <span>数据源：</span>
            <span className="font-mono text-[#0F172A] font-medium">population_mysql</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Schema：</span>
            <span className="font-mono text-[#0F172A] font-medium">service</span>
          </div>
          <div className="flex items-center justify-between">
            <span>字段数量：</span>
            <span className="text-[#0F172A] font-medium">36 个字段</span>
          </div>
          <div className="flex items-center justify-between">
            <span>更新时间：</span>
            <span className="font-mono text-[#0F172A] font-medium">2026-08-10</span>
          </div>
          <div className="flex items-center justify-between">
            <span>负责人：</span>
            <span className="text-[#0F172A] font-medium">民政数据中心</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#E2E8F0]" />

      {/* 组 3: 业务归属 */}
      <div className="space-y-2">
        <div className="font-bold text-[#0F172A] text-xs">业务归属</div>
        <div className="space-y-2 text-xs text-[#64748B]">
          <div className="flex items-center justify-between">
            <span>业务域：</span>
            <span className="text-[#0F172A] font-medium">公共服务</span>
          </div>
          <div className="flex items-center justify-between">
            <span>主题：</span>
            <span className="text-[#0F172A] font-medium">群众诉求</span>
          </div>
          <div className="flex items-center justify-between">
            <span>潜在业务对象：</span>
            <span className="text-[#0F172A] font-medium flex items-center space-x-1">
              <span>服务工单</span>
              <Info className="w-3 h-3 text-[#94A3B8]" />
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#E2E8F0]" />

      {/* 组 4: 关键字段摘要 */}
      <div className="space-y-2">
        <div className="font-bold text-[#0F172A] text-xs">关键字段摘要</div>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-start justify-between gap-1 border-b border-[#F1F5F9] pb-2">
            <span className="text-[#64748B] shrink-0 font-medium">标识字段：</span>
            <div className="text-right">
              <span className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A] font-medium text-[11px]">
                ticket_id
              </span>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">工单编号 / 唯一业务主键</div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-1 border-b border-[#F1F5F9] pb-2">
            <span className="text-[#64748B] shrink-0 font-medium">主体关联：</span>
            <div className="text-right">
              <span className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A] font-medium text-[11px]">
                person_id
              </span>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">关联自然人口库</div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-1 border-b border-[#F1F5F9] pb-2">
            <span className="text-[#64748B] shrink-0 font-medium">状态字段：</span>
            <div className="text-right">
              <span className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A] font-medium text-[11px]">
                status
              </span>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">处理状态</div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-1 border-b border-[#F1F5F9] pb-2">
            <span className="text-[#64748B] shrink-0 font-medium">时间字段：</span>
            <div className="text-right">
              <span className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A] font-medium text-[11px]">
                created_time, close_time
              </span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-1">
            <span className="text-[#64748B] shrink-0 font-medium">度量字段：</span>
            <div className="text-right">
              <span className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A] font-medium text-[11px]">
                duration
              </span>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">处理时长</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

