import React, { useState, useMemo } from 'react';
import { X, Search, Database, ArrowLeft, Key, ShieldCheck, Filter, AlertCircle } from 'lucide-react';
import { FindDataResource, FieldMetadata } from './model/FindDataTask';

interface RightWorkspaceFieldsProps {
  resource?: FindDataResource;
  fields?: FieldMetadata[];
  onClose: () => void;
  /** One-layer UI return only; it must not reconstruct an earlier task snapshot. */
  onBack?: () => void;
  backLabel?: string;
  returnContextMessage?: string;
  onViewLatestSolution?: () => void;
}

export const RightWorkspaceFields: React.FC<RightWorkspaceFieldsProps> = ({
  resource,
  fields,
  onClose,
  onBack,
  backLabel,
  returnContextMessage,
  onViewLatestSolution
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  const resourceName = resource?.name || '未知资源';
  const resourceDesc = resource?.desc || '暂无描述';

  // Group options derived from available fields
  const groups = useMemo(() => {
    if (!fields || fields.length === 0) return [];
    const set = new Set<string>();
    fields.forEach((f) => set.add(f.group));
    return Array.from(set);
  }, [fields]);

  const filteredFields = useMemo(() => {
    if (!fields) return [];
    return fields.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.goalRelation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGroup = selectedGroup === 'ALL' || f.group === selectedGroup;

      return matchSearch && matchGroup;
    });
  }, [fields, searchTerm, selectedGroup]);

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight break-words" tabIndex={-1}>
                字段检视 · {resourceName}
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#F1F5F9] text-[#64748B] rounded border border-[#E2E8F0] font-mono shrink-0">
                {fields?.length || 0} 字段
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">{resourceDesc}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="关闭字段检视"
          className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="关闭工作区"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {returnContextMessage && (
        <div className="mx-4 mt-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs leading-relaxed text-[#92400E]" role="status">
          {returnContextMessage}
          {onViewLatestSolution && (
            <button type="button" onClick={onViewLatestSolution} className="ml-2 font-semibold text-[#2563EB] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]">
              查看最新方案
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索字段名、业务含义或口径…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB] text-[#0F172A] placeholder-[#94A3B8]"
          />
        </div>

        {groups.length > 0 && (
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar shrink-0">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                selectedGroup === 'ALL'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-2xs'
                  : 'bg-white text-[#64748B] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
              }`}
            >
              全部 ({fields?.length || 0})
            </button>
            {groups.map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGroup === grp
                    ? 'bg-[#2563EB] text-white font-semibold shadow-2xs'
                    : 'bg-white text-[#64748B] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-xs">
        {!fields || fields.length === 0 ? (
          // AC-06, AC-07: Credible empty state when no fields registered
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#334155]">
                当前资源尚未登记可展示的字段元数据。
              </h4>
              <p className="text-xs text-[#94A3B8] max-w-sm leading-relaxed">
                该资源属于高阶机构名录或外部汇聚数据，未在此版本开通物理字段元数据字典。
              </p>
            </div>
            {onBack && backLabel && (
              <button
                onClick={onBack}
                className="mt-2 px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {backLabel}
              </button>
            )}
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="py-12 text-center text-[#94A3B8] text-xs">
            未找到匹配的字段。
          </div>
        ) : (
          <div className="border border-[#E2E8F0] rounded-xl overflow-x-auto shadow-2xs">
            <table className="min-w-[720px] w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#475569]">
                  <th className="py-2.5 px-3 font-semibold w-8">#</th>
                  <th className="py-2.5 px-3 font-semibold">物理字段名</th>
                  <th className="py-2.5 px-3 font-semibold">业务名称</th>
                  <th className="py-2.5 px-3 font-semibold">数据类型</th>
                  <th className="py-2.5 px-3 font-semibold">业务分组</th>
                  <th className="py-2.5 px-3 font-semibold">分析目标相关性说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredFields.map((f, idx) => (
                  <tr key={f.name} className="hover:bg-[#F8FAFC]/60 transition-colors">
                    <td className="py-2.5 px-3 text-[#94A3B8] font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F172A]">
                      <div className="flex items-center space-x-1">
                        {f.isKey && <Key className="w-3 h-3 text-[#EAB308] shrink-0" />}
                        <span>{f.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#334155] font-medium">
                      {f.businessName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B]">
                      {f.type}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] font-medium border border-[#E2E8F0]">
                        {f.group}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#475569] text-[11px] leading-relaxed">
                      {f.goalRelation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <div className="text-[11px] text-[#64748B]">
          当前显示 {filteredFields.length} / {fields?.length || 0} 个字段
        </div>
        {onBack && backLabel && (
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer"
          >
            {backLabel}
          </button>
        )}
      </div>
    </div>
  );
};
