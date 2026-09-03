import React, { useState } from 'react';
import { X, Search, Filter, Database, Check, ShieldCheck, Info } from 'lucide-react';
import { R03_FIELDS } from './FindDataMockData';

interface RightWorkspaceFieldsProps {
  onClose: () => void;
  resourceName?: string;
}

export const RightWorkspaceFields: React.FC<RightWorkspaceFieldsProps> = ({
  onClose,
  resourceName = '常住人口月度快照'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const groups = [
    { key: 'all', label: '全部分组', count: R03_FIELDS.length },
    { key: '主体标识与时间', label: '主体标识与时间', count: 2 },
    { key: '空间区划与归属', label: '空间区划与归属', count: 3 },
    { key: '人员与老龄属性', label: '人员与老龄属性', count: 8 },
    { key: '治理与有效周期', label: '治理与有效周期', count: 5 }
  ];

  const filteredFields = R03_FIELDS.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || f.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200 select-none">
      {/* Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">{resourceName}</h3>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] font-medium rounded">
                18 个字段
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">资源详情 · 字段定义与元数据属性</p>
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

      {/* Safety Notice Banner */}
      <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs text-[#475569]">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>安全元数据展示：严格遵循脱敏与数据合规标准，仅展示字段技术定义与业务语义，无个人样本值。</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2.5 bg-white">
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索字段名、业务名…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#1E293B]"
          />
        </div>

        {/* Group Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs custom-scrollbar">
          {groups.map((grp) => (
            <button
              key={grp.key}
              onClick={() => setSelectedGroup(grp.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedGroup === grp.key
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              {grp.label} ({grp.count})
            </button>
          ))}
        </div>
      </div>

      {/* Fields Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold sticky top-0 z-10">
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4 w-44">技术字段名</th>
              <th className="py-2.5 px-4 w-36">业务名称</th>
              <th className="py-2.5 px-3 w-28">数据类型</th>
              <th className="py-2.5 px-3 w-32">业务分组</th>
              <th className="py-2.5 px-4">字段角色与目标关系</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filteredFields.map((field, idx) => (
              <tr key={field.name} className="hover:bg-[#F8FAFC]/80 transition-colors">
                <td className="py-2.5 px-4 text-center font-mono text-[11px] text-[#94A3B8]">
                  {idx + 1}
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs font-semibold text-[#0F172A]">{field.name}</span>
                    {field.isKey && (
                      <span className="px-1 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[9px] font-bold rounded border border-[#BFDBFE]">
                        KEY
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-4 font-medium text-[#1E293B]">
                  {field.businessName}
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B]">
                  {field.type}
                </td>
                <td className="py-2.5 px-3">
                  <span className="inline-block px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded">
                    {field.group}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="space-y-0.5">
                    <div className="text-[#334155] font-medium text-[11px]">{field.role}</div>
                    <div className="text-[10px] text-[#64748B] flex items-center space-x-1">
                      <span className="text-[#2563EB]">↳</span>
                      <span>{field.goalRelation}</span>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFields.length === 0 && (
          <div className="p-8 text-center text-xs text-[#94A3B8]">
            没有匹配的字段
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#64748B] shrink-0">
        <div>
          显示 {filteredFields.length} / {R03_FIELDS.length} 个字段
        </div>
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>元数据已校验 · 适合下钻分析</span>
        </div>
      </div>
    </div>
  );
};
