import React, { useState } from 'react';
import { X, Folder, ChevronRight, Database, ArrowLeft, Check, ShieldCheck, Info } from 'lucide-react';

interface RightWorkspaceCatalogProps {
  onClose: () => void;
  onReturnToAnalysis: () => void;
  onEvaluateAndAdd: (resourceName: string) => void;
  onViewFields: (resourceName: string) => void;
}

export const RightWorkspaceCatalog: React.FC<RightWorkspaceCatalogProps> = ({
  onClose,
  onReturnToAnalysis,
  onEvaluateAndAdd,
  onViewFields
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('养老机构基本信息');

  const catalogItems = [
    {
      id: 'r06',
      name: '养老机构基本信息',
      granularity: '一家机构一条记录',
      status: '可直接使用',
      statusType: 'allowed',
      desc: '登记在册的在营养老机构基础名录，含统一社会信用代码、机构名称、所在街镇、床位核定数与运营状态。',
      coverageRole: '可选下钻资源 · 解释某街镇床位提供机构'
    },
    {
      id: 'r07',
      name: '居家养老服务订单',
      granularity: '一次居家养老服务一条记录',
      status: '需申请',
      statusType: 'requestable',
      desc: '上门照护、助洁助餐等居家养老服务派单与完成记录。',
      coverageRole: '部分匹配 · 仅覆盖居家上门服务，不代表机构养老'
    }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">目录浏览 · 民政数据源</h3>
            <p className="text-[11px] text-[#64748B]">按业务域层级浏览底层数据资产与视图</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
          title="关闭工作区"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Persistent Retention Banner */}
      <div className="px-5 py-2.5 bg-[#EFF6FF]/60 border-b border-[#BFDBFE] flex items-center justify-between text-xs text-[#1E3A8A]">
        <div className="flex items-center space-x-2">
          <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="font-semibold">当前分析任务已保留</span>
          <span className="text-[#3B82F6]">（闵行区老年人口与养老床位供给水平分析）</span>
        </div>
        <button
          onClick={onReturnToAnalysis}
          className="text-[#2563EB] hover:underline text-xs font-semibold cursor-pointer"
        >
          返回当前分析
        </button>
      </div>

      {/* Directory Hierarchy Bar */}
      <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center space-x-1.5 text-xs text-[#64748B]">
        <span>民政数据源</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
        <span className="font-semibold text-[#0F172A]">养老服务</span>
      </div>

      {/* Main Catalog Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
        <div className="text-[11px] text-[#64748B]">
          当前目录下共有 2 项已上架数据资产（已排除无权限目录项）
        </div>

        <div className="space-y-3">
          {catalogItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedTable(item.name)}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                selectedTable === item.name
                  ? 'border-[#2563EB] bg-[#EFF6FF]/20 ring-1 ring-[#2563EB]/30 shadow-xs'
                  : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-bold text-xs text-[#0F172A]">{item.name}</span>
                    <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded">
                      {item.granularity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">{item.desc}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                  item.statusType === 'allowed'
                    ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]'
                    : 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]'
                }`}>
                  {item.status}
                </span>
              </div>

              <div className="text-[10px] text-[#64748B] bg-[#F8FAFC] p-2 rounded-lg border border-[#F1F5F9]">
                <span className="font-semibold text-[#334155]">角色定位：</span>{item.coverageRole}
              </div>

              {/* Action Buttons for table */}
              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewFields(item.name);
                    }}
                    className="px-2.5 py-1 text-[11px] text-[#475569] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded border border-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    查看字段
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`正在查看「${item.name}」资产详情与数据字典`);
                    }}
                    className="px-2.5 py-1 text-[11px] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded border border-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    查看表详情
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEvaluateAndAdd(item.name);
                  }}
                  className="px-3 py-1 text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg transition-colors cursor-pointer"
                >
                  评估并加入当前方案
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <button
          onClick={onReturnToAnalysis}
          className="px-4 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回当前分析</span>
        </button>
        <span className="text-[11px] text-[#94A3B8]">
          Find Data 目标与上下文保持锁定
        </span>
      </div>
    </div>
  );
};
