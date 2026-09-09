import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  ChevronDown,
  X
} from 'lucide-react';
import {
  BusinessObjectItem,
  INITIAL_BUSINESS_OBJECTS,
  DOMAIN_OPTIONS,
  STATUS_OPTIONS,
  DATA_SUPPORT_OPTIONS
} from '../data/businessObjectsData';

interface BusinessObjectsListWorkspaceProps {
  onNavigateToBusinessObjectDetail: (objectId: string, initialTab?: 'business' | 'data_support') => void;
  onNavigateToCreateBusinessObject: () => void;
  onNavigateToChangeBusinessObject?: (objectId: string) => void;
  addToast?: (type: 'info' | 'success' | 'warning' | 'error', title: string, message?: string) => void;
}

export const BusinessObjectsListWorkspace: React.FC<BusinessObjectsListWorkspaceProps> = ({
  onNavigateToBusinessObjectDetail,
  onNavigateToCreateBusinessObject,
  onNavigateToChangeBusinessObject,
  addToast
}) => {
  // Search and filter states (defaults per specification: search empty, filters "All")
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('全部业务域');
  const [selectedStatus, setSelectedStatus] = useState<string>('全部状态');
  const [selectedDataSupport, setSelectedDataSupport] = useState<string>('全部');

  // Active row dropdown for the narrow "···" action
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter logic
  const filteredObjects = useMemo(() => {
    return INITIAL_BUSINESS_OBJECTS.filter((obj) => {
      // 1. Search Query (Object name, aliases, or definition)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = obj.name.toLowerCase().includes(query);
        const matchesAliases = obj.aliases.some((a) => a.toLowerCase().includes(query));
        const matchesDef = obj.definition.toLowerCase().includes(query);
        if (!matchesName && !matchesAliases && !matchesDef) {
          return false;
        }
      }

      // 2. Domain Filter
      if (selectedDomain !== '全部业务域' && obj.domain !== selectedDomain) {
        return false;
      }

      // 3. Status Filter (已发布, 草稿, 已停用)
      if (selectedStatus !== '全部状态' && obj.status !== selectedStatus) {
        return false;
      }

      // 4. Data Support Filter (筛选依据为当前正式生效的数据实现)
      if (selectedDataSupport === '有数据实现' && !obj.dataSupport.hasImplementation) {
        return false;
      }
      if (selectedDataSupport === '暂无数据实现' && obj.dataSupport.hasImplementation) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedDomain, selectedStatus, selectedDataSupport]);

  const handleCopyId = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setActiveMenuId(null);
    addToast?.('success', '已复制对象标识', `对象标识：${id}`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-[#1E293B] font-sans antialiased min-h-full flex flex-col">
      <div className="w-full max-w-[1440px] mx-auto px-6 py-6 lg:px-8 space-y-5 flex-1 flex flex-col">
        
        {/* ========================================================= */}
        {/* 1. PAGE HEADER                                            */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb */}
            <div className="text-xs text-[#64748B] flex items-center space-x-1.5">
              <span>业务语义</span>
              <span>/</span>
              <span className="text-[#334155] font-medium">业务对象</span>
            </div>

            {/* Title & English Subtitle */}
            <div className="flex items-baseline space-x-3">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                业务对象
              </h1>
              <span className="text-sm text-[#94A3B8] font-normal">
                Business Objects
              </span>
            </div>

            {/* Page Description */}
            <p className="text-xs text-[#64748B] leading-relaxed">
              统一查看企业业务主体、关键关系与真实数据实现。
            </p>
          </div>

          {/* Right Action: Create Business Object (Single Primary Action) */}
          <div className="shrink-0">
            <button
              id="btn-create-business-object"
              onClick={onNavigateToCreateBusinessObject}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>新建业务对象</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SEARCH & FILTER TOOLBAR                                */}
        {/* ========================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          {/* Left: Wide Search Input */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="input-search-business-objects"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索业务对象、别名或业务定义"
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#94A3B8] hover:text-[#475569] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Filters (Domain, Status, Data Support) */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#475569]">
            {/* 业务域 */}
            <div className="relative inline-flex items-center">
              <span className="text-[#64748B] mr-1.5 shrink-0">业务域：</span>
              <select
                id="select-domain-filter"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="appearance-none bg-white border border-[#CBD5E1] rounded-md pl-2.5 pr-7 py-1.5 text-xs text-[#1E293B] hover:border-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] cursor-pointer"
              >
                {DOMAIN_OPTIONS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 pointer-events-none" />
            </div>

            {/* 状态 */}
            <div className="relative inline-flex items-center">
              <span className="text-[#64748B] mr-1.5 shrink-0">状态：</span>
              <select
                id="select-status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-white border border-[#CBD5E1] rounded-md pl-2.5 pr-7 py-1.5 text-xs text-[#1E293B] hover:border-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] cursor-pointer"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 pointer-events-none" />
            </div>

            {/* 数据实现 */}
            <div className="relative inline-flex items-center">
              <span className="text-[#64748B] mr-1.5 shrink-0">数据实现：</span>
              <select
                id="select-data-support-filter"
                value={selectedDataSupport}
                onChange={(e) => setSelectedDataSupport(e.target.value)}
                className="appearance-none bg-white border border-[#CBD5E1] rounded-md pl-2.5 pr-7 py-1.5 text-xs text-[#1E293B] hover:border-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] cursor-pointer"
              >
                {DATA_SUPPORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 pointer-events-none" />
            </div>

            {/* Reset Filters button if any filter is active */}
            {(searchQuery || selectedDomain !== '全部业务域' || selectedStatus !== '全部状态' || selectedDataSupport !== '全部') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDomain('全部业务域');
                  setSelectedStatus('全部状态');
                  setSelectedDataSupport('全部');
                }}
                className="text-xs text-[#64748B] hover:text-[#2563EB] hover:underline cursor-pointer ml-1"
              >
                重置筛选
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. MAIN TABLE (The sole primary content container)        */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E2E8F0] rounded-md shadow-2xs overflow-visible flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569]">
                  <th className="py-3 px-4 w-[190px] whitespace-nowrap">业务对象</th>
                  <th className="py-3 px-4 min-w-[240px]">业务定义</th>
                  <th className="py-3 px-4 w-[110px] whitespace-nowrap">业务域</th>
                  <th className="py-3 px-4 w-[280px]">关键关系</th>
                  <th className="py-3 px-4 w-[240px]">数据支撑</th>
                  <th className="py-3 px-4 w-[96px] whitespace-nowrap">状态</th>
                  <th className="py-3 px-4 w-[110px] whitespace-nowrap">最近更新</th>
                  <th className="py-3 px-2 w-[40px] text-center"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredObjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#64748B]">
                      未检索到匹配的业务对象，请调整搜索词或筛选条件。
                    </td>
                  </tr>
                ) : (
                  filteredObjects.map((obj) => (
                    <tr
                      key={obj.id}
                      className="hover:bg-[#F8FAFC]/80 transition-colors h-[78px]"
                    >
                      {/* 1. 业务对象 */}
                      <td className="py-3 px-4 align-middle">
                        <div className="space-y-0.5">
                          <button
                            id={`bo-name-${obj.id}`}
                            onClick={() => onNavigateToBusinessObjectDetail(obj.id, 'business')}
                            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer transition-colors text-left block"
                          >
                            {obj.name}
                          </button>
                          <div className="text-[11px] text-[#64748B] leading-tight truncate max-w-[170px]">
                            别名：{obj.aliases.join(' · ')}
                          </div>
                        </div>
                      </td>

                      {/* 2. 业务定义 */}
                      <td className="py-3 px-4 align-middle">
                        <p className="text-xs text-[#334155] line-clamp-2 leading-relaxed max-w-[420px]">
                          {obj.definition}
                        </p>
                      </td>

                      {/* 3. 业务域 */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className="text-xs text-[#475569]">
                          {obj.domain}
                        </span>
                      </td>

                      {/* 4. 关键关系 */}
                      <td className="py-3 px-4 align-middle">
                        <div className="text-xs text-[#334155] leading-relaxed flex flex-wrap items-center gap-x-1 gap-y-0.5">
                          {obj.relationships.map((rel, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-[#94A3B8]">；</span>}
                              <span className="text-[#64748B]">{rel.name}</span>
                              <span className="text-[#94A3B8]">→</span>
                              <button
                                onClick={() => onNavigateToBusinessObjectDetail(rel.targetId, 'business')}
                                className="text-[#334155] hover:text-[#2563EB] hover:underline font-medium cursor-pointer transition-colors"
                              >
                                {rel.targetName}
                              </button>
                            </React.Fragment>
                          ))}
                          {obj.moreRelationshipsCount && obj.moreRelationshipsCount > 0 && (
                            <span
                              onClick={() => onNavigateToBusinessObjectDetail(obj.id, 'business')}
                              className="text-[#64748B] hover:text-[#2563EB] hover:underline cursor-pointer text-xs ml-0.5"
                              title="点击查看详情中的全部关系"
                            >
                              ；+{obj.moreRelationshipsCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. 数据支撑 */}
                      <td className="py-3 px-4 align-middle">
                        {obj.dataSupport.hasImplementation ? (
                          <div className="space-y-0.5">
                            <button
                              id={`bo-data-support-${obj.id}`}
                              onClick={() => onNavigateToBusinessObjectDetail(obj.id, 'data_support')}
                              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer font-medium block transition-colors"
                            >
                              {obj.dataSupport.implementationCount} 个数据实现
                            </button>
                            {obj.dataSupport.mainAsset && (
                              <div
                                className="text-[11px] text-[#64748B] truncate max-w-[220px]"
                                title={obj.dataSupport.mainAsset}
                              >
                                主要：{obj.dataSupport.mainAsset}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-[#94A3B8]">
                            暂无确认的数据实现
                          </div>
                        )}
                      </td>

                      {/* 6. 状态 */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        {obj.status === '已发布' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                            已发布
                          </span>
                        ) : obj.status === '草稿' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                            草稿
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                            已停用
                          </span>
                        )}
                      </td>

                      {/* 7. 最近更新 */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className="text-xs text-[#64748B] font-mono">
                          {obj.updatedAt}
                        </span>
                      </td>

                      {/* 8. 行末极窄“···”菜单 */}
                      <td className="py-3 px-2 align-middle text-center relative">
                        <button
                          id={`btn-menu-${obj.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === obj.id ? null : obj.id);
                          }}
                          className="w-7 h-7 rounded hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#334155] inline-flex items-center justify-center transition-colors cursor-pointer"
                          title="操作"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Narrow Action Popover */}
                        {activeMenuId === obj.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-2 top-11 z-30 w-36 bg-white border border-[#E2E8F0] rounded-md shadow-md py-1 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onNavigateToBusinessObjectDetail(obj.id, 'business');
                              }}
                              className="w-full px-3 py-1.5 text-left text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB] cursor-pointer"
                            >
                              查看业务视角
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onNavigateToBusinessObjectDetail(obj.id, 'data_support');
                              }}
                              className="w-full px-3 py-1.5 text-left text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB] cursor-pointer"
                            >
                              查看数据支撑
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                if (onNavigateToChangeBusinessObject) {
                                  onNavigateToChangeBusinessObject(obj.id);
                                }
                              }}
                              className="w-full px-3 py-1.5 text-left text-[#2563EB] hover:bg-[#EFF6FF] font-medium cursor-pointer"
                            >
                              修改业务对象
                            </button>
                            <div className="border-t border-[#F1F5F9] my-0.5" />
                            <button
                              onClick={(e) => handleCopyId(e, obj.id, obj.name)}
                              className="w-full px-3 py-1.5 text-left text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#334155] cursor-pointer"
                            >
                              复制对象标识
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ======================================================= */}
          {/* 4. LIGHTWEIGHT PAGINATION & SUMMARY                     */}
          {/* ======================================================= */}
          <div className="px-4 py-3 border-t border-[#E2E8F0] bg-[#FAFCFF] flex items-center justify-between text-xs text-[#64748B]">
            <div>
              共 <span className="font-semibold text-[#1E293B]">{filteredObjects.length}</span> 个业务对象
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[#64748B]">第 1 / 1 页</span>
              <div className="inline-flex items-center space-x-1">
                <button
                  disabled
                  className="px-2 py-1 rounded border border-[#E2E8F0] bg-white text-[#CBD5E1] cursor-not-allowed text-xs"
                >
                  上一页
                </button>
                <button
                  disabled
                  className="px-2 py-1 rounded border border-[#E2E8F0] bg-white text-[#CBD5E1] cursor-not-allowed text-xs"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
